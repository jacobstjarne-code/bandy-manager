# FEATURE SPEC — Levande matchvy (V0.2)

Matchvyn är spelets hjärta. Just nu är den funktionell men
inte levande. Denna spec adresserar tre saker:

1. Momentum-indikator (ersätter den döda intensitetsbaren)
2. Visuell puls (bakgrund reagerar på spelflöde)
3. Lista/Plan-harmonisering (LineupStep)

---

## 1. MOMENTUM-INDIKATOR

### Problem
Den nuvarande intensitetsbaren är 3px hög, ser ut som en
divider, och kommunicerar ingenting meningsfullt. Den visar
"high/medium/low" som en statisk bredd — spelaren förstår
inte vad den betyder.

### Koncept: Tvåsidig momentumbar
En bar som visar VEM som dominerar, inte bara hur intensivt
spelet är. Hemmalaget till vänster, bortalaget till höger.
Mitten = jämnt spel. Baren rör sig dynamiskt.

```
  HEMMA ◄████████░░░░░░░░► BORTA
         ^^^^^^^^
         momentum åt hemma
```

### Implementation

**Fil:** Ny komponent `src/presentation/components/match/MomentumBar.tsx`

```tsx
interface MomentumBarProps {
  homeActions: number   // cumulative home attacking actions
  awayActions: number   // cumulative away attacking actions
  intensity: 'low' | 'medium' | 'high'
}

export function MomentumBar({ homeActions, awayActions, intensity }: MomentumBarProps) {
  const total = homeActions + awayActions
  const homePct = total > 0 ? (homeActions / total) * 100 : 50
  
  const barColor = intensity === 'high' 
    ? 'var(--accent)' 
    : intensity === 'medium' 
    ? 'var(--ice)' 
    : 'var(--border-dark)'
  
  const glowOpacity = intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.1 : 0

  return (
    <div style={{ padding: '4px 16px', flexShrink: 0 }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', 
        fontSize: 8, color: 'var(--text-muted)', letterSpacing: '1px',
        marginBottom: 3,
      }}>
        <span>HEMMA</span>
        <span style={{ 
          fontSize: 9, fontWeight: 700, 
          color: intensity === 'high' ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {intensity === 'high' ? '🔥 INTENSIVT' : intensity === 'medium' ? 'Aktivt' : 'Lugnt'}
        </span>
        <span>BORTA</span>
      </div>
      <div style={{ 
        height: 6, borderRadius: 3, overflow: 'hidden',
        background: 'var(--border)',
        boxShadow: glowOpacity > 0 
          ? `0 0 8px rgba(196,122,58,${glowOpacity})` 
          : 'none',
        transition: 'box-shadow 0.6s ease',
      }}>
        <div style={{
          height: '100%',
          width: `${homePct}%`,
          background: barColor,
          borderRadius: 3,
          transition: 'width 800ms ease-out, background-color 600ms ease-out',
        }} />
      </div>
    </div>
  )
}
```

### Datakälla
`MatchStep` har redan `attackingTeam: 'home' | 'away'` och
`intensity`. Räkna cumulative home/away actions i MatchLiveScreen:

```tsx
const homeActions = displayedSteps.filter(s => s.attackingTeam === 'home').length
const awayActions = displayedSteps.filter(s => s.attackingTeam === 'away').length
```

### Placering
Ersätt den nuvarande intensity-baren i MatchLiveScreen med
`<MomentumBar>`. Samma position (under kontrollknapparna,
ovanför StatsFooter).

---

## 2. VISUELL PULS — Bakgrund reagerar på spelflöde

### Problem
Matchvyn ser likadan ut oavsett om det är 0-0 i 5:e minuten
eller 4-3 i 88:e. Det borde KÄNNAS annorlunda.

### Koncept: Subtil bakgrundsförändring

Commentary-feedens bakgrund ändras baserat på matchläget:

| Tillstånd | Bakgrund |
|-----------|----------|
| Jämnt spel, låg intensitet | `var(--bg)` (default) |
| Hemmalaget dominerar | Svag copper-tint `rgba(196,122,58,0.03)` |
| Bortalaget pressar | Svag blå-tint `rgba(126,179,212,0.03)` |
| Mål just scorat | Flash: `rgba(196,122,58,0.08)` → fade till default |
| Utvisning aktiv | Svag röd-tint `rgba(176,80,64,0.03)` |
| Sista 5 minuterna, tight | Pulsande bakgrund (breathing animation) |

### Implementation

Beräkna i MatchLiveScreen baserat på `currentMatchStep`:

```tsx
function getMatchMood(step: MatchStep, displayedSteps: MatchStep[]): string {
  const hasSusp = step.activeSuspensions.homeCount > 0 || step.activeSuspensions.awayCount > 0
  if (hasSusp) return 'rgba(176,80,64,0.03)'
  
  const isLateAndTight = step.minute >= 55 && Math.abs(step.homeScore - step.awayScore) <= 1
  if (isLateAndTight) return 'rgba(196,122,58,0.04)'
  
  // Recent momentum (last 5 steps)
  const recent = displayedSteps.slice(-5)
  const homeRecent = recent.filter(s => s.attackingTeam === 'home').length
  if (homeRecent >= 4) return 'rgba(196,122,58,0.03)'
  if (homeRecent <= 1) return 'rgba(126,179,212,0.03)'
  
  return 'transparent'
}
```

Applicera på commentary-feed-diven:
```tsx
background: getMatchMood(currentMatchStep, displayedSteps),
transition: 'background 2s ease',
```

### Mål-flash
Vid mål: sätt en `goalFlash`-state som ger starkt copper-bakgrund,
och fade tillbaka efter 2 sekunder. Redan delvis implementerat
via `homeScoreFlash`/`awayScoreFlash` på scoreboarden.

---

## 3. LISTA/PLAN-HARMONISERING

### Problem
"Lista" och "Plan" i LineupStep ser helt olika ut. Plan har
snyggare formationsvy med stora spelarcirklar. Listas spelarlista
har basic styling med streckade borders. Tab-knapparna ser
olika ut beroende på vilken som är aktiv.

### Koncept
Båda vyerna ska använda SAMMA visuella system:
- Samma tab-knappar (matcha ClubScreen-tabs eller global standard)
- Spelarlistan i Lista ska använda samma cirkel-stil som Plan
- Bägge vyerna delar formationsväljare + "Generera bästa elvan"

### Tab-standard
Kolla hur ClubScreen-tabs ser ut (de är mest polerade) och
anpassa LineupSteps Lista/Plan-tabs till samma mönster:

```tsx
{/* Tab bar — same style as ClubScreen */}
<div style={{
  display: 'flex',
  background: 'var(--bg-surface)',
  borderBottom: '1px solid var(--border)',
  margin: '0 0 12px',
}}>
  {(['list', 'pitch'] as const).map(mode => (
    <button
      key={mode}
      onClick={() => setViewMode(mode)}
      style={{
        flex: 1,
        padding: '10px 4px',
        background: 'none',
        border: 'none',
        borderBottom: viewMode === mode ? '2px solid var(--accent)' : '2px solid transparent',
        color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {mode === 'list' ? '📋 Lista' : '🏒 Plan'}
    </button>
  ))}
</div>
```

### Spelarlistan
Ersätt den nuvarande dashed-border-stilen med card-sharp-rader
som matchar Plan-vyns cirklar:

```tsx
{/* Player row — consistent with PitchLineupView circles */}
<div style={{
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px',
  background: isStarting ? 'var(--bg-surface)' : 'transparent',
  borderBottom: '1px solid var(--border)',
}}>
  <div style={{
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
    background: isStarting ? 'transparent' : 'transparent',
    border: isStarting ? '2px solid var(--success)' : '1.5px solid var(--border)',
    color: isStarting ? 'var(--success)' : 'var(--text-muted)',
  }}>
    {player.shirtNumber ?? '?'}
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <span style={{ fontSize: 13, fontWeight: isStarting ? 700 : 400 }}>
      {player.lastName}
    </span>
    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
      {positionShort(player.position)}
    </span>
  </div>
  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
    {Math.round(player.currentAbility)}
  </span>
  <span style={{ 
    fontSize: 10, fontWeight: 600, minWidth: 34, textAlign: 'right',
    color: isStarting ? 'var(--success)' : 'var(--text-muted)',
  }}>
    {isStarting ? 'START' : ''}
  </span>
</div>
```

---

## IMPLEMENTATIONSPLAN

Berör > 5 filer, nya komponenter. **Spec för Code.**

```
Steg 1: MomentumBar komponent (ny fil, ~40 rader)
Steg 2: Ersätt intensity-bar i MatchLiveScreen med MomentumBar
Steg 3: Visuell puls (getMatchMood) i MatchLiveScreen commentary feed
Steg 4: Tab-harmonisering i LineupStep (matcha ClubScreen)
Steg 5: Spelarliste-redesign i LineupStep lista-vy
```

Steg 1-3 berör bara MatchLiveScreen + ny komponent.
Steg 4-5 berör LineupStep + eventuellt PitchLineupView.

npm run build && npm test efter varje steg.
