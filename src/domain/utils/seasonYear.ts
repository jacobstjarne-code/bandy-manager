/**
 * Display-mappning säsong → bandyår. DISPLAY-ONLY.
 *
 * MODELL (verifierad i createNewGame.ts 2026-06-08): game.currentSeason ÄR
 * startåret för säsongen — ett kalenderår, inte ett ordningstal. Första
 * säsongen är 2026 = bandyåret 2026/27. Nästa säsong är 2027 = 2027/28, osv.
 * scheduleGenerator använder samma tal direkt som kalenderår (Date.UTC(season, …)),
 * så datummattan och display-året är ETT och samma — till skillnad från en
 * tidigare (felaktig) ordningstals-tolkning som adderade ett basår.
 *
 * Kanon (DESIGN-DECISIONS, 2026-06-08): absoluta säsongsreferenser visas som
 * bandyår, t.ex. "2032/33". SM-final/mästare benämns med året finalen spelas
 * (mars = andra året i spannet), t.ex. 2033. Varaktigheter och antal
 * (säsonger-i-klubben, "8:e säsongen") förblir ordningstal — de räknar, de
 * pekar inte ut en tidpunkt, och ska INTE gå genom dessa helpers.
 */

/** Startår (höst) för en säsong. Säsongstalet ÄR startåret. 2026 → 2026. */
export function seasonStartYear(season: number): number {
  return season
}

/** Bandyårs-span, t.ex. "2026/27". */
export function seasonSpanLabel(season: number): string {
  return `${season}/${String(season + 1).slice(-2)}`
}

/** Året SM-finalen spelas (mars, andra året i spannet). 2026 → 2027. */
export function seasonChampionYear(season: number): number {
  return season + 1
}
