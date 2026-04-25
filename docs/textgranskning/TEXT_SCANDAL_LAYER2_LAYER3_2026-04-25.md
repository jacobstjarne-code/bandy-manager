# Sprint 25h Lager 2 + Lager 3 — Kurerad text

**Levererat av:** Opus
**Datum:** 2026-04-25

## Designprincip

Text för konsekvenser av egna val (Lager 2) och långsiktig konsekvens
(Lager 3). Tonen är vuxen, formell när styrelsen pratar, byråkratisk
när Licensnämnden gör det. Mecenater är personliga — det är specifika
människor som lämnar.

**Tokens:**
- `{KLUBB}` — klubbens namn
- `{ORDFORANDE}` — ordförandens namn (om finns; annars "Ordföranden")
- `{MECENAT}` — mecenatens namn
- `{MECENAT_BIZ}` — mecenatens företag
- `{SPONSOR}` — sponsornamn (genereras lokalt vid trigger)
- `{BELOPP}` — belopp i tkr

---

# LAGER 2A — Värvning över budget

Ordförandens varning *före* spelaren bekräftar köp. Hård men inte
desperat. "Du bestämmer, men jag varnar."

## Ordförandens förvarning (3 varianter — visas före köpbekräftelse)

1. *"Det här går inte ihop. Lönelistan tål inte ett till. Om du gör det här blir det ett samtal med Licensnämnden om ett halvår."*

2. *"Jag har varit ordförande i tolv år. Det jag säger nu säger jag av erfarenhet, inte av tradition: vi har inte täckning. Tänk om."*

3. *"Du är tränaren och du fattar besluten. Men jag måste säga det här: om vi går över budget en gång till kommer styrelsen att kräva en plan. Och planen kommer att kosta dig spelare."*

## Licensnämndens första varning (efter 5 omgångar med fortsatt överskridande)

1. *Licensnämnden har noterat att {KLUBB}s lönekostnader överstiger budgeten med mer än 20%. Detta är en formell varning. Om förhållandet kvarstår vid säsongsslut kommer åtgärder att övervägas.*

2. *RF:s licensnämnd skriver till klubben: "Vi har granskat {KLUBB}s ekonomiska redovisning för innevarande säsong. Lönebudgeten är överskriden. Vi förväntar oss en plan för återställning inom fyra veckor."*

3. *"Det är inte en fråga om huruvida ni har råd just nu", står det i brevet från Licensnämnden. "Det är en fråga om hur ni planerar er verksamhet långsiktigt. Vi vill se en plan."*

## Poängavdrag (efter 10 omgångar med fortsatt överskridande)

1. *Licensnämnden har beslutat: {KLUBB} får ett avdrag på 2 poäng inför nästa säsong. Beslutet är slutgiltigt och kan inte överklagas. Lönebudgeten är fortsatt överskriden — fortsätter det blir det större.*

2. *Två poäng dras inför nästa säsong. Det står i beslutet från Licensnämnden. "Klubben har inte följt sina egna ekonomiska planer", skriver de. "Detta är konsekvensen."*

3. *Det blev konkret. Två poäng. Ordföranden samlar styrelsen för krismöte. "Vi måste bestämma vad som ska bort", säger han. "För något ska bort."*

---

# LAGER 2B — Skum sponsor-erbjudande

Erbjudandet kommer i inbox. Risknivå varierar — vissa är uppenbart skumma,
andra mer subtila. Den dåliga magkänslan är hela poängen.

## Sponsor-erbjudanden (4 varianter — välj en vid trigger)

### Variant 1 — Skatteverket-utredningen
**Avsändare:** Borgvik Bygg AB
**Inbox-titel:** *Borgvik Bygg AB erbjuder marknadsavtal — 12 000/säsong*
**Body:**
*Borgvik Bygg AB erbjuder marknadsavtal med {KLUBB} på 12 000 per säsong i tre säsonger. VD:n nämner i samtal att företaget "går igenom en granskning från Skatteverket men det är rutin". Avtalet är klart att skriva på.*

**Val:** [ Acceptera ] [ Avböj ]

### Variant 2 — Den nya VD:n med oklart förflutet
**Avsändare:** Nordström Logistik AB
**Inbox-titel:** *Nordström Logistik AB vill bli sponsor — 8 000/säsong*
**Body:**
*Nordström Logistik AB hör av sig genom sin nytillträdde VD. Företaget är okänt på orten men har god kontakt med tre andra klubbar i regionen. VD:n vill träffas snart. Hans bakgrund finns inte på företagets hemsida ännu.*

**Val:** [ Acceptera ] [ Avböj ]

### Variant 3 — Bekantskap genom bekantskap
**Avsändare:** Hellström & Co
**Inbox-titel:** *Hellström & Co — kontakt via gemensam vän — 15 000/säsong*
**Body:**
*"Vi har gemensamma bekanta", står det i mejlet från Hellström & Co. Företaget vill betala 15 000 per säsong i marknadsavtal. När du frågar vilka bekanta blir svaret "det är en småstad". Det stämmer, men du har ingen aning om vem de menar.*

