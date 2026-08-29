# DOM — A3/CRITICAL 3: konditionsspiralen, autofyll och återhämtning

**Datum:** 2026-08-29 · **Av:** Opus · **Utlöst av:** audit 2026-08-29 CRITICAL 3. Blockerar Code på blockerare A3. **A-H3 stängs INTE förrän detta är löst** (de delar golv och system).

## Fyndet (auditen, kodpekat)
`lineupNudge.ts:42–79` prioriterar spelare över golvet 22 men fyller ALLTID från gruppen under golvet om färre än elva finns över det — tyst. `playerStateProcessor.ts:170–180` dränerar startare 15–25 poäng/match (×taktik/väder/position), bänk får +5, vilande återhämtar under ett `seasonForm`-tak. Nettoloopen blev negativ över säsongs- och sommargränser: säsong två inleddes kring 40 % trots offseason, spelare startades på 0–3 %, och eftermatchen klandrade spelaren för att de "startade trött". Avskedet kändes då som en följd av ett trasigt system, inte av spelarens beslut.

Det bryter samma doktrin som resten av framgångskurvan: en tyst, oplanerbar kostnad spelaren inte kan namnge eller styra. `Fyll bästa elvan` som väljer en 0 %-spelare och sedan får skäll för det är ett dolt straff.

## Domen — tre krav

**1 · Autofyll får aldrig TYST starta under golvet.** När den tvingas (färre än elva över golvet 22) ska den (a) varna synligt, (b) föreslå konkret utväg — akademikallelse eller formationsbyte — och (c) kräva bekräftelse. Att gå in med en utsliten spelare ska vara spelarens synliga beslut, inte ett gömt val. Kostnaden blir därmed namngivbar, i linje med hela A-H2-doktrinen.

**2 · Återhämtning ska vara netto-positiv över en säsong med Vila.** En 18-mannatrupp med normal rotation + Vila får inte hamna i en stabil negativ spiral. Sommaren måste ge en begriplig återställning till rimlig matchberedskap. Om Vila-valet ligger kvar i flera år och truppen ändå faller till 4–15 % är kurvan trasig, inte spelarens fel.

**3 · Synlig prognos.** Visa `efter nästa match` / `tillgänglig igen` så spelaren kan förstå återhämtningen och planera runt den (samma "planera runt"-princip som A-H3:s tillgänglighetsben).

## SKYDDAT — rör inte
A-H3:s tillgänglighetsgolv + Sliten/Vilar-ytorna står kvar (de är rätt — trötthet ska kosta tillgänglighet). `playerModifier`s 60 % fitnessvikt orörd (A-H3-domen: "inte prestation" = inte levern). Detta fixar autofyll-LOGIKEN + återhämtningsKURVAN, inte availability-mekaniken.

## STEG 0 — före mätning
Samma förgiftade-sim-varning som baskonomin: mät mot realistisk trupp och schema, inte en syntetisk +CA-blankett.

## GODKÄNT NÄR (auditens uthållighetstest B)
Kör deterministiskt 5 säsonger med 18-, 20- och 24-mannatrupp, kompetent spel med rekommenderad elva + normalt träningsbyte. Mät median + 10:e percentil kondition före varje match, antal starter under golvet 22, skador, tillgängliga spelare. Krav:
1. Ingen stabil negativ spiral med Vila.
2. Offseason ger begriplig återställning.
3. Autofyll väljer ALDRIG tyst under golvet — varnar/kräver bekräftelse.
4. Produktkrav (mätbart): normal rotation + Vila får inte lämna majoriteten av truppen under **X %** kondition inför match. **X sätts av mätningen** (auditen föreslog 25 %). **D-fact för X** innan commit.

## Ägarskap
Opus: denna dom. Code: autofyll-varning/bekräftelse + återhämtningskurva + prognos → mät B → D-fact för X → commit. Jacob: sätter X om mätningen visar en gråzon. Sen — och först då — kan A-H3 ratificeras och stängas.

---

# TILLÄGG 2026-08-29 — Codes mätning och byggda svar

**Av:** Code · **Mätscript:** `scripts/a3-konditionsspiral-matning-2026-08-29.ts` · **D-fact:** D036 · **Status:** byggt i arbetsträdet, ej committat — väntar granskning. **A-H3 stängs inte av detta tillägget; det är Jacobs beslut.**

## 0 · Baslinjen — värre än auditen rapporterade

