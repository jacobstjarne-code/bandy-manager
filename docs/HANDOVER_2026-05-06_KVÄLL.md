# HANDOVER 2026-05-06 KVÄLL

**Till:** Nästa Claude-session
**Från:** Opus, slutet av forsknings + utrednings-session 2026-05-06
**Föregående handover:** `HANDOVER_2026-05-06.md` (morgonens, delvis föråldrad — se "Status" nedan)

---

## STRIKT ANVISNING — LÄS DETTA INNAN DU GÖR NÅGOT

Jacob har flaggat att tidigare sessioner spårat iväg. Denna handover är skriven för att förhindra det.

**Vad du SKA göra först:**
1. Läs detta dokument helt
2. Bekräfta för Jacob att du läst det
3. Fråga vilken av de tre öppna trådarna han vill ta först (lista nedan)
4. Vänta på svar

**Vad du INTE SKA göra:**
- Inte läsa in alla forsknings-PM:er. De ligger på disk som referensmaterial. Läs bara den som är relevant för aktuell uppgift.
- Inte återanalysera forskningen — den är klar, sammanfattad i `2026-05-06_research_synthesis.md`.
- Inte utvidga scope. Action-listan nedan är komplett. Nya idéer noteras men hanteras inte i denna session.
- Inte börja på Edit 2 (squadEvaluator) i samma session som Edit 1 — den kräver stress-test och egen kontext-budget.
- Inte skriva nya PM:er om det inte uttryckligen efterfrågas. Disk-statusen nedan är komplett.

---

## STATUS — VAD ÄR KLART OCH VAD ÄR ÖPPET

### KLART (denna session)

