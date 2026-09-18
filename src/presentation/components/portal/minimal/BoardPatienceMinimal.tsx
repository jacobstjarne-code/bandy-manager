import type { CardRenderProps } from '../portalTypes'
import { getBoardPatienceZone } from '../../../../domain/services/portal/boardPatienceZone'

/**
 * Minimal-kort: styrelsens tålamod, som kvalitativ zon.
 *
 * 3.2 (docs/archive/historiska-statuskallor/SLUTTEST_KO.md, 2026-08-17): ingen produktionsyta läste boardPatience
 * före GameOverScreen — ett avsked kunde komma utan att spelaren någonsin
 * sett en varning. Detta kort gör zonen ALLTID synlig (samma alwaysTrue-
 * mönster som SquadStatusMinimal/FormStatusMinimal/EconomyMinimal), så
 * eskaleringen Stabilt → Under press → Ultimatum går att se i förväg —
 * inte bara vid avsked. Den befintliga board_failure-beaten (portalBeats.ts)
 * bär fortfarande den fulla textmotiveringen (styrelsens citat) när den
 * vinner beat-rotationen; det här kortet garanterar bara att ZONEN inte
 * är beroende av den rotationen.
 *
 * "med orsak"-kravet (text låst av Opus 2026-08-17): headline + orsaksrad
 * (under_press/ultimatum) + väg tillbaka (bara ultimatum) — se
 * boardPatienceZone.ts för hur orsaken väljs.
 */
export function BoardPatienceMinimal({ game, prominent = false }: CardRenderProps & { prominent?: boolean }) {
  const { zone, label, headline, causeLine, pathBackLine } = getBoardPatienceZone(game)

  const color = zone === 'stabilt'
    ? 'var(--success)'
    : zone === 'under_press'
    ? 'var(--text-light)'
    : 'var(--danger)'

  return (
    <div style={{ textAlign: prominent ? 'left' : 'center' }}>
      <div style={{
        color: prominent ? 'var(--text-light-secondary)' : 'var(--text-muted)',
        fontSize: prominent ? 10 : 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: prominent ? 4 : 2,
      }}>
        Styrelsen
      </div>
      <div className="h-num-sm" style={{ color: prominent ? 'var(--text-light)' : color, fontSize: prominent ? 18 : undefined }}>
        {label}
      </div>
      <div style={{ color: prominent ? 'var(--text-light)' : 'var(--text-muted)', fontSize: prominent ? 12 : 10, marginTop: 4 }}>
        {headline}
      </div>
      {causeLine && (
        <div style={{ color: prominent ? 'var(--text-light-secondary)' : 'var(--text-muted)', fontSize: prominent ? 11 : 10 }}>
          {causeLine}
        </div>
      )}
      {pathBackLine && (
        <div style={{ color: prominent ? 'var(--text-light)' : 'var(--text-muted)', fontSize: prominent ? 11 : 10, marginTop: prominent ? 8 : 2 }}>
          {pathBackLine}
        </div>
      )}
    </div>
  )
}
