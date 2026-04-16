# Tre kritiska funktioner — Code-spec

Gör alla tre i ordning. `npm run build` efter varje. Committa separat. Pusha efter sista.

---

## 1. Kontraktsutgång vid säsongsslut (P1 — KRITISK)

### Problem
`seasonEndProcessor.ts` hanterar pension men INTE kontraktsutgång. Spelare med `contractUntilSeason <= currentSeason` stannar kvar utan konsekvens.

### Fix i `seasonEndProcessor.ts`

Lägg till EFTER retirement-loopen (`for (const player of resetPlayers)`) men INNAN `const activePlayers = resetPlayers.filter(...)`:

```typescript
// ── Contract expiry ─────────────────────────────────────────────────────
const handledContracts = new Set(game.handledContractPlayerIds ?? [])
const expiredContractPlayerIds = new Set<string>()

for (const player of resetPlayers) {
  // Skip retired players, already handled contracts, and free agents
  if (retiredPlayerIds.has(player.id)) continue
  if (handledContracts.has(player.id)) continue
  if (player.clubId === 'free_agent') continue
  
  // Contract expired?
  if (player.contractUntilSeason <= game.currentSeason) {
    const wasManaged = player.clubId === game.managedClubId
    expiredContractPlayerIds.add(player.id)
    
    if (wasManaged) {
      retirementMessages.push({
        id: `inbox_contract_expired_${player.id}_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.ContractExpired ?? InboxItemType.Transfer,
        title: `${player.firstName} ${player.lastName} lämnar klubben`,
        body: `${player.firstName} ${player.lastName} kontrakt har löpt ut och han väljer att inte stanna. Han är nu fri agent.`,
        isRead: false,
      } as InboxItem)
    }
  }
}

// Update expired players: set clubId to free_agent, remove from squads
const playersAfterExpiry = resetPlayers.map(p => 
  expiredContractPlayerIds.has(p.id) 
    ? { ...p, clubId: 'free_agent' } 
    : p
)

// Remove expired from club squads
for (let i = 0; i < updatedClubs.length; i++) {
  updatedClubs[i] = {
    ...updatedClubs[i],
    squadPlayerIds: updatedClubs[i].squadPlayerIds.filter(id => !expiredContractPlayerIds.has(id)),
  }
}
```

Sedan ändra `const activePlayers` raden:
```typescript
// Var: const activePlayers = resetPlayers.filter(p => !retiredPlayerIds.has(p.id))
const activePlayers = playersAfterExpiry.filter(p => !retiredPlayerIds.has(p.id))
```

Lägg också till de fria agenterna i transferState i updatedGame:
```typescript
// I updatedGame objektet, uppdatera transferState:
transferState: {
  ...game.transferState,
  freeAgents: [
    ...(game.transferState?.freeAgents ?? []),
    ...playersAfterExpiry.filter(p => expiredContractPlayerIds.has(p.id)),
  ],
},
```

### Verifiera
Om `InboxItemType.ContractExpired` inte finns i enums, lägg till det. Alternativt använd `InboxItemType.Transfer`.

### Testscenarion
- Spelare med `contractUntilSeason === 2026` ska lämna vid övergång till säsong 2027
- Spelare som förnyats (i `handledContractPlayerIds`) ska INTE lämna
- AI-spelare med utgångna kontrakt ska också bli fria agenter
- Inbox-meddelanden ska bara visas för egna spelare

---

## 2. AI-transfers mellan säsonger (P2)

### Problem
AI-klubbar varken köper eller säljer spelare. Ligan stagnerar — samma trupper varje säsong (förutom youth intake och pension).

### Ny fil: `src/domain/services/aiTransferService.ts`

```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { mulberry32 } from '../utils/random'

interface AITransferResult {
  updatedPlayers: Player[]
  updatedClubs: SaveGame['clubs']
  transfers: Array<{
    playerId: string
    playerName: string
    fromClubId: string
    fromClubName: string
    toClubId: string
    toClubName: string
    fee: number
  }>
}

