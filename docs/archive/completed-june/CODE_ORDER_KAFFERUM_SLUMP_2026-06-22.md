# CODE-ORDER — Kafferummets slumpning (hashSeed + rullande-12)

**Av:** Opus · **Datum:** 2026-06-22 · **Till:** Code · **Surface:** kategori D (logik)
**Status:** GO. Verifierad mot HEAD 2026-06-22. Fristående — allt du behöver står här.

Ersätter `CODE_UPPDRAG_KAFFERUM_SLUMP_2026-05-23.md` (arkiverad). Texterna är redan klara
(Opus utökade GENERIC 19→45, FATIGUE 4→8). Kvar: två mekaniska fixar i scen-vägen.

## Bakgrund
Jacob upplevde att Kafferummet ger samma repliker omgång efter omgång trots stor pool.
Två orsaker, båda i `getCoffeeRoomScene` i `src/domain/services/coffeeRoomService.ts`:
en nästan-periodisk seed och en för svag anti-upprepning. Verifierat mot HEAD i dag — koden
nedan matchar trädet exakt (B9 rörde inte seed/plockningen). GENERIC_EXCHANGES = 45 rader.

## Fix 1 — hasha seeden (båda grenarna i `getCoffeeRoomScene`)

Problemet: `seed = matchday * 11 + season * 31` växer linjärt, och `Math.abs(seed * (i+7)) % pool.length`
ger närliggande matchdagar närliggande index → förutsägbar sekvens. Lös med en riktig heltals-hash
före modulo så små input-ändringar sprids över hela intervallet.

Lägg modul-privat högst i filen:
```ts
function hashSeed(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}
```

Generic-grenen — i plock-loopen:
```ts
let idx = Math.abs(seed * (i + 7)) % pool.length      // FÖRE
let idx = hashSeed(seed * 1000 + i) % pool.length     // EFTER
```

Fatigue-grenen (`hotStreak >= 2`, `seed = matchday * 17 + season * 29`):
```ts
const idx = Math.abs(seed) % pool.length              // FÖRE
const idx = hashSeed(seed) % pool.length              // EFTER
```

`hashSeed` är ren funktion av matchday/season → determinismen håller (samma matchday → samma scen,
viktigt för save-reload).

## Fix 2 — rullande-12 anti-upprepning (generic-grenen)

Problemet: `lastCoffeeSceneIndices` sparar bara FÖRRA matchdagens index, så en replik kan återkomma
varannan matchday. Med 45 rader finns marginal att minnas fler.

1. `SaveGame.lastCoffeeSceneIndices` (`src/domain/entities/SaveGame.ts`) — håll som rullande historik
   av de senaste ~12 visade index (inte bara förra matchdagens). Typen (`number[]`) är oförändrad,
   bara semantiken: längd upp till 12.
2. Skrivstället — greppa `rg "lastCoffeeSceneIndices ="` (sannolikt `roundProcessor.ts` eller
   `processors/preRoundContextProcessor.ts`, där scenen byggs per omgång och `pickedIndices`
   persisteras). Ändra skrivningen till rullande fönster:
   ```ts
   lastCoffeeSceneIndices: [...(game.lastCoffeeSceneIndices ?? []), ...scene.pickedIndices].slice(-12)
   ```
3. Uteslutningsvillkoret i while-loopen i `getCoffeeRoomScene` står redan rätt — behåll
   `pool.length > count + lastIndices.size`. Med 45 rader och historik 12 finns gott om marginal.
   Fatigue-grenen (8 rader) använder inte historiken; lägg in samma uteslutning där bara om det är
   billigt — annars räcker hashen.

## Utanför scope — rör inte
`getCoffeeRoomQuote` (separat äldre enkelcitat-väg med egen `pick()`/`lastCoffeeQuoteHash`). Samma
nästan-periodiska mönster finns där, men den här ordern gäller scenen som Jacob upplevde. Flagga om
du vill ta den i samma stroke; bygg den inte oombedd.

## Verifiering (tvingande)
- Kör 22 matchdagar i rad, logga `pickedIndices`. Ingen replik ska återkomma inom 12 matchdagar
  (såvida inte poolen tvingar det).
- Samma save, reload mitt i — samma matchday ska ge samma scen (determinism håller).
- Fatigue: trigga `fatigueHotStreak >= 2` över 8 matchdagar, verifiera att de 8 raderna roterar utan
  omedelbar upprepning.
- Befintliga tester gröna (`coffeeRoomService.test.ts`, `determinism.test.ts`).

## Handoff
Code bygger båda fixarna, committar, kör tsc/lint + tester, rapporterar hash. Ordern arkiveras till
`docs/archive/completed-june/` när byggt.

— Opus, 2026-06-22
