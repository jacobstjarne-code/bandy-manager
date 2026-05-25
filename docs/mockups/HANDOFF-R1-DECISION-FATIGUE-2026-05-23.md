# HANDOFF — R1 Decision-fatigue

**Från:** Design-Claude
**Datum:** 2026-05-23
**Till:** Code, Opus (copy), Jacob (playtest)
**Mock:** `docs/mockups/2026-05-23_design_decision_fatigue.html`
**Bygger på:** F1 Beslutsekonomi (queue-rail finns redan)

## 0 · TL;DR

F1 löste kö. R1 löser **tid i kö**. När items åldras visar queue-rail tryckindikator. Vid hot-tillstånd triggas kafferum-fatigue-scen som kräver respons.

## 1 · Datakrav

**GameEvent utökas:**
```typescript
interface GameEvent {
  // … existerande fält
  deferredAt?: number   // matchday när eventet hamnade i deferred
}
```

I `tryQueueDecision`:
```diff
- const newDeferred = [...(game.deferredDecisions ?? []), event]
+ const eventWithAge = { ...event, deferredAt: game.currentMatchday ?? 1 }
+ const newDeferred = [...(game.deferredDecisions ?? []), eventWithAge]
```

## 2 · Helper

```typescript
// src/domain/services/decisionFatigueService.ts
export interface FatigueState {
  count: number
  maxAge: number
  pressure: 'calm' | 'warm' | 'hot'
  meter: number  // 0-100
}

export function getFatigueState(game: SaveGame): FatigueState {
  const deferred = game.deferredDecisions ?? []
  const cur = game.currentMatchday ?? 1
  const count = deferred.length
  const ages = deferred.map(e => cur - (e.deferredAt ?? cur))
  const maxAge = ages.length ? Math.max(...ages) : 0

  let pressure: 'calm' | 'warm' | 'hot' = 'calm'
  if (maxAge >= 5 || count >= 7) pressure = 'hot'
  else if (maxAge >= 3 || count >= 5) pressure = 'warm'

  const meter = Math.min(100, count * 10 + maxAge * 8)
  return { count, maxAge, pressure, meter }
}

export function getItemAge(event: GameEvent, currentMatchday: number): number {
  return event.deferredAt ? currentMatchday - event.deferredAt : 0
}
```

## 3 · UI-ändringar i PortalQueueRail

**Uppdaterad 2026-05-23:** Tryckindikator använder `<Sparkline>` från score-system-spec'en. Visar trend, inte bara nuläge. *Är trycket på väg upp eller ner?* Första R1-implementation av score-system-primitiv.

**Datakrav tillägg:** `game.fatigueHistory: number[]` (rullande senaste 7 omgångars meter-värden). Uppdateras vid varje `advance()`.

```tsx
const fatigue = getFatigueState(game)
const railClass = `portal-queue-rail ${fatigue.pressure === 'warm' ? 'warm-pressure' :
                   fatigue.pressure === 'hot' ? 'hot-pressure' : ''}`

// Per chip:
const age = getItemAge(item, game.currentMatchday ?? 1)
const chipClass = age >= 5 ? 'aged-2' : age >= 3 ? 'aged-1' : ''
// + age-suffix: <span className="qr-chip-age">{age} omg</span>

// Fatigue-meter under chips
<div className="fatigue-bar">
  <div className="fatigue-bar-head">
    <span>Tryck</span>
    <span>{fatigue.pressure === 'calm' ? 'Lugn' : fatigue.pressure === 'warm' ? 'Märkbart' : 'Hög'}</span>
  </div>
  <div className="fatigue-bar-track">
    <div className={`fatigue-bar-fill ${fatigue.pressure === 'warm' ? 'warm' : fatigue.pressure === 'hot' ? 'hot' : ''}`}
         style={{ width: `${fatigue.meter}%` }} />
  </div>
</div>
```

CSS: se mocken. Tre klasser för rail (`warm-pressure`/`hot-pressure`), två för chips (`aged-1`/`aged-2`), tre fill-state.

## 4 · Aged decision-card (aktiv decision som är gammal)

Om en deferred decision promoteras till active **och** total-ålder ≥ 4 omg → dec-card får `aged-1`/`aged-2`-klass + age-tag i eyebrow.

```tsx
const totalAge = getItemAge(event, game.currentMatchday ?? 1)
const cardClass = totalAge >= 5 ? 'aged-2' : totalAge >= 3 ? 'aged-1' : ''
// + i eyebrow: {totalAge >= 3 && <span className="dec-age-tag">{totalAge} omg gammal</span>}
```

## 5 · Fatigue-scene

Ny coffeeRoomService-trigger: när `fatigueState.pressure === 'hot'` i 2 omgångar i rad, ersätt vanlig coffeeRoom-scen med fatigue-version.

```typescript
// I getCoffeeRoomScene(game):
if (game.fatigueHotStreak >= 2) {
  return pickFatigueCoffeeScene(game.coffeeRoomSeed)
}
```

State-tillägg: `game.fatigueHotStreak: number` — räknar consecutive omg med hot pressure. Reset vid något annat än hot.

## Designval LÅSTA av Jacob 2026-05-23

| Q | Beslut | Notering |
|---|---|---|
| Q1 trösklar 3/5 | ✅ Bekräftat | Notering: maxAge eller count räcker (or-logik). Bekräfta om åldern ska väga tyngre. Annars kör. |
| Q2 scen mjuk/hård | ✅ **Mjuk.** Tonal scen, ingen dold relations/moral-träff | Hård version efter trycket är synligt — princip: "mjukt + synligt före hårt + dolt". |
| Q3 Opus copy | ✅ Opus skriver 4 warm + 4 hot | Levereras när R1 byggs. |

## Designval öppna

**Q1 — trösklar:** 3 omg = warm, 5 omg = hot. Bekräfta?

**Q2 — fatigue-scen-konsekvens:** Föreslag **mjuk version** — scenen är bara tonal, ingen moral-träff direkt. Spelaren märker genom narrativ att Sture är trött. Hård version (styrelse-relation -2 om hot 3+ omg) kan läggas senare.

**Q3 — Opus copy:** behöver 4 warm-coffee-rader + 4 hot-coffee-rader. Bandysvenskt understatement.

## 7 · Estimat

| Del | Estimat |
|---|---|
| `deferredAt` + `getFatigueState` + helper | ~45 min |
| Queue-rail UI med tryckindikator | ~45 min |
| Aged dec-card variant | ~30 min |
| Fatigue-scene-trigger + state | ~45 min |
| Opus copy (8 strängar) | externt |
| Tester | ~30 min |
| **Total** | **~3.5h** |

## 8 · Acceptanskriterier

- [ ] Chips visar `N omg`-suffix när age ≥ 1
- [ ] Aged-1 (3-4 omg) chips warm-tonade. Aged-2 (5+) danger.
- [ ] Queue-rail själv warm/hot-tonad enligt fatigueState.pressure
- [ ] Fatigue-meter renderas korrekt (0-100, tre fill-state)
- [ ] Promoterade decisions som är 3+ omg gamla får aged-styling
- [ ] Fatigue-scen triggar efter 2 omg consecutive hot
- [ ] Bandysvensk diction — inga utropstecken, ingen "WARNING"-copy

— Design-Claude, 2026-05-23
