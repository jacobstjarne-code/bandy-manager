# SPEC_SCENES_FAS_1

**Datum:** 2026-04-27
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~6-8 dagars Code-arbete
**Referensmocks:** `docs/mockups/moments_mockup.html`
**Beroende:** Kan implementeras parallellt med Portal-Fas-1, men *bör* levereras efter Portal är fungerande (eftersom scenen ofta triggas från en Portal-knapp eller efter en Portal-action)

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/moments_mockup.html` i webbläsaren.** Klicka mellan "Söndagsträning" och "SM-guld". Notera anatomin: helsida, ingen BottomNav, "⬩ I DETTA ÖGONBLICK ⬩"-genre-tag, distinkt CSS för vardagsmoment vs payoff.

2. **Läs `docs/UX_OMTAENKNING_2026-04-27.md`** sektionen "Moments — I DETTA ÖGONBLICK". Det är där designtanken bakom scen-systemet bor.

3. **Läs `docs/SESSION_SUMMARY_2026-04-27.md`** sektionen om "Tidiga moments — etablering" + "Senare moments — payoff" för innehåll och scope.

4. **Notera namnvalet "Scene", inte "Moment"** — se nästa sektion.

---

## NAMNVAL: VARFÖR "SCENE" OCH INTE "MOMENT"

Det finns **redan** en typ `Moment` i `src/domain/entities/Moment.ts`. Den används för interna narrative-log-entries (derby_win, star_injury, season_highlight etc) som lever som rader i klubbens narrativ — inte fullskärms-vyer.

För att undvika namn-konflikt och otydlighet använder vi ordet **Scene** för det vi bygger:

- **Moment** (befintligt) = narrativ datapunkt i klubbens log. Ex: "akademispelarens första mål". Visas som text i log-vyer.
- **Scene** (nytt) = fullskärms-interaktiv upplevelse som bryter spel-loopen. Ex: söndagsträningen, SM-finalsdagen.

I konversation med Jacob har vi kallat dessa "moments" / "I detta ögonblick"-händelser. **Genre-taggen i UI är "I DETTA ÖGONBLICK"** — det är vad spelaren ser. **Datatypen i koden heter `Scene`** — det är vad utvecklaren skriver.

Detta är medveten skillnad mellan vad spelaren ser och vad koden kallar saken. Varför? För att Moment redan är upptaget och vi inte vill omdöpa det (välspridd användning), och för att "Scene" är ett bättre tekniskt namn (matchar dramaturgi-traditionen Suzerain/CK3 följer).

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

Mocken (`moments_mockup.html`) är specifikationen för hur scenerna ska se ut visuellt. Kopiera CSS-värden bokstavligen.

**Komponentkoppling till mock-vyer:**

| Komponent | Mock-referens |
|---|---|
| `SceneScreen` (orkestrering) | Hela ramen i mocken — fullskärm, ingen BottomNav |
| `SceneHeader` | "⬩ I DETTA ÖGONBLICK ⬩"-bandet + titel + datum |
| `SceneChoiceButton` | Val-knapparna i söndagsträning-scenen |
| `SundayTrainingScene` | Knappen "🌅 Söndagsträning" i mocken |
| `SMFinalVictoryScene` | Knappen "🏆 SM-guld" i mocken |

**Innan commit av en visuell komponent:**
- Öppna mocken och appen sida vid sida i 430px-bredd
- Skärmdumpa båda
- Bifoga i SPRINT_AUDIT.md
- Beskriv eventuella avvikelser och varför de finns

---

## Mål

Bygg infrastrukturen för **Scene-systemet** — fullskärms-vyer som bryter spel-loopen och tar över skärmen tills spelaren tagit beslut eller tryckt CTA. Implementera **två konkreta scener** som verifierar arkitekturen:

1. **Söndagsträningen** (M2 från moment-listan) — vardagsmoment, sex spelare på isen, fyra val
2. **SM-finalsegern** (payoff-scen) — visas efter att spelaren vinner SM-finalen, callback till tidigare scener

**Tre principer:**

1. **Scene tar över hela skärmen.** Ingen BottomNav, ingen header, ingen flykt. Spelaren håller kvar tills beslut tagits eller CTA tryckts.

2. **Scen är data + komponent.** Datan (text, val, effekter) lever i datafiler. Komponenten är generisk när det går, specifik när det krävs (för CSS-nyans).

3. **Triggers är frikopplade från komponenter.** En `sceneTriggerService` avgör vid `roundProcessor`-end om en scen ska triggas. Spelet sätter `pendingScene`-state och Portal-router visar scenen.

---

## Arkitekturprinciper (kritiska)

### Princip 1: Scene-systemet är frikopplat från Portal

Scene kan triggas från flera ställen — efter match, vid omgångsövergång, vid säsongsstart, från ett klick på något i Portal. Portal är *en* trigger-källa, inte den enda. Scene-systemet ska kunna leva helt utan Portal.

### Princip 2: Triggers är pure functions

`sceneTriggerService` exponerar funktioner som `(game: SaveGame) => Scene | null`. Returnerar antingen en scen som ska visas eller null. Inga side effects. Spelet sätter sedan `pendingScene` på saven baserat på returvärdet.

### Princip 3: Scene-komponenter får game som prop, inte store

Scenerna ska kunna testas isolerat. Inga `useGameStore`-anrop inuti SceneComponents. State flödar in som prop, callbacks flödar ut.

### Princip 4: En scen = en fil

Varje konkret scen är sin egen fil. `SundayTrainingScene.tsx`. `SMFinalVictoryScene.tsx`. Inte uppdelat i micro-komponenter — en scen är en helsida och äger sin egen layout.

### Princip 5: Scene-data lever i datafiler

Texter, val, effekter härleds från `src/domain/data/scenes/*.ts`. Scen-komponenterna är *renderare* av denna data. Detta gör att Opus kan iterera på texter utan att Code rör koden.

### Princip 6: Scene-systemet använder samma feature flag som Portal

`game.scenesEnabled` (eller motsvarande). Default `false` under utveckling. Aktiveras manuellt tills stabilt.

---

## Dataarkitektur

### Filer som ska skapas

#### `src/domain/entities/Scene.ts`

Typdefinitionen för en scen.

```typescript
export type SceneId =
  | 'sunday_training'        // M2 — söndagsträningen
  | 'sm_final_victory'       // payoff efter SM-guld
  // (fler tillkommer i Fas 2)

export type SceneTrigger =
  | { kind: 'first_round_of_season' }
  | { kind: 'sm_final_won' }
  | { kind: 'matchday_reached', matchday: number }
  // (fler tillkommer i Fas 2)

export interface SceneChoice {
  id: string
  label: string                  // knapptext
  effectDescription?: string     // mindre text under knapptext, ex: "Bygger relation"
  // Effekten själv ligger i datafilen, inte här — separation av definition och konsekvens
}

export interface PendingScene {
  sceneId: SceneId
  triggeredAt: string  // ISO date — för debugging och spara-ordning
}
```

**Krav:**
- Filen ska inte vara över ~50 rader
- Inga referenser till React-komponenter (entitet är pure data)

#### `src/domain/data/scenes/sundayTrainingScene.ts`

Datan för söndagsträningen.

```typescript
export const SUNDAY_TRAINING_PLAYERS = [
  { initial: 'H', name: 'Henriksson', text: 'skrinnar varv. <em>"Han kommer alltid först,"</em> säger Vaktmästaren. <em>"Han började åtta i morse."</em>' },
  { initial: 'L', name: 'Lindberg', text: 'står på läktaren och pratar i telefonen. <em>Han har inte ens skridskorna på.</em>' },
  { initial: 'A', name: 'Andersson, Eriksson, Karlsson', text: 'skjuter på mål utan målvakt. <em>De skrattar varje gång någon träffar stolpen.</em>' },
  { initial: 'B', name: 'Bergström', text: 'sitter på avbytarbänken. Fryser. <em>Mössan ner över ögonen.</em>' },
]

export const SUNDAY_TRAINING_CHOICES = [
  { id: 'greet_henriksson', label: 'Gå ut och säg hej till Henriksson', effectDescription: 'Bygger relation till en lojal spelare' },
  { id: 'disturb_lindberg', label: 'Stör Lindberg', effectDescription: 'Sätter ton — men på vilket sätt?' },
  { id: 'ask_bergstrom', label: 'Fråga Bergström varför han sitter där', effectDescription: 'Lyssna in' },
  { id: 'leave_alone', label: 'Lämna dem i fred. Kaffe i klubbhuset.', effectDescription: 'Ingen tar ton första dagen' },
]

export const SUNDAY_TRAINING_META = {
  title: 'Söndagsträningen',
  date: '4 oktober · −2°C · {arena}',  // {arena} ersätts med klubbens arena vid render
  headline: 'Sex spelare på isen.',
  subtitle: 'Ingen tvingad. Frivillig morgonpass.',
}
```

**Notering om `{arena}`:** Vid render ersätter Code denna placeholder med klubbens arenanamn från `worldGenerator.ts`. Detta gör att samma scen funkar för alla klubbar utan att data-filen är klubbspecifik.

**Krav:**
- All svensk text lever i denna fil — inget hårdkodat i komponent
- Inga personnamn utanför "Henriksson, Lindberg, Andersson, Eriksson, Karlsson, Bergström" (generiska efternamn som finns i `playerNames.ts`)

#### `src/domain/data/scenes/smFinalVictoryScene.ts`

Datan för SM-finalsegern.

```typescript
export const SM_FINAL_VICTORY_TEMPLATES = {
  // Mall — placeholders ersätts vid render baserat på matchdata
  bodyText: 'Henriksson satte avgörande målet i 87:e. Samme Henriksson som kom upp från P19 säsongen {promotionSeason}. Som du gick ut till på söndagsträningen den där höstmorgonen <em>{yearsAgo} år sedan</em>.',

  // Birger-citat — slumpas från en pool
  birgerQuotes: [
    {
      quote: 'Jag sa det till Birgitta i pausen, jag sa: det här är vår final. Den minns vi när vi är gamla. Och då hade vi inte ens kvitterat än.',
      attribution: 'Birger Karlsson, klackledare',
    },
    {
      quote: 'Förr i tiden sa man att det inte gick att slå storstaden. Sen kom du.',
      attribution: 'Birger Karlsson, klackledare',
    },
    {
      quote: 'Jag har hängt på den där läktaren i 22 år. Idag fattar jag varför jag aldrig slutade.',
      attribution: 'Birger Karlsson, klackledare',
    },
  ],

  meta: {
    genreLabel: 'I DETTA ÖGONBLICK',
    titleText: 'Svensk Mästare {season}',  // {season} ersätts vid render
    dateText: 'Tredje lördagen i mars · {finalArena}',  // {finalArena} = "Studenternas IP"
    arenaCapacity: '25 412 ÅSKÅDARE',  // hämtas från fixturedata istället i implementation
    cta: 'Fortsätt till ceremonin →',
  },
}
```

**Notering om dynamisk text:** Den centrala texten ska callbacka till en *specifik* spelare (akademispelare som värvades och nu satte avgörande målet). Texten genereras vid render genom att hämta data från:
- `fixture.report.playerOfTheMatchId` eller motsvarande
- Spelarens `careerStats.promotedFromAcademy` flag
- Spelarens `narrativeLog`
- Säsongsräknaren

Om ingen sådan callback finns (spelaren har inte en akademispelare-historia) — fallback till generisk text. Detta är "moments som spelet kommer ihåg"-mekaniken (THE_BOMB Kapitel B i embryon).

#### `src/domain/services/sceneTriggerService.ts`

Service som avgör om en scen ska triggas.

```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { SceneId } from '../entities/Scene'

/**
 * Avgör om en scen ska triggas för aktuellt game-state.
 * Returnerar scenId att visa, eller null om ingen scen ska triggas.
 *
 * Kallas av roundProcessor efter att en omgång processats.
 * Pure function — inga side effects, inga store-anrop.
 */
