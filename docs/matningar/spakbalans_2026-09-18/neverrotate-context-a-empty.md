# lu_neverRotate, kontext (a) — cup+liga samma vecka: tom, inte mätbar

Jacobs beställning 2026-09-20: mät `lu_neverRotate` mot `autoSelectLineup`
separat i veckor med både en cupmatch och en seriematch för den hanterade
klubben.

## Fynd

Kontrollerat på 8 seeds, hela karriärer (upp till 5 säsonger, ~700 egna
matcher totalt): **noll veckor innehåller både en cupmatch och en seriematch
för den hanterade klubben.** Minsta observerade avstånd mellan en cupmatch och
klubbens närmaste seriematch är **12 dagar** (median 20 dagar) — långt över en
vecka, oavsett ISO-kalendervecka eller en löpande dagars-mellanrum-tolkning.

Dubbelmatchsveckor (≥2 egna matcher samma ISO-vecka) förekommer DÄREMOT ofta
(15–38 per 5-säsongskarriär och seed) — de är alla liga-mot-liga, aldrig
cup-mot-liga.

## Rotorsak (inte utredd vidare, utanför den här beställningen)

`scheduleGenerator.ts` lägger varje cupomgång på en egen, isolerad
kalenderdag (`getCupRoundDate`), strukturellt separerad från liga-schemat.
Cup och liga kolliderar aldrig i tid för samma klubb med dagens
schemaläggning — kontext (a) som beskrivits ("cupmatch och seriematch samma
vecka") existerar alltså inte i spelets nuvarande kalender.

## Konsekvens för lu_neverRotate-bedömningen

Kontext (a) går inte att mäta som specificerad — det finns inget dataunderlag,
inte "fast elva vann" eller "förlorade", bara frånvaro av det scenario som
skulle testas. Rapporterat tillbaka i stället för att gissa en ersättande
definition eller tyst hoppa över.

Se `docs/handover/HANDOVER_2026-09-20.md` för hur (b) och (c) föll ut och
vad det betyder för "2 av 3"-bedömningen.
