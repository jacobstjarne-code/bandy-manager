import { describe, it, expect } from 'vitest'
import { getTacticModifiers } from '../tacticModifiers'
import type { Tactic } from '../../entities/Club'
import type { FormationType } from '../../entities/Formation'
import {
  TacticMentality,
  TacticTempo,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../enums'

const baseTactic: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '532_tvatoppar',
}

describe('getTacticModifiers', () => {
  it('Offensive mentality gives higher offenseModifier than Defensive', () => {
    const offensive = getTacticModifiers({ ...baseTactic, mentality: TacticMentality.Offensive })
    const defensive = getTacticModifiers({ ...baseTactic, mentality: TacticMentality.Defensive })
    expect(offensive.offenseModifier).toBeGreaterThan(defensive.offenseModifier)
  })

  it('Defensive mentality gives higher defenseModifier than Offensive', () => {
    const offensive = getTacticModifiers({ ...baseTactic, mentality: TacticMentality.Offensive })
    const defensive = getTacticModifiers({ ...baseTactic, mentality: TacticMentality.Defensive })
    expect(defensive.defenseModifier).toBeGreaterThan(offensive.defenseModifier)
  })

  it('High tempo gives higher fatigueRate than Low tempo', () => {
    const high = getTacticModifiers({ ...baseTactic, tempo: TacticTempo.High })
    const low = getTacticModifiers({ ...baseTactic, tempo: TacticTempo.Low })
    expect(high.fatigueRate).toBeGreaterThan(low.fatigueRate)
  })

  it('High tempo gives higher tempoModifier than Low tempo', () => {
    const high = getTacticModifiers({ ...baseTactic, tempo: TacticTempo.High })
    const low = getTacticModifiers({ ...baseTactic, tempo: TacticTempo.Low })
    expect(high.tempoModifier).toBeGreaterThan(low.tempoModifier)
  })

  // DOM_FORMATIONER_V2_2026-09-04.md: press borttaget som eget fält —
  // heightMode härleds nu ur formationen. 523_hog = high, 541_hem = low.
  // "EXAKT dagens tal" (domens eget krav) — regressionstesterna nedan
  // bevisar det, inte bara riktningen.
  it('523_hog (high heightMode) gives higher disciplineModifier than 541_hem (low)', () => {
    const high = getTacticModifiers({ ...baseTactic, formation: '523_hog' })
    const low = getTacticModifiers({ ...baseTactic, formation: '541_hem' })
    expect(high.disciplineModifier).toBeGreaterThan(low.disciplineModifier)
  })

  it('523_hog (high heightMode) gives higher pressModifier than 541_hem (low)', () => {
    const high = getTacticModifiers({ ...baseTactic, formation: '523_hog' })
    const low = getTacticModifiers({ ...baseTactic, formation: '541_hem' })
    expect(high.pressModifier).toBeGreaterThan(low.pressModifier)
  })

  // Regressionstest — DOM 2026-09-04: "EXAKT dagens tal" (low: press -0.15,
  // fatigue -0.05; mid: discipline +0.05; high: press +0.15, discipline
  // +0.15, fatigue +0.10). De fyra 532_*-formationerna delar alla 'mid'.
  it('heightMode ger exakt de gamla press-talen (regression, inga nya magnituder)', () => {
    const low = getTacticModifiers({ ...baseTactic, formation: '541_hem' })
    const mid = getTacticModifiers({ ...baseTactic, formation: '532_tvatoppar' })
    const high = getTacticModifiers({ ...baseTactic, formation: '523_hog' })

    // low: press 1.0-0.15=0.85, fatigue 1.0-0.05=0.95, discipline 1.0 (orört)
    expect(low.pressModifier).toBeCloseTo(0.85, 3)
    expect(low.fatigueRate).toBeCloseTo(0.95, 3)
    expect(low.disciplineModifier).toBeCloseTo(1.0, 3)

    // mid: discipline 1.0+0.05=1.05, press/fatigue orörda (1.0)
    expect(mid.disciplineModifier).toBeCloseTo(1.05, 3)
    expect(mid.pressModifier).toBeCloseTo(1.0, 3)
    expect(mid.fatigueRate).toBeCloseTo(1.0, 3)

    // high: press 1.0+0.15=1.15, discipline 1.0+0.15=1.15, fatigue 1.0+0.10=1.10
    expect(high.pressModifier).toBeCloseTo(1.15, 3)
    expect(high.disciplineModifier).toBeCloseTo(1.15, 3)
    expect(high.fatigueRate).toBeCloseTo(1.10, 3)
  })

  // Alla fyra 5-3-2-varianter delar heightMode:'mid' — identiska modifiers
  // (de verkar bara genom slot-kartan/positionspassningen, aldrig en egen
  // multiplikator, DOM §"Ändras INTE").
  it('de fyra 532_*-formationerna ger identiska modifiers (ingen egen multiplikator)', () => {
    const variants: FormationType[] = ['532_tvatoppar', '532_triangel', '532_ytterben', '532_hogahalvor']
    const results = variants.map(formation => getTacticModifiers({ ...baseTactic, formation }))
    for (const r of results.slice(1)) {
      expect(r).toEqual(results[0])
    }
  })

  // DOM_FORMATIONER_V2_2026-09-04.md §"Tas bort": formations-switchen
  // (2-3-2-3 offense+0.05/defense-0.08, 4-3-3/4-2-4 offense-0.03/defense+0.05)
  // ska vara helt borta — noll skillnad i offense/defense mellan formationer
  // utöver heightMode-effekten (som inte rör offense/defense alls).
  it('formationsswitchens gamla offense/defense-tal är borta — ingen formation ger en egen offense/defense-bonus', () => {
    const variants: FormationType[] = ['532_tvatoppar', '532_triangel', '532_ytterben', '532_hogahalvor', '523_hog', '541_hem']
    const results = variants.map(formation => getTacticModifiers({ ...baseTactic, formation }))
    for (const r of results) {
      expect(r.offenseModifier).toBeCloseTo(1.0, 3)
      expect(r.defenseModifier).toBeCloseTo(1.0, 3)
    }
  })

  it('Aggressive corner strategy gives higher cornerModifier than Safe', () => {
    const aggressive = getTacticModifiers({ ...baseTactic, cornerStrategy: CornerStrategy.Aggressive })
    const safe = getTacticModifiers({ ...baseTactic, cornerStrategy: CornerStrategy.Safe })
    expect(aggressive.cornerModifier).toBeGreaterThan(safe.cornerModifier)
  })

  it('Aggressive penalty kill style increases disciplineModifier vs Active', () => {
    const aggressive = getTacticModifiers({ ...baseTactic, penaltyKillStyle: PenaltyKillStyle.Aggressive })
    const active = getTacticModifiers({ ...baseTactic, penaltyKillStyle: PenaltyKillStyle.Active })
    expect(aggressive.disciplineModifier).toBeGreaterThan(active.disciplineModifier)
  })

  it('Wide width gives higher cornerModifier than Narrow', () => {
    const wide = getTacticModifiers({ ...baseTactic, width: TacticWidth.Wide })
    const narrow = getTacticModifiers({ ...baseTactic, width: TacticWidth.Narrow })
    expect(wide.cornerModifier).toBeGreaterThan(narrow.cornerModifier)
  })

  it('all modifiers stay within their documented ranges across extreme combinations', () => {
    const mentalityOptions = [TacticMentality.Defensive, TacticMentality.Offensive]
    const tempoOptions = [TacticTempo.Low, TacticTempo.High]
    const formationOptions: FormationType[] = ['523_hog', '541_hem']
    const passingOptions = [TacticPassingRisk.Safe, TacticPassingRisk.Direct]
    const widthOptions = [TacticWidth.Narrow, TacticWidth.Wide]
    const focusOptions = [TacticAttackingFocus.Central, TacticAttackingFocus.Wings]
    const cornerOptions = [CornerStrategy.Safe, CornerStrategy.Aggressive]
    const penaltyOptions = [PenaltyKillStyle.Passive, PenaltyKillStyle.Aggressive]

    for (const mentality of mentalityOptions) {
      for (const tempo of tempoOptions) {
        for (const formation of formationOptions) {
          for (const passingRisk of passingOptions) {
            for (const width of widthOptions) {
              for (const attackingFocus of focusOptions) {
                for (const cornerStrategy of cornerOptions) {
                  for (const penaltyKillStyle of penaltyOptions) {
                    const mods = getTacticModifiers({
                      mentality,
                      tempo,
                      formation,
                      passingRisk,
                      width,
                      attackingFocus,
                      cornerStrategy,
                      penaltyKillStyle,
                    })

                    expect(mods.offenseModifier).toBeGreaterThanOrEqual(0.75)
                    expect(mods.offenseModifier).toBeLessThanOrEqual(1.25)

                    expect(mods.defenseModifier).toBeGreaterThanOrEqual(0.75)
                    expect(mods.defenseModifier).toBeLessThanOrEqual(1.25)

                    expect(mods.tempoModifier).toBeGreaterThanOrEqual(0.80)
                    expect(mods.tempoModifier).toBeLessThanOrEqual(1.20)

                    expect(mods.pressModifier).toBeGreaterThanOrEqual(0.80)
                    expect(mods.pressModifier).toBeLessThanOrEqual(1.20)

                    expect(mods.cornerModifier).toBeGreaterThanOrEqual(0.80)
                    expect(mods.cornerModifier).toBeLessThanOrEqual(1.20)

                    expect(mods.disciplineModifier).toBeGreaterThanOrEqual(1.00)
                    expect(mods.disciplineModifier).toBeLessThanOrEqual(1.40)

                    expect(mods.fatigueRate).toBeGreaterThanOrEqual(0.80)
                    expect(mods.fatigueRate).toBeLessThanOrEqual(1.30)
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  it('Balanced/Normal/Mixed/Normal/Mixed/Standard/Active tactic (532_tvatoppar) returns all modifiers close to 1.0', () => {
    const mods = getTacticModifiers(baseTactic)

    // All should be within ±0.05 of 1.0, except disciplineModifier which starts at 1.0
    // heightMode:'mid' (532_tvatoppar) adds +0.05 to discipline, so disciplineModifier will be 1.05
    expect(mods.offenseModifier).toBeCloseTo(1.0, 1)
    expect(mods.defenseModifier).toBeCloseTo(1.0, 1)
    expect(mods.tempoModifier).toBeCloseTo(1.0, 1)
    expect(mods.pressModifier).toBeCloseTo(1.0, 1)
    expect(mods.cornerModifier).toBeCloseTo(1.0, 1)
    expect(mods.disciplineModifier).toBeGreaterThanOrEqual(1.00)
    expect(mods.disciplineModifier).toBeLessThanOrEqual(1.10)
    expect(mods.fatigueRate).toBeCloseTo(1.0, 1)
  })
})
