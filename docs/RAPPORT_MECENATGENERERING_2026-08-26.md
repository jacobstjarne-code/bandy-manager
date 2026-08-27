# Rapport: hur mecenat- och patrongenereringen fungerar idag — innan mecenat-/patron-rundan

2026-08-26. Beställd av Jacob innan #4–#6 (sveptrapportens mecenat-/patron-trösklar) byggs — "Rapportera hur mecenatgenereringen fungerar i dag innan du bygger." Ingen kod ändrad i denna rapport, ren läsning.

## Mecenat (`applyMecenatSpawn`, `eventProcessor.ts:450-492`)

Körs bara league-omgång 6-18, första passet (inte vid re-simulering), och är låst 2 säsonger efter ett mecenat-avhopp (`mecenatWithdrawnSeason`).

**Taket på samtidiga mecenater** (#4 i sveptrapporten) är en diskret trappa:
```
maxMecenater = cs>=85 ? 3 : cs>=70 ? 2 : 1
```

**Om ett NYTT försök alls görs** (#5 i sveptrapporten) kräver ALLA på samma rad:
```
cs >= 65 && rep >= 55 && activeMecenater.length < maxMecenater
  && !alreadySpawnedThisSeason && localRand() < 0.15
```
`localRand() < 0.15` är en FLAT 15%-chans per kvalificerande omgång (rond 6-18) — **skalar inte alls med cs idag**. En klubb på cs=65 och en klubb på cs=100 har identisk 15%/omgångs-chans att en mecenat dyker upp; skillnaden är bara TAKET på hur många som får plats samtidigt. Under cs=65: chansen är exakt 0%, varje omgång, alltid — en hård golv-vägg, inte en låg sannolikhet.

`generateMecenat()` (kallas när alla villkor slår in) genererar sedan mecenatens FLAVOR (namn, bransch, happiness-startvärde) via `localRand()` — inga fler cs-beroende grindar där.

## Patron (`roundProcessor.ts:1352-1372`, `patronEvents.ts:248`)

Villkor för att ens FÖRSÖKA (varje omgång, ingen egen sannolikhet inblandad — se nedan):
```
newClubEra !== 'survival' && !game.patron?.isActive
  && (game.communityStanding ?? 50) >= PATRON_EMERGE_CS (60)
  && patronCooldownOk (2 säsonger efter avhopp)
  && !alreadyQueued (en gång per säsong, dedupat på patron_emerge_{season})
```
`newClubEra` kommer från `calculateClubEra()` (`clubEraService.ts`) — en HELT EGEN diskret trappa (survival → fotfäste → establishment [cs≥50] → legacy [cs≥70]), så patronen har egentligen TVÅ hopsnärjda cs-grindar: erans egna (indirekt, ≥50 för establishment) och den direkta `PATRON_EMERGE_CS=60`.

**Viktig skillnad mot mecenat: `generatePatronEmergenceEvent()` har INGEN egen sannolikhetsrullning.** Funktionen anropas och returnerar OMEDELBART ett färdigt event så fort den kallas — `rand()`-anropen INUTI den väljer bara FLAVOR (vilken patronprofil, influence-stat, bidragsbelopp), aldrig OM eventet alls skapas. Det betyder: patronen är **striktare binär än mecenaten** — under cs=60 (eller fel era) är chansen exakt 0%, för alltid; över cs=60 (med rätt era och ingen aktiv patron) är chansen 100% nästa kvalificerande omgång, deterministiskt, ingen tärning alls.

## Vad detta betyder för fixen (bygg INTE ännu, detta är bara kartan)

Jacobs dom: taket (maxMecenater, ett heltal — 1/2/3 samtidiga platser) förblir diskret, men SANNOLIKHETEN att en mecenat/patron alls dyker upp ska skala kontinuerligt med cs istf en golv-vägg. Konkret, baserat på koden ovan:

- **Mecenat:** `cs>=65`-golvet (#5) ersätts av en cs-skalad sannolikhet (t.ex. `csLinearRamp(cs, 0, 100, floor%, 0.15)` — 0.15 blir TAKET på samma ställe det redan är idag, inte ett nytt tal). `maxMecenater`-trappan (#4, cs≥70/≥85) är taket-på-ett-heltal Jacob explicit sa ska förbli diskret — INTE del av denna fix.
- **Patron:** `PATRON_EMERGE_CS=60`-golvet (#6) ersätts av en cs-skalad sannolikhet på SAMMA sätt — men patronen har idag INGEN sannolikhetsrullning alls att skala, en måste LÄGGAS TILL (`localRand() < csScaledProb`) innan `generatePatronEmergenceEvent()` anropas, inte bara en tröskel bytas ut. Störst enskild kodändring av de tre.
- **clubEraService (#9-#10, flyttade till denna runda av Jacob 2026-08-26):** `establishment` (cs≥50) och `legacy` (cs≥70) är diskreta upplåsningar av unika veckobeslut — ANNAN sorts fråga (låser INNEHÅLL, inte en sannolikhet för en enskild händelse). Patronens `newClubEra !== 'survival'`-villkor läser samma erafunktion, så ett beslut om erans trösklar påverkar BÅDA (patron-tillgängligheten ärver eraens diskreta gränser oavsett vad som händer med `PATRON_EMERGE_CS` separat).

**Öppna designfrågor för Jacob innan bygge:**
1. Mecenat-taket vid cs<65 idag är 1 (inte 0) — ska en låg-cs-klubb kunna ha 1 mecenat men bara med låg sannolikhet, eller ska taket vid mycket låg cs vara 0 (ingen mecenat alls möjlig)?
2. Patronens saknade sannolikhetsrullning: vilket golv/tak (t.ex. 2%→20%/omgång, eller något annat) — ingen befintlig magnitud att utgå från här, till skillnad från mecenatens redan etablerade 15%-tak.
3. Ska establishment/legacy-erans cs-trösklar (50/70) förbli exakt där de är (bara dokumenteras som medvetna, ett D-fact) eller också mjukas till en sannolikhet att "nästa säsong" räknas som uppnådd era?
