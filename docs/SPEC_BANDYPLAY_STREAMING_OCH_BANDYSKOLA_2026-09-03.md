# SPEC — BANDYPLAY (STREAMING) OCH BANDYSKOLANS TVÅ NIVÅER

**Datum:** 2026-09-03 · **Av:** Opus · **Grund:** kod-läst pre-spec-cross-check (economyService.ts, EkonomiTab.tsx, OrtenTab.tsx, Community.ts, journalistVisibilityService.ts, facilityNodes.ts) + `BANDY_KANON.md` §7 + Jacobs riktning 2026-09-03 ("bandyskolan ska finnas kvar; bandyplay är relevant spegling av verkligheten") + bandykul.se (verklig modell för bandyskolan, Uppsala).

**Status:** BYGGD 2026-09-03 (Codex, val C, inklusive §4b), 4 151 tester gröna, balansmätning körd (`bandyplay-streaming-matning-2026-09-03.ts`, `bandykul-matning-2026-09-03.ts`). Verifierad mot disk av Opus samma dag: rename, migrering (inkl. omskrivning av köade `community_bandyplay`-eventeffekter), streaming-C, §6-strängarna ordagrant. Mätvärden och §4b-leverans i MASTER `sluttest-bandyplay-nettoforlust`, `BANDY_KANON.md` §7 och Codex dagsrapport 2026-09-03 §4. §4b dömdes i Codex-passet — texten nedan står kvar som rekommendation för spårbarhet. Ingen öppen åtgärd.

## 1. Problemet, grundat i koden

Tre begrepp ligger hopblandade i `communityActivities`:

- Fältet `bandyplay: boolean` (Community.ts) är UI-etiketterat "Bandyskola för barn" ⛸️ i BÅDE EkonomiTab (actionKey `bandyplay`, "Starta — gratis") och OrtenTab. Det är mekaniskt wirat som en bandyskola: `communityMatchIncome` (+250+slump, −1000/hemmamatch) och `communityRoundIncome` (+250+slump, −1000/omgång) — kodens egen kommentar i economyService säger "per-round bandyskola-drift". Ingen streaming.
- Fältet `bandySchool?: boolean` är "Bandyskola avancerad" 🏫 (OrtenTab) / "Bandyskola" (EkonomiTab, "Starta — 5 tkr"), ger platt +1000/omgång.
- Politiker-agendan (OrtenTab, youth) räknar BÅDA för ungdom: `bandyplay` = "Bandyskola (gratis)", `bandySchool` = "Bandyskola avancerad".

Så de två är i praktiken redan **två nivåer av bandyskola** — en gratis barn-nivå och en avancerad. Problemet är inte att de är dubblett, utan att barn-nivån bär namnet `bandyplay`, som i verkligheten betyder något helt annat (Elitseriens streaming, StayLive). Ordet är upptaget av fel sak, och det riktiga bandyplay finns inte i spelet.

Båda fälten är CS-bärande (`StaleableActivityKey` listar både `bandyplay` och `bandySchool`) och persisteras i saven, med färskhet i `communityActivitiesSince`. En omdöpning är därför en save-schema-ändring med migrering, inte en ren etikettbyte.

## 2. Hård begränsning — tv-avtals-domen

Streaming får INTE bli en påhittad intäktsrad. Jacobs dom 2026-08-27 (facilityNodes.ts, matchhall-noden) strök matchhallens "+tv-avtal" med orden att ett tv-avtal i en fiktiv bandyliga är ett nytt system, inte en nodeffekt — rent påhitt, noll kod. Samma dom strök strålkastarens "+10% sponsorintäkt" som fabricerat löfte. En streamingintäkt som bara dyker upp som +kr faller i exakt den klassen.

Vägen förbi domen: streaming i verkligheten är inte ett klubb-tv-avtal utan LIGANS plattform (bandyplay.se/StayLive) som sänder alla Elitseriematcher. Klubbens spak är inte att sälja rättigheter utan **exponering och räckvidd**. Det finns redan en exponerings-mekanik att haka i: journalistVisibilityService (`getJournalistAttendanceModifier`, `getJournalistCommunityModifier`) låter medieexponering driva publik och communityStanding. Streaming hör hemma där — som en grundad exponeringseffekt, inte en kassako.

