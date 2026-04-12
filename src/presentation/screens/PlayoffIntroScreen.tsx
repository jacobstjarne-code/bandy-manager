import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function PlayoffIntroScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearPlayoffIntro = useGameStore(s => s.clearPlayoffIntro)

  if (!game) { navigate('/game', { replace: true }); return null }

  const g = game
  const bracket = g.playoffBracket
  const club = g.clubs.find(c => c.id === g.managedClubId)
  const standing = g.standings.find(s => s.clubId === g.managedClubId)
  const position = standing?.position ?? 0
  const points = standing?.points ?? 0
  const qualified = position > 0 && position <= 8

  function getClubName(id: string) {
    return g.clubs.find(c => c.id === id)?.shortName
      ?? g.clubs.find(c => c.id === id)?.name
      ?? '?'
  }

  function handleContinue() {
    clearPlayoffIntro()
    navigate('/game/dashboard', { replace: true })
  }

  const qfMatchups = bracket?.quarterFinals ?? []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="texture-wood card-stack" style={{ flex: 1, overflowY: 'auto', padding: '24px 0 120px' }}>

        {/* ── RUBRIK ── */}
        <div style={{ textAlign: 'center', padding: '0 20px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            {club?.name ?? 'Klubben'}
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'Georgia, serif', color: 'var(--accent)', marginBottom: 4, lineHeight: 1.1 }}>
            {qualified ? 'SLUTSPELET BÖRJAR' : 'GRUNDSERIEN KLAR'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {qualified ? 'Topp 8 — ni är med i slutspelet' : 'Säsongen fortsätter utan er i slutspelet'}
          </p>
        </div>

        {/* ── SLUTPLACERING ── */}
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
            📊 GRUNDSERIERESULTAT
          </p>
          <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: qualified ? 'var(--success)' : 'var(--text-primary)', lineHeight: 1 }}>
                {position}
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>slutplats</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                {points}
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>poäng</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {qualified
              ? `${club?.name ?? 'Ni'} slutade på plats ${position} och är klara för kvartsfinalen.`
              : `${club?.name ?? 'Ni'} slutade på plats ${position} och kvalificerade sig inte till slutspelet. Säsongen är slut.`}
          </p>
        </div>

        {/* ── SLUTSPELSLOTTNING ── */}
        {bracket && qfMatchups.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
              🏒 KVARTSFINALERNA
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qfMatchups.map((series) => {
                const isManaged = series.homeClubId === g.managedClubId || series.awayClubId === g.managedClubId
                const home = getClubName(series.homeClubId)
                const away = getClubName(series.awayClubId)
                return (
                  <div
                    key={series.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      background: isManaged ? 'rgba(var(--accent-rgb, 201,168,76), 0.08)' : 'var(--bg-elevated)',
                      borderRadius: 6,
                      border: isManaged ? '1px solid rgba(var(--accent-rgb, 201,168,76), 0.3)' : '1px solid var(--border)',
                    }}
                  >
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

        {/* ── TOPP 8 TABELL ── */}
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px 16px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
            📋 FINAL TABELL — TOPP 8
          </p>
          {g.standings
            .filter(s => s.position <= 8)
            .sort((a, b) => a.position - b.position)
            .map(s => {
              const c = g.clubs.find(cl => cl.id === s.clubId)
              const isManaged = s.clubId === g.managedClubId
              return (
                <div key={s.clubId} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 18, textAlign: 'right' }}>{s.position}</span>
                  <span style={{ fontSize: 12, fontWeight: isManaged ? 700 : 400, color: isManaged ? 'var(--accent)' : 'var(--text-primary)', flex: 1 }}>
                    {c?.shortName ?? c?.name ?? '?'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: isManaged ? 700 : 400 }}>{s.points}p</span>
                </div>
              )
            })}
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
          {qualified ? 'Till kvartsfinalerna →' : 'Stäng säsongen →'}
        </button>
      </div>
    </div>
  )
}
