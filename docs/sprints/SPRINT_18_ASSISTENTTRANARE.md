# SPRINT 18 — ASSISTENTTRÄNARE

**Typ:** Ny domän-entitet + service + 6 use cases
**Uppskattad tid:** 5–7h
**Princip:** Bygg entiteten och servicen komplett. Wira upp alla 6 use cases, men bara inbox-meddelandet efter AI-simulerad match är initialt synligt i UI. Övriga use cases finns som funktioner men triggas inte än — de slås på i senare sprintar.

---

## 18A — Entitet

Skapa `src/domain/entities/AssistantCoach.ts`:

```typescript
export type CoachPersonality = 'calm' | 'sharp' | 'jovial' | 'grumpy' | 'philosophical'
export type CoachBackground = 'former-player' | 'academy-coach' | 'tactician' | 'veteran'

export interface AssistantCoach {
  name: string          // t.ex. "Björn Ekman"
  age: number           // 40–65
  personality: CoachPersonality
  background: CoachBackground
  initials: string      // auto-genereras från name, t.ex. "BE"
}
```

**Exportera** också från `src/domain/entities/index.ts`.

---

## 18B — Lägg till på SaveGame

Uppdatera `src/domain/entities/SaveGame.ts`:

```typescript
export interface SaveGame {
  // ... befintliga fält
  assistantCoach: AssistantCoach
}
```

Lägg till i `saveGameStorage.ts` migration (säkerhetsaudit-kompatibelt: gamla save-filer utan fältet får en slumpad tränare vid migration):

```typescript
// I migrateSaveGame:
if (!save.assistantCoach) {
  save.assistantCoach = generateAssistantCoach(save.id)
}
```

Lägg till i `isValidSaveGameStructure()` att `assistantCoach` är valfritt (migrationen fyller i).

---

## 18C — Service

Skapa `src/domain/services/assistantCoachService.ts`:

```typescript
import type { AssistantCoach, CoachPersonality, CoachBackground } from '../entities/AssistantCoach'

// Återanvänd FIRST_NAMES och LAST_NAMES från aiCoachService.ts
// (exportera därifrån om de inte redan är exporterade)

const PERSONALITIES: CoachPersonality[] = ['calm', 'sharp', 'jovial', 'grumpy', 'philosophical']
const BACKGROUNDS: CoachBackground[] = ['former-player', 'academy-coach', 'tactician', 'veteran']

/**
 * Slumpar fram en assistenttränare vid NewGame.
 * Deterministisk baserat på saveId så samma spelfil alltid får samma tränare.
 */
export function generateAssistantCoach(seed: string): AssistantCoach {
  const hash = simpleHash(seed)
  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length]
  const lastName = LAST_NAMES[(hash >> 8) % LAST_NAMES.length]
  const name = `${firstName} ${lastName}`
  const initials = `${firstName[0]}${lastName[0]}`
  const age = 40 + (hash % 26)  // 40–65
  const personality = PERSONALITIES[(hash >> 16) % PERSONALITIES.length]
  const background = BACKGROUNDS[(hash >> 20) % BACKGROUNDS.length]
  
  return { name, age, personality, background, initials }
}

function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}
```

---

## 18D — Quote generator (kärnfunktion)

Samma service får en quote-funktion som all UI-integration använder:

```typescript
export type QuoteContext =
  | { type: 'match-result'; result: 'win' | 'draw' | 'loss'; score: string }
  | { type: 'halftime'; leading: boolean; margin: number }
  | { type: 'tactic-change'; bold: boolean }
  | { type: 'weekly-decision'; topic: string }
  | { type: 'season-summary'; finalPosition: number; expectation: number }
  | { type: 'press-conference'; result: 'win' | 'draw' | 'loss' }

/**
 * Returnerar ett citat från assistenttränaren baserat på kontext och personlighet.
 * Alltid samma personlighet per spelfil (från coach.personality).
 */
export function generateCoachQuote(coach: AssistantCoach, context: QuoteContext): string {
  // Matrix: 6 kontexter × 5 personligheter = 30 citatuppsättningar
  // Varje uppsättning: 3–5 varianter att slumpa från
  // Implementera alla 30 — se exempel nedan
}
```

