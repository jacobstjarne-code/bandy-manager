# SPEC: Rik matchupplevelse — kontextuell kommentar, narrativ båge, händelsevariation

Ersätter ingenting. Bygger ovanpå befintligt commentary-system.

`npm run build && npm test` efter varje sprint.

---

## BAKGRUND

Matchen är spelets kärna men kommentarerna upplevs som repetitiva. Problemet är att varje kommentar väljs oberoende av allt annat — den vet inte vad som hände för 5 minuter sen, hur matchen står, om det är derby, om kaptenens favoritspelare just bombat in sitt tredje mål på två matcher.

Lösningen har tre delar som kan implementeras i sekvens men som hänger ihop:
1. **Kontextuell kommentar** — befintliga pools utökas med kontext-triggers
2. **Narrativ båge** — matchen har faser som påverkar ton och frekvens
3. **Händelsevariation** — nya typer av matchhändelser utöver mål/miss/räddning

### Principer
- P4-radio, inte BBC. Kommentatorerna pratar som bandymänniskor.
- Aldrig överlastat — max 1 kontextlager per kommentar.
- Kommentarerna ska göra att spelaren *ser* matchen för sitt inre öga.
- Wireas genom befintliga system (storylines, traits, supporterService), inga nya entiteter.
- Kalibreringsdata (Bandygrytan) vässar konstanterna men specen funkar utan.

---

## FAS 1: KONTEXTUELL KOMMENTAR

### 1.1 Matchsituationskontext

**Fil:** `matchCommentary.ts` — nya pools

Idé: kommentatorn vet vad som händer i matchen och reagerar på det.

```typescript
// Ny sektion: situationskommentarer
// Triggras av matchstate, inte av händelsetyp

situational_dominating: [
  '{team} håller bollen som en katt med en mus. Det här går bara åt ett håll.',
  'Total kontroll. {team} spelar runt {opponent} som koner på träningen.',
  '{opponent} har knappt rört bollen de senaste minuterna.',
  'Det börjar bli generande nu. {team} gör vad de vill.',
],

situational_under_pressure: [
  '{team} trycker ihop sig. Allt handlar om att överleva just nu.',
  'Det är kanoneld mot {team}s mål. Målvakten jobbar övertid.',
  '{opponent} vädrar blod. Våg efter våg.',
  'Nu ska vi se vad {team} är gjorda av. Det pumpas in bollar.',
],

situational_tight: [
  'Jämnt som tusan. Ingen vill göra det första felet.',
  'Det här är schack på is. Båda lagen respekterar varandra.',
  'Försiktigt nu. Ingen vill släppa in det första målet.',
],

situational_opened_up: [
  'Nu har matchen öppnat sig! Det går fram och tillbaka!',
  'Helt öppen match nu. Försvaret har glömt var de bor.',
  'Det är hög underhållning — men någon tränare gråter bakom glaset.',
],
```

**Trigger-logik i matchStepByStep.ts:**

```typescript
// Ny hjälpfunktion:
function getMatchSituation(
  homeShots: number, awayShots: number,
  homeCornersRecent: number, awayCornersRecent: number,
  homeScore: number, awayScore: number,
  step: number,
): 'dominating_home' | 'dominating_away' | 'tight' | 'opened_up' | 'neutral' {
  const shotDiff = homeShots - awayShots
  const recentPressure = homeCornersRecent - awayCornersRecent
  const goalTotal = homeScore + awayScore
  
  if (shotDiff > 4 && step > 10) return 'dominating_home'
  if (shotDiff < -4 && step > 10) return 'dominating_away'
  if (goalTotal >= 6 && step > 20) return 'opened_up'
  if (goalTotal <= 1 && step > 25) return 'tight'
  return 'neutral'
}

// Infoga i steg-loopen, var 8-12:e steg (inte varje steg!):
if (step % situationalInterval === 0 && situation !== 'neutral') {
  // Välj commentary från rätt pool
  // situationalInterval = randRange(rand, 8, 12)
}
```

### 1.2 Säsongskontext i kommentarer

**Fil:** `matchCommentary.ts` — nya pools

```typescript
context_season_opener: [
  'Säsongspremiär. Ny termos, nya förhoppningar, samma gamla läktare.',
  'Första matchen. Alla lag är lika bra i september. Sen visar verkligheten sig.',
],

context_title_race: [
  'Tabelltoppen. Allt hänger på de sista omgångarna. {team} vet vad som krävs.',
  'Det här kan vara matchen som avgör var guldet hamnar.',
],

context_relegation: [
  'Nederst i tabellen. Varje poäng väger som guld.',
  'Desperation på bänken. {team} kan inte tappa fler poäng.',
],

context_cup_final: [
  'Cupfinal. Alla ögon på {team}. Nerver av stål krävs.',
  'En match. En chans. Inget mer. Cupfinalen har börjat.',
],

context_comeback_chasing: [
  '{team} jagar. Klockan tickar. Publiken trycker på.',
  'Tränaren pekar framåt. {team} måste chansa nu.',
],

context_protecting_lead: [
  '{team} drar ner tempot. Erfarenhet framför finess nu.',
  'Klockan är {team}s bästa vän. Minterna rinner iväg.',
],
```

**Trigger:** `context_*`-pools triggras av `game.standings`, `fixture.matchday`, `fixture.isCup` som redan finns i `StepByStepInput`. Infoga vid steg 0 (kickoff), steg 30 (halvtid), steg 50+ (slutminuter).

### 1.3 Spelarkontext — utöka det vi har

