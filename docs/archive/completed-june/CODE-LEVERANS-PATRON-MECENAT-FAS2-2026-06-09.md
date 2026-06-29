# CODE-LEVERANS — Patron/Mecenat Fas 2 (dold grundpelare + anskaffnings-båge)

**Datum:** 2026-06-09 · **Status:** IMPLEMENTERAD (commit 8b2beed). Arkiverad för spårbarhet.
**Byggde på:** Fas 1 (commit b74f8d5).
**Beslut (låst):** Patronen = den dolda grundpelaren, knuten till era-bågen. Survival har ingen; storhetstid har sin Hedin.

## Del 1 — Anskaffnings-bågen
- `PATRON_EMERGE_CS = 60` namngiven konstant. Vid säsongsstart (era-omräkning): survival blockerar; fotfäste+ med CS ≥ 60 + ingen aktiv patron + ej inom 2-säsongers cooldown → emergent "patron kliver fram"-event. `generatePatron`-kropp utan creation-tärningen.
- Förtjänad, inte köpt — event spelaren tar emot, ingen butik/knapp.

## Del 2 — Den dolda gestaltningen
- Ingen hanterad patron-panel på Orten (borttagen från KlubbTab). Surfas via events/ekonomi/styrelse. `PatronDemandPrimary` kvar som portal-event-yta. Bidraget = tung ekonomirad.

## Del 3 — Uttåg + cooldown
- `patronHappiness` → 0 triggar `patronWithdrawal`-krisevent. `patronWithdrawnSeason` sätts. Anskaffnings-checken respekterar cooldown.
- Namnförvecklingen löst: `mecenatWithdrawnSeason` eget fält; `patronWithdrawnSeason` tillhör patronen.

## Del 4 — Mecenat conflict/alliance
- Båda mecenaterna påverkas per val via `multiEffect` med dubbla `mecenatHappiness` sub-effekter (+ `targetMecenatId`-stöd i resolvern).

## Implementations-noter (från Code-rapport 8b2beed)
- Anskaffnings-checken sitter i `roundProcessor.ts` (calculateClubEra körs varje runda), med per-säsong-dedup (`patron_emerge_${currentSeason}`) → max en gång/säsong.
- ÖPPEN STÄDNING: patron-data bäddas som `sponsorData` JSON i emergence-eventet — döps om i Orten-redesign-leveransen (neutralt payload-fält). Cross-system-namn att rensa.

— Opus, 2026-06-09
