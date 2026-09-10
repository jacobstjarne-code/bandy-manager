# SPEC — Decisionbudget: åldersviktning (anti-svält) + gröna ✓

**Datum:** 2026-09-10
**Från:** Opus, efter kodläsning av `decisionBudgetService.ts`
**Grund:** de två äkta bitarna ur nudges-mocken (resten redan byggt: taket = `MAX_DECISIONS_PER_ROUND`, överflöds-raden = portalhierarki-T4).

## 1 · Åldersviktning i `decisionBudgetService.ts` (Code, domän)

### Problemet, exakt

`partitionInterruptBudget` sorterar `flexible` enbart på deadline; deadline-lösa event får `Infinity` och hamnar alltid sist. Ett deadline-löst uppskjutet beslut kan därför svälta i botten av kön (grind: 44) medan deadline-bärande surfar om och om. `deferredAt` sätts redan men används inte i prioriteringen — datan finns, den läses bara aldrig.

### Fixen (deterministisk, minimal)

Behåll deadline-skyddet oförändrat (imminent surfar alltid). Lägg en **svält-eskalering** i `flexible`-sorteringen: ett event som väntat `STARVATION_ROUNDS` eller mer hoppar först bland de flexibla.

```
const STARVATION_ROUNDS = 3   // tunable

const age = (e) => currentMatchday - (e.deferredAt ?? currentMatchday)

const flexible = actionable
  .filter(e => !imminentSet.has(e.id))
  .sort((a, b) => {
    const aStarv = age(a) >= STARVATION_ROUNDS
    const bStarv = age(b) >= STARVATION_ROUNDS
    if (aStarv !== bStarv) return aStarv ? -1 : 1          // svältande först
    return (getDeadlineRound(a) ?? Infinity) - (getDeadlineRound(b) ?? Infinity)  // sen deadline
  })
```

Ordningen blir: imminent (hård deadline) → svältande flexibla → övriga flexibla på deadline → FIFO för lika. Inget event kan svälta permanent: när det väntat `STARVATION_ROUNDS` lyfts det till fronten av flexibla och surfar så fort budgeten inte är helt uppäten av imminenta. Kräver bara `currentMatchday` (finns i signaturen) + `deferredAt` (finns på deferred; nya pendingEvents får ålder 0, rättvist).

### Gräns värd att veta

En ihållande flod av imminenta deadlines kan skjuta även ett svältande event en omgång till. Det är sällsynt och självläkande (deadlines passerar). Ingen extra mekanik för det nu.

### Tester

- Deadline-löst event uppskjutet `STARVATION_ROUNDS` omgångar surfar före färskare deadline-lösa.
- Imminent deadline slår fortfarande ett svältande event (imminent-skyddet körs före).
- FIFO-stabilitet bevarad för lika nyckel.
- Befintliga budget-/deadline-tester fortsatt gröna.

## 2 · Gröna ✓ (Code, UI — foldas in i portalhierarki-T4)

När den uppskjutna kön krymper omgång-över-omgång (eller ett beslut faller ur), visa en kort grön ✓-kvittens på inkorgs-raden (T4). Positiv förstärkning när väggen sjunker. Ingen egen komponent — en state-touch i T4-inkorgens render, byggs i samma pass som portalhierarki-domen. Håll den dämpad; inkorgen recederar.

## Ägare

Ingen Design-mock. §1 är ren domänlogik (Code), §2 en rad i portalhierarki-bygget (Code). Nudges-mockens övriga delar (topp-3, överflöds-rad) är redan byggda och rörs inte.
