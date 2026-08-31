import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { MatchEventType, PlayoffRound } from '../../../domain/enums'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { generateMatchStory } from '../../../domain/utils/matchStory'
import { ScoreboardStalvallen } from './scoreboard/ScoreboardStalvallen'
import type { ScoreboardEvent } from './scoreboard/ScoreboardStalvallen'
import { playoffRoundNameUpper, getRoundLabel } from '../../../domain/roundLabel'
import { getPlayoffRoundForFixture } from '../../../domain/services/playoffService'



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
  // Audit 2026-08-29 CRITICAL 1 (falska SM-guld): isNeutralVenue ensam räckte
  // inte — cupfinaler spelas också på neutral plan (samma flagga). Uteslut
  // cupfixturer explicit; playoffTierLabel nedan gör redan den robusta
  // bracket-medlemskapskontrollen för att särskilja kvarts/semi/final.
  //
  // HIGH 5 (2026-08-29): `fixture.roundNumber > 36` var en rest av de gamla
  // hårdkodade slutspels-roundNumber (28/33/36) och var i praktiken redan
  // aldrig sann — finalens roundNumber blev 36, inte >36. Med den härledda
  // numreringen (nextPlayoffStart) är den definitivt död. Ersatt av det exakta
  // bracket-uppslaget; isFinaldag/isNeutralVenue kvar som fallback för
  // sparfiler där bracketen redan nollställts vid rollover.
  const playoffRound = getPlayoffRoundForFixture(game.playoffBracket, fixture.id)
  const isPlayoffFinal = !fixture.isCup && (
    playoffRound === PlayoffRound.Final || fixture.isFinaldag === true || fixture.isNeutralVenue === true
  )
  const playoffTierLabel = (() => {
    if (!isPlayoffFinal) return undefined
    if (playoffRound) return playoffRoundNameUpper(playoffRound)
    return 'SLUTSPEL'
  })()

  const homeCode = (homeClub?.shortName ?? homeClub?.name ?? 'HEM').toUpperCase()
  const awayCode = (awayClub?.shortName ?? awayClub?.name ?? 'BOR').toUpperCase()

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
          {/* HIGH 5: `roundNumber <= 22` gömde slutspelet men släppte igenom
              cupen — en cupkvartsfinal (roundNumber 2) visades som "OMG. 2".
              Utelämnas för SM-finalen, där scoreboarden redan bär tiern. */}
          {!isPlayoffFinal && (
            <>
              <span className="report-arena-sep">·</span>
              <span>{getRoundLabel(fixture, game.playoffBracket).short.toUpperCase()}</span>
            </>
          )}
        </div>

        {/* Story block */}
        <div className="report-story-block">
          <div className="report-section-label report-story-label">Matchens berättelse</div>
          {/* ds-exempt: color + fontStyle båda dynamiska ternary på is00 */}
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
