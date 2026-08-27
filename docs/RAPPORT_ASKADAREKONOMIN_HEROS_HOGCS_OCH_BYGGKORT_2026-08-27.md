# Rapport: Heros på BASIC-nivå vid hög communityStanding + byggkortets kostnadsredovisning

2026-08-27, svar på Jacobs tre uppdrag efter godkännandet av åskådarekonomin kandidat 2.

## 1. Kandidat 2 wirad i produktion

`economyService.ts` har nu sqrt(publik) + kostnadsrelativt golv (50% av driftskostnaden) för kiosk och VIP-tält, exakt som mätt i `RAPPORT_ASKADAREKONOMIN_V2_MATNING_2026-08-27.md`. `functionaries`/`bandyplay` oförändrade (flata tillägg). `matchAttendance` återinförd i `economyProcessor.ts`s anrop. tsc rent, alla 295 testfiler/2936 test gröna, plus fem nya regressionstester för golv/sqrt-beteendet i `economyService.test.ts`. Golvet är INTE justerat för Heros.

## 2. Går Heros plus på BASIC-nivån (ingen VIP) vid hög communityStanding?

**Nej.** Mätning: en riktig säsong för Heros med `communityStanding` tvingat till 90 varje omgång, `communityActivities` låst till `kiosk: 'basic'`, ingen VIP, inga andra aktiviteter. `scripts/askadarekonomin-heros-basic-hog-cs-2026-08-27.ts` — kör produktionens `calcRoundIncome` (inte en kopia).

| | |
|---|---|
| Hemmamatcher | 11 |
| Snittpublik vid cs=90 | 257 |
| Total communityMatchIncome, säsongen | **−3 367 kr** |
| Snitt per hemmamatch | −306 kr |

Alla 11 hemmamatcher gav negativt netto, från −77 till −522 kr per match.

**Rotorsak, mätt — två oberoende begränsningar, inte en:**
1. **Kapacitetstaket.** Heros saknar egen `arenaCapacity` i klubbmallen och faller tillbaka på `reputation×7+150` = 465. Även vid full beläggning kan publiken aldrig nå de nivåer (700-1800) som ger sqrt-termen tillräcklig kraft mot golvet.
2. **fanMood kollapsar oberoende av communityStanding.** Heros är kanoniskt designad att förlora >75% av matcherna (H4-domen 2026-08-25). I den körda säsongen föll fanMood från ~52 till 0 mot slutet trots tvingat cs=90 — attendanceRate är en funktion av BÅDA, och ett högt cs kompenserar inte för ett golvat fanMood.

**Svaret på din fråga:** kontraktet fungerar INTE i sin nuvarande form ens i bästa scenariot (cs=90, inga andra kostnader). Det här är inte en Heros-specifik brist i konstruktionen — det är samma golv-andel (50%) som alla tolv klubbar delar, och den räcker inte för att en publik under ~500 ska bära en driftskostnad på 1500 kr/match oavsett hur högt cs går. Om golvet ska höjas är det en konstruktionsändring (gäller alla klubbar under en viss publikstorlek), inte en Heros-specialregel — vilket är konsekvent med din egen regel om att inte specialbehandla en klubb. Jag föreslår inget värde här; det är din dom.

## 3. Byggkortet — vad visas om drift kontra intäkt idag?

**Ingenting.** Grep bekräftar: `upkeepCost` förekommer noll gånger i presentationslagret (`src/presentation/**`). Spelaren ser aldrig den återkommande kostnaden förrän den redan dragits.

Konkret, för "Kiosk & servering" (`facilityNodes.ts:95-109`, byggträdets nod — separat system från `communityActivities.kiosk` som kandidat 2 gäller):

- **Nodkortet** (`FacilityTree.tsx`, `ConsekvensRad`) visar bara riktningspilar per dimension: "Ekonomi ↑" (för `Försäljningsintäkter`) och "Ekonomi ↓" (för `Kassa −80 tkr`, engångskostnaden). Inga kronor för den löpande driften.
- **Finansieringssheeten** (`FacilityScreen.tsx:166`) visar bara `Full kostnad {tkr} · {N} omgångar att bygga` — engångskostnaden och byggtiden. Ingen rad för `upkeepCost` (6 700 kr/säsong för kiosken).
- **Efter bygget:** `upkeepCost` dras via `builtFacilityUpkeepCosts` i `economyProcessor.ts:117-119` och visas som EN aggregerad rad, `"Anläggningsdrift (N byggda noder)"`, i ekonomiloggen — summerad över ALLA byggda noder, inte uppdelad per nod. Spelaren kan alltså aldrig se, varken före eller efter, vad just kiosken kostar eller ger.

**Den unbacked "Försäljningsintäkter"-radens status:** bekräftat orört sedan tidigare i sessionen. `builtFacilityUpkeepCosts` i `calcRoundIncome` (`economyService.ts:454-455`) subtraherar bara `upkeepCost` — det finns ingen motsvarande intäktsfunktion för byggträdets kiosk-nod någonstans i kodbasen. "Ekonomi ↑" är ett löfte som aldrig infrias. (Detta är INTE samma system som `communityActivities.kiosk`, som kandidat 2 nu ger verklig sqrt-skalad intäkt för — namnkollisionen mellan de två "kiosk"-begreppen är i sig en läsbarhetsrisk värd att notera.)

**Svar i en mening:** nej, spelet varnar aldrig, varken på byggkortet eller i finansieringssheeten, att en anläggning kan kosta mer i drift än den ger i intäkt — och för byggträdets kiosk-nod specifikt kostar den ALLTID mer, eftersom den inte ger någon riktig intäkt alls.

Rapport-only, ingen kod ändrad för punkt 2-3.
