# TEXTLEVERANS — spakbalans, 2026-09-18 (Fable)

Tre delar. A är färdig text mot körordern `CODE_KORORDER_SPAKBALANS_2026-09-18.md` (Code lägger nycklarna, texten är låst). B är beslutsunderlag till Jacob om den tysta korridoren omgång 28–36. C är briefen till möjlighetsauditen.

Skrivguiden gäller (WRITING_GUIDELINES_BANDY_MANAGER.md): boll, isen, omgång, positioner. Inga dubbelmeningar i rad, inga klyschor, inga retoriska frågor. Befintlig periodiseringston i `SeasonArcCard.tsx` är referensen ("Toppa nu: tre matcher upp, sen faller formen.").

---

## A. Färdig text

### A1. Nemesis-raden (§5.1, `narrativeProcessor.ts` ~225)

Ersätter `"{Namn} ({Klubb}) har nu gjort {N} mål mot oss. Är det dags att värva honom istället?"`. Frågan är struken; raden bär trösklarna 3/6/10 som ordern sätter. Rubrik oförändrad (`Nemesis: {Namn}`), typ byts till rivalitets-/milstolpstypen.

Tröskel 3:
`{Namn} ({Klubb}) har gjort tre mål mot oss nu. Backarna vet vem han är.`

Tröskel 6:
`Sex mål mot oss av {Namn} ({Klubb}). Han hittar samma yta varje gång. Scouten har hans nummer.`

Tröskel 10:
`{Namn} ({Klubb}) är uppe i tio mål mot oss. Det pratas om det på Konsum. Han lär inte flytta hit.`

Variabler: `{Namn}` = för- och efternamn, `{Klubb}` = klubbnamn (nominativ). Inga siffror som siffror; tre/sex/tio skrivs ut eftersom trösklarna är fasta.

### A2. Rivalmöte-raden (§5.1, `narrativeProcessor.ts` ~168)

Dagens `"{Vi} dominerar mötet mot {Rival} med {V}–{F} i matcher. Dominansen håller i sig."` gick 107 gånger i en karriär. Ordern säger: bara när dominans etableras eller bryts. Två rader, ingen upprepning däremellan.

Etableras (första gången vinstserien mot en klubb når fyra utan förlust):
`Fyra raka mot {Rival}. De har börjat byta lag på straffar när vi kommer.`

Bryts (första förlusten efter etablerad dominans):
`{Rival} tog den till slut. {V}–{F} i matcher fortfarande, men det där kommer de leva på ett tag.`

Titel: `Rivalmöte: {Rival}` för båda.

### A3. Karriärsmilstolpe (§5.1)

Bara första hattricket per spelare och karriär. Dagens `"{Namn} satte hattrick och nådde en karriärsmilstolpe!"`.

`{Namn} gjorde sitt första hattrick i {Klubb}-tröjan. Bollen är hans, den ligger i väskan redan.`

För 50-målsmilstolpen (dagens `"nådde 50 mål i karriären — ett historiskt ögonblick!"`):
`{Namn} passerade femtio mål för klubben. Ingen sa något särskilt i omklädningsrummet. Alla visste.`

### A4. Extreme-varningen (§3.4, träningsvyn, visas efter omgång 2 i Extrem)

Kort rad under intensitetsväljaren, samma placering som periodiseringens reaktionsrad.

Efter omgång 2:
`Två veckor Extrem. En till går. Sen börjar det kosta på riktigt.`

Från omgång 3 och framåt (när kostnaden dubblats):
`Extrem sedan {N} omgångar. Truppen sliter, moralen med. Det här är inget säsongsläge.`

### A5. Träningsintensitet, förklaringsrader (§3.1–3.2, ersätter eller kompletterar `trainingIntensityLabel`-etiketterna med en rad var)

