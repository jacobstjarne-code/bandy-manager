# BANDY MANAGER — BACKLOG

**Etablerad:** 2026-05-17
**Senast rensad:** 2026-05-25
**Syfte:** ENDA SANNING för "specat men ej byggt" + "idéer som ska bli spec". Uppdateras VARJE gång vi parkerar något — inte "vid tillfälle".

**Förhållande till andra dokument:**
- `KVAR.md` = historisk logg av leveranser (vad har hänt, kronologiskt)
- `BACKLOG.md` (denna fil) = ENDA SANNING för vad som väntar
- `SPEC_*.md` = enskilda speccer (länkas härifrån)
- `INLASTA_SYSTEM.md` = verifierings-status för 10 system (checklista, inte backlog)

---

## PROCESS-REGLER (etablerade 2026-05-17)

1. **När vi parkerar en idé eller spec — Opus skriver in den i `BACKLOG.md` SAMMA session**, inte "vid tillfälle"
2. **Vid sessionsstart läses `BACKLOG.md`** efter `CLAUDE.md/KVAR.md/LESSONS.md/DECISIONS.md` för att se vad som väntar
3. **Innan stor sprint startas, scannas `BACKLOG.md`** för relaterade idéer som kan packas samman
4. **När något byggts** raderas raden från BACKLOG. CHANGELOG dokumenterar historiken — duplikeras inte i tabellerna.
5. **Inget hamnar bara i chatten.** Om Opus säger "framtid" eller "senare" måste det skrivas hit. Annars är det förlorat.
6. **Regelbunden rensning.** Tabeller som växer av tröghet blir oanvändbara. Klara rader raderas vid commit. Idéer som inte längre är aktuella droppas aktivt vid genomgång — inte behållas av artighet.

---

## A. AKTIVA SPRINTAR (Code arbetar eller väntar Code-start)

### FÖRSONINGSSPRINTEN — AKTIV (Design-rundan landade 2026-06-11)

Arbetsorder: `docs/RELA-FORSONINGSSPRINT-2026-06-11.md` (Fable). Domen (`docs/DESIGNSLUTSATSER-STEG3-2026-06-11.md`): designen är *bevisat rätt* — städsprint, inte omdesign. Konsoliderad audit: `docs/DESIGNOMGANGEN-KOMPLETT-2026-06-11.md` (16 kap). Systempatch ratificerad av Jacob 2026-06-11.

- **§1 sync** — 6 systempatch-filer in i `design-system/` (DESIGN-DECISIONS, colors_and_type.css, README m. hårda regler 11–15, 3 kanon-kort). Före all kod. Code committar.
- **§2 A1 wiring-redovisning — STÄNGD (Code 2026-06-12).** Ingen commit påstod sig wira Förbered: `4c2cf10` definierade faserna, `1b1577e` wirade ENDAST spela (MatchLive), `dc64486` hade LedgerFrame i TITELN men noll LedgerFrame-filer i diffen (etikettmiss). Auditen `316658a` var korrekt: Förbered/Granska medvetet parkerade. **Lärdom → LESSONS:** felmoden är felrubricerade commits, inte falska klar-rapporter — commit-titel ska matcha diff, annars uppstår falska minnen åt båda håll. Nuläge: `phase="forbered"` definierad men orenderd; Förbered-wiring sker mot mocken (`design_forbered_trupp_slots.html`) i Opus-i-Code-passet.
- **§3 fix-ordning** 🟥→🟧→🟨 — **= D3 inline-stratum-migreringen** (pill-CTA→.btn-cta, positionLabel, emoji-svep, tomma kort, delade primitiver, LED vi/dom) med ratificerade regler. Mest standard-Code.
- **§4 Opus-lott — KLAR 2026-06-11:** notisdiet + `expiresRound` + kondition-0 → `CODE_UPPDRAG_NOTISDIET_EXPIRES_2026-06-11.md` · story-slot-rotation verifierad (FELATTRIBUTION: rotationen aktiv; repetitionen var coffee_room_card-secondaryts konstanta preview + scene-autotrigg, den senare fixad `97fa59d`; fix-relä för preview + stale-guard skickat) · copy-pooler ('trött' ×5 personligheter, årsbokens 7 moment-typer, notisdiet-konsekvenser) + frivillig-moral BESLUT B (moral följer puls, ingen knapp) → `CODE_UPPDRAG_FORSONING_OPUS_TEXT_2026-06-11.md`.
- **§5 verifiering** — Jacob fotar om, Design re-auditar (grön/kvarstår), 5 nya hårda regler in i `_adherence`-lint.

**Modellallokering (Fable, bekräftad):** standard-Code ~70% (svepen är entydiga efter systempatchen), Opus 3 punkter (A1/dubbelkrom-arkeologi · LedgerFrame-children-wiring · decision-card-konsolidering), INTE Fable-i-Code (designomdömet är redan utövat). Riktiga spaken: commit-hash + skärmdump per fix — felmoden var processdisciplin (A1), inte modellstyrka.

**Fem designförbättringar (DESIGNSLUTSATSER §II — post-försoning, Fables ordning §IV):** (1) typografiska scenen = tredje ceremoninivån (2) Tal & enheter (3) severity-skalan (4) illustrations-katalogen låst ~10 + STÄNGD (5) konsekvensraden = förståelsedjupet, **överlappar B1:s D1**. #2+#3 är billiga/skrivbara härnäst. **Rör INTE (§III):** fler kortvarianter, mörkt läge, mer animation, rösten.

**B1** följer EFTER försoningen (som settlar designen B1:s UI ska stå på). Datamodellen (B-tabellen) är klar att köra i valfri Code-glugg — ingen design-grind.


**Samlat Code-uppdrag:** `docs/CODE_SAMLAT_2026-05-21.md` — allt byggbart nu, buntat efter backlog-rensning 2026-05-21. Princip: ingen byggtids-begränsning, så allt som är tillräckligt specat byggs nu — bara det som genuint väntar på Design eller Opus-text parkeras.

| # | Paket | Spec | Status |
|---|---|---|---|
| P2 | **B4 transfers design-system-cleanup** | `design-system/AUDIT-TRANSFERS-2026-05-17.md` | **LEVERERAD** `113f0af` (1001 gröna). |
| P3 | **B4 feature-rester** (C-O2 inkommande-bud + C-T10 lås-ikon) | chatten + ClubLegend-typ | **LEVERERAD** `9bb18ac` + Opus-text `c55b9bf`. |
| P5 | **A1.5++ Rotorsak tomma commentary-events** | — | **LEVERERAD** `e77cf6e`. Rot: Substitution i hasMeaningfulEvent-filtret → tom rad. Guard på main-div, sub-steps renderar bara 🔄-raden. |

*(Alla CODE_SAMLAT-paket P1–P5 levererade.)*

### SESSIONSFYND 2026-06-16 — kvar/att verifiera (gap-audit)

Efter NU2/grind/SEN-blocket/B1-bygget — det som sagts men inte är helt slutfört, så det inte tappas:

| Vad | Status | Nästa |
|-----|--------|-------|
| **B1 §6 textpooler** | Datamodell byggd (`56a1c2af`); copy ej skriven | **Opus NÄST** — kommun/mecenat-förhandling + konsekvensrader, platshållare `{politician.name}`/`{mecenat.namn}` |
| **B1 §5 utfasning + migration** | Gamla `getAvailableProjects`/`FacilityProject` lever parallellt (spärr håller) | Code EFTER §6 — ta bort gamla vägen + mappa gamla saves `facilityProjects`→`builtNodeIds` |
| **B1 PreSeason Valet-ingång** | Ej wirad (`getPreSeasonChoices` finns, ingen scen) | "TVÅ ingångar, ETT träd" (B1-raden) — andra ingången saknas; bara löpande FacilityScreen-välj-mode finns |
| **B1 financing-kalibrering** | Spec-värden använda, ej balanstestade | Verifiera trösklar/andelar mot ekonomimodellen (spec bad Code flagga) |
| **Nödtrupp soft-lock** (`62394aa4`) | Byggt, mekaniken spårad + portar gröna | **Playtest-verifiering:** dev-skada 3 → nödtrupp-kort → kalla upp → spelbar; + walkover-dead-end |
| **Ceremoni-heron emoji→Lucide** (`b9624b6`) | Byggt | Perception-tung — glans-titt vid genomspelning (kunde ej headless-screenshotas) |
| **C1 säsong-2-start** | Endgame-kurering byggd för slutspel + omg≥20; säsong-2-start medvetet UTANFÖR | Beslut: inkludera säsong-2-start i kurering eller ej (otydlig detektion, risk att gömma relevanta säsongsstart-kort) |

