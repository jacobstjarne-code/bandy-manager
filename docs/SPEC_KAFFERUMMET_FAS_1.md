# SPEC_KAFFERUMMET_FAS_1

**Datum:** 2026-04-27
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~5-7 dagars Code-arbete
**Referensmocks:** `docs/mockups/kafferummet_mockup.html` (Opus producerar separat innan Code påbörjar)
**Beroende:** Förutsätter att SPEC_SCENES_FAS_1 är levererad och fungerande (Scene-infrastrukturen återanvänds)

**Mocken klar:** Ja — `docs/mockups/kafferummet_mockup.html`

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/kafferummet_mockup.html` i webbläsaren.** Klicka mellan de tre scenarios (1 utbyte, 2 utbyten, 3 utbyten). Notera triadisk struktur — alla utbyten handlar om en frånvarande tredje part eller är generella (utan specifikt subjekt).

2. **Läs `docs/SPEC_SCENES_FAS_1.md` i sin helhet.** Kafferummet är en *Scene* enligt det systemet. Du måste förstå hur Scene-arkitekturen ser ut innan du börjar.

3. **Läs `src/domain/services/coffeeRoomService.ts` i sin helhet.** Datan finns redan där — inte bygg om logiken, packetera om presentationen.

4. **Läs avsnittet "Skvallrets fyra funktioner" nedan.** Det är inte dekoration — det är design-grunden för hur scenen ska kännas.

---

## Skvallrets fyra funktioner — designgrund

Kafferummets dialog ska respektera de fyra etablerade funktionerna av skvaller (Foster, 2004; bekräftat i flera arbetsplats-studier):

| Funktion | I Kafferummet | Exempel |
|---|---|---|
| **Information** | Det officiella systemet säger inte allt. Funktionärerna fyller i. | "Hörde att Lesjöfors fick stryk i fullmäktige." "Av vem?" "Alla." |
| **Underhållning** | Roligheten är inte tillägg, den är poängen. Lakonisk svensk humor. | "Tre klubbor gick sönder igår." "Beställ fem. Det blir kallt i veckan." |
| **Vänskap/intimitet** | Funktionärerna *känner* varandra. Replikerna funkar för att historien finns. | "Du säger det varje dag." |
| **Inflytande / norm** | Vem sköter sig, vem inte. Klubbens värden förhandlas i kaffekoppen. | "Han ringde inte ens." "Bara mejl?" "Bara mejl." |

**Valens varierar** — skvaller är inte alltid negativt. Positiva utbyten (akademispelare som lyser, klacken som växer) ska blandas med negativa (sponsorer som krånglar, motståndare som klantar sig).

**Triadisk struktur** — alla utbyten har två talare som diskuterar en *frånvarande tredje part*. Det är poängen. Spelaren är inte deltagare utan tjuvlyssnare.

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

`docs/mockups/kafferummet_mockup.html` är referens. Klicka mellan tre tillstånd: 1 utbyte, 2 utbyten, 3 utbyten. Kopiera CSS-värden bokstavligen.

**Komponentkoppling till mock-vyer:**

| Komponent | Mock-referens |
|---|---|
| `CoffeeRoomScene` (orkestrator) | Hela ramen i mocken — fullskärm, ingen BottomNav |
| `SceneHeader` (återanvänds) | "⬩ I DETTA ÖGONBLICK ⬩"-bandet + kaffe-emoji + titel + subtitle |
| `CoffeeExchange` | Ett enskilt utbyte i mocken — inkluderar A-talare (vänster), B-talare (höger), eventuell follow-up |
| `Speaker-row` (intern del av CoffeeExchange) | Avatar + speaker-name + speech-text |
| `ExchangeSeparator` (intern) | Den smala mittlinjen mellan utbyten |
| `SceneCTA` (återanvänds) | "Tillbaka till klubben"-knappen i botten |

**Specifikt från mocken som ska kopieras bokstavligen:**

- Avatar: 32×32px cirkel, `var(--bg-elevated)` bakgrund, `var(--border)` border, Georgia 13px för initialen
- Speaker-name: 9px, uppercase, letter-spacing 1.5px, `var(--text-muted)`
- Speech-text: Georgia 13px italic, line-height 1.5, `var(--text-secondary)`, omsluts av citationstecken via `::before`/`::after`
- Subjekt-markering (frånvarande tredje part): icke-italic, `var(--text-light)`, `border-bottom: 1px dotted var(--text-muted)`
- Exchange-separator: 30% bredd, `var(--border-dark)`, opacity 0.5, centrerad
- Animationsfördröjning: 0.2s, 1.0s, 1.8s för utbyte 1, 2, 3 (fadeIn 0.6s)
- Genre-tag: letter-spacing 4px, opacity 0.7, padding 18px 0 8px
- Slätet-bord-textur via radial gradients (se `.phone::before` i mockens CSS)

**Innan commit av en visuell komponent:**
- Öppna mocken och appen sida vid sida i 430px-bredd
- Skärmdumpa båda
- Bifoga i SPRINT_AUDIT.md
- Beskriv eventuella avvikelser och varför de finns

---

## Mål

Bygg om kafferummet från **text-rad i Portal-CTA** till **fullskärms-dialog-scen** via Scene-systemet. Tre principer:

1. **Kafferummet är en Scene.** Använder samma infrastruktur som SundayTrainingScene och SMFinalVictoryScene. Triggas, fyller skärmen, spelaren stänger via CTA, tillbaka till Portal.

2. **Dialogen är triadisk och respekterar de fyra funktionerna.** Innehållet finns redan i `coffeeRoomService.ts`. Vi packeterar om presentationen, inte logiken.

3. **Kafferummet kommer till spelaren, inte tvärtom.** Det triggas av game-state — när det finns något värt att skvallra om. Spelaren kan *också* välja att gå dit via ett Portal-kort, men default är att scenen kommer fram av sig själv vid relevanta tillfällen.

---

## Designval (bekräftade)

| Fråga | Beslut | Motivation |
|---|---|---|
| Plats i UX | Scene (fullskärm via Scene-systemet) | Bryter spel-loopen, känns som ett *nedslag*, inte ännu en informationsvy |
| Triggermekanism | Hybrid: auto-trigger vid game-state-händelser, plus ett Portal-kort | Auto-trigger för det som *spelaren ska veta*, kort för spelarens autonomi |
| Återanvänd existerande data? | Ja — `coffeeRoomService.ts` är källan | Datan är redan dialogisk och triadisk; rebuilding hade gett halvfärdig redundans |
| Visualisering av karaktärer | Cirkel-initialer som söndagsträningen | Konsekvent med Scene-systemets etablerade vokabulär; vektorgrafik kommer senare |
| Hur många utbyten per scen? | 1-3 (slumpmässigt 1, 2 eller 3) | För kort = inte värt scen-formatet; för långt = tråkigt |
| Stänga scenen | CTA "Tillbaka till klubben" eller motsvarande | Konsekvent med andra Scene-typer |
| Är kafferum-scenen "shown" en gång och sen aldrig igen? | Nej — det är en *återkommande* scen-typ | Skvaller händer hela tiden; en flagga per "shown" är fel modell |

---

## Arkitekturprinciper (kritiska)

### Princip 1: Kafferummet är inte ett unikt scen-system

Det är *en* Scene, samma som SundayTrainingScene. Det betyder att vi inte bygger ny infrastruktur för det — vi lägger till en ny `SceneId` och en ny komponent.

### Princip 2: Återanvändning över rebuilding

`coffeeRoomService.ts` har redan all logik för vilket utbyte som ska visas. Det enda som ändras är att `getCoffeeRoomQuote` (singular) blir `getCoffeeRoomScene` (plural — returnerar 1-3 utbyten i en scen).

### Princip 3: Triggers är pure functions

Som alla Scene-triggers — `(game: SaveGame) => boolean` eller `(game) => SceneId | null`.

### Princip 4: Kafferummets shownScenes-flagga är annorlunda

Andra scener (söndagsträningen, SM-final) triggas en gång och flaggas i `shownScenes`. Kafferummet är *återkommande* — det triggas regelbundet och har ingen permanent shown-flagga. Istället har vi `lastCoffeeSceneRound` på SaveGame som sätts när scenen visas, och triggern återkommer först när N omgångar gått sedan dess.

### Princip 5: Portal-kortet är en *secondary* trigger

Default är auto-trigger. Portal-kortet finns som en sidoväg — när spelaren själv vill kolla in vad som diskuteras. Kortet existerar bara när `getCoffeeRoomScene(game)` returnerar något (dvs. det finns något att visa).

### Princip 6: Inga tomma kafferum

Om `coffeeRoomService` inte returnerar något (omgång 0, eller inga relevanta triggers) — visa inte scenen och visa inte kortet. Vi bygger aldrig en "tom" upplevelse.

---

## Dataarkitektur

### Filer som ska modifieras

#### `src/domain/services/coffeeRoomService.ts`

Lägg till en ny exporterad funktion:

```typescript
export interface CoffeeScene {
  exchanges: CoffeeQuote[]   // 1-3 utbyten i en scen
  meta: {
    title: string             // "Kafferummet" eller variant
    subtitle?: string         // ev. tidskontextualisering
  }
}

