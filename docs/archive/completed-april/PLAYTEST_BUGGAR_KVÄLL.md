# PLAYTEST-RAPPORT — 14 april 2026 (kväll)

Speltestad av Jacob. Alla punkter är bekräftade buggar eller designproblem.

`npm run build && npm test` efter VARJE fix.

---

## KRITISKT (blockerar spelupplevelsen)

### PT-1 — Halvvägsöversikt saknar fortsätt-knapp
**Vad:** När man når "halvvägs"-eventet finns ingen knapp för att gå vidare. Blockerar all progression.
**Fix:** Lägg till fortsätt-knapp i halvvägs-overlayen.

### PT-2 — Scouting fungerar inte
**Vad:** Kan inte scouta spelare alls.
**Verifiera:** ScoutingView + scoutingService. Är knappen disabled? Saknas data?

### PT-3 — Värvning fungerar inte
**Vad:** Kan inte värva spelare.
**Verifiera:** TransfersScreen + transferService. Flikar? Spelarlista tom?

---

## HÖG PRIO (felaktigt beteende)

### PT-4 — Juniorer försvinner vid säsongsslut
**Vad:** Alla juniorer byts ut mot nya 15-17-åringar vid säsongsslut. Spelare man följt ett helt år försvinner.
**Ska:** Juniorer stannar i akademin tills de är 20. Nya fylls på, men befintliga behålls. Spelaren ska kunna välja vilka som plockas upp till A-laget.
**Fil:** Troligen `preSeasonService.ts` eller `academyService.ts` — logiken som genererar ny akademi varje säsong måste ändras till att *komplettera* istället för att *ersätta*.

### PT-5 — Serietabellen fortsätter under slutspel
**Vad:** Slutspelsmatcher räknas in i serietabellen som blir skev.
**Ska:** Tabellen låses efter sista grundserieomgången. Under slutspel visas ett slutspelsträd istället.
**Fil:** standingsService + DashboardScreen. Filtrera bort matcher med `phase !== 'regular'` från tabellberäkningen.

### PT-6 — Annandagsbandy på fel datum
**Vad:** Ligger på 30 december. Ska ALLTID vara 26 december.
**Ska:** Matchday för Annandagsbandy = 26 dec, oavsett dag. Bör heta "Annandagsbandy" eller "Annandagen" (inte "Annandagsrundan").
**Fil:** `scheduleGenerator.ts` eller liknande.

### PT-7 — Finalen ska vara tredje helgen i mars
**Vad:** Finalens datum stämmer inte.
**Ska:** SM-finalen spelas alltid tredje helgen i mars.
**Fil:** `playoffService.ts` eller `scheduleGenerator.ts`.

---

## MEDIUM (balans / design)

### PT-8 — Presskonferens/kommun visar effekter
**Vad:** När man väljer svar på presskonferens eller kommun-event står det "morale +3", "reputation −2" etc.
**Ska:** Effekterna ska INTE visas. Spelaren ska märka konsekvenserna själv genom att se moralen/ryktet ändras. Att visa siffrorna gör valet trivialt — man väljer bara den med bäst siffror.
**Fix:** Ta bort synliga effekt-etiketter från alla val-knappar i EventOverlay, presskonferens-scen, kommun-event.

### PT-9 — Truppsammansättning obalanserad
**Vad:** Starttrupperna har 5 backar, 5 ytterhalvor, 5 mittfältare, 2 målvakter, 5 forwards = 22 spelare.
**Ska:** Matcha standarduppställningen: 1 MV, 3 B, 2 YH, 3 MF, 2 A = 11. Rimlig trupp: 2 MV, 4 B, 3 YH, 4 MF, 3 FW = 16-18 spelare totalt. Proportionerna måste justeras.
**Fil:** `clubTemplates.ts` eller `playerGenerator.ts`.

### PT-10 — Positionsförkortningar fel
**Vad:** I akademin (och troligen andra ställen) visas "GOA", "DEF", "HAL", "MID", "FOR".
**Ska:** MV, B, YH, MF, A (enligt befintlig `positionShort()` i formatters.ts).
**Fil:** Troligen akademivyn använder egna förkortningar istället för `positionShort()`. Sök efter "GOA", "DEF", "HAL" i kodbasen och byt till `positionShort()`.

### PT-11 — Ta bort all hall-referens
**Vad:** Text som "Vi tappar spelare till hallklubbarna" finns. Men inga halllag existerar i serien.
**Ska:** All hall-relaterad text och mekanik tas bort. Bandy i spelet spelas utomhus, punkt. Inga hall-lag, inga hall-referenser.
**Fil:** Sök efter "hall" i hela kodbasen (commentary, events, text).

### PT-12 — Lönebudget = 0 från start
**Vad:** Lönebudgeten är 0 kr, men lönerna är ~58 000/mån. Spelaren ser "58 000 kr ÖVER budget" utan att ha gjort något.
**Ska:** Startbudgeten för löner ska minst motsvara nuvarande lönekostnader (eller ligga ~10% över för att ge lite marginial). Budgeten sätts vid spelets start baserat på klubbens ekonomi.
**Fil:** `clubTemplates.ts` eller `economyService.ts`.

### PT-13 — Lönereduktion för lätt
**Vad:** Kan kapa ~20 000/mån genom att erbjuda alla "lägsta accepterade". Inga konsekvenser.
**Ska:** Spelare som får lägsta lön borde tappa moral, vara missnöjda, eller vara svårare att förnya kontrakt med. "Lägsta accepterade" borde inte vara gratis — det borde kosta goodwill.
**Fil:** `contractService.ts`, `moralService.ts`.

### PT-14 — Patronen skänker för mycket vid vinster
**Vad:** När man börjar vinna skänker patronen väldigt stora summor. Tar bort ekonomisk press.
**Ska:** Patronens generositet ska vara mer måttfull. Kanske max X kr per säsong, eller avtagande givande.
**Fil:** `patronService.ts` eller `eventResolver.ts`.

### PT-15 — Vila-träning ger orimlig moralboost
**Vad:** Genom att välja "vila" som träningstaktik går moralen upp orimligt mycket. Man blir ostoppbar.
**Ska:** Vila ska ge *liten* moralboost men ingen träningseffekt. Träning ska ge positiv effekt på spelarutveckling men *kostnad* i trötthet. Balans: det ska finnas en tradeoff.
**Fil:** `trainingService.ts`, `moraleService.ts`.

---

## PRIORITETSORDNING

1. PT-1 (halvvägs-knapp — blockerar spelet)
2. PT-2 + PT-3 (scouting/värvning — kärnfunktionalitet)
3. PT-4 (juniorer — progression)
4. PT-5 (tabell under slutspel — synligt fel)
5. PT-6 + PT-7 (datumfixar — Annandagsbandy + final)
6. PT-8 (synliga effekter — designproblem)
7. PT-9 (truppsammansättning)
8. PT-10 (förkortningar)
9. PT-11 (hall-text bort)
10. PT-12 + PT-13 (lönebudget + lönereduktion)
11. PT-14 (patron-balans)
12. PT-15 (vila-träning)
