# INT-1 — B1:s stora bågar i långkarriär

**Datum:** 2026-09-10  
**Live-build:** `ab667cc`  
**Viewport:** 390 × 844  
**Testform:** riktig mobilgenomspelning i liveappen, kompletterad med kodläsning mot aktuell `main`.  
**Karriärer:** Västanfors 2034/35 (nionde säsongen), avslutad Målilla-karriär (fyra säsonger) med fortsatt tränarmarknad till Lesjöfors samt Heros 2028/29 som ekonomiskt motprov.

## Slutsats

B1-bågen känns nu **sammanhängande, men har en viktig glugg**. Spelet kan bära en lång karriär från sommarlöfte via anläggningsbygge och årsbok till avsked, två år utan spelaren, tränarmarknad och ny klubb. Världen och den egna historien följer med på ett sätt som känns som en karriär, inte separata saves.

Gluggen ligger i anläggningslöftet: Västanfors fick två år i rad välja ”Få Matchhall färdig” trots att Matchhallen ännu inte kunde öppnas. Årsboken dömde det första omöjliga löftet som misslyckat. Därmed fungerar minnet och återkopplingen, men de minns och bedömer ett mål som spelaren inte hade möjlighet att uppfylla.

## Det som fungerade

- Sommarens personliga löfte har en tydlig lång riktning och årsboken kontrollerar det senare. Tidigare löften om Värmestuga, Läktare östra och Belysning återgavs som uppfyllda med namn och utfall.
- Klubbens epoker går att läsa som en båge: fotfäste → etablering → storhetstid. Historiken är mer än tabellplaceringar.
- Avskedet är inte en återvändsgränd. ”Se hur det går utan dig” simulerade två säsonger, visade Målillas fortsättning och öppnade sedan tränarmarknaden.
- Tränarmarknaden gav två begripliga, världsförankrade erbjudanden: Lesjöfors och Skutskär, med placering och avskedad föregångare.
- Byte till Lesjöfors behöll den tidigare Målilla-karriären i Historik och startade en ny klubbvardag med ny ekonomi, nya styrelsemål och nytt anläggningsval.
- Med Lesjöfors på −430 tkr blev ”Vi väntar i år” ett begripligt och meningsfullt försäsongsval. Spelet tvingade inte fram ett bygge.
- Mobilflödet 390 × 844 höll ihop genom årsbok, historik, game over, tiden utan spelaren, tränarmarknaden, styrelsemötet och försäsongen.

## Fynd

### HIGH — omöjligt Matchhallsmål erbjuds och kan upprepas

**Observerat:** I Västanfors årsbok för 2033/34 stod: ”Du sa att få Matchhall färdig i somras. Det blev inte så.” Sommaren 2034 erbjöds samma mål igen. Efter att målet valts gick Matchhallen fortfarande inte att öppna i Klubb → Bygget. Bara tre vanliga noder var byggda; sex återstod.

**Reproduktion:**

1. Bygg Läktare östra, men lämna minst en annan vanlig anläggningsnod obyggd.
2. Gå till sommarens personliga säsongsmål.
3. Välj ”Få Matchhall färdig.”
4. Starta säsongen och öppna Klubb → Bygget.
5. Försök öppna Matchhallen; raden är inaktiv och hallprövningen kan inte starta.
6. Avsluta säsongen; årsboken registrerar målet som misslyckat.

**Förväntat:** Ett anläggningsmål ska bara erbjudas om spelaren faktiskt kan starta eller slutföra det under den kommande säsongen.

**Faktiskt:** Matchhallen klassas som tillgänglig för målgeneratorn efter sitt enda nodberoende, medan den verkliga hallprocessen kräver att hela det vanliga trädet är färdigbyggt.

**Kodorsak:** `getFacilityGoalOffer` i `src/domain/services/seasonGoalService.ts` tar första `available` från `getFacilityNodeViews`. Den vyn använder nodens `requires`, vilket gör Matchhallen `available` efter Läktare östra. `shouldStartHallTrial` i `src/domain/services/events/hallProcessService.ts` kräver däremot `isFacilityTreeFull`. Två olika tillgänglighetsbegrepp används för samma löfte.

**Rekommenderad fix:** Låt säsongsmålet använda den kanoniska bygg-/hallprocessens verkliga startbarhet. Matchhallen får inte väljas som vanligt nodmål; erbjud den först när hallprövningen eller ett verkligt hallbygge har nått ett stadium som kan slutföras. Lås detta med ett test där Läktare östra är byggd men övriga trädet inte är fullt, samt ett positivt test för ett aktivt genomförbart projekt.

### MEDIUM — första styrelsemötet i den nya klubben säger ”Andra året”

**Observerat:** Direkt efter att ha tagit över Lesjöfors visades state A-copy med rubriken ”Andra året.” och formuleringar om att första året redan låg bakom managern. Det var första dagen i klubben.

**Reproduktion:**

1. Bli avskedad efter flera säsonger.
2. Välj ”Se hur det går utan dig” och fortsätt till tränarmarknaden.
3. Ta över en ny klubb.
4. Läs det första styrelsemötet.

**Förväntat:** Mötet erkänner att managern är ny i klubben, samtidigt som karriären i världen redan har en historia.

