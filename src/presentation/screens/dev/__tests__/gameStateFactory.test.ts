/**
 * SLUTTEST/PORTAL-fabriksrapporten (2026-08-09). Kärnkravet från Jacob:
 * atRound måste faila högt på trasig fejkad historik, inte tyst producera en
 * save spelet aldrig kan nå. Detta testar just det, plus att de komponerbara
 * overrides träffar rätt antal spelare/slots.
 */
import { describe, it, expect } from 'vitest'
import {
  makeBaseGame, atRound, withInjuries, withSuspended, withLowMorale,
  withExpiringContracts, withLongestSurnames, withLineupSlots,
} from '../gameStateFactory'
import { FixtureStatus } from '../../../../domain/enums'

describe('gameStateFactory — atRound', () => {
  it('producerar ett konsekvent tillstånd vid en vanlig omgång', () => {
    const game = atRound(makeBaseGame({ seed: 3 }), 14)
    expect(game.currentMatchday).toBe(14)
    expect(game.standings.length).toBe(game.clubs.length)
    const completed = game.fixtures.filter(f => f.status === FixtureStatus.Completed && f.season === game.currentSeason)
    expect(completed.length).toBeGreaterThan(0)
    expect(completed.every(f => f.matchday < 14)).toBe(true)
  })

  it('kastar Error (inte tyst trasig save) om historiken saboteras innan anrop', () => {
    const base = atRound(makeBaseGame({ seed: 3 }), 14)
    // Ta bort en klubbs alla fixtures — fixtureCount/tableSum-invarianten ska brista.
    const sabotaged = { ...base, fixtures: base.fixtures.filter(f => !(f.homeClubId === base.clubs[0].id || f.awayClubId === base.clubs[0].id)) }
    expect(() => atRound(sabotaged, 16)).toThrow(/invarianter/)
  })

  it('är deterministisk för samma seed och omgång', () => {
    const a = atRound(makeBaseGame({ seed: 5 }), 10)
    const b = atRound(makeBaseGame({ seed: 5 }), 10)
    expect(a.standings).toEqual(b.standings)
  })

  // CI-flake-rotorsak (2026-08-20, taktik-scenens visual-regression): createNewGame
  // seedar assistantCoach på save_${Date.now()} — avsiktligt för riktiga spel, men gör
  // varje dev-scene som visar coach.name/personality-beroende text ickedeterministisk.
  // makeBaseGame skriver över med en seed-baserad coach; detta testet är grinden mot
  // att den regressionen smyger tillbaka.
  it('assistantCoach är deterministisk för samma seed, olik för olika seed', () => {
    const a = makeBaseGame({ seed: 7 })
    const b = makeBaseGame({ seed: 7 })
    const c = makeBaseGame({ seed: 8 })
    expect(a.assistantCoach).toEqual(b.assistantCoach)
    expect(a.assistantCoach).not.toEqual(c.assistantCoach)
  })
})

describe('gameStateFactory — squad-overrides', () => {
  it('withInjuries/withSuspended/withLowMorale/withExpiringContracts träffar exakt count spelare i den egna klubben', () => {
    const base = atRound(makeBaseGame({ seed: 3 }), 14)
    const kris = withExpiringContracts(withLowMorale(withSuspended(withInjuries(base, 1), 1), 1), 1)
    const managed = kris.players.filter(p => p.clubId === kris.managedClubId)
    expect(managed.filter(p => p.isInjured).length).toBe(1)
    expect(managed.filter(p => p.suspensionGamesRemaining > 0).length).toBe(1)
    expect(managed.filter(p => p.morale < 45).length).toBe(1)
    expect(managed.filter(p => p.contractUntilSeason <= kris.currentSeason).length).toBe(1)
  })

  it('withLongestSurnames byter bara den egna klubbens efternamn', () => {
    const base = atRound(makeBaseGame({ seed: 3 }), 14)
    const renamed = withLongestSurnames(base)
    const otherClubPlayer = renamed.players.find(p => p.clubId !== renamed.managedClubId)
    const originalOther = base.players.find(p => p.id === otherClubPlayer?.id)
    expect(otherClubPlayer?.lastName).toBe(originalOther?.lastName)
    const managedPlayer = renamed.players.find(p => p.clubId === renamed.managedClubId)
    expect(managedPlayer?.lastName.length).toBeGreaterThan(6)
  })
})

describe('gameStateFactory — withLineupSlots', () => {
  it('lämnar exakt emptyCount slots tomma, resten fyllda med spelare ur egna truppen', () => {
    const base = atRound(makeBaseGame({ seed: 3 }), 14)
    const withEmpty = withLineupSlots(base, { emptyCount: 3, formation: '532_tvatoppar' })
    const slots = withEmpty.managedClubPendingLineup?.tactic.lineupSlots ?? {}
    const filled = Object.values(slots).filter(v => v !== null)
    const empty = Object.values(slots).filter(v => v === null)
    expect(empty.length).toBe(3)
    expect(filled.length).toBe(8)
    expect(withEmpty.managedClubPendingLineup?.startingPlayerIds.length).toBe(8)
  })

  it('emptyCount=0 fyller alla 11 slots', () => {
    const base = atRound(makeBaseGame({ seed: 3 }), 14)
    const full = withLineupSlots(base, { emptyCount: 0, formation: '532_tvatoppar' })
    const slots = full.managedClubPendingLineup?.tactic.lineupSlots ?? {}
    expect(Object.values(slots).filter(v => v !== null).length).toBe(11)
  })

  it('inga skadade/avstängda spelare hamnar i startingPlayerIds', () => {
    const base = withInjuries(atRound(makeBaseGame({ seed: 3 }), 14), 2)
    const withEmpty = withLineupSlots(base, { emptyCount: 3, formation: '532_tvatoppar' })
    const injuredIds = new Set(base.players.filter(p => p.isInjured).map(p => p.id))
    expect(withEmpty.managedClubPendingLineup?.startingPlayerIds.some(id => injuredIds.has(id))).toBe(false)
  })
})
