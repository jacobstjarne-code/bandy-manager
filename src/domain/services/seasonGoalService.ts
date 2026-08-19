/**
 * O3 — Spelarens eget säsongsmål (DOM_EGET_SASONGSMAL_2026-08-17.md).
 * Ett mål, valt i Sommaren, återkallat vid halvtid (ambient rad) och i
 * årsboken (O18 fält 1). Sex fasta måltyper härledda ur klubbens faktiska
 * läge — inget AI-genererat.
 *
 * Halvtidsraden (2026-08-19): D1:s ambient-nivå (isAmbientEvent/
 * getEventRenderTarget, eventQueueService.ts) blev KLAR under samma session
 * detta skrevs (D1 punkt 2, commit 4e347971) — byggd här, som checkX(game,
 * nextMatchday)-generatorn eventProcessor.ts redan har mönstret för
 * (jfr checkEconomicCrisis). Domen gav bara ETT konkret exempel (slutspel/
 * "Ni ligger fyra") — de andra fem typernas rader är Codes generalisering
 * av samma form (fakta, inga påhittade omdömen), se deriveGoalHalfwayLine.
 */
import type { SaveGame, ClubEra } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { SeasonGoalRecord, SeasonGoalType, SeasonGoalOutcome } from '../entities/SeasonSummary'
import { FixtureStatus } from '../enums'
import { getRivalClubId } from '../data/rivalries'
import { FACILITY_NODE_DEFS, getFacilityNodeViews } from './facilityService'
import { eraLabel } from './clubEraService'
import { getCurrentLeagueRound } from '../data/seasonPhases'

export interface SeasonGoalOffer {
  type: SeasonGoalType
  referenceId?: string
  trackedPlayerIds?: string[]
  choiceText: string
}

const MAX_OFFERS = 4
const CARRY_AGE_LIMIT = 23
const CARRY_POTENTIAL_THRESHOLD = 70   // "elite"-tröskeln, samma som academyService.ts:s PA-fördelning
const KEEP_SQUAD_MIN_EXPIRING = 3

/**
 * Vilka mål Sommaren erbjuder just nu. Slutspel/Etablera oss är ömsesidigt
 * uteslutande (bara ett av dem, beroende på förra säsongen). Max fyra totalt
 * — "spelaren ser tre till fyra som är rimliga just nu" (domen). "Inget
 * särskilt i år" läggs till av UI:t, inte här (alltid giltigt, aldrig villkorat).
 */
export function getSeasonGoalOffers(game: SaveGame): SeasonGoalOffer[] {
  const offers: SeasonGoalOffer[] = []
  const managedClubId = game.managedClubId
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)
  const summaries = game.seasonSummaries ?? []
  const lastSeason = summaries[summaries.length - 1]

  if (lastSeason) {
    const lastSeasonQualified = lastSeason.playoffResult != null && lastSeason.playoffResult !== 'didNotQualify'
    if (!lastSeasonQualified) {
      offers.push({ type: 'playoff', choiceText: 'Ta oss till slutspel.' })
    } else {
      offers.push({ type: 'establish', choiceText: 'Etablera oss där. Två år i rad, inte ett.' })
    }
  }

  const carryCandidate = [...managedPlayers]
    .filter(p => p.age < CARRY_AGE_LIMIT && p.potentialAbility >= CARRY_POTENTIAL_THRESHOLD)
    .sort((a, b) => b.potentialAbility - a.potentialAbility)[0]
  if (carryCandidate) {
    offers.push({
      type: 'playerCarry',
      referenceId: carryCandidate.id,
      choiceText: `Låt ${carryCandidate.firstName} bära laget.`,
    })
  }

  const rivalClubId = getRivalClubId(managedClubId)
  const rivalClub = rivalClubId ? game.clubs.find(c => c.id === rivalClubId) : undefined
  if (rivalClub) {
    offers.push({ type: 'rival', referenceId: rivalClub.id, choiceText: `Slå ${rivalClub.name}. En gång räcker.` })
  }

  const facilityOffer = getFacilityGoalOffer(game)
  if (facilityOffer) offers.push(facilityOffer)

  const expiring = managedPlayers.filter(p => p.contractUntilSeason === game.currentSeason)
  if (expiring.length >= KEEP_SQUAD_MIN_EXPIRING) {
    offers.push({
      type: 'keepSquad',
      trackedPlayerIds: expiring.map(p => p.id),
      choiceText: 'Håll ihop truppen. Ingen ska behöva gå.',
    })
  }

  return offers.slice(0, MAX_OFFERS)
}

