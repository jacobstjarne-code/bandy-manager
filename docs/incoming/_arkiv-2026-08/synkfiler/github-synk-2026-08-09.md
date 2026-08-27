repo: jacobstjarne-code/bandy-manager
branch: main

## Last sync
date: 2026-08-09T11:10:00Z
commit: 5a955a8 (tree hash from github_get_tree; not a verified commit sha; repo advanced from 229642a since prior parts)

### Verklighetskoll (2026-08-09)
- Krönikan finns REDAN: src/presentation/screens/HistoryScreen.tsx ("Klubbhistorik" — Resan-graf/JourneyGraph, säsongskort, all-time-rekord, Hall of Fame, blodslinje/Spine, flikar Säsonger/Brev/Skoluppgifter/Lagfoton). Delar atom med SeasonSummaryScreen + seasonSummaryService via SeasonSummary-entiteten.
- Utbyggnadskedjan finns REDAN: src/domain/data/facilityNodes.ts + facilityService.ts (grenar anlaggning/verksamhet/akademi, beroenden, buildRounds, financing kassa/kommun/mecenat, säsongsstartens Valet). Min "civila projekt-kedjan" var mest redan byggd; genuint nytt = projekt bortom egna arenan + ambition efter hallen.
- Vision 1a omreviderad till "lyft, inte ny yta" + delad byggsats (SeasonSummary som atom, density full/mini för ceremoni vs almanacka).

### Updated in this project
- "Djupgranskning Bandy Manager.dc.html" — oberoende kodgranskning (arkitektur, designsystem, speldesign/säsongsleverans, onboarding).
- "Systemgranskning Bandy Manager.dc.html" — del 2: system-för-system, kopplingsväv, säsongssuccession, downstream "liv & äventyr"-analys. Token-driven mot bundet designsystem.
- "Orten och Ekonomi — djupdykning.dc.html" — del 3: rad-för-rad om bygdens puls, kommunalråd/val, frivilliga, hallprövning, svänghjulet Orten↔ekonomi, och var livet stannar vid säsongsgränsen.
- "Systematlas och rättelser — del 4.dc.html" — del 4: komplett atlas över ~55 system + fyra ärliga rättelser till del 1–3 (arcService/storyline-motorn, AI-klubbar lägger bud & drabbas av skandaler, styrelsens ratchet + epok-grindade veckobeslut, nemesis/rival-sale finns wirade). Skärpt långtidsdom + justerat omdöme.
- "Vision — fria händer.dc.html" — tre konceptytor (Krönikan/Ödesväven/De elva andra) + delad byggsats.
- "Implementationsaudit — tre ytor.dc.html" — Portal/Squad/Tabell: verkliga tillstånd, omkomponering i husets tokens, diff mot riktiga filer, regressionsnot.
- "Implementationsaudit del 2 — SeasonSummary, Inbox, Transfers.dc.html" — SeasonSummary (kapitel-indelning + dedupe storylines + card-stagger-7 saknas + delad atom m. History), Inbox (stark; fixa emoji-i-copy + outlet-regex), Transfers (lyft inkommande bud till förstaklasskort på Marknad, krok till öppna trådar).

### Rättelser efter Jacobs feedback (2026-08-09)
- Portal: prioritetslager finns REDAN (PHASE_BIAS + PHASE_CARD_BIAS sedan B1; primärkortsvikter SM-final 100/cupfinal 98/avsked 82/derby 80/next_match 10). Ingreppet är ett TAK på atmosfärslagret, inte en ny prioritetsmotor. "Denna vecka"-komponenten uppskjuten (för invasiv mid-sluttest). Portal ägs av Jacob → diagnos, ej färdig lösning.
- Regressionsbaselinen (Playwright per tillstånd) lyft till FÖRST — byggs före ytorna så den verifierar dem. playwright.config.ts finns redan i repot.

## Screen map
| Skärm/artefakt | Byggd från (repo-filer) |
|---|---|
| Djupgranskning Bandy Manager.dc.html | CLAUDE.md, docs/match-engine-refactor/00-architecture.md, design-system/README.md, src/domain/entities/{SeasonSummary,SeasonSignature,Player}.ts, src/domain/services/{clubEraService,clubMemoryService,academyService,boardObjectiveService}.ts, src/presentation/screens/{ArrivalScene,ClubSelectionScreen}.tsx, src/application/useCases/*, docs/BACKLOG.md |
| Systemgranskning Bandy Manager.dc.html | src/application/useCases/roundProcessor.ts + processors/* (17), seasonEndProcessor.ts, src/domain/services/{economyService,demandEngine,narrativeProcessor(proc),playerDevelopmentService,aiTransferService,academyService,clubMemoryService,boardObjectiveService}.ts, _ds tokens (colors_and_type.css) |
| Orten och Ekonomi — djupdykning.dc.html | src/application/useCases/processors/communityProcessor.ts, src/domain/services/{politicianService,volunteerService,scoutingService,chemistryService,insandareService,contextualSponsorService,economyService}.ts, src/domain/entities/Community.ts |

## Notes
- Livesajten (bandymanager.vercel.app) gick inte att nå via hämtare; granskningen bygger på källkoden i repot.
