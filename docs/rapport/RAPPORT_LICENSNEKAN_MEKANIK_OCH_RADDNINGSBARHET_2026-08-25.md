# Rapport: vad driver licensnekan, och går den att rädda genom spel?

2026-08-25. Nytt ärende, ren utredning — inget byggt. Tre frågor, i ordning. Fråga 2 avgör allt, så den tar mest plats.

---

## Sidofynd innan svaren: TVÅ separata system heter "licens"

Kodbasen har två helt olika mekanismer som båda kallas licens-relaterat, med olika status-vokabulär, olika villkor, och de är INTE samma system:

**System A — `licenseReview`** (`seasonEndProcessor.ts` rad 115–205, kommentarmärkt "V0.9"). Status: `approved`/`warning`/`continued_review`/`denied`. Utvärderas mot **tre binära villkor samma säsong**: (1) `licFinances <= 0` (klubbens ABSOLUTA kassa just nu, inte en förändring), (2) ingen ungdomsverksamhet, (3) förra granskningen var redan `denied`. 0 fel → godkänd, 1 fel → varning, 2+ → fortsatt granskning. Hård gräns: kassa under -200 000 ELLER tre varningar i rad → `denied` direkt. Detta system driver INTE `managerFired` självt — det styr inboxtext, `fanMood`-effekter, och triggar "handlingsplan"-händelsen (choices: sparplan/medlemsdrivning/sponsorer/patron).

**System B — `checkLicenseStatus`** (`licenseService.ts`, anropat från `seasonEndProcessor.ts` rad ~1052). Status: `clear`/`first_warning`/`point_deduction`/`license_denied`. Detta är systemet som **faktiskt sparkar managern** (`license_denied` → `managerFired = true`). Svaret på fråga 1 nedan gäller ENBART detta system.

De två systemen läser delvis samma underliggande siffra (klubbens kassa) men på olika sätt (absolutnivå vs. förändring) och är inte synkade med varandra — "handlingsplanen" spelaren faktiskt kan agera på är kopplad till System A:s status, inte till System B:s räknare som avgör om man sparkas. Det är ett eget, mindre allvarligt fynd (förvirrande, inte livsfarligt) — flaggat, inte utrett vidare här.

---

## Fråga 1: Vad driver licensnekan konkret?

**Villkor:** `checkLicenseStatus` (`licenseService.ts:88`) mäter `netResult = computeNetResult(game) = managedClub.finances − seasonStartSnapshot.finances`. Ren kassaförändring över säsongen — inte sportsligt utfall, inte tabellplacering.

**Mätt mot:** `netResult > 0` (kassan växte eller stod still) → status återställs till `clear`, räknaren nollställs. `netResult <= 0` (kassan minskade) → räknaren ökar ett steg.

**Progression (fyra på varandra följande säsonger med `netResult <= 0` krävs, ETT bra år nollställer helt):** 2:a raka → `first_warning`. 3:e raka → `point_deduction` (−3 poäng i tabellen). 4:e raka → `license_denied` → **avsked**.

**När:** en gång per säsongsslut, i `handleSeasonEnd`, samma anropsordning varje säsong. Ingen mitt-i-säsongen-utvärdering.

---

## Fråga 2: Går den att rädda genom spel?

**Kort svar: strukturellt nej för Heros givet nuvarande formler — gapet är för stort för de spak spelaren faktiskt har.** Det är en klocka, inte ett kontrakt, i sin nuvarande form. Men det finns riktiga, om än otillräckliga, spakar — svaret är inte "noll agens", det är "agens som inte räcker."

**Den avgörande mekaniken: bortamatcher har NOLL matchintäkt.** `calcRoundIncome` (`economyService.ts:187`) — `matchRevenue` och `communityMatchIncome` sätts BARA om `isHomeMatch`. En bortamatch ger enbart `weeklyBase` (reputation-driven, ~5 250 kr för Heros) mot `weeklyWages + weeklyArenaCost` (~17 635 + 2 250 = 19 885 kr för Heros nuvarande trupp). **Varje bortaomgång kostar Heros garanterat ~14 635 kr, oavsett om laget vinner, förlorar, eller vem som sitter på bänken.** 11 bortaomgångar/säsong × ~14 635 = **~161 000 kr säkerställt underskott, inbyggt i formeln, opåverkbart av spelarens beslut.**

**Hemmamatcher KAN gå plus minus, men taket är lågt och reputation-låst.** `matchRevenue = capacity × attendanceRate × ticketPrice × formBonus × ...`. `capacity` (~reputation×7+150) och `ticketPrice` (~50+reputation×0,3) är båda i praktiken låsta av rykte, som rör sig extremt långsamt. `attendanceRate` är spelarpåverkbar (via `fanMood`, tak 0,35+0,40=0,90) men `formBonus` straffar en botten-placerad klubb (`position>=10 → ×0,88`) — exakt Heros normalläge. Uppmätt: en hemmaomgång vid dålig form/fanMood landar nära NOLL eller svagt negativ (−1 723 till +304 kr beroende på fanMood, i en kontrollerad testkörning denna rapport). 11 hemmaomgångar ger alltså i praktiken nästan ingenting att kvitta mot bortaunderskottet.

