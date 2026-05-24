# CODE_INSTRUCTION — MATCH-VY AUDIT 2026-05-12

**Scope:** Live-match-flödet — Scoreboard, MatchControls, CommentaryFeed, HalftimeModal, alla 5 InteractionShell-baserade interaktioner, slutskärm.
**Referens:** `docs/match-live-bundle/IMPLEMENTATION-SPEC.md` + 5 mockfiler i samma mapp.
**Status efter playtest 2026-05-12:** Mycket implementerat, betydande drift i 4-5 specifika ytor.

---

## 1. SAMMANFATTNING AV AUDIT

**Klart och OK:**
- ✅ Scoreboard pixel-värden (FIX-23 mot mock-tokens 27×45 / 14×24)
- ✅ Scoreboard timeline rensad (FIX-24 borttog `.line-now` och `.meta`)
- ✅ Commentary feed reverse-kronologisk (FIX-22)
- ✅ Alla 5 InteractionShell-baserade komponenter har taktiktavla i SVG med LED-palett enligt mock
- ✅ Mekanik orörd i alla interactions (services intakta)
- ✅ FIX-30 (andra halvlek auto-start) inline-fixat
- ✅ FIX-31 (klock-tick + sekunder) inline-fixat
- ✅ FIX-32 (kafferum-loop) inline-fixat

**Driftområden — kräver åtgärd:**

| Område | Drift-grad | Var |
|---|---|---|
| Slutskärm | KRITISK — saknar 95% av mocken | MatchLiveScreen matchDone-block |
| Ticker-modul | Redundant info | ScoreboardStalvallen ticker-prop |
| Hint "Matchen rullar..." | Persistent, ingen fade | MatchLiveScreen FirstVisitHint |
| Klocka rullar inte jämnt | Hoppar mellan steps trots FIX-31 | MatchLiveScreen tickrate 1500ms för långsam |
| Livehändelser för kort tid | baseDelay 1100-2200ms ger ingen reaktionstid | MatchLiveScreen useMatchTimer.ts delays |
| Legend under tidslinje | Redundant (.line-feet horisontella prickar) | ScoreboardStalvallen line-feet |
| Commentary färgkontrast | För ljus mot mörk bakgrund | CommentaryFeedStalvallen text-color |
| Commentary typsnitt | Verifiera — mocken vill ha system-ui sans (--font-body), inte serif | CommentaryFeedStalvallen row-text font-family |
| "Commentary"/"Scroll" rubrik | Fel ord — ska vara "Matchflöde" | CommentaryFeedStalvallen feed-head |
| Klocka + ställning bredvid | Layout-refactor möjlig | ScoreboardStalvallen module-main |

---

## 2. PRIORITERINGSORDNING

**Prio 1 — Återinför slutskärm (FIX-33):** Mocken är fullständigt specad i `match-report-stalvallen.html`. Den ÄR matchens slutkänsla. Implementationen visar bara en knapp. Det är inte acceptabelt.

**Prio 2 — Klockan rullar jämnt (FIX-34):** FIX-31 implementerades men 1500ms är för långsamt vs step-delay 1100-2200ms. Klockan hinner inte ifatt. Justera till 1000ms och ta bort `nextStep.minute - 1` cap.

**Prio 3 — Livehändelser delay (FIX-35):** Användaren hinner inte agera. Öka baseDelay för interactive events till ~5000ms.

**Prio 4 — Atmosfärisk ticker (FIX-36):** Ersätt redundant resultat-string med roterande väder + recent events + andra ligamatcher.

**Prio 5 — Hint försvinn efter 12s (FIX-37):** Lägg fade-out efter 12s, inte permanent visning.

**Prio 6 — Designjusteringar (FIX-38):** Legend, kontrast, typsnitt, "Matchflöde"-rubrik. Buntar ihop som ett block.

---

## 3. FIX-SPECIFIKATIONER

### FIX-33 — Återinför slutskärm enligt mock

**Var:** `MatchLiveScreen.tsx` rad ~1255 (`{matchDone && !isSmFinal && !isCupFinal && ...}`-blocket).

**Vad finns idag:** Bara en `<button>Se sammanfattning →</button>` som navigerar till `/game/review`.

**Vad mocken specar (`match-report-stalvallen.html`):** Två lager:

**LAGER 1 — TAVLAN (top):** ScoreboardStalvallen i FT-state. NU-pricken borta (`showNowMarker={false}` redan korrekt när `matchDone`), textremsan still på sammanfattning ("SLUT 4—2 · FORSBACKA VINNER DERBYT · KRONBERG 2 MÅL"), tidslinjen full med alla mål-prickar och utvisnings-band. Cup/SM-finals får dessutom ett `final-band` ovanför.

