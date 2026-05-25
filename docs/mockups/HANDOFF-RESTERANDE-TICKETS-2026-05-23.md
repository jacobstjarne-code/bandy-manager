# HANDOFF — Återstående tickets (D-ST1, C-SP5, audit-fix-paket)

**Från:** Design-Claude
**Datum:** 2026-05-23

Tre mindre tickets samlade i ett dokument eftersom de är väldefinierade Code-handoffs som inte kräver ny designutforskning.

---

## 1 · D-ST1 seasonalTone → design tokens

### Problem
`getSeasonalTone(currentDate)` returnerar inline hex som sätts på `document.documentElement.style` (per omg). 7 månader → 7 sett. Det betyder att tokens *muteras runtime* i CSS-variabel-systemet.

### Föreslag

**Behåll mutations-mekaniken** — den fungerar och låter färgton skifta mjukt över säsongen. Men:

1. **Lägg seasonal-tokenerna i `colors_and_type.css`** som default-värden. Idag finns de bara i koden. Det gör dem upptäckbara för andra utvecklare.

```css
:root {
  /* Seasonal tone — overridas av PortalScreen useEffect per månad */
  --bg-portal: #1a1612;
  --bg-portal-surface: #221d18;
  --bg-portal-elevated: #2a241e;
  --accent-portal: #C47A3A;
}
```

2. **Dokumentera mutations-mönstret** i `DESIGN-DECISIONS.md`:
   - Vilka tokens som muteras runtime
   - Vilken funktion som muterar dem
   - Vilka månader/faser som triggar mutation

3. **Generaliser till andra system** om behov finns:
   - `getWeatherTone()` för match-vy
   - `getEmotionalTone()` för scen-typer
   - Etablerar mönster för "designtokens som följer kontext"

### Estimat
~1h Code (dokumentation + tokens-tillägg). Inget runtime-beteende ändras.

---

## 2 · C-SP5 SM-final-uppspelets skarv

### Problem
Övergången mellan SM-final-resultat → SM-final-vinstscen (eller eliminerings-anslag) har visuell skarv. CSS/inramning bryter — spelaren ser ett "hopp" i layouten.

### Föreslag

**Diagnos kräver kod-läsning av Code för att lokalisera exakt skarv.** Min hypotes baserat på mönster:

- Scenen mountas innan SmFinalResult unmountas → dubbel-rendering en frame
- Background-token byter (LED-svart → leather → portal-mörkt) utan crossfade
- Padding/margin-värden olika mellan vyer

### Tre fixar att överväga

1. **Crossfade-transition** (300ms ease) på bakgrund mellan vyerna
2. **Padding-normalisering** — alla "övergångs-vyer" får samma container-padding
3. **Loading-overlay** — täcker skarven om den är teknisk omöjlig att eliminera

**Föreslag:** börja med (1) — om scen-bakgrund och resultat-bakgrund crossfadar mjukt kommer skarven att maskeras visuellt även om det är samma layouthopp.

### Estimat
~1h Code för crossfade. Kan behöva +30 min för padding-debug.

---

## 3 · AUDIT-FIX-PAKET (🟥/🟧 från tidigare audits)

### 🟥 BLOCK · `--gold-deep` + `--shadow-gold` saknas i tokens

R3+ Klimax-handoffen krävde dessa tokens. Idag lever de som inline-fallbacks i `stalvallen-portal.css`:

```css
.btn.btn-primary.btn-cta.btn-gold {
  background: linear-gradient(180deg, var(--gold) 0%, var(--gold-deep, #B88838) 100%);
  box-shadow: var(--shadow-gold, 0 3px 12px rgba(232, 185, 92, 0.32));
}
```

**Fix:** Lägg till i `colors_and_type.css`:
```css
--gold-deep: #B88838;
--shadow-gold: 0 3px 12px rgba(232, 185, 92, 0.32);
```

Behåll fallbacks i CSS som säkerhetslinje. **~5 min.**

### 🟥 BLOCK · SMFinalPrimary använder fel guld

`SMFinalPrimary.tsx` använder `var(--match-gold)` (#D4B860, match-paletten) istället för `var(--gold)` (#E8B95C, ceremoniellt). Två olika guld på samma skärm.

**Fix:** Byt till `var(--gold)` + använd `.primary-card.primary-weight-3`-klassen som finns i `stalvallen-portal.css`. Inline-styles i SMFinalPrimary tas bort. **~1h.**

### 🟧 WARN · Klubbminne CSS-extraktion + severity

5 ClubMemory-komponenter har inline-styles + hardcoded `rgba(184, 136, 76, ...)` som inte är `--accent`. Plus alla events ser likadana ut idag (ingen severity).

**Fix:** Skapa `club-memory.css`, mappa MemoryEventType → severity-klass (scar/legendary/derby), lägg era-band ovanför events. Spec finns i `HANDOFF-KLUBBMINNE-ANNIVERSARY-2026-05-20.md` §A. **~3h.**

### 🟧 WARN · Transfers-domänen refaktor

110+ inline-style-objekt, Tailwind-hex som inte mappar till tokens, emoji-inflation. Spec finns i `AUDIT-TRANSFERS-2026-05-17.md` med prioriterad åtgärdslista (15 punkter).

**Föreslag uppdelning:**
- **Sprint 1** (block): Token-fix (rgba green/red → success/danger), `transfers.css`-extraktion, emoji-cleanup. ~4.5h.
- **Sprint 2** (warn): card-sharp/round-konsekvens, SectionLabel emoji, modal-radius. ~1.5h.

### 🟧 WARN · SimSummaryScreen Tailwind-rgba → tokens

*Hittad under score-spårets yta-genomgång 2026-05-23 (Jacob). Hör hit, inte till
score-spåret — det är samma klass av token-bugg som transfers Sprint 1.*

`SimSummaryScreen` använder hardkodade Tailwind-rgba: `rgba(34,197,94,0.12)`
(grön) och `rgba(239,68,68,0.12)` (röd) — ska vara `--success` / `--danger`.
**Fix:** ersätt med token-referenser. Oberoende av score-system-spåret och av
transfers-refaktorn; kan landa när som helst. **~15 min.**

### Total estimat audit-fix-paket
~10h Code spridda. Inkrementellt — varje fix kan landa separat utan beroenden.

---

## Prioritetsförslag

1. 🟥 Gold-tokens (5 min) — minimi-fix, blockerar inget förrän SMFinalPrimary refaktoreras
2. 🟥 SMFinalPrimary (1h) — synlig visuell inkonsekvens på SM-Final-skärm
3. C-SP5 crossfade (1h) — Jacob märker det vid playtest
4. D-ST1 tokens-dokumentation (1h) — arkitektur-hygien
5. 🟧 Klubbminne CSS-refaktor (3h) — när R5 anniversary wires
6. 🟧 Transfers Sprint 1 (4.5h) — när transfer-flödet får fokus

— Design-Claude, 2026-05-23
