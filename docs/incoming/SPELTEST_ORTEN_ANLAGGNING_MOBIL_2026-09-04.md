# Speltest: Orten, föreningsekonomi och vägen till anläggningar

**Live-deploy:** `7a6e8d1` (`7a6e8d17`)  
**Lokalt HEAD vid koddiagnos:** `5db04f75` — live-hashen är verifierad som ancestor  
**Viewport:** 390 × 844 under hela speltestet. En högre viewport användes en enda gång som nödlösning för att passera en blockerande CTA; felet är dokumenterat nedan.  
**Klubb:** Västanfors  
**Spelad omfattning:** hela cupen (kvartsfinal, semifinal, final) och sex serieomgångar. Cupen vanns; ligaläge 2:a efter sex omgångar (4–2–0). Testet avbröts vid omgång 7 när en reproducerad ekonomi-rotorsak gjorde fortsatt flersäsongsspel till en mätning av samma fel.

## Kort dom

Orten är en av spelets mest lovande ytor. Kedjan match → bygdens puls → sponsor/mecenat → ekonomi syns nu faktiskt i spel, och namn, platser och repliker ger Västanfors en egen värld. Men just nu går den inte att utvärdera som långsiktig anläggningsloop eftersom live-spelade hemmamatcher tappar hela biljettintäkten. Prognosen räknar med intäkten, den riktiga bokföringen gör det inte.

Det mest kostsamma fyndet är alltså inte balans utan en tvåpass-bugg: vid live-match bokförs ekonomin första gången innan den hanterade matchen är färdig och behandlar därför omgången som bortamatch; när live-resultatet sedan finns hoppas ekonomin över helt för att undvika dubbelbokföring. Hemmapublikens intäkt når aldrig kassan.

## Fynd

### CRITICAL — live-spelade hemmamatcher tappar hela biljettintäkten

**Reproduktion**

1. Starta Västanfors och spela matcherna live med `Snabbsim` inne i matchvyn.
2. Aktivera valfria föreningsaktiviteter och öppna Ekonomi före en hemmamatch.
3. Notera prognosen och saldot.
4. Spela matchen och kontrollera `SEDAN SIST` samt transaktionshistoriken.

**Observerat**

- Före omgång 3: saldo 385 tkr, prognos **+72 tkr intäkter, −41 tkr kostnader, netto +31 tkr** för hemmamatch.
- Efter matchen: `SEDAN SIST · Ekonomi −31 tkr`.
- Hemmaomgångarna 1–4 gav konsekvent cirka **−31/−32 tkr** trots 341–624 åskådare.
- Transaktionshistoriken innehöll grundintäkt, sponsorer, aktiviteter, löner och arenaunderhåll — men ingen `Matchintäkt (hemma)`.
- Första bortamatcherna gav cirka −29 tkr, alltså nästan samma utfall som hemma. Hemmaplansens stora ekonomiska skillnad saknades.
- Kassan föll 451 → 265 tkr till omgång 7 trots cupvinst, obesegrad ligastart, fyra aktiva sponsorer och en genomförd julmarknad.

**Förväntat**

Prognos och bokföring ska använda samma kanoniska beräkning. En hemmamatch med registrerad publik ska ge exakt en biljettintäkt och aldrig behandlas som en bortamatch.

**Sannolik rotorsak**

`src/application/useCases/processors/economyProcessor.ts` hittar hemmamatchen enbart i `simulatedFixtures`. I första passet är den live-spelade managed-fixturen ännu inte completed, så `managedHomeMatch` blir `undefined` och `isHomeMatch=false`. I andra passet finns den färdiga fixturen, men `roundProcessor.ts` anropar processorn med `skipSideEffects: isSecondPassForManagedMatch`; processorn returnerar då innan någon ekonomi bokförs. Kommentaren säger att live-fixturen finns i andra passet, men den vägen är samtidigt avstängd.

**Rekommenderad rotfix**

Gör ekonomiprocessningen uttryckligen tvåfasad i stället för att återanvända ett globalt `skipSideEffects`. För en omgång med väntande live-match ska managed-klubbens ekonomi skjutas upp till completion-passet, medan AI-klubbarnas ekonomi kan göras i första passet. När live-fixturen är färdig bokförs managed-ekonomin exakt en gång med faktisk `attendance`. Lås med parity-test mellan live-match och snabbsim.

### HIGH — cupsegerns primära CTA ligger bakom bottennavigeringen på 390 × 844

**Reproduktion**

1. Vinn cupfinalen på mobilbredd 390 × 844.
2. Nå scenen `POKALEN · Cupmästare`.
3. Försök trycka `Pokalen står i klubbhuset →`.

**Observerat**

