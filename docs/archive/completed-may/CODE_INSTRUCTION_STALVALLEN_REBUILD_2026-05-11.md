# CODE — Stålvallen scoreboard + commentary REBUILD

**Datum:** 2026-05-11
**Författare:** Opus
**Status:** SPEC — delta-rapport mellan mocken och nuvarande implementation
**Källmock:** `docs/match-live-bundle/match-live-stalvallen.html` (öppna i webbläsare och referera kontinuerligt)

---

## Sammanfattning

Jacobs playtest visade att live-match-scoreboarden inte alls liknar mocken. Vid djupanalys är skillnaden inte detaljer — det är **strukturell**:

- Mocken har en **5-modul board-system** med bezel-gradient (huvud, utvisning, ledtext, tidslinje, alla wrappade i en bezel)
- Implementationen har **en flat modul** med score + ticker + timeline staplade utan bezel eller modulgränser

Plus:
- CommentaryFeedStalvallen har för svag textkontrast (atmosphere-text på 35% opacity, oläsligt på mörk bakgrund)
- MatchLiveScreen renderar dubbel score-info ("Forsba 1 - 0 Västan" plain text under scoreboarden) som inte finns i mocken
- INTENSIVT-stat-bar har ljus bakgrund som bryter Stålvallen-stilen

Detta är inte små justeringar — det är en rebuild av ScoreboardStalvallen.tsx + stalvallen-match.css mot mocken.

---

## FIX-18 · Rebuild ScoreboardStalvallen mot mocken

**Filer:**
- `src/presentation/components/match/scoreboard/ScoreboardStalvallen.tsx`
- `src/presentation/styles/stalvallen-match.css`

### Strukturen i mocken (4-5 moduler i en bezel-wrap)

```
.scoreboard-root (yttre wrapper)
└── .board-system (bezel-gradient padding 1px)
    ├── .module-main      ← Score + tid
    ├── .module-pen       ← Utvisningar (hideable)
    ├── .module-text      ← Rullande LED-text
    └── .module-line      ← Tidslinje med head + line + feet
```

### Modul 1: `.module-main` (score-modulen)

**Layout (mockens `.main-row`):**
```
[home-col: TEAMCODE + SCORE-LG]  [sep-col: sep-dot]  [away-col: TEAMCODE + SCORE-LG]
                                    grid: 1fr auto 1fr
```

**Under `.main-row` följer `.time-row`:**
```
[period-mark "HL1"]   [time-mount: 7-seg MD-storlek]
                       flex centrered, gap 10px
                       padding-top 10px, border-top 1px rgba(255,42,24,0.08)
```

**CSS-värden (kopierade från mocken):**

```css
.module-main {
  background: var(--panel);        /* #0A0908 */
  padding: 14px 16px 16px;
  position: relative;
  box-shadow: inset 0 0 0 1px var(--panel-edge);
}
.module-main::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(0deg,
    rgba(255,255,255,0.018) 0 1px,
    transparent 1px 3px
  );
}
.main-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
  position: relative;
}
.team-col { text-align: center; }
.team-col.home { text-align: right; }
.team-col.away { text-align: left; }
.team-code {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 3px;
  color: rgba(255,200,180,0.45);
  margin-bottom: 6px;
  text-shadow: 0 0 4px rgba(255,80,60,0.2);
}
.sep-col {
  display: flex;
  align-items: center;
  justify-content: center;
}
.sep-dot {
  width: 6px;
  height: 6px;
  background: var(--led-red);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--led-red-glow);
  opacity: 0.55;
}
.time-row {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,42,24,0.08);
  position: relative;
}
.period-mark {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2.5px;
  color: rgba(255,200,180,0.5);
  text-shadow: 0 0 4px rgba(255,80,60,0.2);
}
```

**Ta bort:**
- Befintlig `.scoreboard-team-home` / `.scoreboard-team-away` med flex-direction column — ersätts av `.team-col.home` / `.team-col.away` med text-align
- Befintlig `.scoreboard-center` med period-dot + clock + period-tag i kolumn — ersätts av `.sep-col` (bara sep-dot) + `.time-row` (period-mark + tid)
- `.scoreboard-period-tag-live` och `.scoreboard-period-tag-ft` — ersätts av enkla `.period-mark`-text utan badge-bakgrund

**JSX-ändringar i ScoreboardStalvallen.tsx:**

