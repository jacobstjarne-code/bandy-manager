# KLUBBFAKTA

**Skapad:** 2026-04-27
**Status:** INTERN REFERENS — exponeras INTE 1:1 i UI

---

## Syfte

Detta dokument är intern research för Opus när svensk text skrivs (commentary, inbox, mecenat-stories, kafferum, briefings, klimatkort). Klubbarna i Bandy Manager är **fiktiva**. De står på en bädd av verkliga svenska orter med verklig geografi, riktigt mikroklimat och äkta bandyhistoria. Det ger texten lokal specificitet utan att låsa sig i 1:1-förhållande till en riktig klubb.

**Användning:**
- När text skrivs om Forsbacka — *känn* hur Forsbacka är som plats: bruksort, vid Gavleåns utlopp ur Storsjön, mellan Gävle och Sandviken, vintrar med snö som ligger kvar
- När väder genereras — använd klimat-proxy (SMHI-station) och arketyp för realistisk variation
- När anekdoter behövs — plocka ur reservoaren, inte från det riktiga klubbnamnet

**Vad som ALDRIG exponeras i spelet:**
- Riktiga klubbnamn med årtal ("Forsbacka IK 1918")
- Riktiga personer 1:1 ("Sigge Parling", "Andreas Bergwall")
- Saker som binder för hårt mot verklighet (specifika SM-finaler, exakta publikrekord från riktiga klubben)
- Direkta referenser till nutida sponsorer eller företag
- **Verkliga arenanamn (Mariehov, Stålvallen, Strandvallen etc.)** — spelet använder fiktiva namn som finns i `worldGenerator.ts`. Per-klubb-sektionerna nedan listar verkliga arenor för research-kontext, men spelets arenanamn finns i Bilaga D

**Vad som FÅR användas i spelet:**
- Geografisk situation (vid sjö, i bruksort, vid kust)
- Bruks-/yrkeskultur som färgar orten (pappersbruk, järnverk, sulfitbruk)
- Mikroklimat och vädertyper
- Generiska "gamla bandygubbar minns"-anekdoter (sjöis, första hemmaplaner)
- Lokal närhet (närmaste stad, närmaste rival-ort)

---

## Klimat-arketyper — översikt

| Arketyp | Klubbar | Karaktäristik |
|---|---|---|
| **arctic_coast** | Karlsborg | Bottenviken, extrem kyla, vinter okt–maj, snödjup, polarklimat-ish |
| **gulf_coast** | Skutskär | Bottenhavet, kustnära, mildare än inland tack vare havet |
| **vanern_effect** | Slottsbron | Vid Vänern, sen istäcke, dimma, växlande vinter |
| **scanian_coast** | Rögle | Sydsverige, ofta plusgrader, sällan vargavinter |
| **valley_coldpit** | Lesjöfors | Dokumenterat köldhål — invertion ger extremköld vid klart+vindstilla |
| **valley_inland** | Gagnef | Älvdalsens sammanlöp, kalluftsamling möjlig men ej dokumenterat köldhål |
| **bruk_lakeside** | Forsbacka, Hälleforsnäs, Heros, Västanfors | Bruksort vid sjö, fuktigare luft, fördröjd istäcke |
| **bruk_river_island** | Söderfors | Bruksort på ö i älv, tidig is på smala armar |
| **sm_highland_extreme** | Målilla | Småländska höglandet, "temperaturhuvudstaden" — extrema utsving sommar/vinter |

---

## Klubbarna (alfabetisk ordning)

---

## CLUB_FORSBACKA — Forsbacka

### Verklig referens
- **Ort:** Forsbacka, Gävle kommun, Gästrikland
- **Geografisk position:** Vid Storsjöns utlopp i Gavleån, ca 15 km väster om Gävle, ca 6 km öster om Sandviken
- **Befolkning verkliga orten:** ~1700 invånare
- **Industri:** Forsbacka Jernverk (anor från 1500-talet, formellt bildat 1870), klassisk 1700-talsbruksstruktur kvar med bruksgata och engelsk park
- **Historisk bandyklubb:** Forsbacka IK, bildad 1918, smeknamn "Gula Faran" — "yo-yo-klubb" som åkte upp och ner mellan högsta och näst högsta serien sex gånger under 1940-1968. Bandyverksamheten vilande sedan säsongen 2023/24

### Geografi & klimat
- **Topografi:** Bruksort i skogslandskap, lågland mellan Storsjön och Gavleån
- **Mikroklimat-arketyp:** `bruk_lakeside`
- **SMHI-proxy-stationer:** Sandviken (~10 km), Gävle (~15 km)
- **Lokala vädertyper:** Storsjön är stor — fördröjer istäcke, ger fuktig luft. Inte särskilt utsatt för extremväder. Gästrikland ligger i bandybältet — säsong oktober till mars är typisk

### Hemmaplan (riktig)
- **Mariehov** — naturisbana, ligger djupt inbäddad bland höga furor i utkanten av samhället
- Klubbstuga med café i ett beige-gult trähus finns kvar
- Naturis så länge vädret tillåter, kommunen har gjort det allt svårare med uppspolning

### Sjöis-historik / förflytta-historik
- Bandy spelades initialt på Storsjöns is när vädret tillät
- Forsbacka var inblandade i den **sista matchen där bandylag gick genom isen** (1960, mildvinter): Forsbacka spelade Köping på Storsjöns is — det var Köping som sjönk till botten. Samma dag sjönk tre Heros-spelare genom isen på Örtjärnet i Slottsbron. Bandyhistoriskt slutpunkt för matcher på sjöis i toppserierna.

### Anekdotreservoar (commentary, inbox, kafferum)
- **Bruks-DNA:** Bruksdisponenter, järnverket, arbetare som "växlade arbete för match"
- **Geografisk underdog:** Mellan Gävle (Brynäs hockey) och Sandviken (SAIK bandy) — den lilla orten som klämts mellan storheterna
- **Mariehov-melankoli:** Naturisens frustration — klubben kämpar mot vädrets makt, men *när* isen ligger är det magiskt
- **Stjärn-arketyper (omarbetade):** En ortsfödd som blev legendar i annan klubb (typ "Sigge Parling"-mönstret — Sirius-stjärnan från orten). En målspruta som blev rysslandsproffs. Lokala hjältar som aldrig lämnade.
- **Storsjö-incidenten 1960:** Sista bandymatchen på sjöis där lag gick igenom — ingen direkt referens, men generisk "när motståndarlaget gick i plurret på sjöisen" är OK som en *gamla bandygubbars*-anekdot

### Lokala detaljer (för text-färg)
- Pizzeria med Jack Vegas, "Storsjökrogen" eller liknande bruksort-pizzeria
- Konsum-position i samhället
- Bruksgatan, herrgården, engelska parken
- Storsjön som rekreationspunkt sommartid, isen vintertid
- Gefle Dagblad / Arbetarbladet täcker bandyn

### Vad som ALDRIG sägs
- "Forsbacka IK"
- "Gula Faran" (smeknamnet kan dock användas om vi vill — det är generiskt nog)
- Sigge Parling, Ernst Hård, Ejnar Ask vid namn
- Specifika SM-finaler från riktiga klubben

---

## CLUB_GAGNEF — Gagnef

