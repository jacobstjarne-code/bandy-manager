# ⛔ HISTORISK — status i `docs/BACKLOG.md`. BYGG INTE PÅ DENNA.

**Dödmarkerad 2026-06-21 (Opus, process-fil-genomgången).** Detta var RC-vägens körlista 2026-06-14 → 06-16. Allt i NU / NU 2 / GENOMSPELNINGS-GRINDEN / SEN är levererat (hashar står i raderna). Filen motsäger sig själv (NU 2-tabellen säger "C EJ GJORD", grinden nedan säger "G-C ✅ 743eca9") — den frystes vid RC-grinden och underhölls aldrig efter. B1-finansieringens KVAR-punkter migrerade till BACKLOG SESSIONSFYND (§5 + PreSeason-Valet KLARA 06-20, kalibrering öppen). VÅG 2 / RC-polish-fulllistorna lever i `RC_BEDOMNING_2026-06-14.md`.

**Den enda statusfilen är `docs/BACKLOG.md`** — den underhålls. Öppna inte denna för "vad körs härnäst"; den ljuger numera. Lämnad som historik (CHANGELOG i BACKLOG bär överlämningen).

---

# KÖRLISTA → CODE (RC-vägen)

**Datum:** 2026-06-14 · **Av:** Opus · **[HISTORISK — se banner ovan.]** Varje rad pekar på sin detaljorder. Kör uppifrån och ned. En commit per rad, titel matchar diff, rapportera hash.

---

## NU — KLART ✅ (grinden nådd 2026-06-14, basen spelbar)

| # | Vad | Hash |
|---|-----|------|
| 1 | Soft-lock övergiven match (verifierad i källan av Opus) | föreg. session |
| 2 | Math.random determinism-svep | föreg. session |
| 3 | Väderloop-wiring | a4ef907 |
| 4 | Birger-kanonisering | föreg. session |
| 5 | Grep-svep (inga mekaniska fixes behövdes) | — |
| 6 | Rotorsakade RC-buggar BUG-1/2/3/4/5/6 | fcb0c3b · 3609d02 · c5e752e · f542abe |
| 7 | GAP-4 laddningstillstånd | 6b8b97b |

---

## NU 2 — SYNLIGT-PÅ-SKÄRMEN (kör FÖRE Jacobs nästa genomspelning)

**Princip (Jacob 2026-06-14):** synliga fel drar blicken och förorenar känslo-genomspelningen — testaren rapporterar buggen, inte känslan. Allt som SYNS som ofärdigt ska bort innan nästa spelomgång. Detta är RC-polishens *visuella* delmängd, uppflyttad före den osynliga infrastrukturen (GAP-1/2, som bara behövs för EXTERNA testare).

Bygg-ordning: **delade primitiver FÖRST**, sen svep via dem (Designs mönster: route-för-route degraderar). Primitiv-arkitekturen = högre modell; svepen = Sonnet mot primitiven.

| # | Vad | Modell | Detaljorder | Status |
|---|-----|--------|-------------|--------|
| D | **Pensionsval → decision-card-mall** (två konkurrerande fetstilar) | Sonnet | `SYSTEMKARTA_DEL3` §3.5 | ✅ 8f26d83 |
| E | **Klubb-vy sektionskollaps** ("Visa allt →", INTE fler flikar) | Sonnet | `SYSTEMKARTA_DEL3` DEL F | ✅ b020e68 |
| F | **C2 notis-diet** — aggregera repetitiva typer (träning → 1 rad/omg), verifiera matchresultat ur inkorg, nollställ/arkivera vid säsongsskifte | Sonnet | `SYSTEMKARTA_DEL3` §3.2 C2 | ✅ f459b71 |
| A | **Delade primitiver** (positionLabel · tkr/mån-formatter · severity-dots · TabBar m. fade) + lagfoto-overflow (BUG-8) | Opus-tier (arkitektur) → Sonnet (call-sites) | `RC_BEDOMNING` DEL 2 prio 10 + `SYSTEMKARTA_DEL3` DEL F | ✅ cc0b833 · ce9a49d (Opus-tier omgjord; lagfoto klar i a54a584) |
| B | **HIDDEN_PATHS** — dölj BottomNav på alla ceremoni-/scen-ytor (CTA under bottennav, pill-CTA i onboarding) | Sonnet | `SYSTEMKARTA_DEL3` DEL F | ☐ EJ GJORD |
| C | **Globala visuella svep** — emoji→Lucide (B3), disabled-state B8 (oläslig beige), gold→copper, tomma kort (regel 12), scoreboard-redundans, taktik-pitch-kontrast | Sonnet (mot primitiven från A) | `SYSTEMKARTA_DEL3` DEL F | ☐ EJ GJORD |

