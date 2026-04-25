# SPRINT 23 — Taktiktavlan Del B (UX-omarbetning)

**Datum:** 2026-04-20
**Trigger:** Sprint 22.14 Del A klar. Jacobs svar på B1–B4: c, c, c, b.
**Scope:** FormationView.tsx + ChemistryView.tsx + TacticBoardCard.tsx + Formation.ts

---

## ⚠️ LÄS FÖRST — OVERRIDES SEDAN SPECEN SKREVS

Denna spec skrevs innan tacticModifiers.ts granskades och innan färdiga texter kurerades. Följande överrider specen nedan:

### 1. FORMATION_META-texter — använd TEXT_REVIEW, INTE specen nedan

Placeholder-texterna i specens DEL 2 (`+ FÖRSVAR`, `+ HÖRNOR` etc.) är **lögn** — formation påverkar inte matchmotorn. `tacticModifiers.ts` styrs av mentality/tempo/press/passingRisk/width/attackingFocus/cornerStrategy/penaltyKillStyle. Formation är kosmetisk + position-matching.

**Använd istället:** `docs/textgranskning/TEXT_REVIEW_formations_2026-04-20.md`

Den filen innehåller:
- Färdigt `FORMATION_META`-kod-block (kopiera exakt, CLAUDE.md regel "KOPIERA BOKSTAVLIGT")
- Tags som reflekterar anatomi (`4 FORWARDS`, `KRÄVER LIBERO`) i stället för påhittade match-effekter
- Coach-quotes på bandy-svenska (subjektiva observationer, inte mekaniska påståenden)

### 2. B1c Coach-rekommendation — två tillägg

- **Ingen tyst flytt.** `recommended === f && formation !== f` ger grön outline — men den rekommendationen ska inte börja peka på annan formation när spelaren redan manuellt valt. Implementation: om `game.lineupConfirmedThisRound` är true, frys rekommendationen till vad den var vid confirm-tidpunkten. Alternativt: cacha rekommendationen per match i `SaveGame` och uppdatera den bara vid squad-förändringar (nyvärvning, skada, säsongsskifte), inte vid varje render.
- **Inbox-notis vid rekommendationsändring.** När `getRecommendedFormation(players)` ger annat svar än föregående omgång — skicka inbox-item: *"Truppen har förändrats. Coachen rekommenderar nu {formation} istället för {föregående}."* Spelaren behöver inte öppna taktiktavlan för att märka det. Implementation: lagra `previousRecommendedFormation` i SaveGame, jämför i `roundProcessor.ts`, pusha inbox-item vid ändring. 

### 3. B3c "ändras i lineup" — klickbar länk

Specen har texten som statisk. Ska vara `<button onClick={...}>` eller `<Link>` som navigerar till lineup-steget (`/game/squad` med `state: { tab: 'lineup' }` eller motsvarande, kolla vilken route som faktiskt leder till lineup-redigering). Styling: samma storlek som texten runtomkring, men `color: var(--accent)` och underline på hover för att signalera klickbarhet.

### 4. B4b kemi-expand — använd TEXT_REVIEW-branches

Specens `getPairSuggestion` är en rimlig start men har bara 3 branches. **Använd istället branches från TEXT_REVIEW** (samma fil som ovan) — där finns 6 branches inklusive:
- Nyvärvad spelare (<5 matcher i klubben) — överskrider andra branches
- Svag kemi visas **bara vid röd streckad** (inte neutral)
- Tre text-mallar per branch, välj slumpmässigt
- Returnera `null` när inget konkret förslag finns — visa inte expand-block alls

**Texterna ska kopieras exakt** från TEXT_REVIEW, inte omformuleras.

---

## SAMMANFATTNING AV VAL

| Fråga | Val | Vad det innebär |
|---|---|---|
| B1 | c | Coach rekommenderar en formation baserat på truppen |
| B2 | c | Båda: mini-tags + coach-quote uppdateras vid formation-byte |
| B3 | c | Kompakt taktik-översikt överst (Mentalitet · Tempo · Press), länk till lineup |
| B4 | b | Kemin interaktiv: klicka på ett par → personaliserat formations-förslag |

