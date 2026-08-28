/**
 * O5 kraft 1, prestationsfaktor på lönekravet (Jacobs dom, DOM_FRAMGANGSKURVAN_
 * 2026-08-27, anspråk 1 — "Truppen vill ha det den är värd"). Mätning per
 * Jacobs uttryckliga "mät efter varje steg"-instruktion: kör en riktig säsong,
 * hitta ligans TOPPRESTERARE på en position (flest mål bland anfallare) och en
 * BÄNKSPELARE på samma position med liknande currentAbility men svag
 * säsongsproduktion, och jämför deras computeContractMinSalary().
 *
 * Metod följer samma harness-mönster som askadarekonomin-matning-v2-2026-08-27.ts:
 * en riktig headless säsong via createNewGame/advanceToNextEvent, autoSelectLineup
 * för den hanterade klubben (AI-klubbarna auto-väljer redan internt i simuleringen).
 * seasonStats ackumuleras löpande av statsProcessor.ts för ALLA klubbar (inte bara
 * den hanterade) och nollställs bara av en EXPLICIT handleSeasonEnd()-anrop, som
 * denna loop aldrig gör — därför är ett snapshot mitt i/efter säsongen en giltig
 * läsning av "denna säsong så här långt".
 *
 * Kör: node_modules/.bin/vite-node scripts/prestationsfaktor-matning-2026-08-27.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import {
  computeContractMinSalary,
  computeLeaguePositionAverages,
  reputationSalaryMultiplier,
  MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR,
} from '../src/domain/services/economyService'
import { PlayerPosition } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Player } from '../src/domain/entities/Player'

const SEED = 77_000

function runSeason(clubId: string): SaveGame {
  let game: SaveGame = createNewGame({ managerName: `Prestationsfaktor-${clubId}`, clubId, seed: SEED })
  game = { ...game, pendingScreen: null }
  let stepSeed = SEED * 100_000 + 1_000
  let lastGood: SaveGame = game
  let guardRounds = 0

  try {
    while (game.fixtures.some(f => f.status === 'scheduled')) {
      guardRounds++
      if (guardRounds > 200) throw new Error('round guard tripped — säsongen tar för lång tid')

      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      lastGood = game

      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) break  // slut på vad auto-resolvern klarar — behåll senaste goda snapshot
      game = resolved.game
      lastGood = game
    }
  } catch {
    // förväntat när säsongen tagit slut och nästa advance inte har något att göra —
    // lastGood håller redan det senaste kompletta tillståndet, seasonStats intakt
    // (handleSeasonEnd/rollover anropas aldrig av denna loop).
  }
  return lastGood
}

function main(): void {
  const clubId = CLUB_TEMPLATES[0].id
  console.log(`\n=== Prestationsfaktor-mätning (seed=${SEED}, hanterad klubb=${clubId}) ===\n`)

  const game = runSeason(clubId)
  const leagueAverages = computeLeaguePositionAverages(game)
  const forwardAvg = leagueAverages[PlayerPosition.Forward]
  console.log(`Ligasnitt FORWARD (spelare med ≥${MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR} ligamatcher): ` +
    `mål=${forwardAvg.avgGoals.toFixed(2)} assist=${forwardAvg.avgAssists.toFixed(2)} betyg=${forwardAvg.avgRating.toFixed(2)}\n`)

  const forwards = game.players.filter(p => p.position === PlayerPosition.Forward)
  const qualifiedForwards = forwards.filter(p => p.seasonStats.gamesPlayed >= MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR)

  if (qualifiedForwards.length === 0) {
    console.log('Inga anfallare med tillräckligt antal matcher denna säsong — kan inte mäta. Avbryter.')
    return
  }

  // Toppresterare: flest mål, tie-break på högst betyg.
  const topScorer = [...qualifiedForwards].sort((a, b) =>
    b.seasonStats.goals - a.seasonStats.goals || b.seasonStats.averageRating - a.seasonStats.averageRating,
  )[0]

  // Bänkspelare: liknande currentAbility (±6) som toppresteraren, men svagast
  // produktion (lägst mål+assist+betyg-summa) bland de som kvalar in.
  const CA_TOLERANCE = 6
  const similarCA = qualifiedForwards.filter(p =>
    p.id !== topScorer.id && Math.abs(p.currentAbility - topScorer.currentAbility) <= CA_TOLERANCE,
  )
  const candidatePool = similarCA.length > 0 ? similarCA : qualifiedForwards.filter(p => p.id !== topScorer.id)
  if (candidatePool.length === 0) {
    console.log('Bara en kvalificerad anfallare i hela ligan — kan inte para ihop mot en bänkspelare. Avbryter.')
    return
  }
  const weakScore = (p: Player) => p.seasonStats.goals * 2 + p.seasonStats.assists + p.seasonStats.averageRating
  const benchPlayer = [...candidatePool].sort((a, b) => weakScore(a) - weakScore(b))[0]

  function report(label: string, p: Player): number {
    const club = game.clubs.find(c => c.id === p.clubId)!
    const minSalary = computeContractMinSalary(p, club, leagueAverages)
    const repFactor = reputationSalaryMultiplier(club.reputation)
    console.log(`${label}: ${p.firstName} ${p.lastName} (${club.shortName ?? club.name})`)
    console.log(`  currentAbility=${p.currentAbility}  klubbrykte=${club.reputation} (repFactor=${repFactor.toFixed(2)})`)
    console.log(`  säsong: ${p.seasonStats.gamesPlayed} matcher, ${p.seasonStats.goals} mål, ${p.seasonStats.assists} assist, betyg ${p.seasonStats.averageRating.toFixed(2)}`)
    console.log(`  computeContractMinSalary = ${minSalary.toLocaleString('sv-SE')} kr\n`)
    return minSalary
  }

  console.log('── Verklig jämförelse (varje spelares EGEN klubb, alltså rykte skiljer sig också) ──\n')
  const topMinSalary = report('TOPPRESTERARE', topScorer)
  const benchMinSalary = report('BÄNKSPELARE   ', benchPlayer)
  const realRatio = topMinSalary / benchMinSalary
  console.log(`Verklig kvot (topp / bänk), inkl. eventuell ryktesskillnad: ${realRatio.toFixed(3)}×\n`)

  // Kontrollerad jämförelse: samma klubbrykte för båda (toppresterarens klubb)
  // isolerar EXAKT vad prestationsfaktorn ensam bidrar med, utan att ryktes-
  // skillnaden mellan de två spelarnas riktiga klubbar blandas in.
  const controlClub = game.clubs.find(c => c.id === topScorer.clubId)!
  const topControlled = computeContractMinSalary(topScorer, controlClub, leagueAverages)
  const benchControlled = computeContractMinSalary(benchPlayer, controlClub, leagueAverages)
  const controlledRatio = topControlled / benchControlled
  console.log('── Kontrollerad jämförelse (samma klubbrykte för båda — isolerar prestationsfaktorn) ──\n')
  console.log(`  Toppresterare  @ ${controlClub.shortName}-rykte: ${topControlled.toLocaleString('sv-SE')} kr`)
  console.log(`  Bänkspelare    @ ${controlClub.shortName}-rykte: ${benchControlled.toLocaleString('sv-SE')} kr`)
  console.log(`  Kontrollerad kvot (ren prestationsfaktor-effekt): ${controlledRatio.toFixed(3)}×\n`)

  console.log('=== SLUT ===\n')
}

main()
