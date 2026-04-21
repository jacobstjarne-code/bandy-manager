# Sprint 24.2 — audit (Utvisnings-, straff- och fasdata per spelläge)

## Punkter i spec

- [x] **Del 1.5 — Verifieringspass** (commit 3beed13). Alla ✅: grundserie 9.12/9.12, KVF 8.81/8.81, SF 8.39/8.39, Final 7.00/7.00. Hörnmål% matchar inom 0.1pp. Fas-klassifikation korrekt.
- [x] **Del 1.1 — Utvisningar × spelläge normaliserat** (commit 3beed13). `computeFoulScorelineStats()` ackumulerar minuter per tillstånd + klassificerar fouls via pre-beräknad `scoreAtTime`.
- [x] **Del 1.2 — Utvisningar × period × spelläge** (commit 3beed13). 30-min buckets, per 1000 min.
- [x] **Del 1.3 — Straff** (commit 3beed13). 648 straffmål (5.4%), 70%-konvertering, per spelläge + 15-min buckets.
- [x] **Del 1.4 — Allt × fas** (commit 3beed13). Fouls + straff per grundserie/KVF/SF/Final, asterisk på n<10.
- [x] **Del 1.6 — Hemmafördel i slutspel per spelnummer** (commit 3beed13). Grupper per (säsong, fas, kanoniskt lagpar), sortering på datum.
- [x] **Del 4 — scoreline-utils.ts** (commit 3beed13, skapad under sprint 25a.2). `classifyAtMinute`, `accumulateScorelineMinutes`, bucket-hjälpare. Importeras av calibrate_v2.ts och analyze-stress.ts.
- [x] **Del 3 — SCORELINE_REFERENCE.md** (commit detta). Alla tabeller + tolkning per sektion + implikationer för 25b/c/d.
- [x] **Del 2 — Sektion F (utvisningar × spelläge, stress-data)** (commit 30e17eb). Jämförelse mot bandygrytan-referens per spelläge × fas.
- [x] **Del 2 — Sektion G (straff × spelläge, stress-data)** (commit 30e17eb). Gap 5 bekräftat: 0.25% vs 5.4%.
- [x] **npm run build** — exit 0.
- [x] **npm test** — 124 testfiler, 1451 tester, exit 0.
- [x] **npm run calibrate_v2** — alla 8 sektioner körde, inga krascher.
- [x] **npm run analyze-stress** — sektion F och G visas korrekt.

## Commits

| Hash    | Beskrivning |
|---------|-------------|
| 3beed13 | feat(calibrate_v2): scoreline-normalized foul + penalty extraction (1.1-1.5) |
| 30e17eb | feat(analyze-stress): add sections F (fouls × scoreline) and G (penalties × scoreline) |
| (detta) | docs: scoreline reference + sprint 24.2 audit |

## Nyckelresultat

### Hypoteser (från spec):

**Hypotes 1 (Erik) — Vinstprocent-bias:** ✅ BEKRÄFTAD
Utvisningsfrekvens normaliserat mot tid: ledning 1.04x, jämnt 0.91x, underläge 1.04x.
Nästan jämnt fördelat — bandygrytan-datan är primärt tid-i-läge-artefakt.
`scorelineFoulMultiplier` behöver inte vara starkt spellägesberoende.

**Hypotes 2 (Christoffer) — Domare-fas från ~min 60:** ⬜ EJ BEKRÄFTAD (svagt stöd)
Period-breakdown visar gradvis eskalering (12 → 27/kmin), ingen skarp brytpunkt vid 60.
Ackumulativ trötthets-/intensitetseffekt är mer sannolikt än domarbeteende-förändring.

**Hypotes 3 — Slutspels-dynamik:** ✅ DATA FINNS, MOTOR OK
Fas-targets matchar exakt. Final 27.20/kmin utvisningar (ledning) — förhöjt men n=12.
`homeAdvDelta` behöver INTE ökas globalt för slutspel — seedning är nyckeln.

### Kvantitativa referenser för Sprint 25b/c/d:

| Mått | Bandygrytan | Motor (stress) | Gap |
|------|-------------|----------------|-----|
| Utvisn/match | 3.77 | 0.45 | −3.32 |
| Straff% av mål | 5.4% | 0.25% | −5.2pp |
| Utvisn per 1kmin (snitt) | ~21.5 | ~2.5 | −19 |
| Straff per 1kmin (snitt) | ~2.7 | ~0.14 | −2.6 |
| Spellägesbias, fouls | 1.04/0.91/1.04 | ~1.25/1.00/1.03 | svag avvikelse |

Viktigt fynd: motorn producerar korrekt *relativ* spellägesfördelning (jämnt dominerar
inte, ledning och underläge likvärdiga) men ~10x för låg absolut frekvens.

## Inga motorändringar

Inga konstanter ändrades under denna sprint. Rent dataextraktions- och referenspass.

## Nye lärdomar till LESSONS.md

`scoreAtTime` i bandygrytan_detailed.json är förberäknat per utvisning — ingen
rekonstruktion av målsekvens krävs för utvisningsklassificering. Kom ihåg detta
inför Sprint 25b när liknande analys behöver köras iterativt (t.ex. kalibrerings-loop).
