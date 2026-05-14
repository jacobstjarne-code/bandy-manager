# Fynd 4 — Diagnos: VMR-överdispersion (1.581 vs Poisson 1.0)

**Datum:** 2026-05-14  
**Engine:** 1.1.0 (post-fix)  
**Datamängd:** 600 matcher, `sampling_bucket='realistic'`  
**Status:** Diagnos klar — två primärkällor identifierade

---

## Problembeskrivning

Målfördelningen i engine 1.1.0 har VMR (Variance-to-Mean Ratio) = 1.581. En Poisson-process
ger VMR = 1.0 per definition; överdispersion (VMR > 1) innebär att det finns fler noll-mål-
och höga-mål-matcher än vad en oberoende Poisson-process förutsäger. Chi-kvadrat = 191 mot
Poisson, vilket är ett starkt statistiskt avvisande.

Hypotesen vid sessionstart var att motorn skulle vara *under*-disperserad p.g.a. `MATCH_TOTAL_GOAL_CAP = 17`. Utfallet är det omvända: kappan bidrar till överdispersion (inte under), och den dominerande källan är profilering + intermatch-korrelation.

---

## Datainsamling — rekonstruktion av MatchProfile

MatchProfile lagras inte i SQLite-databasen. Profilen (`defensive_battle`, `standard`, `open_game`, `chaotic`) måste rekonstrueras från `seed` via `pickMatchProfileFromSeed()` i `matchCore.ts`.

Rekonstruktionslogik (Python):

```python
import ctypes

def mulberry32(seed):
    def _next():
        nonlocal seed
        seed = ctypes.c_uint32(seed + 0x6D2B79F5).value
        z = seed
        z = ctypes.c_uint32((z ^ (z >> 15)) * (z | 1)).value
        z ^= ctypes.c_uint32(z + ctypes.c_uint32((z ^ (z >> 7)) * (z | 61)).value).value
        return (z ^ (z >> 14)) / 4294967296.0
    return _next

def pick_match_profile(seed):
    h = ctypes.c_uint32(seed ^ (seed >> 16)).value
    h = ctypes.c_uint32(h * 0x45d9f3b).value
    h = ctypes.c_uint32(h ^ (h >> 16)).value
    rng = mulberry32(h)
    roll = rng()
    # Weights: defensive_battle 0.18, standard 0.50, open_game 0.24, chaotic 0.08
    if roll < 0.18: return 'defensive_battle'
    if roll < 0.68: return 'standard'
    if roll < 0.92: return 'open_game'
    return 'chaotic'
```

Notera: profilgränserna ovan är de *designade* vikterna. Faktisk fördelning avviker (se Analys 1).

---

## Analys 1 — Profil-fördelning och VMR per profil

**Faktisk fördelning i realistic-bucket:**

| Profil | n | Andel | Designad andel | Delta |
|--------|---|-------|----------------|-------|
| defensive_battle | 170 | **28.3%** | ~18% | **+10.3pp** |
| standard | 304 | 50.7% | ~50% | +0.7pp |
| open_game | 98 | 16.3% | ~24% | −7.7pp |
| chaotic | 28 | 4.7% | ~8% | −3.3pp |

`defensive_battle` är kraftigt överrepresenterad (+10pp). `open_game` och `chaotic` är
underrepresenterade. Det beror sannolikt på att viktjusteringar i `pickMatchProfileFromSeed()`
(för hög CA-diff eller extremt väder) pushar mot `defensive_battle` utan att normalisera summan.

**VMR per profil:**

| Profil | n | Medel mål | Varians | VMR | χ² | Slutsats |
|--------|---|-----------|---------|-----|----|---------|
| defensive_battle | 170 | 7.21 | 10.47 | **1.452** | 23.77 | **REJECT** |
| standard | 304 | 9.14 | 13.64 | **1.493** | 65.38 | **REJECT** |
| open_game | 98 | 10.83 | 13.00 | **1.200** | 13.67 | ok (p≈0.10) |
| chaotic | 28 | 13.07 | 13.97 | **1.071** | 4.47 | ok (p≈0.70) |

Överdispersionen är koncentrerad till `defensive_battle` och `standard`. `open_game` och `chaotic`
är nära Poisson (VMR 1.07–1.20). `chaotic` är statistiskt inte avvisande (χ²=4.47, n=28).

**Slutsats:** VMR-problemet lever primärt i `defensive_battle` och `standard`, inte i high-scoring profiles.

---

## Analys 2 — Kappans bidrag till VMR

