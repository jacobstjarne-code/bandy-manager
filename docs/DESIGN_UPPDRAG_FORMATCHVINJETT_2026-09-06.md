# DESIGN_UPPDRAG — förmatchvinjett mot ny motståndare

**2026-09-06 · Opus · beställt av Jacob · pekas till Design av Jacob**

## Vad det är

En vinjett som visas första gången du möter en klubb i en karriär: ortbilden plus
två-tre rader som ger motståndaren kropp — så en motståndare är en plats med en tränare
och en historia, inte en rad i en tabell. Klubb-scenerna (ortillustrationerna) är det
som lyfter spelet; det här låter dem bära förmatchen.

**Det är en STÄMNINGSYTA, inte ett steg med val.** Taktik och laguttagning är steg (man
väljer något). Vinjetten passerar man — ett andetag som ger motståndaren kropp innan
avspark. Skillnaden är hela poängen: gör den till ett klick-bort-steg blir den friktion;
låt den glida förbi för snabbt och den hinner inte landa.

## Designfrågan (det här är vad Design löser)

1. **Var i matchflödet** ligger vinjetten? Före laguttagning, eller mellan laguttagning
   och taktik? (Matchflödet städas samtidigt: taktik tillbaka som steg, autofyll till en
   sektion — se separata rader. Design bör se hela flödet i ett svep, inte tre lösryckta
   ingrepp.)
2. **Hur passerar man den?** Sveps bort, kort paus, tap för att gå vidare?
3. **Bara första mötet** mot varje klubb. Triggern finns redan i koden (Berättaren-
   callbacksystemet använder "första gången mot den här klubben" för återkomst till gamla
   klubbar) — samma krok.
4. **Layout:** hur ortbilden, vinjett-texten och den variabla infon (nedan) samsas.

## Bilderna Design har att använda

De tolv ortillustrationerna, låsta/körda 2026-09-06 (se
`ILLUSTRATIONER_KATALOG_2026-09-04.md` för konstriktning och per-ort-noter; Jacob visar de
renderade bilderna). Filnamn `intro_<slug>.jpg`. Klubb → arena → klack:

| Klubb | Arena (i bild) | Klack | Bildfil |
|---|---|---|---|
| Forsbacka | Slagghögen | Järnklacken | `intro_forsbacka.jpg` |
| Gagnef | Älvvallen | Dalkurvan | `intro_gagnef.jpg` |
| Hälleforsnäs | Gjutarvallen | Härdarna | `intro_halleforsnas.jpg` |
| Heros | Hedvallen | Hjältarna | `intro_heros.jpg` |
| Karlsborg | Bastionen | Norrskensklacken | `intro_karlsborg.jpg` |
| Lesjöfors | Kolbottnen | Skogsklacken | `intro_lesjofors.jpg` |
| Målilla | Hyttvallen | Glasblåsarna | `intro_malilla.jpg` |
| Rögle | Planlunden | Sydkurvan | `intro_rogle.jpg` |
| Skutskär | Sulfatvallen | Fabrikskurvan | `intro_skutskar.jpg` |
| Slottsbron | Forsvallen | Bropelarna | `intro_slottsbron.jpg` |
| Söderfors | Ässjan | Hammarsmederna | `intro_soderfors.jpg` |
| Västanfors | Schaktvallen | Bergskurvan | `intro_vastanfors.jpg` |

## Variabel info tillgänglig (ur kod — det gamla förmatch-läget)

Grundat i `PreMatchContext.tsx` + `opponentManagerService.ts` (verifierat), inte en
önskelista. Det här är vad som KAN ligga på vinjetten utöver den statiska texten:

**Motståndarens tränare** (`opponentManagerService`, `Club.opponentManager`):
- Namn
- Persona: confident / defensive / cryptic / professorial
- År vid klubben (1–8)
- Ett persona-baserat citat (`generatePreMatchOpponentQuote`) — samma som låg på gamla scenen

**Läge i serien** (`PreMatchContext`-triggarna, `standingsService`):
- Motståndarens tabellplacering + poäng
- Egen placering + poäng
- Derby-flagga (`rivalries.ts` — t.ex. Bruksderbyt Lesjöfors–Hälleforsnäs, Daladerbyt Gagnef–Heros)
- Egen vinst-/förlust-streak (≥3)
- Motståndarens form senaste 5, hemmaobesegrad-streak

**Statiskt per klubb:** arenanamn, klacknamn (tabellen ovan), ortkaraktär (`KLUBBFAKTA.md`),
och vinjett-texterna nedan.

Not: den gamla `PreMatchContext` valde EN kontext-trigger (derby > streak > tabell > form).
Om vinjetten övertar den rollen ärver den den prioriteringen — Design avgör om tränar-
citatet och kontext-raden båda får plats eller om vinjetten väljer en.

