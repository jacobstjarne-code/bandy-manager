import { describe, it, expect } from 'vitest'
import { checkLicenseStatus, buildLicenseInboxItem, licenseZoneFromScore, LICENSE_ZONE_TEXT } from '../licenseService'
import type { SaveGame } from '../../entities/SaveGame'
import type { LicenseStatus } from '../licenseService'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeGame(overrides: {
  finances?: number
  startFinances?: number
  licenseStatus?: LicenseStatus
  licenseRiskScore?: number
} = {}): SaveGame {
  const {
    finances = 100000,
    startFinances = 100000,
    licenseStatus,
    licenseRiskScore,
  } = overrides
  return {
    managedClubId: 'club_1',
    currentSeason: 1,
    currentDate: '2026-01-01',
    clubs: [
      {
        id: 'club_1',
        name: 'Testklubb',
        shortName: 'TEST',
        region: 'Mälardalen',
        reputation: 60,
        finances,
        wageBudget: 200000,
        transferBudget: 100000,
        youthQuality: 50,
        youthRecruitment: 50,
        youthDevelopment: 50,
        facilities: 50,
        squadPlayerIds: [],
      } as never,
    ],
    seasonStartSnapshot: { season: 1, finalPosition: 6, finances: startFinances, communityStanding: 50, squadSize: 20, supporterMembers: 100, academyPromotions: 0 },
    licenseStatus,
    licenseRiskScore,
  } as unknown as SaveGame
}

// ── licenseZoneFromScore ──────────────────────────────────────────────────────

describe('licenseZoneFromScore — trösklarna 40/60/80', () => {
  it('under 40 är clear', () => {
    expect(licenseZoneFromScore(0)).toBe('clear')
    expect(licenseZoneFromScore(39)).toBe('clear')
  })
  it('40-59 är first_warning', () => {
    expect(licenseZoneFromScore(40)).toBe('first_warning')
    expect(licenseZoneFromScore(59)).toBe('first_warning')
  })
  it('60-79 är point_deduction', () => {
    expect(licenseZoneFromScore(60)).toBe('point_deduction')
    expect(licenseZoneFromScore(79)).toBe('point_deduction')
  })
  it('80+ är license_denied', () => {
    expect(licenseZoneFromScore(80)).toBe('license_denied')
    expect(licenseZoneFromScore(100)).toBe('license_denied')
  })
})

// ── checkLicenseStatus — ackumulatorn (Jacobs dom 2026-08-26) ────────────────

describe('checkLicenseStatus — ackumulator, +20 straff / -18 lättnad', () => {
  it('en konsekvent dålig klubb följer EXAKT samma kadens som det gamla systemet: 20→40→60→80', () => {
    let game = makeGame({ finances: 80000, startFinances: 100000 })  // netResult -20 000, poäng 0→20
    let result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(20)
    expect(result.newLicenseStatus).toBe('clear')
    expect(result.action).toBeNull()

    game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 20, licenseStatus: 'clear' })
    result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(40)
    expect(result.newLicenseStatus).toBe('first_warning')
    expect(result.action?.type).toBe('first_warning')

    game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 40, licenseStatus: 'first_warning' })
    result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(60)
    expect(result.newLicenseStatus).toBe('point_deduction')
    expect(result.action?.type).toBe('point_deduction')

    game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 60, licenseStatus: 'point_deduction' })
    result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(80)
    expect(result.newLicenseStatus).toBe('license_denied')
    expect(result.action?.type).toBe('license_denied')
  })

  it('en positiv säsong ger LÄTTNAD (-18), inte amnesti — poängen sjunker men nollställs inte', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 60, licenseStatus: 'point_deduction' })
    const result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(42)  // 60-18, INTE 0
  })

  it('golvet är 0 — lättnad kan inte göra poängen negativ', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 10, licenseStatus: 'clear' })
    const result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(0)
  })

  it('taket är 100 — straff kan inte skjuta över', () => {
    const game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 95, licenseStatus: 'license_denied' })
    const result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(100)
  })

  it('en klubb som växlar plus/minus glider sakta MOT tröskeln, inte i cirkel (asymmetrin 20/18)', () => {
    // F,V,F,V,F,V — netto +2/cykel, sakta uppåt precis som Jacobs resonemang
    let score = 0
    const sequence = [80000, 200000, 80000, 200000, 80000, 200000]  // F,V,F,V,F,V (start 100000)
    let prevFinances = 100000
    for (const finances of sequence) {
      const game = makeGame({ finances, startFinances: prevFinances, licenseRiskScore: score })
      score = checkLicenseStatus(game, 1).newLicenseRiskScore
      prevFinances = finances
    }
    expect(score).toBeGreaterThan(0)  // har inte gått i cirkel tillbaka till 0
  })

  it('ingen zonövergång — action är null även om poängen rör sig (t.ex. 45→27, kvar i first_warning-liknande läge blir clear, ingen dubbelräkning)', () => {
    // 45 (first_warning) minus 18 lättnad = 27 (clear) — det ÄR en zonövergång (till clear), så action ska finnas
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 45, licenseStatus: 'first_warning' })
    const result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(27)
    expect(result.newLicenseStatus).toBe('clear')
    expect(result.action?.type).toBe('cleared')
  })

  it('point_deduction→first_warning ger lättnadsbesked utan att kalla klubben friad', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 65, licenseStatus: 'point_deduction' })
    const result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(47)
    expect(result.newLicenseStatus).toBe('first_warning')
    expect(result.action?.type).toBe('first_warning')
    expect(result.action?.message).toBe('Det går åt rätt håll. Nämnden lättar på poängavdraget, men bevakningen fortsätter. Ni är inte ur det än.')
  })

  it('license_denied→point_deduction ger rätt lättnadsbesked men behåller zonvarningen', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 80, licenseStatus: 'license_denied' })
    const result = checkLicenseStatus(game, 1)
    expect(result.newLicenseRiskScore).toBe(62)
    expect(result.newLicenseStatus).toBe('point_deduction')
    expect(result.action?.type).toBe('point_deduction')
    expect(result.action?.message).toBe('Ni har vänt det värsta. Licensnämnden häver hotet om nedflyttning — men poängavdraget står kvar tills ekonomin är i balans.')
  })

  it('action texts are non-empty strings', () => {
    const game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 20, licenseStatus: 'clear' })
    const { action } = checkLicenseStatus(game, 42)
    expect(action?.message.length).toBeGreaterThan(5)
    expect(action?.inboxTitle.length).toBeGreaterThan(5)
  })

  it('different seeds produce different texts (pick rotation), determinism per seed', () => {
    const game1 = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 20, licenseStatus: 'clear' })
    const r1 = checkLicenseStatus(game1, 0)
    const r1b = checkLicenseStatus(game1, 0)
    expect(r1.action?.message).toBe(r1b.action?.message)
  })
})

