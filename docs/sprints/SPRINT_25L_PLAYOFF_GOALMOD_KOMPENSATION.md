# Sprint 25-L — Kompensera goals/match-fall i KVF/SF efter cornerGoalMod-sänkning

**Status:** READY TO IMPLEMENT
**Estimat:** 1-2h Code (kort impl, iterativ mätning)
**Förutsätter:** Sprint 25-K levererad och verifierad
**Risk:** Låg-Medel — påverkar mål/match i KVF/SF, kräver mätning per fas

---

## ROTORSAK

Sprint 25-K införde `cornerGoalMod` som direktskalar `cornerBase` per fas:
KVF 0.78, SF 0.75, Final 0.92, regular 1.00. Det löste cornerGoalPct mot
target.

Sidoeffekt: cornerGoalMod minskar inte bara hörnmålen utan reducerar mål/match
totalt eftersom hörn-baselinen är en del av varje steps `goalThreshold`. Hörnmål
är ~22% av alla mål — när `cornerGoalMod` sänks 22% i KVF tas en relativt stor
andel av totalmålen bort.

**Effekt:** mål/match föll 0.5-0.6 i KVF och SF efter 25-K, just utanför
±tolerance. Markerade 🔶 i 25K-audit.

---

## NUVARANDE LÄGE (post-25-K)

| Fas | mål/match motor | mål/match target | gap | status |
|-----|-----------------|------------------|-----|--------|
| Regular | 9.34 | 9.12 | +0.22 | 🔶 (något hög) |
| KVF | 8.29 | 8.81 | −0.52 | 🔶 |
| SF | 7.76 | 8.39 | −0.63 | 🔶 |
| Final | 7.38 | 7.00 | +0.38 | ✅ inom tol |

cornerGoalPct ligger fint i alla faser. Det är *bara* totalmål som behöver
justeras i KVF och SF.

---

## ÄNDRING

### Fil: `src/domain/services/matchUtils.ts` — PHASE_CONSTANTS

Höj `goalMod` i KVF och SF för att kompensera för cornerGoalMod-sänkningen.

**Princip för initialvärden:** linjär kompensation. Mål/match är ungefär
proportionellt mot goalMod när andra parametrar är konstanta.

- KVF: behöver +0.52 mål/match → relativ höjning 8.81/8.29 ≈ 1.063× → goalMod
  0.966 → ~1.027 (men se nedan)
- SF: behöver +0.63 mål/match → 8.39/7.76 ≈ 1.081× → goalMod 0.920 → ~0.995

**Problem:** ren linjär kompensation bryter monotonitet. KVF skulle få
goalMod 1.027 > regular 1.000, vilket bandymässigt är fel — slutspelsmatcher
ska ha färre mål per match, inte fler.

**Lösning:** kompensera *delvis* så monotoniteten bevaras men gapet stängs.
Acceptera att KVF/SF mål/match kanske hamnar 0.1-0.2 under target hellre än
att bryta strukturmodellen.

**Förslag på initialvärden (Code itererar):**

| Fas | goalMod nu | goalMod nytt | bibehåller monotonitet? |
|-----|-----------|--------------|--------------------------|
| Regular | 1.000 | 1.000 (oförändrat) | — |
| KVF | 0.966 | **0.995** | Ja (0.995 < 1.000) |
| SF | 0.920 | **0.965** | Ja (0.965 < 0.995) |
| Final | 0.768 | 0.768 (oförändrat) | Ja (0.768 < 0.965) |

Med dessa värden:
- KVF mål/match förväntat: 8.29 × (0.995/0.966) ≈ 8.54 (target 8.81, gap −0.27)
- SF mål/match förväntat: 7.76 × (0.965/0.920) ≈ 8.14 (target 8.39, gap −0.25)

Båda inom ±0.5 tolerans, monotonitet bevarad.

**Det är hela ändringen.** Endast två värden:
- KVF goalMod: `0.966` → `0.995`
- SF goalMod: `0.920` → `0.965`

Övriga värden (regular, final, alla cornerGoalMod, cornerTrailingMod, etc.) är
inte berörda.

---

## VERIFIERING

### Steg 1: Build + tester
```bash
npm run build && npm test
```
Förväntat: 1895/1895 grönt.

### Steg 2: Per-fas mätning

