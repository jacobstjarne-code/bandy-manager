# SPEC_SHOT_DATA_AUDIT_2026-05-04

**Datum:** 2026-05-04 (sen kväll)
**Författare:** Opus
**Status:** Spec-klar för Code
**Trigger:** Playtest 2026-05-04. Jacob frågade om hörnor räknas i skottstatistiken. Svaret är oklart från koden. Code:s kommentar i `GranskaShotmap.tsx` säger att `onTargetHome/Away` exkluderar hörn-skott — vilket öppnar frågan om hela skott-data-modellen kan vara skev, och om kalibreringen mot bandygrytan därmed är felaktig på vissa metriker.

**Beroende:** Pausar Fas 2 i SPEC_GRANSKA_VERIFIERING_2026-05-04 tills denna audit är klar.

---

## Varför detta måste göras nu

LESSONS #28: ingen symptomfix utan rotorsak. Vi har precis hittat två exempel på falska ✅ LEVERERAD-statusar. Att fortsätta bygga Granska-omarbetning på en data-modell där vi inte vet om hörn-skott räknas korrekt är samma fel om igen — bygga på instabilt fundament.

Plus: matchmotorn är kalibrerad mot bandygrytan-data sedan Sprint 24-serien. Om vår skott-räkning skiljer sig från bandygrytans skott-räkning systematiskt, kan vi ha optimerat parametrar i fel riktning på vissa metriker.

Inte panik. Diagnos.

---

## Princip — diagnos först, beslut sen

Detta är **ren utredning**. Ingen kod ändras i steg 1. Code skriver rapport. Opus läser. Beslut tas baserat på fakta.

Tre möjliga utfall:
- **A)** Data-modellen är konsekvent (motorn och bandygrytan räknar samma sätt) → bara visualiseringen i shotmap behöver fixas. Kalibrering OK.
- **B)** Data-modellen är skev men kalibreringsmåttarna inte beror på den → fixa data-modellen, kalibrering oberörd.
- **C)** Data-modellen är skev OCH kalibreringen påverkas → re-kalibrera de berörda metrikerna efter datafix.

---

## Steg 1 — Utredning av matchCore (Code, ~2h)

Code dokumenterar i `docs/diagnos/2026-05-04_shot_data_audit.md`:

### A) Hur räknas `shotsHome/Away` i matchCore?

Sök efter alla `shotsHome++`, `shotsAway++`, `shotsHome +=`, `shotsAway +=` i `src/domain/services/matchCore.ts`. För varje:
- Vilken event-typ triggar inkrementering?
- Hörn-skott — räknas de?
- Straff-skott — räknas de?
- Frislags-skott — räknas de?
- "Bara öppet spel" — räknas de?

Förväntat svar i rapporten: en tabell över alla skott-källor och deras räknings-status.

### B) Hur räknas `onTargetHome/Away` i matchCore?

Samma utredning. Speciellt:
- Bekräfta att hörn-skott exkluderas (per Code:s tidigare kommentar)
- Är detta avsiktligt eller en bug?
- Påverkar exkluderingen `savesHome/Away` också?

### C) Hur räknas `savesHome/Away`?

- Vilka skott räddas räknas? Bara öppna skott? Eller alla?
- Inkluderas hörn-räddningar?
- Inkluderas straff-räddningar?

### D) Hur räknas `cornersHome/Away`?

- Räknas alla beviljade hörnor, eller bara de som leder till skott?
- Räknas hörn-mål separat (i Goal-events med flagga)?

### E) Är `MatchStep.shotsHome` / `MatchStep.onTargetHome` etc. samma värden som hamnar i `Fixture.report.shotsHome`?

Verifiera att det som matchmotorn räknar fram är samma siffror som sparas i `report` och senare visas i Granska. Det kan finnas en post-process-mellanräkning som räknar om något.

---

## Steg 2 — Utredning av bandygrytan-scrapern (Code, ~1h)

Code läser `scripts/scrape-allsvenskan.mjs` och eventuella andra scrape-filer för bandygrytans data. Dokumenterar:

### A) Vilka event-typer finns i bandygrytan-API:et?

Per KVAR.md (FREDAGSJOBB-sektionen), kända typer:
- T_SHOT (11) — "Skott på mål"
- T_SAVE (23) — "Målvakten räddar"
- T_FREESTROKE (10) — Frislag
- T_OFFSIDE (107) — Offside (nyare data)

### B) Hur räknas bandygrytans `shotsOnGoalHome/Away`?

