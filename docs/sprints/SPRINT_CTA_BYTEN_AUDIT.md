# Steg 2B — Inline CTA → .btn .btn-primary — Audit 2026-05-05

Ref: `docs/diagnos/2026-05-05_design_krockar.md § DIAGNOS D1`

---

## 11 filer åtgärdade

| Fil | Typ | Åtgärd |
|-----|-----|--------|
| `screens/RoundSummaryScreen.tsx` | Ceremonial (post-match) | `btn btn-primary` + `letterSpacing/uppercase` bevarad |
| `screens/HalfTimeSummaryScreen.tsx` | Ceremonial (halvtid) | `btn btn-primary` + `letterSpacing/uppercase` + `pointerEvents: 'auto'` bevarad |
| `screens/QFSummaryScreen.tsx` | Ceremonial (slutspel) | `btn btn-primary` + `letterSpacing/uppercase` bevarad |
| `screens/PlayoffIntroScreen.tsx` | Ceremonial (slutspel) | `btn btn-primary` + `letterSpacing/uppercase` bevarad |
| `components/match/CommentaryFeed.tsx` | Standard | `btn btn-primary` + `margin: '8px 0'` bevarad |
| `components/portal/primary/PatronDemandPrimary.tsx` | Standard | `btn btn-primary` + `marginTop: 12` bevarad |
| `components/portal/primary/TransferDeadlinePrimary.tsx` | Standard | `btn btn-primary` + `marginTop: 12` bevarad |
| `components/portal/primary/SMFinalPrimary.tsx` | Standard | `btn btn-primary` + `marginTop: 12` bevarad |
| `components/portal/primary/DerbyPrimary.tsx` | Standard | `btn btn-primary` + `marginTop: 12` bevarad |
| `components/clubselection/ClubExpandedCard.tsx` | Standard | `btn btn-primary` + `marginTop: 8` bevarad |
| `screens/IntroSequence.tsx` | Standard + animation | `btn btn-primary` + `maxWidth: 300` + pulse-animation-props bevarade |

## Undantag — kvarstående texture-leather

`components/dashboard/NextMatchCard.tsx:231` — `texture-leather` på leather header bar (div, inte knapp). Intentionell textur-användning, inte CTA. Utanför scope.

## Verifieringsgrep

```
grep -rn "linear-gradient(135deg, var(--accent-dark)" src/presentation/ --include="*.tsx"
→ 0 träffar
```

## Build

```
npm run build → rent (0 fel), 3.20s
```

## Visuell verifiering

Awaiting browser-playtest. Alla .btn.btn-primary-byten är semantiskt identiska med ursprungliga inline-gradienter — `.btn-primary` har samma koppar-DNA via CSS-klassen.
