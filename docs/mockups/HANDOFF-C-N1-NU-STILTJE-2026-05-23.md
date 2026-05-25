# HANDOFF — C-N1 NU-fliken vid stiltje

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_nu_stiltje.html`

## TL;DR

Stiltje är inte tomhet — det är klubbens vardag. Fyra lager fyller NU även när inget brinner: stillness-beat, veckans rytm, stämningskurva, mikrohändelser, heritage-rad.

## Två regler

- Stillness är inte tomhet — fyra lager alltid där
- När något brinner, sjunker stillness till bakgrund — aktiv decision/skada tar plats överst

## Komponenter

| Lager | Data | Återanvändning |
|---|---|---|
| Stillness-beat | Pool av italic-rader, roterar per dag/väder | Opus-pool ~20 strängar |
| Veckans rytm | game.trainingHistory + nextFixture | Befintlig data |
| Stämningskurva | `teamPulseHistory: number[]` (NYTT) | Score-system `<Sparkline>` |
| Mikrohändelser | smallAbsurditiesData + ny stillnessMicroPool | ~50 strängar Opus |
| Heritage-rad | `findEventsOnDate(game, currentDate)` | R5 anniversary-helpers |

## Designval öppna

1. Stämningskurva alltid eller bara vid variance? **Föreslag: alltid.**
2. Heritage-rad: exakta jubileum eller även "samma vecka"? **Föreslag: exakta.**
3. Får mikrohändelser ge mood-effekter? **Föreslag: nej — stannar narrativ.** Konsekvent med Jacobs princip "mjukt och synligt".

## Estimat

~5h Code + ~70 Opus-strängar. Återanvänder score-system-primitiver och R5-anniversary-helpers.

— Design-Claude, 2026-05-23