Traits finns redan (`getTraitCommentary`). Utöka med:

```typescript
// Ny: spelarens formkontext
context_player_hot_streak: [
  '{player} igen! Tredje målet på två matcher. Han kan inte sluta göra mål.',
  '{player} — den hetaste spelaren i serien just nu.',
  'Ingen kan stoppa {player}. Det är fjärde omgången i rad med poäng.',
],

context_player_drought: [
  'Äntligen! {player} bryter torkan. Det var ett tag sedan sist.',
  '{player} har kämpat. Men den här gången sitter den. Lättnad.',
],

context_captain_moment: [
  'Kaptenen kliver fram. © på armen, ansvar i blicken.',
  'Det är därför han har bindeln. {player} gör det som krävs.',
],

context_fan_favorite: [
  'Klackens favorit! {player} får läktarna att sjunga!',
  '{player} — publiken ÄLSKAR honom. Och det är inte svårt att förstå varför.',
],

context_youth_debut: [
  'Och så gör 17-åringen sitt första ligamål! {player} — minns det namnet.',
  '{player} från P17 in i startelvan och rakt in i historieböckerna!',
],
```

**Trigger:** Kolla `player.seasonStats`, `player.careerStats`, `captainPlayerId`, `fanFavoritePlayerId` — allt redan tillgängligt i `StepByStepInput`.

### 1.4 Utvisningskontext

```typescript
context_suspension_frustration: [
  '{player} kokar av frustration. 10 minuter — och det vid {score}.',
  'Onödigt. Helt onödigt. {player} visas ut när laget behöver varenda man.',
],

context_suspension_tactical: [
  'Taktisk utvisning? {player} stoppade en farlig kontra. Värt priset, kanske.',
  '{player} tar straffet. Ibland måste man offra sig.',
],

context_shorthanded_surviving: [
  '{team} överlever! 10 man i 10 minuter och nollan hålls!',
  '{player} är tillbaka. {team} andas ut — utvisningen kostade ingenting.',
],

context_shorthanded_conceding: [
  'Där kom det. Med en man mindre hade {team} ingen chans.',
  'Utvisningen straffar sig. {opponent} utnyttjar överskottet iskallt.',
],
```

**Trigger:** `activeSuspensions` finns redan i `MatchStep`. Tracka om mål görs under aktiv utvisning.

---

## FAS 2: NARRATIV BÅGE

### 2.1 Matchfaser

Varje match delas in i 5 faser som påverkar kommentarston, händelsefrekvens och vilka pools som används:

| Fas | Steg | Karaktär | Kommentar-ton |
|-----|------|----------|---------------|
| **Öppning** | 0-8 | Nervöst, avvaktande | Korta, sparsamma |
| **Etablering** | 9-25 | Taktik syns, mönster uppstår | Analytiska, taktiska |
| **Halvtidsspurt** | 26-29 | Tempo ökar inför paus | Intensiva, tempo |
| **Tryck** | 30-50 | Beror på ställning | Dynamiskt (se nedan) |
| **Slutakt** | 51-59 | Desperation eller kontroll | Drama, högtidligt |

**Fas 4 (Tryck) anpassas dynamiskt:**

```typescript
type SecondHalfMode = 
  | 'chasing'      // Ligger under — fler chanser, högre risk
  | 'controlling'  // Leder — färre chanser, mer bollinnehav
  | 'even_battle'  // Oavgjort — balanced, ökande desperation
  | 'cruise'       // Leder stort — tempot faller, ointressant

function getSecondHalfMode(
  managedScore: number, opponentScore: number,
  step: number,
): SecondHalfMode {
  const diff = managedScore - opponentScore
  if (diff <= -2) return 'chasing'
  if (diff >= 3) return 'cruise'
  if (diff >= 1 && step > 45) return 'controlling'
  if (diff === 0) return 'even_battle'
  return 'even_battle'
}
```

**Effekter per mode:**

```
chasing:
  - goalThreshold *= 1.08 (mer öppet spel → fler mål)
  - foulProb *= 1.15 (frustration)
  - commentary → situational_under_pressure, context_comeback_chasing
  - supporterkommentarer → late_home (om hemma) eller late_silent (om borta)
  
controlling:
  - goalThreshold *= 0.92 (stänger ner)  
  - cornerWeight += 5 (spelar säkert, mer hörnor)
  - commentary → context_protecting_lead
  
cruise:
  - commentary frekvens sänks (färre rader per steg)
  - "Matchen har tappat sin spänning. Publiken börjar röra sig mot utgångarna."
  
even_battle:
  - goalThreshold *= 1.04 mot slutet (ökande desperation)
  - foulProb *= 1.10 (hårdare närkamper)
  - commentary → situational_tight → situational_opened_up (om mål görs)
```

### 2.2 Momentum

Vi har MomentumBar i UI:t. Ge den en narrativ röst.

```typescript
// Nytt: momentum påverkar kommentarval
// Momentum beräknas redan (shots + corners + goals i senaste 5 steg)
// Triggra momentum-kommentarer vid kraftiga svängar

momentum_swing_home: [
  'Helt plötsligt är det {team}s match! Momentum har svängt!',
  '{team} rullar! Tre raka chanser. {opponent} kan inte få stopp.',
  'Publiken reser sig. Något är på gång.',
],

momentum_swing_away: [
  '{opponent} har tagit över. {team} ser vilsna ut.',
  'Det har vridits helt. {opponent} dikterar tempot nu.',
  'Tyst på hemmaplan. {opponent} kontrollerar matchen.',
],
```

