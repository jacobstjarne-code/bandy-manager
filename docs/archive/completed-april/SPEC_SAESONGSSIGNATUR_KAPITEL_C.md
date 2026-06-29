# SPEC_SAESONGSSIGNATUR_KAPITEL_C — Säsongens signatur

**Datum:** 2026-04-28
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~6-8 dagars Code-arbete
**Referensmocks:** `docs/mockups/saesongssignatur_mockup.html` (produceras separat innan Code påbörjar visuella delar)
**Beroende:** Förutsätter att Portal-Fas-1 + Scene-systemet är levererade (vilket de är). Kan implementeras parallellt med Kapitel A och B — ingen direkt konflikt.

**Mocken klar:** Ja — `docs/mockups/saesongssignatur_mockup.html`

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/saesongssignatur_mockup.html` i webbläsaren.** Klicka mellan de 7 vyerna: 5 reveal-scener (en per signatur), Portal-kort, säsongsslut-rubrik. Notera att Portal-kortet tar full bredd (2 kolumner) — det är meta-information om säsongen själv, inte en av flera mätare.

2. **Läs följande filer:**
   - `src/domain/services/seasonActService.ts` — befintlig akt-struktur (4 akter per säsong)
   - `src/domain/services/clubEraService.ts` — eror över längre tid
   - `src/domain/services/seasonSummaryService.ts` — befintlig pickSeasonHighlight
   - `src/application/useCases/seasonEndProcessor.ts` — där säsongen avslutas

3. **Läs CLAUDE.md princip 4 (Mock-driven design)** och pixel-jämförelse-reglerna.

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

`docs/mockups/saesongssignatur_mockup.html` är referens. Klicka mellan 7 vyer: 5 reveal-scener, Portal-kort, säsongsslut-rubrik. Kopiera CSS-värden bokstavligen.

**Komponentkoppling till mock-vyer:**

| Komponent | Mock-referens |
|---|---|
| `SeasonSignatureRevealScene` (orkestrator) | Knapparna "Reveal · Köldvinter" / "Reveal · Skandal" / etc — hela `.scene-frame` |
| `SignatureEmoji` (intern) | `.scene-emoji` med drop-shadow-glöd |
| `SignatureTitle` (intern) | `.scene-title` med 4px letter-spacing |
| `SignatureBody` (intern) | `.scene-subtitle` + `.scene-body` |
| `SeasonSignatureSecondary` (Portal-kort) | Knappen "Portal-kort" — specifikt `.signature-secondary` (full-width, span 2) |
| `SeasonSummaryRubric` (i SeasonSummary) | Knappen "Säsongsslut-rubrik" — specifikt `.summary-rubric` med leather-bg och accent-stripe |

**Specifikt från mocken som ska kopieras bokstavligen:**

*Reveal-scen:*
- Bakgrund `var(--bg-scene-deep)`
- Atmosfär-textur: radial gradients per signatur (se `.scene-frame.cold::before` etc i mocken). Cold = blå, scandal = röd, transfer = guld, injury = brun, dream = dubbel-glow.
- Genre-tag: padding 28px 0 8px, letter-spacing 4px, opacity 0.7, `var(--accent)`
- Emoji: 64px, padding 24px 0 12px, drop-shadow `0 0 18px rgba(212,164,96,0.18)`
- Title: Georgia 26px 800, letter-spacing 4px, `var(--text-light)`
- Subtitle: Georgia 14px italic, `var(--text-light-secondary)`, padding 0 32px 24px, line-height 1.4
- Body: Georgia 13px, `var(--text-light-secondary)`, padding 8px 32px 16px, line-height 1.7
- CTA: återanvänd `SceneCTA`-komponent (samma som andra scener). Texten varierar per signatur — se `SIGNATURE_REVEAL_DATA` i datafilen.

*Portal-kort (SeasonSignatureSecondary):*
- **VIKTIGT: Full bredd, span 2 kolumner** (avviker från andra secondary-kort) — `.signature-secondary` har `grid-column: span 2`. Detta är medvetet: signaturen är meta-information om säsongen själv, inte en av flera mätare.
- Card-bakgrund `var(--bg-surface)`, border 1px `var(--border)`, border-radius 10px, padding 11px 12px
- Vänster border-stripe per signatur: `var(--cold)` / `var(--danger)` / `var(--gold)` / `var(--warm)` / `var(--accent-glow)`
- Namn: Georgia 12px 600, uppercase, letter-spacing 2px, `var(--text-light)`
- Emoji: 16px, normal letter-spacing
- Tag ("AKTIV SIGNATUR"): 8px 700 uppercase, letter-spacing 1.5px, `var(--text-muted)`
- Faktarad: 10.5px italic, `var(--text-secondary)`, line-height 1.4. Strong-spans: icke-italic, `var(--text-light)`, font-weight 600.

*Säsongsslut-rubrik (SeasonSummaryRubric):*
- Bakgrund `var(--bg-leather)`, border-left 3px `var(--accent)`, padding 16px 18px, border-radius `0 6px 6px 0`
- Emoji 22px, opacity 0.9, margin-bottom 6px
- Text: Georgia 16px, `var(--text-light)`, line-height 1.4
- Accent-spans (signatur-namnet): `var(--accent)`, font-weight 700

**Innan commit av en visuell komponent:**
- Öppna mocken och appen sida vid sida i 430px-bredd
- Skärmdumpa båda
- Bifoga i commit-meddelandet
- Sammanfattning i SPRINT_AUDIT.md

---

## Mål

Bygg ett system där varje säsong har en **signatur** — en stämning som påverkar hela säsongen och gör den unik. Tre principer:

1. **Subtila modifierare, inte stora omskakningar.** Signaturen påverkar diskreta variabler i befintliga services (skadefrekvens, väderfrekvens, transferaktivitet etc) — den bygger inga nya system.

2. **Signaturen reveal:as som scen.** Vid säsongsstart triggas en Scene som visar vilken signatur denna säsong fått. Spelaren får en *känsla* av vad som komma skall.

3. **Signaturen rubricerar säsongen efteråt.** I säsongssammanfattningen står "Detta blev köldvintern 2027 — 9 matcher i 3×30." Signatur + observerade konsekvenser = etikett som följer med säsongen i klubbens minne.

---

## Sex signaturer för Fas 1

| Signatur | Vad spelet gör annorlunda | Vad spelaren märker |
|---|---|---|
| **Köldvintern** | +30% chans på 3×30-matcher från jan till feb. Kalla väderkommentarer dominerar matchfeed. | "Vi spelar 3×30 var fjärde match nu" |
| **Skandalsäsongen** | +50% scandalEvent-frekvens (klubbar runt om), pressfrågor återkommer till skandaler | Inboxen full av rubriker, kafferummet pratar bara om andra klubbar |
| **Het transfermarknad** | +50% rumor-frekvens, +30% inkommande bud, transferdödline-stress dramatisk | Telefonen ringer hela tiden, fönstret stänger med dramatik |
| **Skadekurvan** | +25% skadefrekvens i mellansäsongen (omg 8-15) | Sjukstugan är tema, akademin behöver kliva fram |
| **Drömrundan** | Småklubbar har övertag — mindre lag tar oväntade poäng från storlag | "Vi kan göra det här"-vibe i hela ligan |
| **Lugn säsong** | Inga större avvikelser från default | Ingen särskild stämning — rutin |

**"Lugn säsong"** är default — den hamnar oftast (50% chans). De andra fem fördelas på resterande 50%.

**Viktning beroende på klubbens situation:**
- Skandalsäsong är mer sannolik om skandaler funnits senaste 2 säsongerna
- Het transfermarknad mer sannolik om transferdödline gick dramatiskt senaste säsongen
- Köldvintern slumpas frikopplat från klubb (klimat-baserat — koppla till region: norra klubbar har högre chans)

---

## Designval (bekräftade)

| Fråga | Beslut | Motivation |
|---|---|---|
| När väljs signatur? | Vid säsongsstart i `seasonStartProcessor` (eller motsvarande) | Före första omgången spelas, så modifierare gäller hela säsongen |
| Hur visas signatur? | Som Scene vid säsongsstart (en rad i `pendingScene`-systemet) | Konsekvent med övriga viktiga händelser |
| Signaturens påverkan | Diskreta modifierare i befintliga services via dependency-injection | Ingen ny kärnlogik, bara värdejusteringar |
| Lagras på SaveGame? | Ja — `currentSeasonSignature: SeasonSignature` | Behöver vara persistent över omgångar för konsekvent påverkan |
| Är "Lugn säsong" en scen? | Nej — ingen scene triggas | Lugn säsong = ingen scen, bara default-spel |
| Visa under säsongens gång? | Diskret kort i Portal som påminner: "🌨 KÖLDVINTERN" | Vid extrem signatur — påminner spelaren utan att skrika |
| Påverkar signatur ekonomi/standings? | Nej, inte direkt | Bara stämning + sannolikheter — inte tabellpunkter |

---

## Arkitekturprinciper

### Princip 1: Signaturen är data, inte logik

`SeasonSignature` är en enum-typ med modifier-spec. Varje modifier är en *koefficient* eller *flagga* som befintliga services läser. Ingen ny `seasonSignatureLogic`-fil — bara en datatabell.

### Princip 2: Befintliga services tar in signaturen som parameter

`weatherService.generateWeatherForMatch(date, signature?)` — när signatur är `'cold_winter'` får 3×30 högre sannolikhet. Liknande för `scandalService`, `rumorService`, `injuryService`, `matchEngine` (för drömrundans-effekt).

### Princip 3: Pure function för signatur-val

`pickSeasonSignature(game, rand): SeasonSignature` är pure. Tar in game-state och rand-funktion, returnerar signatur. Testbar med olika seed-värden.

### Princip 4: Reveal-scenen är en standard Scene

Använder samma infrastruktur som söndagsträning, SM-final, kafferum. Ny SceneId `season_signature_reveal`. Triggas en gång per säsong (utom för "lugn säsong" — då ingen scen).

### Princip 5: Signaturen synliggörs i SeasonSummary

Befintlig `seasonSummaryService.pickSeasonHighlight` utökas med `summarizeSignature(signature, observedFacts)` — som rubricerar säsongen baserat på vad som faktiskt hände. "Detta blev köldvintern 2027 — 9 matcher i 3×30, 4 inställda matcher."

---

## Dataarkitektur

### Filer som ska skapas

#### `src/domain/entities/SeasonSignature.ts`

```typescript
export type SeasonSignatureId =
  | 'calm_season'
  | 'cold_winter'
  | 'scandal_season'
  | 'hot_transfer_market'
  | 'injury_curve'
  | 'dream_round'

