# CODE — Anslag-variants migration + Liga-anslag (2026-05-08)

**Kontext:** Cup-anslag är implementerat (commit `5921d95`) men har bara EN text per anslag. Detta uppdrag:

1. **Migrerar** befintlig `body: string` till `variants: AnslagVariant[]` med deterministisk slump
2. **Lägger till** liga-anslag (6 nya AnslagKey) som använder samma mekanik
3. **Korrigerar** befintlig Snålvinden-text ("hallarna" → "bandyplanerna")
4. **Lägger in obligatoriska tester** mot tidigare smärtpunkter (matchstepper, kalender, spelar-spår)

**Specer (auktoritativa):**
- `docs/SPEC_CUP_ANSLAG_2026-05-08.md` — variants-arkitektur + cup-texter
- `docs/SPEC_LEAGUE_ANSLAG_2026-05-08.md` — liga-texter + trigging

**Krockanalys redan gjord:** anslag och `specialDateService` (annandagsbandy/nyårsbandy/finaldag/cupfinal) lever på olika lager. Anslag är säsongs-narrativ på Portal. specialDateService är match-narrativ på match-skärm. Inga krockar.

---

## LÄS INNAN DU BÖRJAR

1. Båda specerna ovan — auktoritativa för text och trigging-logik
2. `docs/NARRATIVE_FRAMEWORK_2026-05-08.md` — strategisk översikt över anslag/scen/episod-lager
3. **Befintlig implementation:**
   - `src/domain/data/anslag/cupAnslag.ts`
   - `src/domain/services/anslagService.ts`
   - `src/presentation/components/anslag/AnslagOverlay.tsx`
4. **Kalendermapping:**
   - `src/domain/data/seasonPhases.ts` — round-baserade fas-namn
   - `src/domain/services/cupService.ts` — `CUP_MATCHDAYS` + `getManagedClubCupStatus`

---

## ANSLAG-01 · Skapa typer och pickAnslagVariant

**Ny fil:** `src/domain/data/anslag/types.ts`

```ts
export type ClubScenario =
  | 'underdog'
  | 'serie_giant'
  | 'kusinen_fran_landet'
  | 'storstadsutmanare'
  | 'newcomer'
  | 'established'

export type PrevResult =
  | 'cup_winner'
  | 'cup_eliminated_round1'
  | 'league_champion'
  | 'playoff_eliminated_quarter'
  | 'no_playoff'

export interface AnslagVariant {
  body: string
  weight?: number
  scenarios?: ClubScenario[]   // FRAMTID — inte använd i v1
  minSeason?: number           // FRAMTID
  prevResult?: PrevResult[]    // FRAMTID
}

export interface AnslagText {
  chapter: string
  variants: AnslagVariant[]
  bodyDirektkval?: string
}
```

**Utvidga `anslagService.ts`** med `pickAnslagVariant`:

```ts
import { mulberry32 } from '../utils/random'
import type { AnslagText, AnslagKey } from '../data/anslag/types'

export function pickAnslagVariant(
  text: AnslagText,
  season: number,
  anslagKey: AnslagKey,
  clubId: string,
): string {
  const candidates = text.variants  // FRAMTID: filter på scenarios/minSeason/prevResult
  
  if (candidates.length === 0) {
    throw new Error(`No variants for anslag ${anslagKey}`)
  }
  if (candidates.length === 1) {
    return candidates[0].body
  }
  
  const seed = hashString(`${season}_${anslagKey}_${clubId}`)
  const rand = mulberry32(seed)
  
  const totalWeight = candidates.reduce((sum, v) => sum + (v.weight ?? 1), 0)
  let r = rand() * totalWeight
  for (const variant of candidates) {
    r -= variant.weight ?? 1
    if (r < 0) return variant.body
  }
  return candidates[candidates.length - 1].body
}

function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}
```

---

## ANSLAG-02 · Migrera cupAnslag.ts till variants

**Fil:** `src/domain/data/anslag/cupAnslag.ts`

Ersätt nuvarande struktur med variants-array enligt `SPEC_CUP_ANSLAG_2026-05-08.md`. Kopiera texter direkt från specen — alla 15 cup-texter (5 anslag × 3 varianter, plus `cup_done_winner` är separat AnslagKey).

**OBS** — Snålvinden-texten i nuvarande implementation har "hallarna i östra Sverige". Det måste rättas till "bandyplanerna i östra Sverige" (Variant A). Bandyspelet är utomhusbaserat — hallar finns inte i fiktionen.

---

## ANSLAG-03 · Skapa leagueAnslag.ts

**Ny fil:** `src/domain/data/anslag/leagueAnslag.ts`

