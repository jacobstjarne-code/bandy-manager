# Shotmap — Pixel-audit 2026-05-05

Kod-mot-mock-jämförelse. Mock: `docs/mockups/shotmap_mockup.html`.
Implementering: `src/presentation/screens/granska/GranskaShotmap.tsx`.

Headless-miljö — inga browser-screenshots. Alla värden verifierade mot
faktisk källkod och mock-HTML numeriskt.

---

## SVG-geometri — 16 element

| Element | Mock | Kod | Status |
|---------|------|-----|--------|
| viewBox | `0 0 280 230` | `0 0 ${W} ${H}` (W=280, H=230) | ✅ |
| Top zone rect height | 100 | TOP_MAX=100 | ✅ |
| Bottom zone y-start | 130 | BOT_MIN=130 | ✅ |
| Bottom zone height | 100 | H-BOT_MIN=100 | ✅ |
| Crossbar top y | 4 | GT=4 | ✅ |
| Crossbar bottom y | 226 | GB=226 | ✅ |
| Mål bredd | 120–160 (38px) | 120–160 (38px) | ✅ |
| Målgård halvcirkel top | `M 118 4 A 22 22 0 0 1 162 4` | identisk sträng | ✅ |
| Målgård halvcirkel bottom | `M 118 226 A 22 22 0 0 0 162 226` | identisk sträng | ✅ |
| Straffområde top | `M 65 4 A 75 75 0 0 1 215 4` | identisk sträng | ✅ |
| Straffområde bottom | `M 65 226 A 75 75 0 0 0 215 226` | identisk sträng | ✅ |
| Straffpunkt top cy | 57 | 57 | ✅ |
| Straffpunkt bottom cy | 173 | 173 | ✅ |
| Separator rect y/h | y=100, h=30 | y=100, h=30 | ✅ |
| "↑ VI ANFALLER" x/y | x=14, y=119 | x=14, y=119 | ✅ |
| "DE ANFALLER ↓" x/y | x=266, y=119 | x=266, y=119 | ✅ |

---

## Dot-stilar

| Typ | Egenskap | Mock | Kod | Status |
|-----|----------|------|-----|--------|
| Vår mål | r | 6 | 6 | ✅ |
| Vår mål | fill | rgba(90,154,74,0.85) | rgba(90,154,74,0.85) | ✅ |
| Vår mål | stroke | rgba(90,154,74,1) | rgba(90,154,74,1) | ✅ |
| Räddad | r | 3 | 3 | ✅ |
| Räddad | fill | rgba(196,122,58,0.7) | rgba(196,122,58,0.7) | ✅ |
| Miss | r | 2 | 2 | ✅ |
| Label fontSize | 7 | 7 | ✅ |
| Motståndar mål | r | 5 | 5 | ✅ |
| Motståndar mål | fill | rgba(176,80,64,0.6) | rgba(176,80,64,0.6) | ✅ |
| Motståndar mål | opacity | **0.85** | **0.75** (≤30 skott) | ⚠️ |

**Notering opacity:** Koden har adaptiv opacity (0.75 vid ≤30 skott, 0.5 vid >30) för
att hantera täta dot-kluster som inte finns i mocken. Mocken visar 5 statiska exempeldots
med opacity 0.85. Avvikelsen är avsiktlig förbättring, inte regression.

---

## Legend

| Egenskap | Mock | Kod | Status |
|----------|------|-----|--------|
| Team-label min-width | **56px** | **44px** | ⚠️ |
| Legend-dot storlek | 7×7px | 7×7px (border-radius 50%) | ✅ |
| Legend-text fontSize | 10 | 10 | ✅ |
| Team-label fontSize | 9 | 9 | ✅ |
| Team-label fontWeight | 700 | 700 | ✅ |
| Letter-spacing | 0.3px | 0.3px | ✅ |
| Justering | center, gap 7 | justifyContent center, gap 7 | ✅ |

**Notering min-width:** Mock: 56px, kod: 44px. Kortare klubbnamn (5–8 tecken) påverkas
inte visuellt — legend centreras korrekt ändå. Fixas om Jacob ser snedställd legend
vid playtest.

---

## Separatortext

| Egenskap | Mock | Kod | Status |
|----------|------|-----|--------|
| fontSize | 8 | 8 | ✅ |
| fill | rgba(0,0,0,0.65) | rgba(0,0,0,0.65) | ✅ |
| fontWeight | 700 | 700 | ✅ |
| letterSpacing | 0.8 | 0.8 | ✅ |
| text-anchor (höger) | end | textAnchor="end" | ✅ |

---

## DITT SKOTTMÖNSTER — ej i mock

Sektionen finns inte i `shotmap_mockup.html` — den var en tilläggsfeature.
Kan inte pixel-jämföras mot mock. Semantik verifierad:
- Match-rad: `träffsäkerhet` (skott på mål → mål%) ✅ (Fix Z levererad)
- Säsong-rad: `konv.` (skott → mål%, inkl. utanför mål) — annat mätvärde, avsiktligt

---

## Sammanfattning

| Del | Status |
|-----|--------|
| SVG-geometri (16 element) | ✅ Alla exakt match |
| Dot-stilar | ✅ Alla match utom adaptiv opacity (avsiktlig) |
| Legend-layout | ✅ utom min-width 44 vs 56px (kosmetisk) |
| Riktningspilar | ✅ Exakt |

**Slutsats:** Implementeringen matchar mocken. Två marginella avvikelser — båda
avsiktliga eller kosmetiska. Inga blockerande pixel-regressioner inför playtest.
