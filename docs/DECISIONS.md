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

**Resolution (Sprint 22.6):** Rotorsak identifierad: `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35` satte `archetype: 'TwoWaySkater' as Player['archetype']` — PascalCase literal. Enum-värdet är `'twoWaySkater'` (camelCase). Fix: importerade `PlayerArchetype`, ersatte raw-sträng med `PlayerArchetype.TwoWaySkater`. console.warn borttagen. Defensiv guard kvar.
