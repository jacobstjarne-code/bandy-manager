# CODE — Match Live Bundle (Stålvallen) implementation

**Datum:** 2026-05-08
**Författare:** Opus
**Status:** SPEC + INSTRUKTION
**Beroende:** `docs/match-live-bundle/IMPLEMENTATION_PLAN.md` (översikt) + `docs/match-live-bundle/IMPLEMENTATION-SPEC.md` (designerns spec) + alla mockar i `docs/match-live-bundle/`.

---

## Översikt

Komplett designimplementation för match-flödet i Stålvallen-vokabulär. Mekaniken är låst — alla event-services har sina datakontrakt verifierade mot mockarnas zoner/val. Designvalen är avtryck mekaniken.

**Detta är restyling + några nya komponenter.** Datakontrakt och tester rör vi inte. Visualisering byts.

**Batch-struktur:**

- **BATCH A** — Scoreboard + Commentary feed (~14h)
- **BATCH B** — Slutminuterna + Match Report restyling (~12h)
- **BATCH C** — Portal secondary cards restyling (~3-4h)
- **BATCH D** — 4 övriga event-paneler (~22h)
- **BATCH E** — Press/media-separation (~12h, separat lift, lägre prio)

**Rekommenderad ordning:** A först (scoreboarden återanvänds av B). Sen B + C parallellt. Sen D. E sist eller separat.

**Pusha mellan batcher** så vi kan playtesta inkrementellt. Inte hela 60h-paketet i en svep.

---

## Allmänna riktlinjer (gäller alla batcher)

### Tokens

Lägg till Stålvallen-tokens i `colors_and_type.css` enligt `IMPLEMENTATION-SPEC.md` sektion "Tokens (delat)":

```css
/* Stålvallen — match-bundle */
--bg-leather:    #2a2824;
--bg-leather-dk: #1d1b18;
--paper-warm:    #F5F1EB;
--paper-edge:    #DCD3C3;
--copper:        #C47A3A;
--copper-deep:   #A25828;
--steel:         #6B7F8E;
--steel-deep:    #4A5965;
--ink:           #1A1A18;
--ink-soft:      #6B6760;
--ink-mute:      #8A857A;
--ink-faint:     #B8B0A2;

/* LED — bara i match-bundle */
--led-red:      #FF2A18;
--led-red-dim:  rgba(255, 42, 24, 0.07);
--led-red-glow: rgba(255, 42, 24, 0.55);
--led-amber:    #FFAA00;
--led-green:    #66FF33;

/* Scoreboard tidslinje */
--line-bg:      rgba(255, 255, 255, 0.04);
--line-stroke:  rgba(255, 255, 255, 0.12);
--line-tick:    rgba(255, 255, 255, 0.18);
--line-text:    rgba(245, 241, 235, 0.55);
--home-mark:    var(--copper);
--away-mark:    var(--steel);
--now-mark:     #FFB347;

/* Match Report betyg */
--rate-bad:     #B33A2E;
--rate-mid:     #C9881F;
--rate-good:    #4F8C3A;

--font-mono:    ui-monospace, 'Courier New', monospace;
```

**Existerande tokens rörs ej.** `--accent`, `--bg-portal-surface`, `--gold #E8B95C` (cup-vinst), `--warm` har egna roller och bevaras.

### Klubb-färgkodning

Stålvallen är **universellt designsystem**. Inte klubbspecifikt.

- `--copper` = managed-klubb (oavsett vilken det är)
- `--steel` = motståndare (oavsett vilken)

Ingen klubb-prop-byte i scoreboarden. Det är platserna i datan (homeClubId vs awayClubId vs managedClubId) som bestämmer färg.

### 7-segment-renderare

Scoreboard använder custom 7-segment-glyfer (CSS + render-funktion). Implementera enligt `scoreboard-stalvallen.html` och `match-report-stalvallen.html` — render-funktionerna är identiska.

```ts
// src/presentation/components/match/scoreboard/sevenSegment.tsx
const SEG_MAP: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgcde', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
}
// + renderDigit, renderText
```

