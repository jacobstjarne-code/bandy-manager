# HANDOFF — R3 Endgame Portal-känsla (PhaseMark + suppression + bias)

**Från:** Design-Claude
**Datum:** 2026-05-16
**Till:** Code (Claude Code i VS Code) — implementerar; Opus — confirmar copy
**Pairas med mock:** `docs/mockups/2026-05-16_design_endgame_portal.html`
**Spec:** `docs/SPEC_SEASON_PHASE_BIAS.md` (Opus 2026-05-08)
**Status:** Design klar. Code kan implementera. Opus bör confirma två copy-punkter (se §7).

---

## 0 · TL;DR

Implementera Opus spec som den är (bias + `suppressIn`), **plus** en ny komponent `PortalPhaseMark` som bär fas-skiftet narrativt mellan SituationCard och PortalBeat. Suppression sker hårt vid fas-byte (ingen fade). Kvarvarande sekundärer renderas oförändrade i utseende. Kafferum/journalist/season-signature är helt borta i playoff (inte weight 0.2 — det ger leftover slop-känsla).

Fyra konkreta deliveries:
1. Filerna i Opus spec (`seasonPhaseBias.ts`, `DashboardCard.suppressIn`, `initCardBag` ändringar, `portalBuilder` bias-applikation).
2. `PortalPhaseMark.tsx` — ny komponent. Spec i §3.
3. `game.phaseMarksSeen: SeasonPhase[]` — ny state-property. Spec i §4.
4. Tester. Spec i §6.

---

## 1 · Designsvar på Opus fyra frågor (kort form, full motivering i mocken)

| Q | Spec ställde | Designsvar |
|---|---|---|
| Q1 | Fade vs hård borttagning? | **Hård**. Suppression sker direkt vid fas-byte. Phasemark-bandet bär överraskningen, inte styling per kort. |
| Q2 | Briefing-text vid första playoff-Portal? | **Ja**, som ny komponent `PortalPhaseMark` mellan SituationCard och PortalBeat. En gång per fas per säsong. Copy från `SEASON_MOOD[phase][0]`. |
| Q3 | Visuell skillnad på kvarvarande sekundärer? | **Nej**. BoardObjectives, OpponentForm, etc. renderas identiskt. Hierarkin sker via vad som är borta. |
| Q4 | Kafferum-säsongen — borta eller weight 0.2? | **Helt borta i playoff** (`suppressIn: ['playoff']`). Behålls i endgame med bias × 0.6 (dämpas men finns kvar). |

---

## 2 · Implementation enligt Opus spec — oförändrad

Implementera §"Implementation" i `SPEC_SEASON_PHASE_BIAS.md` rakt av:

- `src/domain/services/portal/seasonPhaseBias.ts` med `PHASE_BIAS` enligt spec.
- `DashboardCard`-typen utökas med `suppressIn?: SeasonPhase[]`.
- `initCardBag.ts` får tre suppressioner:
  - `coffee_room_card` → `suppressIn: ['playoff']`
  - `journalist_card` → `suppressIn: ['playoff']`
  - `season_signature_card` → `suppressIn: ['playoff']`
- `portalBuilder.ts` läser fas, filtrerar `suppressIn`, applicerar bias innan sortering.

Inga ändringar mot specen där. Designkrav nedan är *additiv*.

---

## 3 · NY KOMPONENT — `PortalPhaseMark`

### Plats
`src/presentation/components/portal/PortalPhaseMark.tsx`

### Anatomi
Ceremoniell marginalanteckning. Inte en banner. Inte en overlay. Inte ett kort.

```
┌─────────────────────────────────────┐ ← 1px solid rgba(196,122,58,0.35) top
│                                     │
│    ⬩ SLUTSPELET BÖRJAR ⬩            │ ← eyebrow, var(--accent)
│                                     │
│   "Slutspel. Inga andra chanser."   │ ← Georgia italic 14.5px
│                                     │
│   Portal har stramat åt — bara      │ ← helper, system 10.5px
│   det viktiga nu. Visas en gång…    │
│                                     │
└─────────────────────────────────────┘ ← 1px solid rgba(196,122,58,0.12) bottom
```

### Tokens (alla från `colors_and_type.css`)

