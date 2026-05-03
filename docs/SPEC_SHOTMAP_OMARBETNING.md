# SPEC_SHOTMAP_OMARBETNING

**Datum:** 2026-05-02
**Författare:** Opus
**Status:** Spec-klar för Code
**Estimat:** 1-2h
**Beroende:** Inga

---

## VARFÖR

Playtest 2026-05-02 visade tre fel i shotmap (`GranskaScreen.tsx` `renderShotmap`):

1. **Fel plangeometri.** Koden ritar rektangulära straffområden och målgårdar (fotbollsplan-geometri). Bandyplan har inga rektangulära boxar — bara halvcirklar. Målgård 5m radie halvcirkel, straffområde 17m radie halvcirkel.

2. **Etiketter sitter mellan zoner.** "MOTSTÅNDARMÅL" på y=95 och "VÅRT MÅL" på y=115 sitter precis vid separator-strecket. Spelaren tolkar dem fel — etiketten "MOTSTÅNDARMÅL" ser ut att gälla halvan ovanför där gröna prickar (våra mål) ligger.

3. **Skotts-prickar går utanför zon.** Labels placeras med `d.y + 12` utan klamring → kan hamna utanför zonens y-gräns.

Fjärde mindre fel: skotts-y-värdena bör fördelas över hela zon-höjden för bättre läsbarhet. Idag är goal-prickar klustrade i översta halvan av topzonen (närmast mål) — det är OK, men miss-prickar bör spridas mer ut.

---

## VAD VI BYGGER

Direkt-edit i `src/presentation/screens/GranskaScreen.tsx`, funktionen `renderShotmap()`. Två ändringar:

1. Byt rektangulära `<rect>` för målgård + straffområde mot bandybåge-`<path>` med halvcirklar
2. Byt etikett-placering — "↑ VI ANFALLER" / "DE ANFALLER ↓" i separator-strecket istället för text vid mål
3. Klamra label-y-positioner inom zonens gränser
4. Justera viewBox från `0 0 280 210` till `0 0 280 230` (lägger till 20px för att rymma full geometri utan trängsel)

---

## MOCK ATT IMPLEMENTERA EXAKT

Spara denna fil som `docs/mockups/shotmap_mockup.html` först. Den är kanon — kopiera alla SVG-värden bokstavligt, inte ungefärligt. Pixel-jämförelse mot mock är commit-blocker enligt princip 4 i CLAUDE.md.

