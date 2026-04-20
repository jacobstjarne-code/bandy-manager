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

**Resolution (Sprint 22.6):** Rotorsak identifierad: `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35` satte `archetype: 'TwoWaySkater' as Player['archetype']` — PascalCase literal. Enum-värdet är `'twoWaySkater'` (camelCase). Fix: importerade `PlayerArchetype`, ersatte raw-sträng med `PlayerArchetype.TwoWaySkater`. console.warn borttagen. Defensiv guard kvar.
