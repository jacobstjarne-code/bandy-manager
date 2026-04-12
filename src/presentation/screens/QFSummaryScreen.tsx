import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function QFSummaryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearQFSummary = useGameStore(s => s.clearQFSummary)

  if (!game) { navigate('/game', { replace: true }); return null }

  const g = game
  const bracket = g.playoffBracket
  const club = g.clubs.find(c => c.id === g.managedClubId)

  function getClubName(id: string) {
    return g.clubs.find(c => c.id === id)?.shortName
      ?? g.clubs.find(c => c.id === id)?.name
      ?? '?'
  }

  function handleContinue() {
    clearQFSummary()
    navigate('/game/dashboard', { replace: true })
  }

  const qfMatchups = bracket?.quarterFinals ?? []
  const sfMatchups = bracket?.semiFinals ?? []
  const managedQF = qfMatchups.find(s => s.homeClubId === g.managedClubId || s.awayClubId === g.managedClubId)
  const managedAdvanced = managedQF?.winnerId === g.managedClubId
  const managedEliminated = managedQF?.loserId === g.managedClubId

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="texture-wood card-stack" style={{ flex: 1, overflowY: 'auto', padding: '24px 0 120px' }}>

        {/* ── RUBRIK ── */}
        <div style={{ textAlign: 'center', padding: '0 20px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            {club?.name ?? 'Klubben'}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Georgia, serif', color: 'var(--accent)', marginBottom: 4, lineHeight: 1.1 }}>
            KVARTSFINALERNA KLARA
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {managedAdvanced
              ? 'Ni gick vidare — dags för semifinal'
              : managedEliminated
                ? 'Ni är utslagna — säsongen är slut'
                : 'Fyra lag kvar i kampen om SM-guldet'}
          </p>
        </div>

        {/* ── QF-RESULTAT ── */}
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
            🏒 KVARTSFINALRESULTAT
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {qfMatchups.map(series => {
              const isManaged = series.homeClubId === g.managedClubId || series.awayClubId === g.managedClubId
              const home = getClubName(series.homeClubId)
              const away = getClubName(series.awayClubId)
              const winnerName = series.winnerId ? getClubName(series.winnerId) : null
              const isHomeManaged = series.homeClubId === g.managedClubId
              const myWins = series.winnerId
                ? (isHomeManaged ? series.homeWins : series.awayWins)
                : 0
              const theirWins = series.winnerId
                ? (isHomeManaged ? series.awayWins : series.homeWins)
                : 0
              return (
                <div key={series.id} style={{
                  padding: '10px 12px',
                  background: isManaged ? 'rgba(var(--accent-rgb, 201,168,76), 0.06)' : 'var(--bg-elevated)',
                  borderRadius: 6,
                  border: isManaged ? '1px solid rgba(var(--accent-rgb, 201,168,76), 0.25)' : '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: series.homeClubId === series.winnerId ? 700 : 400, color: series.homeClubId === series.winnerId ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {home}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: 2 }}>
                      {series.homeWins}–{series.awayWins}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: series.awayClubId === series.winnerId ? 700 : 400, color: series.awayClubId === series.winnerId ? 'var(--success)' : 'var(--text-secondary)', textAlign: 'right' }}>
                      {away}
                    </span>
                  </div>
                  {winnerName && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                      {winnerName} gick vidare ({isManaged ? `${myWins}–${theirWins}` : `${Math.max(series.homeWins, series.awayWins)}–${Math.min(series.homeWins, series.awayWins)}`} i matcher)
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SEMIFINALPAR ── */}
        {sfMatchups.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
              ⚔️ SEMIFINALERNA
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sfMatchups.map(series => {
                const isManaged = series.homeClubId === g.managedClubId || series.awayClubId === g.managedClubId
                const home = getClubName(series.homeClubId)
                const away = getClubName(series.awayClubId)
                return (
                  <div key={series.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px',
                    background: isManaged ? 'rgba(var(--accent-rgb, 201,168,76), 0.08)' : 'var(--bg-elevated)',
                    borderRadius: 6,
                    border: isManaged ? '1px solid rgba(var(--accent-rgb, 201,168,76), 0.3)' : '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: isManaged ? 700 : 400, color: isManaged ? 'var(--accent)' : 'var(--text-primary)', flex: 1 }}>
                      {home}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>vs</span>
                    <span style={{ fontSize: 11, fontWeight: isManaged ? 700 : 400, color: isManaged ? 'var(--accent)' : 'var(--text-primary)', flex: 1, textAlign: 'right' }}>
                      {away}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
          {managedAdvanced ? 'Till semifinalerna →' : 'Stäng →'}
        </button>
      </div>
    </div>
  )
}
