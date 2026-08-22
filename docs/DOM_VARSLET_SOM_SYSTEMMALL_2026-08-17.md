## RÄTTAD 2026-08-17 — premissen höll inte

Domen nedan skrevs på antagandet att varslet var **det enda** beslutet av sitt slag. Codes klassificeringsrapport (`fc5d64da`) mätte 101 val över 16 filer mot mallens fem punkter:

| Poäng | Antal |
|---|---|
| 5/5 | 9 |
| 4/5 | 10 |
| 3/5 | 17 |
| 2/5 | 27 |
| 1/5 | 31 |
| 0/5 | 7 |

**Nio uppfyller alla fem redan.** `detOmojligaValet` — Licensnämnden kräver kapital, spelaren säljer en älskad akademispelare för 180 000 kr, fyra system, uttalad spänning i texten — är lika komplett som varslet, och ingen visste om det. Tre till ligger i `weeklyDecisionService.ts` (`away_trip_bus`, `tifo_contribution`, `legacy_naming_arena`).

**Det ändrar arbetet från att bygga till att känna igen.** Uppgiften är inte i första hand att skapa nya systemhändelser — det är att märka de nio, skydda dem, och se till att de inte krockar. Betydligt billigare än domen antog.

**Men rapporten avslöjar också en lucka i domen:** jag satte riktmärket två–tre per säsong utan att ange hur det upprätthålls. De nio ligger i åtta filer, triggas oberoende och delar ingen cooldown mot varandra eller mot varslet. Flera kan strukturellt träffa samma säsong. Riktmärket var en ambition, inte en mekanik.

**Tillägg till mallen — säsongsbudget:** systemhändelser delar en gemensam räknare per säsong och en gemensam cooldown mot varandra, oberoende av vilken fil de bor i. Det är samma mekanism som `U5`:s `semanticKey` behöver för narrativa bågar — **bygg dem tillsammans, inte två gånger.** En systemhändelse som trängs undan ska skjutas fram, inte kastas.

**64 % av alla val ligger på 2/5 eller lägre.** Det är materialet `O2`:s dominansrevision ska arbeta på, och det bekräftar dess premiss: de flesta val är inte val.

---

# DOM — VARSLET SOM SYSTEMMALL

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O1 i `SLUTTEST_KO.md`
**Underlag:** stickiness-auditen (Slottsbron), tvåsäsongsauditen, framgångsauditen. Tre oberoende testare, samma slutsats.

---

## Vad som faktiskt hände

Under säsong två i Slottsbron varslade Älvkarleby kommun. Två namngivna spelare — Torsten Henriksson och Erik Sundqvist — hade sina civila jobb där. Spelaren kunde erbjuda heltidskontrakt till 1,5× lön, eller låta bli.

GPT:s formulering: *"Varslet skapade testets bästa beslut. Det förenade ort, ekonomi, trupp och moral och gav ett val som gjorde ont oavsett riktning."*

Det är enda gången i fyra auditer och trettio spelade säsonger som någon beskrev ett beslut så.

---

## Varför det fungerade — de fem delarna

Varslet är inte bra för att det är dramatiskt. Det är bra för att fem system som annars är separata pekar på samma val samtidigt.

**1 · En plats med eget namn.** Inte "en arbetsgivare" utan Älvkarleby kommun. Orten finns redan i spelet — `communityStanding`, klubbstugan, skolan, kiosken — men den agerar nästan aldrig. Här gjorde den det.

**2 · Namngivna personer som redan betyder något.** Torsten och Erik var inte introducerade för varslets skull. Spelaren kände dem från truppen, hade satt dem i elvan, sett deras betyg. Konsekvensen träffar någon man redan har en relation till.

**3 · En konkret resurs med ett tal.** 1,5× lön. Inte "kostar lite" eller "påverkar moralen" — ett belopp att räkna på mot en känd kassa.

**4 · En sportslig följd.** Behåller du dem har du dem kvar i truppen. Annars kan de försvinna. Valet ligger i samma system som du spelar matcher i.

**5 · Ett minne som överlever.** Beslutet gick att återberätta efteråt. Det är skillnaden mellan en händelse och en berättelse.

