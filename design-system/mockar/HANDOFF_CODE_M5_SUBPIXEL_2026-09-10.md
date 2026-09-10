# CODE-HANDOFF — m5: sub-12px-ytorna, lås upp text-storleksgrinden

**Av:** Opus · **Till:** Code · **Datum:** 2026-09-10 · **Rör:** `minTextSizeGate.ts`, `mobileDecisionHierarchy.visual.ts`, de ~40 sub-12px-ytorna. Byggbar rakt av.

## Klargörande — ingen Design-mock behövs

Raden `m5-grindar-ej-i-ci` har stått som "väntar Design", men det stämmer inte längre: Jacob domde default-regeln 2026-09-08, och den kollapsar per-yta-omdömet till en MEKANISK regel Code kör. Det finns inget mocksteg kvar. Detta är ett Code-bygge, och ägaren på raden ska vara Code, inte Design.

## Regeln (Jacobs dom)

DEFAULT: förstora varje sub-12px-yta till ≥12px. Undanta ENDAST där en förstoring faktiskt bryter layouten på 390 px — och då uttryckligen via `[data-text-size-exempt]` med ett skäl (varför ytan inte kan bli 12px). Undantag är dokumenterad skuld, aldrig en tyst genväg. Du ser vilka som bryter när du förstorar och kör den visuella grinden — det är inte en gissning i förväg.

## Ytorna (M5-auditens kategorier — de ~40 Code redan såg failade)

- position-badges (9–11px)
- spelarnamn
- assistent-anteckningar
- åldersrader

på **Game Over** och **taktiktavlans spelarval**. Det var exakt de här som failade när `findTextSizeViolations` trådades in i `mobileDecisionHierarchy.visual.ts` och återställdes.

## Bygg-steg

1. Gå igenom de ~40 ytorna, förstora till ≥12px per default-regeln.
2. Där en förstoring bryter 390px-layouten: `[data-text-size-exempt]` + skäl på just den ytan.
3. Koppla in `minTextSizeGate` (`findTextSizeViolations`) i `mobileDecisionHierarchy.visual.ts` (`npm run test:visual`) EFTER att ytorna är förstorade/undantagna — så grinden är grön från första körningen, inte tyst avstängd.

## GODKÄNT NÄR

Varje sub-12px-yta är antingen ≥12px eller `[data-text-size-exempt]`-märkt med skäl; `test:visual` grön mot en ren yta; grinden vaktar sub-12px framåt. Diffen ska vara isolerad till textstorlekarna + grind-inkopplingen — inga andra visuella baselines rörda.

## Ägarskap

Code bygger hela raden (regeln är domd, inget mocksteg). Opus: denna handoff + briefen. Jacob: default-regeln domd 2026-09-08.
