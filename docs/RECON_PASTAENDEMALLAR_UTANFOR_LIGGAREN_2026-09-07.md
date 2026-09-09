# Recon — påståendemallar utanför liggar/provenBy-familjen

**Codex read-only recon 2026-09-07.** Populationen som `sluttest-missing-check-grind`
DEL 2 ska grinda: textmallar som påstår att något hände/är så men INTE går genom
`momentViewTemplates.ts`/liggaren. Underlag för Opus-domen på MASTER-raden (scope +
prioritet). Inget byggt — detta är kartan Code bygger grinden från, fil för fil.

## Meta-fynd: ett halvbyggt föregångarsystem finns redan

`@cites`-JSDoc-taggen (PÅSTÅENDEGRINDEN nivå 1, `docs/PASTAENDEGRINDEN_2026-08-24.md`),
kollad syntaktiskt av `tests/grind/citesDeclaration.ts` + `pastaendeGrindNiva1.test.ts`:
verifierar bara att det citerade fältnamnet **förekommer i funktionskroppen** — INGEN
körtids-sanningskoll, till skillnad från `provenBy`s ledger-närvaro-verifiering.
**58 taggar över 36 filer**, alla utanför `momentViewTemplates.ts`. Så en del av
"utanför liggarfamiljen" har redan en deklarerad-men-overifierad källa; gapet där är
körtidstvång, inte deklaration från noll. `boardObjectiveService.ts` (2) och
`seasonSummaryService.ts` (9) är delvis taggade. Filer med noll `@cites` OCH noll
`provenBy` är den genuint odeklarerade populationen.

**Opus-princip (MASTER-raden):** `@cites` och `provenBy` ska KONVERGERA till ETT
kontrakt (provenBy = den körtidsverifierade versionen `@cites` skulle varit), inte
två parallella halvgrindar.

## (a) Kandidater — verkliga påståenden, deklarerbar källa, implicit eller bara syntaktiskt taggad

