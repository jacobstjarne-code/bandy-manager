import type { GameEvent } from '../entities/GameEvent'
import { BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS, BURNOUT_CEILING_BOARD_PATIENCE_COST } from './managerProfileService'

/**
 * DOM_BURNOUT_TAK_2026-09-02 (A) — det tvingande valet vid taket. Fyrar när
 * shouldTriggerBurnoutCeilingChoice (managerProfileService.ts) säger ja;
 * konstrueras i eventProcessor.ts, samma mönster som generateBurnoutReliefEvent
 * (burnoutReliefService.ts).
 *
 * 'step_back': öppnar den garanterade återhämtningsvägen (C) — startar
 * burnoutCeilingRecoveryUntilRound (nettodelta-golv, se updateManagerBurnout)
 * OCH återanvänder burnoutRelief:s befintliga 'startTrainingSlowdown'-mekanik
 * (samma "påtvingad lätt träning" som redan finns) OCH kostar boardPatience.
 * 'push_through': inget mekaniskt pris nu — mekaniken bär ingen "permanens"-
 * straff (domen ger ingen magnitud för det), risken är narrativ.
 *
 * BÅDA lämnar ett ärr — hanteras av en dedikerad eventResolver.ts-hook
 * (event.type==='burnoutCeiling', samma mönster som varsel/offer_pro), inte
 * av en generisk effekttyp, eftersom scar-skrivningen (diary + managerProfile.
 * burnoutScar) inte är en punktvis fält-mutation som subEffects redan täcker.
 *
 * Mallsträngarna är '[Opus]' — Code skriver aldrig svensk speltext.
 */
export function generateBurnoutCeilingEvent(matchday: number, season: number): GameEvent {
  return {
    id: `event_burnout_ceiling_${season}_${matchday}`,
    type: 'burnoutCeiling',
    title: '[Opus]',
    body: '[Opus]',
    choices: [
      {
        id: 'step_back',
        label: '[Opus]',
        subtitle: '[Opus]',
        irreversible: true,
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'startBurnoutCeilingRecovery', amount: BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS },
            { type: 'startTrainingSlowdown', amount: BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS },
            { type: 'boardPatience', amount: BURNOUT_CEILING_BOARD_PATIENCE_COST },
          ]),
        },
      },
      {
        id: 'push_through',
        label: '[Opus]',
        subtitle: '[Opus]',
        irreversible: true,
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}
