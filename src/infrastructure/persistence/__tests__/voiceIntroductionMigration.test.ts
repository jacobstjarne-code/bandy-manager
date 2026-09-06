import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { boardVoiceId, mecenatVoiceId, patronVoiceId } from '../../../domain/services/voiceIntroductionService'
import { migrateSaveGame } from '../saveGameMigration'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

const CLUB_ID = CLUB_TEMPLATES[0].id

describe('voice introduction migration', () => {
  it('seeds known legacy relationships without inventing a historical timestamp', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_ID, seed: 17 })
    const legacy = {
      ...base,
      onboardingComplete: true,
      introducedVoices: undefined,
      mecenater: [{ id: 'm1' }],
      patron: { id: 'p1', introducedSeason: 2026 },
    } as unknown as SaveGame

    const migrated = migrateSaveGame(structuredClone(legacy))
    const boardId = boardVoiceId(migrated.managedClubId, migrated.board![0].id)

    expect(migrated.introducedVoices?.[boardId]).toMatchObject({
      provenance: 'legacy_assumed', source: 'migration',
    })
    expect(migrated.introducedVoices?.[mecenatVoiceId(CLUB_ID, 'm1')]).toMatchObject({
      provenance: 'legacy_assumed', source: 'migration',
    })
    expect(migrated.introducedVoices?.[patronVoiceId(CLUB_ID, 'p1')]).toMatchObject({
      provenance: 'legacy_assumed', source: 'migration',
    })
    expect(Object.values(migrated.introducedVoices ?? {})).toEqual(
      expect.arrayContaining([expect.not.objectContaining({ introducedDate: expect.anything() })]),
    )
  })

  it('never fills a deliberately empty modern registry merely because a mecenat exists', () => {
    const modern = createNewGame({ managerName: 'Test', clubId: CLUB_ID, seed: 18 })
    const migrated = migrateSaveGame({
      ...modern,
      introducedVoices: {},
      mecenater: [{ id: 'new-unmet-mecenat' }],
    })

    expect(migrated.introducedVoices).toEqual({})
  })

  it('is idempotent', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_ID, seed: 19 })
    const legacy = { ...base, onboardingComplete: true, introducedVoices: undefined }
    const once = migrateSaveGame(structuredClone(legacy))
    const twice = migrateSaveGame(structuredClone(once))
    expect(twice.introducedVoices).toEqual(once.introducedVoices)
  })
})
