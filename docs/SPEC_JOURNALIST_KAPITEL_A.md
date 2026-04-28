# SPEC_JOURNALIST_KAPITEL_A — Synliggör journalist-relationen

**Datum:** 2026-04-28
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~5-7 dagars Code-arbete
**Referensmocks:** `docs/mockups/journalist_card_mockup.html` (Opus producerar separat innan Code påbörjar)
**Beroende:** Förutsätter att Portal-Fas-1 är levererad (vilket den är — alla 16 kort bekräftade på plats 2026-04-28)

**Mocken klar:** Ja — `docs/mockups/journalist_card_mockup.html`

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/journalist_card_mockup.html` i webbläsaren.** Klicka mellan de fyra tillstånd (Portal kylig, Portal varm, Scen kylig, Scen varm). Notera hur kortet sitter som secondary i Portal-gridden, och hur scenen tar fullskärm när man klickar på kortet.

2. **Läs `src/domain/services/journalistService.ts` i sin helhet.** Datan finns redan — `Journalist.relationship` (0-100), `Journalist.memory[]`, `recordInteraction`, `getJournalistTone`. Vi bygger inte logik. Vi bygger synlighet.

3. **Läs `src/domain/entities/SaveGame.ts`** och hitta hur `Journalist` lagras. Det är en property på SaveGame (singular — en journalist per spelare/lokaltidning).

4. **Läs CLAUDE.md princip 4 (Mock-driven design)** och pixel-jämförelse-reglerna. De gäller varje visuell komponent i denna sprint.

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

`docs/mockups/journalist_card_mockup.html` är referens. Klicka mellan fyra tillstånd: Portal med kylig relation, Portal med varm relation, fulla scenen kylig, fulla scenen varm. Kopiera CSS-värden bokstavligen.

**Komponentkoppling till mock-vyer:**

| Komponent | Mock-referens |
|---|---|
| `JournalistSecondary` (Portal-kort) | Knappen "Portal · kylig relation" eller "Portal · varm relation" — specifikt `.journalist-secondary`-elementet |
| `JournalistRelationshipScene` (orkestrator) | Knappen "Scen · kylig (28)" eller "Scen · varm (78)" — hela `.scene-frame` |
| `SceneRelationBar` (intern del av scenen) | `.scene-relation` med label, track, fill, status |
| `MemoryEntry` (intern del av scenen) | `.memory-entry` med dot + summary + when |
| `SceneOutlook` (intern del av scenen) | `.scene-outlook` med pil-prefix |

**Specifikt från mocken som ska kopieras bokstavligen:**

*Portal-kort (JournalistSecondary):*
- Cardbakgrund `var(--bg-surface)`, border `1px solid var(--border)`, border-radius 10px, padding 11px 12px
- Vänster border-stripe: `border-left: 2px solid var(--cold)` eller `var(--warm)` baserat på severity
- Namn: Georgia 12px 600, `var(--text-light)`, ellipsis vid överflow
- Tag: 8px 700 uppercase, letter-spacing 1.5px, padding 2px 6px, border-radius 3px. Två varianter — cold (blue) och warm (gold). Se `.js-tag.cold` / `.js-tag.warm` för exakta färger.
- Senaste-rad: 10px italic, `var(--text-muted)`, line-height 1.4
- Relations-stapel: 3px höjd, `var(--bg-dark)` track, fill `var(--cold)` eller `var(--warm)`, siffra 9px Georgia

*Scen (JournalistRelationshipScene):*
- Bakgrund `var(--bg-deepdark)`
- Genre-tag: letter-spacing 4px, opacity 0.7, padding 18px 0 8px, `var(--accent)`
- Namn: Georgia 28px 700, `var(--text-light)`
- Outlet: Georgia 13px italic, `var(--text-light-secondary)`
- Relations-stapel: 6px höjd, gradient (cold: `linear-gradient(90deg, #4a6680 0%, #6080a0 100%)`, warm: `linear-gradient(90deg, #8c6e3a 0%, #c8a058 100%)`)
- Memory-entry: padding 10px 0, border-bottom `1px solid var(--border-dark)` utom sista. Dot 8×8 med margin-top 6px. Summary Georgia 13px, when 10px muted.
- Outlook: padding 14px 24px 18px, border-top, bakgrund `var(--bg-leather)`, Georgia 13px italic. Prefix "⟶ " i `var(--accent)` ej italic.
- CTA: padding 14px, bakgrund `var(--bg-dark-elevated)`, samma som SceneCTA i andra scener.

**Innan commit av en visuell komponent:**
- Öppna mocken och appen sida vid sida i 430px-bredd
- Skärmdumpa båda
- Bifoga i commit-meddelandet
- Sammanfattning i SPRINT_AUDIT.md

---

## Mål

Gör journalisten **synlig som karaktär** i UI utan att överlasta dashboarden. Tre principer:

1. **Inget nytt djup.** All logik finns redan i `journalistService.ts`. Vi exponerar bara det som finns.
2. **Diskret närvaro, dramatisk när det krävs.** Vid neutral relation: minimal närvaro. Vid extrema värden (≤30 eller ≥70): diskret kort i Portal. Vid relationsbrott (≤20): inbox-event från journalisten själv.
3. **Klubbens röst i media.** Vid stark relation (>70) påverkas klubbens publik och stämning positivt — det är *känt* att journalisten skriver positivt.

---

## Designval (bekräftade)

| Fråga | Beslut | Motivation |
|---|---|---|
| Var bor journalisten i Portal? | Som secondary-kort i bagen | Mindre framträdande än primary, men synlig när relation är extremvärde |
| När visas kortet? | Bara när `relationship ≤ 30` ELLER `relationship ≥ 70` | Vid neutral relation (~31-69) är journalisten "bara där" — inget kort behövs |
| Klick på kortet? | Öppnar `JournalistRelationshipScene` (en Scene) | Detaljvyn är en Scene, inte en sub-route — använder etablerad infrastruktur |
| Relationsbrott (≤20)? | Inbox-event från journalisten | "Karin Bergström skriver: 'Jag har försökt nå er i två veckor.'" |
| Stark relation (>70)? | Positiv effekt: +10% publiktillströmning hemmamatcher, +1 ortens stämning per omgång | Konkret mekanik som spelaren märker |
| Existerande funktion `generateCriticalArticle` (efter 3 refusals)? | Behåll oförändrad | Den är redan en bra synlighetsmekanism |

---

## Arkitekturprinciper

### Princip 1: Ingen ny journalist-data

`Journalist`-typen i SaveGame ändras inte. Alla nya features läser från befintliga fält (`relationship`, `memory`, `pressRefusals`, etc).

### Princip 2: Pure functions för synlighetsregler

`shouldShowJournalistCard(game) → boolean` och `getJournalistCardSeverity(game) → 'cold' | 'warm' | 'hidden'` är pure functions. Testbara isolerat.

### Princip 3: Effekter går via befintliga services

"Stark relation ger +10% publik" implementeras genom att modifiera ett *befintligt* attendance-anrop, inte genom ny attendance-service. Samma för "ortens stämning".

### Princip 4: JournalistRelationshipScene är en Scene

Inte en sub-route under ClubScreen. Inte en modal. En Scene som öppnas via samma mekanism som söndagsträningen — `pendingScene`-state. Spelaren läser, stänger via CTA, tillbaka till Portal.

Skäl: konsekvent UX-vokabulär. Vi har redan etablerat scener som "viktiga uppslag som tar fokus". Journalist-relation är ett sådant uppslag.

### Princip 5: Inbox-events är trigger-styrda, inte tidsbestämda

Inbox-events från journalisten triggas vid *gränsöverskridande* relations-värden — inte vid varje omgång. När `relationship` korsar 20 nedåt → ett event. När det korsar 75 uppåt → ett event. Inte regelbundet, bara vid övergångar.

---

## Dataarkitektur

### Filer som ska skapas

#### `src/domain/services/journalistVisibilityService.ts`

Pure functions för att avgöra synlighet och triggers.

```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { Journalist } from '../entities/SaveGame'

export type JournalistCardSeverity = 'cold' | 'warm' | 'hidden'

/**
 * Returnerar severity-klass för Portal-kort.
 * 'hidden' = kortet visas inte alls
 * 'cold'   = kortet visas med kall stämning (relationship ≤ 30)
 * 'warm'   = kortet visas med varm stämning (relationship ≥ 70)
 */
export function getJournalistCardSeverity(game: SaveGame): JournalistCardSeverity {
  const j = game.journalist
  if (!j) return 'hidden'
  if (j.relationship <= 30) return 'cold'
  if (j.relationship >= 70) return 'warm'
  return 'hidden'
}

export function shouldShowJournalistCard(game: SaveGame): boolean {
  return getJournalistCardSeverity(game) !== 'hidden'
}

/**
 * Avgör om en relations-gräns har korsats sedan föregående omgång.
 * Använder game.journalist.lastTriggeredRelationship för att inte trigga upprepat.
 *
 * Returnerar event-typ eller null.
 */
export type RelationshipEventType =
  | 'broken_under_20'      // relationship sjunkit under 20
  | 'recovered_above_75'   // relationship stigit över 75
  | null

export function detectRelationshipEvent(game: SaveGame): RelationshipEventType {
  // Implementation
}

/**
 * Returnerar publik-modifierare baserat på relation.
 * Anropas från befintlig attendance-beräkning vid hemmamatch.
 *
 * relationship ≥ 70 → 1.10 (+10%)
 * relationship ≤ 30 → 0.95 (-5%)
 * Annars              → 1.0
 */
export function getJournalistAttendanceModifier(game: SaveGame): number {
  // Implementation
}

/**
 * Returnerar bygdens-puls-modifierare per omgång baserat på relation.
 * Anropas från community-puls-beräkning.
 *
 * relationship ≥ 70 → +1
 * relationship ≤ 30 → -1
 * Annars              → 0
 */
export function getJournalistCommunityModifier(game: SaveGame): number {
  // Implementation
}
```

**Krav:**
- Pure functions, inga side effects
- Filen max ~100 rader
- Tester: minst 6 fall per funktion (gränsfall + extremer + hidden)

#### `src/domain/data/scenes/journalistRelationshipScene.ts`

Datafil för Scene-vyn. Ingen logik här — bara texter och layout-data.

```typescript
import type { Journalist } from '../../entities/SaveGame'

export interface JournalistRelationshipSceneData {
  greeting: string           // "Karin Bergström, Lokaltidningen"
  status: string             // "Kylig. Hon ringer mer sällan nu."
  recentInteractions: Array<{
    matchday: number
    season: number
    summary: string          // "Vägrade presskonferens"
    sentiment: 'positive' | 'neutral' | 'negative'
  }>
  outlook: string            // "Tre presskonferenser till med ärligt svar — då vänder det."
}

/**
 * Bygger scen-data från journalist-state.
 * Mappar memory[] till människoläsbara summary-strängar.
 *
 * VIKTIGT: Idag loggas BARA tre event-strängar i journalistService:
 *   - 'refused_press'  (sentiment -8)
 *   - 'good_answer'    (sentiment +3)
 *   - 'bad_answer'     (sentiment -3)
 *
 * EVENT_TO_SUMMARY mappar bara dessa tre. Att introducera fler
 * event-typer (storseger-intervju, derby-intervju, transfer-respons)
 * är Fas 2-arbete och kräver att recordInteraction-anrop läggs till
 * i mechanics-lagret. INGEN sådan utökning sker i denna sprint.
 *
 * Sentiment härleds från memory[i].sentiment-värdet (numeriskt):
 *   sentiment > 0   → 'positive'
 *   sentiment === 0 → 'neutral'
 *   sentiment < 0   → 'negative'
 */
export function buildJournalistSceneData(journalist: Journalist): JournalistRelationshipSceneData {
  // Implementation: tolka memory[]-events till svenska summaries via EVENT_TO_SUMMARY
}

const EVENT_TO_SUMMARY: Record<string, string> = {
  'refused_press': 'Vägrade presskonferens',
  'good_answer':   'Svarade ärligt på presskon',
  'bad_answer':    'Undvek frågan på presskon',
}

/**
 * Outlook-text per relations-band. Hårdkodad — inga template-engines.
 */
function getOutlookText(relationship: number): string {
  if (relationship >= 75) return 'Stark relation. Lokaltidningens rubriker drar upp orten — fortsätt prata med henne.'
  if (relationship >= 50) return 'Stabil relation. Hon hör av sig regelbundet.'
  if (relationship >= 30) return 'Sval. Två-tre presskonferenser till med ärligt svar — då vänder det.'
  return 'Kylig. Hon har slutat ringa. Bryt isen själv om ni vill ha henne tillbaka.'
}

/**
 * Status-text per relations-band.
 */
function getStatusText(relationship: number): string {
  if (relationship >= 75) return 'Varm. Hon skriver om er nästan varje vecka.'
  if (relationship >= 50) return 'Stabil. Hon hör av sig när det händer något.'
  if (relationship >= 30) return 'Sval. Hon ringer mer sällan nu.'
  return 'Kylig. Hon har slutat höra av sig.'
}
```

**Krav:**
- All svensk text lever i denna fil
- Ingen referens till React eller komponenter
- Filen max ~80 rader (mindre än tidigare estimat — vi mappar bara 3 events)
- Inga "event-typer som kanske finns i framtiden" — bara verifierat existerande

#### `src/presentation/screens/scenes/JournalistRelationshipScene.tsx`

Ny scen-komponent. ~140 rader.

Renderar:
- SceneHeader med "I DETTA ÖGONBLICK" + journalistens namn + outlet
- Status-block med relation-stapel (visualisering 0-100, färgad efter severity)
- Senaste 5 interaktioner som lista (datum + summary + sentiment-prick)
- Outlook-text längst ner
- SceneCTA "Tillbaka till klubben"

#### `src/presentation/components/portal/secondary/JournalistSecondary.tsx`

Portal-kort. ~80 rader.

Renderar:
- "📰 [Journalistens namn]" som titel
- Severity-tag ("Kylig" eller "Varm")
- En rad om senaste interaktion ("Senast: vägrade derby-kommentar")
- Klick → triggar `pendingScene = 'journalist_relationship'`

### Filer som ska modifieras

#### `src/domain/entities/SaveGame.ts`

Lägg till på Journalist:

```typescript
interface Journalist {
  // befintliga fält...
  lastTriggeredRelationship?: number  // för att inte trigga inbox-event upprepat
}
```

Lägg till på Scene-typer:

```typescript
export type SceneId =
  | 'sunday_training'
  | 'sm_final_victory'
  | 'coffee_room'
  | 'journalist_relationship'   // NY
```

#### `src/domain/services/portal/dashboardCardBag.ts`

Lägg till nytt secondary-kort:

```typescript
{
  id: 'journalist_card',
  tier: 'secondary',
  weight: 65,                            // mellan opponentForm (60) och openBids (80)
  triggers: [shouldShowJournalistCard],  // pure function från journalistVisibilityService
  Component: JournalistSecondary,
}
```

#### `src/domain/services/sceneTriggerService.ts`

Lägg till case för 'journalist_relationship'. Men **denna scen triggas inte automatiskt** — bara via spelarens klick på Portal-kortet. Så `detectSceneTrigger` ska INTE returnera den. Den sätts via store-action när kortet klickas.

#### `src/application/useCases/roundProcessor.ts`

Efter att alla andra processors körts — anropa `detectRelationshipEvent`. Om event → skicka inbox-meddelande från journalisten:

```typescript
const relEvent = detectRelationshipEvent(game)
if (relEvent === 'broken_under_20') {
  game.inbox.push(createBrokenRelationshipInboxItem(game))
  if (game.journalist) game.journalist.lastTriggeredRelationship = game.journalist.relationship
}
if (relEvent === 'recovered_above_75') {
  game.inbox.push(createRecoveredRelationshipInboxItem(game))
  if (game.journalist) game.journalist.lastTriggeredRelationship = game.journalist.relationship
}
```

#### Befintliga services som modifieras med 1-2 rader var

Två integration-punkter där journalisten faktiskt påverkar mekanik:

**Attendance** — i den service som beräknar publik vid hemmamatch (sannolikt `economyService.calcRoundIncome` eller motsvarande):

```typescript
import { getJournalistAttendanceModifier } from './journalistVisibilityService'

// Innan return:
const attendance = baseAttendance * weatherMod * formMod * getJournalistAttendanceModifier(game)
```

**Community-puls** — i den service som beräknar bygdens puls per omgång (sannolikt `communityService` eller motsvarande):

```typescript
import { getJournalistCommunityModifier } from './journalistVisibilityService'

// I beräkningen:
const newPulse = currentPulse + matchResultMod + getJournalistCommunityModifier(game)
```

Code identifierar exakta integration-punkter och bekräftar med Opus innan ändring.

---

## Skärmflöde

### När Portal renderas
1. `dashboardCardBag` har ett nytt kort `journalist_card` med trigger `shouldShowJournalistCard`
2. `portalBuilder` filtrerar bagen — om relation är 31-69 är kortet "hidden", inte i layouten
3. Vid extremvärde renderar `JournalistSecondary` med rätt severity ("Kylig" eller "Varm")

### När spelaren klickar kortet
1. `JournalistSecondary` sätter `game.pendingScene = { sceneId: 'journalist_relationship', triggeredAt: ... }`
2. Router ser pendingScene → renderar `SceneScreen`
3. `SceneScreen` switch:ar på sceneId → `JournalistRelationshipScene`
4. Scenen visar relation, historik, outlook
5. Klick "Tillbaka" → `pendingScene = undefined` → tillbaka till Portal

### När relation korsar gräns
1. `roundProcessor` avslutar omgång
2. `detectRelationshipEvent(game)` returnerar 'broken_under_20' eller 'recovered_above_75'
3. Inbox-meddelande från journalisten skapas och pushas
4. `lastTriggeredRelationship` uppdateras så samma event inte triggar nästa omgång

---

## Inbox-text — Opus skriver, Code lägger in

**Vid relations-brott (`broken_under_20`):**

```
Title: Karin Bergström, Lokaltidningen
Body: "Jag har försökt nå er i två veckor. Min chefredaktör börjar undra. Det går rykten i orten — och jag är den som ska skriva om dem. Hör av er innan veckan är slut."
```

**Vid återhämtad relation (`recovered_above_75`):**

```
Title: Karin Bergström, Lokaltidningen  
Body: "Tack för intervjun igår. Det märktes att ni var ärliga. Jag tänkte ringa om ett uppslag — kan vi prata?"
```

Texterna är hårdkodade som konstanter i en datafil eller direkt i journalistVisibilityService. Ingen template-engine i Fas 1.

---

## Visuell design (preliminär)

`docs/mockups/journalist_card_mockup.html` är referens när den är klar. Riktning:

**JournalistSecondary (Portal-kort):**
- Mörk bakgrund (Portal-token: `--bg-portal-surface`)
- Vänsterställd: 📰-emoji + journalistens namn (Georgia 14px)
- Högerställd: severity-tag — "KYLIG" (röd) eller "VARM" (gul/grön)
- Andra rad: senaste interaktion i italic, `--text-muted`

**JournalistRelationshipScene:**
- Fullskärm scen, mörk bakgrund (Scene-token: `--bg-deepdark`)
- "I DETTA ÖGONBLICK" genre-tag
- Stort namn: "Karin Bergström" Georgia 28px
- Outlet underrad: "Lokaltidningen" Georgia 13px italic
- Relations-stapel: 0-100, färgad gradient (röd → orange → grön)
- Lista: senaste 5 memory-entries med datum, summary, sentiment-prick
- Outlook-rad: "Tre presskonferenser till — då vänder det."
- CTA: "Tillbaka till klubben"

---

## Tester

- `journalistVisibilityService.test.ts` — alla pure functions, 6+ fall per funktion
- `JournalistRelationshipScene.test.tsx` — renderar med olika relation-värden
- `JournalistSecondary.test.tsx` — kortet visas/visas inte korrekt
- Integration: `roundProcessor.test.ts` — inbox-event triggas vid gränsöverskridande, inte vid stabilt extremvärde

---

## Verifieringsprotokoll

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger** — `grep -rn '#[0-9a-fA-F]' src/presentation/components/portal/secondary/JournalistSecondary.tsx src/presentation/screens/scenes/JournalistRelationshipScene.tsx` returnerar 0
3. **Filstorlekar** — alla nya filer under 150 rader
4. **PIXEL-JÄMFÖRELSE PER KOMPONENT — COMMIT-BLOCKER:**
   - **En komponent åt gången.** JournalistSecondary först → pixel-jämför mot mock → commit. Sen JournalistRelationshipScene → pixel-jämför → commit.
   - Skärmdumpar i commit-meddelandet
   - Sammanfattning i SPRINT_AUDIT.md
5. **CSS-token-disciplin på mörka komponenter:** Inga ljusa tokens (`--bg-elevated`, `--text-secondary`, `--border` utan dark-prefix) på mörk bakgrund.
6. **SPRINT_AUDIT.md** — verifierat i UI med pixel-jämförelse

---

## Vad som SKA INTE göras i Fas 1

- Ingen ny journalist-typ. En journalist per spelare som idag.
- Ingen template-engine för inbox-texter — hårdkodade strängar
- Ingen relation-graf över tid (visualisering av relations-historik som kurva) — bara senaste 5 interaktioner som lista
- Ingen multi-journalist (riks-press, Bandybladet, etc) — det är Fas 2
- Ingen koppling till `pressConferenceService` — den fungerar redan med relation, ingen ändring behövs
- Ingen ny relation-källa — bara visualisering av befintlig logik
- **Inga nya event-typer i `recordInteraction`-anrop.** Idag finns tre: `refused_press`, `good_answer`, `bad_answer`. Att lägga till fler (storseger-intervju, derby-respons, transfer-bekräftelse, akademi-uppmärksamhet etc) är Fas 2-arbete. Memory-listan i Scene-vyn kommer i Fas 1 visa upprepningar av samma tre — det är realistiskt och poängen blir att spelaren ser sitt eget *mönster*: "jag vägrade press tre gånger på fem omgångar, då kollapsade relationen".

---

## Återanvändning av befintliga komponenter — kritiskt

**Bygg INTE ny CTA-komponent.** Använd existerande `SceneCTA` från `src/presentation/screens/scenes/shared/SceneCTA.tsx`. Efter pixel-audit 2026-04-28 har den korrekta dark-tokens (`var(--bg-dark-elevated)`, `var(--text-light)`, `var(--border)`) som matchar mocken. Att bygga ny CTA är duplicering — och risk för token-drift.

**Bygg INTE ny SceneHeader.** Använd existerande `SceneHeader` från `shared/SceneHeader.tsx`. Den hanterar genre-tag ("⬩ I DETTA ÖGONBLICK ⬩") + huvudtitel + subtitle/outlet enligt etablerat scen-mönster.

**Verifiera att `--bg-leather` finns i `src/styles/global.css`.** Mocken använder denna token för outlook-blocket (mock-värde `#1f1a14`). Om den inte finns:
- Lägg till den i global.css under existerande dark-tokens
- ELLER byt mot existerande dark-token (t.ex. `--bg-dark`) om visuell skillnad är liten
- Bestäm i samråd med Opus innan implementation

**Verifiera att `--bg-scene` och `--bg-scene-deep` finns** (skapades i pixel-audit 2026-04-28). JournalistRelationshipScene ska använda `--bg-scene-deep` som bakgrund — samma som SMFinalVictoryScene — inte hårdkodad hex.

**Verifiera att `--cold` och `--warm` tokens finns för severity-färger.** Om inte:
- Lägg till `--cold: #4a6680` (kall blå)
- Lägg till `--warm: #8c6e3a` (varm guld)
- Dessa används både i Portal-kortets border-stripe + tag-färger, och i scenens gradient-stops

---

## Frågor till Code som ska besvaras innan implementation

1. **Var bor `Journalist` faktiskt på SaveGame?** Bekräfta sökväg (`game.journalist` vs `game.journalists` vs `game.community.journalist`).
2. **Vad heter den service som beräknar attendance vid hemmamatch?** Bekräfta integration-punkt för `getJournalistAttendanceModifier`.
3. **Vad heter den service som beräknar community-puls per omgång?** Bekräfta integration-punkt för `getJournalistCommunityModifier`.
4. **Memory-events som loggas idag** — lista alla event-strängar som `recordInteraction` anropas med, så Opus kan skriva EVENT_TO_SUMMARY-mappingen.

---

## Leverans-ordning rekommenderas

1. **Datatyp + entity** — utöka SceneId, lägg till `lastTriggeredRelationship`
2. **journalistVisibilityService.ts** med tester (utan UI)
3. **journalistRelationshipScene.ts** datafil med EVENT_TO_SUMMARY (Opus levererar mappingar efter Codes svar på fråga 4)
4. **Portal-kort** — JournalistSecondary mot mock, pixel-jämförelse
5. **Scen-komponent** — JournalistRelationshipScene mot mock, pixel-jämförelse
6. **Inbox-events** — broken/recovered-events, integration i roundProcessor
7. **Mekaniska effekter** — attendance + community modifiers
8. **Verifiering & SPRINT_AUDIT.md**

Steg 1-3 har ingen visuell output. Steg 4 är första tillfället att playtesta att kortet visas. Steg 5 är detaljvyn. Steg 6-7 är de mekaniska konsekvenserna.

---

## Slut SPEC_JOURNALIST_KAPITEL_A
