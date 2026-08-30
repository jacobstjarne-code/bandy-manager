import {
  PlayerPosition,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
} from '../enums'

/**
 * HIGH 8 / språkläckor (audit 2026-08-29): position- och taktik-enum
 * renderades rått på engelska i UI (`forward`, `goalkeeper`, `Press low`).
 *
 * Samma disciplin som eventTypeLabels.ts: `Record<Enum, string>` gör
 * kompilatorn till täckningsgrind — en ny enum-medlem utan etikett failar
 * `npx tsc`. Uppslagningen faller aldrig tillbaka på den råa strängen.
 *
 * Positionstermerna är Jacobs (bandyterminologi, 2026-08-29): central
 * mittfältare styr spelet centralt; yttermittfältare (halv) ligger längs
 * kanterna; forward heter forward i bandy. SVENSK TEXT AV OPUS — Code skriver
 * aldrig egen prosa här (CLAUDE.md).
 *
 * Roller (leader/veteran) och stat-förkortningen CA ligger i andra källor och
 * läggs till när de mappats.
 */

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'Målvakt',
  [PlayerPosition.Defender]: 'Back',
  [PlayerPosition.Half]: 'Yttermittfältare',
  [PlayerPosition.Midfielder]: 'Central mittfältare',
  [PlayerPosition.Forward]: 'Forward',
}

/** Kort form för trånga ytor (laguppställning, spelarkort). */
export const POSITION_LABELS_SHORT: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'MV',
  [PlayerPosition.Defender]: 'Back',
  [PlayerPosition.Half]: 'Halv',
  [PlayerPosition.Midfielder]: 'Mittfält',
  [PlayerPosition.Forward]: 'Forward',
}

export const TACTIC_MENTALITY_LABELS: Record<TacticMentality, string> = {
  [TacticMentality.Defensive]: 'Defensiv',
  [TacticMentality.Balanced]: 'Balanserad',
  [TacticMentality.Offensive]: 'Offensiv',
}

export const TACTIC_TEMPO_LABELS: Record<TacticTempo, string> = {
  [TacticTempo.Low]: 'Lågt',
  [TacticTempo.Normal]: 'Normalt',
  [TacticTempo.High]: 'Högt',
}

export const TACTIC_PRESS_LABELS: Record<TacticPress, string> = {
  [TacticPress.Low]: 'Lågt',
  [TacticPress.Medium]: 'Medel',
  [TacticPress.High]: 'Högt',
}

export const TACTIC_PASSING_RISK_LABELS: Record<TacticPassingRisk, string> = {
  [TacticPassingRisk.Safe]: 'Säker',
  [TacticPassingRisk.Mixed]: 'Blandad',
  [TacticPassingRisk.Direct]: 'Direkt',
}

export const TACTIC_WIDTH_LABELS: Record<TacticWidth, string> = {
  [TacticWidth.Narrow]: 'Smal',
  [TacticWidth.Normal]: 'Normal',
  [TacticWidth.Wide]: 'Bred',
}

export const TACTIC_ATTACKING_FOCUS_LABELS: Record<TacticAttackingFocus, string> = {
  [TacticAttackingFocus.Central]: 'Centralt',
  [TacticAttackingFocus.Wings]: 'Kanter',
  [TacticAttackingFocus.Mixed]: 'Blandat',
}

/**
 * Kategorietiketterna (för "Tryck: Lågt"-formen). Håller isär kategori och
 * värde så inget renderas som "Press low".
 */
export const TACTIC_CATEGORY_LABELS = {
  mentality: 'Mentalitet',
  tempo: 'Tempo',
  press: 'Tryck',
  passingRisk: 'Passningsrisk',
  width: 'Bredd',
  attackingFocus: 'Anfallsfokus',
} as const

/** Position → svensk etikett. Enum är strikt, så uppslag träffar alltid. */
export function positionLabel(position: PlayerPosition, short = false): string {
  return short ? POSITION_LABELS_SHORT[position] : POSITION_LABELS[position]
}
