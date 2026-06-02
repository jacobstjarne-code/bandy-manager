# CODE-uppdrag: Data foundation audit (Bandygrytan)

**Skapad:** 2026-06-02
**Beställare:** Jacob (Opus)
**Sekretess:** Intern. Output uppdaterar `docs/kunskapsbas/DATA.md` och `docs/data/INTERNAL_DATA_NOTES.md`.
**Tidsbudget:** ~3–5 timmar. Stoppa och rapportera mellan delarna.
**Varför nu:** Detta är blockeraren innan förbundsdata integreras och innan nästa stora analysrunda. En ofullständigt förstådd Bandygrytan-grund ärver sina luckor in i all sammanslagen data där de blir svårare att spåra. Vi har redan hittat tre felkällor (minute-konventionen, foul-team, foul-duration) — auditen är den systematiska genomgången som hittar resten innan de kostar oss en felaktig slutsats.

**Princip:** Verifiera mot rå-Firebase, gissa aldrig utifrån fältnamn. Varje påstående om ett fält ska kunna pekas tillbaka till en faktisk observation i källan. Detta uppdrag betar av `[CODE VERIFIERA]`-markeringarna i `docs/kunskapsbas/DATA.md` och stänger dem en efter en.

---

## Del 1 — Fullständig event-typ-dokumentation

Vi har koderna 1, 2, 3, 4, 12, 13, 14, 16 från `_meta.eventTypes`. Koderna 5–11 och 15 är odokumenterade.

- Dumpa hela `_meta.eventTypes` från rå-Firebase och dokumentera varje kod.
- För varje kod: vad representerar den, hur ofta förekommer den i datasetet, vilka fält bär den med sig?
- Särskilt intressant: finns det event-typer vi inte använder men borde (räddningar, byten, varningar, timeout)?

**Output:** Komplett tabell i `DATA.md` avsnitt 2.

---

## Del 2 — Källa kontra härlett, fält för fält

För varje fält i `bandygrytan_detailed.json` (goals, corners, fouls, penalties, referees, half, samt match-metadata), avgör:

- Är fältet **källdata** (kommer direkt från Firebase) eller **härlett** (beräknat av vår scrape-logik)?
- Om härlett: vilken regel används, och hur tillförlitlig är den?
- Spotcheck:a 10 matcher fördelat över säsonger (inkl. minst en 19/20 och en 25/26) mot rå-events för att bekräfta.

**Detta är kärnan i auditen.** Varje fält vi använder i analys måste ha känt ursprung. Bygg en tabell: fält | ursprung (källa/härlett) | härledningsregel | tillförlitlighet | anmärkning.

**Output:** Tabell i `DATA.md` avsnitt 3, ersätter de nuvarande `[CODE VERIFIERA]`-markeringarna med verifierade påståenden.

---

## Del 3 — Specifika öppna frågor att stänga

Dessa är redan flaggade i DATA.md och kan betas av direkt:

1. **Duration-fördelning.** Räkna 5-min mot 10-min mot övriga över alla utvisningar, per säsong, per serie (herr/dam). Detta avgör om "bara 10 min nuförtiden" stämmer empiriskt eller inte. (Om foul-duration/info-scrapen redan körts — verifiera resultatet; annars kör den.)
2. **Reason/info-fältet.** Är orsakskategorierna extraherade och normaliserade? Dokumentera de unika värdena och deras frekvens. Top-10-tabell.
3. **cornerGoal%-parsern.** Det fanns ett känt fel i kval/allsvenskan enligt äldre `BANDYGRYTAN_SCRAPER.md`. Är det åtgärdat? Verifiera mot rå-data.
4. **Straffstrukturen.** Hur loggas straffar? Lag-attribution? Relation till utvisningar — minns att straff och utvisning kan komma tillsammans (REGLER.md avsnitt 4), så de är inte oberoende händelser. Hur ser den kopplingen ut i datan?
5. **Spelaridentitet på mål.** Finns spelar-ID eller namn per mål? Är det konsekvent över säsonger? Detta avgör hur långt vi kan komma med spelarnivåanalys på befintlig data (relevant för player card-frågan).

**Output:** Var och en dokumenteras i `DATA.md` respektive avsnitt + `INTERNAL_DATA_NOTES.md`.

---

## Del 4 — Findings-revision mot minute-konventionen

Minute-konventionen (hypotes B, half-flagga införd schemaVersion 4) påverkar alla findings med skarpa minutgränser nära minut 45. Gå igenom alla publicerade findings i Bandy Brain och alla period-baserade analyser:

- Lista varje finding som använder minutebuckets.
- För var och en: använder den half-flaggan eller den gamla `minute >= 46`-regeln?
- Klassificera: **opåverkad** (30-minutersbuckets eller säsongsaggregat), **måste räknas om** (10- eller 5-minutersbuckets nära halvtid), **faller bort** (om omräkning visar att fyndet var en artefakt).
- Räkna om de som behöver det och rapportera hur fynden ändras.

Särskilt misstänkta enligt tidigare diskussion: ANALYS_MATCHMONSTER avsnitt 3 (utvisningar per period, "40–50' halvtidsjakt"-bucketen), avsnitt 6 (hemmafördelens kurva), avsnitt 7 (desperationsmål per period).

**Output:** En tabell i `INTERNAL_DATA_NOTES.md`: finding | bucketstorlek | half-flagga? | status | ev. omräknat värde.

---

## Del 5 — Täckningsgap

- Dokumentera täckning per säsong och serie utöver det kända 23/24-gapet.
- Finns det matcher med saknade events (tomma goals/fouls-arrayer som borde haft innehåll)?
- Finns det säsonger eller serier där vissa event-typer systematiskt saknas (t.ex. hörnor loggades inte före säsong X)?

**Output:** Täckningsmatris i `DATA.md` avsnitt 1.

---

## Acceptanskriterier

- [ ] Alla `[CODE VERIFIERA]`-markeringar i `DATA.md` antingen bekräftade och omskrivna till påståenden, eller kvarstående med dokumenterad anledning till varför de inte gick att stänga
- [ ] Källa-kontra-härlett-tabellen komplett för alla fält
- [ ] Duration-fördelningen räknad och dokumenterad
- [ ] Findings-revisionen klar med status per finding
- [ ] Varje verifiering pekar tillbaka till en faktisk observation i rå-Firebase, inte ett antagande
- [ ] `DATA.md` avsnitt 6:s checklista uppdaterad — bockad där klart, kvarstående med anledning

---

## Vad Code INTE ska göra

- Inte börja räkna om findings i Bandy Brain publikt förrän Jacob sett revisionen i Del 4
- Inte gissa ett fälts ursprung — om det inte går att verifiera mot Firebase, skriv "ej verifierbart" och flagga, gissa inte
- Inte överskrida tidsbudgeten utan avstämning
- Inte koppla in eller förbereda förbundsdata — det är ett separat, senare uppdrag som förutsätter att denna audit är klar

---

## Rapporteringsrytm

Rapportera efter varje del (1–5), inte allt på slutet. Del 2 (källa kontra härlett) är den viktigaste — rapportera den så snart den är klar även om resten dröjer.

Stoppa och fråga om något oväntat dyker upp — särskilt om ett fält vi byggt findings på visar sig vara härlett med en opålitlig regel, för då måste de findings omprövas.
