# SPEC_PORTAL_FAS_2_DRAMATURGI — Portalen som dramatisk yta

**Datum:** 2026-04-30
**Författare:** Opus
**Status:** Spec-klar för Code, iterativ
**Beräknad omfattning:** ~5-7 dagars Code-arbete, men levereras i 4 distinkta steg så Jacob kan stoppa eller pivota mellan stegen
**Beroende:** Portal-Fas-1 levererad. SituationCard finns. Card-bag-arkitekturen finns.

---

## VARFÖR DETTA BEHÖVS

Jacobs egen formulering efter playtest 2026-04-30: "Det kontextuella är borta. Det ser sjukt tråkigt ut."

Han har rätt. Jag har sett tre screenshots:

- **Screen 1** (Söderfors cup R1, omg 1, fresh start): SituationCard säger "En förstarundamatch i cupen väntar. Ett misstag och allt avgörs på en gång." NextMatchCard. Två secondary-cards (Tabell 11:e, Kassa 290 tkr). En minimal-rad. CTA. Slut. Totalt fyra korttyper på hela skärmen — och tre av dem är *databastal*.

- **Screen 2** (Söderfors cup-kvartsfinal): Mer information i SituationCard, mer detaljer i NextMatchCard (väder, formstreck, "Direktkvalificerade"-rad), Skadad-kort, Tabell, Kassa, en minimal-rad. Mer textur men fortfarande staplade rutor.

- **Screen 3** (Söderfors derbymatch, omg 1): SituationCard "Seriepremiär", nudge överst som funkar bra ("Sätt lineup för derbyt"). Klacken-citat. Tabell. Sen tomt.

**Diagnosen:** Portal är funktionellt korrekt men *dramaturgiskt platt*. Det berättar inte vad som händer, det listar bara vad som är. Spelaren öppnar appen och ser inte ett ögonblick — hen ser en spreadsheet.

**Roten i tre saker:**

1. **SituationCard säger samma sak varje runda.** "En förstarundamatch i cupen väntar." OK. Men jag som spelare — varför *spelar* det roll just nu? Vad har jag att göra med denna match annat än att klicka spela? Är detta en match jag *vill* vinna eller en match jag *måste* vinna? Vad händer om jag förlorar?

2. **Secondary cards är generiska mätare.** Tabell, Kassa, Skadad — i alla matcher, alla situationer. De svarar inte på frågan "vad är intressant idag som inte var intressant igår?". De är samma rader oavsett om vi spelar derby eller bortamatch mot bottenlaget.

3. **Inget "moments"-tänk.** Jacob sa det själv: "ett moment som första sak: 'Äntligen! Ispremiär. Cupen ska avgöras innan säsongen drar igång på allvar...'". Vi specade Scene-systemet för stora ögonblick (söndagsträning, SM-final). Men *vardagliga* ögonblick — säsongspremiär, första derbyt, första derbysegern, sista omgången, fönsterstängning — har inget hem. De skulle kunna leva som en *Portal-bandelse* (text överst i Portal som dyker upp en gång och sen försvinner), inte som en fullskärms-Scene.

**Och en sak till:** Jacob nämnde "14 events efter match" och oro för att spökomgångar är tillbaka. Det är en separat bug men relevant för känslan — om Portal också drunknar i events efter att event-overlayn körts klart får spelaren aldrig andas.

---

## VAD VI BYGGER (4 STEG)

Specen är bruten i fyra distinkta steg. Code levererar ett i taget. Jacob playtestar mellan stegen och säger fortsätt eller stopp.

### STEG 1 — Berättande SituationCard

Gör SituationCard **kontextuell och dramatisk**, inte beskrivande.

**Innan:** "En förstarundamatch i cupen väntar. Ett misstag och allt avgörs på en gång."

**Efter (exempel — varierar baserat på state):**

Cup R1 mot bottenlag, season opener:
> "Heros är 11:a i förra årets tabell. Ni borde vinna. Men cupens första runda har snubblat större lag — Forsbacka åkte ut här 2024."

