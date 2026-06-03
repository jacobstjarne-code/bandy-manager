# Kunskapsbas: Bandyregler

**Syfte.** Detta dokument är en auktoritativ referens för bandyns regler, skriven för att förhindra de feltolkningar av matchhändelser som uppstår när reglerna rekonstrueras ur fragment. Det ska läsas vid sessionstart för allt bandy-relaterat analysarbete. Det beskriver vad bandy *är* — inte vad vår data visar (det är `DATA.md`:s uppgift).

**Status.** Reviderat 2026-06-03 mot `docs/data/SvBF-Regelbok-2025-2026.pdf` (extraherad via pdftotext). Alla `[VERIFIERA]`-markeringar stängda mot officiell källa eller dokumenterade som ej i spelreglerna (hänvisat till tävlingsbestämmelserna).

**Viktigaste enskilda poängen för vår analys:** Dam och herr spelar efter *identiska* regler — samma planmått, samma offside, samma utvisningar, samma straffar. Dam-anomalin i datan (halvtidsledningens kollapsade prediktiva kraft, frånvaron av hemmaplansfördel) är därför **inte** en regelartefakt. Den är ett genuint strukturellt fenomen som måste förklaras med annat än regelverket.

---

## 1. Matchstruktur och tid

En bandymatch spelas i två halvlekar om 45 minuter, totalt 90 minuter ordinarie tid. Halvtidspausen får vara *högst 20 minuter* (Regel 4.1). Klockan stannar vid spelavbrott (mål, frislag, hörnor, utvisningar) — tidstillägg för förlorad tid läggs på av domaren.

De sista fem minuterna i sista halvleken ska domaren lägga till tid även vid utvisning, om det inte är mindre än 30 sekunder kvar (Regel 4.1).

Vid utomhusspel kan matchen av väderskäl spelas som 3×30 minuter (Regel 4.1). World Cup spelas 2×30. Ungdomsmatcher kan ha kortare tid.

**Notering:** REGLER.md angav tidigare "5 minuters halvtidsvila" — det var fel. Regelbok 4.1 anger *upp till 20 minuter*.

**För dataanalys:** Matchklockan i bandy nollställs *inte* vid halvtid — andra halvlek löper från minut 45 till 90. Men hur tilläggstid i första halvlek loggas varierar i datakällor; se `DATA.md` om minute-konventionen i Bandygrytan, där detta visade sig vara en faktisk felkälla.

## 1b. Spelplanen

Spelplanen är rektangulär. **Min 100 m och max 110 m lång. Bredd min 60 m och max 65 m.** (Regel 1.1, SvBF-Regelbok 2025-26). Längs sidlinjerna löper en sarg, 15 cm hög och max 4 cm tjock, som slutar 1–3 m från hörnkvartscirklarna (Regel 1.2).

Straffområdet är en halvcirkel med radie **17 m** framför målet; straffpunkten ligger **12 m** från målet (Regel 1.4). Frislagspunkterna längs straffområdeslinjen omges av cirklar med 5 m radie.

**Not om planmått:** FIB (internationellt) anger 90–110 × 45–65 m. SvBF:s spelregler 2025-26 anger ett snävare intervall: 100–110 × 60–65 m. I praktiken har Elitserien herr i princip alltid 100×60 eller 110×65. Vår tidigare källa (FIB/Wikipedia) angav de bredare FIB-intervallen — de är nu rättade mot SvBF-PDFen.

*Verifierat mot SvBF-Regelbok 2025-26 Regel 1.1, 1.2, 1.4.*

## 2. Mål och vinststipulation

Det lag som gör flest godkända mål vinner. Lika antal mål = oavgjort (i grundserie, om inte tävlingsbestämmelserna föreskriver förlängning — se avsnitt 9).

Ett mål underkänns om det görs medan laget har en utvisad spelare felaktigt på spelplanen.

Bollen är fortfarande i spel om den studsar på målramen och tillbaka in på plan.

## 3. Utvisningar

**Detta är det område vi återkommande har feltolkat. Läs noga.**

Bandy har tre nivåer av personlig bestraffning, plus ett varningssystem som föregår dem.

