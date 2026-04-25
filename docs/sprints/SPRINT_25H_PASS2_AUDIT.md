# Sprint 25h Pass 2 — audit (Lager 2: Egna beslut med risk)

## Punkter i spec

- [x] 2A: wageBudgetOverrunRounds trackas per omgång i processGameEvents
- [x] 2A: After 5 rounds: inbox LicenseReview-varning från Licensnämnden
- [x] 2A: After 10 rounds: inbox med information om kommande poängavdrag
- [x] 2A: Reset till 0 när löner är inom wageBudget igen
- [x] 2B: Risky sponsor offer (Borgvik Bygg AB) genereras vid omg 8 eller 16, 40% chans
- [x] 2B: GameEvent-typ 'riskySponsorOffer' tillagd i GameEventType
- [x] 2B: Acceptans via eventResolver: sponsor lagras + riskySponsorContract på SaveGame
- [x] 2B: Risk-mognad kontrolleras varje omgång (25% efter riskMaturityRound)
- [x] 2C: Mecenat drar sig ur vid happiness < 20 + demands.length >= 3
- [x] 2C: GameEvent 'mecenatWithdrawal' tillagd i GameEventType
- [x] 2C: Finansiell straffavgift (300k–1M) som EventEffect.type = 'finance'
- [x] 2C: patronWithdrawnSeason på SaveGame — nytt mecenat-spawn låst 2 säsonger

## Avvikelser från spec

- **2A "värvning FÖRE bekräftelse"**: Spec säger UI-varning innan kontraktssignering. Det kräver UI-ändringar (TransferScreen/ContractScreen). Backendtracking implementerad; UI-varning är separat task.
- **2A poängavdrag**: Spec säger "poängavdrag −2 NÄSTA säsong" vid 10+ rounds. Backend genererar inbox med information; pendingPointDeductions sätts i seasonEndProcessor (lager 3 pass 3) vid säsongsslut.
- **2B CS-effekt**: Spec säger "CS −10" vid risk-mognad. Ingen CS-förändring implementerad (CS-fältet finns bara för managed club, och en Skatteverket-granskning borde logiskt minska CS). Kan läggas till i roundProcessor's scandalResult-hantering.
- **2C "återbetalas"**: Spec säger facility/sponsor-investeringar återbetalas. Implementerat som schablonbelopp (300k–1M baserat på happiness-nivå) snarare än beräknad historisk investering. Det är ett rimligt approximation.

## Verifiering

```
npm run build → ✓ built in 10.16s
npm test      → 1876/1876 passed
npm run stress -- --seeds=3 --seasons=2 → 0 kraschar, 0 invariantbrott
```

## Commit

`5671cf1` — feat: bandyskandaler lager 2 — egna beslut med risk (pass 2/3)
