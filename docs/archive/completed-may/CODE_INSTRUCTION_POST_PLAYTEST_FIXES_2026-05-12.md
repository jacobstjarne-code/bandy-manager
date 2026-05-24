# CODE — Post-playtest fixes (Stålvallen + Granska)

**Datum:** 2026-05-12
**Författare:** Opus
**Status:** SPEC — fyra fixar från Jacobs playtest av 0ace170

---

## Sammanfattning

Jacob spelade live-match med Stålvallen-bygget. Det mesta funkar nu — bezel, LED-färger, copper-mål-rader, mittpanelens kontroller, INTENSIVT-bar. Men flera detaljer skaver fortfarande, plus en bugg på Granska-skärmen.

Fyra fixar:

- **FIX-22:** Commentary feed-ordning — senaste händelse ska ligga ÖVERST (reverse-chronological)
- **FIX-23:** Scoreboarden känns "otight" — minska margin/padding, LED-siffror matchar inte mocken
- **FIX-24:** Tidslinje-modulens redundans — ta bort "47' — NU" (samma som klockan) och "X mål · Y utv" (oklart värde)
- **FIX-25:** Granska-bugg — "Stjärnprestation" pekar på fel spelare och har märklig text om "baracker tre"

---

## FIX-22 · Commentary feed reverse-chronological

**Fil:** `src/presentation/components/match/commentary/CommentaryFeedStalvallen.tsx` ELLER `MatchLiveScreen.tsx` (där rows mappas in)

### Problem

I dagens implementation visas senaste händelse längst NED i feeden — kronologisk ordning (oldest first). Jacob vill att senaste händelse ska ligga ÖVERST (newest first). Det är vanligaste mönstret för live-commentary i sportappar.

### Fix

Sätt `rows` i reverse-chronological ordning innan de skickas till `CommentaryFeedStalvallen`. Två sätt:

**A. I MatchLiveScreen (där rows byggs):**
```ts
const feedRows: FeedRow[] = useMemo(() => {
  const built = []
  for (const step of displayedSteps) {
    // ... mappar event/atmosphere rows ...
  }
  return built.reverse()  // newest first
}, [displayedSteps])
```

**B. I CommentaryFeedStalvallen (defensiv reverse innan render):**
```ts
const orderedRows = useMemo(() => [...rows].reverse(), [rows])
return (
  <div ref={containerRef} className="commentary-feed">
    {/* ... */}
    {orderedRows.map((row, i) => (...))}
  </div>
)
```

**Min rekommendation: A** — gör det vid källan, så CommentaryFeedStalvallen förblir en ren render-komponent som visar vad den får.

### Auto-scroll

Verifiera att `autoScroll`-beteendet fungerar med reverse-ordningen. Idag scrollar feeden förmodligen till botten vid ny rad — efter fix ska den scrolla till TOPPEN. Eller bara säkerställa att top-rader ALLTID syns när användaren inte aktivt scrollat.

Tips: ändra ref-strategin från `scrollTop = scrollHeight` till `scrollTop = 0` när ny rad läggs till.

### Acceptanskriterier

- [ ] Senaste händelse (högst minut) visas överst i feeden
- [ ] Äldre händelser staplas neråt
- [ ] Auto-scroll håller senaste händelse synlig vid mount eller ny rad
- [ ] Atmosphere-rader och event-rader behåller sin relativa ordning

---

## FIX-23 · Scoreboarden känns "otight" + LED-siffror

**Fil:** `src/presentation/styles/stalvallen-match.css`
**Komponent:** `src/presentation/components/match/scoreboard/ScoreboardStalvallen.tsx`
**Mock:** `docs/match-live-bundle/match-live-stalvallen.html` (öppna i webbläsare för pixel-jämförelse)

### Problem

Jacob beskriver scoreboarden som "otight" — för mycket vertikal yta, moduler känns inte sammanhållna. Plus: LED-siffrorna i bilderna är mer "fyrkantiga/blocky" än mockens skarpa 7-segment-stil.

### Hypoteser att verifiera mot mocken

1. **`.module-main` padding:** kollar mocken — borde vara `12px 14px` eller `10px 14px` (kompaktare). Idag kanske `14px 16px 16px`.