### Varningssystem
- **Muntlig erinran** — ingen formell markering, domaren talar med spelaren på "snackavstånd". Får bara ges om förseelsen inte är så allvarlig att varning eller utvisning är motiverad.
- **Varning (gult kort)** — ett observandum, markeras med en svepande armrörelse över huvudet. Signalerar för hela laget att nästa varning på *samma lag* innebär tidsutvisning.
- **Varning får ALDRIG utdelas för ojust spel.** Varning är endast för tekniska/administrativa förseelser (medveten maskning, obstruktionsmarkering, fel vid hörnslag, 5-metersregeln vid frislag, fintning vid straff). Ojust spel går direkt till utvisning.

### Utvisningstider
- **5 minuter** — brott mot ordningsföreskrifter (t.ex. slå bort eller hindra bollen efter dömt frislag, delta med felaktig/icke reglementsenlig utrustning), andra varningen på laget, lättare förseelser.
- **10 minuter** — grövre regelbrott, farligt spel av allvarligare art.
- **Matchstraff** — riktigt allvarliga förseelser ("grovt matchstraff", 60 min/hela matchen); spelaren visas ut resten av matchtiden. Bandygrytan loggar detta som event typ 5 (separat från reguljär utvisning, typ 3).

### Viktiga mekanismer
- **Tredje utvisningen på samma spelare = automatiskt matchstraff.** Spelaren är ute resten av matchen.
- **Målvakten avtjänar inte själv tidsutvisning** — lagkapten utser en utespelare som sitter av straffet.
- En matchstraffad spelare (matchstraff) får inte ersättas och får inte delta i eventuell förlängning eller straffläggning.
- En utvisad spelare återinträder efter domarens eller matchsekreterarens tillåtelse.

**För dataanalys:**
- I elitbandy förekommer **både** 5- och 10-minutersutvisningar. Spotcheck mot Firebase 2026-06-03 visar att 5-minutersutvisningar steg från ~6–8% (2019-22) till 37,5% (2025-26) — se `DATA.md`.
- Straffar och utvisningar är **inte oberoende händelser** — en straffpliktig förseelse kan utlösa både en straff *och* en utvisning (se avsnitt 4).
- Bandygrytan loggar orsak per utvisning ("Våldsamt slag", "Hakning" etc.) — ej extraherat i vår JSON men finns i källdata.

## 4. Straffslag

Straff döms för allvarlig förseelse av det försvarande laget inom det egna straffområdet, medan bollen är i spel.

Vid straffslag ska den felande spelaren *även* utvisas om förseelsens art är utvisningsberättigad (t.ex. lättare slag på klubba, hög klubba utan avgörande fördel). Detta är kopplingen mellan straff och utvisning — de kan komma tillsammans.

Målvakten får inte slå straff. Straffläggare måste ha varit spelberättigad vid matchslut och inte utvisad för resten av matchtiden.

Straffpunkten ligger **12 m** från målet i 11-mannabandy (9 m för 7-manna). Straffområdet är en halvcirkel med radie **17 m** framför målet. *Verifierat mot Regel 1.4.*

## 5. Frislag och friläge

**Frislag** döms vid regelbrott — hög klubba, slag mot motståndares skridskor/klubba, och liknande. Det utförs från platsen för förseelsen. Mål får göras direkt på frislag. Vid frislag måste motståndare hålla 5 meters avstånd (5-metersregeln; brott mot denna ger varning).

När bollen spelas över sidlinjen döms frislag (inte inkast som i fotboll) — bollen placeras inom 1 meter från där den passerade linjen.

**Friläge** avser en klar målchans där anfallaren som huvudregel passerat mittlinjen (gäller ej inom straffområdet). Om en försvarare förhindrar ett friläge otillåtet ska straff/frislag och utvisning utdömas.

## 6. Hörnor

Hörnslag döms när det försvarande laget spelar bollen över sin egen förlängda mållinje (kortlinje), utanför målet. (Regel 9.6)

