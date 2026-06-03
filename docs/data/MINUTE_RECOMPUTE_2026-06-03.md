# Minute-konvention recompute — findings 001–046

**Datum:** 2026-06-03  
**Metod:** Räkna om minut-binnade findings med half-flagga (schemaVersion 5) i stället för regeln `minute >= 46`.  
**Princip:** Findings tas aldrig bort. Står slutsatsen → bekräfta. Revideras den → korrigeringsbanner i 017-stil (gul vänsterkant `#c08a2e`).

---

## Skanningsresultat

Findings som binnar mål/händelser per rådata-minut: **005, 008, 009, 010, 013, 031**. Plus kalibreringssiffran i 004.

| Finding | Binnar per minut? | Nära halvtidsgräns? | Status |
|---------|-------------------|---------------------|--------|
| 004 | Halvleksandel (54,2%) | Ja (45/46) | **STÅR** (se nedan) |
| 005 | 10-min buckets | 40–49 peak straddlar | **STÅR** |
| 008 | 40–45 vs 46–50 split | RAKT på gränsen | **REVIDERAS** |
| 009 | Första-mål-minut | Nej (snitt min 10) | **STÅR** |
| 010 | 10-min, hörnmål | 40–49 bucket | **STÅR** |
| 013 | 10-min, dam vs herr | 40–49 bucket | **STÅR** |
| 031 | 81–90 slutminuter | Nej (långt från 45) | **STÅR** |

---

## Finding 008 — REVIDERAS (korrigeringsbanner tillagd)

**Gammalt:** "Klustret 40–50 är jämnt fördelat — 49,6% i 40–45, 50,4% i 46–50."

**Recompute:**
- Den råa minut-splitten är fortfarande jämn (med aktuellt dataset: 775 vs 786 = 49,6/50,4). Den siffran står.
- Men 46–50-bucketen är till **22% tilläggstid i första halvlek** (173 av 786 mål har half=1).
- Räknat på äkta halvlekstillhörighet: **1H-slut 925 mål (60,1%), 2H-start 613 mål (39,9%).**

**Slutsatsen revideras:** klustret är INTE jämnt fördelat över halvtidsgränsen — det är tyngre mot första halvlekens slut (60/40). Den ursprungliga symmetri-tolkningen var en artefakt av att 1H-tilläggstid räknades som 2H. Korrigeringsbanner tillagd; rådata-siffrorna behålls i texten med banner överst.

---

## Finding 004 — STÅR (not)

Kalibreringssiffran "54,2% av målen i andra halvlek" (fact S014) är bandygrytans egna publicerade aggregat, inte vår beräkning. Vår half-flagga-recompute ger **53,2%** (gammal `minute>=46`-metod: 54,4%). Skillnaden är ~1,2 pp. Slutsatsen — andra halvlek är något tyngre än första — står oavsett metod (>50% i båda). Siffran 54,2% behålls som bandygrytan-referens; ingen ändring.

---

## Finding 005 — STÅR

"Mål faller inte jämnt" — peak vid 40–49 (1408 mål) och 80–89 (1546). Peaken vid 40–49 är delvis driven av 1H-tilläggstidskompression, men den finns kvar i rådata oavsett halvleksdefinition. Slutsatsen "mål klustrar, inte uniformt" är robust. Den exakta tolkningen av VARFÖR 40–49 toppar (tilläggstidskompression) är en nyans, inte en revidering. Ingen ändring.

## Finding 009 — STÅR

"Mål faller tidigare i jämna matcher" — handlar om första-mål-minut (snitt 10,1, median tidigt). Sker långt före halvtidsgränsen. Ingen artefakt möjlig. Ingen ändring.

## Finding 010 — STÅR

"Hörnmål toppar mitten" — hörnmål per 10-min bucket: 40–49=305, 50–59=311. Mitt-peak är bred och robust. Half-flaggan skulle flytta enstaka hörnmål mellan 40–49 och 50–59 men inte ändra "toppar mitten"-slutsatsen. Ingen ändring.

## Finding 013 — STÅR

"Dam och herr likartad målminutsfördelning" — dam-formen har samma dubbel-peak (40–49=478, 80–89=448) som herr. Broad shape-jämförelse, opåverkad av halvtidsgränsens exakta placering. Ingen ändring.

## Finding 031 — STÅR

"Slutminutstopp" — 81–90-bucketen ligger långt från minut 45. Ingen half-flag-artefakt möjlig. Ingen ändring.

---

## Sammanfattning

**1 av 7 findings revideras (008).** Korrigeringsbanner tillagd. Övriga 6 bekräftade — deras slutsatser rör sig inte meningsfullt med half-flaggan, antingen för att de mäter broad shape (005, 010, 013), ligger långt från gränsen (009, 031), eller refererar bandygrytans eget aggregat (004).

Comeback-findings (017, 041, 042, 043) var redan markerade som ersatta av 051 i tidigare session.
