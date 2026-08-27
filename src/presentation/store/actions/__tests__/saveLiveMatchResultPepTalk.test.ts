/**
 * H2 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24) —
 * Granska visade tidigare ett annat paussnack än spelaren faktiskt valde.
 * Rotorsak: managerChoiceLog:s 'halftime_tactic'-post härleddes ur
 * htTempo/htPress/htMentality (HELT ANDRA taktikreglage på samma
 * pausskärm), inte ur pauseLean (Spak A, matchLiveText.ts) — spelarens
 * faktiska paussnack loggades aldrig.
 *
 * Detta testet driver den RIKTIGA, oförändrade matchActions(get,set)
 * .saveLiveMatchResult — inte en handrullad spegling — och verifierar att
 * pauseLean nu loggas som en 'pep_talk'-post med pauseLean-värdet rakt av
 * som detail (primärt beslut-ID), och att den separata quicksim-mekaniken
 * (lastHalftimeDecision → 'halftime_tactic') förblir orörd och oberoende.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import { FixtureStatus } from '../../../../domain/enums'
import { matchActions } from '../matchActions'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { MatchReport, TeamSelection } from '../../../../domain/entities/Fixture'

function makeTeamSelection(game: SaveGame, clubId: string): TeamSelection {
  const club = game.clubs.find(c => c.id === clubId)!
  const squad = game.players.filter(p => p.clubId === clubId).slice(0, 16)
  return {
    startingPlayerIds: squad.slice(0, 11).map(p => p.id),
    benchPlayerIds: squad.slice(11, 16).map(p => p.id),
    tactic: club.activeTactic,
  }
}

function makeEmptyReport(): MatchReport {
  return {
    playerRatings: {},
    shotsHome: 10, shotsAway: 10,
    onTargetHome: 5, onTargetAway: 5,
    savesHome: 3, savesAway: 3,
    cornersHome: 4, cornersAway: 4,
    penaltiesHome: 0, penaltiesAway: 0,
    possessionHome: 50, possessionAway: 50,
  }
}

function driveSaveLiveMatchResult(game: SaveGame, halftimeDecision?: 'push' | 'calm' | 'hold') {
  const fixture = game.fixtures.find(f => f.status === FixtureStatus.Scheduled)!
  let storeState: { game: SaveGame | null } = { game }
  const get = () => storeState
  const set = (partial: Partial<{ game: SaveGame | null }>) => {
    storeState = { ...storeState, ...partial }
  }
  const actions = matchActions(get, set)
  actions.saveLiveMatchResult(
    fixture.id, 2, 1, [], makeEmptyReport(),
    makeTeamSelection(game, fixture.homeClubId),
    makeTeamSelection(game, fixture.awayClubId),
    undefined, undefined, undefined,
    halftimeDecision,
  )
  return storeState.game!.fixtures.find(f => f.id === fixture.id)!
}

describe('saveLiveMatchResult — pep_talk loggar pauseLean rakt av (H2)', () => {
  it('pauseLean="calm" loggas som pep_talk med detail:"calm", ingen halftime_tactic', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const resolved = driveSaveLiveMatchResult(game, 'calm')

    const log = resolved.report?.managerChoiceLog ?? []
    const pepTalk = log.find(e => e.type === 'pep_talk')
    expect(pepTalk).toBeDefined()
    expect(pepTalk!.detail).toBe('calm')
    expect(log.find(e => e.type === 'halftime_tactic')).toBeUndefined()
  })

  it('pauseLean="push" loggas som pep_talk med detail:"push"', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 2 })
    const resolved = driveSaveLiveMatchResult(game, 'push')
    const pepTalk = resolved.report?.managerChoiceLog?.find(e => e.type === 'pep_talk')
    expect(pepTalk?.detail).toBe('push')
  })

  it('ingen pauseLean given: ingen pep_talk-post alls', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 3 })
    const resolved = driveSaveLiveMatchResult(game, undefined)
    expect(resolved.report?.managerChoiceLog?.find(e => e.type === 'pep_talk')).toBeUndefined()
  })

  it('quicksim-vägen (lastHalftimeDecision) loggar fortfarande halftime_tactic, oberoende av pep_talk', () => {
    let game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 4 })
    game = { ...game, lastHalftimeDecision: 'pressa' }
    const resolved = driveSaveLiveMatchResult(game, undefined)
    const log = resolved.report?.managerChoiceLog ?? []
    expect(log.find(e => e.type === 'halftime_tactic')?.detail).toBe('increased_pressure')
    expect(log.find(e => e.type === 'pep_talk')).toBeUndefined()
  })
})
