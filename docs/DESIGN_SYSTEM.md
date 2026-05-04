# Bandy Manager — Design System

Dokumenterar de designprinciper och mönster som etablerats under utvecklingen. Alla nya vyer och ändringar MÅSTE följa dessa regler. Brott kräver omskrivning.

**Uppdaterad:** 14 april 2026

**Mockups:** Se `docs/mockups/` för visuella referensfiler (HTML). Öppna i webbläsaren. Implementera det du ser, inte vad du tror det ska se ut som.

---

## 1. LAYOUTPRINCIPER

### Tight, inte luftig
Spelet spelas på mobil (375px). Varje pixel vertikal plats är värdefull.

| Element | Mått | INTE |
|---------|------|------|
| Card padding | `10px 12px` | 14px 16px, 16px 20px |
| Card margin-bottom | `6px` (i grids), `4px` (enrader) | 8px, 10px, 12px |
| Gap i grids | `6px` | 8px, 10px |
| Gap i flex-columns | `4-6px` | 8px, 10px |
| Sektions-label marginBottom | `4-6px` | 8px, 10px |

### Ingen onödig rubrik
Skärmar via BottomNav ska INTE ha rubrik-rad. Undantag: hierarkisk navigering (SeasonSummary, MatchReport, History).

### Knappar
- Action-knappar: INTE fullbredd. `padding: '8px 16px'`, `borderRadius: 8`, högerställd
- CTA-knappar (Spela omgång, Välj taktik): FÅR vara fullbredd

### Knapphierarki

Klasser i `global.css`. Använd rätt klass för rätt syfte:

| Klass | Utseende | Användning | Regel |
|-------|----------|------------|-------|
| `.btn-primary` | Gradient `--accent-dark` → `--accent-deep` | Primär CTA (Spela, Bekräfta) | Max 1 per skärm |
| `.btn-secondary` | Solid `--accent` | Sekundär action (Välj, Sätt) | Fritt |
| `.btn-ghost` | `--bg-surface` + border | Val i listor/modals | Fritt |
| `.btn-outline` | Transparent + border | Neutral/Avbryt | Fritt |
| `.btn-cta` | Förstorar en primary till skärm-avslutande storlek | Stor fullbredds-CTA | Se nedan |

Alla knappar kombineras med `.btn` (bas-reset + flexbox + transition).

### Stor CTA (skärm-avslutande)

`.btn-cta` är modifier-klassen för den stora, ceremoniella CTA:n längst ner på en skärm — "Spela omgång", "Starta säsongen", "Kör igång!", "Acceptera uppdraget", "Spela matchen". **Kombineras alltid med `.btn .btn-primary`**:

```tsx
<button className="btn btn-primary btn-cta" onClick={...}>
  Spela omgång 1 →
</button>
```

Mått (definierade i global.css, ändra inte inline):
- `width: 100%` (fullbredd)
- `padding: 14px 16px`
- `font-size: 14px`, `font-weight: 700`, `letter-spacing: 1.5px`
- `text-transform: uppercase`
- `border-radius: 12px`

**Puls:** Lägg till `.btn-pulse` för pulserande uppmärksamhet (dashboard "redo"-state). Inte på andra skärmar.

**Disabled-state:** `.btn-cta:disabled` hanteras automatiskt (grey bg, muted text, ingen puls). Skicka `disabled`-prop direkt, behöver inte klassbyten.

**Förbjudet:** Inline-styling av padding/fontSize/fontWeight/letterSpacing/background/borderRadius på CTA. Bryter konsekvens (se Sprint 22.5 — fyra olika implementeringar identifierade).

**Legacy:** `.btn-copper` finns i global.css som dublett till `.btn-primary` (identisk CSS). Använd `.btn-primary`. Migrera `.btn-copper`-användningar vid tillfälle.

---

## 1b. NAV-BETEENDE — transition-skärmar

Dessa skärmar är ceremoniella övergångar (en eller få gånger per säsong) och ska **inte visa BottomNav**. Implementeras i `BottomNav.tsx` via `HIDDEN_PATHS`-listan:

- `/game/board-meeting` — styrelsemöte
- `/game/pre-season` — försäsong
- `/game/season-summary` — säsongsslut
- `/game/playoff-intro` — slutspelsintro
- `/game/qf-summary` — kvartsfinalsammanfattning
- `/game/champion` — SM-guld
- `/game/game-over` — sparkad