### 2.3 Pacing — displaytiden per steg

CM:s genidrag: olika händelser visas olika länge. Vi kan styra detta i `MatchLiveScreen`:

```typescript
// I MatchLiveScreen eller matchLiveHelpers.ts:
function getStepDelay(step: MatchStep, autoSpeed: 'normal' | 'fast'): number {
  const base = autoSpeed === 'fast' ? 800 : 1600
  
  // Mål: lång paus (dramat!)
  if (step.events.some(e => e.type === 'goal')) return base * 2.5
  
  // Straff/hörna-interaktion: spelaren styr, ingen delay
  if (step.cornerInteractionData || step.penaltyInteractionData) return 0
  
  // Räddning: kort extra paus
  if (step.events.some(e => e.type === 'save')) return base * 1.5
  
  // Utvisning: lite extra
  if (step.events.some(e => e.type === 'suspension')) return base * 1.3
  
  // Slutminuterna (steg 55+): snabbare grundtempo
  if (step.step >= 55) return base * 0.8
  
  // Kryss i 80:e → tid mellan steg minskar (klockan tickar!)
  if (step.step >= 50 && step.homeScore === step.awayScore) return base * 0.7
  
  return base
}
```

---

## FAS 3: HÄNDELSEVARIATION

### 3.1 Nya sekvenstyper

Befintliga: `attack | transition | corner | halfchance | foul | lostball`

Nya (läggs till i SEQUENCE_TYPES och sekvensval):

```typescript
// Nya sekvenser — genererar INTE mål men ger variation och narrativ

'tactical_shift'   // Motståndaren ändrar uppställning
'player_duel'      // Två spelare i en personlig duell
'atmosphere'       // Publik/väder/stämning-kommentar
'offside'          // Offside-situation (bryter anfall)
'freekick_danger'  // Frislag nära mål (men inte straff)
```

**Vikt i sekvensval:**

```typescript
function buildSequenceWeights(step: number, situation: string): number[] {
  // [attack, transition, corner, halfchance, foul, lostball, 
  //  tactical_shift, player_duel, atmosphere, offside, freekick]
  
  const base = [30, 18, 32, 20, 12, 28, 4, 6, 5, 4, 5]
  
  // Atmosfär oftare i öppning och slut
  if (step < 5 || step > 55) base[8] += 4
  
  // Taktiska skiften i andra halvlek
  if (step >= 30 && step <= 35) base[6] += 3
  
  // Spelardueller oftare i tight match
  if (situation === 'tight') base[7] += 4
  
  // Offside oftare i andra halvlek (trötthet)
  if (step >= 30) base[9] += 2
  
  return base
}
```

### 3.2 Commentary för nya sekvenser

```typescript
tactical_shift: [
  '{opponent} byter formation. Ser ut som en tre-fem-tvåa nu.',
  'Omställning borta. Tränaren har reagerat efter målet.',
  '{opponent} drar sig tillbaka. 5-3-1 — defensivt nu.',
  'Nytt mönster hos {opponent}. Forwarden spelar bredare.',
],

player_duel: [
  '{player} och deras mittback har gått på varandra hela matchen. Personligt.',
  'Hård duell vid sargen! {player} reser sig, borstar av knäna och kör vidare.',
  '{player} vinner brittningen — tredje gången i rad. Dominerar sitt område.',
  'Kroppsspråket säger allt. {player} har hittat sin motståndare.',
],

atmosphere: [
  'En stund av stillhet. Bara isens knastrande hörs.',
  'Publiken stampar i läktarplankorna. Det ekar över hela vallen.',
  'Dimman lättar lite. Nu ser man hela planen igen.',
  'En termos öppnas på läktaren. Ångan stiger. Minus femton, men ingen klagar.',
  'Fåglarna har slutat sjunga. Det är bara bandy nu.',
  'Vaktmästaren nickar nöjt från sin bänk. Isen håller.',
  'Ljuset från strålkastarna glittrar i isen. Det är vackert.',
],

offside_call: [
  'Offside! Flaggan går upp. {team} ville ha frispark men domaren säger nej.',
  'Linjedomaren flaggar. Offside. {player} var steget för tidigt.',
  'Offside. Bra bevakning av {opponent}. De backlinjen sitter.',
],

freekick_danger: [
  'Frislag! {player} ställer sig vid bollen. 25 meter rakt in...',
  'Farligt läge. Frislag strax utanför. {team} samlar sig i muren.',
  'Frislagschans! {player} slår — MEN rakt i muren. Inget mer.',
  'Frislag. {player} väljer att slå kort. Besvikna röster från klacken.',
],
```

### 3.3 Domarens linje (kopplad till kalibrering)

```typescript
// Ny: domartyp per match (sätts vid matchstart)
type RefStyle = 'strict' | 'lenient' | 'inconsistent'

// Distribution (kan vässas med Bandygrytan-data):
// strict: foulProb *= 1.20, commentary refererar till "nolltolerans"
// lenient: foulProb *= 0.85, "domaren låter spelet flöda"
// inconsistent: slumpmässigt, "inkonsekvent linje — spelarna klagar"

referee_strict: [
  'Domaren har plockat fram armen tidigt. Nolltolerans ikväll.',
  'Ännu en utvisning. Det här är en domare som inte kompromissar.',
  'Pipa! Frislagsdömning nummer tio. Spelarna skaka på huvudet.',
],

referee_lenient: [
  'Domaren viftar vidare. Den gick igenom — men det var nära.',
  'Ingen pipa. Domaren låter spelet flöda. Det uppskattas på planen.',
],

referee_inconsistent: [
  'Domaren blåser FÖR? Den verkade ren? Spelarna förstår inte.',
  'Ibland pipa, ibland inte. Inkonsekvent linje idag.',
],
```

