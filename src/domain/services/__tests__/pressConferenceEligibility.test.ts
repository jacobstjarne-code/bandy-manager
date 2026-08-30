import { describe, it, expect } from 'vitest'
import { generatePressConference, PRESS_RESPONSE_COOLDOWN_PREFIX } from '../pressConferenceService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../services/worldGenerator'
import { FixtureStatus } from '../../enums'
import type { Fixture } from '../../entities/Fixture'
import type { Scandal } from '../scandalService'

/**
 * HIGH 7 (audit 2026-08-29, docs/incoming/
 * BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md) —
 * regressionstester för de KONKRETA buggarna auditen citerade:
 *
 *   "`Derby vinner man med hjärtat` dök upp efter icke-derby."
 *   "`Att förlora hemma` erbjöds efter bortaförlust."
 *   "playoff-copy efter avslutad serie" (generaliserat till: slutspels-/
 *   cupspecifik text efter en vanlig ligaseger, samma bucket-läcka).
 *
 * Rotorsaken (verifierad i koden innan fixen): `cl07` ("Derby vinner man
 * med hjärtat", tag `win_derby`) låg i `preferIds` på fyra frågor som INTE
 * var derby-gatade ("Tidningarna pratar mer om ekonomi...", "Publiken
 * sjöng hela vägen") — preferIds-slotten i `buildPressResponses` läste
 * bara ID:t rakt av, utan att fråga TAG_DEFS.matchesContext() om taggen
 * faktiskt passade. Samma sak för `cl14` ("Att förlora hemma...") i den
 * ogaterade 'loss'-frågan "Supportrarna är besvikna".
 *
 * Testerna kör många seedade rundor och letar efter response-ID:t i
 * `event.choices` (inte bara textmatchning) — choices[].id === response.id,
 * se pressConferenceService.ts.
 */
function makeGame(clubId: string, seed = 1) {
  return createNewGame({ managerName: 'Test', clubId, seed })
}

function makeFixture(game: ReturnType<typeof makeGame>, opponentId: string, overrides: Partial<Fixture>): Fixture {
  return {
    id: 'fx-test', leagueId: 'liga', season: game.currentSeason, roundNumber: 8, matchday: 8,
    homeClubId: game.managedClubId!, awayClubId: opponentId,
    status: FixtureStatus.Completed, homeScore: 2, awayScore: 1, events: [],
    ...overrides,
  }
}

function allChoiceIds(game: ReturnType<typeof makeGame>, fixture: Fixture, runs: number): Set<string> {
  const ids = new Set<string>()
  for (let i = 0; i < runs; i++) {
    let seed = i * 7919 + 13
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const event = generatePressConference(fixture, game, rand)
    if (event) for (const c of event.choices) ids.add(c.id)
  }
  return ids
}

function withScandalThisSeason(game: ReturnType<typeof makeGame>): ReturnType<typeof makeGame> {
  const scandal: Scandal = {
    id: 'scandal-test', season: game.currentSeason, triggerRound: 1, type: 'sponsor_collapse',
    affectedClubId: game.managedClubId!, resolutionRound: 5, isResolved: false,
  }
  return { ...game, scandalHistory: [scandal] }
}

// SÖDERFORS (rival: skutskar/vastanfors) vs GAGNEF (ingen rivalitet med Söderfors) — icke-derby.
const MANAGED = 'club_soderfors'
const NON_RIVAL_OPPONENT = 'club_gagnef'
const RIVAL_OPPONENT = 'club_skutskar'

describe('HIGH 7 — cl07 ("Derby vinner man med hjärtat") kan inte längre läcka via preferIds', () => {
  it('en icke-derbyseger med skandal-kontext (frågan som tidigare läckte cl07) visar aldrig cl07', () => {
    const game = withScandalThisSeason(makeGame(MANAGED))
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 3, awayScore: 1 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.size).toBeGreaterThan(0)
    expect(ids.has('cl07')).toBe(false)
  })

  it('en icke-derbyseger (ingen skandal) visar aldrig cl07 via den generiska poolen heller', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl07')).toBe(false)
  })

  it('en FAKTISK derbyseger KAN fortfarande visa cl07 (fixen stänger inte av det legitima fallet)', () => {
    const game = withScandalThisSeason(makeGame(MANAGED))
    const fixture = makeFixture(game, RIVAL_OPPONENT, { homeScore: 3, awayScore: 1 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl07')).toBe(true)
  })
})

