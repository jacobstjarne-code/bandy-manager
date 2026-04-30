# STRINGS — Specialdatum

**Skapad:** 2026-04-27
**Författare:** Opus
**Mottagare:** Code (Sprint 28-Fas 3)
**Status:** V2 — utökad med arena-konstanter och kontextuell lore
**Tidigare version:** V1 levererade pool om 60 strängar i tre kanaler

---

## V2-tillägg

- **Arena-konstanter** för SM-final och cup-final med faktagrund
- **Lore-poolar** med verkliga referenser från svensk bandyhistoria — Studan och Sävstaås
- **Kontextuella lore-triggers** som aktiveras vid sällsynta omständigheter (3×30-final, höga annandagsmängder, etc.)
- **Faktagrund-bilaga** så Code kan validera att Opus-texten hänvisar till verifierat material

---

## Översikt

Texter för fyra specialdatum-event som triggas via flaggor i `MatchdaySlot` / `Fixture`:
- `isAnnandagen` — 26 december varje år, derby tvingas dit
- `isNyarsbandy` — 31 december när det råkar inträffa (~10-20% av säsonger)
- `isFinaldag` — SM-finalen (matchday 32, mitten mars)
- `isCupFinalhelgen` — cup-semifinal + final (matchday 3-4, första oktober-helgen)

Tre kanaler:
- **Match-commentary** — sensorisk, under matchens första minuter
- **Daily briefing** — observation + förväntan, dashboard dagen för matchen
- **Inbox** — formellt kort, sparas, syns i historiken

**Inbox-regel:** Inbox sist, bara om relevant. Annandagsbandy och cup-final får inbox eftersom det är formella matcher i derbyrivalitet eller titelmatch. Nyårsbandy får ingen inbox — atmosfären sker i daily briefing och commentary.

---

## 0. ARENA-KONSTANTER OCH LORE

### 0.1 Final-arenor

I spelets fiktiva universum spelas finalerna på klassisk bandymark — homage till bandysverige som kultur, inte till verklighetens nuvarande arenaval (ABB Arena Syd för SM, SBB Arena för cup-finalen).

```typescript
// src/domain/data/specialDateStrings.ts

export const SM_FINAL_VENUE = {
  arenaName: 'Studenternas IP',
  shortName: 'Studan',
  city: 'Uppsala',
  // 23 historiska SM-finaler (näst flest efter Stockholms Stadion 47).
  // Finalplats 1991-2012 + 2018-2023. Invigd 21 mars 1909.
  // Publikrekord 25 560 — Hammarby–Bollnäs 2010, snöfallsfinalen.
}

export const CUP_FINAL_VENUE = {
  arenaName: 'Sävstaås IP',
  city: 'Bollnäs',
  // Bollnäs hemmaplan 1974-2022. Konstis sedan 1984.
  // Publikrekord 8 151 — Bollnäs–Edsbyn på annandagen 2000.
  // I spelets fiktiva universum är det cup-finalplats. (I verkligheten har
  // Sävstaås aldrig haft cup-finalen — den var i Lidköping 2010-2023.)
}
```

### 0.2 Lore-pooler — faktagrund för commentary

Dessa fakta används av kontextuella lore-triggers. Code ska kunna referera dem deterministiskt.

