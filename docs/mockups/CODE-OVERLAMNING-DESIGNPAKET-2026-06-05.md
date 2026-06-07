# CODE-ÖVERLÄMNING — Designpaket juni 2026 (komplett)

**Från:** Design-Claude · **Datum:** 2026-06-05
**Till:** Code
**Syfte:** Ett samlat implementations-dokument för allt designat sedan konsekvens-arbetet startade. Varje block pekar på sin mock/handoff. Implementera i prioritetsordning nedan. Inget kräver fler designbeslut — alla öppna frågor är besvarade eller flaggade till Opus (ej blockerande).

---

## Prioritetsordning

1. **Konsekvens-mekanik** (DB-1…DB-9 + R2 + Q1–Q3) — låser upp resten, mest kvalitetsvinst
2. **Illustrationssystem** — komponent + tre platser (bilder kommer separat, placeholders nu)
3. **Feature-spår** (spectator, klubbminne/R5, manager, skade, landslag, etc.) — efter konsekvens

---

## DEL 1 · KONSEKVENS-MEKANIK

### 1A · DB-1…DB-9 (mock: `2026-06-05_design_konsekvens_db1-9.html`)

- **DB-1 (master):** Ersätt all hårdkodad `rgba(<token>, α)` med `color-mix(in srgb, var(--token) N%, transparent)`. Kanoniska steg: **6% tint-bg · 18% divider · 30% border · 35% glow · 55% fill**. Ta bort Tailwind-rgb (34,197,94 / 239,68,68) → `--success`/`--danger`. **Glow-steget (35%): auto-konvertera INTE — flagga varje box-shadow för Design-review.**
- **DB-2:** Guld endast fullbordad seger + bekräftad landslagsmerit. Kontrakt-stripe→`--warm`, B-läge/stretch→accent.
- **DB-3:** ScoreBlock hero-variant överallt i UI-flöde; ceremoniell Georgia-siffra endast segerscen.
- **DB-4:** Pengar=Georgia · Score=ScoreBlock/mono · Statistik=mono · Placering=Georgia display. Dra in BoardMeeting-mono + EkonomiTab sans-bold → Georgia.
- **DB-5:** Squad-stripe = en prioriterad state (skada/avstängd > moral/lobby > kontrakt > ålder), övrigt chips. Guld aldrig i stripe.
- **DB-6:** `.card--portal`-modifier istället för inline token-override i NextMatchPrimary.
- **DB-7:** (a) `.h-scene-*` kanon, dra in inline-reimpl. (b) Tokenisera scen-atmosfär: `--bg-scene-deep`/`--bg-scene`. **Synka colors_and_type.css-spegeln mot global.css** (governance-flagga).
- **DB-8:** Scrim/fade ja, dekorativ yt-gradient nej. Tabell-header + managed-rad + "Årets match" → solid + stripe. Scen-atmosfär = sanktionerat undantag.
- **DB-9:** 6px → `--radius-md` (8). Portal-kort + Tabell-tabbar. Skala 14/8/3.

### 1B · R2 (mock: `2026-06-05_design_konsekvens_r2.html`)

- **R2-1:** Konforma rubriker till roller + ny `.h-display-hero` (Georgia 52/900, fallback 800+letter-spacing −1px) för seger-hjälte. Ny `.h-eyebrow` (11px/3px) skild från `.h-label` (8/2px).
- **R2-2:** Ny `.btn--hero` (radius 14, padding 17×22, 16/800, glow) + `.btn--hero.gold`. Endast säsongsslut/seger/cup. Dela/Historik → `.btn-outline`. Radius-12 → 14 (hero) eller 8 (övrigt).
- **R2-3:** Åldersband = en chip-form (radius 99, color-mix 6% fyllning/30% kant). Utvecklas=cold, Peak=success, Avtar=muted. Dra in `--ice`/radius-4.

### 1C · Kvalitet Q1–Q3 (mock: `2026-06-05_design_kvalitet_q1-3.html`)

- **DB-Q1:** Sparkline endast när riktning = info. Max 1/kort, ~4/skärm. Squad-rad CA → tal+delta (sparkline endast i PlayerCard-modal).
- **DB-Q2:** `--warm` = tilltagande mänskligt tryck. Åldersband "avtar" → `--text-muted`, vardagskafferum → `--cold`.
- **DB-Q3:** Emoji=diegetiskt, Lucide=chrome. Konvertera ▾ ● 🌱 → Lucide (TrendingDown/Circle/Sprout, stroke 1.8). **💔 stannar emoji** (diegetiskt+känslo-laddat); 🔥 stannar vid burnout/känsla. Behåll 🏒📣☕🩺🇸🇪💔 + kategori-set + ★ rating.

---

## DEL 2 · ILLUSTRATIONSSYSTEM

**Mock:** `2026-06-05_design_illustrationssystem.html` · **Beställningsbriefer:** `BESTALLNINGSBRIEFER-ILLUSTRATIONER-2026-06-05.md`

### 2A · Komponent

Bygg `<IllustrationScene mode src alt>` med tre lägen + inbyggd scrim:

```tsx
type Mode = 'fullbleed' | 'band' | 'header'
// fullbleed: 100% skärm, bottenscrim, text nederst (intro/säsongsstart)
// band:      övre 50% bild, scrim ned i portal-mörk, text under (anslag/ceremoni)
// header:    200px bild-band överst, scrim till portal, mark över (finalhelg)
```

Scrim per läge (DB-8 sanktionerad gradient):
- fullbleed bottenscrim: `linear-gradient(180deg, transparent 0%, rgba(16,18,24,0.55) 45%, rgba(12,14,20,0.92) 100%)`
- band/header: fade till `var(--bg-portal)` nedtill.

