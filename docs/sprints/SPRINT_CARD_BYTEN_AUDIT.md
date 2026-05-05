# Steg 2C — Inline borderRadius på kort → .card-sharp — Audit 2026-05-05

Ref: `docs/diagnos/2026-05-05_design_krockar.md § DIAGNOS E1`

---

## Klassificering per rad

### SquadScreen.tsx (7 ställen)

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 381 | 5 — Color-tinted info-box (rgba(196,122,58,0.08)) | Bevarat |
| 442 | 4 — Tab-switch-knapp (segmented control) | Bevarat |
| 466 | 5 — Color-tinted warning (rgba(239,68,68,0.08)) | Bevarat |
| 498 | **1 — Data-kort** (`bg-surface` + `border-var` + br:8) | → `card-sharp`, behöll `padding: '8px 10px'` + cursor |
| 559 | **1 — Data-kort** (`bg-surface` + `border-var` + br:6) | → `card-sharp`, behöll padding/marginBottom/layout |
| 604 | 4 — Modal overlay (`bg` + boxShadow) | Bevarat |
| 635 | 5 — Color-tinted (dynamic `meta.color` border) | Bevarat |

### GameOverScreen.tsx (5 ställen)

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 58 | 5 — Screen container (rgba danger border) | Bevarat |
| 68 | — `borderRadius: '50%'` (ikon-cirkel) | Bevarat |
| 110 | 5 — Color-tinted (rgba danger bakgrund) | Bevarat |
| 127 | **1 — Data-kort** (`bg-elevated` + `border-var` + br:10) | → `card-sharp`, behöll `padding: '10px 14px'` + marginBottom |
| 158 | 4 — Knapp (`STARTA NYTT SPEL` — väntar btn-audit) | Bevarat |

### ChampionScreen.tsx (3 ställen)

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 36 | 3 — Pip/badge (borderRadius: 2) | Bevarat |
| 161 | **1 — Data-kort** (`bg-surface` + `border-var` + br:12) | → `card-sharp`, behöll `padding: '16px'` + marginBottom + textAlign |
| 209 | 4 — Knapp (`Nästa säsong`) | Bevarat |

### SeasonSummaryScreen.tsx (9 relevanta ställen)

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 236 | 3 — Pill (br:99) | Bevarat |
| 253 | — Progressbar-ände (`0 6px 6px 0`) | Bevarat |
| 287 | 5 — Specialkort (gradient + accent-border) | Bevarat |
| 298 | 3 — Pill-label (br:20) | Bevarat |
| 342 | 3 — Badge (br:4) | Bevarat |
| 628 | 5 — Color-tinted (rgba accent) | Bevarat |
| 649,654 | — Progressbar-segment (br:3) | Bevarat |
| 757,767,779 | 4 — Knappar | Bevarat |
| 803 | 5 — Color-tinted `AwardCard` (rgba accent) | Bevarat |

### MatchResultScreen.tsx (4 relevanta ställen)

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 181 | 3 — Pill (br:20) | Bevarat |
| 236 | 5 — Color-tinted POTM-box (rgba accent) | Bevarat |
| 264 | 5 — Color-tinted hörnmål-box (rgba accent) | Bevarat |
| 298,310 | 4 — Knappar | Bevarat |

### TabellScreen.tsx (3 ställen)

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 71 | 4 — Tab-switcher wrapper | Bevarat |
| 80 | 4 — Tab-switcher-knapp | Bevarat |
| 199 | 3 — Badge (br:6) | Bevarat |

### GranskaOversikt.tsx

| Rad | Kategori | Åtgärd |
|-----|----------|--------|
| 68 | 3 — Pill-badge (br:20) | Bevarat |
| 93,102 | 5 — Info-panel (`bg-elevated` + `var(--radius-sm)`) | Bevarat — liten info-panel, inte sektionskort |
| 130 | — Mini-progressbar (br:2) | Bevarat |
| 167,168 | 3 — Player/club chip (br:20) | Bevarat |
| 174,220,255 | 4 — Valknapp-rader | Bevarat |
| 295 | 5 — Color-tinted tip-box (rgba accent) | Bevarat |

---

## Totalt åtgärdat: 4 Kategori 1-kort

1. `SquadScreen.tsx:498` — statsekortens spelarslots
2. `SquadScreen.tsx:559` — låneavtals-lista
3. `GameOverScreen.tsx:127` — "Din karriär" statistikkort
4. `ChampionScreen.tsx:161` — "SLUTSPELSRESA" kort

## Kvarstående Kategori 4-knappar (väntar btn-audit)

Dessa knappar saknar `.btn`-klass men är utanför Steg 2C scope:
- `GameOverScreen.tsx:158` — `STARTA NYTT SPEL`
- `ChampionScreen.tsx:209` — `Nästa säsong →`
- `SeasonSummaryScreen.tsx:757,767,779` — diverse navigeringsknappar

## Verifiering

```
npm run build → rent (0 fel), 3.01s
```

## Visuell verifiering

Awaiting browser-playtest. `.card-sharp` på de 4 bytta korten är semantiskt harmoniserade — background, border och radius hanteras av klassen istället för inline.

Notera: GameOverScreen:127 byter `var(--bg-elevated)` (#FFF) → `var(--bg-surface)` (#FAF8F4) — subtil warm-tint, intentionell harmonisering.
