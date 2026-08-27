# RAPPORT — boardExpectation-läsare + var Förutsättningsfasen hör hemma

**2026-08-25.** Beställt som fråga 2 och 4 i `DOM_FORUTSATTNINGSFASEN_2026-08-24.md`s rapportkrav, körd som bakgrundsutredning parallellt med H4 Heros-uppföljningen. **OBS:** Jacobs efterföljande order samma dag ("Bygg inte en ny förutsättningsfas... Bygg ut generatePreSeasonMessage") gör att del B nedan (var fasen hör hemma) för närvarande är referens, inte en aktiv spec — men fyndet om `generatePreSeasonMessage` som befintligt prejudikat blev direkt relevant för den byggda H4-uppföljningen (se `BACKLOG.md`).

---

## Fråga 2 — varje läsare av `Club.boardExpectation`

Fyra kända sen tidigare: `computeSeasonVerdictRating`, `evaluateBoard`, `offerSelectionService`, `BoardMeetingScene`. **Två rättelser till den listan, sedan den fullständiga:**

- **`evaluateBoard` läser inte längre `boardExpectation` alls.** Avkopplad 2026-08-24 (`boardService.ts:72-89`, "Zonen är sanningen, domen ska förklara den") — tar bara `boardPatience: number`. En FORDOM läsare, inte en nuvarande.
- **`computeSeasonVerdictRating` läser inte `club.boardExpectation` direkt** — tar `expectation` som parameter. De faktiska läsningarna sker vid dess tre anropsställen.

### Fullständig lista — live `SaveGame.clubs[].boardExpectation`

| # | Fil:rad | Vad den gör med värdet |
|---|---|---|
| 1 | `seasonEndProcessor.ts:98` | `generateSeasonVerdict(managedClub.boardExpectation, ...)` — läser klubbens NUVARANDE (ej ännu uppdaterade) förväntan för att betygsätta säsongen som just slutade → "Styrelsebetyg"-inboxpost. |
| 2 | `seasonEndProcessor.ts:805` | Läser samma pre-mutation-värde, matar `computeBoardPatienceUpdate`s säsongsslutsdelta. |
| 3 | `boardService.ts:439` (`updateRunningBoardPatience`) | Läses LIVE, VARJE OMGÅNG under säsongen, väger den löpande vinst/förlust-patiensdeltat. Kontinuerlig läsare mitt i säsongen. |
| 4 | `boardService.ts:512-533` (`generatePreSeasonMessage`) | Läser `club.boardExpectation`, beräknar `newExpectation`. **Detta är det redan existerande prejudikatet för "bedöm säsongen, producera en ny boardExpectation."** |
| 5 | `inboxService.ts:269` (`createBoardFeedbackItem`) | Switchar på värdet. **Död kod** — ingen anropare hittad någonstans i src/ utanför egen testfil. |
| 6 | `seasonSummaryService.ts:412` (`generateSeasonSummary`) | **Se buggen nedan.** Matar `seasonVerdictRating`, `expectationVerdict`, `metExpectation`, tre narrativtext-grenar, kopieras till `SeasonSummary.boardExpectation`. |
| 7 | `seasonSummaryService.ts:810-818` (`placeringsdomText`) | Tar `boardExpectation` som parameter (från läsare 6:s output), anropar `computeSeasonVerdictRating` igen för "Placeringsdomen"-meningen. |
| 8 | `seasonShareImage.ts:84` | `FORVANTANSSATS[summary.boardExpectation]` — nedströms läsare 6, delningskortets bildtext. |
| 9 | `BoardMeetingScene.tsx:97-99` | Läser live från `game`-prop, väljer `BOARD_EXPECTATION_CEREMONIAL`-text. Denna scen triggas "säsong 2+, matchday 0" — EFTER Sommaren. |
| 10 | `SeasonTransitionScene.tsx:71` (**detta ÄR Sommaren**) | `=== ClubExpectation.AvoidBottom` → matar `deriveIsPlayoffUnlikely`. Läser live `game.clubs` vid render. |
| 11 | `OrtenTab.tsx:533` | Ren live-visning, ingen inaktualitetsrisk. |

**Inte live-läsare** (statisk `CLUB_TEMPLATES`-data, klubbvalsskärmen före något spel finns): `offerSelectionService.ts:47`, `worldGenerator.ts:840-841` (skrivning, inte läsning), `OffersView.tsx`, `AllClubsView.tsx`, `OfferCard.tsx`, `ClubExpandedCard.tsx`.

