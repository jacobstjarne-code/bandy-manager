# SAMLAD FIXSPEC — Kör allt här, ignorera alla andra spec-filer

Matchday-refaktorn är gjord. Nu återstår bugfixar och polish. Gör i ordning. `npm run build` efter varje punkt.

---

## 1. DASHBOARD: Omgångsräknare visar fel

I `DashboardScreen.tsx`:

**Footen** visar `currentRound` = senast spelade ligaomg (t.ex. 1 efter första matchen). Men advance-knappen visar "SPELA OMGÅNG 2". Inkonsekvent.

**Fix:** Ändra `currentRound`-beräkningen (~rad 340) till att visa NÄSTA ligaomgång:
```typescript
// VAR:
const currentRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((max, f) => Math.max(max, f.roundNumber), 0)
// BLI:
const lastPlayedRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((max, f) => Math.max(max, f.roundNumber), 0)
const currentRound = nextFixture && !nextFixture.isCup ? nextFixture.roundNumber : lastPlayedRound
```

**Headern** (GameHeader): hitta var "Omg X" visas i `GameHeader`/`GameShell` och använd samma logik — visa nästa omgång, inte senaste.

---

## 2. EKONOMI: Intäkterna för höga

I `src/domain/services/economyService.ts` → `calcRoundIncome`:

**A. Sänk capacity-formeln:**
```typescript
// VAR:
const capacity = club.arenaCapacity ?? Math.round(club.reputation * 25 + 600)
// BLI:
const capacity = club.arenaCapacity ?? Math.round(club.reputation * 12 + 300)
```

**B. Sänk weeklyBase:**
```typescript
// VAR:
const weeklyBase = Math.round(club.reputation * 250)
// BLI:
const weeklyBase = Math.round(club.reputation * 120)
```

**C. Verifiera att bortamatcher ger 0 intäkter:**
Sök i `roundProcessor.ts` efter var `calcRoundIncome` anropas. Kontrollera att `isHomeMatch`-parametern BARA är true om managed club är hemmalag i den SPECIFIKA matchen denna matchdag. Om alla klubbar loopas → varje klubb med hemmamatch ska få intäkter, men managed club ska BARA få det vid sin egen hemmamatch.

---

## 3. BYTESBUGGEN: 12 spelare

I `MatchScreen.tsx`, `onAssignPlayer`-handleren (~rad 235):

När en ny spelare sätts på en slot som redan har en spelare, tas den gamla bort från positionAssignments men INTE från startingIds.

**Fix:** Hitta den fördrivna spelaren och flytta den:
```tsx
onAssignPlayer={(playerId, slotId) => {
  const formation = tacticState.formation ?? '3-3-4'
  const slot = FORMATIONS[formation].slots.find(s => s.id === slotId)
  if (!slot) return
  const current = { ...(tacticState.positionAssignments ?? {}) }
  
  let displacedId: string | null = null
  for (const pid of Object.keys(current)) {
    if (current[pid].id === slotId) { displacedId = pid; delete current[pid]; break }
  }
  delete current[playerId]
  current[playerId] = slot
  
  setStartingIds(prev => {
    let ids = [...prev]
    if (displacedId && displacedId !== playerId) {
      const stillHasSlot = Object.keys(current).includes(displacedId)
      if (!stillHasSlot) ids = ids.filter(id => id !== displacedId)
    }
    if (!ids.includes(playerId)) ids.push(playerId)
    return ids
  })
  if (displacedId && displacedId !== playerId) {
    setBenchIds(prev => prev.includes(displacedId!) ? prev : [...prev, displacedId!])
  }
  setBenchIds(prev => prev.filter(id => id !== playerId))
  
  const newTactic = { ...tacticState, positionAssignments: current }
  setTacticState(newTactic)
  updateTactic(newTactic)
}}
```

---

## 4. LÖNEBUDGET BLOCKERAR KONTRAKT

I `TransfersScreen.tsx`: sök efter `wageBudget`-checken vid kontraktsförlängning. Ta bort `return` som blockerar — visa varning istället:
```typescript
// HITTA: if (projectedWageBill > managedClub.wageBudget) { setRenewError(...); return }
// ÄNDRA: ta bort return, visa bara orange varning men tillåt förlängningen
```

---

## 5. TRANSFERS: Max 1 bud

I `transferService.ts` → `createOutgoingBid`, ändra:
```typescript
// VAR:
const hasOutgoing = (game.transferBids ?? []).some(b => b.direction === 'outgoing' && b.status === 'pending')
if (hasOutgoing) { return { success: false, error: 'Du har redan ett aktivt bud' } }
// BLI:
const pendingCount = (game.transferBids ?? []).filter(b => b.direction === 'outgoing' && b.status === 'pending').length
if (pendingCount >= 3) { return { success: false, error: 'Max 3 aktiva bud samtidigt' } }
```

---

## 6. CUP "KLAR FÖR SEMIFINALEN"

I `DashboardScreen.tsx` → CupCard: kontrollera att `highestWonRound`-logiken redan implementerats av Code (den borde vara det). Om inte, fixa: använd `Math.max(0, ...playedAndWon.map(m => m.round))` för att bestämma nästa rundnamn.

---

## 7. "INTENSITET 1" I UI

