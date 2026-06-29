# SPEC_PORTAL_FAS_1

**Datum:** 2026-04-27
**Författare:** Opus
**Status:** Spec-klar för Code
**Beräknad omfattning:** ~7-10 dagars Code-arbete
**Referensmocks:** `docs/mockups/portal_bag_mockup.html` + `docs/mockups/bag_architecture_mockup.html`
**Beroende:** Förutsätter att SPEC_INLEDNING_FAS_1 är levererad (men kan implementeras parallellt)

---

## INNAN DU BÖRJAR — OBLIGATORISKT

1. **Öppna `docs/mockups/portal_bag_mockup.html` i webbläsaren.** Klicka mellan de fyra tillstånden (routine, derby, deadline, SM-final). Notera hur layouten *ändrar karaktär* baserat på state — inte bara byter färg, utan har olika komponentanatomi.

2. **Öppna `docs/mockups/bag_architecture_mockup.html` i webbläsaren.** Bocka i kryssrutorna och se hur kort blir eligible/primary baserat på game state. Det är så algoritmen ska fungera i produktion.

3. **Läs `docs/SESSION_SUMMARY_2026-04-27.md`** — sektionen om "Det nya UX-paradigmet" förklarar designtanken bakom Portal.

4. **Läs `docs/UX_OMTAENKNING_2026-04-27.md`** för full designkontext.

---

## MOCKEN ÄR KANON — INTE UNGEFÄRLIG

Denna sektion är hård. Läs den.

Mocken (`portal_bag_mockup.html`) är inte en *idé* om hur det ska se ut. Den är *specifikationen* för hur det ska se ut. När du implementerar en primary-komponent eller secondary-komponent ska du:

1. **Ha mocken öppen i en flik bredvid din editor.** Inte i minnet. Inte "jag kommer ihåg ungefär". Bredvid editorn, hela tiden.

2. **Kopiera CSS-värden bokstavligen.** Padding, border-radius, font-storlekar, gradient-stops, opacity-värden, gap-värden — allt som finns i mockens CSS ska kopieras till komponenten. Inte ungefärligt. Inte "liknande". Bokstavligen.

   Exempel — primary-card för SM-final i mocken har:
   ```css
   background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(212,164,96,0.20) 100%);
   border-color: var(--gold);
   padding: 14px 16px;
   ```
   `SMFinalPrimary.tsx` ska ha *exakt* dessa värden. Inte 12px. Inte 0.18. Inte rgba(212,164,90,0.20).

3. **Varje primary-komponent har sin tydliga referens i mocken.** Tabell:

   | Primary-komponent | Mock-referens |
   |---|---|
   | `NextMatchPrimary` | Knappen "Routine" i `portal_bag_mockup.html` |
   | `DerbyPrimary` | Knappen "Derby" |
   | `TransferDeadlinePrimary` | Knappen "Transfer-deadline" |
   | `SMFinalPrimary` | Knappen "SM-final" |
   | `PatronDemandPrimary` | Inte i mocken — använd same anatomi som DerbyPrimary men med röd ton istället för guld. Fråga Opus om mock behövs innan implementation. |
   | `EventPrimary` | Inte i mocken — använd `card-sharp` med danger-border. Fråga Opus om mock behövs. |

4. **Innan du committar en komponent — öppna appen och mocken sida vid sida.** Ta en skärmdump. Jämför pixelnivå. Om det inte matchar — antingen är komponenten fel, eller är mocken fel (säg till Opus). Lös innan commit.

5. **Visuell verifiering är inte "det fungerar".** Det är "det matchar mocken". En knapp som triggar rätt navigering men har fel padding är inte färdig.

---

## Mål

Ersätt nuvarande `DashboardScreen.tsx` (~770 rader monolit) med en **Portal**-arkitektur baserad på bag-of-cards. Portalen är *kontextuell* — innehållet bestäms av vad som händer just nu i spelet, inte av en fast layout.

**Tre huvudprinciper:**

