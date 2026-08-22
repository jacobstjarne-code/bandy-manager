# O5 acceptanstest — omkörning efter fjärde koefficientrundan (2026-08-23)

Samma upplägg som förra körningen (Västanfors, 20 seeds × 8 säsonger), nu med meritbufferten, investSurplus-fixet och E-STRESS1:s byggpolicy aktiva. Script: `scripts/o5-acceptance-8sasonger.ts`.

## Huvudresultat: meritbufferten fungerar för sitt måltillfälle, men avskedstrycket är inte löst i stort

**Seed 70014 — det seed som utlöste hela ordern — sparkas INTE längre.** Tre raka SM-guld följt av en svacka klarar sig nu igenom hela åtta säsonger utan avsked. Mekanismen är verifierad mot exakt det fall den byggdes för.

**Men totalt avskedstal: 6/20 (30%), ner från 35% — en modest, inte en avgörande, förbättring.** Nya seeds sparkas nu som inte gjorde det förra körningen (70000, 70003, 70005), medan andra som sparkades förra gången nu överlever (70007, 70009, 70010). Rotorsak inte spårad i detta pass — trolig kandidat: facility-byggpolicyn (E-STRESS1) skapar nu verklig kassaspänning som inte fanns förra körningen, vilket kan interagera med boardPatience-formeln på sätt som inte är kartlagda. Flaggat, inte utrett vidare — Jacobs bedömning om det är värt en egen utredning.

## De fyra punkterna, omkörda

**1) Kassans kurva.** Medianen växer fortfarande (355 tkr → 4,8 mkr), men LÅNGSAMMARE än förra körningen eftersom pengar nu faktiskt går åt till byggen. **15/20 (75%) har minst en säsong med minskande kassa**, upp från 45% förra körningen — en mer verklighetstrogen kurva nu när klubben faktiskt spenderar.

**2) Ekonomiskt tvång.** 61/144 säsongssampel (42%, upp från 14%) hade minst en omgång där kassan understeg billigaste tillgängliga nod — och nu även i SENA säsonger (t.ex. seed 70001, säsong 4-6, mot billigaste noder på 380 tkr och 1,8 mkr/Matchhallen), inte bara de första fyra som förra körningen. Verklig, återkommande ekonomisk press genom hela spelet.

**3) Anläggningsdrift — NU MÄTT I DRIFT, inte analytiskt.**

| Säsong | Snitt drift | Snitt bruttointäkt | Andel | Trädet fullt |
|---|---|---|---|---|
| 3 | 46 275 kr | 594 258 kr | **7,0%** | 0/20 |
| 8 | 122 636 kr | 798 105 kr | **15,3%** | 7/14 (50%) |

Klart under domens mål "en tredjedel" (33%) — även vid fullt träd (7/14 seeds) ligger andelen på 143 400/798 105 ≈ 18%, inte 33%. **Detta är nu en verklig mätning, inte en gissning** — E-STRESS1:s byggpolicy körde igenom hela kedjan (bygg → betala → drift varje säsong). Om Jacob vill nå närmare 33% krävs antingen högre upkeepCost per nod eller en förändrad kalkylbas — flaggat, inget byggt.

**4) investSurplus.** Erbjuden i 40/144 sampel (ner från 59/144 — rimligt, klubben spenderar nu ner kassan innan den alltid når 2 mkr-taket). **Viktig nyans:** `boardObjectiveHistory` (den binära loggen) visar fortfarande "failed" för alla icke-`met`-utfall — det är en FÖRE detta fix separat, medveten arkitektur (binär logg vs. `objectiveStatuses`s 4-tillstånd, se `seasonEndProcessor.ts:939`), inte något denna order bad om att ändra. Fixet syns i STÄLLET i patienskostnaden: rå status är nu `active` (kostar 0) istf det gamla `at_risk` (kostade −2) — en verklig, mätbar lättnad per ignorerad säsong, även om den binära loggens etikett är oförändrad.

## Kriteriet

"År åtta ska det finnas minst ett ekonomiskt val där båda alternativen svider — och en framgångsrik klubb ska INTE sparkas för att den lyckats."

Andra halvan: **löst för det konkreta fallet som utlöste ordern**, inte bevisat generellt (30% kvarstår). Första halvan: **starkare stöd nu** — verklig, återkommande ekonomisk press (punkt 2) genom hela spelet, inte bara år 1-4.

**Föreslaget nästa steg, inte byggt:** spåra VILKA av de sex kvarvarande avskeden (70000/70003/70005/70004/70006/70013) som är genuint "misslyckande utan sabotage" (rimligt, matchar Grind 1:s princip) kontra artefakter av facility-spending-interaktionen som inte fanns förra körningen. Jacobs bord om det är värt ett femte pass eller om 30% för ligans lättaste klubb godtas som "rimlig risk, inte garanterad".
