# HANDOFF — R3+ Playoff-klimax-eskalering (valbart tillägg)

**Från:** Design-Claude
**Datum:** 2026-05-16
**Till:** Code (implementerar om Jacob väljer in); Opus (confirmar crit-tag-copy)
**Pairas med mock:** `docs/mockups/2026-05-16_design_endgame_klimax.html`
**Bygger ovanpå:** `HANDOFF-ENDGAME-PORTAL-R3.md`
**Status:** VALBART. R3-basen är giltig utan detta. Wire bara om Jacob playtest:ar R3 och konstaterar att slutspelet känns för platt.

---

## 0 · TL;DR

R3-basen löser fas-byten (PhaseMark + suppression). R3+ löser progressionen *inom* slutspel — så att G5 i SM-Final inte ser ut som G1 i kvartsfinalen. Tre tekniker ackumulerar:

1. **RoundMark** — ny komponent. Typografisk mini-markör per playoff-runda. Pendant till PhaseMark, men repeterande och mindre.
2. **Primary-vikt 1/2/3** — `NextMatchPrimary` och `SMFinalPrimary` får en `weight`-prop. Border-styrka + top-gradient + crit-tag ackumuleras med round + criticality.
3. **Gold-token på SM-Final** — `--gold` aktiveras på RoundMark, Primary-zon och CTA. Sekundärerna lämnas oförändrade.

Q3-principen från R3 står fast: **sekundärer ändras inte**. All eskalation sker i Primary-area + RoundMark.

---

## 1 · NY KOMPONENT — `PortalRoundMark`

### Plats
`src/presentation/components/portal/PortalRoundMark.tsx`

### Renderas
Mellan `PortalBeat` och `PortalActiveBudget`. Bara när `game.playoffBracket` finns. **Inte** i seriespel/endgame.

### Anatomi
En rad. Centrerad. ⬩-flankar runt rundnamnet, eventuellt crit-suffix.

```
⬩ Kvartsfinal ⬩                      (accent · open)
⬩ Kvartsfinal · Avgörande ⬩          (accent + warm crit-suffix)
⬩ Semifinal · Matchpuck ⬩            (accent + warm crit-suffix)
⬩ SM-Final · Avgörande ⬩             (gold)
```

### CSS-klasser

```css
.portal-roundmark {
  margin: 2px 14px 12px;
  text-align: center;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--accent);
  opacity: 0.85;
  line-height: 1.2;
}
.portal-roundmark::before,
.portal-roundmark::after {
  content: '⬩';
  display: inline-block;
  margin: 0 8px;
  opacity: 0.7;
}
.portal-roundmark .crit {
  color: var(--warm-light);
  margin-left: 6px;
  font-weight: 700;
}
.portal-roundmark.gold        { color: var(--gold); opacity: 1; }
.portal-roundmark.gold .crit  { color: var(--gold); }
```

### Komponent-skiss

```tsx
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getPlayoffSeriesContext } from '../../../domain/services/portal/playoffSeriesContext'
import { PlayoffRound } from '../../../domain/enums'

interface Props { game: SaveGame }

const ROUND_LABELS: Record<PlayoffRound, string> = {
  [PlayoffRound.QuarterFinal]: 'Kvartsfinal',
  [PlayoffRound.SemiFinal]: 'Semifinal',
  [PlayoffRound.Final]: 'SM-Final',
}

const CRIT_LABELS: Record<'open' | 'matchpuck' | 'decisive', string | null> = {
  open: null,
  matchpuck: 'Matchpuck',
  decisive: 'Avgörande',
}

export function PortalRoundMark({ game }: Props) {
  const ctx = getPlayoffSeriesContext(game)
  if (!ctx) return null
  const isFinal = ctx.round === PlayoffRound.Final
  const critLabel = CRIT_LABELS[ctx.criticality]
  return (
    <div className={`portal-roundmark${isFinal ? ' gold' : ''}`}>
      {ROUND_LABELS[ctx.round]}
      {critLabel && <span className="crit">· {critLabel}</span>}
    </div>
  )
}
```

