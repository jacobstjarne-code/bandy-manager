# Systemaudit: akademi, ekonomi, styrelse och minne

> **Åtgärdspass 2026-09-04:** BLOCKER-fyndet och de entydigt mekaniska HIGH/MEDIUM-fynden nedan är nu åtgärdade och regressionstestade. Närmare status finns i avsnittet "Åtgärdsstatus" längst ned. Rapportens ursprungliga observationer står kvar som reproducerbart före-läge.

**Datum:** 2026-09-04
**Live-build som faktiskt spelades:** `6c72267` (synlig build-badge)
**Repo-HEAD efter push:** `dc07f5ef`
**Kodskillnad:** commits efter `6c72267` var test-/workflowarbete; den spelbara applikationskoden motsvarar därför live-builden.
**Viewport:** 390×844 under hela genomspelningen.
**Karriär:** Rögle, SVÅR, tre hela säsonger (2026/27–2028/29). Säsong 1 spelades aktivt genom omgång 14, säsong 2 genom omgång 12 och säsong 3 genom omgång 12; återstående grundserie simulerades med spelets egen knapp. Cup, sommar, årsbok, akademi, ekonomi, styrelse och klubbminne kontrollerades varje säsong.

## Kort dom

Spelet har blivit märkbart bättre på att skapa en **klubbvardag man vill återvända till**. Jag mindes Pontus Olofsson, Robert Sjölund, Patrik Berglund, Johan Moberg, Gunilla Nilsson och mecenaten utan att läsa tabellerna. Burnout-bågen är nu ett verkligt bevis på att liggaren kan skapa återfall och efterklang.

Men de fyra systemen håller inte samma nivå ännu:

- **Akademin skapar personer men förvaltar dem inte säkert.** Den mest investerade P19-spelaren försvann tyst vid 20 års ålder, uppflyttningsberedskap är delvis kosmetisk och utlåningsmatematiken gör bästa utfallet omöjligt.
- **Ekonomin gör ont på riktigt nu.** Kassan gick `260 → −64 → −365 → −412 tkr`, en anläggning gick inte att finansiera och flera småval sved. Däremot är orsakskedjan och flera kontraktslöften fortfarande opålitliga.
- **En SVÅR klubb kan misslyckas utan sabotage, men managern kan inte få den sportsliga slutkonsekvensen när klubbkravet är `Survive`.** Det är ett uttryckligt kodundantag, inte otur i testet.
- **Minnet minns mer än förr men väljer och namnger ojämnt.** Burnout och vissa personval biter; årsboken missar akademin och säger samtidigt att inget beslut stack ut trots ett kommunlån som räddade säsongen.

## Fynd, prioriterade

### BLOCKER — mobil onboarding blockeras av rapportknappen

**Reproducerbarhet:** 1/1 ny karriär på 390×844.

**Steg:**

1. Öppna liveversionen i 390×844.
2. Starta ny karriär och fyll i tränarnamn.
3. Tryck på nedersta CTA:n `GÅ VIDARE →`.

**Förväntat:** klubbvalet öppnas.
**Faktiskt:** den fixerade raden `6c72267 · rapportera` tar trycket och öppnar rapportmodalen. Enter på tangentbord gick förbi felet, men en mobil spelare har ingen sådan naturlig reservväg.

**Sannolik kodorsak:** `FeedbackButton` döljs bara på `/game/match`, `/game/review` och `/dev`, men inte på start-/onboardingrutterna. Knappen har `position: fixed`, `bottom: 64` och `zIndex: 9999`; se `src/presentation/components/FeedbackButton.tsx:26–32, 73–85`.

**Rekommenderad fix:** gör feedbackkontrollen opt-in på etablerade spelskärmar eller dölj den på hela onboarding/startflödet. Lägg en geometrisk mobiltest som faktiskt trycker i CTA:ns mittpunkt.

### HIGH — `Survive` gör sportsligt avsked omöjligt trots “Ultimatum”

**Reproducerbarhet:** tre av tre säsonger i samma karriär.

**Steg:**

1. Välj Rögle, SVÅR.
2. Spela normalt, utan avsiktlig tankning.
3. Sluta 11:a två år i rad, med negativ ekonomi och styrelsestatus `Ultimatum`.
4. Fortsätt tredje året och sluta 9:a.