### Verklig referens
- **Ort:** Gagnef, Gagnef kommun, Dalarna
- **Geografisk position:** Mitt i Dalarna, vid Österdalälvens flöde
- **Befolkning verkliga orten:** ~1050 invånare (Gagnef tätort), ca 10 000 i kommunen
- **Industri:** Småskaligt — jordbruk, hantverk, småföretag. Wålstedts ullspinneri är en lokal kulturmarkör
- **Kommunens centralort:** Djurås — där Västerdalälven möter Österdalälven och bildar Dalälven
- **Historisk bandyklubb:** Svag bandytradition i kommunen (historiskt sett ishockey i Björbo som starkast). Bandy är inte Gagnefs identitet i verkligheten — desto bättre för fiktion

### Geografi & klimat
- **Topografi:** Älvdalslandskap. Floder genom skog, byar längs ådalarna, omgivande skogsåsar
- **Mikroklimat-arketyp:** `valley_inland`
- **SMHI-proxy-stationer:** Borlänge (~30 km öster), Mora (~80 km norr)
- **Lokala vädertyper:**
  - Älvdalens topografi *kan* skapa kalluftsamling vid rätt förhållanden (vindstilla + klar himmel + nattlig utstrålning) — men Gagnef är **inte** ett dokumenterat köldhål som Lesjöfors. Skillnaden ska respekteras
  - Snörikt — Dalarna har generellt djupt snötäcke från december till mars
  - Stabila kalla vintrar i historisk normal, men med betydande variation senaste decenniet

### Hemmaplan (fiktiv — välj passande)
- Förslag: namnet kan referera till älvkanten eller "Bruken" (det fanns småbruk i trakten). Något som "Älvvallen" eller "Gråvallen"
- Naturlig miljö: vid älvkanten eller i öppet landskap — *inte* skogsbäddat som Mariehov

### Sjöis-historik
- Generisk: "Innan vi fick vår nuvarande plan spelade laget när älven la sig — på Österdalälvens is i januari, när det var kallt nog"
- Verkliga Dalarna-bandyrötter: spelades historiskt på sjöar (Runn vid Falun, Siljan vid Mora etc)

### Anekdotreservoar
- **Älvarnas möte:** Just söder om Gagnef möts två älvar (Djurås) — en geografisk markör som kan användas: "klubben från där älvarna möts"
- **Inland-Dalarna-DNA:** Dalkarl-stolthet, inte Falu-flärd, inte Mora-prestige. Nedanför fjällen, ovanför Mälardalen
- **Skidor som rival:** I Gagnef är längdskidåkning kulturellt större än bandy — kan vara ett återkommande tema, klubben kämpar för uppmärksamhet mot Vasaloppet-traditioner. Lokala dynamiker
- **Småskalig identitet:** Inga storverk eller stora bruk. Bondebygd, byaföreningar, spannmålsmagasin

### Lokala detaljer
- Närmaste stad: Borlänge (~30 km)
- Närmaste fjälldestination: Sälen (~150 km nordväst)
- Lokala media: Falu-Kuriren, Borlänge Tidning
- Kulturell markör: knypplade spetsar, dalmåleri, äldre bygd

### Vad som ALDRIG sägs
- Direkta referenser till verkliga klubbar i området

---

## CLUB_HALLEFORSNAS — Hälleforsnäs

### Verklig referens
- **Ort:** Hälleforsnäs, Flens kommun, Södermanland
- **Geografisk position:** Vid Hälleforsen och Brukssjön, mitt i Sörmland
- **Befolkning verkliga orten:** ~1500
- **Industri:** Hälleforsnäs Bruk — järnhantering sedan 1659, kanontillverkning till vedspisar och sandformnings-innovationer. Bruket har lagts ner. Familjen Celsing (Lars Gustaf von Celsing) var dominerande på 1800-talet
- **Historisk bandyklubb:** Hälleforsnäs IF, "Brukets Blå", bildad 1925. 21 säsonger i högsta divisionen. SM-semifinal 1979 mot Broberg. **Bandyverksamheten lades ner 2005** efter desperata vädjanden till Flens kommun om konstfrusen som aldrig kom.

### Geografi & klimat
- **Topografi:** Bruksort i sörmländsk landskap, Hälleforsen rinner genom orten, Brukssjön söder om
- **Mikroklimat-arketyp:** `bruk_lakeside`
- **SMHI-proxy-stationer:** Eskilstuna (~30 km), Katrineholm (~25 km)
- **Lokala vädertyper:** Sörmländskt klimat — milda kustinfluenser från Östersjön, snödjup mindre än Bergslagen, kortare bandysäsong än norrut. Brukssjön påverkar fuktigheten

### Hemmaplan (riktig)
- **Edströmsvallen** — vackert beläget vid Brukssjön i ortens gamla bruksområde. Bandyplan byggd 1947. **Aldrig konstfrusen** — kämpat förgäves för det
- I dag grusplan, hemmaplan för fotbollssektionen

### Sjöis-historik
- Spelade historiskt på Brukssjöns is och uppspolade banor
- Aldrig konstfrusen — det var dödsstöten för bandyn

### Anekdotreservoar
- **"Brukets Blå"** — smeknamnet kan användas (är generiskt nog: bruksidentitet + lagfärg)
- **Stoltheten i 70-talet:** Säsongen 78/79 nådde laget SM-semifinal. "Lilla Hälleforsnäs slog bandys storheter"
- **Slutet:** Klubbens nedläggning 2005 är *exakt* den historia spelet kan dra på — bruket dör, sponsorerna försvinner, ungdomarna flyttar, kommunen vägrar konstfryst. Klassisk bruksort-tragedi i bandy-Sverige
- **Bilbingo och Bruksbrummet:** Klubben arrangerar populära event för att överleva ekonomiskt — sjuk-svensk-bruks-vibb
- **Domaren som drattade i:** Verklig anekdot — vid en match var isen så dålig att domaren ramlade i. *"Då kom de hem med honom som en våt katt"*. Generisk version OK som matchstart-färg
- **Modkulturen:** Bruks-arbetare, järnverket var allt, "när vissla tutade" — ortens rytm var brukets rytm

### Lokala detaljer
- Lokala media: Eskilstuna-Kuriren, Katrineholms-Kuriren
- Närmaste stad: Eskilstuna eller Katrineholm
- Närmaste rival historiskt: Katrineholm SK
- Kulturell markör: Gjuterimuseet, brukshistorian, jordbruksmaskiner, vedspisar

### Vad som ALDRIG sägs
- "Hälleforsnäs IF" specifikt
- Håkan Spångberg vid namn
- Familjen Celsing 1:1
- Att klubben "lades ner 2005" — i spelet är klubben fortfarande aktiv

---

## CLUB_HEROS — Heros

### Verklig referens
- **Ort:** Smedjebacken, Smedjebackens kommun, Dalarna
- **Geografisk position:** Vid sjön Norra Barken, södra Dalarna (gränsen mot Västmanland)
- **Befolkning verkliga orten:** ~3500
- **Industri:** Stålindustri (Ovako), småindustri runt Strömsholms kanal (invigd 1795)
- **Historisk bandyklubb:** IK Heros, bildad 1915. 11 säsonger i högsta serien (1940 till 1965/66). Idag aktiv på Herosvallens konstfrusna bandyplan

### Geografi & klimat
- **Topografi:** Vid Norra Barkens norra ände. Strömsholms kanal löper igenom. Skogslandskap, måttlig höjd över havet
- **Mikroklimat-arketyp:** `bruk_lakeside`
- **SMHI-proxy-stationer:** Borlänge (~50 km nord), Ludvika (~25 km nordväst), Avesta (~40 km öster)
- **Lokala vädertyper:** Norra Barken är stor sjö — fördröjer istäcke, ger fuktig luft, dimma vanlig vid milt väder + öppet vatten

