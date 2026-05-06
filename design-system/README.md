# Bandy Manager — Design System

A warm, heritage-feeling palette and type system for **Bandy Manager**, a Swedish elite-bandy club management game (PWA, mobile-first 375–430px).

> *"Upplev atmosfären av svensk elitbandy."* — product tagline

The design evokes a 1970s bruksort (mill-town) sports almanac: warm paper, copper accents, leather-strap headers, Georgia numerals, and weather-tinted match cards. Not corporate SaaS, not modern neon — Swedish heritage with a contemporary mobile UI underneath.

---

## ⚠️ ENDA DESIGNSYSTEMET ÄR DETTA PROJEKT

**Bandy Manager har ett designsystem — det här.** Färger, typografi, knappar, kort, headers, tags, ikoner, copy, säsongsbakgrunder, scoreboard, intro-flöde — allt är definierat här.

**Code ska:**
- Alltid läsa detta projekt först innan UI ändras eller läggs till
- **Aldrig konsultera `bandy-manager/docs/DESIGN_SYSTEM.md`** — den är arkiverad och inaktuell
- Aldrig uppfinna nya knapp-, tag-, kort- eller färgvarianter — om mönstret saknas här, fråga designsystemet

**Vid konflikt:** detta projekt vinner. Alltid.

**Källor i prioritetsordning:**
1. `colors_and_type.css` — alla design-tokens
2. `DESIGN-DECISIONS.md` — låsta beslut + principer
3. `preview/components-*.html` & `preview/brand-*.html` — komponentkanon
4. `ui_kits/*/` — skärm-mockar
5. `briefs/*.md` — implementations-specs per område
6. `HANDOFF.md` — code-changes per godkänd designändring
7. detta dokument (`README.md`) — filosofi, do/don't

Hela detta dokument under den här rubriken är **bindande** för UI-arbete i codebasen.

---

## Product context

**Bandy Manager** is a single-player PWA where you manage a fictional club on a real Swedish bruksort through a season in Sweden's top bandy tier (12 clubs, 22-round regular season, cup, and playoffs). The calibration is serious (1124 real Elitserien matches used to tune the match engine) but the atmosphere is narrative — coffee-room quotes, patron/mecenat politics, weather-soaked matchdays.

**Key product rules that shape the UI**:
- **Bandy, not ice hockey.** 🏒 always — never ⚽. "Plan", never "rink". 2 pts for a win. 10 min penalty instead of yellow/red cards. Offside exists. Positions are **MV / B / YH / MF / A**.
- **Mobile-first** — 375 px base, 430 px max. Every pixel of vertical space matters. "Tight, not airy."
- **Swedish-language UI** — all product copy is in Swedish. Design system naming follows suit where it's conceptual (Förbered / Spela / Granska).
- **All fake clubs on real bruksorter** — 12 hand-crafted clubs (Forsbacka, Söderfors, Västanfors, Karlsborg, Målilla, Gagnef, Hälleforsnäs, Lesjöfors, Rogle, Slottsbron, Skutskär, Heros) with arena + supporter-group names in `worldGenerator.ts`.

### The one product we design for

One surface, one UI kit:

| Product | Surface | Target viewport |
|---|---|---|
| **Bandy Manager PWA** | React SPA (mobile web, install-as-app) | 375–430 px wide |

There is no marketing site, docs site, or admin panel. Everything lives in the game itself.

---

## Designfilosofi — systemets tre kärnprinciper

Designsystemet vilar på tre principer som är *filter*, inte dekoration. Varje beslut — färgval, typsnittsstorlek, komponentform, copywriting, illustration — måste kunna försvaras mot dem. Principerna är avsiktligt formulerade på svenska; de är del av produktens röst.

### Princip 1 — *"Vi har nostalgi, men vi är inte nostalgiska"*

Systemet bär bruksortens minne. Typografin, paletten, hantverket och protokoll­språket är lånade från 1970-talets svenska idrotts- och föreningsliv. Men appen är *inte* ett museum — den är samtida, snabb, funktionell. 70-talsliggaren finns där för att den **fungerar**, inte för att den är gammal.

**Test:** Om ett element bara är vackert *för att* det är gammalt → ta bort det. Om det löser ett problem **bättre** för att det lånar form från en annan tid → behåll det.