I `NextMatchCard.tsx`:
- Ta bort `· Intensitet {rivalry!.intensity}` från derby-texten (~rad 273)
- Ta bort `<span className="tag tag-red">🔥 Intensitet {rivalry!.intensity}</span>` taggen

---

## 8. CUPMATCH OAVGJORT-BUGG

I `MatchDoneOverlay.tsx`: efter `managedGoals`/`oppGoals`, lägg till:
```tsx
let actualWinner: 'home' | 'away' | 'draw' = 'draw'
if (managedGoals > oppGoals) actualWinner = managedIsHome ? 'home' : 'away'
else if (managedGoals < oppGoals) actualWinner = managedIsHome ? 'away' : 'home'
else if (fixture.penaltyResult) {
  actualWinner = fixture.penaltyResult.home > fixture.penaltyResult.away ? 'home' : 'away'
} else if (fixture.overtimeResult) {
  actualWinner = fixture.overtimeResult
}
const managedWon = actualWinner === (managedIsHome ? 'home' : 'away')
const managedLost = actualWinner !== 'draw' && !managedWon
const resultColor = managedWon ? '#5A9A4A' : managedLost ? '#B05040' : '#C47A3A'
```
Visa straffresultat:
```tsx
{fixture.penaltyResult && homeScore === awayScore && (
  <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
    str. {fixture.penaltyResult.home}–{fixture.penaltyResult.away}
  </p>
)}
```

---

## 9. (POLITIKER) TEMPLATE

I `politicianEvents.ts`, low-relationship-warning (~rad 128): ersätt `{politician}`, `{paper}`, `{club}`, `{amount}` med riktiga värden:
```typescript
const papers = ['Lokaltidningen', 'Sportbladet', 'Bandypuls']
const paper = papers[Math.floor(rand() * papers.length)]
const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'Klubben'
const bidrag = politician.kommunBidrag?.toLocaleString('sv-SE') ?? '30 000'
let headline = NEWSPAPER_HEADLINES[headlineIdx]
headline = headline.replace(/\{politician\}/g, politician.name).replace(/\{paper\}/g, paper).replace(/\{club\}/g, clubName).replace(/\{amount\}/g, `${bidrag} kr`)
```

---

## 10. SLUTSPEL-FÄRGER

Sök i matchresultat-komponenter (troligen `LastMatchCard.tsx`): vinst ska ge grön (`var(--success)`), inte orange.

---

## 11. DEFAULT HASTIGHET I LIVE

I `MatchLiveScreen.tsx`: default play speed ska vara `'normal'`, inte `'fast'`. Kontrollera att rätt knapp highlightas.

---

## 12. "SLUTSPEL"-TAG → "TOPP 8"

I `DashboardScreen.tsx`: byt "SLUTSPEL" till "TOPP 8". Visa inget om 0 matcher spelade.

---

## 13. STATISTIK-FLIK

I `TabellScreen.tsx`: visa "Statistiken fylls på efter första omgången." om inga spelare har `gamesPlayed > 0`. Ta bort blå outline: `outline: 'none'` på tab-knappar.

---

## 14. PLANVY: LABELS OCH NAMN

I `PitchLineupView.tsx`: öka slot-höjd 44→58px, font 7→8-9px för positionslabels och spelarnamn.

---

## 15. ⚽ → 🏒

I `LineupStep.tsx`: byt "⚽ Planvy" → "🏒 Planvy" (om toggle fortfarande finns).

---

## 16. TERMINOLOGI

I `src/domain/data/matchCommentary.ts`:
- `"vadden"` → `"vaden"` (save-array)
- **Offside SKA VARA KVAR**

I `scoutingService.ts` ARCHETYPE_STRENGTHS:
- `TwoWaySkater`: `'imponerande skridskoåkning i båda riktningar'`
- `DefensiveWorker`: `'järnhård i försvarsarbetet'`
- `Dribbler`: `'magisk teknik med bollen'`

Sök: `grep -rni "löpkapacitet\|gult kort\|gula kort\|3 poäng\|frispark\|tackling\|vadden" src/`
Ersätt alla träffar. Ta INTE bort offside.

---

## 17. SCOUTRAPPORTER

I `scoutingService.ts` → `generateScoutNotes()`: filtrera bort `goalkeeping` från weakest om utespelare. Importera `PlayerPosition`.

---

## 18. BANDYDOKTORN

I `BandyDoktorScreen.tsx`: intro-text + bättre felmeddelande vid saknad API-nyckel.

---

## 19. VÄLJ KLUBB-SKÄRMEN

I `NewGameScreen.tsx`: mörk BANDY MANAGER-header med spelarnamn + 2026/2027. Kompaktare kort (padding 10px 14px, gap 6, flavor+region på en rad).

---

## 20. BOARD MEETING

I `BoardMeetingScreen.tsx`: tightare padding på kort (12px→10px, gap 10→8, marginBottom 10→8).

---

## ORDNING
1-5 är kritiska gameplay-buggar. 6-11 är synliga buggar. 12-20 är polish.

`npm run build` efter varje. Pusha efter sista.

## Verifiering
```bash
grep -rni "löpkapacitet\|gult kort\|gula kort\|3 poäng\|frispark\|tackling\|vadden\|Intensitet.*intensity\|{politician}\|{paper}\|{club}\|{amount}" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska ge 0 resultat
npm run build
```