### Hemmaplan (riktig)
- **Herosvallen / Herosfältet** — naturskönt beläget vid sjön Norra Barken, Frejgatan 23
- Konstfrusen bandybana
- Området har fotbollsplan, utegym, frisbeegolf, tennisbanor, vandringsleder — typ klassiskt svenskt idrottsplats-komplex
- Barken Arena (fotbollshall) på samma område
- Närliggande Prästabadet — handikappanpassad badplats vid Norra Barken

### Sjöis-historik
- Heros-spelare gick igenom isen på **Örtjärnet i Slottsbron** 1960 (samma dag Forsbacka spelade Köping på Storsjön och Köping sjönk). Tre Heros-spelare i plurret. Det är delade anekdoter mellan Heros, Forsbacka och Slottsbron — den episoden tål referenser i tre klubbars commentary

### Anekdotreservoar
- **Norra Barken som karaktär:** Sjön är central för orten. Sommarens båtliv (ångfartyget Runn från 1907 finns!), vinterns is. Klubbens identitet är knuten till sjön
- **Strömsholms kanal:** Slussar och småbåtar genom orten — ovanlig geografi. Kan vara textur i mecenat-stories ("hans far var slussvakt")
- **Dalarna-lillebror:** Inte Falu BS, inte Borlänge — Smedjebacken är "småstaden i södra Dalarna". Identitet som outsider mot stora syskon
- **1960-incidenten på Örtjärnet:** Generisk version OK ("tre lagkamrater i plurret den dag motståndarlaget Köping sjönk under spel på Storsjön — bandybandet fast i frukosten på krogen efteråt")
- **Konstfrusen identitet:** Heros har fortfarande sin konstfrusna bana — det är en del av klubbens stolthet i bandy-Dalarna

### Lokala detaljer
- Närmaste stad: Ludvika eller Borlänge
- Lokala media: Dalarnas Tidningar, Borlänge Tidning
- Närmaste rival: Tirfing (Avesta), Falu BS, Slottsbron historiskt
- Kulturell markör: Stålindustrin (Ovako), Ångbåtarnas förening, Herrgårds-museet i Västanfors (intressant nog är "Västanfors" en fornlig bydel i Smedjebackens kommun också, inte att förväxla med Fagerstas Västanfors)

### Vad som ALDRIG sägs
- "IK Heros" i text exponerad till spelare (klubbnamnet är "Heros" i spelet, men inte "IK Heros 1915")
- Specifika riktiga spelarnamn

---

## CLUB_KARLSBORG — Karlsborg

### Verklig referens
- **Ort:** Karlsborg / Karlsborgsverken, Kalix kommun, Norrbotten
- **Geografisk position:** Industrisamhälle 4 km sydost om Risögrund, ca 10 km från centrala Kalix, vid Kalixälvens mynning i Bottenviken. Postorten heter **Karlsborgsverken** för att skilja från Karlsborg i Västergötland
- **Befolkning:** Liten — Karlsborg, Vikmanholmen, Skoghem är tre småorter sedan 2015 (förut en tätort)
- **Industri:** **Världens nordligaste pappersbruk** (Billerud Karlsborg, ca 440 anställda). Säckpapper, kraftpapper, pappersmassa. Anor från 1848 (sågverk vid Låsholmen)
- **Historisk bandyklubb:** Karlsborgs BK, bildad 1976, gick i Allsvenskan 1996, lades ner 2022. Tre säsonger i Allsvenskan. Hemmaplan **Bruksvallen**

### Geografi & klimat
- **Topografi:** Kustnära slättland vid älvmynningen, mycket låg över havet, omgiven av skog inåt land. Bottenviken i öster
- **Mikroklimat-arketyp:** `arctic_coast`
- **SMHI-proxy-stationer:** Kalix (~10 km), Haparanda (~50 km öster — gränsen mot Finland)
- **Lokala vädertyper:**
  - Subarktisk klimat — januarimedel ca −12°C, mörker stora delar av matchsäsongen
  - Vinter etablerad redan november, fortsätter ofta till april
  - Långa kalla högtryck — extrem köld inte ovanligt, −25 till −30°C kan inträffa flera gånger per säsong
  - Bottenviken fryser stora delar av vintern — havsisen bidrar till kontinentaliserat klimat
  - Snödjup kan vara 50+ cm under stora delar av säsongen

### Hemmaplan (i spelet)
- **Älvvallen** — vid pappersbruket nära Kalixälvens mynning, klassisk industriort-vall (verkliga klubben hade Bruksvallen, men vi döper om för att undvika dubblett med Söderfors)
- Sopas och röjs ofta — snödjupet kräver konstant arbete
- I april omvandlas planen till skoterbana för en årlig tävling — bandyklubben drog in extrapengar på det

### Sjöis-historik
- Bandyspel skedde initialt på Kalixälvens is och Bottenvikens skyddade vikar
- Älvmynnigen ger blandning sött/saltvatten — komplicerar isläggningen, men ger spelbar is i januari/februari

### Anekdotreservoar
- **Pappersbruket är allt:** Bruket har 440 anställda i en småort — *alla* känner någon som jobbar där. *"Min far körde truck på Billerud i 35 år"*. Skiftarbete strukturerar klubbens schema
- **"Det luktar pengar":** Lokal idiom — sulfatlukten från pappersbruket. Generisk version OK ("luften smakade fabrik")
- **Världens nordligaste:** Klubben kan referera "vi spelar längst norr i bandy-Sverige" — geografisk identitet
- **Köld-rekord-stoltheten:** Att kunna spela när andra ställer in. Att −18°C känns *normalt*. Killar som åker skridskor i shorts på +2°C eftersom det "är som tropikerna"
- **Mörkermatcher:** I december-januari blir det mörkt 14:30 — alla matcher under strålkastare. Speciell stämning
- **Resvägar:** Norrlandsklubbarna har resvägar på 10+ timmar mot sydsvenska bortamatcher. Bussfärder genom natten
- **Tornedalsfinska influenser:** Många i Karlsborg har finska eller meänkielska rötter. Tornedalsk dialekt i läktarsången? Tjänligt material
- **Læstadianska kulturen:** Historiskt stark i området — kontrast mot bandyklubbens fest-och-snus-kultur. Kan vara textur i karaktärsporträtt

### Lokala detaljer
- Närmaste stad: Kalix
- Närmaste storstad: Luleå (~75 km sydväst)
- Närmaste finska grannort: Haparanda → Torneå
- Lokala media: Norrländska Socialdemokraten, Norrbottens-Kuriren, Haparandabladet
- Kulturell markör: Pappersbrukets visselsignal, Kalixälvens mynning, sjömansläsrum från 1936 (Sjömansvårdsföreningen)
- Närmaste rival: Kalix Bandy (Kalix/Nyborg historiskt) — i verkligheten en intern rival där Kalix BK hade 1996-15 nov en första derby-match med Karlsborgs BK på Bruksvallens "kokande gryta"

### Vad som ALDRIG sägs
- "Karlsborgs BK 1976" eller "lades ner 2022"
- "Billerud" specifikt (kan användas generiskt: "pappersbruket")
- Specifika personer från riktiga klubben

---

## CLUB_LESJOFORS — Lesjöfors

