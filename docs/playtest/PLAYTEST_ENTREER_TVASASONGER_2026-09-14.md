# Tvåsäsongsprov — entréer, berättelseordning och portaltryck

**Datum:** 2026-09-14  
**Testare:** Codex/Astra  
**Pinnad commit:** `f5bfd2f9`  
**Klubb / svårighet:** Målilla / medelsvår  
**Seed:** 41  
**Metod:** dubbelspår — riktig karriärmotor med löpande invarianter samt manuell mobil genomspelning av den första spelveckans rytm.

## Dom

**PASS.** De kanoniska personbågarna håller över två säsonger. Portalen
överskrider inte sina redaktionella tak, beslutskön stannar vid högst tre
aktiva beslut och ingen namngiven aktör eller relationsföljd visas innan
aktören har introducerats. Ingen introduktion återkommer efter
säsongsövergången.

## Vad som nåddes naturligt

Körningen gick 63 riktiga `advanceToNextEvent`-steg och fullföljde två
säsonger. Följande entréer skrevs av den riktiga introduktionskön, högst en
per matchdag:

1. Lokalreportern Anders Wikström — säsong 2026, matchdag 0.
2. Mecenaten Eva — matchdag 1.
3. Klackledaren Birger — matchdag 2.
4. Kommunpolitikern för mandatperiod 2030 — matchdag 3.
5. Patronen Göran — matchdag 4.
6. Supportern Elin — matchdag 6.

Styrelsen och assisterande tränaren etablerades dessförinnan av den riktiga
Tillträdet-kedjan. De räknas därför inte som nya portalentréer och får inte
dubbelintroduceras.

## Löpande invarianter

- Högst en berättelseentré per matchdag: **0 brott**.
- Högst ett liggarkvitto `voice_introduced` per kanoniskt `voiceId`: **0 brott**.
- Namngiven aktör får inte tala eller ge relationsföljder före introduktion:
  **0 brott**. Testet observerade **21** händelser som försökte bli aktuella
  för tidigt och stoppades av gaten.
- En nyintroducerad aktör får inte omedelbart få ett andra talutrymme samma
  period: **0 brott**.
- Inkorgspost med `voiceId` får inte exponera en okänd röst: **0 brott**.
- Beslutskö: högst **3** aktiva, inga olösbara skärmar.
- Portal: högst **3** sekundärkort och **4** minimalkort; totalt högst **4**
  aktuella händelsekort i provet.
- Säsongsrollover: inga introduktioner, personer eller lösta relationsspår
  började om säsong två.

## Spelkänsla

Den manuella mobilstarten med Hälleforsnäs bekräftade rytmen i förgrunden:
Tillträdet etablerade assistenten innan funktionerna, lokalreportern kom som
första externa person och presskonferensen blev möjlig först efter mötet.
Efter första cupmatchen bar Portalen en tydlig primär matchhandling och ett
veckobeslut. Den ordinarie CTA:n låg kvar men var låst tills beslutet lösts,
så orsaken gick att förstå utan att målpunkten flyttade sig.

Ett missvisande `4 aktiva` upptäcktes i denna körning. Roten var att
kvitteringskort för en röstintroduktion räknades som ett aktivt beslut bara
för att det hade en knapp, trots att både resolver och Granska redan
klassade det som passivt. Klassificeringen är nu gemensam; omspelet stannade
vid max tre verkliga beslut.

## Fynd som åtgärdades före pinningen

1. **Passiva introduktioner belastade beslutsbudgeten.** Åtgärdat centralt i
   `decisionBudgetService`, med regressionstest.
2. **Byggets säsong-ett-intro återkom vid varje besök.** Åtgärdat genom samma
   beständiga kvitteringsmekanism som övriga funktionsintroduktioner.
3. **Mecenatmiddagen saknade röstgate och kanoniskt `voiceId`.** Producenten
   kräver nu föregående introduktion; dev-scen och tester använder samma
   kontrakt.
4. **Klubbsymbolerna i Granskas resultatkort låg till vänster i en
   fullbreddsbehållare medan klubbnamnen var centrerade.** Behållarna
   centrerar nu symbolen explicit. Samma komponent täcker ordinarie,
   förlängnings- och straffresultat.

## Teknisk kontroll

- `npx vite-node scripts/playtest-introduction-arcs.ts`: **PASS**, exit 0.
- Full Vitest: **585 testfiler / 5 250 tester**, alla gröna.
- Produktionsbygge, TypeScript och samtliga design-/innehållsgrindar: gröna.

Testverktyget ligger i `scripts/playtest-introduction-arcs.ts` och använder
produktens riktiga nyskapande, introduktionskö, resolver, beslutskö,
portalbyggare och säsongsrollover. Samma seed kan därför återspela brottet
om någon av invarianterna regresserar.
