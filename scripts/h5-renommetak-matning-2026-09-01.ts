/**
 * H5 RENOMMÉTAK — MASTER_OPPET.md inv-2-11-h5-renommetak (begärt två gånger,
 * INVENTERING_2026-08-31.md:65): rykte klampas vid 100 på åtta ställen i
 * koden (roundProcessor.ts, seasonEndProcessor.ts, economyProcessor.ts,
 * scandalService.ts, eventResolver.ts×2 för reputation + 2 för
 * academyReputation), men ingen rapport finns om vad som FAKTISKT händer en
 * dominant klubb säsong 5-6, efter att taket nåtts.
 *
 * Metod: samma "höj currentAbility"-knep som framgangskurvan-ansprak3 /
 * framgangsekonomin-kommunbidrag-matning (headless harness kan inte styra
 * matchutfall på annat sätt), körd 6 säsonger istf 2-3 för att faktiskt nå
 * och sitta kvar vid taket. Loggar per säsong: rykte, CS, placering, om
 * repMilestone-bonusar (reputationMilestoneService.ts) fortfarande FYRAR
 * (de adderar rykte, och blir per konstruktion no-ops vid tak=100) samt
 * boardExpectation (ratchetar mot WinLeague och kan bara sitta där).
 *
 * Kör: node_modules/.bin/vite-node scripts/h5-renommetak-matning-2026-09-01.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEED = 55_000
const DOMINANCE_BOOST = 30
const SEASONS = 6
const CLUB_ID = 'club_forsbacka'

function makeDominantGame(): SaveGame {
  const clubTemplate = CLUB_TEMPLATES.find(t => t.id === CLUB_ID) ?? CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'H5-Renommetak', clubId: clubTemplate.id, seed: SEED })
  const boostedPlayers = game.players.map(p =>
    p.clubId === game.managedClubId
      ? { ...p, currentAbility: Math.min(99, p.currentAbility + DOMINANCE_BOOST) }
      : p
  )
  return { ...game, players: boostedPlayers, pendingScreen: null }
}

interface SeasonRow {
  season: number
  reputation: number
  communityStanding: number
  finalPosition: number | null
  boardExpectation: string
  atCapAllSeason: boolean
  inboxRepMilestoneCount: number
}

function run(): SeasonRow[] {
  let game = makeDominantGame()
  const rows: SeasonRow[] = []
  let stepSeed = SEED * 1000
  let repHitCapAt: number | null = null

  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let guard = 0
    let minRepThisSeason = 100
    const inboxCountBefore = game.inbox.length

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`säsong ${season}: round guard tripped`)

      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      const rep = game.clubs.find(c => c.id === CLUB_ID)!.reputation
      minRepThisSeason = Math.min(minRepThisSeason, rep)
      if (rep >= 100 && repHitCapAt === null) repHitCapAt = season

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          console.log(`  säsong ${season}: unresolvable pendingScreen (${resolved.screenType}) — avbryter`)
          seasonDone = true
          break
        }
        game = resolved.game
      }
    }

    if (game.managerFired) {
      console.log(`  AVSKEDAD under säsong ${season} (boardPatience=${game.boardPatience}, consecutiveFailures=${game.consecutiveFailures}, firedReason=${game.firedReason ?? '(sportsligt/licens, se lastSummary.boardTruth)'}) — stoppar mätningen`)
      const last = game.seasonSummaries?.at(-1)
      if (last?.boardTruth) console.log(`  senaste boardTruth: ${JSON.stringify(last.boardTruth.relationship)}`)
      break
    }

    const reputation = game.clubs.find(c => c.id === CLUB_ID)!.reputation
    const communityStanding = game.communityStanding ?? 50
    const summary = game.seasonSummaries?.at(-1)
    const inboxRepMilestoneCount = game.inbox.slice(inboxCountBefore).filter(i => i.type === 'reputationMilestone').length

    rows.push({
      season,
      reputation,
      communityStanding,
      finalPosition: summary?.finalPosition ?? null,
      boardExpectation: game.clubs.find(c => c.id === CLUB_ID)!.boardExpectation,
      atCapAllSeason: minRepThisSeason >= 100,
      inboxRepMilestoneCount,
    })
  }

  return rows
}

const rows = run()

console.log('\n=== H5 RENOMMÉTAK — vad händer säsong 5-6 för en dominant klubb (club_forsbacka) ===\n')
console.log('säsong | rykte | cs | plac | boardExpectation | rykte=100 hela säsongen | repMilestone-inbox denna säsong')
for (const r of rows) {
  console.log(
    `${r.season}      | ${r.reputation}   | ${r.communityStanding} | ${r.finalPosition ?? '-'}    | ${r.boardExpectation.padEnd(12)} | ${r.atCapAllSeason ? 'JA' : 'nej'}                     | ${r.inboxRepMilestoneCount}`
  )
}

const capSeason = rows.find(r => r.reputation >= 100)?.season ?? null
console.log(`\nRykte når 100 första gången: säsong ${capSeason ?? 'aldrig (inom ${SEASONS} säsonger)'}`)
const seasonsAtCap = rows.filter(r => r.atCapAllSeason).length
console.log(`Säsonger tillbringade HELA säsongen vid taket (100): ${seasonsAtCap} av ${rows.length}`)
const expectations = new Set(rows.map(r => r.boardExpectation))
console.log(`boardExpectation-värden sedda: ${[...expectations].join(', ')}`)
