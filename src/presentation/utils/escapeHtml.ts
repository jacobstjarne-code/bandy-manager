/**
 * Säkerhetsgenomgång 2026-09-25: namn och andra värden ur spelstaten kan
 * komma från en importerad sparfil och är därmed användarstyrda. Allt sådant
 * som sätts in i en sträng som renderas med dangerouslySetInnerHTML går
 * genom den här funktionen. Den författade texten runt omkring (<em> osv.)
 * lämnas orörd.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
