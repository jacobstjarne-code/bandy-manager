/** Svensk genitiv: namn som redan slutar på s, x eller z får inget extra s. */
export function swedishGenitive(value: string): string {
  const trimmed = value.trimEnd()
  return /[sxz]$/i.test(trimmed) ? value : `${value}s`
}
