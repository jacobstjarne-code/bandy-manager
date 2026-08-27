# RAPPORT — statiska grundvärden + avskedsfrekvens alla tolv klubbar

**2026-08-25. Beställt av Jacob, två separata order i samma pass:**
1. "Mät alla tolv innan skalan sätts: 20 seeds × 4 säsonger, avskedsfrekvens per klubb med nuvarande kod."
2. "Vilka av spelets grundvärden sätts vid generering och ändras aldrig? ... Bygg ingenting. Listan är ett produktbeslut och Jacob dömer vilka som ska bli dynamiska."

**Status: två rapporter, inget byggt.** Detta ersätter/blockerar boardPatience-skalans nästa steg — se DOM-behov i slutet.

---

## Del 1 — Avskedsfrekvens, alla tolv klubbar (20 seeds × 4 säsonger)

Kört med `scripts/h4-alla-tolv-avskedsfrekvens.ts` (samma harness-mönster som `scripts/h4-heros-avskedsfrekvens.ts`), **med den redan applicerade men ej ännu omkalibrerade `RUNNING_LOSS_EXPECTATION_MULTIPLIER`-skalan i `boardService.ts` aktiv** (Survive 0,4× / AvoidBottom 0,7× / MidTable 1,0× / ChallengeTop 1,2× / WinLeague 1,4× på basförlusten, förlustsviten oskalad).

| Klubb | Rykte | Tier | Avsked | Per säsong | Orsaker |
|---|---|---|---|---|---|
| Forsbacka | 85 | WinLeague | 30% (6/20) | S2=2, S3=3, S4=1 | boardPatience<=15 (6) |
| Västanfors | 78 | ChallengeTop | **10% (2/20)** | S4=2 | boardPatience<=15 (2) |
| Karlsborg | 68 | ChallengeTop | 80% (16/20) | S1=1, S2=2, S3=8, S4=5 | boardPatience<=15 (16) |
| Målilla | 65 | MidTable | 45% (9/20) | S2=1, S3=3, S4=5 | boardPatience<=15 (9) |
| Gagnef | 63 | MidTable | 45% (9/20) | S2=2, S3=3, S4=4 | boardPatience<=15 (7), licenseDenial (2) |
| Lesjöfors | 62 | MidTable | **100% (20/20)** | S1=1, S2=8, S3=4, S4=7 | boardPatience<=15 (18), licenseDenial (2) |
| Hälleforsnäs | 60 | MidTable | 80% (16/20) | S2=4, S3=4, S4=8 | boardPatience<=15 (14), licenseDenial (2) |
| Söderfors | 55 | MidTable | 90% (18/20) | S1=1, S2=7, S3=4, S4=6 | boardPatience<=15 (16), licenseDenial (2) |
| Skutskär | 52 | AvoidBottom | 90% (18/20) | S2=5, S3=4, S4=9 | boardPatience<=15 (13), licenseDenial (5) |
| Rögle | 50 | AvoidBottom | **100% (20/20)** | S1=2, S2=12, S3=5, S4=1 | boardPatience<=15 (20) |
| Slottsbron | 48 | AvoidBottom | 95% (19/20) | S2=7, S3=8, S4=4 | boardPatience<=15 (18), licenseDenial (1) |
| Heros | 45 | Survive | **100% (20/20)** | S2=5, S3=10, S4=5 | boardPatience<=15 (19), licenseDenial (1) |

### Rådata, inte tolkat till en rekommendation

- Rykte korrelerar starkt med överlevnad: 85→30%, 78→10%, allt under 68→45-100%. Det är inte ett Heros-specifikt problem, det är ligabrett.
- Heros ligger kvar på 100% **trots** att Survive-skalan (0,4×) redan är aktiv i koden som kördes. Den löpande termens skalning ensam flyttade alltså inte Heros siffra — konsistent med tidigare fynd att styrelseobjektiven är en andra, oskalad drivkraft.
- Två avskedsorsaker syns: `boardPatience<=15` (dominerande överallt) och `licenseDenial` (näst vanligast för MidTable/AvoidBottom-klubbarna, aldrig för Forsbacka/Västanfors/Rögle/Heros — inte utrett vidare här).
- Skriptet finns kvar på disk (`scripts/h4-alla-tolv-avskedsfrekvens.ts`) för omkörning när/om skalan ändras.