**NU 2 ÄR INTE KLART.** D/E/F (de avgränsade Sonnet-jobben) är gröna; A/B/C (det tunga, A är arkitektur) återstår. Bygg-ordning bindande: **A → C → B** (C sveper mot primitiven A bygger; B är oberoende). Genomspelnings-grinden nedan ersätter "Efter NU 2".

## ⛔ GENOMSPELNINGS-GRINDEN (Jacob spelar INTE förrän dessa är gröna)

Målet med nästa genomspelning är KÄNSLA. Då måste både ytan vara ren OCH den svaga mekaniken vara på plats — annars spelar Jacob mot synligt grus och en död klack, och känslo-datan blir ofullständig på just de punkter vi vet är svaga.

| Grind | Vad | Status |
|-------|-----|--------|
| G-A | NU 2 rad A — delade primitiver | ✅ cc0b833 · ce9a49d (Opus-tier, 3 latenta buggar föll ut: rumorService posLabel, teamPhoto FW→A, goPro rå-lön) |
| G-K | Klack-matchreaktion (8a) | ✅ e560c97 (verifierad scripts/verify-klack-reaction.ts, säsong × 4 seeds) |
| G-C | NU 2 rad C — globala visuella svep | ✅ 743eca9 (radie) · 1ff9410 (gold→copper) · 0c83774 (emoji ⚡) · lint:design grep-rent ✓. disabled B8/tomma kort/scoreboard/pitch redan klara (827bc9d/fcb0c3b/b8cbabc, verifierat). Emoji-rest → Opus-lista (⏩, Granska-tabbar 👥📈🎓, ceremoni-heron 🏆/🥈) |
| G-B | NU 2 rad B — HIDDEN_PATHS | ✅ 4c31d75 (taktik/facility/game-over tillagda; scen-ytor täckta av sceneActive, match/slutspel av cd440ce) |

**EFTER grinden (ej blockerare för genomspelning):** B1-finansieringen (större bygge — Jacob spelar gärna en första känslo-runda UTAN den, medveten om det). GAP-1/2, C1, T1/T2 (extern-RC-infrastruktur).

**✅ G-A/C/B/K ALLA GRÖNA (2026-06-15). Ytan ren, klacken lever — genomspelning utan brus. Jacob spelar.**
**Emoji-domar (Opus 2026-06-14) — ✅ VERKSTÄLLDA `b9624b6` (emoji→Lucide) · `49c51ce` (DB-2 färg):** (1) ⏩ → `FastForward` ✓. (2) Granska-raden → Target/Users/LineChart/GraduationCap (hela raden) ✓. (3) Ceremoni-heron 🏆/🥈/🏅/🏋️ → Trophy/Medal/Award/Dumbbell (Champion/CupFinal/SmFinal/VictoryTrophy; trofé i guld, förlust-honnör i text-secondary, glow behållen) ✓. (4) SeasonSignature `hot_transfer_market` guld→koppar ✓. BEHÅLLNA: section-labels 🎯/📰 (B3 p.1). lint:design grep-rent ✓, 1117/1117. Ceremoni-visualerna = perception-tunga → glans-titt vid genomspelningen.

## SEN — osynlig infrastruktur (krävs för EXTERNA testare, ej för Jacobs egen runda)

| # | Vad | Modell | Detaljorder |
|---|-----|--------|-------------|
| 8 | ~~**GAP-1 kraschloop**~~ — ✅ `25deef2` (a) ErrorBoundary "Till huvudmenyn" + recovery-flagga rensar pending vid boot (b) auto-save pre-advance (c) RouteBoundary per vy, BottomNav lever | Opus-tier | `RC_BEDOMNING` GAP-1 |
| 9 | ~~**GAP-2 feedback-fångst**~~ — ✅ `266cb7c` (tappbar build-hash → modal: hash+save-id+route+säsong/omg+fritext → kopiera+mailto) | Opus-tier (arkitektur) → Sonnet (UI) | `RC_BEDOMNING` GAP-2 |
| 10 | ~~**C2 notis-diet**~~ — **uppflyttad till NU 2 rad F** (Opus-bedömning: inkorgsvolymen syns tidigt) | — | — |
| 11 | ~~**C1 endgame-kurering**~~ — ✅ `3ff48bc` (buildPortal: isPlayoff‖omg≥20 → secondary/minimal till match-allowlist, storySlot null; primary orörd. 3 tester). Säsong-2-start utanför scope (flaggad). | Opus specar → Sonnet bygger | `SYSTEMKARTA_DEL3` C1 |
| 12 | ~~**T1 determinism-test + T2 headless-harness**~~ — ✅ `d7e0fca` (T1: src/__tests__/determinism.test.ts, 5 tester, no-seed-replay-kontraktet. T2-harness fanns; lade checkNoNaN-invariant för spec-punkten "inga NaN i mätare/finances") | Opus-tier | `RC_BEDOMNING` DEL 3 |

