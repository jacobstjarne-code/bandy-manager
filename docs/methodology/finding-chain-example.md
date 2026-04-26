# Finding-kedja som referens-mall
## Hypotes → dokumentation → åtgärd → uppföljning → meta-utvärdering

Finding 047–049 är projektets första fullständiga validerings-loop. Strukturen är:

```
Finding 047  ←  Observation + hypotes om motorns tillstånd
    ↓               (verifierad mot bandygrytan-data)
Finding 048  ←  Åtgärd: penalty-prob-fix (0,13 → 0,19)
    ↓               (motorversion bumpas, ny kalibreringskörning)
Finding 049  ←  Resultat + nästa hypotes (takbugg / hemmafördel)
```

## Vad kedjan demonstrerar

En finding behöver inte vara ett slutgiltigt svar. Den kan vara:
- En observation med explicit mätdata
- En hypotes markerad som "ej verifierat"
- En uppföljning som bekräftar eller avvisar hypotesen

Fördelen: pipelinen kan meta-utvärdera sin egen precision.
Om 047:s hypoteser stämmer i 049 är det ett tecken på att observationslogiken är tillförlitlig.
Om hypoteserna inte stämmer är det lika värdefullt — det visar var modellförståelsen är svag.

## Varför detta är pipeline-relevant

Standard-pipelinen (findings_pipeline.py) genererar findings från Q-facts och data.
En kalibrerings-loop kräver ett lite annorlunda mönster:

1. Kör stress-test → extrahera nyckeltal
2. Jämför mot calibrationTargets i bandygrytan_detailed.json
3. Generera finding med explicit hypotes/verifierat-separation
4. Åtgärda (kod-commit med motorversion-bump)
5. Kör stress-test igen → generera uppföljnings-finding

Det är inte en generativ pipeline — det är en verifierings-loop.
Pipelinen kan stödja steg 2–3 om ett script extraherar stress-test-utdata.
Steg 4–5 kräver mänsklig bedömning (vad är designval vs kalibrerings-fel?).

## Mall för framtida kalibrerings-findings

```
Finding XXX  — [System]: [nyckeltal] nära/gap mot [referens]

Mätvärden: tabell med simulator / verkligheten / avvikelse / status
Tolkning: explicit "Verifierat:" / "Hypotes (ej verifierat):"
Pekare: "Finding X+1 dokumenterar åtgärden"
```

## Kedjans meta-data

| Finding | Datum | Typ | Åtgärd |
|---------|-------|-----|--------|
| 047 | 2026-04-26 | Observation + hypotes | Nej (dokumentation) |
| 048 | 2026-04-26 | Åtgärd + verifiering | Ja (penalty-prob 0,13→0,19) |
| 049 | TBD | Uppföljning + nästa hypotes | Beror på motorversion |
