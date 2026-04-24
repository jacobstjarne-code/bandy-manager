# Sprint 25f — Mätrapport

**Datum:** 2026-04-25
**Ändringar:** trailingBoost 0.11→0.16, leadingBrake ny (0.08/mål), controlling 0.96→0.88, chasing attack 1.14→1.22 foul 1.20→1.25
**Stress-körning:** 6 seeds × 4 säsonger ≈ 3978 matcher (grundserie)
**Build:** ✅ | **Stress:** 0 crashes, 32-62 finance-warnings (stabilt)

---

## Primär-nyckeltal

| Mått | Före (25e) | Efter (25f) | Target | Status |
|------|-----------|------------|--------|--------|
| `htLeadWinPct` | 82.4% | ~77% | 60-70% | ❌ Förbättrad +5pp men ej i range |
| `comeback −1` | 16.8% | ~18-19% | 20-25% | ❌ Förbättrad +2pp men ej i range |
| `goalsPerMatch` | 9.20 | 9.26-9.30 | 9.0-9.4 | ✅ Bevarad |
| `awayWinPct` | 44.7% | ~42-43% | 38-42% | ✅/⚠️ Rör sig rätt |
| `homeWinPct grundserie` | 45.4% | ~43-44% | 46-50% | ❌ Fortsätter sjunka |

---

## Sekundär-nyckeltal

| Mått | Värde | Kommentar |
|------|-------|-----------|
| `homeWinPct KVF` | 51.2% | Target 60.3% — kvarstående gap |
| `cornerGoalPct` | 22.6% | ✅ Orörd sedan 25e |
| `avgSuspensionsPerMatch` | 3.80 | ✅ Stabilt |

---

## Iterationshistorik

**Iteration 1** — trailingBoost 0.16 (spec-värde):
- htLeadWinPct: ~76-77% — fortfarande >75%, trigger för iteration 2

**Iteration 2** — trailingBoost 0.16 → 0.19:
- htLeadWinPct: 77.3% — sämre, ej hjälpt
- Återgick till 0.16

**Slutvärde:** trailingBoost 0.16 (spec-värde behållt)

---

## Slutsats och flaggningar

### ✅ Levererat

Alla fyra ändringar implementerade. `goalsPerMatch` bevarad inom spec. `htLeadWinPct` förbättrad 5pp (82.4% → 77%).

### ❌ Strukturellt gap kvarstår — max 2 iterationer nådda

`htLeadWinPct` är fortfarande ~77% vs target 60-70%. Gapet (31pp mot 46.6%) är ett djupare strukturellt problem:

**Rotorsak (hypotes):** Vid halvtid sitter det ledande laget med ett faktiskt mål-övertag som är matematiskt svårt att överbrygga på 45 matchminuter. Trailing/leading boost hjälper marginellt men ändrar inte grundläggande sannolikheter tillräckligt. Motorn har hög "variance lock-in" vid halvtid — det enda som radikalt ändrar utfallet vore att kraftigt öka comebackchansen vid lika-poäng (dvs. fler oavgjort i slutet) eller att minska variance tidigt.

**Sprint 25g-kandidat:** Ny analys behövs. Möjliga angreppsvinklar:
1. Analysera om problemet ligger i `getSecondHalfMode`-triggers — när triggas `controlling` vs `even_battle`?
2. Kolla om `homeAdvantage` i andra halvlek stärker ledande hemmalag oproportionerligt
3. Undersök om hörnfrekvens för underläge-lag är tillräckligt hög

### ⚠️ homeWinPct grundserie sjunker

homeWinPct gick från 45.4% (25e) till 43.9% (25f). Ledande lag bromsas mer = färre hemmavinstprocent. Fortfarande utanför target (50.2%). Beror sannolikt på att leadingBrake + controlling-förstärkning bromsar hemmalaget i ledning för hårt. Kan behöva balanseras med homeAdvantage-justering i 25g.

---

*Rapport genererad automatiskt från npm run analyze-stress (6×4 = 3978 matcher).*
