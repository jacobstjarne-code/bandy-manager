# DOM — ANLÄGGNINGSTRÄDETS SLUT

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O17 i `SLUTTEST_KO.md`
**Underlag:** långspelsauditen (10 säsonger, Västanfors), framgångsauditen.

---

## Fyndet

Det vanliga byggträdet gick att tömma på ungefär tio säsonger: Värmestuga, Kiosk, Läktare östra, Belysning, Träningshall, Akademi 2, Akademi 3, Strålkastare och Gym. Matchhallen låg kvar som separat Prövning och testades aldrig.

När trädet var fullt försvann framåtdriften. Auditens svar på vad som fick spelaren att fortsätta år sex: slutspelsdrama, nya byggnoder och nyfikenhet på berättelserna. **Två av tre tar slut, och byggnoderna var den enda som gick att räkna ner mot.**

Sammanlagt kostade trädet 1,72 mkr i engångskostnader. Vid år tio låg kassan på 9,9–11,0 mkr, och de kvarvarande noderna kostade 80–380 tkr. De var inte beslut, de var klickningar.

---

## Domen — tre delar

### 1 · Ett fullt träd är ett tillstånd, inte ett tomrum

När alla vanliga noder är byggda ska Bygget säga vad klubben har blivit, inte visa en lista utan nästa rad.

**Texten, när trädet är fullt:**

*Allt som gick att bygga är byggt. Nu handlar det om vad ni gör med det.*

Under den: en sammanställning av vad som faktiskt finns — antal noder, vilken säsong de färdigställdes (`builtSeason`, som finns sedan `4.11`-arbetet), och den totala driften per säsong när `O5` är byggd.

**Det är också en `O18`-post.** Ett fullt träd är en av de saker årsboken ska minnas: den säsong klubben blev färdigbyggd.

### 2 · Hallprövningen är horisonten, men bara om byggandet kostar

`HallProvningScreen` finns och är enligt Designs granskning rätt avgränsad. Den är det naturliga endgame-projektet.

**Men den fungerar bara om `O5` håller.** En hall som kostar tre miljoner mot en kassa på elva är samma klickning som de sista noderna. Auditens formulering: hallprövningen måste föregås av en ekonomi där byggandet fortfarande kostar något.

**Alltså:** hallprövningen öppnas när trädet är fullt, men den är en horisont först efter `O5`. Innan dess är den en till checklista-rad.

### 3 · Att avveckla är ett beslut som saknas

I dag är en byggd nod byggd för alltid. Med drift (`O5` del 2) blir det för första gången meningsfullt att lägga ner något.

**Det gör kartan levande.** En kiosk som går back år efter år, en läktare som kostar mer i underhåll än den drar in — att kunna stänga den är ett val, och det är ett val med lokal kostnad. `communityStanding` faller när något stängs. Det uppfyller varsel-mallens punkt 4 och 5: två system som pekar isär.

**Byggs inte nu.** Det är den enda delen som kräver ny mekanik, och den väntar på `O5`.

---

## Vad domen inte är

**Inte fler noder.** Att förlänga trädet med sex nya noder skjuter problemet fem säsonger framåt och löser ingenting. Auditerna säger tydligt: färre och tyngre, inte fler.

**Inte en oändlig uppgraderingsstege.** Nivå 4, 5, 6 av samma anläggning är en räknare, inte en horisont.

**Inte ett nytt system.** Delarna finns: `facilityNodes`, `builtSeason`, `HallProvningScreen`, `communityStanding`. Det som saknas är ett tillstånd, en gate och ett beslut.

---

## Ordning

**Del 1 kan byggas nu.** Ett fullt-träd-tillstånd med text och sammanställning kräver ingenting utöver det som finns. Den ligger i `4.4`:s närhet — samma fil, samma yta.

**Del 2 gatas nu, öppnas efter `O5`.** Låt hallprövningen kräva fullt träd redan i dag; den blir meningsfull när ekonomin håller.

**Del 3 väntar på `O5` del 2** (driftskostnaden). Utan drift finns inget skäl att avveckla något.

---

## Godkänd när

En spelare med fullt utbyggd anläggning kan säga vad nästa projekt är — och varför det är svårt.

I dag kan hen säga att det inte finns fler.