---

## DEL 1 — B1c: Coach-rekommendation (Formation.ts + FormationView.tsx)

### Ny funktion i `src/domain/entities/Formation.ts`

Lägg till efter `autoAssignFormation`:

```typescript
// ── Coach recommendation ────────────────────────────────────────────────────
// Scores each formation by how many available players match required positions.
// Returns the formation type with the highest score.
export function getRecommendedFormation(players: Player[]): FormationType {
  const available = players.filter(p => !p.isInjured && p.suspensionGamesRemaining === 0)
  const countByPos: Record<string, number> = {}
  for (const p of available) {
    countByPos[p.position] = (countByPos[p.position] ?? 0) + 1
  }

  let best: FormationType = '4-3-3'
  let bestScore = -1
  for (const [fType, template] of Object.entries(FORMATIONS) as [FormationType, FormationTemplate][]) {
    const required: Record<string, number> = {}
    for (const slot of template.slots) {
      required[slot.position] = (required[slot.position] ?? 0) + 1
    }
    let score = 0
    for (const [pos, need] of Object.entries(required)) {
      score += Math.min(need, countByPos[pos] ?? 0)
    }
    if (score > bestScore) {
      bestScore = score
      best = fType
    }
  }
  return best
}
```

### Ändringar i `src/presentation/components/tactic/FormationView.tsx`

**1. Import `getRecommendedFormation`:**
```typescript
import { FORMATIONS, autoAssignFormation, getRecommendedFormation } from '../../../domain/entities/Formation'
```

**2. Beräkna rekommendation i komponentkroppen** (efter `const lineupSlots = ...`):
```typescript
const recommended = getRecommendedFormation(players)
```

**3. Ändra formation-knapparna** — lägg till en "COACH ★"-badge under rekommenderad formation:

Befintlig knapp-render (rad ~87–103):
```tsx
{FORMATION_OPTIONS.map(f => (
  <button
    key={f}
    onClick={() => changeFormation(f)}
    style={{ ... }}
  >
    {f}
  </button>
))}
```

Ersätt med:
```tsx
{FORMATION_OPTIONS.map(f => (
  <div key={f} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
    <button
      onClick={() => changeFormation(f)}
      style={{
        padding: '5px 8px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 4,
        border: formation === f ? 'none' : '1px solid var(--accent)',
        background: formation === f ? 'var(--accent)' : 'transparent',
        color: formation === f ? '#fff' : 'var(--accent)',
        cursor: 'pointer',
        flexShrink: 0,
        outline: recommended === f && formation !== f ? '1px solid var(--success)' : 'none',
        outlineOffset: 1,
      }}
    >
      {f}
    </button>
    {recommended === f && (
      <span style={{ fontSize: 8, color: 'var(--success)', fontWeight: 700, letterSpacing: '0.5px' }}>
        ★ COACH
      </span>
    )}
  </div>
))}
```

---

## DEL 2 — B2c: Mini-tags + coach-quote (FormationView.tsx)

### Ny konstant i `FormationView.tsx` (direkt under imports, före `FORMATION_OPTIONS`):

```typescript
const FORMATION_META: Record<FormationType, { tags: [string, string]; quote: string }> = {
  '5-3-2': {
    tags: ['+ FÖRSVAR', '– TEMPO'],
    quote: 'Med 5-3-2 är vi svåra att slå — men vi sätter press på offensiven att avgöra.',
  },
  '3-3-4': {
    tags: ['+ HÖRNOR', '+ SKOTTCHANSER'],
    quote: 'Klassisk bandyformation. Fyra framåt skapar kaos i straffområdet.',
  },
  '4-3-3': {
    tags: ['+ STABILITET', '– BREDD'],
    quote: 'Fyra backar ger oss stabilitet. Vi är svårslagna när vi spelar kompakt.',
  },
  '3-4-3': {
    tags: ['+ BOLLINNEHAV', '– DJUPFÖRSVAR'],
    quote: 'Starka halvar innebär att vi vinner mittfältet — men bak kan det bli glest.',
  },
  '2-3-2-3': {
    tags: ['+ ANFALL', '– DEFENSIV'],
    quote: 'Riskabelt men roligt — vi attackerar i vågor, men tål inte misstag bakåt.',
  },
  '4-2-4': {
    tags: ['+ TRYCK', '– SÄKERHET'],
    quote: 'Ultra-offensiv. Maximalt tryck framåt, men vi lever farligt om vi förlorar bollen.',
  },
}
```

