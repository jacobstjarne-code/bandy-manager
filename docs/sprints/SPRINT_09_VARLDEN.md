# SPRINT 09 — VÄRLDENS KÄNSLA

**Berör ID:** WEAK-019, DREAM-005, NARR-002, DREAM-007, DREAM-004, DREAM-012  
**Kostnad:** ~2 sessioner  
**Typ:** Feature (atmosfär)  
**Mockup:** `docs/mockups/sprint09_bortamatch.html`

---

## SYFTE

Idag känns världen inte. Bortamatcher är matt (bara "bortaplan"), ishallen växlar inte med årstid, skadelistan är datum. Bandy är bussen till Söderhamn, oktobervärmen som smälter isen, morfar som kommer med efterrätt. Denna sprint bygger in det i UI utan att omdefiniera spelets mekanik.

---

## ID 1: WEAK-019 + DREAM-005 — Bortamatchens scen

**Plats:** `DashboardScreen.tsx` (nytt kort), `src/domain/services/awayTripService.ts` (ny), `SaveGame.ts` (ny fält)

### Datamodell

```typescript
// i SaveGame
awayTrip?: {
  fixtureId: string
  hotel: 'pensionat' | 'mellanklass' | 'nice'  // default: pensionat
  extraMeal: boolean       // mattstöd från föreningen
  weatherWarning?: string  // "Snöoväder — 2h extra restid"
  mikrobeslut: 'stay_home' | 'book_nice' | 'ask_foundation' | null
}
```

### Trigger

I roundProcessor, innan matchsimulering: om managed match är borta → generera `awayTrip` i SaveGame.

```typescript
function generateAwayTrip(fixture: Fixture, matchWeather: MatchWeather): AwayTrip {
  const isHeavyWeather = matchWeather.condition === 'HeavySnow' || matchWeather.temp < -15
  return {
    fixtureId: fixture.id,
    hotel: 'pensionat',
    extraMeal: false,
    weatherWarning: isHeavyWeather ? 'Snöoväder prognostiserat — 2h extra restid' : undefined,
    mikrobeslut: null,
  }
}
```

### UI-kort på Dashboard

Nytt kort som visas när `game.awayTrip` finns och nästa match är borta:

```tsx
{game.awayTrip && nextFixture && !isHome && (
  <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
    <p style={LABEL}>🚌 BORTARESA — {opponent.name}</p>
    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
      Bussen avgår fredag 14:00. Övernattning på {HOTEL_NAMES[awayTrip.hotel]}.
      {awayTrip.weatherWarning && ` ${awayTrip.weatherWarning}.`}
    </p>
    {awayTrip.mikrobeslut === null && (
      <div style={{ marginTop: 6 }}>
        <button onClick={() => resolveAwayTrip('book_nice')}>
          Bättre hotell — 8k kr (+2 morale)
        </button>
        <button onClick={() => resolveAwayTrip('ask_foundation')}>
          Fråga föreningen om mattstöd (-relation, +0 kostnad)
        </button>
        <button onClick={() => resolveAwayTrip('stay_home')}>
          Åk samma kväll (-3 fitness)
        </button>
      </div>
    )}
    {awayTrip.mikrobeslut !== null && (
      <p style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--text-muted)' }}>
        {RESOLVED_TEXTS[awayTrip.mikrobeslut]}
      </p>
    )}
  </div>
)}
```

### Effekter

- `book_nice`: -8000 kr, +2 morale till alla startelvan
- `ask_foundation`: community standing -2 (förening tycker man ska klara sig själv), 0 kr
- `stay_home`: -3 fitness till alla startelvan (trötta efter sen avresa)

### Mockup

Se `docs/mockups/sprint09_bortamatch.html`.

---

## ID 2: NARR-002 + DREAM-007 — Ishallens årstider

**Plats:** `DashboardScreen.tsx`, `src/index.css` (custom properties per månad)

### Koncept

Dashboard-bakgrunden skiftar subtilt baserat på `game.currentDate`:

```
Oktober   → dimmig grå ("höst-grey")
November  → mörkare grå + nyans av blå ("förvinter")
December  → snö-vit med varm inre glöd ("jul")
Januari   → kalljusblå ("djupvinter")
Februari  → neutral vit-grå ("vintersol")
Mars      → gryningsrosa ("vårbud")
April     → ljusgrön ("säsongsslut")
```

### Implementation

I `DashboardScreen.tsx`:

```tsx
function getSeasonalBackground(date: Date): string {
  const month = date.getMonth() + 1  // 1-12
  switch (month) {
    case 10: return 'var(--bg-october)'
    case 11: return 'var(--bg-november)'
    case 12: return 'var(--bg-december)'
    case 1:  return 'var(--bg-january)'
    case 2:  return 'var(--bg-february)'
    case 3:  return 'var(--bg-march)'
    case 4:  return 'var(--bg-april)'
    default: return 'var(--bg)'
  }
}

// i JSX:
<div style={{ background: getSeasonalBackground(new Date(game.currentDate)) }}>
  {/* hela dashboard */}
</div>
```

### CSS-variabler

I `src/index.css` (eller design-systemet):

```css
:root {
  --bg: #F5F1EB;
  
  /* Seasonal backgrounds — subtle shifts from base */
  --bg-october:  linear-gradient(180deg, #E8E4DC 0%, #F5F1EB 100%);
  --bg-november: linear-gradient(180deg, #D8D4CC 0%, #E8E4DC 100%);
  --bg-december: linear-gradient(180deg, #F0ECE4 0%, #E8DCCC 100%);  /* varm julglöd */
  --bg-january:  linear-gradient(180deg, #D0D4D8 0%, #E0E4E8 100%);  /* kallblå */
  --bg-february: linear-gradient(180deg, #E8E4DC 0%, #F0ECE4 100%);
  --bg-march:    linear-gradient(180deg, #F0E0DC 0%, #F5F1EB 100%);  /* gryningsrosa */
  --bg-april:    linear-gradient(180deg, #E8F0E4 0%, #F0F5EC 100%);  /* ljusgrön */
}
```

**Kritiskt:** SUBTLE. Det ska inte vara dramatiskt. Ska bara kännas *rätt* att det är november.

---

## ID 3: DREAM-004 — Årsrytm med faktiska spelmässiga variationer

**Plats:** `matchCore.ts`, `weatherService.ts`, `economyService.ts`

### Koncept

Idag har `SEASON_MOOD` bara textvariation. Nu läggs faktiska mekaniska skillnader in baserat på månad:

### A. Is-hårdhet påverkar matchtempo

I `matchCore.ts`, i step-loopen där `stepGoalMod` beräknas — läs `game.currentDate` (eller fixtur-datum):

```typescript
function getIceHardnessMod(date: Date): number {
  const month = date.getMonth() + 1
  if (month === 1) return 1.05   // januari = snabbaste isen
  if (month === 2) return 1.03
  if (month === 12) return 1.0
  if (month === 11) return 0.98
  if (month === 10) return 0.95  // oktober = mjuk is
  if (month === 3) return 0.97   // mars = smältande
  return 1.0
}

// I stepGoalMod:
stepGoalMod *= getIceHardnessMod(new Date(fixture.date))
```

### B. Publikrekord i december

I `calcAttendance`:

```typescript
const month = new Date(date).getMonth() + 1
const christmasBonus = (month === 12) ? 1.15 : 1.0
// ...
const base = Math.round(expandedCapacity * attendanceRate * eventBonus * derbyBonus * annandagenBonus * christmasBonus)
```

### C. Transferfönster-oro (januari)

Under januari: dagbokstexter refererar transferfönstret. Kafferumscitat om "vem som snackas bort". Subtila, inte mekaniska.

Lägg till i `SEASON_MOOD`:
```typescript
January: {
  dashboardMood: "Transferfönstret. Alla har någon agent som ringt.",
  coffeeRoomHint: "Lundkvist har blivit sedd i Stockholm. Bara en observation.",
}
```

---

## ID 4: DREAM-012 — Skadelista som medmänsklighet

**Plats:** `src/domain/services/injuryService.ts` (existerande), `src/domain/data/injuryStories.ts` (ny)

### Koncept

När spelare skadas: inte bara "3 omgångar". Ett mikro-narrativ. Datum blir människa.

### Datamodell

```typescript
// Utvidga injury-event i SaveGame
export interface InjuryNarrative {
  playerId: string
  injuryType: 'knä' | 'axel' | 'vrist' | 'huvud' | 'rygg' | 'hamstring'
  severity: 'minor' | 'moderate' | 'severe'
  narrative: string     // "Morfar kommer med efterrätt på fredagarna."
  familyContext?: string  // genererad en gång, persisterar
}
```

### Story-pool

I `injuryStories.ts`:

