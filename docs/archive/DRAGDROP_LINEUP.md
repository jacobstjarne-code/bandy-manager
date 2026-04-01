# Drag-and-Drop Lineup — Implementation Spec

## Kontext

LineupStep.tsx har redan:
- `LineupFormationView` med SVG-pitch och formationsslots
- Klick-baserad tilldelning (klicka slot → klicka spelare)
- Formations-dropdown (5-3-2, 3-3-4, 4-3-3 etc)
- `autoAssignFormation()` i Formation.ts
- BandyPitch.tsx SVG-komponent

Det som ska läggas till: en alternativ vy med drag-and-drop.

## Vy-toggle

Högst upp i LineupStep (under OpponentAnalysisCard, ovanför formationsvyn), lägg till:

```tsx
const [viewMode, setViewMode] = useState<'list' | 'pitch'>(() => {
  return (localStorage.getItem('bm_lineup_view') as 'list' | 'pitch') ?? 'list'
})

// Spara vid byte
useEffect(() => { localStorage.setItem('bm_lineup_view', viewMode) }, [viewMode])
```

Toggle-knapp — segmented control:
```tsx
<div style={{ display: 'flex', margin: '0 16px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
  <button
    onClick={() => setViewMode('list')}
    style={{
      flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
      background: viewMode === 'list' ? 'rgba(196,122,58,0.15)' : 'transparent',
      color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)',
      borderRight: '1px solid var(--border)',
    }}
  >
    📋 Lista
  </button>
  <button
    onClick={() => setViewMode('pitch')}
    style={{
      flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
      background: viewMode === 'pitch' ? 'rgba(196,122,58,0.15)' : 'transparent',
      color: viewMode === 'pitch' ? 'var(--accent)' : 'var(--text-muted)',
    }}
  >
    ⚽ Planvy
  </button>
</div>
```

Ta bort placeholder-texten "Spelare placeras automatiskt. Manuell placering i framtida version."

## Planvy-komponenten (PitchLineupView.tsx)

Ny fil: `src/presentation/components/match/PitchLineupView.tsx`

### Props
```tsx
interface PitchLineupViewProps {
  tacticState: Tactic
  startingIds: string[]
  benchIds: string[]
  squadPlayers: Player[]
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
}
```

### Layout (vertikal, mobil-first)

```
┌──────────────────────────────────┐
│  ⚙️ Formation  [ 5-3-2 ▼ ]      │
├──────────────────────────────────┤
│                                  │
│  ┌─ BandyPitch ──────────────┐  │
│  │                            │  │
│  │    [VY]        [HY]       │  │  ← Forwards
│  │         [CF]              │  │
│  │                            │  │
│  │  [VH]   [CH]    [HR]     │  │  ← Halves
│  │                            │  │
│  │  [VB]   [CB]    [HB]     │  │  ← Defenders
│  │                            │  │
│  │         [MV]              │  │  ← Goalkeeper
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  BÄNK (oplacerade spelare)       │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ 3 Er │ │ 8 Pe │ │ 11 Ol│    │  ← Draggable pills
│  └──────┘ └──────┘ └──────┘    │
│                                  │
│  ✨ Generera bästa elvan         │
│  ────────────────────────────    │
│  11/11 startande                 │
└──────────────────────────────────┘
```

### Pitch-rendering

Återanvänd `BandyPitch.tsx` som bakgrund. Rendera slots som HTML-divs OVANPÅ SVG:n (absolute positioning), inte som SVG-element. HTML-divs är lättare att göra draggable med touch.

Varje slot:
- **Tom:** streckad cirkel med positionslabel (VB, CH etc), opacity 0.5
- **Fylld:** copper-cirkel med tröjnummer, spelarnamn under, positionslabel ovanför
- **Drag-target:** pulsande border när en spelare dras ovanför

### Drag-implementation

Använd `pointer events` (fungerar för BÅDE mus och touch):