Mönstret: skärmar som **inte har någon funktion** utan krattar för nästa fas. Nav skulle bara vilseleda. Skärmen slutförs via sin egen `.btn-cta`.

GameHeader och PhaseIndicator döljs redan på samma skärmar (se §8).

---

## 2. KORTSYSTEM

### `card-sharp` (standard — ALL information)
```tsx
<div className="card-sharp" style={{ padding: '10px 12px' }}>
```
Enraders-kort: `padding: '7px 10px'`

### `card-round` (atmosfär — BARA citat/stämning)
```tsx
<div className="card-round" style={{ padding: '8px 12px' }}>
```
Används för: dagboken, funktionärsquotes, pep-talk. INTE för funktionella kort.

### INGA andra korttyper
Inga inline borderRadius. Inga egna border/background. CSS-klassen sköter allt.

### Sektions-labels
```tsx
<p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
  💰 EKONOMI
</p>
```
fontSize **8** (inte 9). letterSpacing **2px** (inte 2.5px). Alltid med emoji.

### ›-knapp (navigeringsknapp)
```tsx
<button style={{
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--accent)', fontSize: 11, lineHeight: 1,
  cursor: 'pointer',
}}>›</button>
```
**16×16px.** Exakt denna styling. Kopiera. Ändra inget.

### Emoji-konventioner
| Emoji | Betydelse |
|-------|-----------|
| 🏒 | Match/spel (ALDRIG ⚽) |
| 💰 | Ekonomi |
| 👥 | Trupp |
| 👤 | Patron |
| 🏋️ | Träning |
| 🏠 | Bygdens puls |
| 🏘️ | Orten |
| 🏛️ | Kommun |
| 🏟️ | Anläggning |
| 🏆 | Cup |
| ⚔️ | Topp 8 / Slutspel |
| 📬 | Inkorg |
| 🩹 | Skador |
| 🎓 | Akademi |
| 🔍 | Scouting |
| 📋 | Kontrakt / Styrelsens uppdrag |
| 💼 | Transfers/Bud |
| 🔥 | Derby |
| ⭐ | Betyg/Prestation |
| 📊 | Tabell |
| 📈 | Form |
| 🩺 | Bandydoktorn |
| 📖 | Spelguide |
| 📣 | Pep-talk |
| 🎤 | Presskonferens |

---

## 3. OMGÅNGSCYKELN — Förbered → Spela → Granska

### Fasindikator (PhaseIndicator)
Placeras i GameShell under GameHeader. ALLTID synlig. Mörk bakgrund (del av header-zonen).

Tre prickar + labels + linjer. States:
- **done**: filled copper, copper text
- **active**: copper border + glow, bold copper text
- **pending**: faint border, faint text

Fas bestäms av route:
```typescript
'/match' → 'play'
'/review' → 'review'
allt annat → 'prepare'
```

Renderas INTE under: intro, new-game, board-meeting, pre-season, champion, game-over, season-summary.

Se mockup: `docs/mockups/round_cycle_mockup.html`

---

## 4. PORTAL — Förbered-fasen

**Uppdaterad:** 2026-04-30 (efter SPEC_PORTAL_FAS_1 + Fas_2 + BESLUTSEKONOMI Steg 2-3)

Dashboard från tidigare designsystem är ersatt av Portal — en bag-of-cards som plockar relevanta kort baserat på speltillstånd, inte en fast 2×2-grid.

### Layout (uppifrån och ner)

Portal renderar i denna ordning (se `PortalScreen.tsx`):

1. **SituationCard** — kontextuell rubrik om vad som väntar (cup, derby, slutspur). Bygger meningar av 1-3 fragment baserat på state. Always renderas.
2. **PortalBeat** — engångs-narrativa nedslag (säsongspremiär, första derby, halvtid, fönster öppnar). En åt gången, dismissable. Visas bara när trigger matchar.
3. **PortalEventSlot** — visar nästa event från kön (medium/atmospheric). Kritiska events går via EventOverlay i GameShell, inte här. Tom när kön är tom.
4. **Primary card** — den viktigaste single-purpose-vyn för rundan. Plockas av `buildPortal` från card-bag. NextMatchPrimary, DerbyPrimary, CupPrimary, etc.
5. **Secondary section** — 2-kolumns grid med 0-3 kontextuella kort. Plockas av buildPortal från en pool av 9: TabellSecondary, EkonomiSecondary, KlackenSecondary, OpponentFormSecondary, InjuryStatusSecondary, OpenBidsSecondary, JournalistSecondary, CoffeeRoomSecondary, SeasonSignatureSecondary. Kort med `gridColumn: span 2` (ex SeasonSignatureSecondary) tar full bredd.
6. **Minimal bar** — kompakt rad med trupp/form/kassa-snapshot.
7. **Sticky CTA** — fixerad ovanför BottomNav, alltid synlig ("Spela omgång N →").

