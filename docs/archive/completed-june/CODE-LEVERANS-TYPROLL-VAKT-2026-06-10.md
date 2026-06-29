# CODE-LEVERANS — Typroll-vakt (ratchet) — stoppa stratum-återväxten

**Datum:** 2026-06-10
**Källa:** inline-stratum-svepet (`AUDIT-INLINE-STRATUM-KARTA-2026-06-10.md`). Rotorsak: typroll-systemet är inte framtvingat — färgen har en grep-vakt, rollerna har ingen. Stratumet återväxer (A3-arbetet i dag lade redan till inline font-display). Den här vakten stoppar blödningen FÖRE migreringen. Migrering ensam räcker inte.

## Vad
Ett grep-baserat dev/CI-check-script som räknar inline-reimplementeringar av kanon-roller och **ratchetar vid nuvarande antal** — fail om antalet ÖKAR, tillåt minskning. Samma mönster som den befintliga hex-vakten + Tailwind-rgb-ratchet (DESIGN-DECISIONS).

## Mönster som räknas (drift)
- inline `fontSize: 9` — label-reimpl (ska vara `.h-label`/`.h-eyebrow`/`.h-scene-genre`)
- inline `fontFamily: 'var(--font-display)'` — quote/display-reimpl (ska vara `.h-quote`/`.h-display-*`)
- off-scale inline `borderRadius:` med numeriskt värde ∉ {3, 8, 14, 99} (ska vara skalan, helst via `var(--radius*)`)

## INTE räkna (kanon/legit — annars falska positiv)
- `borderLeft`/`border: 'Npx solid var(--accent)'` — **stripes-systemet, sanktionerat.** Vakten rör inte det mönstret alls.
- `letterSpacing` — för spritt (2.5/3/4px är kanon i olika roller); hanteras i migreringen, inte vakten.
- `borderRadius: 'var(--radius...)'` — token, ok.
- `DevScenesScreen.tsx` (dev-only), `__tests__/`, SVG-interna värden, `ClubBadge`, `BandyPitch`.

## Mekanik (ratchet)
- Baslinje-fil `scripts/ds-guard-baseline.json` — antal per mönster. Kör scriptet en gång, frys siffran.
- Check: räkna i `src/presentation/**/*.tsx` (exkl. ovan). Antal > baslinje → exit 1 (fail, namnge filerna som ökade). Antal < baslinje → skriv "ratchet kan sänkas till N", exit 0.
- Undantags-markör för genuint dynamiska fall: `// ds-exempt` på samma eller föregående rad räknas inte. Sparsamt, med motivering.
- Wire:a in i samma CI/precommit-steg som hex-vakten.

## Acceptans
- Scriptet räknar de tre mönstren, exkluderar kanon + dev + tests, respekterar `// ds-exempt`.
- Baslinje fryst vid nuvarande antal; ny inline-reimpl någonstans → fail med fil-namn.
- En rad i README/DESIGN-DECISIONS: rollsystemet har nu en vakt (paritet med hex).
- **Ingen befintlig komponent ändras** — bara script + baslinje-fil. Detta är inte migreringen.

## INTE i scope
Migreringen (Stratum A+B — väntar Designs steg-3-regler så typroll + de två systemklasserna landar i ETT pass). Stripes. letterSpacing-spridningen.

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-TYPROLL-VAKT-2026-06-10.md`. Bygg en ratchet-vakt för inline-reimplementering av typroller — paritet med hex-vakten. Detta är INTE migreringen; ingen komponent ändras.

1. Script som räknar i `src/presentation/**/*.tsx` (exkl. `DevScenesScreen.tsx`, `__tests__/`): inline `fontSize: 9` · `fontFamily: 'var(--font-display)'` · off-scale `borderRadius:` (numeriskt ∉ {3,8,14,99}).
2. **Räkna INTE** `border(Left)?: 'Npx solid var(--accent)'` (stripes, kanon), `borderRadius: 'var(--radius...)'`, eller `// ds-exempt`-markerade rader.
3. Baslinje `scripts/ds-guard-baseline.json` fryst vid nuvarande antal. Antal > baslinje → exit 1 + namnge filer. Antal < → meddela sänkbar ratchet, exit 0.
4. Wire:a in där hex-vakten kör. Notera i README/DESIGN-DECISIONS att rollerna nu har en vakt.

**Rör INTE** befintliga komponenter — bara script + baslinje. Migreringen kommer separat.

**Klart =** ratchet-script kört och fryst vid baslinje · stripes/token/dev/tests exkluderade · `// ds-exempt` respekterad · inwirat i CI. **Rapportera baslinje-antalen per mönster.**
