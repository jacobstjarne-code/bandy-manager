/**
 * Upptakt-portalen — copy-pooler per sub-state (C-SD2). Opus-text 2026-06-01.
 * Bandysvensk understatement. Mittfält-utan-dramatik visar ingen upptakt.
 *
 * Deterministiska pickers med no-repeat-seed (ingen Date.now/Math.random).
 */

export type UpptaktSubState = 'sakrat' | 'farozon' | 'bottenstrid'

export interface PhaseMarkVariant {
  eyebrow: string
  quote: string
  helper: string
}

export const UPPTAKT_PHASEMARKS: Record<UpptaktSubState, PhaseMarkVariant[]> = {
  sakrat: [
    { eyebrow: '⬩ Slutspelet är klart ⬩', quote: 'Nu är det placeringen som ska avgöras.', helper: 'Platsen är säkrad — nu om var vi hamnar i slutspelet.' },
    { eyebrow: '⬩ Placeringen avgör ⬩', quote: 'Slutspelet väntar. Frågan är var vi möter vem.', helper: 'De sista omgångarna avgör hur högt vi slutar.' },
    { eyebrow: '⬩ Inräknade i slutspelet ⬩', quote: 'Det är klart att vi spelar. Inte var.', helper: 'Hemmaplan i kvarten avgörs av placeringen.' },
    { eyebrow: '⬩ Placering att jaga ⬩', quote: 'Slutspelet är säkrat. Nästa fråga är hur högt.', helper: 'En högre placering ger lättare motstånd i kvarten.' },
    { eyebrow: '⬩ Slutspelet garanterat ⬩', quote: 'Sista biten är till för att klättra.', helper: 'Toppen är inte avgjord än.' },
    { eyebrow: '⬩ Säkrade — men inte färdiga ⬩', quote: 'Vi har en plats. Inte den vi vill ha.', helper: 'Var vi hamnar hänger på de här sista.' },
  ],
  farozon: [
    { eyebrow: '⬩ Slutstriden närmar sig ⬩', quote: 'Sista omgångarna. Här avgörs allt.', helper: 'Slutspelsplatsen är inom räckhåll — men inte säkrad.' },
    { eyebrow: '⬩ Marginalen krymper ⬩', quote: 'Varje match räknas nu.', helper: 'Marginalen tål inte slarv härifrån in.' },
    { eyebrow: '⬩ På strecket ⬩', quote: 'Slutspelet är inom räckhåll. Än.', helper: 'Slarvar vi inte härifrån har vi chansen.' },
    { eyebrow: '⬩ Sista matcherna ⬩', quote: 'Vi vet vad som krävs.', helper: 'Vi behöver poäng — och lite hjälp skadar inte.' },
    { eyebrow: '⬩ Det börjar närma sig ⬩', quote: 'Lugna det här först. Sen spelar vi slutspel.', helper: 'En förlust och vi får börja räkna scenarier.' },
    { eyebrow: '⬩ Slutet närmar sig ⬩', quote: 'Slutspelet eller inte avgörs nu.', helper: 'Övriga lag spelar också — våra resultat räcker inte alltid.' },
  ],
  bottenstrid: [
    { eyebrow: '⬩ Annat att spela för ⬩', quote: 'Slutspelet är utom räckhåll. Men det finns annat.', helper: 'Det som är kvar handlar om att hålla oss ifrån kvalet.' },
    { eyebrow: '⬩ Säsongens sista akt ⬩', quote: 'Inte slutspelet. Men inte heller över.', helper: 'Bottenkampen avgörs nu.' },
    // M53 (textaudit 2026-07-04): helper sa "Två lag åker direkt" (ingen kval)
    // — motsäger både quoten på SAMMA rad ("slippa kvalet") och alla andra
    // bottenstrid-rader i filen, som konsekvent refererar kvalet. Rättad
    // till samma etablerade struktur (regelboken: kvalspel mellan seriernas
    // sista/första plats, ingen automatisk nedflyttning).
    { eyebrow: '⬩ Strecket åt fel håll ⬩', quote: 'Vi spelar för att slippa kvalet.', helper: 'Två lag möter kvalet. Vi ligger i farozonen.' },
    { eyebrow: '⬩ Slutspelet är borta ⬩', quote: 'Men ärligheten i de sista är allt.', helper: 'Vi måste hålla nivån — för truppen, för bygden, för nästa år.' },
    { eyebrow: '⬩ Lugnare men inte mindre viktigt ⬩', quote: 'Vi spelar för säsongen som kommer, inte den som var.', helper: 'Ett starkt avslut sätter tonen för sommarens fönster.' },
    { eyebrow: '⬩ Ingen lyx — bara plikt ⬩', quote: 'Sista matcherna. Slipp kvalet och visa nivå.', helper: 'Inget att vinna, mycket att förlora.' },
  ],
}

export const UPPTAKT_COUNTDOWN: Record<UpptaktSubState, string[]> = {
  sakrat: [
    '{N} omgångar kvar — hur högt vi slutar.',
    '{N} till spel — placeringen avgörs.',
    '{N} kvar — slutspelsplaceringen klar efter sista omgången.',
    '{N} omgångar att klättra på.',
    '{N} kvar — toppen inte avgjord än.',
  ],
  farozon: [
    '{N} omgångar kvar — till slutspelet eller hemfärd.',
    '{N} till spel som avgör säsongen.',
    '{N} matcher kvar. Marginalen tål inte slarv.',
    '{N} omgångar att hålla isär det här.',
    '{N} kvar. Poängen måste in — helst alla.',
  ],
  bottenstrid: [
    '{N} omgångar kvar — för att hålla oss ifrån kvalet.',
    '{N} kvar. Annat att spela för än slutspel.',
    '{N} matcher till. Inte slutspelet — något annat.',
    '{N} sista matcherna. Visa nivå.',
    '{N} kvar. Ett starkt avslut sätter tonen för sommaren.',
  ],
}

export const MUSTWIN_CRIT_TAGS: string[] = [
  'Måstematch', 'Fyrapoängsmatch', 'Avgörande', 'Slutspelsstrid',
  'Strecket avgörs', 'Plats på spel',
]

import { seededPickNoRepeat } from '../utils/random'

export function pickUpptaktPhaseMark(state: UpptaktSubState, seed: number, seen: Set<number>): PhaseMarkVariant {
  const { item, index } = seededPickNoRepeat(UPPTAKT_PHASEMARKS[state], seed, seen)
  seen.add(index)
  return item
}

export function pickCountdownText(state: UpptaktSubState, remainingRounds: number, seed: number, seen: Set<number>): string {
  const { item, index } = seededPickNoRepeat(UPPTAKT_COUNTDOWN[state], seed, seen)
  seen.add(index)
  return item.replace('{N}', String(remainingRounds))
}
