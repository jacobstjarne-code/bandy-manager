# DESIGNSLUTSATSER — Steg 3: är designen rätt? (Fable-genomgång efter audit Del 1–14)

**Datum:** 2026-06-11 · **Underlag:** 14 del-audits, ~80 screens av build 050bb22, en hel säsong genomspelad (premiär → SM-guld → säsong 2)
**Fråga:** Inte "följs systemet?" (det vet vi nu) utan **"är systemet rätt?"** — och var kan det bli bättre?

---

## I · DOMEN: designen är rätt. Tre bevis från evidensen.

Efter att ha sett varje yta i spelet med riktig data säger jag det utan reservation: **grundvalen håller.** Inte som smak — som observerat beteende:

**Bevis 1 — Systemet överlever kontakt med verkligheten.** Det klassiska testet för ett designsystem är inte mockarna utan vad som händer när riktig data, riktiga edge-cases och riktig spelartid trycker på det. Liggar-Granska, Efterklang-flödet, beats, cooldown-korten, Årsboken, derby-varianten — alla bär FULL data utan att spricka. Det som sprack (Orten pre-recut, Inboxen) sprack av *innehållsmängd*, inte av designspråket.

**Bevis 2 — Driften går mot systemet, inte från det.** Det mest talande fyndet i hela auditen: när koden improviserade utan design uppfann den INTE ett annat formspråk — den uppfann *dåliga versioner av vårt* (pill-CTA:er i copper, emoji där illustration saknades). Och två improvisationer var *förbättringar* (vi/dom-LED, emoji-fria dataetiketter). Ett system folk flyr ser inte ut så. Det här systemet är lätt att vilja följa och svårt att följa exakt — det är ett regelproblem, inte ett designproblem.

**Bevis 3 — Rösten är omisskännlig.** "Förr i tiden sa man att det inte gick att slå storstaden. Sen kom du." / "Ingen reagerar. Hela truppen följer Håll." / änke-brevet. Ingen annan produkt låter så här. Tonaliteten — bandysvensk understatement — är systemets starkaste tillgång och den har INTE driftat på 14 delar. Copy-disciplinen höll bättre än pixel-disciplinen.

**Alltså:** ingen omdesign. Principerna (nostalgi-med-jobb, förstärkning/kontrast, 70-tal-inte-1800-tal) är inte bara estetik längre — de har visat sig vara *operativa*: de förutsade korrekt vilka ytor som skulle kännas fel (emoji-trofén, konfetti-före-avspark) innan någon formulerade varför.

## II · VAR SYSTEMET ÄR SVAGARE ÄN SIN POTENTIAL — fem förbättringar

Det här är inte försoningsfynd (de ligger i kartan). Det här är ställen där systemet är *rätt men inte färdigt* — där nästa designinvestering ger mest.

### 1 · Ceremonitrappan har ett hål i mitten

Vi har vardagen (kort, liggare) och vi har topparna (illustration, gold, scener). Men auditen visade att spelet har en MELLANNIVÅ av ögonblick som idag faller mellan stolarna och improviseras: SM-final-uppspelet, lagpresentationen, "Grundserien avklarad", slutspels-mellanskärmarna. Alla blev svaga av samma skäl — de är för stora för ett kort och för små för en illustration.

**Förslag: ratificera en tredje ceremoninivå — "den typografiska scenen".** ⬩-eyebrow + Georgia-hero + stripe + max ett strukturelement (bracket, matchup, lista) på mörk yta. Inga bilder, ingen emoji, ingen konfetti. Den finns redan embryoniskt (Halvvägs-beaten, Pokalen-beaten är nästan den) — den behöver bara erkännas som komponentklass med regler, så att nästa mellanögonblick får ett hem istället för en 🏆.

### 2 · Spelets siffror saknar ett enhetssystem

Auditens mest repetitiva fyndklass var inte färg utan **enheter**: tkr/säsong vs tkr/mån vs kr/mån · 46.1 vs 46 · "Styrka" vs procent vs betyg · MV som två betydelser. Designsystemet definierar hur siffror SER UT (Georgia, storlekar) men inte vad de BETYDER och hur de skrivs.

**Förslag: en "Tal & enheter"-sida i DESIGN-DECISIONS** — lika bindande som färgtokens: pengar alltid tkr heltal, lön alltid /mån, styrka alltid heltal, betyg alltid en decimal, procent bara för ork (med ⚡-ersatt ikon), datum alltid "omg N" inom säsong. Detta är billigast av alla förbättringar och träffar varje skärm.

