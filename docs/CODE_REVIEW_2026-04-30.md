# CODE_REVIEW_2026-04-30 — Sessionens kodgenomgång

**Författare:** Opus
**Granskningstyp:** Kontextuell (Typ C) över hela sessionens leveranser
**Status:** 6 buggar / inkonsekvenser identifierade. Inga kritiska, men flera värda att fixa innan playtest.

---

## Vad som granskades

Sessionens leveranser: SPEC_PORTAL_FAS_2 Steg 1-3, SPEC_BESLUTSEKONOMI Steg 1-2, omgångsstegare-fixarna, text-fixarna (verb, gräsmatta, season_opener).

Filer lästa:
- `attentionRouter.ts`
- `eventQueueService.ts`
- `EventOverlay.tsx`
- `GameShell.tsx`
- `AppRouter.tsx`
- `roundProcessor.ts` (delar)
- `situationFragments.ts`
- `portalBeats.ts`

---

## Fynd

### B1 — DUBBEL SORTERINGSLOGIK i EventOverlay (medium)

**Fil:** `src/presentation/components/EventOverlay.tsx:23-37`

EventOverlay sorterar `pendingEvents` själv på prioritet och plockar första olösta — *trots* att `attentionRouter.getCurrentAttention()` redan returnerar nästa event. GameShell skickar inte event-propen till EventOverlay.

```typescript
// EventOverlay.tsx:24-37 — duplicerar attentionRouter
const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
const event = (game && events.length > 0 && !isMatchScreen)
  ? ([...events].sort((a, b) => /* ... */ ).find(e => !e.resolved) ?? events[0])
  : null
```

**Konsekvens:** Två kodpunkter (attentionRouter och EventOverlay) kan hamna ur synk. Inte trasigt nu, men brittlt — om någon ändrar prioritet i en fil och inte den andra blir det inkonsekvent.

**Fix:** EventOverlay borde ta event som prop från GameShell. GameShell har redan `attention.event` från `getCurrentAttention()`. Pasa den.

---

### B2 — `currentMatchday` används med `?? 0` på flera platser fortfarande (low)

**Filer:** `roundProcessor.ts:1240`, `roundProcessor.ts:1257`, `gameFlowActions.ts:403`

A1-fixen sätter `currentMatchday: nextMatchday` i spread-objektet. Bra. Men fältet är fortfarande optional i SaveGame-typen, så TypeScript tvingar `?? 0`-fallback på alla läsare. Specifikt:

```typescript
// roundProcessor.ts:1240
id: `journalist_broken_${updatedGame.currentSeason}_${updatedGame.currentMatchday ?? 0}`,

// gameFlowActions.ts:403 (från diagnos-rapporten)
lastCoffeeSceneRound = updatedGame.currentMatchday ?? 0  // → alltid 0 om fältet undefined
```

**Konsekvens:** För nya spel som A1 satt `currentMatchday` på fungerar det. För befintliga saves utan migration ger `?? 0` fortfarande fel värden. Diagnosen sa migration skulle göras — verifiera att den faktiskt finns.

**Fix:** Antingen göra fältet required (`currentMatchday: number`), vilket kräver migration, eller verifiera att A1:s migration kör för existerande saves.

---

### B3 — NAMNRYMDS-INKONSEKVENS mellan spec och kod (low, dokumentation)

**Spec:** `'critical' | 'medium' | 'atmospheric'` (3 nivåer)
**Kod:** `'critical' | 'high' | 'normal' | 'low'` (4 nivåer) — befintligt fält som behölls

Code fattade rätt beslut att inte bryta befintlig typning. Men:

- Kommentarer i `eventQueueService.ts` använder `low` korrekt
- Spec i `SPEC_BESLUTSEKONOMI_STEG_2.md` säger `atmospheric`
- Spec i `SPEC_BESLUTSEKONOMI_STEG_3.md` säger `medium` och `atmospheric`
- `roundProcessor.ts:cap`-logiken cappar `'low'`, inte `'atmospheric'`

**Konsekvens:** Framtida läsare av spec vs kod blir förvirrade. Steg 3-implementationen kommer behöva mappa: spec `medium` → kod `high|normal`, spec `atmospheric` → kod `low`.

**Fix:** Antingen uppdatera specerna att använda `low`/`normal`/`high`/`critical`, eller skriv ett mappnings-block överst i Steg 3-specen. Inte koden — den är konsekvent.

---

### B4 — Cap-logiken är på FEL PLATS i roundProcessor (medium)

**Fil:** `roundProcessor.ts:947-975` (B3/B4-blocket)

Capping av låg-prio events sker *innan* `pendingEvents` byggs i spread-objektet. Men:

```typescript
// roundProcessor.ts:990 (efter cap-blocket)
pendingEvents: [
  ...(game.pendingEvents ?? []).filter(e => !e.resolved && !allNewEvents.some(n => n.id === e.id)),
  ...allNewEvents,
],
```

Spread-objektet inkluderar **alla existerande olösta events från tidigare omgångar**. Om spelaren har ackumulerat 8 låg-prio events från tre omgångar utan att hantera dem — capet på 2 per round hjälper inte. Kön växer ändå.

Sen, *efter* spread-objektet, kommer `arc-processing`-blocket på rad 1115-1145 som lägger till **fler** events utan cap:

```typescript
pendingEvents: [...(updatedGame.pendingEvents ?? []), ...arcResult.newEvents],
```

**Konsekvens:** Capet är en ström-fix, inte en kö-fix. Om spelaren ackumulerar atmosfäriska events i kön (klickar inte bort dem) växer kön obegränsat. Diagnosens 30-80 events/säsong-prognos kvarstår delvis.

**Fix:** Lägg ett *globalt* cap på låg-prio events i kön, inte bara på nya per round. T.ex. efter spread:
```typescript
const allLow = updatedGame.pendingEvents.filter(e => priority === 'low')
if (allLow.length > 5) {
  // flytta överskott till inbox
}
```
Eller: arc-events som är låg-prio bör också gå genom samma cap-logik.

---

### B5 — `getNextEvent` filtrerar `resolved` men kön rensar inte (low)

**Fil:** `eventQueueService.ts:30`

```typescript
const events = (game.pendingEvents ?? []).filter(e => !e.resolved)
```

Bra. Men `pendingEvents` rensas aldrig från resolved events — de ligger kvar i state och tar upp plats. Bara filtreras vid läsning.

**Konsekvens:** State växer med tiden. localStorage-storleken ökar. Inte trasigt på kort sikt, men 1-2 säsongers spel ackumulerar onödiga objekt.

**Fix:** I `resolveEvent`-actionen i store, ta bort eventet från `pendingEvents` istället för att markera `resolved: true`. Eller: lägg en periodisk rensning i roundProcessor:
```typescript
pendingEvents: pendingEvents.filter(e => !e.resolved)
```

---

### B6 — `useEffect`-dependency i AppRouter:s DashboardOrPortal (low)

**Fil:** `AppRouter.tsx:74-80`

```typescript
useEffect(() => {
  if (!game || redirected.current) return
  if (attention.kind === 'screen') {
    const route = PENDING_SCREEN_ROUTES[attention.screen]
    if (route) { redirected.current = true; navigate(route, { replace: true }) }
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [attention.kind === 'screen' ? (attention as { kind: 'screen'; screen: string }).screen : null])
```

Dependency-arrayen innehåller en uträkning som kan returnera olika typer mellan renders. Plus eslint-disable. Det är *funktionellt* OK men bröstigt.

**Konsekvens:** Eftersom `redirected.current = true` sätts efter första navigation rensas det aldrig — om spelaren navigerar tillbaka till dashboard manuellt och sedan får en ny `pendingScreen`, triggar useEffect:en inte igen.

**Fix:** Rensa `redirected.current` när `attention.kind` ändras till annat än 'screen'. Eller använd useEffect med rätt dependencies utan eslint-disable.

---

## Sammanfattning prioriterat

| # | Fil | Allvar | Kort |
|---|-----|--------|------|
| B1 | EventOverlay.tsx | medium | Dubbel sorteringslogik — använd attentionRouter |
| B4 | roundProcessor.ts | medium | Cap är ström-fix, kö växer ändå |
| B2 | flera | low | currentMatchday `?? 0` kvar — kolla migration |
| B3 | dokumentation | low | Spec/kod-namnrymds-inkonsekvens |
| B5 | eventQueueService | low | Resolved events rensas aldrig från state |
| B6 | AppRouter.tsx | low | useEffect-dependency-edge case |

**Inga kritiska fynd.** Inga regressioner från tidigare sprintar. Arkitekturen håller. Det här är *städ* inför playtest, inte panikfix.

---

## Det jag INTE hann granska

- PortalEventSlot (Steg 3) — finns inte än, ingen verifiering möjlig
- Migration för `currentMatchday` på existerande saves — söktes ej upp
- Tester för attentionRouter/eventQueueService — Code rapporterade gröna, jag verifierade inte
- Cup vs liga "spökomgångar" — Jacob nämnde att de fortfarande spökar, ingen verifiering
- Söndagsträning-scen i webbläsare — kräver playtest

---

## Rekommendation

Inga av buggarna ovan blockerar playtest. Säg till Code att fixa B1 och B4 *innan* nästa större spec, men det kan vänta tills efter Jacobs playtest. Resten (B2, B3, B5, B6) är notisar — lägg i ATGARDSBANK.

Slut.
