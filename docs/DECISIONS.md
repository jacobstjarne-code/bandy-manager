# DECISIONS

Arkitekturbeslut, i kronologisk ordning. Läses vid sessionsstart tillsammans med LESSONS.md.

Format per post: 4-5 rader. Problem, Beslut, Alternativ övervägt, Konsekvens. Skrivs när beslutet tas, inte retroaktivt.

Syftet är inte formalism. Syftet är att om 6 månader ha ett svar på "varför gjorde vi så här?" som inte är "det bara blev så".

---

## 2026-04-20 — `.btn-cta` istället för fyra inline-CTA:er (Sprint 22.5)

**Problem:** Fyra skärmar (Dashboard, BoardMeeting, PreSeason, StartStep) hade fyra olika implementeringar av skärm-avslutande CTA. Padding 18/16/14, fontSize 15/15/14/14, fontWeight 600/800/700/700, letterSpacing 2/1/0.3/1px. DESIGN_SYSTEM.md §1 saknade stor CTA-klass.

**Beslut:** Ny `.btn-cta` i global.css (14/16 padding, 14/700/1.5 font, 12 radius, uppercase, fullbredd). Kombineras alltid med `.btn .btn-primary`. Alla fyra skärmar migrerade.

**Alternativ övervägt:** Tre storlekar med medveten hierarki (hero / pulse / standard). Avvisat — ingen tydlig regel för när vilken skulle användas. Enklare modell vinner.

**Konsekvens:** Inline-styling av CTA-padding/fontSize/fontWeight är nu regression. `.btn-copper` finns kvar i global.css som legacy-dublett till `.btn-primary`, migreras vid tillfälle.

---

## 2026-04-20 — BottomNav döljs på ceremoniella transition-skärmar (Sprint 22.5)

**Problem:** BoardMeeting, PreSeason, SeasonSummary m.fl. är övergångsskärmar utan egen funktion. BottomNav visades synligt men klick poppade bara "SLUTFÖR PÅGÅENDE FLÖDE"-banner. Falska valet skapade förvirring (bild 5-buggen i playtest).

**Beslut:** `HIDDEN_PATHS`-lista i BottomNav.tsx döljer nav helt på: board-meeting, pre-season, season-summary, playoff-intro, qf-summary, champion, game-over. Skärmarna slutförs via sin egen `.btn-cta`.

**Alternativ övervägt:** (a) Overlay istället för fullskärmsskärmar (avvisat — ceremoniell tyngd passar inte modal-form), (b) Behålla nav men gömma banner (avvisat — roten är att valet inte finns, inte att bannern är ful).

**Konsekvens:** Nya transition-skärmar ska läggas till HIDDEN_PATHS. Nya nav-skärmar kräver att de *har* navigerbar funktion — annars hör de hemma som transitions.

---

## 2026-04-20 — Testrytm + refactor-disciplin + arkitekturloggbok i CLAUDE.md

**Problem:** Sprint 17-21 levererade med luckor. Sprint 22.3 expanderade scope självständigt. `.btn-copper` duplicerade `.btn-primary` oupptaget. Ingen löpande rytm för att fånga designdrift, scope-creep eller dubletter.

**Beslut:** Ny § "LÖPANDE KVALITET" i CLAUDE.md med fyra underdiscipliner: testrytm (vid commit/sprint-slut/release), refactor-disciplin (pausa vid scope > spec+2), arkitekturloggbok (denna fil), kod-granskning för nya services/entities/CSS-primitiver.

**Alternativ övervägt:** Formell ADR-process med "Context/Options/Decision/Consequences"-mall. Avvisat — enterprise-overhead för en-persons-projekt. Lightweight 4-rad-format vinner.

**Konsekvens:** Code och Opus ska köra testrytmen enligt schema. Alla framtida arkitekturbeslut loggas här i samma format. Scope-expansion över 2 filer kräver chat-bekräftelse från Jacob.

---

## 2026-04-20 — Stress-test baseline hittade BUG-STRESS-01 på första körningen (Sprint 22.6)

**Problem:** 10/10 seeds kraschade i `playerDevelopmentService.getArchetypeMultiplier` när `ARCHETYPE_MULTIPLIERS[archetype]` var undefined. Code's första hypotes var att `p.attributes` var undefined, Opus granskade stacktrace och fann att felet faktiskt var på `archetype`-nivån.