```html
<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<title>Shotmap — bandygeometri-mock</title>
<style>
  :root {
    --bg: #EDE8DF;
    --bg-surface: #FAF8F4;
    --border: #DDD7CC;
    --text-muted: #8A857A;
    --accent: #C47A3A;
    --success: #5A9A4A;
    --font-display: 'Georgia', 'Times New Roman', serif;
    --font-body: system-ui, -apple-system, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #2a2520; font-family: var(--font-body); padding: 24px; }
  .header { color: #ddd; margin: 0 auto 24px; max-width: 420px; }
  .header h1 { font-family: var(--font-display); font-size: 20px; margin-bottom: 8px; }
  .header p { font-size: 13px; opacity: 0.7; line-height: 1.6; }
  .phone { background: var(--bg); border-radius: 18px; padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 380px; margin: 0 auto; }
  .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; }
  .section-label { font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
  svg { width: 100%; max-width: 320px; display: block; margin: 0 auto; }
  .legend { margin-top: 8px; }
  .legend-row { display: flex; align-items: center; gap: 7px; justify-content: center; margin-bottom: 3px; }
  .legend-row .team { font-size: 9px; font-weight: 700; color: var(--text-muted); min-width: 56px; text-align: right; letter-spacing: 0.3px; }
  .legend-item { display: flex; align-items: center; gap: 3px; }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; }
  .legend-text { font-size: 10px; color: var(--text-muted); }
  .notes { color: #aaa; font-size: 12px; margin: 24px auto 0; max-width: 420px; padding-top: 16px; border-top: 1px solid #444; line-height: 1.7; }
  .notes strong { color: #fff; }
  .notes ul { padding-left: 20px; margin: 8px 0; }
</style>
</head>
<body>

<div class="header">
  <h1>Shotmap — bandygeometri-mock</h1>
  <p>Söderfors 6 – 5 Heros (samma data som playtest 2026-05-02). Halvcirkel-geometri enligt bandyregler, riktningspilar i mittstrecket.</p>
</div>

<div class="phone">
  <div class="card">
    <p class="section-label">Skottbild</p>

    <svg viewBox="0 0 280 230" xmlns="http://www.w3.org/2000/svg">
      <!-- TOPZON: vi anfaller motståndarens mål (mål vid y=4) -->
      <rect x="0" y="0" width="280" height="100" fill="#fff" stroke="rgba(0,0,0,0.1)" stroke-width="0.5" rx="3"/>

      <!-- Net + crossbar + posts -->
      <rect x="121" y="0" width="38" height="4" fill="rgba(0,0,0,0.05)"/>
      <line x1="120" y1="4" x2="160" y2="4" stroke="rgba(0,0,0,0.65)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="120" y1="0" x2="120" y2="4" stroke="rgba(0,0,0,0.55)" stroke-width="1.5"/>
      <line x1="160" y1="0" x2="160" y2="4" stroke="rgba(0,0,0,0.55)" stroke-width="1.5"/>

      <!-- Målgård: halvcirkel 5m radie ≈ 22px -->
      <path d="M 118 4 A 22 22 0 0 1 162 4" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1"/>

      <!-- Straffområde: halvcirkel 17m radie ≈ 75px -->
      <path d="M 65 4 A 75 75 0 0 1 215 4" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>

      <!-- Straffpunkt: 12m från mål ≈ 53px ner i zonen -->
      <circle cx="140" cy="57" r="1.5" fill="rgba(0,0,0,0.3)"/>

      <!-- 6 mål (Söderfors gröna) -->
      <circle cx="135" cy="23" r="6" fill="rgba(90,154,74,0.85)" stroke="rgba(90,154,74,1)" stroke-width="1"/>
      <text x="148" y="25" font-size="7" fill="rgba(0,0,0,0.55)">Lundqvist</text>
      <circle cx="148" cy="30" r="6" fill="rgba(90,154,74,0.85)" stroke="rgba(90,154,74,1)" stroke-width="1"/>
      <text x="161" y="32" font-size="7" fill="rgba(0,0,0,0.55)">Ros</text>
      <circle cx="125" cy="46" r="6" fill="rgba(90,154,74,0.85)" stroke="rgba(90,154,74,1)" stroke-width="1"/>
      <text x="105" y="48" font-size="7" fill="rgba(0,0,0,0.55)">Stål</text>
      <circle cx="135" cy="53" r="6" fill="rgba(90,154,74,0.85)" stroke="rgba(90,154,74,1)" stroke-width="1"/>
      <text x="118" y="64" font-size="7" fill="rgba(0,0,0,0.55)">Almqvist</text>
      <circle cx="148" cy="50" r="6" fill="rgba(90,154,74,0.85)" stroke="rgba(90,154,74,1)" stroke-width="1"/>
      <text x="161" y="52" font-size="7" fill="rgba(0,0,0,0.55)">Stål</text>
      <circle cx="118" cy="36" r="6" fill="rgba(90,154,74,0.85)" stroke="rgba(90,154,74,1)" stroke-width="1"/>
      <text x="80" y="38" font-size="7" fill="rgba(0,0,0,0.55)">Almqvist</text>

      <!-- 2 räddade -->
      <circle cx="105" cy="26" r="3" fill="rgba(196,122,58,0.7)" stroke="rgba(196,122,58,1)" stroke-width="1"/>
      <circle cx="170" cy="43" r="3" fill="rgba(196,122,58,0.7)" stroke="rgba(196,122,58,1)" stroke-width="1"/>

      <!-- SEPARATOR med riktningspilar -->
      <rect x="0" y="100" width="280" height="30" fill="rgba(0,0,0,0.07)"/>
      <text x="14" y="119" font-size="8" fill="rgba(0,0,0,0.65)" font-weight="700" letter-spacing="0.8">↑ VI ANFALLER</text>
      <text x="266" y="119" font-size="8" fill="rgba(0,0,0,0.65)" text-anchor="end" font-weight="700" letter-spacing="0.8">DE ANFALLER ↓</text>

      <!-- BOTTENZON: motståndaren anfaller vårt mål (mål vid y=226) -->
      <rect x="0" y="130" width="280" height="100" fill="#fff" stroke="rgba(0,0,0,0.1)" stroke-width="0.5" rx="3"/>

      <!-- Net + crossbar + posts -->
      <rect x="121" y="226" width="38" height="4" fill="rgba(0,0,0,0.05)"/>
      <line x1="120" y1="226" x2="160" y2="226" stroke="rgba(0,0,0,0.65)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="120" y1="226" x2="120" y2="230" stroke="rgba(0,0,0,0.55)" stroke-width="1.5"/>
      <line x1="160" y1="226" x2="160" y2="230" stroke="rgba(0,0,0,0.55)" stroke-width="1.5"/>

      <!-- Målgård halvcirkel -->
      <path d="M 118 226 A 22 22 0 0 0 162 226" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1"/>

      <!-- Straffområde halvcirkel -->
      <path d="M 65 226 A 75 75 0 0 0 215 226" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>

      <!-- Straffpunkt -->
      <circle cx="140" cy="173" r="1.5" fill="rgba(0,0,0,0.3)"/>

      <!-- 5 mål (Heros röda) -->
      <circle cx="135" cy="207" r="5" fill="rgba(176,80,64,0.6)" stroke="rgba(176,80,64,0.9)" stroke-width="1" opacity="0.85"/>
      <circle cx="150" cy="200" r="5" fill="rgba(176,80,64,0.6)" stroke="rgba(176,80,64,0.9)" stroke-width="1" opacity="0.85"/>
      <circle cx="125" cy="192" r="5" fill="rgba(176,80,64,0.6)" stroke="rgba(176,80,64,0.9)" stroke-width="1" opacity="0.85"/>
      <circle cx="142" cy="187" r="5" fill="rgba(176,80,64,0.6)" stroke="rgba(176,80,64,0.9)" stroke-width="1" opacity="0.85"/>
      <circle cx="118" cy="180" r="5" fill="rgba(176,80,64,0.6)" stroke="rgba(176,80,64,0.9)" stroke-width="1" opacity="0.85"/>

      <!-- 1 räddad -->
      <circle cx="160" cy="184" r="2.5" fill="rgba(196,122,58,0.4)" stroke="rgba(0,0,0,0.25)" stroke-width="1" opacity="0.75"/>

      <!-- 4 miss (utspridda) -->
      <circle cx="80" cy="167" r="2" fill="rgba(0,0,0,0.1)" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
      <circle cx="220" cy="172" r="2" fill="rgba(0,0,0,0.1)" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
      <circle cx="195" cy="157" r="2" fill="rgba(0,0,0,0.1)" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
      <circle cx="60" cy="182" r="2" fill="rgba(0,0,0,0.1)" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
    </svg>

    <div class="legend">
      <div class="legend-row">
        <span class="team">SÖDERFORS</span>
        <div class="legend-item"><div class="legend-dot" style="background: var(--success)"></div><span class="legend-text">6 mål</span></div>
        <div class="legend-item"><div class="legend-dot" style="background: var(--accent)"></div><span class="legend-text">2 räddade</span></div>
        <div class="legend-item"><div class="legend-dot" style="background: rgba(0,0,0,0.28)"></div><span class="legend-text">0 miss</span></div>
      </div>
      <div class="legend-row">
        <span class="team">HEROS</span>
        <div class="legend-item"><div class="legend-dot" style="background: rgba(176,80,64,0.8)"></div><span class="legend-text">5 mål</span></div>
        <div class="legend-item"><div class="legend-dot" style="background: var(--accent)"></div><span class="legend-text">1 räddad</span></div>
        <div class="legend-item"><div class="legend-dot" style="background: rgba(0,0,0,0.28)"></div><span class="legend-text">4 miss</span></div>
      </div>
    </div>
  </div>
</div>

<div class="notes">
  <strong>Geometri:</strong>
  <ul>
    <li>viewBox 280×230 (var 280×210 — utökat 20px för att rymma geometrin).</li>
    <li>Mål 38px brett (oförändrat).</li>
    <li>Målgård halvcirkel, radie 22px (5m).</li>
    <li>Straffområde halvcirkel, radie 75px (17m). Klipps av zonens kanter.</li>
    <li>Straffpunkt 53px från mållinjen (12m).</li>
    <li>Inga rektangulära boxar.</li>
  </ul>
  <strong>Etiketter i mittstrecket:</strong> "↑ VI ANFALLER" till vänster, "DE ANFALLER ↓" till höger.
</div>

</body>
</html>
```