CSS-klasserna `.seg`, `.seg.lg`, `.seg.md`, `.seg.sm`, `.seg.colon` definieras i en delad `scoreboard.css`-fil eller motsvarande.

---

## BATCH A — Scoreboard + Commentary feed

**Estimat:** ~14h
**Mock:** `scoreboard-stalvallen.html` + `commentary-redesign-v2.html`

### A-01 · Scoreboard-modul (`Scoreboard.tsx`)

Ny komponent: `src/presentation/components/match/scoreboard/Scoreboard.tsx`

**Datakontrakt:**

```ts
interface ScoreboardProps {
  homeCode: string         // 3-bokstavs-kod (FOR, VÄS, ...)
  awayCode: string
  homeScore: number
  awayScore: number
  period: 'HL1' | 'HL2' | 'OT' | 'FT' | 'FT · ETT'  // ETT = efter förlängning, för cup/SM-final
  minute: number           // 0-90 (eller 90-105 för OT)
  second: number           // 0-59
  penalties: Array<{ team: 'home' | 'away'; num: number; name: string; secondsLeft: number }>
  ticker: string[]         // 4-5 rader, vissa dim
  events: Array<{ minute: number; type: 'goal' | 'pen'; team: 'home' | 'away' }>
  isPlayoffFinal?: boolean // visar pannband "SM-FINAL" + slutspels-tier
  finalTier?: string       // "SLUTSPEL · OMG. 25"
  showNowMarker?: boolean  // false i FT-state, true under live
}
```

**Moduler i ordning uppifrån:**

1. **`final-band`** (valfri) — bara om `isPlayoffFinal === true`. Copper-mono "SM-FINAL" + tier i mindre text.
2. **`module-main`** — score 7-segment lg, period-mark + tid 7-segment md, sep-prick (LED-röd, glow).
3. **`module-pen`** (valfri) — utvisnings-strip, två slots (home/away). När aktiv: ▲-mark, nummer, namn, tid kvar mm:ss. Tom slot = `class="empty"`. Skip om inga utvisningar.
4. **`module-text`** — rullande textremsa, alternerande full/dim spans, animeras horisontellt under live, **stilla** vid FT.
5. **`module-line`** — tidslinje 0-90 min (eller 0-105 OT), ticks vid 15/30/60/75 (eller 14.29/28.57/57.14/71.43/85.71% för OT), halvtidslinje vid 50%, mål-prickar (home koppar, away stål) med caps överst, utvisnings-band (45° repeating-linear-gradient), **NU-prick** i amber (skip om FT).

**Live vs FT:**

- Live: `showNowMarker = true`, score-flash på senaste mål-laget (4s loop), textremsa rör sig, period-mark = HL1/HL2/OT.
- FT: `showNowMarker = false`, ingen flash, textremsa stilla, period-mark = FT eller "FT · ETT".

**Score-flash:**

```css
.module-main.score-flash-home .team-col.home .seg .s.on { animation: flash 0.5s ease 4; }
@keyframes flash { 50% { background: var(--led-amber); box-shadow: 0 0 8px rgba(255,170,0,0.7); } }
```

Toggle via class-prop på root: `<div class={`module-main ${flashSide ? 'score-flash-' + flashSide : ''}`}>`. Flash trigger handler: när `homeScore` eller `awayScore` ökar (effect på change), set flashSide för 4s, sen rensa.

### A-02 · Commentary feed (`CommentaryFeed.tsx`)

Ny komponent: `src/presentation/components/match/commentary/CommentaryFeed.tsx`

**Datakontrakt:**

```ts
type FeedRow =
  | { kind: 'event'; minute: number; tag: TagType; team?: 'home' | 'away'; meta?: string; text: string }
  | { kind: 'atmosphere'; text: string }

type TagType = 'goal' | 'penalty' | 'suspension' | 'freekick' | 'save' | 'shot' | 'pass' | 'sub' | 'break'

interface CommentaryFeedProps {
  rows: FeedRow[]
  autoScroll?: boolean  // default true
}
```

**Tag-styling:**

