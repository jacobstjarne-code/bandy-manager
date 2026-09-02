// DOM_BOARDRELATION_BAGE_2026-09-02.md, steg 3 — den TALADE eskaleringen.
// Callback-principen (samma som BURNOUT_MARK_RELAPSE, managerKaraktarText.ts):
// texten VET att det hänt förr, "andra året"/"tredje året", inte bara nuläget.
//
// getBoardEscalationLevel() (boardService.ts) avgör NÄR (level: 'second' |
// 'thirdPlus'), denna pool bär bara TEXTEN. Opus skriver mot den byggda
// strukturen — se domens startförslag:
//   second:    "Andra året i rad under vad de hoppats. Styrelsen säger det
//               inte rakt ut, men mötena är kortare nu."
//   thirdPlus: "Tredje året topp-fyra, aldrig guld. De har slutat säga det
//               högt. Du hör det ändå."
//
// ÄNNU INTE WIRAD till en yta — placeringsdomen (årsbok/board-möte/kurv-
// bildtext) är uttryckligen Opus/Jacobs nästa steg, inte avgjord här. Se
// tests/grind/opusPlaceholderGate.ts:s ALLOWLIST (reachable:false, samma
// motivering) tills en konsument finns och detta antingen fylls eller flyttas
// dit texten faktiskt behövs.
export const BOARD_ESCALATION_TEXT: Record<'second' | 'thirdPlus', string> = {
  second: '[Opus]',
  thirdPlus: '[Opus]',
}