// ── buildLicenseInboxItem ─────────────────────────────────────────────────────

describe('buildLicenseInboxItem — bär LÅST zon-text, ingen siffra (Jacobs dom 2026-08-26)', () => {
  it('builds correct inbox item', () => {
    const game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 20, licenseStatus: 'clear' })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    const item = buildLicenseInboxItem(action!, '2026-04-01', 1, newLicenseStatus)
    expect(item.id).toBe('inbox_license_status_1')
    expect(item.title).toBe(action!.inboxTitle)
    expect(item.body).toBe(action!.message)
    expect(item.isRead).toBe(false)
  })

  it('bär licenseZoneLabel — den låsta texten, inte ett tal', () => {
    const game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 20, licenseStatus: 'clear' })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    expect(action?.type).toBe('first_warning')
    const item = buildLicenseInboxItem(action!, '2026-04-01', 1, newLicenseStatus)
    expect(item.licenseZoneLabel).toBe(LICENSE_ZONE_TEXT.first_warning)
    expect(item.licenseZoneLabel).toBe('Ekonomin är ansträngd.')
  })

  it('bär INTE licenseZoneLabel på cleared', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 45, licenseStatus: 'first_warning' })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    expect(action?.type).toBe('cleared')
    const item = buildLicenseInboxItem(action!, '2026-04-01', 1, newLicenseStatus)
    expect(item.licenseZoneLabel).toBeUndefined()
  })

  it('bär den kvarvarande riskzonen på ett lättnadsbesked', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseRiskScore: 80, licenseStatus: 'license_denied' })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    const item = buildLicenseInboxItem(action!, '2026-04-01', 1, newLicenseStatus)
    expect(action?.type).toBe('point_deduction')
    expect(item.licenseZoneLabel).toBe(LICENSE_ZONE_TEXT.point_deduction)
  })

  it('inga siffror läcker in i den låsta texten', () => {
    for (const text of Object.values(LICENSE_ZONE_TEXT)) {
      expect(text).not.toMatch(/\d/)
    }
  })
})

// sluttest-avskedsvarning-generisk (TEXT LÅST 2026-09-03, Opus): varningstexten
// var helt generisk, nämnde ingen konkret spelarhandling. Sex avslutande
// meningar tillagda ordagrant (tre per zon), en per body-variant — testar att
// samtliga tre varianter i BÅDA zonerna bär sin konkreta mening.
describe('sluttest-avskedsvarning-generisk — konkret handling i varje bodyvariant', () => {
  const FIRST_WARNING_ENDINGS = [
    'Planen nämnden vill se är inte komplicerad: lönerna ner eller intäkterna upp, före nästa bokslut.',
    'Det som räknas är bokslutet — en lönelista kassan bär, eller sponsorer och publik som bär lönelistan.',
    'Det enda nämnden lyssnar på är ett plus i bokslutet.',
  ]
  const POINT_DEDUCTION_ENDINGS = [
    'Ett plus i årets bokslut lyfter avdraget. Ett minus till drar in licensen.',
    'Ett minus till, och det är inte en spelare som får gå. Det är licensen.',
    'Vänd bokslutet i år. Annars är nästa brev det sista.',
  ]

  it('first_warning: varje seed (0,1,2) ger en body som slutar med sin låsta mening', () => {
    for (let seed = 0; seed < 3; seed++) {
      const game = makeGame({ finances: 80000, startFinances: 100000, licenseRiskScore: 20, licenseStatus: 'clear' })
      const { action } = checkLicenseStatus(game, seed)
      expect(action?.type).toBe('first_warning')
      expect(FIRST_WARNING_ENDINGS.some(ending => action!.message.endsWith(ending))).toBe(true)
    }
  })

  it('point_deduction: varje seed (0,1,2) ger en body som slutar med sin låsta mening', () => {
    for (let seed = 0; seed < 3; seed++) {
      const game = makeGame({ finances: 60000, startFinances: 100000, licenseRiskScore: 40, licenseStatus: 'first_warning' })
      const { action } = checkLicenseStatus(game, seed)
      expect(action?.type).toBe('point_deduction')
      expect(POINT_DEDUCTION_ENDINGS.some(ending => action!.message.endsWith(ending))).toBe(true)
    }
  })
})