function getFacilityGoalOffer(game: SaveGame): SeasonGoalOffer | null {
  const state = game.facilityState
  if (!state) return null
  if (state.activeProject) {
    const def = FACILITY_NODE_DEFS.find(d => d.id === state.activeProject!.nodeId)
    if (!def) return null
    return { type: 'facility', referenceId: def.id, choiceText: `Få ${def.label} färdig.` }
  }
  const available = getFacilityNodeViews(state, game.currentMatchday).find(v => v.status === 'available')
  if (!available) return null
  return { type: 'facility', referenceId: available.def.id, choiceText: `Få ${available.def.label} färdig.` }
}

/**
 * Delad av evaluateSeasonGoal (rival-fallet), deriveRivalryStanding och
 * halvtidsraden (Port 4 — en källa, inte tre kopior av samma matchräkning).
 */
function tallyVsClub(game: SaveGame, opponentClubId: string): { wins: number; draws: number; losses: number } {
  const fixtures = game.fixtures.filter(f =>
    f.season === game.currentSeason && !f.isCup && f.status === FixtureStatus.Completed &&
    ((f.homeClubId === game.managedClubId && f.awayClubId === opponentClubId) ||
     (f.awayClubId === game.managedClubId && f.homeClubId === opponentClubId))
  )
  let wins = 0, draws = 0, losses = 0
  for (const f of fixtures) {
    const isHome = f.homeClubId === game.managedClubId
    const managedScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const oppScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    if (managedScore > oppScore) wins++
    else if (managedScore === oppScore) draws++
    else losses++
  }
  return { wins, draws, losses }
}

/** Delad av evaluateSeasonGoal (facility-fallet) och halvtidsraden (Port 4 — en källa). */
function facilityProgress(game: SaveGame, nodeId: string | undefined): { built: boolean; fraction: number } {
  const built = nodeId ? (game.facilityState?.builtNodeIds ?? []).includes(nodeId) : false
  if (built) return { built: true, fraction: 1 }
  const active = game.facilityState?.activeProject
  const isSameNode = !!active && active.nodeId === nodeId
  const fraction = isSameNode
    ? (game.currentMatchday - active!.startedMatchday) / Math.max(1, active!.etaMatchday - active!.startedMatchday)
    : 0
  return { built: false, fraction: Math.max(0, Math.min(1, fraction)) }
}

export interface SeasonGoalEvalContext {
  contractExpiredIds: Set<string>
  retiredPlayerIds: Set<string>
}

/**
 * Utfallet av ett valt mål, mätt vid säsongsslut. `game` ska vara
 * säsongen-som-precis-slutade-tillståndet (samma objekt som skickas till
 * generateSeasonSummary i seasonEndProcessor.ts — game.standings/game.players/
 * game.fixtures/game.facilityState reflekterar då fortfarande den avslutade
 * säsongen, inte nästa).
 */
export function evaluateSeasonGoal(
  game: SaveGame,
  goal: { type: SeasonGoalType; referenceId?: string; trackedPlayerIds?: string[] },
  ctx: SeasonGoalEvalContext,
): SeasonGoalRecord {
  switch (goal.type) {
    case 'playoff':
    case 'establish': {
      const finalPosition = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 12
      const outcome: SeasonGoalOutcome = finalPosition <= 8 ? 'met' : finalPosition <= 10 ? 'close' : 'not'
      return { type: goal.type, outcome }
    }
    case 'playerCarry': {
      const player = goal.referenceId ? game.players.find(p => p.id === goal.referenceId) : undefined
      const games = player?.seasonStats.gamesPlayed ?? 0
      const outcome: SeasonGoalOutcome = games >= 15 ? 'met' : games >= 10 ? 'close' : 'not'
      return { type: goal.type, referenceId: goal.referenceId, outcome }
    }
    case 'rival': {
      const { wins, draws } = goal.referenceId ? tallyVsClub(game, goal.referenceId) : { wins: 0, draws: 0 }
      const outcome: SeasonGoalOutcome = wins > 0 ? 'met' : draws > 0 ? 'close' : 'not'
      return { type: goal.type, referenceId: goal.referenceId, outcome }
    }
    case 'facility': {
      const { built, fraction } = facilityProgress(game, goal.referenceId)
      if (built) return { type: goal.type, referenceId: goal.referenceId, outcome: 'met' }
      const outcome: SeasonGoalOutcome = fraction >= 0.5 ? 'close' : 'not'
      return { type: goal.type, referenceId: goal.referenceId, outcome }
    }
    case 'keepSquad': {
      const tracked = goal.trackedPlayerIds ?? []
      const extended = tracked.filter(id => !ctx.contractExpiredIds.has(id) && !ctx.retiredPlayerIds.has(id)).length
      const outcome: SeasonGoalOutcome = extended >= 2 ? 'met' : extended === 1 ? 'close' : 'not'
      return { type: goal.type, outcome }
    }
  }
}

