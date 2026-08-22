# O1 — sponsorn först, byggd (2026-08-22)

Jacobs order efter O5:s slutdom: "Kör O1 (varsel-mallen). Sponsorn först — vanligast och tommast." Med tillägget att säsongsbudget/cooldown-mekaniken byggs ihop med U5:s `semanticKey`, inte separat.

## Pre-spec cross-check (obligatoriskt, CLAUDE.md princip 2)

Två fynd innan något skrevs:

**1. U5:s säsongsbudget-mekanik fanns redan, helt klar.** `narrativeLogService.ts` (`logNarrativeBeat`, `isOnCooldown`, `systemhandelseBudgetOk`, `filterSystemhandelseBudget`) — U5 stängdes `c2e34591`/`4e341891` innan detta pass. Ingenting att bygga där. Tillägget i ordern var redan uppfyllt av tidigare arbete.

**2. Sponsorsystemet har TVÅ separata flöden**, och bara ett av dem matchar "vanligast och tommast":
- `sponsorOffer` (`postAdvanceEvents.ts`) — den frekventa, generiska sponsorn. Accept = ren vinst, reject = `noOp`. Detta ÄR kvitteringsknappen O2/O1 pekar ut.
- `riskySponsorOffer` (`eventProcessor.ts`, 1-2x/säsong) — redan har ett riktigt pris i TEXTEN (fyra färdigskrivna namngivna bolag, Skatteverket-granskning, konkurs, löpsedel). Men konsekvensen är trasig: `roundProcessor.ts:1030` har en kommentar "Remove the risky sponsor from sponsors list + claw back income (handled in SaveGame assembly below)" — det händer ALDRIG. Ingen kod tar bort sponsorn, ingen claw-back, ingen reputation/communityStanding-effekt. Spelaren läser "klubben förlorar sponsorn i förtid och måste betala tillbaka" och ingenting av det sker. **Text-utan-mekanik, Princip 6-brott, INTE fixat i detta pass** (utanför ordern, en separat, egen leverans) — flaggat i BACKLOG.

Byggde alltså konfliktvarianten för `sponsorOffer`, inte `riskySponsorOffer`.

## Mekaniken

Konfliktvariant: när `generateSponsorOffer` producerar en ny sponsor vars `category` matchar en REDAN AKTIV sponsor (accepterad av spelaren tidigare), blir kortet ett riktigt val:
- **Accept:** ny sponsor tillkommer OCH rivalen avslutas (`contractRounds→0`, samma idiom `sponsorProcessor.ts` redan använder för utlöpta avtal — nästa omgång fångar den existerande "X avslutar"-notisen automatiskt, ingen ny inbox-kod behövdes) OCH communityStanding −6.
- **Reject:** `noOp`, rivalen behåller sin plats, den nya sponsorn uteblir.

Mallens fem punkter, ärligt bedömda — **4/5, inte 5/5**:
1. ✅ Namngiven institution som redan finns i spelvärlden — rivalen är en sponsor spelaren redan accepterat.
2. ❌ Träffar en spelare/funktionär spelaren mött — sponsorer är företag, inte personer. Ouppfyllt.
3. ✅ Ett tal att räkna på — ny sponsors intäkt mot rivalens förlorade intäkt, båda kända.
4. ✅ Minst två system — ekonomi (nettointäkt) + communityStanding (relation).
5. ✅ Pekar isär — mer pengar nu vs. en relation som bryts.

**Därför INTE `systemhandelse: true`.** En 4/5-händelse som taggas som systemhändelse blåser upp säsongsbudgeten mallen själv varnar för ("de ska vara få") — bara genuina 5/5 ska räknas mot O19/U5:s räknare. Naturlig sällsynthet (samma kategori av 20 möjliga i `BUSINESS_TYPES`) håller frekvensen låg utan en formell spärr.

## Text — skriven av Opus 2026-08-22, klistrad ordagrant

Rubrik: `{NySponsor} vill in`. Brödtext, val ("Ta avtalet"/"Tacka nej"), underrader och båda utfallstexterna (accept/avslag) klistrade in exakt som levererat, ingen redigering (SPEC-LYDNAD). Jacobs dom 2026-08-22: den fleråriga tenure-raden ströks ur specen helt (ingen sponsor som kan bli rival här hinner någonsin bli flerårig) — bara Jacobs egen fallback ("var med när det var tunnare än nu") finns kvar, i koden såväl som i specen. Ingen dold gren, ingen rad ingen underhåller. Utfallstexterna renderas som inbox-poster vid resolution (`inbox_sponsor_conflict_accept_*`/`_reject_*`), samma mönster som övriga sponsor-notiser.

