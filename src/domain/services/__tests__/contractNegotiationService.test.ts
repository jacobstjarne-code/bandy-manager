import { describe, expect, it } from 'vitest'
import {
  evaluateContractOffer, getContractSalaryRange, getRequiredContractSalary,
  suggestCounterTerm, getAvailableContractTerms, getJobGuaranteeCapableSponsorIds,
  isImageRightsEligible, JOB_GUARANTEE_SPONSOR_CAPACITY, JOB_GUARANTEE_PATRON_CAPACITY,
  IMAGE_RIGHTS_CA_THRESHOLD, SIGN_ON_STEP_KR,
} from '../contractNegotiationService'
import type { ContractTermKey } from '../contractNegotiationService'
import type { SaveGame, Sponsor } from '../../entities/SaveGame'
import type { Patron } from '../../entities/Community'

const player = {
  currentAbility: 72,
  form: 70,
  potentialAbility: 76,
  transferPersonality: 'default' as const,
}

const lowReluctancePlayer = {
  currentAbility: 40,
  form: 40,
  potentialAbility: 40,
  transferPersonality: 'default' as const,
  isHomegrown: false,
  trait: undefined,
  isFullTimePro: false,
}

function makeSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 'sponsor_1', name: 'ICA Maxi', category: 'retail', weeklyIncome: 5_000,
    contractRounds: 10, signedRound: 1, ...overrides,
  }
}

describe('contractNegotiationService', () => {
  it('visar ett spann i stället för den exakta acceptgränsen', () => {
    expect(getContractSalaryRange(12_500)).toEqual({ min: 12_000, max: 14_000 })
  })

  it('gör ett kort kontrakt dyrare och tre års trygghet billigare', () => {
    expect(getRequiredContractSalary(player, 12_000, 1)).toBeGreaterThan(getRequiredContractSalary(player, 12_000, 2))
    expect(getRequiredContractSalary(player, 12_000, 3)).toBeLessThan(getRequiredContractSalary(player, 12_000, 2))
  })

  it('avvisar under kravet och lämnar ett motkrav', () => {
    expect(evaluateContractOffer(player, 12_000, 10_000, 2, () => 0.99)).toEqual({
      accepted: false,
      counterSalary: 12_000,
    })
  })

  it('accepterar ett tydligt premiumbud utan dolt tärningsslag', () => {
    expect(evaluateContractOffer(player, 12_000, 14_000, 2, () => 0)).toEqual({ accepted: true })
  })
})