**LAGER 2 — PAPPRET (under):** `paper-warm` (#F5F1EB) bakgrund. Innehåller, uppifrån och ner:

1. **Arena-rad** (mono ink-mute, centrerad, dot-separerad):
   `SLAGGHÖGEN · 18 NOV 18:30 · 3 247 ÅSKÅDARE` (åskådare i copper)

2. **Story-block:**
   - Rubrik: `MATCHENS BERÄTTELSE` i mono-copper med korta streck före/efter
   - Body: Georgia serif 14.5px, line-height 1.65, ink-färg, max ~80 ord
   - För 0-0: `.story-body.muted` (italic, ink-soft)
   - För vinst med "vändning"-mönster: `<em>` på "Seger efter vändning" i copper-deep

3. **Events-lista:**
   - Section-head: `HÄNDELSER · 6 mål · 1 utv` (mono ink-mute)
   - Per event: `MIN' | LED-stämpel | spelarnamn (assistgivare) klubb-kod`
   - LED-stämplar (4 typer): `MÅL` (ink bg), `HÖRNA` (copper bg), `STRAFF` (copper-deep bg), `UTV` (steel-deep bg)
   - Vid 0-0: tom `events-empty`-box med `INGA MÅL · INGA UTVISNINGAR` (mono uppercase) + ärlig sub-rad (display italic)

4. **Hörn-band** (bara om managed-klubben gjort minst 1 hörnmål):
   - Copper-vänsterkant + copper-tonad gradient
   - Big number (display 22px copper-deep) + "hörnmål av X hörnor" (body) + mini-rad (mono mute) "Forsbacka X — Motståndare Y"

5. **Spelarbetyg-strip:**
   - Section-head: `SPELARBETYG · 22 spelare`
   - POTM (Player Of The Match) först — ★-mark + copper-gradient bakgrund + copper-text
   - Övriga rader: tröjnummer (mono ink-faint), position-pill (CTR/FW/DEF/GK), namn (display 13px, fars-initial i ink-mute), klubb-prick (copper för managed, steel för motståndare), färgkodad bar (röd/amber/grön), betyg-siffra (display 14px)
   - Bars: röd <6, amber 6-7, grön ≥7
   - Sorterade fallande på betyg

6. **Ratings-foot:** `SORT · BETYG ↓` + legend `≥7 / 6–7 / <6` med färgade rektanglar

7. **CTA-knapp:** `Fortsätt →` (copper-gradient, 12px radius, samma som .btn-primary i designsystemet)

**Datakontrakt:** Kontraktet är redan tillgängligt — `steps[]`, `playerRatings`, `lastStep.shotsHome/Away`, `fixture.attendance`, klubbar, players, etc. Allt finns i komponenten redan.

**Strukturella krav:**
- Hela slutskärmen renderas DIREKT i MatchLiveScreen när `matchDone === true` och inte SmFinal/CupFinal (för dessa körs ceremonier istället)
- Scrollbar inom huvuddiv:en — användaren ska kunna scrolla från tavlan ner till spelarbetyg
- Mobile-optimerat (380px bred, ratings vertikalt)

**Acceptanskriterier:**
- 0-0-test håller layouten (events-empty syns)
- Hörn-bandet göms om managed inte gjort hörnmål
- POTM-rad är synlig och har copper-bakgrund + ★
- Story-text använder Georgia serif, inte LED-mono

**Story-generering:** Skapa en hjälpfunktion `generateMatchStory(lastStep, events, managedClubName, oppName, isWin, hasOvertimeWin, scorerHighlights)` som returnerar en 1-2 meningars story. Variantmönster från mocken:
- Vinst: "Övertygande seger mot {opp}. {Top scorer} stod för {N} mål och var bästa man på plan."
- Förlust: "Förlust mot {opp} — {score}. {Their top scorer} stod för {N} mål och {opp} hade kontroll redan från kvarten."
- Förlängningsvinst: "Seger efter vändning — ni låg under {tidigare} i andra halvlek men tog det till slut."
- 0-0: "Oavgjort — ni delade poängen med {opp}. Defensivkamp där båda målvakterna stod för stora räddningar."

---

### FIX-34 — Klockan rullar jämnt

**Var:** `MatchLiveScreen.tsx` rad ~263 (displayed-minute-tick useEffect)

**Idag:**
```ts
setInterval(() => {
  setDisplayedMinute(m => {
    const nextStep = steps[currentStep + 1]
    if (!nextStep) return m + 1
    return Math.min(m + 1, Math.max(nextStep.minute - 1, m))
  })
}, 1500)
```

**Problem:** 1500ms är för långsamt vs step-delay 1100-2200ms. Klockan hinner inte ifatt step.minute, fastnar på `step.minute - 1`.

**Fix:**
```ts
setInterval(() => {
  setDisplayedMinute(m => {
    const nextStep = steps[currentStep + 1]
    if (!nextStep) return m + 1
    return Math.min(m + 1, nextStep.minute)  // tillåt att nå nästa step's minute
  })
}, 1000)  // 1000ms istället för 1500ms
```

**Acceptanskriterier:** Klockan rullar 0:00 → 0:01 → ... → 1:00 → 1:01 jämnt. Sekunder fortsätter ticka 0-59 inom varje minut (FIX-31 oförändrad).

---

### FIX-35 — Livehändelser delay

**Var:** `MatchLiveScreen.tsx` useMatchTimer-effekten, baseDelay-beräkningen runt rad ~340.

**Idag:**
```ts
const baseDelay = isFastForward ? 50
  : step.phase === 'penalties' ? 2000
  : hasGoal ? 3500
  : hasSuspension ? 2000
  : hasSave ? 1800
  : isTight ? 1000
  : isLate ? 1100
  : step.intensity === 'high' ? 2200
  : step.intensity === 'medium' ? 1200
  : 1400
```

**Problem:** För INTERACTIVE events (corner/penalty/counter/freekick/lastMinute) hinner användaren inte se kortet innan timer-effekten kör vidare.

**Faktum:** Timern PAUSAR korrekt när `activeCorner` etc är satta (return-statementet runt rad 308). Problemet är något annat — kanske att active-state nollställs för snabbt i handleX-funktionerna.

**Verifiera:** Är problemet att timern inte pausar tillräckligt länge, ELLER att timern fortsätter efter handleX körts utan att användaren hunnit se outcome-fasen? Kontrollera om `phase === 'revealed'` (~600ms efter onChoose) räcker för att läsa outcome-text.

**Förslag fix:** I varje `handleCornerChoice`/`handlePenaltyChoice`/etc — efter `setCurrentStep(prev => prev + 1)`, lägg till en kort delay (1500-2000ms) innan nästa step rullar:
```ts
setTimeout(() => setCurrentStep(prev => prev + 1), 1500)
```
Detta ger användaren tid att läsa outcome-meddelandet innan feed:en rullar vidare.

**Acceptanskriterier:** Användaren hinner läsa "MÅL!"-bekräftelsen efter ett straffmål innan klockan tickar vidare.

---

### FIX-36 — Atmosfärisk ticker

**Var:** `MatchLiveScreen.tsx` ~rad 1218, `ticker`-prop till `ScoreboardStalvallen`.

**Idag:**
```ts
ticker={[`${homeShort} ${homeScore} – ${awayScore} ${awayShort}`]}
```
(Redundant — samma info som scoreboarden själv visar.)

**Mål (variant B):** Roterande atmospheric data. Visa 4-5 spans som scrollar horisontellt.

**Data-källor:**
1. **Väder + temperatur:** Från `matchWeather.weather` — `−5° · SNÖFALL · VIND 3M/S`
2. **Publik:** Från `fixture.attendance` — `PUBLIK 1 240`
3. **Senaste händelser:** De 2-3 senaste mål/utvisningar i feeden — `23' BJÖRK MÅÅL · 31' UTV SÖDERF`
4. **Andra matcher i samma omgång:** Från `game.fixtures` filtrerat på `roundNumber === currentRound && status === 'completed' && !isCup` — `GAGNEF 2-1 HÄLLEFORS · KARLSBORG 0-0 SLOTTSBRON`
5. **Hint atmosphere:** Vid HL2 om streak ≥3 — `FORSBACKA OBESEGRADE 5 RAKA` eller liknande

**Logik:** Roterande array som regenereras varje 10 sekunder. Span-färger varierar — full LED-röd för vissa, `class="dim"` för andra (mocken har båda).

**Format för ticker-prop:**
```ts
ticker={buildAtmosphericTicker({
  weather: matchWeather?.weather,
  attendance: fixture.attendance,
  recentEvents: feedRows.slice(0, 3),
  otherLeagueResults: game?.fixtures.filter(...),
  streak: computeRecentStreak(game),
})}
```

**Acceptanskriterier:** Inga redundanta resultat-strings. Ticker visar väder + minst en non-redundant data-rad.

---

### FIX-37 — Hint försvinn efter 12s

**Var:** `MatchLiveScreen.tsx` rad ~1233, `FirstVisitHint`-komponenten.

**Idag:** `<FirstVisitHint screenId="matchLive" text="..." onDismiss={...} />` visar tills användaren stänger med ×.

**Fix:** Lägg till auto-dismiss efter 12s i `FirstVisitHint` (eller wrap:a med en lokal `setTimeout`). Plus fade-out animation (opacity 1 → 0 över 800ms).

**Alternativ — i MatchLiveScreen:**
```ts
const [hintVisible, setHintVisible] = useState(true)
useEffect(() => {
  const t = setTimeout(() => setHintVisible(false), 12000)
  return () => clearTimeout(t)
}, [])

{hintVisible && game && !(game.dismissedHints ?? []).includes('matchLive') && (
  <FirstVisitHint ... />
)}
```

**Acceptanskriterier:** Hint försvinner mjukt efter 12 sekunder. × fungerar fortfarande för manuellt stängning.

---

### FIX-38 — Designjusteringar (4-pack)

**38A. Legend under tidslinje borttagen.**
`ScoreboardStalvallen` `.line-feet` har två lag-pills (Forsba/Söderf med prickar). De är samma färg som mål-prickarna i timeline. Redundant.

Fix: Ta bort `.line-feet`-blocket helt från `ScoreboardStalvallen` (det finns två pills + en meta-rad). Spar 18-20px vertikal höjd.

**38B. Commentary färgkontrast.**
Idag har commentary-rader för svag kontrast mot läder-bakgrunden. Mocken har `color: #E6DDD0` (warm white) för text och `color: #FFAA00` för minute-kolumn.

Fix: Kontrollera nuvarande färger i `CommentaryFeedStalvallen` body-text. Sätt till `#E6DDD0` för regular rows och behåll copper-tint för goal-rader. Verifiera kontrast-ratio ≥ 4.5:1 mot bakgrund.

**38C. Commentary typsnitt.**
Mocken specar `--font-body: system-ui, -apple-system, sans-serif` för row-text. Verifiera att `.row .text` i CommentaryFeedStalvallen inte använder `--font-display` (Georgia serif) av misstag. Om så är fallet — byt till `--font-body` för body-text. Minute-kolumnen behåller `--font-mono` (Courier New).

Atmosphere-rader får dock vara `font-style: italic` enligt mock.

**38D. "Commentary"/"Scroll" → "Matchflöde".**
I `CommentaryFeedStalvallen` feed-head finns det förmodligen två strings:
- Vänster: "COMMENTARY" — ändra till `"MATCHFLÖDE"`
- Höger: "SCROLL ↑" — behåll om det är scroll-indikator

Sök i komponenten efter den exakta strängen och ersätt.

---

## 4. VERIFIKATION

**Före commit:**
- Kör `npm run lint` och `npm run typecheck` (eller motsvarande)
- Pixel-audit i Chrome DevTools mot `docs/match-live-bundle/match-live-stalvallen.html` öppnad i annan tab
- Lägg deras viewports sida vid sida vid 380px bredd

**Per FIX:**

- **FIX-33:** Spela en match till slutet. Slutskärmen ska visa tavla (FT-state) + papper med arena-rad, story, events, hörn-band (om aktuellt), spelarbetyg-strip med POTM, ratings-foot, CTA. Stresstesta med 0-0-match — ska visa events-empty.
- **FIX-34:** Spela 30 sekunder. Klockan ska gå från 00:00 → ca 02:00 utan att synas hoppa.
- **FIX-35:** Trigga en hörn-interaktion. Användaren ska ha 3 sekunder att klicka. Efter klick visa outcome 1.5 sekunder innan klockan tickar vidare.
- **FIX-36:** Verifiera att ticker visar minst en non-resultat-string (väder, publik, eller annan match).
- **FIX-37:** Starta match. Hint syns 12s, försvinner sen mjukt. × fungerar fortfarande.
- **FIX-38:** Inga lag-pills under tidslinje. Commentary-text läsbar i mörker. "MATCHFLÖDE"-rubrik istället för "COMMENTARY".

---

## 5. KRITISKA INSTRUKTIONER

**Mekaniken är ORÖRD.** Alla services (cornerInteractionService, penaltyInteractionService, counterAttackInteractionService, freeKickInteractionService, lastMinutePressService) behåller sina rates, modifierare och defaults. Bara presentationen ändras.

**Lärdom från tidigare audits:**
- Läs PARENT-skärmfilen först (MatchLiveScreen.tsx är PARENT till alla interaction-komponenter)
- Verifiera mot mocken i Chrome DevTools, inte mot minnesbild
- Pixel-audit kräver att båda viewports öppnas vid samma bredd

**Rapportera per FIX med ✅ / ⚠️ / ❌ + en mening.** Tre commits rekommenderat:
1. FIX-33 + FIX-34 + FIX-35 (interaktivitet och slutskärm)
2. FIX-36 + FIX-37 (ticker och hint)
3. FIX-38 (designjusteringar)

**Slutskärmen (FIX-33) är största jobbet** — räkna med 2-4 timmar bara där. De andra är 30-60 min vardera.
