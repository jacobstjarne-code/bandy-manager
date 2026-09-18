# TEXTLEVERANS — tre sanningsfel + tondom (Opus 2026-09-15)

Svarar mot Codex textpass. Tre sanningsfel först (färdiga ersättningar), sedan tondom per kandidat. Alla kodlästa mot källan — jag har sett villkorslogiken, inte gissat den. Ingen mekanik rörs; Code wire:ar villkoren där det krävs.

---

## SANNINGSFEL 1 — cup_done avfyras när VÅRT lag är ute, men texten påstår att hela cupen är slut

**Roten:** `cup_done` (cupAnslag.ts) visas när managed club åkt ur — men två av tre varianter säger "Cupen är avgjord" / "Cupen är spelad" / "Pokalen står på någon annans byrå", vilket är falskt om vi åkte ut i första omgången och cupen fortsätter. Bara variant 2 har rätt perspektiv ("Vår cup är slut"), men den är lång.

**Domen:** hela `cup_done` ska tala om VÅR cup, aldrig om cupens öde. Skilj dessutom på två tillstånd Code redan kan avgöra — åkte vi ur medan cupen fortsätter, eller är cupen faktiskt färdigspelad (vi var med till slutet / finalen är över)? Två nycklar i stället för en blandad pool:

**`cup_done` (vi åkte ur, cupen fortsätter utan oss) — ersätt alla tre varianterna:**

Variant 1:
`Vår cup är över. Det blev de matcher det blev.<br><br>Andra spelar vidare. Vi går in i serien i stället — det är där det avgörs ändå.`

Variant 2:
`För oss är cupen slut. Kort den här gången.<br><br>Den prövar laget innan serien tar vid. Vad vi lärde oss får vi se. Serien väntar.`

Variant 3:
`Vi är ute. Spelarna är tillbaka på tisdagsträningarna, assisterande tar hand om dem som behöver det.<br><br>Cupen rullar vidare utan oss. Nu är det serien — 22 omgångar att visa vad vi går för.`

**`cup_done` när cupen FAKTISKT är färdigspelad (vi följde den till slutet utan att vinna)** — om Code kan avgöra det tillståndet, använd de befintliga "Cupen är spelad / Pokalen står på någon annans byrå"-formuleringarna DÄR, för då är de sanna. Om tillståndet inte går att skilja ut i scope: använd de tre ovan för alla ur-fall, och låt `cup_done_winner` bära vinnaren. De gamla "hela cupen är slut"-varianterna ska inte visas för ett lag som åkte ur i omgång ett.

Code: `anslagService.ts:156` (utlösningen) avgör om vi åkte ur medan cupen pågår vs cupen är slut. Finns bara "vi är inte kvar"-signalen, gäller de tre ur-varianterna. Vinjettens ton (kort, ingen förklaring) styr — variant 1 av de gamla ("Cupen är spelad... hur fin den än var, ändå bara är cupen") stryks, den var lång och förklarande som Codex noterade.

---

## SANNINGSFEL 2 — naturis där orten har konstis

**Två rader, samma rot:** texten antyder naturis eller att is saknades före hallen. Bruksort-klubbarna har konstfrusen is (Heros-vinjetten säger det själv: "sin konstfrusna is på Hedvallen").

**`stillnessText.ts:28`** — `'Isen lade sig i natt. Det luktar skrapa och nyspolat vid vallen.'` (weather: cold)

Ersätt:
`Isen är nyspolad i natt. Det luktar skrapa och kyla vid vallen.`

Naturis "lägger sig" när det fryser; konstis spolas. "Nyspolad" är sant oavsett väder, och kylan bär fortfarande cold-taggen. Bilden (skrapa, vall, natt) behålls.

**`facilityPortalBeats.ts:65`** (`matchhall`) — `'Hallen står klar. Inget blir sig likt — men isen ligger året om nu.'`

Ersätt:
`Hallen står klar. Inget blir sig likt — isen finns oavsett väder nu, även sommartid.`

Skillnaden en hall gör är inte att is plötsligt finns (konstisen låg redan hela vintern) utan att den finns *oberoende av väder och årstid* — inomhus, även när det är plusgrader ute. Det är den sanna förändringen.

---

## SANNINGSFEL 3 — Söderfors-vinjetten antar spelarens färdriktning

