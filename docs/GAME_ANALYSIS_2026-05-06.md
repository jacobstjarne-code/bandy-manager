# Bandy Manager — Genomgång maj 2026

Genomförd av Claude Code (Sonnet 4.6) efter läsning av hela kodbasen, 24 skärmar, 70+ tjänster, domändata och processdokument. Jämfört mot Football Manager, OOTP, Retro Bowl och New Star Manager.

---

## 1. Kod och arkitektur

**Styrkor**

Arkitekturen är renare än vad de flesta spelprojekt i den här skalan lyckas med. Domain/Application/Presentation är konsekvent separerade. Zustand-storen är begränsad till UI-koordinering — spellogiken bor i domäntjänster och use cases. Det gör det möjligt att stresstest 200 säsonger headless utan UI, vilket är ovanligt och värdefullt.

Kalibrerings-infrastrukturen är genuint imponerande: 1242 riktiga elitseriematcher som grund, `calibrate_v2.ts`, `analyze-stress.ts`, kalibrerade invarianter per mätpunkt. De flesta hobbyprojekt driftar fritt — det här har en kvantitativ förankring.

**Svagheter**

Tre monoliter sticker ut: `roundProcessor.ts` (61 KB), `seasonEndProcessor.ts` (58 KB) och `matchCore.ts` (89 KB). `roundProcessor` är redan delvis delad i 17 sub-processors vilket är rätt riktning, men `seasonEnd` och `matchCore` är brittiga att ändra i. De är inte akuta problem nu, men varje ny feature som berör säsongsslut eller motorkärnan har hög friktionskostnad.

70+ tjänster i en flat `services/`-mapp är navigeringsfriktion. Understruktur finns (`events/`, `portal/`) men det är ofullständigt. Att hitta "var görs press conference-logiken?" tar längre tid än det borde.

`SaveGame`-entiteten är 14 KB och växer. Den är spelets "guds objekt" — allt passerar igenom den. Migration-logiken sitter på två ställen (infra-lagret och store), vilket är en tickande bomb när schemaändringar görs.

`granskaEventClassifier.ts` skapades som fil men importerades aldrig i produktion (lärt sig via kvar-audit 2026-05-04). Det är ett tecken på ett bredare mönster: tjänster byggs men kopplas inte in i renderingsflödet. `docs/THE_BOMB.md` beskriver exakt detta — systemen pratar inte med varandra.

---

## 2. Spelarens flöde — styrkor och svagheter

**Flödet i korthet**

```
Intro → Namn → KlubbVal → ArrivalScene → Portal
→ (varje omgång) Portal → Match → Granska → RoundSummary
→ (halvt) HalfTimeSummary
→ (säsongsslut) Playoff → QFSummary → SeasonSummary
```

**Styrkor**

*Matchupplevelsen* är spelets starkaste yta. Livematchen med fyra interaktiva beslutspunkter (hörna, frislag, straff, kontra) är ovanlig i webbaserade managementspel. Det är genuint engagerande att välja hörnvariant i 85:e minutens oavgjort. GranskaScreen efteråt är rik — shotmap, tidslinje, rivallagets resultat med 🔥-markering, scouting, P19, presskonferens. Det är den del av spelet som känns mest sammanhållen.

*Onboarding-sekvensen* (Intro → Namn → KlubbVal → ArrivalScene) är spelets estetiska höjdpunkt. Texten sitter. "Bandysverige är ett litet rum." "Mer har vi inte." Det är 2-3 minuter som skapar maximal förväntning.

*Narrativ bredd* är imponerande: journalist med persona och relation, klack med namn och ritual, kafferum som reagerar på transfers och streaks, match-commentary som refererar kapten/klackfavorit/akademispelare/dagsjobb. Systemen finns och är kopplade (mer än vad man förstår vid en ytlig titt).

**Svagheter**

*Portal omg 1* löser inte vad den lovar. Arkitekturen är designad för säsong 2+ när klubbminne, journalistrelation och säsongssignatur har ackumulerats. Vid premiärmatchen visar den tre kort som alla säger "det börjar nu". Spelaren får ingen agens på portal-nivån.

*Pre-match-momentet saknas helt.* Spelaren klickar "Spela omgång X" och hamnar direkt i lineupvyn. Det finns ingen 30-sekundersskärm som etablerar *vad som står på spel i just denna match*. FM har pre-match notes från assistenten. OOTP lyfter rivalen, streak-kontexten, divisionsläget. Bandy Manager: knapp.

