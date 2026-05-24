# Playtest-noteringar 2026-05-04

**Status:** Aktiv playtest. Lista växer under sessionen. Inget fixas innan Jacob säger till.
**Spelets versionsläge:** Efter scen-trigger-fix + cup-intro + cup-final-intro + skottbild-fix + tom event-rad-fix + ful pokal-pre-match borttagen för cup.

---

## Fas 1-resultat (kväll 2026-05-04)

**Shotmap implementation enligt mock — 🔄 KOD KLAR, väntar Jacobs ✅**
- Halvcirkel-paths för målgård + straffområde implementerade
- Grå separator-rect med riktningspilar `↑ VI ANFALLER` / `DE ANFALLER ↓`
- Symptomfix från eftermiddagen reverterad (streckad linje + felaktiga etiketter borttagna)
- viewBox 0 0 280 230
- Stats: "Hittills (X matcher)", pil ▼ borttagen, motståndare visar "träffsäkerhet"

**Stats matematiskt verifierat 20:46:** Siffrorna stämmer. Men terminologin är inkonsekvent — "60% konv." för spelaren, "0% träffsäkerhet" för motståndaren, samma beräkning. Behöver enhetlig term. Specens lutning var att byta båda till "träffsäkerhet" — Code bytte bara den ena. Jacobs beslut väntar.

**Bekräftad bug 20:47 (gammal, ej fixad):** Dubbel presskonferens i Granska Översikt syns fortfarande — bekräftar Code:s diagnos C. Fix ligger i Fas 2 (ta bort `generatePressConference` från `postAdvanceEvents.ts`). Plus 6 events i Översikt — också Fas 2.

## Redan fixat denna session

1. ✅ BoardMeetingScene triggar inte (currentSeason !== 1 var fel — kalenderår, inte säsongsnummer)
2. ✅ BoardMeeting-text städad — inget regi-språk, 0-värden utelämnas, inga sammanfattnings-meningar
3. ✅ Cup-intro-scen byggd (innan första cupmatch säsong 1)
4. ✅ Cup-final-intro-scen byggd (innan cupfinal)
5. ✅ Scen-kedja: completeScene anropar detectSceneTrigger igen så scener flyter naturligt
6. ✅ Skottbild — streckad mittlinje, "MOTSTÅNDARMÅL" och "VÅRT MÅL" vid respektive mål
7. ✅ Tom event-rad i match-live filtrerad bort
8. ✅ Ful pokal-pre-match borttagen för cup-final (SM-final behåller sin)

---

## Bekräftade buggar / fula saker — väntar på fix

### Match-fas-overlays (förlängning + straffläggning)
- **Vad:** "FÖRLÄNGNING" (90') och "STRAFFAR" (120') visas som halv-overlay ovanpå scoreboard + commentary-feed. Bottennav och "MATCH PÅGÅR — SPELA KLART"-bannern syns fortfarande.
- **Jacobs preferens:** Bra att den täcker — gör den **fullskärm-scen-stil**. Samma behandling båda två (FÖRLÄNGNING + STRAFFAR).
- **Var i koden:** `PhaseOverlay`-komponenten i `MatchLiveScreen`. Skärmdumpar 17:14 och 17:16.
- **Designnoteringar:**
  - STRAFFAR-knappen är röd-orange (avviker från app-paletten — accent-copper är standard)
  - Stora versaler-rubriker matchar inte vår vanliga typografi
  - Bör se ut som BoardMeeting/CupIntro: mörk bg-scene, Georgia-rubrik, kort understatement-text

### Cupfinalförlust-skärmen (skärmdump 17:17)
- **Vad:** Efter förlorad cupfinal — fullskärm-skärm med silvermedalj-emoji, "CUPFINALFÖRLUST", "Västanfors vann Svenska Cupen / Ni kom ändå långt", Fortsätt-CTA.
- **Jacobs reaktion:** Bra skärm men ser "helt egen ut". Inkonsekvent stil mot resten.
- **Designnoteringar:**
  - Stora versaler-rubrik (igen)
  - Centrerad layout, helt mörk bakgrund — närmar sig scen-stil men inte exakt
  - Bör matcha BoardMeeting/CupIntro-stilen (Georgia, kort understatement)
  - "Ni kom ändå långt" — ganska tomt avslut, kanske kan göras vassare i bandysverige-ton