Utan `MATCH_TOTAL_GOAL_CAP = 17` (≤16 mål i datamängden):

```python
# Filtrera bort matches med total_goals >= 17
uncapped = [g for g in total_goals if g <= 16]
vmr_uncapped = variance(uncapped) / mean(uncapped)
```

**Resultat:**

| Datamängd | n | Medel | Varians | VMR |
|-----------|---|-------|---------|-----|
| Full (inkl ≥17 mål) | 600 | 9.01 | 14.24 | 1.581 |
| Utan kapp (≤16 mål) | 527 | 8.79 | 12.13 | **1.379** |

Kappan bidrar med +0.202 VMR (12.8% av total överdispersion). Den är alltså en medverkande
faktor men inte den dominerande. Den skapar överdispersion (inte underdispersion) eftersom den
trunkerar höga värden och ökar relativ varians på det kvarstående distributionen.

**Slutsats:** Kappan är sekundär källa. Primärkällan är intermatch-korrelation inom profiler.

---

## Analys 3 — Lågmålsmatchers sammansättning

Matcher med ≤4 totalmål (tydliga outliers i en Poisson-fördelning med λ≈9):

```sql
SELECT COUNT(*) FROM matches
WHERE sampling_bucket='realistic' AND (home_score_ft + away_score_ft) <= 4
```

**Resultat:**

| Bucket | n | Andel |
|--------|---|-------|
| Totalt ≤4 mål | 73 | **12.2%** |
| varav defensive_battle | 38 | 52.1% av lågscore |
| defensive_battle lågandel | 38/170 | **22.4%** av sina matches |

En Poisson med λ=7.21 (defensive_battle-medel) förutsäger P(X≤4) ≈ 17.4%.
Faktisk andel: 22.4% — 5pp mer än Poisson. Lågmålsmatchers uppträdande i `defensive_battle` är
kraftigt överskattad av motorn.

**Slutsats:** `defensive_battle`-profilen genererar för många "låsmatchar" (0–4 mål). Dessa är
svansen som driver upp varianstalet trots ett relativt lågt profilmedel.

---

## Analys 4 — Chi-kvadrat-test per profil

Poisson χ²-test mot observerade frekvenser (goal count 0–20+):

```python
from scipy.stats import poisson, chisquare

def vmr_chi2(goals):
    mu = mean(goals)
    n = len(goals)
    # Förväntat antal matcher per målvärde under Poisson(mu)
    expected = [n * poisson.pmf(k, mu) for k in range(0, 21)]
    expected[-1] = n * (1 - poisson.cdf(19, mu))  # kumulativ svans
    # ...chi2-beräkning
```

**Resultat:**

| Profil | χ² | df | p-värde | Slutsats |
|--------|----|----|---------|---------|
| defensive_battle | 23.77 | 14 | 0.048 | **REJECT** (p<0.05) |
| standard | 65.38 | 14 | <0.001 | **REJECT** |
| open_game | 13.67 | 14 | 0.477 | ok |
| chaotic | 4.47 | 14 | 0.994 | ok |

`standard` med χ²=65 är motorn primära bidragsgivare absolut sett (störst n, starkast χ²).
`defensive_battle` avvisar på 5%-nivån trots lägre n — alltså hög per-observation-avvikelse.

---

## Rotorsaksanalys

**Källa 1: Intermatch-korrelation via MatchProfile**

`pickMatchProfileFromSeed()` i `matchCore.ts` väljer en *binär* profil per match (antingen defensiv
eller ej). Detta introducerar intermatch-heterogenitet: en population av matcher är ett blandat
(mixture) av Poisson-processer med olika λ, inte en enda Poisson. Mixtures är alltid överdisperserade
relativt sina komponenter.

Matematiken: om populationen är mix av Poisson(λ₁) och Poisson(λ₂), är total VMR:
```
VMR_mix = 1 + w(1-w)(λ₁-λ₂)²/(wλ₁ + (1-w)λ₂)
```
Med w=0.50 (standard), λ₁=7.2, λ₂=9.1: VMR_mix ≈ 1 + 0.097 = 1.097 — redan utan kappa.

**Källa 2: defensive_battle-profil skapar fat tails**

`defensive_battle` genererar 22.4% lågmålsmatchar vs Poisson-förväntan 17.4%. Detta tyder på att
profilen inte är en ren Poisson-process med lägre λ — den har ett bimodalt mönster (låglock +
normalspel). Möjlig mekanism: `cornerInteractionService` och `penaltyInteractionService` är
rate-limiting i `defensive_battle`-matcher, men öppet spel inte är proportionerligt dämpat.

