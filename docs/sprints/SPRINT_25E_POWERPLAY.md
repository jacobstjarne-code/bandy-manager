# Sprint 25-e — Powerplay-effektivitet

**Status:** READY TO IMPLEMENT
**Estimat:** 2-4h Code (impl + iterativ mätning)
**Förutsätter:** Sprint 25-J (homeAdv-synk) levererad. 25-K bör vara levererad för stabil cornerGoalPct-baseline.
**Risk:** Medel — påverkar matchresultat, kräver mätning på flera dimensioner

---

## ROTORSAK

Sprint 25b.2 höjde utvisnings-basfrekvensen 4× (`avgSuspensionsPerMatch` 0.82 → 3.23, target 3.77 ✅). Förväntat: powerplay skulle bli ett betydande comeback-verktyg och htLeadWinPct skulle sjunka.

Faktiskt utfall: htLeadWinPct rörde sig **0.4pp** (83.2% → 82.8%). 4× fler utvisningar gav nästan ingen effekt på matchutfall.

Det betyder att motorn registrerar utvisningen mekaniskt men **omsätter inte mannfördelen i fler mål**. Powerplay i spelet är nästan dekorativt.

I bandy är powerplay tvärtom **ett av de starkaste verktygen för att vända en match**. Det syns i rådata via:
- Hög target-frekvens (3.77 utvisningar/match → ~30% av matchtid med någon form av mannfördel)
- Tydlig korrelation mellan utvisningar och målgenerering hos motståndare
- Domarstuckna comebacks är välkända i sporten (en utvisning vid 0-2 = realistisk vändning)

Spelaren ser idag: utvisning → "10 minuter" på skärmen → ingenting känns annorlunda. **Det är ett spelupplevelse-hål som syns varje match.**

---

## NUVARANDE LÄGE

Från senaste stresstest:

| Mått | Motor | Target | Status |
|------|-------|--------|--------|
| avgSuspensionsPerMatch | 3.75 | 3.77 | ✅ |
| htLeadWinPct | 82.8% | 78.1% | 🔶 +4.7pp |
| Comeback från −1 | ~18% | ~30% (uppskattat ur rådata) | ❌ |
| Comeback från −2 | ~9% | ~15% (uppskattat ur rådata) | ❌ |

Comeback-frekvenserna är inte direkt-mätta i analyze-stress idag — de bör mätas som del av denna sprint.

---

## TRE HYPOTESER (testa i ordning)

### H1 — `awayPenaltyFactor` / `homePenaltyFactor` är för milt

**Konkret kod:** Varje gång motståndaren får utvisning, multipliceras spelaren-i-underläges chans-modifikatorer med `awayPenaltyFactor` (eller `homePenaltyFactor`). Värdet är troligen `0.75` (motståndaren är 25% sämre under utvisningen).

I verklig bandy är 4-mot-5 mer än 25% sämre. Powerplay-laget har full kontroll över bollen, motståndaren defensiv, fysiskt utmattning bygger upp. Realistiskt värde: 0.55-0.65.

**Test:** Sänk `awayPenaltyFactor` 0.75 → 0.65 (eller 0.60). Mät:
- avgSuspensionsPerMatch oförändrat
- htLeadWinPct sjunker
- Comeback från −1 stiger
- goals/match — risk för marginell höjning, ej accepterat över +0.3

### H2 — `trailingBoost` växer för långsamt

**Konkret kod:** När laget ligger under, läggs `trailingBoost = 0.11 × målunderläge` på offensiva chans-modifikatorer. Ett lag som ligger 0-2 får `trailingBoost = 0.22`.

Möjligt problem: 0.11 per måls underläge är för lågt jämfört med verklig comeback-frekvens. Motståndaren-i-ledning blir inte tillräckligt pressad.

**Test:** Höj `trailingBoost` 0.11 → 0.15. Mät comeback-frekvenser. Risk: kan göra motorn "studsig" där underläges-lag återhämtar sig för lätt. **Måste testas tillsammans med H1**, inte isolerat — H1 är troligare rotorsak och H2 är finkalibrering ovanpå.

### H3 — Powerplay saknar dedikerad chans-bonus

**Konkret kod:** Idag är powerplay-effekten *bara* via `awayPenaltyFactor` som sänker motståndarens motstånd. Det finns ingen aktiv "powerplay-laget får högre cornerChance" eller "powerplay-laget triggar fler attacker".

Möjligt: lägga till explicit `powerplayAttackBoost` i matchCore när någon sida har mannfördel — multiplikator på *attack-frekvensen*, inte bara konversionen.

**Test:** Implementera `powerplayAttackBoost = 1.20` (20% fler attacker när i powerplay). Mät:
- powerplay-mål per powerplay-tid (ny mätning, ska göras i scenarie B nedan)
- htLeadWinPct
- Comeback-frekvenser

H3 är arkitektonisk — inför ny variabel. Endast om H1+H2 inte räcker.

---

## VERIFIERING

### Steg 1: Bygg + tester
```bash
npm run build && npm test
```

### Steg 2: Mätutökning — comeback-frekvenser

`analyze-stress.ts` mäter idag inte explicit comeback från −1 / −2. Lägg till om saknas:

```ts
// För varje match, tracker matchEndScore relativt halftime-score
// Comeback −1 = lag som låg under med 1 vid HT och vann/spelade lika i FT
// Comeback −2 = samma men 2 mål
// Comeback från −3+ = kategori
```

Mät både för grundserie och slutspelsfaser separat (KVF har annan struktur — eventuellt OT/straffar).

### Steg 3: Mätutökning — powerplay-konvertering

Ny mätning: när ett lag har mannfördel, hur många mål gör de per powerplay-minut?

Bandygrytan-rådata troligen inte direkt — kan extraheras från event-tider:
- För varje match: lista utvisningar med tid + längd
- Räkna mål gjorda av motståndarlag inom utvisningens fönster
- Aggregera över faser

Om datan är svår — kör isolerade mätningar i motorn:
- Sätt upp 200 matcher med fixed scenario: ena laget får utvisning vid minut 30, mät mål-per-minut för det andra laget under 10-min-fönstret

### Acceptanskriterier (post-impl)

| Mått | Före | Mål |
|------|------|-----|
| avgSuspensionsPerMatch | 3.75 | 3.5-4.0 (oförändrat ±) |
| htLeadWinPct | 82.8% | 75-80% (närmare target 78.1%) |
| Comeback från −1 | ~18% | ≥22% |
| Comeback från −2 | ~9% | ≥12% |
| goals/match | 9.34 | 9.0-9.6 |
| awayWinPct | 38.3% | oförändrat (25-J satte detta) |

**Det här är inte exakta krav** — det är intervall som indikerar att powerplay nu är meningsfullt. Code itererar tills vidare.

### Steg 4: Stresstest
```bash
npm run stress -- --seeds=10 --seasons=3
npm run analyze-stress
```

---

## ITERATION

Testa H1 isolerat först. Om effekten är otillräcklig, testa H1 + H2. Om fortfarande otillräckligt, lägg till H3.

Stegen:
1. **H1:** `awayPenaltyFactor` 0.75 → 0.65. Mät. Förbättring? Sluta. Otillräckligt? Vidare.
2. **H1+H2:** även `trailingBoost` 0.11 → 0.15. Mät igen. Sluta om kriterier möts.
3. **H1+H2+H3:** lägg till `powerplayAttackBoost = 1.20`. Mät igen.
4. Om även H3 är otillräcklig — det är ett strukturellt problem, eskalera till Opus för analys.

---

## EFTER LEVERANS

`docs/sprints/SPRINT_25E_AUDIT.md` med:
- Vilka hypoteser som testades + vilka värden som landade
- Comeback-frekvenser före/efter (måste mätas — ny dimension)
- htLeadWinPct före/efter
- goals/match per fas (säkerhetsverifiering)
- Bekräftelse 1895/1895
- Stresstest-output

---

## COMMIT

```
feat: powerplay-effektivitet — riktig comeback-mekanik (Sprint 25e)

Rotorsak: 4x fler utvisningar (Sprint 25b.2) gav bara 0.4pp lägre htLeadWinPct.
Powerplay var dekoration — utvisningen registrerades men mannfördelen genererade
inte fler mål.

Ändring: [konkreta värden från iteration — t.ex. awayPenaltyFactor 0.75 → 0.65,
trailingBoost 0.11 → 0.15, eventuellt powerplayAttackBoost 1.20].

Effekt: htLeadWinPct 82.8% → ~76%. Comeback −1: 18% → ~25%. Comeback −2: 9% →
~13%. goals/match stabilt.

Tester: 1895/1895.
```

---

## VAD SOM INTE INGÅR

- **Visuell powerplay-feedback i UI.** "Powerplay 8:32 kvar"-räknare i MatchLiveScreen — separat sprint om värt. Den här sprinten handlar om motorn, inte UI:t.
- **Powerplay-specific commentary.** "Kraftspel utnyttjas till perfektion!" — kan läggas till senare via matchCommentary, inte del av 25-e.
- **Penalty-kill-strategi i taktikvy.** "Spela tight vid utvisning" — separat feature.
- **Asymmetri mellan hemma och borta.** `homePenaltyFactor` och `awayPenaltyFactor` är troligen lika idag. Behovet av asymmetri (hemmalaget ev. effektivare i powerplay pga publik) är inte mätt — antar symmetri tills vidare.

---

## OBSERVATION FÖR EFTER

När 25-e är levererad bör htLeadWinPct ligga närmare target. Då är **awayWinPct den enda 🔶 motoravvikelsen kvar.** 25-J satte awayWinPct → 38.3% (mätt), men H1-fixen i 25-e kan rubba det. Verifiera i 25-e-audit att awayWinPct inte rört sig signifikant.

Om awayWinPct håller och htLeadWinPct/comebacks träffar — motorn är formellt klar för långsiktig stabilisering. Då är nästa logiska sprint **THE_BOMB-leverans** (cross-system-text-paket), inte mer motor.

---

## KVARSTÅENDE: SPRINT 25-L

Sprint 25-L (KVF/SF goals/match-kompensation) är specat men nedprioriterat. Det är 🔶, inom 2× tolerans, ingen synlig spelarpåverkan. Tas vid lämpligt tillfälle eller låt vila.

Om 25-e ändrar goals/match i KVF/SF nämnvärt — re-evaluera 25-L då, inte nu.
