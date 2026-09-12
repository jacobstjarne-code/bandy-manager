# RAPPORT — styrelseobjektiven: hur de sätts, vad de kostar, tier-medvetenhet

**2026-08-25.** Beställt efter tolv-klubbars-mätningen visade sig oförändrad över tre körningar trots två fixade, tier-medvetna mekanismer (ankaret + den löpande förlusttermen). Jacobs hypotes, ordagrant: "Om ett publikmål eller en placeringssiffra sätts oberoende av tier så är det där dräneringen sitter — och då är fixen att objektiven härleds ur förväntan, inte att kostnaden skalas."

**Svar i korthet: hypotesen stämmer exakt.** `boardObjectiveService.ts` läser `ClubExpectation`/`boardExpectation` INGENSTANS — varken vid val av vilket objektiv en klubb får, eller vid sättning av dess måltal. Bekräftat med `grep`, noll träffar i hela filen.

---

## 1. Hur objektiven sätts

`generateBoardObjectives()` (`boardObjectiveService.ts:232-332`). Urvalet styrs av RÅA klubbfält, aldrig av `boardExpectation`:

- **Ekonomi (kassör):** `finances < 0` → balanceBudget · `finances < 500 000` → growFinances · `finances >= 2 000 000` → investSurplus.
- **Akademi (traditionalist):** ≥2 homegrown-startspelare → 50/50 improveYouth/playHomegrown; annars alltid improveYouth.
- **Community (modernist):** `supporterGroup.mood < 60` → growFanbase · `facilities < 50` → improveFacilities.
- **Sport (supporter):** ett objektiv slumpas EN GÅNG ur poolen `[cupRun, topHalf, reduceInjuries]` (plus beatRival om en rival har en förlustsvit) — `pool[Math.floor(rand() * pool.length)]`. **Samma odds, oavsett tier.**

Kandidaterna Fisher-Yates-blandas, 2 (eller 3 vid 30% chans) behålls. `boardExpectation` förekommer noll gånger i hela filen — varken som parameter, lokal variabel eller villkor.

## 2. Varje objektivtyp — måltal, tier-medvetet?

| Objektiv | Måltal | Tier-medvetet? |
|---|---|---|
| balanceBudget | finances ≥ 0 | Nej |
| growFinances | +100 000 kr | Nej — flat för alla klubbar, oavsett budgetstorlek |
| investSurplus | finances ≤ 2 000 000 | Nej |
| playHomegrown | ≥3 homegrown-startande, snitt 5 matcher | Nej |
| improveYouth | ≥1 uppflyttad akademispelare | Nej |
| growFanbase | mood ≥ 70 | Nej — flat 70 för alla klubbar |
| improveFacilities | ≥1 byggd/aktiv anläggningsnod | Nej |
| **cupRun** | vinn runda 3 (semifinal) | **Nej — flat rundkrav oavsett seedning** |
| reduceInjuries | ≤5 skador | Nej |
| **topHalf** | placering ≤6 av 12 | **Nej — flat topp-6 oavsett förväntad slutplacering** |
| beatRival | 1 vinst mot rival | Nej |

Jämför med `boardService.ts`s säsongsslutsterm, som EXPLICIT nyckla mot tier via `BOARD_EXPECTATION_ANCHOR_POSITION` (Survive ankare=12, WinLeague ankare=1) — objektiven har ingen motsvarighet alls.

## 3. Vad ett missat objektiv kostar

`OBJECTIVE_PATIENCE_COST = {met: 3, at_risk: -2, active: 0, failed: -5}` (`seasonEndProcessor.ts:766-768`) — flat, inte tier-skalad. Anropas vid säsongsslut per objektiv.

**Rättelse av en tidigare sessionspremiss:** kostnaden är INTE helt oskyddad av meritbufferten längre. Efter femte koefficientrundan (2026-08-23) delas kostnaden i två:
- `bufferEligibleObjectiveDelta` — kombineras med positionstermen, SKYDDAS av bufferten.
- `unprotectedObjectiveDelta` — bara vid UPPREPAD miss av SAMMA objektiv-id, `-5` träffar `boardPatience` direkt, HELT oskyddat.

`SaveGame.ts:220-222`s kommentar om buffertens scope är alltså föråldrad dokumentation — matchar inte längre koden efter femte koefficientrundans utökning.

**Praktisk konsekvens för Heros:** eftersom `topHalf`/`cupRun` är strukturellt nästan omöjliga (se nedan) och samma objektiv-id kan återkomma en senare säsong, träffar den ANDRA missen samma objektiv `-5` OSKYDDAT — en andra, i dag oskalad dränering av samma form som den löpande termen redan fixad.

## 4. Heros (Survive, 14-23% vinstandel) mot en WinLeague-klubb

Samma pool, samma odds, radikalt olika verklig sannolikhet:

- **topHalf (≤plats 6 av 12):** för en klubb som strukturellt är ligans svagaste, i praktiken oåtkomligt (uppskattningsvis enstaka procent eller lägre). För en WinLeague-klubb nästan garanterat.
- **cupRun (vinn runda 3):** de fyra högst rankade klubbarna (Heros INTE bland dem) får bye till runda 2. Heros måste vinna TRE raka slutspelsmatcher från runda 1 — vid ~14-23% vinstchans per match, ungefär `0,18³ ≈ 0,6-1%`. I praktiken ouppnåeligt. En topp-klubb med bye till runda 2 behöver bara två vinster från en mycket starkare baslinje.
- **reduceInjuries:** ej kopplat till vinstandel/rykte — jämförbara odds för båda.
- **growFanbase (mood≥70):** matchresultat driver mood (vinst +2 till +4, förlust -3 till -5). Vid Heros vinstandel är förväntad drift per match starkt negativ (~-2,6), vilket håller mood strukturellt lågt — samma tröskel (70) gäller ändå. En vinnande klubb håller mood komfortabelt över gaten och möter sällan ens detta objektiv.
- **growFinances/investSurplus:** gated på rent `finances`, sannolikt korrelerat med vinstandel men inte spårat i denna passning.

**Slutsats:** ungefär två av tre sport-pool-alternativ (topHalf, cupRun) är objektiv Heros strukturellt inte kan klara, tilldelade med EXAKT samma sannolikhet som för en klubb som klarar dem lätt.

## 5. Definitivt svar

**Nej.** Ingen mekanism, någonstans i `boardObjectiveService.ts` eller dess anropsställen, läser en klubbs `ClubExpectation` — varken vid val av objektivtyp eller vid sättning av måltal. Bekräftar Jacobs hypotes ordagrant: objektiven är byggda för slump, inte härledda ur en bedömning. Båda tidigare fixarna (ankaret, den löpande förlusttermen) verkar helt utanför `boardObjectiveService.ts` och rör aldrig objektivgenerering eller -utvärdering — en Survive-klubb kan fortfarande tilldelas, och sedan straffas för att missa (med den oskyddade upprepnings-påföljden ovan), objektiv som aldrig härleddes ur dess tier.

---

## Inget byggt. Väntar på Jacobs dom om riktning.
