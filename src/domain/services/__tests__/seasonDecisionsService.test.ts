/**
 * seasonDecisionsService — AUDIT DEL 2 A3, uppföljning (2026-08-09).
 *
 * Rot: collectSeasonDecisions() läste game.storylines helt utan dedup mot
 * DIN SÄSONG (SeasonSummaryScreen.tsx), en tredje okoordinerad läsare av
 * samma array upptäckt vid Playwright-verifiering av A3-fixet. Jacobs
 * ruling: behåll storylines i DINA VAL, men dela seenTypes så en storyline-
 * typ bara syns en gång per skärm — excludeStorylineTypes är den mekanismen.
 */
import { describe, it, expect } from 'vitest'
import { collectSeasonDecisions, getSeasonLicenseConsequence, getSeasonCommunityShiftHighlights, getSeasonFacilityOutcome } from '../seasonDecisionsService'
import { buildStorylineResolutionLedgerEntry } from '../storylineLedgerService'
import type { SaveGame } from '../../entities/SaveGame'
import type { StorylineEntry } from '../../entities/Narrative'
import type { EventLedgerEntry } from '../../entities/Narrative'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    currentSeason: 8, currentMatchday: 12, managedClubId: 'club_home', players: [],
    storylines: [], boardObjectiveHistory: [],
    ...overrides,
  } as unknown as SaveGame
}

function withCanonicalStorylines(storylines: StorylineEntry[]): SaveGame {
  const game = makeGame({ storylines })
  return {
    ...game,
    eventLedger: storylines.map(storyline => (
      buildStorylineResolutionLedgerEntry(storyline, game.currentMatchday)!
    )),
  }
}

describe('collectSeasonDecisions — excludeStorylineTypes', () => {
  it('utan exclude-set: alla säsongens storylines listas (befintligt beteende)', () => {
    const game = withCanonicalStorylines([
      { id: 's1', type: 'underdog_season', season: 8, matchday: 12, description: '', displayText: 'Ingen trodde på oss.', resolved: true },
    ])
    const decisions = collectSeasonDecisions(game)
    expect(decisions.map(d => d.text)).toContain('Ingen trodde på oss.')
  })

  it('med exclude-set: en storyline-typ som redan claimats av DIN SÄSONG hoppas över', () => {
    const game = withCanonicalStorylines([
      { id: 's1', type: 'underdog_season', season: 8, matchday: 12, description: '', displayText: 'Ingen trodde på oss.', resolved: true },
      { id: 's2', type: 'gala_winner', season: 8, matchday: 21, description: '', displayText: 'Vann galan.', resolved: true },
    ])
    const claimed = new Set(['underdog_season'])
    const decisions = collectSeasonDecisions(game, claimed)
    expect(decisions.map(d => d.text)).not.toContain('Ingen trodde på oss.')
    expect(decisions.map(d => d.text)).toContain('Vann galan.')
  })

  it('exclude-set påverkar inte icke-storyline-beslut (akademi, styrelse, etc)', () => {
    const game = makeGame({
      players: [{ id: 'p1', clubId: 'club_home', promotedFromAcademy: true, promotionRound: 5, promotionSeason: 8, firstName: 'Nils', lastName: 'Berg', age: 17 }] as never,
      boardObjectiveHistory: [{ season: 8, objectiveId: 'topp6', result: 'met' }] as never,
    })
    const decisions = collectSeasonDecisions(game, new Set(['underdog_season']))
    expect(decisions.some(d => d.text.includes('Nils Berg'))).toBe(true)
    expect(decisions.some(d => d.text.includes('topp6'))).toBe(true)
  })

  it('tar inte med en akademiuppflyttning från en tidigare säsong', () => {
    const game = makeGame({ players: [
      { id: 'new_8', clubId: 'club_home', promotedFromAcademy: true, promotionRound: 5, promotionSeason: 8, firstName: 'Ny', lastName: 'Spelare', age: 17 },
      { id: 'old_7', clubId: 'club_home', promotedFromAcademy: true, promotionRound: 5, promotionSeason: 7, firstName: 'Gammal', lastName: 'Spelare', age: 18 },
    ] as never })
    const text = collectSeasonDecisions(game).map(d => d.text).join(' ')
    expect(text).toContain('Ny Spelare')
    expect(text).not.toContain('Gammal Spelare')
  })

  it('visar styrelseuppdragets spelarnamn, inte rått objectiveId', () => {
    const game = makeGame({ boardObjectiveHistory: [{ season: 8, objectiveId: 'cupRun', result: 'met' }] as never })
    expect(collectSeasonDecisions(game)[0].text).toBe('Styrelseuppdrag: Gå långt i cupen — uppfyllt')
  })

  it('arsbok-dina-val-licensstatus: licensstatus är INTE längre en Dina-val-rad — den är ett systemtillstånd, inte ett val', () => {
    const game = makeGame({ licenseStatus: 'point_deduction' })
    expect(collectSeasonDecisions(game).some(d => d.text.startsWith('Licensnämnden:'))).toBe(false)
  })
})

