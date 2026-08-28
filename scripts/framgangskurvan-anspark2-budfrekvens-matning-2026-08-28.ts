/**
 * DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 2 — "Framgång kostar folk". Jacobs
 * dom: "Budfrekvensen skalar med framgång. 15% flat blir en funktion av
 * klubbens renommé och föregående säsongs placering. En nykrönt mästare ska
 * tappa spelare oftare än ett mittenlag — det är priset för att vinna. Och
 * buden ska rikta sig mot dina BÄSTA spelare, inte slumpmässiga."
 *
 * Mätning per Jacobs uttryckliga "mät efter varje steg"-instruktion, samma
 * harness-mönster som prestationsfaktor-matning-2026-08-27.ts / askadare-
 * konomin-matning-v2-2026-08-27.ts: en riktig headless säsong via
 * createNewGame, sedan generateIncomingBids anropad direkt (den funktionen
 * själv är vad som ändrats — inga UI-lager runtomkring att simulera).
 *
 * Tre delar:
 *   1. Formelns rena output (computeBidChance) för mästare vs mittenlag.
 *   2. Verklig bud-FREKVENS över många omgångar (inte bara formelvärdet) —
 *      för mästare vs mittenlag, med en riktig spelartrupp från en riktig
 *      säsong.
 *   3. Riktnings-bias — av alla bud som genererades över en säsong, hur stor
 *      andel träffade klubbens FAKTISKA #1-rankade spelare (by CA) mot lägre
 *      rankade, jämfört med vad en jämn fördelning inom kandidatpoolen skulle
 *      ge.
 *
 * Kör: node_modules/.bin/vite-node scripts/framgangskurvan-anspraк2-budfrekvens-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { generateIncomingBids, computeBidChance } from '../src/domain/services/transferService'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import { mulberry32 } from '../src/domain/utils/random'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Club } from '../src/domain/entities/Club'

const SEED = 55_000

function baseGame(): SaveGame {
  const clubTemplate = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Framgangskurvan-A2', clubId: clubTemplate.id, seed: SEED })
  return { ...game, pendingScreen: null, currentDate: '2025-09-15' } // fönster öppet
}

function withScenario(game: SaveGame, finalPosition: number | undefined, reputation: number): SaveGame {
  const clubs: Club[] = game.clubs.map(c => c.id === game.managedClubId ? { ...c, reputation } : c)
  return {
    ...game,
    clubs,
    seasonStartSnapshot: finalPosition === undefined ? undefined : {
      season: game.currentSeason - 1,
      finalPosition,
      finances: 1_000_000,
      communityStanding: 50,
      squadSize: 20,
      supporterMembers: 500,
      academyPromotions: 0,
    },
    transferBids: [],
  }
}

console.log('\n=== DOM_FRAMGANGSKURVAN anspråk 2 — budfrekvens-mätning (seed=' + SEED + ') ===\n')

// ── Del 1: ren formelns output ──────────────────────────────────────────────
const game0 = baseGame()
const managedClubBase = game0.clubs.find(c => c.id === game0.managedClubId)!

const scenarioClub70 = { ...managedClubBase, reputation: 70 }
const championChance = computeBidChance(scenarioClub70, { finalPosition: 1 }, 1.0)
const midTableChance = computeBidChance(scenarioClub70, { finalPosition: 8 }, 1.0)
const season1Chance = computeBidChance(scenarioClub70, undefined, 1.0)

console.log('--- Del 1: computeBidChance (ren formel, rykte=70, bidMult=1.0) ---')
console.log(`Mästare (position 1):      bidChance = ${championChance.toFixed(4)}  (${(championChance * 100).toFixed(2)}%)`)
console.log(`Mittenlag (position 8):    bidChance = ${midTableChance.toFixed(4)}  (${(midTableChance * 100).toFixed(2)}%)`)
console.log(`Säsong 1 (ingen data):     bidChance = ${season1Chance.toFixed(4)}  (${(season1Chance * 100).toFixed(2)}%)`)
console.log(`Kvot mästare/mittenlag:    ${(championChance / midTableChance).toFixed(2)}x\n`)

// ── Del 2: verklig frekvens över många omgångar, riktig trupp ───────────────
const TRIALS = 20_000
function measureFrequency(finalPosition: number | undefined, reputation: number): number {
  const scenarioGame = withScenario(game0, finalPosition, reputation)
  let bidCount = 0
  for (let i = 0; i < TRIALS; i++) {
    const rand = mulberry32(SEED * 1000 + i)
    const bids = generateIncomingBids(scenarioGame, i, rand)
    if (bids.length > 0) bidCount++
  }
  return bidCount / TRIALS
}

const championFreq = measureFrequency(1, 70)
const midTableFreq = measureFrequency(8, 70)
const season1Freq = measureFrequency(undefined, 70)

console.log(`--- Del 2: uppmätt bud-FREKVENS över ${TRIALS} oberoende omgångar (riktig trupp från säsong) ---`)
console.log(`Mästare (position 1, rykte 70):    ${(championFreq * 100).toFixed(2)}% av omgångarna gav bud`)
console.log(`Mittenlag (position 8, rykte 70):  ${(midTableFreq * 100).toFixed(2)}% av omgångarna gav bud`)
console.log(`Säsong 1 (neutral):                ${(season1Freq * 100).toFixed(2)}% av omgångarna gav bud`)
console.log(`Kvot mästare/mittenlag (uppmätt):  ${(championFreq / midTableFreq).toFixed(2)}x\n`)

// ── Del 3: riktnings-bias mot bästa spelaren ────────────────────────────────
const targetGame = withScenario(game0, 1, 90) // hög chans så vi får många bud att mäta på
const managedPlayers = targetGame.players
  .filter(p => p.clubId === targetGame.managedClubId && !p.isInjured)
const captainId = targetGame.managedClubPendingLineup?.captainPlayerId
const candidatePool = managedPlayers
  .filter(p => p.id !== captainId)
  .sort((a, b) => b.currentAbility - a.currentAbility)
  .slice(0, Math.ceil(managedPlayers.length * 0.4))

const rankById = new Map(candidatePool.map((p, i) => [p.id, i]))
const rankCounts = new Array(candidatePool.length).fill(0)
let totalBids = 0
const TARGETING_TRIALS = 20_000
for (let i = 0; i < TARGETING_TRIALS; i++) {
  const rand = mulberry32(SEED * 7_000_000 + i)
  const bids = generateIncomingBids(targetGame, i, rand)
  if (bids.length > 0) {
    const rank = rankById.get(bids[0].playerId)
    if (rank !== undefined) {
      rankCounts[rank]++
      totalBids++
    }
  }
}

console.log(`--- Del 3: riktnings-bias — kandidatpool storlek ${candidatePool.length}, ${totalBids} bud genererade av ${TARGETING_TRIALS} försök ---`)
const uniformShare = 1 / candidatePool.length
console.log(`Jämn fördelning skulle ge varje kandidat: ${(uniformShare * 100).toFixed(1)}%`)
rankCounts.forEach((count, rank) => {
  const share = totalBids > 0 ? count / totalBids : 0
  const player = candidatePool[rank]
  console.log(`  Rank ${rank} (${player.firstName} ${player.lastName}, CA=${player.currentAbility})${rank === 0 ? ' [#1 BÄST]' : ''}: ${count} bud = ${(share * 100).toFixed(1)}%`)
})
const bestShare = totalBids > 0 ? rankCounts[0] / totalBids : 0
console.log(`\n#1-rankade spelaren fick ${(bestShare * 100).toFixed(1)}% av alla bud, mot ${(uniformShare * 100).toFixed(1)}% vid jämn fördelning (${(bestShare / uniformShare).toFixed(2)}x).\n`)
