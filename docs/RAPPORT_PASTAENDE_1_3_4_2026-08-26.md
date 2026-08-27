# Rapport: påståendesvepet #1, #3, #4 — klara

2026-08-26. Första tretalet av 13. 2884/2884 tester gröna, tsc ren.

## #1 — HalftimeModal "förra året"-raden

**Rotorsak:** raden ("Ledningen hade vi i en match förra året på samma plan, och vi tappade den") kunde fyras med 1/3 sannolikhet vid 2+ måls ledning i halvtid — även i en klubbs FÖRSTA NÅGONSIN match, där inget "förra året" finns. Och även när ett förra år finns saknas halvtidsställning i historisk matchdata för att faktiskt belägga att en ledning tappades.

**Åtgärd:** raden ströks ur poolen (2 kvar istf 3). Ingen ny text skriven (Code skriver aldrig ny svensk speltext) — bara borttagning av ett obelagt påstående, per "kan påståendet inte beläggas ska det inte göras".

## #3 — HistoryScreen allTimeRecords

**Utredning, inget fynd.** Spårade hela skrivkedjan: `handleSeasonEnd` har EN retursats, som alltid uppdaterar `allTimeRecords`. Två guard-grenar i `preRoundContextProcessor.ts`, ett enda anropsställe (`roundProcessor.ts`), ingen path som hoppar över uppdateringen. Den relaterade risken (sålda spelares statistik missas i topScorer/topAssister) var redan fixad 2026-08-25 (event-sourcad från matchhändelser, inte trupp-filtrerad). **Ingen kodändring — verifierat att det redan fungerar korrekt.**

## #4 — Årsbokens dom mot styrelsens tålamod (design-fråga, din dom)

Presenterade tre alternativ. Din dom: **behåll separata, mjuka orden** — de mäter olika saker (säsongens facit vs. relationen, och meritbufferten skulle förlora sin poäng om de slogs ihop). Roten var bara att den gamla texten ("Styrelsen är nöjd/besviken") lät som ett omdöme om managern.

**Byggt:** `seasonVerdictText()` (ny, `boardService.ts`) — fem låsta meningar, en per rating (1–5), aldrig ett omdöme om spelaren:
- 5: "Styrelsen hade inte väntat sig det här."
- 4: "Styrelsen fick mer än de bad om."
- 3: "Säsongen blev vad styrelsen räknade med."
- 2: "Styrelsen hade hoppats på mer av vintern."
- 1: "Vintern blev en besvikelse för styrelsen."

`SeasonSummaryScreen.tsx` anropar den nu istf den gamla 3-grenade texten. BACKLOG.md flaggat (TVÅ LÄSARE-tabellen) med din motivering, så ingen slår ihop axlarna av misstag senare.

**Verifierat:** 6 nya tester (en per rating + en "nämner aldrig managern"-grind), 131/131 gröna i filen. Browser-verifierat via dev-scene "styrelsen besviken, sparkad" — visade korrekt "Säsongen blev vad styrelsen räknade med." (De tre andra SeasonSummary-dev-scenerna gick inte att navigera till i den här sessionen — bekräftat en OBEROENDE, förbefintlig DevScenesScreen-navigeringskvirk, inte orsakad av min ändring: samma symptom uppstod på en helt orelaterad scen, "Cup Victory".)

## Nästa tretal

#5, #9, #11.
