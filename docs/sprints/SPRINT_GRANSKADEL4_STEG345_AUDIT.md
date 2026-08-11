# GRANSKA DEL 4, steg 3-5 + SM-finalscen + Omgångssammanfattning-rapport — audit

## 0. Förutsättning: riktig SM-finalscen tillagd till steg 6-baseline

`granska-sm-final` — `tävlingstyp:'slutspel' + skede:'final'`, fälten kopierade ordagrant från `playoffService.ts`s `generatePlayoffFixtures`-isFinal-gren (`isNeutralVenue`, `isKnockout`, `isFinaldag`, `SM_FINAL_VENUE` — Studenternas IP, Uppsala), `playoffBracket.final` wired med fixturen så `deriveSkede` läser en riktig bracket, inte en datalucka. Registrerad i `scenes.visual.ts` och `scripts/capture-scenes.mjs`. Detta täpper till luckan jag själv flaggade i steg 2-auditen — `isSeasonEndingFinal`-grenen (Scouting, Nästa match-pekare) har nu en levande baseline, inte bara enhetstest.

## 1. Steg 3 — Trophy-ton (klart) + tribute-gren (försökt, reverterat)

### Trophy-ton — klart
- `ScoreBlock`s `gold`-variant (redan dokumenterad, oanvänd tills nu: `design-system/DESIGN-DECISIONS.md` — "Gold-regel: variant='gold' reserveras uteslutande för SM-final och Cup-final") tvingas nu på Resultat-heroens scoreline när `axes.skede === 'final' && won`. Cup-final och SM-final delar samma regel (steg 1: final är inget eget tävlingstyp-värde) — en förlorad final förblir `loss`, inte guld.
- `granskaFlavorText()` fick ett nytt valfritt `isNeutralVenue`-fält som slår av "hemmaseger"/"bortaseger"-svansen. Matrisens Resultat-hero-rad flaggade den explicit som fel på neutral plan — det finns inget "hemma" att vinna på Studenternas IP eller i Bollnäs.
- Browser-verifierat: `granska-cup-final` och `granska-sm-final` visar guldfärgad "4–2" och "Klar vinst" utan svans (mot "😅 Knapp seger · hemmaseger" som liga/cup-icke-final fortfarande korrekt visar).

### Tribute-gren — försökt, reverterat, rapporterat
Första försöket bröt ut avsked till en helt egen `return` tidigt i komponenten, före resten av funktionen. Det visade sig **droppa innehåll matrisen inte alls ✕:ar för avsked**: Media (⚠, ska synas), NY SKADA-kortet, kritiska events, presskonferens/CS-pressfråga/domarmöte (event-drivna beslutsprompter helt utanför matrisens 12 rader — de existerar oavsett matchtyp). En "egen gren" som tystar en väntande presskonferens är en regression, inte en förbättring — upptäckt via browser-verifiering (skärmdumpen visade NY SKADA-kortet försvinna), inte via tester.

**Reverterat till en (1) return-sats.** Sektionsregistret (steg 2) döljer redan korrekt de sju ✕-sektionerna (Tabell/Form/Statistik/Dina val/Omgångssammanfattning/Andra matcher/Scouting) — visuellt är resultatet identiskt med vad en "riktig" avgrening skulle producera (verifierat: `granska-avsked` visar Resultat-hero, Nyckelmoment, NY SKADA — inget annat).

**En genuint fullständig fysisk avgrening** (hissa även critical events/press/CS-press/domarmöte/Media/NY SKADA-blocken till en separat gren, sex block till) **är görbar men inte gjord här** — flaggas som en avvägning för dig, inte en teknisk blockering:
- **Fördel:** arkitektoniskt bevis att avsked ALDRIG kan råka ärva normalmallens antaganden när filen växer vidare (samma klass av skydd som resten av DEL4-serien byggt).
- **Kostnad:** sex block till att flytta rätt utan att tappa något, under samma risk jag redan demonstrerade en gång.
- Jag gjorde den avvägningen åt mig själv den här gången (reverterade) eftersom en regression är värre än arkitektonisk orenhet — men det är ditt kall om det ska göras fullständigt i en egen, mer försiktig session.

**Visuell hierarki** (t.ex. att lyfta fram den avgående spelaren, "score underordnas hyllning") är **inte byggd** — det är en ny, distinkt visuell komposition, och ordern själv säger "ceremoni-tiern (quiet/protocol/trophy) är ett förslag i scen-flödesauditen, inte byggd kod." Ingen godkänd mock finns (MOCK-DRIVEN DESIGN-principen, CLAUDE.md). Jag har inte uppfunnit en layout på egen hand.