**Bieffekt att känna till, inte fixad:** rivalens avtal avslutas via `contractRounds→0`, samma idiom som en naturligt utlupen sponsor. Nästa omgång fångar `sponsorProcessor.ts`s generiska "X avslutar (avtalet har löpt ut)"-notis automatiskt ovanpå den nya, specifika utfallstexten — en mindre tondubblering (två notiser om samma sak, en generisk "löpte ut", en specifik "ni sa nej till dem"), inte en felaktig eller motsägande konsekvens. Inte byggt bort — hade krävt att undanta konflikt-terminerade sponsorer från `sponsorProcessor.ts`s generiska expiry-loop, utanför ordern.

## Verifiering

Stash-test-cykel körd två gånger (mekanik, sedan text) — nya testerna failar mot återställd kod, passerar mot den nya, båda gångerna. 8 tester (`sponsorConflict.test.ts`): konfliktdetektering (rival vald korrekt bland flera sponsorer, textinterpolation av båda namnen, ingen rival → plain-varianten, inte systemhandelse-taggad), eventResolver (accept lägger till+avslutar+kostar+utfallstext, reject orört+utfallstext, regression på plain-varianten inkl. att ingen konflikt-inbox-post läcker in, communityStanding clampas vid 0). 2330/2330 gröna (full svit), build ren, stress 10×5 — 0 krascher, 0 invariant-brott.

## Kod

- `src/domain/entities/GameEvent.ts` — två nya optional-fält, `terminateSponsorId`/`communityStandingDelta`.
- `src/domain/services/events/eventResolver.ts` — `sponsorOffer`-grenen hanterar terminering + communityStanding + utfallstext-inbox.
- `src/domain/services/events/postAdvanceEvents.ts` — konstruktionen bruten ut till `buildSponsorOfferEvent` (exporterad, ren funktion, testbar utan RNG), texten inklistrad.
- `src/domain/data/contentContract.ts` — `sponsorOffer`-raden uppdaterad (O11-registret, `filled: true`, båda varianterna beskrivna).
- `src/application/useCases/processors/sponsorProcessor.ts` — ny `applyRiskySponsorMaturation`, se nedan.
- `src/application/useCases/roundProcessor.ts` — den gamla, ofullständiga checken (rad ~999-1034) borttagen, ersatt av ett enda anrop där `updatedGame` redan finns.
- `src/domain/data/eventProcessorStrings.ts` — ny delad konstant `RISKY_SPONSOR_CONTRACT_ROUNDS=44` (var en oexporterad literal på två ställen).

## `riskySponsorOffer`s maturation-konsekvens — WIRAD 2026-08-22 (Jacobs dom)

INTE ett nytt fynd: redan klassad (b) påhittad effekt i `CHOICE_LABEL_SVEP_2026-08-17.md` (rad 86/129) för en vecka sedan, men aldrig wirad eller återförd till listan. Rediscoverad oberoende via O1:s pre-spec cross-check — ett känt, klassat fynd som legat oåtgärdat är exakt den typ av kostnad BACKLOG:s "listan" ska förhindra. Flyttat in i 2.5-listan (SLUTTEST_KO.md) med kostnadsuppskattning och sedan wirat i samma leverans, se den sektionen för full detalj. Sidofyndet (kontraktet rensades aldrig, säsongsgaten gjorde det permanent tyst efter ett säsongsskifte) fixat i SAMMA block, per Jacobs uttryckliga order — annars hade tre effekter wirats till en väg som ändå aldrig nås.

## Punkt 2 (spelare/funktionär) — rapporterat, se DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md

Jacobs fråga: kan punkt 2 uppfyllas om rivalen är namngiven och funnits över flera säsonger? Svar: `generateSponsorOffer`s sponsorer (poolen den byggda mekaniken drar rivaler ur) genereras slumpmässigt PER ERBJUDANDE, ingen identitet över tid, kontraktslängd alltid under en säsong (8-16 omgångar). Kontextuella sponsorer (`checkContextualSponsors`) HAR stabil identitet över säsonger — men ligger i en annan kategori-namnrymd, onåbara som rival i den byggda `category`-matchningen. Fullständigt svar + konsekvens för mallen: se tillägget i `DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md`.
