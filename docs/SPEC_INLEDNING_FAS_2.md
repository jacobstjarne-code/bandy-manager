# SPEC_INLEDNING_FAS_2 — Styrelsemötet som dialog-scen

**Datum:** 2026-05-02
**Författare:** Opus
**Status:** Spec-klar för Code
**Beroende:** Scene-system + SPEC_INLEDNING_FAS_1 + SPEC_BESLUTSEKONOMI Steg 2 levererade
**Estimat:** ~1 dag (Code 4-6h, Opus text 1-2h)

---

## VARFÖR

BoardMeetingScreen och PreSeasonScreen dubblar information: truppstorlek 16, kassa 330 tkr, transferbudget 65 tkr, 7 utgående kontrakt. Plus två formuleringar av samma fråga ("Håll mittentabellen" / "Fan mood 70 + Max 5 skador").

Tre paletter-skiften innan första matchen: mörk Scene-stil → ljus list-stil → mörk Portal. Friktion utan funktion.

Lösning: en dialog-scen i Scene-format. Karaktärerna talar (ordförande, kassör, ledamot — varierar per klubb). Siffrorna kommer fram naturligt. Slutet leder rakt till Portal.

---

## VAD VI BYGGER

### Datamodell

**Utöka Club-entiteten** (`src/domain/entities/Club.ts`):

```typescript
export interface BoardMember {
  firstName: string
  lastName: string
  age: number          // ålder vid spelstart (säsong 1)
  gender: 'm' | 'f'    // för pronomen i beats
}

export interface ClubBoard {
  chairman: BoardMember   // ordförande
  treasurer: BoardMember  // kassör
  member: BoardMember     // ledamot
}

export interface Club {
  // ... befintliga fält
  board: ClubBoard
  clubhouse: string
}
```

**Utöka ClubTemplate** (`src/domain/services/worldGenerator.ts`):

```typescript
interface ClubTemplate {
  // ... befintliga fält
  board: ClubBoard
  clubhouse: string
}
```

Vid världsgenerering: kopiera `board` och `clubhouse` rakt från template till Club. Ingen slumpning — fasta värden per klubb.

**Migration:** För befintliga saves som inte har `board`/`clubhouse` på sina klubbar — vid `loadGame`, leta upp matchande template via `club.id` och kopiera in värdena.

---

### CLUB_TEMPLATES — patcher

Lägg till `board` och `clubhouse` på varje av de 12 klubbarna i `worldGenerator.ts`:

