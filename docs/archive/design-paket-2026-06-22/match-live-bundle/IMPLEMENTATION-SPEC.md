# Implementeringsspec — Bandy Manager

Fem vyer specade tillsammans: scoreboard, commentary, match events, portal secondary cards, press-/medieseparation. Allt i Stålvallen-vokabulär (mörkt läder, koppar, monospace LED, 7-segment).

Filer i den här bundlen:
- `match-live-stalvallen.html` — full match-vy (scoreboard + commentary + 5 event-ögonblick i samma kolumnformat)
- `scoreboard-stalvallen.html` — fristående scoreboard (live + FT)
- `match-events-stalvallen.html` — fyra spel-event isolerade (hörna, frislag, straff, kontring)
- `commentary-redesign-v2.html` — commentary-feed isolerad
- `portal-secondary-cards.html` — sekundära kort i portalen
- `press-media-separation.html` — press/media-uppdelning

---

## 1 · Scoreboard (`Scoreboard.tsx`)

### Visuellt språk
- **Bakgrund**: mörkt läder (`#1d1b18`), koppar-kant (`#C47A3A`)
- **Tavla**: panel `#0A0908`, scanlines som repeating-linear-gradient (1px ljus, 3px mellanrum, opacity 0.018)
- **LED-palett**: röd `#FF2A18` (mål/motståndare), amber `#FFAA00` (tid/utvisning/timer), grön `#66FF33` (NU/valda zoner)
- **Typografi**: 7-segment digital för score+tid (custom CSS), monospace `Courier New` för LED-text

### Moduler (uppifrån och ner)
1. **module-main** — score 7-segment stort + tid 7-segment medel. `HL1`/`HL2` period-tag i koppar.
2. **module-pen** — utvisnings-strip, två slots (home/away). När aktiv: `▲`-mark, nummer, namn, tid kvar i mm:ss. Tom slot = `class="empty"`.
3. **module-text** — rullande textremsa med 4-5 spans, alternerande full/dim opacity. Animeras horisontellt.
4. **module-line** — tidslinje 0–90 min, ticks vid 15/30/60, halvtidslinje vid 50%, mål-prickar (home koppar, away stål-grå), utvisnings-band, NU-prick i amber.

### Tillstånd
- **Live**: NU-prick syns, score-flash 4s-loop på senast scorat lag
- **FT**: NU-prick borta, FT-mark i textremsan, period-tag = `FT`

### Datakontrakt
```ts
{
  fixture: { homeCode, awayCode, homeScore, awayScore, period: 'HL1'|'HL2'|'FT', minute, second },
  penalties: [{ team, num, name, secondsLeft }],
  ticker: string[], // 4-5 rader, blandade dim/normal
  events: [{ minute, type: 'goal'|'pen', team }] // för tidslinjen
}
```

### Krav
- Sticky topp i match-vyn (position sticky, top 0).
- Aldrig täckt av event-panelen — den fälls upp över commentary-feedens NEDRE rader.
- Score-flash triggas via class-toggle `.score-flash` (CSS keyframe).

---

## 2 · Commentary (`CommentaryFeed.tsx`)

### Visuellt språk
- **Bakgrund**: läder-gradient `#1d1b18 → #211e1a`
- **Rad**: 12px padding, 1px koppar-divider opacity 0.08
- **Min-kolumn**: amber LED monospace, fast bredd 32px
- **Body**: tag-rad + meta-rad + textrad

### Tag-system (LED-tag-vokabulär — samma som event-panelens ev-tag)
- `MÅL` / `STRAFF` — koppar bg, `goal`-row har bg-tint koppar 10%
- `UTV` / `FRISLAG` / `SLUTET` — amber
- `RÄDD` — grön
- `SKOTT` / `PASS` / `BYTE` / `BREK` — neutral muted
- `atmosphere`-rad — ingen tag, ingen min, kursiv text om läktare/väder

### Rytm-regler
- Atmosphere-rad var 4-6:e rad så feeden inte blir logg
- Mål-rader bryter visuellt med bg-tint
- Senaste rad alltid synlig — auto-scroll-to-bottom på ny rad

### Datakontrakt
```ts
type FeedRow =
  | { kind: 'event', minute: number, tag: TagType, team?: string, meta?: string, text: string }
  | { kind: 'atmosphere', text: string }
```

### Integration med match events
- När event-panel är uppfälld täcker den feedens **2 nedersta** rader (visuellt — ingen DOM-ändring)
- Översta raderna alltid synliga så användaren har kontext

---

## 3 · Match events (alla 5 ögonblick)

Alla event-paneler delar samma skal. Variationen ligger i **schematic** (taktiktavla i SVG) och **sub-choices** (knappar under).

