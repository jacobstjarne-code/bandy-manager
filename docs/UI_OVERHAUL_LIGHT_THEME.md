# UI Overhaul: Light Theme + Thin Header + Remove StartScreen

Do all steps in order. Run `npm run build` after each. Commit each separately.

## 1. Remove StartScreen — `/` goes to IntroSequence

### AppRouter.tsx
Change `<Route path="/" element={<StartScreen />} />` to `<Route path="/" element={<IntroSequence />} />`
Remove the `/intro` route (IntroSequence IS the root now).
Remove `import { StartScreen }`.

### IntroSequence.tsx
Add "Fortsätt" button to S1 (the title slide), shown only if a saved game exists.
Import `useGameStore` and check `game !== null`.

Below the "STARTA KARRIÄREN" button, add:
```tsx
{hasSave && (
  <button
    onClick={() => navigate('/game')}
    style={{
      width: '100%', maxWidth: 300, padding: '14px 24px',
      background: 'transparent',
      border: '1px solid rgba(196,186,168,0.25)',
      borderRadius: 10, color: 'rgba(245,241,235,0.7)',
      fontSize: 13, fontWeight: 600, letterSpacing: '2px',
      textTransform: 'uppercase', cursor: 'pointer',
    }}
  >
    FORTSÄTT
  </button>
)}
```

### Delete StartScreen.tsx

## 2. Thin header bar on all game screens

### Create `src/presentation/components/GameHeader.tsx`
```tsx
import { useGameStore, useManagedClub } from '../store/gameStore'

export function GameHeader() {
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  if (!game || !club) return null

  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 16px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '3px',
        color: 'rgba(245,241,235,0.5)',
        textTransform: 'uppercase',
      }}>
        Bandy Manager
      </span>
      <span style={{
        fontSize: 11,
        color: 'rgba(245,241,235,0.7)',
        fontWeight: 600,
      }}>
        {club.shortName ?? club.name}{currentRound > 0 ? ` · Omg ${currentRound}` : ''}
      </span>
    </div>
  )
}
```

### GameShell.tsx
Import GameHeader. Add it above `<Outlet />` so it appears on ALL game screens with BottomNav:
```tsx
export function GameShell() {
  ...
  return (
    <div style={{ ... }}>
      <GameHeader />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
```

### ClubScreen.tsx — Remove duplicate dark header
ClubScreen currently has its own dark header with club name + region tag.
Remove the `texture-leather` header div entirely — the GameHeader replaces it.
Keep ONLY the tab bar (Träning/Ekonomi/Klubb/Akademi) at the top.
Style the tab bar with light background and border-bottom:
```tsx
<div style={{
  display: 'flex',
  background: 'var(--bg-surface)',
  borderBottom: '1px solid var(--border)',
  padding: '0',
  flexShrink: 0,
}}>
```

### DashboardScreen.tsx — Remove duplicate dark header
Dashboard currently has its own dark header section.
Remove it — the GameHeader handles club identity now.
Dashboard content starts directly with the cards.

### Other screens with light headers (Trupp, Tabell, Transfers, Inkorg)
These already have light headers with border-bottom (from earlier fix).
Remove any screen-level heading that duplicates info now in GameHeader.
Keep screen-specific titles like "Trupp", "Tabell" etc — just remove the club name if shown.

## 3. Convert BoardMeetingScreen to light theme

Replace the dark overlay with a full-screen light page:
```tsx
return (
  <div style={{
    height: '100%',
    overflowY: 'auto',
    background: 'var(--bg)',
    padding: '20px 16px 90px',
  }}>
```

Convert all content from dark to light:
- `background: 'var(--bg-dark-surface)'` → remove (parent bg is light)
- `color: 'var(--text-light)'` → `color: 'var(--text-primary)'`
- `color: 'var(--text-light-secondary)'` → `color: 'var(--text-secondary)'`
- `border: '1px solid rgba(255,255,255,0.07)'` → use `className="card-sharp"` instead
- `background: 'var(--bg-dark-elevated)'` → remove (card-sharp handles it)

Each section (Välkommen, Säsongens mål, Ekonomi, Trupp, Styrelsecitat) becomes a `card-sharp` with card-label pattern:
```tsx
<div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
    📋 Säsongens mål
  </p>
  {/* content with var(--text-primary) and var(--text-secondary) colors */}
</div>
```

Header becomes:
```tsx
<p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
  Styrelsemöte
</p>
<h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
  Inför säsong {game.currentSeason}/{game.currentSeason + 1}
</h2>
<p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{club.name}</p>
```

Remove `position: fixed` and `zIndex: 500` — it's a regular page now, not an overlay.

## 4. Convert EventScreen to light theme

Same approach as BoardMeeting:
- Remove dark overlay wrapper (`position: fixed`, `rgba(14,13,11,0.97)`)
- Use `height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '20px 16px'`
- Event card → `card-sharp` with card-label
- Convert all `var(--text-light*)` → `var(--text-primary*)` / `var(--text-secondary*)`
- Player/club pills keep their existing accent colors (these work on light bg)
- Choice buttons: keep accent for accept, danger for reject, outline for neutral

## 5. Convert RoundSummaryScreen to light theme

Same approach:
- Remove `background: 'var(--bg-dark)'` → `background: 'var(--bg)'`
- Remove `color: 'var(--text-light)'` from wrapper
- Header (Omgång X, date) → regular dark text on light bg
- TappableCard: `background: 'var(--bg-dark-surface)'` → `className="card-sharp"` or `background: 'var(--bg-surface)', border: '1px solid var(--border)'`
- All `var(--text-light)` → `var(--text-primary)`
- All `var(--text-light-secondary)` → `var(--text-secondary)`
- Bottom gradient: `background: 'linear-gradient(to top, #0E0D0B 80%, transparent)'` → `background: 'linear-gradient(to top, var(--bg) 80%, transparent)'`
- CTA button keeps copper style

## 6. Convert PreSeasonScreen to light (if not already)

PreSeasonScreen may already be partially light. Ensure:
- No dark overlay wrapper
- All card backgrounds use `var(--bg-elevated)` with `border: '1px solid var(--border)'`
- Text colors use `var(--text-primary)` / `var(--text-secondary)`

## DO NOT convert these — keep dark:
- **SeasonSummaryScreen** — rich editorial layout, dark is intentional
- **GameOverScreen** — dramatic "DU HAR SPARKATS" moment
- **ChampionScreen** — celebration
- **MatchResultScreen** — post-match drama overlay
- **MatchLiveScreen** — the scoreboard header stays dark
- **NewGameScreen** — check if already light; if dark, convert to light

## 7. Verification
```bash
npm run build
# 0 errors

# Grep for remaining dark patterns in converted screens:
grep -n "bg-dark\|text-light\|rgba(14,13,11" src/presentation/screens/BoardMeetingScreen.tsx
grep -n "bg-dark\|text-light\|rgba(14,13,11" src/presentation/screens/EventScreen.tsx
grep -n "bg-dark\|text-light\|rgba(14,13,11" src/presentation/screens/RoundSummaryScreen.tsx
# Should return 0 hits (except maybe CSS variable definitions)

# Verify StartScreen is gone:
ls src/presentation/screens/StartScreen.tsx
# Should not exist
```

Commit format: `Design: [description]`
Push after final step.