- `goal` → "MÅL", copper bg, rad får bg-tint copper 10%
- `penalty` → "STRAFF", copper bg
- `suspension` → "UTV", amber LED
- `freekick` → "FRISLAG", amber LED
- `save` → "RÄDD", green LED
- `shot` → "SKOTT", muted
- `pass` → "PASS", muted
- `sub` → "BYTE", muted
- `break` → "SLUTET", amber LED

**Atmosphere-rad:** ingen tag, ingen min-kolumn, kursiv text om läktare/väder. Var 4-6:e rad så feeden inte blir logg.

**Auto-scroll:** scrolla till botten när ny rad läggs till (om `autoScroll = true`). Exempel via `useEffect` + `ref.current.scrollTop = ref.current.scrollHeight`.

### A-03 · Integration i `MatchLiveScreen.tsx`

Ändra layout:

```tsx
<div className="match-live-screen">
  <Scoreboard {...scoreboardProps} sticky />  {/* sticky topp */}
  <CommentaryFeed rows={commentaryRows} />
  {activeInteraction && <InteractionShell {...interactionProps} />}  {/* fälls upp över commentary-feedens nedre del */}
</div>
```

`sticky` betyder `position: sticky; top: 0; z-index: 10`. Scoreboarden ska aldrig täckas av interaction-panelen — interaktionen täcker commentary-feedens 2 nedersta rader visuellt (CSS-overlay) men scoreboarden står över.

### A-04 · Tester (Batch A)

```ts
// Scoreboard.test.tsx
describe('Scoreboard', () => {
  it('visar NU-prick under live (showNowMarker=true)', () => { ... })
  it('döljer NU-prick i FT-state (showNowMarker=false)', () => { ... })
  it('placerar mål-prickar på tidslinjen vid rätt minute', () => { ... })
  it('renderar utvisnings-band med rätt position och bredd', () => { ... })
  it('visar final-band när isPlayoffFinal=true', () => { ... })
  it('triggar score-flash när score ökar', () => { ... })
})

// CommentaryFeed.test.tsx
describe('CommentaryFeed', () => {
  it('mappar event-tag till rätt CSS-klass', () => { ... })
  it('atmosphere-rad har ingen min-kolumn', () => { ... })
  it('auto-scrollar till botten när ny rad läggs till', () => { ... })
})
```

### A-05 · Vad du INTE ska göra

- **Inte ändra** `simulateFirstHalf`/`simulateSecondHalf`-generatorerna i `matchCore.ts`. De producerar `MatchStep` som scoreboard + feed konsumerar.
- **Inte hardkoda klubb-färger.** Forsbacka är inte alltid managed — det är `managedClubId` i save som bestämmer.
- **Inte bygga InteractionShell-redesign här.** Det är Batch B/D.

---

## BATCH B — Slutminuterna + Match Report

**Estimat:** ~12h
**Mock:** `match-events-stalvallen.html` (event 05 — slutminuterna) + `match-report-stalvallen.html`

### B-01 · InteractionShell redesign (`InteractionShell.tsx`)

Befintlig komponent finns. Refactor till nya vokabulären.

**Strukturella sektioner (samma som mocken):**

1. `event-fold-hint` — fälls upp-pil + label ovanför panelen
2. `event-head` — tag (LED) + titel + meta + timer (amber tag eller röd ring för slutminuterna)
3. `pitch-panel` — schematic SVG-yta (mörk LED-display-stil, gradient `#1A2628 → #0E1518`)
4. `pitch-sub` — 2-3 monospace-knappar, vald = grön LED med glow
5. `pitch-readout` — VAL: + label + procent
6. `risk-row` (valfri, bara slutminuterna) — `FOUL +25 · SLÄPPER IN +15 · TIMEOUT → TRYCK PÅ`
7. `coach` — coach-quote med koppar-avatar
8. `cta` — copper primary, eller `danger`-röd för risk-variant

**Datakontrakt — gemensamt skal:**

