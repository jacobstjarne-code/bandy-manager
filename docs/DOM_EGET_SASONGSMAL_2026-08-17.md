# DOM — SPELARENS EGET SÄSONGSMÅL

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O3 i `SLUTTEST_KO.md`
**Underlag:** stickiness-auditen. GPT formulerade fem egna mål spontant efter två säsonger. Spelet frågade aldrig.

---

## Fyndet

Efter två säsonger med Slottsbron skrev GPT ner vad den ville göra härnäst, utan att bli tillfrågad:

- etablera Slottsbron i slutspelet
- se om Torsten och Erik blev bärande heltidsproffs
- få akademisatsningen att producera en egen spelare
- slå Målilla eller Lesjöfors när det verkligen gäller
- se värmestugan och kiosken förändra orten

Fem mål, alla specifika, alla knutna till personer och platser som redan fanns. **Spelet kände inte till ett enda av dem.**

Det är den billigaste retentionmekaniken i hela materialet: spelaren gör redan arbetet. Vi behöver bara fråga och komma ihåg svaret.

---

## Domen

Efter årsboken, i Sommaren (`5.1`), väljer spelaren **ett** mål för den kommande säsongen. Spelet återkallar det vid halvtid och vid säsongsslut.

**Ett, inte tre.** Ett mål man bär hela säsongen är ett löfte. Tre är en checklista, och då är det ett styrelsekrav till.

**Valfritt att hoppa över.** "Inget särskilt i år" är ett giltigt svar och ska stå med. Ett obligatoriskt personligt mål är en självmotsägelse.

**Aldrig en belöning.** Uppfyllt mål ger ingen bonus, inga pengar, inget rykte. Det enda som händer är att spelet säger att du gjorde det. Kopplas det till en mekanisk belöning blir det ett uppdrag, och då optimerar spelaren i stället för att välja.

---

## Målen

Sex, härledda ur klubbens faktiska läge. Spelaren ser tre till fyra som är rimliga just nu, plus "inget särskilt".

| Mål | Villkor för att erbjudas | Mäts |
|---|---|---|
| **Slutspel** | Nådde inte slutspel förra säsongen | Slutspelsplats |
| **Etablera oss** | Nådde slutspel förra säsongen | Slutspel två år i rad |
| **{Spelare} ska bära laget** | En spelare under 23 med hög potential i truppen | Spelaren i startelvan i minst 15 matcher |
| **Slå {Rival}** | En rivalklubb finns | Vinst mot dem i serien |
| **Bygg klart {Nod}** | Ett pågående eller tillgängligt bygge | Noden färdig |
| **Håll ihop truppen** | Tre eller fler kontrakt går ut | Minst två förlängda |

Namnen interpoleras ur faktisk data. Erbjuds inget villkor uppfyllt: bara "inget särskilt".

---

## Texten

**I Sommaren, över valet:**

*Styrelsen har sitt. Vad vill du?*

**Alternativen:**

- *Ta oss till slutspel.*
- *Etablera oss där. Två år i rad, inte ett.*
- *Låt {Förnamn} bära laget.*
- *Slå {Rival}. En gång räcker.*
- *Få {Nod} färdig.*
- *Håll ihop truppen. Ingen ska behöva gå.*
- *Inget särskilt i år. Vi ser vad som händer.*

**Vid halvtid** — som en ambient rad i portalen, inte ett kort:

Går det: *Du sa slutspel. Ni ligger fyra.*
Går det inte: *Du sa slutspel. Ni ligger nia. Halva säsongen kvar.*

**I årsboken, sista raden före ekonomin:**

Uppfyllt: *Du sa {mål} i somras. Du gjorde det.*
Nästan: *Du sa {mål} i somras. Det saknades inte mycket.*
Inte alls: *Du sa {mål} i somras. Det blev inte så.*
Ingen mål valt: *Du lovade ingenting i somras. Det höll du.*

Den sista är avsiktlig. Att avstå ska få vara ett svar med en egen ton, inte en tom rad.

---

## Var det lagras

I `SeasonSummary`, som en del av `O18` — säsongens mål och hur det gick. Det är vad som gör tio säsonger till en båge: årsboken bär inte bara vad som hände, utan vad du hade tänkt.

**Fältet:** måltyp, referens (spelar-id, klubb-id, nod-id), utfall (uppfyllt / nästan / inte). Tre fält, inget mer.

---

## Beroenden

**Kräver `5.1` Sommaren.** Valet hör hemma där och ingen annanstans — det är enda gången i spelet spelaren har överblick och inte är mitt i något.

**Kräver `O18`** för lagringen. De två byggs ihop.

**Kräver inte `O5` eller `U1`.** Ett personligt mål är gratis oavsett hur ekonomin står. Det här är den enda av mina domar som kan byggas direkt efter Sommaren.

**Halvtidsraden kräver `D1`:s ambient-nivå.** Utan den blir den ett kort, och då är den ett krav.

---

## Vad domen inte är

**Inte ett andra styrelsekrav.** Styrelsen har sina mål och de mäts i `boardPatience`. Detta mäts i ingenting.

**Inte en achievement.** Ingen lista, inga tidigare mål att bocka av, ingen samling. Ett mål per säsong, i årsboken, och sedan är det historia.

**Inte AI-genererat.** Sex fasta måltyper med interpolerade namn. Ett mål som spelet hittade på är inte spelarens.

---

## Godkänd när

En spelare kan säga vad hen lovade sig själv förra sommaren — och spelet säger samma sak i årsboken.
