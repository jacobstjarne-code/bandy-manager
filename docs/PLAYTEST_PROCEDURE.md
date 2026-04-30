# PLAYTEST_PROCEDURE — Hur Code kör en playtest-runda

**Skapad:** 2026-04-28
**Författare:** Opus
**Syfte:** Strukturera hur Code playtestar nya features systematiskt, inte ad hoc.

---

## När detta dokument används

Efter varje större sprint där Code levererat nya features eller refactors. Specifikt:

- En full Spec-leverans är klar och commit:ad
- Build + tester passerar
- SPRINT_AUDIT.md är skriven (inkl. pixel-jämförelse)
- *Innan* nästa sprint påbörjas

Playtest-runda är obligatorisk innan ny sprint plockas. Skälet: att lära sig vad som faktiskt händer i appen, inte bara vad koden säger.

---

## Fyra typer av playtest-runda

### Typ 1: Smoke test (10-15 min)
Snabb verifiering att inget är trasigt efter senaste sprinten. Körs efter varje sprint.

### Typ 2: Feature playtest (30-45 min)
Specifikt för en nylevererad feature. Verifiera att den fungerar i alla relevanta sammanhang.

### Typ 3: Hela säsongen (1-2h)
En full säsong genomspelad. Fångar problem som bara uppstår över tid (balansering, repetition, lagring).

### Typ 4: Multi-säsong (2+h, sällan)
Två eller fler säsonger. Behövs för retention-features (klubbminnet, säsongssignaturer, journalistrelationer över tid).

Default vid sprint-slut är **Typ 1 + Typ 2**. Typ 3 körs efter större milstolpar (t.ex. när alla 7 specerna är levererade). Typ 4 är speciellt och bestäms separat.

---

## Hur Code förbereder playtest

Innan playtest startar:

1. **Verifiera klean state** — `git status` ska vara klean. Inga ofullbordade ändringar.
2. **Verifiera build** — `npm run build` ska passera utan varningar.
3. **Starta dev-server** — `npm run dev` (eller motsvarande).
4. **Notera versionen** — git commit-hash som testas. Skrivs överst i playtest-anteckningen.
5. **Skapa playtest-anteckningsfil** — `docs/playtest/PLAYTEST_YYYY-MM-DD_<typ>.md` enligt mall nedan.

---

## Anteckningsmall

```markdown
# Playtest YYYY-MM-DD — <typ>

**Commit:** <hash>
**Typ:** Smoke / Feature / Säsong / Multi-säsong
**Fokus:** <vad som testas>
**Tid:** <hur länge>

---

## Spelflöde — vad jag gjorde
(Konkret handlingslista, inte sammanfattning)

1. Startade ny manager
2. Valde klubb Forsbacka från "tre erbjudanden"-vyn
3. Kom till BoardMeetingScreen
4. ...

---

## Observerat — bra
- Vad som funkade som det ska
- Vad som var kännbart bättre än innan

## Observerat — fel/buggar
- Konkreta felbeskrivningar
- Vilken vy, vilken handling, vad blev fel
- Skärmdump om relevant

## Observerat — UX-friktion
- Saker som inte är fel men irriterar
- Saker som tar för många klick
- Saker som är svåra att förstå

## Observerat — meta
- Känslor om upplevelsen
- Vad som klickade
- Vad som glömdes bort

---

## Slutsatser

- Akut åtgärd behövs: <ja/nej, varför>
- Lägg till i ÅTGÄRDSBANK: <vad>
- Värt att ta upp med Opus: <vad>
```

---

## Smoke test — checklista

15 minuter, gå igenom följande utan att göra djup-test:

1. **Starta nytt spel** — kraschar inget?
2. **Inledningsflöde** — IntroSequence → namn → tre erbjudanden → klubbval → BoardMeetingScreen → PreSeasonScreen
3. **Första omgången** — välj uppställning, spela match, se GranskaScreen
4. **Avancera 2-3 omgångar** — se att Portal uppdateras, se inboxen, klicka runt i ClubScreen
5. **Säsongsslut** — spela till slut, se SeasonSummaryScreen

**Stopp-punkter:** Om något kraschar, fryser, eller renderar fel — stoppa och dokumentera. Klart med smoke när alla 5 punkterna gått igenom utan problem.

---

## Feature playtest — för specifika sprintar

Efter varje feature-sprint, kör dessa scenarion specifika för det som levererades.

### Efter SPEC_INLEDNING_FAS_1
- Starta nytt spel 3 gånger med olika seed
- Verifiera att klubbalternativ varierar
- Verifiera att klubbcitat är tonalt rätt (inte "AI-aktiga")
- Klicka "Visa alla 12 klubbar" och välj manuellt
- Klicka tillbaka från klubblista till tre-erbjudanden