```tsx
interface InteractionShellProps {
  icon: string
  title: string
  minute: number
  timer: { seconds: number; style: 'tag' | 'ring' }  // ring för slutminuterna
  pitch: ReactNode      // schematic SVG per kind
  subChoices?: ReactNode
  readout?: { label: string; pct: number }
  riskRow?: string[]    // bara slutminuterna
  coachTip?: string
  coach?: AssistantCoach
  cta: { label: string; variant: 'copper' | 'danger' }
  phase: 'choosing' | 'locked' | 'revealed'
  outcome?: ReactNode
  onConfirm: () => void
  onTimeout: () => void
}
```

**8-sek count-down-ring (slutminuterna):**

```tsx
// SVG circle som count-downar
<svg className="event-timer-ring" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--led-red)" strokeWidth="2"
    strokeDasharray={`${(timeLeft / totalSeconds) * 100} 100`}
    strokeLinecap="round"
    style={{ animation: 'pulse 0.9s ease-in-out infinite' }} />
</svg>
```

CSS keyframe `@keyframes pulse { 50% { opacity: 0.5 } }`.

### B-02 · LastMinutePress redesign

Fil: `src/presentation/components/match/LastMinutePress.tsx`

**Behåll:** mekaniken (8-sek timer, default `pushForward` vid timeout, tre val, modifiers från `lastMinutePressService`).

**Byt:**

- Visuell vokabulär — använd nya `InteractionShell` med `timer.style = 'ring'`.
- `subChoices` blir tre LED-knappar: ALLT FRAM (🔥) / TRYCK PÅ (💪) / HÅLL UT (🧘). Vald = grön LED + glow.
- `riskRow` visas alltid: `['FOUL +25', 'SLÄPPER IN +15', 'TIMEOUT → TRYCK PÅ']`.
- `pitch` blir ny SVG: hel plan, 10 amber spelare i högt formation, 5 röda risk-pilar uppåt, "ALLT FRAM" stort i röd LED ovanför planhalvan.
- `cta.variant = 'danger'` → röd CTA "Spräng igenom →".

### B-03 · MatchReportView restyling

Fil: `src/presentation/components/match/MatchReportView.tsx`

**Behåll:** datakontrakt `{ fixture, game, onClose }`. `generateMatchStory()`. All mekanik.

**Byt:**

Layout-struktur enligt `match-report-stalvallen.html`:

1. **`stage` (top, leather-dk):** scoreboard-modulen i FT-state. Återanvänd `<Scoreboard {...} showNowMarker={false} period="FT" />`. Final-band om `fixture.isFinaldag === true`.
2. **`paper` (papper-warm):** arena-rad, story, events, hörnstats, betyg, CTA "Fortsätt →".

**Arena-rad:**

```tsx
<div className="arena-line">
  {arenaName} <span className="dot" /> {dateString}
  <span className="dot" /> <span className="att">{attendance} ÅSKÅDARE</span>
</div>
```

`arenaName` från `formatArenaName(fixture, game)` (befintlig util) eller från `clubExtendedInfo` (Slagghögen för Forsbacka, etc — `arenaNote` är beskrivning, inte namn — kan behöva ny mapping).

**Story-block:**

```tsx
<div className="story-head">Matchens berättelse</div>
<p className={`story-body ${shouldBeMuted ? 'muted' : ''}`}>
  {generateMatchStory()}
</p>
```

`shouldBeMuted = (homeScore === 0 && awayScore === 0)` — 0-0 får muted/italic.

**Events-rad:**

```tsx
{visibleEvents.length > 0 ? (
  visibleEvents.map(ev => <EventRow event={ev} />)
) : (
  <div className="events-empty">
    INGA MÅL · INGA UTVISNINGAR
    <span className="sub">Det blev en tight och taktisk match.</span>
  </div>
)}
```

EventRow tag-mappning:
- `MatchEventType.Goal` → `tag.mal` (eller `tag.hornmal` om `isCornerGoal`, `tag.straff` om `isPenaltyGoal`)
- `MatchEventType.RedCard` → `tag.utv`

**Hörnstats-pärla:**

