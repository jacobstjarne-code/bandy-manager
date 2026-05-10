# SPEC: Liga-anslag (fas-anslag, v1 — variants-arkitektur)

**Datum:** 2026-05-08
**Författare:** Opus
**Status:** SPEC v2 — variants-arkitektur + uppdaterade texter + korrigerade trigging-villkor
**Beroende:** `docs/SPEC_CUP_ANSLAG_2026-05-08.md` (datastruktur + pickAnslagVariant). Cup-anslag är redan implementerat (commit `5921d95`).

---

## Bakgrund

Liga-säsongen är 22 omgångar — utan kapitel-markörer blir den monoton. Detta utvidgar anslag-systemet till ligan med 6 nya AnslagKey, samma datastruktur (variants-array) som cup-anslagen.

**Korrigering från tidigare spec:** Trigging-villkoren använde `currentLeagueMatchday` som inte mappar till round-systemet i koden. Korrekt mapping är `leagueRound` (1-22 enligt `seasonPhases.ts`).

---

## Korrigerad kalender-mapping

Baserat på `src/domain/data/seasonPhases.ts`:

```
FunctionaryPhase (22 omgångar grundserie):
  round 1-3   → höststart
  round 4-6   → höst
  round 7-11  → annandagen   ← annandagsbandyn (26 dec) ligger här
  round 12-16 → vinter / vinterkris
  round 17-20 → våroffensiv
  round 21+   → slutspurt
```

Min föregående trigging på `matchday 11-13` var fel — det är inte en specifik fas. Korrekt:

| Anslag | Round-villkor | Tonalitet matchar |
|---|---|---|
| `league_start` | `cupBracket.completed && leagueRound < 1` | innan första liga-match |
| `league_midwinter` | `leagueRound >= 7 && leagueRound <= 9` | tunga januari, mitten av "annandagen"-fasen |
| `league_halfway` | `leagueRound === 11` | halvvägs (en gång, inte spann) |
| `playoff_qualification` | `leagueRound >= 19 && !leagueComplete` | våroffensiv/slutspurt |
| `playoff_start` | `managedClubInPlayoffs && firstPlayoffMatchUpcoming` | playoff-fas |
| `season_done` | `managedClubLastSeasonMatchCompleted` | efter sista match |

`league_midwinter` triggar vid round 7-9. `league_halfway` triggar exakt vid round 11. Olika moments, ingen krock.

---

## Liga-anslag — alla varianter

### `league_start` — Helgen kommer

Triggas innan första liga-match.

```ts
{
  chapter: '⬩ Helgen kommer ⬩',
  variants: [
    {
      // Variant A — observerande, övergång (originaltext)
      body: `Ligan börjar i helgen. 22 omgångar framför oss.<br><br>Cupen är cupen. Ligan är något annat — det är det som mäts på riktigt, det är vad folk minns en klubb för.<br><br>Det blir mörkare nu. Tisdagsträningarna får lampor på. Det här är säsongens långa parti.`,
    },
    {
      // Variant B — november-atmosfär
      body: `November. Frosten ligger på allvar nu. Ispremiären ligger bakom oss.<br><br>Ligan börjar i helgen. 22 omgångar — och med det själva poängen med en bandysäsong. Cupen var uppvärmning. Det här är arbetet.<br><br>Spelarna vet det. Klacken vet det. Nu kör vi.`,
    },
    {
      // Variant C — klubbnivå, planering
      body: `22 omgångar. Lördagsmatcherna börjar. Annandagen och nyårsbandy någonstans i mitten. Sen slutspel om vi orkar dit.<br><br>Det är inte cupen. Det är inte en helg. Det är fyra månader.<br><br>Det börjar i helgen.`,
    },
  ],
}
```

---

### `league_midwinter` — Januari

Triggas round 7-9, mitten av "annandagen"-fasen.

```ts
{
  chapter: '⬩ Januari ⬩',
  variants: [
    {
      // Variant A — atmosfärisk, mörker (originaltext, korrigerad terminologi)
      body: `Det är mitten av januari. Halva ligan är kvar.<br><br>Ingen pratar om januari som om den var rolig — den är det inte. Mörkt över halva dagen, tisdagsträning i blöt vinter, helgmatcher där isen är mjuk i andra halvlek.<br><br>Det är ändå nu det avgörs. Inte när det är ljust och alla mår bra, utan när det är fyrtio dagar kvar till våren och ingen orkar längre. Bandy är bandy.`,
    },
    {
      // Variant B — klubbnivå, vardagsleda
      body: `Januari är inte rolig. Det är det inget lag som påstår.<br><br>Bilar startar inte. Spelare tappar tändning. Halva ledarstaben funderar på det de skulle gjort istället. Sen kommer lördagen, då spelar man bandy igen — och det är ändå anledningen till att vi finns.<br><br>Halva ligan är kvar. Det är där vi bestämmer vad vi är.`,
    },
    {
      // Variant C — atmosfärisk, mörkast
      body: `Det är mitten av januari. Solen kommer upp efter morgonträningen och går ner under eftermiddagsmötet. Däremellan finns ingen tid och ändå ska allt göras.<br><br>Vi spelar bandy ändå. Det är vad vi kan.<br><br>Halva ligan är kvar. Säsongen ligger där den ligger.`,
    },
  ],
}
```

