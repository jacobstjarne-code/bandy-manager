import { TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../../domain/enums'
import type { Tactic, TacticChangeLogEntry } from '../../domain/entities/Club'
import type { Fixture } from '../../domain/entities/Fixture'

export interface TacticRow {
  label: string
  key: keyof Tactic
  /** value kan vara ett värdeblock (B2, SLUTTEST_KO.md 2026-08-19): matchCore.ts
   *  konsumerar `press` binärt (bara 'high' ger egen viktjustering, :673) — 'low'
   *  och 'medium' är IDENTISKA i simuleringen. Ett block slår ihop dem till EN
   *  synlig knapp, ärligt mot motorn, utan att röra Tactic-typen eller befintliga
   *  saves (en tactic med press:'low' matchar fortfarande blockets knapp). Klick
   *  normaliserar alltid till block[0]. */
  options: { label: string; value: string | string[] }[]
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
    { label: 'Medium', value: [TacticPress.Medium, TacticPress.Low] },
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
    safe: 'Korta, kontrollerade passningar. Minskar risken men kan bli förutsägbart.',
    mixed: 'Varierat passningsspel. Balanserad risk.',
    direct: 'Långbollar och snabba omställningar. Fler tappade bollar och extra svårt i snö och dimma.',
  },
  width: {
    narrow: 'Smalt spel. Bättre centralt försvar, färre hörnor.',
    normal: 'Normal spelbredd. Balanserat.',
    wide: 'Brett spel. Fler hörnor och kantsituationer.',
  },
  cornerStrategy: {
    safe: 'Få skyttar (1–2). Säkert hörnspel med låg risk.',
    standard: 'Tre skyttar. Klassiskt hörnupplägg, balanserat.',
    aggressive: 'Full arsenal + varianter. Alla skyttar framme, hög risk och hög belöning.',
  },
  penaltyKillStyle: {
    passive: 'Håller sig på egen planhalva vid utvisning. Säkert men passivt.',
    active: 'Balanserat utvisningsspel med lätt press.',
    aggressive: 'Pressar även med man mindre. Hög risk, hög belöning.',
  },
  attackingFocus: {
    central: 'Anfall centralt. Bättre möjligheter nära mål.',
    wings: 'Anfall via kanterna. Mer hörnor, mer kross.',
    mixed: 'Varierar angreppssätt beroende på situationen.',
  },
}

/**
 * O15 (Taktikens två lägen) — gruppindelningen delas nu av TacticBoardCard.tsx
 * (tidigare en lokalt duplicerad TACTIC_GROUPS-array, byte-för-byte identisk med
 * TacticStep.tsx:s egen lokala `groups`). TacticStep.tsx är oförändrad i denna
 * leverans (målskärmen är TaktikScreen/TacticBoardCard) men kan migrera hit senare
 * utan att semantiken ändras.
 */
export const TACTIC_GROUPS = [
  { label: 'Spelplan', keys: ['mentality', 'tempo', 'press'] as const },
  { label: 'Bollspel', keys: ['passingRisk', 'width', 'attackingFocus'] as const },
  { label: 'Fasta situationer', keys: ['cornerStrategy', 'penaltyKillStyle'] as const },
]

function optionLabel(key: keyof Tactic, value: string): string {
  const row = tacticRows.find(r => r.key === key)
  const opt = row?.options.find(o => Array.isArray(o.value) ? o.value.includes(value) : o.value === value)
  return opt?.label ?? value
}

/** Diff mellan två fullständiga Tactic-objekt, i tacticRows kanoniska ordning (de 8
 *  dimensionerna — `formation`/`lineupSlots` räknas aldrig som en "ändring"). */
export function diffTactics(from: Tactic, to: Tactic): { key: keyof Tactic; value: string }[] {
  const diffs: { key: keyof Tactic; value: string }[] = []
  for (const row of tacticRows) {
    const key = row.key
    if (from[key] !== to[key]) diffs.push({ key, value: to[key] as string })
  }
  return diffs
}

/**
 * O15 — delta-raden i standardläget: "vad som skiljer mot förra matchen". LÅST TEXT
 * (Jacob/Design, 2026-08-18/19), kopierad ordagrant — ändra inte formuleringarna.
 *
 * KRITISKT VILLKOR (Jacobs egna ord): jämför mot förra SPELADE matchen, oavsett
 * tävlingstyp (liga/cup/slutspel) — inte förra ligamatchen specifikt. `lastFixture`
 * ska därför komma från useLastCompletedFixture()/game.lastCompletedFixtureId, som
 * redan sätts av roundProcessor/matchActions för varje spelad matchdag oavsett
 * isCup/slutspel — ingen egen ligafiltrering här.
 *
 * Baslinjen för diffen är INTE föregående updateTactic-anrop, utan tactic-snapshotet
 * sparat på den matchens TeamSelection (Fixture.homeLineup/awayLineup.tactic) — den
 * tactic som faktiskt spelades senast, inte något mellanläge under redigering.
 *
 * @cites lastFixture.homeLineup/awayLineup.tactic
 */
export function getTacticDeltaLine(
  currentTactic: Tactic,
  lastFixture: Fixture | null | undefined,
  managedClubId: string,
  currentSeason: number,
  lastOpponentName: string | undefined,
): string | undefined {
  if (!lastFixture) return undefined // första matchen någonsin — ingen rad
  if (lastFixture.season !== currentSeason) {
    return 'Ny säsong. Planen står som du lämnade den.'
  }
  const isHome = lastFixture.homeClubId === managedClubId
  const lastTactic = (isHome ? lastFixture.homeLineup : lastFixture.awayLineup)?.tactic
  if (!lastTactic) return undefined // saknat snapshot — hellre ingen rad än en fel rad
  const opp = lastOpponentName ?? 'motståndaren'
  const diffs = diffTactics(lastTactic, currentTactic)
  if (diffs.length === 0) return `Samma plan som mot ${opp}.`
  const labels = diffs.map(d => tacticRows.find(r => r.key === d.key)!.label)
  if (diffs.length === 1) {
    return `Sedan ${opp}: ${labels[0]} → ${optionLabel(diffs[0].key, diffs[0].value)}.`
  }
  if (diffs.length === 2) {
    return `Sedan ${opp}: ${labels[0]} och ${labels[1]} ändrade.`
  }
  if (diffs.length === 3) {
    return `Sedan ${opp}: ${labels[0]}, ${labels[1]} och ${labels[2]} ändrade.`
  }
  return `Sedan ${opp} har du gjort om planen.`
}

/**
 * O15 — avancerat lägets "Vad du ändrat i år"-rader. En rad per matchday med
 * loggade ändringar (nyast överst), plus en avslutande "utgångsläge satt"-rad
 * (LÅST ordval, Design) om ingen riktig post redan finns på omgång 1.
 */
export function getTacticChangeHistoryLines(changeLog: TacticChangeLogEntry[] | undefined): string[] {
  const sorted = [...(changeLog ?? [])].sort((a, b) => b.matchday - a.matchday)
  const lines = sorted.map(entry => {
    const parts = entry.changes.map(c => `${tacticRows.find(r => r.key === c.key)?.label ?? c.key} → ${optionLabel(c.key, c.value)}`)
    return `Omg ${entry.matchday} · ${parts.join(' · ')}`
  })
  if (!sorted.some(e => e.matchday === 1)) {
    lines.push('Omg 1 · utgångsläge satt')
  }
  return lines
}
