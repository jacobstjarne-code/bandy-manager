# CODE-FIX — Systempatch B-brott B2 · B7 · B8 (2026-06-20)

**Källa:** `design-system/DESIGN-DECISIONS.md § Systempatch 2026-06-11` (B1–B8, ratificerade, bindande).
**Bakgrund:** B-besluten stämdes av as-built mot källan 2026-06-20 (BACKLOG § "SYSTEMPATCH 2026-06-11"). Tre rena/genuina avvikelser, alla isolerade, alla Code-lane. Detta är ordern.

Verifiera efter varje fix (en fil i taget, bocka av före nästa). Gates: typecheck + befintliga tester gröna.

---

## B2 — Overlays: scrim, aldrig blur

**Regel (B2):** *"Beats använder rgba(0,0,0,0.6)-scrim — `backdrop-filter` tas bort. No-blur-regeln gäller överallt, utan undantag."*

**Fil:** `src/styles/global.css` → `.anslag-overlay` (fas-anslag, cup).

**Nuläge (brutet):**
```css
.anslag-overlay {
  position: fixed;
  inset: 0;
  background: rgba(14, 13, 11, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  ...
}
```

**Ändring:**
1. Ta bort `backdrop-filter: blur(8px);`
2. Ta bort `-webkit-backdrop-filter: blur(8px);`
3. Höj scrim: `background: rgba(14, 13, 11, 0.2)` → `rgba(14, 13, 11, 0.6)`.

> Hue-not: behåll den varma nästan-svarta (`14,13,11`) — den är tonalt konsekvent med scen-paletten. B2:s decision-text skriver `rgba(0,0,0,0.6)` bokstavligt; den varma 0.6-varianten honorerar regeln (no-blur + ~0,6 scrim) utan att introducera en kall svart i en varm yta. Om Design vill ha exakt `0,0,0` är det en trivial efterjustering.

**Verifiering:** öppna ett fas-anslag/cup-anslag → ingen oskärpa bakom kortet, mörkare scrim. Inget annat överlapp rört.

**Svep-flagga (ej blockerande):** kör en repo-grep `backdrop-filter` och bekräfta att `.anslag-overlay` var enda kvarvarande träffen. `.match-modal-overlay` och `.arrival-scrim` är redan rena (verifierat). Rapportera om grep hittar fler.

---

## B7 — Knappar är alltid sans

**Regel (B7):** *"Georgia förblir numeraler/ceremoniellt/citat. Knappar — inklusive lägesknappar (Bygg/Håll/Toppa/Vila) — är `--font-body`."*

**Fil:** `src/presentation/components/squad/SeasonArcCard.tsx` → läges-dialen (Bygg/Håll/Toppa/Vila-knapparna).

**Nuläge (brutet):** dial-knappens etikett renderas i Georgia:
```jsx
<div style={{
  fontFamily: 'var(--font-display)',
  fontSize: 14,
  fontWeight: 700,
  color: m === mode ? 'var(--accent-dark)' : 'var(--text-primary)',
}}>
  {MODE_LABELS[m]}
</div>
```

**Ändring:** `fontFamily: 'var(--font-display)'` → `fontFamily: 'var(--font-body)'` på exakt denna rad (MODE_LABELS-renderingen inuti dial-knappen).

Inget annat. `fontWeight: 700` + `fontSize: 14` står kvar.

**Verifiering:** Säsongsbåge-kortet → de fyra lägesknapparna i sans, inte Georgia. (Kontroll-positivt: TacticBoardCard SPELSTIL + PlayerCard seg-nav är redan `--font-body`, så detta var enda avvikaren.)

---

## B8 — Disabled-state: en mekanism

**Regel (B8):** *"Disabled-knapp = ordinarie utseende @ `--disabled-opacity` (0.4) + `pointer-events: none`. Samma färgfamilj, ALDRIG en egen 'urtvättad' färg."* + Delad-primitiv #6: *"Disabled-state — B8-mekanismen i `.btn`-basen."*

**Fil:** `src/presentation/components/PlayerCard.tsx` → Ledarskap-panelen (4 knappar) + Prata-panelen (3 knappar).

**Nuläge (brutet):** inline-stylade knappar (ej `.btn`) tvättar bakgrund OCH färg för disabled, plus fel opacity:
```jsx
// Ledarskap (canLeadership(opt.id) → avail):
style={{
  padding: '9px 8px', borderRadius: 8,
  background: avail ? 'var(--bg-elevated)' : 'rgba(0,0,0,0.04)',   // ← urtvättad bg, förbjuden
  border: '1px solid var(--border)',
  fontSize: 11, color: avail ? 'var(--text-primary)' : 'var(--text-muted)',  // ← urtvättad färg, förbjuden
  cursor: avail ? 'pointer' : 'not-allowed',
  fontFamily: 'var(--font-body)',
  opacity: avail ? 1 : 0.5,   // ← 0.5, ska vara --disabled-opacity (0.4)
}}
// Prata-panelen: identiskt mönster med canTalk istället för avail.
```

**Ändring (primär — minimal, B8-trogen, ingen layoutförändring):** disabled = SAMMA utseende @ 0.4 + pointer-events:none. Sluta tvätta bg/färg. På båda knappgrupperna (Ledarskap ×4, Prata ×3):

```jsx
style={{
  padding: '9px 8px', borderRadius: 8,
  background: 'var(--bg-elevated)',                 // alltid — ingen tvätt
  border: '1px solid var(--border)',
  fontSize: 11, color: 'var(--text-primary)',       // alltid — ingen tvätt
  fontFamily: 'var(--font-body)',
  opacity: avail ? 1 : 'var(--disabled-opacity)',   // 0.4 via token
  cursor: avail ? 'pointer' : 'not-allowed',
  pointerEvents: avail ? undefined : 'none',
}}
```
(Prata: byt `avail` → `canTalk`. Översikt-knapparna "🗣 Prata"/"👑 Ledarskap" har ingen disabled-logik — rör dem ej här.)

**Alternativ (purist, delad-primitiv #6):** ge de sju knapparna `className="btn"` och låt `.btn:disabled` bära mekaniken (drop all inline opacity/bg/color-tvätt). OBS: `.btn` bär box-shadow + hover-lift som dessa platta knappar saknar idag → **visuell förändring utöver B8:s scope.** Ta bara den vägen om Design uttryckligen vill att knapparna ska få `.btn`-affordansen; annars kör primär-fixen.

**Verifiering:** öppna ett spelarkort → Ledarskap/Prata. En åtgärd på cooldown ska se ut som de aktiva (samma bg/färg) fast nedtonad till 0.4 och ej klickbar — inte en egen grå-tvättad knapp.

> Not: emoji på dessa knappar (🎓😮‍💨🤫📣 / 😊💪 / 🗣👑) hör INTE till denna order — det är den pågående emoji→Lucide-svepen (PlayerCard = kvarvarande yta efter InboxScreen i D3). Rör inte emoji här.

---

## Gate (hela ordern)
- En fil i taget, verifiera per fix.
- Typecheck + befintliga tester gröna efter varje.
- Rapportera commit-hash + vad som ändrades per B-punkt. B2:s grep-resultat rapporteras separat.