```tsx
{/* Main score module */}
<div className="module-main">
  <div className="main-row">
    {/* Home */}
    <div className="team-col home">
      <span className="team-code" style={{ color: homeColor }}>{homeCode}</span>
      <span className="team-score-mount">
        <SevenSegText
          text={String(homeScore)}
          size="lg"
          color={homeColor}
          glowColor={flashSide === 'home' ? 'rgba(255,170,0,0.7)' : undefined}
        />
      </span>
    </div>

    {/* Separator dot */}
    <div className="sep-col">
      <span className="sep-dot" />
    </div>

    {/* Away */}
    <div className="team-col away">
      <span className="team-code" style={{ color: awayColor }}>{awayCode}</span>
      <span className="team-score-mount">
        <SevenSegText
          text={String(awayScore)}
          size="lg"
          color={awayColor}
          glowColor={flashSide === 'away' ? 'rgba(255,170,0,0.7)' : undefined}
        />
      </span>
    </div>
  </div>

  {/* Time row */}
  <div className="time-row">
    <span className="period-mark">{period}</span>
    <span className="time-mount">
      <SevenSegText text={pad2(minute)} size="md" color="var(--led-red)" />
      <SevenSegColon size="md" color="var(--led-red)" />
      <SevenSegText text={pad2(second)} size="md" color="var(--led-red)" />
    </span>
  </div>
</div>
```

**Viktigt:** I mocken är klock-tiden RÖD LED, inte amber. Mocken: `var(--led-red)` (`#FF2A18`). Implementationen använder `var(--led-amber)` idag — det är fel. Korrigera till `var(--led-red)`.

---

### Modul 2: `.module-pen` (utvisnings-strip)

**Mocken har detta som EGEN modul mellan main och text-modul:**

```css
.module-pen {
  background: #07060a;
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.7);
  transition: max-height 0.4s ease, opacity 0.3s ease;
}
.module-pen.active { max-height: 26px; opacity: 1; }
.module-pen:not(.active) { max-height: 0; opacity: 0; }
.module-pen::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 3px 3px;
}
.pen-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  height: 26px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  min-width: 0;
}
.pen-slot.home { justify-content: flex-start; }
.pen-slot.away { justify-content: flex-end; }
.pen-slot.empty { opacity: 0; }
.pen-divider {
  width: 1px;
  height: 14px;
  background: rgba(255,170,0,0.15);
}
.pen-mark {
  color: var(--led-amber);
  text-shadow: 0 0 4px rgba(255,170,0,0.6);
  font-size: 9px;
  animation: penMark 1.1s ease-in-out infinite;
}
@keyframes penMark {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.pen-num {
  color: rgba(255,210,150,0.85);
  text-shadow: 0 0 3px rgba(255,170,0,0.4);
  font-weight: 700;
}
.pen-name {
  color: rgba(255,210,150,0.7);
  text-shadow: 0 0 3px rgba(255,170,0,0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pen-time {
  color: var(--led-amber);
  font-weight: 700;
  text-shadow: 0 0 4px rgba(255,170,0,0.6);
  margin-left: auto;
  padding-left: 8px;
  flex-shrink: 0;
}
```

**JSX:**

```tsx
{/* Penalty strip — always rendered, animates open/close */}
<div className={`module-pen${hasPenalties ? ' active' : ''}`}>
  <div className={`pen-slot home${homePens[0] ? '' : ' empty'}`}>
    {homePens[0] && (
      <>
        <span className="pen-mark">▲</span>
        <span className="pen-num">#{homePens[0].num}</span>
        <span className="pen-name">{homePens[0].name}</span>
        <span className="pen-time">{pad2(Math.floor(homePens[0].secondsLeft/60))}:{pad2(homePens[0].secondsLeft%60)}</span>
      </>
    )}
  </div>
  <div className="pen-divider" />
  <div className={`pen-slot away${awayPens[0] ? '' : ' empty'}`}>
    {awayPens[0] && (
      <>
        <span className="pen-mark">▲</span>
        <span className="pen-num">#{awayPens[0].num}</span>
        <span className="pen-name">{awayPens[0].name}</span>
        <span className="pen-time">{pad2(Math.floor(awayPens[0].secondsLeft/60))}:{pad2(awayPens[0].secondsLeft%60)}</span>
      </>
    )}
  </div>
</div>
```

---

### Modul 3: `.module-text` (rullande LED-textremsa)

**Helt ny modul som ersätter befintlig `.scoreboard-ticker-wrap` med distinkt LED-styling:**

```css
.module-text {
  background: #07060a;
  height: 18px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(255,255,255,0.03);
}
.module-text::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 3px 3px;
}
.module-text-track {
  display: flex;
  align-items: center;
  height: 100%;
  white-space: nowrap;
  padding-left: 100%;
  animation: scrollText 28s linear infinite;
}
.module-text-track > span {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--led-red);
  text-shadow: 0 0 5px var(--led-red-glow);
  padding-right: 60px;
}
.module-text-track > span.dim {
  color: rgba(255,100,80,0.55);
  text-shadow: none;
}
@keyframes scrollText {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}
```

