# CODE-KÖRORDER — 2026-09-12 em (efter Jacobs domar)

**Kontext:** Codex kör redan `genomgang-toolchain-bump` och `genomgang-match-dod-kod` (in_progress, claimade — rör dem inte). Den här körordern är för den ANDRA Code-instansen som är arbetslös. Alla rader nedan är `verifierad` i MASTER och kodlästa av Opus — det är arbetsordrar, inte hypoteser. Claima raden i MASTER (`in_progress` + timestamp, egen commit) innan du börjar, hoppa `in_progress`-rader.

Turordning efter värde per timme. Ta uppifrån.

---

## 1. `genomgang-motor-attribut-aldras-ej` — EGEN commit, stress-loop

Det tyngsta återstående fyndet. Din trupp åldras aldrig i attribut (bara AI). Rot kodläst av Opus i `playerDevelopmentService.ts`: `developPlayers` (nedgångsfasen) är AI-only; `applyRoundDevelopment` (managed) rör bara `currentAbility`, lämnar `attributes` orörda; `evaluateSquad` läser attributen.

1. Bygg `applyVeteranAttributeDecline(players, managedClubId, seed)` i `playerDevelopmentService.ts`.
2. Körs på managed-spelare med `age >= 31` vid säsongsslut (`seasonEndProcessor.ts`, i reset-mappen där åldern redan stegats).
3. Applicerar `developPlayers` NEDGÅNGSGREN — `getAgeFactor < 0`-vägen, samma `baseChange`-formel, samma random-extra-decline-attribut — på `attributes`. **RÖR INTE `currentAbility`** — omgångssystemet (`applyRoundDevelopment`) äger CA; annars dubbelräknas nedgången.
4. Återanvänd `getAgeFactor` och `getArchetypeMultiplier`. Gissa ingen ny konstant.
5. Placering i rollovern: EFTER `applyRoundDevelopment`s sista körning för säsongen, FÖRE `updateActiveLegendFlags`. Kolla att det inte krockar med `caHistory`-skrivningen.
6. Riktat test: en 34-åring i managed och en i AI med identiska startattribut ska ha jämförbar attributnedgång efter tre säsonger (idag: managed platt, AI sjunker).
7. Mät: `npm run stress` 6 säsonger, managed-veteranernas attributsnitt ska konvergera mot AI-veteranernas kurva. **Detta ändrar sannolikt matchutfall** (svagare veteraner → färre mål från åldrande trupp). Om `goalsPerMatch` glider >0,15 från nuvarande: rapportera till Opus, rör inte GOAL_RATE_MOD. Bumpa `MATCH_ENGINE_VERSION` patch om utfallet rör sig.

**Klart när:** testet grönt, stress visar konvergens, siffran i commit-meddelandet, full svit + build gröna.

## 2. `arsbok-toppbetyg-matchgolv` — en rad + test

`seasonSummaryService.ts`, `topRatedEntry`-filtret: byt `r.games >= 5` till `r.games >= Math.max(5, clubFixtures.length / 2)`. `clubFixtures.length` finns redan i scope i `generateSeasonSummary`. Kräver elva matcher i en full 22-omgångarssäsong, degraderar korrekt i en avbruten.

Riktat test: en spelare med nio matchers snittbetyg 8,5 vinner INTE toppbetyget över en med tjugotvå matchers 7,8 i en full säsong; i en avbruten 8-omgångarssäsong gäller golvet 5. Vikta INTE snittet mot speltid.

**Klart när:** testet grönt, full svit grön.

## 3. `genomgang-motor-smafynd` — EN commit, sex punkter

Sex verkliga fel i `matchEngine.ts`/`matchCore.ts`/`seasonEndProcessor.ts`, se §13 i `CODE_INSTRUKTION_GENOMGANG_2026-09-11.md`:

- `matchEngine.report.penaltiesHome/penaltiesAway` hårdkodade `0` → räkna `MatchEventType.Penalty` per klubb ur `allEvents`, som `savesHome` redan gör.
- `lastMinutePressData.fatigueLevel = 100 − morale` → läs `100 − p.fitness` eller döp om fältet. Det som visas som trötthet får inte vara moral.
- Två versionskonstanter (`MATCH_ENGINE_VERSION = '1.2.3'`, `ENGINE_VERSION = '1.2.0'`) → ta bort den ena. (Utvisningsraden §12 rör också denna — ta den där om den commiten landar först, annars här. Inte båda.)
- `handlePenaltyChoice` / AI-penalty: `resolveAIPenaltyKeeperDive('offensive', …)` hårdkodad mentalitet → läs motståndarens `tactic.mentality`.
- AI-ungdomsintag i `seasonEndProcessor` går genom reset-mappen och får `age+1`, `seasonsPlayed=1`, `caHistory`- och `seasonHistory`-post för en säsong de aldrig spelade → slå ihop intaget EFTER reset-mappen.
- `transferState.freeAgents` är kopior som inte åldras medan originalen i `players` gör det. Rot till dubbelposten Opus täppte i `signFreeAgent`. Gör `freeAgents` till en id-lista eller en projektion av `players.filter(clubId === 'free_agent')` — aldrig en andra kopia.

Riktade tester per punkt. freeAgents-roten är störst; om den blir för stor för commiten, bryt ut den till egen rad och ta de fem andra först.

**Klart när:** sex riktade tester gröna, full svit + build gröna.

## 4. `genomgang-portal-effekter` — fem små edits, browserprov

`PortalScreen.tsx`, se §10:
- `ResizeObserver`-effekt utan deps-array → `[]` (ref är stabil), observern lever.
- Mount-advance dubbelkörs i StrictMode → guarda.
- `body.style`-mutation från route → städa i cleanup.
- CTA-etikettlogik i vyn → bryt ut.
- BottomNav rå `rgba` → token.

**Klart när:** browserprov 390 px (Portal → Match → tillbaka, ingen dubbeladvance), full svit grön.

## 5. `genomgang-save-storlek-matrad` — tre rader

`persistAutosave` (gameFlowActions.ts): `if (import.meta.env.DEV) console.info('[save] bytes', JSON.stringify(game).length, 'ledger', game.eventLedger?.length ?? 0)`. Läs av efter nästa 8-säsongskörning, skriv siffran i MASTER-raden. < 2 MB → stäng oron. Över → spec.

## 6. `genomgang-docs-omflyttning` — BARA i claim-fritt fönster

Villkor: inga `in_progress`-rader i MASTER när du startar. Just nu finns TVÅ (toolchain, match-död-kod) — vänta tills de är arkiverade. Sedan §3 i instruktionen: `git mv` dom/rapport/handover/spec/playtest, grep-uppdatera pekare, räknarstycket → en rad + ARKIV.

---

## Avgjort, ingen Code-åtgärd
- **bandygrytan-datan stannar i repot** (Jacob 2026-09-12: icke-problem, ingen persondata). Rör den inte.
- **soft-launch-målen** står i RELEASE_DEFINITION_MJUKLANSERING.md — utvärderas efter launch, ingen kod nu.

## Väntar på Opus/Design, inte dig
- `genomgang-portal-cue-typografi` — Design väljer textroll först.
- `genomgang-motor-utvisning-halvlek` — Opus kalibreringsdom klar i MASTER; Codex äger raden, kör bara `calibrate:firing:formal` och arkiverar. Inte din.