| Element | Token / värde |
|---|---|
| Container background | `linear-gradient(180deg, rgba(196,122,58,0.06), rgba(196,122,58,0.02))` |
| Container border-top | `1px solid rgba(196,122,58,0.35)` |
| Container border-bottom | `1px solid rgba(196,122,58,0.12)` |
| Container padding | `14px 14px` |
| Container margin | `0 14px 14px` (matchar `.beat` margin) |
| Container border-radius | `0` — markören är linjär, inte ett kort |
| Eyebrow font | `var(--font-body)` 8px, weight 600, letter-spacing 4px, uppercase |
| Eyebrow color | `var(--accent)`, opacity 0.9 |
| Eyebrow text-align | center |
| Quote font | `var(--font-display)` italic 14.5px |
| Quote color | `var(--text-light)` |
| Quote line-height | 1.4 |
| Quote text-align | center |
| Helper font | `var(--font-body)` 10.5px |
| Helper color | `var(--text-light-secondary)`, opacity 0.75 |
| Helper text-align | center |

Inga inline-styles i komponenten. Lägg klasserna i `stalvallen-portal.css` (eller egen `portal-phasemark.css` om det är renare).

### Bryt ut till CSS-klasser

```css
.portal-phasemark {
  margin: 0 14px 14px;
  padding: 14px 14px;
  border-top: 1px solid rgba(196, 122, 58, 0.35);
  border-bottom: 1px solid rgba(196, 122, 58, 0.12);
  background: linear-gradient(180deg,
    rgba(196, 122, 58, 0.06) 0%,
    rgba(196, 122, 58, 0.02) 100%);
}
.portal-phasemark-eyebrow {
  font-family: var(--font-body);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--accent);
  text-align: center;
  margin-bottom: 8px;
  opacity: 0.9;
}
.portal-phasemark-quote {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14.5px;
  color: var(--text-light);
  text-align: center;
  line-height: 1.4;
  margin-bottom: 6px;
}
.portal-phasemark-helper {
  font-family: var(--font-body);
  font-size: 10.5px;
  color: var(--text-light-secondary);
  text-align: center;
  opacity: 0.75;
  line-height: 1.4;
}
```

### Komponent-skiss

```tsx
import { useGameStore } from '../store/gameStore'
import { getSeasonPhase, type SeasonPhase } from '../../../domain/data/seasonPhases'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

const PHASEMARK_LABELS: Partial<Record<SeasonPhase, { eyebrow: string; helper?: string }>> = {
  endgame: {
    eyebrow: '⬩ Slutstriden börjar ⬩',
    helper: 'Tabellen avgör. Visas en gång per säsong.',
  },
  playoff: {
    eyebrow: '⬩ Slutspelet börjar ⬩',
    helper: 'Portal har stramat åt — bara det viktiga nu.',
  },
}

export function PortalPhaseMark({ game }: Props) {
  const currentLigaRound = /* … samma logik som i dailyBriefingService */
  const isPlayoff = !!game.playoffBracket
  const phase = getSeasonPhase(currentLigaRound, isPlayoff)
  const seen = game.phaseMarksSeen ?? []
  if (seen.includes(phase)) return null
  const labels = PHASEMARK_LABELS[phase]
  if (!labels) return null
  const quote = SEASON_MOOD[phase]?.[0] ?? ''
  if (!quote) return null
  return (
    <div className="portal-phasemark">
      <div className="portal-phasemark-eyebrow">{labels.eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      {labels.helper && <div className="portal-phasemark-helper">{labels.helper}</div>}
    </div>
  )
}
```

`SEASON_MOOD` finns redan i `dailyBriefingService.ts` — exportera den eller flytta till en delad fil.

### Placering i `PortalScreen.tsx`

```tsx
<SituationCard game={game} />
<PortalPhaseMark game={game} />   {/* NY — direkt efter SituationCard */}
<PortalBeat game={game} />
{!isSeason1Round1 && <PortalActiveBudget game={game} />}
{/* … */}
```

---

## 4 · NY STATE — `phaseMarksSeen`

### På `SaveGame`-typen

```typescript
export interface SaveGame {
  // … existerande fält
  phaseMarksSeen: SeasonPhase[]  // default []
}
```

### Migration
Befintliga saves saknar fältet. Migration: om `phaseMarksSeen === undefined`, sätt `[]`. Lägg i samma migration-mönster som andra fält som tillkommit.

### Store-action

```typescript
markPhaseAcknowledged(phase: SeasonPhase): void {
  set(state => {
    if (!state.game) return state
    if (state.game.phaseMarksSeen?.includes(phase)) return state
    return {
      game: {
        ...state.game,
        phaseMarksSeen: [...(state.game.phaseMarksSeen ?? []), phase],
      },
    }
  })
}
```

### Trigger
I `advance()` i `gameStore.ts`, direkt efter `getSeasonPhase()`-beräkning:

```typescript
const phase = getSeasonPhase(currentLigaRound, isPlayoff)
if (PHASEMARK_PHASES.has(phase) && !game.phaseMarksSeen.includes(phase)) {
  markPhaseAcknowledged(phase)
}
```

