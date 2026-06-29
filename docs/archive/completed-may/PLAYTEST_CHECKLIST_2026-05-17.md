# Playtest-checklista — Riktning 2 verifiering

**Datum:** 2026-05-17
**Syfte:** Verifiera 10 inlåsta system + FIX 47-50 + F1 implementerade delar + audit-fixar + cup-tonen Nivå 1. Resultat: uppgradera 🟠 → 🟢 i `INLASTA_SYSTEM.md` per system + bekräfta att Code-leveransen sitter.
**Hur:** Spela ett färskt save från säsongspremiär. Förbered att spela minst 5 omgångar plus cup-omg 1. Notera fynd löpande.
**Fynd-rapportering:** Notera per punkt: ✅ sittande / ❌ trasigt + beskrivning / ⚠️ syns ej (inte triggat) / 🤔 sittande men fråga. Mig sedan så jag uppdaterar trackers + skriver fix-specer.

---

## DEL A — 10 INLÅSTA SYSTEM

### 1. boardObjectiveService → BoardObjectivesSecondary

**Var:** Portal secondary section (rullbar sektion under Primary-kortet).
**Test:** Spela till omg 7 — board feedback-anslag ska trigga. Innan dess (omg 1-6) ska BoardObjectivesSecondary synas i Portal med 1-2 mål listade.

**Verifiera:**
- [ ] Kortet finns i Portal med eyebrow "Styrelsen"
- [ ] Pågående mål visas med progress-indikator
- [ ] Max 2 mål visas (sorterade `failed → at_risk → active → met`)
- [ ] Vid klick: navigerar till `KlubbTab`?
- [ ] Status-emojis (📌 ⚠️ ❌ ✅) syns
- [ ] `formatOwnerInitial(ownerId)` ger korrekt initial+namn (inte `m. ember_anders`)

### 2. opponentAnalysisService → Spela-flödet

**Var:** Lineup-fliken (context-strip) + Tactic-fliken (opp-insight + recommendation).
**Test:** Tryck "Spela" på första matchen. Verifiera båda flikar.

**Verifiera:**
- [ ] Lineup-fliken: context-strip visar motståndarens form + formation
- [ ] Tactic-fliken: styrka/svaghet/rekommendation syns
- [ ] Formation-rekommendation har ★ COACH-affordans (Sprint 23-arvet)
- [ ] Är insights faktiskt **kännbara** (påverkar dina val) eller bara info-tapeter?

### 3. weeklyDecisionService → WeeklyDecisionSecondary

**Var:** Portal secondary section.
**Test:** Spela 3-5 omgångar. WeeklyDecision triggas slumpmässigt (verifiera trigger-frekvens i koden om inget syns på 5 omg).

**Verifiera:**
- [ ] Kortet dyker upp i Portal när trigger sker
- [ ] Eyebrow byter mellan "Veckans beslut" / "Veckans supporterfråga" baserat på category
- [ ] Två option-knappar finns
- [ ] **Efter val:** resolved-state visas med checkmark + outcome-text
- [ ] **Resolved-state försvinner efter ~2600 ms** (audit-fix 3.2 — verifiera att det är läsbart, inte för snabbt som förr)
- [ ] Supporter-typer har `--warm`-stripe, övriga har `--accent`-stripe

### 4. leadershipService → PlayerCard

**Var:** SquadScreen → Nu-flik → öppna en spelarkort.
**Test:** Spela 2 omgångar. Öppna spelarkort på 5-10 spelare. Leta efter "Leadership Action"-knapp.

**Verifiera:**
- [ ] Knappen syns på rätt spelare (kapten/erfaren?)
- [ ] Klick → feedback-toast med outcome
- [ ] Påverkar något (moral, klubbeglädje)?

### 5. rumorService → RoundSummaryScreen

**Var:** RoundSummary efter spelad match. Sektion "TRANSFERRYKTEN" rad 460-472.
**Test:** Spela 3-5 matcher. Transferrykten triggas i mediaProcessor.

**Verifiera:**
- [ ] Sektionen "TRANSFERRYKTEN" syns när rykten finns
- [ ] Sektionen göms när inga rykten finns (inte tom rubrik)
- [ ] Innehållet känns trovärdigt eller AI-genererat?

### 6. playerVoiceService → PlayerCard

**Var:** Samma som leadership (SquadScreen → spelarkort). Trigger: 20% chans + form/moral-villkor.
**Test:** Öppna 10-20 spelarkort på olika spelare över flera omgångar.

**Verifiera:**
- [ ] Italic quote dyker upp på vissa kort (inte alla)
- [ ] "🗣 [FIRSTNAME]"-prefix syns
- [ ] Texten känns kontext-relevant (form/moral-driven)?
- [ ] Voice-block läsligt i SquadScreen-mörkkontext (audit-observation 6.1)