Importera `AnslagText` från `types.ts`. Lägg in alla 6 liga-anslag enligt `SPEC_LEAGUE_ANSLAG_2026-05-08.md` — 18 texter totalt.

```ts
import type { AnslagText } from './types'

export type LeagueAnslagKey =
  | 'league_start'
  | 'league_midwinter'
  | 'league_halfway'
  | 'playoff_qualification'
  | 'playoff_start'
  | 'season_done'

export const LEAGUE_ANSLAG: Record<LeagueAnslagKey, AnslagText> = {
  // ... alla 6 från specen
}
```

Utvidga unionstypen:
```ts
export type AnslagKey = CupAnslagKey | LeagueAnslagKey
```

---

## ANSLAG-04 · Utvidga computeNextAnslag med liga-trigging

**Fil:** `src/domain/services/anslagService.ts`

Lägg till liga-villkor enligt `SPEC_LEAGUE_ANSLAG_2026-05-08.md` (sektion "Service-logik"). Prioritetsordning: cup-anslag först, sen liga-anslag i ordning halfway > midwinter > qualification > playoff_start > season_done.

**Hjälpfunktioner som behövs (skapa eller använd befintliga):**
- `cupIsDone(game)` — `bracket.completed === true`
- `leagueHasStarted(game)` — finns någon liga-fixture med `status === 'completed'`
- `currentLeagueRound(game)` — högsta `roundNumber` bland spelade liga-fixtures + 1, eller bestäm via befintlig kalender-logik om finns
- `leagueComplete(game)` — alla 22 omgångar spelade
- `managedClubInPlayoffs(game)` — finns playoff-fixtures med managed-klubb
- `firstPlayoffMatchUpcoming(game)` — managedClub har en kommande playoff-fixture som inte spelats
- `managedClubLastSeasonMatchCompleted(game)` — managedClubs senaste fixture är `completed` och inga fler är `scheduled`

**Notering:** några av dessa kan redan finnas i kodbasen under andra namn (typ `getManagedClubLeagueStanding`, `getCurrentLeaguePhase`). Sök innan du skapar nya — målet är att inte duplicera.

---

## ANSLAG-05 · Uppdatera AnslagOverlay att använda pickAnslagVariant

**Fil:** `src/presentation/components/anslag/AnslagOverlay.tsx`

Ändra render-logiken:

```tsx
// FRÅN (nuvarande):
const anslag = ANSLAG_DATA[anslagKey]
const text = anslag.body  // direkt access

// TILL:
import { pickAnslagVariant } from '../../../domain/services/anslagService'

const anslag = getAnslagData(anslagKey)  // kombinerar CUP_ANSLAG och LEAGUE_ANSLAG
const variantBody = pickAnslagVariant(anslag, game.currentSeason, anslagKey, game.managedClubId)
const isDirektkvalad = anslagKey === 'cup_start' && isClubDirektkvalad(bracket, club.id)
const finalBody = variantBody + (
  isDirektkvalad && anslag.bodyDirektkval
    ? anslag.bodyDirektkval.replace('{clubName}', club.name)
    : ''
)
```

`getAnslagData(anslagKey)` är ny lookup-funktion som kollar både CUP_ANSLAG och LEAGUE_ANSLAG:

```ts
function getAnslagData(key: AnslagKey): AnslagText {
  if (key in CUP_ANSLAG) return CUP_ANSLAG[key as CupAnslagKey]
  if (key in LEAGUE_ANSLAG) return LEAGUE_ANSLAG[key as LeagueAnslagKey]
  throw new Error(`Unknown anslag key: ${key}`)
}
```

---

## ANSLAG-06 · Tester (OBLIGATORISKT — pga tidigare matchstepper-buggar)

**Tidigare smärtpunkter:** Matchstepper och matchkalendern har haft "sjukt mycket problem". Nedanstående tester ska inkluderas för att förhindra regression.

### Test 1: `anslagService.deterministic.test.ts`

```ts
describe('pickAnslagVariant', () => {
  it('returns same variant for same (season, key, clubId)', () => {
    const text: AnslagText = {
      chapter: 'X',
      variants: [{ body: 'A' }, { body: 'B' }, { body: 'C' }],
    }
    const a = pickAnslagVariant(text, 1, 'cup_start', 'forsbacka')
    const b = pickAnslagVariant(text, 1, 'cup_start', 'forsbacka')
    expect(a).toBe(b)
  })
  
  it('returns different variants for different seasons', () => {
    const text: AnslagText = {
      chapter: 'X',
      variants: [{ body: 'A' }, { body: 'B' }, { body: 'C' }],
    }
    const results = new Set([1,2,3,4,5,6,7,8,9,10].map(s =>
      pickAnslagVariant(text, s, 'cup_start', 'forsbacka')
    ))
    expect(results.size).toBeGreaterThan(1)  // åtminstone 2 olika varianter över 10 säsonger
  })
  
  it('handles single-variant arrays', () => {
    const text: AnslagText = {
      chapter: 'X',
      variants: [{ body: 'OnlyOne' }],
    }
    expect(pickAnslagVariant(text, 1, 'cup_start', 'club')).toBe('OnlyOne')
  })
})
```