### Den bärande upptäckten: en inaktualitets-bugg finns redan i dag

Exekveringsordning i `handleSeasonEnd`:
1. Rad 352-360: `generatePreSeasonMessage` beräknar `newExpectation` för NÄSTA säsong och skriver den direkt in i `updatedClubs`.
2. Rad 1215: `seasonEndGameView = { ...game, clubs: updatedClubs }` — bär redan den NYA förväntan.
3. Rad 1224: `generateSeasonSummary(seasonEndGameView, ...)` läser `boardExpectation` från den vyn.

**Alltså:** styrelsebetygets inboxpost (läsare 1, korrekt — använder den GAMLA förväntan som faktiskt styrde säsongen) och årsbokens `SeasonSummary.boardExpectation`/badge/narrativ/placeringsdom/delningsbild (läsare 6-8, FEL — använder NÄSTA säsongs förväntan) kan redan i dag säga emot varandra, varje gång en säsong triggar en förväntansändring. Detta är **förexisterande, inte hypotetiskt** — och blir mer synligt nu när förväntan faktiskt rör sig för alla tolv klubbar (H4-uppföljningen, byggd samma dag). Inte fixat i denna passning — flaggat, inte gissat en lösning.

---

## Fråga 4 — var hör en bedömningsfas hemma: `seasonEndProcessor` eller Sommarens route?

**Svar: strukturellt i `seasonEndProcessor.ts`, inte i Sommarens render/mount-logik.** (Relevant om/när en ny fas återupptas — för närvarande pausad till förmån för att bygga ut det befintliga `generatePreSeasonMessage`-prejudikatet.)

- `seasonEndProcessor.ts` kör som en ren, synkron beräkning över `SaveGame` — inget UI inblandat. Anropas från den vanliga "avancera"-pipelinen, långt innan någon skärm renderas.
- Det finns redan ETT direkt, fungerande prejudikat för exakt denna sorts feature: `generatePreSeasonMessage` beräknar en ny `boardExpectation` ur en bedömning av säsongen och anropas från `seasonEndProcessor.ts`, som skriver den innan något persisteras eller renderas.
- Sommaren (`SeasonTransitionScene.tsx`) är HELT en ren visningskomponent — ingen egen domänberäkning. Alla härledda värden går genom redan existerande, rena helper-funktioner (`seasonTransitionService.ts`). Enda store-skrivningen (`passSeasonTransition`) är en guard-flagga + säsongsmål-skrivning, ingen klubb-beräkning.
- Att lägga beräkning i Sommaren hade betytt antingen (a) anropa en domänfunktion inuti en Reacts render-kropp (blandar render och mutation), eller (b) uppfinna en helt ny "vid-mount"-sidoeffektväg som inte finns någonstans annars i den här scenfamiljen.
- Sommaren har redan en återinträdesspärr (`seasonGoalChosenForSeason === currentSeason`) som låter spelaren lämna och komma tillbaka till exakt samma skärm. Beräknat en gång vid säsongsslut (samma mönster som `pendingSeasonTransitionEvents`, "Medan du var borta"-raderna) undviker en andra "har jag redan kört den här bedömningen"-flagga.
- **Sekvenseringskonsekvens, given buggen ovan:** om en ny bedömning läggs i `seasonEndProcessor.ts` måste den antingen placeras EFTER säsongsbetygets läsning (rad ~98) och patiensläsningen (rad ~805) — båda behöver den GAMLA förväntan — eller så måste `generateSeasonSummary`s läsning (`seasonSummaryService.ts:412`) fixas till att snapshotta `boardExpectation` FÖRE någon mutation. Ett medvetet beslut, inte en bieffekt av anropsordning.

---

## Status efter denna rapport

Jacob beslöt samma dag att INTE bygga en ny fas — i stället byggdes `generatePreSeasonMessage` ut (fem nivåer, båda riktningar, alla tolv klubbar) direkt i `seasonEndProcessor.ts`, exakt det hemvist denna rapport pekade ut som strukturellt rätt. Se `BACKLOG.md` för vad som byggdes. Inaktualitets-buggen (läsare 1 vs 6-8) kvarstår oadresserad.