Lätt: `Lätt. Benen kommer tillbaka snabbare. De unga lär sig mindre.`
Normal: `Normal. Utveckling och vila i jämvikt. Standardveckan.`
Hård: `Hård. Snabbare utveckling, tyngre ben, fler smällar. Klarar truppen en period, inte en säsong.`
Extrem: `Extrem. Tre veckor max. Sen sliter det mer än det bygger.`

Reaktionsrad för Lätt när truppen är utvilad (ordern §3.1, spelare ≤ 24 med kondition > 75 tappar moral):
`{Namn} vill träna. Lätt vecka på lätt vecka gör honom rastlös.`

### A6. Träningsdeltat i spelarkortet (§3.3)

En rad under attributen, visas när säsongsdeltat är ≠ 0 för spelare < 24.

Positivt: `+{N} sedan säsongsstart. Träningen syns.`
Lågt delta (Jacobs rättelse 2026-09-18, efter §3.3-mätningen): `+{N} sedan säsongsstart. Lätt träning bygger långsammare.`
~~Noll efter halva säsongen (från omgång 11): `Står still sedan säsongsstart. Lätt träning bygger inget.`~~ — STRUKEN. Raden stämmer inte: en U24 som spelar utvecklas +7,4 CA per säsong även på Lätt (mätt, scripts/diag-ca.ts). Skillnaden mot Normal är ~1 CA, alltså långsammare, inte noll.
Negativt (skada eller ålder): `−{N} sedan säsongsstart.`

`{N}` = CA-delta med en decimal om under 1, annars heltal.

### A7. Säsongsklockan (§4.3, byggs först när §4.1 är grönt)

Fasnamn (rubrik ovanför lägesknapparna, ändras med säsongen):

Omgång 1–8: `Bandyhösten. Formen byggs nu eller inte alls.`
Omgång 9 till tre före slutspel: `Mitt i serien. Håll det som håller.`
Tre sista omgångarna före slutspel: `Sista biten. Tre matcher att toppa på.`
Slutspel: `Slutspel. Ingen sparar något nu.`
Efter åkning (cup eller slutspel): `Säsongen är slut för er. Benen får vila, huvudet får vänta på nästa.`

Förklaringsrad per läge, fast text som kompletterar de dynamiska raderna i `SeasonArcCard.tsx` (vilka behålls):

Bygg: `Bygg. Formen växer sakta, benen kostar. Hösten är byggd för det.`
Håll: `Håll. Ingen vinst, ingen kostnad. Rätt mellan tunga matcher.` (befintlig rad, behålls)
Toppa: `Toppa. Tre matcher upp, sen faller det. Använd den när det finns något att toppa mot.`
Vila: `Vila. Ben tillbaka, form nedåt. För en trupp som är slut, inte en som är lat.`

Varning när laget ligger kvar i Toppa efter spiken (roundsInMode ≥ 3):
`Spiken är förbi. Toppa kostar nu form varje omgång. Tillbaka till Håll om det inte är final på söndag.`

Varning när Bygg används sista tredjedelen av serien:
`Bygg nu hinner inte bära frukt förrän serien är slut. Formen ni bygger används av ingen.`

---

## B. Den tysta korridoren (omgång 28–36) — underlag för Jacobs beslut

### Vad som faktiskt händer där

Mätt över 28 säsonger (`textexponering_7seeds_5sasonger.jsonl.gz`): omgång 28–36 ger 9–43 ord per omgång, 16 % av alla omgångar har noll nya texter och nästan alla ligger här. Per säsong i spannet: 6,0 boardFeedback-poster (Nemesis/Rivalmöte/Milstolpe, försvinner med §5.1), 1,3 sponsorerbjudanden (försvinner med §5.2), 1,1 motståndarcitat, 0,9 stjärnprestation, 0,9 insändare, 0,9 slutspelsnotis. Klubbar som är kvar i slutspel eller cup får matchtexter; klubbar som är ute får ingenting förutom de mekaniska posterna som just ska bort. **Efter §5.1 och §5.2 blir korridoren tystare, inte mindre tyst.**