1. **Bag-of-cards.** Dashboarden är inte 8 fasta sektioner. Det är en pool av möjliga kort där triggers + weights bestämmer vilka som visas just nu.

2. **Tre tiers.** Portal har exakt **1 primary card** (det viktigaste idag), **0-3 secondary cards** (kontextuella signaler), **0-4 minimal status** (komprimerad info-rad). Allt annat foldas under "Mer info"-knapp.

3. **Glidande tonalitets-CSS.** Bakgrundsfärger interpoleras kontinuerligt baserat på datum (Alt C). Säsongen *känns* som en kontinuerlig resa.

---

## Designval (bekräftade)

| Fråga | Beslut | Motivation |
|---|---|---|
| Var lever bagen? | Statisk array i `dashboardCardBag.ts` | Enklast för Fas 1, migrerar till modulär aggregator senare om bagen växer förbi ~30 kort |
| Vad händer vid tie i weight? | Slumpa med season+matchday som seed | Variation utan icke-determinism, samma seed-mönster som specialDateService |
| Måste det alltid finnas primary? | Ja — fallback "Nästa match" alltid eligible | Aldrig tom skärm, alltid en CTA |
| Matchday vs mellan-matcher? | Triggers tar hand om det själva | Inte separat mekanism — `(game) => daysUntilNextMatch(game) === 1` är en trigger som vilken annan |
| Tonalitets-CSS? | Glidande interpolering över datum (Alt C) | Spelaren ska *känna* säsongens kontinuitet |
| Risk att bagen blir enahanda? | Varje primary-card-id pekar på sin egen renderingskomponent | De delar tier men inte visuell anatomi — SMFinalPrimary, DerbyPrimary, DeadlinePrimary är distinkta komponenter |

---

## Arkitekturprinciper (kritiska — bryt inte mot dessa)

### Princip 1: Inga monolitiska komponenter

`DashboardScreen.tsx` är idag ~770 rader. Det får **inte** ersättas med en lika stor `PortalScreen.tsx`. Portal består av många små filer som var för sig är under ~150 rader.

### Princip 2: Datatypen styr arkitekturen

`DashboardCard`-typen definieras i en enda fil (`dashboardCardBag.ts`). Varje kort har `id`, `tier`, `weight`, `triggers[]`, och pekar på sin renderingskomponent. Algoritmen `buildPortal()` är ren funktion av `(game, seed) → PortalLayout`.

### Princip 3: Triggers är rena funktioner

Varje trigger är `(game: SaveGame) => boolean`. De är testbara isolerat. Inga side effects. Inga store-anrop. Bara läsa game-state och returnera true/false.

### Princip 4: Renderingskomponenter får INTE veta om bag-systemet

`SMFinalPrimary.tsx` får inte importera från `dashboardCardBag.ts` eller känna till weight/triggers. Den får game-state som prop och renderar baserat på den. Detta gör att komponenter kan testas isolerat och återanvändas i andra sammanhang (t.ex. moments).

### Princip 5: Tonalitets-CSS är en pure function av datum

`getSeasonalTone(date: string): SeasonalTone` är en pure function. Inga globala mutations. Setts som CSS-variabler i en effect i `PortalScreen.tsx` när date ändras (typ vid omgångsövergång).

### Princip 6: DashboardScreen.tsx tas inte bort i Fas 1

Behåll DashboardScreen.tsx som fallback under utveckling. Lägg PortalScreen.tsx på en feature flag (`game.portalEnabled` eller liknande) tills den är stabil. När alla tester gröna och playtest verifierat — ta bort DashboardScreen i Fas 2.

### Princip 7: Återanvänd existerande kort där det går

Existerande komponenter i `src/presentation/components/dashboard/` (NextMatchCard, DailyBriefing, OrtenSection, PlayoffBracketCard, CupCard) ska *återanvändas* — inte byggas om. De wrappas i bag-system som primary/secondary cards.

---

## Dataarkitektur