```typescript
export const STUDAN_FACTS = {
  inaugurated: '21 mars 1909',
  totalFinals: 23,                    // SM-finaler genom historien
  rank: 'näst flest efter Stockholms Stadion (47)',
  attendanceRecord: 25_560,           // 2010 snöfallsfinalen
  attendanceRecordYear: 2010,
  attendanceRecordMatch: 'Hammarby IF 3–1 Bollnäs GIF',
  attendanceRecordContext: 'Den enda SM-final som spelats i 3×30 minuter — pga ymnigt snöfall',
  location: 'Vid Fyrisån, intill Stadsträdgården i centrala Uppsala',
  reconstruction: 'Ombyggd 2017–2020 av White Arkitekter',
  finalsPeriod1: '1991–2012',
  finalsPeriod2: '2018–2023',
  // Ikoniska finaler:
  iconicMatches: [
    {
      year: 2010,
      teams: 'Hammarby–Bollnäs',
      score: '3–1',
      story: '3×30 minuter pga snöfall. "Grisbandy" första två perioderna, "riktig bandy" sista. Hammarbys första SM-guld på 105 år.',
    },
    {
      year: 2011,
      teams: 'SAIK–Bollnäs',
      score: '6–5 (sudden death)',
      story: 'SAIK-ikonen Daniel "Zeke" Eriksson sköt avgörande mål via frislag i sin allra sista match.',
    },
    {
      year: 1999,
      teams: 'Västerås–Falu BS',
      score: '3–2',
      story: 'Falu BS hela vägen till final — första laget med ryska spelare (Sergej Obuchov + Valerij Gratjev).',
    },
  ],
}

export const SAVSTAAS_FACTS = {
  inaugurated: '1973–1974 (säsongen)',
  artificialIce: 1984,
  homePeriod: 'Bollnäs hemmaplan 1974–2022',
  attendanceRecord: 8_151,
  attendanceRecordDate: '26 december 2000',
  attendanceRecordMatch: 'Bollnäs–Edsbyn (annandagen)',
  attendanceRecordContext: 'Publikrekordet är från en annandagsmatch — det är inget tomt sammanträffande',
  // Atmosfäriska detaljer:
  atmosphere: {
    supporters: 'Flames — en gång rankad som Sveriges fjärde bästa supporterklubb (alla sporter, Aftonbladet)',
    inmarchSong: 'Dans på Sävstaås',
    fireworks: 'Nisses fyrverkerier innan match',
    flagSize: 'Jumboflaggor 4×4 meter',
    standsSouth: 'Träläktare med murkna brädor, blåaktigt rostigt räcke',
    standsEast: 'Hela långsidan, 25–30 trappsteg hög, inget tak',
    standsMain: 'Tak, störst, nyast — där Flames står',
    iceHall: 'Ishallen bredvid där folk värmer fingrar i halvtid + köper korv',
    smell: 'Kväljande cigarettrök, korv, glögg',
  },
  // "Sävstaås-spöket":
  ghost: 'Sirius vann ingen bortamatch på Sävstaås 1983–2018. 23 raka förluster på 35 år.',
  bollnasFinals: [1943, 1951, 1956, 2010, 2011, 2017],
  bollnasGold: [1951, 1956],          // båda mot Örebro SK 3–2
}
```

---

## 1. ANNANDAGSBANDY (26 december, alltid, derby)

### Match-commentary (5 standard + 2 lore-varianter)

```typescript
export const ANNANDAGSBANDY_COMMENTARY: string[] = [
  'Annandag jul. Klubbhuset doftar fortfarande av igårkvällens skinka.',
  'Det är 26 december. Halva publiken har julgrans-barr på jackorna.',
  'Familjeråd före match: morfar tog tåget hit i morse, brorsan hade fått ledigt från jobbet i Stockholm. Hela släkten är på plats.',
  'Annandagsbandy. Termosen är fylld med kaffe från frukosten, smörgåsen ligger kvar i fickan från 11-fikat.',
  'Det luktar tända marschaller och pepparkaka. Klacken har dragit igång den första sången redan i kön till entrén.',
]

// LORE-pool — slumpas in med ~15% sannolikhet istället för standard
export const ANNANDAGSBANDY_COMMENTARY_LORE: string[] = [
  'På Sävstaås 2000 satte Bollnäs publikrekord på annandagen. 8 151 åskådare. Det rekordet ligger som ett spöke över varje annandagsmatch som spelas i bandysverige.',
  'Annandagsbandy är inte vilket schemaläggning som helst. Det är dagen då folk som inte ens följer bandyn under året plötsligt sitter på läktaren.',
]
```

### Daily briefing (5 varianter)

