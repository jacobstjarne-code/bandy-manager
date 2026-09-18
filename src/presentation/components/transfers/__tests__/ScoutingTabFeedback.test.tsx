import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Player } from '../../../../domain/entities/Player'
import type { ScoutReport } from '../../../../domain/entities/Scouting'
import { PlayerPosition } from '../../../../domain/enums'
import { ScoutingTab } from '../ScoutingTab'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

const players = [
  { id: 'axel', firstName: 'Axel', lastName: 'Bengtsson', position: PlayerPosition.Goalkeeper, clubId: 'other', age: 24, marketValue: 55000, currentAbility: 80 },
  { id: 'bengt', firstName: 'Bengt', lastName: 'Olsson', position: PlayerPosition.Goalkeeper, clubId: 'other', age: 26, marketValue: 45000, currentAbility: 70 },
  { id: 'carl', firstName: 'Carl', lastName: 'Nilsson', position: PlayerPosition.Goalkeeper, clubId: 'other', age: 29, marketValue: 40000, currentAbility: 60 },
  { id: 'free', firstName: 'Fri', lastName: 'Agent', position: PlayerPosition.Goalkeeper, clubId: 'free_agent', age: 23, marketValue: 30000, currentAbility: 90 },
] as Player[]

const game = {
  players,
  managedClubId: 'managed',
  clubs: [{ id: 'managed', name: 'Hemmalaget', region: 'Norr' }, { id: 'other', name: 'Bortalaget', region: 'Söder' }],
  fixtures: [],
  currentSeason: 2025,
  activeScoutAssignment: null,
  activeTalentSearch: null,
  talentSearchResults: [],
} as unknown as SaveGame

function report(playerId: string, scoutedSeason: number): ScoutReport {
  return {
    playerId,
    clubId: 'other',
    scoutedDate: `${scoutedSeason}-09-01`,
    scoutedSeason,
    accuracy: 70,
    revealedAttributes: {},
    estimatedCA: 75,
    estimatedPA: 80,
    notes: 'Stark på linjen.',
  }
}