**Ta bort:** Befintlig JS-driven `tickerOffset`-state + `setInterval` med translateX-manipulation. Mocken använder CSS-animation, inte JS — det är mycket mer performant.

**JSX:**

```tsx
{/* Rolling LED ticker */}
<div className="module-text">
  <div className="module-text-track">
    {ticker.map((segment, i) => (
      <span key={i} className={i % 2 === 1 ? 'dim' : ''}>
        {segment}
      </span>
    ))}
  </div>
</div>
```

---

### Modul 4: `.module-line` (tidslinje)

**Detta är den största förändringen — mocken har en strukturerad timeline-modul med head + line + feet, inte bara en bar.**

```css
.module-line {
  background: linear-gradient(180deg, #14120f, #0c0a08);
  padding: 14px 16px 12px;
  border-top: 1px solid rgba(255,255,255,0.04);
}
.line-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.line-title {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2.5px;
  color: rgba(245,241,235,0.45);
}
.line-now {
  font-family: var(--font-display);
  font-size: 11px;
  color: var(--now-mark);
  letter-spacing: 0.5px;
}
.timeline {
  position: relative;
  height: 38px;          /* var 22px tidigare */
  background: var(--line-bg);
  border-radius: 2px;
}
.tl-half {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255,255,255,0.12);
}
.tl-tick {
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 5px;
  background: var(--line-tick);
}
.tl-tick-label {
  position: absolute;
  bottom: -14px;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--line-text);
}
.tl-goal {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: 2px;
  border-radius: 1px;
}
.tl-goal.home { background: var(--home-mark); box-shadow: 0 0 4px var(--home-mark); }
.tl-goal.away { background: var(--away-mark); box-shadow: 0 0 4px var(--away-mark); }
.tl-goal-cap {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  width: 6px;
  height: 2px;
  border-radius: 1px;
}
.tl-goal-cap.home { background: var(--home-mark); }
.tl-goal-cap.away { background: var(--away-mark); }
.tl-pen {
  position: absolute;
  top: 8px;
  bottom: 8px;
  background: repeating-linear-gradient(45deg,
    rgba(255,255,255,0.08) 0 3px,
    rgba(255,255,255,0.02) 3px 6px
  );
  border-left: 1px solid rgba(255,255,255,0.15);
  border-right: 1px solid rgba(255,255,255,0.15);
}
.tl-now {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--now-mark);
  box-shadow:
    0 0 0 2px var(--bg-leather-dk),
    0 0 0 3px var(--now-mark),
    0 0 14px var(--now-mark);
  animation: nowPulse 2s ease-in-out infinite;
}
@keyframes nowPulse {
  0%, 100% {
    box-shadow: 0 0 0 2px var(--bg-leather-dk), 0 0 0 3px var(--now-mark), 0 0 14px var(--now-mark);
  }
  50% {
    box-shadow: 0 0 0 2px var(--bg-leather-dk), 0 0 0 3px var(--now-mark), 0 0 22px var(--now-mark);
  }
}
.line-feet {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.5px;
}
.line-feet .home-pill { color: var(--home-mark); }
.line-feet .away-pill { color: var(--away-mark); }
.line-feet .home-pill::before,
.line-feet .away-pill::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: 1px;
}
.line-feet .home-pill::before { background: var(--home-mark); }
.line-feet .away-pill::before { background: var(--away-mark); }
.line-feet .meta {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 11px;
  color: rgba(245,241,235,0.45);
  letter-spacing: 0;
}
```

**Ta bort:** Befintlig `.scoreboard-timeline`, `.scoreboard-tick`, `.scoreboard-halftime-line`, `.scoreboard-tick-label` — ersätts av `.timeline` + `.tl-*` enligt ovan.

**JSX:**

