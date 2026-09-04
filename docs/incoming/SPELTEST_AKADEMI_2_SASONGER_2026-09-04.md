# Speltest: akademi och spelarutveckling, två säsonger

**Buildetikett i appen:** `9238404e`  
**Testmiljö:** lokal app, 390×844 px, Hälleforsnäs, manager “Akademitest 2”  
**Spelad period:** 2026/27 och 2027/28, inklusive cup, 44 serieomgångar, ett kvartsfinalspel, två somrar och avsked efter säsong 2  
**Verifiering efter testet:** `npm run build` grönt. 9 riktade tester för lån och säsongsövergång gröna.

Viktig reproducerbarhetsnot: appens footer visade `9238404e`, men arbetskopian var inte ren och andra, huvudsakligen visuella/taktiska ändringar pågick parallellt. Akademifilerna bakom de flesta fynden var inte modifierade. Rapporten avser därför den faktiskt spelade lokala arbetskopian med denna HEAD, inte en påstått identisk Vercel-deploy.

## Kort dom

Akademin fungerar som **simuleringssystem**, men ännu inte som **spelberättelse**. Siffror rör sig, P19 spelar matcher, lån kan utveckla en spelare och en akademiuppgradering blir klar. Problemet är att spelaren nästan aldrig får ett sammanhängande före–efter: vem blev bättre på grund av vad, vem försvann, vad gav investeringen och vad blev kvar i klubbens historia?

Den mest kostsamma sanningen är därför inte att utvecklingen saknas. Den finns. Den är för dåligt attribuerad och för dåligt ihågkommen för att kännas som något jag byggt.

Två funktionella lånefel är dessutom tydliga och fullt reproducerbara: en utlånad spelare kan tas ut i laget, och ett lån som läggs före cupen kan förbrukas av ett enda kalenderhopp.

## Observerad karriär

- Akademin uppgraderades från **Grundverksamhet** till **Satsning** för 50 tkr. UI:t sade korrekt “klar säsong 2027”, och nivån var Satsning efter sommaren.
- Arvid Löfgren, 18 år, YH, styrka 11, tre stjärnor, fick Timo Martinsson som mentor. Efter sommaren var Arvid 19 år och styrka 16.
- Torsten Saarinen, 18 år, styrka 43, lånades ut fyra omgångar. Ett första lån före cupen avslutades efter en enda cupmatch. Ett nytt lån efter cupen räknade korrekt 4→3→2→1 över fyra raka ligamatcher.
- Torstens lånerapporter visade matcher, betyg och ett mål. Vid nästa säsongsstart var han styrka 54 och utsågs till bästa U21 i årsboken, men spelet förklarade inte hur mycket av lyftet som kom från lånet, ordinarie träning eller sommarutveckling.
- Gabriel Bengtsson, 19 år, MF, tre stjärnor, styrka 17 vid sista kontrollen, försvann helt under sommaren utan avsked, inboxrad eller historikspår.
- Efter sommaren fanns tre nya 15-åringar i P19. Årsboken hade inte berättat om kullen.
- Mentorskapet var borta efter sommaren. Samma par kunde tilldelas igen. Efter två säsonger sade Karriärhistorik → Blodslinje ändå **“Inga mentorband ännu”**.
- Säsong 1: 8:e plats, kvartsfinal. Säsong 2: 12:e plats och avsked. Ekonomin gick 340→60 tkr och därefter 60→−258 tkr.

## Prioriterade fynd

### HIGH 1 — Utlånad spelare kan väljas och starta matcher

**Reproduktion**

1. Låna ut Torsten Saarinen via Klubb → Akademi.
2. Gå till nästa match och öppna laguttagningen.
3. Ta bort en ordinarie startspelare.
4. Tryck på Saarinen.

**Förväntat:** en spelare som är på lån finns inte i den valbara matchtruppen.  
**Faktiskt:** Saarinen låg kvar i spelarlistan och kunde ersätta en startspelare; räknaren gick tillbaka till 11 av 11.

**Rotorsak:** `loanOutPlayer` sätter `isOnLoan` och tar bort id:t ur klubbens `squadPlayerIds`, men `useLineupEditor` bygger matchtruppen från `player.clubId === managedClubId` och kontrollerar varken `squadPlayerIds` eller `isOnLoan` (`src/presentation/hooks/useLineupEditor.ts:86–104`, `src/presentation/store/actions/academyActions.ts:430–436`).

