# Playtest Bugfix Sprint — Jacobs feedback mars 2026

Gör i ordning uppifrån. `npm run build` efter varje punkt. Committa gruppvis. Pusha efter sista.

---

## 🔴 1. LAGUPPSTÄLLNING — Slot-baserad listvy (KRITISKT)

### Problem
Planvyn (PitchLineupView) fungerar inte — spelare försvinner vid drag, hit-detection missar, och resultatet är att enda sättet att spela är "Generera bästa elvan". Det stänger dörren för taktiska val (t.ex. spela en junior på högerbacken istället för en bättre senior).

### Lösning: Slot-baserad listvy som primär
Bygg om listvyn (`viewMode === 'list'`) i `LineupStep.tsx` till en **slot-baserad vy** där varje formationsplats visas som en tilldelningsbar rad. Ingen drag-and-drop — bara tappa-för-att-tilldela.

### Ny komponent: `SlotLineupView.tsx`
Skapa `src/presentation/components/match/SlotLineupView.tsx`

**Layout:**
```
┌──────────────────────────────────┐
│  ⚙️ Formation  [ 5-3-2 ▼ ]      │
├──────────────────────────────────┤
│                                  │
│  MÅLVAKT                         │
│  ┌─ MV ── #1 Lindström (72) ──┐ │  ← tappa → välj spelare
│                                  │
│  BACKAR                          │
│  ┌─ VB ── #3 Eriksson (68) ───┐ │
│  ┌─ LIB ── [välj spelare] ────┐ │  ← tom slot, tappa för att välja
│  ┌─ HB ── #5 Svensson (65) ──┐ │
│                                  │
│  YTTERHALVOR                     │
│  ┌─ VYH ── #7 Olsson (61) ───┐ │
│  ┌─ HYH ── #11 Berg (58) ────┐ │
│                                  │
│  CENTERHALVOR                    │
│  ┌─ VCH ── [välj spelare] ────┐ │
│  ┌─ CH ── #8 Larsson (74) ───┐ │
│  ┌─ HCH ── [välj spelare] ───┐ │
│                                  │
│  FORWARDS                        │
│  ┌─ VF ── #9 Andersson (71) ─┐ │
│  ┌─ HF ── #10 Nilsson (66) ──┐ │
│                                  │
│  ✨ Generera bästa elvan         │
│  11/11 startande                 │
└──────────────────────────────────┘
```

**Varje slot-rad:**
```tsx
interface SlotRowProps {
  slot: FormationSlot      // från FORMATIONS[formation].slots
  player: Player | null    // tilldelad spelare, eller null
  onTap: () => void        // öppna spelarväljare
  onClear: () => void      // ta bort spelare från slot
}
```

Slot-raden visar:
- Positionsförkortning (slot.label) i en liten badge (t.ex. copper-bg rund, 28×28px)
- Spelarens tröjnummer + efternamn + CA om tilldelad
- "[välj spelare ›]" med streckad border om tom
- Liten ✕-knapp till höger för att ta bort tilldelad spelare

**Spelarväljare (modal/sheet):**
När man tappar på en slot → visa en bottom sheet / modal med:
- Rubrik: "Välj spelare för {slot.label}" (t.ex. "Välj spelare för HB")
- Lista med ALLA tillgängliga spelare (ej redan tilldelade till annan slot)
- Sorterad: först spelare med matchande position (`slot.position`), sen övriga
- Matchande position → normal text. Annan position → visa "(felpos)" i warning-färg
- Varje rad: `#nummer Efternamn · Position · CA · Form-bar`
- Skadade/avstängda grå och ej klickbara
- Tappa på spelare → tilldela till slot, stäng sheet

**Gruppering av slots:**
Gruppera slots visuellt med sektionsrubriker baserat på `slot.position`:
- `PlayerPosition.Goalkeeper` → "MÅLVAKT"
- `PlayerPosition.Defender` → "BACKAR"
- `PlayerPosition.Half` → "HALVBACKAR"
- `PlayerPosition.Midfielder` → "CENTERHALVOR"
- `PlayerPosition.Forward` → "FORWARDS"

**Dataflöde:**
- `onTap(slotId)` → öppna spelarväljare-modal med `slotId`
- `onSelectPlayer(playerId, slotId)` → anropa `onAssignPlayer(playerId, slotId)` från props
- `onClear(slotId)` → hitta spelarId som har denna slot → anropa `onRemovePlayer(playerId)`

