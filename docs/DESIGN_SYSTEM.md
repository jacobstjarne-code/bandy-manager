# Bandy Manager — Design System

Dokumenterar de designprinciper och mönster som etablerats under utvecklingen. Alla nya vyer och ändringar ska följa dessa regler.

**Uppdaterad:** 6 april 2026

---

## 1. LAYOUTPRINCIPER

### Tight, inte luftig
Spelet spelas på mobil. Varje pixel vertikal plats är värdefull. Generellt:
- Card padding: `10px 14px` (inte 14px 16px, 16px 20px, 24px 20px)
- Card margin-bottom: `8px` (inte 10px, 12px, 16px)
- Gap mellan element: `6-8px` (inte 10px, 12px)
- Sektions-labels: 0 eller max 4px marginBottom

### Ingen onödig rubrik
Skärmar som nås via BottomNav (Dashboard, Trupp, Tabell, Transfers, Inkorg, Förening) ska INTE ha en rubrik-rad med sidnamn — det framgår av navigationen. Ingen tillbaka-knapp på dessa skärmar heller.

Undantag: Skärmar med hierarkisk navigering (SeasonSummary, MatchReport, History, BandyDoktorn) får ha tillbaka-knapp.

### Knappar
- Action-knappar (Ragga sponsor, Uppgradera, etc.) ska INTE vara fullbredd kant-till-kant
- Använd kompakt knappstil: `padding: '8px 16px'`, `borderRadius: 8`, högerställd eller med max-width
- CTA-knappar i footer (Spela omgång, Välj taktik, Starta säsong) FÅR vara fullbredd

### Tab-beskrivningar
Beskrivande text för flikar ska INTE vara egna sektioner med border-bottom.
De ska integreras i befintliga kort (t.ex. som undertext i sammanfattningskortet).
Storlek: `fontSize: 10, color: 'var(--text-muted)'`.

---

## 2. KORTSYSTEM

### `card-sharp` (standard)
Alla informationskort ska använda CSS-klassen `card-sharp`. INTE inline `borderRadius: 12` med egna borders.

```tsx
<div className="card-sharp" style={{ padding: '10px 14px' }}>
```

### `card-round` (atmosfär/citat)
Mjukare kort för stämningssättande text (pep-talk, funktionärsquotes):

```tsx
<div className="card-round" style={{ padding: '14px 16px' }}>
```

### Section labels
Sektions-rubriker i kort: 9px, fontWeight 600-700, letterSpacing 2.5px, textTransform uppercase, color `var(--text-muted)`. Alltid med emoji:

```tsx
<p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
  💰 EKONOMI
</p>
```

### Emoji-konventioner
Samma emoji för samma koncept överallt:
- 🏒 Match/spel (ALDRIG ⚽)
- 💰 Ekonomi
- 👥 Mecenater / Trupp
- 🏋️ Träning
- 🏠 Bygdens puls
- 🏘️ Orten (i RoundSummary)
- 🏛️ Kommun
- 🏟️ Anläggning & faciliteter
- 🏆 Cup/Slutspel
- ⚔️ Topp 8 / Slutspel
- 📬 Inkorg
- 🩹 Skador
- 🎓 Akademi
- 🔄 Utlånade
- 🔍 Scouting
- 📋 Kontrakt / Styrelsens uppdrag
- 💼 Transfers/Bud
- 🔥 Derby
- ⭐ Betyg/Prestation
- 📊 Tabell
- 📈 Form
- 🩺 Bandydoktorn
- 📖 Spelguide
- 📣 Pep-talk
- 🎮 Spelläge
- 🎯 Förväntan & profil

### ›-knapp
Varje kort som leder vidare har en `›`-knapp: 18×18px, transparent bg, 1px border `var(--border)`, copper accent text, borderRadius 4.

---

## 3. GLOBAL HEADER (GameHeader)

Mörk bakgrund (`var(--bg-dark)`), copper accent underline.

