# ARKIV — index

Filer flyttade hit \u00e4r d\u00f6d historik: levererade kod-instruktioner, dagliga
handovers, och daterade engångs-artefakter (analyser, reviews, playtest-noteringar,
session-summaries). De \u00e4r kvar f\u00f6r sp\u00e5rbarhet, inte f\u00f6r att l\u00e4sas vid sessionsstart.

## Kvalificeringsregel (vad som flyttas hit)
- `HANDOVER_*` \u2014 dagliga \u00f6verl\u00e4mningar, per definition historik.
- `CODE_INSTRUCTION_*` med datum \u2014 levererade sprintar (bekr\u00e4ftat i KVAR.md).
- Daterade `ANALYS_/REVIEW_/PLAYTEST_/SESSION_SUMMARY_/SCREENSHOT_AUDIT_` \u2014 engångs-snapshots.
- `*_STATUS_*`-snapshots som ersatts av en levande fil (t.ex. THE_BOMB_STATUS \u2192 THE_BOMB.md).

## Vad som ALDRIG flyttas hit (stannar i docs/-roten)
- `SPEC_*` \u2014 kan vara oimplementerat; r\u00f6rs inte utan verifiering.
- Visionsdokument (`GENOMGANG_OCH_VISION`, `ROADMAP`, `THE_BOMB`).
- Levande trackers (`OPPNA_BESLUT_ACTION`, `KVAR`, `BACKLOG`, `STATUS`).
- `LESSONS.md`, `DECISIONS.md`, `OPUS_SAMARBETSREGLER.md`, `WRITING_GUIDELINES_*`.
- De senaste dagarnas filer och allt fr\u00e5n p\u00e5g\u00e5ende sp\u00e5r.

## Struktur
- `completed-april/` \u2014 artefakter daterade april 2026.
- `completed-may/` \u2014 artefakter daterade maj 2026 (utom de allra senaste, som ligger kvar i roten).
- L\u00f6sa filer i `archive/`-roten \u2014 \u00e4ldre fixspecar arkiverade innan denna struktur fanns.

St\u00e4dat 2026-05-23 av Opus, konservativt: vid minsta tvekan l\u00e4mnades filen i roten.