```tsx
{/* Timeline module */}
<div className="module-line">
  <div className="line-head">
    <span className="line-title">MATCHEN</span>
    <span className="line-now">{minute}′ — NU</span>
  </div>
  <div className="timeline">
    <span className="tl-half" />

    {/* Tick marks at 15, 30, 60 */}
    {[15, 30, 60].map(tick => {
      const pct = (tick / maxMinutes) * 100
      return (
        <span key={tick}>
          <span className="tl-tick" style={{ left: `${pct}%` }} />
          <span className="tl-tick-label" style={{ left: `${pct}%` }}>{tick}</span>
        </span>
      )
    })}

    {/* Penalty bands */}
    {penalties.map((p, i) => {
      const startPct = (Math.max(0, minute - p.secondsLeft/60) / maxMinutes) * 100
      const endPct = (minute / maxMinutes) * 100
      return (
        <span
          key={`pen-${i}`}
          className="tl-pen"
          style={{ left: `${startPct}%`, width: `${Math.max(1, endPct - startPct)}%` }}
        />
      )
    })}

    {/* Goal marks */}
    {events.map((ev, i) => {
      const pct = (ev.minute / maxMinutes) * 100
      return (
        <span key={`g-${i}`}>
          <span className={`tl-goal ${ev.team}`} style={{ left: `${pct}%` }} />
          <span className={`tl-goal-cap ${ev.team}`} style={{ left: `${pct}%` }} />
        </span>
      )
    })}

    {/* Now marker */}
    {showNowMarker && !isFT && (
      <span
        className="tl-now"
        style={{ left: `${Math.min((minute / maxMinutes) * 100, 98)}%` }}
      />
    )}
  </div>
  <div className="line-feet">
    <span className="home-pill">{homeClubFullName}</span>
    <span className="meta">{homeScore} mål · {homePens.length} utv mot</span>
    <span className="away-pill">{awayClubFullName}</span>
  </div>
</div>
```

**Ny prop som krävs:** `homeClubFullName: string` och `awayClubFullName: string` för `.line-feet`. Eller använd existerande props om `homeCode`/`awayCode` får vara fulla namn här.

---

### Wrappa allt i `.board-system` med bezel-gradient

**Mockens yttre wrap:**

```css
.board-system {
  background: linear-gradient(180deg,
    var(--bezel-top),
    var(--bezel-mid) 60%,
    var(--bezel-bot)
  );
  border-radius: 4px;
  padding: 1px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.06) inset,
    0 -1px 0 rgba(0,0,0,0.6) inset,
    0 4px 12px rgba(0,0,0,0.5);
}
```

**JSX top-level wrap:**

```tsx
<div className="scoreboard-root">
  <div className="board-system">
    <div className="module-main">...</div>
    <div className={`module-pen${hasPenalties ? ' active' : ''}`}>...</div>
    <div className="module-text">...</div>
    <div className="module-line">...</div>
  </div>
</div>
```

**Ta bort:** Befintlig flat `.scoreboard-root` med direktkapslade moduler.

---

### CSS-variabler som måste finnas (verifiera i global.css)

```css
--bezel-top:    #3a3632;
--bezel-mid:    #2a2622;
--bezel-bot:    #15130f;
--panel:        #0A0908;
--panel-edge:   #050402;
--led-red:      #FF2A18;
--led-red-dim:  rgba(255, 42, 24, 0.07);
--led-red-glow: rgba(255, 42, 24, 0.55);
--led-amber:    #FFAA00;
--led-green:    #66FF33;
--line-bg:      rgba(255, 255, 255, 0.04);
--line-stroke:  rgba(255, 255, 255, 0.12);
--line-tick:    rgba(255, 255, 255, 0.18);
--line-text:    rgba(245, 241, 235, 0.55);
--home-mark:    #C47A3A;
--away-mark:    #6B7F8E;
--now-mark:     #FFB347;
```

Lägg till i global.css om de saknas.

---

## FIX-19 · Fix CommentaryFeedStalvallen läsbarhet

**Fil:** `src/presentation/components/match/commentary/CommentaryFeedStalvallen.tsx` + `stalvallen-match.css`

### Problem

- Atmosphere-text har `rgba(245,241,235,0.35)` — för svag, oläslig mot mörk bakgrund
- Event-text icke-goal har `rgba(245,241,235,0.65)` — borde vara nästan opaque (mockens 0.92)
- Saknar `feed-head` med "COMMENTARY" etikett
- Goal-rad saknar `border-left: 2px solid var(--copper)` + copper-färgad text
- Atmosphere-rad saknar visibility-hidden min-span "—"

### CSS-fix

