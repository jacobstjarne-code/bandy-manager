# SPEC_INLEDNING_FAS_1

**Datum:** 2026-04-27
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~5-7 dagars Code-arbete
**Referensmocks:** `docs/mockups/inledning_mockup.html`
**Källa för klubbinfo:** `docs/KLUBBFAKTA.md` (single source of truth)

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/inledning_mockup.html` i webbläsaren.** Klicka mellan "Tre erbjudanden" och "Alla klubbar". Klicka på klubbar i listan så att expanderad info visas. Den interaktiva mocken visar exakt målbilden — layout, färger, typografi, beteende. Kod ska matcha mocken visuellt.

2. **Läs `docs/KLUBBFAKTA.md` i sin helhet.** Filen är ~600 rader och innehåller verifierad research om varje klubbs region, klimat, hemmaplan och anekdoter. ALL klubbinfo i datafilerna ska härledas härifrån — inte uppfinnas. Varje klubb har en "Vad som ALDRIG sägs"-sektion som måste respekteras.

3. **Notera:** CLUB_DATA-objektet i mockens JavaScript är *visuell referens* — kopiera INTE det rakt av till datafiler. Citaten där är preliminära. Riktig klubbinfo härleds från KLUBBFAKTA.md, och Opus levererar slutgiltiga citat-pooler separat.

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

Denna sektion är hård. Läs den.

Mocken (`inledning_mockup.html`) är inte en *idé* om hur det ska se ut. Den är *specifikationen* för hur det ska se ut. När du implementerar komponenter ska du:

1. **Ha mocken öppen i en flik bredvid din editor.** Inte i minnet. Inte "jag kommer ihåg ungefär". Bredvid editorn, hela tiden.

2. **Kopiera CSS-värden bokstavligen.** Padding, border-radius, font-storlekar, opacity, gap, letter-spacing — allt som finns i mockens CSS ska kopieras till komponenten. Inte ungefärligt. Inte "liknande". Bokstavligen.

   Exempel — erbjudande-kortet i "Tre erbjudanden"-vyn har:
   ```css
   background: var(--bg-surface);
   border: 1px solid var(--border);
   border-radius: 8px;
   padding: 16px 18px;
   margin-bottom: 12px;
   ```
   `OfferCard.tsx` ska ha *exakt* dessa värden. Inte 14px. Inte 6px radius.

3. **Komponentkoppling till mock-vyer:**

   | Komponent | Mock-referens |
   |---|---|
   | `OffersView` | Vyn under knappen "Tre erbjudanden" i `inledning_mockup.html` |
   | `OfferCard` | Ett enskilt erbjudande-kort i samma vy |
   | `DifficultyTag` | Tagg "SVÅR/MEDEL/LÄTT" överst höger i varje OfferCard |
   | `AllClubsView` | Vyn under knappen "Alla klubbar" |
   | `SverigeBackdrop` | Sverige-silhuetten bakom listan i "Alla klubbar"-vyn |
   | `ClubListItem` | Ett klubbnamn-pill i listan |
   | `ClubExpandedCard` | Det stora kortet som visas när man klickar på ett klubbnamn |

4. **Innan du committar en komponent — öppna appen och mocken sida vid sida.** Ta skärmdump av båda. Jämför pixelnivå. Om det inte matchar — antingen är komponenten fel, eller är mocken fel (säg till Opus). Lös innan commit.

5. **Visuell verifiering är inte "det fungerar".** Det är "det matchar mocken". En knapp som triggar rätt navigering men har fel padding är inte färdig.

---

## Mål

Ersätt det nuvarande intro-flödet (NewGameScreen → BoardMeetingScreen → PreSeasonScreen) med en mer immersiv inledning baserad på två principer:

1. **"Klubben hittar dig"** — istället för en lista med 12 klubbar att välja från, presenteras tre konkreta erbjudanden (en svår, en medel, en lätt klubb) där varje erbjudande är en kort scen med ett citat från en specifik person.

2. **"Visa alla klubbar"-fallback** — för spelare som vill ha total kontroll finns en lista över alla 12 klubbar grupperade efter region (norr → söder), med Sverige-silhuett som svag bakgrundsdekor. Klick på klubbnamn expanderar rik klubbinfo.

**Vad som INTE ändras i Fas 1:**
- IntroSequence (snöpartiklar + atmosfärisk text) — branding, lämnas orörd
- BoardMeetingScreen och PreSeasonScreen — slås ihop till en dialog-scen i Fas 2 (separat spec)

---

## Arkitekturprinciper (kritiska — bryt inte mot dessa)

### Princip 1: KLUBBFAKTA.md är single source of truth

`docs/KLUBBFAKTA.md` är auktoritativ för all klubbinfo. Den innehåller verifierad research om varje klubbs verkliga referens, region, klimat-arketyp, hemmaplan, anekdoter och vad som ALDRIG sägs i spelet.

**Innan du skriver `clubExtendedInfo.ts` — läs KLUBBFAKTA.md i sin helhet.** Inte bara skim. Filen är ~600 rader och varje klubb har en sektion. Citat och fakta i datafilen ska härledas från KLUBBFAKTA.md, inte uppfinnas.

### Princip 2: Inget hårdkodat i komponenter

All klubbinfo lever i `src/domain/data/`-filer. Komponenterna läser från datakällor. Inget JS-objekt med klubbinfo i `.tsx`-filer.

### Princip 3: Citat är dynamiska, inte fasta

För varje klubb finns en *pool* av öppningscitat (3-5 stycken). När ett erbjudande visas slumpas ett citat. Olika playthroughs ger olika citat från samma klubb. Det är vad som gör att spelet inte känns identiskt vid 5:e nya spelet.

### Princip 4: En komponent per visuellt distinkt sak

Inga filer över ~150 rader. Varje komponent gör en sak. Orkestrering ligger i screen-filen, presentation i komponentfiler.

### Princip 5: Worldgenerator.ts är källa för region/namn/arena

Region, klubbnamn, arenanamn, klacknamn — allt detta finns redan i `worldGenerator.ts` CLUB_TEMPLATES. `clubExtendedInfo.ts` *utökar* med citat och berikad info, men *duplicerar aldrig* grunddata. Om regionerna i worldGenerator.ts är fel — uppdatera där, inte bygg parallell sanning.

---

## Dataarkitektur

### Filer som ska skapas

#### `src/domain/data/clubExtendedInfo.ts`

Utökad info per klubb — härleds från KLUBBFAKTA.md.

```typescript
import { ClubExpectation } from '../enums'