**Och det avgörande:** de fem pekar åt olika håll. Ekonomin säger nej, orten säger ja, truppen säger ja, moralen säger ja — och kassan avgör om du har råd med din egen anständighet. Det finns inget rätt svar, bara ett val du får bära.

---

## Mallen

Ett beslut kvalificerar som **systemhändelse** när det uppfyller alla fem:

1. En namngiven institution, plats eller person **som redan finns i spelvärlden** agerar. Inte en ny statist.
2. Konsekvensen träffar minst en spelare eller funktionär spelaren redan har mött.
3. Det finns ett tal spelaren kan räkna på mot en känd resurs.
4. Utfallet ändrar minst **två** system som spelaren annars hanterar separat.
5. Minst två av systemen pekar i motsatt riktning.

**Uppfylls fyra av fem är det en vanlig händelse.** Det är inget misslyckande — spelet behöver vardag. Men den ska inte se ut som en systemhändelse, och de ska inte vara många.

**Antalet är en del av mallen.** Färre sådana händelser är bättre än många enkla moralval. En systemhändelse per säsong som fungerar slår sex som nästan gör det. Riktmärke: **två till tre per säsong**, aldrig två i samma omgång.

**Tillägg 2026-08-22 (Jacobs dom, efter O1:s sponsorkonflikt-bygge) — punkt 2 gäller även sponsorer, VILLKORAT.** Punkt 2 kräver inte att det namngivna är en person — en sponsor räknas som "redan mött" om den bär namn över säsonger, inte bara inom sitt eget avtal. Rapporterat (Code, samma dag): sponsorsystemet har två flöden med olika identitet.
- **Vanliga sponsorer** (`generateSponsorOffer`, sponsorService.ts) genereras SLUMPMÄSSIGT per erbjudande — namnet finns bara för längden av det egna avtalet (`contractRounds` 8–16 omgångar, alltid UNDER en säsong). Ingen tidigare eller senare instans bär samma namn. En rival ur denna pool är alltså per definition en främling, aldrig "sedd förut" — punkt 2 kan strukturellt inte uppfyllas med dagens generator.
- **Kontextuella sponsorer** (`checkContextualSponsors`, contextualSponsorService.ts — top4-bonus, CS>70-kommunstöd, publiksnitt-catering) HAR stabila, hårdkodade namn ("Regionalt Näringsliv AB", "Ortenmat Catering") som återkommer varje säsong villkoret uppfylls — genuin kontinuitet, spelaren KAN känna igen dem. Men de ligger i en annan kategori-namnrymd ('Regional'/'Kommunalt'/'Catering') än `BUSINESS_TYPES`s kategorier, och O1:s konfliktmekanik matchar bara `offer.category === rival.category` — kontextuella sponsorer är alltså aldrig nåbara som rival i den byggda mekaniken idag.

**Konsekvens för O1:s sponsorkonflikt (byggd 2026-08-22):** förblir 4/5, inte 5/5 — den byggda mekanikens rival kommer alltid ur den slumpmässiga poolen. Skulle mekaniken utökas till att låta kontextuella sponsorer bli rivaler (kategori-brygga eller en bredare matchning) vore kortet 5/5 för DE fallen specifikt — inte byggt, ny spec vid behov.

---

## Var mallen tillämpas — sex kandidater i prioritetsordning

Var och en är ett befintligt system som i dag producerar enkla val. Bygg inte allihop; bygg en, mät, bygg nästa.

### 1 · Sponsorn med ett problem (högst prioritet)

Dagens sponsoroffer ger pengar utan motkostnad — `O2` konstaterar att "acceptera" därför är en kvitteringsknapp. Det är den mest frekventa händelsen i spelet och den svagaste.

**Mallen tillämpad:** en lokal sponsor med namn vill synas — men de har just varslat, eller driver ett spelbolag, eller konkurrerar med klubbens äldsta sponsor som suttit i logen i tjugo år. Pengarna är verkliga och behövs. Priset är `communityStanding`, en relation, eller att någon annan går.

**Varför först:** frekvensen. Systemhändelser ska vara få, men den vanligaste händelsen i spelet får inte vara den tommaste.

### 2 · Kontraktet med en människa i

En veteran som varit i klubben i tolv år vill förlängas ett år till. Han är sämre än ungdomen som väntar på platsen. Klacken älskar honom. Styrelsen räknar löner.