### Ändringar i LineupStep.tsx
- Byt default `viewMode` till `'list'` (behåll toggle men list = default)
- I list-läget: rendera `SlotLineupView` istället för nuvarande `LineupFormationView` + spelarlistor
- Ta bort hela den manuella spelarlistan (den ersätts av slot-vyn)
- Behåll "Generera bästa elvan"-knappen under slot-listan
- Behåll planvyn (PitchLineupView) som alternativ — den fungerar OK med mus men inte mobil

### Props för SlotLineupView
```tsx
interface SlotLineupViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onAutoFill: () => void
  onFormationChange: (newTactic: Tactic) => void
}
```

### Filer att skapa/ändra
| Fil | Ändring |
|-----|---------|
| `SlotLineupView.tsx` | NY — slot-baserad listvy |
| `PlayerPickerSheet.tsx` | NY — bottom sheet för spelarval |
| `LineupStep.tsx` | Integrera SlotLineupView i list-mode, default till list |

### Verifiering
- [ ] Kan tilldela specifik spelare till specifik position (t.ex. junior på HB)
- [ ] Tröjnummer visas bredvid namn i varje slot
- [ ] Tom slot visar tydlig "välj spelare"-knapp
- [ ] Kan ta bort spelare från slot
- [ ] "Generera bästa elvan" fyller alla slots korrekt
- [ ] Fungerar på mobil (touch/tap, ingen drag)

---

## 🔴 2. CUPMATCH SNABBSIMULERING — spelas aldrig

### Problem
Vid snabbsimulering (icke-live) av cupmatch spelas föregående match om igen. Cupmatchen avancerar aldrig tills man väljer livekommentering.

### Root cause
I `MatchScreen.tsx` → `handlePlayMatch()`:
1. `setPlayerLineup()` sparar uppställningen
2. Om `!useLiveMode`: anropas `advance()` (= `advanceToNextEvent`)
3. I `advanceToNextEvent()` (roundProcessor.ts rad ~162): cupmatcher för managed club SKIPPAS medvetet (`hasManagedCupPending = true, continue`)
4. `advance()` returnerar `hasManagedCupMatch: true` men detta hanteras ALDRIG i MatchScreen
5. Resultatet: advance-funktionen spelar alla ANDRA matcher i omgången men inte cupmatchen, och navigerar till match-result-skärmen — som visar föregående ligamatch

### Fix: Tvinga live-läge för cupmatcher
I `MatchScreen.tsx`:

```tsx
// I komponentens body, efter nextFixture beräknats:
const isCupMatch = nextFixture?.isCup === true
```

I `handlePlayMatch()`, ändra navigeringslogiken:
```tsx
// Ersätt: if (useLiveMode && nextFixture)
// Med:
const effectiveLiveMode = useLiveMode || isCupMatch
if (effectiveLiveMode && nextFixture) {
  // befintlig kod för live-navigation
}
```

I `StartStep.tsx`, disabla snabbsim-togglen för cupmatcher:
```tsx
// Skicka med isCupMatch som prop
// Disabla togglen:
{isCupMatch && (
  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 16px' }}>
    Cupmatcher spelas alltid med livekommentering.
  </p>
)}
// Sätt togglen till disabled om isCupMatch
```

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `MatchScreen.tsx` | Tvinga live-läge för cupmatcher |
| `StartStep.tsx` | Disabla snabbsim-toggle + visa förklaringstext |

### Verifiering
- [ ] Cupmatch navigerar alltid till live-skärmen
- [ ] Snabbsim-toggle är disabled/dold för cupmatcher
- [ ] Cupmatchen spelas och resultatet registreras korrekt
- [ ] Cupens bracket uppdateras efter matchen

---

## 🔴 3. SCOUTRAPPORTER — Målvaktsspel för utespelare

### Problem
Alla scoutrapporter om utespelare nämner "målvaktsspelet" som svaghet. Naturligt — utespelares goalkeeping-attribut är alltid lägst.

### Root cause
I `scoutingService.ts` → `generateScoutNotes()`:
```typescript
const entries = Object.entries(player.attributes) as [keyof PlayerAttributes, number][]
const weakest = entries.reduce(...)  // Hittar svagaste INKLUSIVE goalkeeping
```

### Fix
Filtrera bort `goalkeeping` från svagaste-sökningen för utespelare. Filtrera bort offensiva attribut för målvakter.