```tsx
function useDrag(playerRef: React.RefObject<HTMLElement>, player: Player) {
  const [isDragging, setIsDragging] = useState(false)
  
  useEffect(() => {
    const el = playerRef.current
    if (!el) return
    
    let clone: HTMLElement | null = null
    let startX = 0, startY = 0
    
    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      startX = e.clientX; startY = e.clientY
      // Skapa visuell klon
      clone = el.cloneNode(true) as HTMLElement
      clone.style.position = 'fixed'
      clone.style.zIndex = '1000'
      clone.style.pointerEvents = 'none'
      clone.style.opacity = '0.85'
      clone.style.transform = 'scale(1.1)'
      document.body.appendChild(clone)
      setIsDragging(true)
    }
    
    function onPointerMove(e: PointerEvent) {
      if (!clone) return
      clone.style.left = `${e.clientX - 20}px`
      clone.style.top = `${e.clientY - 20}px`
    }
    
    function onPointerUp(e: PointerEvent) {
      if (clone) { clone.remove(); clone = null }
      setIsDragging(false)
      // Hit-test mot slots
      const dropTarget = findClosestSlot(e.clientX, e.clientY)
      if (dropTarget) onAssignPlayer(player.id, dropTarget.id)
    }
    
    el.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointermove', onPointerMove)  
      document.removeEventListener('pointerup', onPointerUp)
    }
  }, [])
  
  return isDragging
}
```

`findClosestSlot()` beräknar avstånd från pointer till varje slots DOM-position. Returnerar närmaste slot inom 40px radie.

### Visuell feedback under drag

- Alla tomma slots pulsar (`animation: pulse 1s ease-in-out infinite`)
- Närmaste slot inom radie: border-color → copper, scale(1.1)
- Slots med "fel" positionstyp: border-color → warning (orange)
- Redan fyllda slots: visar swap-indikator (↔️)

### Bänk-sektionen

Under pitchen, visa oplacerade spelare som draggable pills:

```tsx
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 16px' }}>
  {unassignedPlayers.map(player => (
    <DraggablePlayerPill key={player.id} player={player} />
  ))}
</div>
```

Pill-design: `[ 9 Andersson · 72 ]` — copper-cirkel med nummer, namn, CA.

### Ta bort spelare från pitch

Dra en placerad spelare NEDANFÖR pitchen (till bänk-området) → ta bort från slot.
Alternativt: lång-tryck/dubbelklick → ta bort.

### Auto-fill i planvy

Behåll "✨ Generera bästa elvan"-knappen. Den anropar `autoAssignFormation()` och animerar alla spelare till sina slots med en kort stagger-animation.

## Integration i LineupStep.tsx

```tsx
{viewMode === 'list' ? (
  <>
    <LineupFormationView ... />
    {/* Befintlig spelarlista */}
  </>
) : (
  <PitchLineupView
    tacticState={tacticState}
    startingIds={startingIds}
    benchIds={benchIds}
    squadPlayers={squadPlayers}
    onAssignPlayer={(pid, slotId) => { /* uppdatera positionAssignments + startingIds */ }}
    onRemovePlayer={(pid) => { /* ta bort från startingIds */ }}
    onSwapPlayers={(fromSlot, toSlot) => { /* byt spelare mellan slots */ }}
    onFormationChange={onFormationChange}
  />
)}
```

## Dataflöde

`onAssignPlayer(playerId, slotId)`:
1. Om spelaren inte är i `startingIds` → lägg till (som `onTogglePlayer` gör idag)
2. Uppdatera `tacticState.positionAssignments[playerId] = slot`
3. Om slotten redan hade en spelare → flytta den till bänken (eller swap om det drogs FROM en annan slot)

`onRemovePlayer(playerId)`:
1. Ta bort från `startingIds`
2. Ta bort från `positionAssignments`

## Touch-optimering

- `touch-action: none` på pitch-container
- `user-select: none` på hela lineup-sektionen
- Minsta draggable-element: 44×44px (iOS riktlinje)
- Visuell feedback inom 16ms (PointerMove är snabbare än TouchMove)
- Haptic feedback vid drop: `navigator.vibrate?.(10)` (Android)

## Filer att skapa/ändra

| Fil | Ändring |
|-----|---------|
| `PitchLineupView.tsx` | NY — hela drag-and-drop pitch-komponenten |
| `DraggablePlayerPill.tsx` | NY — draggable spelarpill för bänken |
| `LineupStep.tsx` | Lägg till vy-toggle, ta bort placeholder-text |
| `Formation.ts` | Ingen ändring behövs — slots redan definierade |

## ORDNING

1. Skapa `PitchLineupView.tsx` med grundläggande layout + statisk rendering
2. Skapa `DraggablePlayerPill.tsx` 
3. Implementera pointer-based drag i PitchLineupView
4. Integrera i LineupStep med vy-toggle
5. Testa touch på mobil via Render-deploy

npm run build efter varje steg. Committa: "feat: drag-and-drop pitch lineup view"