Cup-kvartsfinal mot Forsbacka, derby:
> "Forsbacka. Ni mötte dem senast i april. Det slutade illa. Direktkval till semin om ni vinner."

Derbyrunda 1 (Söderfors mot Skutskär):
> "Upplandsderbyt. Sex år sedan ni vann hemma. Ässjan är slutsåld."

Bortamatch mot bottenlag, mitten av säsongen:
> "Lesjöfors står på 0 poäng efter 8 omgångar. Det här är poäng ni inte får tappa."

Sista omgången, kampen om en plats:
> "Slutspelsstrecket går mellan er och Skutskär. Vinner ni är ni säkra. Förlorar ni — då gäller målskillnad."

**Specifikation:** `getSituation(game)` byggs ut. Den returnerar redan `{label, body}`. Den ska nu också returnera relevanta fakta-fragment baserat på state, och bygga ihop en mening av 1-3 fragment.

**Fakta-fragment att överväga:**
- Motståndarens tabellplacering (förra säsongen om vi är i omg 1)
- Senaste mötet ("4-1 hemma", "förlust", "tre raka segrar mot dem")
- Rivalry-status (derby, "ni har inte vunnit hemma sedan...")
- Tabellkontext ("kampen om slutspel", "5p över strecket", "ledar­matchen")
- Säsongstid ("säsongspremiär", "halvtidsbarometer", "sista hemmamatchen")
- Skador i båda lagen ("er stjärna är skadad", "deras målvakt saknas")
- Form ("ni har vunnit fyra raka", "de har inte gjort mål på 200 minuter")
- Cup-stake ("vinst → kvartsfinal mot Söderfors", "förlust → cupen är klar")

Inte alla samtidigt. **Max 3 fragment per body**, valda baserat på vad som är mest dramatiskt just nu.

**Texton:** Bandysverige-ton. Korta meningar. Faktiska siffror. Understatement. Inga "spännande matcher väntar"-fraser. Aldrig adjektiv där siffra räcker.

**INNEHÅLLER:** Ny fil `situationFragments.ts` med fragment-byggare, varje en pure function `(game) => string | null`. `getSituation` orkestrerar dem.

---

### STEG 2 — Portal-bandelse (lättviktigt moment-system)

Bredvid SituationCard ska det finnas plats för **engångs-narrativa nedslag** som dyker upp en gång och försvinner. Inte fullskärms-Scene. Bara en *rad* eller ett *litet kort* som introducerar ett ögonblick.

**Skiljer sig från Scenes:**
- Lever inom Portal, bryter inte spel-loopen
- Kan ignoreras (klickas bort eller försvinner när man scrollar)
- Mycket kortare text (1-3 meningar, inte ett scenario)
- Triggas av samma typ av events som Scenes men för *mindre* ögonblick

**Exempel:**

Säsongspremiär (omg 1):
> "Ispremiär. Säsongen börjar nu — 22 omgångar, en cup, ett slutspel framför oss."

Första derby (innan derbymatch spelas första gången):
> "Era första derbyt. Klacken har förberett en koreografi — Ebbe har jobbat på den i veckor."

Första segern:
> "Första segern. Klubben minns inte hur det kändes."

Halvtidsmilstolpe (omg 11):
> "Halvtid. Ni står där ni gör. Resten av säsongen är er."

Transferfönster öppnar:
> "Fönstret öppet. Telefonen kan ringa nu."

Transferfönster stänger imorgon:
> "Sista dygnet. Vad ni inte gör nu får vänta till våren."

**Specifikation:**

Ny komponent `PortalBeat.tsx` som renderas mellan SituationCard och Primary card *när det finns en aktiv beat*. Liknar SituationCard visuellt men:

- Har en emoji eller ikon till vänster (`📅`, `🔥`, `📞`, `📰`)
- Lite mörkare bakgrund (markerar "händelse just nu")
- Liten "klicka bort"-knapp (×) i högerhörn

