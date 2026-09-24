# B1 — Hörn-/straffval försvinner i långa perioder — rotorsaksutredning

2026-09-24, Code. Körorder: `docs/CODE_KORORDER_BETATEST_ERIK_2026-09-24.md` §B1.

> **Korrigering efter spelarens fullmatchsprov:** Rapportens slutsats nedan är
> ersatt. Erik använde fulläge hela säsongen, inte bulk-simulering. Ett
> deterministiskt fullmatchsprov visade två verkliga kodfel: motståndarens
> hörnor kunde förbruka garantin för det hanterade lagets första hörnval, och
> hörnor som uppstod efter en anfallsretur gick förbi interaktionsgrinden helt.
> Rättningen och regressionstestet finns i commit `e2d714bc`. Den separata
> observationen om att bulk-simulering kör snabbläge är fortfarande sann, men
> förklarar inte Eriks felrapport.

## Slutsats i förväg

**Ingen tillstånds-/dedupe-bugg hittad** i själva interaktionsgrinden
(`shouldBeInteractive`, `cornerInteractionService.ts`/`penaltyInteractionService.ts`).
De specifika riskerna körordern pekade ut (säsongs-/halvsäsongsnycklar,
match-ID, cup/serie, snabb-/liveläge som delar felaktigt dedupe-state) är
alla kontrollerade explicit nedan och inga träffar. Mönstret Erik
beskriver förklaras i stället fullt ut av samspelet mellan två
**avsiktliga** funktioner — se "Den faktiska förklaringen" nedan. Detta
är alltså inte fixat, eftersom det inte är en kodbugg i klassisk mening
— det är en produktfråga jag lämnar till dig.

## Vad jag kontrollerade (och varför inget av det är boven)

**1. Per-match-räknare (`cornerInteractionService.ts`).**
`shouldBeInteractive` styrs av `interactiveSoFar`/`cornersThisMatch`,
båda deklarerade som `let interactiveCornersUsed = 0` lokalt i
`matchCore.ts:735` — nollställs garanterat vid varje ny matchkörning.
Ingen säsongsackumulering är möjlig här; MAX_INTERACTIVE (3) är en
per-match-spärr, inte per-säsong.

**2. `preferredMatchMode` — enda skrivstället.**
`grep preferredMatchMode: src/` ger EN träff utanför typdefinitionen:
`gameStore.ts:709`, inuti `updateMatchMode` — den explicita
spelarhandlingen (StartStep.tsx:s lägesväljare). Ingen säsongsrullning,
inget event, ingen annan kod skriver till fältet. Om spelaren inte
själv byter läge ligger `preferredMatchMode` stilla hela säsongen.

**3. Cup vs serie — inte särbehandlat i själva interaktionsgrinden.**
`MatchScreen.tsx`s beslut "gå in i live-skärmen eller kör snabbsim"
(rad 215: `matchMode !== 'quicksim' && matchMode !== 'silent'`) läser
bara `matchMode`, oavsett `nextFixture.isCup`. Cupmatcher går alltså
igenom EXAKT samma interaktionsgrind som seriematcher.

**4. Snabb-/liveläge — `isFast`/`isFastForward`/`isCommentaryMode`
läcker inte mellan matcher.**
`isFastForward` (MatchLiveScreen.tsx:192) är lokal React-state,
`useState(false)` — nollställd vid varje ny montering av
matchskärmen (dvs. varje ny match). `matchCore.ts`s `isFast` kommer
direkt från `input.mode`, satt en gång per matchanrop, aldrig
återanvänt tillstånd.

## Den faktiska förklaringen

Två avsiktliga mekanismer, i kombination, ger exakt det tidsförlopp
Erik beskrev ("finns i början, försvinner efter några matcher,
återkommer efter halva säsongen, försvinner igen"):

**a) "Simulera resten av säsongen" ignorerar `preferredMatchMode`
helt.** Knappen (`PortalScreen.tsx`, `handleSimulateRemaining`) kör
`simulateRemainingStep()` upp till 120 gånger i en loop.
`simulateRemainingStep` (`gameFlowActions.ts:764`) anropar alltid
`advance(true)` — vilket går via `roundProcessor.ts` →
`matchSimProcessor.ts` → `matchEngine.ts`s `simulateMatch`, som har
`mode: 'fast'` HÅRDKODAT (`matchEngine.ts:64`). Det gäller ALLA
matcher den kör igenom, inklusive den hanterade klubbens egna — helt
oavsett vad spelaren satt `preferredMatchMode` till. Så länge spelaren
kör bulk-simulering är hörn-/straffval per definition otillgängliga,
inte för att något är trasigt utan för att funktionen är byggd för
att hoppa över precis den detaljnivån.