2. **`.main-row gap`:** mocken har `gap: 14px` mellan home-col/sep-col/away-col. Verifiera. Om för stor → minska till 10-12px.

3. **`.time-row margin-top`:** mocken har `margin-top: 12px` och `padding-top: 10px`. Verifiera att border-top är synlig (1px rgba(255,42,24,0.08)) — om border är fel färg blir time-row svävande utan koppling till score-raden.

4. **SevenSegText storlek:** öppna `sevenSegment.tsx` och verifiera att `size: 'lg'` ger samma dimensioner som mockens `--seg-w-lg: 27px; --seg-h-lg: 45px`. Om viewBox eller stroke-width skiljer → siffrorna ser annorlunda ut.

5. **`.module-line padding`:** mocken har `padding: 14px 16px 12px`. Idag kan vara större. Minska om så är.

6. **Bezel-gradient höjd:** verifiera att `.board-system` har `padding: 1px` (inte mer) så bezel-effekten blir tunn, inte rejäl ram.

### Konkret action

Öppna mocken i webbläsare. Öppna live-vyn i webbläsare. Använd DevTools för att jämföra computed CSS sida-vid-sida. Identifiera fyra största pixel-gap. Justera CSS-värdena.

Det är inte ett klart bug-fix — det är en pixel-audit. Resultatet ska vara att scoreboarden i live-vyn ser identisk ut med mocken vid samma viewport-bredd.

### Acceptanskriterier

- [ ] `.module-main` padding matchar mocken (verifierad i DevTools)
- [ ] `.main-row` och `.time-row` har rätt gap/margin enligt mocken
- [ ] SevenSegText 'lg' har samma dimensioner som mockens `--seg-w-lg` / `--seg-h-lg`
- [ ] Bezel är synlig men tunn (1px padding, inte 4px)
- [ ] Scoreboarden tar EN gemensam vertikal yta utan extra mellanrum mellan moduler

---

## FIX-24 · Tidslinje-modulens redundans

**Fil:** `src/presentation/components/match/scoreboard/ScoreboardStalvallen.tsx`
**Specifik sektion:** `.module-line` (timeline-modulen)

### Problem 1: "47' — NU" i line-head är redundant

Klockan på scoreboarden visar redan "47:00" med "HL2" period-mark. Att duplicera "47' — NU" i timeline-headet ovanför själva tidslinjen är onödig information.

**Action:** Ta bort `.line-now`-spanen från `.line-head`. Behåll bara `.line-title` ("MATCHEN").

```tsx
{/* FÖRE */}
<div className="line-head">
  <span className="line-title">MATCHEN</span>
  <span className="line-now">{minute}′ — NU</span>   {/* TA BORT */}
</div>

{/* EFTER */}
<div className="line-head">
  <span className="line-title">MATCHEN</span>
</div>
```

### Problem 2: "X mål · Y utv" meta-text i line-feet är oklar

`.line-feet` har idag tre delar: home-pill, meta (`"4 mål · 0 utv"`), away-pill. Meta-texten är förvirrande — vad är det för "X mål · Y utv"? Det säger inte spelaren något användbart. Jacob: "vad är det bra för?"

**Action:** Ta bort meta-span från `.line-feet`. Behåll bara home-pill och away-pill.

```tsx
{/* FÖRE */}
<div className="line-feet">
  <span className="home-pill">{homeClubFullName}</span>
  <span className="meta">{homeScore} mål · {homePens.length} utv mot</span>  {/* TA BORT */}
  <span className="away-pill">{awayClubFullName}</span>
</div>

{/* EFTER */}
<div className="line-feet">
  <span className="home-pill">{homeClubFullName}</span>
  <span className="away-pill">{awayClubFullName}</span>
</div>
```

Resultat: `.line-feet` blir bara två lag-pills (en till vänster, en till höger) med justify-content: space-between. Renare, mindre brus.

### Acceptanskriterier

- [ ] `.line-head` visar bara "MATCHEN" — ingen tidsangivelse
- [ ] `.line-feet` visar bara två klubbnamns-pills — ingen meta-text mitt emellan
- [ ] Tidslinjen själv är oförändrad (mål-prickar, now-cirkel, tick-marks)

---

## FIX-25 · Granska-bugg: Stjärnprestation pekar på fel spelare + märklig text