```typescript
// club_forsbacka
board: {
  chairman: { firstName: 'Lars', lastName: 'Berglund', age: 58, gender: 'm' },
  treasurer: { firstName: 'Lennart', lastName: 'Dahlgren', age: 64, gender: 'm' },
  member: { firstName: 'Mikael', lastName: 'Sandberg', age: 47, gender: 'm' },
},
clubhouse: 'klubbhuset vid Slagghögen',

// club_soderfors
board: {
  chairman: { firstName: 'Britta', lastName: 'Lindqvist', age: 54, gender: 'f' },
  treasurer: { firstName: 'Bengt', lastName: 'Nordin', age: 61, gender: 'm' },
  member: { firstName: 'Sven-Erik', lastName: 'Wallin', age: 66, gender: 'm' },
},
clubhouse: 'bruksbaracken bakom Ässjan',

// club_vastanfors
board: {
  chairman: { firstName: 'Hans', lastName: 'Hedman', age: 52, gender: 'm' },
  treasurer: { firstName: 'Marianne', lastName: 'Selin', age: 49, gender: 'f' },
  member: { firstName: 'Kjell', lastName: 'Boström', age: 60, gender: 'm' },
},
clubhouse: 'föreningslokalen vid Schaktvallen',

// club_karlsborg
board: {
  chairman: { firstName: 'Anna-Lena', lastName: 'Mäki', age: 51, gender: 'f' },
  treasurer: { firstName: 'Stig', lastName: 'Niemi', age: 58, gender: 'm' },
  member: { firstName: 'Lennart', lastName: 'Karppinen', age: 62, gender: 'm' },
},
clubhouse: 'klubbstugan ovanför Bastionen',

// club_malilla
board: {
  chairman: { firstName: 'Karin', lastName: 'Petersson', age: 55, gender: 'f' },
  treasurer: { firstName: 'Bertil', lastName: 'Gustavsson', age: 63, gender: 'm' },
  member: { firstName: 'Sven', lastName: 'Almquist', age: 59, gender: 'm' },
},
clubhouse: 'gamla cafeterian på Hyttvallen',

// club_gagnef
board: {
  chairman: { firstName: 'Olle', lastName: 'Persson', age: 57, gender: 'm' },
  treasurer: { firstName: 'Maj-Britt', lastName: 'Holm', age: 54, gender: 'f' },
  member: { firstName: 'Rune', lastName: 'Forsberg', age: 65, gender: 'm' },
},
clubhouse: 'bystugan vid Älvvallen',

// club_halleforsnas
board: {
  chairman: { firstName: 'Göran', lastName: 'Celsing', age: 60, gender: 'm' },
  treasurer: { firstName: 'Kerstin', lastName: 'Ahlin', age: 53, gender: 'f' },
  member: { firstName: 'Birger', lastName: 'Lundgren', age: 67, gender: 'm' },
},
clubhouse: 'brukets gamla expedition',

// club_lesjofors
board: {
  chairman: { firstName: 'Krister', lastName: 'Bergvall', age: 49, gender: 'm' },
  treasurer: { firstName: 'Ulla', lastName: 'Nilsson', age: 56, gender: 'f' },
  member: { firstName: 'Tage', lastName: 'Andersson', age: 62, gender: 'm' },
},
clubhouse: 'träbyggnaden vid Kolbottnen',

// club_rogle
board: {
  chairman: { firstName: 'Per-Olof', lastName: 'Hansson', age: 54, gender: 'm' },
  treasurer: { firstName: 'Inger', lastName: 'Mårtensson', age: 51, gender: 'f' },
  member: { firstName: 'Sten', lastName: 'Rosengren', age: 59, gender: 'm' },
},
clubhouse: 'föreningshuset bredvid Planlunden',

// club_heros
board: {
  chairman: { firstName: 'Margareta', lastName: 'Ek', age: 56, gender: 'f' },
  treasurer: { firstName: 'Roland', lastName: 'Lindfors', age: 50, gender: 'm' },
  member: { firstName: 'Erland', lastName: 'Söderström', age: 61, gender: 'm' },
},
clubhouse: 'klubblokalen vid Hedvallen',

// club_skutskar
board: {
  chairman: { firstName: 'Kjell-Åke', lastName: 'Westman', age: 59, gender: 'm' },
  treasurer: { firstName: 'Birgit', lastName: 'Lundkvist', age: 56, gender: 'f' },
  member: { firstName: 'Lennart', lastName: 'Höglund', age: 65, gender: 'm' },
},
clubhouse: 'mötesrummet under läktaren på Sulfatvallen',

// club_slottsbron
board: {
  chairman: { firstName: 'Tor', lastName: 'Magnusson', age: 62, gender: 'm' },
  treasurer: { firstName: 'Inga', lastName: 'Sundvall', age: 57, gender: 'f' },
  member: { firstName: 'Jan-Erik', lastName: 'Wiklund', age: 61, gender: 'm' },
},
clubhouse: 'klubbhuset vid Forsvallen',
```

---

### Beat-struktur

Ny scen-fil: `src/domain/data/scenes/boardMeetingScene.ts` (eller motsvarande befintlig scen-pattern).

Funktion `getBoardMeetingBeats(game: SaveGame): Beat[]` som flätar in dynamiska värden.

**Hjälpfunktioner Code behöver:**

```typescript
function expiringContractsCount(club: Club, currentSeason: number): number {
  return club.squad.filter(p => p.contract?.endSeason === currentSeason).length
}

function formatTkr(amount: number): string {
  return Math.round(amount / 1000).toString()
}
```

**Beats:**

```typescript
function getBoardMeetingBeats(game: SaveGame): Beat[] {
  const club = game.club
  const { chairman, treasurer, member } = club.board
  const arena = club.arenaName
  const clubhouse = club.clubhouse
  const squadSize = club.squad.length
  const expiring = expiringContractsCount(club, game.currentSeason)
  const cash = formatTkr(club.cash)
  const transferBudget = formatTkr(club.transferBudget)

  return [
    {
      id: 'inramning',
      autoAdvance: true,
      durationMs: 4000,
      body: `Det luktar kaffe i ${clubhouse}.