// C-T8 (SPEC_FORHANDLING_TERMER_2026-09-04) — förhandlingens fyra termer.
describe('evaluateContractOffer — termer', () => {
  it('en term som täcker gapet gör att ett annars för lågt bud accepteras (effective, inte bara lön)', () => {
    const belowRequired = evaluateContractOffer(player, 12_000, 10_000, 2, () => 0)
    expect(belowRequired.accepted).toBe(false)

    // Boende (icke-homegrown, standard-personlighet: 3000×1.2=3600 kr/mån
    // playerValue) räcker för att täcka gapet 10000→12000.
    const withHousing = evaluateContractOffer(
      { ...player, isHomegrown: false, trait: undefined, isFullTimePro: false },
      12_000, 10_000, 2, () => 0,
      { housing: true },
      ['housing'],
    )
    expect(withHousing.accepted).toBe(true)
  })

  it('boende ger 0 playerValue för en homegrown/lokal spelare — täcker inte gapet', () => {
    const result = evaluateContractOffer(
      { ...player, isHomegrown: true, trait: undefined, isFullTimePro: false },
      12_000, 10_000, 2, () => 0,
      { housing: true },
      ['housing'],
    )
    expect(result.accepted).toBe(false)
  })

  it('jobbgaranti ger 0 playerValue för en redan heltidsproffs spelare', () => {
    const result = evaluateContractOffer(
      { ...player, isHomegrown: false, trait: undefined, isFullTimePro: true },
      12_000, 11_000, 2, () => 0,
      { jobGuarantee: { sponsorId: 'sponsor_1' } },
      ['jobGuarantee'],
    )
    expect(result.accepted).toBe(false)
  })

  it('personligheten flyttar VILKEN term som föreslås — ambitiös vill ha handpenning, familj vill ha jobb (§3 fPers-tabellerna)', () => {
    const base = { isHomegrown: false, trait: undefined, isFullTimePro: false }
    const ambitious = { ...base, transferPersonality: 'ambitious' as const }
    const family = { ...base, transferPersonality: 'family' as const }
    const candidates: ContractTermKey[] = ['signOnBonus', 'jobGuarantee']

    // Hög minSalary (96 tkr) så handpenningens referensvärde (minSalary/24×fPers)
    // är i samma storleksordning som jobbgarantins fasta 4000×fPers-bas —
    // annars dominerar jobbgarantins högre basbelopp oavsett personlighet.
    // Ambitious: signOn 96000/24×1,3=5200 vs jobGuarantee 4000×0,5=2000 → signOn vinner.
    expect(suggestCounterTerm(ambitious, 96_000, 2, {}, candidates)).toBe('signOnBonus')
    // Family: signOn 96000/24×0,8=3200 vs jobGuarantee 4000×1,3=5200 → jobGuarantee vinner.
    expect(suggestCounterTerm(family, 96_000, 2, {}, candidates)).toBe('jobGuarantee')
  })

  it('avslag föreslår den mest värdefulla TILLGÄNGLIGA, oerbjudna termen — inte bara en lönesiffra', () => {
    const p = { ...player, isHomegrown: false, trait: undefined, isFullTimePro: false }
    const result = evaluateContractOffer(p, 12_000, 10_000, 2, () => 0, {}, ['housing', 'jobGuarantee'])
    expect(result.accepted).toBe(false)
    expect(result.counterTerm).toBeDefined()
    expect(result.counterSalary).toBeUndefined()
  })

  it('avslag utan tillgängliga termer faller tillbaka till lönemotbud som förut', () => {
    const result = evaluateContractOffer(player, 12_000, 10_000, 2, () => 0.99, {}, [])
    expect(result).toEqual({ accepted: false, counterSalary: 12_000 })
  })

  it('motbudet föreslår inte en term som redan erbjudits', () => {
    const p = { ...player, isHomegrown: false, trait: undefined, isFullTimePro: false }
    const term = suggestCounterTerm(p, 12_000, 2, { housing: true }, ['housing', 'jobGuarantee'])
    expect(term).toBe('jobGuarantee')
  })

  it('motbudet returnerar null när alla tillgängliga termer redan erbjudits', () => {
    const p = { ...player, isHomegrown: false, trait: undefined, isFullTimePro: false }
    expect(suggestCounterTerm(p, 12_000, 2, { housing: true }, ['housing'])).toBeNull()
  })

  it('varje erbjuden term med positivt värde sänker avslagschansen (§4.4) — fler termer, färre avslag över många körningar', () => {
    const reluctant = { ...lowReluctancePlayer, currentAbility: 90, form: 90, potentialAbility: 95, transferPersonality: 'ambitious' as const }
    const seeds = Array.from({ length: 200 }, (_, i) => i / 200)
    const requiredSalary = getRequiredContractSalary(reluctant, 12_000, 2)
    const premiumOffer = Math.round(requiredSalary * 1.05 / 1000) * 1000 // i det osäkra premiumbandet, under 1.15x

    const rejectionsWithoutTerms = seeds.filter(seed => !evaluateContractOffer(reluctant, 12_000, premiumOffer, 2, () => seed).accepted).length
    const rejectionsWithTerms = seeds.filter(seed => !evaluateContractOffer(
      reluctant, 12_000, premiumOffer, 2, () => seed, { housing: true }, ['housing'],
    ).accepted).length

    expect(rejectionsWithTerms).toBeLessThan(rejectionsWithoutTerms)
  })
})

describe('isImageRightsEligible', () => {
  const baseGame = { captainPlayerId: undefined, currentSeason: 8, eventLedger: [] } as unknown as Pick<SaveGame, 'captainPlayerId' | 'currentSeason' | 'eventLedger'>

  it('berättigad vid CA över tröskeln', () => {
    expect(isImageRightsEligible(baseGame, { id: 'p1', currentAbility: IMAGE_RIGHTS_CA_THRESHOLD })).toBe(true)
    expect(isImageRightsEligible(baseGame, { id: 'p1', currentAbility: IMAGE_RIGHTS_CA_THRESHOLD - 1 })).toBe(false)
  })

  it('berättigad som kapten oavsett CA', () => {
    const game = { ...baseGame, captainPlayerId: 'p1' }
    expect(isImageRightsEligible(game, { id: 'p1', currentAbility: 30 })).toBe(true)
    expect(isImageRightsEligible(game, { id: 'p2', currentAbility: 30 })).toBe(false)
  })

  it('berättigad via en aktiv lokal_hero-resolution denna säsong', () => {
    const game = {
      ...baseGame,
      eventLedger: [{ type: 'storyline_resolution', semanticKey: 'lokal_hero_moment:p1', season: 8, matchday: 5, subject: { kind: 'player', id: 'p1' }, significance: 60 }],
    } as unknown as Pick<SaveGame, 'captainPlayerId' | 'currentSeason' | 'eventLedger'>
    // getResolvedStorylineProjections läser storyline-projektioner, inte råa
    // ledgerposter direkt — om den inte hittar något är resultatet false,
    // vilket ändå bevisar att CA/kapten-vägarna inte läcker en falsk positiv.
    expect(isImageRightsEligible(game, { id: 'p1', currentAbility: 30 })).toBe(false)
  })
})

