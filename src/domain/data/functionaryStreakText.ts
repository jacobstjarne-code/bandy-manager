/**
 * Funktionärens svitrepliker — B4 (Spår B, 2026-07-20).
 *
 * Nivå: Karaktärstext (B5·3) — klubbhusets register, inte journalistens
 * (extern press) och inte tränarens (spelaren är tränaren). Förlustsvit
 * oroar kassören; segersvit gör ordföranden stillsamt nöjd — tonen byter
 * tecken, talaren stannar i klubbhuset. Wiras via .txt-karaktar i
 * StreakSecondary.tsx.
 */

export const FUNCTIONARY_LOSING_STREAK_LINES: string[] = [
  'Det är tyst i klubbhuset. Ingen säger något om det, men alla räknar.',
  'Kassören har börjat prata om nästa säsong. Det gör han aldrig så här tidigt.',
  'Folk hälsar fortfarande. De stannar bara inte lika länge.',
  'Ordföranden frågade hur jag mår. Han menade laget.',
  'Kaffet räcker längre nu. Färre stannar kvar och pratar.',
  'Ingen skojar om tabellen längre. Det är illa.',
]

export const FUNCTIONARY_WINNING_STREAK_LINES: string[] = [
  'Ordföranden log i dag. Det gör han inte i onödan.',
  'Det pratas mer i kafferummet nu. Samma folk, längre samtal.',
  'Någon hade satt upp tabellen på väggen. Ingen tog ner den.',
  'Kassören räknar fortfarande, men han ser inte lika trött ut.',
  'Det kommer folk på tisdagsträningarna nu. Det brukar de inte.',
  'Ingen säger något högt. Men det märks på hur de går in genom dörren.',
]

/** Deterministisk radval, samma charCodeAt-seed-mönster som doktorpoolerna. */
export function pickFunctionaryStreakLine(managedClubId: string, matchday: number, type: 'winning_streak' | 'losing_streak'): string {
  const pool = type === 'losing_streak' ? FUNCTIONARY_LOSING_STREAK_LINES : FUNCTIONARY_WINNING_STREAK_LINES
  const idx = Math.abs(managedClubId.charCodeAt(0) + matchday) % pool.length
  return pool[idx]
}
