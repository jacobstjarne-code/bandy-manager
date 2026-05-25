# FLOW & CODE AUDIT — Bandy Manager 2026-05-14

Genomgång av spel-flödet, dold funktionalitet och misstänkt trista sekvenser. Inte uttömmande — fokus på det mest aktionabla.

---

## DEL 1 — DÖDFÖDDA SCENER (explicit disabled i koden)

Tre scener finns implementerade som komponenter och data, men har sina trigger-funktioner returnerande `false`:

### 1. `board_meeting` ❌
- **Var:** `sceneTriggerService.ts → shouldTriggerBoardMeeting()`
- **Status:** Disabled 2026-05-10. Innehållet flyttat till `season_kickoff`-anslag i `boardAnslag.ts`.
- **Vad är kvar:** `BoardMeetingScene.tsx` + `boardMeetingScene.ts` (data).
- **Verifiera:** Är hela komponenten + datan död kod? Kan tas bort, eller kommer den användas i framtida iteration?

### 2. `cup_intro` ❌
- **Var:** `sceneTriggerService.ts → shouldTriggerCupIntro()`
- **Status:** Disabled 2026-05-10. Innehållet flyttat till `cup_first_match`-anslag.
- **Vad är kvar:** `CupIntroScene.tsx` + `cupIntroScene.ts`.

### 3. `season_signature_reveal` ❌
- **Var:** `sceneTriggerService.ts → shouldTriggerSeasonSignature()`
- **Status:** Disabled 2026-05-10, "gammal artefakt".
- **Vad är kvar:** `SeasonSignatureRevealScene.tsx` + `seasonSignatureReveal.ts` (SIGNATURE_REVEAL_DATA).
- **Notering:** Kommentaren säger datan kan användas för "väder-koppling, mid-season-trigger". Är det realistiskt?

**Action:** Antingen återanvänd scene-komponenterna för annan trigger, eller ta bort dem. Just nu är de "schemat sand" — kod som körs aldrig men finns i bundle.

### Aktiva scener (4 stycken)
- `sm_final_victory` — one-shot, kräver final-vinst
- `sunday_training` — one-shot, första matchen
- `cup_final_intro` — pre-cup-final  
- `coffee_room` (nu Kafeterian) — recurring, cooldown 3 omgångar

Allt annat "narrativt nedslag" går via anslag eller events.

---

## DEL 2 — PORTAL CARDS: TRIGGER-PROFIL

22 kort i 3 tiers. Alla har triggers, men profilen är ojämn.

### Primary (6 kort)
- `next_match_smfinal` (w=100) — kräver SM-final, **sällsynt**
- `event_critical` (w=95) — kräver hasCriticalEvent
- `transfer_deadline_close` (w=90) — kräver <3 omgångar till deadline
- `next_match_derby` (w=80) — kräver derby
- `patron_demand_unmet` (w=70) — kräver patron-demand >3 omgångar
- `next_match` (w=10) — **alwaysTrue, default-fallback**

→ I 90% av matcher visas `next_match`-kortet eftersom hög-prio-triggers är sällsynta.

### Secondary (12 kort)
- `board_objectives` (w=87) — kräver pågående mål
- `weekly_decision` (w=85) — kräver `pendingWeeklyDecision` (vad triggar det? Se DEL 4)
- `active_arcs` (w=80) — kräver aktiv arc som inte är derby_echo/resolving
- `open_bids` (w=80) — pågående transfer-bud
- `injury_status` (w=70) — skadade i startelvan
- `journalist_card` (w=65) — `shouldShowJournalistCard` (oklar visibility-regel)
- `coffee_room_card` (w=60) — kafeterian tillgänglig
- `opponent_form` (w=60) — `nextMatchIsBigGame`
- `klacken` (w=50) — hemmamatch
- `season_signature_card` (w=40) — kräver sig.id !== 'calm_season' (**hur ofta är säsongssignaturen NÅGOT annat än calm?**)
- `tabell` (w=30) — alwaysTrue
- `ekonomi` (w=25) — alwaysTrue

→ Misstänkt sällan-synliga: `journalist_card`, `season_signature_card`, `patron_demand_unmet`. Kräver djupdyk i triggers för att veta exakt visningsfrekvens.

### Minimal (4 kort)
- `klacken_mood_minimal` (w=60) — kräver derby
- `squad_status` (w=50) — alwaysTrue
- `form_status` (w=40) — alwaysTrue
- `economy_minimal` (w=30) — alwaysTrue

→ `klacken_mood_minimal` visas bara vid derby. Resten är alltid-synliga "trygg-info".

**Action:** Kör en runda och logga vilka kort som faktiskt renderas över 22 omgångar + cup. De som aldrig dyker upp är de-facto dödfödda för normal-spelaren.

---

## DEL 3 — DOLD FUNKTIONALITET (services som processas men oklar UI-koppling)

Följande processar i `roundProcessor` varje runda men det är osäkert hur synliga de är för spelaren. Var och en behöver verifieras: triggas det? Visas resultatet?

