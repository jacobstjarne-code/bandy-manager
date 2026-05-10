import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { MatchEventType, PlayoffRound } from '../../../domain/enums'
import { positionShort } from '../../utils/formatters'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { PlayerLink } from '../PlayerLink'
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
  const managedCornerGoals = fixture.events.filter(
    e => e.isCornerGoal && e.clubId === game.managedClubId
  ).length
  const managedCorners = managedIsHome ? (fixture.report?.cornersHome ?? 0) : (fixture.report?.cornersAway ?? 0)

  const visibleEvents = fixture.events.filter(e =>
    e.type === MatchEventType.Goal ||
    e.type === MatchEventType.RedCard
  ).sort((a, b) => a.minute - b.minute)

  const playerRatings = fixture.report?.playerRatings ?? {}

  const allLineupIds = [
    ...(fixture.homeLineup?.startingPlayerIds ?? []),
    ...(fixture.awayLineup?.startingPlayerIds ?? []),
  ]

  const ratedPlayers = allLineupIds
    .map(id => {
      const player = game.players.find(p => p.id === id)
      const rating = playerRatings[id]
      if (!player || rating === undefined) return null
      const isHome = fixture.homeLineup?.startingPlayerIds.includes(id)
      return { player, rating, isHome: isHome ?? false }
    })
    .filter((x): x is { player: Player; rating: number; isHome: boolean } => x !== null)
    .sort((a, b) => b.rating - a.rating)

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

  // Rating color using new tokens
  function ratingColorNew(r: number): string {
    if (r < 6) return 'var(--rate-bad)'
    if (r < 7) return 'var(--rate-mid)'
    return 'var(--rate-good)'
  }

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

        {/* Events */}
        {visibleEvents.length > 0 ? (
          <div className="report-events-list">
            {visibleEvents.map((event, index) => {
              const isHomeEvent = event.clubId === fixture.homeClubId
              const clubShort = isHomeEvent ? (homeClub?.shortName ?? 'H') : (awayClub?.shortName ?? 'B')
              const tagLabel = event.type === MatchEventType.Goal
                ? (event.isCornerGoal ? 'HÖRNMÅL' : event.isPenaltyGoal ? 'STRAFF' : 'MÅL')
                : 'UTV'
              const tagColor = event.type === MatchEventType.Goal ? 'var(--copper)' : 'var(--rate-bad)'
              const tagBg = event.type === MatchEventType.Goal ? 'rgba(196,122,58,0.1)' : 'rgba(179,58,46,0.1)'
              return (
                <div
                  key={index}
                  className="report-event-row"
                  style={{ borderBottom: index < visibleEvents.length - 1 ? `1px solid var(--paper-edge)` : 'none' }}
                >
                  <span className="report-event-minute">{event.minute}&apos;</span>
                  <span className="report-event-tag" style={{ background: tagBg, color: tagColor }}>{tagLabel}</span>
                  <span className="report-event-club">{clubShort}</span>
                  <span className="report-event-player">
                    {event.playerId
                      ? <PlayerLink playerId={event.playerId} name={getPlayerName(event.playerId)} style={{ color: 'var(--ink)' }} />
                      : event.description
                    }
                    {event.playerId && event.type === MatchEventType.RedCard && ' · 10 min utvisning'}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="report-no-events" style={{ borderBottom: `1px solid var(--paper-edge)` }}>
            <span className="report-no-events-label">INGA MÅL · INGA UTVISNINGAR</span>
            <span className="report-no-events-sub">Det blev en tight och taktisk match.</span>
          </div>
        )}

        {/* Corner-band pearl */}
        {managedCornerGoals > 0 && (
          <div className="report-corner-pearl">
            <span className="report-corner-count">{managedCornerGoals}</span>
            <div className="report-corner-body">
              <strong style={{ fontSize: 12, color: 'var(--ink)' }}>
                hörnmål av {managedCorners} hörnor
              </strong>
              <small style={{ display: 'block', fontSize: 10, color: 'var(--ink-mute)', marginTop: 1 }}>
                {homeClub?.shortName} {fixture.report?.cornersHome ?? 0} — {awayClub?.shortName} {fixture.report?.cornersAway ?? 0}
              </small>
            </div>
          </div>
        )}

        {/* Player ratings */}
        {ratedPlayers.length > 0 && (
          <div className="report-ratings-list">
            <div className="report-section-label report-ratings-label">Spelarbetyg</div>
            {ratedPlayers.slice(0, 8).map(({ player, rating }, i) => {
              const isPotm = i === 0
              const barWidth = Math.max(0, Math.min(100, ((rating - 4) / 6) * 100))
              const ratingCol = ratingColorNew(rating)
              return (
                <div
                  key={player.id}
                  className={isPotm ? 'rate-row potm' : 'rate-row'}
                  style={{ borderBottom: !isPotm ? `1px solid var(--paper-edge)` : 'none' }}
                >
                  {isPotm && <span className="rate-row-star">★</span>}
                  <span className="rate-row-pos">{positionShort(player.position)}</span>
                  <span style={{
                    fontSize: isPotm ? 13 : 12, fontWeight: isPotm ? 700 : 500,
                    color: isPotm ? 'var(--copper)' : 'var(--ink)', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {player.lastName}
                  </span>
                  <span
                    className="rate-row-club-dot"
                    style={{ background: player.clubId === fixture.homeClubId ? 'var(--copper)' : 'var(--steel)' }}
                  />
                  <div className="rate-bar-bg">
                    <div className="rate-bar-fill" style={{ width: `${barWidth}%`, background: ratingCol }} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: ratingCol, minWidth: 26, textAlign: 'right', flexShrink: 0,
                  }}>
                    {rating.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats (kept compact) */}
        {fixture.report && (
          <div className="report-stats-block">
            <div className="report-section-label report-stats-label">Statistik</div>
            {[
              { label: 'Skott', home: String(fixture.report.shotsHome), away: String(fixture.report.shotsAway) },
              { label: 'Hörnor', home: String(fixture.report.cornersHome), away: String(fixture.report.cornersAway) },
            ].map(({ label, home, away }) => (
              <div key={label} className="report-stat-row">
                <span className="report-stat-home">{home}</span>
                <span className="report-stat-label">{label}</span>
                <span className="report-stat-away">{away}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button onClick={onClose} className="report-cta">Fortsätt →</button>
      </div>
    </div>
  )
}