Där `PHASEMARK_PHASES = new Set(['endgame', 'playoff'])`. Trigger sker när spelaren *lämnar* Portal — så markören har varit synlig under hela vyn.

### Default i `createNewGame` / `loadGame`
`phaseMarksSeen: []`.

---

## 5 · Konkret diff på `initCardBag.ts`

```diff
   {
     id: 'coffee_room_card',
     tier: 'secondary',
     weight: 60,
+    suppressIn: ['playoff'],
     triggers: [(game) => getCoffeeRoomScene(game) !== null],
     Component: CoffeeRoomSecondary,
   },
   {
     id: 'journalist_card',
     tier: 'secondary',
     weight: 65,
+    suppressIn: ['playoff'],
     triggers: [shouldShowJournalistCard],
     Component: JournalistSecondary,
   },
   {
     id: 'season_signature_card',
     tier: 'secondary',
     weight: 40,
+    suppressIn: ['playoff'],
     triggers: [(game) => {
       const sig = game.currentSeasonSignature
       return !!sig && sig.id !== 'calm_season'
     }],
     Component: SeasonSignatureSecondary,
   },
```

Inget annat kort i bagen får `suppressIn`. Alla andra dämpas via bias × 0.4 i playoff och förblir i listan.

---

## 6 · Tester som ska skrivas

Lägg under `src/__tests__/`:

### `seasonPhaseBias.test.ts`
- `applyPhaseBias(60, 'secondary', 'playoff') === 24.0`
- `applyPhaseBias(60, 'secondary', 'endgame') === 36.0`
- `applyPhaseBias(100, 'primary', 'playoff') === 100`
- `applyPhaseBias(30, 'minimal', 'playoff') === 30`

### `portalBuilder.phase.test.ts`
- Vid `phase: 'playoff'`, kafferum-, journalist-, season_signature-kort filtreras bort innan sort.
- Vid `phase: 'playoff'`, board_objectives effectiveWeight === 87 × 0.4 (34.8).
- Vid `phase: 'mid'`, alla kort har bias × 1.0 (ingen ändring).
- Vid `phase: 'endgame'`, kafferum visas (× 0.6 men inte suppressed).

### `PortalPhaseMark.test.tsx`
- Renderar inte när `phaseMarksSeen.includes('playoff')`.
- Renderar quote från `SEASON_MOOD['playoff'][0]` när fas är playoff och inte i seen.
- Renderar inte för `pre_season` eller `early`.
- Eyebrow text matchar fas.

### `gameStore.phaseMarksSeen.test.ts`
- `markPhaseAcknowledged('playoff')` appendar till listan.
- Idempotent: andra anropet ingen ändring.
- `advance()` triggar `markPhaseAcknowledged` vid fas-övergång.

---

## 7 · LÅSTA BESLUT (Opus 2026-05-16)

Båda öppna frågor från tidigare draft är nu besvarade. Code wire:ar enligt nedan.

### 7a · PhaseMark-copy — använd `SEASON_MOOD[phase][0]` direkt

**Beslut:** Skriv inga nya dedikerade strängar. PhaseMark-quote hämtas direkt från `SEASON_MOOD[phase][0]` i `dailyBriefingService.ts`.

- `endgame` → *"Februari. Slutstriden börjar ta form."*
- `playoff` → *"Slutspel. Inga andra chanser."*

**Motivering (Opus):**
- Strängarna är redan tonalt rätta — bandysvensk understatement
- En sanning. Ändras `SEASON_MOOD` senare återspeglas det i PhaseMark automatiskt
- Tonen konsistent mellan vardags-briefing och ceremoniell engångsmarkör
- Att skriva nya dedikerade riskerar ton-drift

**Implementation:** Exportera `SEASON_MOOD` från `dailyBriefingService.ts` (eller flytta till en delad fil om det känns renare). `PortalPhaseMark` importerar och använder direkt.