---

## Del 2 — Statiska grundvärden: sätts vid generering, ändras aldrig

Genomsökt: `worldGenerator.ts` (helt), `createNewGame.ts` (helt), `Club.ts`, `boardService.ts` (helt, inkl. `generatePreSeasonMessage`), `seasonEndProcessor.ts`, `eventResolver.ts`, `roundProcessor.ts`, `academyActions.ts`, `rivalries.ts`, `docs/findings/facts/world_canon/*.yaml`. Varje rad nedan är grep/läs-verifierad, inte gissad ur fältnamn.

### boardExpectation, fördjupning

**Sätts:** `worldGenerator.ts:145-451` (`CLUB_TEMPLATES`), kopieras till runtime-`Club` vid `worldGenerator.ts:840`.

**Läses senare:** brett — `computeSeasonVerdictRating` (`boardService.ts:187`), `updateRunningBoardPatience` via `RUNNING_LOSS_EXPECTATION_MULTIPLIER` (`boardService.ts:383-389,439`), `expectationVerdictFromRating`, `generateSeasonVerdict`, säsongssammanfattningens narrativ (`seasonSummaryService.ts:412-660`), inboxtext (`inboxService.ts:269`), `BOARD_EXPECTATION_CEREMONIAL` (`BoardMeetingScene.tsx:97-99`), UI (`OrtenTab.tsx:533`).

**Befintlig uppdateringsmekanism:** `generatePreSeasonMessage` (`boardService.ts:506-559`), anropad en gång per säsong från `seasonEndProcessor.ts:352-359`.

- **Rör bara den hanterade klubben.** `seasonEndProcessor.ts:357-359` gör `updatedClubs.findIndex(c => c.id === game.managedClubId)` — de andra elva AI-klubbarnas `boardExpectation` skrivs ALDRIG efter generering, av denna funktion eller något annat (bekräftat via full repo-grep av varje skrivställe).
- **Uppsteg** (`boardService.ts:514-518`, position ≤2): `AvoidBottom→MidTable→ChallengeTop→WinLeague`. **Survive är inte med i någon gren** — en Survive-klubb som slutar 1:a-2:a stannar Survive. Strukturellt oflyttbar.
- **Nedsteg** (`boardService.ts:519-522`, position ≥10): bara `WinLeague→ChallengeTop→MidTable`. **Ingenting flyttar någonsin en klubb ner till AvoidBottom eller Survive** — ingen klubb kan degraderas till Survive; bara Heros (mallsatt) kommer någonsin bära den.
- Nettot: av fem tiers rör sig bara `WinLeague↔ChallengeTop↔MidTable`, och bara för den mänskliga spelarens klubb.
- `fanExpectation` (syskonfält, samma startvärde) har noll skrivställen någonsin — helt dödstatiskt för alla tolv klubbar, för alltid.

### Övriga fält

**Har redan ett säsongsvis delta-mönster, men spärrat till hanterad klubb (återanvändbart, inte nytt att bygga):**

| Fält | Sätts | Läses senare | Mekanism |
|---|---|---|---|
| `reputation` | `worldGenerator.ts:830` | Överallt (matchmaking, transfers, löner, patron/politiker-gen, boardPatience) | `SEASON_REPUTATION_DELTA` finns, körs varje säsong — bara för hanterad klubb. AI-rykte rör sig bara via det separata skandalsystemet, aldrig via ligaresultat. |
| `youthQuality` | `worldGenerator.ts:835` | `academyService.ts` (PA-fördelning), `OrtenMap.tsx:29` | +3 via `budgetPriority='youth'`, +5 via avtackad legend som ungdomstränare — båda spärrade till hanterad klubb. |
| `youthRecruitment` | `worldGenerator.ts:836` | Ingen direkt spellogik hittad, matar bara visning | +2 via "bandySchool"-community-aktivitet, spärrad till hanterad klubb. |
| `facilities` (basstat) | `worldGenerator.ts:838` | `playerDevelopmentService.ts:168`, `trainingService.ts:92`, `OrtenMap.tsx:28` | Flera uppdateringsställen, alla spärrade till hanterad klubb. |

