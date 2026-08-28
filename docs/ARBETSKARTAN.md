# ARBETSKARTAN

**Skapad:** 2026-08-24 · **Ägare:** Opus
**Detta är inte en analys. Det är en checklista jag ska köra före varje dom, och den ska citeras i domen.**

---

## Varför den finns

Fyra gånger på en vecka har jag ställt en för smal fråga och byggt mot den:

- Behandlade fjorton auditfynd som fjorton problem tills Jacob sa att det var ett.
- Skrev påståendekartan, kallade den diagnos, och gick tillbaka till att beta av fynd en och en.
- Diagnosticerade `VAR`-fel, korrigerade till `NÄR`-fel, och missade `SANNINGEN-SAKNAS` — som visade sig vara största arten.
- Föreslog en `boardPatience`-skala byggd på två mätpunkter av tolv, och missade helt att `boardExpectation` är statisk över en tioårig karriär.

Varje gång har Jacob ställt frågan som öppnade det. Det är hans jobb att döma produkten, inte att kompensera för att jag tänker smalt.

**Mönstret:** jag svarar på det som ligger framför mig. Rapporten som kom, fyndet som rapporterades, fältet som nämndes. Kartor jag skriver blir dokument jag refererar till, inte verktyg jag använder.

---

## De sju frågorna

Körs före varje dom som rör mekanik, kalibrering eller arkitektur. **Domen ska säga vilka som ställdes och vad de gav.** En dom utan den raden är ofullständig.

### 1 · Är detta en instans eller en art?

Finns samma fel någon annanstans i kodbasen, byggt av samma vana? Om jag inte vet — sök innan jag dömer.

*Fångade: fjorton fynd var ett. Fem Granska-syskongrenar. Tre `roundNumber`-sorteringar. `signedRound` i fem fältfamiljer.*

### 2 · Hur många datapunkter vilar domen på?

Om svaret är färre än hälften av populationen: mät först. En linje genom två punkter är fyra gissningar.

*Missade: `boardPatience`-skalan mätt på två av tolv klubbar.*

### 3 · Vad händer över tid?

Fältet, formeln eller texten — hur beter den sig säsong ett mot säsong tio? Är den statisk i en värld som rör sig? **Och: hur många gånger körs detta under en karriär?** En sannolikhet som prövas en gång i säsongen är en sannolikhet. En som prövas 130-220 gånger över en karriär är i praktiken en säkerhet — skillnaden mellan procenttalen försvinner i upprepningen, och ingen kalibrering av TALET löser det om FORMEN (rulla varje kvalificerande tillfälle) är fel.

*Missade: `boardExpectation` frusen vid generering. `.slice(-5)`. `seasonCupStats` som aldrig nollställdes. Mecenat-/patronrampen (2026-08-26) — en 1-15%-sannolikhet per omgång, upprepad över tio säsonger × 13-22 kvalificerande omgångar, konvergerar mot samma utfall oavsett communityStanding. Frågan "hur många gånger körs detta" hade fångat det innan rampen byggdes.*

### 4 · Vad är den andra riktningen?

Om något kan stiga, kan det falla? Om något kan läggas till, kan det tas bort? Om en spelare kan lyckas, kan hen misslyckas?

*Fångade: `U6` renommé nedåt. Missade: förväntan uppåt.*

### 5 · Vem läser detta fält utom den yta jag tittar på?

Två läsare av samma sanning som drar olika slutsatser är seriens vanligaste fel.

*Fångade: styrelsens fyra formler. `fanMood` mot `supporterGroup.mood`. Och `board_failure` som hade varit oense med sig själv.*

### 5b · Är mätstickan jag använder själv rörlig?

Inte bara "vem mer läser fältet" — **förändras fältet av det jag mäter med det?** Ett villkor byggt på ett tröskelvärde som självt stiger med framgång blir hårdare ju bättre spelaren presterar, alltså tvärtemot avsikten.

**Regeln:** en gate som ska belöna framgång måste mätas mot något **absolut**, aldrig mot ett krav som självt anpassas efter samma framgång.

*Missade: `A-H2b`:s villkor 2 använde `expectationVerdict`, som är tierrelativ. En dominant klubb klattrar till `WinLeague` där bara förstaplats räknas — gaten fyrade oftare för mittenlag än för mästare. Två mekaniker som var för sig är rätt och tillsammans motsäger varandra.*

### 6 · Vad säger domen att den vet, och varifrån?

Varje påstående i domen ska gå att spåra till en fil, en mätning eller en källa. Kan det inte det ska domen säga att det är en gissning.

*Missade: "fyra delar går inte att nå" efter två sökningar. "Tre kontrakt löper ut" utan data.*

### 7 · Vad avslutar det här?

Vilket villkor gör posten klar? Om svaret är "när nästa audit inte hittar något" är det inget villkor — auditer tar aldrig slut.

*Missade: hela sluttestet byggdes mot auditer tills Jacob satte kriteriet själv.*

### 8 · Läs leveransen först

**Inte en fråga — en handling.** När någon rapporterar att en fil levererats: öppna den innan svaret skrivs. Alltid, oavsett hur fullständig sammanfattningen verkar.

Skälet att den måste vara en regel och inte en bedömning: **bedömningen är själva felet.** En kompetent sammanfattning känns tillräcklig, och känslan uppstår innan jag vet vad som står i filen. Det finns inget ögonblick där jag märker att jag hoppar över något.

*Missade fyra gånger på en vecka — Designs förutsättningsfas, Codes viktförslag, Skutskär-auditen, tidsstämplarna som jag läste i stället för innehållet. Varje gång ändrade Jacobs "läste du filen?" mitt svar.*

---

## Tre regler som följer

**Rapportera inte frånvaro utan att ha prövat en andra metod.** Inte en upprepning — en annan väg. Annan sökterm, annan sökväg, annat verktyg.

**Skriv ner fynd medan de hittas, aldrig i en sammanställning efteråt.** Två gånger har fyrtio fynd blivit arton för att resten låg i en kontext som försvann.

**En yta i taget är fel enhet.** Fråga alltid efter syskonen innan fixen byggs.

---

## Vad jag gör när kartan säger stopp

Om fråga 1, 2, 3 eller 4 inte kan besvaras: **beställ mätningen i stället för att bygga.**

Det kostar ett pass. Att bygga på en gissning kostar tre, för då byggs fixen, mätningen, och fixen om.

---

## Underhåll

Frågorna kommer ur verkliga misstag, inte ur teori. **När ett nytt mönster kostar oss ett pass ska en fråga läggas till här** — men bara om den hade fångat det.

Listan får inte växa till tjugo frågor. Den ska gå att köra i huvudet.