**Notera:** C2 (notis-diet) och C1 (endgame-kurering) är SYNLIGA — om Jacob når slutspel/hög inkorgsvolym i nästa genomspelning bör de in i NU 2. De ligger i SEN bara för att de är byggen, inte svep. Opus-bedömning: ta C2 i NU 2 (inkorgsvolymen syns tidigt), C1 kan vänta (slutspel nås sent).

**✅ SEN-BLOCKET KLART (2026-06-16): 8 GAP-1 `25deef2` · 9 GAP-2 `266cb7c` · 11 C1 `3ff48bc` · 12 T1/T2 `d7e0fca`. T2-harness ren (stress 2×2, 0 violations). → Kritisk RC-väg är fri: intern genomspelning → extern testare. Inget Code-arbete blockerar nu.**

## REDO ATT BYGGA (Opus-spec klar — ej brådskande, RC-polish/våg 2-tier)
- **B1 Sprint 1 del 2** — anläggningsfinansiering. Spec: `SPEC_B1_FINANSIERING_V2_2026-06-15.md`.
  - ✅ **Steg 1–3 BYGGT `56a1c2af`** (2026-06-16): financing-fält (NodeFinancing) på alla noder + gym/strålkastare portade (§8); `getFinancingOptions` + `startFacilityBuildNode` som drar kostnad; FacilityScreen "Bygg ut"-välj-mode med finansierings-sheet + dynamisk konsekvensrad (löpande). 4 tester. Löser kartfynd 14.
  - ☐ **KVAR (i tur):** (a) ✅ **§6 textpooler KLART** (Opus 2026-06-17): `facilityFinancingStrings.ts` — tre röstpooler (KOMMUN_OFFER/KOMMUN_HOLD/MECENAT_OFFER) + `financingFlavor()` seedad via `seededPick`; wirad i FacilityScreen-sheet:en som italic förhandlingsrad under varje vals konsekvensrad. Pronomenneutrala mecenat-rader (gender kan vara female). Konsekvensraden i §6 var redan satt av §4 (`optionSub`) — ej dubblerad. **EJ build-verifierad här (Opus saknar repo i container) → Code/Jacob kör typecheck.** (b) **§5 utfasning** — ta bort gamla `getAvailableProjects`/`startFacilityProject`/`FacilityProject` + migration av gamla `facilityProjects`→`builtNodeIds`; Code. **SPÄRREN UPPLÖST (§6 klar) → §5 redo på Jacobs go.** (c) **PreSeason Valet-ingången** — andra ingången till samma träd i välj-läge (BACKLOG: "TVÅ ingångar, ETT träd"); `getPreSeasonChoices` finns men ingen scen wirar den; bara löpande FacilityScreen-välj-mode finns nu. (d) **Kalibrering** — financing-belopp/trösklar är spec-värden, ej balansverifierade mot ekonomimodellen (spec bad Code flagga). (e) **§4 partiellt** — dynamisk konsekvensrad finns i bygg-sheeten; nodernas `consequences`-array har kvar statisk "Kassa −X tkr" som visas i trädet.
- ~~**Klack-matchreaktion (8a)**~~ — ✅ BYGGD `e560c97` (klack-delta i communityProcessor, egen profil; verifierad 4 seeds — moodet rör sig med resultaten, ej parkerat på 60).

## RC-POLISH (efter grinden, parallellt — blockerar inte speltestet)
Delade primitiver (bygg primitiv FÖRE svep) · HIDDEN_PATHS · globala svep (emoji→Lucide, disabled, gold→copper, tomma kort) · pensionsval→decision-card · copy-pooler (Opus) · processors/ Lager 2-text (Opus dömer). Full lista: `RC_BEDOMNING` DEL 2.

## VÅG 2 (efter RC)
Avbrottsbudget · fanMood-reversion (8b, Opus specar mot speltestdata) · ekonomi-passivitet (kartfynd 14, motverkas av B1-anläggning) · GAP-5 tillväxt. Full lista: `RC_BEDOMNING` DEL 2.

— Opus, 2026-06-14