*Halvtidssummary* är ett "pit stop" men inte ett dramatiskt vändpunktsmoment. Du byter taktik, du läser statistik, du klickar vidare. Halvtid i verklig bandy är ett rum, en whiteboard, en tränare som antingen lurar eller exploderar. Det saknas helt.

*Squad-skärmen* är data-tung utan hierarki. Form, kondition, moral, skärpa, dubbelliv, egenskaper, marknadsvärde, kontrakt, karriärresa — allt på samma visuella yta. Spelaren vet inte var blicken ska landa. Vilken spelare är *problemet* just nu? Vilket kontrakt brinner? Det borde vara omedelbart uppenbart.

*Transfers är transaktionella, inte narrativa.* Du lägger ett bud. Du väntar en omgång. Det accepteras eller avvisas. Spelaren vet inte om mottagande klubben diskuterar budet, om spelaren är intresserad, om det finns konkurrenter. FM-spelet lever på transferdrama; det här behandlar transfers som en lagerlista.

*Granska-Fas 2* är kodbyggt men oklart verifierat. `granskaEventClassifier.ts` var inte importerad i produktion fram till 2026-05-04. Det är okänt vad spelaren faktiskt ser vs vad koden producerar.

---

## 3. Spelvärde och underhållning — jämförelse med konkurrenter

**Konkurrenter och deras vinkel**

| Spel | Vinner på |
|---|---|
| Football Manager | Mekaniskt djup, taktisk granularitet, global spelardata |
| Out of the Park Baseball | Dynastier över decennier, statistisk nostalgi, community |
| Retro Bowl | Enkel, snabb, pick-up-and-play |
| Hattrick | Social/community-aspekt, lång historia |
| New Star Manager | Mobilformat, enkelt men narrativt |

Bandy Manager kan inte slå FM på mekanik eller OOTP på data. Det är rätt insikt och den är redan formulerad i handover-dokumenten. **Spelets enda försprång är världens specificitet** — tolv klubbar, alla med identitet, bandysvensk atmosfär, bruksort.

**Styrkor som differentiering**

Den atmosfäriska tätheten är genuint sällsynt. Inget annat managementspel har en kioskvakt med historik, ett "Birger trummar ensam"-moment, en kassör som citerar "Mer har vi inte" i omklädningsrummet. Det finns spel som försöker vara community-förankrade men få lyckas.

Match-kalibreringen mot verklig Elitseriedata (hörnmål 22%, halvtidsledning 78% vinner, 3.77 utvisningar/match) ger ett äkta statistiskt underlag som de flesta hobbyprojekt saknar.

**Svagheter som underhållning**

*Spelet är för läst och för lite spelat.* Text har blivit fordonet, inte kontexten. BoardMeeting är 4 beats av dialogläsning utan val. Portal omg 1 är tre kort att bläddra igenom. Granska är en rapport att läsa. Spelaren är publik, inte aktör.

*Loop-känslan är otydlig.* I FM vet spelaren alltid vad nästa session innehåller: scouta ungdomen, fixa taktiken, spela matchen, hantera pressen. I Bandy Manager är det oklart vad spelaren "egentligen gör" en normal omgång utöver "klicka advance".

*Säsong 1 omgång 1 är spelets svagaste stund* — precis när spelaren är som mest öppen och nyfiken. Tre neutrala portal-kort, en match, en Granska. Kontrasten mot intro-sekvensens löfte är stor.

*Frånvaro av progression-feedback.* Spelaren vet inte om de spelar "bra". Är 5:e plats i läge 6 bra eller dåligt? Är 320 tkr på kontot sunt? Utan en referensram för att kontextualisera data är siffrorna tomma.

---

## 4. Gap — inlåst och underutnyttjad funktionalitet

Det här är den viktigaste sektionen. Spelet har byggt mer än det visar.

**System som existerar men inte syns**

| System | Vad det gör | Notering |
|---|---|---|
| `weeklyDecisionService.ts` | Genererar veckobeslut | Oklart om de triggas regelbundet och med rätt frekvens |
| `boardObjectiveService.ts` | Styr sekundära mål från styrelsen | Visas i inbox men bortglömda efter säsongsstart |
| `leadershipService.ts` + `useLeadershipAction()` | Ledarskapshandlingar på spelare | Finns i store men oklart om tillgängligt i UI |
| `opponentAnalysisService.ts` | Analys av motståndare | `OpponentAnalysisCard.tsx` finns, oklart hur frekvent spelaren ser det |
| `rumorService.ts` | Ryktens generation | Triggas av roundProcessor men oklart hur synligt för spelaren |
| `playerVoiceService.ts` | Spelar-dialog | Finns via "Prata med spelaren" men oklart hur often unikt innehåll ges |
| `mecenatDinnerService.ts` | Mecenat-social events | Entities finns, oklart om de når spelaren regelbundet |
| `hallDebateData.ts` | Kommunfullmäktige-debatter | Data finns, oklart om det triggas i flödet |
| `smallAbsurditiesData.ts` | Slumpmässiga humorhändelser | Finns, oklart om de bidrar till stämningen i praktiken |
| `arcService.ts` + storylines | Spelar/säsong-arcs | Byggs i bakgrunden, visas i SeasonSummary — inte under säsongens gång |