```css
.commentary-feed {
  background: linear-gradient(180deg, var(--bg-leather-dk) 0%, #211e1a 100%);
  max-height: 320px;
  overflow-y: auto;
  border-top: 1px solid rgba(196,122,58,0.18);
  color: var(--paper-warm);
}

/* Feed head — saknas idag */
.commentary-feed-head {
  padding: 9px 18px 7px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2.5px;
  color: var(--copper);
  text-transform: uppercase;
  border-bottom: 1px dashed rgba(196,122,58,0.18);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.25);
}
.commentary-feed-head .live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.commentary-feed-head .live::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--copper);
  animation: liveDot 1.6s ease-in-out infinite;
}
@keyframes liveDot {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(196,122,58,0.7); }
  50% { opacity: 0.5; box-shadow: 0 0 4px rgba(196,122,58,0.4); }
}

/* Event row — högre kontrast */
.commentary-row-event {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(196,122,58,0.08);
  animation: fadeInUp 250ms ease-out both;
}

.commentary-event-minute {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--led-amber);
  text-shadow: 0 0 3px rgba(255,170,0,0.4);
  min-width: 32px;
  padding-top: 2px;
  font-weight: 700;
  flex-shrink: 0;
}

.commentary-event-body {
  flex: 1;
  min-width: 0;
}

.commentary-event-text {
  font-size: 13px;
  color: rgba(245,241,235,0.92);    /* var 0.65, nu starkare */
  line-height: 1.45;
}

/* Atmosphere row — italic, svagare men inte oläslig */
.commentary-row-atmosphere {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(196,122,58,0.08);
  animation: fadeInUp 250ms ease-out both;
}
.commentary-row-atmosphere-min {
  font-family: var(--font-mono);
  font-size: 11px;
  min-width: 32px;
  visibility: hidden;        /* placeholder för alignment */
  flex-shrink: 0;
}
.commentary-row-atmosphere-text {
  font-style: italic;
  font-size: 12px;
  color: rgba(245,241,235,0.5);    /* var 0.35, nu starkare */
  line-height: 1.45;
  flex: 1;
}

/* Goal-row — copper-färgad + border-left */
.commentary-row-event.goal {
  background: rgba(196,122,58,0.10);
  border-left: 2px solid var(--copper);
}
.commentary-row-event.goal .commentary-event-text {
  font-weight: 600;
  color: var(--copper);
  font-family: var(--font-display);
  font-size: 14px;
}
```

### JSX-fix

```tsx
return (
  <div ref={containerRef} className="commentary-feed">
    {/* Feed head */}
    <div className="commentary-feed-head">
      <span className="live">COMMENTARY</span>
      <span style={{ color: 'rgba(245,241,235,0.45)', letterSpacing: '1.5px' }}>
        SCROLL ↑
      </span>
    </div>

    {rows.map((row, i) => {
      if (row.kind === 'atmosphere') {
        return (
          <div key={i} className="commentary-row-atmosphere">
            <span className="commentary-row-atmosphere-min">—</span>
            <span className="commentary-row-atmosphere-text">{row.text}</span>
          </div>
        )
      }

      const isGoalRow = row.tag === 'goal' || row.tag === 'penalty'
      return (
        <div
          key={i}
          className={`commentary-row-event${isGoalRow ? ' goal' : ''}`}
        >
          <span className="commentary-event-minute">{row.minute}&apos;</span>
          <div className="commentary-event-body">
            <div className="commentary-event-header">
              <Tag type={row.tag} />
              {row.meta && (
                <span className="commentary-event-meta">{row.meta}</span>
              )}
            </div>
            <div className="commentary-event-text">
              {row.text}
            </div>
          </div>
        </div>
      )
    })}
  </div>
)
```

**Ta bort:** Inline `style={{ background: tagStyle.rowBg ?? 'transparent' }}` och inline `color`-styling på `.commentary-event-text`. Klassen `.goal` på row-elementet hanterar nu styling.

---

## FIX-20 · Rensa upp MatchLiveScreen — dubbel score-info + stat-bar

**Fil:** `src/presentation/screens/match/MatchLiveScreen.tsx`

### Problem 1: "Forsba 1 - 0 Västan" plain text

Jacobs screenshot visar att det renderas en plain text-rad "Forsba 1 - 0 Västan" UNDER scoreboarden. Det är inte i ScoreboardStalvallen — så det måste vara en separat rendering någonstans i MatchLiveScreen eller en parent-komponent.

**Action:** Sök i MatchLiveScreen efter denna text (eller liknande sträng `${homeClubName} ${homeScore} - ${awayScore} ${awayClubName}`) och **ta bort den**. Den är redan representerad i ScoreboardStalvallen.

### Problem 2: Mittpanelen (MatchControls) ska Stålvallen-stilas — se FIX-21

MatchControls-komponenten (kontrollknappar + MomentumBar + StatsFooter) renderar med `var(--bg-surface)` (ljus bakgrund) och generiska `btn-ghost`-knappar. Den behöver INTE tas bort — den har nödvändiga kontroller (pause/forward/sub/taktik/mute) plus matchstats som hör hemma i live-vyn. Den behöver Stålvallen-stilas. Se **FIX-21** nedan för full spec.

