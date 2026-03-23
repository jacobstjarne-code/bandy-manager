import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'
import { CLUB_TEMPLATES } from '../../domain/services/worldGenerator'

function difficultyLabel(reputation: number): { label: string; color: string } {
  if (reputation >= 75) return { label: 'Lätt', color: '#22c55e' }
  if (reputation >= 55) return { label: 'Normal', color: '#f59e0b' }
  return { label: 'Svår', color: '#ef4444' }
}

const CLUBS = CLUB_TEMPLATES.map(t => ({
  id: t.id,
  name: t.name,
  region: t.region,
  reputation: t.reputation,
  youthQuality: t.youthQuality,
  ...difficultyLabel(t.reputation),
}))

function ReputationStars({ value }: { value: number }) {
  const stars = Math.round(value / 20) // 0-100 -> 0-5 stars
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={12}
          fill={i <= stars ? 'var(--warning)' : 'transparent'}
          color={i <= stars ? 'var(--warning)' : 'var(--text-muted)'}
        />
      ))}
    </div>
  )
}

export function NewGameScreen() {
  const navigate = useNavigate()
  const { newGame } = useGameStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [managerName, setManagerName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = () => {
    if (!selectedClubId || !managerName.trim()) return
    setIsStarting(true)
    setTimeout(() => {
      newGame(managerName.trim(), selectedClubId)
      navigate('/game/dashboard')
    }, 50)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          onClick={() => step === 2 ? setStep(1) : navigate('/')}
          style={{ background: 'none', color: 'var(--text-secondary)', padding: 4 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Nytt spel</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Steg {step} av 2</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', height: 3 }}>
        <div style={{ flex: 1, background: 'var(--accent)' }} />
        <div style={{ flex: 1, background: step === 2 ? 'var(--accent)' : 'var(--border)' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {step === 1 ? (
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Ditt namn</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
              Vad ska du kallas?
            </p>
            <input
              autoFocus
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && managerName.trim() && setStep(2)}
              placeholder="Förnamn Efternamn"
              maxLength={40}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Välj klubb</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              Varje klubb har sin historia. Välj din.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CLUBS.map(club => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClubId(club.id)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: selectedClubId === club.id ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedClubId === club.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                      {club.name}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: club.color,
                      padding: '2px 8px',
                      background: `${club.color}20`,
                      borderRadius: 20,
                    }}>
                      {club.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{club.region}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
                    <ReputationStars value={club.reputation} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Rykte {club.reputation}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Ungdom {club.youthQuality}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        padding: '16px 20px',
        paddingBottom: 'calc(16px + var(--safe-bottom))',
        borderTop: '1px solid var(--border)',
      }}>
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!managerName.trim()}
            style={{
              width: '100%',
              padding: '15px 24px',
              background: managerName.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
              color: managerName.trim() ? '#fff' : 'var(--text-muted)',
              borderRadius: 'var(--radius)',
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Välj klubb <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!selectedClubId || isStarting}
            style={{
              width: '100%',
              padding: '15px 24px',
              background: selectedClubId && !isStarting ? 'var(--accent)' : 'var(--bg-elevated)',
              color: selectedClubId && !isStarting ? '#fff' : 'var(--text-muted)',
              borderRadius: 'var(--radius)',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {isStarting ? 'Startar karriär...' : 'Starta karriär'}
          </button>
        )}
      </div>
    </div>
  )
}
