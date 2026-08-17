# Choice-label-svepet (2.5) — full rapport

**Underlag för SLUTTEST_KO.md post 2.5.** Status står i SLUTTEST_KO.md, inte här.

**Metod:** tre parallella agenter läste hela `src/domain/services/events/` + `eventProcessor.ts` + `matchSimProcessor.ts` i sin helhet, extraherade varje `EventChoice` (inklusive `multiEffect`/`subEffects`), och jämförde `label`/`subtitle`-texten mot vad `eventResolver.ts` faktiskt gör för den effekten. Verdikt per val: MATCHES, PROMISES MORE (text lovar en konsekvens/risk/summa effekten inte ger), PROMISES LESS (effekten gör mer än texten säger, oftast en odeklarerad bieffekt), eller UNCLEAR.

**Omfattning:** ~40 avvikande val hittade av agenterna över 9 filer. Denna rapport itemiserar de ~18 allvarligaste (de som fick egen rad nedan) — inte samtliga ~40. Se **"Vad som INTE är i den här rapporten"** längst ner innan du utgår från att listan är fullständig.

---

## LÖST (byggt denna session, med commit)

De fem posterna Jacob dömde per-fall är alla byggda, testade (regressionstest verifierat att faila mot koden innan fixen, per stash-disciplinen) och committade:

1. **captainSpeech → support** — `boostMorale` utan `targetPlayerId` → nu `teamBoostMorale` med `targetClubId`. Falsk storyline (skrevs oavsett val) → gated på `choiceId === 'support'`. Commit `fdcf55cb`.
2. **varsel → support/nothing** — samma `boostMorale`-utan-`targetPlayerId`-bugg → `multiEffect` med en `boostMorale`-subeffekt per berörd spelare. Commit `fdcf55cb`.
3. **varsel → offer_pro** — `multiEffect`-subresolvern saknade helt en `makeFullTimePro`-gren → tillagd. Commit `fdcf55cb`. Storylinen ("räddade spelare från uppsägning") skrevs tidigare oavsett utfall → gated nu på att minst en spelare faktiskt blev heltidsproffs. Commit `441c4474`.
4. **Vakt i eventResolver** — `boostMorale`, `makeFullTimePro`, `teamBoostMorale` (toppnivå) samt båda `multiEffect`-subtyperna kastar nu vid saknat obligatoriskt fält istället för att tyst hoppa över blocket. `try/catch` runt `multiEffect` begränsad till `JSON.parse` så vaktens `throw` inte fångas av misstag. Commit `fdcf55cb`.
5. **community_bandyplay → start** — omkastat tecken, `amount: 6000` (vinst) trots att texten lovar "−5 tkr" (kostnad) → `amount: -5000`. Commit `ece6220c`.

Dessutom, hittat under samma genomläsning och åtgärdat samma session:

6. **`${elin}`-buggen** (`supporterEvents.ts:79`) — enkelfnutad sträng med rått `${elin}` istället för mall-literal. Fixad. Commit `694991d2`. Grep efter fler enkelfnutade `${...}`-strängar i hela `src/` gav noll ytterligare träffar — detta var den enda instansen.
7. **`hallDebateEvents.ts` + `hallDebateService.ts`** — död kod (superseterad av `hallProcessService.ts`), raderade. Commit `d0d4d923`. Tredje filen `hallDebateData.ts` raderades också (blev orphan efter de två andra — se commit för rotorsak).

**Kvarliggande, ej rört:** `eventResolver.ts` har kvar en `if (eventId.startsWith('hall_'))`-specialgren (kommentarsblock, hall-textet). `hallProcessService.ts`s events använder alla prefixet `hallprocess_`, aldrig `hall_` — grenen var redan ouppnåelig innan hallDebate-raderingen, och är det garanterat nu (ingen kod producerar längre ett `hall_`-prefixat event-id). Ofarlig död kod, men värd en rad om du vill ha den bortstädad i ett senare pass — rörde den inte här för att hålla raderings-committen till de tre uttryckligen döda filerna.

---

## Flaggat separat (per instruktion — inte ja/nej-bedömt, bara rapporterat)

### Löpande minus presenterat som intäkt