Knappens nedre del och träffyta låg under den fasta bottennavigeringen. Ett normalt locator-/mittpunktstryck träffade i stället footerns `rapportera`. För att fortsätta behövde viewporten tillfälligt höjas.

**Förväntat**

CTA:n ska vara helt synlig och ha en fri träffyta ovanför bottennavigation och safe area.

**Sannolik rotorsak**

`src/presentation/screens/scenes/CupFinalVictoryScene.tsx` använder `minHeight: 720` plus 50 px topp- och 28 px bottenpadding, utan att reservera plats för både appheader och fast bottennav. På 844 px blir scenens sista innehåll fysiskt längre än det fria området. `overflow: hidden` gör återhämtningen sämre.

**Rekommenderad fix**

Låt scenskalet äga den tillgängliga höjden: `min-height: calc(100dvh - header - bottom-nav - safe-area)` eller ett gemensamt scrollande Scene-layoutskal med obligatorisk bottenpadding. Testa den faktiska CTA-träffytan, inte bara screenshot.

### HIGH — en startpatron kastas ut innan spelaren ens har fått träffa honom

**Reproduktion**

1. Starta den seedade Västanfors-karriären.
2. Gå in i första matchveckan.

**Observerat**

Ett kort sade att **Bo Wikström lämnar** eftersom läktaren tunnats ut och orten inte längre tror på klubben. Samtidigt visade Orten `Inga mecenater ännu`, karriären var ny och klubben hade inte spelat en enda ligamatch. Spelaren hade aldrig mött Bo eller fått något stöd av honom.

**Förväntat**

Ingen relation ska kunna avslutas innan den introducerats, och en ny karriär ska inte beskrivas som en långvarig publiknedgång utan observerad historik.

**Sannolik rotorsak**

`setupManagedClub.ts` skapar en aktiv legacy-`patron` med 75 % chans för klubbar med reputation ≥35. `roundProcessor.ts` kastar samtidigt ut varje aktiv patron när `communityStanding < PATRON_EMERGE_CS`. Nya saves startar på 50, under tröskeln. Eviction-gaten saknar villkor för att patronen har introducerats/etablerats. Dessutom är `patron` och den synliga listan `mecenater` två separata modeller, vilket gör motsägelsen synlig.

**Rekommenderad rotfix**

Bestäm en kanonisk relation. En startpatron måste antingen börja i ett etablerat state vars startnivå uppfyller premissen, eller förbli pending tills introt har spelats. Avhopp ska kräva ett observerat tidigare etablerings-/introbeat, inte bara `isActive` och ett startvärde.

### MEDIUM — frivilliga visar tio gånger större pulseffekt än de faktiskt ger

**Reproduktion**

1. Öppna Orten.
2. Rekrytera Gun Andersson, `Matchvärd · 4 puls/omg`.
3. Läs totalsumman efter rekryteringen.

**Observerat**

Kortet lovade **+4 puls/omg**. Totalsumman ändrades från +0,0 till **+0,4 puls/omg**.

**Sannolik rotorsak**

`volunteerService.ts` lagrar `csBoost: 4` men `getActiveVolunteerBonus` applicerar `csBoost / 10`. `OrtenTab.tsx` visar råvärdet på rekryteringskortet men det skalade värdet i aggregatet.

**Rekommenderad fix**

Gör en enda domänenhet för pulseffekt, exempelvis 0,4, och använd den både i mutation och presentation. Lägg kontraktstest på text → faktisk delta.

### MEDIUM — de sju startfrivilliga är kosmetiska och ger 0 effekt

**Observerat**

Karriären började med sju namngivna frivilliga, men aggregatet sade `+0 tkr · +0,0 puls/omg`. Först den nyrekryterade personen gav effekt.

**Sannolik rotorsak**

`setupManagedClub.ts` skapar startnamn ur `VOLUNTEER_FIRST_NAMES`. `volunteerService.ts` genererar en separat seedad roll-roster med för- och efternamn och filtrerar effekter genom exakt namnmatchning. Startnamnen finns därför inte i den roster som räknar bonus.

**Rekommenderad rotfix**

Lagra stabila Volunteer-entiteter/id:n i savegame och generera både startgrupp, rekryteringspool, UI och ekonomi från samma roster. Undvik fallback och namnjoin som permanent modell.

### MEDIUM — “efter tio omgångar” visas efter sex ligaomgångar

**Observerat**

På portal inför ligaomgång 6 stod: `Västanfors ligger 2:a efter tio omgångar.` Laget hade spelat sex ligamatcher och tre riktiga cupmatcher.

**Sannolik rotorsak**

`midSeasonEventService.ts` har eventet på `matchday: 10` och skriver “tio omgångar”. Den globala matchday-klockan inkluderar cupdagar; UI:s “omgång” avser ligarond.