**Roten:** `opponentVignetteText.ts:19` (club_soderfors) säger "Vägen till matchen går över bron, in i skogen, till en by..." — formulerat ur den resandes riktning. Men samma statiska text visas när Söderfors kommer på BESÖK till dig, då reser ingen dit. Vinjetten är en ortsbeskrivning, inte en resebeskrivning.

**Ersätt club_soderfors:**
`Bruksorten på en ö i Dalälven, där Sveriges enda ankarsmedja en gång smidde järn åt flottan. En bro bär in till byn, in i skogen, där halva orten är byggnadsminne. På Ässjan står en trappformad stockläktare som knappt syns längre.`

Bron finns kvar som ortens kännetecken ("en bro bär in till byn"), men utan "vägen till matchen" — den beskriver platsen, inte spelarens färd. Sann både hemma och borta. Ingen villkorslogik behövs; en formulering räcker, vilket är enklare än att villkora hemma/borta.

---

## TONDOM — mänskligt textbeslut, inte automatisk ersättning

Codex bad om dom, inte ersättning, på dessa. Min läsning:

**"Det blev en säsong. Som alla andra och inte heller det." (leagueAnslag.ts:107)** — STRAMA ÅT. Den fristående bisatsen ("och inte heller det") är precis det vaga, konstruerade greppet preferensregeln varnar för (max en "inte X utan Y", och detta är en släkting till den). Ersätt med en konkret säsongsbild. Men jag skriver den inte blint — den ska spegla FAKTISK säsongsdata (placering, om det var upp eller ner). Code: exponera säsongens utfall (placering, tabellrörelse) så jag kan skriva tre varianter som säger något sant om just den säsongen i stället för en generisk efterklang. Det är samma mönster som årsbokens transfermening — konkret ur data slår vag ur mall.

**"Det pratas tystare än vanligt. Som när man inte vill väcka otur." (transferResponseText.ts:241)** — BEHÅLL, med en möjlig stramning. Andra meningen är inte vag på samma sätt — "väcka otur" är en konkret vardagsbild, inte konstruerad efterklang. Den bär rytm. Jag skulle låta den stå. Om den ska strામas: `Det pratas tystare än vanligt i klubbhuset.` ensam funkar, men den förlorar bilden. Min dom: behåll hela.

**Matchgranskningens referatmall (granska/helpers.ts:203)** — DEN TYNGSTA TONFRÅGAN, och den är delvis kod. "En förlust att analysera", "dominerade målprotokollen", "Många mål i en öppen match" staplas generiskt. Codex har rätt: faktiska mål och resultat ger egen röst. Men det är inte en textersättning — det är att mata in faktisk matchdata (resultat, målskyttar, skede) i sammanfattningen. Code: exponera matchens faktiska siffror på granska-ytan, så skriver jag en mall som säger "4–2, tre mål i andra" i stället för "många mål i en öppen match". Utan datan blir det en ny generisk mall som ersätter en gammal. Detta är ett eget pass, större än de andra: Code exponerar, Opus skriver mot verkliga fält.

**Klackledarens "...prata. Om sångerna..." + kommunens "...stöd. Och om..." (voiceIntroductionService.ts:142)** — BEHÅLL BÅDA. Det här är entré-rösterna jag skrev, och den fristående bisatsen är ett medvetet grepp där, inte en olycka — den bär understatement (kommunen som inte säger rakt ut vad den vill ha tillbaka). Men Codex iakttagelse är rätt att de ligger tätt. Min dom: behåll klackledarens (den bär mest), och om en ska stramas, kommunens: `{namn} kallar till möte om föreningens stöd — och vad kommunen väntar sig tillbaka.` (em-dash i stället för fristående mening, samma innehåll, mindre upprepning av greppet). Men bara om de faktiskt visas nära varandra i tid; gör de inte det är även den ändringen onödig.

---

## Leverans till Code

- **Tre sanningsfel:** cup_done (villkora ur-vs-slutspelad, tre nya ur-varianter), is-raderna (två direkta ersättningar), Söderfors (en direkt ersättning). Sanningsfelen först, som Codex sa.
- **Tondomarna:** leagueAnslag och granska-referatet kräver att Code exponerar data (säsongsutfall resp. matchsiffror) innan Opus skriver mot dem — eget pass. transferResponse och voiceIntro: behåll, en valfri stramning på kommunraden om de visas nära varandra.
- Ingen speltext specad till Code. Alla ersättningar färdiga strängar utom de två data-beroende, där ordningen är exponera → Opus skriver.
