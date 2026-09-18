# TEXTLEVERANS — bred textgranskning A1–A4 (Opus 2026-09-16)

Svarar mot Codex breda textgranskning (pinne `fa9407eb`). A1–A4 är sanningskandidater med färdig text/villkor. A5 (klubbminnet tappar motståndare) är utred-först, inte text — lämnas åt Code. B-kandidaterna döms sist.

**Först en rättelse av mitt eget förra pass:** is-hallen ("isen ligger året om nu", facilityPortalBeats.ts:65) — DRA TILLBAKA min tidigare ändring. Codex har rätt: matchhallen ger faktiskt året-runt-is (`facilityNodes.ts:91-100`), en konstfrusen utomhusplan gör det inte. Den ursprungliga texten var sann; min "rättelse" införde ett fel. Rör inte raden. Endast `stillnessText.ts:28` (naturis) står kvar av is-fynden.

---

## A1 — cup_done efter tidigt uttåg (kodverifierat, hög)

`anslagService.ts:156` väljer `cup_done` redan efter kvartsfinalomgången för ett lag utslaget i runda 1. Alla tre varianter antar mer än tillståndet garanterar. Se separat leverans `TEXTLEVERANS_SANNINGSFEL_TON_2026-09-15.md` §Sanningsfel 1 — de tre ur-varianterna där gäller. Kompletterande krav ur Codex granskning: **varje variant måste vara sann från runda 1 till en förlorad final.** Mina tre ur-varianter uppfyller det (de talar bara om VÅR cup, aldrig antal spelade matcher eller turneringens öde). Bekräftat: ingen av dem säger "några matcher blev det" (kan vara noll efter walkover) eller "cupen är avgjord". **Ny punkt från Codex:** granska övergången `cup_done → league_start` så två stora anslag inte säger samma sak. Code: om `league_start` visas samma eller nästa dag som `cup_done`, visa bara ett. Min dom: `cup_done` (vår cup slut) och `league_start` (serien börjar) bär olika budskap och får samвisas, MEN cup_done-varianterna får inte sluta på "serien väntar/börjar" om league_start kommer direkt efter — det blir dubbelt. Kortare cup_done-slut om league_start följer: byt sista meningen till en ren punkt om vår cup, inget om serien. Code exponerar om league_start är nära; jag skriver den kortade varianten om så.

## A2 — konstis som naturis (kodverifierat, hög)

`stillnessText.ts:28`: "Isen lade sig i natt." Konstis är grundvillkor (`facilityNodes.ts:3`). Se `TEXTLEVERANS_SANNINGSFEL_TON_2026-09-15.md` §Sanningsfel 2 — ersättningen `Isen är nyspolad i natt. Det luktar skrapa och kyla vid vallen.` gäller. Bekräftat mot Codex: behåller väderkänslan (cold-tagg, kyla), naturis-anspråket borta.

## A3 — Söderfors-vinjett antar resa (kodverifierat, medel)

`opponentVignetteText.ts:19`. Se `TEXTLEVERANS_SANNINGSFEL_TON_2026-09-15.md` §Sanningsfel 3 — ersättningen med "En bro bär in till byn" gäller (ortsbeskrivning, sann hemma och borta). Codex alternativ "Vägen till Ässjan" är också giltigt men min formulering behåller mer av originalets bild. Endera fungerar; jag står vid min.

## A4 — burnoutärret: fel årstid + falsk "första gång" (kodverifierat + save-belägg, hög) — NYTT, inte i tidigare leverans

`eventResolver.ts:~2940` skriver för varje `step_back`-ärr:
`'Den våren blev du kvar i klubben men klev tillbaka från bänken en period. Första gången du satte dig själv först. Det sätter sig, ett sånt beslut.'`

Två fel, båda bekräftade i koden:
1. **"Den våren"** — burnout-taket kan trigga matchdag 12–16, som i kalendern är december/januari. Fel årstid.
2. **"Första gången du satte dig själv först"** — dedupe-guarden (`alreadyScarred`) skyddar bara mot dubbel post INOM samma säsong. Över säsonger upprepas "första gången" vid varje step_back — save-provet har nio identiska poster 2026–2036.

**Lösning — två delar:**

**Del 1, neutral tidpunkt (gäller båda scar-varianterna).** Byt "Den våren" mot en tidsneutral formulering. För `stepped_back`:
`Den säsongen blev du kvar i klubben men klev tillbaka från bänken en period.`
För `hardened` (rad efter, samma fel-årstid-risk om den säger "våren" — verifiera; den säger "Den våren var du nära att gå sönder"):
`Den säsongen var du nära att gå sönder och körde vidare ändå. Något härdades, och gick inte att ta tillbaka.`

"Den säsongen" är sant oavsett månad.

**Del 2, "första gången" bara när det ÄR första gången (Code, villkor).** "Första gången du satte dig själv först" får bara stå om spelaren inte har ett tidigare `burnout_scar` av typ `stepped_back` i `managerProfile.diary`. Code: räkna tidigare stepped_back-ärr innan strängen väljs.

