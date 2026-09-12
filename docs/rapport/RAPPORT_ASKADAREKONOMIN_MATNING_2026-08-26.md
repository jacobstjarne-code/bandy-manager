# Rapport: Åskådarekonomin — kandidatmätning, alla tolv, en kastad kurva

2026-08-26. "Kör med kandidatvärden, rapportera totalintäkt per klubb och tier före/efter." Kört. Kandidaten höll inte — kastad, koden är tillbaka på den gamla moodMult-formeln. Detta är alltså en NEJ-rapport med data, inte en JA-leverans.

## Metod

En riktig säsong per klubb (samma headless-harness som `h4-alla-tolv-avskedsfrekvens.ts`, standardkörning, seed=90000, communityStanding orört). Varje hemmamatchs FAKTISKA publiksiffra (`fixture.attendance`, samma `calcAttendance()`-väg matchSimProcessor riktigt använder) sparades. För tre tiers (inget / basic+ingen VIP / upgraded+VIP) räknades GAMLA formeln (moodMult) och kandidat-formeln (kronor/huvud + golv) ut mot SAMMA publiksiffror — så jämförelsen isolerar formelbytet, inte olika slumpade säsonger. Script: `scripts/askadarekonomin-matning-2026-08-26.ts`.

Kandidaten som mättes: `kioskPerHead` 4,5 kr (basic) / 9 kr (upgraded), golv 700/1200 kr, VIP 9 kr/huvud + golv 1000 kr — kalibrerat mot en rep50-klubbs typiska publik (~275).

## Resultatet — kandidaten exploderar för starka klubbar

| Klubb | rep | snittpublik | Tier | Gammal | Ny | Δ |
|---|---|---|---|---|---|---|
| Forsbacka | 85 | 1859 | basic | 4 077 | 138 184 | **+134 107 (34×)** |
| Forsbacka | 85 | 1859 | upgraded+VIP | 19 407 | 535 806 | **+516 399 (27×)** |
| Karlsborg | 68 | 1143 | upgraded+VIP | 18 225 | 287 223 | +268 998 (16×) |
| Västanfors | 78 | 744 | upgraded+VIP | 19 633 | 164 949 | +145 316 (8×) |
| Söderfors | 55 | 435 | basic | 4 135 | 19 089 | +14 954 (5×) |

(Fullständig tabell, alla tolv, i skriptets output — arkiverad i denna rapports källkontroll, inte klistrad här i sin helhet.)

**Rotorsak:** en FLAT kronor/huvud-kurva över ett attendance-spann på >10× (Heros ~172, Forsbacka ~1859) skalar kiosk-intäkten proportionellt mot spannet — kalibrerad mot en MEDELklubb (rep50, ~275), men linjärt extrapolerad ända upp till 1859 ger en absurd summa. Det här är INTE en kalibreringsjustering (mindre kr/huvud) som löser det — vilket kr/huvud-tal som helst, applicerat linjärt över ett 10×-spann, ger ett 10×-liknande spann i utfallet. Kurvans FORM är fel, inte konstanterna.

**Kastat, inte levererat.** `economyService.ts`s kiosk/vipTent-block är tillbaka på den gamla moodMult-formeln (oförändrad sedan innan denna session). Lotteriets hemmabonus (×1,5 på försäljningsdelen vid hemmamatch, flat driftskostnad opåverkad) BEHÖLLS — den skalar inte med attendance alls, ingen explosionsrisk, redan verifierad säker.

**Förslag till nästa kandidat (inte byggt, väntar på din riktning):** en icke-linjär kurva — t.ex. `kr/huvud × attendance^0.6` eller en logaritmisk term — där marginalintäkten per ytterligare åskådare AVTAR i stället för att vara konstant. Det bevarar principen (fler åskådare → mer kiosk-intäkt, ingen platt flat-summa oavsett publik) utan att en 27× starkare klubb ger 27× kiosk-intäkt.

## De fyra under rep 55 — nedåtriktningen (Rögle, Slottsbron, Skutskär, Heros)