**Text aldrig naken på bild — alltid scrim.**

### 2B · Placeholders (bilder kommer separat)

Bilderna genereras externt och droppas i `public/assets/illustrations/` efterhand (projektkonvention — porträtt/statiska bilder ligger i `public/assets/`; ref `/assets/illustrations/{namn}.jpg`). Tills dess: **rendera en placeholder-yta** så layouten håller.

```tsx
// Placeholder när src saknas/404:
// solid var(--bg-portal-surface) + centrerad mono-label "ILLUSTRATION: {namn}"
// + tunn accent-ram. INGEN trasig img-ikon.
function IllustrationScene({ mode, src, name }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <IllustrationPlaceholder mode={mode} name={name} />
  return <img src={src} onError={() => setFailed(true)} ... />
}
```

Placeholder-stil: `--bg-portal-surface` fyllning, 1px `color-mix(--accent 30%)`-ram, centrerad `--font-mono` 11px text `⬩ {NAMN} ⬩` i `--text-muted`. Behåller exakt samma dimensioner som slutbilden så inget hoppar när bilden landar.

### 2C · Tre inkopplingsplatser

| Plats | Mode | Fil idag | Bild (namn) |
|---|---|---|---|
| ArrivalScene / säsongsstart | fullbleed | `intro.jpg` ✓ finns | intro |
| Annandagen-anslag | band | `annandagen.jpg` ✓ finns | annandagen |
| Finalhelg-portal (gated: `getPlayoffSeriesContext().round === Final`) | header | `final.jpg` ✓ finns | final |

**Kommande bilder** (placeholder tills de droppas): `nyarsbandy`, `varsol`, `kafferummet`, `derby`, `nedflyttning`. Inkopplingsplatser:
- `nyarsbandy` → nyårsbandy-anslag (band), samma struktur som annandagen
- `varsol` → SeasonEndChoreographer SUMMER-fas (fullbleed)
- `kafferummet` → kafferum-scener (band eller kort-illustration)
- `derby` → derby-anslag / portal header-band
- `nedflyttning` → kris/nedflyttningshot mörk säsongston (fullbleed/band)

### 2D · Domänregel (som guld)

Illustration **endast vid ögonblick**: ankomst, säsongsstart, ceremoniella speldagar, slutspel/final, seger, kris. **Aldrig bakom vardagsflöde** (portal, trupp, transfers). Kort äger vardagen.

### Konstanter för bilderna (när de genereras)
- Vertikal ~1436×2550. Finalen är **alltid Uppsala** (en generisk storstadsfinal-bild). Ceremoni-bilder (annandagen/nyår) **alltid ljusa** oavsett tabelläge.

---

## DEL 3 · FEATURE-SPÅR (befintliga handoffs, oförändrade)

Implementeras efter konsekvens-mekaniken. Alla har egna handoffs i `design-system/`:

| Spår | Handoff | Q-status |
|---|---|---|
| Spectator-säsongen | `HANDOFF-SPECTATOR-SASONGEN-2026-05-20.md` | öppna designval |
| Klubbminne + R5 anniversary | `HANDOFF-KLUBBMINNE-ANNIVERSARY-2026-05-20.md` | klar |
| Score-system (ScoreBlock/Sparkline) | `HANDOFF-SCORE-SYSTEM-2026-05-20.md` | **bygg först** (DB-3/Q1 beror på det) |
| Decision-fatigue R1 | `HANDOFF-R1-DECISION-FATIGUE-2026-05-23.md` v3 | Q låsta |
| Manager-karaktär | `HANDOFF-MANAGER-KARAKTAR-2026-05-23.md` v2 | Q låsta |
| Skade-narrativ | `HANDOFF-SKADE-NARRATIV-2026-05-23.md` v2 | Q låsta |
| Landslag (VM) | `HANDOFF-C-K1-LANDSLAG-2026-05-23.md` v2 | VM + lobby låst |
| Säsongsslut-koreografi | `HANDOFF-C-SD1-KOREOGRAFI-2026-05-23.md` | klar |
| Portal-eskalering C-SD2 | `2026-06-01_design_sd2_portaleskalering.html` | klar |
| Portal-kurering | `HANDOFF-PORTAL-KURERING-SVAR-2026-05-23.md` | klar |
| Efterklang flöde | `2026-06-03_design_efterklang_flode.html` | premiss-fält till Opus |
| Trupp (kort/system/polish) | `HANDOFF-TRUPP-*-2026-05-23.md` | Q låsta |
| Granska IA · BoardMeeting S2+ | `2026-05-30_design_*` | klar |
| Pixel-audit-svar (portrait/sparkline/SeasonArc) | `HANDOFF-PIXEL-AUDIT-SVAR-2026-05-31.md` | klar |

---

## Beroendekarta (vad bygga först)

```
Score-system (ScoreBlock + Sparkline)
        ↓ (DB-3, DB-Q1 beror på dessa primitiver)
DB-1 alpha-system (color-mix)
        ↓ (låser upp all mekanisk rgba-städning)
DB-2…DB-9 + R2 + Q2/Q3
        ↓
IllustrationScene-komponent (placeholders)
        ↓
Feature-spår (parallellt, egna handoffs)
```

## Definition of done per block
Mekanik (DEL 1): grep-rent mot hårdkodad rgba/off-scale-radie/Tailwind-rgb. Illustration (DEL 2): komponent + placeholders renderar, tre platser inkopplade, ingen trasig img. Feature (DEL 3): per respektive handoffs acceptanskriterier.

— Design-Claude, 2026-06-05
