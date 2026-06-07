# DESIGN-BRIEF — Konsekvens-unifiering

**Till:** Claude Design · **Från:** Opus (diagnos) · **Datum:** 2026-06-04
**Underlag:** divergenskatalogen (`docs/`-utdata 2026-06-04) + levande kod. Den här briefen är *destillatet* — de visuella beslut du ska lösa. Katalogen är råmaterialet.

---

## Uppdraget i en mening

Designuttrycket har glidit isär — byggt över många sessioner, dels via dina mockar, dels direkt i kod. Du ska **inte** rita om spelet. Du ska fatta en handfull **visuella systembeslut** som gör att de inkonsekventa ytorna kan dras tillbaka till ett uttryck, och leverera mockup/spec för vart och ett. Code utför sedan.

## Vad som är ditt — och vad som inte är det

**Ditt (denna brief):** de beslut nedan (DB-1…DB-9) som kräver visuellt omdöme. Du levererar canvas-mockup + en kort regel per beslut.

**INTE ditt:** den mekaniska städningen — `.h-*`-klassbyten där inline-typografi reimplementerar en befintlig roll, ren `var()`-tokenisering, `z-index`-snäpp till skalan. Det är ett separat Code-spår, grep-drivet, och kräver inga visuella beslut. Speca det inte. Det väntar bara på DB-1 (alpha-systemet) för att kunna köras i ett svep.

**Kvot:** Design delar numera pool med Claude.ai + Code. Besluten är därför grupperade i tre canvas-pass (se slutet) så du kan lösa flera samtidigt i stället för ett kort per fråga.

---

## Systemet du arbetar inom (icke förhandlingsbart)

Läs `colors_and_type.css` (högsta auktoritet) → `DESIGN-DECISIONS.md` → `CODE-OPUS-INSTRUCTION.md`. Sammanfattat, det du inte får bryta:

- **Heritage Bandy-paletten.** Varm sten/papper ljust, mörk portal, koppar-accent, is/kall svalt. Inga främmande färger. (Koden innehåller idag Tailwind-defaults — `rgb(34,197,94)`, `rgb(239,68,68)` — som **inte** finns i paletten. De ska bort, inte kanoniseras.)
- **Typ-roller** (`.h-display-*`, `.h-card`, `.h-body*`, `.h-label`, `.h-quote`, `.h-cta`, och scen-rollerna `.h-scene-*`). Dessa är kanon. Ad-hoc `fontSize/fontWeight` som återskapar en roll är drift, inte design.
- **Stripe/severity-disciplin.** Vänster-stripe endast i severity (`--cold`/`--warm`, reserverade — får ej återbrukas för annan state) + sanktionerade action/info-cards. Allt annat är "stripes-inflation".
- **Score-primitiver.** `ScoreBlock` (avgjort resultat) + `Sparkline` (trend) + LED (endast live-match). ScoreBlock aldrig på monetära tal.
- **Guld** (`--gold`) reserverat för cup/SM-seger. Späd inte ut det.
- **Inga AI-slop-tropes.** Gradient-bakgrunder på stora ytor, generic emoji, pastisch — förbjudet.
- **Mobil 375–430px.** Allt mocka du gör är mobilt först.

---

## Vad som glidit (symptom, inte fixar)

Två mönster förklarar merparten, och hör till **Code-spåret** (mekaniskt) — du behöver bara veta att de finns:

1. **Inline-reimplementering av roller.** `.h-label` och `.h-display-*` (och `.h-scene-*`) skrivs om som inline-stilar på nästan varje direkt-byggd yta. Ren klassbyte.
2. **Fejkad token-alpha.** Tinter/borders/dividers/glow byggs med hårdkodad `rgba(<token-rgb>, α)` (+ varianten `${color}18` hex-append i InboxScreen). Det här är *inte* rent mekaniskt — det saknas alpha-tokens. Det är DB-1.

Resten är **dina beslut**.

---

## Visuellt underlag — öppna bilderna, inte koden

Du auditerar inte kod. Det visuella nuläget finns fångat i `screenshots/audit/`. **Kod-referenserna ("Titta på: …") vid varje beslut nedan är grep-ankare för Code-spåret — inte för dig.** Du arbetar från bilderna:

| Beslut | Skärmdumpar (`screenshots/audit/`) |
|---|---|
| DB-1 alpha/tint | `app_squad_rows`, `vag4_ekonomi`, `app_portal_cards`, `app_efterklang` |
| DB-2 guld-gräns | `app_sm_victory` + `app_cup_victory` (kanoniskt rätt), `board_a` / `board_b` / `board_c` (guld vid B), `app_squad_rows` (guld-creep) |
| DB-3 hero-score | `vag4_season_a/b/c`, `vag4_playercard` + `vag4_pc_*` (kontrast: ScoreBlock), `../match_result_win/loss/draw` |
| DB-4 pengar Georgia/mono | `vag4_ekonomi*`, `app_portal_cards` (Georgia) vs `board_b` (mono) |
| DB-5 squad-rad | `app_squad_rows`, `app_squad_trupp`, `app_squad` |
| DB-6 mörk-varianter | `app_portal`, `app_portal_cards`, `sd2_upptakt_pcard` |
| DB-7 scen-typo + atmosfär | `app_sm_victory`, `app_cup_victory`, `board_a/b/c` |
| DB-8 gradient-policy | `vag4_season_*` (Årets match-kort) — **TabellScreen saknar capture, se gap** |
| DB-9 radie | `app_portal_cards` |

**Capture-gap (ingen skärmdump finns — nuläge i ord nedan):** `TabellScreen`, `InboxScreen`, `SimSummaryScreen`.

### Gap-ytor — nuläge i ord (Opus läst ur koden, så du kan mocka utan capture)

**TabellScreen** (DB-1, DB-3, DB-8): tre tabbar i en `--bg-elevated`-pill, aktiv = accent-fylld, radie 6. Tabellrader i 7-koll grid. **Header-raden är en dekorativ gradient** (`linear-gradient(90deg, --bg-dark, --bg-dark-surface, --bg-dark)`); **managed-klubbens rad en till gradient** (`rgba(196,122,58,0.12)→rgba(196,122,58,0.04)`). Vänster-stripe per rad: topp-3 = `--accent`, 4–8 = `rgba(196,122,58,0.4)`, 9–10 = transparent, 11+ = **`rgba(239,68,68,0.6)` (off-palette Tailwind-röd)**. Zon-dividers ("Slutspelsstrecket"/"Nedflyttning") i samma hårdkodade accent/röd. Sektionsetiketter = `.h-label` inline-reimplementerad. Cup-bracket-resultat = bespoke Georgia-14-text (hero-score, DB-3).

**InboxScreen** (DB-1): rader; oläst = sanktionerad vänster-stripe `3px --accent` + bg `rgba(196,122,58,0.06)`. Ikon-cirkelns bg byggs med **hex-append** `${color}18` (token + hårdkodad alpha-hex — DB-1-variant). Kategori-rubriker med emoji-prickar 🔴🟡⚪ + `.h-label` inline. Coach-ton: initial-cirkel `--accent-dark`, Georgia-kursiv — token-rent i övrigt.

**SimSummaryScreen** (DB-3): `const LABEL` = `.h-label` reimplementerad som inline-objekt (×5). Header `fontSize 18 Georgia 700`. Matchresultatlistan använder `<ScoreBlock compact>` ✓ (rätt). Höjdpunkter har score som löptext i meningar (acceptabelt, prosa). Fortsätt-knapp = bespoke inline `background var(--accent)` i stället för `.btn .btn-primary`.

**Färskhets-status:** Opus har öppnat och verifierat de beslutskritiska bilderna mot koden — `app_squad_rows`, `board_b`, `vag4_ekonomi` är **aktuella** (matchar nuvarande kod). Övriga `app_*`-captures är namn-pekare; bekräfta vid behov. **OBS:** `app_squad_rows` visar bara den **gröna (peak)** stripe-varianten — inte guld (kontrakt) eller danger (skadad). För DB-2/DB-5 behövs en capture med blandade spelar-states, annars mocka från stripe-schemat i `SquadScreen.stripeColor`.

---

## Besluten du ska lösa

> Format: vad som ska beslutas · varför det är öppet · vad du levererar. **Inga svar är förskrivna** — riktningar som nämns är kandidater att välja mellan på canvas, inte order.