export interface SeasonSignatureModifiers {
  /** Sannolikhet 0-1 för 3×30 vid extrem kyla. Default 0.05. */
  threeBy30Probability?: number

  /** Multiplikator på scandal-frekvens. Default 1.0. */
  scandalFrequencyMultiplier?: number

  /** Multiplikator på rumor-frekvens. Default 1.0. */
  rumorFrequencyMultiplier?: number

  /** Multiplikator på inkommande bud. Default 1.0. */
  incomingBidMultiplier?: number

  /** Multiplikator på skadefrekvens i mellansäsongen (omg 8-15). Default 1.0. */
  midSeasonInjuryMultiplier?: number

  /** Boost för underdog-team i matchEngine. 0 = ingen boost. */
  underdogBoost?: number
}

export interface SeasonSignature {
  id: SeasonSignatureId
  modifiers: SeasonSignatureModifiers
  startedSeason: number
  observedFacts: string[]   // ackumuleras under säsongen, används i summary
}

/**
 * Definitionen av varje signatur.
 * Detta är konstant data, inte logik.
 */
export const SEASON_SIGNATURE_DEFS: Record<SeasonSignatureId, SeasonSignatureModifiers> = {
  calm_season: {},
  cold_winter: {
    threeBy30Probability: 0.30,
  },
  scandal_season: {
    scandalFrequencyMultiplier: 1.5,
  },
  hot_transfer_market: {
    rumorFrequencyMultiplier: 1.5,
    incomingBidMultiplier: 1.3,
  },
  injury_curve: {
    midSeasonInjuryMultiplier: 1.25,
  },
  dream_round: {
    underdogBoost: 0.15,
  },
}
```

**Krav:**
- Ren typdefinition + datatabell
- Filen max ~80 rader

#### `src/domain/services/seasonSignatureService.ts`

```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { SeasonSignature, SeasonSignatureId } from '../entities/SeasonSignature'
import { SEASON_SIGNATURE_DEFS } from '../entities/SeasonSignature'

