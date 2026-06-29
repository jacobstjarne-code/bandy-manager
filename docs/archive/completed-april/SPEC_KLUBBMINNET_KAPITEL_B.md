# SPEC_KLUBBMINNET_KAPITEL_B — Synliggör klubbens minne

**Datum:** 2026-04-28
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~7-9 dagars Code-arbete
**Referensmocks:** `docs/mockups/klubbminnet_mockup.html` (Opus producerar separat innan Code påbörjar)
**Beroende:** Förutsätter att Portal-Fas-1 är levererad (vilket den är) och att SPEC_JOURNALIST_KAPITEL_A är skickad till Code (parallell utveckling möjlig — ingen direkt konflikt)

**Mocken klar:** Ja — `docs/mockups/klubbminnet_mockup.html`

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/klubbminnet_mockup.html` i webbläsaren.** Klicka mellan "Full historik" (säsong 4) och "Tom vy" (säsong 1). Notera: tabbradkonsekvent med ClubScreen, säsongssektioner med högerställd "Pågående"-tag, big events med vänster border-stripe i accent-färg, separata block för legender och rekord längst ner.

2. **Läs följande filer i sin helhet — datan finns redan:**
   - `src/domain/entities/Narrative.ts` — ClubLegend, AllTimeRecords, StorylineEntry, BandyLetter, SchoolAssignmentRecord
   - `src/domain/services/narrativeService.ts` — alla generators för player.narrativeLog
   - `src/domain/services/retirementService.ts` — farewells med best moments
   - `src/domain/services/clubEraService.ts` — erornas namn över tid

3. **Läs CLAUDE.md princip 4 (Mock-driven design)** och pixel-jämförelse-reglerna.

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

`docs/mockups/klubbminnet_mockup.html` är referens. Klicka mellan två vyer: full historik (säsong 4) och tom vy (säsong 1). Kopiera CSS-värden bokstavligen.

**Komponentkoppling till mock-vyer:**

| Komponent | Mock-referens |
|---|---|
| `ClubMemoryView` (orkestrator) | Hela `.content`-området i "Full historik"-vyn |
| `ClubMemorySeasonSection` | Ett `.season-section`-block (header + meta + events) |
| `ClubMemoryEventRow` | En `.event-row` (emoji + when + text) |
| `ClubMemoryEventRow` (big variant) | `.event-row.big` med vänster border-stripe |
| `ClubMemoryLegendsBlock` | `.extra-section` med rubrik "⭐ Klubbens legender" + `.legend-card`s |
| `ClubMemoryRecordsBlock` | `.extra-section` med rubrik "📊 Klubbens rekord" + `.records-grid` |
| `ClubMemoryEmpty` | `.empty`-vyn |

**Specifikt från mocken som ska kopieras bokstavligen:**

*Säsongssektion:*
- `.season-section` margin-bottom 20px
- `.season-header` padding 10px 0 6px, border-bottom `1px solid var(--border-dark)`, margin-bottom 8px
- `.season-num`: Georgia 16px 700, `var(--text-light)`
- `.ongoing-tag`: 8px 700 uppercase, letter-spacing 1.5px, `var(--accent)`, bakgrund rgba(184,136,76,0.12), border rgba(184,136,76,0.3)
- `.season-meta`: 10px italic, `var(--text-muted)`, line-height 1.4

*Event-rad:*
- `.event-row`: gap 10px, padding 8px 0, line-height 1.4
- `.event-emoji`: 14px, width 18px, centrerad
- `.event-when`: 10px, `var(--text-muted)`, min-width 60px (så alla rader linjeras)
- `.event-text`: Georgia 12.5px, `var(--text-light)`
- `.event-row.big`: bakgrund rgba(184,136,76,0.04), border-left 2px `var(--accent)`, padding-left 10px, margin -10px till -2px

*Legender:*
- `.legend-card`: padding 10px 12px, bakgrund `var(--bg-leather)`, border-radius 6px, border-left 2px `var(--accent-dark)`
- Namn: Georgia 13px 600, `var(--text-light)`
- År: 10px, `var(--text-muted)`
- Stats: 11px, `var(--text-secondary)`
- Story: 11px italic, `var(--text-light-secondary)`, dashed border-top

*Rekord:*
- `.records-grid`: 2 columns, gap 8px
- `.record-card`: padding 10px 12px, `var(--bg-surface)`, border `1px solid var(--border-dark)`
- Label: 8px 700 uppercase, letter-spacing 1.5px, `var(--text-muted)`
- Värde: Georgia 13px, `var(--text-light)`

**Innan commit av en visuell komponent:**
- Öppna mocken och appen sida vid sida i 430px-bredd
- Skärmdumpa båda
- Bifoga i commit-meddelandet
- Sammanfattning i SPRINT_AUDIT.md

---

## Mål

Bygg en **"Klubbens minne"-vy** som samlar klubbens viktigaste händelser över de senaste 5 säsongerna i kronologisk ordning. Tre principer:

1. **Inget nytt djup.** All data finns redan spridd över `Player.narrativeLog`, `clubLegends`, `inbox` (events), `fixtures` (slutspel/cup-finaler), `facilityProjects`, `storylineEntries`. Vi *aggregerar*, vi bygger inte ny logik.

2. **Signifikans, inte fullständighet.** Vyn visar inte allt som hänt — den visar vad som *minns*. En signifikans-poängsättning avgör vilka events som platsar.

3. **Den är retention, inte engagement.** Spelare som spelat 3+ säsonger ska kunna gå hit och se sin egen resa. Det är därför vyn finns. Ny spelare i sin första säsong ser den nästan tom — det är *meningen*.

---

## Designval (bekräftade)

| Fråga | Beslut | Motivation |
|---|---|---|
| Var bor "Klubbens minne"? | Som en flik i ClubScreen ELLER som ny scen via Scene-systemet | Bestäms när mocken görs — beror på om det är "plats man besöker" eller "uppslag som tar fokus". Min initiala riktning: **flik i ClubScreen** (lättåtkomlig, inte påträngande). Bekräftas i mock-iteration. |
| Hur många säsonger? | 5 senaste | Tillräckligt för att ge resa-känsla, inte så långt att det blir ologisk historik |
| Vilka event-typer ingår? | Se sektionen "Signifikans-poängsättning" nedan | Inte allt — bara det som faktiskt minns |
| Aktuell säsong syns? | Ja, märkt "PÅGÅENDE" | Spelaren ska kunna se sitt nuvarande narrativ ta form |
| Klick på enskilt event? | Nej i Fas 1 | Senare kan klick öppna kontext-detaljer; för nu är det en rendering-vy |
| Sökning/filtering? | Nej i Fas 1 | Sektion-baserad ordning räcker (per säsong, kronologiskt inom säsong) |

---

## Arkitekturprinciper

### Princip 1: Ingen ny data lagras

`Player.narrativeLog`, `ClubLegend[]`, `AllTimeRecords`, `StorylineEntry[]` finns redan. Vi *läser* dessa. Inga nya fält på SaveGame.

### Princip 2: ClubMemoryAggregator är pure function

`getClubMemory(game: SaveGame): ClubMemoryView` är pure. Returnerar färdig struktur grupperad per säsong. Testbar isolerat utan UI.

### Princip 3: Signifikans-poängsättning som separat funktion

`scoreEvent(event: AggregatedEvent): number` är en pure function. Tröskelvärde (säg 30) avgör vilka events som platsar i vyn. Lågt-poängsatta events filtreras bort.

### Princip 4: Återanvändning av befintliga texter

Texter i `Player.narrativeLog` är redan svenskskrivna ("Hattrick mot Forsbacka — 3 mål. Stämningen exploderade på läktarna."). Vi använder dem som de är. Ingen ny text behövs i 80% av fallen.

### Princip 5: Sektion per säsong, kronologiskt inom

Säsongerna sorteras nyast först. Inom säsong sorteras events kronologiskt (omgång 1 först). Pågående säsong överst med "PÅGÅENDE"-tag.

### Princip 6: Bygg INTE ny ClubScreen-arkitektur

Om "Klubbens minne" blir en flik i ClubScreen — använd existerande tab-pattern i ClubScreen. Bygg inte ny tab-infrastruktur.

---

## Dataarkitektur

### Filer som ska skapas

#### `src/domain/services/clubMemoryService.ts`

Aggregator-tjänst som plockar events från flera källor, poängsätter, filtrerar, grupperar.

```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { ClubLegend, StorylineEntry } from '../entities/Narrative'