**bandyplay** (redan tecken-rättad för engångsvalet ovan, men den återkommande driften är en SEPARAT, redan korrekt tecknad men odokumenterad kostnad): per hemmamatch `250 + rand()*250` (snitt 375) minus `runningCost += 1000` → **snitt −625 kr/hemmamatch**. Per omgång, alltid (`communityRoundIncome`): `250 + rand()*500 − 1000` → **snitt −500 kr/omgång**. Blandat över en ~22-omgångars säsong (11 hemma/11 borta): **≈ −812,5 kr/omgång i snitt, ≈ −17 875 kr/säsong**. Detta är EN kostnad, inte samma post som engångsbuggen — bandyplay bär alltså två separata, nu båda korrekt tecknade, negativa poster.

**Nytt fynd, samma familj: kiosk.** `basic`-kiosken (`economyService.ts:219-235`) ger break-even vid `fanMood ≈ 83` — under det är driften en nettoförlust, över det en vinst. `upgraded`-kiosken har break-even vid `fanMood ≈ 50`. Ingen av dessa siffror är ren gissning från min sida — de följer direkt ur formeln `kioskBase × (0.7 + fanMood/100 × 0.6) − runningCost` löst för nollpunkten. Ingen av de två break-even-punkterna nämns i UI-texten (`communityActivitiesEvents.ts:25-28, 53-56` — "intäkter per hemmamatch" / "dubblade kioskintäkter"), som bara visar bruttosiffror. Skiljer sig från bandyplay genom att vara mood-beroende snarare än strukturellt alltid negativ.

### kommunens_villkor — rapport, inget byggt

Bekräftat i kod (`hallProcessService.ts:342-360`): `choiceA` ("Acceptera ungdomstimmarna", hint "Ungdom ↑ · drift −/säsong") och `choiceB` ("Föreslå delad drift istället", hint "Lägre uppsida · högre ja-odds") skriver **byte-identiskt** `{ finansiering: 'kommun', stage: 'bygge', stageStartedRound }`. Värre än ett tomt val mellan A och B: `trial.finansiering` **läses ingenstans i kodbasen** (grep bekräftar — bara skrivpunkten i `eventResolver.ts:827` existerar). Så även om valen hade skrivit olika värden hade det inte spelat någon roll för något nedströms system.

Jacob bad om en rapport av **vad kommun respektive klubb rimligen skulle bära** enligt befintlig hallprövningsdata. Jag kan inte leverera den siffran — den finns inte i datan att rapportera. `hallProvningData.ts` och `TEXTPOOLER_PROVNING_2026-06-12.md` innehåller bara de två hint-texterna ("Ungdom ↑ · drift −/säsong" respektive "Lägre uppsida · högre ja-odds") — ingen kronbelopps- eller procentsplit finns specad någonstans i källorna. Att hitta på en siffra här hade brutit hallucinationsdisciplinen. Det som DÄREMOT går att säga strukturellt:

- `choiceB`s hint ("högre ja-odds") antyder en förhandlings-sannolikhetsmekanik — men förhandlingen har ingen sannolikhet i koden: båda valen går ovillkorat vidare till `stage: 'bygge'`. Om `choiceB` ska betyda något skilt från `choiceA` krävs antingen (i) en verklig kostnads-/reputation-split kodad in i `finansiering`-fältet OCH ett ställe som faktiskt läser det, eller (ii) en verklig sannolikhetsrisk på `choiceA` (den högre-uppsidan) som `choiceB` saknar — i linje med vad hint-texterna redan antyder men koden aldrig byggde.
- Din dom att avgöra: slå ihop till ETT val (ta bort den falska valmöjligheten), eller bygg en verklig skillnad. Jag bygger ingenting här förrän du bestämt vilket.

---

## Återstående klassificerbara fynd — tre klasser

De nio konkreta fynden nedan (utöver de fem redan lösta) är redan itemiserade i tidigare version av denna rapport. Klassade nu enligt (a) omkastat tecken / (b) påhittad effekt / (c) fel storlek. Tre av dem passar INTE taxonomin rent — flaggade separat istället för tvingade in i en klass.

### (b) Påhittad effekt — text lovar en konsekvens som saknar motsvarighet i state