### Test 2: `anslagService.triggering.test.ts`

Verifiera trigging-prioritet och att inte två anslag triggar samtidigt:

```ts
describe('computeNextAnslag — prioritet', () => {
  it('returns cup_start before any league anslag in early season', () => {
    const game = makeGame({
      currentMatchday: 1,
      cupBracket: makeBracket(),
      seenAnslag: [],
    })
    expect(computeNextAnslag(game)).toBe('cup_start')
  })
  
  it('league_halfway tar prioritet över league_midwinter när båda triggable', () => {
    // Edge case — ska aldrig hända naturligt eftersom league_midwinter triggas
    // round 7-9 och league_halfway round 11. Men säkerställ logiken.
    const game = makeGame({
      currentLeagueRound: 11,
      seenAnslag: [],  // ingen sedd än
    })
    expect(computeNextAnslag(game)).toBe('league_halfway')
  })
  
  it('returns null when all relevant anslag are seen', () => {
    const game = makeGame({
      currentLeagueRound: 11,
      seenAnslag: ['league_start', 'league_midwinter', 'league_halfway'],
    })
    expect(computeNextAnslag(game)).toBeNull()
  })
})
```

### Test 3: `anslagService.playerTracks.test.ts` (integration)

Simulera hela säsonger för olika spelar-spår och verifiera att rätt anslag triggas i rätt ordning.

```ts
describe('Anslag-spår — full säsong', () => {
  it('Spelare som åker ut i förstarundan får: Anslaget → Pokalen → Helgen kommer → Januari → Halvvägs → Marginaler → Sommaren kommer', () => {
    const seen: AnslagKey[] = []
    
    // Mock för spelare som åker ut i cup-runda 1
    const game = simulateSeasonForLoserCup({ eliminatedInRound: 1 })
    
    // Iterera Portal-renderingar genom säsongen
    for (const portalRender of game.portalRenderTimeline) {
      const next = computeNextAnslag(portalRender.gameState)
      if (next) seen.push(next)
    }
    
    expect(seen).toEqual([
      'cup_start',
      'cup_done',           // direkt efter förlust i förstarundan
      'league_start',
      'league_midwinter',
      'league_halfway',
      'playoff_qualification',
      'season_done',
    ])
    // Snålvinden och Helgen ska INTE finnas — utslagen i förstarundan
    expect(seen).not.toContain('cup_between')
    expect(seen).not.toContain('cup_finalweekend_pre')
    // playoff_start ska INTE finnas — inte kvalad
    expect(seen).not.toContain('playoff_start')
  })
  
  it('Direktkvalad spelare som vinner cupen får: Anslaget+suffix → Helgen → Pokalen-vinnare → ...', () => {
    // ... liknande för direktkval-vinnare
  })
  
  it('Cup-final-förlorare får cup_done (inte cup_done_winner)', () => {
    const game = makeGame({
      cupBracket: { ...makeBracket(), winnerId: 'other_club', completed: true },
      seenAnslag: [],
    })
    expect(computeNextAnslag(game)).toBe('cup_done')
  })
  
  it('Cup-final-vinnare får cup_done_winner (inte cup_done)', () => {
    const game = makeGame({
      cupBracket: { ...makeBracket(), winnerId: 'forsbacka', completed: true },
      seenAnslag: [],
      managedClubId: 'forsbacka',
    })
    expect(computeNextAnslag(game)).toBe('cup_done_winner')
  })
})
```

### Test 4: `anslagService.seasonReset.test.ts`

