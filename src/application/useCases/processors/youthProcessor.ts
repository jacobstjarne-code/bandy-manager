import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { YouthTeam } from '../../../domain/entities/Academy'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { InboxItemType } from '../../../domain/enums'
import { simulateYouthMatch } from '../../../domain/services/academyService'
import { mulberry32 } from '../../../domain/utils/random'
import { MENTOR_FORM_THRESHOLD } from '../../../domain/services/mentorshipConstants'
import { academyBreakthroughQuote } from '../../../domain/data/academyBreakthroughText'
import { generateAcademySchoolPartnershipEvent } from '../../../domain/services/academySchoolPartnershipService'

export interface YouthProcessorResult {
  updatedYouthTeam: YouthTeam | undefined
  academyReputationDelta: number
  inboxItems: InboxItem[]
  gameEvents: GameEvent[]
}

/**
 * Processes P19 youth match simulation, mentor effects, academy events, and reputation update.
 *
 * @param availabilityUpdatedPlayers - Players after availability updates (for mentor effects)
 * @param nextMatchday - The matchday number being processed
 * @param newDate - ISO date string for this round
 * @param baseSeed - Base seed for deterministic randomness
 * @param localRand - Seeded random function from outer round
 */
export function processYouth(
  game: SaveGame,
  availabilityUpdatedPlayers: Player[],
  nextMatchday: number,
  newDate: string,
  baseSeed: number,
  localRand: () => number,
): YouthProcessorResult {
  const inboxItems: InboxItem[] = []
  const gameEvents: GameEvent[] = []

  // ── P19 Youth match simulation (every other round) ──────────────────────
  let updatedYouthTeam = game.youthTeam
  if (nextMatchday % 2 === 0 && game.youthTeam && game.youthTeam.players.length > 0) {
    const youthSeed = baseSeed + nextMatchday * 97
    const youthRand = mulberry32(youthSeed)
    const youthSim = simulateYouthMatch(game.youthTeam, game.academyLevel ?? 'basic', youthRand, nextMatchday)

    updatedYouthTeam = {
      ...game.youthTeam,
      players: youthSim.updatedPlayers,
      results: [...game.youthTeam.results.slice(-10), youthSim.matchResult],
      seasonRecord: youthSim.updatedRecord,
      tablePosition: youthSim.updatedPosition,
    }

    const { matchResult } = youthSim
    const won = matchResult.goalsFor > matchResult.goalsAgainst
    const drew = matchResult.goalsFor === matchResult.goalsAgainst
    const resultStr = won ? 'vann' : drew ? 'spelade oavgjort' : 'förlorade'
    const scoreStr = `${matchResult.goalsFor}–${matchResult.goalsAgainst}`
    const scorerStr = matchResult.scorers.length > 0
      ? `\nMålgörare: ${matchResult.scorers.join(', ')}.`
      : ''
    const bestStr = matchResult.bestPlayer ? `\n${matchResult.bestPlayer} utsågs till matchens spelare.` : ''
    const record = youthSim.updatedRecord
    const tableStr = `Laget ligger ${youthSim.updatedPosition}:a i ungdomsserien (${record.w}V ${record.d}O ${record.l}F).`

    const readyPlayers = youthSim.updatedPlayers.filter(p => p.readyForPromotion)
    const scoutNote = readyPlayers.length > 0
      ? `\n\n⭐ SCOUTRAPPORTEN: ${readyPlayers[0].firstName} ${readyPlayers[0].lastName} (${readyPlayers[0].age} år) börjar bli mogen för A-truppen.`
      : ''

    const youthMatchSummary = `P19 ${resultStr} mot ${matchResult.opponentName} ${scoreStr}`
    inboxItems.push({
      id: `inbox_p17_r${nextMatchday}_${game.currentSeason}`,
      date: newDate,
      type: InboxItemType.YouthP17,
      title: youthMatchSummary,
      body: `Pojklaget ${resultStr} mot ${matchResult.opponentName} med ${scoreStr}.${scorerStr}${bestStr}\n${tableStr}${scoutNote}`,
      isRead: false,
      youthMatchSummary,
    } as InboxItem)
  }

  // ── Mentor effects per round ───────────────────────────────────────────────
  let mentorUpdatedYouthPlayers = updatedYouthTeam?.players ?? []
  const activeMentorships = (game.mentorships ?? []).filter(m => m.isActive)
  for (const m of activeMentorships) {
    const mentor = availabilityUpdatedPlayers.find(p => p.id === m.seniorPlayerId)
    if (!mentor) continue
    const youthIdx = mentorUpdatedYouthPlayers.findIndex(p => p.id === m.youthPlayerId)
    if (youthIdx >= 0 && mentor.form >= MENTOR_FORM_THRESHOLD) {
      const devBoost = mentor.discipline / 20
      mentorUpdatedYouthPlayers = mentorUpdatedYouthPlayers.map((p, i) => i === youthIdx ? {
        ...p,
        developmentRate: Math.min(100, p.developmentRate + devBoost * 0.1),
        confidence: Math.min(100, p.confidence + 1),
      } : p)
    }
  }
  if (updatedYouthTeam) {
    updatedYouthTeam = { ...updatedYouthTeam, players: mentorUpdatedYouthPlayers }
  }

  // ── Academy events ────────────────────────────────────────────────────────
  if (game.youthTeam && nextMatchday >= 3 && nextMatchday <= 18) {
    const allKnownEventIds = [
      ...(game.resolvedEventIds ?? []),
      ...(game.pendingEvents ?? []).map(event => event.id),
      ...(game.deferredDecisions ?? []).map(event => event.id),
    ]
    const conflictPlayers = updatedYouthTeam?.players.filter(player => {
      if (!player.schoolConflict) return false
      const seasonPrefix = `event_school_conflict_${player.id}_s${game.currentSeason}_`
      return !allKnownEventIds.some(id => id.startsWith(seasonPrefix))
    }) ?? []
    if (conflictPlayers.length > 0 && localRand() < 0.12) {
      const player = conflictPlayers[Math.floor(localRand() * conflictPlayers.length)]
      gameEvents.push({
        id: `event_school_conflict_${player.id}_s${game.currentSeason}_m${nextMatchday}`,
        type: 'communityEvent',
        title: `Skolkonflikt — ${player.firstName} ${player.lastName}`,
        body: `${player.firstName} har nationellt prov imorgon. Han missar träningen om han pluggar.`,
        relatedPlayerId: player.id,
        choices: [
          { id: 'let_study', label: 'Låt honom plugga', subtitle: '📚 +confidence', effect: { type: 'noOp' } },
          { id: 'train', label: 'Han bör komma på träningen', subtitle: '⚠️ −confidence', effect: { type: 'noOp' } },
        ],
        resolved: false,
      })
    }
  }

  if (game.youthTeam && (nextMatchday === 8 || nextMatchday === 15)) {
    const callupCandidates = updatedYouthTeam?.players.filter(p => p.potentialAbility > 50) ?? []
    if (callupCandidates.length >= 1) {
      const selected = callupCandidates.slice(0, Math.min(2, callupCandidates.length))
      const names = selected.map(p => `${p.firstName} ${p.lastName}`).join(' och ')
      const pronoun = selected.length === 1 ? 'Han' : 'De'
      gameEvents.push({
        id: `event_district_callup_${nextMatchday}_${game.currentSeason}`,
        type: 'communityEvent',
        title: `Juniorlandslagssamling — ${names}`,
        body: `${names} är kallade till Sveriges P19-samling. ${pronoun} missar 2 P19-matcher men kan få värdefull landslagserfarenhet.`,
        // M3: exakt de spelare kortet namnger — resolvern (eventResolver.ts)
        // ska verka på dessa, inte återfiltrera potentialAbility>50 på nytt.
        selectedPlayerIds: selected.map(p => p.id),
        choices: [
          {
            id: 'send',
            label: selected.length === 1 ? 'Skicka honom' : 'Skicka dem',
            subtitle: `🏆 +confidence, +utveckling · Ej tillgänglig 2 omg`,
            effect: { type: 'noOp' },
          },
          {
            id: 'keep',
            label: 'Behåll i klubben',
            subtitle: '⚠️ −confidence (missad landslagschans)',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  const academySchoolPartnership = generateAcademySchoolPartnershipEvent(
    game,
    nextMatchday,
    baseSeed + 61_006,
  )
  if (academySchoolPartnership) gameEvents.push(academySchoolPartnership)

  // ── WEAK-017: Breakthrough event — young player debut + goal ─────────────────
  //
  // HIGH 8 (audit 2026-08-29). Rotorsak till att samma debuttext återkom 4+ ggr
  // per säsong: `latestManaged` är "senast spelade managed-match i HELA säsongen",
  // inte "matchen som spelades denna omgång" (`game` är förrunds-saven — dess
  // fixtures innehåller aldrig den match som simuleras just nu). Så länge klubben
  // inte hunnit spela en NY match återfann varje omgång exakt samma fixture och
  // samma mål — och eftersom event-id:t bar `nextMatchday` blev id:t nytt varje
  // gång, så alreadyFired-spärren bet aldrig.
  //
  // Tre lager i fixen, som tillsammans ger "högst en gång per spelare, någonsin":
  //  1. Event-id utan matchdag → stabilt per spelare, så resolvedEventIds/
  //     pendingEvents-spärren faktiskt bet inom det fönster där samma fixture
  //     återfinns. (resolvedEventIds är cappad till 200 i eventResolver.ts och
  //     är därför inte ensam en evig spärr — därav lager 2.)
  //  2. `totalGames === 1` — verklig förstamatch. `game.players` bär statistiken
  //     T.O.M. `latestManaged` (statsProcessor har redan fällt in den föregående
  //     omgången), så 1 betyder "matchen vi tittar på var hans första". Så snart
  //     spelaren spelat match två blir villkoret permanent falskt — det är det
  //     som gör spärren evig, oberoende av 200-cappen.
  //  3. `promotedFromAcademy` — samma "äkta debut"-grind som statsProcessor.ts:178
  //     redan använder för dagboksdebuten. En ung extern värvning ska inte få
  //     "akademitränaren har ringt redan".
  const managedCompletedThisRound = game.fixtures.filter(
    f => f.status === 'completed' &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  const latestManaged = [...managedCompletedThisRound].sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))[0]
  if (latestManaged) {
    const goals = latestManaged.events.filter(e => e.type === 'goal' && e.playerId)
    for (const goal of goals) {
      const player = game.players.find(p => p.id === goal.playerId)
      if (!player) continue
      if (player.clubId !== game.managedClubId) continue
      if (player.age > 21) continue
      // Akademiprodukt, inte ung extern värvning (lager 3 ovan).
      if (!player.promotedFromAcademy) continue
      // Verklig första seniormatch (lager 2 ovan) — inte "någon av de tre första".
      if ((player.careerStats?.totalGames ?? 0) !== 1) continue
      const breakthroughId = `event_breakthrough_${player.id}`
      const alreadyFired = (game.pendingEvents ?? []).some(e => e.id === breakthroughId) ||
        (game.resolvedEventIds ?? []).includes(breakthroughId)
      if (alreadyFired) continue
      const opponentId = latestManaged.homeClubId === game.managedClubId
        ? latestManaged.awayClubId : latestManaged.homeClubId
      const opponent = game.clubs.find(c => c.id === opponentId)
      gameEvents.push({
        id: breakthroughId,
        type: 'academyEvent',
        // Kortet routes till Granska → Spelare. Bär samma canonical id som
        // premissen redan bygger på så spelarytan kan visa vem händelsen gäller.
        relatedPlayerId: player.id,
        title: `${player.firstName} ${player.lastName} slår igenom`,
        body: `I debuten mot ${opponent?.name ?? 'motståndaren'}. Minut ${goal.minute ?? '?'}. ${player.age} år gammal. Akademitränaren har ringt redan. "${academyBreakthroughQuote(player.id)}"`,
        choices: [{ id: 'ack', label: 'Grattis akademin', effect: { type: 'noOp' } }],
        resolved: false,
      })
      break // max ett breakthrough-event per omgång
    }
  }

  // ── Academy reputation delta ───────────────────────────────────────────────
  const academyReputationDelta = (() => {
    if (!game.youthTeam || !updatedYouthTeam) return 0
    const newWins = updatedYouthTeam.seasonRecord.w - game.youthTeam.seasonRecord.w
    return newWins > 0 ? 1 : 0
  })()

  return { updatedYouthTeam, academyReputationDelta, inboxItems, gameEvents }
}
