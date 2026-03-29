# Design Polish Sprint

Do all steps in order. Run `npm run build` after each. Commit each separately. Push after final.

## 1. Tactic keys fix (CRITICAL — already edited, just verify)

In `src/presentation/components/match/TacticStep.tsx`, the tactic group keys should be:
```tsx
{ label: '⚔️ Spelplan', keys: ['mentality', 'tempo', 'press'] },
{ label: '⚽ Bollspel', keys: ['passingRisk', 'width', 'attackingFocus'] },
{ label: '📐 Fasta situationer', keys: ['cornerStrategy', 'penaltyKillStyle'] },
```
Verify this is correct. If not, fix it. All 8 tactic rows from `tacticData.ts` must appear.

## 2. Fortsätt-knapp i IntroSequence — starkare visuellt

In `src/presentation/screens/IntroSequence.tsx`, the "FORTSÄTT" button is too pale.
Change from transparent ghost button to a semi-filled style:
```tsx
{hasSave && (
  <button
    onClick={() => navigate('/game')}
    style={{
      width: '100%', maxWidth: 300, padding: '14px 24px',
      background: 'rgba(196,122,58,0.15)',
      border: '1.5px solid rgba(196,122,58,0.5)',
      borderRadius: 10,
      color: 'rgba(245,241,235,0.85)',
      fontSize: 13, fontWeight: 600, letterSpacing: '2px',
      textTransform: 'uppercase', cursor: 'pointer',
      opacity: s1 ? 1 : 0,
      transition: 'opacity 700ms ease',
      transitionDelay: s1 ? '1800ms' : '0ms',
    }}
  >
    FORTSÄTT
  </button>
)}
```

## 3. GameHeader — bigger with more info

In `src/presentation/components/GameHeader.tsx`, make the header taller and richer:
```tsx
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
      padding: '10px 16px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '2.5px',
          color: 'rgba(245,241,235,0.45)',
          textTransform: 'uppercase',
        }}>
          Bandy Manager
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 12,
          color: 'rgba(245,241,235,0.8)',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
        }}>
          {club.shortName ?? club.name}
        </span>
        <span style={{
          fontSize: 10,
          color: 'rgba(245,241,235,0.45)',
        }}>
          {game.managerName} · Säsong {game.currentSeason}/{game.currentSeason + 1}
          {currentRound > 0 ? ` · Omg ${currentRound}` : ''}
        </span>
      </div>
    </div>
  )
}
```

## 4. Styrelsecitat — mjuk bakgrundsfärg

In `src/presentation/screens/BoardMeetingScreen.tsx`, the "Styrelsemedlemmarna om läget" card should have a warm tinted background to stand out from the other cards:

Change the quote card wrapper from:
```tsx
<div className="card-sharp" style={{ marginBottom: 24, padding: '12px 14px' }}>
```
To:
```tsx
<div className="card-sharp" style={{
  marginBottom: 24, padding: '14px 16px',
  background: 'rgba(196,122,58,0.04)',
  borderColor: 'rgba(196,122,58,0.15)',
}}>
```

**Design rule:** Any section with personal quotes or narrative text gets `background: rgba(196,122,58,0.04)` (warm tint) to distinguish it from data cards. Apply this also to the "Välkommen" card:
```tsx
background: 'rgba(196,122,58,0.06)',
borderColor: 'rgba(196,122,58,0.18)',
```

## 5. Match step 1 — tighten spacing

In `src/presentation/screens/MatchScreen.tsx`, reduce the vertical gaps between elements in the lineup step.

Find the padding/margin values in the match header card and reduce them:
- The "OMGÅNG X / vs Opponent / BORTA" header card: reduce bottom margin from any large value to `marginBottom: 8`
- Stepper (1-2-3 dots): reduce vertical margin to `margin: '10px 0 8px'`
- Opponent info card: reduce marginBottom to 8
- Opponent analysis card: reduce marginBottom to 8
- Formation selector: reduce top margin
- Overall section padding: keep `padding: '0 16px'` but reduce gaps between cards

## 6. Formation pitch — fix MV/LIB overlap

In `src/presentation/components/match/LineupFormationView.tsx`, the goalkeeper and libero positions overlap visually. Find the position coordinates for the goalkeeper (MV) and libero (LIB) roles.

The libero should be positioned HIGHER (further from the goal line) to separate them. Typically:
- MV (goalkeeper) = y position ~92% (very bottom)
- LIB (libero) = y position ~78% (clearly separated)

Find the position map/coordinates and ensure at least 14% vertical gap between MV and LIB.

## 7. "Generera bästa elvan" button — better contrast

In the lineup step, the "✨ Generera bästa elvan" button has poor contrast. Change its style:
```tsx
style={{
  background: 'rgba(196,122,58,0.08)',
  border: '1.5px solid var(--accent)',
  color: 'var(--accent)',
  fontWeight: 700,
  ...
}}
```

## 8. LED Scoreboard for MatchLiveScreen

This is the biggest change. In `src/presentation/screens/MatchLiveScreen.tsx`, replace the current dark scoreboard header with a retro LED-style scoreboard.

The scoreboard should look like a physical LED display board:
- Black background with subtle rounded corners (like a physical board)
- Score numbers in bright RED using a dot-matrix/seven-segment style font
- Team abbreviations (3-4 letters) in WHITE/YELLOW on each side
- Minute display in YELLOW/GREEN at center-bottom
- H (hemma) and G (gäst/guest) markers
- Subtle border/frame effect like a real scoreboard

Use CSS to simulate LED dot-matrix appearance:
```css
/* LED digit font - use a monospace with text-shadow glow */
.led-score {
  font-family: 'Courier New', monospace;
  font-weight: 900;
  font-size: 64px;
  color: #FF1A1A;
  text-shadow: 0 0 10px rgba(255,26,26,0.6), 0 0 20px rgba(255,26,26,0.3);
  letter-spacing: 4px;
}
.led-time {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 32px;
  color: #CCFF00;
  text-shadow: 0 0 8px rgba(204,255,0,0.5);
}
.led-team {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 2px;
}
```

The scoreboard container:
```tsx
<div style={{
  background: '#0A0A0A',
  borderRadius: 8,
  border: '3px solid #1A1A1A',
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
  padding: '16px 20px',
  margin: '0 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}}>
  {/* Score row */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <p className="led-team">{homeClub.shortName}</p>
      <p className="led-score">{homeScore}</p>
    </div>
    <span style={{ color: '#FF1A1A', fontSize: 32, fontWeight: 900, opacity: 0.7 }}>–</span>
    <div style={{ textAlign: 'center' }}>
      <p className="led-team">{awayClub.shortName}</p>
      <p className="led-score">{awayScore}</p>
    </div>
  </div>
  {/* Time */}
  <p className="led-time">{minute}'</p>
  {/* Weather */}
  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
    {weatherEmoji} {temperature}° · {iceCondition}
  </p>
</div>
```

Add the LED CSS classes to the component (inline styles or a small <style> block at the top of the component).

The key visual references from the user's photo:
- Large RED numbers for the score (2-2 in the photo)
- H and G labels in YELLOW on left/right sides
- Time (38) in RED at bottom center
- Clean black background
- Physical board feel with slight frame/border

Keep the rest of MatchLiveScreen unchanged — the commentary list, controls (pause/forward/sound), and bottom area stay as they are.

## Verification
```bash
npm run build
# 0 errors

# Check tactic has all 8 rows:
grep -c "keys:" src/presentation/components/match/TacticStep.tsx
# Should show the 3 groups covering all 8 keys
```

Commit format: `Design: [description]`
Push after final step.
