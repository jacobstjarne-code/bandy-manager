# Textdom — BETATEST_TEXTSVEP 2026-09-24

Källa: `docs/BETATEST_TEXTSVEP_2026-09-24.md`. Opus fällde domarna och skrev all slutlig prosa; Jacob gav textdom på C2.1, C2.2, C2.10, C2.11 och beslut på C6.4 och C2.22 (2026-09-24).

## Räkning och avvikelse mot svepet

Svepet anger "57 poster". Dess tabeller innehåller 46 numrerade ID:n och 3 sekundärnoteringar, totalt 49. Alla 49 är dömda nedan; ingen post är utelämnad. Siffran 57 har ingen motsvarighet i dokumentet.

| Dom | Antal |
|---|---|
| ÄNDRA | 31 |
| BEHÅLL | 11 |
| MEKANIK | 7 |
| DÖD/INAKTIV | 0 |
| VÄNTAR PÅ JACOB | 0 |

Tre påståenden i svepet visade sig fel vid anropsverifiering: `assistantFFStrings.ts`, `preMatchContextStrings.ts` och `academyBreakthroughQuote` har alla levande anropare. Ingen post blev därför DÖD/INAKTIV. Svepets uppgift att `traitGoals.ledare` utökats till 5 stämmer inte heller (fortfarande 3).

## Commits

- **K1 text och terminologi** (`5377451c`) — C1, C2 (utom C2.7–C2.9), C6, C7, C2.22.
- **K2 repetitionspooler** (`bbec4b96`) — `matchCommentary.ts` (C1.1, C4.6, C4.8, C4.9 och C5.1-poolen), `matchCore.ts` (C5.1-dirigeringen), `hallProvningData.ts` (C4.7-texten). C1.1 och C5.1 ligger här eftersom de delar fil med poolerna och en delad fil inte kan delas utan att bygget bryts mellan commits.
- **K3 mekanik och villkor** (`b9d524e1`) — förekomstindex, liggarmallarnas pooler (C2.7–C2.9, C4.1–C4.3), landslaget (C4.4–C4.5), hallprövningens spärr (C4.7), riktade tester.
- **K4 dokumentation** (`abe517b0`) — denna fil, STRINGS_POOL_INVENTORY, TEXT-AUDIT-PROTOKOLL.

Commit-id är de som landade på main via bundle och fast-forward (2026-09-24), i samma ordning som K1–K4.

## C1. Terminologi

**C1.1 — ÄNDRA (K2).** "Tackling" är hockeyspråk (TERMLISTA v2). Tre olika bandyord i stället för samma utbyte tre gånger:
- `${name} med en brytning ingen förstår. Domaren blåser. Solklart.`
- `Frustrationen kokar över. ${name} åker ut efter en onödig hakning.`
- `${name} med en fasthållning man inte trodde var hans. {minuter} minuter på bänken.`

**C1.2 — ÄNDRA (K1).** Fliken rymmer två funktioner, talangspaning och scoutrapporter. "Talangspaning" som fliknamn hade felnamngett halva innehållet. Fliken och tabIntro heter **Spaning** (samma ordfamilj som "Starta spaning", "spaningsrapport"), knappen **Gå till spaningen →**, statusraden **Scouten synar: {namn}** (samma verb som `featureIntroductions`). Interna id oförändrade. Adminvyns interna etikett och dev-skalet ej rörda.

## C7. Ordlista och presentationsspråk

**C7.1 — ÄNDRA (K1).** Se C1.2.

**C7.2 — ÄNDRA (K1).** 66 `.h-label`-källsträngar i 44 filer normaliserade till gemener (svepet räknade 14; alla med samma mönster togs). `.h-label` har `text-transform: uppercase` i `global.css` och ingen selektor nollar den för dessa element, så visningen är oförändrad. Skärmläsare får vanliga ord i stället för förkortningsliknande versaler.

**C7.3 — ÄNDRA (K1).** Ett schema på båda ytorna: **mål · ass · ★**. Spelarkortet: `14 mål` `9 ass` `7,2 ★`. Truppen: `22 matcher · 14 mål · 9 ass · 7,2 ★ · 1 utv` (singular `1 match`). "A" betyder inte längre assist någonstans, så krocken med positionskoden A (anfallare) är borta. "ass" är den etablerade svenska sportförkortningen.

**C7.4 — BEHÅLL.** Icke-fynd (hörna/frislag/straffslag konsekvent).

**C7.5 — BEHÅLL.** Icke-fynd ("F. Efternamn" konsekvent).

## C6. Rollord