---

### `league_halfway` — Halvvägs

Triggas exakt vid round 11.

```ts
{
  chapter: '⬩ Halvvägs ⬩',
  variants: [
    {
      // Variant A — observerande, tabell-fokus (originaltext, korrigerad "september" → "november")
      body: `Halva serien spelad. Lika många matcher kvar.<br><br>Tabellen börjar betyda något nu. I november var den en lista. Nu är det positionerna man räknar med, marginalerna man oroar sig över. Var det nere på sju poäng vi ville vara? Det var det.<br><br>Det är inte cupen. Det är inte slutspelet. Det är det här — den långa biten där man får det man förtjänar. Ungefär.`,
    },
    {
      // Variant B — klubbnivå, vad har förändrats
      body: `Halva ligan spelad. Träningskvällarna är nu vana, inte uppstart. Skadorna börjar märkas. Krångliga relationer mellan vissa spelare också.<br><br>Tabellen står där den står. Man kan inte gnälla över halva sträckan. Det är resultatet.<br><br>Halv vägen kvar. Det är fortfarande spelat.`,
    },
    {
      // Variant C — atmosfärisk, övergångskänsla
      body: `Det är inte längre en ny säsong, men inte heller slutet. Vi är där vi alltid hamnar — i bandyårets långa mitt.<br><br>Tabellen är realitet nu. Förra månaden hoppades vi. Nästa månad räknar vi.<br><br>Halva ligan kvar.`,
    },
  ],
}
```

---

### `playoff_qualification` — Marginaler

Triggas när 3 grundserieomgångar är kvar (round >= 19).

```ts
{
  chapter: '⬩ Marginaler ⬩',
  variants: [
    {
      // Variant A — observerande över fältet (originaltext, korrigerad "hallar" → "orter")
      body: `Tre omgångar kvar. Tabellen är inte längre en lista — den är ett pussel.<br><br>De flesta vet redan om de är i eller ute. Några klubbar vet inte. De räknar varandras matcher, läser tabellen flera gånger om dagen, lyssnar på radio från andra orter. Vad mötte de? Vad behövde de?<br><br>Det är det här som är slutet på en grundserie. Marginaler.`,
    },
    {
      // Variant B — psykologi, spelar-fokuserad
      body: `Tre omgångar kvar. Spelarna räknar målskillnad i sömnen.<br><br>Det är ingen som spelar fritt nu. Det är spel där varje boll betyder något, varje förlorad sekund kostar. Tränaren skäller mer. Klacken klappar lite snabbare. Domarna är mer noggranna än vanligt.<br><br>Marginalsäsong. Det är nu det syns.`,
    },
    {
      // Variant C — klubbnivå, krocken mellan god och mindre god säsong
      body: `Vi vet vart vi är. De andra vet vart de är. Tabellen lämnar inget åt fantasin med tre omgångar kvar.<br><br>Antingen är vi nästan där eller också är vi nästan inte. Det är skillnad mellan en plats högre och en plats lägre. Det är skillnad mellan en god säsong och en mindre god.<br><br>Det avgörs inte i kvart. Det avgörs här.`,
    },
  ],
}
```

---

### `playoff_start` — Slutspelet

Triggas vid första playoff-match. Bara för spelare som kvalat.

```ts
{
  chapter: '⬩ Slutspelet ⬩',
  variants: [
    {
      // Variant A — observerande, format-skifte (originaltext)
      body: `Slutspelet är här. Allt från grundserien räknas inte längre.<br><br>22 omgångar har avgjort vilka som spelar. Sen är det noll igen. Du har matcher att vinna, och om du förlorar tillräckligt är du borta. Det enkla i bandy.<br><br>Klacken vet det. Spelarna vet det. Hela klubben skiftar takt. Det är annorlunda nu.`,
    },
    {
      // Variant B — mars-stämning, vintern släpper
      body: `Mars. Solen står lite högre, dagarna är lite längre — men på isen är det fortfarande vinter.<br><br>Slutspelet börjar. Det är därför vi tränat hela hösten, varit ute hela vintern. Det är därför 22 omgångar inte var nog. Det här är hela poängen.<br><br>Vinst eller förlust. Inget mellanting.`,
    },
    {
      // Variant C — klubbnivå, intensitet
      body: `Slutspel. Träningstiden krymper. Matcherna blir tätare. Allt fokus är på den som kommer.<br><br>Spelarna sover lite sämre. Tränarna tittar på film till sent. Klacken kommer fram tidigare till matcherna.<br><br>Det är därför vi finns. Bandyklubbar handlar om det här.`,
    },
  ],
}
```

