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
    title: 'Det går inte att köra så här längre',
    body: 'Det har legat på max ett tag nu, och det släpper inte av sig självt. Assistenten har sagt det rakt ut: antingen kliver du tillbaka en period, eller så kör du vidare och ser vad som händer. Ingen av vägarna är gratis.',
    choices: [
      {
        id: 'step_back',
        label: 'Kliv tillbaka en period',
        subtitle: 'Assistenten tar rodret, lätt träning tvingas fram, styrelsen gillar det inte — men det släpper på riktigt.',
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
        label: 'Kör vidare',
        subtitle: 'Du släpper inte taget om laget. Det kan härda dig — eller sätta sig för gott.',
        irreversible: true,
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}
