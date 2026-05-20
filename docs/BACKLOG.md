# BANDY MANAGER — BACKLOG

**Etablerad:** 2026-05-17
**Senast rensad:** 2026-05-18
**Syfte:** ENDA SANNING för "specat men ej byggt" + "idéer som ska bli spec". Uppdateras VARJE gång vi parkerar något — inte "vid tillfälle".

**Förhållande till andra dokument:**
- `KVAR.md` = historisk logg av leveranser (vad har hänt, kronologiskt)
- `BACKLOG.md` (denna fil) = ENDA SANNING för vad som väntar
- `SPEC_*.md` = enskilda speccer (länkas härifrån)
- `INLASTA_SYSTEM.md` = verifierings-status för 10 system (checklista, inte backlog)

---

## PROCESS-REGLER (etablerade 2026-05-17)

1. **När vi parkerar en idé eller spec — Opus skriver in den i `BACKLOG.md` SAMMA session**, inte "vid tillfälle"
2. **Vid sessionsstart läses `BACKLOG.md`** efter `CLAUDE.md/KVAR.md/LESSONS.md/DECISIONS.md` för att se vad som väntar
3. **Innan stor sprint startas, scannas `BACKLOG.md`** för relaterade idéer som kan packas samman
4. **När något byggts** raderas raden från BACKLOG. CHANGELOG dokumenterar historiken — duplikeras inte i tabellerna.
5. **Inget hamnar bara i chatten.** Om Opus säger "framtid" eller "senare" måste det skrivas hit. Annars är det förlorat.
6. **Regelbunden rensning.** Tabeller som växer av tröghet blir oanvändbara. Klara rader raderas vid commit. Idéer som inte längre är aktuella droppas aktivt vid genomgång — inte behållas av artighet.

---

## A. AKTIVA SPRINTAR (Code arbetar eller väntar Code-start)

| # | Vad | Spec | Status |
|---|---|---|---|
| A6 | **🟥 Dubbelt intro vid säsongsstart — ArrivalScene + något därefter triggas i säsong 1.** ArrivalScene är ren (verifierat 2026-05-18) — den navigerar till `/game/dashboard` när "Sätt igång →" klickas, inget internt styrelsemöte. Något triggas på dashboard eller via scen-trigger DÄREFTER. Inte `shouldTriggerBoardMeeting` (alltid `false`, disabled), inte `season_kickoff`-anslag (kräver season >= 2). Sunday Training är söndagsträning, inte styrelsemöte. Kräver bild eller exakt rubrik från Jacobs Söderfors-playthrough för att lokalisera triggern. | `seasonStartProcessor.ts` / scen-trigger-logiken | **AKUT** — väntar bild |

---

## B. SPECCAT KLART, VÄNTAR BYGGE

| # | Vad | Spec | Beroenden |
|---|---|---|---|
| B1 | **Klubbutvecklingspaketet (Riktning 1)** — facility-träd, säsongsplanering, löneeskalering, kontextuella sponsorer, halvårsrapport, halldebatt som flersäsongsprocess. **Inkluderar i scope:** C-T3 (akademi-flik), C-T4 (First Cap-event), C-T5 (externa akademier scoutbara), C-T6 (akademi-skolsamarbete). | `docs/SPEC_KLUBBUTVECKLING.md` | Riktning 2 playtest-verifiering klar |
| B2 | **Annandagen val-mekanik** — era-låst (Survival A+C, Fotfäste/Establishment A+B+C, Legacy+mecenat A+B+C+D), kedjereaktioner till 6 services per val | `docs/ANNANDAGEN_VAL_MEKANIK_2026-05-17.md` | Riktning 1-start (B1). **OBS:** verifiera mot kod innan spec — kan vara delvis implementerat redan (jfr B3 som var dolt klart). |
| B4 | **Transfers Sprint 2** — WARN-fynd + kafferum/klack-reaktion vid inkommande bud (B från Opus) + lås-ikon klubblegender (C från Opus). Drar in C-O2 (inkomna AI-bud reaktioner) + C-T10 (lås-ikon klubblegender visuellt). | `design-system/AUDIT-TRANSFERS-2026-05-17.md` + chatten | Sprint 1 (A2) playtestad. **OBS:** verifiera mot kod innan spec — vissa WARN-fynd kan vara fixade redan. |

---

## C. IDÉER UTAN SPEC — KRÄVS SPECCING INNAN BYGGE

### Portal-systemet (skissat 2026-05-17)

*Tomt just nu — C-P1 levererat 2026-05-18.*

### Transfers — speldesign-utvidgning (skissat 2026-05-17)

| # | Idé | Plats | Estimat |
|---|---|---|---|
| C-T8 | **Förhandlings-utbyggnad.** Sign-on bonus, boendebidrag (bandyspecifikt — klubbarna ordnar lägenheter), jobbgaranti (semi-pro), image rights för lokala sponsoringansikten. | BidModal + transferService | Stor framtid |

### THE_BOMB-rester (sedan tidigare)

Tomt. Alla rester levererade. Vidare THE_BOMB-arbete väntar nya design-rundor.