### DB-1 · Alpha-/tint-systemet *(master-beslutet)*
**Beslut:** den kanoniska skalan för tinter, borders, dividers och glow ovanpå paletten. Idag fejkas allt med hårdkodad `rgba()`.
**Varför öppet:** det finns inga tokens för alpha-varianter, så varje yta uppfinner sina egna opaciteter (0.04 / 0.05 / 0.06 / 0.08 / 0.1 / 0.12 / 0.15 / 0.3 / 0.4 …) av accent/danger/warm/success/text.
**Redan rätt på ETT ställe:** `TranareTab` gör det token-rent med `color-mix(in srgb, var(--danger) 6%, transparent)` — exakt det som resten av appen fejkar med hårdkodad `rgba()`. Tekniken finns alltså redan in-repo; den tillämpas bara inkonsekvent.
**Levererar:** ratificera en kanonisk teknik (`color-mix(token)` är en stark kandidat) + opacitetsstegen (tint-bg / border / divider / glow per semantisk färg). **När stegen är satta blir konverteringen `rgba()`→token till stor del mekanisk (Code)** — bara stegvalen + glow-behandlingen kräver ditt öga. Detta låser upp hela den mekaniska städningen.
**Titta på:** SeasonSummary (AwardCard, YOUTH/COMMUNITY), SquadScreen (chips, CA-glow), TabellScreen (zon-rader), InboxScreen (`${color}18`).

### DB-2 · Guld-domänens gräns
**Beslut:** var guld får och inte får synas.
**Varför öppet:** guld används **rätt** i segerscenerna (SM/cup) — men kryper in i SquadScreen (kontrakt-utgår-stripe, fel) och BoardMeetingScene (B-läge + stretch-mål, medvetet men oprövat). Reserven behöver en uttalad gräns.
**Levererar:** regel — "seger enbart", eller "seger + ett definierat aspirations-/prestations-register" — med gränsfallen (kontrakt, B-läge, stretch-mål) avgjorda.
**Titta på:** `SMFinalVictoryScene` (kanoniskt rätt), `BoardMeetingScene` (`GENRE_COLOR.B`, stretch-stripe), `SquadScreen` (`stripeColor` → `--gold`).

### DB-3 · Hero-/egen-match-score
**Beslut:** hur den stora egna/avgörande matchsiffran renderas.
**Varför öppet:** sekundära resultat använder `ScoreBlock` ✓ — men den stora hjälte-siffran är bespoke Georgia överallt, olika på varje yta.
**Levererar:** hero-score-behandling (ScoreBlock hero-variant vs en distinkt ceremoniell hjälte) + var vardera gäller. Mocka gärna båda.
**Titta på:** SeasonSummary ("Årets match", Georgia 40), RoundSummary (match-hero, Georgia 24), TabellScreen (cup-bracket-resultat).

### DB-4 · Penningtal: Georgia vs mono
**Beslut:** den kanoniska numeriska behandlingen för pengar — och hur den skiljer sig från resultat (score), statistik-tal och placering.
**Varför öppet:** kassa renderas på **tre** sätt — Georgia (`EkonomiSecondary`, `RoundSummary`, `EconomyMinimal`), `--font-mono` (`BoardMeetingScene`, verifierat i `board_b`: "80 tkr" mono grön) och **sans-bold** (`EkonomiTab` saldo, verifierat i `vag4_ekonomi`: "96 000 kr" sans 18/800). Tre sanningar.
**Levererar:** en liten matris — score / pengar / statistik / placering → vilken roll/font/behandling.

### DB-5 · Squad-radens state-kodning
**Beslut:** hur en tät listrad signalerar flera samtidiga states (skadad, avstängd, låg moral, kontrakt-utgår, ung, peak) utan att bryta stripe/severity/guld-reserven.
**Varför öppet:** `SquadScreen.stripeColor()` kodar sex states i en vänster-stripe som återbrukar reserverade `--cold`/`--warm` + `--gold` + `--success` och lutar sig dessutom mot främmande Tailwind-glow. Det här *är* stripes-inflationen i sin nuvarande, lokaliserade form.
**Levererar:** ett state-system för squad-raden (stripe-schema, ikon, tag eller relationsbar — ditt val) som håller sig inom reglerna.
**Titta på:** `SquadScreen` (`stripeColor`, chip-raden, CA-badge-glow).

