# CI-baselines 2026-09-06 — diff-export (steg 0)

Källa: GitHub Actions run [34040569759](https://github.com/jacobstjarne-code/bandy-manager/actions/runs/34040569759),
job `visual-regression`, commit `957dfde5`. **Exporterat direkt ur CI:s Linux-artefakt**
(`visual-regression-report`), inte kört om lokalt på Mac — cross-OS font-rendering hade
annars gett ett helt annat, brusigare diff-set än det CI faktiskt är rött på
(se `playwright.config.ts`s kommentar om plattforms-suffixade baselines).

CI-utfall vid denna körning: **54 failed, 77 passed.**

Varje mapp nedan innehåller `before.png` (Playwrights `expected` — den gamla,
committade baselinen), `after.png` (`actual` — nuvarande rendering) och `diff.png`
(Playwrights genererade pixeldiff), rakt kopierade ur CI-artefakten utan bearbetning.

## Två scener saknar bilder — timeout, inte pixeldiff

`arrival` och `tilltrade` gav `TimeoutError: locator.waitFor` (väntar på
`getByText('DEV GALLERY')`) — Playwright hann aldrig ta någon skärmdump alls,
så det finns inget bildpar att döma. Redan känt mönster (CLAUDE.md, DEV-SCENSKALET-
sektionen: "`arrival`/`tilltrade` timeoutade i visuella grindar"), separat spårat.
Design kan inte pixel-döma dessa två — de behöver en timeout-fix i testharnesset
före de kan sorteras alls.

## De 54 scenerna (Designs sorteringslista, steg 1)

| # | scen | mapp |
|---|---|---|
| 1 | 375px-lineup-empty | `375px-lineup-empty/` |
| 2 | 375px-lineup-filled | `375px-lineup-filled/` |
| 3 | 375px-portal-bid-multi | `375px-portal-bid-multi/` |
| 4 | 375px-portal-bid-single | `375px-portal-bid-single/` |
| 5 | 375px-portal-full | `375px-portal-full/` |
| 6 | 375px-portal-grind | `375px-portal-grind/` |
| 7 | 375px-portal-normal | `375px-portal-normal/` |
| 8 | 375px-portal-tom | `375px-portal-tom/` |
| 9 | 390px-lineup-empty | `390px-lineup-empty/` |
| 10 | 390px-lineup-filled | `390px-lineup-filled/` |
| 11 | 390px-portal-bid-multi | `390px-portal-bid-multi/` |
| 12 | 390px-portal-bid-single | `390px-portal-bid-single/` |
| 13 | 390px-portal-full | `390px-portal-full/` |
| 14 | 390px-portal-grind | `390px-portal-grind/` |
| 15 | 390px-portal-normal | `390px-portal-normal/` |
| 16 | 390px-portal-tom | `390px-portal-tom/` |
| 17 | annandagen | `annandagen/` |
| 18 | arrival — **timeout, inga bilder** | `arrival/` |
| 19 | bygget | `bygget/` |
| 20 | coffee-room | `coffee-room/` |
| 21 | ekonomi | `ekonomi/` |
| 22 | granska | `granska/` |
| 23 | granska-analys | `granska-analys/` |
| 24 | granska-avsked | `granska-avsked/` |
| 25 | granska-cup | `granska-cup/` |
| 26 | granska-cup-final | `granska-cup-final/` |
| 27 | granska-level3 | `granska-level3/` |
| 28 | granska-slutspel | `granska-slutspel/` |
| 29 | granska-sm-final | `granska-sm-final/` |
| 30 | lineup-empty | `lineup-empty/` |
| 31 | lineup-filled | `lineup-filled/` |
| 32 | miljoheader-karlsborg | `miljoheader-karlsborg/` |
| 33 | miljoheader-rogle | `miljoheader-rogle/` |
| 34 | name-input | `name-input/` |
| 35 | portal-bid-multi | `portal-bid-multi/` |
| 36 | portal-bid-single | `portal-bid-single/` |
| 37 | portal-full | `portal-full/` |
| 38 | portal-grind | `portal-grind/` |
| 39 | portal-normal | `portal-normal/` |
| 40 | portal-tom | `portal-tom/` |
| 41 | renew-contract-modal | `renew-contract-modal/` |
| 42 | scouting | `scouting/` |
| 43 | season-fired | `season-fired/` |
| 44 | season-signature-reveal | `season-signature-reveal/` |
| 45 | sommaren-s2 | `sommaren-s2/` |
| 46 | sommaren-siffra | `sommaren-siffra/` |
| 47 | sommaren-titelforsvarare | `sommaren-titelforsvarare/` |
| 48 | sommaren-tomt | `sommaren-tomt/` |
| 49 | taktik | `taktik/` |
| 50 | tilltrade — **timeout, inga bilder** | `tilltrade/` |
| 51 | transfers-closed | `transfers-closed/` |
| 52 | transfers-multibids | `transfers-multibids/` |
| 53 | transfers-onebid | `transfers-onebid/` |
| 54 | transfers-open-nobids | `transfers-open-nobids/` |

## Observation för Design innan steg 1 — namnavstämning

`DESIGN_UPPDRAG_CI_BASELINES_2026-09-06.md`s steg 1 räknar upp åtta scennamn som
redan bekräftade avsedda källor: `board-a`, `board-b`, `board-c`, `season-header`,
`season-noplayoffs`, `season-fired`, `career-break`, `renew-contract-modal`.
**Ingen av `board-a`/`board-b`/`board-c`/`season-header`/`season-noplayoffs`/
`career-break` finns bland de 54 scenerna ovan** (verifierat: `grep` på de namnen
i `tests/visual/*.visual.ts` ger noll träffar — de finns inte som scennamn i
kodbasen just nu). Bara `season-fired` och `renew-contract-modal` (rad 41/43 ovan)
matchar faktiskt. Flaggat, inte tyst löst — Design bör verifiera om de sex
saknade namnen syftar på scener som bytt namn/tagits bort sedan D2-körningen mot
`4e4f3542`, eller om de hör till en annan testfil/gate helt.
