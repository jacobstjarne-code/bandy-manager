# Bandy Manager · Design ↔ Code Sync Manifest

Tvåvägsspegel mellan **designsystem** (detta projekt) och **codebasen** (`bandy-manager`). En rad per kontrollerat område. Uppdatera när du gör en ändring i endera projektet.

**Statusformat:** `design · code` — t.ex. `✓ · ⚠` betyder designen är klar, koden behöver uppdateras.

| Område | Ägare | Design | Code | Fil (design) | Fil (code) | Not |
|---|---|---|---|---|---|---|
| **Source-of-truth** | design | ✓ | ⚠ | hela detta projekt | `docs/DESIGN_SYSTEM.md` (arkivera) | Code ska läsa detta projekt; codebasens fil ska tas bort eller ersättas av stub |
| **Tokens** | | | | | | |
| Color palette | design | ✓ | ✓ | `colors_and_type.css` | `src/styles/tokens.css` | Paste as-is |
| Type scale | design | ✓ | ✓ | `colors_and_type.css` | ↳ | `.h-*` semantic roles |
| Spacing / radii / shadows | design | ✓ | ✓ | `preview/spacing-radii.html` | ↳ | 8 px grid |
| Seasonal gradients | design | ✓ | ✓ | `colors_and_type.css` | ↳ | `--bg-october..april` |
| Match-weather bg | design | ✓ | ✓ | `colors_and_type.css` | ↳ | `--match-bg-*` |
| LED scoreboard | design | ✓ | ✓ | `colors_and_type.css` | ↳ | `--led-*` |
| **Components** | | | | | | |
| Button | design | ✓ | ✓ | `preview/components-buttons.html` | `src/styles/global.css` | Hover, loading, focus-ring, disabled copper, spin keyframe, icon sizes, segmented toggle |
| Screen CTA | design | ✓ | ⚠ | `preview/components-cta.html` | `CtaButton.tsx` | Wrap i `CeremonialCta` |
| Tag | design | ✓ | ⚠ | `preview/components-tags.html` | `Tag.tsx` | Status utan emoji |
| Card (sharp/round) | design | ✓ | ✓ | `preview/components-cards.html` | `CardSharp.tsx`, `CardRound.tsx` | — |
| GameHeader | design | ✓ | ⚠ | `preview/components-header.html` | `GameHeader.tsx` | Grid + sigill-chip + kuvert-SVG |
| PhaseIndicator | design | ✓ | ⚠ | ↳ | `PhaseIndicator.tsx` | Stepper done/current/upcoming |
| BottomNav layout | design | ✓ | ✓ | `preview/components-bottomnav.html` | `BottomNav.tsx` | — |
| NextMatchCard | design | ✓ | ✓ | `preview/components-nextmatch.html` | `NextMatchCard.tsx` | Derby variant klar |
| **Brand** | | | | | | |
| Logotyp på mörk | design | ✓ | ✓ | `preview/brand-logo.html` | `GameHeader.tsx` | — |
| Logotyp på ljus | design | ✓ | ⚠ | ↳ | — | Lägg till `.logo-invert` |
| **⚠ Piktogramserie (24)** | design | ⚠ | ⚠ | `preview/brand-emoji.html` | `EMOJI_MAP` → `ICON_MAP` | Eget designprojekt |
| **⚠ BottomNav-ikoner (6)** | design | ⚠ | ⚠ | `preview/components-bottomnav.html` | `BottomNav.tsx` | Eget designprojekt |
| **⚠ Klubbmärken (12)** | design | ⚠ | ⚠ | `preview/brand-badges.html` | `ClubBadge.tsx` | Eget designprojekt |
| Lucide icon set | design | ✓ | ✓ | `preview/brand-icons.html` | `lucide-react` | 1.75 px stroke |
| **Skärmar (UI kit)** | | | | | | |
| Dashboard | design | ✓ | ✓ | `ui_kits/bandy-manager-pwa/dashboard.jsx` | `DashboardScreen.tsx` | Mock av production |
| Taktik | design | ✓ | ✓ | `ui_kits/bandy-manager-pwa/screens.jsx` | `MatchScreen.tsx` | ↳ |
| Resultat | design | ✓ | ✓ | ↳ | `ResultScreen.tsx` | ↳ |
| **Intro / Ankomsten** | design | ✓ | ⚠ | `ui_kits/intro_flode/Intro Flode v1.html` | `ArrivalScene.tsx` (ny) | Kontinuerlig scen, 4 steg |
| Trupp | — | — | ✓ | *ej mockad* | `SquadScreen.tsx` | Lägg till vid behov |
| Tabell | — | — | ✓ | *ej mockad* | `TableScreen.tsx` | ↳ |
| Transfers | — | — | ✓ | *ej mockad* | `TransfersScreen.tsx` | ↳ |

---

## Process

1. **Ändring initieras i design** (detta projekt) → uppdatera `preview/*.html`, `colors_and_type.css`, eller UI kit. Flytta raden till `⚠` på code-sidan. Notera i `HANDOFF.md`.
2. **Ändring initieras i code** → commit:a ändringen, uppdatera raden, flagga `⚠` på design-sidan och öppna en tråd i detta projekt.
3. **Blockerade rader** (designprojekt som kräver research) stannar på `⚠ · ⚠` tills research-spåret levererar.

## Vem frågar vem

- **Frågor om ton, språk, visuell riktning, spacing, färg, komponentregler** → designsystemet (detta projekt).
- **Frågor om datamodell, state management, API, performance, build** → codebasen.
- **Båda behövs** (ny feature) → ställ i design först, få mock, sedan implementera.