```typescript
export const ANNANDAGSBANDY_BRIEFING: string[] = [
  '🎄 Annandagen. {arenaName} ska gå varm i dag.',
  '🎄 26 december. Derbyt mot {opponentName} klockan 13:15. Plogen har gått sedan klockan sex i morse.',
  '🎄 Annandagsbandy mot {opponentName}. Hela bygden samlas, även de som inte brukar gå på match.',
  '🎄 Det är annandag jul. {arenaName} fylls av folk som behöver komma ut ur sina hem.',
  '🎄 Annandagen — {rivalryName}. Året ska ha en till topp innan det är över.',
]
```

### Inbox (1 mall, kontextuell)

```typescript
export function annandagsbandyInbox(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const venue = ctx.isHomePlayer
    ? `hemma på ${ctx.arenaName}`
    : `borta i ${ctx.venueCity}`

  return {
    subject: `Annandagsbandy mot ${opponent}`,
    body: `Den traditionella annandagsmatchen spelas ${venue} klockan 13:15. ${ctx.rivalryName ?? 'Derbyt'} drar i år förmodligen mer folk än vanlig omgångsmatch — räkna med kaffekö i pausen och tidig parkering. Plogen är beställd från klockan sex.`,
  }
}
```

---

## 2. NYÅRSBANDY (31 december, sällan, ingen inbox)

### Match-commentary (5 varianter)

```typescript
export const NYARSBANDY_COMMENTARY: string[] = [
  '31 december. Klockan rinner på, men just nu står den stilla över {arenaName}.',
  'Nyårsafton. Halva publiken har bokat bord till middagen klockan sex. Andra halvan har ingen middag bokad alls.',
  'Det är sista dagen på året. Någon i klacken har redan tänt en tomtebloss.',
  'Nyårsbandy. Lite uppgivet, lite festligt — som året självt vid det här laget.',
  'Sista matchen för året. Domarens visselpipa låter likadant som den ska låta vid midnatt om åtta timmar.',
]
```

### Daily briefing (5 varianter)

```typescript
export const NYARSBANDY_BRIEFING: string[] = [
  '🎆 Nyårsafton. Match klockan {tipoffHour}, midnatt klockan tolv. Båda går fort.',
  '🎆 Det är 31 december och det spelas bandy på {arenaName}. Det är inte normalt, men i år är det så.',
  '🎆 Nyårsbandy mot {opponentName}. Folk kommer i jackor och tänker på middagen sen.',
  '🎆 Sista matchen för året. Tabellen ska se ut på ett visst sätt när 2027 börjar.',
  '🎆 Nyårsafton-bandy. Säsongens bisarraste schemaläggning.',
]
```

`{tipoffHour}` formaterad som "13:00" eller "17:00".

**Ingen inbox.**

---

## 3. SM-FINALDAG (matchday 32, Studenternas IP, kontextuell)

Spelarens klubb är BARA i finalen om de tagit sig dit. Texterna fungerar både för deltagare och åskådare.

### Match-commentary

