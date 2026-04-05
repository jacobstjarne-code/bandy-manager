# FIXSPEC — Tre kritiska buggar (5 april kväll)

## BUG 1: Bygdens Puls uppdateras aldrig under säsongen

### Problem
communityStanding startar på 50 och ändras BARA vid playoff-
avancemang (playoffCsBoost). Vinster, föreningsaktiviteter,
derbysegrar — INGET av detta påverkar communityStanding.

I roundProcessor:
```typescript
communityStanding: playoffCsBoost > 0
  ? Math.min(100, (game.communityStanding ?? 50) + playoffCsBoost)
  : game.communityStanding,  // <-- ALDRIG ÄNDRAS!
```

### Fix

Lägg till communityStanding-beräkning FÖRE den raden:

```typescript
// ── Community standing update per round ────────────────────────────
let csBoost = playoffCsBoost

// Match result
if (justCompletedManagedFixture) {
  const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
  const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
  const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
  const won = (myScore ?? 0) > (theirScore ?? 0)
  const lost = (myScore ?? 0) < (theirScore ?? 0)
  const bigWin = won && (myScore ?? 0) >= (theirScore ?? 0) + 3
  if (bigWin) csBoost += 3
  else if (won) csBoost += 1
  else if (lost) csBoost -= 1
  
  // Derby win bonus
  const matchRivalry = getRivalry(justCompletedManagedFixture.homeClubId, justCompletedManagedFixture.awayClubId)
  if (matchRivalry && won) csBoost += 2
}

// Active community activities (per round, small)
const ca = game.communityActivities
if (ca?.kiosk && ca.kiosk !== 'none') csBoost += 0.3
if (ca?.lottery && ca.lottery !== 'none') csBoost += 0.2
if (ca?.bandyplay) csBoost += 0.3
if (ca?.functionaries) csBoost += 0.2
if (ca?.bandySchool) csBoost += 0.3
if (ca?.socialMedia) csBoost += 0.1

// Table position bonus (checked every round)
const pos = standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
if (pos <= 3) csBoost += 0.5
else if (pos <= 6) csBoost += 0.2
else if (pos >= 10) csBoost -= 0.3
```

Sedan i updatedGame:
```typescript
communityStanding: Math.min(100, Math.max(0,
  Math.round((game.communityStanding ?? 50) + csBoost)
)),
```

Med dessa siffror:
- 22 omgångar × 1 (vinst) = +22
- 22 × 0.3 (kiosk) + 22 × 0.2 (lotteri) + 22 × 0.3 (bandyplay) = +17.6
- Topplag: 22 × 0.5 = +11
- 3 derbysegrar: +6
- Total: ~57 → communityStanding ~107 (cap 100)

Det är för mycket. Justera: gör 0.1 per aktivitet per omgång istället
för 0.2-0.3. Eller använd Math.round((50 + total) * 0.8) för att
dämpa.

Rimligare:
- Vinster: +1 per vinst, -1 per förlust
- Aktiviteter: +0.15 per aktiv aktivitet per omgång (totalt ~0.5/omg om allt aktivt)
- Tabellposition: +0.2 för topp-3
- Derby: +2

Total för en bra säsong: 50 + 15 (vinster) + 11 (aktiviteter) + 4 (position) + 6 (derby) = 86

---

## BUG 2: Lista/Plan inte visuellt harmoniserade

### Problem
Skärmbilderna visar tydliga skillnader:
- Cirklarna på Plan har namn under, Lista har namn i listan
- Storleken på cirklarna skiljer (Plan = större, mera luft)
- "Generera bästa elvan"-knappen ser helt olika ut
- Typografi (fontstorlek, vikt) skiljer
- Plan har "OPLACERADE — TRYCK FÖR ATT VÄLJA" med horisontella
  spelarkort, Lista har vertikal lista

### Fix

LineupStep.tsx (Lista-vyn) ska kopiera Plan-vyns cirkelstorlek
och design. Specifikt:

1. **Formationsvyn** (LineupFormationView) ska använda EXAKT
   samma cirkelstorlek som PitchLineupView (ca 42-48px diameter)
2. **"Generera bästa elvan"** ska se likadan ut i båda
   (btn btn-outline, centrerad, samma storlek)
3. **Spelarlistan** under formationsvyn ska använda samma
   cirkel-storlek (32px) och stil i båda
4. **Tab-underline** — "Lista"/"Plan" ska ha EXAKT samma styling
   (verifiera att underline-tabs faktiskt används i bägge)

Kontrollera:
- `LineupFormationView.tsx` — storleken på spelarcirklar
- `PitchLineupView.tsx` — storleken på spelarcirklar
- Gör dem IDENTISKA (samma width, height, fontSize, border)

---

## BUG 3: Cup-matchdag kollision (potentiellt)

### Problem
Jacob rapporterar att "matchkalendern går sönder efter
cupomgång 1". Liga och cup verkar simuleras samtidigt.

### Diagnos

buildSeasonCalendar skapar separata matchdagar:
- md1: liga omg 1
- md2: liga omg 2  
- md3: cup R1 ← SEPARAT
- md4: liga omg 3
- ...

CUP_MATCHDAYS i cupService: { 1: 3, 2: 8, 3: 13, 4: 19 }

createNewGame mappar league fixtures:
```
matchday: calendar.find(s => s.type === 'league' && s.leagueRound === sf.roundNumber)?.matchday ?? sf.roundNumber
```

Fallback `sf.roundNumber` = BUG om calendar-lookup misslyckas.

### Fix

1. **Verifiera**: Logga alla fixture matchdays vid createNewGame:
```typescript
console.log('[FIXTURES]', fixtures.map(f => 
  `r${f.roundNumber} md${f.matchday} ${f.isCup ? 'CUP' : 'LEAGUE'}`
).join(', '))
```

2. **Om kollision hittas**: Ta bort fallback, kasta error istället:
```typescript
const calendarSlot = calendar.find(s => s.type === 'league' && s.leagueRound === sf.roundNumber)
if (!calendarSlot) throw new Error(`No calendar slot for league round ${sf.roundNumber}`)
matchday: calendarSlot.matchday,
```

3. **I roundProcessor**: Lägg till guard som varnar om en matchday
   har BÅDE cup OCH liga-fixtures:
```typescript
const hasCup = roundFixtures.some(f => f.isCup)
const hasLeague = roundFixtures.some(f => !f.isCup && f.roundNumber <= 22)
if (hasCup && hasLeague) {
  console.error(`[MATCHDAY CONFLICT] md${nextMatchday} has both cup and league fixtures!`)
}
```

---

## IMPLEMENTATIONSORDNING

```
1. BUG 1 — communityStanding (10 min, roundProcessor.ts)
2. BUG 3 — matchday diagnostik + guard (5 min, createNewGame + roundProcessor)
3. BUG 2 — Lista/Plan harmonisering (30 min, LineupFormationView + LineupStep)
```

npm run build && npm test efter varje.
