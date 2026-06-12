# SKRIVGUIDE — Bandy Manager

**Datum:** 2026-05-10
**Författare:** Opus efter feedback från Jacob
**Status:** AUKTORITATIV — referens för alla framtida text-genereringar i Bandy Manager

---

## Varför denna fil finns

Tonen i Bandy Manager — Sture-Forsbacka-understatement, parkerings-känsla, bandy-Sverige — tog Jacob ~300 iterationer att hitta. Den är inte intuitiv för en LLM: standard-utfallet är generisk sportkommentar, AI-uppstuderad reflektion, dubbla-meningars-rytm, klyschor.

Den här filen samlar de regler och konkreta exempel som behövs för att skriva i tonen utan att regrediera. Läs den FÖRE varje skriv-batch. Återgå till den när tveksam.

Misstag jag gjort som denna fil ska förhindra:
- **Använt "puck"** i ett bandy-spel. Bandy spelas med boll. Puck är ishockey.
- **30/30 dubbel-meningar** (Mening1. Mening2.) — AI-pattern.
- **Klyschor** ("inget att skylla på", "på det som räknades", "ge allt").
- **Skrivit "platser"** istället för "positioner".

---

## DEL 1 — Bandy-vokabulär

### Använd ALLTID

| Korrekt | Inte |
|---|---|
| **boll** / "bollen" | puck (ishockey!) |
| **bandyplan** | rink, plan, hall (ishockey/innebandy) |
| **isen** (som plats) | "rinken" |
| **halvlek** / "andra halvlek" / "45 minuter" | "period", "tredje period" |
| **positioner** | platser |
| **frampositionen** / "anfallarna" / "forwards" | "anfallet" som geografi |
| **mittfältet** | center |
| **vänsterkanten** / "högerkanten" | left wing / right wing |
| **linjerna** (formation) | "leden" |
| **hörnan** / "hörnor" | corners |
| **frislag** | free kick |
| **straffområdet** / "straffen" | penalty box |
| **domarna** | refs |
| **läktaren** | bänken (förvirring) |
| **klubbhuset** / "kafferummet" / "omklädningsrummet" | "lockerroom" |
| **omgång** / "omgångar" | round |
| **bandyåret** / "bandyhösten" / "bandysverige" | (egna koncept) |
| **bandycup** / "Svenska Cupen" | "cup" generiskt |
| **slutspel** | playoffs |
| **strecket** (nedflyttning) | relegation |
| **botbänken** (utvisning) | "in på utvisning" |
| **avstängning** | suspension |
| **comeback** / "tillbaka" | return |

### Specifika arenor (verifierade i kodbasen)

- **Sävstaås IP** — Bollnäs, cup-finalhelgen
- **Studenternas IP** — Uppsala, SM-final
- Klubbarnas hemmaarenor — verifiera i `clubExtendedInfo.ts` per klubb

### Klubbarna (alla 12)

Forsbacka, Söderfors, Västanfors, Karlsborg, Målilla, Gagnef, Hälleforsnäs, Lesjöfors, Rögle, Slottsbron, Skutskär, Heros.

**Använd INTE:** Sandviken, Edsbyn, Vänersborg, Bollnäs (klubb), AIK, Hammarby, Villa. Det är riktiga klubbar — finns inte i spelet.

### Verifieringsregel

Innan du använder ett ord, fråga: "skulle någon säga detta i en svensk bandy-klubblokal?". Om du är osäker — sök i kodbasen efter ordet. Om det inte finns i existerande strängar är risken hög att det är fel.

---

## DEL 2 — Sture-Forsbacka-tonen (positiva regler)

### Konkreta detaljer från småstadsverkligheten

Vardagsbilder förankrar tonen. Använd:
- **Konsum** (lokal affär)
- **Kafferummet** (klubbens sociala plats)
- **Klubbhuset** / "klubblokalen"
- **Bussresan hem**
- **Tränings­snöret** / **isen i veckan**
- **Halva byn** (kollektiv-bandysverige)
- **Hängande blickar** / **tystnad**
- **Bygden** (vid Forsbacka-typ klubbar)
- **Frosten på mornarna**

### Personer med namn — inte abstrakta roller

Bra: "Sture log på Konsum igår." / "Bengt höjde pokalen." / "Magnus jobbar med dem som behöver formjustering."

Mindre bra: "Coachen sa." / "Spelarna ler." / "Ledningen agerar."

Använd förnamn när det är personligt. Roller när det är officiellt.

### Tystnad och underdrift

- "Vi får se."
- "Det blev vad det blev."
- "Det är så det är."
- "Inget mer än så."
- "Det är cupen."
- "Det räcker inte alltid."
- "Något måste lossna."

