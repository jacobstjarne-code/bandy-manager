import type { Tactic } from '../entities/Club'
import { getHeightMode } from '../entities/Formation'
import { clamp } from '../utils/clamp'
import {
  TacticMentality,
  TacticTempo,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../enums'

/**
 * DOM_FORMATIONER_V2_2026-09-04.md: 5-2-3 högs källbelagda konditionskostnad
 * ("kraftödande ... kortare perioder", SvBF §2.4.2.2) — en per-omgångs-
 * kostnad UTÖVER fatigueRate, för managerade startspelare när matchens
 * formation är `523_hog`. Startvärde konservativt (samma storleksordning som
 * BYGG_EXTRA_FITNESS_COST=4, periodisationService.ts, en annan kronisk
 * kondition-pålaga) — magnituden är EXPLICIT INTE FÄRDIGKALIBRERAD, den
 * väntar kalibreringsrundan C2 (godkänt-kriterium: hög press ska förlora
 * mot balanserat minst lika ofta som den vinner över 22 omgångar, mätt över
 * 10 000 seeds enligt docs/BANDYTAKTIK_KALLASNING_2026-09-04.md).
 */
export const FORMATION_523_EXTRA_FITNESS_COST = 3

export interface TacticModifiers {
  offenseModifier: number    // 0.75–1.25
  defenseModifier: number    // 0.75–1.25
  tempoModifier: number      // 0.80–1.20 — affects number of sequences per match step
  pressModifier: number      // 0.80–1.20 — affects ball recoveries
  cornerModifier: number     // 0.80–1.20 — affects corner effectiveness
  disciplineModifier: number // 1.00–1.40 — multiplier on foul/card probability
  fatigueRate: number        // 0.80–1.30 — how fast players tire
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

  // heightMode (DOM_FORMATIONER_V2_2026-09-04.md) — härlett ur formationen,
  // ersätter det gamla press-fältet. EXAKT samma tal som förr: low motsvarar
  // gamla TacticPress.Low, mid gamla Medium, high gamla High. Inga nya
  // magnituder uppfinns här.
  switch (getHeightMode(tactic.formation)) {
    case 'low':
      press -= 0.15
      fatigue -= 0.05
      break
    case 'mid':
      discipline += 0.05
      break
    case 'high':
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

  // DOM_FORMATIONER_V2_2026-09-04.md: formations-switchen (offense/defense
  // per formationstyp) borttagen — noll källstöd, fotbollsriktning. De fyra
  // 5-3-2-formerna verkar bara genom slot-kartan (positionspassning, kemi)
  // och truppkraven, ingen egen multiplikator.

  return {
    offenseModifier: round3(clamp(offense, 0.75, 1.25)),
    defenseModifier: round3(clamp(defense, 0.75, 1.25)),
    tempoModifier: round3(clamp(tempo, 0.80, 1.20)),
    pressModifier: round3(clamp(press, 0.80, 1.20)),
    cornerModifier: round3(clamp(corner, 0.88, 1.10)),  // Fas 3 Fix 2: smalare ändlock — komprimerar bara ytterlägen (mittprofiler ligger inom 0,95–1,07), så maxprofiler inte skjuter förbi verkligt hörnmål-spann 19,3–23,6 %
    disciplineModifier: round3(clamp(discipline, 1.00, 1.40)),
    fatigueRate: round3(clamp(fatigue, 0.80, 1.30)),
  }
}
