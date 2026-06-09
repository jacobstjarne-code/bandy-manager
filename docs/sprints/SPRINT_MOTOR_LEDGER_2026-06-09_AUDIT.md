# Sprint Motor + LedgerFrame — audit (2026-06-07 – 2026-06-09)

Kod-verifierad audit. Visuella komponenter (MomentumBar, HalftimeModal, Spak B-kort,
LedgerFrame chrome) kräver manuell playtest — se "Ej verifierat" nedan.

---

## Spår A — MatchLive / motorkänsla (commits d0768ab – a052bec)

### Spec-punkter

- [x] **Steg 0 — exponera motortillstånd på MatchStep**
  Verifierat via grep: `homeInitiative`, `awayInitiative`, `homePossession` exporteras
  ur matchCore och populeras i `toMatchStep()`. Ingen ny motorlogik — surfacing only.

- [x] **A1 — pauseLean modulerar post-paus-fönstret**
  `PAUSE_LEAN_FACTOR` i matchCore, guard `pauseLean !== 'hold'` på rad 897.
  Värden push=1.25/calm=0.80 ger ±(12–15)% leanShift i HalftimeModal preview.
  Samma faktor driver sim och preview — §2-ärlighets-principen uppfylld.
  Simplify-passet smalnade Record till `'push'|'calm'` (hold-nyckeln var dead data).

- [x] **Ärlig MomentumBar — nål = homeInitiative**
  `c301327`: MomentumBar läser `step.homeInitiative` istf skott-proxy.
  Grep: `MomentumBar.tsx` tar `homeInitiative`-prop, inte beräknad ratio.

- [x] **A2/A3/A4 — HalftimeModal paussnack + preview + mörk LED-panel**
  `7db0761`: PAUSSNACK-pools (situation×lean), preview-bar (samma PAUSE_LEAN_FACTOR),
  dark Stålvallen-panel (stalvallen-match.css .ht-panel extension).
  Verifierat: `matchLiveText.ts` exports `PAUSSNACK`, `BRYTPUNKT`.
  **Awaiting playtest:** preview-bar-riktning mot faktiskt 2H-utfall.

- [x] **Spak A C — MomentumBar BRYTPUNKT-text**
  `a5e2ce7`: BRYTPUNKT-strängar ur `matchLiveText.ts`, `{lag}`-interpolation.
  Grep: `MomentumBar.tsx` importerar `BRYTPUNKT` och väljer sträng på `situation`.

- [x] **Spak B — sent matchningsval som feed-kort**
  `dfa771e`: `SpakBCard.tsx`, gate (`creditsLeft > 0`), mentality-väg, amber-glow.
  Delar `MAX_TACTIC_CHANGES = 3`-budgeten (dokumenterat i DECISIONS).
  **Awaiting playtest:** amber-glow timing, kortet i live-feed vid rätt situationer.

- [x] **Dev-scener (32 ytor)**
  `a052bec`: `/dev/scenes` renderar alla ytor.
  Playwright-harness skapad (`f481958`): `tests/visual/scenes.spec.ts`.
  **Awaiting:** Linux-baselines seedad via GitHub Actions `visual-baselines` workflow.

### Två 🟥 modaler → mörk panel
  `23d00b4`: SubstitutionModal + PhaseOverlay CSS-migrerads till `.match-modal-panel`.
  Grep bekräftar inga kvarvarande inline `background: rgba(0,0,...` i de filerna.

---

## LedgerFrame — liggare-krom (commits 0ad82ab – 7d0827a + 76f99ea)

### Spec-punkter

- [x] **Del 1 — Incoming triage**
  `docs/incoming/` innehåller nu bara `README.md`.
  Kanon-mockar i `docs/mockups/`, handoff i `design-system/briefs/`. Verifierat via `ls`.

- [x] **Del 2 — LedgerFrame-komponenten**
  `src/presentation/components/ledger/LedgerFrame.tsx` + `src/presentation/styles/ledger.css`.
  Alla tokenmappningar mot handoff flaggade i CSS-kommentarer (5 avvikelser, alla på-skala).
  Simplify-passet hoistade `PHASE_INDEX` + `PERF_DOTS` till module-level (effektivitet).
  **Awaiting playtest:** masthead-layout, RPS-strip, marginal + perforering, flikrad.