### Klart synliga via inbox/dashboard
- ✅ `transferProcessor` — bud, deadlines (synligt i Transfer-vyn + inbox)
- ✅ `mediaProcessor` — rubriker (synligt i Granska/anslag)
- ✅ `scoutProcessor` — scout-reports (synligt i Spaning-vyn)
- ✅ `playerStateProcessor` — skador/avstängningar (inbox)
- ✅ `economyProcessor` — ekonomi (Ekonomi-vyn + Ekonomi-kort)
- ✅ `boardService` — board feedback vid omgång 7/14/22 (inbox)
- ✅ `cupProcessor` + `playoffProcessor` — cup/SM-flöde

### Möjligt dolda (processas men resultatet syns kanske inte)
- ⚠️ **`chemistryStats`** — `updatedChemistryStats[key] = (existing) + 90` per startande spelar-par per match. Var visas detta? Inkluderas det i match-engine? Eller ackumuleras det utan effekt?
- ⚠️ **`clubEraService`** — `calculateClubEra(game)` + `eraLabel(newEra)` + era_shift Moments. Var visas eran? Finns det en "Klubben är i en establishment-era"-vy?
- ⚠️ **`trainerArcService`** — `updateTrainerArc(...)`. Vad är arc-stadiet och visas det någonstans?
- ⚠️ **`journalistRelationship`** — broken_under_20 + recovered_above_75 inbox-mejl. Detta visas men: hur ofta hamnar relationship där? Visas relationship-värdet för spelaren någonstans?
- ⚠️ **`nemesisTracker`** — uppdateras vid derby-vinster. Var ser man vem som är ens nemesis?
- ⚠️ **`pendingVictoryEcho` + `victoryEchoExpires`** — narrativ effekt. Var dyker echo upp? Inbox? Anslag?
- ⚠️ **`facilityProjects` + `facilityBonusTotal`** — facility-upgrades. Finns det en facility-vy?
- ⚠️ **`volunteers` + `volunteerMorale`** — frivilliga. Var visas dem? Bara i kafeterian-citat?
- ⚠️ **`mecenater` (mecenat-system)** — `applyMecenatSpawn` skapar nya mecenater. Var visas dem? `mecenatDinnerService` antyder en middag-mekanik — finns den?
- ⚠️ **`refereeService` + `refereeRelations` + `pendingRefereeMeeting`** — domarrelationer. Finns det en referee-vy eller är det bara värden som påverkar matcher i bakgrunden?
- ⚠️ **`pressConferenceService` + `pendingPressConference`** — `WEAK-002 + DEV-002` press-event går till `pendingPressConference` "som visas direkt i GranskaScreen". Är pressmeetingen meningsfull eller bara en klick-igenom-skärm?
- ⚠️ **`awayTripService` (WEAK-019)** — bortaresa-microdecision. När triggas den och hur ofta? Är beslutet kännbart?
- ⚠️ **`riskySponsorContract` + risk maturation** — Lager 2 finansiell risk med 25% chans per omgång efter `riskMaturityRound`. Finns hela kedjan: erbjudande → kontrakt → maturity → exponering? Var ser man risken inbakad?
- ⚠️ **`recentMoments` (era_shift, derby_win, captain_crisis, star_injury)** — sparas i `recentMoments`-array. Var renderas Moments? Visas de som anslag, inbox-items, eller bara dasboard-tickers?
- ⚠️ **`playerNotesService`, `playerVoiceService`** — spelar-anteckningar och röst. Var används de?

### Förmodligen experimentella/bortkopplade
- ❓ **`schoolAssignmentService`** — vad är "school assignment"? Spelarstudier?
- ❓ **`bandyGalaService`** — bandyns gala. Var triggas det? Sker det årligen?
- ❓ **`bandyLetterService`** — bandy-brev. Vad är det?
- ❓ **`midSeasonEventService`** — vad triggar mid-season-events?
- ❓ **`reputationMilestoneService`** — milestones. Visas de?
- ❓ **`hallDebateService` + `hallDebateEvents`** — debatt-mekanik. Aktiv?
- ❓ **`leadershipService`** — ledarskapsmekanik?

**Action:** För varje ⚠️ och ❓ i listan: trace var resultatet syns för spelaren. Om resultatet aldrig syns → flagga som död kod eller bygg synlighet.

---

## DEL 4 — MISSTÄNKT TRISTA SEKVENSER

Baserat på flödet jag känner till — verifiera mot playtest:

### Pre-match (Plan & Taktik)
- **Plan-fliken (Lineup):** efter FIX-50 är detta bättre. Default är förra elvan, tomma slots för skadade, "Fyll bästa elvan" är meningsfull. ✅
- **Taktik-fliken:** mentality/tempo/press-dropdowns. Är valen kännbara? Eller bara klicka-igenom?
- **Tryck "Nästa: Taktik →" → "Starta match →"** — två klick. Trivialt men inte trist.