export function detectSceneTrigger(game: SaveGame): SceneId | null {
  // Söndagsträningen: omgång 1, första gången spelaren visar dashboard efter intro
  if (shouldTriggerSundayTraining(game)) return 'sunday_training'

  // SM-finalseger: efter att fixture med isFinaldag=true vunnits
  if (shouldTriggerSMFinalVictory(game)) return 'sm_final_victory'

  return null
}

function shouldTriggerSundayTraining(game: SaveGame): boolean {
  // Implementation: kontrollerar om
  //  - säsong 1, första omgången
  //  - INTE redan visad (game.shownScenes flagga)
  //  - inte i en pågående annan scen
}

function shouldTriggerSMFinalVictory(game: SaveGame): boolean {
  // Implementation: kontrollerar om
  //  - senaste fixture är isFinaldag=true
  //  - managed klubb vann
  //  - INTE redan visad
}
```

**Krav:**
- Pure function — testbar utan UI
- Tester: minst 4 game-states verifierar trigger-logiken (positiva + negativa fall)
- Filen ska inte vara över ~80 rader

### Filer som ska skapas — Komponenter

```
src/presentation/screens/scenes/
├── SceneScreen.tsx                  (~80 rader, orkestrator — bestämmer vilken scen som renderas)
├── SundayTrainingScene.tsx          (~120 rader, hela söndagsträning-vyn)
├── SMFinalVictoryScene.tsx          (~140 rader, hela SM-final-vyn)
│
└── shared/
    ├── SceneHeader.tsx              (~50 rader, "⬩ I DETTA ÖGONBLICK ⬩" + titel)
    ├── SceneChoiceButton.tsx        (~40 rader, val-knapp med effect-text)
    └── SceneCTA.tsx                 (~30 rader, primär CTA i botten)
