# TESTINSTRUKTION — FÖLJ-EN-KARRIÄR-JOURNALEN

**Datum:** 2026-09-03 · **Av:** Opus · **För:** GPT (testaren) · **Gäller:** den pågående 10-säsongskörningen (på säsong 8 när detta skrevs) och alla kommande långkörningar.
**Stänger:** MASTER `sluttest-validering-journal`. Levererar underlag till `inv-4-o12-forhandsdelta`, `sluttest-grind2/3/4` och ett dussin playtest-verifieringar.

## Vad journalen är

Du spelar tio säsongar som en manager. Journalen är inte en buggrapport och inte en funktionslista — den är berättelsen om karriären, skriven så att den som läser den efteråt kan svara på en enda fråga: **håller spelet kvar en spelare i tio säsonger, och varför eller varför inte?**

Skriv den som en manager skulle minnas sin karriär, inte som en QA-logg. Buggar och textfel noteras — men i marginalen, inte som huvudspår.

## Format

En fil: `docs/playtest/KARRIARJOURNAL_<klubb>_<startdatum>.md`. Tre delar.

### Del 1 — Säsongsposter (en per säsong)

För varje avslutad säsong, i den här ordningen:

1. **Vad hände.** Placering, slutspel, styrelsens dom, ekonomins läge, en–två avgörande händelser. Max åtta rader. Skriv det som du minns det, inte som tabellen säger det.
2. **Vad jag valde och varför.** De två–tre beslut som faktiskt styrde säsongen. Var det ett val, eller kändes det som det enda vettiga? Fanns det ett beslut du ångrade?
3. **Minns spelet?** Refererade spelet till något från en tidigare säsong — en spelare, ett beslut, en skandal, ett löfte? Citera raden om den finns. Om spelet glömde något du själv minns starkt: skriv vad.
4. **Ögonblicket.** Ett ögonblick som landade (du kände något) och ett som föll platt (spelet sa något men det betydde inget). Citera texten i båda fallen.
5. **Marginalen.** Textfel, upprepningar, saker som inte stämde med vad som hänt (texten påstod X, men Y var sant), knappar som inte gjorde det de sa. Kort, id-bart, en rad per fynd.

Säsonger som redan är spelade (1–8) rekonstruerar du ur minne och ur spelets egen Karriärhistorik/Efterklang. Markera dem som rekonstruerade. Säsong 9–10 skrivs medan du spelar.

### Del 2 — Fem stående frågor

Besvaras efter säsong 10, med hänvisning till säsongsposterna:

1. **Var de tio säsongerna olika?** Eller var det samma säsong tio gånger med andra siffror? Peka på vilka som skilde sig och vad som skilde dem.
2. **Fanns det en andra akt?** Kom det en punkt (år 4–8) där spelet blev något annat än överlevnad — ett större val, en ny ambition, ett arv? Eller var varje år år ett igen? (Detta är Grind 2.)
3. **Rytmen.** Visste du varje omgång vad den primära handlingen var och vilken den nästa olösta frågan var? Fanns det en landning per säsong? (Grind 3.)
4. **Orten.** Kändes bygden som något du byggde, eller som en siffra? Gjorde du bandyskolan och Bandyplay säsong ett trots att kassan sa nej — och om inte, sa spelet dig varför du borde? Det här är en riktad fråga: vi vill veta om CS-argumentet bär utan att kassan gör det.
5. **Skulle du spela säsong 11?** Svara ärligt, och säg vad som drar och vad som stöter bort. Det är den enda frågan som egentligen räknas.

### Del 3 — Kvitton

Kryssa det du faktiskt såg under körningen. Skriv "ej mött" om det inte dök upp — det är också ett svar.

- KF3 beslutsbudget: fyra eller fler beslut samma omgång → tre visas, kortet visar kö, nästa omgång dräneras.
- KF4 styrelse: namn och pronomen konsekventa i Ankomsten och styrelsemötena.
- Nödtrupp: skada som gav nödtruppkort → laget spelbart, ingen walkover.
- Orten-pilar och status för redan aktiva engagemang läsbara.
- Bygget-fliken som destination: gick det att komma tillbaka utan att fastna?
- Valet-UI (hallprövningens val): begripligt utan förklaring?
- Peptalk i förberedelsefasen: dök den upp, med rimlig frekvens?
- Streaming (📡 Bandyplay) och Bandyskola för barn som två skilda rader i Ekonomi och Orten.

## När du är klar

1. **Exportera saven** (Inställningar → export). Namnge `karriar_<klubb>_10sasonger.json` och lägg i `docs/playtest/`. Den är underlaget för `npm run analyze:choice-entropy` (O12) och `analyze:firing-frequency` — kör dem inte själv, bara leverera filen.
2. Lämna journalen i `docs/playtest/`. Ingen sammanfattning i chatten behövs — filen är leveransen.

## Vad du inte ska göra

Rätta inget i koden. Föreslå inga fixar i journalen. Gissa inte varför spelet gjorde något — skriv vad det gjorde och vad du kände. Diagnosen är Opus och Codes jobb; din är att vara den enda i rummet som faktiskt spelade tio säsonger.