**Faktiskt:** Generisk andraårs-copy visas.

**Kodorsak:** `switchManagedClub` i `src/application/useCases/switchManagedClub.ts` gör rätt och sätter `managerProfile.seasonsAtClub` till 1. `resolveBoardMeetingState` i `src/application/services/boardMeetingStateResolver.ts` väljer däremot A när den nya klubben saknar föregående målresultat. Hela `BOARD_MEETING_COPY.A` i `src/domain/data/boardMeetingCopy.ts` är skriven för andra året i samma klubb. Modellen saknar ett eget tillstånd för första mötet efter ett klubbbyte.

**Rekommenderad fix:** Lägg inte in en bryggtext i A-poolen. Inför ett explicit, sanningsförankrat mötestillstånd för ny klubb mitt i karriären, härlett från `seasonsAtClub === 1` och tidigare avslutad `clubSpell`. Design/text behöver låsa poolen; Code kan därefter bygga resolvergrenen och testerna.

### LOW — inaktiv Matchhall visar en falsk chevron

**Observerat:** Matchhallens undertext visade ”Öppnar prövningen — förankring krävs ›”, men raden var inte klickbar.

**Kodorsak:** `HALLNODE_SUBS.vilande` i `src/domain/data/hallProvningData.ts` innehåller redan `›`. `FacilityTree.tsx` lägger dessutom bara interaktion och sin egen chevron när `hallTrialActive` är sant. Den hårdkodade chevronen lovar därför navigation i det inaktiva läget.

**Rekommenderad fix:** Ta bort chevronen ur datatexten och låt komponenten ensam rendera den när raden faktiskt är klickbar. Detta kan följa samma kodpass som Matchhallsmålet.

## Observationer som inte räcker till feldom

- ”Möjlig” beskriver nodens strukturella förkrav, inte spelarens betalningsförmåga. I Heros med −30 tkr gick finansieringssheeten att öppna, men alternativen var spärrade. I Lesjöfors med −430 tkr såg försäsongens sex byggalternativ valbara ut, samtidigt som väntaalternativet fanns. Det är en möjlig tydlighetsfråga, men testet bevisade inte att ett ogiltigt bygge gick att genomföra.
- Finansieringssheeten visade klubbkostnaden men inte den aktuella kassan i samma beslutsyta. Det ökade behovet av huvudräkning, men är ett designomdöme, inte en verifierad logikbugg.
- Västanfors ekonomidata kommer från en äldre, lång save som har passerat flera ekonomimodeller. Kassan 8,3 miljoner och tre byggda noders relativa kostnad får därför inte användas som kalibreringsbevis för dagens ekonomi.

## SÅG kontra KODEN PÅSTÅR

**Sett i appen:** uppfyllda och misslyckade bygglöften i årsboken; ett upprepat omöjligt Matchhallsmål; inaktiv Matchhall med chevron; fyraårigt avsked följt av två simulerade säsonger; två faktiska jobberbjudanden; karriärbyte till Lesjöfors; missvisande ”Andra året”-möte; bevarad historik.

**Bekräftat i kod:** målgeneratorn och hallprocessen använder olika tillgänglighetsvillkor; Matchhallskortet är medvetet oklickbart utan aktiv prövning; klubbbytet nollställer klubbår korrekt; mötesresolvern saknar särskilt klubbbytesläge.

**Inte inträffat, men inte visat omöjligt:** färdig hallprövning, fullt anläggningsträd och senare avveckling testades inte i detta pass. Dagens ekonomimodell kalibrerades inte från noll.

## Code-åtgärd 2026-09-10 — Matchhallsmålet

- Verifierat mot `f40cc862` och filhistoriken: strukturell nodstatus användes som startbarhet. Fixen återanvänder `getPreSeasonChoices` för vanliga byggmål. En oprövad hall blir inte ett färdigställandemål, inte ens när det vanliga trädet är fullt; först ett verkligt `activeProject` för hallen ger det befintliga målet. Ingen ny hallmekanism eller textpool.
- Två negativa regressionstester var röda före fix: tre byggda anläggningsnoder gav felaktigt Matchhall före Kiosk, och fullt vanligt träd gav ett hallmål utan bygge. Båda gröna efter fix. Positiva tester bevarar mål för pågående Matchhall/Belysning.
- Falska chevronen borttagen från `HALLNODE_SUBS.vilande`. `FacilityTree` äger fortsatt den riktiga pilen och klickbarhetsvillkoret. Inga nya UI-stilar.
- 76/76 fokustester gröna (säsongsmål, hallprövning och hallundertexter). `npm run build` inklusive TypeScript och fem grindar grönt. Fullsvit: 552/552 filer, 5 006/5 006 tester, exit 0. Kod `d363ae0a`; B1-raden arkiverad, 33→32 öppna (ny separat sparningsblockering tillkom under passet).
- Browser, aktuell arbetskopia port 5176, 390 px: Byggets inaktiva Matchhall visas utan pil; Sommaren säsong 2 renderar målknapparna och fortsatt cupväg. De specifika hallförutsättningarna verifieras av testerna, inte av sommarfixturen.
- Tidigare misslyckade löften skrivs inte om retroaktivt. Detta pass korrigerar framtida målurval; klubbbytesmötets textfråga är en separat MASTER-rad.