### Matchen själv
- **Interactions** (corner/penalty/counter/freekick/last-minute) — bra mekanik, men hur ofta får man en? Om man bara får 2-3 interactions per match är 95% av tiden passiv visning av commentary feed.
- **HalftimeModal** — paustaktik. Är valen meningsfulla?
- **MatchControls** (snabbspola, taktik, hetta) — bra. Men efter snabbspolning är man tillbaka i passivt läge.
- **Slutskärm (FIX-48)** — nu inline. ✅

### Post-match: Granska-vyn
- **GranskaScreen** — visar events, ratings, story. Är detta klick-igenom eller får man insikter?
- **PressConference** — `pendingPressConference` triggas i Granska. Meningsfullt eller filler?
- **AwayTrip-microdecision** — verkligen ett kännbart val?

### Mellan-rundor (Portal/Dashboard)
- **Portal** — visar 1 primary + 3-4 secondary + några minimal. För default-fallback (`next_match`) är primary-kortet samma varje runda. Trist om secondary inte varierar.
- **Inbox** — efter en runda är det 5-15 inbox-mejl typiskt (board feedback, match result, injury, transfer, sponsor, milestone, market value change). Det är **mycket att läsa**. Risk: spelaren börjar inte läsa.
- **Anslag (board/cup/league)** — när dyker dessa upp? Är de modaler? Om de stackar med inbox blir det "klicka bort"-fas.
- **Weekly decision** — finns men oklar trigger-frekvens.

### Säsongsslut
- **seasonEndProcessor** — kollar `seasonSummaryService`. Vad visas vid säsongsslut? Press, bandygala, retirements?
- **retirementService** — spelar-retirement. Visas det meningsfullt?

**Action:** Spela en kvalrund + 5 omgångar + en helsemester. Lista exakt vad du klickar igenom och vad du läser ordentligt. Det som klickas igenom är dött content.

---

## DEL 5 — INBOX OVERLOAD

I `roundProcessor` läggs item till inbox från **många** källor per omgång:
- Match result + injuries + suspensions + recoveries
- Board feedback (omgång 7/14/22)
- Board objectives check-in (samma omgångar)
- Career milestones (för managed-spelare)
- Market value changes (≥15% och ≥10k kr)
- Transfer-related (bids, deadlines, accepts/rejects)
- Loan deals
- Sponsor chain effects + patron + nudges
- Contextual sponsors
- Risky sponsor risk maturation
- Mecenat spawn
- Youth processing
- Media (rubriker, journalist, rumors)
- Post-match events (insändare, opponent quotes)
- Scandals
- Special-date inbox (annandagen, finaldag, cup-finalhelgen)
- Atmospheric events som droppats från queue (cap MAX 2 per runda)
- Follow-ups som triggar
- Journalist relationship events
- Spilled low-prio events

→ MAX_INBOX = 50. Trimming sker. Men 15-20 nya items per runda är troligt vid hög aktivitet.

**Action:** Räkna faktiska inbox-items över 3 omgångar i playtest. Om snittet är >10/runda är det too much. Föreslå: aggregera kategorier ("3 spelarvärden ändrades" istället för 3 separata items).

---

## DEL 6 — PORTAL: VARIETY-RISK

Default-fallback `next_match` (w=10, alwaysTrue) visas när inget annat triggas. Säsongens "vanliga matcher" (icke-derby, icke-SM-final, ingen kritisk event, ingen patron-demand) är **majoriteten av omgångarna**.

Result: spelaren ser samma primary-kort i 15-18 av 26 omgångar.

**Action:** Lägg till en mid-prio variant — t.ex. `next_match_form_focus` (när man har form-streak), `next_match_revenge` (när motståndaren senast slog dig), `next_match_milestone_close` (om en spelare är 1 mål från milestone). Det skulle variera primary-kortet utan att kräva derby/SM-final.

---

## SLUTSATSER & PRIORITERAD KÖ

1. **Ta beslut om 3 dödfödda scenerna** — återanvänd eller ta bort (snabb cleanup)
2. **Auditera UI-synlighet för ⚠️-services** — speciellt chemistry, klub-era, mecenater, refereerelationer, awaytrip. Antingen synliggör eller flagga som bakgrundsstatistik
3. **Räkna inbox-items per runda i playtest** — om >10 är det overload
4. **Primary card variety** — lägg till 2-3 mid-prio next_match-varianter
5. **Verifiera meningsfullhet i:** PressConference, AwayTrip-microdecision, Weekly decision, Taktik-fliken

Den största risken för "trist" är inte enskilda skärmar — det är UPPREPNING. Efter 5-10 omgångar har spelaren sett varje typ av interaktion. Frågan är: lägger varje vecka till något nytt eller är det samma loop?

---

## ÖPPNA FRÅGOR FÖR DJUPARE AUDIT

Per system, om du vill att jag gräver vidare:
- **A.** Inbox-volym + dedup-strategi
- **B.** Visibility-audit per service (var i UI syns resultatet?)
- **C.** Variety per primary/secondary-kort (logga vad som triggas över 26 omgångar)
- **D.** Granska-vyns meningsfullhet (vad gör spelaren där?)
- **E.** Säsongsslut-flödet (vad händer mellan säsonger?)

Säg vilket område du vill djupdyka i härnäst.
