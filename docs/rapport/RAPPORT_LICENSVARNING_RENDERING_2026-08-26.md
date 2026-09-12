# Rapport: var licensvarningen renderas i dag, och vilka fält den kan bära

2026-08-26. Fix 1, undersökning innan bygge.

## Var den renderas — tre ytor, alla kopplade till fel/ofullständig data

**1. `EkonomiTab.tsx` rad 65-74, 209-214 — den ENDA PERMANENTA statusraden ("Licensstatus"), synlig varje gång spelaren öppnar Ekonomi.** Läser `game.licenseReview` (System A — det som INTE avskedar). **Läser ALDRIG `game.licenseStatus` (System B, det som faktiskt räknar mot avsked).** Konsekvens, konkret: en klubb på sitt TREDJE förlustår i rad (System B: `point_deduction`, en säsong från `license_denied`/avsked) kan visa "Godkänd" grönt här, om System A:s egna (orelaterade) kriterier — absolut kassa >0 och ungdomsverksamhet — råkar vara uppfyllda. **Spelaren har ingen yta alls som visar hur nära avsked de faktiskt är.**

**2. Inbox-poster** (`InboxItemType.LicenseReview`, `InboxItemType.EconomicCrisis`) — engångshändelser vid säsongsslut/vid akut kassakris. Ren titel+body-prosa, ingen strukturerad data. Rensas ur inkorgen efter 2 omgångar (`InboxItem`s egen kommentar: "gallra read informative items"). Texten (verifierad i går) är generisk — "presentera en återhämtningsplan" utan att säga vad planen ska innehålla.

**3. `licenseHandlingsplan`-händelsen** (`seasonEndProcessor.ts` rad ~998) — en interaktiv händelse med fyra val (sparplan/medlemsdrivning/sponsorer/patron). Triggas av System A:s status (`warning`/`continued_review`), INTE av System B — kan alltså dyka upp eller utebli helt oberoende av var klubben faktiskt står i den räknare som avgör avsked.

**Sammanfattning: den enda BESTÅENDE ytan pekar på fel system, engångshändelserna har ingen struktur, och den interaktiva händelsen triggas av fel villkor.** Det är inte bara att informationen saknas — den yta som FINNS pekar aktivt fel.

## Vilka fält den kan bära

`InboxItem` (`domain/entities/Inbox.ts`) har redan det etablerade mönstret för detta — flera tidigare AUDIT-fynd bytte just string-parsing mot nya typspecifika strukturerade fält (`injuredPlayerCount`, `youthMatchSummary`, `outlet`, m.fl., varje en med en kommentar om vilken string-parsing den ersatte). Att lägga till motsvarande för licens är samma mönster, inte ett nytt:

- `licenseYearsCounted?: number` — hur många raka förlustår som räknats (finns redan som `game.consecutiveLossSeasons`, bara aldrig visat).
- `licenseYearsRequired?: number` — tröskeln (4, `checkLicenseStatus`s hårdkodning — bör vara en namngiven konstant om den ska visas, inte ett magiskt tal).
- `licenseRescueHint?: string` — vad som hjälper. Kan peka på `game.communityStanding` direkt.

Alla underliggande data finns redan på `SaveGame`: `licenseStatus`, `consecutiveLossSeasons`, `communityStanding`. Inget nytt spårningsbehov — det är en render-fråga, inte en datainsamlingsfråga.

**Rekommenderad byggordning (väntar på klartecken, inget byggt än):**
1. `EkonomiTab.tsx`s "Licensstatus"-rad läser om till `game.licenseStatus` (System B) — den enda permanenta ytan ska visa den siffra som faktiskt avgör avsked.
2. Ny förklarande rad direkt under: "{consecutiveLossSeasons} av 4 år räknade. En positiv säsong nollställer räkneverket." — konkret, mätbart, ingen gissning.
3. En rad till: "Publiken (Lokal ställning) avgör matchintäkten — högre ställning fyller läktaren." — namnger spaken.
4. `licenseHandlingsplan`-händelsen omtriggas mot System B:s status istf System A:s, så den faktiskt dyker upp när det spelar roll.

Inget byggt. Väntar på din dom om denna byggordning innan jag rör koden.