---

## IMPLEMENTATION — PRIORITERAD ORDNING

### Sprint A: Commentary-pools (Code, ~45 min)
1. Lägg till alla nya pools i `matchCommentary.ts`
2. Exportera typerna

### Sprint B: Kontextuell wiring (Code, ~60 min)
1. `getMatchSituation()` i matchStepByStep.ts
2. Infoga situationskommentar var 8-12:e steg
3. Wire `context_player_*` via seasonStats (hot_streak = goals >= 3 senaste 3 matcherna)
4. Wire `context_captain_moment` via captainPlayerId
5. Wire `context_fan_favorite` via fanFavoritePlayerId
6. Wire `context_suspension_*` via activeSuspensions + score diff

### Sprint C: Narrativ båge (Code, ~45 min)
1. `getSecondHalfMode()` — påverkar goalThreshold, foulProb, commentary-pool
2. Momentum-svängningsdetektering (om shots-diff svänger > 3 i 5 steg → trigger)
3. `getStepDelay()` i MatchLiveScreen (pacing)

### Sprint D: Händelsevariation (Code, ~60 min)
1. Nya sekvenstyper: `tactical_shift`, `player_duel`, `atmosphere`, `offside`, `freekick_danger`
2. `buildSequenceWeights()` — situationsberoende vikter
3. RefStyle-system (strict/lenient/inconsistent, sätts vid matchstart)

### Sprint E: Kalibreringsdata-hook (efter Bandygrytan-data landar)
1. Uppdatera TIMING_WEIGHTS med 5-min-data från calibrate_v2
2. Justera RefStyle-distribution baserat på utvisningar per säsongsfas
3. Justera secondHalfMode-trösklar baserat på comeback-effekten
4. Eventuell PP-effekt-multiplikator baserat på powerplay-analysen

---

## VERIFIERING

Starta nytt spel. Spela 3 matcher. Kontrollera:
- [ ] Situationskommentarer dyker upp (~2-3 per halvlek, inte fler)
- [ ] Säsongskontext i kickoff-kommentar (premiär, toppmatch, bottenlag)
- [ ] Spelarens form nämns vid mål (hot_streak / drought)
- [ ] Kapten/favoritspelare nämns vid relevanta händelser
- [ ] Utvisningskontext korrekt (frustration vid underläge, taktisk vid ledning)
- [ ] Matchens tempo varierar (öppning lugn, halvtidsspurt intensiv, slutminuterna snabba)
- [ ] Steg-delay anpassas (mål = lång paus, slutminuter = snabbare tempo)
- [ ] Nya händelser förekommer (atmosphere, player_duel, offside) utan att dominera
- [ ] Domarens linje konsekvent genom matchen
- [ ] ALDRIG fler än 2 kontextkommentarer i rad (blandas med vanliga)
- [ ] Inga duplicerade kommentarer inom samma match

---

## FAS 4: RIKARE MATCHSAMMANFATTNINGAR

### Nuläge

`getFinalWhistleSummary()` vet: marginal, sent mål, totala mål, hemma/borta.
`generateQuickSummary()` vet: målskyttar, hat-tricks, sent avgörande.
`MatchReportView` visar: arena, publik, events-tidslinje, spelarrating.

Ingen av dem vet: väder, rivalitet, tabellposition, hörnandel, kapten,
utvisningar, comebacks, säsongskontext, domarens linje.

### 4.1 Utöka getFinalWhistleSummary

**Fil:** `matchMoodService.ts`

Byt signatur till att ta emot rik kontext:

```typescript
interface FinalWhistleContext {
  myScore: number
  theirScore: number
  lateGoals: number
  totalGoals: number
  isHome: boolean
  // NYA:
  cornerGoals: number          // antal hörnmål (vi)
  totalCorners: number          // totala hörnor
  suspensionsUs: number         // våra utvisningar
  suspensionsThem: number       // deras utvisningar
  weatherCondition?: string     // 'heavySnow' | 'fog' | etc
  temperature?: number
  isRivalry: boolean
  rivalryName?: string
  isCup: boolean
  isPlayoff: boolean
  tabellPosition: number        // vår position
  round: number                 // omgångsnummer
  totalRounds: number           // 22 i grundserien
  comeback: boolean             // vi låg under vid halvtid och vann
  captainScored: boolean
  hatTrickPlayer?: string       // namn om någon gjort 3+
  potmName?: string             // player of the match
}
```

Sen bygg texten lager-för-lager:

```typescript
export function getFinalWhistleSummary(ctx: FinalWhistleContext): string {
  const lines: string[] = []

  // Lager 1: Resultat-basen (befintlig logik)
  lines.push(getResultLine(ctx))

  // Lager 2: Matchens karaktär (max 1)
  if (ctx.comeback) {
    lines.push('Vändningen var komplett — från underläge till seger.')
  } else if (ctx.cornerGoals >= 3) {
    lines.push('Hörnorna avgjorde. Tre mål från fasta situationer.')
  } else if (ctx.suspensionsUs >= 3) {
    lines.push('Disciplinen svek. Tre utvisningar är för mycket.')
  } else if (ctx.totalGoals >= 12) {
    lines.push(`${ctx.totalGoals} mål. En match man minns.`)
  } else if (ctx.totalGoals <= 3 && ctx.totalGoals > 0) {
    lines.push('Tight och taktiskt. Varje mål vägde tungt.')
  }

  // Lager 3: Kontext (max 1)
  if (ctx.isRivalry && ctx.myScore > ctx.theirScore) {
    lines.push(`${ctx.rivalryName} avgjort. Det här pratar orten om i veckor.`)
  } else if (ctx.isCup && ctx.myScore > ctx.theirScore) {
    lines.push('Vidare i cupen. Nästa omgång väntar.')
  } else if (ctx.isPlayoff) {
    lines.push('Slutspel. Varje match kan vara den sista.')
  } else if (ctx.round >= ctx.totalRounds - 2 && ctx.tabellPosition >= 10) {
    lines.push('Avgörande omgångar. Varje poäng räknas.')
  }

  // Lager 4: Väder/atmosfär (max 1, låg sannolikhet)
  if (ctx.weatherCondition === 'heavySnow' && ctx.totalGoals >= 8) {
    lines.push('Åtta mål i snöstorm. Bandy som det är tänkt.')
  } else if (ctx.temperature && ctx.temperature <= -15) {
    lines.push(`Minus ${Math.abs(ctx.temperature)}. Spelarna förtjänar varm choklad.`)
  }

  // Lager 5: Hjälte (max 1)
  if (ctx.hatTrickPlayer) {
    lines.push(`${ctx.hatTrickPlayer} med hattrick. Matchens stora namn.`)
  } else if (ctx.captainScored) {
    lines.push('Kaptenen klev fram och tog ansvar. Som det ska vara.')
  } else if (ctx.potmName) {
    lines.push(`${ctx.potmName} — matchens lirare.`)
  }

  return lines.join(' ')
}
```

Resultat: 2-4 meningar istället för 1. Varje match kan ha unik kombination
av resultat + karaktär + kontext + väder + hjälte.

### 4.2 Utöka generateQuickSummary

**Fil:** `GranskaScreen.tsx` → `generateQuickSummary()`

Skicka in rik kontext (samma pattern som ovan). Lägg till:

```typescript
// Hörnberättelse
if (cornerGoals >= 2) {
  lines.push(`Hörnorna var vapen ikväll — ${cornerGoals} mål på fasta.`)
}

// Utvisningsberättelse
if (ourSuspensions >= 2 && margin < 0) {
  lines.push('Utvisningarna kostade. Motståndarna utnyttjade varje överläge.')
} else if (theirSuspensions >= 2 && margin > 0) {
  lines.push('Disciplinproblem hos motståndarna öppnade dörren.')
}

// Väderberättelse
if (weather === 'heavySnow') {
  lines.push('Snön ställde till det för bägge lag. Bollkontroll var en lyx.')
} else if (weather === 'fog') {
  lines.push('Dimman lade sig i andra. Ibland var bollen osynlig.')
} else if (weather === 'thaw') {
  lines.push('Töväder. Banan var tung — det syntes på passningstempot.')
}

// Taktisk berättelse
if (shotsUs > shotsOpponent * 2 && margin <= 0) {
  lines.push('Skottstatistiken ljuger inte — men det gjorde resultatet.')
} else if (shotsOpponent > shotsUs * 2 && margin >= 0) {
  lines.push('Motståndarna sköt mer, men vi var effektivare.')
}

// Publikberättelse
if (attendance && attendance > 500) {
  lines.push(`${attendance} på läktarna. Rekord? Inte omöjligt.`)
}

// Rivalitetsberättelse
if (rivalry && margin > 0) {
  lines.push(`Derbyvinst. ${rivalry.name} — och vi gick segrande ur striden.`)
} else if (rivalry && margin < 0) {
  lines.push(`Förlust i ${rivalry.name}. Svårt att svälja.`)
}
```

### 4.3 Narrativ rubrik i MatchDoneOverlay

**Fil:** `MatchDoneOverlay.tsx`

Istället för bara "SEGER" / "FÖRLUST" — ge matchen en rubrik:

```typescript
function getMatchHeadline(
  managedWon: boolean, managedLost: boolean,
  margin: number, totalGoals: number,
  isRivalry: boolean, isCup: boolean, comeback: boolean,
  lateDecider: boolean,
): string {
  if (comeback && managedWon) return 'VÄNDNINGEN'
  if (isCup && managedWon && margin === 1) return 'CUPSKRÄLL'
  if (isCup && managedWon) return 'VIDARE'
  if (isRivalry && managedWon) return 'DERBYVINST'
  if (isRivalry && managedLost) return 'DERBYFÖRLUST'
  if (lateDecider && managedWon) return 'SENT AVGÖRANDE'
  if (lateDecider && managedLost) return 'BITTERT'
  if (managedWon && margin >= 4) return 'KROSS'
  if (managedWon && margin >= 2) return 'KONTROLL'
  if (managedWon) return 'SEGER'
  if (totalGoals >= 10 && !managedLost) return 'MÅLFEST'
  if (totalGoals === 0) return 'NOLLNOLLA'
  if (!managedWon && !managedLost) return 'OAVGJORT'
  if (managedLost && margin <= -4) return 'TUNGT'
  if (managedLost) return 'FÖRLUST'
  return 'SLUTSIGNAL'
}
```

"VÄNDNINGEN", "DERBYVINST", "CUPSKRÄLL" — det ger emotionell laddning.

### 4.4 Kontextuellt inslag i MatchReportView