**Kodaudit-fynd 2026-06-16 (B1 gjorde två förbefintliga luckor LEVANDE — ej regressioner från financing-commiten):**
| Vad | Rot | Fix |
|-----|-----|-----|
| **Facility capacityBonus appliceras aldrig** | `communityProcessor` beräknar+returnerar `facilityCapacityBonus` (advanceFacilityState), men `roundProcessor:1157`-destrukturen utelämnar det → en byggd värmestugas "+1000 platser" når aldrig `club.arenaCapacity`. Förbefintligt (capacity-returen + advanceFacilityState fanns innan), men mina noder är nu byggbara → luckan är live. | Applicera `facilityCapacityBonus` på `club.arenaCapacity` i roundProcessor. KRÄVER kapacitetsmodell-beslut: frys arenaCapacity (= derived+bonus, slutar växa med reputation) eller separat additiv-lager. Inte säker drive-by — hör till facility-completion-wiringen / §5. |
| **Migration orphanar pågående legacy-bygge** | `saveGameMigration` sätter `facilityState={builtNodeIds:[]}` ovillkorligt; `communityProcessor:231` kör legacy `checkProjectCompletion` bara `if (!game.facilityState)`. Ett save mitt i ett legacy-bygge → facilityState finns → legacy-completion hoppas → bygget stallar, spelaren betalade. | I §5-migrationen: seeda bara facilityState när inget legacy-projekt är `in_progress`, eller migrera in-progress → `facilityState.activeProject`. |

---

## B. SPECCAT KLART, VÄNTAR BYGGE

