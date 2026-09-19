/**
 * KÖRORDER 2026-09-18 §4.3 — säsongsklockan.
 *
 * Periodiseringen hade fyra knappar men sa aldrig var i säsongen laget står
 * eller vad fasen är byggd för. Testerna låser fasgränserna och de två
 * varningarna, inte texterna (de är Fables och kan skrivas om).
 *
 * Fasgränserna räknas ur fixturelistan, aldrig hårdkodat 20–22 — samma regel
 * som schema a i lever-sweep. Ett test med 18 ligaomgångar bevisar det.
 */
import { describe, it, expect } from 'vitest'
import {
  getSeasonClock,
  getSeasonClockWarning,
  MODE_EXPLANATION,
  CLOCK_BUILD_ROUNDS,
  CLOCK_PEAK_ROUNDS,
  TOPPA_SPIKE_ROUNDS,
} from '../periodisationService'

const MANAGED = 'club_us'

function fixtures(total: number, played: number) {
  return Array.from({ length: total }, (_, i) => ({
    homeClubId: i % 2 === 0 ? MANAGED : 'club_them',
    awayClubId: i % 2 === 0 ? 'club_them' : MANAGED,
    season: 1,
    status: i < played ? 'completed' : 'scheduled',
    roundNumber: i + 1,
    isCup: false,
  }))
}

const clockAfter = (played: number, total = 22) => getSeasonClock({
  fixtures: fixtures(total, played),
  managedClubId: MANAGED,
  currentSeason: 1,
  eliminated: false,
  inPlayoff: false,
})

describe('§4.3 — fasgränserna', () => {
  it('inledningen är byggd för Bygg', () => {
    expect(clockAfter(0).phase).toBe('hosten')
    expect(clockAfter(CLOCK_BUILD_ROUNDS - 1).phase).toBe('hosten')
    expect(clockAfter(0).intendedMode).toBe('bygg')
  })

  it('mitten tar vid direkt efter inledningen', () => {
    expect(clockAfter(CLOCK_BUILD_ROUNDS).phase).toBe('mitten')
    expect(clockAfter(CLOCK_BUILD_ROUNDS).intendedMode).toBe('hall')
  })

  it('sista biten är de sista omgångarna före slutspelet', () => {
    const c = clockAfter(22 - CLOCK_PEAK_ROUNDS)
    expect(c.phase).toBe('sista_biten')
    expect(c.intendedMode).toBe('toppa')
    // En omgång tidigare är det fortfarande mitten.
    expect(clockAfter(22 - CLOCK_PEAK_ROUNDS - 1).phase).toBe('mitten')
  })

  it('gränsen räknas ur fixturelistan, inte ur talet 22', () => {
    // 18 ligaomgångar: sista biten ska börja vid omgång 16, inte 20.
    expect(clockAfter(18 - CLOCK_PEAK_ROUNDS, 18).phase).toBe('sista_biten')
    expect(clockAfter(18 - CLOCK_PEAK_ROUNDS - 1, 18).phase).toBe('mitten')
  })

  it('slutspel och utslagen är egna faser', () => {
    const base = { fixtures: fixtures(22, 22), managedClubId: MANAGED, currentSeason: 1 }
    expect(getSeasonClock({ ...base, eliminated: false, inPlayoff: true }).phase).toBe('slutspel')
    expect(getSeasonClock({ ...base, eliminated: true, inPlayoff: false }).phase).toBe('ute')
    expect(getSeasonClock({ ...base, eliminated: true, inPlayoff: false }).intendedMode).toBe('vila')
  })

  it('utslagen väger tyngre än pågående slutspel', () => {
    const c = getSeasonClock({
      fixtures: fixtures(22, 22), managedClubId: MANAGED, currentSeason: 1,
      eliminated: true, inPlayoff: true,
    })
    expect(c.phase).toBe('ute')
  })
})

describe('§4.3 — varningarna syns bara när valet kostar', () => {
  const mitten = clockAfter(CLOCK_BUILD_ROUNDS)
  const sista = clockAfter(22 - CLOCK_PEAK_ROUNDS)

  it('Toppa varnar först efter spiken', () => {
    expect(getSeasonClockWarning('toppa', TOPPA_SPIKE_ROUNDS - 1, sista)).toBeNull()
    expect(getSeasonClockWarning('toppa', TOPPA_SPIKE_ROUNDS, sista)).toContain('Spiken är förbi')
  })

  it('Bygg varnar i sista tredjedelen, men inte på hösten', () => {
    expect(getSeasonClockWarning('bygg', 1, clockAfter(0))).toBeNull()
    expect(getSeasonClockWarning('bygg', 1, sista)).toContain('hinner inte bära frukt')
  })

  it('ett läge som passar fasen varnar inte', () => {
    expect(getSeasonClockWarning('hall', 12, mitten)).toBeNull()
    expect(getSeasonClockWarning('vila', 5, mitten)).toBeNull()
  })
})

describe('§4.3 — varje läge har en förklaring', () => {
  it('alla fyra lägen är täckta och ingen rad är tom', () => {
    for (const mode of ['bygg', 'hall', 'toppa', 'vila'] as const) {
      expect(MODE_EXPLANATION[mode].length).toBeGreaterThan(20)
    }
  })
})