### Vad spelet redan vet om den klubben under de omgångarna

Tillstånd som finns i SaveGame och kan bära text utan ny mekanik:

- Spelare med `contractUntilSeason === currentSeason` (kontrakt som går ut i sommar). Kravskärmen kommer vid säsongsslut; korridoren är tiden då det borde börja pratas.
- Sponsorer vars `contractRounds` löper ut före nästa säsong.
- `youthTeam.seasonRecord` och `academyUpgradeInProgress` (P19-kullen som kommer upp i sommar).
- Spelare ≥ 33 (pensionsvalet ligger i seasonEnd; korridoren är när Rolf börjar prata om det).
- `playoffBracket` och `cupBracket` för de andra klubbarna: vem som är i final, om rivalen är kvar.
- `boardPatience` och `finances` i förhållande till styrelsens säsongsmål: styrelsen vet redan hur säsongen dömts.
- `communityStanding`, `supporterGroup.mood`: klacken har åsikter om en säsong som tog slut i februari.

### Tre alternativ

**1. Korta korridoren.** Klubbar som är ute ur allt går direkt till säsongssammanfattningen med en "medan finalen spelades"-rad. Minsta bygge, tar bort problemet i stället för att fylla det. Kostnad: spelaren tappar känslan av att säsongen fortsätter för andra, och slutspelsdramat för de elva andra klubbarna försvinner ur upplevelsen.

**2. Fyll med det som redan finns (rekommendation).** Fyra textnivåer, en per omgång i rotation, alla härledda ur tillstånd ovan:
   - *Kontraktsprat* (omgång 28–30): assistenttränaren om spelare vars kontrakt går ut. Ingen mekanik, bara förvarning om kravskärmen.
   - *Andras slutspel* (varje omgång med slutspelsmatch): en rad om resultatet, med extra vikt om rivalen är med. Finns redan som `playoff`-inbox för egna matcher; utvidgas till andras.
   - *Sommaren skymtar* (omgång 31–34): akademin (P19-kullen), pensionskandidater, sponsorer som löper ut. En rad per omgång, olika ämne.
   - *Bygden* (omgång 35–36): klacken och kommunen summerar säsongen innan styrelsen gör det. Kort, understatement.
   Bygge: fyra generatorer i `postAdvanceEvents`/`narrativeProcessor`, textpooler om 4–6 rader var (Fable). Inga nya beslutskort, inga nya tillstånd.

**3. Ge korridoren ett beslut.** Sommarplaneringen flyttas fram: spelaren väljer redan i omgång 30 vilka kontrakt som ska förlängas, vilket ger korridoren en mekanisk poäng. Störst bygge, rör kravskärmen och seasonEnd. Inte före soft launch.

Min rekommendation är 2, för den är byggd på tillstånd som redan finns och ger korridoren samma sak resten av säsongen har: någon som säger något om det som händer. Textpoolerna skriver jag när du valt.

---

## C. Brief: möjlighetsauditen

Till en granskare utan projektkontext (GPT, eller en Claude i ny session utan tillgång till docs/). Skickas tillsammans med en byggd version av spelet eller en spelbar URL, inte med kod eller dokument.

---

**Uppdrag**

Du ska spela Bandy Manager, ett svenskt managerspel om bandy i småstads-Sverige, i minst två hela säsonger med samma klubb. Välj en klubb ur den nedre halvan av tabellen.

Du får inte rapportera buggar, textfel, otydligheter eller saker som inte fungerar. Det finns andra som gör det. Om du hittar sådant, ignorera det.

Du ska svara på en enda fråga: **vad i det här spelet skulle få dig att ta en skärmdump och skicka den till någon?**

Rapportera varje gång det händer, eller nästan händer. För varje tillfälle:

1. Vad du såg (skärmen, texten, siffran, ögonblicket).
2. Vem du skulle skickat det till och vad du skulle skrivit i meddelandet.
3. Vad som fattades för att du faktiskt skulle gjort det, om du inte gjorde det.

