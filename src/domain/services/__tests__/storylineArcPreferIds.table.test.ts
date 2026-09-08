import { describe, it, expect } from 'vitest'
import { PLAYER_RESPONSES, TAG_DEFS } from '../pressConferenceService'

// 4.2 (SLUTTEST_KO.md, 2026-08-19): de kvarvarande storyline-/arc-/community-standing-
// frågornas preferIds ärvde tidigare ordagrant `question.preferIds` från
// FÖRRA frågan (buggen, se docs/DERBYREPLIKEN_STORYLINE_FRAGOR_2026-08-19.md).
// Facit nedan är exakt de listor som wire:ats in i pressConferenceService.ts —
// samma numrering som docs/SVAR_STORYLINE_FRAGOR_2026-08-19.md.
const QUESTION_PREFER_IDS: Record<string, string[]> = {
  '1_underdog_vann': ['tp_tvi2', 'tp_tvi1', 'tp_tvi3'],
  '2_underdog_tappar': ['tp_tvi4', 'tp_tvi5', 'tp_tvi3'],
  '3_kaptenens_tal': ['tp_tvi6', 'tp_tvi7', 'w_h5'],
  '4_raddad_matchhjalte': ['tp_liv1', 'tp_liv4', 'tp_liv2'],
  '5_raddad_allmant': ['tp_liv2', 'tp_liv8', 'tp_liv3'],
  '6_heltidsproffs': ['tp_liv5', 'tp_liv1', 'tp_liv6'],
  '8_galavinnare': ['tp_spe1', 'tp_ort4', 'w_p3'],
  '9_hog_status': ['tp_ort4', 'tp_ort1', 'tp_ort2'],
  '10_lag_status': ['tp_ort5', 'tp_ort3', 'tp_ort2'],
  '11_ny_mecenat': ['tp_ort7', 'tp_ort6', 'tp_liv3'],
  '12_bygge_pagar': ['tp_ort8', 'tp_ort9', 'tp_ort6'],
  '13_ung_akademispelare': ['tp_spe4', 'tp_spe2', 'cl32'],
  '14_genombrott_tveksam': ['tp_spe1', 'tp_spe2', 'tp_liv3'],
  '15_jokern': ['tp_spe3', 'tp_spe2', 'tp_liv3'],
  '16_veteranens_sista': ['tp_spe5', 'tp_spe4', 'tp_spe7'],
  '17_kontraktsrykten': ['tp_spe6', 'tp_spe7', 'tp_spe4'],
}

describe('storyline-/arc-frågornas preferIds — tabelltest', () => {
  const bankIds = new Set(PLAYER_RESPONSES.map(r => r.id))

  it('täcker exakt 16 frågor', () => {
    expect(Object.keys(QUESTION_PREFER_IDS)).toHaveLength(16)
  })

  for (const [question, preferIds] of Object.entries(QUESTION_PREFER_IDS)) {
    it(`${question}: alla tre preferIds finns i banken`, () => {
      expect(preferIds).toHaveLength(3)
      for (const id of preferIds) {
        expect(bankIds.has(id), `id "${id}" saknas i PLAYER_RESPONSES`).toBe(true)
      }
    })
  }

  const TOPIC_TAGS = ['topic_person', 'topic_town', 'topic_doubt', 'topic_player']

  it('alla topic_*-taggar är klassificerade som tidlösa prefer-only-taggar med generic:none', () => {
    for (const tag of TOPIC_TAGS) {
      expect(TAG_DEFS[tag]).toBeDefined()
      expect(TAG_DEFS[tag].generic).toBe('none')
      expect(TAG_DEFS[tag].proofSource).toEqual({ form: 'timeless', availability: 'prefer-only' })
    }
  })

  it('inget topic_*-svar kan nås via kontextmatchning på en vanlig matchfråga', () => {
    for (const tag of TOPIC_TAGS) {
      const source = TAG_DEFS[tag].proofSource
      expect(source.form).toBe('timeless')
      if (source.form === 'timeless') expect(source.availability).toBe('prefer-only')
    }
  })

  it('topic_*-svar i banken bär bara topic_*-taggar (ingen läckt in under en existerande taggs namn)', () => {
    const topicResponses = PLAYER_RESPONSES.filter(r => r.id.startsWith('tp_'))
    expect(topicResponses).toHaveLength(30)
    for (const r of topicResponses) {
      expect(TOPIC_TAGS).toContain(r.tag)
    }
  })
})