### Lägg till tags + coach-quote i FormationView render

Direkt **efter** formations-knapp-raden (efter den avslutande `</div>`) och **före** Pitch SVG-blocket:

```tsx
{/* Formation meta: tags + coach quote */}
{(() => {
  const meta = FORMATION_META[formation]
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {meta.tags.map(tag => (
          <span key={tag} style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
            background: tag.startsWith('+') ? 'rgba(90,154,74,0.15)' : 'rgba(176,80,64,0.15)',
            color: tag.startsWith('+') ? 'var(--success)' : 'var(--danger)',
            letterSpacing: '0.5px',
          }}>
            {tag}
          </span>
        ))}
      </div>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic',
        color: 'var(--text-secondary)', lineHeight: 1.4,
      }}>
        "{meta.quote}"
      </p>
    </div>
  )
})()}
```

---

## DEL 3 — B3c: Taktik-översikt överst (FormationView.tsx)

### Ny prop: `tactic` exponeras redan via `FormationViewProps` — **ingen prop-ändring krävs**, `tactic` finns redan.

### Ny konstant i FormationView.tsx (efter FORMATION_META):

```typescript
const MENTALITY_LABELS: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Balanserad', offensive: 'Offensiv',
}
const TEMPO_LABELS: Record<string, string> = {
  low: 'Lågt', normal: 'Normal', high: 'Högt',
}
const PRESS_LABELS: Record<string, string> = {
  low: 'Lågt', medium: 'Medel', high: 'Högt',
}
```

### Lägg till översikts-rad allra överst i FormationView render (före formations-knapp-raden):

```tsx
{/* B3c: Tactic overview */}
<div style={{
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '6px 8px', borderRadius: 4,
  background: 'var(--bg-elevated)', border: '0.5px solid var(--border)',
  marginBottom: 10, flexWrap: 'wrap',
}}>
  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
    {MENTALITY_LABELS[tactic.mentality] ?? tactic.mentality}
  </span>
  <span style={{ fontSize: 9, color: 'var(--border)' }}>·</span>
  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
    Tempo: {TEMPO_LABELS[tactic.tempo] ?? tactic.tempo}
  </span>
  <span style={{ fontSize: 9, color: 'var(--border)' }}>·</span>
  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
    Press: {PRESS_LABELS[tactic.press] ?? tactic.press}
  </span>
  <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>
    ändras i lineup
  </span>
</div>
```

---

## DEL 4 — B4b: Interaktiv kemi (ChemistryView.tsx + TacticBoardCard.tsx)

### Konceptet
Klick på ett par-rad expanderar en personaliserad suggestion. Suggestions beräknas utifrån spelarnas nuvarande slot-position (x-koordinat → "sida"). Ingen automatisk swap — texten är handling nog.

### Ny prop i `ChemistryView.tsx`:

```typescript
interface ChemistryViewProps {
  tactic: Tactic
  players: Player[]
  chemistryStats: Record<string, number>
}
```

**Ingen ny prop behövs** — suggestions är ren display utan callbacks.

### Lägg till state i ChemistryView:

```typescript
import { useState } from 'react'
// ... befintliga imports

export function ChemistryView({ tactic, players, chemistryStats }: ChemistryViewProps) {
  const [expandedPair, setExpandedPair] = useState<string | null>(null)
  // ... befintlig kod
```

### Ny hjälpfunktion i ChemistryView (i komponentkroppen, efter `topPairs`):

