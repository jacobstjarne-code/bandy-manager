# CODE INSTRUCTION — Leading-team Bug Hypothesis Test
**Datum:** 2026-05-14
**Typ:** Engine-fix (två stycken) + regenerering + revalidering
**Output:** Kod-ändringar + delta-rapport till `docs/findings/`

## Mål

Testa hypotesen att tre observerade avvikelser har en gemensam underliggande orsak i hur ledande lag konverterar övertag:

1. `cornerStrategy` påverkar inte konvertering (Fynd 1, ENGINE_ANOMALIES_2026-05-14.md)
2. Lag som leder 2-0 i halvtid vinner 73.1% mot referens 90% (Fynd 3)
3. Hemmavinst-rate 45.5% mot target 50.2% (validate.ts, dolt av ±10 pp tolerans)

**Hypotes:** Om Fix B löser Fynd 1 *och* samtidigt rör Fynd 3 + hemmavinst-rate mot referens, är det en bug, två symptom. Om bara Fynd 1 rör sig, är de tre separata problem.

Den här instruktionen fixar två saker (kvantisering + cornerStrategy), regenererar datat och revaliderar. Inga ändringar i `cruise`/`trailing`-logik eller `MatchProfile`-vikter — de hålls konstanta för att isolera Fix B:s effekt.

## Förförståelse — läs först

1. `docs/findings/ENGINE_ANOMALIES_2026-05-14.md` — fynden i sin helhet
2. `src/domain/services/matchCore.ts` rad 559 (cornerStrategy → wCorner), rad 669 (minute = round(step*1.5))
3. `src/domain/services/cornerInteractionService.ts` — `resolveCorner()`-signaturen
4. `scripts/data-warehouse/generate.ts` — hur events skrivs till `match_events`

## Fix A — Tidskvantiseringsbruset (Fynd 2)

**Var:** `scripts/data-warehouse/generate.ts`, vid skrivning av rader till `match_events`.
**Vad:** Vid varje event-write, jitter `minute` med uniform brus i `[-1, +1]` och clamp till matchens period-gränser (0–45 för period 1, 45–90 för period 2).
**Pseudokod:**
```ts
const jitter = (rng() * 2) - 1  // uniform [-1, 1]
const jitteredMinute = Math.max(periodStart, Math.min(periodEnd, event.minute + jitter))
// skriv jitteredMinute till match_events.minute
```
Använd samma seed-strategi som resten av generate.ts (deterministisk per match).

**Vad fixet INTE gör:** ändrar inte motorns inneboende tidsupplösning (1.5 min/step). Det är en arkitektur­ändring som inte hör hemma i denna batch. Vi bara döljer kvantiseringen i datalagret så att tidsanalyser blir meningsfulla. Dokumentera detta som en kommentar vid jitter-koden.

**Verifiering efter fix:** Kör SQL `SELECT minute % 3, COUNT(*) FROM match_events GROUP BY minute % 3`. Alla tre buckets ska ha ungefär lika många rader (±10%). Om en bucket är fortfarande tom = jitter applicerades inte korrekt.

## Fix B — cornerStrategy → konvertering (Fynd 1)

**Var:** `src/domain/services/cornerInteractionService.ts`, `resolveCorner()`.
**Vad:** Lägg till `cornerStrategy: CornerStrategy` som argument och låt det modifiera konverteringschansen.

**Implementering:**
1. Lägg till parameter `cornerStrategy: CornerStrategy` i `resolveCorner()`-signaturen
2. Beräkna multiplikator:
   - `aggressive`: deliveryMod × 1.15 (eller motsvarande höjning av scoring-chans)
   - `standard`: 1.0 (oförändrat)
   - `safe`: deliveryMod × 0.88 (sänker)
3. Uppdatera anropssidan i `matchCore.ts` (rad ≈559 och eventuellt fler ställen) att skicka `tactic.cornerStrategy` till `resolveCorner()`

**Magnitud-mål:** Skillnaden i konverteringsgrad mellan aggressive och safe ska efter fix vara ≥ 2 procentenheter i `realistic`-bucket. Justera multiplikatorerna om så inte blir fallet vid första körningen.

**Trade-off (lämna för framtida batch):** Aggressive borde i game design även medföra ökad risk för kontring/utvisning efter förlorad hörna. Det är medveten utelämning i denna fix för att isolera konverterings-effekten. Notera det i en TODO-kommentar.

