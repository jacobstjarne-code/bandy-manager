import { describe, it, expect } from 'vitest'
import { deriveKapitelPunktKind, getKapitelPunktText } from '../kapitelPunktService'

describe('deriveKapitelPunktKind', () => {
  it('avsked vinner över allt annat', () => {
    expect(deriveKapitelPunktKind('slutspel', 'final', true, true)).toBe('avsked')
    expect(deriveKapitelPunktKind('liga', undefined, false, true)).toBe('avsked')
  })

  it('slutspel + final: sm_guld på vinst, sm_final_forlorad på förlust', () => {
    expect(deriveKapitelPunktKind('slutspel', 'final', true, false)).toBe('sm_guld')
    expect(deriveKapitelPunktKind('slutspel', 'final', false, false)).toBe('sm_final_forlorad')
  })

  it('cup + final: cup_vunnen på vinst, cupfinal_forlorad på förlust', () => {
    expect(deriveKapitelPunktKind('cup', 'final', true, false)).toBe('cup_vunnen')
    expect(deriveKapitelPunktKind('cup', 'final', false, false)).toBe('cupfinal_forlorad')
  })

  it('null utanför final och avsked', () => {
    expect(deriveKapitelPunktKind('liga', undefined, true, false)).toBeNull()
    expect(deriveKapitelPunktKind('slutspel', 'semifinal', true, false)).toBeNull()
  })
})

describe('getKapitelPunktText — låst copy, ändra aldrig ordalydelsen', () => {
  it('sm_guld', () => {
    expect(getKapitelPunktText('sm_guld')).toEqual({
      title: 'Svenska mästare.',
      subtitle: 'Det står i protokollet nu. Det går inte att ta ifrån er.',
    })
  })

  it('cup_vunnen', () => {
    expect(getKapitelPunktText('cup_vunnen')).toEqual({
      title: 'Cupen är er.',
      subtitle: 'Pokalen åker med bussen hem.',
    })
  })

  it('sm_final_forlorad', () => {
    expect(getKapitelPunktText('sm_final_forlorad')).toEqual({
      title: 'Silver.',
      subtitle: 'Det tar ett tag innan man ser det som något annat.',
    })
  })

  it('cupfinal_forlorad', () => {
    expect(getKapitelPunktText('cupfinal_forlorad')).toEqual({
      title: 'Final och förlust.',
      subtitle: 'Ni var där. Nästa gång vet ni hur det känns.',
    })
  })

  it('avsked, 10+ mål', () => {
    expect(getKapitelPunktText('avsked', { firstName: 'Karl', lastName: 'Persson', games: 214, goals: 87 })).toEqual({
      title: 'Karl Persson spelade sin sista match.',
      subtitle: '214 matcher, 87 mål. Han går av isen för egen maskin, och alla reser sig.',
    })
  })

  it('avsked, under 10 mål — andra satsen byts', () => {
    expect(getKapitelPunktText('avsked', { firstName: 'Anders', lastName: 'Ek', games: 341, goals: 4 })).toEqual({
      title: 'Anders Ek spelade sin sista match.',
      subtitle: '341 matcher för samma klubb. Det är inte många som gör det.',
    })
  })

  it('avsked utan data returnerar null', () => {
    expect(getKapitelPunktText('avsked')).toBeNull()
  })
})