Rapportera också motsatsen, högst fem gånger: tillfällen då spelet byggde upp mot något som borde blivit ett sådant ögonblick men som rann ut i sanden. Beskriv vad du väntade dig och vad som kom.

Sist: om du fick lägga till exakt en sak i spelet, en skärm, en text, en händelse, en siffra, vad skulle göra det mest delbart? Motivera med vad du faktiskt upplevde, inte med vad managerspel brukar ha.

Skriv på svenska. Ingen sammanfattning, inga betyg, inga listor över styrkor och svagheter. Bara ögonblicken.

---

Två saker att tänka på när svaret kommer: granskaren kommer att hitta tre till fem saker som redan finns i `POST_LAUNCH.md` eller `THE_BOMB.md`, och det är inte bortkastat, det är bekräftelse på prioritet. Och det första ögonblicket granskaren rapporterar är nästan alltid i säsong 1 omgång 1–5; det intressanta är vad som händer i säsong 2, för det är där stickinessfrågan från augustiauditen ligger.

---

## D. Korridoren, alternativ 2 — textpooler och genereringsvillkor (skrivna i förväg; används om Jacob väljer 2)

Fyra generatorer, en post per omgång för en klubb som är ute ur både slutspel och cup. Rotationsordning per omgång: kontraktsprat → andras slutspel → sommaren skymtar → bygden → andras slutspel → … Varje pool är säsongsscopad: en rad används högst en gång per säsong och karriär (samma dedup som `supporter_*`-korten). Alla rader är `InboxItem` av atmosfärtyp (ingen `expiresRound`), inga beslutskort. Röster: assistenttränaren (`assistantCoach`, `voiceId` finns), klackledaren (`supporterGroup.leader`), veteranen (`getCharacterName(game,'veteran')`), lokaltidningen (`localPaperName`). Alla röster är introducerade efter Tillträdet, så voice-gaten stoppar inget.

### D1. Kontraktsprat — omgång 28–30, `fromRole: assistenttränare`

Villkor: minst en spelare i truppen med `contractUntilSeason === currentSeason`. `{Namn}` = den med högst CA bland dem; `{Antal}` skrivs ut (två, tre, fyra) om > 1.

- `{Namn} har frågat om sommaren två gånger nu. Han frågar inte en tredje.`
- `{Antal} kontrakt går ut i vår. Jag har inte sagt något till dem. Du får bestämma vad jag ska säga.`
- `{Namn} har börjat träna som en som vill visa något. Det brukar betyda en av två saker.`
- `Det ringde från en annan klubb och frågade om {Namn}. Jag sa att jag inte visste. Det var sant.`
- `{Namn} sitter kvar längst i omklädningsrummet nu för tiden. Han väntar på att någon ska säga något om nästa år.`

Titel: `{Förnamn på assistenttränaren} om sommaren`.

### D2. Andras slutspel — varje omgång med minst en spelad slutspels- eller cupmatch bland de andra klubbarna

Villkor: `playoffBracket`/`cupBracket` har en nyss avgjord match utan vår klubb. `{Vinnare}`, `{Förlorare}`, `{Resultat}`. Om `{Vinnare}` eller `{Förlorare}` är en klubb vi dominerat eller som dominerat oss (rivalitetsdata från §5.1) används rivalvarianten.

Neutral:
- `{Vinnare} slog {Förlorare} med {Resultat}. Halva bygden såg det på telefonen i kafferummet.`
- `{Vinnare} vidare. {Förlorare} åker hem samma buss som vi gjorde för tre veckor sedan.`
- `{Resultat} till {Vinnare}. Det var en match vi hade velat vara med i.`
- `{Förlorare} ute. Deras tränare sa i tidningen att säsongen var bra ändå. Man känner igen tonen.`