### Filer som ska skapas

#### `src/domain/services/portal/dashboardCardBag.ts`

Definitionen av alla kort i bagen.

```typescript
import type { SaveGame } from '../../entities/SaveGame'
import type { ComponentType } from 'react'

export type CardTier = 'primary' | 'secondary' | 'minimal'

export type TriggerFn = (game: SaveGame) => boolean

export interface CardRenderProps {
  game: SaveGame
}

export interface DashboardCard {
  /** Stabil identifierare. Används för deterministisk slumpning vid tie. */
  id: string

  /** Vilken zon i Portal kortet kan dyka upp i. */
  tier: CardTier

  /** Prioritet inom tier. Högre vinner. 0-100. */
  weight: number

  /**
   * Alla triggers måste returnera true för att kortet ska vara eligible.
   * En trigger som alltid returnerar true gör kortet alltid eligible (default-fallback).
   */
  triggers: TriggerFn[]

  /**
   * Renderingskomponent för kortet. Får game-state som prop.
   * Komponenten får INTE känna till weight/triggers eller importera från denna fil.
   */
  Component: ComponentType<CardRenderProps>
}

export const CARD_BAG: DashboardCard[] = [
  // Definieras nedan i avsnitt "Initiala kort i bagen"
]
```

**Krav:**
- Filen exporterar `CARD_BAG`-arrayen
- Inga renderingskomponenter definieras i filen — bara importeras från sina egna filer
- Filen ska inte vara över ~80 rader (definitioner + array)

#### `src/domain/services/portal/portalBuilder.ts`

Algoritmen som bygger Portal-layouten.

```typescript
import type { SaveGame } from '../../entities/SaveGame'
import type { DashboardCard } from './dashboardCardBag'
import { CARD_BAG } from './dashboardCardBag'

export interface PortalLayout {
  primary: DashboardCard           // alltid exakt 1
  secondary: DashboardCard[]       // 0-3
  minimal: DashboardCard[]         // 0-4
}

/**
 * Beräknar vilka kort som ska renderas just nu baserat på game state.
 *
 * Algoritm:
 *   1. Filtrera bagen — bara kort vars triggers alla returnerar true
 *   2. Gruppera per tier
 *   3. Sortera per weight (högst först)
 *   4. Vid tie i weight, använd seed för deterministisk ordning
 *   5. Plocka ut topp N från varje tier
 */
export function buildPortal(game: SaveGame, seed: number): PortalLayout {
  // Implementation
}

/**
 * Hjälpfunktion för deterministisk seed.
 * Kombinerar season + matchday för stabil ordning som ändras vid omgångsövergång.
 */
export function makeSeed(game: SaveGame): number {
  return game.currentSeason * 100 + (game.currentMatchday ?? 0)
}
```

**Krav:**
- Helt deterministisk — samma `(game, seed)` ger alltid samma `PortalLayout`
- Inga side effects
- Tester: minst 6 olika game-states verifierar att rätt kort triggar
- Filen ska inte vara över ~80 rader

#### `src/domain/services/portal/seasonalTone.ts`

Glidande tonalitets-CSS baserad på datum.

```typescript
export interface SeasonalTone {
  bgPrimary: string       // huvudbakgrund
  bgSurface: string       // kortbakgrund
  bgElevated: string      // upphöjd bakgrund
  accentTone: string      // accent-färg som kan skifta något
}

const SEASON_KEYFRAMES: { dayOfSeason: number; tone: SeasonalTone }[] = [
  { dayOfSeason: 0,   tone: { /* 1 sep — varm höst */ } },
  { dayOfSeason: 60,  tone: { /* 1 nov — kyligare */ } },
  { dayOfSeason: 120, tone: { /* 1 jan — djup vinter */ } },
  { dayOfSeason: 180, tone: { /* 1 mars — slutspelsskärpa */ } },
  { dayOfSeason: 210, tone: { /* 1 april — sista resterna */ } },
]

/**
 * Returnerar interpolerade CSS-färgvärden baserat på dag i säsongen.
 * Säsongen räknas från 1 september (dayOfSeason = 0).
 */
export function getSeasonalTone(date: string): SeasonalTone {
  const day = dayOfSeason(date)
  // Hitta de två keyframes som omger day, interpolera mellan dem
}

function dayOfSeason(date: string): number {
  // Beräkna dagar sedan 1 september aktuell/föregående säsong
}

function lerpColor(from: string, to: string, t: number): string {
  // Linjär interpolering mellan två hex-färger
}
```

