# AUDIT — Introflödets sidfot: en enda gå-vidare-mall

**Från:** Design-Claude · **Datum:** 2026-07-10 · **Format:** coded findings (som Valet-scen-auditen)
**Koder:** Jacobs, ur `docs/BACKLOG.md` (PLAYTEST-RUNDA 2026-07-10). Mappning nedan.
**Scope:** ramen, inte innehållet. Scenen (ArrivalScene), taktiktavlan (LineupStep) och hörnövningen (CornerInteraction) är diegetiska och rätt — de rörs inte. Granskad yta = **gå-vidare-knappen** genom hela introt, plus två närliggande ram-frågor (match-live-toppen, LedgerFrame-stämpeln).

Interaktiv version: `Sidfots-konformans — introflödet.dc.html`.

---

## Kod-mappning — denna granskning ↔ BACKLOG

| Jacobs kod | Betydelse | Denna granskning | Status |
|---|---|---|---|
| IN-3 | Sidfoten varierar över introstegen | **SF-1…SF-4** | täckt |
| match-topp | Match-live-toppen, samma frågeklass | **UT-1 / UT-2** | täckt |
| PT-4 | "TILL GRANSKNING" i matchhändelse-mono | **TG-1** | **LANDAD** — Code stängde 2026-07-13 (`.lf-stamp` `font-mono → font-body`) |
| PT-5 | Dubbla "gå vidare"-vägar i match-live | **Del D (ny)** | tillägg |
| IN-1-utl. | BoardMeeting-prologens fade-vs-statisk | **Del E / PR-1 (ny)** | tillägg |


---

## Mallen (kanon) — sidfoten = spelets enda avancera-knapp

Kanon finns redan: **`.btn .btn-primary .btn-cta`** (`preview/_base.css`, `src/presentation/styles/*`). Referens: Tillträdet F4 + `preview/components-cta.html`.

| Dimension | Regel |
|---|---|
| **Form** | Full bredd, pill, radie 12px, padding 14×16. Kopparlutning `#DD9555 → #8B4820` + 35% vit topp-sken. Enda primären (regel 5). |
| **Typografi** | **Brödtext** (system-ui) 14px / 700 / +1.5px / VERSAL. Aldrig mono — mono är chrome + matchdata. |
| **Glow** | `--shadow-primary` (koppartonat). `pulseCTA` endast på ceremoniell stängning / match-redo. |
| **Pil →** | Reserverad för *att avancera* (Georgia 400). Sidfoten avancerar → bär pilen. Diegetisk commit gör det inte. |
| **Placering** | Dockad i botten, en per skärm, tonas in via `.scene-cta-area` (opacity 0 + pointer-events:none tills steget är klart). |
| **Verb** | Fritt: SÄTT IGÅNG · VISA MIG · FORTSÄTT · SLÅ HÖRNAN · FÖRSTA OMGÅNGEN · TILL GRANSKNING. Det enda som varierar. |

**Motpolen (inte sidfoten):** `.interaction-cta-copper` — flat koppar, **mono**, ingen lutning, ingen pil, tidsstyrd dränering. Löser en handling *inne i* scenen. Lever i live-matchen och ska förbli distinkt **där**. Skarven mellan de två är vad fynden nedan bevakar.

**Statusvokabulär:** KANON (följer mallen) · RISK (glider idag/nästa pass) · AVVIKELSE (bryter mallen, åtgärd finns) · BESLUT (krockar med tidigare beslut → Jacobs dom).

---

## Del A — Introflödets sidfot, steg för steg

Ordningen en ny spelare möter: Ankomsten (styrelsen) → Startelva (F2) → Hörnan (F3) → Klart (F4). Fyra sidfötter i rad — de ska läsa som en.

### SF-1 · ANKOMSTEN "Sätt igång →" — **KANON (referens)**
- **Fynd:** mallen exakt. `.btn .btn-primary .btn-cta` i `.scene-cta-area`, kopparpill, versal brödtext, pil, dockad, tonas in vid `phase==='cta'`.
- **Grundning:** `src/presentation/screens/ArrivalScene.tsx` (`onComplete → /tilltrade`).
- **Åtgärd:** ingen. Måttstocken de andra tre mäts mot.

### SF-2 · STARTELVA gate-knapp — **RISK**
- **Fynd:** F2 driver rätt vy (`LineupStep`, ingen andra elva-UI). Men om Tillträdet relabelar *LineupSteps egen* foot-knapp ärver sidfoten den ytans form, inte mallen — och spärr-läget riskerar bli en egen gråton i stället för mallen @ 40% opacitet (README-regel 15).
- **Grundning:** `docs/CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md` §F2 — *"dölj dess footer i practice och rendera Tillträdets egen gate-CTA som läser samma canPlay"*.
- **Åtgärd:** ta det andra alternativet — dölj `LineupStep`-foten i practice, docka Tillträdets egen `.btn-cta` som läser `canPlay`. Spärrat = mallen @ 40%, inte en ny knapp.