/**
 * Returnerar en hel kafferum-scen med 1-3 utbyten, eller null om
 * det inte finns något att visa just nu.
 *
 * Återanvänder den befintliga getCoffeeRoomQuote-logiken
 * men slumpar 1-3 olika utbyten med olika seed-multiplikatorer
 * så vi får variation inom samma scen.
 */
export function getCoffeeRoomScene(game: SaveGame): CoffeeScene | null {
  // Implementation:
  // 1. Anropa getCoffeeRoomQuote(game) för första utbytet
  // 2. Om null → returnera null (ingen scen)
  // 3. Annars: slumpa 1-3 utbyten med varierande seed
  // 4. Säkerställ att alla utbyten är distinkta (inga dubbletter)
}
```

**Krav:**
- Bevarar bakåtkompatibilitet — `getCoffeeRoomQuote` finns kvar oförändrad
- Filen växer max ~50 rader för den nya funktionen
- Tester: minst 3 game-states verifierar att rätt antal utbyten returneras

#### `src/domain/entities/Scene.ts`

Lägg till ny SceneId:

```typescript
export type SceneId =
  | 'sunday_training'
  | 'sm_final_victory'
  | 'coffee_room'              // NY
```

Och lägg till på SaveGame:

```typescript
interface SaveGame {
  // befintliga + från SCENES-spec:
  pendingScene?: PendingScene
  shownScenes?: SceneId[]
  scenesEnabled?: boolean

