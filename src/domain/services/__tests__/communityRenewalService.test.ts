/**
 * ANSPRÅK 4, spak 3 — nyhetstretmillen
 * (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md, D038).
 *
 * Tre saker testas här, i domens egen ordning:
 *   1. Avtrappningskurvan (kontinuerlig, golv > 0, exakt 1,0 för små klubbar).
 *   2. Klockan (backfyllning utan bakåtdatering, förnyelse nollställer).
 *   3. Förnyelsebeslutet (kostar riktiga pengar, rör aldrig CS, avböjbart).
 */
import { describe, it, expect } from 'vitest'
import {
  getActivityStalenessMultiplier,
  activityStalenessRetention,
  getActivityRenewalCost,
  ACTIVITY_STALENESS_FLOOR,
  ACTIVITY_RENEWAL_TRIGGER_MULTIPLIER,
  CS_UPKEEP_REP_FLOOR,
  CS_UPKEEP_REP_CEIL,
} from '../communityStandingScaling'
import {
  STALEABLE_ACTIVITY_KEYS,
  isActivityActive,
  getActiveStaleableActivities,
  backfillActivitiesSince,
  getSeasonsActive,
  getActivityStaleness,
  generateCommunityRenewalEvent,
} from '../communityRenewalService'
import { resolveEvent } from '../events/eventResolver'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { SaveGame } from '../../entities/SaveGame'
import type { CommunityActivities } from '../../entities/Community'

const ALL_ON: CommunityActivities = {
  kiosk: 'upgraded', lottery: 'intensive', bandyplay: true, functionaries: true,
  julmarknad: false, bandySchool: true, socialMedia: true, vipTent: true,
  pensionarskaffe: true, soppkvall: true, skolbesok: true,
}

// ── 1. Avtrappningskurvan ──────────────────────────────────────────────────

describe('getActivityStalenessMultiplier — kurvans form', () => {
  it('är exakt 1,0 vid seasonsActive = 0, oavsett storlek', () => {
    for (const rep of [40, 60, 80, 90, 100]) {
      expect(getActivityStalenessMultiplier(0, rep)).toBe(1)
    }
  })

  it('LITEN KLUBB: exakt 1,0 för alla rimliga seasonsActive vid/under rykte 80', () => {
    // Domens SKYDDAT-punkt: "vid låg rep är staleness-takten ~0". Här är den
    // exakt 0 — garanterad av rampens form, inte av ett villkor.
    for (const rep of [0, 30, 45, 56, 70, CS_UPKEEP_REP_FLOOR]) {
      for (const s of [0, 1, 2, 5, 10, 25]) {
        expect(getActivityStalenessMultiplier(s, rep)).toBe(1)
      }
    }
  })

  it('STOR KLUBB: faller synligt och monotont med antalet säsonger', () => {
    const serie = [0, 1, 2, 3, 5, 10].map(s => getActivityStalenessMultiplier(s, CS_UPKEEP_REP_CEIL))
    for (let i = 1; i < serie.length; i++) {
      expect(serie[i]).toBeLessThan(serie[i - 1])
    }
    // Efter en hel säsong har ett topplags supportrar tappat mätbart intresse.
    expect(serie[1]).toBeCloseTo(0.8875, 4)
    expect(serie[1]).toBeLessThanOrEqual(ACTIVITY_RENEWAL_TRIGGER_MULTIPLIER)
  })

  it('når ALDRIG 0 — golvet är asymptotiskt och strikt positivt (D031:s anti-vägg)', () => {
    for (const s of [10, 50, 200, 10_000]) {
      const m = getActivityStalenessMultiplier(s, 100)
      expect(m).toBeGreaterThan(0)
      expect(m).toBeGreaterThanOrEqual(ACTIVITY_STALENESS_FLOOR)
    }
    expect(getActivityStalenessMultiplier(10_000, 100)).toBeCloseTo(ACTIVITY_STALENESS_FLOOR, 6)
  })

  it('är kontinuerlig i rykte — ingen tröskel någonstans i 78-100', () => {
    let prev = activityStalenessRetention(78)
    for (let rep = 78; rep <= 100; rep += 0.5) {
      const now = activityStalenessRetention(rep)
      expect(Math.abs(now - prev)).toBeLessThan(0.02)  // inget hopp
      expect(now).toBeLessThanOrEqual(prev + 1e-9)     // monotont fallande
      prev = now
    }
  })

  it('negativa/brutna seasonsActive kollapsar till full effekt, inte till en negativ exponent', () => {
    expect(getActivityStalenessMultiplier(-3, 100)).toBe(1)
    expect(getActivityStalenessMultiplier(1.9, 100)).toBe(getActivityStalenessMultiplier(1, 100))
  })
})

