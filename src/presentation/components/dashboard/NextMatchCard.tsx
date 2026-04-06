import { ClubBadge } from '../ClubBadge'
import { IceQuality, PlayoffRound } from '../../../domain/enums'
import { getIceQualityLabel } from '../../../domain/services/weatherService'
import { getCupRoundLabel } from '../../../domain/services/cupService'
import { getRivalry } from '../../../domain/data/rivalries'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import type { MatchWeather } from '../../../domain/entities/Weather'

function getPlayoffLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'Kvartsfinal'
  if (round === PlayoffRound.SemiFinal) return 'Semifinal'
  return 'SM-Final'
}

/** Series score as V/F boxes + score string */
function SeriesBoxes({
  wins,
  losses,
  total = 5,
}: { wins: number; losses: number; total?: number }) {
  const boxes: Array<'W' | 'L' | 'empty'> = []
  let w = wins, l = losses
  for (let i = 0; i < total; i++) {
    if (w > 0) { boxes.push('W'); w-- }
    else if (l > 0) { boxes.push('L'); l-- }
    else boxes.push('empty')
  }

  return (
    <div style={{ marginTop: 6, background: 'var(--match-home-bg)', borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
        Serie (bäst av {total})
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {boxes.map((b, i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              background: b === 'W' ? 'var(--success)' : b === 'L' ? 'var(--danger)' : 'transparent',
              border: b === 'empty' ? '1.5px solid var(--border-dark)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {b !== 'empty' && (
              <span style={{ fontSize: 7, color: 'var(--text-light)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                {b === 'W' ? 'V' : 'F'}
              </span>
            )}
          </div>
        ))}
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-dark)', marginLeft: 6, fontFamily: 'var(--font-display)' }}>
          {wins}–{losses}
        </span>
      </div>
    </div>
  )
}

interface NextMatchCardProps {
  nextFixture: Fixture
  opponent: Club
  isHome: boolean
  club: Club
  game: SaveGame
  isPlayoffFixture: boolean | null | undefined
  playoffSeries: PlayoffSeries | null
  dynamicHomeWins: number
  dynamicAwayWins: number
  matchWeather: MatchWeather | undefined
  hasPendingLineup: boolean
}

export function NextMatchCard({
  nextFixture,
  opponent,
  isHome,
  club,
  game,
  isPlayoffFixture,
  playoffSeries,
  dynamicHomeWins,
  dynamicAwayWins,
  matchWeather,
  hasPendingLineup,
}: NextMatchCardProps) {
  const rivalry = getRivalry(nextFixture.homeClubId, nextFixture.awayClubId)
  const isAnnandagen = nextFixture.roundNumber === 8
  const isCup = nextFixture.isCup
  const isDerby = !!rivalry
  const derbyIntense = isDerby && rivalry!.intensity >= 2
  const isPlayoff = !!isPlayoffFixture
  const isFinal = playoffSeries?.round === PlayoffRound.Final

  // ── Card border & tint per variant ──
  const cardStyle: React.CSSProperties = isFinal
    ? { border: '2px solid rgba(196,168,76,0.5)', background: 'rgba(196,168,76,0.06)', boxShadow: '0 0 20px rgba(196,168,76,0.10)' }
    : isPlayoff
    ? { border: '1.5px solid rgba(196,168,76,0.35)', background: 'rgba(196,168,76,0.04)' }
    : derbyIntense
    ? { border: '1.5px solid rgba(196,80,50,0.30)', background: 'rgba(196,80,50,0.03)' }
    : isDerby
    ? { border: '1.5px solid rgba(196,122,58,0.30)', background: 'rgba(196,122,58,0.03)' }
    : isAnnandagen
    ? { border: '1.5px solid rgba(100,140,80,0.25)', background: 'rgba(100,140,80,0.03)' }
    : isCup
    ? { border: '1.5px solid rgba(196,122,58,0.30)', background: 'rgba(196,122,58,0.03)' }
    : { border: '1px solid var(--border)', background: 'var(--bg-surface)' }

  // ── Leather bar bg per variant ──
  const leatherBg = isFinal
    ? 'linear-gradient(135deg, var(--match-bg-default), var(--match-bg-rain))'
    : isPlayoff
    ? 'var(--match-bg-snow)'
    : derbyIntense || isDerby
    ? 'var(--match-bg-cold)'
    : isAnnandagen
    ? 'var(--match-bg-fog)'
    : isCup
    ? 'var(--match-bg-wind)'
    : 'var(--bg-leather)'

  // ── Header label & tag ──
  let headerIcon = ''
  let headerLabel = 'Nästa match'
  let headerTagText = isHome ? 'HEMMA' : 'BORTA'
  let headerTagStyle: React.CSSProperties = { background: 'var(--accent-dark)', color: 'var(--match-text-light)', fontSize: 8, padding: '2px 7px' }

  if (isFinal) {
    headerIcon = '🏆'
    headerLabel = 'SM-FINAL'
    headerTagText = 'Studenternas IP'
    headerTagStyle = { background: 'rgba(196,168,76,0.2)', color: 'var(--match-gold)', fontSize: 8, padding: '2px 7px', border: '1px solid rgba(196,168,76,0.3)' }
  } else if (isPlayoff && playoffSeries) {
    headerIcon = '⚔️'
    headerLabel = getPlayoffLabel(playoffSeries.round)
    headerTagText = 'TOPP 8'
    headerTagStyle = { background: 'rgba(196,168,76,0.15)', color: 'var(--match-gold)', fontSize: 8, padding: '2px 7px', border: '1px solid rgba(196,168,76,0.25)' }
  } else if (isCup) {
    const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextFixture.id)
    const roundLabel = cupMatch ? getCupRoundLabel(cupMatch.round) : 'Cup'
    headerIcon = '🏆'
    headerLabel = `Cupen · ${roundLabel}`
    headerTagText = isHome ? 'HEMMA' : 'BORTA'
    headerTagStyle = { background: 'rgba(196,122,58,0.15)', color: 'var(--match-copper)', fontSize: 8, padding: '2px 7px', border: '1px solid rgba(196,122,58,0.2)' }
  } else if (isDerby) {
    headerIcon = derbyIntense ? '🔥' : '⚔️'
    headerLabel = 'Nästa match'
    headerTagText = 'DERBY'
    headerTagStyle = { background: 'rgba(196,80,50,0.2)', color: 'var(--match-warn)', fontSize: 8, padding: '2px 7px', border: '1px solid rgba(196,80,50,0.3)' }
  } else if (isAnnandagen) {
    headerIcon = '🎄'
    headerLabel = 'Annandagsrundan'
    const d = new Date(game.currentDate)
    headerTagText = `${d.getDate()} DEC`
    headerTagStyle = { background: 'rgba(100,140,80,0.15)', color: 'var(--match-positive)', fontSize: 8, padding: '2px 7px', border: '1px solid rgba(100,140,80,0.25)' }
  } else {
    // Normal: show home/away + round
    headerTagText = `${isHome ? 'HEMMA' : 'BORTA'} · Omg ${nextFixture.roundNumber}`
  }

  // Header label text color per variant
  const headerLabelColor = isFinal ? 'var(--match-gold)'
    : isPlayoff ? 'var(--match-gold)'
    : isDerby ? 'var(--match-warn)'
    : isAnnandagen ? 'var(--match-positive)'
    : isCup ? 'var(--match-copper)'
    : 'var(--text-light-secondary)'

  // Crest size — SM-Final gets 38px, others 36px
  const crestSize = isFinal ? 38 : 36

  // "vs" color
  const vsColor = isFinal ? 'var(--accent-dark)'
    : isPlayoff ? 'var(--accent-dark)'
    : isDerby ? 'var(--danger)'
    : isAnnandagen ? 'var(--success-light)'
    : 'var(--accent-dark)'

  // Ice quality tag
  const iceTag = matchWeather ? (() => {
    const iq = matchWeather.weather.iceQuality
    const poor = iq === IceQuality.Poor || iq === IceQuality.Cancelled
    const label = getIceQualityLabel(iq)
    return (
      <span className={poor ? 'tag tag-red' : 'tag tag-ice'} style={{ fontSize: 8 }}>
        {label}{poor ? ' ⚠️' : ''}
      </span>
    )
  })() : null

  // Standing tags
  const myStanding = game.standings?.find(s => s.clubId === game.managedClubId)
  const oppStanding = game.standings?.find(s => s.clubId === opponent.id)

  // Sub-info tags below crests
  const mySubTag = myStanding
    ? <span className="tag tag-copper" style={{ fontSize: 8, padding: '1px 6px', marginTop: 2 }}>{myStanding.position}:e</span>
    : null
  const oppSubTag = oppStanding
    ? <span className="tag tag-outline" style={{ fontSize: 8, padding: '1px 6px', marginTop: 2 }}>{oppStanding.position}:e</span>
    : null

  return (
    <div
      className="card-stagger-1"
      style={{ ...cardStyle, borderRadius: 14, overflow: 'hidden' }}
    >
      {/* Leather header bar */}
      <div
        className="texture-leather"
        style={{
          background: leatherBg,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderRadius: '13px 13px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {headerIcon && <span style={{ fontSize: 12 }}>{headerIcon}</span>}
          <span style={{ color: headerLabelColor, fontSize: derbyIntense || isFinal ? 10 : 8, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
            {headerLabel}
          </span>
        </div>
        <span className="tag" style={headerTagStyle}>{headerTagText}</span>
      </div>

      {/* Match body */}
      <div style={{ padding: '10px 12px' }}>
        {isDerby && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-body)' }}>
            🔥 {rivalry!.name}
          </p>
        )}
        {/* Crests + vs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
          {/* My club */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: crestSize, height: crestSize, margin: '0 auto' }}>
              <ClubBadge
                clubId={game.managedClubId}
                name={club.name}
                size={crestSize}
                strokeColor={isFinal ? 'rgba(212,184,96,0.8)' : 'rgba(196,122,58,0.7)'}
              />
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, margin: '3px 0 0', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              {club.shortName ?? club.name.split(' ')[0]}
            </p>
            {mySubTag}
          </div>

          {/* vs */}
          <span style={{ fontSize: 12, color: vsColor, margin: '0 6px', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            vs
          </span>

          {/* Opponent */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: crestSize, height: crestSize, margin: '0 auto' }}>
              <ClubBadge
                clubId={opponent.id}
                name={opponent.name}
                size={crestSize}
                strokeColor="rgba(196,186,168,0.5)"
              />
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, margin: '3px 0 0', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              {opponent.shortName ?? opponent.name.split(' ')[0]}
            </p>
            {oppSubTag}
          </div>
        </div>

        {/* SM-Final: italic quote */}
        {isFinal && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent-dark)', margin: '4px 0 2px', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            "Sveriges svar på Superbowl."
          </p>
        )}

        {/* Playoff: series score boxes */}
        {isPlayoff && !isFinal && playoffSeries && (
          <SeriesBoxes wins={dynamicHomeWins} losses={dynamicAwayWins} />
        )}

        {/* Normal/home: round info */}
        {!isPlayoff && !isCup && !isDerby && !isAnnandagen && (
          <p style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
            Omgång {nextFixture.roundNumber}
          </p>
        )}

        {/* Special info tags */}
        {(isDerby || isAnnandagen || isCup || isFinal) && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
            {isDerby && (
              <>
                <span className="tag tag-red" style={{ fontSize: 8 }}>🔥 Derby</span>
              </>
            )}
            {isAnnandagen && (
              <>
                <span className="tag tag-green" style={{ fontSize: 8 }}>🎄 Höjdpunkt</span>
                <span className="tag tag-outline" style={{ fontSize: 8 }}>Annandagen</span>
              </>
            )}
            {isCup && !isDerby && (
              <>
                <span className="tag tag-copper" style={{ fontSize: 8 }}>En match avgör</span>
                <span className="tag tag-outline" style={{ fontSize: 8 }}>Neutral plan</span>
              </>
            )}
            {isFinal && (
              <>
                <span className="tag tag-copper" style={{ fontSize: 8 }}>En match avgör</span>
                <span className="tag tag-outline" style={{ fontSize: 8 }}>Neutral plan</span>
              </>
            )}
          </div>
        )}

        {/* Readiness + ice */}
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="tag tag-green" style={{ gap: 3, fontSize: 8 }}>
            <svg viewBox="0 0 6 6" width="6" height="6"><circle cx="3" cy="3" r="2.5" fill="var(--success)"/></svg>
            Uppställning
          </span>
          <span className="tag tag-green" style={{ gap: 3, fontSize: 8 }}>
            <svg viewBox="0 0 6 6" width="6" height="6"><circle cx="3" cy="3" r="2.5" fill="var(--success)"/></svg>
            Taktik
          </span>
          <span
            className="tag tag-copper"
            style={{ gap: 3, fontSize: 8, animation: !hasPendingLineup ? 'pulseRing 2s ease-in-out infinite' : undefined }}
          >
            <svg viewBox="0 0 6 6" width="6" height="6"><circle cx="3" cy="3" r="2" fill="none" stroke="var(--accent)" strokeWidth="1.2"/></svg>
            {hasPendingLineup ? 'Klar ✓' : 'Välj trupp'}
          </span>
          {iceTag}
        </div>
      </div>
    </div>
  )
}
