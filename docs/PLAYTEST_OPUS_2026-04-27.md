# Playtest — Opus mentalt genomspel

**Datum:** 2026-04-27
**Genomförd av:** Opus
**Metod:** Läst kodbas (87 services, 23 screens, 14 dashboard-komponenter), tänkt igenom flödet som spelare från första session till säsong 3
**Status:** Inte spelat i app — analys baserad på kodbas + tidigare playtest-rapporter

---

## Sammanfattning

Spelet har ovanligt mycket atmosfärisk substans för en sport-manager. Bandysverige-tonen är genuin, klubbarna har själ, väder och plats spelar roll, klacken har personligheter. Det är the bomb-arbetet som lyser igenom.

Men spelet har ett **strukturproblem som riskerar att drunkna allt det fina**: dashboarden är en 8-sektioners-katedral. Daily briefing + next match + 2×2-grid + enraders-kort + playoff/cup-bracket + kafferummet + veckans beslut + pep-talk + CTA-knapp. För mycket på en gång.

Och **rytmen mellan omgångar är platt**. Annandagsbandy är en ljuspunkt nu efter Sprint 28, men resten av säsongen rinner ihop.

Tre quick wins, tre strukturella förbättringar, ett medvetet val att fundera över.

---

## TRE QUICK WINS (1-2 dagar Code per stycke)

### QW-1. Dashboarden behöver en visuell hierarki

Just nu har dashboarden 8+ sektioner staplade vertikalt med liknande visuell vikt:

1. Welcome/Nudge-agenda
2. NextMatchCard
3. DailyBriefing
4. 2×2 grid (Tabell, Senast, Orten, Ekonomi)
5. KlackCard (med citat)
6. Enraders-kort (Trupp, Cup/Slutspel, Akademi)
7. PlayoffBracketCard / CupCard
8. CTA-sektion (datum, kafferummet, veckans beslut, pep-talk, knapp)

En spelare som öppnar appen för 12:e gången har ingen aning om vad som är viktigt *just denna omgång*. Allt tävlar om uppmärksamheten med samma typografi.

**Fix:** Inför **"Veckans fokus"** — en logik som plockar ut 1-3 saker som faktiskt är värt att visa stort den här omgången, och nedtonar resten.

Exempel:
- Om derby imorgon → next match-kortet + kafferummet (med derby-quote) får full vikt, allt annat foldas ner
- Om en av spelarna tagit hat-trick förra omgången → spelaren upp i hero-stil med citat
- Om patron har akut krav → patron-kortet upp med actionknapp
- Om transferfönster stänger om 2 omgångar → det är veckans fokus
- Om inget speciellt händer → "Lugn omgång" med dämpad layout

Implementeras som ett `dashboardFocusService.ts` som returnerar `{ primary: FocusItem, secondary?: FocusItem }`. Allt annat går till en kollapsad "mer info"-sektion längre ner.

**Risk om vi inte fixar:** Spelaren tröttnar på dashboarden eftersom den känns "platt" — allt verkar lika viktigt = inget verkar viktigt.

---

### QW-2. NextMatchCard behöver känslomässig tagg

NextMatchCard visar för närvarande motståndare, datum, hemma/borta. Men säger inget om vad matchen *betyder*. Två exempel:

- Omgång 14 mot Hälleforsnäs: bara "Hälleforsnäs · Borta · 28 jan".
- SM-final mot Söderfors: också "Söderfors · Studenternas IP · 14 mar".

Båda får samma visuella behandling, men den ena är hela säsongen.

**Fix:** Lägg till en **stakes-tagg** högst upp i NextMatchCard som speglar matchens betydelse:

| Kontext | Tagg |
|---|---|
| Derby | 🔥 DERBY · {rivalryName} |
| Annandagsbandy | 🎄 ANNANDAGSBANDY |
| Cup-final | 🏆 CUP-FINAL · Sävstaås IP |
| SM-final | 🏆 SM-FINAL · Studenternas IP |
| Slutspel | ⚔️ KVARTSFINAL match {N} av {bestOf} |
| Bottenstrid (lag 9-12 mot lag 9-12) | ⚠️ BOTTENSTRID · 6p i potten |
| Toppmöte (lag 1-3 mot lag 1-3) | 🎯 TOPPMÖTE |
| Före-derby varning (derby nästa omgång) | (mindre tagg) "Derby väntar nästa vecka" |
| Default | (ingen tagg) |

