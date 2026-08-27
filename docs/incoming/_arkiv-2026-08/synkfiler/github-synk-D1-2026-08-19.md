repo: jacobstjarne-code/bandy-manager
branch: main

## Last sync
date: 2026-08-19T11:00:00Z
commit: b7d133f (tree hash; not a verified commit sha)

### D1 — eventköns viktning (2026-08-19)
- "Eventkoens viktning - D1.dc.html" — tre vikter (ambient/normal/pivotal) mappade på DecisionCards BEFINTLIGA shape(none/sharp/round)+size(sm/lg), ingen ny komponent. Ambient=PortalBeat-rad utan kort; normal=card-sharp i flödet; pivotal=card-round/lg + mörk backdrop + kopparram + "därför nu"-rad (väger, ceremoniar ej). Konsekvensnivå = markör på EventChoice (⚠+subtitle i --danger), får ALDRIG ändra kortets ram/storlek. Batch-av-tre = stapel med räknare 1/3 + progresstreck, ett aktivt i taget. Å7: Granska inline-beslut = normal-vikt, + dubbelpadding-fix (shape:sharp sätter padding:10px 12px inuti card-sharp som redan padder). Läst mot DecisionCard/DecisionChoices/EventOverlay @b7d133f.

## Last sync
date: 2026-08-18T08:20:00Z
commit: fc5d64d (tree hash from github_get_tree; not a verified commit sha)

### O15 — Taktikens två lägen (2026-08-18)
- Brief O15 (Opus, i chatten): M-01/Å2. Progressiv disclosure — standardläge (2 föreslagna ändringar + delta mot förra matchen + väg in) vs avancerat (alla 8, 44px träffytor, ändringshistorik). Standard default. Villkor: alla 8 dims kvar → tacticModifiers; "Följ rådet" ändrar bara de föreslagna (suggestedMentality+suggestedPress); passivt tills tryck.
- Läst @fc5d64d: TacticBoardCard.tsx (tactic/, klubbvyn), match/TacticStep.tsx (förberedelse), tacticData.ts (delad tacticRows, 8 dims/3 grupper), tacticModifiers.ts. Å2-bug bekräftad: FÖRESLÅS-pill top:-6 i overflow:hidden klipps; 6.5px pill / 4px prick.
- "Taktikens tva lagen - O15.dc.html" — options-canvas, 3 vikter (1a naken / 1b REK / 1c avancerat delat). Svar på 4 frågor + Code-anteckningar. [Opus]-copy: delta-rad, noll-fall, historikformat.

## Last sync (tidigare)
- Eriks tre finns i _ds/assets/illustrations/ (intro.jpg, final.jpg, annandagen.jpg). Stil: flat vektor + kornig litografi, kall vinterpalett + en varm koppar/tegel-accent, bruksort m. bandyplan i mitten, silhuett aldrig ansikte. Kanon-yta = annandagens matta korn (ej intro-glansen).
- Lärdom (sommartest): KORTA promptar vann; långa drar mot glans/foto. Claude Desktop genererar EJ raster (bara SVG/line-art) → Nano Banana är generatorn; jag är art director (brief + konsistens).
- "Illustrationer - stilbibel och bestallningsbriefer.dc.html" — stil-lås + korta referensfästa promptar för 5 nya moments (derby/sommaren/uppflyttning/nedflyttning/ny hall). Arbetsflöde: jag brief → du Nano Banana m. Eriks bild fäst → jag granskar mot bibeln.

## Last sync (tidigare)
date: 2026-08-17T11:05:00Z
commit: b805a82 (GPT live-audit-rev; vår tree-läsning a0df4c1)

