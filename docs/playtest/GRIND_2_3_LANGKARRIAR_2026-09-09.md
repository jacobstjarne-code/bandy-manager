# Grind 2/3 — långkarriär, pågående speltest

**Datum:** 2026-09-09  
**Kör:** Codex i riktig lokal browserkarriär, 390 px  
**Version vid start:** `64b5e7a6`  
**Klubb:** Västanfors  
**Manager:** Grindtest 2  
**Status:** Pågående — två av minst åtta säsonger spelade. Opus domar grindarna efter färdig leverans.

## Avbruten kontrollkörning — Forsbacka

En första karriär med Forsbacka slutade med att managern fick sparken efter säsong 2. Den körningen används bara som kontrollbevis, inte som den åtta säsonger långa huvudkarriären.

- Säsong 1: 2:a i serien, 31 poäng (14–3–5, +38), kvartsfinaluttåg 2–3 mot Lesjöfors, cupsemifinal. Kassa cirka 460→539 tkr. Burnout-val: kliv tillbaka. Rune Rydén såld för 100 tkr.
- Säsong 2: 6:a, 21 poäng (10–1–11, −13), kvartsfinaluttåg 0–3 mot Söderfors. Värmestuga startades i omgång 4 med kommunal finansiering och blev färdig i omgång 13. Managern fick därefter sparken.
- Årsboken visade samma `Derby-triumf mot Gagnef` tre gånger. Huvudkarriären nedan reproducerar samma klass av fel med Söderfors, vilket gör att fyndet inte bedöms som save-specifikt.

## Huvudkarriär — säsong 1, 2026/27

### Utfall

- Seriesegrare: 1:a, 34 poäng, 16–2–4, målskillnad +50.
- Cupvinnare efter 8–2 mot Målilla i finalen.
- Kvartsfinaluttåg 1–3 mot Hälleforsnäs. Säsongslandningen löd att vallen tystnade fort och att resten åkte hem i bussen.
- Ekonomi: 430 tkr vid start, 1,1 mkr vid slut, +715 tkr.
- Styrelsen: förstaplatsen överträffade målet.

### Grind 3-observation

- Primär handling: matchförberedelsen var konsekvent huvudväg; eventval låg efter match i Granska och konkurrerade normalt inte med `Redo — spela`.
- Nästa olösta fråga: efter seriesegern var slutspelet tydlig krok; efter kvartsfinaluttåget blev frågan om laget kunde omsätta dominansen i slutspelsresultat nästa år.
- Landning: tydlig. Årsboken höll ihop cupguldet, seriesegern, burnout-valet och ekonomin till ett begripligt år.

### Grind 2-observation

- Anläggningar är medvetet låsta första säsongen. Trädet kunde därför inte startas ännu.
- Burnout-brytpunkten `Det går inte att köra så här längre` visades i både omgång 9 och omgång 10 trots att det irreversibla valet `Kliv tillbaka en period` gjordes första gången. Det är en faktisk upprepad pivotal scen och innebär att Grind 2 inte kan passera i nuvarande version.

## Huvudkarriär — säsong 2, 2027/28

### Utfall

- Grundserie: 5:a, 26 poäng, 12–2–8.
- Cupvinnare efter 10–4 mot Skutskär i finalen.
- Semifinaluttåg 1–3 mot Gagnef efter att kvartsfinalen mot Målilla avgjordes 3–2 på straffar i match 5.
- Ekonomi: cirka 1,1 mkr vid både start och slut, −48 tkr över säsongen.
- Styrelsen: femteplatsen låg under målet att vinna ligan.

### Anläggningsträdet

- `Kiosk & servering` byggdes på fyra omgångar med Anna Johansson som medfinansiär.
- `Akademinivå 2` byggdes därefter på åtta omgångar, också med Anna Johansson som medfinansiär.
- `Träningshall (ungdom)` startades därefter; 14 omgångar återstod vid start. Den ska följas över säsongsskiftet innan rollover-domen kan anses speltestad.
- Det separata community-eventet `Kioskfrågan` (`Starta enkel kiosk`, 3 tkr) dök upp samtidigt som det permanenta kioskbygget pågick. Kodläsning visar två olika state-system: `communityActivities.kiosk` respektive anläggningsnoden `kiosk`. Det behöver en uttrycklig produktbedömning innan det kallas bugg, men är en tydlig kandidat till parallell specialmekanism.

### Grind 3-observation

- Primär handling: portalens huvudsakliga matchväg var tydlig. Vid några lägen låg veckoval och aktiv matchknapp samtidigt, men den visuella riktningen gick fortfarande att följa.
- Nästa olösta fråga: efter cupguldet blev ligamålet och det pågående anläggningsträdet den tydligaste fortsättningskroken.
- Landning: tydlig sportslig och ekonomisk landning. Årsboken skilde säsongen från den första genom femteplats, cupguld, semifinal och byggkedja.

### Reproducerade fel

1. **Upprepad pivotal burnout-scen.** `Du är vid samma gräns igen` visades i omgång 10 och omgång 12 samma säsong efter att `Kliv tillbaka en period` valts i omgång 10. Tillsammans med säsong 1 är detta tre brytpunktskort på fyra omgångar.
2. **Duplicerade årsboksminnen.** `💔 Derby-förlust mot Söderfors` renderades tre gånger: två `O7`-ankrade poster och en oankrad rad.
3. **Dubbletter i besluts-/eventkön.** `Bandygalan 2027`, `Kioskfrågan` och `Föreningslotten` återkom efter att val redan gjorts. Kodläsning visar att `generateEvents()` bygger `alreadyQueued` av `pendingEvents + resolvedEventIds`, men utelämnar `deferredDecisions`. Under KF3-budgeten kan en undanträngd post därför nygenereras innan den första kopian konsumerats. Det är en gemensam sannolik rotorsak som ska verifieras med fokustest före fix.

## Fortsättning

- Spela säsong 3–8 i samma save.
- Bekräfta att `Träningshall (ungdom)` bevarar återstående byggtid över rollover och slutförs.
- Bygg `Akademinivå 3` och resten av trädet.
- Dokumentera ett faktiskt ekonomiskt avvägningsval runt säsong 8.
- Efter full körning lämnas Grind 2/3 till Opus för dom; de arkiveras inte av testaren.
