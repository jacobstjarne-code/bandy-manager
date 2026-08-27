# DESIGN-UPPDRAG — IMPLEMENTATIONSAUDIT DEL 4: GRANSKA

**Datum:** 2026-08-10 · **Av:** Opus (chat) · **Till:** Design
**Format:** samma fyra steg per yta som del 1–3, i husets tokens.

---

## Varför den här ytan, och varför nu

Granska läses efter varje match. Det gör den till den mest trafikerade ytan i spelet vid sidan av Portalen — oftare än Tabell, oftare än Trupp, och till skillnad från Portalen i ett läge där spelaren just har investerat något och vill veta vad det blev.

Den föll ur del 1–3 av ett sorteringsskäl, inte ett bedömningsskäl: urvalet gick på filstorlek, och Granska är en mapp med sju filer, inte en fil. `screens/granska/` innehåller `GranskaScreen.tsx`, `GranskaOversikt.tsx`, `GranskaSpelare.tsx`, `GranskaShotmap.tsx`, `GranskaAnalys.tsx`, `NextOpponentHook.tsx`, `helpers.ts`.

Del 3 avgjorde att `GranskaScreen` är kanon och att `RoundSummaryScreen` ska bort. Den granskade inte vad den överlevande ytan faktiskt visar. Det är det här uppdraget.

---

## Vad som redan är känt om ytan

Tre fel hittades i sluttestet utan att någon letade efter dem — de kom upp i en vanlig genomspelning. Behandla dem som symptom, inte som uppgiftslistan.

1. **Tom tabell efter cupmatch.** `📊 TABELL` renderades med ett kursivt `—` efter en spelad cupmatch. Tomt-tillståndet hanteras, men frågan är om sektionen ska finnas alls när matchen inte påverkar tabellen.
2. **"Inga matcher ännu" direkt efter en match.** `📈 FORM` sa det, sannolikt för att formen är ligaräknad och matchen var cup. Ytan påstår något som spelaren just motbevisat.
3. **Arenaraden försvann.** Efter neutral plan-fixen skrev Granska ingen arena alls för cupens finalhelg. Fixad sedan dess, men den avslöjade att raden läser hemmaklubbens arena i stället för fixturens.

Mönstret i alla tre: **ytan är byggd för ligamatchen och antar den.** Cup, finalhelg, slutspel och träningsmatch går igenom samma mall och faller ut fel på olika sätt. Det är hypotesen att pröva, inte en slutsats att bekräfta.

---

## De fyra stegen

Som i del 1–3: **Före** (vad koden gör i dag, med filnamn och symbol), **Diagnos**, **Efter** (mock i husets tokens), **Diff** (vad som konkret ändras).

Utöver standardstegen, tre saker som är specifika för den här ytan:

### A · Matchtypsmatrisen

Granska ska visas efter minst sex olika sorters match: ligamatch, cupmatch i vanlig runda, cupmatch på finalhelgen, semifinal och final i slutspelet, samt avskedsmatchen. För varje sektion i `GranskaOversikt` — resultat, tabell, form, milstolpe, nästa motståndare — svara: **är den meningsfull för den här matchtypen, och vad gör den i dag?**

Där svaret är "meningslös men renderas" ska förslaget vara att sektionen utelämnas, inte att den visar ett tomt tillstånd. Vi har just tagit bort tre falska påståenden ur portalen av exakt det skälet: ett tomt kort som säger något som inte är sant är sämre än inget kort.

### B · Fyrastegsindelningen

`GranskaScreen` har fyra steg — Översikt, Spelare, Shotmap, Analys. Frågan är inte om de är snygga utan **hur många som faktiskt öppnas**. Bedöm om steg två till fyra är en fördjupning spelaren väljer eller en struktur hen aldrig upptäcker, och om Översikt bär tillräckligt för den som aldrig går vidare.

Shotmap är den som ska prövas hårdast: den kräver mest av skärmen, och i bandy är skottkartan inte samma självklara artefakt som i hockey.

### C · `NextOpponentHook`

Den enda komponenten i mappen som pekar framåt i stället för bakåt. Kroken till nästa match är det som gör Granska till en övergång och inte en återvändsgränd — bedöm om den bär den vikten eller om den är en fotnot.

---

## Vad uppdraget INTE omfattar

`MatchScreen`, `match/` och scoreboarden. De är märkta under utveckling och ligger kvar där du lämnade dem.

`RoundSummaryScreen`. Den är dömd i del 3 och ska bort — granska den inte, och föreslå inget för den.

`SimSummaryScreen`, `QFSummaryScreen`, `HalfTimeSummaryScreen`. De är distinkta `PendingScreen`-triggers, inte varianter av Granska. **Rättelse av en gissning jag gjorde i förra rundan:** jag antog att de var fyra varianter av samma ögonblick. De är det inte — routern kopplar dem till separata triggers. Men om granskningen visar att någon av dem renderar Granskas sektioner i annan form, säg det, för då är det samma delad-atom-fråga som SeasonSummary↔History.

---

## Två saker att verifiera mot körande app, inte bara källkod

`bandy-manager.vercel.app` är öppen och kräver ingen inloggning. Tre påståenden i del 1–3 var inaktuella mot produktion, och synkfilen till del 2 sa att sajten inte gick att nå. Den gör den.

Och notera att snabbläget (`mode: 'fast'`) inte ger någon kommentartext alls under matchen. Det gör Granska till den **enda** ytan där en spelare som väljer snabbsimulering möter någon text om matchen över huvud taget. Väg in det i bedömningen av vad Översikt måste bära.

---

## Leverans

Samma paketering som tidigare: `Implementationsaudit-del4-YYYY-MM-DD.dc.html` plus en egen synkfil. Ingen svensk copy skrivs i auditen — beskriv vad en rad ska göra, märk den `[Opus]`, så skriver jag den.
