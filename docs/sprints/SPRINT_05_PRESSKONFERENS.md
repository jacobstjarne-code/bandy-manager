# SPRINT 05 — PRESSKONFERENS & JOURNALIST

**Tid:** ~5h · **ATGARDSBANK:** WEAK-002, WEAK-008, DEV-002, DEV-006, DEV-013, DREAM-001, WEAK-016

Presskonferensen blir matchens emotionella avslut. Journalisten minns. Motståndarens tränare existerar.

**Mockup:** `docs/mockups/sprint05_presskonferens.html`

---

## WEAK-002 + DEV-002 — Presskonferens direkt efter match

Plats: `src/application/useCases/roundProcessor.ts` fixturehantering

Idag: press-event hamnar i `pendingEvents`-kön och kan ses omgångar senare. Ändra så press triggas DIREKT efter managed match.

Fix:
1. Efter managed fixture completed, generera press-event
2. Sätt `game.pendingPressConference = event` (nytt fält på SaveGame)
3. `GranskaScreen.tsx` renderar press-scenen OM `pendingPressConference` finns, INNAN övriga events

Eller enklare: sortera `pendingEvents` så `pressConference`-typ alltid är först efter match.

Lägg till i SaveGame:
```typescript
pendingPressConference?: GameEvent
```

I GranskaScreen.tsx, efter RESULTAT-HERO:
```tsx
{game.pendingPressConference && (
  <PressConferenceInline
    event={game.pendingPressConference}
    journalist={game.journalist}
    onResolve={(choiceId) => {
      resolveEvent(game.pendingPressConference!.id, choiceId)
      // resolveEvent ska rensa pendingPressConference
    }}
  />
)}
```

Skapa `PressConferenceInline`-komponent baserat på befintlig `PressConferenceScene` men utan fixed overlay — den renderas inline som ett kort i GranskaScreen.

---

## WEAK-008 + DEV-006 — Journalistens minne biter

Plats: `src/domain/services/pressConferenceService.ts` + `journalistService.ts`

Lägg till ny kategori `followUp` i QUESTIONS som triggas när `journalist.memory.slice(-3)` innehåller sentiment < -5 OCH senaste matchen är relevant.

```typescript
// I pressConferenceService.ts, ny funktion:
function findFollowUpQuestion(journalist: Journalist, game: SaveGame): PressQuestion | null {
  const recent = journalist.memory.slice(-3)
  const hasNegativeMemory = recent.some(m => m.sentiment <= -5)
  if (!hasNegativeMemory) return null

  const lastNegative = recent.filter(m => m.sentiment <= -5).slice(-1)[0]
  const roundsSince = game.currentRound - lastNegative.matchday

  // Follow-up-frågor som refererar gamla svar:
  const followUps: PressQuestion[] = [
    {
      text: `Förra mötet sa du att försvaret skulle hålla. Ni har släppt in ${game.goalsAgainstRecent ?? 'flera'} mål på sista matcherna. Vad säger du nu?`,
      preferIds: ['cl15', 'l_h1'],
      minRound: lastNegative.matchday + 3,
    },
    {
      text: `Du lovade vändning. Den har inte kommit. Hur mycket längre ska vi vänta?`,
      preferIds: ['cl13', 'l_c6'],
      minRound: lastNegative.matchday + 5,
    },
    {
      text: `För ${roundsSince} omgångar sen sa du att truppen räcker. Gör den det?`,
      preferIds: ['l_h4', 'bl_c6'],
      minRound: lastNegative.matchday + 4,
    },
  ]

  const eligible = followUps.filter(q => (q.minRound ?? 0) <= game.currentRound)
  return eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : null
}
```

I `buildPressConferenceEvent`, kolla follow-up FÖRST:
```typescript
const followUp = findFollowUpQuestion(journalist, game)
if (followUp && Math.random() < 0.4) {
  // 40% chans att en follow-up prioriteras framför standardfråga
  return buildEventFromQuestion(followUp, ...)
}
```

---

## DEV-013 — Presskonferens-avslag med konsekvens

Plats: `pressConferenceService.ts` + inbox

När spelaren väljer "Vägra svara" (choice.id inkluderar `refuse` eller liknande), `journalist.pressRefusals++`.

