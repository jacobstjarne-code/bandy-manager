# CODE-UPPDRAG — Kafferummets slumpning + anti-upprepning (2026-05-23)

**Av:** Opus. **Surface:** kategori D (logik). **Bakgrund:** Jacob playtestade och
upplevde att Kafferummet ger samma repliker omg\u00e5ng efter omg\u00e5ng. Opus l\u00e4ste
`getCoffeeRoomScene` i `coffeeRoomService.ts` och hittade tv\u00e5 orsaker. Texterna \u00e4r
redan \u00e5tg\u00e4rdade (Opus ut\u00f6kade GENERIC 19\u219245, FATIGUE 4\u21928 per niv\u00e5). Kvar: tv\u00e5
sm\u00e5 logik-fixar.

## Problem 1 \u2014 n\u00e4stan-periodisk seed

Nuvarande i `getCoffeeRoomScene`:
```ts
const seed = matchday * 11 + game.currentSeason * 31
// ...
let idx = Math.abs(seed * (i + 7)) % pool.length
```
`matchday * 11` v\u00e4xer linj\u00e4rt med 11 per matchday. Mot `% pool.length` (~45) ger
det en f\u00f6ruts\u00e4gbar, n\u00e4stan-periodisk sekvens \u2014 n\u00e4rliggande matchdagar f\u00e5r
n\u00e4rliggande index. Det \u00e4r d\u00e4rf\u00f6r det k\u00e4nns repetitivt \u00e4ven n\u00e4r poolen \u00e4r stor.

**Fix:** hasha seeden ordentligt innan modulo, s\u00e5 sm\u00e5 input-\u00e4ndringar sprider sig
\u00f6ver hela intervallet. En enkel heltals-hash r\u00e4cker:
```ts
function hashSeed(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}
// idx-plockning:
let idx = hashSeed(seed * 1000 + i) % pool.length
```
Samma m\u00f6nster i fatigue-grenen (`seed = matchday * 17 + season * 29`, `% pool.length`).
Anv\u00e4nd `hashSeed` d\u00e4r ocks\u00e5. Beh\u00e5ll determinismen (samma matchday \u2192 samma scen,
viktigt f\u00f6r save-reload) \u2014 hashen \u00e4r ren funktion av matchday/season, s\u00e5 det h\u00e5ller.

## Problem 2 \u2014 anti-upprepningen \u00e4r f\u00f6r svag

Nuvarande villkor:
```ts
(lastIndices.has(idx) && pool.length > count + lastIndices.size)
```
`lastCoffeeSceneIndices` sparar bara F\u00d6RRA matchdagens index. En replik kan
\u00e5terkomma varannan matchday utan att blockeras. Med 45 rader r\u00e4cker det att minnas
fler.

**Fix:** ut\u00f6ka `SaveGame.lastCoffeeSceneIndices` till en rullande historik av de
senaste ~12 visade index (inte bara f\u00f6rra matchdagens). Uteslut alla i historiken
n\u00e4r poolen till\u00e5ter (`pool.length > count + historik.size`). Med 45 rader och
historik 12 \u00e4r det gott om marginal. Uppdatera historiken efter varje scen:
`[...historik, ...pickedIndices].slice(-12)`.

OBS: fatigue-grenen anv\u00e4nder INTE `lastCoffeeSceneIndices` idag (den plockar bara
`hashSeed % pool.length`). Med 8 rader och hashad seed blir den hyfsad, men l\u00e4gg
g\u00e4rna in samma historik-uteslutning d\u00e4r om det \u00e4r billigt.

## Verifiering (tvingande)
- K\u00f6r 22 matchdagar i rad, logga vald `pickedIndices`. Ingen replik ska
  \u00e5terkomma inom 12 matchdagar (s\u00e5vida inte poolen tvingar det).
- Samma save, reload mitt i \u2014 samma matchday ska ge samma scen (determinism h\u00e5ller).
- Fatigue-scen: trigga `fatigueHotStreak >= 2` \u00f6ver 8 matchdagar, verifiera att de
  8 raderna roterar utan omedelbar upprepning.

## Vad som INTE \u00e4ndras
- Texterna (Opus klar).
- Scenstrukturen, count-logiken (1-3), meta/subtitle.
- Determinismen \u2014 fortfarande ren funktion av matchday/season.

— Opus, 2026-05-23

---

## GO 2026-06-22 — verifierad mot HEAD, kör (Code)

Opus läste `src/domain/services/coffeeRoomService.ts` mot HEAD 2026-06-22: `getCoffeeRoomScene` matchar "FÖRE"-koden ovan exakt (B9 rörde inte seed/plockning). GENERIC_EXCHANGES = 45 rader. Inga andra ändringar sedan 05-23. **Ordern är aktuell — bygg de två fixarna nu.** Exakta ankare:

**Fix 1 — hashSeed (båda grenarna i `getCoffeeRoomScene`):**
- Generic-grenen: `let idx = Math.abs(seed * (i + 7)) % pool.length` → `let idx = hashSeed(seed * 1000 + i) % pool.length`.
- Fatigue-grenen (`hotStreak >= 2`, `seed = matchday * 17 + season * 29`): `const idx = Math.abs(seed) % pool.length` → `hashSeed(seed) % pool.length`.
- Lägg `hashSeed` (heltals-hash ovan) som modul-privat funktion högst i filen. Ren funktion av matchday/season → determinism håller (save-reload ger samma scen).

**Fix 2 — rullande-12 anti-upprepning (`getCoffeeRoomScene` generic-grenen):**
- `lastIndices`-uteslutningen läser i dag bara förra matchdagens index. Utöka `SaveGame.lastCoffeeSceneIndices` till rullande historik av senaste ~12 visade index.
- Skrivstället: greppa `lastCoffeeSceneIndices =` (persisteras när scenen visas/konsumeras, ej i `coffeeRoomService` själv) → ändra till `[...historik, ...pickedIndices].slice(-12)`.
- Uteslutningsvillkoret i while-loopen: behåll `pool.length > count + lastIndices.size` (med 45 rader och historik 12 finns marginal). Fatigue-grenen (8 rader) lägger gärna in samma uteslutning om billigt — annars räcker hashen där.

**Utanför scope (rör inte):** `getCoffeeRoomQuote` (separat äldre enkelcitat-väg med egen `pick()`/`lastCoffeeQuoteHash`) — samma nästan-periodiska mönster men ordern gäller scenen. Flagga om du vill ta den i samma stroke; bygg den inte oombedd.

Verifieringskraven i originalordern står (22 matchdagar utan upprepning inom 12; reload-determinism; fatigue-rotation). — Opus, 2026-06-22
