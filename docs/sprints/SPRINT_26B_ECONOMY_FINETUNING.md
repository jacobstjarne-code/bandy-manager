# Sprint 26b — Ekonomibalansering finjustering

**Status:** SPEC KLAR — REDO ATT IMPLEMENTERAS
**Prioritet:** HÖG (blockar Sprint 25h bandyskandaler)
**Estimat:** 1 timme implementation + stresstest-mätning

---

## KONTEXT

Sprint 26 levererat 2026-04-22. Mätrapport: `SPRINT_26_BALANCE_MEASUREMENT.md`.

Puls-takeffekten är knäckt ✅. Men två medelklubbar spiralar ner till permanent minus:

- **Söderfors (rep 55):** −84k → −535k → −1059k → −928k
- **Målilla (rep 65):** +89k → −473k → −847k → −1200k

Jämförelse: rep 78+ (Västanfors, Forsbacka) klarar sig bra. Brytpunkten ligger mellan rep 65 och 78.

## ANALYS

Två separata strukturella problem:

**1. Arena-underhåll är platt, inte proportionellt.** `capacity × 8` är samma kostnad oavsett hur väl klubben presterar sportsligt. En klubb som tappar i tabellen (lägre attendance, lägre matchintäkter) får samma fasta arena-kostnad. Det driver en spiral för medelklubbar under dåliga säsonger.

**2. weeklyBase-formeln ger för litet golv för medelklubbar.** `2000 + rep × 50` ger rep 55 en bas på 4750/omg, rep 78 en bas på 5900/omg. Skillnaden är bara 24% medan prestationsklyftan är mycket större. Medelklubbar behöver proportionellt mer golv.

## DESIGNBESLUT

**Acceptera att negativ ekonomi ska vara möjlig på lång sikt.** Det är meningen. Skandal-system (Sprint 25h), licensgranskning och långsiktiga konsekvenser är det som ska göra negativ ekonomi farlig — inte matematik som gör det till en binär spiral.

**Mål:** Söderfors/Målilla ska bromsa spiralen, inte vändas till plus. Ca −300k till −600k ssg 4 är acceptabelt (istället för nuvarande −1M+). Det är "klubb i problem" — inte "klubb i kollaps".

## IMPLEMENTATION

### 1. Sänk arena-underhåll från ×8 till ×5

**Fil:** `src/domain/services/economyService.ts`

```typescript
// Idag:
const weeklyArenaCost = Math.round(arenaCapacity * 8)

// Nytt:
const weeklyArenaCost = Math.round(arenaCapacity * 5)
```

**Effekt per klubb per omgång:**
- Forsbacka (cap 745): 5960 → 3725 (−2235)
- Målilla (cap 605): 4840 → 3025 (−1815)
- Söderfors (cap 535): 4280 → 2675 (−1605)

Per säsong (33 omgångar inkl. träningsomgångar): ~50-75k lägre kostnad.

### 2. Höj weeklyBase-konstanten från 2000 till 3000

**Fil:** `src/domain/services/economyService.ts`

```typescript
// Idag:
const weeklyBase = Math.round(2000 + club.reputation * 50)

// Nytt:
const weeklyBase = Math.round(3000 + club.reputation * 50)
```

**Effekt per klubb per omgång:**
- Forsbacka (rep 85): 6250 → 7250 (+1000)
- Målilla (rep 65): 5250 → 6250 (+1000)
- Söderfors (rep 55): 4750 → 5750 (+1000)

Alla klubbar får +33k per säsong. Proportionellt är det dock större för små klubbar (17% av 4750 vs 16% av 6250).

### Kombinerad effekt per säsong

| Klubb | Rep | Arena-besparing | weeklyBase-höjning | Totalt |
|-------|-----|-----------------|--------------------|--------|
| Forsbacka | 85 | +74k | +33k | +107k |
| Målilla | 65 | +60k | +33k | +93k |
| Söderfors | 55 | +53k | +33k | +86k |

## VERIFIERING

Kör samma stresstest som gav Sprint 26-diagnosen (6 seeds × 4 säsonger, 3978 matcher).

**Mät:**
- Slutkapital per seed/klubb per säsong (samma tabell som SPRINT_26_BALANCE_MEASUREMENT.md)
- Andel omgångar negativt netto (target: 30-45%)
- Puls-bucket-fördelning (ska vara oförändrad — inga puls-ändringar i denna sprint)
- Korrelationer rep↔kapital (target: sänkning)

**Target post-justering:**
- Söderfors ssg 4: runt −500k (från −928k)
- Målilla ssg 4: runt −700k (från −1200k)
- Forsbacka ssg 4: runt 2500k (från 1837k) — tillåtet att stiga, justeras i framtida sprint vid behov
- Andel negativt netto: sjunker från 57% till ~45-50% (målet 30-45% är långsiktigt, inte dogma)

**Om Forsbacka/Västanfors drar iväg för mycket:** flagga det — då kan vi i nästa steg införa en progressiv skatt på stora klubbars intäkter (men gör INGA ändringar bortom de två ovan i denna sprint).

**Om Söderfors/Målilla fortfarande spiralar ner:** det indikerar att problemet är djupare än dessa två knappar. Flagga för en separat analys — möjligen matchintäkt-skalning behöver ses över.

## VAD SOM INTE GÖRS

- Ingen ny puls-logik — allt från Sprint 26 behålls
- Ingen ändring av volontär-cap
- Ingen ändring av kommunbidrags-formel
- Ingen ändring av community standing drift
- Ingen lönedynamik (hänger kvar för framtida sprint)
- Ingen skandal-logik (Sprint 25h, blockerad av denna)

## COMMIT-FORMAT

```
feat: sprint 26b — sänk arena-underhåll, höj weeklyBase-golv

- weeklyArenaCost: capacity × 8 → capacity × 5 (−37,5% platt kostnad)
- weeklyBase-konstant: 2000 → 3000 (+1000/omg för alla)

Rotorsak: Arena-underhåll var platt (capacity-baserad men inte
prestations-baserad) och drev spiral för medelklubbar (rep 55-65)
under dåliga säsonger. weeklyBase gav för litet golv — skillnaden
mellan rep 55 och rep 78 var bara 24% trots mycket större
prestationsklyfta. Tillsammans ger ändringarna ~85-100k/säsong
lättnad för medelklubbar medan stora klubbar också får det bättre
men är inte längre automatiskt säkra.

Sprint 26 var för hård mot medelklubbar. Detta är finjusteringen.
```

---

## FRÅN OPUS TILL CODE

Korrekt Claude Code-prompt:

```
Sprint 26b (ekonomibalans finjustering). Full spec i
docs/sprints/SPRINT_26B_ECONOMY_FINETUNING.md.

Två kirurgiska ändringar i src/domain/services/economyService.ts:

1. weeklyArenaCost: capacity × 8 → capacity × 5
2. weeklyBase: 2000 + rep × 50 → 3000 + rep × 50

Efter implementation: kör samma stresstest (6 seeds × 4 säsonger)
och rapportera som SPRINT_26B_BALANCE_MEASUREMENT.md enligt 
samma tabellformat som SPRINT_26_BALANCE_MEASUREMENT.md.

Om Söderfors/Målilla fortfarande spiralar till under -1M ssg 4 — 
flagga det utan att justera vidare. Då är problemet djupare och
kräver ny analys.

Om Forsbacka/Västanfors går över 3M ssg 4 — flagga det också.
```
