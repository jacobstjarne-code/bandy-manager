import type { Tactic } from '../entities/Club'
import {
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../enums'

export interface TacticModifiers {
  offenseModifier: number    // 0.75–1.25
  defenseModifier: number    // 0.75–1.25
  tempoModifier: number      // 0.80–1.20 — affects number of sequences per match step
  pressModifier: number      // 0.80–1.20 — affects ball recoveries
  cornerModifier: number     // 0.80–1.20 — affects corner effectiveness
  disciplineModifier: number // 1.00–1.40 — multiplier on foul/card probability
  fatigueRate: number        // 0.80–1.30 — how fast players tire
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function getTacticModifiers(tactic: Tactic): TacticModifiers {
  let offense = 1.0
  let defense = 1.0
  let tempo = 1.0
  let press = 1.0
  let corner = 1.0
  let discipline = 1.0
  let fatigue = 1.0

  // mentality
  switch (tactic.mentality) {
    case TacticMentality.Defensive:
      offense -= 0.10
      defense += 0.10
      break
    case TacticMentality.Balanced:
      break
    case TacticMentality.Offensive:
      offense += 0.10
      defense -= 0.10
      break
  }

  // tempo
  switch (tactic.tempo) {
    case TacticTempo.Low:
      tempo -= 0.15
      fatigue -= 0.15
      break
    case TacticTempo.Normal:
      break
    case TacticTempo.High:
      tempo += 0.15
      fatigue += 0.20
      break
  }

  // press
  switch (tactic.press) {
    case TacticPress.Low:
      press -= 0.15
      fatigue -= 0.05
      break
    case TacticPress.Medium:
      discipline += 0.05
      break
    case TacticPress.High:
      press += 0.15
      discipline += 0.15
      fatigue += 0.10
      break
  }

  // passingRisk
  switch (tactic.passingRisk) {
    case TacticPassingRisk.Safe:
      offense -= 0.05
      defense += 0.05
      break
    case TacticPassingRisk.Mixed:
      break
    case TacticPassingRisk.Direct:
      offense += 0.05
      defense -= 0.05
      discipline += 0.05
      break
  }

  // width
  switch (tactic.width) {
    case TacticWidth.Narrow:
      offense -= 0.03
      defense += 0.05
      corner -= 0.05
      break
    case TacticWidth.Normal:
      break
    case TacticWidth.Wide:
      offense += 0.05
      defense -= 0.05
      corner += 0.08
      break
  }

  // attackingFocus
  switch (tactic.attackingFocus) {
    case TacticAttackingFocus.Central:
      offense += 0.03
      corner -= 0.03
      break
    case TacticAttackingFocus.Mixed:
      break
    case TacticAttackingFocus.Wings:
      corner += 0.05
      offense += 0.02
      break
  }

  // cornerStrategy
  switch (tactic.cornerStrategy) {
    case CornerStrategy.Safe:
      corner -= 0.10
      discipline -= 0.05
      break
    case CornerStrategy.Standard:
      break
    case CornerStrategy.Aggressive:
      corner += 0.15
      discipline += 0.08
      break
  }

  // penaltyKillStyle
  switch (tactic.penaltyKillStyle) {
    case PenaltyKillStyle.Passive:
      defense += 0.03
      discipline -= 0.05
      break
    case PenaltyKillStyle.Active:
      break
    case PenaltyKillStyle.Aggressive:
      press += 0.05
      discipline += 0.10
      fatigue += 0.05
      break
  }

  // Formation modifiers
  switch (tactic.formation) {
    case '2-3-2-3':
      offense += 0.05
      defense -= 0.08
      break
    case '4-3-3':
    case '4-2-4':
      offense -= 0.03
      defense += 0.05
      break
    default:
      break
  }

  return {
    offenseModifier: round3(clamp(offense, 0.75, 1.25)),
    defenseModifier: round3(clamp(defense, 0.75, 1.25)),
    tempoModifier: round3(clamp(tempo, 0.80, 1.20)),
    pressModifier: round3(clamp(press, 0.80, 1.20)),
    cornerModifier: round3(clamp(corner, 0.80, 1.20)),
    disciplineModifier: round3(clamp(discipline, 1.00, 1.40)),
    fatigueRate: round3(clamp(fatigue, 0.80, 1.30)),
  }
}
