import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Weather } from '../../../domain/entities/Weather'
import type { Moment } from '../../../domain/entities/Moment'
import { FixtureStatus, MatchEventType, PlayerPosition } from '../../../domain/enums'
import { computeWeatherTacticInteraction } from '../../../domain/services/matchSimulator'
import { getTacticModifiers, FORMATION_523_EXTRA_FITNESS_COST } from '../../../domain/services/tacticModifiers'
import { developPlayers } from '../../../domain/services/playerDevelopmentService'
import { mulberry32, fixtureSeed } from '../../../domain/utils/random'
import { generateInjuryEntry, generateReturnFromInjuryEntry } from '../../../domain/services/narrativeService'
import { generateInjuryNarrative } from '../../../domain/data/injuryStories'
import { PLAY_THROUGH_AFTERMATH } from '../../../domain/data/injuryDoctorText'
import {
  getEffectiveMode,
  BYGG_SEASON_FORM_RATE,
  BYGG_SEASON_FORM_CAP,
  BYGG_EXTRA_FITNESS_COST,
  BYGG_INJURY_MULT,
  TOPPA_SPIKE_RATE,
  TOPPA_DECAY_RATE,
  TOPPA_SPIKE_ROUNDS,
  TOPPA_EXTRA_SHARPNESS,
  TOPPA_EXTRA_FITNESS_REC,
  VILA_SEASON_FORM_DECAY,
  VILA_EXTRA_FITNESS_REC,
  VILA_SHARPNESS_PENALTY,
  RAMP_ROUNDS,
} from '../../../domain/services/periodisationService'
import { recoveryGain, FITNESS_RECOVERY_CEILING } from '../../../domain/services/fitnessRecoveryService'
import type { PeriodisationMode } from '../../../domain/services/periodisationService'
import { clamp } from '../../../domain/utils/clamp'
import { FATIGUE_AVAILABILITY_FLOOR } from '../../../domain/services/squadEvaluator'

export interface PlayerStateResult {
  updatedPlayers: Player[]
  newlyInjured: Array<{ player: Player; days: number }>
  newlySuspended: Array<{ player: Player }>
  /** Pool 1c: spelare vars spela-på-gambling avgjordes (eller kansellerades
   *  utan risk om de aldrig faktiskt startade matchen) denna runda. */
  playThroughResolutions: Array<{ player: Player; relapsed: boolean; aftermathLine: string }>
  /** A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md), ben 2: spelare som förlorade
   *  sannolikhetskastet om vila/överbelastning denna runda (startade under
   *  FATIGUE_AVAILABILITY_FLOOR). restGamesRemaining redan satt på player. */
  newlyRested: Array<{ player: Player }>
}

/**
 * A-H3 ben 2 — sannolikhet att "förlora" en spelare till vila/överbelastning
 * till NÄSTA match, om han startade DENNA match under
 * FATIGUE_AVAILABILITY_FLOOR (samma golv som ben 1 och HIGH2 delar).
 * Linjär ramp: 0% exakt vid golvet, REST_RISK_AT_ZERO_FITNESS vid 0% fitness.
 * Domen bad bara om kalibrering av ben 1:s skaderisk-tak (se
 * scripts/ah3-fatiguemult-kalibrering-2026-08-28.ts) — denna sannolikhet är
 * ett resonerat startvärde, inte mätt mot spelData. Playtest-justerbar.
 */
export const FATIGUE_RESTOUT_MAX_PROB = 0.5

export function restOutRiskProbability(fitness: number): number {
  if (fitness >= FATIGUE_AVAILABILITY_FLOOR) return 0
  const t = (FATIGUE_AVAILABILITY_FLOOR - Math.max(0, fitness)) / FATIGUE_AVAILABILITY_FLOOR
  return FATIGUE_RESTOUT_MAX_PROB * t
}

function getPlayerRating(playerId: string, fixtures: Fixture[]): number | null {
  for (const fixture of fixtures) {
    if (fixture.report?.playerRatings[playerId] !== undefined) {
      return fixture.report.playerRatings[playerId]
    }
  }
  return null
}

