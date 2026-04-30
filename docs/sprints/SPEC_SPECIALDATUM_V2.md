# SPEC — Specialdatum V2 (arena-konstanter + lore)

**Datum:** 2026-04-27  
**Baseras på:** `docs/STRINGS_SPECIALDATUM.md` (V2)  
**Förutsättning:** V1 redan levererad (commits `85170f7`, `755502f`) — pooler, briefing-helpers, inbox-funktioner finns i `specialDateStrings.ts`

---

## Nuläge (V1) — vad som redan fungerar

- `src/domain/data/specialDateStrings.ts`: V1-pooler + helpers (`pickVariant`, `substitute`, briefing-helpers, inbox-funktioner, `pickSpecialDateCommentary`)
- `matchCore.ts`: Anropar `pickSpecialDateCommentary()` vid avslag (steg 0)
- `dailyBriefingService.ts`: Anropar `finaldagBriefingPlaying`, `finaldagBriefingSpectator`, `nyarsbandyBriefing`, `annandagsbandyBriefing`
- `roundProcessor.ts`: Anropar `finaldagInboxPlaying`, `finaldagInboxSpectator`, `annandagsbandyInbox`, `cupFinalInboxPlaying`
- `Fixture.ts`: Har `isFinaldag?: boolean` — saknar `arenaName?: string` och `venueCity?: string`
- `playoffService.ts`: Sätter `isFinaldag: true` — saknar `arenaName`/`venueCity`
- `cupService.ts`: Matchday 3 = semi, 4 = final — saknar `arenaName`/`venueCity`/`isCupFinalhelgen`

## V2 — vad som ska läggas till

1. Arena-konstanter (`SM_FINAL_VENUE`, `CUP_FINAL_VENUE`) och lore-data (`STUDAN_FACTS`, `SAVSTAAS_FACTS`) i `specialDateStrings.ts`
2. Spectator commentary-pooler för final och cup i `specialDateStrings.ts`
3. Lore-pooler för alla fyra event i `specialDateStrings.ts`
4. `specialDateService.ts` — ny service med logik (extract från `specialDateStrings.ts` + nytt)
5. `arenaName`/`venueCity` på `Fixture`-typen
6. Arena-konstanter dragna in i fixture-skapandet (playoff + cup)
7. Lore aktiverat i `pickSpecialDateCommentary` via `pickCommentary`
8. 3×30-hook i `matchCore.ts`

---

## STEG 1 — Uppgradera `src/domain/data/specialDateStrings.ts`

### 1A — Ta bort inline-logik

Ta bort dessa funktioner från filen (de FLYTTAS till `specialDateService.ts` i steg 2):
- `function pickVariant<T>`
- `function substitute`
- `annandagsbandyBriefing`
- `nyarsbandyBriefing`
- `finaldagBriefingPlaying`
- `finaldagBriefingSpectator`
- `cupFinalBriefingPlaying`
- `cupFinalBriefingSpectator`
- `pickSpecialDateCommentary`
- `import { mulberry32 } from '../utils/random'` — tas bort när logiken är borta

**Behåll:** Alla pool-konstanter, inbox-funktioner, `SpecialDateContext`-typen.

### 1B — Uppdatera `SpecialDateContext`

Ersätt nuvarande typ med:

```typescript
export interface SpecialDateContext {
  isHomePlayer: boolean
  homeClubName: string
  awayClubName: string
  arenaName: string
  venueCity: string
  isDerby?: boolean
  rivalryName?: string
  tipoffHour?: string
  isUnderdog?: boolean
  hasJourneyToFinal?: boolean
  isPlayerInFinal?: boolean          // ny — är spelarens lag i finalen?
  weather?: {
    tempC: number
    condition: string
    matchFormat?: '2x45' | '3x30' | 'cancelled'
  }
}
```

### 1C — Lägg till arena-konstanter

Infoga direkt efter imports (inga imports behövs — bara data):

```typescript
export const SM_FINAL_VENUE = {
  arenaName: 'Studenternas IP',
  shortName: 'Studan',
  city: 'Uppsala',
}

export const CUP_FINAL_VENUE = {
  arenaName: 'Sävstaås IP',
  city: 'Bollnäs',
}
```

### 1D — Lägg till lore-data

