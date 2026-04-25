# Sprint 25h Pass 3 — audit (Lager 3: Licensnämnden)

## Punkter i spec

- [x] 3A: licenseStatus (clear/first_warning/point_deduction/license_denied) på SaveGame
- [x] 3A: consecutiveLossSeasons på SaveGame
- [x] 3A: checkLicenseStatus() i licenseService.ts — status-maskin via netResult
- [x] 3A: 2 förlustår → first_warning, 3 → point_deduction, 4 → license_denied
- [x] 3A: Vinstår återställer till clear (med cleared-action om status var non-clear)
- [x] 3B: license_denied → managerFired = true i seasonEndProcessor
- [x] 3B: point_deduction → +3 i pendingPointDeductions för managedClub
- [x] 3C: pendingPointDeductions roteras till pointDeductions vid säsongsrullning
- [x] 3C: activeScandals töms vid säsongsslut (moves to scandalHistory)
- [x] 3C: Lager 2-trackers nollställs (wageBudgetOverrunRounds, wageBudgetWarningSent, riskySponsorOfferSentThisSeason)
- [x] 3D: ~12 svenska texter fördelade på 4 action-typer (cleared/first_warning/point_deduction/license_denied)
- [x] 3E: buildLicenseInboxItem() skapar InboxItemType.LicenseReview med korrekt id/title/body
- [x] 3F: 13 enhetstester i licenseService.test.ts

## Avvikelser från spec

- **Ingen "TA OM SÄSONGEN"-UI**: Spec nämner ingen specifik UI-förändring vid license_denied utöver managerFired=true. Befintlig managerFired-hantering tar hand om det (befintligt flöde för "sparkad").
- **pendingPointDeductions från scandaler bevaras**: Spec specificerar bara license-genererade deductions. Skandal-genererade pending-deductions (från lager 1) slås samman korrekt i rotationslogiken.

## Verifiering

```
npm run build → ✓ built in 11.19s
npm test      → 1889/1889 passed
npm run stress -- --seeds=3 --seasons=2 → 0 kraschar, 0 invariantbrott
```

## Commit

`3a591ab` — feat: bandyskandaler lager 3 — licensnämnden (pass 3/3)