/**
 * "{mål}"-frasen i årsbokens rad ("Du sa {mål} i somras..."). Slår upp namn
 * live mot game (spelare/klubb/nod) — degraderar graciöst om referensen inte
 * längre går att hitta (t.ex. en spelare som lämnat klubben flera säsonger
 * efter att målet sattes) i stället för att kräva en fryst etikett i
 * SeasonGoalRecord, som skulle bryta domens "tre fält, inget mer".
 */
function deriveGoalPhrase(record: SeasonGoalRecord, game: SaveGame): string {
  switch (record.type) {
    case 'playoff': return 'slutspel'
    case 'establish': return 'etablering'
    case 'playerCarry': {
      const player = record.referenceId ? game.players.find(p => p.id === record.referenceId) : undefined
      return player ? `att ${player.firstName} skulle bära laget` : 'att en ung spelare skulle bära laget'
    }
    case 'rival': {
      const club = record.referenceId ? game.clubs.find(c => c.id === record.referenceId) : undefined
      return club ? `att slå ${club.name}` : 'att slå rivalen'
    }
    case 'facility': {
      const def = record.referenceId ? FACILITY_NODE_DEFS.find(d => d.id === record.referenceId) : undefined
      return def ? `att få ${def.label} färdig` : 'att få bygget färdigt'
    }
    case 'keepSquad': return 'att hålla ihop truppen'
  }
}

/** Årsbokens målrad (O3/O18 fält 1). All text låst av Opus, kopierad ordagrant. */
export function deriveGoalOutcomeLine(record: SeasonGoalRecord | undefined, game: SaveGame): string {
  if (!record) return 'Du lovade ingenting i somras. Det höll du.'
  const phrase = deriveGoalPhrase(record, game)
  switch (record.outcome) {
    case 'met': return `Du sa ${phrase} i somras. Du gjorde det.`
    case 'close': return `Du sa ${phrase} i somras. Det saknades inte mycket.`
    case 'not': return `Du sa ${phrase} i somras. Det blev inte så.`
  }
}

// ── O18 fält 3 — största personförändringen ───────────────────────────────

export interface SeasonPersonChange {
  kind: 'retired' | 'breakthrough' | 'establishedStarter'
  playerId: string
  name: string
  seasons?: number
}

/**
 * Prioritetsordning (Code, 2026-08-19, "egen bedömning" per ordern):
 * legendspelare som slutade > akademispelare som slog igenom (≥3 matcher,
 * under 23, homegrown, FÖRSTA säsongen med ≥3 matcher) > spelare som gick
 * från reserv (≤8 matcher föregående säsong) till bärande roll (≥15 denna
 * säsong). `game` ska vara pre-reset (samma som generateSeasonSummary läser)
 * — seasonStats/seasonHistory för den avslutade säsongen är då fortfarande
 * intakta. `retiredManagedPlayers` är samma lista seasonEndProcessor.ts
 * redan bygger (generateRetirementData-resultat) — ingen ny retirement-logik.
 */
