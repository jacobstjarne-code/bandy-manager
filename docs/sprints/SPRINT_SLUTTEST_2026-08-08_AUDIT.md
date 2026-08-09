# Sluttest inför begränsad release — audit (2026-08-08)

**Underlag:** `docs/CODE_INSTRUKTION_SLUTTEST_2026-08-08.md`

## Verifieringsmetod — läs detta först

Ingen browser/dev-server-tillgång i den här sessionen (VS Code-extension,
inte desktop-appen; `tool_search` efter playwright/browser/devtools/
screenshot gav noll träffar) och Vercel MCP saknar auth (kan inte deploya
en preview). Punkterna nedan som instruktionen själv flaggar som
"kräver ögon"/"verifiera i browsern" är därför **inte** visuellt
bekräftade — bara kodläst och, där det gick, kod-verifierat med riktiga
funktionsanrop (vite-node mot produktionskoden, inte mockat).

## Ordning följd: 1 → 2 → 4b → 3 → 7 → 5 (rapport) → 6 (rapport), 4c utredd separat.

---

## 0. Jacobs bord

`git push` — gjort i denna sessionens start (origin/main låg på `93ac162d`,
23 juli-koden, INGEN av Korrvända 2:s fyra commits var pushade). Pushat i
två steg: de fyra Korrvända2-commitsen (`93ac162d..e8669ad0`), sedan
Opus-fixarna (`e8669ad0..28cf226f`), sedan alla sluttest-fixar nedan
(`28cf226f..d6d56935`). `origin/main` är nu synkad med lokal HEAD.

Illustration-på-väg-beslutet: Jacobs, orört.

---

## 1. Build-hashen — KLAR, kod verifierad, INTE deploy-verifierad

`vite.config.ts` läser `process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7)` som
bas, git-anropet är lokal override. Logiken är korrekt: i Vercels
byggcontainer (ingen `.git`) vinner CI-hashen; lokalt (dev-server, `.git`
finns) vinner git-anropet. **Kunde INTE deploya en preview eller öppna en
URL** — Vercel MCP kräver autentisering jag inte har i den här sessionen.
Kan alltså inte rapportera hash + URL som instruktionen bad om. Behöver
antingen Jacob (Vercel-tillgång) eller en session med auth klar.

---

## 2. Cup: direktkval-gaten och "neutral plan" — KLAR

**Fil:** `NextMatchCard.tsx`. Commit `82a0e6eb`.

- `cupMatch` hissad till en delad beräkning (var tre separata lokala kopior
  i header/taggrad/förklaringsrad — tre chanser att glida isär).
- `isDirektkvalad`: `cupMatch?.round === 2 && isClubDirektkvalad(bracket, managedClubId)`
  — återanvänder `anslagService.ts`s redan exporterade `isClubDirektkvalad`
  (samma primitiv, `byeTeamIds`) istf en fjärde egen kopia av samma kontroll.
- `isCupFinalMatch`: `cupMatch?.round === 4` (samma konvention som
  `getCupRoundName`/`getCupRoundLabel`).
- Header-tagg + taggrad: "Neutral plan" bara vid `isCupFinalMatch`, annars
  `isHome ? 'HEMMA' : 'BORTA'` som övriga varianter.
- Förklaringsraden: ny final copy ordagrant kopierad, gated på `isDirektkvalad`.
- **Grepat:** `anslagService.ts`/`AnslagOverlay.tsx` jämför redan på samma
  sätt (`isClubDirektkvalad`/`firstRoundForClub`, M66e/PT-8) — alla tre nu
  konsekventa mot samma primitiv, inget att rätta där.

**Inte visuellt verifierat** (kvartsfinal/semifinal/final i browser).

---

## 4b. Styrelsemålens falska nolla — KLAR

**Filer:** `createNewGame.ts`, `seasonEndProcessor.ts`. Commit `484790b2`.

`evaluateObjective(obj, game)` körs en gång direkt efter
`generateBoardObjectives` i båda anroparna, `currentValue` skrivs in
därifrån. `checkInObjectives`-rytmen (omg 7/14/22) orörd.

**Verifierat (vite-node mot riktig `createNewGame`, seed 3, club_forsbacka):**
```
fanMood: 50
boardObjectives: [
  { id: 'growFinances', currentValue: 0,  targetValue: 100000 }  ← korrekt, deltamål
  { id: 'growFanbase',  currentValue: 50, targetValue: 70 }      ← var 0, nu sant
  { id: 'improveYouth', currentValue: 0,  targetValue: 1 }
]
```

**Rapport (instruktionens fråga):** samma widget (`BoardObjectivesList.tsx`
rad 78-81) renderar nivåmål och deltamål med identisk grammatik
("Framsteg X / Y"). Nu när siffrorna är sanna ser `50 / 70` (nivå) och
`0 / 100000` (delta, sant vid start) likadana ut trots att de mäter olika
saker. Ingen ändring gjord i widget-grammatiken — väntar på Jacobs dom.