Infoga efter arena-konstanterna (exakt från STRINGS_SPECIALDATUM.md §0.2):

```typescript
export const STUDAN_FACTS = {
  inaugurated: '21 mars 1909',
  totalFinals: 23,
  rank: 'näst flest efter Stockholms Stadion (47)',
  attendanceRecord: 25_560,
  attendanceRecordYear: 2010,
  attendanceRecordMatch: 'Hammarby IF 3–1 Bollnäs GIF',
  attendanceRecordContext: 'Den enda SM-final som spelats i 3×30 minuter — pga ymnigt snöfall',
  location: 'Vid Fyrisån, intill Stadsträdgården i centrala Uppsala',
  reconstruction: 'Ombyggd 2017–2020 av White Arkitekter',
  finalsPeriod1: '1991–2012',
  finalsPeriod2: '2018–2023',
  iconicMatches: [
    {
      year: 2010,
      teams: 'Hammarby–Bollnäs',
      score: '3–1',
      story: '3×30 minuter pga snöfall. "Grisbandy" första två perioderna, "riktig bandy" sista. Hammarbys första SM-guld på 105 år.',
    },
    {
      year: 2011,
      teams: 'SAIK–Bollnäs',
      score: '6–5 (sudden death)',
      story: 'SAIK-ikonen Daniel "Zeke" Eriksson sköt avgörande mål via frislag i sin allra sista match.',
    },
    {
      year: 1999,
      teams: 'Västerås–Falu BS',
      score: '3–2',
      story: 'Falu BS hela vägen till final — första laget med ryska spelare (Sergej Obuchov + Valerij Gratjev).',
    },
  ],
}

export const SAVSTAAS_FACTS = {
  inaugurated: '1973–1974 (säsongen)',
  artificialIce: 1984,
  homePeriod: 'Bollnäs hemmaplan 1974–2022',
  attendanceRecord: 8_151,
  attendanceRecordDate: '26 december 2000',
  attendanceRecordMatch: 'Bollnäs–Edsbyn (annandagen)',
  attendanceRecordContext: 'Publikrekordet är från en annandagsmatch — det är inget tomt sammanträffande',
  atmosphere: {
    supporters: 'Flames — en gång rankad som Sveriges fjärde bästa supporterklubb (alla sporter, Aftonbladet)',
    inmarchSong: 'Dans på Sävstaås',
    fireworks: 'Nisses fyrverkerier innan match',
    flagSize: 'Jumboflaggor 4×4 meter',
    standsSouth: 'Träläktare med murkna brädor, blåaktigt rostigt räcke',
    standsEast: 'Hela långsidan, 25–30 trappsteg hög, inget tak',
    standsMain: 'Tak, störst, nyast — där Flames står',
    iceHall: 'Ishallen bredvid där folk värmer fingrar i halvtid + köper korv',
    smell: 'Kväljande cigarettrök, korv, glögg',
  },
  ghost: 'Sirius vann ingen bortamatch på Sävstaås 1983–2018. 23 raka förluster på 35 år.',
  bollnasFinals: [1943, 1951, 1956, 2010, 2011, 2017],
  bollnasGold: [1951, 1956],
}
```

### 1E — Lägg till lore-pooler och spectator commentary-pooler

Infoga under respektive event-sektion (exakt från STRINGS_SPECIALDATUM.md):

