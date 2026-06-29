# CODE-ORDRAR — Systemkartans fynd (samlat)

> **✅ HISTORISK — allt här är byggt. Aktuell status: `KORLISTA_CODE_RC.md`.**
> Denna fil var den ursprungliga orderlistan för kartfynden (PRIO 1–7). Alla är levererade och grinden är sedan länge passerad (basen spelbar, RC-vägen grön). Grind-språket nedan är därför inaktuellt — behåll filen för detaljerna i varje order (rotorsaker, kodsnuttar), men läs status i körlistan, inte här.

---

**Datum:** 2026-06-12 · **Av:** Opus · **Källa:** `docs/SYSTEMKARTA_DEL1_2026-06-12.md` (DEL 2b–2h)
**Status:** application-lagret radläst 100 %, 13 kartfynd. Detta dokument samlar de fynd som blivit Code-ordrar, i prioritetsordning. Kör EFTER att försoningssvepet är landat (klart 2026-06-12, `2af82dd`). Rapportregel: en commit per huvudpunkt, titel matchar diff, hash + faktiskt innehåll i redovisningen.

---

## ⛔ GENOMSPELNINGS-GRINDEN (läs först)

Jacob spelar INTE förrän basen är stabil — att spela mot en kodbas mitt i städning ger brus i spelkänsle-datan (loggade "buggar" som redan är på väg bort). Därför:

**PRIO 1–4 ÄR GRINDEN.** När dessa fyra är gröna och committade (Math.random-determinism, väderloop, Birger-kanonisering, grep-svep inkl. processors/) — **säg till Jacob.** Då, och inte förr, börjar genomspelningen mot en stabil bas.

**PRIO 5–7 BLOCKERAR INTE genomspelningen** — emoji-sweep, V2/V4, lågprio-städ kan ske parallellt med eller efter att Jacob spelar utan att förorena datan. Krängla in dem när det passar, men håll grinden (1–4) först.

---

## PRIO 1 — Math.random() i spellogiken (KARTFYND 10, korrekthetsbug)

**Problemet:** Fem osådda `Math.random()`-anrop i simuleringskedjan bryter A1/fixtureSeed-determinismkontraktet. Ladda samma save, spela samma omgång → olika utfall. Det är en korrekthetsbug, inte kosmetik — därför prio 1, före all polish.

**Kända träffar:**
1. `playerStateProcessor.ts` — matchstraff-rullningen (`Math.random() < 0.02`)
2. `statsProcessor.ts` — fläckspelarnas minuter (`Math.floor(Math.random()*11)`)
3. `statsProcessor.ts` — bänk-bandybyten-minuter
4. `transferProcessor.ts` — C-T9 rivalförsäljnings-text (`Math.floor(Math.random()*...)`)
5. (verifiera om fler finns)

**Uppdrag:**
- Grep `Math.random()` i HELA `src/application/` OCH `src/domain/services/`. Lista alla träffar.
- Byt varje träff i simuleringskedjan mot seedad rand. playerStateProcessor har redan `localRand` i scope. statsProcessor saknar seed → lägg till seed-param i signaturen (`nextRound + playerId.charCodeAt(0)` som mulberry32-seed räcker). transferProcessor har `localRand` i scope (executeAcceptedTransfers tar inte rand → härled ur bid.id + nextMatchday).
- Lämna `Math.random()` som är RENT kosmetiska/UI orörda, men dokumentera vilka du bedömde som kosmetiska.
- Commit: `fix: seedad rand i spellogik (determinism, kartfynd 10)`.

**LESSON-kandidat (lägg i lessons-dokumentet):** "Ingen `Math.random()` i game-logik — bara i UI/kosmetik. All simulering ska vara reproducerbar från seed."

## PRIO 2 — Väderloop-wiring (KARTFYND 1)

Se `docs/CODE_ORDER_VADERLOOP_2026-06-12.md` — fullständig order med färdig kodsnutt för economyProcessor §1a (verifierad timing) + calcAttendance-anroparna + EkonomiTab-estimatet. Mottagarsidan (`effectiveWeatherAttendance`) är redan byggd av Opus i economyService. Verifiera: heavySnow ~40 % publikdipp, SM-final i snöstorm ~20 % (halverad). Commit: `feat: wira väder→publik-loop (kartfynd 1)`.

## PRIO 3 — Birger-kanonisering (KARTFYND 2)

`generateSupporterGroup`: för MANAGED klubb, tvinga `leader.name = 'Birger'` (overrideName-mönstret finns). Textkanon (klackEchoText, hallDebateData, prövningspoolerna) hårdkodar Birger; generatorn väljer ur pool → namnkrock på leader.name-ytor. Övriga klubbar orörda. En rad. Commit: `fix: kanonisera managed klacks ledare till Birger (kartfynd 2)`.

## PRIO 4 — Grep-svepet inkl. processors/ (KARTFYND 9 + §7/§9)

**KRITISKT (kartfynd 9):** textauditens grep-svep MÅSTE köras även mot `src/application/useCases/processors/`. Lager 2-copyn (WAGE_OVERRUN_WARNING/DEDUCTION, RISKY_SPONSOR_OFFERS ×4, MECENAT_WITHDRAWAL_TEXT ×3) ligger inline där och är O-auditerad — textauditen letade bara i data/ + services/.

