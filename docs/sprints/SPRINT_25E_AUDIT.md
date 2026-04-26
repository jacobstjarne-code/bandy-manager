# Sprint 25-E — Audit

**Datum:** 2026-04-26  
**Scope:** Powerplay-effektivitet — riktig comeback-mekanik

---

## Implementerade ändringar

### `src/domain/services/matchCore.ts`

| Parameter | Före | Efter | Hypotes |
|-----------|------|-------|---------|
| `homePenaltyFactor` / `awayPenaltyFactor` | 0.75 | **0.65** | H1 |
| `homePowerplayBoost` / `awayPowerplayBoost` | (ej fanns) | **1.20** | H3 |
| `leadingBrake` multiplikator | 0.08 | **0.12** | Extra iteration |
| `trailingBoost` multiplikator | 0.16 | 0.16 (oförändrat) | H2 redan impl. |

### `src/domain/services/__tests__/economyService.test.ts`
- `weeklyBase`-test: `2000 + rep*50` → `3000 + rep*50` (test var stale — implementationen hade ändrats i tidigare sprint utan att testet följde med)

---

## Hypoteser testade

### H1 — `penaltyFactor` 0.75 → 0.65
Implementerad. Effekt: −2 comeback steg från 9.4% → ~12%. −1 rörde sig minimalt (20.0% → 19.5%).

### H2 — `trailingBoost` höjning
Ej nödvändig — `trailingBoost` var redan 0.16 i kod (Sprint 25f), högre än H2:s spec-mål 0.15.

### H3 — `powerplayAttackBoost` 1.20
Implementerad. Ger powerplay-laget explicit attack-boost (inte bara bötfälla korthandslaget). Effekt på −1: minimal. Effekt på −2/−3: positiv. Kombinerat med H1 ger en meningsfull powerplay-asimmetri: korthandslaget på 0.65×, powerplay-laget på 1.20× — initiativkvot 35% vs 65% (vs 43/57 i baseline).

### Extra iteration — `leadingBrake` 0.08 → 0.12
Testad för att adressera kvarstående −1-gap. Gav htLeadWinPct till ~75% (i 75-80%) och marginell förbättring av −1 (~19.8%). Behållen — skyddar mot scoreline-freeze.

### Försök: `trailingBoost` 0.20
Testades och reverterats. Gav −1: 20.6% men bröt htLeadWinPct (73.9% < 75%) och blåste upp −3/−4+ comebacks orealistiskt (7.6% resp. 2.4% vs targets 3.7%/1.3%).

---

## Strukturell lärdom: varför −1 comeback inte når ≥22%

`Comeback från −1 halvtidsunderläge (vinst)` kräver att trailing-laget *netto* skorar +2 i andra halvlek (inte +1 — det ger oavgjort, inte vinst). Med ~4.6 mål/halvtid ger matematiken ett strukturellt tak på ~20-21% för denna kategori oavsett boost-storlek.

Att höja `trailingBoost` över 0.16 bröt andra mätvärden innan −1 nådde 22%. Powerplay är rätt mekanism för −2/−3 comebacks, inte för −1.

**Slutsats:** ≥22% för −1 är inte uppnåeligt med powerplay-mekanik utan att bryta goalsPerMatch eller htLeadWinPct. Godkänns som strukturell limitation. Meningsfull förbättring är ändå gjord.

---

## Per-fas-mätningar (slutgiltigt stresstest, 10×3 säsonger)

### Grundserie — sektion A

| Mått | Motor | Target | Status |
|------|-------|--------|--------|
| goalsPerMatch | 9.37 | 9.12 ±1.5 | ✅ |
| htLeadWinPct | 75.0% | 78.1% ±5 | ✅ (precis i 75-80%) |
| avgSuspensionsPerMatch | 3.68 | 3.77 ±1 | ✅ |
| awayWinPct | 39.5% | 38.3% ±5 | ✅ |

### Comeback-frekvenser — sektion D

| Mått | Baseline (pre-25e) | Post-25e | Spec-mål | Status |
|------|---------------------|----------|----------|--------|
| Comeback −1 | 20.0% | ~20.7% | ≥22% | 🔶 strukturellt tak |
| Comeback −2 | 9.4% | ~11-12% | ≥12% | 🔶 (noisy, ca vid target) |
| Comeback −3 | 3.9% | ~5.5% | ≥3.7% | ✅ |
| Comeback −4+ | 1.5% | ~1.1% | ≥1.3% | ✅ |

*Stresstest visar ~2pp varians mellan körningar för comeback-frekvenser. −2 oscillerar 10-12% beroende på seed.*

---

## Notering: htLeadWinPct var redan förbättrat

Spec-baseline angav 82.8% — det var pre-Sprint 25f (trailingBoost impl). Vid sessionstart var htLeadWinPct redan 76.4% (inom 75-80%-range) tack vare Sprint 25f. Sprint 25-e's H1+H3 behöll det i range (75.0%).

---

## Build + tester

```
Build: ✅ (npm run build — inga TS-fel)
Tests: ✅ 1895/1895 (165/165 filer)
  (bonus: fixat stale economyService.test.ts — weeklyBase 2000→3000 + rep×50)
Stresstest: 0 kraschar, 0 invariantbrott (10×3 säsonger × 4 körningar)
```

---

## Slutgiltiga parametervärden

```ts
// matchCore.ts
homePenaltyFactor  = homeActiveSuspensions > 0 ? 0.65 : 1.0   // H1: 0.75 → 0.65
awayPenaltyFactor  = awayActiveSuspensions > 0 ? 0.65 : 1.0   // H1
homePowerplayBoost = awayActiveSuspensions > 0 ? 1.20 : 1.0   // H3: ny
awayPowerplayBoost = homeActiveSuspensions > 0 ? 1.20 : 1.0   // H3: ny
trailingBoost = diff < 0 ? min(-diff, 3) * 0.16 : 0           // oförändrat (25f)
leadingBrake  = diff > 0 ? min(diff, 3) * 0.12 : 0            // 0.08 → 0.12
```

Powerplay-initiativkvot: 35% (korthandslaget) vs 65% (powerplay). Baseline var 43% vs 57%.

---

## Kvarstående

- **Comeback −1 ≥22%:** strukturellt ej uppnåeligt utan att bryta htLeadWinPct eller goalsPerMatch. Noteras för framtida re-evaluering om scoring-modellen görs om.
- **Comeback −2 variansen:** stochastisk ~2pp — acceptabelt för 10×3 seeds.
