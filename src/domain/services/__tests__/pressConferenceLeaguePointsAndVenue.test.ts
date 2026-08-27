import { describe, it, expect } from 'vitest'
import { generatePressConference } from '../pressConferenceService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../services/worldGenerator'
import { FixtureStatus } from '../../enums'
import type { Fixture } from '../../entities/Fixture'

/**
 * U2 (SLUTTEST_KO.md, 2026-08-17) — symptom 2 och 3.
 *
 * Symptom 2: en cupfinalseger kunde få frågan "Två viktiga poäng" trots att
 * cupmatcher inte ger ligapoäng. Symptom 3: en hemmamatch som slutade
 * oavgjort kunde få frågan "En poäng på bortaplan" (fel venue).
 *
 * Rotorsaken var att PressQuestion saknade en spärr för båda — bara
 * requireHome fanns. Kört N gånger med varierande rand() för att bevisa att
 * texten ALDRIG läcker in i fel kontext, inte bara att den händelsevis
 * uteblev en gång.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeFixture(game: ReturnType<typeof makeGame>, overrides: Partial<Fixture>): Fixture {
  const opponent = game.clubs.find(c => c.id !== game.managedClubId)!
  return {
    id: 'fx-test', leagueId: 'liga', season: game.currentSeason, roundNumber: 4, matchday: 4,
    homeClubId: game.managedClubId!, awayClubId: opponent.id,
    status: FixtureStatus.Completed, homeScore: 2, awayScore: 1, events: [],
    ...overrides,
  }
}

function allQuestionTexts(game: ReturnType<typeof makeGame>, fixture: Fixture, runs: number): string[] {
  const texts: string[] = []
  for (let i = 0; i < runs; i++) {
    let seed = i * 7919 + 13
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const event = generatePressConference(fixture, game, rand)
    if (event) texts.push(event.body)
  }
  return texts
}

describe('generatePressConference — symptom 2: ligapoäng-gaten', () => {
  it('cupfinalseger visar aldrig "Två viktiga poäng"', () => {
    const game = makeGame()
    const fixture = makeFixture(game, {
      homeScore: 3, awayScore: 1, isCup: true, isKnockout: true, isNeutralVenue: true,
      isCupFinalhelgen: true, roundNumber: 4,
    })
    const texts = allQuestionTexts(game, fixture, 60)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.some(t => t.includes('Två viktiga poäng'))).toBe(false)
  })

  it('en vanlig ligaseger KAN fortfarande visa "Två viktiga poäng"', () => {
    const game = makeGame()
    const fixture = makeFixture(game, { homeScore: 2, awayScore: 1, roundNumber: 8 })
    const texts = allQuestionTexts(game, fixture, 200)
    expect(texts.some(t => t.includes('Två viktiga poäng'))).toBe(true)
  })
})

describe('generatePressConference — symptom 3: hemma/borta-gaten', () => {
  it('hemmakryss visar aldrig "En poäng på bortaplan"', () => {
    const game = makeGame()
    const fixture = makeFixture(game, { homeScore: 1, awayScore: 1, roundNumber: 8 })
    const texts = allQuestionTexts(game, fixture, 60)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.some(t => t.includes('poäng på bortaplan'))).toBe(false)
  })

  it('ett bortakryss KAN fortfarande visa "En poäng på bortaplan"', () => {
    const game = makeGame()
    const opponent = game.clubs.find(c => c.id !== game.managedClubId)!
    const fixture = makeFixture(game, {
      homeClubId: opponent.id, awayClubId: game.managedClubId!,
      homeScore: 1, awayScore: 1, roundNumber: 8,
    })
    const texts = allQuestionTexts(game, fixture, 200)
    expect(texts.some(t => t.includes('poäng på bortaplan'))).toBe(true)
  })
})

function makeReport(overrides: Partial<Fixture['report']> = {}) {
  return {
    playerRatings: {}, shotsHome: 10, shotsAway: 10, onTargetHome: 5, onTargetAway: 5,
    savesHome: 3, savesAway: 3, cornersHome: 4, cornersAway: 4,
    penaltiesHome: 0, penaltiesAway: 0, possessionHome: 50, possessionAway: 50,
    ...overrides,
  }
}

describe('generatePressConference — PÅSTÅENDEKARTAN (2026-08-24): mittfälts-dominans-gaten', () => {
  it('hemmaseger med JÄMNA skott visar aldrig "dominerade mittfältet"', () => {
    const game = makeGame()
    const fixture = makeFixture(game, {
      homeScore: 2, awayScore: 1, roundNumber: 8,
      report: makeReport({ shotsHome: 10, shotsAway: 9 }),
    })
    const texts = allQuestionTexts(game, fixture, 60)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.some(t => t.includes('dominerade mittfältet'))).toBe(false)
  })

  it('hemmaseger med FAKTISKT skottöverläge (>4) KAN visa "dominerade mittfältet"', () => {
    const game = makeGame()
    const fixture = makeFixture(game, {
      homeScore: 2, awayScore: 1, roundNumber: 8,
      report: makeReport({ shotsHome: 16, shotsAway: 8 }),
    })
    const texts = allQuestionTexts(game, fixture, 200)
    expect(texts.some(t => t.includes('dominerade mittfältet'))).toBe(true)
  })

  it('bortaseger där MOTSTÅNDAREN faktiskt dominerade skotten visar aldrig "dominerade mittfältet"', () => {
    const game = makeGame()
    const opponent = game.clubs.find(c => c.id !== game.managedClubId)!
    const fixture = makeFixture(game, {
      homeClubId: opponent.id, awayClubId: game.managedClubId!,
      homeScore: 1, awayScore: 2, roundNumber: 8,
      // Managed club (borta) vann matchen men opponenten (hemma) hade fler skott.
      report: makeReport({ shotsHome: 16, shotsAway: 8 }),
    })
    const texts = allQuestionTexts(game, fixture, 60)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.some(t => t.includes('dominerade mittfältet'))).toBe(false)
  })
})

describe('generatePressConference — symptom 1: straffseger är inte "oavgjort"', () => {
  it('en cupsemifinal-straffseger frågar inte "En poäng på bortaplan"', () => {
    const game = makeGame()
    const fixture = makeFixture(game, {
      homeScore: 2, awayScore: 2, wentToPenalties: true, penaltyResult: { home: 5, away: 4 },
      isCup: true, isKnockout: true, roundNumber: 3,
    })
    const texts = allQuestionTexts(game, fixture, 60)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.some(t => t.includes('poäng på bortaplan'))).toBe(false)
  })
})
