# Bandy Manager — Instruktion för Code & Opus

**Läs detta först. Sen jobba.**

---

## 1 · Det finns ETT designsystem

Bandy Managers designsystem är ett separat projekt (det här). **Inte** `bandy-manager/docs/DESIGN_SYSTEM.md`. Den filen är arkiverad. Vid konflikt vinner detta projekt — alltid.

Hitta hit, läs i den här ordningen:

1. `README.md` — filosofi, do/don't
2. `DESIGN-DECISIONS.md` — låsta beslut (✅), pågående (🚧), avvisat (❌)
3. `colors_and_type.css` — alla tokens
4. `preview/components-*.html` — komponentkanon (buttons, tags, cards, header, cta, bottomnav, nextmatch)
5. `preview/brand-*.html` — logo, ikoner, badges
6. `ui_kits/*/` — skärm-mockar
7. `briefs/*-SPEC.md` — implementations-specs per område
8. `HANDOFF.md` — code-changes per godkänd designändring
9. `SYNC.md` — synk-status mellan design och code

Om mönstret du behöver inte finns här: **fråga designsystemet, uppfinn ingenting**.

---

## 2 · Aktuella outstanding items i HANDOFF.md

| # | Område | Status | Spec |
|---|---|---|---|
| 1 | Logotyp på ljus bakgrund (`.logo-invert`) | `[ ]` | `preview/brand-logo.html` |
| 2 | GameHeader 3-kolumns grid + sigill-chip + SVG-kuvert | `[ ]` | `preview/components-header.html` |
| 2 | PhaseIndicator stepper (done/current/upcoming) | `[ ]` | ↳ |
| 3 | Tags utan emoji för status | `[ ]` | `preview/components-tags.html` |
| 4 | CeremonialCta wrapper (from→to + subtext) | `[ ]` | `preview/components-cta.html` |
| 5 | Button system: hover, loading, focus-ring, disabled copper | `[ ]` | `preview/components-buttons.html` |
| 9 | **ArrivalScene — kontinuerlig intro-scen (NY)** | `[ ]` | `briefs/ARRIVAL-SCENE-SPEC.md` |

Blockerade (kräver eget designspår):
- 6 · BottomNav-ikoner `[⚠]`
- 7 · Emoji-kategori-piktogram `[⚠]`
- 8 · Klubbmärken `[⚠]`

---

## 3 · Vid varje implementations-uppgift

1. Läs HANDOFF-punkten + dess `Preview:`-fil + ev. `briefs/*-SPEC.md`
2. Läs `DESIGN-DECISIONS.md`-avsnittet det refererar till
3. Implementera **exakt** mot mocken — inga egna varianter
4. Uppdatera HANDOFF status från `[ ]` → `[x]` när klart
5. Uppdatera `SYNC.md`-raden från `⚠` → `✓`
6. Vid tveksamhet: ställ frågan i designsystem-projektet, inte i koden

---

## 4 · Förbjudet (vanliga fallgropar)

- ❌ Egna knapp-, tag-, kort-varianter som inte finns i `preview/components-*.html`
- ❌ Färger som inte finns i `colors_and_type.css`
- ❌ Emoji på status-tags
- ❌ Pergament, sigill, gotisk fraktur, "herr Patron"-copy
- ❌ Gradient-bakgrunder, vänster-border-accent-cards, SaaS-skuggor
- ❌ "Fixa snabbt"-CSS i komponentens scope — tokens eller inget
- ❌ Att läsa `bandy-manager/docs/DESIGN_SYSTEM.md`

---

## 5 · När designsystemet uppdateras

Designsystemet uppdateras kontinuerligt. Innan en sprint startar: kolla `DESIGN-DECISIONS.md` för **nya** beslut sedan förra sprinten — de listas under "✅ Godkända beslut" med datum längst ner.

---

*Instruktionen är levande. Senast uppdaterad: 2026-05-05.*
