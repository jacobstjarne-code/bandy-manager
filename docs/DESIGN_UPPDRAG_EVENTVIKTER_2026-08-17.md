# DESIGN-UPPDRAG — EVENTKÖNS VIKTNING

**Datum:** 2026-08-17 · **Av:** Opus (chat) · **Till:** Design
**Underlag:** M-02 och M-06 i tvåsäsongsauditen, MEDIUM i långspelsauditen (10 säsonger), M-06 i Skutskär-auditen. Tre oberoende genomspelningar, samma fynd.

---

## Problemet

`DecisionCard` konsoliderade sex handrullade beslutsställningar till en gemensam grammatik. Det var rätt — alla tre auditerna bekräftar att sponsor, mecenat, press och spelarbeslut nu ser ut att tillhöra samma spel, och att den systemkänslan är klart bättre än före.

Men konsolideringen tog bort all viktskillnad. Citat ur långspelsauditen: *"DecisionCard-skalan är konsekvent, men gör vardag, upprepning och klimax lika höga."*

Konkret, observerat:

- Fem event låg i finaluppladdningen år 8. Alla lika höga, alla med samma outline-knappar.
- `primaryChoiceId` är ofta inte satt, så alla val i ett kort får identisk vikt — texten bär hela konsekvensskillnaden.
- Samma Tord-mediahändelse stoppade semifinalen två omgångar i rad.
- 5–7 beslut låg i kö efter slutspelet i Skutskär-testet, och berättelseöverlägg fångade första klicket så samma val ofta behövde göras om.
- Vid "Simulera resterande säsong" stannar batchen för likformiga kort.

Detta är inte ett skäl att gå tillbaka till sex versioner. Skalet ska stanna. Det som saknas är en nivå ovanpå det.

---

## Riktningen (min dom — rita mot den)

Tre narrativa vikter:

**Ambient** — auto-loggas, stoppar aldrig ett flöde, kräver inget svar. Att en sponsor hörde av sig. Att klacken sjöng lite kortare. Det som i dag är ett fullstort kort men inte borde vara ett kort alls.

**Normal** — kan batchas, kan skjutas upp, kräver ett svar men inte nu. De flesta relationsbeslut, presskonferenser, rutinhändelser.

**Pivotal** — blockerar, kan inte batchas, får aldrig konkurrera med något annat på samma skärm. Irreversibla val, kontraktsbeslut med årslång följd, det som avgör en säsong.

Och en konsekvensnivå **inuti** kortet, på valen: neutral, positiv, kostsam, irreversibel. Sparsamt använd — det är inte färgkodning av rätt och fel, det är att ett val som kostar 400 tkr inte ska se ut som ett som kostar noll.

---

## Vad som är din fråga

Fyra saker, och de är alla samma sorts avvägning som Sommaren löste: hur något får väga utan att bli en ceremoni.

**1 · Hur ser ambient ut när det inte är ett kort?** En rad? En logg man kan öppna? En notis i portalens kö? Det viktiga är att informationen inte försvinner — den ska finnas för den som vill läsa, utan att stoppa den som inte vill. `PortalQueueRail` finns redan och bär demoterad atmosfär sedan takregeln; frågan är om ambient hör dit eller någon annanstans.

**2 · Hur får pivotal väga mer?** Utan att bli en fjärde ceremoni. Vi har redan årsboken, segerscenerna och nu Sommaren — ett pivotal beslutskort som ser ut som en ceremoni gör att ceremonierna slutar betyda något. Det ska väga inom kortfamiljen, inte utanför den.

**3 · Konsekvensnivåerna på valen.** Fyra nivåer inuti ett kort som redan har en gemensam grammatik. Hur mycket får skilja innan korten slutar höra ihop? Långspelsauditen säger att de hör ihop i dag, och det ska de fortsätta göra.

**4 · Hur ser en batch ut?** Tre normal-beslut som visas tillsammans i stället för i följd. Är det ett kort med tre sektioner, en lista, eller tre kort utan mellanrum? Detta är det enda helt nya i uppdraget — allt annat är omviktning av något som finns.

---

## Vad som INTE är din fråga

Vilka event som är ambient, normal eller pivotal. Det är en klassificering av ungefär hundra event-typer och den görs mot koden, inte mot en skiss. Code utreder omfattningen (etapp 7.3 i totalordern) och jag dömer per familj.

Kön i sig. Att fem beslut ligger och väntar efter ett slutspel är delvis ett genereringsproblem — nya event ska inte skapas efter sista matchen — och det är mekanik.

Att berättelseöverlägg fångar första klicket. Det är en z-index-bugg och ligger hos Code.

---

## Förutsättningar

Bygg mot husets tokens. `DecisionCard` och `DecisionChoices` är källan för dagens skal — läs dem, riv dem inte.

Referenser i appen som redan har rätt vikt: `KRÄVER SVAR` i Inbox med deadline-pill (pivotal-liknande utan att vara ceremoni), `PortalQueueRail` (demoterat innehåll som inte försvinner), `EventOverlay` (blockerande, men den bytte till accentfärgad `btn-outline` i konsolideringen och är ett exempel på att skalet nu är *för* likformigt).

**Verifiera mot körande app.** `bandy-manager.vercel.app` — men kontrollera hashen först: live har legat efter main i flera dygn och main gick inte att bygga vid Skutskär-auditen. Ange vilken revision du granskar.

Ingen ny svensk copy. Behövs en rad: beskriv vad den ska göra, märk `[Opus]`.

---

## Timing

GPT kör en visuell audit av hela spelet härnäst, och den frågar bland annat om appen fortfarande har hierarki efter allt vi konsoliderat — vilket är samma fråga från andra hållet. **Läs den innan du låser något.** Om svaret är att likriktningen är värre än vi tror ska nivåskillnaderna vara tydligare än min dom antyder.

---

## Leverans

`Implementationsaudit-eventvikter-YYYY-MM-DD.dc.html` plus egen synkfil, i `docs/incoming/`. Som tidigare: flera vikter av samma lösning är bra, en rekommendation krävs.