Före någon ändring, 18-mannatrupp, kompetent spel (`pickBestEleven`), 2 säsonger:

| policy | truppmedian säs 1 | säs 2 | starter under golvet 22 | omgångar där autofyllen tvingades under golvet |
|---|---|---|---|---|
| Hall | 17.5 | 20.4 | 190/319 per säsong (**60 %**) | 22 av ~29 |
| Vila | 20.1 | 13.3 | 207/363 | 24 av ~33 |
| Adaptiv | 19.7 | 12.6 | 186/330 | 22 av ~30 |

**Vila gjorde det VÄRRE.** Det är fyndets kärna, och det pekade rakt på rotorsaken.

## 1 · Rotorsaken — tre fel, inte ett

**1. `seasonForm`-taket var ingen återhämtningsgräns, det var en KLAMP på råvärdet.**
`Math.min(seasonForm + 3, fitness + rec)` DRAR NER en spelare som redan ligger över taket. Vila sänker `seasonForm` 1.0/omgång → vilo-valet sänkte aktivt klampen och därmed konditionen. Återhämtningsspaken var netto-destruktiv. Dessutom dubbelräknat: samma tak tillämpas redan på EFFEKTEN i `playerModifier` (squadEvaluator.ts:42) — SKYDDAT i domen, står orört. Det som togs bort är den andra, odokumenterade tillämpningen på råvärdet.

**2. En startare fick aldrig någon återhämtning alls.** Hans omgång var rent −15..−25. Med 11 av 18 startande blev trupploopen 11×(−20) + 5×(+5) + 2×(+7) = **−181 per omgång**. Ingen trupp av någon storlek kunde bära det.

**3. Modellen var PLATT i båda riktningarna — den hade ingen inre jämvikt.** Ett platt drän mot en platt återhämtning ger antingen alla mot 0 eller alla mot taket. Att kalibrera om konstanterna hade bara flyttat kanten. Därför är återhämtningen nu **proportionell mot gapet till taket**: snabb när spelaren är slut, långsam nära toppen. Det ger en äkta inre jämvikt som dessutom **skalar med truppdjupet**.

Bonusfynd i samma spår: **`seasonForm` nollställdes ALDRIG mellan säsonger.** Med Vila landade den på ~20 i säsong 2 och 0 i säsong 4 — hela truppen spelade på några få procents effektivitet resten av karriären.

## 2 · Iterationerna — i den ordning de kördes

**Iteration 0 (baslinje):** tabellen ovan. Diagnos ställd, inget ändrat.

**Iteration 1 — takter 0.25 / 0.32→0.45 / 0.55 (startare/bänk/vilande), + sommaråterställning.**
Spiralen försvann helt: truppmedian 58–100, sub-golv-starter 0.0 %, tvingade fyllningar 0.0. **Men den gick för långt.** En kontrollpolicy lades till för att pröva det — `stjarnor`, den naive/lojale managern som alltid startar sina elva bästa på ren `currentAbility` och struntar i kondition. Även HAN fick bara 0.14 % sub-golv-starter. Det hade lagat A3 genom att i praktiken **avliva A-H3**: trötthet hade slutat kosta något, och domens SKYDDAT-klausul säger uttryckligen att tillgänglighetsbenet ska stå kvar. Förkastad.

**Iteration 2 — takter 0.16 / 0.32 / 0.42.** Håller båda sidorna samtidigt. Denna är låst.

## 3 · GODKÄNT NÄR — uthållighetstest B, utfall

Kompetent spel = `pickBestEleven` (samma "Fyll bästa elvan" auditen testade), bänk = de fem näst bästa. Truppen byggd av RIKTIGA genererade spelare (16 ur klubbens egen generering + extra grafade från en parallell värld med samma klubbmall — ingen syntetisk +CA-blankett, STEG 0 respekterad).

**Konfirmationssvep: 8 säsonger × 5 frön × truppstorlek 18/20/24 × 4 policyer ≈ 165 000 starter.**

