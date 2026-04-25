# Sprint 25f — Halvtidsledning & comeback-dynamik

**Status:** SPEC KLAR — REDO ATT IMPLEMENTERAS
**Prioritet:** MEDEL (strukturellt gap som återstår efter 25b-25e)
**Estimat:** 3-4 timmar implementation + stresstest-mätning + iteration

---

## KONTEXT

Efter Sprint 25e (corner-kalibrering) är motorn på många punkter inom tolerans, men två gap kvarstår — och de är **samma problem i två vyer**:

| Mått | Motor | Target | Gap |
|------|-------|--------|-----|
| `htLeadWinPct` | 82.5% | 46.6% | **+35.9pp** |
| `comeback −1` | 16.8% | 24.5% | −7.7pp |
| `awayWinPct` | 43.9% | 38.3% | +5.6pp |
| `homeWinPct (KVF)` | 51.6-53.4% | 60.3% | −7pp |

**Rotorsak:** motorn ger för stark fördel till den som leder vid halvtid. Underläge-lag kommer inte tillbaka ofta nog. Detta syns som:
- Halvtidsledare vinner 82.5% (verkligheten: 46.6% — nästan hälften tappar eller kryssar)
- Bara 16.8% av underläge-lag (−1) vänder till vinst (verkligheten: 24.5%)

## DJUPANALYS AV NUVARANDE MOTOR

Jag har läst matchCore.ts. Tre mekanismer försöker redan balansera andra halvlek men räcker inte:

### 1. `trailingBoost` (rad ~560 i matchCore.ts)
```typescript
const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.11 : 0
```
Ger 11% attack-boost per måls underläge, max 33%. **Problem:** Applieras först `step >= 30` (andra halvlek), inte direkt vid halvtid. Och 11% är för lite — sluter inte gapet empiriskt.

### 2. `getSecondHalfMode` (rad ~180)
Klassificerar laget som `chasing`/`controlling`/`even_battle`/`cruise`. Ger multiplikatorer:
- `chasing`: attack ×1.14, foul ×1.20
- `controlling`: attack ×0.96 (svag bromsning av ledande lag)
- `even_battle`: attack ×1.04 från step 50
- `cruise`: attack ×0.92

**Problem:** `controlling` bromsas bara med 0.96. Ett lag som leder med 1-2 mål fortsätter attackera nästan lika starkt. Verkligheten: ledande lag försvarar, tappar initiativ, släpper motståndare fram.

### 3. `homePenaltyFactor` / `awayPenaltyFactor` (rad ~570)
```typescript
const homePenaltyFactor = homeActiveSuspensions > 0 ? 0.75 : 1.0
```
Vid utvisning sjunker attacken till 75%. **Problem:** Det är mild — 75% är en svag powerplay-effekt. Bandygrytan-data visar att powerplay är ett av de starkaste comeback-verktygen. Motorn omsätter det inte.

## DESIGNBESLUT

**Tre samverkande justeringar.** Ingen är tillräcklig ensam — problemet är att alla tre är för milda.

### Princip: konservera totala mål/match

`goalsPerMatch` är nu 9.20 ✅. Denna sprint får inte skada det. Höjd comeback-chans för underläge-lag ska **balanseras** av att ledande lag bromsar mer. Totalmängden mål konserveras, bara distributionen ändras.

## IMPLEMENTATION

### Ändring 1: Starkare `trailingBoost`

**Fil:** `matchCore.ts`, rad ~560

```typescript
// Idag:
const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.11 : 0

// Nytt:
const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.16 : 0
```

Från 11% per måls underläge → 16%. Max boost 48% (var 33%). Applieras på attack-sidan i andra halvlek.

### Ändring 2: Lägg till `leadingBrake`

**Ny mekanism.** Samma logik baklänges — ledande lag bromsas.

**Fil:** `matchCore.ts`, rad ~560 (intill `trailingBoost`)

```typescript
// Ny:
const leadingBrake = (diff: number) => diff > 0 ? Math.min(diff, 3) * 0.08 : 0
const homeLeadBrake = leadingBrake(homeScore - awayScore)
const awayLeadBrake = leadingBrake(awayScore - homeScore)
```

Applicera i beräkningen av `effectiveHomeAttack` / `effectiveAwayAttack`:

```typescript
// Idag:
const effectiveHomeAttack = step >= 30
  ? clamp(homeAttack * (1 + homeTrailBoost) * homeModeAttackMult, 0, 1)
  : homeAttack

// Nytt:
const effectiveHomeAttack = step >= 30
  ? clamp(homeAttack * (1 + homeTrailBoost) * (1 - homeLeadBrake) * homeModeAttackMult, 0, 1)
  : homeAttack
```

Samma för `effectiveAwayAttack`. 8% broms per måls ledning, max 24%. Laget som leder med 3+ mål tappar 24% attackstyrka i andra halvlek — simulerar att de försvarar, slappnar av, rullar ner tempo.

### Ändring 3: Skärp `controlling`-mode

**Fil:** `matchCore.ts`, `applyMode`-funktionen, rad ~715

```typescript
// Idag:
if (mode === 'controlling') return { attack: 0.96, foul: 1.0 + (1.0 - td) * 0.25 }

// Nytt:
if (mode === 'controlling') return { attack: 0.88, foul: 1.0 + (1.0 - td) * 0.25 }
```

Ledande lag (1-2 mål, step >45) bromsas från 0.96 → 0.88. Det här är komplementärt till `leadingBrake` — `controlling` adresserar specifikt **senare delen** av andra halvlek när laget blir mer defensivt.

