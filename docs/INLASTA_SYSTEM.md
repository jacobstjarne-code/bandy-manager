# Inlåsta system — synliggörande-tracker

**Skapad:** 2026-05-06
**Senast uppdaterad:** 2026-05-07

## Rot-problem

Audit:n "Bandy Manager — Genomgång maj 2026" identifierade tio bakomliggande system som finns i kod men aldrig nådde spelaren. Detta är spelets största "vi vet men gör inte"-gap. Jacob har påpekat att system-gapet återkommer trots upprepade flaggor — denna fil existerar för att hindra glömska.

## Princip

**Ingen ny feature-yta påbörjas innan minst 1 inlåst system per session lyfts ett steg i status.**

Sessioner ska alltid avancera trackerns sammanlagda status. Mock + spec räknas som ett steg. Implementation räknas som nästa. Verifierad playtest räknas som tredje. Tio system × tre steg = trettio status-steg som ska klockas av.

## Statusnyckel

- 🔴 Inte adresserat — ingen spec, ingen mock, ingen implementation
- 🟡 Spec + mock klar (Opus levererat, väntar Code)
- 🟠 Implementation klar (Code committat, ej playtest-verifierad)
- 🟢 Verifierad i playtest (Jacob bekräftat synlighet i appen)

## Status-tabell

| # | System | Status | Senast | Rendering | Anteckning |
|---|---|---|---|---|---|
| 1 | `boardObjectiveService` | 🟠 | 2026-05-07 | `KlubbTab.tsx:618` + `BoardObjectivesSecondary.tsx` (Portal secondary) | Implementation verifierad i kod + Portal-secondary-card (commit ad43cce) med progress-indikator + chevron-affordans. Nudge-bug fixad (commit fd758fe). Migration för gamla saves är väntande Code-fix. Väntar playtest. |
| 2 | `opponentAnalysisService` | 🟠 | 2026-05-07 | `LineupStep.tsx:context-strip` + `TacticStep.tsx:opp-insight` | Basic i context-strip (form+formation). Detailed i TacticStep (styrka/svaghet/rekommendation+nudge). Synliggjort i Spela-redesign 2026-05-07. Väntar playtest. |
| 3 | `weeklyDecisionService` | 🟠 | 2026-05-07 | `WeeklyDecisionSecondary.tsx` (Portal secondary section) | Implementation klar (commit 3b06ce6). Komponent renderar pending-state med label + fråga + två option-knappar, samt resolved-state med checkmark + outcome-text. Registrerad i `initCardBag.ts` med trigger `!!game.pendingWeeklyDecision`. Väntar playtest. |
| 4 | `leadershipService` + `useLeadershipAction()` | 🟠 | 2026-05-07 | `PlayerCard.tsx:~676` + `SquadScreen.tsx:~286` | Knapp + feedback-toast per ledarskapsaction. Nås via SquadScreen → Nu-flik → öppna spelarkort. Väntar playtest. |
| 5 | `rumorService` | 🟠 | 2026-05-07 | `RoundSummaryScreen.tsx:460–472` | Output som inbox-items under "TRANSFERRYKTEN" i RoundSummaryScreen. Triggas av `generateTransferRumor` i mediaProcessor. Väntar playtest. |
| 6 | `playerVoiceService` | 🟠 | 2026-05-07 | `PlayerCard.tsx:676` | Italic quote under spelarkort (20% chans + form/moral-villkor). Samma yta som leadershipService. Väntar playtest. |
| 7 | `mecenatDinnerService` | 🟠 | 2026-05-07 | `MecenatDinnerEvent.tsx:16–85` via `EventOverlay.tsx:79` | Modal popup vid `event.type === 'mecenatDinner'`. Nås via Portal/Dashboard event-trigger. Väntar playtest. |
| 8 | `hallDebateData` | 🟠 | 2026-05-07 | `EventCardInline.tsx:48` + `EventOverlay.tsx` (default modal) + `hallDebateService.ts` | Implementation klar (commit ad43cce). Service genererar `event.type === 'hallDebate'`-events från `HALL_DEBATE_EVENTS`-poolen med politiker-agenda-driven trigger, cooldown 8 omgångar, cap 3/säsong. Väntar playtest. |
| 9 | `smallAbsurditiesData` | 🟠 | 2026-05-07 | `InboxScreen` + `RoundSummaryScreen` | Injiceras som inbox-items via `mediaService.ts:203–227`. Nås passivt — spelaren ser det i inbox om det triggas. Väntar playtest. |
| 10 | `arcService` + storylines | 🟠 | 2026-05-07 | `SeasonSummaryScreen.tsx:386–416` (säsongsslut) + `ActiveArcsSecondary.tsx` (Portal in-säsong) | Implementation klar för både säsongsslut och in-säsong-yta (commit ad43cce). Portal-secondary card visar pågående arcs med phase-progress + chevron-affordans. Väntar playtest. |

**Sammanlagd status:** 20/30 status-steg klockade (10 system på 🟠, 0 på 🟡, 0 på 🔴). Alla system har nått minst implementation — väntar playtest för 🟢-uppgradering.

## Prio-ordning för Opus-leveranser

Nästa steg mot 🟢 per system (prioriterad):

1. 🟠→🟢 `boardObjectiveService` — Portal-secondary card implementerad (commit ad43cce). Code-uppgift kvar: migration-fix för `boardPersonalities` på gamla saves. Sedan playtest.
2. 🟠→🟢 `opponentAnalysisService` — playtest Spela-flödet, bekräfta att opp-insight + recommendation syns
3. 🟠→🟢 `weeklyDecisionService` — implementation klar (commit 3b06ce6). Spela 3+ omgångar i nytt spel, verifiera att kortet dyker upp i Portal secondary section.
4. 🟠→🟢 `leadershipService` — playtest SquadScreen Nu-vy → spelarkort
5. 🟠→🟢 `hallDebateData` — implementation klar (commit ad43cce). Playtest från säsong 2+ med varierad politiker-agenda för att se hallfrågan dyka upp.
6. 🟠→🟢 `arcService` — Portal-secondary card implementerad (commit ad43cce). Spela tills aktiv arc triggas (hungrig spelare ≤21 utan mål 3+ matcher, eller veteran 34+ på sista kontraktsfasen).
7. 🟠→🟢 `rumorService` — playtest, kontrollera att transferrykten dyker upp i RoundSummary
8. 🟠→🟢 `playerVoiceService` — playtest, triggkontroll (20% chans)
9. 🟠→🟢 `mecenatDinnerService` — playtest, kontrollera att event-modal triggas
10. 🟠→🟢 `smallAbsurditiesData` — playtest, kontrollera att humor-items når inbox

## Avhakningsregler

- När spec+mock landat: status → 🟡, datum uppdateras, länkar läggs in i tabellen.
- När Code rapporterar implementation klar: status → 🟠.
- När Jacob bekräftat synlighet i playtest: status → 🟢.
- Endast 🟢 räknas som "klar".
- Om något system regrederar (försvinner från UI igen) → status tillbaka till 🟠 eller lägre.

## Arbetsregler

- **Varje session:** kontrollera tracker först. 
- **Vid playtest:** notera vilka inlåsta system som faktiskt syntes.
- **Vid feature-pitch:** om någon föreslår ny feature medan ≥7 system är 🔴, fråga: kan denna feature vänta tills minst 5 system är 🟡?