**Krav:**
- Pure function — inga side effects
- Returnerar CSS-strängar (typ `'#1a1612'`)
- Tester: snapshots vid 5 kända datum (1 sep, 1 nov, 1 jan, 1 mars, 1 maj) verifierar att värden ligger i förväntat intervall
- Filen ska inte vara över ~100 rader

### Filer som ska skapas — Renderingskomponenter

Varje primary-card-id pekar på sin egen renderingskomponent.

```
src/presentation/components/portal/
├── PortalScreen.tsx                  (~80 rader, orkestrering)
├── PortalSecondarySection.tsx        (~40 rader, grid av 0-3 secondary cards)
├── PortalMinimalBar.tsx              (~40 rader, status-rad med 0-4 minimal cards)
│
├── primary/
│   ├── NextMatchPrimary.tsx          (~80 rader, default — wrappar NextMatchCard)
│   ├── DerbyPrimary.tsx              (~100 rader, derby-specifik primary)
│   ├── SMFinalPrimary.tsx            (~120 rader, SM-final-specifik primary)
│   ├── TransferDeadlinePrimary.tsx   (~100 rader, transferdeadline-specifik)
│   ├── PatronDemandPrimary.tsx       (~80 rader, patron-konflikt)
│   └── EventPrimary.tsx              (~80 rader, kritiskt event som behöver svar)
│
├── secondary/
│   ├── OpponentFormSecondary.tsx     (~50 rader)
│   ├── InjuryStatusSecondary.tsx     (~50 rader)
│   ├── OpenBidsSecondary.tsx         (~50 rader)
│   ├── TabellSecondary.tsx           (~50 rader, wrappar tabellfakta)
│   ├── EkonomiSecondary.tsx          (~50 rader)
│   └── KlackenSecondary.tsx          (~80 rader, wrappar klacken-data)
│
└── minimal/
    ├── SquadStatusMinimal.tsx        (~30 rader)
    ├── FormStatusMinimal.tsx         (~30 rader)
    ├── KlackenMoodMinimal.tsx        (~30 rader)
    └── EconomyMinimal.tsx            (~30 rader)
```

**Krav:**
- Ingen fil över 150 rader (de flesta under 100)
- Varje komponent får `game: SaveGame` som prop
- Komponenter får navigera via `useNavigate`
- Komponenter får importera från `domain/services/` och `domain/data/` enligt befintliga mönster
- Komponenter får INTE importera från `dashboardCardBag.ts` eller `portalBuilder.ts`

### Filer som ska skapas — Trigger-funktioner

```
src/domain/services/portal/triggers/
├── matchTriggers.ts          (~60 rader)
├── transferTriggers.ts       (~40 rader)
├── patronTriggers.ts         (~30 rader)
├── eventTriggers.ts          (~40 rader)
└── stateTriggers.ts          (~60 rader, generiska — hasInjuredStarters, etc)
```

Varje triggerfunktion är `(game: SaveGame) => boolean`. Exempel:

```typescript
// matchTriggers.ts
import type { SaveGame } from '../../../entities/SaveGame'
import { isDerby } from '../../rivalryService'

export function nextMatchIsDerby(game: SaveGame): boolean {
  const next = nextManagedFixture(game)
  if (!next) return false
  const opponent = next.homeClubId === game.managedClubId ? next.awayClubId : next.homeClubId
  return isDerby(game, game.managedClubId, opponent)
}

export function nextMatchIsSMFinal(game: SaveGame): boolean {
  // ...
}

export function daysUntilNextMatch(game: SaveGame): number {
  // ...
}

export function alwaysTrue(_game: SaveGame): boolean {
  return true
}
```