**Fil:** `MatchReportView.tsx`

Lägg till ett kort "MATCHENS BERÄTTELSE" mellan score-bannern och events:

```tsx
{/* Matchens berättelse — 2-3 meningar */}
<div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 8 }}>
  <p style={{
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '2px', color: 'var(--accent)', marginBottom: 6,
  }}>MATCHENS BERÄTTELSE</p>
  <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
    {getMatchNarrative(fixture, game)}
  </p>
</div>
```

`getMatchNarrative()` kombinerar:
- Resultat-kontext ("Hemmaseger efter en jämn match")
- Nyckelmoment ("Vändningen kom i 34:e när Kronberg kvitterade")
- Matchens karaktär ("En hörnmatch — 14 hörnor, 3 hörnmål")
- Väder om relevant ("Snön ställde till det i andra halvlek")

Max 3 meningar. Aldrig överlastning.

### 4.5 Dagboken (DailyBriefing)

Dagboken borde också referera till matchen rikare:

```typescript
// I dagboksgenereringen efter match:
if (lastMatch.comeback) {
  '📰 "Fantastisk vändning" — lokaltidningen saknar ord.'
} else if (lastMatch.cornerGoals >= 3) {
  '📰 "Hörnspecialisterna" — rubriken i morgontidningen.'
} else if (lastMatch.attendance > previousRecord) {
  '📰 "Publikrekord!" — {attendance} trängde sig in.'
}
```

---

### Sprint F: Rikare sammanfattningar (Code, ~60 min)
1. Utöka `getFinalWhistleSummary` med `FinalWhistleContext`
2. Utöka `generateQuickSummary` med väder, hörnor, utvisningar, rivalitet
3. `getMatchHeadline()` i MatchDoneOverlay
4. "MATCHENS BERÄTTELSE" i MatchReportView
5. Dagboksreferens (DailyBriefing)

---

## FAS 5: NYA INTERAKTIVA MOMENT + TRE MATCHLÄGEN

### 5.1 Tre matchlägen

Spelaren väljer läge i MatchScreen (före matchen) eller i inställningar.

| Läge | Innehåll | Tempo | Interaktioner | Användning |
|------|---------|-------|---------------|------------|
| **🎥 Full match** | Allt: commentary, pacing, interaktioner | Styrt av getStepDelay | Hörnor, straffar, kontring, frislag, sista minuten | "Jag vill leva matchen" |
| **📝 Kommentar** | Commentary-text rullar, auto-resolve interaktioner | Snabbare (50% av Full) | Inga — alla auto-resolved med smart default | "Jag vill följa med men inte stoppa" |
| **⚡ Snabbsim** | Bara matchEngine.ts (instant), visar resultat + tidslinje | Instant | Inga | "Visa resultatet" |

**Implementation:**

```typescript
// Ny: matchMode i gameStore eller MatchScreen-state
type MatchMode = 'full' | 'commentary' | 'quicksim'
```

**Full match** — befintligt beteende, plus nya interaktioner.

**Kommentar** — använder samma `simulateMatchStepByStep` generator men:
- Alla `cornerInteractionData`-steg auto-resolves med `zone: 'center', delivery: 'hard'`
- Alla `penaltyInteractionData`-steg auto-resolves med `dir: 'right', height: 'low'`
- Alla nya interaktioner auto-resolves med default
- `getStepDelay()` * 0.5
- Inga interaktions-UI:n renderas
- Commentary-texten rullar i CommentaryFeed som vanligt
- Spelaren kan fortfarande göra halvtidsbyte och taktikändringar

**Snabbsim** — använder `simulateMatch()` (matchEngine.ts):
- Instant resultat
- Visa MatchDoneOverlay direkt med headline + sammanfattning
- Sen GranskaScreen med fullständigt matchreferat
- Spelaren gör INGA val under matchen (inga byten, ingen taktik)

**UI i MatchScreen (StartStep):**
```tsx
// Under "STARTA MATCHEN"-knappen:
<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
  <button onClick={() => setMode('full')}
    className={mode === 'full' ? 'btn-primary' : 'btn-muted'}>
    🎥 Full match
  </button>
  <button onClick={() => setMode('commentary')}
    className={mode === 'commentary' ? 'btn-primary' : 'btn-muted'}>
    📝 Kommentar
  </button>
  <button onClick={() => setMode('quicksim')}
    className={mode === 'quicksim' ? 'btn-primary' : 'btn-muted'}>
    ⚡ Snabb
  </button>
</div>
```

### 5.2 Nya interaktiva moment

Alla följer samma mönster som hörn/straff:
1. Service med data-interface + resolve-funktion
2. matchStepByStep.ts yieldar steg med `xxxInteractionData`
3. UI-komponent i `components/match/`
4. Resultat matas tillbaka
5. I Kommentar-läge: auto-resolve med default

---

#### 5.2.1 Kontringsval

**När:** Vårt lag bryter högt och får ett 3-mot-2 eller 2-mot-1-läge.
Trigger: `rand() < 0.08` av `transition`-sekvenser där managed team anfaller.
Max 2 per match.

**Ny service:** `counterAttackInteractionService.ts`

```typescript
export type CounterChoice = 'sprint' | 'build' | 'earlyBall'

export interface CounterInteractionData {
  minute: number
  runnerName: string
  runnerId: string
  runnerSpeed: number
  supportName: string     // närmaste medspelare
  supportId: string
  defendersBeat: number   // 1-3 (hur öppet det är)
}

export interface CounterOutcome {
  type: 'goal' | 'saved' | 'miss' | 'offside' | 'tackled'
  scorerId?: string
  scorerName?: string
  description: string
}

// sprint: hög chans om runner är snabb, risk för offside
// build: lägre chans men säkrare, aldrig offside
// earlyBall: pass till support — beror på bådas passing/shooting
```

