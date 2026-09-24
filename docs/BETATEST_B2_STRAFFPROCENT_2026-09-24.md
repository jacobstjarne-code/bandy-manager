# B2 — Straffprocenten måste vara sann — mätning

2026-09-24, Code. Körorder: `docs/CODE_KORORDER_BETATEST_ERIK_2026-09-24.md` §B2.

## Sammanfattning

**Ingen UI visar en straffprocent.** Grep-bekräftat i hela `src/presentation`
(inga träffar för `%` i `PenaltyInteraction.tsx` — komponentens egen
kommentar säger uttryckligen "Visa inga frikopplade procentsatser" — och
inga träffar för straff-relaterade procenttal någon annanstans i
spelarvänd UI). UI och motor är alltså identiska i det avseendet att UI
inte hävdar NÅGOT tal — det finns ingen sifferdivergens mellan skärm och
motor att jämna ut.

Sanningskällan blir i stället `docs/data/SCORELINE_REFERENCE.md` §1.3
(Bandygrytan-referensdata), som ger TVÅ separata, dokumenterade mål:

- **penaltyGoalPct** (straffmål / alla mål): **5.4 %**
- **Konvertering** (straffmål / tilldelade straffar): **70,0 %**
  ("648 straffmål totalt (5.4% av mål). Estimerat 926 straffar (÷ 0.70
  konvertering).")

Båda uppmätta mot motorn, med samma matchkonstruktion som det redan
verifierade `scripts/calibrate.ts` (samma spelarfabrik, samma
CLUB_CAS-spridning, samma `simulateMatch`-anrop):

| Mått | Uppmätt | Mål | Avvikelse |
|---|---|---|---|
| penaltyGoalPct | **7,09 %** (N=3000 matcher) | 5,4 % | +31 % relativt |
| Konvertering | **54,5 %** (samma körning) | 70,0 % | −22 % relativt |

Se `scripts/measure-penalty-goalpct.ts` (aggregatet, korrekt källa) och
`scripts/measure-penalty-conversion.ts` (isolerad `resolvePenalty`,
segmenterad på skytt-/målvaktsnivå — se nedan).

## En verklig mätfälla på vägen (dokumenterad så den inte upprepas)

Mitt första försök läste `fixture.report.penaltiesHome/Away` som
"straffmål". Det är fel — `matchEngine.ts:194` bygger de fälten ur
`allEvents.filter(e => e.type === MatchEventType.Penalty)`, dvs
**tilldelade/skjutna straffar, inte gjorda straffmål**. Det är korrekt
använt i UI:t (`GranskaOversikt.tsx`s "Straffar"-rad står bredvid
"Skott"/"Hörnor" — alla tre är händelseräknare, inte målräknare, precis
som "Hörnor" inte är hörnMÅL). Den enda korrekta källan för
straff-GOALS är `MatchEvent.isPenaltyGoal` på `Goal`-events — den
persisteras inte i `MatchReport` (inget fält för det), så ett mått på
penaltyGoalPct måste läsas ur `fixture.events` direkt vid
simuleringstillfället, inte ur en sparad match i efterhand. Det är
varför `scripts/measure-penalty-goalpct.ts` kör fristående
matcher (samma mönster som `calibrate.ts`) i stället för att gå via
`roundProcessor`/en sparfil.

## Segmenterat på skytt-/målvaktsnivå (`resolvePenalty` isolerad)

`scripts/measure-penalty-conversion.ts`, N=20 000/cell:

```
Skytt \ MV (samma nivå, mentalitet=offensive)
  skytt=låg (40) vs mv=låg (40): 56.8% mål
  skytt=mid (60) vs mv=mid (60): 56.2% mål
  skytt=hög (80) vs mv=hög (80): 56.8% mål

Skill-gap (skytt fast 60, MV varierar)
  skytt=60 vs mv=låg (40): 57.8% mål
  skytt=60 vs mv=mid (60): 56.3% mål
  skytt=60 vs mv=hög (80): 54.1% mål
```