---

## D. PARKERADE (kräver beslut, omtag eller naturlig trigger)

| # | Vad | Varför parkerat | Vad krävs för att starta |
|---|---|---|---|
| D1 | **Cup-tonen Nivå 3** (cup_atmosphere + cup_finalweekend_atmosphere) | Opus regrederade — skrev AI-spagetti istället för bandy-svenska. Jacob parkerade 2026-05-17. | Opus läser `WRITING_GUIDELINES_BANDY_MANAGER.md` + `SPEC_CUP_ANSLAG_2026-05-08.md` SYSTEMATISKT innan nytt försök. Skriver 1-2 strängar i taget, inte pool på 6-8. Använder konkreta bandysvenska referenser, inga påhittade detaljer. |
| A1.5++ | **Rotorsak: varför genererar matchSimulator/matchEngine Goal/RedCard/Save-events med tomt `commentary`?** A1.5+ fixar UI-symptomet med fallback-pipeline. Permanent fix vid källan så fallback i `deriveEventText` blir död kod istället för kritisk grind. | Väntar på rotorsaksutredning av text-generatorn | Nästa playtest-runda — undersök om mönster finns (mål-typer, sent i match, straff, hornmål, interaktiva utfall) |
| C-N1 | **NU-fliken konstruktivt innehåll vid stabilt läge.** Idag fallback "Allt är lugnt — truppen är hel och stadig" — negation av problem, inte status-fönster. Behöver tre konkreta rader även vid stiltje: form, skadebild, träningsobservation. Klubbens dagliga puls i bandysvenska ton. | Kräver design-runda innan spec — vad är NU egentligen och vad ska den visa när inget brinner? | Design-session med Jacob |

---

## E. TEKNISK SKULD — SMÅ (paketeras opportunistiskt)

*(Stora teknisk-skuld-punkter TS-1 till TS-10 finns i `KVAR.md` — duplikeras inte här. Detta är *små* punkter som dyker upp i audits.)*

*Tomt just nu — alla små teknisk-skuld-punkter rensade 2026-05-18.*

---

## F. ETABLERAD ARBETSDISCIPLIN (Opus-regler för att inte glömma)

