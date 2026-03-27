export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}
