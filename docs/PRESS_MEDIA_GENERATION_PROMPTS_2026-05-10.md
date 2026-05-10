# PRESS/MEDIA — generation prompts

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** PROMPTS — körs av Jacob+Opus för att fylla library

Detta dokument innehåller 8 batch-prompts för att generera press/media-items. Varje prompt körs separat (i denna chatt eller annan Claude-instans), output reviewas av Jacob, och resulterande JSON committas i respektive `library/`-fil.

**Workflow per batch:**

1. Opus kör prompten i ny chatt-tur
2. Output: JSON-array enligt format
3. Jacob reviewar — ton, upprepningar, klumpiga formuleringar
4. Iterera om nödvändigt (max 2 rundor — annars är prompten fel, inte outputen)
5. Commit JSON till `src/domain/data/media/library/`

---

## Gemensam ton-anti-pattern-lista (gäller alla batchar)

Tonen är **Sture-Forsbacka-understatement** med parkerings-känsla. Anti-patterns att UNDVIKA:

- Superlativ ("fantastisk", "otrolig", "magisk", "episk")
- LLM-tvåslags-strukturer ("inte X, utan Y", "varken X eller Y")
- AI-uppstuderad reflektion ("vi måste lära oss att...", "det visar att...")
- Klyschor ("kämpa till slutet", "ge allt", "spelar med hjärtat")
- Övermotionerade känslor ("besvikelse", "glädje", "stolthet")
- Coach-tal-fraser ("vi måste fokusera", "vi tar match för match")
- Generisk sportkommentar ("ett tufft motstånd", "en avgörande match")

Anti-patterns som ÄR OK i begränsad dos (max 1 per item):

- "Det är så det är" (understatement)
- "Vi gör om det" (handlingsorienterad)
- "Bandy är inte rättvist" (klassisk)

Ton-mål:

- Konkreta bilder (parkeringen, klubblokalen, ismaskinen, åskådarna)
- Geografisk specificitet (orten, ortsnamn, regiontypiska detaljer)
- Lågmäld humor när det passar
- Tystnad mellan meningarna ("Det blev som det blev. Vi får träna mer.")

---

## BATCH 1 — Quotes: post_match_loss (30 items)

**Generation prompt:**

```
Du genererar press-citat för Bandy Manager, ett svenskt bandyspel med 12 fiktiva 
bruksklubbar (Forsbacka, Söderfors, Västanfors, Karlsborg, Målilla, Gagnef, 
Hälleforsnäs, Lesjöfors, Rögle, Slottsbron, Skutskär, Heros).

Tonen är Sture-Forsbacka-understatement: parkerings-känsla, konkreta bilder, 
inga superlativ, inga "inte X utan Y"-strukturer, inga klyschor.

Generera 30 citat för "post_match_loss" — coachen efter en förlust i grundserien.

Format: 1-2 meningar per citat. Använd mallvariabler:
- {motståndare} — motståndarklubbens shortName
- {nextOpponent} — nästa motståndarklubbens shortName
- {ourClub} — vår klubbs shortName

Exempel på rätt ton:
- "Det blev som det blev mot {motståndare}. Vi gör om det mot {nextOpponent}."
- "Bandy är inte rättvist. Vi får träna mer."
- "Det är så när {motståndare} har övertaget på frampositionen. Inget annat än så."
- "Tre poäng till dem. Sex matcher kvar för oss."
- "Vi var inte tillräckligt skarpa. Det syntes."

Skriv 30 nya citat. INGEN får upprepa meningsstruktur eller idé från en annan. 
Variera mellan kort/torrt och lite längre/reflexivt — men aldrig övermotionerat.
Variera vem som syftas på (vi, laget, försvaret, anfallet, killarna, gubbarna).

Returnera som JSON-array med exakt detta format:

[
  {
    "id": "quote_post_loss_001",
    "type": "quote",
    "tags": ["post_match_loss"],
    "attribution": { "name": "{coachName}", "role": "Coach" },
    "body": "..."
  },
  ...
]
```

---

## BATCH 2 — Quotes: post_match_win (30 items)

