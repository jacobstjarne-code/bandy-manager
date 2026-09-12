# SPEC — O1-kandidater 2–4/4: anläggningen, ungdomen, supporterbrevet

**Datum:** 2026-09-09 · **Av:** Opus · **Beställd av:** Jacob (bygg O1-kandidaterna) · **Grund:** `O1_SPONSORN_FORST_2026-08-22` + `DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17` (mallen), `GameEvent.ts` (EventEffect-typerna), community-/academy-/supporter-/politician-systemen. Fullföljer O1-passet — kandidat 1 (mecenatens krav) i `docs/spec/SPEC_O1_MECENATENS_KRAV_2026-09-09.md`. Förhandstexter följer O12-kontraktet (kvalitativ riktning, exakta pengar tillåtna, ingen exakt icke-penga-siffra).

---

## 2/4 — Anläggningen som kostar orten (4,5/5)

**Kärna:** en anläggnings-utbyggnad som lyfter klubben men river något orten håller kärt — bygden får bära den.

**Mall:** (1) namngiven institution: kommunen, levererad av en namngiven politiker {politician} ✅ · (2) träffar en funktionär spelaren mött: {politician} (politicianEvents har stabila namn) ✅ · (3) tal: utbyggnadens kostnad i kr ✅ · (4) två system: anläggning/ekonomi + communityStanding ✅ · (5) pekar isär: sportslig kapacitet vs ortens goodwill ✅. → 5/5 om {politician} bär den; `systemhandelse: true`.

**Trigger:** en tillgänglig anläggnings-utbyggnad vars mark/plats orten värnar (en grusplan, ett gammalt klubbhus, en samlingspunkt). Fyrar sällan (kräver rätt utbyggnadsläge + aktiv kommunrelation).

**Val A — "Bygg ut":** `facilitiesUpgrade` (klubben lyfter) + `communityStanding` −X (orten tar illa vid sig). Kostar också pengar (exakt kr, känt). Utfallsinbox.
**Val B — "Låt det vara":** `noOp`. Utbyggnaden uteblir, CS intakt. Utfallsinbox.

**Text (låst):**
- **Rubrik:** {politician} har ett papper åt dig
- **Brödtext:** Kommunen säger ja — ni får bygga ut, om ni vill. Men platsen är {plats}, och den betyder något för folk här. {politician} lägger papperet på bordet utan att säga vad du ska göra. Klubben skulle vinna på det. Orten skulle minnas det.
- **Val A:** Bygg ut · undertext: orten kyler
- **Val B:** Låt det vara · undertext: (ingen — ett symmetriskt avstående, all-outline enligt beslutskorts-domen)
- **Utfall A:** Grävskoporna kommer. Klubben får sitt, och {plats} blir en parkeringsyta. Ingen säger så mycket — men de säger det till varandra.
- **Utfall B:** {plats} står kvar. Utbyggnaden blir inte av, och orten noterar tyst att du valde dem.

---

## 3/4 — Ungdomen som kan brännas (5/5)

**Kärna:** en juniortalang du kan kasta in för tidigt — kortsiktig hjälp nu mot risken att bränna utvecklingen.

**Mall:** (1) namngiven: junioren {youth} ✅ · (2) träffar en spelare spelaren mött: {youth} ur akademin ✅ · (3) tal: {youth}s ålder/potential ✅ · (4) två system: trupp/resultat + spelarutveckling (`developmentRateDelta`) ✅ · (5) pekar isär: vinn nu vs skydda talangen ✅. → 5/5; `systemhandelse: true`.

**Trigger:** en högpotential-junior (`youthTeam`, hög potential, låg ålder) finns OCH laget står i ett pressat läge (skadeläge/tunn trupp/viktig match). Samma "early"-logik som `promoteYouthPlayer` redan bär.

**Val A — "Kasta in honom":** {youth} spelar nu (en kortsiktig lyft) MEN `developmentRateDelta` −X (bränd — pressen tidigt kostar mognaden). Utfallsinbox.
**Val B — "Låt honom mogna":** {youth} hålls kvar, utvecklingen intakt, ingen lyft nu. Utfallsinbox.

**Text (låst):**
- **Rubrik:** {youth} är redo. Nästan.
- **Brödtext:** Sjuttonåringen tränar med de stora nu, och han håller. Akademitränaren säger att ett år till hade varit rätt — men laget behöver honom i helgen, och han vill inget hellre. Du kan kasta in honom. Frågan är vad det kostar honom sen.
- **Val A:** Kasta in honom · undertext: riskerar {youth}s utveckling
- **Val B:** Låt honom mogna · undertext: (ingen — symmetriskt tålamod, all-outline)
- **Utfall A:** {youth} spelar, och han duger. Men något i kurvan planar ut — han fick bära för mycket för tidigt, och det syns om ett par år.
- **Utfall B:** {youth} får vänta. Han gnisslar lite, men akademitränaren nickar. Talangen är kvar, hel.

---

## 4/4 — Supporterbrevet (5/5)

**Kärna:** klacken skriver ett brev med en önskan — behåll en favorit, sänk biljettpriset, en tradition tillbaka. Ge dem det (kostar pengar/trupp) eller håll fast (kostar deras humör).

**Mall:** (1) namngiven institution: klacken, via {klackledare} (klacken har en `VoiceId`) ✅ · (2) träffar en funktionär spelaren mött: {klackledare} ✅ · (3) tal: kostnaden (biljettsänkningen i kr, eller favoritens lön) ✅ · (4) två system: ekonomi + supporterMood/communityStanding ✅ · (5) pekar isär: klackens vilja vs kassan ✅. → 5/5; `systemhandelse: true`.

**Trigger:** supporterMood vid en tröskel OCH ett passande ärende (en klackfavorit vars kontrakt är på väg ut, eller ett biljettprisläge). Fyrar sällan.

**Val A — "Ge dem det":** t.ex. sänk biljettpriset (`finance` −X, exakt kr) ELLER behåll favoriten. `supporterMood` +Y. Utfallsinbox.
**Val B — "Håll fast":** `noOp` på pengar, `supporterMood` −Z (klacken tar det personligt). Utfallsinbox.

**Text (låst):**
- **Rubrik:** Ett brev från läktaren
- **Brödtext:** {klackledare} har skrivit för hand, på klackens vägnar. Ingen vrede, bara en önskan: {onskan}. De vet att det kostar. De skriver ändå, för de tror att du är en av dem. Nu får du visa om de har rätt.
- **Val A:** Ge dem det · undertext: värmer klacken
- **Val B:** Håll fast · undertext: grumlar stämningen
- **Utfall A:** {klackledare} läser beskedet högt vid nästa match. Läktaren sjunger lite högre den kvällen — du hörde dem, och de vet det.
- **Utfall B:** Brevet får inget svar de ville ha. Klacken säger inget rakt ut, men nästa hemmamatch är sången en aning tunnare.

---

## Ägarskap

Code: bygg de tre triggrarna + `build*Event`-funktionerna + eventResolver-grenarna mot de befintliga effekt-typerna (`facilitiesUpgrade`/`communityStanding`/`developmentRateDelta`/`finance`/`supporterMood`), utfallsinbox per kandidat, contentContract-rader. Kalibrera balanstalen (X/Y/Z). Ingen ny effekt-typ krävs. Opus: dessa specar + texten (låst). Jacob: byggbeslutet givet. Med detta är O1-passet 4/4 specat.
