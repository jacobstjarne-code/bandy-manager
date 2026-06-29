# Försoningskarta — inline-reimplementerings-stratum (kod-halvan av visuell-konsekvens-auditen)

**Datum:** 2026-06-10
**Källa:** Code-grep-svep (7 punkter) + Opus-rangordning. Pairar med Designs renderade halva (`design-system/briefs/DESIGN-BRIEF-VISUELL-KONSEKVENS-FABLE-2026-06-10.md`).
**Detta är en KARTA, inte en implementationsorder.** Sekvensering nederst.

## Rotorsaken (det viktigaste fyndet)
Typroll-systemet (`.h-label` 2.5px · `.h-eyebrow` 3px · `.h-scene-genre` 4px · `.h-quote` · `.h-display-*`), radie-skalan (14/8/3) och `.btn-*`-klasserna **finns som kanon — men är inte framtvingade.** Färgmigreringen (DB-1) nådde ytorna; roll-/klass-migreringen gjorde aldrig det. Resultat: ett stort stratum vardagsytor som reimplementerar rollerna inline. Bekräftat i tre mått: 120+ inline `fontSize: 9`, 100+ inline `fontFamily: 'var(--font-display)'`, off-scale radie över de mest sedda ytorna.

**Stratumet skapas FORTFARANDE.** `MatchLaddningBand`/`MatchLaddningScene` — A3-arbetet Code skrev i dag — använder redan inline `font-display` ×4 istället för `.h-quote`/`.h-scene`. (Min A3-spec missade att säga "använd rollerna" — min miss, och samtidigt beviset.) Hex har en grep-vakt; typrollerna har ingen. **Det är därför det är lappat och lagat: färgsystemet har en spärr, rollsystemet har ingen.** Utan vakt återföds driften med varje ny yta — migrering ensam löser det inte. → `CODE-LEVERANS-TYPROLL-VAKT-2026-06-10.md`.

## DRIFT vs KANON — avgränsning (annars förstör migreringen sanktionerade mönster)
**DRIFT (migreras):**
- inline `fontSize: 9 + letterSpacing` → `.h-label`/`.h-eyebrow`/`.h-scene-genre` per kontext
- inline `fontFamily: 'var(--font-display)'` (+ italic) → `.h-quote`/`.h-display-*`
- off-scale inline `borderRadius` (2/4/5/6/10/12/16) → skalan 14/8/3 via token
- handrullade KNAPP-ramar (`border: '1.5px solid var(--accent)'` som outline) → `.btn-outline`/`.btn`
- hårdkodad token-hex (`#C47A3A`=--accent, `#4a6680`=--cold, `#4A6A3A`=--success-light i SeasonArcCard; `#E6DDD0` i CommentaryFeedStalvallen) → token

**KANON (rör INTE):**
- `borderLeft: 'Npx solid var(--accent)'` på kort = **stripes-systemet** (DESIGN-DECISIONS, sanktionerat). De flesta punkt-6-träffarna ÄR detta: SituationCard, KlackenSecondary, CoffeeRoomSecondary, OfferCard, ClubExpandedCard, TacticStep, LineupStep, ScoutingTab. **Lämna.** Bara fullramade knapp-outlines är drift.
- `letterSpacing: 4px` = `.h-scene-genre`-kanon, `3px` = `.h-eyebrow`. Bara 2px/1.5px/1px/0.5px/0.3px-labels är drift.
- `radius 99` = pill (tags). `radius 20` = verifiera per instans.
- ClubBadge/BandyPitch-hex = brand/SVG-konstanter. DevScenesScreen = dev-only. Ignorera.

## Rangordnad stratum-karta
**A — vardags-data-ytorna** (störst, mest sedda, tätast reimpl). EN mekanisk migrering, samma över alla:
- PlayerCard (värst: 14 label + 10 quote + 12 off-scale radie — sedd vid varje spelartryck)
- GranskaOversikt · SeasonSummaryScreen · RoundSummaryScreen (13 identiska labels) · OrtenTab · SquadScreen · TabellScreen · HistoryScreen · EkonomiTab

**B — taktik** (samma migrering): FormationView · ChemistryView · NotesView · TacticBoardCard · TaktikScreen.

**C — hårdkodad token-hex** (liten, separat swap): SeasonArcCard (sparkline-färger) · CommentaryFeedStalvallen (`#E6DDD0`) · interaktions-SVG (Corner/Counter/FreeKick/Penalty pitch-färger — eget under-stratum, verifiera vilka som ska tokeniseras vs är medvetna SVG-konstanter).

**D — ceremoni-scener** (lägst prio, mest pixel-låsta): SM/cup victory gradient-hex, SundayTraining, ConfettiParticles. Verifiera per instans — mycket är legit scen-konstant.

## Sekvensering (rekommendation)
1. **Vakten först — högsta hävstången.** Grep/lint-gate, ratchet vid nuvarande antal, driv mot noll. Utan den återföds stratumet (A3 bevisade det i dag). Specad: `CODE-LEVERANS-TYPROLL-VAKT-2026-06-10.md`.
2. **Migrera A+B som ETT pass mot rollerna** — inte yta-för-yta-tickets (det *är* lappandet). Mekaniskt: label→roll, quote→roll, radie→skala, knapp→.btn. **Kör efter Designs steg-3-regler** (de två systemklasserna + ev. token-beslut), så typroll-migrering och systemklass-regler landar i samma reconciliation, inte två överlappande pass.
3. **C** — hex→token-swap, separat liten pass.
4. **D** — sist, per-instans-verifierat.

## INTE i scope
Stripes-systemet (kanon). Designs två systemklasser (väntar steg-3-regler). MatchScreen-förmatch + Granska (för-gaffel).
