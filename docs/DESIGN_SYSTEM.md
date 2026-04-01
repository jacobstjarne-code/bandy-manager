# Bandy Manager — Design System

Dokumenterar de designprinciper och mönster som etablerats under utvecklingen. Alla nya vyer och ändringar ska följa dessa regler.

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

---

## 2. KORTSYSTEM

### `card-sharp` (standard)
Alla informationskort ska använda CSS-klassen `card-sharp`. INTE inline `borderRadius: 12` med egna borders.

```tsx
<div className="card-sharp" style={{ padding: '10px 14px' }}>
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
- 🏒 Match/spel
- 💰 Ekonomi
- 👥 Trupp
- 🏋️ Träning
- 🏘️ Orten/Lokalstöd
- 🏆 Cup/Slutspel
- 📬 Inkorg
- 🩹 Skador
- 🎓 Akademi
- 🔄 Utlånade
- 🔍 Scouting
- 📋 Kontrakt
- 💼 Transfers/Bud
- 🔥 Derby
- ⭐ Betyg/Prestation

### ›-knapp
Varje kort som leder vidare har en `›`-knapp: 18×18px, transparent bg, 1px border `var(--border)`, copper accent text, borderRadius 4.

---

## 3. GLOBAL HEADER (GameHeader)

Mörk bakgrund (`var(--bg-dark)`), copper accent underline.

Layout:
```
BANDY MANAGER (vänster)     [badge] Klubbnamn (höger)
                            spelarnamn · säsong · Omg X
```

- "BANDY MANAGER": font-display, 12px, letterSpacing 2.5px, `rgba(245,241,235,0.7)` (INTE lägre)
- Spelarinfo: 10px, `rgba(245,241,235,0.65)` (INTE lägre)
- Alla skärmar som har GameHeader ska använda den EXAKT — ingen custom variant

---

## 4. FÄRGSYSTEM

Använd ENBART CSS-variabler:
- `var(--accent)` — copper, primär accent
- `var(--accent-dark)` — mörkare copper
- `var(--success)` — grön (vinst, positiv)
- `var(--danger)` — röd (förlust, skada, negativ)
- `var(--warning)` — orange/gul (varning)
- `var(--text-primary)` — huvudtext
- `var(--text-secondary)` — sekundärtext
- `var(--text-muted)` — svag text, labels
- `var(--bg)` — huvudbakgrund
- `var(--bg-surface)` — kortbakgrund
- `var(--bg-elevated)` — upphöjd bakgrund
- `var(--bg-dark)` — mörk bakgrund (header)
- `var(--border)` — kantlinje
- `var(--ice)` — isblå (väder, borta-match)

**Noll tolerans** för hårdkodade färger (#22c55e, #f59e0b, etc.)

---

## 5. TYPOGRAFI

- `var(--font-display)` — rubriker, klubbnamn, poäng
- `var(--font-body)` (system-ui) — brödtext, labels, knappar

Storlekar:
- Sektions-label: 9-10px uppercase
- Brödtext: 12-13px
- Rubriker i kort: 14-15px
- Stora siffror (poäng): 22-32px
- Sidrubriker: 18-22px

---

## 6. OVERLAYS & MODALER

Events, MatchDone och liknande ska vara **overlays** — inte egna routes.

- Bakgrund: `rgba(0,0,0,0.6)`, `position: fixed`, `inset: 0`
- Kort: solid bakgrund (`#F5F1EB` eller `var(--bg-surface)`), INTE transparent
- zIndex: EventOverlay 300, MatchDoneOverlay 200
- Renderas via en gemensam plats (GameShell), INTE via `navigate()`

---

## 7. PLANVY (PITCH)

- Bakgrund: vit is-gradient (`#F5F1EB→#FAFAF8→#F0ECE4`)
- Spelarcirklar: `rgba(255,255,255,0.5)` fill, mörk text `#1A1A18`
- Ring-färg: grön (rätt position), orange (intill), röd (fel)
- Positionslabel OVANFÖR cirkeln, spelarnamn UNDER
- Tillräcklig höjd (PH ≥ 170) så cirklarna inte flyter ihop
- Alla formationer (5-3-2, 3-3-4, etc.) måste kontrolleras för överlapp

---

## 8. BANDYSPECIFIKT

- 🏒 (inte ⚽) överallt
- Offside FINNS — ta aldrig bort
- Inga gula/röda kort — 10 min utvisning
- 2 poäng för vinst
- Termer: avslag, brytning, frislag, vaden
- Positioner: MV, DEF, HALF, FWD

---

## 9. MATCHKOMMENTARER

- Kommentarer som antyder trötthet/tid ("publiken suckar", "klockan tickar") kräver minute ≥ 20
- Max EN texthändelse per minut — om corner + mål på samma minut, visa bara målet
- Hörnmål ska vara tydligt separerade från missade hörnor

---

## 10. SegmentedControl-stil

Alla toggle/val-knappar (taktik, intensitet, budget) ska använda samma rundade SegmentedControl-stil:
- Bakgrunds-container med padding 3px, borderRadius 8
- Knappar med borderRadius 6, padding 8px
- Aktiv: `background: rgba(196,122,58,0.2)`, `border: 1px solid rgba(196,122,58,0.4)`, `color: var(--accent)`
- Inaktiv: transparent, `color: var(--text-muted)`
