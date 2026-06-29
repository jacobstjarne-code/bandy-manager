# CODE-SPÅR — Konsekvens-mekanik

**Till:** Code (Claude Code, VS Code) · **Från:** Opus · **Datum:** 2026-06-04
**Syskon-dokument:** `design-system/briefs/DESIGN-BRIEF-KONSEKVENS-2026-06-04.md` (DB-1…DB-9, de visuella besluten). Råmaterial: divergenskatalogen (outputs 2026-06-04).

Det här är den **mekaniska** delen av konsekvens-auditen — ingen visuell bedömning. Två nivåer:
- **Tier 1 — oberoende:** kör nu, parallellt med att Design jobbar. Inget DB-beslut krävs.
- **Tier 2 — ~~blockerad~~ avgrindad (2026-06-05):** alla DB-1…DB-9 beslutade — kör hela Tier 2, DB-1 först.

---

## 0 · Disciplin (gäller hela dokumentet)

- **Verifiera i kontext, swap aldrig blint.** Läs föräldra-screen, spåra render-flödet. En inline-stil som *liknar* en roll kan ha en avsiktlig avvikelse (annan storlek/spacing/färg). Byt till klass **endast där inline-värdena är identiska med rollen**. Där de avviker: **flagga, restyla inte tyst** — en avvikelse kan vara en mikro-visuell fråga (→ Jacob/Design), inte en mekanisk fix.
- **Grep-drivet, inte hand-enumererat.** De listade instanserna kommer från ~16 lästa ytor. Samma mönster finns i de olästa (`granska/*`, `match/components`, övriga `portal/*`). Greppa mönstren över hela `src/presentation/` — lita inte på att listan är komplett.
- **`currentMatchday` och kalendern är heliga.** Rör dem aldrig som sidoeffekt. Rör ingen spel-logik — det här är ren presentation.
- **Token-källa:** `src/styles/global.css` är sanning. `design-system/colors_and_type.css` är en spegel som kan släpa. Scen-tokens (`--bg-scene`/`--bg-scene-deep`) nu synkade (2026-06-05). **OBS:** `--radius-md: 8px` finns i spegeln men saknas i global.css :root — lägg till den i global.css före DB-9-snäppning. Verifiera mot global.css.
- **Visa diff/före-efter-värden**, inte slutsatser, när du rapporterar.

---

## Tier 1 — Oberoende (kör nu)

### T1a · Roll-klass-migrering (`.h-label` / `.h-display-*` / `.h-scene-*`)
Inline-stilar som återimplementerar en befintlig typ-roll → byt till klassen.
**Grep-kandidater:** inline `fontSize:` i kombination med `textTransform: 'uppercase'` + `letterSpacing` (→ `.h-label`); `fontFamily: var(--font-display)` + stor `fontSize` (→ `.h-display-*`); scen-ytor med Georgia-rubriker (→ `.h-scene-*`).

**Rena swaps (värden matchar rollen — gör direkt):**
- `SimSummaryScreen` `const LABEL` (8px/600/2px/uppercase/text-muted) = `.h-label` exakt → `className="h-label"` (×5).
- `EkonomiSecondary` kassa-värde (Georgia 22/700) = `.h-display-sm` → klass + färg-override på mörk yta (`--text-light`/`--danger`).

**Avvikelser (FLAGGA, restyla inte tyst — kräver ruling):**
- `SeasonSummaryScreen` `<h1>` Georgia 28 **fontWeight 900** vs `.h-display-md` (700). Vikten avviker.
- `SeasonSummaryScreen` "ÅRSBOK"-eyebrow 11px/letterSpacing 3px vs `.h-label` (8px/2px).
- `RoundSummaryScreen` sektionsetiketter 9px/letterSpacing 2.5px vs `.h-label` (8px/2px) (×~10).
- `BoardMeetingScene` scen-titel Georgia 23 vs `.h-scene-title` (28); setting 12.5 vs `.h-scene-setting` (13).