### SF-3 · HÖRNAN "Slå hörnan" — **AVVIKELSE (nyckelfynd)**
- **Fynd:** F3 återanvänder riktiga `CornerInteraction` i övningsläge (rätt — riktig mekanik). Men dess commit är `.interaction-cta-copper`: mono, flat, ingen lutning, inget glow, ingen pil. I introt är hörnan det *enda* steget där diegetisk commit och sidfot sammanfaller — practice är otidsatt och leder rakt till F4 — så för spelaren är detta "gå vidare". Ändå ser den ut som ingen annan sidfot i introt.
- **Grundning:** `src/presentation/styles/stalvallen-match.css` `.interaction-cta-copper` (font-mono) · `CODE_INSTRUKTION_TILLTRADET §F3`.
- **Åtgärd (kontextdelad):** i **introt** renderas hörnans commit i sidfotsmallen — `.btn-cta`, kopparpill, brödtext, glow, pil — verb *SLÅ HÖRNAN →*. I **live**-matchen står commiten kvar som mono/flat/tidsatt (lär ut den riktiga affordansen under press; jfr `CODE_INSTRUKTION_MATCHLIVE_OMDESIGN` som droppar pilen på live-commiten). Samma knapp, två kontexter, avgjort av `practice`-flaggan som redan finns. Introt lär igenkänning; live lär verkligheten.

### SF-4 · KLART "Första omgången →" — **KANON**
- **Fynd:** terminal avancering: mall + lutning + pil + puls.
- **Grundning:** `CODE_INSTRUKTION_TILLTRADET §F4` — *"gradient + → + puls — reserverad för att avancera"* (samma regel som gör SF-3 och Del C till fynd).
- **Åtgärd:** ingen. Mallens andra ankare (med SF-1).

---

## Del B — Match-live-toppen (samma klass av fråga)

Uppgifts-topparna varierar (HÖRNA · FRISLAG · STRAFF · KONTRING · SLUTMINUTERNA). **Scenen — Stålvallens tavla — behåller sin identitet och rörs inte.** Men uppgiftshuvudet (LED-tagg + titel + minut) bör dela en mall, precis som sidfoten.

### UT-1 · Timern har två former — **RISK**
- **Fynd:** de flesta topparna visar en amber-badge (`3s`); slutminuterna en count-down-ring. Samma nedräkning, två visuella språk i uppgiftshuvudet.
- **Grundning:** `InteractionShell` · `.event-timer` vs `.event-timer.ring`.
- **Åtgärd:** en nedräkningsrepresentation för alla topparna (ringen), eller ratificera badge/ring som två uttryckliga *states* av ett element.

### UT-2 · Fold-hinten är bespoke per event — **RISK**
- **Fynd:** "▲ HÄNDELSE · TRYCK FÖR ATT VÄLJA" på fyra event, "▲ SLUTMINUTERNA · VÄLJ STRATEGI" på det femte.
- **Grundning:** `.interaction-fold-hint`.
- **Åtgärd:** en fold-hint-mall `▲ {ETIKETT} · {UPPMANING}` ägd av `InteractionShell`; de fem event-komponenterna matar in `{tagg, titel, minut, etikett}`, aldrig egen huvud-styling.

**Scenen — rörs inte:** tavlan (7-segment, utvisnings-strip, textremsa, tidslinje) har sin egen ratificerade identitet. *Scenen behåller sin identitet, uppgifterna delar ram.*

---

## Del C — "TILL GRANSKNING": ramen lånade innehållets typsnitt

### TG-1 · Ledger-stämpeln (= PT-4) — **LANDAD 2026-07-13**
- **Fynd:** ledger-stämpeln är fasens enda framåt-handling — samma jobb som "Sätt igång →" och "Första omgången →", alltså en sidfot. Den renderades i mono (samma familj som `.interaction-cta-copper` och `.report-cta`) och läste som matchdata. En ram-som-lånat-innehållets-typsnitt-miss.
- **Status:** Code stängde **PT-4 2026-07-13**: `.lf-stamp` bytte `font-family` från `--font-mono` till `--font-body` (matchar `.btn-cta`). Box-modellen orörd, bara typografin. Konflikten mot LEDGERFRAME-handoffen avgjordes **till flödets fördel**.
- **Grundning:** `docs/BACKLOG.md` PT-4 (stängd) · `ledger.css .lf-stamp`.
- **Residual (Jacobs dom):** `HANDOFF-LEDGERFRAME §1` säger fortfarande "stämpel = mono" och ljuger nu mot koden — uppdatera §1 så mono inte återinförs vid nästa ledger-arbete. Konsekvens: att stämpeln lämnade mono *för att den avancerar* stärker SF-3-domen (hörnans commit bör bli mallen i introt av samma skäl).