describe('getSeasonLicenseConsequence', () => {
  it('utan säsongspost läser den levande zonen från licenseRiskScore, inte stale licenseStatus', () => {
    const game = makeGame({ licenseRiskScore: 65, licenseStatus: 'clear' })
    expect(getSeasonLicenseConsequence(game, 8)).toEqual({
      source: 'liveZone',
      standing: 'point_deduction',
      icon: '📋',
      text: 'Licensnämnden: Licensen är hotad. Vänd resultatet inom två säsonger.',
    })
  })

  it('clear är ett levande standing, inte den historiska actionen cleared', () => {
    const game = makeGame({ licenseRiskScore: 0 })
    expect(getSeasonLicenseConsequence(game, 8)).toEqual({
      source: 'liveZone',
      standing: 'clear',
      icon: '📋',
      text: 'Licensnämnden: Ekonomin bär.',
    })
  })

  it('en fryst säsongspost vinner över dagens zon och bär action-ontologin', () => {
    const entry: EventLedgerEntry = {
      type: 'license_event', semanticKey: 'license_event_club_home_s7', clubId: 'club_home',
      season: 7, matchday: 22, subject: { kind: 'club', id: 'club_home' }, significance: 50,
      licenseEvent: { status: 'cleared' },
    } as EventLedgerEntry
    const game = makeGame({
      licenseRiskScore: 65,
      eventLedger: [entry],
      inbox: [{
        id: 'inbox_license_status_7', date: '2032-06-01', type: 'license_review',
        title: 'Licensnämnden', body: 'Den frysta domen från säsong sju.', isRead: true,
      }] as unknown as SaveGame['inbox'],
    })

    const consequence = getSeasonLicenseConsequence(game, 7)
    expect(consequence).toMatchObject({
      source: 'eventLedger', action: 'cleared', entry,
      icon: '📋', text: 'Den frysta domen från säsong sju.',
    })
    expect('standing' in consequence).toBe(false)
  })

  it('nyss avslutad current-season använder posten så snart den skrivits', () => {
    const entry: EventLedgerEntry = {
      type: 'license_event', semanticKey: 'license_event_club_home_s8', clubId: 'club_home',
      season: 8, matchday: 22, subject: { kind: 'club', id: 'club_home' }, significance: 75,
      licenseEvent: { status: 'point_deduction', pointsDeducted: 3 },
    } as EventLedgerEntry
    const game = makeGame({ licenseRiskScore: 0, eventLedger: [entry], inbox: [] })

    expect(getSeasonLicenseConsequence(game, 8)).toMatchObject({
      source: 'eventLedger', action: 'point_deduction', entry, text: null,
    })
  })
})

describe('getSeasonCommunityShiftHighlights — liggare-ny-community-shift DEL 2 (årsboken)', () => {
  const CLUB_ID = 'club_home'
  const summary = { season: 8, clubId: CLUB_ID, communityHighlights: [] as string[] }

  it('läser säsongens community_shift-poster ur liggaren, sorterade på matchdag', () => {
    const later: EventLedgerEntry = {
      type: 'community_shift', semanticKey: 'x2', clubId: CLUB_ID, season: 8, matchday: 15,
      subject: { kind: 'club', id: CLUB_ID }, significance: 55,
      communityShift: { from: 52, to: 48, direction: 'down' },
    } as EventLedgerEntry
    const earlier: EventLedgerEntry = {
      type: 'community_shift', semanticKey: 'x1', clubId: CLUB_ID, season: 8, matchday: 5,
      subject: { kind: 'club', id: CLUB_ID }, significance: 55,
      communityShift: { from: 48, to: 52, direction: 'up' },
    } as EventLedgerEntry
    const game = makeGame({ eventLedger: [later, earlier] })
    expect(getSeasonCommunityShiftHighlights(game, summary)).toEqual([
      'Orten vände. 48→52 — det märks på läktaren först.',
      'Orten drog sig undan. 52→48. Det märks på läktaren först.',
    ])
  })

  it('en annan säsongs post filtreras bort', () => {
    const otherSeason: EventLedgerEntry = {
      type: 'community_shift', semanticKey: 'x3', clubId: CLUB_ID, season: 7, matchday: 20,
      subject: { kind: 'club', id: CLUB_ID }, significance: 55,
      communityShift: { from: 48, to: 52, direction: 'up' },
    } as EventLedgerEntry
    const game = makeGame({ eventLedger: [otherSeason] })
    expect(getSeasonCommunityShiftHighlights(game, summary)).toEqual([])
  })

  it('redan populerat summary.communityHighlights vinner över liggarfallback', () => {
    const game = makeGame({ eventLedger: [] })
    expect(getSeasonCommunityShiftHighlights(game, { ...summary, communityHighlights: ['Stannad text.'] }))
      .toEqual(['Stannad text.'])
  })
})

describe('getSeasonFacilityOutcome — liggare-ny-facility-trial-outcome DEL 2 (årsboken)', () => {
  const CLUB_ID = 'club_home'
  const summary = { season: 8, clubId: CLUB_ID }

  it('läser säsongens facility_trial_outcome-post, samma text som kafferums-ekot', () => {
    const entry: EventLedgerEntry = {
      type: 'facility_trial_outcome', semanticKey: 'y1', clubId: CLUB_ID, season: 8, matchday: 10,
      subject: { kind: 'club', id: CLUB_ID }, significance: 65,
      facilityTrialOutcome: { stage: 'nedlagd', outcome: 'kommun_nej', support: 20 },
    } as EventLedgerEntry
    const game = makeGame({ eventLedger: [entry] })
    expect(getSeasonFacilityOutcome(game, summary)).toEqual({
      icon: '🏟️', text: 'Kommunen sa nej. Inte till hallen. Till oss.',
    })
  })

  it('ingen post den säsongen → null, ingen mening hellre än falsk', () => {
    const game = makeGame({ eventLedger: [] })
    expect(getSeasonFacilityOutcome(game, summary)).toBeNull()
  })
})