```typescript
// Annandagsbandy — lägg till direkt efter ANNANDAGSBANDY_COMMENTARY
export const ANNANDAGSBANDY_COMMENTARY_LORE: string[] = [
  'På Sävstaås 2000 satte Bollnäs publikrekord på annandagen. 8 151 åskådare. Det rekordet ligger som ett spöke över varje annandagsmatch som spelas i bandysverige.',
  'Annandagsbandy är inte vilket schemaläggning som helst. Det är dagen då folk som inte ens följer bandyn under året plötsligt sitter på läktaren.',
]

// SM-finaldag — lägg till spectator-pool och lore (spectator commentary saknas i V1)
export const FINALDAG_COMMENTARY_SPECTATOR: string[] = [
  'SM-finalen avgörs i dag på Studenternas — {homeClubName} mot {awayClubName}. Inte vår final, men ändå finalen.',
  'På Studan spelas det final i dag. Vi tittar på från andra sidan, som de flesta år.',
]

export const FINALDAG_COMMENTARY_LORE: string[] = [
  'Studenternas IP. Invigd 21 mars 1909. 23 SM-finaler har avgjorts på den här isen. Den 24:e startar nu.',
  'Vi står på samma is där Daniel "Zeke" Eriksson sköt SAIK till guld 2011 — i sin allra sista match. Frislag, sudden death, drömavslut. Alla finaler har sin historia.',
  'På den här planen vann Hammarby sitt första SM-guld på 105 år. Det var 2010. Snön vräkte ner. Matchen spelades i 3×30 minuter — den enda SM-finalen någonsin i det formatet. Idag är det åtminstone klart väder.',
  'Stadsträdgården åt höger, Fyrisån åt vänster. Studan. Det är på de här fem hektaren bandysveriges hela historia ryms.',
]

// 3×30-trigger — BARA för SM-final med weather.matchFormat === '3x30'
export const FINALDAG_COMMENTARY_3X30: string[] = [
  'Andra gången någonsin. Hammarby–Bollnäs 2010 var den första SM-finalen i 3×30 minuter — snöfallet då tvingade fram det. Idag är vi där igen. Studan, snöfall, regelbokens andra utväg.',
  '3×30 minuter i en SM-final. Det har bara hänt en gång förut. På den här planen, för 16 år sedan. Bollen rullade knappt i snön. "Grisbandy", sa kommentatorerna. Vi får se vad det blir i dag.',
]

// Cup-finalhelgen — lägg till spectator-pool och lore (båda saknas i V1)
export const CUPFINAL_COMMENTARY_SPECTATOR: string[] = [
  'På Sävstaås IP spelas cup-final i dag mellan {homeClubName} och {awayClubName}. Inte vår final, men matchen ger ändå läget i bandysverige.',
  'Cup-finalhelgen rullar på i Bollnäs. Bandyåret är i gång på riktigt nu.',
]

export const CUPFINAL_COMMENTARY_LORE: string[] = [
  'Sävstaås IP. Invigd 1973, konstfryst 1984, Bollnäs hemmaplan i 48 år. Träläktarna doftar fortfarande av tre generationer cigarettrök och korv.',
  'På den här planen satte Bollnäs publikrekord på annandagen 2000. 8 151 åskådare. Den siffran ligger som ett spöke över varje match som spelas här.',
  'Sävstaås. Flames står på huvudläktaren med jumboflaggor på fyra meter. Innan inmarsch spelas Dans på Sävstaås. Nisses fyrverkerier smäller. Det är så det går till.',
  'Sirius vann inte en bortamatch på den här planen i 35 år. 1983 till 2018. 23 raka förluster. "Sävstaås-spöket" är inget skämt — det är en bandyssanning.',
  'Innan ishallen byggdes bredvid kunde du gå in mellan halvlekarna och värma fingrarna med en korv och en glögg. Den traditionen försvann inte — bara att hallen är större nu.',
]
```

### Resultat steg 1
`specialDateStrings.ts` = ren datafil. Inga imports, inga funktioner utom inbox-funktionerna (de är datageneratorer, inte logik).

---

## STEG 2 — Skapa `src/domain/services/specialDateService.ts`

Ny fil. Importerar från `specialDateStrings.ts` och `mulberry32`.