**b) `canSimulateRemaining` har inbyggda på/av-villkor som råkar
matcha Eriks tidslinje.** (`PortalScreen.tsx:189`)
```
canSimulateRemaining =
  hasScheduledFixtures &&
  playedLeagueRounds >= 12 &&
  !game.playoffBracket &&
  !nextManagedScheduled?.isCup &&
  game.pendingScreen !== PendingScreen.HalfTimeSummary
```
- Knappen finns INTE alls förrän 12 spelade ligaomgångar — de första
  matcherna (Eriks "finns i början") går alltså alltid igenom
  spelarens vanliga `preferredMatchMode`, interaktiva om den är satt
  till full/commentary.
- Så fort tröskeln (12) passeras kan spelaren börja bulk-simulera —
  om hen gör det slutar interaktionerna dyka upp ("försvinner efter
  några matcher").
- Bulk-simuleringen stannar automatiskt så fort NÄSTA schemalagda
  match är en cupmatch (`!nextManagedScheduled?.isCup`). Cupen ligger
  på omgång 3/8/13/19 i den globala matchday-sekvensen — en cup-runda
  mitt i säsongen tvingar allt fram en enskild live/interaktiv match
  ("återkommer efter halva säsongen"), varefter knappen blir
  tillgänglig igen och mönstret kan upprepas ("försvinner igen").

Detta är alltså 100 % konsekvent, deterministiskt beteende givet (i)
spelarens `preferredMatchMode` och (ii) om/när hen trycker på
"Simulera resten av säsongen" — inte ett tillstånd som korrumperas.

## Varför jag inte kunde köra en fullständig headless-loggning

Körorderns egen begäran ("reproducera över minst en hel säsong med
deterministiska seeds... logga per managed match") förutsätter att
mönstret går att trigga autonomt/deterministiskt. Det gör det inte
här: `scripts/stress/fixtures.ts`s headless-motor (och alla andra
autonoma sviter) kör ALLTID via `matchEngine.ts`s hårdkodade
`mode: 'fast'`-väg (roundProcessor-batchen) — exakt samma väg som (a)
ovan. En headless körning kan alltså aldrig visa hörn-/straffval
alls, oavsett seed — mekanismen är sessionsbunden (React-state +
spelarens egna klick på "Spela match" vs "Simulera"), inte något som
lever i `SaveGame`-domänen en stress-svit kan spola fram.

Det jag KUNDE verifiera deterministiskt (utan seed, ren kod-/schema-
läsning): `preferredMatchMode`s enda skrivställe, per-match-
nollställningen av alla räknare, samt att cup/serie-fixturer går
igenom identisk interaktionslogik. Alla tre bekräftade — se ovan.

## Rekommendation (din bedömning, inte min)

Om avsikten är att spelaren ALLTID ska erbjudas interaktion för sina
EGNA matcher, även under bulk-simulering: `handleSimulateRemaining`
(eller `simulateRemainingStep`) skulle behöva pausa loopen och
navigera till live-matchskärmen när nästa steg råkar vara den
hanterade klubbens match OCH `preferredMatchMode` är full/commentary
— i praktiken samma gren som redan finns för cupmatcher, breddad till
"är nästa steg min egen match, oavsett tävlingstyp". Det är en
avsiktlig beteendeändring av en fungerande funktion, inte en bugfix,
så jag har inte gjort den utan din dom.

Om avsikten redan är att bulk-simulering ska hoppa över allt
(vilket är ett rimligt, vanligt func-manager-mönster) — då finns
inget att fixa här, och Eriks upplevelse är förväntad
konsekvens av att han använde funktionen, inte ett fel.