### Placering i `PortalScreen.tsx`

```tsx
<SituationCard game={game} />
<PortalPhaseMark game={game} />     {/* R3 */}
<PortalBeat game={game} />
<PortalRoundMark game={game} />     {/* R3+ — NY, bara playoff */}
{!isSeason1Round1 && <PortalActiveBudget game={game} />}
{/* … */}
```

---

## 2 · NY HELPER — `getPlayoffSeriesContext`

### Plats
`src/domain/services/portal/playoffSeriesContext.ts`

### Signatur

```typescript
export interface PlayoffSeriesContext {
  round: PlayoffRound
  /** Bra för crit-tag-rendering */
  criticality: 'open' | 'matchpuck' | 'decisive'
  /** Bra för primary-card-styling */
  weight: 1 | 2 | 3
  /** Vinster för managed klubb i serien så här långt */
  wins: number
  /** Förluster för managed klubb */
  losses: number
  /** Vilken game i bästa-av-fem som väntar (1–5) */
  nextGame: number
}

export function getPlayoffSeriesContext(game: SaveGame): PlayoffSeriesContext | null
```

### Implementation-skiss

```typescript
import type { SaveGame } from '../../entities/SaveGame'
import { PlayoffRound } from '../../enums'

const ROUND_BASE_WEIGHT: Record<PlayoffRound, number> = {
  [PlayoffRound.QuarterFinal]: 1,
  [PlayoffRound.SemiFinal]: 2,
  [PlayoffRound.Final]: 3,
}

export function getPlayoffSeriesContext(game: SaveGame): PlayoffSeriesContext | null {
  const bracket = game.playoffBracket
  if (!bracket) return null

  // Hitta aktiv serie där managed klubb är inblandad
  const allSeries = [
    ...bracket.quarterFinals,
    ...bracket.semiFinals,
    ...(bracket.final ? [bracket.final] : []),
  ]
  const series = allSeries.find(
    s => (s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId)
         && s.winnerId === undefined
  )
  if (!series) return null

  // Räkna vinster/förluster
  const games = series.fixtures
    .map(fid => game.fixtures.find(f => f.id === fid))
    .filter((f): f is NonNullable<typeof f> => !!f && f.status === 'completed')

  let wins = 0, losses = 0
  for (const g of games) {
    const isHome = g.homeClubId === game.managedClubId
    const myGoals = isHome ? g.homeGoals : g.awayGoals
    const theirGoals = isHome ? g.awayGoals : g.homeGoals
    if (myGoals == null || theirGoals == null) continue
    if (myGoals > theirGoals) wins++; else losses++;
  }

  const nextGame = wins + losses + 1

  // Criticality:
  //   decisive = nästa match är G5 i 2–2 ELLER nästa match avgör serien (förlust = ut, vinst = klar)
  //   matchpuck = nästa match kan stänga serien för någon part (men inte båda)
  //   open = annars
  let criticality: 'open' | 'matchpuck' | 'decisive' = 'open'
  if (wins === 2 && losses === 2) criticality = 'decisive'
  else if (wins === 2 || losses === 2) criticality = 'matchpuck'

  const baseWeight = ROUND_BASE_WEIGHT[series.round]
  const critBonus = criticality === 'decisive' ? 2 : criticality === 'matchpuck' ? 1 : 0
  // Final kappas vid 3 (gold). KF + SF kappas vid 2 (gold reserverad för SM-Final).
  const cap = series.round === PlayoffRound.Final ? 3 : 2
  const weight = Math.min(cap, baseWeight + critBonus) as 1 | 2 | 3

  return { round: series.round, criticality, weight, wins, losses, nextGame }
}
```

---

## 3 · ÄNDRADE KOMPONENTER — Primary-vikt

`NextMatchPrimary.tsx` (för KF + SF) och `SMFinalPrimary.tsx` får en `weight`-prop.

### Klassmappning

```tsx
const weightClass = `primary-card primary-weight-${ctx.weight}`
```