1. **Innan skrivuppgift:** läs `WRITING_GUIDELINES_BANDY_MANAGER.md` + `SPEC_CUP_ANSLAG_2026-05-08.md` + andra relevanta tonfiler systematiskt. Inte plocka strängar utan helhetskoll.
2. **Max 10 citat per generations-block** (per `WRITING_GUIDELINES_BANDY_MANAGER.md` Lärdom #7). Stanna. Granska. Sen nästa.
3. **När Opus parkerar något:** skriv det in i denna BACKLOG samma session. Säg "lagt i BACKLOG.md C-T8" inte bara "bra idé, vi tar det senare".
4. **När större paket startar:** scanna BACKLOG för relaterade idéer som kan packas samman. Akademi-paketet (B1 Riktning 1) drar t.ex. in C-T3, C-T4, C-T5, C-T6 som naturliga delar.
5. **Klara rader raderas vid commit.** CHANGELOG dokumenterar historiken — tabellerna ska bara visa vad som faktiskt är öppet.

---

## CHANGELOG FÖR BACKLOG SJÄLV

| Datum | Vad |
|---|---|
| 2026-05-17 | Filen skapad. Inventering av allt parkerat just nu i sessionen + tidigare. |
| 2026-05-17 | A3 (cup-vy final-status) + C-N1 (NU-fliken konstruktivt innehåll) tillagda efter Jacobs playtest. |
| 2026-05-17 | C-S1 (Pep-talk-poolen blandar röster — överlapp med atmosphere) tillagd. |
| 2026-05-17 | A4 (månadsanslag triggas fel + Annandagen osynlig på Portal) tillagd. |
| 2026-05-17 | C-N2 (journalist-relations-kort saknar eyebrow) tillagd. |
| 2026-05-17 | A5 BLOCKER (SM-vinnarvy felaktigt vid cup-vinst) + A1.5+ (tomma mål-events i live-flödet) + C-N3 (ankomst-CTA) tillagda efter playtest. |
| 2026-05-17 | A5 levererat (full cup-final-victory-scen med Opus-texter). A1.5+ levererat (deriveEventText med 4-stegs-pipeline). A1.5++ tillagd — rotorsak-utredning till nästa playtest. |
| 2026-05-17 | C-S1 levererat (Opus, direkt i StartStep.tsx) — pep-talk-poolen omskriven till intern röst, funktion omdöpt, JSDoc-princip tillagd. |
| 2026-05-17 | A4(a) v2 RETUR — hardcodat matchday === 12 fungerar inte (varierande kalender). Spec klar för alt B (isAnnandagen-flagga på Fixture). C-S2 tillagd (styrelse-event "tre nollor" inkonsekvent med form-data). C-O3 tillagd (händelsetidslinje saknar hemma-borta). |
| 2026-05-18 | A4(a) v2 levererat — `isAnnandagen`/`isNyarsbandy` på Fixture som första-klass-flaggor, slot-propagering, backfill-migration, regression-test. 818/818 grönt. |
| 2026-05-18 | Småfix-paket levererat — C-N3 + C-O3 + C-O1 i commit `77848ee`. C-S2 (patron style-klagomål utan faktaanspåk) i commit `135caa2`. |
| 2026-05-18 | A6 (dubbelt intro vid säsongsstart) + A7 (cup-anslag-trigger-bugs: cup_start timing + cup_done/cup_between dubbel-trigger) tillagda efter playtest. |
| 2026-05-18 | A8 (motståndar-tabellposition-fragment triggar för tidigt) tillagd — saknar minimum-rounds-villkor. Tredje fyndet i samma mönster (anslag/event utan datastöd). |
| 2026-05-18 | A7+A8 levererade i commit `f1c7fec` — cup-anslag-triggers + opponent-standing-guard. 826/826 grönt. |
| 2026-05-18 | **STOR RENSNING.** Klara rader raderade (A1, A1.5, A2, A3, A4, A4(a) v2, A5, A1.5+, A7, A8, C-N2, C-N3, C-S1, C-S2, C-O1, C-O3, E1). C-T3/C-T4/C-T5/C-T6 absorberade i B1 Riktning 1-scope. C-T10 absorberat i B4 Sprint 2. C-O2 absorberat i B4. Droppade: C-T7 (counter-offer-eskalering, ej skuld), E2 (rating-bugg-lokalisering, obsolet efter A1.5). A1.5++ + C-N1 flyttade från A/C till D (väntar trigger). Endast A6 kvar som aktiv (väntar bild för att lokalisera trigger). |
| 2026-05-18 | C-P1 levererad i commit `edfa1a9` — `cardStaleTracking`-state, `0.5^N`-dämpning, gap-detect, migration. B3 verifierad i commit `d2c9915` — visade sig vara dolt klart sen tidigare, bara tester saknades. 844/844 grönt. Lärdom: dokumentation kan vara ur fas med kodbasen. Verifiera B2 och B4-delar mot kod innan nya specer skrivs. |
| 2026-05-18 | **Tre design-runda + spec-paket levererat.** C-B2 (klack-echo) + C-B3 (pensionsval + avskedsmatch var 5:e) bundlade i commit `d2ba879`. C-T2 (vintervärvningsdagen, 4 säsongs-kontexter + AI-bud-event) i commit `6c425c6`. Opus levererade tre textpooler i `retirementText.ts`, `windowDeadlineText.ts`, `klackEchoText.ts`. 882/882 grönt. |
| 2026-05-20 | **C-T1 + C-T9 levererat** efter Design-Claudes revisioner (`SPEC-SVAR-TRANSFER-RESPONSE-2026-05-20.md`). `transferPersonality` (35/30/15/12/8%-fördelning), `regionGeography.ts` (latitud-baserad distans), `playerAcceptsTransfer` med implicit-family via proxies, rivalry-bias från befintliga `rivalries.ts` (intensity-modifierad), `BidModal`-warning, `TransferBidResult`-inbox-rendering, ✨ dream_club-specialcase. Opus textpool i `transferResponseText.ts` (utökad av Design-Claude). 889/889 grönt. **LÄRDOM #33 lagd i LESSONS.md:** Opus måste köra PRE-SPEC CROSS-CHECK före varje spec — bröt mot Princip 2 två gånger på samma session. **CLAUDE.md fick ny SESSIONSSTART-sektion** överst som flagar disciplinen. |
| 2026-05-20 | **C-B1 levererat** efter Design-Claudes revisioner (`SPEC-SVAR-CS-PRESSFRAGA-2026-05-20.md`). `csPressEventService.ts` med streak-räkning + cooldown 4 omg + 25/35/60%-sannolikhet, `pickCSPressPlayer` 55/30/15 GK/DEF/Half, `roundProcessor`-trigger efter hemma-CS, `eventResolver` csPress-handler med morale/relation-deltas + journalist.memory-entry, `GranskaOversikt`-rendering med 4-valsknappar (inkl ghost "Ingen kommentar"). Opus textpool i `csPressEventText.ts` med 15 frågor (5 per severity), severity-baserad på `journalistRelationship`. 907/907 grönt. 18 nya tester. |
| 2026-05-20 | **Dokumentations-omstrukturering.** CLAUDE.md fick ny SESSIONSSTART-sektion (uppgiftstyp-kategorier A-F + PRE-SPEC CROSS-CHECK obligatorisk för kategori B). 5 referens-sektioner flyttade till ny `CLAUDE_REFERENCE.md` (Tech Stack, mapp-struktur, Key Files, Active Documentation, BANDY-BRAIN) — CLAUDE.md tappar ~150 rader. LESSONS.md fick TOC överst kategoriserad i 6 grupper, plus lärdom #33 (PRE-SPEC CROSS-CHECK glomd). `docs/DESIGN_SYSTEM.md` flyttad till `docs/archive/` (var arkiverad enligt CLAUDE.md). |
