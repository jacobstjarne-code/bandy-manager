# CODE INSTRUCTION — Match Engine Anomaly Audit
**Datum:** 2026-05-14
**Typ:** Data-analys (ingen kodändring i engine)
**Output:** Markdown-rapport till `docs/findings/`

## Mål

Hitta 3-5 icke-triviala mönster i match engine-datat som `validate.ts` inte fångar. Fokus är fördelningsform, betingade sannolikheter, tids­dynamik inom match och signalkoppling mellan motorns delsystem och utfall. Inga kodfixar i denna instruktion — bara analys och hypotes.

## Förförståelse — läs först, i denna ordning

1. `data-warehouse/README.md` — schema, sampling buckets, kända begränsningar
2. `scripts/data-warehouse/validate.ts` — vad som redan testas
3. `data-warehouse/reports/initial-run-validation.md` — senaste körningens siffror (1050 matcher, engine 1.0.0, målsnitt 9.058, hemmavinst 45.5%, hörnsnitt 16.5)

## Vad som redan testas i validate.ts (rapportera INTE)

- Matchantal, unika seeds, bucket-distribution, engine version-konsistens
- Period-sum mot match-total, NULL-kontroll i kritiska kolumner
- Målsnitt (tolerans ±2), hemmavinst-rate (±10%-enheter), hörnsnitt (band 5-40)
- Reproducerbarhet på 5 matcher

## Redan auditerat tidigare (rapportera INTE)

- Academy player attribute distribution (april 2026)
- Playoff double-counting, cup bracket
- Period-shots/possession är NULL — känd begränsning

## Default-filtrering

**Filtrera alltid på `sampling_bucket = 'realistic'` (600 matcher) såvida analysen explicit handlar om buckets.** `control` och `limits` har `homeAdvantage=0` och förvrider aggregat. `varied` och `edge` har bredare parameterrymd än verkligheten.

## Analyser att köra

### Analys 1 — Fördelningsform för totalt målantal

- **Data:** `realistic`-bucket, kolumn `home_goals + away_goals`
- **Beräkna:** medel, varians, skewness, kurtosis. KDE för modalitet.
- **Test:** Jämför mot Poisson(λ=9.12) via Q-Q plot och chi-square goodness-of-fit. Beräkna också variance-to-mean ratio (Poisson har VMR=1; bandyverklighet har lätt overdispersion).
- **Hypotes som testas:** Frekvensbaserade motorer utan momentum-koppling tenderar producera *underdispersion* (för smal fördelning) jämfört med Poisson-baseline.
- **Fynd om:** VMR < 0.8 eller > 1.4, eller chi-square p < 0.01 mot Poisson.

### Analys 2 — P(slutresultat | halvtidsresultat)

- **Data:** `match_periods` + `matches`. Beräkna halvtidsdiff = period1.home_goals - period1.away_goals (hemmaperspektiv).
- **Korstabell:** halvtidsdiff bucketed (−3, −2, −1, 0, +1, +2, +3, ≥+4) × slututfall (home_win, draw, away_win). Procent av rader per halvtids-bucket.
- **Referens:** I verklig bandy vinner lag med +2 i halvtid ~80%, med +3 ~90%, med −2 ~10%. Tolerans: ±10%-enheter.
- **Fynd om:** Mer-än-tolerans-avvikelse i någon halvtids-bucket med n ≥ 30.

### Analys 3 — Tidsfördelning av mål inom halvlek

- **Data:** `match_events` filtrerade på måltyp + tidsstämpel per match
- **Beräkna:** Inter-arrival times mellan mål per match. Pool över alla matcher.
- **Test:** Mot exponential-fördelning (= homogen Poisson-process = "ingen momentum"). KS-test, eller jämför coefficient of variation (CV) mot 1.0. CV >> 1 indikerar klustring (momentum), CV << 1 indikerar mer regelbundenhet än Poisson.
- **Bonus:** Plotta histogram över inter-arrival times. Visuellt påtagliga avvikelser från exponential-form är fynd.
- **Hypotes:** Frekvensbaserade motorer ger CV ≈ 1 (inget momentum). Bandyverklighet har CV > 1.2.

