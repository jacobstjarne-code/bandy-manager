# CODE — EventCardInline-anatomi + Cup-stake-text

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** SPEC — två trivial-fixar i Dashboard

---

## Bakgrund

Två observationer från playtest:

1. **EventCardInline följer inte Stålvallen-anatomi.** Komponenten har full ram (1px border runt hela kortet) medan portal/secondary-cards har vänster-stripe + tunn copper-tonad border. Inkonsekvens från BATCH C-refactor som missades.
2. **"Vinst ger semi"-mönstret är AI-cliché.** "Vinst ger X" upprepas i fyra cup-rundor. Mer korrekt och mindre AI-aktigt: "Avancemang till X vid vinst".

Båda är trivial-fixar (~30 min totalt).

---

## FIX-10 · EventCardInline anpassas till Stålvallen-anatomi

**Fil:** `src/presentation/components/portal/EventCardInline.tsx`

### Nuvarande styling

```tsx
<div style={{
  margin: '0 0 8px 0',
  background: 'var(--bg-portal-surface, var(--bg-elevated))',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
}}>
```

### Önskad styling

Anpassa till samma anatomi som `BoardObjectivesSecondary` / `WeeklyDecisionSecondary` / `ActiveArcsSecondary` från BATCH C:

```tsx
<div
  className="event-card-inline"
  style={{
    position: 'relative',
    margin: '0 0 8px 0',
    background: 'var(--bg-portal-surface)',
    border: '1px solid rgba(196,122,58,0.15)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px 14px 18px',
  }}
>
  {/* Stripe — absolut-positionerad div, 2px copper */}
  <div style={{
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    background: 'var(--copper)',
  }} />
  
  {/* ... existerande innehåll ... */}
</div>
```

### Eyebrow-label-styling

Den existerande `getEventTypeLabel`-output (t.ex. "🏘️ ORTEN", "📋 HÄNDELSE") ska rendras med samma typografi som secondary-cards:

```tsx
<p style={{
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--copper)',
  opacity: 0.85,
  marginBottom: 10,
}}>
  {typeLabel}
</p>
```

**Notera:** befintlig logik `labelColor` (priority-baserad — copper vs muted) tas bort i favör av en konsekvent copper-stil. Priority-signalen kan tas tillbaka senare via t.ex. olika stripe-tjocklek, men v1 hålls enkel.

### Body-text

Behålls i Georgia 13px italic. Knapprad behålls. Räknarrad behålls.

### Klassnamn-konvention

Behåll className `"event-card-inline"` så CSS kan kopplas senare om vi vill flytta från inline-styles till klassbaserad styling (samma princip som FIX-05 från Stålvallen-refactor).

---

## FIX-11 · Cup-stake-text till "Avancemang till X vid vinst"

**Fil:** `src/domain/services/situationFragments.ts`, funktion `getCupStakeFragment`

### Nuvarande

```ts
export function getCupStakeFragment(game: SaveGame): string | null {
  // ... existerande logik ...

  const round = cupMatch.round
  if (round === 1) return `Vinst ger kvartsfinal — fyra lag kvar.`
  if (round === 2) return `Vinst ger semi.`
  if (round === 3) return `Vinst ger final.`
  if (round === 4) return `Det här är finalen. Det finns inget mer.`
  return null
}
```

### Önskad

```ts
export function getCupStakeFragment(game: SaveGame): string | null {
  // ... existerande logik ...

  const round = cupMatch.round
  if (round === 1) return `Avancemang till kvartsfinal vid vinst — fyra lag kvar.`
  if (round === 2) return `Avancemang till semi vid vinst.`
  if (round === 3) return `Avancemang till final vid vinst.`
  if (round === 4) return `Det här är finalen. Det finns inget mer.`
  return null
}
```

Round 4 lämnas oförändrad (har egen tonalitet — det är finalen, inte ett avancemang till nästa).

---

## Acceptanskriterier

- [ ] EventCardInline har vänster-stripe (2px copper) + copper-tonad border + monospace eyebrow
- [ ] Visuell konsekvens med portal/secondary-cards
- [ ] Cup-stake-fragmenten använder "Avancemang till X vid vinst"-mönstret för rundor 1-3
- [ ] Round 4 oförändrad
- [ ] Befintliga tester gröna
- [ ] Manuell verifiering: öppna Dashboard, se HÄNDELSE-kort i Stålvallen-stil + cup-stake-text uppdaterad

---

## Vad du INTE ska göra

- **Inte ändra** `getEventTypeLabel`-funktionen eller listan av event-typer
- **Inte uppfinna** ny styling utöver vad som finns i existerande secondary-cards
- **Inte ta bort** priority-prop från event-typen — den används av andra delar av koden
- **Inte ändra** round 4-texten ("Det här är finalen. Det finns inget mer.")

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. En commit räcker.