### Ändring 4: Skärp `chasing`-mode

```typescript
// Idag:
if (mode === 'chasing')     return { attack: 1.14, foul: 1.20 }

// Nytt:
if (mode === 'chasing')     return { attack: 1.22, foul: 1.25 }
```

Underläge-lag (1+ mål under) får attack 1.22 (var 1.14) och foul 1.25 (var 1.20). Bättre comeback-chans men mer risk för utvisningar.

## NETTOEFFEKT

För ett lag som leder 1–0 vid halvtid:
- **Idag:** controlling 0.96, ingen leadBrake → 96% attack
- **Nytt:** controlling 0.88 × leadBrake 0.92 = 81% attack (19% broms)

För ett lag som ligger under 0–1 vid halvtid:
- **Idag:** chasing 1.14 × trailBoost 1.11 = 127% attack
- **Nytt:** chasing 1.22 × trailBoost 1.16 = 142% attack

Sammanlagd skillnad (chasing vs controlling): 127/96 = 1.32 → 142/81 = 1.75. Underläge-laget får 75% mer attack-styrka än ledande lag (var 32%). Det är en stor förändring.

## VERIFIERING

Kör samma stresstest som gav 25e-diagnosen (6 seeds × 4 säsonger, 3978 matcher).

**Primär-målvärden:**
| Mått | Target | Tolerans |
|------|--------|----------|
| `htLeadWinPct` | 46.6% → **målintervall 60-70%** | (realistiskt, inte 46.6% direkt) |
| `comeback −1` | 24.5% → **målintervall 20-25%** | |
| `goalsPerMatch` | 9.20 → **behåll 9.0-9.4** | får inte skadas |

**Sekundär-uppföljning:**
- `awayWinPct` ska sjunka mot 38-42% (från 43.9%)
- `homeWinPct grundserie` ska ligga kvar 46-50%
- `comeback −2` och `comeback −3` förväntas också lyfta något
- `penaltyGoalPct` förväntas stabilt runt 3-5%

## ITERATIONSPLAN

Det är osannolikt att första körningen träffar exakt. Därför:

1. **Implementera alla fyra ändringar.** Kör stresstest.
2. **Om `htLeadWinPct` hamnar under 55%:** minska `leadingBrake` från 0.08 → 0.06, eller `controlling` från 0.88 → 0.92. För mycket broms.
3. **Om `htLeadWinPct` fortfarande över 75%:** öka `trailingBoost` från 0.16 → 0.19, eller `chasing` från 1.22 → 1.28. För lite boost.
4. **Om `goalsPerMatch` skadas (under 8.8 eller över 9.6):** det betyder att broms och boost inte balanserar. Dokumentera och iterera.

Max 2 iterationer på motor-konstanter. Om det kräver 3+ iterationer är designen fel och vi behöver ny analys.

## VAD SOM INTE GÖRS

- Ingen ändring av `homePenaltyFactor` / `awayPenaltyFactor` (utvisnings-effekt). Låt motorn köra utan att röra det — om powerplay fortfarande känns svagt efter sprintar behövs en separat utredning.
- Ingen ändring av `homeAdvantage` eller `phaseConst.homeAdvDelta`.
- Ingen ändring av goal-timing-konstanter.
- Ingen ändring av `cornerBase` — det är nyligen kalibrerat i 25e.

## COMMIT-FORMAT

```
feat: sprint 25f — halvtidsledning + comeback balansering

- trailingBoost: 0.11/mål → 0.16/mål
- Ny leadingBrake: 0.08/mål för ledande lag i 2a halvlek
- controlling-mode attack: 0.96 → 0.88
- chasing-mode attack: 1.14 → 1.22, foul: 1.20 → 1.25

Rotorsak: motorn hade tre separata mekanismer (trailingBoost,
second-half mode, powerplay) som alla var individuellt för milda.
Halvtidsledare vann 82.5% mot verklighetens 46.6% — ett strukturellt
+35.9pp gap. Fyra samverkande justeringar: underläge-lag får mer
attack + foul, ledande lag bromsar mer explicit. Balanserat för att
konservera goalsPerMatch (9.20).
```

---

## KLARTEXT TILL CODE

```
Sprint 25f (halvtidsledning + comeback).
Full spec: docs/sprints/SPRINT_25F_HT_LEAD_COMEBACK.md

Fyra ändringar i src/domain/services/matchCore.ts:
1. trailingBoost: 0.11 → 0.16 per måls underläge
2. Lägg till leadingBrake: 0.08 per måls ledning (applicera som 
   (1 - leadBrake) på effectiveAttack i andra halvlek)
3. applyMode() controlling: attack 0.96 → 0.88
4. applyMode() chasing: attack 1.14 → 1.22, foul 1.20 → 1.25

Efter implementation: kör stresstest (6 seeds × 4 säsonger) och 
rapportera som SPRINT_25F_MEASUREMENT.md. Nyckeltal som MÅSTE 
rapporteras:
- htLeadWinPct (target 60-70%, idag 82.5%)
- comeback −1 (target 20-25%, idag 16.8%)
- goalsPerMatch (behåll 9.0-9.4, idag 9.20)
- awayWinPct, homeWinPct grundserie, homeWinPct KVF

Om htLeadWinPct hamnar <55% eller >75% — iterera en gång enligt 
iterationsplanen i spec:en.

Om goalsPerMatch skadas (under 8.8 eller över 9.6) — flagga utan 
att fortsätta iterera. Designen kan behöva omprövas.

Max 2 iterationer. Flagga om gapet kvarstår efter det.
```