export type MemoryEventType =
  | 'season_finish'           // slutplacering
  | 'cup_final'               // cup-final (vinst eller förlust)
  | 'sm_final'                // SM-final
  | 'derby_result'            // derby-resultat (vinst/förlust)
  | 'big_win'                 // ≥4 måls marginal
  | 'big_loss'                // ≤-4 måls marginal
  | 'player_milestone'        // hattrick, första mål, 100+ matcher etc
  | 'academy_promotion'       // P19 → A-lag
  | 'retirement'              // pensionering
  | 'facility_built'          // facility-projekt klart
  | 'transfer_signed'         // signerad spelare (om signifikant)
  | 'transfer_sold'           // såld spelare (om signifikant)
  | 'patron_change'           // patron bytte
  | 'storyline_resolution'    // StorylineEntry resolved
  | 'scandal'                 // skandal under säsongen

export interface MemoryEvent {
  type: MemoryEventType
  season: number
  matchday: number
  text: string                // människoläsbar svensk text
  emoji: string               // ikon för raden
  significance: number        // 0-100, för sortering/filtrering
  subjectPlayerId?: string    // för djup-vyer senare
  subjectClubId?: string
}

export interface SeasonMemory {
  season: number
  isOngoing: boolean
  finishPosition?: number     // slutplacering om säsongen är klar
  events: MemoryEvent[]       // kronologiskt sorterade
  eraName?: string            // från clubEraService
}

