import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function QFSummaryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearQFSummary = useGameStore(s => s.clearQFSummary)

  if (!game) { navigate('/game', { replace: true }); return null }

  const g = game
  const bracket = g.playoffBracket

  function getClubName(id: string) {
    const c = g.clubs.find(cl => cl.id === id)
    return c?.shortName ?? c?.name ?? '?'
  }

  function handleContinue() {
    clearQFSummary()
    navigate('/game/dashboard', { replace: true })
  }

  const qfMatchups = bracket?.quarterFinals ?? []
  const sfMatchups = bracket?.semiFinals ?? []
  const managedQF = qfMatchups.find(s => s.homeClubId === g.managedClubId || s.awayClubId === g.managedClubId)
  const managedAdvanced = managedQF?.winnerId === g.managedClubId
  const managedSF = sfMatchups.find(s => s.homeClubId === g.managedClubId || s.awayClubId === g.managedClubId)
  const sfOpponentId = managedSF
    ? (managedSF.homeClubId === g.managedClubId ? managedSF.awayClubId : managedSF.homeClubId)
    : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowY: 'auto' }}>

      {/* ── RUBRIK ── */}
      <div style={{ textAlign: 'center', padding: '40px 20px 16px' }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
          ⚔️ KVARTSFINALERNA AVGJORDA
        </p>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.3, marginBottom: 6 }}>
          Fyra lag kvar
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {managedAdvanced
            ? 'Semifinalerna väntar. Bäst av fem.'
            : 'Ni är utslagna. Bra fight.'}
        </p>
      </div>

      {/* ── QF-RESULTAT ── */}
      <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 6 }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
          🏒 KVARTSFINALER — RESULTAT
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {qfMatchups.map((series, i) => {
            const isManaged = series.homeClubId === g.managedClubId || series.awayClubId === g.managedClubId
            const home = getClubName(series.homeClubId)
            const away = getClubName(series.awayClubId)
            const homeWon = series.winnerId === series.homeClubId
            const awayWon = series.winnerId === series.awayClubId
            const managedIsHome = series.homeClubId === g.managedClubId
            const managedWon = series.winnerId === g.managedClubId
            return (
              <div key={series.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 8px',
                borderBottom: i < qfMatchups.length - 1 ? '1px solid var(--border)' : 'none',
                background: isManaged ? 'rgba(196,122,58,0.06)' : 'transparent',
                borderRadius: isManaged && i === qfMatchups.length - 1 ? 4 : 0,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: homeWon ? 700 : 400,
                  color: isManaged && managedIsHome && managedWon
                    ? 'var(--accent)'
                    : homeWon ? 'var(--text-primary)' : 'var(--text-muted)',
                  flex: 1,
                }}>{home}</span>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: 'var(--accent)',
                  fontFamily: 'Georgia, serif', width: 40, textAlign: 'center',
                }}>{series.homeWins}–{series.awayWins}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: awayWon ? 700 : 400,
                  color: isManaged && !managedIsHome && managedWon
                    ? 'var(--accent)'
                    : awayWon ? 'var(--text-primary)' : 'var(--text-muted)',
                  flex: 1, textAlign: 'right',
                }}>{away}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SEMIFINALPAR ── */}
      {sfMatchups.length > 0 && (
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 6 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            ⚔️ SEMIFINALER — BÄST AV 5
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sfMatchups.map(series => {
              const isManaged = series.homeClubId === g.managedClubId || series.awayClubId === g.managedClubId
              const home = getClubName(series.homeClubId)
              const away = getClubName(series.awayClubId)
              return (
                <div key={series.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 8px',
                  background: isManaged ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
                  border: isManaged ? '1px solid rgba(196,122,58,0.2)' : 'none',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: isManaged && series.homeClubId === g.managedClubId ? 'var(--accent)' : 'var(--text-primary)' }}>{home}</span>
                  <span style={{ fontSize: 10, color: isManaged ? 'var(--accent)' : 'var(--text-muted)' }}>vs</span>
                  <span style={{ fontSize: 12, fontWeight: isManaged && series.awayClubId === g.managedClubId ? 700 : 600, color: isManaged && series.awayClubId === g.managedClubId ? 'var(--accent)' : 'var(--text-primary)', flex: 1, textAlign: 'right' }}>{away}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STÄMNINGSTEXT ── */}
      <div className="card-round" style={{ padding: '8px 12px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'Georgia, serif', margin: 0 }}>
          {managedAdvanced && sfOpponentId
            ? `Två steg kvar till SM-guld. Nästa motståndare: ${getClubName(sfOpponentId)}.`
            : managedAdvanced
              ? 'Två steg kvar till SM-guld.'
              : 'Kvartsfinalerna avgjorda. Fyra lag kämpar vidare.'}
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '0 16px 24px', marginTop: 'auto' }}>
        <button
          onClick={handleContinue}
          className="texture-leather"
          style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
            color: 'var(--text-light)',
            borderRadius: 12, fontSize: 14, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', border: 'none', fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          {managedAdvanced ? 'Starta semifinalerna →' : 'Stäng →'}
        </button>
      </div>
    </div>
  )
}
