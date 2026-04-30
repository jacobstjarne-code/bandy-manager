# Handover 2026-04-27 (session 3 — kväll)

## Vad levererades idag

### Specialdatum V2 (commits `da686d9`, `8dfac75`)

- `specialDateStrings.ts` uppgraderad till ren datafil: arena-konstanter (`SM_FINAL_VENUE` = Studenternas IP, `CUP_FINAL_VENUE` = Sävstaås IP), lore-data (`STUDAN_FACTS`, `SAVSTAAS_FACTS`), lore-pooler för alla fyra event, spectator commentary-pooler
- `src/domain/services/specialDateService.ts` skapad — all logik extraherad hit: `substitute`, `pickVariant`, `pickCommentary` (15% lore-frekvens), `buildSpecialDateContext`, `pickFinaldagCommentary`, alla briefing-helpers
- `Fixture.ts` fått `arenaName?` och `venueCity?`
- `playoffService.ts` sätter `SM_FINAL_VENUE`-data på SM-final-fixture
- `cupService.ts` sätter `CUP_FINAL_VENUE`-data + `isCupFinalhelgen: true` på cup R3–R4
- 3×30-dead-code fixad: `matchCore.ts` sätter nu `matchFormat: temperature <= -17 ? '3x30' : undefined` (interim, ersätts av SPEC_VADER fas 1). Regressiontest tillagt.
- 9 nya tester

### Motor-kalibrering — version 1.1.2–1.1.4 (commits `99a1dcd`, `abd9c38`, `d402754`)

**v1.1.2 — playoff_final gap:**
- `isFinal?: boolean` i `pickMatchProfileFromSeed` opts
- SM-final: +28 defensive-viktning ovanpå isPlayoff
- Resultat: 8.45 → 6.86 mål/match (target 7.00) ✅

**v1.1.3 — homeWinPct/drawPct:**
- `baseAdv` 0.14 → 0.19 i `matchSimProcessor.ts`
- Resultat: homeWinPct 44.5% → 47.8% (target 50.2% ±5pp) ✅
- drawPct 17.7% → 16.9% — fortfarande utanför tolerans (se nedan)

**v1.1.4 — minutfördelning:**
- `GOAL_TIMING_BY_PERIOD[0]` 0.954 → 1.320, `[6]` 1.032 → 0.810
- Resultat: 0–10 min 7.0% → 9.4% ✅, 60–70 min 13.4% → 11.1% ✅

### Reverterad ändring (commit `c91e3d0`)

Försök att fixa `drawPct` via differentierad `chasing`-boost (1.22 → 1.18 vid −1, 1.28 vid −2+) och stärkt `even_battle`. Ingen effekt på drawPct, försämrade comeback-rate 20.1% → 16.4%. Reverterat.

---

## Motor-status efter session 3

| Mätvärde | Innan session | Nu | Target | Status |
|---|---|---|---|---|
| awayWinPct | 43.9% | 35.3% | 38.3% | ✅ |
| cornerGoalPct | 26.2% | 21.5% | 22.2% | ✅ |
| playoff_final mål/match | 9.17 | 6.86 | 7.00 | ✅ |
| homeWinPct | 44.5% | 47.8% | 50.2% | ✅ (±5pp) |
| 0–10 min | 7.0% | 9.4% | 9.7% | ✅ |
| 60–70 min | 13.4% | 11.1% | 10.5% | ✅ |
| drawPct | 17.7% | 16.9% | 11.6% | ⚠️ strukturell begränsning |
| comeback −1 halvlek | — | 20.1% | 24.5% | ⚠️ under tolerans |

**drawPct är en känd modell-begränsning.** Poisson-symmetri vid 9 mål/match med relativt jämna lag: 4-4 (19.5% av draws), 5-5 (17%), 3-3 (16.6%). Mode-systemet har noll effekt på denna symmetri. Att lösa det fullt kräver antingen drastiskt lägre målsnitt (bryter goalsPerMatch) eller kraftigt ökad hemma/borta-asymmetri (bryter homeWinPct). Accepterat.

---

## Nyckelbeslut tagna idag

1. **`specialDateService.ts` som separat service** — logiken bor inte i datafilen. Datafilen är ren data, servicen har allt som kräver `mulberry32`.
2. **3×30-hook är interim** — markerad `// INTERIM — se SPEC_VADER §5.4` i koden. Ska bytas när SPEC_VADER fas 1 implementeras.
3. **drawPct accepteras** — strukturell Poisson-begränsning, inte ett kalibreringsproblem. Dokumenterat i handovern, inte en öppen sprint.
4. **Mode-revert** — chasing-differentieringen saknade effekt och skadade comeback-rate. Reverterat för att bevara v1.1.3-basen.

---

## Aktiva jobb

- **Playtest-runda 4** — inget från Sprint 25f/g, 25h, 26, 27, 28-A/B, eller SPEC_MATCHDAGAR Fas 1–3 är verifierat i live-spel. Högst prioritet.
- **Sprint 28-C** — Opus-only skärmdump-audit. Ej påbörjad.
- **SPEC_MATCHDAGAR Fas 4** — blockeras på Eriks SMHI-skript.

---

## Kvarstående motor-gap

| Mätvärde | Motor | Target | Notering |
|---|---|---|---|
| drawPct | 16.9% | 11.6% | Strukturell begränsning — Poisson-symmetri |
| comeback −1 halvlek | 20.1% | 24.5% | Under tolerans — ej adresserat |

---

## Föreslagen ordning nästa session

1. Läs CLAUDE.md, LESSONS.md, DECISIONS.md, KVAR.md, denna fil.
2. **Playtest-runda 4** — verifierar allt från Sprint 25f/g, 25h, 26, 27, 28-A/B, SPEC_MATCHDAGAR Fas 1–3 i live-spel.
3. **Sprint 28-C** — Opus-only audit. Kräver ingen Code.
4. **SPEC_MATCHDAGAR Fas 4** — väntar på Erik.