/**
 * Väljer säsongssignatur för en kommande säsong.
 * Pure function — tar rand som parameter.
 *
 * Viktning:
 *   calm_season:        50%  (default)
 *   cold_winter:        12%  (höjs till 18% för norra klubbar)
 *   scandal_season:     10%  (höjs till 18% om skandaler funnits senaste 2 säsongerna)
 *   hot_transfer_market: 10%  (höjs till 16% om transferfönstret var dramatiskt)
 *   injury_curve:        9%
 *   dream_round:         9%
 */
export function pickSeasonSignature(game: SaveGame, rand: () => number): SeasonSignatureId {
  // Implementation: viktad slumpning baserat på klubb-historik
}

/**
 * Bygger en ny SeasonSignature för aktuell säsong.
 * Anropas av seasonStartProcessor.
 */
export function createSeasonSignature(game: SaveGame, rand: () => number): SeasonSignature {
  const id = pickSeasonSignature(game, rand)
  return {
    id,
    modifiers: SEASON_SIGNATURE_DEFS[id],
    startedSeason: game.currentSeason,
    observedFacts: [],
  }
}

/**
 * Lägger till ett observerat faktum till säsongens signatur.
 * Anropas av services när relevanta händelser sker.
 *
 * Exempel:
 *   recordSignatureFact(game, '3x30 mot Söderfors')
 *   recordSignatureFact(game, 'inställd match: regn på Forsvallen')
 */
