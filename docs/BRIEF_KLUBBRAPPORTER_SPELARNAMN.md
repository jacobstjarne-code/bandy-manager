# Klubbrapporter — Resolva spelar-ID:n

## Problem

Rapporterna filtrerar bort spelare med okända namn. Det gömmer potentiellt de viktigaste insikterna — "Spelare fx_29243" med 5 utvisningar och 80% aggression kan vara den mest relevanta punkten i hela rapporten.

## Uppdrag

### 1. Hitta spelarnamn

Kolla `/tmp/bandy_data/` — den fullständiga datan (`elitserien_herr.json`, `allsvenskan_herr.json`) bör ha spelarregister eller roster-data med mappning ID → namn.

Om inte: Bandygrytans API/Firebase har troligen en spelartabell. Kolla `bandygrytan_stats_full.json` (15.8 MB) i `/tmp/bandygrytan_scrape/` — den har spelarstatistik med namn.

Bygg en lookup: `player_id → { firstName, lastName, club, seasons[] }`

### 2. Applicera på rapporterna

Ersätt alla numeriska ID:n och fx_-ID:n med riktiga namn i alla fyra rapporter.

Om ett namn verkligen inte kan resolvas (helt saknas i all data): behåll spelaren i rapporten men skriv "Okänd spelare (ID: 29243)" istället för att filtrera bort hen. En okänd spelare med 5 aggressionsutvisningar är fortfarande en viktig datapunkt.

### 3. Regenerera spotlights

Med fullständiga namn bör spelar-spotlights (C2-sektionen) regenereras för alla fyra klubbar.

### Filer att uppdatera:
```
docs/data/klubbrapporter/SANDVIKENS_AIK.md
docs/data/klubbrapporter/IK_SIRIUS.md
docs/data/klubbrapporter/NASSJO_IF.md
docs/data/klubbrapporter/TELLUS_BANDY.md
```
