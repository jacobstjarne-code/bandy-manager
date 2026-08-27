# Rapport: var sitter klippan, och vet spelaren att orten är spaken?

2026-08-26. Två frågor, rapport bara. Klippan var värre än den såg ut — och informationsfrågan har ett entydigt svar: nej.

---

## Del 1: var sitter klippan

**Finmaskig sveep (Heros, 20 seeds, communityStanding 65-80 i steg om 1-5):**

| communityStanding | Avsked | netResult snitt/säsong | Andel positiva säsonger |
|---|---|---|---|
| 65 | 100% | −230 561 | 1% |
| 68 | 100% | −222 853 | 0% |
| 70 | **95%** | −216 872 | 0% |
| **71** | **10%** | −8 955 | 44% |
| 72–80 | 5–10% | −7 000 till −16 000 | 43–49% |

**Klippan är skarpare än den första mätningen visade — den sitter mellan 70 och 71, inte mellan 70 och 75.** Femgraders-stegen i går dolde att hela övergången ryms inom EN enhet communityStanding.

**Var sitter den — dina tre hypoteser:**

1. **`computeAttendanceRate` — nej, bekräftat smidig.** Linjär i communityStanding, ingen tröskel i formeln. Läst rad för rad igen, ingen `if`/`switch` på communityStanding någonstans i kedjan.
2. **Licensvillkoret (`netResult<=0` är binärt) — ja, det är HÄR klippan faktiskt uppstår, men mekanismen är elakare än en enkel tröskel.** Se nedan.
3. **Att fyra raka år krävs — ja, som förstärkare av (2), inte en egen orsak.**

**Den elaka detaljen: netResult är INTE deterministiskt givet communityStanding.** Vid cs=71–80 är bara 43–49% av enskilda säsonger positiva — publiken räddar INTE varje år, den räddar ungefär hälften. Ändå faller avskedsfrekvensen till 5–10%. Det beviset i sig avslöjar att det INTE är "netResult byter tecken vid en tröskel" — om varje säsong oberoende hade ~45% chans att bli positiv, är sannolikheten att FYRA I RAD blir negativa (kravet för avsked) ungefär 0,55⁴ ≈ 9% — det matchar den uppmätta 5–10%-siffran nästan exakt. **Den binära "en negativ säsong räknas som ett fullt missat år, en positiv nollställer räkneverket helt"-regeln (`checkLicenseStatus`, `licenseService.ts`) tar en sannolikhetsfördelning som i sig INTE är dramatisk (44% mot 0% positiva säsonger) och förstärker den till en nästan binär utfallsfördelning på klubbnivå (5% mot 100% avsked), eftersom "4 i rad, nollställs av en enda framgång" är en kraftigt olinjär funktion av den underliggande sannolikheten.**

**En andra, obekräftad men välbelagd faktor förstärker klippan ytterligare.** Ett steg om EN enhet communityStanding kan via `computeAttendanceRate`s vikt (0,45/100 = 0,0045 per enhet) bara ge en DIREKT skillnad i matchintäkt på ynka ~1 500 kr/säsong. Den uppmätta skillnaden i netResult-SNITT mellan cs=70 och cs=71 är över 200 000 kr — hundra gånger större än vad den direkta formeln kan förklara. Det pekar mot en förstärkande återkopplingsslinga i det bredare ekonomi-/sportsystemet (sundare kassa → råd att bygga anläggning/förstärka truppen → bättre resultat → högre fanMood → ännu mer publik → ännu sundare kassa) som INTE är fullt spårad i denna rapport, men är den mest konsekventa förklaringen till varför ett en-enhets-hopp i indata ger ett hundrafaldigt hopp i utfall. Om detta stämmer förstärker det din poäng ytterligare: en spak med en sådan slinga i botten blir en strömbrytare även om den egna formeln är skalbar.

**Slutsats: din diagnos håller.** Klippan sitter i licensvillkorets binära, minneslösa (nollställs av en framgång) klassificering av en kontinuerlig, sannolikhetsdriven process — förstärkt av en trolig återkopplingsslinga. Att mjuka upp `computeAttendanceRate` ytterligare hade INTE hjälpt, eftersom formeln redan är mjuk — problemet sitter en nivå upp, i hur en kontinuerlig storhet klassificeras binärt och ackumuleras.

---

## Del 2: vet spelaren att orten är spaken?

**Nej. Ingen yta säger det. En yta säger uttryckligen motsatsen.**

- **`EkonomiTab.tsx` rad 210-223:** visar "Licensstatus" med en förklarande rad — **"Licensnämnden granskar ekonomin varje säsong. Negativ kassa eller svag ungdomsverksamhet kan ge varning — som i sin tur skrämmer sponsorer."** Det är fel system: den texten beskriver `licenseReview` (System A, det parallella, INTE avskedande systemet från förra rapporten), inte `checkLicenseStatus`/netResult (System B, det som faktiskt sparkar). Raden nedanför visar "Lokal ställning" (communityStanding) som en ren siffra med färgkodning — INGEN förklarande text, ingen koppling till licensen eller publiken.
- **`OrtenTab.tsx` rad 139, en kodkommentar (inte spelartext, men avslöjande):** **"Samhällsaktiviteter — påverkar bygdens puls, inte inkomst."** Skriven innan gårdagens fix, och SANN då — nu falsk. Ingen spelartext säger något annat, för fram till igår fanns inget annat att säga.
- **Den faktiska avskedstexten** (`licenseService.ts`s `TEXT`-pool, System B — det som skickas till spelaren när räkneverket faktiskt tickar mot avsked): helt generisk. "Vi förväntar oss en återhämtningsplan inom åtta veckor", "Klubbens ekonomi är under övervakning" — INGEN specifik handling nämns. Inte lönesänkning, inte sponsorer, inte publiken. Spelaren får veta ATT klubben är i fara, aldrig VAD som faktiskt hjälper.

**Konsekvensen, exakt som du säger:** fixet vi byggde igår hjälper bara den spelare som redan (utanför spelet) vet att communityStanding driver ekonomin. Ingen yta i spelet lär ut den kopplingen. En förstagångsspelare som tar Heros ser en siffra som heter "Lokal ställning", ingen förklaring av vad den gör, en licensvarning som pratar om "återhämtningsplan" utan att säga vad planen ska innehålla — och sparkas ändå, eftersom ingenting i spelet pekade dem mot den enda spaken som faktiskt fungerar.

**Det här är en informationsfråga, inte en balansfråga — precis din slutsats.** Två separata brister att åtgärda, om du ger klartecken: (1) klippan i licensmekaniken (del 1), (2) att ingen yta lär ut vad som faktiskt räddar klubben (del 2). De kräver olika fixar — del 1 är en formel/regel-fråga i `licenseService.ts`, del 2 är en text-/UI-fråga i licensvarningarna och EkonomiTab/OrtenTab.

Inget byggt. Väntar på dom.