**Rekommenderad rotfix:** skapa en kanonisk selektionsregel för matchtruppen, använd den i lineup, autofyll, carry-forward, taktiktavla och nöduppställning. Regeln ska kräva verkligt medlemskap i klubbens aktuella squad och `!isOnLoan`; lägg inte en lokal specialfiltrering bara i en komponent.

### HIGH 2 — Fyramatcherslån före cup tar slut efter en enda match

**Reproduktion**

1. Starta ny säsong före första cupmatchen (`currentMatchday = 0`).
2. Låna ut en spelare i fyra omgångar. UI visar “4 omg kvar”.
3. Spela cupmatchen på kalenderns matchdag 4.
4. Öppna Akademi.

**Förväntat:** tre låneomgångar återstår efter en spelad match.  
**Faktiskt:** lånet är avslutat och spelaren är åter lånebar.

**Rotorsak:** avtalet sparas som `endRound = currentMatchday + rounds`. Processorn får nästa verkliga fixturs matchday; hoppet 0→4 ger en rapport och uppfyller samtidigt `nextMatchday >= endRound` (`academyActions.ts:413–427`, `transferProcessor.ts:308–329`). Den gröna regressionen provar bara sammanhängande 1,2,3,4 respektive 10…17 och saknar hoppet 0→4.

**Rekommenderad rotfix:** modellera det spelaren köper: ett antal återstående behandlingstillfällen/lagmatcher. Minska `remainingRounds` en gång per processad klubbomgång, eller förankra kontraktet i en explicit lista kommande klubbfixturer. Absolut matchday ska vara auditmetadata, inte durationens sanning.

### HIGH 3 — Akademin utvecklar spelare men lämnar inget sammanhängande minne

**Reproduktion**

1. Tilldela mentor till en P19-spelare och låt relationen löpa en hel säsong.
2. Låna ut en ung A-lagsspelare och låt honom återvända stärkt.
3. Uppgradera akademin och passera sommaren.
4. Läs årsboken och Karriärhistorik → Blodslinje.

**Förväntat:** historiken visar mentorbandet, lånets resultat och akademisatsningen som en följd med personer och kostnad.  
**Faktiskt:** årsboken nämnde inget av detta; Blodslinje sade “Inga mentorband ännu” efter två säsonger.

**Rotorsaker:**

- Lånestart och låneretur skriver ingen `eventLedger`-post; returen blir bara en inboxrad (`transferProcessor.ts:370–382`).
- Akademiuppgraderingen skriver ekonomi men inget beständigt berättelsespår.
- Säsongsövergången tömmer aktiva mentorskap (`seasonEndProcessor.ts:2203`) men lämnar relationen öppen i historiken om junioren fortfarande är i P19 (`:2204–2211`).
- Blodslinje letar junioren enbart i `game.players`, inte i `youthTeam.players`, och kastar annars hela posten (`ClubMemoryView.tsx:53–68`).
- Årsbokens akademidel läser bara `youthIntakeHistory`, inte mentor-, lån- eller uppgraderingsdata (`seasonSummaryService.ts:754–766`).

**Rekommenderad rotfix:** gör akademins livscykelhändelser till förstaklassposter i liggaren: `academy_upgrade_started/completed`, `mentorship_started/ended/graduated`, `loan_started/returned`, `youth_aged_out`. Spara personnamn/identitet i ett hållbart subject-snapshot så att historiken inte beror på att spelaren fortfarande finns i en viss array. Låt årsbok och Blodslinje läsa dessa poster.

### HIGH 4 — 19-årig topptalang försvinner ljudlöst vid säsongsskiftet

**Reproduktion**

1. Följ Gabriel Bengtsson, 19 år, tre stjärnor, i P19 genom säsongen.
2. Kalla inte upp honom.
3. Passera sommaren.

**Förväntat:** ett uttryckligt utfall — uppflyttning, frisläppning/annan klubb eller åtminstone ett avsked med orsak.  
**Faktiskt:** spelaren finns inte längre i P19, A-lag, årsbok, inbox eller historik.

**Rotorsak:** `carryOverYouthTeam` åldrar först och filtrerar därefter bort alla som blir 20 med `.filter(p => p.age < 20)`. Ingen konsument fångar de bortfiltrerade spelarna (`academyService.ts:137–151`).