**C6.1 — ÄNDRA (K1).** Poolen är levande (svepet sa död). Assistenten heter sitt efternamn, `{coach}` står alltid först i sin mening så reservordet "Assistenten" (sparfiler utan assistent) blir grammatiskt, och genitiven går via `swedishGenitive` (Holmgrens, Mattias). De tre fristående "Han"-raderna var tvetydiga, och två av dem sade att assistenten själv "lyfte den över muren" och "tog det själv". Hela poolen:

- hörna nära: `{coach} vinkade in den kort. Nära stolpen.` · `Kort hörna vid närmaste. {coach}s beslut.` · `{coach} tog den nära och trängde ihop det vid första stolpen.`
- hörna mitt: `En perfekt passning mot mitten. Skytten stod klar.` · `Rakt ut till linjen. {coach} litade på skytten.` · `{coach} la den mot mitten. Direktskott eller inget.`
- hörna bortre: `{coach} sökte bortre stolpen.` · `Långt ut mot bortre. {coach}s val.` · `{coach} la den på bortre och sökte den fria mannen där ute.`
- kontring fart: `{coach} släppte iväg honom. Bara att åka.` · `Full fart framåt. {coach} släppte loss honom.` · `{coach} sa åt dem att dra. Rakt på mål.`
- kontring bygg: `{coach} höll igen och byggde upp den lugnt.` · `Ingen brådska. {coach} ville ha ordning först.` · `{coach} bromsade kontringen och sökte rätt läge i stället.`
- kontring tidig boll: `{coach} ville ha den tidigt, innan de hann hem.` · `Tidig boll framåt. {coach} läste luckan.` · `Direkt bakom deras försvar. {coach}s idé.`
- frislag skott: `{coach} vinkade fram skytten. Direkt mot mål.` · `Skott. {coach} litade på klubban.` · `Rakt på, inget krångel. {coach}s val.`
- frislag lyft: `{coach} ville ha den över muren.` · `Boll bakom muren. {coach} sökte en klubba där inne.` · `Mjukt lyft. {coach} sökte någon på bortre.`
- frislag kort: `{coach} ville ha den kort för att bygga vidare.` · `Kort variant. {coach} ville ha ett bättre läge.` · `I sidled för en ny vinkel mot mål. {coach}s beslut.`

**C6.2 — ÄNDRA (K1).** `✓ Följ {swedishGenitive(coach.name)} råd`. Hela namnet, samma form som varför-raden ovanför.

**C6.3 — ÄNDRA (K1), minnesraden BEHÅLLS.** Knappen: `Låt {namn} ta pressen` (reserv "assistenten"). Årsbokens minnesrad `Du lät assistenten ta pressen.` behålls: den renderas i efterhand och liggaren sparar inte vem som var assistent då. Ett nuvarande namn där kunde bli osant efter ett tränarbyte.

**C6.4 — BEHÅLL.** Jacob 2026-09-24: den låsta texten `Assistenten satte laget` står kvar.

**C6.5 — ÄNDRA (K1).** Takkortet: `{namn} säger samma sak…`, `{namn} väntar på om du gör samma val en gång till.`, `{namn} har sagt det rakt ut: …`, `{namn} tar rodret, …`. Reserv "Assistenten". Namnet trådas från `eventProcessor` via `game.assistantCoach?.name`.

## C2. AI-fyndighet

**C2.1 — ÄNDRA (K1, Jacobs text).** `Telefonen ringer varje gång jag ställer mig vid sargen. Jag hinner knappt följa arbetet på plan längre.`

**C2.2 — ÄNDRA (K1, efter Jacobs invändning).** `Jag har börjat räkna timmarna till nästa lediga kväll igen.` "Igen" är belagt: poolen visas bara när `isBurnoutRelapse` är sann.

**C2.3 — ÄNDRA (K1).** `Styrelsen väntar på svar, sponsorn också. Jag skjuter på båda.` Svepets "fem obesvarade mail" var en siffra koden inte bär.

**C2.4 — ÄNDRA (K1).** `Styrelsen förlängde. {manager} har kvar nycklarna till klubbstugan.`

**C2.5 — ÄNDRA (K1).** `Vi tänker inte hålla igen i år. Vi vill se hur långt det här bär.` Svepets transferbudgetlöfte var inte belagt i koden.

**C2.6 — ÄNDRA (K1).** `Folk har slutat prata om laget på Konsum. Det oroar mig mer än tabellen.`

