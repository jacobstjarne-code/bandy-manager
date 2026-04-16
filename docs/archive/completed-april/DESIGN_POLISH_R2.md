# Design & Gameplay Polish — Round 2

Do all steps in order. `npm run build` after each. Commit each separately.

## 1. Halvtid — fix position translation + light theme

### HalftimeModal.tsx
The "Matchens spelare hittills" section shows raw English position (e.g. "goalkeeper").
Fix by importing and using `positionShort`:
```tsx
// Already imported: import { truncate, positionShort } from '../../utils/formatters'
// Change:
{bestPlayer?.position && <p ...>{bestPlayer.position}</p>}
// To:
{bestPlayer?.position && <p ...>{positionShort(bestPlayer.position)}</p>}
```

### HalftimeModal — convert to light theme
The halftime modal currently has dark overlay + dark surface background.
Convert to light theme:
- Outer wrapper: `background: 'rgba(0,0,0,0.5)'` (dim overlay, not opaque dark)
- Inner card: `background: 'var(--bg-surface)'` with `border: '1px solid var(--border)'`
- Tab bar: `background: 'var(--bg-elevated)'` with light text colors
- All `var(--text-light)` → `var(--text-primary)`
- All `var(--text-light-secondary)` → `var(--text-secondary)`
- Button row backgrounds: `rgba(196,122,58,0.08)` instead of `rgba(255,255,255,0.06)`
- Active button in tactic: keep `var(--accent)` background with white text
- Continue button: keep copper style

Keep `isBigMatch` styling for SM-final/cup-final — those can have stronger copper accents.

## 2. LED Scoreboard — bigger weather, fix team name truncation

### MatchLiveScreen.tsx
In the LED scoreboard:
- Team names: use `club.shortName` (max 6 chars). If no shortName, truncate to 6 chars. Never show "..." — just cut.
- Weather/ice line: increase from `fontSize: 11` to `fontSize: 13` and `color: rgba(255,255,255,0.6)` (brighter)
- Add H/G labels like the reference photo:
```tsx
<span style={{ color: '#CCFF00', fontSize: 12, fontWeight: 700 }}>H</span>
// between team name and score for home team
<span style={{ color: '#CCFF00', fontSize: 12, fontWeight: 700 }}>G</span>
// for away team
```

## 3. GameHeader — grow 30%, add club badge space

### GameHeader.tsx
Increase padding and font sizes:
```tsx
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'var(--bg-dark)',
  borderBottom: '2px solid var(--accent)',
  flexShrink: 0,
  minHeight: 44,
}}>
  <span style={{
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    letterSpacing: '2.5px',
    color: 'rgba(245,241,235,0.45)',
    textTransform: 'uppercase',
  }}>
    Bandy Manager
  </span>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    {/* Badge placeholder - will be replaced with real SVG */}
    <div style={{
      width: 24, height: 24, borderRadius: 4,
      background: 'rgba(196,122,58,0.15)',
      border: '1px solid rgba(196,122,58,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, color: 'var(--accent)',
    }}>
      {(club.shortName ?? club.name).substring(0, 2).toUpperCase()}
    </div>
    <div style={{ textAlign: 'right' }}>
      <p style={{
        fontSize: 13,
        color: 'rgba(245,241,235,0.85)',
        fontWeight: 700,
        fontFamily: 'var(--font-display)',
        margin: 0,
        lineHeight: 1.2,
      }}>
        {club.shortName ?? club.name}
      </p>
      <p style={{
        fontSize: 10,
        color: 'rgba(245,241,235,0.4)',
        margin: 0,
        lineHeight: 1.2,
      }}>
        {game.managerName} · {game.currentSeason}/{game.currentSeason + 1}
        {currentRound > 0 ? ` · Omg ${currentRound}` : ''}
      </p>
    </div>
  </div>
</div>
```

## 4. Spelarkort — align with design system

