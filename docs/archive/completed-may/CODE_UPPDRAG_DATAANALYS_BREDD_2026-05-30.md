# CODE-uppdrag: Bred dataanalys, fem körningar

**Skapad:** 2026-05-30
**Beställare:** Jacob (Opus)
**Sekretess:** Blandad. P0-A och P1 går mot Bandy Brain (publika findings). P0-B och P2 är INTERN (rör domarindivider).
**Tidsbudget:** ~28 timmar Code-tid totalt. Stoppa och rapportera mellan varje prioritetsnivå.
**Bygger på:** Bandygrytan-datan, klubbmix-justeringsmetoden från `analyze-referees.py`, befintlig finding-pipeline i `scripts/findings_pipeline.py`.

---

## Övergripande

Fem distinkta analyser. Vissa delar metodiska byggblock (klubbmix-justering, baseline-beräkningar). Refaktorera till delade helper-moduler där det är vettigt — gör det en gång, använd flera gånger. Lägg helpers i `scripts/pipeline/analysis_helpers.py` eller motsvarande.

Statistisk hygien genomgående: Bonferroni eller FDR på multipel testning, effektstorlek (Cohens d eller motsvarande) bredvid p-värden, 95 %-CI på alla snittmått. Samma standard som tidigare.

Säsong 23/24 saknas — hantera per analys utan att felaktigt rapportera "inaktivitet".

---

## P0 — Måste levereras innan måndag morgon

### Analys A — Comeback-mekanikens djupanalys

**Fråga:** Vad förklarar 96–100-minuts-fenomenet (27 % comeback vs 15,7 % baseline)?

**Bryt ner fenomenet längs sju dimensioner:**

1. Per ledningsmarginal vid 96:e min: +1, +2, +3+ — vid vilken marginal är effekten starkast? Hypotes: koncentrerad till +1.
2. Utvisningstilldelning i 96–100: är det leverantörmål? Tilldelas utvisningar oftare till det ledande laget i den fasen? (Bandygrytan har inte lagattribution direkt, men vi har resultatet före och efter — om en utvisning föregår ett comeback-mål och det ledande laget tar emot målet, kan vi rimligen attribuera utvisningen till det ledande laget.)
3. Mål-typer i fasen: öppna spelmål, hörnmål, straffmål — fördelning vs övriga matchminuter.
4. Power play-state under comeback-mål: spelades de av lag i man-up?
5. Klubb-distribution: är fenomenet drivet av några få klubbar eller jämnt över serien?
6. Fas-fördelning: starkare i grundserie eller playoff?
7. Säsongsstabilitet: var effekten lika stark 2019/20 som 2025/26?

**Output:**
- `docs/data/comeback_mechanics.json` — strukturerade resultat
- Ny finding i `bandy-brain/src/data/findings/` (nästa lediga nummer) med titel som "Comeback-fönstret 96–100" eller liknande. Använd befintliga finding-templates som mall.
- Hela analysen ska vara publikt publicerbar — inga domarnamn, inga individdata.

**Edge case:** Slutminuts-fasen 96–100 förutsätter att 96:e minuten ÄR speltid (90 ord + 6 min förlängning i bandy är inte normalt format — kontrollera vad "96–100" faktiskt betyder i Bandygrytans data). Om det är förlängningsmatcher specifikt: avgränsa tydligt och rapportera n. Om det är slutet av andra halvlek: räkna minutreferenser noggrant.

---

### Analys B — "Våga visa rött"-effektens kompletta utvärdering

**Fråga:** Liganivåhoppet +25 % herr / +27 % dam säsong 25/26 — vad innehåller det?

**Bryt ner längs sex dimensioner:**

1. Per fas: grundserie vs playoff. Playoff 25/26 är inte komplett — hantera den begränsningen.
2. Per period i matchen: 0–29 / 30–59 / 60–89 / 90+. Direktivet implicerar att tidiga utvisningar borde öka — testa det specifikt.
3. Per matchtemperatur: ökar varma matcher (höga baseline-utvisningar) eller jämna matcher mer? Det är en kärnfråga — om reformen syns mest i jämna matcher, då har den materiell effekt på matchutfallet. Om den syns mest i varma matcher, då är det mest "stora känslor får stora svar".
4. Per domare-segment: är ökningen jämnt fördelad över alla 18 huvuddomare, eller koncentrerad till några få? (Här blir analysen INTERN — domarnamn används bara i intern rapport.)
5. Röda kort specifikt: om Bandygrytan loggar röda kort separat, är det främst en ökning i utvisningar generellt eller i grova matchstraff specifikt?
6. Tidiga röda kort (0–29) som andel: detta är hela direktivets explicita mål — testa det specifikt.

