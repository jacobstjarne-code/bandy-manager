# CODE-UPPDRAG — Kemi → matchmotor (wiring) 2026-05-25

**Av:** Opus. **Surface:** arkitektur + spec. **Bakgrund:** Playtest-fråga (Jacob) — kemi och
taktik ser bra ut men hänger de ihop med spelet? Kodläsning visade: **taktik matar motorn**
(via `evaluateSquad(starters, tactic)` → offense/defense), men **kemi är display-only** —
`chemistryStats` når aldrig motorn. Detta uppdrag kopplar in kemin.

**VIKTIGT — verifiering:** matchCore är kalibrerad mot 1 124 Elitseriematcher (10,0 mål/match,
50,7 % hemmavinst, hörnandelar). Denna ändring rör lagstyrkan och MÅSTE verifieras mot
kalibrerings-/distributionstesterna innan den landar. Opus kan inte köra dem (ingen testkörare
i chatten) — därför spec, inte direktredigering. Bygg atomiskt: plumbing + modifierare + test
i ett, så motorn aldrig står halvkopplad.

═══════════════════════════════════════════════════════════════════════════
## INSÄTTNINGSPUNKT (exakt, läst)
═══════════════════════════════════════════════════════════════════════════

`matchCore.ts`, i `simulateMatchCore`, direkt efter squad-eval:
```ts
const homeEval = evaluateSquad(homeStarters, homeLineup.tactic)
const awayEval = evaluateSquad(awayStarters, awayLineup.tactic)
const homeMods = getTacticModifiers(homeLineup.tactic)
const awayMods = getTacticModifiers(awayLineup.tactic)
let homeAttack = (homeEval.offenseScore * homeMods.offenseModifier) / 100
const homeDefense = (homeEval.defenseScore * homeMods.defenseModifier) / 100
...
let awayAttack = (awayEval.offenseScore * awayMods.offenseModifier) / 100
const awayDefense = (awayEval.defenseScore * awayMods.defenseModifier) / 100
```
Här, EFTER att homeAttack/homeDefense/awayAttack/awayDefense beräknats, appliceras kemi-
modifieraren. Rör INTE `evaluateSquad` — modifieraren bor i matchCore där styrkan blir 0-1.

═══════════════════════════════════════════════════════════════════════════
## DATA-TRÅDNING (tre steg)
═══════════════════════════════════════════════════════════════════════════

1. **`SimulateMatchInput` / `StepByStepInput`** (matchUtils.ts): lägg valfritt fält
   `chemistry?: { home?: PairChemistry[]; away?: PairChemistry[] }`
   (eller enklare: `homeChemistry?: PairChemistry[]; awayChemistry?: PairChemistry[]`).
   Valfritt → alla befintliga anropare (tester, AI-vs-AI) opåverkade när det utelämnas.

2. **`matchSimProcessor.ts`**, i `simulateMatch({...})`-anropet: beräkna och skicka kemi
   ENBART för managed-laget. `game.chemistryStats` finns bara för managed klubb (verifierat:
   roundProcessor ackumulerar +90 min/par endast för managed-fixturens startelva). Så:
   ```ts
   const managedChem = (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
     ? calculateLineupChemistry(<managed-startelva>, game.chemistryStats ?? {})
     : undefined
   // skicka som homeChemistry om managed är hemma, annars awayChemistry
   ```
   AI-lag får `undefined` → ingen modifierare (se designval 1).

3. **matchCore** läser fältet och bygger en team-chem-skalär (se formel).

═══════════════════════════════════════════════════════════════════════════
## MODIFIERARE (formel — kalibrerings-säker by construction)
═══════════════════════════════════════════════════════════════════════════

```ts
// Centrerad: neutral kemi (0) → ×1.0, så säsongskalibreringen hålls.
// K liten → tie-breaker mellan jämna lag, inte huvudfaktor.
function chemMultiplier(pairs: PairChemistry[] | undefined, K: number): number {
  if (!pairs || pairs.length === 0) return 1.0
  const avg = pairs.reduce((s, p) => s + p.strength, 0) / pairs.length  // ~ -0.3..+0.4
  return clamp(1 + avg * K, 0.94, 1.06)  // hård clamp som säkerhetsnät
}
```
Applicering (managed-laget; det andra laget får undefined → ×1.0):
```ts
const STARTK = 0.12  // STARTVÄRDE — tunas mot playtest, se nedan
homeAttack  *= chemMultiplier(input.homeChemistry, STARTK)
// homeDefense är const — gör den let, eller applicera vid härledning:
const homeDefenseChem = homeDefense * chemMultiplier(input.homeChemistry, STARTK)
// samma för away
```
**Split (rekommenderat, designval 2):** dela paren — offensiva par (forward/mid-par) modar
attack, defensiva par (back/half-par) modar defense. Det matchar vad kemi-pitchen redan visar
och gör coach-rådet ("flytta ihop dom") mekaniskt sant. Kräver position-lookup per par (finns
via startelvan). Om split är för mycket för v1: kör flat (snitt över alla par på både attack och
defense) och dela i v2.

═══════════════════════════════════════════════════════════════════════════
## DESIGNVAL (Jacob äger — Opus rekommendation i kursiv)
═══════════════════════════════════════════════════════════════════════════

1. **Managed-team-only.** Kemi finns bara för ditt lag; AI-lag har ingen data. Så kemi buffar
   bara dig. *Rek: acceptera det. Alternativet (syntetisk kemi för 11 AI-lag) är ett eget bygge.
   Kemi som din management-spak är rimligt — du investerar i sammanhållning, AI abstraheras.*
2. **Split offense/defense vs flat.** *Rek: split — det gör coach-rådet sant och kopplar
   visualiseringen till mekaniken.*
3. **K-vikt.** *Rek: STARTK = 0.12 (ger ±~1-2 % i praktiken vid normal kemi-spridning, upp till
   ±6 % vid extrem). Tie-breaker, inte huvudfaktor. Tunas mot playtest.*
4. **Determinism.** Kemi beräknas från `chemistryStats` (deterministiskt per save) och påverkar
   inte rand-sekvensen — den skalar bara homeAttack/homeDefense före loopen. Replay-stabilt.

═══════════════════════════════════════════════════════════════════════════
## VERIFIERING (Code — kör innan landning)
═══════════════════════════════════════════════════════════════════════════

1. **Kalibrering hålls:** kör måldistributions-/säsongstesterna. Med neutral kemi (×1.0) ska
   inget röra sig. Med verklig kemi-spridning ska säsongssnittet hållas inom tolerans
   (10,0 mål/match, 50,7 % hemmavinst). Om managed-laget systematiskt buffas → centrera/sänk K.
2. **Determinism:** samma seed + samma chemistryStats → identiskt resultat två körningar.
3. **Felt effekt (playtest):** stark kemi i startelvan ska ge en kännbar men inte dominerande
   skillnad. Bygg upp kemi över en halvsäsong, jämför utfall mot en roterad elva. Tuna K.
4. **Coach-rådet blir sant:** följ kemi-pitchens råd ("flytta ihop par X"), verifiera att
   utfallet faktiskt förbättras (med split). Det var hela poängen — rådet ska inte ljuga.

När detta landar och kalibreringen håller: kemi matar motorn, coach-rådet är mekaniskt sant,
och svaret på "hänger de ihop med spelet?" blir ja för både taktik och kemi.

— Opus, 2026-05-25
