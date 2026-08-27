# CODE-INSTRUKTION — SOMMAREN (SÄSONGSÖVERGÅNGEN)

**Datum:** 2026-08-17 · **Av:** Opus (chat)
**Underlag:** `docs/incoming/Sommaren-sasongsovergangen-2026-08-17.dc.html` — **variant 1e är vald.** 1a, 1b, 1c och 1d är förkastade; bygg inte mot dem, och läs inte deras Code-anteckningar som gällande.
**Bakgrund:** M-03 i tvåsäsongsauditen, bekräftad av långspelsauditen (10 säsonger): premiären efter årsboken är cupkvartsfinal med full beslutskö och oförändrad utbrändhet.

**Ligger efter** Del A i `CODE_INSTRUKTION_LANGSPEL_10SASONGER_2026-08-17.md`. `.slice(-5)` går först — varje spelad säsong under tiden är fem år en framtida spelare tappar.

---

## Vad detta är

En skärm mellan årsboken och första tävlingsmatchen, från säsong 2 och framåt. Inte en meny, inga beslut. Den ska gå att passera i två sekunder och ändå väga något.

Variant 1e har tre delar med en temperaturkurva: ett svalt erkännande överst, en saklig kropp i mitten, ett varmt push-block nederst. Ögat ska dras nedåt mot matchen. Det var stegringen som saknades i 1d — två tysta läderrutor blir ingen rörelse.

Struktur, uppifrån:

1. **Kapitel-header på läder** — Georgia-hero "Sommaren", epok-rad, sommarrad. Svalt, stilla, tittar bakåt.
2. **Paper-kropp** — tre händelser som egna rader, sedan styrelsens nya krav.
3. **Horisont-block, varmt** — säsongsvägen (Cup ▸ Serie ▸ Slutspel) med första noden tänd, tändraden, CTA med glow.

Cirka 1,6 skärmhöjder vid 390 px. Skissen i HTML-filen är källan för layout och tokens.

---

## All text är låst. Skriv inte om någon rad, hitta inte på varianter.

### Epok-raden (header)

Härledd ur `clubEraService` plus säsongsnummer. Fyra varianter:

- Säsong 2: **Din andra säsong. Nu vet de vad du heter.**
- Etablerad utan titel: **Din femte säsong. {Klubbnamn} är inte nykomlingar längre.**
- Titelförsvarare (vann SM eller serien föregående säsong): **Din sjätte säsong. Ni är laget alla vill slå.**
- Efter tapp (placering sämre än föregående säsong, eller utslagen tidigare än förra året): **Din åttonde säsong. Förra våren sitter kvar i väggarna.**

Ordningstalet skrivs ut i bokstäver och böjs: andra, tredje, fjärde, femte, sjätte, sjunde, åttonde, nionde, tionde. Därefter siffra: **Din 11:e säsong.** Klubbnamnet interpoleras bara i den andra varianten.

Prioritetsordning när flera villkor är sanna: titelförsvarare > efter tapp > etablerad > säsong 2.

### Sommarraden (header)

Varierar med `burnoutScore` vid säsongsslut, **inte** med resultat:

- Utvilad: **Du var på Gotland i tre veckor. Ingen ringde.**
- Något sliten: **Halva sommaren gick åt till att inte tänka på bandy. Det gick sådär.**
- Nära gränsen: **Du sov mycket. Det hjälpte lite.**

Trösklarna följer `getBurnoutZone`, som redan finns. Rapportera vilka zoner den returnerar om de inte är tre — då mappar jag om raderna, hitta inte på en fjärde.

### De tre händelserna (kropp)

Tre egna rader, en per händelse. Faktiska händelser ur säsongsavslutet: en spelare som slutade, en som åldrades och tappade, en ungdom som flyttades upp.

Ledrad: **Medan du var borta**

Radformer:
- **{Efternamn} la av.**
- **{Efternamn} fyllde {ålder}.**
- **{Efternamn} kom upp från P19.**

Finns färre än tre händelser: visa dem som finns. Finns ingen: **Ingenting hände. Isen låg och väntade.**

Hitta inte på en fjärde radform. Har säsongsavslutet en händelsetyp som inte täcks — en spelare som såldes, en tränare som slutade — rapportera den, så skriver jag raden.

### Styrelsekraven (kropp)

