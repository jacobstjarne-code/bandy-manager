# PÅSTÅENDEGRINDEN — steg 3

**Datum:** 2026-08-24 · **Av:** Opus
**Underlag:** `PASTAENDEKARTAN_2026-08-24.md`. 55 proxyfynd över 309 filer, spridda över 16 av 18 delsystem.

---

## Vad grinden gör

**Den kräver ett citat.** En yta som påstår något om vad som hänt måste läsa ett fält där det står nedskrivet — inte ett fält som korrelerar med det.

Att förbjuda kända proxymönster fungerar inte: fyrtiotre av femtiofem fynd låg utanför de ytor vi visste brann, och nästa fyrtiofjärde uppstår i en fil som ingen listat. Grinden ska göra kategorin omöjlig, inte instanserna.

---

## Vad som är ett påstående

Grinden gäller **text som beskriver något som redan inträffat.** Konkret, och avgränsat så det går att avgöra maskinellt:

**Omfattas:**
- Preteritum om spelvärlden — *sålde*, *vann*, *lämnade*, *valde*, *kostade*
- Ett tal som beskriver ett utfall — *tre matcher*, *180 tkr*, *tolv år*
- Ett namn i en händelsebeskrivning — *{Namn} avgjorde*
- En kausal koppling — *därför*, *det gav*, *det ledde till*

**Omfattas inte:**
- Tillståndsvisning: tabellen, truppen, kassan visar nuläge
- Framtid och avsikt: *kommer att*, *planerar*, *nästa match*
- Atmosfär utan faktapåstående: *det blåser från väster*
- Frågor och uppmaningar

Gränsfallet är **presens om ett tillstånd som är följden av något** — *han är avstängd*. Det är tillstånd, inte påstående, och omfattas inte. Men *han stängdes av i tre matcher* är ett påstående, för det säger något om vad som hände och hur mycket.

---

## Tre nivåer, byggda i ordning

### Nivå 1 — deklarationen (byggs först)

Varje textproducerande funktion deklarerar vilka fält dess påståenden citerar.

```ts
/** @cites SaveGame.resolvedChoices, Fixture.events */
```

Grinden kontrollerar att funktionen faktiskt läser de deklarerade fälten, och **failar när den läser fält den inte deklarerat.**

Det är billigt, mekaniskt kontrollerbart, och det gör proxyn synlig i granskning: en funktion som påstår vad spelaren valde och deklarerar `htTempo` är uppenbart fel för den som läser diffen.

**Detta ensamt hade fångat sju av de tolv första fynden.**

### Nivå 2 — förbudslistan (byggs samtidigt, billig)

Vissa fält är **aldrig** giltiga citat för vissa påståenden. Listan börjar med det vi vet:

| Påstår | Får inte citera | Ska citera |
|---|---|---|
| vilket val spelaren gjorde | taktikfält, `choiceId` ensamt | `resolvedChoices` |
| att en spelare lämnat | `choiceId` | truppen efter mutationen |
| styrelsens nöjdhet | position, `fulfillmentPct` | `boardPatience` |
| ordning mellan matcher | `roundNumber` | `matchday` |
| lagets form | `player.form` | resultaten |
| publikens humör | `fanMood` | `supporterGroup.mood` |
| vem som eliminerades | bracket-närvaro | `eliminatedByClubId` |
| vem som blev mästare | `playoffBracket.champion` | `championClubId` |

Listan växer när nya proxyer hittas. Den fångar inte det okända, men den gör återfall omöjliga — och fem av dagens fynd var syskongrenar till fixar vi gjort samma dygn.

### Nivå 3 — citatkravet (byggs sist, efter mätning)

För påståenden om **spelarens egna val** gäller det hårda kravet: texten får bara renderas om `resolvedChoices` bär eventet.

Det är möjligt först nu, eftersom fältet finns sedan i dag. Det är också den enda kategori där sanningen är komplett nedskriven — därför börjar det hårda kravet där och breddas när fler register är fyllda.

---

## Var grinden lever

**Nivå 1 och 2 som ett testfall**, inte som lint: de kräver att man vet vad en funktion läser, vilket är AST-arbete snarare än regex. Kör i `npm test`, alltså i varje CI-körning.

**Nivå 3 som en runtime-assertion i utvecklingsläge** plus ett testfall. En yta som saknar sitt citat ska kasta i dev och falla tillbaka på tystnad i produktion — aldrig rendera ett obelagt påstående för en spelare.

**Ratchet från dag ett.** 55 kända fynd blockerar inte; grinden failar när antalet ökar. Samma mönster som `routeSceneCoverage`, och av samma skäl: en grind som failar på befintlig skuld stängs av.

---

## Vad den inte gör

**Den bedömer inte om texten är sann.** Den kontrollerar att texten citerar det den påstår sig citera. Att `resolvedChoices` innehåller rätt värde är resolverns ansvar.

**Den täcker inte påståenden vars sanning inte finns lagrad.** `SundayTrainingScene` påstår att någon kom först i morse, och ingen punktlighetshistorik finns. Grinden kan flagga att fältet saknas; den kan inte skapa det. De fallen blir poster: bygg fältet eller skriv om texten.

**Den ersätter inte `contentContract`.** Kontraktet säger vad ett event ska ha; grinden säger var en text får hämta sitt påstående. Kontraktet är en deklaration, grinden är en kontroll. **De ska dock läsa samma fältnamn**, annars har vi en femte sanning.

---

## Byggordning

1. **Nivå 2 först** — förbudslistan är en dags arbete och fångar återfall omedelbart.
2. **Nivå 1** — `@cites`-deklarationen plus AST-kontrollen. Rapportera vad det kostar innan bygget; om AST-analysen är dyr räcker en enklare variant som bara kontrollerar att deklarerade fält förekommer i funktionskroppen.
3. **Mät** — hur många av de 55 fynden fångas av nivå 1+2? Den siffran avgör om nivå 3 behövs brett eller bara för valen.
4. **Nivå 3** — hårt citatkrav på `resolvedChoices`.

---

## Godkänd när

En ny yta som påstår något om vad som hänt kan inte nå produktion utan att deklarera var påståendet kommer ifrån — och deklarationen kontrolleras mot koden, inte mot att någon läste den.