### Problem 3: Mini-timeline mellan scoreboard och MATCH-block

Bild visade en mini-timeline (15/30/60/75-markörer) MELLAN scoreboarden och MATCH-blocket. I mocken är timeline EN DEL AV scoreboard-modulen (modul 4). Efter FIX-18 ska timeline vara inom `.board-system` — den ska INTE finnas dubbelt.

**Action:** Sök i MatchLiveScreen efter timeline-rendering utanför ScoreboardStalvallen och ta bort. Endast timelinen inuti ScoreboardStalvallen ska kvarstå.

---

## FIX-21 · Stålvallen-stila mittpanelen (MatchControls)

**Filer:**
- `src/presentation/components/match/MatchControls.tsx`
- `src/presentation/components/match/MomentumBar.tsx` (verifiera och uppdatera om nödvändigt)
- `src/presentation/components/match/StatsFooter.tsx` (verifiera och uppdatera om nödvändigt)
- `src/presentation/styles/stalvallen-match.css` (lägg till nya klasser)

### Kontext

Mittpanelen är INTE i mocken, men funktionerna (paus/fast-forward/byten/taktikjustering/ljud + intensitet/stats) är nödvändiga i live-vyn. Lösningen är att förlänga Stålvallen-stilen nedåt till mittpanelen så visuell kontinuitet bevaras mellan scoreboard → mittpanel → commentary.

### Nuvarande struktur

```tsx
<div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
  <div style={{ display: 'flex', ... padding: '6px 16px' }}>
    <span>🏛️ Match</span>
    <button className="btn btn-ghost">⏸</button>
    <button className="btn btn-ghost">⏩</button>
    <button className="btn btn-ghost">🔄</button>
    <button className="btn btn-ghost">⚙️ 3 TAKTIK</button>
    <button className="btn btn-ghost">🔊</button>
  </div>
  <MomentumBar />     {/* INTENSIVT-bar */}
  <StatsFooter />     {/* Bollinnehåv / Skott / Hörnor */}
</div>
```

### Ny struktur

Wrap i Stålvallen-stil med mörk bärgrund, copper accents, monospace-typografi:

```css
/* Lägg till i stalvallen-match.css */

.match-controls-stalvallen {
  background: var(--bg-leather-dk);
  border-bottom: 1px solid rgba(196,122,58,0.18);
  position: relative;
  flex-shrink: 0;
}
.match-controls-stalvallen::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.012) 1px, transparent 1px);
  background-size: 3px 3px;
}

.match-controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  position: relative;
}

.match-controls-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--copper);
  opacity: 0.8;
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.match-control-btn {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(196,122,58,0.22);
  border-radius: 3px;
  padding: 6px 10px;
  font-size: 13px;
  color: rgba(245,241,235,0.7);
  cursor: pointer;
  transition: all 120ms;
  font-family: var(--font-mono);
}
.match-control-btn:hover {
  background: rgba(196,122,58,0.1);
  border-color: rgba(196,122,58,0.45);
  color: var(--paper-warm);
}
.match-control-btn.active {
  background: rgba(196,122,58,0.18);
  border-color: var(--copper);
  color: var(--copper);
  text-shadow: 0 0 4px rgba(196,122,58,0.4);
  box-shadow: inset 0 0 6px rgba(196,122,58,0.15);
}
.match-control-btn.danger {
  border-color: rgba(255,42,24,0.3);
  color: rgba(255,170,150,0.7);
}
.match-control-btn.danger.active {
  background: rgba(255,42,24,0.12);
  border-color: var(--led-red);
  color: var(--led-red);
  text-shadow: 0 0 4px rgba(255,42,24,0.4);
}

.match-control-tactic {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px 6px 10px;
}
.match-control-tactic-count {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 11px;
  color: var(--led-amber);
  text-shadow: 0 0 3px rgba(255,170,0,0.5);
}
.match-control-tactic-label {
  font-size: 8px;
  letter-spacing: 1.5px;
  color: rgba(245,241,235,0.45);
  font-family: var(--font-mono);
}

/* MomentumBar (INTENSIVT) */
.momentum-stalvallen {
  padding: 6px 14px 8px;
  position: relative;
  border-top: 1px solid rgba(196,122,58,0.08);
}
.momentum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.momentum-side-label {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 1.5px;
  color: rgba(245,241,235,0.45);
  text-transform: uppercase;
}
.momentum-intensity-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--led-amber);
  text-shadow: 0 0 3px rgba(255,170,0,0.4);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.momentum-bar {
  height: 4px;
  background: rgba(255,255,255,0.04);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.momentum-bar-home {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--copper);
  box-shadow: 0 0 4px rgba(196,122,58,0.4);
  transition: width 400ms ease;
}

/* StatsFooter */
.stats-footer-stalvallen {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px 12px;
  padding: 6px 14px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  border-top: 1px solid rgba(196,122,58,0.08);
}
.stats-footer-home {
  text-align: right;
  color: var(--paper-warm);
  font-weight: 700;
  letter-spacing: 1px;
}
.stats-footer-label {
  text-align: center;
  color: rgba(245,241,235,0.45);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-size: 8px;
  font-weight: 600;
  align-self: center;
}
.stats-footer-away {
  text-align: left;
  color: var(--paper-warm);
  font-weight: 700;
  letter-spacing: 1px;
}
.stats-footer-home.lead { color: var(--led-amber); text-shadow: 0 0 3px rgba(255,170,0,0.3); }
.stats-footer-away.lead { color: var(--led-amber); text-shadow: 0 0 3px rgba(255,170,0,0.3); }
```