### Efter SPEC_PORTAL_FAS_1
- Spela 5 omgångar och notera vilka primary cards som visas
- Verifiera att rätt card visas vid derby (omgång där rivalry triggar)
- Verifiera att tonalitets-CSS skiftar märkbart mellan tidiga och sena omgångar
- Klicka secondary cards och verifiera att de leder rätt

### Efter SPEC_SCENES_FAS_1
- Starta nytt spel — verifiera att söndagsträningen triggar omgång 1-2
- Spela alla val (kör spelet 4 gånger med olika val) — verifiera att val lagras
- Spela till SM-final och vinn — verifiera SM-finalsegern triggar
- Verifiera att scen ej triggar igen efter genomspelning

### Efter SPEC_KAFFERUMMET_FAS_1
- Spela 10 omgångar — verifiera att kafferum triggar minst en gång
- Skapa skandal i annan klubb — verifiera override-trigger
- Klicka Portal-kort för kafferum manuellt
- Verifiera 1, 2, och 3 utbyten over tid

### Efter SPEC_JOURNALIST_KAPITEL_A
- Vägra 3 presskonferenser — verifiera att kortet visas som "kylig"
- Vägra 5 presskonferenser — verifiera att inbox-event triggar
- Svara ärligt i 5 presskonferenser — verifiera att kortet visas som "varm"
- Klicka kortet — verifiera scen-vyn med relations-stapel
- Spela vidare — verifiera +10% publik vid stark relation

### Efter SPEC_KLUBBMINNET_KAPITEL_B
- Spela 1 säsong → öppna ClubScreen → Minne-tab → verifiera tom-vy
- Spela 2 säsonger → öppna Minne → verifiera 2 säsongssektioner
- Verifiera att rätt events plockats (slutplacering, derbyn, milstolpar)
- Verifiera "PÅGÅENDE"-tag på aktuell säsong
- Verifiera legend-block om någon pensionerats

### Efter SPEC_SAESONGSSIGNATUR_KAPITEL_C
- Starta nytt spel 5 gånger — notera vilka signaturer som triggas
- Verifiera att "calm_season" inte visar reveal-scen
- För andra signaturer: verifiera reveal-scen vid omgång 1
- Spela igenom säsong med signatur — verifiera att modifierare märks (mer 3×30 vid cold etc)
- Slutför säsong — verifiera att summary rubricerar säsongen

---

## Hela säsongen-playtest

Körs efter större milstolpar. ~1-2h.

**Fokus:**
- Spela en hel säsong från omgång 1 till säsongsslut
- Notera repetitiva moment (saker som händer för ofta)
- Notera tomma stunder (saker som händer för sällan)
- Hur känns balansen mellan lugna och dramatiska omgångar?
- Är säsongens helhet kännbar — eller känns det som 22 separata matcher?

**Specifika frågor att besvara:**
- Vid vilken omgång började jag känna säsongens karaktär?
- Hur kändes transferdeadline-veckan?
- Hur kändes derby-veckorna jämfört med vanliga veckor?
- Hade jag någon strategisk insikt under säsongens gång?
- Vilka events glömdes bort utan att märkas?

---

## Efter playtest — vad Code gör med anteckningarna

1. **Anteckningarna stannar i `docs/playtest/`** som dokumenterad historik. Ingen radering.

2. **Buggar går till `docs/ATGARDSBANK.md`** med rad: `[Datum] [Bugg] [Vyn där den uppstår] [Hur reproducera]`. ÅTGÄRDSBANK är prioriterad nästa sprint.

3. **UX-friktioner som *inte* är buggar** — diskuteras med Opus innan åtgärd. Vissa är värda att fixa, andra är acceptable trade-offs.

4. **Meta-observationer** (känsla, atmosfär, vad som klickade) — viktigast input till Opus för nästa spec-prioritering.

5. **Code rapporterar tillbaka till Jacob med 3-rader-sammanfattning:**
   - "Smoke test grön. Inga buggar."
   - "Feature playtest av kafferum: 1 bugg fångad (override-trigger triggade aldrig på skandal — felaktig villkor i `hasOverrideTrigger`). Lagt i ÅTGÄRDSBANK."
   - "Hela säsongen kändes platt mellan omgång 8-13. Inga events triggade. Inget akut, men värt att diskutera med Opus."

---

## Vad detta dokument INTE är

- **Inte ett krav på automatiserade tester.** Det är manuell playtest. Vi har redan unit/integration-tester för logik.
- **Inte ett substitut för Jacobs egen playtest.** Jacob spelar också. Code gör grundverifiering. Jacob spelar för känsla och designinsikter.
- **Inte ett verktyg för att mäta playtid eller engagement.** Det är ett verktyg för att fånga buggar och friktion innan nästa sprint.

---

## Slut PLAYTEST_PROCEDURE