### Verklig referens
- **Ort:** Lesjöfors, Filipstads kommun, Värmland
- **Geografisk position:** Vid Lesjöns södra ände i Lesjöälvens dalgång, ca 40 km norr om Filipstad. Nära gränserna mellan Värmland, Dalarna och Västmanland
- **Befolkning:** ~1060 invånare
- **Industri:** Järnbruk Lesjöfors Bruk (anor från 1642). Idag Lesjöfors Fjädrar (fjädrar för fordonsindustri) — ortens största arbetsgivare
- **Historisk bandyklubb:** Lesjöfors IF, bildad 1924, bandy från 1929. **21 säsonger i högsta serien.** Aldrig något SM-guld men semifinal 1974 mot Falu BS. Fostrat **bröderna Bergwall** (Andreas — meste landslagsman genom tiderna med 195 A-landskamper, Marcus med 140), Mikael Forsell, Kjell Kruse — alla VM-guld-vinnare. Spelar nu i lägre divisioner som Lesjöfors IF/Filipstad BF

### Geografi & klimat
- **Topografi:** Älvdalgång omgiven av skogsåsar och berg. Sjön Lesjön söder om orten
- **Mikroklimat-arketyp:** `valley_coldpit` — **DOKUMENTERAT KÖLDHÅL**
- **SMHI-proxy-stationer:** Filipstad (~40 km söder), Karlskoga (~80 km söder)
- **Lokala vädertyper:**
  - **Lesjöfors kallades historiskt "köldhål"** — det är ortens egna smeknamn, dokumenterat i klubbens 90-årsskrift: *"1926 fick föreningens medlemmar den första kontakten med bandy då några pojkar kom upp från Karlstad för att åka skridskor på traktens 'köldhål', som Lesjöfors kallades."*
  - Klassisk inversion: vid vindstilla klar himmel sjunker kall luft från åsarna ner i dalen, värmer inte upp — temperaturen kan vara 5–10°C kallare än omgivande terrasser
  - Snörikt, lång vinter, sen vårkomst
  - Bra naturisförhållanden — det var därför bandy etablerades här

### Hemmaplan (riktig)
- **Stålvallen** (sedan 1967) — fortfarande naturis. Inget konstfruset.
- Tidigare hemmaplaner:
  - **Smeddammen** — 1929-50-tal. Naturis. Plats för Lesjöfors "bandydop" 1931.
  - **Sahara** — 1951 till 1967. Mellanstation mellan Smeddammen och Stålvallen
- Klubbstugan på Stålvallen står kvar, väl underhållen

### Sjöis-historik / förflytta-historik
- **Bandydopet 1931 på Smeddammen:** Vid en hörna på planens norra del, när alla spelare var samlade runt målet, började isen plötsligt sjunka. Många hann inte rädda sig från plurret utan fick dras upp av med- och motspelare. Datum är dokumenterat och är det som kallas "Lesjöfors bandydop"
- **Smeddammen → Sahara → Stålvallen:** Klubben har flyttat hemmaplan tre gånger genom åren. Det är *exakt* den sortens flytt-historia som spelet kan referera: "innan vi var på Stålvallen var vi på Sahara, och innan dess på Smeddammen — där isen sjönk under en hörna 1931 och halva laget plumsade i"

### Anekdotreservoar
- **Köldhål-stoltheten:** "I Lesjöfors fryser vintrarna lite extra." En bygd som *vet* hur kallt det blir när högtrycket sätter in
- **Fostrarmiljön:** Klubben har fostrat världsstjärnor men aldrig själv blivit storklubb. Ungdomarna växte upp på Stålvallen, blev hämtade av Bergslagsklubbar, blev landslagsmän, kom hem för legendarmatcher. Den dynamiken är guld — den lilla bygden som föder elit men aldrig blir elit själv
- **Brukets fall:** Järnbruket (Lesjöfors Bruk) gick under, fjäderfabriken finns kvar. Klassisk bruksort-tragedi
- **Esperanto-fenomenet:** Lesjöfors höll Internationella ungdomsesperantokongressen 2003. *Esperanto-Gården / Skandinava Esperanto-Domo* finns i orten — en kuriös detalj som pekar på en alternativ identitet bredvid bandy. Kan vara textur ("klubbordföranden talar esperanto med sin systerson")
- **"Bandybaronernas storhetstid och fall":** Verklig dokumentärserie från Elitserien 2019 om klubben — ger ton för storhets-perspektivet

### Lokala detaljer
- Närmaste större stad: Filipstad (~40 km), Karlstad (~120 km)
- Lokala media: Värmlands Folkblad, Filipstadstidningen, Nya Wermlands-Tidningen
- Närmaste rival: Filipstad BF, IF Boltic Karlstad
- Kulturell markör: Bruksmiljön, Esperanto-Gården, Lesjöns badplatser, museet om järnbruket
- Inlandsbanan passerar genom orten

### Vad som ALDRIG sägs
- "Lesjöfors IF 1924"
- Bröderna Bergwall, Forsell, Kruse vid namn
- 195 landskamper-rekord
- Specifika SM-händelser från riktiga klubben

---

## CLUB_MALILLA — Målilla

### Verklig referens
- **Ort:** Målilla, Hultsfreds kommun, Kalmar län (Småland)
- **Geografisk position:** Nordvästra Småland, vid Emåns dalgång
- **Befolkning:** ~1525 invånare
- **Industri:** Småindustri, motorisk historia (Calmoverken — luftkylda dieselmotorer från 1957)
- **Historisk bandyklubb:** Målilla GoIF — en av Sveriges mest framgångsrika bandyklubbar. **13 SM-guld**, senast 2009. Småländsk stolthet sedan 1918 (instagram-citat). Fortfarande aktiv

### Geografi & klimat
- **Topografi:** Småländska höglandet, runt 130 m över havet, omgivande skogslandskap
- **Mikroklimat-arketyp:** `sm_highland_extreme`
- **SMHI-proxy-stationer:** Vimmerby (~20 km), Oskarshamn (~50 km öster, kustnära), Vetlanda (~50 km väster)
- **Lokala vädertyper:**
  - **"Sveriges temperaturhuvudstad"** — högsta uppmätta temperatur i Sverige (+38°C, 29 juni 1947, delas med Ultuna). Lägsta i södra Sverige: −33.8°C
  - Extrema utsving — humid kontinentalt klimat, januari/februari medel ~−3°C men mycket variation
  - Mitt på torget står en **15 meter hög termometer** byggd år 2000 — själva symbolen
  - Bandysäsongen: räknat på senaste 10 år oftast plus-minus runt nollan i januari, snöfall vanligare än bestående is
  - Senaste decennium: klimatet glider åt hav-nära riktning, varmare somrar (37.2°C uppmätt i juli 2022)

### Hemmaplan (riktig)
- **Venhagsvallen / Målilla bandybana** — byggd 1934, en av Sveriges äldsta bandyplaner
- Konstfrusen, 107 × 63 meter
- 6 omklädningsrum, belysning, läktare för 900 åskådare
- Spolas oftast först i början av december (elpriser har påverkat starttiden senaste åren)
- Används också till allmänhetens åkning, hockey, evenemang (julmarknad, lucia, karneval, konserter)

### Sjöis-historik
- Bandyplan etablerad redan 1934 — orten har relativt stark bandy-tradition jämfört med övriga Småland
- Småländska bandy-rötter på höglandets sjöar och göl
- **Senaste sjöis-finalen i Sverige spelades 1949 på Perstorpsgölen utanför Eksjö** — ca 60 km nordost om Målilla. Småländsk historia. Generisk version OK: "vid den sista riktiga sjöis-finalen i Sverige stod 17 000 åskådare på en frusen göl"