### CSS-klasser

```css
.primary-card.primary-weight-1 {
  border-color: rgba(196, 122, 58, 0.32);
}
.primary-card.primary-weight-2 {
  border-color: rgba(196, 122, 58, 0.55);
  background: linear-gradient(180deg,
    rgba(196, 122, 58, 0.08) 0%,
    var(--bg-portal-elevated) 38%);
  box-shadow: 0 0 0 1px rgba(196, 122, 58, 0.10), var(--shadow-card);
}
.primary-card.primary-weight-3 {
  border-color: rgba(232, 185, 92, 0.55);
  background: linear-gradient(180deg,
    rgba(232, 185, 92, 0.10) 0%,
    var(--bg-portal-elevated) 42%);
  box-shadow: 0 0 0 1px rgba(232, 185, 92, 0.18), 0 6px 18px rgba(232, 185, 92, 0.10);
}
.primary-card.primary-weight-2 .primary-eyebrow { color: var(--warm-light); }
.primary-card.primary-weight-3 .primary-eyebrow { color: var(--gold); }
.primary-card.primary-weight-3 .primary-title   { font-size: 22px; }  /* +2px från default 20 */
```

### Eyebrow-crit-tag

```tsx
{ctx.criticality !== 'open' && (
  <span className="primary-crit-tag">
    {ctx.criticality === 'decisive' ? 'Avgörande' : 'Matchpuck'}
  </span>
)}
```

```css
.primary-crit-tag {
  margin-left: 6px;
  font-family: var(--font-body);
  font-size: 8px;
  letter-spacing: 1.5px;
  padding: 1px 5px;
  border-radius: 2px;
  background: rgba(140, 110, 58, 0.18);
  border: 1px solid rgba(140, 110, 58, 0.45);
  color: var(--warm-light);
}
.primary-card.primary-weight-3 .primary-crit-tag {
  background: rgba(232, 185, 92, 0.16);
  border-color: rgba(232, 185, 92, 0.55);
  color: var(--gold);
}
```

### Serie-tracker decisive-dot

`NextMatchPrimary` (eller en delad `<SeriesTracker>`-komponent) får ett state för "next" som skiftar:

```css
.series-game.next.decisive {
  width: 22px; height: 22px;
  background: rgba(140, 110, 58, 0.20);
  border-color: var(--warm);
  color: var(--warm-light);
  box-shadow: 0 0 6px rgba(140, 110, 58, 0.3);
}
.series-game.next.gold {
  width: 22px; height: 22px;
  background: rgba(232, 185, 92, 0.22);
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 8px rgba(232, 185, 92, 0.35);
}
```

Logik:
- `next.decisive` när `ctx.criticality === 'decisive'` och `ctx.round !== Final`
- `next.gold` när `ctx.round === Final` och `ctx.criticality !== 'open'`

---

## 4 · NY CTA-VARIANT — gold

I `stalvallen-portal.css` (eller global.css):

```css
.btn.btn-primary.btn-cta.btn-gold {
  background: linear-gradient(180deg, var(--gold) 0%, var(--gold-deep, #B88838) 100%);
  color: var(--bg-portal);
  box-shadow: var(--shadow-gold, 0 3px 12px rgba(232, 185, 92, 0.32));
}
```

Behövs ev. nytt token `--gold-deep: #B88838` + `--shadow-gold: 0 3px 12px rgba(232,185,92,0.32)` i `colors_and_type.css`. Bekräfta innan tillägg.

### Var aktiveras CTA-gold?
I `PortalScreen.tsx` när CTA renderas, lägg till klass om `ctx?.round === PlayoffRound.Final`:

```tsx
const isFinal = getPlayoffSeriesContext(game)?.round === PlayoffRound.Final
<button
  className={`btn btn-primary btn-cta${canClickAdvance ? ' btn-pulse' : ''}${isFinal ? ' btn-gold' : ''}`}
  …
>
```

**Endast SM-Final.** Inte semifinal, inte kvartsfinal. Guldet är hela appens enda gold-CTA — sprid inte.