### Gemensam panel-struktur
1. `event-fold-hint` — fälls upp-pil + label
2. `event-head` — tag (LED röd) + titel + meta + timer (amber tag eller röd ring)
3. `pitch-panel` — schematic SVG, mörk LED-display-stil (gradient `#1A2628 → #0E1518`)
4. `pitch-sub` — 2-3 monospace-knappar, vald = grön LED med glow
5. `pitch-readout` — VAL: + label + procent
6. `coach` — coach-quote med koppar-avatar
7. `cta` — koppar primary, eller röd `danger` för riskvariant

### Färgkodning på taktiktavlan
- **Röd LED** `#FF3B0F` — motståndare (försvarare, mur, MV-blockering)
- **Amber LED** `#FFAA00` — egna spelare (rusningar, skytt, support)
- **Grön LED** `#66FF33` — vald zon / vald bana / aktiv pil
- **Stålblå** `#6FB6E8` — målvakt
- **Dimmade alternativ** — opacity 0.5, dashed stroke

### Per event

| # | Event | Timer | Tavla-vokabulär | Sub-choices | Coach-CTA |
|---|---|---|---|---|---|
| 01 | **HÖRNA** | 3s amber | Kortsida + bås, MV, 4 försvarare, 3 zoner (NÄRA/MITT/BORTRE) med träff%, kurvad pass-pil från flagga, 3 framåtanfallarnas rusningar med nr | HÅRT / LÅGT / KORT | "Slå hörnan →" |
| 02 | **FRISLAG** | 4s amber | Mål uppe + nät, MV, mur 3 röda block, 18m-distans, 3 banor (skjut/chip/kort) | SKJUT / CHIP / KORT | "Slå frislaget →" |
| 03 | **STRAFF** | 2s amber | Målbild framifrån, ribba, 6 zoner (V/M/H × HÖGT/LÅGT) med procent, MV blockerar M, skottbana till vald | LÅGT / HÖGT | "Skjut straffen →" (danger röd) |
| 04 | **KONTRING** | 3s amber | Planhalva, mål uppe, MV, 1 backande försvarare (röd), löpare #11 pulsar amber, support #14, 3 banor (BRYT/SPELA AV/BYGG) | BRYT / SPELA AV / BYGG | "Kör kontringen →" |
| 05 | **SLUTMINUTERNA** | **8s röd ring** | Hel plan, 10 amber spelare i högt formation, 5 röda risk-pilar uppåt, "ALLT FRAM" stort i röd LED | ALLT FRAM / TRYCK PÅ / HÅLL UT | "Spräng igenom →" (danger röd) |

### Slutminuterna — särskilda krav
- Triggas en gång per match när `scoreDiff === -1 && step >= 55`
- **8-sek count-down-ring** istället för amber tag — `.event-timer.ring` med SVG circle, röd LED, pulse 0.9s
- **Risk-rad** (`risk-row`) under readout: `FOUL +25`, `SLÄPPER IN +15`, `TIMEOUT → TRYCK PÅ`
- Default på timeout = `pushForward` (mellanvalet)
- Mekanik kalibrerad — modifierare och rates rörs ej:
  - `allIn`: +30 goal, +25 foul, +15 concede → ~42% chans
  - `pushForward`: +15/+10/+5 → ~28%
  - `acceptResult`: 0/0/0 → ~8%

### Datakontrakt (interaction shell)
```ts
type InteractionData =
  | { kind: 'corner', side: 'V'|'H', shooter: Player, defenders: Player[] }
  | { kind: 'freekick', distance: number, wallCount: number, shooter: Player }
  | { kind: 'penalty', shooter: Player, gk: Player }
  | { kind: 'counter', runner: Player, support: Player[], defenders: Player[] }
  | { kind: 'lastminute', minute: number, scoreDiff: number, fatigue: number }

interface InteractionResult {
  choice: string         // 'NÄRA' | 'MITT' | 'BORTRE' | 'allIn' | etc.
  subChoice?: string     // 'HÅRT' | 'LÅGT' | 'KORT' etc.
  timedOut: boolean
  msToDecide: number
}
```

### Komponentträd (förslag)
```
<InteractionShell timer={3|4|8} kind={...}>
  <EventHead tag title meta timerStyle={'tag'|'ring'} />
  <PitchPanel schematic={SVG-renderer per kind} />
  <SubChoices options={...} selected onPick />
  <Readout label pct />
  <RiskRow optional />          // bara lastminute
  <CoachQuote text />
  <CTA variant={'copper'|'danger'} onClick />
</InteractionShell>
```

---

## 4 · Portal secondary cards (`portal-secondary-cards.html`)

Sekundära kort i portalen — ej hjälte-modulen utan stödblock under (ekonomi, trupp, nästa motståndare, tabellposition, etc.).