## 2b. Verkligheten — så funkar bandyskolan (BandyKul, Uppsala)

Jacob 2026-09-03, bandykul.se som exempel. BandyKul är Uppsala-klubbarnas GEMENSAMMA skridsko-/bandyskola för barn (ca 5–9 år), driven ihop av Sirius, UNIK och Uppsala BoIS. Fokus är lek och inkludering, inte prestation. Fyra drag som gör den till mer än en förlustpost:

- **Bandybussarna är själva grejen.** Barn hämtas på ~27 skolor med fullstora bussar, varje vecka en hel säsong. Bussarna är den stora kostnaden — och den ikoniska bilden.
- **Sponsor-/partnerfinansierad.** Det är partners (t.ex. Länsförsäkringar) som bär bussarna. Att stötta BandyKul marknadsförs uttryckligen som att stötta integration och jämställdhet — en CSR-koppling, inte en biljettintäkt.
- **Samhällsinsats, inte intäkt.** Sedan starten 1992 är poängen integration och jämställdhet — den sortens lokal förankring communityStanding faktiskt mäter.
- **Föder pipelinen.** "Därifrån kommer framtida spelare"; nya lag varje år. Barn-skolan är basen som på sikt matar akademin.

Och streaming-splitten bekräftas separat: Uppsala BoIS listar "BoIS på Bandyplay" i klubbmenyn — bandyplay.se är sändningsplattformen, en helt annan sak än BandyKul. Splitten i §3 (bandyplay = streaming, bandyskola = BandyKul-modell) håller.

**Vad det ger designen:** barn-skolan ska inte vara en generisk förlustrad utan en integrations-/CSR-insats med buss-logistik — sponsorfinansierbar, CS-drivande, ungdomsmatande. Abstraktion mot spelet: 12 separata klubbar kan inte dela en gemensam ort-insats som i verkligheten, så varje klubb driver sin egen bandyskola; den delade ort-känslan blir flavour (bussarna, "hela bygdens barn"), inte delad state.

## 3. Måldesign — tre åtskilda saker

1. **Bandyskola barn (BandyKul-modell).** Konceptet behålls och får substans ur §2b. Fältet döps om från `bandyplay` till t.ex. `bandySchoolBasic` (exakt namn Codes val); CS-boost, staleness-nyckel och agenda-koppling följer med. Grundad karaktär: en integrations-/ungdomsinsats med buss-logistik som kostar men driver communityStanding och matar ungdomspipen — se de grundade valen i §4b.
2. **Bandyskola avancerad (`bandySchool`).** Orörd — den elitnära nivån ovanpå barn-basen.
3. **`bandyplay` = streaming.** Nytt, separat fält och ny mekanik, grundad i exponering enligt §2. Ingen påhittad intäktsrad.

Nettot: två bandyskole-nivåer kvar (barn + avancerad), plus en ny streaming-aktivitet. Ordet `bandyplay` betyder äntligen det det gör i verkligheten.

## 4. BESLUT SOM KRÄVER JACOBS DOM — streaming-mekanikens form

Tre grundade alternativ. Alla respekterar tv-avtals-domen; de skiljer sig i vad spelaren gör och vad hen får. Välj ett (eller kombinera A som bas + en av B/C).

**A. Exponering, ingen kassa (renast mot domen).** Streaming är en aktivitet spelaren kan satsa på (lokal produktion, klipp, promotion) som ger en liten, bunden medieexponerings-effekt: höjd räckvidd → CS-boost och/eller en liten rykteseffekt, via samma lager som journalistVisibility redan använder. Noll direkt intäkt. Kostar en driftskostnad. Speglar verkligheten (klubben äger inte rättigheterna) och kan inte anklagas för fabricerad intäkt.

**B. A + realistisk liten liga-utdelning.** Ovanpå A: en blygsam, liga-distribuerad ersättning som skalar med hur mycket klubben SÄNDS (rykte/tier/slutspelsdjup), inte ett fast tv-avtal. Framing: "andel av ligans streamingintäkt", explicit liten. Risk: närmar sig den strukna intäktsraden — måste hållas liten och tydligt liga-härledd, annars faller den i domen.

