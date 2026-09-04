# DOM — AKADEMIN I LIGGAREN: LÅN, MENTORSKAP, KULL OCH DE SOM FYLLER 20

**Datum:** 2026-09-04 · **Skrivet av:** Opus · **Grund:** GPT:s akademitest två säsonger (`incoming/SPELTEST_AKADEMI_2_SASONGER_2026-09-04.md`), Codex fixrapport (`incoming/FIXRAPPORT_AKADEMI_2026-09-04.md`), konsumentkartan, LESSONS #54 ("ny typ i unionen kräver namngiven konsument i samma spec"), `DOM_LIGGARE_CLUBID`.
**Bygger:** Code · **Text:** Opus (låst nedan) · **Jacob:** en kall (§4, junioren som fyller 20).

## Vad Codex lämnade och varför det är en dom, inte fem

Codex fixade det funktionella: utlånad spelare kan inte väljas, lån räknar faktiska tillfällen, mentorband överlever sommaren och behåller namn, readiness bevaras, arbetsplatsbeat max ett, årsbokens dubbletter borta. Kvar: junioren som fyller 20, ledgertyper för akademin, P19-kullen mot ungdomsintaget, attribution, ekonomin.

De fyra första är ett problem: **akademin skriver ingenting till liggaren**, så inget minns den — inte årsboken, inte Blodslinjen, inte Berättaren. GPT:s "vem blev bättre på grund av vad, vem försvann, vad gav investeringen" är exakt konsumentkartans fråga. Svaret är detsamma: producenter med namngivna konsumenter, i samma dom.

## 1. Nya liggartyper — var och en med sin konsument