- Fulltext läst för alla fyra peer-reviewed papper (van den Tillaar herr+dam, Petré, Johansson) plus Persson 2023 (junior C-uppsats)
- Sju PM:er på disk i `docs/research/`:
  - `2026-05-06_van_den_tillaar_pm.md`
  - `2026-05-06_petre_pm.md`
  - `2026-05-06_johansson_pm.md`
  - `2026-05-06_persson_junior_pm.md`
  - `2026-05-06_research_synthesis.md` (samlad syntes)
  - `2026-05-06_engine_audit.md` (kod-utredning)
  - `2026-05-06_code_instructions.md` (Code-spec'ar)
- `bandy_research_targets.json` uppgraderad till v0.2 med fulltext-data
- `replication_strategy.md` uppdaterad med Nivå 1B (trötthetsmodell)
- Spår 1 — Fatigue: utredningen visar att Bandy Managers trötthetsmodell **redan är Johansson-trogen**. Ingen omskrivning krävs.
- Spår 2 — Position-baseringar: två kritiska avvikelser identifierade, Code-instruktioner färdigskrivna

### KLART REDAN INNAN SESSIONEN (commits från Code, postdaterade morgonens HANDOVER_2026-05-06.md)
- Sture-prefix bug — `2e74e4b1 feat: ArrivalScene — getStureLine(clubId)`
- Steg 3 stripes-revert — `be4954cd design: steg 3-revert — stripes återställda`
- Stripes-normalisering — `93655468 design: Steg 3 B2 stripes-normalisering`

### ÖPPET (action-list nedan, prioriterad)

---

## ACTION-LIST — PRIORITERAD

### 1. ArrivalScene fade speed + contrast (HÖG, från morgonens HANDOVER)

**Status:** Lokala edits gjorda i workspace till `src/presentation/screens/ArrivalScene.tsx`. **EJ COMMITTADE.** Senaste commit på main är `ccd1bcf7`.

Edits gjorda:
- 6 hunks i ArrivalSceneInner: setTimeout 3400→1700ms, fade animationDelays halverade, opacity = 1 (option A), färg via `var(--text-light-secondary)` när `arrivalDim`

Code-instruktion presenterades i chat tidigare i sessionen (innan forskningsspåret). Jacob har **inte** klistrat in den i Claude Code-terminalen ännu.

**Vad du ska göra:**
- Bekräfta med Jacob: ska denna gå först (innan forskningsedits) eller har den dragits tillbaka?
- Om go: presentera Code-instruktionen igen från sessionens tidigare chat-historik (eller läs `git diff` lokalt och formulera)
- Verifierings-steg: build + test + commit i "rot:"-format + push + Vercel-verify

**Flagga:** Det finns en potentiell `.fadein` blink-quirk (`animation-fill-mode: forwards` istället för `both`). Bevaka vid playtest. Fix om symptom: lägg `animation-fill-mode: both` på `.fadein` i `src/styles/global.css`.

### 2. Edit 1 — Petré-kalibrera promotion-attribut (HÖG, säker)

**Disk-instruktion:** `docs/research/2026-05-06_code_instructions.md` (Edit 1-sektionen)
**Fil:** `src/presentation/store/actions/academyActions.ts`, funktion `generateAttributes` inuti `promoteYouthPlayer`
**Risk:** Låg. Påverkar bara nya promotion-händelser. Ingen retroaktiv effekt. Inga matchmotor-konsekvenser.

Instruktionen är komplett klistra-in-redo. När Jacob klar för det, säg åt honom att kopiera Edit 1-blocket från `2026-05-06_code_instructions.md` och klistra i Code-terminalen.

### 3. Edit 2 — squadEvaluator-vikter (MEDEL, strukturell)

**Disk-instruktion:** `docs/research/2026-05-06_code_instructions.md` (Edit 2-sektionen)
**Fil:** `src/domain/services/squadEvaluator.ts`
**Risk:** Strukturell. Ändrar match-engine-output. Kräver stress-test 200 matcher mot fem bandygrytan-targets, möjlig GOAL_RATE_MOD-rejustering.

**Instruktionen är komplett, MEN:** kör den i egen ny session med tom kontext. Stress-test-cykeln kan kräva 2–3 iterationer.

### 4. Uppdatera HANDOVER_2026-05-06.md (LÅG, hygien)

Morgonens HANDOVER hade två fel som upptäcktes:
- Sture/Steg3-TODO listades som öppna men var redan gjorda av Code
- CLAUDE.md-path angavs som `/docs/CLAUDE.md` men ligger i rotmappen

Bevara historiken eller skriv ny. Jacob's val.

### 5. Niklas-möte-prep (MEDEL, värdeskapande)

Forsknings-syntesen identifierade fyra konkreta frågor till Niklas (elit-bandycoach) i `2026-05-06_research_synthesis.md` sektion "Inför Niklas-möte". Om mötet närmar sig: lyft fram dem.

---

## REFERENSER (läs vid behov, inte preventivt)

| Fil | Användning |
|---|---|
| `docs/research/2026-05-06_engine_audit.md` | Kod-utredning, två avvikelser, edit-spec'ar |
| `docs/research/2026-05-06_code_instructions.md` | Klistra-in-redo Code-instruktioner |
| `docs/research/2026-05-06_research_synthesis.md` | Samlad forsknings-syntes |

---

## TILLÄGG FRÅN CODE — KVÄLL (efter implementation-session)

Alla punkter i Opus action-list (1–3) är körda och pushade. Ytterligare TECH-1-sprint kördes i samma session.

### Commits pushade i denna session (kronologisk ordning)

| Commit | Innehåll |
|--------|----------|
| `a217dc0` | Petré-kalibrering `generateAttributes()` — Edit 1 ✅ |
| `ec3b408` | squadEvaluator-vikter — Edit 2 ✅ (200-match stress-test, noll drift) |
| `6ce6bfe` | PreMatchContext refaktorering → strings-pool |
| `706498e` | Per-klubb Sture-repliker + snabbare ArrivalScene-animationer |
| `ca8bcb5` | PreMatchContext-pool åter-tonad (rivalry-namn, {nword}/{posword}) |
| `1cde1a9` | Squad ⚡ NU-vy — akut-dashboard som default-tab |
| `8e1869b` | TECH-1 Del 4 — halvtidsval + transfer-kafferum + NU-pool |

### Vad TECH-1 Del 4 levererade

**Halvtidsvalet (HalfTimeSummaryScreen):**
- Tre val: lugna (fitness+5, moral+3) / pressa (form+10, 15% skaderisk) / prata (moral+12)
- `applyHalftimeDecision()` i store
- Fortsätt-knapp disabled tills val gjorts

**Transfer-kafferum:**
- `TRANSFER_PENDING_BID_EXCHANGES` — 4 exchanges om aktiva bud (vi väntar på svar)
- Trigger: `outgoing pending` bid → 33% chans per omgång

**NU-pool (squadNuStrings.ts):**
- `getInjuryText`, `getSuspensionText`, `getMoraleText`, `getContractText`
- Deterministisk picker per player.id

### Allt gjordes utan mock (Jacobs beslut)

### Nästa session

Playtest hela TECH-1 (Del 1-4) + ArrivalScene. Se KVAR.md för kö.
| `docs/research/bandy_research_targets.json` | v0.2 strukturerade kalibrerings-targets |
| `docs/research/2026-05-06_replication_strategy.md` | Tre nivåer av replikering, Nivå 1B trötthetsmodell |
| Petré/Johansson/Persson/van den Tillaar PM | Per-papper-detaljer, läs bara om specifik fråga uppstår |

---

## VIKTIGA REGLER (från Jacob's tidigare flag)

- Skriv inte i Bandy Manager-kod via Claude Opus utan tydlig spec. Kod-edits via Claude Code (Sonnet) i terminalen.
- Code-instruktioner ska vara kompletta, klistra-in-redo, med verifierings-steg och commit-format.
- "rot:"-prefix på commit-meddelanden enligt CLAUDE.md (i rotmappen, inte /docs).
- Aldrig isolerad komponent-verifiering — trace alltid render-flöde via parent-screen.
- Sessionsstart: hämta tid via timeapi-mönster om Jacob's user preferences kräver det.

---

## NÄR DENNA HANDOVER ANSES UTFÖRD

När Action 1 + 2 är pushade, verifierade i Vercel, och commit-meddelanden inkluderar referens till disk-PM:er. Action 3 räknas inte mot denna handover — den är en egen session.

---

*Skriven 2026-05-06 av Opus i slutet av forsknings + utrednings-session. Disk-status komplett vid skrivning.*
