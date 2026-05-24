# CODE — LineupStep refactor + FORMATIONS-data + EventCardInline

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** SPEC — tre fixar, mock på `docs/lineup-step-mock-2026-05-10.html`

---

## Bakgrund

Jacobs playtest avslöjade tre problem som FIX-13 inte täckte:

1. **`LineupStep.tsx` har inkonsekvent layout mellan flikar.** I list-mode renderas mini-pitch ÖVER flikarna och spelarlistan UNDER. I pitch-mode renderas pitchen UNDER flikarna med ingen pitch ovanför. Status-rad och Auto-fyll-knapp byter plats. Det är inte bara kosmetiskt — det är arkitekturfel.

2. **`PitchLineupView` har egen status-rad + Auto-fyll-knapp** som dubblerar dem som finns i `LineupStep`. När pitch-mode visas finns två Auto-fyll-knappar.

3. **`FORMATIONS`-data ger visuellt utspridd pitch.** För 5-3-2 är ytterhalvor (VYH/HYH) på en isolerad rad mellan backarna och mittfältet, skjutna till x=10/90 (absoluta sidorna). Resulterar i en formation som inte ser ut som riktig bandy.

4. **`EventCardInline.tsx` body-text är `var(--text-secondary)`** vilket är för svag mot Stålvallen-mörk bakgrund. Och alla knappar renderas som `btn-outline` när `actions.length > 1` — ingen visuell hierarki mellan primär och sekundär action.

---

## FIX-14 · Refactor `LineupStep.tsx` — chrome alltid identisk

**Fil:** `src/presentation/components/match/LineupStep.tsx`

**Mock:** `docs/lineup-step-mock-2026-05-10.html` — visar två telefoner side-by-side, list-mode och plan-mode med identisk chrome och pitch.

### Korrekt render-ordning (oavsett viewMode)

```
1. Context-strip (matchdag + opponent) — befintlig
2. OpponentAnalysisCard — befintlig
3. Lista/Plan-flikar (segmented toggle) — FLYTTAS UPP
4. Status-rad + Auto-fyll-knapp — befintlig position, men NU OVANFÖR pitchen i båda lägen
5. FORMATION dropdown — FLYTTAS från PitchLineupView/LineupFormationView upp till LineupStep
6. Pitch-rendering — viewMode bestämmer vilken komponent men renderingsplats är alltid samma
   - viewMode === 'list': <LineupFormationView />
   - viewMode === 'pitch': <PitchLineupView />
7. Mode-specifik del UNDER pitchen:
   - list-mode: legend + grupperad spelarlista
   - pitch-mode: oplacerade pillar
8. Validation warnings — befintlig
9. Footer CTA — befintlig
```

### Nuvarande JSX-struktur som ska bytas ut

```tsx
{/* Pitch area — DENNA WRAPPER TAS BORT */}
<div style={{ padding: '0 14px', marginBottom: 6 }}>
  <div style={...}>  // status row + Auto-fyll
    <span>{startingIds.length} av 11 placerade</span>
    <button>Auto-fyll</button>
  </div>

  {viewMode === 'list' ? (
    <LineupFormationView ... />
  ) : null}
</div>

{/* Segmented toggle — FLYTTAS UPP */}
<div style={{ padding: '0 14px', marginBottom: 8 }}>
  <div className="btn-segmented">
    {/* Lista/Plan tabs */}
  </div>
</div>

{/* Pitch mode — KONSOLIDERAS med list-rendering ovan */}
{viewMode === 'pitch' && (
  <PitchLineupView ... />
)}

{/* Player list — STANNAR i list-mode */}
{viewMode === 'list' && (
  <div>...</div>
)}
```

### Ny JSX-struktur

