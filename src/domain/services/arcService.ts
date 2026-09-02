import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { ActiveArc, ArcType, StorylineEntry } from '../entities/Narrative'
import type { GameEvent } from '../entities/GameEvent'
import { InboxItemType, MatchEventType } from '../enums'
import { getRivalry } from '../data/rivalries'
import { mulberry32 } from '../utils/random'
import { getCurrentLeagueRound } from '../data/seasonPhases'

// 4.6 (SLUTTEST_KO.md, 2026-08-17): alla newStorylines.push(...)-anrop nedan
// sätter matchday: getCurrentLeagueRound(game), INTE den lokala
// currentMatchday-variabeln (som är GLOBAL — justCompletedFixture?.matchday,
// kan bli 27+ under slutspel). SeasonSummaryScreen.tsx renderar
// storyline.matchday som "O{round}" och antar en ligaomgång (1-22); en
// arc-storyline som avgjordes under slutspelet visade "O33" innan denna fix.
// Samma logik som eventResolver.ts:s captainSpeech-storyline redan
// implementerade inline (nu delad via getCurrentLeagueRound istället).
// currentMatchday (global) används fortfarande korrekt för inbox/event-
// tidsstämplar i denna fil — bara storyline.matchday är omfattat.

// ── Helpers ──────────────────────────────────────────────────────────────────