Innehåll:
- Vänster: Bandy Manager-logotyp (img, 26px hög)
- Mitten: Klubbnamn (12px, font-display, fontWeight 700) + "Spelarnamn · Säsong · Omg X" (9px)
- Höger: 🔔 Inkorg-knapp (med badge) + ⚙️ Inställningar-dropdown

### Inställningar-dropdown
Kugghjulet öppnar en dropdown med:
- 💾 Spara spel
- 📂 Ladda spel
- 🩺 Bandydoktorn
- 📖 Spelguide (öppnar inline overlay)

Dropdown: `position: absolute, top: 48, right: 12, var(--bg-surface), border, borderRadius: 8, zIndex: 200`

### Spelguide-overlay
10 FAQ-poster i scrollbar overlay. Design: `position: fixed, inset: 0, rgba(0,0,0,0.6), zIndex: 300`.
Kort: `var(--bg), borderRadius: 12, maxWidth: 380, maxHeight: calc(100vh - 120px)`.

---

## 4. FÄRGSYSTEM

Använd ENBART CSS-variabler:
- `var(--accent)` — copper, primär accent
- `var(--accent-dark)` — mörkare copper
- `var(--accent-deep)` — djupaste copper (CTA-gradient)
- `var(--success)` — grön (vinst, positiv)
- `var(--danger)` — röd (förlust, skada, negativ)
- `var(--warning)` — orange/gul (varning)
- `var(--ice)` — isblå (väder, borta-match, unga spelare)
- `var(--text-primary)` — huvudtext
- `var(--text-secondary)` — sekundärtext
- `var(--text-muted)` — svag text, labels
- `var(--text-light)` — ljus text på mörk bakgrund
- `var(--bg)` — huvudbakgrund
- `var(--bg-surface)` — kortbakgrund
- `var(--bg-elevated)` — upphöjd bakgrund
- `var(--bg-dark)` — mörk bakgrund (header, LED-tavla)
- `var(--border)` — kantlinje
- `var(--border-dark)` — mörkare kantlinje (bars, dividers)

