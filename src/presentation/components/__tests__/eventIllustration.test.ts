import { describe, expect, it } from 'vitest'
import { PORTAL_BEATS } from '../../../domain/data/portalBeats'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getEventIllustrationName } from '../eventIllustration'

describe('momentillustrationer — befintliga händelser och beats', () => {
  it('kopplar föreningsdemokratin bara till hallprocessens första, stabila beslut', () => {
    expect(getEventIllustrationName({ id: 'hallprocess_d1_s4', type: 'hallProcess' })).toBe('club-democracy')
    expect(getEventIllustrationName({ id: 'hallprocess_d2_s4', type: 'hallProcess' })).toBeUndefined()
    expect(getEventIllustrationName({ id: 'academy-breakthrough', type: 'academyBreakthrough' })).toBeUndefined()
  })

  it('visar ultimatumet bara i styrelsens skarpaste zon', () => {
    const beat = PORTAL_BEATS.find(candidate => candidate.id === 'board_failure')!
    const resolve = beat.illustration as (game: SaveGame) => { name: string } | undefined

    expect(resolve({ boardPatience: 29 } as SaveGame)?.name).toBe('board-ultimatum')
    expect(resolve({ boardPatience: 30 } as SaveGame)).toBeUndefined()
  })

  it('kopplar det färdiga bygget till sitt befintliga portalbeat', () => {
    const beat = PORTAL_BEATS.find(candidate => candidate.id === 'facility_completed')!
    expect(typeof beat.illustration).toBe('object')
    expect((beat.illustration as { name: string }).name).toBe('facility-completed')
  })
})