**Generation prompt:**

```
[Samma kontext och ton som BATCH 1.]

Generera 30 citat för "post_match_win" — coachen efter en vinst i grundserien.

Tonen får vara nöjd men ALDRIG triumferande. Bandy-Sverige firar inte mycket. 
Vinst kvitteras med saklig genomgång och blicken framåt.

Mallvariabler: {motståndare}, {nextOpponent}, {ourClub}

Exempel på rätt ton:
- "Vi gjorde det vi skulle mot {motståndare}. Hemma nästa helg."
- "Det satt där det skulle. Tre poäng."
- "Vi spelade som vi tränat. Ibland blir det så."
- "Killarna var där hela vägen. Vi tar med oss det till {nextOpponent}."
- "Bra hörnor avgjorde. Det märks att vi övat."

Skriv 30 nya. Inga upprepningar. Variera från kort/lakoniskt till lite längre.

Returnera JSON-array enligt format ovan, med id "quote_post_win_001", "quote_post_win_002", etc.
```

---

## BATCH 3 — Quotes: post_match_draw + close_loss + blowout (30 items)

**Generation prompt:**

```
[Samma kontext och ton som BATCH 1.]

Generera 30 citat fördelade på tre tags:

A) "post_match_draw" — 12 citat. Coachen efter en oavgjord match. 
   Tonen är "vi tog med oss en poäng" — inte upprörd, inte glad.
   Exempel: "En poäng från en bortamatch. Det är ingen katastrof."

B) "post_match_close_loss" — 10 citat. Coachen efter förlust med 1 mål.
   Tonen får vara lite mer frustrerad än vanlig förlust — vi var nära.
   Exempel: "Ett mål skiljde. Det är såna detaljer som avgör i längden."

C) "post_match_blowout_loss" — 8 citat. Coachen efter förlust 4+ mål.
   Tonen är torr, kort, accepterande. Inga ursäkter.
   Exempel: "Vi fick stryk. Det var fortjänat. Vi gör om det på onsdag."

Mallvariabler: {motståndare}, {nextOpponent}, {ourClub}, {scoreDiff}.

Returnera JSON-array. id-format: "quote_post_draw_001", "quote_post_close_loss_001", "quote_post_blowout_loss_001".
Alla i samma array, men med rätt tag-fält per item.
```

---

## BATCH 4 — Quotes: streaks + season_start/end (40 items)

**Generation prompt:**

```
[Samma kontext och ton som BATCH 1.]

Generera 40 citat fördelade på sju tags:

A) "crisis_streak" — 7 citat. Coachen efter 3 förluster i rad.
   Tonen: lite tyngre än vanlig förlust, men aldrig hopplös.
   Exempel: "Tre raka förluster. Vi måste prata om det. Sen tränar vi."

B) "success_streak_5" — 6 citat. Efter 5 vinster i rad.
   Tonen: nöjd men försiktig — vi vet att det vänder.
   Exempel: "Fem raka. Vi pratar inte om det förrän vi är på sex."

C) "success_streak_10" — 5 citat. Efter 10 vinster i rad.
   Tonen: erkänner det är ovanligt, men förblir grundad.
   Exempel: "Tio raka. Det är säsong man kommer ihåg om vi inte tappar nu."

D) "season_start" — 8 citat. Inför säsongens första match.
   Tonen: laddad utan att vara upphetsad. Ren förväntan.
   Exempel: "Första matchen. Det är så vi börjar varje år. Vi får se vad vi har."

E) "season_end_top3" — 5 citat. Efter säsongsslut, vi placerar topp 3.
   Tonen: stilla nöjdhet. Erkännande av jobbet.
   Exempel: "Topp tre. Det är vad vi siktade på i augusti. Killarna förtjänade det."

F) "season_end_mid" — 5 citat. Mittenplacering.
   Tonen: realistisk, inga ursäkter.
   Exempel: "Mitten av tabellen. Det stämmer med var vi är just nu. Vi bygger vidare."

G) "season_end_bottom" — 4 citat. Bottenplacering.
   Tonen: tung men inte krossad. Vi börjar om.
   Exempel: "Det blev tungt i år. Vi gör om upplägget i sommar."

Mallvariabler: {motståndare}, {ourClub}, {seasonNumber}.

Returnera JSON-array. id-format per tag: "quote_crisis_001", "quote_streak5_001", etc.
```

