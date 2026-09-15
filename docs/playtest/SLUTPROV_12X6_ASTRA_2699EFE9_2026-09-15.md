# Slutprov 12 × 6 — releasepinne 2699efe9

**Datum:** 2026-09-15  
**Testare:** Codex/Astra  
**Pinnad produktcommit:** `2699efe90d64a001e100775db94f6f8cb2cc88ce`  
**Metod:** deterministiskt 12 × 6-stresstest samt separat tvåsäsongsprov av entréer, berättelseordning och portaltryck.

## Dom

**PASS för kärnflöde, persistens och entrébågar.** Alla 72 planerade
säsonger fullföljdes. Ingen karriär kraschade eller fastnade, inga strukturella
domäninvarianter bröts och ingen namngiven aktör eller relationsföljd kom före
sin introduktion i det riktade tvåsäsongsprovet.

Två kalibreringsobservationer redovisas öppet nedan. De är inte regressioner
från E-/F-passet eller bokföringsfixen, och inga balanskonstanter har ändrats i
slutprovet.

## 12 klubbar × 6 säsonger

- **72/72 säsonger**, **8 723 matcher**, **0 krascher**.
- Noll brott för tabellsummor, spelschema, spelarålder, truppstorlek,
  positionstäckning, cup- och slutspelsträd, matchdagsmonotoni,
  väntande-skärm-konsistens, save-storlek, NaN, kontrakt och unika spelar-id:n.
- **Noll `financeLogGap`.** Varje observerbar förändring av klubbkassan har en
  motsvarande bokföringsrad.
- De 77 kvarvarande `finance`-varningarna är tröskelvarningar för negativ
  kassa i den automatiska körningen, inte oförklarade kassamutationer. Harnessen
  auto-bygger och tar inte mänskliga ekonomi- och händelsebeslut; dess slutkassa
  är därför inte en fristående balansdom.

### Bokföringsfelet som provet hittade och stängde

Första körningen gav fyra skenbara loggluckor. Rotutredningen visade två
orsaker:

1. Tre var mätfel: ett långt automatiskt slutspelshopp hann skriva fler än de
   50 rader som den synliga ekonomiloggen behåller. Invarianten jämför nu bara
   ett intervall vars startpunkt fortfarande finns kvar i den kapade loggen.
2. Ett var verkligt: en kommunskandal i seed 12, säsong 4, omgång 20 drog
   **910 tkr** från den managerstyrda klubben utan bokföringsrad. Skandalen
   producerar nu samma kanoniska finanspost som övriga kassaändringar.

Exakt samma 12 × 6-population kördes om mot den pushade pinnen och gav noll
`financeLogGap`. Regressionstester täcker både kapad logg, managed-skandal och
att en AI-klubbs skandal inte skriver i spelarens ekonomiloggbok.

## Matchmotor och långtidskurva

- Grundserie: **9,03 mål/match** mot verklighetsankaret 9,12 och det tidigare
  efter-fix-ankaret omkring 8,98.
- Hemma/borta: 4,84 / 4,19 mål; hemma–oavgjort–borta 52,2 / 10,0 / 37,7 %.
- Hörnmål 23,3 %, straffmål 6,1 %, 16,58 hörnor och 3,85 utvisningar per match.
- Matchprofilernas fördelning ligger inom sina övergripande designmål.
- Den kontrollerade veteranregressionen ingår fortsatt i den gröna fullsviten;
  den råa 12 × 6-harnessen räknar inte ett användbart kohortmått och används
  därför inte för att ersätta den etablerade veterandomen.

### Kalibreringsobservationer

- Lag som leder i halvtid vann 83,9 % mot mål 78,1 ± 5 procentenheter: 0,8
  procentenheter utanför analysens tolerans.
- Vändningar från ett respektive två måls halvtidsunderläge låg på 18,0 % och
  6,8 % mot mål 24,5 % och 11,0 %.

Detta är smala fördelningsmått, inte ett flödesbrott. Huvudaggregaten är
stabila och provet ändrade inte balansmotorn i releasefasen.

## Entréer, berättelseordning och portaltryck

Det separata provet körde en ny Målilla-karriär på medelsvår, seed 41, genom
två säsonger med produktens riktiga onboarding, köer och säsongsrollover.

- **63 steg**, två fullföljda säsonger, **PASS**.
- Sex externa röster introducerades naturligt och i ordning: lokalreporter,
  mecenat, klackledare, kommunpolitiker, patron och ungdomssupporter.
- **47** rösthändelser fick visas efter giltig entré.
- **22** för tidiga rösthändelser observerades och stoppades korrekt av den
  gemensamma gaten.
- Max tre aktiva beslut, max tre sekundärkort, max fyra minimalkort och max
  sex olästa inkorgsposter.
- Ingen introduktion eller löst relationstillstånd började om säsong två.

## Slutlig teknisk kontroll

- Full testsvit: **588 filer / 5 278 tester**, alla gröna.
- Produktionsbygge, TypeScript och samtliga sex innehålls-/designgrindar:
  gröna.
- Huvudchunk: **1 404,21 kB**, under gränsen 1,5 MB.

Produktpinnen är pushad till `origin/main`. Den här rapporten dokumenterar
utfallet; den ändrar ingen produktlogik.