export function applyPlayerStateUpdates(
  players: Player[],
  startersThisRound: Set<string>,
  benchThisRound: Set<string>,
  game: SaveGame,
  managedTacticMods: ReturnType<typeof getTacticModifiers> | null,
  managedFixtureWeather: Weather | undefined,
  managedClubForTactic: Club | undefined,
  baseSeed: number,
  nextRound: number,
  simulatedFixtures: Fixture[],
  daysBetweenFixtures = 7,
): PlayerStateResult {
  const teamMode = (game.managedClubPeriodisation ?? 'hall') as PeriodisationMode
  const periodisationSince = game.managedClubPeriodisationSince ?? 0
  const currentMatchday = game.currentMatchday
  const localRand = mulberry32(baseSeed + 9999)

  // B9 (SLUTTEST_KO.md, Jacobs dom 2026-08-19): mittfältare kan inte välja bort
  // ett anfall som en ytterhalv kan (Liw), men fatigueRate idag är lagvis —
  // samma förlust oavsett position. matchCore.ts läser aldrig .fitness (grep
  // gav 0 träffar) så det här rör lagvalskalibrering (squadEvaluator), inte
  // matchmotorns RNG-ström — en annan, mindre känslig klass.
  // Normaliserat mot den FAKTISKA startelvans snitt per lag och match (inte
  // en global konstant) — lagets totala/genomsnittliga fitnessförlust per
  // match är oförändrad, bara omfördelad mellan positionerna.
  const POSITION_FATIGUE_MULT: Record<PlayerPosition, number> = {
    [PlayerPosition.Goalkeeper]: 1.0,
    [PlayerPosition.Defender]: 1.0,
    [PlayerPosition.Half]: 0.85,
    [PlayerPosition.Midfielder]: 1.15,
    [PlayerPosition.Forward]: 1.0,
  }
  const playersById = new Map(players.map(p => [p.id, p]))
  const positionFatigueNormMult = new Map<string, number>()
  for (const fixture of simulatedFixtures) {
    for (const lineup of [fixture.homeLineup, fixture.awayLineup]) {
      if (!lineup) continue
      const starters = lineup.startingPlayerIds
        .map(id => playersById.get(id))
        .filter((p): p is Player => !!p)
      if (starters.length === 0) continue
      const avgMult = starters.reduce((sum, p) => sum + POSITION_FATIGUE_MULT[p.position], 0) / starters.length
      if (avgMult <= 0) continue
      for (const p of starters) {
        positionFatigueNormMult.set(p.id, POSITION_FATIGUE_MULT[p.position] / avgMult)
      }
    }
  }

  // Player fitness / form / sharpness updates (start from training-updated players)
  const updatedPlayers = players.map(player => {
    let updated = { ...player }

    // ── Injury recovery (every round ≈ 7 days) ──────────────────────────
    if (updated.isInjured && updated.injuryDaysRemaining > 0) {
      updated.injuryDaysRemaining = Math.max(0, updated.injuryDaysRemaining - 7)
      if (updated.injuryDaysRemaining <= 0) {
        updated.isInjured = false
        updated.injuryDaysRemaining = 0
        updated.fitness = Math.max(30, updated.fitness - 15)
        updated.recentlyInjuredUntil = nextRound + RAMP_ROUNDS
        updated.injuryNarrative = undefined
        // Narrative: recovery entry for managed players
        if (player.clubId === game.managedClubId) {
          const recoveryEntry = generateReturnFromInjuryEntry(game.currentSeason, nextRound)
          updated.diary = [...(updated.diary ?? []), recoveryEntry].slice(-20)
        }
      }
    }

    // ── Suspension recovery (decrement every round for all suspended players) ──
    if (updated.suspensionGamesRemaining > 0) {
      updated.suspensionGamesRemaining = Math.max(0, updated.suspensionGamesRemaining - 1)
      if (updated.suspensionGamesRemaining === 0) {
        updated.suspensionCause = undefined
      }
    }

    // ── A-H3 ben 2: vila/överbelastning-återhämtning (decrementeras varje
    // runda, precis som suspensionGamesRemaining) — kostar exakt EN match. ──
    if ((updated.restGamesRemaining ?? 0) > 0) {
      updated.restGamesRemaining = Math.max(0, (updated.restGamesRemaining ?? 0) - 1)
    }

    // Periodisation — only for managed club players
    const isManaged = player.clubId === game.managedClubId
    const effectiveMode = isManaged ? getEffectiveMode(player, teamMode) : 'hall'
    const roundsInMode = currentMatchday - periodisationSince

    if (startersThisRound.has(player.id)) {
      // Reduce fitness 15-25
      const baseFitnessLoss = 15 + Math.floor(localRand() * 10)
      const tacticFatigue = managedTacticMods && isManaged
        ? managedTacticMods.fatigueRate
        : 1.0
      // Tactic × weather extra fatigue for managed players
      let weatherTacticFatigue = 1.0
      if (isManaged && managedFixtureWeather && managedClubForTactic) {
        const twi = computeWeatherTacticInteraction(managedFixtureWeather, managedClubForTactic.activeTactic)
        weatherTacticFatigue = 1.0 + twi.extraFatigue
      }
      const byggExtraCost = isManaged && effectiveMode === 'bygg' ? BYGG_EXTRA_FITNESS_COST : 0
      // DOM_FORMATIONER_V2_2026-09-04.md: 5-2-3 högs källbelagda konditions-
      // kostnad, utöver fatigueRate (som redan höjs +10% av heightMode:'high').
      // Startvärde konservativt — se FORMATION_523_EXTRA_FITNESS_COST.
      const formation523ExtraCost = isManaged && managedClubForTactic?.activeTactic.formation === '523_hog'
        ? FORMATION_523_EXTRA_FITNESS_COST
        : 0
      const positionFatigueMult = positionFatigueNormMult.get(player.id) ?? 1.0
      const fitnessLoss = Math.round(baseFitnessLoss * tacticFatigue * weatherTacticFatigue * positionFatigueMult) + byggExtraCost + formation523ExtraCost
      // A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md), rotorsak 2: matchkostnaden
      // är oförändrad — men veckan MELLAN matcherna ger nu tillbaka något även
      // åt den som spelade. Tidigare var en startares omgång rent −15..−25,
      // vilket gjorde trupploopen strukturellt negativ oavsett truppstorlek.
      const afterMatchCost = Math.max(0, updated.fitness - fitnessLoss)
      updated.fitness = Math.min(
        FITNESS_RECOVERY_CEILING,
        afterMatchCost + recoveryGain(afterMatchCost, 'started', {
          stamina: player.attributes?.stamina,
          daysBetweenFixtures,
        }),
      )

      // Form update based on match rating
      const rating = getPlayerRating(player.id, simulatedFixtures)
      if (rating !== null) {
        if (rating >= 7) updated.form = Math.min(100, updated.form + 3)
        else if (rating <= 5) updated.form = Math.max(0, updated.form - 3)
        else updated.form = Math.min(100, updated.form + 1)
      }

      // Sharpness increases
      let sharpnessGain = 10
      if (isManaged && effectiveMode === 'toppa') sharpnessGain += TOPPA_EXTRA_SHARPNESS
      updated.sharpness = Math.min(100, updated.sharpness + sharpnessGain)

    } else if (benchThisRound.has(player.id)) {
      // A3, rotorsak 1: `seasonForm + SLACK` var en KLAMP på råvärdet, inte ett
      // återhämtningstak — en bänkspelare ÖVER klampen drogs NER av att sitta på
      // bänken. Taket lever kvar där det hör hemma: på EFFEKTEN, i playerModifier
      // (squadEvaluator.ts:42), som är SKYDDAT i domen och orört.
      updated.fitness = Math.min(
        FITNESS_RECOVERY_CEILING,
        updated.fitness + recoveryGain(updated.fitness, 'bench', {
          stamina: player.attributes?.stamina,
          daysBetweenFixtures,
        }),
      )
      updated.sharpness = Math.max(0, updated.sharpness - 5)
    } else {
      // Did not play — proportionell, kalenderskalad återhämtning (A3).
      // Periodiseringens extrapoäng är fortsatt ADDITIVA ovanpå den
      // proportionella basen, så D-SAB-001:s magnituder behåller sin betydelse.
      let modeBonus = 0
      if (isManaged && effectiveMode === 'toppa') modeBonus += TOPPA_EXTRA_FITNESS_REC
      if (isManaged && effectiveMode === 'vila')  modeBonus += VILA_EXTRA_FITNESS_REC
      updated.fitness = Math.min(
        FITNESS_RECOVERY_CEILING,
        updated.fitness + recoveryGain(updated.fitness, 'rested', {
          stamina: player.attributes?.stamina,
          daysBetweenFixtures,
          modeBonus,
        }),
      )

      let sharpnessPenalty = 3
      if (isManaged && effectiveMode === 'vila') sharpnessPenalty += VILA_SHARPNESS_PENALTY
      updated.sharpness = Math.max(0, updated.sharpness - sharpnessPenalty)
    }

    // Periodisation — seasonForm drift for managed players
    if (isManaged) {
      const sf = updated.seasonForm ?? 60
      let sfDelta = 0
      if (effectiveMode === 'bygg') {
        sfDelta = sf < BYGG_SEASON_FORM_CAP ? BYGG_SEASON_FORM_RATE : 0
      } else if (effectiveMode === 'toppa') {
        // roundsInMode is 0-indexed on switch — strictly < gives 3 spike rounds (0,1,2)
        sfDelta = roundsInMode < TOPPA_SPIKE_ROUNDS ? TOPPA_SPIKE_RATE : -TOPPA_DECAY_RATE
      } else if (effectiveMode === 'vila') {
        sfDelta = -VILA_SEASON_FORM_DECAY
      }
      updated.seasonForm = clamp(sf + sfDelta, 0, 100)
    }

    // Day job morale effects
    const isFullTimePro = player.isFullTimePro ?? false
    const flexibility = player.dayJob?.flexibility ?? 75
    if (!isFullTimePro && flexibility < 65) {
      // Check if played in last 2 completed fixtures for managed club
      const recentCompleted = simulatedFixtures
        .filter(f => f.status === FixtureStatus.Completed)
        .slice(-2)
      const playedRecently = recentCompleted.some(f =>
        (f.homeLineup?.startingPlayerIds ?? []).includes(player.id) ||
        (f.awayLineup?.startingPlayerIds ?? []).includes(player.id)
      )
      if (playedRecently) {
        // Hard week: day job + matches
        updated.morale = Math.max(0, updated.morale - 2)
      }
    }
    if (isFullTimePro && updated.fitness > 70) {
      updated.morale = Math.min(100, updated.morale + 1)
    }

    // Moral → form-drift. Routar moral via form-kanalen (redan inkopplad i motorn).
    // ±1/omg ackumulerar — de flesta spelare i 30-80-zonen → ingen drift (undviker brus).
    if (updated.morale < 30)      updated.form = Math.max(0, updated.form - 1)
    else if (updated.morale > 80) updated.form = Math.min(100, updated.form + 1)

    return updated
  })

  // ── Pool 1c: spela-på-gambling — avgörs EN gång per spelare som accepterat
  // erbjudandet (playingThroughInjury===true), oavsett om de faktiskt startade.
  // Determinism: seeden är fixture-id + spelar-id, ALDRIG spelarens val eller
  // Math.random() — situationen avgör seeden, valet (som redan skett vid accept)
  // avgör bara OM rullningen sker alls.
  const playThroughResolutions: Array<{ player: Player; relapsed: boolean; aftermathLine: string }> = []
  for (let idx = 0; idx < updatedPlayers.length; idx++) {
    const p = updatedPlayers[idx]
    if (!p.playingThroughInjury) continue

    if (!startersThisRound.has(p.id)) {
      // Bänkad/ej vald denna runda — gamblet kräver att spelaren verkligen
      // spelade. Återställ utan risk, ingen rullning, inget eftersnack.
      updatedPlayers[idx] = { ...p, isInjured: true, playingThroughInjury: false }
      continue
    }

    const fixture = simulatedFixtures.find(f => f.homeClubId === p.clubId || f.awayClubId === p.clubId)
    const seedKey = `${fixture?.id ?? 'unknown'}:${p.id}`
    const relapsed = mulberry32(fixtureSeed(seedKey))() < 0.75
    const originalDays = p.injuryDaysRemaining

    let aftermathLine: string
    if (relapsed) {
      const lineIdx = Math.floor(mulberry32(fixtureSeed(seedKey, 1))() * 5)
      aftermathLine = PLAY_THROUGH_AFTERMATH[lineIdx]
      updatedPlayers[idx] = {
        ...p,
        isInjured: true,
        injuryDaysRemaining: originalDays * 2,
        playingThroughInjury: false,
      }
    } else {
      aftermathLine = PLAY_THROUGH_AFTERMATH[5]
      updatedPlayers[idx] = {
        ...p,
        isInjured: false,
        injuryDaysRemaining: 0,
        playingThroughInjury: false,
      }
    }
    playThroughResolutions.push({ player: updatedPlayers[idx], relapsed, aftermathLine })
  }

  // Utvisning i bandy = 10 minuters penalty på isen (spelaren kommer tillbaka).
  // Det är INTE en spelande avstängning. Ingen suspensionGamesRemaining sätts.
  //
  // PÅSTÅENDEGRINDEN väg 1 (2026-08-24, Jacobs dom): matchstraff härlett ur
  // befintlig data, inte slumpat. REGLER.md: "Tredje utvisningen på samma
  // spelare = automatiskt matchstraff." matchCore.ts:s playerRedCards
  // räknade redan detta internt men lästes aldrig (skrivbart, oläst — samma
  // klass av fynd som resten av PÅSTÅENDEKARTAN-passet). Räkningen görs här
  // istället, direkt ur fixture.events — ingen ny mekanism i matchmotorn
  // behövs, bara en läsning av data som redan finns på fixturen. Ingen
  // slumpkomponent kvar: matchstraff inträffar av en anledning spelaren kan
  // se i händelselistan (tre utvisningar), aldrig av tur.
  const newlyInjured: Array<{ player: Player; days: number }> = []
  const newlySuspended: Array<{ player: Player }> = []

  for (const fixture of simulatedFixtures) {
    const suspensionCountThisMatch: Record<string, number> = {}
    for (const event of fixture.events) {
      if (event.type === MatchEventType.Suspension && event.playerId) {
        suspensionCountThisMatch[event.playerId] = (suspensionCountThisMatch[event.playerId] ?? 0) + 1
        const isMatchPenalty = suspensionCountThisMatch[event.playerId] >= 3
        if (isMatchPenalty) {
          const idx = updatedPlayers.findIndex(p => p.id === event.playerId)
          if (idx !== -1) {
            const prev = updatedPlayers[idx].suspensionGamesRemaining
            const suspendedPlayer = updatedPlayers[idx]
            const opponentClubId = fixture.homeClubId === suspendedPlayer.clubId
              ? fixture.awayClubId : fixture.homeClubId
            const opponentClub = game.clubs.find(c => c.id === opponentClubId)
            const opponentName = opponentClub?.shortName ?? opponentClub?.name ?? 'motståndet'
            // PÅSTÅENDEGRINDEN väg 2 (2026-08-24, Jacobs dom): disciplinnämndens
            // vikt — en eller tre matcher, aldrig ett mellanting (skälet är
            // läsbarhet, inte en uppfunnen skala). durationMinutes på den
            // utvisning som UTLÖSTE matchstraffet är den enda existerande
            // severitetsaxeln (M15, kalibrerad mot docs/kunskapsbas/DATA.md
            // §7) och betyder samma sak i REGLER.md ("10 minuter — grövre
            // regelbrott, farligt spel av allvarligare art" mot "5 minuter —
            // ... lättare förseelser"). Ingen orsaksklassificering (tackling
            // mot armbåge) — den datan finns inte och uppfinns inte här.
            const gamesOut = event.durationMinutes === 10 ? 3 : 1
            updatedPlayers[idx] = {
              ...suspendedPlayer,
              suspensionGamesRemaining: gamesOut,
              suspensionCause: { sinceMatchday: fixture.matchday, opponentName, matches: gamesOut },
            }
            if (prev === 0) {
              newlySuspended.push({ player: updatedPlayers[idx] })
            }
          }
        }
      }
    }
  }

  // Post-match injury check for every starter
  // ~5-8% base chance per match player with average fitness/proneness
  for (const playerId of startersThisRound) {
    const idx = updatedPlayers.findIndex(p => p.id === playerId)
    if (idx === -1) continue
    const player = updatedPlayers[idx]
    if (player.isInjured) continue

    // injury chance = base × proneness factor × fatigue factor
    // base 0.06 → ~6% for average player (proneness 50, fitness 70)
    const proneFactor = player.injuryProneness / 100        // 0–1
    const fatigueFactor = (100 - player.fitness) / 100 + 0.3 // 0.3–1.3
    let tacticInjuryMod = managedTacticMods && player.clubId === game.managedClubId
      ? 1.0 + (managedTacticMods.fatigueRate - 1.0) * 0.5
      : 1.0
    if (player.clubId === game.managedClubId && managedFixtureWeather && managedClubForTactic) {
      const twi = computeWeatherTacticInteraction(managedFixtureWeather, managedClubForTactic.activeTactic)
      tacticInjuryMod += twi.extraInjuryRisk
    }
    const midSeasonMult = (nextRound >= 8 && nextRound <= 15)
      ? (game.currentSeasonSignature?.modifiers.midSeasonInjuryMultiplier ?? 1.0)
      : 1.0
    const isStarterManaged = player.clubId === game.managedClubId
    const byggInjuryMult = isStarterManaged && getEffectiveMode(player, teamMode) === 'bygg'
      ? BYGG_INJURY_MULT : 1.0
    const injuryChance = 0.06 * Math.max(0.1, proneFactor) * fatigueFactor * tacticInjuryMod * midSeasonMult * byggInjuryMult

    if (localRand() < injuryChance) {
      const days = 7 + Math.floor(localRand() * 28)  // 1–5 weeks
      const injuryTypes = ['knä', 'axel', 'vrist', 'huvud', 'rygg', 'hamstring']
      const injuryType = injuryTypes[Math.floor(localRand() * injuryTypes.length)]
      let injuredPlayer = { ...player, isInjured: true, injuryDaysRemaining: days }
      // Narrative: injury entry for managed players
      if (player.clubId === game.managedClubId) {
        const injuryEntry = generateInjuryEntry(game.currentSeason, nextRound, days)
        injuredPlayer.diary = [...(player.diary ?? []), injuryEntry].slice(-20)
        // DREAM-012: human injury narrative
        const { narrative, familyContext } = generateInjuryNarrative(player.familyContext, injuryType, localRand)
        injuredPlayer.injuryNarrative = narrative
        injuredPlayer.familyContext = familyContext
      }
      updatedPlayers[idx] = injuredPlayer
      newlyInjured.push({ player: updatedPlayers[idx], days })
    }
  }

  // ── A-H3 ben 2 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): sannolikhetskast om
  // vila/överbelastning för spelare som startade UNDER FATIGUE_AVAILABILITY_FLOOR.
  // Läser PRE-match-fitness (playersById — spelaren SOM HAN VAR VID MATCHSTART),
  // inte post-match-förlusten — det är trötthet HAN STARTADE MED som är risken,
  // inte tröttheten matchen orsakade. Sätts INTE på en spelare som redan är
  // otillgänglig av annan anledning (skadad, denna runda eller sedan tidigare)
  // — isInjured/suspensionGamesRemaining täcker redan den otillgängligheten,
  // ingen anledning att stapla en andra.
  const newlyRested: Array<{ player: Player }> = []
  for (const playerId of startersThisRound) {
    const originalPlayer = playersById.get(playerId)
    const idx = updatedPlayers.findIndex(p => p.id === playerId)
    if (!originalPlayer || idx === -1) continue
    const updatedPlayer = updatedPlayers[idx]
    if (updatedPlayer.isInjured || updatedPlayer.suspensionGamesRemaining > 0) continue
    if ((updatedPlayer.restGamesRemaining ?? 0) > 0) continue
    const riskProb = restOutRiskProbability(originalPlayer.fitness)
    if (riskProb <= 0) continue
    const fixture = simulatedFixtures.find(f => f.homeClubId === originalPlayer.clubId || f.awayClubId === originalPlayer.clubId)
    const seedKey = `${fixture?.id ?? 'unknown'}:${playerId}:restrisk`
    const roll = mulberry32(fixtureSeed(seedKey))()
    if (roll < riskProb) {
      updatedPlayers[idx] = { ...updatedPlayer, restGamesRemaining: 1 }
      newlyRested.push({ player: updatedPlayers[idx] })
    }
  }

  // Player development every 2 rounds (AI clubs only — managed club is handled per-round
  // by applyRoundDevelopment in roundProcessor with match context)
  let finalPlayers = updatedPlayers
  if (nextRound % 2 === 0) {
    const clubFacilities = Object.fromEntries(game.clubs.map(c => [c.id, c.facilities]))
    const aiPlayers = updatedPlayers.filter(p => p.clubId !== game.managedClubId)
    const devResult = developPlayers({
      players: aiPlayers,
      clubFacilities,
      weekNumber: nextRound,
    })
    finalPlayers = [
      ...devResult.updatedPlayers,
      ...updatedPlayers.filter(p => p.clubId === game.managedClubId),
    ]
  }

  return {
    updatedPlayers: finalPlayers,
    newlyInjured,
    newlySuspended,
    playThroughResolutions,
    newlyRested,
  }
}