- **Var i koden:** Troligen `CeremonyCupFinal.tsx` eller liknande — Jacob nämnde den finns för cup-final.

### Inkonsekvent CTA — "matchen avgjordes på straffar"-skärm (skärmdump 17:17, steg innan)
- **Vad:** I steget innan cupfinalförlusten visades en skärm med "matchen avgjordes på straffar" — ingen Fortsätt-CTA. Spelaren kunde klicka någonstans för att gå vidare men det var inte tydligt.
- **Bug:** CTA-knapp saknas. Inkonsekvent med övriga "slut"-skärmar som har explicit Fortsätt.
- **Var i koden:** Troligen samma fil som ovan (CeremonyCupFinal eller match-end-flödet i `MatchLiveScreen`).

### Kafferummet — tom undersida + konstig CTA + tajming (skärmdump 17:18)
- **Vad:** Kafferum-scen triggade direkt efter cupfinalförlust. Snygg uppe — tre dialogpar (kioskvakten/kassören, ungdomstränaren/materialaren, kassören/ordföranden). Men nedre halvan av skärmen är helt tom.
- **CTA:** "Tillbaka till dashboarden" — `btn-outline`-stil, sitter längst ner. Avviker från BoardMeeting/CupIntro där CTA är primary-knapp med text som "Då börjar vi" / "Då kör vi". Inkonsekvent.
- **Tajming-fråga:** Ska kafferummet verkligen trigga *direkt efter* cupfinalförlust? Det känns för snabbt — spelaren har precis fått "CUPFINALFÖRLUST" och klickat Fortsätt, och då hamnar i kafferum-skvaller. Övergången är abrupt.
- **Möjliga lösningar att fundera på (inte bestäm nu):**
  - Cooldown efter förlustsscener (cup_final_loss → kafferum får inte trigga samma omgång)
  - Eller: kafferum *kan* trigga men med specifik content som refererar förlusten
  - Eller: "matchen avgjordes på straffar" → cupfinalförlust → portal → *nästa* omgång kan kafferum trigga
- **Designfix:** Kortare innehåll så det inte är tomt undertill, ELLER mer dialog-rader så det fyller skärmen, ELLER en förklaring i tom-zonen ("Resten av eftermiddagen rinner förbi.")

### Eventsekonomi efter cup-semi (5 events)
- **Vad:** Spelaren fick 5 händelser i match-sammanfattningen efter cup-semifinal. Lite mycket.
- **Status:** Inte fixat. Kräver att Jacob skickar skärmdump nästa playtest så jag kan avgöra:
  - Är de 5 atmosfäriska reaktioner som ska gå till Reaktioner-kortet (specat i SPEC_GRANSKA_OMARBETNING men inte byggt)?
  - Eller är de 5 alla beslutsfrågor (presskonferens, patron, etc) → då måste cap sänkas?
- **Hör ihop med:** SPEC_GRANSKA_OMARBETNING (skriven, inte byggd).

### Eventsekonomi efter första seriematch (6 events) — skärmdump 17:21
- **Vad:** Granska efter Målilla 0–6 Lesjöfors visar SEX händelse-kort:
  1. Rekrytera funktionärer (HÄNDELSE)
  2. Presskonferens — Helena Wikström, Allehanda
  3. Kontraktsförfrågan — Mikko Hedberg
  4. Sara och tifon (HÄNDELSE)
  5. Presskonferens (en till? — Helena Wikström igen?)
  6. Domarens locker room (Rögner Rönnqvist)
- **Bekräftar:** Granska följer inte uppmärksamhetsekonomin. Detta är *exakt* problemet SPEC_GRANSKA_OMARBETNING är till för.
- **Notering:** Två presskonferenser från samma journalist är dessutom märkligt — kan vara en bugg där events genereras dubbelt eller en gammal som inte rensats.

### Dashboard onboarding-knappar fel — skärmdump 17:19
- **Vad:** På Portal/Dashboard inför första seriematch visas händelse-kort med tre val:
  - "Förläng 3 år (+20% lön, 9 tkr/mån)" — primary copper
  - "Förläng 1 år (samma lön, 7 tkr/mån)" — vit/ljus
  - "Avslå — vi diskuterar senare" — vit/ljus
- **Jacobs reaktion:** Knapparna är fel. De ljusa knapparna avviker från app-paletten — ska vara mer nedtonade (ghost/outline?) inte rena vita.
- **"2 saker till att kolla" länk** — går till inbox där Jacob inte kan påverka något. Ska den länken finnas? Eller ska den gå till annan plats? Eller ska det stå annorlunda?