  // NYA för kafferummet:
  lastCoffeeSceneRound?: number  // omgång då senaste kafferums-scen visades
}
```

#### `src/domain/services/sceneTriggerService.ts`

Lägg till en ny trigger-funktion. Auto-trigger-logiken är **subtil** — kafferummet ska inte trigga för ofta, men ska trigga när något viktigt händer.

```typescript
export function detectSceneTrigger(game: SaveGame): SceneId | null {
  // Befintlig prioritet (söndagsträning, SM-final) går först

  if (shouldTriggerCoffeeRoom(game)) return 'coffee_room'

  return null
}

function shouldTriggerCoffeeRoom(game: SaveGame): boolean {
  // Kontrollerar om:
  //  1. Det finns något att skvallra om (getCoffeeRoomScene returnerar inte null)
  //  2. Det är minst 3 omgångar sedan senaste kafferums-scen
  //  3. ELLER: Det finns en *tung trigger* (skandal, transferdeadline-vecka, vunnen derby) som override:ar 3-omgångs-cooldownen
}
```

**Krav:**
- Pure function
- Tester: minst 5 fall (cooldown, tung trigger override, ingen data, första omgången, etc)

### Filer som ska skapas

#### `src/presentation/screens/scenes/CoffeeRoomScene.tsx`

Ny scen-komponent. ~150 rader (precis under gränsen).

```tsx
interface CoffeeRoomSceneProps {
  game: SaveGame
  onComplete: () => void
}