- Räknas T_SHOT + T_SAVE? Bara T_SHOT?
- Inkluderas hörn-skott i T_SHOT-events?
- Inkluderas straff-skott?

### C) Vad är "skott på mål"-täckningen i bandygrytans data?

Per FREDAGSJOBB i KVAR: vissa matcher har bra täckning (Katrineholm-Borlänge: 15 skott + 19 räddade), andra dåliga (Bollnäs-Sandviken: 2+2). 

- Vilken är typisk täckning per match?
- Är det "fullt loggade" matcher som kalibreringen baseras på, eller alla?
- Om kalibreringsmål för "skott/match" finns någonstans — vilken siffra används?

### D) Vad är `savesHome/Away` i bandygrytans data?

- Räknas alla räddningar (även hörn/straff)?
- Är det T_SAVE-events totalt?

---

## Steg 3 — Diff-analys (Code, ~1h)

Code skriver i samma rapport:

### Tabellen "Skott-räknings-konventioner: motor vs bandygrytan"

| Metrik | Motor räknar | Bandygrytan räknar | Skillnad? |
|---|---|---|---|
| Totala skott | (att fylla) | (att fylla) | (ja/nej + förklaring) |
| Skott på mål | (att fylla) | (att fylla) | ... |
| Räddningar | (att fylla) | (att fylla) | ... |
| Hörn-mål inkluderat i totala skott | (att fylla) | (att fylla) | ... |
| Hörn-mål inkluderat i skott på mål | NEJ (per kommentar) | (att fylla) | ... |

### Påverkade kalibreringsmål

Lista alla metriker i `docs/data/bandygrytan_stats.json` som *direkt eller indirekt* beror på skott-räkning. För var och en, klassa:
- **OBEROENDE:** Mål/match, hemmavinst%, oavgjort%, suspensions/match (etc) — dessa beror på resultat eller egna räknare
- **DIREKT BEROENDE:** Skott/match (om finns), skott på mål/match, räddningsprocent, konvertering — dessa har skotträkning som ingrediens
- **INDIREKT BEROENDE:** Vad som helst som beräknas med skott-statistiken som mellansteg

### Klassa risken

För varje DIREKT BEROENDE metrik i kalibreringen:
- Är den faktiskt använd som kalibreringsmål i `scripts/calibrate.ts`?
- Om ja: hur stor risk att vi har optimerat motorparametrar i fel riktning?
- Om nej: ingen kalibrerings-risk, bara visualiserings-risk

---

## Steg 4 — Beslut (Opus, baserat på rapport)

Efter Steg 1-3 levererade, Opus läser rapporten och avgör:

**Utfall A — Data-modellen är konsekvent:**
- Bara fixa visualiseringen i shotmap (kommentaren i koden, "konv. > 100% i corner-heavy matches", löses)
- Kalibrering oberörd
- Fas 2 återupptas direkt

**Utfall B — Data-modellen är skev, kalibrering oberörd:**
- Fixa matchCore så `shotsHome/Away` och `onTargetHome/Away` räknas konsekvent (inkludera hörn-skott)
- Verifiera att kalibreringsskript inte använder dessa fält direkt
- Fas 2 återupptas efter datafix

**Utfall C — Data-modellen är skev, kalibrering påverkad:**
- Fixa matchCore-räkningen
- Re-kalibrera berörda parametrar mot korrekt bandygrytan-data
- Eventuell sprint 25-runda för specifika metriker
- Fas 2 återupptas efter detta

---

## Vad detta INTE är

- Inte ny implementation. Diagnos först.
- Inte panik. Mest sannolikt utfall är A eller B (bara data-modell-fix), inte C (re-kalibrering).
- Inte ersättning av Fas 2. Pausar Fas 2, fortsätter sen.
- Inte alla skott-data-frågor — fokuserar på det som rör hörnor/skott-på-mål-räkningen. Andra detaljer (t.ex. vad räknas som "miss" exakt) tas bara vid behov.

---

## Estimat

- Steg 1 (matchCore-utredning): ~2h
- Steg 2 (scraper-utredning): ~1h
- Steg 3 (diff-analys): ~1h
- Steg 4 (Opus beslut): ~30 min
- Total: 4-5h Code + Opus-läsning

Detta är en halvdag. Inte en ny vecka. Värt att göra innan Fas 2 byggs.

---

## Slut SPEC_SHOT_DATA_AUDIT_2026-05-04
