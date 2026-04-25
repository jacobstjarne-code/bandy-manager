# Sprint 25-HT — Halvtidsledning-analys

**Datum:** 25 april 2026  
**Motor-version:** post Sprint 25h  
**Datakälla:** 2000 matcher (10 seeds × 200), vite-node scripts/measure_htlead.ts

---

## 1. Sammanfattning

**Problemet existerar inte — målvärdet är felinmatat.**

`calibrationTargets.herr.htLeadWinPct = 46.6` stämmer inte med vad fältet låter som.
Räknar man ut htLeadWinPct direkt ur `bandygrytan_detailed.json`-rådata (1124 herr-
grundseriematcher) får man **78.1 %**. Motorns mätta 80.4 % avviker med **+2.3 pp** —
väl inom acceptabel tolerans.

Vad är 46.6 %? Det är andelen av *alla* matcher (inte bara de med HT-ledning) där
*hemmalaget* leder vid halvtid: 47.0 % i rådata. Fältet tycks ha döpts fel när
calibrationTargets byggdes.

Tre kompletterande mätningar bekräftar att motorn är välkalibrerad:

| Scenario | 1-måls ledning (vinner) | 2+-måls ledning (vinner) | Totalt |
|---|---|---|---|
| Bandygrytan — rådata | 61.6 % (n=375) | 89.7 % (n=532) | **78.1 %** |
| Motor — varierad lagstyrka | 66.0 % (n=594) | 88.7 % (n=1025) | **80.4 %** |
| Motor — lika lagstyrka (65/65) | 61.1 % (n=728) | 83.6 % (n=877) | **73.4 %** |

Den varierade-lagstyrka-motorn matchar Bandygrytan nära. Avvikelsen för 1-måls-
ledning (+4.4 pp) är liten och delvis förklarad av urvalsbias (se nedan).

---

## 2. Mätningar

### 2.1 Körning A — varierad lagstyrka (2000 matcher, seeds 0–9, 200 per seed)

Matchar CLUB_CAS-spridningen (rep 85 → 45) från calibrate.ts.

```
Halvtidsläge:
  Leder vid HT:      1619 / 2000 (81.0 %)
  Lika vid HT:        381 / 2000 (19.1 %)

Huvudmått:
  htLeadWinPct:       80.4 %   ← Bandygrytan-rådata: 78.1 %
  htLeadDrawPct:      11.4 %   ← Bandygrytan-rådata:  8.4 %
  htLeadLosePct:       8.3 %   ← Bandygrytan-rådata: 13.6 %

Uppdelat på vem leder:
  Hemmalag leder (n=894):  Win 81.5 %  Draw 11.0 %  Lose 7.5 %
  Bortalag leder (n=725):  Win 78.9 %  Draw 11.9 %  Lose 9.2 %

Uppdelat på marginal:
  1-måls ledning  (n=594):   Win 66.0 %  Draw 20.0 %  Lose 14.0 %
  2+-måls ledning (n=1025):  Win 88.7 %  Draw  6.3 %  Lose  5.0 %

2H mål/match (n=1619 matchper med HT-ledning):
  Ledande lag:  2.32  Jagande lag:  2.39  (ratio: 1.03 ×)

2H skott/match (attack-sekvenser, proxy för attack-frekvens):
  Ledande lag:  4.51  Jagande lag:  6.29  (ratio: 1.39 ×)

Konversionseffektivitet (mål / attack-sekvens-skott):
  Ledande lag:  51.4 %    Jagande lag:  38.0 %

Mål per 15-min-period:
  45–60 min:  Ledare 1202   Jagare 1364  (1.13 ×)
  60–75 min:  Ledare 1278   Jagare 1252  (0.98 ×)
  75–90 min:  Ledare 1271   Jagare 1255  (0.99 ×)
```

### 2.2 Körning B — lika lagstyrka (2000 matcher, CA 65 vs 65)

Isolerar motorns renodlade mekanik från urvalsbias.

```
htLeadWinPct:  73.4 %
1-måls ledning (n=728):   Win 61.1 %  Draw 22.3 %  Lose 16.6 %
2+-måls ledning (n=877):  Win 83.6 %  Draw 10.3 %  Lose  6.2 %

2H mål/match:   Ledare 2.26   Jagare 2.66   (ratio: 1.18 ×)
2H skott/match: Ledare 4.49   Jagare 6.53   (ratio: 1.45 ×)
Konversion:     Ledare 50.3 %  Jagare 40.8 %
```

### 2.3 Bandygrytan — rådata (1124 herr-grundseriematcher)

Manuellt beräknat ur `bandygrytan_detailed.json`:

```
HT-ledning:  907 / 1124 matcher (80.7 %)
HT-oavgjort: 217 / 1124 matcher (19.3 %)

htLeadWinPct:  78.1 %
  1-måls ledning  (n=375):  61.6 %
  2+-måls ledning (n=532):  89.7 %
Draws:   8.4 %
Comebacks: 13.6 %
```

**Vad 46.6 % faktiskt representerar:**  
Av alla 1124 matcher leder hemmalaget vid HT i 529 stycken = 47.0 %.  
Värdet i `calibrationTargets.herr.htLeadWinPct` är 46.6, troligen felnamnat fält
som egentligen mäter "andel matcher med HT-hemmaledning".

---

## 3. Kodkarta

### Filer och funktioner som styr halvtidsledning

**`matchCore.ts`**
- `getSecondHalfMode()` (rad 147–158): Beräknar mode per lag baserat på poängskillnad.  
  `diff <= -1` → `chasing`, `diff >= 3` → `cruise`, `diff >= 1 && step > 45` → `controlling`,  
  övriga → `even_battle`.  
- `applyMode()` (rad 626–631): Returnerar attackMultiplikator och foulMult per mode:  
  `chasing: { attack: 1.22, foul: 1.25 }`  
  `controlling: { attack: 0.88, foul: variabel }`
- `trailingBoost` / `leadingBrake` (rad 667–672): Appliceras på `effectiveAttack`:  
  `trailingBoost = min(|diff|, 3) × 0.16` per mål (max +48 % vid −3)  
  `leadingBrake  = min(|diff|, 3) × 0.08` per mål (max −24 % vid +3)
- `effectiveHomeAttack` / `effectiveAwayAttack` (rad 673–678): Kombinerar boost, brake och mode.  
  **Kritisk notering:** Dessa modifierare påverkar bara *initiativet* (hur ofta laget attackerar),  
  INTE chanceQuality (hur bra varje attack är).
- `chanceQuality` (rad 730–731): Beräknas ur `attAttack * 0.6 - defDefense * 0.4 + noise`,  
  där `attAttack = isHomeAttacking ? homeAttack : awayAttack` — **originalvärdet, ej det
  trailing-boostade effectiveAttack**.
- `SECOND_HALF_BOOST = 1.19` (rad 69): Global 19 % ökning på alla 2H-mål.
- `cornerStateMod` (rad 885–887): `cornerTrailingMod: 1.11`, `cornerLeadingMod: 0.90` —  
  jagande laget konverterar hörnor 23 % bättre.
- Post-corner counter (rad 934–939): Missat hörnslag kan ge ledaren ett friläge  
  baserat på `(1 - cornerAttackerRecovery) × 0.09`.

**`matchUtils.ts`**
- `PHASE_CONSTANTS` (rad 55–58): phase multipliers för mål/hörn/utvisning.
- `GOAL_TIMING_BY_PERIOD[]` (rad 16–26): Empirisk viktning per 10-min-period.

**Konversionseffektivitetsgapet — orsaksanalys:**  
I körning B (lika CA) är konversionen 50.3 % (ledare) vs 40.8 % (jagare). Tre faktorer:
1. **Post-corner-counter:** Ledarens "frimål" från jagarlaget miss-hörnor räknas inte som skott,  
   men räknas som mål → inflerar ledarens konversionskvot.
2. **Hörnmål-vs-attack-shots-ratio:** Hörnmål (22 % av alla mål) inkluderas i täljaren men hörnor  
   inkluderas inte i `shotsHome`/`shotsAway`. Lika proportionellt för båda lag, men post-corner-  
   counters skapar asymmetri.
3. **Mätartefakt:** "Konversion" är inte en ren metric — riktigare är att jämföra total 2H-  
   xG/mål inklusive hörnor, vilket ger ratio 1.18 × (jagare/ledare) för lika CA.

Slutsatsen är att den *upplevda* konversionsklyftan är delvis ett mätartefakt. Den *verkliga*  
mål-frekvensfördelningen i 2H är 1.18 × fördel jagare (lika CA) och 1.03 × fördel jagare  
(varierad CA).

---

## 4. Hypoteser

### Hypotes A: Targetvärdet är felinmatat — motorn är kalibrerad ✅

**Hypotes:** `calibrationTargets.herr.htLeadWinPct = 46.6` är ett felnamngivet fält (egentligen  
"andel matcher med hemma-HT-ledning"), inte htLeadWinPct. Motorn på 80.4 % matchar  
Bandygrytan-rådata (78.1 %) med +2.3 pp.

**Stöd från data:**  
- `homeHtLeadFraction` räknad från rådata = 47.0 % ≈ 46.6 % i JSON.  
- `htLeadWinPct` räknad från rådata = 78.1 %.  
- Motor varierad CA = 80.4 %, gap +2.3 pp.