### 7. mecenatDinnerService → MecenatDinnerEvent

**Var:** Modal-overlay vid `event.type === 'mecenatDinner'`. Trigger: mecenat-system.
**Test:** Spela till mecenat är aktiv. Eventet dyker upp i Portal.

**Verifiera:**
- [ ] Modal triggas korrekt
- [ ] **Audit-fix 7.1-7.3:** modal har mörk bakgrund (`--bg-portal-surface`, inte `--bg-elevated`/vit)
- [ ] Modal centrerad på skärmen (inte "missplacerat dropdown" upptill)
- [ ] Knappar ser ut som **knappar** (`.btn-outline` / `.btn-primary`), inte vänster-aligned listrader
- [ ] Settings-emoji (🦌🥃🧖) syns som label-prefix
- [ ] Val känns meningsfulla — konsekvens-rapportering syns?

### 8. hallDebateData → EventCardInline

**Var:** Portal event-slot (inline-event). Trigger: politiker-agenda + cooldown 8 omgångar + cap 3/säsong.
**Test:** Spela till säsong 2+ med varierad politiker-agenda. Hallfrågan ska dyka upp som inline-event.

**Verifiera:**
- [ ] Eyebrow "🏛️ KOMMUNEN" syns
- [ ] Event-title som extra rad ovanför body
- [ ] 2 px copper-stripe (inte dim — det är action-card)
- [ ] Val känns kännbara (vad händer efter val?)

### 9. smallAbsurditiesData → InboxScreen

**Var:** Inbox + RoundSummary. Injiceras via mediaService rad 203-227.
**Test:** Spela 5-10 omgångar. Humor-items dyker upp passivt i inbox.

**Verifiera:**
- [ ] Inbox-items dyker upp slumpmässigt
- [ ] Humor-tonen sittande (sture-Forsbacka, inte AI-slop)
- [ ] Trigger-frekvens rimlig (inte spammar inboxen)

### 10. arcService → ActiveArcsSecondary

**Var:** Portal secondary section + SeasonSummaryScreen rad 386-416 (säsongsslut).
**Test:** Spela till aktiv arc triggas. Villkor: hungrig spelare ≤21 utan mål 3+ matcher, eller veteran 34+ på sista kontraktsfasen, eller andra arc-triggers.

**Verifiera:**
- [ ] Kortet dyker upp i Portal med eyebrow **"I blickfånget"** (audit-fix 10.2 — inte "Arcs")
- [ ] Phase-progress + chevron-affordans synliga
- [ ] Glyph-system (A/B/C) följer mock-konvention
- [ ] **Audit-fix 10.5:** vid `urgent` (≤1 omgång kvar) — warm glyph color syns?
- [ ] Vid säsongsslut: arcs återupptas i SeasonSummary

---

## DEL B — FIX 47-50

### FIX-47: Scoreboard V1 (klocka mitten)

**Var:** Match-flöde, Stålvallen scoreboard.
**Verifiera:**
- [ ] Klocka är centrerad i scoreboard (1fr auto 1fr grid)
- [ ] ~35px höjd-besparing mot tidigare layout
- [ ] Inga regressions i lagnamn/score-rendering

### FIX-48: Slutskärm inline

**Var:** Slutet av en match. Tidigare overlay → nu inline i CommentaryFeed.
**Verifiera:**
- [ ] Slutskärm renderas inline i feed-flödet, INTE som overlay
- [ ] Granska-knapp leder till GranskaScreen
- [ ] Story + final score visas inline
- [ ] Inga regressions — alla detaljer från overlay finns kvar

### FIX-49: Pre-choice timer pengvärden

**Var:** Match-interactions (corner/penalty/counter/freekick/last-minute).
**Verifiera:**
- [ ] Corner: 5 sekunder pre-choice (var 3s tidigare)
- [ ] Penalty: 4 sekunder (var 2s)
- [ ] Counter: 5 sekunder (var 3s)
- [ ] Freekick: 6 sekunder (var 4s)
- [ ] LastMinutePress: 8 sekunder (oförändrad)
- [ ] Tid att läsa innan val ska kännas tillräcklig

### FIX-50: Lineup default = förra matchens elva

**Var:** Lineup-fliken före match 2+.
**Verifiera:**
- [ ] Förra matchens elva är förinställd
- [ ] Skadade/avstängdas slots är **tomma** (inte fyllda med dem)
- [ ] "Fyll bästa elvan" fyller bara tomma slots
- [ ] Pulse-animation körs alltid på tomma slots (PitchLineupView kontrast — synliga texter)
- [ ] Edge-case: alla 11 skadade → tomma slots + canPlay=false

---

## DEL C — F1 IMPLEMENTERADE DELAR

