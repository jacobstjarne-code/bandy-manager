import { describe, it, expect } from 'vitest'
import { generatePressConference } from '../pressConferenceService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../services/worldGenerator'
import { FixtureStatus } from '../../enums'
import type { Fixture } from '../../entities/Fixture'
import type { SaveGame } from '../../entities/SaveGame'
import type { StorylineEntry } from '../../entities/Narrative'

/**
 * High 4 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * pressminnet. Samma kontraktsfråga återkom sex raka matcher, kaptenfrågan
 * ~åtta gånger — ENDA spärren var en per-match slumpchans, ingen räkning.
 * Efter att en spelare gick heltidsproffs erbjöds fortfarande dagjobbssvaret
 * "Han går till jobbet klockan sex."
 */

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

function makeFixture(game: SaveGame, overrides: Partial<Fixture> = {}): Fixture {
  const opponent = game.clubs.find(c => c.id !== game.managedClubId)!
  return {
    id: 'fx-test', leagueId: 'liga', season: game.currentSeason, roundNumber: 4, matchday: 4,
    homeClubId: game.managedClubId!, awayClubId: opponent.id,
    status: FixtureStatus.Completed, homeScore: 2, awayScore: 1, events: [],
    ...overrides,
  }
}

function proStory(game: SaveGame, playerId: string): StorylineEntry {
  return {
    id: 'story_pro_1', type: 'went_fulltime_pro', season: game.currentSeason, matchday: 2,
    playerId, description: '', displayText: '', resolved: true,
  }
}

function runMany(game: SaveGame, fixture: Fixture, runs: number) {
  const events = []
  for (let i = 0; i < runs; i++) {
    let seed = i * 7919 + 13
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const event = generatePressConference(fixture, game, rand)
    if (event) events.push(event)
  }
  return events
}

describe('generatePressConference — High 4: dagjobbs-state-gate', () => {
  it('went_fulltime_pro-frågan erbjuder aldrig dagjobbssvaret ("går till jobbet klockan sex")', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    game = {
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      storylines: [proStory(game, managedPlayer.id)],
    }
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    const proQuestionEvents = events.filter(e => e.body.includes('slutade jobbet för att satsa på bandyn'))
    expect(proQuestionEvents.length).toBeGreaterThan(0)
    for (const e of proQuestionEvents) {
      expect(e.choices.some(c => c.label.includes('går till jobbet klockan sex'))).toBe(false)
    }
  })

  it('rescued_from_unemployment-frågan tillåter dagjobbssvaret för en spelare som INTE är heltidsproffs', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    game = {
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: false } : p),
      storylines: [{
        id: 'story_rescue_1', type: 'rescued_from_unemployment', season: game.currentSeason, matchday: 2,
        playerId: managedPlayer.id, description: '', displayText: '', resolved: true,
      }],
    }
    // Behöver en matchande målskytt för "resa tillbaka"-varianten (annars väljs varsel-varianten utan tp_liv1)
    const fixture = makeFixture(game, {
      events: [{ type: 'goal' as never, playerId: managedPlayer.id, clubId: game.managedClubId!, minute: 10 }],
    })
    const events = runMany(game, fixture, 300)
    const rescueQuestionEvents = events.filter(e => e.body.includes('resa tillbaka'))
    expect(rescueQuestionEvents.length).toBeGreaterThan(0)
    expect(rescueQuestionEvents.some(e => e.choices.some(c => c.label.includes('går till jobbet klockan sex')))).toBe(true)
  })
})

describe('generatePressConference — High 4: storylineBudgetOk (max huvudfråga + en uppföljning per säsong)', () => {
  it('en frisk storyline (ingen tidigare narrativeLog-post) KAN ge sin fråga', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    game = {
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      storylines: [proStory(game, managedPlayer.id)],
      narrativeLog: [],
    }
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    expect(events.some(e => e.body.includes('slutade jobbet för att satsa på bandyn'))).toBe(true)
  })

  it('en storyline som redan använt BÅDA sina press-tillfällen denna säsong ger aldrig frågan igen', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    const story = proStory(game, managedPlayer.id)
    game = {
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      storylines: [story],
      narrativeLog: [
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason, round: 2 },
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason, round: 6 },
      ],
    }
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    expect(events.some(e => e.body.includes('slutade jobbet för att satsa på bandyn'))).toBe(false)
  })

  it('en storyline som använt sitt EN tillfälle förra säsongen kan ändå ge frågan i EN NY säsong (räkningen är per säsong)', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    const story = proStory(game, managedPlayer.id)
    game = {
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      storylines: [{ ...story, season: game.currentSeason }],
      narrativeLog: [
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason - 1, round: 20 },
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason - 1, round: 21 },
      ],
    }
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    expect(events.some(e => e.body.includes('slutade jobbet för att satsa på bandyn'))).toBe(true)
  })
})
