# STOR REFAKTOR + BUGFIXAR — Matchdagskalender

**Denna spec ersätter ALLA andra spec-filer i docs/.**

Genomför i exakt denna ordning. `npm run build` efter varje sektion. Committa per sektion.

---

## DEL A: MATCHDAGSKALENDER — Refaktor

### Bakgrund

Nuvarande system använder `roundNumber` för att bestämma matchordning. Cupmatcher har `roundNumber` 101+ och mappas via `effectiveRound = roundNumber - 100` på ~15 ställen i koden. Slutspelsmatcher har `roundNumber` 23+ med hårdkodade startpunkter som krockar. Resultatet: buggar med matchordning, cup-visning och slutspelslogik.

### Lösning: `matchday`-fält på Fixture

Varje fixture får ett fält `matchday: number` som bestämmer spelordningen. Sätts EN gång vid generering. Ingen formel behövs — bara `sort by matchday`.

### Steg 1: Lägg till `matchday` i Fixture-entiteten

I `src/domain/entities/Fixture.ts`, lägg till:
```typescript
export interface Fixture {
  // ... befintliga fält ...
  roundNumber: number    // BEHÅLL — representerar ligaomgång (1-22) eller intern cup-/playoffnumrering
  matchday: number       // NYTT — global spelordning, bestämmer advance-ordningen
  // ...
}
```

### Steg 2: Generera matchday vid säsongsstart

I `src/domain/services/scheduleGenerator.ts`:

Liga-fixtures (omg 1-22) får `matchday = roundNumber`:
```typescript
// I generateSchedule(), efter att fixtures skapats:
// Varje fixture: matchday = roundNumber
```

I `src/domain/services/cupService.ts` → `generateCupFixtures()`:

Cup-fixtures får fasta matchdays som INTE krockar med liga. Cuprundor inflikas på matchdagar mellan ligarundor:

```typescript
const CUP_MATCHDAYS: Record<number, number> = {
  1: 3,     // Cup förstarunda spelas matchdag 3 (mellan ligaomg 2 och 3... nej det krockar)
}
```

**VIKTIGT:** Cup-matchdays måste vara MELLAN ligarunder, inte SAMMA. Bäst: använd halva tal eller lägg cup på egna dagar. Enklast: ge cup decimaltal eller lägg alla cup-matchdagar EFTER ligarunder de ska spelas vid:

```
Liga omg 1:  matchday 1
Liga omg 2:  matchday 2
CUP R1:      matchday 2.5  (spelas mellan omg 2 och 3)
Liga omg 3:  matchday 3
...
Liga omg 6:  matchday 6
CUP KF:      matchday 6.5
...
Liga omg 10: matchday 10
CUP SF:      matchday 10.5
...
Liga omg 15: matchday 15
CUP FINAL:   matchday 15.5
...
Liga omg 22: matchday 22
```

ELLER (enklare med heltal): Numrera alla matchdagar sekventiellt:
```
matchday 1:  Liga omg 1
matchday 2:  Liga omg 2
matchday 3:  Cup förstarunda
matchday 4:  Liga omg 3
matchday 5:  Liga omg 4
...
matchday 8:  Cup kvartsfinal
matchday 9:  Liga omg 6
...
matchday 13: Cup semifinal
...
matchday 18: Cup final
...
matchday 26: Liga omg 22 (sista)
matchday 27: Slutspel KF match 1
matchday 28: Slutspel KF match 2
...
```

**Rekommendation:** Heltalsvarianten. Skapa en funktion `buildSeasonCalendar()` som returnerar en ordnad lista av matchdagar med typ (liga/cup/playoff):

```typescript
interface MatchdaySlot {
  matchday: number
  type: 'league' | 'cup' | 'playoff'
  leagueRound?: number    // för liga: vilken omgång (1-22)
  cupRound?: number        // för cup: vilken cuprunda (1-4)
  date: string             // kalenderdatum
}

export function buildSeasonCalendar(season: number): MatchdaySlot[] {
  const calendar: MatchdaySlot[] = []
  let day = 0
  
  // Liga 22 omgångar + cup 4 rundor = 26 matchdagar
  // Cup inflikas efter omg 2, 6, 10, 15
  const CUP_AFTER_LEAGUE_ROUND: Record<number, number> = {
    2: 1,   // Cup R1 efter ligaomg 2
    6: 2,   // Cup KF efter ligaomg 6
    10: 3,  // Cup SF efter ligaomg 10
    15: 4,  // Cup Final efter ligaomg 15
  }
  
  for (let round = 1; round <= 22; round++) {
    day++
    calendar.push({
      matchday: day,
      type: 'league',
      leagueRound: round,
      date: getRoundDate(season, round),
    })
    
    if (CUP_AFTER_LEAGUE_ROUND[round]) {
      day++
      calendar.push({
        matchday: day,
        type: 'cup',
        cupRound: CUP_AFTER_LEAGUE_ROUND[round],
        date: getRoundDate(season, round), // Samma vecka, kan justeras
      })
    }
  }
  
  return calendar
}
```