**Krav:**
- Pure functions — inga side effects, ingen randomness
- Helt isolerade — varje trigger ska kunna testas utan att rendera UI
- Tester: minst 3-5 game-states per trigger som verifierar true/false

### Initiala kort i bagen — Fas 1 leverans

För Fas 1 levereras följande kort. Räkna med ~15 totalt.

**Primary tier:**

| ID | Weight | Triggers | Renderingskomponent | Beskrivning |
|---|---|---|---|---|
| `next_match_smfinal` | 100 | nextMatchIsSMFinal | SMFinalPrimary | SM-final imorgon |
| `event_critical` | 95 | hasCriticalEvent | EventPrimary | Kritiskt event behöver svar |
| `transfer_deadline_close` | 90 | transferDeadlineWithin3Rounds | TransferDeadlinePrimary | Deadline ≤3 omgångar |
| `next_match_derby` | 80 | nextMatchIsDerby | DerbyPrimary | Derby imorgon |
| `patron_demand_unmet` | 70 | patronDemandUnmetOver3Rounds | PatronDemandPrimary | Patron-konflikt |
| `next_match` | 10 | alwaysTrue | NextMatchPrimary | Default-fallback |

**Secondary tier:**

| ID | Weight | Triggers | Beskrivning |
|---|---|---|---|
| `open_bids` | 80 | hasOpenBids | Bud kräver svar |
| `injury_status` | 70 | hasInjuredStarters | Skadade i startelvan |
| `opponent_form` | 60 | nextMatchIsBigGame | Motståndarens form |
| `tabell` | 30 | alwaysTrue | Tabell (fallback) |
| `ekonomi` | 25 | alwaysTrue | Kassa (fallback) |
| `klacken` | 50 | nextMatchIsHome | Klacken inför hemmamatch |

**Minimal tier:**

| ID | Weight | Triggers | Beskrivning |
|---|---|---|---|
| `squad_status` | 50 | alwaysTrue | Trupp 17/19 |
| `form_status` | 40 | alwaysTrue | Form 71 |
| `klacken_mood_minimal` | 60 | nextMatchIsDerby | Klacken peppad (derby) |
| `economy_minimal` | 30 | alwaysTrue | Kassa-rad |

**Antal kort i Fas 1: 16 totalt** (6 primary, 6 secondary, 4 minimal). Räkna med att fler tillkommer i Fas 2 (moments-kort, kafferums-kort, träningsplan-kort, akademi-kort, etc).

### Återanvändning av befintliga komponenter

Wrappa befintliga komponenter — bygg inte om dem.

| Befintlig komponent | Återanvänds som |
|---|---|
| `NextMatchCard` | Wrappas av `NextMatchPrimary` |
| `DailyBriefing` | Inte i Fas 1 — flyttas till en framtida secondary-zon |
| `OrtenSection` | Inte i Fas 1 — flyttas till "Mer info"-fold |
| `PlayoffBracketCard` | Wrappas av framtida `PlayoffPrimary` (Fas 2) |
| `CupCard` | Wrappas av framtida `CupSecondary` (Fas 2) |
| `CareerStatsCard` | Inte i Fas 1 — i "Mer info"-fold |

**Wrappers ska vara enkla.** Ex:

```tsx
// NextMatchPrimary.tsx
export function NextMatchPrimary({ game }: CardRenderProps) {
  // Beräkna nextFixture, opponent, isHome osv (samma logik som dashboard idag)
  const nextFixture = useNextManagedFixture(game)
  // ...
  return (
    <NextMatchCard
      nextFixture={nextFixture}
      opponent={opponent}
      isHome={isHome}
      club={club}
      game={game}
      // ... samma props som idag
    />
  )
}
```