**Förväntat:** när UI:t säger “Styrelsen har tappat tålamodet” ska ett fortsatt sportsligt misslyckande kunna leda till avsked, eller UI:t tydligt förklara varför det inte gör det.
**Faktiskt:** inget sportsligt avsked kan ske så länge säsongsstartens förväntan är `Survive`. Karriären fortsatte efter två elfteplatser och en hel säsong med ultimatum.

**Kodbevis — detta kan inte inträffa:** `seasonEndProcessor.ts:1453–1468` sätter `isSurviveTier` och kör avskedskontrollen endast när den är falsk. Samma undantag gäller både `boardPatience <= 15` och `consecutiveFailures >= 3`. Bara licensnekan eller konkurs återstår (`:1473–1497`). Det finns dessutom ett explicit test som kräver att `boardPatience: -500` inte avskedar en Survive-manager.

**Rekommenderad fix:** produktbeslut krävs. Antingen (A) låt Survive skydda mot ett enstaka förväntat bottenår men inte mot upprepade missade uppdrag/total förtroendekollaps, eller (B) behåll undantaget men sluta visa sportsligt `Ultimatum` som om avsked vore nära. Ett merit-/grace-minne är bättre än en absolut immunitet.

### HIGH — P19-spelare försvinner tyst när de fyller 20

**Reproducerbarhet:** 1/1 observerad åldersövergång.

**Steg:**

1. Följ Johan Moberg, 18 år, trestjärnig mittfältare.
2. Tilldela mentor och skicka honom till P19-landslagssamling.
3. Passera två somrar utan manuell uppflyttning.
4. Sök honom i både P19 och hela A-truppen.

**Förväntat:** ett sista beslut, automatisk frigivning med besked, eller uppflyttning/kontrakt.
**Faktiskt:** Johan fanns varken i P19 eller A-truppen säsong tre. Ingen övergångsrad förklarade vart den mest investerade akademiberättelsen tog vägen.

**Kodbevis:** `carryOverYouthTeam` åldrar alla och kör sedan `.filter(p => p.age < 20)`; kommentaren säger “20+ must leave”, men ingen händelse, inboxrad eller liggarpost skapas. Se `src/domain/services/academyService.ts:116–145`.

**Rekommenderad fix:** skapa ett obligatoriskt sommarbeslut för 19-åringar: erbjud A-kontrakt, samarbetsklubb eller släpp. Skriv utfallet till eventLedger och visa det i årsboken.

### HIGH — utlåningens skalor och utvecklingsutfall är strukturellt fel

**Reproducerbarhet:** 1/1 lån plus kodbevis.

**Steg:**

1. Låna ut en U23-spelare i `4 omgångar`.
2. Läs direkt “omg kvar” och följ matchrapporterna.

**Förväntat:** fyra återstående omgångar och en konsekvent nämnare för möjliga matcher.
**Faktiskt:** direkt efter valet visades `8 omg kvar`; senare `5 omg kvar · 1/4 matcher`.

**Kodorsaker:**

- Skrivaren använder fixture-`matchday` för start/slut (`academyActions.ts:419–434`), medan AkademiTab räknar nuvarande läge med `roundNumber` (`AkademiTab.tsx:65–67, 331–341`). Det ger den observerade 4→8-dubblingen.
- `totalMatches` sätts till antalet **omgångar**, men lånematch simuleras bara varannan matchday. På fyra omgångar kan högst två matcher registreras. Tröskeln `matchesPlayed / totalMatches >= 0.75` kan därför aldrig nås; bästa utvecklingsutfallet är matematiskt omöjligt. Se `academyActions.ts:428–435` och `transferProcessor.ts:302–386`.

**Rekommenderad fix:** välj en kanonisk matchday-skala överallt. Separera `durationMatchdays` från `scheduledLoanMatches`, eller beräkna `totalMatches` från de faktiska rapporttillfällena. Testa 2/4/6/8-alternativen genom hela returen.

### HIGH — bussavtalet lovar en framtida effekt som inte sparas och kan erbjudas igen

**Reproducerbarhet:** samma event två gånger under säsong två efter accepterat treårsavtal.

**Steg:**

1. Få `Bussbolaget ringde`.
2. Välj `Skriv nytt avtal (−5k nu, billigare sen)`.
3. Fortsätt samma säsong.

