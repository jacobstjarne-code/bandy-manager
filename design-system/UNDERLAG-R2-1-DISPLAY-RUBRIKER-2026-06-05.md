# Underlag R2-1 — avvikande display-/scen-rubriker

**Från:** Code · **Datum:** 2026-06-05 · **Till:** Design (bilaga till R2-1)
**Metod:** grep `fontFamily: 'Georgia'` / `var(--font-display)` + `fontSize ≥ 18` över hela `src/presentation/`. Read-only inventering — ingen ändring gjord. Roll-värden: `.h-display-xl/lg/md/sm` = 44/36/28/22px (vikt 800/800/700/700); `.h-scene-title` = 28/700; `.h-scene-setting` = 13 italic.

Endast **display-/hjälte-/scen-rubriker** listas (stora). Småtext i `--font-display` (italic-citat, eyebrows) ingår inte — den hör till R2-1:s eyebrow-delfråga separat.

## Närmast `.h-display-sm` (22/700) — men avviker

| Fil:rad | Värden | Avvikelse |
|---|---|---|
| ChampionScreen.tsx:146 | Georgia-display 22 / **800** | vikt 800 vs 700 |
| PlayoffIntroScreen.tsx:52 | Georgia 22 / **800** | vikt |
| JournalistRelationshipScene.tsx:81 | Georgia 22 / 700 | **matchar** (font-display=Georgia) — ren swap-kandidat |

## Närmast `.h-display-md` (28/700) — men avviker

| Fil:rad | Värden | Avvikelse |
|---|---|---|
| SeasonSummaryScreen.tsx:185 | Georgia 28 / **900**, letter-spacing 3px | vikt 900 (hjälte-rubrik) |
| BoardMeetingScene.tsx:87 | Georgia **23** / 700 | storlek 23 (mellan sm 22 och md 28) |

## Spridning utanför skalan (18–64px) — hjälte/scen/ceremoni

| Fil:rad | Värden | Not |
|---|---|---|
| SimSummaryScreen.tsx:115 | display 18 / 700 | under sm |
| RoundSummaryScreen.tsx:203,210 | display 24 / **800** | match-hero (resultatfärg) |
| RoundSummaryScreen.tsx:252 | display 24 / **400** | lätt-vikt hero |
| RoundSummaryScreen.tsx:329,352 | display 18 / 700 | cs / finans |
| GranskaOversikt.tsx:128,130 | display **36** / 800 | match-hero (resultat) |
| GranskaOversikt.tsx:209 | display 18 / 700 | sektion |
| HalfTimeSummaryScreen.tsx:57 | Georgia **32** / **800** | halvtids-hero |
| HistoryScreen.tsx:174 | display **20** / 800, uppercase | rubrik |
| QFSummaryScreen.tsx:42 | Georgia **20** / 800 | "Fyra lag kvar" |
| PlayoffIntroScreen.tsx:66 | Georgia **42** / 400 | stor scen-rubrik |
| SeasonSummaryScreen.tsx:314 | display **40** / 400, letter-spacing 4 | "Årets match"-siffra (kopplar DB-3) |
| TabellScreen.tsx:134 | display 15 / 800 | under skala |
| TabellScreen.tsx:508 | display 14 / 700 | under skala |
| KlubbTab.tsx:117 | display **32** / 400 | CS-siffra |
| TranareTab.tsx:66 | display 16 / 700 | under skala |
| OpponentAnalysisCard.tsx:48 | display 18 / 800 | kort-rubrik |
| CeremonySmFinal.tsx:55,60 | display **64** / **900** | seger-ceremoni (pixel-låst — trolig egen klass) |
| CeremonySmFinal.tsx:99 | display 24 / 800, uppercase | ceremoni |
| CeremonySmFinal.tsx:150 | display 32 / 800 | ceremoni |
| CeremonyCupFinal.tsx:49,54 | display **64** / **900** | cup-ceremoni (pixel-låst) |
| CeremonyCupFinal.tsx:93 | display 26 / 900, uppercase | ceremoni |
| CeremonyCupFinal.tsx:116 | display 22 / 800, uppercase | ceremoni |

## Eyebrow-delfrågan (11px / letter-spacing 3px återkommer)

| Fil:rad | Värden |
|---|---|
| SeasonSummaryScreen.tsx:178 | "ÅRSBOK" 11 / 700 / 3px |
| (samt 11/2–3px-eyebrows i Final/Ceremony-scenerna, se Pattern A-avvikelser) |

**Notering till Design:** ceremoni-rubrikerna (Ceremony*Final 64/900) är redan pixel-låsta segerscener (DB-3 reserverar Georgia-siffran där) — de bör troligen INTE in i den vardagliga display-skalan utan förbli egen ceremoni-behandling. De övriga (18–42px) är de som behöver kalibreras till skalan eller en utökad skala.
