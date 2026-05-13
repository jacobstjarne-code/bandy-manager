import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { MatchEventType, PlayoffRound } from '../../../domain/enums'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { ScoreboardStalvallen } from './scoreboard/ScoreboardStalvallen'
import type { ScoreboardEvent } from './scoreboard/ScoreboardStalvallen'

function getPlayoffRoundLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'KVARTSFINAL'
  if (round === PlayoffRound.SemiFinal) return 'SEMIFINAL'
  return 'SM-FINAL'
}


interface MatchReportViewProps {
  fixture: Fixture
  game: SaveGame
  onClose: () => void
}

export function MatchReportView({ fixture, game, onClose }: MatchReportViewProps) {
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const managedIsHome = fixture.homeClubId === game.managedClubId

  function getPlayerName(playerId?: string): string {
    if (!playerId) return ''
    const p = game.players.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName}` : ''
  }

  function generateMatchStory(): string {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const oppClub = game.clubs.find(c => c.id !== game.managedClubId && (c.id === fixture.homeClubId || c.id === fixture.awayClubId))
    const myScore = managedIsHome ? fixture.homeScore : fixture.awayScore
    const theirScore = managedIsHome ? fixture.awayScore : fixture.homeScore

    const myGoalEvents = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId === game.managedClubId)
    const cornerGoals = myGoalEvents.filter(e => e.isCornerGoal).length

    // Find top scorer for managed club
    const scorerCounts: Record<string, number> = {}
    for (const e of myGoalEvents) {
      if (e.playerId) scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
    }
    const topScorerId = Object.entries(scorerCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topScorerGoals = topScorerId ? scorerCounts[topScorerId] : 0
    const topScorerName = topScorerId ? getPlayerName(topScorerId).split(' ').pop() : ''

    // Detect comeback: check if we were trailing at some point during goals
    let myRunning = 0, theirRunning = 0, wasTrailing = false
    for (const e of fixture.events.filter(ev => ev.type === MatchEventType.Goal).sort((a, b) => a.minute - b.minute)) {
      if (e.clubId === game.managedClubId) myRunning++
      else theirRunning++
      if (myRunning < theirRunning) wasTrailing = true
    }

    const sentences: string[] = []

    // Opening sentence
    if (myScore > theirScore) {
      if (wasTrailing) {
        sentences.push(`Seger efter vändning — ni låg under men tog tre poäng till slut.`)
      } else if (myScore - theirScore >= 4) {
        sentences.push(`Övertygande seger mot ${oppClub?.shortName ?? 'motståndet'}.`)
      } else {
        sentences.push(`${myScore}–${theirScore} till slut mot ${oppClub?.shortName ?? 'motståndet'}.`)
      }
    } else if (myScore === theirScore) {
      sentences.push(`Oavgjort — ni delade poängen med ${oppClub?.shortName ?? 'motståndet'}.`)
    } else {
      sentences.push(`Förlust mot ${oppClub?.shortName ?? 'motståndet'} — ${myScore}–${theirScore}.`)
    }

    // Top scorer sentence
    if (topScorerName && topScorerGoals >= 2) {
      sentences.push(`${topScorerName} stod för ${topScorerGoals} mål.`)
    } else if (topScorerName && topScorerGoals === 1 && myGoalEvents.length >= 1) {
      sentences.push(`Bland annat ${topScorerName} på skytteligget.`)
    }

    // Corner goals
    if (cornerGoals >= 2) {
      sentences.push(`${cornerGoals} av målen kom från hörnor — fasta situationer avgjorde.`)
    } else if (cornerGoals === 1) {
      sentences.push(`Ett hörnmål bidrog till resultatet.`)
    }

    // Attendance
    if (fixture.attendance && managedIsHome && managedClub) {
      sentences.push(`${fixture.attendance} på ${formatArenaName(managedClub.arenaName ?? managedClub.name + 's IP')}.`)
    }

    return sentences.join(' ')
  }

  // Build scoreboard events from fixture goals for the timeline
  const scoreboardEvents: ScoreboardEvent[] = fixture.events
    .filter(e => e.type === MatchEventType.Goal)
    .map(e => ({
      minute: e.minute,
      type: 'goal' as const,
      team: e.clubId === fixture.homeClubId ? 'home' as const : 'away' as const,
    }))

  // Determine period label for FT state
  const ftPeriod = fixture.wentToPenalties
    ? 'FT · ETT' as const
    : fixture.wentToOvertime
    ? 'FT · ETT' as const
    : 'FT' as const

  // Determine playoff final status
  const isPlayoffFinal = fixture.roundNumber > 36 || fixture.isNeutralVenue === true
  const playoffTierLabel = (() => {
    if (!isPlayoffFinal) return undefined
    const bracket = game.playoffBracket
    const allSeries = bracket ? [
      ...bracket.quarterFinals,
      ...bracket.semiFinals,
      ...(bracket.final ? [bracket.final] : []),
    ] : []
    const series = allSeries.find(s => s.fixtures.includes(fixture.id))
    if (series) return getPlayoffRoundLabel(series.round)
    return 'SLUTSPEL'
  })()

  const homeCode = (homeClub?.shortName ?? homeClub?.name ?? 'HEM').substring(0, 4).toUpperCase()
  const awayCode = (awayClub?.shortName ?? awayClub?.name ?? 'BOR').substring(0, 4).toUpperCase()

  const storyText = generateMatchStory()
  const is00 = fixture.homeScore === 0 && fixture.awayScore === 0

  return (
    <div className="report-root">

      {/* ── Stage — leather-dk, scoreboard in FT state ── */}
      <div className="report-stage stage">
        <ScoreboardStalvallen
          homeCode={homeCode}
          awayCode={awayCode}
          homeScore={fixture.homeScore}
          awayScore={fixture.awayScore}
          managedSide={managedIsHome ? 'home' : 'away'}
          period={ftPeriod}
          minute={90}
          second={0}
          penalties={[]}
          ticker={[`${homeCode} ${fixture.homeScore} – ${fixture.awayScore} ${awayCode}`, 'FULLTIME']}
          events={scoreboardEvents}
          isPlayoffFinal={isPlayoffFinal}
          finalTier={playoffTierLabel}
          showNowMarker={false}
        />
      </div>

      {/* ── Paper — warm background, match details ── */}
      <div className="report-paper paper">

        {/* CTA — immediately after scoreboard */}
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', marginBottom: 12 }}>Fortsätt →</button>

        {/* Arena line */}
        <div className="report-arena-line">
          <span>{formatArenaName(homeClub?.arenaName ?? `${homeClub?.shortName ?? '?'}s IP`)}</span>
          {fixture.attendance && (
            <>
              <span className="report-arena-sep">·</span>
              <span className="report-arena-attendance">{fixture.attendance} ÅSKÅDARE</span>
            </>
          )}
          {fixture.roundNumber <= 22 && (
            <>
              <span className="report-arena-sep">·</span>
              <span>OMG. {fixture.roundNumber}</span>
            </>
          )}
        </div>

        {/* Story block */}
        <div className="report-story-block">
          <div className="report-section-label report-story-label">Matchens berättelse</div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13, lineHeight: 1.6,
            color: is00 ? 'var(--ink-mute)' : 'var(--ink)',
            fontStyle: is00 ? 'italic' : 'normal',
            margin: 0,
          }}>
            {storyText}
          </p>
        </div>

        {/* Compact stats row — shots + corners side by side */}
        {fixture.report && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[
              { label: 'Skott', home: fixture.report.shotsHome, away: fixture.report.shotsAway },
              { label: 'Hörnor', home: fixture.report.cornersHome, away: fixture.report.cornersAway },
            ].map(({ label, home, away }) => (
              <div key={label} className="report-stat-row" style={{ flex: 1 }}>
                <span className="report-stat-home">{home}</span>
                <span className="report-stat-label">{label}</span>
                <span className="report-stat-away">{away}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