Om `pressRefusals >= 3`:
1. Generera kritisk artikel i inbox efter nästa match
2. Sätt `game.journalist.style = 'provocative'` permanent
3. Tidningsrubriken på GranskaScreen för nästa match blir: `"${managerName} tystnade. Frågan hänger i luften."`

Lägg till i journalistService.ts:
```typescript
export function generateCriticalArticle(journalist: Journalist, managerName: string): InboxItem {
  return {
    id: `article_refusal_${journalist.pressRefusals}`,
    type: InboxItemType.MediaEvent,
    title: `${journalist.outlet}: "${managerName} ducker frågorna"`,
    body: `Ledare i lokaltidningen: Klubbens ledning har nu vägrat tre presskonferenser i rad. Det är inte bara en fråga om PR — det är en fråga om respekt för orten, supportrarna och de som följer laget. ${managerName} behöver börja svara.`,
    date: /* current */,
    isRead: false,
  }
}
```

---

## DREAM-001 + WEAK-016 — Rivalens röst & motståndarens manager

Plats: Ny fil `src/domain/services/opponentManagerService.ts`

Varje AI-klubb får en tränare vid spelstart. Lägg till i Club:
```typescript
opponentManager?: {
  name: string
  persona: 'confident' | 'defensive' | 'cryptic' | 'professorial'
  yearsAtClub: number
}
```

Generera vid worldGen:
```typescript
const MANAGER_FIRSTNAMES = ['Hans', 'Bengt', 'Lars', 'Ulf', 'Mats', 'Kenneth', 'Peter', 'Anders', 'Roger', 'Sven-Erik', 'Leif', 'Göran']
const MANAGER_LASTNAMES = ['Nordin', 'Eklund', 'Holm', 'Sjögren', 'Friberg', 'Dahlström', 'Lundmark', 'Berg', 'Åhlén', 'Vikström']
const PERSONAS = ['confident', 'defensive', 'cryptic', 'professorial']

export function generateOpponentManager(rand: () => number): Club['opponentManager'] {
  return {
    name: `${pick(MANAGER_FIRSTNAMES, rand)} ${pick(MANAGER_LASTNAMES, rand)}`,
    persona: pick(PERSONAS, rand),
    yearsAtClub: Math.floor(rand() * 8) + 1,
  }
}
```

Pre-match inbox (triggas för derby eller högprofilsmatch):
```typescript
export function generatePreMatchOpponentQuote(opponentClub: Club, isDerby: boolean): string {
  const mgr = opponentClub.opponentManager
  if (!mgr) return ''
  const quotes: Record<string, string[]> = {
    confident: [
      `${mgr.name}: "Vi räknar med att vinna det här derbyt."`,
      `${mgr.name}: "Respekt för motståndaren, men poängen ska stanna hemma."`,
    ],
    defensive: [
      `${mgr.name}: "Vi tar ingenting för givet. Det blir en tuff match."`,
      `${mgr.name}: "Vår taktik är vår egen sak."`,
    ],
    cryptic: [
      `${mgr.name}: "Bandyn skriver sina egna historier. Vi får se."`,
      `${mgr.name} sa ingenting efter frågan om skadeläget — bara en axelryckning.`,
    ],
    professorial: [
      `${mgr.name}: "Statistiskt sett har vi en 43% chans. Men statistik räcker inte."`,
      `${mgr.name}: "De har en svaghet i omställningsspel. Vi vet var vi ska slå."`,
    ],
  }
  return pick(quotes[mgr.persona], Math.random)
}
```

Trigga pre-match-citat i roundProcessor för managed derby-matcher:
```typescript
if (isDerbyMatch && managedFixture) {
  const quote = generatePreMatchOpponentQuote(opponentClub, true)
  newInboxItems.push({
    type: InboxItemType.MediaEvent,
    title: `Inför derbyt: ${opponentClub.shortName}`,
    body: quote,
    // ...
  })
}
```

Efter match — motståndartränaren reagerar (efter storseger/förlust). Visas i TIDNINGSRUBRIK-sektionen på GranskaScreen.

---

## SLUT

`npm run build && npm test`

Rapportera:
- Press kommer nu direkt efter match: ✅/❌
- Follow-up-frågor triggas när minne har neg sentiment: ✅/❌
- Avslag ger kritisk artikel efter 3: ✅/❌
- Motståndartränare existerar på alla klubbar: ✅/❌
- Pre-match-citat genereras: ✅/❌