export function CoffeeRoomScene({ game, onComplete }: CoffeeRoomSceneProps) {
  const scene = useMemo(() => getCoffeeRoomScene(game), [game])
  if (!scene) {
    onComplete()
    return null
  }

  return (
    <SceneContainer>
      <SceneHeader genre="I DETTA ÖGONBLICK" title="Kafferummet" subtitle={scene.meta.subtitle} />

      <div className="coffee-exchanges">
        {scene.exchanges.map((exchange, i) => (
          <CoffeeExchange key={i} exchange={exchange} delay={i * 600} />
        ))}
      </div>

      <SceneCTA onClick={onComplete} label="Tillbaka till klubben" />
    </SceneContainer>
  )
}
```

#### `src/presentation/screens/scenes/shared/CoffeeExchange.tsx`

Komponent för ett enskilt utbyte. ~80 rader.

Renderar två talare (cirkel-initial + namn + replik) med visuell separation. Animeras in efter `delay`-prop så scenen får en lugn, dialogisk takt.

#### Portal-integration

Lägg till ett nytt kort i `dashboardCardBag.ts`:

```typescript
{
  id: 'coffee_room_card',
  tier: 'secondary',
  weight: 60,
  triggers: [hasCoffeeRoomContent],
  Component: CoffeeRoomSecondary,
}
```

Plus trigger-funktionen `hasCoffeeRoomContent(game) => boolean` som returnerar true om `getCoffeeRoomScene(game) !== null`.

`CoffeeRoomSecondary.tsx` är ett enkelt secondary-kort med "☕ Kafferummet" + förhandsvisning av första utbytet (en rad), klick → sätter `game.pendingScene = { sceneId: 'coffee_room', ... }`.

### Filer som ska modifieras (forts)

#### `src/application/useCases/roundProcessor.ts`

Den befintliga sektionen som anropar `detectSceneTrigger` täcker redan kafferummet — eftersom kafferummet är en SceneId. När scenen visas ska `lastCoffeeSceneRound` sättas. Detta görs i store-actionen `completeScene` (eller motsvarande) — när `sceneId === 'coffee_room'` uppdateras `lastCoffeeSceneRound` istället för att lägga den i `shownScenes`.

#### Borttagning av nuvarande kafferums-rad i DashboardScreen / Portal

När Portal är aktiv (feature flag `portalEnabled`) visas inte den gamla kafferums-raden i CTA-sektionen. Den raden i `DashboardScreen.tsx` (sökord: `getCoffeeRoomQuote`) blir villkorad:

```tsx
{!game.portalEnabled && (
  <CoffeeRoomLine quote={getCoffeeRoomQuote(game)} />
)}
```

Eller — om DashboardScreen tas bort i Portal-Fas-1 — försvinner den helt.

---

## Skärmflöde

### När kafferums-scenen triggas

```
roundProcessor avslutar
    ↓
detectSceneTrigger() returnerar 'coffee_room' (om alla villkor uppfyllda)
    ↓
game.pendingScene = { sceneId: 'coffee_room', ... }
    ↓
Spelaren öppnar Portal
    ↓
Router ser pendingScene → renderar SceneScreen
    ↓
SceneScreen renderar CoffeeRoomScene baserat på sceneId
    ↓
Scenen visar 1-3 utbyten med tidsfördröjd inmatning
    ↓
Spelaren läser, klickar "Tillbaka till klubben"
    ↓
onComplete callback:
  - game.pendingScene = undefined
  - game.lastCoffeeSceneRound = currentRound
  - INTE i shownScenes (det är återkommande)
    ↓
Tillbaka till Portal
```

### När spelaren själv klickar Portal-kortet

```
Portal renderar CoffeeRoomSecondary
    ↓
Spelaren klickar
    ↓
game.pendingScene = { sceneId: 'coffee_room', ... }
    ↓
