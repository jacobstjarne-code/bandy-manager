# MERITBUFFERT — förslag på magnituder (Code, 2026-08-23)

**Detta är ett förslag, inte en dom.** Jacobs order: "Föreslå magnituder, jag dömer." Byggt och committat (`142c615d`) eftersom mekanismen behövde finnas för att kunna köras om i acceptanstestet — men koefficienterna nedan är öppna för justering.

## Bakgrund

O5-acceptanstestet (`O5_ACCEPTANSTEST_8SASONGER_2026-08-23.md`) fann 35% avskedsfrekvens för Västanfors (ligans lättaste klubb) över åtta säsonger, inklusive ett seed (70014) som sparkades två säsonger efter tre raka SM-guld. Rotorsak: `computeBoardPatienceUpdate`s säsongsslutsterm straffar varje avvikelse från `boardExpectation`s ankare lika hårt oavsett vad klubben presterat innan — ingen "kredit" från tidigare framgång.

Jacobs ord: "Samma princip som streak-taket. Styrelsen har ett minne av vad du gjort, inte bara ett omdöme om senaste säsongen."

## Mekaniken

- Varje säsong där `delta >= 0` (mötte/överträffade boardExpectation): patiensen stiger med `delta` **precis som förut**, och samma `delta` bankas ALSO som kredit i en separat buffert (ingen avdrag från den direkta vinsten).
- Varje säsong där `delta < 0` (understeg): krediten förbrukas FÖRST — `absorbed = min(buffer, -delta)`, patiensen rör sig bara med `delta + absorbed` (mindre negativt, eller noll om krediten räckte helt).
- Bufferten har ett tak: `MERIT_BUFFER_CAP`.
- Scope: bara säsongsslutets positionsterm (`computeBoardPatienceUpdate`). Rör INTE den löpande omgångstermen eller förlustsvit-taket, som redan är separat kalibrerade och nyligen låsta (Grind 1-passet, samma dag).

## Föreslagen magnitud: MERIT_BUFFER_CAP = 20

**Räkneexempel som styrde valet** (ChallengeTop, ankare 4, slope above=2,5/below=4 — Västanfors register):

- En golden-säsong (plats 1, gap=3): delta = 2,5×3 = **+7,5** kredit.
- Tre raka golden-säsonger: 7,5×3 = 22,5 → kapas vid 20 om taket är 20.
- En riktig kris-säsong (plats 8, gap=−4): delta = 4×−4 = **−16**.

Med tak 20: tre guld i rad bankar precis nog kredit för att en efterföljande 8:e-plats-säsong ska bli HELT absorberad (20−16=4 kvar), patiensen orörd den säsongen. Det matchar exakt seed 70014-scenariot som utlöste ordern — se testet i `boardService.test.ts`.

**Varför inte lägre (t.ex. 10-12)?** Skulle bara delvis absorbera en enskild kris-säsong (10 av 16), vilket fortfarande låter en klubb med lysande historik ta nästan full smäll av en enda svacka — löser inte det observerade felet.

**Varför inte högre (t.ex. 30-40)?** Skulle börja skydda mot FLERA på varandra följande dåliga säsonger, inte bara en enskild svacka efter framgång — risk att göra avsked praktiskt taget omöjligt för en tidigare framgångsrik klubb, vilket är en annan, starkare gräns än vad ordern bad om ("en normal svacka", inte "hur många dåliga säsonger som helst").

**"Två-tre säsongers minne":** för ChallengeTop-registret motsvarar tak 20 ungefär 2,5 typiska golden-säsonger (7,5 var) eller täcker en till två typiska (inte extrema) svackor (delta −4 till −8). Ordningen håller ungefär, men är inte exakt skalad per `ClubExpectation` — samma tak används för alla fyra nivåer trots att slopes skiljer sig (AvoidBottom above=2/below=4, WinLeague above=0/below=5 etc). En mer exakt version skulle skala taket per nivå — flaggat, inte byggt, om Jacob vill ha det finkalibrerat.

## Alternativ som INTE valdes

- **Banka bara en FRAKTION av delta** (t.ex. 50%), så goda säsonger belönas mindre direkt men bygger buffert snabbare relativt sett. Avvisat: adderar en ny fri parameter utan att lösa något extra — full delta + tak gör samma jobb enklare.
- **Skala taket per ClubExpectation** (fyra olika tak istf ett gemensamt). Mer korrekt men mer att döma på en gång — flaggat ovan, inte byggt i detta pass.
- **Förbruka bufferten även mot den löpande förlustsvits-termen.** Avvisat — den har redan sitt eget, nyligen låsta tak (fem omgångar), att blanda in bufferten där hade krävt att omkalibrera BÅDA samtidigt utan separat mätning av vardera effekt.
