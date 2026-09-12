# DOM — O12 §2: förhandsbeskrivning vs efterkvitto i EventChoice (textkontrakt)

**Datum:** 2026-09-09 · **Av:** Opus · **Beställd av:** Jacob (O12 nästa del) · **Grund:** `RAPPORT_O12_VALENTROPI_BROWSER_2026-09-09` Fynd 3, `GameEvent.ts` (`EventChoice.subtitle`, `getConsequenceLines`), `DecisionChoices.tsx`. Detta är O12:s andra del — textkontraktet Code sa måste vara fast före bygge. Punkt 1 (instanssann telemetri) är redan byggd (`06336d37`).

## Diagnosen (kodläst)

`EventChoice.subtitle` är EN delad sträng dokumenterad som "Consequence preview: 💛 +8 fanMood · ⭐ +3 reputation", och `DecisionChoices.tsx` renderar den ordagrant före klicket. Ett stort antal domän-subtitles bär exakta moral-, rykte-, relations-, ort- och stämningsdeltan. Det läcker exakta ICKE-penga-siffror före valet — direkt mot O12-domen (bara pengar exakt före).

Viktigt: D1:s `costLabel` + `consequenceLevel` sköter redan pengar korrekt — `costLabel` bär exakt kostnad ("Kostar 45 tkr"), och `neutral`/`positive` visar INGEN markör (facit-förbud). Det är alltså inte pengarna som läcker, det är `subtitle`:s exakta icke-penga-deltan. Fixen rör bara den axeln.

## Domen — dela kontraktet: kvalitativ FÖRE, exakt EFTER

**FÖRE valet (förhandsbeskrivning):** riktning + berörd person/system + exakt PENGA-belopp. ALDRIG en exakt icke-penga-siffra. Pengar exakta (kostnad via `costLabel`, inkomst får anges i kr). Alla andra resurser (moral, rykte, ort/CS, stämning/fanMood, journalist-, patron-, mecenat-, styrelse-, kommun-, domarrelation) uttrycks KVALITATIVT — riktning, inte tal.

**EFTER valet (utfallskvitto):** exakta tal för efterläget/historiken. De kommer ur den applicerade `EventEffect` (som redan bär `value`/`amount`/deltan) och visas i efterdyningen/liggaren/`followUpText` — aldrig i förhandstexten.

**Inte strängsanering.** Ingen regex som suddar siffror i renderingen — den skulle dölja pengar OCH lämna trasiga meningar. Subtitlarna skrivs om mot vokabulären nedan.

## Vokabulären (låst, Opus) — riktning per resurs

Code migrerar varje subtitle mot den här tabellen. Bandysvensk underdrift, ingen siffra:

- **fanMood / supporterMood (klackens stämning):** + "lyfter stämningen på läktaren" · − "grumlar stämningen"
- **reputation (rykte):** + "stärker klubbens rykte" · − "naggar ryktet"
- **communityStanding (orten):** + "orten värmer" · − "orten kyler"
- **morale / moraleDelta (spelarmoral):** + "lyfter {namn}" (eller "lyfter humöret i truppen") · − "riskerar missnöje hos {namn}"
- **journalistRelationship (pressen):** + "värmer pressen" · − "kyler pressen"
- **patronHappiness / patronInfluence:** + "gläder patronen" · − "prövar patronens tålamod"
- **mecenatHappiness:** + "gläder mecenaten" · − "sätter mecenaten på prov"
- **boardPatience (styrelsen):** + "lugnar styrelsen" · − "tär på styrelsens tålamod"
- **politicianRelationship (kommunen):** + "stärker banden till kommunen" · − "sätter kommunen på tvären"
- **refereeRelationship (domaren):** + "blidkar domaren" · − "reter domaren"

Regler för vokabulären:
- Riktning som standard, ingen siffra. En grov gradmarkör ("rejält", "påtagligt") får läggas till ENDAST för genuint stora/pivotala effekter, aldrig ett tal.
- Tysta effekter förblir tysta: `developmentRateDelta`/`disciplineDelta` är medvetna dolda motvikter (GameEvent.ts) — de ska INTE dyka upp i förhandstexten alls.
- Flera resurser i ett val: kedja med "·", samma som idag, fast kvalitativt ("lyfter stämningen · stärker ryktet").
- `costLabel` (pengar) står orörd — den är redan O12-korrekt.

## SKYDDAT / ägarskap

Pengar rörs inte (costLabel exakt, före och efter). D1:s `consequenceLevel`/`getConsequenceLines` rörs inte. Ingen ny facit-markör. Fältmekaniken (om `subtitle` byter roll till kvalitativ förhands-preview + ett separat exakt efter-fält, eller om efter-talen läses ur effekten/liggaren) är Codes, styrd av kontraktet ovan.

Ägare: Opus — denna dom + vokabulären (jag skriver om enskilda rader om Code flaggar en resurs vokabulären inte täcker). Code — dela fältet, migrera subtitlarna mot vokabulären (inte regex), flytta exakta tal till efter-läget, kör sedan om O12:s tre-save-prov. Jacob: beslutet att bygga O12 §2 givet.