export function processAITransfers(
  players: Player[],
  clubs: SaveGame['clubs'],
  season: number,
  managedClubId: string,
  seed: number,
): AITransferResult {
  const rand = mulberry32(seed)
  const transfers: AITransferResult['transfers'] = []
  let updatedPlayers = [...players]
  let updatedClubs = clubs.map(c => ({ ...c }))

  // Each AI club attempts 0-2 signings per season
  const aiClubs = updatedClubs.filter(c => c.id !== managedClubId)
  
  for (const club of aiClubs) {
    const attempts = Math.floor(rand() * 3) // 0, 1, or 2
    if (attempts === 0) continue
    
    const clubPlayers = updatedPlayers.filter(p => p.clubId === club.id)
    const squadSize = clubPlayers.length
    
    // Don't buy if squad is already large
    if (squadSize >= 24) continue
    
    // Find weakest positions
    const positionCounts: Record<string, number> = {}
    for (const p of clubPlayers) {
      positionCounts[p.position] = (positionCounts[p.position] ?? 0) + 1
    }
    
    for (let a = 0; a < attempts; a++) {
      // Budget check
      if (club.transferBudget < 10000) break
      
      // Find available free agents or players from other AI clubs
      const candidates = updatedPlayers.filter(p => {
        if (p.clubId === managedClubId) return false // Never buy from managed club
        if (p.clubId === club.id) return false
        if (p.age > 32) return false
        // Free agents or players from clubs with large squads
        const isFreAgent = p.clubId === 'free_agent'
        const sellerClub = updatedClubs.find(c => c.id === p.clubId)
        const sellerSquadSize = sellerClub ? updatedPlayers.filter(pp => pp.clubId === sellerClub.id).length : 0
        const sellerWilling = sellerSquadSize > 20
        return isFreAgent || sellerWilling
      })
      
      if (candidates.length === 0) break
      
      // Pick a candidate (prefer higher CA)
      const sorted = candidates.sort((a, b) => b.currentAbility - a.currentAbility)
      const pickIdx = Math.min(Math.floor(rand() * 5), sorted.length - 1)
      const target = sorted[pickIdx]
      
      const isFreeAgent = target.clubId === 'free_agent'
      const fee = isFreeAgent ? 0 : Math.round(target.marketValue * (0.7 + rand() * 0.5))
      
      if (!isFreeAgent && fee > club.transferBudget) continue
      
      const fromClub = updatedClubs.find(c => c.id === target.clubId)
      
      // Execute transfer
      updatedPlayers = updatedPlayers.map(p => 
        p.id === target.id 
          ? { ...p, clubId: club.id, contractUntilSeason: season + 1 + Math.floor(rand() * 3) }
          : p
      )
      
      // Update squads
      updatedClubs = updatedClubs.map(c => {
        if (c.id === club.id) {
          return { 
            ...c, 
            squadPlayerIds: [...c.squadPlayerIds, target.id],
            transferBudget: c.transferBudget - fee,
          }
        }
        if (c.id === target.clubId) {
          return {
            ...c,
            squadPlayerIds: c.squadPlayerIds.filter(id => id !== target.id),
            finances: c.finances + fee,
          }
        }
        return c
      })
      
      transfers.push({
        playerId: target.id,
        playerName: `${target.firstName} ${target.lastName}`,
        fromClubId: target.clubId,
        fromClubName: fromClub?.name ?? 'Fri agent',
        toClubId: club.id,
        toClubName: club.name,
        fee,
      })
    }
  }
  
  return { updatedPlayers, updatedClubs, transfers }
}
```

### Integration i `seasonEndProcessor.ts`

Importera och anropa EFTER kontraktsutgång, INNAN `const updatedGame`:

```typescript
import { processAITransfers } from '../../domain/services/aiTransferService'

// ... efter kontraktsutgång och pension ...

const aiTransferResult = processAITransfers(
  playersAfterLicense,   // eller activePlayers beroende på plats
  clubsAfterLicense,
  nextSeason,
  game.managedClubId,
  baseSeed + 55555,
)

// Uppdatera spelare och klubbar
playersAfterLicense = aiTransferResult.updatedPlayers
clubsAfterLicense = aiTransferResult.updatedClubs