I `scoutingService.ts`, ändra `generateScoutNotes`:
```typescript
export function generateScoutNotes(player: Player, rand?: () => number): string {
  const localRand = rand ?? makeRand(player.id.charCodeAt(0) * 31 + player.age * 7)

  const strength = ARCHETYPE_STRENGTHS[player.archetype] ?? 'goda egenskaper'

  // Find weakest attribute — EXCLUDE irrelevant attributes per position
  const excludeKeys: Set<keyof PlayerAttributes> = new Set()
  if (player.position !== PlayerPosition.Goalkeeper) {
    excludeKeys.add('goalkeeping')
  } else {
    // Målvakter: exkludera offensiva attribut från "svagaste"
    excludeKeys.add('shooting')
    excludeKeys.add('dribbling')
    excludeKeys.add('cornerSkill')
  }

  const entries = (Object.entries(player.attributes) as [keyof PlayerAttributes, number][])
    .filter(([k]) => ATTRIBUTE_LABELS[k] && !excludeKeys.has(k))

  const weakest = entries.reduce((min, [k, v]) =>
    v < min[1] ? [k, v] : min,
    entries[0]
  )
  const weakLabel = ATTRIBUTE_LABELS[weakest[0]] ?? 'okänd egenskap'

  // ...resten av funktionen oförändrad (templates etc)
```

OBS: Funktionen behöver importera `PlayerPosition` från enums:
```typescript
import { PlayerPosition } from '../enums'
```

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `scoutingService.ts` | Filtrera bort goalkeeping från weakest-sökning, lägg till import |

---

## 🟠 4. VÄRVNINGSTEMPO — För långsamt

### Problem
Scouting tar 1-2 omgångar → budrespons 1 omgång → totalt 2-3 omgångar. Januarifönstret har bara ~4 omgångar. Processen borde vara snabbare.

### Fix: Snabba upp hela pipeline

**4a. Scouting: Omedelbar rapport för spelare i samma region**
I `scoutingService.ts` → `startScoutAssignment`:
```typescript
export function startScoutAssignment(
  playerId: string,
  clubId: string,
  currentDate: string,
  sameRegion: boolean,
  hasPlayedAgainst: boolean = false,  // NYTT ARGUMENT
): ScoutAssignment {
  // Omedelbar om man redan mött laget, eller om samma region
  const rounds = hasPlayedAgainst ? 0 : sameRegion ? 0 : 1
  return {
    targetPlayerId: playerId,
    targetClubId: clubId,
    startedDate: currentDate,
    roundsRemaining: rounds,   // VAR: sameRegion ? 1 : 2
  }
}
```

`roundsRemaining: 0` innebär att rapporten levereras vid nästa advance (samma omgång som scouting startas).

**4b. Beräkna hasPlayedAgainst vid anrop**
I TransfersScreen (eller var `startScoutAssignment` anropas), beräkna:
```typescript
const hasPlayed = game.fixtures.some(f =>
  f.status === 'completed' &&
  ((f.homeClubId === game.managedClubId && f.awayClubId === targetClubId) ||
   (f.awayClubId === game.managedClubId && f.homeClubId === targetClubId))
)
```

Skicka med som argument.

**4c. Visa tydlig tidslinje i TransfersScreen**
Under scouting-sektionen, visa hur lång tid processen tar:
```
📋 Scoutrapport: klar {samma omgång / nästa omgång}
💰 Bud: svar nästa omgång
🤝 Spelaren ansluter direkt vid accepterat bud
```

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `scoutingService.ts` | Sänk roundsRemaining, lägg till hasPlayedAgainst-parameter |
| `TransfersScreen.tsx` | Beräkna hasPlayedAgainst, skicka med, visa tidslinje-info |

### Verifiering
- [ ] Scouting av spelare i egen region ger rapport samma omgång
- [ ] Scouting av motståndarlag man mött → omedelbar rapport
- [ ] Hela värvningsprocessen (scouta → bud → ansluter) klarar sig inom 2 omgångar

---

## 🟠 5. TERMINOLOGI — Icke-bandytermer

### Problem
Texter innehåller fotbollstermer. Exempel: "löpkapacitet" i scoutrapporter.

### Fix: ARCHETYPE_STRENGTHS i scoutingService.ts

