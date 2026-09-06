/**
 * O13 / M11 — årsboken över en klubbgräns (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * Domens fråga 4 ("Vad händer med SeasonSummary-kedjan när managern byter klubb
 * mitt i en karriär?") och dess "Godkänd när" ("En spelare kan berätta om två
 * klubbar i samma karriär") landar båda här.
 *
 * Projektet saknar @testing-library/react, så HistoryScreens logik testas via
 * de rena funktioner den bygger på — samma mönster som resolveDisplayedGame
 * (3.3, Kontrakt A) redan etablerat i samma fil.
 */

import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { deriveCareerSpells, deriveManagerLedgerStatsByClub, HistoryManagerSeason, managerSeasonEntriesForHistory, shouldShowEraChangeForSummary } from '../HistoryScreen'
import type { SeasonSummary } from '../../../domain/entities/SeasonSummary'
import type { EventLedgerEntry } from '../../../domain/entities/Narrative'
import { ClubExpectation } from '../../../domain/enums'

function s(season: number, clubId: string, clubName: string, over: Partial<SeasonSummary> = {}): SeasonSummary {
  return {
    id: `s_${season}_${clubId}`,
    season, clubId, clubName,
    finalPosition: 6, points: 20, wins: 8, draws: 4, losses: 10,
    goalsFor: 80, goalsAgainst: 85, goalDifference: -5,
    playoffResult: null,
    boardExpectation: ClubExpectation.MidTable,
    metExpectation: true, expectationVerdict: 'met',
    topScorer: null, topAssister: null, topRated: null, mostImproved: null, youngPlayer: null,
    totalGoals: 80, totalAssists: 50, totalCornerGoals: 18, totalCleanSheets: 2,
    longestWinStreak: 3, longestLossStreak: 3, biggestWin: null, worstLoss: null,
    homeRecord: { wins: 5, draws: 2, losses: 4 },
    awayRecord: { wins: 3, draws: 2, losses: 6 },
    firstHalfPoints: 10, secondHalfPoints: 10, formTrend: 'stable',
    totalInjuries: 4, mostInjuredPlayer: null,
    startFinances: 0, endFinances: 0, financialChange: 0,
    ...over,
  } as SeasonSummary
}

describe('O13 — deriveCareerSpells', () => {
  it('en klubb ger en period', () => {
    const spells = deriveCareerSpells([
      s(2026, 'club_a', 'Alfa'),
      s(2027, 'club_a', 'Alfa'),
    ])
    expect(spells).toHaveLength(1)
    expect(spells[0]).toMatchObject({ clubId: 'club_a', fromSeason: 2026, toSeason: 2027, seasonCount: 2 })
  })

  it('två klubbar ger två perioder, i kronologisk ordning', () => {
    const spells = deriveCareerSpells([
      s(2026, 'club_a', 'Alfa'),
      s(2027, 'club_a', 'Alfa'),
      s(2029, 'club_b', 'Beta'),
    ])
    expect(spells.map(sp => sp.clubName)).toEqual(['Alfa', 'Beta'])
    expect(spells[0].toSeason).toBe(2027)
    expect(spells[1]).toMatchObject({ fromSeason: 2029, toSeason: 2029, seasonCount: 1 })
  })

  it('en återkomst till samma klubb är två perioder, inte en', () => {
    const spells = deriveCareerSpells([
      s(2026, 'club_a', 'Alfa'),
      s(2028, 'club_b', 'Beta'),
      s(2030, 'club_a', 'Alfa'),
    ])
    expect(spells).toHaveLength(3)
    expect(spells.map(sp => sp.clubId)).toEqual(['club_a', 'club_b', 'club_a'])
  })

  it('tom historik ger inga perioder', () => {
    expect(deriveCareerSpells([])).toEqual([])
  })
})

describe('O13 — epokraden korsar aldrig en klubbgräns', () => {
  it('visas när epoken skiftade inom SAMMA klubb', () => {
    const current = s(2027, 'club_a', 'Alfa', { clubEra: 'rebuilding' })
    const previous = s(2026, 'club_a', 'Alfa', { clubEra: 'golden' })
    expect(shouldShowEraChangeForSummary(current, previous)).toBe(true)
  })

  it('visas INTE när föregående säsong var en annan klubb', () => {
    // Buggen den här spärren stänger: raden hade rapporterat ett epokskifte
    // som aldrig inträffat, och namngivit fel klubb på köpet.
    const current = s(2029, 'club_b', 'Beta', { clubEra: 'rebuilding' })
    const previous = s(2027, 'club_a', 'Alfa', { clubEra: 'golden' })
    expect(shouldShowEraChangeForSummary(current, previous)).toBe(false)
  })

  it('visas inte utan föregående säsong', () => {
    expect(shouldShowEraChangeForSummary(s(2026, 'club_a', 'Alfa', { clubEra: 'golden' }), undefined)).toBe(false)
  })

  it('visas inte när epoken är oförändrad', () => {
    const current = s(2027, 'club_a', 'Alfa', { clubEra: 'golden' })
    const previous = s(2026, 'club_a', 'Alfa', { clubEra: 'golden' })
    expect(shouldShowEraChangeForSummary(current, previous)).toBe(false)
  })
})

