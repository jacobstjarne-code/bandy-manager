# Klubbrapporter — Fix och regenerering

## Problem

Sandviken och Sirius har bara 25-26 matcher med detaljerade events (säsongen 2023-24). Nässjö och Tellus har 80-100+. Det beror troligen på att du bara laddade detaljdata för en Elitseriesäsong. Den fullständiga datan finns i `/tmp/bandy_data/elitserien_herr.json` med data tillbaka till 2012.

## Uppdrag

### 1. Ladda detaljdata för 2021-2026 (alla klubbar)

Kolla `elitserien_herr.json` — den bör ha events med minuttal, utvisningsorsaker (`info`-fält) och måltyper för fler säsonger än bara 2023-24. Ladda alla matcher med detaljerade events från 2021-22 till 2025-26 för Sandviken och Sirius.

Gör samma avgränsning för Allsvenskan: 2021-2025.

Motivering: 3-5 säsonger = sweet spot. Tillräckligt stort urval (~100 matcher per lag) men fortfarande relevant — samma tränare, liknande trupp. Data före 2021 speglar en annan organisation.

Spelare som inte spelat minst 2 säsonger filtreras bort från spotlights — annars fångar vi folk som var där ett halvår.

### 2. Fixa spelar-ID:n

"Spelare fx_29243" och "Spelare #292438" syns i rapporterna. Resolva dessa till riktiga namn från spelardata, eller exkludera dem. Inga interna ID:n i slutrapporten.

### 3. Regenerera alla fyra rapporter

Kör om analyserna med den utökade datan. Behåll samma struktur (PP-ekonomi, utvisningsprofil, C2, hörnförsvar, halvtidskorrigering, motståndarspecifika, periodisk sårbarhet, matchens vändpunkt, första-mål-effekt).

Säkerställ att alla påståenden baseras på minst 50+ matcher. Om ett mönster bara har 10-15 datapunkter — notera n tydligt och använd "indikerar" istället för "visar".

### 4. Harmonisera format

Alla fyra rapporter ska ha identisk sektionsstruktur och formatering. Nässjö/Tellus-formatet (bokstavssektioner A-H + C2) är bättre — använd det som mall för alla.

### 5. Filer

Skriv över befintliga:
```
docs/data/klubbrapporter/SANDVIKENS_AIK.md
docs/data/klubbrapporter/IK_SIRIUS.md
docs/data/klubbrapporter/NASSJO_IF.md
docs/data/klubbrapporter/TELLUS_BANDY.md
```