**Rekommenderad rotfix:** returnera både `retained` och `agedOut` från säsongsövergången. Ge varje aged-out-spelare ett verifierbart utfall och skriv det till inbox + ledger innan han tas bort ur den aktiva truppen.

### MEDIUM 1 — Sommaren nollställer readiness och motsäger sin egen modell

Efter sommaren stod David Leifsson, styrka 26, i gruppen “Utvecklas”, inte “Redo för uppkallning”. Koden kommenterar att redo-spelare ska behållas för managerbeslut men sätter samtidigt `readyForPromotion: false` och `roundsReadyForPromotion: 0` på alla (`academyService.ts:137–151`).

Det kan rätta till sig efter nästa P19-match, så jag klassar det inte som permanent blockerad uppflyttning. Men spelaren ser att klubben glömt readiness över sommaren.

**Fix:** bevara readiness eller räkna om den från samma kanoniska villkor vid rollover. Nollställ bara säsongsräknare som verkligen är säsongsbundna.

### MEDIUM 2 — Nya P19-kullen skapas men når inte årsboken

Satsningsnivån fyllde på laget med Hans Hård, Ludvig Carlsson och Ulf Ros. Ingen “ungdomskull” syntes i föregående årsbok. `carryOverYouthTeam` genererar spelarna direkt, medan årsboken bara räknar `youthIntakeHistory`.

**Fix:** skriv den ordinarie sommarkullen till samma kanoniska intake-post som andra rekryteringsvägar, med topprospekt och akademinivå som kontext.

### MEDIUM 3 — Effekten finns men går inte att attribuera

Arvid gick 11→16 och Torsten 43→54 över testperioden. Det är positivt, men mentorskap påverkar främst en dold `developmentRate`, lån ger en dold CA-bonus och ordinarie träning/sommarutveckling sker samtidigt. Akademikortet visar ett generiskt löfte — inte startvärde, tillskriven förändring eller utvecklingskurva.

**Fix:** visa ett kort före–efter på retur och vid sommar: “43→48, varav +4 från lånet”, “mentor sedan omg 0: utvecklingstakt X→Y”. Det behöver bygga på sparade deltan, inte försöka härleda dem i efterhand.

### MEDIUM 4 — Två nästan identiska arbetskamratshändelser staplades efter samma match

Efter Söderfors 6–6 kom två “Arbetskamrater på Flens Bygg”-kort samtidigt, först Hage–Sandström och sedan Sandström–Lindgren. Båda krävde samma enda svar. Par-id:n är unika, så dedupen betraktar dem som skilda, och post-advance-generatorn tillåter två händelser i samma omgång.

**Fix:** lägg en arbetsgivar-/temabudget per omgång eller slå ihop alla berörda spelare i ett arbetsplatsbeat.

### MEDIUM 5 — Årsboken duplicerade samma derbyförlust

Årsbok 2026/27 visade “💔 Derby-förlust mot Slottsbron” två gånger på O12, direkt efter varandra. Grundmatchögonblick och arcögonblick slås ihop utan dedup mellan `baseKeyMoments` och `arcMoments`; ledger-dedupen sker först för den tredje källan.

**Fix:** deduplicera hela sammanslagningen på fixture/semantic identity före sortering och cap, inte bara ledger-tillägget.

### MEDIUM 6 — Akademisatsningen blev ekonomiskt tung utan en tydlig bokslutsförklaring

Ekonomin gick 340→60 tkr år 1 och 60→−258 tkr år 2 trots flera sponsorer och ett mecenatavtal. Satsning kostar synligt 5 tkr/omgång, men årsboken visar bara totalen; den kopplar inte den långsiktiga investeringen till kostnad eller utfall. Jag kan därför inte slå fast att ekonomin är matematiskt fel i detta test, men akademin läses lätt som en svart kostnad.

**Fix:** ekonomibokslutet bör bryta ut akademins startkostnad, drift och årets mätbara utfall. En kritisk ekonomiväg ska dessutom hinna reagera innan −258 tkr om negativ kassa inte är avsedd normalstate.

## Det som fungerade bra