---

## 3. Namnkapningen — resten KLAR (kod), INTE visuellt verifierad

**Filer:** `PitchLineupView.tsx`, `LineupFormationView.tsx`. Commit `3ebede8d`.

`slot.label.slice(0, 2).toUpperCase()` → `slot.label.toUpperCase()` i båda
(tomma slots visade "VY"/"HY" — identiskt med vad ytterforwards VF/HF
skulle kunna förväxlas med). Alla etiketter i `Formation.ts` är max tre
tecken. `fontSize` för tomma slots sänkt 9→8 i båda filerna så tre tecken
får plats i en 34-38px cirkel, per instruktionens egen siffra.

**Inte verifierat i browser** (Tillträdet → Sätt elvan, 390px) — ingen
browser i sessionen. Ingen skärmdump i denna audit av det skälet.

---

## 7. PORT 2:s rink-grep — KLAR

**Fil:** `CLAUDE.md`. Commit `d6d56935`.

Roten var värre än instruktionen antog: `grep -rni 'rink'` är en
substrängsmatchning — den fångade "rink" inuti "flexShrink" (dussintals
falska träffar per skärm som använder flexbox), inte bara `--ice-rink`-
tokennamnen. Fixat med ordgräns (`\brink\b`) + ett dokumenterat undantag
för `--ice-rink`/`--ice-rink-deep` (6 förekomster, 4 rader, BandyPitch.tsx
+ FormationView.tsx, pitchfärgs-beslutet 2026-06-19). Verifierat: kommandot
returnerar 0 träffar mot nuvarande `src/`.

---

## 5. Taktikskärmens motsägelse — REPORT ONLY, ingen kod byggd

**Fynd som ändrar vilken väg som är rätt:** `opponentAnalysisService.ts`
har REDAN, sedan 2026-07-07 ("Yta 3", Audit-syntes), en kanonisk
`recommendation`→`suggestedMentality: TacticMentality`-mappning
(`mapRecommendationToMentality`, rad 40-45) med utförlig dokumentation av
designbesluten (t.ex. "Balanced har MEDVETET ingen väg in"). Detta ÄR
redan "Option 1" — bara `TacticStep.tsx` (Tillträdet/matchdagens Sätt-
laget-flöde) blev aldrig migrerad till att läsa den. `TacticStep.tsx`
har sin EGEN, äldre, oberoende `recommendations`-beräkning byggd på
`recentForm`/`tablePosition`, medan `generateDetailedAnalysis`s
`recommendation`/`suggestedMentality` byggs på motståndarens
truppstyrka per position (fwdAvg/defAvg/midAvg). Två helt olika signaler
— det förklarar exakt den observerade motsägelsen (remsan sa defensivt,
raden nedanför sa "matchar" ett offensivt läge).

**Rekommendation: Option 1, men mindre diff än instruktionen antog** —
`suggestedMentality` finns redan, behöver bara läsas. Det som saknas är
en motsvarande `suggestedPress`. Föreslagen mappning (samma
`recommendation`-strängar `mapRecommendationToMentality` redan växlar på):
- "Pressa högt och dominera mitten." → press **high** (texten säger det rakt ut)
- "Spela offensivt — deras försvar är sårbart." → press **high** (utnyttja svagheten, samma parning TacticStep:s gamla logik redan gjorde för sina två offensiva grenar)
- "Prioritera defensiven — de har farliga forwards." → press **low**
- "Jämn motståndare..." → **undefined**, ingen påhittad rekommendation (samma princip som `suggestedMentality`s Balanced-icke-väg)

**Föreslagen diff (2 filer, under femfilsgränsen):**
1. `opponentAnalysisService.ts` — ny `mapRecommendationToPress`, `suggestedPress?: TacticPress` på `OpponentAnalysis`, satt i `generateDetailedAnalysis` bredvid `suggestedMentality`.
2. `TacticStep.tsx` — `recommendations.mentality`/`.press` läser `analysis.suggestedMentality`/`analysis.suggestedPress` istf sin egen `recentForm`/`tablePosition`-logik (som tas bort).

**Byggde INTE detta** — punkten är rapportera-först per instruktionen.
Väntar på Jacobs go innan jag rör `TacticStep.tsx`/`opponentAnalysisService.ts`.

---

## 6. Knottrig is på konstfrusen bana — REPORT ONLY, inga konstanter committade