Ändra:
```typescript
const ARCHETYPE_STRENGTHS: Record<PlayerArchetype, string> = {
  [PlayerArchetype.Finisher]: 'dödligt avslut',
  [PlayerArchetype.Playmaker]: 'suverän passning',
  [PlayerArchetype.DefensiveWorker]: 'järnhård i försvarsarbetet',           // VAR: 'järnhård försvarsspel'
  [PlayerArchetype.TwoWaySkater]: 'imponerande skridskoåkning i båda riktningar',  // VAR: 'imponerande löpkapacitet'
  [PlayerArchetype.ReflexGoalkeeper]: 'reflexer i världsklass',
  [PlayerArchetype.PositionalGoalkeeper]: 'strålande positionsspel i målet',
  [PlayerArchetype.Dribbler]: 'magisk teknik med bollen',                    // VAR: 'magisk dribbling'
  [PlayerArchetype.CornerSpecialist]: 'farliga hörnor',
  [PlayerArchetype.RawTalent]: 'enorm potential',
}
```

### Fix: Fullständig textrevision — grep och granska
```bash
# Fotbollstermer
grep -rni "löpkapacitet\|tackling\|offside\|frispark\|sidlinje\|nick\|header\|inlägg" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Gult kort i user-facing text
grep -rni "gult kort\|gula kort" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "enum\|interface\|type "

# 3 poäng (bandy har 2p)
grep -rni "tre poäng\|3 poäng\|three points" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Ersätt:
- "löpkapacitet" → "skridskoåkning" / "tvåvägsåkare"
- "tackling" → "brytning" (bentackling = foul i bandy)
- "gult kort" → "utvisning"
- "3 poäng" → "2 poäng"
- "frispark" → "frislag"

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `scoutingService.ts` | ARCHETYPE_STRENGTHS-uppdatering |
| Diverse filer | Grep-resultat: byt fotbollstermer |

### Verifiering
```bash
grep -rni "löpkapacitet\|gult kort\|gula kort\|3 poäng\|tre poäng\|frispark\|tackling" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska ge 0 resultat
```

---

## 🟠 6. SPELARNUMMER BREDVID NAMN — i alla listor

### Problem
Nummer visas i cirklarna på planvyn men saknas i spelarlistor (SquadScreen, LineupStep, TransfersScreen).

### Fix
I `SquadScreen.tsx` (spelarraden), visa `#nummer` före spelarnamn:
```tsx
<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginRight: 4, minWidth: 24 }}>
  {player.shirtNumber != null ? `#${player.shirtNumber}` : ''}
</span>
<span style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>
  {player.lastName}
