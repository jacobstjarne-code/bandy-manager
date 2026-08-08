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
- **Punkt 5** — rapporterad med konkret väg + mindre diff än väntat (Yta
  3-infrastrukturen finns redan), inte byggd — väntar på Jacobs go.
- **Punkt 6** — konstanter föreslagna, inte byggda/stress-testade — väntar
  på Jacobs dom om styrkan.
- **Punkt 4c** — utredd, ingen ytterligare läcka hittad, rapporterad
  nyansering av var bugen troligen sitter (etikett, inte mätare) — Jacob avgör.
- **Innan något markeras klart-kravet** (browser-verifiering, tre frågor,
  "vad SÅG du") — kunde inte uppfyllas i den här sessionen. Samma
  begränsning gäller hela sessionen, inte punktvis.