### Anekdotreservoar
- **Termometern på torget:** En levande symbol. *"Termometern visade −22 i går morse. På Venhagsvallen var det stillastående luft och planen var glas."*
- **Småländsk stolthet:** Klubben är dominant i sitt landskap. Bandy-Sverige tycker att Småland är "fel del av landet" för bandy — Målilla är beviset på att det fungerar
- **Speedway-rivalen:** Målilla är också känt för **Dackarna speedway** — sextonfaldiga svenska mästare. Speedway och bandy delar ortens kärlek. *"Pappa körde Dackarna på 70-talet, jag valde isen"*. Lokala dynamiker
- **Temperatur-extremerna i kulturen:** Folk från Målilla pratar väder. Inte bara *"det var kallt i går"* — utan *"det var −19 i går klockan sju"*. Termometer-besattheten
- **Bruksflicka-Småland:** Mindre tungindustri än Bergslagen, mer småskaligt jordbruk. Annan kultur
- **13 SM-guld senast 2009:** Generisk version: "klubben har en stor guldhylla men ingen ny på över tio år" — det är realistiskt och driver berättelse

### Lokala detaljer
- Närmaste stad: Vimmerby (Astrid Lindgren), Oskarshamn (kärnkraft)
- Närmaste fjälldestination: Inga
- Lokala media: Vimmerby Tidning, Östra Småland, Oskarshamns-Tidningen
- Närmaste rival: Vetlanda BK (riktig elitseriebandy nästgårds), Åby/Tjureda
- Kulturell markör: Astrid Lindgrens värld i Vimmerby, Hembygdsparken med motormuseet, järnvägsknutpunkten

### Vad som ALDRIG sägs
- "Målilla GoIF 1918"
- "13 SM-guld" exakt eller "senast 2009"
- Specifika tränare/spelare från riktiga klubben

---

## CLUB_ROGLE — Rögle

### Verklig referens
- **Ort:** Rögle är en by i Skåne (mellan Ängelholm och Höganäs). I spelet representerar klubben **Skånes / sydvästra Sveriges utomhusbandy**
- **Geografisk position:** Skånes nordvästra hörn, kustnära Kattegatt
- **Bandy-Sveriges Skåne-närvaro:** Mycket svag i verkligheten. **Sjöalt IF** (bildad 1954) i Örkelljunga kommun, gränsen Skåne/Halland, är den klubb som hållit utomhusbandy levande i Skåne. Hade konstfrusen plan vid Kungsbygget — kämpat mot ekonomi
- **Rögle BK** är en *hockeyklubb* från Ängelholm — namnet är taget från orten. I vårt spel är detta en *fiktiv bandyklubb från trakten*

### Geografi & klimat
- **Topografi:** Slättlandskap nära kusten, milt böljande
- **Mikroklimat-arketyp:** `scanian_coast`
- **SMHI-proxy-stationer:** Ängelholm (~10 km), Helsingborg (~25 km söder), Hallands Väderö (kustnära)
- **Lokala vädertyper:**
  - **Mildast i Sverige under vintrarna** — januarimedel +1 till +2°C
  - Plusgrader vanligare än minus under stora delar av säsongen
  - Töväder med regn och dimma normalt
  - "Riktig vargavinter" är *händelsen* — händer få dagar per säsong
  - Konstfrusen plan ABSOLUT NÖDVÄNDIG — naturis går knappt att räkna med
  - Salt havsluft från Kattegatt — fukt påverkar isen
  - Storm från väster är det dramatiska vädret — inte kyla

### Hemmaplan (fiktiv)
- Förslag: namn som speglar kustläget eller Ängelholm-trakten — typ "Strandvallen" (men den finns redan i Slottsbron — undvik dubbletter), eller "Kullavallen" (Kullaberg är nordvästskånsk landmark)
- Konstfrusen plan obligatorisk

### Sjöis-historik
- Skåne har historiskt spelat på små gölar och uppgrävda dammar — frusna sjöar är sällsynta
- Sjöalt IF spelade på "den frusna vattenpölen" vid Kungsbygget (citat från en byggare som beskrev klubbens första plan 1954)
- Generisk: "i Skåne måste man vara kvick — när isen ligger spelar man, två veckor senare är det grus igen"

### Anekdotreservoar
- **Mildast i Sverige-DNA:** Klubben är *unik* — den enda från södra Sverige. Ständig kamp mot vädret. *"Norrländska klubbar förstår inte vad det betyder att hoppas på en kall januari"*
- **Kustnära kulturen:** Sjönärvaron, salt luft, fiskelägen i närheten (Mölle, Arild). Skånsk dialekt och rejäl identitet — inte göteborgsk, inte stockholmsk, *skånsk*
- **Konstfrusen-beroendet:** Klubben *är* sin kylanläggning. Om kylen brister är säsongen körd. Skiljer sig från norrlandsklubbar där natten löser problemet
- **Underdog-rollen:** Skåne är fotboll och hockey. Bandy-traktens svenska bandykarta tycker Skåne inte hör hemma. Trotsande klubb
- **Töväders-trauma:** *"Jag minns finalen 1989 — det regnade hela matchen, isen lös som glas, men det var en centimeter vatten ovanpå"*
- **Hockey-grannrivalen:** Närliggande hockey-Rögle är en kulturkonkurrent. Lokal kulturkrock — *"hockeykillarna får all uppmärksamhet, vi måste tigga för planhyran"*

### Lokala detaljer
- Närmaste stad: Helsingborg, Ängelholm
- Närmaste rivalort: Sjöalt-trakten, Halland-klubbar
- Lokala media: Helsingborgs Dagblad, Nordvästra Skånes Tidningar
- Kulturell markör: Kullaberg, Tånga Hed, Klippan, fiskelägen, sundet mot Helsingör, salta vindar
- Längre bortamatcher: ALLA är längre. Närmaste bandyklubb i Sverige norrut är ett par hundra kilometer

### Vad som ALDRIG sägs
- "Rögle BK" specifikt (hockey-klubben — undvik förvirring)
- "Sjöalt IF" specifikt
- Direkta referenser till Lindab Arena (Ängelholm hockey-arena)

---

## CLUB_SKUTSKAR — Skutskär

### Verklig referens
- **Ort:** Skutskär, Älvkarleby kommun, Uppland
- **Geografisk position:** Vid Dalälvens mynning i Bottenhavet, södra Norrland gränsen
- **Befolkning:** ~6500
- **Industri:** Skutskärsverken (Stora Enso) — kraftpapper, pappersmassa
- **Historisk bandyklubb:** Skutskärs IF, bildad 1915, bandy från 1919 (första matchen på Bodaåns is mot Brynäs IF — förlorade 2-9). Tre SM-guld: **1944**, **1959** och **2018 (dam)**. Publikrekord 28 848 åskådare på finalen 1959 (stod sig till 2013!). Bygget av konstfrusen 1961 — **tredje konstfrusna i Sverige** efter Västerås och Uppsala

### Geografi & klimat
- **Topografi:** Slättlandskap vid älvmynning. Bottenhavet i öster, Dalälven slingrar sig ut. Låg över havet
- **Mikroklimat-arketyp:** `gulf_coast`
- **SMHI-proxy-stationer:** Gävle (~20 km nord), Älvkarleby (~5 km), Forsmark/Tierp (~30 km söder)
- **Lokala vädertyper:**
  - Kustnära klimat — havet modererar både kyla och värme
  - Mildare vintrar än inland Bergslagen, men kallare än Skåne
  - Snödjup måttligt, men stabila vintrar i historisk normal
  - Havsis bildar i Bottenhavet senare än i Bottenviken
  - Dimma vanlig vid lagringsskillnader hav/land
  - Älvmynningens vatten bidrar till lokal fuktighet

