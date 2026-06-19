import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { TacticMentality } from '../../../domain/enums'
import { getTacticFeel } from '../../../domain/services/chemistryService'
import { FormationView } from './FormationView'
import { ChemistryView } from './ChemistryView'
import { NotesView } from './NotesView'

interface TacticBoardCardProps {
  club: Club
  players: Player[]
  coach: AssistantCoach
  captainPlayerId: string | undefined
  chemistryStats: Record<string, number>
  onTacticChange: (tactic: Tactic) => void
  matchday?: number
  nextOpponentName?: string
}

const SPELSTIL: Array<{ id: TacticMentality; label: string }> = [
  { id: TacticMentality.Defensive, label: 'Defensiv' },
  { id: TacticMentality.Balanced, label: 'Balanserad' },
  { id: TacticMentality.Offensive, label: 'Offensiv' },
]

// Genomgång II B: en taktik-hemvist, platt. Slut på pillrad-i-pillrad. Spelstilen
// är samma sanningskälla (club.activeTactic) som matchförberedelsen skriver till;
// kemin är ett lager på planen (toggle), anteckningarna ett kort under.
export function TacticBoardCard({
  club, players, coach, captainPlayerId, chemistryStats, onTacticChange, matchday, nextOpponentName,
}: TacticBoardCardProps) {
  const [showChemistry, setShowChemistry] = useState(false)

  const squadPlayers = players.filter(p => p.clubId === club.id)
  const mentality = club.activeTactic.mentality
  const feel = getTacticFeel(club.activeTactic, squadPlayers, chemistryStats)

  function setMentality(m: TacticMentality) {
    onTacticChange({ ...club.activeTactic, mentality: m })
  }

  return (
    <div className="card-sharp" style={{ padding: 0, overflow: 'hidden', marginBottom: 8 }}>
      {/* SPELSTIL — en sanningskälla, samma som matchförberedelsen */}
      <div style={{ padding: '10px 12px 8px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
          Spelstil · samma som i matchförberedelsen
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {SPELSTIL.map(s => (
            <button
              key={s.id}
              onClick={() => setMentality(s.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: mentality === s.id ? 'var(--accent)' : 'transparent',
                color: mentality === s.id ? 'var(--text-light)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Planen + kemi-lager (toggle) */}
      <div style={{ padding: '4px 12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            📋 Planen · {club.activeTactic.formation ?? '3-3-4'}
          </p>
          <button
            onClick={() => setShowChemistry(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 10, fontWeight: 600,
              color: showChemistry ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font-body)',
            }}
          >
            Kemi
            <span style={{
              width: 28, height: 16, borderRadius: 99, padding: 2,
              background: showChemistry ? 'var(--accent)' : 'var(--border)',
              display: 'inline-flex', justifyContent: showChemistry ? 'flex-end' : 'flex-start',
              transition: 'all 0.15s',
            }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-elevated)' }} />
            </span>
          </button>
        </div>
      </div>

      {/* Plan-yta: formation som default, kemi-lager när toggeln är på */}
      <div style={{ padding: '0 12px 4px' }}>
        {showChemistry ? (
          <ChemistryView
            tactic={club.activeTactic}
            players={squadPlayers}
            chemistryStats={chemistryStats}
          />
        ) : (
          <FormationView
            tactic={club.activeTactic}
            players={squadPlayers}
            onChange={onTacticChange}
          />
        )}
        {/* Så spelar det — härlett ur spelstil + faktisk kemi */}
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.45, marginTop: 10 }}>
          {feel}
        </p>
      </div>

      {/* Anteckningar — som kort under, inte en egen flik */}
      <div style={{ padding: '10px 12px 12px', borderTop: '0.5px solid var(--border)' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
          🗒 Assistentens anteckningar
        </p>
        <NotesView
          coach={coach}
          players={squadPlayers}
          captainPlayerId={captainPlayerId}
          matchday={matchday}
          nextOpponentName={nextOpponentName}
        />
      </div>
    </div>
  )
}
