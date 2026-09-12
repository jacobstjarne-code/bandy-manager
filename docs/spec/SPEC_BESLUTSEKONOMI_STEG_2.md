# SPEC_BESLUTSEKONOMI — Steg 2: Uppmärksamhets-router och prioritets-kö

**Datum:** 2026-04-30
**Författare:** Opus
**Status:** Levererad (Steg 2 implementerad 2026-04-30)

---

## NAMNRYMDS-MAPPNING: SPEC vs KOD

Spec (denna fil) använder tre prioritetsnivåer: `critical` / `medium` / `atmospheric`.
Koden (implementeringen) använder fyra nivåer: `critical` / `high` / `normal` / `low`.

Code fattade rätt beslut att behålla befintlig typning. Mappningen är:

| Spec (denna fil) | Kod (`EventPriority` i `GameEvent.ts`) |
|---|---|
| `critical` | `critical` |
| `medium` | `high` eller `normal` (beroende på event-typ) |
| `atmospheric` | `low` |

Steg 3-specen och framtida specar ska använda kodens fyra nivåer (`critical`/`high`/`normal`/`low`). Denna spec arkiveras men ändras inte.
**Beroende:** Diagnos-rapporten i `docs/diagnos/2026-04-30_beslutsekonomi.md` har bekräftat tre fynd som ändrar arkitekturen.

---

## VAD DIAGNOSEN ÄNDRADE

Min ursprungliga Steg 2-spec antog att vi bygger ett *nytt* kö-system. Det är fel. Verkligheten är:

1. **`pendingEvents` finns redan** som array på SaveGame. Allt vi behöver är prioritet och en ordning för visning.
2. **`currentMatchday` sätts aldrig** på SaveGame. Det är en fundamental bugg som måste fixas oavsett kö-arbete — den bryter scenes, kafferum-cooldowns, säsongssignaturer.
3. **Tre parallella uppmärksamhets-mekanismer** (`pendingScreen`, `pendingEvents`, `pendingScene`) konkurrerar utan koordinering. `EventOverlay` vinner alltid.

Det betyder att Steg 2 är **två saker**, inte ett:

**Del A:** Fundamentala buggfixar (currentMatchday, prioritets-koordinering)
**Del B:** Prioritetsfält på events + capacitering

Inga nya datatyper. Inga nya services. Bara *fixa det som redan finns* så det fungerar som det ska, plus prioritets-ordning på det befintliga.

---

## DEL A — UPPMÄRKSAMHETS-ROUTER

### A1. Fixa `currentMatchday`

**Problem:** `game.currentMatchday` finns som optional fält i SaveGame men sätts aldrig av roundProcessor. Alla triggers som läser det får `undefined ?? 0`.

**Fix:** I `roundProcessor.ts`, i det stora spread-objektet (rad 982-1099), lägg till:

```typescript
currentMatchday: nextMatchday,
```

…där `nextMatchday` är den matchday som just körts. Det är samma värde som redan beräknas i loopen.

**Tester att uppdatera:**
- Snapshot-tester på SaveGame som inte hade fältet
- Test som verifierar att `currentMatchday` ökar mellan rounds
- Test för `shouldTriggerSundayTraining` med `currentSeason: 1, currentMatchday: 1` returnerar `true`
- Test för `shouldTriggerSeasonSignature` med `currentMatchday: 1` returnerar `true`

**Migration:** Befintliga saves kan ha `currentMatchday = undefined`. Lägg en migration som sätter det till `Math.max(...completedFixtures.map(f => f.matchday), 0) + 1` eller `1` om inga fixtures är completed.

### A2. Uppmärksamhets-router — explicit prioritet

**Problem:** `pendingScreen`, `pendingEvents`, `pendingScene` koordineras inte. EventOverlay (mountad i GameShell) vinner alltid.

**Fix:** Ny pure function `getCurrentAttention(game): AttentionState`.

