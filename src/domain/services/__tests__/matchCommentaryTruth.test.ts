import { describe, expect, it } from 'vitest'
import { createHeadlessGame, autoSelectLineup } from '../../../../scripts/stress/fixtures'
import { simulateFirstHalf, simulateSecondHalf, type MatchCoreInput } from '../matchCore'
import { MatchEventType, WeatherCondition } from '../../enums'
import { mulberry32 } from '../../utils/random'

describe('commentary follows the actual match event and context', () => {
  it('keeps halftime events, cup rounds, indoor conditions and shot claims truthful across 120 matches', () => {
    const original = Math.random
    try {
      Math.random = mulberry32(400000)
      const game = createHeadlessGame(400000)
      const [home, away] = game.clubs
      for (const scenario of ['regular', 'cup', 'indoor']) for (let sample = 0; sample < 40; sample++) {
        Math.random = mulberry32(9700000 + sample)
        const input: MatchCoreInput = {
          fixture: { ...game.fixtures[0], id: `truth-${scenario}-${sample}`, homeClubId: home.id, awayClubId: away.id,
            isCup: scenario === 'cup', isKnockout: scenario === 'cup', roundNumber: 2, matchday: 2, attendance: 400 },
          homePlayers: game.players.filter(p => p.clubId === home.id), awayPlayers: game.players.filter(p => p.clubId === away.id),
          homeLineup: autoSelectLineup({ ...game, managedClubId: home.id }).managedClubPendingLineup!,
          awayLineup: autoSelectLineup({ ...game, managedClubId: away.id }).managedClubPendingLineup!,
          homeClubName: home.name, awayClubName: away.name, mode: 'full', seed: 700000 + sample,
          fixtureMonth: 8, hallInomhus: scenario === 'indoor', refStyle: 'strict',
          weather: scenario === 'indoor' ? { condition: WeatherCondition.HeavySnow, temperature: -8, windSpeed: 0 } as MatchCoreInput['weather'] : undefined,
        }
        const first = [...simulateFirstHalf(input)], half = first.at(-1)!
        const second = [...simulateSecondHalf({ ...input, initialHomeScore: half.homeScore, initialAwayScore: half.awayScore,
          initialShotsHome: half.shotsHome, initialShotsAway: half.shotsAway, initialOnTargetHome: half.onTargetHome, initialOnTargetAway: half.onTargetAway,
          initialCornersHome: half.cornersHome, initialCornersAway: half.cornersAway, matchProfile: half.matchProfile,
          initialHomeSuspensions: half.activeSuspensions.homeCount, initialAwaySuspensions: half.activeSuspensions.awayCount,
          initialHomeSuspensionTimers: half.activeSuspensions.homeTimers, initialAwaySuspensionTimers: half.activeSuspensions.awayTimers,
          commentaryMemory: half.commentaryMemory })]
        let previousShots = 0
        for (const step of [...first, ...second]) {
          const types = step.events.map(event => event.type)
          const text = step.commentary
          if (types.some(type => [MatchEventType.Goal, MatchEventType.Save, MatchEventType.Suspension].includes(type))) {
            expect(text).not.toMatch(/halvtid|^Paus\.|^45 minuter spelade|^Publiksiffran|^Speaker meddelar/i)
          }
          if (scenario === 'cup') expect(text).not.toMatch(/cupfinal|Kvarten väntar|Oktober|lyfta bucklan/i)
          if (scenario === 'indoor') expect(text).not.toMatch(/I snökaoset|Ur snöyran|snön hjälper|slaskig is/i)
          if (step.homeScore + step.awayScore > 0) expect(text).not.toContain('Ingen vill släppa in det första målet')
          if (types.includes(MatchEventType.Corner) && !types.includes(MatchEventType.Goal) && step.shotsHome + step.shotsAway === previousShots) {
            expect(text).not.toMatch(/skott|stolp|burgavel|avslut|skjuter/i)
          }
          expect(text).not.toMatch(/Friläge! Men avslutet går rakt på målvakten/)
          previousShots = step.shotsHome + step.shotsAway
        }
      }
    } finally { Math.random = original }
  })
})