describe('HIGH 7 — cl14 ("Att förlora hemma...") kan inte längre läcka efter en bortaförlust', () => {
  it('en bortaförlust visar aldrig cl14, oavsett vilken förlustfråga som slumpas fram', () => {
    const game = makeGame(MANAGED)
    // Managed spelar BORTA (homeClubId = motståndaren) och förlorar.
    const fixture: Fixture = {
      id: 'fx-away-loss', leagueId: 'liga', season: game.currentSeason, roundNumber: 8, matchday: 8,
      homeClubId: NON_RIVAL_OPPONENT, awayClubId: game.managedClubId!,
      status: FixtureStatus.Completed, homeScore: 2, awayScore: 1, events: [],
    }
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.size).toBeGreaterThan(0)
    expect(ids.has('cl14')).toBe(false)
  })

  it('en HEMMAförlust KAN fortfarande visa cl14 (fixen stänger inte av det legitima fallet)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 1, awayScore: 2 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl14')).toBe(true)
  })
})

describe('HIGH 7 — tävlingsspecifik text läcker inte längre via generic-bucketen', () => {
  it('en vanlig ligaseger visar aldrig cl24 ("...uppvärmningen", playoff_win)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl24')).toBe(false)
  })

  it('en vanlig ligaseger visar aldrig cl26 ("Cupen har sin egen magi", cup_win)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl26')).toBe(false)
  })

  it('en vanlig ligaseger visar aldrig cl27 ("SM-finalen på Studenternas", final_pre)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1 })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl27')).toBe(false)
  })

  it('en slutspelsseger som INTE är finalen visar aldrig cl27 (finalOnly stänger kvarts-/semifinal-läckan)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, {
      homeScore: 3, awayScore: 1, isKnockout: true, roundNumber: 28, matchday: 28,
    })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl27')).toBe(false)
    // Sanity: playoff_win (cl24) SKA kunna visas här — bevisar att den här
    // matchen faktiskt går genom playoff-grenen (annars vore testet ovan tomt).
    expect(ids.has('cl24')).toBe(true)
  })

  it('en cupvinst KAN fortfarande visa cl26 (fixen stänger inte av det legitima fallet)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1, isCup: true })
    const ids = allChoiceIds(game, fixture, 300)
    expect(ids.has('cl26')).toBe(true)
  })
})

describe('HIGH 7 — cooldown bland det strukturellt behöriga urvalet', () => {
  it('ett svar som redan loggats denna säsong (narrativeBeatLog) erbjuds inte igen samma säsong', () => {
    const baseGame = makeGame(MANAGED)
    const fixture = makeFixture(baseGame, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1 })

    // Baseline: utan cooldown-post ska cl09 (tag win_any, generic-bucket
    // 'win', nås ALDRIG via preferIds — ren generic/contextMatched-kandidat)
    // kunna dyka upp över tillräckligt många körningar.
    const idsWithoutCooldown = allChoiceIds(baseGame, fixture, 300)
    expect(idsWithoutCooldown.has('cl09')).toBe(true)

    // Med en narrativeBeatLog-post för press_response_cl09 DENNA säsong ska
    // den aldrig erbjudas igen — samma mekanism som Birger-citat/burnout
    // (isOnCooldown, narrativeLogService.ts), inte en ny parallell logg.
    const gameWithCooldown = {
      ...baseGame,
      narrativeBeatLog: [
        { semanticKey: `${PRESS_RESPONSE_COOLDOWN_PREFIX}cl09`, season: baseGame.currentSeason, round: 1 },
      ],
    }
    const idsWithCooldown = allChoiceIds(gameWithCooldown, fixture, 300)
    expect(idsWithCooldown.has('cl09')).toBe(false)
  })

  it('cooldownen släpper om HELA den behöriga poolen är på cooldown (release-fallback, inte total tystnad)', () => {
    const game = makeGame(MANAGED)
    const fixture = makeFixture(game, NON_RIVAL_OPPONENT, { homeScore: 2, awayScore: 1 })
    // Generera en referenskörning för att se vilka ID:n som är eligible för
    // den här exakta matchen, logga ALLA av dem som "redan visade" denna
    // säsong, och bekräfta att generatePressConference ändå returnerar ett
    // event (fallbacken släpper spärren) i stället för att bli tomt/null.
    const reference = generatePressConference(fixture, game, () => 0.42)
    expect(reference).not.toBeNull()
    const allSeenIds = reference!.choices.map(c => c.id).filter(id => id !== 'refuse_press')
    const saturatedGame = {
      ...game,
      narrativeBeatLog: allSeenIds.map(id => ({
        semanticKey: `${PRESS_RESPONSE_COOLDOWN_PREFIX}${id}`,
        season: game.currentSeason,
        round: 1,
      })),
    }
    const event = generatePressConference(fixture, saturatedGame, () => 0.42)
    expect(event).not.toBeNull()
    expect(event!.choices.length).toBeGreaterThan(0)
  })
})
