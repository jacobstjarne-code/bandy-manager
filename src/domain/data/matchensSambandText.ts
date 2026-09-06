/**
 * SPEC_B12_GRANSKA_MATCHENS_SAMBAND_2026-09-04 §4 — TEXT LÅST, kopierad
 * ordagrant. Code skriver aldrig egen svensk prosa (CLAUDE.md) — alla
 * strängar nedan är Opus text, bara interpolerade av kod.
 *
 * Katalograd A rättad mot DOM_FORMATIONER_V2_2026-09-04.md §"Ändras INTE":
 * "B12-specens katalog A ('Hög press') läser den nya etiketten [formation_523]"
 * + FORMATIONER_V2_TEXT_2026-09-04.md ("B12-katalogen, rad A (ersätter 'Hög
 * press')") — "5-2-3" ersätter "Hög press" i alla tre varianter. Samma dag,
 * senare dom — specens ursprungstext för rad A är stale, denna är kanon.
 */

export function sambandTextA(n: number, m: number, k: number): string {
  if (m > 0 && k > 0) return `5-2-3 gav ${n} omställningsmål — men kostade ${m} utvisningar, och ${k} av deras mål kom i ert undertal.`
  if (n > 0) return `5-2-3 gav ${n} omställningsmål. Bollvinsterna kom högt upp.`
  return `5-2-3 utan utdelning: ${m} utvisningar, ${k} insläppta i undertal, inga omställningsmål.`
}

export function sambandTextB(n: number, m: number, k: number, h: number): string {
  if (k > 0) return `Högt tempo gav ${n} skott mot deras ${m} — och ${k} insläppta efter 70:e. Tempot tog betalt i slutet.`
  if (n > m || h >= 8) return `Högt tempo: ${n} skott, ${h} hörnor. Ni ägde bollen där det gjorde skillnad.`
  return `Högt tempo utan skott att visa: ${k} insläppta efter 70:e.`
}

export function sambandTextC(n: number, m: number, k: number): string {
  if (n > 0 && k > 0) return `Aggressiva hörnor: ${n} av ${m} hörnor blev mål. Priset var ${k} utvisningar.`
  if (n > 0) return `Aggressiva hörnor: ${n} av ${m} blev mål. Där satt den.`
  return `${m} hörnor, inget mål. Aggressiviteten gav bara utvisningarna.`
}

export function sambandTextD(n: number, m: number): string {
  if (n > 0 && m > 0) return `Brett spel gav ${n} hörnor — och öppnade er: ${m} insläppta i öppet spel.`
  if (n > 0) return `Brett spel drog isär dem: ${n} hörnor.`
  return `Brett spel öppnade er mer än dem: ${m} insläppta i öppet spel, ${n} hörnor att visa.`
}

export function sambandTextE(weather: 'snö' | 'dimma' | 'töväder' | null, n: number, m: number): string {
  const weatherPhrase = weather === 'snö' ? 'snön' : weather === 'dimma' ? 'dimman' : 'tövädret'
  if (weather && n > 0) return `Direkt spel i ${weatherPhrase} gav ${n} skott ändå — men bollkontrollen kostade; det syns inte i skotten, det syns i tempot ni tappade.`
  if (weather) return `Direkta passningar i ${weatherPhrase} — motorn tar extra på bollkontrollen då. Ni tappade fler bollar än ni behövde.`
  return `Direkt spel gav ${n} skott mot deras ${m}.`
}

export function sambandTextF(goals: number, conceded: number): string {
  if (goals >= 3 && conceded >= 3) return `Offensiv mentalitet: ${goals} mål, ${conceded} insläppta. Ni köpte målen med försvaret.`
  if (goals >= 3) return `Offensiv mentalitet betalade sig: ${goals} mål, ${conceded} insläppta.`
  return `Offensiv mentalitet utan mål: ${goals} gjorda, ${conceded} insläppta. Öppet åt fel håll.`
}

export function sambandTextG(overNumberGoals: number, underNumberConceded: number): string {
  const parts: string[] = []
  if (overNumberGoals > 0) parts.push(`${overNumberGoals} av era mål kom i numerärt överläge`)
  if (underNumberConceded > 0) parts.push(`${underNumberConceded} insläppta i undertal`)
  return `${parts.join('; ')}.`
}

const HALFTIME_CHANGE_PHRASE: Record<string, string> = {
  lowered_tempo: 'tog ner tempot',
  increased_pressure: 'höjde pressen',
  push: 'gick på i paus',
  calm: 'lugnade ner det',
  hold: 'höll kursen',
}

export function sambandTextH(detail: string, firstHalfGoals: number, firstHalfConceded: number, secondHalfGoals: number, secondHalfConceded: number): string {
  const phrase = HALFTIME_CHANGE_PHRASE[detail] ?? 'ändrade'
  return `Ni ${phrase} i paus: ${firstHalfGoals}–${firstHalfConceded} före, ${secondHalfGoals}–${secondHalfConceded} efter.`
}

export function sambandTextISecondHalfChase(goals: number, conceded: number): string {
  return `Ni jagade från paus — motorn öppnar upp då: ${goals} mål, ${conceded} insläppta i jakten.`
}

export const SAMBAND_TEXT_I_DERBY = 'Derbyt jämnade ut det — i derbyn drar motorn lagen mot varandra. Skillnaden i klass räknades mindre.'

export function sambandTextIHotHand(n: number, k: number): string {
  return `Målen kom i skur: ${n} inom ${k} minuter.`
}

export function sambandTextIEqualizerMomentum(k: number): string {
  return `Kvitteringen bar: ledningsmålet kom ${k} minuter senare.`
}

export function sambandTextJ(n: number, x: number, y: number): string {
  return `${n} spelare utanför naturlig position — snittbetyg ${x.toFixed(1)} mot ${y.toFixed(1)} för de på rätt plats. Det syntes.`
}

export function sambandTextKWithPotm(potmName: string): string {
  return `Taktiken stack inte ut åt något håll. Det här avgjordes på individer och tur — ${potmName} var skillnaden.`
}