### Bekräftelse: Dashboard börjar se rolig ut
- **Vad:** Jacob noterar positivt att Portal/Dashboard ser bra ut i övrigt — Seriepremiär-kort, Ispremiär (klacken-rad), Nästa match med form-prickar, Kafferummet-kort, Glasblåsarna-kort med backstory-citat.
- **Behåll-mönster:** Den här strukturen sitter.

### Skottbildens stats stämmer inte (skärmdump 17:22)
- **Vad:** Granska efter Målilla 0–6 Lesjöfors. Skottbilden visar:
  - **MÅLILLA**: 0 mål · 4 räddade · 5 miss = 9 skott totalt ✓
  - Ditt skottmönster: "9 skott · 4 på mål · 0% konv." ✓
  - **LESJÖFORS**: 6 mål · 2 räddade · 6 miss = 14 skott totalt ✓
  - Lesjöfors-kortet: "14 / 8 · 75% konv." — alltså 8 på mål (6 mål + 2 räddade)
  - **MEN**: 6/8 = 75% är BARA om man räknar mål av skotten på mål. Att kalla det "konv." här är missvisande.
- **Bug i statistiken:**
  - **"Säsongen (3 matcher) · 43 skott · 44%"** — om Målilla har spelat 3 matcher (cup R1, cup-semi, cup-final, plus seriematch = 4?) så är räkningen oklar. Eller är cup-final inte räknad i "matcher"?
  - **"44% ▼"** — vad jämförs det mot? Pilen ner antyder försämring men relativt vad?
- **Måste verifieras:** Kör matchen igen, kolla:
  - Är skotten korrekta? (matcha mot match-loggen)
  - Vad räknas som "säsongen"? Cup + serie? Bara serie?
  - Vad är 44%-jämförelsen?

### Knapparna i händelse-kortet — runda och mindre? (referens till skärmdump 17:19)
- **Jacobs preferens:** Knapparna i händelse-kortet på Portal ska vara runda och mindre. Just nu är de stora rektangulära fullbredds-knappar.
- **Designnoteringar:**
  - Mer pill-stil eller chip-stil?
  - Mindre = mindre vertikal padding och fontstorlek
  - Runda = högre border-radius (16+ eller pill-shape)
  - Hör ihop med tidigare notering om de ljusa knapparna som avviker från paletten

---

## Att titta efter resten av playtesten

- Alla "modal-overlay" som täcker delar av skärmen istället för att vara fullskärm. Lista dem efterhand.
- Eventflöden: hur många events kommer på rad i Granska? Är det olika typer av event-natur (kritisk vs atmosfär) eller en klump av samma sort?
- Stilskillnader: någon vy som har gammal stil (gradient-knappar, stora pokaler, "var(--bg-dark)" på copper) som inte matchar nuvarande språk?
- Texter som inte sitter (LLM-paired sentences, regi-språk, "Det är läget"-typ avslut, double-double).
- Cup-final-intro-scenen: kände den rätt? För kort, för lång, fel ton?

---

## Specer/arbete väntande efter playtest

- **SPEC_GRANSKA_OMARBETNING.md** — väntar på implementation. Granska migreras till SPEC_BESLUTSEKONOMI:s kö-modell, men efter natur (kritiska/spelare/reaktioner) inte efter prio. Reaktioner-kort introduceras.
- **Moments-systemet (B)** — datamodell finns, builder + UI saknas. Fortfarande halvfärdigt. Cup-final-intro använder *scen-systemet* (A), inte moments-systemet (B). De är separata.
- **Säsongssignatur-modifierare** — visuellt komplett, mekaniska modifierare ej injicerade i rumorService/transferService/matchEngine.

---

## Läges-anteckning till Opus (om ny session påbörjas)

Vi sitter i aktiv playtest. **Jacob skickar skärmdumpar — Opus dokumenterar i denna fil men fixar INGENTING utan explicit "fixa nu".** Tidigare i sessionen hände för mycket reaktivt arbete utan helhetsbild. Listan ovan tas i klump efter playtest, inte styckevis.

Om Jacob säger "fixa allt på listan" — kör. Om han säger "fixa X" — kör bara X. Om han bara skickar bilder — bara dokumentera.