```typescript
// src/domain/services/attentionRouter.ts

export type AttentionState =
  | { kind: 'screen'; screen: PendingScreenId }    // BoardMeeting, PreSeason, etc.
  | { kind: 'scene'; sceneId: SceneId }            // SundayTraining, SeasonSignatureReveal, etc.
  | { kind: 'event'; event: PendingEvent }         // Nästa event att visa (ETT, inte alla)
  | { kind: 'idle' }                                // Inget pågår — Portal renderas

const PRIORITY_ORDER = [
  // 1. Hårda screen-skiften (säsongsslut, halvtid, board meeting) går först.
  //    Dessa har egna routes och måste hanteras.
  'screen',
  // 2. Scenes — narrativa nedslag som ska bryta tempo.
  //    Pausar event-flödet helt.
  'scene',
  // 3. Events — visas en åt gången enligt prioritet inom kön.
  'event',
] as const

export function getCurrentAttention(game: SaveGame): AttentionState {
  if (game.pendingScreen) return { kind: 'screen', screen: game.pendingScreen }
  if (game.pendingScene) return { kind: 'scene', sceneId: game.pendingScene.sceneId }

  const next = getNextEvent(game)  // se Del B nedan
  if (next) return { kind: 'event', event: next }

  return { kind: 'idle' }
}
```

**Konsumentändringar:**

`AppRouter.tsx` `DashboardOrPortal`-funktion ändras till:

```typescript
function DashboardOrPortal() {
  const game = useGameStore(s => s.game)
  if (!game) return <PortalScreen />

  const attention = getCurrentAttention(game)

  switch (attention.kind) {
    case 'screen':
      // useEffect navigerar till rätt screen baserat på pendingScreen-värdet
      return null  // navigation hanteras separat
    case 'scene':
      return <SceneScreen />
    case 'event':
      // Portal renderas men EventSlot visar attention.event
      return <PortalScreen />
    case 'idle':
      return <PortalScreen />
  }
}
```

`GameShell.tsx` ändrar `EventOverlay`-villkoret. Idag renderar den när `pendingEvents.length > 0` och route inte är match/review. Det måste ändras:

```typescript
// I GameShell.tsx
const game = useGameStore(s => s.game)
const attention = game ? getCurrentAttention(game) : { kind: 'idle' as const }

// EventOverlay ska INTE renderas om en scen väntar
// Den ska INTE heller spamma — bara visa nästa enligt prio
const shouldShowEventOverlay =
  attention.kind === 'event' &&
  !isMatchRoute &&  // existerande villkor
  !isReviewRoute &&
  !pressConferenceRoute

return (
  <>
    {/* ... existerande shell ... */}
    {shouldShowEventOverlay && <EventOverlay event={attention.event} />}
  </>
)
```

**EventOverlay-omskrivning:**

`EventOverlay` tar nu en *enskild event-prop* istället för att läsa hela `pendingEvents`. Den visar bara den event:en. När spelaren löser eventet → `resolvePendingEvent(eventId)` poppar det ur kön → router beräknar om nästa attention → om det fortfarande finns events visas nästa, om inte renderas Portal som vanligt.

**Tester:**
- `getCurrentAttention` returnerar `screen` när `pendingScreen` är satt, även om `pendingScene` också finns
- Returnerar `scene` när `pendingScene` är satt och `pendingScreen` är null, även om events finns
- Returnerar `event` med högsta prio från `pendingEvents` när inget annat väntar
- Returnerar `idle` när allt är tomt

### A3. SceneScreen får inte blockeras av EventOverlay

**Problem (bekräftad i diagnos):** EventOverlay täcker SceneScreen.

**Fix:** Med A2 ovanstående är detta löst — `shouldShowEventOverlay` returnerar `false` när `attention.kind === 'scene'`.

**Test:** Sätt manuellt `pendingScene: { sceneId: 'sunday_training', ... }` + en `pendingEvents`-array med 5 events. Verifiera att SceneScreen renderas och EventOverlay inte syns.

---

## DEL B — PRIORITETSFÄLT OCH KAPACITERING

### B1. Lägg till `priority` på `PendingEvent`

**Nuvarande:** `pendingEvents: PendingEvent[]` utan prioritetsfält. `EventOverlay` visar dem i array-ordning.

