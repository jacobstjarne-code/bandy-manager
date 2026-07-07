# A3 — Bandyallsvenskan vs Elitserien herr

**Analys:** ANALYSSPEC_VAG2_OEXPLOATERAT.md A3. **Utförare:** Code. Fable skriver finding + uppdaterar 032.

## Datakvalitet — läs först

Allsvenskan-filen (887 grundseriematcher) har ojämn loggning: {'partial': 528, 'full': 204, 'minimal': 155}. `goals[]` rekonstruerar slutresultatet i endast ~82% av full-loggade matcher, så **event-baserade mått är svagare än Elitseriens**. Därför: mål/match och resultatfördelning från **slutresultat** (robust, alla matcher); mål-minutfördelning enbart på delmängd där `goals[]`==slutresultat; utvisningsfrekvens som **under-loggat golv**. Uteslutet: hörnanalys (`type` opålitlig, ~45% hörnmål = artefakt), per-lag-fouls (team saknas), 1H/2H-split (ingen halvleksflagga — minut≥46-regeln förbjuden).

## Match-nivå (robust — ur slutresultat)

| Mått | Allsvenskan | Elitserien herr | Effektstorlek |
|---|---|---|---|
| Mål/match | 9.16 (95% CI 8.94–9.37) | 9.12 (8.93–9.31) | Cohen's d = 0.01 |
| Hemmavinst | 51.2% (CI 47.9–54.5) | 50.2% (CI 47.3–53.1) | Cohen's h = 0.02 |
| Oavgjort | 12.6% (CI 10.6–15.0) | 11.6% (CI 9.8–13.6) | Cohen's h = 0.033 |
| Bortavinst | 36.2% (CI 33.1–39.4) | 38.3% (CI 35.5–41.1) | Cohen's h = -0.043 |
| HT-ledning→vinst | 79.5% (n=356, CI 75.0–83.4) | 80.1% (n=528, CI 76.5–83.3) | Cohen's h = -0.015 |

Bonferroni: 4 huvudtest — tolka h/d, inte enbart p; CI-överlapp anges per rad.

## Mål-minutfördelning (rå minut, ENDAST complete-loggade matcher)

Allsvenskan: 6009 mål ur 687 complete-loggade matcher. Elitserien: 9330 mål ur 1066. **Ingen 1H/2H-split** — halvleksflagga saknas i allsvenskan-filen.

| Fönster | Allsvenskan | Elitserien herr |
|---|---|---|
| 1-15 | 15.6% | 15.3% |
| 16-30 | 15.2% | 15.4% |
| 31-45 | 15.9% | 16.0% |
| 46-60 | 18.1% | 17.8% |
| 61-75 | 16.7% | 16.5% |
| 76-90 | 18.6% | 19.1% |

## Utvisningsfrekvens

**Allsvenskan 4.6 utv./match vs Elitserien herr 3.77** — allsvenskan ligger ~22% högre.

Detta är den enda tydliga strukturella skillnaden mellan serierna. Till skillnad från en tidigare hypotes är siffran **inte** ett under-loggat golv: `loggingQuality` spårar inte foul-completeness — utvisningar loggas i samma spann oavsett kvalitetsetikett (full/partial/minimal nedan är icke-monotont, `full` är till och med lägst). 4.6 är därför en rimlig punktskattning, inte en undre gräns.

| loggingQuality | Utv./match | n |
|---|---|---|
| full | 4.24 | 204 |
| partial | 4.78 | 528 |
| minimal | 4.45 | 155 |

*Kvarstående förbehåll:* en systematisk skillnad i loggningsnivå mellan allsvenskan-filen och elitserie-filen kan inte helt uteslutas, men riktningen (fler utvisningar i allsvenskan) är robust eftersom foul-loggningen inom allsvenskan inte samvarierar med kvalitetsetiketten.

## Findings som berörs

- **Finding 032** ("Målminutsfördelning per division: ingen data tillgänglig"): delvis inaktuell. En rå-minutfördelning på divisionsnivå (allsvenskan) ÄR nu möjlig för complete-loggade matcher (687 st). Men 1H/2H-splitten är fortfarande otillgänglig (ingen halvleksflagga), så påståendet stämmer för halvleksuppdelad fördelning, inte för rå minut. **Fable: formulera om 032 till att data finns för rå minut men inte per halvlek.**
- **Finding 066**: refereras i spec:en men **existerar inte** (ingen sida, ingen yaml-post 001–061). Kan inte adresseras — spec-referensen är felaktig. **Fable: kontrollera vilket nummer som avsågs.**

## Begränsningar

- Event-baserade mått (mål-minut, utvisningar) begränsas av allsvenskans ojämna loggning; match-nivå (slutresultat) är opåverkat.
- Grundserie i bägge serier. Allsvenskan 2024-25 endast 28 matcher (partiell säsong).
- Hörnanalys utesluten (goals[].type opålitlig i denna fil).
- Ingen per-lag-utvisningsanalys (fouls[].team saknas i allsvenskan-filen).

## Öppna Q-nummer som berörs

Divisionsjämförelse-frågorna bakom finding 032 samt varje Q i `docs/findings/facts/questions/` som rör Allsvenskan vs Elitserien-struktur.
