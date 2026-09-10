# HANDOFF — Polish 5/5: SM-final-skarven

**Från:** Design
**Till:** Code
**Pairas med mock:** `Polish-smfinal-skarv.dc.html`
**Grundfynd:** "kosmetisk skarv" i SM-finalen
**Dom:** option 1 — primärkort → uppspels-scen. **Ingen ny mekanik.**

---

## 0 · TL;DR

Skarven mellan SM-final-primärkortet (steg 1, gold-fylld CTA) och uppspels-scenen (steg 2, gold som accent) klipper hårt — två gold-språk möts utan foge. Domen: gold får aldrig vara **två fyllda ytor** samtidigt (gold-disciplin, R3+). Skarven löses därför som en **gold-överlämning** — CTA:ns fyllda gold sveper uppåt och *blir* scenens gold-stripe + eyebrow. Kontinuerlig gold-tråd, inget hårt snitt, ingen andra fyllning.

---

## 1 · Sekvensen (tre frames)

| Frame | Gold-roll | Innehåll |
|---|---|---|
| **1 · Primärkort** | Gold **fylld** i CTA (enda fyllda ytan i vilan) | Portal gold-CTA "REDO — SPELA SM-FINAL →" |
| **2 · Skarven (~260ms)** | Gold **i rörelse** — fyllningen sveper uppåt | CTA-gold lyfter ur kortet, recederar till accent |
| **3 · Uppspelet** | Gold som **accent** — stripe + eyebrow + statlinje, **noll fyllning** | Typografisk scen + `final.jpg` |

**Invariant:** vid varje ögonblick finns **exakt en gold-fylld yta, eller ingen** — aldrig två. Gold-disciplinen håller *genom* rörelsen, inte bara i vila.

---

## 2 · Domen, skriven (varför överlämning, inte cross-fade)

En cross-fade av två färdiga vyer skulle betyda att steg 1:s gold-fyllning och steg 3:s gold-accent existerar samtidigt mitt i övergången → två gold-språk på skärmen → disciplinbrott. Överlämningen undviker det: fyllningen *transformeras till* accenten, den dupliceras inte. Det är skillnaden mellan "två saker som tonar" och "en sak som förvandlas".

---

## 3 · Timing (speglar Polish 1 · nedsläckning)

- Skarv ~260ms, överlappande med scenens intåg — kort, ingen lång transition (DS Animation).
- Gold-svepet: fyllningen (CTA) translateY uppåt + expanderar till stripe-bredd medan illustrationen fadar in bakom.
- Ease: `cubic-bezier(0.25,0.46,0.45,0.94)` (samma som TacticPreview + nedsläckningen).
- `prefers-reduced-motion` → hoppa svepet, hård byte men behåll gold-accent-landningen.

---

## 4 · Graderingen (kvarts/semi)

Samma skarv **i koppar** i stället för gold för kvarts/semi (R3-graderingen — bilden + gold tillkommer bara i finalen). En komponent:

```
<SceneSeam tier="final" | "semi" | "quarter" />
```

`tier="final"` → gold + illustration-slot; `tier="semi"|"quarter"` → koppar, typografisk (ingen bild). Skarv-mekaniken (fill → accent-överlämning) är identisk, bara accentfamiljen byter.

---

## 5 · Implementation

- Bygg `SceneSeam` som äger övergången från valfritt gold-/koppar-CTA-kort till en scen.
- Steg 1 CTA behåller sin gold-fyllning (oförändrad). Vid tryck: montera SceneSeam, kör svepet, montera scenen med accent-gold.
- Illustration-slot (steg 3) tar `final.jpg` som optional prop — bara `tier="final"`.
- Estimat: ~1.5h (övergångskomponent + tier-prop + reduced-motion-fallback).

---

— Design
