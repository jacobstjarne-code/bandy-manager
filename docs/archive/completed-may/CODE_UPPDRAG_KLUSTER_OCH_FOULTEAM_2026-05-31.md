# CODE-uppdrag: Kluster-mönster över säsongen + foul-team-utredning

**Skapad:** 2026-05-31
**Beställare:** Jacob (Opus)
**Tidsbudget:** Totalt 1–2 timmar. Två separata uppgifter.

---

## Uppgift A — Mål-kluster för Edsbyn och Villa 25/26

**Fråga:** Är de tre mål-klustren i finalen en stilistisk signatur för Edsbyn över hela säsongen, eller en atypisk händelse? Och hur ser Villas spegel av samma data ut?

**För Edsbyn och Villa separat, säsong 25/26 (grundserie + playoff inklusive finalen):**

Identifiera alla "mål-kluster" — ≥2 mål från samma lag inom 5 minuters speltid.

Per lag, beräkna:

- Antal kluster över säsongen
- Kluster per match (snitt + spridning)
- Andel av lagets totala mål som hamnar i kluster
- Fördelning per matchtyp: grundserie vs playoff (utvecklas klustringen mot slutspelet?)
- Tids-fördelning inom matcherna: faller klustren oftare i 1H, 2H, eller är de jämnt spridda?
- Hörnmål vs öppet spel-andel inom klustren (var Edsbyns finalkluster ovanligt öppet-spel-tunga, eller är det deras norm?)

Jämför mot:

- Ligamedel för Elitserien herr 25/26
- De två lagens egna kluster-frekvens 22/23 och 24/25 (om datan tillåter — 23/24 saknas)

**Slutsats Code ska dra:** Var Edsbyns klusterbeteende i finalen i linje med deras säsongsmönster eller markant högre? Var Villas kluster-frekvens lägre än ligamedel (vilket skulle stödja tolkningen att de är ett mer "stadigt" possession-orienterat lag)? Inga uttalanden om winback eller bollinnehav — bara strukturpresentationen.

**Output:** `docs/data/MATCH_ANALYSIS_EDSBYN_VILLA_SEASON_CLUSTERS_2526.md`. Markdown. Publicerbar (inga domarnamn, inga individdata).

---

## Uppgift B — Utredning av foul-team-attributionen

**Bakgrund:** I tidigare uppdrag har vi förutsatt att `fouls[].team` är null i Bandygrytan, baserat på `BANDYGRYTAN_SCRAPER.md`. Det stämmer inte enligt rapporten från Edsbyn-Villa-analysen — fältet har 100 % täckning. Det här ändrar vad vi kan göra analytiskt och måste utredas.

**Vad Code ska svara på:**

1. Är fältet `team` i `fouls[]` faktiskt populerat i den rådata Bandygrytan skickar, eller är det Code:s scrape-logik som har härlett det från event-sekvensen?

2. Om härlett: vilken regel används för härledningen, hur tillförlitlig är den, och borde vi flagga den som "härledd, inte källdata"?

3. Om källdata: varför står det i `BANDYGRYTAN_SCRAPER.md` att fältet är null? Är dokumentationen föråldrad? Tillkom fältet i en senare Bandygrytan-uppdatering? Eller var det aldrig null från början och vi missförstod tidigt?

**Konkret att göra:**

- Spotcheck 10 matcher direkt mot rå-events från Firebase (`preCache/getFixtureEvents/{matchId}`) och se om utvisnings-events där har ett lag-fält
- Granska scrape-logiken som producerade `fouls[].team` i `bandygrytan_detailed.json` — är det direkt mappning eller härledning?
- Uppdatera `BANDYGRYTAN_SCRAPER.md` med den korrekta beskrivningen av fältets ursprung och tillförlitlighet
- Uppdatera `SCHEMA_DETAILED.md` om något där också är fel

**Output:** En kort sektion i `docs/data/INTERNAL_DATA_NOTES.md` (skapa om filen inte finns) som dokumenterar fyndet, plus uppdaterade scraper- och schema-dokument.

**Vidare implikation:** Det här är ett av flera fall där Bandygrytans struktur visat sig vara annorlunda än vi trott (förra var minute-konventionen för halvlek-gränsen). Lägg en kort notering i `INTERNAL_DATA_NOTES.md` om att en systematisk schema-revision rekommenderas innan nästa stora analysrunda — den data foundation audit Code redan föreslagit att speca.

---

## Rapportering

Båda uppgifterna är fristående. Kör Uppgift A först (den är värdefull oavsett vad Uppgift B visar), sedan B. Rapportera båda separat när de är klara.

Om något oväntat dyker upp under Uppgift B — typ att foul-team-attributionen visar sig vara härledd med en regel vi inte vet är pålitlig — stoppa och rapportera, för det skulle påverka många tidigare slutsatser.
