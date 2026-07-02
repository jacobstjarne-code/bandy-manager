/**
 * §11.3 — prioordning för Granska-slutets framåtpekare: derby > kalenderankare >
 * motståndarform > tabellnärhet > neutral. Formpåståenden (opp_hot/opp_cold)
 * kräver EXAKT 5 formresultat — ett påstående om "senaste 5" får aldrig
 * baseras på färre matcher.
 */
import { describe, it, expect } from 'vitest'
import { selectNextMatchPointerType } from '../presentation/screens/granska/GranskaOversikt'

const NEUTRAL_ARGS = {
  isDerby: false,
  calendarFlag: null,
  oppFormLast5: [] as Array<'V' | 'O' | 'F'>,
  managedPosition: null,
  oppPosition: null,
}

describe('selectNextMatchPointerType — prioordning', () => {
  it('derby vinner över allt annat', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      isDerby: true,
      calendarFlag: 'annandag',
      oppFormLast5: ['V', 'V', 'V', 'V', 'V'],
    })).toBe('derby')
  })

  it('kalenderankare vinner över form och tabellnärhet', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      calendarFlag: 'cupfinalhelg',
      oppFormLast5: ['V', 'V', 'V', 'V', 'V'],
      managedPosition: 5,
      oppPosition: 5,
    })).toBe('cupfinalhelg')
  })

  it('nyar och annandag är separata kalenderankare', () => {
    expect(selectNextMatchPointerType({ ...NEUTRAL_ARGS, calendarFlag: 'nyar' })).toBe('nyar')
    expect(selectNextMatchPointerType({ ...NEUTRAL_ARGS, calendarFlag: 'annandag' })).toBe('annandag')
  })

  it('opp_hot kräver ≥4 V av EXAKT 5 resultat', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      oppFormLast5: ['V', 'V', 'V', 'V', 'O'],
    })).toBe('opp_hot')
  })

  it('opp_hot triggar INTE på 4 V av bara 4 spelade matcher (för få för "senaste 5")', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      oppFormLast5: ['V', 'V', 'V', 'V'],
    })).toBe('neutral')
  })

  it('3 V av 5 räcker inte för opp_hot', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      oppFormLast5: ['V', 'V', 'V', 'O', 'F'],
    })).toBe('neutral')
  })

  it('opp_cold kräver ≥4 F av exakt 5 resultat', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      oppFormLast5: ['F', 'F', 'F', 'F', 'V'],
    })).toBe('opp_cold')
  })

  it('form vinner över tabellnärhet', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      oppFormLast5: ['V', 'V', 'V', 'V', 'O'],
      managedPosition: 3,
      oppPosition: 4,
    })).toBe('opp_hot')
  })

  it('tabell_nara när positionsskillnaden är exakt 1', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      managedPosition: 4,
      oppPosition: 5,
    })).toBe('tabell_nara')
  })

  it('tabell_nara triggar INTE vid positionsskillnad 2', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      managedPosition: 3,
      oppPosition: 5,
    })).toBe('neutral')
  })

  it('neutral när ingen position är känd (t.ex. innan tabell existerar)', () => {
    expect(selectNextMatchPointerType({
      ...NEUTRAL_ARGS,
      managedPosition: null,
      oppPosition: 5,
    })).toBe('neutral')
  })

  it('helt tom input → neutral', () => {
    expect(selectNextMatchPointerType(NEUTRAL_ARGS)).toBe('neutral')
  })
})
