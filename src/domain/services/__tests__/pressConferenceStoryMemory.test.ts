import { describe, it, expect } from 'vitest'
import { generatePressConference } from '../pressConferenceService'
import { generateVarselEvent } from '../events/eventFactories'
import { resolveEvent } from '../events/eventResolver'
import { buildStorylineResolutionLedgerEntry } from '../storylineLedgerService'
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

function withCanonicalStorylines(game: SaveGame, storylines: StorylineEntry[]): SaveGame {
  const entries = storylines
    .map(storyline => buildStorylineResolutionLedgerEntry(storyline, game.currentMatchday))
    .filter(entry => entry !== null)

  return {
    ...game,
    storylines,
    eventLedger: [...(game.eventLedger ?? []), ...entries],
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
    game = withCanonicalStorylines({
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
    }, [proStory(game, managedPlayer.id)])
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    const proQuestionEvents = events.filter(e => e.body.includes('slutade jobbet för att satsa på bandyn'))
    expect(proQuestionEvents.length).toBeGreaterThan(0)
    for (const e of proQuestionEvents) {
      expect(e.choices.some(c => c.label.includes('går till jobbet klockan sex'))).toBe(false)
    }
  })

  it('ett verkligt flerspelarvarsel väljer den räddade målskyttens ankare och utesluter dagjobbssvaret', () => {
    let game = makeGame()
    const targets = game.players.filter(p => p.clubId === game.managedClubId).slice(0, 2)
    game = {
      ...game,
      players: game.players.map(p => targets.some(t => t.id === p.id)
        ? { ...p, isFullTimePro: false, salary: 10_000, dayJob: { title: 'Testjobb', flexibility: 50, weeklyIncome: 1_000 } }
        : p),
    }
    const affected = targets.map(t => game.players.find(p => p.id === t.id)!)
    const varsel = generateVarselEvent(affected, 'Testföretaget', game.currentSeason)
    game = resolveEvent({ ...game, pendingEvents: [varsel] }, varsel.id, 'offer_pro', undefined, true)
    expect(game.eventLedger?.filter(entry => (
      entry.type === 'storyline_resolution'
      && entry.semanticKey.includes(':went_fulltime_pro:')
    ))).toHaveLength(2)
    const scorer = affected[1]
    const fixture = makeFixture(game, {
      events: [{ type: 'goal' as never, playerId: scorer.id, clubId: game.managedClubId!, minute: 10 }],
    })
    const events = runMany(game, fixture, 300)
    const rescueQuestionEvents = events.filter(e => e.body.includes(`${scorer.firstName} ${scorer.lastName}s resa tillbaka`))
    expect(rescueQuestionEvents.length).toBeGreaterThan(0)
    expect(rescueQuestionEvents.every(e => !e.choices.some(c => c.label.includes('går till jobbet klockan sex')))).toBe(true)
  })
})

describe('generatePressConference — High 4: storylineBudgetOk (max huvudfråga + en uppföljning per säsong)', () => {
  it('kan återkalla galavinsten säsongen efter att priset frysts vid rollover', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    const story: StorylineEntry = {
      id: `story_gala_arets_spelare_${game.currentSeason - 1}`,
      type: 'gala_winner',
      season: game.currentSeason - 1,
      matchday: 22,
      playerId: managedPlayer.id,
      clubId: game.managedClubId,
      description: '',
      displayText: '',
      resolved: true,
    }
    game = withCanonicalStorylines({
      ...game,
      narrativeBeatLog: [],
    }, [story])
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)

    expect(events.some(e => e.body.includes(`${managedPlayer.firstName} ${managedPlayer.lastName} vann galan`))).toBe(true)
  })

  it('en frisk storyline (ingen tidigare narrativeBeatLog-post) KAN ge sin fråga', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    game = withCanonicalStorylines({
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      narrativeBeatLog: [],
    }, [proStory(game, managedPlayer.id)])
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    expect(events.some(e => e.body.includes('slutade jobbet för att satsa på bandyn'))).toBe(true)
  })

  it('en storyline som redan använt BÅDA sina press-tillfällen denna säsong ger aldrig frågan igen', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    const story = proStory(game, managedPlayer.id)
    game = withCanonicalStorylines({
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      narrativeBeatLog: [
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason, round: 2 },
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason, round: 6 },
      ],
    }, [story])
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    expect(events.some(e => e.body.includes('slutade jobbet för att satsa på bandyn'))).toBe(false)
  })

  it('en storyline som använt sitt EN tillfälle förra säsongen kan ändå ge frågan i EN NY säsong (räkningen är per säsong)', () => {
    let game = makeGame()
    const managedPlayer = game.players.find(p => p.clubId === game.managedClubId)!
    const story = proStory(game, managedPlayer.id)
    game = withCanonicalStorylines({
      ...game,
      players: game.players.map(p => p.id === managedPlayer.id ? { ...p, isFullTimePro: true } : p),
      narrativeBeatLog: [
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason - 1, round: 20 },
        { semanticKey: `press_storyline_${story.id}`, season: game.currentSeason - 1, round: 21 },
      ],
    }, [{ ...story, season: game.currentSeason }])
    const fixture = makeFixture(game)
    const events = runMany(game, fixture, 300)
    expect(events.some(e => e.body.includes('slutade jobbet för att satsa på bandyn'))).toBe(true)
  })
})
