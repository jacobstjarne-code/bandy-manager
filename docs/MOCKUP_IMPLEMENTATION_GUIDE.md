# MOCKUP IMPLEMENTATION GUIDE

## CRITICAL: Read this ENTIRE document before writing ANY code.

Open each mockup HTML file in Chrome (`docs/mockups/`) and compare visually as you work. The mockups are the TRUTH. If this document contradicts a mockup, the mockup wins.

## WORK ORDER

Do ONE screen at a time. After each screen, run the verification commands. Do NOT proceed to the next screen until verification passes.

---

## GLOBAL RULES (apply to EVERY screen)

### Dark header logic
| Screen | Header | Why |
|--------|--------|-----|
| Dashboard | 🌑 Dark | Stadium atmosphere |
| ClubScreen (Förening) | 🌑 Dark | Club identity + tabs |
| BoardMeetingScreen | 🌑 Full dark modal | Evening meeting |
| NewGameScreen step 1 | 🌑 Full dark | Dramatic intro |
| NewGameScreen step 2 | 🌑 Dark header | Club selection context |
| MatchScreen | ☀️ Light | Workspace |
| SquadScreen | ☀️ Light | Workspace |
| TabellScreen | ☀️ Light | Data |
| TransfersScreen | ☀️ Light | Workspace |
| InboxScreen | ☀️ Light | List |
| BandyDoktorScreen | ☀️ Light | Chat |

### Card nav button pattern
Every dashboard card that navigates somewhere has a small `›` button:
```tsx
<button style={{
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--accent)', fontSize: 11,
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  cursor: 'pointer',
}}>›</button>
```

### Card header pattern
Every card uses this consistent header row:
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
    {emoji} {LABEL}
  </p>
  {/* Right side: tag and/or nav button */}
</div>
```

### BottomNav fix
NavLink MUST have `style={{ flex: 1, display: 'flex', textDecoration: 'none' }}` so all 7 tabs spread equally.

### No leather-bar on data cards
Leather-bar (`<div className="leather-bar texture-leather">`) is ONLY used on:
- NextMatchCard (the match preview on dashboard)
- That's it. Everything else uses inline `card-label` pattern.

### BandyPitch — white ice
The pitch gradient must be warm white, NOT navy:
```tsx
<stop offset="0%" stopColor="#F5F1EB"/>
<stop offset="50%" stopColor="#FAFAF8"/>
<stop offset="100%" stopColor="#F0ECE4"/>
```
Player circles: `fill="rgba(255,255,255,0.5)"` with colored stroke and dark text `fill="#1A1A18"`.

### Ice tags on light backgrounds
On light backgrounds, use darker blue for contrast:
```
background: rgba(90,140,170,0.10)
border: 1px solid rgba(90,140,170,0.3)
color: #3A6A80
```
On dark backgrounds (header), use the regular lighter blue:
```
background: rgba(168,212,240,0.15)
border: 1px solid rgba(168,212,240,0.4)
color: #A8D4F0
```

---

## SCREEN 1: DASHBOARD (DashboardScreen.tsx)
**Mockup:** `docs/mockups/05-dashboard-v6.html`

### Header (KEEP AS-IS — already correct)
Dark background with texture-wood, texture-leather, snow particles, floodlights, ice-divider.

### Card changes needed:

#### NextMatchCard — KEEP leather-bar but fix structure:
- Leather-bar label: "⚔️ NÄSTA MATCH" (not the derby name)
- Derby name moves to sub-info line inside card body: `🔥 Hälsingederbyt · Intensitet 3`
- Tags on leather-bar: "DERBY" + "BORTA"

#### Tabell card:
- Add `card-nav` button (›) top-right
- MORE padding-top (14px) so SLUTSPEL badge doesn't collide with nav button
- Label: `📊 TABELL`

#### Senast card:
- Add `card-nav` button (›) top-right with text "Rapport →" or just ›
- Label: `🔴 SENAST`

#### Cup card — REMOVE leather-bar:
- Replace leather-bar with inline card-label pattern: `🏆 SVENSKA CUPEN` + tag
- Light card-sharp, no dark header

#### Truppstatus card — REMOVE leather-bar:
- Replace with: `👥 TRUPP` label + `22 redo` tag + `›` nav button
- Keep the 2x2 stat grid

#### Ekonomi card:
- Label: `💰 EKONOMI` + value inline + `›` nav button
- No leather-bar

#### Bygdens puls:
- Label: `🏘️ BYGDENS PULS`
- Metric on a "plate" (white bg, border, border-radius 5px, padding 2px 7px): `↗ 50`
- Separate `›` nav button AFTER the plate
- Progress bar below

#### Akademi/P17:
- Label: `🎓 AKADEMI` + inline P17 info + `›` nav button
- No leather-bar

#### Inkorg:
- Card-round (not card-sharp — it's narrative)
- Label: `📬 INKORG` + count badge + preview text + `›` nav button

#### Bandydoktorn:
- Card-sharp
- Label: `🩺 BANDYDOKTORN` + "5 frågor kvar" text + `›` nav button

### Verification:
```bash
# No leather-bar outside NextMatchCard in DashboardScreen:
grep -c "leather-bar" src/presentation/screens/DashboardScreen.tsx
# Should be 0 (leather-bar is in NextMatchCard component, not DashboardScreen itself)