export function deriveSeasonPersonChange(
  game: SaveGame,
  retiredManagedPlayers: Array<{ playerId: string; name: string; seasons: number; isLegend: boolean }>,
): SeasonPersonChange | undefined {
  const legend = retiredManagedPlayers.find(p => p.isLegend)
  if (legend) {
    return { kind: 'retired', playerId: legend.playerId, name: legend.name, seasons: legend.seasons }
  }

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)

  const breakthrough = managedPlayers.find(p =>
    p.promotedFromAcademy === true &&
    p.age < CARRY_AGE_LIMIT &&
    p.isHomegrown === true &&
    p.seasonStats.gamesPlayed >= 3 &&
    !(p.seasonHistory ?? []).some(h => h.games >= 3)
  )
  if (breakthrough) {
    return { kind: 'breakthrough', playerId: breakthrough.id, name: `${breakthrough.firstName} ${breakthrough.lastName}` }
  }

  const reserveToStarter = managedPlayers
    .map(p => {
      const prevGames = (p.seasonHistory ?? []).at(-1)?.games ?? 0
      return { p, prevGames, thisGames: p.seasonStats.gamesPlayed }
    })
    .filter(x => x.prevGames <= 8 && x.thisGames >= 15)
    .sort((a, b) => (b.thisGames - b.prevGames) - (a.thisGames - a.prevGames))[0]
  if (reserveToStarter) {
    return { kind: 'establishedStarter', playerId: reserveToStarter.p.id, name: `${reserveToStarter.p.firstName} ${reserveToStarter.p.lastName}` }
  }

  return undefined
}

/** Historikens personrad (O18, text låst). */
export function derivePersonChangeLine(change: SeasonPersonChange): string {
  switch (change.kind) {
    case 'retired': return `${change.name} la av efter ${change.seasons} säsonger.`
    case 'breakthrough': return `${change.name} kom upp och blev kvar.`
    case 'establishedStarter': return `${change.name} gick från reserv till given.`
  }
}

// ── O18 fält 4 — rivalitetens ställning ────────────────────────────────────

export interface SeasonRivalryStanding {
  rivalClubId: string
  rivalName: string
  wins: number
  draws: number
  losses: number
}

/** `game` = säsongen-som-precis-slutade-tillståndet, se evaluateSeasonGoal. */
export function deriveRivalryStanding(game: SaveGame): SeasonRivalryStanding | undefined {
  const rivalClubId = getRivalClubId(game.managedClubId)
  if (!rivalClubId) return undefined
  const rivalClub = game.clubs.find(c => c.id === rivalClubId)
  if (!rivalClub) return undefined

  const { wins, draws, losses } = tallyVsClub(game, rivalClubId)
  if (wins + draws + losses === 0) return undefined
  return { rivalClubId, rivalName: rivalClub.name, wins, draws, losses }
}

/** Historikens rivalrad (O18, text låst). */
export function deriveRivalryLine(standing: SeasonRivalryStanding): string {
  return `${standing.rivalName}: ${standing.wins}–${standing.draws}–${standing.losses} den säsongen.`
}

// ── O18 fält 5 — epokraden ────────────────────────────────────────────────

/**
 * Historikens epokrad (O18) — bara när epoken skiftade mot föregående sparade
 * säsong. Mallen ("Det här året slutade {Klubb} vara {gammal epok}.") är
 * Opus-låst, men DOM:en ger bara ETT löst exempelord ("nykomling") — inte en
 * fullständig tabell för alla fyra ClubEra-värden. CLAUDE.md förbjuder Code
 * från att uppfinna ny svensk prosa, så {gammal epok} fylls med redan skeppad,
 * granskad text (eraLabel() från clubEraService.ts, samma etikett som
 * "Klubben i korthet" redan visar) i stället för en ny formulering — bara
 * "i" tillagt för grammatiken.
 */
export function deriveEraChangeLine(clubName: string, previousEra: ClubEra): string {
  return `Det här året slutade ${clubName} vara i ${eraLabel(previousEra).toLowerCase()}.`
}

// ── Halvtidsraden (ambient rad, D1) ────────────────────────────────────────

const POSITION_WORDS = ['ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv']
/** "Ni ligger fyra" — kolloquial svensk sportprosa (spelord), inte ordinal(). */
function positionWord(position: number): string {
  return POSITION_WORDS[position - 1] ?? String(position)
}