- [x] **Del 3 — MatchLiveScreen Spela-wrapping**
  `1b1577e`: `<LedgerFrame phase="spela" stamp={spelStamp}>` wraps hela MatchLiveScreen.
  `spelStamp`: `matchDone` → "TILL GRANSKNING →", `showHalftime` → "PAUSSNACK →" (no-op
  onClick — modal täcker alltid stampen vid halvtid; explicit `() => {}` efter simplify-pass).
  `managedClub` via `useManagedClub()` (simplify-pass ersatte inline `.find()`).
  Build + 1077/1078 tester gröna.

- [x] **Del 4 — DESIGN-DECISIONS.md §LF-1–5**
  `7d0827a`: fem beslut låsta (avgränsning, stamp-semantik, LED-dark, inga tokens, seasonSpanLabel).

- [x] **Hållna per spec: Förbered-children, Granska-children**
  Inga children implementerade. Väntar Design-mock + Jacobs gaffel-beslut.

---

## Simplify-pass (commit 76f99ea)

| Fynd | Fil | Applicerat |
|------|-----|-----------|
| `useManagedClub()` istf inline `.find()` | MatchLiveScreen | ✅ |
| halftime onClick `() => setShowHalftime(true)` → `() => {}` | MatchLiveScreen | ✅ |
| `PHASE_INDEX` + `PERF_DOTS` hoistade till module-level | LedgerFrame | ✅ |
| `PAUSE_LEAN_FACTOR` smalnad `'push'\|'calm'`; HalftimeModal direkt-beräkning | matchCore + HalftimeModal | ✅ |

Hoppade (motiverade): `LedgerTab` shape, `managedIsHome`-repeats, player filter i render — alla pre-existing.

---

## Kod-verifiering

```
npm run build → ✓ built in 3.37s
npm test      → 1077/1078 (1 pre-existing: boardMeetingScene.test.ts > triggar säsong 2)
npm run lint:design → 1 ERROR i ArrivalScene.tsx:99 borderRadius:12 (pre-existing Opus-ström)
```

Det failande testet + lint-felet är från Opus parallellström (ocommittad `boardMeetingScene.ts`).
Åtgärdas när den strömmen committas.

---

## Ej verifierat — kräver playtest

| Komponent | Vad som behöver synas |
|---|---|
| MomentumBar | Nålens lut mot faktisk motorinitiativ, BRYTPUNKT-text i rätt situation |
| HalftimeModal dark panel | Mörk bakgrund, preview-bar mot faktiskt 2H-utfall |
| Spak B feed-kort | Amber-glow timing, synlighet i live-feed vid gate-pass |
| LedgerFrame chrome | Masthead layout, RPS-strip (aktiv/klar/pending), marginal + perforering, stämpel vid fulltime |
| MatchLiveScreen i LedgerFrame | Hela live-skärmen wrappat — scroll, SubstitutionModal overlay, HalftimeModal z-index |

---

## Nyckelbeslut (registrerade i DECISIONS.md + DESIGN-DECISIONS.md)

- §2-ärlighets-principen: UI-indikator → verklig motorvariabel (inga parallella speglar)
- Spak B delar `MAX_TACTIC_CHANGES = 3` (Jacob 2026-06-08)
- Playwright Linux-baselines seedas via `workflow_dispatch` (inte i CI förrän seedad)
- §LF-1–5: LedgerFrame avgränsad till rond-flödet, inga nya tokens, stamp = funktionell status

---

## Commit-lista

| Hash | Beskrivning |
|------|-------------|
| `d0768ab` | Steg 0 — exponera motortillstånd |
| `c301327` | Ärlig MomentumBar |
| `23d00b4` | Två modaler → mörk panel |
| `fa6d014` | A1 — pauseLean modulerar post-paus |
| `a5e2ce7` | A C — BRYTPUNKT-strängar |
| `7db0761` | A2/A3/A4 — HalftimeModal paussnack + preview |
| `dfa771e` | Spak B feed-kort |
| `1f943e7` | DECISIONS: Spak B budget-delning |
| `a052bec` | Dev-scener + bilaga (32 ytor) |
| `f481958` | Playwright visuell-harness |
| `0ad82ab` | Incoming triage |
| `4c2cf10` | LedgerFrame komponent + CSS |
| `1b1577e` | MatchLiveScreen Spela-wrapping |
| `7d0827a` | DESIGN-DECISIONS §LF-1–5 |
| `76f99ea` | Simplify-pass |