Scen-ROLL-migrering (`.h-scene-*`) hör hit (oberoende). Scen-ATMOSFÄR (gradient-bakgrunder) hör till Tier 2 / DB-7.

### T1b · Bespoke primär-CTA → `.btn .btn-primary`
Knappar byggda inline med `background: 'var(--accent)'` i stället för btn-klassen.
- `SeasonSummaryScreen` "Starta säsong {n} →" → `.btn .btn-primary`.
- `SimSummaryScreen` "Tillbaka till dashboard →" → `.btn .btn-primary`.
- Outline-CTA:erna i SeasonSummary (dela/historik) → `.btn .btn-outline`.
**Referens som redan gör rätt:** `RoundSummaryScreen` ("Nästa omgång", `.btn btn-primary`), `TransfersScreen`.
**Grep:** `<button` med inline `background: 'var(--accent)'`.

### T1c · z-index → skala
- `SquadScreen` spelarkort-modal `zIndex: 200` → `var(--z-modal)` (300).
- `RoundSummaryScreen` sticky CTA `zIndex: 50` → under skalans golv (100); antingen dokumentera en sticky-footer-nivå eller lämna. Liten — din call.
**Grep:** `zIndex:` med literal utanför skalan (100/300/400/500/600).

### T1d · Inline-pills → `.tag` (om variant finns)
`SquadScreen` "Utvecklas"/"Avtar" är bespoke inline-pills medan "Peak" redan är `.tag .tag-copper`. Byt de två till `.tag`-varianter **om** motsvarande varianter finns; annars flagga (kräver ny tag → liten Design-touch).

---

## Tier 2 — ~~Blockerad~~ AVGRINDAD (2026-06-05)

**Alla DB-1…DB-9 är beslutade** (`DESIGN-DECISIONS.md` 2026-06-05 · mock `docs/mockups/2026-06-05_design_konsekvens_db1-9.html`). Grindarna är lyfta — kör hela Tier 2, **DB-1 först** (låser upp rgba→color-mix). Tabellen nedan är nu arbetsordning, inte väntelista.

**Preciseringar från besluten (läs före konvertering):**
- **DB-1 alpha-steg:** 6/18/30/35/55% via `color-mix(in srgb, var(--token) N%, transparent)`. **Glow-steget (35%) auto-konverteras INTE** — varje `box-shadow` flaggas för manuell review (visuellt känsligt). Mock-demos använder ungefärliga %-värden (4/7/14) → snäpp till de fem kanoniska stegen.
- **DB-4:** pengar → Georgia. `EkonomiTab` hero-saldo → `.h-display-sm` (Georgia 22), inline-belopp Georgia 700; `BoardMeetingScene` mono-kassa → Georgia. Säkerställ att `ScoreBlock`-siffran är **mono** (score=mono enligt matrisen).
- **DB-9:** lägg till `--radius-md: 8px` i `global.css` :root **före** snäppning — den saknas i källan.

Varje rad namnger sitt DB (= vilket beslut den realiserar).

