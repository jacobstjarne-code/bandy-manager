# CODE_ORDER — KF3 §D Avbrottsbudget

**Datum:** 2026-06-22
**Författare:** Opus
**Ratificerat:** Jacob 2026-06-22 ("KF3 ja")
**Status:** Spec-klar för Code
**Princip (Jacobs, låst):** Budgeten gallrar BESLUT — inte narrativa band. Banden (klack, journalist, anniversary, atmosfär) är texturen och kapas aldrig. Det som tröttar är staplade val.

---

## VARFÖR

`interruptClassifier.ts` byggdes 2026-05-21 som rent mätinstrument ("changes nothing until Design decides"). Beslutet är nu fattat. Trycket är sekventiellt: flera actionable-avbrott (beslut) kan landa samma omgång obudgeterat → beslutsfatigue (spelkänsle-fynd R1). Den informational-floden (atmosfär) har redan `MAX_ATMOSPHERIC_PER_ROUND=2 + MAX_LOW_IN_QUEUE=5` med spill-to-inbox. Det som SAKNAR budget är besluten.

**Detta är ett separat lager från den befintliga atmosfär-trösklingen — rör inte den.**

---

## VAD SOM BYGGS

En budget på **actionable-avbrott per omgång**, med kö (inte inbox), deadline-skydd, och en synlig räknare. Narrativa/informational-avbrott räknas INTE.

### 1. Konstant

I roundProcessor (där `MAX_ATMOSPHERIC_PER_ROUND` bor):

```ts
const MAX_DECISIONS_PER_ROUND = 3
```

### 2. Vad som räknas som "beslut" (actionable)

Använd `classifyInterrupt` (finns i `interruptClassifier.ts`). Actionable = klassificeraren returnerar `'actionable'`:
- `weekly_decision` (alltid actionable) — `game.pendingWeeklyDecision`
- `event` med `choices.length > 0` — poster i `game.pendingEvents`
- `scene` med sceneChoices — `game.pendingScene` (om den har val)

Informational (anslag, phase_mark, atmosfär-events utan val, scen utan val) räknas ALDRIG mot budgeten och köas ALDRIG. De passerar som idag.

### 3. Budget-logiken (vid omgångsavancering, EFTER att pendingEvents/pendingWeeklyDecision satts, FÖRE persist)

Pseudokod:

```
actionableEvents = pendingEvents.filter(ev => !ev.resolved && Array.isArray(ev.choices) && ev.choices.length > 0)
// weekly_decision + scene hanteras separat nedan (de är singulära, sällan samtidiga)

// Deadline-skydd: ett beslut vars expiresRound infaller NÄSTA omgång får ALDRIG köas —
// ett deferrat beslut som hinner förfalla = förlorat beslut. Dessa surfar alltid.
imminent = actionableEvents.filter(ev => ev.expiresRound != null && ev.expiresRound <= game.currentMatchday + 1)
flexible = actionableEvents.filter(ev => !imminent.includes(ev))

// Sortera flexibla på deadline (snarast först), expiresRound==null sist
flexible.sort((a,b) => (a.expiresRound ?? Infinity) - (b.expiresRound ?? Infinity))

budget = MAX_DECISIONS_PER_ROUND - imminent.length   // imminent äter alltid budget först
surface = [...imminent, ...flexible.slice(0, Math.max(0, budget))]
deferred = flexible.slice(Math.max(0, budget))

pendingEvents = [...surface, ...pendingEvents.filter(ev => !actionableEvents.includes(ev))]  // informational orörda
game.deferredDecisions = [...(game.deferredDecisions ?? []), ...deferred]
```

**Nästa omgång:** prepend `game.deferredDecisions` FÖRE nya actionable-events, kör samma budget igen, töm fältet på det som surfar. Deadline-skyddet gäller även här — en deferrad post som nu är imminent surfar garanterat.

`pendingWeeklyDecision` (singulär) räknas mot budgeten men köas inte separat — om budgeten redan är fylld av imminent-events den omgången, behåll weeklyDecision men räkna den i "X beslut väntar". (Singulär → enkel: den ligger kvar tills hanterad ändå.)

### 4. Nytt SaveGame-fält + migration

```ts
deferredDecisions?: GameEvent[]   // köade beslut som väntar på budget-utrymme
```

Migration: befintliga saves utan fältet → `[]` (eller lämna undefined, läs med `?? []`). Ingen datatransformation behövs.

### 5. Synlig räknare — "X beslut väntar"

Exponera antalet **väntande beslut** (deferred + actionable som inte surfat) för Portal. En diskret rad (inte ett kort) i Portal-headern eller överst i besluts-zonen:

> `{n} beslut väntar`

Endast när `n > 0`. Text skrivs av Opus om raden behöver mer än siffran — flagga i leveransen så fyller jag i. Default räcker siffer-raden.

**Detta är det som gör budgeten synlig istället för smygande.** Utan den känns det som att spelet gömmer saker; med den är det en medveten dukning.

---

## VAD DETTA INTE ÄR

- Inte en kapning av beslut. Inget beslut försvinner — det köas och surfar nästa omgång (eller samma omgång om deadline är imminent).
- Inte en budget på banden. Klack/journalist/anniversary/atmosfär passerar oräknade.
- Inte till inboxen. Köade beslut går till `deferredDecisions`, aldrig till inbox (ett beslut i inboxen missas).
- Inte en ändring av `MAX_ATMOSPHERIC_PER_ROUND` / `MAX_LOW_IN_QUEUE`. Det lagret är orört.

---

## VERIFIERING

- Bygg + test gröna.
- Enhetstest: 5 actionable-events samma omgång, 1 med imminent `expiresRound` → 3 surfar (imminent + 2 snarast), 2 i `deferredDecisions`. Nästa omgång → de 2 surfar.
- Imminent-skydd: ett event med `expiresRound = currentMatchday + 1` surfar ALLTID, även om budgeten är full → verifiera att det aldrig hamnar i `deferredDecisions`.
- Inget informational-avbrott (anslag/phase_mark/atmosfär) hamnar någonsin i `deferredDecisions`.
- Räknaren: `deferredDecisions.length + osurfade actionable` matchar "X beslut väntar"-siffran.

---

## NÄSTA STEG (handoff)

Code: bygg enligt ovan, wira budget-logiken i roundProcessors omgångsavancering bredvid den befintliga `MAX_ATMOSPHERIC`-trösklingen, lägg `deferredDecisions` på SaveGame + migration, exponera räknaren för Portal. Rapportera räknarens datakälla + om "X beslut väntar"-raden behöver mer text än siffran (då skriver Opus den). Om Portal-radens placering är otydlig — flagga, Opus/Jacob avgör yta.
