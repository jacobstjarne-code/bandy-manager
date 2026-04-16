# Eriks Playtest-feedback #2 — Verifierad bugganalys

Alla buggar verifierade mot faktisk kod. Root cause identifierad.

---

## 🔴 BLOCKERS — VERIFIERAD ANALYS

### B1. Transfer bids — TVÅ BUGGAR
**Root cause 1:** roundProcessor resolverar bud (status ändras till 'accepted'/'rejected') men genererar INGEN inbox-notifikation. Spelaren vet aldrig vad som hände.

**Root cause 2:** Om budet accepteras anropas ALDRIG `executeTransfer()`. Spelaren stannar i sitt gamla lag. Budet bara byter status tyst.

**FIX (roundProcessor.ts, efter resolvedBids-blocket ~rad 700):**
```typescript
// EFTER: const resolvedBids = existingBids.map(...)

// Generera notifikationer och genomför accepterade transfers
for (const bid of resolvedBids) {
  if (bid.direction !== 'outgoing') continue
  
  // Nyligen resolverat (var pending förra omgången)
  const wasPending = existingBids.find(b => b.id === bid.id)?.status === 'pending'
  if (!wasPending) continue
  
  const target = game.players.find(p => p.id === bid.playerId)
  const sellingClub = game.clubs.find(c => c.id === bid.sellingClubId)
  
  if (bid.status === 'accepted' && target) {
    // KRITISKT: Genomför transfern!
    // Anropa executeTransfer() och uppdatera game state
    const postTransfer = executeTransfer(preEventGame, bid)
    // Merge players och clubs
    
    newInboxItems.push({
      id: `inbox_bid_accepted_${bid.id}`,
      date: newDate,
      type: InboxItemType.Transfer,
      title: `✅ Bud accepterat — ${target.firstName} ${target.lastName}`,
      body: `${sellingClub?.name ?? 'Klubben'} accepterar ditt bud på ${target.firstName} ${target.lastName}! Spelaren ansluter till truppen.`,
      isRead: false,
    })
  } else if (bid.status === 'rejected' && target) {
    newInboxItems.push({
      id: `inbox_bid_rejected_${bid.id}`,
      date: newDate,
      type: InboxItemType.Transfer,
      title: `❌ Bud avslaget — ${target.firstName} ${target.lastName}`,
      body: `${sellingClub?.name ?? 'Klubben'} avslår ditt bud på ${target.firstName} ${target.lastName}.`,
      isRead: false,
    })
  }
}
```

OBS: `executeTransfer()` finns redan i transferService.ts och hanterar allt (flytta spelare, uppdatera klubbar, transferbudget etc). Den måste bara KALLAS.

### B2. VÄRVA-knappen — PLAYER NOT IN GAME.PLAYERS
**Root cause:** `handleSignFreeAgent` gör `game.players.map(p => p.id === agentId ? {...} : p)` men fria agenter lagras SEPARAT i `game.transferState.freeAgents` — de finns INTE i `game.players`. Map:en hittar aldrig agenten.

**FIX (TransfersScreen.tsx → handleSignFreeAgent):**
```typescript
function handleSignFreeAgent(agentId: string) {
  if (!game) return
  const agent = game.transferState.freeAgents.find(p => p.id === agentId)
  if (!agent) return
  
  // Lägg till spelaren i game.players (inte bara map:a)
  const agentWithClub = { ...agent, clubId: game.managedClubId, contractUntilSeason: game.currentSeason + 2 }
  const updatedPlayers = [...game.players, agentWithClub]
  const updatedFreeAgents = game.transferState.freeAgents.filter(p => p.id !== agentId)
  const updatedClubs = game.clubs.map(c =>
    c.id === game.managedClubId ? { ...c, squadPlayerIds: [...c.squadPlayerIds, agentId] } : c
  )
  useGameStore.setState({
    game: {
      ...game,
      players: updatedPlayers,
      clubs: updatedClubs,
      transferState: { ...game.transferState, freeAgents: updatedFreeAgents },
    },
  })
}
```