### 3 · Severity-språket är systemets nästa token-familj

Spelet kommunicerar ständigt "hur allvarligt är det här?" — och gör det idag med ett lapptäcke: stripes, pills, emoji-bollar, röd text, amber siffror, "I fara". Auditens fynd (semafor-recidiv, styrka-färger utan nyckel, Neutral-taggar) är alla symptom på att severity aldrig fick en egen skala.

**Förslag: ratificera EN severity-skala** (lugn → uppmärksamhet → brådska → kris) med fasta uttryck per komponentklass (stripe-färg, dot, tag) — så att en spelare efter tre omgångar omedvetet kan läsa allvarsgrad var som helst i spelet. Det är skillnaden mellan ett spel som *visar* information och ett som *kan läsas med ryggmärgen*.

### 4 · Illustrationssystemet behöver sin andra våning innan det skalar

Bilderna som finns är utmärkta — men auditen visade gapet: trofén, uppspelet, lagfotot, kris-scenen. Beställningslistan växer organiskt och riskerar bli ad hoc (illustration-creep var din egen varning).

**Förslag: lås illustrations-katalogen till en fast lista om ~10** (intro, final, annandagen, derby, nyårsbandy, guld-trofé, sommaruppehåll, kris, ankomst, årsbok-vinjett) och förklara den STÄNGD i DESIGN-DECISIONS — nya bilder kräver att en gammal utgår. Reservprincipen som redan styr guldet, applicerad på bilder. Då förblir varje bild ett ögonblick.

### 5 · Förståelsedjupet — den parkerade frågan är den största

Du parkerade den själv: taktik-flikarna är "svåra att förstå". Auditen bekräftar att det inte är ett taktik-problem utan ett mönster: kemi-linjer utan konsekvens, formationsval utan förklarad effekt, Bygg/Håll/Toppa utan synligt utfall, momentum utan spak (medvetet) — spelet har flera system som SYNS men inte LÄRS. Synlighetssprinten löste "finns det?"; nästa nivå är "förstår jag vad det gör åt mig?".

**Förslag: en "konsekvensrad"-konvention** — varje val-yta (formation, läge, taktik, mentorskap) får en rad i assistentens röst som säger vad valet gör i NÄSTA match: "5-3-2 mot deras 4-4-2: tryggare bakåt, färre kontringar." Det är inte tutorial, inte tooltip — det är MB som pratar, vilket spelet redan gör bäst av allt. En designrunda, stor spelupplevelse-vinst.

## III · VAD SOM INTE SKA RÖRAS

Lika viktigt. Dessa frestelser ska motstås:

- **Lägg inte till fler kortvarianter.** Två (sharp/round) + portal-ytan räcker — auditen hittade noll fall där en tredje behövts.
- **Inför inte mörkt läge / temaväxling.** Säsongstonaliteten ÄR temat. Ljus papper + mörk portal + mörk match är en dramaturgi, inte en setting.
- **Animera inte mer.** Beats, goal-flash och CTA-puls räcker. Spelets lugn är en feature.
- **Rör inte rösten.** Copy-poolerna ska breddas (repetitionsfynden) men tonen är klar. Ingen "förbättring" av den.

## IV · REKOMMENDERAD ORDNING

1. **Försoningskartans A-lista** (pågår — Code) — städa skarven
2. **B-besluten** (du/Opus, ett möte) — lås reglerna driften avslöjade
3. **Förbättring 2 + 3** (Tal & enheter, severity-skalan) — billiga, systemiska, skriv-bara
4. **Förbättring 1** (typografiska scenen) — en mock-runda från mig, sen komponent
5. **Förbättring 4** (illustrations-katalogen) — ett beslut + beställningslista
6. **Förbättring 5** (konsekvensraden) — egen designrunda när 1–4 satt sig

**Slutord:** Frågan var "är designen rätt?". Svaret efter 80 skärmar: ja — och den är dessutom *bevisat* rätt nu, vilket är mer än vi visste för en vecka sedan. Det som återstår är inte att designa om utan att designa FÄRDIGT: mellannivån, enheterna, severity-skalan, katalogen, förståelsen. Fem avgränsade investeringar, ingen av dem riskerar det som redan bär.

— Design-Claude (Fable), steg 3