export interface ClubExtendedInfo {
  clubId: string                    // matchar id i CLUB_TEMPLATES
  arenaNote: string                 // kort fakta om arenan, 5-10 ord
                                    // ex: "Naturis sedan 1967. Köldhål."
  patronType: string                // generisk patron-typ, INTE personnamn
                                    // ex: "Bruksdisponent", "Pappersbrukets fackstark"
  klimateArchetype: string          // matchar nyckel i KLUBBFAKTA.md bilaga
                                    // ex: "valley_coldpit", "arctic_coast"
  briefDescription: string          // 1-2 meningar, generisk klubbstämning
                                    // ex: "Bruksort i skogslandskap. Naturis när vädret tillåter."
}

export const CLUB_EXTENDED_INFO: Record<string, ClubExtendedInfo> = {
  'club_forsbacka': { /* ... */ },
  'club_soderfors': { /* ... */ },
  // ... 12 klubbar totalt
}
```

**Krav:**
- Alla 12 klubbar måste finnas
- `arenaNote`, `patronType`, `briefDescription` ska härledas från KLUBBFAKTA.md
- INGA personnamn (ingen "Lars Berglund", ingen "Birger Karlsson") — bara generiska arketyper
- INGA specifika SM-finaler eller årtal som binder mot riktig klubb
- Följ KLUBBFAKTA.md "Vad som ALDRIG sägs"-listor strikt

#### `src/domain/data/clubOfferQuotes.ts`

Pool av öppningscitat per klubb — för "Tre erbjudanden"-scenen.

```typescript
export interface ClubOfferQuote {
  text: string                      // citatet, 1-3 meningar
  attribution: string               // generisk attribution
                                    // ex: "Brukets folk, generisk"
                                    //     "Klacken, generisk"
                                    //     "Klubbordförande, generisk"
}