**Förväntat:** en sparad treårsperiod, mätbart lägre resekostnad och spärr mot nytt identiskt erbjudande.
**Faktiskt:** exakt samma event kom igen i omgång 8. Jag kunde inte se någon framtida rabatt.

**Kodbevis:** bussvalet har bara en generell `finance: -5000`-effekt. Till skillnad från kioskavtalet finns inget kontraktsfält eller resolverfall som sparar bindning/rabatt. Se `eventFactories.ts:677–686` jämfört med `eventResolver.ts:1550–1560`.

**Rekommenderad fix:** lägg ett explicit bus contract-state med slut­säsong, kostnadsmodifierare och semantic key/cooldown. Texten ska härledas från den effekten, inte lova den fristående.

### HIGH — årsboken saknar säsongens verkliga beslut trots liggaren

**Reproducerbarhet:** säsong tre; liknande fallback förekom tidigare i serien.

**Steg:**

1. Börja säsongen på −365 tkr.
2. Ta kommunlån +300 tkr i ett kritiskt ekonomievent.
3. Ta flera namngivna person-/kontraktsbeslut.
4. Läs årsboken.

**Förväntat:** kommunlånet eller ett annat dyrt, konsekvensbärande val väljs och återges med kostnad.
**Faktiskt:** `Inget beslut stack ut i vintras.`

**Kodorsak:** liggaren är generell men säsongsbeslutsmeningarna är fortfarande en sluten byggarmängd. Filens egen dokumentation säger att val utanför de mallade `(event.type, choiceId)`-paren inte kan bli kandidater; se `seasonDecisionCaptureService.ts:1–25`. Kommunlånet saknar alltså konsumtionsväg till årsbokens beslutsrad.

**Rekommenderad fix:** gör inte fler handskrivna specialbyggare som långsiktig modell. Låt alla player-made ledger decisions bära en strukturerad neutral sats: handling, subject, omedelbar kostnad och varaktig skuld. Specialskriven prosa kan läggas ovanpå, inte vara inträdesbiljetten.

### HIGH — styrelsens ord motsäger varandra

**Reproducerbarhet:** flera gånger över säsong 1–3.

**Observerat:**

- Efter fem raka förluster sa portalen “Ordföranden frågade hur jag mår. Han menade laget”, samtidigt som status var `Stabilt — Styrelsen har inget att invända`.
- År ett sa årsboken att 11:e plats var “långt ifrån styrelsens mål att undvika nedflyttning”.
- År två sa samma 11:e plats att “Styrelsen fick mer än de bad om” och “uppfyller kravet att finnas kvar”, trots synligt `Undvik nedflyttning`/missat uppdrag under säsongen.
- År tre gav nia en rimlig positiv dom, medan portalen fortfarande visade `Ultimatum`.

**Förväntat:** samma frusna säsongskrav och samma förtroendetillstånd ska bära portal, uppdrag, årsbok och avsked.
**Sannolik kodorsak:** flera närliggande men olika sanningar exponeras samtidigt: `boardObjectives`, `boardPatience`-status, säsongsstartens `ClubExpectation` och berättelsebeats. Survive-undantaget gör motsägelsen särskilt synlig.

**Rekommenderad fix:** skapa ett enda player-facing `BoardRiskSnapshot` per omgång och ett fruset `SeasonBoardContract` till årsboken. Alla texter ska konsumera dem.

### MEDIUM — sponsorsökning är aktiv utan pengar och visar fel felmeddelande

**Reproducerbarhet:** 1/1 vid −365 tkr.

**Steg:** öppna Ekonomi och tryck `Ragga sponsor — 2,5 tkr` med negativ kassa.

**Förväntat:** avstängd knapp eller `Inte tillräckligt med pengar`.
**Faktiskt:** knappen är aktiv; inget meningsfullt resultat syntes. UI-koden ersätter dessutom alla misslyckanden med `Ingen intresserad just nu. (2,5 tkr avdraget)`.

**Kodorsak:** action returnerar rätt kassafel utan avdrag (`transferActions.ts:428–435`), men `EkonomiTab.tsx:395–403` ignorerar `result.error` och påstår både otur och debitering.

**Rekommenderad fix:** disable med synlig anledning, och rendera `result.error` ordagrant när action avvisar innan kostnaden dras.

### MEDIUM — uppflyttningsberedskap är mest kosmetisk

**Reproducerbarhet:** 1/1 testad tidig uppflyttning.

