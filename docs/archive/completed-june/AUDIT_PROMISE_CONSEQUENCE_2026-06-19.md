# AUDIT — Promise↔consequence, 2026-06-19
Baserad på SPEC_PROMISE_CONSEQUENCE_AUDIT.md + HANDOVER_2026-06-18.md.
Metod: källkod läst direkt mot HEAD (ej minne, ej Code-rapport).
Build: HEAD (ocommittade Opus-edits från 2026-06-18 väntar commit).

---

## 1. VECKANS BESLUT (weeklyDecisionService.ts + gameFlowActions.ts)

### corner_extra_training
Label A: "+3 hörnskicklighet"
Effect: `cornerSkill +3` på cornerCandidate (spelare med cornerSkill > 60).
Problem: om ingen trupp-spelare har cornerSkill > 60 returnerar resolveWeeklyDecision `noop` utan feedback. Labeln lovar alltid +3.
**Dom: FEL KONTEXT (silent noop-risk)**
Fix: döl beslutet om candidate saknas, eller ändra label till "+3 hörnskicklighet*" med asterisk/fallback. Ägare: Code.

### player_weekend_off
Label A: "−1 kondition · +5 moral"
Effect i resolveWeeklyDecision: `{ type: 'morale', playerId, delta: 5 }`.
I gameFlowActions appliceras `morale`-typen på `p.form`, INTE `p.morale`:
  `players.map(p => p.id === playerId ? { ...p, form: p.form + delta } : p)`
"Moral" ändrar alltså form. "−1 kondition" finns inte implementerad överhuvudtaget.
Label B: "−3 moral" → samma bug, appliceras på form.
**Dom: DUBBEL FEL KONTEXT (+ bug)**
Fix: Code fixar effect-applicering så `morale`-type träffar `p.morale`, lägger till separata fitness-delta. Opus uppdaterar label efteråt. Ägare: Code + Opus.

### away_trip_bus
Label A: "−3 tkr · +bortasupport" → finances −3000 + supporterMood +8.
Label B: "−5 {groupName}-stämning" → supporterMood −5.
**Dom: BACKAS**

### tifo_contribution
Label A: "−2 tkr · +hemmabonus" → finances −2000 + supporterMood +6.
"+hemmabonus" antyder matchdagseffekt; faktisk effekt är supporterMood (ingen hemmabonus-variabel i matchmotorn).
**Dom: FEL KONTEXT**
Fix (Opus): ändra label till "−2 tkr · +supporterstämning". Ägare: Opus direkt.

### supporter_conflict_mediate
Label A: "+stämning · alla nöjda" → supporterMood +5. ✅
Label B: "50/50 chans" → mulberry32-slump, ärlig.
**Dom: BACKAS**

### reporter_klacken
Label A: "+3 kommunstatus" → communityStanding +3. ✅
Label B: "Journalisten tappar förtroende" → communityStanding −2.
game.journalist.relationship ändras INTE. Journalisten har ett relationship-fält men det berörs inte.
**Dom: FEL KONTEXT**
Fix (Opus): ändra label B till "−3 kommunstatus" eller "tidningen tappar intresse". Ägare: Opus direkt.

### training_corners_vs_matchprep
Label A: "+hörnskicklighet" → cornerSkill +2 på cornerCandidate. ✅
Label B: "+hörnförsvar" → cornerRecovery +2 på weakRecoveryDefender. ✅ (Fynd 11 byggt.)
Samma silent noop-risk som corner_extra_training om kandidat saknas.
**Dom: BACKAS (med noop-caveat — se ovan)**

### scout_opponent_corners
Label A: "−1 scout · +taktikinsikt"
Effect: `{ type: 'scoutNextOpponent' }`. I gameFlowActions: drar scoutBudget −1 + generateDetailedAnalysis.
Kräver `scoutBudget > 0`. Om budget = 0: silent noop, ingen feedback, label fortfarande "+taktikinsikt".
"+taktikinsikt" surfas korrekt på matchförberedelsen när analys genereras.
**Dom: OSYNLIG (när scoutBudget = 0)**
Fix: döl alt A eller visa "scouter saknas (0 kvar)" om budget är 0. Ägare: Code.

### ismaskin_offer
Label A: "−15 tkr · +iskvalitet" → finances −15000 + communityStanding +4.
"Iskvalitet" finns inte som mechanic. Ingen is-quality-parameter i matchmotorn.
**Dom: FEL KONTEXT**
Fix (Opus): ändra label till "−15 tkr · +kommunstatus". Ägare: Opus direkt.