### PlayerProfileContent.tsx (the modal version shown in SquadScreen)
The player card popup currently has a copper/gold border and the old dark styling.
If shown as a modal overlay, update:
- Modal overlay: `background: 'rgba(0,0,0,0.5)'` (same as halftime)
- Card: `background: 'var(--bg-surface)'`, `border: '1px solid var(--border)'`, `borderRadius: 14`
- Remove the copper border from the card
- Keep the player illustration as-is (Erik's asset territory)
- Player name: Georgia, `var(--text-primary)`
- Club name: `var(--accent)` 
- Position badge: tag-copper style
- Attributes section: card-sharp with card-label pattern
- Season section: card-sharp with card-label pattern

### In SquadScreen.tsx
Find where the player modal/popup is rendered. Ensure it uses the new light overlay style.

## 5. Community activities — spontaneous nudges via inbox

### In advanceRound flow (gameFlowActions.ts or advanceToNextEvent.ts)
Currently community activities only activate when the user manually clicks in the Förening tab.
Add a system where the game occasionally generates inbox messages suggesting activities:

After round 5, if `communityActivities.kiosk === 'none'`, add an inbox message:
```
{
  type: 'community',
  title: 'Kioskverksamhet?',
  body: 'En grupp frivilliga har frågat om att starta en kiosk vid hemmamatcherna. Det skulle kosta 3 tkr att komma igång.',
  isRead: false,
}
```

Similar nudges for:
- Round 8: lottery (if not started)
- Round 12: bandySchool (if not started and academyLevel > basic)
- Round 3: socialMedia (if not started)

These are just inbox MESSAGES, not auto-activations. The user still has to go to Förening → Ekonomi to activate them.

### Training nudge
If the user hasn't changed training from default Physical/Normal after round 3, add inbox:
```
{
  type: 'training',
  title: 'Träningsschema',
  body: 'Spelarna undrar om det inte är dags att variera träningen? Kolla in träningstabben under Förening.',
}
```

## 6. Sponsor spontaneous offers

### In advanceRound flow
Every 4th round, if sponsors < maxSponsors, there's a 25% chance of receiving a spontaneous sponsor offer via inbox:
```
{
  type: 'sponsor',
  title: 'Sponsorerbjudande från [SponsorName]',
  body: '[SponsorName] vill teckna ett avtal värt [X] tkr/omgång i [Y] omgångar. Gå till Förening → Ekonomi → Sponsorer.',
}
```

This is already partially handled by `seekSponsor()` but that requires user action. The inbox nudge just reminds them.

## 7. Patron & Kommun — ensure they generate

### Verify in createNewGame.ts
Patron generation: `if (clubReputation < 35 || rand() > 0.75) return undefined`
This means 25% chance if rep > 35. This is correct — patron appears as a game event.

### Kommun bidrag
Already generated in `generatePolitician()` with `kommunBidrag: 50000 + Math.round(rand() * 100000)`.
Verify this is DISPLAYED in the Ekonomi tab — check EkonomiTab.tsx for patron/kommun rendering.

## 8. Spelarsamtal auto-trigger

### In advanceRound flow
If a player's morale drops below 30, auto-generate an inbox message:
```
{
  type: 'morale',
  title: '[PlayerName] vill prata',
  body: '[PlayerName] verkar inte må bra. Kanske är det dags för ett spelarsamtal? Klicka på spelaren i Trupp.',
}
```

This is a NUDGE, not an auto-resolution. Player conversations already work when clicking a player in the squad.

## 9. Formation pitch — separate MV and LIB

### LineupFormationView.tsx
Find the Y-coordinate mapping for positions. Ensure:
- MV (goalkeeper) = bottommost position (y ~93%)
- LIB = clearly above MV (y ~80%)
- At least 13% gap

## Verification
```bash
npm run build
# Grep for English position in halftime:
grep -n "bestPlayer?.position" src/presentation/components/match/HalftimeModal.tsx
# Should show positionShort(bestPlayer.position) usage
```

Commit format: `Polish: [description]`
Push after final step.
