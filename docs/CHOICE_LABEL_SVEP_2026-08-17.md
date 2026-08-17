# Choice-label-svepet (2.5) — full rapport

**Underlag för SLUTTEST_KO.md post 2.5.** Status står i SLUTTEST_KO.md, inte här. Ingen kod ändrad — det här är grepresultatet, per ordern.

**Metod:** tre parallella agenter läste hela `src/domain/services/events/` + `eventProcessor.ts` + `matchSimProcessor.ts` i sin helhet, extraherade varje `EventChoice` (inklusive `multiEffect`/`subEffects`), och jämförde `label`/`subtitle`-texten mot vad `eventResolver.ts` faktiskt gör för den effekten. Verdikt per val: MATCHES, PROMISES MORE (text lovar en konsekvens/risk/summa effekten inte ger), PROMISES LESS (effekten gör mer än texten säger, oftast en odeklarerad bieffekt), eller UNCLEAR.

**Omfattning:** ~40 avvikande val hittade över 9 filer. Två filer (`eventProcessor.ts`, `matchSimProcessor.ts`) är helt rena. `communityActivitiesEvents.ts` och `eventFactories.ts` bär tyngden.

---

## PRIO 1 — kompletta no-ops bakom lag-/ekonomilöften

Dessa val gör **bokstavligen ingenting** trots att texten beskriver en stor konsekvens. Samma klass som "Ge honom vila" och varselvalet, men värre — inte "fel effekt", utan **noll effekt**.

1. **`eventFactories.ts:296-301`** — `generateCaptainSpeechEvent` → `support`. "+8 moral hela laget" / "+5 moral hela laget". Effekten är `boostMorale` **utan `targetPlayerId`** — resolvern (`eventResolver.ts:220-231`) kräver det fältet eller hoppar över hela blocket. Ingen `teamBoostMorale`-variant används. Noll spelare påverkas. En storyline om att kaptenen "samlade laget" skrivs ändå till historiken — falsk journal.
2. **`eventFactories.ts:327-330`** — `generateVarselEvent` → `support`. Samma bugg, "+5 moral alla" levererar inget.
3. **`eventFactories.ts:341-345`** — `generateVarselEvent` → `nothing`. Det **redan kända** varselvalet ("risk att spelare lämnar") är värre än loggat: även den öppet deklarerade -8 moralen uteblir, av samma `targetPlayerId`-bugg.
4. **`eventFactories.ts:332-339`** — `generateVarselEvent` → `offer_pro`. "Erbjud heltidskontrakt åt alla (lönekostnad ×1.5)". `multiEffect`-subresolverns switch (`eventResolver.ts:636-740`) saknar en gren för `makeFullTimePro` — ingen av de ~13 stödda sub-typerna matchar. Total no-op. En storyline om att klubben "räddade spelare från uppsägning" skrivs ändå — falsk journal, samma som #1.
5. **`hallProcessService.ts:342-360`** — `kommunens_villkor`-beslutet. **Strukturell bugg, inte bara textmissmatch:** `choiceA` ("Acceptera ungdomstimmarna") och `choiceB` ("Föreslå delad drift istället") ger **byte-identiska effekter**. Ingen sannolikhetsskillnad ("högre ja-odds" i choiceB:s text) finns i koden — förhandlingen lyckas alltid. Spelaren ombeds göra en avvägning som inte existerar.

## PRIO 2 — dolda permanenta/strukturella konsekvenser (PROMISES LESS)

6. **`postAdvanceEvents.ts:525-533`** — `spoksponsor` → `accept`. Subtitle: "💰 +150 tkr · ⭐ -5 communityStanding". Effekten lägger dessutom **permanent till en ny styrelseledamot** (`eventResolver.ts:1138-1157`, hårdkodad specialgren på `event.type === 'spoksponsor'`) — en varaktig, röstande styrelseförändring som inte nämns i valets egen text (bara antytt i brödtexten).
7. **`sponsorEvents.ts:24-30`** — `icamaxi_visit` → `send_player`. Utöver de deklarerade +5tkr/+2 communityStanding lottar en hårdkodad specialgren (`eventResolver.ts:1159-1172`) en slumpad spelares moral ±5/-3 — helt odeklarerat, spelaren vet inte vilken spelare eller åt vilket håll.
8. **`eventFactories.ts:98-103`** — `bidReceivedEvent` → `reject`. "Spelaren stannar" är hela texten. Verklig effekt: en moralstraff på **-2 till -13** beroende på disciplin/marknadsvärde/kontraktslängd (`transferRejectMoraleWeight`) — helt odeklarerat spann.