export const CLUB_OFFER_QUOTES: Record<string, ClubOfferQuote[]> = {
  'club_forsbacka': [
    {
      text: '"Vi är mellan Gävle och Sandviken. Alla glömmer oss tills isen ligger."',
      attribution: 'Klacken, generisk',
    },
    {
      text: '"Bruket har funnits här i 350 år. Klubben i hundra. Vi har inte tänkt sluta."',
      attribution: 'Klubbordförande, generisk',
    },
    // ... 3-5 citat per klubb
  ],
  'club_soderfors': [
    // ...
  ],
  // ... 12 klubbar totalt
}
```

**Krav:**
- 3-5 citat per klubb (totalt ~50 citat)
- Citaten ska vara distinkt klubbspecifika — Forsbacka-citatet ska kännas som Forsbacka, inte som generiskt
- Citaten ska följa bandysverige-tonen: parkeringsstämning, understatement, konkreta bilder
- INGA personnamn i citaten
- INGA referenser till specifika historiska händelser (SM-finaler, årtal)
- Källa: KLUBBFAKTA.md "Anekdotreservoar"-sektionen för varje klubb — *generaliserade*

**Opus skriver dessa citat manuellt** under sessions med Jacob — inte Code. Detta är text-jobb. Code skapar filen med rätt struktur och tomma citat-arrays. Opus fyller i citat under separata text-sessioner (samma metod som styrelsecitat-piloten).

För Fas 1-leverans: Opus skriver 3 citat per klubb (36 totalt) i förväg så filen är funktionell vid leverans.

#### `src/domain/services/offerSelectionService.ts`

Service som väljer 3 klubbar för "Tre erbjudanden"-scenen.

```typescript
import { CLUB_TEMPLATES } from './worldGenerator'
import type { Club } from '../entities/Club'

export interface ClubOffer {
  clubId: string
  difficulty: 'easy' | 'medium' | 'hard'
  quoteIndex: number  // index i CLUB_OFFER_QUOTES[clubId] för deterministisk slumpning
}

/**
 * Väljer 3 klubbar för "Tre erbjudanden"-scenen.
 * Balanserad: en svår, en medel, en lätt.
 *
 * Svårighet baseras på reputation:
 * - Hard: reputation < 55 (Söderfors, Skutskär, Slottsbron, Hälleforsnäs, Heros, Rögle)
 * - Medium: reputation 55-74 (Karlsborg, Målilla, Gagnef, Lesjöfors)
 * - Easy: reputation 75+ (Forsbacka, Västanfors)
 *
 * Slumpning är deterministisk — samma seed ger samma 3 klubbar.
 *
 * @param seed Numerisk seed (typiskt Date.now() vid sessionsstart, sparas i save)
 * @returns Tre erbjudanden — exakt 1 hard, 1 medium, 1 easy
 */
export function selectThreeOffers(seed: number): ClubOffer[] {
  // Implementation: gruppera CLUB_TEMPLATES per difficulty,
  //   slumpa 1 ur varje grupp med seed-baserad randomisering
  // Edge case: om någon grupp är tom, fyll från närmaste grupp
}

/**
 * Väljer ett citat-index ur poolen för given klubb.
 * Deterministisk baserat på seed + clubId.
 */
