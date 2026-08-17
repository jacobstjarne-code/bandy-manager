import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { MatchEvent, TeamSelection, MatchReport, ManagerChoiceEntry } from '../../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus, InboxItemType } from '../../../domain/enums'
import { calculateStandings } from '../../../domain/services/standingsService'
import { updateCupBracketAfterRound, generateNextCupRound } from '../../../domain/services/cupService'
import { stampFixturesFromCalendar } from '../../../domain/services/scheduleGenerator'
import { updateSeriesAfterMatch, advancePlayoffRound } from '../../../domain/services/playoffService'
import { isPlayoffNarrativeCardStillValid } from '../../../domain/services/playoffNarrativeService'
import { simulateMatch } from '../../../domain/services/matchEngine'
import { fixtureSeed } from '../../../domain/utils/random'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

/**
 * A3 (2026-08-17, LÅNGSPEL-audit): saveLiveMatchResult/concedeWalkover
 * advancerar playoffBracket direkt (samma domänfunktioner som
 * playoffProcessor.ts använder) men går ALDRIG via processPlayoffRound —
 * roundProcessor.ts's staleEventIds-mekanism (H-02) ser därför aldrig denna
 * fasövergång och kan inte rensa ett kort som blivit ogiltigt precis nu.
 * Om spelaren spelar sin avgörande slutspelsmatch LIVE och bracketen därmed
 * hoppar förbi ett skede (t.ex. semifinal→final när båda semifinalerna
 * avgörs i samma anrop) hinner Portalen visa det gamla kortet innan någon
 * advanceToNextEvent-omgång ens körts. Samma bracket-giltighetsgrind som
 * roundProcessor.ts (isPlayoffNarrativeCardStillValid) appliceras här, direkt
 * vid mutationstillfället — det är den faktiska konsumtionstidpunkten:
 * Portalen läser game.pendingEvents/deferredDecisions nästa gång den renderas,
 * inte först vid nästa advance().
 */
function purgeStalePlayoffCards(game: SaveGame, bracket: SaveGame['playoffBracket']): Pick<SaveGame, 'pendingEvents' | 'deferredDecisions'> {
  return {
    pendingEvents: (game.pendingEvents ?? []).filter(e => isPlayoffNarrativeCardStillValid(e.id, bracket, game.managedClubId)),
    deferredDecisions: (game.deferredDecisions ?? []).filter(e => isPlayoffNarrativeCardStillValid(e.id, bracket, game.managedClubId)),
  }
}

