import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { MatchEventType, PlayoffRound } from '../../../domain/enums'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { generateMatchStory } from '../../../domain/utils/matchStory'
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

  const storyText = generateMatchStory(fixture, game)
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