Ordföranden ${chairman.firstName} ${chairman.lastName} slår sig ner. Vid bordsänden har kassören ${treasurer.firstName} ${treasurer.lastName} redan radat upp pärmar. ${member.firstName} ${member.lastName}, mångårig styrelseledamot, står vid fönstret och kollar ut mot ${arena}.

*"Då sätter vi igång. Välkommen."*`,
    },
    {
      id: 'lagesrapport',
      speaker: treasurer,
      body: `${treasurer.firstName} bläddrar i pärmen.

"Truppen är ${squadSize} spelare. ${expiring} har utgående kontrakt vid säsongsslut. Klubbkassan står på ${cash} tkr, transferbudgeten på ${transferBudget}. Mer än så har vi inte att jobba med.

Det är läget."`,
      cta: 'Förstått',
    },
    {
      id: 'forvantningar',
      speaker: chairman,
      body: `${chairman.firstName} läser av papperet. Ser upp.

"Två saker. Plats fem till åtta i tabellen — vi vill inte ner i kvalspel.

Och håll bygden med oss. Tomma läktare är dåligt för bandyn och dåligt för budgeten. Skadelistan får inte sluka oss heller. Mer än fem långtidsskadade och vi börjar låna från fel ställen."`,
      cta: 'Det går bra',
    },
    {
      id: 'avslut',
      speaker: member,
      body: `${member.firstName} vänder sig från fönstret.

"En sak till. För många här är detta säsongens enda samling. Du tränar inte ett lag, du håller en plats öppen. Glöm inte det."

${chairman.firstName} nickar. Mötet är slut.`,
      cta: 'Då börjar vi',
    },
  ]
}
```

**Notering om grammatik:**
- Beat 2: `"${treasurer.firstName} bläddrar i pärmen"` — funkar oavsett kön. Inga pronomen.
- Beat 3: `"${chairman.firstName} läser av papperet. Ser upp."` — bortvalt subjekt, funkar oavsett kön.
- Beat 4: `"${member.firstName} vänder sig från fönstret"` — bortvalt subjekt. Funkar.

Inga pronomen behövs i beat-texterna ovan. `gender`-fältet är förberett för framtida texter (kafferum, presskonferens, journalist) men används inte i intro-scenen.

---

## RUTNING

**Före:** IntroSequence → BoardMeetingScreen → PreSeasonScreen → Portal
**Efter:** IntroSequence → BoardMeetingScene → Portal

**Trigger** via `pendingScene` (etablerat i SPEC_BESLUTSEKONOMI Steg 2). Trigger-villkor i `sceneTriggerService.ts`:

- `game.currentSeason === 1`
- `game.currentMatchday === 0` (initialt) eller scene har inte visats än
- `game.shownScenes` innehåller inte `'board_meeting'`
- Ingen lineup vald än

När scenen är slut: `shownScenes.push('board_meeting')`, `pendingScene` rensas, AppRouter renderar Portal.

---

## BORTTAGNING

- `BoardMeetingScreen.tsx` raderas
- `PreSeasonScreen.tsx` raderas
- AppRouter-rutter för dem tas bort (`/game/board-meeting`, `/game/pre-season`)
- `HIDDEN_PATHS` i `BottomNav.tsx` rensas från dessa
- Befintliga tester ersätts med scen-tester

---

## MEKANIKKOPPLING

Alla siffror finns på SaveGame efter klubbgenerering:

- `game.club.squad.length` — truppstorlek
- `game.club.cash` — klubbkassa (i kr, formateras till tkr)
- `game.club.transferBudget` — transferbudget (i kr, formateras till tkr)
- `expiringContractsCount(club, currentSeason)` — utgående kontrakt
- `game.boardExpectations` — befintlig, behålls för spelmekanik (mid-table-targets, fan mood ≥70, max 5 långtidsskadade)

`getBoardMeetingBeats(game)` returnerar `Beat[]` med inflätade siffror dynamiskt.

---

## VAD DETTA INTE ÄR

- Inte interaktiva val. Beats klickas igenom.
- Inte kontraktsförhandling. Mötet nämner utgående kontrakt, hanterar dem inte.
- Inte tutorial. Vi förklarar inte UI.
- Inte 8 beats. 4 räcker.
- Inte information-dump. Lennart radar inte upp 12 siffror. Han säger 4.
- Inte UI-språk. "Fan mood 70" sägs inte av Lars. Han säger "håll bygden med oss".

---

## IMPLEMENTATIONSORDNING

1. **Code utökar `Club`-entiteten** med `board: ClubBoard` och `clubhouse: string`. Lägger till `BoardMember`/`ClubBoard`-interfaces.
2. **Code utökar `ClubTemplate`** i `worldGenerator.ts` med samma fält.
3. **Code patchar alla 12 entries** i `CLUB_TEMPLATES` med värdena från sektionen ovan. Kopiera bokstavligen.
4. **Code skriver migration** i `loadGame` som kopierar `board`/`clubhouse` från matching template för befintliga saves utan dessa fält.
5. **Code bygger `BoardMeetingScene`** med 4 beats enligt spec ovan.
6. **Code triggar scenen** via `sceneTriggerService` vid säsong 1 / matchday 0 / `shownScenes` saknar `board_meeting`.
7. **Code raderar `BoardMeetingScreen.tsx` + `PreSeasonScreen.tsx`** och rensar AppRouter + HIDDEN_PATHS.
8. **Tester:**
   - Beat-rendering med olika klubb-state (kassa, kontrakt, truppstorlek)
   - Migration sätter styrelse på existerande saves utan att krascha
   - Trigger-logik: scen visas vid matchday 0 säsong 1, inte annars
   - Borttagning: BoardMeetingScreen + PreSeasonScreen är inte längre i routern

---

## TESTER

```typescript
describe('BoardMeetingScene', () => {
  it('renderar 4 beats med inflätade siffror', () => {
    const game = mockGame({ clubId: 'club_forsbacka', squadSize: 16, cash: 330000, transferBudget: 65000 })
    const beats = getBoardMeetingBeats(game)
    expect(beats).toHaveLength(4)
    expect(beats[1].body).toContain('16 spelare')
    expect(beats[1].body).toContain('330 tkr')
    expect(beats[1].body).toContain('65')
  })

  it('inflätar arenanamn och styrelsemedlemmar per klubb', () => {
    const forsbacka = getBoardMeetingBeats(mockGame({ clubId: 'club_forsbacka' }))
    expect(forsbacka[0].body).toContain('Slagghögen')
    expect(forsbacka[0].body).toContain('Lars Berglund')

    const malilla = getBoardMeetingBeats(mockGame({ clubId: 'club_malilla' }))
    expect(malilla[0].body).toContain('Hyttvallen')
    expect(malilla[0].body).toContain('Karin Petersson')
  })

  it('triggar bara säsong 1, matchday 0, om inte redan visats', () => {
    expect(shouldTriggerBoardMeeting(mockGame({ season: 1, matchday: 0 }))).toBe(true)
    expect(shouldTriggerBoardMeeting(mockGame({ season: 1, matchday: 0, shownScenes: ['board_meeting'] }))).toBe(false)
    expect(shouldTriggerBoardMeeting(mockGame({ season: 2, matchday: 0 }))).toBe(false)
  })
})

