# PLAYTEST FEEDBACK — STOR RUNDA, 2 april 2026

Jacob + Erik playtest-feedback. Organiserat efter kategori. Kör i ordning per sektion.

---

## A. DATA & COPY — Klubbar, texter, namn

### A1. Klubbtexter (NewGameScreen / worldGenerator)
Korta flavor-texterna. I `CLUB_FLAVOR` i `NewGameScreen.tsx` och/eller `worldGenerator.ts`:

```
Forsbacka:     "Hårda bollar. Hårda tag."
Söderfors:     "Hungrig klubb med stora ambitioner."
Västanfors:    "Där alla andas bandy."
Karlsborg:     "Outsidern med de stora drömmarna."
Målilla:       "Nykomlingen med allt att bevisa."
Gagnef:        "Envisa masar med stor historia."
Hälleforsnäs:  "Brukets Blå knegar alltid på."
Lesjöfors:     "Bandybaroner. Eldsjälar. Byalag."
Rögle:         "Bandyklubb med udda bakgrund."
Slottsbron:    "Blåtomtarna från Värmland."
Skutskär:      "Upplands stolthet."
Heros:         "Arbetarbandyns urmoder."
```

### A2. Ta bort ALLA Villa-referenser
Sök: `grep -rni "villa\|lidköping" src/ --include="*.ts" --include="*.tsx"`
Ta bort allt som refererar till Villa Lidköping. Ingen av de 12 klubbarna heter Villa.

### A3. Erik Ström — ska vara back i Forsbacka
I `worldGenerator.ts` eller spelardata: Erik Ström ska ha position = Defender och clubId = Forsbackas ID (INTE Slottsbron).

### A4. "Snitt-Styrka" → "Snittstyrka"
Sök: `grep -rn "Snitt-Styrka\|Snitt-styrka" src/` — ändra till "Snittstyrka" (ett ord, liten s).

### A5. SM-final datum
SM-finalen ska spelas tredje lördagen i mars. I `getRoundDate()` i `scheduleGenerator.ts`:
- Beräkna tredje lördagen i mars (2027 → 20 mars, 2028 → 18 mars)
- Final-matchday ska mappa till detta datum

### A6. SM-guld år
Säsong 2026/2027 → SM-guld 2027 (INTE 2026). Sök efter var SM-guld-texten genereras:
`grep -rn "svenska mästare\|SM-guld\|SVENSKA MÄSTARE" src/ --include="*.ts" --include="*.tsx"`
Året ska vara `season + 1` (andra halvan av säsongen), inte `season`.

### A7. Juniorlandslagssamling — ej regionalt
Texten "Bengt Mäkinen är kallad till Dalarnas P19-samling" — borde vara "Sveriges P19-samling" eller "Juniorlandslagets samling". Ta bort regional referens. Sök efter var detta genereras.

---

## B. POSITIONER & LAGUPPSTÄLLNING

### B1. Positionsförkortningar — FORTFARANDE FEL
HAL och DEF används fortfarande. Jacobs specificerade positioner ska användas. Exakta namn behöver bekräftas av Jacob, men grundregeln:

I bandy:
- MV (Målvakt)
- B / HB / VB / CB (Backar — höger, vänster, center)
- H / HH / VH / CH (Halvar — höger, vänster, center)  
- I / HI / VI (Innrar — höger, vänster)
- Y / HY / VY (Yttar — höger, vänster)
- CF (Center forward)

Formations-slots i `Formation.ts` ska använda dessa labels, INTE "DEF", "HAL", "FWD", "MID".

Sök: `grep -rn "DEF\|HAL\|FWD\|MID" src/ --include="*.ts" --include="*.tsx"` och ersätt.

### B2. 10 halvbackar, inga mittfältare
Truppgenereringen skapar för många av en position. I `worldGenerator.ts`: kontrollera att spelarfördelningen ger en realistisk mix:
- 2-3 MV
- 4-5 Backar
- 4-5 Halvar
- 4-5 Innrar/Yttar/Forwards
- Totalt ~20-23 spelare