### Bag-of-cards-principen

Primary och secondary plockas dynamiskt av `buildPortal(game, seed)`:
- Varje kort har en trigger (pure function `(game) => boolean`)
- Kort som triggar är kandidater
- Bland kandidater väljs det med högst prioritet för primary
- 0-3 secondary plockas baserat på vilka som triggar
- Inget visas som inte är relevant just denna runda

Det är *motsatsen* till gamla 2×2-griden där samma fyra kort (Tabell, Senast, Orten, Ekonomi) alltid visades. Nu är Portal *kontextuell* — tabellen visas när tabellen säger något, inte alltid.

### Seasonal tone

`getSeasonalTone(date)` sätter CSS-vars (`--bg-portal`, `--bg-portal-elevated`, `--accent-portal`) som glider över säsongen:
- Tidigt (september-oktober): mörkblå med kopparton
- Sent vintern (januari-februari): isigt med blåare accent
- Vår (mars-april): lite varmare igen

Alla Portal-kort använder dessa variabler. Ingen hårdkodning.

### Nudge-stöd (Fas 2)

`PortalBeat` och secondary-cards kan inkludera nudge-uppmaningar ("Sätt lineup för derbyt →"). Inte separata kort som tidigare. Inga separata "agenda-listor".

---

## 5. GRANSKA-FASEN (GranskaScreen)

### Route: `/game/review`

Ersätter MatchResultScreen + RoundSummaryScreen. EN vy med allt post-match.

### Layout
1. **Resultat-hero** — "SLUTRESULTAT", score 36px Georgia 800, vinst/förlust-pill, POTM, attendance
2. **Nyckelmoment** — mini-timeline (hem vänster, borta höger)
3. **Events inline** — presskonferens och andra events som kort med val. Kollapsar till ✓ vid val.
4. **Omgångssammanfattning** — rader med FÖRÄNDRING ("7 → 6 ↑", "+8 400 kr", "72 → 74 ↑"). Klickbara → deep-link.
5. **Andra matcher** — vinnande lag bold (inte "relevanta" lag)
6. **CTA** — "Nästa omgång →" (primär) + "Se fullständig matchrapport →" (ghost)

### Inline events
INTE overlay. Kort med val-knappar. resolveEvent() direkt vid klick. Ohanterade events → carry over till dashboard.

### EventOverlay blockering
EventOverlay renderas INTE under `/game/review`:
```typescript
const isReviewScreen = location.pathname === '/game/review'
if (isReviewScreen) return null
```

Se mockup: `docs/mockups/round_cycle_mockup.html` (fas ③)

---

## 6. TAKTIKVY — Interaktiv pitch

### TacticPreview.tsx
11 prickar (5-3-2) på en isyta. Reagerar i realtid på taktikval.

**Sticky:** position sticky, top 0, z-index 5. Scrollar inte bort.

