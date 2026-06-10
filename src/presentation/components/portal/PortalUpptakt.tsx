/**
 * PortalUpptakt — pre-slutspel-upptakt (C-SD2). Visas sista 3 grundserie-omgångarna
 * när något står matematiskt på spel (ej cementerat mittfält).
 *
 * Två element:
 *  - warm PhaseMark (engångs per säsong, via upptaktPhaseMarkSeenSeason)
 *  - countdown-rail (permanent under upptakt-fönstret, pip per återstående omgång)
 *
 * Per docs/mockups/2026-06-01_design_sd2_portaleskalering.html.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getEscalationSubState, getRemainingRegularRounds, type EscalationSubState } from '../../../application/services/portalEscalationResolver'
import { pickUpptaktPhaseMark, pickCountdownText, type UpptaktSubState } from '../../../domain/data/upptaktCopy'

interface Props { game: SaveGame; subState?: EscalationSubState | null }

export function PortalUpptakt({ game, subState: subStateFromParent }: Props) {
  const subState = subStateFromParent !== undefined ? subStateFromParent : getEscalationSubState(game)
  if (subState === null || subState === 'mittfalt') return null
  const state = subState as UpptaktSubState

  const remaining = getRemainingRegularRounds(game)
  const seed = game.currentSeason * 9301 + game.currentMatchday * 31
  const seen = new Set<number>()
  const phaseMark = pickUpptaktPhaseMark(state, seed, seen)
  const countdown = pickCountdownText(state, remaining, seed + 17, new Set<number>())

  const isBottenstrid = state === 'bottenstrid'
  const showPhaseMark = (game.upptaktPhaseMarkSeenSeason ?? -1) !== game.currentSeason

  return (
    <>
      {showPhaseMark && (
        <div className={`portal-phasemark warm${isBottenstrid ? ' bottenstrid' : ''}`}>
          <div className="portal-phasemark-eyebrow">{phaseMark.eyebrow}</div>
          <div className="portal-phasemark-quote">"{phaseMark.quote}"</div>
          <div className="portal-phasemark-helper">{phaseMark.helper}</div>
        </div>
      )}

      <div className={`upptakt-countdown${isBottenstrid ? ' bottenstrid' : ''}`}>
        <div className="upptakt-countdown-pips">
          {Array.from({ length: Math.max(0, remaining) }, (_, i) => (
            <span key={i} className="upptakt-countdown-pip" />
          ))}
        </div>
        <div className="upptakt-countdown-text">{countdown}</div>
      </div>
    </>
  )
}
