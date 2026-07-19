import { describe, it, expect } from 'vitest'
import { mulberry32 } from '../../utils/random'
import {
  createDoctor, getInjurySeverity, DOCTOR_NAMES, DOCTOR_STYLES,
  getRehabStage, pickRehabStageLine, pickDoctorSecondaryLine,
  REHAB_STAGE_LINES, DOCTOR_SECONDARY_LINES,
} from '../injuryDoctorText'

describe('createDoctor', () => {
  it('picks a name and style from the established pools, deterministically on the same rand sequence', () => {
    const doctorA = createDoctor(mulberry32(42))
    const doctorB = createDoctor(mulberry32(42))
    expect(doctorA).toEqual(doctorB)
    expect(DOCTOR_NAMES).toContain(doctorA.name)
    expect(DOCTOR_STYLES).toContain(doctorA.style)
  })

  it('varies with a different seed', () => {
    const names = new Set(Array.from({ length: 10 }, (_, i) => createDoctor(mulberry32(i)).name))
    expect(names.size).toBeGreaterThan(1)
  })
})

describe('getInjurySeverity', () => {
  it('maps day thresholds to the correct severity', () => {
    expect(getInjurySeverity(7)).toBe('mjuk')
    expect(getInjurySeverity(13)).toBe('mjuk')
    expect(getInjurySeverity(14)).toBe('mild')
    expect(getInjurySeverity(27)).toBe('mild')
    expect(getInjurySeverity(28)).toBe('svar')
    expect(getInjurySeverity(60)).toBe('svar')
    expect(getInjurySeverity(61)).toBe('langtid')
    expect(getInjurySeverity(210)).toBe('langtid')
  })
})

describe('getRehabStage — pool 1b/1d (härledd, inget stage-fält finns)', () => {
  it('maps day thresholds to the correct stage', () => {
    expect(getRehabStage(1)).toBe('matchfit')
    expect(getRehabStage(7)).toBe('matchfit')
    expect(getRehabStage(8)).toBe('full')
    expect(getRehabStage(21)).toBe('full')
    expect(getRehabStage(22)).toBe('light')
    expect(getRehabStage(42)).toBe('light')
    expect(getRehabStage(43)).toBe('rest')
    expect(getRehabStage(280)).toBe('rest')
  })
})

describe('pickRehabStageLine', () => {
  it('returns a line from the correct stage bucket, deterministically', () => {
    const lineA = pickRehabStageLine('player_1', 3)
    const lineB = pickRehabStageLine('player_1', 3)
    expect(lineA).toBe(lineB)
    expect(REHAB_STAGE_LINES.matchfit).toContain(lineA)
  })
})

describe('pickDoctorSecondaryLine', () => {
  it('uses beslut-tone for langtid severity regardless of stage', () => {
    const line = pickDoctorSecondaryLine('player_1', 'Andersson', 200)
    const filled = DOCTOR_SECONDARY_LINES.beslut.map(l => l.replace(/\{spelare\}/g, 'Andersson'))
    expect(filled).toContain(line)
  })

  it('uses kampigt-tone early in rehab (rest/light stage), lovande late (full/matchfit)', () => {
    const early = pickDoctorSecondaryLine('player_1', 'Andersson', 40) // light stage
    const late = pickDoctorSecondaryLine('player_1', 'Andersson', 5) // matchfit stage
    const kampigtFilled = DOCTOR_SECONDARY_LINES.kampigt.map(l => l.replace(/\{spelare\}/g, 'Andersson'))
    const lovandeFilled = DOCTOR_SECONDARY_LINES.lovande.map(l => l.replace(/\{spelare\}/g, 'Andersson'))
    expect(kampigtFilled).toContain(early)
    expect(lovandeFilled).toContain(late)
  })

  it('interpolates {spelare} correctly', () => {
    const line = pickDoctorSecondaryLine('player_1', 'Karlsson', 5)
    expect(line).not.toContain('{spelare}')
    expect(line).toContain('Karlsson')
  })
})
