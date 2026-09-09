# DESIGN-BRIEF — m5: sub-12px-ytorna (lås upp text-storleksgrinden)

**Datum:** 2026-09-08 · **Av:** Opus · **Kör:** Design · **Bygger:** Code efter beslut · **Grund:** `m5-grindar-ej-i-ci` (MASTER), `minTextSizeGate.ts`, M5-auditen. Har legat på Design sedan 2026-09-06 och blockerar en CI-grind.

## Problemet (kodläst)

`minTextSizeGate.ts` är byggd men ingen fil importerar den i `npm run test:visual`, så grinden vaktar ingenting. Code försökte koppla in den (`findTextSizeViolations` i `mobileDecisionHierarchy.visual.ts`) — testet failade OMEDELBART på ~40 verkliga sub-12px-brott: 9–11px position-badges, spelarnamn, assistent-anteckningar och åldersrader på Game Over och taktiktavlans spelarval. Matchar exakt M5-auditens ursprungsfynd. Code återställde ändringen för att inte tysta en genuin grind eller bredda scopet till en design-runda utan beslut. Grinden kan inte kopplas in förrän någon dömt vad som ska hända med de ~40 ytorna.

## Uppgift — en default-regel, inte 40 enskilda beslut

DEFAULT: förstora alla sub-12px-ytor till ≥12px. Gå igenom de ~40 och applicera defaulten. Undanta ENDAST där en förstoring faktiskt bryter layouten på 390 px — och då dokumenteras undantaget uttryckligen via `[data-text-size-exempt]` med ett skäl (varför ytan inte kan bli 12px). Undantag är dokumenterad skuld, inte en tyst genväg.

Ytorna att gå igenom (M5-auditens kategorier):
- position-badges (9–11px)
- spelarnamn
- assistent-anteckningar
- åldersrader

på: Game Over och taktiktavlans spelarval.

## GODKÄNT NÄR

Varje sub-12px-yta är antingen förstorad till ≥12px eller uttryckligen `[data-text-size-exempt]`-märkt med skäl. Då kan Code koppla in `minTextSizeGate` i `test:visual` mot en ren yta, grinden blir grön, och CI vaktar sub-12px framåt.

## Ägarskap

Design: förstora/undanta-beslutet per yta (default förstora; undantag dokumenteras). Code: wirar grinden efter beslutet, inga visuella baselines ändras dessförinnan. Opus: denna brief. Jacob: gav go 2026-09-08.