</span>
```

Gör samma sak i den nya `SlotLineupView` och i `TransfersScreen.tsx` för scouting-listan.

### Kontrollera att shirtNumber genereras korrekt
I `worldGenerator.ts`, verifiera att alla spelare får `shirtNumber`. Om det inte görs:
```typescript
clubPlayers.forEach((player, index) => {
  player.shirtNumber = index + 1
})
```

Vid transfer: tilldela nästa lediga nummer i den nya klubben.

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `SquadScreen.tsx` | Visa #nummer före namn |
| `SlotLineupView.tsx` | Visa #nummer i slot-rad (ny komponent) |
| `TransfersScreen.tsx` | Visa #nummer i spelarlista |
| `worldGenerator.ts` | Verifiera att shirtNumber genereras |
| `transferService.ts` | Tilldela nummer vid transfer |

---

## 🟡 7. BANDYDOKTORN — Göm om den inte fungerar

### Problem
Bandydoktorn syns men fungerar inte utan `ANTHROPIC_API_KEY` på servern.

### Fix: Göm helt
Hitta var Bandydoktorn-länken finns i navigationen och kommentera bort den:

```bash
grep -rni "doctor\|doktor\|bandydoktor" src/presentation/ --include="*.tsx" | grep -v "Screen.tsx" | grep -v node_modules
```

Kommentera bort eller ta bort menyalternativet/länken.

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| Navigation/meny (identifiera via grep) | Ta bort Bandydoktorn-länk |

---

## 🟡 8. SPELARPOSITIONER — Uppdatera till bandypositioner

### Problem
Nuvarande enum har `Midfielder` som inte är en traditionell bandyposition. I bandys formationer finns halvbackar (ytterhalf + centerhalf) — alla är "halvar". `Midfielder` är redundant med `Half`.

### Fix: Slå ihop Half och Midfielder till en position

**STEG 1: Ändra i `Formation.ts`**
I alla formationer: ändra slots med `PlayerPosition.Midfielder` till `PlayerPosition.Half`.

- 5-3-2: slots `mid-l`, `mid-c`, `mid-r` → position `PlayerPosition.Half`
- 2-3-2-3: slots `mid-l`, `mid-r` → position `PlayerPosition.Half`

Behåll slot-ID:n och labels oförändrade (VCH, CH, HCH).

**STEG 2: Migrera spelare**
I `worldGenerator.ts`: generera `PlayerPosition.Half` istället för `PlayerPosition.Midfielder`.

**STEG 3: Runtime-migration av befintliga saves**
I gameStore.ts (var spardata laddas), migrera:
```typescript
if (game.players) {
  game.players = game.players.map(p =>
    p.position === ('midfielder' as any) ? { ...p, position: PlayerPosition.Half } : p
  )
}
```

**STEG 4: Ta INTE bort Midfielder från enum** — kan krascha gamla saves.

**STEG 5: Uppdatera positionShort**
```typescript
case PlayerPosition.Midfielder: return 'H'  // Fallback
```

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `Formation.ts` | Ändra Midfielder-slots till Half |
| `worldGenerator.ts` | Generera Half istället för Midfielder |
| `formatters.ts` | positionShort fallback |
| `gameStore.ts` | Runtime-migration |

---

## 🟡 9. KOMPLETT TEXT-DUMP FÖR GRANSKNING

### Åtgärd
Generera `docs/ALL_GAME_TEXTS.md` med alla user-facing texter grupperade per källa.

Extrahera texter från dessa filer:
```
src/domain/services/matchCommentary.ts
src/domain/services/pressConferenceService.ts
src/domain/services/scoutingService.ts
src/domain/services/inboxService.ts
src/domain/services/eventService.ts
src/domain/services/mediaService.ts
src/domain/services/boardService.ts
src/domain/services/academyService.ts
src/domain/data/rivalries.ts
src/domain/services/worldGenerator.ts
src/presentation/screens/IntroSequence.tsx
```

Format: rubrik per fil, sedan alla strängar/templates listade.

---

## 🟢 10. SAKER ATT BEVAKA (ej ännu testade)

### 10a. AI-lag med för få spelare efter flera säsonger
Kontrollera att `seasonEndProcessor.ts` fyller på AI-trupper (min 16 spelare) med riktiga namn och rimlig CA.

### 10b. Värvning av okontrakterade spelare
Verifiera att buggen i `handleSignFreeAgent` (B2 i ERIK_PLAYTEST_2.md) faktiskt fixats. Fria agenter finns i `game.transferState.freeAgents`, inte `game.players`.

### 10c. Anläggning / Hall
Kontrollera om det finns mekanik för att uppgradera. Om statisk siffra → behöver investeringsalternativ.

### 10d. Elitjuniorverksamhet
Kontrollera om `academyLevel` kan ändras via gameplay. Om statisk → behöver uppgraderingsmekanik.

---

## ORDNING

1. **#1 Laguppställning** (SlotLineupView) — commit: `feat: slot-based lineup view`
2. **#2 Cupmatch-buggen** — commit: `fix: force live mode for cup matches`
3. **#3 Scoutrapport goalkeeping** — commit: `fix: exclude goalkeeping from outfield scout reports`
4. **#4 Värvningstempo** — commit: `fix: faster scouting and transfer pipeline`
5. **#5 Terminologi** — commit: `fix: replace football terms with bandy terminology`
6. **#6 Spelarnummer** — commit: `feat: show shirt numbers in all player lists`
7. **#7 Bandydoktorn** — commit: `fix: hide bandydoktorn until API configured`
8. **#8 Positioner** — commit: `refactor: merge Midfielder into Half position`
9. **#9 Textdump** — commit: `docs: generate all game texts for review`

`npm run build` efter varje steg. Pusha efter sista.

## Verifiering efter allt

```bash
# Inga fotbollstermer kvar
grep -rni "löpkapacitet\|gult kort\|gula kort\|3 poäng\|tre poäng\|frispark\|tackling" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska ge 0 resultat

# Build OK
npm run build

# Inga hårdkodade färger
grep -rn "C9A84C\|c9a84c\|201,168,76\|#22c55e\|#f59e0b\|#ef4444\|#0a1520\|#0D1B2A\|#0a1e3a\|#0c2440\|#3b82f6\|#1a2e47\|234,179,8" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
# Ska ge 0 resultat
```