// Skapa inbox-meddelanden om intressanta transfers
if (aiTransferResult.transfers.length > 0) {
  const notableTransfers = aiTransferResult.transfers
    .filter(t => t.fee > 50000) // Bara visa "stora" transfers
    .slice(0, 3)
  
  if (notableTransfers.length > 0) {
    const transferText = notableTransfers
      .map(t => `${t.playerName}: ${t.fromClubName} → ${t.toClubName}${t.fee > 0 ? ` (${Math.round(t.fee/1000)} tkr)` : ' (fri agent)'}`)
      .join('\n')
    
    newInboxItems.push({
      id: `inbox_ai_transfers_${nextSeason}`,
      date: game.currentDate,
      type: InboxItemType.Transfer,
      title: `Övergångar inför säsong ${nextSeason}`,
      body: `Några anmärkningsvärda övergångar:\n${transferText}`,
      isRead: false,
    } as InboxItem)
  }
}
```

---

## 3. Spelarutveckling per omgång (P3)

### Problem
Spelarnas CA (current ability) ändras inte under säsongen — bara vid säsongsslut via `startSeasonCA`. Spelare borde utvecklas gradvis baserat på träning, matcher och ålder.

### Ny fil: `src/domain/services/playerDevelopmentService.ts`

```typescript
import type { Player } from '../entities/Player'

interface DevelopmentContext {
  trainingFocus: string   // 'physical' | 'technical' | 'tactical'
  played: boolean         // spelade denna omgång
  wasStarter: boolean     // startade matchen
  matchRating: number     // betyg (0 om ej spelat)
  trainingIntensity: string // 'normal' | 'heavy' | 'light'
}

/**
 * Beräkna CA-förändring per omgång.
 * Ung spelare (≤23): +0.1 till +0.5 per omgång om de spelar och tränar
 * Prime (24-29): ±0.05 per omgång (stabil)
 * Äldre (30+): -0.05 till -0.2 per omgång (långsam nedgång)
 * Utvecklingstakten beror på developmentRate, träning och speltid.
 */
export function calculateRoundDevelopment(
  player: Player,
  context: DevelopmentContext,
): { caChange: number; attributeChanges: Partial<Record<string, number>> } {
  const age = player.age
  const devRate = player.developmentRate ?? 50
  const gap = player.potentialAbility - player.currentAbility
  
  let baseDelta = 0
  
  if (age <= 20) {
    // Young: strong growth if playing
    baseDelta = context.played ? 0.15 + (devRate / 500) : 0.05
    if (context.wasStarter && context.matchRating >= 7.0) baseDelta += 0.1
  } else if (age <= 23) {
    // Developing: moderate growth
    baseDelta = context.played ? 0.08 + (devRate / 800) : 0.02
    if (context.wasStarter) baseDelta += 0.05
  } else if (age <= 29) {
    // Prime: very slight changes
    baseDelta = context.played ? 0.02 : -0.01
    if (context.matchRating >= 8.0) baseDelta += 0.03
  } else if (age <= 33) {
    // Declining: slow decline
    baseDelta = context.played ? -0.02 : -0.05
    if (context.trainingIntensity === 'heavy') baseDelta += 0.02
  } else {
    // Old: faster decline
    baseDelta = -0.08 - (age - 33) * 0.02
    if (context.played) baseDelta += 0.03  // Playing slows decline
  }
  
  // Cap growth by potential gap
  if (baseDelta > 0 && gap <= 2) {
    baseDelta *= 0.1 // Almost at potential — very slow growth
  } else if (baseDelta > 0 && gap <= 5) {
    baseDelta *= 0.5
  }
  
  // Training bonus
  if (context.trainingIntensity === 'heavy') baseDelta += 0.02
  if (context.trainingIntensity === 'light') baseDelta -= 0.01
  
  // Clamp
  const caChange = Math.max(-0.3, Math.min(0.5, baseDelta))
  
  // Attribute changes based on training focus (simplified)
  const attributeChanges: Partial<Record<string, number>> = {}
  if (caChange > 0) {
    const attrDelta = caChange * 0.3  // Small attribute bump
    switch (context.trainingFocus) {
      case 'physical':
        attributeChanges['skating'] = attrDelta
        attributeChanges['stamina'] = attrDelta
        attributeChanges['acceleration'] = attrDelta * 0.5
        break
      case 'technical':
        attributeChanges['ballControl'] = attrDelta
        attributeChanges['passing'] = attrDelta
        attributeChanges['shooting'] = attrDelta * 0.5
        break
      case 'tactical':
        attributeChanges['positioning'] = attrDelta
        attributeChanges['decisions'] = attrDelta
        attributeChanges['vision'] = attrDelta * 0.5
        break
    }
  }
  
  return { caChange, attributeChanges }
}

