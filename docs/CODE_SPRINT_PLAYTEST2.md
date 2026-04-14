# CODE-INSTRUKTIONER — 14 april 2026

`npm run build && npm test` efter VARJE fix.

---

## PRIORITETSORDNING

### 1️⃣ BUGGAR — docs/SPRINT_ALLT_KVAR.md (gör ALLA först)

13 kvarstående buggar. Hörn-SVG (1.2 + 2.3) är BORTTAGNA — ersatta av redesign i SPEC_RIK_MATCHUPPLEVELSE Sprint K.

| # | Bugg | Fil(er) | Allvar |
|---|------|---------|--------|
| 1.3 | Kontraktsförnyelse fastnar | TransfersScreen, RenewContractModal, DashboardScreen | Hög |
| 1.4 | Mecenater spawnar aldrig | roundProcessor.ts | Hög |
| 1.5 | cupRun board objective fail-logik | boardObjectiveService.ts | Medium |
| 1.6 | Troféer lösa på dashboard | DashboardScreen, CareerStatsCard | Medium |
| 1.7 | Form-prickar inkonsekvent ordning | PlayoffIntroScreen | Låg |
| 1.8 | DiamondDivider har flyttat | DashboardScreen | Låg |
| 1.9 | Styrelsemöte dubbelcitat | BoardMeetingScreen | Låg |
| 1.10 | Presskonferens 4 buggar | pressConferenceService + rendering | Medium |
| 1.11 | Kafferummet upprepar | coffeeRoomService.ts | Låg |
| 1.12 | ?-knappen koppar | GameHeader.tsx | Låg |
| 1.13 | TransfersScreen flikar | TransfersScreen.tsx | Låg |
| 1.14 | paddingBottom 7 skärmar | Diverse screens | Medium |
| 1.15 | CS diminishing returns | communityProcessor.ts | Medium |
| 1.16 | Cupvy saknar progress-rad | CupCard.tsx, DashboardScreen | Medium |

Detaljer och exakt fix-kod: se SPRINT_ALLT_KVAR.md punkt 1.3–1.16.

### 2️⃣ KALIBRERING — kör och iterera

```bash
node_modules/.bin/vite-node scripts/calibrate.ts
```

Alla 5 targets ska vara ✅. Justera konstanter i matchEngine.ts tills de stämmer.

Nytt script `scripts/calibrate_v2.ts` finns redo men väntar på detaljdata (docs/data/bandygrytan_detailed.json). Kör INTE v2 ännu — det gör vi när datan landar.

### 3️⃣ RIK MATCHUPPLEVELSE — docs/SPEC_RIK_MATCHUPPLEVELSE.md

Komplett spec med mockups. Gör i denna ordning:

**Fas 1-2: Commentary (Sprint A-B, ~105 min)**
- Nya commentary-pools i matchCommentary.ts (~50 nya strängar)
- getMatchSituation() i matchStepByStep.ts
- Kontextuell wiring: spelarform, kapten, favorit, utvisningar
- Se mockup: `docs/mockups/match_experience_mockups_v2.html` sektion 2-3

**Fas 2: Narrativ båge (Sprint C, ~45 min)**
- getSecondHalfMode() — chasing/controlling/cruise/even_battle
- Momentum-svängningar → kommentarer
- getStepDelay() i MatchLiveScreen (pacing)

**Fas 3: Händelsevariation (Sprint D, ~60 min)**
- Nya sekvenstyper: tactical_shift, player_duel, atmosphere, offside, freekick_danger
- buildSequenceWeights() — situationsberoende vikter
- RefStyle-system (strict/lenient/inconsistent)

**Fas 4: Sammanfattningar (Sprint F, ~60 min)**
- getFinalWhistleSummary → FinalWhistleContext (lager-på-lager)
- generateQuickSummary → väder, hörnor, utvisningar, rivalitet
- getMatchHeadline() i MatchDoneOverlay (VÄNDNINGEN, TUNGT, CUPSKRÄLL etc)
- "MATCHENS BERÄTTELSE" i MatchReportView

**Fas 5: Matchlägen (Sprint G, ~60 min)**
- MatchMode typ (full/commentary/quicksim)
- UI-väljare i StartStep (tre knappar, ersätter tvåknapps Live/Snabb)
- Kommentar-läge: auto-resolve interaktioner, snabbare tempo
- Snabbsim: simulateMatch() → direkt till GranskaScreen
- Se mockup: `docs/mockups/match_experience_mockups_v2.html` sektion 1

**Fas 5: Nya interaktioner (Sprint H-J, ~120 min)**
- counterAttackInteractionService.ts + CounterInteraction.tsx
- freeKickInteractionService.ts + FreeKickInteraction.tsx
- lastMinutePressService.ts + LastMinutePress.tsx
- Se mockup: `docs/mockups/match_interactions_v3.html` sektion 3

**Fas 5: Hörna + straff redesign (Sprint K, ~60 min)**
- CornerInteraction → dark interaction-card, emoji choice-btn, förbättrad SVG
- PenaltyInteraction → dark interaction-card, SVG-målbur med outline-målvakt, klickbara zoner
- Ersätter befintlig ljus card-sharp-stil
- Se mockup: `docs/mockups/match_interactions_v3.html` sektion 1-2

### 4️⃣ PARKERAT (gör INTE nu) — docs/FIXSPEC_PARKERAT.md

- P1: Presskonferens som visuell scen
- P2: Transferdödline-känsla
- P3: Klubbens rykte utanför orten

Fullspecade men ej prioriterade. Gör efter lager 1-3.

---

## VAD SOM REDAN ÄR KLART (rör inte)

- ✅ Coach marks (löst via saveGameMigration)
- ✅ Arenanamn i all UI
- ✅ Klacknamn (alla 12 klubbar)
- ✅ Matchmotor-kalibrering (6 steg, TIMING_WEIGHTS)
- ✅ Straffar under match (penaltyInteractionService + PenaltyInteraction.tsx)
- ✅ Kapten (captainPlayerId, PreSeason-val, ©-badge)
- ✅ BUG-23/24/25 (matchsummary, taktikjustering, ekonomi-kort)
- ✅ GranskaScreen neutral plan för SM-final
- ✅ TIMING_WEIGHTS till modulnivå
- ✅ arenaName/supporterGroupName required

## SPEC-FILER (referens)

| Fil | Innehåll |
|-----|----------|
| `docs/SPRINT_ALLT_KVAR.md` | 13 buggar + kalibrering |
| `docs/SPEC_RIK_MATCHUPPLEVELSE.md` | Commentary, båge, interaktioner, lägen, sammanfattningar |
| `docs/mockups/match_interactions_v3.html` | Hörna/straff redesign, kontring, frislag, sista-minuten, headlines |
| `docs/mockups/match_experience_mockups_v2.html` | StartStep 3 lägen, commentary-typer, matchens berättelse |
| `docs/FIXSPEC_PARKERAT.md` | Presskonferens-scen, transferdödline, rykte |
| `docs/data/SCHEMA_DETAILED.md` | Dataformat för Bandygrytan-extraktion |
| `scripts/calibrate_v2.ts` | Analysscript (väntar på data) |

## KVALITETSGATES

```bash
npm run build && npm test
```

- Build+test efter VARJE steg
- ALDRIG verifiera komponenter i isolation — läs parent screen FÖRST
- Trace full renderflöde (vad renderas, i vilken ordning, med vilka props)
- grep-verifiera imports
- Mockups = sanning. Implementera det du SER, inte vad du tror.
