# DOM — FÖRUTSÄTTNINGSFASEN

**Datum:** 2026-08-24 · **Av:** Opus
**Beslut:** Jacob, 2026-08-24. Ny fas mellan säsongerna som sätter förutsättningarna, och som syns.

**Arbetskartan körd.** Fråga 1: `boardExpectation` är inte en instans — flera grundvärden är frusna vid generering. Fråga 3: en tioårig karriär spelas mot en klubbidentitet från säsong ett. Fråga 4: `U6` gav renommé möjlighet att falla; ingen frågade vad mer som borde röra sig. Fråga 5: `boardExpectation` läses av `computeSeasonVerdictRating`, `evaluateBoard`, `offerSelectionService` och nu `BoardMeetingScene` — fyra läsare av ett fält ingen skriver. Fråga 7: fasen är klar när en spelare kan säga vad som väntas av honom i år och varför.

---

## Vad som saknas i dag

`seasonEndProcessor` avslutar. `Sommaren` visar vad som hände. Nästa säsong börjar.

**Mellan de två finns ingen punkt där något sätts.** `boardExpectation` är samma som vid generering, klubbens kanoniska styrka likaså. Renommé rör sig, anläggningar byggs, truppen åldras — men det som avgör vad du bedöms mot står still.

Konsekvensen är den Jacob beskriver: spelaren känner att ingenting händer. Inte för att ingenting händer, utan för att det som händer aldrig omsätts i vad som begärs.

---

## Fasen — tre indata

### 1 · Vad du gjorde

Besluten från föregående säsong. `resolvedChoices` gör dem avläsbara för första gången, och `O19`-märkningen skiljer systemhändelser från vardagsval.

Det handlar inte om att belöna eller straffa. En klubb som sålt sin bästa spelare för att rädda kassan **kan inte begäras prestera som året innan**, och en styrelse som inte förstår det är inte trovärdig.

### 2 · Vad som blev av det

`SeasonSummary` bär redan allt: placering, `objectiveOutcome`, ekonomi, `championClubId`. Meritbufferten ger kredit för goda år.

### 3 · Världsbilden — det som är nytt

En bedömning av var klubben står **i förhållande till de elva andra**, inte i absoluta tal.

Detta är fasens enda verkliga nybygge, och det är också det som gör förväntan till något annat än en funktion av spelaren själv. En klubb som stått still medan rivalerna rustat har fått det svårare utan att ha gjort något fel — och en styrelse som ser det höjer inte kravet.

**Underlag som redan finns:** de andra klubbarnas renommé, deras truppstyrka, deras slutplaceringar, deras anläggningar. Ingenting behöver uppfinnas — det behöver läsas.

---

## Vad fasen sätter

**`boardExpectation`** blir dynamisk. Fem nivåer finns (`Survive` sedan i dag). Den kan stiga och den kan falla.

**Och det är svaret på Jacobs andra fråga:** en spelare som tar Heros till fjärde plats fyra år i rad ska inte bära `Survive` i evighet. Framgången ska höja ribban — det är belöningen och priset i samma rörelse.

**Styrelsens uppdrag** härleds ur samma bedömning i stället för att slumpas. Ett publikmål till en klubb som just tappat sin publik är inte ett krav, det är brus.

**Öppen fråga, Jacobs beslut:** ska fasen också röra klubbens kanoniska styrka? En klubb som byggt akademi och hall i åtta år *borde* vara starkare i ligan. Men det river `W012` och rör matchmotorns kalibrering, alltså `BEVARA`. **Min rekommendation: nej i V1.** Förväntan rör sig, verkligheten står still — och skillnaden mellan dem är hela spänningen.

---

## Vad spelaren ser

Fasen ligger i **Sommaren**, efter årsboken och före säsongsmålet.

Ordningen är avsiktlig: du ser vad som hände, sedan vad som väntas av dig, sedan väljer du ditt eget mål. `O3` blir ett svar på något i stället för en fråga i tomma luften.

**Formen: styrelsen talar.** Inte en mätare, inte en badge — ordföranden säger vad de begär och varför.

**Tre delar, i ordning:**

**Vad de såg.** En mening om föregående säsong, ur `SeasonSummary`. Inte en upprepning av årsboken — styrelsens läsning av den.

**Vad de vet om läget.** Världsbilden i en mening. *Lesjöfors har rustat. Två av klubbarna under er har bytt tränare.*

**Vad de begär.** Den nya förväntan, sagd rakt. Och när den ändrats — **varför**.

**Regeln:** förändras förväntan måste skälet stå med. En höjd ribba utan förklaring är godtycklig, och det var precis vad `H1` i Skutskär-auditen handlade om.

---

## Vad fasen inte är

**Inte en ny skärm.** Sommaren finns och är byggd med rätt temperaturkurva. Detta är en sektion i den.

**Inte ett beslut.** Spelaren svarar inte. Styrelsen säger vad som gäller; `O3` är där spelaren svarar.

**Inte en simulering av de andra klubbarna.** Världsbilden läser vad som redan hänt i ligan. Ingen ny AI, inga nya beslut åt någon annan.

**Inte fler mätare.** `boardPatience` har sin zon, renommé sin. Fasen ändrar vad de betyder, inte hur många de är.

---

## Vad som ska rapporteras innan något byggs

1. Vilka grundvärden är frusna vid generering? Fullständig lista — `boardExpectation` är sannolikt inte ensam.
2. Vad läser `boardExpectation` i dag? Fyra kända; finns fler?
3. Vad finns om de andra klubbarna som världsbilden kan läsa, per klubb och per säsong?
4. Var i `seasonEndProcessor` respektive Sommarens route hör fasen hemma tekniskt?
5. Kan `boardObjectiveService` härleda uppdrag ur en bedömning, eller är den byggd för slump?

**Ingen kod förrän listan finns.** Arbetskartans fråga 2: en dom på färre än hälften av populationen är fyra gissningar och en linje.

---

## Godkänd när

En spelare kan säga vad som väntas av honom i år, varför det ändrades sedan i fjol, och vad han själv tänker göra åt det.

I dag kan han bara säga det sista.