SceneScreen tar över → samma flöde som ovan
```

---

## Triggers — när visas kafferum-scenen?

### Cooldown-trigger (default)

Kafferummet auto-triggas efter:
- Minst 3 omgångar sedan senaste kafferums-scen (`lastCoffeeSceneRound`)
- `getCoffeeRoomScene(game)` returnerar inte null
- Inget annat med högre prio i kö (söndagsträning, SM-final, etc)

### Override-triggers (bryter cooldown)

Vissa game-state-händelser ska *alltid* trigga kafferum-scenen, oavsett cooldown:

| Trigger | När |
|---|---|
| Skandal i annan klubb | När en `scandalHistory`-entry kommit denna omgång |
| Transferdödline-vecka | Omgång 13-15, om det finns transfer-aktivitet |
| Stor seger/förlust | När matchresultatet är ≥3 mål från managed klubb (vinst eller förlust) |
| Pågående streak | Vinst- eller förlust-streak ≥3 matcher |
| Akademispelare-genombrott | När en akademispelare uppflyttats senaste omgången |

Override-listan är **inte** uttömmande — fler kan tillkomma i Fas 2 när vi ser vad som behövs i playtest. Men dessa är minimum för Fas 1.

---

## Visuell design (preliminär — fastläggs i mock)

Mocken kommer först. Men riktning:

**Layout:**
- Fullskärm, mörk bakgrund (samma som söndagsträning)
- Genre-tag "⬩ I DETTA ÖGONBLICK ⬩" överst
- Titel "Kafferummet" i Georgia 28px
- Subtitle (om relevant) i lättare typografi
- Mitten: 1-3 utbyten staplade vertikalt
- Botten: "Tillbaka till klubben"-CTA

**Per utbyte:**
- Två talare i horisontell layout
- Vänster: cirkel-initial + namn + replik
- Höger: cirkel-initial + namn + replik
- Visuell separation mellan talare (en tunn linje, eller bara whitespace)
- Animeras in från botten med fade + delay (600ms mellan utbyten)

**Atmosfär:**
- Kaffe-emoji ☕ någonstans subtilt (header eller hörn)
- Bakgrund kanske med svag textur som antyder slitet bord eller kaffeväggsfläck — *subtilt*, inte tematiskt skrikigt
- Inga ångpartiklar eller liknande — det är ett rum, inte en performance

CSS-värden kopieras från mocken när den är klar.

---

## Tester

### Unit-tester

- `coffeeRoomService.test.ts` (tillägg)
  - `getCoffeeRoomScene` returnerar 1-3 utbyten när data finns
  - Returnerar null när data saknas
  - Inga dubbletter inom samma scen
  - Deterministisk för samma seed

- `sceneTriggerService.test.ts` (tillägg)
  - `shouldTriggerCoffeeRoom` respekterar 3-omgångs-cooldown
  - Override-triggers bryter cooldown
  - Returnerar false när data saknas

### Integration-tester

- `CoffeeRoomScene.test.tsx`
  - Renderar 1, 2, 3 utbyten korrekt
  - Klick på CTA triggar onComplete
  - Visar inget om scene är null

### Visuell verifiering (självaudit)

- Spela 3 omgångar i playtest
- Verifiera att kafferum-scenen kommer upp av sig själv vid lämpligt tillfälle
- Verifiera att Portal-kortet visas när data finns
- Verifiera att override-triggers fungerar (skandal i annan klubb → scenen kommer upp samma omgång)

---

## Verifieringsprotokoll

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger** — `grep -rn '#[0-9a-fA-F]' src/presentation/screens/scenes/CoffeeRoomScene.tsx` returnerar 0
3. **Filstorlekar** — `wc -l` på alla nya filer — ingen över 150 rader
4. **`coffeeRoomService.ts` växer max ~50 rader** — verifiera att den nya funktionen återanvänder befintlig logik
5. **PIXEL-JÄMFÖRELSE PER KOMPONENT — COMMIT-BLOCKER** (uppdaterat 2026-04-27 efter Scene-leverans):
   - **En komponent åt gången.** Skriv komponent N → pixel-jämför mot mocken → bifoga skärmdump i commit-meddelandet → skriv komponent N+1.
   - INTE hela komponentträdet och sen verifiering i slutet.
   - För varje komponent (CoffeeRoomScene, CoffeeExchange, CoffeeRoomSecondary): öppna mocken i 430px, öppna appen i samma bredd, ta skärmdump av båda, bifoga i commit. Beskriv eventuella avvikelser.
6. **CSS-TOKEN-DISCIPLIN PÅ MÖRK BAKGRUND:** Kafferum-scenen är mörk. Inga ljusa tokens (`--bg-elevated`, `--text-secondary`, `--border` utan dark-prefix) på mörk bakgrund som default. Detta var det specifika fel som uppstod i Scene-leveransen — undvik det här.
7. **SPRINT_AUDIT.md** — verifierat i UI med pixel-jämförelse, skärmdumpar bifogade

---

## Vad som SKA INTE göras i Fas 1

- Inga nya kafferums-utbyten skrivs av Code — datan finns i `coffeeRoomService.ts`. Opus skriver eventuellt fler i separat textsession.
- Inga karaktärsporträtt utanför cirkel-initialer — det är Erik-jobb senare.
- Inga ljudeffekter (klirrande kaffekoppar etc) — opt-in, kommer senare.
- Ingen interaktion *inom* scenen — spelaren tjuvlyssnar, säger ingenting. Inga val-knappar.
- Ingen historik-vy ("se tidigare kafferum") — varje scen är ett nedslag, inte en arkiverad post.
- Inga separata kafferums-relaterade events — befintliga triggers (skandal, transfer, streak) räcker för Fas 1.

---

## Beroenden mellan filer

```
CoffeeRoomScene.tsx
├── tar emot: { game, onComplete } props
├── läser: getCoffeeRoomScene (coffeeRoomService.ts)
└── använder: SceneHeader, CoffeeExchange, SceneCTA

