# SPEC — Matchmotor-paritet + Lineup-nudge

**Datum:** 2026-05-21
**Status:** Klar för Code. Två tickets, ren mekanik + test. Ingen svensk text.
**Bakgrund:** Jacobs playtest — (1) känsla att quicksim systematiskt förlorar
jämfört med live, (2) hela startelvan är förifylld vilket dödar engagemanget.

---

## TICKET 1 — Matchläges-paritet (genomgång + test)

**Misstanke:** Spelaren förlorar oftare när matchen snabbsimmas än när den
spelas live. Verifiera om lägena är statistiskt likvärdiga och delar motor.

**Arkitektur (verifierad):**
- Live (full/commentary): `useMatchGenerator` → `simulateMatchStepByStep`
  (matchSimulator), `seed: Date.now()`
- Quicksim/silent: `MatchScreen.handlePlayMatch` → `advance()` → roundProcessor
  → `simulateRound` (matchSimProcessor) → `simulateMatch` (matchSimulator),
  seed från fixtureSeed/baseSeed
- Båda bottnar i `matchSimulator.ts` — men via två ingångar
  (`simulateMatchStepByStep` vs `simulateMatch`)

**Tre hypoteser att testa (i prioritetsordning):**

1. **Lineup/taktik-paritet (primär misstanke).** Använder quicksim-vägen
   faktiskt spelarens `managedClubPendingLineup` + vald taktik för det egna
   laget? Eller råkar den generera en AI-lineup (`generateAiLineup`) även för
   managed club? Om managed club får AI-genererad uppställning eller default-
   taktik i quicksim men spelarens egna val i live → systematisk skillnad.
   VERIFIERA i simulateRound/matchSimProcessor hur managed club-fixturens
   lineup väljs.

2. **Interaktiva justeringar.** Live låter spelaren göra halvtidsbyten,
   taktikjustering och halvtidsbeslut (HalftimeModal) — som påverkar andra
   halvlek positivt. Quicksim får ingen sådan justering. Om detta är hela
   skillnaden är den "rättvis" (live-spelaren förtjänar fördelen) — men det
   ska dokumenteras, inte vara en oavsiktlig skevhet.

3. **Seed/kontext-paritet.** Live seedas på `Date.now()`, quicksim på
   fixtureSeed. Får båda samma homeAdvantage, weather, rivalry, matchPhase,
   storylines? Olika RNG-källa ska ge samma *fördelning* även om enskilda
   matcher skiljer.

**Test att bygga:**

```
matchEngineParity.test.ts:
- Bygg ett fixt lag + motståndare med kända attribut
- Kör N=1000 matcher genom simulateMatch (quicksim-väg)
- Kör N=1000 matcher genom simulateMatchStepByStep (live-väg),
  UTAN interaktiva justeringar (ren motor-jämförelse)
- Jämför snitt: mål hemma, mål borta, vinst%, hemmavinst%, hörnor/match,
  utvisningar/match
- ASSERT: snitten ligger inom statistisk tolerans (säg ±5%) av varandra
- Separat test: verifiera att managed club i quicksim använder
  managedClubPendingLineup, INTE generateAiLineup
```

Om Ticket 1.1 (lineup-paritet) visar att managed club får fel lineup/taktik i
quicksim → det är rotorsaken, fixa den. Om motorn är likvärdig och skillnaden
bara är interaktiva justeringar → dokumentera det som avsett i LESSONS.md.

**Code: visa siffrorna, inte bara "✅ likvärdig".** Snitt-tabell för båda
vägarna i PR-beskrivningen.

~4h (genomgång + test + ev. fix).

---

## TICKET 2 — Lineup-nudge: förfyll 7-8, lämna resten

**Plats:** `MatchScreen.tsx` — `defaultStarting`, `startingIds`-init,
mount-auto-fill-effekten, `handleAutoFill`

**Nu:** `startingIds` init = `savedLineup?.startingPlayerIds ?? defaultStarting`
där defaultStarting = 11 högsta på currentAbility. Mount-effekt auto-fyller om
ofullständig. → hela elvan förifylld, "Fyll bästa elvan" är no-op.

**Önskat:** Förfyll ~8 positioner, lämna ~3 tomma som spelaren själv fyller.
Nudge utan att tvinga fram allt från scratch.

**Mekanik:**

A. Init: om `savedLineup` finns, använd den (oförändrat). Om INGEN savedLineup
   (första matchen / ny säsong), förfyll en delmängd:
   - Sortera tillgängliga (ej skadade/avstängda) på spelklarhet
   - **Spelklarhet = currentAbility justerad för form + fitness**, INTE ren form.
     Ren form vore fel — en lågklassig spelare i bra form ska inte tränga ut en
     stjärna i normalform. Förslag: `score = currentAbility * 0.7 + form * 0.2 +
     fitness * 0.1`. (Om du bokstavligen vill ren form, säg till — men detta är
     designmässigt rätt.)
   - Placera de 8 bästa i sina formationsslots via autoAssignFormation
   - Lämna 3 slots tomma (null). VILKA 3: slumpa fram 3 icke-målvaktsslots,
     seedat på fixtureSeed (deterministiskt per match). Då varierar det vilka
     positioner som är öppna — ibland en back, ibland en forward — så spelaren
     engageras i olika delar av laget. Det matchar "slumpas fram på 7-8
     positioner".
   - Målvaktsslot förfylls alltid (lämna aldrig mål tomt som nudge)

B. Ta bort mount-auto-fill-effekten som tvångsfyller hela elvan (eller justera
   den så den BARA triggar vid trasigt state — skadad spelare i slot — inte vid
   avsiktligt tomma nudge-slots).

C. `handleAutoFill` ("Fyll bästa elvan") behålls och blir nu meningsfull:
   den fyller de tomma slotsen med bästa tillgängliga, eller återställer hela
   till bästa elvan efter manuellt pill. Knappen gör äntligen det den lovar.

D. Konstanter överst, lätt justerbara: `PREFILL_COUNT = 8`,
   `EMPTY_SLOTS = 3`. Jacob kan tweaka 7/8 utan kodjakt.

**Test:**
- Ny match utan savedLineup → exakt 8 slots fyllda, 3 tomma, målvakt alltid fylld
- Vilka 3 som är tomma är deterministiskt per fixtureSeed (samma match → samma
  öppna positioner vid omspel)
- "Fyll bästa elvan" på en 8/11-elva → fyller till 11
- savedLineup finns → används oförändrat, ingen förfyllning
- canPlay blir false tills spelaren fyllt de 3 (CTA disabled) — nudgen biter

~3h.

---

## ACCEPTANSKRITERIER

- [ ] matchEngineParity-test visar snitt-paritet (±5%) mellan quicksim och live-motor
- [ ] Verifierat: managed club använder managedClubPendingLineup i quicksim
- [ ] Rotorsak till ev. skevhet fixad ELLER dokumenterad som avsedd
- [ ] Ny match förfyller 8, lämnar 3 tomma (slumpade slots, seedat), målvakt fylld
- [ ] "Fyll bästa elvan" gör nu något meningsfullt
- [ ] Alla 922+ tester gröna

— Opus, 2026-05-21