### Visuellt språk
- **Yta**: papper-warm `#F5F1EB`, koppar-accent på rubrik och nyckeltal
- **Hierarki**: kort-rubrik (eyebrow, monospace 10px koppar, letter-spacing 2px) + huvudvärde (display-serif 28px ink) + meta-rad (sans 11px ink-mute)
- **Skuggning**: 0 4px 12px rgba(0,0,0,0.08), aldrig hårda boxshadows
- **Gränser**: 1px koppar opacity 0.15, radius 8px

### Korttyper (se `portal-secondary-cards.html` för exempel)
1. **Ekonomi** — saldo huvudvärde, delta vs förra månaden i grön/röd
2. **Truppstatus** — 3 mini-stats: skadade, avstängda, formdippare
3. **Nästa motståndare** — logo-placeholder + namn + datum + form-rad (W/L/D-prickar)
4. **Tabellposition** — placering huvudvärde + delta-pil + serietabell-mini
5. **Senaste resultat** — 3 senaste matcher i strip-format

### Layout-grid
- Desktop: 4 kolumner, fast höjd 180px
- Tablet: 2 kolumner
- Mobil: 1 kolumn, full bredd, höjd auto

### Krav
- Klickbara — hela kortet är hover-target, lyfter 2px på hover
- Eyebrow alltid uppercase, monospace, koppar
- Inga ikoner i sekundära kort — typografin bär hierarkin

---

## 5 · Press / medieseparation (`press-media-separation.html`)

Separationen mellan **operatörens röst** (commentary, intern coach) och **mediarummet** (officiella citat, press, intervjuer).

### Två register
- **Operatör** (intern, mörk yta): kort, direkt, taktisk. Coach-quote, atmosphere-rad, snabbnotiser.
- **Media** (extern, papper-yta): hela meningar, citat-tecken, attribuering, tidsstämpel. Längre format.

### Visuell distinktion
| Aspekt | Operatör | Media |
|---|---|---|
| Bakgrund | `#1d1b18` läder | `#F5F1EB` papper-warm |
| Textfärg | `#E6DDD0` warm white | `#1A1A18` ink |
| Typografi | Sans-serif, 13px, tight | Serif body 15px, generös line-height |
| Citat | Italic, kort | `"…"` quote-marks, längre stycken |
| Attribuering | "PL" avatar-bricka, koppar 28px | Helt namn + roll, 11px monospace eyebrow |
| Yta | Inline-rader i feeden | Kort-block, 24px padding |

### Korstyper på media-sidan
1. **Citat** — quote-tag-block, attribuering, datum
2. **Pressrelease** — rubrik display-serif, ingress, body
3. **Intervju** — Q/A-format, fråga ink-mute, svar ink

### Krav
- Operatör-rader får ALDRIG visa pressformatet (för långt, fel ton)
- Media-block får aldrig visa operatör-tag-vokabulären (`MÅL` / `UTV`)
- Två register kan samexistera i samma vy men i tydligt åtskilda zoner — ej blandas i samma feed

### Datakontrakt
```ts
type OperatorRow = { kind: 'operator', register: 'event'|'atmosphere'|'coach', ... }
type MediaItem   = { kind: 'media', register: 'quote'|'press'|'interview',
                     attribution: { name, role }, timestamp, body }
```

---

## Tokens (delat)

```css
--bg-leather:    #2a2824;
--bg-leather-dk: #1d1b18;
--paper:         #EDE8DF;
--paper-warm:    #F5F1EB;
--copper:        #C47A3A;
--copper-deep:   #A25828;
--steel:         #6B7F8E;
--ink:           #1A1A18;
--ink-soft:      #6B6760;
--ink-mute:      #8A857A;

--led-red:      #FF2A18;
--led-amber:    #FFAA00;
--led-green:    #66FF33;
--led-red-glow: rgba(255, 42, 24, 0.55);

--font-display: Georgia, 'Times New Roman', serif;
--font-mono:    ui-monospace, 'Courier New', monospace;
--font-body:    -apple-system, system-ui, sans-serif;
```

## Implementations-ordning (förslag)

1. **Scoreboard** — fristående, ingen state-koppling till events. Kör.
2. **CommentaryFeed** — operator-register först, atmosphere-rader sen.
3. **InteractionShell** — gemensam shell, sen schematics per kind (corner → freekick → penalty → counter → lastminute).
4. **Match-live-skärm** — kombinera ovanstående med sticky scoreboard.
5. **Portal secondary cards** — fristående, kan implementeras parallellt med 1.
6. **Press/media-separation** — sista, beror på media-data-kontrakt.

## Krockar att respektera
- Slutminuts-mekaniken är kalibrerad — rates och modifierare rörs ej
- 8-sek timer för slutminuterna är fast
- Default på timeout = `pushForward`
- Scoreboarden täcks aldrig av event-panel
- Operatör- och media-register blandas aldrig i samma feed