**Output:**
- `docs/data/INTERNAL_reform_effect_complete.md` — fullständig intern rapport med domarsegmentering
- Uppdaterad/utökad version av `INTERNAL_REFEREE_DEEP_DIVE.md`s kapitel 3
- En *publik* version som finding i Bandy Brain — endast liganivå- och fas-uppdelningarna, inga individdata. Titel exempelvis "Säsong 25/26: mätbar ökning i utvisningsfrekvens".

**Edge case:** Cup-matcher i 25/26 om de är scrappade — flagga om de drar liganivå-snittet annorlunda än ren elitserie. Hantera dem som egen fas.

---

## P1 — Levereras om P0 är klart före söndag eftermiddag

### Analys C — Klubb-temperaturkarta

**Fråga:** Vilka matchups är "varma" och "kalla" i serien? Är vissa matchups konsistent oavsett vem som dömer?

**Beräkna per matchup (alla par av klubbar):**

- Antal möten i datasetet (n)
- Utvisningar/match (snitt + 95 %-CI)
- Mål/match (snitt + CI)
- Hörnor/match (snitt + CI)
- Hemmavinst% (binomialt CI)
- Bortavinst%
- Standardavvikelse i utfall — vilka matchups är "förutsägbart" varma och vilka är volatila?

**Identifiera:**

- De 10 varmaste matchupsen (högsta utvisningssnitt, n≥6)
- De 10 kallaste (lägsta utvisningssnitt, n≥6)
- Asymmetri-effekten: skiljer sig samma matchup beroende på vilken klubb som är hemma? (t.ex. Hammarby–AIK hemma i Zinkensdamm vs AIK–Hammarby i AIK-hallen)

**Output:**

- `docs/data/klubb_temperatur.json`
- Ny finding i Bandy Brain med visualisering. Två heatmaps: en för utvisningstemperatur, en för måltemperatur. Bandy Brain använder Astro — använd existerande mönster i Bandy Brains finding-templates.
- Publikt publicerbar.

---

### Analys D — Spelstilsklustring av klubbar

**Fråga:** Hur många stilkluster finns i Elitserien? Vad karaktäriserar dem?

**Per klubb-säsong, beräkna en feature-vektor:**

- Mål/match (offensiv produktion)
- Insläppta mål/match (defensiv styrka)
- Mål-differential
- Hörnor/match
- Hörnmålsandel
- Utvisningar/match
- Straffmål/match (offensiva)
- HT-lednings-frekvens
- HT-lednings-konvertering (vinst given HT-ledning)
- Hemmaplans-effekt (vinst-pp hemma minus borta)
- Comeback-frekvens (vinster givet HT-underläge)
- Late-game performance (mål 75–90 minus insläppta 75–90)

**Standardisera** alla features (z-score per säsong). Kör k-means med k ∈ {3, 4, 5, 6}. Välj efter både silhouette score och tolkbarhet — om k=4 har silhouette 0.42 och k=5 har 0.45 men k=4 har mer distinkta kluster prosaiskt, välj k=4 och dokumentera valet.

**Karaktärisera varje kluster:**
- Prototypisk profil (mean feature-vektor)
- Klubb-säsongerna i klustret
- Klubbar som ofta hamnar i klustret över åren (om en klubb är konsekvent i kluster X över 4 säsonger är det en stilsignatur)

**Hypotes-mall (att testa, inte anta):**
- Hörnberoende defensiva
- Öppet spelande offensiva
- Disciplinerade resultatlag
- Fysiska hårda klubbar
- Volatila underlag

Klustren ska inte tvingas in i den mallen — låt datan tala.

**Output:**

- `docs/data/klubb_kluster.json` — alla klubb-säsonger med kluster-tilldelning
- Ny finding i Bandy Brain med kluster-typologin och interaktiv visualisering om Bandy Brain stödjer det, annars statisk
- Publikt publicerbar

