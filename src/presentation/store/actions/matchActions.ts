import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { MatchEvent, TeamSelection, MatchReport, ManagerChoiceEntry } from '../../../domain/entities/Fixture'
import type { PauseLean } from '../../components/match/HalftimeModal'
import { FixtureStatus, InboxItemType } from '../../../domain/enums'
import { simulateMatch } from '../../../domain/services/matchEngine'
import { fixtureSeed } from '../../../domain/utils/random'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'
import { deriveUtfall } from '../../../domain/services/matchTypeAxes'
import { completeManagedFixture } from '../../../application/useCases/completeManagedFixture'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

/**
 * Store-adaptern samlar matchens facit och delegerar hela sluttransaktionen
 * till completeManagedFixture. Den muterar inte tabell eller bracket själv.
 *
 * @cites game.captainPlayerId, player.fitness, halftimeDecision, game.lastHalftimeDecision, completed.homeScore, completed.awayScore
 */
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
      halftimeDecision?: PauseLean,
    ) => {
      const { game } = get()
      if (!game) return
      const fixture = game.fixtures.find(candidate => candidate.id === fixtureId)
      if (!fixture || fixture.status === FixtureStatus.Completed) return

      // ── T3: managerChoiceLog ────────────────────────────────────────────────
      // Build log from lineup + halftime decision. Raw data only — no
      // player text, no rendering. After-match receipt (Ticket #4) will consume.
      const managedClubId = game.managedClubId
      const isHome = fixture.homeClubId === managedClubId
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
            ...(myLineup?.autoSelected && { autoSelected: true }),
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

      // H2-uppföljning (oberoende speltest- och produktaudit, 5c9a7a8,
      // 2026-08-24): `halftimeDecision` (LIVE-matchens pauseLean, Spak A) och
      // `game.lastHalftimeDecision` (QUICKSIM-matchens lugna/pressa/prata,
      // applyHalftimeDecision i gameFlowActions.ts) är TVÅ separata mekaniker
      // med skilda typer och skild effekt — inte samma val genom två kanaler.
      // Den gamla `?? `-fallbacken behandlade dem som utbytbara, vilket var
      // fel: den lät live-matchens (då odefinierade) pauseLean falla igenom
      // till en HELT ANDRA taktikreglage-härledd gissning. Två separata
      // loggposter nu, en typ var.
      //
      // pep_talk: fanns som typ i ManagerChoiceEntry, konstruerades ALDRIG —
      // pauseLean loggades inte alls tidigare. detail bär pauseLean rakt av,
      // primärt beslut-ID (Jacobs order), inte en härledd approximation.
      if (halftimeDecision) {
        choiceLog.push({ type: 'pep_talk', detail: halftimeDecision })
      }

      // halftime_tactic: oförändrad — quicksim-matchens lugna/pressa/prata-val.
      if (game.lastHalftimeDecision) {
        const detailMap = {
          lugna: 'lowered_tempo',
          pressa: 'increased_pressure',
          prata: 'player_talk',
        } as const
        choiceLog.push({
          type: 'halftime_tactic',
          detail: detailMap[game.lastHalftimeDecision],
        })
      }

      const enrichedReport: MatchReport = {
        ...report,
        managerChoiceLog: choiceLog.length > 0 ? choiceLog : undefined,
      }
      // ── end T3 ──────────────────────────────────────────────────────────────

      const completed = {
        ...fixture,
        homeScore,
        awayScore,
        events,
        report: enrichedReport,
        homeLineup,
        awayLineup,
        attendance: attendance ?? fixture.attendance,
        status: FixtureStatus.Completed,
        wentToOvertime: (overtimeResult !== undefined || penaltyResult !== undefined) || undefined,
        wentToPenalties: penaltyResult !== undefined || undefined,
        overtimeResult,
        penaltyResult,
      }
      set({ game: completeManagedFixture(game, completed) })
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

      const isHome = fixture.homeClubId === game.managedClubId
      const managedScore = isHome ? completed.homeScore ?? 0 : completed.awayScore ?? 0
      const oppScore     = isHome ? completed.awayScore ?? 0 : completed.homeScore ?? 0
      const opponent = game.clubs.find(c => c.id === (isHome ? fixture.awayClubId : fixture.homeClubId))

      const utfall = deriveUtfall(completed, game.managedClubId)
      const matchResult: 'win' | 'draw' | 'loss' =
        utfall === 'vunnet' ? 'win' : utfall === 'forlorat' ? 'loss' : 'draw'
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

      const completedGame = completeManagedFixture(game, completed)
      set({ game: { ...completedGame, inbox: [inboxItem, ...completedGame.inbox] } })
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
      const completed = { ...fixture, homeScore, awayScore, events: [], status: FixtureStatus.Completed, isWalkover: true }

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

      const completedGame = completeManagedFixture(game, completed)
      set({ game: { ...completedGame, inbox: [walkoverItem, ...completedGame.inbox] } })
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