# Card nav buttons exist:
grep -c "card-nav\|›" src/presentation/screens/DashboardScreen.tsx
# Should be > 0
```

---

## SCREEN 2: NEW GAME (NewGameScreen.tsx)
**Mockup:** `docs/mockups/06-new-game.html`

### Step 1 (name entry):
- Full dark background `var(--bg-dark)` with texture-leather
- Snow particles (reuse SnowParticles from Dashboard or add 4 particles inline)
- "NYTT UPPDRAG" copper label
- "VEM ÄR DU?" Georgia heading
- Input: transparent bg, copper bottom-border `rgba(196,122,58,0.5)`, copper text
- Button: `className="btn btn-outline"` — NOT custom inline styles

### Step 2 (club selection):
- DARK header with texture-leather, snow particles, back arrow, "Välj klubb" Georgia heading
- Light scrollable body with club cards
- CTA scrolls WITH content (NOT `position: fixed` at bottom)
- "ACCEPTERA UPPDRAGET" → `className="btn btn-copper"`
- Difficulty tags: use `var(--success)` / `var(--warning)` / `var(--danger)` — NOT hardcoded hex

### Verification:
```bash
grep -n "C9A84C\|#22c55e\|#f59e0b\|#ef4444\|position.*fixed" src/presentation/screens/NewGameScreen.tsx
# Should be 0 matches
```

---

## SCREEN 3: MATCH (MatchScreen.tsx + LineupStep + BandyPitch)
**Mockup:** `docs/mockups/07-match-v2.html`

### Match header:
- card-round with derby tinting (already exists in code)
- Light background, NOT dark

### Opponent card:
- `🔍 MOTSTÅNDAREN` label
- Replace bare `›` nav with labeled button: `className="btn btn-ghost"` text "Scouta →"

### Formation dropdown:
- Add `⚙️ FORMATION` label before the select element
- Both on same row with gap

### BandyPitch.tsx — CRITICAL FIX:
- Gradient: `#F5F1EB` → `#FAFAF8` → `#F0ECE4` (warm white ice)
- Field lines: `rgba(196,186,168,0.4)` (warm muted, not white)
- Player circles: `fill="rgba(255,255,255,0.5)"` (transparent frost)
- Player text: `fill="#1A1A18"` (dark)
- Ring colors stay: green=correct position, copper=adjacent, red=wrong

### "Bästa elvan" button:
- Text: "✨ Generera bästa elvan" (not just "Bästa elvan")
- `className="btn btn-outline"`

### Verification:
```bash
grep -n "0a1e3a\|0c2440\|#3b82f6" src/presentation/components/BandyPitch.tsx src/presentation/components/match/LineupFormationView.tsx
# Should be 0 matches (no navy, no blue)
```

---

## SCREEN 4: CLUB/FÖRENING (ClubScreen.tsx)
**Mockup:** `docs/mockups/08-club-v2.html`

### Dark header:
- `texture-leather` + `var(--bg-dark)` background
- Club name in Georgia
- Region as `tag tag-dark`
- Tab bar on dark bg with copper active state

