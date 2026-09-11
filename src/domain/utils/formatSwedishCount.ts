/** Böjer ett räknat svenskt substantiv utan att gömma själva talet. */
export function formatSwedishCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