**C. A + sponsoruppvärdering.** Ovanpå A: att synas på bandyplay gör klubbens sponsorer mer värda — en liten `sponsorNetworkMood`- eller sponsorintäkts-uppräkning. Grundad (exponering → sponsorvärde är en verklig kedja) men rör sponsorbalansen (0.0086-koefficienten, ratificerad 2026-06-23) och kräver egen liten mätning.

**Opus rekommendation:** A som bas, öppen för C senare. A är den enda som är immun mot tv-avtals-domen, den är billigast att bygga, och den gör streaming till en CS/rykte-spak — vilket är precis vad Survive-kontraktet och den lokala förankringen redan handlar om. B lockar men är den som lättast blir "kassako i förklädnad". C är en fin andra våg när A står. Men det är din kall — inte min.

### DOM 2026-09-03 (Jacob): C — A + sponsoruppvärdering

Streaming gör alltså två saker: exponering (A) och sponsoruppvärdering (C). Konkret wiring:

- **A-delen (exponering).** Streaming är en `communityActivities`-aktivitet med en csBoost/omgång (räckvidd — fler ser bygden spela) via samma väg som övriga CS-aktiviteter i communityProcessor. Lägg fältet i `StaleableActivityKey` så färskheten trappar — en klubb kan inte sätta-och-glömma.
- **C-delen (sponsoruppvärdering).** Medan streaming är aktiv: en liten, bunden sponsorbonus som går genom den BEFINTLIGA `sponsorMoodMultiplier`-vägen (`1 + (sponsorNetworkMood-50) * 0.0086`, economyService.ts). Rör INTE 0.0086. Renaste formen: en additiv `streamingSponsorBonus`-term i samma multiplikator (inte en permanent mutation av `sponsorNetworkMood`-state) — så den trappar med staleness och släcks när streaming avaktiveras. Framing mot tv-avtals-domen: pengarna kommer från att sponsorerna värderar exponeringen, inte från en påhittad liga-intäktsrad — en verklig kedja, dessutom via den redan ratificerade sponsormekaniken.
- **Kostnad.** Streaming kostar att aktivera + driva (produktion), annars är C ett no-brainer. Aktiverings- + driftskostnad.
- **Magnitud = mätning, inte gissning.** Sponsorbonusens tak ligger UNDER flaggskepps-skalan (0.0086 ger ~+5% säsongsintäkt vid flaggskepp×3). Startvärden (bonus, aktiverings-/driftskostnad) sätts konservativt och bekräftas av en liten mätning i samma mönster som åskådarekonomi-mätningarna — streaming får gå svagt plus netto (till skillnad från barn-skolan som medvetet kostar), men taket hindrar att det blir en kassako.

## 4b. BESLUT — bandyskolans grundade val (BandyKul öppnade dem)

BandyKul-exemplet gjorde barn-skolan rikare än "döp om och låt stå". Tre val, mindre laddade än §4 men verkliga. De kan tas nu eller skjutas till efter renamet (renamet gatar dem inte):

1. **Sponsor-/partnerfinansiering av bussarna.** Ska barn-skolan kunna co-finansieras (som BandyKul:s partners bär bussarna) i stället för ren klubbkostnad? Speglar verkligheten och gör den till ett val, inte bara en utgift. Rek: ja, som en enkel "en partner går in"-variant — men eget litet steg, inte nödvändigt i första passet.
2. **Ungdoms-/akademimatning.** BandyKul "föder framtida spelare". Ska barn-skolan ge en svag, långsiktig youth-feed (svagare än avancerad)? Kopplar till den öppna frågan om vilken aktivitet som matar akademin — svaret ur verkligheten är BÅDA, i två styrkor (barn = bas, avancerad = elit). Rek: ja, svag feed på barn, starkare på avancerad.
3. **Integration/CS-tyngd.** Barn-skolan är i verkligheten först och främst en samhällsinsats. Ska dess csBoost väga tyngre än dess (negativa) kassaeffekt, så valet blir "kostar pengar, bygger orten" i stället för en ren förlust? Rek: ja — det är hela poängen med aktiviteten och gör nettoförlusten begriplig i stället för att se ut som en bugg.

Ingen av dessa är laddad mot en tidigare dom (till skillnad från streaming/§4). De är rena "hur mycket verklighet vill du ha"-val.

## 5. Byggplan när dömt (Code)