**Ingen uppdateringsmekanism någonstans, för någon klubb — skulle kräva något genuint nytt:**

| Fält | Sätts | Läses senare | Notering |
|---|---|---|---|
| `preferredStyle` / AI-klubbarnas `activeTactic` | `worldGenerator.ts:842-843` | `matchSimProcessor.ts:136` (varje match), `opponentAnalysisService.ts:304` | En AI-klubb spelar identisk taktisk identitet säsong 10 som säsong 1. |
| `region` | `worldGenerator.ts:830` | `weatherService.ts:150`, transferlogik | Statiskt för alltid (väntat — geografi ska inte ändras, men flaggat enligt uppdrag). |
| `arenaName` | `worldGenerator.ts:846` | Matchrapporttext varje hemmamatch, presskonferens, portal | Statiskt för alltid. |
| `hasArtificialIce` | `worldGenerator.ts:839` | `weatherService.ts:57,115` — styr is/tö-väder varje match | Statiskt för alltid. Kommentaren i `Club.ts:68` ("förberedd för V0.2 vädersystem") signalerar att fältet VAR tänkt att kunna röra sig. |
| `wageBudget` | `worldGenerator.ts:833` / omräknad en gång vid spelstart för hanterad klubb | Spärrar riktiga kontraktsbeslut varje säsong (`TransfersScreen.tsx:136`, `rippleEffectService.ts:75-111`, m.fl.) | **Ingen mekanism för NÅGON klubb, inklusive den hanterade.** Räknas aldrig om trots att finances/rykte driver iväg långt från säsong 1. |
| Styrelsemedlemmarnas identitet (namn/ålder/kön) | `worldGenerator.ts:139-451` | Namn/roll/personlighet läses brett | `age`/`gender` verkar skrivas men aldrig läsas (grep-bekräftat, ingen konsument hittad). Ingen succession — samma 58-åring i tio säsonger. |
| `opponentManager` (namn/persona/`yearsAtClub`) | `worldGenerator.ts:847` | `opponentManagerService.ts:26,74` — citat varje match | Inget avskeds-/åldrandesystem för AI-tränare, någonsin. |
| `youthDevelopment` | `worldGenerator.ts:837` | `academyService.ts:80,151` | Ingen mutation för NÅGON klubb, och inte ens läst för de elva AI-klubbarna (ungdomslagsgenerering körs bara för hanterad klubb). |
| `RIVALRIES` (par/intensitet) | Inte per-spel data alls — hårdkodad modulkonstant, `rivalries.ts:7-17` | Extremt brett läst — schemaläggning, matchnarrativ, UI | Compile-time-fast för hela applikationen, inte bara en karriär. `rivalryHistory` finns och spårar inbördesmöten men är aldrig kopplad till `intensity`. |

**Redan fullt dynamiska (inte del av frågan):** `finances` (muteras löpande; `seasonStartFinances` är en korrekt nollställd säsongscheckpoint, inte ett fruset grundvärde), `transferBudget` (omräknas för alla tolv klubbar varje säsong), `communityStanding`, `academyLevel`, `arenaCapacity`.

**Verkar vara död kod snarare än en "borde den röra sig"-fråga** (satt vid generering, ingen läsare hittad): `Club.clubhouse`, `BoardMember.age`/`.gender`.

### Sidofynd

`docs/findings/facts/world_canon/W012_heros.yaml` säger fortfarande `boardExpectation: AvoidBottom` — redan föråldrad mot dagens kodändring. Samma dokumentations-drift-mönster som redan flaggats två gånger denna session (statusfältet, contextualSponsorService).

---

## Öppet — väntar på Jacobs dom

Ingenting byggt. boardPatience-skalans nästa steg (kalibrering mot tolv datapunkter i stället för två) och listan ovan (vilka grundvärden ska bli dynamiska, och för vilka klubbar — bara hanterad, eller alla tolv) väntar båda på produktbeslut.
