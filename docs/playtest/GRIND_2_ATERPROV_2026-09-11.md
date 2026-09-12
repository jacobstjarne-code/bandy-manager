# Grind 2 — hypotespass och kort återprov

**Dom:** `docs/dom/DOM_GRIND_2_3_2026-09-10.md`
**Save:** `docs/playtest/karriar_vastanfors_10sasonger.json`  
**Kodbas:** `main`, provet ska visa footer-hash för aktuell commit före första räknade spelsteget.

## 1. Kodhypoteser före spel

### Burnout — dubbla slutval samma säsong

- Producenten finns på ett ställe: `processGameEvents` → `generateBurnoutCeilingEvent`.
- Producenten granskar både `pendingEvents` och `deferredDecisions` efter ett redan köat takval.
- Ett redan gjort val samma säsong grindas mot kanonisk `eventLedger`-post (`burnoutCeiling:*`); managerdagbokens `burnout_scar` är uttryckligen legacy-fallback.
- När score lämnar 100 kan episodflaggan nollställas och en ny episod uppstå. Säsongskvittot ligger däremot kvar och blockerar ett nytt takval samma säsong.
- Resolvern har ett andra försvar: en legacy-kopia som redan ligger i någon kö konsumeras utan effekt, nytt ärr eller ny liggarpost.

**Hypotes i provet:** hög belastning kan ge flera episoder, men högst ett faktiskt `burnoutCeiling`-slutval per säsong. Olika säsonger får egna val.

### Kafferummet — exakt slutspelsrad återkommer

- Slutspelsseger och slutspelsderby har varsin stabil `coffeeSemanticKey`.
- Tvåsäsongers-cooldown läses ur `narrativeBeatLog`, alltså rätt lager för visningstiming.
- Kvittot skrivs först i `completeScene('coffee_room')`, när raden faktiskt visats; producenten skriver inte ett falskt visningskvitto.
- Ingen andra producent av de två fasta nycklarna hittades.

**Hypotes i provet:** en visad fast slutspelsrad får inte visas samma eller följande säsong. Annat kafferumsmaterial ska fortfarande kunna visas.

### Bandygalan — återkomst efter resolution

- `generateGalaEvent` har en producent, i `handleSeasonEnd`, och stabilt id `event_gala_{season}`.
- Vanlig resolution pensionerar samma id atomärt ur både `pendingEvents` och `deferredDecisions`.
- `applyDecisionBudget` rensar legacy-kopior mot både den korta `resolvedEventIds`-cachen och `resolvedChoices`-kvittot.
- Granska-kort som flyttats till deferred efter att skärmen frystes kan fortfarande lösas därifrån.

**Hypotes i provet:** när galan har besvarats får samma säsongs id aldrig återkomma, även om andra beslut promoveras runt den.

### Beslutskön — dubblett, svält och fastnad promotion

- Alla omgångsproducenter möts i `maintainEventQueues` före persistens. Där kombineras active + deferred, redan lösta id:n och dubbletter filtreras, deadline skyddas och äldre deadline-lösa beslut får svältprioritet efter tre rundor.
- Vanliga event, veckobeslut och marknadsbeslut promoverar direkt efter resolution.
- **Fynd före provet:** `commitSponsorCounter` saknade direkt promotion i utfallen `accepted` och `walked_away`. Det är rotfixat i `5d78cc14`; tre store-regressioner täcker båda terminala utfall samt att `stood_firm` inte rör kön.

**Hypotes i provet:** kön får växa under faktisk belastning, men ett besvarat kort ska frigöra plats direkt; inget löst id får ligga kvar eller återpromoveras och ett fruset Granska-kort ska fortfarande gå att lösa.

## 2. Förgrind

- Riktad Grind 2-svit efter sidofyndets fix: **66/66 gröna** över burnout, kafferum, gala, pending/deferred-kö, beslutsbudget och sponsor-promotion.
- Full `npm run build`: **GRÖN** — TypeScript, Vite och samtliga fem projektgrindar.
- Första browserförsöket ogiltigförklarades före räknat prov: footern visade den gamla serverhashen `7f8a493a`. Två gamla Vite-processer stoppades och en enda server startades om från aktuell `main`; footern visade därefter `5d78cc14`.

## 3. Naturligt återprov

Två hela säsonger spelades på aktuell `main`: **2037/38 och 2038/39**. Serverns footer visade `5d78cc14` före första räknade steget.

- **Burnout:** lättnadsbeat uppstod flera gånger vid skilda zon-/cooldownlägen. Inget dubbelt eller oförenligt `burnoutCeiling`-slutval uppstod. Årsboken summerade de två faktiska lättnadstillfällena utan att fabricera ett terminalt val.
- **Kafferummet:** återkom som den avsiktligt återkommande generella scenen, men de visade texterna varierade. Ingen exakt fast slutspels-/segeridentitet återkom. Den fasta slutspelsraden uppstod inte naturligt eftersom klubben missade ligaslutspelet båda säsongerna; dess tvåsäsongerskontrakt är fortsatt täckt av regressionstesten.
- **Bandygalan:** uppstod en gång per säsong, löstes och återkom inte under samma säsong.
- **Beslutskön:** active/deferred växte under verklig belastning och dränerades igen. Frusna Granska-kort gick att lösa, sponsorutfall promoverade nästa beslut och inga redan lösta kort återkom.

Återprovet hittade två centrala glapp som enhetstesterna före provet inte hade fångat:

1. `commitSponsorCounter` promoverade inte kön efter de terminala utfallen `accepted` och `walked_away`. Rotfixad i `5d78cc14` och täckt av tre store-regressioner.
2. En direkt obligatorisk skärmkedja `qf_summary` → `season_summary` kunde stanna på dashboarden eftersom omdirigeringsvakten bara bar en boolesk flagga. Vakten bär nu senast omdirigerad skärmid; samma skärm loopar inte, men en ny skärm i kedjan öppnas. Sju riktade tester och full build är gröna. Den fastnade sparningen återprovades i browser: navigering till dashboard öppnade årsboken automatiskt.

## 4. Utfall

**Grind 2 passerar.** Ekonomivalet år 8 och det färdiga anläggningsträdet var redan bevisade i tioårskörningen. Det avgränsade återprovet på aktuell kod tränade de fyra rörliga målvägarna, hittade och rotfixade två verkliga centrala övergångsglapp och gav därefter två rena säsonger utan upprepad pivotal scen eller fastnad kö.
