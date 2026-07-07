# Analysspec — oexploaterade ådror i Bandygrytan-datan

Beställare: Fable-genomgång 2026-07. Utförare: Code. Fable skriver findings från outputen — Code skriver inga findings, bara analyser, JSON-output och md-rapporter.

## Genomgående krav

1. **Minutkonvention:** ALL minutanalys använder halvleksflagga, aldrig regeln "minut ≥ 46 = andra halvlek". Se `INTERNAL_MINUTE_CONVENTION.md` och `MINUTE_RECOMPUTE_2026-06-03.md`. Detta är den kända fallgrop som fällde findings 008/017/041/042/043.
2. **Output:** per analys en JSON till `docs/data/` och en md-rapport (`ANALYS_*.md`) med metod, n för varje redovisad siffra, och begränsningar. Rapporten är Fables underlag — hellre för mycket metoddetalj än för lite.
3. **Skript:** deterministiska, körbara om, i `scripts/`. Ingen engångskod i konsolen.
4. **Statistik:** där flera tester körs mot samma data — Bonferroni-korrigera och redovisa både rå och korrigerad signifikans. Redovisa alltid effektstorlek, inte bara p.
5. **Datakällor:** `bandygrytan_detailed.json` (Elitserien herr/dam), `bandygrytan_allsvenskan.json`, `bandygrytan_kval.json`, `INTERNAL_referee_*.json`. Schema i `SCHEMA_DETAILED.md`.

---

## A1. Win probability-modell (prioritet 1)

**Fråga:** P(hemmavinst) som funktion av (matchminut, målskillnad hemma−borta).

**Metod:** Bygg per-match tillståndslinje från `goals[]` (herr grundserie som bas; slutspel separat om n räcker). För varje minut 1–90 och målskillnad (trunkera till −3…+3, med "±3+" som kantklasser): empirisk andel hemmavinst. Minst n=30 per cell för redovisning; celler under tröskeln slås ihop eller utelämnas med markering. Oavgjort slutresultat redovisas som eget utfall (tre-utfallsmodell), inte hopslaget. Flera mål samma minut: tillståndet efter minutens sista mål gäller från nästa minut.

**Output:** `win_prob_herr.json` (grid: minut × diff × {P_hemma, P_oavgjort, P_borta, n}), samma för dam om n tillåter (380 matcher — redovisa täckning, tvinga inte fram gles grid). Rapport: kurvor per målskillnad, "match död"-tröskel (första minut där P > 95 % givet diff), jämförelse mot halvtidspunkterna i findings 001/011/038.

## A2. Powerplay-konvertering (prioritet 2)

**OBS — LÖST 2026-07-05 (underlag hittat + persisterat):** Underlaget för findings 057–059 fanns som körbart script (`scripts/analyze_foul_penalty.py`), inte som `docs/data`-artefakt — därför gav den tidigare `docs/`-sökningen noll. Analyserna kördes den här sessionen (5 juli, inte 10 juni; "10 juni" var ett felaktigt visningsdatum, nu rättat till körningsdatum i yaml + sidor). Scriptet är nu utökat att persistera: `docs/data/foul_penalty_powerplay.json` + `docs/data/ANALYS_FOUL_PENALTY_POWERPLAY.md` (commit `3de25e7a`). Alla siffror verifierade mot sidornas påståenden. **A2 nedan är INTE en omkörning av 057–059** — den är den rigorösa extensionen (PP-konvertering per duration 5/10, reform 25/26 pre/post, shorthanded-mål) som snabb-scriptet inte beräknar. Kör A2 som ny, självständig analys.

**Fråga:** Vad ger en utvisning i mål, och ändrade reformen 25/26 detta?

**Metod:** Joina `fouls[]` × `goals[]` per match. För varje utvisning mot lag X: mål av lag Y inom `duration` minuters matchtid (5/10). Metrics: (a) PP-konverteringsgrad per duration, (b) mål/PP-minut vs mål/even-strength-minut som rate ratio, (c) shorthanded-mål (mål av X under egen utvisning), (d) allt per säsong, pre-reform-snitt vs 2025-26. Överlappande utvisningar (5v3): identifiera och särredovisa om n räcker, annars exkludera ur ren-5v4-beräkningen och flagga som begränsning. `duration=null`: anta 5 min (vanligast) och redovisa känslighetsanalys med 10-minutersantagandet samt andelen null-värden.

**Output:** `powerplay_analysis.json` + rapport. Dam separat om fouls-täckningen räcker.

## A3. Allsvenskan-jämförelse (prioritet 3)

**Fråga:** Skiljer sig Allsvenskan strukturellt från Elitserien?