**C2.7 — ÄNDRA (K3).** `Laget har blivit något orten pratar om som sitt eget. Folk som aldrig gått på bandy vet vem som står i mål.` Svepets generationsbild förutsätter en tidsrymd som legacy-eran inte garanterar.

**C2.8 — ÄNDRA (K3).** `Läktaren stod kvar efter slutsignalen. Den kvällen pratas det om i kafferummet länge.`

**C2.9 — ÄNDRA (K3).** Löst i C4.1-poolen; paradoxen finns inte kvar.

**C2.10 — ÄNDRA (K1, efter Jacobs invändning).** `…Ingen match den här säsongen har betytt lika mycket.` "Vägt" kunde läsas som jämnhet.

**C2.11 — ÄNDRA (K1, Jacobs riktning).** `Kaffet i kiosken smakar bättre när resultaten går vår väg.`

**C2.12 — ÄNDRA (K1).** `Tolv lag började serien i höstas. Två är kvar.`

**C2.13 — ÄNDRA (K1).** `Han tackar för intresset. Tröjan han vill ha har en annan färg.` Svepets "två år" var obelagt.

**C2.14 — ÄNDRA (K1).** `Klubben är äldre än din morfar. Den har klarat sämre tränare än dig.`

**C2.15 — ÄNDRA (K1).** `…Kontoret i centrum ligger en trappa upp, utan skylt. Hon vill inte att hyresgästerna ska se vad hon tjänar.`

**C2.16 — ÄNDRA (K1).** `…Ortens nav. Stänger han får folk åka till stan för att hämta ett paket.` Anknyter till postombudet i samma mening.

**C2.17 — ÄNDRA (K1).** `…står det i beslutet. Mer än så står det inte.`

**C2.18 — ÄNDRA (K1).** Hedgen struken och påståendet sanningsjusterat: `Ett förlustår till kan kosta poäng.` Licensen styrs av en riskpoäng (`licenseService`), inte av exakt nästa förlustår, så det gamla "kommer kosta" lovade mer än koden håller.

**C2.19 — BEHÅLL.** Byråkratiskt brevspråk där konstruktionen är trovärdig.

**C2.20 — BEHÅLL.** Trovärdigt talspråk i ett avskedscitat.

**C2.21 — BEHÅLL.** Systemtränarens medvetna röst.

**C2.22 — ÄNDRA (K1, Jacob 2026-09-24: "kör").** Personligheten behålls som den eftertänksamma assistenten, men aforismerna är utbytta mot konkreta iakttagelser (isen, halvleken, bussen, träningen). 63 rader i `assistantCoachService.ts` och `finalIntroScene.ts`; rader som redan var konkreta ("Det där var inte vi. Vi hittar tillbaka.", "Vi höjde oss…") står kvar. Urval:
- `Galenskap är att göra samma sak…` → `Samma hörna en gång till ger samma svar. Prova något annat.`
- `Straffens enkelhet är dess svårighet.` → `Tolv meter och en målvakt. Enklare blir det inte, och ändå missar folk.`
- `Taktik är en hypotes. Nu testar vi den.` → `Vi provar det här en kvart och ser vad isen säger.`
- `Oavgjort är ingen destination — det är en övergång.` → `Oavgjort nu. En boll kan ändra det åt båda hållen.`
- `Missnöje gror i tystnad — …` → `${n} säger inte mycket, men han sätter sig längst bak i bussen.`
- `Man vinner inte en final. Man förtjänar den…` → `Ingen ger bort en final. Vi får ta den.`
- `Serier belönar tålamod. Slutspel belönar mod.…` → `Tabellen spelar ingen roll längre. Nu är det de här matcherna.`

Grammatikfel rättat i samma pass: `Störs det inte.` → `Stör honom inte.` Oanvänd import borttagen.

## C3. Bisatser som egna meningar

**C3.1 — BEHÅLL.** **C3.2 — BEHÅLL.** "Som X." förekommer 11 gånger i 8 filer (bl.a. `NameInputScreen`, `anticipationKafferumText`, `narrativePushCopyResolver`) och är husstil. Två isolerade normaliseringar hade gjort helheten mindre konsekvent.

## C4. Upprepning

**C4.1 — MEKANIK (K3).** `ledgerOccurrenceIndex` räknar föregående liggarposter av samma typ; värdet trådas in som `ctx.occurrence` vid alla tre renderingsställen (`clubMemoryService`, `seasonSummaryService`, `ClubMemoryView`). Värvning, 5 varianter:
1. `Ett namn på ett papper i klubbstugan. Om det var rätt namn vet vi först framåt vårkanten.`
2. `Tröjan hängde i skåpet innan bläcket torkat. Resten får han visa på isen.`
3. `Vaktmästaren fick sätta en ny namnlapp på skåpet. Läktaren lär sig namnet fort om han gör mål.`
4. `En handskakning i klubbstugan, en tröja ur förrådet. Första träningen säger mer än kontraktet.`
5. `Kontraktet är påskrivet. Om han passar in avgörs i omklädningsrummet.`