Greppa i `data/` + `services/` + `processors/`:
- F1–F6-klasserna (fotbollstermer, hockeyperioder, engelska, påhittad spelfakta, etc.)
- "tre poäng"/"Tre poäng" → mekaniskt till "två"/"Två" där det är segerpoäng (RF-avdrag undantaget, kartfynd G1b)
- emoji i inbox-titlar (severity-dots bär signalen) — se samlad lista nedan
- `Vänersborg|Edsbyn` som klubbnamn (skrivguiden DEL 1 förbjuder)

Träfflistorna till Opus för dom. Mekaniska tvåpoängsbyten får Code göra själv.

## PRIO 5 — Emoji-titel-sweep (samlad lista ur §8b–§8g)

Alla dessa är inbox-/event-TITLAR med emoji som strider mot inkorg-recutens kanon. Titel-emojis bort; subtitle/body-emojis bedöms separat (många är INNEHÅLL och behålls).

| Fil | Emoji-titlar |
|---|---|
| roundProcessor | 🚨📬📈📉 (resultat/sponsor/marknadsvärde) |
| seasonEndProcessor | 🎖️ ×2 (legend, ceremoni) · ✅/❌ (objectives) |
| communityProcessor | 🏛️ ×3 · 👥 ×2 · ⚠️ · 🤝 · 💰 |
| eventProcessor | ⚠️ ×2 · 🚨 · 📋 |
| sponsorProcessor | 📋 ×2 |
| narrativeProcessor | ⚠️ Nemesis, 🔥 Derby — REDAN FIXADE av Opus |
| transferProcessor | 📰 ×2 (saga, rykten) |
| youthProcessor | 📋 (P19-rapport) |
| cupProcessor | 🏆 ×2 (direktkval, cupvinnare) |
| postRoundFlagsProcessor | 🚨/⚠️ (finansvarning) · 📋 (formationsrek) |

**BEHÅLL (innehåll, ej titel):** RISKY_SPONSOR "⚠️ Risk:"-subtitles · youthProcessor val-subtitles 📚/🏆/⚠️ · ⭐ scoutnote i P19-body. Per emoji-domslutet (DESIGN-DECISIONS): 🏒 förbjuden helt, övriga innehålls-emojis case-by-case.

## PRIO 6 — V2/V4 (klara att köra, ur DOM_SVEP)

**V2 sundayTraining trait-casting:** texterna pronomenfria (Opus, klart). Casting: `{earliest}` = högsta `(discipline + (loyaltyScore ?? 5)×10)/2` · `{phone}` = lägsta `discipline` (exkl. earliest) · `{cold}` = lägsta `morale` (exkl. ovan) · gruppen = tre forwards. OBS: `professionalism` finns INTE i Player — använd `discipline` (semantiskt rätt: "dyker upp och gör jobbet", ej workRate = "insats under match"). Diff till Opus före commit.

**V4 boardMeeting dynamic expectation:** `boardService.generatePreSeasonMessage` har redan expectationText-mappningen (AvoidBottom→"undvika botten av tabellen", MidTable→"hålla oss i mitten", ChallengeTop→"utmana om topplaceringar", WinLeague→"vinna ligan"). Exportera mappningen, bygg beatet: `"Målet i år: att ${expectationText[club.boardExpectation]}. Inget mer behöver sägas om saken."` Ingen ny copy.

## PRIO 7 — Lågprio städning

**freeAgent-gallring (KARTFYND 7):** transferState.freeAgents gallras aldrig → växer obegränsat över säsonger, fylls av 38-åringar. Lägg gallringsregel i seasonEndProcessor: bort efter 2 säsonger som fri agent ELLER vid ålder ≥37. År-3-relevant.

**Diagnostikloggning (KARTFYND 12):** `preRoundContextProcessor` loggar ALLTID i browser (`typeof window !== 'undefined'` → även prod!). `playoffProcessor` loggar i alla icke-prod-builds. Gate bakom en DEBUG-flagga eller ta bort. preRound-loggen är den som läcker till prod.

**Regenspelar-namn (KARTFYND, §8f):** matchSimProcessor's `createRegenPlayer` ger namnet "Regen Spelare" — exponeras som spelarnamn om en nödlineup (<11 tillgängliga) renderas. Ge ortsnamn ur PLAYER_FIRST_NAMES/PLAYER_LAST_NAMES istället. Lågprio (triggas sällan).

---

## EJ HÄR — väntar på annat

- **fanMood-omarbetning (KARTFYND 8):** stark våg 2-kandidat (fanMood är symmetrisk schablon bredvid pulsens konstverk — saknar mean reversion + diminishing returns). VÄNTAR på Jacobs genomspelningsdata innan Opus specar reverteringskurvan — gissa inte siffror som pulsen redan löst empiriskt.
- **Beslutsbudget över alla kanaler (KARTFYND 3):** interruptClassifier-instrumentet finns färdigt (byggt 05-21, "changes nothing until Design decides" — beslutet togs aldrig). Våg 2, kräver policybeslut + korsning mot genomspelningens "för mycket samtidigt"-loggar.
- **Styrelse-persongalleri (KARTFYND 4):** club.board vs boardPersonalities — dubbla persongenerering. Väntar på grep-paketets svar om vilka ytor läser vilken.

## KODKOMMENTAR-NOTERINGAR (så avsiktlig design inte "städas bort")
- Funktionärsdöd +3 cs = "orten samlas i sorgen" (redan kommenterad av Opus i seasonEndProcessor).
- Hall sänker hemmafördel 15 % (`0.19×0.85`, matchSimProcessor) = avsiktlig Själ-kostnad. Lägg kommentar.
- communityStanding mean reversion 3 %/omg mot 60 (roundProcessor, Sprint 26) = anti-runaway. Redan kommenterad.

— Opus, 2026-06-12