export interface ClubMemoryView {
  seasons: SeasonMemory[]      // nyast först, max 5
  legends: ClubLegend[]        // pensionerade legender
  records: AllTimeRecords      // klubbens rekord-tabell
  totalEventsAcrossSeasons: number
}

/**
 * Huvud-aggregatorn. Pure function.
 * Plockar events från alla relevanta källor, poängsätter, filtrerar, grupperar.
 */
export function getClubMemory(game: SaveGame): ClubMemoryView {
  // Implementation:
  // 1. Iterera över de senaste 5 säsongerna
  // 2. För varje säsong, samla events från:
  //    - Slutplacering (om klar)
  //    - Cup-finaler / SM-finaler från fixtures
  //    - Derby-resultat från fixtures + rivalries
  //    - Big wins / big losses från fixtures
  //    - Player.narrativeLog (alla aktiva + pensionerade spelare)
  //    - storylineEntries med season-match
  //    - facilityProjects som blev klara
  //    - inbox med scandalEvent-typ
  // 3. Poängsätt med scoreEvent
  // 4. Filtrera bort events under tröskel (default 30)
  // 5. Sortera kronologiskt inom säsong
  // 6. Returnera struktur
}

/**
 * Poängsätter en aggregerad händelse 0-100.
 * Höga poäng = mer minnesvärt.
 *
 * Standard-poäng:
 *   sm_final          → 95
 *   cup_final         → 80
 *   season_finish     → 50 + 5*(12-position) (förstaplats = 105 effective)
 *   big_win           → 30 + min(40, marginal*5)
 *   big_loss          → 30 + min(30, |marginal|*4)
 *   derby_result      → 50 (vinst), 35 (förlust)
 *   retirement        → 60 (legend → 90)
 *   academy_promotion → 40
 *   facility_built    → 35
 *   patron_change     → 45
 *   scandal           → 70
 *   player_milestone  → 30 (hattrick), 50 (debut), 60 (100 matcher)
 *   storyline_resolution → varierar baserat på StorylineType
 */