**Innehåll som är skrivet men ej integrerat**

- `matchCommentary.ts` är 38 KB text. Hur stor andel når faktiskt spelaren under en normal match?
- Journalist-persona: spelaren har en namngiven journalist med historia. Hur ofta påverkar *relationen* (0–100) vad som faktiskt skrivs? Är relation 80 annorlunda än 20 i prakitken?
- Board patience är ett system med 6 thresholds. Upplever spelaren board som en aktiv kraft under säsongen, eller uppenbarar det sig bara vid säsongsslut?
- EventCardInline-pooler för `starPerformance`, `playerPraise`, `captainSpeech` levererades 2026-05-03 men kod-integration i respektive factory-funktion är "⚠️ Awaiting". Skrivet innehåll som inte visas.

---

## 5. Förbättringsförslag

**A. Pre-match stämningsskärm (hög impact, låg kostnad)**

En 30-sekunders icke-skärm som visas innan lineup-vyn. En mening som sätter kontexten för just denna match:

> *"Omgång 8. Forsbacka på hemmaplan. De har inte förlorat här på 14 matcher."*
> *"Derbyt. Birger är redan på plats utanför arenan."*
> *"Sista matchen innan uppehållet. Tabellläge: 4:a med 3 poängs marginal uppåt."*

Texten genereras från befintliga data: fixture, derby-flag, standing, opponent form. Inga nya system. Det är THE_BOMB-principen i miniatyr: befintlig data, ny presentation.

**B. Squad-hierarki — "Nu"-vy**

Squad-skärmen behöver en startvy som svarar på frågan "vad är akut?". Inte en lista med all data, utan ett dashboard som visar:
- Tre spelare med lägst moral (och varför)
- Utgående kontrakt nästa 3 omgångar
- Skadade (finns redan, men konkurrerar med annan info)
- Rekommendation från coach om formation baserat på truppen

Det data som behövs finns redan. Det är prioriteringen och presentationen som saknas.

**C. Halvtid som vändpunkt**

Halvtidssummary-skärmen borde ha ett val med mekanisk konsekvens, inte bara taktikbyte. Alternativen behöver inte vara komplexa:

- *"Lugna ner tempot — spara energi till slutet"* → reducerar press, ökar uthållighet i andra halvlek
- *"Pressa hårdare — vi behöver ett mål"* → ökar chanser men ökar skaderisk
- *"Låt spelarna prata"* → morale-boost men ingen taktisk effekt

Spelaren måste känna att halvtid är ett beslut, inte en läs-och-klicka.

**D. Portal omg 1 som spelets egentliga premier**

Omgång 1 borde ha ett dedikerat kort som bara visas vid säsongens första match. Inte en situation-card, inte en extra secondary — ett distinct visuellt moment som markerar att "nu börjar det". Klubbens förra säsong (om säsong 2+), stämningen runt öppningsmatchen, supporters förväntan. Kort men distinkt.

**E. Transferdrama som narrativ**

När spelaren lägger ett bud borde det ta plats. Inte "bud skickat, väntar". Istället:
- En kafferum-rad nästa omgång: *"Hörde att vi lägger på för den där killen från Kalix."*
- En journalist-notis om ryktet bekräftats: *"Transferpratet runt Lindström tar fart."*
- Mottagande klubbens reaktion i text: *"Boltic avvisar budet utan diskussion."*

Allt det data finns. Det behövs bara en trigger-kanal.

---

## 6. Nästa utvecklingssteg

**Omedelbart**
1. Playtest ArrivalScene hela flödet (steg 0→4)
2. Opus: Sture per-klubb-repliker i `arrivalDialogue.ts`
3. Verifiera Granska Fas 2 faktiskt syns i UI — gå igenom en match och kontrollera att `ReaktionerKort` renderas

