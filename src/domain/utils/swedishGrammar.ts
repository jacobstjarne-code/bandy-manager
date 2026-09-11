/** Svensk genitiv: namn som redan slutar på s, x eller z får inget extra s. */
export function swedishGenitive(value: string): string {
  const trimmed = value.trimEnd()
  return /[sxz]$/i.test(trimmed) ? trimmed : `${trimmed}s`
}

/**
 * Fyller namntokens och behandlar `{namn}s` före `{namn}`. Utan den ordningen
 * blir exempelvis Söderfors felaktigt "Söderforss" när en enkel replace lämnar
 * mallens avslutande s kvar. Okända tokens lämnas orörda så flera rendersteg
 * kan dela samma mall utan att tappa information.
 */
export function fillSwedishTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template
    .replace(/\{([\p{L}\p{N}_]+)\}s\b/gu, (match, key: string) =>
      values[key] === undefined ? match : swedishGenitive(values[key]))
    .replace(/\{([\p{L}\p{N}_]+)\}/gu, (match, key: string) =>
      values[key] === undefined ? match : values[key])
}
