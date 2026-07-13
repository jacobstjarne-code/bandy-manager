# CODE-INSTRUKTION — Sidfots-mallen + intro-ramen

**Skriven:** 2026-07-10 (Design) · **Datum uppdaterad:** 2026-07-13
**Ägare:** Code · **Källa:** `AUDIT-SIDFOT-INTROFLODE-2026-07-10.md` (dömd, inga öppna frågor kvar till Jacob utom de tre ruling-punkterna som markeras `JACOB` nedan)
**Grundprincip:** ramen (gå-vidare-knappen, uppgifts-toppen, prolog-dämpningen) ska vara EN mall; innehållet (scenen, tavlan, hörnövningen, dialogen) behåller sin identitet. Verb-copyn varierar, formen står still.

**Mallen (kanon, ändra inte):** `.btn .btn-primary .btn-cta` — kopparlutning `#DD9555→#8B4820`, versal **brödtext** (aldrig mono), reserverad pil `→` för *att avancera*, `--shadow-primary`, dockad i `.scene-cta-area`, EN per skärm.

---

## KÖRORDNING

1. **T4 (HANDOFF §1)** först — ren dokumentfix, låser upp att §1 inte ljuger mot koden (PT-4 landade redan 2026-07-13). Ingen kodrisk.
2. **T2 (PT-5)** — liten, isolerad, tar bort en synlig rörighet Jacob redan pekat ut.
3. **T3 (PR-1/IN-1)** — token-regel + två scen-tillämpningar; stänger IN-1 i samma svep.
4. **T1 (SF-3)** — störst (kontextdelad commit); gör sist när mönstret från T2/T3 satt sig.
5. **T5 (vaksamhet)** — SF-2 / UT-1 / UT-2: reala men ännu inte dömda ramfrågor. Ratificera eller parkera, förlora inte.

---

## T1 · SF-3 — hörnans commit ska bära sidfotsmallen I INTROT

**Fynd:** F3 återanvänder riktiga `CornerInteraction` i övningsläge (rätt — riktig mekanik). Men dess commit är `.interaction-cta-copper`: mono, flat, ingen lutning, inget glow, ingen pil. I introt är hörnan det ENDA steget där diegetisk commit och sidfot sammanfaller (practice är otidsatt, leder rakt till F4) — så för spelaren ÄR detta "gå vidare", men den ser ut som ingen annan sidfot.

**Ändring (kontextdelad, styrs av `practice`-flaggan som redan finns):**
- I **introt/practice**: rendera hörnans commit i sidfotsmallen — `.btn-cta`, kopparpill, brödtext, glow, pil. Verb: `SLÅ HÖRNAN →`.
- I **live**-match: commiten står KVAR som `.interaction-cta-copper` (mono, flat, tidsatt) — den lär ut den riktiga affordansen under press. Introt lär igenkänning, live lär verkligheten.

**Fil:** `CornerInteraction` (commit-knappen) · flagga: samma `practice`-prop som redan skiljer övning från live · jfr `stalvallen-match.css .interaction-cta-copper`.

**Verifiera:** (a) introts hörnsteg visar en `.btn-cta`-formad knapp identisk med SF-1/SF-4 så när som på verbet. (b) En live-match visar fortfarande mono/flat/tidsatt commit — oförändrad. (c) Ingen annan `.interaction-cta-copper`-yta påverkad.

**Stödargument (efter PT-4):** stämpeln lämnade mono *för att den avancerar* (T4). Hörnans commit i introt gör samma jobb — samma skäl, samma mall.

---

## T2 · PT-5 — en gå-vidare-knapp vid slutsignal, inte två

**Fynd:** vid slutsignal finns två vägar till Granska på samma skärm: "Se sammanfattning →" (fylld kopparknapp i vita SLUT-rutan) OCH "TILL GRANSKNING →" (dockad sidfot). Båda leder till samma vy. Två fyllda primärer upphäver mallregel 5 (en primär per skärm) — spelaren vet inte vilken som är "gå vidare".

**Dom (Design):** den dockade sidfoten vinner — `.btn-cta` "TILL GRANSKNING →" är kanonens gå-vidare.

**Ändring — `JACOB` väljer (a) eller (b):**
- **(a)** ta bort "Se sammanfattning →" i vita rutan helt — sidfoten räcker.
- **(b)** om resultatrutan ska kunna öppna sammanfattningen självständigt: degradera den till text-/ghost-affordans (`.btn-ghost`), aldrig en fylld kopparknapp.

**Fil:** `MatchLiveScreen.tsx` (final-whistle-blocket) · `matchMoodService.getFinalWhistleSummary`.

**Verifiera:** slutsignal-skärmen har exakt EN fylld kopparknapp (sidfoten). Om (b): den andra ingången är synligt sekundär (ghost/länk). Verbet "TILL GRANSKNING" på sidfoten behålls.

---

## T3 · PR-1 / IN-1 — en regel för prolog-dämpning på `--bg-scene`