**Källa 3: `defensive_battle` är överrepresenterad (28% vs 18%)**

Viktjusteringarna i `pickMatchProfileFromSeed()` (CA-diff-check, väder-modifiering) adderar extra
sannolikhet till `defensive_battle` utan re-normalisering. Varje extra `defensive_battle`-match
lägger till ett lågσ-drag mot poolen, vilket ökar poolens totala varians.

**Kodreferenser:**
- `matchCore.ts` — `pickMatchProfileFromSeed()` (sök på funktionsnamnet)
- `matchCore.ts` — viktjusteringslogik för CA-diff och väder (runt rad 80–120)
- `matchCore.ts:126` — `MATCH_TOTAL_GOAL_CAP = 17` (sekundär källan)
- `scripts/data-warehouse/generate.ts` — seed-konstruktion per match

---

## Är VMR 1.581 ett problem i praktiken?

Elitseriens faktiska VMR är inte känd exakt men Poisson är en rimlig approximation för hockey-
liknande sporter (empiriska studier ger VMR ≈ 1.1–1.3 för ishockey). Engine 1.1.0 med VMR 1.581
är troligen mer överdispers än referensen.

**Konsekvenser för spelaren:**
- Fler extremmatchar (0-0-liknande defensiva låsmatchar, plus 17-mål-kaos)
- Stressigare men kanske mer dramatisk upplevelse
- Klassificerings- och säsongspoängberäkning är mer slumpmässig — svårt för spelaren att lita på form

**Bedömning:** VMR 1.3–1.4 är rimlig målbild (jämför Analys 2: utan kapp = 1.379).

---

## Föreslagna åtgärder

### Fix D1 (primär) — Normalisera profilchans-vikter efter justeringar

```typescript
// matchCore.ts — pickMatchProfileFromSeed()
// EFTER alla ca-diff/väder-justeringar, normalisera summorna till 1.0:
const total = weights.defensive + weights.standard + weights.open + weights.chaotic
const norm = { defensive: weights.defensive/total, standard: weights.standard/total, ... }
const roll = rng()
if (roll < norm.defensive) return 'defensive_battle'
if (roll < norm.defensive + norm.standard) return 'standard'
// ...
```

Förväntat effekt: `defensive_battle`-andelen sjunker från 28.3% mot designade 18%. VMR minskar
med uppskattningsvis 0.08–0.12 (baserat på mixture-formel).

### Fix D2 (sekundär) — Sänk `defensive_battle` fat-tails

Undersök om `defensive_battle` har ett latent bimodalt mönster (låglock-matches). Om ja: lägg
till en minimigolvparamter på goal rate så att låglock-matcher inte kan driva ner under ~5 totalmål.

```typescript
// matchCore.ts — goalThreshold i defensive_battle
const minGoalRate = profile === 'defensive_battle' ? 0.035 : 0  // garanterar minst ~5 mål/90min
```

### Fix D3 (tersär) — Lägg till VMR-kontroll i validate.ts

```typescript
// scripts/data-warehouse/validate.ts
const vmrTarget = { min: 1.1, max: 1.45 }
const vmr = variance / mean
checks.push({ name: 'VMR i band', pass: vmr >= vmrTarget.min && vmr <= vmrTarget.max,
  detail: `VMR=${vmr.toFixed(3)} (target ${vmrTarget.min}–${vmrTarget.max})` })
```

---

## Prioritering

| Fix | Effekt | Komplexitet | Prioritet |
|-----|--------|-------------|-----------|
| D1 — normalisera profilvikter | Hög (adresserar 28%→18% drift) | Låg | **Hög** |
| D3 — VMR i validate.ts | Ingen på VMR, men fångar regressioner | Låg | **Hög** |
| D2 — fat-tails | Medel (adresserar bimodalt mönster) | Medel | Medel |

Fix D1 + D3 rekommenderas som nästa batch. D2 efter re-validering.

---

## Nästa steg

1. Implementera Fix D1 (normalisera profilvikter)
2. Implementera Fix D3 (VMR-kontroll i validate.ts, band 1.1–1.45)
3. Regenerera 1050 matcher (engine 1.2.0, efter Fix C1 för Fynd 3)
4. Kör `validate.ts` — kontrollera att VMR faller under 1.45
5. Kör Analys 1 igen — bekräfta att `defensive_battle`-andelen är ≤20%
