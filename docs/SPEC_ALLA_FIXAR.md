# ENDA SPEC — Ignorera alla andra spec-filer

Gör i ordning. `npm run build` efter varje. Pusha efter sista.

---

## 🔴 1. BYTESBUGGEN: 12 spelare istället för 11

I `MatchScreen.tsx`, `onAssignPlayer`-handleren: när en ny spelare tilldelas en slot som redan har en spelare, tas den gamla bort från `positionAssignments` men INTE från `startingIds`. Resultat: 12 startande.

**Fix:** Hitta den fördrivna spelaren (den som satt på slotten) och ta bort den från `startingIds`, lägg den på bänken:

```tsx
onAssignPlayer={(playerId, slotId) => {
  const formation = tacticState.formation ?? '3-3-4'
  const slot = FORMATIONS[formation].slots.find(s => s.id === slotId)
  if (!slot) return
  const current = { ...(tacticState.positionAssignments ?? {}) }
  
  // Hitta fördrivna spelaren
  let displacedId: string | null = null
  for (const pid of Object.keys(current)) {
    if (current[pid].id === slotId) { displacedId = pid; delete current[pid]; break }
  }
  delete current[playerId]
  current[playerId] = slot
  
  setStartingIds(prev => {
    let ids = [...prev]
    if (displacedId && displacedId !== playerId) ids = ids.filter(id => id !== displacedId)
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

## 🔴 2. SLUTSPEL: MATCHER HOPPAS ÖVER + RUNDGÅNG EFTER ELIMINERING

### 2a. Slutspelsmatcher hoppas över
Kvartsfinal-fixtures genereras med `roundNumber` 23-27 (5 matcher per serie). Semifinal genereras med `startRound = 26`. Det kan skapa en krock: om en KF-serie går till 4-5 matcher, ligger de på omgång 26-27 — samma som SF:s första matcher.

**Fix i roundProcessor.ts:** Ändra SF startRound så det INTE krockar med potentiella KF-matcher:
```typescript
// VAR:
const nextRoundStart = updatedBracket.status === PlayoffStatus.QuarterFinals ? 26
// BLI:
const nextRoundStart = updatedBracket.status === PlayoffStatus.QuarterFinals ? 28
  : updatedBracket.status === PlayoffStatus.SemiFinals ? 33
  : 36