**Datafil:** `src/domain/data/portalBeats.ts` med beat-definitioner. Varje beat:
```typescript
{
  id: 'season_premiere',
  trigger: (game) => game.currentMatchday === 1 && game.currentSeason === 1,
  emoji: '📅',
  text: 'Ispremiär. Säsongen börjar nu — 22 omgångar, en cup, ett slutspel framför oss.',
  oncePerSeason: true,
}
```

**Service:** `portalBeatService.ts` som väljer aktiv beat baserat på game state och `game.shownBeats`-flagga (vad som visats redan).

**Initial bag — 6 beats för Steg 2:**
1. Säsongspremiär (omg 1)
2. Första derby (innan första derbymatch)
3. Första segern (efter första vinst)
4. Halvtid (omg 11)
5. Transferfönster öppnar (omg 5)
6. Transferfönster stänger (omg 14, en omgång innan deadline)

**Vad som SKA INTE göras:**
- Inga fullskärms-overlays
- Ingen blocking — beat kan alltid ignoreras
- Inga val i beat (det är inte interaktivt — bara informativt)

---

### STEG 3 — Kontextuella secondary cards

Idag är secondary cards generiska (Tabell, Kassa, Skadad). De byter inte beroende på vad som händer — Tabell visas alltid på samma sätt även när tabellen är ointressant (omg 1, alla på 0p).

**Vad vi vill:** Secondary cards som *säger något specifikt* baserat på state, inte bara visar siffror.

**Specifikation — utvidga befintliga secondary-cards med kontext-rader:**

**TabellSecondary** — visar idag "11:e · 0p · 0V 0O 0F". Ska visa:
- Omg 1: "11:e i fjol. 9 lag att jaga." (referens till förra säsongen om vi är i nystart)
- Omg 5: "11:e nu. Skutskär ovanför, 1p. Heros under, 0p." (närmaste konkurrenter)
- Omg 18: "Slutspelsstrecket: 4 lag, 3p mellanrum." (kampen om plats)

**KassaSecondary** — visar idag "290 tkr · +4 tkr/omg". Ska visa:
- Vid stark ekonomi: "Stark kassa. Plats för värvning." 
- Vid ansträngd ekonomi: "290 tkr. Räcker säsongen ut om ni inte värvar."
- Vid kris: "Kassa kritisk. Värvningsstopp tills vi reder ut."

**InjuryStatusSecondary** — visar idag "Ros · 2v kvar". Ska visa:
- Om enbart en spelare skadad: "Ros · 2v kvar. Ersätts av Lindgren."
- Om flera skador: "3 skadade. Bänken tunn för helgen."
- Om stjärna skadad: "Henriksson · 4v. Det här gör ont."

**Princip:** Texten på sekundärkortet är inte längre data-rad utan **kort kommentar**. Datat finns kvar (siffran är fortfarande där) men kompletteras med en kontextuell mening.

**Implementation:** Varje secondary-card-fil utökas med en `getContextLine(game)`-funktion som returnerar 0-1 raders kommentar baserat på state. Renderas under den huvudsakliga datapunkten i kortet.

---

### STEG 4 — Inbox-tryck (event-spam-fix)

Jacobs observation: "14 events efter match". Det är inte trasigt mekaniskt, men det är *för mycket på en gång*. Spelaren får en flod av meddelanden som alla känns lika viktiga.

**Diagnos:** Inboxen visar alla events från senaste omgång utan prioritering eller gruppering.

**Specifikation:**

`inboxService` får en `priority`-funktion. Events kategoriseras i tre nivåer:

1. **Kritiska** (visas alltid, fullt format): skador på startspelare, transferbud, patron-konflikt, presskonferens-fråga, journalisterelations-event
2. **Notiser** (visas kort, gruppbar): mindre skador, mindre transferaktivitet, andra klubbars resultat, allmänna uppdateringar  
3. **Bakgrund** (gömda som default, expanderbart): atmosfärs-events, klacken-noteringar, kafferum-fragment

I Portal: Inbox-tabben visar "3 kritiska + 11 övriga". Klick på "övriga" expanderar.

**Vad detta INTE gör:**
- Tar inte bort några events (allt finns kvar)
- Ändrar inte event-genereringen i bakgrunden
- Bara prioriterar och grupperar i UI