- Akademiuppgraderingen hade tydligt pris, krav, väntetid och korrekt nivå efter sommaren.
- Ett lån som startades efter cupen gav begriplig nedräkning 4→3→2→1 och konkreta matchrapporter med betyg/mål.
- P19-resultat syntes på Granska och tabellraden uppdaterades; ungdomslaget kändes som en pågående parallell säsong.
- Mentorvalet var snabbt att förstå och relationen var tydligt namngiven medan den var aktiv.
- Satsningsnivån gav en större kull med högre ingångsstyrka och varierad potential; systemet rör faktiskt på sig.
- Torsten blev senare bästa U21 i årsboken. Spelet kan alltså göra en ung spelare relevant i seniorlaget när han väl är tillbaka.
- Mobilvyn höll ihop utan horisontell overflow i de testade akademi-, lineup-, årsboks- och Game Over-ytorna. Game Over hade tre tydliga, vertikala CTA:er.

## Vad som inte inträffade kontra vad som inte kan inträffa

**Inträffade inte i denna seed, men kan finnas:**

- Ingen manuell P19-uppflyttning gjordes. Jag kontrollerade ingen ny akademivy efter första P19-matchen år 2; därför säger testet inte att uppflyttning är omöjlig.
- Ingen skolkonflikt eller bandyskolepartner dök upp.
- Ingen akademispelare gjorde en observerad A-lagsdebut via den manuella uppflyttningsvägen.
- Inget lån löpte över ett säsongsskifte.

**Kan inte ge det utfall UI:t antyder med nuvarande kod:**

- En P19-spelare som åldras till 20 kan inte få ett synligt karriärutfall från rollovervägen; han filtreras bort innan något sådant skapas.
- Ett aktivt P19-mentorskap kan inte visas av nuvarande Blodslinje, eftersom junioren måste finnas i `game.players`.
- Ett lån före ett kalenderhopp kan inte garanteras ge det antal faktiska tillfällen som etiketten “N omg” lovar, eftersom durationen är absolut matchday.
- Årsbokens vanliga ungdomskull kan inte räknas utan att en separat kodväg också har skrivit `youthIntakeHistory`.

## Föreslagen regressionssvit

1. **E2E: lån före cup.** Start 0, cup på matchday 4, fyra omgångars lån. Efter cupen ska tre tillfällen återstå och exakt en rapport finnas.
2. **Domäntest: gles kalender.** Kör `processLoans` med 0→4→5→6→7 och verifiera fyra processade tillfällen, inte retur på första hoppet.
3. **Lineup-invariant.** `isOnLoan`-spelare får inte finnas i lista, autofyll, carry-forward, bänk eller sparad matchuppställning.
4. **Säsongsrollover: age-out.** En 19-åring ska ge ett namngivet utfall, ledgerpost och inboxrad innan aktiv P19-state rensas.
5. **Mentor över sommaren.** Aktiv relation får ett uttryckligt slut/fortsättning; historikposten får aldrig bli öppen orphan.
6. **Blodslinje.** En junior som fortfarande ligger i `youthTeam.players` ska synas. En senare borttagen junior ska fortfarande kunna namnrenderas från snapshot/ledger.
7. **Readiness.** En redo 19-åring ska vara redo efter rollover, eller få ett explicit annat utfall; kommentaren och beteendet ska vara samma kontrakt.
8. **Ungdomskull.** Alla spelare som genereras vid sommarens refill ska registreras i `youthIntakeHistory`/ledger och summeras i årsboken.
9. **Attribution.** Låneretur sparar start-CA, slut-CA och lånets delta; mentoråret sparar mätbar utvecklingseffekt.
10. **Årsbok.** Samma fixture/semantic event får högst en key-moment-rad även om den kommer från match, arc och ledger.
11. **Eventbudget.** Högst ett arbetsplatsbeat per arbetsgivare och omgång, eller ett sammanslaget beat.
12. **Tvåsäsongsekonomi.** Satsningsakademi + normala beslut ska antingen vara solvent eller utlösa en synlig ekonomisk kris före djup negativ kassa.

## Testluckan som dagens gröna tester bevisar

De befintliga lånetesterna är gröna men provar fel geometri: action-testet kontrollerar bara att 9 + 4 blir 13, och processortesterna matar in varje heltal i obruten följd. Inget test kombinerar riktig cupkalender, matchday-hopp och lineup. Därför kunde både durationen och spelbarheten vara trasiga samtidigt som hela den riktade sviten var grön.
