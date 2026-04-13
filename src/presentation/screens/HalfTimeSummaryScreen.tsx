import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { generateHalfTimeSummary } from '../../domain/services/halfTimeSummaryService'

export function HalfTimeSummaryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearHalfTimeSummary = useGameStore(s => s.clearHalfTimeSummary)

  if (!game) { navigate('/game', { replace: true }); return null }

  const summary = generateHalfTimeSummary(game)
  const club = game.clubs.find(c => c.id === game.managedClubId)

  function handleContinue() {
    clearHalfTimeSummary()
    navigate('/game/dashboard', { replace: true })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="texture-wood card-stack" style={{ flex: 1, overflowY: 'auto', padding: '24px 0 160px' }}>

        {/* ── RUBRIK ── */}
        <div style={{ textAlign: 'center', padding: '0 20px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            {club?.name ?? 'Klubben'}
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Georgia, serif', color: 'var(--accent)', marginBottom: 4, lineHeight: 1.1 }}>
            HALVVÄGS
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inför vårsäsongen</p>
        </div>

        {/* ── TABELLLÄGE ── */}
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
            📊 TABELLLÄGE
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: summary.position <= 8 ? 'var(--success)' : 'var(--text-primary)', lineHeight: 1 }}>
                {summary.position}
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>plats</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {summary.points}
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>poäng</p>
            </div>
            {summary.pointsToTop8 > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--warning)', lineHeight: 1 }}>
                  {summary.pointsToTop8}
                </p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>till topp 8</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {summary.tableText}
          </p>
        </div>

        {/* ── HÖSTENS STUNDER ── */}
        {summary.moments.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
              ⚡ HÖSTENS STUNDER
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.moments.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{m.emoji}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{m.headline}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>O{m.round} — {m.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARC-UPPDATERING ── */}
        {summary.arcText && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
              🔔 SPELARSITUATION
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {summary.arcText}
            </p>
          </div>
        )}

        {/* ── TRÄNARTIPS ── */}
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            💡 INFÖR VÅREN
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {summary.coachTip}
          </p>
        </div>

      </div>

      {/* ── CTA ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom, 0px))',
        background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
        zIndex: 50, pointerEvents: 'none',
      }}>
        <button
          onClick={handleContinue}
          className="texture-leather"
          style={{
            width: '100%', padding: '15px',
            background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
            color: 'var(--text-light)',
            borderRadius: 12, fontSize: 15, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', border: 'none', fontFamily: 'var(--font-body)',
            cursor: 'pointer', pointerEvents: 'auto',
          }}
        >
          Fortsätt säsongen →
        </button>
      </div>
    </div>
  )
}