export function selectQuoteIndex(seed: number, clubId: string, poolSize: number): number {
  // Implementation: hash(seed + clubId) % poolSize
}
```

**Krav:**
- Måste vara deterministisk (testbar)
- Måste ge exakt 1 av varje difficulty-nivå
- Måste hantera edge case att någon difficulty-nivå har 0 klubbar (osannolikt med nuvarande 12, men robust)
- Tester: `offerSelectionService.test.ts` — minst 5 olika seeds verifierar balans

### Filer som ska modifieras

#### `src/domain/services/worldGenerator.ts`

Region-fält måste verifieras mot KLUBBFAKTA.md. Aktuell status (kontrollerad mot KLUBBFAKTA.md):

| Klubb | Region i koden | Region enligt KLUBBFAKTA | Action |
|---|---|---|---|
| Forsbacka | Gävleborg | Gästrikland | **Uppdatera till Gästrikland** |
| Söderfors | Uppland | Uppland | OK |
| Västanfors | Västmanland | Västmanland | OK |
| Karlsborg | Norrbotten | Norrbotten | OK |
| Målilla | Småland | Småland | OK |
| Gagnef | Dalarna | Dalarna | OK |
| Hälleforsnäs | Södermanland | Södermanland | OK |
| Lesjöfors | Värmland | Värmland | OK |
| Rögle | Skåne | Skåne | OK |
| Slottsbron | Värmland | Värmland | OK |
| Skutskär | Uppland | Uppland | OK |
| Heros | Dalarna | Dalarna (Smedjebacken) | OK (region är samma; Smedjebacken är ortspecifikt) |

**Uppdatera Forsbacka:** `region: 'Gästrikland'` (inte 'Gävleborg' — Gävleborg är län, Gästrikland är landskap, och regionalClimate.ts måste eventuellt utökas om Gästrikland inte finns där).

**Verifiera regionalClimate.ts har Gästrikland.** Om inte — lägg till med samma värden som närmaste landskap (Uppland eller Dalarna).

#### `src/presentation/screens/NewGameScreen.tsx`

**Ersätts av `ClubSelectionScreen.tsx` (ny fil).** Den gamla filen kan tas bort efter migration eller behållas som fallback under utveckling.

### Komponenter som ska skapas

```
src/presentation/screens/
└── ClubSelectionScreen.tsx           (~80 rader, orkestrering)

src/presentation/components/clubselection/
├── OffersView.tsx                    (~60 rader, "Tre erbjudanden"-vyn)
├── OfferCard.tsx                     (~50 rader, ett klubberbjudande)
├── DifficultyTag.tsx                 (~15 rader, återanvändbar tagg)
├── AllClubsView.tsx                  (~70 rader, listvyn med Sverige-bakgrund)
├── SverigeBackdrop.tsx               (~40 rader, SVG-silhuetten)
├── ClubListItem.tsx                  (~30 rader, ett klubbnamn-pill i listan)
└── ClubExpandedCard.tsx              (~60 rader, expanderad klubbinfo vid klick)
```

**Krav:**
- Inga filer över 150 rader
- Inga inline-stilar med hårdkodade färger (använd CSS-variabler)
- Mobile-first (375px viewport)
- Följ DESIGN_SYSTEM.md regler för card-sharp, padding, typografi

### Sverige-silhuett

SVG-pathen för Sverige ligger inte inline i komponent. Den ligger i:

```
src/domain/data/sverigeMapPath.ts
```

```typescript
export const SVERIGE_PATH = `M 95 8 C 100 4, 110 5, 116 12 ...` // den fullständiga path-stringen
export const SVERIGE_VIEWBOX = "0 0 220 460"
```

`SverigeBackdrop.tsx` läser från denna fil. Detta gör att path-data kan uppdateras (om vi senare hittar en bättre stiliserad form) utan att röra komponentkoden.

---

## Skärmflöde

### Scenflöde i Fas 1

```
IntroSequence (oförändrad)
    ↓
NameInputScreen (samma som steg 1 av nuvarande NewGameScreen — bara namn-input)
    ↓
ClubSelectionScreen (NY)
    ↓ (default: visa OffersView)
    OffersView
        ├── Klick på erbjudande → bekräftelse → spel startas
        └── "Visa alla klubbar"-knapp → AllClubsView
    AllClubsView
        ├── Klick på klubbpill → expanderar ClubExpandedCard
        ├── ClubExpandedCard har "Ta över [klubb]"-knapp → spel startas
        └── "Tillbaka"-knapp → OffersView
    ↓
BoardMeetingScreen (oförändrad i Fas 1)
    ↓
