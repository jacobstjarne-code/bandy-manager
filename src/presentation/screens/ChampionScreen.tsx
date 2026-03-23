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
    color: i % 2 === 0 ? '#C9A84C' : '#F0F4F8',
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
      background: '#0D1B2A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '24px 20px',
    }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goldPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(201,168,76,0.4); }
          50% { text-shadow: 0 0 40px rgba(201,168,76,0.8), 0 0 60px rgba(201,168,76,0.4); }
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
              color: '#C9A84C',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: 8,
              animation: 'goldPulse 2s ease-in-out infinite',
            }}>
              Svenska Mästare!
            </h1>
            <p style={{ fontSize: 16, color: '#F0F4F8', fontWeight: 700, marginBottom: 4 }}>
              {club.name}
            </p>
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 24 }}>
              Säsong {game.currentSeason}
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 60, marginBottom: 16 }}>
              <span role="img" aria-label="silver medal">🥈</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F0F4F8', marginBottom: 8 }}>
              En stark säsong
            </h1>
            <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 8 }}>
              {champion?.name ?? 'Motståndet'} tog SM-guldet säsong {game.currentSeason}.
            </p>
            <p style={{ fontSize: 13, color: '#4A6080', marginBottom: 24 }}>
              {club.name} · Säsong {game.currentSeason}
            </p>
          </>
        )}

        {/* Playoff run summary */}
        <div style={{
          background: '#122235',
          border: '1px solid #1e3450',
          borderRadius: 12,
          padding: '16px',
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 12 }}>
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
                <span style={{ fontSize: 12, color: '#8A9BB0' }}>
                  {roundLabel} vs {opponent?.name ?? '?'}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: won ? '#22c55e' : '#ef4444',
                }}>
                  {myWins}-{theirWins} {won ? '✓' : '✗'}
                </span>
              </div>
            )
          }) : (
            <p style={{ fontSize: 12, color: '#4A6080' }}>Nådde inte slutspelet</p>
          )}
        </div>

        <button
          onClick={handleNextSeason}
          disabled={advancing}
          style={{
            width: '100%',
            padding: '17px',
            background: '#C9A84C',
            color: '#0D1B2A',
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