```typescript
function getPairSuggestion(pair: { playerId1: string; playerId2: string; strength: number }): string {
  const s1 = playerToSlot.get(pair.playerId1)
  const s2 = playerToSlot.get(pair.playerId2)
  const p1 = players.find(p => p.id === pair.playerId1)
  const p2 = players.find(p => p.id === pair.playerId2)
  if (!p1 || !p2) return ''

  if (pair.strength > 0.4) {
    if (s1 && s2 && Math.abs(s1.x - s2.x) > 35) {
      const side = s1.x < 50 ? 'vänster sida' : 'höger sida'
      return `Stark koppling — försök samla ${p1.lastName} och ${p2.lastName} på ${side} för att utnyttja kemin.`
    }
    return `Stark koppling — ${p1.lastName} och ${p2.lastName} är redan välpositionerade ihop.`
  }

  if (pair.strength < -0.2) {
    return `Svag koppling — undvik direktpass mellan ${p1.lastName} och ${p2.lastName}. Spela via en tredje spelare.`
  }

  return ''
}
```

### Ändra topp-par-render (rad ~99–115)

Ersätt befintligt `chemistry.filter(c => c.strength > 0.4)...map(pair => ...)` med:

```tsx
{chemistry.filter(c => Math.abs(c.strength) >= 0.25).sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength)).slice(0, 4).map(pair => {
  const p1 = players.find(p => p.id === pair.playerId1)
  const p2 = players.find(p => p.id === pair.playerId2)
  if (!p1 || !p2) return null
  const pairKey = `${pair.playerId1}-${pair.playerId2}`
  const isExpanded = expandedPair === pairKey
  const suggestion = isExpanded ? getPairSuggestion(pair) : ''
  const isPositive = pair.strength > 0

  return (
    <div key={pairKey}>
      <div
        onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
        style={{
          padding: '6px 10px', fontSize: 11, borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          background: isExpanded ? 'var(--bg-elevated)' : 'transparent',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {p1.lastName} × {p2.lastName}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          {pair.reasons.join(' · ')}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 9, fontWeight: 700,
          color: isPositive ? 'var(--success)' : 'var(--danger)',
        }}>
          {isPositive ? '↑' : '↓'}
        </span>
      </div>
      {isExpanded && suggestion && (
        <div style={{
          padding: '6px 10px 8px', fontSize: 10, fontStyle: 'italic',
          color: 'var(--text-secondary)', background: 'var(--bg-elevated)',
          borderBottom: '0.5px solid var(--border)', lineHeight: 1.5,
        }}>
          {suggestion}
        </div>
      )}
    </div>
  )
})}
```

---

## LEVERANSORDNING

1. **Formation.ts** — `getRecommendedFormation` (lägg till funktion, import `Player` om den saknas)
2. **FormationView.tsx** — B1c + B2c + B3c i ett svep (3 tillägg till samma fil)
3. **ChemistryView.tsx** — B4b (`useState` import + `expandedPair` state + `getPairSuggestion` + ny pair-render)
4. **npm run build && npm test**
5. **Commit + push**

**Ingen ändring i TacticBoardCard.tsx** — inga nya props behövs.

---

## VERIFIERING (del av audit)

```bash
# Inga hårdkodade färger
grep -rn '#[0-9a-fA-F]\{3,8\}' src/presentation/components/tactic/ --include="*.tsx"
# Ska returnera 0 relevanta (exkludera rgba())
```

UI-checklist:
- [ ] Formations-knappar: rekommenderad har grön outline + "★ COACH" under
- [ ] Aktiv formation har ingen outline (bara accent-bakgrund)
- [ ] Tags och coach-quote uppdateras vid formation-byte
- [ ] Taktik-overview-rad visar aktuella enum-värden på svenska
- [ ] Kemi-par: klick expanderar, klick igen kollapsar
- [ ] Suggestion-text är personaliserad (spelarnamn + sidoanalys)
- [ ] Inga par utan suggestion-text (fallback-sträng täcker alla fall)

---

## FILER SOM ÄNDRAS

| Fil | Ändring | Typ |
|---|---|---|
| `src/domain/entities/Formation.ts` | Ny funktion `getRecommendedFormation` | Nytt domänlogik |
| `src/presentation/components/tactic/FormationView.tsx` | B1c + B2c + B3c | UI-tillägg |
| `src/presentation/components/tactic/ChemistryView.tsx` | B4b interaktiva par | UI-tillägg |

**TacticBoardCard.tsx: inga ändringar.**