| policy | trupp | truppmedian säs 2→8 | starter under golvet 22 | nya skador/säs | tillgängliga | spiral? |
|---|---|---|---|---|---|---|
| Hall | 18 | 67 64 55 54 58 58 56 | 0.03 % | 7–8 | 16–21 | **nej** |
| Hall | 20 | 74 73 57 53 58 60 56 | 0.12 % | 8 | 16–22 | **nej** |
| Hall | 24 | 91 78 59 52 54 54 58 | 0.57 % | 9.6 | 15–27 | **nej** |
| Vila | 18 | 75 66 56 52 56 60 59 | 0.12 % | 8 | 16–21 | **nej** |
| Vila | 20 | 83 74 59 55 58 56 55 | 0.20 % | 8 | 16–22 | **nej** |
| Vila | 24 | 96 83 63 56 59 59 59 | 0.43 % | 9 | 15–27 | **nej** |
| Adaptiv | 18 | 67 65 57 55 58 57 56 | 0.20 % | 7.8 | 16–21 | **nej** |
| Adaptiv | 20 | 74 66 58 53 57 59 54 | 0.65 % | 8 | 16–22 | **nej** |
| Adaptiv | 24 | 93 84 65 56 61 61 59 | 1.32 % | 9 | 15–27 | **nej** |
| *stjarnor (kontroll)* | *18–24* | *74 66 50 47 52 53 53* | ***26–30 %*** | *8–9* | *15–27* | *nej* |

**Krav 1 — ingen stabil negativ spiral med Vila:** uppfyllt. Alla nio kompetenta celler konvergerar till samma platta band 52–59 och ligger kvar där genom säsong 8. (Säsong 1–2:s höga tal för 24-mannatruppen är en uppblåst start — de flesta står över varje omgång — och truppen krymper sedan till ~17 av pensioneringar. Konvergens, inte spiral. Spiraltestet skärptes därför till "faller monotont från säsong 2 OCH slutar minst 10 under säsong 2"; med det testet flaggas ingen cell.)

**Krav 2 — offseason ger begriplig återställning:** uppfyllt. Mätt på de SLITNA (10:e percentilen, inte medianen — medianen ligger ofta redan i taket och döljer effekten): typiskt **+40 till +63 konditionspoäng** över sommaren. `+15` ersatt av ett mål (78 + 14×stamina/100 → 78–92) som aldrig sänker någon, plus `seasonForm`-återställning mot 62 med en fjärdedel bärighet från förra säsongen.

**Krav 3 — autofyll väljer aldrig tyst under golvet:** uppfyllt, se avsnitt 5. Verifierat i webbläsare, inte bara i test.

**Krav 4 — produktkravet X:** se nästa avsnitt.

## 4 · X = 25 % — satt av mätningen, inte övertaget på förtroende

Auditen FÖRESLOG 25. Domen krävde att X sätts av mätningen. Kandidaterna 20/25/30/35/40/45 prövades mot andelen matcher där truppMEDIANEN (= "majoriteten av truppen", domens formulering) låg under nivån, i den värsta av de nio kompetenta cellerna:

| nivå | värsta kompetenta cell |
|---|---|
| < 20 % | 0.0 % |
| **< 25 %** | **0.0 %** ← högsta nivån där ALLA nio celler är 0.0 % |
| < 30 % | 0.5 % ← löftet går redan sönder här (Hall, 24-manna) |
| < 35 % | 2.9 % |
| < 40 % | 11.2 % |

**X = 25 %.** Inte auditens siffra övertagen, utan den högsta nivå datan bär. X = 30 hade varit ett löfte systemet bryter ungefär en gång på 200 matcher, och ett produktkrav som bryts ibland är sämre än inget. D-fact: **D036**.

**Att X ligger nära golvet 22 är avsiktligt och läsbart:** medianspelaren i truppen ligger alltid över den nivå där A-H3:s tillgänglighetsstraff börjar bita. Trötthet blir en fråga om ENSKILDA spelare i pressade lägen, aldrig ett trupptillstånd.

## 5 · Att trötthet fortfarande kostar — kontrollpolicyn `stjarnor`

Den viktigaste enskilda siffran i hela mätningen:

| | kompetent spel | naiv manager (elva bästa på CA) |
|---|---|---|
| starter under golvet 22 | 0.03–1.32 % | **26–30 %** |
| sämsta enskilda matchens startelva-median | 20–27 % | **13–16 %** |

Skillnaden mellan de raderna ÄR domens poäng. Kostnaden finns kvar och är stor — men den är nu en följd av managerns eget val, inte av kurvan. En äkta ständig startare (aldrig roterad) har fortfarande jämvikt kring **6 %**.

Och även under kompetent spel biter golvet i tunna lägen: när 24-mannatruppen krympt till 16–17 dyker det upp ~4 sub-golv-starter och ~1 tvingad autofyllning per säsong. Ungefär en gång per säsong, alltså — ett meningsfullt ögonblick, inte ett gnat.

