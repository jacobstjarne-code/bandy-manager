# SPEC — Konsekvensraden (Förbättring 5, designgenomgången 06-11)

**Datum:** 2026-06-19
**Från:** Opus (text + konvention skriven direkt; Code wirar mot befintliga källor)
**Grund:** DESIGNSLUTSATSER-STEG3 §II.5 — "den parkerade frågan är den största". Sekvenserad sist ("egen designrunda när 1–4 satt sig"). 1–4 är klara (verifierade i incoming-genomgången), detta är den femte.

---

## Reframe (verifierat mot källan 2026-06-19)

Förbättring 5 är **inte** "bygg ett konsekvenssystem". Varenda konsekvens är redan beräknad och utspridd i koden. Specen är ett **ytlägg + förening + röst**-jobb. Code får INTE bygga en parallell konsekvensmotor — den ska wira de befintliga källorna till EN rad-konvention.

Läst och verifierat:
- `getTacticModifiers` (tacticModifiers.ts) — varje taktikval ger en faktisk delta (Offensiv +0,10 anfall/−0,10 försvar; Hög press +press/+disciplin/+trötthet; 2-3-2-3 +anfall/−försvar; osv).
- `getTacticFeel` (chemistryService.ts) — "Så spelar det"-rad ur spelstil + faktisk kemi i startelvan. Renderas redan i `TacticBoardCard`. Tar INGEN motståndare.
- `getReaction` + `projectSeasonForm` (periodisationService.ts) — läget (Bygg/Håll/Toppa/Vila) har per-spelare-varningar ("Tål inte Bygg", "Orkar ej spiken", "Rostar av vila") OCH en 10-rundors formprojektion. Beräknat, inte ytlagt som rad.
- `getPairExpandText` (chemistryPairText.ts) — MB-röstade kemi-rader per par, med "tystnad > generalisering" inbyggt. **Detta är referensmönstret för hela konventionen.**
- `opponentAnalysisService` — motståndarens formation, stil, svagheter ("Sårbart försvar", "Svag halvlinje") och en MB-rekommendation. Den motrelativa datan finns.
- `PAUSE_LEAN_FACTOR` (matchCore) — halvtidsvalets preview: "samma faktor driver previewn i UI och sim:en". **Detta är den arkitektoniska referensen** — en sanningskälla driver både raden och utfallet.

---

## Konventionen

**Konsekvensraden** är assistentens (MB) röst, EN mening, bandysvensk understatement, i denna-match/nästa-match-tempo. Tre bindande regler:

1. **En sanningskälla.** Raden och sim-effekten läses ur SAMMA värde (pause-lean-mönstret). Raden får aldrig lova något motorn inte gör (Lesson #41, promise↔consequence).
2. **Tystnad > generalisering.** Finns ingen konkret konsekvens visas ingen rad — eller den lugnaste generella (getTacticFeel-fallback). Aldrig utfyllnad. (getPairExpandText-principen, generaliserad.)
3. **Motrelativ när mekaniken är det.** Är valets effekt motståndarberoende skrivs raden mot motståndaren ("mot deras X"); annars absolut.

---

## Per yta — källa, status, rad

### A · Taktik/spelstil + formation MOT motståndaren  (den nya huvudraden)
**Källa:** `getTacticModifiers` (egen riktning) × `opponentAnalysisService` (motståndarens svaghet/formation). **Status:** bådadera finns, ej sammankopplade. **Gap:** getTacticFeel är motståndarlös.

**Wiring:** utöka getTacticFeel (ELLER ny wrapper `getTacticConsequence`) att ta emot en valfri `OpponentAnalysis`. När den finns OCH en kant existerar (eget val möter motståndarsvaghet), skriv motrelativ rad ur poolen nedan. Annars fall till nuvarande getTacticFeel-rad (tystnad-regeln). Läs getTacticFeel först — UTÖKA, ersätt inte.

**Opus-text (integrera ordagrant; en rad väljs deterministiskt på fixture-seed):**

Offensiv/hög press + motståndaren har `Sårbart försvar`:
- "Offensivt mot deras sårbara försvar — rätt match att trycka på."
- "De läcker bakåt. Spelar ni framåt kan det lossna tidigt."

Hög press + motståndaren har `Svag halvlinje`:
- "Hög press mot deras svaga mittfält — där vinns matchen om någonstans."

Defensiv + motståndaren har `Stark anfallslinje`:
- "Ni sitter djupt mot deras farliga forwards. Klokt — men ni måste ta era få lägen."

Offensiv + motståndaren har `Stark anfallslinje` (risk-rad):
- "Öppet mot deras anfall blir en målrik kväll åt båda håll. Säkert? Nej. Kul? Ja."

Formation-kontrast (egen vs motståndarens formation, när skillnaden är tydlig):
- "{egen} mot deras {motst}: {tryggare bakåt / fler ytor framåt} — {färre / fler} omställningar."
  (riktningen härleds ur formationens delta i getTacticModifiers: 2-3-2-3 = fler ytor framåt/fler omställningar emot; 4-3-3/4-2-4 = tryggare bakåt.)

Jämnt läge (ingen tydlig kant): **ingen motrelativ rad** — visa nuvarande getTacticFeel-rad.

### B · Läge (Bygg/Håll/Toppa/Vila)  — surfacing
**Källa:** `getReaction` (per-spelare) + `projectSeasonForm` (10-rundors kurva). **Status:** beräknat, ej ytlagt som lagrad. **Gap:** "utan synligt utfall" (Förbättring 5).

**Wiring:** lägg en konsekvensrad på läge-väljaren som läser projectSeasonForm (kurvans riktning) + den mest framträdande getReaction-varningen i startelvan (äldst/mest i farozonen). Tystnad-regeln: är kurvan platt och inga varningar → ingen rad.

**Opus-text:**
- Toppa: "Toppa nu: tre matcher upp, sen faller formen. {namn} ({ålder}) orkar inte spiken." (om ≥33 i elvan; annars utan andra meningen)
- Bygg: "Bygg lyfter formen sakta — men kostar fysik och ökar skaderisken. {namn} ({ålder}) tål det inte." (om ≥33 eller stamina<40)
- Bygg, ung trupp: "Bygg passar en ung trupp. De yngsta lyfter snabbast."
- Vila: "Vila ger ben tillbaka men formen sjunker. {namn} rostar av att stå still." (om ung/skarp i elvan)
- Håll: "Håll håller läget. Ingen vinst, ingen kostnad — rätt mellan tunga matcher."

### C · Kemi  — redan byggt, adoptera
**Källa:** `getPairExpandText`. **Status:** KLAR (MB-rader per par, tystnad inbyggd). **Gap:** ingen — detta ÄR konsekvensraden för par. Ingen åtgärd utom att bekräfta att den renderas där par väljs/expanderas (den gör det i FormationView kemi-lagret).

### D · Halvtid  — redan byggt, referens
**Källa:** `PAUSE_LEAN_FACTOR` + previewn. **Status:** KLAR. Är den arkitektoniska referensen (en faktor → preview + sim). Ingen åtgärd.

### E · Mentorskap  — BEKRÄFTAT (rättar tidigare "inget system hittat")
**Källa:** `leadershipActions` (`action: 'mentor'`, `mentoredPlayerId`, `expiresRound`) + PC-6 i `playerDevelopmentService.applyRoundDevelopment`. **Status:** mekaniken finns. Tidigare "inget hittat" var fel — `search_files` matchar sökväg, inte innehåll; fältet heter `mentorships`/leadershipAction, ej *mentor*-fil.

**Konsekvens (verifierad i kod):** mentorerad spelare får `MENTOR_CA_BONUS = 0.06` additivt på CA-tillväxt per omgång — MEN bara när `caChange > 0` (accelererar tillväxt, vänder ej nedgång) och dämpat nära PA (gap ≤2 → ×0,1, gap ≤5 → ×0,5). Konsekvensraden surfar exakt detta, med tystnad-regeln när effekten är försumbar.

**Wiring:** där mentor-åtgärden väljs (leadership-UI) — läs `potentialAbility - currentAbility` för den tänkta adepten + om hen utvecklas uppåt (age/dev-profil). Code rapporterar var 'mentor' väljs så placeringen bekräftas, ej gissas.

**Opus-text:**
- Gap stort, ung/växande: "Mentorskap: {adept} växer snabbare så länge {mentor} håller i honom — han har takhöjd kvar."
- Gap litet (≤5, nära tak): "{adept} är nära sitt tak — mentorskap ger bara några småsteg. Större nytta hos någon yngre."
- Utvecklas ej uppåt (äldre/nedgång): "{adept} går inte uppåt just nu — mentorskap biter inte förrän formen vänder." (ärlig varning, ej tyst här: spelaren ska förstå varför det inte ger något)

---

## Gate
build + test + lint:design. Tester: (A) given egen offensiv taktik + motståndare med `Sårbart försvar` → motrelativ rad ur rätt pool; jämn motståndare → getTacticFeel-fallback (ingen påtvingad rad). (B) Toppa med en 34-åring i elvan → spiken-varningsraden; platt kurva utan varningar → ingen rad. Rapportera commit + var varje rad wirades + vilken befintlig källa den läser (ingen ny konsekvensmotor).

## Öppet för Jacob
- Mentorskap (E): BEKRÄFTAT — mekaniken finns (leadershipAction 'mentor' + PC-6), yta E specad. Återstår: Code rapporterar var 'mentor' väljs i UI så raden placeras rätt.
- Vilka ytor bär raden synligt (taktik-brädet säkert; läge-väljaren — var sitter den i UI idag?). Code rapporterar var läge väljs så placeringen bekräftas mot mock-principen, ej gissas.