Rival kvar:
- `{Vinnare} vidare igen. De vi slog i höstas spelar i mars. Det svider mer än det borde.`
- `{Vinnare} vann. Klacken har bestämt sig för att hålla på {Förlorare} nästa gång.`

Rival ute:
- `{Förlorare} åkte ut. Sture sa ingenting på Konsum. Han log bara.`
- `{Resultat}. {Förlorare} är ute. Det var första gången på länge som någon här hejade på {Vinnare}.`

Final:
- `{Vinnare} är svenska mästare. På Studenternas. Vi såg det från soffan, som alla andra.`

Titel: `Slutspelet utan oss` (neutral), `{Rival} i slutspelet` (rival).

### D3. Sommaren skymtar — omgång 31–34, ett ämne per omgång i denna ordning, hoppas över om villkoret saknas

**Akademin** (villkor: `youthTeam` finns; `{V}`, `{F}` ur `seasonRecord`; `{Namn}` = P19-spelaren med högst PA):
- `P19 slutade {V} vinster och {F} förluster. {Namn} har frågat när han får träna med oss. Snart, sa jag.`
- `Ungdomstränaren vill prata om {Namn}. Han säger att pojken är klar. Det säger han varje vår, men den här gången tittade han inte bort när han sa det.`

**Pensionskandidater** (villkor: minst en spelare ≥ 33; `{Namn}`, `{Ålder}`):
- `{Namn} ({Ålder}) tog av sig skridskorna långsammare än vanligt efter träningen. Ingen sa något. Han sa inget heller.`
- `{Namn} har börjat prata om isen som något som varit. Det brukar komma ett samtal efter sådana vårar.`

**Sponsorer som löper ut** (villkor: sponsor med `contractRounds` ≤ omgångar kvar; `{Sponsor}`):
- `{Sponsor} har inte hört av sig om nästa år. Det betyder oftast att de tänker, inte att de tänker sluta.`
- `Avtalet med {Sponsor} går ut i sommar. De var med när det var tunnare. Någon borde ringa dem innan de ringer oss.`

**Ekonomin** (villkor: `finances < 0` eller boardPatience < 40; annars hoppa):
- `Kassören lämnade en lapp på skrivbordet. Inga siffror på den, bara "vi behöver prata före sommaren".`

Titel: `Sommaren skymtar`.

### D4. Bygden — omgång 35–36, en rad per omgång

**Klacken** (omgång 35; villkor: `supporterGroup` finns; röst: klackledaren; variant efter `supporterGroup.mood`):
- mood ≥ 55: `{Klackledare} hade samlat gänget på klubbhuset. Inte för att fira något. Bara för att säsongen skulle ha ett slut som inte var en förlust.`
- mood 35–54: `{Klackledare} säger att de kommer tillbaka i höst. Han säger det som om det var en fråga.`
- mood < 35: `Klacken har inte sjungit sedan {Månad}. {Klackledare} säger att sångerna finns kvar. Det är laget de saknar.`

**Kommunen och tidningen** (omgång 36; villkor: `localPaperName`; variant efter `communityStanding`):
- CS ≥ 60: `{Tidning} skrev en helsida om säsongen. Ingen av rubrikerna handlade om tabellen. Det var meningen.`
- CS 40–59: `{Tidning} sammanfattade säsongen på en kvartssida. Rättvist, ungefär.`
- CS < 40: `{Tidning} skrev om säsongen under sporten, längst ned. Kommunalrådet citerades inte. Det säger sitt.`

Titel: `Bygden om säsongen`.

### Kontroll efter bygge

Kör `scripts/text-exposure.ts` på sju seeds igen. Mål: omgång 28–36 ligger på 40–90 ord per omgång (idag 9–43), ingen omgång med noll texter för en klubb som är ute, och ingen rad i D1–D4 förekommer mer än en gång per säsong. Om en pool tar slut (t.ex. tredje säsongen i rad med kontraktsprat) ska generatorn hoppa över omgången, inte återanvända.
