# CODE-INSTRUKTION — commit working-tree + git-status-verifiering

**Från:** Opus · **Datum:** 2026-06-23, tisdag morgon (08:55 CEST)
**Gäller:** Code:s FÖRSTA handling nästa runda, före all bugg-/UX-kod.
**Varför fil och inte direkt-edit:** commit + `git status` är git-operationer; Opus har bara `workspace:*` (read/write/edit), ingen git. Detta är därför Code-lane.

---

## Steg 1 — committa hela working-tree i ETT svep

Allt nedan ligger ocommittat efter Korrvända 3:s push (6 commits). Committa det samlat innan du rör B1+B2-fixen, så att bugg-commits inte blandas med dokument-drift.

**Skrivet av Opus föregående session (säkert ocommittat):**
- `CLAUDE.md` — DESIGNPRINCIP #5 (mock = omdesign, aldrig radering) + OPUS-REGEL #6 (vem gör vad).
- `docs/DIAGNOS-B1-B2-CUPAVANCEMANG-2026-06-23.md` — ny fil, cup-avancemang-patchen.
- `docs/BACKLOG.md` — Korrvända-3-processning, B1+B2-diagnos, tabIntros-incident.
- `docs/CODE_INSTRUKTION_KORRVANDA3_2026-06-23.md` — om ej redan committad.
- `docs/incoming/KORRVANDA-3B-IMPLEMENTATION-2026-06-23.md` + `docs/incoming/INSTRUKTION-CODE-OPUS-2026-06-23-KVALL.md` — Jacobs drops.

**Tillagt av Opus denna session (2026-06-23 morgon — säkert ocommittat):**
- `CLAUDE.md` — step 4-baslinjen nedskuren: `2026-06-11_design_b1_klubbutveckling.html` är inte längre incoming-baslinje.
- `docs/BACKLOG.md` — incoming-genomgångsraden för samma fil stängd.
- **Filflytt:** `docs/archive/2026-06-11_design_b1_klubbutveckling.html` → `docs/mockups/2026-06-11_design_b1_klubbutveckling.html` (konsumerad mock i fel hink; rättad). `git add -A` fångar både borttagning och tillägg; verifiera att git ser det som rename, inte delete+add av annat.
- Denna fil.

`git add -A` sveper allt. Ett commit-meddelande räcker, t.ex.:
```
chore: committa working-tree — Korrvända 3-dokument + B1+B2-diagnos + CLAUDE.md #5/#6 + step4-baslinje + b1-mock archive→mockups
```

## Steg 2 — verifiera de två copy-filernas git-status (stänger HANDOVER:s öppna fråga)

HANDOVER §2 kunde inte avgöra om dessa två committades i Korrvända 3 eller ligger kvar som modified — Opus saknar git. **Du avgör det och rapporterar tillbaka:**

```
git log --oneline -8
git status --short -- src/domain/data/tabIntros.ts src/domain/data/facilityDescriptions.ts
git log --oneline -- src/domain/data/tabIntros.ts src/domain/data/facilityDescriptions.ts
```

- **Innehåll bekräftat ifyllt** (HANDOVER §6): `tabIntros.ts` exporterar `TAB_INTROS`/`TabIntroEntry`/`TabIntroKey` med 14 flikar; `facilityDescriptions.ts` har `FACILITY_DESC` (10 noder) + `FACILITY_INTRO`. Bekräfta att så är fallet i HEAD efter commit (de får inte ligga som tomma stubbar — Korrvända-2-stubbarna skrevs över med riktig copy).
- Om de var **modified/untracked** → de sveps med i Steg 1-committen; notera det i rapporten.
- Om de redan var **committade** i Korrvända 3 → notera vilken hash, inget mer att göra.

Rapportera en rad: "tabIntros + facilityDescriptions: [committade i `<hash>`] / [svepta med i denna commit], innehåll ifyllt verifierat."

## Steg 3 — resten av körordern är OFÖRÄNDRAD

Dupliceras inte här. Kör vidare enligt:
- **HANDOVER §11** (`docs/HANDOVER_2026-06-23.md`) — full ordning.
- **Marschordern** (`docs/incoming/INSTRUKTION-CODE-OPUS-2026-06-23-KVALL.md`) + fyndtabellen (`docs/incoming/KORRVANDA-3B-IMPLEMENTATION-2026-06-23.md`).

Kort: **B1+B2** (cup-avancemang, `docs/DIAGNOS-B1-B2-CUPAVANCEMANG-2026-06-23.md`, verifiera hemma+borta) → **B4 → B3 → B6/B7 → B5 → B8** → **Korrvända-2-wiring** (TabIntro + FACILITY_DESC in i ClubScreen/SquadScreen/TransfersScreen, riv gamla intro-ytorna) + **G1·G3**-densiteten → **triagera `docs/incoming/`** (flytta KORRVANDA-3B + kväll-instruktionen till `docs/` när de är konsumerade; `README.md` stannar).

---

## KÖRORDER

- **Code:** Steg 1 (commit-svep) → Steg 2 (verifiera + rapportera de två copy-filerna) → Steg 3 (B1+B2 och vidare per HANDOVER §11). RC-relevant push → preview-deploy + läs build-logg per CLAUDE.md DEPLOY-regeln.
- **Opus:** kö tom efter denna fil. Väntar på Code:s Steg 2-rapport + B1+B2-utfall, eller Jacobs nästa drop.
- **Jacob:** ny genomspelning i NY chatt efter Code:s B1+B2-fix — verifiera cup-R1 live hemma/borta → kvartsfinal (ej liga-omg-1) + B3–B8 render-i-kontext.
