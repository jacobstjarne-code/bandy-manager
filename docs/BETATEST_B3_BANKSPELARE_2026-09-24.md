# B3 — Bänkspelare och flygande byten — kartläggning, fix, mätning

2026-09-24, Code. Körorder: `docs/CODE_KORORDER_BETATEST_ERIK_2026-09-24.md` §B3.

## Kartläggning: var minuter/form/trötthet/statistik tilldelas idag

Tre separata ställen, tidigare med olika bild av samma sak:

1. **`statsProcessor.ts`** ("Flygande byten", rad ~314-343): en oanvänd
   bänkspelare (inte inbytt) krediteras **30-40 minuter** i
   `seasonStats.minutesPlayed` + `gamesPlayed`/`careerStats.totalGames`.
   Kommentaren är uttrycklig: "bandy använder löpande byten som ishockey."
2. **`playerStateProcessor.ts`** ("Player fitness / form / sharpness
   updates"): tre grenar — `startersThisRound` (full matchkostnad + form
   från betyg + skärpa +10), `benchThisRound` (**ren återhämtning, ingen
   kostnad**, skärpa **-5**), och "spelade inte alls" (proportionell
   vila, skärpa -3).
3. **`matchCore.ts`**: `fixture.report.playerRatings` sätts bara för
   spelare som faktiskt simulerades (startare + verkliga inbytta via
   `MatchEventType.Substitution`) — en flygande-byten-krediterad
   bänkspelare har ALDRIG ett riktigt betyg att basera formändring på.

## Två separata, verifierade inkonsekvenser

**B3a — Reservmålvakten fick flygande-byten-minuter.** `statsProcessor.ts`s
bänk-loop hade inget positionsfilter. En reservmålvakt (alltid en av
bänkens fem platser i en normal trupp) krediterades 30-40 minuter och en
match i `careerStats.totalGames` VARJE gång hon satt på bänken — trots
att målvakter inte byts löpande i bandy. Körordern instruerar uttryckligen
"Målvakten behandlas separat."

**B3b — Utespelare på bänken: statistiken och kroppen sa olika saker.**
`statsProcessor.ts` påstod 30-40 minuters speltid. `playerStateProcessor.ts`
behandlade SAMMA spelare som om hon aldrig lämnat bänken: ingen
konditionskostnad alls (ren återhämtning, samma riktning som "spelade
inte"), och en skärpe-STRAFF (-5) — dvs sämre matchskärpa av att (enligt
statistiken) ha spelat, än av att inte ha spelat alls (-3). Två sanningar
om samma 30-40 minuter som inte kunde stämma samtidigt — precis den
inkonsekvens körordern pekade ut.

Det här är exakt fallet körordern förutsåg: *"Om rotfelet bara är att
bänken alltid får exakt noll kan den mekaniska bokföringsfixen göras i
egen commit."* Konditionskostnaden var, i praktiken, alltid noll för
bänken (ren återhämtning oavsett startvärde) — en bokföringsinkonsekvens,
inte ett kalibreringsspörsmål om VAR nollan borde ligga.

## Fixen (minimal modell, samma commit som denna rapport)

**B3a** — `statsProcessor.ts`: bänkloopen hoppar nu över
`PlayerPosition.Goalkeeper` innan minutkrediten beräknas. Reservmålvakten
får varken minuter, `gamesPlayed` eller `careerStats.totalGames` för en
match hon inte spelade.

**B3b** — `playerStateProcessor.ts`: bänk-grenen delas i två. Målvakten
behåller EXAKT den gamla behandlingen (ren återhämtning, skärpa -5) —
rimligt, hon spelade verkligen inte. En bänkad UTESPELARE får i stället:

- samma deterministiska minutberäkning som `statsProcessor.ts` (samma
  frö: `nextRound*7919 + spelarens id-tecken`) — INGEN delad state
  trådas igenom mellan filerna, båda härleder oberoende samma tal.