---

## BATCH 5 — Press releases: injuries (16 items)

**Generation prompt:**

```
[Samma kontext.]

Generera 16 pressreleases för skador. Format: officiellt, klubb-neutralt språk. 
Inte coach-citat — det är klubbens kommunikationsavdelning som skriver.

Längd: 2-3 meningar. Sakligt. Inget melodramatiskt.

A) "injury_minor" — 8 items. Spelare ute 1-2 veckor.
   Exempel: "{ourClub} meddelar att {playerName} dragit på sig en skada i 
   gårdagens match. Spelaren förväntas vara tillbaka inom två veckor."

B) "injury_major" — 8 items. Spelare ute 4+ veckor.
   Tonen: lite tyngre men fortfarande klubb-officiellt. Inga spekulationer.
   Exempel: "{ourClub} kan meddela att {playerName} är utesluten från spel 
   i minst sex veckor efter gårdagens skada. Klubben återkommer med 
   uppdaterad information om återgång."

Mallvariabler: {ourClub}, {playerName}, {playerLastName}.

Attribution: { "name": "{ourClub}", "role": "Klubbofficiellt meddelande" }

Returnera JSON-array. id-format: "press_injury_minor_001", "press_injury_major_001".
```

---

## BATCH 6 — Press releases: transfers + finals + seasons (43 items)

**Generation prompt:**

```
[Samma kontext.]

Generera 43 pressreleases fördelade på 9 tags. Officiellt klubbspråk, 2-4 meningar.

A) "transfer_arrival" — 6 items. Klubben presenterar nyförvärv.
   Exempel: "{ourClub} kan idag presentera {playerName} som ny spelare. 
   {playerLastName} kommer från {previousClub} och har skrivit på ett tvåårskontrakt."
   (Note: {previousClub} är ny mallvariabel — bekräfta i datakontrakt eller skip om inte stödd.)

B) "transfer_departure" — 6 items. Spelare lämnar.
   Tonen: respektfull avsked, kortare än arrival.
   Exempel: "{playerName} lämnar {ourClub} efter säsongens slut. Klubben tackar 
   för insatsen och önskar lycka till."

C) "pre_cup_final" — 4 items. Pressrelease inför cup-final.
   Exempel: "{ourClub} möter {motståndare} i cupfinalen på Sävstaås IP på söndag. 
   Klubben är fullbokad och resor är arrangerade."

D) "pre_sm_final" — 4 items. Pressrelease inför SM-final.
   Tonen: lite mer ceremoniell.
   Exempel: "{ourClub} har tagit sig till SM-finalen för första gången sedan {prevYear}. 
   Match spelas på Studenternas IP i Uppsala."
   (Note: {prevYear} är hjälpvariabel — kan skippas, ersätt med generiska formuleringar.)

E) "post_cup_win" — 4 items. Klubben vunnit cupen.
   Tonen: stilla stolthet, klubbformell.
   Exempel: "{ourClub} har vunnit Svenska Cupen efter {scoreH}-{scoreA} mot 
   {motståndare} på Sävstaås. Klubben tackar alla supportrar som gjorde resan."

F) "post_sm_win" — 4 items. Klubben vunnit SM.
   Tonen: ceremoniell men kontrollerad.
   
G) "season_start" — 5 items. Klubbens säsongspresentation.
   Saklig, beskriver truppen och målet för säsongen.
   
H) "season_end_top3" — 5 items. Toppplacering.
   Erkänner säsongen, blickar framåt.
   
I) "season_end_bottom" — 5 items. Bottenplacering.
   Saklig genomgång av vad som inte fungerade.

Mallvariabler: {ourClub}, {motståndare}, {playerName}, {playerLastName}, {seasonNumber}.

Attribution: { "name": "{ourClub}", "role": "Klubbofficiellt meddelande" } för alla.

Returnera JSON-array. id-prefix per tag.
```