**Rekommenderad fix**

Gatea detta event på antal completed league fixtures/currentLeagueRound. Om global matchday avsiktligt ska användas måste texten undvika ligapåståendet.

### MEDIUM — cupvägen visar fel motståndare och dubbla finaler

**Observerat efter cupvinsten**

- `KF: Slog ?`
- `SF: Slog Söderfors`
- `Final: Slog Forsbacka`
- `Final: Slog Målilla`

Den faktiska vägen var Söderfors i kvartsfinal, Forsbacka i semifinal, Målilla i final.

**Sannolik rotorsak**

`getCupJourney` i `src/presentation/utils/finalJourneys.ts` tar alla bracketposter där `winnerId===clubId`, inklusive bye, och mappar 1→KF, 2→SF, allt annat→Final. `CupMatch.round` definieras uttryckligen som 1=förstarunda, 2=kvartsfinal, 3=semifinal, 4=final.

**Rekommenderad fix**

Filtrera bort `isBye` och mappa med cupdomänens `getCupRoundName`/`getCupRoundLabel` i stället för en ny lokal skala.

### MEDIUM — styrelsemålet påstår att kassan är över två miljoner när den är 418 tkr

**Observerat**

Västanfors startade med cirka 418 tkr men fick `Investera överskottet`. Måltextens premiss är att klubben har över två miljoner. Bygget sade samtidigt `Valet öppnar nästa säsong`, och ismaskinsköpet räknades inte: progress stod kvar på 0 investeringar.

**Sannolik rotorsak**

`generateBoardObjectives` ger alla ChallengeTop-klubbar `investSurplus` oavsett saldo. `investSurplus()` bär en hård tvåmiljonerspremiss men fabriksvägen gates inte på `club.finances > SURPLUS_CEILING`.

**Rekommenderad fix**

Gör factoryn nullable och skapa målet endast när saldot faktiskt passerat gränsen. Välj ett sanningsenligt ChallengeTop-alternativ annars. Lägg test för startklubb under 2 M.

### LOW — ortsaktiviteterna i kartan är val utan synlig konsekvens

**Observerat**

`Pensionärskaffe`, `Soppkväll med laget` och `Skolbesök` visade bara `Aktivera`. Efter tryck kom `Aktivitet uppdaterad`, men ingen kostnad, effekt, varaktighet eller tradeoff. Skolbesök kunde därför inte bedömas som beslut.

**Rekommenderad fix**

Visa samma sanningsrad före valet som Ekonomi-fliken gör: kostnad, pulseffekt, eventuell annan systemeffekt och varaktighet. Om handlingen är gratis flavor bör den namnges som sådan och inte presenteras som ett strategiskt beslut.

## Systemobservationer — det som faktiskt hände

- Bygdens puls steg **52 → 73** på sex ligaomgångar plus cupsegern.
- Jag aktiverade kiosk, lotteri, barnbandyskola, Bandyplay, funktionärer och Skolbesök samt genomförde julmarknaden.
- Aktiveringarna kostade totalt 9 tkr i synliga startkostnader; aktiviteternas löpande netto låg från cirka +25 kr till +1 tkr beroende på hemma/borta.
- Gunilla Holm dök upp som mecenat när pulsen nått 72 och erbjöd 86 tkr/säsong. Detta var begripligt och kändes som en belöning för den lokala utvecklingen.
- Kommunrelationen låg kvar på 50 trots köpet av kommunens ismaskin; längre effekt hann inte verifieras.
- Publiken på de fyra första ligamatcherna var 467, 341, 605 och 624. Pulsen steg hela tiden, men UI gav ingen tydlig förklaring till hur stor del av publikförändringen som kom från puls, väder, motstånd eller form.

## Det som fungerade bra

- Orten har personer snarare än abstrakta staplar: Kurt, Gunilla, Leif, Gun och Bergskurvan gav beslut och siffror en plats i världen.
- Den övergripande länken seger → puls → sponsor/mecenat gick att förstå utan kod.
- Ekonomi-fliken är ovanligt läsbar på mobil. Hemma/borta ändrar aktivitetsprognosen, transaktionerna namnger källor och uppstartskostnader drogs exakt.
- Julmarknaden var ett föredömligt litet beslut: 4 tkr kostnad och 12 tkr intäkt uttrycktes som +8 tkr netto.
- Mecenatkortet för Gunilla hade personlighet, ett tydligt ekonomiskt värde och kändes som en händelse — inte bara en modifierare.
- Ingen horisontell overflow observerades i Ekonomi eller Orten på 390 px.

## Det testet inte bevisar

**Inträffade inte:** pulsfall, mecenatkonflikt, kommunval, aktivitetsförnyelse, staleness eller avveckling.