```

**Krav:**
- Inga filer över 150 rader
- Scen-komponenter får game som prop + onComplete-callback
- Scen-komponenter får INTE använda useGameStore direkt
- Scen-komponenter får INTE känna till andra scen-komponenter

### Filer som ska modifieras

#### `src/domain/entities/SaveGame.ts`

Lägg till `pendingScene` och `shownScenes`:

```typescript
interface SaveGame {
  // ... befintliga fält
  pendingScene?: PendingScene   // satt av sceneTriggerService, plockas av PortalScreen
  shownScenes?: SceneId[]       // historik så att vi inte triggar samma scen igen
  scenesEnabled?: boolean       // feature flag
}
```

#### `src/application/useCases/roundProcessor.ts`

Efter att alla andra processors körts — anropa `detectSceneTrigger`. Om en scen returneras, sätt `game.pendingScene`. Sker INNAN `applyPostRoundFlags`.

```typescript
// I slutet av processRound, innan return:
if (game.scenesEnabled) {
  const sceneId = detectSceneTrigger(game)
  if (sceneId && !game.shownScenes?.includes(sceneId)) {
    game.pendingScene = { sceneId, triggeredAt: game.currentDate }
  }
}
```

#### Router

I `AppRouter.tsx` (eller motsvarande) — när `game.pendingScene` är satt, visa `SceneScreen` istället för normal route. När scenen completes (spelaren tar beslut/CTA), rensa `pendingScene` och lägg sceneId i `shownScenes`.

Exakt routing-pattern bestäms av Code utifrån befintlig router-struktur. Krav:
- BottomNav göms när scen är aktiv
- Scen tar hela viewport
- Inga andra routes nås så länge scen är aktiv

---

## Skärmflöde

### När scen triggas

```
roundProcessor avslutar
    ↓
