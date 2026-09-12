# Rapport: hur Survive-tierns nya avskedskontrakt avgränsas mekaniskt

2026-08-25. Jacobs order: "boardPatience ska inte kunna nå avskedströskeln på enbart sportsligt utfall när expectation är Survive... Rapportera hur det avgränsas mekaniskt innan du bygger — det får inte betyda att en Survive-klubb är osparkbar." Kodläsning klar, inget byggt i denna rapport (fixen görs direkt efter, samma pass).

## Alla faktiska avskedsvägar, verifierade i kod

`managerFired` sätts på EXAKT tre ställen i hela kodbasen:

1. **`seasonEndProcessor.ts:1034-1036`** — `if (newBoardPatience <= 15 || newConsecutiveFailures >= 3) { managerFired = true }`. **Sportsligt utfall, båda halvorna.** `newBoardPatience` byggs av matchresultat (löpande term) + säsongsslutets positionsgap + objektivkostnad. `newConsecutiveFailures` räknas i `computeBoardPatienceUpdate` (`boardService.ts`) som `finalPos >= relegationZoneStart ? currentFailures+1 : 0` — ren tabellplacering.

2. **`seasonEndProcessor.ts:1044-1046`** — `licenseCheck.action.type === 'license_denied'` → `managerFired = true`. **Rent finansiellt.** `checkLicenseStatus` (`licenseService.ts`) styrs av `computeNetResult(game)` = kassans förändring under säsongen, INTE tabellplacering eller matchresultat. Progression: 2 raka förlustår → varning, 3 → poängavdrag, 4 → licens nekad (avsked). En klubb som spelar dåligt men går finansiellt jämnt ut (rimligt för Survive — Heros låga lönebudget mot sin publikintäkt) triggar aldrig detta.

3. **`postRoundFlagsProcessor.ts:37-38`** — VARJE OMGÅNG, oberoende av säsongsslut: `evaluateFinanceStatus(finances).status === 'game-over'` (finances < -2 000 000) → `managerFired = true` direkt. **Rent finansiellt, konkurs.** Detta är den mekanism Jacobs order kallar "Ekonomi (konkurs)" — bekräftat att den existerar, är verkligt oberoende av boardPatience/tabellplacering, och redan aktiv för alla tolv klubbar inklusive Heros/Rögle.

**Slutsats: Jacobs premiss stämmer exakt mot koden.** Väg 1 är den enda sportsligt drivna. Väg 2 och 3 är redan idag helt oberoende av matchresultat — de kräver ingen ändring för att "stå kvar", de gör det redan.

## Ett fynd på vägen: väg 1:s två halvor är MER sammanflätade än rapporterat hittills

`RELEGATION_ZONE_SIZE = 2`, 12 lag → `relegationZoneStart = 11`. Survive-ankaret är position 12. **Det betyder att Survive-klubbens FÖRVÄNTADE, kanoniska placering ligger INUTI nedflyttningszonen** — `newConsecutiveFailures` byggs upp så gott som varje säsong en Survive-klubb presterar precis som tänkt, inte som ett undantagsfall. Stresskörningarnas klassificeringsskript (`h4-alla-tolv-avskedsfrekvens.ts`s `classifyFiredReason`) kollar bankruptcy → boardPatience<=15 → consecutiveFailures>=3 i den ordningen och returnerar den FÖRSTA träffen — så när Heros mätning visar "boardPatience<=15=20/20" säger det INTE att consecutiveFailures var 0 i de fallen, bara att boardPatience alltid hann under 15 FÖRST. Med bara boardPatience-halvan borttagen hade `consecutiveFailures>=3` sannolikt tagit över som ny huvudorsak för Heros — måste alltså tas bort samtidigt, inte bara boardPatience-jämförelsen. Bekräftar att hela rad 1034 (båda villkoren) är "sportsligt utfall" i den mening ordern menar, inte bara första halvan.

## Den mekaniska avgränsningen — föreslagen, minimal

```ts
// seasonEndProcessor.ts, rad 1034
const isSurviveTier = managedClubExpectation === ClubExpectation.Survive
if (!isSurviveTier && (newBoardPatience <= 15 || newConsecutiveFailures >= 3)) {
  managerFired = true
}
```

`managedClubExpectation` finns redan i scope (rad 829, läst ur `game.clubs` — DENNA säsongs expectation, inte nästa säsongs redan stegade värde — rätt semantik: döms mot det kontrakt som gällde när säsongen spelades). Ingen ändring av `computeBoardPatienceUpdate`, `boardPatience`-VÄRDET, eller objektivkostnaden — de fortsätter räknas och visas precis som idag, bara TRÖSKELN mot avsked stängs av för Survive. Rad 1044-1046 (licens) och `postRoundFlagsProcessor.ts:37-38` (konkurs) rörs inte alls — redan oberoende, redan aktiva.

## Är en Survive-klubb osparkbar efter detta? Två äkta vägar kvar, en öppen empirisk fråga

**Teoretiskt: nej, två oberoende finansiella vägar kvarstår** (konkurs, licensnekan efter 4 raka förlustår). Ingen av dem är hypotetisk kod — båda är verifierat wired och redan mätbart aktiva i stresskörningarna för andra svaga klubbar (Skutskär fick licenseDenial i 9/20 fall i fjärde mätningen).

**Empiriskt öppet: Heros SPECIFIKT visade noll bankruptcy/license-fall i fjärde mätningen** — men det berodde sannolikt på att boardPatience<=15 hann först (säsong 2-3, snabbare än 4 raka förlustår hinner ackumuleras). Med boardPatience-vägen borttagen får Heros LÄNGRE tid att leva, vilket ger de finansiella vägarna verklig chans att triggas om de någonsin skulle — men jag kan inte garantera det utan att mäta. **Rekommendation: en femte 12-klubbars-mätning direkt efter bygget, med särskilt fokus på Heros/Rögles fired-reason-fördelning över LÅNGA karriärer (fler än 4 säsonger) — om Heros blir 0% avsked över t.ex. 10 säsonger är det värt att veta, det är antingen exakt vad "hålla ut"-kontraktet ska ge, eller ett tecken på att konkurs/licenströskeln behöver egen kalibrering för en klubb med Heros låga lönebudget.**

## Body/text-konsekvens (INTE byggd, flaggad)

Om Survive slutar kunna avskedas på boardPatience, blir `boardPatience<=15`-relaterad UI (patience-zonen, "styrelsens tålamod tryter"-varningar) potentiellt missvisande för just denna tier — den visar fortfarande en sjunkande siffra som ser ödesdiger ut men aldrig leder till avsked. Ren texträttning, inte kod — flaggas till Opus, byggs inte här.