### B3. Planvy — bara nummer, inga namn
Ta bort efternamn från den grafiska laguppställningen (cirklarna på planen). Namnen kapas ändå. Visa BARA nummer i cirklarna. Positionslabel ovanför cirkeln behålls.

---

## C. SPELMEKANIK

### C1. Flygande byten — bänkspelare ska ha speltid
I bandy sker byten löpande under matchen (som ishockey). Spelare på bänken ska OCKSÅ registrera speltid. I `matchStepByStep.ts` / `matchSimulator.ts`:
- Bänkspelare bör få ~30-50% av en startares speltid
- Deras `minutesPlayed` ska uppdateras
- De ska kunna påverka matchstatistik (assist, mål om de byts in)

### C2. Utvisningar ≠ avstängning
**KRITISKT:** Utvisning i bandy = 10 minuter PÅ ISEN (spelaren kommer tillbaka). Det är INTE ett rött kort. Det är INTE en avstängning.

Nuvarande system: utvisning → spelare avstängd 1-3 matcher efteråt. FEL.

**Fix:**
- 10 min utvisning: spelaren sitter av 10 min, kommer sedan tillbaka. Laget spelar med 10 man under tiden. Ingen efterföljande avstängning.
- Matchstraff (mycket sällsynt): spelaren utvisas resten av matchen. INGA automatiska avstängningar efter matchen heller, om inte det är grovt våld (extremt sällsynt).
- Ta bort `suspensionGamesRemaining`-logiken vid vanliga utvisningar. Bara vid matchstraff (och då max 1-2 matcher).
- 1-3 spelare avstängda efter VARJE match är helt orealistiskt. Det borde vara ~0-1 per 5-10 matcher.

### C3. Kontraktsförhandlingar för enkla
"Lägsta acceptabla" accepteras varje gång → sparar 20k/mån direkt. Orealistiskt.

**Fix:** Spelaren bör ibland avvisa lägsta bud:
- Om spelaren har hög CA (>60) → 40% chans att avvisa lägsta bud
- Om spelaren har god form → 20% chans att avvisa
- Om spelaren har alternativ (andra klubbar intresserade) → 30% chans
- Ge spelaren en motförslag: "Accepterar inte under X kr/mån"

### C4. Bygdens puls fastnar på 50
Jacob tog ett mittenlag till SM-final men puls stannade på 50. Att nå SM-final borde ge +15-20 puls. Kontrollera `communityStanding`-uppdateringen i roundProcessor/playoffService.

### C5. Anläggning — kan inte uppgraderas
`facilityLevel` är statisk. Elitakademi kräver > 70. Ingen mekanik för att höja.

**Fix — enkel version:** Lägg till en "Uppgradera anläggning"-knapp i ClubScreen:
- Kostar X kr (t.ex. 200 000 kr)
- Tar 4-8 omgångar
- Höjer facilityLevel med 10-15
- Max 100
- Kan bara göras en gång per säsong

**Alternativ:** Sänk kravet för elitakademi till facilityLevel > 50.

### C6. Akademi — spelare ska stanna till 20
Juniorer i akademin ska vara kvar till de fyller 20. Youth intake ska INTE ta in spelare som inte spelat i akademin föregående säsong.

I `youthIntakeService.ts`:
- Filtrera bort spelare som inte har `academyClubId === managedClubId`
- Spelare under 20 med `academyClubId === managedClubId` ska stå kvar i akademin
- De flyttas till A-truppen vid 20 års ålder (eller om spelaren manuellt lyfts upp)

---

## D. PRESSKONFERENS & EVENT-COPY

### D1. Presskonferensfrågor matchar inte svar
Exempel: "Två viktiga poäng. Hur påverkar det stämningen i laget?"
Svar: "Motståndarna hjälpte till med sina misstag." / "Laget samlade sig." / "Det behövs ingen förberedelse."

Inget svar besvarar frågan. Svaren måste vara kopplade till FRÅGAN.