export function scoreEvent(event: MemoryEvent): number {
  // Implementation
}

const SIGNIFICANCE_THRESHOLD = 30  // events under denna nivå filtreras bort
```

**Krav:**
- Pure function — inga side effects
- Filen max ~200 rader (det blir större än vanligt p.g.a. många källor; bryts upp i mindre helpers internt)
- Tester: minst 8 fall som verifierar olika events plockas korrekt och poängsätts rimligt

#### `src/domain/services/clubMemoryEventBuilders.ts`

Hjälpfunktioner som bygger MemoryEvents från olika datakällor. Separat fil för att hålla `clubMemoryService.ts` läsbar.

```typescript
import type { Fixture } from '../entities/Fixture'
import type { Player } from '../entities/Player'
import type { MemoryEvent } from './clubMemoryService'

export function buildEventFromFixture(fixture: Fixture, game: SaveGame): MemoryEvent | null {
  // Hantera SM-final, cup-final, derby, big win, big loss
}

export function buildEventFromNarrativeLog(player: Player, entry: NarrativeEntry): MemoryEvent {
  // Mapping från NarrativeEntry till MemoryEvent
}

export function buildEventFromStoryline(storyline: StorylineEntry): MemoryEvent {
  // Mapping från StorylineEntry till MemoryEvent
}

export function buildEventFromRetirement(legend: ClubLegend): MemoryEvent {
  // Mapping från pensionering
}
```

**Krav:**
- Pure functions
- Max ~150 rader

### Filer som ska skapas — Komponenter

```
src/presentation/components/clubmemory/
├── ClubMemoryView.tsx              (~120 rader, huvud-vyn)
├── ClubMemorySeasonSection.tsx     (~80 rader, en säsongs-sektion)
├── ClubMemoryEventRow.tsx          (~50 rader, ett event)
├── ClubMemoryLegendsBlock.tsx      (~80 rader, pensionerade legender)
├── ClubMemoryRecordsBlock.tsx      (~60 rader, all-time records)
└── ClubMemoryEmpty.tsx             (~30 rader, "ingen historik än"-fallback)
```

**Krav:**
- Inga filer över 150 rader
- Komponenterna får `clubMemory: ClubMemoryView` som prop, eller del därav
- Inga store-anrop i komponenterna

### Filer som ska modifieras

#### `src/presentation/screens/ClubScreen.tsx`

Lägg till en ny tab "Minne" (eller motsvarande) som renderar `<ClubMemoryView>`.

Exakt placering bestäms av Code utifrån befintlig tab-struktur i ClubScreen. Krav:
- Tab-namnet: "Minne" (kort och tydligt)
- Tab-emoji: 📖 (samma som "Spelguide" idag — kolla att det inte krockar; om det gör det, välj annan)
- Den nya tabben ska bara vara tillgänglig när game.currentSeason > 1 ELLER när det finns minst 3 events i `getClubMemory(game)` (så att första säsongen inte har en tom tab)

---

## Skärmflöde

### När spelaren öppnar ClubScreen → Minne-tab

```
Spelaren klickar "Minne"-tab
    ↓
ClubScreen renderar <ClubMemoryView>
    ↓
ClubMemoryView anropar useGameStore för game-state, sen getClubMemory(game)
    ↓
Resultat: ClubMemoryView med 5 säsongs-sektioner
    ↓
Renderar:
  - Aktuell säsong först (med "PÅGÅENDE"-tag)
  - Tidigare säsonger nedåt
  - Sektion längst ner: "Klubbens legender" (om några)
  - Sektion längst ner: "All-time records"
