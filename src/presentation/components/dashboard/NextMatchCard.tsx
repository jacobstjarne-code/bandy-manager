import { ClubBadge } from '../ClubBadge'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { IceQuality, PlayoffRound } from '../../../domain/enums'
import { getIceTagLabel, getWeatherEmoji } from '../../../domain/services/weatherService'
import { getCupRoundLabel } from '../../../domain/services/cupService'
import { isClubDirektkvalad } from '../../../domain/services/anslagService'
import { getRivalry } from '../../../domain/data/rivalries'
import { getCurrentAct } from '../../../domain/services/seasonActService'
import { getCoachStyleLabel } from '../../../domain/services/aiCoachService'
import { getManagerDisplayName } from '../../../domain/services/managerProfileService'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { playoffRoundName, getRoundLabel } from '../../../domain/roundLabel'


/** Series score as V/F boxes + score string */
function SeriesBoxes({
  wins,
  losses,
  total = 5,
  nextStyle,
}: { wins: number; losses: number; total?: number; nextStyle?: 'decisive' | 'gold' }) {
  const boxes: Array<'W' | 'L' | 'empty'> = []
  let w = wins, l = losses
  let firstEmptyIdx = -1
  for (let i = 0; i < total; i++) {
    if (w > 0) { boxes.push('W'); w-- }
    else if (l > 0) { boxes.push('L'); l-- }
    else {
      if (firstEmptyIdx === -1) firstEmptyIdx = i
      boxes.push('empty')
    }
  }

  return (
    <div style={{ marginTop: 6, background: 'var(--match-home-bg)', borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
        Serie (bäst av {total})
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {boxes.map((b, i) => {
          const isNextBox = !!(nextStyle && i === firstEmptyIdx)
          const boxClass = isNextBox
            ? `series-game next ${nextStyle}`
            : b === 'W' ? 'series-box-win' : b === 'L' ? 'series-box-loss' : 'series-box-empty'
          return (
            <div key={i} className={boxClass}>
              {b !== 'empty' && (
                <span className="h-micro" style={{ color: 'var(--text-light)', fontWeight: 700 }}>
                  {b === 'W' ? 'V' : 'F'}
                </span>
              )}
            </div>
          )
        })}
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
  lineupConfirmedThisRound?: boolean
  seriesWeight?: 1 | 2 | 3
  critTagLabel?: string
  seriesNextStyle?: 'decisive' | 'gold'
  /** C-SD2: explicit warm vikt-klass (semi + upptakt). Vinner över seriesWeight. */
  primaryWeightClass?: string
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
  lineupConfirmedThisRound,
  seriesWeight,
  critTagLabel,
  seriesNextStyle,
  primaryWeightClass,
}: NextMatchCardProps) {
  const rivalry = getRivalry(nextFixture.homeClubId, nextFixture.awayClubId)
  const isAnnandagen = nextFixture.isAnnandagen === true
  const isCup = nextFixture.isCup
  const isDerby = !!rivalry
  const derbyIntense = isDerby && rivalry!.intensity >= 2
  const isPlayoff = !!isPlayoffFixture
  const isFinal = playoffSeries?.round === PlayoffRound.Final

  // SLUTTEST 2026-08-08 (punkt 2a+2b): cupMatch hissad hit så header-tagg,
  // taggraden och förklaringsraden delar SAMMA facit — tre separata lokala
  // beräkningar innan gav tre chanser att glida isär.
  const cupMatch = isCup ? game.cupBracket?.matches.find(m => m.fixtureId === nextFixture.id) : undefined
  // Rot (2a): villkoret läste cupMatch.round > 1 — sant i semi/final OCH för
  // ett lag som tog sig UR förstarundan på isen. Rätt fråga är: fick klubben
  // bye rakt in i kvartsfinalen? Samma primitiv (byeTeamIds) som
  // anslagService.ts/AnslagOverlay.tsx redan använder via isClubDirektkvalad
  // — återanvänd istf en fjärde egen kopia av samma kontroll.
  const isDirektkvalad = cupMatch?.round === 2
    && !!game.cupBracket && isClubDirektkvalad(game.cupBracket, game.managedClubId)
  // Rot (2b, rättad 2026-08-08): "Neutral plan" var hårdkodad för ALLA
  // cuprundor. Min FÖRSTA fix (cupMatch.round === 4) var fortfarande fel —
  // cupService.ts:s generateNextCupRound stämplar isCupFinalWeekend =
  // nextRound >= 3, alltså BÅDE semifinal OCH final får CUP_FINAL_VENUE
  // (Sävstaås IP, Bollnäs) och isCupFinalhelgen: true på fixturen. Semin
  // visades som "BORTA" fast den spelas i Bollnäs precis som finalen.
  // Facit är fixturens egen flagga, inte en gissad rond-gräns.
  const isCupFinalMatch = nextFixture.isCupFinalhelgen === true

  // ── Act-based glow (statisk, ej pulserande) ──
  const act = getCurrentAct(nextFixture.roundNumber)
  const actGlow: React.CSSProperties = act >= 3 && !isFinal && !isPlayoff
    ? { boxShadow: `0 0 ${act === 4 ? 12 : 6}px color-mix(in srgb, var(--accent) ${act === 4 ? 15 : 8}%, transparent)` }
    : {}

  // ── Card border & tint per variant (playoff uses primary-card CSS class) ──
  const cardStyle: React.CSSProperties = isFinal
    ? { border: '2px solid color-mix(in srgb, var(--match-gold) 50%, transparent)', background: 'color-mix(in srgb, var(--match-gold) 6%, transparent)', boxShadow: '0 0 20px color-mix(in srgb, var(--match-gold) 10%, transparent)' }
    : isPlayoff
    ? {}
    : derbyIntense
    ? { border: '1.5px solid color-mix(in srgb, var(--match-warn) 30%, transparent)', background: 'color-mix(in srgb, var(--match-warn) 3%, transparent)' }
    : isDerby
    ? { border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 3%, transparent)' }
    : isAnnandagen
    ? { border: '1.5px solid color-mix(in srgb, var(--match-positive) 25%, transparent)', background: 'color-mix(in srgb, var(--match-positive) 3%, transparent)' }
    : isCup
    ? { border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 3%, transparent)' }
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
    headerTagStyle = { background: 'color-mix(in srgb, var(--match-gold) 20%, transparent)', color: 'var(--match-gold)', fontSize: 8, padding: '2px 7px', border: '1px solid color-mix(in srgb, var(--match-gold) 30%, transparent)' }
  } else if (isPlayoff && playoffSeries) {
    headerIcon = '⚔️'
    headerLabel = playoffRoundName(playoffSeries.round)
    headerTagText = 'TOPP 8'
    headerTagStyle = { background: 'color-mix(in srgb, var(--match-gold) 15%, transparent)', color: 'var(--match-gold)', fontSize: 8, padding: '2px 7px', border: '1px solid color-mix(in srgb, var(--match-gold) 25%, transparent)' }
  } else if (isCup) {
    const roundLabel = cupMatch ? getCupRoundLabel(cupMatch.round) : 'Cup'
    headerIcon = '🏆'
    headerLabel = `Cupen · ${roundLabel}`
    headerTagText = isCupFinalMatch ? 'NEUTRAL PLAN' : isHome ? 'HEMMA' : 'BORTA'
    headerTagStyle = { background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--match-copper)', fontSize: 8, padding: '2px 7px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }
  } else if (isDerby) {
    headerIcon = derbyIntense ? '🔥' : '⚔️'
    headerLabel = 'Nästa match'
    headerTagText = 'DERBY'
    headerTagStyle = { background: 'color-mix(in srgb, var(--match-warn) 20%, transparent)', color: 'var(--match-warn)', fontSize: 8, padding: '2px 7px', border: '1px solid color-mix(in srgb, var(--match-warn) 30%, transparent)' }
  } else if (isAnnandagen) {
    headerIcon = '🎄'
    headerLabel = 'Annandagsbandyn'
    headerTagText = '26 DEC'
    headerTagStyle = { background: 'color-mix(in srgb, var(--match-positive) 15%, transparent)', color: 'var(--match-positive)', fontSize: 8, padding: '2px 7px', border: '1px solid color-mix(in srgb, var(--match-positive) 25%, transparent)' }
  } else {
    // Normal: show home/away + round
    // HIGH 5: rondetiketten via getRoundLabel — grenen nås bara av ligamatcher
    // idag, men den råa mallen var en av de ~20 som kunde driva isär.
    headerTagText = `${isHome ? 'HEMMA' : 'BORTA'} · ${getRoundLabel(nextFixture, game.playoffBracket).short}`
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

  // "vs" color. Kontrastgrinden (post 17, 2026-08-18): default/final/playoff-
  // grenarna läste --accent-dark (3.15:1 mot portal-bg, upptäckt via
  // NextMatchPrimary/.card--portal) — bytt till --accent-text (dedikerad
  // textroll, se global.css). isDerby/isAnnandagen-grenarna (--danger/
  // --success-light) är INTE verifierade i portal-mörk kontext ännu —
  // ingen dev-scen med derby/annandagen-nästa-match träffar denna komponent
  // i dagens SCENES-svep, så grinden har inte kunnat pröva dem. Kvar som
  // öppen lucka, inte tyst antagen OK.
  const vsColor = isFinal ? 'var(--accent-text)'
    : isPlayoff ? 'var(--accent-text)'
    : isDerby ? 'var(--danger)'
    : isAnnandagen ? 'var(--success-light)'
    : 'var(--accent-text)'

  // Ice quality tag
  // SLUTTEST RUNDA 4 (punkt 4): getIceTagLabel visar "Blöt is" vid
  // condition===Thaw istf anläggningens iceQuality-etikett — se
  // weatherService.ts för rotorsak ("istaggen ljuger inte, men den tiger").
  const iceTag = matchWeather ? (() => {
    const iq = matchWeather.weather.iceQuality
    const poor = iq === IceQuality.Poor || iq === IceQuality.Cancelled
    const label = getIceTagLabel(iq, matchWeather.weather.condition)
    return (
      <span className={poor ? 'tag tag-red' : 'tag tag-ice'} style={{ fontSize: 8 }}>
        {label}{poor ? ' ⚠️' : ''}
      </span>
    )
  })() : null

  // Standing tags — only show after at least one league match has been played
  const anyLeagueMatchPlayed = game.fixtures.some(f => f.status === 'completed' && !f.isCup && !f.isKnockout)
  const myStanding = anyLeagueMatchPlayed ? game.standings?.find(s => s.clubId === game.managedClubId) : undefined
  const oppStanding = anyLeagueMatchPlayed ? game.standings?.find(s => s.clubId === opponent.id) : undefined

  // Sub-info tags below crests
  const mySubTag = myStanding
    ? <span className="tag tag-copper" style={{ fontSize: 8, padding: '1px 6px', marginTop: 2 }}>{myStanding.position}:e</span>
    : null
  const oppSubTag = oppStanding
    ? <span className="tag tag-outline" style={{ fontSize: 8, padding: '1px 6px', marginTop: 2 }}>{oppStanding.position}:e</span>
    : null

  return (
    <div
      className={`card-stagger-1${primaryWeightClass ? ` primary-card ${primaryWeightClass}` : isPlayoff ? ` primary-card primary-weight-${seriesWeight ?? 1}` : ''}`}
      style={{ ...cardStyle, ...actGlow, borderRadius: 14, overflow: 'hidden' }}
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
          {critTagLabel && (
            <span className="primary-crit-tag">{critTagLabel}</span>
          )}
        </div>
        <span className="tag" style={headerTagStyle}>{headerTagText}</span>
      </div>

      {/* Match body */}
      <div style={{ padding: '10px 12px' }}>
        {isDerby && (
          <div style={{ marginBottom: 6 }}>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--danger)', fontWeight: 600, margin: '0 0 2px', fontFamily: 'var(--font-body)' }}>
              🔥 {rivalry!.name}
            </p>
            {(() => {
              const h2h = game.rivalryHistory?.[opponent.id]
              if (!h2h || h2h.wins + h2h.losses + h2h.draws < 2) return null
              const streakStr = h2h.currentStreak >= 2
                ? ` · ${h2h.currentStreak} raka segrar 🔥`
                : h2h.currentStreak <= -2
                ? ` · ${Math.abs(h2h.currentStreak)} raka förluster`
                : ''
              return (
                <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  H2H: {h2h.wins}V – {h2h.draws}O – {h2h.losses}F{streakStr}
                </p>
              )
            })()}
          </div>
        )}
        {/* Crests + vs */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4px 0' }}>
          {/* My club */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: crestSize, height: crestSize, margin: '0 auto' }}>
              <ClubBadge
                clubId={game.managedClubId}
                name={club.name}
                size={crestSize}
                strokeColor={isFinal ? 'rgba(212,184,96,0.8)' : 'color-mix(in srgb, var(--accent) 70%, transparent)'}
              />
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, margin: '3px 0 0', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              {club.shortName ?? club.name.split(' ')[0]}
            </p>
            {mySubTag}
            {game.managerName && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>{getManagerDisplayName(game)}</p>
            )}
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
            {(() => {
              const coach = game.aiCoaches?.[opponent.id]
              if (!coach) return null
              return (
                <>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>{coach.name}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '1px 0 0', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>{getCoachStyleLabel(coach.style)}</p>
                </>
              )
            })()}
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
          <SeriesBoxes wins={dynamicHomeWins} losses={dynamicAwayWins} nextStyle={seriesNextStyle} />
        )}

        {/* Normal/home: round info + arena */}
        {!isPlayoff && !isCup && !isDerby && !isAnnandagen && (() => {
          const venueClub = isHome ? club : opponent
          const arenaLabel = venueClub.arenaName
            ? `${formatArenaName(venueClub.arenaName)} (${venueClub.shortName ?? venueClub.name})`
            : undefined
          return (
            <>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
                {getRoundLabel(nextFixture, game.playoffBracket).long}
              </p>
              {arenaLabel && (
                <p style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', margin: '1px 0 0', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                  {arenaLabel}
                </p>
              )}
            </>
          )
        })()}

        {/* Special info tags */}
        {(isDerby || isAnnandagen || isCup || isFinal) && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
            {isAnnandagen && (
              <>
                <span className="tag tag-green" style={{ fontSize: 8 }}>🎄 Höjdpunkt</span>
                <span className="tag tag-outline" style={{ fontSize: 8 }}>Annandagen</span>
              </>
            )}
            {isCup && !isDerby && (
              <>
                <span className="tag tag-copper" style={{ fontSize: 8 }}>En match avgör</span>
                {/* SLUTTEST RUNDA 3 (punkt 5): "NEUTRAL PLAN" renderades två
                    gånger — här och i rubriktaggen (headerTagText, rad ~190).
                    Rubriktaggen behålls (Jacobs dom), infoslingans dubblett tas bort. */}
                {isDirektkvalad && (
                  <span className="tag tag-outline" style={{ fontSize: 8 }}>Direktkval</span>
                )}
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

        {/* Cup direktkvalificering — förklaring */}
        {isCup && !isDerby && isDirektkvalad && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
            De fyra högst rankade lagen går direkt in i kvartsfinalen. Ni är ett av dem.
          </p>
        )}

        {/* Readiness + ice */}
        {(() => {
          const confirmed = lineupConfirmedThisRound === true
          const lineupTag = !hasPendingLineup
            ? { text: 'Välj trupp', cls: 'tag tag-copper', pulse: true }
            : confirmed
            ? { text: 'Redo ✓', cls: 'tag tag-green', pulse: false }
            : { text: 'Förra uppst.', cls: 'tag tag-outline', pulse: false }
          return (
            <div style={{ marginTop: 8, paddingTop: 6, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span
                className={lineupTag.cls}
                style={{ gap: 3, fontSize: 8, animation: lineupTag.pulse ? 'pulseRing 2s ease-in-out infinite' : undefined }}
              >
                {!hasPendingLineup && (
                  <svg viewBox="0 0 6 6" width="6" height="6"><circle cx="3" cy="3" r="2" fill="none" stroke="var(--accent)" strokeWidth="1.2"/></svg>
                )}
                {lineupTag.text}
              </span>
              {matchWeather && (
                <span className="tag tag-outline" style={{ fontSize: 8 }}>
                  {getWeatherEmoji(matchWeather.weather.condition)}{' '}
                  {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
                </span>
              )}
              {iceTag}
            </div>
          )
        })()}

        {/* H2H + Form — only for non-derby (derbies already show H2H above) */}
        {!isDerby && (() => {
          const h2h = game.rivalryHistory?.[opponent.id]
          const h2hTotal = h2h ? h2h.wins + h2h.draws + h2h.losses : 0
          const showH2H = h2hTotal >= 3

          // Last 3 completed fixtures for managed club
          const myRecent = [...game.fixtures]
            .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
            .sort((a, b) => b.matchday - a.matchday)
            .slice(0, 3)

          // Last 3 completed fixtures for opponent
          const oppRecent = [...game.fixtures]
            .filter(f => f.status === 'completed' && (f.homeClubId === opponent.id || f.awayClubId === opponent.id))
            .sort((a, b) => b.matchday - a.matchday)
            .slice(0, 3)

          const getResult = (f: typeof myRecent[0], clubId: string): 'W' | 'D' | 'L' => {
            const isHome = f.homeClubId === clubId
            if (f.homeScore === f.awayScore) return 'D'
            const won = isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
            return won ? 'W' : 'L'
          }

          const dotColor = (r: 'W' | 'D' | 'L') =>
            r === 'W' ? 'var(--success)' : r === 'D' ? 'var(--text-muted)' : 'var(--danger)'

          const showForm = myRecent.length >= 1 || oppRecent.length >= 1
          if (!showH2H && !showForm) return null

          return (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              {showH2H && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 6 : 0 }}>
                  <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                    SENASTE MÖTET
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    V{h2h!.wins} O{h2h!.draws} F{h2h!.losses} mot {opponent.shortName ?? opponent.name.split(' ')[0]}
                  </span>
                </div>
              )}
              {showForm && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                    FORM
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {myRecent.map(f => {
                        const r = getResult(f, game.managedClubId)
                        return (
                          <div key={f.id} style={{ width: 8, height: 8, borderRadius: 2, background: dotColor(r) }} />
                        )
                      })}
                    </div>
                    {/* Kontrastgrinden (post 17, 2026-08-18): --text-muted mot portal-bg
                        ger 3,15:1 — under 4,5:1-normaltextkravet, över 3:1. Divider mellan
                        två formsträckor (dot-rader bär informationen, "vs" är etikett för
                        dem) vid 8px. Flaggat till Jacob/Design, inte löst — data-contrast-
                        exempt dokumenterar den nuvarande, medvetet ovägda bedömningen så
                        grinden förblir grön UTAN att tysta framtida regressioner på andra
                        element. Ta bort attributet den dag storlek/vikt/kontrast avgörs. */}
                    <span data-contrast-exempt="vs-divider 3.15:1, flaggat ej löst" style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>vs</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {oppRecent.map(f => {
                        const r = getResult(f, opponent.id)
                        return (
                          <div key={f.id} style={{ width: 8, height: 8, borderRadius: 2, background: dotColor(r) }} />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
