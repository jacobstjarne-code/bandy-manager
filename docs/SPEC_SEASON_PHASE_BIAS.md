# SPEC: Season Phase Bias för Portal Card-Bag

**Datum:** 2026-05-08
**Författare:** Opus (fresh-eyes-analys 2026-05-08)
**Status:** SPEC — väntar Code
**Beroende:** Inget (rör card-bag-vikter, inte triggers eller event-systemet)
**Konflikt med F1?** Nej — F1 rör pendingEvents-kö, R3 rör DashboardCard-vikter.

## Bakgrund

`initCardBag.ts` definierar 24 portal-kort med statiska vikter (10–100). I dag triggas korten på samma villkor och med samma vikter Omg 1 säsong 1 som Omg 22 final-vecka. Resultat: när det är slutspel och truppen ska väljas konkurrerar kafferummet, journalisten, säsongssignaturen och styrelsens uppdrag om uppmärksamheten med matchen som faktiskt avgör säsongen.

Det här bryter mot designprincipen att Portal ska reflektera "vad spelet handlar om just nu". I endgame handlar spelet om matchen. Allt annat är distraktion.

`getSeasonalTone` (color) reagerar redan på säsongsfas — färgen mörknar mot mars. `dailyBriefingService.SEASON_MOOD` reagerar på fas. Men `initCardBag.ts` är fas-blind.

## Mål

Card-bag-vikter modifieras av aktuell season phase, så att secondaries dämpas mot säsongsslut och primary-card för matchen får ostörd luft i playoff.

## Princip

- `primary` tier oförändrad alla faser (matchen, transfer-deadline, etc — alla redan kritiska)
- `secondary` tier dämpas progressivt mot endgame
- `minimal` tier oförändrad (de är redan miniatyriserade)
- Vissa secondaries plockas bort helt i playoff (kafferum, journalist) — de hör till säsongens narrativ, inte till slutspelets fokus

## Implementation

### Fas 1: Multiplicator-system

Ny fil: `src/domain/services/portal/seasonPhaseBias.ts`

```typescript
import type { SeasonPhase } from '../../data/seasonPhases'

interface TierBias {
  primary: number    // multiplikator på weight
  secondary: number
  minimal: number
}

const PHASE_BIAS: Record<SeasonPhase, TierBias> = {
  pre_season: { primary: 1.0, secondary: 1.0, minimal: 1.0 },
  early:      { primary: 1.0, secondary: 1.0, minimal: 1.0 },
  mid:        { primary: 1.0, secondary: 1.0, minimal: 1.0 },
  endgame:    { primary: 1.0, secondary: 0.6, minimal: 1.0 },
  playoff:    { primary: 1.0, secondary: 0.4, minimal: 1.0 },
}

export function applyPhaseBias(weight: number, tier: 'primary' | 'secondary' | 'minimal', phase: SeasonPhase): number {
  return weight * PHASE_BIAS[phase][tier]
}
```

### Fas 2: Hard-suppression i playoff

Vissa secondaries hör inte hemma i slutspel oavsett vikt. Lägg till `suppressIn?: SeasonPhase[]` på `DashboardCard`-typen:

```typescript
{
  id: 'coffee_room_card',
  tier: 'secondary',
  weight: 60,
  suppressIn: ['playoff'],  // Helt borta i slutspel
  triggers: [(game) => getCoffeeRoomScene(game) !== null],
  Component: CoffeeRoomSecondary,
},
```

Kandidater för `suppressIn: ['playoff']`:
- `coffee_room_card` — säsongens vardag, hör inte hemma i finalveckor
- `journalist_card` — journalisten spelar ingen roll när det är match-fokus
- `season_signature_card` — signaturen är etablerad, behöver inte påminnas

Behålls i playoff:
- `board_objectives` — finalvinst kan vara mål, måste synas
- `active_arcs` — arc-resolution är ofta playoff-relevant
- `weekly_decision` — fortfarande viktig
- `injury_status`, `opponent_form`, `klacken`, `tabell`, `ekonomi`, `open_bids`

