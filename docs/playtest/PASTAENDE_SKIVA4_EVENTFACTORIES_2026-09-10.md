# Påståendegrinden — skiva 4 `eventFactories.ts`

**Datum:** 2026-09-10

**Dom:** `DOM_PASTAENDE_SKIVA4_EVENTFACTORIES_2026-09-10.md`

**Resultat:** GRÖN. STOPP före `eventResolver.ts`.

## Bevisad grid

Samtliga 17 fabriker ryms i det ratificerade kontraktet:

- `bidWarEvent` — state-predicate; väntande utgående bud + sannolikhetsfönster + köskydd.
- `hesitantPlayerEvent` — state-predicate; accepterat bud till klubb med lägre rykte.
- `bidReceivedEvent` — state-predicate; inkommande väntande bud + köskydd.
- `contractRequestEvent` — state-predicate; egen, kontraktsmogen spelare som passerat kontraktsgaten.
- `unhappyPlayerEvent` — state-predicate; moral under 35 och minst två bänkningar i trematchsfönstret.
- `generateDayJobConflictEvent` — state-predicate; deltidsjobb, låg flexibilitet, minst tre starter av fem och sannolikhetsgate.
- `generatePlayerMediaEvent` — state-predicate; låg moral, hög förmåga och färre än tre starter i minst tre matcher.
- `generatePlayerPraiseEvent` — state-predicate; glad lagkamrat och målskytt i just spelad match.
- `generateCaptainSpeechEvent` — state-predicate; tre raka ligaförluster och kapten med moral över 50.
- `generateVarselEvent` — state-predicate; säsongs-/sannolikhetsgate och verklig arbetsgivargrupp.
- `generatePromotionOfferEvent` — state-predicate; anställd deltidsbandyspelare med rätt flexibilitet och moral.
- `generateShiftConflictEvent` — state-predicate; anställd deltidsbandyspelare med låg flexibilitet och träffad sannolikhetsgate.
- `generateCoworkerBondEvent` — state-predicate; två deltidsbandyspelare med samma verkliga arbetsgivare.
- `generateJournalistExclusiveEvent` — state-predicate; relation minst 65, ledig säsongsbudget och sannolikhetsgate.
- `generateMecenatInterventionEvent` — state-predicate; aktiv mecenat med happiness under 40.
- `createEconomicStressEvent` — state-predicate; kassa i stresszonen och minst sex omgångars cooldown.
- `jobbetForsvannEvent` — state-predicate; jobbgarantin pekar på exakt den sponsor eller patron som just lämnat.

**Formfördelning:** 17 state-predicate, 0 ledger, 0 timeless. Inget faktiskt påstående föll utanför de tre tillåtna formerna. Noll ledger är korrekt: de här fabrikerna påstår levande genereringsstate, inte historik.

## Fynd och åtgärder

Ett verkligt sanningsfel hittades i `jobbetForsvannEvent`: kroppen påstår att just den jobbgarantigivande sponsorn lämnat, men det lokala beviset kontrollerade bara att spelaren hade *någon* `jobGuaranteeSponsorId`. Båda produktionsanroparna kände redan den avgående entitetens id. Id:t förs nu in i fabriken och jämförs exakt. Regressionstest låser både matchande id (`true`) och fel id (`false`).

Två anropande transfergater preciserades samtidigt så `evaluatedTrue` motsvarar hela den gate som släpper fram kortet:

- `newBids` kräver nu uttryckligen `incoming` + `pending` + inte redan köad. Ett utgående bud på den vägen ger inget inkommande budkort.
- budkrigets bevis omfattar även det träffade 20-procentsfönstret, utöver `outgoing` + `pending` + köskydd.

Ingen ny speltext skrevs och ingen deklarerad effekt ändrades. Ingen browserkontroll behövdes: ändringen gäller genereringsbevis och köurval utan ändrad UI-rendering.

## Verifiering

- Fokuserad sanning-/fabrikssvit: 10 filer, 59 tester — grönt.
- Slutlig fokussvit efter transferregressionerna: 3 filer, 48 tester — grönt.
- TypeScript (`tsc --noEmit`) — grönt.
- Produktionsbuild — grönt.
- Design guard, design adherence, content contract, facility consequences och O12 choice preview — gröna.
- Full testsuite: 553 filer, 5 023 tester — grönt.

## Stopp

`eventResolver.ts` är nästa skiva men ingår inte i denna dom och har inte rörts. Den kräver en egen namngiven dom innan arbete börjar.
