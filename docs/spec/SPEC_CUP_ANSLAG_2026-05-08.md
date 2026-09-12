# SPEC: Cup-anslag (fas-anslag, v1 — variants-arkitektur)

**Datum:** 2026-05-08
**Författare:** Opus
**Status:** SPEC v2 — variants-arkitektur + uppdaterade texter
**Beroende:** Cup-anslag är redan implementerat (commit `5921d95`). Detta dokument **migrerar** befintlig implementation från `body: string` till `variants: AnslagVariant[]`.

---

## Bakgrund

V1-implementationen har en text per anslag. Spelaren ser samma text varje säsong. För att undvika "Commodore 64-känsla" utvidgar vi datastrukturen till att stödja flera varianter per anslag, med deterministisk slump per `(season, anslagKey, clubId)`.

Arkitekturen tar också höjd för framtida **scenario-system** (underdog, serie_giant, kusinen-från-landet, storstadsutmanare) utan refactor — varianter får optionellt `scenarios`-fält som filtrerar vid val.

---

## Datastruktur

```ts
// src/domain/data/anslag/types.ts (NY fil)

export type ClubScenario =
  | 'underdog'
  | 'serie_giant'
  | 'kusinen_fran_landet'
  | 'storstadsutmanare'
  | 'newcomer'
  | 'established'
// Endast typdefinition i v1 — scenarios används inte än, men typsystemet förbereds

export interface AnslagVariant {
  body: string
  weight?: number              // för viktad slump (default 1)
  scenarios?: ClubScenario[]   // FRAMTID — endast varianter med matchande scenario visas
  minSeason?: number           // FRAMTID — bara från säsong N
  prevResult?: PrevResult[]    // FRAMTID — bara efter visst fjolår
}

export type PrevResult =
  | 'cup_winner'
  | 'cup_eliminated_round1'
  | 'league_champion'
  | 'playoff_eliminated_quarter'
  | 'no_playoff'
  // Bara typdefinition i v1

export interface AnslagText {
  chapter: string
  variants: AnslagVariant[]
  bodyDirektkval?: string      // suffix-tillägg för direktkvalade — bara för cup_start
}
```

---

## pickVariant-funktion

```ts
// src/domain/services/anslagService.ts (utvidga befintlig fil)

import { mulberry32 } from '../utils/random'

/**
 * Deterministisk variant-selektor. Samma (season, anslagKey, clubId)
 * ger alltid samma variant — viktigt för att undvika att varianten
 * byts vid re-render eller save-laddning.
 */
export function pickAnslagVariant(
  text: AnslagText,
  season: number,
  anslagKey: AnslagKey,
  clubId: string,
): string {
  // Filter: i v1 ingår alla varianter
  // FRAMTID: filter på scenarios, minSeason, prevResult
  const candidates = text.variants

  if (candidates.length === 0) {
    throw new Error(`No variants for anslag ${anslagKey}`)
  }
  if (candidates.length === 1) {
    return candidates[0].body
  }

  // Deterministisk seed från (season, key, clubId)
  const seedString = `${season}_${anslagKey}_${clubId}`
  const seed = hashString(seedString)
  const rand = mulberry32(seed)

  // Viktad slump om weight finns
  const totalWeight = candidates.reduce((sum, v) => sum + (v.weight ?? 1), 0)
  let r = rand() * totalWeight
  for (const variant of candidates) {
    r -= variant.weight ?? 1
    if (r < 0) return variant.body
  }
  return candidates[candidates.length - 1].body  // fallback
}

function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0  // unsigned 32-bit
}
```

---

## Cup-anslag — alla varianter

### `cup_start` — Anslaget

Triggas vid Portal-rendering vid `currentMatchday >= 1 && cupBracket && !seenAnslag.includes('cup_start')`. Direktkval-suffix appendas om `bracket.byeTeamIds.includes(managedClubId)`.