Försäljning, 4: originalet `Pengarna räknades på en gång. Det som saknas räknas i mars.` samt `Skåpet står tomt till nästa träning. Kassan fick sitt, laget får klara sig utan.` · `Han tömde skåpet på en eftermiddag. Pengarna syns i kassan redan i veckan.` · `Affären gick fort. Luckan efter honom syns först när någon annan ska göra hans jobb.` Motpartsprefixet (`Från X.` / `Till X.`) behålls.

**C4.2 — MEKANIK (K3).** Samma förekomstindex, i stället för dedupe: en domarrelation som korsar tröskeln igen är en ny händelse och ska synas, men inte ordagrant. Fejd: originalet (tankstrecket ersatt med kommatecken) samt `Det har blivit för många protester mot honom. Nu hörs varje ord från bänken, och han glömmer inget av dem.` · `Han hälsar inte längre på bänken före avslag. Tveksamma lägen går åt andra hållet, och läktaren har börjat märka det.` Förtroende: originalet samt `Inga protester på länge, och han har märkt det. Bänken får en förklaring när den frågar.` · `Han nickar mot bänken före avslag nu. Det avgör ingen match, men ibland en tveksam situation.` Ingen rad säger "igen".

**C4.3 — MEKANIK (K3).** Mecenat lämnar: originalet samt `Ett samtal till ordföranden, sen var det klart. Kassören satt kvar länge med budgeten den kvällen.` · `Platsen längst upp på läktaren står tom nu. Någon annan får ringa runt nästa gång det knakar.` Patron kliver fram: originalet samt `Det började med en fråga till kassören om vad en säsong kostar. Svaret skrämde inte.` · `Någon på orten har bestämt sig för att klubben ska klara vintern. Det syns inte i tabellen. Det syns i kassaboken.` Patron drar sig tillbaka: originalet samt `Beskedet kom i ett brev till styrelsen. Ingen läste upp det högt på mötet.` · `Den som alltid fanns där när budgeten inte gick ihop finns inte där längre. Nästa gång får klubben lösa det själv.`

**C4.4 — MEKANIK (K3).** Minnesraden väljs på postens förekomst bland karriärens uttagningar, inte på `season % 2`. `{spelare}s` går via `fillTemplate`/`swedishGenitive` (förut naiv `.replace`, som gav "Nyberg-Forss"). Tredje raden: `{spelare} fick förbundskaptenens samtal för första gången. Kafferummet visste det före lunch.` "Första" är belagt: posten skrivs bara när `!p.nationalTeamCallups`.

**C4.5 — MEKANIK (K3).** Nycklat på `säsong + sorterade spelar-id` via `stringHashUnsigned`. Tredje raden: `Förbundet har skickat truppen. {spelare} står med.` / `…{spelare_lista} står med.`

**C4.6 — ÄNDRA (K2).** `cup_goalOpener` 1 → 4. Originalet påstod att öppningsmålet "ofta kommer tidigt", men poolen spelas oavsett minut.
- `{player} öppnar målskyttet. {score}.`
- `Första målet i cupmatchen. {player}. {score}.`
- `{player} bryter nollan. {score}. Nu måste det andra laget öppna upp.`
- `Nollan är borta. {player} med {score}.`

**C4.7 — MEKANIK (K2 text, K3 spärr).** Klackpoolerna 1 → 3:
- krav: `Birger räknar huvuden på läktaren före avslag. Siffran skriver han på baksidan av programmet.` · `Klacken tar med grannarna nu. Varje person på läktaren ska synas i papperen till förbundet.`
- förhandling: `Klacken har målat en banderoll till kommunen. Den hänger rakt framför hedersplatserna.` · `Klacken sjunger om hallen nu, inte bara om laget. Det rimmar dåligt. Ingen bryr sig.`

`pickHallAmbientLine` behåller gate och seed men räknar fram föregående visade rad tillståndslöst och flyttar valet ett steg vid träff. Ingen ny sparfilsdata. De nya raderna undviker "Västra Sidan", eftersom namnet är hårdkodat för alla klubbar (egen fråga, se nedan).

