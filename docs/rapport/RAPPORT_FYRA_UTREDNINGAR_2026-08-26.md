# Rapport: fyra utredningar — bestFinish, preview-mönstret, mecenat/patron-frekvens, avhopp

2026-08-26. Rapport-först, ingen kod ändrad (utom de två mätskripten, som inte rör produktionskod).

## 1. Vad bestFinish faktiskt mäter — och varför Heros visar topp fyra säsong 1

**Rotorsak hittad, kodläst och bekräftat körningsvis (`scripts/heros-bestfinish-diagnos-2026-08-26.ts`):** `trainerArcService.ts`s `updateTrainerArc()` körs VARJE OMGÅNG (`roundProcessor.ts:888`), inte bara vid säsongsslut, och läser `pos = standing?.position` VARJE gång den körs — inklusive den ALLRA FÖRSTA omgången, INNAN en enda match spelats. Körning bekräftar: Heros får `bestFinish: 12 → 4` vid `spelade=0` (noll matcher). Samma test på Forsbacka: `bestFinish: 12 → 1` vid `spelade=0`.

**Detta är INTE en styrkeformel- eller kanonfråga.** Det är samma familj av bugg som redan dokumenterad i `GRIND1_STRESSTEST_RESULTAT_2026-08-23.md`: när alla klubbar står på 0 poäng sorteras tabellen ALFABETISKT (`calculateStandings`s tie-break). Vid säsongsstart, före första matchen, är ALLA klubbar på 0 poäng — så `standing.position` vid den allra första `updateTrainerArc()`-körningen ÄR den alfabetiska ordningen, inte något om klubbens styrka. Forsbacka (F, alfabetiskt tidigt) får position 1. Heros (H, mitt i alfabetet bland dessa tolv namn) får position 4.

**Eftersom `bestFinish` bara någonsin MINSKAR** (`if (pos < arc.bestFinish) arc.bestFinish = pos`, aldrig återställs) **blir denna alfabetiska spökposition ett PERMANENT golv** — Heros kan aldrig få ett SÄMRE registrerat bestFinish än 4, oavsett hur dåligt klubben faktiskt presterar i verkligheten, resten av sin existens. Det är därför "Heros topp fyra säsong 1" inte betyder att Heros faktiskt spelade en bra säsong — klubben hade `bestFinish=4` innan bollen ens rullade.

**Detta är en TREDJE, tidigare okänd konsument av samma alfabetisk-nollpoäng-artefakt** (första: Grind1-skriptens felaktiga läsning efter säsongsslut-överskrivning; andra: `cupProcessor.ts:49`s cupbye-text, redan i BACKLOG:s "TVÅ LÄSARE, EN SANNING"-tabell). Ett mönster, tredje gången, inte en enskild incident.

**Konsekvens, inte bara för Heros:** eftersom ALLA tolv klubbar får sin `bestFinish` förorenad vid runda 1 av sin allra första säsong, och den alfabetiska tie-break-positionen är GODTYCKLIG mot klubbnamn — betyder det att `fotfaste`-eran (`bestFinish<=6`) och `establishment`-eran (`bestFinish<=10` + cs≥50) sannolikt nås mycket LÄTTARE, av NÄSTAN ALLA klubbar, än vad systemet är avsett att mäta — och delvis efter ALFABETISK ORDNING, inte prestation. En klubb som råkar heta något tidigt i alfabetet (Forsbacka, Gagnef, Hälleforsnäs/Heros) startar med ett bättre `bestFinish`-golv än en klubb sent i alfabetet (Västanfors, Söderfors, Slottsbron, Skutskär) — helt oavsett faktisk styrka.