Detta finns delvis i koden redan (`isFinaldag`, `isCupFinalhelgen`, `getRivalry`) — bara att exponera det som visuell hierarki.

**Risk om vi inte fixar:** Spelaren förstår inte att den nästa matchen är speciell. Säsongens dramaturgi blir platt eftersom alla matcher visuellt ser lika viktiga ut.

---

### QW-3. Granska-skärmen saknar "vad gör jag nu"-känsla

Granska har 5 tabs (Översikt, Spelare, Shotmap, Förlopp, Analys) som visar matchresultatet. Detta är välbyggt för retrospektion. Men:

- Det finns ingen tydlig **brygga** mellan "matchen är slut" och "nu blickar vi framåt"
- Spelaren landar i Granska, scrollar/tabbar, och behöver sedan navigera tillbaka till dashboarden manuellt för att gå vidare
- "Nästa omgång →"-knappen finns men är otydligt placerad

**Fix:** Sista tab i Granska blir **"Härnäst"** — en framåtblickande sammanfattning:

```
🏒 NÄSTA MATCH (Omgång 15)
Borta mot Söderfors · Tisdag 4 feb
Söderfors ligger 2:a i tabellen, ni är 5:a — toppmöte.
Förra mötet: Söderfors 4-2 Forsbacka (omg 3)

📋 INNAN MATCHEN
□ Sätt lineup (3 dagar kvar)
□ Förlängningar: Lindberg har 4 omg kvar på kontraktet
□ Akademin: Henriksson (P19) gjorde hat-trick — befordra?

🏃 KONDITION
3 spelare under 70% kondition. Behöver vila eller startspelarbyte.

[ Tillbaka till Dashboard → ]
```

Detta gör Granska till en *naturlig brygga* tillbaka in i spelet, inte en återvändsgränd.

**Risk om vi inte fixar:** Spelaren känner att det är "extra steg" mellan matcher istället för en kontinuerlig rytm. Onboarding-friktion för nya spelare.

---

## TRE STRUKTURELLA FÖRBÄTTRINGAR

### S-1. Säsongens dramaturgi behöver hög- och lågpunkter

Just nu kommer alla "stora" saker som diskreta event:
- Derby (5-6 ggr per säsong)
- Annandagsbandy (1 ggr)
- Cup-final (om man når dit)
- SM-final (om man når dit)
- Slutspelets seriestruktur (kvartsfinal → semi → final)

Mellan dessa flyter omgångarna ihop. Spelaren märker inte skillnad mellan omgång 7, 12 och 17 om inget speciellt händer.

**Fix:** Inför **"säsongs-akter" som har visuell signatur**, inte bara textmässig (som `seasonActService.ts` redan gör):

- **Akt 1 (R1-6) — Säsongsstart:** ljusare färgton, optimism, "allt är möjligt"
- **Akt 2 (R7-15) — Vinterns prövning:** mörkare bakgrund, mer dämpat, akcent på utvisningar/skador
- **Akt 3 (R16-22) — Lutning mot slutspelet:** stramare layout, fokus på tabellen
- **Akt 4 (slutspel) — Avgörandet:** helt annan estetik, dramatiskt

Detta finns *delvis* (akt-baserade briefings i daily briefing) men det syns inte visuellt. Spelet **känns** likadant från oktober till mars.

Implementation: en CSS-variabel `--act` som ändrar accent-färg, header-tonalitet och kanske animations-tempo. Det är inte en stor refactor — det är en designgest.

---

### S-2. Klubbutveckling över säsonger är osynlig

Spelet har djupa system för klubbutveckling (`facilityService`, `sponsorService`, `clubEraService`, `narrativeService`) men spelaren ser inte enkelt **hur klubben förändrats över tid**.

I säsong 3 har du:
- Värvat 5 spelare som blivit lag-stommen
- Renoverat omklädningsrummet
- Bytt patron en gång
- Sett 3 spelare gå i pension
- Klubbens reputation har gått från 35 till 58

Men det finns ingen **tidslinje** som visar detta.

**Fix:** Lägg till **"Klubbens resa"-vy** i ClubScreen — en horisontell tidslinje per säsong:

```
SÄSONG 1 (2026-27)         SÄSONG 2 (2027-28)         SÄSONG 3 (2028-29) [NU]
─────────────────────      ─────────────────────      ───────────────
8:a · 32 mål               5:a · 47 mål               3:a · 58 mål  ⬆
Patron: L. Berglund        Patron: L. Berglund        Patron: M. Sandberg
Reputation 35              Reputation 42              Reputation 58
                           ⚒ Omklädningsrum            🏆 Cup-semifinal
                                                      🎓 Henriksson upp från akademin
```

Detta använder data som **redan finns** i `narrativeService` och `clubLegends`. Behöver bara en presentationskomponent.

**Varför viktigt:** Det är *retention-feature för säsong 2+*. Det är vad som gör att en spelare som klarat säsong 1 vill spela säsong 3.

---

### S-3. Rosterns persongallerier är "spelare", inte "personer"

Vi har 100+ spelare med:
- Day jobs (lärare, vaktmästare, IT-konsult etc)
- Personality traits (`leader`, `veteran`, `hothead` etc)
- Scout reports
- Match-betyg
- Karriärstatistik
- `narrativeLog` med entries (akademin, pensionering, etc)

Men i SquadScreen ser de förmodligen ut som FM-style listor — namn, position, betyg, form.

**Den känslomässiga kopplingen till en specifik spelare är vad som gör att man fortsätter spela.** Det är när din egen Henriksson (17 år, akademiprodukt, brorsdag före derby) blir mer än siffror.

**Fix:** PlayerModal/PlayerCard ska ha en **"Människan"-sektion** med:
- Day job + arbetsplats ("Lärare på Forsbacka skola, åk 4-6")
- Tre senaste narrativeLog-entries i kronologisk ordning ("Debuterade mot Gagnef, oktober 2026" / "Första målet mot Lesjöfors, december 2026" / "Kapten januari 2027")
- Citat från klacken om det finns ("Klackens favorit sedan 2026")

Inte för varje spelare — bara för **klubblegender + akademiprospekt + spelare över 100 matcher i klubben**. De andra får standard-vy.

**Varför viktigt:** Detta är Football Manager-trolldomens kärna — minnet av en specifik spelares resa. Vi har data, vi visar det inte.

---

## ETT MEDVETET DESIGNVAL ATT TÄNKA PÅ

### D-1. "Veckans beslut" konkurrerar med dashboardens andra signaler

`weeklyDecisionService` genererar ett två-vägsval som visas på dashboarden i en stor card-sharp med två stora knappar. Bra format, men:

- Det är *alltid* där (om systemet har genererat ett)
- Det är inte alltid kopplat till matchen som kommer
- Det riskerar att kännas som "filler" eftersom det måste produceras varje omgång

**Två vägar:**

**A) Behåll men gör det selektivt:** Veckans beslut visas bara när det *faktiskt har stakes*. Ekonomi-trubbel, spelarmissnöje, scouting-erbjudande — riktiga val. Inte "ska vi köpa ny utrustning eller behålla pengarna".

**B) Slå ihop med kafferummet:** Kafferummet är där frågorna *uppstår* (kioskvakten påpekar något, kassören oroar sig). Veckans beslut blir då en *följd* av kafferummet, inte ett separat system.

Min rekommendation: **A**. Behåll separationen men höj tröskeln för vad som genereras. Kvalitet över kvantitet.

---

## SAMMANFATTNING — PRIORITERINGSORDNING

1. **QW-2 NextMatchCard stakes-tagg** — låg risk, hög effekt, ~1 dag Code
2. **QW-3 Granska "Härnäst"-tab** — naturlig brygga, ~1 dag Code
3. **QW-1 Dashboardens visuella hierarki** — kräver designarbete (mockup först), ~2-3 dagar Code
4. **S-1 Säsongs-akter visuellt** — designgest, kräver färgschema-arbete, ~2 dagar
5. **S-3 PlayerCard "Människan"-sektion** — använd befintlig data, ~2 dagar
6. **S-2 Klubbens resa-vy** — använd befintlig data, ~2 dagar
7. **D-1 Veckans beslut selektivt** — backend-justering, ~1 dag

Totalt: ~12 dagar Code-arbete för att lyfta hela spelets *kännbarhet*.

Detta är **inte nya features**. Det är att exponera djupet som redan finns i kodbasen för spelaren. Spelet *är* mer än vad det visar.
