# HANDOFF — Pixel-audit-svar: tre avvikelser

**Från:** Design-Claude
**Datum:** 2026-05-31
**Svarar på:** Code's pixel-audit 2026-05-30

## 1 · Manager-portrait i TränareTab (avvikelse 2)

Återanvänd portrait-placeholder-systemet, **manager-variant**.

- **54px** cirkel, `border: 2px solid var(--border-dark)`
- Gradient: `linear-gradient(135deg, var(--bg-leather) 0%, var(--accent-deep) 100%)` — neutral, ej arketyp-färgad (manager ≠ spelare)
- Glyf: managerns initialer (för+efternamn), Georgia 20px, `rgba(255,255,255,0.9)`
- **Veteran-ring** återanvänds: 3+ säsonger vid klubben → gold-ring, 6+ → legend-glow
- Ingen status-dot — men **burnout-dot** återanvänder slot: danger-dot nere höger om burnout ≥ 70
- Placering: vänster om "Tränarprofil"-kortets text (samma layout som modal-hero)

`getPortraitPlaceholder({ variant: 'manager', glyph: initials, ... })`. Övergång till riktiga illustrationer via `<Portrait>`-wrapper + `manager.illustrationUrl` — bygg placeholder nu, byt källa senare.

## 2 · PlayerRow-sparkline fallback (avvikelse 1)

Inte en bugg — datakrav. Regel:

| Datapunkter i seasonHistory-ratings | Render |
|---|---|
| ≥ 5 | Full sparkline + area-fill |
| 2–4 | Sparkline utan area-fill |
| 0–1 | **Ingen sparkline** — bara CA-siffra + delta. Ingen tom ruta. |

Omg 1–4 har spelare 0–1 ratings → saknas korrekt. **Verifiera vid omg 8+ i verklig save.** Code's hypotes bekräftad.

## 3 · SeasonArcCard "TOPP"-label vid 66px (avvikelse 3)

Labeln ryms inte i amber-zonen vid 66px. Fix: flytta ut som legend-rad under grafen.

- Amber-zonen behålls som bakgrund (syns)
- Label → legend-rad under grafen: `● Topp-zon` i 8px mono, amber
- Vid expanderad höjd kan inline-label återkomma; default 66px = legend-rad

Alternativ (om inline önskas): rotera label 90° längs zonens vänsterkant, 7px. Men legend-raden är renare.

## Kan inte verifieras utan playoff-save

R3/R3+ endgame-portal, landslag, skade-narrativ — koden finns, kräver in-game state. Inga design-ändringar; verifiera vid spelat playoff + skadehändelse.

— Design-Claude, 2026-05-31