**Inte fixat, som beställt ("innan något ändras").** Trolig fix (för senare beslut): gata `pos < arc.bestFinish`-uppdateringen bakom `played > 0`, eller läs bara `pos` vid ett facit-tillfälle (säsongsslut, före nästa säsongs tabellöverskrivning) istf varje omgång. Kräver ett medvetet beslut om `bestFinish` ska mäta "bästa LIVE-position när som helst" (nuvarande, oavsiktligt) eller "bästa SLUTPLACERING" (vad namnet och era-trösklarna implicit antar).

## 2. Preview-mönstret — art eller instans? Fyra ytor kontrollerade

| Yta | Duplicerar en produktionsformel med andra indata? | Dom |
|---|---|---|
| **MatchScreen — publikförhandsvisning** (redan rapporterat) | JA — `calcAttendance()` anropas två gånger till (Sätt Laget-kortet, live-matchstart) och utelämnar `communityStanding`/`isDerby`(hårdkodad false)/`fixtureMonth` jämfört med matchSimProcessor.ts:s auktoritativa anrop | **Bekräftad instans** |
| **EkonomiTab — veckointäktsestimat** | JA — anropar SAMMA `calcRoundIncome()` som `economyProcessor.ts` (den riktiga mutationen), men med `isHomeMatch: true` HÅRDKODAT (oavsett om nästa match faktiskt är hemma eller borta), `rand: () => 0.5` (rimligt för ett estimat), och `communityStanding`/`journalistAttendanceModifier`/`weatherAttendanceModifier`/`isFirstRound` alla UTELÄMNADE (faller till defaults) | **Bekräftad instans** — spelaren ser "veckointäkt" som om varje vecka vore en hemmamatch med cs=50, oavsett faktiskt schema |
| Taktikrekommendationen | NEJ — `suggestedMentality`/`suggestedPress` är RÅDGIVANDE (assistentens förslag), inte en förhandsberäkning av ett tal matchen sedan räknar om. Spelarens FAKTISKA val (oavsett om rådet följs) är det som simuleras — inget dubbelspår att divergera mot | Kontrollerad, inte samma buggklass |
| Motståndaranalysen (`generateDetailedAnalysis`) | NEJ — kvalitativ styrke-/svaghetstext (positionssnitt jämfört mot lagsnitt), ingen enskild siffra som en senare formel räknar om annorlunda | Kontrollerad, inte samma buggklass |

**Slutsats: det ÄR en art, två bekräftade instanser (MatchScreen, EkonomiTab), samma rotorsak-form** (en display-yta återanvänder en produktionsformel men med ofullständiga/hårdkodade indata istf de VERKLIGA kommande matchens/rundans data). Två kontrollerade ytor visade sig vara en annan sorts yta (rådgivning/kvalitativ text), inte samma buggklass — flaggat men inte falskt inkluderat.

**Inte fixat än (`Fixa — samma funktion, samma indata` väntar på att inkludera BÅDA bekräftade instanserna, inte bara MatchScreen).** Rekommenderad ansats för nästa runda: en delad "byggAttendanceParams(game, fixture)"-hjälpfunktion för MatchScreen/matchSimProcessor (eliminerar duplicerad härledning strukturellt), och för EkonomiTab: antingen läs den FAKTISKA nästa hemmamatchen (om ingen finns, visa "ingen hemmamatch denna vecka" istf en påhittad "typisk" siffra), eller märk tydligt att det är ett genomsnitts-estimat, inte en prognos för just nästa runda.

## 3. Mecenat/patron-frekvens över tio säsonger — kandidatramperna mätta

`scripts/mecenat-patron-frekvens-matning-2026-08-26.ts`, 2000 oberoende körningar per cs-nivå. Kandidatramper: mecenat 1%→15% (tak vid cs=65), patron 2%→8% (tak vid cs=60), båda per KVALIFICERANDE OMGÅNG (mecenat: 13 omgångar/säsong, rond 6-18; patron: 22 omgångar/säsong).

