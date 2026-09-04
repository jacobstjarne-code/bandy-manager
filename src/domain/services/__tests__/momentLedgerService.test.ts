import { describe, it, expect } from 'vitest'
import {
  buildMomentLedgerEntry,
  appendMomentsToLedger,
  appendMomentsAndEntriesToLedger,
  getRecentMomentsFromLedger,
  resolveSubjectName,
  MOMENT_LEDGER_SIGNIFICANCE,
} from '../momentLedgerService'
import type { Moment, MomentSource } from '../../entities/Moment'
import type { SaveGame } from '../../entities/SaveGame'
import type { EventLedgerEntry } from '../../entities/Narrative'

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 1,
    currentMatchday: 1,
    currentDate: '2026-01-01',
    managedClubId: 'club_test',
    leagueId: 'league_test',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    ...overrides,
  } as unknown as SaveGame
}

function makeMoment(overrides: Partial<Moment> = {}): Moment {
  return {
    id: `moment_${Math.random()}`,
    source: 'star_injury',
    matchday: 6,
    season: 1,
    title: 't',
    body: 'b',
    ...overrides,
  }
}

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 4 (Skärpning 3) —
 * regressionstestet ordern efterfrågade: cap-5:an var glömskan, liggaren
 * ska INTE ärva den.
 */