### Tutorial-band Säsong 1 Omg 1

**Var:** Portal vid första rundan.
**Verifiera:**
- [ ] Tutorial-band syns ovanför första active decision
- [ ] Förklarar varför budget = 1 (locked)
- [ ] Försvinner från Omg 2 (audit-fix H.4 — utan att Budget syns S1Omg1)

### PortalActiveBudget

**Var:** Portal när active decision finns.
**Verifiera:**
- [ ] Eyebrow byter mellan "Veckans fråga" (singular) och "Veckans frågor" (plural)
- [ ] Budget-prickar: ●● (2 aktiva max) / ●○ (1 aktiv) / ○○ (0)
- [ ] Locked-prick visas EJ S1Omg1 (audit-fix H.4 — komponenten gömd helt)
- [ ] Locked-prick visas Omg 2+ när 1/2 är aktiv

### PortalInboxCounter

**Var:** Botten av Portal.
**Verifiera:**
- [ ] Format: `[N aktiva · M i kö · K notiser i inboxen]`
- [ ] 0-kategorier göms (visa inte "0 i kö")
- [ ] **Audit-fix H.3:** `border-top: 1px dashed` + 14 px margin-top mot sekundär ovanför

### Queue-rail (BEROENDE PÅ STAGE 1)

**Var:** Portal mellan Active och Secondary.
**Verifiera ENDAST OM** `game.deferredDecisions[]` populeras:
- [ ] Queue-rail dyker upp när 2/2 aktiv + 3:e trigger sker
- [ ] Eyebrow "⏳ I KÖ" + räknare
- [ ] Käll-chip per källa (max 4 chip — annars "+N fler")

Om queue-rail aldrig dyker upp trots att du sett 2+ samtidiga decisions: backend Stage 1 är inte klar. Säg till mig.

### CooldownRow (BEROENDE PÅ STAGE 2)

**Var:** Botten av source-secondary-kort.
**Verifiera ENDAST OM** Stage 2 är klar (source-specific cards):
- [ ] CooldownRow syns på källor med aktiv cooldown
- [ ] Amber-prickar tickar ner per omgång
- [ ] Källan kan trigga decisions igen när roundsLeft = 0

Om ingen CooldownRow någonstans: Stage 2 är inte klar. Förväntat baserat på Code-rapportens tystnad om det.

---

## DEL D — AUDIT-FIXAR ALLMÄNT

### Stripes-hierarki (BLOCK H.1)

**Var:** Portal med 4+ kort.
**Verifiera:**
- [ ] Action-cards (EventCardInline, WeeklyDecisionSecondary aktiv) har **3 px copper-wide** stripe
- [ ] Info-cards (BoardObjectivesSecondary, ActiveArcsSecondary) har **2 px dim 40% opacity** stripe
- [ ] Hierarkin är **kännbar** — action-cards drar ögat först
- [ ] Severity-systemet (`--cold`/`--warm`) opåverkat

### Cup-tonen Nivå 1 sampling

**Var:** Cup-match omg 1 eller kvart.
**Verifiera:**
- [ ] Cup-strängar plockas i kickoff/goal/fullTime (~60% av tiden)
- [ ] Strängarna känns tonalt rätta — oktober-känsla, lågmäld dramatik
- [ ] `cup_goalOpener` plockas BARA matchens första mål (Alt B)
- [ ] Cup-finalen plockar fortfarande generic `final_*` (Nivå 2 inte integrerad än)

Citera 2-3 cup-strängar som du faktiskt såg så vi vet samplingen funkar.

---

## DEL E — ÖVERGRIPANDE OBSERVATIONER (på fri form)

Efter playtest-passet, notera:

1. **Inbox-volym per runda:** Är det 10-20 items som flow-audit förutspådde? För mycket att läsa?
2. **Portal-upprepning:** Visas `next_match` (default-fallback) i de flesta omgångar? Eller varierar primary-kortet rimligt?
3. **Vad klickade du igenom utan att läsa?** Det är dött content som ska antingen tas bort eller göras intressantare.
4. **Vad var det MEST intressanta som hände under playtesten?** Antingen för att flagga det som styrka, eller för att förstå varför annat bleknar.
5. **Hostade tonen någonstans?** AI-slop som smugit sig in i kafferum, anslag, commentary?

---

## RAPPORTERING TILL MIG

Efter playtest, skicka per-del-rapport eller bara fynd-lista. Ingen sammanställning krävs — jag konsoliderar och uppdaterar trackers. Format spelar ingen roll, men ange tydligt vilken DEL + numrering.

**Viktigt:** Om något känns trasigt — copy/paste vad du såg/inte såg. Skärmdump om du orkar. Spara inte fynd till senare — säg direkt så vi kan styra Code-prioriteringen löpande.
