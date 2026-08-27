# CODE-INSTRUKTION — SLUTTEST INFÖR BEGRÄNSAD RELEASE

**Datum:** 2026-08-08 · **Av:** Opus (chat) · **Underlag:** kodläsning + genomspelning av produktionsbygget i browser (nytt spel → Västanfors → ankomst → tillträde → portal → cupkvartsfinal snabbsim → granska → advance till semifinal)

**Läs detta först.** Varje punkt har rotorsak, exakt fil, nuvarande kod, vad som ska ändras och vad som INTE ska röras. Ändra inget som inte står här utan att rapportera först (REFACTOR-DISCIPLIN: >2 filer utöver listan = pausa och fråga Jacob).

**Redan gjort av Opus i working tree — committa, bygg inte om:**
- `vite.config.ts` — hash-fallback (punkt 1 nedan)
- `src/presentation/components/match/PitchLineupView.tsx` — två namn-slices borttagna (punkt 3)
- `src/presentation/components/portal/secondary/BoardObjectivesList.tsx` — formatMoney på ekonomiska mål (punkt 4a)

**Två fynd är återkallade och ska INTE åtgärdas:** (a) konstfrusen bana + plusgrader är inte en motsägelse — `hasArtificialIce`-grenen i `weatherService` är korrekt och rörs inte; (b) produktionsaliaset `bandy-manager.vercel.app` är öppet, ingen SSO-vägg. Preview-URL:er ÄR gatade — dela aldrig en preview-länk med extern testare.

---

## 0. Jacobs bord, inte Codes

- `git push` — fyra opushade commits (`8717eb3d`, `47e4f53d`, `664c576f`, `e8669ad0`). Produktionen kör `93ac162d` från 23 juli, alltså UTAN Korrvända 2-stängningen. Allt nedan ska ligga ovanpå en pushad main.
- Beslut om "illustration på väg" får synas för externa testare (syns på cupens matchladdning).

---

## 1. Build-hashen — KLAR (verifiera bara)

**Rotorsak:** Vercels byggcontainer saknar git-metadata → `execSync('git rev-parse')` kastade → `__GIT_HASH__` blev `'unknown'` i produktion. `FeedbackButton.buildHash()` läser den, så varje testarrapport bar `build: unknown` och gick inte att matcha mot en deploy. Hela GAP-2:s poäng föll.

**Gjort:** `vite.config.ts` läser `process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7)` som bas, git-anropet är lokal override.

**Verifiera:** deploya preview, öppna ytan, läs raden längst ned. Ska visa sju tecken, inte `unknown`. Rapportera hash + URL.

---

## 2. Cup: direktkval-gaten och "neutral plan"

**Fil:** `src/presentation/components/dashboard/NextMatchCard.tsx`, cup-grenen.

### 2a. Direktkval visas för fel rundor och fel klubbar

**Rotorsak:** gaten läser rundnummer i stället för vem som faktiskt fick bye.

Nuvarande (två ställen, samma villkor):
```tsx
{cupMatch && cupMatch.round > 1 && (
  <span className="tag tag-outline" style={{ fontSize: 8 }}>Direktkval</span>
)}
```
```tsx
if (!cupMatch || cupMatch.round <= 1) return null
return (
  <p ...>Direktkvalificerade utifrån ranking · {getCupRoundName(cupMatch.round)}</p>
)
```

**Designen (Jacobs, bekräftad):** ligan har färre lag än Elitserien, därför går de fyra högst rankade lagen direkt in i kvartsfinalen. `cupService.generateCupFixtures` gör exakt det — `teamIds.slice(0, 4)` får bye, resten spelar förstarunda — och bracketen bär `byeTeamIds`.

**Fel i dag:** villkoret `round > 1` är sant även i semifinal och final (jag fick "Direktkvalificerade utifrån ranking · semifinalen" efter att ha vunnit kvarten på isen), och det är sant för ett lag som tog sig UR förstarundan — som då får texten "direktkvalificerade utifrån ranking" om en plats det spelade sig till.

**Ändra båda ställena till:**
```tsx
const isDirektkvalad = cupMatch?.round === 2
  && (game.cupBracket?.byeTeamIds ?? []).includes(game.managedClubId)
```
Taggen `Direktkval` och förklaringsraden renderas bara när `isDirektkvalad`.

**Ny copy på förklaringsraden (final, ändra inte):**
> De fyra högst rankade lagen går direkt in i kvartsfinalen. Ni är ett av dem.

Motivet till omskrivningen: en förstagångsspelare vet inte att det finns en ranking, så "utifrån ranking" förklarar ingenting. Raden ska säga både regeln och att den gäller dig.

**Rör inte:** `getCupRoundName`, cupfinalens gren, `cupService`.

### 2b. "Neutral plan" är hårdkodat för alla cupmatcher

**Rotorsak:** cup-grenen sätter headertagg och infotagg utan att titta på fixturen.