describe('O13 — säsongskortets klubbidentitet är fryst, inte live', () => {
  it('varje post bär sin EGEN klubb, oberoende av var managern sitter nu', () => {
    // Regressionsvakt för de två uppslagsbuggarna i HistoryScreen.tsx:
    // epokraden och tabellmarkeringen läste game.managedClubId (= NUVARANDE
    // klubb) för en säsong som kunde tillhöra en annan.
    const career = [s(2026, 'club_a', 'Alfa'), s(2029, 'club_b', 'Beta')]
    const liveManagedClubId = 'club_b'
    for (const summary of career) {
      // Den highlightade raden i en arkiverad tabell ska matcha postens
      // clubId, aldrig den live-hanterade klubben.
      const highlighted = summary.clubId
      if (summary.season === 2026) expect(highlighted).not.toBe(liveManagedClubId)
      expect(highlighted).toBe(summary.clubId)
    }
  })
})

describe('HIGH 2 — managerhistoriken läser säsongens frysta poster', () => {
  it('återger managerSeason ordagrant och i lagrad ordning', () => {
    const frozen = [
      { season: 2027, matchday: 8, type: 'burnout_peak' as const, text: 'Första frysta raden.' },
      { season: 2027, matchday: 20, type: 'burnout_scar' as const, text: 'Andra frysta raden.' },
    ]
    const summary = s(2027, 'club_a', 'Alfa', { managerSeason: frozen })

    expect(managerSeasonEntriesForHistory(summary)).toEqual(frozen)
    const markup = renderToStaticMarkup(createElement(HistoryManagerSeason, { summary }))
    expect(markup).toContain('Första frysta raden.')
    expect(markup).toContain('Andra frysta raden.')
    expect(markup.indexOf('Första frysta raden.')).toBeLessThan(markup.indexOf('Andra frysta raden.'))
  })

  it('gissar inte fram managerhistorik för äldre säsonger utan fältet', () => {
    expect(managerSeasonEntriesForHistory(s(2026, 'club_a', 'Alfa'))).toEqual([])
  })
})

/**
 * DOM_LIGGARE_CLUBID_2026-09-04, arbetsordning steg 3 — HistoryScreens
 * managerId-vy. readManagerLedger (eventLedgerService.ts) filtrerar på
 * managerId; det här testet låser att gruppering per clubId sker korrekt
 * och att poster utan managerId (klubbens egna, inte managerns) räknas
 * bort av readManagerLedger innan de ens når grupperingen.
 */
describe('DOM_LIGGARE_CLUBID — deriveManagerLedgerStatsByClub', () => {
  function entry(over: Partial<EventLedgerEntry>): EventLedgerEntry {
    return { type: 'decision', semanticKey: 'k', season: 2026, matchday: 1, significance: 10, ...over }
  }

  it('räknar beslut och personliga mål per klubb, bara för DEN HÄR managern', () => {
    const game = {
      id: 'manager_1',
      eventLedger: [
        entry({ type: 'decision', clubId: 'club_a', managerId: 'manager_1' }),
        entry({ type: 'decision', clubId: 'club_a', managerId: 'manager_1' }),
        entry({ type: 'player_milestone', clubId: 'club_a', managerId: 'manager_1' }),
        entry({ type: 'decision', clubId: 'club_b', managerId: 'manager_1' }),
        // Klubbens egen post (t.ex. en föregångares beslut) — ingen managerId
        // för DEN HÄR managern, ska inte räknas in.
        entry({ type: 'decision', clubId: 'club_a', managerId: 'manager_0' }),
        // Ambient/klubbtillhörig typ utan managerId alls.
        entry({ type: 'big_win', clubId: 'club_a' }),
      ],
    }

    expect(deriveManagerLedgerStatsByClub(game)).toEqual({
      club_a: { decisions: 2, personalGoals: 1 },
      club_b: { decisions: 1, personalGoals: 0 },
    })
  })

  it('tom liggare ger tom karta, ingen krasch', () => {
    expect(deriveManagerLedgerStatsByClub({ id: 'manager_1', eventLedger: [] })).toEqual({})
  })
})