**Beslut:** Två-stegs-fix. Steg 1: guard i `getArchetypeMultiplier` som fall-back på default-multiplier om archetype saknas i mappen, med console.warn. Syfte: avblockera stress-testet så nästa bugg kan hittas. Steg 2: spåra rotorsaken via warn-output till den service som sätter ogiltig archetype.

**Alternativ övervägt:** Direkt rotorsaks-fix utan guard. Avvisat — stress-test-infrastrukturen blockeras då tills rotorsaken hittas, vilket kan ta flera omgångar. Defensive-guard är billigt och låter infrastrukturen fortsätta leverera värde under utredning.

**Konsekvens:** Alla nya fel med mönstret "TypeError: Cannot read properties of undefined (reading 'X')" där X är en property på en map-lookup ska granskas mot enum-key vs map-key-diskrepans först. Lärdom loggas i LESSONS.md.

**Meta:** Första skarpa fyndet från stress-test-infrastrukturen. Baseline-körningen levererade exakt det värde den byggdes för — en bugg som aldrig upptäckts i playtest eftersom ingen spelat 2+ säsonger igenom.

---

## 2026-04-20 — Managed club safety-net replenishment (Sprint 22.7)

**Problem:** BUG-STRESS-02: Stress-test avslöjade att managed club i auto-play scenario (ingen människa rekryterar) förlorar 5-9 spelare per säsong genom retirement + contract expiry, men aldrig får kompensation — replenishment-loopen skippar explicit managed club. Squad < 14 i säsong 2-3. Samma mekanism kan drabba passiva spelare i normalt spel.

**Beslut:** Vid squad < 14 spelare, fyll på akut till 14 med samma replenishment-logik som AI-klubbar, men lägre cap. AI-klubbar behåller cap på 20. Narrativ tolkning: "sportchefen signar några akutspelare" när tränaren varit passiv. Spelaren ska fortfarande känna press att rekrytera upp till full trupp (20) själv.

**Alternativ övervägt:** (a) Stress-test injicerar fake transfers — avvisat, maskerar riktig speldesign-brist. (b) Acceptera degradering — avvisat, kan inte ha < 14 spelare i bandy (11 startar + 3 reserver minimum). (c) Auto-förlänga kontrakt — avvisat, bryter intention att spelaren aktivt hanterar kontrakt. (d) Replenish upp till 20 som AI — avvisat, tar bort motivation för spelaren att rekrytera själv.

**Konsekvens:** Mekanismen är också en säkerhetslina för mycket passiva mänskliga spelare. Bör ses som safety net, inte en strategi — därför lågt tak (14). Framtida arbete: UI-notifikation när mekanismen triggas ("Sportchefen kontrakterade X spelare akut — trupp var farligt tunn"), och säkerställ att akut-signade spelare är lågpotential (inga stjärnor på rea).

---

## 2026-04-20 — Position-aware replenishment (Sprint 22.7)

**Problem:** BUG-STRESS-02 (sekundär): `replenishPositions[i % 8]`-cykeln `[GK, DEF, DEF, DEF, MID, MID, FWD, FWD]` gav fel fördelning när klubb behöver färre än 8 spelare. Ett lag som behöver 5 fick positionerna 0-4 = GK/DEF/DEF/DEF/MID — noll forwards. AI-klubbar kraschade pga positioncoverage-invariant.

**Beslut:** Ersätt cyklisk arrayselection med position-aware logik. Räkna aktuell composition per position, definiera minimum (GK=2, DEF=5, MID=4, FWD=4 = 15 totalt), fyll positioner under minimum först, sen prioritera minst fyllda.

**Alternativ övervägt:** (a) Bara omordna arrayen så positioner sprids ut — avvisat, kvar samma bias när mindre antal fylls. (b) Slumpad selection — avvisat, ger ingen garanti för minimum-täckning. (c) Hårdkodad formel typ "2 GK, rest fördelas" — avvisat, mindre flexibel än räkna-befintligt-approach.

**Konsekvens:** Alla replenishment-anrop garanterar nu positiontäckning. Position-minimums kan senare justeras per taktikstil (t.ex. offensiva lag vill ha FWD=5). Funktionen `pickPositionToFill(players)` blir återanvändbar för framtida features (AI-transfer-prioritering, scouting-rekommendationer).

**Resolution (Sprint 22.8):** Sprint 22.7-fixen exit:ade om `squadSize >= target`, vilket missade klubbar över target med position-obalans via AI-transfers. Fix: dubbel trigger `needsMore || needsRebalance`. `needed = max(size-shortfall, position-shortfall)`. `positionCoverage: 0 violations` i 10×10.

