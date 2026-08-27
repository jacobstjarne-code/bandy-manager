# Rapport: går det att grinda dubblettformler? Ja — med en viktig korrigering på vägen

2026-08-25. Tredje dubblettformeln på tre dygn (två licenssystem, tre kopior av lagvalslogiken, två attendanceRate-formler). Fråga: kan en AST-jämförelse fånga mönstret? Byggd, testad, körd — inte bara teoretiserad.

## Första försöket var fel, och det är värt att veta varför

Naiv idé: normalisera varje funktions AST (byt identifierare mot en platshållare, behåll struktur+literaler), hasha, flagga exakta träffar. **Detta hade INTE fångat det motiverande exemplet.** De två gamla attendanceRate-formlerna (before dagens fix):

```ts
Math.min(0.90, 0.35 + (fanMood / 100) * 0.40 + (position <= 3 ? 0.08 : 0))
Math.min(0.95, 0.35 + (fanMood / 100) * 0.40 * moodWeight + (position <= 3 ? 0.08 * moodWeight : 0))
```

Olika konstant (0,90 mot 0,95) och en extra `* moodWeight`-faktor i den ena — exakt hash matchar aldrig. **Det är precis så här den här klassen av bugg uppstår: kopian drev isär en aning över tid, och en exakt-matchande grind hade varit blind för just det.**

## Vad som faktiskt fungerar: Levenshtein-baserad tokensekvenslikhet

Testat direkt mot de två riktiga formlerna: **85% likhet** (normaliserad Levenshtein-ratio på tokensekvensen). Ett kontrollpar helt orelaterad kod gav 41%. Tydlig marginal — metoden fångar verklig, driven duplicering, inte bara identiska kopior.

**Byggt:** `scripts/find-duplicate-functions.ts` — `ts.createSourceFile` (samma billiga variant som `measure-claim-coverage.ts`, inget fullt Program/TypeChecker), normaliserar varje funktionskropp till en tokensekvens, bucket:ar efter ungefärlig storlek (±35%) för att hålla jämförelsekostnaden nere, jämför parvis med Levenshtein-ratio.

## Bruskproblemet — och vad som faktiskt löser det

Första körningen (alla funktioner ≥15 noder, tröskel 0,72): **310 träffar.** Ohanterligt — mest generiska mönster som förekommer legitimt överallt (`pick()`, `hash()`, `clamp()` — korta, formmässigt lika utan att vara "samma sanning duplicerad"). En exakt-hash-körning på samma data gav samma bruskvalitet: `trackGoal`/`trackAssist`/`trackRed`/`trackSave` i matchCore.ts (fyra AVSIKTLIGT parallella syskonfunktioner i SAMMA fil) dominerade träfflistan.

**Två filter tar bort nästan allt brus utan att förlora träffen som motiverade grinden:**
1. **Höj minsta funktionsstorlek** (15→40 normaliserade noder) — generiska ettradsmönster (pick/hash/clamp) är för korta för att vara meningsfulla, riktig duplicerad affärslogik är typiskt större.
2. **Bara olika filer** — syskonfunktioner i samma fil (trackGoal/trackAssist) är avsiktligt parallella, inte den "tyst duplicerad sanning över kodbasen"-risk Jacob pekar på.

Med båda filtren: **71 träffar** kvar. Fortfarande för många för att vara en CI-gate (kräver mänsklig triage per träff, exakt som PÅSTÅENDEGRINDEN nivå 1 gjorde innan skopningen till "funktionen som faktiskt läser fältet") — men litet nog att vara en användbar ENGÅNGS-/PERIODISK revision, samma klass som `measure-claim-coverage.ts`.

## Redan hittat, värt en blick

- **`worldGenerator.ts:531 generateAttributes()` mot `youthIntakeService.ts:115 generateYouthAttributes()` — 88% likhet, 900 tokens vardera.** Samma konceptuella sanning (generera en spelares attributprofil) med olika basformel: `reputation*0.7±10` (världsgenerering — samma formel som RAPPORT_FORLUSTDRIVARE_OCH_FORMELNS_TAK_2026-08-25.md pekade ut som Heros rot-svaghet) mot `ca*0.9` (ungdomsintag). Om det är MEDVETET olika eller en drift är inte utrett här — bara flaggat som den mest substantiella träffen.
- **`pickArchetype()` — 100% identisk, `worldGenerator.ts` och `youthIntakeService.ts`.**
- **Minst åtta oberoende återuppfunna sträng-hash-funktioner** (`hashSeed`, `fixtureHash`, `hashStr`, `hashId`×2, `strHashInt`, `simpleHash`×3, `hashString`) — inte en "sanning duplicerad"-bugg i sig, men en verklig, billig konsolideringsmöjlighet.

Full lista (71 träffar) inte bifogad här — kör skriptet för aktuell lista, den ändras varje gång kod skrivs om.

## Svar

**Ja, det går att grinda — men inte som en exakt-matchande CI-gate.** Rätt form: `scripts/find-duplicate-functions.ts` som en periodisk revision (körs manuellt eller vid sessionsstart för större refaktorer), 71 kandidater att triagera mänskligt, inte 310. Det hade INTE automatiskt blockerat commiten som skapade den andra attendanceRate-kopian (ingen CI-gate byggd), men hade synts direkt om någon kört revisionen efteråt. Ägare: Jacob — vill du att triage-passet på de 71 körs, eller att skriptet bara finns tillgängligt för nästa gång misstanken uppstår?