### Steg 3: Tilldela matchday vid fixture-generering

**Liga:** I `createNewGame.ts` (eller var liga-fixtures skapas), använd `buildSeasonCalendar()` för att tilldela matchday:
```typescript
const calendar = buildSeasonCalendar(season)
// För varje ligafixture med roundNumber X:
//   fixture.matchday = calendar.find(s => s.type === 'league' && s.leagueRound === X)!.matchday
```

**Cup:** I `cupService.ts` → `generateCupFixtures()`:
```typescript
// För cup R1-fixtures:
//   fixture.matchday = calendar.find(s => s.type === 'cup' && s.cupRound === 1)!.matchday
```

**Cup nästa omgång:** I `generateNextCupRound()`:
```typescript
// cupRound 2 (KF) → matchday från kalendern
// cupRound 3 (SF) → matchday från kalendern
// cupRound 4 (Final) → matchday från kalendern
```

**Slutspel:** I `playoffTransition.ts` → `handlePlayoffStart()` och i `advancePlayoffRound()`:
```typescript
// Hitta högsta använda matchday
const maxMatchday = Math.max(...game.fixtures.map(f => f.matchday))
// KF match 1: maxMatchday + 1, match 2: maxMatchday + 2, osv
```

### Steg 4: Byt ut effectiveRound() ÖVERALLT

