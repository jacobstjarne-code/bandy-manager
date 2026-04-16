# Eriks textkorrekturer — Implementation

Alla textändringar från Eriks dokument. Gör steg för steg. `npm run build` efter varje fil. Committa gruppvis.

---

## 1. KLUBBNAMN & FLAVOR (worldGenerator.ts — CLUB_TEMPLATES)

Byt namn, shortName och flavor för varje klubb-ID. Sök och ersätt exakt:

| Klubb-ID | Gammalt namn | Nytt namn | Nytt shortName | Ny flavor |
|----------|-------------|-----------|----------------|-----------|
| club_sandviken | Storvik BK / Storvik | Forsbacka BK / Forsbacka | Forsbacka | Hårda bollar. Hårda tag. Forsbacka ger sig aldrig. |
| club_sirius | Tierp BK / Tierp | Söderfors BK / Söderfors | Söderfors | Hungrig klubb med stora ambitioner. |
| club_vasteras | Hallstahammar IK / Hallstahammar | Västanfors IF / Västanfors | Västanfors | Här andas alla bandy. Förväntningarna är höga. |
| club_broberg | Norrala IF / Norrala | Karlsborgs BK / Karlsborg | Karlsborg | Outsidern med de stora drömmarna. |
| club_villa | Lödöse BK / Lödöse | Målilla GoIF / Målilla | Målilla | Målilla har allt att bevisa. Nykomlingens hunger. |
| club_falun | Gagnefs IF / Gagnef | Gagnefs IF / Gagnef | Gagnef | Envisa masar med stor historia. |
| club_ljusdal | Bergsjö BK / Bergsjö | Hälleforsnäs IF / Hälleforsnäs | Hälleforsnäs | Brukets Blå. Ett knegarlag med hjärta. |
| club_edsbyn | Alfta IF / Alfta | Lesjöfors IF / Lesjöfors | Lesjöfors | Bandybaroner med bruksanda och byamentalitet. |
| club_tillberga | Kolbäcks IK / Kolbäck | Rögle BK / Rögle | Rögle | Underdog på alla sätt. Ingen tror på Rögle. |
| club_kungalv | Bohus BK / Bohus | Slottsbrons IF / Slottsbron | Slottsbron | Blåtomtarna från Värmland. |
| club_skutskar | Skutskärs IF / Skutskär | Skutskärs IF / Skutskär | Skutskär | Skutskär. Upplands stolthet på isen. (oförändrad) |
| club_soderhamns | Iggesunds BK / Iggesund | Heros BK / Heros | Heros | Arbetarbandyns moderskepp. |

OBS: Ändra INTE klubb-ID:n (club_sandviken etc), bara name/shortName/flavor.
Ändra även regioner där det behövs (Slottsbron → Värmland, Lesjöfors → Värmland, etc).

Byt även CLUB_FLAVOR i NewGameScreen.tsx — samma mapping.

## 2. RIVALITETER (src/domain/data/rivalries.ts)

Ersätt hela rivalitets-datan med Eriks nya:

| Klubb 1 (ID) | Klubb 2 (ID) | Derbynamn | Intensitet |
|---------------|--------------|-----------|------------|
| club_sirius (Söderfors) | club_skutskar (Skutskär) | Upplandsderbyt | 3 |
| club_edsbyn (Lesjöfors) | club_ljusdal (Hälleforsnäs) | Bruksderbyt | 2 |
| club_falun (Gagnef) | club_soderhamns (Heros) | Daladerbyt | 3 |
| club_tillberga (Rögle) | club_villa (Målilla) | Slaget om södern | 2 |
| club_broberg (Karlsborg) | club_tillberga (Rögle) | Nord mot syd | 1 |
| club_kungalv (Slottsbron) | club_ljusdal (Hälleforsnäs) | Blåderbyt | 1 |
| club_falun (Gagnef) | club_sandviken (Forsbacka) | Gävledaladerbyt | 2 |
| club_vasteras (Västanfors) | club_sirius (Söderfors) | Forsderbyt | 1 |
| club_kungalv (Slottsbron) | club_edsbyn (Lesjöfors) | Slaget om Värmland | 3 |

## 3. INTRO-SEKVENS (IntroSequence.tsx)

Slide 1 text: "Strålkastarna tänds. Isen ligger klar. Det doftar korv från kiosken."
Slide 2 tagline: "En ort. Ett lag. Ett mål."

Verifiera att dessa stämmer med nuvarande kod. Om inte, uppdatera.

## 4. SM-FINAL CITAT (NextMatchCard.tsx)

Ändra från "Hela Sverige tittar." till "Sveriges svar på Superbowl."

## 5. GULT KORT → UTVISNING

Erik: "FINNS INGET GULT KORT RIKTIGT I BANDY. DET ÄR 10 MIN UTVISNING."

I matchCommentary.ts:
- Ta bort hela `yellowCard`-arrayen
- I matchSimulator/matchStepByStep: ändra alla `MatchEventType.YellowCard` till `MatchEventType.RedCard` (som representerar utvisning, inte rött kort)
- Eller bättre: om `YellowCard` används som "varning", ta bort det helt. Bandy har bara utvisning (10 min).

I enums.ts: ta INTE bort YellowCard enum-värdet (kan krascha sparade spel), men sluta generera det.

## 6. KOMMENTARER — matchCommentary.ts

