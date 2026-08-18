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
| **Intro / Ankomsten** | design | ✓ | ✓ | `ui_kits/intro_flode/Intro Flode v1.html` | `ArrivalScene.tsx` | Kontinuerlig scen, 4 steg |
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

## Sync-logg

- **2026-05-16** — R3 Endgame Portal + R3+ Klimax-eskalering levererade från Claude.ai-design-projektet. Två mockar + två handoffs ska placeras enligt etiketterna i nedladdningsuppmaningarna.

- **2026-08-18 (Code → Design) — IllustrationScene/IllustrationPlaceholder: hela anropslistan, verifierad mot koden.** Bakgrund: GPT rapporterade "illustration på väg" synligt i produktion på cupens matchladdning. Diagnos visade att `docs/incoming/Illustrationer-stilbibel-2026-08-18.dc.html`s "beställningsbriefer"-katalog (sju briefar: Derbyt/Sommaren/Nyårsbandy/Vårsol/Kafferummet/Nedflyttning + bruksort-headern) inte matchade kodens faktiska anrop — den var en önskelista, inte en katalog över vad som faktiskt renderas. Kanon-katalogen ska styras av anropslistan nedan, inte tvärtom.

  **Fullständig anropslista** (grep-bekräftat, `IllustrationScene`/`IllustrationPlaceholder`, hela `src/`):

  | Kod-namn | Anropsställe | Bild? |
  |---|---|---|
  | `intro` | `ArrivalScene.tsx:88`, `TilltradeScreen.tsx:143,233` (tillträdesflödet) | ✅ `intro.jpg` |
  | `final` | `PortalScreen.tsx:333` (SM-finalhelg header), `MatchLaddningScene.tsx` via `OCCASION_ASSET.final` | ✅ `final.jpg` |
  | `annandagen` | `AnslagOverlay.tsx` (`league_midwinter`-anslag), `MatchLaddningScene.tsx` via `OCCASION_ASSET.annandagen` | ✅ `annandagen.jpg` |
  | `cup` | `MatchLaddningScene.tsx` (`LaddningOccasion`, cupmatchernas laddningsscen) | ❌ inte i `OCCASION_ASSET`, aldrig beställd |
  | `premiar` | `MatchLaddningScene.tsx` (`LaddningOccasion`, säsongens första ligamatch) | ❌ inte i `OCCASION_ASSET`, aldrig beställd |
  | `derby` | `MatchLaddningScene.tsx` (`LaddningOccasion`) | ❌ kod-kommentar: "ordered, placeholder until dropped" |
  | `nyar` | `MatchLaddningScene.tsx` (`LaddningOccasion`) | ❌ kod-kommentar: "ordered, placeholder until dropped" |

  **Prioritetsbedömning (Jacob):** `cup` går före `derby`/`nyar` i beställningskön (redan "ordered") eftersom cupmatcher spelas flera gånger per säsong (fyra rundor) — det är där platshållartexten faktiskt syns oftast, mer än på en engångshändelse som Nyårsbandy.

  **Åtgärdat i denna sync:** `cup`- och `premiar`-briefar tillagda i stilbibelns katalog (PRIO 2 resp. ordinarie), med kod-namn explicit angivet i varje briefs ref-tagg så framtida drift mellan katalog och kod syns direkt. De sju ursprungliga briefarna (Derbyt/Sommaren/Nyårsbandy/Vårsol/Kafferummet/Nedflyttning) rör vyer som antingen redan har ett kod-namn (`derby`) eller ännu inte har något anropsställe i koden alls — **oförändrade, inte verifierade i denna sync**, flagga separat om de ska prioriteras.
