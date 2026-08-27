# CODE-INSTRUKTION — B12 STEG 1: HÄNDELSEBERIKNING

**Datum:** 2026-08-19 · **Av:** Opus
**Underlag:** `docs/B12_MATCHHANDELSERNA_SOM_SANNING_2026-08-19.md`, `docs/BANDYSPRAK_KALLASNING_2026-08-19.md`
**Jacobs beslut 2026-08-19: alternativ B.** Berikningen nu, possession-motorn som eget V2-program efter releasen.

---

## Vad detta är och inte är

**Är:** att låta matchmotorn skriva ner vad den redan vet. Varje gång motorn avgör att en chans uppstod, ett mål föll eller bollen tappades, finns orsaken i beräkningen — och kastas.

**Är inte:** en ny motor, nya sannolikheter, nya taktikdimensioner, nya roller eller nya attribut. Allt det ligger i V2.

**Den hårda gränsen:** `matchCore` är kalibrerad mot 1 100+ verkliga Elitserien-matcher och skyddas av `BEVARA`-listan. **Berikningen får inte ändra ett enda utfall.**

---

## Godkännandekriteriet — läs detta först

**Samma seed ska ge byte-identiskt resultat före och efter.**

Kör `npm run stress` före och spara utdata. Kör efter. Målsnitt, hemmavinstandel, oavgjortandel, hörnmål, utvisningar — **alla identiska**, inte "inom toleransen". Skiljer sig något har berikningen läckt in i beräkningen och ska rullas tillbaka.

Det är ett ovanligt hårt krav, och det är avsiktligt: det gör hela posten riskfri. Går testet är kalibreringen bevisligen orörd.

---

## STEG 1 — RAPPORT, bygg inget

Tio frågor, och därefter en **klassificering per fält** som är det egentliga stoppvillkoret.

1. Vilka eventtyper producerar `matchCore` i dag, och vilka fält bär de?
2. Bär ett event bollzon (eller motsvarande position) och involverade spelare?
3. Finns `possessionId` / `sequenceId` / `previousEventId`, eller är eventen en platt lista?
4. **Vilken information finns tillgänglig precis innan respektive event skapas men kastas bort?** — den här frågan är hela postens kärna.
5. Kan mål och chans kopplas till ursprung: hörna, frislag, straff, öppet spel, retur?
6. Kan långpassning, flipp och lyra skiljas från vanlig passning utifrån redan befintlig state?
7. Kan frilägen och andra chanssituationer identifieras utan ny simulering?
8. Kan en defensiv spelare som **redan är part i det utlösande beslutet** sparas som ansvarig eller involverad?
9. Finns numerärt över-/underläge redan i matchstate när eventet skapas?
10. Kan fälten läggas till utan att någon sannolikhetsberäkning, action selection, **RNG-konsumtion** eller eventfrekvens ändras?

### Klassificeringen — stoppvillkoret

**För varje föreslaget fält, klassificera:**

**A** — befintlig information som i dag tappas bort. Motorn har den före eventskapandet.
**B** — deterministiskt härledbar ur befintlig state, utan RNG och utan ändrad sannolikhet.
**C** — kräver ny simulering eller ett nytt beslut. Motorn vet inte detta i dag.

**Endast A och B byggs. C dokumenteras som V2 och lämnas.**

Det är ett bättre skydd än en allmän instruktion om att inte röra motorn, eftersom det avgörs per fält i stället för per post. Ett fält kan vara A medan fältet bredvid är C.

Fält att **pröva, inte förutsätta:** `origin`, `primaryCause`, `contributingFactors`, `responsiblePlayerId`, `involvedPlayerIds`, `tacticalFactors`, `manpowerState`, `sequenceId`.

---

## Falsk kausalitet — den enda vägen posten kan göra skada

Anta att motorn vet att en halv förlorade en duell, och att det därefter blev en chans. **Det betyder inte att halven är ansvarig** om det ligger tre slump- eller matchbeslut emellan.

Ett påhittat `responsiblePlayerId` är värre än inget, och det är värre på tre ställen samtidigt: spelarbetyget blir fel, `B4`:s analys pekar ut fel spelare, och `O16` lär spelaren något osant om sin egen taktik. Tre system som alla är självsäkert fel.

**Regeln:** skriv bara kausalitet motorn faktiskt kan belägga. Därför två fält, inte ett:

```ts
primaryCause: string          // bara när exekveringsvägen belägger den
contributingFactors: string[] // bidragande, utan ansvarspåstående
```

Och `responsiblePlayerId` sätts **bara** när den defensiva spelaren redan är part i det utlösande beslutet — inte när hen råkade vara närmast i en tidigare händelse.

**Hällre inget ansvar alls än ett snyggt men påhittat ansvar.** Det är `O11` tillämpad på matchmotorn: ingen berättelse utan deklarerat state.