**Metod:** `bandygrytan_allsvenskan.json`, 887 matcher. Jämför mot Elitserien herr: mål/match, hemmavinst%, oavgjort%, HT-ledning→vinst, målminutsfördelning (halvleksflagga), utvisningsfrekvens totalt (fouls[].team är null — ingen per-lag-analys). **Uteslut all hörnanalys** — goals[].type är opålitlig i denna fil (~45 % hörnmål är parserartefakt). CI:er på alla jämförelser.

**Output:** `allsvenskan_vs_elitserien.json` + rapport + explicit lista över vilka påståenden i finding 032 som inte längre stämmer (Fable uppdaterar findingarna).

## A4. Domaranalys — ANONYMISERAD (prioritet 4)

**Beslut från Jacob:** domare pseudonymiseras i all output, men mappningen bevaras internt så namn kan tas fram i efterhand.

**Metod:** Skapa `INTERNAL_referee_pseudonym_map.json` (verkligt ID/namn → "Domare A", "Domare B", … sorterat på antal dömda matcher, fallande). Filen behåller INTERNAL-prefix, läggs i `.gitignore` för bandy-brain-repot om den inte redan är utanför publiceringsytan, och refereras ALDRIG från publika outputs. Alla analys-outputs använder enbart pseudonymer.

Analyser (från befintliga `INTERNAL_referee_*.json`):
- (a) Reformens spridning: utvisningar/match per domare 2025-26 vs domarens eget pre-snitt — drivs +16 % brett eller av få domare? Redovisa fördelning, inte bara topp/botten.
- (b) Timing-profiler: dömer vissa domare systematiskt tidigare/senare i match?
- (c) Dam/herr: skiljer sig samma domares dömning mellan serierna?
- (d) Klubbmix-screening: deskriptiv kontroll av domare×klubb-exponering. Formulera som täckningsredovisning, inte bias-anklagelse — inga slutsatser om enskilda pseudonymer utan signifikansprövning med Bonferroni.

**Output:** `referee_reform_analysis_anon.json` + rapport. Rapporten märks INTERNAL tills Jacob beslutar om publicering.

## A5. Momentum och svarsmål (prioritet 5)

**Fråga:** Hur svarar lag på insläppta mål, och stämmer motorns momentum-mekanik med verkligheten?

**Metod:** För varje mål: tid till nästa mål, vem gör det (kvittering/utökning), villkorat på matchläge och halvlek (halvleksflagga). Baseline: obetingad målfrekvens per minut. Metrics: P(nästa mål = svar) per målskillnad, svarstidsfördelning, "snabba svar" (≤5 min) vs förväntat. Jämför mot motorns `equalizeMomentumTeam`-beteende — kör motsvarande mätning på simulerad output (befintlig stress-test-data om möjligt) och redovisa sida vid sida.

**Output:** `momentum_response_goals.json` + rapport.

## A6. Kalendereffekter (prioritet 6)

**Metod:** Bygg per-lag-schema från `date`. Metrics: vilodagar → resultat/målsnitt, juluppehållseffekt (sista matchen före vs första efter, per lag), säsongsfas (round-terciler) → mål/utvisningar/hemmafördel. Q004/Q167/Q174 i questions-trädet stängs eller besvaras delvis av detta — lista vilka i rapporten.

**Output:** `calendar_effects.json` + rapport.

## A7. Publik × hemmafördel, dam-gåtan (prioritet 7)

**Metod:** Steg 1: täckningsrapport för `attendance` per serie/säsong. Om dam-täckning < 50 %: stanna där, rapportera, gå ej vidare. Steg 2 (om täckning räcker): hemmavinst% per publikkvartil, dam vs herr, som mekanismtest av Finding 056:s +0,2 pp.

**Output:** `attendance_home_advantage.json` + rapport.

## A8. Restposter (prioritet 8)

- `overtime`/`penalties`-flaggor: frekvens, i vilka faser, målmönster i matcher som gick till förlängning.
- `own_goal`: inventering — antal, minutmönster, kontext.
- `bandygrytan_kval.json`: deskriptiv genomgång av 38 kvalmatcher (målsnitt, dramaturgi) — räcker inte för inferens, säg det rakt i rapporten.

**Output:** `restposter_ot_og_kval.json` + rapport.

---

## Leveransordning

A1 → A2 → A3 levereras först (var för sig, inte i klump — Fable skriver finding per analys medan nästa körs). A4 därefter. A5–A8 i mån av tid. Vid varje leverans: JSON + rapport + en rad i rapporten om vilka öppna Q-nummer i `docs/findings/facts/questions/` analysen berör.