---

## 2026-04-20 — Graderad konkurs-mekanik för managed club (Sprint 22.9)

**Problem:** BUG-STRESS-05: Finances kan gå under -1 MSEK utan att någon mekanism triggar. Spelet fortsätter som om allt är normalt. I riktigt bandy-Sverige skulle klubben för länge sen ha försatts i konkurs av tingsrätten och tränaren sparkad.

**Beslut:** Tre trösklar för managed club:
- **< -500 000 kr:** varning via inbox (en gång per säsong, inte per omgång). "Klubben närmar sig farlig nivå."
- **< -1 000 000 kr:** tvingad licens-denial via existerande mekanism (3 spelare lämnar, 60% sponsorer bort, rykt-sank). Fortsätter spela.
- **< -2 000 000 kr:** game over. `managerFired = true`, `pendingScreen = GameOver`. Spelet är slut.

AI-klubbar: ingen mekanism. Kan ha negativ ekonomi utan konsekvens. Game-design > realism här — AI-konkurser skulle komplicera tabell, schedule, transfers utan nämnvärd spelvärde.

**Alternativ övervägt:** (a) Binärt game-over vid -1 MSEK — avvisat, ingen varningssignal till spelaren före dödsstöt. (b) Mjuk game-over med "sparkad men få chans igen nästa säsong" — avvisat, bryter nästa säsong-kontinuitet. (c) AI-klubbar konkursar också — avvisat, kräver relegation-mekanik som inte finns.

**Konsekvens:** Managed club har nu hard floor på -2 MSEK. Stress-test kan inte längre driftas obegränsat i negativ ekonomi — kommer triggar game-over och säsongen avslutas. Invariant `finance` i stress-test bör ändras: acceptera managed-finances ned till -2 MSEK som giltig, inte som bugg.

---

## 2026-04-20 — Cup-matcher cancelleras aldrig pga väder (Sprint 22.10)

**Problem:** BUG-STRESS-04: Väder-avbokning satte `status="postponed"` på cup-matcher. Ligamatcher klarar postponed (poeng väntar, matchen spelas senare), men cup-knockoutmatcher kräver `winnerId` för att bracket ska fortsätta. En postponed cup-match orphanar bracketen permanent: matchen spelas aldrig om, winnerId förblir null, bracket markeras aldrig completed. Diagnos via stress-test failure-dump bug04-seed5-s10.

**Beslut:** Cup-matcher cancelleras aldrig pga väder. Explicit `&& !fixture.isCup` i väder-cancel-villkoret i matchSimProcessor.ts. Väder påverkar fortfarande commentary, chanser, attendance — bara inte cancellation.

**Alternativ övervägt:** (a) Omschemalägga postponed cup-match till nästa lediga matchday — avvisat, kräver schedule-refactor, scope för stor. (b) Postponed cup = forfeit för ett av lagen — avvisat, känns oschyst mekaniskt. (c) Ta bort väder-cancel helt — avvisat, ligamatcher drar nytta av väder-dramatiken.

