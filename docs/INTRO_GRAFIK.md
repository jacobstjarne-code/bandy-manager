# Startskärm — Implementera Eriks grafik

Referens: `docs/design/SKISS_STARTSKÄRM/skiss_start.jpg` och `skiss_start2.jpg`

---

## Steg 1: Kopiera och komprimera assets till public/

### A. Bakgrundsillustrationen
Källfil: `docs/design/BILD_STARTSKÄRM/bandymanager_v01.jpg` (4 MB — FÖR STOR)

Komprimera med ImageMagick eller sharp till max ~300KB, 1080px bred, JPEG quality 80:
```bash
npx sharp-cli -i docs/design/BILD_STARTSKÄRM/bandymanager_v01.jpg -o public/intro-bg.jpg --resize 1080 --quality 80
```
Om sharp-cli inte fungerar, använd:
```bash
cp docs/design/BILD_STARTSKÄRM/bandymanager_v01.jpg public/intro-bg.jpg
# Sen manuell komprimering, men kopiera först
```

### B. Bandy Manager-loggan (cirkulär badge)
```bash
cp docs/design/LOGO_BANDYMANAGER/bandymanager_logo_white.png public/bandymanager-logo.png
```
(37KB, ok storlek)

### C. Bury Fen-loggan (vit variant)
```bash
cp docs/design/LOGO_BURYFEN/LOGO_MÅLAD_white.png public/buryfen-logo.png
```
(ersätter `buryfen-logo-transparent.png` eller läggs bredvid)

---

## Steg 2: Uppdatera IntroSequence.tsx

Hela komponenten bygger om. Behåll samma tvåstegsflöde (S0 → S1), snöpartiklar och timing. Byt ut bakgrund och grafik.

### Gemensamt: Bakgrundsbild

Båda stegen (S0 och S1) har SAMMA bakgrundsbild — Eriks illustration med bandyspelaren, bergen, nattens himmel och bandyplanen i dalen.

```tsx
{/* Bakgrundsbild — fullscreen, cover */}
<div style={{
  position: 'absolute',
  inset: 0,
  backgroundImage: 'url(/intro-bg.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  zIndex: 0,
}} />

{/* Mörk overlay så text syns */}
<div style={{
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(14,13,11,0.3) 0%, rgba(14,13,11,0.5) 50%, rgba(14,13,11,0.7) 100%)',
  zIndex: 1,
}} />
```

Snöpartiklar och floodlight glow behålls ovanpå (zIndex: 2).

### S0 — Bury Fen splash (visas ~3.5 sek)

Referens: `skiss_start.jpg`

Layout (centrerat vertikalt):
1. **Bury Fen-logga** — `<img src="/buryfen-logo.png">`, vit, ~110px bred
2. **"BURY FEN"** — INTE text, det ingår i loggan. Om loggan inte har texten "BURY FEN" under sig, lägg till:
   ```tsx
   <p style={{ fontSize: 18, letterSpacing: '6px', color: '#F5F1EB', fontWeight: 700 }}>
     BURY FEN
   </p>
   ```
3. **"presenterar"** — kursiv, liten, svag opacity. Behåll befintlig stil.
4. **Stämningstext** — "Strålkastarna tänds. Isen ligger klar. Det doftar korv från kiosken." Kursiv, centrerad. Behåll befintlig stil.

**Timing:** Samma stagger som nu (logo → presenterar → text).

### S1 — Huvudmeny (efter 3.5 sek)

Referens: `skiss_start2.jpg`

Layout:
1. **Bandy Manager cirkellogo** — `<img src="/bandymanager-logo.png">`, vit, ~160px bred, centrerad
   - Ersätter den nuvarande `<h1>BANDY MANAGER</h1>` text-titeln
   - Fades in med scale-animation (behåll befintlig)

2. **Tagline** — "En ort. Ett lag. Ett mål." — kursiv, under loggan. Behåll befintlig stil.

3. **Knappar** (längre ner):
   - "STARTA KARRIÄREN" — copper gradient, identisk med skissen. Behåll befintlig stil.
   - "FORTSÄTT" — transparent med border, identisk med skissen. Behåll befintlig stil.

4. **Bury Fen footer** — liten Bury Fen-logga (~52px), svag opacity, längst ner. Behåll befintlig stil men byt src till `/buryfen-logo.png`.

**Timing:** Samma stagger som nu (logo → tagline → knappar → footer).

### Sammanfattning av ändringar i koden

```tsx
// BAKGRUND: Byt ut enfärgad #0E0D0B mot illustration
// VAR:
background: '#0E0D0B'
// BLI:
// Se "Gemensamt: Bakgrundsbild" ovan

// S0: Byt buryfen-logo referens
// VAR:
src="/buryfen-logo-transparent.png"
// BLI:
src="/buryfen-logo.png"

// S1: Byt ut <h1> BANDY MANAGER mot logga
// VAR:
<h1 style={{ fontSize: 34, letterSpacing: '8px', ... }}>BANDY MANAGER</h1>
// BLI:
<img
  src="/bandymanager-logo.png"
  alt="Bandy Manager"
  style={{
    width: 160,
    opacity: s1 ? 1 : 0,
    transform: s1 ? 'scale(1)' : 'scale(0.92)',
    transition: 'opacity 1100ms ease, transform 1100ms ease',
  }}
/>

// S1: Byt buryfen-logo referens i footer
// VAR:
src="/buryfen-logo-transparent.png"
filter: 'invert(1) brightness(.85) sepia(.15)'
// BLI:
src="/buryfen-logo.png"
// Ta bort filter — loggan är redan vit
```

---

## Steg 3: Ta bort oanvänd gammal logga

Om `public/buryfen-logo-transparent.png` inte längre används → ta bort den.

---

## Filer
- `public/intro-bg.jpg` (NY — komprimerad illustration)
- `public/bandymanager-logo.png` (NY — cirkulär badge)
- `public/buryfen-logo.png` (NY/ERSÄTTER — vit Bury Fen-logga)
- `src/presentation/screens/IntroSequence.tsx` (ÄNDRA)