**Steg:** kalla upp Patrik Berglund från gruppen `Utvecklas`, inte `Redo för uppkallning`.

**Förväntat:** antingen en tydlig kostnad/risk och “tidigt”, eller blockerad handling.
**Faktiskt:** knappen finns på hela `Utvecklas`-gruppen och bekräftelsen blev `Perfekt tajming!`.

**Kodorsak:** både `readyPlayers` och alla med CA ≥20 får `canPromote: true`; timing räknas som “good” för det mycket breda intervallet som varken är `<25/confidence<40` eller `>35/confidence>70/age>=17`. Se `AkademiTab.tsx:48–50, 104–132` och `academyActions.ts:210–217`.

**Rekommenderad fix:** låt readiness och timing använda samma domänfunktion. Visa den konkreta kostnaden för tidig uppflyttning före valet och skriv den till liggaren.

### MEDIUM — årsbokens omgångsnummer motsäger sin egen brödtext

**Reproducerbarhet:** flera rader i säsong tre.

**Observerat:** kort märkt `O5` hade brödtext `Omgång 1`; `O6` sade `Omgång 2`; `O10` sade `Omgång 6`; `O18` sade `Omgång 14`.

**Sannolik kodorsak:** kortets badge använder kalenderns `matchday`, medan matchmomentets brödtext använder tävlingsmedveten ligaetikett. Cupveckor skapar fyra stegs förskjutning. `seasonSummaryService.ts:165–183` sparar båda semantikerna i samma moment.

**Rekommenderad fix:** visa `Omgång N` från samma `roundLabel` på båda platser, eller märk badgen `Vecka N` om matchday faktiskt är avsikten.

### MEDIUM — minnet är durabelt men för brusigt och anonymt

**Reproducerbarhet:** genom hela karriärhistoriken.

**Observerat:** flera `Mål nummer 10/25`, `första A-lagsmål`, `Hattrick mot motståndet` och sponsorreaktioner saknar spelarnamn/motståndare. Derbyhändelser dubblerades, inklusive tre likartade derbyförlustrader i en årsbok. `Låt honom plugga` visades som anonymt löst val på många eftermatchskärmar. P19-landslagssamlingen återkom med samma upplägg nästa år utan att känna till den förra.

**Förväntat:** en liggare ska inte bara lagra mer; den ska kunna svara vem, mot vem, om detta hänt förr och om raden redan representerats.

**Rekommenderad fix:** kräva subject/opponent för person- och matchminnen, semantic-key-dedup över alla presentationskällor och en recency/repeat-policy som uttryckligen kan skriva “igen”. Rensa resolved-choice-presentationen när dess event inte längre är den aktuella kontexten.

### LOW — ekonomisk information blandar aktuellt och hypotetiskt

**Observerat:**

- `Föreningslotteriet — Ej startad` visar ändå `Nästa omg: +813 kr`, formulerat som om intäkten redan fanns.
- `Bandyskola för barn` och `Bandyskola` är två olika produkter med motsatt ekonomi men nästan samma namn.
- Bandykiosken lovades som löpande intäkt men visade senare `Nästa omg: −229 kr` utan att spelaren före starten fått se risken.
- Anläggningskostnad och finansieringskrav blev tydliga först efter att noden valts; Värmestugan blockerades korrekt på 72 tkr egen kassa.

**Rekommenderad fix:** märk ej startade aktiviteter `Om du startar: …`, skilj produktnamnen och visa intervall/risk före köp. Visa nodens egen kostnad och minsta egeninsats direkt i trädet.

## Sådant som fungerade bra

