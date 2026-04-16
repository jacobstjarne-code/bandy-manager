# FIXSPEC — Lista/Plan harmonisering (DEFINITIV)

## Princip
**PitchLineupView (Plan-tabben) är mall.** LineupFormationView (Lista) 
och LineupStep ska anpassas till Plan, inte tvärtom.

---

## FIX 1: Flikar sticker ut utanför kortkanten

### Problem
Tab-baren (📋 LISTA / 🏒 PLAN) är bredare än korten under den.
Den har ingen marginal och `margin: 0 0 12px` men card-stack
har `padding: 0 12px`.

### Fil: `LineupStep.tsx`

Byt tab-barens wrapper:
```tsx
// FÖRE
<div style={{
  display: 'flex',
  background: 'var(--bg-surface)',
  borderBottom: '1px solid var(--border)',
  margin: '0 0 12px',
}}>

// EFTER  
<div style={{
  display: 'flex',
  margin: '0 0 12px',
}}>
```

Flytta bakgrund + border till varje knapp istället, så att 
tab-baren tar sin bredd från parent-containerns padding.

---

## FIX 2: LineupFormationView ska matcha PitchLineupView visuellt

### Skillnader att fixa

| Egenskap | Plan (mall) | Lista (nu) | Fix |
|----------|-------------|------------|-----|
| Cirklar | HTML div, 32×32px, position:absolute | SVG circle, r=16 | Byt till HTML overlay |
| Position-label | fontSize 8, ovanför cirkel | fontSize 6, SVG text | fontSize 8, HTML span |
| Namntext | Ingen (legend under plan) | fontSize 4.5, under cirkel | Ta bort |
| Tom cirkel | 1.5px dashed rgba(0.3) | Ingen (visas ej) | Visa med dashed |
| Nummer i cirkel | fontSize 10, fontWeight 800 | fontSize 10, fontWeight 700 | fontWeight 800 |

### Lösning

**Byt LineupFormationView från SVG-baserad till HTML-overlay** 
(samma teknik som PitchLineupView). Kopiera EXAKT Plans 
circle-rendering:

```tsx
// I LineupFormationView — byt BandyPitch children-approach 
// till position:relative + absolute overlay (som PitchLineupView)

<div style={{ position: 'relative' }}>
  <BandyPitch width="100%" />
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {template.slots.map(slot => {
      // EXAKT samma rendering som PitchLineupView.tsx rad 117-175
      // Kopiera hela slot-div:en med:
      // - width: 44, height: 58
      // - circle: width 32, height 32, borderRadius 50%
      // - position label: fontSize 8, top -5
      // - empty: 1.5px dashed rgba(26,26,24,0.3)
      // - filled: 1.5px solid color-mix(ringColor 55%)
      // - number: fontSize 10, fontWeight 800
    })}
  </div>
</div>
```

**Ta bort SVG-baserad rendering helt** (alla `<g>`, `<circle>`, 
`<text>` element).

**Ta bort** den separata name-text under cirkeln. Namn visas 
i spelarlistan under plangrafiken, inte i planen.

---

## FIX 3: "Generera bästa elvan"-knappen

### Plan (mall):
```tsx
<button className="btn btn-ghost" style={{
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}}>
  ✨ Generera bästa elvan
</button>
```

### Lista (nu):
```tsx
<button style={{
  padding: '8px 16px', fontSize: 13, fontWeight: 700,
  background: 'rgba(196,122,58,0.08)', 
  border: '1.5px solid var(--accent)',
  color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
}}>
  ✨ Generera bästa elvan
</button>
```

### Fix
Byt Lista-knappen till EXAKT samma som Plan:
```tsx
<button onClick={onAutoFill} className="btn btn-ghost" style={{
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}}>
  ✨ Generera bästa elvan
</button>
```

---

## FIX 4: Spelarlistan under formationsvyn (Lista-specifik)

Spelarlistan under formationsvyn i Lista-tabben är OK i 
grunden (vertikal lista med cirkel-nummer). MEN:

- Cirkelstorleken ska matcha: **32×32px** (inte större eller mindre)
- Border: `1.5px solid var(--border)` (ej startande), 
  `2px solid var(--success)` (startande)
- Nummer i cirkeln: fontSize 12, fontWeight 700

---

## Filer som berörs

1. `src/presentation/components/match/LineupStep.tsx` — tab margin
2. `src/presentation/components/match/LineupFormationView.tsx` — 
   OMSKRIVNING: SVG → HTML overlay
3. Ingen ändring i PitchLineupView.tsx (det är mallen)

## Verifiering

1. Öppna matchvyn → Lista-tab → jämför formationsgrafiken med Plan-tab
2. Cirklarna ska vara IDENTISKA i storlek, stil, positionslabels
3. Tab-baren ska INTE sticka ut utanför kortens bredd
4. "Generera bästa elvan" ska se likadan ut i båda
5. npm run build
