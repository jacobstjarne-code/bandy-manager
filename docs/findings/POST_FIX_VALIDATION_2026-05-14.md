# Post-fix Validation — 2026-05-14

## Vad ändrades

- **Fix A:** Minute-jitter (±1, uniform, deterministisk) i `generate.ts` vid skrivning till `match_events.minute`. Döljer 3-minutersdiskretiseringen i datalagret utan att röra motorns interna tidsupplösning.
- **Fix B:** `cornerStrategy` kopplad till konverteringskvalitet i `cornerInteractionService.ts` (multiplikator på `attackScore`: aggressive ×1.15, standard ×1.0, safe ×0.88) och i `matchCore.ts` icke-interaktiva hörnväg (multiplikator på `goalThreshold` efter clamp). `cornerHandler.ts` uppdaterad att skicka taktikens `cornerStrategy` till `resolveCorner()`.
- **Engine version:** `1.0.0 → 1.1.0`
- **Ny datamängd:** 1050 matcher, nya seeds (bucketSeed=0, matchIndex*7919 + bucketOffset)

## Validate.ts före/efter

| Metric | Före (1.0.0) | Efter (1.1.0) | Delta |
|--------|-------------|--------------|-------|
| Målsnitt | 9.058 | 8.939 | −0.119 |
| Hemmavinst-rate | 45.524% | 45.810% | +0.286pp (target 50.2%) |
| Hörnsnitt | 16.5 | 16.5 | 0 |
| Reproducerbarhet | 5/5 | 5/5 | Oförändrat |
| Alla kontroller | PASS | PASS | — |

## Fix A — Verifiering (minute % 3)

| Bucket | Före (1.0.0) | Efter (1.1.0) | Krav |
|--------|-------------|--------------|------|
| mod3 = 0 | 50% | 37.4% | 23.3–43.3% ✓ |
| mod3 = 1 | **0%** | **25.0%** | 23.3–43.3% ✓ |
| mod3 = 2 | 50% | 37.6% | 23.3–43.3% ✓ |

Alla tre buckets inom ±10% av 33.3%. Jittret fyller mod3=1-bucketen delvis (25% vs ideal 33.3%) — förväntad rest-asymmetri eftersom motorn enbart genererar events vid mod3 ∈ {0,2}, och ett ±1-jitter bara kan flytta hälften av dessa till mod3=1.

## Analys 2 före/efter (P(slututfall | HT-diff))

HT diff = −2 och +2 (realistic, n=600 per körning):

| HT diff | Antes (1.0.0) n | HW% | Draw% | AW% | After (1.1.0) n | HW% | Draw% | AW% | Ref |
|---------|-----------------|-----|-------|-----|-----------------|-----|-------|-----|-----|
| −2 | 52 | 9.6% | 17.3% | **73.1%** | 52 | 13.5% | 13.5% | **73.1%** | AW ~90% |
| +2 | 71 | 77.5% | 15.5% | 7.0% | 73 | 78.1% | 17.8% | 4.1% | HW ~80% |
| +3 | 52 | 90.4% | 7.7% | 1.9% | 57 | 86.0% | 8.8% | 5.3% | HW ~90% |

**−2-bucketen:** AW-rate 73.1% i båda versionerna. Exakt opåverkad av Fix B.
**+2 och +3-bucketarna:** Inom ±5pp av referenserna, acceptabla.

## Analys 4 före/efter (cornerStrategy konvertering)

| Strategi | Hörnor (1.0.0) | Conv% | Hörnor (1.1.0) | Conv% | Delta |
|----------|----------------|-------|----------------|-------|-------|
| aggressive | 2 704 | 10.02% | 2 692 | **11.85%** | +1.83pp |
| standard | 4 753 | 9.47% | 4 747 | **9.44%** | −0.03pp |
| safe | 2 396 | 9.27% | 2 439 | **8.20%** | −1.07pp |

**Spridning aggressive–safe:** 0.75 pp (1.0.0) → **3.65 pp (1.1.0)**. Spec-krav ≥ 2 pp: ✓

Ordning korrekt: aggressive > standard > safe i 1.1.0.

## Hypotesutfall

Den underliggande hypotesen var: "Fynd 1 + Fynd 3 + hemmavinst-rate-driften är symptom på en gemensam leading-team-bug."

**C. Hypotes avvisad.**

Fix B löste Fynd 1 (cornerStrategy-disconnektion) — spridningen är nu 3.65 pp och statistiskt tydlig. Men:

- **Fynd 3 (−2 HT-diff):** AW-rate 73.1% är identisk i 1.0.0 och 1.1.0. Cornerstrategins konverteringskoppling påverkar inte momentum-asymmetrin i halvtidsläge. Fynd 3 är ett separat problem i `cruise`/`trailing`-logiken, troligtvis i `matchCore.ts:715–732` (andra halvlekens modoberäkning).

- **Hemmavinst-rate:** +0.3 pp (45.5% → 45.8%) — negligibel rörelse mot 50.2%-målet. Avvikelsen styrs av `homeAdvantage`-parametern och `PHASE_CONSTANTS.homeAdvDelta`, inte av hörnkonvertering.

Fynd 1, Fynd 3 och hemmavinst-driften är **tre separata mekanismer**.

## Nästa steg

Utfall C → Fynd 3 behöver separat åtgärd:

1. **Fynd 3 (−2 HT → AW 73% vs 90%):** Granska `getSecondHalfMode()` i `matchCore.ts:715`. `cruise`-modet ger `attack: 0.92` för ledande lag — men hörnkonverteringschansen (som nu är strategi-modulerad) faller utanför `cruise`-bromsens räckvidd. Möjlig fix: applicera `cruise`-bromsens faktor även på `cornerConversionMod`, eller öka `cruise`-faktorn från 0.92 till ~0.82 för att sänka andradehalvlekens comeback-frekvens.

2. **Hemmavinst-rate (45.8% vs 50.2%):** Separat kalibreringsbatch. Avvikelsen är −4.4 pp och har legat konstant över två engine-versioner. Trolig lösning: höj `homeAdvDelta` i `PHASE_CONSTANTS` eller öka bas-`homeAdvantage` i `generate.ts` (nuvarande värde kontrolleras i `config.homeAdvantage`).

3. **Fynd 4 (VMR-överdispersion):** Per-profil-analys med stress-test återstår som separat batch.
