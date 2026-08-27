/**
 * H4-uppföljning (2026-08-26): "cs_over_70" var en hård tröskel — cs=70 gav
 * 0 kr, cs=71 gav ett fast 80 000 kr engångsbidrag. Kodverifierat generellt
 * (gäller alla 12 klubbar, ingen scoping) och en bidragande orsak till
 * avskedsfrekvens-klippan mellan communityStanding 70/71. Ersatt med en
 * kontinuerlig skala: 0 kr vid/under 50, taket (80 000) vid 90+, jämn
 * linjär övergång däremellan — ingen diskret ~80k-skillnad kvar mellan två
 * intilliggande communityStanding-värden.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { checkContextualSponsors, applyOneTimeKommunstod } from '../contextualSponsorService'
import type { SaveGame } from '../../entities/SaveGame'
import type { StandingRow } from '../../entities/Standing'

function makeGame(communityStanding: number): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  return { ...game, communityStanding, sponsors: [] }
}

function makeStandings(game: SaveGame): StandingRow[] {
  return game.clubs.map((c, i) => ({
    clubId: c.id, played: 5, wins: 2, draws: 1, losses: 2,
    goalsFor: 10, goalsAgainst: 10, goalDifference: 0, points: 7, position: i + 1,
  }))
}

describe('checkContextualSponsors — H4: kommunstöd skalar kontinuerligt, ingen diskret 70/71-klippa', () => {
  it('communityStanding 70 och 71 ger nästan identiskt belopp — ingen ~80k-klippa mellan dem', () => {
    const game70 = makeGame(70)
    const game71 = makeGame(71)
    const result70 = checkContextualSponsors(game70, makeStandings(game70), 5)
    const result71 = checkContextualSponsors(game71, makeStandings(game71), 5)

    const amount70 = result70.newSponsors.find(s => s.triggeredBy === 'cs_over_70')?.oneTimeAmount ?? 0
    const amount71 = result71.newSponsors.find(s => s.triggeredBy === 'cs_over_70')?.oneTimeAmount ?? 0

    // Gamla beteendet: 0 mot 80 000 (en skillnad på 80 000). Nya: en enhets
    // skillnad i communityStanding ska ge en liten, proportionell skillnad,
    // inte hela beloppet.
    expect(Math.abs(amount71 - amount70)).toBeLessThan(5000)
    expect(amount70).toBeGreaterThan(0)
  })

  it('communityStanding 50 eller lägre ger inget kommunstöd alls (golv, inte 0-kr-brus)', () => {
    const game = makeGame(50)
    const result = checkContextualSponsors(game, makeStandings(game), 5)
    expect(result.newSponsors.find(s => s.triggeredBy === 'cs_over_70')).toBeUndefined()
  })

  it('communityStanding 90+ ger hela taket (80 000 kr), inte mer', () => {
    const game = makeGame(95)
    const result = checkContextualSponsors(game, makeStandings(game), 5)
    const sponsor = result.newSponsors.find(s => s.triggeredBy === 'cs_over_70')
    expect(sponsor?.oneTimeAmount).toBe(80_000)
  })

  it('utbetalningen (applyOneTimeKommunstod) betalar EXAKT det skalade beloppet, inte den gamla fasta konstanten', () => {
    const game = makeGame(70)
    const { newSponsors } = checkContextualSponsors(game, makeStandings(game), 5)
    const scaledAmount = newSponsors.find(s => s.triggeredBy === 'cs_over_70')!.oneTimeAmount!
    expect(scaledAmount).toBeLessThan(80_000) // cs=70 ska INTE ge hela taket

    const gameWithSponsor = { ...game, sponsors: newSponsors }
    const managedClub = gameWithSponsor.clubs.find(c => c.id === gameWithSponsor.managedClubId)!
    const financesBefore = managedClub.finances

    const { updatedGame, paid } = applyOneTimeKommunstod(gameWithSponsor)
    expect(paid).toBe(true)
    const financesAfter = updatedGame.clubs.find(c => c.id === gameWithSponsor.managedClubId)!.finances
    expect(financesAfter - financesBefore).toBe(scaledAmount)
  })

  it('en sponsor skapad FÖRE detta fält fanns (oneTimeAmount saknas) faller tillbaka till hela beloppet, inte 0', () => {
    const game = makeGame(70)
    const legacySponsor = {
      id: 'contextual_cs70_2025', name: 'Test Kommunstöd', category: 'Kommunalt',
      weeklyIncome: 0, contractRounds: 1, signedRound: 5,
      tier: 'contextual_kommun' as const, triggeredBy: 'cs_over_70' as const,
      triggeredSeason: game.currentSeason, expiresSeason: game.currentSeason, isOneTime: true,
      // oneTimeAmount saknas medvetet — simulerar en gammal save
    }
    const gameWithLegacySponsor = { ...game, sponsors: [legacySponsor] }
    const { updatedGame, paid } = applyOneTimeKommunstod(gameWithLegacySponsor)
    expect(paid).toBe(true)
    const financesDelta = updatedGame.clubs.find(c => c.id === game.managedClubId)!.finances
      - game.clubs.find(c => c.id === game.managedClubId)!.finances
    expect(financesDelta).toBe(80_000)
  })
})
