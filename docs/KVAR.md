# BANDY MANAGER — KVAR

**Datum:** 2026-05-16
**Syfte:** Allt som är parkerat, spec:at-men-ej-implementerat, eller behöver beslut. Läs vid sessionsstart efter att CLAUDE.md/LESSONS.md/DECISIONS.md/DESIGN_SYSTEM.md är lästa.

---

## STRATEGISK PRIO (etablerad 2026-05-16)

Full motivering: `docs/GENOMGANG_SPEL_LOOP_2026-05-16.md`. Ordningen är **2 → 1 → 3** med 3 parallellt med 1.

### Riktning 2 (NU) — Verifiera dolda system
- Playtest-session: 10 inlåsta system (alla 🟠 enligt INLASTA_SYSTEM.md) + FIX 47-50 + F1 Beslutsekonomi när Code rapporterat klart.
- Ingen ny kod byggs förrän verifiering är gjord.

### Riktning 1 (NÄSTA) — Klubbutvecklingspaketet
- Spec finns: `docs/SPEC_KLUBBUTVECKLING.md`.
- Facility-träd med dependencies, säsongsplanering vid PreSeason, löneeskalering, kontextuella sponsorer, halvårsrapport, annandagsplanering, halldebatten som flersäsongsprocess.
- Stor sprint, ~2-3 veckor.

### Riktning 3 (PARALLELL MED 1) — Cup-ton + korsreferens-rester
- Cup-anslag och cup-commentary får egen tonal identitet (Opus-skrivarbete direkt).
- THE_BOMB-rester: 1.1 (CS-villkorad pressfråga), 2.1 (klack-reaktion nästa omgång), 3.3 (pensionsval-event).

### Verktygsfördelning just nu

| Verktyg | Spår | Konkret första uppdrag |
|---|---|---|
| **Jacob** | Riktning 2 | Playtest 10 inlåsta system + FIX 47-50 + F1-tutorial/budget (queue och cooldown blockerat tills backend-wiring klar) |
| **Opus** | Riktning 3 | Cup-tonen — direktiv klart i `CUP_TONEN_DIREKTIV_2026-05-16.md`. Väntar Jacobs beslut på alternativ A/B/C |
| **Code** | F1 backend-wiring + Riktning 1 prep | F1 UI klart 2026-05-16. Nästa: `game.deferredDecisions[]`-population i roundProcessor + CooldownRow-integration i source-secondary-kort. Spec skickas separat. |
| **Claude Design** | Pixel-audit + ArrivalScene rev2 | F1-pixel-audit kan börja på implementerade delar (tutorial-band, budget-prickar, inbox-counter). Queue/cooldown auditas senare. Plus 10 inlåsta system + ArrivalScene rev2 per OPEN THREADS. |

---

## AKTUELLT LÄGE (2026-06-19) — Promise⇔consequence-audit klar

**Promise⇔consequence-audit:** Rapport: `docs/AUDIT_PROMISE_CONSEQUENCE_2026-06-19.md`.

**Opus-directa copy-fixar (gjorda direkt på disk):**
- `tifo_contribution` label A: "+hemmabonus" → "+supporterstämning"
- `reporter_klacken` label B: "Journalisten tappar förtroende" → "−3 kommunstatus"
- `ismaskin_offer` label A: "+iskvalitet" → "+kommunstatus"
- `survival_wage_freeze` label A: "+budget · −spelarförtroende" → "+styrelsens tålamod · −supporterstämning"
- `lower_tempo` label: "Vila nästa match" → "Minska belastningen" (PlayerCard.tsx)
- `followUp` eko: handlingsimperativen borttagen (efterklangText.ts)