**Källfiler att hitta:** Sök i `src/domain/services/` efter funktion som genererar event med `title: 'Stjärnprestation'` eller liknande. Troliga kandidater:
- `playerVoiceService.ts`
- `playerNotesService.ts`
- `postVictoryNarrativeService.ts`
- `narrativeService.ts`
- `postMatchEventService.ts`
- `events/eventFactories.ts`

Plus: sök efter texten `"baracker"` eller `"barack tre"` i hela `src/` — det är en distinkt fras som ska gå att hitta.

### Problem 1: Logik-bugg — fel spelare som "stjärna"

Match-rapporten Image 4 visar att Viggo Laitinen är "Stjärnprestation" med rating 9.5, medan S. Hedlund har rating 10.0 (högre). Stjärnprestationen ska peka på spelaren med HÖGSTA rating, inte näst högsta.

**Action:** Hitta funktionen som väljer star-performer. Verifiera att den sorterar på `ratings[id]` descending och tar `[0]` (eller motsvarande). Om logiken är `>= 9.0` random pick → fixa till strict max.

**Notering:** Om det är AVSIKTLIGT att stjärnan kan vara annan än högsta rating (t.ex. lägsta-förväntat-presterande som överraskar) — säg till Jacob i rapporten. Annars är det en bugg.

### Problem 2: Märklig text "gick i baracker tre, tog en kaffe..."

Texten i event-bodyn lyder: *"Viggo Laitinen gick i baracker tre, tog en kaffe, satte sig vid fönstret. Ingen störde. Rating: 9.5."*

"Baracker tre" är inte bandy-vokab — det låter som något från en byggarbetsplats eller militärlägret. "Gick i baracker tre" är konstigt — bandyspelare går i omklädningsrum, inte baracker.

**Hypoteser:**
- Templaten kommer från en annan kontext (kanske trainingScene eller motsvarande) och har felaktigt återanvänts
- "Baracker" är ett ord som någonstans ersätter "omklädningsrum" eller "klubbhuset" — typografi-bugg
- Texten är från en placeholder som glömdes bort i development

**Action:** 
1. Hitta texten ordagrant i kodbasen
2. Ersätt med riktig Sture-Forsbacka-tonal text om star performance, t.ex.:
   - "Tre mål i en match. Klubbhuset pratade om det i en vecka."  *(för spelare med 3 mål)*
   - "Viggo Laitinen rörde sig dit bollen kom att hamna. Ovanligt instinktiv."  *(för halvbacks/mittfält)*
   - "Det var en sån prestation man minns. Och kanske oroas av — vem köper honom efter det här?"  *(för star med hög rating)*
3. Lämna en `TODO:`-kommentar att specen från Opus ska skriva om templaten Sture-tonalt — så jag kan ta över text-arbetet i nästa pass

### Acceptanskriterier

- [ ] Stjärnprestation pekar på spelaren med HÖGSTA `ratings[id]`-värdet (efter sortering desc)
- [ ] Texten "baracker tre" och variationer av "gick i baracker" är borttagna ur kodbasen
- [ ] Placeholder-text är ersatt med rimlig svensk bandy-tonal text (gärna med TODO-kommentar för text-iteration)
- [ ] Befintliga 760 tester gröna

---

## Vad du INTE ska göra

- **Inte modifiera** scoreboard-strukturen (board-system, modules) — det är fortfarande rätt arkitektur
- **Inte modifiera** sevenSegment-komponenten internt — det är bara CSS-värden och storlek som ska justeras
- **Inte ta bort** tidslinjen — bara redundansen i `.line-head` och `.line-feet` ska bort
- **Inte ta bort** Stjärnprestation-eventet helt — bara fixa logiken och texten

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. Tre commits rekommenderat: FIX-22+24 (commentary order + timeline cleanup), FIX-23 (scoreboard pixel-audit), FIX-25 (Granska-bugg).

Flagga:
- Om FIX-22 kräver ändring i autoscroll-logik
- Om FIX-23 visar att SevenSegText-storlekar är fel (kräver fix i sevenSegment.tsx — vilket är OK men säg till)
- Om FIX-25 stjärn-logiken redan väljer högsta rating men något annat trasslar — då är det en separat bugg
- Var "baracker"-strängen ligger så Opus kan skriva om template
