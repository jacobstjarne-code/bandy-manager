# SPEC — Bug-fix-runda efter playtest 2026-05-20

**Datum:** 2026-05-20
**Status:** Klar för Code. Tier-uppdelad — TIER 1 är blockerare för Spectator-säsongens verklighet, övriga kan göras parallellt.
**Bakgrund:** Jacob spelade igenom hel säsong, åkte ut 0–3 i playoff-KF, gick in i säsong 2. Spectator-flödet syntes aldrig. Plus en samling återkommande triggerfel.

---

## TIER 1 — BLOCKERANDE (Spectator-säsongen aktiveras aldrig)

### 1.1 · `season_done` triggar direkt efter elimination

**Plats:** `src/domain/services/anslagService.ts` → `managedClubLastSeasonMatchCompleted(game)`

**Problem:** Funktionen returnerar `true` så fort managed inte har schemalagda fixtures. Efter playoff-elimination triggas `season_done` (SOMMAREN KOMMER) direkt — innan SF + SMF spelats av andra. Hela Spectator-perioden hoppas över.

**Fix:**

```typescript
function managedClubLastSeasonMatchCompleted(game: SaveGame): boolean {
  const id = game.managedClubId
  const hasAnyCompleted = game.fixtures.some(
    f => f.status === FixtureStatus.Completed && (f.homeClubId === id || f.awayClubId === id)
  )
  const hasAnyScheduled = game.fixtures.some(
    f => f.status === FixtureStatus.Scheduled && (f.homeClubId === id || f.awayClubId === id)
  )
  if (!hasAnyCompleted || hasAnyScheduled) return false

  // NYTT: vänta tills slutspelet är klart för alla — inte bara för managed
  if (game.playoffBracket && game.playoffBracket.status !== PlayoffStatus.Completed) {
    return false
  }
  return true
}
```

Detta gör att `season_done` väntar tills SMF spelats klart. Under den perioden triggas `isManagedClubSpectator(game) === true` → SpectatorPrimary + WatchOthersSecondary + PortalSpectatorMark renderas naturligt.

**Test:**
- Eliminera managed i KF → simulera fram till SMF klar → verifiera att `season_done` inte triggas innan dess
- Eliminera managed i KF → verifiera att `isManagedClubSpectator(game) === true` under hela mellanperioden

---

### 1.2 · `PLAYOFF_ANSLAG`-pooler bryter mot surface-separation ✅ LEVERERAT

**Plats:** `src/domain/data/anslag/playoffAnslag.ts`

**Status:** Opus skrev om alla 9 varianter 2026-05-20. Bandysvensk understatement, konkret bild, template-variabler `{motståndare}`, `{rond}`, `{resultat}` används. Inga kodändringar krävs av Code — bara verifiera att filen är på plats vid kompilering.

---

### 1.3 · Spectator-pools verifierade och omskrivna ✅ LEVERERAT

**Plats:** `spectatorMarkText.ts`, `spectatorPrimaryText.ts`, `watchOthersReflectionText.ts`, `seasonSummaryElimText.ts`

**Status:** Opus skrev om alla pools 2026-05-20. `spectatorMarkText` är nu kontextmedveten (eliminerad-i-playoff vs aldrig-i-playoff). `seasonSummaryElimText` är ny fil med 4 kontexter (kf/sf/smf/no_playoff) + picker-funktion. Code behöver:

1. Verifiera att `SeasonSummaryScreen.tsx` använder `pickSeasonElimText(context, season, clubId)` istället för hårdkodad text
2. Verifiera att `WatchOthersSecondary` har template-resolution för `{motståndare}` i reflektion-strängarna
3. Lägga till import-paths där det behövs

---

## TIER 2 — VIKTIGA BUGGAR (logikfel)

### 2.1 · Cup-anslag dubbel-trigger vid kvartfinal-förlust

**Plats:** `src/domain/services/anslagService.ts` → `computeNextAnslag`

**Problem:** När managed elimineras i cup-kvart (runda 2): `cup_between` (Snålvinden) triggas eftersom runda 2 är komplett, sedan `cup_done` (Pokalen) triggas direkt efter eftersom managed's sista match är klar. Båda visas i tät följd. Snålvinden är fel — den är "mellan rundor när cupen pågår", inte "när vi är ute".

