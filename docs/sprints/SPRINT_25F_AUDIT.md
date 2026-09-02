# Sprint 25f — stängande audit

**Datum:** 2026-09-02  
**Underlag:** `SPRINT_25F_HT_LEAD_COMEBACK.md`, `SPRINT_25F_MEASUREMENT.md`, aktuell `matchCore.ts`  
**Dom:** IMPLEMENTERAD, MÄTT, MEN INTE GODKÄND MOT SPRINTENS PRIMÄRA MÅL

## Vad som faktiskt byggdes

De fyra beslutade mekanismerna finns i motorn: starkare `trailingBoost`,
`leadingBrake`, hårdare `chasing` och hårdare `controlling`. Dagens motor har
dessutom `leadingBrake` 0,12 per mål, inte mätrapportens ursprungliga 0,08;
mätrapportens siffror får därför inte användas som bevis för dagens exakta
balans utan en ny körning.

## Vad mätningen bevisade

- `goalsPerMatch` höll sig inom målet: 9,26–9,30 mot 9,0–9,4.
- `htLeadWinPct` förbättrades från 82,4 % till cirka 77 %, men missade
  målintervallet 60–70 %.
- Comeback från ett måls underläge förbättrades till cirka 18–19 %, men
  missade 20–25 %.
- Grundseriens hemmaandel sjönk samtidigt till cirka 43–44 %, under målet.
- Två tillåtna iterationer genomfördes; 0,19 i trailing boost hjälpte inte och
  återställdes.

## Stängningsdom

Sprinten är formellt auditerad och dess leverans är verklig, men utfallet är
**❌ mot primäracceptansen**. Raden ska inte längre beskrivas som ”aldrig
stängd med audit”; den korrekta kvarvarande skulden är en ny, versionsbunden
motoromätning och därefter ett separat balansbeslut. Det är inte samma sak som
att Sprint 25f saknar implementation eller mätning.

## Nästa säkra steg

Kör HT-led/comeback-harnesset mot nuvarande motorversion och redovisa minst
`htLeadWinPct`, comeback −1, `goalsPerMatch` och hemma-/bortavinst. Jämför inte
nya siffror med 25f utan att ange att `leadingBrake` senare ändrats från 0,08
till 0,12 och att motorn fått fler efterföljande mekanismer.
