# Steg 2D — Section-label normalisering → .h-label — Audit 2026-05-05

Ref: `docs/diagnos/2026-05-05_design_krockar.md § DIAGNOS F1`
Spec: `.h-label` = 8px / 600 / 2px letter-spacing / uppercase / `var(--text-muted)` / `var(--font-body)`

---

## MatchResultScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 107 | "Omgång X / Kvartsfinal…" `<span>` | Section-label (rundetitel) | Inline-fix: 9→8px, 700→600, 1.5px→2px |
| 180 | Result pill (SEGER/FÖRLUST) | Kategori 3 — pill/badge | Bevarat |
| 200 | "Nyckelmoment" `<p>` | Section-label | → `.h-label`, marginBottom 8 |

## SeasonSummaryScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 191 | "ÅRSBOK" `<p>` | Skärm-rubrik (11px/3px/ovan logo) | Bevarat |
| 213 | "plats" `<p>` | Stat sub-label under stor siffra | Bevarat |
| 808 | `{title}` i AwardCard `<span>` | Section-label (pris-rubrik) | Inline-fix: 9→8px, 700→600, 0.8px→2px |

## TabellScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 81 | Flikknapp-text | Kategori 4 — knapp-styling | Bevarat |

## GameOverScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 84 | "Spelets slut" `<p>` | Skärm-rubrik (11px/3px/danger) | Bevarat |
| 97 | `h1` "DU HAR SPARKATS" | h1 heading | Bevarat |
| 115 | "Styrelsens uttalande" `<p>` | Section-label, danger color | → `.h-label`, override `color: var(--danger)`, marginBottom 8 |
| 128 | "Din karriär" `<p>` | Section-label | → `.h-label`, marginBottom 12 |
| 134 | "Säsonger" `<p>` | Stat sub-label under siffra | Bevarat |
| 138 | "Bästa plats" `<p>` | Stat sub-label | Bevarat |
| 142 | "Totala vinster" `<p>` | Stat sub-label | Bevarat |
| 158 | Knapp `STARTA NYTT SPEL` | Kategori 4 — knapp | Bevarat |

## InboxScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 158 | Coach-tone sender label `<span>` | Per-item metadata, ej group-separator | Bevarat |
| 326 | Kategori-separator `<span>` | Section-label (sticky group header) | Inline-fix: 10→8px, 700→600, 1.5px→2px (color: meta.color bevarat) |

## PlayoffIntroScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 49 | "⚔️ SLUTSPEL" | Section-label, 3px→2px fix | → `.h-label`, marginBottom 12 |
| 69 | "PLACERING" | Section-label (sub-label under siffra) | → `.h-label`, margin: '2px 0 0' |
| 102 | "📊 TOPP 8 — SLUTSPELSKLARA" | Section-label, redan korrekt | → `.h-label`, marginBottom 6 (kod-simplifiering) |
| 107 | `<tr>` table header | Tabellkolumn-header | Inline-fix: letterSpacing 0.5px→2px |
| 138 | "🏒 KVARTSFINALER — BÄST AV 5" | Section-label, redan korrekt | → `.h-label`, marginBottom 8 (kod-simplifiering) |
| 191 | CTA-knapp | Kategori 4 — knapp | Bevarat |

## ChampionScreen.tsx

| Rad | Text | Klassificering | Åtgärd |
|-----|------|----------------|--------|
| 120 | `h1` "Svenska Mästare!" | Skärm-rubrik (28px) | Bevarat |
| 163 | "SLUTSPELSRESA" `<p>` | Section-label | → `.h-label`, marginBottom 12 |
| 209 | Knapp "Nästa säsong" | Kategori 4 — knapp | Bevarat |

---

## Totalt åtgärdat: 12 ändringar i 7 filer

**5 inline-fixar** (spans och tr):
- MatchResultScreen:107, SeasonSummaryScreen:808, InboxScreen:326
- PlayoffIntroScreen:107 (tr letterSpacing)
- MatchResultScreen:107 span

**7 p → `.h-label`-konverteringar:**
- MatchResultScreen:200, GameOverScreen:115+128, ChampionScreen:163
- PlayoffIntroScreen:49+102+138

**Bevarade skärm-rubriker (medveten avvikelse):**
- SeasonSummaryScreen:191 "ÅRSBOK" (11px/3px — dramaturgi)
- GameOverScreen:84 "Spelets slut" (11px/3px/danger — dramaturgi)
- ChampionScreen:120 h1 "Svenska Mästare!" (h1)

**Bevarade stat sub-labels (inte group-separators):**
- SeasonSummaryScreen:213 "plats", GameOverScreen:134/138/142 stat-labels

---

## Verifiering

```
npm run build → rent (0 fel), 2.98s
```

## Kvarstående (utanför spec)

- DIAGNOS F2: Saknat emoji-prefix på labels — väntar Opus text-design-pass
- QFSummaryScreen.tsx:38 (3px→2px fix) — liknande mönster som PlayoffIntroScreen:49, adresseras i nästa pass
- HalfTimeSummaryScreen + RoundSummaryScreen labels — ej i spec, oklassificerade
- GameOverScreen:158 + ChampionScreen:209 knapp-normalisering — väntar btn-audit

## Visuell verifiering

Awaiting browser-playtest. Förväntad förändring: aningen mindre och stramare labels på MatchResult, Inbox kategori-headers, GameOver och Champion-skärmar.