**Konsekvens:** Cup-matcher spelas alltid oavsett väder. Narrativt tolkat som "arrangören sätter tak / flyttar till alternativ arena / skrapar isen extra". Om vi i framtiden vill implementera realistisk omschemaläggning är det en egen sprint. Mer generellt: varje ny feature som inför state-transitions på fixtures måste fråga "hur hanteras detta i cup-knockout?" (se LESSONS.md #12).

**Meta:** Sista stress-test-buggen. Efter Sprint 22.10 har dagens infrastruktur-arbete levererat: design-audit + stress-test + tre fixar (22.5, 22.6, 22.7) + fyra bugfixes (BUG-STRESS-01 till -05, minus -02 som var två buggar) — från "kraschar i säsong 2" till "100/100 säsonger på 10×10" på en dag.

**Resolution (Sprint 22.9):** Implementerat. `evaluateFinanceStatus(finances)` i `economyService.ts` — tre trösklar, ingen once-per-season-logik (hanteras av call site). `financeWarningGivenThisSeason` i SaveGame reset varje säsongsstart. Invariant uppdaterad: −2M utan managerFired = crash; −2M med managerFired = warn. Stress-test: `finance: 0 crashes` i 10×10. 99/100 säsonger avklarade.

**Resolution (Sprint 22.6):** Rotorsak identifierad: `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35` satte `archetype: 'TwoWaySkater' as Player['archetype']` — PascalCase literal. Enum-värdet är `'twoWaySkater'` (camelCase). Fix: importerade `PlayerArchetype`, ersatte raw-sträng med `PlayerArchetype.TwoWaySkater`. console.warn borttagen. Defensiv guard kvar.

---

## 2026-04-20 — Kalibreringsinfrastruktur: stress-test loggar matchstats, analyze-stress jämför mot bandygrytan (Sprint 24)

**Problem:** Playtest gav 13-14 mål/match. Target enligt bandygrytan 9.12. Ingen mätinfrastruktur för att isolera var felet låg — calibrate.ts mätte neutral lab-motor (10.3, inom tolerans), stress-testet mätte bara invariants/krascher, ingen loggning av säsongs-aggregat från live-motorn med alla modifiers aktiva.

**Beslut:** Utvidga stress-test med `stats.ts` som loggar `season_stats.json` per match (goals[], suspensions[], cornersHome, etc). Ny `analyze-stress.ts` jämför mot `bandygrytan_detailed.json.calibrationTargets.herr`. Etablerar pipeline: `npm run stress && npm run analyze-stress` → ger klara siffror, inte magänsla, för alla efterföljande motor-sprintar.

**Alternativ övervagt:** (a) Fixa calibrate.ts istället — avvisat, den kör isolerat utan modifier-stacking. (b) Mäta direkt i browser via devtool — avvisat, kan inte köra 7000+ matcher per session. (c) Bara öka playtest-mängden — avvisat, statistisk brus på 10 matcher = ±1 mål standardavvikelse.

**Konsekvens:** Varje motor-sprint har nu ett numeriskt target, inte ett spelkänslo-target. Sprint 25a-d specades med specifika förväntade utslag per ändring. Första mätrapporten (SPRINT_24_FIRST_MEASUREMENT.md) blev referenspunkt som alla efterföljande mättes mot. Infrastruktur är additiv — invariants-checkningen rörs inte.

---

## 2026-04-20 — Sprint 25 splittras i delsprintar per rotorsak (Sprint 25a-d-serien)

**Problem:** Sprint 24-mätningen avslöjade fem gap mot bandygrytan. Att ändra flera saker samtidigt gör det omöjligt att veta vilken ändring som gjorde vad. Dessutom första hypotes: gap 1+2 hänger ihop, gap 3+5 hänger ihop, gap 4 kan lösa sig själv.

**Beslut:** Splittra Sprint 25 i fyra delsprintar, en rotorsak per sprint:
- **25a:** Comeback-dynamik (gap 1+2, parameterjustering i matchCore)
- **25b.1:** Straff till egen trigger (del av gap 5, strukturell separation)
- **25b.2:** Utvisnings-basfrekvens (gap 3, höja wFoul+foulThreshold-multiplikator)
- **25d:** Fas-konstanter (verifiera PHASE_CONSTANTS mot slutspelsdata)

Mellan varje delsprint: mät via analyze-stress, läs rapporten, avgör om nästa sprint behöver justeras.

**Alternativ övervagt:** (a) En enda Sprint 25 med alla fem gap — avvisat, kan inte mäta enskild effekt. (b) Bara Sprint 25a, skippa straff+utvisning — avvisat, htLeadWinPct-gapet är för stort för att bara comeback-justering ska lösa det. (c) Sprint 25 som Big Bang-refaktor av hela matchmotorn — avvisat, för stor risk.

**Konsekvens:** Etablerar kulturen "en rotorsak per sprint, mät mellan". Varje sprint har tydliga förväntade mätutslag i speccen. Om utslaget avviker från förväntan → pausa, analysera, justera. Sprint 25a upptäckte managed-grinden (LESSONS #15) genom att mätutslaget var <1/3 av förväntat — det hade försvunnit i ett Big Bang.

---

## 2026-04-21 — Straff som separat fenomen från utvisningar (Sprint 25b.1)

**Problem:** Motorn triggar straff som bi-produkt av `seqType === 'foul'`: 70% av fouls är i attack-zon, 60% av dem blir straff → 42% av alla foul-sekvenser blir straff. Bandygrytan säger straff utgör ~5.4% av mål och utvisningar är ~3.77/match — straff är ungefär 13% av utvisnings-liknande incidenter, inte 42%. Dessutom: om vi höjer foul-frekvensen 9x för att nå utvisnings-target (Sprint 25b.2) höjs straff också 9x, vilket överskjuter.

**Beslut:** Separera straff till egen trigger i `seqType === 'attack'`-sekvensen. Straff-sannolikhet bygger på chanceQuality (nära-målchanser), inte på discipline. Period- och spellägesmodifierare från SCORELINE_REFERENCE.md (ledning +12%, peak 75-89 min 1.35x). Fouls i foul-sekvensen blir nu 100% utvisningar, inte 30%.

**Alternativ övervagt:** (a) Behålla straff i foul-sekvens men sänka sannolikheten — avvisat, kopplingen mellan straff- och utvisnings-frekvens blir kvar, inte skötselmässigt separerbara. (b) Trigga straff i corner-sekvens också — avvisat tills data visar att det behövs. (c) Separera först efter 25b.2 är klar — avvisat, kopplingen stör 25b.2-kalibreringen.

**Konsekvens:** Straff och utvisningar kan nu kalibreras oberoende. `isPenaltyGoal`-flagga på Goal-event för korrekt tracking. Sido-effekt: utvisningar 3x (från att alla foul-sekvens-fouls blir utvisningar) — det förväntas lyfta `avgSuspensionsPerMatch` 0.47 → ~1.4, förberäknat i speccen. Återstående gap till 3.77 hanteras i 25b.2.

---

## 2026-04-21 — Mini-edits direkt av Opus istället för Code-sprint (25b.2.2 + 25d.2)

**Problem:** Sprint 25d-mätningen avslöjade två konstanta-nivå-problem: `avgSuspensionsPerMatch` 3.23 (0.07 under spec 3.3), KVF `homeWin%` 50.8% (gap 9.5pp). Båda lösbara med enkla konstant-ändringar. Att skriva hela Code-sprintar för två rader kod är dyrt i credits.

**Beslut:** Opus gjorde båda ändringarna direkt via workspace:edit_file. Två rader i två filer. Sedan får Code bara köra stress-mätning för att verifiera.

**Alternativ övervagt:** Två separata Code-sprintar. Avvisat — spec+implementation+audit-cycle för en-rads-ändringar är pattern-tvingande overhead.

**Konsekvens:** Etablerar mönstret: enkla konstant-ändringar under 5 rader görs direkt av Opus, mätning sker i nästa Code-körning tillsammans med annat arbete. Sparar credits. Viktigt: Opus loggar ändringar i KVAR.md och DECISIONS.md (som nu) så spårbarhet bibehålls.

---

## 2026-04-22 — Centraliserad save-logik via store actions (Cursor-refaktor)

**Problem:** `saveSaveGame()` anropades direkt i komponenter (`TransfersScreen`, `GameHeader`) med rå `.catch(console.warn)` — ingen felhantering synlig för användaren, business logic (renewContract, signFreeAgent, listPlayerForSale) inlinead i skärm-filen, `useGameStore.setState` anropades direkt från komponenter och kringgick actions-lagret.

**Beslut:** (1) `persistGameSnapshot()` i `gameStore.ts` — enda platsen för explicit save, returnerar `{ success, error }`. (2) `persistAutosave(game, context)` i `gameFlowActions.ts` för advance-flödet. (3) Ny publik `saveGame()` action. (4) `renewContract` / `signFreeAgent` / `listPlayerForSale` flyttade från inline-kod i `TransfersScreen` till `transferActions.ts`. (5) `markCoachMarksSeen` och `updateMatchMode` async med `SaveActionResult`.

**Alternativ övervägt:** Behålla komponent-nivå save men lägga till error-toast — avvisat, löser inte att business logic sitter i fel lager.

**Konsekvens:** Inga fler direkta `saveSaveGame`-importer i presentation-lagret. Toast i `GameHeader` visar nu fel-state (röd) om save misslyckas. `useGameStore.setState` direkt från screens reducerat till tre läs-only `getState()`-anrop i sim-loopar (legitimt mönster).

---

## 2026-04-22 — getState() i sim-loopar är legitimt, setState i screens är inte det

**Problem:** Code review flaggade inkonsekvent state-mutation. Distinktionen var oklar.

**Beslut:** `useGameStore.getState()` i event-handlers och sim-loopar är korrekt Zustand-mönster för att undvika stale closures — inte regression. `useGameStore.setState()` direkt från screen-komponenter är inte okej — kringgår actions och deras invarianter. Kvarvarande `getState()`-läsningar i `DashboardScreen` (sim-loop) är avsiktliga och ska lämnas.

**Konsekvens:** Regel: mutera aldrig state direkt från screens. Läs via `getState()` i callbacks är OK.