// ── WEAK-006/DEV-009: Captain morale cascade ──────────────────────────────

export function applyCaptainMoraleCascade(
  players: Player[],
  game: SaveGame,
  nextMatchday: number,
  existingNewInboxItems: InboxItem[],
): { updatedPlayers: Player[]; captainCrisisMoment: Moment | null } {
  if (!game.captainPlayerId) return { updatedPlayers: players, captainCrisisMoment: null }
  const captain = players.find(p => p.id === game.captainPlayerId)
  if (!captain || captain.morale >= 40) return { updatedPlayers: players, captainCrisisMoment: null }

  const alreadySentId = `inbox_captain_crisis_r${nextMatchday}_${game.currentSeason}`
  const alreadySent = existingNewInboxItems.some(i => i.id === alreadySentId) || game.inbox.some(i => i.id === alreadySentId)
  if (alreadySent) return { updatedPlayers: players, captainCrisisMoment: null }

  const updatedPlayers = players.map(p => {
    if (p.clubId !== game.managedClubId || p.id === captain.id) return p
    return { ...p, morale: Math.max(0, p.morale - 5) }
  })
  return {
    updatedPlayers,
    captainCrisisMoment: {
      id: alreadySentId,
      source: 'captain_crisis',
      matchday: nextMatchday,
      season: game.currentSeason,
      title: 'Omklädningsrummet är tyst',
      body: `Kapten ${captain.firstName} ${captain.lastName} har inte sagt mycket denna vecka. Det märks i hela truppen.`,
      subjectPlayerId: captain.id,
    },
  }
}