**Fix:** I `pressConferenceService.ts`: varje fråga måste ha svar som SVARAR PÅ DEN FRÅGAN. Inte generiska uttalanden.

Struktur:
```
Fråga: "Hur påverkar det stämningen?"
→ Svar A: "Segern ger energi. Laget mår bra." (+moral)
→ Svar B: "Vi tar det match för match. Ingen eufori." (neutral)
→ Svar C: "Det var inte bra nog. Vi måste bli bättre." (-moral men +respekt)
```

### D2. "Lova att spela mer attacking" — inte bandyterm
Sök: `grep -rn "attacking\|offensive\|defensive" src/domain/ --include="*.ts"` i event-texter
Ersätt engelska taktiktermer med svenska: "offensivt", "defensivt", "mer anfallsspel".

### D3. Halvtidstext SM-final
"Laget samlas i omklädningsrummet. Det är 30 minuter kvar till SM-guld."
Denna text ska granskas. Jacob vill se ALLA sådana texter.

### D4. Styrelsekommentarer
Jacob har korrigerat styrelsekommentarer i tidigare dokument. Kontrollera att `boardData.ts` överensstämmer.

---

## E. KRAV: DOKUMENT MED ALL COPY

Jacob vill ha ett KOMPLETT dokument med ALL genererad text i spelet. Extrahera alla strängar/texter från:

```bash
# Alla text-strängar som visas för spelaren
grep -rn "title:\|body:\|label:\|text:\|summary:\|headline" src/domain/data/ --include="*.ts"
grep -rn "BOARD_QUOTES\|NEWSPAPER_HEADLINES\|MEETING_OPENERS" src/domain/data/ --include="*.ts"
# Presskonferens
grep -rn "question:\|label:" src/domain/services/pressConferenceService.ts
# Events
grep -rn "title:\|body:" src/domain/services/events/ --include="*.ts"
# Commentary
cat src/domain/data/matchCommentary.ts
```

Samla ALLT i ett dokument: `docs/ALL_GAME_COPY.md` — organiserat per kategori (styrelse, press, events, kommentarer, inbox-meddelanden, etc). Jacob ska kunna granska och korrigera.

---

## F. BANDYDOKTORN

Bandydoktorn fungerar fortfarande inte i produktion. Kräver `ANTHROPIC_API_KEY` i Render-miljön.

**Steg:**
1. I Render dashboard → Environment Variables → lägg till `ANTHROPIC_API_KEY`
2. Verifiera att `server.js` proxar korrekt till Anthropic API
3. Testa i produktion

Om Jacob inte har en API-nyckel → visa ett tydligt meddelande: "Bandydoktorn kräver en API-nyckel. Kontakta utvecklaren."

---

## G. DESIGN (från runda 2)

Se `docs/DESIGN_SPRINT_R2.md` — 11 punkter kvarstår.

Utöver det:
### G1. Planvy — bara nummer, inga namn (se B3)
### G2. Klubb-flavor-texter kortare (se A1)

---

## PRIORITETSORDNING

### KRITISKT (gameplay-breaking)
1. C2 — Utvisningar ≠ avstängning
2. B1 — Positionsförkortningar
3. B2 — 10 halvbackar
4. C1 — Flygande byten / bänkspelartid
5. C6 — Akademi: spelare kvar till 20

### VIKTIGT (påverkar upplevelsen)
6. A1 — Klubbtexter
7. A3 — Erik Ström
8. A6 — SM-guld år
9. C3 — Kontraktsförhandlingar
10. C4 — Bygdens puls
11. D1 — Presskonferenssvar
12. D2 — Engelska taktiktermer i events

### BÖR GÖRAS
13. A2 — Villa-referenser
14. A4 — Snittstyrka
15. A5 — SM-final datum
16. A7 — Juniorlandslag
17. C5 — Anläggningsuppgradering
18. B3 — Planvy bara nummer
19. D3 — Halvtidstext
20. D4 — Styrelsekommentarer
21. E — Kopiera ut ALL copy
22. F — Bandydoktorn deploy