```tsx
{managedCornerGoals > 0 && (
  <div className="corner-band">
    <span className="num">{managedCornerGoals}</span>
    <span className="lbl">
      <strong>hörnmål av {managedCorners} hörnor</strong>
      <small>{homeClub.shortName} {fixture.report?.cornersHome ?? 0} — {awayClub.shortName} {fixture.report?.cornersAway ?? 0}</small>
    </span>
  </div>
)}
```

Visa BARA om `managedCornerGoals > 0`. Annars dölj.

**Spelarbetyg-strip:**

```tsx
<div className="ratings">
  {ratedPlayers.map((rp, i) => (
    <div className={`rate-row ${i === 0 ? 'potm' : ''}`} key={rp.player.id}>
      {/* 6-grid: star/num | pos | name | club-dot | bar | rate-num */}
    </div>
  ))}
</div>
```

Färg-klass på bar och rate-num: `bar.good` (≥7), `bar.mid` (6-7), `bar.bad` (<6). Samma för rate-num.

POTM = första raden (sorterad fallande på betyg). Får `potm`-class + ★-mark + copper-bakgrund.

### B-04 · Tester (Batch B)

```ts
// LastMinutePress.test.tsx (uppdatera befintliga)
describe('LastMinutePress redesign', () => {
  it('renderar med count-down-ring style', () => { ... })
  it('riskRow visas alltid', () => { ... })
  it('CTA-variant är danger', () => { ... })
})

// MatchReportView.test.tsx
describe('MatchReportView', () => {
  it('renderar scoreboard FT-state överst', () => { ... })
  it('story får muted-class vid 0-0', () => { ... })
  it('hörnstats göms när managedCornerGoals === 0', () => { ... })
  it('POTM-rad får star + copper-styling', () => { ... })
  it('events-empty-rad visas vid tom events-list', () => { ... })
  it('final-band visas vid playoff-final', () => { ... })
})
```

---

## BATCH C — Portal secondary cards restyling

**Estimat:** ~3-4h
**Mock:** `portal-secondary-cards.html`

### C-01 · BoardObjectivesSecondary, WeeklyDecisionSecondary, ActiveArcsSecondary

Tre befintliga komponenter får ny styling. Datakontrakten är fasta.

**Gemensam card-stil:**

```css
.card {
  position: relative;
  background: var(--bg-portal-surface);
  border: 1px solid rgba(196,122,58,0.15);
  border-radius: var(--radius-md);
  padding: 14px 16px 14px 18px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.card::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--copper);
}
.card.relations::before { width: 3px; background: var(--warm); }  /* för WeeklyDecision */
```

**Eyebrow-monospace label:**

```css
.card-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--copper);
  opacity: 0.85;
  margin-bottom: 10px;
}
```

**Klick-affordans:** chevron uppe till höger (`→` eller `›`), absolute-positionerat.

### C-02 · Specifika kort

Per kort i mocken:

- **Veckans Beslut** → `WeeklyDecisionSecondary`. Stripe = `--warm` (relations), label = "VECKANS BESLUT", question i Georgia serif, två val-knappar.
- **Styrelseuppdrag** → `BoardObjectivesSecondary`. Stripe = `--copper`, label = "STYRELSEN", uppdrag-list med progress.
- **Pågående arcs** → `ActiveArcsSecondary`. Stripe = `--copper`, label = "ARCS", arc-list med phase-indikator.

### C-03 · Tester (Batch C)

```ts
describe('Portal secondary cards — Stålvallen styling', () => {
  it('BoardObjectivesSecondary använder copper stripe', () => { ... })
  it('WeeklyDecisionSecondary använder warm stripe', () => { ... })
  it('ActiveArcsSecondary använder copper stripe', () => { ... })
})
```

### C-04 · Vad du INTE ska göra

- **Inte ändra** datakontrakten. `BoardObjectivesSecondary` tar fortfarande `{ game }`-prop, etc.
- **Inte byta** komponentnamn eller filnamn. Det är restyling, inte ny komponent.
- **Inte införa** nya kort i Portal. Mocken visar kort som motsvarar befintliga komponenter.

---