```typescript
export const FAMILY_CONTEXTS = [
  'Morfar kommer med efterrätt på fredagarna.',
  'Sambon har jobb i Gävle — åker hem på helgerna.',
  'Äldsta sonen tävlingscyklar — planen var att titta på när han vinner JSM.',
  'Flickvännen har precis börjat på KI. Långdistansrelation som bara blev längre.',
  'Morsan har flyttat tillbaka till orten efter skilsmässan. Sover hos henne under rehab.',
  'Barnen är 4 och 2. Det blir mycket tid på soffan nu.',
  'Föräldrarna är båda sjukpensionärer. De lagar lunch till honom varje dag.',
  'Pappan, som själv spelade i A-laget på 80-talet, är på plats på varenda fysio.',
  'Systern är fysioterapeut. Sköter honom på hemmaplan.',
]

export const INJURY_CONTEXTS: Record<string, string[]> = {
  knä: [
    'Tog smällen sent i onsdagens träning. Ortopeden säger ledbandet är stukat men hel.',
    'Vred till knäet under en långsam pass. Ibland är det små rörelser som tar längst tid.',
    'Kraschade i en hörnsituation mot {opponent}. MR:n visade ödem men inget allvarligt.',
  ],
  axel: [
    'Tacklad mot sargen. Axeln gick ur led men sitter på plats efter sjukhusbesöket.',
    'Klarade av matchen men kunde inte lyfta armen dagen efter. Röntgen nästa vecka.',
    'Föll olyckligt i mittzonen. Rotatorkuffen är drabbad — långdrager.',
  ],
  // ... etc
}
```

### Generering vid skada

```typescript
export function generateInjuryNarrative(
  player: Player,
  injuryType: string,
  opponent: string,
  rand: () => number,
): InjuryNarrative {
  const contexts = INJURY_CONTEXTS[injuryType] ?? INJURY_CONTEXTS.knä
  const context = contexts[Math.floor(rand() * contexts.length)]
    .replace('{opponent}', opponent)
  
  // Familj-kontext är persistent per spelare — generas en gång, lagras på Player
  const family = player.familyContext ?? FAMILY_CONTEXTS[Math.floor(rand() * FAMILY_CONTEXTS.length)]
  
  return {
    playerId: player.id,
    injuryType,
    severity: 'moderate',
    narrative: `${context} Han är i fysioterapi tre gånger i veckan. ${family}`,
    familyContext: family,
  }
}
```

### UI — skadekort

I `PlayerCard.tsx`, om spelaren är skadad, visa narrative istället för bara "3 omg kvar":

```tsx
{player.isInjured && player.injuryNarrative && (
  <div style={{ padding: '8px 10px', background: 'rgba(176,80,64,0.08)', borderLeft: '3px solid var(--danger)', marginBottom: 8 }}>
    <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--danger)', marginBottom: 4 }}>
      🏥 SKADAD — {player.injuryDaysRemaining} dagar kvar
    </p>
    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
      {player.injuryNarrative.narrative}
    </p>
  </div>
)}
```

---

## ORDNING

1. NARR-002 ishallens årstider (~1h, CSS + en funktion)
2. WEAK-019/DREAM-005 bortamatch (~3h, ny komponent + service)
3. DREAM-004 årsrytm mekanik (~2h, tre platser)
4. DREAM-012 skadelista som medmänsklighet (~3h)

**Verifiering per ID:**
- NARR-002: Sätt `currentDate` manuellt i DevTools till 2026-01-15 → dashboard har kalljusblå ton. Till 2025-12-20 → varm ton.
- WEAK-019: Borta-match → bortatrip-kort visas → val fattas → effekt syns (kontroll av morale/fitness på startelvan)
- DREAM-004: Spela januari-match → snittmål ska vara marginellt högre än oktober-match (kör 10 av varje och jämför)
- DREAM-012: Skada en spelare → PlayerCard visar narrativ text, inte bara "3 omg"

## SLUTRAPPORT

```
NARR-002: ✅/⚠️/❌ – kort mening
WEAK-019: ✅/⚠️/❌ – kort mening
DREAM-005: ✅/⚠️/❌ – kort mening  (överlappar WEAK-019)
DREAM-004: ✅/⚠️/❌ – kort mening
DREAM-012: ✅/⚠️/❌ – kort mening
DREAM-007: ✅/⚠️/❌ – kort mening  (= NARR-002)
```
