# High 2 — Utmattningens spelbarhet, förslag (2026-08-22, RAPPORT, inte byggt)

Jacobs order: "spelklarhetsgrind under 20–25 %, 'Fyll bästa' optimerar mot matchvärdering inte CA. Rapportera förslaget före kalibrering." Detta dokument svarar på den ordern — inget kodat än, magnituderna väntar Jacobs dom.

## Rotorsaken, bekräftad i kod

**Två olika formler avgör "vem är bra att sätta" och "vem presterar faktiskt bra" — och de viktar fitness helt olika.**

1. **`spelklarhet()`** (`src/presentation/utils/lineupNudge.ts:21-23`), som "Fyll bästa elvan" sorterar efter:
   ```ts
   currentAbility * 0.7 + form * 0.2 + fitness * 0.1
   ```
   Fitness väger **10 %**. En stjärna på 0 % fitness slår fortfarande en medioker spelare på 80 % fitness i den här sorteringen, eftersom CA-gapet (70 % vikt) nästan alltid överväger ett helt fitness-tapp.

2. **`playerModifier()`** (`src/domain/services/squadEvaluator.ts:41-48`), som den FAKTISKA matchvärderingen bygger på:
   ```ts
   base = (form/100)*0.4 + (effectiveFitness/100)*0.6
   ```
   Fitness väger **60 %** här — motsatt prioritering. En spelare på 0 % fitness bidrar nästan ingenting i denna formel, oavsett CA.

**Konsekvensen är exakt vad auditen såg:** "Fyll bästa" väljer en elva `spelklarhet()` anser stark, men `playerModifier()` (den formel matchmotorn faktiskt använder) värderar samma elva mycket lägre. Spelaren får en trupp som SER bra ut i UI:t men presterar sämre än den kunde — utan att någonsin ha blivit varnad om varför.

**Textsidan:** `STARTED_TIRED_OUTCOMES` (`src/domain/data/managerKvittoText.ts:56-60`) har redan tre riktningar (good/bad/neutral) för en trött startande spelare — men riktningen väljs av spelarens FAKTISKA matchbetyg, inte av fitness-nivån direkt. Matchmotorn straffar inte 0 % fitness hårt nog i outputen (se punkt 2 ovan svagt vikt-genomslag), så en utmattad spelare kan fortfarande få en `good`-rad ("Höll trots tunga ben") — texten ljuger inte om reglerna, men reglerna gör 0 % för spelbart.

## Förslaget (Jacobs två alternativ, båda skisserade — han väljer)

### Alternativ A — hård spelklarhetsgrind

Ny konstant, t.ex. `SPELKLARHET_FITNESS_FLOOR = 22` (mitt i Jacobs 20–25%-spann, inte hans låsta tal): en spelare under detta fitness-golv exkluderas helt ur `buildNudgeLineup()`s "bästa 11"-pool, oavsett CA — samma idiom som `AI_FITNESS_FLOOR = 40` redan använder i `matchSimProcessor.ts` för AI-lagens rotation (etablerat mönster, inte en ny mekanism). Enkelt att resonera om, men en hård kant: 21% och 23% behandlas helt olika.

### Alternativ B — kraftigt icke-linjär fitnessvikt i `spelklarhet()`

Byt den linjära `fitness * 0.1`-termen mot en kurva som straffar branten under en tröskel, t.ex.:
```ts
const fitnessFactor = fitness >= 50 ? 1.0 : Math.pow(fitness / 50, 2.5)
return (currentAbility * 0.7 + form * 0.2) * fitnessFactor + fitness * 0.1
```
(exakt formel INTE dömd — illustrerar bara "brant, inte linjärt"). Mjukare övergång än A, men svårare att kalibrera exakt mot Jacobs 20–25%-spann utan en siffersimulering.

**Min rekommendation, inte en dom:** A är enklare att verifiera (en tröskel, ett booleskt uteslutande) och matchar redan `AI_FITNESS_FLOOR`s etablerade mönster — men B degraderar mjukare för en tunn trupp utan ersättare (Skutskär-scenariot: om ALLA tillgängliga spelare i en position ligger under golvet tvingas A välja NÅGON ändå — samma spärr som `AI_FITNESS_FLOOR` redan har via `benchPool`-fallbacken). Jacob dömer.

### "Fyll bästa" ska optimera mot matchvärdering, inte CA

Oavsett A/B: `buildNudgeLineup()`s sortering (`lineupNudge.ts:44`, `sorted.sort((a,b) => spelklarhet(b) - spelklarhet(a))`) bör bytas till att sortera efter `playerModifier()`-liknande matchvärdering (eller en importerad delad funktion — `squadEvaluator.ts`s `playerModifier` är redan exporterbar) i stället för `spelklarhet()`. Det är den mekaniska kärnan i "optimera mot faktisk matchvärdering, inte CA" — annars löser A/B bara SYMPTOMET (0% kommer med) utan att fixa SORTERINGEN (fortfarande CA-dominant för alla ÖVRIGA fitness-nivåer).

### Copy vid 0 % — riktningen finns redan, tröskeln saknas

`STARTED_TIRED_OUTCOMES` har redan good/bad/neutral. Förslag: en FJÄRDE, explicit riktning (eller ett hårt villkor som alltid tvingar `bad` när fitness < golvet) så en spelare under spelklarhetsgränsen aldrig kan få en `good`-rad, oavsett matchbetyg. Detta är en TEXT-KOPPLING (vilken rad väljs), inte ny text — `bad`-poolen finns redan ("De tunga benen syntes...").

### "Bästa nu" vs "bästa om du skyddar säsongen" — två val

Auditens förslag om två separata "Fyll bästa"-lägen (kortsiktigt maximum vs. skydda truppen) är en UI-/interaktionsförändring, inte bara en formel — matchar CLAUDE.md Princip 4 (mock-driven design) om den blir mer än en knapptext-ändring. Flaggat, inte skisserat i detalj här — kräver ett UI-beslut (Opus/Design) om det blir aktuellt.

## Vad som INTE är byggt i detta pass

Ingenting kodat. Väntar Jacobs dom på: (1) A eller B, (2) exakt tröskel/kurva, (3) om "Fyll bästa"-sorteringen byts till matchvärdering i samma pass eller separat, (4) om copy-kopplingen (tvingad `bad` under golvet) ska byggas nu eller vänta på magnitud-domen.