---

## Del D — PT-5: två "gå vidare"-vägar till Granska

Ligger i match-live, inte introt — men samma ram-fråga: en skärm ska ha *en* gå-vidare-knapp (mallregel 5). Vid slutsignal finns två: "Se sammanfattning →" i den vita SLUT-rutan **och** "TILL GRANSKNING →" dockad i botten. Båda leder till Granska. Rörigheten Jacob kände i skärmdump 1.

### PT-5 · Dubbla primärer upphäver mallen — **AVVIKELSE (din dom på verbet)**
- **Fynd:** två fyllda kopparknappar som gör samma sak. Den dockade sidfoten är kanonens gå-vidare (mallen bor där på varje annan skärm), så `.btn-cta` "TILL GRANSKNING →" i botten vinner.
- **Grundning:** `MatchLiveScreen.tsx` (final-whistle) · `matchMoodService.getFinalWhistleSummary` · mallregel 5.
- **Åtgärd (kräver Jacobs dom → Code):** sidfoten vinner. "Se sammanfattning →" i vita rutan tas antingen bort helt, eller degraderas till text-/ghost-affordans (`.btn-ghost`) om resultatrutan behöver egen ingång — aldrig en andra fylld kopparknapp. Verbet på sidfoten behålls; det är formen och *antalet* som ska bli en.

---

## Del E — PR-1: scen-prologer som delar `--bg-scene` dämpar olika (ur IN-1)

Äkta nytt fynd, uppstått efter att ordern gick ut. Två intro-scener delar `--bg-scene` men dämpar på två sätt: **ArrivalScene** tonar passerade dialograder till opacity 0.4 (temporal rytm — grått = förflutet, avsiktligt, ska stå). **BoardMeetingScene** (säsong 2+) renderar hela prologen permanent på `--text-light-secondary` utan fade.

### PR-1 · En regel för prolog-dämpning — **BESLUT (kanon för scen-prologer)**
- **Fynd:** frågan är inte "vilken scen har rätt" utan vad grått *betyder* på `--bg-scene`. Domen: **dämpning = förflutet, aktiv text = full styrka.** Då blir båda scenerna instanser av en regel.
- **Grundning:** `ArrivalScene` / `arrivalDialogue.ts` · `boardMeetingScene.ts` · delar `--bg-scene` · knyter an till BACKLOG IN-1.
- **Åtgärd (kräver Jacobs dom):** ratificera regeln "dämpning = förflutet, aktiv text = full styrka" som kanon för alla scen-prologer på `--bg-scene`. Code tillämpar den på båda: ArrivalScene orörd (redan rätt, aktiv rad ska dock vara full styrka — stänger IN-1), BoardMeeting-prologen lyfts till full `--text-light` (eller ges rad-fade om den ska ha progression). En fix täcker båda scenerna + IN-1.

---

## Konformans mot sidfotsmallen

| Yta | Form | Typo | Glow | Pil | Plats |
|---|:--:|:--:|:--:|:--:|:--:|
| SF-1 Ankomsten · Sätt igång | ✓ | ✓ | ✓ | ✓ | ✓ |
| SF-2 Startelva · gate | ~ | ~ | ~ | — | ✓ |
| SF-3 Hörnan · Slå hörnan | ✗ | ✗ | ✗ | ✗ | ✓ |
| SF-4 Klart · Första omgången | ✓ | ✓ | ✓ | ✓ | ✓ |
| UT-1 Match-topp · timer | ~ | ✓ | — | — | ✓ |
| UT-2 Match-topp · fold-hint | ~ | ✓ | — | — | ✓ |
| TG-1 Ledger · Till granskning | ✓ | ✗ | ~ | ✓ | ✓ |

✓ följer mallen · ~ glider / bör ratificeras · ✗ bryter mallen

---

## En rad ner

Sidfoten, uppgifts-toppen, stämpeln, de dubbla vägarna och prolog-dämpningen är samma sorts fråga: en **ram** som ska vara en mall, medan **innehållet** (scenen, tavlan, hörnövningen, dialogen) behåller sin identitet. Där ramen glider är det för att den lånade innehållets röst, eller för att två element gör samma jobb. Stämpeln är redan fixad (PT-4). Kvar för Jacobs dom: hörnans commit (SF-3), vilken Granska-knapp som vinner (PT-5), regeln för prolog-dämpning (PR-1/IN-1). Lås mallen, låt verbet variera, och en förstagångsspelare lär sig "gå vidare" en gång.

---

## Förbehåll

Den byggda Tillträdet-komponentens exakta klasser kunde inte läsas som färdig markup — flödet finns i koden som spec (`CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md`) + designmock, inte som en byggd komponent. SF-2 och SF-3 är grundade mot instruktionsdokumentet och de riktiga interaktions-klasserna (`stalvallen-match.css`); verifiera mot slutlig markup vid wiring.
