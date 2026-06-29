# CODE-LEVERANS — Teknisk skuld E-SC (seededPick + recompute + trendStroke)

**Datum:** 2026-06-10
**Källa:** BACKLOG.md §E (teknisk skuld, små). Opportunistisk städbunt efter att Klubb/Transfers-auditen stängts.
**Karaktär:** Ingen Opus-text, ingen design, inget Jacob-beslut. **Allt beteendebevarande — ingen av dessa ändrar användarsynlig utdata eller urvalsutfall.** De tre är oberoende; committa var för sig.

## E-SC1 — Delad seedad picker (huvudpunkt)
Idag finns samma idiom i fem implementationer: `pickFromPool` (boardMeetingCopy), `pickNoRepeat` (upptaktCopy), `pickVariant` (×2 byte-identiska i eventCardInlineStrings + csPressEventText), + inline `Math.abs(seed) % len` i ~30 textfiler. Konsolidera till `seededPick` / `seededPickNoRepeat` i `domain/utils/random.ts` (där `mulberry32`/`fixtureSeed` redan bor).

**KRITISK guardrail — beteendebevarande.** Dessa matar seedad text + tester. Samma seed MÅSTE ge samma val efter refaktorn.
- Innan konsolidering: läs call-sites och verifiera att de använder IDENTISK urvalsmatematik.
- Konsolidera bara de byte-identiska. Där matematiken skiljer sig (`seed % len` vs `Math.abs(seed) % len` vs mulberry32-draw) — bevara per-call-site-beteendet (param) eller **flagga divergensen, unifiera inte tyst.**
- Signaturer (förslag, anpassa efter call-sites): `seededPick<T>(arr, seed): T` (ersätter pickFromPool/pickVariant/inline-idiomet), `seededPickNoRepeat<T>(arr, seed, avoid?): T` (ersätter pickNoRepeat).
- Efter: kör text-/snapshot-testerna. Noll diff i utdata.

## E-SC2 — Eskalering recompute per render
`getEscalationSubState`/`computeManagedStanding` körs ~3–4× per Portal-render (PortalUpptakt + NextMatchPrimary + isCtaWarm), och `getPlayoffSeriesContext` dubbelanropas i NextMatchPrimary. Billiga ops men onödiga. Beräkna en gång i Portal-föräldern och tråda värdet via props ner i barnen. Beteendebevarande — samma värde, färre beräkningar.

## E-SC3 — trendStroke last-vs-first
EkonomiTab + StillnessSection deriverar sparkline-stroke inline (last-vs-first, 'cold'-neutral i Stillness). Lägg `seasonTrendStroke(points, { neutral })` bredvid befintliga `trendStroke` (last-vs-prev) i `formatters.ts`, och ersätt de två inline-deriveringarna. Beteendebevarande.

## INTE röra
Urvalsmatematiken (E-SC1 bevarar den exakt). Eskaleringslogiken (E-SC2 trådar bara, ändrar inte). Patron/mecenat, scheduleGenerator, matchCore.

## Acceptans
- En `seededPick` + `seededPickNoRepeat` i `random.ts`; pickFromPool/pickNoRepeat/pickVariant + inline-idiomet ersatta där matematiken är identisk; divergenser flaggade i rapporten, ej tyst-unifierade.
- Eskalerings-substate beräknas en gång per Portal-render, trådat via props.
- `seasonTrendStroke` i `formatters.ts`; EkonomiTab + StillnessSection använder den.
- `npx tsc --noEmit` + ALLA tester gröna — särskilt text-/snapshot-tester: noll utdata-diff.

**Rapportera per punkt. Bekräfta uttryckligen: körde du text-/snapshot-testerna och fick noll diff på seedad text? Och lista varje urvalsmatematik-divergens du hittade i E-SC1.**

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-TECHDEBT-ESC-2026-06-10.md` och implementera. Tre oberoende städpunkter — committa var för sig.

**Metod:** för E-SC1, läs alla call-sites (pickFromPool/pickNoRepeat/pickVariant + grep `% .*length` i textfiler) och jämför urvalsmatematiken INNAN du konsoliderar. Visa kod.

1. **E-SC1:** samla picker-idiomet till `seededPick`/`seededPickNoRepeat` i `random.ts`. **Beteendebevarande — samma seed → samma val.** Konsolidera bara byte-identisk matematik; flagga divergenser, unifiera dem inte tyst. Kör text-/snapshot-tester efter, noll diff.
2. **E-SC2:** beräkna eskalerings-substate en gång i Portal-föräldern, tråda via props (bort med 3–4× recompute + dubbelanropet i NextMatchPrimary).
3. **E-SC3:** `seasonTrendStroke(points, {neutral})` i `formatters.ts`, ersätt inline-deriveringarna i EkonomiTab + StillnessSection.

**Rör INTE:** urvalsmatematiken, eskaleringslogiken, patron/mecenat, scheduleGenerator, matchCore.

**Klart =** en delad picker · eskalering beräknad en gång · seasonTrendStroke-helper · tsc + alla tester gröna · noll diff på seedad text.

**Rapportera per punkt + divergens-listan + snapshot-bekräftelsen.**
