import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'
import { csColor, formatFinance, formatFinanceAbs } from '../utils/formatters'
import { FormSquares } from '../components/FormDots'
import { getFormResults } from '../utils/formUtils'
import { FixtureStatus, InboxItemType } from '../../domain/enums'
import { getRivalry } from '../../domain/data/rivalries'

export function RoundSummaryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const roundSummary = useGameStore(s => s.roundSummary)
  const clearRoundSummary = useGameStore(s => s.clearRoundSummary)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!roundSummary) navigate('/game/dashboard', { replace: true })
  }, [roundSummary, navigate])

  const soundsPlayed = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!roundSummary || soundsPlayed.current) return
    soundsPlayed.current = true
    const csDelta = (roundSummary.communityStandingAfter ?? 0) - (roundSummary.communityStandingBefore ?? roundSummary.communityStandingAfter ?? 0)
    if (csDelta > 0) setTimeout(() => playSound('communityUp'), 400)
    else if (csDelta < 0) setTimeout(() => playSound('communityDown'), 400)
    if (roundSummary.youthMatchResult?.includes('vann')) setTimeout(() => playSound('youthGoal'), 600)
    if (roundSummary.injuries && roundSummary.injuries.length > 0 && (roundSummary.communityStandingAfter ?? 50) < 20)
      setTimeout(() => playSound('crisis'), 800)
  }, [roundSummary])

  if (!roundSummary || !game) return null

  const {
    round, date, temperature,
    matchPlayed, matchScorers,
    communityStandingBefore, communityStandingAfter,
    financesBefore, financesAfter,
    injuries, newInboxCount,
    youthMatchResult,
  } = roundSummary

  const financesDelta = financesAfter - financesBefore
  const csDelta = communityStandingAfter - (communityStandingBefore ?? communityStandingAfter)
  const cs = communityStandingAfter

  const trainingFocus = game.managedClubTraining
  const activeProjects = (game.trainingProjects ?? []).filter(p => p.status === 'active')

  const formattedDate = new Date(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })

  // Derive match details from last completed fixture
  const lastFixture = game.lastCompletedFixtureId
    ? game.fixtures.find(f => f.id === game.lastCompletedFixtureId)
    : undefined
  const isHome = lastFixture?.homeClubId === game.managedClubId
  const myScore = lastFixture ? (isHome ? lastFixture.homeScore : lastFixture.awayScore) : 0
  const theirScore = lastFixture ? (isHome ? lastFixture.awayScore : lastFixture.homeScore) : 0
  const won = myScore > theirScore
  const lost = myScore < theirScore
  const homeClub = lastFixture ? game.clubs.find(c => c.id === lastFixture.homeClubId) : undefined
  const awayClub = lastFixture ? game.clubs.find(c => c.id === lastFixture.awayClubId) : undefined

  // Standing
  const standing = game.standings.find(s => s.clubId === game.managedClubId)

  // Recent form (last 5)
  const recentForm = getFormResults(game.managedClubId, game.fixtures, game.clubs)

  // Flavor text
  const margin = myScore - theirScore
  const totalGoals = myScore + theirScore
  const hasPenalties = lastFixture?.wentToPenalties
  const hasOT = lastFixture?.wentToOvertime && !hasPenalties
  const flavorText = !matchPlayed ? null
    : hasPenalties && won ? '🎯 Kalla nerver i straffarna'
    : hasPenalties && lost ? '😔 Straffarna avgjorde'
    : hasOT && won ? '⏱️ Avgjort i sista stund'
    : hasOT && lost ? '⏱️ Förlängt lidande'
    : won
    ? margin >= 3 ? '💪 Dominant insats'
      : totalGoals >= 8 ? '🔥 Målrik historia'
      : margin === 1 ? '😅 Knapp seger'
      : '✅ Klar vinst'
    : lost
    ? margin <= -3 ? '💣 Svår dag på jobbet'
      : margin === -1 ? '😤 Nära men inte nog'
      : '❌ Klar förlust'
    : totalGoals >= 8 ? '🎢 Dramatiskt kryss'
    : '🤝 Rättvis poängdelning'

  const resultColor = won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--accent)'

  const trainingLabel: Record<string, string> = {
    skating: 'Skridskoåkning', ballControl: 'Bollkontroll', passing: 'Passning',
    shooting: 'Skott', defending: 'Försvar', cornerPlay: 'Hörnor',
    physical: 'Fysik', tactical: 'Taktik', recovery: 'Återhämtning', matchPrep: 'Matchförberedelse',
  }

  // ── OTHER MATCHES this matchday ──
  const currentMatchday = lastFixture?.matchday ?? 0
  const otherResults = currentMatchday > 0
    ? game.fixtures.filter(f =>
        f.matchday === currentMatchday &&
        f.status === FixtureStatus.Completed &&
        f.homeClubId !== game.managedClubId &&
        f.awayClubId !== game.managedClubId
      )
    : []

  const getClubShort = (id: string) => {
    const c = game.clubs.find(cl => cl.id === id)
    return c?.shortName ?? c?.name ?? '?'
  }

  // Check if a club in this fixture is a rival or near us in standings
  const myPosition = standing?.position ?? 99
  const isRelevantFixture = (f: typeof otherResults[0]) => {
    const isRival = !!getRivalry(game.managedClubId, f.homeClubId) || !!getRivalry(game.managedClubId, f.awayClubId)
    const homePos = game.standings.find(s => s.clubId === f.homeClubId)?.position ?? 99
    const awayPos = game.standings.find(s => s.clubId === f.awayClubId)?.position ?? 99
    const isNearby = Math.abs(homePos - myPosition) <= 2 || Math.abs(awayPos - myPosition) <= 2
    return isRival || isNearby
  }

  // ── PRESS CLIPS from inbox ──
  const roundDate = date
  const pressClips = game.inbox.filter(item =>
    item.date === roundDate &&
    (item.type === InboxItemType.Media || item.type === InboxItemType.MediaEvent || item.type === InboxItemType.MatchResult)
  ).slice(0, 2)

  // ── TRANSFER RUMORS from inbox ──
  const transferRumors = game.inbox.filter(item =>
    item.date === roundDate &&
    (item.type === InboxItemType.Transfer || item.type === InboxItemType.TransferOffer || item.type === InboxItemType.TransferBidReceived || item.type === InboxItemType.TransferBidResult)
  ).slice(0, 2)

  function handleContinue() {
    clearRoundSummary()
    navigate('/game/dashboard', { replace: true })
  }

  const fadeIn = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.35s ease ${80 + i * 60}ms`,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Scrollable content */}
      <div className="texture-wood card-stack" style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 120 }}>

        {/* Header pill */}
        <div style={{ textAlign: 'center', marginBottom: 14, ...fadeIn(0) }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            padding: '4px 14px', borderRadius: 99,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          }}>
            Omgång {round} · {formattedDate}
            {temperature !== undefined && (
              <span style={{ marginLeft: 6, color: temperature <= 0 ? 'var(--ice)' : 'var(--text-secondary)' }}>
                {temperature <= -5 ? '❄️' : temperature <= 0 ? '🌨' : '🌤'} {temperature > 0 ? '+' : ''}{temperature}°C
              </span>
            )}
          </span>
        </div>

        {/* ── MATCH HERO ── */}
        {matchPlayed && lastFixture ? (
          <div
            className="card-sharp"
            style={{ margin: '0 0 8px', overflow: 'hidden', cursor: 'pointer', ...fadeIn(1) }}
            onClick={() => navigate('/game/match-result')}
          >
            <div style={{ padding: '16px 14px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  🏒 {lastFixture.isCup ? 'CUPMATCH' : 'MATCHEN'}
                </p>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>›</span>
              </div>

              {/* Score */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{homeClub?.shortName ?? homeClub?.name}</p>
                  <span style={{ fontSize: 28, fontWeight: 800, color: resultColor, fontFamily: 'var(--font-display)' }}>
                    {lastFixture.homeScore}
                  </span>
                </div>
                <span style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 300 }}>–</span>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{awayClub?.shortName ?? awayClub?.name}</p>
                  <span style={{ fontSize: 28, fontWeight: 800, color: resultColor, fontFamily: 'var(--font-display)' }}>
                    {lastFixture.awayScore}
                  </span>
                </div>
              </div>

              {/* Flavor + scorers */}
              {flavorText && (
                <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: resultColor, marginBottom: 6 }}>
                  {flavorText}
                </p>
              )}
              {matchScorers && matchScorers.length > 0 && (
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  {matchScorers.join(' · ')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="card-sharp" style={{ margin: '0 0 8px', padding: '10px 14px', ...fadeIn(1) }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              🏒 MATCHEN
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ingen match denna omgång</p>
          </div>
        )}

        {/* ── Two-column: Tabell + Form ── */}
        {standing && (
          <div style={{ display: 'flex', gap: 8, margin: '0 0 8px', ...fadeIn(2) }}>
            <div className="card-sharp" style={{ flex: 1, padding: '10px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                📊 TABELL
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 400, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>
                  {standing.position}
                </span>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                    {standing.points}p · {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-sharp" style={{ flex: 1, padding: '10px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                📈 FORM
              </p>
              <FormSquares results={recentForm} size={22} />
            </div>
          </div>
        )}

        {/* ── Träning ── */}
        <div
          className="card-sharp"
          style={{ margin: '0 0 8px', padding: '10px 14px', cursor: 'pointer', ...fadeIn(3) }}
          onClick={() => navigate('/game/club')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                🏋️ TRÄNING
              </p>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {trainingLabel[trainingFocus?.type ?? ''] ?? 'Okänt fokus'}
              </span>
              {activeProjects.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {activeProjects.length} projekt
                </span>
              )}
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>›</span>
          </div>
        </div>

        {/* ── Akademin (conditional) ── */}
        {youthMatchResult && (
          <div
            className="card-sharp"
            style={{ margin: '0 0 8px', padding: '10px 14px', cursor: 'pointer', ...fadeIn(4) }}
            onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                  🎓 AKADEMIN
                </p>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{youthMatchResult}</span>
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>›</span>
            </div>
          </div>
        )}

        {/* ── Two-column: Orten + Ekonomi ── */}
        <div style={{ display: 'flex', gap: 8, margin: '0 0 8px', ...fadeIn(5) }}>
          {/* Orten */}
          <div
            className="card-sharp"
            style={{ flex: 1, padding: '10px 14px', cursor: 'pointer' }}
            onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
          >
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              🏘️ ORTEN
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: csColor(cs), fontFamily: 'var(--font-display)' }}>{cs}</span>
              {csDelta !== 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: csDelta > 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {csDelta > 0 ? `+${csDelta}` : String(csDelta)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ flex: cs, height: 5, background: csColor(cs), borderRadius: '3px 0 0 3px' }} />
              <div style={{ flex: 100 - cs, height: 5, background: 'var(--border-dark)', borderRadius: '0 3px 3px 0' }} />
            </div>
          </div>

          {/* Ekonomi */}
          <div
            className="card-sharp"
            style={{ flex: 1, padding: '10px 14px', cursor: 'pointer' }}
            onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
          >
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              💰 EKONOMI
            </p>
            <span style={{ fontSize: 20, fontWeight: 700, color: financesAfter < 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {formatFinanceAbs(financesAfter)}
            </span>
            {financesDelta !== 0 && (
              <p style={{ fontSize: 11, fontWeight: 600, color: financesDelta > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>
                {formatFinance(financesDelta)}/omg
              </p>
            )}
          </div>
        </div>

        {/* ── Alerts: injuries + inbox ── */}
        {(injuries.length > 0 || newInboxCount > 0) && (
          <div style={{ display: 'flex', gap: 8, margin: '0 0 8px', ...fadeIn(6) }}>
            {injuries.length > 0 && (
              <div
                className="card-sharp"
                style={{ flex: 1, padding: '10px 14px', cursor: 'pointer', borderLeft: '3px solid var(--danger)' }}
                onClick={() => navigate('/game/squad')}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>
                  🩹 {injuries.length} ny{injuries.length > 1 ? 'a skador' : ' skada'}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{injuries.join(', ')}</p>
              </div>
            )}
            {newInboxCount > 0 && (
              <div
                className="card-sharp"
                style={{ flex: injuries.length > 0 ? 'none' : 1, padding: '10px 14px', cursor: 'pointer', minWidth: injuries.length > 0 ? 80 : undefined }}
                onClick={() => navigate('/game/inbox')}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                  📬 {newInboxCount}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>nya</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANDRA MATCHER ── */}
        {otherResults.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 8px', padding: '10px 14px', ...fadeIn(7) }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              🏒 ANDRA MATCHER
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {otherResults.map(f => {
                const relevant = isRelevantFixture(f)
                return (
                  <div key={f.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '4px 0',
                    borderLeft: relevant ? '2px solid var(--accent)' : '2px solid transparent',
                    paddingLeft: 6,
                  }}>
                    <span style={{ fontSize: 12, color: relevant ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: relevant ? 600 : 400 }}>
                      {getClubShort(f.homeClubId)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', minWidth: 36, textAlign: 'center' }}>
                      {f.homeScore}–{f.awayScore}
                    </span>
                    <span style={{ fontSize: 12, color: relevant ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: relevant ? 600 : 400, textAlign: 'right' }}>
                      {getClubShort(f.awayClubId)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PRESSKLIPP ── */}
        {pressClips.length > 0 && (
          <div
            className="card-sharp"
            style={{ margin: '0 0 8px', padding: '10px 14px', cursor: 'pointer', ...fadeIn(8) }}
            onClick={() => navigate('/game/inbox')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                📰 PRESSKLIPP
              </p>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>›</span>
            </div>
            {pressClips.map(clip => (
              <div key={clip.id} style={{ marginBottom: pressClips.indexOf(clip) < pressClips.length - 1 ? 6 : 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 2 }}>
                  {clip.title}
                </p>
                {game.journalist && (clip.type === InboxItemType.Media || clip.type === InboxItemType.MediaEvent) && (
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    {game.journalist.name}, {game.journalist.outlet}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TRANSFERRYKTEN ── */}
        {transferRumors.length > 0 && (
          <div
            className="card-sharp"
            style={{ margin: '0 0 8px', padding: '10px 14px', cursor: 'pointer', ...fadeIn(9) }}
            onClick={() => navigate('/game/inbox')}
          >
            {transferRumors.map(rumor => (
              <p key={rumor.id} style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, marginBottom: transferRumors.indexOf(rumor) < transferRumors.length - 1 ? 4 : 0 }}>
                📰 Transferrykte: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rumor.title}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom, 0px))',
        background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
        zIndex: 50, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 0.3s',
      }}>
        <button onClick={handleContinue} className="texture-leather" style={{
          width: '100%', padding: '17px',
          background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
          color: 'var(--text-light)',
          borderRadius: 12, fontSize: 15, fontWeight: 600, letterSpacing: '2px',
          textTransform: 'uppercase', border: 'none', fontFamily: 'var(--font-body)',
          boxShadow: '0 4px 20px rgba(196,122,58,0.3)', cursor: 'pointer',
        }}>
          Nästa omgång →
        </button>
      </div>
    </div>
  )
}