## BATCH D — 4 övriga event-paneler

**Estimat:** ~22h (5h hörna, 4h frislag, 4h straff, 5h kontring + 4h tests/integration)
**Mock:** `match-events-stalvallen.html` (events 01-04)

### D-01 · CornerInteraction redesign

**Befintlig:** `src/presentation/components/match/CornerInteraction.tsx` (om den finns) eller motsvarande som anropas från `MatchLiveScreen` när `cornerInteractionData` är satt.

**Mekanik (oförändrad):** `cornerInteractionService.ts` → `CornerZone: near/center/far` × `CornerDelivery: hard/low/short`.

**Sub-choices:** NÄRA / MITT / BORTRE (zone) ELLER HÅRT / LÅGT / KORT (delivery). Mocken har 3 zoner med träff% PLUS 3 delivery-knappar. Fundera på UI: kan vara två rader (zone först, delivery sedan) eller en kombinerad grid. Mocken visar två-stegs-val — verifiera.

**Pitch SVG:** kortsida + bås, MV, 4 försvarare (röda LED), 3 zoner (NÄRA/MITT/BORTRE) som halvgenomskinliga area-fills med träff%, kurvad pass-pil från flagga, 3 framåtanfallarnas rusningar (amber LED med nummer).

**Timer:** 3s amber tag (inte ring).

**CTA:** copper "Slå hörnan →".

### D-02 · FreeKickInteraction redesign

**Mekanik:** `freeKickInteractionService.ts` → `FreeKickChoice: shoot/chipPass/layOff`.

**Sub-choices mappning:** SKJUT (shoot) / CHIP (chipPass) / KORT (layOff).

**Pitch SVG:** mål uppe + nät, MV (stålblå), mur 3 röda block, 18m-distans-mark, 3 banor (skjut/chip/kort) som dashed strokes.

**Timer:** 4s amber tag.

**CTA:** copper "Slå frislaget →".

### D-03 · PenaltyInteraction redesign

**Mekanik:** `penaltyInteractionService.ts` → `PenaltyDirection: left/center/right` × `PenaltyHeight: low/high`.

**Sub-choices:** 6-zons-grid (V/M/H × HÖGT/LÅGT) med procent per zon. Vald zon = grön LED, alla andra dimmade. PLUS ett två-knappar-val för height-bekräftelse (LÅGT / HÖGT).

**Pitch SVG:** målbild framifrån, ribba, 6 zoner med procent (Mocken visar konkreta %-siffror — beräkna från `resolvePenalty`-logiken: `same` ger 0.25 (low) / 0.35 (high), `diff` ger 0.75/0.80, justerat med skill-diff). MV blockerar M-zon visuellt, skottbana till vald zon i amber.

**Timer:** 2s amber tag.

**CTA:** röd `danger` "Skjut straffen →".

### D-04 · CounterAttackInteraction redesign

**Mekanik:** `counterAttackInteractionService.ts` → `CounterChoice: sprint/build/earlyBall`.

**Sub-choices mappning:** BRYT (sprint) / SPELA AV (earlyBall) / BYGG (build).

**Pitch SVG:** planhalva, mål uppe, MV, 1 backande försvarare (röd LED), löpare #11 (amber LED, pulserande), support #14 (amber LED, statisk), 3 banor (BRYT/SPELA AV/BYGG) som linjer.

**Timer:** 3s amber tag.

**CTA:** copper "Kör kontringen →".

### D-05 · Tester (Batch D)

```ts
describe('CornerInteraction', () => {
  it('mappar 3 zoner till CornerZone-typer', () => { ... })
  it('mappar 3 delivery-val till CornerDelivery-typer', () => { ... })
})
describe('FreeKickInteraction', () => {
  it('KORT mappar till layOff', () => { ... })
})
describe('PenaltyInteraction', () => {
  it('renderar 6 zoner med procent', () => { ... })
  it('procenterna kommer från resolvePenalty-logik', () => { ... })
})
describe('CounterAttackInteraction', () => {
  it('BRYT mappar till sprint', () => { ... })
  it('SPELA AV mappar till earlyBall', () => { ... })
  it('BYGG mappar till build', () => { ... })
})
```