Eriks korrekta text finns redan i dokumentet han skickade. De viktigaste ändringarna vs nuvarande:

### Fulltid
- Nuvarande: "efter 90 engagerade minuter" → Erik: "efter 90 rafflande minuter"
- Nuvarande: "Spelarna skakar hand" → Erik: "Spelarna skakar näve efter en tuff match"
- Nuvarande: "Tre visslar" → Erik: (tar bort, det finns inga tre visslar i bandy)

### Mål
- Nuvarande: "{player} nudgar in bollen" → Erik: "{player} kommer sopren med målvakten och gör inga misstag"
- Nuvarande: "{player} tar emot, vänder och skjuter" → Erik: (ta bort — inte bandyspråk)

### Räddningar
- Nuvarande: "{goalkeeper} klockar ut" → Erik: "{goalkeeper} får sträcka på sig. Strålande räddning!"
- Nuvarande: "Bollen bränner i kassen" → Erik: "Alla lösa går om, skrockar {goalkeeper}"
- Lägg till: "{goalkeeper} styr ut bollen nere vid stolproten. Det är inte möjligt!"

### Missar
- Nuvarande: "Inte tillräckligt nördigt placerat" → Erik: "Inte riktigt nära med det avslutet."
- Lägg till: "I RIBBAN! Frustrerat nu i {team}."

### Utvisningar
- Nuvarande: "för sen tackling" → Erik: "för bentackling"
- Nuvarande: "Sen foul" → Erik: "Sent brytningsförsök"

### Hörnor
- Nuvarande: "Hård insvingare" → Erik: "Boll på sista skytten, men ingen lycka"
- Lägg till: "Hörna till {team}. En variant! Kort spel med skott i dödvinkel. Långt utanför!"
- Lägg till: "{team} får hörna. Bollen studsar lite, men det blir ändå till ett skott i ruset."
- Lägg till: "Hörna. Inslagen mot tredjeskytt, som skjuter rakt i {opponent}s rus."

### Väder
- Nuvarande: "Snön lägger sig i högar" → Erik: "Snön lägger sig i högar på isen. Det blir mycket lyror nu."
- Nuvarande: "Bollen fastnar i slush. Det här är inte bandyväder." → Erik: "Bollen fastnar i slushen. Det här är vad som gör bandyn vacker!"
- Nuvarande: "Blidväder i mars" → Erik: "Vattenpolo. Spelarnas värsta mardröm."
- Nuvarande: "Perfekt kyla för perfekt is" → Erik: "Kylan gör isen stenhård. Bollen studsar som en flipperkula."

REKOMMENDATION: Enklast att ersätta HELA matchCommentary.ts med Eriks korrigerade version. Skapa filen baserat på Eriks dokument (allt i sektion 8).

## 7. JOURNALISTFRÅGOR — pressConferenceService.ts

Eriks ändringar i QUESTIONS-objektet:

### bigWin
- Nuvarande: "Tretalet idag" → Erik: "Tvåsiffrigt idag"
- Nuvarande: "Er offensiv ser ostoppbar ut" → Erik: "Ert anfallsspel ser ostoppbart ut"
- Nuvarande: "Fem mål är ovanligt" → Erik: "Bra match. Hade ni kunnat vinna med ännu mer?"

### win
- Nuvarande: "Tre viktiga poäng" → Erik: "Två viktiga poäng" [BANDY HAR 2P-SYSTEM]
- Nuvarande: "En avancemang i tabellen" → Erik: "Ni avancerar i tabellen"

### loss
- Nuvarande: "Ni hamnade bakom motståndarna taktiskt" → Erik: "Ni hamnade efter motståndarna tidigt"
- Nuvarande: "Säsongen är svår just nu" → Erik: "Ni har det tufft just nu"
- Lägg till: "Bortalaget körde över er i perioder. Vad händer med er defensiv?"

### bigLoss
- Nuvarande: "Fem insläppta mål" → Erik: "En jävla massa mål i röven. Var det ett systemproblem?"
- Nuvarande: "En mörk kväll. Hur tar ni er vidare?" → Erik: "En mörk kväll. Hur tar ni er vidare härifrån?"

### draw
- Nuvarande: "En poäng i bortamatchen" → Erik: "En poäng på bortaplan"

### Tidningar
Nuvarande: ['SVT Nyheter', 'Bandyplay', 'Lokaltidningen', 'Sportbladet', 'Bandypuls']
Erik: ['SVT Nyheter', 'Bandyplay', 'Lokaltidningen', 'Sportbladet', 'Bandypuls', 'Expressen', 'DN', 'Radiosporten']

## 8. P17 → P19

Globalt sök-och-ersätt i alla filer:
```bash
grep -rn "P17" src/ | grep -v node_modules | grep -v ".d.ts"
```
Byt alla user-facing strängar från "P17" till "P19". Byt INTE variabelnamn.

## ORDNING
1. Klubbnamn + flavor i worldGenerator.ts och NewGameScreen.tsx
2. Rivaliteter i rivalries.ts
3. Intro-text + SM-final citat
4. Gult kort → utvisning (sluta generera YellowCard)
5. Kommentarer (hela matchCommentary.ts)
6. Journalistfrågor + tidningar (pressConferenceService.ts)
7. P17 → P19

npm run build efter varje steg. Committa gruppvis. Pusha efter sista.
