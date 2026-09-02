# DOM — LICENS: "bättre men inte bra"-texterna + retire-last-täckningen

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** `tva-licenssystem-osynkade`. Code:s utredning bekräftade retire-last-vakten: System A (`licenseReview`, kaskad) kan INTE raderas förrän System B (`checkLicenseStatus`, ackumulator, kanon) täcker fyra gap. Detta är Opus-halvan (text + ett omdöme); Code-halvan (wiring) längst ner.

## Bakgrund (Code kodläst)
System B tystnar på RELIEF-övergångar där klubben förbättras men fortfarande är i farozon (`licenseService.ts:185`, kommentar :163-167 "ingen text för bättre men inte bra"). Reachable: `license_denied→point_deduction`, `point_deduction→first_warning`. System A säger något där idag → radera A nu = en klubb som klättrar tillbaka från nedflyttning går TYST. Plus tre gap till (årlig upprepning, sidoeffekter, `licenseReview` live-läst) — se Code-halvan.

## OPUS-HALVAN 1 — de två saknade övergångstexterna

Samma register som `LICENSE_ZONE_TEXT` (låst, zonen bär kravet, ingen siffra). Erkänner förbättringen (så klubben inte går tyst efter en bra säsong) MEN håller kvar att det inte är över (så det inte läses som `cleared`). Den saknade mellannivån mellan `cleared` och `worsened`:

- **`license_denied → point_deduction`**: "Ni har vänt det värsta. Licensnämnden häver hotet om nedflyttning — men poängavdraget står kvar tills ekonomin är i balans."
- **`point_deduction → first_warning`**: "Det går åt rätt håll. Nämnden lättar på poängavdraget, men bevakningen fortsätter. Ni är inte ur det än."

Wiring: en ny `action`-gren i `checkLicenseStatus` för relief-till-fortfarande-dålig-zon (parallell till `cleared`-grenen men behåller zon-varningen). Code bygger grenen, dessa två strängar är texten.

## OPUS-HALVAN 2 — omdömet: släpp den årliga upprepningen

Code:s fråga: ska B skicka inbox VARJE säsong på stabilt läge (som A) eller bara vid förändring? **Dom: bara vid förändring.** A:s "du är fortfarande fin/varnad"-inbox varje år är BRUS — samma repetitionsklass som Konsum-citatet och final-ramen vi jagat bort överallt. Och det bryter mot liggare-vs-cooldown-gränsen (`DOM_LIGGARE_COOLDOWN_GRANS`): en zonÖVERGÅNG är en HÄNDELSE (inbox); ett stabilt LÄGE är ett TILLSTÅND (den persistenta EkonomiTab-badgen + `licenseZoneLabel`-chippen bär det tyst och konstant). B:s modell (inbox bara vid förändring) är RÄTTARE än A:s, inte en regression. **Släpp den årliga upprepningen — återinför den INTE i B för paritets skull.**

## CODE-HALVAN — retire-last-wiring (ingen designkall, bygg när texten finns = nu)
1. Ny relief-`action`-gren i `checkLicenseStatus` som bär de två texterna ovan (mellannivån mellan cleared/worsened).
2. Portera A:s sidoeffekter till B:s zonövergångar: sponsor-avtalsbrott på denied (`seasonEndProcessor.ts:1329-1361`), mid-season sponsor-avhopp 20%/omgång på warning/review (`sponsorProcessor.ts:77-96`), grävande-artikel-inbox (`:1413`), −15 fanMood på denied (`:2136`). Utan detta dör de tyst vid A:s borttagning.
3. Koppla om årsbokens licens-rad (`seasonDecisionsService.ts:77-83`) från `game.licenseReview` → `game.licenseStatus`.
4. Verifiera `licenseReview` inte längre live-läses (sponsorProcessor, seasonDecisionsService, handlingsplanens sparplan-belopp `:1478,1480`) — flytta varje läsare till B FÖRST.
5. NÄR 1-4 täckta: radera System A (`licenseReview`-kaskaden i seasonEndProcessor). Retire-last: A dör när dess sista unika utfall är täckt av B.

## ÄGARSKAP
Opus: KLAR (två texter + omdömet ovan). Code: bygg wiring 1-5, kör nu — texten finns, inget mer väntar på Opus. Retire-last-invarianten (`MIGRATIONSPLAN`) styr: A raderas sist, när B täcker allt spelaren såg. Jacob: inget beslut väntar — dömt (avprecisera-dubblering, B är kanon, årliga upprepningen släpps).
