# DOM — ÅRSBOKEN SOM KARRIÄRENS RYGGRAD

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O18 i `SLUTTEST_KO.md`
**Underlag:** långspelsauditen, stickiness-auditen, framgångsauditen.

---

## Fyndet

`K3` lagade att karriärminnet kapades vid fem säsonger. Det som återstår är att de bevarade säsongerna inte bär en båge.

Långspelsauditen efter tio säsonger: Historik visar bra statistik och bevarar rekord — fem SM-guld, sju cuptitlar, Sven Lund 445 mål, Folke Lindgren 544 matcher. Men den narrativa sammanfattningen bygger ingen pålitlig karriärbåge.

Delbarhetsauditen hittade orsaken: `History` bär per säsong en enda `narrativeSummary`-textrad. Går du tillbaka och tittar på säsong ett från säsong fyra finns bågarna inte där.

**Tio fristående år, inte en historia.** Och eftersom Historik är den yta som ska bli Bandyarkivet i best-in-class-strategin är det också tillväxtblockerande — man kan inte följa en karriär som inte minns sig själv.

---

## Domen — vad `SeasonSummary` ska bära

Utöver dagens innehåll, fem fält. Alla är data som redan finns eller genereras — inget kräver ny mekanik utom `O3`.

**1 · Spelarens eget mål och utfall** (`O3`). Måltyp, referens, utfall. Tre fält. Detta är den viktigaste posten: den gör säsongen till något spelaren **hade tänkt sig**, inte bara något som hände.

**2 · Säsongens viktigaste beslut.** Ett, valt maskinellt: den systemhändelse (`O19`-märkning) spelaren löste med störst mätbar konsekvens. Beslut, val, och vad det kostade i kronor eller personer.

**3 · Största personförändring.** En rad: den spelare vars situation ändrades mest — slutade, kom upp, gick från reserv till bärande. Personerna är spelets styrka enligt tre auditer; de ska finnas i minnet.

**4 · Rivalitetens ställning.** Mot vem, och hur det gick den säsongen. `coachRivalries` och `h2h`-fälten finns redan i `managerProfile`.

**5 · Klubbens epok vid årets slut.** `calculateClubEra` finns och används redan i Klubben-i-korthet. Att lagra den per säsong gör epokskiften synliga i efterhand — vilket år klubben slutade vara nykomling.

---

## Regeln som gör det till en båge

**Ett fält per säsong, aldrig en lista.** Frestelsen är att spara allt. Tio säsonger med tio beslut var är hundra rader ingen läser — samma fel som eventkön har i dag.

**Det som lagras ska vara det som skiljer säsongen från de andra.** En säsong där ingenting särskilt hände ska bära färre fält, inte utfyllnad. Historik ska kunna säga *2029/30: ingenting särskilt. Sjätte plats, ekonomin höll.*

---

## Texten i Historik

Formen per säsong, uppifrån: säsong och placering, sedan de fält som faktiskt har innehåll.

**Målraden** (ur `O3`, texten låst där):
- *Du sa {mål} i somras. Du gjorde det.*
- *Du sa {mål} i somras. Det saknades inte mycket.*
- *Du sa {mål} i somras. Det blev inte så.*
- *Du lovade ingenting i somras. Det höll du.*

**Beslutsraden:**
- *Du {beslut}. Det kostade {kostnad}.*

**Personraden:**
- *{Namn} la av efter {N} säsonger.*
- *{Namn} kom upp och blev kvar.*
- *{Namn} gick från reserv till given.*

**Epokraden**, bara när epoken skiftade:
- *Det här året slutade {Klubb} vara {gammal epok}.*

**Rivalraden:**
- *{Rival}: {V}–{O}–{F} den säsongen.*

---

## Vad domen inte är

**Inte en ny skärm.** `HistoryScreen` finns. Detta är vad den läser.

**Inte AI-genererad prosa.** Fasta radformer med interpolerade värden, som allt annat vi skrivit. En genererad sammanfattning kan inte garanteras vara sann, och det är hela poängen med `O11`.

**Inte allt som hände.** Fem fält, valda för att de skiljer säsonger åt. Auditerna säger genomgående: färre och sannare.

---

## Beroenden

**Byggs ihop med `O3`.** Målets tre fält är den första posten i `SeasonSummary`-utökningen, och den viktigaste.

**Fält 2 kräver `O19`** — systemhändelserna måste vara märkta i data innan "säsongens viktigaste beslut" kan väljas maskinellt.

**Fält 3, 4, 5 kan byggas nu.** Personförändring, rivalitet och epok finns alla som data i dag.

**`HistoryScreen` med snapshot-prop** kommer från `3.3` Kontrakt A och behövs ändå för `U7`. Tre poster delar den ändringen — bygg den en gång.

---

## Godkänd när

En spelare som öppnar Historik efter tio säsonger kan följa en linje: vad klubben var, vad hen försökte, vad det kostade, och vem som var med hela vägen.

I dag kan hen läsa tio placeringar.
