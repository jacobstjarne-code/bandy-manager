# Design-brief — Konsekvens runda 2

**Till:** Claude Design · **Från:** Opus (via Jacob) · **Datum:** 2026-06-05
**Föregående:** `DESIGN-BRIEF-KONSEKVENS-2026-06-04.md` (DB-1…DB-9, klara) · beslut i `DESIGN-DECISIONS.md` ("Konsekvens-unifiering") · mock `docs/mockups/2026-06-05_design_konsekvens_db1-9.html`

DB-1…DB-9 är beslutade och under implementering. Codes Tier 1-svep lyfte tre saker som är **genuint visuella** — de kräver ditt öga, inte en mekanisk swap. Tre kort, regel + mobil mockup per kort, samma upplägg som förra. Inga svar förskrivna.

Systemfilerna (`colors_and_type.css`, `DESIGN-DECISIONS.md`, `CODE-OPUS-INSTRUCTION.md`) gäller oförändrat — håll besluten.

---

## R2-1 · Display-/scen-rubrik-kalibrering

**Problem:** ~30 display- och scen-rubriker avviker från de definierade rollerna i vikt (800/900) och storlek (18–64px). De är inte rena swaps — varje är ett kalibreringsval.

**Rollerna idag:**
- `.h-display-xl/lg/md/sm` = 44 / 36 / 28 / 22px, vikt 800/800/700/700.
- `.h-scene-title` = 28px/700, `.h-scene-setting` = 13px italic.

**Kända avvikare (Code levererar full grep-lista som underlag):**
- `SeasonSummaryScreen` `<h1>` Georgia 28 **vikt 900** (rollen 700).
- "ÅRSBOK"-eyebrow 11px / letter-spacing 3px.
- `BoardMeetingScene` scen-titel 23 (rollen 28), setting 12.5 (rollen 13).
- Spridning 18–64px i övriga scen-/hjälte-rubriker.

**Beslut du levererar:** får display/scen-skalan **fler steg och/eller en 900-vikt-variant** (för de tyngsta hjälte-rubrikerna), eller ska instanserna **konforma** till befintliga roller? Mocka skalan så den täcker spannet utan att bli en flora. Avgör eyebrow-rollen (11/3px återkommer — egen `.h-eyebrow`, eller `.h-label`?).

---

## R2-2 · Hjälte-CTA-variant

**Problem:** `SeasonSummaryScreen` "Starta säsong {n} →" är en säsongsavslutnings-höjdpunkt (radius 12, padding 17, fontSize 16, vikt 800, glow-shadow). Code konverterade den **inte** till `.btn .btn-primary` — det hade krympt ceremonin (radius 8, padding 7×14, 12px, ingen glow). Rätt instinkt; nu behövs en systemregel.

**Kopplat:** "Dela"/"Historik" på samma skärm har radius 12 och Historik är grå (`--border`/`--text-secondary`), inte `.btn-outline`s accent. Radius 12 är dessutom off-scale (skalan 14/8/3 — DB-9 tog bara 6).

**Beslut du levererar:** får systemet en sanktionerad **`.btn--hero`** (ceremoniell — i DB-3:s anda att special-behandling reserveras för höjdpunkter), eller konformar säsongsslut-CTA:n till `.btn-primary`? Om hero-variant: speca radius (14?), padding, vikt, glow — och var den får användas (säsongsslut, seger, cup; inte vardags-CTA). Ditt val avgör samtidigt radius-12 och Dela/Historik-knapparna.

---

## R2-3 · Åldersband-taggar (DB-5-familjen)

**Problem:** `SquadScreen` åldersband-pills är inkonsekventa och saknar gemensam variant. "Utvecklas" = `--ice` / bg 0.1 / radius 4; "Avtar" = grå fyllning, ingen variant alls; "Peak" = redan `.tag` med radius 99. Tre olika uttryck för samma sorts indikator.

**Beslut du levererar:** definiera åldersband-taggarna som en del av **DB-5:s chip-familj** — Utvecklas / Peak / Avtar med konsekvent form (radius, fyllning, kant). Håll dig inom squad-domänens dokumenterade `--cold`/`--warm`-undantag; guld aldrig här (DB-2). Mocka de tre intill en squad-rad så de läses i kontext.

---

## Leverans

En canvas, tre kort, regel + mobil mockup (375–430px) per kort. Underlag: bifogade systemfiler + skärmdumpar (`app_squad_rows` för R2-3; SeasonSummary- och BoardMeeting-captures för R2-1/R2-2) + Codes grep-lista för R2-1. Skriv besluten försvarbara mot `DESIGN-DECISIONS.md` så Opus kan skriva in dem direkt.