---

## BATCH 7 — Interviews: pre_finals (16 items)

**Generation prompt:**

```
[Samma kontext.]

Generera 16 intervjuer i Q&A-format inför stora matcher. Format:
- 3-4 frågor per intervju
- Frågor är journalistens (Sportkrönikan, lokaltidningen)
- Svar är coachens i Sture-Forsbacka-tonen

A) "pre_cup_final" — 8 items. Intervju med coach inför cupfinal.
   Frågor exempel: "Hur har förberedelserna sett ut?", "Vad blir avgörande?", 
   "Är det specifika spelare ni laddat upp för?"
   Svar ska vara konkreta men inte avslöjande. Coach pratar om förberedelser 
   utan att gå in på taktik.

B) "pre_sm_final" — 8 items. Intervju med coach inför SM-final.
   Frågor får vara lite mer reflekterande. Coach tonar fortfarande ner.

Format för body-fältet:
"Q: Hur har förberedelserna sett ut?
A: Som vanligt. Vi har tränat det vi måste träna.

Q: Vad blir avgörande på söndag?
A: Att vi gör det vi tränat. Sen får vi se."

(Använd "\n\n" mellan Q/A-block i JSON-stringen.)

Mallvariabler: {motståndare}, {ourClub}, {coachName}.

Attribution: { "name": "{coachName}", "role": "Coach" } 
(Eftersom det är coachens svar som dominerar — Q-raderna är journalistens.)

Returnera JSON-array. id-prefix: "interview_pre_cup_001", "interview_pre_sm_001".
```

---

## BATCH 8 — Interviews: milestones + post_seasons (27 items)

**Generation prompt:**

```
[Samma kontext.]

Generera 27 intervjuer fördelade på 5 tags.

A) "milestone_goal_10" — 6 items. Intervju med spelare som nått 10 mål på säsongen.
   Tonen: ödmjuk, lågmäld. Spelaren tackar laget.
   Exempel-svar: "Det är killarna som ger mig pucken. Jag bara råkar vara där den 
   landar."
   Frågor: "Hur känns det med tio mål?", "Vad är hemligheten?"

B) "milestone_goal_20" — 6 items. 20 mål — sällsynt prestation.
   Tonen: erkänner att det är speciellt men tonas ned.

C) "season_end_top3" — 5 items. Coachen efter toppplacering.
   Reflexiv intervju, längre svar än grundserie-citaten.
   
D) "season_end_mid" — 5 items. Mittenplacering. Realistisk genomgång.

E) "season_end_bottom" — 5 items. Bottenplacering. Tung men inte kross.
   Coach pratar om vad som måste ändras till nästa säsong.

Format: 3-4 Q/A per intervju. \n\n mellan blocken.

Mallvariabler: {ourClub}, {playerName}, {coachName}, {seasonNumber}.

Attribution beror på intervjuad: spelare för milestones, coach för seasons.

Returnera JSON-array.
```

---

## Workflow för Jacob+Opus

**Per batch:**

1. Jacob säger "kör batch X"
2. Opus generera output i chatten (eller separata fil)
3. Jacob reviewar — markerar "behåll" / "ändra" / "släng" per item
4. Opus levererar slutgiltigt JSON-block
5. Jacob committar till `src/domain/data/media/library/...`-fil

**Total tid uppskattat:**

- Batch 1-4 (citat, 130 items): ~2-3h med review
- Batch 5-6 (pressreleases, 59 items): ~1.5h
- Batch 7-8 (intervjuer, 43 items): ~1.5h

**Total: ~5h fördelat över så många sessioner som behövs.**

Inte allt på en kväll. Batchvis över en vecka är rimligt.

---

## När detta är klart

`MEDIA_LIBRARY` är fullt populerat. Code kan implementera mediaService + UI-komponenter mot ett konkret library, inte mot stub-data. Picker-logiken har faktisk volym att välja från. End-to-end-tester kan skrivas mot riktiga items.

Sen är BATCH E redo för Code att bygga — ren implementation, inga produkt-frågor kvar.