### Hemmaplan (riktig)
- **Skutskärs IP** — konstfrusen sedan 1961, nedlagd 2009 (kommunalt beslut), ny konstfrusen byggd 2012 (med ideella krafter, lokala företag, klubbens egna pengar — *utan* kommunal insats)
- Före nedläggningen 2009 hyrde klubben sig in i Sandviken för hemmamatcher — symboliskt smärtsamt

### Sjöis-historik / förflytta-historik
- **Första bandymatchen 1919 på Bodaåns is** — inte hemmaplan utan en å. Förlust mot Brynäs 2-9. Det är den klassiska "vi började på en å"-anekdoten som *exakt* matchar Jacobs commentary-vision
- Spelade på Bodaån och Dalälvens mynning fram till klubben fick eget IP

### Anekdotreservoar
- **"Det luktar pengar":** Pappersbruket Skutskärsverken har samma arbetarvibb som Karlsborg. Brukets kultur strukturerar orten
- **Historisk storhet:** Tre SM-guld, publikrekord 28848 — "när hela samhället var på benen" (1959-finalen). Generisk version OK
- **2009-traumat:** Kommunen lade ner bandybanan. Klubben byggde upp den igen 2012 — *utan* kommunal insats. Berättelsen om föreningens ihärdighet
- **Dam-SM 2018:** Klubben är jämställdhetsmedveten — *"jämställdhet och jämlikhet"* står i klubbens egen presentation. Kvinnobandy-tradition kan vara textur
- **Bodaån-anekdoten:** "På Bodaåns is — där började bandyn här. 1919, 9-2 till motståndarna, men en sport föddes ute på den frusna ån"
- **SAIK-rivaliteten:** Den klassiska "vi mot Sandviken" — närliggande, dominerande, det stora syskonet som vinner allt. Är Skutskärs identitets-konflikt
- **Brukets visselsignal:** Pappersbruket strukturerar dygnet. Skiftarbete, pendling

### Lokala detaljer
- Närmaste stad: Gävle
- Närmaste storstad: Stockholm (~150 km söder)
- Lokala media: Arbetarbladet, Gefle Dagblad
- Närmaste rival: Sandvikens AIK (SAIK) — den evig rivalen, Brobergs IF (Söderhamn)
- Kulturell markör: Pappersbruket, Älvkarleö nationalpark, Dalälvens mynning, fiske

### Vad som ALDRIG sägs
- "Skutskärs IF 1915"
- Specifika SM-finaler vid årtal
- "Stora Enso" (kan vara generiskt "pappersbruket")
- "SAIK" specifikt (men *generisk* närliggande storstadsklubb är OK)

---

## CLUB_SLOTTSBRON — Slottsbron

### Verklig referens
- **Ort:** Slottsbron, Grums kommun, Värmland
- **Geografisk position:** Vid Vänerns strand, strax söder om Grums tätort. Vid Slottsbrosundet — sundet som förbinder Vänern med Glafsfjorden i norr. ~30 km söder om Karlstad
- **Befolkning:** ~1010
- **Industri:** Slottsbrons Sulfit AB (sulfitfabrik från 1897, klubbens grund). Idag småindustri
- **Historisk bandyklubb:** Slottsbrons IF, bildad 1918. **Fyra SM-guld: 1934, 1936, 1938, 1941.** "Blåtomtarna." 31 säsonger i högsta serien (1932-65). **VM 1997 spelades på Strandvallen.** Konstfrusen kylanläggning monterades ner 2014 (för dyrt att reparera). Klubben hyrde sedan Tingvalla i Karlstad. Idag aktiv i lägre divisioner

### Geografi & klimat
- **Topografi:** Vid Vänerns nordliga strand, Slottsbrosundet, slättland med skog runt
- **Mikroklimat-arketyp:** `vanern_effect`
- **SMHI-proxy-stationer:** Karlstad (~30 km nord), Säffle (~25 km söder), Grums-närliggande
- **Lokala vädertyper:**
  - **Vänern-effekten:** Stor vattenmassa fördröjer både istäcke och vårens uppvärmning. Dimma vanlig vid milt väder + öppet vatten
  - Mildare än inland Värmland (typ Lesjöfors) tack vare sjön
  - Sen istäcke över själva Vänern — sundet i Slottsbron är bland de senaste platser i sjön där isen lägger sig
  - Storm från Vänern kan vara dramatiskt — fri sträcka över vattnet
  - Snödjup måttligt, men stabila vintrar är inte säkra

### Hemmaplan (riktig)
- **Strandvallen** — vid Vänerns strand. Klassisk gammal arena
- VM 1997 spelades här — bandyhistorisk plats
- Konstfrusen kylanläggning monterades ner 2014 — orsaken: 1.5-2 miljoner kr för reparation, klubben hade inte råd
- Sedan 2014: naturis när det blir kallt nog (sällan), annars hyrt Tingvalla i Karlstad
- Ungdomslagen tränar fortfarande på Strandvallen

### Sjöis-historik / förflytta-historik
- Historiskt: bandy spelad på Vänerns is när det var kallt nog
- **1960-incidenten på Örtjärnet:** Tre Heros-spelare gick genom isen på Örtjärnet i Slottsbron — samma dag som Forsbacka spelade Köping på Storsjön och Köping sjönk. Den händelsen är delad mellan Heros och Slottsbron — för Slottsbron är det "den dag motståndarlaget plumsade i på vår hemmaplan"
- Strandvallen från ca 1930-tal som dedikerad bandyplan

### Anekdotreservoar
- **Sven-Ingvars-fadern:** Sven-Erik Magnusson (sångaren i Sven-Ingvars) växte upp i Slottsbron. Bandet bildades 1956 av Sven Svärd och Sven-Erik från Slottsbron + Ingvar Karlsson från Liljedal. Generisk version: "ortens namn på kartan står för en klubb och ett dansband"
- **VM 1997:** Världsmästerskapen spelades på Strandvallen. Generisk version: "på den här planen har VM avgjorts"
- **Konstfrusen-tragedin 2014:** Klubben fick montera ner sin konstfrusen för dyrt att reparera. Kämpat med naturis sedan dess. Klassisk värmländsk klimatbandy-tragedi
- **"Blåtomtarna":** Smeknamnet är generiskt nog att kunna användas — bygger på lagets blå färg + småskalighet
- **Vänerns gränsläge:** Klubben är "vid sjön" — orten *är* en bro över sundet. Vatten är central
- **Brukstraditionen:** Slottsbrons Sulfit AB grundades 1897, samhället växte upp runt det. Brukshistoria

### Lokala detaljer
- Närmaste stad: Karlstad (~30 km nord), Säffle (~25 km söder)
- Lokala media: Värmlands Folkblad, Nya Wermlands-Tidningen
- Närmaste rival: IF Boltic Karlstad, Karlstad/Götaland historiskt
- Kulturell markör: Vänern, Sven-Ingvars, Slottsbrosundet, sulfitbruket
- Mickelsön ("Öna") — natursköna ön i sundet, badplats sommartid

### Vad som ALDRIG sägs
- "Slottsbrons IF 1918"
- Sven-Ingvars vid namn
- "Tingvalla" specifikt (kan generiskt vara "närliggande storstadsklubbens konstfrusna")
- "VM 1997" — kanske, möjligt — men inte specifikt år

---

## CLUB_SODERFORS — Söderfors