```typescript
import { mulberry32 } from '../utils/random'
import {
  SpecialDateContext,
  ANNANDAGSBANDY_BRIEFING,
  ANNANDAGSBANDY_COMMENTARY,
  ANNANDAGSBANDY_COMMENTARY_LORE,
  NYARSBANDY_BRIEFING,
  NYARSBANDY_COMMENTARY,
  FINALDAG_BRIEFING_PLAYING,
  FINALDAG_BRIEFING_SPECTATOR,
  FINALDAG_COMMENTARY_PLAYING,
  FINALDAG_COMMENTARY_SPECTATOR,
  FINALDAG_COMMENTARY_LORE,
  FINALDAG_COMMENTARY_3X30,
  CUPFINAL_BRIEFING_PLAYING,
  CUPFINAL_BRIEFING_SPECTATOR,
  CUPFINAL_COMMENTARY_PLAYING,
  CUPFINAL_COMMENTARY_SPECTATOR,
  CUPFINAL_COMMENTARY_LORE,
  SM_FINAL_VENUE,
} from '../data/specialDateStrings'
import type { GameState } from '../entities/GameState'
import type { Fixture } from '../entities/Fixture'

// ── Core utilities ────────────────────────────────────────────────────────────

export function substitute(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(ctx[key as string] ?? `{${key}}`))
}

export function pickVariant<T>(pool: T[], season: number, matchday: number): T {
  const rand = mulberry32(season * 1000 + matchday)
  return pool[Math.floor(rand() * pool.length)]
}

// Slumpar lore-pool med ~15% sannolikhet (separat seed för att inte påverka
// variant-ordningen inom samma matchday)
export function pickCommentary(
  standard: string[],
  lore: string[] | undefined,
  season: number,
  matchday: number,
): string {
  const rand = mulberry32(season * 7919 + matchday * 31)
  const useLore = lore !== undefined && lore.length > 0 && rand() < 0.15
  const pool = useLore ? lore! : standard
  return pickVariant(pool, season, matchday)
}

// ── Context builder ───────────────────────────────────────────────────────────

export function buildSpecialDateContext(fixture: Fixture, game: GameState): SpecialDateContext {
  const isHome = fixture.homeClubId === game.managedClubId
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const rivalry = game.rivalries?.find(
    r =>
      (r.clubA === fixture.homeClubId && r.clubB === fixture.awayClubId) ||
      (r.clubA === fixture.awayClubId && r.clubB === fixture.homeClubId),
  )

  return {
    isHomePlayer: isHome,
    homeClubName: homeClub?.name ?? '',
    awayClubName: awayClub?.name ?? '',
    arenaName: fixture.arenaName ?? managedClub?.arenaName ?? '',
    venueCity: fixture.venueCity ?? (isHome ? managedClub?.city ?? '' : ''),
    isDerby: !!rivalry,
    rivalryName: rivalry?.name,
    tipoffHour: fixture.tipoffTime ? `${Math.floor(fixture.tipoffTime / 60)}:00` : '13:00',
    isPlayerInFinal: fixture.isFinaldag === true,
    isUnderdog: fixture.isFinaldag
      ? (managedClub?.strength ?? 50) < 50
      : undefined,
    hasJourneyToFinal: fixture.isCup
      ? (game.cupWins ?? 0) >= 3
      : undefined,
  }
}

// ── Commentary pickers (live match) ──────────────────────────────────────────

export function pickSpecialDateCommentary(
  type: 'annandagen' | 'nyarsbandy' | 'finaldag' | 'cupfinal',
  ctx: SpecialDateContext,
  season: number,
  matchday: number,
): string {
  switch (type) {
    case 'annandagen': {
      return pickCommentary(ANNANDAGSBANDY_COMMENTARY, ANNANDAGSBANDY_COMMENTARY_LORE, season, matchday)
    }
    case 'nyarsbandy': {
      const template = pickVariant(NYARSBANDY_COMMENTARY, season, matchday)
      return substitute(template, { arenaName: ctx.arenaName })
    }
    case 'finaldag': {
      return pickFinaldagCommentary(ctx, season, matchday)
    }
    case 'cupfinal': {
      const standard = ctx.isPlayerInFinal ? CUPFINAL_COMMENTARY_PLAYING : CUPFINAL_COMMENTARY_SPECTATOR
      const template = pickCommentary(standard, CUPFINAL_COMMENTARY_LORE, season, matchday)
      return substitute(template, {
        arenaName: ctx.arenaName,
        homeClubName: ctx.homeClubName,
        awayClubName: ctx.awayClubName,
      })
    }
  }
}

export function pickFinaldagCommentary(ctx: SpecialDateContext, season: number, matchday: number): string {
  // 3×30-trigger tar 100% prioritet — triggas av ovanligt väder (som Studan 2010)
  if (ctx.weather?.matchFormat === '3x30') {
    return pickVariant(FINALDAG_COMMENTARY_3X30, season, matchday)
  }
  const standard = ctx.isPlayerInFinal ? FINALDAG_COMMENTARY_PLAYING : FINALDAG_COMMENTARY_SPECTATOR
  const template = pickCommentary(standard, FINALDAG_COMMENTARY_LORE, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
    arenaName: ctx.arenaName,
  })
}

// ── Briefing pickers ──────────────────────────────────────────────────────────

export function annandagsbandyBriefing(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(ANNANDAGSBANDY_BRIEFING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
    rivalryName: ctx.rivalryName ?? 'Derbyt',
  })
}

export function nyarsbandyBriefing(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(NYARSBANDY_BRIEFING, season, matchday)
  return substitute(template, {
    tipoffHour: ctx.tipoffHour ?? '13:00',
    arenaName: ctx.arenaName,
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
  })
}

export function finaldagBriefingPlaying(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(FINALDAG_BRIEFING_PLAYING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: SM_FINAL_VENUE.arenaName,
  })
}

export function finaldagBriefingSpectator(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(FINALDAG_BRIEFING_SPECTATOR, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
  })
}

export function cupFinalBriefingPlaying(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(CUPFINAL_BRIEFING_PLAYING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
    journeyLine: ctx.hasJourneyToFinal ? 'Tre rundor och inga förluster — nu sista.' : 'Vi är här.',
  })
}

export function cupFinalBriefingSpectator(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(CUPFINAL_BRIEFING_SPECTATOR, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
    venueCity: ctx.venueCity,
  })
}
```