### Analys 4 — Hörnmål-konvertering per cornerStrategy

- **Data:** `realistic`-bucket. För varje match: corner_goals = SUM(match_events WHERE is_corner_goal=1 AND scoring_side=home) / matches.home_corners. Samma för bortalag.
- **GROUP BY** `home_corner_strategy` respektive `away_corner_strategy`. Beräkna mean och CI per strategi.
- **Förväntan:** aggressive > standard > safe i konverteringsgrad. Skillnad bör vara mätbar (≥ 2 procentenheter).
- **Test:** ANOVA eller paired chi-square på rådata.
- **Fynd om:** Effekt-storlek är < 1 procentenhet (= systemet är kosmetiskt), eller om ordningen är fel (safe konverterar mer än aggressive).

### Analys 5 — Väder × taktik i tail-events

- **Data:** Hela datamängden, eller `realistic`-bucket — välj och motivera.
- **Definiera tail:** Top 5% av total_goals och bottom 5%.
- **Korstabell tail-matcher:** `weather_condition` × `home_mentality` (eller kombinationer). Jämför fördelning av kategorier i tail mot deras fördelning i hela datamängden via χ²-test.
- **Förväntan:** Tail-matcher domineras av rimliga kombinationer — heavySnow/poor ice + båda defensive i bottom-tail, clear/excellent ice + båda offensive i top-tail.
- **Fynd om:** Fördelningarna är statistiskt indistinguishable från basen (väder och taktik påverkar inte tail-utfall = svag signalkoppling), ELLER fördelningarna är dominerade av icke-uppenbara kombinationer.

## Process — för varje potentiellt fynd

Innan du rapporterar, gör motargumenten:

1. **Stickprovsbrus.** Är n stort nog för effekten? Beräkna CI eller p-värde.
2. **UX-relevans.** Skulle spelaren märka det? En 2%-avvikelse i vinst-rate märks inte; 15% gör det. En halvtid-momentum-effekt 5%-enheter fel kanske inte spelar roll; 20%-enheter gör det.
3. **Alternativ förklaring.** Sök i `bandy-brain/`, `docs/research/`, `docs/code-review/` efter dokumenterad anledning innan du anropar "modellfel".

**Avvisa fynd där svaret är "ja" på något av dessa.**

För kvarvarande fynd: peka mot specifik modul i `bandy-brain/` — corner system, träthet, ice condition, suspension dynamics, possession-derivation, eller momentum/sequence-logik om sådan finns. Ge radhänvisning där det går.

## Output-format

Skriv rapport till: **`docs/findings/ENGINE_ANOMALIES_2026-05-14.md`**

Per fynd:

```
### Fynd N — [Rubrik]

**Vad:** En mening.
**Bevis:** Siffror + jämförelsetabell mot förväntat värde. Inkludera SQL/Python-snippet som producerade det.
**Mekanism-hypotes:** Vilken modul + radhänvisning om möjligt.
**Konfidens:** hög / medel / låg + en mening varför.
**Nästa steg:** Vad som skulle bekräfta eller motbevisa fyndet.
```

Avsluta rapporten med en sammanfattning: vilka analyser som kördes, vilka som avvisades efter motargument, och vad som kvarstår.

## Stopp

3-5 verkliga fynd som överlevt motargumenten. Hellre färre och starkare. Två väl underbyggda fynd är bättre än sju brusiga.

## Vad du INTE ska göra

- Rapportera det `validate.ts` redan testar
- Rapportera "medel stämmer" — vi vet
- Modifiera engine-koden — bara analys, fixar kommer i separat instruktion
- Köra i plan mode — det här är implementation/analys, inte writing
- Be om förklaring innan du börjar — börja, fråga vid genuin blockerare
