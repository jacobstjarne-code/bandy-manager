# Truppöversyn — "Kärlek till laget"

Spelarrelationen är kärnan i ett managerspel. Just nu är statistiken begravd i en modal. Man får ingen känsla för vilka spelarna är, hur det går för dem, eller vad de bidrar med. Denna spec åtgärdar det.

## 1. SPELARLISTAN — visa stats direkt

### Nuvarande
Spelarrad visar: namn, position, ålder, CA, form-bar, kondition-bar, statusbrickor.

### Nytt: lägg till en stat-rad under varje spelare
Under form/kondition-raden, lägg en tredje rad med säsongsstatistik:

```
[MV] Lindström  28v                    68 ▲+3
     Form ████░ Kond █████░       ⭐ Proffs
     3M  0G  0A  6.2★  1utv              ← NYTT
```

Format: `{matcher}M  {mål}G  {assist}A  {snittbetyg}★  {utvisningar}utv`

- Visa bara om `gamesPlayed > 0`
- Snittbetyg med 1 decimal, färgkodat: ≥7.5 copper, ≥6.0 neutral, <6.0 danger
- Utvisningar (antal) istället för "gula kort" + "röda kort"

### Implementation
I `SquadScreen.tsx` → `PlayerRow`, lägg till en tredje rad efter form/kond:

```tsx
{player.seasonStats.gamesPlayed > 0 && (
  <div style={{ display: 'flex', gap: 12, paddingLeft: 38, fontSize: 11, color: 'var(--text-muted)' }}>
    <span>{player.seasonStats.gamesPlayed}M</span>
    <span style={{ color: player.seasonStats.goals > 0 ? 'var(--text-primary)' : undefined }}>{player.seasonStats.goals}G</span>
    <span>{player.seasonStats.assists}A</span>
    <span style={{ color: ratingColor(player.seasonStats.averageRating) }}>
      {player.seasonStats.averageRating.toFixed(1)}★
    </span>
    {(player.seasonStats.redCards + player.seasonStats.suspensions) > 0 && (
      <span style={{ color: 'var(--danger)' }}>{player.seasonStats.redCards}utv</span>
    )}
  </div>
)}
```

## 2. TRUPPSUMMERING — topp-3 ovanför listan

Lägg till ett kort ovanför spelarlistan med säsongens nyckeltal:

```
┌─────────────────────────────────────┐
│  ⚽ Toppskytt        │ 🅰️ Assist    │
│  Andersson 8         │ Larsson 5    │
│                      │              │
│  ⭐ Bäst betyg       │ 🔴 Utvisn.   │
│  Larsson 7.8         │ Eriksson 4   │
└─────────────────────────────────────┘
```

- 2×2 grid med metric-cards
- Visa namn + värde
- Klick → öppnar spelarens profil

### Implementation
Beräkna i `SquadScreen` innan render:
```tsx
const topScorer = players.filter(p => p.seasonStats.goals > 0).sort((a,b) => b.seasonStats.goals - a.seasonStats.goals)[0]
const topAssist = players.filter(p => p.seasonStats.assists > 0).sort((a,b) => b.seasonStats.assists - a.seasonStats.assists)[0]
const topRating = players.filter(p => p.seasonStats.gamesPlayed >= 3).sort((a,b) => b.seasonStats.averageRating - a.seasonStats.averageRating)[0]
const topSuspensions = players.filter(p => p.seasonStats.redCards > 0).sort((a,b) => b.seasonStats.redCards - a.seasonStats.redCards)[0]
```

## 3. SPELARMODAL — fixa labels och lyft stats

### 3a. "Gula kort" → "Utvisningar"
I `PlayerProfileContent.tsx`, Säsong-fliken:
- Byt `{ label: 'Gula kort', value: String(player.seasonStats.yellowCards) }` → `{ label: 'Utvisningar', value: String(player.seasonStats.redCards) }`
- Ta bort raden "Röda kort" (det finns bara utvisning i bandy)
- Eller: slå ihop till en rad "Utvisningar" = `redCards` (som representerar 10-min suspensions)

### 3b. Visa stats mer prominent
Flytta de viktigaste statsen (mål, assist, betyg) till Översikt-fliken istället för att gömma dem i Säsong-fliken:

Under form/kondition/skärpa/moral, lägg en sektion:

```
── SÄSONGEN ──────────────
  8 matcher  |  3 mål  |  2 assist  |  6.8★
```

Enkel horisontell rad. Klickbar → navigerar till Säsong-fliken.

## 4. DRAG-AND-DROP LINEUP

Se separat mockup (bandy_manager_lineup_mockup.html).

### Integration
- Lägg till en tydlig vy-toggle i `LineupStep.tsx`: "Lista" (default) / "📋 → ⚽ Planvy"
- Listvy = nuvarande funktionalitet (default, snabbt)
- Planvy = drag-and-drop pitch view (visuellt, taktiskt)
- Toggle ska vara TYDLIGT synlig — inte en gömd ikon. Använd en segmented control högst upp:
  `[ 📋 Lista  |  ⚽ Planvy ]` med copper-highlight på aktiv
- Första gången: visa en kort puls-animation eller tooltip "Nytt! Dra spelare till planen"
- Spara preference i localStorage
- VIKTIGT: Lista är default. Men togglen ska vara visuellt framträdande så att användaren upptäcker planvyn.

### Datamodell
Positionerna mappas till `LineupPosition`:
```ts
type LineupPosition = 'gk' | 'lb' | 'lcb' | 'cb' | 'rcb' | 'rb' | 'lm' | 'cm' | 'rm' | 'lw' | 'cf'
```

`startingPlayerIds` behålls som array (ordning = position), plus ny optional `positionAssignments`:
```ts
interface PositionAssignment {
  playerId: string
  position: LineupPosition
}
```

### Pitch-komponent
Skapa `PitchLineupView.tsx`:
- SVG bandyplan (halvplan räcker — visa bara det egna lagets halva + mittfältet)
- 11 drop-zones med positionslabels
- Spelarregister (bänk) under planen
- Touch-optimerad drag med `pointer-events` + `touch-action: none`
- Animerad feedback vid drop (liten scale-bounce)

## 5. STATISTIK — mer tillgänglig

### 5a. TabellScreen statistik-flik
Code säger att detta redan finns. Verifiera att den visar:
- Toppskytt (liga)
- Assist (liga)
- Hörnmål
- Snittbetyg
- Utvisningsminuter

### 5b. Matchrapport — spelarstatistik
I `MatchReportView.tsx`, visa individuella spelarinsatser:
- Betyg per spelare (färgkodat)
- Mål/assist-markeringar
- Utvisningar

## ORDNING

1. **Stat-rad i spelarlistan** (liten ändring, stor effekt) — SquadScreen.tsx
2. **Truppsummering** (topp-3 kort) — SquadScreen.tsx
3. **Fixa "Gula kort" → "Utvisningar"** — PlayerProfileContent.tsx
4. **Stats på Översikt-fliken** — PlayerProfileContent.tsx
5. **Drag-and-drop lineup** (störst jobb) — ny PitchLineupView.tsx + LineupStep.tsx toggle

Punkt 1-4 är snabba Code-jobb (~1 timme). Punkt 5 behöver mer planering — vänta på Eriks feedback på mockupen.
