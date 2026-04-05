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
      margin: '0 16px 8px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
          📋 VAD VET VI?
        </p>
        {displayAnalysis.level === 'basic' && (
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => {
              const result = requestDetailedAnalysis(opponent.id, fixture.id)
              if (!result.success && result.error) {
                onError(result.error)
              }
            }}
          >
            Fördjupa →
          </button>
        )}
      </div>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            🔎 Fördjupad analys (1 budget)
          </span>
          <span style={{ fontSize: 10, letterSpacing: 0.5 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ color: i < game.scoutBudget ? 'var(--accent)' : 'var(--border)' }}>●</span>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