describe('getActivityRenewalCost — priset skalar med storlek', () => {
  it('är grundkostnaden för en liten klubb och fyra gånger så dyrt i toppen', () => {
    expect(getActivityRenewalCost(50)).toBe(25_000)
    expect(getActivityRenewalCost(CS_UPKEEP_REP_FLOOR)).toBe(25_000)
    expect(getActivityRenewalCost(CS_UPKEEP_REP_CEIL)).toBe(100_000)
    expect(getActivityRenewalCost(90)).toBe(63_000)
  })
})

// ── 2. Klockan ─────────────────────────────────────────────────────────────

describe('staleness-klockan', () => {
  it('backfyller aktiva aktiviteter med INNEVARANDE säsong — aldrig bakåtdaterat', () => {
    // Migrationsfallet: en save från före mekaniken, kiosken igång sedan urminnes
    // tid. Efter backfyllning ska den vara NY, inte gammal.
    const since = backfillActivitiesSince(undefined, ALL_ON, 7)
    for (const key of STALEABLE_ACTIVITY_KEYS) {
      expect(since[key]).toBe(7)
      expect(getSeasonsActive(since, key, 7)).toBe(0)
      expect(getActivityStalenessMultiplier(getSeasonsActive(since, key, 7), 100)).toBe(1)
    }
  })

  it('rör inte en redan känd startsäsong', () => {
    const since = backfillActivitiesSince({ kiosk: 2 }, ALL_ON, 7)
    expect(since.kiosk).toBe(2)
    expect(since.skolbesok).toBe(7)
    expect(getSeasonsActive(since, 'kiosk', 7)).toBe(5)
  })

  it('returnerar SAMMA referens när ingenting behövde backfyllas', () => {
    const before = backfillActivitiesSince(undefined, ALL_ON, 3)
    expect(backfillActivitiesSince(before, ALL_ON, 3)).toBe(before)
  })

  it('ger inga klockor för aktiviteter som inte är igång', () => {
    const since = backfillActivitiesSince(undefined, { ...ALL_ON, kiosk: 'none', skolbesok: false }, 4)
    expect(since.kiosk).toBeUndefined()
    expect(since.skolbesok).toBeUndefined()
    expect(since.soppkvall).toBe(4)
  })

  it('isActivityActive behandlar kiosk/lottery-nivåer som de nio csBoost-villkoren gör', () => {
    expect(isActivityActive({ ...ALL_ON, kiosk: 'none' }, 'kiosk')).toBe(false)
    expect(isActivityActive({ ...ALL_ON, kiosk: 'basic' }, 'kiosk')).toBe(true)
    expect(isActivityActive({ ...ALL_ON, lottery: 'none' }, 'lottery')).toBe(false)
    expect(isActivityActive(undefined, 'skolbesok')).toBe(false)
    expect(getActiveStaleableActivities(ALL_ON)).toHaveLength(9)
  })

  it('en klocka framåt i tiden ger full effekt, inte en negativ exponent', () => {
    expect(getSeasonsActive({ kiosk: 9 }, 'kiosk', 4)).toBe(0)
  })
})

// ── 3. Förnyelsebeslutet ───────────────────────────────────────────────────

function bigClubGame(seasonsSince: number, reputation: number, finances = 500_000): SaveGame {
  const base = createNewGame({ managerName: 'A4', clubId: 'club_vastanfors', seed: 100 })
  const season = 6
  return {
    ...base,
    pendingScreen: null,
    currentSeason: season,
    communityActivities: { ...ALL_ON },
    communityActivitiesSince: Object.fromEntries(
      STALEABLE_ACTIVITY_KEYS.map(k => [k, season - seasonsSince]),
    ),
    clubs: base.clubs.map(c =>
      c.id === base.managedClubId ? { ...c, reputation, finances } : c,
    ),
  }
}

