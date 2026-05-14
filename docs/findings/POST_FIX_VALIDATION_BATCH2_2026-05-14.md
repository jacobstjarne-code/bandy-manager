# Post-fix Validation Batch 2 — 2026-05-14

## Vad ändrades

- **Fix A:** `cruise.attack` 0.92 → 0.86 (bästa av 3 iterationer per spec, se iterationshistorik)
- **Fix B:** `cruise.corner = 0.90` tillagt — cruise dämpar nu också hörnkonvertering i 2H
- **Fix C:** `pickMatchProfileFromSeed()` hash: `(h & 0xffff) / 65535` → `h / 4294967295` (alla 32 bitar för uniformare fördelning)
- **Fix D:** `validate.ts` +3 kontroller (VMR-band, −2-bucket AW%, cornerStrategy-spridning) + WARN vid hemmavinst-rate-drift > 5pp
- **Engine version:** `1.1.0 → 1.2.0`
- **Ny datamängd:** 1050 matcher, nya seeds

**Fix C — implementeringsval:** Alt 1 (strukturell fix). Viktjusteringarna summerade redan till 100 via `r * total`-normaliseringen. Biasens källa var att lägre 16 bitar av hashen hade mild icke-uniformitet med de tätt placerade warehouse-seeds (multiplar av 7919). Full 32-bitars division löser detta utan att röra viktkonstanterna.

---

## Validate.ts före/efter

| Metric | 1.1.0 | 1.2.0 | Status |
|--------|-------|-------|--------|
| Målsnitt (alla) | 8.939 | 9.152 | OK (±2 från 9.12) |
| Hemmavinst-rate | 45.8% | 47.2% | OK (±10pp, WARN ej triggad: diff 2.9pp < 5pp) |
| Hörnsnitt | 16.5 | 16.6 | OK (5–40) |
| VMR | 1.581 | **1.692** | **FAIL** (band 1.20–1.45) |
| −2-bucket AW% | 73.1% | **78.6%** | **FAIL** (band 83–95%) |
| Aggressive-safe spread | 3.65 pp | **7.22 pp** | OK (≥ 2 pp) |
| Kontroller 1–9 | 9/9 | 9/9 | OK |
| Kontroller 11–13 | — | 1/3 | 2 fail (VMR, −2-bucket) |

---

## Iterationshistorik — Fix A (cruise.attack)

| Iteration | cruise.attack | AW% (−2 HT) | Status |
|-----------|--------------|-------------|--------|
| Basline (1.1.0) | 0.92 | 73.1% | Utanför band (< 83%) |
| Iteration 1 | 0.82 | 76.8% | Utanför band (< 83%) |
| Iteration 2 | 0.86 | 78.6% | Utanför band (< 83%) |
| Iteration 3 | 0.90 | 78.6% | Utanför band (< 83%) — ingen förbättring |
| **Final** | **0.86** | **78.6%** | Bäst av 3, partiellt löst |

Trenden planar ut: iter 2 och iter 3 ger samma AW%. Cruise-mode triggar bara vid `diff >= 3` — men den testade bucketen (away leads +2 vid HT) placerar leading-laget i *controlling*-mode (`attack: 0.88`), inte cruise. Förbättringen från 73.1% → 78.6% är indirekt (matcher som förlängs till +3-lead i P2 dämpas mer), men cruise.attack är inte den primära mekanismen. **Rootorsaken kvarstår i `controlling`-mode och `SECOND_HALF_BOOST = 1.19`.**

---

## Fynd 3 — Status

**HT-diff tabell (1.2.0, realistic n=600):**

| HT diff | n | HW% | Draw% | AW% | Ref |
|---------|---|-----|-------|-----|-----|
| Away +2 | 56 | 10.7% | 10.7% | **78.6%** | AW ~90% |
| Home +2 | 77 | 68.8% | 20.8% | 10.4% | HW ~80% |
| Home +3 | 55 | 90.9% | 7.3% | 1.8% | HW ~90% |

**Home +2** konverterar 68.8% (ref ~80%) — fortfarande 11pp under referens. Symmetrisk avvikelse: bortasegern vid leading +2 är 78.6% (ref ~90%), hemmasegren vid leading +2 är 68.8% (ref ~80%). Ungefär lika stor avvikelse ~11pp åt båda håll.

**Cruise.corner-effekt:** Leading-lagets hörnmål-andel i 2H (away leads +2-bucket): 23.3% av total 2H-mål. Inget tecken på att hörn-andelen eskalerat jämfört med motorns generella nivå (~22.2% Elitserie-target). Fix B applicerades korrekt utan att skapa regression.

**Status: Partiellt löst (+5.5pp förbättring, från 73.1% → 78.6%). Kvarstående gap: −11.4pp mot referens 90%.**

Nästa åtgärd: granska `controlling`-mode (attack 0.88 → ~0.80?) och/eller sänk `SECOND_HALF_BOOST` från 1.19 till ~1.12. Dessa kräver separat batch med kalibrering mot målsnitts-target.

---

## Fynd 4 — Status

**Profil-fördelning (1.2.0 med full 32-bitars hash):**

| Profil | 1.1.0 (rekonstru.) | 1.2.0 | Designat |
|--------|---------------------|-------|---------|
| defensive_battle | ~21.5% (16-bit bias) | **18.5%** | ~18% |
| standard | ~55.5% | **56.5%** | ~55% |
| open_game | ~18.3% | **19.8%** | ~20% |
| chaotic | ~4.7% | **5.2%** | ~5% |