### Verklig referens
- **Ort:** Söderfors, Tierp kommun, Uppland
- **Geografisk position:** På en ö (**Jörsön**) i Dalälven, ~25 km nordväst om Tierp. Bruksort isolerat i skogen
- **Befolkning:** ~1700 (uppskattat)
- **Industri:** Söderfors bruk — Sveriges enda **ankarsmedja** historiskt, byggd 1690 av Claes Anckarström, har tillverkat ankaren för flottan. Halva orten är sedan 1985 byggnadsminne — Sveriges till ytan största
- **Historisk bandyklubb:** Söderfors GoIF, bildad 1904, bandy från 1922. Klubbfärger orange-svart-vit. Aldrig nått allsvenskan — kvalade 1951 (mot Skutskär) och 1952 (mot Broberg) men förlorade båda gångerna. DM-guld 1951

### Geografi & klimat
- **Topografi:** Bruksort på ö i Dalälven, omgiven av älven på flera sidor, djupt inbäddad bland barrträd. Inom 1.5 km radie finns inget annat än skog
- **Mikroklimat-arketyp:** `bruk_river_island`
- **SMHI-proxy-stationer:** Tierp (~25 km), Älvkarleby (~30 km östnordost), Gävle (~50 km nord)
- **Lokala vädertyper:**
  - Älvens närvaro överallt — tidig is på smala armar, sen is på huvudströmmen
  - Skogsbäddat — ger viss vindskydd, men fuktig luft från älven
  - Färnebofjärdens nationalpark öster om — vild natur, älvtätt landskap
  - Stabila uppländska vintrar, snödjup måttligt

### Hemmaplan (riktig)
- **Bruksvallen** (ja, samma namn som Karlsborg använder — det är ett **vanligt** namn på arenor vid bruk; tre av våra klubbar har "vall" i namn) — sedan tidigt 1950-tal
- Klubbmärket pryder en romersk båge i sten med vackra järnsmiden — entrén
- Längs ena långsidan en murken trappformad stockläktare — knappt urskiljbar idag
- Klubbstuga med café finns kvar
- Klassisk bruksbana-känsla — överigven gammal folkpark vibe

### Sjöis-historik / förflytta-historik
- **1922-1951: spel på Dalälvens is på diverse platser runtom Söderfors** — exakt den sortens "vi flyttade efter var isen var bäst"-historia som spelet kan berätta
- Bruksvallen från 1950-talet — då kom också klubbens guldperiod (DM 1951)

### Anekdotreservoar
- **Ankar-DNA:** Sveriges enda ankarsmedja. Det är sjösstrumpig och unikt. Inte vilken bruksort som helst
- **Ön i älven:** Söderfors är *bokstavligen* en ö. Jörsön i Dalälven. Geografiskt isolerat. *"Vägen till matchen går över bron"*
- **Förfallets fascination:** På 00-talet var Hästhagen — det övergivna bostadsområdet — turistmål för "urban explorers". Sönderfors hade en attraktiv förfalls-period. Idag är halva byn byggnadsminne. Bruksort-melankoli
- **Patrik Nilsson som mall:** Klubben fostrade en målspruta som blev rysslandsproffs. Generisk version OK ("ortens stora son drog till Ryssland som proffs")
- **Domarens kvalets däng 1951/52:** Två gånger förlorat allsvenska kval — "om vi vunnit hade vi varit i samma klass som Lesjöfors och Hälleforsnäs". Klassisk "what if"-historia
- **Bruksandan:** *"Robert Strand, brukets dåvarande chef, skapade klubben"* — riktig historia. Brukschef + idrottsförening är en återkommande kulturell figur i bandy-Sverige
- **Färnebofjärdens vildmark:** Närheten till nationalpark — älg, björn, naturupplevelser. Dalälvens nedre lopp är vild natur

### Lokala detaljer
- Närmaste stad: Tierp, Älvkarleby
- Närmaste storstad: Gävle (~50 km), Uppsala (~70 km söder)
- Lokala media: Arbetarbladet, Gefle Dagblad, Upsala Nya Tidning
- Närmaste rival: Skutskärs IF (verkligheten — kvalade mot Skutskär 1951)
- Kulturell markör: Söderfors Herrgård (1690-tal), Färnebofjärdens nationalpark, ankarsmedjan, bruksparken, Anckarström-arvet (mördaren av Gustav III var av samma släkt)

### Vad som ALDRIG sägs
- "Söderfors GoIF 1904"
- Patrik Nilsson, Erik Pettersson vid namn
- "Anckarström" eller specifika historiska personer
- Att klubben aldrig nådde allsvenskan — i spelet kan klubben ha andra meriter

---

## CLUB_VASTANFORS — Västanfors

### Verklig referens
- **Ort:** Västanfors, södra stadsdelen i Fagersta, Norbergs kommun → numera **Fagersta kommun**, Västmanland
- **Geografisk position:** Vid Norra Barken (samma sjö som Smedjebackens Heros — bara längre söder). Bergslagsmiljö
- **Befolkning Fagersta tätort:** ~10 000
- **Industri:** Stålindustri (Seco Tools, Outokumpu), tidigare järnverk
- **Historisk bandyklubb:** Västanfors IF, bildad 1916, smeknamn **"Västanfläkt" / "Fläkten"**. Röd-vita lagfärger. **SM-guld 1954.** **32 säsonger i högsta divisionen.** Aktiv idag. Damlaget vann SM 1983 och 1985, silver 1984

### Geografi & klimat
- **Topografi:** Bergslagslandskap, vid Norra Barkens norra strand (Smedjebackens Heros är vid sjöns *södra* ände — samma sjö, två klubbar)
- **Mikroklimat-arketyp:** `bruk_lakeside`
- **SMHI-proxy-stationer:** Fagersta (egen station möjlig), Avesta (~30 km öster), Borlänge (~80 km nordväst)
- **Lokala vädertyper:**
  - Klassiskt Bergslagsklimat — stabila vintrar, snödjup som ligger
  - Norra Barken stor sjö — fuktig luft, fördröjt istäcke
  - Måttlig kyla men inte extrem (Fagersta är kallare än Stockholm men varmare än Karlsborg)
  - Bandysäsong tradition oktober-mars

### Hemmaplan (riktig)
- **Västanfors IP** — bandyplan sedan 1935. **Landets äldsta landbana för bandy.** Konstfrusen
- Allmänhetens åkning vintertid (mån-fre 10-14:30, sön 16:30-18:00 enligt grundschema)
- Kommunen bokar planen för skolverksamhet och föreningar
- Säsong slutet av oktober till början av mars

### Sjöis-historik
- Klubben startade 1916, bandy som naturligt sportval i Bergslagen
- Norra Barkens is när väder tillät — generisk användning
- Bandyplanen från 1935 markerar slutet på sjöis-eran för klubben

### Anekdotreservoar
- **"Fläkten":** Smeknamnet är generiskt nog att kunna användas — "västanfläkt" som metafor för snabbt anfallsspel
- **SM-guld 1954:** Klubben har "gammalt guld" — det är *en* berättelse, men det är ett halvt århundrade sedan. Ger nostalgisk dimension
- **Fostrarmiljö:** Klubben har fostrat spelare som gjort karriär i VSK Bandy (Västerås) — Wilhelm Frimodig, Lars Gustafsson, familjen Boström m.fl. *"Vår moderklubb-stolthet är en av Sveriges största styrkor"*
- **Landets äldsta landbana från 1935:** En utmärkande egenskap. *"På denna is har det spelats bandy i nittio år"*
- **Bergslags-DNA:** Stålverk, gruvor, Bergslagsbanan, järnvägen — industriell rytm
- **Damframgångar:** Klubben var stor på damsidan på 80-talet. Genuskullig Bergslagen — kan vara textur
- **2026-arrangemanget:** Klubben stod värd för en allsvensk match (VSK vs Vetlanda) på Västanfors IP januari 2026 — *"bandyn tillbaka under bar himmel"* — VSK Bandy ville lyfta historiska arenor. Bra inramning för klubbens identitet