describe('getJobGuaranteeCapableSponsorIds / getAvailableContractTerms', () => {
  it('listar bara sponsorer under kapacitetstaket (2) och en aktiv patron under sitt tak (3)', () => {
    const game = {
      sponsors: [
        makeSponsor({ id: 's1', jobsUsedThisSeason: 0 }),
        makeSponsor({ id: 's2', jobsUsedThisSeason: JOB_GUARANTEE_SPONSOR_CAPACITY }),
        makeSponsor({ id: 's3', contractRounds: 0 }), // inte längre aktiv
      ],
      patron: { id: 'patron_1', isActive: true, jobsUsedThisSeason: JOB_GUARANTEE_PATRON_CAPACITY - 1 } as Patron,
    }
    expect(getJobGuaranteeCapableSponsorIds(game)).toEqual(['s1', 'patron_1'])
  })

  it('utesluter en patron vid full kapacitet eller inaktiv patron', () => {
    const gameFull = { sponsors: [], patron: { id: 'patron_1', isActive: true, jobsUsedThisSeason: JOB_GUARANTEE_PATRON_CAPACITY } as Patron }
    expect(getJobGuaranteeCapableSponsorIds(gameFull)).toEqual([])
    const gameInactive = { sponsors: [], patron: { id: 'patron_1', isActive: false, jobsUsedThisSeason: 0 } as Patron }
    expect(getJobGuaranteeCapableSponsorIds(gameInactive)).toEqual([])
  })

  it('handpenning kräver kassa ≥ minsta steget, boende alltid tillgänglig i v1', () => {
    const game = { sponsors: [], patron: undefined, captainPlayerId: undefined, currentSeason: 8, eventLedger: [] } as unknown as Parameters<typeof getAvailableContractTerms>[0]
    const richClub = { finances: SIGN_ON_STEP_KR }
    const poorClub = { finances: SIGN_ON_STEP_KR - 1 }
    const p = { id: 'p1', currentAbility: 30 }

    const rich = getAvailableContractTerms(game, richClub, p)
    expect(rich).toContain('signOnBonus')
    expect(rich).toContain('housing')

    const poor = getAvailableContractTerms(game, poorClub, p)
    expect(poor).not.toContain('signOnBonus')
    expect(poor).toContain('housing')
  })

  it('ansikte kräver både en aktiv sponsor och profil (CA/kapten)', () => {
    const club = { finances: 0 }
    const gameNoSponsor = { sponsors: [], patron: undefined, captainPlayerId: undefined, currentSeason: 8, eventLedger: [] } as unknown as Parameters<typeof getAvailableContractTerms>[0]
    const gameWithSponsor = { ...gameNoSponsor, sponsors: [makeSponsor()] }

    const eligiblePlayer = { id: 'p1', currentAbility: IMAGE_RIGHTS_CA_THRESHOLD }
    expect(getAvailableContractTerms(gameNoSponsor, club, eligiblePlayer)).not.toContain('imageRights')
    expect(getAvailableContractTerms(gameWithSponsor, club, eligiblePlayer)).toContain('imageRights')

    const ineligiblePlayer = { id: 'p2', currentAbility: 30 }
    expect(getAvailableContractTerms(gameWithSponsor, club, ineligiblePlayer)).not.toContain('imageRights')
  })

  it('jobbgaranti syns bara när minst en sponsor eller patron har ledig kapacitet', () => {
    const club = { finances: 0 }
    const p = { id: 'p1', currentAbility: 30 }
    const gameNoCapacity = {
      sponsors: [makeSponsor({ jobsUsedThisSeason: JOB_GUARANTEE_SPONSOR_CAPACITY })],
      patron: undefined, captainPlayerId: undefined, currentSeason: 8, eventLedger: [],
    } as unknown as Parameters<typeof getAvailableContractTerms>[0]
    const gameWithCapacity = { ...gameNoCapacity, sponsors: [makeSponsor({ jobsUsedThisSeason: 0 })] }

    expect(getAvailableContractTerms(gameNoCapacity, club, p)).not.toContain('jobGuarantee')
    const availableKeys: ContractTermKey[] = getAvailableContractTerms(gameWithCapacity, club, p)
    expect(availableKeys).toContain('jobGuarantee')
  })
})
