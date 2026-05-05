# Sprint Granska (Fas 2) — Audit 2026-05-05

Process-fix D: import-trace från fil till render för varje del.
Verifierad mot faktisk källkod, inte minne.

---

## 1. granskaEventClassifier — importkedjor

**Fil:** `src/domain/services/granskaEventClassifier.ts`

| Import | I vilken fil | Rad | Vad som importeras |
|--------|-------------|-----|-------------------|
| ✅ | `GranskaOversikt.tsx` | 12 | `getCriticalEventsForGranska`, `getPlayerEventsForGranska`, `classifyEventNature` |
| ✅ | `GranskaSpelare.tsx` | 9 | `classifyEventNature` |
| ✅ | `GranskaScreen.tsx` | 7 | `getCriticalEventsForGranska` |
| ✅ | `ReaktionerKort.tsx` | 3 | `getReactionEventsForGranska` |

Alla fyra importörer verifierade mot faktisk filinnehåll.

---

## 2. ReaktionerKort — parent → child → props

**Fil:** `src/presentation/components/granska/ReaktionerKort.tsx`

**Importerad i:** `GranskaOversikt.tsx` rad 13
```ts
import { ReaktionerKort } from '../../components/granska/ReaktionerKort'
```

**Renderad i:** `GranskaOversikt.tsx` rad 267
```tsx
<ReaktionerKort pendingEvents={pendingEvents} onResolve={onResolve} />
```

**Placering i renderingsordningen (GranskaOversikt):**
1. Resultat-hero
2. Statistik
3. Critical events (max 3) + hints
4. Presskonferens
5. Domarmöte
6. **← ReaktionerKort (här)**
7. Media
8. Nyckelmoment

**Props-kedja upp till rot:**

| Prop | Värde i GranskaOversikt | Källa i GranskaScreen |
|------|------------------------|----------------------|
| `pendingEvents` | `pendingEvents` (prop) | `game.pendingEvents ?? []` rad 124 |
| `onResolve` | `onResolve` (prop) | `handleResolveReactions` rad 133–136 |

`GranskaOversikt` renderas i `GranskaScreen` rad 163–184 när `step === 'oversikt'`.
`onResolve={handleResolveReactions}` — rad 183 ✅

**handleResolveReactions (GranskaScreen rad 133–136):**
```ts
function handleResolveReactions(ids: string[]) {
  setResolvedEventIds(prev => new Set([...prev, ...ids]))
  ids.forEach(id => resolveEvent(id, 'auto'))
}
```

⚠️ **RISK att verifiera vid playtest:** `resolveEvent` i `eventResolver.ts` rad 28–29:
```ts
const choice = event.choices.find(c => c.id === choiceId)
if (!choice) return game   // ← returnerar oförändrat spel om 'auto' inte finns i choices
```
För events med `choices.length === 0` (rad 21–26) tar resolver bort dem ur kön — OK.
För events med choices (t.ex. `supporterEvent` med `supporter_tifo_`-prefix) hittar inte
`'auto'` i `choices` → returnerar `game` oförändrat → event kvarstår i `pendingEvents`.
Lokalt i UI: `resolvedEventIds` sätts korrekt → visas inte igen under samma Granska-session.
Men vid nästa session: event är fortfarande i `pendingEvents` och dyker upp igen i ReaktionerKort.
**Kontrollera under playtest:** ser spillande reaction-events ut efter att man lämnat och
återkommit till Granska? Om ja: fix = hantera `'auto'` explicit i resolver eller verifiera
att alla REACTION_TYPES alltid genereras med `choices: []`.

---

## 3. Cap-3 — vilken array, hur filtrerad

**GranskaOversikt.tsx rad 141–142:**
```ts
const criticalEvents = getCriticalEventsForGranska(pendingEvents).slice(0, 3)
```

`getCriticalEventsForGranska` (classifier rad 68–70):
```ts
return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'critical')
```

Filtrerar på `e.resolved` (game store-fält), inte på lokal `resolvedEventIds`.
`.slice(0, 3)` tillämpas efter filtret → max 3 visas.

**Renderingscheck:** kritiska events renderas som egna `card-sharp`-divs rad 147–184
med `resolvedEventIds.has(event.id)` som villkor för ✓-vy vs val-vy.
De två resolved-kontrollerna är intentionellt olika:
- `getCriticalEventsForGranska` (rad 142): vilka visas i listan → game store-fält
- `resolvedEventIds.has()` (rad 148): hur de visas (✓ eller knappar) → lokal React-state

Optimistisk UI: spelaren klickar → checkmark syns direkt (lokal state),
game store uppdateras efter 600ms timeout. Fungerar korrekt.

---

## 4. "X spelarhändelser"-hint — räknaren

**GranskaOversikt.tsx rad 143:**
```ts
const playerEvents = getPlayerEventsForGranska(pendingEvents)
```

`getPlayerEventsForGranska` (classifier rad 75–77):
```ts
return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'player')
```

