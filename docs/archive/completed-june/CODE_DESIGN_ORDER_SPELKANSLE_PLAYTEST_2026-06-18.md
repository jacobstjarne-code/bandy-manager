# Code/Design-order — spelkänsle-playtest 2026-06-18

Källa: live-playtest av build c78a22d (låg BAKOM arbetsträdet — flera fynd kan redan vara
åtgärdade i trädet; verifiera mot HEAD före arbete). A+B levererade i c78a22df..f85acb5d.
Diagnoser i sessionslogg. Ägare: [Code] implementerar, [Design] mockar/asset, [Opus] svensk copy
(skriven direkt, ej spec:ad).

## Klart av Opus i arbetsträdet (committa)
1. Copy-edits — alla additiva/build-säkra:
   - burnout `quotesByZone`/`helpersByZone` (managerKaraktarText.ts)
   - matchCommentary: hawaii + vänder-ur
   - assistantCoach vill-mer ×3 per personlighet
   - portalBeats `transfer_window_open` → "Transferfönstret öppet" (namnger fönstret)
   - injuryContextText.ts (NY fil) + InjuryStatusSecondary-wiring (skadad-kortets kontextrad,
     proportionerlig mot severitet — ersätter `null`-fallet för enskild icke-nyckelskada)

## Code
2. BurnoutMark-picker → quotesByZone/helpersByZone + no-repeat; ta bort flat fallback.
3. Pressrubrik: lägg surface-diskriminator i pickHeadline-seed (portal/inkorg/media får ej samma pick).
4. Match-laddning säsong-1-villkor ("det som hände i höstas" får ej visas säsong 1).
5. Ta bort "📖 Spelguide" ur GameHeader gear-menyn (dubblett av "?").
6. restartCoachMarks → navigera Home först (CoachMarks mountas ej i GameShell → targets saknas från Inbox).
7. Inkorgens empty-state → scen-röst (--font-display italic), konsekvent med "Resultat … bor i Granska".
8. Match-laddningsscen + ankomst + band: dölj BottomNav (CEREMONY_PATHS eller sceneActive) så CTA blir nåbar.
   Verifiera om de är rutter eller pendingScenes. Gäller alla tre fullskärms-scener — naven skymmer CTA:n,
   scenerna scrollar inte, bara "Hoppa över" tar sig ur ankomsten.
9. Efterklang nemesis: grinda så kandidaten bara visas när n.clubId == nästa motståndare ("Slottsbron igen" blir sant).
10. Verifiera att efterklang-grinden (playedLeague < 5) finns i nästa build (visades felaktigt i premiären i c78a22d).
11. Veckans beslut — bygg klart stubbarna (INTE skrota):
    - scout_opponent_corners "Ja": anropa generateDetailedAnalysis för nästa motståndare,
      lagra i opponentAnalyses; upptag scouten den omgången (kostnad). Surfa analysen på matchförberedelse.
      Bekräfta först att detaljerad analys är gated bakom scoutning (annars redan gratis).
    - training_corners_vs_matchprep "Matchprep": enmatchs positioneringseffekt via leadershipActions-mönstret
      (effect{stat,delta} + expiresRound). Bekräfta att motorn läser leadershipActions under match.
    - Synlig effekt-kvittens på besluten. Opus skriver om etiketterna när effekterna är satta.
12. Inkorg: agerbara poster routar till sin handlingsyta (Frida-tifo → beslutskort/decision; Transfer-notiser → Transfers)
    ELLER inline-actions. Inline bara där ingen yta finns. Rena rubriker (Helena Wikström) får body eller slutar se klickbara ut.
    Detta är interruptClassifier/KF3-routningen.

## Design
13. Band-tiern (svit-laddning): visuell förankring (svag fond/ortssiluett) så "intentional stillness" landar i stället
    för att läsa som tomt. Scen-placeholders (cup/derby/nyår saknar asset): kommunicera "illustration på väg"
    tydligare än "⬩ NAMN ⬩".

## Öppet beslut (Jacob/Code)
14. transfer_window_open-beaten: copyn namnger nu fönstret (KLART). Att LÄNKA den till Transfers bryter beat-kontraktet
    (beats är text-bara, stängbara, flavor — ej action). Antingen utöka beat-systemet med länk-fält, eller promota
    notisen till ett kort. Inte en självklar vinst — beats är medvetet flavor. Beslut krävs.
15. Porträtt-PNG ligger bara på spelarkortets hjälte (22px-thumbnails i trupp/omklädningsrum är kvar på SVG).
    Kemi-lagret på taktiken är en vy-växling (Formation ↔ Kemi), inte äkta z-overlay med spelare + linjer samtidigt.
    Båda medvetna avgränsningar från Code — egna rundor om de ska byggas ut.

## Meta (genomgående)
Lärdom #9 för interaktion: varje löfte spelaren ser — etikett, citat, förfrågan, notis — måste backas av en riktig,
läsbar konsekvens. Gäller efterklang (9), veckans beslut (11), inkorgen (12), fönster-notisen (14).