## 2. Steg 4 — Fast-lägets prosa (struktur, ingen text)

`granska/helpers.ts`s `generateQuickSummary` tar nu emot `tavlingstyp?: Tavlingstyp, skede?: Skede` som två nya, valfria parametrar (bakåtkompatibelt — alla befintliga anrop utan dem beter sig exakt som innan). Tre nya, TOMMA poolarrayer (`QUICK_SUMMARY_FINAL_POOL`, `QUICK_SUMMARY_SLUTSPEL_POOL`, `QUICK_SUMMARY_AVSKED_POOL`) — `pickFromPool` returnerar `'[Opus]'` (enda tillåtna platshållarsträngen, CLAUDE.md) när poolen är tom. Liga och cup (icke-final) rör den befintliga, redan skrivna default-logiken orört.

**Rapporterat: tre lägen behöver text** (matchar ordern ordagrant — "final/slutspel/avsked"):
1. `skede==='final'` — delad pool för cup-final OCH SM-final (steg 1: final är inget eget tävlingstyp-värde).
2. `tavlingstyp==='slutspel'`, icke-final (kvarts/semi).
3. `tavlingstyp==='avsked'`.

Browser-verifierat: `granska-sm-final` visar `[Opus]` i match-summary-rutan istf genererad prosa (se skärmdump i sessionens scratchpad, `granska-sm-final-steg5.png`).

## 3. Steg 5 — Turneringsläge (byggt) + Serie-/bracketblock (inte byggt, motiverat)

### Turneringsläge — byggt, wired, [Opus]-märkt
Ny fil `src/domain/services/turneringslageService.ts`: `deriveTurneringslageMode(game, tavlingstyp)` — ren derivering ur `cupService.getManagedClubCupStatus` / en ny motsvarighet `playoffService.getManagedClubPlayoffStatus` (samma fyrfältsform, `{eliminated, eliminatedInRound, isInFinal, won}` — läser bara `bracket.champion`/`series.winnerId`/`loserId`, ingen ny mekanik). Ny sektion i `GranskaOversikt.tsx`, `.card-sharp` + `SectionLabel` — samma husvokabulär som varje annan sektion på skärmen, ingen ny visuell komponentfamilj. Visas bara när ett läge faktiskt kan avgöras — mitt i en turnering utan avgjort utfall visas ingen rad (naturlig tystnad, inte en tom platshållare).

**Rapporterat: sex lägen behöver en rad** (ordagrant matchande ordern):
1. `ut_forstarunda` — cup, utslagen rond 1.
2. `ut_kvart` — cup rond 2 ELLER slutspel kvartsfinal.
3. `ut_semi` — cup rond 3 ELLER slutspel semifinal.
4. `vidare_final` — cup ELLER slutspel, i final men ej avgjord.
5. `vunnen_final` — cup ELLER slutspel, `won: true`.
6. `forlorad_final` — cup rond 4 ELLER slutspel final, förlorad.

(Cup har alla sex, slutspel saknar `ut_forstarunda` eftersom `PlayoffRound` inte har någon förstarunda — matchar ordern: "och motsvarande för slutspelet.")

Browser-verifierat: `granska-sm-final` (wired med `champion: HOME_ID`) visar TURNERINGSLÄGE-kortet med `[Opus]`. `granska-slutspel` (wired med en oavgjord kvartsfinal-serie) visar INGET kort — rätt, ingenting är avgjort än. `granska-cup`/`granska-cup-final` saknar `cupBracket` i sina dev-scener helt (byggda innan detta steg fanns) — korrekt null, ingen krasch, men täcker inte cup-grenen visuellt i en levande baseline. Cup-grenen ÄR bevisad i enhetstest (`turneringslageService.test.ts`, alla sex lägen + cup-specifika edge-cases), bara inte i en Playwright-snapshot. Flaggat, inte tyst.

### Serie-/bracketblock — inte byggt
Ordern: "Tabellkortet i cup och slutspel ersätts av serieställning ('2–1 i matcher') eller bracketsteg." Detta är en **ny visuell komposition** (hur visas ett bracket-steg? en trädstruktur? en progressionsindikator?) — inte en tokens-tillämpning på ett redan etablerat kortmönster som Turneringsläge var. Samma MOCK-DRIVEN DESIGN-avvägning som tribute-grenen: ingen godkänd mock finns för hur ett bracket-block ska se ut. Att fritt uppfinna en visuell lösning här hade varit exakt den typ av Code-improviserad design CLAUDE.md:s princip 4 finns för att förhindra.