| Subsystem | Fil(er) | Påstående | Deklarerat? | Storlek |
|---|---|---|---|---|
| **events/*** (högst historisk buggdensitet — flest *Truth.test.ts: patron, mecenat, sponsor, community, captainSpeech, icaMaxi, journalistExclusive, politician, supporter, playerMediaComment, hallProcess) | `patronEvents.ts`, `postAdvanceEvents.ts`, `eventFactories.ts`, `eventResolver.ts`, `hallProcessService.ts` | Event-kroppstext påstår t.ex. "patron X vill diskutera partnerskap", kaptenstal, sponsorreaktioner, community-skiften | Partial — `@cites` finns (nivå 1, syntaktisk), ingen körtidsgrind; ~12 Truth-tester som ad-hoc-ersättning | ~30+ event-kropp-former |
| **Presskonferens** | `pressConferenceService.ts` — TAG_DEFS (26 taggar), PLAYER_RESPONSES | Varje taggs predikat påstår ett matchfaktum (win_big, loss_referee, winter, relegation…) sant innan frågan/svaret visas | Partial — `@cites` på modulnivå men varje av 26 TAG_DEFS-predikat är sitt eget overifierade påstående; seedens "Pressfrågan-gate" | 26 predikat-former |
| **CS-press** | `csPressEventText.ts` — CS_PRESS_QUESTIONS | Ton/innehåll implicerar `game.journalistRelationship`-band (≤33/34-66/≥67) | Implicit — inga `@cites`; `csPressCausePrefix.test.ts` som ad-hoc-vakt | 3 band |
| **Styrelse** | `boardObjectiveService.ts` (2 @cites), `boardService.ts`, `boardMeetingStateResolver.ts`, `boardMeetingCopy.ts`, `boardMeetingScene.ts` | Verdict/mood-text påstår uppfyllt/missat mål, tålamodsnivå | Partial `@cites`, ej körtidsgrindat | ~5-8 former |
| **Skandal** | `scandalService.ts` — checkScandalTrigger, SCANDAL_TEXT | Narrativet namnger en specifik klubb/typ som orsak | Helt implicit — noll `@cites`, ingen Truth-vakt | ~6 typer |
| **Matchkommentar (trait)** | `matchCommentary.ts` — getTraitCommentary | **TROLIG LEVANDE BUGG:** gate:ar på `player.trait === 'ledare'` där den borde läsa `Player.isCaptain` — samma proxy-fält-buggklass som tidigare | Implicit och sannolikt felmatchad | 10 former |
| **Matchkommentar (pool)** | `matchCommentary.ts` — huvudpool + pickCommentary | Mål/räddning/höjdpunkt implicerar ställning, minut, spelare | Implicit — korrekthet hänger helt på att anroparen skickar rätt fält | Stor pool, 1 mekanism |
| **Matchens Samband** | `matchensSambandText.ts` (sambandTextA-K) + `matchensSambandService.ts` | Varje mening hävdar att en specifik stat drev resultatet (hörnor, skott, halvtidstaktik, POTM) | Implicit — noll `@cites`, positionsargument | 13 former |
| **Halvtid** | `halfTimeSummaryService.ts` | Påstår taktikbyte skett / halvtidsläge | Implicit, noll `@cites` | ~3-5 former |
| **Manager-kvitto** (seed-buggens hemfil) | `managerKvittoText.ts` | Text speglar managerns eget halftime_tactic/pep_talk-val | Implicit — original kvittoDir/window-buggen fixad ad hoc, inget deklarerat kontrakt tillagt | ~6-8 former |
| **Säsongssammanfattning** | `seasonSummaryService.ts` (9 @cites, störst) | Mästar-mening, "två sanningar", slutspelsnarrativ | Partial — mest `@cites`-taggad redan, ej körtidsverifierad | ~10+ former |
| **Kontraktsförhandling** | `contractTermText.ts` | Hävdar exakta kr-belopp bundna till en term | Implicit, inga `@cites` | ~8 former |
| **Journalistrubriker** | `journalistHeadlineStrings.ts` — pickHeadline | Rubrik hävdar matchutfallsnivå per persona | Implicit, inga `@cites` | 5 buckets × 4 personas |
| **Skada** | `injuryDoctorText.ts`, `injuryStories.ts` | Läkar/story-text hävdar skadegrad, återhämtning | Implicit, noll `@cites` | ~6-10 former |
| **Funktionärscitat** | `functionaryQuoteService.ts` | Citat implicerar afterWin/afterLoss/derby/lowFinances-villkor | Implicit, noll `@cites` | ~5 former |
| **Transfersvar** | `transferResponseText.ts` | Spelar/klubb-svar implicerar att ett buds villkor vägts | Implicit, noll `@cites` | ~5-6 former |

## (b) Exkluderade — flavor/mood, inget faktapåstående

- `coffeeRoomQuestionsText.ts` (Stures 6 frågor + "returns"-eko) — samtalston och
  callbacks till spelarens egna tidigare dialogval; ingen påstådd game-state.
- `coffeeRoomService.ts` selectCoffeeRoomLedgerEcho — går redan genom eventLedger/eko,
  ledger-familj-angränsande, inte en ny lucka.
- `retirementText.ts` RETIREMENT_CARD_QUOTES — åldersgrenad reflektion, texten hävdar
  inget specifikt faktum, bara mood.
- `matchCommentary.ts` generiska icke-trait mål/räddnings-flavor — färgkommentar, inget
  kontrollerbart påstående.

## Prioritet (Opus-dom på MASTER, buggdensitet + release-lins)

1. **`events/*` FÖRST** — mest sanningsbuggar historiskt, `@cites`-groundwork finns
   (högst risk, lägst kostnad).
2. **`pressConferenceService.ts` TAG_DEFS** — seedens namngivna "Pressfrågan-gate",
   26 overifierade predikat i en fil.
3. **`matchCommentary.getTraitCommentary`-buggen** — konkret, trolig levande bugg;
   fixas OBEROENDE av grinden (kaptenstext ska läsa `isCaptain`).
4. **Nolldeklarerade filer** (scandalService, matchensSamband, contractTermText,
   journalistHeadlines, injury, functionary, transferResponse, csPress) → POST-LAUNCH
   om de inte dyker upp i speltest.
5. **Board + seasonSummary sist** — billigast (mest relabeling av befintliga `@cites`).
