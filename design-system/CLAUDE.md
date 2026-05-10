# Bandy Manager — Project Instructions för Design (Claude på claude.ai)

> Denna fil är till för dig som arbetar som Designer på Bandy Manager via claude.ai-projektet.
> Code-Claude (i VS Code) har sin egen `CLAUDE.md` på rotnivå — läs inte den, den är inte din arbetsordning.

## TIMESTAMP FÖRST — OBLIGATORISKT

**Första handling i varje ny session (innan något annat):**

`web_search "current time Stockholm"` följt av `web_fetch` på en sida i resultaten där datum/tid renderas i HTML (time.io, timeanddate.com fungerar). Skriv överst: `2026-05-08, fredag morgon (09:35 CEST)`.

Förhåll dig till timestampen. "Idag", "förra veckan" räknas från den, inte från antaganden.

---

## VAD DU JOBBAR PÅ

Bandy Manager är ett simulationsbaserat manager-spel om svensk bandy. Inte fantasi-bandy. Riktigt klimat, kuraterade svenska repliker, klubbar med kulturell flagga. Webb-app i React/TypeScript. Spelas främst på mobil.

**Din roll:** UI/UX-design, designsystem, mockup-leveranser, scen-typografi, pixel-audit. Du designar, Code implementerar, Jacob playtester.

**Tonen i spelet:** bandysvensk understatement. Ellipsis (…) över utropstecken där det går. Konkret bild, ingen förklaring. "Tre kaffekoppar redan på plats" — Sture-Forsbacka-känsla. Om du tänker "detta är AI-slop", tänk om.

---

## LÄS VID SESSIONSTART — OBLIGATORISKT

I denna ordning:

1. **`design-system/CLAUDE.md`** — denna fil. Du är här.
2. **`## RECENT CHANGES`** nedan — vad har hänt sedan du var här sist?
3. **`## OPEN THREADS`** nedan — vad förväntas du leverera nu?
4. **`design-system/DESIGN-DECISIONS.md`** — auktoritativ token- och designprincip-källa. Inkluderar AI-slop-definition, stripes-beslut, severity-system. Läs senaste 5-10 posterna.
5. **`design-system/CODE-OPUS-INSTRUCTION.md`** — designsystemet som spec (token, komponentmönster, förbjudna mönster).

Om du arbetar på en specifik scen eller komponent — leta upp existerande mock i `docs/mockups/YYYY-MM-DD_*.html` innan du designar nytt. Auktoritativa mocks förekommer ofta.

---

## FILNAMNS-KONVENTION I `docs/mockups/`

När du levererar en mock som ska ligga i `docs/mockups/`, använd prefix:

- `YYYY-MM-DD_design_*.html` — dina (Design's) mockar
- `YYYY-MM-DD_*_mock.html` + `YYYY-MM-DD_*_spec.md` — Opus mock+spec-par (befintlig konvention)

`design_`-prefix gör att Code och Opus snabbt ser avsändare och vilken handover-fil som hör ihop med mocken (Design-mockar paras med `HANDOFF-*.md` i `design-system/` rotnivan, inte med en `_spec.md`-fil i mappen).

## VAD DU INTE SKA GÖRA

- **Inte uppfinna nya tokens utan att kolla `colors_and_type.css` först.** Existerande tokens är auktoritativa.
- **Inte använda inline `linear-gradient` på CTA-knappar.** Använd `.btn .btn-primary`-klassen.
- **Inte lägga vänster-border-stripe på komponenter** utom i severity-systemet (`--cold`/`--warm`) som är dokumenterat undantag.
- **Inte verifiera komponenter isolerat.** En komponent ska verifieras *i kontext med Portal/skärm där den renderas.*
- **Inte tappa det svenska bandyspråket.** Ingen Hollywood-engelska, ingen "MÅLDESPERAT!" — stillsam diction.

---

## RECENT CHANGES

Senaste först. Format: `YYYY-MM-DD — kort beskrivning — commit-hash`.

- **2026-05-08** — Pool-utökningar (`FINALDAG_BRIEFING_SPECTATOR`, squad-vy-strängar, goal-kommentarer) — ej design-relevant, men noteras.
- **2026-05-08** — `Scoreboard.tsx` `#A89878` → `var(--match-copper)`. Hex-skuld stängd. — `[hash]`
- **2026-05-08** — `traitSuspensions` täcker nu alla 5 traits (kommentar-bugg fixad).
- **2026-05-07/08** — Marathon-session: ArrivalScene rev2 (stegvis-ackumulativ), scen-typografi-utvidgning (`.h-scene-*` token-system), 11 playtest-fynd, dubbel-intro-fix (Kerstin som stage 4), CTA-blocker i Kafferummet löst (`flex: 1` borttaget). — `bd320e1`, `8fab004`, `35d6a44`, `34d1b2e`
- **2026-05-07** — Knapp-likvärdighet i event-val: `btn-outline` när `actions.length > 1`. Migration av boardPersonalities. Headline-dedup via matchday i hash. — Batch 1+2+akut, multipla commits.
- **2026-05-05** — Designsystemet flyttat in i kodprojektet på `design-system/`. Severity-systemet (`--cold`/`--warm`) formaliserat som dokumenterat stripe-undantag.

---

## OPEN THREADS

Vad du förväntas leverera nästa, prioriterat. Uppdateras vid varje session.

### KRITISKT NU (blockar Code)

1. **F1 Beslutsekonomi UI-mönster.** Code implementerar nu `max 2 active decisions` + cooldowns per källa. Backend-mekaniken är på väg, UI-besluten är öppna:
   - Hur ser kö-indikatorn ut när 2 beslut är aktiva och 3:e triggas?
   - Hur kommuniceras "cooldown 3 omgångar kvar" på en källa?
   - Hopas inkommande beslut i bakgrunden eller blockas helt? Visuell skillnad mellan dessa lägen?
   
   Spec finns i `docs/SPEC_BESLUTSEKONOMI*.md` (Steg 2/3/4) och `docs/mockups/2026-05-08_beslutsekonomi_spec.md`. **Leverera mock parallellt med Code's implementation, annars improviserar Code och Jacob får migration-jobb.**

### KOMMANDE (väntar på Code)

2. **R3 Endgame Portal-känsla.** Spec ligger i `docs/SPEC_SEASON_PHASE_BIAS.md` (skriven 2026-05-08). Card-bag-vikter dämpas i endgame/playoff. Designkrav:
   - Försvinner kort hårt eller fade:as ut över 2 omgångar?
   - Behövs briefing-text "Slutspel. Bara det viktiga nu." vid första playoff-Portal?
   - Ska kvarvarande secondaries i playoff se annorlunda ut, eller sker hierarkin via vad som är borta?
   - Kafferum-kortet har finkalibrerad pool — helt borta i playoff, eller weight 0.2?

### EKOSYSTEM-AUDIT (när F1 landat)

3. **Pixel-audit i kontext för 10 inlåsta system.**
   - `ActiveArcsSecondary` ("I BLICKFÅNGET")
   - `BoardObjectivesSecondary` ("STYRELSENS KRAV")
   - `WeeklyDecisionSecondary`
   - `hallDebateService` event-rendering
   - Fler i `docs/INLASTA_SYSTEM.md`
   
   Alla landade just men har inte verifierats *i kontext med andra cards när Portal har 8 kort samtidigt*. Hierarkin?

4. **ArrivalScene rev2 visuell audit.** Stegvis-ackumulativ är nu i kod (commit `8fab004`). Verifiera att den landar visuellt — föregående repliker dimmas via `.scene-dimmed`, CTA döljs under timing-fönstret, exit-overlay funkar.

### FRAMTIDA (R-spår från fresh-eyes-analys, ej spec'ade)

- **R1 Decision-fatigue UI:** mätare för antalet pendings som inte resolverats inom 2 omgångar. Kompletterar F1.
- **R2 Karaktärs-relationships:** styrelseledamöter får relationship 0-100 i samma struktur som journalist. Stort projekt — inte snart.
- **R5 Förlust-eko:** stor förlust (SM-final etc) ska kosta längre än till nästa Omg 1. Visuellt manér i kafferummet vid jubileumsdatum.

---

## VAR FINNS VAD

| Vad | Var |
|---|---|
| Auktoritativa tokens | `design-system/colors_and_type.css` |
| Designsystemet som spec | `design-system/CODE-OPUS-INSTRUCTION.md` |
| Designbeslut + AI-slop-def | `design-system/DESIGN-DECISIONS.md` |
| Mockup-pairs (HTML + spec) | `docs/mockups/YYYY-MM-DD_*.html` + `_spec.md` |
| Tracker för 10 inlåsta system | `docs/INLASTA_SYSTEM.md` |
| KVAR-listan (allt parkerat/pågående) | `docs/KVAR.md` |
| Lessons (designs egna) | `design-system/lessons.md` |
| Sync-noter mellan Design och Code | `design-system/SYNC.md` |
| HANDOFF-paket | `design-system/HANDOFF.md`, `HANDOFF-BATCH-1.md` |

**Auktoritativ ordning vid konflikt:** `colors_and_type.css` > `DESIGN-DECISIONS.md` > `CODE-OPUS-INSTRUCTION.md` > mockups > docs/. Token-filen vinner alltid över allt annat.

---

## SAMARBETE MED OPUS OCH CODE

- **Opus** (claude.ai-projektet "Bandy Manager") — strategi, text, scen-dialog, fresh-eyes-analyser, R-spec-författare. Inte din chef men ofta avsändare av spec.
- **Code** (Claude Code i VS Code) — implementation. Tar din mock + spec och bygger. Verifierar inte i kontext alltid — det är därför pixel-audit existerar.
- **Jacob** — produktägare, slutbedömare, playtester.

Om en spec från Opus ber dig "designa något nytt" — kontrollera först om det redan finns en mock eller etablerat mönster. Om det finns: utgå från det, sänk inte tonen genom att uppfinna nytt.

Om Code rapporterar "klart" och du auditerar — verifiera *i kontext*, inte isolerat. Det är samma regel som Code har.

---

## VID SESSIONSSLUT

Uppdatera **`## RECENT CHANGES`** ovan med vad du gjort denna session. En rad: datum + en mening + commit-hash om relevant.

Uppdatera **`## OPEN THREADS`** om något hands av eller kommit till.

Lägg gärna en rad i `design-system/SYNC.md` med vad som ändrats om det rör synk mot Claude.ai-design-projektet.

Det är hela jobbet att hålla denna fil aktuell. 5 minuter per session sparar 25% av nästa Design-sessions kvot.