| Typ | Skrivs när | Subject | Significance | Payload | Konsumenter (namngivna, LESSONS #54) |
|---|---|---|---|---|---|
| `academy_upgrade_started` | spelaren betalar uppgraderingen | klubben | 40 | `{ fromLevel, toLevel, costKr, readySeason }` | Krönikan (anläggning-familj), årsbokens ekonomirad (§5) |
| `academy_upgrade_completed` | sommaren nivån slår till | klubben | 55 | `{ level }` | Krönikan, årsbokens akademidel, Berättarens agenda |
| `mentorship_started` | mentor tilldelas | junioren (subject), mentorn (subject2) | 35 | `{ mentorId, juniorCaAtStart, developmentRateAtStart }` | Blodslinjen |
| `mentorship_ended` | relationen stängs | junioren, mentorn | 50 | `{ reason: 'graduated' \| 'promoted' \| 'aged_out' \| 'cancelled', juniorCaAtEnd, seasons }` | Blodslinjen (bandet blir historik med utfall), årsbokens akademidel, Berättaren |
| `loan_started` | lånet läggs | spelaren, låneklubben (subject2) | 30 | `{ toClubId, occasions, caAtStart }` | Krönikan (personer), Berättaren (låg vikt) |
| `loan_returned` | lånet slutförs | spelaren, låneklubben | 50 (65 om delta ≥ 5) | `{ caAtStart, caAtReturn, loanBonus, matches, goals, avgRating }` | **Attributionskortet** (§3), årsbokens akademidel, Krönikan, Berättaren |
| `youth_intake` | sommarens kull genereras (alla vägar) | klubben | 35 (+15 om topprospekt ≥ 4 stjärnor) | `{ count, topProspectId, topProspectStars, academyLevel, source: 'summer' \| 'school' \| 'partner' }` | årsbokens akademidel (ersätter `youthIntakeHistory`), Krönikan |
| `youth_aged_out` | junior fyller 20 utan uppflyttning | junioren | 45 (60 om ≥ 3 stjärnor) | `{ outcome: 'released' \| 'other_club', stars, caAtExit }` | inbox (avskedsrad), Krönikan (personer), årsbokens akademidel, Berättaren |

Alla åtta bär `clubId` (DOM_LIGGARE_CLUBID) och kind/familj enligt kartans §10: uppgradering → anläggning; övriga → personer. `mentorship_ended` med `graduated`/`promoted` = triumph; `youth_aged_out` = neutral (inte scar — det är livet, inte ett sår); `loan_returned` med delta ≥ 5 = triumph.

## 2. Ett schemafält till: `subjectSnapshot`

GPT:s rotorsak för Blodslinjen: "letar junioren i `game.players`, kastar annars hela posten". Samma sak drabbar callbacks för sålda spelare (Jari) och alla poster om personer som lämnat. **Dom:** `EventLedgerEntry` får `subjectSnapshot?: { name: string; position?: string; age?: number }`, fyllt av `logEvent` vid skrivtillfället för alla spelar-subjekt (och för subject2 om spelare). `resolveSubjectName` läser snapshot först, `game.players` som fallback. Bakåtkompatibelt (optional); backfill för gamla poster: från `game.players` där spelaren finns, annars lämnas tomt och vyn visar "en spelare" i stället för att kasta posten. Samma logik som `result`-fältet: rå sanning som annars går förlorad.

## 3. Attribution — det spelaren aldrig fick se

`loan_returned` bär `caAtStart`, `caAtReturn` och `loanBonus` (den diskreta CA-bonusen lånet gav, sparad vid retur — inte härledd). Träningens del = totalt − loanBonus. Det är ärligt: två tal motorn faktiskt vet.

**Attributionskortet** — en rad i Akademi-vyn vid retur och i årsboken:
- *{Namn} tillbaka från {Klubb}: {start}→{slut}. Lånet gav {loanBonus}, träningen resten.* (om loanBonus > 0)
- *{Namn} tillbaka från {Klubb}: {start}→{slut}. Lånet gav inget mätbart — matcherna gjorde han ändå.* (om loanBonus = 0 och matches > 0)
- *{Namn} tillbaka från {Klubb}. Ingen match, ingen utveckling. Fel lån.* (om matches = 0)

Mentorskap: `mentorship_ended` bär `developmentRateAtStart` (från started) och CA vid slut. Rad i Blodslinjen: *{Junior}, mentor {Mentor} {seasons} säsong(er): {caStart}→{caEnd}. {Utfall}.* där Utfall = "Uppflyttad." / "Klar för A-laget." / "Fyllde 20 utan plats." / "Bandet bröts."

Sommaren: årsbokens akademidel läser `youth_intake` + `loan_returned` + `mentorship_ended` + `youth_aged_out` + `academy_upgrade_completed` för säsongen och skriver högst tre rader, i den ordningen efter significance. Ingen ny prosa — raderna ovan är mallarna.

## 4. Junioren som fyller 20 — Jacobs kall, med Opus förslag

Idag: `.filter(p => p.age < 20)` och tystnad. GPT: "Gabriel Bengtsson, 19 år, tre stjärnor, försvann helt under sommaren utan avsked."

**Förslag (Opus):** två vägar, en per stjärnnivå.
- **≥ 3 stjärnor:** FÖRE sommaren, i säsongens sista omgångar, ett beslutskort (månadsnivå, inte måste): *"{Namn} fyller tjugo i sommar. Sista året i P19."* Val: **Flytta upp** (A-lagskontrakt, samma flöde som manuell uppflyttning) / **Släpp** (frisläppt, `youth_aged_out` outcome released). Kortet är det som gör att en topptalang inte kan försvinna ljudlöst — spelaren måste välja bort honom.
- **< 3 stjärnor:** ingen fråga; vid rollover `youth_aged_out` + en inboxrad. Att fråga om varje 19-åring skulle bli administration (taktiktestets kritik).

`other_club` som outcome: reserverat, produceras inte i v1 (skulle kräva att AI-klubbar plockar upp frisläppta — ett eget system). Säg det inte till spelaren.

**Text (låst):**
- Inbox, släppt utan kort: *{Namn} fyllde tjugo. Ingen plats i A-laget, inget kontrakt. Han tackade för {seasons} år och gick.*
- Inbox, släppt via kort: *{Namn} släppt. Tjugo år, {stars} stjärnor. Det var ditt val — och det kan ha varit rätt.*
- Beslutskortets rubrik: *{Namn} fyller tjugo* · body: *Sista året i P19 är slut. Antingen får han ett kontrakt, eller så får han gå. Ingen tredje väg.* · val: *Flytta upp* / *Släpp*
- Krönikan (`youth_aged_out`): *{Namn}, {stars} stjärnor, lämnade akademin vid tjugo.*

Jacobs kall: tröskeln (3 stjärnor) och om kortet ska finnas alls. Opus rek: ja, för det är den enda punkt där akademins värde blir ett *val* och inte en siffra.

## 5. Ekonomin — kalibrering, inte dom

GPT: 340→60→−258 tkr med Satsning (5 tkr/omg) + sponsorer + mecenat, och årsboken visade bara totalen. Två saker:
- **Årsbokens ekonomirad bryter ut akademin**: startkostnad (ur `academy_upgrade_started.costKr`), årets drift (nivå × omgångar), årets mätbara utfall (antal uppflyttade, bästa U21, lånedelta-summa). En rad: *Akademin: {start} + {drift} tkr. Gav {N} uppflyttade och {M} i utveckling.* Text låst.
- **Tvåsäsongssolvens** → kalibreringsrundan D: Satsning + normala beslut ska antingen vara solvent eller utlösa den kritiska ekonomivägen synligt före djup negativ kassa. Mäts, inte döms. Rad i DOM_KALIBRERING D.

## 6. P19-kullen och ungdomsintaget — en väg

`carryOverYouthTeam` genererar sommarens kull direkt; `youthIntakeHistory` skrivs bara av andra vägar; årsboken läser bara historiken. **Dom:** alla vägar skriver `youth_intake` (§1) med `source`; årsboken läser liggaren; `youthIntakeHistory` retireras retire-last när årsboken bytt källa. En kull är en kull oavsett hur den kom.

## 7. Ordning (Code)

1. `subjectSnapshot` på schemat + `logEvent` fyller det (§2) — grunden, litet.
2. De åtta typerna med producenter (§1) och kind/familj i kartans tabell.
3. `youth_intake` från alla vägar; årsbokens akademidel läser liggaren (§6).
4. `loan_returned` med attribution-payload + attributionskortet (§3).
5. `mentorship_*` + Blodslinjen läser dem (namn ur snapshot).
6. `youth_aged_out` + inbox + beslutskortet för ≥ 3 stjärnor (§4) — efter Jacobs kall.
7. Årsbokens ekonomirad (§5).
8. Tester per GPT:s regressionssvit punkt 4–9 (age-out, mentor över sommaren, Blodslinje med snapshot, readiness, kull, attribution).

## Godkänt när

GPT kör akademitestet igen: Gabriel-fallet ger ett kort eller ett avsked; Torstens 43→54 får sitt "varav"; Arvids mentorband står i Blodslinjen efter två säsonger; kullen finns i årsboken; akademins kostnad står för sig. Och Berättaren kan säga "spelaren du släppte vid tjugo" om det någon gång blir en callback.