describe('Scoutingflikens återkoppling', () => {
  it('förklarar positionsantalet och låter rapportklar spelare stå kvar med rätt nästa steg', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const props = {
      game,
      scoutBudget: 10,
      activeAssignment: null,
      windowOpen: true,
      managedClub: { id: 'managed', region: 'Norr' },
      spaningPosition: 'any',
      spaningMaxAge: 30,
      spaningMaxSalary: 16000,
      currentRound: 1,
      onSetSpanningPosition: vi.fn(),
      onSetSpanningMaxAge: vi.fn(),
      onSetSpanningMaxSalary: vi.fn(),
      onBid: vi.fn(),
      onShowFreeAgents: vi.fn(),
      onScout: vi.fn(),
      onStartTalentSearch: vi.fn(() => ({ success: true })),
      onScoutMessage: vi.fn(),
      onToggleShortlist: vi.fn(),
    }
    const oldReports = { carl: report('carl', 2023), free: report('free', 2025) }

    act(() => root.render(<ScoutingTab {...props} scoutReports={oldReports} />))
    const freeAgentReport = host.querySelector('#scout-report-free')!
    expect(freeAgentReport.textContent).toContain('Fri agent')
    act(() => (freeAgentReport.querySelector('.transfers-report-actions .btn') as HTMLButtonElement).click())
    expect(props.onShowFreeAgents).toHaveBeenCalledOnce()
    const goalkeeperGroup = [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Målvakter · 3 spelare'))
    expect(goalkeeperGroup).toBeTruthy()
    act(() => goalkeeperGroup!.click())

    const rowsBefore = [...host.querySelectorAll('.transfers-list-row-lg')]
    expect(rowsBefore[0].textContent).toContain('Axel Bengtsson')
    expect(rowsBefore[0].textContent).toContain('Utvärdera')
    expect(rowsBefore[2].textContent).toContain('Utvärdera igen')
    expect(host.textContent).toContain('inte vilka som är till salu')

    act(() => root.render(<ScoutingTab {...props} scoutReports={{ ...oldReports, axel: report('axel', 2025) }} />))
    const rowsAfter = [...host.querySelectorAll('.transfers-list-row-lg')]
    expect(rowsAfter[0].textContent).toContain('Axel Bengtsson')
    expect(rowsAfter[0].textContent).toContain('Rapport klar')
    expect(rowsAfter[0].textContent).toContain('Visa rapport')
    expect(rowsAfter[0].textContent).toContain('Lägg bud')
    expect(rowsAfter[0].textContent).not.toContain('Utvärdera')
    const axelReport = host.querySelector('#scout-report-axel')!
    expect(axelReport.querySelector('[data-player-portrait-kind]')).toBeTruthy()
    const favoriteButton = axelReport.querySelector<HTMLButtonElement>('.transfers-shortlist-btn')!
    expect(favoriteButton.textContent).toContain('Spara favorit')
    expect(favoriteButton.getAttribute('aria-pressed')).toBe('false')
    act(() => favoriteButton.click())
    expect(props.onToggleShortlist).toHaveBeenCalledWith('axel')

    const assignment = { targetPlayerId: 'bengt', targetClubId: 'other', startedDate: '2025-09-15', roundsRemaining: 2 }
    act(() => root.render(<ScoutingTab {...props} game={{ ...game, activeScoutAssignment: assignment }} activeAssignment={assignment} scoutReports={{ ...oldReports, axel: report('axel', 2025) }} />))
    const rowsDuringAssignment = [...host.querySelectorAll('.transfers-list-row-lg')]
    expect(rowsDuringAssignment[1].textContent).toContain('Utvärdering pågår · 2 omg. kvar')
    expect(rowsDuringAssignment[1].textContent).toContain('Pågår')
    expect(rowsDuringAssignment[2].textContent).toContain('Scout upptagen')

    const talentSearchResults = [{
      id: 'result-1', requestId: 'search-1', season: 2025, round: 1,
      players: [
        { playerId: 'axel', scoutNotes: 'Målvakt.', estimatedCA: 75, estimatedValue: 55000 },
        { playerId: 'bengt', scoutNotes: 'Målvakt.', estimatedCA: 70, estimatedValue: 45000 },
        { playerId: 'carl', scoutNotes: 'Målvakt.', estimatedCA: 60, estimatedValue: 40000 },
      ],
    }]
    act(() => root.render(<ScoutingTab {...props} game={{ ...game, activeScoutAssignment: assignment, talentSearchResults }} activeAssignment={assignment} scoutReports={{ ...oldReports, axel: report('axel', 2025) }} />))
    const talentRows = [...host.querySelectorAll('.transfers-talent-row')]
    expect(talentRows[0].textContent).toContain('Visa rapport')
    expect(talentRows[0].textContent).not.toContain('Utvärdera')
    expect(talentRows[1].textContent).toContain('Pågår')
    expect(talentRows[1].textContent).not.toContain('Lägg bud')
    expect(talentRows[2].textContent).toContain('Visa rapport')
    expect([...host.querySelectorAll('button')].find(button => button.textContent === 'Scout upptagen')?.disabled).toBe(true)

    act(() => root.render(<ScoutingTab {...props} game={{ ...game, talentSearchResults }} scoutReports={{ ...oldReports, axel: report('axel', 2025), bengt: report('bengt', 2025) }} />))
    expect([...host.querySelectorAll('.transfers-talent-row')][1].textContent).toContain('Visa rapport')

    const pendingBid = {
      id: 'bid-axel', playerId: 'axel', buyingClubId: 'managed', sellingClubId: 'other',
      offerAmount: 55_000, offeredSalary: 15_000, contractYears: 2,
      direction: 'outgoing' as const, status: 'pending' as const, createdRound: 1, expiresRound: 2,
    }
    act(() => root.render(<ScoutingTab {...props} game={{ ...game, talentSearchResults, transferBids: [pendingBid] }} scoutReports={{ ...oldReports, axel: report('axel', 2025) }} />))
    expect([...host.querySelectorAll('.transfers-talent-row')][0].textContent).toContain('Bud skickat · 55 tkr · svar om 1 omg.')
    expect([...host.querySelectorAll('.transfers-talent-row')][0].textContent).not.toContain('Lägg bud')
    expect(host.querySelector('#scout-report-axel')?.textContent).toContain('Bud skickat')
    expect([...host.querySelectorAll('.transfers-talent-row')][1].textContent).not.toContain('Lägg bud')

    act(() => root.unmount())
    host.remove()
  })
})