### D-06 · Vad du INTE ska göra

- **Inte ändra** mekanik-services. Visualiseringen är avtryck av zon/val-typer.
- **Inte uppfinna** nya zon-typer eller val. Hörnan har 3 zoner i koden — inte 4 eller 6 i UI.
- **Inte hardkoda** procent-siffror i UI. De kommer från `resolveCorner`/`resolveFreeKick`/`resolvePenalty`/`resolveCounter`-logikens success-rates eller motsvarande.

---

## BATCH E — Press/media-separation

**Estimat:** ~12h
**Mock:** `press-media-separation.html`
**Status:** SEPARAT LIFT — gör efter A-D är klara, eller skjut till senare iteration.

### E-01 · Datakontrakt

```ts
type OperatorRow = {
  kind: 'operator'
  register: 'event' | 'atmosphere' | 'coach'
  // existerande FeedRow-fält
}

type MediaItem = {
  kind: 'media'
  register: 'quote' | 'press' | 'interview'
  attribution: { name: string; role: string }
  timestamp: string  // ISO eller display-format
  body: string       // längre text
}
```

### E-02 · Komponenter

- **`OperatorFeed.tsx`** — vad CommentaryFeed redan är. Operatör-register på mörk yta.
- **`MediaSection.tsx`** — ny komponent. Papper-warm yta, serif body 15px, generös line-height. Tre korstyper: Citat, Pressrelease, Intervju.
- **`PressReleaseCard.tsx`** — rubrik display-serif, ingress, body.
- **`InterviewCard.tsx`** — Q/A-format.
- **`MediaQuote.tsx`** — quote-block med attribuering.

### E-03 · Integration

Press/media kan visas på Portal som secondary section ELLER i InboxScreen ELLER i ny dedicated screen. Beslut: börja med Portal-secondary för minimal lift.

### E-04 · Vad du INTE ska göra

- **Inte blanda** registren i samma feed. Operatör-rader och media-block lever på separata ytor.
- **Inte återanvända** commentary-feedens TagType för media-rader. Media använder andra konventioner (citat-tecken, attribuering).
- **Inte hardkoda** media-data. Datan måste komma från en service (`mediaService.ts` eller liknande, ej skapad än — eget sub-task).

---

## Acceptanskriterier (gäller alla batcher)

- [ ] Alla nya tokens i `colors_and_type.css`
- [ ] Befintliga tokens orörda (`--accent`, `--gold`, `--warm`)
- [ ] 7-segment-renderaren delas mellan scoreboard och match-report
- [ ] Stålvallen är universellt designsystem (copper = managed, steel = annan)
- [ ] Alla tester gröna (723 befintliga + nya per batch)
- [ ] Mockarna i `docs/match-live-bundle/` öppnade i webbläsaren ger pixelnära referens — bygg mot dem, inte mot allmän intuition

---

## Vad du INTE ska göra (samtliga batcher)

- **Inte ändra** mekanik i någon match-service. Datakontrakten är låsta.
- **Inte införa** klubb-specifika designs. Stålvallen är universell.
- **Inte ta bort** befintliga komponenter. Restyling, inte ersättning.
- **Inte slå ihop** två batcher i en commit utan att meddela. Pusha mellan så vi kan playtesta inkrementellt.
- **Inte bygga** Press/media (Batch E) innan A-D är klara, om det inte är explicit instruerat.

---

## Rapportera per batch

Per BATCH-ID-XX punkt: ✅ / ⚠️ / ❌ med en mening om vad som gjordes. Pusha som egen commit per batch (eller delar av batch om det blir för stort).

Flagga också:
- Om någon mekanik avvek mot mocken (t.ex. om procentsiffrorna i straff-zoner inte gick att räkna fram från `resolvePenalty`)
- Om InteractionShell-internals krävde mer refactoring än förväntat
- Om något i scoreboard-data-bindingen blev oklart (hur mappar fixture-events mot tidslinje-positioner i OT?)
