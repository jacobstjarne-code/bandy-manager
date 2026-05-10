# CODE — Stålvallen i live-match + plan-vy-fix

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** SPEC — två fixar, inkluderar mock för plan-vy

---

## Bakgrund

Två observationer från Jacobs playtest:

1. **Stålvallen-scoreboarden visas inte i live-match.** BATCH A levererade `ScoreboardStalvallen` + `CommentaryFeedStalvallen` men `MatchLiveScreen.tsx` importerar fortfarande de gamla `Scoreboard` och `CommentaryFeed`. Bara `MatchReportView` (FT-state) fick uppdateringen. Min pixel-audit fångade inte detta — granskade komponenter i isolation, inte deras användning.

2. **Plan-vyn (`PitchLineupView`) har dubbel etikettering.** Varje slot har en stor positions-label OVANFÖR cirkeln (slot.label.toUpperCase()) plus en 2-bokstavskod INOM cirkeln (slot.label.slice(0,2)). Två lager visuell information för samma sak. Visuellt rörigt.

**Mock för plan-vyn:** se `docs/lineup-pitch-mock-2026-05-10.html` — visar både ifylld och tom version efter fix.

---

## FIX-12 · Aktivera Stålvallen-scoreboard + commentary i live-match

**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`

**OBS:** Det finns två filer med samma namn:
- `src/presentation/screens/MatchLiveScreen.tsx` (den aktiva — verifierad import-rad ~22-23)
- `src/presentation/screens/match/MatchLiveScreen.tsx` (kontrollera om denna fortfarande används eller är obsolet)

Bekräfta vilken som är aktiv och uppdatera den. Om båda är aktiva — uppdatera båda.

### Nuvarande imports (att byta)

```ts
import { Scoreboard } from '../components/match/Scoreboard'
import { CommentaryFeed } from '../components/match/CommentaryFeed'
```

### Nya imports

```ts
import { ScoreboardStalvallen } from '../components/match/scoreboard/ScoreboardStalvallen'
import type { ScoreboardEvent, PenaltyEntry } from '../components/match/scoreboard/ScoreboardStalvallen'
import { CommentaryFeedStalvallen } from '../components/match/commentary/CommentaryFeedStalvallen'
import type { FeedRow } from '../components/match/commentary/CommentaryFeedStalvallen'
```

### Props-mapping

`ScoreboardStalvallen` kräver fler props än gamla `Scoreboard`. Mappa från befintlig MatchLiveScreen-state:

| Stålvallen-prop | Källa i MatchLiveScreen |
|---|---|
| `homeCode` | `homeClubName.substring(0, 6).toUpperCase()` (eller liknande shortName-logik som MatchReportView använder) |
| `awayCode` | `awayClubName.substring(0, 6).toUpperCase()` |
| `homeScore` | nuvarande `homeScore`-state |
| `awayScore` | nuvarande `awayScore`-state |
| `managedSide` | `fixture.homeClubId === managedClubId ? 'home' : 'away'` |
| `period` | beräkna från match-state: 'HL1' om minute < 45, 'HL2' om < 90, 'OT' om OT-läge |
| `minute` | beräkna från `step` (varje step = 1.5 minuter eller liknande, kolla matchSimulator) |
| `second` | 0 (eller härled från step om matchsim har sekund-granularitet) |
| `penalties` | filtera aktiva utvisningar från events, mappa till `PenaltyEntry[]` |
| `ticker` | array med t.ex. `[\`${homeCode} ${homeScore} – ${awayScore} ${awayCode}\`, getCurrentEventDescription()]` |
| `events` | mappa goal-events från match-events till `ScoreboardEvent[]` (minute, type: 'goal', team) |
| `isPlayoffFinal` | befintlig logik (matchPhase === 'final') |
| `finalTier` | 'CUPFINAL' / 'SM-FINAL' / 'KVARTSFINAL' / 'SEMIFINAL' baserat på matchPhase |
| `showNowMarker` | `true` (vi är i live-läge) |

`CommentaryFeedStalvallen` tar `rows: FeedRow[]`. FeedRow är union av:

```ts
| { kind: 'event'; minute: number; tag: TagType; team?: 'home' | 'away'; meta?: string; text: string }
| { kind: 'atmosphere'; text: string }
```

Mappa befintliga commentary-strängar:
- Goal-events → `{ kind: 'event', tag: 'goal', minute, team, text }`
- Penalty-events → `{ kind: 'event', tag: 'penalty', minute, team, text }`
- Suspension → `{ kind: 'event', tag: 'suspension', minute, team, text }`
- Save → `{ kind: 'event', tag: 'save', minute, team, text }`
- Atmosfäriska kommentarer (utan tag) → `{ kind: 'atmosphere', text }`
- Övriga match-events → välj rimligaste tag från TagType-union

### Anrop i render

Byt:

```tsx
<Scoreboard ... />
<CommentaryFeed ... />
```

Till:

```tsx
<ScoreboardStalvallen
  homeCode={...}
  awayCode={...}
  // ... alla props mappade enligt ovan
/>
<CommentaryFeedStalvallen
  rows={mappedRows}
  autoScroll={true}
/>
```

### Verifiera

- Live-match-vyn ska visa samma Stålvallen-scoreboard som match-report (med `period` annan än 'FT')
- Score-flash ska triggas vid mål
- Tidslinjen ska visa nu-markör + mål-prickar
- Commentary-feed ska visa rader med tag-stilar (MÅL, STRAFF, etc.)

---

## FIX-13 · Plan-vy + Lista-vy — ta bort dubbel etikettering

**Filer:**
- `src/presentation/components/match/PitchLineupView.tsx` (Plan-fliken, drag-and-drop)
- `src/presentation/components/match/LineupFormationView.tsx` (Lista-fliken, mini-pitch i toppen)

Båda komponenterna har **identisk** slot-rendering med samma dubbel-etikettering-problem. Fixet appliceras på båda — de ska styras upp på samma sätt så pitchen ser likadan ut oavsett vilken flik som visas.

**Mock:** `docs/lineup-pitch-mock-2026-05-10.html` (öppna i webbläsare för visuell referens — gäller båda flikars pitch)

### Problem

Varje slot renderas idag i BÅDA filer med:

```tsx
{/* Position label above circle — TA BORT */}
<span style={{
  position: 'absolute',
  top: -5,
  fontSize: 8,
  fontWeight: 700,
  color: isEmpty ? 'rgba(26,26,24,0.55)' : 'rgba(26,26,24,0.65)',
  ...
}}>
  {slot.label.toUpperCase()}
</span>

{/* Circle */}
<div style={{
  width: 32, height: 32,
  ...
  fontSize: isEmpty ? 7 : 10,
}}>
  {player ? player.shirtNumber : slot.label.slice(0, 2)}
</div>
```

= två lager visuell info för samma slot.

### Fix (gäller båda filer)

**Ta bort position-labeln OVANFÖR cirkeln.** Behåll bara cirkeln. Lägg till position-koden INOM cirkeln när tom (slot.label.slice(0, 2) som idag), och tröjnummer när placerad (som idag).

Identisk ändring i `PitchLineupView.tsx` och `LineupFormationView.tsx`. Båda har samma struktur — sökmönstret är samma label-`<span>` med `top: -5px` följt av cirkel-`<div>`.

### Cirkeln själv förstoras något

Mocken visar 38px cirklar (mot dagens 32px) för att rymma kortkod tydligt utan label ovanför. Justera:

```tsx
{/* Circle — slightly larger, centered code/number */}
<div style={{
  width: 38,
  height: 38,
  borderRadius: '50%',
  fontSize: isEmpty ? 9 : 13,
  fontWeight: isEmpty ? 700 : 800,
  // ... resten oförändrad
}}>
  {player
    ? (player.shirtNumber != null ? String(player.shirtNumber) : '?')
    : slot.label.slice(0, 2).toUpperCase()
  }
</div>
```

### Slot-container

Eftersom labeln är borta behöver containern inte vara 58px hög längre. Justera:

```tsx
<div
  key={slot.id}
  style={{
    width: 38,
    height: 38,
    // ...
  }}
>
```

(Ner från 44×58 till 38×38.)

### Behåll i PitchLineupView

- Drag-and-drop (tap-to-select-tap-to-place) oförändrad mekanik
- ringColor-logik (success/warning/danger för match/adjacent/wrong position)
- Pulse-animation på empty slots när selection finns
- Legend nedanför pitchen ("9 Almlund (VF) · 11 Gran (HF) · ...") — den är där position-info bevaras

### Behåll i LineupFormationView

- `onSlotClick`-mekaniken (klick på slot väljer den, spelar-lista nedanför hanterar tilldelning)
- ringColor-logik (samma som ovan)
- isSelected-styling när selectedSlotId matchar
- Legend nedanför pitchen (om sådan finns — annars härleds spelarna från listan)

### Mini-pitchen i LineupFormationView ska fylla containerns bredd

Från Jacobs playtest verkar mini-pitchen vara smalare än sin container (~60% bredd istället för 100%). Verifiera att `<BandyPitch width="100%" />` faktiskt rendrerar i full bredd — om height är fixed (`height={170}`) och pitch-aspekten (220×170) inte håller, kan det bli upp/ner-pinnad bredd. Justera till att pitch-bredden styr (ta bort fixed height eller använd aspect-ratio CSS).

### Mocken visar

- Bild 1 (vänster): ifylld plan med tröjnummer i cirklarna, legend nedanför
- Bild 2 (höger): tom plan med 2-bokstavskoder (VF, HF, VM, CM, HM, VY, HY, VB, LI, HB, MV), klar drop-targets

Mocken gäller estetiken för BÅDA flikars pitch — Lista och Plan ska se identiska ut visuellt.

---

## Acceptanskriterier

- [ ] Live-match visar Stålvallen-scoreboard (svart yta, 7-segment, copper/steel-färgning baserat på managedSide)
- [ ] Live-match visar Stålvallen-commentary-feed (mörk yta, monospace tag-bricks)
- [ ] Score-flash triggas vid mål
- [ ] **BÅDA** Lista-vy och Plan-vy har EN label per slot (inom cirkeln) — pitchen ser identisk ut oavsett vilken flik som visas
- [ ] Plan-vyn fungerar identiskt vad gäller drag-and-drop
- [ ] Lista-vyn fungerar identiskt vad gäller `onSlotClick`-baserad selection
- [ ] Tom slot visar 2-bokstavskod (VF, HF, etc.)
- [ ] Placerad slot visar tröjnummer
- [ ] Mini-pitchen i Lista-vyn fyller container-bredden (380px på mobil)
- [ ] Befintliga 760 tester gröna
- [ ] Manuell verifiering: spela en match, verifiera scoreboard + commentary; öppna lineup-vy, växla mellan Lista och Plan, verifiera identisk pitch-visualisering

---

## Vad du INTE ska göra

- **Inte ta bort** Lista-fliken eller LineupFormationView — Plan är alternativ, inte ersättning
- **Inte modifiera** drag-and-drop-logiken (`handleSlotTap`, `handlePillTap`, `onAssignPlayer`, `onSwapPlayers`)
- **Inte ta bort** legend-raden under pitchen — det är där spelarnamn syns
- **Inte uppfinna** ny styling — använd existerande tokens (var(--success), var(--warning), var(--danger), var(--accent))
- **Inte ändra** BandyPitch-komponenten (pitch-bakgrund) — bara overlay-slottarna

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. En commit räcker. Pusha gärna efter du verifierat båda fixarna lokalt.

Flagga också:
- Om props-mappingen för ScoreboardStalvallen kräver nya helper-funktioner i matchSimulator eller domain-services
- Om båda MatchLiveScreen-filerna är aktiva eller en är obsolet
