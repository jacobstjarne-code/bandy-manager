import { describe, it, expect } from 'vitest'
import { calculateKommunBidrag } from '../politicianService'
import type { LocalPolitician } from '../../entities/Community'
import type { Club } from '../../entities/Club'
import type { SaveGame } from '../../entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../enums'

function makePolitician(overrides: Partial<LocalPolitician> = {}): LocalPolitician {
  return {
    name: 'Test Politiker',
    title: 'Kommunalråd',
    party: 'S',
    agenda: 'savings',
    relationship: 40,
    kommunBidrag: 30000,
    generosity: 60,
    ...overrides,
  }
}

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club_test',
    name: 'Testklubb',
    shortName: 'TEST',
    region: 'Mälardalen',
    reputation: 60,
    finances: 500000,
    wageBudget: 200000,
    transferBudget: 100000,
    youthQuality: 50,
    youthRecruitment: 50,
    youthDevelopment: 50,
    facilities: 50,
    boardExpectation: ClubExpectation.MidTable,
    fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced,
    hasArtificialIce: false,
    ...overrides,
  } as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    youthTeam: { players: [] },
    communityActivities: undefined,
    ...overrides,
  } as unknown as SaveGame
}

// DOM_FRAMGANGSEKONOMIN_UPPSIDAN_2026-08-31.md, DIAGNOS REVIDERAD (2026-09-01):
// communityMod var en olimiterad linjär 0-2-skalning mot CS — dämpad med
// D031:s getCsDiminishingFactor, konsekvent med economyService.ts's kommunBidrag.
describe('calculateKommunBidrag — CS-dämpning (getCsDiminishingFactor)', () => {
  it('orört vid cs<=55 (SKYDDAT: låg-CS/Survive-klubbar opåverkade)', () => {
    const politician = makePolitician({ generosity: 60 })
    const club = makeClub()
    const game = makeGame()
    // communityMod = cs/50 × 1.0 (ingen dämpning under golvet)
    const result = calculateKommunBidrag(politician, club, 50, game)
    expect(result).toBe(Math.round(30000 * 0.6 * (50 / 50)))
  })

  it('dämpat vid cs100 — inte längre den odämpade 2,0×-toppen', () => {
    const politician = makePolitician({ generosity: 60 })
    const club = makeClub()
    const game = makeGame()
    const result = calculateKommunBidrag(politician, club, 100, game)
    // Odämpad hade varit 30000×0.6×2.0=36000. Med getCsDiminishingFactor(100)=0.25: 30000×0.6×2.0×0.25=9000.
    expect(result).toBe(9000)
  })

  it('lokStöd/agendaBonus/relBonus opåverkade av CS-dämpningen', () => {
    const politician = makePolitician({ generosity: 60, agenda: 'prestige', relationship: 80 })
    const club = makeClub({ reputation: 70 })
    const game = makeGame({ youthTeam: { players: [{ id: 'y1' } as never] } })
    const result = calculateKommunBidrag(politician, club, 100, game)
    // communityMod-term: 30000×0.6×2.0×0.25=9000. lokStöd: 1×100=100. agendaBonus (prestige, rep>65): 10000. relBonus (rel>70): 10000.
    expect(result).toBe(9000 + 100 + 10000 + 10000)
  })
})
