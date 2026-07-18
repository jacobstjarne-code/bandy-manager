import { describe, it, expect } from 'vitest'
import { mulberry32 } from '../../utils/random'
import { createDoctor, getInjurySeverity, DOCTOR_NAMES, DOCTOR_STYLES } from '../injuryDoctorText'

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
