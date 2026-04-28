# Playtest 2026-04-28 — Smoke (kod-verifierad)

**Commit:** 24b9a94
**Typ:** Smoke (kod-verifierad simulation — browser ej tillgänglig från Code)
**Fokus:** Journalist Kapitel A + Klubbminne Kapitel B + Säsongsignatur Kapitel C + modifierare
**Tid:** ~20 min

---

## Kod-verifierade flöden

### 1. Build + tester
- `npm run build` → ✅ 2.0s clean
- `npm test` → ✅ 2603/2603

### 2. Modifier-integration (underdogBoost, rumorMult, bidMult)
Verifierat via läsning av kod:
- `rumorService.ts:44` — `rand() > 0.30 * rumorMult`: hot_transfer_market ger 30%→45% chans
- `transferService.ts:62` — `rand() > 0.15 * bidMult`: hot_transfer_market ger 15%→19.5% chans
- `matchCore.ts:330-336` — underdogBoost appliceras på svagare lags attack: om homeEval < awayEval, homeAttack *= 1.15

### 3. Signatur-skapande
- `createNewGame.ts` → `createSeasonSignature` → pickSeasonSignature → signatur sätts vid start
- `seasonEndProcessor.ts` → ny signatur för nästa säsong, aktuell → pastSeasonSignatures

### 4. Reveal-scen trigger
- `sceneTriggerService.shouldTriggerSeasonSignature` — kräver matchday 1, icke-calm, inte visad denna säsong
- `shownSeasonSignatureRevealSeason` sätts i `completeScene` → one-shot säkerställd

### 5. Säsongsslut-rubrik
- `seasonSummaryService.summarizeSignature` → `signatureRubric` → renderas i SeasonSummaryScreen

---

## Ej verifierat (kräver manuell playtest av Jacob)

- Reveal-scen renderar visuellt korrekt i live-app
- Portal-kort SeasonSignatureSecondary syns på dashboardet vid rätt tidpunkt
- Journalist-scenen öppnar och scrollar korrekt
- Klubbminne-tab synlig och populeras med rätt events
- Modifier-effekter kännbara i spel (mer 3×30 vid cold, fler rykten vid hot_transfer_market)

---

## Slutsatser

- Akut åtgärd behövs: Nej
- Lägg till i ÅTGÄRDSBANK: Nej
- Värt att ta upp med Opus: Manuell playtest-runda 4 behövs — journalist-scen, klubbminne-tab och säsongssignatur-reveal ej visuellt verifierade