---

### `season_done` — Sommaren kommer

Triggas efter spelarens sista match i säsongen — slutspels-final, slutspels-elimination, eller sista grundserie-omgång (för icke-kvalade).

```ts
{
  chapter: '⬩ Sommaren kommer ⬩',
  variants: [
    {
      // Variant A — observerande, övergång (originaltext, korrigerad "augusti" → "oktober")
      body: `Säsongen är slut.<br><br>Det blev som det blev. Några matcher man minns, några man helst glömmer. Tabellen står som den står. Pokalen någonstans, eller inte.<br><br>Sen kommer sommaren. Spelarna åker hem. Träningskläder ska tvättas, kontrakt ska skrivas, någon ska säga upp och någon ny ska komma. I oktober är det igång igen.`,
    },
    {
      // Variant B — klubbnivå, övergång
      body: `Säsongen är slut. Sista matchen ligger bakom oss.<br><br>Klubbhuset är fortfarande öppet, men med färre spelare i, kortare möten, mindre brådska. Sen blir det stängt. Ungefär två veckor i april och så börjar planeringen för hösten igen.<br><br>Bandy är cykliskt. Det är därför man håller ut.`,
    },
    {
      // Variant C — lakoniskt, reflekterande
      body: `Det blev en säsong. Som alla andra och inte heller det.<br><br>En del gick bra. En del gick mindre bra. En del hade vi inte ens räknat med. Sånt som skedde mellan oss och som inte syns i tabellen.<br><br>I oktober är det igång igen. Tills dess.`,
    },
  ],
}
```

---

## Service-logik

```ts
// Utvidga computeNextAnslag i anslagService.ts

// Liga-anslag
if (cupIsDone(game) && !leagueHasStarted(game) && !seen.includes('league_start')) {
  return 'league_start'
}

if (leagueHasStarted(game)) {
  const round = currentLeagueRound(game)
  
  // Halvvägs först (mer specifikt än midwinter)
  if (round === 11 && !seen.includes('league_halfway')) {
    return 'league_halfway'
  }
  
  // Midwinter — round 7-9
  if (round >= 7 && round <= 9 && !seen.includes('league_midwinter')) {
    return 'league_midwinter'
  }
  
  // Marginaler — sista 3 omgångarna
  if (round >= 19 && !leagueComplete(game) && !seen.includes('playoff_qualification')) {
    return 'playoff_qualification'
  }
}

if (managedClubInPlayoffs(game) && firstPlayoffMatchUpcoming(game) && !seen.includes('playoff_start')) {
  return 'playoff_start'
}

if (managedClubLastSeasonMatchCompleted(game) && !seen.includes('season_done')) {
  return 'season_done'
}
```

**Prioritetsordning:** halfway > midwinter > qualification (om alla samtidigt sanna). Det säkerställer att specifika moments (halvvägs, exakt round 11) inte överlappas av spann (midwinter, round 7-9).

---

## Datastruktur — utvidgning

```ts
import type { AnslagText } from './types'

export type LeagueAnslagKey =
  | 'league_start'
  | 'league_midwinter'
  | 'league_halfway'
  | 'playoff_qualification'
  | 'playoff_start'
  | 'season_done'

export const LEAGUE_ANSLAG: Record<LeagueAnslagKey, AnslagText> = {
  // ... alla 6 enligt ovan
}
```

`AnslagKey`-typen utvidgas till att inkludera båda:
```ts
export type AnslagKey = CupAnslagKey | LeagueAnslagKey
```

---

## Säsongs-byte: rensa `seenAnslag`

Vid säsongs-byte ska `seenAnslag` rensas. **Detta är redan implementerat** för cup-anslagen i `seasonEndProcessor.ts`. Verifiera att alla nya `LeagueAnslagKey` också rensas — bör fungera automatiskt eftersom hela `seenAnslag`-arrayen sätts till `[]`.

---

## Acceptanskriterier

- [ ] 6 nya `LeagueAnslagKey`-värden i typsystemet
- [ ] `LEAGUE_ANSLAG`-data exporterad från `src/domain/data/anslag/leagueAnslag.ts` med variants per anslag (18 texter totalt)
- [ ] `computeNextAnslag(game)` returnerar rätt liga-anslag i rätt ordning enligt prioritetsordningen
- [ ] Round-baserad trigging: `league_midwinter` triggar round 7-9, `league_halfway` exakt round 11
- [ ] Spelar-spår fungerar: kvalad till slutspel får `playoff_start`, andra får inte
- [ ] `season_done` triggas efter sista match oavsett slutspel-status
- [ ] `seenAnslag` rensas vid säsongs-byte (verifiera med integrationstest)
- [ ] `pickAnslagVariant` används för variant-val
- [ ] Tester gröna (se `CODE_INSTRUCTION_ANSLAG_VARIANTS`)