| Klubb | rep | Tier | Gammal | Ny | Δ |
|---|---|---|---|---|---|
| Rögle | 50 | basic | −558 | 12 552 | +13 110 |
| Rögle | 50 | upgraded+VIP | 6 383 | 38 916 | +32 533 |
| Slottsbron | 48 | basic | −86 | 7 958 | +8 044 |
| Slottsbron | 48 | upgraded+VIP | 7 953 | 19 605 | +11 652 |
| Skutskär | 52 | basic | 434 | 5 999 | +5 565 |
| Skutskär | 52 | upgraded+VIP | 8 996 | 11 775 | +2 779 |
| **Heros** | 45 | basic | −704 | 1 504 | +2 208 |
| **Heros** | 45 | **upgraded+VIP** | **5 472** | **−5 921** | **−11 393** |

Tre av fyra klubbar förbättras även i botten (golvet gör sitt jobb för dem). **Heros är undantaget**, och exakt det Jacobs varning förutsåg: vid upgraded+VIP blir Heros SÄMRE med kandidaten än med den gamla flata formeln — golvet (1200+1000=2200 kr/match som lägst) räcker inte mot den flata driftskostnaden (2500+2000=4500 kr/match) när Heros egen publik (~172) sällan lyfter över golvet. Den gamla formeln gav Heros samma genomsnittliga VIP-bonus (1250+medel 1250=2500) som alla andra klubbar, oavsett publik — paradoxalt "rättvisare" för en publik-fattig klubb än ett golv som ändå ligger under kostnaden. **Detta bekräftar att ett golv ensamt inte räcker för den svagaste klubben i den dyraste konfigurationen** — antingen måste golvet sättas högre än den flata kostnaden (vilket i praktiken gör hela tier:en till en garanterad förlustaffär för en publik-fattig klubb, kanske korrekt: "du har inte råd med VIP-tält än"), eller kostnaden själv bör skala ner för svaga klubbar (svårare att motivera realistiskt — hyra/personal).

## calcAttendance — tredje läsaren

**Kiosken (om den byggs): säker, verifierad genom konstruktion.** Den kastade kandidaten läste `matchAttendance` direkt från `economyProcessor.ts`s `managedHomeMatch?.attendance` — samma fält `matchSimProcessor.ts` skriver (`simulatedFixtures.push({ ...result.fixture, attendance, ... })`, rad ~473). Ingen ny beräkning, samma tal, per konstruktion — inte bara "borde stämma".

**MatchScreen.tsx — ett REDAN BEFINTLIGT, oberoende fynd (inte orsakat av dagens ändringar).** Läst kod för kod: MatchScreens TVÅ `calcAttendance()`-anrop (rad 199 "liveAttendance" inför matchstart, rad 496 "expectedAttendance" på Sätt Laget-kortet) SKILJER SIG från `matchSimProcessor.ts`s auktoritativa anrop på tre punkter:
1. `communityStanding` — helt utelämnad i båda MatchScreen-anropen (faller till `computeAttendanceRate`s default 50), medan matchSimProcessor skickar den RIKTIGA siffran för hanterade klubbens hemmamatcher.
2. `isDerby` — hårdkodad `false` i båda MatchScreen-anropen, medan matchSimProcessor slår upp en riktig rivalitet.
3. `fixtureMonth` (decemberbonus) — utelämnad i båda MatchScreen-anropen, finns i matchSimProcessor.

**Konsekvens:** spelaren kan idag se ETT förväntat publiktal på Sätt Laget-kortet och sedan få ett ANNAT, faktiskt tal registrerat efter matchen — särskilt märkbart för derbyn (ingen derby-boost visas i förhand) och decembermatcher. Detta är INTE nytt från dagens arbete — det fanns redan innan Åskådarekonomin rördes, och skulle ha funnits även utan kioskkandidaten. Rapporterat, inte fixat — en egen, avgränsad ändring (tre parametrar i två anropsställen), värd ett eget beslut om förhandsvisningen SKA vara identisk med facit eller får vara en enklare uppskattning.

## Sammanfattning

- Kiosk/VIP-kandidaten: KASTAD. Kurvformen (linjär kr/huvud) är fel, inte konstanterna — nästa kandidat behöver en avtagande marginalintäkt (t.ex. attendance^0,6).
- Lotteriets hemmabonus: BEHÅLLEN, säker, ingen explosionsrisk uppmätt.
- Fyra svaga klubbar: tre förbättras, Heros blir SÄMRE på den dyraste tiern — golvet mot flat kostnad är inte löst för den svagaste klubben.
- calcAttendance: kiosken (hade den byggts) hade läst rätt tal. MatchScreens FÖRHANDSVISNING läser fel tal redan idag, oberoende av detta arbete — eget fynd, egen åtgärd.
