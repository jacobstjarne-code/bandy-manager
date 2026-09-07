# CI-baselines runda 2 — diff-export (steg 0)

Källa: GitHub Actions run [34061448219](https://github.com/jacobstjarne-code/bandy-manager/actions/runs/34061448219),
workflow `app-ci`, commit `3cd208f78d397a690ee573cca105de3156a00f08`.
Exporterat direkt ur CI-artefakten `visual-regression-report`; ingen lokal
omrendering har gjorts.

Artefakten innehåller 65 kompletta Playwright-tripplar. Den tidigare exporten
`docs/visual-review/ci-baselines-2026-09-06/` omfattar 54 scennamn. En
mängdjämförelse mellan scennamnen gav exakt de elva mapparna nedan.

Varje scenmapp innehåller:

- `before.png` — CI-artefaktens `expected`, alltså committad baseline.
- `after.png` — CI-artefaktens `actual`, alltså rendering i run 34061448219.
- `diff.png` — Playwrights pixeldiff.

Alla 33 exporterade PNG-filer har bytejämförts (`cmp`) mot motsvarande fil i
den nedladdade artefakten. Samtliga matchar exakt.

## De elva faktiskt nya diffscenerna

| # | scen | mapp |
|---|---|---|
| 1 | board-a | `board-a/` |
| 2 | board-b | `board-b/` |
| 3 | board-c | `board-c/` |
| 4 | portal | `portal/` |
| 5 | primary-event-vs-farewell | `primary-event-vs-farewell/` |
| 6 | primary-smfinal-vs-deadline | `primary-smfinal-vs-deadline/` |
| 7 | season-header | `season-header/` |
| 8 | season-noplayoffs | `season-noplayoffs/` |
| 9 | season-share | `season-share/` |
| 10 | sm-victory | `sm-victory/` |
| 11 | upptakt | `upptakt/` |

## Avvikelse mot Designs preliminära runda-2-lista

Källtabellen i `docs/incoming/CI Baselinedom.dc_0907.html` kunde inte läsa
pixlarna och listade preliminärt `career-break`, `season-a`, `season-b`,
`season-c` och `journalist-relationship` som fem av de elva. De fem är **inte**
nya diffmappar i den faktiska CI-artefakten. Artefaktens fem motsvarande nya
namn är `portal`, `primary-event-vs-farewell`,
`primary-smfinal-vs-deadline`, `sm-victory` och `upptakt`.

Sex namn överlappar mellan den preliminära listan och artefakten:
`board-a`, `board-b`, `board-c`, `season-header`, `season-noplayoffs` och
`season-share`.

Designs steg 2 ska därför pixel-döma mapparna i denna export och uppdatera
källmappningen för de fem avvikande scenerna, inte anta att de preliminära
namnen motsvarar artefaktens faktiska felset.