**Fix:** Lägg till `priority: EventPriority` på PendingEvent-typen.

```typescript
// src/domain/entities/Event.ts (eller motsvarande)

export type EventPriority = 'critical' | 'medium' | 'atmospheric'

export interface PendingEvent {
  // ... existerande fält
  priority: EventPriority
}
```

**Migration:** Befintliga events i pågående saves saknar fältet. Lägg en migration som klassificerar baserat på `type`:

```typescript
function classifyEventPriority(type: string): EventPriority {
  // Kritiska — kräver beslut, ofta deadline
  if (CRITICAL_TYPES.has(type)) return 'critical'
  // Atmosfäriska — orten, klacken, kafferum
  if (ATMOSPHERIC_TYPES.has(type)) return 'atmospheric'
  // Default: medium
  return 'medium'
}

const CRITICAL_TYPES = new Set([
  'pressConference',
  'transferBidReceived',
  'contractRequest',
  'patronEvent',           // patron-ultimatum
  'criticalEconomy',
  'mecenatWithdrawal',
  'riskySponsorOffer',
  'varsel',
  'bidWar',
  'playerArc',             // arcs är ofta beslutspunkter
])

const ATMOSPHERIC_TYPES = new Set([
  'communityEvent',
  'supporterEvent',
  'starPerformance',       // kvitteras
  'playerPraise',
  'playerMediaComment',
  'captainSpeech',
  'bandyLetter',
  'schoolAssignment',
  'journalistExclusive',
  'refereeMeeting',
  'hallDebate',
  'politicianEvent',
])

// Resten (playerUnhappy, dayJobConflict, hesitantPlayer, sponsorOffer,
// mecenatInteraction, mecenatEvent, economicStress, academyEvent,
// playoffEvent, retirementCeremony) → medium som default
```

### B2. `getNextEvent` — sortering och kapacitering

**Nytt service:** `eventQueueService.ts` med pure functions.

```typescript
// src/domain/services/eventQueueService.ts

import type { SaveGame } from '../entities/SaveGame'
import type { PendingEvent } from '../entities/Event'

const PRIORITY_RANK: Record<EventPriority, number> = {
  critical: 0,
  medium: 1,
  atmospheric: 2,
}

/**
 * Returnerar nästa event att visa, eller null om kön är tom.
 * Sorterar primärt på priority, sekundärt på array-ordning (FIFO inom prio).
 */
export function getNextEvent(game: SaveGame): PendingEvent | null {
  const events = game.pendingEvents ?? []
  if (events.length === 0) return null

  const sorted = [...events].sort((a, b) => {
    const ap = PRIORITY_RANK[a.priority] ?? PRIORITY_RANK.medium
    const bp = PRIORITY_RANK[b.priority] ?? PRIORITY_RANK.medium
    if (ap !== bp) return ap - bp
    // FIFO inom samma prio — första i arrayen först
    return events.indexOf(a) - events.indexOf(b)
  })

  return sorted[0]
}

/**
 * Statistik för Portal-visning: "X kritiska, Y notiser, Z bakgrundsröster"
 */
export function getQueueStats(game: SaveGame): QueueStats {
  const events = game.pendingEvents ?? []
  return {
    total: events.length,
    critical: events.filter(e => e.priority === 'critical').length,
    medium: events.filter(e => e.priority === 'medium').length,
    atmospheric: events.filter(e => e.priority === 'atmospheric').length,
  }
}
```

**Tester:**
- Tom kö → null
- En kritisk + två atmosfäriska → kritisk visas först
- Tre med samma prio → första i arrayen först (FIFO)
- Stats summerar korrekt

### B3. Capping per round — atmosfäriska events får inte spamma

**Problem:** Diagnosen visar 30-80 events per säsong. Många är atmosfäriska (community, supporter, hall debate, politiker, kafferum-relaterat). De fyller kön och försenar kritiska.

**Fix:** Lägg ett **per-round-cap på atmosfäriska events** under generering. Inte ett globalt cap — ett *fönster*.

I `roundProcessor.ts`, efter alla event-generators körts:

```typescript
// src/application/useCases/roundProcessor.ts

const MAX_ATMOSPHERIC_PER_ROUND = 2

// Efter att alla event-generators körts och pendingEvents är samlat:
const newAtmospheric = newlyGeneratedEvents.filter(e => e.priority === 'atmospheric')
const otherEvents = newlyGeneratedEvents.filter(e => e.priority !== 'atmospheric')

// Ta max 2 atmosfäriska denna round, resten droppas eller flyttas till inbox
const keptAtmospheric = newAtmospheric.slice(0, MAX_ATMOSPHERIC_PER_ROUND)
const droppedAtmospheric = newAtmospheric.slice(MAX_ATMOSPHERIC_PER_ROUND)

// Droppade atmosfäriska går till inboxen som notis (inte borta — bara inte i kön)
const dropAsInbox = droppedAtmospheric.map(convertToInboxItem)
```

**Princip:** Atmosfäriska events är inte mindre viktiga än andra — men de *ska inte tränga sig före* när kön redan har många. Två per omgång är gott om plats för kafferumsskvaller och ortens röster. Resten dokumenteras i inboxen.

**Konfigurerbart:** Konstanten är medvetet i toppen av filen så vi kan justera baserat på playtest-feedback. 2 är en startgissning.

**Inget cap på kritiska eller medium.** De är redan begränsade av sin egen genereringslogik (max 2 transferbud per round, max 1 patron-event etc).

### B4. Inboxen får alla events, inte bara de som visas

**Princip från diagnosen:** Inboxen är dokumentation. Allt som händer ska finnas där, även om det inte visas som overlay.

**Fix:** I event-genereringen, parallellt med `pendingEvents.push(event)`, lägg till `inbox.push(convertToInboxNotice(event))` för atmosfäriska events. Kritiska och medium har redan sin egen inbox-spårning genom de befintliga inbox-systemen.

Detta säkerställer att även events som droppades pga cap (B3) finns dokumenterade.

---

## VAD DETTA INTE ÄR

- **Inte ett nytt eventQueue-fält.** Vi använder befintliga `pendingEvents`.
- **Inte en omskrivning av event-genereringen.** Bara prioritetsfält + cap.
- **Inte en filtrering bort av atmosfäriska events.** De når spelaren — antingen via Portal eller via inboxen.
- **Inte en garanti att spelaren ser alla events i overlay-form.** Men alla finns kvar i inboxen.

---

## VERIFIERINGSPROTOKOLL

Efter Steg 2 levererat, Code:

1. Spelar genom säsong 1 omg 1-3 i webbläsare
2. Skärmdump efter cup R1: hur många events visas i overlay-flödet? (Förväntat: bara 1 åt gången, max 3-5 totalt innan Portal renderas)
3. Skärmdump: Söndagsträning-scenen ska trigga någon gång under omg 1-2
4. Skärmdump: SeasonSignature-reveal ska trigga vid omg 1 om signatur != calm_season
5. 2-3 meningar: känns det mer hanterbart? Hittar du fortfarande events i inboxen som inte visades som overlay?

Inga pixel-jämförelser denna gång — det är arkitektur, inte UI-design.

---

## LEVERANSORDNING INOM STEG 2

1. **A1 — currentMatchday-fix.** Liten, fundamental, ingen ny logik. ~1h.
2. **A2 — uppmärksamhets-router.** Ny service + ändringar i AppRouter och GameShell. ~3-4h.
3. **A3 — verifiera scene-prio.** Mest tester. ~1h.
4. **B1 — priority-fält + migration.** ~2h.
5. **B2 — getNextEvent.** Pure service, lätt att testa. ~1h.
6. **B3 — capping per round.** ~2h.
7. **B4 — inbox parallellt.** ~1h.

Total uppskattning: 1-1.5 dag Code-arbete.

**Stopp efter Steg 2** för Jacobs playtest. Om kön känns hanterbar — vi går till Steg 3 (Portal-slot för rikare event-presentation). Om något fortfarande skaver — vi pivoterar.

---

Slut.