CoffeeExchange.tsx
└── tar emot: { exchange, delay } props

CoffeeRoomSecondary.tsx (Portal-kort)
├── tar emot: { game } prop (CardRenderProps)
├── läser: getCoffeeRoomScene (för förhandsvisning)
└── triggar: setPendingScene('coffee_room')

coffeeRoomService.ts (utökad)
├── exporterar: getCoffeeRoomQuote (befintlig)
└── exporterar: getCoffeeRoomScene (NY)

sceneTriggerService.ts (utökad)
└── exporterar: detectSceneTrigger (utökad med coffee_room)

dashboardCardBag.ts (utökad)
└── lägger till: coffee_room_card

SaveGame (utökad)
└── lägger till: lastCoffeeSceneRound
```

---

## Frågor till Code som ska besvaras innan implementation startar

1. **Hur hanteras override-triggers tekniskt?** Förslag: `shouldTriggerCoffeeRoom` har två villkorsblock — cooldown-block (default) och override-block (alltid true om någon override-trigger uppfylls). Override går först.

2. **Vad händer om pendingScene är något *annat* när kafferum vill triggas?** Befintlig prio i `detectSceneTrigger` gäller — kafferum får inte överrida söndagsträning eller SM-final. Det är därför kafferum kommer *sist* i prio-listan.

3. **Ska kafferum-scenen visas *före* eller *efter* veckans match?** Förslag: efter — eftersom mycket av skvallret kommenterar matchen som spelades. Det betyder att kafferum kan trigga vid omgångsövergång efter `roundProcessor` har behandlat matchen.

4. **Vad händer om spelaren refresh:ar mid-scene?** Som alla scener — `pendingScene` lever i save-state, scenen återupptas vid laddning.

---

## Leverans-ordning rekommenderas

1. **Datatyp + entity** — utöka SceneId, SaveGame
2. **Service-utökning** — `getCoffeeRoomScene` i coffeeRoomService.ts med tester
3. **Trigger-utökning** — `shouldTriggerCoffeeRoom` i sceneTriggerService.ts med tester
4. **Scene-komponent** — CoffeeRoomScene.tsx + CoffeeExchange.tsx mot mock
5. **Portal-kort** — CoffeeRoomSecondary.tsx + lägg till i bagen
6. **Store-action** — `completeScene` hanterar `lastCoffeeSceneRound` separat från `shownScenes`
7. **Integration med SceneScreen** — lägg till `case 'coffee_room'` i orkestratorn
8. **Borttagning av gammal kafferums-rad** — från DashboardScreen / Portal-CTA
9. **Verifiering & SPRINT_AUDIT.md**

**Viktigt:** Steg 1-3 har ingen visuell output. Steg 4 är första gången scenen kan ses i appen. Code kan playtest-verifiera efter steg 5 — då finns både auto-trigger och Portal-kort.

---

## Slut SPEC_KAFFERUMMET_FAS_1
