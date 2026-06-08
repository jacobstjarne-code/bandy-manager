/**
 * Display-mappning säsong → bandyår. DISPLAY-ONLY.
 *
 * Kanon (DESIGN-DECISIONS, 2026-06-08): absoluta säsongsreferenser — vilken
 * säsong i tiden det är — visas som bandyår, t.ex. "2032/33". SM-final/mästare
 * benämns med året finalen spelas (mars = andra året i spannet), t.ex. 2033.
 * Varaktigheter och antal (säsonger-i-klubben, "8:e säsongen") förblir
 * ordningstal — de räknar, de pekar inte ut en tidpunkt.
 *
 * OBS — fälla: scheduleGenerator använder säsongsnumret DIREKT som kalenderår
 * (Date.UTC(season, …)) enbart för att räkna ut veckodag/dag/månad. Det året
 * (= säsongsnumret) får ALDRIG visas. Läs aldrig getRoundDate(...).getFullYear()
 * för visning — använd helpers här. Display-året och datum-mattans år är skilda
 * med flit; mattan bryr sig inte om vilket år den räknar i.
 *
 * SEASON_BASE_YEAR är vald så att säsong 1 = 2026/27 (25/26 är färdigspelad —
 * spelet ska inte starta i det förflutna). Ändra denna enda konstant för att
 * flytta hela världens tidslinje.
 */

export const SEASON_BASE_YEAR = 2025

/** Startår (höst) för en säsong. Säsong 1 → 2026. */
export function seasonStartYear(season: number): number {
  return SEASON_BASE_YEAR + season
}

/** Bandyårs-span, t.ex. "2033/34". */
export function seasonSpanLabel(season: number): string {
  const start = seasonStartYear(season)
  return `${start}/${String(start + 1).slice(-2)}`
}

/** Året SM-finalen spelas (mars, andra året i spannet). Säsong 1 → 2027. */
export function seasonChampionYear(season: number): number {
  return seasonStartYear(season) + 1
}