Dessa är inte klyschor — de är **tonens grundbultar**. Använd försiktigt och bara där de bärs av kontexten.

### Geografisk/social specificitet

Bra: "Det blåser snålt över bandyplanerna i östra Sverige." / "Halva byn vet redan vad de hoppas på." / "Tystnaden i kafferummet säger sitt."

Det är detaljer som säger PLATS. Inte abstrakt sport.

### Cyklisk filosofi

Bandyns rytm är förskriven (oktober-mars). Tonen reflekterar det:
- "Det är så cupen brukar vara."
- "Bandyåret börjar nu."
- "En match är en match. En säsong är något annat."
- "Mer än vi tror, mindre än vi ville."

### Metaforer som inte är klyschor

Bra (verifierade i kodbasen):
- "Strecket har gnagt sig nära."
- "Gått sönder någonstans i höst."
- "Tystnaden säger sitt."
- "Tre poäng i gåva." (Jacobs feedback)
- "Räknar dagar nu."

Skriv inte nya metaforer som låter "påhittade". Om en metafor inte känns självklar — använd den inte.

---

## DEL 3 — Anti-patterns (vad du ALDRIG gör)

### Förbjudet

- **Superlativ:** "fantastisk", "otrolig", "magisk", "episk", "övertygande" (i många kontexter)
- **"inte X utan Y"-strukturer:** "Det var inte taktik utan vilja." (max 1 per längre text)
- **AI-uppstuderad reflexion:** "Vi måste lära oss att...", "Det visar att...", "Det här lär oss att..."
- **Klyschor:** "ge allt", "spela med hjärtat", "kämpa till slutet", "tro på oss själva", "bygga vidare", "fokus", "ta match för match"
- **Generisk sportkommentar:** "tufft motstånd", "avgörande match", "jämn match", "spännande matchsekvens"
- **Övermotionerade känslor:** "besvikelse", "glädje", "stolthet" (rakt utskrivna — visa istället)
- **Coach-tal-fraser:** "vi måste fokusera", "vi tar en match i taget", "matchen vinner sig själv"
- **"Varma" slut-floskler:** "Vi reser oss starkare", "Hela laget var med på resan"

### Var försiktig med

- **"vinst", "förlust"** i ren form — ofta bättre att visa: "tre poäng till oss", "tre poäng till dem"
- **"motivation", "inspiration"** — sällan rätt ton
- **Frågor som föregivet retoriska:** "Vad lärde vi oss?" Använd bara om du följer upp med Sture-svar ("Mer än vi tror, mindre än vi ville.")

### Punktlistans 1 per text-regel

Vissa anti-patterns kan användas EN gång per längre text om de bär — men aldrig som default. T.ex. "inte X, utan Y" finns naturligt i svenska men är AI-pattern om upprepat.

---

## DEL 4 — Rytm-variation (kritisk)

### Anti-pattern: Mening1. Mening2.

LLM:s default är två-meningars-staccato. Det är inte hur människor pratar i bandy-Sverige. Variera:

**Hela meningar med komma:**
"Vi tappade strukturen efter pausen och {motståndare} märkte det direkt."
"Bandy är inte rättvist, vi får träna mer."

**Tankestreck för paus:**
"Vi tappade strukturen efter pausen — {motståndare} märkte det direkt."
"Cupen är cupen — inget mer, inget mindre."

**Tre korta i rad (sparsamt):**
"Sex grader, vind från norr, en grötig match."
"Räknar dagar nu. En kvar. Hoppas."

**En kort mening ensam:**
"Vi får se."
"Inget att gnälla över."

**Förekomst i Mening1.Mening2 är OK om båda är riktigt korta:**
"Tre poäng till dem. Sex matcher kvar för oss."
"Inte vår kväll. Bussresan hem blir tyst."

### Fördelnings-regel

I en samling om 30 citat:
- ~40% helmeningar (komma/tankestreck/och)
- ~30% två korta meningar
- ~15% en ensam mening
- ~10% tre eller fler led
- ~5% experimentell rytm

Aldrig 100% av en typ. Variation är det som visar att tonen är skriven, inte genererad.

---

## DEL 5 — Test-frågor innan du skickar in

För varje text-batch, gå igenom:

1. **Bandy-test:** Använder jag rätt vokabulär? (boll, inte puck. positioner, inte platser.)
2. **Sture-test:** Skulle någon på Konsum i bygden säga detta? Eller är det generic AI?
3. **Klyscha-test:** Innehåller texten någon av de förbjudna fraserna i Del 3?
4. **Rytm-test:** Är det 100% Mening1.Mening2? Då är det fel.
5. **Konkretion-test:** Finns det specifika detaljer (kafferummet, bussresan, halva byn), eller bara abstrakt sport?
6. **Variation-test:** Upprepas samma meningsstruktur över flera item?