Skillnadsformeln (`(shooterSkill - keeperSkill) / 100 * 0.15`) fungerar
korrekt och i rätt riktning (bättre målvakt → färre mål, en 40-poängs
skillnad ger ~3,7 procentenheter) — det är inte "fel spelare" eller en
trasig formel. Problemet är BASNIVÅN: alla tre lika-nivå-cellerna
klumpar sig runt 56–57 %, oavsett absolut skicklighet, eftersom
skill-termen bara reagerar på GAPET mellan skytt och målvakt, inte på
någotderas absoluta nivå. Basvärdena i `resolvePenalty` (0,25 vid
samma riktning som målvakten gissar, 0,75 vid olika, 0,10/0,85 för
mitten, höjdmodifikationen) ger tillsammans med AI:ns riktningsval
(`matchCore.ts:1023-1024`, oberoende slumpat, ingen skicklighetskoppling
till VILKEN riktning som väljs) en förväntad konvertering runt 55–58 %
— inte de dokumenterade 70 %.

## Bedömning: formatering / fel spelare / UI≠motor / felkalibrerad motor?

- **Formatering:** irrelevant — inget tal visas.
- **Fel spelare:** nej — `shooterSkill`/`keeperSkill` läses från rätt
  parter i båda vägarna (interaktiv och AI-auto-resolve delar samma
  `PenaltyInteractionData`-uppbyggnad, `matchCore.ts:1008-1015` resp.
  `1025-1032`).
- **Annan formel i UI än i motorn:** nej — `PenaltyInteraction.tsx`
  visar inget eget tal alls; `resolvePenalty` är den ENDA
  resolutionsformeln, delad rakt av mellan interaktivt och
  AI-auto-resolve. Ingen divergens att jämna ut.
- **Felkalibrerad motor:** ja, på två separata mått samtidigt.
  Konverteringen ligger ~22 % under det dokumenterade målet.
  penaltyGoalPct ligger ~31 % över sitt mål. De drar delvis åt olika
  håll (lägre konvertering borde dra penaltyGoalPct NEDÅT, inte uppåt)
  men nettar inte ut — själva TRIGGER-frekvensen
  ("Base 0.19 calibrated for ~5.4% penaltyGoalPct", `matchCore.ts:1337`)
  stämmer alltså inte längre mot nuvarande mätning, oavsett
  konverteringsfrågan.

## Varför jag inte kalibrerar om siffrorna själv

Körordern är uttrycklig: *"Om de redan är identiska: rapportera
fördelningen innan någon kalibrering görs; ändra inte procentsatsen på
känsla."* UI och motor är identiska (inget UI-tal existerar att jämföra
mot) — det här är alltså rapporteringsgrenen, inte fix-grenen.

Utöver ordern: de två talen (trigger-bas 0,19 och
konverteringens bas-goalChance 0,25/0,75/0,85) är kopplade — att bara
höja konverteringen mot 70 % utan att sänka trigger-frekvensen i takt
skulle knuffa penaltyGoalPct ännu högre över sitt redan överskridna
5,4 %-mål. En riktig fix kräver att båda justeras TILLSAMMANS och
mäts om, vilket är en kalibreringsomgång, inte en punktfix — och
kalibrering av matchmotorns grundtal är beslut jag inte tar utan din
dom, i linje med hur `per_schema_a_light`/`lu_neverRotate`-gränsfallen
hanterades tidigare i spakbalans-arbetet.

## Rekommendation

En framtida kalibreringssession bör justera `resolvePenalty`s
bas-goalChance uppåt (mot ~70 % konvertering givet jämn skicklighet)
och SAMTIDIGT sänka straff-trigger-basen i `matchCore.ts` (för att
penaltyGoalPct ska landa på 5,4 %, inte glida högre när konverteringen
höjs) — mät om båda i samma svep, inte i separata pass. Skripten i
`scripts/measure-penalty-goalpct.ts` och
`scripts/measure-penalty-conversion.ts` är byggda för att köras om
direkt efter en sådan ändring.