**Fix:** Suppressa `cup_between` när managed är eliminerad ur cupen. I logiken på rad ~280:

```typescript
// Snålvinden — INTE när managed är ute (då triggas cup_done istället)
if (status.eliminated && status.eliminatedInRound === 2 && !seen.includes('cup_between')) {
  // SKIPPA — managed är ute, cup_done tar över
}
```

Eller enklare: stryk hela `cup_between`-fallet för managed-eliminerade. Den var tänkt för pågående-cupen-perspektiv, inte vårt.

**Alternativ tolkning som Code bör flagga:** ska `cup_between` triggas för spelare som *inte är ute* (utan väntar på kvartsfinal)? I så fall behöver villkoret bli `if (!status.eliminated && !seen.includes('cup_between'))`. Code: välj den tolkning som matchar nuvarande spec-intention bäst och flagga valet i PR.

**Test:** Eliminera managed i cup-runda 2 → verifiera att bara `cup_done` triggas, inte `cup_between`.

---

### 2.2 · Transferfönster triggas vid omgång 6 (cup räknas in i ligaomgång)

**Plats:** Hitta transferfönster-trigger. Sannolikt i `transferService.ts` eller `weeklyDecisionService.ts`.

**Problem:** Vid `currentMatchday === 10` (omg 6 liga + 4 cup) triggas januari-transferfönster. Återkommande mönster — `currentMatchday` (global) används där `currentLeagueRound` (liga-spelade omgångar) ska användas.

**Fix:** Grep efter `currentMatchday` i transfer/window-relaterade services. Byt till `currentLeagueRound(game)` (helper finns i `anslagService.ts`) eller motsvarande filtrering på `f.isCup === false`. Värdetrösklar (typ "transferfönster öppnar omg 12") måste mappa mot ligaomgång, inte matchday.

**Test:** Spela genom oktober (cuprundor + 5 ligaomgångar) → verifiera att transferfönster INTE triggas. Vid omgång 12 i ligan (efter Annandagen) → verifiera att det DÅ triggas.

---

### 2.3 · Omgång 23 av 22 — räknaren går över ligamaxet

**Plats:** Header-rendering — sannolikt i `PortalScreen.tsx`, `SituationCard.tsx` eller liknande.

**Problem:** `currentMatchday` ökar för playoff-rundor (G1, G2, G3 i serier). Header visar "Omgång 23 av 22" vilket är inkonsekvent — grundserien är 22 omgångar, slutspelet har egen räkning (KF G1, G2, G3...).

**Fix:** I header-rendering, om `isPlayoff` eller `isManagedClubSpectator` → byt label från "Omgång N" till "Slutspel · KF G2" eller "Slutspel · vecka N" eller helt enkelt "Slutspel". Inte "Omgång 23".

**Designval:** Code: hitta header-komponenten, lägg in conditional rendering. Format-precision (G2 vs vecka N) flaggas till Design vid återkomst om osäker.

---

### 2.4 · "Simulera resten av säsongen"-knapp borta efter omg 12 (halva)

**Plats:** Sannolikt `HalfTimeSummaryScreen.tsx` eller `SimSummaryScreen.tsx` eller advance-flödet.

**Problem:** Tidigare fanns en knapp för att simulera resten av säsongen från halvvägs-skärmen. Den är borta. Regression.

**Fix:** Code: grep efter "simulera resten" / "simulate rest" / "fastforward" i screens. Hitta vad som tagits bort eller villkorlöst gömts. Återställ till tidigare beteende — sannolikt en SimSummary-CTA på HalfTimeSummary eller PortalScreen.

**Om Code inte hittar regressionen — flagga som öppen fråga med vad som finns på plats.**

---

### 2.5 · SeasonSummary saknar SM-vinnare-info

**Plats:** `src/presentation/screens/SeasonSummaryScreen.tsx`

**Problem:** Säsongssammanfattningen visar managed's `playoffResult` (Kvartsfinalist) men säger inget om vem som faktiskt vann SM. När managed inte är champion, ska SM-vinnaren namnges.

**Fix:** Lägg till rad efter `playoffEliminationSentence` som hämtar SM-vinnaren från `game.playoffBracket?.champion` (clubId) → klubbnamn via `game.clubs`. Format:

```typescript
function smWinnerSentence(summary: SeasonSummary, game: SaveGame): string {
  if (summary.playoffResult === 'champion') return ''  // vi är vinnaren
  const champId = game.playoffBracket?.champion
  if (!champId) return ''
  const champ = game.clubs.find(c => c.id === champId)
  if (!champ) return ''
  return `${champ.shortName ?? champ.name} blev svenska mästare.`
}
```

Rendera under `playoffEliminationSentence`, samma stil. Opus textvariation kan komma senare — en faktarad räcker initialt.

---

## TIER 3 — TEXT/COPY-FEL

### 3.1 · "Nedsläpp" → "avslag" (bandy-terminologi)

**Plats:** Okänd. Måste hittas via grep.

**Problem:** Bryts mot CLAUDE.md ALDRIG-regeln. "Parkeringarna är fulla en timme före nedsläpp" visas i Bruksderbyt-text. Bandy har avslag, inte nedsläpp.

**Fix:** Code: grep `nedsläpp` i alla `.ts/.tsx`-filer. Visa alla träffar för Opus. Opus skriver om till "avslag" eller motsvarande korrekt bandyord per kontext.

**Direkt åtgärd Code kan göra:** ren find-and-replace `nedsläpp` → `avslag`, granska att kontexten stämmer (är det match-start eller något annat?). Om osäker — visa kontexten för Opus.

---

### 3.2 · "Heros 11:e — Sånt är inte gratis" (statement utan datastöd)

**Plats:** Sannolikt opponent-form-text eller standings-flavor.

**Problem:** Texten antyder bedrift (11:e plats är inte en imponerande prestation). Samma typ av bug som A8 (commit `f1c7fec`) som var opponent-standing-guard-fix. Återkommer i ny lokalisering.

**Fix:** Code: grep efter "Sånt är inte gratis" eller liknande prestation-antydande fraser. Hitta källpoolen. Lägg till opponent-position-guard så texten bara väljs när opponent's position är värd komplimangen (typ top-4 eller serieledare).

**Opus skriver om om Code identifierar pool men inte vet exakt vilket villkor.**

---

## TIER 4 — DESIGN/UI-PROBLEM (kan göras parallellt)

### 4.1 · Z-index: knappar ovanpå HALVVÄGS-skärm

**Plats:** `src/presentation/screens/HalfTimeSummaryScreen.tsx` eller relaterad modal-rendering.

**Problem:** Modal med "Lugna ner tempot / Pressa hårdare / Låt spelarna prata" renderas OVANPÅ halvvägs-skärmens innehåll istället för innanför layouten.

**Fix:** Code: identifiera vad som renderar modalen. Lägg in z-index eller layout-omflyttning så modalen ligger INNANFÖR halvvägs-flow, inte ovanpå. Eller — om det är medvetet att modalen ska vara overlay, lägg backdrop som täcker halvvägs-innehållet så det inte blir visuell-konflikt.

---

### 4.2 · Retirement-kort eyebrow säger bara namn

**Plats:** `src/presentation/components/portal/secondary/RetirementDecisionSecondary.tsx`

**Problem:** Eyebrow är `💬 {namn}` — säger inte vad det handlar om. Spelaren ser bara ett namn och tre val.

**Fix:** Ändra eyebrow till två-radig:

```tsx
<div className="portal-card-eyebrow">⏳ KARRIÄRSAMTAL · {name}</div>
```

Eller ännu klarare:

```tsx
<div className="portal-card-eyebrow">🏁 PENSIONSVAL</div>
<div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{name}</div>
```

Code: välj variant 2 om CSS-systemet tillåter; annars variant 1.

---

### 4.3 · SeasonSignature "SKANDALSÄSONGEN" otydlig

**Plats:** `src/presentation/components/portal/secondary/SeasonSignatureSecondary.tsx` + `seasonSignatureService.ts`

**Problem:** Kortet säger "SKANDALSÄSONGEN — Fokus på spelet, inte rubrikerna". Säger inte vad som ÄR skandalsäsong (är det vår skandal? Andras? Hela ligan?). `observedFacts` är troligen tom så `getDefaultFact` fallback används.

**Fix:** Två delar:

1. **`seasonSignatureService.ts`** — när signature aktiveras vid säsongsstart, populera `observedFacts[0]` med konkret fakta. Code: hitta var signaturer aktiveras (`detectSeasonSignature`-funktion eller motsvarande). Lägg in en mening om vad som triggade. Exempel för `scandal_season`:
   ```
   "Två skandaler i ligan förra säsongen — fler väntas."
   ```

