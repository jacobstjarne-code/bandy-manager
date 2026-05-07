# Hall Debate Service — event-generation från befintlig data

**Datum:** 2026-05-07
**Spec-typ:** Service-skapelse (data finns oanvänd, ingen rendering-tillägg behövs)
**Tracker-status:** 🟡 (justering av status-anledning)

## Rot-problem — sanningsjustering

`INLASTA_SYSTEM.md` (rad 8) säger: *"Data finns men renderas inte — EventCardInline visar knapp men debattinnehållet exponeras inte."*

**Det är delvis fel.** Verkliga gapet är:

1. `hallDebateData.ts` innehåller `HALL_DEBATE_EVENTS` (3 events × 3-5 bodyVariants × 2-3 choices med effects + narrative) plus `HALL_NEWS_*`-arrays och `BOARD_HALL_QUOTES`.
2. `EventCardInline.tsx:48` har `case 'hallDebate'` — visar `🏛️ KOMMUNEN`-label, `event.body`, choice-knappar via `getActionsForEvent`. **Renderingen FUNGERAR** för det som kommer in.
3. `EventOverlay.tsx` har default modal-flow för alla event-typer — funkar också.
4. **Men ingen service skapar `event.type === 'hallDebate'`-events.** Inventering av `src/domain/services/` (politicianService, midSeasonEventService, eventService, mediaService) visar inga referenser till `HALL_DEBATE_EVENTS`. Datan ligger oanvänd.

Renderingen är inte gapet. **Event-genereringen är gapet.**

Mindre tilläggs-problem: EventCardInline visar inte `event.title` (HallDebateEvent har en strukturerad title som "🏛️ Kommunen utreder hallfrågan"), bara typ-label + body. Vid full implementation bör title läggas till för paritet med EventOverlay-default.

## Lösning

Skapa `hallDebateService.ts` som genererar GameEvent från `HALL_DEBATE_EVENTS`-poolen. Trigger: integration med befintlig `politicianService` — politiker-agendor är naturlig signal för när hallfrågan blir relevant.

## API som specen vilar på

```ts
// Befintligt
HALL_DEBATE_EVENTS = {
  kommunenFrågar: HallDebateEvent,    // kommun-driven
  styrelseSplittrad: HallDebateEvent, // styrelse-driven
  spelarePerspektiv: HallDebateEvent, // spelar-driven
}

LocalPolitician {
  agenda: 'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'
  relationship: number
  ...
}

GameEvent {
  type: 'hallDebate'
  title: string
  body: string
  choices: { id, label }[]
  ...
}
```

## Trigger-logik

`generateHallDebateEvent(game, round) → GameEvent | null`

- **Cooldown:** minst 8 omgångar mellan hallDebate-events. Det är en **tung narrative-tråd**, inte vardagsbeslut. Ska kännas som åter-uppdykande dilemma.
- **Cap:** max 3 hallDebate-events per säsong.
- **Pre-conditions:** sätt på säsong ≥ 2 (Year 1 är för tidigt — spelaren ska först ha etablerat klubb-identiteten).

**Pool-val baserat på politiker-agenda:**

| Politiker-agenda | Triggar event-typ | Tonal-vridning |
|---|---|---|
| `infrastructure` | `kommunenFrågar` | Politikern föreslår utredning (positiv för hall) |
| `savings` | `kommunenFrågar` | Politikern motsätter sig (negativ för hall) — alternativ bodyVariant |
| `prestige` | `kommunenFrågar` | "Sätt orten på kartan" — positiv |
| Other | `styrelseSplittrad` eller `spelarePerspektiv` | Random pick |

`spelarePerspektiv` triggas oftare när:
- Truppen har ≥ 2 spelare under 23 år (ungdomsperspektiv)
- Senaste matchen spelades i ≤ -10°C (köld-trigger)
- Truppen har en skadad spelare med skade-typ "köldskada" eller liknande (om sådan klassificering finns)

`styrelseSplittrad` triggas när:
- `boardPatience` är låg (≤ 40)
- Eller efter 2+ outdoor-matcher som drog under 800 åskådare

Detta gör trigger-logiken **kontextuell** istället för bara slumpmässig.

## Tonal-pool-utbyggnad

Befintliga `bodyVariants` (3-5 per event) kan vara för få om eventet återkommer 3 gånger per säsong × flera säsonger. Code kan välja att:

- **A.** Använda dem som-de-är (acceptera repetition)
- **B.** Be Opus utöka pool till 8-10 varianter per event

Jag skriver utbyggd pool om Code önskar — flagga vid implementation.

## Effekter

`HallDebateChoice` har redan `effects`-fält (textuell beskrivning). Code måste mappa till numeriska effekter på game-state:

```ts
// kommunenFrågar.choices
'support'         → politicianRelationship +8, fanMood -3
'defend_outdoor'  → fanMood +5, politicianRelationship -5
'neutral'         → no-op

// styrelseSplittrad.choices
'side_modern'     → fanMood -2, boardPatience +3
'side_tradition'  → fanMood +3, boardPatience -2
'acknowledge_both' → facilitiesUpgrade +1 (om finns), no-op annars

// spelarePerspektiv.choices
'invest_small'    → finances -8000, facilitiesUpgrade +1, morale +3
'arrange_indoor'  → finances -3000
'tough_love'      → morale -2
```