```ts
describe('seenAnslag rensning vid säsongs-byte', () => {
  it('Alla AnslagKey rensas vid säsongs-byte', () => {
    const game: SaveGame = makeGame({
      seenAnslag: [
        'cup_start', 'cup_between', 'cup_finalweekend_pre', 'cup_done',
        'cup_done_winner', 'league_start', 'league_midwinter',
        'league_halfway', 'playoff_qualification', 'playoff_start', 'season_done',
      ],
    })
    
    const after = processSeasonEnd(game)
    
    expect(after.seenAnslag).toEqual([])
  })
  
  it('Säsongs-byte triggar Anslaget igen i nästa säsong', () => {
    const game = makeGame({
      currentSeason: 1,
      seenAnslag: ['cup_start'],  // sedd förra säsongen
    })
    const afterTransition = processSeasonEnd(game)
    
    expect(afterTransition.seenAnslag).toEqual([])
    
    // I nästa säsong, vid första Portal-rendering
    const newSeasonGame = { ...afterTransition, currentSeason: 2, currentMatchday: 1, cupBracket: makeBracket() }
    expect(computeNextAnslag(newSeasonGame)).toBe('cup_start')
  })
})
```

### Test 5: `anslagService.calendar.test.ts` (mot kalender-buggar)

```ts
describe('Round-baserad trigging är konsistent', () => {
  it('league_midwinter triggas exakt en gång även om round stannar inom 7-9', () => {
    const game = makeGame({ currentLeagueRound: 7, seenAnslag: [] })
    expect(computeNextAnslag(game)).toBe('league_midwinter')
    
    // Markera som sedd
    game.seenAnslag.push('league_midwinter')
    
    // Round 8 — fortfarande inom spann men ska INTE trigga igen
    game.currentLeagueRound = 8
    expect(computeNextAnslag(game)).not.toBe('league_midwinter')
    
    // Round 9 — fortfarande inom spann
    game.currentLeagueRound = 9
    expect(computeNextAnslag(game)).not.toBe('league_midwinter')
  })
  
  it('Round-räknaren bryts inte vid övergång grundserie → playoff', () => {
    const game = makeGame({ currentLeagueRound: 22 })
    const round22 = currentLeagueRound(game)
    
    // Simulera övergång till playoff
    const playoffGame = transitionToPlayoff(game)
    const playoffRound = currentLeagueRound(playoffGame)
    
    // Round-räknaren ska inte hoppa eller resetta — den ska peka på senaste grundserie eller bli null
    expect(playoffRound).toBeGreaterThanOrEqual(22)  // eller null om vi byter system
  })
})
```

---

## VAD DU INTE SKA GÖRA

- **Inte ändra** `seenAnslag`-typen eller dess rensningslogik. Den hanterar redan både cup- och liga-keys eftersom den bara är `AnslagKey[]`.
- **Inte införa** nya match-narrativ-anslag som dubblar `specialDateService` (annandagsbandy, nyårsbandy, finaldag, cupfinal). De är match-skala och redan hanterade.
- **Inte ändra** `pickVariant` i `specialDateService.ts` — den är för match-narrativ (briefings, commentary). Vår `pickAnslagVariant` är ny separat funktion för säsongs-narrativ.
- **Inte slumpa** olika varianter vid varje render. `pickAnslagVariant` ska vara deterministisk per `(season, key, clubId)` — annars byter texten vid re-render eller save-laddning.
- **Inte trigga** två anslag samtidigt. Kontrollera prioritetsordningen i `computeNextAnslag`.

---

## ACCEPTANSKRITERIER

- [ ] Typer i `types.ts` skapad
- [ ] `pickAnslagVariant` deterministisk och testad
- [ ] `cupAnslag.ts` migrerad till variants — 15 texter
- [ ] **Snålvinden text korrigerad** ("hallarna" → "bandyplanerna")
- [ ] `leagueAnslag.ts` skapad — 18 texter
- [ ] `AnslagKey`-union utvidgad med liga-keys
- [ ] `computeNextAnslag` utvidgad med liga-trigging i rätt prioritetsordning
- [ ] Hjälpfunktioner (`cupIsDone`, `leagueHasStarted`, `currentLeagueRound`, etc) skapade eller återanvända från befintlig kod
- [ ] `AnslagOverlay` använder `pickAnslagVariant` + `getAnslagData`-lookup
- [ ] **Test 1-5 implementerade och gröna**
- [ ] Befintliga 686 tester fortfarande gröna
- [ ] `seenAnslag` rensas vid säsongs-byte (verifierad med Test 4)
- [ ] Direktkval-suffix appendas korrekt (verifierad med befintliga tester eller ny)

---

## RAPPORTERA NÄR KLART

Per ANSLAG-XX punkt: ✅ / ⚠️ / ❌ med en mening om vad som gjordes. Rapportera också:
- Om hjälpfunktioner redan fanns vs nyskapade
- Om någon test avslöjade befintlig bug — flagga det innan du fixar (vi vill veta vad som var trasigt)
- Om matchstepper-relaterad kod behövde justeras

Pusha som sammanhållen commit eller en commit per delsteg.