/**
 * Applicera utveckling på alla spelare i en klubb efter en omgång.
 */
export function applyRoundDevelopment(
  players: Player[],
  managedClubId: string,
  trainingFocus: string,
  trainingIntensity: string,
  completedFixturePlayerIds: Set<string>,
  starterPlayerIds: Set<string>,
  playerRatings: Record<string, number>,
): Player[] {
  return players.map(player => {
    // Only develop managed club players (AI clubs stay static for performance)
    if (player.clubId !== managedClubId) return player
    if (player.isInjured) return player
    
    const context: DevelopmentContext = {
      trainingFocus,
      played: completedFixturePlayerIds.has(player.id),
      wasStarter: starterPlayerIds.has(player.id),
      matchRating: playerRatings[player.id] ?? 0,
      trainingIntensity,
    }
    
    const { caChange, attributeChanges } = calculateRoundDevelopment(player, context)
    
    if (Math.abs(caChange) < 0.001 && Object.keys(attributeChanges).length === 0) {
      return player
    }
    
    const newCA = Math.max(15, Math.min(player.potentialAbility, player.currentAbility + caChange))
    
    // Apply attribute changes
    const newAttributes = { ...player.attributes }
    for (const [key, delta] of Object.entries(attributeChanges)) {
      const current = (newAttributes as Record<string, number>)[key] ?? 50
      ;(newAttributes as Record<string, number>)[key] = Math.max(1, Math.min(99, current + (delta ?? 0)))
    }
    
    return {
      ...player,
      currentAbility: Math.round(newCA * 10) / 10,  // 1 decimal precision
      attributes: newAttributes,
    }
  })
}
```

### Integration i `roundProcessor.ts`

Importera och anropa EFTER match-simulering, INNAN state uppdateras:

```typescript
import { applyRoundDevelopment } from '../../domain/services/playerDevelopmentService'

// ... efter att matcher simulerats ...

// Hämta relevant info
const trainingFocus = game.trainingFocus ?? 'physical'
const trainingIntensity = game.trainingIntensity ?? 'normal'
const completedFixturePlayerIds = new Set<string>() // Fyll med spelare som spelade
const starterPlayerIds = new Set<string>()            // Fyll med startspelare
const playerRatings: Record<string, number> = {}       // Fyll med betyg

// Hämta från fixture-data om det finns
const managedFixture = /* hitta den nyss spelade matchen för managed club */
if (managedFixture?.homeLineup) {
  for (const id of managedFixture.homeLineup.startingPlayerIds ?? []) {
    completedFixturePlayerIds.add(id)
    starterPlayerIds.add(id)
  }
  // ...liknande för bench som spelade
}

const developedPlayers = applyRoundDevelopment(
  updatedPlayers, // eller game.players
  game.managedClubId,
  trainingFocus,
  trainingIntensity,
  completedFixturePlayerIds,
  starterPlayerIds,
  playerRatings,
)
```

### OBS
- Utvecklingen ska vara SUBTIL — max ~5 CA-poäng per säsong för unga spelare
- Äldre spelare ska sakta tappa — ger naturlig rosterrotation
- Bara managed club-spelare utvecklas (performance)
- `currentAbility` bör avrundas till 1 decimal för att undvika float-noise

---

## Verifiering

```bash
npm run build

# Kontrollera att kontraktsutgång finns:
grep -n "contractUntilSeason" src/application/useCases/seasonEndProcessor.ts | head -5

# Kontrollera att aiTransferService finns:
ls src/domain/services/aiTransferService.ts

# Kontrollera att playerDevelopmentService finns:
ls src/domain/services/playerDevelopmentService.ts
```

Commit format:
- `feat: contract expiry at season end`
- `feat: AI transfers between seasons`
- `feat: per-round player development`
