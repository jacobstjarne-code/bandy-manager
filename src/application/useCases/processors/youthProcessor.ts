import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { YouthTeam } from '../../../domain/entities/Academy'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { InboxItemType } from '../../../domain/enums'
import { simulateYouthMatch } from '../../../domain/services/academyService'
import { mulberry32 } from '../../../domain/utils/random'

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

    inboxItems.push({
      id: `inbox_p17_r${nextMatchday}_${game.currentSeason}`,
      date: newDate,
      type: InboxItemType.YouthP17,
      title: `📋 P19 ${resultStr} mot ${matchResult.opponentName} ${scoreStr}`,
      body: `Pojklaget ${resultStr} mot ${matchResult.opponentName} med ${scoreStr}.${scorerStr}${bestStr}\n${tableStr}${scoutNote}`,
      isRead: false,
    } as InboxItem)
  }

  // ── Mentor effects per round ───────────────────────────────────────────────
  let mentorUpdatedYouthPlayers = updatedYouthTeam?.players ?? []
  const activeMentorships = (game.mentorships ?? []).filter(m => m.isActive)
  for (const m of activeMentorships) {
    const mentor = availabilityUpdatedPlayers.find(p => p.id === m.seniorPlayerId)
    if (!mentor) continue
    const youthIdx = mentorUpdatedYouthPlayers.findIndex(p => p.id === m.youthPlayerId)
    if (youthIdx >= 0 && mentor.form >= 40) {
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
    const conflictPlayers = updatedYouthTeam?.players.filter(p => p.schoolConflict) ?? []
    if (conflictPlayers.length > 0 && localRand() < 0.12) {
      const player = conflictPlayers[Math.floor(localRand() * conflictPlayers.length)]
      gameEvents.push({
        id: `event_school_conflict_${player.id}_${nextMatchday}`,
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

  // ── WEAK-017: Breakthrough event — young player debut + goal ─────────────────
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
      if ((player.careerStats?.totalGames ?? 0) > 3) continue
      const breakthroughId = `event_breakthrough_${player.id}_${nextMatchday}`
      const alreadyFired = (game.pendingEvents ?? []).some(e => e.id === breakthroughId) ||
        (game.resolvedEventIds ?? []).includes(breakthroughId)
      if (alreadyFired) continue
      const opponentId = latestManaged.homeClubId === game.managedClubId
        ? latestManaged.awayClubId : latestManaged.homeClubId
      const opponent = game.clubs.find(c => c.id === opponentId)
      gameEvents.push({
        id: breakthroughId,
        type: 'academyEvent',
        title: `${player.firstName} ${player.lastName} bryter igenom`,
        body: `I debuten mot ${opponent?.name ?? 'motståndaren'}. Minut ${goal.minute ?? '?'}. ${player.age} år gammal. Akademitränaren har ringt redan. "Han har varit den mest hungrige på träning i två år. Det är inte tur."`,
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