- Hörnan tas från den hörnvinkel som är närmast där bollen passerade linjen.
- Vid hörnslag ska samtliga spelberättigade spelare i det försvarande laget befinna sig på eller bakom mållinjerna inom det egna straffområdet.
- Motståndare får inte vara närmare än 3 meter (men får stå vid egen målgårdslinje även om det innebär närmare).
- Ny hörna kan inte dömas direkt om inte ett nytt spelmoment utanför straffområdet föregått och försvarande lag vidrört bollen. (Regel 9.6)
- Träffar ett hörnskott en försvarare (inkl. målvakt) och går över förlängd mållinje utanför målet, döms målkast — inte ny hörna.

**Spelarbyte vid hörnslag:** Anfallande lag tillåts spelarbyte vid hörnslag (i de tre högsta serierna), undantaget spelare vars utvisningstid är på väg att gå ut. [Exakt år ej verifierbart mot spelreglerna — ses som ändring under ~2020-talet, ej daterat i 2025-26 regelboken.]

**För dataanalys:** Hörnor är en stor andel av målproduktionen i bandy (~22 % av målen i Elitserien herr). Hörnmålsandel och hörnkonvertering är centrala mått.

## 7. Offside

*Verifierat mot Regel 10 i SvBF-Regelbok 2025-26.*

En spelare är i offsideposition om spelaren i det ögonblick bollen spelas av en medspelare är **närmare motståndarens förlängda- eller mållinje än bollen**, såvida inte:
- **a) spelaren befinner sig på egen planhalva**, eller
- **b) spelaren har minst två motspelare mellan sig och motståndarnas förlängda- eller mållinje** (eller är i linje med näst sista motspelare).

En spelare ska inte avblåsas för offside bara för att spelaren befinner sig i offsideposition. Offsidebedömningen sker i bål-/rygghöjd.

**Offsideregeln gäller även vid fri-, straffslag, tekning och målkast** (Regel 10.1 sista mening). Ingen situation-baserad offside-frihet existerar i bandy — till skillnad från fotboll där hörnor och inkast är undantagna.

Befintliga exceptions är position-baserade (egen planhalva, antal motspelare), inte spelsituation-baserade.

## 8. Igångsättning

*Verifierat mot Regel 9 i SvBF-Regelbok 2025-26.*

**Avslag (Regel 9.1):** Spelet börjar med avslag på mittpunkten efter domarens signal. Det lag som vinner lotten väljer planhalva; det andra laget börjar med avslag (Regel 4.1). Avslag görs även direkt efter godkänt mål ("Då mål är godkänt ska avslag göras").

**Tekning (Regel 9.5):** Vid tillfälligt avbrott i spelet igångsätts spelet med tekning på den plats där bollen befann sig. Används vid avbrott som inte är mål, halvtid eller matchstart.

**Sammanfattning:** Avslag = matchstart, halvtidsstart, efter mål. Tekning = vid tillfälliga speluppehåll under pågående halvlek.

## 9. Förlängning och avgörande

**Slutspel/utslagstävling (Regel 4.4, verifierat):** Vid oavgjort efter ordinarie tid spelas förlängning enligt sudden death, 2×10 minuter, med byte av planhalva men ingen paus (lottning och 5 min vila före). Det lag som först gör mål vinner. Om matchen fortfarande är oavgjord avgörs den med straffläggning — 5 straffar vardera, därefter en straff i taget med olika skyttar tills ett lag vunnit.

**Grundserie:** Regeln i spelreglerna (Regel 4.3) anger endast att lika antal mål = oavgjort. Eventuell förlängning i grundserien regleras i tävlingsbestämmelserna (TB), inte i spelreglerna. Det kan därmed skilja mellan säsonger och divisioner — kontrollera TB för aktuell säsong.

**Slutspelets bäst-av-format:** Regleras i tävlingsbestämmelserna (TB), inte i spelreglerna. Kan ändras mellan säsonger.

En matchstraffad spelare får inte delta i förlängning eller straffläggning. En tidsutvisad spelare *får* slå straff i straffläggning.

## 10. Dam kontra herr

**Inga regelskillnader.** Dam och herr spelar på planer med samma storlek och efter samma regler för offside, frislag, utvisningar och straffslag.