detectSceneTrigger() returnerar 'sunday_training'
    ↓
game.pendingScene = { sceneId: 'sunday_training', ... }
    ↓
Spelaren öppnar Portal
    ↓
Portal/Router ser pendingScene → renderar SceneScreen istället
    ↓
SceneScreen renderar SundayTrainingScene baserat på sceneId
    ↓
Spelaren klickar val
    ↓
onComplete callback → game.pendingScene = undefined, game.shownScenes.push('sunday_training')
    ↓
Tillbaka till Portal
```

### SceneScreen-orkestrering

```tsx
// SceneScreen.tsx (~80 rader)
export function SceneScreen() {
  const game = useGameStore(s => s.game)
  const completeScene = useGameStore(s => s.completeScene)

  if (!game?.pendingScene) {
    // Edge case: navigeras till SceneScreen utan pending scen
    return <Navigate to="/game" replace />
  }

  const handleComplete = (choiceId?: string) => {
    completeScene(game.pendingScene.sceneId, choiceId)
  }

  switch (game.pendingScene.sceneId) {
    case 'sunday_training':
      return <SundayTrainingScene game={game} onComplete={handleComplete} />
    case 'sm_final_victory':
      return <SMFinalVictoryScene game={game} onComplete={handleComplete} />
  }
}
```

---

## Effekter av val (söndagsträningen)

Söndagsträningen har fyra val. För Fas 1 är effekterna **subtila** — vi etablerar mekaniken, inte en stor konsekvens-träd. Effekten är att lagra valet i game-state så att senare scener/dashbpoard kan referera ("Du gick ut till Henriksson på söndagsträningen").

```typescript
// När spelaren väljer 'greet_henriksson':
//   - lagra i game.sceneChoices: { 'sunday_training': 'greet_henriksson' }
//   - INGEN stat-modifikation just nu (det kommer i senare faser när vi har Henriksson som faktisk player-id i klubben)

