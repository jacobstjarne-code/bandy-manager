# Rapport: tillväxtslingans minsta version (O10) — innan bygge

2026-08-26. Beställd av Jacob innan slingan (kort → fråga → länk → ny karriär från samma seed) byggs. Två frågor, ingen kod ändrad.

## 1. Bär delningskortets URL något idag?

**Nej.** `shareSeasonImage()` (`seasonShareImage.ts:375`) delar en genererad PNG-bild av säsongssammanfattningen. Web Share API-vägen (mobil):
```js
navigator.share({ files: [file], title: ..., text: summary.narrativeSummary, url: window.location.origin })
```
`url` är bara `window.location.origin` — appens bara domän, noll state (inget seed, ingen klubb, ingen säsong). Fallback-vägen (ingen Web Share API) är en ren blob-nedladdning av PNG:n — ingen URL exponeras alls där, bara en intern `URL.createObjectURL` för nedladdningslänken.

## 2. Kan en seed + regelversion kodas i en länk som startskärmen kan läsa?

**Ja, tekniskt rent — men två saker måste vägas in innan bygge, inte efteråt.**

**Routingen bär redan detta mönstret.** Appen kör en riktig `BrowserRouter` (inte hash-only), `ClubSelectionScreen.tsx` läser redan `location.state` (för `managerName` från `NameInputScreen`). Att lägga till läsning av query-parametrar (`useSearchParams` eller `location.search`) på `/club-selection` eller en ny ingång är samma mönster, inte ett nytt.

**Seedet är genuint deterministiskt, verifierat hela vägen.** `createNewGame()` (`createNewGame.ts:188`) seedar `mulberry32` från `input.seed` och samma seed (plus offset per delsystem) driver VARENDA generator: `generateWorld` (klubbar+spelare), cupfixtures, väder, ungdomslag, `createSeasonSignature`, `generateManagerProfile`, `generateCoachRivalries`, `generateAICoaches`. Två careers med samma seed + samma klubb + samma managernamn blir byte-identiska världar. Det här är inte en förhoppning — det är läst rad för rad.

**FYND, inte antagande — påverkar om länken betyder något:** i den RIKTIGA UI-flödet skickas `input.seed` ALDRIG. `ClubSelectionScreen.tsx:32` anropar `newGame(managerName, clubId)` → `createNewGame({ managerName, clubId })`, inget tredje argument. `worldSeed` faller därför tillbaka till konstanten `42` för VARJE karriär som startas idag, utan undantag. **Det betyder att alla befintliga careers redan råkar dela exakt samma seed** — "starta en karriär från samma seed som mig" är i nuläget redan sant för alla, av en olycka, inte ett val. För att slingan ska bära någon signal alls måste `newGame()` FÖRST få ett riktigt slumpat seed som default för en fristående ny karriär (inte bara acceptera ett seed FRÅN en länk) — annars är "samma seed"-jämförelsen meningslös innan den ens börjat.

**Regelversion är en enkel datumsträng, ojämförd idag.** `CURRENT_RULE_VERSION` (`ruleVersion.ts:9`) = `'2026-08-17'`, satt på `SaveGame.ruleVersion` vid skapande, men ingenstans läst/jämförd. En länk som bär ett äldre `ruleVersion` än appens nuvarande skulle idag starta en karriär utan varning även om balansen hunnit ändras sen länken skapades — en mjuk missmatch-varning (inte en spärr) är rimlig, inte byggd.

## Sammanfattning — vad som krävs innan minsta slingan är verklig

1. `newGame()` (gameStore.ts) måste ge en NY, riktigt slumpad seed som default (inte 42) för fristående careers — annars är seed-jämförelsen redan trasig innan länken existerar.
2. Läs `?seed=N&rv=X` (eller liknande) på club-selection/new-game-ingången, trådat till `createNewGame({ ..., seed })`.
3. Ett kort med en fråga + länk (Opus-text — SVENSK TEXT-regeln, Code bygger bara mekaniken/platshållare).
4. Mjuk `ruleVersion`-missmatch-notis, inte en spärr.

Inget av detta byggt än. Väntar på din bedömning innan kod skrivs.
