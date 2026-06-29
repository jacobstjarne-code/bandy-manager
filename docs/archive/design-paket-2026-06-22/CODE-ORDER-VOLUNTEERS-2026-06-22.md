# CODE-ORDER — Volunteers: motorn ska läsa rolltyp

**Datum:** 2026-06-22 · **Av:** Fable / Design · **Till:** Code
**Gäller:** Audit prio 8. Ren wire — inget designbeslut, ingen ny yta.

## Läget
`OrtenTab` lovar differentierade effekter per frivillig-rolltyp (Matchvärd: ~4 puls/omg · Kioskvakt: ~800 kr/omg · osv). Motorn kör ett **platt aggregat** som ignorerar roll. UI:t är rätt; motorn håller inte löftet.

## Order
- `volunteerService` ska summera per **rolltyp**, med de effektvärden UI:t redan visar som sanningskälla (puls vs kr per roll), inte ett platt snitt.
- Designen rör inget: ytan i `OrtenTab` är redan korrekt — den blir bara *sann* när motorn läser roll.
- Acceptans: ändra fördelningen av roller → de visade effekterna i OrtenTab ska faktiskt ändra puls/ekonomi i nästa omgång enligt samma siffror.

Det här stänger sista öppna ⬜ i `AUDIT-TACKNING-ALLA-FYND`. Ingen mock behövs — att mocka vore att rita om en yta som redan stämmer.
