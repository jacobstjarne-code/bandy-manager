# Playtest: liga live/snabb → Granska → tabell

**Datum:** 2026-09-08

**Claim:** `4393d086` (`pt2-liga-advance-otestad`)

**Klubb/save:** Målilla, säsong 2026/27

## Genomspelning

1. **Ligaomgång 1, liveflöde:** Målilla–Lesjöfors spelades i Full-läget med
   pausval och matchbeslut och gick därefter via `TILL GRANSKNING` till Granska.
   Resultat 2–3. Tabellen visade Målilla som 8:a med **S 1, MS −1, P 0**.
2. **Ligaomgång 2, snabbresultat:** Målilla–Gagnef spelades via
   `Snabb · Direkt resultat` och landade direkt i Granska. Resultat 0–6.
   Tabellen uppdaterades till 11:e plats med **S 2, MS −7, P 0**.

Kärnkravet är därmed verifierat i riktig browser för båda vägarna: avslutad
ligamatch når Granska och samma match räknas in exakt en gång i tabellen.

## Fynd och åtgärder under playtestet

### Granskningshuvudet läste nästa match

Cupfinalens Granska visade `Omg 1`; ligaomgång 1:s Granska visade `Omg 2`; och
ligaomgång 2:s Granska visade `Omg 3`. `GameHeader` läste nästa schemalagda
fixture efter att rundprocessorn redan flyttat kalendern framåt, medan resten
av sidan läste `lastCompletedFixtureId`.

Headern läser nu den faktiskt granskade fixturen och går genom den befintliga
tävlingsmedvetna `getRoundLabel`: cupfinalen blir `Cup · final`, ligamatcher
behåller sin spelade omgång och slutspel behåller rond + matchnummer.

### Gagnefs motståndarvinjett visade platshållare

`OpponentVignetteScene` hittade korrekt assetnamn men lät `IllustrationScene`
bygga standardsökvägen `.jpg`. Alla levererade klubbintrobilder ligger som
`.webp`, inklusive `intro-gagnef.webp`. Vinjetten skickar nu samma
`getClubIntroIllustrationSrc` som övriga klubbintroyor använder. Det rättar
hela klubbsviten på denna yta, inte bara Gagnef.

## Automatisk verifiering

- `advanceToNextEvent.test.ts`: 9 gröna tester.
- GameHeader + OpponentVignetteScene: 8 gröna tester.
- Totalt fokuskörning: **3 testfiler, 17 tester, alla gröna**.
- `npm run build`: grön TypeScript-, Vite-, design-, content-contract- och
  facility-consequence-kedja.