```tsx
{/* 1. Context-strip — oförändrad */}
{nextFixture && (<div className="ctx">...</div>)}

{/* 2. Opponent analysis card — oförändrad */}
{opponent && nextFixture && (<OpponentAnalysisCard ... />)}

{/* 3. Tabs — flyttat upp, ALLTID samma plats */}
<div style={{ padding: '0 14px', marginBottom: 10 }}>
  <div className="btn-segmented" style={{ display: 'flex', width: '100%' }}>
    {(['list', 'pitch'] as const).map(mode => (
      <button
        key={mode}
        onClick={() => setViewMode(mode)}
        className={`btn${viewMode === mode ? ' active' : ''}`}
        style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600 }}
      >
        {mode === 'list' ? 'Lista' : 'Plan'}
      </button>
    ))}
  </div>
</div>

{/* 4. Status + Auto-fyll — ALLTID samma plats */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0 14px', marginBottom: 10, gap: 8 }}>
  <span style={{ fontSize: 9, color: startingIds.length === 11 ? 'var(--success)' : 'var(--text-muted)',
                  letterSpacing: '1px', textTransform: 'uppercase' }}>
    {startingIds.length} av 11 placerade
  </span>
  <button onClick={onAutoFill} style={{ /* same styling as today */ }}>
    {SPARKLE_SVG} Auto-fyll
  </button>
</div>

{/* 5. Formation dropdown — LYFTS UPP från sub-components */}
<div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', marginBottom: 10 }}>
  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px',
                  textTransform: 'uppercase', color: 'var(--text-muted)' }}>
    ⚙ Formation
  </span>
  <select
    value={tacticState.formation}
    onChange={e => onFormationChange({ ...tacticState, formation: e.target.value as FormationType })}
    style={{ /* same styling */ }}
  >
    {Object.entries(FORMATIONS).map(([type, tpl]) => (
      <option key={type} value={type}>{tpl.label}</option>
    ))}
  </select>
</div>

{/* 6. Pitch — viewMode bestämmer komponent men plats är samma */}
{viewMode === 'list' ? (
  <LineupFormationView
    tacticState={tacticState}
    startingIds={startingIds}
    squadPlayers={squadPlayers}
    selectedSlotId={selectedSlotId}
    onSlotClick={onSlotClick}
    /* OBS: onFormationChange tas bort, hanteras nu av LineupStep */
  />
) : (
  <PitchLineupView
    tacticState={tacticState}
    startingIds={startingIds}
    squadPlayers={squadPlayers}
    onAssignPlayer={onAssignPlayer}
    onRemovePlayer={onRemovePlayer}
    onSwapPlayers={onSwapPlayers}
    /* OBS: onFormationChange + onAutoFill tas bort */
  />
)}

{/* 7a. List-mode tillägg: spelarlista */}
{viewMode === 'list' && (
  <div style={{ padding: '0 14px 8px' }}>
    {/* Befintlig groupedPlayers-rendering, oförändrad */}
  </div>
)}

{/* 7b. Plan-mode rendrerar oplacerade pillar — det sker REDAN inuti PitchLineupView,
       låt det vara där (eller flytta upp om det blir renare). */}

{/* 8. Validation + 9. CTA — oförändrade */}
```

### Konsekvenser för `LineupFormationView` och `PitchLineupView`

**Ta bort:**
- Status-rad (`{startingIds.length}/11`) och Auto-fyll-knapp inom respektive komponent
- Formation dropdown inom respektive komponent

**Behåll:**
- Pitch-rendering (BandyPitch + slot-overlay)
- Drag-and-drop-logik (PitchLineupView) / onSlotClick-logik (LineupFormationView)
- Legend nedanför pitchen (LineupFormationView)
- Oplacerade pillar nedanför pitchen (PitchLineupView)

**Props att ta bort:**
- `onAutoFill` från PitchLineupView — hanteras nu i LineupStep
- `onFormationChange` från båda — hanteras nu i LineupStep

---

## FIX-15 · Omkalibrera `FORMATIONS`-data — riktig bandyformation

**Fil:** `src/domain/entities/Formation.ts`

### Problem

