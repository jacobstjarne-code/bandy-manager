# SPEC — O1-kandidat 1/4: mecenatens krav (varsel-mall, 5/5)

**Datum:** 2026-09-09 · **Av:** Opus · **Beställd av:** Jacob (bygg O1-kandidaterna) · **Grund:** `O1_SPONSORN_FORST_2026-08-22` (mallen, byggd sponsor-variant), `DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17` (mallens fem kriterier), `GameEvent.ts` (EventChoice/EventEffect), mecenatsystemet (`mecenatService.ts`). Första av fyra O1-kandidater. Detta är en färdig spec Code bygger mot.

## Varför denna först

Sponsorvarianten blev 4/5 — kriterium 2 (träffar en spelare/funktionär spelaren MÖTT) föll, för sponsorer är företag. Mecenaten är en namngiven person spelaren redan mött (mecenatinteraktioner finns). Och en andra namngiven person kan bäras in (spelaren kravet gäller). Alltså 5/5 — mallens starkaste möjliga fyllnad, och därför rätt att bygga före de andra tre.

## Mallens fem kriterier — hur denna uppfyller dem

1. **Namngiven institution/person i spelvärlden:** mecenaten {mecenat} — spelaren har mött honom (mecenatinteraktioner). ✅
2. **Träffar en spelare/funktionär spelaren mött:** kravet gäller {player} — en veteran/legend i truppen mecenaten har ett gott öga till. ✅
3. **Ett tal att räkna på:** {player}s lön (kr/mån) — kostnaden att behålla honom ett år till, mot mecenatens goodwill. ✅
4. **Minst två system:** mecenatrelation (happiness) + trupp/ekonomi (platsen + lönen). ✅
5. **Pekar isär:** sportslig logik (släpp en tynande veteran) mot ortens lojalitet (mecenatens vän får stanna). ✅

→ 5/5. Får `systemhandelse: true` (till skillnad från sponsorn) — men naturligt sällsynt (kräver aktiv mecenat med hög happiness + en veteran/legend i truppen), så räknaren mot U5/O19-budgeten hålls låg av villkoret, inte av en konstlad spärr.

## Mekaniken

**Trigger:** en aktiv mecenat med hög happiness (över en tröskel Code sätter) OCH minst en veteran/legend (hög ålder ELLER `legendRole` satt) i truppen. Mecenaten "adopterar" den spelaren vid genereringen (`relatedPlayerId` = den valda veteranen) — inget nytt affinitetsfält behövs. Fyrar sällan (villkoret + naturlig sällsynthet).

**Val A — "Behåll honom":** {player} stannar (ingen releasePlayer). Ingen direkt kostnad utöver den befintliga lönen han redan bär (den är talet mallen räknar på, inte en ny utgift). Effekt: `mecenatHappiness` +X (gläder mecenaten). Utfallstext-inbox.

**Val B — "Låt honom gå":** {player} frigörs (`releasePlayer`, targetPlayerId = {player}). Effekt: `mecenatHappiness` −Y (prövar mecenaten; Y > X, en refusering väger tyngre än en efterlevnad). Risk för withdrawal om mecenaten redan är låg — den befintliga withdrawal-logiken fångar det, ingen ny kod. Utfallstext-inbox.

Balanstalen X/Y sätter Code och kalibrerar (samma frihet som sponsorns communityStanding −6). Ingen ny effekt-typ behövs — `mecenatHappiness` och `releasePlayer` finns redan i `EventEffect`.

## Text (låst, Opus — bandysvensk underdrift, mecenatens röst: osnobbig, "ortens kung")

Förhandstexterna följer O12-kontraktet (`DOM_O12_FORHANDSTEXT_KONTRAKT`): kvalitativ riktning, ingen exakt icke-penga-siffra. Mecenatens vokabulär: "gläder {mecenat}" / "prövar {mecenat}s tålamod".

**Rubrik:** {Mecenat} har en önskan

**Brödtext:** Över kaffet säger {mecenat} det rakt ut, utan att göra en grej av det: han skulle vilja se {player} få ett år till. Han var med när det var tunnare än nu, och mecenaten har ett gott öga till honom. Det är inget krav han uttalar — men du förstår ändå. Hans välvilja har en form, och det här är den.

**Val A:** Behåll honom · undertext: gläder {mecenat}
**Val B:** Låt honom gå · undertext: prövar {mecenat}s tålamod

**Utfall A (behåll):** {mecenat} nickar, nöjd på sitt tysta vis. {player} stannar ett år till, och orten noterar vem som fick bestämma.
**Utfall B (låt gå):** {mecenat} säger inte mycket. Men något svalnar. {player} går vidare, och nästa gång du ser mecenaten är värmen en grad lägre.

Utfallstexterna renderas som inbox-poster vid resolution (`inbox_mecenat_krav_accept`/`_reject`), samma mönster som sponsor-varianten.

## Ägarskap

Code: bygg triggern (aktiv mecenat hög happiness + veteran/legend i trupp), `buildMecenatKravEvent` (ren, testbar), eventResolver-grenen (A: mecenatHappiness+; B: releasePlayer + mecenatHappiness−), utfallsinbox, contentContract-raden. Kalibrera X/Y. Opus: denna spec + texten (låst). Jacob: byggbeslutet givet.

## Kvar i O1-passet (Opus specar härnäst, samma mönster)

2. **Anläggningen som kostar orten** — en anläggning/utbyggnad som lyfter klubben men sänker communityStanding (orten får bära den). Namngiven: kommunen/orten. Två system: anläggning/ekonomi + CS.
3. **Ungdomen som kan brännas** — en junior spelaren kan ta upp för tidigt (kortsiktig vinst mot risk att bränna talangen). Namngiven: junioren. Två system: trupp/resultat + spelarutveckling.
4. **Supporterbrevet** — klacken ber om något i ett brev (en biljettprissänkning? en spelare kvar?). Namngiven: klackledaren. Två system: ekonomi + supporterrelation/CS.

Var och en specas som denna — mall-check, mekanik mot befintliga effekt-typer, låst text — innan Code bygger.
