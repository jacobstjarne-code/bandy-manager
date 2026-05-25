# AUDIT — R3+ Playoff-klimax-eskalering

**Datum:** 2026-05-17
**Audit-typ:** Pixel-audit i kontext (kodläsning — rendering inte verifierad)
**Spec:** `design-system/HANDOFF-ENDGAME-PORTAL-R3-PLUS-KLIMAX.md`
**Mock:** `docs/mockups/2026-05-16_design_endgame_klimax.html`

## Sammanfattning

| Severity | Antal | Innebörd |
|----------|-------|----------|
| 🟥 BLOCK   | 2  | Måste fixas innan Jacob playtester |
| 🟧 WARN    | 3  | Bör fixas inom samma sprint |
| 🟨 OBSERV  | 2  | Skuld / dokumentation |
| ✅ OK      | 10 | Verifierat i kod |

R3+ landade till 80%. **Två system-frågor blockerar visuell konsistens.**

## Tre "gold"-tokens i bruk just nu

| Token | Hex | Använd där |
|---|---|---|
| `--gold` | `#E8B95C` | RoundMark.gold, btn-gold-CTA, primary-weight-3 (i CSS-klassen) |
| `--gold-deep` | `#B88838` | btn-gold gradient slut-stopp **(saknas i tokens-fil — inline fallback)** |
| `--match-gold` | `#D4B860` | SMFinalPrimary card, NextMatchCard playoff-leather-bar |

**Förslag:** definiera `--gold-deep`; flytta SMFinalPrimary till `--gold`; behåll `--match-gold` enbart för match-vyn.

## Åtgärdslista (prioriterad)

| # | Severity | Åtgärd | Vem |
|---|----------|--------|-----|
| 1 | 🟥 | **Lägg till `--gold-deep: #B88838` och `--shadow-gold: 0 3px 12px rgba(232,185,92,0.32)` i `design-system/colors_and_type.css` + `src/styles/global.css`.** Behåll fallbacks i `.btn-gold` som säkerhet. | Code |
| 2 | 🟥 | **SMFinalPrimary refaktor:** byt `var(--match-gold)` till `var(--gold)` och flytta primary card-styling till `className="primary-card primary-weight-3"`. Behåll bara content-rendering inline. | Code (efter Design-beslut bekräftat: alternativ a) |
| 3 | 🟧 | **NextMatchCard playoff-styling till CSS-klasser:** ta bort inline `cardStyle.border/background/boxShadow` för playoff-grenen, applicera `primary-card primary-weight-${seriesWeight}` på root-divet. | Code |
| 4 | 🟧 | **SeriesBoxes refaktor:** bryt ut `.series-box-*` CSS-klasser, ta bort inline-storlek-overrides på "next"-rutan. | Code |
| 5 | 🟧 | **SMFinalPrimary crit-tag inline marginLeft** — tas bort när 4.1 fixas (klassen sätter margin via CSS). | Code (följer från 2) |
| 6 | 🟨 | **PortalRoundMark.test.tsx utöka** med rendering-tester via RTL. | Code |
| 7 | 🟨 | **Dokumentera `--gold` vs `--match-gold` vs `--gold-deep`** i `design-system/DESIGN-DECISIONS.md`. | Design |

*(Fullständig audit-text med per-spec-fynd 1.1–8.3, hierarki-audit, och cross-cutting designbeslut finns i original-leverans från Claude Design 2026-05-17.)*
</content>