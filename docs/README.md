# Dokumentation

`docs/MASTER_OPPET.md` är den enda levande statuskällan. Börja där när frågan är vad som återstår, vem som äger en punkt eller om arbete redan pågår. Stängda poster finns som kompakta pekare i `docs/MASTER_ARKIV.md`.

## Huvudmappar

- `dom/` — fattade produkt-, text- och systembeslut.
- `rapport/` — analyser, mätningar, driftprov och granskningsresultat.
- `handover/` — överlämningar och handoff-dokument.
- `spec/` — byggbara specifikationer och konsoliderade code-specar.
- `playtest/` — genomspelningar, domunderlag och reproduktioner.
- `archive/` — avslutat eller ersatt material som bara läses historiskt.
- `incoming/` — tillfällig drop-zon; material ska triageras vidare, inte lagras permanent där.

De tidigare köerna `BACKLOG.md` och `SLUTTEST_KO.md` är frysta i `archive/historiska-statuskallor/`. De får användas som källmaterial men aldrig som aktuell status.

## Pekarregel

Skriv repo-relativa sökvägar med `docs/` från projektroten, exempelvis `docs/dom/DOM_BURNOUT_2026-08-17.md`. Det gör hänvisningen entydig även när den förekommer i kod, en annan dokumentmapp eller ett arkiv.