```tsx
} else if (isCup) {
  ...
  headerTagText = 'NEUTRAL PLAN'
```
```tsx
<span className="tag tag-outline" style={{ fontSize: 8 }}>Neutral plan</span>
```

Kvartsfinalen spelades på Schaktvallen med 539 åskådare och hemmauppställning — `cupService` ger matchen riktig `homeClubId`/`awayClubId`. Bara finalen har neutral plan (`CUP_FINAL_VENUE`). Matchförberedelsen säger "HEMMA" på samma fixture, så spelaren ser två motstridiga påståenden inom två skärmar.

**Ändra:** cup-grenen använder `isHome ? 'HEMMA' : 'BORTA'` som de övriga varianterna; "Neutral plan"-taggen renderas bara för cupfinalen (samma gren som redan har `isFinal`). Rör inte SM-finalens `Studenternas IP`-tagg.

**Commit (2a+2b tillsammans):**
```
fix: cupkortet ljög om direktkval och spelplan
rot: direktkval-gaten läste cupMatch.round > 1 istf byeTeamIds — semi/final och
play-in-vinnare fick "direktkvalificerade utifrån ranking"; neutral plan var
hårdkodad för alla cuprundor fast bara finalen spelas neutralt
```

**Grepa innan commit:** andra konsumenter av samma villkor — `anslagService.ts` (`cup_first_match`) och `AnslagOverlay.tsx` fick `isClubDirektkvalad`/`firstRoundForClub` redan i M66e/PT-8. Verifiera att de tre nu jämför på samma sätt, och rapportera om de inte gör det.

---

## 3. Namnkapningen i uppställningen — DELVIS KLAR

**Fil:** `src/presentation/components/match/PitchLineupView.tsx`

**Rotorsak:** JS-kapning kördes före CSS-ellipsen, med två olika konstanter i samma vy.

Namnet under plandotten hade `player.lastName.slice(0, 7)` — i en span som REDAN har `overflow: hidden`, `textOverflow: 'ellipsis'`, `whiteSpace: 'nowrap'` och `maxWidth: 44`. Legendraden under hade `slice(0, 6)`. Samma spelare visades alltså som "Sandstr" på planen och "Sandst" i listan, utan ellips, och lagets två Lindgren blev identiska strängar.

**Gjort:** båda slices borttagna. CSS gör jobbet på dotten; legendraden wrappar i sin flexbox.

**Kvar till dig (visuellt, kräver ögon):** tomma slots renderar `slot.label.slice(0, 2).toUpperCase()` — här och i `LineupFormationView.tsx`. Det gör VMF→"VM", CMF→"CM", men också **VYH→"VY" och HYH→"HY", som är exakt etiketterna för ytterforwards i 3-3-4**. Två olika platser på planen kan visa samma två bokstäver. Visa hela etiketten i mindre grad i stället för att kapa; cirkeln är 34–38 px, tre tecken får plats vid `fontSize: 8`.

**Verifiera i browsern, inte i testet:** öppna Tillträdet → Sätt elvan och matchens Förbered → Trupp i 390 px bredd. Kontrollera att inget namn klipps mitt i ordet utan ellips och att tomma slots går att skilja åt. Skärmdump i auditen.

---

## 4. Styrelsens krav

**Filer:** `src/presentation/components/portal/secondary/BoardObjectivesList.tsx`, `src/domain/services/boardObjectiveService.ts`

### 4a. Rå krona — KLAR
`{obj.currentValue} / {obj.targetValue}` renderade "0 / 100000" på ankomstscenen, alltså spelets första skärm, trots att `formatMoney` ligger i samma fil (används bara i `isBalance`-grenen). Bryter Tal & enheter-kortet. Åtgärdat: ekonomiska mål (`obj.type === 'economic'`) går genom `formatMoney`.

### 4b. Nollan är falsk under sju omgångar
**Rotorsak:** `makeObjective` sätter `currentValue: 0` vid skapande, och värdet uppdateras bara i `checkInObjectives` (omgång 7, 14, 22).

Följd: hela introt och första tredjedelen av säsongen visar alla mål på noll och tom stapel. För deltamål (`growFinances`) är noll sant. För nivåmål (`growFanbase`, target 70) är det falskt — spelaren ser "0 / 70" när mätaren faktiskt står på 50.

**Ändra:** kör `evaluateObjective(obj, game)` en gång direkt efter att målen genererats i `generateBoardObjectives`-anroparen (`createNewGame.ts` och `seasonEndProcessor.ts`) och skriv in `currentValue` därifrån. Ändra inte `checkInObjectives`-rytmen.

**Rapportera efteråt:** samma widget renderar nivåmål och deltamål med identisk grammatik ("Framsteg X / Y"). När siffrorna blir sanna vill jag se hur det ser ut innan jag skriver om etiketterna.

### 4c. Etiketten och mätaren är inte samma mätare — VÄNTA PÅ BESLUT
`growFanbase` heter "Klackens humör ska nå 70", men `evaluateObjective` läser `game.fanMood` — publiken. Klacken är `supporterGroup.mood`. RC-bedömningen skiljer dem uttryckligen (8a klack, 8b publik) och de har olika mekanik.

