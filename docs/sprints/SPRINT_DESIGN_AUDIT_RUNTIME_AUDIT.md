# Sprint Design Audit Runtime — audit

Verifierat lokalt mot dev-server 2026-04-20T09:30:47Z.
Verifierat mot prod (bandy-manager.vercel.app) 2026-04-20T10:50–10:53Z efter Patch 1+2.
Verifierat mot prod 2026-04-20T11:18–11:20Z efter Sprint 22.2 + 22.3.

---

## Punkter i spec

- [x] §2.1 Filstruktur — `src/debug/designAudit/` med index.ts, types.ts, reporter.ts, rules/ (9 filer), __tests__/ (8 filer)
- [x] §2.2 Exponering — `src/main.tsx` uppdaterad med dynamic import under `DEV || VITE_AUDIT_ENABLED`
- [x] §2.3 API — `window.__designAudit()`, text/json-format, rule-filtrering — alla fungerar
- [x] §2.4 Types — `Finding`, `Report`, `Severity` exporterade
- [x] §4.1–§4.9 Alla 9 regler implementerade
- [x] §5 Reporter — text-format matchar spec bokstavligt
- [x] §6.3 Tester — 1451/1451 efter alla patchar
- [x] §7 Leveranskriterier — build + test passerar
- [x] DESIGN_SYSTEM.md §19 uppdaterad
- [x] VITE_AUDIT_ENABLED satt på Vercel
- [x] Prod-verifiering genomförd (två rundor)

---

## Dev-server-körning 2026-04-20T09:30Z (initial)

**Screen:** `/` (intro/NewGameScreen)
**Resultat:** 30 findings (2 error, 28 warn)
3 FP-kategorier identifierade, rapporterade till Opus.

---

## Post-review 1 — Opus-godkännande 2026-04-20

### Patch 1: cardPadding — skippa borderRadius 50% och 9999
Cirkel- och pill-mönster. +2 tester.

### Patch 2: sectionLabels — skippa BUTTON-element
CTA-knappar med uppercase/letterSpacing är inte labels. +1 test.

### FP3: gridGaps — INGEN ändring
Intro-skärmens generösare spacing flaggas fortsatt som warn för manuell granskning.

Status efter Patch 1+2: 1447/1447 tester gröna.

---

## Prod-verifiering 1 — 2026-04-20T10:50–10:53Z

VITE_AUDIT_ENABLED satt på Vercel. Fyra skärmar auditerade (`/game/tactic` finns inte, `/game/match` användes istället).

| Skärm | Findings | Error | Warn |
|---|---|---|---|
| /game/dashboard | 14 | 5 | 9 |
| /game/board-meeting | 32 | 22 | 10 |
| /game/squad | 78 | 8 | 70 |
| /game/match | 33 | 19 | 14 |

Patch 1+2 bekräftat borttaget de initiala FP:erna. Fyra nya FP-kategorier (A–D) och ~24 genuina buggar identifierade.

---

## Post-review 2 — Sprint 22.2 + 22.3, 2026-04-20

### Sprint 22.2: Regel-kalibrering (FP-A till FP-D)

**FP-A:** cardPadding — skip-listan utökad från `9999` till regex `/^9+px$/` (fångar `99px`, `9999px` etc).
**FP-B:** cardPadding — `if (el.tagName === 'BUTTON') continue` i inline-borderRadius-checken.
**FP-C:** cardPadding — `if (val.startsWith('var(')) continue` för CSS-variabler.
**FP-D:** sectionLabels — `if (fs > 10) continue` (skärmrubriker är inte labels).

+4 tester. Status: 1451/1451.

### Sprint 22.3: Buggfixar

Utökat scope från Opus ursprungliga lista (BoardMeetingScreen + MatchScreen) efter att Code identifierat att `/game/match` är en container för StartStep/LineupStep/TacticStep.