**Exempel-citat för förlust per personlighet** (variera med 3–5 per personlighet):

```typescript
const LOSS_QUOTES: Record<CoachPersonality, string[]> = {
  calm: [
    "Det där var ingen bra dag. Vi tittar på det.",
    "Ingen idé att hänga läpp. Nästa match kommer.",
    "Vi ska förstå vad som gick fel. Sen går vi vidare.",
  ],
  sharp: [
    "Vi gjorde fel saker i fel stunder. Genomgång imorgon. Hela laget.",
    "Det räcker inte. Alla vet vad som ska ändras.",
    "Jag har sett det här förut. Vi fixar det på träningen.",
  ],
  jovial: [
    "Huvudet upp. Vi reser oss. Nästa omgång är vår — det lovar jag dig.",
    "Det händer. Vi tar dom nästa gång.",
    "Laget är bättre än resultatet. Hoppas de tror på det själva också.",
  ],
  grumpy: [
    "Jag sa ju det. Ska man lyssna får man svar. Nu är det som det är.",
    "Samma fel igen. Varför lär vi oss inte?",
    "Det här var väntat. Tyvärr.",
  ],
  philosophical: [
    "Alla gör förluster. Frågan är vad man gör dan efter.",
    "En match är en match. En säsong är något helt annat.",
    "Det där var inte oss. Vi hittar tillbaka.",
  ],
}
```

Gör samma struktur för alla 6 kontexter. Lägg till kortare tillägg baserat på `background`:
- `former-player`: ibland "Jag spelade såna matcher själv"
- `academy-coach`: ibland "Spelarna utvecklas genom sånt här"
- `tactician`: ibland "Statistiskt hade vi övertaget"
- `veteran`: ibland "Tillbaka på 80-talet..."

Dessa tillägg är optionella (30–40% chans) så det inte blir tjatigt.

---

## 18E — NewGame-integration

I `NewGameScreen.tsx` eller motsvarande NewGame-flow:

```typescript
import { generateAssistantCoach } from '../../domain/services/assistantCoachService'

// När nytt sparspel skapas:
const assistantCoach = generateAssistantCoach(newSaveId)
const saveGame: SaveGame = {
  // ... övriga fält
  assistantCoach,
}
```

---

## 18F — Use case 1: Inbox-meddelande efter AI-simulerad match (ENDA SOM WIRAS UPP I UI NU)

När en match har blivit AI-simulerad (spelaren kom tillbaka efter refresh mitt i match, eller lämnade dashboarden), skapas ett inbox-meddelande i tränarens röst.

**Trigger:** `simulateAbandonedMatch` action (byggs i Sprint 19) anropar detta.

**Implementation:**

```typescript
// I inboxService.ts eller ny helper
import { generateCoachQuote } from './assistantCoachService'

export function createAbandonedMatchInboxMessage(
  coach: AssistantCoach,
  fixture: Fixture,
  result: 'win' | 'draw' | 'loss',
  score: string
): InboxMessage {
  const quote = generateCoachQuote(coach, { type: 'match-result', result, score })
  return {
    id: generateId(),
    from: coach.name,
    fromRole: 'Assistenttränare',
    avatar: { type: 'initials', initials: coach.initials, bg: 'var(--accent-dark)' },
    subject: `${fixture.homeShort}–${fixture.awayShort} ${score}`,
    body: quote,
    tone: 'coach',  // ny ton — rendreras med italic Georgia + initials-avatar
    date: currentDate,
    read: false,
  }
}
```

**UI-rendering (InboxCard eller motsvarande):**

När `message.tone === 'coach'`:
- Liten cirkel med initialer (var(--accent-dark) bakgrund, vit bold text) till vänster
- Namn + "ASSISTENTTRÄNARE"-label under
- Italic Georgia 12px body-text (citatet)
- Match-resultatet som mindre rad under

---

## 18G — Use cases 2–6: Förbered men wira inte UI än

Skapa helper-funktioner för varje use case som kan kallas från framtida sprintar:

```typescript
// I assistantCoachService.ts

/** Use case 2: Halvtidskommentar — alternativ röst i HalftimeModal */
export function getHalftimeCoachComment(
  coach: AssistantCoach,
  homeScore: number,
  awayScore: number,
  isHome: boolean
): string {
  const leading = isHome ? homeScore > awayScore : awayScore > homeScore
  const margin = Math.abs(homeScore - awayScore)
  return generateCoachQuote(coach, { type: 'halftime', leading, margin })
}

/** Use case 3: Taktikval-feedback mid-match */
export function getTacticChangeFeedback(
  coach: AssistantCoach,
  wasBoldChange: boolean
): string {
  return generateCoachQuote(coach, { type: 'tactic-change', bold: wasBoldChange })
}

/** Use case 4: Veckans beslut — ibland formulerat av assistenten */
export function framesWeeklyDecision(coach: AssistantCoach): boolean {
  // 30% chans att assistenten är den som frågar istället för styrelsen
  return Math.random() < 0.3
}

/** Use case 5: Säsongssammanfattning */
export function getSeasonSummaryReflection(
  coach: AssistantCoach,
  finalPosition: number,
  expectation: number
): string {
  return generateCoachQuote(coach, { type: 'season-summary', finalPosition, expectation })
}

/** Use case 6: Presskonferens — alternativ röst ibland */
export function canSubstituteAtPressConference(coach: AssistantCoach): boolean {
  // Efter förluster: 40% chans att assistenten tar pressen istället
  return Math.random() < 0.4
}
```

Dessa anropas inte av något UI ännu — de är förberedda för framtida sprints. Men de ska finnas, vara testade och redo.

---

## Acceptanskriterier

- [ ] `AssistantCoach`-entitet finns och exporteras
- [ ] `SaveGame` har fältet `assistantCoach` och migration fungerar
- [ ] `generateAssistantCoach(seed)` är deterministisk (samma seed → samma coach)
- [ ] `generateCoachQuote()` täcker alla 6 kontexter × 5 personligheter = 30 kombinationer med 3–5 varianter vardera
- [ ] NewGame skapar en assistenttränare automatiskt
- [ ] Helper-funktioner för alla 6 use cases finns (även de som inte wiras upp)
- [ ] Inbox-meddelande-variant `tone: 'coach'` renderas korrekt (initials-avatar + italic Georgia + name + role-label)
- [ ] Bakgrund (former-player etc.) påverkar ibland citat-stilen (30–40% chans)
- [ ] Inga testfel (`npm test`)

---

## Filer som skapas/ändras

**Nya:**
- `src/domain/entities/AssistantCoach.ts`
- `src/domain/services/assistantCoachService.ts`
- Eventuellt `src/domain/services/__tests__/assistantCoachService.test.ts`

**Ändras:**
- `src/domain/entities/SaveGame.ts`
- `src/domain/entities/index.ts`
- `src/application/storage/saveGameStorage.ts` (migration + validation)
- `src/domain/services/aiCoachService.ts` (exportera FIRST_NAMES/LAST_NAMES om inte redan)
- `src/domain/services/inboxService.ts` (nytt meddelande-type `tone: 'coach'`)
- `src/presentation/screens/NewGameScreen.tsx` (skapa coach vid newgame)
- `src/presentation/components/inbox/InboxCard.tsx` (rendera `tone: 'coach'`)
- `src/domain/entities/Inbox.ts` (lägg till `tone: 'coach'` i enum)

---

## Designreferens

Inbox-meddelande-layout (mobilbredd 398px content):
- Liten cirkel (28×28px) med initialer, kopparbakgrund, vit bold Georgia 11px text
- Till höger om cirkeln:
  - Rad 1: label "BJÖRN EKMAN · ASSISTENT" (9px, uppercase, letter-spacing 1px, muted color)
  - Rad 2: match-resultatet (11px, regular)
  - Rad 3+: italic Georgia 12px, spelar-citatet
- Padding 10px 12px, card-sharp

Se tidigare mockup för exakt layout.