**Notera:** `pickSpecialDateCommentary`-signaturen ändras — tar nu `SpecialDateContext` istf det gamla `{arenaName, homeClubName, awayClubName}`. Påverkar konsumenterna i steg 4.

---

## STEG 3 — Uppdatera `Fixture`-typen och fixture-skapandet

### 3A — `src/domain/entities/Fixture.ts`

Lägg till två fält efter `isFinaldag`:

```typescript
isFinaldag?: boolean
arenaName?: string    // neutral venue-namn för final/cup-final
venueCity?: string    // stad för neutral venue
```

### 3B — `src/domain/services/playoffService.ts`

Importera `SM_FINAL_VENUE`:

```typescript
import { SM_FINAL_VENUE } from '../data/specialDateStrings'
```

I `generatePlayoffFixtures` — final-fallet (där `isFinaldag: true` sätts) — lägg till:

```typescript
arenaName: SM_FINAL_VENUE.arenaName,
venueCity: SM_FINAL_VENUE.city,
```

### 3C — `src/domain/services/cupService.ts`

Importera `CUP_FINAL_VENUE`:

```typescript
import { CUP_FINAL_VENUE } from '../data/specialDateStrings'
```

Hitta fixture-skapandet för matchday 3 (semifinal) och matchday 4 (final). Lägg till:

```typescript
arenaName: CUP_FINAL_VENUE.arenaName,
venueCity: CUP_FINAL_VENUE.city,
isCupFinalhelgen: true,
```

`isCupFinalhelgen` på `Fixture` saknas i V1 — kontrollera om det redan finns på typen. Om inte: lägg till `isCupFinalhelgen?: boolean` i `Fixture.ts` samtidigt som 3A.

---

## STEG 4 — Uppdatera konsumenter

### 4A — `src/domain/services/matchCore.ts`

Byt import:

```typescript
// GAMMAL:
import { pickSpecialDateCommentary } from '../data/specialDateStrings'

// NY:
import { pickSpecialDateCommentary, buildSpecialDateContext } from '../services/specialDateService'
```

`pickSpecialDateCommentary` har ny signatur: tar `SpecialDateContext` som andra arg. Uppdatera anropet:

```typescript
// Nuvarande (ca rad 1120-1131):
const arenaCtx = { arenaName: input.arenaName ?? homeClubName ?? '', homeClubName: homeClubName ?? '', awayClubName: awayClubName ?? '' }
if (fixture.isFinaldag) {
  commentaryText = pickSpecialDateCommentary('finaldag', arenaCtx, fixture.season, fixture.matchday)
} else if (input.isCupFinalhelgen && fixture.isCup) {
  commentaryText = pickSpecialDateCommentary('cupfinal', arenaCtx, fixture.season, fixture.matchday)
} else if (input.isAnnandagen) {
  commentaryText = pickSpecialDateCommentary('annandagen', arenaCtx, fixture.season, fixture.matchday)
} else if (input.isNyarsbandy) {
  commentaryText = pickSpecialDateCommentary('nyarsbandy', arenaCtx, fixture.season, fixture.matchday)
}

// ERSÄTT MED:
const specialCtx = buildSpecialDateContext(fixture, game)
// (eller bygg specialCtx manuellt om game-objektet inte är tillgängligt i matchCore)
```