**Renderas rad 185–189:**
```tsx
{playerEvents.length > 0 && (
  <p ...>{playerEvents.length} spelar{playerEvents.length > 1 ? 'händelser' : 'händelse'} i Spelare-fliken</p>
)}
```

Räknaren minskar INTE direkt när Jacob löser player-events i Spelare-fliken under
samma session — den uppdateras när game store refreshar (efter 600ms). Ingen bug,
men Jacob kan se t.ex. "2 spelarhändelser" kvar i Översikt efter att han löst dem
i Spelare-fliken. Acceptabelt för playtest, potentiell UX-förbättring senare.

---

## 5. "X notiser i inboxen"-hint — räknaren

**GranskaOversikt.tsx rad 144:**
```ts
const inboxOnlyCount = pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'inbox-only').length
```

**Renderas rad 190–194:**
```tsx
{inboxOnlyCount > 0 && (
  <p ...>{inboxOnlyCount} notiser i inboxen</p>
)}
```

Räknar händelser som varken är critical, player eller reactions — dvs. allt
som faller igenom klassificeraren utan träff och saknar `priority: 'critical'`.

---

## 6. KRING SPELARNA — parent → child → props

**Fil:** `src/presentation/screens/granska/GranskaSpelare.tsx` rad 45–89

**Filteruttryck rad 45:**
```ts
const playerEvents = pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'player')
```

Använder `classifyEventNature` direkt (inte `getPlayerEventsForGranska`) — identiskt
resultat. Priority-override fungerar: en `hesitantPlayer` med `priority: 'critical'`
returnerar `'critical'` i klassificeraren → filtreras bort här ✓

**Props-kedja:**

| Prop | Renderas i GranskaScreen rad | Värde |
|------|------------------------------|-------|
| `pendingEvents` | 192 | `pendingEvents` (game.pendingEvents ?? []) |
| `resolvedEventIds` | 193 | lokal React-state |
| `chosenLabels` | 194 | lokal React-state |
| `onChoice` | 195 | `handleChoice` |

`GranskaSpelare` renderas rad 186–196 när `step === 'spelare'` ✅

**Renderas:** sektionen visas om `playerEvents.length > 0` (rad 49) — annars ingen tom
rubrik. Visar `choices` om de finns, inget val-UI om `choices.length === 0`.

---

## 7. unresolved-räknaren (CTA-blockering)

**GranskaScreen.tsx rad 154–157:**
```ts
const unresolvedCritical = getCriticalEventsForGranska(pendingEvents).filter(e => !resolvedEventIds.has(e.id)).length
const unresolvedPC = game.pendingPressConference && !resolvedEventIds.has(game.pendingPressConference.id) ? 1 : 0
const unresolvedRM = game.pendingRefereeMeeting && !resolvedEventIds.has(game.pendingRefereeMeeting.id) ? 1 : 0
const unresolved = unresolvedCritical + unresolvedPC + unresolvedRM
```

Räknar BARA critical + PC + domarmöte. Reactions, player-events och inbox-only
blockerar inte längre "KLAR — NÄSTA OMGÅNG". ✅

`unresolvedCritical` filtrerar på `!e.resolved` (game store) OCH `!resolvedEventIds.has(e.id)`
(lokal state) — dubbelfiltret gör att knappen direkt låses upp när spelaren klickar
ett val (lokal state sätts omedelbart), utan att vänta på de 600ms till game store. ✅

---

## 8. Kvarstående fynd att verifiera vid playtest

| # | Vad | Allvar |
|---|-----|--------|
| A | `resolveEvent(id, 'auto')` för events med choices → silent no-op → events kvarstår i pendingEvents efter session | Medium — dyker upp vid nästa Granska |
| B | Spelarhändelse-hinten i Översikt minskar inte live när Jacob löser events i Spelare-fliken | Låg — visuell fördröjning 600ms |
| C | `refereeMeeting` är i REACTION_TYPES men hanteras också separat som `game.pendingRefereeMeeting` — verifiera att domarmöte-events inte dubbeldyker upp | Medium |

---

## Sammanfattning

| Del | Status |
|-----|--------|
| granskaEventClassifier importerad i alla 4 konsumenter | ✅ verifierat |
| ReaktionerKort renderas i GranskaOversikt med rätt props | ✅ verifierat |
| Cap-3 tillämpas på `getCriticalEventsForGranska().slice(0, 3)` | ✅ verifierat |
| Spelarhändelse-hint räknar `getPlayerEventsForGranska().length` | ✅ verifierat |
| Inbox-hint räknar `inbox-only`-events | ✅ verifierat |
| KRING SPELARNA renderas med `classifyEventNature === 'player'` | ✅ verifierat |
| unresolved CTA räknar critical + PC + RM (inte reactions/player) | ✅ verifierat |
| `resolveEvent('auto')` — risk för events med choices | ⚠️ verifiera under playtest |
