# BANDY MANAGER V2 — MATCHMOTOR OCH TAKTIK

**Skapad:** 2026-08-19 · **Ägare:** Opus · **Status:** program, inte kö
**Beslut (Jacob, 2026-08-19):** V2 startas när lanseringsversionen är klar. Detta dokument finns för att V2 inte ska bli en slask.

---

## Vad detta dokument är

Ett program, inte en kölista. `SLUTTEST_KO.md` äger lanseringen; den här filen äger vad som kommer efter.

**Regeln som skiljer dem:** en post hör hemma här om den ändrar hur matchen simuleras, hur en spelare beskrivs, eller vad ett taktiskt val betyder. Allt annat hör hemma i sluttestkön.

**Underlag:**
- SvenskaFans "Bandytaktik förklarat för en idiot" (2013), alla sju delar — `docs/BANDYSPRAK_KALLASNING_2026-08-19.md`
- GPT:s taktik- och matchmotordesign, 2026-08-19, efter samma källor plus SBF:s utbildningsmaterial
- `docs/B12_MATCHHANDELSERNA_SOM_SANNING_2026-08-19.md`

**Det som byggs i V1 och alltså inte står här:** kausal metadata på befintliga events (`CODE_INSTRUKTION_B12_BERIKNING_2026-08-19.md`). Den är V2:s förutsättning men rör inte motorn.

---

## Diagnosen

Spelet är byggt på en **händelse- och sannolikhetsmodell**: matchen är en serie utfall med justerbara odds. Modellen är kalibrerad mot 1 100+ verkliga Elitserien-matcher och den fungerar — målsnitt 9,14, trovärdig hemmavinstandel, och den överraskar fortfarande en dominerande klubb efter tio spelade säsonger.

Men den beskriver **resultat**, inte **spel**. Och tre saker följer av det:

**Taktiken kan inte bli lärbar.** Om `press: 'hög'` är en multiplikator på ett utfall kan spelet aldrig säga varför det fungerade. `O16` kan bara korrelera.

**Positionerna kan inte vara olika på riktigt.** En halv och en mittfältare skiljer sig i attribut men inte i vad de gör. Källorna säger motsatsen: halven är ytterback i försvar och yttermittfältare i anfall, mittfältaren kan aldrig vila, anfallaren väntar femton minuter på bollen.

**Bandy blir generisk lagsport.** Det som gör bandy till bandy — femmannaförsvaret, styrspelet, zonmarkeringen, lyran mot flippen, den stora ytan — finns i språket men inte i simuleringen.

---

## Målbilden

En **possession- och sekvensbaserad** motor: matchen är en serie bollinnehav, varje innehav en kedja av handlingar, varje handling utförd av en namngiven spelare i en position med ett taktiskt uppdrag.

Kravet som gör det värt besväret: **samma data ska driva referat, statistik, spelarbetyg, taktisk analys och test.** Ingen text som beskriver något systemet inte vet. Det är samma princip som `narrativeLog`, `matchTypeAxes` och innehållskontraktet — tillämpad på det sista stället vi inte rensat.

---

# PROGRAMMETS FYRA DELAR

## V2-1 · Possession-motorn

**Kärnan.** Matchen simuleras som sekvenser av bollinnehav i stället för isolerade händelser.

Per innehav: startzon, hur bollen vanns, vilka handlingar som följde, hur det slutade. Handlingarna är bandyns egna — passning, långpassning, lyra, flipp, bolltransport, nedtagning, brytning, skott, räddning, retur, utkast.

**Fyra nivåer av händelser**, som inte får blandas:

1. **Grundhandlingar** — vad spelaren gjorde.
2. **Situationshändelser** — friläge, numerärt överläge, omställning, etablerat anfall, hörna, frislag.
3. **Taktiska händelser** — första presslinjen spelas bort, halven blir överspelad, spelvändning skapar fri halv, droppande forward drar med sig back.
4. **Utfallshändelser** — mål, hörna, utvisning, bollvinst, bolltapp.

**Nivå 3 är den som inte finns någonstans i dag** och som gör analysen möjlig. Den är också hela skälet att motorn måste byggas om: en sannolikhetsmodell kan inte producera den, för den vet aldrig varför utfallet blev som det blev.

**Regeln för när något ska vara ett event** (GPT:s, och den ska gälla): ett event ska finnas om det påverkar matchens state, statistiken, spelarbedömningen, den taktiska analysen eller referatet. Annars inte. Utan den regeln exploderar motorn i fotnoter.

**Målets ursprung** blir struktur, inte en platt enum:

```ts
origin: 'OPEN_PLAY' | 'CORNER' | 'FREE_HIT' | 'PENALTY'
chanceType: 'BREAKAWAY' | 'ESTABLISHED' | 'TRANSITION' | 'REBOUND'
finalAction: string
buildUp: string[]
```

**Kalibreringsskulden är postens verkliga kostnad.** Den nuvarande motorn tunades genom Fas 2–3 mot 1 100+ matcher: clustring, oavgjortandel, hemmavinstandel, comebackdynamik. En ny motor får ingen av den kalibreringen gratis. **Räkna med att kalibreringen är större än bygget.**

---

## V2-2 · Taktikmodellen

**Dagens åtta dimensioner ersätts av sex bandyspecifika.** Modellen är GPT:s och den är bättre grundad i sporten — men den river `O15`/`D4`, som byggdes 2026-08-19 med två lägen, sammanhållet förslag och delta-rad. Den ytan ska återanvändas, inte kastas: **två lägen och delta-raden är rätt oavsett vilka dimensionerna är.**

De sex, med källa:

**Försvarshöjd** — var första presslinjen möter. Brodén: högt press är sällsynt och situationsbundet, *"man kan göra det i korta perioder, exempelvis i inledningen av matchen eller om motståndaren har utvisningar."* Alltså inte tre likvärdiga alternativ. Detta är `B2` i sluttestkön, och det löses egentligen först här.

**Styrspelsriktning** — bandyns defensiva grundtanke. *"Målet står i mitten av banan och då är det viktigt att hålla motståndarna borta från mitten."* Anfallarens defensiva uppgift är att **inleda** styrspelet. Vi har "press" där bandyn har en riktning.

**Kompakthet** — hur tätt lagdelarna håller ihop. Kopplar till Liws femmor: bakre femman jobbar ihop, främre femman jobbar ihop.

**Spelstil: spela eller åk** — den enda skillnaden Brodén kallar fundamental, och den **korrelerar inte med tabellplacering**. *"Ibland sitter det också i tröjorna."* Detta är `B3`, och som klubbtradition i `clubExtendedInfo` hör den till V1; som taktikdimension hör den hit.

**Uppbyggnadsväg** — börjar spelet på halvorna eller mittfältarna? Wasberg: *"Vissa lag vill börja spelet på halvorna, andra på mittfältarna."* Målvakten får olika direktiv beroende på motståndare.

**Risknivå i offensiv** — hur mycket laget satsar när det går framåt.

**Villkoret:** dimensionerna ska vara **läsbara i matchhändelserna**. Väljer spelaren hög försvarshöjd ska nivå 3-händelserna visa att första presslinjen spelades bort — annars är det en multiplikator med ett bandynamn, och då har vi bytt etikett utan att byta modell.

---

## V2-3 · Positioner och roller

**Positionerna är inte likvärdiga rutor.** Källorna ger varje position ett eget arbetsinnehåll:

**Målvakt** — motar bollar på linjen, till skillnad från fotbollsmålvakten. Läser spelet, placeringssäker, allt viktigare skridskoåkning. **Köldtålighet är en verklig egenskap.** Kan medvetet ställa en ihålig mur vid frislag för att locka skytten att skjuta från dåligt läge — **detta är `B11` i sluttestkön.** Frislag finns redan som egen interaktiv händelse (`freeKickInteractionService.ts`), men bara anfallssidans val (`shoot`/`chipPass`/`layOff`); den ihåliga muren är försvarssidans motsvarighet och en genuint ny valdimension, inte en variant av det befintliga. Jacobs dom 2026-08-19: hör hemma här, inte i V1.

**Back** — zonmarkering, aldrig man-man: *"Det går inte att åka efter en spelare. Jag håller min zon och släpper över spelare till en medspelare."* Snacket med libero och halvor är en uttalad arbetsuppgift. Trenden är spelande backar med bra uppspel.

**Libero** — städar bakom, inga offensiva uppgifter (till skillnad från den tyska fotbollsliberon). Bra på tennis, brytsäker, följsam, rutinerad. **Syndabocken:** raka djupledsbollar är hans ansvar, frilägen från kanten är halvens eller backens.

**Halv** — ytterback i försvar, yttermittfältare i anfall. Markering är viktigaste defensiva uppgiften. Åkhalv eller lyrhalv; den som bara kan det ena är skön att möta. Klubban utåt eller inåt är en verklig egenskap med taktisk konsekvens.

**Mittfältare** — driver laget, skapar struktur, ser till att planen följs. **Kan aldrig vila.** Måste bytas oftare än halvor.