**Inte byggt, rapporterat.** Turneringsläge-kortet fyller delvis samma lucka (säger var laget står), men ersätter inte specifikt Tabell-slotens plats med en serieställning/bracket-visualisering. Om du vill ha den — antingen en snabb text-only-version (siffror redan tillgängliga: `series.homeWins`/`awayWins` för slutspel, `cupBracket`s rondnummer för cup, ingen ny mekanik) med `[Opus]`-märkt rubrik, eller en riktig mock först. Jag väntar på ditt beslut istf att gissa.

## 4. Omgångssammanfattning i cupmatch — rapport (ingen ändring gjord)

Fyndet: efter en cupmatch i snabbläge visar Omgångssammanfattningens Ekonomi-rad "+31 tkr/omg" — matrisen säger ⚠ (tonas, inte ✕) för cup, så registret gör rätt genom att visa raden. Frågan är om SIFFRAN och ORDET "omgång" är rätt attribuerade till en cupmatch.

**Rubriken ("Ekonomi", 💰):** statisk sträng, `GranskaOversikt.tsx` (raden med `{formatFinance(financesDelta)}/omg`). Ingen matchtyps-medvetenhet — visar "omgång" oavsett vad som spelades.

**Värdet (`financesDelta`):** `GranskaScreen.tsx`: `rs.financesAfter - rs.financesBefore`, där `rs` = `game.roundSummary`. Dessa två fält sätts i `gameFlowActions.ts`s `advance()`-action (rad ~60-108): en ögonblicksbild av `managedClub.finances` tagen **omedelbart före och efter hela `advance()`-anropet**. `advance()` kan i sig loopa igenom FLERA matchdagar automatiskt när managed club saknar egen fixture den omgången (t.ex. andra klubbars cuprundor) — men bryter loopen direkt vid den omgång managed club FAKTISKT spelar. I det rapporterade fallet (spelaren spelade själv en cupmatch) speglar `financesDelta` alltså exakt EN omgångs ekonomiska tick — samma beräkning (`weeklyBase` + ev. hemmamatch-intäkt + utgifter) oavsett om omgången var en liga- eller cupomgång. Siffran i sig är alltså inte fel eller matchtyp-läckande — ekonomin tickar likadant en cupomgång som en ligaomgång.

**Slutsats:** det är ORDET "omgång" som är missvisande, inte SIFFRAN eller beräkningen bakom den. En cupmatch ÄR strukturellt en omgång i spelmotorns mening (samma `advance()`-pipeline, samma ekonomi-tick) — bara inte i spelarens vokabulär för vad "omgång" betyder (ligarond). Två giltiga vägar, ditt kall:
- **✕ för cup** (matrisen ändras från ⚠ till ✕) — enklast, tar bort tvetydigheten helt.
- **Rubriken byter ord** (t.ex. matchtyps-medveten label, `axes.tavlingstyp`-grenad) — behåller informationen, kräver ny/villkorad Swedish text (`[Opus]`).

Ingen kodändring gjord. Väntar på ditt beslut.

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1526/1526 gröna (155 filer — +5 `granskaFlavorText`, +5 `generateQuickSummary`, +6 `playoffService` (`getManagedClubPlayoffStatus`), +15 `turneringslageService`).
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design` / `lint:text-guard`: gröna (`[Opus]`-strängarna är inga hex-/svensk-textbrott).
- Lokal Playwright (`scenes.visual.ts -g granska`): 4 förväntade pixel-diffar (`granska-cup`, `granska-cup-final`, `granska-slutspel`, `granska-avsked` — guld-scoreline + Turneringsläge-kort + `[Opus]`-text ändrar pixlarna avsiktligt) + 1 ny scen utan lokal Mac-baseline (`granska-sm-final`, förväntat). `granska` (liga) oförändrad, grön — ingen kollateral regression.
- Browser-verifierat samtliga sex scener (skärmdumpar i sessionens scratchpad): guld-scoreline på final, ingen falsk hemma/bortaseger-svans, Turneringsläge visas bara när avgjort, `[Opus]`-platshållare synliga där text saknas (som avsett — synlig platshållare, inte tystnad eller krasch).

## Väntar på dig
1. Serie-/bracketblock — text-only-version nu, eller mock först?
2. Omgångssammanfattning i cup — ✕ eller ordbyte?
3. Fullständig fysisk avgrening av avsked-tributen — värt sex block till i en egen, försiktigare session, eller är steg 2:s registerbaserade lösning (visuellt identisk, arkitektoniskt enklare) tillräcklig?
4. `[Opus]`-texten för de tre fast-läges-poolerna (steg 4) och de sex Turneringsläge-lägena (steg 5) — nio strängar totalt, listade ovan.