**Prickar:** 14px, koppar (#8b7332), 2px vit border, box-shadow. GK grön.

**Effekter per taktikval:**
| Inställning | Effekt |
|-------------|--------|
| Mentalitet offensiv | Hela laget glider uppåt |
| Mentalitet defensiv | Kompakt bakåt |
| Bredd bred | Prickar sprider ut horisontellt |
| Bredd smal | Prickar klumpar centralt |
| Press hög | Försvarslinjen skjuts uppåt |
| Press låg | Djupt försvar |
| Anfallsfokus kanter | Anfallare + ytterhalvar breddar |
| Anfallsfokus centralt | Anfallare klumpar ihop |

**Animation:** `transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`

**Konsekvens-taggar** under relevanta val:
```tsx
<span className="con-tag con-pos">+10% försvar</span>
<span className="con-tag con-neg">-15% skottchanser</span>
```

Se mockup: `docs/mockups/tactic_view_mockup.html`

---

## 7. MATCH — Slutsignal

Vid matchDone:
1. Auto-scroll stannar
2. "Domaren blåser av!" infogad i feeden (13px bold + 2-3 raders sammanfattning)
3. "Se sammanfattning →" knapp UNDER feeden (inte overlay)
4. Spelaren kan scrolla upp och läsa hela matchen
5. MatchDoneOverlay renderas INTE — ersatt av in-feed slutsignal

---

## 8. GLOBAL HEADER (GameHeader) + FASINDIKATOR

Mörk bakgrund. Två rader:
1. Logotyp | Klubbnamn + "Namn · Säsong · Omg X" | 🔔 ⚙
2. **PhaseIndicator** — Förbered → Spela → Granska (se avsnitt 3)

---

## 9. FÄRGSYSTEM

ENBART CSS-variabler. **Noll tolerans för hårdkodade hex-koder.**

| Variabel | Användning |
|----------|-----------|
| `var(--accent)` | Copper, primär accent |
| `var(--accent-dark)` | Mörkare copper |
| `var(--accent-deep)` | Djupaste copper (CTA) |
| `var(--success)` | Grön (vinst, positiv) |
| `var(--danger)` | Röd (förlust, skada) |
| `var(--warning)` | Orange (varning) |
| `var(--ice)` | Isblå (väder, borta) |
| `var(--text-primary)` | Huvudtext |
| `var(--text-secondary)` | Sekundärtext |
| `var(--text-muted)` | Svag text, labels |
| `var(--text-light)` | Ljus text på mörk bg |
| `var(--bg)` | Huvudbakgrund |
| `var(--bg-surface)` | Kortbakgrund |
| `var(--bg-elevated)` | Upphöjd bakgrund |
| `var(--bg-dark)` | Mörk bakgrund |
| `var(--border)` | Kantlinje |
| `var(--border-dark)` | Mörkare kantlinje |
| `var(--font-display)` | Georgia — siffror, rubriker, citat |
| `var(--font-body)` | system-ui — allt annat |

### Verifiering
```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/ --include="*.tsx" | grep -v node_modules | grep -v ".svg"
```
Ska returnera NOLL rader (utom SVG-illustrationer).

---

## 10. TYPOGRAFI

| Användning | Font | Storlek | Vikt |
|------------|------|---------|------|
| Sektions-label | body | 8px | 600 |
| Brödtext | body | 11-12px | 400 |
| Kort-rubrik | body | 13-14px | 600-700 |
| Stora siffror (poäng, score) | display | 22-36px | 400-800 |
| Matchresultat | display | 36px | 800 |
| Tabellposition | display | 22-30px | 400 |
| Ekonomi-siffra | display | 14-18px | 500-700 |

---

## 11. OVERLAYS & MODALER

Centrerade, INTE bottom-sheets.

```css
backdrop: rgba(0,0,0,0.6)
align-items: center (centrerad)
kort: var(--bg), borderRadius 12, max-width 380px
```

| Overlay | zIndex |
|---------|--------|
| EventOverlay | 300 |
| SubstitutionModal | 600 |
| MatchDoneOverlay | 200 |

---

## 12. FORMGUIDE

Komponent: `FormSquares` / `FormDots`. Data: `getFormResults()`.
Nyast till VÄNSTER. Tap-tooltip med resultat + motståndare.

| Variant | Storlek | Var |
|---------|---------|-----|
| Dots | 8px | TabellScreen |
| Squares | 22px | RoundSummaryScreen |
| Squares | 10-14px | Dashboard |

---

## 13. MATCHRESULTAT — Score-färg + Flavor text

Se avsnitt 5 (GranskaScreen). Per-lag-färger vid OT/straffar.

### Andra matcher (i GranskaScreen)
Vinnande lag = bold 700, `var(--text-primary)`.
Förlorande lag = normal 400, `var(--text-muted)`.
Oavgjort = båda 400.

INTE "relevanta lag" bold — det är förvirrande.

---

## 14. SPELARPORTRÄTT

```tsx
<img
  src={getPortraitPath(player.id, player.age)}
  style={{
    width: 36, height: 36, borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'center 20%',  // Centrera ansiktet, inte mitten av bilden
    border: '2px solid var(--border)',
  }}
/>
```

`object-position: center 20%` — ansiktet sitter ofta i övre tredjedelen av bilden.

---

## 15. MECENAT & PATRON

### Terminologi
- **Patron** = enskild maktfigur (en per klubb). Label: "PATRON" + typ ("Brukspatron", "IT-entreprenör" etc.)
- **Mecenat** = bidragsgivare (kan vara flera). Label: "MECENATER"

### Generering
- 50% chans kvinnor (`rand() < 0.5`)
- Varje mecenat har `backstory` — en rad om bakgrund

### Orten-vy
Patron-kort och mecenat-kort ska visa backstory:
```tsx
{mecenat.backstory && (
  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
    {mecenat.backstory}
  </p>
)}
```

---

## 16. NUDGE-NAVIGERING

Nudges navigerar till RÄTT skärm:
| Nudge | Navigerar till |
|-------|---------------|
| Kontrollera truppen | /game/squad |
| Förläng kontrakt | /game/squad (INTE /game/transfers) |
| Styrelseuppdrag: Fan mood | /game/club med tab 'orten' (INTE 'training') |
| Styrelseuppdrag: Ekonomi | /game/club med tab 'ekonomi' |
| Scouting | /game/transfers |

---

## 17. LINEUP-STATES (Dashboard)

Tre states i NextMatchCard:

| State | Tag-text | Klass | Pulse |
|-------|----------|-------|-------|
| Ingen lineup | "Välj trupp" | tag-copper | ja |
| Auto-carryover | "Förra uppst." | tag-outline | nej |
| Aktivt vald | "Redo ✓" | tag-green | nej |

Trackas via `lineupConfirmedThisRound` i SaveGame.

---

## 18. BANDYSPECIFIKT

- 🏒 (inte ⚽) överallt
- Inga gula/röda kort — 10 min utvisning
- 2 poäng för vinst
- Positioner: MV, B, YH, MF, A
- "Plan" — ALDRIG "rink"
- Flygande byten
- Hörnor = centralt offensivt vapen

---

## 19. VERIFIERING — obligatorisk efter varje implementationssteg

### Statisk analys (grep)

```bash
# Inga hardkodade hex:
grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/ --include="*.tsx" | grep -v node_modules | grep -v ".svg"

# card-sharp/card-round används (inte inline borderRadius):
grep -n "borderRadius:" src/presentation/screens/*.tsx | grep -v "tab\|button\|nudge\|bar\|pill\|99\|50%\|cta\|phase\|pitch"

# Alla sektions-labels har rätt format:
grep -B1 "letterSpacing" src/presentation/screens/*.tsx src/presentation/components/dashboard/*.tsx

# fontSize under 8 (för litet):
grep -n "fontSize: [0-7][^0-9]" src/presentation/screens/*.tsx

# Build + tester:
npm run build && npm test
```

### Runtime-audit (browser)

Finns som `window.__designAudit()` i dev-läge och Vercel preview (`VITE_AUDIT_ENABLED=true`).

```js
// Kör alla regler, returnera JSON-rapport
await window.__designAudit()

// Kör och skriv ut läsbart text-format
await window.__designAudit({ format: 'text' })

// Kör bara specifika regler
await window.__designAudit({ rules: ['cardPadding', 'hexColors'] })

// Rensa console-bufferten
window.__clearAuditBuffer()
```

**Regler:** `cardPadding`, `sectionLabels`, `hexColors`, `gridGaps`, `chevronButtons`,
`emojiConsistency`, `fontSizes`, `overlaps`, `consoleErrors`

**Källkod:** `src/debug/designAudit/`

**Körtid:** Navigera till önskad skärm i appen, kör sedan `window.__designAudit({ format: 'text' })` i DevTools-konsolen.

---

## 20. MOCKUPS — referensfiler

| Fil | Beskrivning |
|-----|-------------|
| `docs/mockups/round_cycle_mockup.html` | Hela omgångscykeln: Förbered → Spela → Granska |
| `docs/mockups/tactic_view_mockup.html` | Interaktiv taktikvy med rörliga prickar |
| `docs/mockups/sprint_allt_kvar_mockups.html` | Straffinteraktion, cup-progress, kapten, arenanamn i UI |
| `docs/mockups/onboarding_mockup.html` | Coach marks overlay-design |

Öppna i webbläsaren. Implementera det du ser.
