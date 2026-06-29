# CODE-uppdrag: Edsbyn–Villa, finalen 2025/26 — strukturanalys

**Skapad:** 2026-05-31
**Beställare:** Jacob (Opus)
**Sekretess:** Kan delas internt och eventuellt publiceras i Bandy Brain efter Jacobs godkännande.
**Tidsbudget:** 2–3 timmar. Stoppa om datan saknas eller verkar ofullständig.

---

## Bakgrund

Jacob och Nicklas (bandygymnasiet) jobbar med hypotesen att den svenska bandy-doxan om "bollinnehav skapar mål" är felaktig — att det istället är **winback** (snabb bollåtervinning efter förlust) som genererar mål, analogt med modern fotbolls gegenpressing-tradition. Edsbyn–Villa-finalen 25/26 framstod utifrån som en winback-dominerad seger för Edsbyn.

Vi vill **inte** bevisa eller motbevisa hypotesen — vi kan inte göra det med Bandygrytans data, som saknar possession, turnover-events och tillförlitlig skottdata. Vad vi kan göra är att presentera matchens struktur så tydligt att Jacob och Nicklas kan tolka den mot sin tränings- och videogranskning.

---

## Vad som ska göras

**Steg 1 — Identifiera matchen.**

I `bandygrytan_detailed.json`, hitta finalen 25/26. Sökkriterier: phase = "final", series = "herr", season = "2025-26". Verifiera att det är Edsbyn–Villa (eller Villa–Edsbyn). Rapportera tillbaka match-ID och basdata.

**Steg 2 — Extrahera all matchstruktur.**

- Datum, plats, publik
- Slutresultat och halvtidsresultat
- Domare (huvuddomare + assistenter)
- Per mål: minut, lag, typ (öppet/hörn/straff), poängställning efter målet
- Per hörna: minut, lag
- Per utvisning: minut, lag (om event-rekonstruktion ger lagattribution efter re-scrapen — annars enbart antal per lag totalt)

**Steg 3 — Beräkna nyckelmetrik för matchen.**

- Hörnor per lag, hörnmål-andel per lag
- Mål-fördelning per halvlek (med korrekt half-flag nu efter re-scrapen)
- Mål-typer per lag (öppet spel, hörnmål, straffmål)
- Tids-intervall mellan på varandra följande mål för det lag som vann (Edsbyn presumtivt) — fanns det "kluster" av mål inom 5–10 minuter, vilket skulle vara en transitions-indikator
- Mål-tajming: hur snabbt efter halvtid kom andra-halv-målen, hur sent i halvlekarna föll de
- Utvisningstajming relativt mål

**Steg 4 — Jämför mot benchmarks.**

För kontext, beräkna samma metrik för:
- Edsbyns säsongsgenomsnitt 25/26 (grundserie + playoff fram till finalen)
- Villas säsongsgenomsnitt 25/26
- Genomsnitt för alla tidigare finaler i datasetet (2019/20 till 24/25, exklusive saknade 23/24)
- Ligamedel för en typisk Elitserien-match samma säsong

Specifikt för "winback-spår" — peka ut om Edsbyn i finalen avvek från sin egen säsongsprofil på dessa dimensioner:
- Färre eller fler hörnor än vanligt
- Högre eller lägre hörnmål-andel än vanligt
- Mer eller mindre måltäthet (kluster av mål) än vanligt
- Mer eller mindre tidiga andra-halvlek-mål (51–55-minuters-fönstret från finding 051)

Detsamma för Villa.

**Steg 5 — Presentera strukturen, inte slutsatsen.**

Output: `docs/data/MATCH_ANALYSIS_EDSBYN_VILLA_FINAL_2526.md`

Strukturen:

```
# Edsbyn–Villa, finalen 25/26 — strukturanalys

## Matchen i siffror
[grunddata, resultat, publik, domare]

## Mål-timeline
[kronologisk lista, varje mål med minut, lag, typ, score]

## Per lag, matchen
[hörnor, hörnmål, mål-typer, utvisningar — sida vid sida]

## Mot benchmarks
[hur avvek matchen från Edsbyns säsong, Villas säsong, typisk final, ligamedel]

## Indikatorer för tolkning
[en avslutande sektion som lyfter de specifika datapunkter som
är relevanta för winback-hypotesen — utan att dra slutsatsen själv.
Format: "Edsbyn hade X hörnor mot Villas Y. Det avviker från Edsbyns
säsongsmönster där de typiskt hade Z. Det är förenligt med en
tolkning där Edsbyn medvetet avstod från territoriell dominans —
men det är inte ett bevis."]

## Begränsningar
[uttömmande lista över vad datan INTE kan säga: possession, turnovers,
shots, defensiv press-intensitet, etc.]
```

---

## Vad Code INTE ska göra

- Inte dra slutsatser om "winback vs bollinnehav" — bara presentera strukturen
- Inte spekulera om taktiska val
- Inte använda värderande språk ("dominerade", "förnedrade", "krossade")
- Inte göra prediktiva claims baserade på en enskild match
- Inte överskrida 3h utan att stämma av med Jacob

---

## Acceptanskriterier

- [ ] Matchen identifierad och bekräftad i datan
- [ ] Alla mål-, hörn- och utvisningsdata extraherade
- [ ] Benchmarks beräknade mot Edsbyn, Villa, tidigare finaler, ligamedel
- [ ] Markdown-rapporten finns och är läsbar på en sittning
- [ ] Begränsningar uttömmande listade
- [ ] Inga tolkningar gjorda i Code:s text — bara strukturpresentation

---

## Om matchen saknas eller är ofullständig

Om finalen 25/26 inte finns i datasetet, eller om viktiga fält saknas (typ specifika mål-typer eller utvisningar utan tidsstämpel), rapportera det rakt och stoppa. Vi kan inte göra meningsfull strukturanalys på ofullständig data.
