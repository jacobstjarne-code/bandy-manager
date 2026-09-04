# Fixrapport: akademi- och utvecklingsauditen

**Ursprunglig utgångs-HEAD:** `18ff34e3`

**Slutverifierad ovanpå:** `7a6e8d17`

**Datum:** 2026-09-04
**Scope:** entydiga funktionella rotfixar från `SPELTEST_AKADEMI_2_SASONGER_2026-09-04.md`. Produkt-, balans-, text- och designbeslut är medvetet utelämnade.

## Åtgärdat

### 1. Utlånade spelare kan inte längre tas ut

- En gemensam matchtruppsregel kräver både ägarskap (`clubId`), faktisk registrering i `squadPlayerIds` och `isOnLoan !== true`.
- Regeln används av laguttagningseditorn, nödläget före match, sparningen av startelva och de två grindarna som avgör om en sparad elva får spelas.
- Även bänken valideras nu; tidigare validerades bara startspelarna.

### 2. Lån räknas i faktiska tillfällen, inte kalenderhopp

- `LoanDeal` bär nu `remainingRounds` som varaktighetens kanoniska sanning.
- Varje unikt processat matchtillfälle minskar räknaren med ett. Ett hopp från matchday 0 till 4 förbrukar därför en av fyra omgångar, inte hela lånet.
- Akademi- och truppvyn visar samma återstående räknare.
- Äldre saves migreras från `totalMatches - reports.length`.

### 3. Mentorhistoriken överlever P19 och säsongsskiftet

- Nya mentorposter sparar seniorens och adeptens namn som snapshots.
- Blodslinje söker nu även i `youthTeam.players`, inte bara i seniorlistan.
- När den aktiva mentorslistan töms vid rollover stängs varje öppen historikpost som `graduated` eller `ended`; öppna föräldralösa poster lämnas inte kvar.
- En redan borttagen person kan fortfarande visas från namnsnapshoten.

### 4. Readiness glöms inte över sommaren

- Readiness räknas om med samma gemensamma tröskel som P19-simuleringen.
- En fortsatt redo spelare behåller sin följd av redo-omgångar. Räknaren nollställs bara när spelaren faktiskt inte längre uppfyller villkoret.

### 5. Dubbletter stoppas vid källan/sammanslagningen

- Post-advance kan skapa högst ett arbetsplatsbeat per omgång, även om tre eller fler spelare delar arbetsgivare.
- Årsbokens slutliga momentsammanslagning tar bort exakt samma rubrik på samma matchday över match-, arc- och ledgerkällor. Andra händelser samma dag bevaras.

## Medvetet utelämnat — kräver Claude/Fable/Design

### 19-åringens utgång

Koden filtrerar fortfarande bort spelaren som fyller 20. Vilket verifierbart utfall som ska ges — A-lag, frisläppt, annan klubb eller annan väg — och hur det ska berättas kräver produkt- och textbeslut. Ingen lokal inboxtext eller påhittad ledger-typ har lagts till.

### Full ledger-modell för akademin

Lånestart/retur, akademiuppgradering och mentorstart/slut är ännu inte nya förstaklasstyper i `eventLedger`. Ledgerns schema och konsumentprioritering ägs av det pågående Claude-arbetet; denna runda har reparerat den befintliga hållbara mentorhistoriken utan att parallellt uppfinna ett andra schema.

### Sommarkullen i P19 kontra befintligt ungdomsintag

Repot har två separata inflöden: `carryOverYouthTeam` fyller P19, medan `generateYouthIntake` skapar seniorspelare och redan skriver `youthIntakeHistory`. Att lägga P19-id:n i samma post skulle göra räknaren synlig men blanda två modeller och lämna `bestYouthProspect` utan en giltig spelarkälla. Behöver ett uttryckligt domänbeslut innan wiring.

### Utvecklingsattribution

UI visar fortfarande inte “varav +N från lån/mentor”. Det kräver att deltan snapshottas vid rätt tidpunkt och ett beslut om var före–efter-informationen ska bo. Ingen efterhandsberäkning har lagts in.

### Ekonomibalans och ekonomibokslut

Kostnadsnivåer, kriströsklar och vilken uppdelning årsboken ska visa är balans- och presentationsbeslut. De har inte ändrats i denna funktionella runda.

## Verifiering

- 91 riktade tester gröna, inklusive nya regressioner för kalenderhopp 0→4, utlånad spelare i lineup, äldre save-migration, readiness över sommaren, mentorhistorik, tre arbetskamrater och identiska årsboksrader.
- Produktionsbygge grönt: TypeScript, Vite, design guard, design adherence, content contract och facility consequences.
- Den fulla sviten kördes före den sista deklarationsrättningen: 4 319 av 4 320 tester gröna. Det enda felet var en föråldrad `@cites currentMatchday` i AkademiTab efter att kalenderberoendet tagits bort. Den raden är rättad och både sanningsgrinden och hela den riktade sviten är därefter gröna.

## Commitavgränsning

Arbetskopian innehöll samtidigt andras ocommittade design-, illustrations-, formation-, PWA- och dokumentationsarbete. Fixcommitten omfattar därför endast filerna i denna akademi-/lånerunda; övrigt arbete har lämnats orört.