## Vinjett-texterna (Opus, klara — statisk rad per klubb)

Register: understatement, bandy-Sverige. Exponerar bara det tillåtna (fiktiva arena-/
klacknamn, ortkaraktär) — aldrig riktiga klubbnamn, personer eller exakta guldår.

- **Forsbacka:** Järnverksbyn vid Storsjöns utlopp, inklämd mellan Gävle och Sandviken, den lilla orten som aldrig fick vara störst. Gula Faran åkte upp och ner mellan serierna sex gånger. På Slagghögen ligger isen när vädret vill — inte när matchprogrammet säger.
- **Gagnef:** Där Öster- och Västerdalälven möts, nedanför fjällen och ovanför Mälardalen. Här är längdskidan kung och bandyn får slåss om uppmärksamheten. Dalkurvan står på Älvvallen ändå, trogen och fåtalig.
- **Hälleforsnäs:** Brukets Blå från Sörmland, där gjuteriet gått sedan sextonhundratalet. Klubben lever på bilbingo och envishet lika mycket som på bandy. På Gjutarvallen hänger en semifinal från förr på väggen, och Härdarna pekar gärna på den.
- **Heros:** Stålbyn vid Norra Barkens norra ände, där Strömsholms kanal slussar sig genom orten. Södra Dalarnas lillebror, i skuggan av de stora. Hjältarna har sin konstfrusna is på Hedvallen och dimman som lägger sig över sjön.
- **Karlsborg:** Längst norrut i bandy-Sverige, vid Kalixälvens mynning i Bottenviken, där pappersbruket har fyrahundra man och alla känner någon som jobbar där. Här är arton minus normalt. Norrskensklacken sjunger på Bastionen i mörker som fallit redan på eftermiddagen.
- **Lesjöfors:** Köldhålet i den värmländska dalgången, där kalluften sjunker ner om nätterna och vintern håller i sig längst. Bygden har fött landslagsmän utan att själv bli stor — de växte upp på isen och hämtades av andra. Skogsklacken på Kolbottnen har sett många bussar lämna orten.
- **Målilla:** Smålands temperaturhuvudstad, där termometern på torget är femton meter hög och folk säger graderna på decimalen. Guldhyllan är stor men den nyaste pjäsen har över tio år på nacken. Glasblåsarna på Hyttvallen delar orten med speedwayn.
- **Rögle:** Bandyns ensamma utpost i Skåne, där januari sällan bjuder minusgrader och isen är en kylanläggnings förtjänst, inte vinterns. Här är bandy en trotsig sport i fotbollens och hockeyns land. En kall vecka firas på Planlunden som annorstädes firar en seger.
- **Skutskär:** Pappersbrukets ort vid Dalälvens mynning, med gammal storhet i väggarna — en tid när hela samhället stod runt planen. Grannen vinner allt; Fabrikskurvan på Sulfatvallen har gjort skuggan till en identitet. Här luktar det fabrik.
- **Slottsbron:** Blåtomtarna vid Vänerns strand, där sundet är det sista som lägger sig när kylan kommer. En gång stod mästerskap på den här isen. Det gamla guldet väger fortfarande i klubbhuset på Forsvallen.
- **Söderfors:** Bruksorten på en ö i Dalälven, där Sveriges enda ankarsmedja en gång smidde järn åt flottan. Vägen till matchen går över bron, in i skogen, till en by där halva orten är byggnadsminne. På Ässjan står en trappformad stockläktare som knappt syns längre.
- **Västanfors:** Fläkten från Bergslagen, vid Norra Barkens södra ände — samma sjö som Heros, andra änden. På Schaktvallen har det spelats bandy i nittio år, landets äldsta landbana. Härifrån har spelare gått vidare till de stora, och Bergskurvan räknar det som en merit.

## Vem gör vad

- **Design:** ramen (var i flödet, hur man passerar, layout av bild + text + variabel info).
- **Opus:** texterna (klara ovan). Landas i en datafil i den form Design sätter.
- **Code:** triggern (första mötet, samma krok som Berättaren-callbacken) + wiringen; datan
  måste finnas för alla tolv (vilken som helst kan vara din klubb en annan karriär) och
  filtreras på `managedClubId` (du får aldrig din egen som förmatchvinjett).

## Scope-not

Ny stämningsyta mot helhetsrapportens "inga fler system före release" — men den återanvänder
en befintlig trigger (första mötet) och befintliga bilder, och texten är skriven. Jacob har
bejakat den. Håll den till vinjett (bild + text + befintlig variabel info), inte ett nytt
system med egen logik.