---

## Skärmflöde

### PortalScreen ersätter DashboardScreen som default-vy

I router (`AppRouter.tsx` eller motsvarande):

```tsx
// Innan
<Route path="/game" element={<DashboardScreen />} />

// Efter
<Route path="/game" element={
  game.portalEnabled ? <PortalScreen /> : <DashboardScreen />
} />
```

Feature flag `portalEnabled` defaultar till `false` under utveckling. När alla tester gröna och playtest verifierat sätts den till `true` permanent.

### PortalScreen-orkestrering

```tsx
// PortalScreen.tsx (~80 rader)
export function PortalScreen() {
  const game = useGameStore(s => s.game)
  if (!game) return <Loading />

  const seed = makeSeed(game)
  const layout = useMemo(() => buildPortal(game, seed), [game, seed])

  // Sätt CSS-vars för seasonal tone
  useEffect(() => {
    const tone = getSeasonalTone(game.currentDate)
    document.documentElement.style.setProperty('--bg-portal', tone.bgPrimary)
    document.documentElement.style.setProperty('--bg-portal-surface', tone.bgSurface)
    // ... etc
  }, [game.currentDate])

  const Primary = layout.primary.Component
  return (
    <div className="portal-screen">
      <Primary game={game} />
      <PortalSecondarySection cards={layout.secondary} game={game} />
      <PortalMinimalBar cards={layout.minimal} game={game} />
      <CTASection game={game} />
      <MoreInfoFold game={game} />
    </div>
  )
}
```

**Krav:**
- PortalScreen.tsx ska inte vara över 100 rader
- All logik för "vad ska renderas?" ligger i `buildPortal()`, inte i komponenten

---

## Tonalitets-CSS — Alt C (glidande)

### Nyckeltidpunkter (5 stycken)

Definiera 5 keyframes över säsongen. Mellan dem interpoleras alla färgvärden linjärt.

| Datum | dayOfSeason | Karaktär |
|---|---|---|
| 1 september | 0 | Varm höst — accent ljusare, bakgrund varmare |
| 1 november | 60 | Övergång — kyligare ton |
| 1 januari | 120 | Djup vinter — kallaste tonen |
| 1 mars | 180 | Slutspelsskärpa — mer kontrastrik, accent skarpare |
| 1 maj | 240 | Sista resterna — mjukare igen |

Färgvärden definieras inte i specen — Code och Opus iterera på dem under implementation. Riktlinje: subtila skift, ingen dramatisk färgändring som spelaren märker abrupt.

### CSS-vars som ska interpoleras

- `--bg-portal` (huvudbakgrund)
- `--bg-portal-surface` (kortbakgrund)
- `--bg-portal-elevated` (upphöjd bakgrund)
- `--accent-portal` (accent-skift)

**INTE alla CSS-vars.** Bara dessa fyra. Resten av designsystemet är konstant.

### Test-strategi

Snapshot-tester vid 5 datum:
- 2026-09-01 (höst) → tone-värden ligger inom förväntat intervall
- 2026-11-01 (övergång) → mellan höst och vinter
- 2027-01-01 (vinter) → kallast
- 2027-03-01 (slutspel) → kontrastrik
- 2027-05-01 (sista) → mjuk igen

Vi testar inte interpoleringen själv — bara att ändpunkterna är rätt och mellanvärden ligger i förväntat intervall.

---

## Visuell design

`docs/mockups/portal_bag_mockup.html` är referens. Varje av de fyra tillstånden i mocken visar hur portalen ska *kännas* i olika lägen:

- **Routine** → NextMatchPrimary + tabell/ekonomi/orten secondary + minimal bar
- **Derby** → DerbyPrimary med röd tonalitet + klacken/skadeläge/motståndarform secondary
- **Deadline** → TransferDeadlinePrimary med orange-pulserande accent + öppna bud/tabell secondary
- **SM-final** → SMFinalPrimary i guldton, helsida-känsla, andra cards minskar i visuell vikt

