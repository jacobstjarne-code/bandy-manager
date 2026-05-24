# CODE_INSTRUCTION — SCOREBOARD V1 + SLUTSKÄRM INLINE 2026-05-13

Två separata FIX:ar efter mock-godkännande. Båda har bekräftad layout-referens på disk.

---

## FIX-47 — Scoreboard layout V1 (klocka mitten)

**Mock-referens:** `docs/match-live-bundle/scoreboard-stalvallen-v2-clock-bredvid.html` — kolumn **V1**

**Vad det är:** Klocka och mål bredvid varandra i `module-main`. Hemmalag vänster (lg score), klocka i mitten (period-mark ovanför, klocka md under, vertikala border-pinnar på sidorna), bortalag höger (lg score). Sparar ~35px höjd jämfört med dagens vertikalt stackade layout.

**Var:** `ScoreboardStalvallen.tsx` + tillhörande CSS i `stalvallen-match.css`.

**Layout-spec (HTML-struktur):**

```html
<div class="module-main">
  <div class="main-row">
    <div class="team-col home">
      <span class="team-code">FOR</span>
      <ScoreSegments score={homeScore} size="lg" />
    </div>
    <div class="clock-block">
      <span class="period-mark">HL2</span>
      <TimeSegments time={displayedMinute} size="md" />
    </div>
    <div class="team-col away">
      <span class="team-code">SÖD</span>
      <ScoreSegments score={awayScore} size="lg" />
    </div>
  </div>
</div>
```

**CSS:**

```css
.module-main .main-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  position: relative;
}
.module-main .team-col { text-align: center; }
.module-main .team-col.home { text-align: right; }
.module-main .team-col.away { text-align: left; }
.module-main .team-code {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 3px;
  color: rgba(255, 200, 180, 0.45);
  margin-bottom: 6px;
  text-shadow: 0 0 4px rgba(255, 80, 60, 0.2);
}
.module-main .clock-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}
.module-main .period-mark {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2.5px;
  color: rgba(255, 200, 180, 0.55);
  text-shadow: 0 0 4px rgba(255, 80, 60, 0.25);
}
```

**Datakontrakt orörd** — samma props som idag.

**Acceptanskriterier:**
- Pixel-audit mot mockens V1-kolumn vid 380px
- Module-main-höjden minskar ~35px (mät i DevTools)
- Module-text/line/pen OFÖRÄNDRADE
- NU-prick mellan scores TAS BORT — ersätts av klockan i mitten

---

## FIX-48 — Slutskärm inline i commentary feed (revert overlay)

**Mock-referens:** `docs/match-live-bundle/slutskarm-inline-v2.html` — kolumn **V1**

**Vad det är:** Slut-state visas som första rad i commentary-feeden, INTE som separat overlay. Pappersfärgad rad med FT-pill, resultat, kort sammanfattning, "Se sammanfattning →"-knapp.

**Var:**
- `CommentaryFeedStalvallen.tsx` (lägg till slut-rad)
- `MatchLiveScreen.tsx` (ta bort MatchReportView-overlay)

**Vad ska tas bort:**

1. Hela `{matchDone && !isSmFinal && !isCupFinal && ...}`-blocket från FIX-33 i MatchLiveScreen
2. MatchReportView som overlay (inga absolut-positionerade element, inget z:10)
3. Konstigt svart fält försvinner som följd

**Vad ska läggas till:**

I `CommentaryFeedStalvallen.tsx`, när `matchDone === true`:
- Render `<FeedEndRow />` som FÖRSTA element i feeden, ovanför alla `.row`

```tsx
function FeedEndRow({ result, summary, arenaMeta, onSeeSummary }) {
  return (
    <div className="feed-end-row">
      <div className="end-head">
        <span className="ft-pill">SLUT</span>
        <span className="end-meta">{arenaMeta}</span>
      </div>
      <div className="end-score"><strong>{result}</strong></div>
      <div className="end-summary">{summary}</div>
      <button className="end-cta" onClick={onSeeSummary}>
        Se sammanfattning →
      </button>
    </div>
  )
}
```

**CSS:**

```css
.feed-end-row {
  padding: 16px;
  background: linear-gradient(180deg, var(--paper-warm), var(--paper-cream, #FBF7F0));
  border-bottom: 2px solid var(--copper-deep);
  color: var(--ink);
}
.feed-end-row .end-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.feed-end-row .ft-pill {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px;
  padding: 2px 7px;
  background: var(--bg-dark, #0E0D0B); color: var(--paper-warm);
  border-radius: 2px;
}
.feed-end-row .end-meta {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1.5px;
  color: var(--ink-mute);
  text-transform: uppercase;
}
.feed-end-row .end-score {
  font-family: var(--font-display); font-size: 17px; line-height: 1.3;
  color: var(--ink);
  margin-bottom: 6px;
}
.feed-end-row .end-score strong { font-weight: 600; }
.feed-end-row .end-summary {
  font-family: var(--font-display); font-size: 13.5px; line-height: 1.6;
  color: var(--ink-soft);
  margin-bottom: 12px;
}
.feed-end-row .end-cta {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--font-body); font-size: 12px; font-weight: 600;
  padding: 7px 12px;
  background: var(--copper); color: var(--paper-warm);
  border-radius: 4px; border: none; cursor: pointer;
  letter-spacing: 0.3px;
}
.feed-end-row .end-cta:hover { background: var(--copper-deep); }
```

**Datakontrakt:**

- **`result`** (string): `"Forsbacka 9 — 8 Skutskär"` — fullständiga namn, em-dash
- **`summary`** (string): 1-2 meningar via `generateMatchStory(...)` (befintlig hjälpfunktion från FIX-33 — flytta från MatchReportView till en utility-modul)
- **`arenaMeta`** (string): `"SCHAKTVALLEN · OMG. 2"` (arena + omgång, INGEN åskådartal)
- **`onSeeSummary`** (function): navigerar till `/game/review`
- **`matchDone`** (boolean): triggar FeedEndRow-render

**Vad som flyttar till Granska:**

Allt detaljerat innehåll från FIX-33 flyttas till Granska där det hör hemma — events-lista, spelarbetyg-strip, POTM-rad, hörn-band, ratings-foot, åskådartal. Granska-vyn finns redan; lägg till dessa sektioner där om de inte redan är där. Inte en del av denna FIX, bara säkerställ att de inte försvinner helt.

**Acceptanskriterier:**
- Pixel-audit mot V1-kolumn (slutskarm-inline-v2.html) vid 380px
- Inget svart tomt fält
- Slut-rad är FÖRSTA i feeden, sen vanliga rader
- CTA navigerar till Granska
- 0-0-test fungerar (defensiv-summary via generateMatchStory)

**Race-condition från FIX-33:** Om `savedFixture?.report` saknas, visa FeedEndRow med fallback-summary `"Matchen är slut."`. CTA fungerar oavsett.

---

## COMMIT-STRATEGI

1. **Commit 1:** FIX-47 (scoreboard V1 — klocka mitten)
2. **Commit 2:** FIX-48 (slutskärm inline — revert overlay + ny FeedEndRow)

Båda fristående. FIX-47 är CSS-heavy, FIX-48 är revert + ny komponent.

---

## KRITISKA INSTRUKTIONER

**Mekaniken är ORÖRD.** Bara presentation.

**Pixel-audit krävs.** Öppna mocken i Chrome DevTools vid 380px sida vid sida med build.

**Rapportera per FIX med ✅ / ⚠️ / ❌ + en mening.** För FIX-48: säg var generateMatchStory() flyttades.

**Behåll race-condition-skydd.** Spelet får aldrig fastna efter en match.
