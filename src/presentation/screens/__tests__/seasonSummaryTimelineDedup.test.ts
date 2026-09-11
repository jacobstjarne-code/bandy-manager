import { describe, expect, it } from 'vitest'
import { mergeYearbookTimelineItems, yearbookTimelineRoundBadge, type YearbookTimelineItem } from '../SeasonSummaryScreen'

function item(overrides: Partial<YearbookTimelineItem> = {}): YearbookTimelineItem {
  return {
    round: 3,
    icon: '📖',
    headline: '💔 Derby-förlust mot Söderfors',
    body: '',
    ...overrides,
  }
}

describe('SeasonSummaryScreen — storyline-identitet i årsbokstidslinjen', () => {
  it('visar samma storyline bara en gång när den finns i både keyMoments och liggarprojektionen', () => {
    const merged = mergeYearbookTimelineItems(
      [item({ storylineId: 'story_derby_1', body: 'Fryst förklaring.' })],
      [item({ storylineId: 'story_derby_1' })],
    )

    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ storylineId: 'story_derby_1', body: 'Fryst förklaring.' })
  })

  it('bevarar två verkliga storylines även när de delar typ och text', () => {
    const merged = mergeYearbookTimelineItems(
      [item({ storylineId: 'story_derby_1' }), item({ round: 17, storylineId: 'story_derby_2' })],
      [item({ storylineId: 'story_derby_1' }), item({ round: 17, storylineId: 'story_derby_2' })],
    )

    expect(merged.map(entry => entry.storylineId)).toEqual(['story_derby_1', 'story_derby_2'])
  })

  it('rensar samma storyline ur en äldre fryst årsbok som saknar storylineId', () => {
    const merged = mergeYearbookTimelineItems(
      [item({ storylineCandidate: true, body: 'Äldre fryst förklaring.' })],
      [item({ storylineId: 'story_derby_1' })],
    )

    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ storylineId: 'story_derby_1', body: 'Äldre fryst förklaring.' })
  })

  it('slår inte ihop ett vanligt matchmoment med en storyline som råkar dela text och omgång', () => {
    const merged = mergeYearbookTimelineItems(
      [item({ storylineCandidate: false })],
      [item({ storylineId: 'story_derby_1' })],
    )

    expect(merged).toHaveLength(2)
  })
})

describe('yearbookTimelineRoundBadge', () => {
  it('normaliserar belagda ligaomgångar till samma kortform', () => {
    expect(yearbookTimelineRoundBadge('Omg 2', 8)).toBe('Omg 2')
    expect(yearbookTimelineRoundBadge('Omgång 14', 19)).toBe('Omg 14')
  })

  it('kallar aldrig en obelagd global matchdag för ligaomgång', () => {
    expect(yearbookTimelineRoundBadge(undefined, 3)).toBe('Dag 3')
  })

  it('bevarar tävlingsnamn som redan är sanna', () => {
    expect(yearbookTimelineRoundBadge('Cup · final', 4)).toBe('Cup · final')
    expect(yearbookTimelineRoundBadge('Slutspel · semifinal', 29)).toBe('Slutspel · semifinal')
  })
})
