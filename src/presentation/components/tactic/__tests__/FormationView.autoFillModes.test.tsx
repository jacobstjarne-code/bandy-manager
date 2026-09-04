// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FormationView } from '../FormationView'
import { FORMATIONS } from '../../../../domain/entities/Formation'
import {
  PlayerArchetype, PlayerPosition,
  TacticMentality, TacticTempo, TacticPassingRisk, TacticWidth,
  TacticAttackingFocus, CornerStrategy, PenaltyKillStyle,
} from '../../../../domain/enums'
import type { Player } from '../../../../domain/entities/Player'
import type { Tactic } from '../../../../domain/entities/Club'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement
let root: Root

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function renderFormation(tactic: Tactic, players: Player[]) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(
    <MemoryRouter>
      <FormationView tactic={tactic} players={players} onChange={t => { latestTactic = t }} />
    </MemoryRouter>,
  ))
}

let latestTactic: Tactic | null = null

function baseTactic(overrides: Partial<Tactic> = {}): Tactic {
  return {
    mentality: TacticMentality.Balanced,
    tempo: TacticTempo.Normal,
    passingRisk: TacticPassingRisk.Mixed,
    width: TacticWidth.Normal,
    attackingFocus: TacticAttackingFocus.Mixed,
    cornerStrategy: CornerStrategy.Standard,
    penaltyKillStyle: PenaltyKillStyle.Active,
    formation: '532_tvatoppar',
    ...overrides,
  }
}

function makePlayer(id: string, position: PlayerPosition, overrides: Partial<Player> = {}): Player {
  return {
    id,
    firstName: 'Test',
    lastName: id,
    age: 25,
    nationality: 'svenska',
    clubId: 'club_managed',
    isHomegrown: true,
    position,
    archetype: PlayerArchetype.TwoWaySkater,
    salary: 20000,
    contractUntilSeason: 2028,
    marketValue: 500000,
    morale: 70,
    form: 70,
    fitness: 90,
    sharpness: 90,
    seasonForm: 100, // eliminerar SEASON_FORM_FITNESS_SLACK-klampen i testet
    currentAbility: 50,
    potentialAbility: 60,
    developmentRate: 50,
    injuryProneness: 30,
    discipline: 70,
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    restGamesRemaining: 0,
    attributes: {
      skating: 50, acceleration: 50, stamina: 50, ballControl: 50,
      passing: 50, shooting: 50, dribbling: 50, vision: 50,
      decisions: 50, workRate: 50, positioning: 50, defending: 50,
      cornerSkill: 50, goalkeeping: 5, cornerRecovery: 50,
    },
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0,
      penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0,
      averageRating: 0, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  }
}

// 10 fyllnadsspelare, en per slot utom den slot testet lämnar tomt.
const FILLED_SLOT_IDS_EXCEPT = (empty: string) =>
  FORMATIONS['532_tvatoppar'].slots.map(s => s.id).filter(id => id !== empty)

function fillerPlayers(exceptSlotId: string): { players: Player[]; lineupSlots: Record<string, string | null> } {
  const ids = FILLED_SLOT_IDS_EXCEPT(exceptSlotId)
  const players = ids.map((slotId, i) => makePlayer(`filler-${i}`, PlayerPosition.Half))
  const lineupSlots: Record<string, string | null> = {}
  ids.forEach((slotId, i) => { lineupSlots[slotId] = players[i].id })
  return { players, lineupSlots }
}

function clickMode(mode: 'Starkast' | 'Mest utvilad' | 'Bäst för dagens match') {
  const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === mode)!
  act(() => btn.click())
}

function clickAutoFill() {
  const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Fyll bästa elvan'))!
  act(() => btn.click())
}

// taktik-fyll-elvan-tre-lagen (DOM 2026-09-03) — tre lägen för "Fyll bästa elvan".
describe('FormationView — autofyll-lägen', () => {
  it('Starkast: exakt positionsmatch, väljer högre styrka trots lägre kondition', () => {
    const { players: fillers, lineupSlots } = fillerPlayers('mid-r')
    const strong = makePlayer('cand-strong', PlayerPosition.Midfielder, { currentAbility: 99, fitness: 60 })
    const rested = makePlayer('cand-rested', PlayerPosition.Midfielder, { currentAbility: 40, fitness: 95 })
    renderFormation(baseTactic({ lineupSlots }), [...fillers, strong, rested])

    clickMode('Starkast')
    clickAutoFill()

    expect(latestTactic?.lineupSlots?.['mid-r']).toBe('cand-strong')
  })

  it('Mest utvilad: exakt positionsmatch, väljer högre kondition trots lägre styrka', () => {
    const { players: fillers, lineupSlots } = fillerPlayers('mid-r')
    const strong = makePlayer('cand-strong', PlayerPosition.Midfielder, { currentAbility: 99, fitness: 60 })
    const rested = makePlayer('cand-rested', PlayerPosition.Midfielder, { currentAbility: 40, fitness: 95 })
    renderFormation(baseTactic({ lineupSlots }), [...fillers, strong, rested])

    clickMode('Mest utvilad')
    clickAutoFill()

    expect(latestTactic?.lineupSlots?.['mid-r']).toBe('cand-rested')
  })

  it('Bäst för dagens match: ingen exakt matchning tillgänglig — väger in positionspassning, inte bara rå styrka', () => {
    const { players: fillers, lineupSlots } = fillerPlayers('fwd-l')
    // Ingen Forward tillgänglig — bara en Back (fit 0.75 mot Forward) och en
    // Mittfältare (fit 0.9 mot Forward, adjacent). Back har högre rå styrka,
    // men Mittfältarens positionsvägda poäng vinner (90*0.9=81 > 80*0.75=60).
    const offPositionStrong = makePlayer('cand-defender', PlayerPosition.Defender, { currentAbility: 80, fitness: 90 })
    const betterFitWeaker = makePlayer('cand-midfielder', PlayerPosition.Midfielder, { currentAbility: 70, fitness: 90 })
    renderFormation(baseTactic({ lineupSlots }), [...fillers, offPositionStrong, betterFitWeaker])

    // matchfit är default — ingen klick behövs, men klickar ändå explicit
    // så testet inte tyst blir sant av misstag om defaulten någonsin byts.
    clickMode('Bäst för dagens match')
    clickAutoFill()

    expect(latestTactic?.lineupSlots?.['fwd-l']).toBe('cand-midfielder')
  })

  it('respekterar golvet i alla tre lägen: en spelare under SPELKLARHET_FITNESS_FLOOR väljs aldrig om ett alternativ ovanför finns', () => {
    const { players: fillers, lineupSlots } = fillerPlayers('mid-r')
    const belowFloor = makePlayer('cand-tired', PlayerPosition.Midfielder, { currentAbility: 99, fitness: 10 })
    const aboveFloor = makePlayer('cand-ok', PlayerPosition.Midfielder, { currentAbility: 30, fitness: 25 })

    for (const mode of ['Starkast', 'Mest utvilad', 'Bäst för dagens match'] as const) {
      renderFormation(baseTactic({ lineupSlots }), [...fillers, belowFloor, aboveFloor])
      clickMode(mode)
      clickAutoFill()
      expect(latestTactic?.lineupSlots?.['mid-r']).toBe('cand-ok')
    }
  })
})
