import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { useGameStore } from '../../store/gameStore'
import { generateBasicAnalysis } from '../../../domain/services/opponentAnalysisService'
import { ordinal } from '../../utils/formatters'

interface OpponentAnalysisCardProps {
  fixture: Fixture
  opponent: Club
  game: SaveGame
  onError: (err: string) => void
}

export function OpponentAnalysisCard({ fixture, opponent, game, onError }: OpponentAnalysisCardProps) {
  const requestDetailedAnalysis = useGameStore(s => s.requestDetailedAnalysis)

  const savedAnalysis = game.opponentAnalyses?.[opponent.id]
  const opponentPlayers = game.players.filter(p => p.clubId === opponent.id)
  const basicAnalysis = generateBasicAnalysis(opponent, opponentPlayers, game.standings, game.fixtures, fixture.id)
  const displayAnalysis = savedAnalysis ?? basicAnalysis

  return (
    <div style={{
      margin: '0 16px 12px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        📊 Motståndaranalys
      </p>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {opponent.name}
        {displayAnalysis.tablePosition && ` · ${ordinal(displayAnalysis.tablePosition)} plats`}
        {displayAnalysis.recentForm && ` · ${displayAnalysis.recentForm}`}
      </p>

      {displayAnalysis.level === 'detailed' && displayAnalysis.style && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Spelstil: {displayAnalysis.style}
          {displayAnalysis.formation && ` · Formation: ${displayAnalysis.formation}`}
        </p>
      )}

      {displayAnalysis.keyPlayers.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Nyckelspelare:</p>
          {displayAnalysis.keyPlayers.map((kp, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
              {kp.name} ({kp.position.slice(0, 3).toUpperCase()}) · Styrka ~{kp.estimatedCA}
            </div>
          ))}
        </div>
      )}

      {displayAnalysis.level === 'detailed' && (
        <>
          {displayAnalysis.strengths.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 4 }}>
              ✅ {displayAnalysis.strengths.join(', ')}
            </p>
          )}
          {displayAnalysis.weaknesses.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>
              ⚠️ {displayAnalysis.weaknesses.join(', ')}
            </p>
          )}
          {displayAnalysis.recommendation && (
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, fontStyle: 'italic' }}>
              💡 {displayAnalysis.recommendation}
            </p>
          )}
        </>
      )}

      {displayAnalysis.level === 'basic' && (
        <button
          onClick={() => {
            const result = requestDetailedAnalysis(opponent.id, fixture.id)
            if (!result.success && result.error) {
              onError(result.error)
            }
          }}
          style={{
            marginTop: 10, padding: '8px 14px',
            background: 'rgba(196,122,58,0.1)', border: '1px solid rgba(196,122,58,0.3)',
            borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            cursor: 'pointer', width: '100%',
          }}
        >
          🔎 Fördjupad analys (1 budget · kvar: {game.scoutBudget})
        </button>
      )}
    </div>
  )
}