- **`politicianEvents.ts:81-85`** — `politician_savings` → `comply`. Subtitle lovar "kommunbidrag +5 tkr" — effekten är bara `politicianRelationship +10`, ingen `kommunBidragChange` alls. Systerfallet `pushback` två rader ner är redan fixat med kommentaren "synkad mot subtitlen" — `comply` missades i samma pass.
- **`patronEvents.ts:223-228`** — `patron_ignored` → `apologize`. Lovar "+15 relation" (happiness i UI-språket), effekten (`patronInfluence amount:0, value:20`) rör `patience` — fältet spelaren tror ska röra sig rör sig aldrig.
- **`postAdvanceEvents.ts:581-588`** — `detOmojligaValet` → `keep`. "Riskera licensproblem" — ingen licens-/Licensnämnden-mekanik finns kopplad till valet någonstans i resolvern.
- **`communityActivitiesEvents.ts:333-337`** — `community_anlaggning` → `renovate`. Label säger "−25 000 kr" + "+15 faciliteter", effekten är bara `reputation +5` — inga pengar dras, ingen facilitetseffekt finns.
- **`communityActivitiesEvents.ts:221-225`** — `community_ismaskin` → `repair`. Samma mönster: "−15 000 kr" i texten, `tempFacilities`-effekten rör aldrig ekonomin.
- **`roundProcessor.ts:985-1016`** (adjacent, en nivå nedströms valet) — `riskySponsorOffer`s exponeringshändelse lovar i sin inbox-text att sponsorn försvinner + pengar återkrävs. Koden har bara en kommentar (`// handled in SaveGame assembly below`) — ingen sådan kod finns.

### Sticker ut — passar inte (a)/(b)/(c), egen bedömning krävs

Dessa är inte "text lovar X, kod gör Y" i en enkel riktning — de är **odeklarerade EXTRA-effekter**: koden gör MER än texten säger, inte mindre eller fel tecken. Motsatt riktning mot resten av svepet, så jag har inte tvingat in dem i (a)/(b)/(c).

- **`postAdvanceEvents.ts:525-533`** — `spoksponsor` → `accept`. Subtitle: "💰 +150 tkr · ⭐ -5 communityStanding". Effekten lägger dessutom **permanent till en ny styrelseledamot** (`eventResolver.ts`, hårdkodad specialgren på `event.type === 'spoksponsor'`) — en varaktig, röstande styrelseförändring som bara antyds i brödtexten, aldrig i valets egen subtitle.
- **`sponsorEvents.ts:24-30`** — `icamaxi_visit` → `send_player`. Utöver de deklarerade +5tkr/+2 communityStanding lottar en hårdkodad specialgren en slumpad spelares moral ±5/-3 — spelaren vet inte vilken spelare eller åt vilket håll innan valet görs.
- **`eventFactories.ts:98-103`** — `bidReceivedEvent` → `reject`. "Spelaren stannar" är hela texten. Verklig effekt: en moralstraff på **-2 till -13** beroende på disciplin/marknadsvärde/kontraktslängd (`transferRejectMoraleWeight`) — helt odeklarerat spann, aldrig antytt i UI.

**Din dom, en gång för alla tre:** ska subtitle-texten utökas för att nämna bieffekten (styrelseplats, spelarlott, moralspann), eller är den avsiktligt dold information (spelaren SKA inte veta i förväg)? Om det senare — inget att fixa, bara att notera som medvetet designval i DECISIONS.md så nästa audit inte flaggar det igen.

### (a)/(c) — inga fler fynd i denna klassificerbara delmängd

Inget kvarstående klassificerbart fynd i (a) omkastat tecken eller (c) fel storlek utöver det redan lösta (bandyplay, klass a). Möjligt att sådana finns bland de ~22 lägre-allvarlighetsgrad-fynden som aldrig itemiserades — se nästa avsnitt.

---

## Vad som INTE är i den här rapporten

De tre ursprungliga agenterna hittade **~40** avvikande val. Den här rapporten (både förra och denna version) itemiserar bara de **~18 allvarligaste** — resten nämndes bara som "finns i agenttranskripten om du vill ha den" i förra versionen, och har aldrig faktiskt skrivits ut. Jag kan inte klassificera de återstående ~20 in i (a)/(b)/(c) just nu — jag har inte den listan i det här passets kontext, och att uppskatta klasser för fynd jag inte kan citera exakt vore att gissa, inte rapportera.

**Om du vill ha de fullständiga ~40 klassificerade:** det kräver ett nytt sweep-pass (samma tre-agent-metod som första gången) eftersom originalagenternas fulla output inte finns kvar i denna sessions kontext efter komprimeringen. Säg till så kör jag det som ett eget uppdrag — annars står detta dokument som det är: de allvarligaste fynden lösta eller klassade, resten oklassat och outrett.