Sök och ersätt:
```bash
grep -rn "effectiveRound\|roundNumber - 100\|roundNumber.*isCup" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**roundProcessor.ts:**
```typescript
// VAR: function effectiveRound(f) { return f.isCup ? f.roundNumber - 100 : f.roundNumber }
// VAR: const nextRound = Math.min(...scheduledFixtures.map(effectiveRound))
// BLI:
const nextMatchday = Math.min(...scheduledFixtures.map(f => f.matchday))
const roundFixtures = game.fixtures.filter(f =>
  f.matchday === nextMatchday &&
  (f.status === FixtureStatus.Scheduled || f.status === FixtureStatus.Completed)
)
```

**DashboardScreen.tsx:**
```typescript
// VAR: .sort((a, b) => effectiveRound(a) - effectiveRound(b))
// BLI:
.sort((a, b) => a.matchday - b.matchday)
```

**MatchScreen.tsx:**
```typescript
// Samma: ersätt effectiveRound-sortering med matchday-sortering
```

### Steg 5: Ta bort CUP_ROUND_NUMBERS

I `cupService.ts`:
```typescript
// TA BORT:
const CUP_ROUND_NUMBERS: Record<number, number> = {
  1: 101, 2: 103, 3: 107, 4: 111,
}
```
Cup-fixtures behöver inte längre `roundNumber` 101+. De kan ha `roundNumber = cupRound` (1-4) med `isCup = true`, och `matchday` styr ordningen.

### Steg 6: getRoundDate — använd matchday

Skapa en ny funktion eller uppdatera `getRoundDate` att ta matchday:
```typescript
// Kalendern har redan datum per matchday
// roundProcessor kan slå upp datum via kalendern istället för ROUND_DATES-tabellen
```

Alternativt: behåll ROUND_DATES men mappa via matchday istället för roundNumber.

### Steg 7: SaveGame — spara kalendern

Lägg till `seasonCalendar: MatchdaySlot[]` i SaveGame så den persisteras. Alternativt: generera den deterministiskt från `season`-numret (ingen state behövs).

### Migration av befintliga saves

I gameStore.ts, när spardata laddas:
```typescript
// Om fixture saknar matchday, beräkna det:
if (game.fixtures.some(f => f.matchday === undefined)) {
  const calendar = buildSeasonCalendar(game.currentSeason)
  game.fixtures = game.fixtures.map(f => {
    if (f.matchday !== undefined) return f
    if (f.isCup) {
      const cupRound = /* hitta från cupBracket */
      const slot = calendar.find(s => s.type === 'cup' && s.cupRound === cupRound)
      return { ...f, matchday: slot?.matchday ?? f.roundNumber }
    }
    if (f.roundNumber > 22) {
      // Slutspel: matchday = 26 + (roundNumber - 23)
      return { ...f, matchday: 26 + (f.roundNumber - 23) }
    }
    // Liga:
    const slot = calendar.find(s => s.type === 'league' && s.leagueRound === f.roundNumber)
    return { ...f, matchday: slot?.matchday ?? f.roundNumber }
  })
}
```

---

## DEL B: BUGFIXAR

Dessa fixar ska göras EFTER matchday-refaktorn.

### B1. Bytesbuggen: 12 spelare

I `MatchScreen.tsx`, `onAssignPlayer`: när en ny spelare sätts på en slot som har en spelare, ta bort den fördrivna från `startingIds` och lägg på bänken. Se detaljerad fix i föregående SPEC_ALLA_FIXAR.md punkt 1.

### B2. Cupmatch-resultat visas som oavgjort

I `MatchDoneOverlay.tsx`: kolla `fixture.penaltyResult` och `fixture.overtimeResult` för att bestämma vinst/förlust. Visa "str. X-Y" under poängen.

### B3. (politiker) template-variabler

I `politicianEvents.ts`: ersätt `{politician}`, `{paper}`, `{club}`, `{amount}` med riktiga värden innan headline används.

### B4. "Intensitet 1" i UI

I `NextMatchCard.tsx`: ta bort "· Intensitet {rivalry!.intensity}" och intensitet-taggen.

### B5. Cup "Klar för semifinalen" vid säsongsstart

I `DashboardScreen.tsx` → CupCard: använd `highestWonRound` istället för `playedAndWon.length` för att bestämma nästa omgångsnamn.

### B6. Dashboard cup-ordning

Fixas automatiskt av matchday-refaktorn — `sort by matchday` ger alltid rätt ordning.

### B7. Lönebudget blockerar kontrakt

I `TransfersScreen.tsx`: ta bort blockerande `wageBudget`-check. Visa varning istället.

### B8. Transfers: bara 1 bud

I `transferService.ts` → `createOutgoingBid`: höj från 1 till 3 simultana bud.

### B9. Slutspel: vinst ger orange istället för grön

Sök i matchresultat-komponenter efter färglogik. Vinst = `var(--success)`, förlust = `var(--danger)`, oavgjort = `var(--accent)`.

### B10. "SLUTSPEL"-tag → "TOPP 8"

I `DashboardScreen.tsx`: byt text, visa inget om 0 matcher spelade.

### B11. Statistik-flik: tom + blå outline

I `TabellScreen.tsx`: placeholder + `outline: 'none'`.

### B12. Ekonomi: kassan hoppar

I `roundProcessor.ts` ekonomi-blocket: 
- Lägg till console.log som loggar varje intäkts/kostnadskomponent för managed club
- Verifiera att matchRevenue bara beräknas vid hemmamatch (inte bortamatch)
- Verifiera att simulatedFixtures bara innehåller DENNA omgångs matcher
- Fixa rand()-fluktationer i lottery/kiosk genom att använda stabilare beräkningar

### B13. Bytesknapp markerad som default i live

I `MatchLiveScreen.tsx`: default play speed = 'normal'.

### B14. Terminologi

I `src/domain/data/matchCommentary.ts`: "vadden"→"vaden". **Offside SKA VARA KVAR.**
I `scoutingService.ts`: "löpkapacitet"→"skridskoåkning i båda riktningar" m.fl.
Sök: `grep -rni "löpkapacitet\|gult kort\|gula kort\|3 poäng\|frispark\|tackling\|vadden" src/`

### B15. Scoutrapporter: goalkeeping för utespelare

I `scoutingService.ts`: filtrera bort `goalkeeping` från weakest om utespelare.

### B16. Bandydoktorn intro + felmeddelande

I `BandyDoktorScreen.tsx`: intro-text + tydligare felmeddelande.

---

## DEL C: UI-POLISH

### C1. Välj klubb-skärmen

Se `docs/FIX_VALJ_KLUBB.md`: mörk header + kompaktare kort.

### C2. BoardMeeting

Se `docs/FIX_BOARD_MEETING.md`: tightare padding.

### C3. Dashboard cup-kort text

Cupen ska visa relevant info: "Förstarunda vs X — spelas matchdag Y" istället för "Klar för semifinalen".

---

## ORDNING

1. **DEL A** — Matchdagsrefaktorn (steg 1-7 + migration)
2. **DEL B1** — Bytesbuggen
3. **DEL B2** — Cupmatch oavgjort
4. **DEL B3** — Politiker template
5. **DEL B4** — Intensitet i UI
6. **DEL B5** — Cup semifinalen-bugg
7. **DEL B7** — Lönebudget
8. **DEL B8** — Flera transferbud
9. **DEL B9** — Slutspelfärger
10. **DEL B10-B16** — Övriga buggar
11. **DEL C** — UI-polish

`npm run build` efter varje steg. Pusha efter varje sektion (A, B, C).

## Verifiering efter DEL A

```bash
# Inga effectiveRound-anrop kvar:
grep -rn "effectiveRound\|roundNumber.*100\|roundNumber - 100" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "ROUND_DATES"
# Ska ge 0 resultat

# Alla fixtures har matchday:
# (verifiera i browser console efter ny spelstart)

npm run build
```

## Verifiering efter DEL B
```bash
grep -rni "löpkapacitet\|gult kort\|gula kort\|3 poäng\|frispark\|tackling\|vadden\|Intensitet.*intensity\|{politician}\|{paper}\|{club}\|{amount}" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska ge 0 resultat

npm run build
```