För 5-3-2 nu:
```
y=5    MV
y=18   VB         HB
y=24       LIB
y=38   VYH                        HYH    ← isolerad rad, x=10/90
y=50-52    VMF  CMF  HMF
y=77       VF   HF
```

VYH/HYH är på en egen rad mellan backarna och mittfältet, och skjutna till absoluta sidorna. Det ger fem visuella nivåer istället för fyra (MV / backlinje / mittfält / forwards).

### Fix för 5-3-2

```ts
'5-3-2': {
  type: '5-3-2',
  label: '5-3-2 (Klassisk)',
  description: 'Klassisk 5-mans baklinje. Två ytterhalvor + tre backar, tre på halvlinjen, två forwards.',
  slots: [
    { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
    // Backlinje — FEM PÅ SAMMA RAD: VYH som ytterst, sedan VB-LIB-HB, HYH ytterst
    { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 22 },
    { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
    { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
    { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
    { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 22 },
    // Mittfält
    { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 28, y: 50 },
    { id: 'mid-c',  label: 'CMF', position: PlayerPosition.Midfielder, x: 50, y: 50 },
    { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 72, y: 50 },
    // Forwards (centrerade, inte 35/65)
    { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 38, y: 72 },
    { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 62, y: 72 },
  ],
},
```

### De andra formationerna

Samma princip — undvik isolerade rader och utskjutna spelare. Föreslagna värden för de återstående fem (samma struktur: GK + back-rad + ev. mid-rad + halvor + forwards):

**3-3-4** (Offensiv):
```ts
slots: [
  { id: 'gk',     label: 'MV', x: 50, y: 8 },
  // 3 backar
  { id: 'def-l',  label: 'VB', x: 22, y: 22 },
  { id: 'def-c',  label: 'CB', x: 50, y: 22 },
  { id: 'def-r',  label: 'HB', x: 78, y: 22 },
  // 3 halvor
  { id: 'half-l', label: 'VH', x: 22, y: 48 },
  { id: 'half-c', label: 'CMF', x: 50, y: 50 },
  { id: 'half-r', label: 'HR', x: 78, y: 48 },
  // 4 forwards (två inre, två yttre på samma rad)
  { id: 'fwd-il', label: 'VI', x: 32, y: 72 },
  { id: 'fwd-ir', label: 'HI', x: 68, y: 72 },
  { id: 'fwd-l',  label: 'VY', x: 12, y: 72 },
  { id: 'fwd-r',  label: 'HY', x: 88, y: 72 },
],
```

**4-3-3** (Defensiv):
```ts
slots: [
  { id: 'gk',      label: 'MV',  x: 50, y: 8 },
  // 4 backar
  { id: 'def-ll',  label: 'VB',  x: 14, y: 22 },
  { id: 'def-lc',  label: 'VCB', x: 38, y: 22 },
  { id: 'def-rc',  label: 'HCB', x: 62, y: 22 },
  { id: 'def-rr',  label: 'HB',  x: 86, y: 22 },
  // 3 halvor
  { id: 'half-l',  label: 'VH',  x: 25, y: 50 },
  { id: 'half-c',  label: 'CMF', x: 50, y: 50 },
  { id: 'half-r',  label: 'HR',  x: 75, y: 50 },
  // 3 forwards
  { id: 'fwd-l',   label: 'VY',  x: 22, y: 74 },
  { id: 'fwd-c',   label: 'CF',  x: 50, y: 72 },
  { id: 'fwd-r',   label: 'HY',  x: 78, y: 74 },
],
```

**3-4-3** (Halvlinje), **2-3-2-3** (Offensiv), **4-2-4** (Ultra-offensiv):
Tillämpa samma princip — varje "linje" är en rad, ingen isolerad enskild spelare på en egen y-koordinat. Föreslå konkreta värden i samma format om du vill att jag specar dem, eller låt din bandyspecialist kolla — Jacob.

### Acceptanskriterier