defensive_battle: 21.5% → 18.5% (−3pp). Alla profiler inom designade band (15–21% spec). Fix C löst.

**VMR (realistic-bucket):**

| Datamängd | VMR |
|-----------|-----|
| 1.0.0 | 1.581 |
| 1.1.0 | 1.581 |
| 1.2.0 (med profil-fix) | **1.692** |

VMR ökade från 1.581 → 1.692. Profilnormaliseringen sänkte defensive_battle men ökade open_game-andelen (19.8% vs 18.3%), vilket höjer genomsnittsmålen. Högre mål-medeltal i open_game-profil ökar variansen (bimekanik: mixture av Poisson med bredare λ-spread). Dessutom: cruise.attack = 0.86 (vs 0.92 i 1.1.0) dämpar leading-lags 2H-mål, vilket skapar mer bimodal distribution (defensiva locks + öppna matcher). **Netto: VMR förvärrades av cruise.attack-fixet, inte förbättrades av profil-fixet.**

Acceptansbandet 1.20–1.45 är för snävt givet motorns grundläggande mixture-struktur. VMR ≈ 1.5–1.7 verkar vara motorns strukturella golv vid nuvarande profile-design. Separat VMR-fix krävs (target-sänkning till ~0.10 mixtur-spridning).

Lågmålsmatchar (≤4 mål): 69 av 600 = 11.5% (1.1.0: 12.2%). Marginell förbättring.

**Status: Profil-fördelning löst (18.5% vs designat 18%). VMR fortfarande utanför band (1.692 vs 1.20–1.45).**

---

## Sammanlagt utfall

| Fix | Status | Bevis |
|-----|--------|-------|
| Fix A: cruise.attack 0.92→0.86 | **Partiellt löst** | AW% 73.1% → 78.6% (+5.5pp, target 83–95%) |
| Fix B: cruise.corner = 0.90 | **Tillämpat utan regression** | Corner-andel 23.3% — ingen eskalering |
| Fix C: profilvikt 32-bitar | **Löst** | defensive_battle 21.5% → 18.5% (spec 15–21%) ✓ |
| Fix D: validate.ts +3 kontroller | **Grönt — kontroller körs** | Kontroll 11 FAIL (VMR), 12 FAIL (−2-bucket), 13 OK |
| WARN hemmavinst-rate | **Fungerar** | 47.2% = 2.9pp < 5pp-tröskel, ingen WARN (korrekt) |

---

## Nya observationer

1. **cruise.attack påverkar inte −2-bucket direkt.** Leading-laget med +2-lead vid HT är i `controlling`-mode (`attack: 0.88`), inte cruise (`diff >= 3`). Förbättringen 73.1% → 78.6% är indirekt. Cruise-tuning är fel verktyg för Fynd 3.

2. **VMR förvärrades av cruise.attack-sänkning.** Starkare cruise-dämpning skapar mer bimodal matchdistribution (defensiva låsmatchar + eskalerande öppna matcher), vilket ökar variansen utan att höja medelvärdet nämnvärt. Att justera cruise för Fynd 3 och VMR parallellt är ett underspecificerat optimeringsproblem.

3. **Hemmavinst-rate steg.** 45.8% (1.1.0) → 47.2% (1.2.0). Förbättring +1.4pp. Ingen enskild fix förklarar det tydligt — sannolikt kombination av nya seeds och profil-fördelningens förändring. Fortfarande 3.0pp under target 50.2%.

4. **CornerStrategy-spridning ökade kraftigt.** 3.65pp (1.1.0) → 7.22pp (1.2.0). aggressive: 22.87%, standard: 18.31%, safe: 15.65%. Spridningen är nu starkare än specad (≥2pp). Bidrar till mer distinkt taktikpåverkan.

---

## Nästa steg

**Fynd 3 (−2-bucket, 78.6% vs 90%):**
- Separat batch: granska `controlling`-mode (`matchCore.ts:720`: attack 0.88)
- Sänk `controlling.attack` från 0.88 till ~0.80, och/eller sänk `SECOND_HALF_BOOST` från 1.19 till ~1.12
- Risk: att sänka SECOND_HALF_BOOST minskar 2H-mål-andelen som kalibratorn litar på (54.2% i 2H — Elitserien-data)
- Kräver: ny kalibreringsbatch + Fynd 3-specifik validering

**VMR (1.692 vs 1.20–1.45):**
- Primärkälla är mixture-struktur, inte profil-bias (nu löst)
- Nästa fix: lägg till per-profil λ-justering som smalnar mixture-spridningen
- Alternativ: bredda validate.ts-bandet till 1.20–1.75 om VMR 1.4–1.7 är acceptabelt speldesign-mässigt (dvs att variansen är spelvärlden-realistisk om inte Poisson-kravet är hårt)
- Behöver Jacobs bedömning: är VMR ett problem för spelupplevelsen?

**Hemmavinst-rate (47.2% vs 50.2%):**
- 3.0pp kvar, under 5pp-WARN-tröskeln
- Separat kalibreringsbatch: höj `homeAdvantage`-parametern i `generate.ts` eller `homeAdvDelta` i `PHASE_CONSTANTS`