describe('generateCommunityRenewalEvent', () => {
  it('genereras ALDRIG för en klubb på/under rykte 80 — hur gamla aktiviteterna än är', () => {
    for (const rep of [45, 60, CS_UPKEEP_REP_FLOOR]) {
      expect(generateCommunityRenewalEvent(bigClubGame(12, rep), 5)).toBeNull()
    }
  })

  it('genereras inte medan aktiviteterna fortfarande är färska', () => {
    expect(generateCommunityRenewalEvent(bigClubGame(0, 100), 5)).toBeNull()
  })

  it('genereras för en dominant klubb med slitna aktiviteter — som ett dilemma med två val', () => {
    const event = generateCommunityRenewalEvent(bigClubGame(3, 100), 5)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('communityActivityRenewal')
    expect(event!.resolved).toBe(false)
    expect(event!.choices).toHaveLength(2)
    expect(event!.choices[0].effect.type).toBe('renewCommunityActivity')
    expect(event!.choices[0].effect.amount).toBe(-100_000)
    expect(event!.choices[0].consequenceLevel).toBe('costly')
    // Avböj är ETT UTTRYCKLIGT VAL (noOp), inte ett implicit ickesvar — och
    // ger deferredRolloverService ett default-utfall att tillämpa.
    expect(event!.choices[1].effect.type).toBe('noOp')
  })

  it('SVENSK TEXT: title/body/valetiketter är tomma tills Opus levererar', () => {
    const event = generateCommunityRenewalEvent(bigClubGame(3, 100), 5)!
    expect(event.title).toBe('')
    expect(event.body).toBe('')
    expect(event.choices[0].label).toBe('')
    expect(event.choices[1].label).toBe('')
  })

  it('erbjuds inte när klubben inte har råd — ett obetalbart kort är ingen fråga', () => {
    expect(generateCommunityRenewalEvent(bigClubGame(3, 100, 10_000), 5)).toBeNull()
  })

  it('väljer den MEST slitna aktiviteten först', () => {
    const g = bigClubGame(1, 100)
    const game: SaveGame = {
      ...g,
      communityActivitiesSince: { ...g.communityActivitiesSince, skolbesok: 1 },  // 5 säsonger gammal
    }
    const event = generateCommunityRenewalEvent(game, 5)!
    expect(event.choices[0].effect.communityKey).toBe('skolbesok')
    const staleList = getActivityStaleness(game, 100)
    expect(staleList[0].key).toBe('skolbesok')
  })

  it('erbjuder inte samma aktivitet två gånger samma säsong', () => {
    const g = bigClubGame(3, 100)
    const first = generateCommunityRenewalEvent(g, 5)!
    const after: SaveGame = { ...g, resolvedEventIds: [...(g.resolvedEventIds ?? []), first.id] }
    const second = generateCommunityRenewalEvent(after, 9)
    expect(second).not.toBeNull()
    expect(second!.choices[0].effect.communityKey)
      .not.toBe(first.choices[0].effect.communityKey)
  })
})

describe('renewCommunityActivity (effekten)', () => {
  it('betalar riktiga pengar, nollställer klockan och rör ALDRIG communityStanding', () => {
    const g = bigClubGame(3, 100)
    const event = generateCommunityRenewalEvent(g, 5)!
    const key = event.choices[0].effect.communityKey!
    const gameWithEvent: SaveGame = { ...g, communityStanding: 88, pendingEvents: [event] }

    const financesBefore = gameWithEvent.clubs.find(c => c.id === g.managedClubId)!.finances
    const after = resolveEvent(gameWithEvent, event.id, 'renew', () => 0.5)
    const financesAfter = after.clubs.find(c => c.id === g.managedClubId)!.finances

    expect(financesAfter).toBe(financesBefore - 100_000)
    expect(after.communityActivitiesSince?.[key as 'kiosk']).toBe(after.currentSeason)
    expect(getActivityStalenessMultiplier(
      getSeasonsActive(after.communityActivitiesSince, key as 'kiosk', after.currentSeason), 100,
    )).toBe(1)
    // SKYDDAT: förnyelsen HÖJER inte CS. Den förhindrar bara avtrappningen.
    expect(after.communityStanding).toBe(88)
  })

  it('avböj kostar ingenting och lämnar klockan orörd — aktiviteten fortsätter tappa', () => {
    const g = bigClubGame(3, 100)
    const event = generateCommunityRenewalEvent(g, 5)!
    const key = event.choices[0].effect.communityKey! as 'kiosk'
    const gameWithEvent: SaveGame = { ...g, communityStanding: 88, pendingEvents: [event] }

    const financesBefore = gameWithEvent.clubs.find(c => c.id === g.managedClubId)!.finances
    const after = resolveEvent(gameWithEvent, event.id, 'decline', () => 0.5)

    expect(after.clubs.find(c => c.id === g.managedClubId)!.finances).toBe(financesBefore)
    expect(after.communityActivitiesSince?.[key]).toBe(g.communityActivitiesSince?.[key])
    expect(after.communityStanding).toBe(88)
  })
})