**Bygg inget här.** Rapportera bara: vilka andra ställen läser `fanMood` respektive `supporterGroup.mood`, och om någon annan yta har samma förväxling. Jacob avgör om etiketten eller mätaren ska ändras.

---

## 5. Taktikskärmen motsäger sig själv

**Fil:** `src/presentation/components/match/TacticStep.tsx`

**Rotorsak:** två oberoende rådgivare på samma skärm, som läser olika signaler.

Den varma remsan visar `analysis.recommendation` från `generateDetailedAnalysis` (`opponentAnalysisService`), som resonerar om motståndarens styrkor. Per-alternativ-raden läser `recommendations`, som komponenten bygger själv:

```tsx
if (analysis.recentForm === 'Svag form' || (analysis.tablePosition != null && analysis.tablePosition >= 9)) {
  recommendations.mentality = 'offensive'
  recommendations.press = 'high'
}
```

Observerat i spel: remsan sa "Prioritera defensiven — de har farliga forwards", och tre rader ner stod "Matchar förslaget. Offensivt läge utnyttjar svag motståndare."

**Ändra:** en källa. Antingen exponerar `opponentAnalysisService` sitt rekommenderade taktikläge som data (`recommendedMentality`, `recommendedPress`) som `TacticStep` läser, eller så flyttas hela bedömningen dit och skärmen renderar bara. Välj det första om det håller diffen under fem filer.

**Rapportera före bygge** vilken väg du väljer och varför — det här är ett kontrakt mellan lager, inte en ytfix.

**Rör inte** hörnspecialist-grenen (`cornerStrategy`); den läser sin egen, korrekta signal.

---

## 6. Knottrig is på konstfrusen bana — NY FEATURE, Jacob har sagt ja

**Fil:** `src/domain/services/weatherService.ts`

**Bakgrund:** min ursprungliga rapport påstod att `+5° · Utmärkt is` var en bugg. Det var fel — konstfrusen bana håller isen vid plusgrader, och alla klubbar i spelet är konstfrusna. Grenen `if (homeClub.hasArtificialIce)` ligger rätt och ska ligga kvar.

**Det som ändå saknas:** regn och töväder ger i dag NOLL mekanisk effekt för konstfrusna klubbar, eftersom effektblocket bara nås via `condition === Thaw && iceQuality === Poor|Moderate` — tillstånd konstfrusen aldrig hamnar i. Regelboken (`docs/archive/completed-april/SPEC_VADER.md` §5) har raden: regn under match ger knottrig is och fler röjningspauser. Det gäller även konstfrusen bana, den blir vattensjuk i regn.

**Ändra:** ny effektgren som gäller oavsett `iceQuality` — töväder/regn ger måttligt `ballControlPenalty` och lätt sänkt `speedModifier`, mildare än naturisens tövädersgren. Kalibrering: effekten ska märkas i matchtexten men inte flytta målsnittet utanför toleransen mot bandygrytan-targets (9,12 mål/match, ±1,5).

**Detta kräver stress-test-loop, alltså din lane, inte min.** Kör `npm run stress` före och efter, jämför målsnitt och hörnmål, och lägg siffrorna i auditen. Föreslå konstanterna för mig innan du committar — jag dömer om effekten är för svag för att kännas eller för stark för kalibreringen.

---

## 7. Processfynd — PORT 2 kan inte bli grön

`CLAUDE.md` KVALITETSPORTAR PORT 2 säger:
```bash
grep -rni 'rink' src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska returnera 0
```
Den returnerar sex träffar sedan `--ice-rink`/`--ice-rink-deep` infördes 2026-06-19 (pitchfärgs-beslutet). Alla är tokennamn, inga är speltext.

**Ändra grep-raden** så den undantar tokennamnet men fortfarande fångar ordet i text och kommentarer, och skriv en rad om varför undantaget finns — samma disciplin som hex-grepets fyra dokumenterade undantag. En port som aldrig kan bli grön lär läsaren att hoppa över portar.

---

## Ordning

1 (verifiera) → 2 → 4b → 3 (resten) → 7 → 5 (efter rapport) → 6 (efter förslagna konstanter).

Punkt 4c och formationsvokabulären (`LIB`/`VCB`/`HCB`/`CMF` mot bandytermerna, `HR` som spegling av `VH` i `Formation.ts`) ligger hos Opus/Jacob — bygg inget där.

## Innan något markeras klart

Browser-verifiering enligt CLAUDE.md: starta dev-servern, gå igenom nytt spel → ankomst → tillträde → första cupmatchen → granska, och svara på de tre frågorna (renderas texten färdig, sitter elementet rätt, går flödet att fullfölja). Rapporten ska innehålla vad du SÅG. `npm run build && npm test` + `lint:design` + `lint:text-guard` gröna. Audit i `docs/sprints/`.
