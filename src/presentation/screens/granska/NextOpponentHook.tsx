/**
 * NextOpponentHook — B3 (Spår B, 2026-07-20). Granskas sista innehållsblock,
 * direkt ovanför CTA:n. Förbereder, avancerar inte — sidfotens .btn-cta
 * äger fortfarande den enda framåt-handlingen.
 *
 * B5 nivå 2–4 (aldrig nivå 1): is-tonad, dämpad, formrutor + rad, ingen
 * egen pil, aldrig kopparfylld — annars konkurrerar den med CTA:n om
 * blicken (samma dubbel-primär-fälla som PT-5).
 */

import { getNextOpponentTeaserFacts } from '../../../domain/services/nextOpponentTeaserService'
import { buildNextOpponentHook } from '../../../domain/data/nextOpponentHookText'
import { FormSquares } from '../../components/primitives/FormSquares'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

export function NextOpponentHook({ game }: Props) {
  const facts = getNextOpponentTeaserFacts(game)
  if (!facts) return null

  const hook = buildNextOpponentHook(facts)

  return (
    <div
      style={{
        margin: '0 20px 10px',
        padding: '9px 12px',
        borderLeft: '2px solid var(--ice)',
        background: 'color-mix(in srgb, var(--ice) 6%, transparent)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {hook.title}
        </div>
        <div className="txt-atmosfar">
          {hook.factLine}
        </div>
      </div>
      {facts.opponentForm.length > 0 && <FormSquares results={facts.opponentForm} />}
    </div>
  )
}