**Verifiering efter fix:** Kör analysen från Fynd 1 igen. aggressive-konvertering > safe-konvertering med ≥ 2 pp. Om < 2 pp = öka multiplikator-spridning.

## Steg C — Regenerera datamängden

1. Backup: `cp data-warehouse/matches.db data-warehouse/matches.pre-fix-2026-05-14.db`
2. Kör `generate.ts` med samma sampling-konfiguration som tidigare (1050 matcher: realistic 600, varied 250, edge 100, control 50, limits 50). Använd nya seeds — *inte* identiska med första körningen.
3. Bumpa `ENGINE_VERSION` i `matchCore.ts` till `1.1.0` (eller liknande markering) så att gammal och ny data är distinkta.

## Steg D — Re-validate + analysrepris

Kör i denna ordning:

1. `node_modules/.bin/vite-node scripts/data-warehouse/validate.ts` — alla 10 grova kontroller. Notera särskilt målsnitt och hemmavinst-rate.
2. **Repris av Analys 2** (P(slutresultat | HT-diff)): SQL från ENGINE_ANOMALIES_2026-05-14.md, Fynd 3. Notera särskilt −2-bucket och +2-bucket.
3. **Repris av Analys 4** (cornerStrategy konvertering): SQL från ENGINE_ANOMALIES_2026-05-14.md, Fynd 1. Notera spridning aggressive vs safe.

## Steg E — Delta-rapport

Skriv till: `docs/findings/POST_FIX_VALIDATION_2026-05-14.md`

**Struktur:**

```
# Post-fix Validation — 2026-05-14

## Vad ändrades
- Fix A: minute-jitter i generate.ts (commit-hash)
- Fix B: cornerStrategy i resolveCorner() (commit-hash)
- Engine version: 1.0.0 → 1.1.0
- Ny datamängd: 1050 matcher, nya seeds

## Validate.ts före/efter

| Metric | Före (1.0.0) | Efter (1.1.0) | Delta |
|--------|-------------|--------------|-------|
| Målsnitt | 9.058 | … | … |
| Hemmavinst-rate | 45.5% | … | … (target 50.2%) |
| Hörnsnitt | 16.5 | … | … |
| Reproducerbarhet | 5/5 | … | … |

## Analys 2 före/efter (P(slututfall | HT-diff))

[Två korstabeller side-by-side. Fokus: −2 och +2 buckets.]

## Analys 4 före/efter (cornerStrategy konvertering)

[Tabell. Fokus: aggressive vs safe spridning.]

## Hypotesutfall

Den underliggande hypotesen var: "Fynd 1 + Fynd 3 + hemmavinst-rate-driften är symptom på en bug."

[Välj ett av tre utfall:]

A. **Hypotes bekräftad.** Fix B löste Fynd 1 (förväntat) OCH Fynd 3 rör sig markant mot referens OCH hemmavinst-rate stiger närmare 50.2%. En bug, två symptom.

B. **Hypotes delvis bekräftad.** Fix B löste Fynd 1 men Fynd 3 / hemmavinst-rate rör sig bara marginellt. Det finns en delkoppling men separata mekanismer kvarstår.

C. **Hypotes avvisad.** Fix B löste Fynd 1 men Fynd 3 + hemmavinst-rate är opåverkade. Tre separata problem.

## Nästa steg

[Baserat på utfall:]
- Om A: ingen ytterligare fix behövs för Fynd 3, men Fynd 4 kvarstår.
- Om B eller C: Fynd 3 behöver separat åtgärd i cruise/trailing-logik. Identifiera vilka delar av matchCore.ts som styr ledande lag i andra halvlek.
```

## Vad du INTE ska göra

- Ändra `MatchProfile`-vikter, `PHASE_CONSTANTS`, `SECOND_HALF_BOOST` eller `MATCH_TOTAL_GOAL_CAP`
- Ändra `cruise`/`trailing`-logik annat än indirekt via cornerStrategy
- Lägga till trade-off för aggressive corners (utvisning/kontring) i denna batch — separat task
- Köra i plan mode — det här är implementation
- Skriva om Fynd 4 — den behandlas i separat batch (per-profil-analys + cap-borttagen VMR)

## Stopp

När delta-rapporten är skriven och hypotesutfall A / B / C är angivet med stöd i siffrorna. Hellre ett tydligt B än en överoptimistisk A.
