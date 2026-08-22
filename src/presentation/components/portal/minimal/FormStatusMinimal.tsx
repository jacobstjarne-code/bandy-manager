import type { CardRenderProps } from '../portalTypes'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'
import { trendStroke } from '../../../utils/formatters'
import { getFormResults } from '../../../utils/formUtils'
import { FormDots } from '../../FormDots'

/**
 * Minimal-kort: genomsnittlig form i truppen.
 *
 * Medium 3 (Skutskär-auditen, 2026-08-22, text dömd av Jacob): "Form 94–98"
 * lästes som resultatkurva ("hur går laget just nu") under en lång
 * förlustsvit — men talet är `player.form`, spelarnas ATTRIBUTSNITT, inte
 * lagets resultat. Två fixar, båda dömda, inga fler val: (1) etiketten byts
 * till "Spelarform" — säger vad talet faktiskt är. (2) en separat rad
 * "Form: V O F" (senaste 5 resultat) läggs till — samma `getFormResults`/
 * `FormDots` som TabellScreen/GranskaOversikt redan använder, ingen ny
 * mekanism eller dubblett (PORT 4).
 */
export function FormStatusMinimal({ game }: CardRenderProps) {
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const avgForm = squadPlayers.length > 0
    ? Math.round(squadPlayers.reduce((s, p) => s + p.form, 0) / squadPlayers.length)
    : 0

  const formColor = avgForm >= 70
    ? 'var(--success)'
    : avgForm >= 50
    ? 'var(--text-light)'
    : 'var(--danger)'

  const snapForm = game.scoreSnapshots?.playerForm ?? []
  const formTrendStroke = trendStroke(snapForm[snapForm.length - 1] ?? 0, snapForm[snapForm.length - 2] ?? 0)

  const recentResults = getFormResults(game.managedClubId, game.fixtures, game.clubs, 5)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Spelarform
      </div>
      <div className="h-num-sm" style={{ color: formColor }}>
        {avgForm}
      </div>
      {snapForm.length >= MIN_POINTS && (
        <div style={{ marginTop: 3 }}>
          <Sparkline points={snapForm} stroke={formTrendStroke} height={10} />
        </div>
      )}
      {recentResults.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 7,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Form: V O F
          </div>
          <FormDots results={recentResults} size={6} />
        </div>
      )}
    </div>
  )
}
