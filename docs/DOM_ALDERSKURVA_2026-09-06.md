# DOM_ALDERSKURVA — kanonisk åldersmodell för generering

**2026-09-06 · Opus · svar på Codes ålderskurve-fråga (academyActions/generateAttributes)**

## Frågan (Code)

`generateAttributes`/`generateYouthAttributes`-ihopslagningen kräver en kanonisk
ålderskurva. `marketValueService` säger topp 22–26, `playerDevelopmentService` säger
topp 19–22 — "de slås aldrig ihop idag". Code frågade vilken som är kanon.

## Domen

**Fel fråga. Det är inte två motstridiga kurvor att välja mellan — det är TRE olika
axlar som mäter tre olika ting. De ska ALDRIG slås ihop.**

1. **Tillväxttakt** — `playerDevelopmentService.getAgeFactor`: snabbast 19–22
   (1.4 / 1.1), avtar 23–28 (0.6 / 0.3), negativ från 29 (−0.1 → −0.45). Hur fort
   en spelare förbättras.
2. **Förmåga (CA)** — implicit, den ackumulerade summan av tillväxtkurvan: stiger så
   länge tillväxten är positiv (till ~28), toppar ~27–29, faller sedan. Hur bra en
   spelare ÄR.
3. **Marknadsvärde** — `marketValueService.ageCurve`: topp 22–26 (1.0), lägre före
   och efter. Vad en spelare är VÄRD = förmåga + år kvar + andrahandsvärde.

Att topparna ligger olika (19–22 / 27–29 / 22–26) är inte en bugg. Det är korrekt
karriärfysik: man växer snabbast ung, är bäst i slutet av tjugo, är värd mest
däremellan. FM-modeller ser likadana ut. Att tvinga en kurva på en annan bygger in
ett fel — marketValues 22–26 på tillväxten skulle påstå att en 24-åring växer
snabbast (falskt); developments 19–22 på värdet skulle påstå att en 19-åring är
värd mest (falskt).

## Kanon för generering

**Generering av attribut härleds ur UTVECKLINGSKURVAN (`playerDevelopmentService`s
ålderslogik), aldrig ur `marketValueService.ageCurve`.** Skäl: generering svarar på
"vilken förmåga har en spelare vid ålder N" — det är den ackumulerade tillväxten.
Värde är nedströms förmåga och får aldrig definiera den.

- Slå ihop `generateAttributes`/`generateYouthAttributes` (worldGenerator +
  youthIntakeService + `academyActions.ts` lokala tredje dubblett) till EN exporterad
  källa som härleder åldersanpassad CA/attributspridning ur utvecklingskurvans form.
- **Uppfinn INTE en tredje oberoende ungdomskurva** — det var precis det Code
  varnade för ("making the inconsistency worse"). Härled ur den befintliga
  developmentkurvan, inför ingen ny.
- `academyActions.ts` lokala `generateAttributes(position, ca)` **folds in** — samma
  buggklass, defera inte. Lämnas den kvar divergerar promote-youth-vägen igen.

## marketValueService.ageCurve — namngiven korrekt skillnad, INTE avvikelse

`marketValueService.ageCurve` (22–26) ska stå kvar oförändrad. Den är INTE en
avvikelse som ska rättas eller harmoniseras — den är en legitimt annan kurva (värde
≠ förmåga). Dokumenteras som namngiven korrekt skillnad så ingen framtida pass
"försonar" de två och därmed förstör värderingen. Samma klass som frozen-record-
undantaget i R3: en medveten, korrekt olikhet, inte drift.

## CA/attribut-konsistens (invariant Code kan testa)

Den enade `generateAttributes` måste producera attribut vars arketyp-viktade
medelvärde round-trippar till ≈ input-CA (härleda CA ur de genererade attributen ≈
den CA man matade in). Det är den konsistens Code flaggade; skriv som test.

## Separat spår (Code/Jacob, INTE modelldom)

Verktygsluckan Code hittade: kalibreringsdokets "10 000-seed-mätning" finns inte som
körbar tooling — skripten hårdkodar `SEEDS = 20`, och npm-aliaset
`analyze:firing-frequency` saknas i `package.json` (skriptet finns, ej wirat).
Att verifiera att ålderskurve-fixen stänger Heros-gapet kräver mätsteget. Det är
inte en modelldom — Code kan wira aliaset + göra SEEDS konfigurerbar, eller så
accepteras SEEDS=20 med en dokumenterad "under-powered tills 10k-tooling finns"-
brasklapp. Rigor-val för dig/Code, inte kurvan.

## Handoff

- Code: slå ihop till en `generateAttributes`-källa härledd ur utvecklingskurvan
  (inkl. academyActions fold-in). CA/attribut-round-trip som test. Rör inte
  marketValueService.ageCurve — dokumentera den som namngiven korrekt skillnad.
- Separat rad: wira 10k-seed-tooling (eller dokumentera SEEDS=20-caveat) innan
  Heros-gapet kallas verifierat.
- Ingen kurva ska "väljas" eller "slås ihop" — tre axlar, tre betydelser, står kvar.