| Mekanik | Grind | Grep / var |
|---|---|---|
| `rgba(<token-rgb>, α)` → token-alpha (`color-mix`) | **DB-1** | `rgba(196,122,58`, `rgba(176,80,64`, `rgba(140,110,58`, `rgba(90,154,74`, `rgba(26,26,24`, `rgba(126,179,212` |
| `${color}18`-hex-append → token-alpha | **DB-1** | `InboxScreen` ikon-cirkel; greppa `}18\`` / template-hex |
| Off-palette Tailwind-färger → `--success`/`--danger` | **DB-1** | `rgba(34,197,94` (Squad CA-glow), `rgba(239,68,68` (Squad fitness-varning, Tabell zon-rader). Nyans är uppenbar; alpha-form per DB-1 → gör ihop med DB-1 för att slippa dubbel-touch |
| Dekorativa yt-gradienter bort/ersätt | **DB-8** (+ DB-1 för ersättningstint) | `linear-gradient` på yta: `TabellScreen` (header-strip, managed-rad), `SeasonSummaryScreen` ("Årets match"-kort). OBS scrim/fade (RoundSummary footer) = legitim, rör ej |
| Hero-/egen-match-score → ScoreBlock/ceremoniell | **DB-3** | `SeasonSummary` "Årets match" (Georgia 40), `RoundSummary` match-hero (Georgia 24), `TabellScreen` cup-bracket |
| Squad-rad state-stripe → nytt schema | **DB-5** | `SquadScreen.stripeColor()` |
| Pengar-rendering → enhetlig | **DB-4** | Georgia/mono/sans-bold: `EkonomiSecondary`, `EconomyMinimal`, `RoundSummary`, `BoardMeetingScene`, `EkonomiTab` |
| Guld-creep bort | **DB-2** | `SquadScreen.stripeColor` (`--gold` kontrakt), `BoardMeetingScene` (`GENRE_COLOR.B`, stretch-stripe) |
| Mörk-yta-variant i st.f. token-shadow | **DB-6** | `NextMatchPrimary` (inline token-override-block) → riktig portal-variant av `NextMatchCard` |
| Scen-atmosfär tokeniseras | **DB-7(b)** | `SMFinalVictoryScene` m.fl. bakgrunds-gradienter (om Design väljer tokenisering) |
| Radie `6` normaliseras | **DB-9** | portal-kort + Tabell-tabbar; `borderRadius: 6` |

---

## Tier 2b — Runda 2: nya roller & varianter (R2-1…R2-3)

Beslutade 2026-06-05 (`DESIGN-DECISIONS.md` + mock `docs/mockups/2026-06-05_design_konsekvens_r2.html`). Nya design-system-primitiver att definiera i `global.css` (+ re-synka spegeln), sedan applicera.

**Nya roller/varianter:**
- `.h-display-hero` = `font-family: var(--font-display); font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -1px;`. **Endast** säsongsavslut + seger-hjälte. (Georgia 900 syntetiseras på de flesta OS — storlek+spacing bär; ingen webfont.)
- `.h-eyebrow` = `font-family: var(--font-body); font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent);`. Bekräfta vikten mot live SeasonSummary-eyebrown.
- `.btn--hero` = radius 14, padding 17×22, font 16/800, letter-spacing 0.5px, `box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 35%, transparent)` (**kanon-glow 35%, ej mockens 40%**). `.btn--hero.gold` = gold-gradient + `--gold 35%`-glow. Domän: säsongsslut/seger/cup only.
- Åldersband-chip (en form): `border-radius: 99px; border: 1px solid color-mix(in srgb, var(--token) 30%, transparent); background: color-mix(in srgb, var(--token) 6%, transparent);` med token = `--cold` (Utvecklas) / `--success` (Peak) / `--text-muted` (Avtar). **Kanon 6/30, ej mock-demons 8/40.**

**Applicering:**
- `SeasonSummaryScreen` `<h1>` (900) → `.h-display-hero`; "ÅRSBOK"-eyebrow → `.h-eyebrow`; "Starta säsong" → `.btn--hero`; Dela/Historik → `.btn-outline`.
- `BoardMeetingScene` scen-titel 23→28 (`.h-scene-title`), setting 12.5→13 (`.h-scene-setting`).
- `SquadScreen` Utvecklas/Avtar/Peak → den nya åldersband-chippen; `--ice` → `--cold`.
- Seger/cup-scener: avslutande CTA → `.btn--hero.gold` där en sådan finns.

---

## Arbetsordning

1. Kör **Tier 1** nu (T1a rena swaps, T1b, T1c) — säkert, parallellt med Design.
2. Samla Tier 1-avvikelse-flaggorna i en kort lista till Jacob (de få mikro-visuella frågorna).
3. **Alla DB är beslutade** — kör Tier 2 i ordning, DB-1 först (låser upp hela rgba/color-mix-konverteringen). Glow-steget (35%) flaggas manuellt, ej auto.
4. Avsluta varje rond med kön mot noll: rapportera vad som greppats, bytts, flaggats — med diff, inte slutsats.