### Lokala detaljer
- Närmaste stad: Fagersta är centralort
- Närmaste storstad: Västerås (~70 km söder)
- Lokala media: Fagersta-Posten, Bärgslagsbladet/Arboga Tidning
- Närmaste rival: VSK Bandy (Västerås), Tillberga BK (Västerås), Tirfing (Avesta)
- Kulturell markör: Strömsholms kanal (slussar genom orten), bergslagsfika, järnverken, Bergslags-museum

### Vad som ALDRIG sägs
- "Västanfors IF 1916"
- "1954" specifikt
- VSK-spelarnas riktiga namn
- "Västanfläkt" är acceptabelt — det är generiskt och kan användas i spelets fiktion

---

## BILAGA A — 1960 års isgenomgångs-incident (delad anekdot)

**Datum:** 1960 (mildvinter)
**Inblandade klubbar:** Forsbacka, Heros, Slottsbron, Köping (som inte är klubb i spelet)

Två separata incidenter samma dag:
1. På **Storsjöns is** vid Forsbacka spelade Forsbacka mot Köping — **Köping sjönk till botten**. Lagets spelare räddades av motståndarlaget och åskådare
2. På **Örtjärnet i Slottsbron** sjönk **tre Heros-spelare** genom isen under spel

Detta är **den sista matchen där bandylag gick genom isen** i toppserierna i Sverige. En bandyhistorisk slutpunkt — efter detta blev konstfrusen normen. Episoden är delbar mellan tre klubbar i vårt spel:
- **Forsbacka:** "På Storsjöns is. Det var motståndarlaget som plumsade i."
- **Heros:** "Tre lagkamrater i plurret samma dag motståndarna i Forsbacka gick under på Storsjön."
- **Slottsbron:** "På Örtjärnet, där Heros-spelarna gick genom isen."

**Användning:** Som "gamla bandygubbar minns"-anekdot. Generisk — exakt år och inblandade lag NÄMNS INTE. Men händelsens *karaktär* (sista riktiga sjöis-matchen där lag gick i plurret) är guld i commentary.

---

## BILAGA B — Bandyspelets sjöis-tradition

**Senaste bandyfinalen på sjöis:** 1949, **Perstorpsgölen utanför Eksjö**, ca 17 000 åskådare (14 809 betalade entré). Smålandsk bandyhistoria. Ges till Målilla som geografisk närhetsanekdot ("vid den sista riktiga sjöis-finalen i Sverige stod 17 000 åskådare på en frusen göl strax norr om vår hemmaplan").

**Historiska finalspeltal på sjöis:** Åtta finaler arrangerades på frusna sjöar och åar mellan tidigt 1900-tal och 1949.

**Generisk användning:** Bandyspel i Sverige föddes på sjöar. Konstfrusen kom på allvar med Västerås (första), Uppsala (andra), Skutskär (tredje, 1961). Innan dess var alla matcher beroende av väder + sjöns kvalitet. Klubbar **flyttade mellan olika sjöar och gölar** beroende på var isen var bäst eller låg.

Det är denna tradition som ger commentary-stoff:
- *"Klubbens första hemmaplan var Smeddammen — på sjöis. 1931 sjönk isen under en hörna och halva laget plumsade i. Idag är vi på Stålvallen, men gamla bandygubbar minns."* (Lesjöfors)
- *"Innan IP fanns spelade laget på Bodaån här i sluttningen. Då la man matchen efter var isen var bäst, inte efter när domaren hade tid."* (Skutskär, från 80-årings perspektiv)
- *"Pappa berättade om Storsjöns is — när hela samhället stod runt och tittade på matchen i januari, och klacken klädde sig i fårskinnpälsar."* (Forsbacka)

---

## BILAGA C — Bandyregler för väder (mekaniska)

**Källa:** Svenska Bandyförbundets Spelregler 2025/2026

**Köldbestämmelser senior:**
- Under **−17°C**: matchen spelas **3×30 minuter** med pauser maximalt 15 min mellan perioderna (för uppvärmning)
- Under **−22°C**: matchen **ställs in**

**Köldbestämmelser ungdom (P/F 20):**
- Under −15°C: 3×30 minuter
- Under −20°C: matchen ställs in

**Snöfall/regn:** Domaren kan besluta att matchen spelas i flera perioder för röjning. Avblåsning bör ske då spelet är i "neutral zon".

**Tät dimma och storm:**
- Om matchen inte börjat: uppskjuts upp till 45 minuter, sedan inställs
- Om matchen påbörjats: avbryts (kan ske flera gånger) tills sikten återvänder

**Mörkrets inbrytande, ospelbar plan:** Domaren har rätt att inställa, avbryta eller bryta matchen.

Detta används som **mekanisk koppling** i spelet — vädret påverkar inte bara stämning utan även matchformat och om matchen ens spelas.

---

## BILAGA D — Hemmaplan-namn-överväganden

Hemmaplan-namn i spelet (verifierat mot `worldGenerator.ts` CLUB_TEMPLATES):

| Klubb | Arenanamn i spelet | Klacknamn i spelet | Verklig motsvarighet |
|---|---|---|---|
| Forsbacka | **Slagghögen** | Järnklacken | Mariehov (Forsbacka IK) |
| Gagnef | **Älvvallen** | Dalkurvan | Ej dokumenterad arena |
| Hälleforsnäs | **Gjutarvallen** | Härdarna | Edströmsvallen (Hälleforsnäs IF) |
| Heros | **Hedvallen** | Hjältarna | Herosvallen (IK Heros) |
| Karlsborg | **Bastionen** | Norrskensklacken | Bruksvallen (Karlsborgs BK) |
| Lesjöfors | **Kolbottnen** | Skogsklacken | Stålvallen (Lesjöfors IF) |
| Målilla | **Hyttvallen** | Glasblåsarna | Venhagsvallen (Målilla GoIF) |
| Rögle | **Planlunden** | Sydkurvan | Ej entydig (hockey-Rögle) |
| Skutskär | **Sulfatvallen** | Fabrikskurvan | Skutskärs IP (Skutskärs IF) |
| Slottsbron | **Forsvallen** | Bropelarna | Strandvallen (Slottsbrons IF) |
| Söderfors | **Ässjan** | Hammarsmederna | Bruksvallen (Söderfors GoIF) |
| Västanfors | **Schaktvallen** | Bergskurvan | Västanfors IP (Västanfors IF) |

**Notering:** Alla arenanamn i koden är fiktiva, atmosfäriska och bruks-/industri-färgade. **Inga dubbletter.** De är medvetet starkare som spelnamn än de verkliga skulle ha varit (Slagghögen är till exempel mer evokativt för en bruksort än Mariehov). Använd alltid arenanamnet från koden i UI och commentary — verkliga arenanamn nämns ALDRIG i spelet.

**Klacknamn-konsistens:** Supportergrupperna är också väl matchade till respektive ortsidentitet — Hammarsmederna för Söderfors (ankarsmedja), Norrskensklacken för Karlsborg (arktiskt), Glasblåsarna för Målilla (småländsk hantverkstradition), Skogsklacken för Lesjöfors (skogsbygd).

---

## Slut KLUBBFAKTA
