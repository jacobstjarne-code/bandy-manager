import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { ActiveArc, ArcType, StorylineEntry } from '../entities/Narrative'
import type { GameEvent } from '../entities/GameEvent'
import { InboxItemType } from '../enums'
import { getRivalry } from '../data/rivalries'
import { mulberry32 } from '../utils/random'

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
  if (!hasArcType('hungrig_breakthrough') && canAddArc()) {
    const hungrigPlayers = managedPlayers.filter(
      p => p.trait === 'hungrig' && p.age <= 21 && !activePlayerIds.has(p.id)
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
      const hadSuspension = events.some(e => e.type === 'suspension' && e.playerId === p.id)
      if (hadSuspension) {
        newArcs.push({
          id: genId('arc', currentMatchday, `joker_${p.id}`),
          type: 'joker_redemption',
          playerId: p.id,
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
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 8,
      })
    }
  }

  // ── ledare_crisis ── (förlustsvit ≥ 3)
  if (!hasArcType('ledare_crisis') && canAddArc()) {
    const recentResults = completedManagedFixtures
      .slice(-5)
      .map(f => {
        const isHome = f.homeClubId === game.managedClubId
        const our = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
        const their = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
        return our < their ? 'loss' : our > their ? 'win' : 'draw'
      })
    const lossStreak = (() => {
      let streak = 0
      for (let i = recentResults.length - 1; i >= 0; i--) {
        if (recentResults[i] === 'loss') streak++
        else break
      }
      return streak
    })()

    if (lossStreak >= 3) {
      const ledare = managedPlayers.find(
        p => (p.trait === 'ledare' || p.trait === 'veteran') && !activePlayerIds.has(p.id)
      )
      if (ledare) {
        newArcs.push({
          id: genId('arc', currentMatchday, `ledare_${ledare.id}`),
          type: 'ledare_crisis',
          playerId: ledare.id,
          startedMatchday: currentMatchday,
          phase: 'building',
          eventsFired: [],
          decisionsMade: [],
          expiresMatchday: currentMatchday + 4,
          data: { lossStreak },
        })
      }
    }
  }

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

  // ── contract_drama ── (≥ 2 speculation messages in inbox about same player)
  if (!hasArcType('contract_drama') && canAddArc()) {
    const speculationInbox = game.inbox.filter(
      i => i.type === InboxItemType.Media && i.body.toLowerCase().includes('spekulationer')
    )
    const playerSpecCount: Record<string, number> = {}
    for (const item of speculationInbox) {
      if (item.relatedPlayerId) {
        playerSpecCount[item.relatedPlayerId] = (playerSpecCount[item.relatedPlayerId] ?? 0) + 1
      }
    }
    for (const [playerId, count] of Object.entries(playerSpecCount)) {
      if (count >= 2 && !activePlayerIds.has(playerId)) {
        const p = managedPlayers.find(pp => pp.id === playerId)
        if (p && p.form > 65) {
          newArcs.push({
            id: genId('arc', currentMatchday, `contract_${p.id}`),
            type: 'contract_drama',
            playerId: p.id,
            startedMatchday: currentMatchday,
            phase: 'building',
            eventsFired: [],
            decisionsMade: [],
            expiresMatchday: currentMatchday + 6,
          })
          break
        }
      }
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
            matchday: currentMatchday,
            description: derbyResult === 'win'
              ? `Derbysegern mot ${opponentName} satte tonen för resten av säsongen.`
              : `Derby-förlusten mot ${opponentName} satt kvar länge i omklädningsrummet.`,
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
            matchday: currentMatchday,
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
        const eventId = `hungrig_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `Journalisten frågar om ${name}`,
            body: `"Tror du fortfarande på ${name}? Han har inte gjort mål på länge och fansen undrar."`,
            choices: [
              {
                id: 'back_him',
                label: 'Han får tiden han behöver',
                subtitle: '💛 Moral +5',
                effect: { type: 'boostMorale', value: 5, targetPlayerId: p.id },
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
              matchday: currentMatchday,
              playerId: p.id,
              description: `${name} bröt den långa målsvälten och levererade när det gällde som mest.`,
              displayText: `🔥 ${name} bröt isen`,
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
                subtitle: '💛 Moral +8',
                effect: { type: 'boostMorale', value: 8, targetPlayerId: p.id },
              },
              {
                id: 'bench_joker',
                label: 'Bänka tills vidare',
                subtitle: '💛 Moral −10',
                effect: { type: 'boostMorale', value: -10, targetPlayerId: p.id },
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
                matchday: currentMatchday,
                playerId: p.id,
                description: `${name} avgjorde när det gällde och tystade alla kritiker.`,
                displayText: `🎭 ${name} — joker i hjärtat`,
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
          const seasons = p.seasonHistory?.length ?? 0
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `Pressen frågar om ${name}s framtid`,
            body: `"Hur ser framtiden ut för ${name}? Han har ${seasons} säsonger bakom sig och kontraktet löper ut."`,
            choices: [
              {
                id: 'extend_veteran',
                label: 'Han är en legend — vi förlänger',
                subtitle: '💛 Moral +10',
                effect: { type: 'boostMorale', value: 10, targetPlayerId: p.id },
              },
              {
                id: 'farewell_veteran',
                label: 'Alla goda ting har ett slut',
                subtitle: '💛 Moral −20',
                effect: { type: 'boostMorale', value: -20, targetPlayerId: p.id },
              },
              {
                id: 'wait_veteran',
                label: 'Vi utvärderar efter säsongen',
                subtitle: 'Ingen effekt nu',
                effect: { type: 'noOp' },
              },
            ],
            sender: { name: 'Journalist', role: 'Media' },
            relatedPlayerId: p.id,
            resolved: false,
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
            matchday: currentMatchday,
            playerId: p.id,
            description: extended
              ? `${name} förlängde kontraktet. Legenden fortsätter sin resa med klubben.`
              : `${name}s kontrakt löper ut. En era tar slut.`,
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
    if (arc.type === 'ledare_crisis') {
      if (arc.phase === 'building' && p) {
        const inboxId = `ledare_building_inbox_${arc.id}`
        if (!arc.eventsFired.includes(inboxId)) {
          newInboxItems.push({
            id: `inbox_${inboxId}`,
            type: InboxItemType.Community,
            title: 'Kaptenen har samlat spelarna',
            body: `${name} tog initiativet efter förlusterna och kallade till spelarmöte. Omklädningsrummet svarar.`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, inboxId] }
        }
      }

      if (updatedArc.phase === 'peak' && p) {
        const eventId = `ledare_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `${name} vill prata`,
            body: `${name} ber om ett möte. Han har synpunkter om lagets krisperiod och vill ta ett ansvar.`,
            choices: [
              {
                id: 'give_word',
                label: 'Ge honom ordet',
                subtitle: '💛 Moral +10 alla spelare',
                effect: {
                  type: 'teamBoostMorale',
                  value: 10,
                  targetClubId: game.managedClubId,
                },
              },
              {
                id: 'take_charge',
                label: 'Jag sköter det',
                subtitle: '💛 Kaptenens moral −5',
                effect: { type: 'boostMorale', value: -5, targetPlayerId: p.id },
              },
            ],
            sender: { name: name, role: 'Kapten' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving' && p) {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId)) {
          newStorylines.push({
            id: storylineId,
            type: 'captain_rallied_team',
            season: game.currentSeason,
            matchday: currentMatchday,
            playerId: p.id,
            description: `${name} steg upp under krisperioden och samlade laget.`,
            displayText: `🦁 ${name} samlade laget`,
            resolved: true,
          })
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'contract_drama') {
      if (updatedArc.phase === 'peak' && p) {
        const eventId = `contract_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: `${name} ber om ett möte`,
            body: `${name} vill reda ut sin framtid. Rykten om intresse utifrån cirkulerar och han vill ha ett klart besked.`,
            choices: [
              {
                id: 'extend_now',
                label: 'Erbjud förlängning nu',
                subtitle: '✅ Spekulationer upphör · Moral +10',
                effect: { type: 'boostMorale', value: 10, targetPlayerId: p.id },
              },
              {
                id: 'wait_drama',
                label: 'Vänta till säsongsslut',
                subtitle: '⚠️ Risk för avhopp · Moral −5',
                effect: { type: 'boostMorale', value: -5, targetPlayerId: p.id },
              },
              {
                id: 'let_go',
                label: 'Du får gå',
                subtitle: '💛 Moral −25',
                effect: { type: 'boostMorale', value: -25, targetPlayerId: p.id },
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
              matchday: currentMatchday,
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
            newInboxItems.push({
              id: `inbox_${resolvedId}`,
              type: InboxItemType.MediaEvent,
              title: `Berättelsen om ${player.firstName} ${player.lastName}`,
              body: 'En berättelse i laget avslutades.',
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