```typescript
export const FINALDAG_COMMENTARY_PLAYING: string[] = [
  'SM-final. Det är vad allt gått ut på. Hela säsongen samlas i de här 90 minuterna.',
  'Tredje lördagen i mars. Studenternas IP. Och vi är där. Det är inte en vanlig match. Det är inte ens en derby. Det är finalen.',
  'Det är finaldag på Studan. Något i benen vet det redan innan domaren blåser igång.',
]

export const FINALDAG_COMMENTARY_SPECTATOR: string[] = [
  'SM-finalen avgörs i dag på Studenternas — {homeClubName} mot {awayClubName}. Inte vår final, men ändå finalen.',
  'På Studan spelas det final i dag. Vi tittar på från andra sidan, som de flesta år.',
]

// LORE-pool — slumpas in med ~15% sannolikhet istället för standard
export const FINALDAG_COMMENTARY_LORE: string[] = [
  'Studenternas IP. Invigd 21 mars 1909. 23 SM-finaler har avgjorts på den här isen. Den 24:e startar nu.',
  'Vi står på samma is där Daniel "Zeke" Eriksson sköt SAIK till guld 2011 — i sin allra sista match. Frislag, sudden death, drömavslut. Alla finaler har sin historia.',
  'På den här planen vann Hammarby sitt första SM-guld på 105 år. Det var 2010. Snön vräkte ner. Matchen spelades i 3×30 minuter — den enda SM-finalen någonsin i det formatet. Idag är det åtminstone klart väder.',
  'Stadsträdgården åt höger, Fyrisån åt vänster. Studan. Det är på de här fem hektaren bandysveriges hela historia ryms.',
]

// Kontextuell lore — triggas BARA om weather.matchFormat === '3x30'
export const FINALDAG_COMMENTARY_3X30: string[] = [
  'Andra gången någonsin. Hammarby–Bollnäs 2010 var den första SM-finalen i 3×30 minuter — snöfallet då tvingade fram det. Idag är vi där igen. Studan, snöfall, regelbokens andra utväg.',
  '3×30 minuter i en SM-final. Det har bara hänt en gång förut. På den här planen, för 16 år sedan. Bollen rullade knappt i snön. "Grisbandy", sa kommentatorerna. Vi får se vad det blir i dag.',
]
```

### Daily briefing

```typescript
export const FINALDAG_BRIEFING_PLAYING: string[] = [
  '🏆 SM-FINAL. {opponentName}, Studenternas IP, klockan 13:15. Hela säsongen är det här.',
  '🏆 Finaldagen. Det finns inte mycket att säga. Spelarna vet vad det är.',
  '🏆 Idag är det final på Studan. Bygden har bussat hit. Halva orten är på plats.',
]

export const FINALDAG_BRIEFING_SPECTATOR: string[] = [
  '🏆 SM-finalen i dag på Studenternas: {homeClubName} mot {awayClubName}. Vi är inte där. Inte i år.',
  '🏆 Det är finaldag i bandysverige. Studan brinner. Vi följer från soffan.',
]
```

### Inbox

```typescript
export function finaldagInboxPlaying(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const role = ctx.isUnderdog
    ? 'Underläge på pappret. Allt att vinna.'
    : 'Favorit på pappret. Inget att förlora?'

  return {
    subject: `SM-final mot ${opponent}`,
    body: `Tredje lördagen i mars. Studenternas IP är spelplats för bandyårets sista match — som den varit för 23 finaler tidigare. ${role} Det är finalen — det går inte att förbereda mer än man redan gjort.`,
  }
}

export function finaldagInboxSpectator(ctx: SpecialDateContext): { subject: string; body: string } {
  return {
    subject: 'SM-finalen avgörs i dag',
    body: `${ctx.homeClubName} mot ${ctx.awayClubName} på Studenternas IP. Inte vår final i år. Säsongen är över för oss — finalen påminner om det.`,
  }
}
```

---

## 4. CUP-FINALHELGEN (matchday 3-4, Sävstaås IP, kontextuell)

Cup-finalhelgen är två matchdagar — semifinaler lördag, final söndag. Tonen festligare än SM-finalen — säsongens första kapitel, inte sista. Sävstaås atmosfär är kärnan.

### Match-commentary

