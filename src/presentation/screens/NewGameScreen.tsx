import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Star } from 'lucide-react'
import { CLUB_TEMPLATES } from '../../domain/services/worldGenerator'

function difficultyLabel(reputation: number): { label: string; color: string } {
  if (reputation >= 75) return { label: 'Lätt', color: 'var(--success)' }
  if (reputation >= 55) return { label: 'Normal', color: 'var(--warning)' }
  return { label: 'Svår', color: 'var(--danger)' }
}

const CLUB_FLAVOR: Record<string, string> = {
  'club_sandviken':  'Hårda tag på hård is. Storvik ger sig aldrig.',
  'club_sirius':     'Akademisk stad, hungrig klubb. Tierp vill uppåt.',
  'club_vasteras':   'Hallstahammar andas bandy. Förväntningarna är höga.',
  'club_broberg':    'Den lilla klubben med de stora drömmarna.',
  'club_villa':      'Lödöse har allt att bevisa. Nykomlingens hunger.',
  'club_falun':      'Gagnefs IF — envishet i blodet. De ger aldrig upp.',
  'club_ljusdal':    'Bergsjö. Liten budget, stort hjärta.',
  'club_edsbyn':     'Alfta — tradition i varje fiber.',
  'club_tillberga':  'Kolbäck. Underdogen. Ingen tror på er.',
  'club_kungalv':    'Bohus BK. Västkustbandy med attityd.',
  'club_skutskar':   'Skutskär. Upplands stolthet på isen.',
  'club_soderhamns': 'Iggesund. Där bandyn lever året runt.',
}

const CLUBS = CLUB_TEMPLATES.map(t => ({
  id: t.id,
  name: t.name,
  region: t.region,
  reputation: t.reputation,
  youthQuality: t.youthQuality,
  flavor: CLUB_FLAVOR[t.id] ?? 'En stolt bandyklubb med ambitioner.',
  ...difficultyLabel(t.reputation),
}))

function ReputationStars({ value }: { value: number }) {
  const stars = Math.round(value / 20)
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
  const [step, setStep] = useState<'name' | 'club'>('name')
  const [managerName, setManagerName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = () => {
    if (!selectedClubId || !managerName.trim()) return
    setIsStarting(true)
    setTimeout(() => {
      try {
        newGame(managerName.trim(), selectedClubId)
        navigate('/game/dashboard')
      } catch (e) {
        console.error('handleStart misslyckades:', e)
        setIsStarting(false)
      }
    }, 50)
  }

  // Name step
  if (step === 'name') {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-dark)',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 24,
          }}>
            NYTT UPPDRAG
          </p>
          <h2 style={{
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--text-light)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: 32,
            textAlign: 'center',
          }}>
            VEM ÄR DU?
          </h2>
          <input
            autoFocus
            type="text"
            value={managerName}
            onChange={e => setManagerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && managerName.trim() && setStep('club')}
            placeholder="Ditt namn"
            maxLength={40}
            style={{
              width: '100%',
              maxWidth: 300,
              padding: '12px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid rgba(196,122,58,0.5)',
              color: 'var(--accent)',
              fontSize: 22,
              fontWeight: 700,
              outline: 'none',
              textAlign: 'center',
              letterSpacing: '1px',
            }}
          />
        </div>
        <div style={{ padding: '20px 32px', paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <button
            onClick={() => setStep('club')}
            disabled={!managerName.trim()}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: 14,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              opacity: managerName.trim() ? 1 : 0.35,
              cursor: managerName.trim() ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s',
            }}
          >
            GÅ VIDARE →
          </button>
        </div>
      </div>
    )
  }

  // Club selection step
  const selectedClub = selectedClubId ? CLUBS.find(c => c.id === selectedClubId) : null

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
          onClick={() => setStep('name')}
          style={{ background: 'none', color: 'var(--text-secondary)', padding: 4, fontSize: 18 }}
        >
          ←
        </button>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Välj klubb</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{managerName}</p>
        </div>
      </div>

      {/* Club list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: selectedClub ? 140 : 80 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Varje klubb har sin historia. Välj din.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CLUBS.map(club => {
            const isSelected = selectedClubId === club.id
            return (
              <button
                key={club.id}
                onClick={() => setSelectedClubId(isSelected ? null : club.id)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: isSelected ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isSelected ? 'rgba(196,122,58,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {club.name}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: club.color,
                    padding: '2px 8px', background: `${club.color}20`, borderRadius: 20,
                  }}>
                    {club.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  {club.flavor}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{club.region}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
                  <ReputationStars value={club.reputation} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer CTA — fixed at bottom when club selected */}
      {selectedClub && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          padding: '16px 20px',
          paddingBottom: 'calc(16px + var(--safe-bottom))',
          background: 'linear-gradient(to top, #EDE8DF 70%, transparent)',
          borderTop: '1px solid rgba(196,122,58,0.15)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, textAlign: 'center' }}>
            Starta karriären som tränare för {selectedClub.name}?
          </p>
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="btn btn-copper"
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: 13,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: isStarting ? 'not-allowed' : 'pointer',
            }}
          >
            {isStarting ? 'STARTAR...' : 'ACCEPTERA UPPDRAGET'}
          </button>
        </div>
      )}
    </div>
  )
}
