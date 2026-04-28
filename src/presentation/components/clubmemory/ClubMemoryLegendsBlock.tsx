import type { ClubLegend } from '../../../domain/entities/Narrative'

interface Props {
  legends: ClubLegend[]
}

export function ClubMemoryLegendsBlock({ legends }: Props) {
  if (legends.length === 0) return null

  return (
    <div style={{
      marginTop: 28,
      paddingTop: 16,
      borderTop: '2px solid var(--border-dark)',
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '2px',
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}>
        ⭐ Klubbens legender
      </div>

      {legends.map((legend, i) => (
        <div
          key={legend.playerId ?? `${legend.name}-${i}`}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-leather)',
            borderRadius: 6,
            marginBottom: 8,
            borderLeft: '2px solid var(--accent-dark)',
          }}
        >
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-light)',
          }}>
            {legend.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {legend.position} · {legend.seasons} säsonger · Pensionerad {legend.retiredSeason}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {legend.totalGoals} mål · {legend.totalAssists} assist
            {legend.titles.length > 0 && ` · ${legend.titles.join(', ')}`}
          </div>
          {legend.memorableStory && (
            <div style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--text-light-secondary)',
              marginTop: 4,
              paddingTop: 4,
              borderTop: '1px dashed var(--border-dark)',
            }}>
              {legend.memorableStory}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