export function matchActions(get: Get, set: Set) {
  return {
    saveLiveMatchResult: (
      fixtureId: string,
      homeScore: number,
      awayScore: number,
      events: MatchEvent[],
      report: MatchReport,
      homeLineup: TeamSelection,
      awayLineup: TeamSelection,
      overtimeResult?: 'home' | 'away',
      penaltyResult?: { home: number; away: number },
      attendance?: number,
      halftimeDecision?: 'lugna' | 'pressa' | 'prata',
    ) => {
      const { game } = get()
      if (!game) return

      // ── T3: managerChoiceLog ────────────────────────────────────────────────
      // Build log from lineup + halftime decision. Raw data only — no
      // player text, no rendering. After-match receipt (Ticket #4) will consume.
      const managedClubId = game.managedClubId
      const isHome = game.fixtures.find(f => f.id === fixtureId)?.homeClubId === managedClubId
      const myLineup = isHome ? homeLineup : awayLineup
      const choiceLog: ManagerChoiceEntry[] = []

      // captain — read from game.captainPlayerId (same field the engine uses)
      if (game.captainPlayerId) {
        choiceLog.push({ type: 'captain', playerId: game.captainPlayerId, detail: game.captainPlayerId })
      }

      // started_tired: starters with condition < 40
      for (const pid of (myLineup?.startingPlayerIds ?? [])) {
        const player = game.players.find(p => p.id === pid)
        if (player && (player.fitness ?? 100) < 40) {
          choiceLog.push({
            type: 'started_tired',
            playerId: pid,
            detail: `condition_${Math.round(player.fitness ?? 0)}`,
          })
        }
      }

      // bench_fit: bench players with condition > 80
      for (const pid of (myLineup?.benchPlayerIds ?? [])) {
        const player = game.players.find(p => p.id === pid)
        if (player && (player.fitness ?? 100) > 80) {
          choiceLog.push({
            type: 'bench_fit',
            playerId: pid,
            detail: `condition_${Math.round(player.fitness ?? 0)}`,
          })
        }
      }

      // halftime_tactic: prefer threaded param (live path sets it); fall back to store field (non-live path)
      const htDecision = halftimeDecision ?? game.lastHalftimeDecision
      if (htDecision) {
        const detailMap = {
          lugna: 'lowered_tempo',
          pressa: 'increased_pressure',
          prata: 'player_talk',
        } as const
        choiceLog.push({
          type: 'halftime_tactic',
          detail: detailMap[htDecision],
        })
      }

      const enrichedReport: MatchReport = {
        ...report,
        managerChoiceLog: choiceLog.length > 0 ? choiceLog : undefined,
      }
      // ── end T3 ──────────────────────────────────────────────────────────────

      const updatedFixtures = game.fixtures.map(f =>
        f.id === fixtureId
          ? {
              ...f, homeScore, awayScore, events, report: enrichedReport, homeLineup, awayLineup,
              attendance: attendance ?? f.attendance,
              status: FixtureStatus.Completed,
              wentToOvertime: (overtimeResult !== undefined || penaltyResult !== undefined) || undefined,
              wentToPenalties: penaltyResult !== undefined || undefined,
              overtimeResult,
              penaltyResult,
            }
          : f
      )
      const completedFixtures = updatedFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
      const standings = calculateStandings(game.league.teamIds, completedFixtures)

      const completedCupFixture = updatedFixtures.find(f => f.id === fixtureId && f.isCup)
      let updatedCupBracket = game.cupBracket ?? null
      if (completedCupFixture && updatedCupBracket && !updatedCupBracket.completed) {
        updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, [completedCupFixture])

        const playedMatch = updatedCupBracket.matches.find(m => m.fixtureId === completedCupFixture.id)
        const round = playedMatch?.round ?? 0

        if (round === 4) {
          // Cup final decided
          const finalMatch = updatedCupBracket.matches.find(m => m.round === 4 && m.winnerId)
          if (finalMatch) {
            updatedCupBracket = { ...updatedCupBracket, winnerId: finalMatch.winnerId, completed: true }
          }
        } else if (round > 0) {
          // Non-final round: if all matches in this round have a winner, generate next round inline.
          // Mirrors playoff branch logic so nextMatchday sees cup-R(n+1) before liga fixtures.
          const roundMatches = updatedCupBracket.matches.filter(m => m.round === round)
          if (roundMatches.every(m => m.winnerId)) {
            const { updatedBracket, newFixtures } = generateNextCupRound(updatedCupBracket, round, game.currentSeason)
            const stamped = stampFixturesFromCalendar(newFixtures, game.seasonCalendar ?? [])
            updatedCupBracket = updatedBracket
            if (stamped.length > 0) updatedFixtures.push(...stamped)
          }
        }
      }

      const completedFixture = updatedFixtures.find(f => f.id === fixtureId)!
      let updatedPlayoffBracket = game.playoffBracket
      if (completedFixture.isKnockout && !completedFixture.isCup && updatedPlayoffBracket) {
        updatedPlayoffBracket = {
          ...updatedPlayoffBracket,
          quarterFinals: updatedPlayoffBracket.quarterFinals.map(s =>
            s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completedFixture) : s
          ),
          semiFinals: updatedPlayoffBracket.semiFinals.map(s =>
            s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completedFixture) : s
          ),
          final: updatedPlayoffBracket.final && updatedPlayoffBracket.final.fixtures.includes(fixtureId)
            ? updateSeriesAfterMatch(updatedPlayoffBracket.final, completedFixture)
            : updatedPlayoffBracket.final,
        }

        const phaseComplete = (() => {
          if (updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals)
            return updatedPlayoffBracket.quarterFinals.every(s => s.winnerId !== null)
          if (updatedPlayoffBracket.status === PlayoffStatus.SemiFinals)
            return updatedPlayoffBracket.semiFinals.every(s => s.winnerId !== null)
          if (updatedPlayoffBracket.status === PlayoffStatus.Final)
            return updatedPlayoffBracket.final?.winnerId !== null
          return false
        })()

        if (phaseComplete) {
          const nextRoundStart = updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals ? 26
            : updatedPlayoffBracket.status === PlayoffStatus.SemiFinals ? 29 : 32
          const currentMaxMatchday = Math.max(0, ...updatedFixtures.map(f => f.matchday ?? 0))
          const { bracket: advancedBracket, newFixtures: newPlayoffFixtures } =
            advancePlayoffRound(updatedPlayoffBracket, game.currentSeason, nextRoundStart, currentMaxMatchday + 1)
          updatedPlayoffBracket = advancedBracket
          if (newPlayoffFixtures.length > 0) {
            updatedFixtures.push(...newPlayoffFixtures)
          }
        }
      }

      // A3: bracket may have just been advanced directly above (bypassing
      // processPlayoffRound) — re-derive playoff-card validity now, at the
      // real consumption point, not just on the next advanceToNextEvent().
      const playoffCardCleanup = purgeStalePlayoffCards(game, updatedPlayoffBracket)

      set({ game: { ...game, fixtures: updatedFixtures, lastCompletedFixtureId: fixtureId, standings, cupBracket: updatedCupBracket, playoffBracket: updatedPlayoffBracket, managedClubPendingLineup: undefined, lastHalftimeDecision: undefined, ...playoffCardCleanup } })
    },

    simulateAbandonedMatch: (fixtureId: string) => {
      const { game } = get()
      if (!game) return
      const fixture = game.fixtures.find(f => f.id === fixtureId)
      if (!fixture || fixture.status === 'completed') return  // idempotent
      if (!fixture.homeLineup || !fixture.awayLineup) return

      const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
      const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
      const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
      const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)

      const result = simulateMatch({
        fixture,
        homeLineup: fixture.homeLineup,
        awayLineup: fixture.awayLineup,
        homePlayers,
        awayPlayers,
        seed: fixtureSeed(fixture.id),
        homeClubName: homeClub?.name,
        awayClubName: awayClub?.name,
        isPlayoff: fixture.isKnockout,
        managedIsHome: fixture.homeClubId === game.managedClubId,
      })

      const completed = result.fixture
      const updatedFixtures = game.fixtures.map(f => f.id === fixtureId ? completed : f)
      const completedLeague = updatedFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
      const standings = calculateStandings(game.league.teamIds, completedLeague)

      const isHome = fixture.homeClubId === game.managedClubId
      const managedScore = isHome ? completed.homeScore ?? 0 : completed.awayScore ?? 0
      const oppScore     = isHome ? completed.awayScore ?? 0 : completed.homeScore ?? 0
      const opponent = game.clubs.find(c => c.id === (isHome ? fixture.awayClubId : fixture.homeClubId))

      const matchResult: 'win' | 'draw' | 'loss' =
        managedScore > oppScore ? 'win' : managedScore < oppScore ? 'loss' : 'draw'
      const score = `${managedScore}–${oppScore}`
      const coach = game.assistantCoach
      const coachBody = coach
        ? generateCoachQuote(coach, { type: 'match-result', result: matchResult, score }, fixtureSeed(fixtureId))
        : `Du lämnade matchen innan den var klar. Assistenten tog över. Resultat: ${score}.`

      const inboxItem: InboxItem = {
        id: `abandoned_match_${fixtureId}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: coach ? `${coach.name} · ${opponent?.shortName ?? opponent?.name ?? '?'} ${score}` : `Matchen mot ${opponent?.name ?? '?'} avgjord utan dig`,
        body: coachBody,
        isRead: false,
        ...(coach ? { tone: 'coach' as const, fromRole: 'ASSISTENTTRÄNARE', coachInitials: coach.initials } : {}),
      }

      set({ game: {
        ...game,
        fixtures: updatedFixtures,
        standings,
        lastCompletedFixtureId: fixtureId,
        inbox: [inboxItem, ...game.inbox],
      }})
    },

    // Nödtrupp lager 3 (CODE_ORDER_NODTRUPP): sista utväg när managed klubb inte kan
    // ställa elva spelklara OCH akademi + fria agenter är tomma. Forfeit-förlust 0–5.
    // EXTREMT sällsynt — finns bara så spelet aldrig kan låsa sig.
    concedeWalkover: (fixtureId: string) => {
      const { game } = get()
      if (!game) return
      const fixture = game.fixtures.find(f => f.id === fixtureId)
      if (!fixture || fixture.status === FixtureStatus.Completed) return

      const managedIsHome = fixture.homeClubId === game.managedClubId
      const homeScore = managedIsHome ? 0 : 5
      const awayScore = managedIsHome ? 5 : 0
      const completed = { ...fixture, homeScore, awayScore, events: [], status: FixtureStatus.Completed }

      const updatedFixtures = game.fixtures.map(f => f.id === fixtureId ? completed : f)
      const completedLeague = updatedFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
      const standings = calculateStandings(game.league.teamIds, completedLeague)

      let updatedCupBracket = game.cupBracket ?? null
      if (fixture.isCup && updatedCupBracket && !updatedCupBracket.completed) {
        updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, [completed])
        const playedMatch = updatedCupBracket.matches.find(m => m.fixtureId === completed.id)
        const round = playedMatch?.round ?? 0
        if (round === 4) {
          const finalMatch = updatedCupBracket.matches.find(m => m.round === 4 && m.winnerId)
          if (finalMatch) updatedCupBracket = { ...updatedCupBracket, winnerId: finalMatch.winnerId, completed: true }
        } else if (round > 0) {
          const roundMatches = updatedCupBracket.matches.filter(m => m.round === round)
          if (roundMatches.every(m => m.winnerId)) {
            const { updatedBracket, newFixtures } = generateNextCupRound(updatedCupBracket, round, game.currentSeason)
            const stamped = stampFixturesFromCalendar(newFixtures, game.seasonCalendar ?? [])
            updatedCupBracket = updatedBracket
            if (stamped.length > 0) updatedFixtures.push(...stamped)
          }
        }
      }

      // Playoff: spegla saveLiveMatchResults serieuppdatering + fasframskridning (korrekt bracket)
      let updatedPlayoffBracket = game.playoffBracket
      if (completed.isKnockout && !completed.isCup && updatedPlayoffBracket) {
        updatedPlayoffBracket = {
          ...updatedPlayoffBracket,
          quarterFinals: updatedPlayoffBracket.quarterFinals.map(s => s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completed) : s),
          semiFinals: updatedPlayoffBracket.semiFinals.map(s => s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completed) : s),
          final: updatedPlayoffBracket.final && updatedPlayoffBracket.final.fixtures.includes(fixtureId)
            ? updateSeriesAfterMatch(updatedPlayoffBracket.final, completed) : updatedPlayoffBracket.final,
        }
        const phaseComplete =
          updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals ? updatedPlayoffBracket.quarterFinals.every(s => s.winnerId !== null)
          : updatedPlayoffBracket.status === PlayoffStatus.SemiFinals ? updatedPlayoffBracket.semiFinals.every(s => s.winnerId !== null)
          : updatedPlayoffBracket.status === PlayoffStatus.Final ? updatedPlayoffBracket.final?.winnerId !== null
          : false
        if (phaseComplete) {
          const nextRoundStart = updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals ? 26
            : updatedPlayoffBracket.status === PlayoffStatus.SemiFinals ? 29 : 32
          const currentMaxMatchday = Math.max(0, ...updatedFixtures.map(f => f.matchday ?? 0))
          const { bracket: advancedBracket, newFixtures } = advancePlayoffRound(updatedPlayoffBracket, game.currentSeason, nextRoundStart, currentMaxMatchday + 1)
          updatedPlayoffBracket = advancedBracket
          if (newFixtures.length > 0) updatedFixtures.push(...newFixtures)
        }
      }

      const opp = game.clubs.find(c => c.id === (managedIsHome ? fixture.awayClubId : fixture.homeClubId))
      const walkoverItem: InboxItem = {
        id: `inbox_walkover_${fixtureId}`,
        date: game.currentDate,
        type: InboxItemType.MatchResult,
        title: 'Walkover',
        body: `Vi kunde inte ställa elva spelklara mot ${opp?.name ?? 'motståndaren'}. Matchen gick till motståndaren, ${managedIsHome ? '0–5' : '5–0'}. Det får inte hända igen.`,
        relatedFixtureId: fixtureId,
        isRead: false,
      }

      // A3: same bracket-validity re-check as saveLiveMatchResult — walkover
      // can also advance the bracket directly, bypassing processPlayoffRound.
      const playoffCardCleanup = purgeStalePlayoffCards(game, updatedPlayoffBracket)

      set({ game: {
        ...game,
        fixtures: updatedFixtures,
        standings,
        cupBracket: updatedCupBracket,
        playoffBracket: updatedPlayoffBracket,
        managedClubPendingLineup: undefined,
        lastCompletedFixtureId: fixtureId,
        inbox: [walkoverItem, ...game.inbox],
        ...playoffCardCleanup,
      }})
    },

    markMatchStarted: (fixtureId: string, homeLineup?: TeamSelection, awayLineup?: TeamSelection) => {
      const { game } = get()
      if (!game) return
      const updatedFixtures = game.fixtures.map(f =>
        f.id === fixtureId
          ? {
              ...f,
              matchStartedAt: Date.now(),
              // Persist lineups so we can auto-simulate if user abandons mid-match
              ...(homeLineup ? { homeLineup } : {}),
              ...(awayLineup ? { awayLineup } : {}),
            }
          : f
      )
      set({ game: { ...game, fixtures: updatedFixtures } })
    },
  }
}
