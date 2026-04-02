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
  'club_sandviken':  'Hårda bollar. Hårda tag.',
  'club_sirius':     'Hungrig klubb med stora ambitioner.',
  'club_vasteras':   'Där alla andas bandy.',
  'club_broberg':    'Outsidern med de stora drömmarna.',
  'club_villa':      'Nykomlingen med allt att bevisa.',
  'club_falun':      'Envisa masar med stor historia.',
  'club_ljusdal':    'Brukets Blå knegar alltid på.',
  'club_edsbyn':     'Bandybaroner. Eldsjälar. Byalag.',
  'club_tillberga':  'Bandyklubb med udda bakgrund.',
  'club_kungalv':    'Blåtomtarna från Värmland.',
  'club_skutskar':   'Upplands stolthet.',
  'club_soderhamns': 'Arbetarbandyns urmoder.',
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
        background: 'var(--bg)',
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
            color: 'var(--text-primary)',
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
            className="btn btn-copper"
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
      {/* Header — same layout as GameHeader */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'var(--bg-dark)',
        borderBottom: '2px solid var(--accent)',
        flexShrink: 0,
        minHeight: 44,
      }}>
        <img
          src="/bandymanager-logo.png"
          alt="Bandy Manager"
          style={{ height: 28, width: 'auto', opacity: 0.85 }}
        />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,241,235,0.85)', margin: 0, lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
            Välj klubb
          </p>
          <p style={{ fontSize: 10, color: 'rgba(245,241,235,0.65)', margin: 0, lineHeight: 1.2 }}>
            {managerName} · 2026/2027
          </p>
        </div>
      </div>

      {/* Club list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: selectedClub ? 140 : 80 }}>
        <button
          onClick={() => setStep('name')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0 0 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Tillbaka
        </button>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Varje klubb har sin historia. Välj din.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CLUBS.map(club => {
            const isSelected = selectedClubId === club.id
            return (
              <button
                key={club.id}
                onClick={() => setSelectedClubId(isSelected ? null : club.id)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: isSelected ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isSelected ? 'rgba(196,122,58,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {club.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: club.color,
                    padding: '1px 7px', background: `${club.color}20`, borderRadius: 20,
                  }}>
                    {club.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {club.flavor}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10, flexShrink: 0 }}>{club.region}</span>
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