```ts
{
  chapter: '⬩ Anslaget ⬩',
  variants: [
    {
      // Variant A — neutral, observerande (originaltext)
      body: `Säsongen närmar sig, men först bandyårets första delikatess. Svenska cupen är inte den finaste pokalen, men den är den första.<br><br>Isen är sällan vad den ska vara, spelarna är ännu inte i form, och formationen sitter inte. Just därför är det något särskilt. Här syns vem som hängt med under sommaren och vem som kommit tillbaka för tidigt.<br><br>Bandyårets första riktiga avläsning.`,
    },
    {
      // Variant B — förväntan/laddning
      body: `Cupen är på väg. Inte ligan, inte slutspelet — men det första. Det är något särskilt med första matcherna i oktober.<br><br>Lottningen finns där. Resultatet finns inte än. Just nu vet ingen mer än alla andra. Det kommer att ändras snart.<br><br>Bandyåret börjar nu.`,
    },
    {
      // Variant C — oktober-atmosfär
      body: `Oktober. Lottningen är gjord och planerna är spolade. Det är fortfarande sommarljus i minnet, men inte här — här är det vinterns början som närmar sig.<br><br>Cupen är cupen. Den brukar inte avgöra något viktigt. Men den brukar avgöra mycket om vad som komma ska.<br><br>Vi får se.`,
    },
  ],
  bodyDirektkval: `<br><br><em>({clubName} väntar. Andras kamp först. Vår cup börjar i kvarten.)</em>`,
}
```

---

### `cup_between` — Snålvinden

Triggas vid Portal-rendering efter cup-runda 2 spelad, för spelare som inte är direktkvalad till semi och inte utslagen i förstarundan. (Direktkvalade hoppar Snålvinden — de var inte i rundorna.)

```ts
{
  chapter: '⬩ Snålvinden ⬩',
  variants: [
    {
      // Variant A — observerande, neutral (originaltext, korrigerad terminologi)
      body: `Det blåser snålt över bandyplanerna i östra Sverige den här veckan. Tre lag har redan åkt ur.<br><br>Ingen pratar om cupen som om den vore avgörande, men ingen ser ut att ta lätt på den heller. Det är så cupen brukar vara.<br><br>Man säger en sak och spelar en annan.`,
    },
    {
      // Variant B — oktober-atmosfär
      body: `Oktober. Mörkret kommer för tidigt nu, frosten ligger på på mornarna, och spelet är inte där det ska vara än.<br><br>Tre lag har åkt ur. Ingen sörjer dem särskilt mycket — men ingen vill vara nästa.<br><br>Cupen är cupen. Inget mer, inget mindre.`,
    },
    {
      // Variant C — klubbnivå, utvärderande
      body: `Mellan rundorna. Utvärderingar i klubbhus över hela landet. Vad gick bra. Vad gick mindre bra.<br><br>Tre lag är borta. För dem är cupen redan något att lägga bakom sig och inte tänka på. För resten är den fortfarande där, och det är fortfarande inte klart vad den ska bli.<br><br>Bandyhösten är ung.`,
    },
  ],
}
```

---

### `cup_finalweekend_pre` — Helgen

Triggas vid Portal-rendering efter att cup-kvart är klar, för spelare som kvalat till semi.

```ts
{
  chapter: '⬩ Helgen ⬩',
  variants: [
    {
      // Variant A — observerande (originaltext, justerad till 4 lag/2 dagar)
      body: `Nu samlas det som finns kvar. Fyra lag, två dagar, en helg där bandysverige för första gången på året får se varandra på samma plats.<br><br>Det är inte ligan. Det är inte finalen. Men för dem som varit med länge är det här den helg där säsongen bestäms — inte i resultat, utan i självbild.`,
    },
    {
      // Variant B — Sävstaås-atmosfär
      body: `Bollnäs den här helgen. Sävstaås, fyrverkerier, glögg på läktaren. Det är så cup-finalhelgen brukar vara.<br><br>Två semifinaler i lördag, finalen i söndag. Fyra lag åker dit, ett åker hem som vinnare. Resten åker hem som vanligt.<br><br>Det är inte SM. Men ingen är där och tror något annat heller.`,
    },
    {
      // Variant C — klubbnivå, lägervardag
      body: `Sex omklädningsrum i Bollnäs. Fyra för spelarna, två för domarna. Allt är förberett.<br><br>Vi har rest hit för en match, och om det går bra för två. Vi vet inte än vilket. Det är poängen med slutspel.<br><br>Det är cup-finalhelg. Den brukar inte göra sig bättre än så.`,
    },
  ],
}
```

---

### `cup_done` — Pokalen (standard, för icke-vinnare)

Triggas vid Portal-rendering efter klubbens sista cup-match, om `bracket.winnerId !== managedClubId`.