```

### Tom-vy

Om `clubMemory.totalEventsAcrossSeasons < 3`:
- Rendera `ClubMemoryEmpty`
- Text: "Klubbens historia tar form. När säsonger spelas och milstolpar nås kommer minnen att samlas här."

---

## Signifikans-poängsättning — detaljerad

### Höga poäng (75+) — alltid med

- SM-final spelad (vinst eller förlust): **95** (vinst), **85** (förlust)
- Cup-final spelad: **80** (vinst), **70** (förlust)
- Säsong vunnen (1:a plats): **105** (effektivt över max — alltid med)
- Klubblegend pensionerad: **90**
- Skandal som drabbade klubben direkt: **75**
- Patron-byte (avgång eller nyrekrytering): **70**

### Medel-höga (50-74) — oftast med

- Säsong slutar 2:a: **75**
- Säsong slutar 3:a-4:a: **65**
- Akademispelare uppflyttad till A-lag: **55** (60 om hen sedan blir startspelare)
- Storseger ≥6 mål: **65**
- Storförlust ≥6 mål: **55**
- Spelare når 100 matcher: **60**
- Vunnit derby med ≥3 mål: **55**
- Anläggning klar (omklädningsrum, hallbygge etc): **50**

### Lägre (30-49) — på gränsen

- Säsong slutar 5:a-6:e: **45**
- Säsong slutar 7:a-9:a: **35**
- Storseger 4-5 mål: **40**
- Förlorat derby: **35**
- Hattrick av spelare: **35**
- Första A-lagsmål: **40**
- Pensionerad icke-legend: **40**
- Storyline resolution (specifik typ): varierar 30-65

### Under tröskel (under 30) — bortfiltreras

- Vunnet enskilt match (utan stor marginal): borttaget
- Knäpp förlust (1-2 mål): borttaget
- Spelare-form-streak: borttaget
- Skadefall (om inte spelare är legend): borttaget

**Tröskel kan justeras med playtest-feedback.** Default 30 — om vyn känns för full sänk till 35; om för tom höj till 25.

---

## Visuell design (preliminär)

`docs/mockups/klubbminnet_mockup.html` är referens när den är klar. Riktning:

**Layout:**
- Tab-rubrik "📖 Minne" med samma styling som andra ClubScreen-tabs
- Pågående säsong överst med "PÅGÅENDE"-tag (accent-färg)
- Säsongs-header: "SÄSONG 2027-28 · Slutade 3:a · Eran: GRUNDARÅREN"
- Events i kronologisk ordning (omgång 1 → 22)
- Varje event: emoji + datum/omgång + text
- Visuell separation mellan säsonger (linje + space)
- Längst ner: "KLUBBENS LEGENDER" och "ALL-TIME RECORDS" som egna block

**Format för event-rad:**
```
🏆  Omgång 22  ·  Slutade 3:a — högsta hittills
👋  Omgång 22  ·  Staffan Henriksson, 34, pensionerad. 147 matcher.
🥇  Omgång 18  ·  Ny patron ansluter (Lars Berglund)
🎓  Omgång 8   ·  Anders Henriksson uppflyttad från P19
```

CSS-värden bestäms i mocken.

---

## Tester

### Unit-tester

- `clubMemoryService.test.ts`
  - Returnerar tom struktur för säsong 1, första omgången
  - Aggregerar korrekt från 3 olika säsonger
  - Filtrerar bort events under signifikans-tröskel
  - Sorterar säsonger nyast först
  - Markerar pågående säsong korrekt
  - Inkluderar legender och records

- `clubMemoryEventBuilders.test.ts`
  - Varje builder-funktion testas med 3-5 indata-fall
  - Verifiera att SM-final-fixture blir SM-final-event med rätt poäng

### Integration-tester

- `ClubMemoryView.test.tsx`
  - Renderar tom-vy när data saknas
  - Renderar 5 säsongs-sektioner när data finns
  - Visar "PÅGÅENDE"-tag på aktuell säsong

### Visuell verifiering (självaudit)

- Spela 2 säsonger till slutet
- Öppna ClubScreen → Minne
- Verifiera att första säsongens nyckel-events finns (SM-tabellplacering, eventuella derbyn, skadeevent på legendspelare)
- Verifiera att andra säsongens events kommer ovanför första
- Verifiera "KLUBBENS LEGENDER" om någon pensionerats

---

## Verifieringsprotokoll

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger** — `grep -rn '#[0-9a-fA-F]' src/presentation/components/clubmemory/` returnerar 0
3. **Filstorlekar** — `wc -l src/presentation/components/clubmemory/**/*.tsx` — ingen fil över 150 rader
4. **Filstorlekar service** — `wc -l src/domain/services/clubMemoryService.ts src/domain/services/clubMemoryEventBuilders.ts` — under 200 rader var
5. **Pure functions** — manuell granskning att aggregator inte gör store-anrop eller side effects
6. **PIXEL-JÄMFÖRELSE PER KOMPONENT — COMMIT-BLOCKER:**
   - En komponent åt gången (ClubMemorySeasonSection → ClubMemoryEventRow → ClubMemoryView → blocks)
   - Skärmdumpar i commit-meddelandet
   - Sammanfattning i SPRINT_AUDIT.md
7. **CSS-token-disciplin på mörka komponenter:** Inga ljusa tokens på mörk bakgrund som default
8. **SPRINT_AUDIT.md** — verifierat i UI med pixel-jämförelse

---

## Vad som SKA INTE göras i Fas 1

- Ingen klick-på-event för att se kontext-detalj — bara rendering
- Ingen sökning eller filtrering
- Ingen export till bild/dela-funktion (det är THE_BOMB §5.1, separat sprint)
- Ingen delning över multipla klubbar (om spelaren bytt klubb — vyn visar bara aktuell klubbs minne)
- Ingen redigering av historik (spelaren kan inte ta bort events)
- Ingen "favorit-event"-flagga — det är Fas 2
- Inga nya event-typer skapas — vi aggregerar bara från befintliga källor

---

## Återanvändning av befintliga komponenter — kritiskt

**Använd ClubScreen:s befintliga tab-pattern.** Bygg inte ny tab-infrastruktur. Lägg bara till ett nytt case i tab-switch.

**Återanvänd `card-sharp`-klassen från designsystemet** för event-rader. Inte inline borderRadius.

**Inga nya emoji-konventioner.** Använd existerande från DESIGN_SYSTEM.md sektion 2 (🏒 match, 💰 ekonomi, 👥 trupp, 👤 patron, 🏋️ träning, 🏠 orten, 🏛️ kommun, 🏟️ anläggning, 🏆 cup, ⚔️ slutspel, 📖 spelguide, etc).

---

## Frågor till Code som ska besvaras innan implementation

1. **Var lagras `clubLegends` och `allTimeRecords` på SaveGame?** Bekräfta sökväg.
2. **Hur ser ClubScreen tab-struktur ut idag?** Hur lägger man till en ny tab utan att bryta befintlig logik?
3. **Finns `facilityProjects` med `completedSeason`/`completedMatchday`-fält?** Vi behöver veta när en facility blev klar för att lägga som event.
4. **Finns en lista över alla event-typer i `inbox` som handlar om scandal?** Vi behöver kunna filtrera scandal-events från inbox.

---

## Leverans-ordning rekommenderas

1. **Service-lagret först** — `clubMemoryService.ts` + `clubMemoryEventBuilders.ts` med tester. INGEN UI.
2. **ClubMemoryEmpty.tsx** — fallback-komponent (enklast). Pixel-jämförelse mot mock-tomt-läge.
3. **ClubMemoryEventRow.tsx** — en event-rad. Pixel-jämförelse.
4. **ClubMemorySeasonSection.tsx** — en säsongs-sektion. Pixel-jämförelse.
5. **ClubMemoryLegendsBlock.tsx + ClubMemoryRecordsBlock.tsx** — hjälp-block. Pixel-jämförelse.
6. **ClubMemoryView.tsx** — orkestratorn. Pixel-jämförelse.
7. **ClubScreen-integration** — lägg till tab, rendera vyn.
8. **Verifiering & SPRINT_AUDIT.md**

Steg 1 har ingen visuell output. Tester verifierar aggregation. Steg 2-6 är komponenter, en åt gången, med pixel-jämförelse. Steg 7 är integration. Steg 8 är audit.

---

## Slut SPEC_KLUBBMINNET_KAPITEL_B
