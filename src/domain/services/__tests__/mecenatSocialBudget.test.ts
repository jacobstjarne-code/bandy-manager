/**
 * Medium 2 (Skutskär-auditen, 2026-08-22, Jacobs dom) — mecenat-socialpoolens
 * säsongsminne. Kodens enda spärr var tidigare per-mecenat `lastSocialRound`
 * — ingen koppling mellan mecenater eller mellan typer, så samma
 * bastuinbjudan kunde upprepas obegränsat. Max två sociala mecenatbeats per
 * säsong totalt, aldrig samma typ två gånger.
 */
import { describe, it, expect } from 'vitest'
import {
  generateMecenatAllianceEvent,
  generateSilentShoutEvent,
  generateSocialEvent,
  getMecenatSocialUsedTypes,
  getMecenatSocialType,
  MECENAT_SOCIAL_MAX_PER_SEASON,
} from '../mecenatService'
import type { Mecenat } from '../../entities/Mecenat'
import type { NarrativeLogEntry } from '../../entities/Narrative'

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1',
    name: 'Björn Lindqvist',
    gender: 'male',
    business: 'Lindqvist Fastigheter AB',
    businessType: 'it_miljonär',
    wealth: 50,
    personality: 'kalkylator',
    influence: 15,
    happiness: 70,
    goodwill: 60,
    contribution: 100000,
    totalContributed: 0,
    demands: [],
    socialExpectations: [],
    isActive: true,
    arrivedSeason: 1,
    silentShout: 0,
    ...overrides,
  }
}

const zeroRand = () => 0

describe('getMecenatSocialUsedTypes', () => {
  it('räknar bara mecenat_social_-nycklar för aktuell säsong', () => {
    const narrativeBeatLog: NarrativeLogEntry[] = [
      { semanticKey: 'mecenat_social_middag', season: 3, round: 5 },
      { semanticKey: 'mecenat_social_jakt', season: 2, round: 2 },
      { semanticKey: 'press_storyline_x', season: 3, round: 4 },
    ]
    const used = getMecenatSocialUsedTypes({ narrativeBeatLog, currentSeason: 3 })
    expect(used).toEqual(new Set(['middag']))
  })

  it('tom logg → tom mängd', () => {
    expect(getMecenatSocialUsedTypes({ narrativeBeatLog: undefined, currentSeason: 1 }).size).toBe(0)
  })
})

describe('getMecenatSocialType', () => {
  it('läser typen tillbaka ur nyckeln', () => {
    expect(getMecenatSocialType('mecenat_social_vinkväll')).toBe('vinkväll')
  })

  it('icke-matchande nyckel → undefined', () => {
    expect(getMecenatSocialType('press_storyline_x')).toBeUndefined()
  })
})

describe('generateSocialEvent — säsongsminnet', () => {
  it('utesluter redan använda typer denna säsong', () => {
    const mec = makeMecenat({ businessType: 'it_miljonär' }) // pool: middag, vinkväll
    const event = generateSocialEvent(mec, 3, 10, zeroRand, new Set(['middag']))
    expect(event).not.toBeNull()
    expect(event?.mecenatSocialKey).toBe('mecenat_social_vinkväll')
  })

  it('pool helt uttömd (enda typen redan använd) → null, ingen tyst repetition', () => {
    // brukspatron: jakt (bara matchday<=3), bastu_affärssamtal — vid matchday
    // 10 (vintersäsong) är jakt bortfiltrerad, kvar: bastu_affärssamtal.
    const mec = makeMecenat({ businessType: 'brukspatron' })
    const event = generateSocialEvent(mec, 3, 10, zeroRand, new Set(['bastu_affärssamtal']))
    expect(event).toBeNull()
  })

  it('ingen usedTypes-parameter (default) → beter sig som förut, väljer ur hela poolen', () => {
    const mec = makeMecenat({ businessType: 'it_miljonär' })
    const event = generateSocialEvent(mec, 3, 10, zeroRand)
    expect(event).not.toBeNull()
    expect(event?.mecenatSocialKey).toBe('mecenat_social_middag')
  })

  it('MECENAT_SOCIAL_MAX_PER_SEASON är 2 — budgeten callern (eventProcessor) grindar mot', () => {
    expect(MECENAT_SOCIAL_MAX_PER_SEASON).toBe(2)
  })
})

describe('mecenatlöften motsvarar deklarerad state-effekt', () => {
  it('socialeventet lovar bara den relationseffekt som faktiskt appliceras', () => {
    const event = generateSocialEvent(makeMecenat(), 3, 10, zeroRand)
    const accept = event?.choices.find(choice => choice.id === 'accept')

    expect(accept?.subtitle).toBe('🤝 +15 relation')
    expect(accept?.subtitle).not.toContain('träningsdag')
    expect(accept?.effect).toEqual({ type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 15 })
  })

  it('transferförslaget lovar inte finansiering när effekten bara ändrar relationen', () => {
    const event = generateSilentShoutEvent(makeMecenat({ silentShout: 50 }), 'Karl Karlsson', zeroRand)
    const accept = event?.choices.find(choice => choice.id === 'accept')

    expect(event?.body).not.toContain('halva kostnaden')
    expect(accept?.subtitle).toBe('🤝 +10 relation')
    expect(accept?.effect).toEqual({ type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 10 })
  })

  it('allianseventet lovar inte projektpengar när effekten bara ändrar relationerna', () => {
    const event = generateMecenatAllianceEvent(
      makeMecenat(),
      makeMecenat({ id: 'mec2', name: 'Anna Andersson' }),
      'en ny hall',
    )
    const accept = event.choices.find(choice => choice.id === 'accept')

    expect(event.body).not.toMatch(/finansiera|kostnaden/)
    expect(accept?.subtitle).toBe('🤝 +10 båda')
    expect(accept?.effect.type).toBe('multiEffect')
  })
})