### Princip 2 — Nostalgin har alltid ett jobb: **förstärkning eller kontrast**

När det nostalgiska och det moderna möts finns bara två legitima utfall:

- **Förstärkning** (harmoni) — båda pekar åt samma håll, de adderar. *Exempel: LED-scoreboard med Georgia klubbnamn över. LED är modern och skarp; Georgia är tryckt och värdig. Båda säger "detta är en riktig matchrapport" — den ena med precision, den andra med pondus.*
- **Kontrast** (spänning) — de drar åt olika håll, friktionen blir intressant. *Exempel: 70-tals protokollblock-layout med live-uppdaterande siffror som tickar. Layouten är stilla och kontemplativ; siffrorna är omedelbara och digitala. Det är roligt för att de inte hör ihop.*

Vad vi **inte** gör: **nostalgi som kostym.** Pergamentbakgrunder, sigillrullar, pseudo-gammaldags "Välkommen, herr Patron!" — det är varken förstärkning eller kontrast, bara pastisch. Pastisch blir trött efter vecka 2.

**Filterfråga för varje komponent:** *"Förstärker detta, kontrasterar detta, eller är det bara kul?"* Bara de två första är tillåtna.

### Princip 3 — **70-talsliggare, inte 1800-talssigill**

Referensmaterialet är **konkret och sent**:

- Kommunalhusets protokollblock, linjerade med perforering i marginalen
- Idrottsföreningens stadgar, offset-tryckta med registreringsfel
- Letraset-rubriker, stämpel­bläck, hålslagsmärken
- Skolplansh­ens linjesnitt, 1970-talets förbundsmärken
- Bruks­industrins skyltar i lackat järn
- Westerstrands resultat­tavlor, naiv solgubbe på Karlstads arena

**Inte** heraldik, pergament, ordens­band, lacksigill, gotisk fraktur, pseudo-medeltid. Det som känns som *farfars tid* (arbetar­förening 1974) är rätt; det som känns som *farfars farfars tid* (bergslagsarkiv 1874) är fel.

### Två undantag värda att känna till

1. **Resultattavlan** — har en idrottsplats-estetik som är *sin egen kategori*. LED-siffror, 7-segment, H/G-stämplar, horisontella separator-band. Här är nostalgin kontrastens kärna: alla förväntar sig en generisk UI-widget, de får en fysisk tavla. Viktigt att göra den *till vår egen* genom kopparaccent, egen tillverkaretikett, Georgia-klubbnamn ovanpå LED:en.
2. **Sponsorerna** — riktiga lokala företag (rörmokare, bilhandlare, byggföretag) finns i spelet. De ska synas som *miljö*, inte innehåll — sargreklam, ticker-text, matchprogrammets brevhuvud. **Inte** interaktiv pay-to-win-mekanik; **inte** påhittade plojiga namn. De är del av bruks­ekonomin, inte del av gamifieringen.

---

## Sources consulted (store in case the reader has access)

- **Codebase:** `bandy-manager/` — React 19 + TypeScript + Vite, deployed on Render
  - `src/styles/global.css` — all design tokens (hard source of truth)
  - `docs/DESIGN_SYSTEM.md` — 20-section design rulebook (in Swedish)
  - `docs/mockups/*.html` — visual reference mockups (sprint-by-sprint)
  - `src/presentation/components/` — shared components (GameHeader, PhaseIndicator, ClubBadge, FormDots, …)
  - `src/presentation/screens/` — per-screen UI
