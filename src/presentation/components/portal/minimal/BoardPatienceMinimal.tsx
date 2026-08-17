import type { CardRenderProps } from '../portalTypes'
import { getBoardPatienceZone } from '../../../../domain/services/portal/boardPatienceZone'

/**
 * Minimal-kort: styrelsens tålamod, som kvalitativ zon.
 *
 * 3.2 (SLUTTEST_KO.md, 2026-08-17): ingen produktionsyta läste boardPatience
 * före GameOverScreen — ett avsked kunde komma utan att spelaren någonsin
 * sett en varning. Detta kort gör zonen ALLTID synlig (samma alwaysTrue-
 * mönster som SquadStatusMinimal/FormStatusMinimal/EconomyMinimal), så
 * eskaleringen Stabilt → Under press → Ultimatum går att se i förväg —
 * inte bara vid avsked. Den befintliga board_failure-beaten (portalBeats.ts)
 * bär fortfarande den fulla textmotiveringen (styrelsens citat) när den
 * vinner beat-rotationen; det här kortet garanterar bara att ZONEN inte
 * är beroende av den rotationen.
 */
export function BoardPatienceMinimal({ game }: CardRenderProps) {
  const { zone, label } = getBoardPatienceZone(game)

  const color = zone === 'stabilt'
    ? 'var(--success)'
    : zone === 'under_press'
    ? 'var(--text-light)'
    : 'var(--danger)'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Styrelsen
      </div>
      <div className="h-num-sm" style={{ color }}>
        {label}
      </div>
    </div>
  )
}