### Granska-crescendo post 6/7/10 (2026-08-17)
- "Granska-crescendo - post 6 7 10.dc.html" — post 6: KapitelPunkt-band (EFTER resultatblock, markerar ej ceremoniar), ETT mönster/tre innehåll (cupfinal/SM/avsked), slutspelsserie → Turneringsläge-kortet ej ny variant, avsked = innehåll ej gren. Svar på 4 frågor. Post 7 → eventvikter-uppdraget (inline-beslut + dubbel-padding-bugg i card-sharp-skalet). Post 10 dom: ratificera matchdocka som egen regel (regel 8 gäller allt annat), axel = blick-kvar-på-isen; rek flytta SubstitutionModal till dockan; kugghjul→Lucide oavsett.

### Komplett åtgärdslista (2026-08-17)
- "Atgardslista - hela auditen.dc.html" — GPT:s live-genomgång (@b805a82, 390px) sammanvägd med vår källaudit del 1–5 + Granska del 4. 21 poster, inget struket, bara ordnade (Block A läsbarhet → B en-primär → C datarader → D dramaturgi → E modaler/tomt → F skuld → G regressionssuite). Källtaggar: LIVE / BEKRÄFTAR / VÅR. Post 16 (test:visual startar ej) = blockerande infra före ytfixar.

### Sommaren-uppdraget (2026-08-17)
- Brief: M-03 i tvåsäsongsauditen (ej i repo — klistrades i chatten). Ny yta "Sommaren" mellan årsbok och första tävlingsmatch, säsong 2+. Copy låst av Opus.
- "Sommaren - sasongsovergangen.dc.html" — options-canvas, tre vikter (1a lätt / 1b mellan REK / 1c tung), samma låsta copy. Svar på briefens fyra frågor + Code-anteckningar. Återanvänder BoardObjectivesList (max 2). Leverans egentligen docs/incoming/ (kan ej skriva till repo → projektfil + nedladdning).
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
- "Implementationsaudit del 3 — Club, Granska, Anläggning.dc.html" — Club (hubb utan överblick, lyft Minne/Tränare; ⚠️-string-parse), GRANSKA-DUBBLETT (RoundSummaryScreen + granska/GranskaScreen gör samma jobb — fråga Jacob vilken är kanon, RoundSummary ser legacy ut med TODO:piktogram), Anläggning (välbyggd; vision civila projekt bortom arenan + per-nod builtSeason). History granskad ihop → delad SeasonSummary-atom bekräftad. Tema: emoji-i-copy återkommer (Inbox/Club/RoundSummary/History).
- "Implementationsaudit del 4 — Ceremoni- & scenflödet.dc.html" — FLÖDESgranskning av scenes/ (mest disciplinerade koden i appen). A: delat SceneHeader-skal används av Coffee men Valet/Board handrullar → konsolidera. B: tre ceremoni-nivåer (quiet/protocol/trophy) finns i koden men signaleras ej → gör till ceremonyTier-prop. C: onboarding fronttung (Intro 3,5s→Namn→Klubb→Ankomst→Tillträde) — bekräftar del 1; fix rör bara returvägen (hasCompletedOnboardingOnce). match/ + scoreboard fortsatt hållen (din/🚧).
- "Granska del 4 — matchtypsuppdrag.dc.html" + "DESIGN_UPPDRAG_GRANSKA_DEL4_2026-08-10.md" — DESIGNUPPDRAG (ej audit). Matchtypsmatris: Översikts 11 sektioner × liga/cup/slutspel/final/avsked, ✓håll/⚠grena/✕utelämna. Tes: Granska antar ligamatchen; diagonal av fel. Regel: ✕ = rendera inte (ej snyggare tomt tillstånd), precedens = 3 portal-påståenden borttagna. Nytt: fast-mode ger ingen matchtext → Översikt/generateQuickSummary lastbärande; produktionssajten ska verifieras mot (mitt hämtverktyg når den ej — flaggat ärligt, ej "sajten nere"). Koden @d94aac6 bär redan SLUTTEST RUNDA 4-fixar (väder alla lägen, neutral-arena, straff-flavor). 6 steg: granskaMatchType-param, sektionsregister visasFör(), trophy/tribute-grenar, fast-läges-prosa, serie/bracket-block, baseline per matchtyp.

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
