# CODE-INSTRUKTION — genomgången 2026-09-11 (Opus), det som INTE fixades direkt

**Körordning och acceptanskriterier:** `CODE_KORORDER_GENOMGANG_2026-09-12.md`. Den här filen är fyndens fulltext (§0–§14); körordern säger i vilken ordning och när ett pass är klart.

**Datum:** 2026-09-11, fredag kväll
**Bakgrund:** Opus gjorde en helhetsgenomgång (kod, persistens, backend, bygge, CI, docs, IP) och fixade allt iteration-fritt direkt på disk. Det ligger OCOMMITTAT i arbetsträdet, se §0. Resten nedan kräver build/test-loop eller berör filer agenter arbetar i live — därför Code, inte Opus (ARBETSFÖRDELNING i CLAUDE.md).

## §0 — Opus edits i arbetsträdet, verifiera och committa FÖRST

Kör `npx tsc --noEmit && npx vitest run` (HELA sviten, inte scopad — LESSONS #57) och `npm run build` innan commit. Filer:

| Fil | Vad | Varför |
|---|---|---|
| `src/presentation/screens/match/MatchLiveScreen.tsx` | `liveMatchContext()` — en kontextkälla för alla fyra generatoranropen + `initialOnTargetHome/Away` vid halvtid/regenerering | De tre omsimuleringsvägarna (halvtid, taktikbyte, interaktivt mål) tappade `matchPhase`/`isPlayoff` — en SM-final simulerades som 'regular' från första hörnmålet (goalMod 0.768→1.0) — samt kapten, klack, hall, annandag, skandal. onTarget nollställdes vid varje regenerering (LESSONS #30 fixades bara i motorvägen). **Testrisk:** tester som asserterar exakta utfall EFTER ett interaktivt mål kan få andra siffror (fler rand-anrop för kommentar). Uppdatera förväntningarna, inte kontexten. |
| `src/presentation/store/actions/gameFlowActions.ts` | `simulateRemainingStep` använder `pickBestEleven` + `isPlayerInMatchSquad` + `restGamesRemaining`-filter | Top-11 på rå CA kunde ge en elva UTAN målvakt (goalkeeperScore 20) genom hela "Simulera resterande säsong"; vilande spelare fick setLineup att avvisa tyst |
| `server.js` | `app.set('trust proxy', 1)`; health-version = `RENDER_GIT_COMMIT` | Rate-limitern nycklade på proxyns IP (alla delade en hink); tre olika versionsnummer |
| `server/attention/routes.js` | `secretMatches()` med `timingSafeEqual` för cron-hemligheten | Konstanttids-jämförelse |
| `src/infrastructure/persistence/saveGameStorage.ts` | Snapshot-rotation per `reason` | `pre_migration` vid varje load roterade ut `pre_newgame` efter två sidladdningar |
| `src/infrastructure/persistence/__tests__/saveGameStorage.test.ts` | Nytt test för per-orsak-rotation | Regression |
| `vite.config.ts` | `globPatterns` utan bilder; `runtimeCaching` CacheFirst för `/assets/(portraits\|illustrations)/` | ~24 MB precache vid install |
| `index.html` | `maximum-scale=1.0` borttagen | WCAG 1.4.4 |
| `src/presentation/components/SectionLabel.tsx` | Ledande emoji i sträng-children → `<span aria-hidden>` | Skärmläsare läste "money bag EKONOMI". **Risk:** ett test som gör `getByText('💰 EKONOMI')` på en SectionLabel bryts (testing-library matchar egna textnoder). Blir sviten röd på det: uppdatera testet till `toHaveTextContent`, ändra inte komponenten. |
| `src/presentation/store/actions/transferActions.ts` + test | `signFreeAgent` ersätter på plats om spelaren redan ligger i `game.players` | Dubbelpost med samma id (se §13 för roten) |
| `src/domain/services/gameInvariants.ts` | Ny invariant `uniquePlayerIds` | Klassen nådde aldrig stresstestet. OBS: `INVARIANT_NAMES` fick ett 15:e namn — om `gameInvariants.test.ts` räknar längden, uppdatera testet |
| `src/domain/services/matchEngine.ts` | `wentToOvertime` spåras löpande, inte ur sista steget | Straffavgjorda matcher registrerade aldrig förlängningen |
| `src/application/useCases/seasonEndProcessor.ts` | Kapten nollställs även vid kontraktsutgång | Bindel på en fri agent |
| `src/presentation/screens/match/MatchLiveScreen.tsx` | Tavlans utvisningsnedräkning läser `durationMinutes` | Femminutare visade 10:00 |
| `render.yaml`, `.github/workflows/app-ci.yml`, `visual-baselines.yml` | Node 20 → 22 | Node 20 EOL 2026-04-30 |
| `CLAUDE.md` § Spelets värld | Klubbnamnspåståendet rättat + kommunvapen-regel | Var faktiskt fel |
| `README.md` | Ny | Fanns ingen |

Verifiera efter build att `dist/sw.js` INTE listar `assets/portraits/*` i precache-manifestet, och att en porträttbild i browsern får `x-cache`/svar från `bandy-images-v1` vid andra visningen.

Rotorsak i commit-meddelandet per fil, som vanligt.

## §1 — Code-splitting (iteration-tungt, egen commit)

Huvudchunken är 2,79 MB okomprimerad, en fil, 7 % under workbox-taket på 3 MiB (`vite.config.ts` säger själv "code-splitta, höj inte igen").

1. `React.lazy` + `Suspense` på route-nivå i `AppRouter.tsx` för: `SeasonSummaryScreen`, `SquadScreen`, `HistoryScreen`, `TabellScreen`, `InboxScreen`, `TransfersScreen`, `TilltradeScreen`, `GameOverScreen`, `DevScenesScreen` (den sista ska inte ens ligga i prod-bundeln — gate:a importen på `import.meta.env.DEV` om den inte redan är det).
2. Match-bundeln (`MatchLiveScreen` + `matchCore`/`matchEngine` + `presentation/components/match/*`) som EN lazy chunk — det är den tyngsta ytan och besöks först efter Portal.
3. Suspense-fallback: en tom yta med `--bg` (ingen spinner, ingen text — LESSONS #31, inget polish-tillägg).
4. Mål: huvudchunk < 1,5 MB. Läs av i `vite build`-utskriften, skriv siffran i commit-meddelandet.
5. Full `npm test` + `npm run build` + browsergenomgång Portal → Match → Granska → Årsbok på 390 px innan commit (route-lazy kan bryta `pendingScreenRedirect` om en lazy route inte hunnit laddas när redirecten fyrar — testa specifikt byte till annan save med pendingScreen satt).

## §2 — Illustrationer till webp (Code, ett pass)

23 JPG i `public/assets/illustrations/` väger 12 MB (final.jpg 1,04 MB, intro.jpg 1,02 MB). Intro-webp:erna på samma yta väger 55–115 kB.

1. Konvertera alla `*.jpg` i mappen till webp, kvalitet 80, max bredd 1170 px (390 × 3). Använd `sharp` via ett engångsskript i `scripts/`, committa inte skriptets output-JPG:er.
2. Byt referenserna: `src/presentation/components/eventIllustration.ts`, `IllustrationScene.tsx`, och `src/__tests__/imageAssetIntegrity.test.ts` (`illustrationNames` → `.webp`). Grep `assets/illustrations/` i `src/` för resten.
3. Ta bort JPG:erna när testet är grönt. Behåll `intro-bg.jpg` i roten oförändrad (den är redan 232 kB och precachad).
4. Mål: mappen < 3 MB.

## §3 — docs-omflyttning (mekaniskt, MEN inte medan Codex har claims)

352 filer i `docs/`-roten. Gör det i ett fönster där `MASTER_OPPET.md` inte har någon `in_progress`-rad (annars flyttar du filer en agent läser ur — LESSONS #51).

1. `git mv docs/DOM_*.md docs/dom/`, `docs/RAPPORT_*.md docs/rapport/`, `docs/HANDOVER_*.md docs/handover/`, `docs/CODE_INSTRUKTION_*.md docs/spec/`, `docs/SPEC_*.md docs/spec/`, `docs/DESIGN_UPPDRAG_*.md docs/spec/`, `docs/TESTINSTRUKTION_*.md docs/playtest/`.
2. Pekare: `grep -rln "docs/DOM_\|DOM_[A-Z]\|docs/RAPPORT_\|HANDOVER_20\|CODE_INSTRUKTION_\|SPEC_[A-Z]" CLAUDE.md CLAUDE_REFERENCE.md AGENTS.md docs/*.md design-system/**/*.md` och uppdatera varje sökväg. MASTER_OPPET:s `källa`-kolumn bär bara filnamn utan mapp — låt den vara, men lägg en rad i filens regler: "DOM-/RAPPORT-filer bor i `docs/dom/` resp. `docs/rapport/`".
3. CLAUDE.md sessionsstart steg 3 och "VID SESSIONSSLUT" pekar på `docs/HANDOVER_YYYY-MM-DD.md` → `docs/handover/`.
4. `MASTER_OPPET.md` "AKTUELL STATUS"-stycket: ersätt hela räknarnarrativet (34→32→31 …) med EN rad: `**Aktiva poster: N** (råräknat <datum>).` Flytta det gamla stycket ordagrant till `MASTER_ARKIV.md` under rubriken "Räknarhistorik 2026-09-08 → 2026-09-11". Ingen information tappas, filen blir läsbar.
5. `SLUTTEST_KO.md` (344 kB) och `BACKLOG.md` (277 kB) är dödmarkerade sedan 2026-08-31 → `docs/archive/`. Grep pekare först, som i steg 2.

## §4 — Toolchain-bump (Code, eget pass, efter §0 är grönt)

Vite ^5.2 → 6 (eller 7), vitest ^1.4 → 3, `@types/node` → 22. `npm install` uppdaterar lock-filen — därför Code, inte Opus (package.json/lock måste ändras ihop, annars failar `npm ci`). Kör hela sviten + build + `npm run test:visual` lokalt. Om vitest 3 ändrar `environmentOptions`-formen, följ deras migreringsguide, ändra inte testerna.

## §5 — Mätrad för save-storlek (Code, tre rader)

TS-8/GAP-5 är parkerad oro utan mått. I `persistAutosave` (gameFlowActions.ts): `if (import.meta.env.DEV) console.info('[save] bytes', JSON.stringify(game).length, 'ledger', game.eventLedger?.length ?? 0)`. Läs av efter Codex nästa 8-säsongskörning, skriv siffran i MASTER-raden. Under 2 MB → stäng oron. Över → då finns det något att spec:a.

## §7 — MOTORFYND: den hanterade klubbens attribut åldras aldrig (Jacob-dom + Code, mätt)

**Fakta (kodläst, tre filer):** `developPlayers()` (playerDevelopmentService.ts) är den ENDA funktionen som sänker attribut med ålder (ageFactor < 0 från 29). Den anropas bara i `playerStateProcessor.ts:468` och filtrerar uttryckligen bort den hanterade klubben ("AI clubs only"). Den hanterade klubbens spelare får i stället `applyRoundDevelopment()` — som bara rör `currentAbility`, aldrig `attributes` — plus `applyTrainingToSquad()` som bara ADDERAR. `seasonEndProcessor.ts` åldrar (`age + 1`) men rör inte attribut. **Matchmotorn läser attribut, inte CA** (`evaluateSquad`). Konsekvens: en 36-årig back i din klubb spelar med samma försvarssiffror som vid 28, medan AI-klubbarnas veteraner sjunker −0,45×0,15×… per varannan omgång. Unga i din klubb växer däremot LÅNGSAMMARE i attribut än AI-ungdomar (bara träning, ingen archetype-tillväxt). Netto över en lång karriär: din trupp blir en platt, oåldrad kloss, AI-truppen lever. Detta är sannolikt en bidragande orsak till att "hålla kvar veteranerna" är dominant strategi och att truppen känns statisk (GPT:s akademirapport: "för dåligt attribuerad").

**Vad som INTE ska göras:** köra `developPlayers` på den hanterade klubben rakt av — då dubbelräknas CA (applyRoundDevelopment + recalcCA) och träningens attributboostar staplas på archetype-tillväxten.

**Förslag till dom (Jacob):** låt `developPlayers` köra för hanterade spelare med `ageFactor < 0` ENBART (nedgångsfasen), med CA-delen avstängd (CA ägs redan av applyRoundDevelopment). Unga hanterade spelare behåller träning som enda attributväg (medvetet: spelaren VÄLJER vad de blir bra på). Code mäter före/efter med `npm run stress` över 6 säsonger: medel-defenseScore för hanterade 32+-spelare ska sjunka i samma takt som AI:s. Ingen konstant gissas.

## §8 — `contentContract.ts` är 267 kB prosa i produktionsbunten (Code)

Filen är ett dokumentationsregister (trigger/stateEffect/systems/lifespan/notes per narrativ form). Enda runtime-läsaren är `getWhyNowLine()` (ett fält). Resten — ~250 kB svensk prosa — skeppas till varje mobil och parsas vid start, ~9 % av huvudchunken. Dela filen: `contentContractRuntime.ts` (id + whyNow-fältet, litet) importeras av appen; det fulla registret flyttar till `scripts/` eller `docs/` och läses bara av `content-contract-guard.ts` och testet. TS-assertionerna (AssertNoMissingIds) behålls mot runtime-filen. Mät chunken före/efter.

## §9 — Död kod och dubbla sanningar i match/ (Code, inventera före radering — LESSONS #34)

- `useMatchTimer.ts` och `useMatchGenerator.ts` (match/) är kopior av logik som redan ligger inline i MatchLiveScreen.tsx; MatchLiveScreen importerar dem inte. Grep importerare i hela src/ + tests/. Noll träffar → radera. Träff → de är en andra sanning som ska försvinna åt andra hållet.
- `matchReducer.ts`: `INTERACTIVE_CORNER` är en no-op med placeholder-kommentar. `RESET_FROM_HALFTIME` skickas alltid `initialHomeSuspensions: 0` medan generatorn får halvtidsstegets faktiska utvisningar — två sanningar om samma sak. Reducern ska läsa samma värden som generatorn.
- `PlayerPosition.Midfielder` OCH `PlayerPosition.Half` finns båda i enumen (CLAUDE.md: "Midfielder = Half i bandy"). `evaluateSquad` behandlar dem olika (Midfielder räknas alltid offensivt, Half bara vid <3 anfallare men ALLTID defensivt). Om ingen spelare genereras som Midfielder är det död enum + en tyst asymmetri; om båda genereras är det en positionsmodell ingen dokumenterat. Grep `PlayerPosition.Midfielder` i worldGenerator/youthIntake/playerAttributeGenerator och avgör.

## §10 — PortalScreen (Code, små men verkliga)

- `useEffect(() => { … ResizeObserver … })` utan deps-array: skapar och kopplar loss en ny ResizeObserver VARJE render. Ge den `[]`.
- Mount-effekten som anropar `advance()` när klubben saknar match nästa matchdag körs två gånger under React StrictMode (dev) — två omgångar avanceras. Skydda med en ref (`didAutoAdvance`), samma mönster som `hasSimulated` i MatchLiveScreen.
- `document.body.style.background` muteras från en skärm. Det är en global sidoeffekt från en route; sätt den på GameShell-nivå eller via en klass på `#root`.
- CTA-etikettens härledning (cup-rundnamn, slutspelsrond, åskådarläge) är ~60 rader domänlogik i en vy. `nextActionCue.ts` finns redan som hem för exakt den klassen — flytta dit, testa som ren funktion.
- `BottomNav.tsx` bär rå `rgba(160,130,90,0.04)` i `backgroundImage` trots PORT 2 ("inga råa rgba/hex"). Token eller `color-mix`.

## §11 — Engine-observationer utan åtgärd (Jacob läser, ingen order)

- `evaluateSquad.offenseScore` är ett MEDELVÄRDE av anfallarna, inte en summa. Tre eller fem forwards ger samma anfallsstyrka om kvaliteten är lika; formationen verkar bara via `getPositionFit`-multiplikatorn. Det är den strukturella orsaken till att formationer ger <0,5 % skillnad — inte en kalibreringsfråga. Redan känt som begränsning; här är mekanismen.
- `getTacticModifiers` är nollsummesymmetrisk (offensiv +0,10 anfall / −0,10 försvar). I `chanceQuality`-formeln väger anfall 0,6 och försvar 0,4, så offensiv mentalitet är netto svagt positiv för båda lagen samtidigt (fler mål åt båda håll) — vilket är rätt känsla, men det betyder att "defensiv" aldrig är ett bra val mot ett svagare lag. Om det är avsikten: bra. Om inte: det är 0,6/0,4-vikterna, inte tabellen.
- Kemi (`chemMultiplier`) appliceras bara på den hanterade klubben. En ihopspelad startelva får upp till ×1,05 på både anfall och försvar som ingen AI-klubb kan få. Det är en dold svårighetsgradslättnad som växer med säsong 2–3. Mätbart i stress-testet: jmf managed vs AI vinstprocent vid lika CA, säsong 1 mot säsong 3.
- `ballControl` används inte i någon av evaluateSquads formler — träningsfokus "Bollkontroll" och archetype Dribbler:s bollkontroll-tillväxt påverkar matchen med exakt 0 (bara dribbling-delen räknas). Löftet i `trainingTypeDescription` ("Bollkontroll +0.3") är sant men verkningslöst — promise↔consequence-klass (LESSONS #41).
- Andra halvlek får en annan `matchProfile` än första (`pickMatchProfileFromSeed(seed)` med seed `fixtureSeed(id,31)` mot `fixtureSeed(id)`), trots kommentaren "same result for both halves sharing the same seed". En defensive_battle kan bli chaotic i paus. Skicka `matchProfile` som input från första halvlek i stället för att rulla om.

## §6 — Repo-hygien (Jacob eller Code, en minut)

`git branch --merged main | grep -v main | xargs git branch -d` och `git worktree prune`. `.git/config` bär 16 döda `worktree-agent-*`/`claude/*`-poster.

## §12 — MOTORN: utvisningar överlever halvleksgränsen (Code, stresstest-loop, EGEN commit, patch-bump på MATCH_ENGINE_VERSION)

**Fynd (kodläst `matchCore.ts` + `matchEngine.ts` + `MatchLiveScreen.tsx`):** `simulateMatchCore` seedar `homeActiveSuspensions`/`awayActiveSuspensions` från `initialHomeSuspensions`/`initialAwaySuspensions` — men `homeSuspensionTimers`/`awaySuspensionTimers` är ALLTID tomma arrayer vid generatorstart. Timer-loopen har då inget att räkna ner, så en utvisning som är aktiv vid halvtid (eller vid varje interaktiv regenerering/taktikbyte) sitter kvar HELA resten av matchen + förlängning: penaltyFactor 0.65 på det utvisade laget och powerplayBoost 1.20 på motståndaren i 30 steg i stället för ≤7.

**Frekvens:** 3,77 utvisningar/match × 10 min → sannolikheten att minst en är aktiv vid minut 45 är grovt 35–40 % av alla matcher. Det är inbakat i kalibreringen (stresstestet kör samma två halvlekar), så en fix flyttar aggregaten — därför Code med stresstest, inte Opus.

**Fix:**
1. `MatchStep.activeSuspensions` får två nya fält: `homeTimers: number[]`, `awayTimers: number[]` (återstående steg per aktiv utvisning) — yield:as varje steg.
2. `SecondHalfInput` får `initialHomeSuspensionTimers?: number[]`, `initialAwaySuspensionTimers?: number[]`.
3. `simulateMatchCore`: `const homeSuspensionTimers = [...(input.initialHomeSuspensionTimers ?? [])]` (d:o away). Fallback när count > 0 men timers saknas (äldre anropare): fyll med `Math.round(10/1.5)` per aktiv — hellre en full utvisning än en evig.
4. Alla fem anropsställen matar timers: `matchEngine.ts` (andra halvlek), `MatchLiveScreen.tsx` (`handleApplyTactic`, `applyQuickTactic`, `regenerateRemainderWithUpdatedScore`), `useMatchGenerator.ts` (eller radera den, se §9).
5. Regressionstest: första halvlek med en utvisning i steg 28 (2 steg kvar) → andra halvlek ska visa `homeCount === 0` från steg 33. Idag: 1 hela vägen till steg 60.
6. Kör `npm run stress` + `npm run analyze-stress`; förvänta något högre målsnitt för det utvisade laget i 2H och något lägre totalt powerplay-mål. Om `goalsPerMatch` glider >0,15 från 9,12: justera INTE GOAL_RATE_MOD i samma commit — rapportera siffran till Opus först (kalibrering bumpar major).

## §13 — Mindre motor-/livefynd (Code, samla i en commit)

- `matchEngine.ts`: `report.penaltiesHome/penaltiesAway` är hårdkodade `0` — straffar räknas aldrig i den simulerade rapporten (live-vägen fyller dem från straffläggningen). Räkna `MatchEventType.Penalty` per klubb ur `allEvents`, som `savesHome` redan gör.
- `matchCore.ts`: `lastMinutePressData.fatigueLevel` räknas som `100 - morale`, inte kondition. Antingen läs `100 - p.fitness` eller döp om fältet — det som visas får inte heta trötthet och vara moral.
- `matchCore.ts`: två versionskonstanter (`MATCH_ENGINE_VERSION = '1.2.2'`, `ENGINE_VERSION = '1.2.0'`) — ta bort den ena.
- `MatchLiveScreen.tsx`: `handlePenaltyChoice` anropar `resolveAIPenaltyKeeperDive('offensive', rand)` med hårdkodad mentalitet oavsett motståndarens taktik. Läs motståndarens `tactic.mentality`.
- `seasonEndProcessor.ts`: AI-klubbarnas nyintagna ungdomar (`youthPlayers`) går in i `resetPlayers`-mappen och får `age + 1`, `seasonsPlayed = 1`, en `caHistory`-post och en `seasonHistory`-post för en säsong de aldrig spelade. Intaget bör slås ihop EFTER reset-mappen, inte före.
- `seasonEndProcessor.ts`: `transferState.freeAgents` är KOPIOR av spelare som också ligger kvar i `game.players` (clubId 'free_agent'). Kopiorna åldras inte, spelarna gör det — friagentlistan visar stale ålder/stats efter en säsong. Rotfix: gör `freeAgents` till en id-lista (eller en projektion av `players.filter(clubId === 'free_agent')`), aldrig en andra kopia. Opus-fixen i `signFreeAgent` (§0) täpper symptomet (dubbelpost), inte roten.

## §14 — Design/UI-fynd (Design dömer, Code bygger)

- `PortalScreen.tsx`: "Vad nu?"-cuen på sticky-CTA:n sätts med `fontSize: 10.5` — off-scale mot typografikanon (minsta textroll är `.h-quote-sm` 11px, labels 9px versaler). 10,5 px brödtext på en telefon är under läsbarhetsgolvet. Design: välj roll (`.h-quote-sm` eller `.h-label`), Code byter.
- Inline `style={{ fontSize: 12 }}`-värden förekommer i Portal-CTA-stacken trots typografikanon (DECISIONS 2026-06-26). Inte fel i sig men samma drift kanonen skrevs för; `ds-guard` fångar det bara om baslinjen sänks.

*(Not: §6–§14 skrevs av två Opus-instanser parallellt i samma träd samma kväll — LESSONS #51 i praktiken. §7–§11 är den andra instansens; §12–§14 denna. Överlapp (useMatchGenerator, ResizeObserver, matchProfile) är sammanslaget till den andra instansens paragrafer.)*

## Jacob-beslut (inte Code)

- **`docs/data/bandygrytan_detailed.json` i repot?** Bandygrytan.se har databasskydd (sui generis) inom EU. Internt för kalibrering är det oproblematiskt; om repot är eller blir publikt är det en kopia av någon annans databas. Alternativ: gitignore + lokal katalog, samma mönster som `INTERNAL_*`. Referee-datan är redan hanterad så.
- **Mätbart mål för soft-launchen** utöver "ingen krasch". Analytics-röret finns (`install`, `first_match`, `season_completed`, `session_end`). Förslag: båda testarna når `season_completed` ≥ 1 och median `session_end.durationSeconds` > 15 min. Utan en siffra vet ni inte om soft-launchen lyckades.