```ts
{
  chapter: '⬩ Pokalen ⬩',
  variants: [
    {
      // Variant A — observerande, framåtblickande (originaltext)
      body: `Cupen är spelad. Pokalen står på en byrå någonstans.<br><br>Nu vidtar det som är längre, jämnare, och i längden viktigare. Ligan börjar nästa helg.<br><br>Det är dags att gå in i den med det man har lärt sig — och med vetskapen om att cupen, hur fin den än var, ändå bara är cupen.`,
    },
    {
      // Variant B — efter förlust, mer reflekterande
      body: `Vår cup är slut. Tre matcher om vi var med långt, en om det inte gick.<br><br>Det är så cupen är. Den prövar lag innan ligan tar vid. Vad lärde vi oss? Mer än vi tror, mindre än vi ville.<br><br>Ligan väntar. Det är där det avgörs.`,
    },
    {
      // Variant C — klubbnivå, vardagsåtervändning
      body: `Cupen är gjort. Spelarna kommer tillbaka till tisdagsträningarna. Magnus jobbar med dem som behöver formjustering. Resten är som vanligt.<br><br>Pokalen är någon annans. Det blev vad det blev.<br><br>Nu ligan. Då har vi 22 omgångar att visa vad vi gör med en hel säsong.`,
    },
  ],
}
```

---

### `cup_done_winner` — Pokalen (vinnar-variant)

Triggas vid Portal-rendering efter klubbens sista cup-match, om `bracket.winnerId === managedClubId`. Visuell variant: `.winner` CSS-klass på AnslagOverlay (guld-stripe, större chapter, 🏆-emoji i CTA).

```ts
{
  chapter: '⬩ Pokalen ⬩',
  variants: [
    {
      // Variant A — observerande, ödmjuk-stolt (originaltext)
      body: `<strong>Pokalen är vår.</strong><br><br>Den är inte den finaste pokalen i bandy. Men den är den första vi vunnit på länge — och det väger.<br><br>Ligan börjar nästa helg. Vi går in i den med pokalen i ena handen och en målbild i den andra.`,
    },
    {
      // Variant B — reflektion, klubbnivå
      body: `<strong>Vi vann cupen.</strong><br><br>Det är inte SM. Men det är det första laget i Sverige har sett i år, och det var oss som tog hem den. Förra säsongen kom vi inte till finalen. Året innan kom vi inte ens till semi.<br><br>Sen är det ligan. Den är något annat. Men idag är pokalen vår.`,
    },
    {
      // Variant C — Sture-Forsbacka-stil, lakoniskt
      body: `<strong>Pokalen är på byrån i klubbhuset nu.</strong> Lite blank. Lite lätt.<br><br>Det var inte säsongens viktigaste match. Men ingen sa något om det när Bengt höjde den.<br><br>Ligan börjar nästa helg. Det här minns vi.`,
    },
  ],
}
```

---

## Service-logik (utvidgning)

I `computeNextAnslag(game)` används `pickAnslagVariant` när texten ska renderas. Returvärdet från `computeNextAnslag` är fortfarande `AnslagKey | null` — variant-val sker i `AnslagOverlay`-komponenten via `pickAnslagVariant(CUP_ANSLAG[key], game.currentSeason, key, game.managedClubId)`.

```tsx
// AnslagOverlay.tsx
const text = ANSLAG_DATA[anslagKey]
const body = pickAnslagVariant(text, game.currentSeason, anslagKey, game.managedClubId)
const isDirektkvalad = isClubDirektkvalad(bracket, club.id)
const finalBody = body + (isDirektkvalad && text.bodyDirektkval
  ? text.bodyDirektkval.replace('{clubName}', club.name)
  : '')
```

---

## Migration från v1

1. Befintlig `cupAnslag.ts` har `body: string` per nyckel. Ersätt med `variants: AnslagVariant[]` enligt ovan.
2. Befintlig `AnslagOverlay.tsx` läser `anslag.body`. Ändra till `pickAnslagVariant(anslag, ...)`.
3. Inga ändringar i `seenAnslag`-state-hantering — den fortsätter spåra `AnslagKey`, inte variant-index.
4. Inga ändringar i `computeNextAnslag`-trigging — bara variant-val är nytt.

---

## Acceptanskriterier

- [ ] `AnslagVariant` och `AnslagText` typer exporterade från `src/domain/data/anslag/types.ts`
- [ ] `CUP_ANSLAG`-data uppdaterad med variants per anslag (15 texter totalt)
- [ ] `pickAnslagVariant()` deterministisk — samma `(season, key, clubId)` ger alltid samma variant
- [ ] `AnslagOverlay` använder `pickAnslagVariant` istället för direkt `.body`-access
- [ ] Direktkval-suffix appendas korrekt efter variant-text
- [ ] Vinnar-variant (`.winner` CSS) renderar för `cup_done_winner`
- [ ] Tester gröna (befintliga + nya — se `CODE_INSTRUCTION_ANSLAG_VARIANTS`)
