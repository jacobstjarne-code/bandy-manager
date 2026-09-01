# KÖRORDER — granskning + merge av Codex 65-fixrundan (resultatsanning + serie/slutspel)

**Datum:** 2026-08-31 · **Av:** Opus · **Till:** Code · **Gäller:** Codex (GPT) 65 okommitterade ändringar från `756633f3`, resultatsanning + serie/slutspel-separation. Opus har kodläst KÄRNAN (`deriveUtfall` i matchTypeAxes.ts — sund, läser penaltyResult→overtimeResult→råscore) + tonaliteten (inboxService "efter straffar/förlängning" — håller). Resten är rapporterat, ej verifierat (regel 8). 65 fixar = 65 hypoteser tills kodlästa.

## 1. GATAR ALLT — boardService-mergen (gör FÖRST)
Codex fix 43 (löpande tålamod grundserie-bara) rörde `boardService.ts` — samma fil där board-tröghet just byggdes och där **D044** lever (`updateRunningBoardPatience` firar en WinLeague-klubb under serien). Fix 43 är ORTOGONAL mot D044 (den filtrerar bort slutspel, D044 handlar om seriematcher) men de rör samma funktion. Merga Codex boardService-ändring med tröghet-bygget, verifiera att de inte kolliderar, kör board-testerna. Inget committas före detta.

## 2. Verifieringssvep (Codex granskningspunkt 1–3)
- Varje resultatyta ska routa genom `deriveUtfall`/`deriveMatchTypeAxes.utfall`, inte rå score. Greppa `homeScore`/`awayScore`-direktjämförelser i alla filer där förlängning/straffar kan förekomma; varje kvarvarande är en missad yta.
- Ligaberäkningar: hitta de som filtrerar `!isCup` men GLÖMMER `!isKnockout` (slutspel läcker in i serieform/tabell/tränarbåge). Codex påstår 45+7 sådana fixade — verifiera att inga fler finns.

## 3. HÖGSTA REGRESSIONSRISKEN — kvalmatcher (granskningspunkt 4)
De nya `!isKnockout`-ligafiltren (fix 32–37) kan råka utesluta KVALMATCHER som ska räknas i tabellen. Kodläs: hur taggas en kvalmatch (isKnockout? isCup? ingetdera?), och hamnar den rätt efter filtren? Kval är seriens upp/nedflyttning, inte slutspel — om den bär `isKnockout` och filtreras bort ur tabellberäkningen är det en ny bugg.

## 4. Commit-split (granskningspunkt 7) — NÖDVÄNDIGT, trädet är blandat
Trädet bär Codex 65 + board-tröghet-bygget + Opus textfixar (januari-anslaget, m.fl.). Dela committen: (a) resultatsanning, (b) serie/slutspel-separation, (c) board-tröghet + textfixar som egna. **Ingen bred återställning** (granskningspunkt 6) — bevara allt i trädet.

## 5. Efter verifierat + committat — kartorna
Flera MASTER_OPPET-rader är nu (påstått) fixade: `sluttest-playoffseries-straff`, `sluttest-cupmatch-5-5`, `sluttest-o16-*`, `getPlayoffSeriesContext`. Flytta till `klar` med commit-referens FÖRST efter verifiering, inte på Codex ord. Opus stämmer av DOMLOGG när det landat.

## 6. Tonalitet (granskningspunkt 5) — INTE en blockerare
"Ni vann efter straffar 5–5 hemma" läser något knackigt (segern klämd mellan verb och en oavgjord siffra); "Ni vann hemma efter straffar, 5–5" flyter bättre. Men det är inte fel, och 5–5-som-seger är konventionellt korrekt i bandy. Jacobs smak-kall, valfri putsning — rör inte om han inte säger till.
