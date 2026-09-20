/**
 * TILLÄGG 3 (2026-09-18) — matchmotorn kontrollerar inte tillgänglighet.
 *
 * ROT: `grep isInjured|suspensionGamesRemaining` i matchCore, squadEvaluator och
 * matchUtils ger noll träffar. Enda spärren var `setLineup`:s validering i
 * application-lagret, och en `managedClubPendingLineup` som satts förbi den
 * vägen spelade skadade och avstängda med FULL förmåga. AI-lagen filtrerades
 * korrekt hela tiden (generateAiLineup), så asymmetrin låg bara på spelarsidan.
 *
 * Utslaget var mätbart: fast elva med skadade intvingade gav +1,13 poäng per
 * säsong mot att välja bästa friska elvan.
 */
import { describe, it, expect } from 'vitest'
import { correctManagedLineup } from '../matchSimProcessor'
import { PlayerPosition, PlayerArchetype } from '../../../../domain/enums'
import type { Player } from '../../../../domain/entities/Player'
import type { Club } from '../../../../domain/entities/Club'
import type { TeamSelection } from '../../../../domain/entities/Fixture'

let pid = 0
function makePlayer(over: Partial<Player> = {}): Player {
  const id = over.id ?? `p${++pid}`
  return {
    id, firstName: 'Test', lastName: id, age: 26, nationality: 'SWE',
    clubId: 'club', isHomegrown: false,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 9, marketValue: 0,
    morale: 70, form: 70, fitness: 80, sharpness: 80, seasonForm: 70, isFullTimePro: false,
    currentAbility: 60, potentialAbility: 60, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60, shooting: 60,
      dribbling: 60, vision: 60, decisions: 60, workRate: 60, positioning: 60, defending: 60,
      cornerSkill: 60, goalkeeping: 20, cornerRecovery: 60,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...over,
  } as Player
}

function setup(over: Partial<Player>[] = []) {
  pid = 0
  const starters = Array.from({ length: 11 }, (_, i) => makePlayer({ id: `s${i}`, ...(over[i] ?? {}) }))
  const bench = Array.from({ length: 5 }, (_, i) => makePlayer({ id: `b${i}` }))
  const players = [...starters, ...bench]
  const club = { id: 'club', squadPlayerIds: players.map(p => p.id) } as Club
  const lineup: TeamSelection = {
    startingPlayerIds: starters.map(p => p.id),
    benchPlayerIds: bench.map(p => p.id),
    tactic: {} as TeamSelection['tactic'],
  }
  return { players, club, lineup }
}

describe('TILLÄGG 3 — otillgängliga byts ut före avspark', () => {
  it('en frisk elva lämnas orörd, och flaggan sätts inte', () => {
    const { players, club, lineup } = setup()
    const out = correctManagedLineup(lineup, club, players)
    expect(out.corrected).toEqual([])
    expect(out.lineup.startingPlayerIds).toEqual(lineup.startingPlayerIds)
  })

  it('en skadad startspelare byts mot en tillgänglig', () => {
    const { players, club, lineup } = setup([{ isInjured: true, injuryDaysRemaining: 14 }])
    const out = correctManagedLineup(lineup, club, players)
    expect(out.corrected).toHaveLength(1)
    expect(out.corrected[0].outId).toBe('s0')
    expect(out.corrected[0].inId).toBe(out.lineup.startingPlayerIds.find(id => !lineup.startingPlayerIds.includes(id)))
    expect(out.lineup.startingPlayerIds).not.toContain('s0')
    expect(out.lineup.startingPlayerIds).toHaveLength(11)
  })

  it('en avstängd startspelare byts ut', () => {
    const { players, club, lineup } = setup([{ suspensionGamesRemaining: 2 }])
    const out = correctManagedLineup(lineup, club, players)
    expect(out.corrected).toHaveLength(1)
    expect(out.corrected[0].outId).toBe('s0')
    expect(out.lineup.startingPlayerIds).not.toContain('s0')
  })

  it('en vilande spelare (A-H3 ben 2) byts ut — samma regel som AI:n', () => {
    const { players, club, lineup } = setup([{ restGamesRemaining: 1 }])
    const out = correctManagedLineup(lineup, club, players)
    expect(out.corrected).toHaveLength(1)
    expect(out.corrected[0].outId).toBe('s0')
  })

  it('ersättaren hämtas från bänken, inte utanför truppen', () => {
    const { players, club, lineup } = setup([{ isInjured: true }])
    const out = correctManagedLineup(lineup, club, players)
    const added = out.lineup.startingPlayerIds.filter(id => !lineup.startingPlayerIds.includes(id))
    expect(added).toHaveLength(1)
    expect(added[0].startsWith('b')).toBe(true)
    expect(out.corrected).toEqual([{ outId: 's0', inId: added[0] }])
  })

  it('flera otillgängliga byts alla, utan dubbletter i elvan', () => {
    const { players, club, lineup } = setup([
      { isInjured: true }, { suspensionGamesRemaining: 1 }, { restGamesRemaining: 2 },
    ])
    const out = correctManagedLineup(lineup, club, players)
    expect(out.corrected).toHaveLength(3)
    expect(new Set(out.corrected.map(c => c.outId))).toEqual(new Set(['s0', 's1', 's2']))
    expect(out.corrected.every(c => out.lineup.startingPlayerIds.includes(c.inId))).toBe(true)
    expect(new Set(out.lineup.startingPlayerIds).size).toBe(11)
  })

  it('utan tillgängliga ersättare lämnas spelaren kvar — elvan får hellre vara fel än tom', () => {
    const { players, club, lineup } = setup([{ isInjured: true }])
    // Slå ut hela bänken också.
    const crippled = players.map(p => p.id.startsWith('b') ? { ...p, isInjured: true } : p)
    const out = correctManagedLineup(lineup, club, crippled)
    expect(out.corrected).toEqual([])
    expect(out.lineup.startingPlayerIds).toContain('s0')
  })
})