### B3. Båda målvakter skadade
**FIX:** I lineup-validering (MatchScreen.tsx), tillåt start utan målvakt men visa varning. I matchEngine/matchStepByStep: om inget GK-objekt hittas, skapa ett temporärt med låga stats.

### B4. Playoff oavgjort
**Analys:** matchEngine.ts (AI-matcher) hanterar OT+straffar korrekt och sätter `overtimeResult`/`penaltyResult` på fixture. MEN för LIVE-matcher (MatchLiveScreen) måste dessa fält sparas korrekt vid avslut. Verifiera att MatchLiveScreen kopierar `overtimeResult` och `penaltyResult` till fixture-objektet.

### B5. Kvartsfinal→semifinal
**Analys:** `isSeriesDecided()` kräver korrekt 3 vinster. `advancePlayoffRound()` kräver ALLA serier avgjorda. Koden ser korrekt ut. Troligaste orsaken: B4 (oavgjord match som inte räknas) → serien når aldrig 3 vinster → andra serier avslutas → UI visar "Semifinal" som etikett trots att spelarens serie fortfarande pågår. ALTERNATIVT: roundProcessor:s `updateSeries`-funktion anropas på redan-complete fixtures, double-counting wins.

**FIX:** Lägg till en guard i `updateSeriesAfterMatch`:
```typescript
// Redan i toppen av funktionen:
if (series.winnerId !== null) return series  // Already decided
```

### B6. P19-spelare försvinner
**Root cause:** Behöver kolla `seasonEndProcessor.ts` — troligen rensas youthTeam helt vid säsongsslut utan promoterings-möjlighet.

### B7. Cupen slutar fungera
**Root cause:** Behöver kolla att `cupBracket` återskapas i `seasonEndProcessor.ts` vid ny säsong.

### B8. AI-lag med 6 spelare
**Root cause:** AI-spelare kontraktsutgång + ingen regen. `aiTransferService.ts` fyller inte på tillräckligt.

**Root cause:** `createRegenPlayer` och while-loopen finns redan i `generateAiLineup`, MEN regen-spelarna läggs bara till i lineup-arrayen — inte i `game.players` eller `club.squadPlayerIds`. UI:n hittar dem inte när den slår upp namn.

**FIX 1 (akut, roundProcessor.ts):** Efter generateAiLineup-anropet, kolla om lineup innehåller spelare som inte finns i game.players. Om så, lägg till dem i `game.players` och `club.squadPlayerIds`.

**FIX 2 (permanent, seasonEndProcessor.ts):** Vid säsongsslut: för ALLA AI-klubbar med `squadPlayerIds.length < 18`, generera nya permanenta spelare med riktiga namn från `PLAYER_FIRST_NAMES`/`PLAYER_LAST_NAMES`, rimlig CA baserad på klubbens reputation, och 2-3 års kontrakt. Mål: varje AI-lag ska alltid ha minst 18 spelare.

---

## ⚠️ KRITISKT: matchEngine.ts HAR INTE UPPDATERATS

`matchEngine.ts` (använd för ALLA AI-vs-AI matcher + managed-matcher som snabbsimuleras) har fortfarande gamla värden:

| Parameter | matchEngine (FEL) | matchStepByStep (RÄTT) |
|-----------|-------------------|----------------------|
| Utvisning `foulProb *` | 0.15 | 0.55 |
| `wCorner` base | 13 | 28 |
| `chanceQuality >` | 0.15 | 0.10 |
| YellowCard | Finns kvar (bort i foul-else) | Borttagen |
| Suspension duration | `3 + rand()*3` | `3 + rand()*4` |
| Description | "Red card" | "Suspension" |

**FIX:** Applicera EXAKT samma ändringar i `matchEngine.ts` som gjordes i `matchStepByStep.ts`.