- Första stepped_back (inga tidigare stepped_back-ärr):
  `Den säsongen blev du kvar i klubben men klev tillbaka från bänken en period. Första gången du satte dig själv först. Det sätter sig, ett sånt beslut.`
- Senare stepped_back (minst ett tidigare):
  `Den säsongen klev du tillbaka från bänken igen, en period. Du vet vid det här laget vad det kostar och vad det ger.`

Den andra varianten erkänner upprepningen i stället för att förneka den — ett återfall som låter som ett återfall, inte ett falskt "första gång". Codex krav uppfyllt: "Varje människa ska kunna få olika eko vid återfall utan ny berättelseklass" — samma diary-typ (`burnout_scar`), bara två textvarianter gatade på historik.

Code: `hardened`-grenen behöver ingen "första gång"-gate (den säger inte "första gången"), bara "Den säsongen"-bytet.

---

## A5 — klubbminnet kan tappa motståndaren (UTRED FÖRST, inte text)

`clubMemoryService.ts:224` slår upp gammal fixture med DAGENS `managedClubId` och returnerar ordet "motståndet" när den inte finns — plausibelt efter klubbyte eller historikkomprimering. **Detta är inte en textfix.** Code: kontrollera de två liggarposternas frusna klubb/match-id och använd deras källidentitet, eller ett historiskt opponent-snapshot. "Koda inte om endast ordet" (Codex, korrekt — att byta ordet "motståndet" mot något annat döljer att uppslaget faktiskt misslyckas). Utred rotorsaken; om det kräver en textrad för det genuint okända fallet skriver jag den då, men först när Code vet varför uppslaget missar.

---

## B-kandidaterna — dom

**B1 matchgranskningens schablon** — GRIND-KANDIDAT + TEXT, men KRÄVER DATA. Redan dömd i `TEXTLEVERANS_SANNINGSFEL_TON_2026-09-15.md` (granska-referatet): Code exponerar matchens faktiska siffror, sen skriver jag mot dem. "En förlust att analysera" → "3–4, ledning i paus" osv. Eget pass, exponera → Opus skriver.

**B2 spelardagbokens mallslut ackumuleras** — TEXT, men Codex nyckelpoäng står: det är MESTADELS olika spelare, alltså inget dedupe-fel. Domen: skriv faktum + konkret detalj i stället för abstrakt sensmoral, men VARIERA INTE MASKINELLT. "En siffra att vara stolt över" → den faktiska siffran och något konkret. Kräver samma data-exponering som B1 (målskytt, motstånd). Eget pass med B1.

**B3 återkomst från skada 72 gånger** — UTRED FÖRST, inte text. Codex: "Döp inte 72 till 72 skrivbuggar." En spelare med sex "tillbaka efter skadan" på sex följande matchdagar är sannolikt en skade-loop i `playerStateProcessor.ts:130-142`, inte ett textfel. Code granskar skadekedjan först. Om återkomsterna är sanna men täta: "kroppen håller" blir en märklig säker utsaga — då stramar jag texten, men först efter att mekaniken är utredd.

**B4 fristående bisatser** — le+ transfer: leagueAnslag "Det blev en säsong. Som alla andra och inte heller det." är dömd STRAMA ÅT redan i förra leveransen (kräver säsongsdata). transferResponse "Som när man inte vill väcka otur" — jag dömde BEHÅLL i förra leveransen. Codex vill ha den rakare; jag står vid behåll, bilden bär. Om du (Jacob) vill ha den strammare säg till, annars står den.

**B5 tre personentréer** — BEHÅLL, en möjlig stramning på kommunen. Redan dömd i förra leveransen. Codex bekräftar min läsning: läs entréerna intill varandra på mobil, strama en bara om två har samma konstpaus tätt. Kommunen är kandidaten om någon.

**B6 legendarens matchkommentar** — LÅG PRIO, TEXT om data finns. "Som han alltid gjort" × 3 i närliggande pooler. Behåll en, byt de andra till konkret spelobservation "om kommentaren faktiskt bär data för det" (Codex, rätt villkor). Kräver att matchkommentaren har speldata i scope — om inte, behåll alla tre, en upprepning är bättre än en påhittad observation. Code verifierar om data finns; jag skriver om den gör.

---

## Leverans till Code

- **A2, A3:** raka ersättningar (i förra leveransen), gäller.
- **A1:** cup_done-varianterna (förra leveransen) + kortad sista mening om league_start är nära (Code exponerar).
- **A4:** "Den säsongen"-bytet (båda scar-varianterna) + "första gången"-gate på tidigare stepped_back-ärr. NYTT, färdig text ovan.
- **is-hallen:** DRA TILLBAKA min förra ändring, Codex avfärdade den korrekt.
- **A5, B3:** utred rotorsak först, ingen text förrän mekaniken är klar.
- **B1, B2, B6:** exponera data → Opus skriver, eget pass.
- **B4, B5:** dömda (behåll/strama), Jacob avgör kommun/transfer om han vill.