- [ ] Alla 6 formationer har max 4 distinkta y-nivåer (GK, back-rad, mid-rad, fwd-rad) — inga isolerade enstaka spelare på egen y
- [ ] x-värden mellan 8 och 92 (inte 5 och 95) för att hålla cirklar inom pitch-bounds vid 38px diameter
- [ ] Befintliga 760 tester gröna efter dataändring (inga match-engine-tests bör bryta — y/x används bara för visualisering, inte simulering)

---

## FIX-16 · `EventCardInline.tsx` text + knapphierarki

**Fil:** `src/presentation/components/portal/EventCardInline.tsx`

### Body-text

Nuvarande:
```tsx
<p style={{
  fontFamily: 'Georgia, serif',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--text-secondary)',  // ← FÖR SVAG på Stålvallen-mörk bakgrund
  lineHeight: 1.6,
  marginBottom: 12,
}}>
```

Ny:
```tsx
<p style={{
  fontFamily: 'Georgia, serif',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--text-light)',  // ← LJUSARE för läsbarhet på mörk bakgrund
  lineHeight: 1.6,
  marginBottom: 12,
}}>
```

### Knapphierarki

Nuvarande (alla actions blir outline när det finns flera):
```tsx
{actions.map(action => (
  <button
    key={action.choiceId}
    onClick={() => handleAction(action.choiceId)}
    className={actions.length > 1 ? 'btn btn-outline' : 'btn btn-primary'}
  >
    {action.label}
  </button>
))}
```

Ny — första action är primär, övriga outline:
```tsx
{actions.map((action, idx) => (
  <button
    key={action.choiceId}
    onClick={() => handleAction(action.choiceId)}
    className={idx === 0 ? 'btn btn-primary' : 'btn btn-outline'}
  >
    {action.label}
  </button>
))}
```

Det betyder: i case "Acceptera (45 tkr) / Kräv mer (60 tkr) / Avslå" blir "Acceptera" fylld primary (rekommenderat val), de andra outline. Skapar visuell hierarki utan att nudga för hårt.

### Verifiera

- Öppna ett event-card på dashboard (skickas via getActionsForEvent), kontrollera att första knappen är fylld accent-färg och övriga har outline
- Body-text är ljust läsbar mot mörk Stålvallen-bakgrund

---

## Vad du INTE ska göra

- **Inte modifiera** PitchLineupView / LineupFormationView core-logik (drag-and-drop, slot-rendering, ringColor) — bara ta bort dubbel-status/Auto-fyll/Formation-dropdown
- **Inte modifiera** match-engine eller tactic-effects baserat på FORMATIONS-data x/y-värden — de används bara för visualisering
- **Inte ändra** `actions.length === 1`-fallet i EventCardInline — då är den ensamma knappen primary som idag

---

## Acceptanskriterier (samlat)

- [ ] FIX-14: Lista-flik och Plan-flik har **identisk** chrome ovanför pitchen (context, opponent, flikar, status, Auto-fyll, formation, pitch)
- [ ] FIX-14: Bara en Auto-fyll-knapp i pitch-mode (idag finns det två)
- [ ] FIX-14: Bara en formation-dropdown (idag finns en i LineupStep eller subkomponent — efter refactor i LineupStep)
- [ ] FIX-15: 5-3-2 visar 4 visuella nivåer (GK, baklinje 5-bred, mittfält, forwards)
- [ ] FIX-15: Alla 6 formationer omkalibrerade enligt samma princip
- [ ] FIX-16: Body-text i event-card läsbar mot Stålvallen-bakgrund
- [ ] FIX-16: Första action i event-card är fylld primary, övriga outline
- [ ] Befintliga 760 tester gröna

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. En commit räcker (eller dela upp på FIX-14 / FIX-15 / FIX-16 om du vill mindre commits).

Flagga också:
- Om Formation-dropdown-flytten kräver ny prop på LineupFormationView/PitchLineupView (eller om de bara renderar utan dropdown nu)
- Om FORMATIONS-omkalibreringen påverkar match-engine eller andra integrationer
- Om någon befintlig test bryter