Samma metodik som 25-K — 200 matcher per fas isolerat (eller motsvarande
verktyg Code använder).

**Acceptanskriterier:**
- Regular mål/match: oförändrat (~9.3) ✅
- KVF mål/match: inom `[8.31, 8.81]` (target 8.81 −0.5, +0.0)
  *Bättre om över 8.6, men under target accepteras för monotonitet*
- SF mål/match: inom `[7.89, 8.39]`
- Final mål/match: oförändrat (~7.4)

**cornerGoalPct ska stå still:**
- Regular: ~23.0%
- KVF: ~22.9%
- SF: ~22.6%
- Final: oförändrat

Om cornerGoalPct rör sig signifikant — något är fel. goalMod ska påverka
totalmål, inte hörnandel.

### Steg 3: Stresstest
```bash
npm run stress -- --seeds=10 --seasons=3
npm run analyze-stress
```

Verifiera att:
- KVF/SF mål/match nu är inom tolerans (eller åtminstone bättre än 25-K)
- awayWinPct och homeWinPct INTE har rört sig från 25-J
- cornerGoalPct per fas INTE har rört sig från 25-K

### Steg 4: Iteration om nödvändigt

Om mätning visar att KVF eller SF fortfarande är >0.4 under target:
- Höj respektive goalMod ytterligare i steg om 0.010
- Mät igen
- Stanna när inom tolerans ELLER när monotonitet hotas

Om mätning visar att KVF/SF *överskott* (mål/match över target):
- Sänk goalMod tillbaka i steg om 0.010
- Mät igen

---

## EFTER LEVERANS

`docs/sprints/SPRINT_25L_AUDIT.md` med:
- Per-fas mål/match före/efter
- Per-fas cornerGoalPct före/efter (ska stå still)
- Stress-output utdrag
- Slutgiltiga PHASE_CONSTANTS-värden
- Bekräftelse 1895/1895
- Eventuella iterationer (om initialvärdena inte räckte)

---

## COMMIT

```
fix: kompensera mål/match-fall i KVF/SF efter cornerGoalMod (Sprint 25-L)

Rotorsak: Sprint 25-K cornerGoalMod-sänkning (KVF 0.78, SF 0.75) reducerade
inte bara cornerGoalPct utan också mål/match med 0.52-0.63, just utanför
tolerans (🔶).

Ändring: höj goalMod i KVF (0.966 → 0.995) och SF (0.920 → 0.965).
Monotonitet bibehållen (regular 1.000 > KVF 0.995 > SF 0.965 > final 0.768).

Effekt: KVF mål/match ~8.5 (target 8.81). SF ~8.1 (target 8.39). Båda inom
±0.5 tol. cornerGoalPct oförändrat.

Tester: 1895/1895.
```

---

## VAD SOM INTE INGÅR

- **Fullständig stängning av gapet.** Det är troligen inte möjligt utan att
  bryta monotonitet eller skala om hela cornerGoalMod-systemet. Att hamna
  inom tol är målet, inte exakt träff.
- **Regular mål/match (+0.22).** Inom tol, ej prioriterat. Att sänka
  regular goalMod skulle skapa kaskadeffekt på alla andra faser.
- **Strukturreform av matchCore-formeln.** cornerBase + delta-modell är
  inte ifrågasatt här. Det är en kalibreringsjustering.

---

## VARNING

**Om iteration visar att initialvärdena är fel åt fel håll** — t.ex. KVF
hamnar på 9.0 mål/match istället för 8.5 — har min uppskattning gått åt
fel håll. Mest sannolikt skäl: jag underskattade hur mycket cornerGoalMod
*indirekt* påverkar totalmål via klampning. Iterera neråt i sådana fall.

---

## PARALLELL OBSERVATION (ej del av denna sprint)

cornerGoalMod-mekanismen (Sprint 25-K) är tekniskt korrekt men har en
intrinsisk koppling: ändring av cornerGoalMod påverkar både cornerGoalPct
*och* totalmål. Långsiktigt vore det renare om cornerBase och non-corner
goal-baseline var separat justerbara. Det är inte en akut skuld men värt
att notera om en framtida sprint behöver finkalibrera båda dimensioner
oberoende.

(Inte spec, inte i 25-L. Bara en notering för senare.)
