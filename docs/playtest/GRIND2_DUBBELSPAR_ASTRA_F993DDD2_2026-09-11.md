# Grind 2 — naturligt dubbelspår Codex/Astra på `f993ddd2`, 2026-09-11

## Dom

**UNDERKÄND. Grind 2 stängs inte.**

En ny Karlsborg-karriär spelades över två säsonger på **MEDEL** i en egen
isolerad browserprofil mot den pinnade produktcommiten
`f993ddd22fd3db4cfdef38efb43649c2329aac78`. Pinnen ligger efter
årsboksfixen `1b213092` och dess arkivering och innehåller samtliga tre
blockerarfixar som skulle återprovas. Ingen matchbalans, sannolikhet eller
kalibrering ändrades.

De tidigare hårda köfynden förbättrades påtagligt: både gamla kort och den
promoverade klackkonflikten gick att öppna och lösa, avbrottsbudgeten höll sig
på högst tre och säsongsslutet gick att passera efter att ett tio omgångar
gammalt burnout-kort lösts. Burnout-taket, kafferumscooldownen, galans
engångsresolution och den kanoniska klackkonflikten höll i den observerade
körningen.

Passet faller ändå mot stoppregeln. Fyra nådda scener bröt kärnflöde eller
talade osant:

1. ett kapitelanslag låste portalen när **Tryck för att fortsätta** användes,
2. ett Granska-kort lät Karlsborg fatta karriärbeslut åt en motståndarspelare,
3. årsboken sade både att styrelsen fått mer än den begärt och att ett uppdrag
   missats,
4. ett avvisat transferbud låg samtidigt kvar som `pending` med samma id och
   fortsatte kräva svar på portalen.

Efter det första kapitelanslagsstoppet gick den naturliga körningen inte att
fortsätta genom gränssnittet. För att kunna läsa återstående invariantscener
markerades enbart det blockerande anslaget som sett direkt i den isolerade
savens browserlagring och sidan laddades om. Samma stopp återkom vid de följande
anslagen; de passerades på samma diagnostiska sätt. All matchning, laguttagning,
taktik, beslut och säsongsövergång fortsatte därefter genom produktgränssnittet.
Den delen är därför **diagnostisk fortsättning efter ett redan konstaterat
underkännande**, inte ett påstående om en obruten naturlig tvåsäsongskörning.

## Omfattning och utfall

- Säsong 2026/27: cupsemifinal, 3:e plats med 24 poäng, kvartsfinalförlust
  1–3 i matcher mot Gagnef.
- Säsong 2027/28: cupfinal, 11:e plats med 12 poäng, inget slutspel.
- Karriären avslutades efter exakt två säsonger när styrelsen sparkade Astra.
- Säsong 1 bar en tydlig comeback-/utmattningsbåge och ett djupt nog
  kvartsfinalförlopp för att läsa kö och kafferum under slutspel.
- Säsong 2 pressades adversariellt till burnout-taket och avslutades med en
  trovärdig personlig och sportslig kostnad.

## Spår A — logik

### 1. Burnout-taket — PASS

- Säsong 2 nådde 100 i burnout under fem rundor och genererade
  `event_burnout_ceiling_2027_12`.
- Valet **Kliv tillbaka en period** registrerades exakt en gång som
  `burnoutCeiling:step_back`, irreversibelt, i både resolution och liggare.
- Nästa spelade match sänkte takräknaren till noll. Inget andra terminalt val
  kom under resten av säsongen och inget motstridigt slutval skrevs.
- Säsong 1 gav återhämtningsval men nådde inte terminalscenen; inget falskt
  terminalt kvitto skrevs.

### 2. Kafferums-eko — PASS i observerad population

- De generiska visningsnycklar som skrevs till `narrativeBeatLog` var unika:
  11 olika `coffee_pool_*` under säsong 1 och tre nya under säsong 2.
- Inget exakt automatiskt replikpar återkom under tvåsäsongskörningen och
  inget upprepades i kvartsfinalserien.
- Segerekona som faktiskt visades återkom inte.
- Populationen omfattade ett kvartsfinalslutspel, inte semifinal/final; domen
  påstår därför inte mer än den observerade täckningen.

### 3. Bandygalan — PASS för repris, terminal restpost noterad

- `event_gala_2026` uppstod naturligt i början av säsong 2, löstes med
  **Gå på galan** och återkom inte.
- Vid Game Over skapade säsongsrullningen en ny årsutgåva,
  `event_gala_2027`, i `pendingEvents`. Det är inte en repris av den lösta
  galan, men kortet är onåbart eftersom karriären redan är avslutad. Det är en
  terminal städ-/livscykelrest och inte orsaken till passets underkännande.

