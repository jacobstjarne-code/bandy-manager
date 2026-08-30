import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { advanceToNextEvent } from '../../roundProcessor'
import { processEconomy } from '../economyProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from '../../../../../scripts/stress/fixtures'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { StandingRow } from '../../../../domain/entities/Standing'

/**
 * Fix for sidofynd B (DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md, tillägg
 * 2026-08-30): socialMedia's +1 rykte var 5:e matchday (economyProcessor.ts)
 * körde helt frikopplat från placering — en mittenklubb (club_malilla,
 * placering 5/8/6) nådde rykte 100 på tre säsonger av bara denna tick.
 * D028 (boardService.ts SEASON_REPUTATION_DELTA) äger det säsongsvisa,
 * prestationskopplade deltat (toppar +4/säsong) — den här tick:en ska bara
 * förstärka en klubb som FAKTISKT ligger i topp 3 just nu.
 */
function makeGame(clubId = 'club_forsbacka', seed = 42): SaveGame {
  const g = createNewGame({ managerName: 'Test', clubId, season: 2025, seed })
  return { ...g, communityActivities: { ...g.communityActivities, socialMedia: true } }
}

function standingFor(clubId: string, position: number, played = 10): StandingRow {
  return { clubId, played, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position }
}

describe('processEconomy — socialMedia reputation tick gated på tabellplacering', () => {
  it('ger +1 rykte när klubben ligger i topp 3, socialMedia är på och matchday%5===0', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const standings = [standingFor(game.managedClubId, 2)]

    const result = processEconomy(game, [], managedPlayers, 50, standings, 5, {}, () => 0.5)
    const club = result.updatedClubs.find(c => c.id === game.managedClubId)!
    const before = game.clubs.find(c => c.id === game.managedClubId)!

    expect(club.reputation).toBe(before.reputation + 1)
  })

  it('ger INGEN rykteboost när klubben ligger utanför topp 3 (t.ex. mittenplacering)', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const standings = [standingFor(game.managedClubId, 6)]

    const result = processEconomy(game, [], managedPlayers, 50, standings, 5, {}, () => 0.5)
    const club = result.updatedClubs.find(c => c.id === game.managedClubId)!
    const before = game.clubs.find(c => c.id === game.managedClubId)!

    expect(club.reputation).toBe(before.reputation)
  })

  it('ger INGEN rykteboost vid 0 spelade matcher, även om placeringsraden råkar visa topp 3 (skuggplacering, PÅSTÅENDEKARTAN-fällan)', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const standings = [standingFor(game.managedClubId, 1, /* played */ 0)]

    const result = processEconomy(game, [], managedPlayers, 50, standings, 5, {}, () => 0.5)
    const club = result.updatedClubs.find(c => c.id === game.managedClubId)!
    const before = game.clubs.find(c => c.id === game.managedClubId)!

    expect(club.reputation).toBe(before.reputation)
  })

  it('ger fortfarande INGEN boost om socialMedia är av, oavsett placering (befintlig gating opåverkad)', () => {
    const g = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const game: SaveGame = { ...g, communityActivities: { ...g.communityActivities, socialMedia: false } }
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const standings = [standingFor(game.managedClubId, 1)]

    const result = processEconomy(game, [], managedPlayers, 50, standings, 5, {}, () => 0.5)
    const club = result.updatedClubs.find(c => c.id === game.managedClubId)!
    const before = game.clubs.find(c => c.id === game.managedClubId)!

    expect(club.reputation).toBe(before.reputation)
  })

  it('ger ingen boost på matchdagar som inte är delbara med 5, även i topp 3', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const standings = [standingFor(game.managedClubId, 1)]

    const result = processEconomy(game, [], managedPlayers, 50, standings, 6, {}, () => 0.5)
    const club = result.updatedClubs.find(c => c.id === game.managedClubId)!
    const before = game.clubs.find(c => c.id === game.managedClubId)!

    expect(club.reputation).toBe(before.reputation)
  })

  it('täcker vid 100 fastän klubben ligger i topp 3 (Math.min-taket opåverkat)', () => {
    const g = makeGame()
    const game: SaveGame = { ...g, clubs: g.clubs.map(c => c.id === g.managedClubId ? { ...c, reputation: 100 } : c) }
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const standings = [standingFor(game.managedClubId, 1)]

    const result = processEconomy(game, [], managedPlayers, 50, standings, 5, {}, () => 0.5)
    const club = result.updatedClubs.find(c => c.id === game.managedClubId)!

    expect(club.reputation).toBe(100)
  })
})

describe('REGRESSION — mittenklubb ska inte längre rusa mot rykte 100 enbart av socialMedia-tick', () => {
  it('club_malilla (mittenlag, seed 2, socialMedia alltid på) håller sig långt under rykte 100 över tre spelade säsonger', () => {
    const managedClubId = 'club_malilla'
    let game: SaveGame = createNewGame({ managerName: 'RegTest', clubId: managedClubId, seed: 2 })
    game = { ...game, pendingScreen: null, communityActivities: { ...game.communityActivities, socialMedia: true } }

    let stepSeed = 2_000
    let guard = 0
    let seasonsCompleted = 0
    const repBySeason: number[] = []

    while (seasonsCompleted < 3 && guard++ < 3000) {
      game = { ...game, communityActivities: { ...game.communityActivities, socialMedia: true } }
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.seasonEnded || game.managerFired) {
        seasonsCompleted += 1
        repBySeason.push(game.clubs.find(c => c.id === managedClubId)!.reputation)
        if (game.managerFired) break
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) break
        game = resolved.game
      }
    }

    expect(repBySeason.length, `körningen borde ha slutfört minst en säsong (guard=${guard})`).toBeGreaterThan(0)

    // Regression: innan fixen nådde samma konstruktion (mittenklubb, placering
    // 5/8/6, socialMedia konstant på) rykte 100 inom tre säsonger — se
    // DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md tillägg B. Efter fixen ska
    // rykte hållas väl under taket eftersom klubben aldrig ligger i topp 3.
    for (const rep of repBySeason) {
      expect(rep, `rykte ${rep} nådde/närmade sig 100 trots att klubben är ett mittenlag — tick:en är fortfarande frikopplad från placering`).toBeLessThan(95)
    }
  }, 60000)
})