```
(28 = efter max 5 KF-matcher som kan gå till omgång 27. 33 = efter max 5 SF-matcher. 36 = final.)

### 2b. Rundgång efter eliminering
När managed club åker ut i semifinal väntar de på att "säsongen spelas klart" men fastnar i en loop. Problemet: advance-funktionen kräver interaktion med managed club men det finns inga matcher kvar för dem.

**Fix — auto-sim slutspelet efter eliminering:**
I `advanceToNextEvent`, efter att `roundFixtures` beräknats: om managed club är eliminerad från slutspelet och det finns scheduled playoff fixtures → simulera dem automatiskt utan att kräva managed club-input. Advance ska fortsätta tills slutspelet (och cupen) är helt klara, sedan trigga `handleSeasonEnd`.

Kontrollera att villkoret:
```typescript
if (scheduledLeagueFixtures.length === 0) {
  if (!game.playoffBracket) return handlePlayoffStart(game, seed)
  else if (game.playoffBracket.status === PlayoffStatus.Completed) {
    ...handleSeasonEnd
  } else {
    return handleSeasonEnd(game, seed)  // ← DETTA TRIGGAR FÖR TIDIGT?
  }
}
```

Det sista `else`-fallet ("Bracket exists but incomplete with no fixtures") kan triggas felaktigt om det finns playoff-fixtures men inga liga-fixtures. `scheduledLeagueFixtures` filtrerar bort playoff-fixtures (`!f.isCup`) men playoff-fixtures har `isCup = undefined/false`, så de INGÅR i `scheduledLeagueFixtures` — och har `roundNumber > 22`.

**Undersök:** logga vilka fixtures som finns i `scheduledFixtures` vs `scheduledLeagueFixtures` vid slutspelet. Playoff-fixtures kanske felaktigt filtreras bort eller inte.

**Enklaste fix:** ändra `scheduledLeagueFixtures` till att inkludera playoff:
```typescript
const scheduledLeagueFixtures = scheduledFixtures.filter(f => !f.isCup)
// Playoff-fixtures har isCup = undefined/false, så de INGÅR redan.
// Men de kanske har status = Postponed istället för Scheduled?
```

Kontrollera om avgjorda slutspelsserier markerar fixtures som Postponed och om det leder till att inga scheduled fixtures hittas → handleSeasonEnd triggas för tidigt.

---

## 🔴 3. EKONOMI: KASSAN HOPPAR UPP OCH NER OMOTIVERAT

### Problem
Helt omotiverade intäktsökningar. Kassan svänger vilt.

### Troliga orsaker
I `roundProcessor.ts` → ekonomi-blocket:

**A. Cuppriser appliceras felaktigt?**
```typescript
const CUP_PRIZES: Record<number, number> = { 1: 10000, 2: 30000, 3: 100000 }
```
Kontrollera att cuppriser bara appliceras EN gång per match, inte varje omgång.

**B. Matchintäkter beräknas varje omgång oavsett om det spelades hemmamatch?**
```typescript
let matchRevenue: number
if (c.id === game.managedClubId) {
  const isHomeManagedMatch = !!homeMatch  // ← Är detta korrekt?
```
Om `homeMatch` hittar FEL fixture (t.ex. en gammal) → intäkter genereras varje omgång.

**C. Sponsorinkomst dubbel-räknas?**
```typescript
const weeklySponsorship = Math.round(c.reputation * 60)
const sponsorIncome = ... sponsors.reduce(...)
```
Alla klubbar får `weeklySponsorship` PLUS managed club får `sponsorIncome` från sponsors-listan. Dessa kanske dubbelräknas.

**D. Lottery-income kan vara negativ ibland, positiv ibland:**
```typescript
if (communityActivities.lottery === 'intensive') {
  income += (1500 + Math.round(rand() * 1000)) - 800  // 700-1700
}
```
`rand()` ger olika värde varje omgång → intäkterna fluktuerar.

### Fix
**Steg 1:** Lägg till en console.log i ekonomi-blocket som loggar exakt varje komponent:
```typescript
if (c.id === game.managedClubId) {
  console.log(`[ECONOMY] Round ${nextRound}:`, {
    matchRevenue, weeklySponsorship, sponsorIncome, lotteryIncome, weeklyWages,
    total: matchRevenue + weeklySponsorship + sponsorIncome + lotteryIncome - weeklyWages,
    previousFinances: c.finances,
    newFinances: c.finances + matchRevenue + weeklySponsorship + sponsorIncome + lotteryIncome - weeklyWages,
  })
}
```

**Steg 2:** Kolla om matchRevenue genereras för bortamatcher (ska vara 0 för bortamatch):
```typescript
const homeMatch = simulatedFixtures.find(
  f => f.homeClubId === c.id && f.status === FixtureStatus.Completed
)
```
Verifiera att detta BARA hittar matcher i DENNA omgång, inte gamla matcher.

**Steg 3:** Rand-seeden. `localRand` kan ge olika resultat per omgång, vilket skapar svängningar i community-income. Fixa genom att använda fasta värden istället för rand() i lottery/kiosk-beräkningarna, eller använda en stabil seed per säsong.

---

## 🔴 4. LÖNEBUDGET BLOCKERAR KONTRAKT

I `TransfersScreen.tsx`: `wageBudget`-check blockerar kontraktsförlängningar. Spelaren ligger 100k+ över budget från start.

**Fix:** Ta bort den blockerande checken. Visa varning men tillåt förlängning:
```typescript
// HITTA: if (projectedWageBill > managedClub.wageBudget) { setRenewError(...); return }
// ÄNDRA: ta bort return, visa bara varning
```

---

## 🔴 5. TRANSFERS: BARA 1 BUD ÅT GÅNGEN

I `transferService.ts` → `createOutgoingBid`: ta bort eller höj gränsen från 1 till 3:
```typescript
// VAR: .some(b => b.direction === 'outgoing' && b.status === 'pending')
// BLI: .filter(...).length >= 3
```

---

## 🟠 6. SLUTSPEL-FÄRGER: VINST = ORANGE ISTÄLLET FÖR GRÖN

Sök i matchlista-headern (troligen `LastMatchCard.tsx`) efter resultatfärg-logiken. Vinst ska ge grön (`var(--success)`), inte orange/copper.

```bash
grep -rn "result.*color\|win.*#C47\|orange.*win\|copper.*win" src/presentation/ --include="*.tsx"
```

---

## 🟠 7. POSITIONER: FORTFARANDE FEL

Jacob har specificerat positionsnamn i ett dokument. Behöver info från Jacob om exakt vilka namn/förkortningar som ska användas.

---

## FRÅN FÖREGÅENDE SPEC — kontrollera om fixade:

8. Cup-snabbsim (roundProcessor `managedClubPendingLineup`-check)
9. Cupmatch oavgjort-bugg (MatchDoneOverlay penaltyResult)
10. (politiker) template
11. "Intensitet 1" i UI
12. Cup "semifinalen"-bugg
13. Dashboard cup-ordning
14. Bytesknapp default i live
15. "SLUTSPEL"→"TOPP 8"
16. Statistik-flik tom + blå outline
17. Terminologi ("vadden"→"vaden", "löpkapacitet" etc — offside SKA VARA KVAR)
18. Scoutrapporter goalkeeping
19. Bandydoktorn intro

---

## ORDNING
1. Bytesbuggen 12→11
2. Slutspels-rundkrock + rundgång
3. Ekonomi-debug + fix
4. Lönebudget
5. Flera transferbud
6. Slutspel-färger
7-19. Kontrollera om redan fixade, fixa annars

`npm run build` efter varje. Pusha efter sista.