**Fynd:** två intro-scener delar `--bg-scene` men dämpar olika. `ArrivalScene` tonar passerade dialograder till opacity 0.4 (temporal rytm — avsiktlig). `BoardMeetingScene` (säsong 2+) renderar hela prologen permanent på `--text-light-secondary` utan fade. IN-1 (ankomsttexten "stannar grå") är samma fråga.

**Regel att ratificera (`JACOB`):** *dämpning = förflutet · aktiv text = full styrka.* Dämpning är en TEMPORAL signal på `--bg-scene`, inte en dekorativ ton.

**Ändring efter ratificering:**
- `ArrivalScene`: fade på passerade rader ORÖRD (redan rätt). Säkerställ att den AKTIVA raden är full styrka (`--text-light`), inte grå — det stänger IN-1.
- `BoardMeetingScene`: prologen är aktiv text (spelaren läser den nu) → lyft till full `--text-light`. Om den ska ha rad-för-rad-progression: ge den samma fade-rytm som ArrivalScene i stället.

**Fil:** `ArrivalScene` / `arrivalDialogue.ts` · `boardMeetingScene.ts` · token: `--text-light` / `--text-light-secondary` i `global.css` (spegla till `colors_and_type.css`).

**Verifiera:** (a) ingen scen visar aktiv, oläst prolog-text i `--text-light-secondary`. (b) ArrivalScenes passerade rader tonar fortfarande. (c) En fix, båda scenerna + IN-1 stängd. Fable dömer tokenregeln när Code visar vilken variabel som sitter på raderna (per IN-1-raden i BACKLOG).

---

## T4 · HANDOFF-LEDGERFRAME §1 — synka dokumentet mot koden (PT-4 landade)

**Fynd:** PT-4 stängdes 2026-07-13 — `.lf-stamp` bytte `font-family` från `--font-mono` till `--font-body` (matchar `.btn-cta`). Men `HANDOFF-LEDGERFRAME-2026-06-08.md §1` säger fortfarande "stämpel = mono 12px fet versal" och ljuger nu mot koden — risk att mono återinförs vid nästa ledger-arbete.

**Ändring (ren dokumentfix):** uppdatera `design-system/briefs/HANDOFF-LEDGERFRAME-2026-06-08.md §1` — stämpeln är brödtext (sidfotsmallen), inte mono. Notera att konflikten avgjordes till flödets igenkänning över liggarens dokument-känsla, och varför (stämpeln avancerar → den är en sidfot).

**Verifiera:** §1 matchar `.lf-stamp` i `ledger.css`. Ledgerns ÖVRIGA mono-chrome (masthead, RPS-strip, sektionsrubriker) står kvar — det är bara den framåt-handlande stämpeln som lämnat mono.

---

## T5 · Vaksamhet — reala ramfrågor, ännu inte dömda (förlora inte)

Dessa är fynd ur auditen (Del A/B) som INTE har en fattad dom än. Ratificera som states eller parkera medvetet — batcha inte in dem i T1–T4 oreflekterat.

- **SF-2 (Startelva-gaten):** F2 driver rätt vy (`LineupStep`). Risk: om Tillträdet relabelar LineupSteps EGEN foot-knapp ärver sidfoten den ytans form, inte mallen. Åtgärd (om bekräftad vid wiring): dölj LineupStep-foten i practice, docka Tillträdets egen `.btn-cta` som läser `canPlay`; spärrat = mallen @ 40% opacitet (README-regel 15), inte en ny grå knapp.
- **UT-1 (match-topp timer):** de flesta topparna visar amber-badge (`3s`); slutminuterna visar count-down-ring. En nedräkningsrepresentation för alla (ringen), ELLER ratificera badge/ring som två uttryckliga *states* av ett element — inte två ad hoc.
- **UT-2 (match-topp fold-hint):** "▲ HÄNDELSE · TRYCK FÖR ATT VÄLJA" på fyra event, egen text på det femte. En fold-hint-mall `▲ {ETIKETT} · {UPPMANING}` ägd av `InteractionShell`; event-komponenterna matar in `{tagg, titel, minut, etikett}`, aldrig egen huvud-styling.

**Scenen rörs inte:** Stålvallens tavla (7-segment, utvisnings-strip, textremsa, tidslinje) har egen ratificerad identitet. Uppgiftshuvudet ovanpå delar mall; tavlan gör det inte.

---

## KOD-MAPPNING (BACKLOG ↔ denna order)

| BACKLOG | Denna order | Status |
|---|---|---|
| IN-3 | mallen + T1/T5 (sidfoten över introstegen) | dömd |
| PT-4 | T4 (stämpeln, kod landad; dokument kvar) | landad → dokumentfix |
| PT-5 | T2 | dömd, en Jacob-ruling (a/b) |
| IN-1 | T3 | dömd med T3, en Jacob-ruling (regeln) |
| match-topp | T5 (UT-1/UT-2) | ej dömd — vaksamhet |

**Referens:** `AUDIT-SIDFOT-INTROFLODE-2026-07-10.md` (följer med till `design-system/` som referens; denna instruktion driver arbetet).