**Öppet — Code:**
- `player_weekend_off` bug: `morale`-effect-type appliceras på `form` (inte `morale`) i gameFlowActions + `kondition`-delta saknas helt. Fixas i gameFlowActions.ts + lägg till `fitness`-delta.
- `corner_extra_training` + `training_corners_vs_matchprep`: silent noop om candidate saknas — dölj beslut om ingen spelare uppfyller villkoret.
- `scout_opponent_corners`: dölj/grona alt A om `scoutBudget = 0`.
- `legacy_youth_showcase`: stryk `+rekrytering` från label (Opus) eller bygg rekryteringseffekt (Code).
- `mentor`-action: ingen downstream — bygg mentorship-effekt (CA-tillväxtbonus för youngPlayer i endOfSeason).
- Inkorg "KRÄVER SVAR" utan action-path: navigations-CTA per item-typ (ör #12-familjens logik).

**Öppet — pass 2 (egna nästa session):**
- TacticBoardCard.tsx: "Så spelar det"-raden
- gameStore.ts `talkToPlayer`: state-persistens verifiering
- gameStore.ts `useLeadershipAction`: public_praise jealousy-delta

**legacy_youth_showcase copy** (Opus, väntar Code-beslut om rekryteringseffekt byggs): om inte — ändra label A till "+kommunstatus" direkt.

---

## AKTUELLT LÄGE (2026-06-20) — Konsekvensraden + backlog-rensning

**Klart (`b2cfa121`..`f3785368`):**
- Konsekvensraden Surface A+B (Förbättring 5): `getTacticConsequence` + `getPhaseConsequence`, 13 tester, 1188/1188 gröna.
- formatCurrency residual (Förb 2): borttagen från formatters.ts + migrerad i TransfersScreen/SeasonSummaryScreen/EkonomiTab (`58b5d7ce`).
- KF9b: 10 Lager 2-konstanter ur eventProcessor → `eventProcessorStrings.ts` (`e3a1025a`).
- KF7 verifierad KLAR (seasonEndProcessor:1173–1181 befintlig gallring), KF11 verifierad KLAR (kommentar i matchSimProcessor:310), KF12 verifierad KLAR (NODE_ENV-gate).
- E-SC3 verifierad KLAR (EkonomiTab använder `seasonTrendStroke`, StillnessSection importerar + anropar `seasonTrendStroke`).

**Nästa:**
- E-SC1 LÖST `a9077d4e` — 6 datafiler + eventProcessor:s `pickByIndex` → `seededPick`. (pickVariant i specialDateService/SpectatorPrimary har annan signatur — separat pass vid behov.)
- D3 inline-stratum-migreringen (§3 FÖRSONINGSSPRINTEN): pill-CTA/positionLabel/emoji-svep/tomma kort/delade primitiver/LED.

---



Full handover: `docs/HANDOVER_2026-06-18.md`. Order (1–15): `docs/CODE_DESIGN_ORDER_SPELKANSLE_PLAYTEST_2026-06-18.md`.

**Klart:**
- A (spelarkort) + B (taktik) byggt/committat c78a22df..f85acb5d, 1144 tester gröna. A fixade röst-determinism (Math.random bröt determinism + hjälteplacering).
- Opus copy/kort-fixar i trädet (ocommittade tills Code tar dem): portalBeats "Transferfönstret öppet", injuryContextText.ts + InjuryStatusSecondary-wiring, burnout/hawaii/vänder-ur/vill-mer.
- #10 efterklang-grind (playedLeague<5) finns i trädet (visades fel i den gamla builden c78a22d).

**Öppet — Code (prio #8, #9 först):**
- #8 CTA under nav (match-laddning/ankomst/band ej i CEREMONY_PATHS) — tyngst, återkom gång på gång.
- #9 efterklang grinda nemesis till nästa motståndare.
- #11 veckans beslut bygg klart (taktikinsikt→opponentAnalyses detailed-tier + scout-kostnad; positionering→leadershipActions-mönstret).
- #12 inkorg agerbarhet (Frida-tifo → beslut/inline; Helena body/ej klickbar).
- #2 burnout-picker, #3 pressrubrik-seed, #4 match-laddning säsong-1, #5 Spelguide-dubblett, #6 coachmarks→Home, #7 inkorg empty-state-röst.
- Committa #1 (Opus träd-edits) + tsc/lint.

**Öppet — Design:**
- #13 scen-konst: `docs/DESIGN_SPEC_SCEN_KONST_2026-06-18.md` (cup/derby/premiär/nyår-JPG + placeholder "illustration på väg" + band-fond).

**Öppet — Opus:**
- #11-etiketter efter att Code satt de riktiga effekterna.
- REKOMMENDERAD nästa stora kvot-körning: promise↔consequence-audit (egen färsk session) — varje spelar-vänd yta (veckans beslut, efterklang, inkorg, beats, kafferum, klack, journalist, "så spelar det", ledarskap/samtal), kolla att löftet backas.

**Öppna beslut:** #14 beat-länk (bryter beat-kontraktet, systembeslut), #15 PNG-thumbnails överallt? / äkta kemi-overlay?

**Jacob väntar med att spela tills Code är klar (för mycket återkommande fel i mellanläget).**

---

## AKTUELLT LÄGE (2026-06-10) — Session tech-debt + A3 match-laddning

**Pushat av Code 2026-06-10 (commits `b1c7ca3` → `b5e845e`):**
- ✅ **Ledger-vocab i modaler** — `BidModal` + `RenewContractModal` använder LedgerFrame CSS-vokabulär; `volunteerMorale`-puls med CS mean-reversion drift (commit `b1c7ca3`)
- ✅ **Tech-debt E-SC1** — `seededPick`/`seededPickNoRepeat` konsoliderade i `random.ts`, 5 duplikat borta (commit `f7901b4`)
- ✅ **Tech-debt E-SC3** — `seasonTrendStroke` helper i `roundCharacter.ts`, ersätter inline last-vs-first (commit `fedd663`)
- ✅ **Tech-debt E-SC2** — Portal-eskalering/playoff-kontext förberäknad en gång i `PortalScreen` (commit `aa5569f`)
- ✅ **A3 Match-laddning beat** — `computeLaddningBeat` (grind), `MatchLaddningScene` (fullbleed tillfälle-tier), `MatchLaddningBand` (slim tillstånd-tier), wiring i `MatchScreen` som nytt `'laddning'`-steg, 20 grind-tester (commit `b5e845e`)

**Verifiering:**
- TSC clean, 1092/1093 passed (1 pre-existing boardMeetingScene)
- Audit: `docs/sprints/SPRINT_A3_MATCH_LADDNING_AUDIT.md`

**Manuell playtest återstår:**
- Visuell rendering av scen/band mot mock (pixel-jämförelse kräver levande app)
- IllustrationPlaceholder-fallback för derby/cup/premiar/nyår

---

## AKTUELLT LÄGE (2026-05-24) — Sprint 2026-05-24 + trupp-redesign Fas 1+2 + manager-anteckning

**Pushat av Code 2026-05-24 (commits `1e1e05b` → `da071ff`):**
- ✅ **Portal-kurering DEL 1–4** — `inboxToPortal.ts` (7 inbox-kinds), story-slot i `portalBuilder.ts` (FREKVENTA ×0.5 rotation, SALLSYNTA +25 golv, recencyBonus), `roundCharacter.ts` (7 karaktärer, CHARACTER_BIAS-tabell), vikt-sänkningar (board_objectives 65, tabell 20, ekonomi 18)
- ✅ **Render-loop fix** — `currentStorySlotType`/`lastStorySlotType` separerade; `recordPortalShown` skriver current, `roundProcessor` promotar current→last vid matchdagsövergång. Loop omöjlig.
- ✅ **Pixel-audit** — 19 story-slot CSS-avvikelser mot mockup åtgärdade (border-left på card-elementet, per-stripe gradient, label-färger, typografi px-för-px)
- ✅ **Layer-fix** — `initCardBag.ts` + `inboxToPortal.ts` importerar `CardRenderProps` från domain-lagret (`dashboardCardBag.ts`) istf presentation-lagret
- ✅ **Opus-text** — annandagen (3 mediarubriker + 4 val-beskrivningar + intro), kafferum (+26 generiska utbyten, +4 FATIGUE_WARM, +4 FATIGUE_HOT)
- ✅ **Trupp-redesign Fas 1+2** — stripe-klass per position, sparkline-primitiv (6 ratingsrader), chip-pills (skada/vila/C-band/kontraktsvarning), captain-band 16×16px, storyline-rad, captain hoist (commit `a001ac3` + `496ea7d`)
- ✅ **Sprint 2026-05-24 — 1A inbox-titel med motståndare** — `createMatchResultItem` tar `clubs[]`, bygger `"Matchresultat: HomeShort–AwayShort score–score"`
- ✅ **Sprint 2026-05-24 — 1B tränings-titel med omgång** — `` `Träning omg ${roundNumber}: ${typeLabel}` ``
- ✅ **Sprint 2026-05-24 — 1C media-byline** — `buildByline` helper, journalist suffixad ` — Name, Outlet` på titel
- ✅ **Sprint 2026-05-24 — 2 bud i VIKTIGT** — `getCategory` läser live `game.transferBids` vid render (approach a)
- ✅ **Sprint 2026-05-24 — 3A cup_day-bias** — `event_critical: 0.5, patron_demand_unmet: 0.5` i `CHARACTER_BIAS.cup_day`
- ✅ **Sprint 2026-05-24 — 4B kommentar-pooler** — supporter_goal_home 4→8, weather-pools utökade
- ✅ **Sprint 2026-05-24 — 4A pickCommentary-minne** — avvisa-och-dra-igen N=min(poolSize−1,3), Map<pool,seen[]> skapad EN gång per matchsimulering, param-trådad genom ~82 anrop. Deterministisk.
- ✅ **Manager-anteckning Tier 1A** — `managerNote?: string` på Player, `✎`-prefixad italic-rad i PlayerRow (commit `da071ff`)

**Verifiering:**
- Build ren, 0 TypeScript-fel per commit
- pickCommentary: deterministisk (Map keyas på array-referens, reset per match)
- Bud approach (a): ingen stale inbox-mutation — ett enda läs-ställe

**Nästa:**
- Jacob scope-val: squad-pulse enkel (fatigueHistory) vs full (ny teamFitnessHistory)
- P5 i BACKLOG: rotorsak tomma commentary-events (CODE_SAMLAT-sista paketet)
- Anniversary-eko — litet pass, ren mekanik, redo att aktivera

---

## AKTUELLT LÄGE (2026-05-18) — Audit-fixar R3 + R3+ klara, 804 tester gröna

**Pushat av Code 2026-05-18 (commit `c01b79a`):**
- ✅ **Audit-fixar R3 + R3+ — alla 7 åtgärder** — se `docs/HANDOVER_2026-05-18.md` för full tabell
  - 2 🟥 BLOCK: `--gold-deep`/`--shadow-gold` tokens + SMFinalPrimary → `primary-card primary-weight-3`
  - 3 🟧 WARN: NextMatchCard playoff CSS-klasser, SeriesBoxes `.series-box-*`-klasser, `.primary-card` bas
  - 4 🟨 OBSERV: PortalPhaseMark onClick borttagen, `getCurrentLeagueRound()` helper extraherad (4 sites → 1), `PortalPhaseMark.test.tsx` (5 fall)

**Nästa:**
- Jacob playtest per `docs/PLAYTEST_CHECKLIST_2026-05-17.md` (allt testbart)
- Design pixel-audit R3 + R3+ mot `docs/mockups/2026-05-16_design_endgame_klimax.html`
- Beslut: Riktning 1 (Klubbutvecklingspaket) eller playtest-fynd-sprint

---

## AKTUELLT LÄGE (2026-05-17 sen kväll) — Playtest-fynd KLARA

**Pushat av Code 2026-05-17 sen kväll (commit `cf7a3f0`):**
- ✅ 🟥 Rating-bug live/commentary-match — rotorsak: `justCompletedManagedFixture` i `roundProcessor.ts` hittade inte live-matchens fixture (redan Completed när `advance()` körs). Fallback mot `allFixtures` filtrerat på `matchday === nextMatchday`.
- ✅ 🟧 cup_fullTime_win #3 — sista meningen borttagen, nu "Domaren blåser. {team} klarar sig."
- ✅ 🟧 season_opener beat i cup-kontext — beat-trigger checkar nu `if (!nextAny || nextAny.isCup) return false`.
- ✅ 🟧 Händelsetidslinje vänster/höger — tvåkolumns-grid i `GranskaForlop.tsx`. Mina händelser vänster, deras höger, ingen "mot".

804 tester gröna, build ren.

**Nästa:**
- Jacob playtest — verifiera 4 fixar i kontext
- Code: Transfers Sprint 1 (A2 i BACKLOG.md)

---

## AKTUELLT LÄGE (2026-05-17 senare kväll) — F1 KOMPLETT, R3, R3+, Cup Nivå 1+2 PUSHADE

**Pushat av Code 2026-05-17 senare kväll:**
- ✅ **Package 1** — Stage 1A (deferredDecisions typed + wired + promoteFromQueue) + Stage 1B (ArrivalScene A2-A5)
- ✅ **Package 2** — R3 Endgame Portal
- ✅ **Package 3** — R3+ Klimax-eskalering (commit `c83a5b2`)
- ✅ **Package 4** — Cup-tonen Nivå 2
- ✅ **Stage 2** — SourceSecondaryCard + CooldownRow-integration (commit `9f6a5d9`)
- ✅ **R3 + R3+ pixel-audit-fixar** (7/7 audit-fynd) — `--gold-deep` + `--shadow-gold` tokens, SMFinalPrimary → `primary-card primary-weight-3`, NextMatchCard playoff-gren CSS-klasser, SeriesBoxes `.series-box-*`-klasser, PhaseMark onClick borttagen, `getCurrentLeagueRound()`-helper extraherad, PortalPhaseMark.test.tsx (5 fall)

**Tidigare:**
  - `sourceCooldownService.ts` (SourceKey, startCooldown, decrementCooldowns, isInCooldown)
  - Cooldown-längder: kommunen 8, mecenat 4, lokaltidningen 3 omgångar
  - `SourceSecondaryCard.tsx` med dormant kort + `CooldownRow` i botten (Alt B — generisk komponent med source-prop)
  - Wiring i tre lager: `eventResolver` startar cooldown → `roundProcessor` decrementerar → `eventProcessor`+`communityEvents` gates ny spawn
  - `initCardBag` med tre nya entries (kommunen/mecenat/lokaltidningen, weight 84-82) via `makeSourceCard`-factory

**Hela F1-paketet är nu KOMPLETT.** Flödet: källa resolvar → cooldown sätts → sekundärkort dyker upp med prickar → tickar ner en per omgång → försvinner → källan kan spawna igen.

**Testbart nu — allt:**
- ✅ F1 i sin helhet: tutorial S1Omg1, ActiveBudget, QueueRail, CooldownRow, InboxCounter
- ✅ R3: PortalPhaseMark, kafferum/journalist/signatur borta i playoff
- ✅ R3+: PortalRoundMark, weight-progression, gold-CTA i SM-Final, decisive/gold-dot SeriesBoxes
- ✅ Cup-tonen Nivå 1 (cup-rundor 1-2) + Nivå 2 (cup-final)
- ✅ ArrivalScene A2-A5

**Nästa:**
- Jacob playtest enligt `docs/PLAYTEST_CHECKLIST_2026-05-17.md` (DEL C nu fullt testbar inklusive cooldown-prickar)
- Design pixel-audit — brief skickad till claude.ai/design för R3, R3+, F1
- Opus standby

---

## AKTUELLT LÄGE (2026-05-17 kväll) — Audit-fixar + cup-tonen Nivå 1 KLARA (historiskt: Stage 1A/1B/2 var EJ gjort vid det tillfället, levererades senare samma kväll)

**Pushat av Code 2026-05-17 kväll (commit `c55987f`):**
- ✅ Alla audit-fynd: 2 🟥 BLOCK + 7 🟧 WARN + 1 🟨 klara
- ✅ Cup-tonen Nivå 1: 5 pools wirade i matchCore.ts (60% sampling, `cup_goalOpener` matchens första mål, Alt B)

**Bekräftat EJ gjort (Code rapporterat 2026-05-17):**
- ☐ **Stage 1A** — `game.deferredDecisions[]`-population i roundProcessor. SaveGame-typen har fältet som `unknown[]` med kommentar "reserved for future use". `PortalQueueRail` läser men kommer aldrig rendera.
- ☐ **Stage 1B** — ArrivalScene A2-A5 (refaktor + transition + aria-label + eyebrow-klass)
- ☐ **Stage 2** — source-specific kort + CooldownRow-integration. CooldownRow finns men ingen parent importerar den. **Väntar Alt A/B-beslut från Jacob.**

**Vad som faktiskt är testbart i nuvarande build:**
- ✅ PortalActiveBudget, PortalInboxCounter (F1 UI-delar)
- ✅ Audit-fixar i kontext (stripes-hierarki, MecenatDinnerEvent, etc.)
- ✅ Cup-tonen Nivå 1 (kräver cup-match)
- ❌ PortalQueueRail (kommer aldrig rendera — backend saknas)
- ❌ CooldownRow (monteras aldrig — ingen parent)
- ❌ ArrivalScene A2-A5 (samma som förut, inga visuella ut-fixar gjorda än)

**Nästa:**
- Jacob playtest: per `docs/PLAYTEST_CHECKLIST_2026-05-17.md`. Hoppa DEL C "Queue-rail" och "CooldownRow".
- Stage 1A + 1B + Stage 2: paketeras för Code (Stage 2 väntar Alt A/B — Opus pushar för B)
- Cup-tonen Nivå 2 (cup-final-separation): klar på disk, väntar Code-integration
- Cup-tonen Nivå 3 (cup_atmosphere + cup_finalweekend): skrivs näst

---

## AKTUELLT LÄGE (2026-05-14) — VÄNTAR PLAYTEST

**F1 Beslutsekonomi UI:** ✅ KOD KLAR — commit `253b544`.

| Komponent | Innehåll | Status |
|-----------|----------|--------|
| PortalActiveBudget | Eyebrow + budget-prickar (on/off/locked), visas när activeCount > 0 | ✅ |
| Tutorial-frame | Säsong 1 Omg 1: copper-band "Lugnare första veckan" | ✅ |
| PortalQueueRail | Kö-rail med ⏳ + räknare + käll-chip; renderar när deferredDecisions.length > 0 | ✅ |
| CooldownRow | Amber-prickar (left/spent), roundsLeft/totalRounds; redo att kopplas till source-secondary-cards | ✅ |
| PortalInboxCounter | aktiva · i kö · notiser i inboxen — döljer 0-kategorier | ✅ |
| EventCardInline cleanup | remainingCount-blocket borttaget, hanteras nu av PortalInboxCounter | ✅ |

**Pixel-audit att göra (Jacob + Design):**
- Verifiera hierarki i kontext med 4+ sekundärer aktiva
- Tutorial-band synligt Säsong 1 Omg 1, borta Omg 2
- Queue-rail visas när deferredDecisions > 0 (backend-wiring ej klar än — queue alltid tom just nu)
- CooldownRow saknar integration i source-secondary-cards (hallDebate/rumorService) — backend + nya kort krävs

---

## AKTUELLT LÄGE (2026-05-14) — VÄNTAR PLAYTEST

**Playtest-fixar + FIX-47/48/49/50:** 🔄 KOD KLAR — väntar browser-playtest av Jacob.

| Fix | Innehåll | Commit | Status |
|-----|----------|--------|--------|
| Commentary kaskad | interactionData rensas i setSteps, skippar setCurrentStep i commentary-mode | `37f7e8f` | 🔄 |
| FIX-47 | Scoreboard V1 — klocka mitten (1fr auto 1fr grid) | `f78eaad` | 🔄 |
| FIX-48 | Slutskärm inline — revert FIX-33 overlay, FeedEndRow i feed | `7d6b9d4` | 🔄 |
| Scoreboard minuter | Bara minuter visas (ej MM:SS) | `fad3c17` | 🔄 |
| FIX-49 + kontrast | Timers +2s, 8 CSS-kontrast-höjningar, PitchLineupView cirklar synliga | `ab5df7e` | 🔄 |
| Kafeterian | "Kafferummet" → "Kafeterian" i 4 filer | `ab5df7e` | 🔄 |
| FIX-50 | Lineup default = förra matchens elva, fyll bara tomma slots | `aee4aa4` | 🔄 |

**Kvarstår:**
- Browser-playtest av ovanstående
- Granska-vyn: events-lista, spelarbetyg, POTM, hörn-band (FIX-48 noterar att det hör dit)
- BATCH E (press/media-separation) — parkerad, väntar beslut om integration-yta

---

## AKTUELLT LÄGE (2026-05-10) — VÄNTAR PLAYTEST

**Stålvallen match-live-bundle (BATCH A–D) + samlade fixar:** 🔄 KOD KLAR — väntar browser-playtest.

760 tester gröna. Build ren. Allt pushat till origin/main.

| Batch/Fix | Innehåll | Commit | Status |
|-----------|----------|--------|--------|
| BATCH A | ScoreboardStalvallen + CommentaryFeedStalvallen + sevenSegment | `ff8fc18` | 🔄 |
| BATCH B | InteractionShell + LastMinutePress + MatchReportView | `733d65e` | 🔄 |
| BATCH C | Portal secondary cards (WeeklyDecision/BoardObjectives/ActiveArcs) | `5412983` | 🔄 |
| BATCH D | CornerInteraction + FreeKickInteraction + PenaltyInteraction + CounterInteraction | `8e05458` | 🔄 |
| FIX-05/06/07 | Inline-styles → CSS-klasser, `--panel`-token, fadeInUp | `321275a` | 🔄 |
| FIX-01–04 | season_signature_reveal av, textkorr, cup_final_pre, TABELL→CUP-fas | `4f3f272` | 🔄 |
| FIX-08–09 | boardMeetingScene + cupIntroScene → anslag-modal | `60221a5` | 🔄 |
| FIX-10–11 | EventCardInline Stålvallen-anatomi, cup-stake-text | `15b9c20` | 🔄 |

**Pixel-audit kvarstår.** Öppna `docs/match-live-bundle/*.html` bredvid appen — jämför per komponent. Avvikelser i CSS-värden fixar Code omgående.

**Intro-flödet (säsong 1):** ArrivalScene → BoardMeetingScene → Portal (cup_start) → SundayTraining → cup_first_match → cupspel.
**Intro-flödet (säsong 2+):** season_kickoff-anslag → Portal (cup_start) → cup_first_match → cupspel.

**BATCH E (press/media-separation):** parkerad. Media-bibliotek (`src/domain/data/media/library/quotes/`) finns. Spec i `docs/PRESS_MEDIA_SPEC_2026-05-10.md`. Väntar beslut om integration-yta.

---

## ÖPPNA SMÅFIXAR (ej prioriterade)

- `QFSummaryScreen.tsx:38` — `letterSpacing: '3px'` → `'2px'`
- DIAGNOS F2: emoji-prefix saknas på vissa labels
- `GameOverScreen:158` + `ChampionScreen:209` — knappar utan `.btn`-klass
- `SeasonSummaryScreen.tsx` säsongssignatur-citatblock (Mock 2-pass)
- `VictoryQuote.tsx`, `ClubMemoryEventRow.tsx`, `ClubMemoryLegendsBlock.tsx` (Mock 2-pass)
- `SeasonSignatureSecondary.tsx` calm/scandal-stripe (Mock 2-pass)
- `MatchHeader.tsx:61` `atmo.borderAccent` (Mock 2-pass)
- `Scoreboard.tsx:145 #A89878` — hårdkodat hex (gammal komponent, ej Stålvallen)

---

## LEVERERAT 2026-05-09–10

**Anslag-system (variants + liga-anslag):** ✅

| Leverans | Commit | Status |
|----------|--------|--------|
| Anslag-types.ts + cupAnslag.ts migration (15 texter → variants) | `b9a256d` | ✅ |
| leagueAnslag.ts — 6 liga-keys × 3 varianter = 18 texter | `b9a256d` | ✅ |
| computeNextAnslag — liga-triggering + 7 hjälpfunktioner | `b9a256d` | ✅ |
| AnslagOverlay.tsx — pickAnslagVariant + getAnslagData | `b9a256d` | ✅ |
| 5 obligatoriska testfiler (760 totalt) | `b9a256d` | ✅ |
| Cup-scen-justeringar (beat 1 kortad, 2 tester, JSDoc) | `e4c5951` | ✅ |
| ArrivalScene-reboot | `41af54d` | ✅ |
| cup_between Variant B "frosten ligger om mornarna" | `457343e` | ✅ |

---

## AKTUELLT LÄGE (2026-05-08)

**Playtest-fixes 2026-05-08 — allt levererat:** ✅ LEVERERAD (playtestades och fixades samma session)

Tre batchar (A–G) efter playtest-session 2026-05-08:

| Fix | Beskrivning | Status |
|-----|-------------|--------|
| A1/G1 | CoffeeRoomScene + JournalistRelationshipScene CTA ej klickbar — `flex:1` på content-div pushade CTA under viewport | ✅ |
| A2 | EventCardInline val-knappar ojämna (`btn-primary` vs transparent) → `btn-outline` vid fler än ett val | ✅ |
| A3 | HalftimeModal CTA → `btn-cta btn-primary` | ✅ |
| B1/F3 | NextMatchCard visade "7:E" under cupfas — `anyMatchPlayed` → `anyLeagueMatchPlayed` | ✅ |
| G2 | Journalist-rubrik dedup — matchday i hash-seed | ✅ |
| G3 | Kafferum-preview visade samma text som full scen — `meta.subtitle` som preview | ✅ |
| F1 | Beslutsekonomi throttling — max 2 aktiva decisions, säs 1 omg 1 max 1 | ✅ |
| E3 | Strings-pool-inventering → `docs/STRINGS_POOL_INVENTORY.md` | ✅ |
| Bug | `traitSuspensions.hungrig` 1-variant → 3 varianter | ✅ |

**`FINALDAG_BRIEFING_SPECTATOR` 1-variant** — avsiktligt per Jacob's direktiv i koden. Ingen åtgärd.

---

## AKTUELLT LÄGE (2026-05-06, kväll)

**Sprint TECH-1 (Del 1-4) — allt levererat:** 🔄 KOD KLAR — awaiting browser-playtest.

| Del | Innehåll | Commits | Status |
|-----|----------|---------|--------|
| Del 1 | SmåFixar + pool-integration + granska-verifiering | `ccd1bcf` | 🔄 KOD KLAR |
| Del 2 | PreMatchContext — kontextuell stakes-rad ovanför lineup | `79322e8` + `6ce6bfe` + `ca8bcb5` | 🔄 KOD KLAR |
| Del 3 | Squad ⚡ NU-vy — akut-dashboard som default-tab | `1cde1a9` | 🔄 KOD KLAR |
| Del 4 | Halvtidsval (3 val m. mekanisk konsekvens) + transfer-kafferum + NU-pool | `8e1869b` | 🔄 KOD KLAR |

**Också levererat i samma session:**
- Petré-kalibrering av `generateAttributes()` — forward skating/acceleration ned till mid, position-specifik stamina (`a217dc0`)
- `squadEvaluator.ts` vikter — +acceleration i båda score-funktioner, +stamina försvar (`ec3b408`)
- Per-klubb Sture-repliker (12 st) + snabbare ArrivalScene-animationer (`706498e`)

**Kvarstående (ej del av TECH-1, väntar nästa session):**
- `QFSummaryScreen.tsx:38` — `letterSpacing: '3px'` → `'2px'`
- DIAGNOS F2: emoji-prefix saknas på vissa labels
- `GameOverScreen:158` + `ChampionScreen:209` — knappar utan `.btn`-klass
- Mock 2-pass: 6 specialfall (SeasonSummaryScreen, VictoryQuote, CounterInteraction etc.)
- `Scoreboard.tsx:145 #A89878` — hårdkodat hex

---

## STATUS-DEFINITIONER (NY 2026-05-04)

Från och med 2026-05-04 används två olika status-symboler för att skilja kod-leverans från spel-leverans:

- **🔄 KOD KLAR** — Code rapporterar färdig implementation, ej playtestat av Jacob
- **✅ LEVERERAD** — Jacob har playtestat och bekräftat att specen faktiskt fungerar

Fram till 2026-05-04 användes bara ✅ — vilket ledde till falsk leverans-status (se `docs/diagnos/2026-05-04_kvar_audit.md`). Tidigare ✅-rader med `⚠️ Awaiting browser-playtest` ska tolkas som 🔄 KOD KLAR tills annat bevisats.

---

## AKTUELLT LÄGE (2026-05-06)

**Design-rensning B2 (Steg 2B/C/D + HANDOFF #9):** 🔄 KOD KLAR — awaiting browser-playtest.

| Sprint | Innehåll | Status |
|--------|----------|--------|
| Steg 2B CTA-byten | 11 filer: inline gradient → `.btn.btn-primary`. Ceremonial-knappar (RoundSummary/HalfTime/QFSummary/PlayoffIntro) behåller `letterSpacing/uppercase` inline. | 🔄 KOD KLAR |
| Steg 2C kort-byten | 4 Kategori 1-kort → `.card-sharp`: SquadScreen:498+559, GameOverScreen:127, ChampionScreen:161. Övriga kategorier bevarade. | 🔄 KOD KLAR |
| Steg 2D label-normalisering | 12 ändringar i 7 filer → `.h-label` (8px/600/2px). Skärm-rubriker med dramatisk effekt bevarade. | 🔄 KOD KLAR |
| HANDOFF #9 ArrivalScene | Ny `ArrivalScene.tsx` — kontinuerlig intro (steg 0→4), inget route-byte. `.scene-cta` separat CSS. ClubSelection → `/intro`. `arrivalDialogue.ts` för Sture-text. | 🔄 KOD KLAR |
| Steg 3 B2 + revert | Mock 1 (stripes bort) implementerades och reverterades samma dag — beslutet: stripes och klammer är genomgående visuellt språk. `.card-tap`-hover-klass + dual-signal (stripe + tint/tag/🔥) är slutgiltigt mönster. | 🔄 KOD KLAR |

**Kvarstående från B2-audits:**
- `QFSummaryScreen.tsx:38` — `letterSpacing: '3px'` → `'2px'` (ej i spec, nästa pass)
- DIAGNOS F2: emoji-prefix saknas på vissa labels — väntar Opus text-design-pass
- `HalfTimeSummaryScreen` + `RoundSummaryScreen` labels — oklassificerade, ej i Steg 2D scope
- `GameOverScreen:158` (`STARTA NYTT SPEL`) + `ChampionScreen:209` (`Nästa säsong →`) — knappar utan `.btn`-klass, väntar btn-audit
- Sture per-klubb-repliker i `arrivalDialogue.ts` — `TODO(Opus)`, Opus-jobb

**Mock 2-pass (stripes kvarstår — adresseras separat):**
- `SeasonSummaryScreen.tsx` säsongssignatur-citatblock
- `VictoryQuote.tsx`, `ClubMemoryEventRow.tsx`, `ClubMemoryLegendsBlock.tsx`
- `CounterInteraction.tsx`, `FreeKickInteraction.tsx` match-interaktion outcome-box
- `SeasonSignatureSecondary.tsx` calm/scandal-stripe
- `MatchHeader.tsx:61` `atmo.borderAccent` — kräver kontextläsning
- `CommentaryFeed.tsx` 15 stripes — väntar Stålvallen B-redesign

**Scoreboard.tsx:145 `#A89878`** — hårdkodat hex kvarstår (noterat i SPRINT_HEX_TOKENS_AUDIT.md), ej löst.

---

## AKTUELLT LÄGE (2026-05-05)

**Designsystem flyttat in i kodprojektet:** ✅ `design-system/` på rotnivå i bandy-manager. Hela designsystem-projektet från Claude.ai laddats ner och placerats lokalt. Ingång: `design-system/CODE-OPUS-INSTRUCTION.md`. `docs/DESIGN_SYSTEM.md` är nu stub som pekar dit.

**CLAUDE.md uppdaterad** (2026-05-05): LÄS VID SESSIONSTART punkt 3 pekar på `design-system/CODE-OPUS-INSTRUCTION.md`. DESIGN SYSTEM-sektionen omskriven med snabbpekare till alla relevanta filer. Active Documentation rättad.

**Tre direkta Opus-fixar tidigare under sessionen:**
- `EventCardInline.tsx` — reverterat pill-styling till `.btn .btn-primary` / `.btn .btn-outline` rakt av (Code:s commit `b2944c6` påstod sig matcha `.btn-primary` men gjorde det inte; verifierat mot global.css)
- `CoffeeRoomScene.tsx` — CTA-text "Tillbaka till dashboarden" → "Tillbaka till klubben"
- `granskaEventClassifier.ts` — `classifyEventNature` returnerar nu `'reactions'` endast när `event.choices.length === 0`. Rotorsak: REACTION_TYPES innehöll event-typer (supporterEvent/tifo, bandyLetter) som har choices och blev felaktigt auto-resolvade med fejk 'auto' choiceId; eventResolver returnerade game oförändrat när choiceId inte hittades, så side-effects (tifoDone-flagga, brevet-i-arkiv) triggades aldrig. ⚠️ Awaiting browser-playtest. Tester: 18/18 grönt.

**Designsystem-krockar i existerande kod** — identifierade och adresserade samma session.

**Beslut 2026-05-05:** Severity-systemet (`--cold`/`--warm`) är dokumenterat undantag från stripes-förbudet, formaliserat i `design-system/DESIGN-DECISIONS.md`. Mocken `colors-severity.html` visar mönstret. Andra accent-stripes är krockar och flyttas till label-färg.

| # | Komponent | Krock | Status |
|---|-----------|-------|--------|
| K1 | `EventCardInline.tsx` | Vänster border-stripe (`borderLeft: '3px solid ${stripeColor}'`) i `--accent`/`--text-muted` per prio | ✅ Fixad samma session — stripe borttagen, prio-signal i typLabel-färg, card-sharp-mönster (1 px border + 8 px radius). ⚠️ Awaiting browser-playtest. |
| K2 | `EventPrimary.tsx` | Vänster border-stripe (`--danger`) + inline `linear-gradient` på CTA-knapp | ✅ Fixad samma session — stripe borttagen, knapp byter till `className="btn btn-primary"`, danger-signal kvar i label-text + emoji. ⚠️ Awaiting browser-playtest. |
| K3 | `JournalistSecondary.tsx` | Vänster border-stripe i `--cold` / `--warm` | ✅ Konformt — dokumenterat undantag enligt severity-mock. Inga ändringar. |

**Synk-not till Design (Claude.ai):** Ny post i `DESIGN-DECISIONS.md` lokalt. Måste speglas tillbaka till Claude.ai-design-projektet vid tillfälle annars driver kopiorna isär. Texten är kopierbar från den lokala filen.

**Code-jobb innan HANDOFF-implementation börjar** — fullständig krock-skanning kvar:
```bash
# 1. Övriga vänster-border-stripes i komponenter (utanför severity)
grep -rn "borderLeft" src/presentation/ --include="*.tsx" | grep -v node_modules

# 2. Övriga inline linear-gradient utanför .btn-klasser
grep -rn "linear-gradient" src/presentation/ --include="*.tsx" | grep -v node_modules

# 3. "herr Patron"-tilltal eller pergament/sigill-copy
grep -rni "herr patron\|pergament\|sigill" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# 4. Status-tags med emoji (manuell skim av tag-användningar)
grep -rn "tag-fill\|tag-outline\|tag-status" src/presentation/ --include="*.tsx" | grep -v node_modules
```
Lista alla träffar här innan HANDOFF #1 plockas. K1, K2, K3 redan adresserade.

**Implementations-sekvens för HANDOFF-items** (efter krock-skanning):
1. #1 Logotyp `.logo-invert` — first vinst, isolerad
2. #5 Button system uppdaterat — påverkar alla knappar, måste vara baseline
3. #3 Tags utan emoji för status — stor refactor
4. #2 GameHeader 3-kolumns + PhaseIndicator stepper
5. #4 CeremonialCta wrapper
6. #9 ArrivalScene — sist, konsumerar alla primitives. Spec klar i `design-system/briefs/ARRIVAL-SCENE-SPEC.md`.

---

## AKTUELLT LÄGE (2026-05-04, kväll)

**SPEC_SHOTMAP_OMARBETNING:** ✅ LEVERERAD (playtestad 20:46, Jacob bekräftade visuell match mot mock).
- Halvcirkel-paths för målgård (radie 22) + straffområde (radie 75) implementerade
- Grå separator-rect med riktningspilar `↑ VI ANFALLER` / `DE ANFALLER ↓`
- viewBox 0 0 280 230
- Stats: "Hittills (X matcher)", `▼` borttaget, motståndare visar "träffsäkerhet"
- Min symptomfix från eftermiddagen reverterad
- Kvarstående detalj: terminologi inkonsekvent — "konv." för spelaren, "träffsäkerhet" för motståndaren. Liten Fix Z läggs i Fas 2.

**SPEC_GRANSKA_OMARBETNING:** ⏸ FAS 2 PÅBÖRJAS — full implementation från noll. Ursprungs-specen var aldrig integrerad i UI (`granskaEventClassifier.ts` aldrig importerad i produktion, `ReaktionerKort` finns inte ens som fil). Se `docs/SPEC_GRANSKA_VERIFIERING_2026-05-04.md` för fasplan.

**KVAR-audit:** ✅ Levererad i `docs/diagnos/2026-05-04_kvar_audit.md`.
- Identifierat: SPEC_GRANSKA_OMARBETNING + SPEC_SHOTMAP_OMARBETNING markerade ✅ trots EJ LEVERERAD
- Process-fixar A-D föreslagna (status-distinktion, pixel-audit per spec, ⚠️-rader genomgång vid sessionsstart, importerad-i-X-check)
- Status-distinktion (A) införd ovan

**LESSONS #28:** ✅ Skriven — "Levererad spec ≠ fungerar i playtest. Symptomfix utan mock-check kan göra det värre."

**Cup-intro + cup-final-intro scener:** ✅ LEVERERAD (byggt + playtestat 2026-05-04). Implementerat i förskott av SPEC_BESLUTSEKONOMI_STEG_4 Kategori B.

**SPEC_BESLUTSEKONOMI_STEG_4:** ⏸ Spec-klar. Påbörjas EFTER Fas 2 + Fas 3 är levererade och playtestade.

**Bekräftade buggar väntar Fas 2:**
- Dubbel presskonferens (Helena Wikström två gånger i Granska Översikt) — Diagnos C, fix: ta bort `generatePressConference` från `postAdvanceEvents.ts`
- 6 events i Granska Översikt efter första seriematch — fixas via classifier-integration + cap 3
- Knappstil i händelse-kort på Portal — Fix B i specen
- "2 saker till att kolla"-länk går till inbox där spelaren inte kan agera — Fix C
- Förlängning + Straffar overlay-stil (Steg 4-arbete, ej akut)
- Cupfinalförlust egen stil (Steg 4-arbete)
- Kafferum-CTA "Tillbaka till dashboarden" → "Tillbaka till klubben" (Steg 4-arbete)

---

## AKTUELLT LÄGE (2026-05-03)

**SPEC_PLAYTEST_FIXES_2026-05-03:** ✅ Alla 5 åtgärder levererade.
- P5: Frågetecken-border borttagen från GameHeader.tsx.
- P2: shotsHome/Away + onTargetHome/Away inkluderas nu vid hörn- och straffmål.
- P3: seenLabels-Set mot staplade spelar-labels. oppDotScale+oppDotOpacity skalning vid >30 prickar.
- P1.A: MATCH_GOAL_DIFFERENCE_CAP kringgick i alla 4 interaktiva live-match paths. Fix: interactiveCanScore() i MatchLiveScreen.
- P1.C: PROFILE_GOAL_MODS.chaotic 1.55→1.35, wOpen+=10 (var 15). Mål/match ~8.97.
- P1.B: Per-spelare ceiling variant C — hard cap 5 + soft brake ×0.7 via adjustedWeights i getGoalScorer.
- P4: hasCriticalEvent + EventPrimary saknade priority='critical'-filter. transferBidReceived (prio=normal) renderades dubbelt av PortalEventSlot + EventPrimary.
- 🔄 KOD VERIFIERAD (2026-05-05): import-trace bekräftad mot faktisk källkod. P5 border:none rad 164 GameHeader.tsx ✓, P2 shotsHome++ kommenterat "P2" matchCore ~847/1018 ✓, P1.B getGoalScorerWeight exporterad rad 46 matchCore ✓, P1.C chaotic=1.35 rad 121 matchCore ✓, P4 EventPrimary priority-filter rad 16 ✓, P1.A interactiveCanScore rad 511 MatchLiveScreen ✓.
- ⚠️ Awaiting browser-playtest: alla 5 fixes.
- Spec markerad som ✅ LEVERERAD i `SPEC_PLAYTEST_FIXES_2026-05-03.md`. HANDOVER skriven: `HANDOVER_2026-05-03.md`. Lessons #26 + #27 skrivna. DECISIONS 2026-05-03-post om kvot-avvägning. CLAUDE.md ARBETSFÖRDELNING omskriven.

**EventCardInline-texter:** ✅ Pooler levererade i `docs/textgranskning/TEXT_REVIEW_eventcardinline_2026-05-03.md`.
- 3 av 6 typer var faktiskt placeholder: `starPerformance`, `playerPraise`, `captainSpeech`. Pooler skrivna med 5-6 varianter per typ + code-integrations-instruktion.
- 3 redan kurerade och inte rörda: `bandyLetter` (`bandyLetterService.ts`), `supporterEvent` (`supporterEvents.ts`), `communityEvent` (`eventFactories.ts`).
- ⚠️ Awaiting Code-integration i resp. factory-funktion.

**Sprint 28 fas C — skärmdump-audit:** ✅ Levererad i `docs/SCREENSHOT_AUDIT_2026-05-03.md`.
- 10 vyer granskade strukturellt. Fix-prioritering ger ~3h 15 min Code + 4 mocks (vid Sprint 29).
- ⚠️ Live-verifiering med faktiska skärmdumpar markerad som TODO per vy. Tas vid nästa playtest innan Sprint 29 bestäms.

**Portal omg 1 säsong 1 är gles** — ingen bygd-, spelare- eller patron-data hunnit ackumuleras. Specifikt välkomstkort eller sänkt tröskel för secondary-cards behövs. Inte akut.

---

## AKTUELLT LÄGE (2026-05-02)

**SPEC_INLEDNING_FAS_2 — Styrelsemötet som dialog-scen:** ✅ Levererad (merge `053c526`).
- BoardMember/ClubBoard-interfaces på Club. Alla 12 CLUB_TEMPLATES patchade (36 namn, gender, clubhouse). Migration för befintliga saves. BoardMeetingScene med 4 beats. BoardMeetingScreen.tsx + PreSeasonScreen.tsx raderade. 15 tester.
- ⚠️ Awaiting browser-playtest: beat-progression, mörk bakgrund, autoAdvance-timing.

**SPEC_SHOTMAP_OMARBETNING:** ⚠️ FALSK ✅-STATUS — se kvar_audit 2026-05-04. Halvcirkel-paths levererades aldrig, original-rektangulär kod kvar. **Faktiskt levererad 2026-05-04 (kväll), se sektion ovan.**

**SPEC_GRANSKA_OMARBETNING:** ⚠️ FALSK ✅-STATUS — se kvar_audit 2026-05-04. `granskaEventClassifier.ts` finns som fil men aldrig importerad i UI. `ReaktionerKort` finns inte ens som fil. `GranskaOversikt.tsx` är opåverkad av specen. **Implementation från noll i Fas 2 (pågår).**

**SPEC_GRANSKA_SPLIT:** ✅ Levererad. GranskaScreen.tsx (1800+ rader) splittad i 7 filer under `src/presentation/screens/granska/`.

**DESIGN_SYSTEM § 4:** ✅ Uppdaterad av Opus — gamla DashboardScreen-beskrivningen ersatt med Portal-arkitekturen. Bag-of-cards-principen, seasonal tone, alla 9 secondary-cards.

**EventCardInline-texter:** ✅ Integrerad commit `a075d8e` — pooler aktiva för starPerformance, playerPraise, captainSpeech.

**SPEC_BESLUTSEKONOMI Steg 4 (fas-scenes) + Steg 5 (kritiska scenes):** ⏸ Väntar på playtest av Steg 3.

---

## AKTUELLT LÄGE (2026-04-30 kväll)

**SPEC_BESLUTSEKONOMI Steg 1 (diagnos):** ✅ `docs/diagnos/2026-04-30_beslutsekonomi.md`. Tre fynd: `currentMatchday` sätts aldrig, EventOverlay blockerar SceneScreen, ingen total kö-cap (30–80 events/säsong).

**SPEC_BESLUTSEKONOMI Steg 2:** ✅ Levererad (commits `b4e04bd` + `516f89a`).
- A1: `currentMatchday: nextMatchday` lagt till i roundProcessor-spread + migration
- A2/A3: `attentionRouter.ts` med `getCurrentAttention()` koordinerar pendingScreen → pendingScene → pendingEvents → idle
- B1/B2: `eventQueueService.ts` med `getNextEvent()` och `getQueueStats()`
- B3/B4: `MAX_ATMOSPHERIC_PER_ROUND = 2`. Överskjutande `low`-prio events går till inbox (inte kasseras)
- 3228 tester gröna. Build ren.

**SPEC_BESLUTSEKONOMI Steg 3:** ✅ Levererad (commits `2daed82` + `1029feb`). `eventActions.ts`, `EventCardInline.tsx`, `PortalEventSlot.tsx`. Overlay bara för `critical`, allt annat inline i Portal. Placeholder-texter — Opus skriver EventCardInline-strängar nästa session.

**Steg 4 (fas-scenes) + Steg 5 (kritiska scenes):** ⏸ Spec-skissad i `SPEC_BESLUTSEKONOMI.md`. Skrivs när Steg 3 är playtestat.

**Kodgenomgång 2026-04-30:** ✅ Alla 6 fynd fixade (`e480f38`). B1 dubbel sortering, B2 currentMatchday required, B3 spec-dokumentation, B4 globalt kö-cap, B5 resolved events rensas, B6 useEffect-dependency.

**Namnrymds-inkonsekvens:** Spec använder `medium`/`atmospheric` (3 nivåer). Kod använder `critical|high|normal|low` (4 nivåer). Mappning dokumenterad i Steg 2- och Steg 3-specerna. Framtida specer ska använda kodens 4-nivå-typning.

**SPEC_PORTAL_FAS_2_DRAMATURGI steg 1–3:** ✅ Levererad (commits `b7e5a0d` + `03db307`). SituationCard, PortalBeat, rikare secondary-kort. Slutliga Opus-texter inbakade. Tre logikfixar (first_derby, first_win, dead ternary). Plus tidigare uppföljning: verb-fix (`står` → `ligger`), gräsmatta → parkering, season_opener cup-fix (`29b7947`).

**Portal-buggfixar:** ✅ CTA nu i PortalScreen (DashboardScreen renderades aldrig). Auto-skip för bye-lag. Horisontellt streck fixat. Secondary-kort rikare.

**Pixel-audit SituationCard/PortalBeat:** ⚠️ Ingen HTML-mock gjordes inför dessa. Formellt brott mot princip 4. Kräver browser-playtest av Jacob för att godkännas.

**Kapitel C — saknar fortfarande:**
- `rumorFrequencyMultiplier` + `incomingBidMultiplier` ej i rumorService/transferService
- `underdogBoost` (dream_round) ej i matchEngine

---

## AKTUELLT LÄGE (2026-04-28, eftermiddag)

**SPEC_INLEDNING_FAS_1:** ✅ Implementerad. Pixel-audit klar. Citat-pooler är Opus-jobb.
**SPEC_SCENES_FAS_1:** ✅ Implementerad. Pixel-audit klar.
**SPEC_PORTAL_FAS_1:** ✅ Implementerad. Token-isolering verifierad. Pixel-audit klar.
**SPEC_KAFFERUMMET_FAS_1:** ✅ Implementerad. Pixel-audit klar.
**SPEC_JOURNALIST_KAPITEL_A:** ✅ Implementerad (commit `2b41a8f`). Pixel-audit: 3 avvikelser fixade. 27 tester. Effekter: ±10% besöksintäkt, ±1 community.
**SPEC_KLUBBMINNET_KAPITEL_B:** ✅ Implementerad (commit `bad787b`). Minne-flik i ClubScreen, 6 komponenter, 21 tester. Pixel-audit: inga avvikelser.
**SPEC_SAESONGSSIGNATUR_KAPITEL_C:** ✅ Implementerad (commit `53b1fda`). 6 signaturer, reveal-scen, portal-kort, säsongsslut-rubrik, modifierare i weather/scandal/injury. Pixel-audit: inga avvikelser. 15 tester.

**Kapitel C — saknar fortfarande:**
- `rumorFrequencyMultiplier` + `incomingBidMultiplier` ej i rumorService/transferService
- `underdogBoost` (dream_round) ej i matchEngine

**Playtest:** Ingen av de levererade specarna är playtestad (prio 1 nästa session).

**Pixel-audit-rapporter:** `docs/sprints/SPEC_PORTAL_FAS_1_PIXEL_AUDIT.md`, `SPRINT_JOURNALIST_KAPITEL_A_AUDIT.md`, `SPRINT_SAESONGSSIGNATUR_KAPITEL_C_AUDIT.md`

---

## AKTUELLT LÄGE (2026-04-27, natt)

**Sprint 25-L:** ✅ Levererad + auditerad (commit `a6e24b4`).
**Sprint 25-E:** ✅ Levererad + auditerad (commit `4362ebf`).
**Sprint 25f/g — domare + matchskador:** ✅ Levererad (commit `dabc68a`). Ej playtestad.
**Sprint 26 — cross-system skandalreferenser:** ✅ Levererad + kod-verifierad audit (commits `11802e1` + `6bbf8ca`).
**Sprint 27 — narrativ djup-paket:** ✅ Levererad. Fas D (legend-roller + kafferum-pooler) commit `be33b3b`, text-pass commit `a814314`, fas E (karriärs-tidslinje) ingår i `be33b3b`.
**Sprint 28 — narrativ djup-paket 2:** ✅ Levererad. Fas A+B kod-verifierade (commits `701044a`, `abee31c`). Fas C (skärmdump-audit) levererad 2026-05-03 i `SCREENSHOT_AUDIT_2026-05-03.md` — 10 vyer granskade, fix-lista för ev. Sprint 29.
**SPEC_MATCHDAGAR Fas 1–3:** ✅ Levererad. Fas 4 blockeras på Eriks SMHI-skript.
**Specialdatum V2:** ✅ Levererad (commits `da686d9`, `8dfac75`). Arena-konstanter, lore-pooler, specialDateService.

**Motor v1.1.4:** awayWinPct ✅, cornerGoalPct ✅, playoff_final ✅, homeWinPct ✅, minutfördelning ✅. **drawPct 16.9% vs 11.6% — accepterad strukturell begränsning (Poisson-symmetri).** comeback −1 halvlek 20.1% vs 24.5% — under tolerans, ej adresserat.

**THE_BOMB-status:** verifierad mot kod 2026-04-26. Faktisk siffra 65-75% klar (inte 40-50% som strukturanalysen 2026-04-25 antydde). Se `docs/THE_BOMB_STATUS_2026-04-26.md` för detaljerad genomgång per subprojekt. **Uppdatering 2026-04-26 efter Sprint 27 audit:** 3.1 State of the Club bevisat klar, 2.2 Årets match bevisat klar (med dead code att städa).

**Tre nya designprinciper** införda i CLAUDE.md 2026-04-26 — se DECISIONS.md för motivering. **Sprint 27 fas A+B var första gillt-tillfället för princip 2 (pre-spec cross-check)** — räddade ~2-3h dubbelarbete genom att verifiera State of the Club innan Code byggde det.

---

## TEKNISK SKULD — DOKUMENTERAD (från genomgång 2026-05-02)

Se `docs/SPEC_TEKNISK_SKULD.md` för fullständig spec per åtgärd.

### TS-4: Dead code verifiering

**Filer:**
- `src/presentation/screens/DashboardScreen.tsx` (64 KB) — bekräftat dead, ej i AppRouter
- `src/presentation/screens/NewGameScreen.tsx` (12 KB) — misstänkt dead, bara `/new-game-legacy`-route
- `src/presentation/screens/MatchResultScreen.tsx` (13 KB) — verifiera om någon navigerar dit
- `src/presentation/screens/RoundSummaryScreen.tsx` (23 KB) — verifiera om någon navigerar dit

**Prioritet:** Hög (snabb vinst, 80-150 KB borttagning). **Estimat:** 4-6h.

---

### TS-5: services/ är flat folder med 108 filer

**Problem:** Navigerings-friktion. Sub-mappar finns bara för `events/` och `portal/`.

**Prioritet:** Låg (rent estetiskt). **Estimat:** 4-6h.

---

### TS-6: seasonEndProcessor.ts är 57 KB monolit

**Problem:** roundProcessor är split via 17 sub-processors. seasonEndProcessor är inte.

**Prioritet:** Medel. **Trigger:** Bug eller feature-tillägg som rör säsongsslut. **Estimat:** 1-2 dagar.

---

### TS-7: Misstänkta service-överlapp

**Kluster:** press (5 filer, 77 KB), training (3), narrative (3), opponent (2), mecenat (2), supporter (2), scout (2).

**Prioritet:** Låg (opportunistiskt per kluster). **Estimat:** 1-2h analys + 2-4h refactor per kluster.

---

### TS-8: SaveGame-typen växer okontrollerat

**Problem:** 14 KB, växer för varje sprint. Migration-logik mer komplex.

**Prioritet:** Låg. **Trigger:** SaveGame korsar 20 KB eller migration-buggar. **Estimat:** 2 dagar.

---

### TS-9: MatchLiveScreen 51 KB + matchCore 89 KB

**Status:** Delvis ✅ (2026-05-04). MatchLiveScreen splittad i `match/`-katalog med handler-filer och hooks. matchCore 89 KB kvarstår (TS-9b). **Trigger för TS-9b:** Om matchCore börjar växa ytterligare.

---

### TS-10 — Live-match steg-progression ✅ LÖST 2026-05-04

**Löst:** handler-timeouts borttagna (Refactor B), matchReducer som EN sanning för score/playerGoals, recovery-vakt borttagen. Se `docs/diagnos/2026-05-04_player_goal_cap_bypass.md`.

---

### TS-1 till TS-3: (Äldre skulder)

**`pickSeasonHighlight()` — LÖST (2026-04-27).** Borttagen i commit `85170f7`.

---

## FIX-NUMRERING — notering

Fix-nummer (#1–29, växer) är separat räknare för enskilda buggfixar. **Förväxla inte med Sprint-nummer** (25b.1, 26 etc.). När någon säger "fix 26" menas raden i denna tabell — inte Sprint 26 (ekonomibalans).

---

## BANDY-BRAIN — STATUS (2026-04-25)

Sajt live: `https://jacobstjarne-code.github.io/bandy-manager/`

| Del | Status |
|-----|--------|
| Pass 1–3 (schema, 59 facts, validator) | ✅ Klart |
| Pass 4 — Astro-sajt + GitHub Pages | ✅ Klart |
| Finding 001–004 | ✅ Klart |
| CLAUDE.md → fact-referenser | ⏸ Parkerat (låg prio) |
| `noindex` borttagen | ⏸ Väntar på Eriks bekräftelse |
| Findings-generator | ⏸ Parkerat per UI_SPRINT_INSTRUCTION |

Nästa: skicka URL till Erik. Finding 005 (utvisningar, S011) är nästa naturliga ämne.

---

## KLART IDAG (2026-04-27, session 3 — natt)

| Leverans | Commits | Detalj |
|---------|---------|--------|
| Specialdatum V2 | `da686d9` | specialDateService.ts, arena-konstanter, lore-pooler, arenaName/venueCity på Fixture |
| 3×30 dead code + test | `8dfac75` | matchFormat satt i sdCtx.weather, regressiontest |
| Motor v1.1.2 playoff_final | `99a1dcd` | isFinal-flag, +28 defensive weight. 8.45→6.86 mål/match |
| Motor v1.1.3 homeWinPct | `abd9c38` | baseAdv 0.14→0.19. homeWinPct 44.5→47.8% |
| Motor v1.1.4 minutfördelning | `d402754` | GOAL_TIMING_BY_PERIOD[0] ↑, [6] ↓. 0-10: 7.0→9.4%, 60-70: 13.4→11.1% |
| Revert chasing-mode | `c91e3d0` | drawPct-fix hade noll effekt, skadade comeback-rate |

## KLART IDAG (2026-04-27, session 2 — kväll)

| Leverans | Commits | Detalj |
|---------|---------|--------|
| SPEC_MATCHDAGAR Fas 1 — RNG-schema | `9b47927` | ROUND_WINDOWS, pickRoundDate(), buildSeasonCalendar(), MatchdaySlot med weekday/tipoffHour/specialflaggor. Aldrig mån/tors. |
| SPEC_MATCHDAGAR Fas 2 — cup försäsong | `fa543d9` | Cup matchday 1–4 (aug–okt), liga matchday 5–26. getCupRoundDate(). CUP_MATCHDAYS={1:1,2:2,3:3,4:4}. 6 tester uppdaterade. |
| SPEC_MATCHDAGAR Fas 3 — specialdatum-events | `85170f7` `755502f` | isFinaldag på Fixture, isAnnandagen-bug fixad, daily briefing + dag-före inbox + match-commentary för annandagen/nyårsbandy/finaldag/cup-finalhelgen. Opus-strängar via specialDateStrings.ts. |
| Sprint 25f/g — domare + matchskador | `dabc68a` | refereeService (8 domare), matchInjuryService (6 arketyper), GranskaScreen domare-möte, MatchLiveScreen domarnamn. |
| Teknisk skuld — pickSeasonHighlight | `85170f7` | Dead code borttaget (exports: 0 imports). |

## KLART IDAG (2026-04-27, session 1 — förmiddag)

| Leverans | Commits | Detalj |
|---------|---------|--------|
| Sprint 28-A — pension-impact morale + kapten-vakuum | `701044a` | For-loop över retiredPlayerIds, shared seasons-beräkning, morale-hit kapten/legend, 3-variant inbox-narrativ, captainPlayerId → undefined |
| Sprint 28-B — legend match-commentary + aktiv legend-flagga | `abee31c` | updateActiveLegendFlags(), 22 nya commentary-strängar (4 pooler), pickLegendCommentary(), assisterPlayerId-spårning, 70% override-check i mål/assist/räddning |
| Taktisk audit — read-only rapport | — | Mekanisk vs parametrisk klassificering av alla taktiska dimensioner. 5 variationer motorn inte kan särskilja. |

---

## KLART IDAG (2026-04-26)

| Leverans | Commits | Detalj |
|---------|---------|--------|
| Sprint 25-L — KVF/SF goalMod-kalibrering | `a6e24b4` | Verifiering + audit |
| Sprint 25-E — Powerplay-effektivitet | `4362ebf` | Comeback-mekanik: riktig powerplay-fördel |
| Sprint 26 — Cross-system skandalreferenser | `11802e1` | 8 filer: kafferum (42 utbyten), klack (8 strängar), press (7 frågor), motståndarcoach (8 quotes) |
| Sprint 26 Audit — kod-verifierad simulation | `6bbf8ca` | Seed-baserad körning, alla 4 delsystem, edge cases |

---

## KLART IDAG (2026-04-25)

| Leverans | Commits | Detalj |
|---------|---------|--------|
| Sprint TS-1 (roundProcessor refactor) | `122fd42` `96fa060` `be55ea3` | Tre pass: preRoundContext, processor-flytt, skipSideEffects-option |
| Sprint 25h Pass 1 — Lager 1 (Bandyskandaler) | `9d82e28` | 6→8 arketyper, scandalService, processScandals, 18 tester |
| Sprint 25h Pass 2 — Lager 2 (Egna beslut) | `5671cf1` | 2A löneöverskridande, 2B skum sponsor, 2C mecenat-utträde |
| Sprint 25h Pass 3 — Lager 3 (Licensnämnden) | `3a591ab` | licenseService, status-maskin, seasonEndProcessor-integration, 13 tester |
| Sprint 25h Addendum — revision 2 + small_absurdity | `c1297a5` | municipal_scandal (hanterar managed club), rev2-text, 8:e arketyp |
| Sprint 25h Text-integration — kurerad text | `1062093` | 30 strängar: licenseService, eventProcessor (2A/2B/2C), roundProcessor |
| Sprint 25-HT — halvtidsledning-analys | `aec3be0` | Bombfynd: motor 80.4% vs target 78.1% (+2.3pp) — väl inom tolerans |
| Kalibreringstarget-revision — htLeadWinPct rättat | `089e698` | 46.6 → 78.1 i JSON, nytt fält homeHtLeadFraction: 46.6 |
| Sprint 25g — Matchens karaktärer (verifierad) | — | Förimplementerad: refereeService (144r), matchInjuryService (189r), refereeData (8 domare), GranskaScreen + MatchLiveScreen integration |
| Sprint 26b — Arena-underhåll + weeklyBase | `99ec953` | Underhåll ×8→×5, weeklyBase 2000→3000. Söderfors −394k, Målilla −654k (inom spec-mål) |
| Sprint 25h Opus-direkt-edits | — | sponsor_collapse −3k/v, generateAbsurdityArticles, riskySponsorTriggered-state, calibration JSON |
| Sprint 25h A1 — WageOverrunWarning | — | `<WageOverrunWarning>` 3 varianter, intercepterar handleRenew + handleBid i TransfersScreen |
| Sprint 25h A2-A4 — Dashboard-indikatorer | — | Licensnämnden-banner, skum sponsor-rad i ekonomikort, mecenat happiness-sektion |

---

## KLART IDAG (2026-04-24)

| # | Fix | Rotorsak / Leverans | Fil(er) |
|---|-----|---------------------|---------|
| 29 | Journalistrubriker — "igen"/"ny" oavsett historik | `generatePostMatchHeadline` fick inte form-data; nu beräknas `prevLoss` i mediaProcessor och skickas in | `journalistService.ts`, `mediaProcessor.ts` |
| 28 | Vädertext "kamp om viljan" | Felaktig fras i matchMoodService | `matchMoodService.ts` |
| 27 | Hattrick-duplikat i spelarkort | `careerMilestones` + `narrativeLog` visade båda hattrick i timeline | `PlayerCard.tsx` |

---

## KLART IDAG (2026-04-23)

| # | Fix | Rotorsak / Leverans | Fil(er) |
|---|-----|---------------------|---------|
| 21 | BottomNav saknas på /game/match/live | Cursor tog bort isOnMatchLive-lås, ersatte med HIDDEN_PATHS → nav osynlig istf dimmad | `BottomNav.tsx` |
| 22 | BottomNav saknas på /game/review | GranskaScreen låg under GameGuard (ingen BottomNav) istf GameShell | `AppRouter.tsx` |
| 23 | Dubblad 🎤 PRESSKONFERENS-rubrik i Granska | SectionLabel + pc.title renderades båda → visuell dubblering | `GranskaScreen.tsx` |
| 24 | Skottbild redesign — två isolerade straffzoner | Mittlinje + ellips förvirrande (plan ej i skala); bågarna gick åt fel håll | `GranskaScreen.tsx` |
| 25 | Skottstatistik — konvertering >100%, bollinnehav 50/50, motståndares skott-på-mål | `onTargetHome/Away` uppdateras aldrig av hörnmål; bollinnehav hårdkodat; `oppSavedCount` uppskattad | `GranskaScreen.tsx`, `MatchLiveScreen.tsx` |
| 26 | Bortaresa-kort — "mattstöd" + "samma kväll" | Stavfel + dagsform-fel | `DashboardScreen.tsx` |

---

## KLART IDAG (2026-04-22 — session 4)

| # | Fix | Rotorsak / Leverans | Fil(er) |
|---|-----|---------------------|---------|
| 11 | Sprint 26 — Ekonomi & Puls-balansering | 5 motkrafter implementerade, stresstest kört, mätrapport skapad | `economyService.ts`, `communityProcessor.ts`, `roundProcessor.ts`, `economyProcessor.ts`, ekonomiService.test.ts |
| 12 | Ny analyze-stress sektioner H/I/J | Kapital per seed/säsong, puls-bucket-fördelning, Pearson-korrelationer | `scripts/analyze-stress.ts`, `scripts/stress/stats.ts` |
| 13 | HANDOFF-BATCH-1 A1 — GameHeader redesign | 3-kolumn grid, SVG-kuvert, Logo-komponent | `GameHeader.tsx`, `Logo.tsx` |
| 14 | HANDOFF-BATCH-1 A2 — PhaseIndicator tre states | done/current/upcoming med checkmark, halo, connector-vikt | `PhaseIndicator.tsx` |
| 15 | HANDOFF-BATCH-1 B2 — BottomNav TODO-markeringar | 6 × `TODO(FAS 1)` ovan tab-ikoner | `BottomNav.tsx` |
| 16 | HANDOFF-BATCH-1 B3 — ClubBadge TODO-markering | `TODO(FAS 4)` ovan renderSymbol | `ClubBadge.tsx` |
| 17 | HANDOFF-BATCH-1 B4 — Porträtt TODO-markeringar | 6 × `TODO(FAS 5)` på alla call-sites | `LockerRoomMap.tsx`, `LockerRoomCard.tsx`, `PlayerCard.tsx`, `SquadScreen.tsx`, `GranskaScreen.tsx` |
| 18 | HANDOFF-BATCH-1 B1 — Emoji-sektionsrubriker TODO | 16 × `TODO(FAS 1)` i 7 skärmfiler | `RoundSummaryScreen`, `DashboardScreen`, `BoardMeetingScreen`, `HalfTimeSummaryScreen`, `InboxScreen`, `GranskaScreen`, `PressConferenceScene` |
| 19 | Cursor: centralisera save-logik (persistGameSnapshot, renewContract/signFreeAgent/listPlayerForSale till store) | Business logic i screen, direkt saveSaveGame i komponenter | `gameStore.ts`, `gameFlowActions.ts`, `transferActions.ts`, `TransfersScreen.tsx`, `GameHeader.tsx` |
| 20 | Uppstädning: eliminera getState()-anrop i screens | `startFacilityProject` och `dismissHint` hämtades via getState istf hook | `ClubScreen.tsx`, `MatchLiveScreen.tsx` |

## KLART IDAG (2026-04-22, kväll — session 3)

| # | Fix | Rotorsak | Fil(er) |
|---|-----|----------|---------|
| 1 | HalftimeModal CTA döld på Byten-fliken | Single-scroll-flöde, CTA trycktes under viewport | `HalftimeModal.tsx` |
| 2 | GranskaScreen Spelare-flik scrollar inte | `GameGuard` hade `overflowY: auto` → `height: 100%` i child löste till contenthöjd | `GameShell.tsx` |
| 3 | Dashboard-gap CTA→nav | `paddingBottom: 120px` + GameShell 60px = 180px tomrum | `DashboardScreen.tsx`, `DiamondDivider.tsx` |
| 4 | NewGameScreen välj-klubb-layout | Spec — rubrik, text, CTA-tightning | `NewGameScreen.tsx` |
| 5 | Kapten-händelse trots att kapten valts | `characterPlayerService` kollade inte `game.captainPlayerId` | `characterPlayerService.ts`, `communityEvents.ts` |
| 6 | Shotmap — motståndarmål för långt ned, saknar straffbåge | `GOAL_Y=20` asymmetriskt; ingen `<path>`-arc | `GranskaScreen.tsx` |
| 7 | "bryter igenom" → "slår igenom" | Svengelska-fras i tre filer | `CounterInteraction.tsx`, `matchCommentary.ts`, `youthProcessor.ts` |
| 8 | "brittningen" + "Dominerar sitt område" | Stavfel/felaktig fras | `matchCommentary.ts` |
| 9 | Död MatchEventType-kod (YellowCard, Shot, Injury, Suspension, FullTime) | Ärvd fotbollskod, aldrig emitterad av matchCore — rensat ur 10 filer | `enums/index.ts`, `statsProcessor.ts`, `roundProcessor.ts`, `seasonSummaryService.ts`, `CommentaryFeed.tsx`, `MatchDoneOverlay.tsx`, `MatchReportView.tsx`, `MatchLiveScreen.tsx`, `formatters.ts`, `matchRatings.ts` |
| 10 | Bug: MatchDoneOverlay räknade utvisningar som 0 | Använde `MatchEventType.Suspension` (aldrig emitterat) istf `MatchEventType.RedCard` | `MatchDoneOverlay.tsx` |

**Ny lärdom i LESSONS §2:** `overflowY: auto` på en wrapper + `height: 100%` i child bryter child-höjdsberäkningen. Wrapper som ska klippa ska ha `overflow: hidden`, inte `overflowY: auto`.

---

## KLART TIDIGARE

### Sprint 22-serien (stress-test + playtest-runda 1 + 2)

| # | Vad | Status |
|---|-----|--------|
| 22.5 | CTA-konsolidering (.btn-cta) + BottomNav HIDDEN_PATHS | ✅ (med regression — fixad i 22.11) |
| 22.6 | BUG-STRESS-01 archetype enum as-cast | ✅ |
| 22.7 | BUG-STRESS-02 squad depletion (2 rotorsaker) | ✅ |
| 22.8 | BUG-STRESS-03 AI positionCoverage | ✅ |
| 22.9 | BUG-STRESS-05 finance/konkurs-trösklar | ✅ |
| 22.10 | BUG-STRESS-04 cupBracket weather-skip | ✅ |
| 22.11 | CTA-färg + Hörnor + POTM-text | ✅ |
| 22.12 | Rögle stale på dashboard | ✅ |
| 22.13 | Kemi-vy palette-drift | ✅ |
| 22.14 Del A | FormationView + NotesView palette-drift | ✅ |
| 22.15.1 | Dashboard tomrum innan CTA (omg 1) | ✅ Opus direkt |
| 22.15.2 | BottomNav dold under `/game/match` | ✅ Opus direkt |
| 22.15.3 | Events-placering i GranskaScreen | ✅ Code |
| 22.15.4 | Commentary bold-diagnos + fix | ✅ Code |
| 22.15.5 | Anglicism "bryter igenom" → "slår igenom" | ✅ Opus direkt |
| 22.15.6 | Shotmap vit plan + hemma/borta-labels | ✅ Opus direkt |
| 23 | Taktiktavlan del B (coach-rek + tags/quote + översikt + kemi-expand) | ✅ Code |

Stress-test: baseline 41% → 100/100 på 10×10 seeds.

**Processdokument uppdaterade idag:**
- LESSONS.md §10 (as-cast till enum bypassar TypeScript), §14 (asymmetriska state-transitions liga vs cup).
- DECISIONS.md etablerad som ADR-alternativ med 8+ poster.
- CLAUDE.md utökad med LÖPANDE KVALITET-§.
- TEXT_REVIEW_formations_2026-04-20.md kurerad (FORMATION_META + kemi-expand-branches).

---

## SPEC KLAR — REDO ATT IMPLEMENTERAS

### Sprint 23 — Taktiktavlan Del B (UX-omarbetning)

**Status:** LEVERERAD 2026-04-20 av Code.

**Leveransomfattning:**
- B1c `getRecommendedFormation` + grön outline + ★ COACH-badge
- B2c FORMATION_META (anatomy-tags + coach-quotes från TEXT_REVIEW)
- B3c Taktik-översikt överst med klickbar "ändras i lineup"
- B4b Interaktiv kemi med 6 branches (3 aktiva, 3 tysta)
- Inbox-notis vid rekommendationsändring mellan omgångar

**Parkerat från Sprint 23:** Frysning av rekommendation vid `lineupConfirmedThisRound`. Krävde TacticBoardCard-ändring som specen förbjöd. Ej praktiskt problem — truppen förändras inte mid-round.

### Sprint 22.14 Del A — Taktiktavlan palette-drift

**Status:** LEVERERAD i tidigare commit.

### Sprint 24 — Kalibrerings-infrastruktur

**Status:** LEVERERAD 2026-04-20 av Code. 3 commits.

**Leverans:**
- `calibrate.ts` + `calibrate_v2.ts` kompilerar och kör (enum-drift fixad)
- `npm run stress` skriver `stress/season_stats.json` (7179 matcher)
- `npm run analyze-stress` genererar full jämförelserapport mot bandygrytan
- Första mätrapporten sparad

**Första mätrapportens fem gap:**
1. `htLeadWinPct` 87.4% vs 46.6% — halvtidsledare vinner för ofta
2. `drawPct` 7.1% vs 11.6% / `awayWinPct` 45.3% vs 38.3%
3. `avgSuspensionsPerMatch` 0.45 vs 3.77 — motorn triggar utvisning för sällan
4. `cornerGoalPct` 26.0% vs 22.2%
5. `penaltyGoalPct` 0.3% vs 5.4%

### Sprint 25a — Comeback-dynamik (del 1)

**Status:** LEVERERAD 2026-04-20 av Code. 3 commits. Mer-rapport:
- `htLeadWinPct` 87.4% → 86.5% (−0.9pp)
- Comeback −1: 15.2% → 16.5% (+1.3pp)
- Comeback −2: 5.6% → 7.7% (+2.1pp)
- `goalsPerMatch` 10.10 → 10.26 (stabilt)

**Kritisk upptäckt:** `secondHalfGoalMod`/`secondHalfFoulMod` kör bara när `managedIsHome !== undefined`. Stress-testet är headless → bara `trailingBoost` (ändring 2) mättes. Ändring 1 och 3 var död kod i mätningen.

### Sprint 25a.2 — Per-lag mode, bryt ut managed-grinden

**Status:** LEVERERAD 2026-04-20 av Code. 3 commits.

**Resultat (jämfört med 25a):**
- `htLeadWinPct` 86.5% → 83.8% (−2.7pp)
- `drawPct` 7.0% → 8.4% (+1.4pp)
- `awayWinPct` 45.8% → 44.2% (−1.6pp)
- Comeback −1: 16.5% → 18.2% (+1.7pp)
- Comeback −2: 7.7% → 9.6% (+1.9pp)
- `goalsPerMatch` 10.26 → 10.13 (stabilt)

**Slutsats:** Per-lag-mode aktiverades korrekt. Mätinfrastrukturen är nu ärlig. Men strukturellt gap på 37pp återstår i htLeadWinPct — mer parameterjustering räcker inte. Sprint 25b+ behöver ta itu med utvisningsfrekvensen.

**Kvar enligt Code:** `avgSuspensionsPerMatch` 0.45 → 0.47 — foulMod 1.20x påverkar marginellt. Basfrekvensen är problémet, inte multiplikatorn.

### Sprint 24.2 — Scoreline-data med fas-dimension

**Status:** LEVERERAD 2026-04-21 av Code. 3 commits. Rapport:

**Hypoteser testade:**
- Erik (vinstprocent-bias): **bekräftad**. Utvisningar per minut: ledning 1.04x, jämnt 0.91x, underläge 1.04x. Nästan jämnt fördelat.
- Christoffer (minut-60-brytpunkt): **ej bekräftad**. Gradvis eskalering 12 → 27/kmin utan skarp brytpunkt. Trötthet, inte domarbeteende.
- Jacob (slutspels-hemmafördel): **bekräftad**. KVF Spel 1 (högre rankat hemma): 68%. Spel 2 (lägre rankat hemma): 33%. Ranking dominerar. `homeAdvDelta` behöver inte ökas.

**Nyckelgap för 25b/c/d:**
- Utvisningar: motor 2.5/kmin vs bandygrytan 22.5/kmin (9x gap, basfrekvens-problem)
- Straff: motor 0.14/kmin vs bandygrytan 2.7/kmin (19x gap, kräver separat trigger)
- Straff-peak: minut 75-89 (1.35x baseline)

Referensfil: `docs/data/SCORELINE_REFERENCE.md`

---

## TEKNISK SKULD — PARKERAT (kräver spec innan implementation)

### TS-2: Tester saknas för store actions (gameFlowActions, transferActions)

**Filer:** `src/presentation/store/actions/gameFlowActions.ts`, `transferActions.ts`, `matchActions.ts`
**Problem:** Domäntesterna är bra, men store/actions-slices saknar tester. Regressionsrisk sitter här — `advance()`, `renewContract()`, `resolveEvent()` etc. är komplexa orkestreringsfunktioner som är svåra att felsöka utan testtäckning.
**Önskad lösning:** Enhetstester per action-slice som mockar domain-services och verifierar store-state-transformationer.
**Prioritet:** Medel. Gör som ett dedikerat test-sprint.
**Estimat:** En dag.

---

### TS-3: Dubbla migreringsläger

**Filer:** `src/infrastructure/persistence/saveGameMigration.ts`, `src/presentation/store/gameStore.ts`
**Problem:** Migration sker på två ställen — i infra-lagret och vid `loadGame` i store. Risk för divergerande beteende om något ändras i ett av lagren.
**Önskad lösning:** All migration i ett lager (infra). Store kallar bara `migrateGame()` utan att veta om logiken.
**Prioritet:** Låg tills migration-filen växer eller en divergens-bugg uppstår.

---

## AKTIVA JOBB — HOS CODE NU

*(Inga aktiva jobb just nu — Sprint 25g verifierad som levererad, Sprint 25h stängd.)*

---

## SENAST LEVERERAT

### Sprint 26 — Cross-system skandalreferenser (LEVERERAT 2026-04-26)

8 filer modifierade. Skandalers cross-system-integration levererad enligt Integration-completeness-check-principen. Audit: kod-verifierad simulation (seed-baserad, 200+ seeds per delsystem). Edge cases verifierade: `small_absurdity` triggar inte, tom scandalHistory inga undefined-fel, gammal säsong filtreras, `{KLUBB}` aldrig exponerat.

### Sprint 25b.2.2 + 25d.2 — mini-edits (LEVERERAT 2026-04-21)

**Ändringar gjorda av Opus direkt:**
- `matchCore.ts`: `foulThreshold` 1.25 → 1.46
- `matchUtils.ts`: KVF `homeAdvDelta` 0.03 → 0.06

**Mätutfall:**
- `avgSuspensionsPerMatch` 3.23 → **3.75** ✅ (target 3.77, gap -0.02)
- Grundserie `homeWin%` 45.9% → 46.9% (marginell, -3.3pp kvar)
- KVF `homeWin%` 50.8% → **53.4%** 🔶 (target 60.3%, gap -6.9pp kvar)
- KVF `goalsPerMatch` 9.06 → 9.01 ✅ (target 8.81)
- `htLeadWinPct` 82.8% → 83.2% (stabilt, ej adresserat)
- `cornerGoalPct` ❌ alla faser (strukturellt, hör till 25e)

**Slutsats:** Utvisnings-kalibreringen är klar. KVF hemmafördel fortfarande för låg men `homeAdvDelta` är inte rätt knapp för att sluta gapet — basmotorns hemmafördel är svag överallt (grundserie -3.3pp, KVF -6.9pp). Båda flyttas till Sprint 25e.

**Beslut:** Ingen ytterligare homeAdvDelta-justering. Playtest nu.

---

### Sprint 25b.2 — Höj utvisnings-basfrekvens

**Status:** LEVERERAD 2026-04-21 av Code. 3 commits (inkl. test-uppgradering).

**Ändringar:**
- `wFoul` 12 → 24
- `foulThreshold`-multiplikator 0.55 → 1.25
- Test `seasonSimulation.test.ts` tröskel: `< 2.0` → `< 6.0` (gamla värdet predaterade kalibreringssyftet)

**Resultat:**
- `avgSuspensionsPerMatch` 0.82 → **3.23** (target 3.77, 0.07 under nedre spec-gräns 3.3 — inom slumpvariation)
- `goalsPerMatch` 10.02 → **9.55** ✅ (närmre target 9.12)
- `penaltyGoalPct` 3.7% → 3.4% (stabilt, straff separat trigger)
- `htLeadWinPct` 83.2% → **82.8%** (marginell förbättring — oväntat lite rörelse)
- Comeback −1 18.2% → 18.0% (oförändrat)

**Beslut:** Hoppa över 25b.2.2. 3.23 är brus-nära 3.3 och 25d är billigare nästa steg.

**Observation:** 4x fler utvisningar gav bara 0.4pp sänkning av htLeadWinPct. Powerplay i motorn ger inte tillräcklig fördel för underliggande lag. Misstänkt: `homePenaltyFactor`/`awayPenaltyFactor` = 0.75 är för mild. Hanteras ej i 25d — se Sprint 25e nedan.

---

### Sprint 25b.1 — Separera straff till egen trigger

**Status:** LEVERERAD 2026-04-21 av Code. 3 commits.

**Vad som gjordes:**
- Tog bort `isPenalty` ur foul-sekvensen — alla fouls → utvisningar
- Extraherade `resolvePenaltyTrigger` som nestlad funktion
- Lade till `getPenaltyPeriodMod` / `getScorelinePenaltyMod` (kalibrerade mot bandygrytan)
- Standalone penalty-trigger i attack-blocket (base 0.13, `chanceQuality > 0.40`)
- `isPenaltyGoal?: boolean` i MatchEvent-interface

**Resultat:**
- `penaltyGoalPct` 0.25% → 3.7% ✅ (target 5.4%, acceptabelt intervall 3-7%)
- `goalsPerMatch` 10.02 (stabilt)
- `avgSuspensionsPerMatch` 0.47 → 0.82 (något lägre lyft än väntat ~1.4, hanteras i 25b.2)

**Två buggar hittade under vägen** (loggade som LESSONS §19 och §20):
1. `continue` i matchCore-generatorn hoppade över `yield` → penalty-events nådde aldrig `fix.events`. Fixades med `penaltyFiredThisStep`-flagga.
2. `stats.ts` byggde på Penalty-event-lookup, men `roundProcessor` strippar Penalty-events för minnes-optimering → `penaltyMinutes` alltid tom. Fixades till `ev.isPenaltyGoal ?? false`.

**Öppen fråga för framtida arbete:** Vilka exakta event-typer strippar roundProcessor? Kommentar eller dokumentationsfil behövs.

---

## VILANDE — SPEC:AS HÄRNÄST

### Sprint 25d — Fas-konstanter vs slutspelsdata

Nästa sprint. Verifiera att `PHASE_CONSTANTS` (`goalMod`, `suspMod`, `homeAdvDelta`, `cornerTrailingMod`, `cornerLeadingMod`) matchar ANALYS_SLUTSPEL.md:
- Målsnitt 9.12 → 8.81 → 8.39 → 7.00
- Hörnmål 22.2% → 20.0% → 18.8% → 16.7%
- Hemmafördel starkare i KVF/SF, neutral i final
- Comeback brutalt i KVF (0% från −2), öppet i SF (25% från −2)
- Utvisningar stiger i final (4.08 vs 3.77)

Mest analys-arbete, begränsad kodändring. Ger bekräftelse på om fas-uppdelningen är rimlig innan vi tar nästa stora motor-beslut.

### Sprint 25e — Powerplay-effektivitet (observation från 25b.2)

Observation: 4x fler utvisningar gav bara 0.4pp lägre `htLeadWinPct`. Antyder att motorns straff-på initiativet är för milt. Bandygrytan visar powerplay är ett av de starkaste comeback-verktygen — motorn omsätter det inte.

Möjliga justeringar att utreda:
- `homePenaltyFactor` / `awayPenaltyFactor` 0.75 → 0.55-0.65
- `trailingBoost` 0.11 per måls underläge → högre
- Explicit powerplay-chansboost (mer än bara initiativ-förskjutning)

Tas efter 25d. Kan vara en av flera strukturella ändringar för att sluta htLeadWinPct-gapet.

### Sprint 25f (kandidat) — Domarsystem med personligheter

Identifierat efter playtest-session 2026-04-21. Bandygrytans matchvy ger domare samma visuella plats som tränare — bandy är unikt genom att även assisterande domare är namngivna. Stor del av bandyns kultur som nu saknas i spelet.

**Scope V1 (efter 25e):**
- 6-8 namngivna huvuddomare med personlighet + kvirk (text kureras av Opus)
- "Domarmöte" som alternativ post-match-scen ~20-30% av matcherna
- Relations-tracking per domare (reaktion efter match → effekt på nästa möte)
- Kafferum- och inbox-integration
- refereeService.ts med vägd selektion (mindre chans för samma domare igen)

**Scope V2 (framtiden):**
- Assisterande domare som duor
- Domarnas omdömen av spelare
- "Domär har dålig match"-event

**Estimat:** V1 = 4-6 timmars implementation + kurerad text. Relations-mekaniken är liknande journalist-persona och patron-relation som redan finns.

### Sprint 25g (kandidat) — Matchskador

Identifierat efter playtest-session 2026-04-22. Vi har redan träningsskador via `injuryService.ts`. Matchmotorn har `MatchEventType.Injury` i enum men använder det inte. Matchskador är en del av bandyns karaktär och en sidoeffekt av realistiska matcher — saknas nu.

**Bakgrund:** Första studien på bandyskador sedan tidigt 2000-tal pågår nu (Sandberg/Rosell, LiU, publicerad april 2026 i Bandypuls). Lite forskning att luta sig mot. Baserat på IFK Nässjös egen skadeguide och analogi med närliggande idrotter: allvarliga matchskador 1-3 per lag per säsong, medellånga 4-8, lätta 10-15. Jacobs Stefan Krigh-referens (hälsenan, Tellus-Hammarby derby på Zinkensdamm) är exempel på den sällsynta dramatiska matchskadan — "blod på isen".

**Scope V1 (paketeras med 25f, efter 25e):**

**6 skadetyp-arketyper med frekvenser:**
1. **Skenan** (hälsena/achilles, Krigh-kategorin) — ~1 per 500 matcher, 30-45 omgångars frånvaro
2. **Fall på is** (handled/axel) — ~1 per 40 matcher, 2-4 omgångar
3. **Krock med målstolpe/iskant** — ~1 per 80 matcher, 1-3 omgångar
4. **Bollen i ansiktet** (bruten näsa/tand) — ~1 per 50 matcher, 0-1 omgångar — **ENDAST spelare ≥ 18 år** (juniorer har galler)
5. **Muskelöverbelastning** (ljumske/lår/vad) — ~1 per 25 matcher, 2-5 omgångar
6. **Hjärnskakning** — ~1 per 100 matcher, 1-2 omgångar

**Junior-skyddsregel:**
- `playerAge < 18` → `hasJuniorCage: true`
- Bollen-i-ansiktet-kategorin exkluderas
- Juniorer som debuterar i A-laget har kvar gallret — syns i portträttet, commentary: "17-åringen Andersson — galler fortfarande på hjälmen i Elitseriedebuten"

**Matchbyte-flow vid allvarlig skada:**
- Skada som tvingar spelare utgå (>1 omgångs frånvaro) → match pausas → modal dyker upp
- Liknande `SubstitutionModal` (zIndex 600), visar skärm: "Lindberg utgår. Hälsenan. Välj ersättare."
- Spelaren väljer från bänken — samma UI som halftime-byte
- Vid inaktivitet/avböjande: AI byter automatiskt (lämpligaste bänkspelare för positionen)
- Match fortsätter
- Blåmärken/lätta skador → **ingen modal, bara commentary**

**Blåmärken som narrativ detalj (inte mekanisk skada):**
- Ingen frånvaro, inga byten
- Commentary: "Lindberg tar emot Erikssons direktskott med låret. Haltar till hörnet men stannar kvar."
- Post-match i GranskaScreen: "3 blockerade skott av Andersson. Blåmärken att vårda inför nästa match."
- Trait-bump vid upprepade blockeringar: "tuff" eller "hårdför" byggs upp långsamt
- Supporter-reaktion: "Birger: 'Lindberg lägger kroppen i vägen. Det är sånt man minns.'"

**Integration:**
- Väder (dålig is) och derby-match ökar `injuryChance` via multiplikator
- Trötthet (spelare med morale < 40) ökar också
- **Ny taktikmodifierare: `injuryRiskModifier` i `tacticModifiers.ts`** — kopplar hög press, hög tempo och aggressiv penalty kill till ökad skaderisk. Idag finns `disciplineModifier` och `fatigueRate` men ingen explicit skaderisk-koppling. Taktikvy får då möjlighet att visa en "SKADE-RISK: HÖG"-tagg med faktisk motor-effekt.
- Allvarliga skador triggar inbox: "Lindberg — skadad i matchen mot Boltic. Hälsenan sliten. Åter: säsongsslut."
- Bandydoktorn kommenterar allvarliga skador i kafferum: "Hälsenan är en grym skada. 9 månader. Men han är ung, han kommer tillbaka."
- Presskonferens-trigger vid mittfas-skada: "Hur påverkar förlusten av Lindberg ert slutspel?"

**Scope V2 (framtiden):**
- "Krigh-event" som särskild minneshandelse (tystnad, blod på isen, is-ambulans)
- Hjärnskakningsprotokoll med consult-val (köra på eller byta ut)
- Återkomst-narrativ för långvariga skador
- Bandydoktorn spekulerar om chansen till comeback
- Skadehistorik påverkar spelares framtida transfer-värde

**Estimat V1:** 3-5 timmars implementation + kurerad commentary. Samma storleksordning som 25f (domare).

**Förslag: paketera 25f + 25g till "Sprint 25 — Matchens karaktärer"** — båda är post-match-narrativ som berikar matchen utan att röra motorkärnan. Opus skriver kurerad text för båda parallellt. Code implementerar båda services på en gång. Totalestimat: 8-10h kod + 2-3h text.

### Sprint 25h (kandidat) — Bandyskandaler

Identifierat 2026-04-22 efter diskussion om bandy-Sveriges verklighet. Ekonomiska skandaler, licensgranskningar och sponsor-kollapser är en återkommande del av svensk bandy. VSK Bandy +4.2M skuld till VSK Fotboll 2024. Hammarby/Choki AB 2024. Edsbyn/Järvefelt (3 års fängelse). Lönetak-debatten har pågått sedan 2019. Om allt annat i spelet är autentiskt behöver detta finnas.

**Designprincip:** Skandaler primärt i **andras klubbar** (atmosfär, ingen frustration). Sekundärt hos spelaren **bara som konsekvens av egna val** (engagement, inte slumpvåld).

**Tre lager:**

**Lager 1 — Världshändelser (andras klubbar):**
- 2-4 större skandaler per säsong i bandyvärlden
- Inbox-meddelanden, tidningsrubriker, kafferum-snack
- Mekanisk effekt: transfermarknad påverkas, tabellen påverkas vid poängavdrag
- Arketyper: sponsor-kollaps, klubb-till-klubb-lån, kassör avgick, fantomlöner, insamling försvann
- Estimat: 4h implementation + kurerad text

**Lager 2 — Egna beslut med risk:**
- Värvning över budget (styrelsen varnar, spelaren kan ignorera)
- Marknadsavtal med skumma partners (erbjudande i inbox: "500k/säsong men partnern granskas av Skatteverket")
- Patron-krav som systematiskt ignoreras (patron drar tillbaka tidigare inves teringar)
- Spelaren sätter sig i situationen — utfall är konsekvent
- Estimat: 3h implementation

**Lager 3 — Licensnämnden (långsiktig broms):**
- Trigger: klubben minusresultat 2+ säsonger i rad
- Första varningen: "Hemläxa. Inlämna handlingsplan."
- Andra: "Poängavdrag 3p nästa säsong."
- Tredje: "Elitlicens nekad. Ni flyttas ner."
- Spelaren har alltid 2 säsonger på sig att rätta till
- Estimat: 2h implementation

**Totalestimat:** 9h kod + 2-3h kurerad text.

**Blockeras av Sprint 26 (ekonomibalansering).** Meningslöst att implementera skandal-features innan basekonomin är rätt — en patron-skandal på -400k saknar bett när spelaren har +1.2M på kontot.

### FREDAGSJOBB — Utvidga bandygrytan-scraping med fler event-typer

**Undersökning klar 2026-04-22.** Elitserien och Allsvenskan har exakt samma event-typer i Firebase — ingen skillnad i tillgängliga fält. `bandygrytan_detailed.json` (Elitserien) har redan `shotsHome/Away` och `savesHome/Away` från en äldre scraper. Jobbet fredag gäller enbart `scrape-allsvenskan.mjs`.

**Kända event-typer:**

| Typ | Text | Notering |
|-----|------|----------|
| 11 | Skott på mål | Parat med typ-23 (save) eller typ-2 (mål) inom ~5 sek |
| 23 | Målvakten räddar | teamID = försvarande lag, playerID = målvakten |
| 10 | Frislag | Beviljade frislag |
| 20 | Missad hörna | Hörnor utan skott |
| 107 | Offside | Nytt i nyare format; saknas i Elitserien pre-2023 |

**Täckningsvariation:** Katrineholm–Borlänge 2–1: 15 t11 + 19 t23 (komplett). Bollnäs–Sandviken 6–3: 2+2 (nastan ingenting). Elitseriens gamla data visar generellt bättre konsistens — sannolikt rutinerade matchsekretariat.

**Jobb fredag — kod i `scrape-allsvenskan.mjs`:**

Lägg till i `parseEvents(eventsRaw)`:

```js
const T_SHOT = 11
const T_SAVE = 23
const T_FREESTROKE = 10
const T_OFFSIDE = 107

// Per match, räkna per teamID:
const shotsByTeam = {}
const savesByTeam = {}   // teamID = FÖRSVARANDE lag
let freestrokesHome = 0, freestrokesAway = 0
let offsidesHome = 0, offsidesAway = 0

for (const e of events) {
  if (e.type === T_SHOT && e.teamID) shotsByTeam[e.teamID] = (shotsByTeam[e.teamID]||0)+1
  if (e.type === T_SAVE && e.teamID) savesByTeam[e.teamID] = (savesByTeam[e.teamID]||0)+1
  if (e.type === T_FREESTROKE) {
    if (e.teamID === String(homeTeamId)) freestrokesHome++
    else freestrokesAway++
  }
  if (e.type === T_OFFSIDE) {
    if (e.teamID === String(homeTeamId)) offsidesHome++
    else offsidesAway++
  }
}

const shotsOnGoalHome = shotsByTeam[String(homeTeamId)] || null
const shotsOnGoalAway = shotsByTeam[String(awayTeamId)] || null
const savesHome = savesByTeam[String(homeTeamId)] || null  // hemmalaget räddade (bortas skott)
const savesAway = savesByTeam[String(awayTeamId)] || null

// loggingQuality: baserat på typ-11-täckning
const totalGoals = (fd.homeGoals||0) + (fd.awayGoals||0)
const totalShots = (shotsOnGoalHome||0) + (shotsOnGoalAway||0)
const loggingQuality =
  totalShots >= Math.max(3, totalGoals * 1.5) ? 'full'
  : totalShots >= 3 ? 'partial'
  : 'minimal'
```

Lägg till i return-objektet:
```js
shotsOnGoalHome, shotsOnGoalAway,
savesHome, savesAway,
freestrokesHome, freestrokesAway,
offsidesHome, offsidesAway,
loggingQuality,
```

**Rapport som ska genereras efter körning:**
- Antal matcher per `loggingQuality`-nivå
- Snitt `shotsOnGoal/match` för `full`-matcher (jämförs mot Bandypuls-siffran 28/match)
- Om `full`-snittet ~28: bekräftat, uppdatera `SCORELINE_REFERENCE.md`
- Om `full`-snittet ~20-22: bandygrytan mäter "skott på mål" striktare än Bandypuls, dokumentera skillnaden

**Varför fredag:** Inte akut för motorn — den kör mot Bandypuls-targets. Verifiering och kalibreringsstöd inför Sprint 25e.

---

## PARKERAT — ICKE-KRASCH

### BUG-STRESS-06 — saveGameSize warnings

Stress-testet varnar för save-game-storlek i långa körningar. Inte krasch, ingen funktionell påverkan. Parkerat sedan 22.8.

**När tas upp:** Om save-games når localStorage 5MB-gräns i verklig spelanvändning, eller om någon säsong kraschar med quota-error.

**Diagnostik-hint vid undersökning:** Kolla `pendingFollowUps`, `playerConversations`, `financeLog`, `narrativeLog` (per spelare, slice(-20) finns men oklart om allt följer den), `storylines`, `bandyLetters`. Även `chemistryStats` växer O(n²) med startelva.

---

## LÖST VIA SÄSONGSKALIBRERING (Sprint 24-serien)

### ~~Matchkalibrering — 13-14 mål/match~~ — löst via infrastruktur

Playtest-observerad siffra (13-14) var statistiskt brus på 10-match-urval. Sprint 24-mätning på 7179 matcher visar `goalsPerMatch` = 10.10-10.26 (acceptabelt intervall mot target 9.12). Inte mer att fixa här specifikt — återstående gap på ~1 mål hanteras sannolikt som sido-effekt av 25b.1/25b.2 (fler utvisningar → fler powerplay → något justering i målfrekvens).

---

---

## VÄNTAR PÅ PLAYTEST-VERIFIERING (efter Sprint 23)

- Taktiktavlan: formations-rekommendation syns med grön outline + ★ COACH
- Rekommendationen flyttar INTE tyst när spelaren valt manuellt
- Inbox-notis kommer vid ny rekommendation (t.ex. efter värvning)
- Tags + coach-quote uppdateras vid formation-byte
- "ändras i lineup" är klickbar länk
- Kemi-par expanderar vid klick, konkret förslag visas (inte generaliteter)
- Ingen expand-text vid neutral kemi eller stark+ihop (gömt)

---

## LÅNGSIKTIGT (EJ AKTIVT)

Från `docs/THE_BOMB.md` och `docs/SPEC_KLUBBUTVECKLING.md`. Listade för att inte glömma — inte nu.

- Ortens kalender (händelser mellan matchdagar)
- Mecenatens middag (interaktiv scen)
- Kommunval (var 4:e säsong, ny kontakt)
- Taktikdjup (hörnplanering som visuell spelplan, motståndaranpassning)
- Share-images (matchhighlight som delbar bild)
- Ljudeffekter (opt-in)
- Halvtidsanalys (momentumgraf, bollinnehav)

---

## DOKUMENT-STATUS

| Fil | Senast uppdaterad | Status |
|-----|-------------------|--------|
| `CLAUDE.md` | 2026-05-10 | Aktuell — workspace-check-steg tillagt i sessionsstart |
| `LESSONS.md` | 2026-05-10 | Aktuell |
| `DECISIONS.md` | 2026-05-06 | Aktuell — 3 nya poster (stripes, arrivalDialogue, design-system-flytt) |
| `design-system/DESIGN-DECISIONS.md` | 2026-05-06 | Aktuell — stripes-beslut + AI-slop def reviderad |
| `docs/DESIGN_SYSTEM.md` | 2026-05-05 | **STUB** — auktoritativt i `design-system/` |
| `STATUS.md` | 2026-04-27 | Uppdaterad med Sprint 27 + 28-A/B |
| `KVAR.md` | 2026-05-10 | Denna fil |
| `HANDOVER_2026-05-09.md` | 2026-05-09 | Senaste handover (förra sessionen) |
| `HANDOVER_2026-05-08.md` | 2026-05-08 | Föregående handover |
| `HANDOVER_2026-05-04_KVÄLL.md` | 2026-05-04 | Föregående handover (kväll) |
| `HANDOVER_2026-04-30.md` | 2026-04-30 | Handover förmiddag |
| `HANDOVER_2026-04-28b.md` | 2026-04-28 | Arkiv |
| `SPEC_MATCHDAGAR.md` | 2026-04-27 | Fas 1–3 levererade, Fas 4 blockeras på SMHI |
| `STRINGS_SPECIALDATUM.md` | 2026-04-27 | Implementerad i specialDateStrings.ts |
| `SCORELINE_REFERENCE.md` | 2026-04-21 | Referens för 25b/c/d |

---

## NÄSTA SESSION — FÖRESLAGEN ORDNING

1. Läs `CLAUDE.md`, `LESSONS.md`, `DECISIONS.md`, `KVAR.md` (denna), `HANDOVER_2026-05-09.md`.
2. **Playtest — Stålvallen pixel-audit.** Öppna mockarna i `docs/match-live-bundle/*.html` i webbläsaren. Starta dev-servern. Jämför per komponent:
   - `scoreboard-stalvallen.html` → ScoreboardStalvallen (sticky topp, score-flash, tidslinje)
   - `commentary-redesign-v2.html` → CommentaryFeedStalvallen (tagg-stilar, atmosphere-rader)
   - `match-events-stalvallen.html` → alla 5 event-paneler (corner/frislag/straff/kontring/slutminuterna)
   - `match-report-stalvallen.html` → MatchReportView (stage + paper, spelarbetyg, POTM)
   - `portal-secondary-cards.html` → de tre secondary-korten + EventCardInline
3. **Playtest — intro-flödet.** Ny manager: ArrivalScene → BoardMeetingScene → cup_start-anslag → cup_first_match-anslag → cup-match. Säsong 2: season_kickoff-anslag → cup_start → cup_first_match.
4. **Avvikelser från pixel-audit** → direkt till Code som en samling fixar.
5. **BATCH E (press/media)** — om integration-ytan är beslutad (Portal-secondary rekommenderas som minsta lift).
6. **Småfixar** (QFSummaryScreen letterSpacing, GameOverScreen/ChampionScreen knappar) — paketera som en commit.
