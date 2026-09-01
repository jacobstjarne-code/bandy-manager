/**
 * DOM_FRAMGANGSEKONOMIN_UPPSIDAN_2026-08-31.md, "DIAGNOS REVIDERAD" — mätning
 * FÖRE bygge (samma disciplin som falsifierade kapacitets-premissen).
 *
 * Reviderad diagnos: matchintäkten är PLATT (arenaCapacity fryses vid
 * world-gen). De verkliga drivarna av 380tkr→1,7mkr är:
 *   1. economyService.ts's kommunBidrag (round 1, 60000×repFactor(0,5-1,5)×
 *      csFactor(csNormalized²)) — "kommunbidrag (säsongsstart)"
 *   2. politicianService.calculateKommunBidrag (säsongsslut, 30000×
 *      generosityMod×communityMod(CS/50, 0-2, olimiterad linjär) + lokStöd +
 *      agenda/relationsbonus) — "kommunbidrag (säsongsslut)"
 *   3. league_prize (seasonEndProcessor.ts, redan placeringsskalad 200k→15k,
 *      men FLAT år efter år för en klubb som håller sig kvar i toppen)
 *
 * Denna körning etablerar BASLINJEN (ingen kod ändrad ännu) för alla tre,
 * plus totalt säsongsöverskott, över 3 säsonger för en DOMINANT klubb —
 * samma "höj currentAbility"-knep som framgangskurvan-ansprak3 (headless
 * harness kan inte styra matchutfall på annat sätt).
 *
 * Fångstmetodik (för att undvika FINANCE_LOG_MAX=50-utträngning över en
 * händelserik säsong, se framgangskurvan-ansprak3's dokumenterade fynd):
 *   - "säsongsstart"-kommunbidraget fångas DIREKT efter omgång 1 (financeLog-
 *     svansen, innan senare omgångar hinner tränga ut den).
 *   - "säsongsslut"-kommunbidraget + league_prize fångas via
 *     seasonSummary.offseasonFinanceEntries — FRYST kopia, cap-immun
 *     (A-M5, samma mekanism testet offseasonFinanceReconciliation.test.ts
 *     verifierar).
 *
 * Kör: node_modules/.bin/vite-node scripts/framgangsekonomin-kommunbidrag-matning-2026-09-01.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEED = 77_000
const DOMINANCE_BOOST = 30
const SEASONS = 3
const CLUB_ID = 'club_forsbacka' // rep85 vid start — samma klubb domen själv citerar

function makeDominantGame(): SaveGame {
  const clubTemplate = CLUB_TEMPLATES.find(t => t.id === CLUB_ID) ?? CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Framgangsekonomin-Kommunbidrag', clubId: clubTemplate.id, seed: SEED })
  const boostedPlayers = game.players.map(p =>
    p.clubId === game.managedClubId
      ? { ...p, currentAbility: Math.min(99, p.currentAbility + DOMINANCE_BOOST) }
      : p
  )
  return { ...game, players: boostedPlayers, pendingScreen: null }
}

interface SeasonMeasurement {
  season: number
  startFinances: number
  endFinances: number
  reputation: number
  communityStanding: number
  finalPosition: number | null
  kommunbidragStart: number | null
  kommunbidragSlut: number | null
  leaguePrize: number | null
  byReason: Record<string, number>
}

function run(): SeasonMeasurement[] {
  let game = makeDominantGame()
  const results: SeasonMeasurement[] = []
  let stepSeed = SEED * 1000

  for (let season = 1; season <= SEASONS; season++) {
    const startFinances = game.clubs.find(c => c.id === CLUB_ID)!.finances
    let kommunbidragStart: number | null = null
    const byReason: Record<string, number> = {}
    let seasonDone = false
    let guard = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`säsong ${season}: round guard tripped`)

      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      // round-fältet på varje FinanceEntry = matchday den skrevs — pålitlig
      // identifierare för "poster tillagda DENNA omgång" oavsett cap-utträngning,
      // eftersom vi läser omedelbart efter anropet som skapade dem.
      if (result.roundPlayed != null) {
        const roundEntries = (game.financeLog ?? []).filter(e => e.round === result.roundPlayed)
        for (const e of roundEntries) {
          byReason[e.reason] = (byReason[e.reason] ?? 0) + e.amount
        }
        if (kommunbidragStart === null) {
          const entry = roundEntries.find(e => e.reason === 'kommunbidrag' && e.label.includes('säsongsstart'))
          if (entry) kommunbidragStart = entry.amount
        }
      }

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
      console.log(`  AVSKEDAD under säsong ${season} — stoppar mätningen`)
      break
    }

    const endFinances = game.clubs.find(c => c.id === CLUB_ID)!.finances
    const reputation = game.clubs.find(c => c.id === CLUB_ID)!.reputation
    const communityStanding = game.communityStanding ?? 50
    const summary = game.seasonSummaries?.at(-1)
    const offseason = summary?.offseasonFinanceEntries ?? []
    for (const e of offseason) {
      byReason[e.reason] = (byReason[e.reason] ?? 0) + e.amount
    }
    const kommunbidragSlut = offseason.find(e => e.reason === 'kommunbidrag_politiker')?.amount ?? null
    const leaguePrize = offseason.find(e => e.reason === 'league_prize')?.amount ?? null

    results.push({
      season,
      startFinances,
      endFinances,
      reputation,
      communityStanding,
      finalPosition: summary?.finalPosition ?? null,
      kommunbidragStart,
      kommunbidragSlut,
      leaguePrize,
      byReason,
    })
  }

  return results
}

const results = run()

console.log('\n=== FRAMGÅNGSEKONOMIN — kommunbidrag+league_prize-baslinje (club_forsbacka, dominant) ===\n')
console.log('säsong | rep | cs | plac | start kr | slut kr | Δ | kommunbidrag(start) | kommunbidrag(slut) | league_prize')
for (const r of results) {
  const delta = r.endFinances - r.startFinances
  console.log(
    `${r.season}      | ${r.reputation} | ${r.communityStanding} | ${r.finalPosition ?? '-'}    | ` +
    `${r.startFinances.toLocaleString('sv-SE')} | ${r.endFinances.toLocaleString('sv-SE')} | ${delta.toLocaleString('sv-SE')} | ` +
    `${r.kommunbidragStart?.toLocaleString('sv-SE') ?? 'SAKNAS'} | ${r.kommunbidragSlut?.toLocaleString('sv-SE') ?? 'SAKNAS'} | ${r.leaguePrize?.toLocaleString('sv-SE') ?? 'SAKNAS'}`
  )
}

console.log('\n=== Fullständig uppdelning per reason-tagg, per säsong ===\n')
for (const r of results) {
  console.log(`Säsong ${r.season}:`)
  const entries = Object.entries(r.byReason).sort((a, b) => b[1] - a[1])
  for (const [reason, amount] of entries) {
    console.log(`  ${reason.padEnd(20)} ${amount >= 0 ? '+' : ''}${amount.toLocaleString('sv-SE')} kr`)
  }
  const sum = entries.reduce((s, [, a]) => s + a, 0)
  console.log(`  ${'SUMMA (byReason)'.padEnd(20)} ${sum.toLocaleString('sv-SE')} kr (faktisk Δ: ${(r.endFinances - r.startFinances).toLocaleString('sv-SE')} kr)`)
}

if (results.length >= 2) {
  const first = results[0]
  const second = results[1]
  const kbStartGrowth = (first.kommunbidragStart && second.kommunbidragStart) ? second.kommunbidragStart / first.kommunbidragStart : null
  const kbSlutGrowth = (first.kommunbidragSlut && second.kommunbidragSlut) ? second.kommunbidragSlut / first.kommunbidragSlut : null
  console.log(`\nTillväxt s1→s2: kommunbidrag(start) ×${kbStartGrowth?.toFixed(2) ?? '?'}, kommunbidrag(slut) ×${kbSlutGrowth?.toFixed(2) ?? '?'}`)
  console.log(`Saldo efter 2 framgångsrika säsonger: ${second.endFinances.toLocaleString('sv-SE')} kr (mål ~600 000 kr)`)
}
