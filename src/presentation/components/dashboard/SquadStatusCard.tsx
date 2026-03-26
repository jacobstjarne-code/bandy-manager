import { BandyStickSVG } from '../Decorations'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface SquadStatusCardProps {
  injuredCount: number
  formLabel: string
  formColor: string
  club: Club
  game: SaveGame
  cardStyle: React.CSSProperties
  cardLabelStyle: React.CSSProperties
}

export function SquadStatusCard({
  injuredCount,
  formLabel,
  formColor,
  club,
  game,
  cardStyle,
  cardLabelStyle,
}: SquadStatusCardProps) {
  return (
    <div className="card-stagger-4" style={cardStyle}>
      <p className="section-heading" style={cardLabelStyle}>TRUPPSTATUS</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: injuredCount === 0 ? '#22c55e' : '#ef4444',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 13, color: '#8A9BB0' }}>
            Skador: <span style={{ color: injuredCount > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
              {injuredCount} spelare
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BandyStickSVG size={14} color={formColor} />
          <span style={{ fontSize: 13, color: '#8A9BB0' }}>
            Form: <span style={{ color: formColor, fontWeight: 600 }}>{formLabel}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#8A9BB0' }}>
            Klubbkassa:{' '}
            {club.finances < 0 ? (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                {Math.round(club.finances / 1000)} tkr ⚠️ KRIS
              </span>
            ) : (
              <span style={{ color: '#22c55e', fontWeight: 600 }}>
                {club.finances >= 1000000
                  ? `${(club.finances / 1000000).toFixed(1)} mkr`
                  : `${Math.round(club.finances / 1000)} tkr`}
              </span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#8A9BB0' }}>
            Supportrar:{' '}
            <span style={{
              fontWeight: 600,
              color: (game.fanMood ?? 50) > 80 ? '#f97316'
                : (game.fanMood ?? 50) > 60 ? '#22c55e'
                : (game.fanMood ?? 50) > 40 ? '#8A9BB0'
                : (game.fanMood ?? 50) > 20 ? '#f59e0b'
                : '#ef4444'
            }}>
              {(game.fanMood ?? 50) > 80 ? '🔥 Euforisk'
                : (game.fanMood ?? 50) > 60 ? '😊 Positiv'
                : (game.fanMood ?? 50) > 40 ? '😐 Neutral'
                : (game.fanMood ?? 50) > 20 ? '😤 Missnöjd'
                : '😡 Protesterar'}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
