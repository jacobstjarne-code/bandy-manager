# ANALYSBRIEFING — Klubbrapporter (uppdaterad efter Eriks feedback)

**Mål:** En datarapport per klubb med insikter som INTE finns idag i svensk bandyanalys.
**Klubbar:** Sandvikens AIK, IK Sirius, Nässjö IF, Tellus Bandy

**Rubrik per rapport:**
```
[KLUBBNAMN] — Datarapport [säsongsintervall]
Djup AI-ledd analys av X matcher med Y matchhändelser och Z spelare.
```

---

## PRINCIP: Vad som är värt att visa

Erik (bandyexpert) har granskat förslagen. Rangordning baserad på vad som:
- **INTE finns idag** i Bandygrytan/SBF-statistik
- **Direkt taktiskt användbar** för en tränare/sportchef
- **Specifik per lag/spelare** — inte generella liganormer

### Vad som redan finns (visa INTE som unik insikt):
- Hörneffektivitet offensivt (Bandygrytan visar detta)
- Målvaktsräddningsprocent (finns, @bandymuggen analyserar)
- Grundläggande mål/match, vinst%, tabellposition

### Vad som INTE finns idag (vårt unika bidrag):
- PP/PK-ekonomi per lag — existerar inte i svensk bandy
- Motståndarspecifika mönster — tränare vill ha detta, ingen levererar det
- Domarkorrelationer — politiskt känsligt, analytiskt legitimt
- Utvisningsmönster per spelläge — inte bara antal, utan NÄR och VAD DET KOSTAR
- Hörnförsvar (defensiva sidan) — ingen pratar om vilka lag som är dåliga på att försvara hörnor
- Första-mål-effekt per lag per motståndare — psykologisk profil

---

## RAPPORTSTRUKTUR

### DEL 1: IDENTITET (kort, 3-4 punkter)
Siffror som bekräftar vad klubben redan vet — men kvantifierat.
Hemma/borta-profil, målsnitt, säsongsposition. Kortfattat.

### DEL 2: UNIKA INSIKTER (kärnan, 6-8 punkter)

Ordnade efter Eriks prioritering:

#### A) PP-EKONOMI — Existerar inte idag
Per lag, beräkna:
- **PP-konvertering:** Andel powerplay-perioder som ger mål. Per lag.
- **PK-överlevnad:** Andel box plays som hålls utan insläppt.
- **PP-netto:** PP-mål gjorda minus PP-mål insläppta per säsong. Ranking i ligan.
- **PP-timing:** Gör laget sina PP-mål tidigt eller sent i utvisningen?
- **PP-försök vs resultat:** Vissa lag genererar massor av PP-tillfällen men konverterar dåligt — de skapar chanser men kastar bort dem.

Visa som: "Ert lag har haft X PP-tillfällen. Ni konverterar Y%. Ligasnittet är Z%. Det kostar er uppskattningsvis W poäng per säsong."

#### B) MOTSTÅNDARSPECIFIKA MÖNSTER — Vad tränare vill ha
Per motståndare (alla lag de mött minst 4 gånger):
- **Utvisningsöverskott:** Tar laget fler utvisningar mot specifika motståndare? "Mot [lag X] tar ni i snitt 5.2 utvisningar/match — mot alla andra 3.4."
- **Trigger-minuter:** Finns det spelare som konsekvent utvisas i samma minutintervall mot samma motståndare?
- **Målmönster per motståndare:** "Mot [lag X] gör ni 62% av era mål i 2:a halvlek. Mot [lag Y] gör ni 70% i 1:a halvlek." Olika matchups kräver olika taktik.
- **Första-mål-effekt per motståndare:** "När ni gör första målet mot [lag X] vinner ni 90%. Mot [lag Y] bara 55%." Det avslöjar vilka matchups som är mentalt farliga.
- **Hemma/borta-skillnad per motståndare:** Kanske slår ni [lag X] hemma varje gång men förlorar alltid borta.

Visa som tabell med de 3-4 mest avvikande motståndarprofilerna. Inte alla — bara de som sticker ut.

#### C) DOMARKORRELATIONER
Strukturerad domardata saknas. Notera i rapporten: "Domaranalys ej möjlig med nuvarande data — framtida analys vid tillgång."

#### C2) UTVISNINGSTYPS-PROFILER — Nytt, finns i datan
Utvisnings-events har `info`-fält (orsak: "Slag på klubban", "Friläge", "Hög klubba" etc.) och `fxType`. Använd dessa för att bygga utvisningstyps-profiler per lag och spelare.

**Per lag:**
- **Temperament vs taktik-ratio:** Andel utvisningar som är aggressionsrelaterade ("Slag på klubban", "Hög klubba", "Roughing") vs taktiska ("Friläge", "Tripping vid kontra"). "X% av era utvisningar är aggressions-relaterade — ligasnittet är Y%."
- **Utvisningstyp per matchsituation:** Ändras karaktären på utvisningarna vid underläge? Om "Slag på klubban" ökar vid underläge → frustrationsproblem. Om "Friläge" ökar vid ledning → taktisk medvetenhet.
- **Utvisningstyp per period:** Tidiga utvisningar = temperament ("Slag" i minut 10). Sena = trötthet ("Tripping" i minut 85). Profilen per lag avslöjar grundorsaken.

**Per spelare:**
- **Spelare med ensidig utvisningsprofil:** "Spelare X har 8 utvisningar — alla för 'Slag på klubban'. Det är inte trötthet, det är temperament."
- **Spelare med taktiska utvisningar:** "Spelare Y har 6 utvisningar — 5 för 'Friläge'. Hen stoppar kontrar medvetet." Det kan vara en tillgång, inte ett problem.
- **Typ-förändring under säsongen:** Börjar en spelare med taktiska utvisningar och slutar med frustrations-utvisningar? Det kan signalera mentalt ras.