### DB-6 · Mörk-yta-varianter (sluta token-skugga)
**Beslut:** får delade kort riktiga ljus/mörk(portal)-varianter, och hur ser portal-ytan ut för dem?
**Varför öppet:** `NextMatchPrimary` återanvänder ett ljus-byggt kort på mörk portal genom att **skriva över semantiska tokens inline** (`--text-muted: rgba(196,186,168,0.55)` osv.). Det är en omskinnings-hack, inte en variant.
**Levererar:** ansats för yt-varianter på delade kort (en riktig portal/dark-variant) så token-skuggningen kan dö.
**Titta på:** `NextMatchPrimary` (token-override-blocket), `NextMatchCard` (originalet, ljust).

### DB-7 · Scen-typografi + ceremoniella scener
**Beslut:** (a) är `.h-scene-*` de kanoniska rollerna scener ska använda, och (b) tokeniseras scenernas atmosfär-gradienter eller är de ett sanktionerat per-scen-undantag?
**Varför öppet:** `.h-scene-*` reimplementeras inline (`BoardMeetingScene`: Georgia 23 i st.f. 28, 12.5 i st.f. 13) — samma sjuka som `.h-label`. Och segerscenerna är pixel-låsta till mockar med off-token gradient-atmosfär ("Justera inte"), dvs token-systemet täcker inte scen-atmosfär.
**Levererar:** ruling på (a); för (b) antingen scen-atmosfär-tokens eller en uttalad undantagsregel.
**Titta på:** `SMFinalVictoryScene` (bakgrunds-radials, hårdkodade), `BoardMeetingScene` (inline scen-roller).
**Governance-not:** koden refererar `--bg-scene-deep`/`--bg-scene` som **inte** finns i `colors_and_type.css`-spegeln — arbeta mot levande `src/styles/global.css`, inte bara spegeln, och flagga om spegeln ska synkas.

### DB-8 · Gradient-policy
**Beslut:** den uttalade gränsen mellan tillåten och förbjuden gradient.
**Varför öppet:** scrim/fade-gradienter (RoundSummary sticky-footer) är legitima; dekorativa yt-gradienter (TabellScreen header-strip + managed-rad, SeasonSummary "Årets match"-kort) bryter no-gradient-regeln. Regeln behöver bli explicit + de befintliga dekorativa ytorna behöver en ersättning.
**Levererar:** do/don't (scrim ja, dekorativ yt-fyllning nej) + ersättningsbehandling för de flaggade ytorna.

### DB-9 · Radie-ruling
**Beslut:** adoptera `6px` som dokumenterad portal-radie, eller normalisera till `--radius-md` (8)?
**Varför öppet:** off-scale `6` återkommer på portal-kort och Tabell-tabbar, vid sidan av skalan 14/8/3.
**Levererar:** en rad i beslut. *(z-index-avvikelserna 200/50 är rent mekaniska → Code, inte du.)*

---

## Föreslagen gruppering (för kvot)

- **Pass A — system-sheet:** DB-1, DB-4, DB-8, DB-9. Token/system-rulings, en canvas.
- **Pass B — semantik & score:** DB-2, DB-3. Reserv + resultat-rendering.
- **Pass C — komponent & yta:** DB-5, DB-6, DB-7. Mockup-tyngre.

## Definition of done

Per beslut: en kort regel (en–två meningar, försvarbar mot `DESIGN-DECISIONS.md`) + canvas-mockup där ett visuellt val krävs. När besluten är fattade uppdateras `DESIGN-DECISIONS.md` (Opus/Jacob skriver in dem) och Code kör mekanik + dina specar.

## Constraints

- **Mobil 375–430px**, alltid.
- **`currentMatchday` och kalendern är heliga** — rör dem aldrig som sidoeffekt (inte din yta, men nämnt så inget förslag petar i dem).
- **Den mekaniska städningen är inte din** — föreslå inga `.h-*`-byten eller `var()`-tokeniseringar; lös bara DB-1…DB-9.
