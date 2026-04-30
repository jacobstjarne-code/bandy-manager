# SPEC_BESLUTSEKONOMI — Steg 3: Portal-event-slot

**Status:** Spec-klar för Code efter Steg 2 levererat.
**Beroende:** A1, A2, B1, B2 i Steg 2 måste fungera först.

---

## NAMNRYMDS-MAPPNING: SPEC vs KOD

Steg 2-specen använde tre prioritetsnivåer (`critical`/`medium`/`atmospheric`).
Koden implementerades med fyra nivåer (`critical`/`high`/`normal`/`low`).

**Denna spec (Steg 3) och framtida specar använder kodens fyra nivåer:**

| Begrepp i Steg 2-spec | Kod (`EventPriority`) | Användning |
|---|---|---|
| `critical` | `critical` | Overlay-format — blockerar Portal |
| `medium` | `high` eller `normal` | PortalEventSlot — inline i Portal |
| `atmospheric` | `low` | PortalEventSlot — inline i Portal |

Där Steg 3-spec skriver "medium och atmosfäriska" avses alltså kod-nivåerna `high`/`normal`/`low`.

---

## VAD STEG 3 GÖR

Just nu visas events via `EventOverlay` — fullskärmsoverlay som blockerar Portal. Det funkar för kritiska events (presskonferens, transferbud) men är fel format för medium och atmosfäriska. Atmosfärsskvaller ska inte blockera skärmen.

**Steg 3:** Inför `PortalEventSlot`-komponent som visar **medium och atmosfäriska events inline i Portal**. Kritiska events behåller overlay-formatet (de ska blockera).

---

## KOMPONENT-DESIGN

### `PortalEventSlot.tsx`

Renderas i PortalScreen, mellan SituationCard/PortalBeat och Primary card.

```tsx
// src/presentation/components/portal/PortalEventSlot.tsx

import { getCurrentAttention } from '../../../domain/services/attentionRouter'
import { getQueueStats } from '../../../domain/services/eventQueueService'

export function PortalEventSlot({ game }: { game: SaveGame }) {
  const attention = getCurrentAttention(game)

  // Bara render om det är ett event (inte screen/scene/idle)
  if (attention.kind !== 'event') return null

  const event = attention.event

  // Kritiska går via EventOverlay (utanför Portal). Skippa här.
  if (event.priority === 'critical') return null

  const stats = getQueueStats(game)

  return (
    <EventCardInline
      event={event}
      remainingCount={stats.medium + stats.atmospheric - 1}
    />
  )
}
```

### `EventCardInline.tsx`

Visuellt: liknar `SituationCard` men med tydlig event-typ-indikering.

**Anatomi:**
- Vänster border-stripe i färg per prio (medium = accent, atmospheric = muted)
- Emoji + event-typ-label uppe ("📰 LOKALTIDNINGEN", "💬 KAFFERUMMET", "🎓 AKADEMIN")
- Body-text i Georgia 13px italic
- Knapprad i botten: kontextuella val per event-typ

**För medium (ex. akademispelare redo):**
```
🎓 AKADEMIN
"Anders Henriksson, P19, är redo för uppflyttning."
[ Flytta upp ]  [ Vänta säsongen ut ]
```

**För atmospheric (ex. kafferum):**
```
💬 KAFFERUMMET
"Vaktmästaren tycker det luktar konstigt i omklädningsrummet sedan torsdag.
Han har inte sagt något till någon utom dig."
[ Kvittera ]
```

**Räknarrad** under: `2 mindre saker till att kolla` (om fler i kö). Klick → öppnar inboxen filtrerad på olästa.

---

## EVENTOVERLAY-ANPASSNING

`EventOverlay` (existerande) får uppdaterat villkor i `GameShell.tsx`:

```typescript
// Bara overlay för kritiska events
const shouldShowEventOverlay =
  attention.kind === 'event' &&
  attention.event.priority === 'critical' &&
  !isMatchRoute &&
  !isReviewRoute &&
  !pressConferenceRoute
```

Medium och atmospheric blir aldrig overlay. De renderas av `PortalEventSlot` när spelaren är i Portal.

---

## EVENT-TYP-MAPPNING TILL VAL

Varje event-typ behöver veta vad knappradens val är. Existerande logik finns redan i `EventOverlay` per event-typ — vi flyttar den till en gemensam `eventActions.ts`:

```typescript
// src/domain/services/eventActions.ts

export interface EventAction {
  label: string
  effect: (game: SaveGame, eventId: string) => SaveGame
}

export function getActionsForEvent(event: PendingEvent): EventAction[] {
  switch (event.type) {
    case 'starPerformance':
      return [{ label: 'Bra jobbat', effect: kvittera }]
    case 'bandyLetter':
      return [{ label: 'Läs senare', effect: kvittera }]
    case 'communityEvent':
      return [{ label: 'Kvittera', effect: kvittera }]
    case 'academyEvent':
      return [
        { label: 'Flytta upp', effect: applyAcademyPromotion },
        { label: 'Vänta', effect: deferAcademyDecision },
      ]
    // ... etc per event-typ
  }
}
```

Code identifierar vilka av de 30+ event-typerna som idag har valhantering i `EventOverlay` och flyttar logiken till `eventActions.ts`.

---

## EVENT-TEXTER — OPUS SKRIVER

Code lämnar texterna tomma. Opus skriver alla event-card-texter mellan stegen. För Fas 1 — fokus på de mest frekventa atmosfäriska:

- communityEvent (orten har en händelse)
- supporterEvent (klacken-fragment)
- starPerformance (spelarens prestation)
- playerPraise / playerMediaComment
- bandyLetter (insändare)
- captainSpeech (kaptenens kommentar)

Resten kan ha generiska texter tills Opus hinner skriva.

---

## TESTER

- `PortalEventSlot` renderas inte när `attention.kind !== 'event'`
- Kritisk event → returnerar null (lämnar till EventOverlay)
- Medium event → renderar med rätt actions
- Atmospheric event → renderar med kvittera-knapp
- `EventOverlay`-villkoret i GameShell renderar inte vid medium/atmospheric

---

## VERIFIERING

Code spelar säsong 1 omg 1-3 i webbläsare:
1. Skärmdump av Portal vid en atmospheric event (ex. kafferum eller community)
2. Skärmdump av Portal vid en medium event (ex. akademi)
3. Skärmdump av EventOverlay vid en kritisk event (ex. presskonferens)
4. 2-3 meningar: känns det rätt att atmospheric ligger i Portal istället för overlay?

---

## VAD STEG 4 OCH 5 BLIR

Steg 4 (fas-scenes) och Steg 5 (kritiska scenes) är oförändrade från ursprunglig spec — de skrivs när Steg 3 är levererat och playtest:at.

---

Slut.

