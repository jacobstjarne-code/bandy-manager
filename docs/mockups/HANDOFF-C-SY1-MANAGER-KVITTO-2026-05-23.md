# HANDOFF — C-SY1 Ticket #4 Efter-match-kvitto

**Från:** Design-Claude
**Datum:** 2026-05-23
**Svarar på:** Opus DESIGN_OVERLAMNING_2026-05-22 punkt 4 (C-SY1 #4, kod-verifikation 2026-05-22)

## TL;DR

`managerChoiceLog` finns redan på MatchReport (B8, 21 maj). Plus `lastHalftimeDecision`, `leadershipActions[]`, `awayTrip.mikrobeslut`, `pendingVictoryEcho`. **Ticket #4 är inte 10-12h sköra heuristiker längre — det är "läs choice-logg + 2-3 heuristiker för resten".**

## Vad mocken ger

Ny `ManagerKvittoSection` på MatchReportScreen, mellan score-block och momentfeed. Visar 2-4 explicita choice-rader baserat på faktiska val.

```
┌─────────────────────────────────────┐
│ 📋 DINA VAL · denna match           │
├─────────────────────────────────────┤
│ Halvtid: "Lugna ner det."           │
│ → Vi släppte in 1, gjorde 2.        │
├─────────────────────────────────────┤
│ Bortarutin: "Stoppade i Falun."     │
│ → Truppen fräsch vid 1:a avslag.    │
├─────────────────────────────────────┤
│ Lineup: Rotation 3 spelare          │
│ → Lindqvist gjorde 2.               │
└─────────────────────────────────────┘
```

Varje rad = ett **faktiskt manager-val + ett observerbart utfall**. Inte "spelet tycker du gjorde rätt" — bara "du valde X → Y hände".

## Picker-algoritm

```typescript
function buildManagerKvitto(report: MatchReport, game: SaveGame): KvittoRow[] {
  const rows: KvittoRow[] = []

  // Halvtidsval (lastHalftimeDecision)
  if (game.lastHalftimeDecision) {
    rows.push({
      label: 'Halvtid',
      choice: HALFTIME_LABELS[game.lastHalftimeDecision],
      outcome: describeSecondHalfOutcome(report),
    })
  }

  // Bortarutin (awayTrip.mikrobeslut, senaste)
  // Lineup-rotation (jämför med förra matchens lineup)
  // Leadership-action (senaste leadershipActions)
  // …
  return rows.slice(0, 4)  // max 4 rader
}
```

`HALFTIME_LABELS = { lugna: 'Lugna ner det.', pressa: 'Pressa hårdare.', prata: 'Prata individuellt.' }`

## Designval öppna

**Q1:** Visa rader för ALLA val, eller bara dem med mätbart utfall? Föreslag: bara dem med utfall. Om en rad inte kan koppla val → konsekvens, skippa.

**Q2:** Outcome-text — vem skriver den? Heuristik per choice-typ (Opus pool) eller LLM? Föreslag: Opus-pool (3-4 varianter per choice-typ) — billigare, bandysvenskt.

**Q3:** Visa rader för ALLA mikrobeslut sett över hela matchen, eller bara senaste 3? Föreslag: max 4 rader. Hellre 3 viktiga än 8 förvirrande.

## Estimat

ManagerKvittoSection-komponent: ~1h<br>
buildManagerKvitto-picker: ~1h<br>
Outcome-heuristiker per choice-typ (3 typer): ~1h<br>
Opus-pool ~20-30 strängar: externt<br>
**Total:** ~3h Code + Opus copy. Mycket lättare än skissens 10-12h tack vare choice-loggen.

— Design-Claude, 2026-05-23