describe('Club migration', () => {
  it('lägger till board och clubhouse på saves som saknar dem', () => {
    const oldSave = { club: { id: 'club_forsbacka' /* utan board/clubhouse */ } }
    const migrated = migrateGame(oldSave)
    expect(migrated.club.board.chairman.firstName).toBe('Lars')
    expect(migrated.club.clubhouse).toBe('klubbhuset vid Slagghögen')
  })
})
```

---

## VERIFIERING

Code spelar i webbläsare:

1. Nytt spel, välj klubb (testa minst 3 olika — Forsbacka, Söderfors, Karlsborg för att verifiera styrelsenamn varierar)
2. Verifiera BoardMeetingScene triggas (mörk Scene-stil)
3. Klicka genom 4 beats
4. Verifiera Portal renderas efter sista beat
5. Skärmdump per beat × 3 klubbar (12 skärmdumpar totalt)
6. 2-3 meningar i auditen: är dubbleringen borta? Färgmässigt sammanhängande? Känns det som ett bandyklubbsmöte?

---

## EFTERSPELSANTECKNING

Efter implementation:
- KVAR.md: SPEC_INLEDNING_FAS_2 går från "parkerat" till "levererad"
- Ett färgskifte färre i intro-flödet (mörk hela vägen från Scene → Scene → Portal)
- 36 namngivna styrelsemedlemmar finns nu på `club.board` — kan användas av framtida features (kafferum-kommentarer, presskonferens, lokaltidning, journalist-relationer)
- `gender`-fältet på BoardMember är förberett för framtida pronomen-användning även om intro-scenen inte använder det

Slut.