- **Ekonomin bet nu.** Jag tackade nej till tifo och fika på grund av läget, kunde inte bygga Värmestugan och mindes ismaskinen samt kommunlånet efteråt.
- **Licenssystemet har ett långsamt minne.** Två underskottsår gav formell varning och handlingsplan; koden bevisar 20→40→60→80-rampen och licensnekan efter fyra negativa bokslut. Tre år räckte inte till slutpunkten, vilket är “inträffade inte”, inte “kan inte inträffa”.
- **Mecenatens nedåtkedja fungerade.** Stefan Lindberg kom in, community föll och han lämnade; ett år senare kom ett begripligt eko om att grundpelaren saknades.
- **Burnout är den starkaste bevisade bågen.** Första markeringen, återfallet över säsongsgränsen (`Samma sak som förra gången…`) och det irreversibla valet att kliva tillbaka byggde på varandra. Årsboken bar både lättnad och ärr.
- **Personkonsekvens kan återkomma precist.** Presskonferensen mindes att Robert Sjölund lämnat sitt jobb för heltidskontrakt och frågade om det betalat sig.
- **P19 har bra vardagsrytm.** Resultat i `SEDAN SIST`, utvecklingsdeltan, mentorer och tydliga namn gjorde att jag faktiskt brydde mig om Patrik, Johan och Oliver.
- **En svår klubb är inte deterministiskt hopplös.** Placeringarna blev 11–11–9 och tredje säsongen innehöll en reell kamp kring slutspelsstrecket.
- **Mobilflödet höll visuellt.** Efter onboardingblockern såg jag ingen overflow eller avklippta huvud-CTA:er under tre säsonger, cup, sommar, match, Granska, ekonomi och årsbok.
- **Spelets egen långsim behåller tillräckligt med struktur** för att ge tabell, ekonomi och årsbok utan att låsa spelaren i 22 manuella matcher.

## Människodomen: var det kul och sticky?

Ja, mer än systemen var för sig antyder. Jag ville fortsätta främst för att se om Patrik/Gunnar/Oliver blev något, om Gunilla skulle stanna och om styrelsen till slut skulle agera. Det är ett gott tecken: dragkraften kom från personer och relationer, inte från att optimera siffror.

Men spelet förlorar förtroende varje gång en investering försvinner (Johan), ett avtal inte betyder det texten lovar (bussen), eller årsboken hävdar att inget beslut fanns. Stickiness kräver inte fler system nu. Den kräver att de personer och löften som redan finns aldrig tappas mellan modellerna.

## Föreslagen regressionstest-suite

### Mobil E2E, 390×844

1. **Onboarding tap-map:** tryck på geometriska mitten av varje neder-CTA från namn till klubbval; verifiera rätt route och att feedbackknappen inte överlappar.
2. **Tre säsongers P19-aging:** en namngiven 18-åring med mentor måste efter 20-årsdagen finnas i A-lag, övergångsbeslut eller explicit departure-ledger—aldrig i ingetdera.
3. **Uppflyttning:** en spelare i `Utvecklas` ska ge samma timingklass och kostnad i preview, actionresultat, inbox och ledger.
4. **Lån 2/4/6/8:** omedelbar `omg kvar` ska matcha valet; rapportantal/nämnare ska ge nåbara 0.5- och 0.75-trösklar; retur och CA-effekt ska inträffa exakt en gång.
5. **Bussavtal:** acceptera, kontrollera −5 tkr, lägre framtida resekostnad, synlig löptid och inget nytt bussevent före förfall.
6. **Sponsorsökning utan kassa:** knappen disabled eller actionens exakta kassafel; ingen falsk debiteringsrad.

### Domän-/integrationstest

7. **Survive-konsekvensmatris:** 1/2/3/4 bottenår × hög/låg boardPatience × uppdrag träff/miss × ekonomi. Produktens avsedda avskedsrisk ska vara explicit, inte en absolut sidogate av misstag.
8. **Licensramp:** fyra raka minusår ger clear→warning→point deduction→denied; ett plusår ger exakt −18, med rätt inbox och årsboksrad.
9. **Board truth contract:** portalstatus, uppdragsrubrik, säsongsdom och firedReason måste läsa samma frusna förväntan i ett snapshot-test.
10. **Ledger completeness:** varje `madeByPlayer`-beslut med pengar, subject eller varaktig skuld måste kunna materialiseras neutralt i årsboken utan specialmall.
11. **Yearbook identity:** ingen personmilstolpe utan subjectName, ingen matchhändelse utan opponent, och inga två presentationer med samma semantic key.
12. **Tävlingsetikett:** cupveckor + ligaomgång ska ge samma synliga omgång i badge och brödtext.
13. **Resolved-choice lifetime:** ett skolval får synas i sin egen eftermatch men inte i nästa, om det inte uttryckligen är ett eko med person och tidsreferens.

### Långtest