```typescript
export const CUPFINAL_COMMENTARY_PLAYING: string[] = [
  'Cup-final på Sävstaås. Säsongens första titel ligger på det här. Det doftar fortfarande sensommar i luften.',
  'Det är oktober och Sävstaås står som finalarena. Vi är här — det är inte alla år man kan säga det.',
  'Cup-finalen. Tre matcher har lett hit. Den fjärde avgör allt. Sävstaås har redan spelat upp Dans på Sävstaås en gång i morse.',
]

export const CUPFINAL_COMMENTARY_SPECTATOR: string[] = [
  'På Sävstaås IP spelas cup-final i dag mellan {homeClubName} och {awayClubName}. Inte vår final, men matchen ger ändå läget i bandysverige.',
  'Cup-finalhelgen rullar på i Bollnäs. Bandyåret är i gång på riktigt nu.',
]

// LORE-pool — slumpas in med ~15% sannolikhet istället för standard
export const CUPFINAL_COMMENTARY_LORE: string[] = [
  'Sävstaås IP. Invigd 1973, konstfryst 1984, Bollnäs hemmaplan i 48 år. Träläktarna doftar fortfarande av tre generationer cigarettrök och korv.',
  'På den här planen satte Bollnäs publikrekord på annandagen 2000. 8 151 åskådare. Den siffran ligger som ett spöke över varje match som spelas här.',
  'Sävstaås. Flames står på huvudläktaren med jumboflaggor på fyra meter. Innan inmarsch spelas Dans på Sävstaås. Nisses fyrverkerier smäller. Det är så det går till.',
  'Sirius vann inte en bortamatch på den här planen i 35 år. 1983 till 2018. 23 raka förluster. "Sävstaås-spöket" är inget skämt — det är en bandysanning.',
  'Innan ishallen byggdes bredvid kunde du gå in mellan halvlekarna och värma fingrarna med en korv och en glögg. Den traditionen försvann inte — bara att hallen är större nu.',
]
```

### Daily briefing

```typescript
export const CUPFINAL_BRIEFING_PLAYING: string[] = [
  '🏆 Cup-final i dag på Sävstaås. {opponentName}, klockan 14. Säsongens första riktiga match.',
  '🏆 Vi spelar cup-final. Det här är en sån match som folk minns även om de glömmer placeringen i serien.',
  '🏆 Cup-finalen i Bollnäs. {hasJourneyToFinal ? "Tre rundor och inga förluster — nu sista." : "Vi är här."}',
]

export const CUPFINAL_BRIEFING_SPECTATOR: string[] = [
  '🏆 Cup-finalhelgen pågår på Sävstaås. {homeClubName} mot {awayClubName}. Vi följer från sidan i år.',
  '🏆 Det är cup-final i Bollnäs. Bandyåret tar fart utan oss i finalen.',
]
```

### Inbox

```typescript
export function cupFinalInboxPlaying(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const path = ctx.hasJourneyToFinal
    ? 'Tre cup-matcher, tre vinster. Nu finalen.'
    : 'Vi är i cup-finalen.'

  return {
    subject: `Cup-final mot ${opponent}`,
    body: `Cup-finalen spelas på Sävstaås IP i Bollnäs klockan 14. ${path} Det är säsongens första titel som står på spel — innan ligan ens börjat. Bollnäs-publiken kommer vara på Flames sida om vi inte är hemmalag, det är så det fungerar på Sävstaås.`,
  }
}

// Cup-final-inbox för spectator-fall: SKIPPAS — räcker med daily briefing.
```

---

## 5. SpecialDateContext (datakontrakt)

```typescript
export interface SpecialDateContext {
  isHomePlayer: boolean              // är spelarens klubb hemmalag?
  homeClubName: string
  awayClubName: string
  arenaName: string                  // klubbens egen arena (för annandagsbandy)
  venueCity: string
  isDerby?: boolean
  rivalryName?: string
  weather?: { tempC: number; condition: string; matchFormat?: '2x45' | '3x30' | 'cancelled' }
  // Bara för final/cup-final:
  isUnderdog?: boolean
  hasJourneyToFinal?: boolean        // för cup-final
  isPlayerInFinal?: boolean          // är spelarens lag i finalen?
}
```

---

## Implementations-noteringar för Code

### Slumpning av varianter

```typescript
import { mulberry32 } from '../utils/random'

function pickVariant<T>(pool: T[], season: number, matchday: number): T {
  const rand = mulberry32(season * 1000 + matchday)
  return pool[Math.floor(rand() * pool.length)]
}
```

### Lore-pool aktivering

Lore-pool (de med suffix `_LORE`) ska triggas med ~15% sannolikhet istället för standard. Implementera via separat slumpning:

```typescript
function pickCommentary(
  standard: string[],
  lore: string[] | undefined,
  season: number,
  matchday: number
): string {
  const rand = mulberry32(season * 7919 + matchday * 31)
  const useLore = lore && rand() < 0.15
  const pool = useLore ? lore : standard
  return pickVariant(pool, season, matchday)
}
```

### Kontextuell lore (3×30-final)

Specialfall: `FINALDAG_COMMENTARY_3X30` triggas BARA när `weather.matchFormat === '3x30'`. Då har den 100% prioritet över både standard och vanlig lore.

```typescript
function pickFinaldagCommentary(ctx: SpecialDateContext, season: number, matchday: number): string {
  if (ctx.weather?.matchFormat === '3x30') {
    return pickVariant(FINALDAG_COMMENTARY_3X30, season, matchday)
  }
  const isPlaying = ctx.isPlayerInFinal === true
  const standard = isPlaying ? FINALDAG_COMMENTARY_PLAYING : FINALDAG_COMMENTARY_SPECTATOR
  return pickCommentary(standard, FINALDAG_COMMENTARY_LORE, season, matchday)
}
```

### Variabel-substitution

```typescript
function substitute(template: string, ctx: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(ctx[key] ?? `{${key}}`))
}
```

### Var hookar man in?

| Kanal | Hook |
|---|---|
| Match-commentary | `matchStepByStep.ts` direkt efter avslag — som första kommentar i feeden |
| Daily briefing | `DailyBriefing`-komponenten, ny kategori `specialDate` med högre prioritet än vädret |
| Inbox | `roundProcessor.ts` på samma matchday som flaggan — kvällen före matchen |

### Prioritetsordning vid kollisioner

1. SM-finaldag (högst)
2. Cup-finalhelgen
3. Annandagsbandy
4. Nyårsbandy

---

## Test-strategi

1. **Annandagsbandy:** Spela igenom säsong, gå till matchday för R10 (matchday 14 i nya systemet). Bekräfta att en av 5 commentary-varianter visas, en av 5 briefings, samt inbox-event genererat. Lore-pool ska trigga ~15% av sessioner.

2. **Nyårsbandy:** Hitta en season där `buildSeasonCalendar(season).find(s => s.isNyarsbandy)` returnerar truthy. Verifiera commentary + briefing, ingen inbox.

3. **SM-finaldag:** Spela playoff till final. Verifiera "PLAYING"-varianten triggas. Backa till en sparad fil där spelaren åkt ut tidigare → "SPECTATOR"-varianten ska trigga den dagen. Testa även att om finalen genereras med `weather.matchFormat === '3x30'` triggas `FINALDAG_COMMENTARY_3X30` istället.

4. **Cup-finalhelgen:** Cup R3 (semi) och R4 (final) — bägge dagar har flaggan. Lore-pool ska trigga ~15%.

---

## Bilaga A — Faktagrund (verifierat 2026-04-27)

All lore i denna fil är hämtad från följande källor och kan verifieras:

**Studenternas IP:**
- Wikipedia: Studenternas IP, Svenska bandyfinalen
- finalen.se: Om Bandyfinalen
- bandyfeber.com: 1990-talets SM-finaler, "Publikmässigt blev det en enorm succé"
- Sveriges Radio (sverigesradio.se): SM-finalen 2010 reportage
- svenskbandy.se: Svenska Mästare — Herrar (komplett finallista)
- SvenskaFans: SM-finalen 2010 matchreferat

**Sävstaås IP:**
- Wikipedia (en): Sävstaås IP
- bollnasbandy.se: Om klubben
- siriusbandy.se: Matchguide Sirius–Bollnäs (Sävstaås-spöket)
- svenskafans.com (2004): Att komma till Sävstaås (atmosfärbeskrivning)
- ifkvanersborg.se: Bollnäs GIF klubbinfo

Inget i denna fil är gissning. Allt går att källbelägga om någon frågar.

---

## Slut STRINGS_SPECIALDATUM V2