---

## Ordval: metadata, inte händelser

Posten heter **kausal och taktisk metadata på befintliga matchhändelser** — inte "taktiska händelser".

Skillnaden är inte kosmetisk. "Taktiska händelser" låter som att motorn ska börja generera `PRESS_LINE_BROKEN` och `SWITCH_CREATES_FREE_HALF`. **Det ska den inte i V1.** Modellerar dagens motor inte dem ska V1 inte låtsas att den gör det.

De hör till V2, och de är bra där.

---

## STEG 2 — berikningen, om steg 1 tillåter

### 2a · Kausal metadata på chansskapande och bolltapp

Varje event som skapar en chans eller tappar bollen bär varför — **när motorn kan belägga det.**

```ts
primaryCause?: string
contributingFactors?: string[]
responsiblePlayerId?: string
involvedPlayerIds?: string[]
```

Alla fält är valfria med avsikt. Ett event utan beläggbar orsak bär ingen.

Källorna ger orsakerna. Från backen: zonmarkering, överlämning som brister. Från halven: missad markering av djupledslöpning — och Einarsson beskriver exakt hur den ser ut, *"en lång lyra som går fram till en fri spelare som kommer in från kanten"*. Från liberon: raka djupledsbollar är hans ansvar, frilägen från kanten är halvens eller backens.

**Den distinktionen ska in** om motorn kan belägga den. Den avgör vem `responsiblePlayerId` pekar på, och den är belagd av en elitspelare i positionen.

### 2b · Målets ursprung, inte en platt enum

Inte `goalType: 'corner' | 'flip' | 'solo'`. Flipp och retur är olika sorters egenskap.

```ts
origin: 'OPEN_PLAY' | 'CORNER' | 'FREE_HIT' | 'PENALTY'
chanceType?: 'BREAKAWAY' | 'ESTABLISHED' | 'TRANSITION' | 'REBOUND'
finalAction?: string
buildUp?: string[]
```

Fyll bara det motorn faktiskt vet. Ett fält som gissar är värre än ett tomt.

### 2c · `manpowerState` som löpande tillstånd

Numerärt läge per possession, inte utvisningsminuter i efterhand. **Bara registreringen** — ingen påverkan på sannolikheter, det är V2.

Skälet att göra det nu: referatet kan säga *"Edsbyn utnyttjar övertaget"* i stället för att rapportera ett mål utan sammanhang, och statistiken kan skilja på mål i numerärt läge.

### 2d · Vad som INTE ska bli event

Regeln, och den är GPT:s: ett event ska finnas om det påverkar matchens state, statistiken, spelarbedömningen, den taktiska analysen eller referatet. Annars inte.

Ingen `PLAYER_ADJUSTED_POSITION`. Ingen `DEFENDER_LOOKED_LEFT`. Motorn ska inte explodera i fotnoter.

---

## Vad berikningen låser upp

Tre beställda poster **slutar vara separata problem.** Om eventet bär vad som hände, vem som gjorde det, vem som misslyckades och varför situationen uppstod, läser tre lager samma data:

**`B5` referatet:** *"En lång lyra hittar Larsson bakom vänsterhalven."*
**`B4` efteranalysen:** *"Tre av fyra frilägen skapades bakom er vänstersida."*
**`O16` utvärderingen:** *"Vänsterhalven var ansvarig för två missade djupledssituationer."*

Samma fakta, olika presentation. Det är motsatsen till den arkitektur vi ägnat tretton dygn åt att rensa bort: tre system som var och ett tolkar samma verklighet på sitt eget sätt.

**Och en fjärde som följer gratis:** spelarbetyg som känner till negativa prestationer. En halv med noll mål och nittioen procent passningar kan ha tappat tre djupledslöpningar. Det är ett sannare betyg än något vi har.

`O16` ändras också: jag skrev att bara kopplingar `MatchResult` redan har siffror för ska byggas. Med beläggbar kausalitet blir listan längre **och korrekt** i stället för approximativ.

---

## Ordning

Steg 1-rapporten först, alltid. Sedan 2a → 2c → 2b, i den ordningen: `cause` är det som betalar sig mest, `manpowerState` är minst riskabelt, målets ursprung är det som kräver mest kunskap om motorns interna beslut.

Stresstest före och efter **varje** delsteg, inte bara i slutet. Läcker något in i beräkningen vill vi veta vilket delsteg som gjorde det.

**Bygg inget av V2, uttryckligen:** ingen possession-motor, inga nya sex taktikdimensioner, inget nytt rollsystem, inga nya spelarattribut, ingen ny spatial simulering, ingen ändring av action- eller chanssannolikheter, ingen omkalibrering av `matchCore`. Ingen generering av taktiska events som `PRESS_LINE_BROKEN`.

Allt det dokumenteras separat som V2-underlag och tas efter releasen.