**Val:** [ Acceptera ] [ Avböj ]

### Variant 4 — Snabba pengar, inga frågor
**Avsändare:** Lindström Holdings
**Inbox-titel:** *Lindström Holdings: 20 000 i förskott — direkt avtal*
**Body:**
*Lindström Holdings erbjuder 20 000 i förskott för ett tre års marknadsavtal. "Inga byråkratiska processer", skriver han, "vi vill bara stötta lokal idrott". Beloppet är osedvanligt högt. Bolaget registrerades för fyra månader sedan.*

**Val:** [ Acceptera ] [ Avböj ]

## Konsekvenser om risken slår in (3 varianter — efter 6-12 omgångar)

### Variant 1 — Skatteverket slår till
*Skatteverket har gripit in mot {SPONSOR}. Företagets bankmedel är frysta och avtal med tredje part avslutas. {KLUBB} förlorar sponsorn i förtid och måste betala tillbaka del av redan utbetalda medel. Reputation -5, communityStanding -10.*

### Variant 2 — Konkurs och tystnad
*{SPONSOR} har försatts i konkurs. Det fanns inget att granska — företaget hade inga riktiga kunder. {KLUBB}s avtal är värdelöst. Pengarna som kommit in betalas tillbaka till konkursboet. Reputation -5, communityStanding -10.*

### Variant 3 — Lokaltidningen ringer
*Lokaltidningen har börjat skriva om {SPONSOR}. Reportagen handlar om okända ägare, suspekta bolagsstrukturer och kopplingar till en tidigare brottsmisstänkt person. {KLUBB} avslutar avtalet före det blir värre. Förtroendeförlust i orten — communityStanding -10, reputation -5.*

---

# LAGER 2C — Mecenat lämnar (krav ignorerade)

**OBS:** Detta är *inte* samma som retirement (som finns i mecenatService).
Detta är en mecenat som lämnar i ilska efter 3+ ignorerade krav.

## Mecenat-utträde (3 varianter — välj baserat på personlighet)

### Variant 1 — Kontrollfreaken
*{MECENAT} ringer. Tonen är iskall.*

*"Du har ignorerat mig tre gånger nu. Det är tydligt att klubben vill gå sin egen väg. Det är ert val. Men ni får göra det utan mig — och utan de pengar jag investerat i fastighetssidan. Det jag betalat är förbrukat. Det som var planerat dras tillbaka."*

*{MECENAT} lämnar klubben permanent. Klubbens ekonomi tappar mellan 500 och 1000 tkr i utebliven framtida investering.*

### Variant 2 — Filantropen
*{MECENAT} ber om ett möte. Det är inte ilska i rösten, det är besvikelse — vilket är värre.*

*"Jag har försökt förstå er. Men ni gör det inte enkelt. Jag drar mig ur det här samarbetet — det fungerar inte att ge när det inte tas emot. Jag önskar er lycka till."*

*{MECENAT} lämnar permanent. Pengar som var öronmärkta för ungdomssatsningar dras tillbaka.*

### Variant 3 — Nostalgikern
*{MECENAT} sitter på sitt kontor och stirrar ut genom fönstret när du kommer in. Han ser äldre ut än vanligt.*

*"Jag växte upp med {KLUBB}. Min far gick på matcherna i femtiotalet. Jag har försökt ge tillbaka. Men det måste vara åt båda håll. Jag drar mig tillbaka. Det är inte mot dig. Det är åt mig själv."*

*{MECENAT} lämnar. Klubbens facility-investeringar förlorar finansieringen. Det blir tyst på orten — gamla supportrar tar det här illa.*

---

# LAGER 3 — Licensnämnden

**OBS:** Code har lagt in funktionell text i `licenseService.ts`. Den är
inte dålig, men den kan göras specifik och tyngre. Detta är förslag på
ersättning av befintlig text.

## `cleared` — Hemläxan godkänd (2 varianter)

1. **Titel:** *Licensnämnden: Granskningen avslutad*
   **Body:** *Ni har vänt skutan. RF:s licensnämnd avslutar bevakningen av {KLUBB}s ekonomi. "Vi noterar att klubben har återgått till sund finansiell verksamhet", står det i beslutet. Det är inte en utmärkelse. Men det är inte ett problem heller.*

2. **Titel:** *Licensnämnden: Inga vidare åtgärder*
   **Body:** *Bekräftelsen kom i ett kort brev. {KLUBB}s ekonomi är åter i balans. Licensnämnden kommer inte att vidta ytterligare åtgärder. "Vi förväntar oss att den positiva utvecklingen fortsätter."*

## `first_warning` — Första varningen (3 varianter)

1. **Titel:** *Licensnämnden: Första varningen efter två förlustsäsonger*
   **Body:** *RF:s licensnämnd har granskat {KLUBB}s räkenskaper. Två säsonger med underskott. Detta är en formell varning. "Vi förväntar oss en återhämtningsplan inom åtta veckor", står det i beslutet. Klubbens ekonomi är under övervakning fram till dess.*