- `BoardMeetingScreen.tsx`: 7× `10px 14px → 10px 12px`, 7× `fontSize 9/letterSpacing 2.5 → 8/2`
- `TacticStep.tsx`: 2× padding, 2× labels
- `StartStep.tsx`: 2× card-round `→ 8px 12px`, 1× `8px 14px → 7px 10px`, 1× `10px 14px → 10px 12px`, 4× labels
- `LineupStep.tsx`: 1× label + emoji-prefix (🧤/🛡/🏒/⚙️/⚔️) på positionsrubriker
- `DashboardScreen.tsx`: 1× `6px 10px → 7px 10px`

Status: 1451/1451.

---

## Prod-verifiering 2 — 2026-04-20T11:18–11:20Z

Efter Sprint 22.2 + 22.3-push och Vercel-redeploy.

| Skärm | Prod 1 (findings) | Prod 2 (findings) | Delta |
|---|---|---|---|
| /game/dashboard | 14 (5E/9W) | 12 (6E/6W) | -2 |
| /game/board-meeting | 32 (22E/10W) | 2 (0E/2W) | **-30** |
| /game/match | 33 (19E/14W) | 8 (2E/6W)* | -25 |

*match auditerades som `/game/match/live` i runda 2 (live-match istället för pre-match lineup). Inte direkt jämförbart men samma filer i scope.

### Verifiering av patchar

- **Sprint 22.2 (FP-A–FP-D):** inga `99px`/`var()`/BUTTON-warnings kvar i cardPadding. Inga 11px+-labels flaggade. Bekräftat.
- **Sprint 22.3:** samtliga `10px 14px`-errors på card-sharp/card-round borta. Samtliga 9/2.5-labels i BoardMeetingScreen och MatchScreen (sub-steps) borta. Bekräftat.

### Kvarvarande findings efter Prod 2

**Ej åtgärdat av patch, kräver manuell bedömning (FP-E):**
- Dashboard: 3 × `card-sharp padding: 0px` — kan vara legitima wrapper-kort vars padding sitter på child-element, eller genuin bugg. Bedöms visuellt.

**Nya fynd som inte var i Sprint 22.3-scopet:**
- Dashboard: 1 × label `fontSize: 9, letterSpacing: 2.5` — missad i 22.3, samma rotorsak som de som fixades.
- Dashboard: 1 × label `fontSize: 10` — gränsfall (FP-D skippar >10, så 10 fortfarande flaggas medvetet).
- Match/live: 1 × label `fontSize: 9, letterSpacing: 1.5` — MatchLiveScreen har egna labels som 22.3 inte täckte (fixade StartStep/LineupStep/TacticStep i pre-match).
- Flera skärmar: ~10 inline-borderRadius-warnings på wrappers (3px/6px/8px/10px/13px). Ingen systematisk bugg, kräver manuell granskning per fall.
- Board-meeting: "Styrelsemöte"-rubrik saknar emoji (warn, mindre prioritet).

### Tolkning

Infrastrukturen fungerar som specen avsåg. Sprint 22-serien levererade det scopet den tog på sig. Prod 2 avslöjar ytterligare avvikelser av samma typ på andra platser — detta är löpande designsystem-hygien, inte en ny sprint. Plockas upp när någon ändå rör filerna, eller vid nästa planerade UI-städ-runda.

---

## Tester (slutstatus)

```
Test Files  124 passed (124)
Tests       1451 passed (1451)
```

## Ej levererat

Inget — alla spec-punkter implementerade och verifierade i prod (två rundor).

## Framtida städ (ej blockerande)

- Dashboard `padding: 0px` × 3 — bedöm visuellt
- Dashboard + match/live: 2–3 missade labels, samma 9/2.5-rotorsak
- ~10 inline borderRadius-warnings att granska fall för fall
- Emoji-prefix på återstående rubriker enligt DESIGN_SYSTEM.md §18

## Lärdom till framtida sprint-promptar

Code missade att uppdatera audit-filen enligt instruktionen "Klistra in rapporten i auditen som 'Prod-verifiering 2'". Rotorsak: Code kan inte enkelt köra audit mot Vercel-redeploy själv — det kräver väntan på CI och extern Chrome-åtkomst. Framtida prompts som kräver prod-verifiering ska antingen (a) be Code köra mot lokal dev-server och dokumentera *den*, eller (b) vänta på Jacobs prod-data och dokumenteras av Opus separat (som i detta fall).