Hittar du något fel — skriv om innan du levererar.

---

## DEL 6 — Konkreta exempel från kodbasen (gold standard)

### Pre-match-context (från `preMatchContextStrings.ts`)

```
{rivalry}. Ingen behöver förklara vad det betyder.
{nword} på rad. Sture log på Konsum igår.
{nword} förluster på rad. Tystnaden i kafferummet säger sitt.
Strecket har gnagt sig nära.
{opp} har gått sönder någonstans i höst.
Ingen har tagit poäng på deras is i år.
```

### Skadetexter (från `squadNuStrings.ts`)

```
Sista dagen på bänken.
Räknar dagar nu. En kvar.
Sjukvården nickar.
Sjukgymnasten säger {days} dagar till.
```

### Anslag (från `cupAnslag.ts`)

```
Bandyårets första riktiga avläsning.
Just nu vet ingen mer än alla andra. Det kommer att ändras snart.
Det är cupen. Inget mer, inget mindre.
Mer än vi tror, mindre än vi ville.
Det är inte SM. Men ingen här tror något annat heller.
```

### Coach-citat (från `assistantCoachService.ts`, calm-personligheten)

```
Det där var ingen bra dag. Vi tittar på det.
Ingen idé att hänga läpp. Nästa match kommer.
Vi ska förstå vad som gick fel. Sen går vi vidare.
En poäng. Det är vad det var idag.
```

Studera dessa innan du skriver nytt.

---

## DEL 7 — Lärdomar (uppdateras över tid)

### #1 — Puck är ishockey, boll är bandy (2026-05-10)

Egregious miss i en BATCH 1-generation. Hade fångats med 30 sekunders research i kodbasen. Nu standard-test: använda termer ska existera i kodbasens befintliga strängar, eller verifieras explicit.

### #2 — 30/30 dubbel-meningar är AI-pattern (2026-05-10)

LLM:ens default är två-meningars-staccato. Människor pratar i blandad rytm. Skriv aldrig en samling där alla items har samma rytm. Den första generationen ska planera variations-fördelning före skrivning, inte efter.

### #3 — "platser" → "positioner" (2026-05-10)

Bandyspecifik vokabulär: spelare har positioner, inte platser. Generic-engelska "be in position" → "vara på sin position".

### #4 — Klyschor som "inget att skylla på", "på det som räknades" är generic sportkommentar (2026-05-10)

Generisk fyllnad som inte säger något. Klipp utan att ersätta — texten blir tightare.

### #5 — "Frampositionen" är inte etablerad bandysvenska (2026-05-10)

Uppfunnit ord från generic sport-intuition. Sökt i kodbasen efteråt: "offensiv" finns i flera anslag och beskrivningar, "frampositionen" finns inte alls. Använd "offensiven" eller "anfallet" istället.

### #6 — Generation utan föregående research blir sämre, inte bara annorlunda (2026-05-10)

Batch 1 av media-citaten skrevs utan att jag öppnat existerande anslag/strängar i kodbasen först. Resultat: 30/30 dubbel-meningar, klyschor ("inget att skylla på"), fel vokabulär ("puck", "platser"), generic sport-tonal. Anti-pattern-listor i prompten räckte inte — de är abstrakta.

**Ny rutin:**
1. Innan varje skriv-batch: läs denna fil + relevant tonexempel-fil i kodbasen (`cupAnslag.ts`, `preMatchContextStrings.ts`, `squadNuStrings.ts`, `assistantCoachService.ts`).
2. Generera ETT testitem först, stresstesta mot guidelinen, få feedback.
3. Sen kör hela batchen.

Memory om att tonen finns ≠ färdighet att skriva i den. Konkreta exempel ger färdigheten.

### #7 — Pre-flight-checklistan blir mekanisk om generation inte är aktiv (2026-05-10)

Batch 3 levererad med dubbel-mönster ("X men Y", "X fast Y") trots att Lärdom #6 + checklistan användes. Diagnos:

1. **Pre-flight blev rituell.** Att bocka av "läst guidelines" garanterar inte att reglerna är aktiva under generation. De måste appliceras per citat, inte bara läsas i förväg.
2. **Volym tar över kvalitet.** 30 citat åt gången är för mycket. Per-citat-fokus försvinner i flödet. **Ny regel: max 10 citat per generation-block.**
3. **Tidigare batchar saknades som referens.** Pre-flight-checklistan listade kodbasens filer men inte tidigare BATCHAR i samma session. Den närmaste tonexempel-filen för batch 2 är batch 1 (`post_match_loss.json`), inte `cupAnslag.ts`.
4. **Generation är reflexiv, granskning är aktiv.** "X men Y" är LLM:s default sätt att skapa nyans. Att bara veta att det är förbjudet stoppar inte reflexen — varje citat måste explicit testas mot anti-pattern-listan innan det accepteras.

