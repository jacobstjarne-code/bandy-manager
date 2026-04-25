# Sprint 22.15 — audit

## Punkter i spec

- [x] **1. FormationView palette-drift** — REDAN KLAR. Committad i Sprint 22.14 Del A (commit 6695491). Grep efter `--bg-dark-surface`, `--text-light`, `--text-light-secondary` i FormationView.tsx returnerar 0 träffar.
- [x] **2. NotesView palette-drift** — REDAN KLAR. Committad i Sprint 22.14 Del A (commit 6695491). Grep i NotesView.tsx returnerar 0 träffar.
- [x] **3. Events-placering i GranskaScreen** — Fixad (commit 4add264). `pendingEvents.map(...)` + Presskonferens-blocket flyttade till direkt efter Statistik-kortet. Media/Insändare/Nyckelmoment/Motståndartränare följer efter.
- [x] **4. Commentary bold** — Fixad (commit 9aba869). `wasSituationalStep`-flagga deklarerad i step-loopen. Sätts bara när `sitLine && rand() < 0.70` faktiskt injiceras. `commentaryType='situation'` enbart då — allt annat defaultar till `'normal'`.
- [x] **npm run build && npm test** — 124 test files, 1451 tests, exit code 0.
- [x] **Commit + push** — 2 nya commits pushade till origin/main.

## Rotorsaker (recap)

**Punkt 3 (events-placering):** Ingen bugg i logiken — ren UX-prioriteringsfråga. Events renderades i sin ursprungliga skrivordning (sist tillagda = längst ner). Flytten är en en-till-en block-omordning utan funktionsändring.

**Punkt 4 (commentary bold):** `getMatchSituation()` returnerar `'dominating_home'/'away'` när `shotDiff > 4 && step > 10`. I en typisk match med ett dominant lag uppnås det efter ca 10–15 steg och håller sig resten av matchen. Det innebär att `situation !== 'neutral'` gäller för ~70–80% av alla steg. Situationskommentar injiceras bara var 8–12:e steg, men `commentaryType='situation'` (bold + text-primary) sattes för ALLA icke-neutral steg. Fixa med `wasSituationalStep` innebär att bold-styling bara syns när en situational line faktiskt visas — ca 10–15 gånger per match istf. 50–60.

## Observerat i UI (spec-krav)

Kan inte köra appen direkt. Logisk verifiering:

**FormationView + NotesView:** grep bekräftar inga dark-palette-variabler i komponenterna. Fixades i 22.14 Del A.

**Events-placering:** Renderingsordningen i `renderOversikt()` är nu:
1. Resultat-hero (fadeIn 0)
2. Statistik (fadeIn 1)
3. pendingEvents (fadeIn 2+ei)
4. Presskonferens (fadeIn 4)
5. Media (fadeIn 5)
6. Insändare
7. Nyckelmoment (fadeIn 6)
8. Motståndartränare

**Commentary bold:** `commentaryType`-beslut i matchCore.ts rad ~1289: `if (wasSituationalStep) return 'situation'`. Flaggan sätts på rad ~1176 inuti `if (sitLine && rand() < 0.70)`. Mål och utvisningar hanteras av separata branches i CommentaryFeed (raderna 238–254) som tar precedens.

## Ej levererat

Inget. Alla fyra punkter klara (1+2 via 22.14 Del A, 3+4 i denna sprint).

## Nya lärdomar till LESSONS.md

Ingen ny lärdom (commentary-situationen är inte återkommande mönster — rot är designbeslut i getMatchSituation-trösklar, inte en buggklass).