Ledrad: **Styrelsen har satt nya mål. De minns förra året, men de bryr sig mest om nästa.**

Under den: `BoardObjectivesList` rakt av. Den har rätt siffror och enheter sedan sluttestet — `formatMoneyPair`, `computeProgressPct` med avståndsformeln, och etiketten "Publikens humör". Bygg ingen egen variant.

Max två mål visas. Finns fler: **+{N} till.**

### Säsongsvägen (horisont-block)

Tre noder, första tänd: **Cup** ▸ **Serie · 22 omg** ▸ **Slutspel · mars**

Alla tre är riktiga strukturer i spelet. Härled omgångsantalet, hårdkoda inte 22.

### Tändraden (horisont-block, sist före CTA)

- Normalfall: **Det börjar med {Motståndare}. Det slutar i mars.**
- När slutspel inte är rimligt att räkna med: **Det börjar med {Motståndare}. Sen får vi se hur långt det räcker.**

Villkoret för den andra: styrelsens mål är att undvika nedflyttning, eller föregående säsong slutade utanför slutspelsplats. Rapportera vilket fält som bär det, gissa inte.

**Ingen dagarssiffra.** Design föreslog "82 dagar till slutspel" — det är en räknare, och räknare mäter, de tänder inte.

### CTA

Namnger vad som kommer, inte "Starta säsong" — den knappen trycktes just i årsboken.

**Cupen börjar. {Skede} mot {Motståndare}.**

Skedet härleds ur `matchTypeAxes` (`tävlingstyp` + `skede`), som finns sedan Granska del 4. Bygg ingen ny härledning — det blir en andra sanning om samma match.

---

## Mekanik

### Utbrändhetens återhämtning

Sker vid övergången, inte vid säsongsslut. Regeln: återhämta hälften av avståndet ner till 30, men aldrig under 30 om värdet låg över 60.

Alltså: 80 → 55. 62 → 46. 40 → 35. 20 → 20 (redan under, ingen ändring).

Skälet till golvet: en manager som körde sig i botten ska bära något in i nästa år. Utan det försvinner konsekvensen av att ha gjort det, och burnout blir en räknare som nollställs — vilket är precis det långspelsauditen anmärker på.

Detta är den enda mekaniska ändringen i ordern. Sommaren i övrigt läser state, den ändrar inget annat.

### Var skärmen ligger i flödet

Efter `SeasonSummaryScreen`s "Starta säsong"-knapp, före portalen. Den ska **inte** vara en `pendingScene` som kan hoppas över av auto-skip-effekten, och den ska inte kunna nås igen efter att den passerats — samma säsong visar den en gång.

Rapportera hur den bäst hakas in: en route i `CEREMONY_PATHS` utan `BottomNav`, eller en scen i den befintliga `scenes/`-familjen. `scenes/`-mappen är enligt Designs egen granskning den mest disciplinerade koden i appen, så om `SceneHeader`-skalet passar ska det användas.

---

## Vad skärmen inte gör

Ingen träningsplanering, ingen värvningsmarknad, inga beslut. Kön på väntande beslut ligger kvar i portalen — det är en portalfråga och hanteras separat i eventköns viktning, som ligger hos Design.

---

## Baseline

Fyra scener, 390 och 375 px:

- Säsong 2, utvilad, tre händelser, slutspel rimligt
- Säsong 6, titelförsvarare, nära gränsen, tre händelser
- Säsong 4, efter tapp, noll händelser (tomt-fallet), slutspel inte rimligt
- Säsong 11 (siffervarianten av epok-raden), något sliten, en händelse

Via fabriken. Behövs en `withSeasonTransition`-override är det en override, inte en egen scen.

Nav renderas för geometrimätning enligt tap-target-grinden — men skärmen är nav-fri i produktion, så den ska ligga i den kategorin och inte bland de ~28.

---

## Innan klart

Browser-verifiering enligt CLAUDE.md: spela till ett säsongsslut och passera skärmen. Rapportera vad du **såg** — särskilt om temperaturkurvan håller vid 390 px, alltså om ögat dras nedåt mot push-blocket eller om de tre delarna läser som tre likvärdiga rutor. Det är hela poängen med 1e och det enda testerna inte kan svara på.

`npm run build && npm test`, `lint:design`, `lint:text-guard`, snapshots gröna. Audit i `docs/sprints/`.