- **GitHub:** `jacobstjarne-code/bandy-manager` (default branch `main`) — same codebase
- **Icons:** [`lucide-react`](https://lucide.dev) @ 0.577.0 — linked via CDN in this system
- **Fonts:** `Georgia` (system serif) + `system-ui` — zero webfont dependencies

No slide deck was attached; this system contains no `slides/` folder.

---

## File index (this folder)

| Path | What |
|---|---|
| `README.md` | This file |
| `SKILL.md` | Cross-compatible skill definition for Claude Code |
| `colors_and_type.css` | All CSS variables + semantic type roles |
| `assets/` | Logos, app icons, intro background |
| `preview/` | Small HTML cards that populate the Design System tab |
| `ui_kits/bandy-manager-pwa/` | Interactive high-fidelity recreation of the mobile app |

Fonts are system-only — no `fonts/` folder required. See **Font substitution** below.

---

## Content fundamentals

### Language

**Swedish, always.** Don't translate product copy to English, even for screens that feel generic ("Login", "Settings"). Preserve `Spara spel`, `Ladda spel`, `Spelguide`, etc.

### Voice

- **Terse, tight, factual** — this is a manager's dashboard, not a novel. *"Derby. Skutskär. V2 O1 F0."* not *"You have a derby against Skutskär coming up, and your recent record is…"*
- **Second-person for prompts** ("Välj trupp", "Förläng kontrakt") — the UI tells the manager what to do.
- **Third-person narrative for flavor** — daily briefings, coffee-room quotes, journalist copy all read like a local newspaper sports page. *"Vinden river i flaggan. Målilla väntar."*
- **Georgian italic for quotes** (see `.h-quote`) — all atmospheric strings wrap in italic Georgia so they're visually distinct from chrome/data.
- **Never corporate.** No "seamless", "empower", "unlock". If a sentence could appear in a B2B homepage, rewrite it.

### Casing

- **SECTION LABELS: UPPERCASE with 2px letter-spacing, 8px size, emoji prefix.** e.g. `💰 EKONOMI`, `🏒 MATCHEN`, `👥 TRUPP`.
- **CTA buttons: UPPERCASE with 1.5px letter-spacing** — only the big screen-closing `.btn-cta` ("SPELA OMGÅNG 1 →").
- **Card titles, body, tags: Sentence case.** *"Nästa match"*, *"Förläng kontrakt"*, *"Välj trupp"*.
- **"Bandy" is lowercase mid-sentence**, "Bandy Manager" is the product name.

### Emoji

Emoji are **part of the design**, not decoration — every section label gets one. The map is fixed in `docs/DESIGN_SYSTEM.md` §2:

| 🏒 Match/spel (NEVER ⚽) | 💰 Ekonomi | 👥 Trupp | 👤 Patron | 🏋️ Träning |
| 🏠 Bygdens puls | 🏘️ Orten | 🏛️ Kommun | 🏟️ Anläggning | 🏆 Cup |
| ⚔️ Slutspel | 📬 Inkorg | 🩹 Skador | 🎓 Akademi | 🔍 Scouting |
| 📋 Kontrakt | 💼 Transfers | 🔥 Derby | ⭐ Betyg | 📊 Tabell |
| 📈 Form | 🩺 Bandydoktorn | 📖 Spelguide | 📣 Pep-talk | 🎤 Press |

**Don't invent new emoji** — if your concept doesn't fit, use a Lucide icon instead.

### Examples of well-written copy (copy this tone)

```
SÄSONGSSTART
Premiär borta mot Söderfors. Välj trupp och taktik — rapportera sedan till styrelsen.
```

```
📈 Holmgren — 3 mål senaste 4.
📰 Målilla-Kuriren: "Brukspatronen viker sig inte."
💼 Fönstret stänger om 3 omg.
```

```
Domaren blåser av!
Seger 4–2 mot Forsbacka. Klacken sjunger i kylan.
```

---

## Visual foundations

### Palette

A **warm-paper** canvas with one **copper** accent, ice-blue for "cool" info, and semantic reds/greens. Six seasonal background gradients tint the dashboard by month — October reads warm, January reads grey-blue.

- **Paper (`--bg` #EDE8DF, `--bg-surface` #FAF8F4)** for everyday content.
- **Leather (`--bg-dark` #0E0D0B, `--bg-leather` #3D3A32)** for headers, NextMatchCard, and ceremonial transitions.
- **Copper (`--accent` #C47A3A, `--accent-dark` #A25828, `--accent-deep` #8B4820)** — the *only* primary. The CTA gradient is `#DD9555 → #8B4820` with a white 35% sheen overlay.
- **Ice (`--ice` #7EB3D4)** — weather, away-team, cool info. Never for positive/negative signals.
- **Semantic:** `--success` #5A9A4A, `--danger` #B05040, `--warning` #C47A3A (same as accent — warnings live in the copper family).
- **LED** (`--led-score`, `--led-time`, `--led-warn`) — a dedicated red/green/amber palette reserved exclusively for the live scoreboard overlay. Do not use elsewhere.

**Hard rule: no raw hex in TSX.** Every color must be a CSS variable. A grep guard (`grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/ --include="*.tsx"`) runs against the codebase.

### Typography

Two families, no webfonts.

- **Georgia (serif)** — all numerals (score, table position, kassa, count-ups), card titles when ceremonial, italic quotes. Size range 14–44 px.
- **system-ui (sans)** — everything else: body, labels, buttons, chrome. Size range 8–14 px; **never below 8**.

**Critical sizes** (from DS §10):
- Section label — 8 px / 600 / +2 px letter-spacing
- Body — 11–12 px
- Card title — 13–14 px / 600–700
- Score (match result hero) — 36 px Georgia / 800
- Table position — 22–30 px Georgia

### Spacing

"Tight, not airy" — the mobile canvas is 375 px wide and every scroll is expensive.

- Card padding: **10 × 12** (standard), **7 × 10** (single-row).
- Card margin-bottom: **6** (grid), **4** (single-row stacks).
- Grid gap: **6**. Flex-column gap: **4–6**.
- Section label margin-bottom: **4–6**.
- Page side padding: **12** (not 16, not 20).

### Shape

Two card primitives, no inline `borderRadius`:

- **`.card-sharp`** (`border-radius: 8`) — *all* data display. Tables, stats, nudges, list items.
- **`.card-round`** (`border-radius: 14`) — narrative-only. Daily briefing, pep-talk, coffee-room quotes.

Chevron nav-button is exactly **16×16 px, radius 4 px, 1 px border, accent color glyph `›`** — copy verbatim, don't restyle.

### Backgrounds

- Dashboard background shifts by in-game month (October → April) using the seven `--bg-*` gradients. Not parallax, not animated — a static tint.
- `card-sharp` sits on `--bg-surface` against the seasonal `--bg`.
- **Texture overlays** (both subtle, both optional):
  - `.texture-wood` — warm diagonal lines (repeating-linear-gradient at 92°), used on the bottom-nav bar.
  - `.texture-leather` — fine dot pattern (inline SVG data URL), used on dark-surface cards.
  - `.noise-overlay::after` — 2.5% opacity fractal noise on atmospheric cards.
- **NextMatchCard** tints its leather bar by weather: rain (`--match-bg-rain`), snow (`--match-bg-snow`), cold, fog, wind. Dashboard reads the current weather from game state.
- Intro background: `assets/intro-bg.jpg` (floodlit arena, warm grading).

### Animation

All eases are subtle, short, copper-themed. `fadeIn` (220 ms), `fadeInUpScale` (280 ms, staggered 60 ms per card), `pulseCTA` (3 s loop on the redo-state CTA), `heartbeat` (Bygdens Puls icon), `shimmerIce` (ice divider strip). TacticPreview pitch uses `transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`.

**No bouncy springs, no long transitions, no parallax, no scroll-triggered anims.** The only "ceremonial" animation is the screen-closing CTA pulse.

### Hover / press

- **Buttons** (`.btn`): `:active` pushes `translateY(1px)` and reduces shadow — tactile. No hover lift (mobile-first; hover doesn't exist).
- **Copper CTA**: the pulse ring (`0 6px 24px rgba(162,88,40,0.55)` at 50%) is the hover affordance.
- **Cards**: no hover state. If a card is tappable it shows a chevron `›` on the right edge, that's the affordance.

### Borders

- `1px solid var(--border)` — default card edge (#DDD7CC against #FAF8F4 — very soft).
- `1.5px solid var(--border-dark)` — `.btn-ghost`, `.btn-outline`, emphasis.
- `2px solid var(--accent)` under the GameHeader — the one bright copper line in the chrome.
- `0.5px` borders on tiny inline chips (nudge pills).

### Shadows

- `--shadow-card` — `0 1px 3px rgba(0,0,0,0.05)`. Almost imperceptible. Cards rely on borders, not lift.
- `--shadow-btn` — buttons get a tiny double-layer drop.
- `--shadow-primary` — copper buttons get a copper-tinted drop (`rgba(162,88,40,0.38)`). This is the signature.
- No `box-shadow: 0 20px 40px rgba(0,0,0,0.2)` SaaS-deck shadows anywhere.

### Transparency & blur

- **Backdrop** (`EventOverlay`, modals) — `rgba(0,0,0,0.6)`, **no blur**. Modals are centered cards (max-width 380 px), not bottom-sheets.
- **Tag backgrounds** use 10–15% alpha of their hue — `rgba(90,154,74,0.12)` for `.tag-green`.
- **No frosted-glass / backdrop-filter anywhere** — doesn't fit the paper + leather mood.

### Imagery

- **Player portraits** — 36×36 circle, 2 px var(--border), `object-position: center 20%` (faces sit in the upper third, always).
- **Club badges** — SVG shield, radial gradient from the club's primary color, symbol centered (hammer, star, crown, river, shield, mountain, elk, axe, tower, wave, tree, bear). Each club has fixed primary + secondary colors in `ClubBadge.tsx`.
- **Town silhouettes** — thin dark line at the foot of the GameHeader, per club (`TownSilhouette.tsx`).
- **No photography** beyond `intro-bg.jpg`. No stock imagery. No illustration systems — iconography is `lucide-react` + emoji.

### Corner radii

| Element | Radius |
|---|---|
| `.card-sharp`, `.btn` | 8 px |
| `.card-round` | 14 px |
| `.btn-cta` | 12 px |
| Tags (`.tag`) | 99 px (pill) |
| Form squares / inline chips | 3 px |
| Player portrait, club badge, chevron | 50% / 4 px |

### Layout rules

- **Root**: `max-width: 430px`, centered, `display: flex; flex-direction: column; overflow: hidden`.
- **Bottom nav** — fixed 60 px + safe-area, six tabs (Hem, Trupp, Match, Tabell, Transfers, Klubb). Hidden on ceremonial screens (`HIDDEN_PATHS` in `BottomNav.tsx`).
- **GameHeader** — 44 px tall, leather dark, copper underline, three-column layout (logo | club+season | bell+settings).
- **PhaseIndicator** — three dots + labels (Förbered → Spela → Granska) under the header on gameplay screens.
- **Scroll padding bottom: 120 px** — always account for the fixed CTA and bottom nav.

---

## Portal — dynamiskt dashboard, inte statisk vy

**Portal** är spelets dashboard, men inte en fast layout. Designsystemet beskriver Portal som **byggblock + varianter + skift-parametrar** — inte "Portal ser ut såhär". Mockar och previews visar Portal i *ett* tillstånd; aktuell render är alltid en kombination av parametrar nedan.

### Skift-parametrar (vad som varierar)

| Parameter | Träffar vad | Tokens / regler |
|---|---|---|
| **Säsongstonalitet** | Bakgrund + accent | 7 ljusa månadsgradients (`--bg-october` t.o.m. `--bg-april`) på Dashboard. Portal-mörka tokens (`--bg-portal`, `--bg-portal-surface`, `--bg-portal-elevated`) sätts på `document.documentElement` av `PortalScreen` och tonas per säsongsfas. Aldrig binärt ljus/mörk — sju subtila skiftningar. |
| **Säsongens signatur** | Text + visuell tonalitet i hela Portal | En av sex signaturer triggas mid-season (cold_winter, injury_curve, …). Påverkar PortalBeat-copy, SeasonSignatureSecondary, och accent-stripes. Se `bandy-manager/docs/SPEC_SAESONGSSIGNATUR_KAPITEL_C.md`. |
| **Primary-card-variant** | Hero-kortet | En av flera: routine / derby / deadline / smfinal / patron-demand. Distinkta visuella accenter (border-färg, gradient på `--bg-portal-elevated`-bas). Se `bandy-manager/docs/mockups/portal_bag_mockup.html`. |
| **Situation** | SituationCard-innehåll | Samma komponentskal, varierande nyans per situation. Tokens måste tillåta att samma komponent renderar olika tonalitet. |
| **Journalist-relation** | Journalistkort severity | `--cold` (#4a6680) och `--warm` (#8c6e3a) — vänsterstipe + relationsbar-fill. Severity avgör vilken. |
| **Klubbminnet** | Säsong 2+ aggregation | Ny flik i ClubScreen. Designsystemet måste tillåta minnesvisualisering — riktning ej låst. |

### Konsistenta byggblock (vad som är fast)

- **PortalBeat** — atmosfärisk rad ovanför primary-card. Konsistent design (`--bg-portal-surface` bakgrund, fast typografi), dynamisk text per omgång (väder, dag, situation).
- **SituationCard** — kontextuell statusrad. Fast skal (`--bg-portal-elevated`), varierande innehåll.
- **Primary-card-skal** — alla varianter delar samma struktur (gradient-bas på `--bg-portal-elevated`, samma proportions); det som varierar är accent-overlay-färgen.
- **Secondary-cards** — alla bygger på `--bg-portal-surface` med 1 px border + ev. 2 px stripe vänster.

### Regelformat — så här *ska* designinstruktioner skrivas

❌ **Fel:** *"Portal har bakgrund #1a1612 och primary-card-knapp i koppar."*

✅ **Rätt:** *"Portal har bakgrund från en familj av sju säsongstokens (`--bg-portal-*`, tonad per månad), primary-card i en av N varianter, knapp från klassuppsättningen `.btn-*`, plus ett kontextuellt PortalBeat-band ovanför. Aktiv kombination styrs av säsongsfas + situation + signatur."*

### Mock-anteckningar — krav

Varje Portal-mockup eller preview måste ha en anteckning som listar **vilka parametrar som är frusna i just den vyn**. Exempel:

> *Visad: November · routine primary · ingen signatur · journalist-relation neutral. Variation: byt månad → bakgrund skiftar; byt primary → derby/deadline/smfinal; aktivera signatur → PortalBeat byter copy + stripe-färg.*

Utan anteckningen riskerar mocken att läsas som "Portal är såhär" istället för "Portal *kan* vara såhär".

---

## Scoreboard — Stålvallens tavla

> **Status: 🚧 subsystem under utveckling.** Riktningen nedan är bekräftad men inte slutligt låst. För aktuell godkännandestatus, se `DESIGN-DECISIONS.md`.

Resultattavlan är ett **eget subsystem** inom designsystemet. Den är systemets tydligaste exempel på Princip 2 (kontrast): pixel-LED-precision under Georgia-tryckt klubbnamn. När den är klar får den inte återanvändas till annat eller stylas om i farten.

### Fysisk förlaga

Westerstrands F-serie (1970-tal): en horisontell stålbalk-monterad tavla, ~3× bredare än hög. Röda 7-segment för tid och poäng, gula för utvisningar, gröna för period. Tavlan är **alltid horisontell** — score och tid sitter på samma rad, åtskilda av en tunn vertikal separator.

```
[ FOR  3 • 2  VÄS ]  ║  [ HL2  74:22 ]
```

### Anatomi

| Element | Regel |
|---|---|
| **Glyfer** | 5×7 dot-matrix, byggda i HTML/CSS (inte SVG, inte font). En cell = 4 px på 1× scale. |
| **Färger** | `--led-score` (röd, tid+poäng), `--led-warn` (gul, utvisning), `--led-period` (grön, periodindikator). Reserverade för tavlan — får inte spridas till annan chrome. |
| **Goal-flash** | Amber-puls 1.2 s när siffran ändras. Inga andra animationer på tavlan. |
| **Klubbnamn** | Georgia 800, ovanpå LED-rutan, **inte inuti** den. Det är kontrasten — tryck över ljus. |
| **Kopparaccent** | En tunn (1 px) kopparlinje som inramning av tavlan. Det är den enda dekorationen. |
| **Tidslinje** | Tightad — 26 px hög, kompakta head/feet. Tar minimal vertikal plats. |

### Förbjudet på tavlan

- ❌ Vertikal stapling av score och tid
- ❌ Fejkad tillverkaretikett ("Westerstrand · 1974") — pastisch
- ❌ Renderade skruvar, slitage-textur, fysisk patina — översättning, inte rendering
- ❌ Animering utöver goal-flash
- ❌ LED-färgerna i annan UI

### Källfiler

- `preview/pixel-scoreboard.html` — glyf-systemet i isolation (godkänt)
- `preview/scoreboard-stalvallen-v2.html` — full horisontell layout med tightad tidslinje (godkänt)
- `preview/commentary-redesign-v2.html` — integration i commentary feed (🚧 pågående)

---

## Iconography

Two parallel systems, used for different purposes:

### 1. Emoji — for *categories*

Every section label has an emoji. The set is closed (see table under **Content fundamentals**). Treat emoji as a typographic element — they render at 8 px alongside the SECTION LABEL text. **Never mix** two emoji on one label. **Never use emoji decoratively** (no 🎉 confetti on the champion screen; that's what CSS particles are for).

### 2. Lucide React — for *chrome*

All functional icons are [Lucide](https://lucide.dev) via `lucide-react@0.577.0`. Stroke weight 1.8 (default) or 2.2 when the tab is active. Size mostly 16–18 px.

**In use today** (from `BottomNav.tsx`, `GameHeader.tsx`):
- `Home` — Dashboard tab
- `Users` — Trupp (squad)
- `Swords` — Match
- `Table2` — Tabell (standings)
- `ArrowLeftRight` — Transfers
- `Building2` — Klubb (club)
- `Bell` — inbox
- `Settings` — settings menu

When adding a new icon, pick from Lucide first and match the existing stroke weight. **Do not mix** with other icon libraries (Heroicons, Feather, Material) and **do not hand-draw** SVG icons unless it's the club-badge symbol system in `ClubBadge.tsx`.

### SVGs used structurally (not as icons)

- `ClubBadge` — the 64×64 shield with 12 programmatic symbols. Part of the brand.
- `DiamondDivider` — tiny copper diamond with hairline gradients on both sides. Used between CTA label and button.
- `FormDots` / `FormSquares` — 8 px circles / 10–22 px squares. Colored `--success` / `--danger` / `--accent` for V / F / O.

### App icons & logos (in `assets/`)

- `bandymanager-logo.png` — primary wordmark (light-on-dark). 1048×1086 with heavy transparent padding; use at ~26 px tall in the header.
- `buryfen-logo.png` — deprecated alt logo from an earlier concept. Kept for reference.
- `icon.svg`, `icon-192.png`, `icon-512.png` — PWA app icons.
- `intro-bg.jpg` — floodlit arena (871×1080) used as the full-bleed intro-sequence background.

### Unicode glyphs used in UI

- `›` — navigation chevron on every tappable row (16×16 button)
- `→` — CTA arrows ("Spela omgång 1 →", "Fortsätt slutspel →")
- `•` — inline separator for stats ("V2 · O1 · F0")
- `✓` — completed nudges, save confirmation toast
- `↑` `↓` — delta indicators on review-screen summaries

---

## Font substitution

None — the system uses `Georgia` and `system-ui`. Both ship with every OS. If a Bandy Manager designer ever wants to explore custom webfonts, the closest Google Fonts matches are:

- **Georgia** → [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) or [Lora](https://fonts.google.com/specimen/Lora)
- **system-ui** → [Inter](https://fonts.google.com/specimen/Inter) (closest to SF/Segoe) — though the current system-ui stack is intentional and I'd flag any swap to the user.

---

## Design rules (abridged; full rulebook in `bandy-manager/docs/DESIGN_SYSTEM.md`)

1. **CSS vars only.** Zero hardcoded hex in `.tsx` files (SVG-illustrations in `ClubBadge.tsx` excepted — those are brand colors per-club).
2. **Two card classes only.** `.card-sharp` for data, `.card-round` for narrative. No inline `borderRadius`.
3. **Section labels are always 8px / 2px-ls / uppercase with a prefix emoji.**
4. **Tight spacing.** 10×12 card padding, 6 px grid gaps.
5. **One primary per screen.** `.btn-primary` max once; everything else is `.btn-secondary`, `.btn-ghost`, `.btn-outline`.
6. **CTAs use `.btn-cta` + `.btn .btn-primary`** — never styled inline.
7. **Bandy terms.** 🏒 only. "Plan" not "rink". 2 pts for a win. MV/B/YH/MF/A positions.
8. **Modals are centered, not bottom-sheets.** `rgba(0,0,0,0.6)` backdrop, 380 px max card, no blur.
9. **Mobile max-width 430 px.** No desktop layout.
10. **Swedish copy only.**

---

## Manifest — what's registered in the Design System tab

Colors, Type, Spacing, Components cards live in `preview/`. The UI kit's index is registered as its own card. See `preview/` for sources.