PreSeasonScreen (oförändrad i Fas 1)
    ↓
GameDashboard
```

### State som ska sparas

I save-game-objektet:
```typescript
interface SaveGame {
  // ... befintliga fält
  selectionMethod?: 'offer' | 'browse'  // för analytics/debug
  initialOfferSeed?: number              // för reproducibilitet
}
```

---

## Visuell design

Mocken `docs/mockups/inledning_mockup.html` är referens. Följ den i:

- Layout (28px padding, card-styling, gap-värden)
- Typografi (Georgia för rubriker/citat, system-ui för UI)
- Färger (CSS-variabler — `var(--accent)`, `var(--gold)`, etc)
- Genre-tag "⬩ TRE SAMTAL ⬩" som sektionsindikator
- Sverige-silhuett 8% opacitet, max 240px bred, centrerad
- Region-rubriker i kapitäler, Georgia 10px, letterspacing 3px, accent-färg 60% opacitet
- Klubbpiller offset vänster/mitten/höger för rytm

**Klubbpiller i AllClubsView visar BARA klubbnamnet.** Inga siffror, inga förhandsplacering. Detaljer kommer i ClubExpandedCard vid klick.

---

## Texter

### Genre-tag i OffersView

`⬩ TRE SAMTAL ⬩`

### Rubrik i OffersView

`Tre klubbar har ringt`

### Underrubrik i OffersView

`De har hört att du letar tränarjobb. Bandysverige är ett litet rum.`

### Knapp till AllClubsView

`📋 Visa alla 12 klubbar i bandysverige`

### Rubrik i AllClubsView

`Välj din klubb`

### Underrubrik i AllClubsView

`Norr till söder. Tryck för mer.`

### "Tillbaka"-knapp

`← Tillbaka`

### "Ta över"-knapp

`Ta över [Klubbnamn] →`

---

## Tester

### Unit-tester

- `offerSelectionService.test.ts`
  - Verifierar att 5 olika seeds ger giltiga 3-erbjudanden-set (1 hard, 1 medium, 1 easy)
  - Verifierar determinism — samma seed → samma resultat
  - Verifierar edge case när någon difficulty är tom (om den någonsin blir det)
- `clubExtendedInfo.test.ts`
  - Verifierar att alla 12 klubb-ID från CLUB_TEMPLATES finns i CLUB_EXTENDED_INFO
  - Verifierar att ingen klubb har personnamn i fält (regex-test för vanliga svenska förnamn)

### Integration

- `ClubSelectionScreen.test.tsx`
  - Renderar OffersView som default
  - "Visa alla klubbar"-knapp navigerar till AllClubsView
  - Klick på erbjudande triggar `newGame(clubId)`
  - Klick på klubbpill expanderar info
  - "Tillbaka" från AllClubsView navigerar till OffersView

### Visuell verifiering (självaudit)

Efter implementation — öppna appen som ny manager:
- IntroSequence → namn-input → ClubSelectionScreen visar OffersView
- Tre erbjudanden synliga med olika difficulty-tagg
- Citaten visar olika citat vid varje nytt spel (testa 3 gånger)
- "Visa alla klubbar" → lista med 12 klubbar i regional ordning
- Klick på klubb → expanderar med arena/patron/klack/citat
- "Tillbaka" → tillbaka till OffersView
- Klick på "Ta över [klubb]" → går vidare till BoardMeetingScreen

---

## Verifieringsprotokoll

Innan sprint markeras klar (krav från CLAUDE.md):

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger** — `grep -rn '#[0-9a-fA-F]' src/presentation/components/clubselection/` returnerar 0
3. **Inga personnamn i clubExtendedInfo.ts eller clubOfferQuotes.ts** — manuell granskning
4. **Filstorlekar** — `wc -l src/presentation/components/clubselection/*.tsx` — ingen fil över 150 rader
5. **PIXEL-VERIFIERING MOT MOCK** — för varje komponent som har en mock-referens (se tabellen i "MOCKEN ÄR KANON"-sektionen):
   - Öppna mocken i webbläsare i 430px-bredd
   - Öppna appen i samma bredd
   - Ta skärmdump av båda
   - Bifoga båda i SPRINT_AUDIT.md
   - Beskriv eventuella avvikelser och varför de finns
6. **SPRINT_AUDIT.md** — verifierat i UI enligt mall, med pixel-jämförelsen ovan

---

## Vad som SKA INTE göras i Fas 1

- BoardMeetingScreen och PreSeasonScreen ändras INTE — de är samma som idag, vi går till dem efter ClubSelectionScreen
- Inga moments triggas i intro-flödet (det kommer i Fas 2)
- Ingen tonalitets-CSS-shift (det kommer separat i Portal-Fas-1)
- Ingen ändring av spelarnamns-input (samma logik, kanske ny komponent men samma fält)
- Ingen ny musik eller ljud
- Karlsborg-namn-frågan (förvirrande mot Kalix Bandy) — INTE löst i Fas 1. Klubben behåller namnet "Karlsborg" och ligger i Norrbotten enligt nuvarande worldGenerator.ts. Frågan om eventuell omdöpning tas senare.

---

## Beroenden mellan filer

```
ClubSelectionScreen.tsx
├── läser: CLUB_TEMPLATES (worldGenerator.ts)
├── läser: CLUB_EXTENDED_INFO (clubExtendedInfo.ts)
├── läser: CLUB_OFFER_QUOTES (clubOfferQuotes.ts)
├── använder: selectThreeOffers, selectQuoteIndex (offerSelectionService.ts)
├── använder: SverigeBackdrop, OffersView, AllClubsView
└── triggar: useGameStore.newGame(clubId, managerName)

OffersView.tsx
├── tar emot: ClubOffer[], onSelect callback
├── använder: OfferCard, DifficultyTag

OfferCard.tsx
├── tar emot: ClubOffer, club data, quote
├── använder: DifficultyTag

AllClubsView.tsx
├── tar emot: onSelect callback, onBack callback
├── läser: CLUB_TEMPLATES (för listan)
├── använder: SverigeBackdrop, ClubListItem, ClubExpandedCard

SverigeBackdrop.tsx
└── läser: SVERIGE_PATH, SVERIGE_VIEWBOX (sverigeMapPath.ts)
```

---

## Frågor till Code som ska besvaras innan implementation startar

1. **Hur sparas det val spelaren gjort i save-state?** Räcker det med `selectionMethod` + `initialOfferSeed`, eller behövs något mer?

2. **Ska `NewGameScreen.tsx` tas bort efter migration?** Min rekommendation: ja, men först efter ClubSelectionScreen är stabil och alla tester grön.

3. **Vilken seed ska `selectThreeOffers` använda i produktion?** `Date.now()` vid spelstart sparas i `initialOfferSeed`. Det gör att spelaren kan inte refresha sidan för att få nya erbjudanden — vilket är medvetet (vi vill inte att spelaren rerollar tills de får sin favoritklubb).

---

## Leverans-ordning rekommenderas

Bygg i denna ordning för att kunna testa successivt:

1. **Datastruktur först** — skapa `clubExtendedInfo.ts`, `clubOfferQuotes.ts` (med tomma quote-arrays), `sverigeMapPath.ts`, `offerSelectionService.ts` med tester
2. **Uppdatera worldGenerator.ts** — Forsbacka region: Gävleborg → Gästrikland
3. **Bygg AllClubsView först** — den är enklare än OffersView (ingen difficulty-balansering, ingen offer-state)
4. **Bygg OffersView** — baserat på AllClubsView-pattern
5. **Skapa ClubSelectionScreen** — orkestrera mellan vyerna
6. **Migrera bort NewGameScreen** — uppdatera router så ClubSelectionScreen är den nya vägen
7. **Verifiering & SPRINT_AUDIT.md**

**Opus levererar citat-poolen separat under Fas 1.** Code kan börja på allt annat — citat-poolen fylls i kontinuerligt och Code kan integrera när Opus är klar.

---

## Slut SPEC_INLEDNING_FAS_1
