import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getFunctionaryQuote } from '../../../domain/services/functionaryQuoteService'
import { csColor } from '../../utils/formatters'

interface Props {
  game: SaveGame
  currentRound: number
}

export function CommunityPulse({ game, currentRound }: Props) {
  const navigate = useNavigate()
  const cs = game.communityStanding ?? 50
  const quote = getFunctionaryQuote(game, currentRound, game.lastCompletedFixtureId)
  const headline = [...(game.inbox ?? [])].filter(i => i.type === 'mediaEvent' || i.type === 'media').sort((a, b) => b.date.localeCompare(a.date))[0]?.title

  return (
    <div
      onClick={() => navigate('/game/club')}
      style={{
        background: '#0e1f33',
        border: '1px solid #1e3450',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 12,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4A6080' }}>
          ORTEN
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: csColor(cs) }}>{cs}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${cs}%`, background: csColor(cs), borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      {headline && (
        <div style={{ borderTop: '1px solid #1e3450', paddingTop: 8, marginBottom: quote ? 8 : 0 }}>
          <p style={{ fontSize: 12, color: '#8A9BB0', lineHeight: 1.4 }}>
            📰 {headline}
          </p>
        </div>
      )}
      {quote && (
        <div style={{ borderTop: headline ? '1px solid rgba(255,255,255,0.04)' : '1px solid #1e3450', paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: '#F0F4F8', lineHeight: 1.5, fontStyle: 'italic' }}>
            "{quote.quote}"
          </p>
          <p style={{ fontSize: 11, color: '#4A6080', marginTop: 4 }}>
            — {quote.name}, {quote.role}
          </p>
        </div>
      )}
    </div>
  )
}
