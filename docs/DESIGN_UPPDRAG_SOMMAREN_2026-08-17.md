# DESIGN-UPPDRAG — SOMMAREN (SÄSONGSÖVERGÅNGEN)

**Datum:** 2026-08-17 · **Av:** Opus (chat) · **Till:** Design
**Bakgrund:** M-03 i tvåsäsongsauditen (68 matcher live mot `2539fb2`).

---

## Problemet

Det finns ingen övergång mellan säsonger. Spelaren trycker "Starta säsong 2027/28" i årsboken och nästa skärm är cupkvartsfinal — med nio beslut i kö och samma utbrändhet som i maj. Årsboken är en stark final; nästa klick är vecka 38 igen.

Observationen är GPT:s, gjord under ett spelat tvåsäsongssvep. Den kunde inte göras av kodläsning eller snapshots: varje skärm för sig är korrekt, det är sekvensen som saknar andhämtning.

**Ett åttasäsongssvep pågår mot samma frysta revision.** Det kommer passera övergången sex gånger till, och svarar då på en fråga den här briefen inte kan: känns det lika illa varje gång, eller värre för varje säsong när kön växer och utbrändheten aldrig återställs? Skillnaden mellan en saknad skärm och en ackumulerande skada avgör hur mycket steget behöver göra. **Vänta in det svaret innan du ritar färdigt** — men börja gärna tänka nu.

---

## Vad som är bestämt (text och regler, av Opus — rita mot det, skriv inte om det)

Steget heter **Sommaren**. Det ligger mellan årsboken och första tävlingsmatchen. Det är ingen meny — det är en skärm man passerar, och den ska gå att passera i två sekunder.

**En rad om vad sommaren gjorde med managern.** Varierar med utbrändhet vid säsongsslut, inte med resultat:

- Utvilad: *Du var på Gotland i tre veckor. Ingen ringde.*
- Något sliten: *Halva sommaren gick åt till att inte tänka på bandy. Det gick sådär.*
- Nära gränsen: *Du sov mycket. Det hjälpte lite.*

**Tre saker som hände medan managern var borta.** Faktiska händelser ur säsongsavslutet — en spelare som slutade, en som åldrades, en ungdom som flyttades upp. Alltid samma form:

*Medan du var borta: Berglund la av. Åberg fyllde 34. Nilsson kom upp från P19.*

Har inget hänt: *Ingenting hände. Isen låg och väntade.*

**Styrelsens nya krav**, med en rad över:

*Styrelsen har satt nya mål. De minns förra året, men de bryr sig mest om nästa.*

**Knappen namnger vad som kommer** — inte "Starta säsong", den trycktes just i årsboken:

*Cupen börjar. Kvartsfinal mot Skutskär.*

Matchtypen ska vara synlig, så spelaren vet att det inte är en vanlig omgång.

**Steget innehåller inga beslut.** Ingen träningsplanering, ingen värvningsmarknad. Poängen är inte att ge mer att göra — det är att göra rytmen sann. Kön på nio väntande beslut ligger kvar i portalen; det är en portalfråga.

---

## Vad som är din fråga

1. **Vikten.** Skärmen ligger mellan årsbokens ceremoni och portalens täthet. Hur mycket ska den väga? För tung och den blir en tredje ceremoni; för lätt och den läses inte alls. Det är den avvägningen jag inte kan göra utan att se den.

2. **De tre händelserna** — en rad eller tre? Formen ovan är skriven som en rad, men om tre separata rader ger dem rätt tyngd är det ditt anrop. Texten är densamma, uppställningen din.

3. **Styrelsekraven utan ceremoni.** `ArrivalScene` presenterar dem med ceremoni första säsongen — det är rätt där, en gång per karriär. Här ska de vara sakliga. Samma data, annat register. Återanvänd `BoardObjectivesList`, som redan har rätt siffror och enheter sedan sluttestet.

4. **Två sekunder som ändå väger något.** Ett steg som ska passeras snabbt men inte kännas överhoppningsbart. Det är den svåraste delen och den enda som kräver ögon.

---

## Förutsättningar

Bygg mot husets tokens. `SeasonSummaryScreen`s mästarvy är ceremonireferensen före, portalen är tätheten efter — Sommaren ska höra hemma mellan dem utan att imitera någon.

**Verifiera mot körande app**, inte bara källkod: `bandy-manager.vercel.app` är öppen och kräver ingen inloggning. Tre påståenden i del 1–3 var inaktuella mot produktion.

Utbrändhetens återhämtning är en mekanikfråga för Code, inte din — förslaget är hälften av avståndet ner till 30, aldrig under 30 om värdet låg över 60. En manager som körde sig i botten ska bära något in i nästa år.

---

## Leverans

Som tidigare: `Implementationsaudit-sommaren-YYYY-MM-DD.dc.html` plus egen synkfil, i `docs/incoming/`. Ingen ny svensk copy — texten ovan är färdig. Behövs en rad som inte finns: beskriv vad den ska göra, märk `[Opus]`.
