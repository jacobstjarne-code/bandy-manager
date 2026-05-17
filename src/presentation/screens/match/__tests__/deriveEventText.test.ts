import { describe, it, expect } from 'vitest'
import { deriveEventText } from '../deriveEventText'
import type { Player } from '../../../../domain/entities/Player'

function makePlayer(id: string, lastName: string): Player {
  return { id, lastName } as Player
}

describe('deriveEventText', () => {
  it('returnerar commentary när det finns', () => {
    const result = deriveEventText(
      'Karlsson sätter dit den hårt i hörnet.',
      { description: 'Mål via hörna', playerId: 'p1' },
      'Mål',
      [makePlayer('p1', 'Karlsson')],
    )
    expect(result).toBe('Karlsson sätter dit den hårt i hörnet.')
  })

  it('returnerar event.description när commentary är tom', () => {
    const result = deriveEventText(
      '',
      { description: 'Mål via hörna', playerId: 'p1' },
      'Mål',
      [makePlayer('p1', 'Karlsson')],
    )
    expect(result).toBe('Mål via hörna')
  })

  it('returnerar event.description när commentary är undefined', () => {
    const result = deriveEventText(
      undefined,
      { description: 'Räddning av målvakten', playerId: 'p2' },
      'Räddning',
      [makePlayer('p2', 'Lindqvist')],
    )
    expect(result).toBe('Räddning av målvakten')
  })

  it('returnerar "Verb av Efternamn." när commentary och description är tomma men playerId löser', () => {
    const result = deriveEventText(
      '',
      { description: '', playerId: 'p1' },
      'Mål',
      [makePlayer('p1', 'Eriksson')],
    )
    expect(result).toBe('Mål av Eriksson.')
  })

  it('returnerar "Verb." när commentary, description och playerId saknas', () => {
    const result = deriveEventText('', { description: '' }, 'Utvisning', [])
    expect(result).toBe('Utvisning.')
  })

  it('returnerar "Verb." när playerId inte matchar spelarlistan', () => {
    const result = deriveEventText(
      undefined,
      { description: '', playerId: 'okänd-id' },
      'Mål',
      [makePlayer('p1', 'Karlsson')],
    )
    expect(result).toBe('Mål.')
  })

  it('ignorerar whitespace-commentary och faller vidare', () => {
    const result = deriveEventText(
      '   ',
      { description: 'Straffmål', playerId: 'p1' },
      'Mål',
      [makePlayer('p1', 'Jonsson')],
    )
    expect(result).toBe('Straffmål')
  })

  it('fungerar utan spelarlista (default tom array)', () => {
    const result = deriveEventText(undefined, { description: '' }, 'Räddning')
    expect(result).toBe('Räddning.')
  })
})
