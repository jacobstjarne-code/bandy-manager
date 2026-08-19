import { describe, it, expect, afterEach } from 'vitest'
import { selectThreatPlayer, displayThreatReasonLine, THREAT_REASON_LINES } from '../opponentAnalysisService'
import type { Player } from '../../entities/Player'
import { PlayerPosition, PlayerArchetype } from '../../enums'

// B4 (BANDYSPRAK_KALLASNING_2026-08-19.md): "Vem är svårast att möta" — ett
// namn plus ett skäl, alltid SAMMA spelare för samma trupp, aldrig slumpat.

function emptySeasonStats() {
  return {
    gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
    yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
  }
}

function emptyCareerStats() {
  return { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Erik',
    lastName: 'Karlsson',
    age: 22,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 5000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 70,
    form: 70,
    fitness: 80,
    sharpness: 65,
    currentAbility: 50,
    potentialAbility: 80,
    developmentRate: 75,
    injuryProneness: 25,
    discipline: 70,
    attributes: {
      skating: 45, acceleration: 48, stamina: 44, ballControl: 42, passing: 38,
      shooting: 55, dribbling: 40, vision: 36, decisions: 44, workRate: 42,
      positioning: 46, defending: 30, cornerSkill: 28, goalkeeping: 15, cornerRecovery: 50,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptySeasonStats(),
    careerStats: emptyCareerStats(),
    ...overrides,
  } as Player
}

describe('selectThreatPlayer', () => {
  it('väljer spelaren med högst currentAbility, samma urvalsprincip som keyPlayers', () => {
    const players = [
      makePlayer({ id: 'weak', currentAbility: 40 }),
      makePlayer({ id: 'strong', currentAbility: 70 }),
      makePlayer({ id: 'mid', currentAbility: 55 }),
    ]
    expect(selectThreatPlayer(players)?.playerId).toBe('strong')
  })

  it('konsekvent — samma trupp ger samma spelare och samma reasonKey varje gång, ingen slump', () => {
    const players = [
      makePlayer({ id: 'a', currentAbility: 60, attributes: { skating: 90, acceleration: 90, stamina: 50, ballControl: 90, passing: 30, shooting: 30, dribbling: 90, vision: 30, decisions: 40, workRate: 30, positioning: 30, defending: 20, cornerSkill: 20, goalkeeping: 10, cornerRecovery: 50 } }),
      makePlayer({ id: 'b', currentAbility: 40 }),
    ]
    const first = selectThreatPlayer(players)
    const second = selectThreatPlayer(players)
    expect(first).toEqual(second)
    expect(first?.playerId).toBe('a')
  })

  it('reasonKey speglar spelarens dominanta attributpar — evasive vid hög skating+dribbling', () => {
    const evasivePlayer = makePlayer({
      id: 'evasive', currentAbility: 60,
      attributes: { skating: 95, acceleration: 40, stamina: 40, ballControl: 40, passing: 40, shooting: 40, dribbling: 95, vision: 40, decisions: 40, workRate: 40, positioning: 40, defending: 20, cornerSkill: 20, goalkeeping: 10, cornerRecovery: 50 },
    })
    expect(selectThreatPlayer([evasivePlayer])?.reasonKey).toBe('evasive')
  })

  it('reasonKey speglar clinical vid hög positioning+shooting', () => {
    const clinicalPlayer = makePlayer({
      id: 'clinical', currentAbility: 60,
      attributes: { skating: 40, acceleration: 40, stamina: 40, ballControl: 40, passing: 40, shooting: 95, dribbling: 40, vision: 40, decisions: 40, workRate: 40, positioning: 95, defending: 20, cornerSkill: 20, goalkeeping: 10, cornerRecovery: 50 },
    })
    expect(selectThreatPlayer([clinicalPlayer])?.reasonKey).toBe('clinical')
  })

  it('utesluter skadade och avstängda spelare — samma filter som keyPlayers', () => {
    const players = [
      makePlayer({ id: 'injured', currentAbility: 90, isInjured: true }),
      makePlayer({ id: 'suspended', currentAbility: 85, suspensionGamesRemaining: 2 }),
      makePlayer({ id: 'healthy', currentAbility: 50 }),
    ]
    expect(selectThreatPlayer(players)?.playerId).toBe('healthy')
  })

  it('ingen tillgänglig spelare — undefined, ingen krasch', () => {
    expect(selectThreatPlayer([])).toBeUndefined()
    expect(selectThreatPlayer([makePlayer({ isInjured: true })])).toBeUndefined()
  })
})

describe('displayThreatReasonLine — CLAUDE.md: Code skriver aldrig svensk speltext', () => {
  afterEach(() => {
    // Städa ev. textrader ett test lagt till, så poolerna är tomma för nästa test
    for (const key of Object.keys(THREAT_REASON_LINES) as (keyof typeof THREAT_REASON_LINES)[]) {
      THREAT_REASON_LINES[key].length = 0
    }
  })

  it('tom pool (Opus har inte levererat än) — undefined, ingen platshållartext', () => {
    const threat = { playerId: 'p1', name: 'E. Karlsson', position: PlayerPosition.Forward, reasonKey: 'evasive' as const }
    expect(displayThreatReasonLine(threat)).toBeUndefined()
  })

  it('fylld pool — deterministiskt val, samma spelare ger alltid samma rad', () => {
    THREAT_REASON_LINES.evasive.push('Rad A', 'Rad B', 'Rad C')
    const threat = { playerId: 'stable-id', name: 'E. Karlsson', position: PlayerPosition.Forward, reasonKey: 'evasive' as const }
    const first = displayThreatReasonLine(threat)
    const second = displayThreatReasonLine(threat)
    expect(first).toBeDefined()
    expect(first).toBe(second)
    expect(['Rad A', 'Rad B', 'Rad C']).toContain(first)
  })
})