Steg 0, obligatoriskt: `git grep -n "bandyplay"` för att enumerera ALLA läsställen (economyService, EkonomiTab, OrtenTab, Community.ts, communityProcessor, eventResolver `setCommunity`, academyActions, saveGameMigration, agenda-hints, ev. events/tester). Migreringen är strangler — inget massbyte utan att varje läsare flyttats.

1. **Fält-rename barn-skolan.** `CommunityActivities.bandyplay` → `bandySchoolBasic` (eller motsvarande). Följ med: `StaleableActivityKey`, `CommunityActivitiesSince`-nyckeln, EMPTY_COMMUNITY, economyservice-grenarna, EkonomiTab-raden, OrtenTab-raden, agenda-hinten, `setCommunity`/activateCommunity-validering.
2. **Save-migrering** (saveGameMigration.ts): mappa gammalt `bandyplay: true` → `bandySchoolBasic: true` och gammal `communityActivitiesSince.bandyplay` → `.bandySchoolBasic`. En spelare som drev barn-skolan ska inte tappa den. Det NYA `bandyplay` (streaming) startar `false`/`none` för alla saves — ingen bakåtgissning.
3. **Ny streaming-mekanik = C** (§4-domen). Nytt fält `bandyplay` (bool). A-delen: csBoost/omgång via communityProcessor + fältet i `StaleableActivityKey`. C-delen: additiv `streamingSponsorBonus`-term i `sponsorMoodMultiplier` (rör ej 0.0086), aktiv bara medan streaming är på, trappas av staleness. Aktiverings- + driftskostnad. Alla magnituder konservativa startvärden, bekräftade av mätningen i steg 6.
4. **CS/staleness:** lägg streaming-fältet i `StaleableActivityKey` om det bär csBoost (troligt), så färskheten trappar som övriga.
5. **UI:** EkonomiTab får en streaming-rad (ny ikon, inte ⛸️ — den följer barn-skolan); OrtenTab-engagemangslistan uppdateras; agenda-hinten för `prestige`/`inclusion` kan få streaming om den räknas där.
6. **Verifiering + mätning:** economy-tester för barn-skolans oförändrade netto efter rename; migreringstest (gammalt bandyplay → bandySchoolBasic, nytt bandyplay = av); test för streaming-C (csBoost + sponsorbonus aktiv bara medan på, slocknar vid av, rör ej 0.0086). Plus en liten balansmätning (åskådarekonomi-mönstret) som sätter streamingens sponsorbonus + kostnader så nettot blir svagt plus, under flaggskepps-skalan. Grönt på tsc/build/design/content/dubblettgrind.

## 6. Text (Opus — LÅST 2026-09-03 för C)

Barn-skolans befintliga text följer med oförändrad vid rename. Streaming-aktivitetens slutliga svenska str!ngar (Code kopierar ordagrant, översätter aldrig):

Namn (EkonomiTab + OrtenTab): 📡 Bandyplay

Status: Aktiv / Ej startad

Knapp: Starta sändning — {N} tkr  (Code sätter {N} ur mätningen, samma form som "Starta bandyskola — 5 tkr")

Note: Ligans sändningar når längre än läktaren. Fler ser bygden spela — det märks i orten, och sponsorerna får mer för pengarna när klubben syns i rutan.

## 7. Arbetsform och omfattning

Inte mantimmar. Uppskattat per uppgiftstyp:

- Rename + migrering (steg 1–2): ren refaktor + en migreringsfunktion + två tester. Code, en pass, låg beslutsyta — grep:en avgör bredden.
- Streaming-mekaniken = C (steg 3–5): en pass + en liten balansmätning (åskådarekonomi-mönstret) som sätter sponsorbonus + kostnader.
- Text (§6): LÅST — Code kopierar ordagrant.
- Externa blockerare: inga.

## Ägarskap

**Jacob:** §4 DÖMD (C). Kvar bara §4b (bandyskolans tre grundade val) — rekommenderade ja, gatar inte bygget; säg till om du vill ha dem i första passet eller senare.
**Opus:** streaming-copyn LÅST (§6).
**Code (VS Code):** hela kedjan byggbar nu — grep-först, rename+migrering, sedan streaming-C enligt §4/§5 + balansmätningen. Strangler hela vägen, dual-write där ett fält läses på flera ställen, retire-last.