describe('momentLedgerService — Fas 4 durabilitet', () => {
  it('10 moments skrivna → alla 10 finns i liggaren (mot dagens cap-5)', () => {
    const moments: Moment[] = Array.from({ length: 10 }, (_, i) =>
      makeMoment({ id: `m${i}`, matchday: i + 1, season: 1 }))
    const ledger = appendMomentsToLedger([], moments)
    expect(ledger).toHaveLength(10)
  })

  it('en stjärnskada omgång 6 är fortfarande läsbar omgång 20 (efter många fler moments)', () => {
    const injury = makeMoment({ id: 'injury_r6', matchday: 6, season: 1, source: 'star_injury' })
    let ledger = appendMomentsToLedger([], [injury], 'club_test')
    // 14 fler moments (omgång 7 t.o.m. 20) — mer än cap-5 skulle överlevt
    for (let matchday = 7; matchday <= 20; matchday++) {
      ledger = appendMomentsToLedger(ledger, [makeMoment({ id: `m_r${matchday}`, matchday, season: 1 })], 'club_test')
    }
    const game = makeMinimalGame({ currentMatchday: 20, eventLedger: ledger })
    const found = (game.eventLedger ?? []).find(e => e.semanticKey === 'injury_r6')
    expect(found).toBeDefined()
    expect(found?.matchday).toBe(6)

    // Läsytan (senaste 5) visar INTE längre omgång 6-skadan — förväntat,
    // "senaste N" är en vy-gräns, inte ett minnesgolv. Men den fulla
    // liggaren (game.eventLedger) har den kvar — DET är vad som gjorde
    // spelet glömskt tidigare (recentMoments var både lagring OCH gräns).
    const recent = getRecentMomentsFromLedger(game, 5)
    expect(recent.some(e => e.semanticKey === 'injury_r6')).toBe(false)
    expect(game.eventLedger).toHaveLength(15)
  })

  it('buildMomentLedgerEntry sätter significance ur tabellen, ingen prosa', () => {
    const m = makeMoment({ source: 'era_shift' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.significance).toBe(MOMENT_LEDGER_SIGNIFICANCE.era_shift)
    expect(entry.significance).toBe(85)
    expect(entry).not.toHaveProperty('title')
    expect(entry).not.toHaveProperty('body')
    expect(entry.semanticKey).toBe(m.id)
  })

  // Skärpning 4 (2026-09-02, Opus dom) — de tre källor vars body branchade på
  // ett klassificerande värde bär det strukturerat till liggarposten, så en
  // branchad vy-mall kan skrivas efter att title/body strippats.
  it('era_shift: eraLabel kopieras rakt, övriga två fälten osatta', () => {
    const m = makeMoment({ source: 'era_shift', eraLabel: 'legacy' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.eraLabel).toBe('legacy')
    expect(entry.transferRole).toBeUndefined()
    expect(entry.matchCategory).toBeUndefined()
  })

  it('transfer_story: transferRole kopieras rakt, övriga två fälten osatta', () => {
    const m = makeMoment({ source: 'transfer_story', transferRole: 'kapten' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.transferRole).toBe('kapten')
    expect(entry.eraLabel).toBeUndefined()
    expect(entry.matchCategory).toBeUndefined()
  })

  it('season_highlight: matchCategory kopieras rakt (Code-fynd, flaggat till Opus), övriga två fälten osatta', () => {
    const m = makeMoment({ source: 'season_highlight', matchCategory: 'derby_win' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.matchCategory).toBe('derby_win')
    expect(entry.eraLabel).toBeUndefined()
    expect(entry.transferRole).toBeUndefined()
  })

  it('captain_crisis: fast prosa + namn, verifierat att INGET av de tre klassificeringsfälten sätts (behöver inget fält)', () => {
    const m = makeMoment({ source: 'captain_crisis', subjectPlayerId: 'p1' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.eraLabel).toBeUndefined()
    expect(entry.transferRole).toBeUndefined()
    expect(entry.matchCategory).toBeUndefined()
  })

  it('enkelparts-moment (bara subjectPlayerId) → subject satt, subject2 osatt', () => {
    const m = makeMoment({ source: 'star_injury', subjectPlayerId: 'p1' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.subject).toEqual({ kind: 'player', id: 'p1' })
    expect(entry.subject2).toBeUndefined()
  })

  it('enkelparts-moment (bara subjectClubId) → subject club, subject2 osatt', () => {
    const m = makeMoment({ source: 'derby_win', subjectClubId: 'c1' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.subject).toEqual({ kind: 'club', id: 'c1' })
    expect(entry.subject2).toBeUndefined()
  })

  it('tvåparts-moment (transfer_story: spelare + köpande klubb) → subject + subject2', () => {
    const m = makeMoment({ source: 'transfer_story', subjectPlayerId: 'p1', subjectClubId: 'c_buyer' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.subject).toEqual({ kind: 'player', id: 'p1' })
    expect(entry.subject2).toEqual({ kind: 'club', id: 'c_buyer' })
  })

  it('mecenat_costshare bevarar mecenaten som person och spelaren som andra part', () => {
    const m = makeMoment({
      source: 'mecenat_costshare',
      subjectMecenatId: 'mec_1',
      subjectPlayerId: 'p1',
    })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.subject).toEqual({ kind: 'mecenat', id: 'mec_1' })
    expect(entry.subject2).toEqual({ kind: 'player', id: 'p1' })
  })

  it('rival_sale (spelare + rivalklubb) → subject + subject2', () => {
    const m = makeMoment({ source: 'rival_sale', subjectPlayerId: 'p1', subjectClubId: 'c_rival' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.subject).toEqual({ kind: 'player', id: 'p1' })
    expect(entry.subject2).toEqual({ kind: 'club', id: 'c_rival' })
  })

  it('ambient-moment utan subjekt (sponsor_positive) → varken subject eller subject2', () => {
    const m = makeMoment({ source: 'sponsor_positive' })
    const entry = buildMomentLedgerEntry(m)
    expect(entry.subject).toBeUndefined()
    expect(entry.subject2).toBeUndefined()
  })

  it('significance-tabellen matchar Skärpning 3-domens exakta värden', () => {
    const expected: Record<MomentSource, number> = {
      era_shift: 85,
      rival_sale: 75,
      star_injury: 70,
      derby_win: 65,
      captain_crisis: 60,
      nemesis_signed: 55,
      season_highlight: 55,
      transfer_story: 50,
      mecenat_costshare: 45,
      sponsor_negative: 45,
      sponsor_positive: 40,
    }
    expect(MOMENT_LEDGER_SIGNIFICANCE).toEqual(expected)
  })

  it('getRecentMomentsFromLedger sorterar nyast först och filtrerar bort icke-Moment-typer (t.ex. decision)', () => {
    const decisionEntry: EventLedgerEntry = {
      type: 'decision', semanticKey: 'd1', season: 1, matchday: 10, significance: 50,
    }
    const ledger = appendMomentsToLedger(
      [{ ...decisionEntry, clubId: 'club_test' }],
      [
        makeMoment({ id: 'old', matchday: 3, season: 1 }),
        makeMoment({ id: 'new', matchday: 12, season: 1 }),
      ],
      'club_test',
    )
    const game = makeMinimalGame({ eventLedger: ledger })
    const recent = getRecentMomentsFromLedger(game, 5)
    expect(recent.map(e => e.semanticKey)).toEqual(['new', 'old'])
  })

  it('getRecentMomentsFromLedger begränsar till limit', () => {
    const moments = Array.from({ length: 8 }, (_, i) => makeMoment({ id: `m${i}`, matchday: i + 1 }))
    const game = makeMinimalGame({ eventLedger: appendMomentsToLedger([], moments, 'club_test') })
    expect(getRecentMomentsFromLedger(game, 5)).toHaveLength(5)
  })

  it('slår ihop Moment och ripple för samma händelse till en kanonisk post', () => {
    const moment = makeMoment({
      id: 'moment_derby_fx1',
      source: 'derby_win',
      season: 3,
      matchday: 8,
      subjectClubId: 'rival',
    })
    const ripple: EventLedgerEntry = {
      type: 'derby_win',
      semanticKey: 'ripple_big_derby_win_rival_3_8',
      season: 3,
      matchday: 8,
      subject: { kind: 'club', id: 'rival' },
      significance: 75,
      consequences: [{ field: 'fanMood', dir: 'up', magnitude: 'kraftigt' }],
    }

    const ledger = appendMomentsAndEntriesToLedger([], [moment], [ripple])

    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({
      semanticKey: 'moment_derby_fx1',
      type: 'derby_win',
      significance: 75,
      consequences: ripple.consequences,
    })
  })

  it('behåller separata poster när Moment och ripple beskriver olika händelser', () => {
    const moment = makeMoment({
      id: 'moment_injury_p1_8',
      source: 'star_injury',
      season: 3,
      matchday: 8,
      subjectPlayerId: 'p1',
    })
    const ripple: EventLedgerEntry = {
      type: 'star_injury',
      semanticKey: 'ripple_star_injured_p2_3_8',
      season: 3,
      matchday: 8,
      subject: { kind: 'player', id: 'p2' },
      significance: 55,
      consequences: [{ field: 'playerMorale', dir: 'down', magnitude: 'tydligt' }],
    }

    expect(appendMomentsAndEntriesToLedger([], [moment], [ripple])).toHaveLength(2)
  })

  it('stämplar managerägda batchposter när manageridentiteten skickas med', () => {
    const decision: EventLedgerEntry = {
      type: 'decision', semanticKey: 'decision:test', season: 3, matchday: 8, significance: 50,
    }
    const clubEvent: EventLedgerEntry = {
      type: 'big_win', semanticKey: 'big_win:test', season: 3, matchday: 8, significance: 50,
    }

    const ledger = appendMomentsAndEntriesToLedger([], [], [decision, clubEvent], 'club_test', 'save_test')

    expect(ledger[0]).toMatchObject({ clubId: 'club_test', managerId: 'save_test' })
    expect(ledger[1]).toMatchObject({ clubId: 'club_test' })
    expect(ledger[1].managerId).toBeUndefined()
  })

  it('resolveSubjectName slår upp spelare/klubb/mecenat ur id, returnerar undefined för okänt', () => {
    const game = makeMinimalGame({
      players: [{ id: 'p1', firstName: 'Sten', lastName: 'Ek' }] as unknown as SaveGame['players'],
      clubs: [{ id: 'c1', name: 'IFK Testby' }] as unknown as SaveGame['clubs'],
      mecenater: [{ id: 'mec1', name: 'Britt Lundvall' }] as unknown as SaveGame['mecenater'],
    })
    expect(resolveSubjectName(game, { kind: 'player', id: 'p1' })).toBe('Sten Ek')
    expect(resolveSubjectName(game, { kind: 'club', id: 'c1' })).toBe('IFK Testby')
    expect(resolveSubjectName(game, { kind: 'mecenat', id: 'mec1' })).toBe('Britt Lundvall')
    expect(resolveSubjectName(game, { kind: 'player', id: 'okänd' })).toBeUndefined()
    expect(resolveSubjectName(game, undefined)).toBeUndefined()
  })

  // DOM_PATRON_MECENAT_LAST_2026-09-02.md — patron är EN entitet (game.patron,
  // inte en array), id-matchning ändå (en avgången patron kan ha ersatts av
  // en ny med annat id innan en gammal liggarpost renderas).
  it('resolveSubjectName slår upp patronen ur game.patron via id, mismatch/frånvaro ger undefined', () => {
    const game = makeMinimalGame({
      patron: { id: 'patron_karl', name: 'Karl Hedin' } as unknown as SaveGame['patron'],
    })
    expect(resolveSubjectName(game, { kind: 'patron', id: 'patron_karl' })).toBe('Karl Hedin')
    expect(resolveSubjectName(game, { kind: 'patron', id: 'patron_annan' })).toBeUndefined()
    expect(resolveSubjectName(makeMinimalGame({ patron: undefined }), { kind: 'patron', id: 'patron_karl' })).toBeUndefined()
  })
})
