# SPRINT 17 — DESIGN-KOMPONENTER & KOSMETIK

**Typ:** Design-infrastruktur + kosmetiska fixar
**Uppskattad tid:** 4–6h
**Princip:** Grundblock som resten av sprintarna bygger på. Gör först.

---

## 17A — Komponentbibliotek (5 komponenter)

Skapa `src/presentation/components/primitives/` med följande komponenter. Alla måste använda CSS-variabler från `global.css`, inga hårdkodade färger.

### InfoRow (stil B)

Ersätter lokala InfoRow-implementationer (t.ex. i KlubbTab.tsx).

**Layout per rad:**
- 9px uppercase sans-serif label (color: `var(--text-muted)`)
- 12px Georgia value (regular weight — INTE bold) höger-alignad
- 0.5px divider-linje under varje rad (color: `var(--divider)`)
- Padding: `6px 0` vertikalt, inga horisontella paddings (styrs av förälder)

**Props:**
```typescript
interface InfoRowProps {
  label: string
  value: React.ReactNode  // kan vara sträng, nummer eller JSX (för t.ex. progressbar under)
  divider?: boolean  // default: true
}
```

**Användning:**
```tsx
<InfoRow label="KLUBBRENOMMÉ" value="68 / 100" />
<InfoRow label="STYRELSENS FÖRVÄNTNING" value="Utmana toppen" />
```

### StatBadge

För stor siffra med uppercase-label.

**Layout:**
- Georgia 28px nummer
- 9px uppercase sans-serif label under
- Centrerad

**Props:**
```typescript
interface StatBadgeProps {
  value: string | number
  label: string
  tone?: 'neutral' | 'accent' | 'success' | 'danger'  // färg på nummer
}
```

### PageSection

Wrapper för sektion med label-rubrik.

**Layout:**
- 12px marginBottom
- Valfri label-rubrik via `title` prop (9px uppercase, color: `var(--text-muted)`, marginBottom 12px)

**Props:**
```typescript
interface PageSectionProps {
  title?: string
  children: React.ReactNode
}
```

### PositionTag

För positionsförkortning (MV, B, MF, YH, YV, A) med färgkodning.

**Layout:**
- 3px borderRadius
- 15% opacity bakgrund med positionsfärg
- Mörk textfärg matchande positionen
- Padding varierar på storlek

**Props:**
```typescript
interface PositionTagProps {
  position: 'MV' | 'B' | 'MF' | 'YH' | 'YV' | 'A'
  size?: 'sm' | 'md'  // sm=10px, md=11px
}
```

**Färgmappning:**
- MV: copper (var(--accent))
- B: red (var(--danger))
- MF: green (var(--success))
- YH/YV: ice blue (var(--ice))
- A: copper

Lägg till `--ice: #7EB3D4` i global.css om inte redan finns.

### OverlayBackdrop

För modaler och overlays.

**Layout:**
- position: fixed
- inset: 0
- background: rgba(0,0,0,0.55)
- zIndex: 300
- Centrerar children via flex

**Props:**
```typescript
interface OverlayBackdropProps {
  onClose?: () => void  // backdrop-klick stänger
  children: React.ReactNode
}
```

### Index-fil

Skapa `src/presentation/components/primitives/index.ts` som exporterar allt:
```typescript
export { InfoRow } from './InfoRow'
export { StatBadge } from './StatBadge'
export { PageSection } from './PageSection'
export { PositionTag } from './PositionTag'
export { OverlayBackdrop } from './OverlayBackdrop'
```

### Migreringsuppgift

Gå igenom kodbasen och ersätt lokala InfoRow-implementationer med den nya. Speciellt:
- `KlubbTab.tsx` (har en lokal InfoRow)
- `Förväntan & Profil`-kortet (skapas i Sprint 19)

---

## 17B — Font tokens som utility classes

**Nuläge:** Typografi sätts ofta inline med `fontSize: 12` etc.

**Åtgärd:** Lägg till utility classes i `global.css` för de 9 storlekarna vi använder:

```css
/* Display/numeric (Georgia) */
.text-display-xl { font-family: var(--font-display); font-size: 44px; }
.text-display-lg { font-family: var(--font-display); font-size: 28px; }
.text-display-md { font-family: var(--font-display); font-size: 20px; }

/* Body (Georgia för citat/värden, sans-serif för övrigt) */
.text-body-md { font-size: 13px; }
.text-body-sm { font-size: 12px; }
.text-body-xs { font-size: 11px; }
.text-body-xxs { font-size: 10px; }

/* Labels (sans-serif, uppercase) */
.text-label { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); }

/* Italic för citat */
.text-quote { font-family: var(--font-display); font-style: italic; font-size: 12px; color: var(--text-secondary); }
```

Tidigare var det 11 storlekar — vi förenklar till 9 genom att ta bort `text-body-lg` (14px) och `text-micro` (8px). Använd inte de två storlekarna.

---

## 17C — Knappstil verifikation (variant B)

**Nuläge:** Befintliga `.btn-primary`, `.btn-copper` osv i global.css.

**Åtgärd:** Verifiera att dessa har:
- Vertikal gradient `#DD9555` → `#8B4820` (top → bottom)
- White highlight overlay på top 50% (linear-gradient, rgba(255,255,255,0.35) fade till transparent)
- 5px copper-tinted drop shadow: `0 3px 5px rgba(162,88,40,0.38)`
- `:active` ger `translateY(1px)` + reducerad shadow

Om inte — uppdatera till denna stil. **Ändra inte klassnamnen.**