## 6 · Vad som byggdes

**Krav 1 — autofyllens varning/bekräftelse.** `pickBestEleven` rapporterar nu `belowFloorStarters` / `shortfall` / `forced` (fallbacken under golvet fanns redan från HIGH2 — det som saknades var att den rapporterade sig). En tvingad fyllning **appliceras inte** — den parkeras tills managern sagt ja. Grinden sitter dessutom på **beslutet** (CTA:n ut ur uppställningen), inte bara på autofyll-knappen: en manuellt ihopsatt elva under golvet är exakt samma dolda straff och gick annars rakt igenom.

**Konkret utväg — vad som faktiskt var byggbart.** Två utvägar utreddes mot koden:
- **Akademikallelse: byggd.** `promoteYouthPlayer` är en wirad ettklicksåtgärd, och `NodtruppScene.tsx` renderar redan exakt den listan med exakt den knappen. Skillnaden är bara TRÖSKELN — NodtruppScene visas vid < 11 spelklara, A3:s läge är "elva spelklara finns, men färre än elva över golvet". Ytan är alltså inte ny, den är samma utväg vid rätt tröskel.
- **Formationsbyte: utrett och AVFÄRDAT.** Ett formationsbyte ändrar vilka positioner elvan behöver, aldrig hur många — den är alltid elva. Ett konditionsunderskott går inte att formera bort. Att erbjuda det hade varit en tom knapp som ser ut som en lösning, alltså samma sorts dolda straff domen angriper. Det står inte där av det skälet, inte av förbiseende.
- Den tredje, alltid sanna utvägen: **att inte gå in med dem.** Prognosen visar vad spelaren är värd nästa match om han vilas i stället — det gör kostnaden namngivbar även när akademin är tom.

**Krav 2 — kurvan.** Ny domänservice `fitnessRecoveryService.ts` (ny fil motiverad: prognosen i presentation måste räkna SAMMA formel som motorn i application, och presentation får inte importera application — samma lagerargument som A-H3 använde när golvkonstanten flyttades till `squadEvaluator.ts`). Matchkostnaden (15–25 × taktik/väder/position) står **oförändrad** — A3 rör återhämtningen, inte dränet.

**Krav 3 — prognosen.** Prognoskolumn i uppställningslistan: `kondition nu → efter nästa match` (om han startar) respektive den gröna siffran (om han vilas), och `⟳N` för otillgängliga (omgångar tills valbar igen, längsta av skada/avstängning/vila). Samma formel som motorn — ingen avskrift.

## 7 · Känd, owirad spak (fynd, utanför denna doms scope)

`daysBetweenFixtures` skickas **aldrig** av `roundProcessor.ts` — parametern faller alltid tillbaka på default 7, så kalenderfaktorn är i praktiken konstant 1.0 och **matchtäthet påverkar inte återhämtningen alls**. Detta är förbefintligt, inte infört av A3. Formeln bär spaken; den är bara inte inkopplad. Cupveckor och slutspelsträngar borde kosta mer än de gör. Loggas som eget ärende.

## 8 · Verifiering

`npx tsc --noEmit` rent. Full svit 3252/3255 — de tre röda (`saveConflictTwoTabs.test.ts`) är 5-sekunders-timeouts under full last och **passerar 4/4 i isolering**; de rör indexedDB/persistens, inget A3 tar i. `npm run build` grönt inkl. ds-guard och content-contract-guard.

**Browser-verifierat** (390×844, dev-servern, `/dev/scenes?scene=lineup-filled`), inte bara grönt i test:
- Prognoskolumnen renderar riktiga värden (`88→72` för en startare, `61→74` för en vilad), ingen horisontell overflow.
- "Fyll bästa elvan" med sliten trupp **öppnar grinden i stället för att fylla** — panelen visar `3 / 11 · ≥ 22 % −8`, de åtta spelarna under golvet med `→ 13 %` (startar) mot `→ 40 %` (vilas), och fungerande "Kalla upp"-knappar.
- Avbryt lämnar elvan orörd; bekräfta applicerar fyllningen. Hela flödet klickat igenom.

**Kvar för Opus:** 8 `'[Opus]'`-platshållare (7 i `FatigueFloorConfirm.tsx`, 1 i `LineupStep.tsx`), alla upptagna i `tests/grind/opusPlaceholderGate.ts` med skäl.