**UI:**
```
┌──────────────────────────────────┐
│ ⚡ KONTRING — 43:e minuten     │
│                                  │
│ S. Kronberg springer fritt!      │
│ 2 mot 1 — L. Ek med i ryggen     │
│                                  │
│ [🏃 Spurta]  [🎯 Spela av]  [🧠 Bygga]│
│  Hög risk    Medium       Säkert  │
│                                  │
│ [      KÖR KONTRINGEN →      ]   │
└──────────────────────────────────┘
```

Snabbt beslut — ska kännas som 2 sekunder att välja.
Default (Kommentar-läge): `earlyBall`

---

#### 5.2.2 Farligt frislag

**När:** Foul i anfallszon (nivå 2 — inte straff, men 20-25 meter från mål).
Trigger: `rand() < 0.15` av fouls i anfallszon där managed team har bollen.
Max 1 per match.

**Ny service:** `freeKickInteractionService.ts`

```typescript
export type FreeKickChoice = 'shoot' | 'chipPass' | 'layOff'

export interface FreeKickInteractionData {
  minute: number
  kickerName: string
  kickerId: string
  kickerShooting: number
  kickerPassing: number
  distanceMeters: number   // 20-28
  wallSize: number         // 3-5
}

export interface FreeKickOutcome {
  type: 'goal' | 'saved' | 'wall' | 'wide' | 'corner_won'
  description: string
}

// shoot: direkt avslut, beror på shooting + distance, risk för mur
// chipPass: lyfter över muren till rusher, lägre målchans men ger hörna om miss
// layOff: spelar kort, bygger om — låg risk, låg reward
```

**UI:** Enkel — tre knappar + avståndsinfo + murens storlek.
Default (Kommentar-läge): `shoot`

---

#### 5.2.3 Sista-minuten-press

**När:** Managed team ligger under med 1 mål, steg >= 55 (minut 82+).
Trigger: automatiskt (inte slumpmässigt).
Max 1 per match.

**Ny service:** `lastMinutePressService.ts`

```typescript
export type PressChoice = 'allIn' | 'pushForward' | 'acceptResult'

export interface LastMinutePressData {
  minute: number
  scoreDiff: number        // -1 (eller -2)
  roundsLeft: number       // minuter kvar
  fatigueLevel: number     // lagets genomsnittliga trötthet
}

// allIn: +30% goalThreshold för resterande steg, men +25% foulProb
//        och +15% chans att SLÄPPA IN ("målvakten är framme")
// pushForward: +15% goalThreshold, +10% foulProb
// acceptResult: ingen ändring, matchen spelas ut lugnt
```

**UI:**
```
┌──────────────────────────────────┐
│ ⏰ 83:e MINUTEN — 0-1            │
│                                  │
│ Ni ligger under. 7 minuter kvar. │
│ Laget känner av matchbilden.      │
│                                  │
│ [🔥 Allt fram!]                   │
│   Hög risk. Målvakten fram.       │
│                                  │
│ [💪 Tryck på]                     │
│   Balanserat. Öka tempot.         │
│                                  │
│ [🧘 Acceptera]                    │
│   Spara energi. Nästa match.     │
└──────────────────────────────────┘
```

Det här är en *taktisk* interaktion, inte en bollinteraktion.
Påverkar matchmotorns konstanter för resterande 5-7 steg.
Default (Kommentar-läge): `pushForward`

---

#### 5.2.4 Taktisk timeout (framtida — kopplas till kalibrering)

Bandyn har inga formella timeouts som ishockey, men tränaren
kan signalera från bänken. Om Bandygrytan-datan visar att
timeouts (event type 6) tas vid specifika matchsituationer
kan vi bygga en "Tränaren ber om uppmärksamhet"-interaktion
där spelaren justerar taktik mitt i en halvlek.

Parkerad tills data finns.

### 5.3 Interaktionsfrekvens

För att inte överlasta spelaren:

| Interaktion | Max per match | Trigger-sannolikhet | Totalt förväntat |
|-------------|--------------|--------------------|-----------------|
| Hörna | 4 | ~35% av hörnor | ~2-3 per match |
| Straff | 1 | ~20% av fouls i anfallszon | ~0.3 per match |
| **Kontring** | 2 | 8% av transitions | ~0.5 per match |
| **Frislag** | 1 | 15% av fouls i anfallszon | ~0.3 per match |
| **Sista minuten** | 1 | Automatisk (underläge 82+) | ~0.3 per match |
| **TOTALT** | | | **~3-5 per match** |

3-5 interaktioner per match i Full-läge. Lagom för att känna sig
involverad utan att det blir ett casual game.

I Kommentar-läge: 0 interaktioner (alla auto-resolved).
I Snabbsim: 0 (inte ens commentary).

### 5.4 Grafiska moment

#### Hörna — redan SVG-baserad
Funkar. Behöver fixarna i SPRINT_ALLT_KVAR (1.2 + 2.3).

