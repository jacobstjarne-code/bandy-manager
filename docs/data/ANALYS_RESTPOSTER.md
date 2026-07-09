# A8 — Restposter (overtime / självmål / kval)

**Analys:** ANALYSSPEC A8 — svepets sista. **Utförare:** Code. Fable avgör finding vs restpost-not.

## Datagap — läs först

Spec:en listade tre poster; **två av fälten finns inte i datan:**

- **Overtime/straffläggning:** ingen flagga. Matcher som gick till förlängning kan inte identifieras. Proxy: 2 oavgjorda av 159 knockout-matcher (herr) — noll betyder att förlängning avgjorde dem, men frekvensen är omätbar utan flagga.
- **Självmål:** `goals[].type` är bara open/corner/penalty; ingen self/own-goal-markering och inget separat event. Självmål kan inte inventeras.
- **Straffar (tilldelade):** FINNS → redovisas per fas nedan.

## Fas-breakdown (herr)

| Fas | n | Mål/match | Straffar/match | Oavgjort% | Hemmavinst% |
|---|---|---|---|---|---|
| regular | 1124 | 9.12 | 0.77 | 11.6% | 50.2% |
| quarterfinal | 68 | 8.81 | 0.59 | 1.5% | 60.3% |
| qualification | 38 | 8.66 | 0.79 | 26.3% | 36.8% |
| semifinal | 38 | 8.39 | 0.61 | 2.6% | 57.9% |
| playoff | 28 | 10.25 | 0.96 | 0.0% | 60.7% |
| round_of_16 | 13 | 9.08 | 0.54 | 0.0% | 61.5% |
| final | 12 | 7.0 | 0.58 | 0.0% | 50.0% |

Slutspelsfaserna har färre mål än grundserien (bekräftar Finding 006; finalen lägst med 7.0 mål/match). Straff-frekvensen är stabil mellan faser. 2 av 159 knockout-matcher står som oavgjorda (sannolikt serieaggregat eller data-egenhet); förlängning/straffläggning syns inte som flagga. Kvalfasen har hög oavgjort-andel (26 %), förenligt med tvåmötesformat.

## Kvalmatcher (deskriptivt)

38 kvalmatcher — deskriptivt only. För litet för inferens om kval-dramaturgi. 38 matcher över säsongerna ['2019-20', '2020-21', '2021-22', '2022-23'].

| Mått | Värde |
|---|---|
| Mål/match | 8.66 |
| Hemmavinst% | 36.8% (CI 23–53) |
| Oavgjort% | 26.3% |

Med 38 matcher räcker det inte för inferens om kval-dramaturgi skiljer sig från grundserien — siffrorna är riktmärken, inte slutsatser.

## Sammanfattning för Fable

Materialet är tunt och två av tre poster är icke-mätbara i datan. Detta lämpar sig troligen som **restpost-not i rapportform**, inte en egen finding — om inte fas-breakdownens slutspels-målnedgång (som ändå står i 006) motiverar en kort notis. Fables bedömning.

## Begränsningar

- Overtime och självmål saknas som fält (se datagap).
- Kval: 38 matcher, för litet för inferens.
- 2023-24 saknas i grundserie-datan.