### Fas 3: Integration i `buildPortal`

`buildPortal(game, seed)` (i `portalBuilder.ts`) får läsa `getSeasonPhase(game.currentDate)` och applicera både bias och suppress innan kort sorteras på vikt.

```typescript
const phase = getSeasonPhase(game.currentDate)
const eligibleCards = CARD_BAG
  .filter(card => !card.suppressIn?.includes(phase))
  .filter(card => card.triggers.some(t => t(game)))
  .map(card => ({
    ...card,
    effectiveWeight: applyPhaseBias(card.weight, card.tier, phase),
  }))
  .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
```

## Designkrav (för Design parallellt med Code)

Det här är det viktiga: bara dämpa vikter ger en buggy känsla ("kafferummet försvann"). Design behöver besluta:

1. **Övergång:** Försvinner kortet hårt eller fade:as det ut över 2 omgångar? Förslag: hårt vid fas-byte (early → mid → endgame är diskreta), användaren märker att Portal "stramat åt".

2. **Hint till spelaren:** När playoff börjar och Portal blir tystare — behövs en briefing-text "Slutspel. Bara det viktiga nu."? Förslag: ja, en gång vid första playoff-Portal-render. Texten kan komma från `dailyBriefingService.SEASON_MOOD.playoff` eller en ny `playoff_first_open` briefing.

3. **Visuell skillnad:** Ska de kort som *behålls* i endgame se annorlunda ut? Förslag: nej. Hierarkin sker via *vad som är borta*, inte via styling-ändringar på det som finns kvar.

4. **Kafferum-säsongen:** Kafferum-poolen är finkalibrerad och spelas mycket. Att den helt försvinner i playoff kan kännas tomt. Alternativ: behåll men sänk weight till 0.2 så den dyker upp en gång på fyra. Värt att Design vägar.

## Test-överväganden

- Befintliga tester antar deterministisk card-ordering. `applyPhaseBias` är ren funktion — ska gå att testa isolerat.
- `buildPortal`-tester behöver uppdateras med fas-parameter eller mockad `currentDate`.
- En ny test-grupp: "card visibility per phase" som verifierar att kafferum syns i `mid`-fas men inte i `playoff`-fas.

## Estimerat scope

- `seasonPhaseBias.ts`: ny fil, ~30 rader
- `DashboardCard`-typ: utökad med `suppressIn?`, ~3 rader ändring
- `initCardBag.ts`: 3 kort får `suppressIn: ['playoff']`, ~3 rader
- `portalBuilder.ts`: bias + suppress applicering, ~10 rader
- Tester: 1-2 nya test-filer, ~50 rader
- Design-mock + briefing-text: parallellt jobb hos Design

Total: ~100 rader kod + ~50 rader test + design-leverans. Liten patch, stor känsla-förändring.

## Inte i denna spec

- **Decision-fatigue (R1):** separat spec — kompletterar F1-arbetet, hör inte ihop med säsongs-fas.
- **Karaktärs-relationships (R2):** stort separat projekt.
- **Match-engagement (R5):** separat fråga om förlust-eko.

## Risker

1. **F1-konflikt:** F1 rör `pendingEvents`-kö och kanske `pendingScreen`. Den här specen rör `DashboardCard`-vikter. Inga delade kodvägar, ingen konflikt förväntas. Verifiera när F1 landar.
2. **Användaren upplever bortfall som bug:** mitigeras av Design-jobb (övergångar + briefing-text).
3. **Fas-trösklar fel:** `getSeasonPhase` finns redan, är beprövat. Ingen ny tröskel-mekanik.
4. **Edge case: spectator-final.** Om spelaren är ute ur slutspelet men säsongen pågår — vilken fas är det? `endgame` om grundserien är slut, `playoff` om slutspelet pågår. Verifiera att `getSeasonPhase` hanterar detta korrekt; om inte, justera där.