2. **Opus levererar fact-texter** för alla 6 signatur-typer baserat på trigger-villkor. Code lägger in dem i `observedFacts` när signature aktiveras.

**Acceptanskriterium:** Kortet ska aldrig falla tillbaka på `getDefaultFact` i normal användning — `observedFacts` ska alltid vara populerad vid signatur-aktivering.

---

### 4.4 · Veckans fråga-pills utan navigation

**Plats:** Portal — sannolikt `PortalEventSlot.tsx` eller liknande.

**Problem:** När flera "Veckans fråga"-kort finns syns två pills som indikator, men ingen swipe/nästa-knapp finns för att navigera mellan dem. Plus: pills läses som "redan sett" (fyllda) men de indikerar antagligen att en till finns kvar.

**Fix:** Två val:

**Variant A — Swipe/navigation:** Lägg in vänster/höger-pilar eller swipe-gester för att navigera mellan korten. Pills uppdateras till "aktiv prick" och "inaktiv prick" (klassisk pagination).

**Variant B — Stack och visa en åt gången:** Ta bort pills, visa bara EN fråga åt gången. När den löses (eller avfärdas) dyker nästa upp. Pills försvinner som UI-element.

**Code-beslut:** Variant B är säkrare initialt — tar bort förvirring. Variant A kräver designrunda. Code: implementera B först, flagga A som öppen Design-fråga.

---

## TIER 5 — GRANSKA (inte säker bug ännu)

### 5.1 · 17 mål i match (7-10)

Bandymedel 10 mål per match. 17 är extremvärde. Code: ingen åtgärd ännu — bara flagga om Jacob ser mönster i kommande playtest. Om återkommande, öppna matchengine-kalibrering som separat utredning.

---

## LEVERANSORDNING

Code arbetar i denna ordning:

1. **TIER 1 först (1.1 + 1.3).** 1.1 är ren kod-fix, kan testas isolerat. 1.3 är verifiering — rapportera vad som finns. 1.2 är Opus-jobb, parallellt.
2. **TIER 2 (2.1 → 2.5).** Var och en oberoende. 2.4 (simulera-knapp) kräver utredning innan fix.
3. **TIER 3 (3.1 + 3.2).** Grep + Opus omskrivning. Snabbt.
4. **TIER 4 (4.1 → 4.4).** Design-frågor men har konkret fix-väg.
5. **TIER 5.** Bara loggning, inte fix.

**Total estimat:** ~6–8h Code + ~1h Opus textomskrivning + ~30 min testning.

---

## ACCEPTANSKRITERIER (hela rundan)

- [ ] TIER 1.1: Eliminera managed i KF → session forsätter i spectator-läge minst 2 omgångar innan SeasonSummary
- [ ] TIER 1.2: Alla PLAYOFF_ANSLAG-varianter ersatta med Opus-text (markeras med kommentar)
- [ ] TIER 1.3: Inga komponentkraschar vid Spectator-rendering, alla pools har varianter
- [ ] TIER 2.1: Cup-elimination triggar bara `cup_done`, inte `cup_between`
- [ ] TIER 2.2: Transferfönster triggas baserat på ligaomgång, inte global matchday
- [ ] TIER 2.3: Slutspels-omgångar visar relevant label, inte "Omgång 23 av 22"
- [ ] TIER 2.4: Simulera-resten-av-säsongen-knappen finns igen (om regression verifierad)
- [ ] TIER 2.5: SeasonSummary visar SM-vinnare när managed inte är champion
- [ ] TIER 3.1: Ingen "nedsläpp" kvar i kodbasen
- [ ] TIER 3.2: "Sånt är inte gratis"-typ av text bara visas när opponent faktiskt presterar
- [ ] TIER 4.1: Halvvägs-modalen renderas innanför layouten
- [ ] TIER 4.2: Retirement-kort har tydlig eyebrow ("PENSIONSVAL" eller "KARRIÄRSAMTAL")
- [ ] TIER 4.3: SeasonSignature visar konkret fact, inte default fallback
- [ ] TIER 4.4: Veckans fråga visar en åt gången (Variant B), pills borttagna
- [ ] Alla 907+ tester gröna efter PR

---

— Opus, 2026-05-20