14. **Fyra underskottsår med Survive-klubb:** spela till verklig licensnekan och GameOver; verifiera varningstid, poängavdrag, CTA:er och fortsättning efter avsked.
15. **Fyra akademisäsonger:** följ en 15-åring till uppflyttning/förlust och jämför vad spelaren minns med årsbokens val.
16. **Repeat-report:** maskinell rapport över duplicerade semantic keys, exakta textrepetitioner och event som lovar state men bara har `finance`/`noOp`.

## Vad testet inte bevisade

- Jag blev inte avskedad. Koden bevisar att sportsligt avsked inte kan ske i Survive-tier, men licensnekan och konkurs kan fortfarande ske.
- Jag nådde inte konkursgränsen `−2 000 tkr`; karriären slutade på −412 tkr.
- Jag byggde ingen anläggningsnod i denna karriär eftersom ekonomin aldrig bar minsta egeninsats. Avvecklingssheet/community −8 är därför inte omverifierad här.
- Jag fick inte ett sponsor-konfliktevent i just detta frö. Att det inte inträffade är inte bevis för att det saknas.

## Leverans-/CI-not

Det tidigare arbetet är committat och pushat genom `dc07f5ef`. Den senaste ordinarie `app-ci`-körningen på `8e9499e6` var dock fortfarande röd på visuella baselines (109 bildjämförelser, medan 22 scenes passerade). Den separata `visual-baselines`-körningen lyckades. Jag har inte kallat checkpointen “grön”, eftersom GitHub inte gör det.

Efter pushen tillkom ett separat ocommittat illustrationsarbete i arbetskopian. Det har lämnats helt orört och ingår inte i denna rapport.

## Åtgärdsstatus 2026-09-04

### Åtgärdat

- Feedbackknappen visas inte längre på start-, sparplats- eller onboardingrutterna. Mobilkontroll på 390×844 bekräftade fri och träffbar CTA, ingen horisontell overflow och inga konsolfel.
- `Survive` är inte längre absolut immunitet mot sportsligt avsked. Tre raka misslyckade säsonger tillsammans med `boardPatience <= 15` kan nu avsluta uppdraget; övriga förväntningsnivåer behåller tidigare regel.
- Lån använder en enda matchday-skala. Rapporter kan komma under samtliga lånedagar, slutrapporten registreras före retur och 75-procentsutfallet är nåbart.
- Akademins uppflyttningskort och resolver använder samma readiness-/timingfunktion; en spelare i `Utvecklas` kan inte längre ge "perfekt tajming".
- Bussavtalet sparas i tre säsonger, kostar enligt den låsta specifikationen och spärrar identiska erbjudanden under löptiden.
- Kommunlånet bär sin treåriga kostnad genom ekonomin och kan nu väljas som ett irreversibelt beslut i årsboken.
- Sponsorsökning spärras när 2,5 tkr saknas och visar actionens verkliga fel i stället för en falsk debiteringsrad.
- Årsbokens synliga omgångsbadge använder samma tävlingsmedvetna etikett som brödtexten.
- Skolkonflikten begränsas till en gång per namngiven P19-spelare och säsong. Personmilstolpar utan upplösbart namn utelämnas; namngivna milstolpar visar spelaren.
- Ekonomirader för ej startade ortsaktiviteter markeras som hypotetiska. De två snarlika bandyskoleprodukterna skiljs åt i UI.

### Kvar — kräver produkt-/textbeslut, inte en mekanisk bryggfix

- **P19 vid 20 år:** den säkra lösningen är ett obligatoriskt sommarbeslut med riktiga utfall och spelartext. Att bara behålla eller auto-flytta spelaren skulle dölja rotorsaken och göra valet falskt.
- **Styrelsens samlade språk:** själva konsekvensgapet för `Survive` är stängt, men portal, uppdrag, årsbok och varning bör fortfarande konsumera ett gemensamt `BoardRiskSnapshot`/`SeasonBoardContract`. Det är en tvärgående produktmodell och flera låsta texter, inte en lokal strängfix.
- **Minnets globala prioritering/dedup:** personidentitet och skolkonfliktens upprepning är förbättrade. En generell semantic-key-policy för derbyrader och alla presentationskällor är större liggararbete och lämnas separat.

### Verifiering

- Riktade regressionstester för samtliga ändrade system: gröna.
- TypeScript-kontroll: grön.
- Produktionsbuild inklusive design-, innehålls- och konsekvensgrindar: grön.
- Full testsvit: 446 testfiler och 4306 tester gröna.