Mapping-tabell läggs i `hallDebateService.ts` som konstant.

## Narrative-feedback

Varje choice har `narrative`-fält ("Kommunen tillsätter en utredning. Den landar i nästa mandatperiod."). 

Renderingen av narrative kräver att default EventOverlay (eller EventCardInline) **visar narrative efter klick**. Idag: `resolveEvent(eventId, choiceId)` applicerar effekter men visar inte narrative-text.

**Två alternativ för narrative-rendering:**
- **A.** Inbox-item skapas av `resolveEvent` med narrative-text som body. Spelaren ser eftermäle nästa Portal-besök.
- **B.** Toast/inline-feedback i samma render-cykel. Mer omedelbar.

Mitt förslag: **A** (inbox-item) eftersom det matchar bandymanagerns existing pattern (smallAbsurdities, rumors, post-match-reflektioner går alla via inbox). Plus: narrative-eftermäle dyker upp några timmar/omgångar senare vilket känns mer organiskt än omedelbar feedback.

Code-ansvar för att hooka in inbox-item-skapande i `resolveEvent` när `event.type === 'hallDebate'`. Eller i en post-resolution-hook.

## traditionalistResponse — extra textpool

`styrelseSplittrad.traditionalistResponse` är en pool av 5 traditionalist-quotes ("Bandy spelas utomhus. Punkt." etc.). 

**Min läsning:** detta är extra färgning för styrelseSplittrad-eventet, inte en separat rendering-yta. Kan inkluderas i body-rendering som "Traditionalisten säger: '{quote}'" inline med eventets body. Eller skippas vid första iteration och läggas till om det saknas i playtest.

## BOARD_HALL_QUOTES — separat användning

`BOARD_HALL_QUOTES.supporter|ekonom|traditionalist|modernist` är **persona-quotes** för styrelse-sammanhang (3-4 per persona). Detta är inte hallDebate-event-data — det är allmän board-quote-pool. Antagligen för `boardService` eller liknande. **Inte i scope för denna spec.** Code kan nota det som separat hook senare.

## Implementation steg

1. **Skapa service:** `src/domain/services/hallDebateService.ts`
   - `generateHallDebateEvent(game, round) → GameEvent | null`
   - Trigger-logik enligt tabellen ovan
   - Cooldown-tracking i `game.lastHallDebateRound` (nytt fält i SaveGame)
   - Pool-val + bodyVariant-pick (deterministisk: `(round + season * 13) % variants.length`)
   - Effekter-mapping per choice-id
2. **Hook in i event-queue:** identifiera var GameEvent skapas under round-progression (eventQueueService.ts? eventService.ts?). Lägg in `generateHallDebateEvent` som en av flera kandidat-generatorer.
3. **Resolution-hook:** vid `resolveEvent(eventId, choiceId)` för `event.type === 'hallDebate'` — efter effekter applicerats, skapa inbox-item med `narrative`-text som body. Title: "Eftermäle: hallfrågan" eller motsvarande.
4. **Optional EventCardInline-utbyggnad:** lägg till `event.title` rendering ovanför body för paritet med modal. En rad ändring.
5. **SaveGame-fält:** `lastHallDebateRound: number | null` + `hallDebateCountCurrentSeason: number` för cap-tracking. Migration-säker (default 0/null).

## Tester

- `generateHallDebateEvent` returnerar null när cooldown ej passerats
- Returnerar null när cap (3 per säsong) träffats
- Politiker med agenda 'infrastructure' triggar `kommunenFrågar` med "support"-vänlig bodyVariant
- Resolve med 'support'-choice ger politicianRelationship +8 + skapar inbox-item med narrative
- Edge: `boardPatience ≤ 40` ökar sannolikheten för `styrelseSplittrad`-pool
- npm run build && npm test gröna

## Verifiering i playtest

- Spela en säsong från säsong 2. Förvänta: hallDebate-event dyker upp någon gång under säsongen.
- Klicka choice → effekter applicerade (verifiera via DevTools). Inbox-item dyker upp inom 1-2 omgångar med narrative.
- Spela en hel säsong: max 3 hallDebate-events totalt, minst 8 omgångars mellanrum.
- Variera politiker-agenda mellan saves: agenda='infrastructure' → kommunenFrågar dominerar. agenda='youth' → mer spelarePerspektiv-events.

## Inte i scope

- HALL_NEWS_*-arrays användning — separat spec-fråga (kan integreras i `mediaService` som lokaltidnings-rubriker)
- BOARD_HALL_QUOTES användning — separat spec-fråga (board-context, ej hallDebate)
- Hall-bygge som actual game-mechanic — det är facility-upgrade, ligger i `facilityService` (separat system)
- Visualiseringssatsning (interaktiv ras-historik etc.) — overkill för denna iteration

## Status efter landning

`hallDebateData` → 🟡 (spec klar, ingen mock — service-spec) → 🟠 efter implementation → 🟢 efter playtest-bekräftelse.

Sanningsjustering i `INLASTA_SYSTEM.md` rad 8: anteckning bör ändras från "Data finns men renderas inte" till "Data finns, rendering finns, men ingen service genererar events. Spec för hallDebateService levererad."