### 4. Klackkonflikten — PASS

- Tifot uppstod naturligt säsong 1 och löstes på omgångsindex 6.
- `supporter_conflict_2026` uppstod därefter naturligt på omgångsindex 10 när
  tre andra kort redan fyllde budgeten. Konflikten låg först uppskjuten,
  promoterades till det frusna Granska-kortet och gick att lösa där.
- Valet **Bjud in båda på ett möte med truppen** registrerades exakt en gång.
  Efter-resolutionen hade varken `pendingEvents` eller `deferredDecisions` en
  konfliktkopia.
- Den kanoniska konflikten återkom inte under säsong 2. Detta är den naturliga
  täckning som saknades i de två föregående proven.
- Det separata generiska veckovalet `supporter_conflict_mediate` förekom också
  i båda säsongerna. Det är en annan producent och ett annat val, men namnet
  ligger farligt nära den pivotala konfliktens semantik och bör inte användas
  som bevis för den kanoniska scenen.

### 5. Beslutskön — FAIL, men den gamla säsongsslutsblockern är löst

Det som nu fungerar:

- Avbrottsbudgeten visade aldrig fler än tre aktiva.
- Klackkonflikten kunde gå `deferred` → promoverad → synlig i fruset Granska
  → löst utan kopia eller dubbel effekt.
- Vid båda säsongssluten var gamla burnout-kort synliga och öppningsbara bredvid
  **Avsluta säsongen**. De kunde lösas och karriären gick vidare.
- Ett halvsäsongskort som ännu fanns i `pendingEvents` före andra rollover
  pensionerades i övergången; det reproducerades inte i nästa tillstånd.

Det nya dedupebrottet:

- I början av säsong 2 avvisades budet på Sondre Nyström från Målilla.
- Samma save innehöll därefter två `transferBids` med exakt id
  `bid_2_player_club_karlsborg_10_club_malilla`: ett med status `rejected`
  och ett med status `pending`.
- `resolvedEventIds` innehöll samtidigt
  `event_bid_bid_2_player_club_karlsborg_10_club_malilla`.
- Portalen fortsatte ändå visa **BUD Nyström · 50 tkr Målilla · svar krävs**.
  Det är både central dedupe-regression och en synlig motsägelse om huruvida
  spelaren redan svarat.

## Stoppregel — övriga releaseblockerare

### Kapitelanslag låser portalen

Vid `league_halfway` gick **Tryck för att fortsätta** inte att använda.
Interaktionen återvände aldrig och anslaget låg kvar efter vanlig omladdning.
Samma beteende återkom vid `league_midwinter`, `playoff_qualification`,
`regular_done` och `season_done`. Karriären kunde bara fortsätta efter att
respektive `seenAnslag`-nyckel markerats direkt i den isolerade saven och sidan
laddats om. Det är ett hårt kärnflödesstopp på scener varje hel säsong når.

### Motståndarspelare behandlas som egen spelare

I säsong 1:s kvartsfinal-Granska uppstod
`hungrig_wants_more_player_club_halleforsnas_5` med rubriken
**Jonathan Claesson vill kliva upp**. Jonathan tillhörde Hälleforsnäs, men
alternativen bad Karlsborgs tränare stötta honom eller få honom att stanna.
Scenen ljuger om ägarskapet och ger spelaren beslut över motståndarens trupp.

### Årsboken motsäger sig själv och styrelseuppdraget

Säsong 1:s årsbok visade grönt kvitto och **Styrelsen fick mer än de bad om**.
Direkt därefter stod **Tredjeplatsen var vad de väntade sig, men ett uppdrag
missades**. Under säsongen hade styrelsen uttryckligen sagt att
**Gå långt i cupen** inte nåddes. Vid starten av säsong 2 visades dessutom
föregående säsongs objektivprogress (`Gå långt i cupen 2/3`, `Slå Rögle 1/1`)
som om den hörde till de nya målen. Slutlig `boardTruth` kan vara korrekt utan
att rädda den motsägelse spelaren faktiskt såg i årsboken och på portalen.

## Pivotal liggare och checkpoints

Checkpointkopiorna finns endast i den isolerade browserprofilens IndexedDB;
de ingår inte i repot eller någon commit. SHA-256 gör före-/efterparen
identifierbara:

- Tifo före: `8fa2f0f40f94f020859e4d3cc758680a149961caab083973f69504a1e002b8d2`
- Tifo efter: `544e938946e869ef5b5932d72c78887c34a225c8647519e9d80c34303cfd6f78`
- Klackkonflikt före: `6731ca78dd021042e7ab3bd1d4d2ae303f7af90289db8ddfe47d2a74bb0c1184`
- Klackkonflikt efter: `d53f8d1a40e6bc135952a9565b26b1d62d3a35acb47ecad13f20f50f08712f56`
- Säsong 1, säsongsslutskö före: `155b5f866f43569da73a018d7f15180b4fa239d608bea16a7785b8fa95ded73d`
- Säsong 1, säsongsslutskö efter: `fa0e4c6d23db6dd6f7accdad492f5269f9f093b75065f3514bf7274e847a263c`
- Gala före: `f131d712858759bfa2a18bf5789f9d328cba99cad2442ace2a8a5edc7b2e09b6`
- Gala efter: `2a763e9ec8a4990db165642b0097c4c2c7383010f40b1665c646de8734128b75`
- Burnout-tak före: `bda57d9c5ce577c72e3bdbba01603306479c0cfc0bde447b84566b49700b3be2`
- Burnout-tak efter: `e944081d76926fe31cfd00126b4c707500db4f65a0711c2c7fa67344fb876b49`
- Säsong 2, säsongsslutskö före: `8edd008daf4a41cc457db41d5334bc8bb78f15267a2e58fde8ed283f4e73be06`
- Säsong 2, säsongsslutskö efter: `0e3d262bc0f7f1ab26fb83d25e78b73bb92362cc37bd1e13db2f358c2b5eebf3`

Galans efter-checkpoint innehåller dessutom de två motsägande
Nyström-budposterna och är den exakta reproduktionspunkten för transferfelet.

## Spår B — spelupplevelsen

### Säsong 1

Den primära handlingen var tydlig: ett svagt Karlsborg överpresterade, slet ut
sig och gjorde en verklig sportslig resa. Den fulla matchen där 2–5 blev 7–5
var körningens starkaste rena matchögonblick. Klackens tifo följt av konflikten
gav en begriplig supporterbåge, och kvartsfinaluttåget efter tredjeplatsen blev
en tydlig landning. Nästa fråga var om det överpresterande laget hade byggt
något hållbart eller bara förbrukat sig.

### Säsong 2

Cupfinalen gav en stark öppning, men två samtidiga långtidsskador och en lång
förlustsvit gjorde handlingen till en kollaps. Burnout-slutvalet bar dramatisk
vikt eftersom **Kliv tillbaka** kostade styrelsetålamod och följdes av både en
kort återhämtning och fortsatt sportslig kamp. Bortaderbysegern 4–0 mot Rögle
blev ett trovärdigt andningshål; elfteplatsen och avskedandet gav säsongen en
distinkt, hård landning.

### Över två säsonger

- Åttasekundersvalen i fullmatch gav bättre flyt än den tidigare
  femsekundersrytmen.
- Beslutskön kändes klart lättare. Gamla kort blev synliga och gick att lösa;
  den tidigare massan av `+N fler` och det olösbara säsongsslutet återkom inte.
- Burnout, tifot, klackkonflikten och galan behöll dramatisk tyngd utan exakta
  repriser. Galan var nu en faktisk scen och inte bara en vinnarlista.
- Kausaliteten fungerade bäst i de stora bågarna. Däremot slår ägarskapsfelet,
  årsboksmotsägelsen och transferdubbelstatusen direkt mot förtroendet för att
  spelet minns vad spelaren har gjort.
- Kapitelanslagsstoppet är kvalitativt värre än vanlig friktion: det bryter den
  sammanhängande säsongsrytmen och kräver extern manipulation för att komma
  vidare.

## Åtgärdsordning

1. Reparera `AnslagOverlay`/portalens dismissflöde och verifiera alla fem
   säsongsanslag i riktig 390×844-karriär med vanlig klick och omladdning.
2. Gör spelarhändelser klubbägarsäkra före generering och före resolution.
3. Låt årsbokens hero, domrad och objektivhistorik läsa samma frusna
   säsongssanning; nollställ ny säsongs progress utan att radera historiken.
4. Gör inkommande transferbud atomära över budlista, eventkö och
   `resolvedEventIds`; ett avvisat id får aldrig återinsättas som `pending`.
5. Behåll kölivscykel-, burnout-, kafferum-, gala- och supporterfixarna
   oförändrade. Rör inte matchmotor eller den datadrivna balanseringen.
6. Kör därefter ett kort blockeraråterprov från checkpointarna och slutligen
   ett nytt obrutet naturligt tvåsäsongsprov innan Grind 2 arkiveras.