**Vad spelaren FAKTISKT kan påverka, och varför det inte räcker:**
- **Lönesänkning (sälja/släppa spelare):** den mest uppenbara spaken. Men truppens genomsnittslön (~4 400 kr/spelare i Heros nuvarande trupp) och ersättningsspelares lön (`ca×120+2000` vid truppkomplettering, `seasonEndProcessor.ts:1217`) ligger i samma härad — det finns INGEN mycket-billigare-ersättare-väg att hämta hem stor besparing på. En minimal, lagligt spelbar trupp (~14 spelare, `roundProcessor.ts`s safety-net) mot dagens 16 sparar grovt ~2 200 kr/omgång — **cirka 15% av bortaunderskottet, inte tillräckligt för att vända det.**
- **FanMood/community-aktiviteter/sponsorer:** verkliga, positiva, men små i denna skala (hundratal till låga tusental kr/omgång per aktivitet) mot ett ~161 000 kr/säsong bortaproblem.
- **Kommunbidrag (dubbelt, se sidofyndet ovan):** ett engångsbidrag vid omgång 1 (`calcRoundIncome`, ~24 000 kr för Heros vid communityStanding 50 — kvadratiskt i communityStanding, så en spelare som medvetet bygger communityStanding mot 90-100 kan ROUGHLY fördubbla detta) PLUS ett andra, politikerdrivet bidrag vid säsongsslut (`calculateKommunBidrag`, `politicianService.ts` — formel ej fullt uträknad i denna rapport, men also communityStanding/ungdomsengagemang-driven). Detta ÄR en reell, spelarpåverkbar hävstång — men den är en gång per säsong, inte tillräcklig ensam.
- **Prispengar:** garanterat men litet — sistaplats ger `PRIZE_MONEY[11] = 15 000 kr` (`seasonEndProcessor.ts:262`), oavsett prestation däröver.
- **Patron:** om aktiv, ett årligt bidrag (`game.patron.contribution`) — reellt men förutsätter att en patron-relation existerar/underhålls, inte garanterat tillgängligt.

**Summering av spelarens bästa tänkbara scenario:** minimerad trupp (+~48 000/säsong), maximerad communityStanding → dubblerat kommunbidrag (+~24 000), full satsning på community-aktiviteter/sponsorer (+ några tusen till lågt tiotusental), bästa möjliga fanMood-hantering på hemmaplan (+ några tusen). Grovt adderat: kanske **80 000–120 000 kr/säsong i tänkbar förbättring — mot ett ~161 000 kr strukturellt bortahål plus hemmaplanens redan tunna marginal.** Det räcker sannolikt INTE att göra ETT enskilt bra år positivt, och även om det skulle räcka enstaka gånger krävs **FYRA raka** goda år för att aldrig trigga räknaren — med resultat-/fanMood-/communityStanding-varians över fyra säsonger är sannolikheten att aldrig missa en enda gång låg, även för en spelare som spelar optimalt.

**Detta är inte fullt kvantitativt bevisat till sista kronan** (politikerbidragets exakta formel och en fullständig fyra-säsongers optimal-spel-simulering är inte körda i denna rapport) — men den strukturella slutsatsen (bortamatcher är ett garanterat, opåverkbart hål som ensamt överstiger alla kända spelarspakar tillsammans) är robust nog att svara på frågan: **nej, inte pålitligt räddningsbar genom spel i nuvarande form.**

---

## Fråga 3: Vad skulle krävas för att göra den räddningsbar?

Given att roten är "bortamatcher ger noll matchintäkt", fyra oberoende åtgärder, i ungefärlig verkningsgrad-ordning (Jacobs val, inget byggt):

1. **Ge bortalaget en andel av hemmalagets matchintäkt** (verklighetstroget — bortalag får ofta en känga av biljettintäkten i verklig idrott). Löser roten direkt, rör inte hemmaklubbens egen ekonomi.
2. **Höj `weeklyBase`s reputation-lutning i botten av skalan**, eller ge en riktad subvention till Survive-tier specifikt (tematiskt: "samhället stöttar klubben som håller ut") — en avsiktlig konstant, inte en smygfix.
3. **Sänk `weeklyArenaCost`** för lågt-kapacitet-arenor ytterligare (redan sänkt en gång, Sprint 26b, 8→5).
4. **Gör System A:s "handlingsplan"-val (sparplan/medlemsdrivning/sponsorer/patron) faktiskt kopplade till System B:s räknare** — just nu triggas de av fel systems status (se sidofyndet). Om de tydligt räddade EN säsongs netResult skulle det vara en verklig, spelbar räddningsmekanik redan i systemet, bara felkopplad.

Ingen av dessa är byggd. Väntar på dom.