**Eyebrow** (Design's förslag, ej Opus-territorium): `⬩ Slutstriden börjar ⬩` / `⬩ Slutspelet börjar ⬩`. Behåll.

**Helper-raden** ("Portal har stramat åt — bara det viktiga nu"): Behåll i v1. Tas eventuellt bort efter playtest om Jacob säger "vet redan det".

### 7b · `isPlayoff`-semantik — `managedClubInPlayoff`, inte `playoffOngoingInLeague`

**Beslut (Opus):** `getSeasonPhase()` vet inget om spelarens deltagande — anroparen styr semantiken. R3 kräver att `isPlayoff = managedClubInPlayoff`.

**Nuvarande kod (`dailyBriefingService.ts:340`):**
```typescript
const isPlayoff = game.fixtures.some(f => f.matchday > 26 && f.status === FixtureStatus.Scheduled)
```
Detta är `playoffOngoingInLeague` — returnerar `true` även om managed club är eliminerad. **Måste fixas** så eliminerade spelare får `endgame`-fas (kafferum + journalist återkommer som en utfasande spectator-säsong).

**Fix — ny delad helper:**
```typescript
// src/domain/data/seasonPhases.ts (eller egen fil i samma mapp)
import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

export function isManagedClubInPlayoff(game: SaveGame): boolean {
  if (!game.playoffBracket) return false
  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]
  return allSeries.some(s => {
    const isInSeries = s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
    if (!isInSeries) return false
    if (s.loserId === game.managedClubId) return false
    return s.fixtures.some(fid => {
      const f = game.fixtures.find(ff => ff.id === fid)
      return f?.status === FixtureStatus.Scheduled
    })
  })
}
```

**Använd på båda ställen:**

1. `PortalScreen.tsx` (för PhaseMark + framtida R3+ RoundMark):
```typescript
const phase = getSeasonPhase(currentLigaRound, isManagedClubInPlayoff(game))
```

2. `dailyBriefingService.ts:340` (refaktorera):
```diff
-  const isPlayoff = game.fixtures.some(f => f.matchday > 26 && f.status === FixtureStatus.Scheduled)
+  const isPlayoff = isManagedClubInPlayoff(game)
   const phase = getSeasonPhase(currentLigaRound, isPlayoff)
```

**Följdverkan:** Eliminerad spelare i grundserie-slut får `endgame`-fas → PhaseMark visar inte "Slutspelet börjar" → kafferum/journalist/signatur återkommer i spectator-säsongen.

**Tester:**
- `isManagedClubInPlayoff` returnerar `false` när `playoffBracket === undefined`
- Returnerar `false` när managed club har `loserId === managedClubId` i alla sina serier (eliminerad)
- Returnerar `true` när managed club har minst en aktiv serie med scheduled fixture
- Snapshot-test: spelare ur slutspelet men ligan har playoff-fixturer kvar → fas blir `endgame`, inte `playoff`

---

## 8 · Vad denna handoff INTE rör

För att inte vidga scope:

- **Primary playoff-variant (best-of-5 serie-tracker):** finns delvis i `SMFinalPrimary.tsx`. Mocken visar den för referens men *implementeras inte i R3*. Egen handoff senare om finkalibrering behövs.
- **Decision-fatigue (R1), karaktärs-relationships (R2), förlust-eko (R5):** separata spec, ej här.
- **Endgame-fas-byte (mid→endgame):** phasemark visas även där (Omg 12), men ingen suppression eller copy-konflikt — bias × 0.6 räcker.
- **Pre_season-fas:** phasemark visas inte. ArrivalScene har redan den rollen.

---

## 9 · Acceptanskriterier (Design's pixel-audit-checklista efter Code-leverans)

Audit görs *i kontext med Portal-stacken*, inte komponent-isolerat (lärt regel).

- [ ] `PortalPhaseMark` mellan SituationCard och PortalBeat. Inte före, inte efter.
- [ ] Visas exakt en gång per fas per säsong. Spela CTA → ladda om → ej synlig.
- [ ] Saves från före migrationen laddar utan crash. `phaseMarksSeen === []` default.
- [ ] Playoff-Portal har inga kafferums-, journalist- eller signatur-kort.
- [ ] Endgame-Portal har dem fortfarande, men längre ner i sortering än innan.
- [ ] CSS-klasser, inga inline `style={{}}`-objekt i `PortalPhaseMark.tsx`.
- [ ] Phasemark använder `var(--accent)`, `var(--text-light)`, `var(--text-light-secondary)` — inga hex.
- [ ] `grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/components/portal/PortalPhaseMark.tsx` returnerar inget.
- [ ] Tester passerar (se §6).

---

## 10 · Estimerat scope (utöver Opus 100 + 50 rader)

| Fil | Δ rader |
|---|---|
| `PortalPhaseMark.tsx` (ny) | ~50 |
| CSS-klasser i `stalvallen-portal.css` | ~30 |
| `gameStore.ts` (action + advance-trigger) | ~15 |
| `SaveGame`-typ + migration | ~10 |
| `PortalScreen.tsx` (insert + import) | ~3 |
| `dailyBriefingService.ts` (export SEASON_MOOD) | ~1 |
| Tester | ~80 |
| **Totalt R3 Design-tillägg** | **~190 rader** |

Tillsammans med Opus spec: ~290 rader kod + ~130 rader test. Litet patch, stor känslighets-skift.

---

— Design-Claude, 2026-05-16