**Edge case:** Promotion/relegation över åren — vissa klubbar finns i Elitserien bara vissa säsonger. Filtrera klubbar med <3 säsonger i datasetet om de stör klustringen.

---

## P2 — Bonus om tid finns

### Analys E — Tidsmönster-profiler för domare

**Fråga:** Efter klubbmix-justering, fördelar enskilda domare sina utvisningar olika över matchminuter? Finns det "tidiga visslare" och "sena visslare"?

**Per domare (n≥30 totalt, n≥10 per säsong):**

- Klubbmix-justerad utvisningsfrekvens per period (0–29, 30–44, 45–59, 60–74, 75–89, 90+)
- Z-score mot ligamedel per period
- Säsongsstabilitet: är mönstret stabilt eller varierar det?
- Korrelation med deras totala utvisningsfrekvens (tidiga visslare som är genomgående hårda vs som är mer balanserade i sluttiden?)

**Output:**
- `docs/data/INTERNAL_referee_timing_profiles.json`
- Sektion i `INTERNAL_REFEREE_DEEP_DIVE.md`
- INTERN — gå INTE till Bandy Brain.

---

## Refaktorering att göra under tiden

Skapa `scripts/pipeline/analysis_helpers.py` med:

- `matchmix_adjust(referee_or_subject, metric, dataset)` — generaliserad version av klubbmix-justeringen
- `baseline_for_matchup(home, away, dataset, exclude_subject=None)` — beräkna baseline med möjlighet att exkludera den studerade enheten
- `bonferroni_or_fdr(p_values, method='bonferroni')` — multipel-testning-helper
- `effect_size(group_a, group_b, method='cohens_d')` — effektstorlek
- `ci_for_proportion(successes, trials, alpha=0.05)` — binomialt CI
- `ci_for_mean(values, alpha=0.05)` — bootstrap eller t-baserat

Använd dem genomgående i alla fem analyserna. Det säkerställer metodologisk konsistens och gör koden lättare att granska.

---

## Output-strategier — vad blir publikt vs intern

Bandy Brain-publicerbart (offentligt):
- Analys A (comeback)
- Analys B publika version (liganivå, fas)
- Analys C (klubb-temperatur)
- Analys D (kluster)

INTERNT (gitignored):
- Analys B kompletta version (med domar-individdata)
- Analys E (tidsprofiler per domare)

---

## Acceptanskriterier

- [ ] Refaktorerade helpers ligger i `analysis_helpers.py` och används i alla relevanta analyser
- [ ] Varje P0-analys har egen rapport-/finding-fil + JSON-stöddata
- [ ] Bandy Brain-findings följer existerande template-mönster
- [ ] Inga domarnamn i publika findings
- [ ] Statistisk hygien genomgående (effektstorlek + CI + multipel-test-hantering)
- [ ] Edge cases dokumenterade per analys
- [ ] `.gitignore` täcker alla INTERNAL-filer
- [ ] Begränsningar uttömmande listade — inklusive att Bandygrytans skottdata är ofullständig och att foul-team är null

---

## Vad Code INTE ska göra

- Inte tolka findings som "bevis på" något — alltid deskriptivt
- Inte föreslå policyändringar för förbundet eller klubbar (det är inte vår roll)
- Inte göra externa lookups utan att fråga Jacob
- Inte tvinga in resultaten i förutbestämda hypoteser — om kluster-analysen ger tre snarare än fyra naturliga kluster, rapportera tre
- Inte använda mer än 28h totalt utan att stämma av
- Inte hoppa över refaktoreringen och göra fem isolerade scripts — det skapar metodologisk inkonsistens

---

## Rapporteringsrytm

Efter varje prioritetsnivå: en sammanfattning på 8–12 rader till Jacob:

1. **Efter P0** — vad fynden visar, eventuella oväntade resultat eller datafrågor, om P1 ska köras direkt
2. **Efter P1** — samma format
3. **Efter P2 om den körs** — kort notis

Stoppa och fråga om något oväntat dyker upp — exempelvis att comeback-fenomenet visar sig vara helt drivet av en specifik klubb (då ändras hela tolkningen), eller att kluster-analysen ger orimliga eller ointressanta resultat (då justerar vi feature-set).

Ingen tystnad i mer än 6 timmar utan rapport om Code fortfarande arbetar.
