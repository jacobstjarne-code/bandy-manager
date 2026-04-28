# Sprint Säsongens Signatur Kapitel C — audit

**Commit:** 53b1fda  
**Datum:** 2026-04-28

---

## Punkter i spec

- [x] **C1 SeasonSignature.ts** — Entitet med `SeasonSignatureId`, `SeasonSignatureModifiers`, `SeasonSignature`, `SEASON_SIGNATURE_DEFS`. Alla 6 signaturer definierade.
- [x] **C2 seasonSignatureService.ts** — `pickSeasonSignature` (viktad slumpning med Norrbotten/skandal-boosts), `createSeasonSignature`, `recordSignatureFact`, `summarizeSignature`, `getSignatureEmoji`, `getSignatureName`.
- [x] **C3 seasonSignatureReveal.ts** — Svensk text för alla 5 icke-lugna signaturer. Kopierad bokstavligt från spec.
- [x] **C4 SeasonSignatureRevealScene.tsx** — Reveal-scen med atmosfär-overlay, genre-tag, emoji, titel, undertitel, brödtext, SceneCTA.
- [x] **C5 SeasonSignatureSecondary.tsx** — Portal-kort med `gridColumn: 'span 2'`, per-signatur vänsterstipe, faktarad.
- [x] **C6 SaveGame.ts utökning** — `currentSeasonSignature`, `pastSeasonSignatures`, `shownSeasonSignatureRevealSeason`.
- [x] **C7 Scene.ts utökning** — `'season_signature_reveal'` i SceneId.
- [x] **C8 sceneTriggerService.ts** — `shouldTriggerSeasonSignature` (matchday 1, icke-calm, ej visad denna säsong).
- [x] **C9 SceneScreen.tsx** — Case för `season_signature_reveal`.
- [x] **C10 gameFlowActions.ts** — `completeScene` sätter `shownSeasonSignatureRevealSeason` för säsongsspecifik one-shot.
- [x] **C11 weatherService.ts** — `-3°C` temperatursänkning vid `cold_winter`.
- [x] **C12 scandalService.ts** — `scandalFrequencyMultiplier` applicerat.
- [x] **C13 playerStateProcessor.ts** — `midSeasonInjuryMultiplier` på matchday 8-15.
- [x] **C14 seasonSummaryService.ts + SeasonSummary.ts** — `signatureRubric` genereras via `summarizeSignature`.
- [x] **C15 SeasonSummaryScreen.tsx** — Rubrik-block renderas (leather-bg, accent-stripe, Georgia 16px).
- [x] **C16 initCardBag.ts** — `season_signature_card` (weight 40, secondary, trigger = sig ≠ calm_season).
- [x] **C17 seasonEndProcessor.ts** — Ny signatur skapas för nästa säsong, aktuell → `pastSeasonSignatures`.
- [x] **C18 createNewGame.ts** — Initial signatur skapas vid första säsongsstart.
- [x] **C19 15 unit-tester** — Alla 6 summary-texter, viktning, fakta-loggning, edge cases.

---

## Pixel-jämförelse: SeasonSignatureRevealScene.tsx

Jämfört mot `saesongssignatur_mockup.html`.

| Element | Mock | Impl | Status |
|---|---|---|---|
| Background | `var(--bg-scene-deep)` | `var(--bg-scene-deep)` | ✓ |
| Atmosfär cold | `rgba(74,102,128,0.10) + rgba(74,102,128,0.08)` | Exakt match | ✓ |
| Atmosfär scandal | `rgba(160,72,72,0.08)` | Exakt match | ✓ |
| Atmosfär transfer | `rgba(212,164,96,0.10)` | Exakt match | ✓ |
| Atmosfär injury | `rgba(184,136,76,0.06)` | Exakt match | ✓ |
| Atmosfär dream | `rgba(212,164,96,0.12) + rgba(184,136,76,0.08)` | Exakt match | ✓ |
| Genre-tag padding | `28px 0 8px` | `'28px 0 8px'` | ✓ |
| Genre-tag fontSize | 9px | 9 | ✓ |
| Genre-tag letterSpacing | 4px | 4 | ✓ |
| Emoji fontSize | 64px | 64 | ✓ |
| Emoji padding | `24px 0 12px` | `'24px 0 12px'` | ✓ |
| Emoji filter | `drop-shadow(0 0 18px rgba(212,164,96,0.18))` | Exakt | ✓ |
| Title Georgia | 26px 800 | 26, fontWeight 800 | ✓ |
| Title letterSpacing | 4px | 4 | ✓ |
| Subtitle fontSize | 14px italic | 14, italic | ✓ |
| Subtitle padding | `0 32px 24px` | `'0 32px 24px'` | ✓ |
| Body lineHeight | 1.7 | 1.7 | ✓ |
| CTA wrapper padding | `16px 20px 28px` | `'16px 20px 28px'` | ✓ |

**Inga avvikelser.**

---

## Pixel-jämförelse: SeasonSignatureSecondary.tsx

| Element | Mock | Impl | Status |
|---|---|---|---|
| gridColumn | `span 2` | `'span 2'` | ✓ |
| Background | `var(--bg-surface)` (portal) | `var(--bg-portal-surface)` | ✓ (portal-kontext) |
| Border | `1px solid var(--border)` | `1px solid var(--border)` | ✓ |
| cold stripe | `2px solid var(--cold)` | `2px solid var(--cold)` | ✓ |
| scandal stripe | `2px solid var(--danger)` | `2px solid var(--danger)` | ✓ |
| transfer stripe | `2px solid var(--gold)` | `2px solid var(--gold)` | ✓ |
| injury stripe | `2px solid var(--warm)` | `2px solid var(--warm)` | ✓ |
| dream stripe | `2px solid var(--accent-glow)` | `2px solid var(--accent-glow)` | ✓ |
| Name Georgia | 12px 600 uppercase letterSpacing 2 | Exakt | ✓ |
| Emoji fontSize | 16px | 16 | ✓ |
| Tag fontSize | 8px 700 uppercase | Exakt | ✓ |
| Fact fontSize | 10.5px italic | Exakt | ✓ |

**Inga avvikelser.**

---

## Pixel-jämförelse: SeasonSummaryRubric

| Element | Mock | Impl | Status |
|---|---|---|---|
| Background | `var(--bg-leather)` | `var(--bg-leather)` | ✓ |
| Border-left | `3px solid var(--accent)` | Exakt | ✓ |
| Padding | `16px 18px` | Exakt | ✓ |
| BorderRadius | `0 6px 6px 0` | Exakt | ✓ |
| Emoji fontSize | 22px | 22 | ✓ |
| Text Georgia | 16px lineHeight 1.4 | Exakt | ✓ |
| Accent spans | `var(--accent)` fontWeight 700 | ✓ |

---

## Kod-verifiering

- Build: ✅ 2.0s clean
- Tester: ✅ 2603/2603 (inkl 15 nya för seasonSignatureService)
- Hårdkodade hex: Inga (rgba-värden i gradients är spec-givna)
- Filstorlekar: Alla under 150 rader (SeasonSignature.ts ~75, seasonSignatureService ~140, scene ~130, portal card ~85)

---

## Kvarstående

- Rumor/transfer-multiplier (rumorFrequencyMultiplier, incomingBidMultiplier) saknar integration — `rumorService.ts` och `transferService.ts` påverkar ej dessa ännu
- matchEngine underdogBoost (dream_round) ej applicerat i matchEngine
- Playtest: säsongssignatur-reveal ej verifierad i live-spel