**Ny rutin (ersätter #6's punkt 2):**
1. Generera **max 10 citat per block**.
2. Per citat innan acceptans: kör anti-pattern-test ("X men Y"? "X fast Y"? "X dock Y"? "X däremot Y"? Klyscha? Duplikat med tidigare batch?). Skriv om innan nästa.
3. Inkludera tidigare batchar i samma session som primär tonexempel.
4. Varje generation-block ska kunna stå för sig självt — ingen "jag fixar det i revidering".

**Anti-pattern-test (per citat):**
- Innehåller det "X men Y" eller "X fast Y" där X och Y är kontrast-konstruerade? → skriv om
- Innehåller det superlativ, klyschor, generic sport-fraser? → skriv om
- Är det duplikat med tidigare citat i samma library? → skriv om
- Skulle Sture säga det? → om tveksamt, skriv om

---

### #8 — Tvåpoängssystemet + "dela på poängen" (2026-06-11, Jacobs beslut)

Spelet använder bandyns 2-poängssystem (vinst 2, oavgjort 1, förlust 0) sedan 2026-05-25. ALL text som nämner poängsumma för seger skriver "två poäng" — aldrig "tre poäng" (fotbollsreflex). "En poäng när vi behövde två", inte "behövde tre".

Godkänd trop: **"dela på poängen"** — äkta bandyspråk eftersom oavgjort ger en poäng var ("delade poäng", "poängdelning", "en delad pott"). Använd gärna för kryss — den bär både fakta och ton.

### #9 — Poolsträngar får inte hitta på fakta (2026-06-11, textauditen)

En sträng i en slumpad pool får bara hävda det som (a) triggern garanterar, eller (b) interpoleras ur data via token. Allt annat är påhittad fakta som förr eller senare motsäger skärmen bredvid.

Felexempel ur auditen: "Sju–ett. Inget mer behöver sägas" (resultatet var något annat) · "Hörde du om Henriksson?" (sålda spelaren hette annat) · "Silvret sitter i" (B-state = måluppfyllelse, inte silver) · "Tjugotvå år. Hela sin karriär här" (spelarens karriär okänd) · "Tre raka utan poäng" (flaggan vet bara ≥1).

Testet per sträng: *kan detta vara falskt i något save där poolen triggas?* Om ja — generalisera, eller begär en token. Specificitet är värdefull ("konkret bild"-regeln står fast) — men den ska vara UPPDIKTAD VARDAG (altanen, termosen, Konsum) eller DATABACKAD ({score}, {lastName}, {totalGoals}), aldrig påhittad spelfakta.

## När den här filen uppdateras

- Vid varje feedback-runda från Jacob där han pekar ut nytt mönster
- Vid varje skrivuppgift där jag märker att jag drev mot AI-utfall trots intentions
- Vid kodbas-research som avslöjar nytt vokabulär eller ton-mönster

Versionera med datum-rad i Lärdomar-sektionen.

## Pre-flight-checklista (kopiera till tankesektion innan varje skriv-batch)

```
[ ] Läst WRITING_GUIDELINES_BANDY_MANAGER.md i sin helhet
[ ] Öppnat och läst minst en relevant tonexempel-fil i kodbasen:
    [ ] cupAnslag.ts (för anslag/modal-text)
    [ ] preMatchContextStrings.ts (för korta tagline-stil text)
    [ ] squadNuStrings.ts (för spelare-status, konkretion)
    [ ] assistantCoachService.ts (för coach-citat — OBS jovial-personligheten har klyschor, undvik)
[ ] Öppnat och läst tidigare BATCHAR i samma session (primär tonexempel)
    [ ] post_match_loss.json (om finns)
    [ ] post_match_win.json (om finns)
    [ ] etc — alla tidigare committade library-filer
[ ] Verifierat alla bandy-specifika ord mot kodbasen
[ ] Planerat rytm-fördelning före skrivning (~40% helmeningar, ~30% två korta, ~15% en ensam, ~10% tre led, ~5% experimentell)
[ ] Begränsa till MAX 10 citat per generation-block
```

## Per-citat-test (kör innan varje citat accepteras)

```
[ ] Inga "X men Y" / "X fast Y" / "X dock Y" / "X däremot Y" där det är AI-kontrast
[ ] Inga superlativ
[ ] Inga klyschor från Del 3
[ ] Inga duplikat med tidigare citat i samma library
[ ] Korrekt bandy-vokabulär (boll inte puck, positioner inte platser)
[ ] Sture-test: skulle någon säga detta i en svensk bandy-klubblokal?
```