---

## 5 · Tester

### `playoffSeriesContext.test.ts`
- KF G1 (0–0): weight=1, criticality='open', nextGame=1
- KF G3 (1–1): weight=2 (1+1), criticality='matchpuck'
- KF G5 (2–2): weight=2 (kapas, KF får inte gold), criticality='decisive'
- SF G3 (1–1): weight=3 → kapas till 2, criticality='matchpuck'
- SM-Final G1 (0–0): weight=3 (3+0), criticality='open'
- SM-Final G5 (2–2): weight=3, criticality='decisive'
- Spelare ej i någon aktiv serie: returnerar `null`

### `PortalRoundMark.test.tsx`
- Renderas inte när `playoffBracket` saknas
- Renderar "Kvartsfinal" utan crit när criticality='open'
- Renderar "SM-Final · Avgörande" med `.gold`-klass när final + decisive
- Crit-tag matchar criticality

### `PortalScreen.integration.test.tsx`
- CTA har `btn-gold` när spelare är i SM-Final, inte annars

---

## 6 · Open till Opus / Jacob

1. **Copy för crit-tag.** "Avgörande" (G5 i 2–2) och "Matchpuck" (G3+ med en parts möjlighet att stänga) — låsta? Eller fler varianter behövs (t.ex. "Måste vinna" när bara spelaren har förlustpress)?
2. **RoundMark visningsregel.** Förslag: alla playoff-Portal. Alternativ: bara från och med Semifinal. Min läsning: visa tidigt → ger gold-skiftet i SM-Final mer vikt.
3. **CTA-gold playtest.** För dramatisk? Precis lagom? Det är det enda stället i hela appen där CTA-färgen skiftar — Jacob får säga till efter playtest.
4. **Spectator-final** (eliminerad spelare ser SM-Final som åskådare). RoundMark + weight-3 fortfarande? Min instinkt: behåll — guldet handlar om turneringen, inte om vem som vinner. Spelarens lugnare ton hanteras i situations-card/PortalBeat-copy, inte i Primary-zonen.
5. **Token-tillägg.** `--gold-deep` och `--shadow-gold` behöver läggas i `colors_and_type.css` om R3+ wire:as. Confirma.

---

## 7 · Acceptanskriterier

- [ ] `PortalRoundMark` syns endast i playoff. Inte i seriespel/endgame.
- [ ] RoundMark får `.gold` när och endast när SM-Final.
- [ ] Primary får rätt `weight`-klass per `getPlayoffSeriesContext()`.
- [ ] Crit-tag på Primary visas när criticality ≠ 'open'.
- [ ] Serie-tracker `next`-rutan får decisive/gold-state korrekt.
- [ ] CTA är gold endast i SM-Final.
- [ ] Sekundärer (BoardObjectives, OpponentForm, etc.) ser *identiskt* ut i KF G1 och SM-Final G5. Q3 står fast.
- [ ] Saves från före R3+ laddar utan crash. `getPlayoffSeriesContext` returnerar `null` för icke-playoff state.
- [ ] Inga hex-värden i Primary/RoundMark TSX-filer. Alla färger via `var(--*)`.

---

## 8 · Estimerat scope

| Fil | Δ rader |
|---|---|
| `PortalRoundMark.tsx` (ny) | ~35 |
| `playoffSeriesContext.ts` (ny helper) | ~55 |
| `NextMatchPrimary.tsx` / `SMFinalPrimary.tsx` (weight-prop + crit-tag) | ~25 |
| CSS-klasser (`.portal-roundmark`, `.primary-weight-*`, `.primary-crit-tag`, `.series-game.next.decisive/.gold`, `.btn-gold`) | ~50 |
| `PortalScreen.tsx` (insert + gold-CTA-logik) | ~10 |
| `colors_and_type.css` (`--gold-deep`, `--shadow-gold`) | ~3 |
| Tester | ~80 |
| **Totalt R3+** | **~258 rader** |

---

— Design-Claude, 2026-05-16
