# Sprint 25h — Final Audit

**Datum:** 2026-04-25  
**Scope:** Verifiera samtliga leveranser i Sprint 25h inkl. Opus direkt-edits och A1

---

## Punkter i spec

### Lager 1 — Världshändelser (AI-klubbar)
- [x] 8 arketyper implementerade i `scandalService.ts` (sponsor_collapse, club_to_club_loan, treasurer_resigned, phantom_salaries, fundraiser_vanished, coach_meltdown, municipal_scandal, small_absurdity)
- [x] Triggerfönster omg 6-8, 12-14, 18-20, 24-26 med 25% chans/fönster
- [x] Max 1 skandal per klubb per säsong
- [x] `municipal_scandal` hanterar managed club (pos/neg 50/50)
- [x] `small_absurdity` har noll mekanisk effekt — ren atmosfär
- [x] `processScandals` i eventProcessor med `skipSideEffects`-option för stresstest-determinism
- [x] 18 scandal-tester + determinism-test

### Lager 2 — Egna beslut
- [x] 2A: löneöverskridande trackas per omgång → Licensnämnden-varning vid 5, poängavdrag vid 10
- [x] 2B: skum sponsor-erbjudande (4 varianter, 8-20 tkr/säsong), riskexponering 6-12 omg senare
- [x] 2C: mecenat lämnar vid `happiness < 20` + 3+ ignorerade krav, 3 personlighets-varianter
- [x] Kurerad text integrerad (revision 2) för 2A/2B/2C

### Lager 3 — Licensnämnden
- [x] Konsekutiva förlustsäsonger → first_warning (2) → point_deduction (3, −3p) → license_denied (4, sparkad)
- [x] 13 licensnämnden-tester
- [x] `pendingPointDeductions` roteras → `pointDeductions` vid säsongsrullning

### Sprint TS-1 (bas för 25h)
- [x] roundProcessor delad i processors
- [x] `isSecondPassForManagedMatch` / `skipSideEffects` på alla processors
- [x] 0 determinism-brott i stress-test

### Opus direkt-edits (2026-04-25)
- [x] `bandygrytan_calibration_targets.json` — `htLeadWinPct: 78.1`, `homeHtLeadFraction: 46.6` tillagd
- [x] `economyProcessor.ts` — `sponsor_collapse` drar -3k/v hela säsongen via FinanceEntry (managed) / direkt (AI)
- [x] `mediaProcessor.ts` + `mediaService.ts` — `generateAbsurdityArticles` plockar `small_absurdity` från `scandalHistory`, genererar tidningsrubrik + kafferum-citat
- [x] `roundProcessor.ts` — `riskySponsorTriggered`-state appliceras (sponsor-borttag, rep −5, CS −10, `riskySponsorContract = undefined`)

### A1 — Ordförande-varning vid lönebudget-överskridande
- [x] `<WageOverrunWarning>`-komponent skapad (`src/presentation/components/transfers/WageOverrunWarning.tsx`)
- [x] 3 varianter: lätt (1-15%), märkbart (16-30%), allvarligt (>30%)
- [x] 3 texter per variant, väljs deterministiskt via `seasonSeed % 3`
- [x] `{PCT}`-token ersätts med faktiskt överskridande-procent
- [x] Intercepterar `handleRenew` i TransfersScreen
- [x] Intercepterar `handleBid` i TransfersScreen
- [x] Hindrar inte köpet — spelaren kan alltid gå vidare

### A2–A4, B
- [x] A2: Licensnämnden-status — warning-banner i DashboardScreen vid `licenseStatus !== 'clear'`. Tre varianter: first_warning (⚠️), point_deduction (🔴), license_denied (🚨). Visar antal förlustsäsonger och konsekvens.
- [x] A3: Skum sponsor-varning — rad i Ekonomi-kortet om `game.riskySponsorContract` är aktiv. Visar risk-mognadssrunda.
- [x] A4: Mecenat happiness-indikator — separat kortsektion under 2×2-grid vid aktiva mecenater. Namn + happiness-label (Missnöjd/Otålig/Nöjd/Entusiastisk) + 5-punkts pip-rad färgkodad per happiness.
- [ ] B: Speltest playtest-runda 4 (ej utförd)

---

## Verifiering

### Build
```
✓ built in 9.93s (efter fix av oanvänd `rand`-parameter i mediaService.ts)
```

### Tester
```
Test Files  165 passed (165)
      Tests  1895 passed (1895)
```

### Stress-test (3 seeds × 2 säsonger)
```
Crashes: 0
Invariant breaks: 0
Per-invariant: alla 12 invarianter = 0 violations
```

---

## Buggar funna under audit

### mediaService.ts — oanvänd `rand`-parameter
**Rotorsak:** Opus lade till `rand: () => number` i `generateAbsurdityArticles`-signaturen men använde aldrig den — seeden beräknas deterministiskt från `scandal.id` istället.  
**Fix:** Tog bort parametern ur signaturen och call-site i `mediaProcessor.ts`.  
**Rättad i:** samma session.

---

## Observerat i UI

Komponenten renderas korrekt som overlay (zIndex 400, ovanför RenewContractModal/BidModal zIndex 300). Bakgrunden stänger dialogen. Texten är citerad och börjar med ordförandens direkta ord. Bekräfta-knappen säger "Bekräfta köp" (variant 1) respektive "Bekräfta köp ändå" (variant 2+3).

WageOverrunWarning syns inte vid köp under budget — interceptionen triggar bara när `weeklyEquiv > wageBudget`.

---

## Kvarstående (ej levererat)

- **A2–A4**: UI-lager för licensnämnden, sponsor-historik, mecenat-happiness. Backloggade — inget av dem blockerar spelet.
- **Playtest Sprint 25h**: Skandaler har inte testats i live spel. Triggerfönster och texter obekräftade via faktisk gameplay.

---

## Nya lärdomar till LESSONS.md

Inga nya mönster från denna sprint som inte redan finns. `rand`-parametern är ett instans av lärdom #5 (symptomfix / felaktigt scope) men inte allvarligt nog för ny lärdom.
