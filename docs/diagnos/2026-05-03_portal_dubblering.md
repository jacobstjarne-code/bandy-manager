# Diagnos — Portal dubbelrendering av transferbud-event (2026-05-03)

## Symptom
Portal visar ETT ljust inline-kort med knappar ("Acceptera 50 tkr" / "Kräv mer 65 tkr" / "Avslå")
OCH ett mörkt kort under med "HÄNDELSE KRÄVER SVAR — Hantera händelse →"-CTA.
Samma transferbud-event renderas dubbelt.

## Komponenter som renderar event-data i Portal

Portal-skärmen renderar (i ordning):
1. `<SituationCard>` — ingen event-rendering
2. `<PortalBeat>` — ingen event-rendering  
3. `<PortalEventSlot>` — renderar inline-event (via `EventCardInline`)
4. `<Primary>` — primärkort baserat på `portalBuilder.buildPortal()`
5. `<PortalSecondarySection>` — sekundära kort
6. `<PortalMinimalBar>` — minimala kort

## Rotorsak

Två separata mekanismer kolliderar för `transferBidReceived`-event:

### Mekanism 1: PortalEventSlot (korrekt)
`PortalEventSlot` → `getCurrentAttention(game)` → `getNextEvent(game)`
Returnerar `transferBidReceived`-event (priority=`'normal'`).
Checken `if (priority === 'critical') return null` gäller INTE → EventCardInline renderas.

### Mekanism 2: EventPrimary (bugg)
`hasCriticalEvent()` i `eventTriggers.ts` filtrerar:
```typescript
const critical = (game.pendingEvents ?? []).filter(
  e => !e.resolved && e.type !== 'pressConference'
)
return critical.length > 0
```
**Ingen priority-check.** Alla olösta events (utom presskonferens) räknas som "kritiska".
`transferBidReceived` har `getEventPriority('transferBidReceived') = 'normal'` — men
`hasCriticalEvent` returnerar ändå true, vilket gör att `EventPrimary` väljs som
primary-kort i `buildPortal()`.

`EventPrimary` visar sedan samma event med titeln + "HÄNDELSE KRÄVER SVAR"-label
och en "Hantera händelse →"-knapp.

## Konfirmation
- `getEventPriority('transferBidReceived')` = `'normal'` (GameEvent.ts rad 137-141)
- `hasCriticalEvent` kontrollerar INTE `.priority === 'critical'` — saknar priority-filter
- `EventPrimary` plockar `first unresolved non-pressConference event` utan priority-check

## Fix

### Fix 1: `hasCriticalEvent` i `eventTriggers.ts`
Lägg till priority-filter:
```typescript
import { getEventPriority } from '../../../entities/GameEvent'

export function hasCriticalEvent(game: SaveGame): boolean {
  const critical = (game.pendingEvents ?? []).filter(
    e => !e.resolved &&
         e.type !== 'pressConference' &&
         (e.priority ?? getEventPriority(e.type)) === 'critical'
  )
  return critical.length > 0
}
```

### Fix 2: `EventPrimary.tsx`
Lägg till priority-filter på samma sätt:
```typescript
const criticalEvent = (game.pendingEvents ?? []).find(
  e => !e.resolved &&
       e.type !== 'pressConference' &&
       (e.priority ?? getEventPriority(e.type)) === 'critical'
)
```

## Varför GameShell inte dubbelrenderar
`GameShell.tsx` och `GameGuard.tsx` kontrollerar redan priority korrekt:
```typescript
const shouldShowEventOverlay =
  attention.kind === 'event' &&
  (attention.event.priority ?? getEventPriority(attention.event.type)) === 'critical'
```
`EventOverlay` renderas alltså INTE för `transferBidReceived` (priority=`normal`).
Dubbel-rendringen sker helt inuti Portal via PortalEventSlot + EventPrimary.