**Kortsiktigt (nästa 2–3 sessioner)**
4. Pre-match stämningsskärm — enklaste THE BOMB-implementationen
5. Squad-hierarki: "Nu"-vy som svarar på "vad är akut?"
6. EventCardInline-pooler: slutför kod-integration av `starPerformance`, `playerPraise`, `captainSpeech`

**Mellanlångt (nästa månad)**
7. Portal omg 1: premiär-specifikt kort
8. Halvtidsvalet: ett val med konsekvens
9. Transferdrama: kafferum + journalist-trigger vid aktiva bud
10. Board objectives: synliggör dem i Portal-kortet per omgång, inte bara i inbox vid säsongsstart

**Längre (2–3 månader)**
11. Säsong 2 — det är när portalen faktiskt funkar. Bygga dit och spela dit är ett eget mål.
12. CommentaryFeed-redesign (Stålvallen B) — 15 stripes väntar, men det är en stor visuell insats
13. `SeasonSummaryScreen` hierarki — det finns extremt mycket data men det presenteras utan dramaturgisk kurering

---

## 7. Saknade features, moment och content

**Feature: "Omklädningsrummet efter match"**

Inte en ny skärm — en kort sektion i GranskaScreen eller MatchResult. Tre karaktärer med varsitt replik som reagerar på matchutfallet. Kassören kommenterar ekonomin om det var derbyt. Klackledaren om stämningen. En spelare om sin prestation. Allt detta *finns* redan som individuella system. De har aldrig sammanförts vid matchslutet.

**Feature: Träningsdagen som narrativ**

Training är idag mekanisk: välj fokus, klicka, nästa omgång. Men träning är det bandyspecifika rummet — utomhus, december, ljus på konstgjord is, en ny spelare som är osäker, en veteran som lär ut. `trainingService.ts` och `trainingProjectService.ts` finns men ingen berättelse runt dem.

**Feature: Rivalens röst**

Motståndartränaren (`opponentManagerService.ts`) finns och genererar citat. Men spelaren möter dem aldrig direkt. Inför derbyt borde rivalens tränare citera något i pressen. Det triggar motståndarkänsla mer än något tabelldiagram gör.

**Feature: Spelaren som vägrar**

Idag säger spelare aldrig nej. Realismen i bandysvenskt amatörbandy är att spelare ibland "känner att de inte kan prioritera" — familj, jobb, trötthet. En sällsynt händelse (2–3 per säsong) där en spelare signalerar att han kanske inte kan fortsätta, och tränaren får prata med honom, är ett genuint bandysvenskt drama som saknas.

**Feature: Det tomma läktaravsnittet**

Bandy är en sport med ofta glesa läktare. Stämnings-systemet bygger på närvaro och engagemang. Men spelet visar aldrig vad *frånvaron* ser ut — matchen mot en tabellsista en måndag i januari med 40 åskådare. Klacken som sjunger till en tom hemmakurva. Det är mer bandysvenskt än de fullsatta arenorna.

**Content: Klackens sång**

Varje klack har ett `supporterGroupName` och en ritual. Men har de en faktisk sång? En specifik sång (påhittad, en rad) för just Häggenas Hammarsmeder eller Glasblåsarnas Gille — det är det som gör en klack verklig. `matchCommentary.ts`-sektionen `supporter_*` borde kunna referera till det.

**Content: ArrivalScene per-klubb**

Sture-replikerna är just nu 4 generiska platshållare. Men Sture i Boltic är inte Sture i Söderfors. Boltic är strandortens spelmiljö — isen ligger nära vattnet, det blåser alltid. Söderfors är brukets trädgård — arbetslinjen, raka rör. Fyra specifika Sture-repliker per klubb (12 × 4 = 48 strängar) är ett relativt begränsat textjobb med enormt utdelning på autenticitet.

**Content: Säsongsfas-specifika kafferumsrepliker**

Kafferumsservice reagerar idag på transfers, streaks och resultat. Men inte på säsongsfas. Att kafferumsrepliken i omgång 18 (titelrace) skiljer sig från omgång 3 (tidig, lösare) är ett enkelt trigger-mönster. Kassörens ton skiljer sig beroende på om man är i playoff-läge eller relegation-kamp.

---

## Sammanfattning

Spelet har mer djup än det visar. Flödet från intro till match till granska är solid. Problemet är att systemens rikedom är osynlig för spelaren under spelets gång — den dyker upp i SeasonSummary eller matchcommentary men aldrig som ett direkt *val* eller *moment* spelaren äger.

Nästa fasens arbete borde handla om att synliggöra det som redan finns — inte lägga till mer.
