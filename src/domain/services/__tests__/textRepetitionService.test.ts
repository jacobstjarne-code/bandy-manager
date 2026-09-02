import { describe, expect, it } from 'vitest'
import type { TextRepetitionSave } from '../textRepetitionService'
import { analyzeTextRepetition, isTextRepetitionSave } from '../textRepetitionService'

function save(overrides: Partial<TextRepetitionSave> = {}): TextRepetitionSave {
  return {
    id: 'save-1',
    inbox: [],
    players: [],
    ...overrides,
  }
}

function inbox(id: string, title: string, body: string) {
  return { id, title, body } as TextRepetitionSave['inbox'][number]
}

describe('analyzeTextRepetition', () => {
  it('använder exakt title+body-identitet som stressmåttet', () => {
    const report = analyzeTextRepetition([save({
      inbox: [
        inbox('1', 'Samma rubrik', 'Samma brödtext'),
        inbox('2', 'Samma rubrik', 'Samma brödtext'),
        inbox('3', 'Annan rubrik', 'Samma brödtext'),
      ],
    })])

    expect(report).toMatchObject({
      analyzedTexts: 3,
      uniqueStrings: 2,
      duplicateStrings: 1,
      repeatedOccurrences: 1,
      maxStringRepeats: 2,
    })
    expect(report.repeats[0]).toEqual({
      text: 'Samma rubrik\nSamma brödtext',
      count: 2,
      sources: ['inbox'],
    })
  })

  it('mäter spelar- och tränardagbok och särredovisar källorna', () => {
    const diary = [{ season: 2, matchday: 4, type: 'milestone' as const, text: 'En exakt rad.' }]
    const report = analyzeTextRepetition([save({
      players: [
        { id: 'p1', diary } as TextRepetitionSave['players'][number],
        { id: 'p2', diary } as TextRepetitionSave['players'][number],
      ],
      managerProfile: { diary: [
        { season: 2, matchday: 4, type: 'milestone', text: 'En exakt rad.' },
      ] } as TextRepetitionSave['managerProfile'],
    })])

    expect(report.repeats[0]).toEqual({
      text: 'En exakt rad.',
      count: 3,
      sources: ['player_diary', 'manager_diary'],
    })
    expect(report.bySource).toEqual([
      { source: 'inbox', totalTexts: 0, uniqueStrings: 0, duplicateStrings: 0, maxStringRepeats: 0 },
      { source: 'player_diary', totalTexts: 2, uniqueStrings: 1, duplicateStrings: 1, maxStringRepeats: 2 },
      { source: 'manager_diary', totalTexts: 1, uniqueStrings: 1, duplicateStrings: 0, maxStringRepeats: 1 },
    ])
  })

  it('deduplicerar överlappande exporter men behåller verkliga identiska dagboksposter', () => {
    const repeatedDiary = [
      { season: 1, matchday: 3, type: 'form' as const, text: 'Dubbel post.' },
      { season: 1, matchday: 3, type: 'form' as const, text: 'Dubbel post.' },
    ]
    const first = save({
      inbox: [inbox('old', 'Kvar', 'Text')],
      players: [{ id: 'p1', diary: repeatedDiary } as TextRepetitionSave['players'][number]],
    })
    const second = save({
      inbox: [inbox('old', 'Kvar', 'Text'), inbox('new', 'Ny', 'Text')],
      players: [{ id: 'p1', diary: repeatedDiary } as TextRepetitionSave['players'][number]],
    })
    const report = analyzeTextRepetition([first, second])

    expect(report.totalRecords).toBe(7)
    expect(report.analyzedTexts).toBe(4)
    expect(report.excludedDuplicateRecords).toBe(3)
    expect(report.repeats.find(row => row.text === 'Dubbel post.')?.count).toBe(2)
  })

  it('validerar bara de persistenta textfält analysen faktiskt läser', () => {
    expect(isTextRepetitionSave({ id: 'real', inbox: [], players: [] })).toBe(true)
    expect(isTextRepetitionSave({ id: 'bad', inbox: [{ id: '1', title: 3, body: '' }], players: [] })).toBe(false)
    expect(isTextRepetitionSave({ id: 'bad', inbox: [], players: [{ id: 'p', diary: [{ text: 'x' }] }] })).toBe(false)
  })
})