export function recordSignatureFact(game: SaveGame, fact: string): SaveGame {
  // Implementation
}

/**
 * Genererar säsongsslutets rubricerande mening.
 * Anropas av seasonSummaryService.
 *
 * Exempel:
 *   "Detta blev köldvintern 2027 — 9 matcher i 3×30, 4 inställda matcher."
 *   "Skandalsäsongen 2028 — fyra klubbar drabbades, lokaltidningarna skrev om inget annat."
 *   "Lugn säsong — utan dramatiska avvikelser." (om calm_season)
 */
export function summarizeSignature(signature: SeasonSignature): string {
  // Implementation: mall per signatur, fyller i från observedFacts
}
```

**Krav:**
- Pure functions, ingen randomness annat än via parameter
- Max ~150 rader
- Tester: minst 8 fall (alla 6 signaturer + viktning + edge cases)

#### `src/domain/data/scenes/seasonSignatureReveal.ts`

Datafil för Scene-vyn.

```typescript
import type { SeasonSignatureId } from '../../entities/SeasonSignature'

export interface SignatureRevealData {
  emoji: string
  title: string             // "KÖLDVINTERN"
  subtitle: string          // "Vintern 2027 ser ut att bli kallare än vanligt."
  body: string              // 2-3 raders prosa om vad som väntar
  ctaText: string           // "Då kör vi"
}

