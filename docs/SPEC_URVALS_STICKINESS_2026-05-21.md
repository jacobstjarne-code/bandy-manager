# SPEC — Urvals-stickiness (kafferum-upprepning + Portal-oscillation)

**Datum:** 2026-05-21
**Status:** Klar för Code. Två buggar i urvalslogiken, verifierade mot kod.
**Bakgrund:** Jacobs playtest-känsla — "kafferummet visas gång på gång med samma
innehåll" + "allt som prioriteras fortsätter prioriteras". Båda bekräftade i kod.
**Avgränsning:** Detta är ren mekanik. Urvalsfilosofin (variation som mål,
avfärdade kort ur rotation) är Designs bord — INTE i denna spec.

**INGEN svensk spelartext.** Ren urvalslogik.

---

## TICKET 1 — Kafferummet upprepar samma innehåll

**Plats:** `src/domain/services/coffeeRoomService.ts` → `getCoffeeRoomScene`

**Rotorsak:** Två fel samverkar:
1. `seed = round * 11 + game.currentSeason * 31` där `round` = högsta spelade
   ligarunda. Seedet ändras BARA per ligarunda. Triggas kafferummet mellan
   ligarundor (cup-omgång, override-trigger) eller flera gånger samma ligarunda
   är seedet identiskt → samma exchanges.
2. `getCoffeeRoomScene` har INGEN anti-upprepningslogik. `lastCoffeeQuoteHash`
   finns i SaveGame och används i `getCoffeeRoomQuote` (dashboard-snutten) men
   ALDRIG i scenen.

**Fix:**

A. Seeda på `currentMatchday`, inte ligarunda:
```typescript
const seed = (game.currentMatchday ?? 0) * 11 + game.currentSeason * 31
```
Då ändras urvalet varje matchdag, inte bara varje ligarunda.

B. Lägg till anti-upprepning. Spåra senast visade exchange-index och undvik det.
Använd samma mönster som `getCoffeeRoomQuote` redan har med `lastCoffeeQuoteHash`,
ELLER inför ett scen-specifikt fält `lastCoffeeSceneIndices?: number[]` på SaveGame
(de index som visades senast) och undvik dem i nästa plock:

```typescript
const lastIndices = new Set(game.lastCoffeeSceneIndices ?? [])
// vid plock: hoppa över index som finns i lastIndices om poolen är stor nog
```

`completeScene('coffee_room')` (i gameStore) sätter `lastCoffeeSceneIndices` till
de index som just visades, så nästa scen undviker dem.

C. **Pool-storlek.** Sju generiska utbyten är för få för ett återkommande inslag.
Detta är delvis Opus-jobb (skriva fler) — men flagga i koden med kommentar att
`GENERIC_EXCHANGES` bör utökas. Opus levererar fler varianter separat om Jacob vill.
INTE Code's uppgift att skriva dem.

**Test:**
- Två kafferum samma ligarunda men olika matchdag → olika exchanges
- `lastCoffeeSceneIndices` respekteras — samma scen visas inte två gånger i rad
- Liten pool + alla index nyligen visade → degraderar utan krasch

---

## TICKET 2 — Portal-kort fastnar (oscillation + liten pool)

**Plats:** `src/domain/services/portal/portalBuilder.ts` → `computeCardStaleTracking`
+ `staleBias`

**Rotorsak — två hål i dämpningen:**

1. **Gap nollställer dämpningen.** `computeCardStaleTracking` sätter
   `firstShownAt = currentMatchday` så fort ett kort INTE var sekventiellt
   (hoppade över en omgång). Så ett dämpat högviktskort återfår full vikt genom
   att bara missa EN omgång → oscillation: samma kort roterar tillbaka.

2. **staleBias har inget minne av historik.** `0.5^(currentMatchday - firstShownAt)`
   tittar bara på nuvarande obrutna svit. Total visningsfrekvens ignoreras.

**Fix:**

A. **Mjukare gap-återställning.** Istället för hård nollställning vid gap — degradera
   `firstShownAt` gradvis. Lägg till `shownCount` på StaleEntry och låt biasen ta
   hänsyn till total visningsfrekvens, inte bara obruten svit:

```typescript
type StaleEntry = { firstShownAt: number; lastShownAt: number; shownCount: number }

function staleBias(cardId, tracking, currentMatchday): number {
  const t = tracking?.[cardId]
  if (!t) return 1
  const consecutive = Math.max(0, currentMatchday - t.firstShownAt)
  // Frekvensgolv: ett kort som visats många gånger totalt återfår inte full vikt
  const frequencyPenalty = Math.min(0.5, t.shownCount * 0.08)
  return Math.max(0.1, Math.pow(0.5, consecutive) * (1 - frequencyPenalty))
}
```

B. **Gap halverar istället för nollställer.** I `computeCardStaleTracking`, vid
   icke-sekventiell visning: flytta `firstShownAt` halvvägs tillbaka mot
   currentMatchday istället för att sätta det = currentMatchday. Då "läker" inte
   dämpningen helt av ett enda gap:

```typescript
const isSequential = existing?.lastShownAt === currentMatchday - 1
const firstShownAt = !existing
  ? currentMatchday
  : isSequential
    ? existing.firstShownAt
    : Math.floor((existing.firstShownAt + currentMatchday) / 2)  // halvvägs, ej nollställ
next[id] = {
  firstShownAt,
  lastShownAt: currentMatchday,
  shownCount: (existing?.shownCount ?? 0) + 1,
}
```

C. **Migration.** `shownCount` är nytt fält — default 0/undefined-säkert i
   `staleBias` (redan hanterat via `?? 0`).

**Vad denna fix INTE gör (Design lördag):**
- Lyfter inte aktivt fram sällan-visade kort (variation som mål)
- Tar inte bort avfärdade kort ur rotation
- Ändrar inte eligible-pool-storleken (för få secondary/minimal-kort är ett
  innehållsproblem, inte ett urvalsproblem — Design avgör om fler kort behövs)

**Test:**
- Kort visat 3 omgångar i rad → dämpat. Hoppar över 1 omgång → dämpning
  halveras INTE bort helt (firstShownAt går halvvägs, inte till noll)
- Kort med högt shownCount → frequencyPenalty sänker maxvikten
- Två kort med samma basvikt, ett visat ofta → det andra vinner

---

## ACCEPTANSKRITERIER

- [ ] Kafferummet seedar på matchdag, två scener samma ligarunda skiljer sig
- [ ] `lastCoffeeSceneIndices` förhindrar identisk scen i rad
- [ ] `GENERIC_EXCHANGES` flaggad för utökning (Opus levererar fler om önskat)
- [ ] staleBias tar hänsyn till shownCount (frekvensgolv)
- [ ] Gap halverar firstShownAt istället för att nollställa
- [ ] Migration: shownCount default-säkert
- [ ] Alla 922+ tester gröna

---

## NOTERING TILL DESIGN (lördag)

Mekaniken fixad här gör att kort/kafferum inte längre fastnar lika hårt. Men den
DJUPARE frågan kvarstår och är Designs: ska urvalet *belöna variation aktivt*
(lyfta sällan-visat, inte bara dämpa ofta-visat), och ska kort spelaren redan
agerat på lämna rotationen? Det är skillnaden mellan "mindre repetitivt" (denna
spec) och "känns nytt varje gång" (Designs ambition). Kö-instrumenteringen från
dukningssprinten ger underlag även här.

— Opus, 2026-05-21
