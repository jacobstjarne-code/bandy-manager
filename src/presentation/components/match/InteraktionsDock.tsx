import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { BottomDock } from './BottomDock'
import { CornerInteraction } from './CornerInteraction'
import { PenaltyInteraction } from './PenaltyInteraction'
import { CounterInteraction } from './CounterInteraction'
import { FreeKickInteraction } from './FreeKickInteraction'
import { LastMinutePress } from './LastMinutePress'
import type { CornerInteractionData, CornerOutcome, CornerZone, CornerDelivery } from '../../../domain/services/cornerInteractionService'
import type { PenaltyInteractionData, PenaltyOutcome, PenaltyDirection, PenaltyHeight } from '../../../domain/services/penaltyInteractionService'
import type { CounterInteractionData, CounterOutcome, CounterChoice } from '../../../domain/services/counterAttackInteractionService'
import type { FreeKickInteractionData, FreeKickOutcome, FreeKickChoice } from '../../../domain/services/freeKickInteractionService'
import type { LastMinutePressData } from '../../../domain/services/lastMinutePressService'
import type { PressChoice } from '../../../domain/services/lastMinutePressService'

/**
 * InteraktionsDock — block-varianten av BottomDock för matchens interaktionspaneler.
 *
 * Flyttar CornerInteraction m.fl. från inline-rendering (flexShrink:0 ovanför feeden,
 * reflowar vid varje hörna) till en bottendockad panel som glider upp över feeden.
 * Feeden behåller scroll bakom (docken är position:absolute i .mf-root, ingen reflow).
 *
 * open = någon interaktion aktiv. Stängs INTE manuellt — panelen löser sig själv
 * (svar → utfall → auto-dismiss nollställer active*-tillståndet → open blir false).
 *
 * Panelernas inre är oförändrat — bara monteringspunkten flyttar. Score-mutationen
 * sitter i handlers (onChoose) som ägs av MatchLiveScreen och skickas in här.
 */

interface InteraktionsDockProps {
  activeCorner: CornerInteractionData | null
  cornerOutcome: CornerOutcome | null
  onCorner: (zone: CornerZone, delivery: CornerDelivery) => void

  activePenalty: PenaltyInteractionData | null
  penaltyOutcome: PenaltyOutcome | null
  onPenalty: (dir: PenaltyDirection, height: PenaltyHeight) => void

  activeCounter: CounterInteractionData | null
  counterOutcome: CounterOutcome | null
  onCounter: (choice: CounterChoice) => void

  activeFreeKick: FreeKickInteractionData | null
  freeKickOutcome: FreeKickOutcome | null
  onFreeKick: (choice: FreeKickChoice) => void

  activeLastMinutePress: LastMinutePressData | null
  onLastMinutePress: (choice: PressChoice) => void

  coach?: AssistantCoach
}

export function InteraktionsDock({
  activeCorner, cornerOutcome, onCorner,
  activePenalty, penaltyOutcome, onPenalty,
  activeCounter, counterOutcome, onCounter,
  activeFreeKick, freeKickOutcome, onFreeKick,
  activeLastMinutePress, onLastMinutePress,
  coach,
}: InteraktionsDockProps) {
  const open = !!(activeCorner || activePenalty || activeCounter || activeFreeKick || activeLastMinutePress)

  return (
    <BottomDock variant="block" open={open}>
      {activeCorner && (
        <CornerInteraction
          data={activeCorner}
          outcome={cornerOutcome}
          onChoose={onCorner}
          coach={coach}
        />
      )}
      {!activeCorner && activePenalty && (
        <PenaltyInteraction
          data={activePenalty}
          outcome={penaltyOutcome}
          onChoose={onPenalty}
          coach={coach}
        />
      )}
      {!activeCorner && !activePenalty && activeCounter && (
        <CounterInteraction
          data={activeCounter}
          outcome={counterOutcome}
          onChoose={onCounter}
          coach={coach}
        />
      )}
      {!activeCorner && !activePenalty && !activeCounter && activeFreeKick && (
        <FreeKickInteraction
          data={activeFreeKick}
          outcome={freeKickOutcome}
          onChoose={onFreeKick}
          coach={coach}
        />
      )}
      {!activeCorner && !activePenalty && !activeCounter && !activeFreeKick && activeLastMinutePress && (
        <LastMinutePress
          data={activeLastMinutePress}
          onChoose={onLastMinutePress}
          coach={coach}
        />
      )}
    </BottomDock>
  )
}
