# HANDOFF — C-SD1 Säsongsslutets koreografi

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_sasongsslut_koreografi.html`
**Svarar på:** Opus DESIGN_OVERLAMNING_2026-05-22 punkt 1

## TL;DR

Ny pure helper `getSeasonEndPhase(game)` returnerar 7 explicita faser. Alla scen-triggers och anslag-villkor får en gateway-check i början. Tre buggar (sommaren-före-slutspel, halvvägs-dubblering, granska-CTA-fel-tillstånd) löses med en arkitektur, inte tre fixar.

## Beslut på de fyra Q

| Q | Svar |
|---|---|
| Q1 mellanperiod-skärm? | Ja, REGULAR_DONE med ETT anslag. Halvvägs-scen tas bort. |
| Q2 söndagsträningen | Behåll one-shot. Inte SUMMER-trigger. |
| Q3 spectator separat fas | Ja. `isManagedClubInPlayoff` ersatt av `getSeasonEndPhase`. |
| Q4 SEASON_DONE → SUMMER | Manuell. Spelaren klickar "Avsluta säsongen". |

## Vad Code bygger

1. **Ny fil** `src/domain/data/seasonEndPhase.ts` med `getSeasonEndPhase()` + `SeasonEndPhase`-typ
2. **SaveGame-tillägg**: `seasonDoneAck?: boolean`, `inSummerScene?: boolean`
3. **Gateway-checks** i 5 trigger-funktioner (sommaren, halvvägs, SM-final-victory, playoff-intro, granska-CTA-text)
4. **Tester**: snapshot per game-state-kombination

## Konsekvenser för andra spår

- R3 PhaseMark/SpectatorMark: refaktoreras till koreograf-baserat (en linje per komponent)
- C-SP1 granska-CTA: CTA-text läser fas, en linje ändras
- C-SD2 portal-eskalering: redan löst av R3+ Klimax-eskalering (audit-status: blockerad av token-fix)

## Estimat

~4.5h Code totalt. Inkrementellt — varje gateway kan migreras separat utan att gå sönder.

— Design-Claude, 2026-05-23
