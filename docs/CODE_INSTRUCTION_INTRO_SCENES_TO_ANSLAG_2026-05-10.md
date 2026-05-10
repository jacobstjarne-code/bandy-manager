# CODE — Konvertera intro-scener till anslag-modal-format

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** SPEC — fixar gammal klick-igenom-form i intro-flödet säsong 2+

---

## Bakgrund

Säsong 1 hanteras av ArrivalScene + BoardScreen (modern auto-progression + interaktiv yta). Säsong 2+ faller tillbaka på två klick-igenom-stegs-scener i gammal form: `boardMeetingScene` och `cupIntroScene`. Det skapar inkonsekvens — spelaren upplever moderna anslag (cup_start, cup_finalweekend_pre, cup_final_pre, cup_done) som modaler men dessa två scener fortfarande som klick-igenom-beats.

Innehållet i båda scenerna är värdefullt och ska bevaras. Bara formen byts.

---

## FIX-08 · Konvertera `boardMeetingScene` till anslag-modal

### Nuvarande beteende

`boardMeetingScene` triggas vid säsongsstart säsong 2+ (`shouldTriggerBoardMeeting`: säsong > 1, matchday 0, ingen match spelad, scenen inte visad). Renderar 4 beats:

1. inramning (auto, 4000ms): kaffe i klubbhuset, ordförande hälsar
2. lägesrapport (klick "Förstått"): kassör läser truppstorlek, kontrakt, kassa, transferbudget
3. förväntningar (klick "Det går bra"): ordförande sätter sportslig och social målsättning
4. avslut (klick "Då börjar vi"): ledamot påminner om bygdens betydelse

### Önskat beteende

EN modal-yta med all text i flow, motsvarande anslag-modalerna. Auto-rendering av all data i ett enda block. CTA "Då börjar vi →" som sista interaktion.

### Implementation

Skapa nytt anslag i `src/domain/data/anslag/` (eller utöka existerande struktur):

**Ny fil:** `src/domain/data/anslag/boardAnslag.ts`

```ts
import type { AnslagText } from './types'

export type BoardAnslagKey = 'season_kickoff'

export const BOARD_ANSLAG: Record<BoardAnslagKey, AnslagText> = {
  season_kickoff: {
    chapter: '⬩ Styrelsemötet ⬩',
    variants: [
      {
        body: `Kaffe i {clubhouse}. {chairmanFirstName} {chairmanLastName} hälsar.<br><br><em>"Då kör vi. Välkommen."</em><br><br><strong>{treasurerFirstName} {treasurerLastName}, kassör:</strong><br><em>"{reportText}<br><br>Mer har vi inte."</em><br><br><strong>{chairmanFirstName} {chairmanLastName}, ordförande:</strong><br><em>"Plats fem till åtta. Inget kvalspel.<br><br>Och håll bygden med oss. Tomma läktare är dåligt för bandyn och dåligt för budgeten."</em><br><br><strong>{memberFirstName} {memberLastName}, ledamot:</strong><br><em>"För många här är det här säsongens enda samling. Glöm inte det."</em>`,
      },
    ],
  },
}
```

Mallvariabler (renderas av `anslagService` template-funktion):
- `{clubhouse}` — klubbens clubhouse-namn (default "klubbhuset" om ej satt)
- `{chairmanFirstName}`, `{chairmanLastName}` — ordförande
- `{treasurerFirstName}`, `{treasurerLastName}` — kassör
- `{memberFirstName}`, `{memberLastName}` — ledamot
- `{reportText}` — dynamisk text byggd från squadSize, expiringContracts, cash, transferBudget (samma logik som `getBoardMeetingBeats` använder idag — flytta till `anslagService` som helper-funktion `buildBoardReportText(game)`)

### Trigger-integration

`computeNextAnslag` i `anslagService.ts` får ny prio: `season_kickoff` triggas när:
- `game.currentSeason >= 2`
- `game.currentMatchday === 0`
- Ingen match spelad
- `'season_kickoff'` ej i `seenAnslag`
- Inget annat anslag har högre prio

Disabla `shouldTriggerBoardMeeting` i `sceneTriggerService.ts`:

```ts
/**
 * Disabled 2026-05-10 — innehållet flyttat till season_kickoff-anslag i
 * boardAnslag.ts som visas i modal-format. Datan i boardMeetingScene.ts
 * är kvar för referens men scenen aktiveras inte längre.
 */
export function shouldTriggerBoardMeeting(): boolean {
  return false
}
```

**Behåll:** `boardMeetingScene.ts` (data + komponent) för referens. `getBoardMeetingBeats` används inte längre.

---

## FIX-09 · Konvertera `cupIntroScene` till anslag-modal

### Nuvarande beteende

`cupIntroScene` triggas före första cupmatchen varje säsong. Renderar 3 beats:

1. inramning (auto, 2500ms): "Lottningen kunde varit värre." replik från klubbhuset
2. motståndare (klick "Och?"): hemma/borta mot {opponent}, "Förstarundan brukar avgöras tidigt. Eller inte."
3. avslut (klick "Då kör vi"): "Vinst ger kvartsfinal. Förlust ger en söndag mer att träna. Ingen kommer minnas matchen — utom om ni förlorar."

### Önskat beteende

EN anslag-modal med innehållet samlat. Spelar samma roll som cup_start (säsongsramen) men för specifika första cupmatchen.

### Implementation

Lägg till ny key i `cupAnslag.ts`:

```ts
cup_first_match: {
  chapter: '⬩ Cupen börjar ⬩',
  variants: [
    {
      body: `<em>"Lottningen kunde varit värre."</em><br><br>Replik från klubbhuset. Ingen vet vem som sa det först.<br><br>{vsLabel} {motståndare}. Förstarundan brukar avgöras tidigt. Eller inte.<br><br>Vinst ger kvartsfinal. Förlust ger en söndag mer att träna. Ingen kommer minnas matchen — utom om ni förlorar.`,
    },
  ],
},
```

Mallvariabler: `{vsLabel}` (Hemma mot/Borta mot) + `{motståndare}` (motståndarens shortName).

### Trigger-integration

`computeNextAnslag` i `anslagService.ts` får ny prio: `cup_first_match` triggas när:
- Managed-klubb har en kommande cupmatch (round 1 i cupen) som scheduled
- `'cup_first_match'` ej i `seenAnslag`
- Inget annat anslag har högre prio

Måste komma EFTER `cup_start` i prio-ordningen så att säsongsramen visas först, sen den specifika första-cupmatchen.

Disabla `shouldTriggerCupIntro`:

```ts
/**
 * Disabled 2026-05-10 — innehållet flyttat till cup_first_match-anslag i
 * cupAnslag.ts. Datan i cupIntroScene.ts är kvar för referens men scenen
 * aktiveras inte längre.
 */
export function shouldTriggerCupIntro(): boolean {
  return false
}
```

**Behåll:** `cupIntroScene.ts` (data + komponent) för referens.

---

## Acceptanskriterier

- [ ] Säsong 2+ visar `season_kickoff`-anslag istället för 4-beats `boardMeetingScene`
- [ ] Före första cupmatch visar `cup_first_match`-anslag istället för 3-beats `cupIntroScene`
- [ ] Båda anslag använder samma modal-format som existerande cup-anslag
- [ ] Mallvariabler renderas korrekt med riktig spelar/styrelse-data
- [ ] `shouldTriggerBoardMeeting` returnerar alltid `false` med JSDoc-kommentar
- [ ] `shouldTriggerCupIntro` returnerar alltid `false` med JSDoc-kommentar
- [ ] Befintliga 751 tester gröna
- [ ] Nya tester: `season_kickoff` triggas i säsong 2 men inte säsong 1, `cup_first_match` triggas före första cupmatch

---

## Vad du INTE ska göra

- **Inte ta bort** `boardMeetingScene.ts` eller `cupIntroScene.ts` — datan bevaras för referens
- **Inte modifiera** ArrivalScene eller BoardScreen — säsong 1-flödet är intakt
- **Inte ändra** existerande anslag (cup_start, cup_finalweekend_pre, cup_final_pre, cup_done, cup_done_winner)
- **Inte uppfinna** nya tokens eller styling — använd existerande anslag-rendering

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. Pusha gärna i en commit.

Flagga också:
- Om template-variable-stödet behöver utbyggnad för de nya placeholders ({clubhouse}, {chairmanFirstName}, {reportText}, etc)
- Om buildBoardReportText-helper kräver ändringar i SaveGame-typen