#### D) UTVISNINGSPROFILER (redan delvis gjort — fördjupa)
- **Costliest offender per lag:** Vilken spelare kostar flest poäng genom utvisningar? Beräkna: `utvisningar × andel_som_leder_till_mål_emot`.
- **Disciplin-kaskad:** När en spelare utvisas, ökar sannolikheten att en till utvisas inom 10 minuter? Per lag.
- **Situationsutvisningar:** Utvisningar vid ledning (taktiska) vs underläge (frustration). Ratio per lag.
- **Utvisningstidpunkt:** Tidigt i matchen (temperament) vs sent (trötthet). Per lag jämfört med liganorm.

#### E) HÖRNFÖRSVAR — Den defensiva sidan ingen pratar om
Offensiv hörneffektivitet finns redan på Bandygrytan. Det nya:
- **Hörnmål insläppta per lag:** Vilka lag läcker mest på hörna? Ranking.
- **Hörnförsvar per matchsituation:** "Ni släpper in hörnmål i 28% av hörnorna MOT er vid underläge — ligasnittet är 18%."
- **Hörnförsvar hemma vs borta:** Skiljer det sig?
- **Trend:** Blir försvaret bättre eller sämre under säsongen?

#### F) HALVTIDSKORRIGERING
Eriks invändning: inte unikt för bandy (hockey har två pauser). Sant — men analysen är fortfarande värdefull. Framställ det INTE som bandyunikt, utan som coachingkvalitetsmått:
- **2:a halvlek-förbättring:** Andel matcher där laget presterar bättre i 2H vs 1H (mål gjorda minus insläppta).
- **Halvtidsvändningar:** Hur ofta vänder laget ett underläge i 2:a halvlek? Vs liganorm.
- **Halvtidsras:** Hur ofta tappar laget en ledning? Vs liganorm.
- Visa som: "Er tränare förbättrar lagets prestation från 1H till 2H i X% av matcherna. Ligasnittet är Y%."

#### G) FÖRSTA-MÅL-SÅRBARHET
Per lag OCH per motståndare:
- "Ni vinner X% av matcherna där ni gör första målet. Ligasnittet är Y%."
- "Men mot [lag Z] vinner ni bara W% trots att ni gör första målet." → Mentalt problem i den matchupen.
- **Response time:** "När ni släpper in mål tar det i snitt X minuter att göra nästa. Ligasnittet är Y." Per motståndare om möjligt.

---

### DEL 3: SPELAR-SPOTLIGHTS (3-5 per klubb)

#### Volym
Mest mål/poäng. Självklart men kvantifiera beroende:
"X% av era mål involverar spelare Y. Utan Y som målskytt: Z mål/match."

#### Situation
- **Hörn-ankare:** Vem gör flest hörnmål? (Offensiv — redan delvis känt, men koppla till försvar: "Utan [spelare X] faller er hörnkonvertering från A% till B%")
- **Closer:** Flest mål efter minut 70.
- **Clutch:** Flest mål vid underläge.
- **PP-specialist:** Flest mål under powerplay.

#### Kostnad
- **Disciplin-kostnad:** Spelare vars utvisningar leder till flest PP-mål emot. Beräkna faktiskt poängtapp.
- **Big-game-frånvaro:** Spelare som levererar i grundserien men inte i slutspel/derby (0 poäng i dom matcherna).

#### Dold tillgång
- **Vinstkorrelation:** Vilken spelare har störst skillnad i lagets vinst% med/utan hen i startelvan? Inte nödvändigtvis målskytten.

---

### DEL 4: MÖNSTER CODE SKA LETA EFTER (utforska fritt)

Utöver ovan — leta efter samband som sticker ut. Specifikt:

1. **"Derbyeffekten på nästa match"** — Presterar laget sämre matchen EFTER ett derby?

2. **"Säsongsstart-prediktor"** — Korrelerar omgång 1-5 med slutplacering? Per lag.

3. **"Periodisk sårbarhet"** — Har laget en specifik 10-minutersperiod där de konsekvent underpresterar jämfört med sitt eget snitt? "Ni förlorar era matcher i minuterna 50-60."

4. **"Comeback-profil per spelläge"** — Vänder laget oftare från 0-1 eller 1-2? Och mot vilken typ av motståndare?

5. **"Matchens vändpunkt"** — I matcher laget vinner: medianminuten för det avgörande målet. "Era vinster avgörs i snitt i minut X."

6. **Allt annat som avviker >2σ från liganorm.** Var kreativ. Kör korrelationer. Rapportera det som är oväntat.

---

## FORMAT

En markdown-fil per klubb:
```
docs/data/klubbrapporter/SANDVIKENS_AIK.md
docs/data/klubbrapporter/IK_SIRIUS.md
docs/data/klubbrapporter/NASSJO_IF.md
docs/data/klubbrapporter/TELLUS_BANDY.md
```

Max 3-4 sidor per rapport. Prioritera insikter framför bredd. Om en kategori inte ger något intressant för en specifik klubb — hoppa över den.

Emojis sparsamt i rubriker, inte i brödtext.

---

## SEPARAT: MOTORIMPLIKATIONER

`docs/data/MOTORIMPLIKATIONER_FULLDATA.md` — med:
- Allsvenskan vs Elitserien (mönsterskillnader)
- Dam vs herr
- Kvalmönster
- Explicit "motor: ändra/behåll" per mätpunkt