| # | Vad | Spec | Beroenden |
|---|---|---|---|
| B1 | **Klubbutvecklingspaketet (Riktning 1)** — facility-träd, säsongsplanering, löneeskalering, kontextuella sponsorer, halvårsrapport, halldebatt som flersäsongsprocess. **Inkluderar i scope:** C-T3 (akademi-flik), C-T4 (First Cap-event), C-T5 (externa akademier scoutbara), C-T6 (akademi-skolsamarbete). | `docs/SPEC_KLUBBUTVECKLING.md` | **Strävan LÅST 2026-06-10** (gällande dok: `B1-SPRINTORDNING-KLUBBUTVECKLING-2026-06-10.md`): beständighet av det riktiga utomhusspelet — full läktare, akademi, klubben består som sig själv; hallen = laddad gaffel, INTE mål; konstis = baseline; träningshall = accepterat steg. **Beroende-uppdelat (INTE ”efter playtest”):** (0) SPEC-kirurgi §2/§4 = Opus, KLAR via revisionsnot 2026-06-10. (1) facility-trädets domänmodell = INGET beroende, redo för Code (relay finns i B1-doken). (2) PreSeason-beslutets UI + resten = bygg i tur efter (1), INGEN extern grind. Erik+Jacob har redan spelat igenom — den externa playtest-signalen finns att mina, inte en framtida grind. Design-mockups för nya planeringsytan = hjälp, inte grind. **Design-brief skriven:** `design-system/briefs/DESIGN-BRIEF-B1-KLUBBUTVECKLING-YTOR-2026-06-11.md` (utbyggnadsträd · PreSeason-valet · matchhall-gaffeln + konsekvensraden #5). Trigger: Design mockar när försoningen satt systemet; specen ligger klar. **PLACERING (Opus-svar till Fable 2026-06-11):** trädet BOR i Orten — ersätter den komprimerade Anläggning-raden (chevron-expand per recuten) och öppnas som egen yta därifrån, INGEN ny flik; OrtenMap-nodens deep-link pekar dit. TVÅ ingångar, ETT träd: PreSeason-valet = samma träd i VÄLJ-läge (där beslutet sker), Orten = BETRAKTA-läge (progress, max ett aktivt bygge, dependencies). Matchhall-noden öppnar gaffel-processen, aldrig direktköp. (3) sprint 2–5 = i tur efter (1). |

*(B2 + B4 verifierade mot kod 2026-05-21 → flyttade till A som P1-P3. B2 ej byggd; B4 design-del ej gjord sedan auditen.)*

---

## C. IDÉER UTAN SPEC — KRÄVS SPECCING INNAN BYGGE

### Analysskript-måttstockar (diagnos klar 2026-05-22 — motorn är ren)

Motordiagnosen (`docs/MOTORDIAGNOS_RESULTAT_2026-05-22.md`) avgjorde: alla tre flaggor i `season_analysis.md` var RAPPORTARTEFAKTER, inte motorfel. Motorn ligger <1% från bandygrytans 1124-matchers-targets på alla tre. Det som ska åtgärdas är skriptets måttstockar.

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-M2 | **Sidofynd från diagnosen att följa vid nästa kalibreringsrunda (ej akut, alla inom acceptabelt).** Tre gap mot bandygrytan-targets som rapporten INTE flaggade: (1) hörnor/match 16,8 vs target 17,72 (−5,2%) — underproduktion i hörnfrekvens, inte i konvertering. (2) Andel mål i HT2 52,4% vs target 54,2% (−1,8 pp) — motorn underskattar andrahalvleksdominans. (3) Målkapet `MATCH_TOTAL_GOAL_CAP = 17` ger en icke-organisk spike: 3,7% av matcher slutar på exakt 17, noll över (känt designval `finding:049`, ej fel). Bevaka, åtgärda inte reflexmässigt. | matchCore (hörnfrekvens, HT-split, cap) | Litet per styck. Nästa kalibreringsrunda. |

*(C-M1 levererad i commit `707f754`: `season_analysis.md` fått varningsheader, `MatchEventType.RedCard` → `Suspension` i 46 filer (string-värde `'redCard'` bevarat, save-kompatibelt), arcService-råsträng fixad. 1001 gröna.)*

### Säsongsdramaturgi (playtest 2026-05-22 — `docs/PLAYTEST_2026-05-22.md`)

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-SD1 | **Säsongsslutets koreografi — scener i fel ordning/dubblerade.** | scen-triggers / SeasonPhase-flöde | **FULLSTÄNDIGT VERIFIERAT 2026-05-25:** trigger rad 288 anslagService.ts korrekt, `regular_done` i LeagueAnslagKey, `getCurrentLeagueRound` filtrerar `!isCup`, `seenAnslag: AnslagKey[]`. Display: PortalScreen.tsx:235 via `computeNextAnslag`. Sommarscenariot byggdes aldrig — ingen dödkod att ta bort. Framtida sommar-fas = ny feature om vi vill, inte skuld. **KLAR — ingen kodändring behövdes.** |
| C-SD2 | ~~Portal-eskalering grundserie → upptakt → kvart → semi → final~~ | **LEVERERAD** `a76b5e7` (warm-mellansteget: upptakt-portal + RoundMark/CTA warm kvart/semi) + `7cb5ebc` (4:e axeln: primary-weight-2-warm semi+upptakt) + `536a9dd`. portalEscalationResolver (sakrat/farozon/mittfalt/bottenstrid), upptaktCopy, PortalUpptakt, clubStandingService. 11 resolver-tester. Final-estetiken orörd. **Paus för playtest.** | — |
| C-SD3 | ~~Simulera-knappens sekundärsortering~~ | — | **LEVERERAD** `a70a2b2`. Sortering + HalfTimeSummary-check verifierad av agent 2026-05-25. |

### Match 2-känslan — live→sim AVFÖRD, trötthets-axeln ÖPPEN (playtest 2026-05-22)

Jacobs känsla: "simulering av match 2 leder nästan alltid till förlust." Två olika frågor blandades ihop — viktigt att hålla isär:

**FRÅGA A (live→sim vs sim→sim) — AVGJORD, ingen skillnad.** Code körde `scripts/live-vs-sim.ts`: 300 seeds, 95 jämförbara par, identisk startstate. Match 2-utfall BÅDA vägarna: W 44,2% / D 14,7% / L 41,1%. Noll skillnad. Fitness minskar korrekt för live-matchens spelare, training appliceras lika, enda icke-determinism är `Math.random()` i matchstraff-check (3/95, ±1 susp, ingen systematisk effekt). **Min tidigare hypotes — att live→sim skulle behandla truppen annorlunda — är FEL. Avförd.**

**FRÅGA B (trött match 2 vs utvilad match 2) — ÖPPEN, ej testad.** Code:s test jämför match 2-live mot match 2-sim — BÅDA går in med samma nedtröttade trupp, så testet kan per konstruktion INTE se trötthetseffekten (båda sidor har den). 41% förlust i match 2 är högt, men baslinjen saknas: ingen jämförelse mot match 2 med UTVILAD trupp. Mekaniken finns kvar i kod (squadEvaluator: fitness=60% av styrka; playerStateProcessor: −15–25/match, +8 återhämtning; generateAiLineup: AI alltid full styrka). Code:s test motbevisar den INTE — testar en annan axel.

**Code:s tre troliga förklaringar (rimliga, delvis sanna):** (1) litet stickprov + att man minns förluster efter investerad livematch. (2) **UI-flödet** — efter `saveLiveMatchResult` är `managedClubPendingLineup = undefined`; klickar man advance igen utan att gå in i lineupen för match 2 SKIPPAS din match (fixture stannar Scheduled) medan AI-matcher vid nästa matchdag körs — man hamnar på fel matchdag med match 2 fortfarande väntande. Ingen odds-nackdel men förvirrande. (3) taktik-slots: ändrar man lineup för match 2 utan att justera slots kan position-fit bli suboptimal.

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-FT1 | **TRÖTTHETSEFFEKTEN BEKRÄFTAD — +25,5pp vinst för utvilad trupp.** | squadEvaluator, playerStateProcessor, matchSimProcessor | **(a) SYNLIGHET LEVERERAD** (batch `e656619..638abbf`). **(b) SYMMETRI VERIFIERAT 2026-05-25:** AI tröttnar OCKSÅ — fitness uppdateras för alla i playerStateProcessor (ingen clubId-filter i huvudloopen). Asymmetrin gäller SELEKTIONEN: `generateAiLineup` sorterar på CA enbart, väljer trött spelare om CA är bäst. Spelaren kan rotera, AI roterar inte. **(c) BALANS VERIFIERAT:** −15–25/match, +8/omg vila. Fitness 50→90 = 5 viloomgångar. 25,5pp = extremfall (tunn trupp, noll rotering), normalt spel ~8–12pp. Formeln rimlig. **LÖST (verifierat 2026-06-03):** AI-selektionen är INTE ren CA-only. `generateAiLineup` har en fitness-floor (`AI_FITNESS_FLOOR=40`, `AI_REPLACEMENT_MIN_FITNESS=60`, `AI_ROTATION_CA_TOLERANCE=8`): bästa XI på CA, men genuint utmattade (<40 fitness) byts mot likvärdig fräsch ersättare (samma position, ≥60 fitness, inom 8 CA). Ingen proaktiv rotering → spelarens roteringsedge bevaras. Det är exakt den avrundning som föreslogs som fix — och renare än en kontinuerlig vikt (som hade eroderat edgen). Kvar är ren TUNING (floor 40 / min 60 / tolerans 8), playtest-informerad — ingen kod att skriva. +25,5pp-extremet = tunn trupp som inte KAN rotera, realistiskt. |
| C-FT2 | ~~UI-skip efter livematch~~ | — | **FIXAD** (verifierad 2026-05-25). Guard i PortalScreen rad 183–186: om `!pendingLineup && scheduled managed match` → redirect till `/game/match` innan advance körs. |

### Slutspels-buggar (playtest 2026-05-22, bild-set 2 — `docs/PLAYTEST_2026-05-22.md` §10)

Mest konkreta buggar Code kan ta direkt (ej Design). Opus hann EJ lokalisera alla i kod — kräver render-flödes-läsning per granskningsregeln (läs förälder, spåra flödet, aldrig isolerat).

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-SP1 | ~~"Slutför pågående flöde"-CTA fel~~ | — | **FIXAD** (verifierad 2026-05-25). `qf_summary` mappad i NAV_LOCK_REASONS → visar "Kvartsfinalsammanfattning väntar", inte fallback-texten. |
| C-SP2 | ~~Final-portal dubbel-punkt~~ | — | **EJ REPRODUCERBAR** (verifierad 2026-05-25). `SMFinalPrimary` falsy-gatear `dateStr`/`venueCity` → `· ·` kan inte uppstå i nuvarande kod. |
| C-SP3 | ~~heavySnow råsträng~~ | — | **LEVERERAD** `a70a2b2`. FinalIntroScreen: `getConditionLabel()` appliceras nu. |
| C-SP4 | ~~Förlängnings-overlay fel utseende~~ | — | **FIXAD** (verifierad 2026-05-25). `PhaseOverlay` har `position: fixed, inset: 0, zIndex: var(--z-modal)` — full-screen backdrop, ingen krock. |
| C-SP5 | **SM-final-uppspelets skarv (DESIGN/CSS).** Bild 3: svart panel på grå bakgrund = hårt skarvband (dash-4-svart ovanför grått). Inramnings/bakgrunds-mismatch. Skärmen hör dit (föregår lagpresentation) men inramningen är trasig. | final-uppspel bakgrund/CSS | Design/CSS. Liten. |
| C-SP6 | ~~Interrupt-spik inför andra semin~~ | — | **MÄTT 2026-05-25, ej bugg.** 12/12 SF-seeds: exakt 6 `phase_mark:informational`, 0 actionable. Rotsak: `interruptClassifier` räknar alla 6 SeasonPhase-värden men `pre_season`/`early`/`mid` saknar `PHASEMARK_LABELS`-entry och kallas aldrig `markPhaseAcknowledged` → falsk positiv i mätaren, ej synliga dashkort. Ingen dubbel-trigger. |

### Playtest 2026-05-25 (Gagnef)

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-U1 | ~~Utvisning→avstängning-legibilitet (orsakskrok).~~ | — | **LEVERERAD** `e681a05`. `suspensionCause?` på Player, sätts i playerStateProcessor, nollställs vid frigång. Inkorg: SUSPENSION_INCIDENT_LINES med interpolation. Trupp/chip: SUSPENSION_AVAILABILITY_LABELS single/multi. |
| C-FM1 | **Formationerna är fotbollsformationer, inte bandy.** 5-3-2 / 4-3-3 / 3-4-3 etc. Positionerna på dottarna är bandy (MV/VB/HB/VH/VMF/forwards) men grupperingarna lånade från fotboll. Öppen fråga: ska formationerna bli bandy-äkta? | Formation-data + motorns position-fit + FORMATION_OPTIONS (FormationView/SlotLineupView) | Stor. Rör motor. Jacob avgör om det tas. |
| C-V1 | **OpponentForm-kortet känns tomt/ihoppressat** (Heros form, playtest 2026-05-25). Visuell layoutkänsla. | OpponentFormSecondary | Liten. Polish, ej bugg. Tas när bugglistan är tom. |

### Reconcile 2026-05-23-handoffs (avstämt 2026-05-25)

| # | Idé | Plats | Estimat |
|---|---|---|---|
*(C-MK1 LEVERERAD 2026-05-25: ManagerProfile-entity + CoachRivalry + burnout + tränaravtal + H2H-tracking. 6 filer. C-SY1#4 LEVERERAD 2026-05-25: managerKvittoText.ts + GranskaOversikt-integration.)*
| — | **Resterande-tickets** = rena Code/CSS (`HANDOFF-RESTERANDE-TICKETS`): gold-tokens (5 min), SMFinalPrimary fel guld (1h), SimSummary tokens (15 min), C-SP5 crossfade (1h), D-ST1 tokens-doc (1h), klubbminne-CSS (3h), transfers-refaktor. Ingen Opus-text. Inkrementella, prioordning i handoffen. | — | ~10h Code spridda. |

### Portal-systemet (skissat 2026-05-17)

*Tomt just nu — C-P1 levererat 2026-05-18.*

### Synlighet och hierarki (skissat 2026-05-20)

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-SY1 | **Synlighetssprinten** — orsakskrok PILOT 1 KLAR (`1505ce5`: klackEcho cause-prefix, 24 strängar, 35%-tröskel, matchCore+coffeeRoom). Pilot 2 (csPress) väntar `journalist.memory`-strukturbyte (egen Code-runda per spec). #3 NU-stiltje LEVERERAD (`d608cee`). Efterklang V2 + refinements KLAR. Kvar: Pilot 2 prerequisite + Portal-hierarki-justering. **Pilot 1 väntar playtest före skalning till fler pools.** | `docs/SKISS_SYNLIGHETSSPRINT_2026-05-20.md` | Pilot 2: ~3h prereq + 1h. |
| C-SY2 | **Score-system tre-vokabulär (LED / score-block / sparkline)** — ALLA VÅGOR KLARA. Våg 1 (RoundSummary/SimSummary/GranskaForlopp), Våg 2 (VictoryScore→hero, MatchResult raderad), Våg 3 (TabellSecondary/FormStatusMinimal sparklines; OpponentForm öppen per C-V1), **Våg 4 KLAR**: Ekonomi kassa-trend `037054f`, PlayerCard rating-block `e10f79a`, SeasonSummary placering+formkurva+W/D/L `2e2795c`. Primitiver + hero + dev-galleri klara. **Paus för playtest.** | `AUDIT-SCORE-SYSTEM-COVERAGE-2026-05-23` | KLAR. |

### Säsong och kalender (flaggat 2026-05-21, efter B11)

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-K1 | ~~Landslagsuttagningsmekanism~~ | — | **LEVERERAD `b4dbe8e` 2026-05-25.** R7→R14, nationalTeamService, roundProcessor-trigger, LandslagsFranvaroSecondary, Player/SaveGame-fält. Kvar v2: LobbyPress-decision + first-callup MemoryEvent (sig 60) — parkerat tills lobby-systemet prioriteras. |

### Transfers — speldesign-utvidgning (skissat 2026-05-17)

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-T8 | **Förhandlings-utbyggnad.** Sign-on bonus, boendebidrag (bandyspecifikt — klubbarna ordnar lägenheter), jobbgaranti (semi-pro), image rights för lokala sponsoringansikten. | BidModal + transferService | Stor framtid |
| C-T11 | **Transfers känns tomt + döda återvändsgränder (playtest 2026-05-22).** (1) "Hantera bud → inga öppna bud" — CTA lovar handling, ger tomhet. Dölj vid 0 bud eller led till marknad/scouting. (2) Nudges finns men bor i transfers-fliken, inte på portalen där spelaren lever — yta dem på portalen (= C-SY1 efterklang-princip). (3) Marknaden död vid passivitet — något borde hända över tid (rykten, enstaka spelare). | portal + transfers + transferService | Medel. Design. Överlappar C-SY1 + C-T8. |

### Trupp Fas 3-rester (spec `SPEC_TRUPP_FAS3_SYSTEM_2026-05-24.md`, rapport 2026-05-24)

| # | Idé | Status | Estimat |
|---|---|---|---|
| C-TR1 | **Klack-favorit-chip (Tier 1B).** Klack-systemet skriver INTE till `narrativeLog` — eget tillstånd i `game.klackEcho`. Chip kräver ny `'klack'`-typ i narrativeLog + ändring i `klackPresenter.ts`. Två vägar: (i) narrativeLog `'klack'`-typ (Opus lutar åt detta — konsekvent med övriga chips); (ii) explicit `isKlackFavorite?: boolean`. Tas när Klack-narrativ prioriteras, inte isolerat. | Väntar Klack-narrativ-prioritering | Medel (system + Klack-ändring) |
| C-TR2 | ~~Anniversary-eko-chip~~ | **LEVERERAD** `aab96bf` + `3c6fac0`. Pool-varianter + hash-val på eventId. | — |
| C-TR3 | ~~Squad-pulse (full scope ii)~~ | **LEVERERAD** `aab96bf` + `3c6fac0`. teamFitnessHistory + hero-render + inline-expand. | — |

### THE_BOMB-rester (sedan tidigare)

Tomt. Alla rester levererade. Vidare THE_BOMB-arbete väntar nya design-rundor.

### Integration-haltning (genomspelning Jacob+Erik 2026-06-10)

Genomspelningen gav en STRUKTURELL signal, inte en känslo-signal — spelet avbröts av buggar + final-krasch + osatt design, och känslan går inte att läsa förrän designen sitter OCH spelet inte avbryts. Två fynd, coarse (Jacob kan inte specificera mer):

| # | Fynd | Vad det är | Approach |
|---|---|---|---|
| INT-1 | **De stora bågarna saknas.** | = B1 lång-loopen. Genomspelningen bekräftar auditen på känslo-nivå: ingen dragning framåt över säsonger. | Bygg B1 (se B-tabellen). |
| INT-2 | **En hel del system haltar i sin integration.** | Byggda system som inte wirar/koherar — samma klass som halvtidsrapporten (byggd, aldrig anropad, fixad `6a9dc70`). | Integrations-/renderingsyte-inventering: för varje system som producerar spelarvänt innehåll, verifiera att det avfyrar MED RÄTT DATA och når skärmen — inte bara att en call-site finns. Trigger: parallellt med B1 / efter Design-rundan. |

**Känslan är inte en grind på bygget — den är valideringen efter.** Ordning: buggar borta (mestadels klart) + design satt (Design-rundan) + stora bågen byggd (B1) + integration lagad → ren oavbruten genomspelning → DÅ känslan som säger om strävan landar.

---

## D. PARKERADE (kräver beslut, omtag eller naturlig trigger)

| # | Vad | Varför parkerat | Vad krävs för att starta |
|---|---|---|---|
| D1 | ~~Cup-tonen Nivå 3~~ | — | **FULLSTÄNDIGT LEVERERAD.** Strängar in `matchCommentary.ts` (`c55b9bf`). Sampling-logik (40%/50%) i `matchCore.ts` runda 1446–1454, verifierad `GRANSKNING_2026-05-21 P5`. |
| A1.5++ | **Rotorsak: varför genererar matchSimulator/matchEngine Goal/RedCard/Save-events med tomt `commentary`?** A1.5+ fixar UI-symptomet med fallback-pipeline. Permanent fix vid källan så fallback i `deriveEventText` blir död kod istället för kritisk grind. | Väntar på rotorsaksutredning av text-generatorn | **→ AKTIVERAD i CODE_SAMLAT P5 (2026-05-21).** Inte längre "vänta på playtest" — utreds nu. |
| C-N1 | ~~NU-fliken konstruktivt innehåll vid stabilt läge~~ | **LEVERERAD `d608cee` 2026-06-01.** Fem stiltje-lager ersätter "Allt är lugnt"-fallback: stillness-beat + veckans rytm + stämningskurva + mikrohändelser + heritage. `stillnessService.ts` + `StillnessSection.tsx`. Stämningskurva läser befintlig teamFitnessHistory (ej nytt teamPulseHistory). Heritage återanvänder findActiveAnniversaries. | — |
| D-ST1 | **seasonalTone → design tokens.** B11 enade seasonalTone:s TIDSBAS med kalendern, men tonen har fortfarande egna hex-värden vid sidan av token-systemet. Ska tonen bli riktiga design tokens? Token-arkitekturfråga. | Token-systemets djup behöver bestämmas | Design-session lördag |
| D3 | **Inline-stratum-migrering** (typroll-reimplementering → kanoniska roller: label/eyebrow/quote/radie/btn). Vakten (ds-guard ratchet `4e1a6c5`) + kartan (`AUDIT-INLINE-STRATUM-KARTA-2026-06-10.md`) finns; migreringen driver ratchet mot noll. | Designs visuella-konsekvens-audit kan ändra scope (de två system-klasserna: tom struktur, färg utan legend) | **Trigger: Design-auditen landar → steg-3-regler.** Kör migreringen i ETT pass då. Bulk (icke-system-klass-filer) kan börja även innan — inte hela paketet gated. |
| D4 | **Portal-orienteringen / första-gången-rampen** (onboarding). Brief skriven: `design-system/briefs/DESIGN-BRIEF-PORTAL-ORIENTERING-2026-06-10.md`. | Design-uppgift (rendered ramp); Design upptagen med nuvarande audit | **Trigger: Design fri efter nuvarande audit.** Djupet gated på målbeslut (a/b/c); formen kan Design föreslå oavsett. |

---

## E. TEKNISK SKULD — SMÅ (paketeras opportunistiskt)

*(Stora teknisk-skuld-punkter TS-1 till TS-10 finns i `KVAR.md` — duplikeras inte här. Detta är *små* punkter som dyker upp i audits.)*

| # | Vad | Plats |
|---|---|---|
| E-SC1 | **Delad seedad picker.** `pickFromPool` (boardMeetingCopy), `pickNoRepeat` (upptaktCopy), `pickVariant` (×2 byte-identiska i eventCardInlineStrings + csPressEventText) + inline `abs(seed)%len` i ~30 textfiler är samma idiom. Konsolidera till `seededPick`/`seededPickNoRepeat` i `domain/utils/random.ts`. Multi-fil, opportunistiskt. | domain/utils/random.ts |
| E-SC2 | **Eskalering recompute per render.** `getEscalationSubState`/`computeManagedStanding` körs ~3–4× per Portal-render (PortalUpptakt + NextMatchPrimary + isCtaWarm). Billiga ops (12-rads-loop) men kan tråda ett beräknat värde via props. `getPlayoffSeriesContext` dubbelanropas i NextMatchPrimary. | PortalScreen-trädet |
| E-SC3 | **trendStroke last-vs-first.** EkonomiTab + StillnessSection deriverar sparkline-stroke inline (last-vs-first, 'cold'-neutral i Stillness). Överväg `seasonTrendStroke(points, {neutral})` bredvid `trendStroke` (last-vs-prev). | formatters.ts |

*(E-K1 cup-fixture mid-säsong-stamping levererad i commit `5d65ecb`, verifierad i granskning 2026-05-21. E-K2 `getRoundDate` i visningslagret levererad i P1-passet `7e2f...`.)*

---

## F. ETABLERAD ARBETSDISCIPLIN (Opus-regler för att inte glömma)

1. **Innan skrivuppgift:** läs `WRITING_GUIDELINES_BANDY_MANAGER.md` + `SPEC_CUP_ANSLAG_2026-05-08.md` + andra relevanta tonfiler systematiskt. Inte plocka strängar utan helhetskoll.
2. **Max 10 citat per generations-block** (per `WRITING_GUIDELINES_BANDY_MANAGER.md` Lärdom #7). Stanna. Granska. Sen nästa.
3. **När Opus parkerar något:** skriv det in i denna BACKLOG samma session. Säg "lagt i BACKLOG.md C-T8" inte bara "bra idé, vi tar det senare".
4. **När större paket startar:** scanna BACKLOG för relaterade idéer som kan packas samman. Akademi-paketet (B1 Riktning 1) drar t.ex. in C-T3, C-T4, C-T5, C-T6 som naturliga delar.
5. **Klara rader raderas vid commit.** CHANGELOG dokumenterar historiken — tabellerna ska bara visa vad som faktiskt är öppet.

---

## CHANGELOG FÖR BACKLOG SJÄLV

| Datum | Vad |
|---|---|
| 2026-05-17 | Filen skapad. Inventering av allt parkerat just nu i sessionen + tidigare. |
| 2026-05-17 | A3 (cup-vy final-status) + C-N1 (NU-fliken konstruktivt innehåll) tillagda efter Jacobs playtest. |
| 2026-05-17 | C-S1 (Pep-talk-poolen blandar röster — överlapp med atmosphere) tillagd. |
| 2026-05-17 | A4 (månadsanslag triggas fel + Annandagen osynlig på Portal) tillagd. |
| 2026-05-17 | C-N2 (journalist-relations-kort saknar eyebrow) tillagd. |
| 2026-05-17 | A5 BLOCKER (SM-vinnarvy felaktigt vid cup-vinst) + A1.5+ (tomma mål-events i live-flödet) + C-N3 (ankomst-CTA) tillagda efter playtest. |
| 2026-05-17 | A5 levererat (full cup-final-victory-scen med Opus-texter). A1.5+ levererat (deriveEventText med 4-stegs-pipeline). A1.5++ tillagd — rotorsak-utredning till nästa playtest. |
| 2026-05-17 | C-S1 levererat (Opus, direkt i StartStep.tsx) — pep-talk-poolen omskriven till intern röst, funktion omdöpt, JSDoc-princip tillagd. |
| 2026-05-17 | A4(a) v2 RETUR — hardcodat matchday === 12 fungerar inte (varierande kalender). Spec klar för alt B (isAnnandagen-flagga på Fixture). C-S2 tillagd (styrelse-event "tre nollor" inkonsekvent med form-data). C-O3 tillagd (händelsetidslinje saknar hemma-borta). |
| 2026-05-18 | A4(a) v2 levererat — `isAnnandagen`/`isNyarsbandy` på Fixture som första-klass-flaggor, slot-propagering, backfill-migration, regression-test. 818/818 grönt. |
| 2026-05-18 | Småfix-paket levererat — C-N3 + C-O3 + C-O1 i commit `77848ee`. C-S2 (patron style-klagomål utan faktaanspåk) i commit `135caa2`. |
| 2026-05-18 | A6 (dubbelt intro vid säsongsstart) + A7 (cup-anslag-trigger-bugs: cup_start timing + cup_done/cup_between dubbel-trigger) tillagda efter playtest. |
| 2026-05-18 | A8 (motståndar-tabellposition-fragment triggar för tidigt) tillagd — saknar minimum-rounds-villkor. Tredje fyndet i samma mönster (anslag/event utan datastöd). |
| 2026-05-18 | A7+A8 levererade i commit `f1c7fec` — cup-anslag-triggers + opponent-standing-guard. 826/826 grönt. |
| 2026-05-18 | **STOR RENSNING.** Klara rader raderade (A1, A1.5, A2, A3, A4, A4(a) v2, A5, A1.5+, A7, A8, C-N2, C-N3, C-S1, C-S2, C-O1, C-O3, E1). C-T3/C-T4/C-T5/C-T6 absorberade i B1 Riktning 1-scope. C-T10 absorberat i B4 Sprint 2. C-O2 absorberat i B4. Droppade: C-T7 (counter-offer-eskalering, ej skuld), E2 (rating-bugg-lokalisering, obsolet efter A1.5). A1.5++ + C-N1 flyttade från A/C till D (väntar trigger). Endast A6 kvar som aktiv (väntar bild för att lokalisera trigger). |
| 2026-05-18 | C-P1 levererad i commit `edfa1a9` — `cardStaleTracking`-state, `0.5^N`-dämpning, gap-detect, migration. B3 verifierad i commit `d2c9915` — visade sig vara dolt klart sen tidigare, bara tester saknades. 844/844 grönt. Lärdom: dokumentation kan vara ur fas med kodbasen. Verifiera B2 och B4-delar mot kod innan nya specer skrivs. |
| 2026-05-18 | **Tre design-runda + spec-paket levererat.** C-B2 (klack-echo) + C-B3 (pensionsval + avskedsmatch var 5:e) bundlade i commit `d2ba879`. C-T2 (vintervärvningsdagen, 4 säsongs-kontexter + AI-bud-event) i commit `6c425c6`. Opus levererade tre textpooler i `retirementText.ts`, `windowDeadlineText.ts`, `klackEchoText.ts`. 882/882 grönt. |
| 2026-05-20 | **C-T1 + C-T9 levererat** efter Design-Claudes revisioner (`SPEC-SVAR-TRANSFER-RESPONSE-2026-05-20.md`). `transferPersonality` (35/30/15/12/8%-fördelning), `regionGeography.ts` (latitud-baserad distans), `playerAcceptsTransfer` med implicit-family via proxies, rivalry-bias från befintliga `rivalries.ts` (intensity-modifierad), `BidModal`-warning, `TransferBidResult`-inbox-rendering, ✨ dream_club-specialcase. Opus textpool i `transferResponseText.ts` (utökad av Design-Claude). 889/889 grönt. **LÄRDOM #33 lagd i LESSONS.md:** Opus måste köra PRE-SPEC CROSS-CHECK före varje spec — bröt mot Princip 2 två gånger på samma session. **CLAUDE.md fick ny SESSIONSSTART-sektion** överst som flagar disciplinen. |
| 2026-05-20 | **C-B1 levererat** efter Design-Claudes revisioner (`SPEC-SVAR-CS-PRESSFRAGA-2026-05-20.md`). `csPressEventService.ts` med streak-räkning + cooldown 4 omg + 25/35/60%-sannolikhet, `pickCSPressPlayer` 55/30/15 GK/DEF/Half, `roundProcessor`-trigger efter hemma-CS, `eventResolver` csPress-handler med morale/relation-deltas + journalist.memory-entry, `GranskaOversikt`-rendering med 4-valsknappar (inkl ghost "Ingen kommentar"). Opus textpool i `csPressEventText.ts` med 15 frågor (5 per severity), severity-baserad på `journalistRelationship`. 907/907 grönt. 18 nya tester. |
| 2026-05-20 | **Dokumentations-omstrukturering pushad i commit `ab33e77`.** Se ovan. |
| 2026-05-20 | **A6 avförd.** Skärmdumpar visade att "dubbelt intro" var ANKOMSTEN (ArrivalScene) + ANSLAGET (cup-anslag vid oktober-lottning) — två separata system med olika triggers, inte dubbel-fyrning av samma feature. Cup-anslaget är medvetet designat och triggas av cup-lottning oavsett säsongsnummer. Ingen fix behövs. |
| 2026-05-20 | **Spectator-säsongen specat (B5).** Design-Claude levererade handoff + mock 2026-05-20. Opus PRE-SPEC CROSS-CHECK gjord, AnslagOverlay-pattern identifierat (Design's separata ElimAnslag-komponent ersätts av nya anslag-keys). Spec klar i `SPEC_SPECTATOR_SASONGEN_2026-05-20.md`. Mock kopierad till `docs/mockups/`. Redo för Code. |
| 2026-05-20 | **Synlighetssprinten skissad (C-SY1).** GPT's reviderade analys konvergerade med Opus diagnos: synlighet, inte fler system. Fyra tickets översatta till Bandy Manager-konkretion i `SKISS_SYNLIGHETSSPRINT_2026-05-20.md`. Kräver designrundor före spec. |
| 2026-05-20 | **Score-system skissat (C-SY2).** Design-Claude skissade tre visuella vokabulär (LED-numerals / score-block / sparkline) som svar på "kan vi göra mer än text?". Påverkar 10+ ytor (RoundSummary, WatchOthers, MatchReport, OpponentForm, TabellSecondary, FormStatus, PlayerCard, Ekonomi, Academy, SeasonSummary, Journalist). Opus pushade tillbaka mot att börja implementera — mocken är skiss, inte implementations-spec (saknar komponent-API, prop-varianter, migrations-ordning). Väntar på komplett spec från Design över helgen. Pilot via §G i Klubbminne-handoff när Design är tillbaka. |
| 2026-05-20 | **B5 Spectator-säsongen levererad** i commit `13b1122`. `isManagedClubSpectator`-helper, `'spectator'`-fas i SeasonPhase, tre playoff_eliminated_*-anslag via AnslagOverlay, `PortalSpectatorMark` + `SpectatorPrimary` + `WatchOthersSecondary`, CTA-text-byte, SeasonSummary-eliminationsrad. 907/907 grönt. **OBS:** playtest avslöjade rotorsak — `season_done` triggar för tidigt och hoppar över hela Spectator-perioden. Fix specad i B7. |
| 2026-05-20 | **5 textpools omskrivna av Opus** efter Code skrivit egna placeholders i strid med surface-separation. `playoffAnslag.ts` (9 varianter), `spectatorMarkText.ts` (omskriven + kontextmedveten), `spectatorPrimaryText.ts` (12 varianter, kontrakt/akademi/trupp-fokus), `watchOthersReflectionText.ts` (9 varianter), `seasonSummaryElimText.ts` (ny fil, 8 varianter). Bandysvensk understatement, template-variabler `{motståndare}`/`{rond}`/`{resultat}`/`{season}`. |
| 2026-05-20 | **Bug-fix-runda specad (B7).** Playtest från Jacob avslöjade 8 buggar + 2 textfel + 4 design-issues. Spec i `SPEC_BUGFIX_PLAYTEST_2026-05-20.md`, tier-uppdelad. Rotorsak till att Spectator-flödet aldrig syntes: `managedClubLastSeasonMatchCompleted` triggar `season_done` direkt efter elimination utan att vänta på att SF/SMF spelats av andra. Redo för Code. |
| 2026-05-20 | **Klubbminne v1 specad (B6).** Audit (DEL A) + R5 Anniversary (DEL B). Q1-Q5 besvarade av Opus. Två tekniska justeringar mot Design's handoff: (1) `outcome`-fält på MemoryEvent istället för `text.includes('förlust')`-diskriminator, (2) `seasonStartSnapshot.era` istället för parallellt era-system. §G (score-block + formkurva) parkerat i C-SY2. Spec i `SPEC_KLUBBMINNE_2026-05-20.md`. Redo för Code efter B7. |
| 2026-05-20 | **B7 bug-fix-runda levererad** i commit `e861792`. TIER 1.1 (`season_done` väntar på `PlayoffStatus.Completed` — rotorsaken till att Spectator aldrig syntes), TIER 2.1 (cup_between-suppress vid elimination), TIER 2.3 (`SÄSONGEN KLAR`-branch — "omg 23 av 22" borta), TIER 2.5 (SM-vinnare i SeasonSummary), TIER 3.1 (`nedsläpp`→`avslag` i 3 filer), TIER 3.2 ("Sånt är inte gratis" guard mot bottenstrid), TIER 4.1 (halvvägs-knappar in-flow), TIER 4.2 (retirement-eyebrow `🏁 PENSIONSVAL`), TIER 4.3 (SeasonSignature observedFacts populeras — Opus skrev om fact-texterna 2026-05-20), TIER 4.4 (veckans-fråga-pills borttagna). |
| 2026-05-20 | **B6 Klubbminne levererad** i commit `fffbf5d` (8 commits). DEL A: `club-memory.css`, `outcome`-fält + severity-klasser, era-band med migration, `featured`-klass. DEL B: `findActiveAnniversaries`-helper, SaveGame-fält + advance-trigger, `PortalAnniversaryMark`, kafferum + klack-trigger, memory-row-eko-markör. 922/922 grönt, inga hex-värden i CSS. **Opus levererade 4 anniversary-textpools** (`anniversaryMarkText`, `anniversaryKafferumText`, `anniversaryKlackText`, `anniversaryMemoryRowText`) i bandysvensk understatement. |
| 2026-05-21 | **Synlighets-audit gjord** (`AUDIT_SYNLIGHET_2026-05-21.md`). 7/8 datakällor verifierade. Huvudfynd: Moment-feeden (`recentMoments`) är levande (skrivs av roundProcessor från 6+ källor) men har ingen renderingsyta. Genrejämförelse (FM actionable/informational-split). Bevisar GPT/Design-diagnosen på datanivå. |
| 2026-05-21 | **Dukningssprint specad (B8).** Tre infrastruktur-tickets inför Design lördag: `collectActiveMemories`, `classifyInterrupt`+instrumentering, `managerChoiceLog`. Ingen svensk text, ingen UI-regressionsrisk. `SPEC_DUKNINGSSPRINT_2026-05-21.md`. |
| 2026-05-21 | **Urvals-stickiness specad (B9).** Jacobs playtest-känsla verifierad mot kod: kafferummet seedar på ligarunda (inte matchdag) + saknar anti-upprepning i `getCoffeeRoomScene`; Portal-staleBias nollställs av ett enda gap → oscillation. Fix specad i `SPEC_URVALS_STICKINESS_2026-05-21.md`. Urvalsfilosofin (variation som mål) lämnad till Design. |
| 2026-05-21 | **Kalender-refaktor specad (B11).** Jacobs hypotes verifierad: tidslinjen svajar för att buildSeasonCalendar räknas om on-demand på 4 ställen + matchday/roundNumber-mismatch i fallback + fixtures bär inte datum + TRE tidsaxlar (liga okt, väder pollar 1 aug, seasonalTone räknar från 1 sep). KORRIGERING: SPEC_MATCHDAGAR + SPEC_VADER fanns redan (jag missade dem — sökte på 'kalender' inte 'matchdagar') och löser speldagar/väder empiriskt; refaktorn rör arkitektur, inte innehåll. Beslut: nov-start, cup oktober, final alltid Studenternas, 12-lag ETT landslagsuppehåll, annandagen fast + nyår/trettondag slumpade, tider helg 14-15/final 13/vardag 19. Löser datum/ordning/timing-klassen i inbox/events + är förutsättning för B8:s fas-affinitet (men löser inte synlighet själv). `SPEC_KALENDER_REFAKTOR_2026-05-21.md`. Egen sprint. |
| 2026-05-21 | **Matchmotor-paritet + Lineup-nudge specad (B10).** Playtest: (1) quicksim känns förlora oftare än live — verifierat att båda bottnar i matchSimulator men via olika ingångar (simulateMatch vs simulateMatchStepByStep, fixtureSeed vs Date.now). Primär hypotes: managed club får AI-lineup i quicksim. Code bygger paritetstest. (2) Hela elvan förifylld → ändra till förfyll 8, lämna 3 slumpade tomma. `SPEC_MATCHMOTOR_LINEUP_2026-05-21.md`. Halvtidsmodalen (ton) + Math.random-citat noterat till Design. |
| 2026-05-21 | **B8 + B9 + B10 LEVERERADE** (980 tester, ren build). B8: `collectActiveMemories` (9 källor, snapshot-testad), `interruptClassifier` (roundProcessor orörd), `managerChoiceLog` på MatchReport (överlever stripCompletedFixture). B9: kafferum seedar på matchday + `lastCoffeeSceneIndices`, staleBias frekvensgolv + gap halverar firstShownAt. B10: **ingen motorskevhet** — paritetstest N=1000 bekräftar quicksim=live, upplevd skillnad = halvtidsjusteringar i live (AVSETT, dokumenterat i DECISIONS 2026-05-21); `lineupNudge.ts` 8 fyllda + 3 slumpade tomma. **Dukat bord för Design lördag:** Moment-ström + kö-instrumentering + kvitto-råvara finns. |
| 2026-05-21 | **Kafferum-poolen utökad** (Opus, 7→19 GENERIC_EXCHANGES i `coffeeRoomService.ts`). Ren text, bruksklubbs-vardag i Sture-ton, körd mot per-citat- + slop-test. Code committar. |
| 2026-05-21 | **B11 Kalender-refaktor LEVERERAD** (1000 tester gröna, 21 nya i `calendarTimeline.test.ts`). `seasonCalendar` på SaveGame byggd EN gång; fixtures stämplade med date+tipoffHour; `buildSeasonCalendar` anropas på exakt ETT ställe (roundProcessor/matchSimProcessor/useMatchGenerator/MatchLiveScreen/dailyBriefingService läser lagrad kalender); seasonalTone tidsbas enad med novemberstart; cup koncentrerad oktober + ett landslagsuppehåll som ankare; migration v0.3.0; tester låser ankarna (annandag 26/12, final tredje lör mars, ligastart nov, inga mån/tors). Tre punkter flaggade ej-i-scope → C-K1 (landslagsuttagning), D-ST1 (seasonalTone→tokens), E-K1 (cup-fixture mid-säsong-stamping). |
| 2026-05-21 | **BACKLOG-RENSNING + samlat Code-uppdrag.** Jacobs princip: ingen byggtids-begränsning → allt tillräckligt specat byggs nu, bara Design-/Opus-text-beroende parkeras. B2 + B4 verifierade mot kod: B2 EJ byggd (inget annandagsVal-fält i SaveGame), B4 design-del EJ gjord sedan auditen. Buntat med E-K1 + A1.5++ till `docs/CODE_SAMLAT_2026-05-21.md` (P1-P5). Genuint kvar-parkerat: C-SY1/C-SY2/C-N1/D-ST1/C-K1 (Design lördag), D1 cup-tonen (Opus-text näst), C-T8 (ospecat). |
| 2026-05-21 | **KODGRANSKNING genomförd** (`docs/GRANSKNING_2026-05-21.md`), tre fynd åtgärdade. P1: död `getRoundDate`-fallback i roundProcessor:493 med matchday/roundNumber-mismatch inbyggd — borttagen, `game.currentDate` som sista utväg. P2: `generateMatchWeather` approximerade månad via `roundToMonth(matchday)` istället för fixturens stämplade datum — lade till `fixtureDate`-parameter, månad härleds nu från faktiskt datum (de tre tidsaxlarna möts på riktigt). seasonalTone redan korrekt (nov-bas). P3/E-K1: cup-fixture-stämpling verifierad i commit `5d65ecb` (generateNextCupRound + createNewGame + seasonEndProcessor). P4: migration v0.3.0 verifierad korrekt (Completed bevaras, Scheduled stämplas). P5: cup-atmosphere-sampling byggd (40/60 ej-final, 50/30/20 finalhelg) — strängar orörda, D1 därmed helt klar. B9/B10-svep rena. Noterat: `getRoundDate` kvar i visningslager → E-K2. |
| 2026-05-22 | **Motordiagnos klar** (`docs/MOTORDIAGNOS_RESULTAT_2026-05-22.md`). Alla tre flaggor i `season_analysis.md` (röda kort ❌, mål ⚠️, hörnmål ⚠️) = RAPPORTARTEFAKTER, inte motorfel. Motorn <1% från bandygrytans targets (utvisningar 3,74 vs 3,77; mål 9,15 vs 9,12; hörnmål 22,0 vs 22,2). `RedCard`-event = tidsutvisning (~6,75 min), inte rött kort — fotbollsarv i namnet. Verifierat genom kodläsning att `analyze-stress.ts` REDAN är rätt kalibrerad; `season_analysis.md` är föråldrad artefakt. → C-M1 (markera obsolet), C-M2 (tre sidofynd att bevaka), C-M-grupp i C. |
| 2026-05-22 | **P1 Annandagen val-mekanik LEVERERAD** (1001 gröna). 3 steg byggda: val A/B/C → era-låsning+D → kedjereaktioner, hittar annandagsmatch via `isAnnandagen`-flagga. Self-review-pass hittade 15 förbättringar: bl.a. `adjustSupporterMood()`-återanvändning återför saknat `Math.max(0)`-golv (faktisk bugg i klack-reaktionen), `stampFixturesFromCalendar()`-extraktion (3 inline-maps → 1), `calculateClubEra` 2×→1×/runda, och **E-K2 stängd** — 7 UI-filer slutar anropa `getRoundDate()` vid render, läser `fixture.date`/`fixture.isAnnandagen` direkt. **KVAR: Jacobs egen playtest av ekonomibalansen** (julmarknad +25k mot survival-budget, gratisentré-utfall). CODE_SAMLAT P1-P4 därmed levererade; endast P5 (tomma commentary-rotorsak) kvar. |
| 2026-05-22 | **P3 + cup-tonen committade** (`c55b9bf`). `INCOMING_BID_KAFFERUM` Opus-text (5 repliker, ersatte `[Opus]`-placeholder), `cup_atmosphere` + `cup_finalweekend_atmosphere` in i matchCommentary (löste latent TS2339/TS2551-byggfel som funnits sedan `34d811e`), `seasonSignatureService` Opus-textputs (verifierad: mina B7-texter flyttade, ej Code-omskrivning). |
| 2026-05-23–24 | **Portal-kurering DEL 1–4 LEVERERAD** (commits `1e1e05b` → `eaaa0ff`). Ny `inboxToPortal.ts`: 7 inbox-kinds (bigResult/scandal/playerMilestone/derbyRamning/nemesis/journalistHot/mecenat), BoardFeedback-grenen kräver titel-prefix-match. Story-slot i `portalBuilder.ts`: FREKVENTA ×0.5 rotation, SALLSYNTA +25 golv, recencyBonus (+10/+5), roundsAgo ≤ 2 filter. Ny `roundCharacter.ts`: 7 karaktärer (cup_day/pre_derby/premiere/losing_streak/winning_streak/post_loss/standard), CHARACTER_BIAS-tabell. Viktsänkningar: board_objectives 65, tabell 20, ekonomi 18. **Render-loop fix** (`ae90f13`): `currentStorySlotType`/`lastStorySlotType` separerade — `recordPortalShown` skriver current, `roundProcessor` promotar current→last vid matchdagsövergång; loop omöjlig. **19 pixel-avvikelser** mot story-slot mockup åtgärdade. **Layer-fix**: `initCardBag.ts`+`inboxToPortal.ts` importerar `CardRenderProps` från domain-lagret. **Opus-text**: annandagen (3 mediarubriker + 4+1 beskrivningar), kafferum (+26 generiska utbyten, +4+4 fatigue). Lärdom 36 (render-loop: läs- och skrivfält måste separeras) tillagd i LESSONS.md. |
| 2026-05-24 | **Trupp-redesign Fas 1+2 LEVERERAD** (commits `a001ac3`, `496ea7d`). PlayerRow: stripe-klass per position, sparkline-primitiv (6 ratingsrader), chip-pills (skada/vila/C-band/kontraktsvarning), captain-band 16×16px, storyline-rad, captain hoist. Audit-fix: Sparkline-primitiv extrakt till komponent, chip-pills layout-fix. |
| 2026-05-24 | **Sprint 2026-05-24 LEVERERAD** (commits `7ae0b1c`, `2f6ecf7`, `bebb8a6`). 1A inbox-titlar med motståndare; 1B tränings-titel med omgång; 1C media-byline (`buildByline`-helper); 2 bud-kategori live (approach a, läser `game.transferBids`); 3A cup_day-bias (+event_critical +patron_demand_unmet); 4B kommentar-pooler utökade; 4A pickCommentary-minne (avvisa-och-dra-igen Map<pool,seen[]>, param-trådad ~82 anrop, deterministisk). |
| 2026-05-24 | **Manager-anteckning Tier 1A LEVERERAD** (commit `da071ff`). `managerNote?: string` på Player, `✎`-prefixad italic-rad i PlayerRow. Trupp-krokhaken aktiverad. **BACKLOG-TILLÄGG:** Tier 2B (anniversary-eko), Tier 2C (squad-pulse scope-val), Tier 1B (klack-favorit kräver Klack-systemändring) lagda nedan under C (Trupp Fas 3-rester). |
| 2026-05-25 | **Kod-audit + pixel-granskning (R3/R3+/C-SD1) genomförd.** R3 endgame-portal (`PortalRoundMark`, `PortalPhaseMark`, primär-vikteskalering) verifierad pixel-exakt mot `2026-05-16_design_endgame_klimax.html` — levererad i tidigare session. R3+ klimax verifierad. C-SD1-kod strukturellt levererad (`902f9db`) — scope-notering: `inSummerScene` sätts aldrig i kodbasen → 'summer'-fas i `getSeasonEndPhase` är oåtkomlig (sommarscenariot saknar triggerlogik, ej regression). Scen-sekvens-redesignen (vem äger vad i vilken ordning) kvarstår som open design-fråga. |
| 2026-05-25 | **Motor v1.3.0 — kemi kopplad** (commit `2a3992e`). `chemMultiplier()` i `matchCore.ts`, kalibrering 9,09 vs 9,12 (−0,03, tolerans ±1,5 ✅). Chemistry appliceras enbart på hanterat lag (AI ×1,0). `matchUtils.ts` + `matchSimProcessor.ts` uppdaterade med `homeChemistry`/`awayChemistry`-fält. Kod-audit + 5 fynd fixade (commit `c4b856f`). |
| 2026-05-25 | **Motor v1.4.0 — sharpness + moral kopplat** (commit `eacf801`). `playerModifier` i `squadEvaluator.ts` sharpness-medveten (0,90–1,0 faktor, kalibrering oförändrad). Moral→form-drift i `playerStateProcessor.ts`: morale < 30 → form −1/omg, morale > 80 → form +1/omg, 30–80 = neutral zon. Linjerar med redan anslutna form-kanalen. |
| 2026-05-25 | **phaseMarksSeen persistence-fix** (commit `495f84e`). Fas-markering skrevs till minne utan efterföljande `persistAutosave` → fas-kortet återkom vid omstart/krasch. Fix: `void persistAutosave(markedGame, 'advance')` omedelbart efter `set({ game: markedGame })` i `gameFlowActions.ts`. |
| 2026-05-25 | **C-FT1 synlighet (a) LEVERERAD** (batch `e656619..638abbf`). `utils/lagstyrka.ts` (computeLagstyrka: idag vs fitness=100, ur `evaluateSquad` — sant per konstruktion), trötthetsring på `PlayerDot`, lagstyrka-rad i StartStep/SlotLineupView/FormationView, trött-banner omramad (antal→konsekvens). (b) symmetri + (c) balans öppna i C-FT1 (balans/Code). |
| 2026-05-25 | **Playtest-fixar LEVERERADE** (samma batch). Media: titel=rubrik, bröd=byline (`journalistService`, löste rubrik=bröd-dubblering). Stale derby-storycard grindat på `nextMatchIsDerby` (`inboxToPortal`). clubMemory dedup + debut bara för `promotedFromAcademy` (`statsProcessor` — grundtruppen debuterar inte längre i premiären, källfix; dedup städar befintliga saves). Bandy-poäng tre→två. kemi v1.3.1. `regular_done`-anslag skrivet (`leagueAnslag.ts`). |
| 2026-05-25 | **PARKERAT denna session.** Nya: C-U1 (utvisning→avstängning-orsakskrok), C-FM1 (fotboll-vs-bandy-formationer), C-V1 (OpponentForm-visual). Uppdaterade: C-FT1 (a klar, b/c kvar), C-SD1 (sommar-fasen cuttas, REGULAR_DONE-skärm + summer-borttagning kvar för Code, `regular_done`-anslag skrivet). |
| 2026-05-25 | **C-U1 spårat + text levererad.** Avstängningens orsak lagras inte i dag (`Player.suspensionGamesRemaining` är en ren räknare) men är återvinningsbar ur `MatchEventType.Suspension`-eventet. Opus-text i `suspensionText.ts` (incident / availability-label / återkomst). Code: `suspensionCause?`-fält satt vid spärr-läggning + tre ytor. Ingen mock (rider på inkorg + trupplista). Korrigering: C-SD1 sommar-"cuttas" var fel slutsats — `seasonEndPhase.ts` har redan 6 faser utan sommar, inget att ta bort (se C-SD1-raden). |
| 2026-05-25 | **C-K1 landslag — text levererad + designval låsta.** `landslagText.ts` (uttagningsnotis/modal, frånvaro, retur + guld-variant, icke-uttagen, lobby-decision, första-gångs-minne). Designval (Opus tog Designs föreslag): +5 tkr/uttagen synligt, egna i Portal/övriga Inbox. Spec-färdigt för Code per `HANDOFF-C-K1-LANDSLAG-2026-05-23` + kalenderflytt R7→R14. |
| 2026-05-25 | **Reconcile 2026-05-23-handoffs + C-SY1#4 text.** Manager som karaktär (C-MK1): designval låsta, spec-färdigt men obyggt (~10,5h, ~30 strängar på greenlight). C-SY1#4 manager-kvitto: text levererad (`managerKvittoText.ts`), oblockerat, ~3h Code (`managerChoiceLog` finns sedan B8). Resterande-tickets: rena Code/CSS-fixar, prioordning i handoffen. |
| 2026-05-25 | **C-MK1 manager som karaktär — greenlight + text levererad.** `managerKaraktarText.ts` (bio-mallar, burnout-mark, coach-rivalry-citat ×4 personligheter + namnpool, kontraktsstatus/utfall). Designval låsta. Code bygger 2 faser (~10,5h): profil+burnout, sen avtal+rivalry. |
| 2026-05-25 | **Score-systemet — greenlight + sekvensering.** Bygg primitiverna `ScoreBlock` + `Sparkline` FÖRST (per `HANDOFF-SCORE-SYSTEM-2026-05-20`) — de avblockerar C-SY1 Efterklang + hela synlighetssprinten. Sen 4-vågs-migrering per `AUDIT-SCORE-SYSTEM-COVERAGE-2026-05-23` (quick wins → victory scenes → trend-data → featured). Realistiskt ~20–25h spridda, inkrementellt. Designbeslut bekräftade: final-result = ScoreBlock gold; live→retrospekt = LED→Block utan in-view-övergång; mini-sparkline max 12/skärm, annars vid expansion (SquadScreen bara expanded rows, R.3 perf). De 4 ursprungliga besluten ur 2026-05-20-handoffen står kvar om inte Jacob omprövar. |
| 2026-05-25 | **BACKLOG-RENSNING.** C-MK1 (Fas 1+2 manager-karaktär, entity+burnout+tränaravtal+H2H+TranareTab), C-SY1#1 Efterklang (pickEfterklang + EfterklangSecondary + initCardBag), C-SY1#4 manager-kvitto (GranskaOversikt-integration), C-U1 (suspensionCause + inkorg + trupp), score-primitiver + Våg-1 (ScoreBlock/Sparkline + RoundSummary/SimSummary/GranskaForlopp): alla raderade ur tabeller. C-SY1 uppdaterad (2 tickets kvar). C-SY2 uppdaterad (Våg 2–4 återstår). |
| 2026-05-26–29 | **Score Våg 2 KLAR.** VictoryScore → ScoreBlock gold (victory scenes). ScoreBlock hero-storlek (size-prop, 48px mono, ingen border-left). MatchResultScreen reverterad — LED/Block-hybridförsök; Granska är hemskärmen. Periodisering-slack unifiat 5→3, bänk-recovery kapas, "Ramp först"-varning på Player. Dev-scengalleri `/dev/scenes` med 4 ytor + Playwright-screenshot-script. Efterklang V2: header=objektnamn, tidsanvisning, EfterklangThreadModal. BoardMeeting-fix: shouldTriggerBoardMeeting(game) återkopplad (säsong 2+, matchday 0). Granska card-gap 6→3px, MATCHEN-kort padding 12→16px. Kodgranskning: 5 fynd fixade (döda match-result-routes ×2, board_meeting-dismissal-loop, TYPE_ICON-duplikat, journalistEventLabel-hoisting). C-SY1 + C-SY2 uppdaterade. |
| 2026-06-01 | **Design-mockar implementationsrunda (4 delar).** Efterklang V2-refinements (`1cb057b`): warm-stripe, mono-subrad m. pip, chevron, tidslinje-modal m. nod-glow. BoardMeeting säsong 2+ (`e2c8c50`): A/B/C-state-resolver (`boardMeetingStateResolver`), copy-pool (`boardMeetingCopy.ts`), single-scene-layout (genre/setting/title/speaker/eval/fin/goals/CTA), gold-CTA endast vid B, återanvänder `game.boardPersonalities` + `club.board.chairman` (inget parallellt system), `boardObjectiveHistory.label` tillagt. NU-stiltje C-N1 (`d608cee`): fem lager, `stillnessService` + `StillnessSection`, stämningskurva ur befintlig teamFitnessHistory, heritage via findActiveAnniversaries (altitude-reuse, ej nytt teamPulseHistory/findEventsOnDate). Granska IA (`52fd322`): Översikt → tre grupper (Resultatet/Klubben/Omvärlden) m. GroupDivider; Förlopp uppslukad; HÄNDELSETIDSLINJE bevarad i Analys per Jacobs caveat; KONSEKVENSER-dublett borttagen; 5→4 steg. Alla verifierade i dev-galleriet (board-a/b/c, stillness, granska). 1025/1025 tester gröna. |
| 2026-06-02 | **Score Våg 4 KLAR — C-SY2 stängd.** Ekonomi kassa-trend (`037054f`: deriveKassaHistory + Sparkline, ingen ScoreBlock på pengar). PlayerCard senaste rating som ScoreBlock (`e10f79a`: win/loss/subtle, behöll rikare MatchSparkline — väg A, ingen separat featured-variant fanns). SeasonSummary (`2e2795c`: placering→ScoreBlock gold/win/subtle, POÄNGKURVA→Sparkline, W/D/L→tre ScoreBlocks, bespoke PointsChart borttagen). C-SD2 Portal-eskalering KLAR (warm-mellansteget 4-axligt: RoundMark+Primary-vikt+Next-dot+CTA) + följdrunda primary-weight-warm. C-SY1 #2 orsakskrok Pilot 1 (klackEcho cause-prefix). Simplify-cleanup: 4 fynd (SeasonSummary sparkline-kollaps, board-resolver dead code, isCtaWarm-tautologi, StillnessSection ctx-once). Tre tech-debt-noter E-SC1/2/3. 1050 gröna. **Paus för playtest — inga oblockerade Code-tasks kvar.** |
| 2026-06-07 | **DB-1 Fas 2 parkerad (kanonisk alpha-snäpp).** DB-1 kördes i två faser: tekniken (hårdkodad palett-`rgba()`→`color-mix(var(--token))`, exakt-alpha bevarad) klar i `72982c6`. Fas 2 = snäppa de tokeniserade alphas till de fem kanoniska stegen (6/18/30/35/55) — en *visuell* ändring (floran använder mellansteg 7/8/12/14/25/40), kräver eget pass med playtest/pixel-jämförelse. Beror på inget (körbar när som helst), låg prio — strukturmålet redan nått. Omvärdera om floran skaver i playtest; annars valfri. Exakt-alpha står, snäpp är opt-in. |
| 2026-06-07 | **Fresh-eyes flödesanalys — actionable rester** (källa: `FRESH-EYES-FLODESANALYS-2026-06-07.md`, Design). A3 match-laddning är specat + filat (`DESIGN-BRIEF-MATCH-LADDNING`), övriga tre parkerade: **C2 ekonomiskt minne** — kassan är ett saldo utan berättelse; ge den MemoryEvents ("året vi nästan gick under") så `economicScar`-ekot i Efterklang får förankring. **D2 ignorerade beslut** — mjukt får inte betyda noll; ett ignorerat beslut ska resolvera med en konsekvens (kontrakt löper ut, lobby pyser), inte ligga för evigt. **B2 lång-loopen** — vad strävar man mot över säsonger? (B1 mittfälts-öknen + C1 defensiv ekonomi är symptom på detta.) Kreativ-riktningsfråga, eget Opus+Jacob-samtal, inte en ticket. Alla tre hör till feature-fasen efter designsystemet. |