export const SIGNATURE_REVEAL_DATA: Record<SeasonSignatureId, SignatureRevealData> = {
  calm_season: {
    emoji: '',
    title: '',
    subtitle: '',
    body: '',
    ctaText: '',
  },  // visas inte som scen
  cold_winter: {
    emoji: '🌨',
    title: 'KÖLDVINTERN',
    subtitle: 'Vintern ser ut att bli kallare än vanligt.',
    body: 'Långtidsprognosen pekar på minusgrader långt in i mars. Tre-gånger-trettio är att vänta. Klubborna har redan beställt fler.',
    ctaText: 'Då kör vi',
  },
  scandal_season: {
    emoji: '📰',
    title: 'SKANDALSÄSONGEN',
    subtitle: 'Förbundet är skakat innan säsongen börjat.',
    body: 'Fyra klubbar har redan haft offentliga gräl i sommar. Lokaltidningarna kommer skriva om allt utom bandyn. Fokusera på spelet.',
    ctaText: 'Vi håller oss utanför',
  },
  hot_transfer_market: {
    emoji: '💼',
    title: 'HET TRANSFERMARKNAD',
    subtitle: 'Pengarna har börjat flöda i ligan.',
    body: 'Sponsorer har sökt sig till bandyn och plötsligt finns det budgetar att räkna med. Telefonen kommer ringa. Fönstret kommer stänga med dramatik.',
    ctaText: 'Sätt en plan',
  },
  injury_curve: {
    emoji: '🩹',
    title: 'SKADEKURVAN',
    subtitle: 'Mellansäsongens skadeperiod blir tuff.',
    body: 'Höstens första hårda matcher har redan tagit ut sitt — fysioterapeuterna varnar för kommande veckor. Akademin behöver kliva fram.',
    ctaText: 'Förbered laget',
  },
  dream_round: {
    emoji: '✨',
    title: 'DRÖMRUNDAN',
    subtitle: 'Småklubbarna spelar över sin förmåga.',
    body: 'Något har hänt i bandyn. Underdogs vinner. Storlagen tappar oväntat. Det här är säsongen där allt kan hända — också för er.',
    ctaText: 'Vi tar vår chans',
  },
}
```

**Krav:**
- All svensk text lever här
- Filen max ~100 rader
- Inga personnamn eller klubbnamn (signaturerna är generiska)

### Filer som ska skapas — Komponenter

```
src/presentation/screens/scenes/
├── SeasonSignatureRevealScene.tsx   (~120 rader)

src/presentation/components/portal/secondary/
├── SeasonSignatureSecondary.tsx     (~60 rader, Portal-kort som påminner om aktiv signatur)
```

**Krav:**
- Filer under 150 rader
- Använder `SceneHeader`, `SceneCTA` från shared/
- SeasonSignatureRevealScene visas inte för 'calm_season'

### Filer som ska modifieras

#### `src/domain/entities/SaveGame.ts`

Lägg till:

```typescript
interface SaveGame {
  // befintliga + från andra specer
  currentSeasonSignature?: SeasonSignature
  pastSeasonSignatures?: SeasonSignature[]   // för historik (används i Klubbminnet senare)
}
```

Lägg till på SceneId:

```typescript
export type SceneId =
  | 'sunday_training'
  | 'sm_final_victory'
  | 'coffee_room'
  | 'journalist_relationship'
  | 'season_signature_reveal'   // NY
```

#### `src/domain/services/sceneTriggerService.ts`

Lägg till case för season_signature_reveal i `detectSceneTrigger`:

```typescript
if (shouldTriggerSeasonSignature(game)) return 'season_signature_reveal'

function shouldTriggerSeasonSignature(game: SaveGame): boolean {
  // Triggar bara EN gång per säsong, vid omgång 1, om signatur ej är 'calm_season'
  if (game.currentMatchday !== 1) return false
  if ((game.shownScenes ?? []).includes('season_signature_reveal_' + game.currentSeason)) return false
  if (!game.currentSeasonSignature) return false
  if (game.currentSeasonSignature.id === 'calm_season') return false
  return true
}
```

Notera: `shownScenes` flagga ska innehålla `season_signature_reveal_${season}` så att signaturen kan visas på nytt nästa säsong även om signaturtypen är samma.

#### `src/application/useCases/seasonStartProcessor.ts` (eller motsvarande)

Vid säsongsstart — innan första omgången körs:

```typescript
// I säsongsstart-logiken:
game.currentSeasonSignature = createSeasonSignature(game, rand)
```

Där `rand` är samma deterministiska randomness-funktion som används i resten av spelet.

#### Befintliga services som tar in signaturen

**weatherService.ts:**
```typescript
import type { SeasonSignature } from '../entities/SeasonSignature'