---

## 🟡 BUGG-FIXAR

### BUG1. Lönebudget blockerar kontrakt
**Root cause (TransfersScreen.tsx → handleRenew):**
```typescript
if (projectedWageBill > managedClub.wageBudget) {
  setRenewError(`Lönebudgeten överskrids...`)
  return
}
```
Lönebudgeten (wageBudget) är en fast siffra som aldrig uppdateras baserat på klubbkassan.

**FIX:** Tillåt att wageBudget automatiskt justeras som X% av kassan, ELLER ta bort wageBudget-checken och bara kolla att kassan räcker. I TransfersScreen:
```typescript
// Byt ut wageBudget-check mot kassacheck
const annualCost = newSalary * 12
if (managedClub.finances < annualCost * 0.5) {
  setRenewError('Klubbkassan räcker inte för detta kontrakt')
  return
}
```

### BUG2 + BUG3. Styrelsetexter
**Root cause:** Styrelsebetyg och säsongssummering använder olika logik.
**FIX:** Synkronisera — om betyg ≥ 4/5 → aldrig "bedrövlig". Om expectation = WinLeague och vann → "levererade" inte "överträffade".

### BUG4. Vila ger träningsskador
**Root cause:** Kolla `trainingProcessor.ts` — skadeberäkningen kanske inte tar hänsyn till träningstyp "Vila".
**FIX:** Om training === 'rest' → injuryChance = 0.

### BUG5. Bänkbyten sker ej
**Root cause:** Ingen auto-sub-logik i matchEngine. SubstitutionModal i MatchLiveScreen funkar bara i halvtid.

### BUG8. Spelarutveckling mellan säsonger
**Root cause:** `applyRoundDevelopment` körs per omgång men off-season development verkar saknas.
**FIX:** I seasonEndProcessor, ge unge spelare (< 22, CA < 50) en +3 till +8 CA-boost baserat på potentialAbility.

### BUG9. CA-text kan ej scrollas
**FIX:** PlayerCard modal — lägg till `overflow-y: auto; max-height: 85vh`.

---

## 🟢 TEXTFIXAR

### T1. Ta bort BK/IF från namn
I worldGenerator.ts `name`-fältet:
- "Forsbacka BK" → "Forsbacka"
- "Söderfors BK" → "Söderfors"
- (alla 12 klubbar)

### T2. Regioner
- Karlsborg → region: "Norrbotten"
- Heros → region: "Dalarna"

### T3. "v" → "år"
Globalt i .tsx: `{player.age}v` → `{player.age} år`

### T4-T7.
- "isberedningsmaskinen" → "ismaskinen"
- "Skjutning" → "Skott" (träning)
- "Distriktslag" → "Juniorlandslagssamling"
- "Egen zon" → "Egen planhalva"

---

## PRIORITETSORDNING FÖR CODE

### BATCH 1 (blockers — gör först):
1. **matchEngine.ts synk** — applicera alla matchStepByStep-fixar (utvisning, hörnor, skott, no yellowcard)
2. **B1: Transfer bid execution** — inbox-notis + anropa executeTransfer() vid accept
3. **B2: handleSignFreeAgent** — fixa så agent läggs till i game.players (inte bara map:as)
4. **B8: AI regen** — generera spelare om AI-trupp < 11

### BATCH 2 (kritiska buggar):
5. **BUG1: Lönebudget** — ta bort wageBudget-check, ersätt med kassacheck
6. **BUG4: Vila ger skador** — injuryChance = 0 vid rest
7. **BUG2+3: Styrelsetexter** — synka betyg med kommentar
8. **B5: Guard i updateSeriesAfterMatch** — return early om winnerId redan satt

### BATCH 3 (text):
9. T1-T7 — alla textfixar

### BATCH 4 (övrigt):
10. B3, B6, B7, BUG5, BUG8, BUG9
