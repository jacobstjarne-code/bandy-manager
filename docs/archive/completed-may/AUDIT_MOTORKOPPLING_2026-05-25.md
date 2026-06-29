# AUDIT — Systemens koppling till matchutfall 2026-05-25

**Av:** Opus. **Fråga (Jacob):** vilka synliga system matar faktiskt matchmotorn/utfallet,
och vilka är rena läsytor? **Metod:** för varje system, spåra i kod om det når
`evaluateSquad`/matchCore (=påverkar utfall) eller bara renderas/kommenteras. Läst, inte gissat.
Källor: squadEvaluator.ts, matchCore.ts, matchEngine.ts, matchSimProcessor.ts,
playerStateProcessor.ts, chemistryService.ts.

═══════════════════════════════════════════════════════════════════════════
## MATAR UTFALLET (riktigt inkopplat)
═══════════════════════════════════════════════════════════════════════════

- **Spelarattribut** (skating, shooting, passing, defending, positioning, …) → offense/defense/
  corner/gk-poäng i `evaluateSquad`. Kärnan.
- **Form + fitness** → `playerModifier = form×0.4 + fitness×0.6`, multiplicerar varje spelares
  bidrag. Direkt.
- **Taktik** — formation (position-fit), mentalitet/tempo/press/width/cornerStrategy/passingRisk
  via `getTacticModifiers` + sekvensvikter. Direkt.
- **Väder + is** — `computeWeatherEffects` (bollkontroll/fart/målchans), is-degradering 2:a halvlek,
  `iceHardnessMod` per månad, väder×taktik-interaktion. Direkt.
- **Rivalitet/derby** — komprimerar styrkespridning (jämnare match), `derbyFoulMult`,
  `derbyChanceMult`, höjd hemmafördel. Direkt.
- **FanMood** → `effectiveHomeAdvantage *= 1 + ((fanMood−50)/100)×0.06`, endast managed hemma. Litet men direkt.
- **Community standing** → `homeAdvantage += ((cs−50)/50)×0.02`, endast managed. Mycket litet men direkt.
- **Disciplin + utvisningsprofil** → `disciplineRisk` (foul-sannolikhet) + `getDefendingPlayer`
  viktar vem som utvisas på situation/intensitet/volym/ren. Direkt.
- **Traits** (hungrig/veteran/lokal/ledare/joker) → målskytte-vikter i `getGoalScorer`. Direkt.
- **cornerRecovery** → kontringsrisk efter egen hörna. Direkt.
- **Träning** → utvecklar attribut (`applyRoundDevelopment`/`developPlayers`) → attribut matar
  motorn. Inkopplat men fördröjt (via attribut över tid).
- **Säsongssignatur** (underdogBoost, midSeasonInjuryMultiplier) → attack-boost / skaderisk. Direkt.
- **Kemi** — NU under inkoppling (`CODE_UPPDRAG_KEMI_MOTOR_2026-05-25.md`). Tills det landar: attrapp.

═══════════════════════════════════════════════════════════════════════════
## RÖR INTE UTFALLET (läsyta / narrativ / off-pitch) — trots att de ser ut att spela roll
═══════════════════════════════════════════════════════════════════════════

- **MORAL** 🟥 — det stora fyndet. Finns inte i `playerModifier`, squad-poängen eller matchCore-
  styrkan. I matchCore rör den bara ett display-fält (sista-minuten-pressens trötthetssiffra).
  Form uppdateras från match-BETYG, inte moral. Så moral matar varken form, fitness eller styrka.
  Den driver tillgänglighet/lobby (missnöjd/vill lämna → transfers), kapten-kaskad (mer moral) och
  narrativ. Mekaniskt mot utfall: attrapp. NU-vyns "LÅG MORAL", moral-chips och prata-med-spelare
  framställer moral som matchavgörande — den är det inte. (Prata-med-spelare hjälper ändå, via
  form-bumpen den också ger — inte via moralen.)
- **Storylines** — i matchen bara måljubel-text (`storylineMap`), inte sannolikhet. Narrativ.
- **isClubLegend** — legend-kommentar (70% override), inte målvikt. Narrativ.
- **Referee-stil** (strict/lenient/inconsistent) 🟧 — i SIMULERADE matcher tvingas `refStyle`
  till 'lenient' och `foulThreshold` innehåller ingen refStyle-term. Så domarstilen ändrar inte
  utvisningsfrekvensen i sim — den färgar bara kommentar (full mode) och driver domar-RELATIONEN
  (möten) separat. "Strikt domare = fler kort" stämmer inte i utfallet. (Bör dubbelkollas mot
  ev. annan väg, men foul-kalkylen är ren.)
- **Nemesis-tracker** — spårar motståndarmålskyttar för inbox/narrativ. Inget utfall.
- **Klack-eko / klack-favorit / anniversary-klack** — kickoff/måljubel-kommentar. Narrativ.

═══════════════════════════════════════════════════════════════════════════
## KANDIDAT — behöver en sista spårning innan dom
═══════════════════════════════════════════════════════════════════════════

- **Sharpness** 🟨 — uppdateras varje omgång (startelva +10, bänk −5, ej spelat −3) men finns
  INTE i `playerModifier`, squad-poängen eller matchCore-styrkan som jag läst. Ser ut som moral:
  spårad men utan väg till utfall. Innan jag kallar den attrapp vill jag greppa var `sharpness`
  faktiskt läses (kan finnas i en väg jag inte sett — t.ex. utveckling eller lineup-rekommendation).
  Nästa läsning.

═══════════════════════════════════════════════════════════════════════════
## KORREKT ICKE-KOPPLADE (det är meningen)
═══════════════════════════════════════════════════════════════════════════

- **Scouting** — ger information (vad du VET om spelare/motståndare), inte kraft. Rätt så.
- **Ekonomi / mecenat / sponsorer** — off-pitch; påverkar matchen bara indirekt via vilka spelare
  du har råd med. Rätt så.
- **Styrelsemål** — meta-mål, inte matchmekanik. Rätt så.

═══════════════════════════════════════════════════════════════════════════
## SLUTSATS
═══════════════════════════════════════════════════════════════════════════

Två system framställs som matchavgörande men är det inte: **kemi** (under inkoppling) och
**moral** (ingen väg alls). Moral är den allvarligare — den har en hel UI-yta, en spelar-action
(prata) och chips byggda kring sig, och den lovar en effekt som inte finns. Tre mindre fall är
narrativ-bara där det troligen är ok (storylines, legend, klack-eko) men där **referee-stilen**
sticker ut: spelet visar domarnamn och -stil som om det påverkar matchen, men i sim gör det inte det.

**Beslut till Jacob:** vill du att moral kopplas in (samma sorts wiring som kemi — en liten,
centrerad modifierare på form/styrka, eller en väg moral→form över tid), eller ska moralens
UI-löfte tonas ned så det matchar mekaniken? Och samma fråga för referee-stilen. Sharpness
verifierar jag först innan den får en dom.

— Opus, 2026-05-25
