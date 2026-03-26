import { TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../../domain/enums'
import type { Tactic } from '../../domain/entities/Club'

export interface TacticRow {
  label: string
  key: keyof Tactic
  options: { label: string; value: string }[]
}

export const tacticRows: TacticRow[] = [
  { label: 'Mentalitet', key: 'mentality', options: [
    { label: 'Defensiv', value: TacticMentality.Defensive },
    { label: 'Balanserad', value: TacticMentality.Balanced },
    { label: 'Offensiv', value: TacticMentality.Offensive },
  ]},
  { label: 'Tempo', key: 'tempo', options: [
    { label: 'Lågt', value: TacticTempo.Low },
    { label: 'Normalt', value: TacticTempo.Normal },
    { label: 'Högt', value: TacticTempo.High },
  ]},
  { label: 'Press', key: 'press', options: [
    { label: 'Låg', value: TacticPress.Low },
    { label: 'Medium', value: TacticPress.Medium },
    { label: 'Hög', value: TacticPress.High },
  ]},
  { label: 'Passning', key: 'passingRisk', options: [
    { label: 'Säker', value: TacticPassingRisk.Safe },
    { label: 'Blandat', value: TacticPassingRisk.Mixed },
    { label: 'Direkt', value: TacticPassingRisk.Direct },
  ]},
  { label: 'Bredd', key: 'width', options: [
    { label: 'Smal', value: TacticWidth.Narrow },
    { label: 'Normal', value: TacticWidth.Normal },
    { label: 'Bred', value: TacticWidth.Wide },
  ]},
  { label: 'Anfallsfokus', key: 'attackingFocus', options: [
    { label: 'Centralt', value: TacticAttackingFocus.Central },
    { label: 'Kanter', value: TacticAttackingFocus.Wings },
    { label: 'Blandat', value: TacticAttackingFocus.Mixed },
  ]},
  { label: 'Hörnstrategi', key: 'cornerStrategy', options: [
    { label: 'Säker', value: CornerStrategy.Safe },
    { label: 'Standard', value: CornerStrategy.Standard },
    { label: 'Aggressiv', value: CornerStrategy.Aggressive },
  ]},
  { label: 'Utvisningsspel', key: 'penaltyKillStyle', options: [
    { label: 'Passivt', value: PenaltyKillStyle.Passive },
    { label: 'Aktivt', value: PenaltyKillStyle.Active },
    { label: 'Aggressivt', value: PenaltyKillStyle.Aggressive },
  ]},
]

export const tacticExplanations: Record<string, Record<string, string>> = {
  mentality: {
    defensive: 'Fokus på försvar. Minskar attackchanserna, stärker defensiven.',
    balanced: 'Balanserad spelplan. Ingen tydlig vikt åt något håll.',
    offensive: 'Fokus på anfall. Fler chanser men sårbarare bak.',
  },
  tempo: {
    low: 'Lugnt spel. Spelarna tröttas ut 15% långsammare.',
    normal: 'Normalt matchspel.',
    high: 'Högt tryck. Fler sekvenser men +20% fatigue och skaderisk.',
  },
  press: {
    low: 'Låg press. Drar sig tillbaka och väntar på bollen.',
    medium: 'Normal press med lätt disciplinrisk.',
    high: 'Intensiv press. Fler bollvinster men mer kort och fatigue.',
  },
  passingRisk: {
    safe: 'Korta säkra passningar. Rekommenderas i dåligt väder.',
    mixed: 'Varierat passningsspel. Balanserad risk.',
    direct: 'Långa direkta bollar. Fler chanser, men fler tappar.',
  },
  width: {
    narrow: 'Smalt spel. Bättre centralt försvar, färre hörnor.',
    normal: 'Normal spelbredd. Balanserat.',
    wide: 'Brett spel. Fler hörnor och kantsituationer.',
  },
  cornerStrategy: {
    safe: 'Kort hörna, säkra passningar. Lägre målrisk.',
    standard: 'Varierade hörnor. Balanserat upplägg.',
    aggressive: 'Alla framåt på hörnan! Hög målchans men sårbar i omställning.',
  },
  penaltyKillStyle: {
    passive: 'Håller sig i egen zon vid utvisning. Säkert men passivt.',
    active: 'Balanserat utvisningsspel med lätt press.',
    aggressive: 'Pressar även med man mindre. Hög risk, hög belöning.',
  },
  attackingFocus: {
    central: 'Anfall centralt. Bättre möjligheter nära mål.',
    wings: 'Anfall via kanterna. Mer hörnor, mer kross.',
    mixed: 'Varierar angreppssätt beroende på situationen.',
  },
}
