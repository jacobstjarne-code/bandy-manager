# Rapport: seed-fyndets bakåtverkan — mätningar, Skutskär, och en omkörning

2026-08-26. `newGame()` (gameStore.ts) fixad: skickade tidigare aldrig ett seed till `createNewGame()`, så `worldSeed` föll tillbaka till konstanten 42 för VARJE karriär startad via appen sedan K4 (19 augusti). Fixad till ett riktigt slumpat seed per ny, fristående karriär. Två bakåtfrågor besvarade nedan, plus en omkörning.

## 1. Har våra mätningar kört mot samma värld hela tiden?

**Nej — kodläst, inte antaget.** `grep -rln "useGameStore\|gameStore" scripts/` gav NOLL träffar. Varenda analys-/kalibrerings-/stresstest-skript i `scripts/` (h4-alla-tolv-avskedsfrekvens.ts, stress-test.ts, grind1-boardpatience-sim.ts/-v2/-v3, o5-avsked-diagnos, h1-arc-eligibility-sim, m.fl.) anropar `createNewGame()` DIREKT med ett eget, explicit varierande seed — de rör aldrig `gameStore.newGame()`, den enda platsen bugen satt. `h4-alla-tolv-avskedsfrekvens.ts` kör t.ex. `createNewGame({ ..., seed: 90_000 + i })` för `i` 0-19 — 20 genuint olika seeds, varje gång. `stress-test.ts`s `createHeadlessGame(seedIdx)` samma sak, plus roterar klubb via `seed % CLUB_TEMPLATES.length`.

Seedet är dessutom verifierat GENUINT deterministiskt rakt igenom (`createNewGame.ts`, läst rad för rad): `mulberry32(input.seed)` (plus offset per delsystem) driver `generateWorld`, `initCharacterPlayers`, cupfixtures, väder, ungdomslag, `createSeasonSignature`, `generateManagerProfile`, `generateCoachRivalries`, `generateAICoaches` — inget av detta ignorerar seedet.

**Slutsats: variansen vi mätt (avskedsfrekvens, stresstester, alla-tolv-körningar) är över FLERA olika världar, precis som avsett. Bugen satt enbart i den riktiga speluppstarten (`ClubSelectionScreen.tsx` → `newGame()`), inte i mätinfrastrukturen.**

## 2. Förklarar det Skutskärs "alltid nia"?

**Nej — redan diagnostiserat, redan fixat, ett HELT annat och oberoende fel.** `GRIND1_STRESSTEST_RESULTAT_2026-08-23.md`: `seasonEndProcessor.ts` skriver vid säsongsslut över `game.standings` med NÄSTA säsongs TOMMA tabell (`calculateStandings(clubIds, [])`). Vid 0 poäng överallt sorteras den ALFABETISKT. Grind1-skripten (v1/v2) läste `standing.position` EFTER denna överskrivning — alltså varje klubbs alfabetiska rangordning (Heros 4:a, Skutskär 9:a — matchar bokstavsordningen exakt), oavsett vad som faktiskt hänt i den simulerade säsongen.

Verifierat att detta INTE var confounded med seed-42-bugen: `grind1-boardpatience-sim-v2.ts` seedar precis som h4-alla-tolv (`30_000+i`/`40_000+i` per klubb, äkta varierande världar) — bara LÄSNINGEN av slutresultatet var trasig, inte världen som simulerades. En alfabetisk sortering av en tom tabell ger samma "Skutskär=9" oavsett vilket seed som körts, eftersom den aldrig läser något simulerat utfall alls.

**Två separata fel, inte ett som såg ut som två — och det redan identifierade felet (alfabetisk sortering efter överskrivning) är fullt tillräckligt i sig för att förklara symtomet.**

## 3. Omkörning: avskedsfrekvens alla tolv, samma 20 seeds

`h4-alla-tolv-avskedsfrekvens.ts` använder ett HÅRDKODAT seed-intervall (90 000-90 019) — identiskt varje körning, av skriptets egen design (inte av seed-fyndet). Det betyder: skillnaden nedan mellan "sjunde mätningen" (`RAPPORT_SJUNDE_MATNINGEN_KLIPPAN_KVARSTAR_2026-08-26.md`, samma standardkörning) och idag är INTE sampling-brus från olika världar — det är samma 20 världar båda gångerna. Det som skiljer är koden emellan: dagens fyra communityStanding-trösklfixar (diminishingFactor, grannklubbsmilstolpen, politikerbidraget, det omöjliga valet).

| Klubb | Sjunde mätn. | Idag | Δ |
|---|---|---|---|
| Forsbacka | 15% | 15% | 0 |
| Söderfors | 60% | 75% | +15 |
| Västanfors | 10% | 5% | −5 |
| Karlsborg | 60% | 60% | 0 |
| Målilla | 55% | 55% | 0 |
| Gagnef | 35% | 30% | −5 |
| Hälleforsnäs | 45% | 55% | +10 |
| Lesjöfors | 85% | 75% | −10 |
| **Rögle** | **100%** | **100%** | 0 |
| Slottsbron | 90% | 80% | −10 |
| Skutskär | 60% | 60% | 0 |
| **Heros** | **100%** | **100%** | 0 |

Måttliga förskjutningar (±5-15pp) i sex av tolv klubbar, ingen enhetlig riktning — konsekvent med att fyra oberoende, små magnitud-ändringar (inte en enda dominerande faktor) rört sig samtidigt. Rögle och Heros — H4-utredningens kärnfall — oförändrade på exakt 100%, vilket håller den öppna frågan i sjunde mätningen (`RAPPORT_SJUNDE_MATNINGEN_KLIPPAN_KVARSTAR_2026-08-26.md`) vid liv: klippan för DEM specifikt sitter fortfarande någon annanstans än i det som ändrats hittills.

**Detta är alltså INTE en bekräftelse på "vi har kalibrerat mot en enda värld"** — den hypotesen är redan avfärdad av punkt 1 ovan (skriptets 20 seeds var alltid genuint olika världar). Förskjutningarna här är verklig, förväntad signal från dagens kodändringar, inte en artefakt av seed-fyndet.
