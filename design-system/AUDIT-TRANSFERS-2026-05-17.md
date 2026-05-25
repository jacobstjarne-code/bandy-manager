# AUDIT — Transfers-domänen

**Datum:** 2026-05-17
**Audit-typ:** System-level konsistens-audit (kodläsning — kontextuell rendering inte verifierad)
**Avgränsning:** Hela `/game/transfers`-flödet — huvudskärm + 5 tabs + 3 modaler.
**Filer auditerade:**
- `src/presentation/screens/TransfersScreen.tsx` (554 rader, 5 tabs)
- `src/presentation/components/transfers/TransferPlayerCard.tsx` (80)
- `src/presentation/components/transfers/ActiveBidsList.tsx` (359, hela Scouting-fliken)
- `src/presentation/components/transfers/FreeAgentList.tsx` (46)
- `src/presentation/components/transfers/RenewContractModal.tsx` (98)
- `src/presentation/components/transfers/BidModal.tsx` (91)
- `src/presentation/components/transfers/WageOverrunWarning.tsx` (90)

## Sammanfattning

| Severity | Antal | Innebörd |
|----------|-------|----------|
| 🟥 BLOCK   | 3   | Token-/regelbrott |
| 🟧 WARN    | 7   | Konsekvens |
| 🟨 OBSERV  | 6   | Skuld / kosmetik |
| ✅ OK      | 5   | Verifierat |
| 💎 POSITIV | 1   | WageOverrunWarning copy |

## 🟥 BLOCK
1. **Hex-värden ej tokens** — `rgba(34,197,94,…)` = Tailwind green-500, inte `--success` (#5A9A4A). Samma för `rgba(239,68,68,…)` vs `--danger`.
2. **~110 inline `style={{}}`-objekt** över 7 filer. Aldrig genomgått samma CSS-extraktion som Portal/Stalvallen.
3. **Emoji-inflation** — 🔍 / 💰-knapp / 🟢🟡🔴 / ⏳ / ✓ / ✕ är chrome-emoji, inte kategori-prefix. Spelaren möter ~15 emoji per session.

## 🟧 WARN
1. `card-sharp` vs `card-round` inkonsekvent — 6 data-listor är `card-round`, borde vara `card-sharp`.
2. SectionLabel emoji-prefix inkonsekvent (5 har, 7 saknar).
3. Form-controls inline 5× — bryt ut `.form-input`/`.form-select`.
4. `TransferPlayerCard` 3px stripe för scoutad-state — borde vara 2px (info, inte action).
5. Modal-radius `12` hardcoded — välj `--radius-md` (8) eller nytt `--radius-modal`.
6. Modal-shadow hardcoded — token `--shadow-modal` saknas.
7. `z-index` hardcoded (300/400) — borde via `var(--z-modal)` etc.

## 🟨 OBSERV
1. `flexShrink: 0` upprepas 15+ ggr.
2. Inga `:focus-visible`-states på custom-styled knappar.
3. Copy "Försäljning möjlig sommaren och vintern" kan missförstås — Opus-review.
4. Scoutbudget-raden saknar SectionLabel.
5. Outgoing bid "Väntar på svar" — ingen tidsindikering (`bid.roundsRemaining`).
6. Modal-titel-typografi inkonsekvent.

## 💎 POSITIV — bevara
**WageOverrunWarning** — 3 ordförande-citat per allvarlighetsgrad. Light/Notable/Severe. Seeded variant per säsong. Behåll oförändrad.

## Estimerat scope
~6.5h totalt: BLOCK 4.5h, WARN 1.5h, OBSERV 30 min.

*(Fullständig audit-text — per-fynd-detaljer, hierarki-audit, cross-cutting förslag, åtgärdslista med 14 rader, transfers.css-strukturförslag — i original-leverans från Claude Design 2026-05-17.)*
