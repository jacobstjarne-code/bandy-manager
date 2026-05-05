# SPEC_BESLUTSEKONOMI Steg 1-3 — Audit 2026-05-05

Blockerar Steg 4. Verifierat mot faktisk källkod, inte KVAR.md-text.

---

## Steg 2 — attentionRouter + eventQueueService + MAX_ATMOSPHERIC_PER_ROUND

### attentionRouter

**Fil:** `src/domain/services/attentionRouter.ts`

Prioritetsordning verifierad (rad 29–41):
```
1. pendingScreen  → { kind: 'screen' }
2. pendingScene   → { kind: 'scene' }
3. getNextEvent() → { kind: 'event' }
4. fallback       → { kind: 'idle' }
```

**Importerad i (alla tre producenter verifierade):**

| Fil | Rad | Används till |
|-----|-----|-------------|
| `GameShell.tsx` | 8 | `shouldShowEventOverlay`-beräkning |
| `GameGuard.tsx` (i GameShell.tsx) | 15 | samma för fullskärmsrouter utan BottomNav |
| `PortalEventSlot.tsx` | 12 | hämtar nästa event att visa inline |
| `AppRouter.tsx` | 41 | routing-beslut |

**Renderingsväg:** `AppRouter.tsx` → `GameShell.tsx` (wrappas kring alla `/game/*`-routes) → `getCurrentAttention(game)` anropas vid varje render.

### eventQueueService

**Fil:** `src/domain/services/eventQueueService.ts`

`getNextEvent()` (rad 33–46): Sorterar `!resolved`-events på `PRIORITY_RANK` (critical=0, high=1, normal=2, low=3), FIFO inom samma prio.

`getQueueStats()` (rad 51–61): Räknar per prio-nivå. Används av PortalEventSlot för `remainingCount`.

**Importerad i:**

| Fil | Rad | Funktion |
|-----|-----|----------|
| `attentionRouter.ts` | 17 | `getNextEvent` |
| `EventOverlay.tsx` | 8 | `getNextEvent` (fallback om ingen prop) |
| `PortalEventSlot.tsx` | 13 | `getQueueStats` → remainingCount |

### MAX_ATMOSPHERIC_PER_ROUND = 2

**Implementerat i:** `src/application/useCases/roundProcessor.ts` rad 987–996

```ts
const MAX_ATMOSPHERIC_PER_ROUND = 2
const atmosphericNew = allNewEvents.filter(e => priority === 'low')
const keptAtmospheric = atmosphericNew.slice(0, 2)
const droppedAtmospheric = atmosphericNew.slice(2)
// dropped → inbox (ej kasserade)
```

Kritiska och high/normal events cappas aldrig. ✅

---

## Steg 3 — eventActions, EventCardInline, PortalEventSlot, overlay-logik

### eventActions

**Fil:** `src/domain/services/eventActions.ts`

Importerad i: `EventCardInline.tsx` rad 15 (`getActionsForEvent`).
Används till: producerar knapprad med `isPrimary`-flagga per event-typ.

### EventCardInline

**Fil:** `src/presentation/components/portal/EventCardInline.tsx`

Importerad i: `PortalEventSlot.tsx` rad 15.
Renderas: `<EventCardInline event={event} remainingCount={remainingCount} />` (PortalEventSlot rad 41–44).

Knappar använder nu `.btn .btn-primary` / `.btn .btn-outline` CSS-klasser (linter-justerat 2026-05-05). ✅
Räknartext: "X notiser i inboxen" (rad 140). ✅

### PortalEventSlot

**Fil:** `src/presentation/components/portal/PortalEventSlot.tsx`

**Importerad i:** `PortalScreen.tsx` rad 11.

**Renderas i PortalScreen.tsx rad 152:**
```tsx
<SituationCard game={game} />
<PortalBeat game={game} />
<PortalEventSlot game={game} />   ← här
<Primary game={game} />
<PortalSecondarySection ... />
```

**Guard-logik i PortalEventSlot (rad 26–32):**
- `attention.kind !== 'event'` → null (ingen inline-slot när screen/scene/idle styr)
- `priority === 'critical'` → null (lämnar till EventOverlay)

Båda guards verifierade mot filinnehåll. ✅

### Overlay-only-for-critical

**GameShell.tsx rad 60–65:**
```ts
const shouldShowEventOverlay =
  attention.kind === 'event' &&
  priority === 'critical' &&
  !isMatchRoute &&     // /match/live, /game/match, /game/match-result, /game/review
  !isReviewRoute &&    // /game/review (redundant med isMatchRoute, men ofarligt)
  !isPressConferenceRoute
```

**GameGuard.tsx rad 17–19:**
```ts
const shouldShowEventOverlay =
  attention.kind === 'event' &&
  priority === 'critical'
```

EventOverlay renderas BARA om `shouldShowEventOverlay`. ✅

**Interaktion med Granska (Fas 2):** `/game/review` är i `isMatchRoute`-blocket → EventOverlay suppressas under Granska. Kritiska events under Granska hanteras av GranskaOversikt (cap-3, inline). Konsekvent beteende, ingen konflikt.

---

## Teststatus

```
attentionRouter.test.ts  — finns, testar Steg 2/3-logik
portalEventSlot.test.ts  — finns, testar render-guards
```

Ej kört just nu — bygg-verifiering räcker för audit.

---

## Sammanfattning

| Del | Fil | Importerad i renderad komponent | Status |
|-----|-----|-------------------------------|--------|
| `attentionRouter` | `src/domain/services/attentionRouter.ts` | GameShell, GameGuard, PortalEventSlot, AppRouter | ✅ LEVERERAD |
| `eventQueueService` | `src/domain/services/eventQueueService.ts` | attentionRouter, EventOverlay, PortalEventSlot | ✅ LEVERERAD |
| `MAX_ATMOSPHERIC_PER_ROUND=2` | `roundProcessor.ts` rad 987 | (enforced i roundProcessor vid event-generering) | ✅ LEVERERAD |
| `eventActions` | `src/domain/services/eventActions.ts` | EventCardInline | ✅ LEVERERAD |
| `EventCardInline` | `src/presentation/components/portal/EventCardInline.tsx` | PortalEventSlot | ✅ LEVERERAD |
| `PortalEventSlot` | `src/presentation/components/portal/PortalEventSlot.tsx` | PortalScreen rad 152 | ✅ LEVERERAD |
| Overlay bara för critical | `GameShell.tsx` + `GameGuard.tsx` | (renderas som komponent i GameShell-trädet) | ✅ LEVERERAD |

**Slutsats: Steg 1-3 är faktiskt levererade.** Alla services importeras i renderade komponenter. Overlay-logiken är live. Inga falskdeklarationer identifierade.

**Steg 4 är inte längre blockerat av Steg 1-3-status.** Kvarstående block per kvar_audit:
1. Granska + Shotmap playtestade av Jacob ← ej klart än
2. Process-fix A/B/C/D på plats ← A (🔄/✅-distinktion), D (import-trace) levererade; B (pixel-audit) och C (⚠️-sweep vid sessionsstart) är process-disciplin, ej kod
