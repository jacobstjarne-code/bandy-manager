# Sprint 25-J — Synka spelets baseAdv mot kalibreringen

**Status:** READY TO IMPLEMENT
**Estimat:** 30 min Code + verifiering
**Förutsätter:** Sprint 25-I-analys (`SPRINT_25I_ANALYSIS.md`) — KLAR
**Risk:** Låg (en rad ändring, väl avgränsad effekt)

---

## ROTORSAK

`matchSimProcessor.ts:266` initierar hemmafördelen till `0.05`. Kalibreringsskriptet
`calibrate_v2.ts:1050` körde med `homeAdvantage: 0.14`. Spelet har därmed bara
36% av den hemmafördel som kalibreringen förutsatte.

Detta upptäcktes i Sprint 25-I-analysen — direkt kontradiktion mellan motorn
och kalibreringen.

---

## ÄNDRING

### Fil: `src/application/useCases/processors/matchSimProcessor.ts:266`

**Före:**
```ts
const baseAdv = homeClub?.hasIndoorArena ? 0.05 * 0.85 : 0.05
```

**Efter:**
```ts
const baseAdv = homeClub?.hasIndoorArena ? 0.14 * 0.85 : 0.14
```

Inomhusarena-bonusen behålls proportionellt (0.14 × 0.85 = 0.119).

**Det är hela ändringen.** Ingen annan logik ska röras.

---

## FÖRVÄNTAD EFFEKT

Från analysens scenario A (200 matcher per homeAdv-steg):

| Mått | Före | Efter (förväntat) | Target |
|------|------|-------------------|--------|
| awayWinPct | 42.2% | ~38.3% ✅ | 38.3% |
| homeWinPct | ~43.7% | ~46.9% (residual gap) | 50.2% |
| drawPct | 15.7% | 15.7% (oförändrat) | 11.6% |
| goals/match | 9.00 | 9.00 (oförändrat) | 9.12 |

**Resultat:** awayWinPct hamnar inom tolerans. Residual-gap i homeWinPct kvarstår
(46.9% vs 50.2%) eftersom drawPct är systematiskt för hög — separat strukturproblem
som hanteras (eller inte) i Sprint 25-L.

---

## VERIFIERING

### Steg 1: Build + tester
```bash
npm run build && npm test
```
Förväntat: 1895/1895 grönt. Inga unit-tester ska brytas — `baseAdv` är en
parameter, inte en testat invariant.

### Steg 2: Stresstest
```bash
npm run stress -- --seeds=10 --seasons=3
npm run analyze-stress
```
Verifiera i analyze-stress-output:
- `awayWinPct` ska vara inom [33.3%, 43.3%] (target 38.3% ± 5%)
- `homeWinPct` ska ha stigit från ~43% mot ~47%
- `goals/match` ska vara 8.5-9.5 (oförändrat-zonen)
- Inga andra targets ska ha rört sig signifikant utöver dessa

### Steg 3: Kalibreringsmätning
Kör `scripts/calibrate_v2.ts` (om relevant).

---

## EFTER LEVERANS

`docs/sprints/SPRINT_25J_AUDIT.md` med:
- Mätvärden före/efter (awayWinPct, homeWinPct, drawPct, goals/match)
- Bekräftelse att 1895/1895 fortfarande gäller
- Stress-output utdrag
- Eventuella oväntade rörelser i andra mätvärden

---

## COMMIT

```
fix: synka baseAdv mot kalibrering (Sprint 25-J)

Rotorsak: matchSimProcessor.ts:266 körde baseAdv=0.05 medan calibrate_v2.ts:1050
körde homeAdvantage=0.14. Spelet hade 36% av den hemmafördel kalibreringen
förutsatte.

Ändring: baseAdv 0.05 → 0.14. Inomhusarena-bonus bibehållen proportionellt
(0.14 × 0.85 = 0.119).

Effekt: awayWinPct 42.2% → ~38.3% (inom target). Residual-gap i homeWin
kvarstår pga drawPct (separat problem, Sprint 25-L).

Tester: 1895/1895.
```

---

## VAD SOM INTE INGÅR

- **Draws-problemet (homeWin saknar 3.3pp).** Separat strukturproblem.
  drawPct 15-16% är konstant oavsett homeAdv. Hanteras (eller inte) i 25-L.
- **homeAdvDelta i PHASE_CONSTANTS.** Värdena (QF +0.06, SF +0.05, Final +0.00)
  läggs ovanpå basen — inte berörda av denna fix.
- **Inomhusarena-multiplikatorn 0.85.** Den bibehålls. Frågan om den ska
  räknas om i framtiden är inte del av 25-J.
- **Kalibreringsskriptet.** Det körde redan korrekt på 0.14. Ingen ändring där.

---

## INVARIANT TILL LESSONS.MD

Efter 25-J levererad — lägg till entry i LESSONS.md:

> **Kalibreringsparametrar måste matcha motorns produktion-defaults.**
> Ett kalibreringsskript som kör med ett annat värde än motorn är värdelöst —
> det mäter en hypotetisk motor, inte den verkliga. Verifiera vid varje
> kalibreringsändring att skriptets parametrar matchar motorns faktiska
> startvärden. (Sprint 25-I/25-J: baseAdv 0.05 vs homeAdvantage 0.14.)