**Stöd från kod:** Ingen kodyta behöver ändras.

**Förslag till fix:** Uppdatera `bandygrytan_detailed.json`:  
```json
"htLeadWinPct": 78.1,
"homeHtLeadFraction": 46.6
```

**Risk:** Noll. Ingen mekanisk ändring.

---

### Hypotes B: Svag överprestation vid 1-måls ledning (+4.4 pp)

**Hypotes:** Motor ger 66.0 % vinstchans vid 1-måls HT-ledning, Bandygrytan visar 61.6 %.  
Gapet är +4.4 pp och kan adresseras med finjustering.

**Stöd från data:**  
- Varierad CA: 66.0 % (n=594)  
- Lika CA: 61.1 % (n=728) — nästan exakt på mål!  
- Gapet i varierad CA beror på urvalsbias: laget som leder 1-0 vid HT är i genomsnitt  
  starkare → högre attack-CA → naturligt högre chans att hålla ledningen.

**Stöd från kod:** Ingen specifik kodbugg — urvalsbias är korrekt beteende för ett  
realistiskt system med heterogena lag.

**Förslag till fix:** Inget akut. Om man vill justera: öka `chasingThreshold` från −1 till 0  
(så att jämt läge ger `chasing`-mode), men det riskerar att höja goalsPerMatch och awayWinPct.

**Risk:** Medel — ändring av `chasingThreshold` påverkar alla matcher, inte bara 1-mål.

---

### Hypotes C: 2+-måls HT-ledning styr statistiken och är korrekt kalibrerad

**Hypotes:** Motor 88.7 % vs Bandygrytan 89.7 % vid 2+-måls ledning — ett gap på −1.0 pp  
(motorn är faktiskt en aning lägre än verkligheten). Ingen åtgärd motiverad.

**Stöd från data:** Motor varierad CA: 88.7 %, rådata: 89.7 %.

**Förslag till fix:** Inget.

**Risk:** Noll.

---

### Hypotes D: Halvtidsfördelningen (80.7 % av matcher har HT-ledning) är korrekt

**Hypotes:** Motor visar 81.0 % av matcher med HT-ledning, Bandygrytan 80.7 % (907/1124).  
Träffar exakt.

**Stöd från data:** Motor 81.0 %, rådata 80.7 %.

**Förslag till fix:** Inget.

**Risk:** Noll.

---

## 5. Rekommendation

**Prioritetsordning:**

1. **Omedelbart: Fixa calibrationTargets i bandygrytan_detailed.json (Hypotes A)**  
   Ändra `htLeadWinPct: 46.6 → 78.1` och lägg till `homeHtLeadFraction: 46.6`.  
   Uppdatera analyze-stress.ts om `targets.htLeadWinPct` används (rad 177).  
   Ingen motorsprint behövs — motorn är kalibrerad.

2. **Valfritt: Mild finjustering av 1-måls-ledning (Hypotes B)**  
   Om +4.4 pp bedöms som meningsfullt i nästa kalibreringssprint kan man undersöka  
   om `chasingThreshold = -1` bör vara `0` (lika ledning → chasing-mode). Men  
   regressionsmätning krävs mot goalsPerMatch och awayWinPct innan commit.

3. **Sprint 25-HT kan stängas utan kodändringar.**  
   Befintlig motor är välkalibrerad mot empirisk data. Nästa prestandaproblem att  
   adressera (per STATUS.md) är `awayWinPct` (+5.6 pp) och `playoff_final mål/match`  
   (+2.17 mål).

---

## 6. Bilaga: Rådata och kontrollberäkningar

### Bandygrytan htLeadWinPct manuell verifiering

```
Fil: docs/data/bandygrytan_detailed.json
Urval: herr, phase=regular, n=1124

htLead-matcher:   907 (80.7 %)
htOavgjort:       217 (19.3 %)

htLeadWins:  708  (78.1 %)
htLeadDraws:  76  ( 8.4 %)
htLeadLoses: 123  (13.6 %)

homeHtLeadFraction (hemmalag leder vid HT):
  529 / 1124 = 47.0 % ≈ calibrationTargets.herr.htLeadWinPct (46.6 %)
  → Identifierat som källan till felnamngivet fält
```

### Motor-mätskript

```bash
# Körning A — varierad CA (matchar stress-test):
node_modules/.bin/vite-node scripts/measure_htlead.ts

# Körning B — lika CA (isolerar mekanik från urvalsbias):
node_modules/.bin/vite-node scripts/measure_htlead_equalca.ts
```

Mätskripten (`measure_htlead.ts`, `measure_htlead_equalca.ts`) finns kvar i `scripts/`
för reproducerbarhet. Kan arkiveras efter att JSON-fixen är committad.