**Anfallare** — viktigaste egenskapen är **tålamod**, inte avslut. Åker i tomme, kan gå femton minuter utan bollkontakt. Huvuduppgiften är att dra isär motståndarna och öppna ytor för mittfältarna. Vilar bara i ögonblicket efter en bollvinst.

**Rollsystemet** (GPT:s): fyra roller per position, `roleFit`-beräkning mot attribut. Det är ett nytt lager ovanpå den befintliga spelarmodellen och rör generering, utveckling, scouting, transfers och AI. **Största enskilda posten efter motorn.**

**Attributmodellen** — ungefär sjutton attribut i stället för dagens. Bandyspecifika: skridskoåkning i olika riktningar, tennis, brytsäkerhet, följsamhet, köldtålighet, tålamod, spelförståelse.

**Positionsberoende utmattning** — detta är `B9` i sluttestkön och kan visa sig vara ett V1-fel. Är `fatigue` enhetlig i dag är rotation en generisk syssla i stället för en positionsfråga, och det är fel oavsett vilken motor vi kör.

---

## V2-4 · Vad som blir sant först när de tre andra finns

**Spelarbetyg med negativa prestationer.** En halv med noll mål, noll assist och nittioen procent passningar kan ha varit usel — han tappade tre djupledslöpningar. Managerspel är genomgående bra på mål och räddningar och dåliga på missad markering och utebliven återgång. Med orsak i eventet blir det räknebart.

**Motståndaranalys som pekar ut en person.** `B4` i V1 ger namn plus skäl ur befintlig data. Med possession-motorn blir det *"tre av deras fyra frilägen kom bakom er vänsterhalv"* — belagt, inte uppskattat.

**Granska som lärandeyta.** `O16`:s `DITT VAL` blir kausal i stället för korrelerad.

**Referat i bandysvenska som är sanna.** En flipp i referatet betyder att motorn vet att det var en flipp. `B5` levererar orden i V1; V2 gör dem sanna.

---

# VAD SOM SKYDDAS

`BEVARA`-listan i `SLUTTEST_KO.md` gäller genom hela V2. Särskilt tre poster:

**Matchmotorns statistiska trovärdighet.** Den nya motorn ska producera minst lika trovärdiga aggregat som den gamla — målsnitt, hemmavinstandel, oavgjortandel, comebackdynamik. Gör den inte det är den inte bättre, oavsett hur mycket rikare eventen är.

**Truppens generationsväxling.** 16–33 år efter tio säsonger, trovärdig mix. Attributmodellen får inte rasera den kalibreringen.

**De tre tempolägena.** Statistisk paritet mellan quicksim och live är ett krav som består.

---

# ORDNING OCH RISK

**1. V1:s berikning** (`B12` steg 1–2). Förutsättning, inte del av V2. Ger A/B/C-kartan över vad motorn faktiskt vet.

**2. Motorprototyp parallellt med befintlig motor.** Kör båda på samma seeds, jämför aggregat. Ingen skarp övergång förrän den nya matchar den gamla statistiskt.

**3. Kalibrering.** Fas 2–3 igen, mot samma 1 100 matcher. **Planera för att detta är större än bygget.**

**4. Taktikmodellen**, efter att motorn producerar nivå 3-händelser. Utan dem är de sex dimensionerna bara nya namn på multiplikatorer.

**5. Roller och attribut** sist. De rör flest system och är lättast att skjuta.

**Den stora risken är inte att motorn blir sämre.** Den är att V2 blir halvbyggd: en ny motor utan kalibrering, eller nya taktikdimensioner ovanpå gammal simulering. **Ingen av delarna får släppas till spelare förrän hela kedjan håller.**

---

# ÖPPNA FRÅGOR

Ingen av dessa har ett svar än. De ska besvaras innan V2 startas, inte under.

**Ska V2 vara en uppdatering eller en efterföljare?** En ny matchmotor gör befintliga saves ojämförbara. Behåller vi karriärer måste `worldSeed` och regelversion (`K4`) bära vilken motor som körde — och det är ett av skälen `K4` byggdes.

**Hur mycket taktik ska en spelare behöva förstå?** Sex dimensioner som är sanna är svårare än åtta som är dekorativa. `O15`:s två lägen är svaret på formen, men inte på djupet.

**Vad händer med de tre tempolägena?** En possession-motor gör quicksim till något annat än en snabbare version av samma sak.

**Hur mycket av bandyspråket ska nå spelaren?** *Rättvänd*, *i tomme*, *tennis* är precisa och främmande. Källorna använder dem obekymrat till en publik som redan kan sporten. Vi vet inte om det är vår publik.

---

**Uppdatera denna fil när något avgörs. Skriv ingen ny.**
