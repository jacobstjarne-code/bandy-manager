# DOM — BASEKONOMINS INTÄKT, VÄG B (resultatresponsiv, ej ny term)

Datum: 2026-08-28 · Av: Opus · Beslut: Jacob (väg B). Ligger under A-H2, ruling A ("höj intäkterna, inte lönerna"). Rör INTE steg 1–2:s magnituder (ruling D), rör INTE lönen.

## Fyndet

Löner/omgång = Σ(currentAbility × 200 × 0.80 × repFactor) / 4 över truppen — skalar med currentAbility × truppstorlek, obegränsat. Intäkt/omgång (calcRoundIncome) skalar med reputation (trögt) och är hårt kapat (ATTENDANCE_CAP = 0.95, kapacitet ≈ rep×7). Axelglapp: lönebasen springer ifrån den rep-drivna, kapade intäkten, därför gick även kontrollklubben (mittenlag) back. Väg B: låt intäkten svara på resultat/form snabbare än på det tröga ryktet, via befintliga positionslänkade knappar — inget nytt lager.

## Kalibreringsytan — två knappar

**1 · computeAttendanceRate** (economyService.ts ~:141). Idag:
```
Math.min(0.95,
  0.20                                              // ATTENDANCE_FLOOR
  + (fanMood/100) * 0.25 * moodWeight               // ATTENDANCE_MOOD_WEIGHT
  + (communityStanding/100) * 0.45 * moodWeight     // ATTENDANCE_STANDING_WEIGHT — SKYDDAD
  + (position <= 3 ? 0.08 * moodWeight : 0))         // ← byt DENNA
```
Ersätt den binära `position <= 3 ? 0.08 * moodWeight : 0` med en kontinuerlig funktion av position över hela tabellen (bättre placering → högre term; en tvåa och en fyra drar mer än en åtta, inte lika mycket som en etta). Kurvform/tak: kalibreras. Bunden av `ATTENDANCE_CAP = 0.95` — ingen ny explosionsrisk.

**2 · formBonus** (economyService.ts ~:485, i matchintäkten). Idag: `position <= 3 ? 1.15 : position <= 6 ? 1.05 : position >= 10 ? 0.88 : 1.0`. Vidga spannet (skarpare belöning i toppen, skarpare straff i botten). Spann: kalibreras.

## SKYDDAT — rör inte

- `ATTENDANCE_STANDING_WEIGHT = 0.45` — Survive-kontraktets intäktsspak (Jacobs dom 2026-08-25). Förskjutningen mot resultat är ADDITIV, inte subtraktiv under den nivå som håller en hög-CS Survive-klubb flytande. Måste CS-vikten sänkas alls: minimalt, och verifiera Survive-golvet separat (då är det Opus att döma) — DO NOT lower it yourself; if your measurement seems to require it, STOP and report instead of touching it.
- Ingen truppvärde-linjär intäktsterm. Den kandidaten är redan kastad (linjär kr/huvud exploderade 27–34×, RAPPORT_ASKADAREKONOMIN_MATNING_2026-08-26). All styrkerespons går via den kapade publikvägen.
- Steg 1–2:s magnituder (ruling D) och lönen (ruling A) — do not touch `computeContractMinSalary` or the wage formula at all.

## STEG 0 — före mätning

Dominant-simmen ger +30 CA på HELA truppen → klampar halva laget i performanceFactor-taket → syntetiskt extrem lönebas. Byt mot en realistisk mästartrupp (faktisk mästarklubb ur en genomspelning, eller trovärdig CA-fördelning). Annars mäts mot ett artefakttal. (Note: a prior measurement pass in this same project already solved an equivalent problem by using a smaller, non-saturating boost — check `scripts/anspark1-budgettryck-matning-2026-08-28.ts` or `scripts/anspark1-budgettryck-ekonomi-matning-2026-08-28.ts` for the +10 CA / club_vastanfors construction that was verified non-saturating; you may reuse that same construction and seed if it's still valid for this purpose, or construct your own — your call, report which.)

## GODKÄNT NÄR (netto/omgång över en HEL säsong, en ändring åt gången, `npm run stress` före/efter)

1. Mittenlag (kontroll, ingen intervention): break-even i steady-state — netto/omgång ≈ 0, inte plus, inte back.
2. Inget uppgångsfönster — en klubb som klättrar mittenlag → dominant faller inte under mittenlagets steady-state under uppgångssäsongerna enbart för att CA sprungit ifrån rykte.
3. Dominant netto/omgång inte mer än ~3× kontrollens — framgångens kostnad bärs av anspåk 1–4, inte upphävd av att basen spottar pengar.
4. Survive-golvet intakt — Heros går fortsatt back på dyraste anläggningstiern (kontraktet, inte en bugg). Kalibrera ALDRIG mot att Heros går plus. (Check `docs/DOM_FRAMGANGSEKONOMIN_HEROS_2026-08-23.md` and related Heros reports if you need to understand what "Heros" refers to and what its expected/acceptable deficit looks like — it's a specific known test club/scenario in this project's calibration history, not the general concept of a struggling club.)

Magnitud (positionskurvans lutning/tak, formBonus-spann, ev. fanMood-vikt) = utfallet av kriterium 1–4. **D-fact krävs för de slutliga värdena innan commit** — check `docs/findings/facts/design_principles/` for the existing D-fact format/convention (e.g. the recently-added `D032_fatigue_availability_magnitudes.yaml`) and create a new one for these income-curve magnitudes.

## Ägarskap

**Code (you):** steg 0 → bygg de två knapparna → mät 1–4 → D-fact → commit-ready. **Opus:** dömer om mätningen landar i gråzon (särskilt om kriterium 1 och 3 drar isär och CS-vikten måste röras — då är Survive-golvet Opus att verifiera). If your measurement suggests criterion 1 and 3 conflict in a way that seems to require touching the protected CS weight, STOP, do not touch it, and report the conflict clearly instead — that decision belongs to Opus/Jacob, not you.

## END OF DOCTRINE
