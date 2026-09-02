// DOM_BOARDRELATION_BAGE_2026-09-02.md, steg 3 — den TALADE eskaleringen.
// Callback-principen (samma som BURNOUT_MARK_RELAPSE, managerKaraktarText.ts):
// texten VET att det hänt förr, "andra året"/"tredje året", inte bara nuläget.
//
// Wirad i generatePreSeasonMessage (boardService.ts) — Jacobs placeringsdom
// 2026-09-02: styrelsens röst vid förväntanssättningen, inte årsboken. Raden
// fogas till försäsongsmeddelandet när det nyss uträknade
// newConsecutiveExpectationMisses klassas som 'second'/'thirdPlus'.
export const BOARD_ESCALATION_TEXT: Record<'second' | 'thirdPlus', string> = {
  second: 'Andra året i rad under vad de hoppats. Ingen säger det rakt ut, men mötena blir kortare och frågorna rakare.',
  thirdPlus: 'Tredje året nu. De har slutat prata om vad ni ska bli, och börjat prata om vad ni är. Du hör skillnaden.',
}