- en konditionskostnad proportionell mot krediterade minuter / 90,
  skalad mot SAMMA bas (13-20) som en startares matchkostnad, med samma
  taktikfaktor.
- en skärpeökning proportionell mot minutandelen (upp till +10 vid 40
  minuter), i stället för ett rakt -5-straff.

Formen (`{spelare}-{namn}: {utespelare}: proportionell kostnad, {mv}:
oförändrad`) håller ihop de två filernas påståenden om samma spelare
utan att bygga om datamodellen — "minimal modell" enligt ordern.

## Mätning: FÖRE/EFTER över en säsong

`scripts/measure-bench-fatigue-season.ts` — en representativ utespelare,
bänkad var tredje omgång (rotation), startar övriga 21, 22 omgångar,
samma formler i isolering (ingen speldatabas krävs för att isolera EXAKT
den ändrade grenen):

```
Kondition vid säsongsslut: FÖRE 81, EFTER 76 (diff -5)
Skärpa vid säsongsslut:    FÖRE 100, EFTER 100 (diff 0)
Kondition, snitt över säsongen: FÖRE 79.4, EFTER 76.1
Skärpa, snitt över säsongen:    FÖRE 96.3, EFTER 98.0
```

**Tolkning:** konditionen landar lägre (rimligt — bänkdagar kostar nu
något, om än lite). Skärpan vid säsongsSLUT är oförändrad (båda
versionerna taknar vid 100 givet gott om återhämtningstid mellan
omgångar i det här scenariot), men säsongsSNITTET stiger (96,3 → 98,0)
— den gamla -5-dippen varje bänkomgång är borta, ersatt av ett
proportionellt plus. Ingen av förändringarna är dramatisk (den nya
konditionskostnaden är liten — 30-40 av 90 minuter, inte en hel match)
och det är avsiktligt: en spelare som suttit av 2/3 av matchen ska inte
straffas som en startare.

**En observation värd att notera, inte agera på:** vid HÖG startkondition
(nära taket) kan en hel veckas återhämtning nästan helt jämna ut den nya
matchkostnaden — en spelare som fick 35 lätta minuter och sju dagars
vila SKA vara nära återställd, det är fysiologiskt rimligt. Den robusta
signalen är därför komparativ (bänkad < ej uttagen, vid samma
startvärde), inte att konditionen absolut sett måste sjunka under
startvärdet varje gång — testerna (se nedan) är byggda kring den
komparativa signalen av det skälet.

## Föreslagen invariant (inte implementerad denna sväng — se nedan)

En körbar `gameInvariants.ts`-kontroll skulle kunna slå fast: *"ingen
spelare vars position är Goalkeeper får seasonStats.gamesPlayed eller
careerStats.totalGames ökat för en fixture hen varken startade i eller
byttes in i (via ett riktigt `MatchEventType.Substitution`-event)."*
Det fångar exakt B3a:s klass av fel om den återkommer. Jag har INTE
lagt in den som kod denna sväng — `gameInvariants.ts` läser hela
`SaveGame`-ögonblicksbilder, inte per-fixture-deltan, så en robust
implementation kräver att gå igenom hur andra liknande invarianter (t.ex.
TILLÄGG 3:s `isInjured`/`suspensionGamesRemaining`-kontroll) härleder
"deltagit i fixture X" ur sparad data — ett separat, litet spår, inte en
förlängning av den här bokföringsfixen.

## Test

`playerStateProcessorBench.test.ts` (ny fil): utespelare kostar kondition
relativt en ej uttagen spelare + vinner skärpa; reservmålvakten
oförändrad (regression); tvärfil-konsekvens (samma krediterade minuter
i båda filerna för samma spelare/runda, med `daysBetweenFixtures=1` för
att göra kostnaden mätbar utan att återhämtningen jämnar ut den).
Utökat `statsProcessor`-testet: reservmålvakten får nu noll kredit,
utespelaren oförändrat 30-40 min (regression). Full svit grönt
(610/610, 5435 tester).
