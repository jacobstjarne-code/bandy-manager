import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { TabBar } from '../TabBar'
import { FormationView } from './FormationView'
import { ChemistryView } from './ChemistryView'
import { NotesView } from './NotesView'

type TacticTab = 'formation' | 'chemistry' | 'notes'

interface TacticBoardCardProps {
  club: Club
  players: Player[]
  coach: AssistantCoach
  captainPlayerId: string | undefined
  chemistryStats: Record<string, number>
  onTacticChange: (tactic: Tactic) => void
}

export function TacticBoardCard({
  club, players, coach, captainPlayerId, chemistryStats, onTacticChange,
}: TacticBoardCardProps) {
  const [tab, setTab] = useState<TacticTab>('formation')

  const squadPlayers = players.filter(p => p.clubId === club.id)

  return (
    <div className="card-sharp" style={{ padding: 0, overflow: 'hidden', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: '10px 12px 0' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', color: 'var(--text-muted)' }}>
          📋 TAKTIKTAVLAN
        </p>
      </div>

      {/* Tabs */}
      <TabBar
        tabs={[
          { id: 'formation' as TacticTab, label: 'FORMATION' },
          { id: 'chemistry' as TacticTab, label: 'KEMI' },
          { id: 'notes' as TacticTab, label: 'ANTECKNINGAR' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Tab description */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderBottom: '0.5px solid var(--border)' }}>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {tab === 'formation' && 'Välj formation och flytta spelare.'}
          {tab === 'chemistry' && 'Grön linje = bra kemi. Röd streckad = svag.'}
          {tab === 'notes' && 'Assistenttränarens observationer inför nästa match.'}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {tab === 'formation' && (
          <FormationView
            tactic={club.activeTactic}
            players={squadPlayers}
            onChange={onTacticChange}
          />
        )}
        {tab === 'chemistry' && (
          <ChemistryView
            tactic={club.activeTactic}
            players={squadPlayers}
            chemistryStats={chemistryStats}
          />
        )}
        {tab === 'notes' && (
          <NotesView
            coach={coach}
            players={squadPlayers}
            captainPlayerId={captainPlayerId}
          />
        )}
      </div>
    </div>
  )
}
