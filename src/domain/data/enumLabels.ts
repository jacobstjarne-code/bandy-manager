import type { SupporterRole } from '../entities/Community'
import {
  TacticMentality,
  TacticTempo,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
} from '../enums'

/**
 * HIGH 8 / språkläckor (audit 2026-08-29): taktik-enum renderades rått på
 * engelska i UI ("Press low" m.fl.).
 *
 * POSITIONER BOR INTE HÄR. Den etablerade enda källan för positionsetiketter
 * är domain/format.ts (positionShort/positionLong/positionDefinite, kanon
 * MV/B/YH/MF/A). En kopia här skapade tre strata igen — borttagen 2026-08-30.
 * Den här filen är taktik.
 *
 * Samma disciplin som eventTypeLabels.ts: `Record<Enum, string>` gör
 * kompilatorn till täckningsgrind — en ny enum-medlem utan etikett failar
 * `npx tsc`. SVENSK TEXT AV OPUS — Code skriver aldrig egen prosa här (CLAUDE.md).
 */

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
/**
 * Klackens roller. Språkläckan "leader" (audit 2026-08-29): OrtenTab renderade
 * `SupporterRole` rått med textTransform: capitalize → "Leader" / "Youth" /
 * "Family". "Veteran" råkade se svensk ut, vilket är varför bara `leader`
 * rapporterades — alla fyra läckte.
 *
 * ⚠️ TOMMA — OPUS LEVERERAR. Code skriver aldrig svensk speltext (CLAUDE.md).
 * Det finns ingen godkänd svensk klack-rolluppsättning i kodbasen att kopiera:
 * TRAIT_META i playerTraits.ts har 'Ledare'/'Veteran', men det är SPELAR-traits,
 * en annan domän — klackens register är Birgers, inte truppens.
 * Tills de fylls renderar OrtenTab ingen rolletikett alls (tomt > engelskt).
 */
export const SUPPORTER_ROLE_LABELS: Record<SupporterRole, string> = {
  leader: 'Klackledaren',
  veteran: 'Trotjänaren',
  youth: 'Ungdomen',
  family: 'Familjefaren',
}

export const TACTIC_CATEGORY_LABELS = {
  mentality: 'Mentalitet',
  tempo: 'Tempo',
  press: 'Tryck',
  passingRisk: 'Passningsrisk',
  width: 'Bredd',
  attackingFocus: 'Anfallsfokus',
} as const