---

## IMPLEMENTATION I `GranskaScreen.tsx`

### Konstanter (uppdatera)

```typescript
// Två isolerade zoner — top: vi anfaller, bottom: de anfaller
const W = 280
const H = 230            // ÄNDRAT: var 210
const GX = 140
const GT = 4             // top goal crossbar y
const GB = 226           // bottom goal crossbar y — ÄNDRAT: var 206
const TOP_MAX = 100      // bottom edge of our-attack zone
const BOT_MIN = 130      // top edge of opponent-attack zone — ÄNDRAT: var 110
```

### nextPos / nextOppPos — y-klamring uppdateras

`nextPos`: clamping mot `TOP_MAX - 4` (oförändrat — bara konstant ändras)
`nextOppPos`: clamping mot `BOT_MIN + 4` (oförändrat — bara konstant ändras)

Men: **goal-prickarnas y-utbrede behöver uppdateras** så de inte klustrar i översta halvan. Nuvarande `y = GT + 12 + r2 * 38` (range 16-54). Ändra till `y = GT + 14 + r2 * 50` (range 18-64) för bättre fördelning. Bottenzon analogt.

```typescript
// nextPos (top zone)
if (kind === 'goal') {
  x = GX + (r1 - 0.5) * 60;  y = GT + 14 + r2 * 50    // ÄNDRAT från GT + 12 + r2 * 38
} else if (kind === 'save') {
  x = GX + (r1 - 0.5) * 100; y = GT + 12 + r2 * 60    // ÄNDRAT från GT + 10 + r2 * 65
} else {
  x = 15 + r1 * 250;         y = GT + 18 + r2 * 75    // ÄNDRAT från GT + 15 + r2 * 78
}
return { x: Math.max(6, Math.min(W - 6, x)), y: Math.max(GT + 6, Math.min(TOP_MAX - 6, y)) }

// nextOppPos (bottom zone) — spegelbildligt
if (kind === 'goal') {
  x = GX + (r1 - 0.5) * 60;  y = GB - 14 - r2 * 50
} else if (kind === 'save') {
  x = GX + (r1 - 0.5) * 100; y = GB - 12 - r2 * 60
} else {
  x = 15 + r1 * 250;         y = GB - 18 - r2 * 75
}
return { x: Math.max(6, Math.min(W - 6, x)), y: Math.max(BOT_MIN + 6, Math.min(GB - 6, y)) }
```