// När spelaren väljer 'disturb_lindberg':
//   - lagra valet
//   - subtil opinion-skift mot Lindberg (-1 lojalitet eller motsvarande)

// Etc.
```

Effekterna implementeras som en separat "scene effects"-funktion som tar valet och game-state och returnerar uppdaterad game-state.

**OBS:** Henriksson, Lindberg, Bergström i söndagsträningen är *narrativa karaktärer*, inte specifika player-id i klubbens trupp. Det är medvetet — scenen är samma för alla klubbar. Spelarens trupp har andra namn. Detta är en *abstraktion*, inte en bugg. Om vi senare vill koppla till faktiska spelare måste vi göra det explicit.

---

## Visuell design

`docs/mockups/moments_mockup.html` är referens. Två distinkta visuella stilar:

**Söndagsträningen (vardagsmoment):**
- Mörk bakgrund med snöpartiklar (CSS-animation, ~18 stycken)
- "⬩ I DETTA ÖGONBLICK ⬩" som genre-tag, accent-färg, 70% opacitet
- Georgia 28px för titel "Söndagsträningen"
- Spelarlistan med 28×28px cirkel-initial + Georgia-text-rad
- Val-knappar med backdrop-blur, accent-arrow, effect-text under

**SM-finalsegern (payoff):**
- Djup-mörk bakgrund med gyllene konfetti (CSS-animation, ~30 stycken)
- "⬩ I DETTA ÖGONBLICK ⬩" som genre-tag, accent-färg
- 🏆-emoji 72px med pulserande glöd-animation
- Score 64px Georgia 800
- Birger-citat med vänster-border i guld
- CTA-knapp med gradient-bakgrund, gyllene shadow

**Animationer:**
- Snö: `animation: snowfall linear infinite` (5-10 sekunder per partikel)
- Konfetti: `animation: fall linear infinite` (4-8 sekunder per partikel, rotation 720deg)
- Trofé: `animation: trophyglow 3s ease-in-out infinite` (drop-shadow blink)

Alla CSS-värden finns i mocken — kopiera bokstavligen.

---

## Tester

### Unit-tester

- `sceneTriggerService.test.ts`
  - Verifierar att söndagsträningen triggar omg 1 säsong 1, EJ omg 2
  - Verifierar att SM-final-victory triggar efter vunnen final, EJ efter förlust
  - Verifierar att shownScenes blockerar dubbel-trigger
  - Verifierar att två scener inte kan triggas samtidigt (deterministisk prio)

### Integration-tester

- `SceneScreen.test.tsx`
  - Renderar SundayTrainingScene när pendingScene är satt
  - Klick på val triggar onComplete med rätt choiceId
  - Klick på CTA i SM-final triggar onComplete utan choiceId

### Visuell verifiering (självaudit)

Efter implementation — i playtest:
- Starta nytt spel
- Spela första matchen (omgång 1)
- Avancera till omgång 2 → söndagsträningen triggas, fullskärm, ingen BottomNav
- Klick på "Gå ut och säg hej till Henriksson" → tillbaka till Portal, scenen är borta
- Verifiera att scenen INTE triggas igen vid omgång 3
- För SM-final: spela igenom hela säsong, vinn finalen → SM-final-scen triggas

---

## Verifieringsprotokoll

Innan sprint markeras klar:

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger** — `grep -rn '#[0-9a-fA-F]' src/presentation/screens/scenes/` returnerar 0
3. **Filstorlekar** — `wc -l src/presentation/screens/scenes/**/*.tsx` — ingen fil över 150 rader
4. **Filstorlekar service** — `wc -l src/domain/services/sceneTriggerService.ts src/domain/data/scenes/*.ts` — ingen fil över 150 rader
5. **Triggers är pure** — manuell granskning att ingen trigger gör store-anrop
6. **Scen-komponenter är ovetande om varandra** — `grep -rn 'SundayTraining\|SMFinalVictory' src/presentation/screens/scenes/` ska bara visa egen import, inte korsimporter
7. **PIXEL-VERIFIERING MOT MOCK** — för båda scenerna:
   - Öppna mocken i 430px-bredd
   - Öppna appen i samma bredd
   - Skärmdump av båda
   - Bifoga i SPRINT_AUDIT.md
   - Beskriv eventuella avvikelser
8. **SPRINT_AUDIT.md** — verifierat i UI enligt mall, med pixel-jämförelsen

---

## Vad som SKA INTE göras i Fas 1

- Övriga 4 tidiga moments (M1, M3, M4, M5, M6) implementeras inte — bara M2 (Söndagsträningen)
- Övriga payoff-scener (klubblegend-pension, klacken protesterar, etc) implementeras inte
- Lo-fi vektorgrafik för spelare i söndagsträningen — använd cirkel-initialer som mocken visar. Vektorgrafik är Erik-jobb och kommer senare.
- Ingen ljud-effekt
- Ingen kalendar-integration ("4 oktober" är hårdkodad text i meta — inte beräknad från faktiskt datum)
- Ingen koppling till THE_BOMB Kapitel A (manager-statements som journalisten kommer ihåg) — det är separat
- Ingen "skip"-knapp — scenen *ska* hålla kvar spelaren

---

## Beroenden mellan filer

```
SceneScreen.tsx
├── läser: game.pendingScene (useGameStore)
├── triggar: completeScene (useGameStore)
└── renderar: SundayTrainingScene ELLER SMFinalVictoryScene (baserat på sceneId)

SundayTrainingScene.tsx
├── tar emot: { game, onComplete } props
├── läser: SUNDAY_TRAINING_PLAYERS, SUNDAY_TRAINING_CHOICES, SUNDAY_TRAINING_META
└── använder: SceneHeader, SceneChoiceButton

SMFinalVictoryScene.tsx
├── tar emot: { game, onComplete } props
├── läser: SM_FINAL_VICTORY_TEMPLATES
├── läser: game.fixtures (för att hitta finalmatch + spelare som gjorde mål)
└── använder: SceneHeader, SceneCTA

sceneTriggerService.ts
├── läser: SaveGame (fixtures, currentSeason, currentMatchday, shownScenes)
└── exporterar: detectSceneTrigger()

roundProcessor.ts (modifierad)
├── använder: detectSceneTrigger()
└── sätter: game.pendingScene
```

---

## Frågor till Code som ska besvaras innan implementation startar

1. **Hur hanteras edge case att spelaren refresh:ar mid-scene?** Förslag: `pendingScene` lever i save-state, så scenen återupptas när appen laddas om. Spelaren är "fast" i scenen tills beslut tas.

2. **Vad händer om både söndagsträningen och en annan scen ska triggas samma omgång?** Förslag: deterministisk prio — bara en scen triggas per omgång. `detectSceneTrigger` returnerar första matchande. Om flera är aktuella samtidigt kommer de andra att triggas senare omgångar.

3. **Hur lagras spelarens val (`sceneChoices`)?** Förslag: `Record<SceneId, string>` på SaveGame. Lättviktigt, sökbart från andra services som vill referera ("vad valde du på söndagsträningen?").

4. **Ska SM-final-victory triggas även för spelaren som *förlorat* finalen?** Nej — bara vid seger. Vid förlust triggas inte denna scen i Fas 1. Förlust-scen är separat moment som inte ingår i denna spec.

---

## Leverans-ordning rekommenderas

Bygg i denna ordning:

1. **Datatyp + entity först** — `Scene.ts`, lägg till `pendingScene`/`shownScenes`/`scenesEnabled` i `SaveGame.ts`
2. **Trigger-service** — `sceneTriggerService.ts` med tester (utan att rendera UI)
3. **Datafiler** — `sundayTrainingScene.ts`, `smFinalVictoryScene.ts`
4. **Shared-komponenter** — `SceneHeader`, `SceneChoiceButton`, `SceneCTA`
5. **Söndagsträning-scenen** — `SundayTrainingScene.tsx` med pixel-verifiering
6. **SM-final-scenen** — `SMFinalVictoryScene.tsx` med pixel-verifiering
7. **SceneScreen-orkestrering** — koppla till router
8. **roundProcessor-integration** — hooka in trigger-detection
9. **store completeScene-action** — för att rensa pendingScene när spelaren tagit beslut
10. **Verifiering & SPRINT_AUDIT.md**

**Viktigt:** Steg 1-4 har ingen visuell output. Steg 5 är första gången scenen kan ses i appen. Det betyder att Code kan ta 1-4 utan att Jacob playtestar — och sedan i steg 5 göra pixel-verifiering mot mocken innan committ.

---

## Slut SPEC_SCENES_FAS_1