**C4.8 — ÄNDRA (K2).** `traitGoals` 3 → 6 för hungrig, joker, veteran och lokal. Befintliga rader orörda. Nya:
- hungrig: `vill ha bollen varje gång. Den här gången lönade det sig.` · `åker på returen som om det vore det sista han gjorde. Mål.` · `firar kort och åker tillbaka mot mitten. Han vill ha ett till.`
- joker: `slår den från en vinkel ingen annan hade provat. Den går in.` · `Alla väntar på passningen. ${name} skjuter. Mål.` · `åker förbi två och sätter den i bortre. Ingen på bänken såg det komma.`
- veteran: `står rätt, som han brukar. Bollen kommer, bollen går in.` · `Inget krångel. ${name} placerar den där målvakten inte når.` · `har sett den här situationen förut. Han skjuter innan backarna hunnit tänka.`
- lokal: `Mål av ${name}. Läktaren ropar förnamnet, inte efternamnet.` · `sätter den, och ropen från vallen kommer innan bollen stannat i nätet.` · `Ett av ortens egna namn på resultattavlan. ${name}.`

**C4.9 — ÄNDRA (K2).** `traitSuspensions` 3 → 6 för veteran, lokal och ledare:
- veteran: `kommer ett steg för sent in i duellen. Benen hann inte med. {minuter} minuter.` · `Domaren pekar mot båset. ${name} protesterar inte. Han visste det innan armen gick upp.` · `{minuter} minuter för ${name}. Han sätter sig i båset och tittar rakt fram.`
- lokal: `tar det personligt och får betala för det. {minuter} minuter.` · `Tyst på läktaren när ${name} åker mot båset. Det är deras kille.` · `säger ett ord för mycket till en motspelare. {minuter} minuter.`
- ledare: `Bindeln åker med till båset. ${name} har {minuter} minuter att tänka.` · `${name} ut. Någon annan får ta ordet på isen en stund.` · `sätter sig i båset utan ett ord till domaren. Laget har tappat sin röst på isen.`

## C5. Sanning

**C5.1 — MEKANIK (K2).** `referee_lenient` hade en enda konsument: raden direkt efter en registrerad utvisning. Poolen är omdöpt till `referee_lenient_after_suspension` och innehåller bara rader som bekräftar kortet i den generösa domarens röst:
- `Den här domaren släpper mycket. Den här släppte han inte.`
- `Han har låtit det mesta gå ikväll. Då måste det ha varit tydligt.`
- `Så här generös domare blåser inte i onödan.`

Testet låser att ingen rad i poolen förnekar utvisningen och att `matchCore` dirigerar utvisningsslotten dit.

## Sekundärnoteringar

**S1 `preMatchContextStrings.ts` — BEHÅLL.** Levande (`PreMatchContext.tsx`, `OpponentVignetteScene.tsx`). Svepet sa död; statusen är rättad i STRINGS_POOL_INVENTORY.

**S2 `assistantFFStrings.ts` — BEHÅLL som egen post.** Levande; texten hanteras i C6.1.

**S3 `academyBreakthroughQuote` — BEHÅLL.** Levande (`youthProcessor.ts`). Ingen åtgärd.

## Tester

`src/domain/data/__tests__/betatestTextdom.test.ts`, 20 tester:
- C5.1: pool och dirigering.
- C6: `{coach}`-placering, genitiv (Holmgrens/Mattias/Assistentens), inga råa `${` i burnout-korten, namnet på relief-knappen.
- C4.1–C4.3: tre poster av samma typ ger tre olika texter för alla sju mallarna; förekomstindex räknar per typ.
- C4.4–C4.5: genitiv, "första"-raderna, nyckling.
- C4.6–C4.9: poolstorlekar, tokens, ingen direkt upprepning i hallprövningen över 40 matchdagar × 3 säsonger, ingen "tackling".

`clubMemoryService.test.ts`: den låsta värvningstexten uppdaterad till variant 1.

## Sidofynd, inte åtgärdade (utanför svepet)

- `assistantCoachService` calm-förslaget `…är snabbare. Spring.` bryter termlistan (man åker på skridskor).
- `CONTRACT_OUTCOME.not_extended` och `licenseService` använder naiv genitiv (`{manager}s`, `{KLUBB}s`). Söderfors blir "Söderforss".
- `lokal_handlare` (mecenatService) har ett argumentpar kvar i samma pool som C2.16: "Det är inte en kliché, det är ett levande kundregister."
- "Västra Sidan" är hårdkodad klacknamn i `hallProvningData.ts` för alla tolv klubbar.
