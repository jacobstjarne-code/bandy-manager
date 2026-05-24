# Handover 2026-04-27 (kväll — session 2)

## Vad levererades idag

### SPEC_MATCHDAGAR Fas 1–3 (commits `9b47927`, `fa543d9`, `85170f7`, `755502f`)

**Fas 1 — RNG-baserat schema**
- Ersatte hårdkodade `ROUND_DATES` med `ROUND_WINDOWS` per omgång + `pickRoundDate()`
- Alla 22 ligaomgångar faller nu på bandydagar (tis/ons/fre/lör/sön, aldrig mån/tors)
- Annandagen (R10) alltid 26 december, nyårsbandy (R11) ~10–20% av säsonger
- `buildSeasonCalendar()` returnerar `MatchdaySlot[]` med datum + veckodag + tipoff-tid + specialflaggor

**Fas 2 — Cup som försäsongsturnering**
- Cup R1–R4: matchday 1–4 (aug–okt), innan liga startar matchday 5
- `getCupRoundDate()` beräknar cup-datum: R1 tredje lördagen aug, R2 femte lördagen aug, R3/R4 första oktober-helgen
- `CUP_MATCHDAYS` i cupService uppdaterad till `{1:1, 2:2, 3:3, 4:4}`
- 6 tester uppdaterade (antaganden om "första advance = ligaomgång" var fel)

**Fas 3 — Specialdatum-events**
- `Fixture.isFinaldag` tillagd, sätts av `playoffService` på SM-final-fixture
- `isAnnandagen`-bug i `matchSimProcessor` fixad (kollade matchday 12, ska vara kalender-lookup)
- Fyra kanaler:
  - **Match-commentary** (step 0 i matchCore): prioritet finaldag → cup-final → annandagen → nyårsbandy → derby
  - **Daily briefing**: pooler med context-substitution, deltagare + spektatör för SM-final/cup-final
  - **Inbox (dag-före)**: annandagen, cup-final, SM-final (deltagare + spektatör). Nyårsbandy: ingen inbox per spec
  - **Strängar**: `src/domain/data/specialDateStrings.ts` med Opus-skrivna pooler (5 varianter per typ), `pickVariant(mulberry32(season*1000+matchday))`

### Sprint 25f/g — Domare + matchskador (commit `dabc68a`)
- `refereeService.ts`: 8 namngivna domare, weighted selection, relation-tracking
- `matchInjuryService.ts`: 6 skadearketyper, junior-skydd (< 18 ex. boll_i_ansiktet)
- `matchSimProcessor.ts`: domare tilldelas per fixture, refStyle/refereeName till matchCore
- `roundProcessor.ts`: skadesäsonger tillämpas på game state + inbox för > 1 veckas frånvaro
- `GranskaScreen.tsx`: domare-mötes-kort med 3 val (respektera/neutral/protestera)
- `MatchLiveScreen.tsx`: domarnamn visas ovanför CommentaryFeed

### Teknisk skuld (commit `85170f7`)
- `pickSeasonHighlight()` + `SeasonHighlight`-typen borttagna från `seasonSummaryService.ts` (dead code sedan Sprint 27)

---

## Nyckelbeslut tagna idag

1. **`isFinaldag` på fixture, inte MatchdaySlot** — playoff-matchdagar genereras dynamiskt, kalender-strukturen täcker bara cup+liga. Enklaste konsekventa fix: sätt flaggan direkt på SM-final-fixture vid skapandet.
2. **Nyårsbandy: ingen inbox** — stämning i daily briefing + commentary räcker, formell inbox-rad käns fel för ett optionellt event.
3. **Cup-final-spektatör-inbox skippas** — per Jacobs direktiv. Inget behov av att maila spelaren om en final de inte spelar.
4. **`{N}`-varianten i FINALDAG_BRIEFING_SPECTATOR drogs** — beräkning av "omgångar sedan eliminering" är komplex, en variant räcker.

---

## Aktiva jobb

- **Sprint 28-C** — skärmdump-vänlighet-audit (Opus-only, ~1h). Fortfarande parkerat/ej påbörjat.
- **Playtest-runda 4** — ingenting från Sprint 25h/26/27/28/Fas3 är verifierat i live-spel. Prioriteras.

---

## Motor-gap (kvarstår, ingen aktiv sprint)

| Mätvärde | Motor | Target | Gap |
|---|---|---|---|
| awayWinPct | 43.9% | 38.3% | −5.6pp |
| cornerGoalPct | 26.2% | 22.2% | −4.0pp |
| playoff_final mål/match | 9.17 | 7.00 | +2.17 |

---

## Kvarstående frågor

- **SPEC_MATCHDAGAR Fas 4** (klimatdata-pipeline) — blockeras på Eriks Python/SMHI-skript. Parkerat.
- **SPEC_VADER W2–W7** — samma blockering.
- **Sprint 28-C** — Opus-only audit, kan köras närsomhelst.

---

## Föreslagen ordning nästa session

1. Läs CLAUDE.md, LESSONS.md, DECISIONS.md, KVAR.md, denna fil.
2. **Playtest-runda 4** — verifierar Sprint 25h/26/27/28/Fas1-3 i live-spel. Fokus: specialdatum-events (alla fyra flaggor), domare-möte, matchskador, legend-commentary, skandaler i kafferum/klack/press.
3. **Sprint 28-C** — Opus-only skärmdump-vänlighets-audit. Kräver ingen Code.
4. **Motor-gap** (valfritt) — välj ett av de tre gapen ovan.
