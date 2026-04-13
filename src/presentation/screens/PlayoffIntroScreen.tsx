import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { FixtureStatus } from '../../domain/enums'

export function PlayoffIntroScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearPlayoffIntro = useGameStore(s => s.clearPlayoffIntro)

  if (!game) { navigate('/game', { replace: true }); return null }

  const g = game
  const bracket = g.playoffBracket
  const standing = g.standings.find(s => s.clubId === g.managedClubId)
  const position = standing?.position ?? 0
  const qualified = position > 0 && position <= 8

  function getClubName(id: string) {
    const c = g.clubs.find(cl => cl.id === id)
    return c?.shortName ?? c?.name ?? '?'
  }

  function handleContinue() {
    clearPlayoffIntro()
    navigate('/game/dashboard', { replace: true })
  }

  const qfMatchups = bracket?.quarterFinals ?? []
  const top8 = g.standings.filter(s => s.position <= 8).sort((a, b) => a.position - b.position)

  // Compute last 5 results for managed club
  const managedResults = g.fixtures
    .filter(f =>
      f.status === FixtureStatus.Completed &&
      !f.isCup &&
      (f.homeClubId === g.managedClubId || f.awayClubId === g.managedClubId)
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 5)

  const club = g.clubs.find(c => c.id === g.managedClubId)
  const goalDiff = standing ? standing.goalsFor - standing.goalsAgainst : 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowY: 'auto' }}>

      {/* ── RUBRIK ── */}
      <div style={{ textAlign: 'center', padding: '40px 20px 20px' }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
          ⚔️ SLUTSPEL
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.3, marginBottom: 6 }}>
          Grundserien avklarad
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {qualified
            ? '22 omgångar. Nu börjar det som räknas.'
            : 'Säsongen är slut. Ni kvalade inte till slutspelet.'}
        </p>
      </div>

      {/* ── KLUBBKORT ── */}
      <div className="card-sharp" style={{ padding: '14px 16px', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 42, fontWeight: 400, color: 'var(--accent)', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              {position}
            </span>
            <p style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 2 }}>
              PLACERING
            </p>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
              {club?.name ?? 'Klubben'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {standing?.points ?? 0}p · {standing?.wins ?? 0}V {standing?.draws ?? 0}O {standing?.losses ?? 0}F · {goalDiff >= 0 ? '+' : ''}{goalDiff}
            </p>
            {managedResults.length > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {managedResults.map((f, i) => {
                  const isHome = f.homeClubId === g.managedClubId
                  const myScore = isHome ? f.homeScore : f.awayScore
                  const theirScore = isHome ? f.awayScore : f.homeScore
                  const result = myScore > theirScore ? 'win' : myScore < theirScore ? 'loss' : 'draw'
                  return (
                    <span key={i} style={{
                      width: 8, height: 8, borderRadius: 2,
                      background: result === 'win' ? 'var(--success)' : result === 'loss' ? 'var(--danger)' : 'var(--border-dark)',
                    }} />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TOPP 8 TABELL ── */}
      <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 6 }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
          📊 TOPP 8 — SLUTSPELSKLARA
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 600 }}>#</th>
              <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 600 }}>Lag</th>
              <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: 600 }}>P</th>
              <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: 600 }}>MS</th>
            </tr>
          </thead>
          <tbody>
            {top8.map(s => {
              const c = g.clubs.find(cl => cl.id === s.clubId)
              const isManaged = s.clubId === g.managedClubId
              const gd = s.goalsFor - s.goalsAgainst
              return (
                <tr key={s.clubId} style={{
                  color: isManaged ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isManaged ? 'rgba(196,122,58,0.06)' : 'transparent',
                }}>
                  <td style={{ padding: '3px 0', fontWeight: isManaged ? 700 : 600, color: 'var(--accent)' }}>{s.position}</td>
                  <td style={{ fontWeight: isManaged ? 700 : 400 }}>{c?.shortName ?? c?.name ?? '?'}</td>
                  <td style={{ textAlign: 'right', fontWeight: isManaged ? 700 : 600 }}>{s.points}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: isManaged ? 600 : 400 }}>{gd >= 0 ? '+' : ''}{gd}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── KVARTSFINALPAR ── */}
      {bracket && qfMatchups.length > 0 && (
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 6 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
            🏒 KVARTSFINALER — BÄST AV 5
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {qfMatchups.map((series) => {
              const isManaged = series.homeClubId === g.managedClubId || series.awayClubId === g.managedClubId
              const home = getClubName(series.homeClubId)
              const away = getClubName(series.awayClubId)
              const homeStanding = g.standings.find(s => s.clubId === series.homeClubId)
              const awayStanding = g.standings.find(s => s.clubId === series.awayClubId)
              const homeSeed = homeStanding?.position ?? ''
              const awaySeed = awayStanding?.position ?? ''
              return (
                <div
                  key={series.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px',
                    background: isManaged ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
                    border: isManaged ? '1px solid rgba(196,122,58,0.2)' : 'none',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 14 }}>{homeSeed}.</span>
                    <span style={{ fontSize: 12, fontWeight: isManaged ? 700 : 600, color: isManaged ? 'var(--accent)' : 'var(--text-primary)' }}>{home}</span>
                  </div>
                  <span style={{ fontSize: 10, color: isManaged ? 'var(--accent)' : 'var(--text-muted)' }}>vs</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: isManaged ? 700 : 600, color: isManaged ? 'var(--accent)' : 'var(--text-primary)' }}>{away}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 14, textAlign: 'right' }}>{awaySeed}.</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STÄMNINGSTEXT ── */}
      <div className="card-round" style={{ padding: '8px 12px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'Georgia, serif', margin: 0 }}>
          {qualified
            ? 'Bäst av fem. Hemmaplansfördel för högst placerad. Första matchen på onsdag.'
            : 'Grundserien är avklarad. Det finns alltid nästa säsong.'}
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '0 16px calc(24px + env(safe-area-inset-bottom, 0px))', marginTop: 'auto' }}>
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
          {qualified ? 'Starta slutspelet →' : 'Stäng säsongen →'}
        </button>
      </div>
    </div>
  )
}