Klacken är en namngiven grupp med egen `mood`; spelaren har satt honom i elvan hundra gånger; lönen är ett tal; utfallet rör trupp, klack och ekonomi; de pekar isär.

### 3 · Mecenatens krav

Mecenatsystemet finns och har `patience`. Kravet ska kosta något som inte är pengar — en spelare i startelvan, ett byggbeslut, att klubben tar ställning i en lokal fråga.

`K5` visade att mecenatens *avgång* redan är ett permanent tillstånd. Då ska vägen dit också vara ett riktigt val.

### 4 · Anläggningen som kostar orten något

Bygget tar plats, pengar eller kommunala timmar. `kommunens_villkor` finns redan men har byte-identiska effekter — det är en systemhändelse som byggdes utan del 4 och 5.

**Här ligger `O17` inbakad:** när trädet är fullt ska nästa horisont vara ett sådant val, inte ett tomtillstånd.

### 5 · Ungdomen som kan flyttas upp för tidigt

En sextonåring är bättre än trettioettåringen — men han går i skolan, familjen är tveksam, och bränner du honom kommer han inte tillbaka.

Akademisystemet och `builtSeason` finns. Detta är den enda kandidaten som skapar ett minne som *växer* — spelaren minns beslutet varje gång spelaren spelar, i tio år.

### 6 · Supportern som ber om något

Brevet från den 77-årige supportern nämndes uttryckligen som en av sakerna som gjorde orten levande. I dag är det atmosfär. Det kan bära ett val.

---

## Vad mallen INTE är

**Inte fler händelser.** Leder mallen till att kön växer har vi gjort fel. Framgångsauditens "dra ifrån"-lista och den här domen är samma dom: färre, sannare, tyngre.

**Inte tvåvalsdilemman med moralpoäng.** Skillnaden mellan varslet och ett vanligt moralval är att varslet kostade **pengar i en känd kassa**. Ett val där båda alternativen bara ger moral åt olika håll är inget val, det är en preferens.

**Inte en ny komponentfamilj.** `DecisionCard` bär det redan. `D1`:s pivotal-nivå är hur en systemhändelse ska väga. De två domarna hör ihop: mallen säger vilka händelser som är pivotal, `D1` säger hur pivotal ser ut. **Läs dem tillsammans.**

**Inte text före mekanik.** `O11` innehållskontraktet gäller: trigger, faktisk state-effekt, berörda system, livslängd, `semanticKey`, återkallningsyta. En systemhändelse utan alla sex blir nästa "Ge honom vila" — och värre än en vanlig händelse, eftersom den lovar mer.

---

## Ordning och beroenden

**Kan inte byggas förrän dessa håller:**

- **`2.5` choice-label-svepet.** Fyra val visade sig vara kompletta no-ops. En systemhändelse ovanpå en resolver som tyst hoppar över effektblock är en dyrare version av samma fel. Throw-guarden är en förutsättning. *(Klar sedan `fdcf55cb` + `ed94218f`.)*
- **`O5` framgångsekonomin.** Del 3 kräver att ett tal betyder något. I dag går kassan 420 tkr → 11 mkr, och då kostar 1,5× lön ingenting år åtta. **Mallen är verkningslös i den övre halvan av kurvan utan ekonomin.**
- **`U1` svårighetsmodellen.** Del 5 kräver att systemen kan peka isär. Kan en klubb inte misslyckas finns ingen motriktning att peka i.

**Alltså:** mallen är en dom nu, ett bygge efter Grind 1. Det är inte en parkering — `U1` och `O5` är förutsättningar för att mallen ska betyda något, och båda ligger redan i kö.

**Det som kan göras före Grind 1** och som inte kräver ny mekanik: klassificera alla befintliga händelser mot mallens fem punkter. Hur många uppfyller fem? Fyra? Två? Det talet är utgångsläget. Ligger som Code-rapport i `SLUTTEST_KO.md`.

---

## Godkänd när

En spelare som spelat två säsonger kan namnge **ett** beslut som gjorde ont, och beskriva vad det kostade — utan att öppna en meny.

Det är exakt vad GPT gjorde spontant om varslet. Kriteriet är inte att fler händelser finns, utan att någon minns en av dem.