### Ny JSX

```tsx
<div className="match-controls-stalvallen">
  <div className="match-controls-row">
    <span className="match-controls-label">
      🏛️ MATCH
    </span>

    <button
      onClick={onTogglePause}
      className={`match-control-btn${!isPaused ? ' active' : ''}`}
      title={isPaused ? 'Spela' : 'Pausa'}
    >
      {isPaused ? '▶' : '⏸'}
    </button>

    <button
      onClick={onToggleFastForward}
      className={`match-control-btn${isFastForward ? ' active' : ''}`}
      title="Snabbsim"
    >
      ⏩
    </button>

    {!matchDone && (
      <button
        onClick={onOpenSubModal}
        className="match-control-btn"
        title="Byten"
      >
        🔄
      </button>
    )}

    {!matchDone && onOpenTacticQuick && (tacticChangesLeft ?? 0) > 0 && (
      <button
        onClick={onOpenTacticQuick}
        className="match-control-btn match-control-tactic"
        title="Taktikjustering"
      >
        ⚙️
        <span className="match-control-tactic-count">{tacticChangesLeft}</span>
        <span className="match-control-tactic-label">TAKTIK</span>
      </button>
    )}

    <button
      onClick={onToggleMute}
      className={`match-control-btn${muted ? ' active' : ''}`}
      title={muted ? 'Slå på ljud' : 'Stäng av ljud'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  </div>

  {currentMatchStep && (
    <MomentumBar
      homeActions={currentMatchStep.shotsHome + currentMatchStep.cornersHome}
      awayActions={currentMatchStep.shotsAway + currentMatchStep.cornersAway}
      intensity={currentMatchStep.intensity}
    />
  )}

  {currentMatchStep && (
    <StatsFooter stats={calculateLiveStats(currentMatchStep)} />
  )}
</div>
```

### MomentumBar och StatsFooter

Läs respektive komponent och uppdatera dem till att använda klasserna `.momentum-stalvallen`, `.momentum-bar`, `.stats-footer-stalvallen` etc enligt CSS ovan. Strukturen blir:

**MomentumBar:**
```tsx
<div className="momentum-stalvallen">
  <div className="momentum-header">
    <span className="momentum-side-label">HEMMA</span>
    <span className="momentum-intensity-tag">
      {intensityIcon} {intensityLabel}
    </span>
    <span className="momentum-side-label">BORTA</span>
  </div>
  <div className="momentum-bar">
    <div
      className="momentum-bar-home"
      style={{ width: `${homePercent}%` }}
    />
  </div>
</div>
```

**StatsFooter:**
```tsx
<div className="stats-footer-stalvallen">
  <span className={`stats-footer-home${stats.home.possession > stats.away.possession ? ' lead' : ''}`}>
    {stats.home.possession}%
  </span>
  <span className="stats-footer-label">Bollinnehåv</span>
  <span className={`stats-footer-away${stats.away.possession > stats.home.possession ? ' lead' : ''}`}>
    {stats.away.possession}%
  </span>
  <span className={`stats-footer-home${stats.home.shots > stats.away.shots ? ' lead' : ''}`}>
    {stats.home.shots}
  </span>
  <span className="stats-footer-label">Skott</span>
  <span className={`stats-footer-away${stats.away.shots > stats.home.shots ? ' lead' : ''}`}>
    {stats.away.shots}
  </span>
  <span className={`stats-footer-home${stats.home.corners > stats.away.corners ? ' lead' : ''}`}>
    {stats.home.corners}
  </span>
  <span className="stats-footer-label">Hörnor</span>
  <span className={`stats-footer-away${stats.away.corners > stats.home.corners ? ' lead' : ''}`}>
    {stats.away.corners}
  </span>
</div>
```