export function generateWeatherForMatch(
  date: string,
  region: string,
  signature?: SeasonSignature,
): Weather {
  const baseProb = 0.05
  const sigBoost = signature?.modifiers.threeBy30Probability ?? baseProb
  // använd sigBoost istället för baseProb i 3×30-beslut
}
```

**scandalService.ts** — tar in `signature?` som parameter, multiplicerar `scandalFrequencyMultiplier` på base-frekvensen.

**rumorService.ts** — samma princip, använder `rumorFrequencyMultiplier`.

**transferService.ts** (incoming bids-delen) — använder `incomingBidMultiplier`.

**injuryService.ts** — i mellansäsongs-fönstret (omg 8-15), multiplicera `midSeasonInjuryMultiplier`.

**matchEngine.ts** — om underdog-team möter ett favorit-team, addera `underdogBoost` till underdog:s effective styrka.

**Code identifierar exakta integration-punkter och bekräftar med Opus innan ändring.** Punkter som blir oklara — fråga.

#### `src/domain/services/seasonSummaryService.ts`

I `pickSeasonHighlight` (eller där säsongssammanfattning genereras) — anropa `summarizeSignature(game.currentSeasonSignature)` och lägg till sammanfattningens första rad eller egen sektion.

#### `src/domain/services/portal/dashboardCardBag.ts`

Lägg till nytt secondary-kort:

```typescript
{
  id: 'season_signature_card',
  tier: 'secondary',
  weight: 40,                         // mellan tabell (30) och klacken (50)
  triggers: [hasActiveExtremeSignature],
  Component: SeasonSignatureSecondary,
}
```

`hasActiveExtremeSignature` returnerar true om signatur ≠ 'calm_season' OCH spelaren inte stängt påminnelsen denna säsong.

---

## Skärmflöde

### Vid säsongsstart (omgång 1)
```
seasonStartProcessor körs
    ↓
game.currentSeasonSignature = createSeasonSignature(game, rand)
    ↓
roundProcessor körs för omgång 1
    ↓
detectSceneTrigger upptäcker 'season_signature_reveal'
    ↓
game.pendingScene = { sceneId: 'season_signature_reveal', triggeredAt: ... }
    ↓
Spelaren öppnar Portal → SceneScreen tar över
    ↓
SeasonSignatureRevealScene renderar baserat på signaturens id
    ↓
Spelaren läser, klickar CTA ("Då kör vi" / "Sätt en plan" / etc)
    ↓
shownScenes.push('season_signature_reveal_' + currentSeason)
    ↓
