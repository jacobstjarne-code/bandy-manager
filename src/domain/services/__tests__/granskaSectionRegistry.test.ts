import { describe, it, expect } from 'vitest'
import { visasFor } from '../granskaSectionRegistry'
import type { Tavlingstyp, Skede } from '../matchTypeAxes'

const LIGA: [Tavlingstyp, Skede | undefined] = ['liga', undefined]
const CUP_KVART: [Tavlingstyp, Skede | undefined] = ['cup', 'kvartsfinal']
const CUP_SEMI: [Tavlingstyp, Skede | undefined] = ['cup', 'semifinal']
const CUP_FINAL: [Tavlingstyp, Skede | undefined] = ['cup', 'final']
const SLUTSPEL_KVART: [Tavlingstyp, Skede | undefined] = ['slutspel', 'kvartsfinal']
const SM_FINAL: [Tavlingstyp, Skede | undefined] = ['slutspel', 'final']
const AVSKED: [Tavlingstyp, Skede | undefined] = ['avsked', undefined]

describe('visasFor — GRANSKA DEL 4 steg 2, matrisen i docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md', () => {
  it('resultatHero, nyckelmoment, pressMedia — aldrig ✕, i någon matchtyp', () => {
    for (const section of ['resultatHero', 'nyckelmoment', 'pressMedia'] as const) {
      for (const [tavlingstyp, skede] of [LIGA, CUP_KVART, CUP_FINAL, SLUTSPEL_KVART, SM_FINAL, AVSKED]) {
        expect(visasFor(section, tavlingstyp, skede)).toBe(true)
      }
    }
  })

  it('tabell — bara liga', () => {
    expect(visasFor('tabell', ...LIGA)).toBe(true)
    expect(visasFor('tabell', ...CUP_KVART)).toBe(false)
    expect(visasFor('tabell', ...CUP_FINAL)).toBe(false)
    expect(visasFor('tabell', ...SLUTSPEL_KVART)).toBe(false)
    expect(visasFor('tabell', ...SM_FINAL)).toBe(false)
    expect(visasFor('tabell', ...AVSKED)).toBe(false)
  })

  it('form — ✕ hela cupen (live-verifierat, icke förhandlingsbart), ✕ på final (bägge), ✓ slutspel utom final', () => {
    expect(visasFor('form', ...LIGA)).toBe(true)
    expect(visasFor('form', ...CUP_KVART)).toBe(false)
    expect(visasFor('form', ...CUP_SEMI)).toBe(false)
    expect(visasFor('form', ...CUP_FINAL)).toBe(false)
    expect(visasFor('form', ...SLUTSPEL_KVART)).toBe(true)
    expect(visasFor('form', ...SM_FINAL)).toBe(false)
    expect(visasFor('form', ...AVSKED)).toBe(false)
  })

  it('statistik — ✕ bara avsked', () => {
    expect(visasFor('statistik', ...LIGA)).toBe(true)
    expect(visasFor('statistik', ...CUP_FINAL)).toBe(true)
    expect(visasFor('statistik', ...SM_FINAL)).toBe(true)
    expect(visasFor('statistik', ...AVSKED)).toBe(false)
  })

  it('dinaVal — ✕ bara avsked', () => {
    expect(visasFor('dinaVal', ...LIGA)).toBe(true)
    expect(visasFor('dinaVal', ...SM_FINAL)).toBe(true)
    expect(visasFor('dinaVal', ...AVSKED)).toBe(false)
  })

  it('omgangssammanfattning — ✕ på final (bägge, ceremoniellt), ✕ avsked, ✓ cup/slutspel utom final', () => {
    expect(visasFor('omgangssammanfattning', ...LIGA)).toBe(true)
    expect(visasFor('omgangssammanfattning', ...CUP_KVART)).toBe(true)
    expect(visasFor('omgangssammanfattning', ...CUP_FINAL)).toBe(false)
    expect(visasFor('omgangssammanfattning', ...SLUTSPEL_KVART)).toBe(true)
    expect(visasFor('omgangssammanfattning', ...SM_FINAL)).toBe(false)
    expect(visasFor('omgangssammanfattning', ...AVSKED)).toBe(false)
  })

  it('andraMatcher — ✕ på final (bägge, fanns inga), ✕ avsked, ✓ annars', () => {
    expect(visasFor('andraMatcher', ...LIGA)).toBe(true)
    expect(visasFor('andraMatcher', ...CUP_SEMI)).toBe(true)
    expect(visasFor('andraMatcher', ...CUP_FINAL)).toBe(false)
    expect(visasFor('andraMatcher', ...SLUTSPEL_KVART)).toBe(true)
    expect(visasFor('andraMatcher', ...SM_FINAL)).toBe(false)
    expect(visasFor('andraMatcher', ...AVSKED)).toBe(false)
  })

  it('scouting — ✕ bara den säsongsavslutande finalen (slutspel+final) och avsked, INTE cupfinal (säsongen fortsätter)', () => {
    expect(visasFor('scouting', ...LIGA)).toBe(true)
    expect(visasFor('scouting', ...CUP_FINAL)).toBe(true)
    expect(visasFor('scouting', ...SLUTSPEL_KVART)).toBe(true)
    expect(visasFor('scouting', ...SM_FINAL)).toBe(false)
    expect(visasFor('scouting', ...AVSKED)).toBe(false)
  })

  it('nastaMatchPekare — ✕ bara den säsongsavslutande finalen, ✓ avsked (säsongen fortsätter, matrisen säger ✓)', () => {
    expect(visasFor('nastaMatchPekare', ...LIGA)).toBe(true)
    expect(visasFor('nastaMatchPekare', ...CUP_FINAL)).toBe(true)
    expect(visasFor('nastaMatchPekare', ...SM_FINAL)).toBe(false)
    expect(visasFor('nastaMatchPekare', ...AVSKED)).toBe(true)
  })

  // GRANSKA DEL 4 (2026-08-12): sex sektioner som renderade utan att finnas i
  // matrisens tolv rader (Jacobs fynd, efter att tribute-gren-försöket 2026-08-11
  // visade att de saknades). Event-drivna beslutsprompter/alerter — ✓ i varje
  // tävlingstyp/skede, aldrig ✕, av samma skäl (tystar man inte en väntande
  // presskonferens för att matchen var en final).
  it('criticalEvents, pressConference, csPress, refereeMeeting, reaktioner, nySkada — aldrig ✕, i någon matchtyp', () => {
    const sections = ['criticalEvents', 'pressConference', 'csPress', 'refereeMeeting', 'reaktioner', 'nySkada'] as const
    for (const section of sections) {
      for (const [tavlingstyp, skede] of [LIGA, CUP_KVART, CUP_FINAL, SLUTSPEL_KVART, SM_FINAL, AVSKED]) {
        expect(visasFor(section, tavlingstyp, skede)).toBe(true)
      }
    }
  })
})