| cs | Mecenat: antal anlända/10 säsonger | Patron: fick minst en inom 10 säsonger |
|---|---|---|
| 40 | 1,00 (taket vid cs40 är 1) — 0% fick noll | 100% — medel-ankomst säsong 1,3 |
| 60 | 1,00 (taket förblir 1 under cs70) — 0% fick noll | 100% — medel-ankomst säsong 1,2 |
| 80 | 2,00 (taket är 2) — 0% fick noll | 100% — medel-ankomst säsong 1,2 |
| 100 | 3,00 (taket är 3) — 0% fick noll | 100% — medel-ankomst säsong 1,2 |

**Det viktigaste fyndet är inte tabellen — det är att tabellen är nästan PLATT.** Vid VARJE testad cs-nivå fyller mecenat-antalet exakt sitt (diskreta) tak, och patronen anländer så gott som alltid inom säsong 1-2. **Anledningen: en sannolikhet på bara 1-2% per omgång, upprepad 130-220 gånger över tio säsonger, blir i praktiken en säkerhet** (1 − 0,99^130 ≈ 73% risk att ALDRIG missa — och det är GOLVET, inte taket). Med så många försök spelar det nästan ingen roll om chansen är 1% eller 15% — resultatet konvergerar mot "får det förr eller senare" oavsett cs. **communityStanding blir därmed INTE den kännbara spak Jacobs beslut (2026-08-25) avsåg** — den avgör i praktiken bara TAKET (för mecenat) och lite HUR SNABBT (för patron), inte OM.

Detta är INTE en kalibreringsfråga om exakt vilka procenttal (1%/15% mot t.ex. 0,1%/3%) — så länge modellen är "rulla tärning varje kvalificerande omgång", kommer UPPREPNINGEN över en hel karriär att jämna ut skillnaden mellan cs-nivåer. En sannolikhet som ska KÄNNAS som en spak över en hel karriär behöver antingen (a) vara mycket lägre generellt (så att även taket-cs inte konvergerar mot 100% inom rimlig tid), eller (b) inte vara en per-omgång-rullning alls — t.ex. en engångs-slump per SÄSONG istf per omgång (13-22× färre försök), eller ett tröskelvärde på ANTAL FÖRSÖK innan chansen ens börjar rulla. Rapporterat, inget byggt — nästa steg är ditt beslut om modellform, inte bara tal.

## 4. Kan en mecenat/patron LÄMNA när communityStanding faller?

**Nej — bekräftat kodläst, för BÅDA systemen. Relationen är enkelriktad.**

- **Mecenat:** avhopp triggas ENBART av `mec.happiness < 20 && mec.demands.length >= 3` (`eventProcessor.ts:254`). `mec.happiness` sätts vid skapande (60+slump) och ändras BARA av namngivna narrativa val (krisvalet `ask_mecenat` ger −30, middagsvalen ±1/−3) — grep efter alla happiness-skrivningar i mecenatrelaterad kod gav noll träffar på communityStanding som faktor.
- **Patron:** avhopp triggas av `patron.happiness` som når 0 (`eventResolver.ts:607-617`). ALLA tolv `patronHappiness`-effektspår kommer från namngivna patronEvents.ts-valträd (fasta belopp +3 till +30, −5 till −50) — samma sak, noll koppling till communityStanding.

**Konsekvensen är exakt den Jacob beskrev: orten blir en spärr man passerar EN gång, inte en relation som kan förfalla.** En klubb kan tappa communityStanding katastrofalt EFTER att ha fått en mecenat/patron utan att det någonsin syns i den relationen — mecenaten/patronen bryr sig bara om sina egna narrativa krav, inte om huruvida orten fortfarande står bakom klubben. Rapporterat, inget byggt — om detta ska ändras är det ett tredje spår (utöver ankomst-sannolikheten och era-trösklarna) i samma mecenat/patron-runda: en löpande, mindre happiness-drift kopplad till communityStanding (spegla `computeAttendanceRate`s mean-reversion-mönster, redan etablerat på andra håll i ekonomin) skulle göra relationen dubbelriktad.
