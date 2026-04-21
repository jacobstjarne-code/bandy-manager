# Sprint 25d — Fas-mätrapport

**Datum:** 2026-04-21
**Stress-körning:** 10 seeds × 5 säsonger = 7518 matcher
**Commit:** 89dff94 (Section H i analyze-stress.ts)

---

## Sektion H — Per-fas analys

```
H. PER-FAS ANALYS (Sprint 25d)
Fas          mål/match  target   homeWin%  target   avgSusp  target   corner%  target
Grundserie   🔶 9.53   9.12   ❌ 45.9  50.2   🔶 3.20  3.77   ❌ 26.7  22.2  (n=5826)
KVF          ✅ 9.06   8.81   ❌ 50.8  60.3   🔶 2.68  3.18   ❌ 30.7  20.0  (n=673)
SF           🔶 9.14   8.39   🔶 50.9  57.9   🔶 2.71  3.55   ❌ 29.8  18.8  (n=324)
Final        🔶 8.49   7.00   🔶 41.9  50.0   🔶 3.30  4.08   ❌ 37.0  16.7  (n=43)
```

---

## Gradering per cell

| Fas | mål/match | homeWin% | avgSusp | cornerGoalPct |
|---|---|---|---|---|
| Grundserie | 🔶 (+0.41) | ❌ (−4.3pp) | 🔶 (−15%) | ❌ (+4.5pp) |
| KVF | ✅ (+0.25) | ❌ (−9.5pp) | 🔶 (−16%) | ❌ (+10.7pp) |
| SF | 🔶 (+0.75) | 🔶 (−7.0pp) | 🔶 (−24%) | ❌ (+11.0pp) |
| Final | 🔶 (+1.49) | 🔶 (−8.1pp) | 🔶 (−19%) | ❌ (+20.3pp) |

---

## Analys per dimension

### mål/match — 🔶 OK, PHASE_CONSTANTS verkar fungera

`goalMod` skalerar ner mål korrekt per fas: Grundserie 9.53 → Final 8.49.
Trenden stämmer med referensdata. Inga ❌. Kvarstår att finalen är 1.49 över target
men n=43 ger hög varians — sannolikt brus.

### homeWin% — ❌ Grundserie + KVF

Grundserie: 45.9% vs 50.2% (−4.3pp). Basmotorns `homeAdvDelta` trolig rotorsak.
KVF: 50.8% vs 60.3% (−9.5pp). Stort gap — `homeAdvDelta: 0.03` för KVF är alldeles för litet.
Referensdata visar tydlig hemmafördel i slutspel (2-match-serier, publik).
PHASE_CONSTANTS `homeAdvDelta` för KVF är spec-ansvarig: bör höjas mot 0.06 (Scenario C).

SF och Final: 🔶 — gap 7-8pp men n är litet (n=324, n=43). Kan vara PHASE_CONSTANTS
eller brus.

### avgSusp — 🔶 Konsekvent ~15-24% under target

Basen ligger 15% under (3.20 vs 3.77 grundserie) — detta är arvet från Sprint 25b.2
(3.23/match i 25b.2-körningen). Fas-konstanter förstärker inte gapet. `suspMod`-värden
i PHASE_CONSTANTS är inte kalibrerade, men basnivån är redan låg.
Sprint 25b.2.2 (multiplikator 1.25 → ~1.46) är fortfarande aktuellt som följdfix.

### cornerGoalPct — ❌ ALLA FASER, eskalerande mot slutspel

Grundserie: 26.7% (mål 22.2%), KVF: 30.7% (mål 20.0%), SF: 29.8% (mål 18.8%),
Final: 37.0% (mål 16.7%).

Trenden är omvänd mot referens: cornerGoalPct ska *minska* i slutspel (tätare spel,
färre öppna lägen vid hörn). Motorn visar eskalering. Trolig rotorsak: hörnmåls-
sannolikheten påverkas inte av `goalMod`, enbart reguljära attack-sekvenser skalas ner.
Nettoresultat: hörnmål/totala mål ökar när goalMod minskar totala mål i slutspel.

---

## Spec-villkor per 25d

Sprint 25d-specen anger: "Om ❌ i någon cell: STOPP. Rapportera till Jacob."
Villkoret är uppfyllt — körningen stoppas utan PHASE_CONSTANTS-ändringar.

---

## Kandidatåtgärder (beslut delegeras till Jacob)

| Problem | Kandidat | Scope |
|---|---|---|
| cornerGoalPct ❌ eskalerande slutspel | Skala hörnmålsprob med `goalMod` | Motor (Sprint 25e) |
| homeWin% ❌ KVF −9.5pp | `homeAdvDelta` KVF: 0.03 → 0.06 | PHASE_CONSTANTS (Sprint 25d.2) |
| homeWin% ❌ Grundserie −4.3pp | `homeAdvDelta` grundserie: justera basmotorn | Motor (Sprint 25e) |
| avgSusp 🔶 konsekvent −15% | Multiplikator 1.25 → ~1.46 | Sprint 25b.2.2 |
