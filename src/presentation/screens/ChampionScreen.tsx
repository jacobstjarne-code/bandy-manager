import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, useManagedClub } from '../store/gameStore'
import { PlayoffRound } from '../../domain/enums'

interface ConfettiParticle {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
}

function Confetti() {
  const particles: ConfettiParticle[] = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: (i * 37 + 11) % 100,
    delay: (i * 0.17) % 3,
    duration: 3 + (i * 0.13) % 3,
    color: i % 2 === 0 ? 'var(--accent)' : 'var(--accent-dark)',
    size: 6 + (i % 6),
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            animation: `confettiFall ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  )
}

export function ChampionScreen() {
  const { game, advance } = useGameStore()
  const club = useManagedClub()
  const navigate = useNavigate()
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (!game || !game.playoffBracket) {
      navigate('/game/dashboard', { replace: true })
    }
  }, [game, navigate])

  if (!game || !game.playoffBracket || !club) return null

  const bracket = game.playoffBracket
  const isChampion = bracket.champion === game.managedClubId
  const champion = game.clubs.find(c => c.id === bracket.champion)

  const handleNextSeason = () => {
    setAdvancing(true)
    advance()
    navigate('/game/dashboard', { replace: true })
  }

  // Find managed club's playoff run
  const allSeries = [
    ...bracket.quarterFinals,
    ...bracket.semiFinals,
    ...(bracket.final ? [bracket.final] : []),
  ]
  const managedSeries = allSeries.filter(
    s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
  )

  function getRoundLabel(round: PlayoffRound): string {
    if (round === PlayoffRound.QuarterFinal) return 'Kvartsfinal'
    if (round === PlayoffRound.SemiFinal) return 'Semifinal'
    return 'SM-Final'
  }

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      padding: 'max(24px, 5vh) 20px 24px',
    }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goldPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(196,122,58,0.4); }
          50% { text-shadow: 0 0 40px rgba(196,122,58,0.8), 0 0 60px rgba(196,122,58,0.4); }
        }
      `}</style>

      {isChampion && <Confetti />}

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360, width: '100%' }}>
        {isChampion ? (
          <>
            <div style={{ fontSize: 80, marginBottom: 16 }}>
              <span role="img" aria-label="trophy">🏆</span>
            </div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--accent)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: 8,
              animation: 'goldPulse 2s ease-in-out infinite',
              fontFamily: 'var(--font-display)',
            }}>
              Svenska Mästare!
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>
              {club.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Säsong {game.currentSeason}/{game.currentSeason + 1}
            </p>
          </>
        ) : (() => {
          const lostInFinal = bracket.final?.loserId === game.managedClubId
          const lostInSemi = bracket.semiFinals.some(s => s.loserId === game.managedClubId)
          const icon = lostInFinal ? '🥈' : lostInSemi ? '🏅' : '🏋️'
          const title = lostInFinal ? 'Silvermedaljör' : lostInSemi ? 'Semifinalist' : 'Säsongen är slut'
          return (
          <>
            <div style={{ fontSize: 60, marginBottom: 16 }}>
              <span role="img" aria-label="medal">{icon}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
              {title}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {champion?.name ?? 'Motståndet'} tog SM-guldet säsong {game.currentSeason}/{game.currentSeason + 1}.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              {club.name} · Säsong {game.currentSeason}/{game.currentSeason + 1}
            </p>
          </>
        )})()}

        {/* Playoff run summary */}
        <div className="card-sharp" style={{
          padding: '16px',
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <p className="h-label" style={{ marginBottom: 12 }}>
            SLUTSPELSRESA
          </p>
          {managedSeries.length > 0 ? managedSeries.map(s => {
            const isHome = s.homeClubId === game.managedClubId
            const opponentId = isHome ? s.awayClubId : s.homeClubId
            const opponent = game.clubs.find(c => c.id === opponentId)
            const won = s.winnerId === game.managedClubId
            const roundLabel = getRoundLabel(s.round)
            const myWins = isHome ? s.homeWins : s.awayWins
            const theirWins = isHome ? s.awayWins : s.homeWins
            return (
              <div key={s.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {roundLabel} vs {opponent?.name ?? '?'}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: won ? 'var(--success)' : 'var(--danger)',
                }}>
                  {myWins}-{theirWins} {won ? '✓' : '✗'}
                </span>
              </div>
            )
          }) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nådde inte slutspelet</p>
          )}
        </div>

        <button
          onClick={handleNextSeason}
          disabled={advancing}
          style={{
            width: '100%',
            padding: '17px',
            background: 'var(--accent)',
            color: 'var(--text-light)',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            border: 'none',
            cursor: advancing ? 'not-allowed' : 'pointer',
            opacity: advancing ? 0.7 : 1,
          }}
        >
          Nästa säsong →
        </button>
      </div>
    </div>
  )
}