### family_section_request
Label A: "+kommunstatus · +stämning" → communityStanding +3 + supporterMood +4. ✅
**Dom: BACKAS**

### legacy_naming_arena
Label A: "+20 tkr engång · −stolthet" → finances +20000 + supporterMood −6. ✅ (rimlig approximation)
Label B: "+{groupName}-stämning · −boardpatience" → supporterMood +5 + boardPatience −3. ✅
**Dom: BACKAS**

### legacy_youth_showcase
Label A: "+rekrytering · +kommunstatus" → communityStanding +4.
"+rekrytering" är obuilt. Ingen rekryteringseffekt implementerad.
**Dom: STUB**
Fix: antingen bygg rekryteringseffekt (t.ex. bonus på nästa akademiintag) eller stryk "+rekrytering" från label. Ägare: Code (om bygg) / Opus (om stryk).

### survival_wage_freeze
Label A: "+budget · −spelarförtroende" → boardPatience +6 + supporterMood −4.
"+budget" pekar inte på finanser utan på boardPatience.
"−spelarförtroende" pekar på supporterMood (klacken), inte på individuellt spelarförtroende.
**Dom: FEL KONTEXT (dubbel)**
Fix (Opus): label A → "+styrelsens tålamod · −supporterstämning". Ägare: Opus direkt.

### survival_emergency_lotto
Label A: "+5 tkr · +klackstämning" → finances +5000 + supporterMood +3. ✅
**Dom: BACKAS**

---

## 2. EFTERKLANG (pickEfterklang.ts + efterklangText.ts)

| Typ | Dom | Not |
|---|---|---|
| anniversary | BACKAS | Gatad på significance ≥ 70 |
| klackEcho | BACKAS | Weight > 20, decay ok |
| journalist | BACKAS | Gatad på journalistMemories.length > 0 |
| followUp | DÖD | Se nedan |
| boardObjective | BACKAS | Gatad på result === 'failed' |
| nemesis | BACKAS | Playtest-fynd 9 bekräftat: gatad på nextOpponentId |
| economicScar | BACKAS | Kris-fas + efterdyning (0–10 omg) separerade |
| rivalSale | BACKAS | Gatad på recency 0–10 omg |

### followUp — DÖD
Eko: "Brevet ligger fortfarande obesvarat i högen." / "Den där frågan hänger kvar. Någon väntar än på svar."
Källa: `bandyLetters` från denna säsong. Fan-brev är flavor — det finns ingen svara-knapp eller handlingsyta.
Ekot ber om handling som inte kan göras.
Fix (Opus): ändra eko till observation utan handlingsimperatör. Förslag: "Brevet från {senderName} sitter kvar. Den sortens fan glömmer man inte." Ägare: Opus direkt.

---

## 3. INKORG (InboxScreen.tsx)