### Label-y-klamring (FIX för utåt-flödande labels)

Nuvarande:
```typescript
const ly = d.y + Math.sin(angle) * 12 + 2
```

Ändra till:
```typescript
const ly = Math.min(TOP_MAX - 4, d.y + Math.sin(angle) * 12 + 2)
```

### SVG-innehåll — ersätt fullständigt

Ersätt nuvarande `<svg>...</svg>`-block i `renderShotmap()`. Kopiera **bokstavligt** från mocken ovan, med en skillnad: skotts-prickarna ska vara dynamiska (från `dots` och `oppDots`-arrays), inte hårdkodade som i mocken.

```jsx
<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
  {/* ── TOPZON: våra skott → motståndarens mål ── */}
  <rect x="0" y="0" width={W} height={TOP_MAX} fill="#fff" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" rx="3" />

  {/* Net hint + crossbar + posts */}
  <rect x={121} y={0} width={38} height={GT} fill="rgba(0,0,0,0.05)" />
  <line x1={120} y1={GT} x2={160} y2={GT} stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" strokeLinecap="round" />
  <line x1={120} y1={0} x2={120} y2={GT} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" />
  <line x1={160} y1={0} x2={160} y2={GT} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" />

  {/* Målgård: halvcirkel 5m ≈ 22px radie */}
  <path d={`M 118 ${GT} A 22 22 0 0 1 162 ${GT}`} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />

  {/* Straffområde: halvcirkel 17m ≈ 75px radie */}
  <path d={`M 65 ${GT} A 75 75 0 0 1 215 ${GT}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />

  {/* Straffpunkt: 12m ≈ 53px från mål */}
  <circle cx={GX} cy={GT + 53} r={1.5} fill="rgba(0,0,0,0.3)" />

  {/* ── SEPARATOR med riktningspilar ── */}
  <rect x="0" y={TOP_MAX} width={W} height={BOT_MIN - TOP_MAX} fill="rgba(0,0,0,0.07)" />
  <text x={14} y={TOP_MAX + 19} fontSize="8" fill="rgba(0,0,0,0.65)" fontWeight="700" letterSpacing="0.8">↑ VI ANFALLER</text>
  <text x={W - 14} y={TOP_MAX + 19} fontSize="8" fill="rgba(0,0,0,0.65)" textAnchor="end" fontWeight="700" letterSpacing="0.8">DE ANFALLER ↓</text>

  {/* ── BOTTENZON: motståndarens skott → vårt mål ── */}
  <rect x="0" y={BOT_MIN} width={W} height={H - BOT_MIN} fill="#fff" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" rx="3" />

  {/* Net hint + crossbar + posts */}
  <rect x={121} y={GB} width={38} height={H - GB} fill="rgba(0,0,0,0.05)" />
  <line x1={120} y1={GB} x2={160} y2={GB} stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" strokeLinecap="round" />
  <line x1={120} y1={GB} x2={120} y2={H} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" />
  <line x1={160} y1={GB} x2={160} y2={H} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" />

  {/* Målgård halvcirkel (uppåt) */}
  <path d={`M 118 ${GB} A 22 22 0 0 0 162 ${GB}`} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />

  {/* Straffområde halvcirkel (uppåt) */}
  <path d={`M 65 ${GB} A 75 75 0 0 0 215 ${GB}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />

  {/* Straffpunkt */}
  <circle cx={GX} cy={GB - 53} r={1.5} fill="rgba(0,0,0,0.3)" />

  {/* Våra skotts-prickar (topzon) */}
  {dots.map((d, i) => (
    <g key={i}>
      <circle
        cx={d.x} cy={d.y}
        r={d.kind === 'goal' ? 6 : d.kind === 'save' ? 3 : 2}
        fill={d.kind === 'goal' ? 'rgba(90,154,74,0.85)' : d.kind === 'save' ? 'rgba(196,122,58,0.7)' : 'rgba(0,0,0,0.15)'}
        stroke={d.kind === 'goal' ? 'rgba(90,154,74,1)' : d.kind === 'save' ? 'rgba(196,122,58,1)' : 'rgba(0,0,0,0.3)'}
        strokeWidth="1"
      />
      {d.label && (() => {
        const angle = (d.label.charCodeAt(0) % 8) * (Math.PI / 4)
        const lx = d.x + Math.cos(angle) * 12
        const ly = Math.min(TOP_MAX - 4, d.y + Math.sin(angle) * 12 + 2)
        return <text x={lx} y={ly} fontSize="7" fill="rgba(0,0,0,0.55)">{d.label}</text>
      })()}
    </g>
  ))}

  {/* Motståndarens skotts-prickar (bottenzon) */}
  {oppDots.map((d, i) => (
    <circle
      key={`opp-${i}`}
      cx={d.x} cy={d.y}
      r={d.kind === 'goal' ? 5 : d.kind === 'save' ? 2.5 : 2}
      fill={d.kind === 'goal' ? 'rgba(176,80,64,0.6)' : d.kind === 'save' ? 'rgba(196,122,58,0.4)' : 'rgba(0,0,0,0.1)'}
      stroke={d.kind === 'goal' ? 'rgba(176,80,64,0.9)' : 'rgba(0,0,0,0.25)'}
      strokeWidth="1"
      opacity="0.75"
    />
  ))}
</svg>
```

### Borttagningar

Tas bort:
- Alla `<rect>` för målgård och straffområde (rektangulära boxar)
- `<path>` för "Penalty D" (befintlig båge är fel — ska bort, ersätts av halvcirkel-straffområdet)
- Texterna "MOTSTÅNDARMÅL" (y=95) och "VÅRT MÅL" (y=115) — ersätts av riktningspilar i mittstrecket

---

## REGLER FÖR CODE

1. **Mocken är kanon.** Spara HTML-blocket ovan som `docs/mockups/shotmap_mockup.html`. Öppna i webbläsaren. Bredvid editorn under hela implementationen.

2. **Kopiera SVG-värden bokstavligt.** Padding, radius, stroke-width, opacity, font-size, letter-spacing, x/y-koordinater. Inte ungefärligt. Inte "liknande". Bokstavligen.

3. **Pixel-jämförelse är commit-blocker.** Innan commit: ta skärmdump av appen och mocken sida vid sida i samma viewport-bredd. Bifoga båda i commit-meddelandet eller SPRINT_AUDIT.

4. **Inga "förbättringar".** Om något känns fel (geometri-värde, etikett-position) — fråga Opus, ändra inte själv.

5. **Använd CSS-variabler där det går.** Hardkodade hex/rgba endast i SVG-värden från mocken (befintligt mönster i samma fil — se nuvarande renderShotmap).

---

## VERIFIERING

Code spelar 1 match i webbläsaren, går till GranskaScreen → Shotmap-fliken:

- Skärmdump av shotmap mot mocken
- Verifiera att halvcirklar syns (inga rektangulära boxar)
- Verifiera att "↑ VI ANFALLER" syns vänster i mittstrecket, "DE ANFALLER ↓" höger
- Verifiera att inga skotts-prickar eller labels går utanför sin zon
- Verifiera att straffpunkterna syns som små svarta prickar i båda zoner
- Verifiera att skotten är spridda över zonen, inte klustrade i översta halvan

---

## EFTER IMPLEMENTATION

KVAR.md: shotmap-omarbetning levererad.
LESSONS.md: ingen ny lärdom (samma mönster #5 — koordinatklamring — adresserad i denna fix).

Slut.