## PRIO 3 — falska/felriktade löften om pengar eller risk

9. **`politicianEvents.ts:81-85`** — `politician_savings` → `comply`. Subtitle lovar "kommunbidrag +5 tkr" — effekten är bara `politicianRelationship +10`, ingen `kommunBidragChange` alls. Systerfallet `pushback` två rader ner har redan fixats med en kommentar ("synkad mot subtitlen") — `comply` missades i samma pass.
10. **`patronEvents.ts:223-228`** — `patron_ignored` → `apologize`. Lovar "+15 relation", effekten (`patronInfluence amount:0, value:20`) rör `patience`, inte `happiness` ("relation" i UI-språket) — fel stat helt och hållet.
11. **`postAdvanceEvents.ts:581-588`** — `detOmojligaValet` → `keep`. "Riskera licensproblem" — ingen licens-/Licensnämnden-mekanik finns kopplad till detta valet någonstans i resolvern. Samma klass som varselvalet.
12. **`communityActivitiesEvents.ts:333-337`** — `community_anlaggning` → `renovate`. Label säger "−25 000 kr", effekten är bara `reputation +5` — **inga pengar dras**, och "+15 faciliteter" är också påhittat.
13. **`communityActivitiesEvents.ts:193-197`** — `community_bandyplay` → `start`. **Tecken-omvänt:** texten säger "−5 tkr" (kostnad), koden ger en **positiv** engångsintäkt på +6000 kr — och sätter sedan igång en **löpande nettoförlust** (driftskostnad överstiger intäkten) som aldrig nämns. Värsta enskilda fyndet i svepet.
14. **`communityActivitiesEvents.ts:221-225`** — `community_ismaskin` → `repair`. Samma mönster: "−15 000 kr" i texten, `tempFacilities`-effekten rör aldrig ekonomin.
15. **`communityActivitiesEvents.ts:25-28, 53-56`** — kiosk start/uppgradering. "Intäkter per hemmamatch" / "dubblade kioskintäkter" är bruttosiffror; driftskostnaden (`economyService.ts`) äter upp eller överstiger dem vid normal fanMood — nettot är negativt eller ~0, aldrig nämnt.

## Övrigt av vikt

- **Textbugg, inte effektmissmatch:** `supporterEvents.ts:79` — `subtitle: '${elin} besviken'` är en **enkelfnuten sträng**, inte en template literal. Spelaren ser den bokstavliga texten `${elin} besviken`, inte namnet.
- **Två döda filer, kandidater för radering (superseterad, inte text-utan-yta):** `hallDebateEvents.ts` och `hallDebateService.ts` — `generateHallDebateEvents`/`generateHallDebateEvent` anropas ingenstans, `communityEvents.ts` har redan en kommentar som säger "hallDebateService ersatt av hallProcessService". Om någon av dem återkopplas utan att också ta bort `eventResolver.ts:1216-1257` (en kvarliggande `if (eventId.startsWith('hall_'))`-specialgren) dubbelfyrar två oberoende effektmekanismer på samma val.
- **Adjacent till 2.5, en nivå nedströms valet:** `riskySponsorOffer`s exponeringshändelse (`roundProcessor.ts:985-1016`) lovar i sin inbox-text att sponsorn försvinner + pengar återkrävs, men koden har bara en kvarliggande kommentar (`// handled in SaveGame assembly below`) — ingen sådan kod finns. Inte ett `EventChoice.label`-fynd, men samma bugklass, en nivå ner.
- Fullständig fil-för-fil-lista (alla ~40 fynd, inkl. lägre allvarlighetsgrad) finns i agenttranskripten om du vill ha den — säg till så skriver jag in den här också.

---

**Körorder:** rapport, inget byggt. Väntar på Jacobs per-fall-beslut: vilka löften wiras (bygg den saknade mekaniken), vilka skrivs om (sänk texten till vad effekten faktiskt gör).