Gå även igenom kodbasen och konvertera inline-styled knappar i overlays/modaler till dessa klasser:
- `HalftimeModal.tsx`
- `EventOverlay`
- Match-interaktioner (CornerInteraction m.fl. har inline CTA — ersätt med `.btn-primary`)

---

## 17D — Arena-suffix-regel

**Nuläge:** Stadium-namn visas som bara `"Bastionen"` eller `"Edsbyn Arena"`.

**Åtgärd:** Lägg till helper i `src/domain/services/` (eller lämplig util):

```typescript
// src/domain/utils/arenaName.ts
export function formatArenaName(stadium: string): string {
  if (!stadium) return ''
  const lower = stadium.toLowerCase()
  const alreadyHasSuffix =
    lower.endsWith(' arena') ||
    lower.endsWith('vallen') ||
    lower.endsWith('hallen') ||
    lower.endsWith('planen')
  return alreadyHasSuffix ? stadium : `${stadium} arena`
}
```

**Exempel:**
- `"Bastionen"` → `"Bastionen arena"`
- `"Edsbyn Arena"` → `"Edsbyn Arena"` (oförändrad)
- `"Hyttvallen"` → `"Hyttvallen"` (oförändrad)

**Applicera i:**
- `MatchReportView.tsx` — "Spelades på X"
- `NextMatchCard` / dashboard compact row
- `MatchHeader.tsx` där stadium visas
- Alla andra ställen där stadium-namn renderas

Sök `club.stadium` och `fixture.venue` i kodbasen.

---

## 17E — Spelarporträtt: transparent bakgrund + centrering

**Nuläge:** `svgPortraitService.ts` genererar SVG med svart eller annan färgad bakgrund. Ansiktet är ibland felcentrerat.

**Åtgärd i `svgPortraitService.ts`:**

1. Ta bort `<rect>`-bakgrunden i SVG-output. Porträttet ska vara transparent.
2. Verifiera att ansikte är centrerat i viewBox (symmetriskt kring cx/cy — huvud, ögon, mun ska vara på mittlinjen).
3. Uppdatera hår/skägg-positionering om nödvändigt för att inte klippas.

**Cirkel-wrappern i listan** (där porträttet visas) ska ha ljus bakgrund via CSS-variabel:
```tsx
<div style={{ background: 'var(--bg-surface)', borderRadius: '50%' }}>
  {/* portrait SVG */}
</div>
```

Hitta alla ställen porträttet renderas (sök `generatePlayerPortrait` i presentation/) och säkerställ att wrappern är uppdaterad.

---

## 17F — Klack-händelse badge: leather-bar ovanpå kortet

**Nuläge:** "HÄNDELSE"-badge flyter som liten pill uppe i kortet och överlappar metadata.

**Åtgärd:** Byt design till en tunn kopparfärgad leather-bar (22px hög) överst på kortet.

**Layout:**
```tsx
<div className="card-sharp" style={{ padding: 0, overflow: 'hidden' }}>
  {/* Leather-bar top */}
  <div style={{
    background: 'var(--accent)',
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
  }}>
    <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '2px' }}>
      HÄNDELSE
    </span>
    <span style={{ color: '#fff', fontSize: 9, opacity: 0.8, letterSpacing: '1px' }}>
      OMG {round} · {date}
    </span>
  </div>
  {/* Content */}
  <div style={{ padding: '10px 12px' }}>
    {/* Rubrik + metadata + body */}
  </div>
</div>
```

**Applicera på:**
- Klackens händelser i Ort/Klack-skärmen
- Andra ställen där "HÄNDELSE"-badges används

Metadata (som "grundad 2026") flyttas ner till content-området och syns ostört.

---

## Acceptanskriterier

- [ ] Fem primitiva komponenter finns i `src/presentation/components/primitives/` och exporteras från `index.ts`
- [ ] Font tokens finns som utility classes i `global.css`
- [ ] Knapp-CSS verifierad — gradient, highlight, shadow, :active
- [ ] `formatArenaName` applicerad överallt stadium visas
- [ ] Porträtt transparent + centrerade, cirkel-wrapper ljus bakgrund
- [ ] Klack-händelse badges redesignade som leather-bar
- [ ] Inga visuella regressioner i befintliga skärmar
- [ ] Lokal InfoRow i `KlubbTab.tsx` ersatt med primitiven

---

## Filer som ändras/skapas

**Nya:**
- `src/presentation/components/primitives/InfoRow.tsx`
- `src/presentation/components/primitives/StatBadge.tsx`
- `src/presentation/components/primitives/PageSection.tsx`
- `src/presentation/components/primitives/PositionTag.tsx`
- `src/presentation/components/primitives/OverlayBackdrop.tsx`
- `src/presentation/components/primitives/index.ts`
- `src/domain/utils/arenaName.ts`

**Ändras:**
- `src/styles/global.css` (utility classes, ev. knapp-verifikation, `--ice` variabel)
- `src/domain/services/svgPortraitService.ts` (transparent bg, centrering)
- `src/presentation/components/club/KlubbTab.tsx` (använd ny InfoRow)
- `src/presentation/components/match/MatchReportView.tsx` (arena-suffix)
- `src/presentation/components/match/MatchHeader.tsx` (arena-suffix)
- `src/presentation/components/common/NextMatchCard.tsx` (arena-suffix)
- Alla filer som renderar klack-händelse-kort
- Match-interaktionsfiler (CornerInteraction m.fl.) — byt inline CTA till `.btn-primary`
