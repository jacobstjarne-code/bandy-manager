# POST-LAUNCH — medvetet uppskjutet till efter mjuk release

**Startad 2026-09-07 (Opus + Jacob, beslutskö-passet).** Rader som är verkliga och
värda att göra, men medvetet uppskjutna till EFTER lansering — så MASTER_OPPET bara
bär det som är i spel nu, och den här listan skyddar idéerna utan att blåsa upp
release-räkningen. Flyttas hit från MASTER när beslutet "inte före release" fattas;
plockas härifrån när det finns luft efter mjuk release.

Regeln: en rad här har vad / varför-uppskjuten / underlag. Inget "senare utan skäl".

---

## Världens liv (AI-klubbarna över tid)

### varldsbilds-sektion (världsbildsfasen, pausad)
**Vad:** AI-klubbarnas liv över säsonger — hur de elva andra klubbarna rör sig,
rustar, stiger och faller över tid, så ligan känns levande och inte som en statisk
tabell. **Underlag:** `RAPPORT_LIGARORELSER_ELVA_KLUBBAR` (om filen återskapas — den
saknades vid flytten 2026-09-07, sök i git-historik/incoming). **Varför uppskjuten:**
en HEL fas, inte en rad — att återuppta den före release vore att öppna ett stort
nytt spår när arbetet ska stänga. Jacob: "viktigt att klubbarna får liv" — bevarad,
inte dödad. **När:** efter mjuk release, som ett eget fördjupningspass. Positionstrend
+ AI-transferlogg finns redan som byggda byggstenar (`getClubPositionTrend`,
`deriveBoardLeagueContext`) att bygga vidare på.

## Relationssystem

### mecenat-patron-cs-happiness
**Vad:** en kontinuerlig happiness-/drift-logik som läser `communityStanding`, så
mecenat/patron-relationen driver med orten över tid (inte bara ett binärt avhopp).
**Varför uppskjuten:** det katastrofala fallet är redan täckt — eviction-on-drop
finns (relationen bryts när CS faller under gränsen). En kontinuerlig drift är ett
helt nytt relationssystem för en subtil effekt spelaren knappt märker — polish, inte
release. **När:** post-launch, om relationsdjupet visar sig värt det i speltest.

### ai-tranarbyten-anlaggningar (världens liv, forts.)
**Vad:** AI-klubbarna byter tränare och bygger anläggningar över tid, så världen
förändras utan spelaren (Slottsbron bygger en hall, Heros byter tränare mellan
säsonger). **Varför uppskjuten:** samma spår som `varldsbilds-sektion` — AI-klubbarnas
liv över tid, en hel fas. En anläggnings-proxy prövades och avvisades som falsk siffra;
en äkta modell kräver världsbilds-fasen. **När:** post-launch, ihop med världsbilden.

## Landslag / press

### lobbypress-mekanik (LOBBY_PRESS som spelbar mekanik)
**Vad:** managern lobbar aktivt för att få en spelare uttagen i landslaget; `LOBBY_PRESS`-
texten (landslagText.ts) finns redan skriven. **Status nu:** nedgraderad till FLAVOUR
(Jacob 2026-09-07) — texten lever som en pressrad (journalisten nämner att managern
lobbar), ingen mekanik spelaren styr. **Post-launch-kandidaten:** den fulla lobby-
mekaniken (spelaren lägger en handling, påverkar uttagningssannolikheten) — texten är
redan skriven, det som saknas är spelvärlden bakom. **När:** post-launch om landslags-
djupet prioriteras. Ny spec behövs som definierar uttagningsmekaniken.

## Arkitektur / identitet

### c-o1sp1-kontextuella-sponsorer
**Vad:** skilj entitetens stabila id från dess rollmedlemskap, så en kontextuell
sponsor kan vara både sponsor och antagonist utan att låtsas vara en klubb eller
få en parallell identitet. **Underlag:**
`DOM_C_O1SP1_SPONSOR_NAMNRYMD_2026-09-08.md`. **Varför uppskjuten:** den riktiga
lösningen korsar sponsor-, rival- och liggarsubjektens namnrymder och har bred blast
radius; O1 behöver inte refaktorn före release. En eventuell framtida O1-genväg får
bara vara en riktad läsning av sponsorns befintliga stabila id, inte en ny
specialmodell. **När:** post-launch, som ett eget identitetsrefaktor-pass.