### Training tab — ORDER MATTERS:
1. **Träningsprojekt FIRST** (above training)
2. **Daglig träning SECOND** (below projects)

### Träningsprojekt section:
- Label: `⚡ TRÄNINGSPROJEKT` + "0/3 aktiva"
- Explanatory text: "Riktade insatser som ger **snabbare utveckling** inom ett specifikt område."
- When EMPTY: show available projects directly with "Starta" buttons (NOT behind a click)
  - Each project: icon + name + effect description + `className="btn btn-copper"` Starta button
  - Use dashed border: `border: 1.5px dashed var(--border-dark)`
- When ACTIVE: show progress bar + "Avbryt" link

### Daglig träning section:
- Label: `🏋️ DAGLIG TRÄNING` (not just "Träning")
- Explanatory text: "Grundträningen som sker **automatiskt varje omgång**."
- Training type buttons: copper accent when active `rgba(196,122,58,0.08)`, border `var(--accent)`
  - NOT yellow/amber `rgba(234,179,8,...)`
- Intensity buttons: same copper pattern

### Verification:
```bash
# Träningsprojekt should come BEFORE Träning in the JSX:
grep -n "Träningsprojekt\|TrainingProject\|TrainingSection\|Daglig" src/presentation/screens/ClubScreen.tsx | head -10
# TrainingProjectsCard should appear before TrainingSection
```

---

## SCREEN 5: SQUAD/TRUPP (SquadScreen.tsx)
**Mockup:** `docs/mockups/09-squad-v2.html`

### Profile nav button:
Replace the small `▸` text with a visible dark button:
```tsx
<div style={{
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
  background: 'var(--bg-dark-surface)', color: 'var(--text-light)',
  fontSize: 12, fontWeight: 600,
}}>›</div>
```

### Everything else is already correct from Round 2.

### Verification:
```bash
grep -n "▸" src/presentation/screens/SquadScreen.tsx
# Should be 0 (replaced with dark nav button)
```

---

## SCREEN 6: BOARD MEETING (BoardMeetingScreen.tsx)
**Mockup:** `docs/mockups/10-board-meeting.html`

### Already correct from Round 2. No changes needed.

---

## SCREEN 7: BottomNav (BottomNav.tsx)

### NavLink fix:
```tsx
<NavLink
  key={to}
  to={to}
  style={{ flex: 1, display: 'flex', textDecoration: 'none' }}
>
```
This makes all 7 tabs spread equally across the width.

### Verification:
```bash
grep -A1 "NavLink" src/presentation/navigation/BottomNav.tsx | grep "flex.*1"
# Should find the flex: 1 style
```

---

## FINAL VERIFICATION

After ALL screens are done:

```bash
# 1. No old hex colors anywhere:
grep -rn "C9A84C\|c9a84c\|201,168,76\|#22c55e\|#f59e0b\|#ef4444\|#0a1520\|#0D1B2A\|#0a1e3a\|#0c2440\|#3b82f6\|#1a2e47\|234,179,8" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
# MUST be 0 matches

# 2. No navy in BandyPitch:
grep -n "0a1e3a\|0c2440" src/presentation/components/BandyPitch.tsx
# MUST be 0

# 3. BottomNav has flex:
grep "flex.*1" src/presentation/navigation/BottomNav.tsx
# MUST find at least one match

# 4. Träningsprojekt before Träning:
grep -n "TrainingProject\|TrainingSection" src/presentation/screens/ClubScreen.tsx
# ProjectsCard line number MUST be smaller than TrainingSection line number

# 5. No leather-bar on non-match cards in Dashboard:
grep -c "leather-bar\|leather_bar" src/presentation/screens/DashboardScreen.tsx
# Should be 0 (leather-bar is in NextMatchCard, a separate file)

# 6. TypeScript compiles:
cd /path/to/bandy-manager && npx tsc --noEmit 2>&1 | tail -5
# Should show 0 errors
```

## COMMIT MESSAGE FORMAT
```
Design: [screen name] — mockup implementation

- [specific change 1]
- [specific change 2]
- Verified: 0 old hex, 0 TS errors
```

One commit per screen. Push after each.