**Kunde inte testas men är inte därmed trasigt:** byggstart, byggtid, färdigställande, driftkostnad för byggd nod och avvecklingssheet/communityStanding −8. Byggvalet öppnar nästa säsong, och ekonomi-buggen gör vägen dit ogiltig som balansmätning.

**Avsiktligt stopp:** att fortsätta 15 ligaomgångar och en andra säsong hade bara mätt följden av den redan isolerade live-matchbuggen. Kör om exakt samma scenario efter rotfixen; då ska testet fortsätta två hela säsonger och omfatta bygg + senare avveckling.

## Föreslagen regressionstest-suite

1. **Live/snabbsim-ekonomiparitet:** samma seed och hemm-fixture via live completion respektive snabbsim ska ge samma ekonomikomponenter; `match_revenue` finns exakt en gång.
2. **Tvåpass-idempotens:** managed-ekonomi bokförs noll gånger före live completion och exakt en gång efter; AI-ekonomi bokförs exakt en gång totalt.
3. **Prognos mot facit:** med determinerad `rand` och faktisk attendance ska UI-prognosens komponenter kunna reconcileras mot financeLog.
4. **Mobil-CTA 390 × 844:** `Pokalen står i klubbhuset` har bounding box helt ovanför BottomNav och ett vanligt center-tap utlöser `onComplete`.
5. **Cup journey:** bracket med bye + KF/SF/final visar exakt tre riktiga matcher med korrekta etiketter och motståndare.
6. **Patron-livscykel:** ny startpatron kan inte få withdrawal före intro/established-state; CS 50 vid save-start får inte producera falsk avskedstext.
7. **Volunteer-kontrakt:** kortets angivna pulsdelta är exakt det som aggregat och nästa round processor applicerar.
8. **Startvolontärer:** varje sparad startvolontär har stabilt id/roll och bidrar enligt samma roster som UI visar.
9. **Ligaklocka:** tre cupmatcher + sex ligamatcher får inte trigga texten `efter tio omgångar`; den triggar först efter tio completed league fixtures.
10. **InvestSurplus-sanning:** klubb under 2 M kan inte tilldelas ett mål vars beskrivning hävdar att saldot är över 2 M.
11. **Ortsaktiviteternas löften:** varje `Aktivera`-kort visar samma kostnad/effekt/varaktighet som resolutionen faktiskt skriver.
12. **Omsvep efter fix:** två hela säsonger med en nod byggd tidigt i säsong 2 och avvecklad senare; verifiera byggtid, underhåll, kommun/mecenat, portalminne och −8 puls utan direkta state-inspektioner.

## Åtgärdsstatus 2026-09-04

Samtliga reproducerbara fynd ovan är åtgärdade i arbetskopian:

- Managed-klubbens omgångsekonomi är nu en uttrycklig tvåfasstransaktion: AI-klubbar bokförs medan spelarens match väntar; spelarens fulla ekonomi bokförs exakt en gång när matchen avgörs. Live, walkover/avbruten match och snabbsim använder samma processor. Cuppriser har samtidigt fått en gemensam domänfunktion.
- Cupfinalsegern klassas som samma helskärmsceremoni som SM-segern. BottomNav monteras inte och kan därför inte täcka eller ta emot tryck avsett för CTA:n.
- Patronrelationen har fått ett explicit, migrerat `introducedSeason`. CS-avhopp kräver att introt eller emergence faktiskt har avgjorts; en startpatron kan inte lämna före sin presentation och grinden är inte beroende av den korta eventkön.
- Varje volontärnamn ger nu en stabil, reproducerbar roll genom den delade domäntjänsten. Startvolontärer bidrar med både pengar och puls, aktiva personer visar sin roll, och rekryteringskortet visar den faktiskt applicerade tiondelsskalan.
- Mittsäsongshändelser läser den hanterade klubbens senaste avslutade ligarond, aldrig den globala cupblandade matchday-klockan.
- Cupresan filtrerar bort bye och använder cupdomänens etiketter för förstarunda, kvartsfinal, semifinal och final.
- `Investera överskottet` skapas bara för ChallengeTop-klubbar vars faktiska kassa överstiger två miljoner.
- Ortsaktiveringarnas prislista har flyttats till en gemensam källa. Pensionärskaffe, soppkväll och skolbesök visar kostnad, faktisk puls per omgång och att effekten avtar över säsonger före aktivering.

**Verifiering:** hela Vitest-sviten är grön: 456 testfiler, 4 369 tester. Produktionsbygge, TypeScript, design-guard, design-adherence, content-contract och facility-consequence-guard är gröna. Nya regressioner täcker liveavräkning, idempotens, patron före intro, cupdag kontra ligarond, cupresa med bye, verkligt överskottskrav, volontäridentitet och ceremoninavens gate.
