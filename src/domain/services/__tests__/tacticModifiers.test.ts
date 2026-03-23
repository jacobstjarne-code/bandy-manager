import { describe, it, expect } from 'vitest'
import { getTacticModifiers } from '../tacticModifiers'
import type { Tactic } from '../../entities/Club'
import {
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../enums'

const baseTactic: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
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

  it('High press gives higher disciplineModifier than Low press', () => {
    const high = getTacticModifiers({ ...baseTactic, press: TacticPress.High })
    const low = getTacticModifiers({ ...baseTactic, press: TacticPress.Low })
    expect(high.disciplineModifier).toBeGreaterThan(low.disciplineModifier)
  })

  it('High press gives higher pressModifier than Low press', () => {
    const high = getTacticModifiers({ ...baseTactic, press: TacticPress.High })
    const low = getTacticModifiers({ ...baseTactic, press: TacticPress.Low })
    expect(high.pressModifier).toBeGreaterThan(low.pressModifier)
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
    const pressOptions = [TacticPress.Low, TacticPress.High]
    const passingOptions = [TacticPassingRisk.Safe, TacticPassingRisk.Direct]
    const widthOptions = [TacticWidth.Narrow, TacticWidth.Wide]
    const focusOptions = [TacticAttackingFocus.Central, TacticAttackingFocus.Wings]
    const cornerOptions = [CornerStrategy.Safe, CornerStrategy.Aggressive]
    const penaltyOptions = [PenaltyKillStyle.Passive, PenaltyKillStyle.Aggressive]

    for (const mentality of mentalityOptions) {
      for (const tempo of tempoOptions) {
        for (const press of pressOptions) {
          for (const passingRisk of passingOptions) {
            for (const width of widthOptions) {
              for (const attackingFocus of focusOptions) {
                for (const cornerStrategy of cornerOptions) {
                  for (const penaltyKillStyle of penaltyOptions) {
                    const mods = getTacticModifiers({
                      mentality,
                      tempo,
                      press,
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

  it('Balanced/Normal/Medium/Mixed/Normal/Mixed/Standard/Active tactic returns all modifiers close to 1.0', () => {
    const mods = getTacticModifiers(baseTactic)

    // All should be within ±0.05 of 1.0, except disciplineModifier which starts at 1.0
    // Medium press adds +0.05 to discipline, so disciplineModifier will be 1.05
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
