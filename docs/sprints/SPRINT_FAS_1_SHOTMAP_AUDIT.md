# Sprint Fas 1 — Shotmap audit

**Datum:** 2026-05-04  
**Commit:** 094af07  
**Ref:** SPEC_GRANSKA_VERIFIERING_2026-05-04 Fas 1

---

## Kod-verifiering: mock vs implementation

| Element | Mock | Implementation | Status |
|---|---|---|---|
| viewBox | `0 0 280 230` | `0 0 280 230` (H=230) | ✅ |
| GB (bottom goal y) | `226` | `GB = 226` | ✅ |
| BOT_MIN | `130` | `BOT_MIN = 130` | ✅ |
| Målgård topp | `<path d="M 118 4 A 22 22 0 0 1 162 4">` | `<path d="M 118 4 A 22 22 0 0 1 162 4" ...>` | ✅ |
| Straffområde topp | `<path d="M 65 4 A 75 75 0 0 1 215 4">` | `<path d="M 65 4 A 75 75 0 0 1 215 4" ...>` | ✅ |
| Straffpunkt topp | `cy="57"` | `cy={57}` | ✅ |
| Separator | `<rect x="0" y="100" width="280" height="30" fill="rgba(0,0,0,0.07)">` | exakt matchar | ✅ |
| Riktning vänster | `↑ VI ANFALLER` vid x=14 y=119 | exakt matchar | ✅ |
| Riktning höger | `DE ANFALLER ↓` vid x=266 y=119 text-anchor=end | exakt matchar | ✅ |
| Målgård botten | `<path d="M 118 226 A 22 22 0 0 0 162 226">` | exakt matchar | ✅ |
| Straffområde botten | `<path d="M 65 226 A 75 75 0 0 0 215 226">` | exakt matchar | ✅ |
| Straffpunkt botten | `cy="173"` | `cy={173}` | ✅ |
| Rektangulära zoner | Inga | Borttagna | ✅ |
| Streckad mittlinje | Finns ej | Borttagen | ✅ |
| "MOTSTÅNDARMÅL" | Finns ej | Borttagen | ✅ |
| "VÅRT MÅL" | Finns ej | Borttagen | ✅ |
| Penalty D-båge | Finns ej | Borttagen | ✅ |

## Stats-clarity (Fix D)

| Förut | Nu |
|---|---|
| "Säsongen (3 matcher)" | "Hittills (3 matcher)" |
| "44% ▼" (oförklarad pil) | "44% konv." (ren siffra) |
| "75% konv." (mål/skott-på-mål) | "75% träffsäkerhet" (för motståndare) |

## Build + test

- `npm run build` ✅ ren
- `npm test` — 8 fel, alla pre-existing (boardMeetingScene x4, PortalScreen x1, sceneTriggerService x3). Noll nya fel introducerade av denna commit (verifierat via stash-jämförelse).

## Importerad i

`GranskaShotmap` importeras i `GranskaScreen.tsx` (oförändrat). Ingen ny service skapades.

## Awaiting

**⚠️ Pixel-skärmdump app vs mock vid 430px — måste göras av Jacob i webbläsare.**

Kör dev-server (`npm run dev`), öppna Granska-skärmen efter en match, ställ webbläsarbredden till 430px. Jämför mot `docs/mockups/shotmap_mockup.html` i samma bredd. Dokumentera eventuella avvikelser.

**Status: 🔄 KOD KLAR — ej playtestat**