2. **Titel:** *Två röda år — RF kräver plan*
   **Body:** *Brevet från Licensnämnden är formellt och tre sidor långt. Innehållet kan sammanfattas i en mening: två förlustsäsonger i rad är inte acceptabelt. {KLUBB} ska presentera en plan för återhämtning. Tiden räknas i veckor, inte månader.*

3. **Titel:** *Licensnämnden bevakar {KLUBB}*
   **Body:** *Två säsonger med underskott. Det räcker. RF:s licensnämnd inleder formell bevakning av {KLUBB}s ekonomi. Det är inte slutet — men det är ett första steg dit. Nästa förlustår kommer kosta poäng.*

## `point_deduction` — Tre poäng dras (3 varianter)

1. **Titel:** *Licensnämnden: −3 poäng inför nästa säsong*
   **Body:** *Tre säsonger med underskott. Tre poäng. {KLUBB} startar nästa säsong med ett underläge som klubbens egen ekonomi har orsakat. Beslutet är slutgiltigt — ingen överklagan tas upp. RF:s ord är: "Konsekvensen är välbalanserad."*

2. **Titel:** *Det blev poängavdrag — {KLUBB} −3*
   **Body:** *Brevet kom på en tisdag. Tre poängs avdrag inför nästa säsong. Inget mer att säga. Styrelsemöte på torsdag — det enda alla redan vet är att något måste bort. Frågan är vem.*

3. **Titel:** *RF beslutar: Tre poäng från {KLUBB}*
   **Body:** *Licensnämnden har genomfört sin tredje granskning av {KLUBB}. Beslutet är minskning av poäng inför nästa säsong med 3 enheter. Klubben har inte följt återhämtningsplanen. "Vi har gett er chanser. Det är slut nu."*

## `license_denied` — Licensen nekas (3 varianter — game-over)

1. **Titel:** *LICENSNÄMNDEN: Elitlicens nekad*
   **Body:** *Fyra säsonger av underskott. Det går inte längre. RF:s licensnämnd har idag fattat beslutet att inte bevilja {KLUBB} elitlicens för nästa säsong. Klubben kommer att placeras i lägre serie. "Detta är inte en straff", står det i beslutet. "Det är en konsekvens." Tränaren får sparken samma kväll.*

2. **Titel:** *Spelet är slut för {KLUBB} i elitserien*
   **Body:** *Beslutet kom som ingen överraskning, men det blev ändå tyst i styrelserummet när det kom. {KLUBB} förlorar elitlicensen. Inga undantag, inga överklaganden. Tränaren avgår innan kvällen är slut. Säsongen — och din tid på jobbet — tar slut här.*

3. **Titel:** *RF nekar elitlicens — {KLUBB} flyttas ner*
   **Body:** *Tränaren samlar styrelsen i klubbhuset. Det blir kort. RF:s beslut är slutgiltigt — elitlicensen dras in. {KLUBB} kommer att spela en serie ner från och med nästa säsong. Det här är inte en omstart. Det är ett slut. Tränaren tar farväl utan tårar och utan ord.*

---

## SAMMANSTÄLLNING

| Sektion | Strängar |
|---------|----------|
| 2A Ordförande-varningar | 3 |
| 2A Licensnämnd-varningar | 3 |
| 2A Poängavdrag-meddelanden | 3 |
| 2B Sponsor-erbjudanden | 4 |
| 2B Konsekvenser | 3 |
| 2C Mecenat-utträde | 3 |
| 3 Cleared | 2 |
| 3 First warning | 3 |
| 3 Point deduction | 3 |
| 3 License denied | 3 |
| **Totalt** | **30** |

---

## NOTERINGAR FÖR CODE

1. **Lager 3-texten ersätter befintlig** i `licenseService.ts` →
   `TEXT`-konstanten. Befintliga 2-3 varianter byts mot dessa 2-3-3-3.

2. **Mecenat-utträde-tonen** ska väljas baserat på `mecenat.personality`:
   - `kontrollfreak` → variant 1
   - `filantropen` → variant 2
   - `nostalgiker` → variant 3
   - Övriga (`tyst_kraft`, `showman`, `kalkylator`) — välj en av tre slumpvis

3. **Sponsor-erbjudande-token `{SPONSOR}`** sätts vid trigger:
   `Borgvik Bygg AB`, `Nordström Logistik AB`, `Hellström & Co`,
   `Lindström Holdings` — beroende av valet i `riskySponsorOffer`.

4. **Belopp i körning vs spec.** Spelets sponsorer ger 300-1700/v
   (~15-85 tkr/säsong). Beloppen i Lager 2B-erbjudanden (8-20 tkr/säsong)
   är medvetet *lägre* för att matcha verkligheten — skum sponsor är
   inte en stor sponsor, det är en irriterande sponsor.

5. **Spelets mecenater har redan en retirement-mekanism.** Det är inte
   denna. Detta är "lämnar i ilska efter 3+ ignorerade krav" och är en
   separat trigger. `mecenatWithdrawal` enligt 25h Pass 2.