**Om `game`-objektet inte är tillgängligt i matchCore:** Bygg kontexten manuellt från `input`-objektet. Signaturändringen i `pickSpecialDateCommentary` kräver att `SpecialDateContext` skickas in — men det räcker att lägga till `isPlayerInFinal?: boolean` och `weather?: {...}` till `StepByStepInput` och bygga kontexten därifrån. Se alternativt snitt nedan:

```typescript
const sdCtx: SpecialDateContext = {
  isHomePlayer: fixture.homeClubId === managedClubId,
  homeClubName: homeClubName ?? '',
  awayClubName: awayClubName ?? '',
  arenaName: fixture.arenaName ?? input.arenaName ?? '',
  venueCity: fixture.venueCity ?? '',
  isPlayerInFinal: !!fixture.isFinaldag,
  weather: input.weather,
}
if (fixture.isFinaldag) {
  commentaryText = pickSpecialDateCommentary('finaldag', sdCtx, fixture.season, fixture.matchday)
} else if (input.isCupFinalhelgen && fixture.isCup) {
  commentaryText = pickSpecialDateCommentary('cupfinal', sdCtx, fixture.season, fixture.matchday)
} else if (input.isAnnandagen) {
  commentaryText = pickSpecialDateCommentary('annandagen', sdCtx, fixture.season, fixture.matchday)
} else if (input.isNyarsbandy) {
  commentaryText = pickSpecialDateCommentary('nyarsbandy', sdCtx, fixture.season, fixture.matchday)
}
```

`StepByStepInput.weather` behöver läggas till om det inte finns — same typ som i `SpecialDateContext`.

### 4B — `src/domain/services/dailyBriefingService.ts`

Byt imports från `'../data/specialDateStrings'` till `'./specialDateService'` för alla briefing-helpers:

```typescript
import {
  annandagsbandyBriefing,
  nyarsbandyBriefing,
  finaldagBriefingPlaying,
  finaldagBriefingSpectator,
  cupFinalBriefingPlaying,
  cupFinalBriefingSpectator,
  buildSpecialDateContext,
} from './specialDateService'
```

Ersätt nuvarande `ctx`-byggande med `buildSpecialDateContext(fixture, game)` där fixture och game är tillgängliga. Briefing-hjälparna tar fortfarande `(ctx, season, matchday)`.

### 4C — `src/application/useCases/roundProcessor.ts`

Inbox-funktionerna (`finaldagInboxPlaying`, `finaldagInboxSpectator`, `annandagsbandyInbox`, `cupFinalInboxPlaying`) stannar i `specialDateStrings.ts` — ingen import-ändring krävs.

`buildSpecialDateContext` kan dock importeras från `specialDateService.ts` om roundProcessor behöver kontexten för brevfunktionerna.

---

## STEG 5 — 3×30-hook i `matchUtils.ts`

Lägg till `weather` i `StepByStepInput` om det inte redan finns:

```typescript
// I StepByStepInput-interfacet:
weather?: {
  tempC: number
  condition: string
  matchFormat?: '2x45' | '3x30' | 'cancelled'
}
```

`matchCore.ts` läser `input.weather?.matchFormat` och skickar vidare via `sdCtx.weather`. Ingen ytterligare ändring — `pickFinaldagCommentary` hanterar 3×30-fallet internt.

---

## STEG 6 — Tester

### `src/__tests__/specialDateService.test.ts`