**Notera:** Det är primary-komponenten som styr hela skärmens karaktär. Secondary-cards kan reagera (få mindre vikt när primary är stort) men deras *anatomi* ändras inte.

---

## Tester

### Unit-tester

- `portalBuilder.test.ts`
  - Verifierar deterministisk output (samma seed → samma layout)
  - Verifierar att exakt 1 primary alltid finns
  - Verifierar att secondary cap (3) och minimal cap (4) respekteras
  - Testar 6 olika game-states (routine, derby, SM-final, deadline, patron-konflikt, kritiskt event)

- `seasonalTone.test.ts`
  - Snapshots vid 5 kända datum
  - Verifierar att färgvärden är giltiga hex-strängar
  - Verifierar att interpolering är monoton (ingen oscillation mellan keyframes)

- `triggers/*.test.ts`
  - Varje trigger har 3-5 game-state-fall som verifierar true/false

### Integration-tester

- `PortalScreen.test.tsx`
  - Renderar med routine-state → NextMatchPrimary visas
  - Renderar med derby-state → DerbyPrimary visas
  - Renderar med SM-final-state → SMFinalPrimary visas
  - Klick på primary card navigerar rätt
  - Tonalitets-CSS sätts vid render

### Visuell verifiering (självaudit)

Efter implementation — öppna appen och navigera genom säsongen:
- Omgång 1 (routine) → matchkort som primary, tabell/ekonomi/orten secondary
- Omgång 6 (derby-vecka) → derby-primary tar över
- Omgång 13 (transferdeadline) → deadline-primary
- Slutspel (SM-final) → guldton, hel skärm fokuserad
- Tonalitet ändras märkbart mellan oktober och januari (subtilt men synligt)

---

## Verifieringsprotokoll

Innan sprint markeras klar (krav från CLAUDE.md):

1. **`npm run build && npm test`** — alla tester gröna
2. **Inga hårdkodade hex-färger** — `grep -rn '#[0-9a-fA-F]' src/presentation/components/portal/` returnerar 0
3. **Filstorlekar** — `wc -l src/presentation/components/portal/**/*.tsx` — ingen fil över 150 rader
4. **Filstorlekar service** — `wc -l src/domain/services/portal/**/*.ts` — ingen fil över 150 rader
5. **Triggers är pure** — manuell granskning att ingen trigger gör store-anrop
6. **Komponenter är ovetande om bagen** — `grep -rn 'dashboardCardBag\|portalBuilder' src/presentation/components/portal/primary/` returnerar 0 (de får inte importera från service-lagret)
7. **PIXEL-JÄMFÖRELSE PER KOMPONENT — COMMIT-BLOCKER** (uppdaterat 2026-04-27 efter Scene-leverans):
   - **En komponent åt gången.** Skriv komponent N → pixel-jämför mot mocken → bifoga skärmdump i commit-meddelandet → skriv komponent N+1.
   - INTE hela komponentträdet och sen verifiering i slutet.
   - INTE "jag granskade alla efter att jag skrev dem".
   - För varje primary-komponent som har en mock-referens (se tabellen i "MOCKEN ÄR KANON"-sektionen):
     - Öppna mocken i webbläsare i 430px-bredd
     - Öppna appen i samma bredd med komponenten i fokus
     - Ta skärmdump av båda
     - Bifoga båda i commit-meddelandet för den komponenten
     - Bifoga sammanfattning av alla jämförelser i SPRINT_AUDIT.md
     - Beskriv eventuella avvikelser och varför de finns
8. **CSS-TOKEN-DISCIPLIN PÅ MÖRKA KOMPONENTER:** Portal-bakgrund är mörk. Inga ljusa tokens (`--bg-elevated`, `--text-secondary`, `--border` utan dark-prefix) på mörk bakgrund som default. Dark-varianter ska användas. Verifiera genom att granska JSX visuellt innan commit.
9. **SPRINT_AUDIT.md** — verifierat i UI enligt mall, med pixel-jämförelsen ovan