### "KRÄVER SVAR" utan action-path — DÖD (systematisk)
BoardFeedback, LicenseReview, ContractExpiring, Suspension hamnar i gruppen "KRÄVER SVAR."
InboxRow har inga action-knappar — spelaren ser att svar krävs men kan inte agera härifrån.
Känt i spec: Frida-tifo, Helena (= order #12).
Fix: lägg navigations-CTA per item-typ ("Gå till Trupp →") eller ändra label till "KRÄVER ÅTGÄRD" med `›`-länk per typ. Ägare: Code (order #12).

### TransferBidReceived (pending-bid) — BACKAS
`hasOpenBid`-logiken korrekt: pending → kräver-svar, resolved → nyheter.

### Empty state — BACKAS
"Lugnt i korridorerna — för tillfället." Ren flavor.

---

## 4. PORTAL BEATS (portalBeats.ts)

Alla beats är flavor + stängbara. Öppet beslut #14 (länk) ej implementerat = korrekt.

| Beat | Dom |
|---|---|
| season_opener | BACKAS |
| first_win | BACKAS |
| first_derby | BACKAS (getRivalry + nästa match = derby) |
| halftime | BACKAS |
| transfer_window_open | BACKAS (text ärlig: "bara inte hos er än") |
| last_league_round | BACKAS |

---

## 5. KAFFERUM / SPECTATOR-TEXT (spectatorPrimaryText.ts + spectatorMarkText.ts)

SpectatorPrimaryText: tre fokustyper (kontrakt/akademi/trupp), CTA navigerar korrekt. Inga mechaniclöften. **BACKAS**
SpectatorMarkText: ren flavor för slutspelsåskådare. **BACKAS**

---

## 6. KLACK (klackEchoText.ts + klackEchoService.ts)

Alla klack- och kafferumscitat är flavor — observationer om klacken/gubbarna. Inga mechaniclöften.
Cause-prefix-logik korrekt (1–4 omg, 35% tröskel, mulberry32-deterministisk).
**Dom: BACKAS**

---

## 7. JOURNALIST (journalistHeadlineStrings.ts)

Headlines är flavor efter match. prevLoss-split (fresh/prevLoss-pooler) ger korrekt eskalering vid förlustsviter. Inga mechaniclöften i rubrikerna.
**Dom: BACKAS**
Notat: reporter_klacken-beslutets B-label (FEL KONTEXT) är ett Weekly Decision-problem, inte headlineStrings-problem.

---

## 8. "SÅ SPELAR DET"-RADEN (TacticBoardCard)

TacticBoardCard.tsx ej hittad i detta pass (search ej täckte komponenten). **EJ AUDITAD — pass 2.**
Fil att läsa: `/src/presentation/components/tactic/TacticBoardCard.tsx`

---

## 9. LEDARSKAPSÅTGÄRDER (leadershipService.ts + PlayerCard + SquadScreen)

### lower_tempo — FEL KONTEXT
Label: "😮‍💨 Vila nästa match"
Effect: `fitness +2` permanent. Ingen matchgräns, ingen återgång.
"Vila nästa match" antyder en-matchs-fönster; mechaniket är en permanent stat-ändring.
Fix (Opus): ändra label till "😮‍💨 Minska belastningen". Ägare: Opus direkt.

### mentor — STUB
Label: "🎓 Sätt som mentor"
Effect: `leadershipEntry` med `effect: { stat: 'mentorship', delta: 1 }`.
Downstream-läsning av `stat: 'mentorship'` hittades ej. Entry lagras men ingen kod läser och applicerar mentorship-stat på youngPlayer.
Fix: bygg mentorship-downstream (t.ex. youngPlayers CA-tillväxtbonus i endOfSeason). Ägare: Code.

### private_talk — BACKAS
Effect: `morale delta` beroende på form. `handleLeadership` → `useLeadershipAction` i store → game.players.morale uppdateras faktiskt + leadershipEntry läggs till.
Feedback korrekt i PlayerCard.

### public_praise — DELVIS OSYNLIG (pass 2)
Effect: praised morale +5, squadmates morale −2 (jealousy). Feedback nämner avundsjuka.
`applyLeadershipAction` returnerar `affectedPlayerIds` + `affectedMoraleChange`. Oklart om `useLeadershipAction` i gameStore.ts applicerar jealousy-delta på squadmates. Kräver verifiering.
Pass 2: läs gameStore.ts `useLeadershipAction`-implementationen.

---

## 10. SPELARSAMTAL (talkToPlayer / SquadScreen)

`handleTalk` → `talkToPlayer(playerId, choice, currentRound)` från store.
Returnerar `{ feedback, moraleChange, formChange }` visas lokalt i PlayerCard (clearas efter 4s).
Cooldown-logik (3 omg) korrekt via `currentRound - lastTalked >= 3`.
**Öppet: gameStore.ts `talkToPlayer`-implementationen ej läst** — oklart om delta faktiskt committas till `game.players` eller bara visas som UI-feedback.
**Dom: OSYNLIG (pass 2)**
Pass 2: läs gameStore.ts, sök `talkToPlayer`.

---

## 11. ANSLAG / managerKvitto / smallAbsurditeter

### Anslag (leagueAnslag.ts + cupAnslag.ts + playoffAnslag.ts) — BACKAS
Ren flavor. Inga mechaniclöften i AnslagVariant.body.

### managerKvitto (managerKvittoText.ts) — BACKAS
Konstruktionen är precis promise↔consequence-vänlig: "du valde X → Y hände", torrt
observationellt, bara rader med mätbart utfall. Code väljer good/bad/neutral utifrån
FAKTISKT utfall (HALFTIME_OUTCOMES, AWAY_ROUTINE_OUTCOMES, LINEUP_ROTATION_OUTCOMES,
STARTED_TIRED_OUTCOMES, LEADERSHIP_OUTCOMES). Förutsätter att Code:s urvalslogik läser
verkligt utfall — strukturen stödjer det. Ingen anmärkning.

### smallAbsurditeter (smallAbsurditiesData.ts) — BACKAS
Ren flavor (tidningsrubriker + kafferumsutbyten om absurda händelser i andras klubbar).
Inget löfte, ingen handlingsyta.

(Auditerades 2026-06-19 efter dubbelkoll mot spec-checklistan — managerKvitto och
smallAbsurditeter missades i första passet, lades till här.)

---

## 12. SKADE-/AVSTÄNGNINGSTEXTER (injuryContextText.ts + InjuryStatusSecondary.tsx + PlayerCard)

injuryContextLine kalibrerad mot daysRemaining:
- ≤7 dagar → "Ute en match." ✅
- 8–21 dagar → "Borta ett par veckor." ✅
- ≥28 dagar → "Borta länge." ✅
InjuryStatusSecondary: `Math.ceil(days / 7)` veckor. ✅
PlayerCard DREAM-012: "SKADAD — {veckor} veckor kvar". ✅
Avstängning: "Avstängd {N} match[er]" från `suspensionGamesRemaining`. ✅
**Dom: BACKAS**

---

## SAMMANFATTNING

| # | Yta | Dom | Ägare |
|---|---|---|---|
| 1 | corner_extra_training (noop-risk) | FEL KONTEXT | Code |
| 2 | player_weekend_off: "moral"→form, "kondition" saknas | FEL KONTEXT (bug) | Code + Opus |
| 3 | tifo_contribution: "+hemmabonus" | FEL KONTEXT | Opus |
| 4 | reporter_klacken B: "journalist tappar förtroende" | FEL KONTEXT | Opus |
| 5 | ismaskin_offer: "+iskvalitet" | FEL KONTEXT | Opus |
| 6 | survival_wage_freeze: "+budget · −spelarförtroende" | FEL KONTEXT | Opus |
| 7 | lower_tempo: "Vila nästa match" | FEL KONTEXT | Opus |
| 8 | legacy_youth_showcase: "+rekrytering" | STUB | Code (eller Opus stryker) |
| 9 | mentor: ingen downstream | STUB | Code |
| 10 | scout_opponent_corners: noop vid scoutBudget = 0 | OSYNLIG | Code |
| 11 | followUp-eko: obesvarat brev-imperatör | DÖD | Opus |
| 12 | Inkorg "KRÄVER SVAR" utan action-path | DÖD | Code (#12) |
| 13 | public_praise jealousy-delta (verifieras) | DELVIS OSYNLIG | Pass 2 |
| 14 | talkToPlayer state-persistens | OSYNLIG | Pass 2 |
| 15 | TacticBoard "Så spelar det" | EJ AUDITAD | Pass 2 |

Backas utan anmärkning: away_trip_bus, supporter_conflict_mediate, family_section_request,
legacy_naming_arena, survival_emergency_lotto, alla efterklang utom followUp, kafferum/spectator,
klack, journalistHeadlines, anslag, skade-/avstängningstexter, alla PortalBeats.

## Pass 2 — KLAR 2026-06-19

### TacticBoard "Så spelar det"-raden — BACKAS
Kemi läses av matchCore via `chemMultiplier` (CHEM_K = 0.12, max ±6% på attack+defense).
Mentality läses direkt via `getTacticModifiers`. Raden är korrekt narrativ approximation.
"Sårbar på omställning" är tekniskt lite bred (kemi påverkar attack+defense uniformt, inte
specifikt omställning) — acceptabel narrativ förenkling.

### talkToPlayer state-persistens — BACKAS
State persisteras korrekt: morale+form skrivs till `players`, cooldown i `playerConversations`,
inkorgspost genereras vid kontrakt-oro. UI-visad `moraleChange`/`formChange` matchar faktiska deltan.

### public_praise jealousy-delta — BACKAS
`useLeadershipAction` i gameStore applicerar `affectedMoraleChange` på alla `affectedPlayerIds`.
Feedbacktexten "Några andra ser lite snett" är sann.

### mentor downstream — STUB (bekräftat)
`playerUpdates: {}` (tomt) sprids på spelaren — ingen förändring. `leadershipEntry` med
`effect: { stat: 'mentorship', delta: 1 }` lagras men ingen kod läser det. Se Code PC-6.

---