**Noll tolerans** för hårdkodade färger (#22c55e, #f59e0b, etc.)

### Färgfunktioner (utility)
```typescript
// Community standing: grön → accent → warning → danger
csColor(cs: number): string  // i formatters.ts

// Fitness: grön → warning → danger
fitnessColor(f: number): string  // 70+ grön, 40+ warning, <40 danger
```

---

## 5. TYPOGRAFI

- `var(--font-display)` — rubriker, klubbnamn, poäng, citat
- `var(--font-body)` (system-ui) — brödtext, labels, knappar

Storlekar:
- Sektions-label: 9-10px uppercase, letterSpacing 2-2.5px
- Brödtext: 12-13px
- Rubriker i kort: 14-15px
- Stora siffror (poäng, score): 22-32px, font-display
- Sidrubriker: 18-22px, font-display

---

## 6. OVERLAYS & MODALER

### Grundregel
ALLA overlays (events, matchresultat, kontrakt, byten, spelguide) ska vara **overlays** — inte egna routes. Centrerade, inte bottom-sheets.

### Backdrop
```css
position: fixed;
inset: 0;
background: rgba(0,0,0,0.6);  /* ALDRIG 0.85 eller 0.96 */
display: flex;
align-items: center;       /* CENTRERAD, inte flex-end */
justify-content: center;
z-index: 300;              /* events 300, matchdone 200 */
padding: 20px;
```

### Kort inuti overlay
```css
background: var(--bg);     /* INTE var(--bg-surface) eller var(--bg-dark-surface) */
border-radius: 12px;       /* INTE 16px 16px 0 0 (bottom-sheet-stil) */
border: 1px solid var(--border);
box-shadow: 0 8px 40px rgba(0,0,0,0.3);
max-height: 85vh;
overflow-y: auto;
width: 100%;
max-width: 380px;
```

### Stäng-beteende
- Klick på backdrop stänger: `onClick={onClose}` på yttre div
- `onClick={e => e.stopPropagation()}` på inre kortet
- ×-knapp INUTI kortet (övre högra hörnet), inte utanför

### Overlay-hierarki (zIndex)
| Overlay | zIndex |
|---------|--------|
| EventOverlay | 300 |
| Spelguide | 300 |
| SubstitutionModal | 600 |
| MatchDoneOverlay | 200 |
| BidModal / RenewModal | 300 |
| FormDots tooltip | 100 |

---

## 7. FORMGUIDE (FormDots / FormSquares)

### Delad komponent
All formvisning ska använda `FormDots` (cirklar) eller `FormSquares` (fyrkanter med bokstav) från `src/presentation/components/FormDots.tsx`.

### Data
All formdata ska använda `getFormResults()` från `src/presentation/utils/formUtils.ts`.
Returnerar `{ result: 'V'|'O'|'F', score: string, opponent: string }`.

### Ordning
Nyast till VÄNSTER. Sorteras `b.roundNumber - a.roundNumber`.

### Färger
| Result | Färg | Bakgrund (squares) | Border (squares) |
|--------|------|-------------------|-------------------|
| V (vinst) | `var(--success)` | `rgba(90,154,74,0.15)` | `rgba(90,154,74,0.3)` |
| F (förlust) | `var(--danger)` | `rgba(176,80,64,0.15)` | `rgba(176,80,64,0.3)` |
| O (oavgjort) | `var(--accent)` | `rgba(196,186,168,0.15)` | `rgba(196,186,168,0.3)` |

### Tap-tooltip
Tap på en prick/fyrkant visar resultat + motståndare:
- Dark bakgrund: `var(--bg-dark)`
- Position: ovanför (`bottom: size + 6`)
- Stängs vid tap utanför (fixed inset 0 transparent lager)

### Varianter
| Variant | Storlek | Används i |
|---------|---------|-----------|
| FormDots (cirklar) | 8px | TabellScreen |
| FormSquares (fyrkanter) | 22px | RoundSummaryScreen |
| FormSquares (fyrkanter) | 14px | LastResultCard (dashboard) |

---

## 8. MATCHRESULTAT — Score-färg

### Vid normal vinst/förlust
Båda siffror i samma färg: `var(--success)` vid vinst, `var(--danger)` vid förlust, `var(--accent)` vid oavgjort.

### Vid straffar/förlängning (score oavgjort)
Individuell färg per lag:
- Vinnande lag: `var(--success)`
- Förlorande lag: `var(--danger)`

Beräkning:
```typescript
const homeWon = penResult ? penResult.home > penResult.away
  : otResult ? otResult === 'home'
  : homeScore > awayScore
const homeColor = homeWon ? 'var(--success)' : awayWon ? 'var(--danger)' : 'var(--accent)'
```

### Flavor text
| Scenario | Text |
|----------|------|
| Straffvinst | 🎯 Kalla nerver i straffarna |
| Straffförlust | 😔 Straffarna avgjorde |
| OT-vinst | ⏱️ Avgjort i sista stund |
| OT-förlust | ⏱️ Förlängt lidande |
| Storvinst (3+) | 💪 Dominant insats |
| Målrikt (8+ mål) | 🔥 Målrik historia |
| Knapp vinst (1 mål) | 😅 Knapp seger |
| Klar vinst | ✅ Klar vinst |
| Storförlust (3+) | 💣 Svår dag på jobbet |
| Knapp förlust | 😤 Nära men inte nog |
| Klar förlust | ❌ Klar förlust |
| Målrikt kryss (8+) | 🎢 Dramatiskt kryss |
| Rättvis kryss | 🤝 Rättvis poängdelning |

---

## 9. INKORG

### Raddesign
- Padding: `7px 12px` (tight)
- Ikon-cirkel: 22px (inte 28px)
- Titel: 13px
- Oläst-prick: 6px cirkel INLINE före titeln (inte egen rad)
- Oläst border-left: `3px solid var(--accent)` (tydlig)
- "Tryck för att läsa mer": BORTTAGEN (klickbarhet är signal nog)
- PlayerLink: inline, inte i wrapper-div

---

## 10. LINEUP-LISTA (Match → Lista)

### Spelarrad
- Nummerscirkel: 24px (inte 32px)
- Padding: `5px 10px` (inte 8px 12px)
- Gap: 8px (inte 10px)
- Position-text: 10px (inte 11px)
- START-label: 10px, `var(--success)` för startspelare

---

## 11. BYGDENS PULS / RELATIONSBAR

### Standard bar-mönster
Används för: community standing, mecenat-happiness, politiker-relation.

```tsx
<div style={{ display: 'flex', gap: 2 }}>
  <div style={{ flex: value, height: H, background: color, borderRadius: 'Rpx 0 0 Rpx' }} />
  <div style={{ flex: 100 - value, height: H, background: 'var(--border-dark)', borderRadius: '0 Rpx Rpx 0' }} />
</div>
```

| Användning | Height | Border-radius |
|------------|--------|---------------|
| Bygdens puls (KlubbTab) | 7px | 4px |
| Bygdens puls (RoundSummary) | 5px | 3px |
| Bygdens puls (Dashboard) | 7px | 4px |
| Mecenat happiness | 4px | 2px |
| Politiker relation | 6px | 3px |

### Färglogik
```typescript
// Community standing
csColor(cs) — grön >70, accent >50, warning >30, danger ≤30

// Mecenat/politiker relation
relColor — success ≥70, accent ≥40, danger <40
```

---

## 12. TRAINER ARC (Stämningstext)

Visas ovanför CTA-knappen på dashboard. Centrerad, italic.

```tsx
<div style={{ textAlign: 'center', marginBottom: 6 }}>
  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
    {moodText}
  </p>
  {reason && (
    <p style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7, marginTop: 2 }}>
      {reason}
    </p>
  )}
</div>
```

Reason hämtas från `trainerArc.history` (senaste transitionens reason).

---

## 13. CTA-KNAPPAR (Huvudknapp)

### Dashboard CTA ("Spela omgång X →")
```css
width: 100%;
padding: 18px;
background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
color: var(--text-light);
border-radius: 12px;
font-size: 15px;
font-weight: 600;
letter-spacing: 2px;
text-transform: uppercase;
font-family: var(--font-body);
animation: pulseCTA 3s ease-in-out infinite;
```

### RoundSummary CTA ("Nästa omgång →")
Samma som dashboard CTA men med `texture-leather` klass.

### Match CTA ("SPELA MATCHEN →")
`btn-copper` klass, `flex: 2`, `padding: 13px`.

---

## 14. STAGGER-ANIMATIONER

### RoundSummaryScreen
Element fadar in med fördröjning:
```typescript
const fadeIn = (i: number) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(12px)',
  transition: `all 0.35s ease ${80 + i * 60}ms`,
})
```

### Inbox
```css
animation: fadeInUp 200ms ease-out ${Math.min(index, 14) * 30}ms both;
```

### Spelarlista
Max 8 animerade:
```css
animation: index < 8 ? `fadeInUp 250ms ease-out ${index * 40}ms both` : 'none';
```

---

## 15. TABELL

### Positionspilar
Jämför mot FÖRRA OMGÅNGENS tabellposition (inte förra säsongen).
Beräknas via `calculateStandings()` med fixtures exkl. senaste omgången.
- ▲ grön = klättrat
- ▼ röd = fallit

### Zonindelning
- Position 1-3: accent border-left
- Position 4-8: svag accent border-left
- Position 9-10: transparent
- Position 11-12: danger border-left
- Slutspelsstrecket: divider efter pos 8
- Nedflyttning: divider efter pos 10

### Utfällning (klick på lag)
- Eget lag: visar V/O/F, gjorda/insläppta mål
- Andra lag: nästa möte, H2H denna säsong, karriärstatistik

---

## 16. ORTEN-TABBEN (KlubbTab)

### Sektionsordning
1. 🏠 Bygdens puls (stort nummer + bar + aktiviteter + funktionärsquote)
2. 👥 Mecenater (namn + business + happiness-bar + bidrag)
3. 🏛️ Kommun (namn + parti + agenda + relationsbar + knappar)
4. 🏟️ Anläggning & faciliteter (StatBar-rader + projekt)
5. 🎯 Förväntan & profil (förväntningar + spelstil + styrelsemål)
6. 📅 Säsongshistorik

### Mecenat och kommun — matchande typografi
Båda sektioner följer samma mönster:
- Namn: `fontSize: 13, fontWeight: 600`
- Undertext: `fontSize: 11, color: 'var(--text-muted)'`
- Bar: segmented bar (se avsnitt 11)
- Status/emoji högerställd

### Kommun-knappar
Tre knappar i flexrad med cooldown-hantering:
- Disabled om cooldown/redan använd
- Opacity 0.5 vid disabled
- Feedback visas inline (4 sekunder timeout)

### Dubbla parenteser
`polData.party` kan redan innehålla parenteser.
Kolla: `party.startsWith('(') ? party : \`(${party})\``

---

## 17. PEP-TALK (StartStep)

Atmosfärtext memoiseras med `useMemo([fixture?.id])` för att undvika
byte vid re-render (t.ex. vid live/snabbsim-toggle).

---

## 18. PLANVY (PITCH)

- Bakgrund: vit is-gradient (`#F5F1EB→#FAFAF8→#F0ECE4`)
- Spelarcirklar: `rgba(255,255,255,0.5)` fill, mörk text `#1A1A18`
- Ring-färg: grön (rätt position), orange (intill), röd (fel)
- Positionslabel OVANFÖR cirkeln, spelarnamn UNDER
- Tillräcklig höjd (PH ≥ 170) så cirklarna inte flyter ihop

---

## 19. BANDYSPECIFIKT

- 🏒 (inte ⚽) överallt
- Offside FINNS — ta aldrig bort
- Inga gula/röda kort — 10 min utvisning
- 2 poäng för vinst (inte 3)
- Termer: avslag, brytning, frislag, vaden (inte vadden)
- Positioner: MV, B (back), YH (ytterhalv), MF (mittfältare), A (anfallare)
- "Plan" — ALDRIG "rink" (rink = ishockey)
- Flygande byten (som ishockey, inga begränsade byten)
- Hörnor = centralt offensivt vapen

---

## 20. MATCHKOMMENTARER

- Kommentarer som antyder trötthet/tid ("publiken suckar", "klockan tickar") kräver minute ≥ 20
- Max EN texthändelse per minut
- Hörnmål ska vara tydligt separerade från missade hörnor

---

## 21. SegmentedControl-stil

Alla toggle/val-knappar (taktik, intensitet, budget, kontraktslängd):
- Bakgrunds-container med padding 3px, borderRadius 8
- Knappar med borderRadius 6, padding 8px
- Aktiv: `btn-copper` eller `background: rgba(196,122,58,0.2)`, border, accent color
- Inaktiv: transparent, `color: var(--text-muted)`

---

## 22. NAVIGATION / DEEP-LINKS

### Location state-mönster
Skärmar som ska öppna en specifik vy via navigation:
```typescript
navigate('/game/tabell', { state: { tab: 'cupen' } })
navigate('/game/club', { state: { tab: 'orten' } })
navigate('/game/squad', { state: { highlightPlayer: playerId } })
navigate('/game/transfers', { state: { highlightPlayer: playerId } })
```

Mottagande skärm läser state i `useEffect` och rensar med:
```typescript
window.history.replaceState({ ...window.history.state, usr: {} }, '')
```

### PlayerLink
Navigerar smart baserat på ägarskap:
- Egna spelare → `/game/squad` med `highlightPlayer`
- Andra lags spelare → `/game/transfers` med `highlightPlayer`
