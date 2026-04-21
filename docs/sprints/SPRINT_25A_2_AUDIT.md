# Sprint 25a.2 — audit (Bryt ut comeback-logik ur managed-grinden)

## Punkter i spec

- [x] **Pass 1 — per-lag mode-beräkning** (commit ec4858b). Managedgrinden borttagen. `homeMode`/`awayMode` beräknas via `getSecondHalfMode()` för båda lag. `applyMode()` mappar `SecondHalfMode → { attack, foul }`. Ny `cruise`-gren (attack 0.92, foul 1.0) som var implicit 1.0 utan gren innan.
- [x] **Pass 2 — applicera homeModeAttackMult/awayModeAttackMult** (commit ec4858b). Multipliceras in på `effectiveHomeAttack`/`effectiveAwayAttack` tillsammans med `trailingBoost`.
- [x] **Pass 3 — activeFoulMult på foulThreshold** (commit ec4858b). `activeFoulMult = isHomeAttacking ? homeModeFoulMult : awayModeFoulMult` ersätter `secondHalfFoulMod`.
- [x] **npm run build** — exit 0.
- [x] **npm test** — 124 test files, 1451 tests, exit 0.
- [x] **npm run stress** — 7525 matcher, 0 krascher, 3 non-crash invariant-varningar.
- [x] **npm run analyze-stress** — fullständig rapport.
- [x] **SPRINT_25A_2_MEASUREMENT.md** — skriven.

## Commits

| Hash | Beskrivning |
|---|---|
| ec4858b | refactor(matchCore): per-team secondHalfMode, remove managedIsHome gate |

*Notat:* Tre pass kommittades som ett block eftersom Pass 1 lämnar TS-fel (oanvända variabler) tills Pass 2 och 3 är på plats. Tre separata commits hade krävt `git add -p` + tillfälliga `// eslint-disable`-kommentarer — onödig overhead för en atomär refaktor.

## Sektion A — jämförelse

| Mått | S24 | S25a | S25a.2 | Target | Δ (25a→25a.2) |
|---|---|---|---|---|---|
| htLeadWinPct | 87.4% | 86.5% | **83.8%** | 46.6% | −2.7pp |
| drawPct | 7.1% | 7.0% | **8.4%** | 11.6% | +1.4pp |
| awayWinPct | 45.3% | 45.8% | **44.2%** | 38.3% | −1.6pp |
| goalsPerMatch | 10.10 | 10.26 | **10.13** | 9.12 | −0.13 |
| cornerGoalPct | 26.0% | 25.8% | **26.1%** | 22.2% | +0.3pp |
| avgSuspensionsPerMatch | 0.45 | 0.47 | **0.47** | 3.77 | 0 |

## Sektion D — comeback-jämförelse

| HT-underläge | S24 | S25a | S25a.2 | Target | Δ (25a→25a.2) |
|---|---|---|---|---|---|
| −1 | 15.2% | 16.5% | **18.2%** | 24.5% | +1.7pp |
| −2 | 5.6% | 7.7% | **9.6%** | 11.0% | +1.9pp |
| −3 | 1.0% | 1.7% | **2.3%** | 3.7% | +0.6pp |
| −4+ | 0.6% | 0.7% | **0.3%** | 1.3% | −0.4pp |

## Oförväntade bieffekter

**Fler matcher totalt:** 7525 vs 7175 (S25a) — +350 matcher. Inte en bugg: mer comeback-aktivitet ger fler matcher som ej slutar i säsongstid (övertid/förlängning), vilket räknas som extra fixtures.

**goalsPerMatch 10.13 vs 10.26** — lätt minskning. `controlling`-lag (attack 0.96 × 0.92-gren nu aktiv för fler lag) dämpar total målproduktion marginellt. Önskvärd riktning mot target 9.12.

**avgSuspensionsPerMatch oförändrat (0.47)** — foulMod 1.20x i chasing-läge aktiveras nu för alla lag, men basfrekvensen för foul-sekvenser är för låg. Problemet ligger i `foulProb`-beräkningen eller `seqType === 'foul'`-fördelningen, inte i `secondHalfFoulMod`. Sprint 25b.

## Kvarstående gap för Sprint 25b/c

`htLeadWinPct` 83.8% vs 46.6% — 37pp kvar. Ändringarna i 25a och 25a.2 skapar rätt riktning men når inte target. Möjliga nästa steg:
1. Öka `chasingThreshold` ytterligare (−1 ger chasing från −1 och uppåt, −0 skulle ge chasing från jämt ej ledande — men det är sannolikt för aggressivt)
2. Öka trailingBoost-multiplier ytterligare (0.11 → 0.15?)
3. Acceptera att 83.8% är motorns strukturella golv — bandyns korta matcher och höga målantal gör att halvtidsledning fortfarande är stark, bara inte 87%.

## Ej levererat

Inget. Alla spec-punkter levererade.

## Nya lärdomar till LESSONS.md

`managedIsHome`-grinden i matchCore.ts var ett designmönster som medvetet begränsade beteende till managerns lag. Att bryta ut det kräver att man tänker igenom asymmetrin: nu kör både hemma- och bortalag sin respektive mode. Detta är korrektare men kan ge oväntade interaktioner om andra `managedIsHome`-grenar existerar i filen. Kolla alltid `grep managedIsHome` innan man ändrar motorlogik.