### Resultat

- Mittpanelen blir en visuell fortsättning av scoreboarden nedåt
- Kontrollknapparna ser "operatörspanel"-aktiga ut med mörk bakgrund + copper border + LED-aktiverad-state
- TAKTIK-knappens count blir amber LED (matchar tidsangivelse-stilen)
- INTENSIVT-bar blir copper på mörk bas, monospace text
- Stats blir mono-font med ledande lag i amber

---

## Acceptanskriterier

- [ ] Scoreboard har bezel-gradient (`linear-gradient(180deg, --bezel-top, --bezel-mid 60%, --bezel-bot)`) som yttre ram
- [ ] Score-modul: home-team-code + score-LG på en rad, sep-dot mitt, away-team-code + score-LG — sedan period-mark + tid på egen rad under
- [ ] Klock-tid är RÖD LED (`var(--led-red)`), inte amber
- [ ] Period-mark är text-only (HL1/HL2/OT/FT) i `rgba(255,200,180,0.5)` med text-shadow — INGEN badge med rundad bakgrund
- [ ] sep-dot mellan team-cols (6x6px röd LED med glow)
- [ ] Utvisnings-modul `.module-pen` är egen modul med svart bg + dot-pattern, animerar in/ut vid penalty-trigger
- [ ] Rullande LED-textremsa `.module-text` använder CSS-animation (inte JS interval), röd LED text
- [ ] Timeline-modul `.module-line` har head ("MATCHEN" + "X′ — NU") + timeline + feet (home-pill + meta + away-pill)
- [ ] Now-marker är 12x12 cirkel med pulse-animation, inte 2px linje
- [ ] Goal-mark är 2px vertikal stapel med cap, inte 6x6 cirkel
- [ ] Penalty-band är 45° striped pattern mellan top:8px och bottom:8px
- [ ] Commentary feed har `.commentary-feed-head` med "COMMENTARY" + "SCROLL ↑"
- [ ] Atmosphere-text har `rgba(245,241,235,0.5)` (var 0.35) — läsbar
- [ ] Event-text har `rgba(245,241,235,0.92)` (var 0.65) — stark kontrast
- [ ] Goal-rader har `border-left: 2px solid var(--copper)` + copper-färgad text
- [ ] MatchLiveScreen har INGEN "Forsba 1 - 0 Västan" plain text
- [ ] MatchLiveScreen har INGEN mini-timeline utanför ScoreboardStalvallen
- [ ] MatchLiveScreen har INGEN ljus stat-bar (Bollinnehav/Skott/Hörnor) — eller restilad till mörk Stålvallen
- [ ] Befintliga 760 tester gröna

---

## Vad du INTE ska göra

- **Inte modifiera** scorboardens props-interface (homeCode, awayCode, homeScore, awayScore, managedSide, period, minute, second, penalties, ticker, events, isPlayoffFinal, finalTier, showNowMarker) — bara struktur och styling inuti
- **Inte modifiera** sevenSegment.tsx — den är OK
- **Inte modifiera** ticker-data-flödet i MatchLiveScreen — bara hur tickern renderas (JS interval → CSS animation)
- **Inte ta bort** score-flash-funktionaliteten — den ska kvarstå
- **Inte uppfinna** nya färgvärden — använd ENDAST CSS-variabler från mocken eller global.css

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. Tre commits rekommenderat: FIX-18 (scoreboard rebuild), FIX-19 (commentary), FIX-20 (cleanup MatchLiveScreen).

Flagga:
- Om CSS-variablerna (`--bezel-*`, `--led-red`, `--home-mark`, etc.) inte finns i global.css och måste läggas till
- Om ScoreboardStalvallen-props behöver utökas med `homeClubFullName`/`awayClubFullName` för `.line-feet`
- Om INTENSIVT-stat-bar finns på fler platser än MatchLiveScreen och kräver omfattande rensning
- Om ticker-animationen kräver att ticker-strängen renderas dubbelt för loopen (mocken gör inte det — använd `padding-left: 100%` + `animation: scrollText 28s linear infinite` istället)

---

## Slutligen — sanity check

Öppna `docs/match-live-bundle/match-live-stalvallen.html` i webbläsaren parallellt med en running dev-server. Jämför pixel-för-pixel mellan mocken och live-vyn. Om något fortfarande ser annorlunda ut än mocken — det är troligen ett gap jag missade i specen, säg till.
