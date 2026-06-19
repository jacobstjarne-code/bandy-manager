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
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>
          Spelstil · samma som i matchförberedelsen
        </p>
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {SPELSTIL.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setMentality(s.id)}
              style={{
                flex: 1, textAlign: 'center', padding: '7px 4px',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                border: 'none', borderRight: i === SPELSTIL.length - 1 ? 'none' : '1px solid var(--border)',
                background: mentality === s.id ? 'var(--accent)' : 'transparent',
                color: mentality === s.id ? 'var(--text-light)' : 'var(--text-muted)',
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
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            📋 Planen · {club.activeTactic.formation ?? '3-3-4'}
          </p>
          <button
            onClick={() => setShowChemistry(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 9, fontWeight: 600, letterSpacing: '0.5px',
              color: showChemistry ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font-body)',
            }}
          >
            Kemi
            <span style={{
              width: 26, height: 14, borderRadius: 99, padding: 2,
              background: showChemistry ? 'var(--accent)' : 'var(--border)',
              display: 'inline-flex', justifyContent: showChemistry ? 'flex-end' : 'flex-start',
              transition: 'all 0.15s',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-elevated)' }} />
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
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.45, marginTop: 8 }}>
          {feel}
        </p>
      </div>

      {/* Anteckningar — som kort under, inte en egen flik */}
      <div style={{ margin: '8px 12px 0', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 11px' }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
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
