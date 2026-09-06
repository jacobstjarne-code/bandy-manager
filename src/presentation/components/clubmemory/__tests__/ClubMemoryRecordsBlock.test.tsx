import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AllTimeRecords } from '../../../../domain/entities/Narrative'
import { ClubMemoryRecordsBlock } from '../ClubMemoryRecordsBlock'

describe('ClubMemoryRecordsBlock season labels', () => {
  it('renders every absolute season as a bandy-year span', () => {
    const records: AllTimeRecords = {
      bestFinish: { position: 1, season: 2026 },
      mostGoalsSeason: { playerName: 'Ada Andersson', goals: 31, season: 2027 },
      mostAssistsSeason: { playerName: 'Bo Berg', assists: 18, season: 2028 },
      highestRatingSeason: { playerName: 'Cia Carlsson', rating: 8.1, season: 2029 },
      biggestWin: { score: '12–2', opponent: 'Test BK', season: 2030, round: 4 },
      championSeasons: [2026, 2029],
      cupWinSeasons: [2027],
    }

    const html = renderToStaticMarkup(<ClubMemoryRecordsBlock records={records} />)

    expect(html).toContain('Säsong 2026/27')
    expect(html).toContain('Ada Andersson, 2027/28')
    expect(html).toContain('Bo Berg, 2028/29')
    expect(html).toContain('Cia Carlsson, 2029/30')
    expect(html).toContain('mot Test BK, 2030/31')
    expect(html).toContain('2026/27, 2029/30')
    expect(html).toContain('2027/28')
  })
})
