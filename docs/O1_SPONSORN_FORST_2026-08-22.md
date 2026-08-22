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

## Text

Title/body/subtitles på konfliktvarianten är `'[Opus]'` — CLAUDE.md:s hårda regel, Code skriver aldrig svensk speltext. Kortet renderas (synlig platshållare, inte krasch) tills Opus skriver den. Vad texten behöver bära: en namngiven ny sponsor med ett problem ELLER en tydlig konflikt mot den namngivna rivalen (vem rivalen är, `rivalSponsor.name`/`rivalSponsor.category` finns tillgängliga i konstruktionsstället).

## Verifiering

Stash-test-cykel körd (nya testerna failar mot återställd kod, passerar mot den nya). 8 nya tester (`sponsorConflict.test.ts`): konfliktdetektering (rival vald korrekt bland flera sponsorer, ingen rival → plain-varianten, inte systemhandelse-taggad), eventResolver (accept lägger till+avslutar+kostar, reject orört, regression på plain-varianten, communityStanding clampas vid 0). 2330/2330 gröna (full svit), build ren, stress 10×5 — 0 krascher, 0 invariant-brott.

## Kod

- `src/domain/entities/GameEvent.ts` — två nya optional-fält, `terminateSponsorId`/`communityStandingDelta`.
- `src/domain/services/events/eventResolver.ts` — `sponsorOffer`-grenen hanterar terminering + communityStanding.
- `src/domain/services/events/postAdvanceEvents.ts` — konstruktionen bruten ut till `buildSponsorOfferEvent` (exporterad, ren funktion, testbar utan RNG).
- `src/domain/data/contentContract.ts` — `sponsorOffer`-raden uppdaterad (O11-registret, `filled: true`, båda varianterna beskrivna).

## Flaggat, inte byggt

`riskySponsorOffer`s trasiga maturation-konsekvens (`roundProcessor.ts:1000-1034`) — separat leverans, se BACKLOG.