---

## Vad som SKA INTE göras i Fas 1

- DashboardScreen.tsx tas inte bort — behåll som fallback bakom feature flag
- Moments-systemet implementeras inte — det är Fas 2
- Kafferummet som plats implementeras inte — Fas 3
- Klubbens minne som vy implementeras inte — Fas 3
- Inga nya kort utöver de 16 som listas — andra kort tillkommer i senare faser
- DailyBriefing, OrtenSection, CareerStatsCard flyttas inte i Fas 1 — de stannar i DashboardScreen och visas i Portal endast under "Mer info"-fold (om alls)
- Ingen ändring av befintliga komponenter (NextMatchCard, etc) — bara wrappers runt dem

---

## Beroenden mellan filer

```
PortalScreen.tsx
├── använder: buildPortal, makeSeed (portalBuilder.ts)
├── använder: getSeasonalTone (seasonalTone.ts)
├── renderar: layout.primary.Component (dynamiskt)
├── renderar: PortalSecondarySection
└── renderar: PortalMinimalBar

portalBuilder.ts
├── läser: CARD_BAG (dashboardCardBag.ts)
└── använder: triggers via card.triggers[]

dashboardCardBag.ts
├── importerar: alla primary/secondary/minimal-komponenter
└── importerar: alla triggers

primary/SMFinalPrimary.tsx
├── tar emot: { game } prop
├── använder: useNavigate
├── läser: domain/services/* (befintliga)
└── INGEN import från portal/ utom CardRenderProps-typen

triggers/matchTriggers.ts
└── läser: domain/entities/* och domain/services/* (befintliga, pure)
```

---

## Frågor till Code som ska besvaras innan implementation startar

1. **Hur sätter vi feature flag `portalEnabled`?** Förslag: lägg det i save-game som en valbar prop, defaultar till `false`. Aktiveras manuellt via dev-tools eller URL-param under utveckling.

2. **Vilken seed ska `buildPortal` använda i produktion?** Förslag: `season * 100 + matchday`. Det betyder att samma omgång alltid har samma layout, och layouten ändras vid omgångsövergång (när spelaren förväntar sig en ändring).

3. **Var ska "Mer info"-fold hamna?** Förslag: längst ner i PortalScreen, kollapsad som default. Knapp "Visa fler vyer →" expanderar. Innehåller länkar till alla nuvarande dashboard-sektioner som inte är i bagen (DailyBriefing, OrtenSection, CareerStatsCard, Akademi, etc).

---

## Leverans-ordning rekommenderas

Bygg i denna ordning för att kunna testa successivt:

1. **Datatyper + algoritm först** — `dashboardCardBag.ts` (med tom array), `portalBuilder.ts`, alla triggers. Tester gröna.
2. **En enkel primary-komponent** — `NextMatchPrimary.tsx` som wrappar NextMatchCard. Verifiera att den renderas via portalBuilder.
3. **Secondary-tier** — bygga 2-3 secondary cards och PortalSecondarySection
4. **Minimal-tier** — PortalMinimalBar med 2-3 minimal cards
5. **PortalScreen-orkestrering** — sätt ihop allt i PortalScreen.tsx, göm bakom feature flag
6. **Resten av primary-cards** — DerbyPrimary, SMFinalPrimary, TransferDeadlinePrimary, PatronDemandPrimary, EventPrimary
7. **Resten av secondary/minimal** — fyll på bagen
8. **Tonalitets-CSS** — seasonalTone.ts + integration i PortalScreen
9. **Verifiering & SPRINT_AUDIT.md**

**Varför denna ordning?** Den första leveransen (steg 1-5) ger en *fungerande* Portal med bara default-fallback. Resten är utökning. Det betyder att Code kan playtesta efter steg 5 och få feedback från Jacob innan resten byggs.

---

## Slut SPEC_PORTAL_FAS_1