---

## ANTI-PATTERN — vad detta INTE är

Jag har sett risken att denna spec blir "lägg till mer information på Portal". Det är inte målet. Målet är att **göra Portal *meningsfull* genom att den berättar något specifikt om just denna runda**.

**Det betyder:**
- Inte fler kort. Helst färre.
- Inte mer data. Helst tydligare data.
- Inte mer pratighet. Helst skarpare meningar.

Om en runda är riktigt lugn (mitten av säsongen, ingenting speciellt händer) — då ska Portal kännas lugn. SituationCard kanske bara säger "Bortamatch mot Hälleforsnäs. Tabellmittenduell." och inget mer. Det är OK. Tystnad är också information.

---

## ARKITEKTURPRINCIPER

1. **Pure functions överallt.** Alla fragment-byggare, alla beat-triggers, alla context-line-builders är pure. Testbara isolerat.

2. **Inga nya kort-typer i Portal-bagen.** Vi utökar SituationCard, lägger till PortalBeat (egen sektion ovanför Primary), utökar befintliga secondary-cards. Ingen ny tier.

3. **State på SaveGame minimalt.** Bara `shownBeats: string[]` läggs till. Inget annat nytt state behövs.

4. **Ingen ny Scene-arkitektur.** Beats är *inte* scener. De är kort textfragment i Portal.

5. **Fall snyggt back.** Om ingen beat är aktiv — inget kort visas. Om SituationCard inte hittar fragment — fall tillbaka till generisk text. Aldrig kraschar, aldrig tomt.

---

## TESTER

Per steg:

**Steg 1:** Tester för varje fragment-byggare (3-5 game states var). Test att getSituation kombinerar fragment korrekt och inte producerar tomma strängar.

**Steg 2:** Tester för portalBeatService. Verifiera att beats triggas vid rätt state, att shownBeats-flaggan fungerar, att flera kandidat-beats prioriteras deterministiskt.

**Steg 3:** Tester för varje getContextLine-funktion. Verifiera fall där context inte appliceras.

**Steg 4:** Tester för inbox priority-funktion. Verifiera kategorisering med olika event-typer.

---

## VERIFIERINGSPROTOKOLL — VIKTIGT

Detta är en *upplevelsespec*, inte en *arkitektursprec*. Pixel-jämförelse räcker inte.

**Kravet är:**

Efter varje steg — Code öppnar webbläsaren och spelar:
1. Ny manager Söderfors (eller annan klubb)
2. Spela igenom omgång 1 (cup R1)
3. Spela genom omgång 2 (liga, derbyt)
4. Bifoga skärmdump av Portal vid varje av dessa tillfällen
5. Skriv 2-3 meningar om vad spelaren ser och om det känns kontextuellt eller tomt

**Inga kod-verifierade simuleringar** denna gång. Browser eller stopp.

---

## LEVERANSORDNING

1. **Steg 1** (SituationCard kontextuell) — 1-2 dagar. Levereras solo. Jacob playtestar.
2. **Steg 2** (PortalBeat) — 1-2 dagar. Levereras solo. Jacob playtestar.
3. **Steg 3** (Kontextuella secondary cards) — 1-2 dagar. Jacob playtestar.
4. **Steg 4** (Inbox-prioritering) — 1 dag. Jacob playtestar.

Mellan varje steg: stopp för Jacob att säga fortsätt, pivot, eller stopp.

---

## VAD OPUS ÅTAR SIG VID UPPFÖLJNING

När du återkommer (Jacob) — Opus skriver fragment-texterna och beat-texterna direkt i Opus-tur, inte via Code. Code lämnar tomma slots i datafilerna. Opus fyller dem efter playtest-iteration.

Det är samma metod som för klubbcitaten: Code bygger arkitekturen, Opus skriver tonen.

---

## ENDA SPECEN — KÖR DEN ITERATIVT

Jacob har bara en sprint kvar denna vecka. Specen är hela arbetet — men den körs **iterativt**, ett steg i taget. Code levererar steg 1, Jacob playtestar, säger fortsätt eller stopp. 

Slut.