```typescript
import { pickCommentary, pickVariant, substitute } from '../domain/services/specialDateService'

describe('substitute', () => {
  it('ersätter kända nycklar', () => {
    expect(substitute('Hej {name}', { name: 'Uppsala' })).toBe('Hej Uppsala')
  })
  it('lämnar okända nycklar orörda', () => {
    expect(substitute('Hej {name}', {})).toBe('Hej {name}')
  })
})

describe('pickVariant', () => {
  it('är deterministiskt för samma season+matchday', () => {
    const pool = ['a', 'b', 'c', 'd', 'e']
    expect(pickVariant(pool, 2026, 14)).toBe(pickVariant(pool, 2026, 14))
  })
  it('ger olika resultat för olika säsonger', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    const results = new Set(Array.from({ length: 50 }, (_, i) => pickVariant(pool, i, 14)))
    expect(results.size).toBeGreaterThan(3)
  })
})

describe('pickCommentary lore-frekvens', () => {
  it('triggar lore ~15% av säsonger (± 5pp)', () => {
    let loreCount = 0
    for (let s = 0; s < 1000; s++) {
      const result = pickCommentary(['standard'], ['lore'], s, 14)
      if (result === 'lore') loreCount++
    }
    expect(loreCount).toBeGreaterThan(100)   // > 10%
    expect(loreCount).toBeLessThan(200)      // < 20%
  })
  it('returnerar standard om ingen lore', () => {
    expect(pickCommentary(['standard'], undefined, 2026, 14)).toBe('standard')
  })
})
```

### `src/__tests__/specialDateStrings.test.ts`

```typescript
import { SM_FINAL_VENUE, CUP_FINAL_VENUE } from '../domain/data/specialDateStrings'

describe('SM_FINAL_VENUE', () => {
  it('är Studenternas IP, Uppsala', () => {
    expect(SM_FINAL_VENUE.arenaName).toBe('Studenternas IP')
    expect(SM_FINAL_VENUE.city).toBe('Uppsala')
  })
})

describe('CUP_FINAL_VENUE', () => {
  it('är Sävstaås IP, Bollnäs', () => {
    expect(CUP_FINAL_VENUE.arenaName).toBe('Sävstaås IP')
    expect(CUP_FINAL_VENUE.city).toBe('Bollnäs')
  })
})
```

### `src/__tests__/specialDateIntegration.test.ts`

```typescript
// Verifierar att SM-final-fixture har Studenternas-data
import { generatePlayoffFixtures } from '../domain/services/playoffService'

describe('SM-final fixture', () => {
  it('har arenaName = Studenternas IP och isFinaldag = true', () => {
    // Bygg en mock-final-serie och generera fixture
    const mockSeries = { /* minimal PlayoffSeries-mock med isFinal: true */ }
    const fixtures = generatePlayoffFixtures(mockSeries, 2026, 37, 37)
    const finalFixture = fixtures[0]
    expect(finalFixture.arenaName).toBe('Studenternas IP')
    expect(finalFixture.isFinaldag).toBe(true)
  })
})
```

---

## Kvalitetsportar

```bash
npm run build && npm test
```

Ska vara grönt. Ingen ny TypeScript-varning om implicit `any`. Inga nya hårdkodade färger eller strängar utanför datafiler.

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/domain/data/specialDateStrings.ts` | Ta bort inline-logik, lägg till V2-data |
| `src/domain/services/specialDateService.ts` | NY — all logik hit |
| `src/domain/entities/Fixture.ts` | Lägg till `arenaName?`, `venueCity?`, ev. `isCupFinalhelgen?` |
| `src/domain/services/playoffService.ts` | Sätt `arenaName`/`venueCity` på final-fixture |
| `src/domain/services/cupService.ts` | Sätt `arenaName`/`venueCity`/`isCupFinalhelgen` på R3/R4 |
| `src/domain/services/matchCore.ts` | Byt import, bygg `sdCtx`, lägg till `weather` |
| `src/domain/services/matchUtils.ts` | Lägg till `weather` i `StepByStepInput` |
| `src/domain/services/dailyBriefingService.ts` | Byt imports till `specialDateService` |
| `src/__tests__/specialDateService.test.ts` | NY |
| `src/__tests__/specialDateStrings.test.ts` | NY |
| `src/__tests__/specialDateIntegration.test.ts` | NY |

**Filer som INTE ändras:** `roundProcessor.ts` (inbox-funktioner stannar i `specialDateStrings.ts`)

---

## Tidsuppskattning

- Steg 1 (data-fil): 30 min
- Steg 2 (service-fil): 45 min
- Steg 3 (arena-konstanter): 30 min
- Steg 4 (konsumenter): 60-90 min
- Steg 5 (3×30): 15 min
- Steg 6 (tester): 45-60 min

**Total: ~3.5-4h**