Tillbaka till Portal — säsongssignatur-kortet visas nu i secondary-tier
```

### Under säsongen
- `SeasonSignatureSecondary` visas i Portal som påminnelse om aktiv signatur
- Mockens visuella behandling visar emoji + namn + en rad om vad signaturen innebär just nu

### Vid säsongsslut
- `seasonSummaryService` anropar `summarizeSignature(game.currentSeasonSignature)` → första raden i SeasonSummary blir signatur-rubrik
- Signaturen flyttas till `pastSeasonSignatures` för Klubbminnet att kunna referera senare

---

## Tester

### Unit-tester

- `seasonSignatureService.test.ts`
  - `pickSeasonSignature` returnerar 'calm_season' med ~50% sannolikhet över 1000 körningar
  - Norra klubbar får 'cold_winter' oftare
  - Skandaler senaste säsongerna höjer 'scandal_season'-sannolikhet
  - `summarizeSignature` returnerar rätt mall för varje signatur-id
  - `recordSignatureFact` lägger till fakta korrekt

### Integration-tester

- `roundProcessor.test.ts` — verifiera att `weatherService` får signatur-parameter och att 3×30 är högre vid 'cold_winter'
- `SeasonSignatureRevealScene.test.tsx` — renderar rätt text för varje signatur

### Visuell verifiering

- Starta nytt spel
- Spela första omgången — verifiera att reveal-scen kommer (om signatur ≠ calm)
- Spela genom säsongen — verifiera att modifierare märks (mer 3×30 vid cold, mer skandaler vid scandal, etc)
- Vid säsongsslut — verifiera att SeasonSummary rubricerar säsongen

---

## Verifieringsprotokoll

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger**
3. **Filstorlekar** — alla nya filer under 150 rader (entitet under 80, service under 150, datafil under 100)
4. **Pure functions** — manuell granskning av signature-service
5. **PIXEL-JÄMFÖRELSE PER KOMPONENT — COMMIT-BLOCKER:**
   - SeasonSignatureRevealScene → mock → screenshot → commit
   - SeasonSignatureSecondary → mock → screenshot → commit
6. **CSS-token-disciplin på mörka komponenter**
7. **SPRINT_AUDIT.md** — verifierat i UI med pixel-jämförelse

---

## Vad som SKA INTE göras i Fas 1

- Inga signaturer utöver de 6 listade. Inga "Värmebölja", "Strejk i ligan", "Pandemi" — det är Fas 2.
- Ingen kombinerad signatur (en säsong = en signatur). Multipla samtidiga signaturer är Fas 2.
- Ingen retroaktiv signatur (kan inte ändras mid-season). Den sätts vid start, gäller hela säsongen.
- Inga signaturer som påverkar standings/poäng direkt — bara stämning och sannolikheter.
- Ingen UI för att *välja* signatur — den är slumpad.
- Ingen koppling till Klubbminnet i Fas 1 (även om `pastSeasonSignatures` finns) — det är där Klubbminne-Fas 2 lyfter in den.

---

## Återanvändning av befintliga komponenter — kritiskt

**Använd existerande SceneCTA, SceneHeader.** Bygg inte nya.

**Använd existerande Portal secondary-kort-pattern.** SeasonSignatureSecondary följer samma anatomi som JournalistSecondary (om den specen är levererad) eller TabellSecondary.

**Modifierare på befintliga services är dependency-injection — inte refactor.** Lägg till `signature?` som optional parameter i befintliga function-signaturer. Inga services *bygger om* — de tar en extra input och multiplicerar.

---

## Frågor till Code som ska besvaras innan implementation

1. **Var sker säsongsstart-logiken idag?** `createNewGame.ts` (för spel 1) och vad/var för efterföljande säsonger? Detta är där signaturen ska skapas.
2. **Hur lagras `region` per klubb?** Behövs för att vikta cold_winter mot norra klubbar.
3. **Var sker `pickSeasonHighlight`?** För integration av `summarizeSignature`.
4. **Vad heter den service som genererar väder-typ per match (3×30 vs normal)?** För modifier-injection.
5. **Hur skiljer sig `mid-season-injury` från övrig skadefrekvens i `injuryService`?** Vi behöver veta för att kunna applicera `midSeasonInjuryMultiplier` korrekt.

---

## Leverans-ordning rekommenderas

1. **Datatyper** — `SeasonSignature.ts` entity, utöka SaveGame, utöka SceneId
2. **Service** — `seasonSignatureService.ts` med tester. INGEN UI.
3. **Datafil** — `seasonSignatureReveal.ts` med svenska texter
4. **Reveal-scen** — `SeasonSignatureRevealScene.tsx` mot mock
5. **Portal-kort** — `SeasonSignatureSecondary.tsx` mot mock
6. **Trigger-integration** — uppdatera sceneTriggerService
7. **Säsongsstart-integration** — `createSeasonSignature` anropas i seasonStartProcessor
8. **Modifier-injection** — väder, scandal, rumor, transfer, injury, matchEngine en åt gången
9. **Säsongssammanfattning** — `summarizeSignature` integreras i seasonSummaryService
10. **Verifiering & SPRINT_AUDIT.md**

Steg 1-3 har ingen visuell output. Steg 4 är första gången reveal-scenen kan ses. Steg 5 är Portal-kortet. Steg 7-8 är där modifierarna börjar märkas. Steg 9 är där säsongen rubriceras efteråt.

---

## Slut SPEC_SAESONGSSIGNATUR_KAPITEL_C