const HALFWAY_LEAGUE_ROUND = 11   // 22-omgångarsserie, se CLAUDE.md:s matchday-arkitektur
const CARRY_HALFWAY_GAMES_TARGET = 7   // hälften av slutmålets 15, avrundat nedåt

/**
 * Halvtidsraden (O3, DOM_EGET_SASONGSMAL_2026-08-17.md) — "Du sa slutspel.
 * Ni ligger fyra." Domens EGNA exempel gäller bara slutspel/etablera
 * (positionsbaserat). De andra fem generaliseras HÄR (Code, 2026-08-19) i
 * samma register: en enda konkret siffra/fakta, aldrig ett omdöme — och
 * en påminnelse ("Halva säsongen kvar.") bara när det INTE ser bra ut,
 * exakt som domens negativa exempel.
 */
function deriveGoalHalfwayLine(goal: { type: SeasonGoalType; referenceId?: string; trackedPlayerIds?: string[] }, game: SaveGame): string {
  const phrase = deriveGoalPhrase({ type: goal.type, referenceId: goal.referenceId, outcome: 'not' }, game)
  const reminder = ' Halva säsongen kvar.'

  switch (goal.type) {
    case 'playoff':
    case 'establish': {
      const position = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 12
      const onTrack = position <= 8
      return `Du sa ${phrase}. Ni ligger ${positionWord(position)}.${onTrack ? '' : reminder}`
    }
    case 'playerCarry': {
      const player = goal.referenceId ? game.players.find(p => p.id === goal.referenceId) : undefined
      const games = player?.seasonStats.gamesPlayed ?? 0
      const name = player?.firstName ?? 'Spelaren'
      const onTrack = games >= CARRY_HALFWAY_GAMES_TARGET
      return `Du sa ${phrase}. ${name} har spelat ${games} matcher hittills.${onTrack ? '' : reminder}`
    }
    case 'rival': {
      const { wins, draws, losses } = goal.referenceId ? tallyVsClub(game, goal.referenceId) : { wins: 0, draws: 0, losses: 0 }
      const onTrack = wins > 0
      return `Du sa ${phrase}. ${wins}–${draws}–${losses} hittills.${onTrack ? '' : reminder}`
    }
    case 'facility': {
      const { built, fraction } = facilityProgress(game, goal.referenceId)
      const percent = Math.round(fraction * 100)
      const onTrack = built || fraction >= 0.5
      return `Du sa ${phrase}. ${built ? 'Klart redan.' : `${percent}% klart.`}${onTrack ? '' : reminder}`
    }
    case 'keepSquad': {
      const tracked = goal.trackedPlayerIds ?? []
      const handled = new Set(game.handledContractPlayerIds ?? [])
      const extended = tracked.filter(id => handled.has(id)).length
      const onTrack = extended >= 1
      return `Du sa ${phrase}. ${extended} av ${tracked.length} kontrakt klara.${onTrack ? '' : reminder}`
    }
  }
}

/**
 * Genererar (max en gång per säsong) den ambienta halvtidsraden om spelaren
 * valt ett mål i Sommaren. Samma checkX(game, nextMatchday)-mönster som
 * checkEconomicCrisis (economicCrisisService.ts) — deterministiskt id,
 * dubbel dedup-koll (resolvedEventIds + pendingEvents). Gate på
 * getCurrentLeagueRound (spelade ligaomgångar), inte råa matchday-nummer —
 * cupomgångar (matchday 3/8/13/19) flyttar annars om mappningen
 * ligaomgång→matchday, se CLAUDE.md:s matchday-arkitekturnot.
 */
export function checkSeasonGoalHalfwayEvent(game: SaveGame): GameEvent | null {
  const goal = game.activeSeasonGoal
  if (!goal || goal.chosenSeason !== game.currentSeason) return null
  if (getCurrentLeagueRound(game) < HALFWAY_LEAGUE_ROUND) return null

  const eventId = `event_season_goal_halfway_${game.currentSeason}`
  if ((game.resolvedEventIds ?? []).includes(eventId)) return null
  if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return null

  return {
    id: eventId,
    type: 'seasonGoalHalfway',
    title: 'Halva säsongen',
    body: deriveGoalHalfwayLine(goal, game),
    choices: [],
    resolved: false,
    priority: 'low',
  }
}