#### Straff — knappar idag, SVG möjlig
```
┌───────────────────────────────┐
│  ┌────────────────────────┐  │
│  │  ┌───┐ ┌───┐ ┌───┐  │  │
│  │  │ V  │ │ M  │ │ H  │  │  │
│  │  └───┘ └───┘ └───┘  │  │
│  │    ┌───────────┐    │  │
│  │    │  KEEPER  │    │  │
│  │    └───────────┘    │  │
│  └────────────────────────┘  │
│         ● Bollen                │
│  [⬆ Högt]              [⬇ Lågt] │
│  [    SKJUT STRAFFEN →     ]   │
└───────────────────────────────┘
```
SVG-mål med tre zoner att klicka på + höjdval.
Fråga till Erik: gör grafik för målbur sett från straffpunkten.

#### Kontring — mini-pitch-grafik
```
┌───────────────────────────────┐
│        □ Mål                  │
│      X   X                   │
│                               │
│    ● Runner  ○ Support         │
│                               │
│  [🏃 Sprint] [🎯 Pass] [🧠 Bygg] │
└───────────────────────────────┘
```
SVG med halva planen. Visar spelarpositioner och försvararnas läge.
Erik: enkel top-down-grafik för kontringsvy.

#### Frislag — mur-grafik
```
┌───────────────────────────────┐
│  ┌────────────────────────┐  │
│  │      │KEEPER│           │  │
│  └────────────────────────┘  │
│       ■■■■ MUR (4 man)         │
│                               │
│       22m                      │
│                               │
│       ● Bollen                 │
│  [💥 Skjut]  [⤴ Chip]  [↩ Kort]│
└───────────────────────────────┘
```
SVG med mål, mur, boll, avstånd.
Erik: murens grafik (rakt på, sett från skyttens perspektiv).

#### Sista minuten — ingen grafik, bara beslutskort
Samma card-sharp-stil som styrelsemöte. Tre val. Text. Direkt effekt.

---

### 5.5 Effekt på matchmotor

Nya interaktioner påverkar matchen på två sätt:

**Direkt:** Kontring/frislag kan ge mål, räddning, hörna, eller miss.
Resolve-funktionen ger utfall som matas tillbaka i steg-loopen.

**Indirekt:** Sista-minuten-press ändrar matchmotorns konstanter
för de kvarvarande stegen (goalThreshold, foulProb).

Matchresultatet ska vara **identiskt** oavsett läge för
samma seed — d.v.s. om en kontring dömts till mål i
Full-läge med spelarens val `sprint`, ska samma kontring
ge mål i Kommentar-läge med default `earlyBall` BARA om
de har samma resolve-utfall. Seed-baserad determinism
behålls — men spelarens val förändrar utfallet.

---

### Sprint G: Matchlägen (Code, ~60 min)
1. `MatchMode`-typ i gameStore
2. UI-väljare i StartStep
3. Kommentar-läge: auto-resolve alla interaktioner, snabbare tempo
4. Snabbsim: använd `simulateMatch()`, skippa MatchLiveScreen, gå direkt till GranskaScreen
5. Spara preferred mode i SaveGame (persisterar mellan matcher)

### Sprint H: Kontringsinteraktion (Code, ~45 min)
1. `counterAttackInteractionService.ts`
2. `CounterInteraction.tsx` (3 knappar + mini-SVG)
3. Yield i matchStepByStep för transition-sekvenser
4. Auto-resolve för Kommentar-läge

### Sprint I: Frislagsinteraktion (Code, ~45 min)
1. `freeKickInteractionService.ts`
2. `FreeKickInteraction.tsx` (3 knappar + mur-SVG)
3. Yield i matchStepByStep för foul-sekvenser
4. Auto-resolve för Kommentar-läge

### Sprint J: Sista-minuten-press (Code, ~30 min)
1. `lastMinutePressService.ts`
2. `LastMinutePress.tsx` (beslutskort, card-sharp)
3. Trigger automatisk vid underläge steg >= 55
4. Påverkar goalThreshold/foulProb för resterande steg
5. Auto-resolve för Kommentar-läge

### Sprint K: Straff-SVG uppgradering (Erik + Code, ~30 min)
1. Erik: SVG-målbur sett från straffpunkten
2. Code: byt PenaltyInteraction från knappar till klickbara SVG-zoner

---

### Grafik från Erik (samla som brief)

| Moment | Vad Erik behöver göra | Prioritet |
|--------|----------------------|-----------|
| Straff-SVG | Målbur sett från straffpunkten, 3 zoner | Hög |
| Kontring-SVG | Halva planen top-down, spelare + försvarare | Medium |
| Frislag-SVG | Mål + mur + boll, sett från sidan/bakom | Medium |
| Sista minuten | Ingen grafik (bara beslutskort) | — |

---

## KALIBRERINGSDATA — VÄR DESSA NÄR DATAN LANDAR

| Parameter | Nuvarande | Källa | Vad datan ger |
|-----------|-----------|-------|---------------|
| TIMING_WEIGHTS | 6 buckets (manuellt) | Bandygrytan 5-min | Exakta vikter |
| foulProb tidskurva | Flat | Utvisningar per 10-min | Kurva (1:a vs 2:a halvlek) |
| secondHalfMode trösklar | Gissning | Comeback-analys | Hur ofta lag som jagar vinner |
| PP-multiplikator | Saknas | Powerplay-analys (2B) | Exakt effekt av utvisning |
| RefStyle-distribution | 33/33/33 | Utvisningar per säsongsfas | Striktare tidigt? |
| cornerGoalShare variation | Fast 23.2% | Per-säsong-analys | ±Xpp randomisering |
| playoffModifiers | +20% foul | Slutspel vs grundserie | Rätt skillnad |
