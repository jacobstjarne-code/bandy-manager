# RAPPORT — ommätning väg B + anspråk 4, tre fynd, alla behandlade

**Datum:** 2026-08-30 · **Status:** HISTORISK — alla tre beslut fattade samma dag, ingen öppen fråga kvar i denna rapport.

Bakgrund: Jacobs prioriterade order 2026-08-30 krävde två saker innan något annat räknas pålitligt — (1) socialMedia-ryktesinflationen frikopplad från resultat, (2) mätharnessen som aldrig besvarade `pendingEvents` (patronen aktiv 0/20 säsonger trots CS 92). Båda fixade (`3914a5e6`, `06b86b29`), sedan ommättes väg B (D033/D036) och anspråk 4 (D037) mot rätt rykte + aktiv patron.

Full mätredovisning: `docs/DOM_AH2_BASEKONOMI_INTAKT_2026-08-28.md` (tillägg 2026-08-30) och `docs/DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md` (tillägg 2026-08-30). D-facts: D033, D037 (value-block orörda, notes uppdaterade).

## Huvudfyndet: 765fdcb7, inte de två nyss fixade buggarna

Bisection mot låsta originalskript över hela commit-kedjan visar att D033/D036:s tal slutade reproducera på HEAD — men rörelsen ligger inte i ryktefixen eller pendingEvents-fixen. Noll kronors rörelse i 12 av 13 commits; all rörelse sker vid `765fdcb7` (A-H3:s konditionsspiral-fix, "autofyll tystnar aldrig under golvet"). Bättre truppurval → bättre resultat → den resultatresponsiva intäkten (D033:s egna två knappar) svarar. Konsekvens: D036:s ursprungliga "3/11 game over"-motivering för `WEEKLY_BASE_FLAT=8000` reproducerar inte längre (0/11 game-overs även med flat=3000 kontrafaktiskt återställt) — spiralen fixen skrevs mot var redan löst av 765fdcb7 ensam.

## Fynd 1 — WEEKLY_BASE_FLAT=8000: motiveringen är död, värdet lämnas stå

**Beslut (Jacob, 2026-08-30):** lämna värdet, punktfixa inte. Att omkalibrera 8000 isolerat nu vore det sjätte punktfixet på en ekonomi som just avslöjat två nya rörliga golv (rykte, patron) och en felattribuering (spiral = A3, inte bas). Mönstret är problemet, inte konstanten.

**Åtgärd:** D033 dokumenterar att game-over-argumentet är ersatt av 765fdcb7 (gjort). Hela basen omhärleds i ETT konsoliderat pass tillsammans med anspråk-4-kostnaden — se "Vad som är upplåst" nedan.

## Fynd 2 — patron-hypotesen: Jacob hade fel, erkänt rakt av

Ordern 2026-08-29 antog som fastslaget: "patronen vidgar kriterium-1-gapet, inte stänger det." Mätningen (patron nu faktiskt nåbar) visar gapet smalnar marginellt istället: 298 805 → 291 252 kr/säsong. Patronens kassabidrag är två storleksordningar för litet för att straffa coasting-sidan asymmetriskt.

**Jacobs egen rättning:** "Mitt resonemang (släpp CS → förlora patron → hålla blir mer dominant) var riktningsmässigt rimligt men magnitudmässigt fel, och jag skulle inte ha låst det som faktum utan siffran. Patronen är en villospår för kriterium 1." Det som står kvar är det som betyder något: **kriterium 1 är fortfarande obesvarat, mittenlag +212 tkr/säsong på passivitet** — strukturellt, ingen mätning ändrar det.

## Fynd 3 — transferBidReceived-soft-locken i mätharnessen: hittad OCH fixad

Ny bugg, hittad under ommätningen, i redan levererad kod (`06b86b29`). `autoResolvePendingEvents`s fallback-policy (choices[0] när inget `noOp`-val finns) körde `transferBidReceived`-events fel — eventet saknar `noOp` helt (accept/counter/reject), och `accept` är choices[0], så fallbacken accepterade tyst VARJE inkommande bud. Konsekvens: truppen dräneras under 11 spelare, `autoSelectLineup` kan inte bygga en laguppställning, säsongen fastnar för alltid (verifierat: DOMINANT seed=100 säsong 5, trupp 12→10, matchday låst på 23).

**Beslut (Jacob):** fixa nu, samma klass som allt annat jagat denna vecka — tyst fallback som accepterar, följt av tyst bail. Bägge halvor krävdes: avslå-policy på `transferBidReceived` OCH `autoSelectLineup` ska rapportera, inte tyst baila.

**Status: KLART.** Commit `0901b89e`. `pickEventResolutionPolicy` resolverar nu `transferBidReceived` explicit mot `rejectTransfer` (hold-position). `autoSelectLineup` skriver `console.error` med klubb/matchday/säsong när truppen är för liten, istället för att tyst returnera oförändrat game. Verifierat empiriskt: `remat-ah2-basekonomi-2026-08-30.ts --events` kör nu DOMINANT seed=100 hela vägen genom 5 säsonger utan deadlock. Påverkar inte D033/D037:s redovisade tal (deras officiella mätning körde `--patron`-läget, aldrig `--events`). tsc/vitest (3303/3303)/build gröna. D033 daterad not 2026-08-30 dokumenterar fyndet.

## Vad som är upplåst

Beslutet är fångat i `docs/DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md` — tredje spaken: aktivitet är färskvara, blir "stale" ju längre den körts, ett topplags supportrar tröttnar snabbare. Det som kostar är förnyelsen (ett synligt dashboard-beslut: "supportrarna tröttnar på X — förnya för Y?"), aldrig en tyst avdragspost. Nu svider bägge sidor av anspråk 4:s kriterium 1: betala för nyhet, eller låt orten tröttna och tappa publik + mecenat.

Detta låser upp ekonomitråden. Byggs som ETT konsoliderat pass, inte fler punktfixar: nyhetstretmillen + omhärledningen av `WEEKLY_BASE_FLAT` + mittenlag-break-even, allt mätt mot de fixade ingångarna (rätt rykte, aktiv patron) → mät kriterium 1–4 → D-fact → commit. Tas när Code når den ordningsmässigt (efter HIGH 10/HIGH 11 + svansen, per kön i `docs/TRIAGE_AUDIT_2026-08-29.md`).

## Körorder-status vid rapporttillfället

Klart: rykteinflation (`3914a5e6`), mätharness-pendingEvents (`06b86b29`), ommätning väg B + anspråk 4 (`0c438cd4`), transferBidReceived-soft-lock (`0901b89e`), boardTruth-textverifiering. Pågående: HIGH 10 (burnout som båge). Väntar i kö: HIGH 11 (dashboard tre nivåer), HIGH 6/5/8/7/10/polish-svansen, den konsoliderade ekonomiomhärledningen (nyhetstretmill + flat + kriterium 1).