Ny gren föreslagen (placeras efter Thaw+Moderate-grenen i
`weatherService.ts`, före LightSnow):
```ts
} else if (condition === WeatherCondition.Thaw && homeClub.hasArtificialIce) {
  // Konstfrusen bana blir vattensjuk i regn (SPEC_VADER.md §5) — mildare än
  // naturisens Poor/Moderate-grenar eftersom banan i grunden håller.
  ballControlPenalty = 5 + Math.round(rand() * 5)   // 5-10, jfr naturis Moderate 10-18
  speedModifier = 0.94                               // jfr naturis Moderate 0.88
}
```
Ingen `injuryRiskModifier`/`goalChanceModifier`/`attendanceModifier`
föreslagen — instruktionen bad bara om bollkontroll + lätt sänkt fart.

**Byggde INTE detta, körde ingen stress-test-loop** — punkten är
uttryckligen rapportera-först ("Föreslå konstanterna för mig innan du
committar"). Väntar på Jacobs dom om 5-10/0.94 känns för svagt eller för
starkt innan jag implementerar + kör `npm run stress` före/efter och
lägger målsnitt/hörnmål-siffrorna i en uppföljande audit.

---

## 4c. fanMood vs supporterGroup.mood — utredning, inget byggt

Svepte alla läsare av `game.fanMood` (11 filer) och `supporterGroup.mood`
(13 filer). **Ingen läcka hittad utöver den redan kända** (`growFanbase`):
de tre filer som läser BÅDA (`roundProcessor.ts`, `rippleEffectService.ts`,
`eventResolver.ts`) är centrala state-filer som legitimt hanterar båda
systemen som separata mekaniker — inte förväxling.

**Nyanserat fynd om `growFanbase` specifikt:** objektets FLAVOR-TEXT
("Publiken måste tillbaka. Vi behöver stämning på läktarna" —
`boardObjectiveService.ts:95`) pekar mot `fanMood` (8b, publik/åskådare) —
alltså MATCHAR mekaniken (`evaluateObjective` läser `game.fanMood`).
Det är bara den TERSA ETIKETTEN ("Klackens humör ska nå 70",
`boardObjectiveService.ts:94`) som använder klack-specifikt språk för
ett mått som mekaniskt och i sin egen flavour-text handlar om den
bredare publiken. Min läsning: bugen sitter troligen i ETIKETTEN
("Klackens" → borde vara "Publikens" eller liknande), inte i mätaren.
Ingen annan UI-yta som läser `fanMood` använder klack-specifikt språk i
sin label (kollat `EkonomiTab.tsx`/`EkonomiSecondary.tsx`/`MatchScreen.tsx`).

**Byggde inget** — Jacob avgör etikett vs mätare, per instruktionen.

---

## Kvalitetsportar

```
npx tsc --noEmit                    → rent
npm test -- --run                   → 1399/1399 gröna
npm run build                       → grönt, lint:design-guard ✓
npm run lint:text-guard             → grönt
npm run lint:design                 → grönt
```

## Commits (kronologisk)
`cbd76a8a` (Opus, __GIT_HASH__) · `152c47d2` (Opus, namn-slices) ·
`28cf226f` (Opus, formatMoney) · `82a0e6eb` (punkt 2) · `484790b2`
(punkt 4b) · `3ebede8d` (punkt 3) · `d6d56935` (punkt 7). Alla pushade.

## Ej levererat (med orsak)

- **Punkt 1** — kan inte deploya/verifiera preview-URL (Vercel MCP saknar auth).
- **Punkt 3** — kod klar, inte visuellt verifierad på 390px (ingen browser).
- **Punkt 4c** — utredd, ingen ytterligare läcka hittad, rapporterad
  nyansering av var bugen troligen sitter (etikett, inte mätare) — Jacob avgör.
- **Innan något markeras klart-kravet** (browser-verifiering, tre frågor,
  "vad SÅG du") — kunde inte uppfyllas i den här sessionen. Samma
  begränsning gäller hela sessionen, inte punktvis.

---

## UPPFÖLJNING (samma dag) — Jacobs domar på punkterna ovan, byggda

### 2 (rättad igen). Cup: neutral plan missade semifinalen

Min egen `82a0e6eb`-fix (`isCupFinalMatch = cupMatch?.round === 4`) var
fortfarande fel — Jacob playtestade och rapporterade rotorsaken exakt:
`cupService.ts`s `generateNextCupRound` sätter `isCupFinalWeekend =
nextRound >= 3`, alltså BÅDE semifinal (rond 3) OCH final (rond 4) spelas
på `CUP_FINAL_VENUE` (Sävstaås IP, Bollnäs) och får `isCupFinalhelgen:
true` på fixturen. En rond-gräns kan aldrig fånga det — bara fixturens
egen flagga kan. **Fil:** `NextMatchCard.tsx`. Commit `ebfb0e0c`.
```ts
const isCupFinalMatch = nextFixture.isCupFinalhelgen === true
```

**Spårat parallellt (rapport, inte byggt):** matchmotorn ger FULL
hemmafördel på cupens semi/final trots att båda spelas på neutral plan.
`matchCore.ts:492` (`effectiveHomeAdvantage = fixture.isNeutralVenue ? 0 :
...`) och samtliga 4+ ställen som bygger matchinput
(`useMatchGenerator.ts:62,127`, `MatchLiveScreen.tsx:241,674,1087,1169`)
kollar bara `isNeutralVenue` — ett fält `playoffService.ts` ENDAST sätter
för SM-finalen. `isCupFinalhelgen` används extensivt i `matchCore.ts` för
att VÄLJA KOMMENTARSTEXT (rad ~1413-1892) men aldrig för
hemmafördelsberäkningen. Text säger "neutral plan", motorn räknar hemma-
fördel som vanligt. Rör inte `matchCore.ts`/`cupService.ts` i den här
commiten — kalibrerad kod, större ändring än en kortfix. Jacobs bord.

### 4b uppföljning. Samma enhet på båda sidor av snedstrecket

`BoardObjectivesList.tsx` renderade `formatMoney(currentValue)` och
`formatMoney(targetValue)` var för sig — varje anrop väljer kr/tkr/mkr
oberoende av det andra talet, så tidigt i säsongen (`growFinances`,
`currentValue=0`) blev det `0 kr / 100 tkr` på samma rad. Ny
`formatMoneyPair(current, target)` väljer EN enhet på `Math.max(|current|,
|target|)` och formaterar båda talen i den. Verifierat (vite-node):
`formatMoneyPair(0, 100000)` → `['0 tkr', '100 tkr']`,
`formatMoneyPair(1200000, 1500000)` → `['1.2 mkr', '1.5 mkr']`.
**Filer:** `BoardObjectivesList.tsx`, `boardObjectiveService.ts`. Commit
`d82b02a3`.

**Löst tråd, inte rapporterad tidigare, inte åtgärdad:** samma fils
`progressPct`-formel (`(currentValue/targetValue)*100`) är bakvänd för
"lägre är bättre"-mål (`topHalf`, target 6 = "plats 6 eller bättre" men
`currentValue` är själva placeringen; `reduceInjuries`, target 5 = "max 5
skador"). Ett lag på plats 9 (misslyckas "topp 6") räknar `(9/6)*100=150%`,
klipps till en FULL progressbar — visar övererövring fast målet faktiskt
missas. Upptäckt vid denna utredning, ligger utanför vad som begärdes den
här rundan. Flaggas för Jacob, inte fixat.

### 4c uppföljning. Etiketten rättad

`growFanbase`s etikett ändrad från "Klackens humör ska nå 70" till
ordagrant **"Publikens humör ska nå 70"** (Jacobs dom, kopierad exakt).
Ratificerar min tidigare läsning: mekaniken (`fanMood`) och flavour-
texten pekade redan rätt, bara den tersa etiketten använde fel term.
**Fil:** `boardObjectiveService.ts`. Commit `d82b02a3`.

### 5. Taktikskärmens motsägelse — BYGGD

Exakt enligt egen föreslagen väg i rapporten ovan (Option 1, återanvänd
Yta 3-infrastrukturen). Ny `mapRecommendationToPress` i
`opponentAnalysisService.ts`, spegling av `mapRecommendationToMentality`
— samma tre riktade recommendation-strängar, "Jämn motståndare" ger
avsiktligt `undefined`. `suggestedPress?: TacticPress` på
`OpponentAnalysis`, satt i `generateDetailedAnalysis` bredvid
`suggestedMentality`. `TacticStep.tsx`s egen, oberoende
`recentForm`/`tablePosition`-beräkning borttagen — läser nu
`analysis.suggestedMentality`/`.suggestedPress`, samma källa som den varma
remsans `recommendation`-text. En källa, ingen egen tolkning kvar i
komponenten. **Filer:** `opponentAnalysisService.ts` (3 filer totalt inkl.
test), `TacticStep.tsx`. 5 nya tester
(`opponentAnalysisService.test.ts`), 1399→1404 gröna. Commit `1a6454b7`.

### 6. Knottrig is på konstfrusen bana — BYGGD, stresstestad

Exakt de föreslagna konstanterna, ingen justering: ny gren i
`weatherService.ts`, `condition===Thaw && homeClub.hasArtificialIce` →
`ballControlPenalty = 5 + Math.round(rand()*5)` (5-10), `speedModifier =
0.94`. Placerad efter Thaw+Moderate, före LightSnow. Rot: `hasArtificialIce`
gav alltid `Excellent`/`Good` `iceQuality` (rad 57-58), så
Thaw+Poor/Thaw+Moderate — enda grenarna som satte effekt vid töväder —
triggade aldrig för de klubbarna. Regn gav noll mekanisk effekt på
konstfrusen bana innan denna fix.

**Texthake verifierad, ingen ny text/wiring behövdes:** `matchCore.ts`s
`weather_goal_thaw`/`weather_miss_thaw`/`iceDeterioration_thaw`-pooler
(rad 1489, 1557, 1567, 1660, 1667) triggar redan på
`weather.condition===Thaw`, oberoende av `iceQuality`. Texten
("vattenpöl", "slushig is", "slasket") är generisk nog att passa
konstfrusen bana med ytvatten också — ingen klubbtypsspecifik formulering
som skulle bli fel.

**Stresstest 10 seeds × 5 säsonger (7312 matcher), före/efter:**
```
                     FÖRE     EFTER    mål (bandygrytan)
goalsPerMatch        9.19     9.19     9.12 ±1.5   ✅
cornerGoalPct        22.7%    22.7%    22.2% ±3    ✅
homeWinPct            49.5%    49.5%    50.2% ±5   ✅
```
Oförändrat på säsongsnivå — effekten träffar en smal delmängd matcher
(konstfrusna klubbar × töväder), ingen mätbar förskjutning av
kalibreringen. 0 crascher, 0 invariant-brott båda körningarna.
**Fil:** `weatherService.ts`. Commit `26a7068d`.

### Kvalitetsportar (uppföljningsrundan)
```
npx tsc --noEmit                    → rent
npx vitest run                      → 1404/1404 gröna
npm run build                       → grönt, lint:design-guard ✓
npm run lint:text-guard             → grönt
npm run lint:design                 → grönt
```

### Commits (uppföljning, kronologisk)
`ebfb0e0c` (punkt 2, rättad igen) · `d82b02a3` (punkt 4b/4c) ·
`1a6454b7` (punkt 5) · `26a7068d` (punkt 6). Pushade till origin/main.

### Kvar overifierat — Jacobs egen anteckning, inte löst av mig

Jacob försökte själv verifiera två saker och konstaterar att båda kräver
en riktig telefon: (1) **tomma lineup-slots efter etikettfixen** (punkt
3) — han fyllde elvan direkt och fick aldrig upp ett tomt slot att
kontrollera; (2) **riktig 390px-viewport** — fönsterresizen i hans miljö
slog inte igenom (`innerWidth` stod kvar på 1440), och appen kapar själv
vid 430px så en 375px-mätning blir en proxy, inte det verkliga svaret.
Jag har ingen browser eller enhet i den här sessionen heller (samma
begränsning som resten av auditen, se "Verifieringsmetod" överst) — kan
inte utföra den verifieringen åt honom. Kvarstår som ett öppet, ägar-löst
verifieringssteg tills någon har appen öppen på en faktisk telefon.

---

## RUNDA 3 (samma dag) — `CODE_INSTRUKTION_SLUTTEST_RUNDA3_2026-08-08.md`

Opus playtestade produktionsbygget `5a955a8` skarpt i browser (avregistrerad
service worker, tömd localStorage) — bekräftade att hashen, styrelsemålens
enheter/etikett, direktkval-gaten och neutral plan på finalhelgen håller i
produktion. Fem punkter, plus två interimsfixar Opus lämnade i working tree
för Code att verifiera och committa.

### 0. Opus interimsfixar — verifierade, en bugg fångad innan commit

`cupService.ts`: `isNeutralVenue: true` tillagd i finalhelgens spread
(samma rotorsak som punkt 1 nedan). tsc + build oförändrat.

`BoardObjectivesList.tsx`: `computeProgressPct`-interimsfix (binär 100/0
för topHalf/reduceInjuries). **Verifiering fångade en bugg innan commit:**
villkoret krävde `currentValue > 0`, vilket gav TOM stapel för
`reduceInjuries` vid `currentValue=0` (noll skador — bästa möjliga utfall,
ett uppfyllt mål). Rättat till `currentValue <= targetValue`. Ofarligt i
dagens enda renderväg (BoardObjectivesList filtrerar bort `status==='met'`
innan render) men fel i sig — fixat innan commit, inte efteråt.
**Commit:** `eaf8cdfd`.

### 1. Hemmafördel på neutral plan — VERIFIERAD med nytt test

Nytt statistiskt test, `neutralVenueHomeAdvantage.test.ts` (3 tester,
N=800 jämnstarka matcher per test, fasta seeds — deterministiskt, inte
flakigt):
- Cupsemifinal (`isCupFinalhelgen`, `isNeutralVenue=true`, rond 3): hemma-
  vinstandel 42–58%-bandet, målsnittet symmetriskt (<8% skevhet).
- Samma lag på en vanlig ligamatch (`isNeutralVenue` ej satt): hemma-
  vinstandel >51% — bekräftar att testet faktiskt mäter något (kalibrerad
  `homeAdvantage=0.14` syns när flaggan INTE är satt).
- SM-finalen (`isFinaldag`, `isNeutralVenue=true` — samma flagga
  `playoffService.ts` alltid satt): samma 42–58%-band, oförändrat beteende.

Om mekanismen går sönder igen fångar detta testet det vid `tsc`/CI, inte
vid nästa playtest. **Fil:** `src/domain/services/__tests__/neutralVenueHomeAdvantage.test.ts`.
**Commit:** `ef225005`.

### 2a. Publik och klack på neutral plan — UTREDNING, INGET BYGGT

**Publik (`calcAttendance`, `economyService.ts:297`):** `capacity`,
`hasIndoorArena` och (indirekt via `arenaCapacity ?? reputation*7+150`)
klubbens egen kapacitet läses ALLTID från `homeClubForAttendance` —
`game.clubs.find(c => c.id === fixture.homeClubId)`
(`matchSimProcessor.ts:429`). `isSemiFinal`/`isFinal` expanderar kapaciteten
(×2/×1.8) som en proxy för "större evenemang, större publik", men
bas-siffran och `hasIndoorArena` (väder-dämpning) kommer alltid från
vilken klubb som råkar stå som `homeClubId` i bracketen — inte från den
faktiska värdarenan (Sävstaås IP). `CUP_FINAL_VENUE` (`specialDateStrings.ts:14`)
har bara `arenaName`/`city`, ingen egen kapacitet eller `hasIndoorArena` —
det finns idag ingen data att läsa istället. Samma mönster gäller
`hallInomhus` i matchinput (`useMatchGenerator.ts`): `fixture.homeClubId
=== game.managedClubId && homeClubObj?.hasIndoorArena` — bracket-klubbens
egen arenatyp, inte värdarenans, och bara sant om spelarens klubb råkar
stå som hemmalag den omgången.

`fanMood: game.fanMood` är alltid det EGNA (spelade) klubbens humör,
oavsett hemma/borta-status i just den fixturen — en redan existerande
förenkling, inte specifik för neutral plan, men den förstärker samma
mönster: publikuppskattningen vid en delad neutral arena bygger helt på
EN klubbs siffror, aldrig en blandning.

**Svar på frågan:** ja, samma bugg en nivå upp, bekräftad i kod — men att
fixa den kräver att `CUP_FINAL_VENUE` (och motsvarande för SM-final,
Studenternas IP) får egna kapacitets-/arenadata att läsa istället för att
låna en bracket-klubbs, ett datamodell-beslut, inte en kortfix. Byggde
inget, väntar på Jacobs dom om det är värt att modellera.

### 2b. Arenanamnet i Granska — UTREDNING, INGET BYGGT

`GranskaOversikt.tsx:192`: `{homeClub?.arenaName && !fixture.isNeutralVenue
&& <p>Spelades på {formatArenaName(homeClub.arenaName)}</p>}`. Facit: Granska
varken "läser fixture.arenaName när det finns" ELLER "slår alltid upp
hemmaklubbens arena" — den gör en TREDJE sak: visar hemmaklubbens arena
NÄR `isNeutralVenue` inte är satt, och visar INGENTING alls när den är
satt. Ingen else-gren skriver ut `fixture.arenaName`/`venueCity` (Bollnäs/
Sävstaås IP) för neutral-plan-matcher.

Det observerade felet ("Slagghögen arena" efter kvartsfinalen) var alltså
KORREKT — kvartsfinalen (rond 2) är inte del av finalhelgen och spelas
verkligen på hemmaklubbens egen arena. Men nu när RUNDA 3 punkt 1:s fix
sätter `isNeutralVenue=true` även på cupsemifinalen: resultatskärmen
kommer visa INGEN arenarad alls för semi/final, istället för den korrekta
"Sävstaås IP, Bollnäs". Bättre än fel arena, men inte samma som rätt
arena. Samma matchCore.ts-fallback (`fixture.arenaName ?? input.arenaName
?? ''`, rad 1401) som redan används i speciella-datum-kontexten skulle
lösa det om Granska fick en egen rad för det — men det är en textrad Jacob
(Opus) bör skriva, inte en Code-genväg. Byggde inget.

### 3. (se sektionen längre upp — riktig avståndsbaserad progressformel, BYGGD)

Se "Kvalitetsportar (uppföljningsrundan)"-blocket och commit `ef225005`
ovan för fullständig beskrivning: `BoardObjective.startValue`, migration,
regressionsguard mot start<=target, 11 nya tester.

### 4. Vädersampel — SIFFROR, ingen kalibreringsändring

Tre tal, precis som efterfrågat, mätta med `generateMatchWeather` direkt
(22 ligaomgångars klimatfördelning × 200 oberoende drag/omgång = 4400
sampel per klubb, ad-hoc-skript kört och raderat efter mätning — inga nya
filer i repot):

```
                              Söderfors (naturis)   Forsbacka (konstfrusen)
Matcher med temp > 0°              30.8%                   22.3%
  — därav iceQuality Poor/Moderat  51.7%                    0.0%  (strukturellt — hasArtificialIce
                                                                    tvingar alltid Excellent/Good,
                                                                    oavsett väder, rad 57-58)
condition===Thaw (ger ballControl-
Penalty/speedModifier)              3.5%                    1.7%
```

Tredje talet — texthake — mättes separat: 300 fulla matcher tvingade till
`weather.condition=Thaw`, körda i `mode: 'full'` (samma väg
`MatchLiveScreen` faktiskt använder — `useMatchGenerator.ts` lämnar `mode`
osatt, som defaultar till full text; `mode: 'fast'` skulle gett NOLL
kommentar oavsett väder, se nedan). **100% av matcherna (300/300) fick
minst en textrad som nämner isen, snitt 9,28 rader/match** —
`weather_goal_thaw`/`weather_miss_thaw`/`iceDeterioration_thaw` triggar
ofta och pålitligt när matchen faktiskt spelas i live-läge.

**Viktig nyans som inte var uppenbar innan mätningen:** `matchSimProcessor.ts`
(snabbsimulera-omgången-vägen, `matchEngine.ts`s `simulateMatch`) kör
ALLTID `mode: 'fast'`, vilket ger NOLL kommentartext — inte bara väder,
utan mål, utvisningar, allt. Det är en generell, redan existerande
egenskap hos snabbsim (prestandaskäl), inte en väder-specifik brist. Om
Jacob spelar med snabbsimulerade omgångar (vanligt för ovtiktiga matcher)
ser han aldrig NÅGON matchtext, väder inkluderat — det är förväntat
beteende för den spelstilen, inte ett texthake-fel.

**Svar till Jacobs fråga "sällan och tyst?":** nej — mekaniken märks ofta
(live-läge: 100% textträff, 3,5%/1,7% av alla matcher har den mekaniska
effekten aktiv) och den är inte tyst när matchen faktiskt spelas ut. Det
enda "tysta" är iceQuality-TAGGEN på dashboarden (`getIceQualityLabel`) —
Forsbackas konstfrusna bana visar "Bra is" strukturellt oavsett väder
(rad 57-58), vilket är AVSIKTLIGT (banan håller i grunden, se rotorsak i
punkt 6 föregående runda) men betyder att ingen förhandsindikator på
dashboarden signalerar "regn påverkar spelet idag" för konstfrusna klubbar
— bara live-kommentaren gör det, i efterhand. Om det är ett problem är det
en design/text-fråga (en distinkt tagg för "vattensjuk men hel is"?), inte
en kalibreringsjustering. Ingen kod ändrad i denna punkt.

### 5. Dubblett på cupkortet — BYGGD

`NextMatchCard.tsx`: `NEUTRAL PLAN` renderades två gånger (rubriktagg +
infoslingan). Rubriktaggen behållen (Jacobs dom — skiljer sig inte
visuellt), infoslingans dubblett borttagen. **Commit:** `ef225005`.

### Kvalitetsportar (RUNDA 3)
```
npx tsc --noEmit                    → rent
npx vitest run                      → 1420/1420 gröna
npm run build                       → grönt, lint:design-guard ✓
npm run lint:text-guard             → grönt
npm run lint:design                 → grönt
```

### Commits (RUNDA 3, kronologisk)
`eaf8cdfd` (punkt 0 — Opus interimsfixar, verifierade + en bugg fångad) ·
`ef225005` (punkt 1/3/5 — hemmafördel-test, riktig progressformel,
dubblett-tagg).

### Ej byggt (med orsak) — RUNDA 3

- **Punkt 2a** (publik/klack på neutral plan) — bekräftad bugg (samma
  klass som punkt 1, en nivå upp), men fixen kräver ny data på
  `CUP_FINAL_VENUE` (kapacitet, hasIndoorArena) som inte finns idag —
  datamodell-beslut, inte kortfix. Jacobs dom.
- **Punkt 2b** (Granskas arenanamn) — bekräftat att semi/final nu visar
  INGEN arenarad (bättre än fel arena, men inte rätt arena). Fixen är en
  ny textrad i Granska, Opus-jobb (svensk text), inte en Code-genväg.
- **Punkt 4** (vädersampel) — siffror levererade, ingen kalibreringsändring
  begärd eller gjord. En design-nyans flaggad (iceQuality-taggen döljer
  effekten för konstfrusna klubbar på dashboarden) — Jacobs bord om det
  ska adresseras.

---

## RUNDA 4 (samma dag) — `CODE_INSTRUKTION_SLUTTEST_RUNDA4_2026-08-08.md`

Tre domar, alla byggda. **Commit:** `f15d334a`.

### 1. Neutral plans publik — BYGGD

`CUP_FINAL_VENUE.capacity=7000`/`hallInomhus=false` (specialDateStrings.ts).
`calcAttendance` summerar bägge klubbarnas publikunderlag
(`reputation*7+150` per klubb) på cupens neutrala finalhelg, lägger på
`NEUTRAL_EVENT_FACTOR=1.5`, kapar mot `CUP_FINAL_VENUE.capacity`.
Klackeffekten (mood/tabellplacerings-boosten) halveras.

**Faktor rapporterad + verifierad innan commit:** 1.5. Två små klubbar
(rep 45+48) final ≈1605, två stora (rep 85+78) final ≈2432 — differentierat,
ingen fyller 7000, ingen stannar vid ett golv kring 900.

**Scope-beslut som inte var explicit i ordern, fattat och dokumenterat i
commit-meddelandet:** gaten är `isCup && isNeutralVenue`, inte bara
`isNeutralVenue`. SM-finalen sätter också `isNeutralVenue` (Studenternas
IP) men fick ingen egen kapacitetsdata i denna runda — en ren
`isNeutralVenue`-gate hade tyst bytt SM-finalens befintliga 4x-expansion
(upp till 20 000) mot cupens 7000-tak, en oavsiktlig regression på ett
system som inte var i scope. `isFinal`/`isSemiFinal`-grenarna är orörda
för SM-finalen.

### 2. Arenaraden i Granska — BYGGD

Läser `fixture.arenaName` (komplett namn från cupService.ts/
playoffService.ts, INTE genom `formatArenaName` — det skulle lagt till
" arena" och gett "Sävstaås IP arena"), annars hemmaklubbens egen arena
(`formatArenaName` som innan). "Spelades på {arenaName} i {venueCity}" när
staden finns. Föregående version (RUNDA 3 punkt 2b) visade ingen arenarad
alls för neutral plan — nu rätt arena, inte bara ingen fel arena.

### 3. Vädret i snabbläget — BYGGD + uppföljningsrapport

Ny `getGranskaWeatherEffectLine()` — väderrad i Granska efter
resultatsammanfattningen, prioordning nederbörd/sikt före extremkyla
(nederbörden vinner vid samtidiga villkor). Läser sparad `MatchWeather`-
data direkt, inte livekommentaren — funkar oavsett simuleringsläge. 9 nya
tester (`getGranskaWeatherEffectLine.test.ts`).

**Uppföljningsrapport (efterfrågad):** ja, det finns fler textlager som
bara existerar i live-läge. `matchCore.ts:1379`, `if (!isFast) {...}`,
omsluter INTE bara väder — hela det kontextuella berättarlagret: legend-
kommentar (spelare med `isClubLegend`), storylines (`rescued_from_
unemployment`, `went_fulltime_pro`, m.fl.), THE BOMB 1.3-kontextuell text
(akademi-uppflyttad, kapten, klackfavorit, dayJob), derby-text, cup/final/
semifinal-specifik måltext, och supporterklackens matchreaktioner. Allt
detta är noll i `mode:'fast'` (snabbsimulera omgången), precis som vädret
var. `generateQuickSummary`/`generateSilentMatchReport` (Granskas
kompensation för snabbsimulerade matcher) är rent mekaniska — målskytt-
räkning och marginal från `fixture.events`, ingen åtkomst till någon av
ovanstående. Vädret var alltså representativt för en mycket större klass,
inte ett enskilt undantag. **Svar: ja — egen runda, före release, som
Jacob själv föreslog som villkor.** Inget byggt utöver väderraden i denna
runda.

### 4. Istaggen — BYGGD

Ny `getIceTagLabel(quality, condition)` i weatherService.ts: visar "Blöt
is" istf `getIceQualityLabel`s anläggningskvalitet när
`condition===Thaw`, oavsett underlag. Övriga conditions oförändrat.
`NextMatchCard.tsx` uppdaterad. `MatchHeader.tsx`/`matchCore.ts`s
`openingWeatherNote` rörda inte — bägge visar redan `getConditionLabel`
("Töväder") i samma mening/rad, redan sant, inte samma "tiger"-problem
som dashboardtaggen hade isolerat.

### Kvalitetsportar (RUNDA 4)
```
npx tsc --noEmit                    → rent
npx vitest run                      → 1429/1429 gröna
npm run build                       → grönt, lint:design-guard ✓
npm run lint:text-guard             → grönt
npm run lint:design                 → grönt
```