## 11. Tävlingsstruktur (kortfattat)

- **Elitserien herr** — högsta serien. Grundserie följt av slutspel (kvartsfinal, semifinal, final). Final spelas på neutral plan.
- **Elitserien dam** — högsta damserien.
- **Bandyallsvenskan herr** — näst högsta serien; kvalspel mot Elitserien.
- **Slutspelsstruktur och bäst-av-format** regleras i tävlingsbestämmelserna — kontrollera aktuell säsongs TB för exakta antal matcher per fas.

**För dataanalys:** Finalen spelas på neutral plan, vilket eliminerar hemmaplansfördelen. Slutspelets bäst-av-format skapar det alternerande hemmavinst-mönster vi ser i SCORELINE-analysen.

## 12. Regeländringar som påverkar dataanalys

Eftersom vår data sträcker sig 2019–2026 är regeländringar under perioden potentiella brytpunkter i tidsserier.

- **Exakta år ej verifierbara mot 2025-26 regelboken** — en aktuell regelbok listar inte ändringshistorik. Åren nedan är uppskattningar och bör verifieras mot äldre regelböcker eller SBF-kommunikéer.
- **~2020:** Förlängning möjligen infört vid oavgjort i grundserien (Elitserien herr/dam, Allsvenskan herr). *[År ej verifierat mot officiell källtext.]*
- **~2020:** Spelarbyte tillåtet vid hörnslag (tre högsta serierna). *[År ej verifierat.]*
- **~2020:** Klubbans maxlängd är 130 cm (Regel 2, Regelbok 2025-26). Ifall det var ett annat värde tidigare är okänt. *[År för ev. ändring ej verifierat.]*
- **~2020:** Skärpta regler för målvaktens utkast. *[År ej verifierat.]*
- **25/26:** "Våga visa rött"-direktivet — bedömningsdirektiv, inte regeländring i spelreglerna. Mätbar effekt i Finding 052.

## 13. Verifieringsstatus — stängda och öppna punkter

*Uppdaterad 2026-06-03 mot SvBF-Regelbok 2025-26 (PDF extraherad via pdftotext).*

### Stängda mot officiell regelbok

| Punkt | Status | Källa |
|-------|--------|-------|
| Planmått | **Rättat:** SvBF anger 100–110 × 60–65 m (ej FIB:s 90–110 × 45–65 m) | Regel 1.1 |
| Sarg: 15 cm hög | ✓ Bekräftat | Regel 1.2 |
| Straffpunkt: 12 m | ✓ Bekräftat | Regel 1.4 |
| Straffområde: radie 17 m | ✓ Bekräftat | Regel 1.4 |
| Offsideregelns undantag | ✓ Dokumenterat: a) egen planhalva b) ≥2 motspelare. Offside gäller även vid fri/straff/tekning/målkast — inga spelsituation-undantag | Regel 10.1 |
| Avslag vs tekning | ✓ Klargör: avslag = matchstart + efter mål; tekning = tillfälliga speluppehåll | Regel 9.1, 9.5, 4.1 |
| Förlängning slutspel | ✓ Bekräftat: sudden death 2×10 min, sedan straffar | Regel 4.4 |
| Halvtidspaus | **Rättat:** "upp till 20 minuter" (ej "5 minuter" som felaktigt stod) | Regel 4.1 |
| Klubba maxlängd | ✓ Bekräftat: 130 cm | Regel 2 |

### Kvarstående — ej i spelreglerna (hänvisas till TB)

| Punkt | Anledning |
|-------|-----------|
| Förlängning grundserie — exakt format | Spelregler 4.3 anger bara att lika = oavgjort. TB styr grundserieförlängning. |
| Slutspel bäst-av-format per fas | TB, säsongsspecifikt. |
| Exakta år för regeländringarna | Inte listat i aktuell regelbok. Kräver historiska regelböcker eller SBF-kommunikéer. |

---

*Kunskapsbas för Bandy Manager. Regelinnehåll verifierat mot SvBF-Regelbok 2025-2026 (2026-06-03).*