function playerName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`
}

function genId(prefix: string, matchday: number, suffix: string): string {
  return `${prefix}_${suffix}_md${matchday}`
}

// ── detectArcTriggers ─────────────────────────────────────────────────────────

/**
 * Detects new arc triggers based on game state and the just-completed fixture.
 * Max 2 active non-derby arcs. Max 1 arc per player.
 */
export function detectArcTriggers(game: SaveGame, justCompletedFixture?: Fixture): ActiveArc[] {
  const existing = game.activeArcs ?? []
  const newArcs: ActiveArc[] = []

  const currentMatchday = justCompletedFixture?.matchday ?? 0

  const nonDerbyActive = existing.filter(a => a.type !== 'derby_echo' && a.phase !== 'resolving')
  const activePlayerIds = new Set(existing.map(a => a.playerId).filter(Boolean) as string[])

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedFixtures = game.fixtures.filter(
    f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
  )
  const completedManagedFixtures = managedFixtures.filter(f => f.status === 'completed')

  const hasArcType = (type: ArcType) =>
    existing.some(a => a.type === type && a.phase !== 'resolving') ||
    newArcs.some(a => a.type === type)

  const canAddArc = () =>
    nonDerbyActive.length + newArcs.filter(a => a.type !== 'derby_echo').length < 2

  // ── hungrig_breakthrough ──
  // H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24, Jacobs
  // dom): åldersgränsen höjd 21 → 24. characterPlayerService.ts:s
  // initCharacterPlayers() kan tilldela 'hungrig' till en spelare upp till
  // 24 år (samma fil, kandidatfiltret `p.age <= 24`) — en spelare som fick
  // traiten vid 22-24 kunde ALDRIG utlösa arcen, för alltid (åldern bara
  // ökar). Två tal om samma sak i två filer, nu samma tal. Bekräftat i
  // simulering (scripts/h1-arc-eligibility-sim.ts, 20 karriärer): traiten
  // är den smalare grinden och ska förbli det.
  if (!hasArcType('hungrig_breakthrough') && canAddArc()) {
    const hungrigPlayers = managedPlayers.filter(
      p => p.trait === 'hungrig' && p.age <= 24 && !activePlayerIds.has(p.id)
    )
    for (const p of hungrigPlayers) {
      // Count consecutive games without a goal where player was in the lineup
      const recentFixtures = completedManagedFixtures
        .slice()
        .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
      let gamesWithoutGoal = 0
      for (const f of recentFixtures) {
        const isHome = f.homeClubId === game.managedClubId
        const lineup = isHome ? f.homeLineup : f.awayLineup
        const wasInLineup = lineup?.startingPlayerIds?.includes(p.id) || lineup?.benchPlayerIds?.includes(p.id)
        if (!wasInLineup) continue
        const scored = (f.events ?? []).some(e => e.type === 'goal' && e.playerId === p.id)
        if (scored) break
        gamesWithoutGoal++
      }
      if (gamesWithoutGoal >= 3) {
        newArcs.push({
          id: genId('arc', currentMatchday, `hungrig_${p.id}`),
          type: 'hungrig_breakthrough',
          playerId: p.id,
          subject: `${p.firstName[0]}. ${p.lastName}`,
          startedMatchday: currentMatchday,
          phase: 'building',
          eventsFired: [],
          decisionsMade: [],
          expiresMatchday: currentMatchday + 6,
          data: { gamesWithoutGoal },
        })
        break
      }
    }
  }

  // ── joker_redemption ── (triggers from just-completed fixture)
  if (justCompletedFixture && !hasArcType('joker_redemption') && canAddArc()) {
    const jokerPlayers = managedPlayers.filter(
      p => p.trait === 'joker' && !activePlayerIds.has(p.id)
    )
    for (const p of jokerPlayers) {
      const events = justCompletedFixture.events ?? []
      const hadSuspension = events.some(e => e.type === MatchEventType.Suspension && e.playerId === p.id)
      if (hadSuspension) {
        newArcs.push({
          id: genId('arc', currentMatchday, `joker_${p.id}`),
          type: 'joker_redemption',
          playerId: p.id,
          subject: `${p.firstName[0]}. ${p.lastName}`,
          startedMatchday: currentMatchday,
          phase: 'building',
          eventsFired: [],
          decisionsMade: [],
          expiresMatchday: currentMatchday + 4,
        })
        break
      }
    }
  }

  // ── veteran_final_season ── Triggas vid säsongsstart (md <= 1)
  if (!hasArcType('veteran_final_season') && canAddArc() && currentMatchday <= 1) {
    const veterans = managedPlayers.filter(p =>
      p.age >= 34 &&
      p.contractUntilSeason === game.currentSeason &&
      !activePlayerIds.has(p.id)
    )
    for (const vet of veterans) {
      newArcs.push({
        id: `arc_vetfinal_${vet.id}_s${game.currentSeason}`,
        type: 'veteran_final_season',
        playerId: vet.id,
        subject: `${vet.firstName[0]}. ${vet.lastName}`,
        startedMatchday: 0,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: 22,
        data: { gamesPlayed: vet.careerStats?.totalGames ?? 0 },
      })
    }
  }

  // ── veteran_farewell ──
  if (!hasArcType('veteran_farewell') && canAddArc() && currentMatchday >= 15) {
    const veterans = managedPlayers.filter(
      p => p.trait === 'veteran' && p.age >= 30 &&
           p.contractUntilSeason === game.currentSeason &&
           !activePlayerIds.has(p.id)
    )
    if (veterans.length > 0) {
      const p = veterans[0]
      newArcs.push({
        id: genId('arc', currentMatchday, `veteran_${p.id}`),
        type: 'veteran_farewell',
        playerId: p.id,
        subject: `${p.firstName[0]}. ${p.lastName}`,
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 8,
      })
    }
  }

  // ledare_crisis BORTTAGEN (H1-uppföljning, människoupplevelse-audit
  // 7024f8a, 2026-08-24, Jacobs dom). Triggade på exakt samma villkor som
  // postAdvanceEvents.ts:s captainSpeech ("3 förluster i rad") men kunde
  // peka ut en ANNAN spelare än den faktiska kaptenen (trait 'ledare'/
  // 'veteran', inte captainPlayerId) och räknade in cupmatcher i strecket.
  // captainSpeech är kanon — give_words boardPatience-kostnad och
  // take_charges moralkostnad flyttades in i generateCaptainSpeechEvent()
  // (eventFactories.ts) i samma commit. Se BACKLOG.md "Två läsare, en
  // sanning" och SLUTTEST_KO.md post 53 för full historik. Migration för
  // saves med en ledare_crisis-arc mid-flight: saveGameMigration.ts.

  // ── lokal_hero ── (mål i just spelat derby)
  if (justCompletedFixture && !hasArcType('lokal_hero') && canAddArc()) {
    const rivalry = getRivalry(justCompletedFixture.homeClubId, justCompletedFixture.awayClubId)
    if (rivalry) {
      const lokalPlayers = managedPlayers.filter(
        p => p.trait === 'lokal' && !activePlayerIds.has(p.id)
      )
      for (const p of lokalPlayers) {
        const events = justCompletedFixture.events ?? []
        const scoredInDerby = events.some(e => e.type === 'goal' && e.playerId === p.id)
        if (scoredInDerby) {
          newArcs.push({
            id: genId('arc', currentMatchday, `lokal_${p.id}`),
            type: 'lokal_hero',
            playerId: p.id,
            subject: `${p.firstName[0]}. ${p.lastName}`,
            startedMatchday: currentMatchday,
            phase: 'building',
            eventsFired: [],
            decisionsMade: [],
            expiresMatchday: currentMatchday + 3,
          })
          break
        }
      }
    }
  }

  // ── contract_drama ── (utgående kontrakt + ett faktiskt bud, inte textmatchning)
  // H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24, Jacobs dom):
  // villkoret letade tidigare efter InboxItemType.Media-poster vars body
  // innehöll substrängen "spekulationer" — ingen generator i kodbasen
  // (mediaService/journalistService/rumorService/midSeasonEventService)
  // skrev NÅGONSIN den strängen. `grep -rln spekulationer src/domain` gav
  // ETT träffställe: denna kontrollen. Bekräftat i simulering (scripts/
  // h1-arc-eligibility-sim.ts, 20 karriärer × 4 säsonger): 0/20, strukturellt
  // onåbart, inte bara smalt. "Ett kontraktsdrama som inte kan inträffa är
  // sämre än inget" — omskrivet mot faktisk state: `game.transferBids`
  // (transferService.ts, `direction:'incoming'` = ett bud på VÅR spelare,
  // satt av sellingClubId===managedClubId, se createOutgoingBid-motparten)
  // och `Player.contractUntilSeason` (samma fält veteran_farewell/
  // veteran_final_season redan använder för "utgående kontrakt").
  if (!hasArcType('contract_drama') && canAddArc()) {
    const biddedPlayerIds = new Set(
      game.transferBids
        .filter(b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === game.managedClubId)
        .map(b => b.playerId)
    )
    for (const p of managedPlayers) {
      if (!biddedPlayerIds.has(p.id)) continue
      if (activePlayerIds.has(p.id)) continue
      if (p.contractUntilSeason !== game.currentSeason) continue
      if (p.form <= 65) continue
      newArcs.push({
        id: genId('arc', currentMatchday, `contract_${p.id}`),
        type: 'contract_drama',
        playerId: p.id,
        subject: `${p.firstName[0]}. ${p.lastName}`,
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 6,
      })
      break
    }
  }

  // ── derby_echo ── (just completed derby)
  if (justCompletedFixture) {
    const rivalry = getRivalry(justCompletedFixture.homeClubId, justCompletedFixture.awayClubId)
    if (rivalry && !existing.some(a => a.type === 'derby_echo' && a.phase !== 'resolving')) {
      const opponentId = justCompletedFixture.homeClubId === game.managedClubId
        ? justCompletedFixture.awayClubId
        : justCompletedFixture.homeClubId
      const isHome = justCompletedFixture.homeClubId === game.managedClubId
      const our = isHome ? (justCompletedFixture.homeScore ?? 0) : (justCompletedFixture.awayScore ?? 0)
      const their = isHome ? (justCompletedFixture.awayScore ?? 0) : (justCompletedFixture.homeScore ?? 0)
      const derbyResult = our > their ? 'win' : our < their ? 'loss' : 'draw'
      newArcs.push({
        id: genId('arc', currentMatchday, `derby_echo_${opponentId}`),
        type: 'derby_echo',
        opponentClubId: opponentId,
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 2,
        data: { derbyResult },
      })
    }
  }

  return newArcs
}

// ── progressArcs ──────────────────────────────────────────────────────────────

export interface ArcProgressResult {
  updatedArcs: ActiveArc[]
  newEvents: GameEvent[]
  newInboxItems: Array<{
    id: string
    type: InboxItemType
    title: string
    body: string
    relatedPlayerId?: string
    isRead: boolean
    date: string
  }>
  newStorylines: StorylineEntry[]
}

/**
 * PÅSTÅENDEKARTAN batch-03 (2026-08-24), uppdaterad 2026-08-25: denna
 * funktion grenar per arc-typ, och grenarna har olika sanningshalt.
 * hungrig_breakthroughs och contract_dramas peak-event REVERIFIERAR nu sitt
 * triggervillkor innan eventet skapas (mutationVerificationGate-utökning,
 * Jacobs order) — inte längre utelämnade. derby_echo och veteran_final_season
 * fick låst text av Jacob 2026-08-25 (SANNINGEN-SAKNAS-fix): derby_echo
 * släppte kausalpåståendet ("satte tonen") och citerar nu bara det utfall
 * som faktiskt lagras; veteran_final_seasons dagboksrader väljs på
 * p.morale/p.seasonForm i stället för matchday-modulo. Ingen gren
 * utelämnad längre av denna anledning.
 *
 * @cites arc.data.derbyResult, completedSinceStart, arc.decisionsMade, p.age, p.careerStats.seasonsPlayed, p.salary, updatedArc.phase, game.transferBids, p.morale, p.seasonForm
 */
export function progressArcs(
  game: SaveGame,
  currentMatchday: number,
  justCompletedFixture?: Fixture,
): ArcProgressResult {
  const arcs = game.activeArcs ?? []
  const updatedArcs: ActiveArc[] = []
  const newEvents: GameEvent[] = []
  const newInboxItems: ArcProgressResult['newInboxItems'] = []
  const newStorylines: StorylineEntry[] = []

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const localPaper = game.localPaperName ?? 'Lokaltidningen'
  const currentDate = game.currentDate

  // Suppress unused warning — rng reserved for future stochastic arc content
  void mulberry32(currentMatchday * 7919 + game.currentSeason * 31)

  for (const arc of arcs) {
    if (currentMatchday > arc.expiresMatchday) {
      continue // expired
    }

    const p = arc.playerId ? managedPlayers.find(pp => pp.id === arc.playerId) : undefined
    const name = p ? playerName(p) : 'Spelaren'
    const matchdaysSinceStart = currentMatchday - arc.startedMatchday

    let updatedArc = { ...arc }

    // ── Phase transitions ──
    if (arc.phase === 'building' && matchdaysSinceStart >= 2) {
      updatedArc = { ...updatedArc, phase: 'peak' }
    } else if (arc.phase === 'peak' && matchdaysSinceStart >= 4) {
      updatedArc = { ...updatedArc, phase: 'resolving' }
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'derby_echo') {
      const derbyResult = (arc.data?.derbyResult as string) ?? 'draw'
      const opponentClub = game.clubs.find(c => c.id === arc.opponentClubId)
      const opponentName = opponentClub?.name ?? 'rivalen'

      if (arc.phase === 'building') {
        const echoId = `derby_echo_inbox_${arc.id}`
        if (!arc.eventsFired.includes(echoId)) {
          const headline = derbyResult === 'win'
            ? 'Derbyseger ger hela orten energi'
            : derbyResult === 'loss'
              ? `Tung förlust mot ${opponentName} — men nästa gång...`
              : 'Derbyt slutade oavgjort — orten delad'
          newInboxItems.push({
            id: `inbox_${echoId}`,
            type: InboxItemType.Derby,
            title: `📰 ${localPaper}: "${headline}"`,
            body: derbyResult === 'win'
              ? `Efter segern mot ${opponentName} pratar alla om laget. Stämningen i orten är på topp.`
              : derbyResult === 'loss'
                ? `Nederlaget mot ${opponentName} satt hårt. Fansen hoppas på revansch.`
                : `Oavgjort mot ${opponentName}. Derbyt var jämnt — ingen riktigt nöjd.`,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, echoId] }
        }
      }

      if (updatedArc.phase === 'resolving') {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId)) {
          newStorylines.push({
            id: storylineId,
            type: 'derby_echo_resolved',
            season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
            // Text låst av Jacob 2026-08-25 (SANNINGEN-SAKNAS-fix): den
            // gamla texten hävdade en kausal effekt ("satte tonen") som var
            // overifierbar även med ett nytt fält. Säger nu bara att derbyt
            // spelades och hur det känns, inte vad det orsakade.
            description: derbyResult === 'win'
              ? `Derbysegern mot ${opponentName} pratas det fortfarande om.`
              : `Derbyförlusten mot ${opponentName} sitter kvar i omklädningsrummet.`,
            displayText: derbyResult === 'win'
              ? `🏆 Derby-triumf mot ${opponentName}`
              : `💔 Derby-förlust mot ${opponentName}`,
            resolved: true,
          })
        }
        continue // auto-resolve
      }

      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'lokal_hero') {
      if (updatedArc.phase === 'peak' && p) {
        const inboxId = `lokal_hero_inbox_${arc.id}`
        if (!arc.eventsFired.includes(inboxId)) {
          newInboxItems.push({
            id: `inbox_${inboxId}`,
            type: InboxItemType.Media,
            title: `📰 ${localPaper}: "${name} — ortens hjälte"`,
            body: `${name}s mål i derbyt har gjort honom till en legend i orten. ${managedClub?.name ?? 'Klubben'} fick en ovärderlig poäng.`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, inboxId] }
        }
      }
      if (updatedArc.phase === 'resolving') {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId) && p) {
          newStorylines.push({
            id: storylineId,
            type: 'lokal_hero_moment',
            season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
            playerId: p.id,
            description: `${name}s derby-mål blev säsongens folkligaste ögonblick.`,
            displayText: `🏠 ${name} — ortens hjälte`,
            resolved: true,
          })
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'hungrig_breakthrough') {
      if (updatedArc.phase === 'peak' && p) {
        // mutationVerificationGate-utökning (2026-08-25, Jacobs order: "30–60
        // min, gör den"): villkoret (gamesWithoutGoal >= 3) verifierades bara
        // vid TRIGGER (building-fasen). Utan denna reverifiering kunde
        // journalisten fråga "han har inte gjort mål på länge" trots att
        // spelaren gjort mål i en match MELLAN building och peak (2-4
        // omgångar senare) — exakt samma stale-claim-mönster som redan
        // reverifieras nedan i resolving-grenen, flyttat hit och körd innan
        // peak-eventet skapas.
        const completedSinceStart = game.fixtures.filter(
          f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
               f.status === 'completed' &&
               (f.matchday ?? 0) > arc.startedMatchday
        )
        const alreadyScored = completedSinceStart.some(f =>
          (f.events ?? []).some(e => e.type === 'goal' && e.playerId === arc.playerId)
        )
        const eventId = `hungrig_peak_event_${arc.id}`
        if (!alreadyScored && !arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `Journalisten frågar om ${name}`,
            body: `"Tror du fortfarande på ${name}? Han har inte gjort mål på länge och fansen undrar."`,
            choices: [
              {
                id: 'back_him',
                label: 'Han får tiden han behöver',
                // O2 lager 3 (Jacobs dom 2026-08-24): var ren boostMorale,
                // zero cost — dominerade pressure/alternatives fullständigt
                // (O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md). Behåller
                // samma +5 moral, kostar nu utvecklingstakt (developmentRate,
                // INTE potentialAbility — ett tak krymper inte för att
                // ingen tryckte på). Text låst av Jacob, ordagrant.
                subtitle: '💛 Moral +5 · utvecklingstakt −4',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: 5, targetPlayerId: p.id },
                    { type: 'developmentRateDelta', amount: -4, targetPlayerId: p.id },
                  ]),
                },
              },
              {
                id: 'pressure',
                label: 'Han måste leverera nu',
                subtitle: '💛 Moral −5',
                effect: { type: 'boostMorale', value: -5, targetPlayerId: p.id },
              },
              {
                id: 'alternatives',
                label: 'Vi har andra alternativ',
                subtitle: '💛 Moral −15',
                effect: { type: 'boostMorale', value: -15, targetPlayerId: p.id },
              },
            ],
            sender: { name: 'Journalist', role: 'Media' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving') {
        const completedSinceStart = game.fixtures.filter(
          f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
               f.status === 'completed' &&
               (f.matchday ?? 0) > arc.startedMatchday
        )
        const playerScored = completedSinceStart.some(f =>
          (f.events ?? []).some(e => e.type === 'goal' && e.playerId === arc.playerId)
        )
        if (playerScored && p) {
          const storylineId = `storyline_${arc.id}_resolved`
          if (!arc.eventsFired.includes(storylineId)) {
            newStorylines.push({
              id: storylineId,
              type: 'hungrig_breakthrough',
              season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
              playerId: p.id,
              description: `${name} bröt den långa målsvälten och levererade när det gällde som mest.`,
              displayText: `${name} bröt isen`,
              resolved: true,
            })
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'joker_redemption') {
      if (arc.phase === 'building' && p) {
        const inboxId = `joker_building_inbox_${arc.id}`
        if (!arc.eventsFired.includes(inboxId)) {
          newInboxItems.push({
            id: `inbox_${inboxId}`,
            type: InboxItemType.Media,
            title: `📰 ${localPaper}: "${name} — geni eller risk?"`,
            body: `${name}s senaste insats väcker frågor. Spelaren är oförutsägbar men talangfull. Fansen är delade.`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, inboxId] }
        }
      }

      if (updatedArc.phase === 'peak' && p) {
        const eventId = `joker_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `Styrelsen frågar om ${name}`,
            body: `Styrelsen undrar om ${name}s osäkerhet är värt risken. De vill ha ett klart besked om hans roll i laget.`,
            choices: [
              {
                id: 'back_joker',
                label: 'Jag tror på honom',
                // O2 lager 3 (Jacobs dom 2026-08-24): var ren boostMorale,
                // zero cost — dominerade bench_joker fullständigt. Behåller
                // samma +8 moral, kostar nu discipline (fältet
                // disciplineRisk redan läser i matchmotorn, matchCore.ts).
                // Text låst av Jacob, ordagrant.
                subtitle: '💛 Moral +8 · disciplin −4',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: 8, targetPlayerId: p.id },
                    { type: 'disciplineDelta', amount: -4, targetPlayerId: p.id },
                  ]),
                },
              },
              {
                id: 'bench_joker',
                label: 'Bänka nästa match',
                subtitle: 'Vilar nästa match · moral −10',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: -10, targetPlayerId: p.id },
                    { type: 'restPlayer', amount: 1, targetPlayerId: p.id },
                  ]),
                },
              },
            ],
            sender: { name: 'Styrelseordföranden', role: 'Styrelse' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving' && p) {
        const wasBenched = arc.decisionsMade.includes('bench_joker')
        if (!wasBenched && justCompletedFixture) {
          const events = justCompletedFixture.events ?? []
          const decisive = events.some(
            e => (e.type === 'goal' || e.type === 'assist') && e.playerId === p.id
          )
          if (decisive) {
            const storylineId = `storyline_${arc.id}_resolved`
            if (!arc.eventsFired.includes(storylineId)) {
              newStorylines.push({
                id: storylineId,
                type: 'joker_vindicated',
                season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
                playerId: p.id,
                description: `${name} avgjorde när det gällde och tystade alla kritiker.`,
                displayText: `${name} — joker i hjärtat`,
                resolved: true,
              })
            }
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'veteran_farewell') {
      if (updatedArc.phase === 'peak' && p) {
        const eventId = `veteran_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          // O1 kandidat 2, text låst av Jacob 2026-08-24. Två brödtextvarianter
          // — homegrown skriver ut {år} (careerStats.seasonsPlayed är sant
          // för en spelare som aldrig värvats), värvad gör det inte (ingen
          // pålitlig klubb-tenure-data finns för värvade spelare, se
          // BACKLOG.md "Datafält som saknas — år i klubben"). Ingen
          // {ersättare} — "den som väntar" räcker, mallen kräver den inte.
          const annualSalaryTkr = Math.round((p.salary * 12) / 1000)
          const seasonsInClub = p.careerStats?.seasonsPlayed ?? 0
          const body = p.isHomegrown
            ? `${name} fyller ${p.age} i vinter. Han har varit här i ${seasonsInClub} år och han vill ha två till. Han är inte bättre än den som väntar, men han är den de sjunger om. ${annualSalaryTkr} tkr i året, samma som förut.`
            : `${name} fyller ${p.age} i vinter och vill ha två år till. Han har varit här länge nog att folk vet var han bor. Han är inte bättre än den som väntar, men han är den de sjunger om. ${annualSalaryTkr} tkr i året, samma som förut.`
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `${name} vill stanna`,
            body,
            choices: [
              {
                id: 'extend_veteran',
                label: 'Förläng två år',
                // O1 kandidat 2 (Jacobs dom 2026-08-24): klackens mood är
                // KONSEKVENSEN av valet, inte ett villkor — favoritePlayerId
                // mäter en annan fråga (vem som är bäst just nu) och skulle
                // strukturellt nästan aldrig träffa en åldrande veteran.
                // +6 klackens stämning, godkänd magnitud — mindre än avskedets
                // −14: att behålla någon är förväntat, att släppa någon är
                // en händelse.
                subtitle: 'Kontrakt +2 år · klackens stämning +6',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'extendContract', targetPlayerId: p.id, contractYears: 2 },
                    { type: 'supporterMood', amount: 6 },
                  ]),
                },
              },
              {
                id: 'farewell_veteran',
                label: 'Tacka för sig',
                // Var tidigare bara boostMorale — "ett slut" gjorde honom
                // aldrig faktiskt free agent (samma klass av fel som let_go
                // hade, se veteranArcExtendAndLetGo.test.ts). releasePlayer
                // lagd till: konsekvensen är omedelbar, inte väntande på
                // säsongsslutets kontraktsutgång. −14 klackens stämning,
                // godkänd magnitud.
                subtitle: 'Spelaren lämnar · moral −20 · klackens stämning −14',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: -20, targetPlayerId: p.id },
                    { type: 'releasePlayer', targetPlayerId: p.id },
                    { type: 'supporterMood', amount: -14 },
                  ]),
                },
              },
            ],
            sender: { name: 'Journalist', role: 'Media' },
            relatedPlayerId: p.id,
            resolved: false,
            // O1 kandidat 2 (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md,
            // Jacobs dom 2026-08-24): mallens fem punkter — klacken (namngiven
            // institution, agerar via mood-konsekvensen), veteranen (redan
            // mött, satt i elvan), lönen/kontraktsåren (ett tal mot en känd
            // resurs), trupp+ekonomi+klack (tre system), keep vs release
            // (systemen pekar isär). systemhandelse:true, inte bara playerArc.
            systemhandelse: true,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving' && p) {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId)) {
          const extended = arc.decisionsMade.includes('extend_veteran')
          newStorylines.push({
            id: storylineId,
            type: extended ? 'veteran_stayed' : 'veteran_farewell',
            season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
            playerId: p.id,
            // O1 kandidat 2, utfallsraderna låsta av Jacob 2026-08-24 — den
            // sista meningen i avskedet ("Han sa att han förstod") är avsiktligt
            // det som gör beslutet dyrt.
            description: extended
              ? `${name} skriver på i omklädningsrummet. Någon hade tagit med tårta.`
              : `${name} tömde skåpet själv. Han sa att han förstod.`,
            displayText: extended
              ? `🏅 ${name} stannar — legenden lever`
              : `🏅 ${name}s sista säsong`,
            resolved: true,
          })
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'veteran_final_season') {
      // Dagboksanteckningar var 4:e omgång
      if (p) {
        const diaryId = `vetfinal_diary_${arc.id}_r${Math.floor(currentMatchday / 4)}`
        if (!arc.eventsFired.includes(diaryId) && currentMatchday > 0 && currentMatchday % 4 === 0) {
          // Text låst av Jacob 2026-08-25 (SANNINGEN-SAKNAS-fix): raderna
          // roterade tidigare på currentMatchday%4 — ingen koppling till
          // spelarens faktiska tillstånd. Grundas nu i morale/seasonForm.
          // Prioritetsordning: låg moral (mest angeläget) → hög moral →
          // stark form → svag form (fallback, matchar alltid). Moral-
          // trösklarna (<30/≥70) matchar etablerad konvention i kodbasen
          // (playerVoiceService.ts, eventFactories.ts isHighForm). seasonForm-
          // trösklarna (≥75/annars svag) saknar motsvarande prejudikat i
          // koden — satta symmetriskt kring basvärdet 60, flaggat öppet.
          const diaryText = p.morale < 30
            ? `${name} satt kvar en stund efter träningen. Ingen frågade varför.`
            : p.morale >= 70
              ? `${name} sa lite mer i omklädningsrummet idag. Laget lyssnar.`
              : p.seasonForm >= 75
                ? `${name} drev sista passet som om kroppen visste något.`
                : `${name} har börjat prata om vad som kommer sen. Ungdomslaget, kanske.`
          newInboxItems.push({
            id: `inbox_${diaryId}`,
            type: InboxItemType.Community,
            title: `📓 ${name}`,
            body: diaryText,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, diaryId] }
        }

        // Kapten-fråga i presskonferens (hanteras i pressConferenceService via is_captain + veteran)
        // Sista matchen ceremoni — om vid md 22 och inte avslutad
        if (currentMatchday >= 22 && updatedArc.phase !== 'resolving') {
          updatedArc = { ...updatedArc, phase: 'resolving' }
        }
      }

      if (updatedArc.phase === 'resolving' && p) {
        const storylineId = `storyline_${arc.id}_final`
        if (!arc.eventsFired.includes(storylineId)) {
          newStorylines.push({
            id: storylineId,
            type: 'veteran_farewell',
            season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
            playerId: p.id,
            description: `${name}s sista säsong. Publiken hyllar honom vid avslutet.`,
            displayText: `🏅 ${name} — en karriär på isen`,
            resolved: true,
          })
          const ceremonyId = `vetfinal_ceremony_${arc.id}`
          if (!arc.eventsFired.includes(ceremonyId)) {
            newEvents.push({
              id: ceremonyId,
              type: 'playerArc',
              title: `${name}s sista match`,
              body: `Sista omgången. Publiken vet. Laget vet. Dags att tacka av en spelare som gett allt.`,
              choices: [
                {
                  id: 'ceremony_flowers',
                  label: 'Blombukett och avtackning',
                  // O2 lager 3 (Jacobs dom 2026-08-24): var ren
                  // teamBoostMorale, zero cost — en strikt delmängdsöverlägsen
                  // effekt mot ceremony_simple (mer moral, fler spelare,
                  // gratis). Behåller samma +15 moral hela laget, kostar nu
                  // 10 000 kr (applyFinanceChange, income-subEffect). Text
                  // låst av Jacob, ordagrant.
                  subtitle: 'Lagets moral +15 · kostar 10 tkr',
                  effect: {
                    type: 'multiEffect',
                    subEffects: JSON.stringify([
                      { type: 'teamBoostMorale', amount: 15, targetClubId: game.managedClubId },
                      { type: 'income', amount: -10000 },
                    ]),
                  },
                },
                {
                  id: 'ceremony_simple',
                  label: 'Håll avtackningen enkel',
                  subtitle: '💛 Moral +5',
                  effect: { type: 'boostMorale', value: 5, targetPlayerId: p.id },
                },
              ],
              sender: { name: 'Truppen', role: 'Omklädningsrum' },
              relatedPlayerId: p.id,
              resolved: false,
            })
            updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, ceremonyId, storylineId] }
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ledare_crisis-progressionen BORTTAGEN i samma pass som triggern
    // (se kommentaren vid detectArcTriggers()) — captainSpeech (kanon)
    // hanterar hela kedjan själv, en enda GameEvent i postAdvanceEvents.ts,
    // ingen egen building/peak/resolving-fas behövs för den.

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'contract_drama') {
      if (updatedArc.phase === 'peak' && p) {
        // mutationVerificationGate-utökning (2026-08-25, Jacobs order, samma
        // pass som hungrig_breakthrough ovan): triggerns villkor (ett
        // pending, incoming bud från en annan klubb på spelaren) verifierades
        // bara vid TRIGGER. Utan reverifiering kunde peak-eventet påstå
        // "Rykten om intresse utifrån cirkulerar" trots att budet dragits
        // tillbaka/gått ut/besvarats 2-4 omgångar tidigare — samma
        // trigger-vs-verifiering-mönster som hungrig_breakthrough. Återanvänder
        // exakt samma filter som skapade arcen (raden ovan i denna fil).
        const stillHasPendingBid = game.transferBids.some(
          b => b.direction === 'incoming' && b.status === 'pending' &&
               b.sellingClubId === game.managedClubId && b.playerId === arc.playerId
        )
        const eventId = `contract_peak_event_${arc.id}`
        if (stillHasPendingBid && !arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `${name} ber om ett möte`,
            body: `${name} vill reda ut sin framtid. Rykten om intresse utifrån cirkulerar och han vill ha ett klart besked.`,
            choices: [
              {
                id: 'extend_now',
                label: 'Erbjud förlängning nu',
                subtitle: 'Kontrakt +1 år · moral +10',
                effect: { type: 'extendContract', targetPlayerId: p.id, contractYears: 1 },
              },
              {
                id: 'wait_drama',
                label: 'Vänta till säsongsslut',
                subtitle: 'Kontraktet oförändrat · moral −5',
                effect: { type: 'boostMorale', value: -5, targetPlayerId: p.id },
              },
              {
                id: 'let_go',
                label: 'Du får gå',
                subtitle: 'Spelaren lämnar · moral −25',
                // O2 lager 1 (Jacobs dom 2026-08-24): var enbart boostMorale
                // på spelaren som lämnar — "Du får gå" gjorde honom aldrig
                // faktiskt free agent, storylinetexten nedan (`${name} lämnade
                // klubben`) påstod något koden inte utförde. multiEffect
                // behåller den befintliga "💛 Moral −25"-texten oförändrad och
                // lägger till den faktiska borttagningen ur truppen.
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: -25, targetPlayerId: p.id },
                    { type: 'releasePlayer', targetPlayerId: p.id },
                  ]),
                },
              },
            ],
            sender: { name: name, role: 'Spelare' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving' && p) {
        const letGo = arc.decisionsMade.includes('let_go')
        if (letGo) {
          const storylineId = `storyline_${arc.id}_resolved`
          if (!arc.eventsFired.includes(storylineId)) {
            newStorylines.push({
              id: storylineId,
              type: 'contract_drama_resolved',
              season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
              playerId: p.id,
              description: `${name} lämnade klubben efter kontraktsstriden. En bitter upplösning.`,
              displayText: `📋 ${name} lämnade`,
              resolved: true,
            })
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // Fallback: keep arc unless resolving
    if (updatedArc.phase === 'resolving') {
      // DEV-003: generic arc-resolution inbox event for arcs without specific resolving logic
      if (updatedArc.playerId && arc.phase !== 'resolving') {
        const player = managedPlayers.find(pp => pp.id === updatedArc.playerId)
        if (player) {
          const resolvedId = `arc_resolved_generic_${updatedArc.id}`
          if (!arc.eventsFired.includes(resolvedId)) {
            const arcExitTexts: Partial<Record<string, string>> = {
              hungrig_breakthrough: `${player.firstName} ${player.lastName}s genombrott uteblev denna säsong. Men hungern finns kvar.`,
              veteran_farewell: `${player.firstName} ${player.lastName}s era tog slut. Tysta steg ut ur omklädningsrummet.`,
              lokal_hero: `${player.firstName} ${player.lastName} spelade sin roll. Orten minns.`,
              contract_drama: `Kontraktshistorien kring ${player.firstName} ${player.lastName} avslutades utan drama.`,
              derby_echo: `Derbykänslan har lagt sig. Nästa gång räknas igen.`,
            }
            const exitBody = arcExitTexts[updatedArc.type] ?? 'En berättelse i laget avslutades.'
            newInboxItems.push({
              id: `inbox_${resolvedId}`,
              type: InboxItemType.MediaEvent,
              title: `Berättelsen om ${player.firstName} ${player.lastName}`,
              body: exitBody,
              relatedPlayerId: player.id,
              isRead: false,
              date: currentDate,
            })
          }
        }
      }
      // Don't keep resolving arcs — they're done
    } else {
      updatedArcs.push(updatedArc)
    }
  }

  return { updatedArcs, newEvents, newInboxItems, newStorylines }
}
