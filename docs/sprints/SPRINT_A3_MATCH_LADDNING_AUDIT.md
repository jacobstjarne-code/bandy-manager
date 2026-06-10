# Sprint A3 — Match-laddning beat — audit

## Punkter i spec

- [x] **getStreakLength** exporteras från `roundCharacter.ts` — räknar bakåt i completed fixtures, bryter vid oavgjort eller byte av riktning
- [x] **matchLaddningBandShown** fält tillagt på `SaveGame` — optional, `{ matchday, streakLength, stateType }`, håller change-marker state
- [x] **computeLaddningBeat** i `matchLaddningGrind.ts` — ren funktion, inga sidoeffekter, returnerar `LaddningBeat` (scene | band | none)
- [x] **updateMatchLaddningBand** action i `gameStore.ts` — spreader game-state korrekt
- [x] **MatchLaddningScene** — fullbleed (100dvh), illustration/placeholder, top-scrim 26%/bottom-scrim 70%, eyebrow §9.1-färg, charge+relation ur textpool, stakeText-pil om säsongskontext, CTA btn-primary + radius 14
- [x] **MatchLaddningBand** — mörkt skärmfyllande, band-kort med vänster-border var(--warm), eyebrow warm-light, charge ur textpool, CTA btn-primary + radius 8
- [x] **MatchScreen.tsx** wiring — lazy initializer beräknar beat vid mount, `matchStep: 'laddning'` ny state, useEffect skriver band-state, early return levererar rätt komponent, `MatchHeader` prop-guard (`=== 'laddning' ? 'lineup' : matchStep`)
- [x] **20 grind-tester** — se simulation nedan

## Kod-verifiering

```
npx tsc --noEmit → (ingen output = inga fel)
npm test (matchLaddningGrind.test.ts) → 20/20 passed
npm test (full suite) → 1 failed (pre-existing boardMeetingScene:193) | 1092 passed
```

## Grind-logik — hur beaten sitter i render-flödet

```
MatchScreen mount
 └─ useState (lazy init)
      ├─ hittar nextFixture (nästa scheduled för managedClub)
      ├─ anropar computeLaddningBeat(game, fixture)
      │    ├─ isFinaldag → scene/final (guld eyebrow)
      │    ├─ isAnnandagen → scene/annandagen (accent eyebrow)
      │    ├─ isNyarsbandy → scene/nyar
      │    ├─ isCup || char='cup_day' → scene/cup
      │    ├─ char='pre_derby' → scene/derby (warm-light eyebrow)
      │    ├─ char='premiere' → scene/premiar
      │    ├─ bruten svit (saved.matchday ≥ currentMatchday-2) → band/broken
      │    ├─ char=winning/losing_streak && milestone-check → band/active
      │    └─ annars → none
      └─ beat.tier !== 'none' ? 'laddning' : 'lineup'

if matchStep === 'laddning' && nextFixture:
  beat.tier === 'scene' → <MatchLaddningScene ...>  (early return, inget annat renderas)
  beat.tier === 'band'  → <MatchLaddningBand ...>
  beat.tier === 'none'  → setMatchStep('lineup')  (synkront fall-through)
```

## Assets — finns vs placeholder

| Tillfälle | Asset | Status |
|-----------|-------|--------|
| annandagen | `/assets/illustrations/annandagen.jpg` | Finns i repo |
| final | `/assets/illustrations/final.jpg` | Finns i repo |
| derby | (saknar `derby.jpg`) | IllustrationPlaceholder |
| nyar | (saknar `nyarsbandy.jpg`) | IllustrationPlaceholder |
| cup | (inget asset) | IllustrationPlaceholder |
| premiar | (inget asset) | IllustrationPlaceholder |

## Svit-logik — trösklar (change-marker)

Band tänds om NÅGOT av dessa är sant:
1. Ingen `matchLaddningBandShown` sparad (first trigger)
2. Saved `stateType` är annan (svit bytte riktning)
3. Någon milstolpe i `[3, 5, 7, 10]` har korsats sedan saved.streakLength

Band tyst om: streak oförändrad och ingen milstolpe korsad.

Bruten svit: visas om `saved.matchday ∈ [currentMatchday-2, currentMatchday-1]` — fönster på 2 omgångar, sedan tyst.

Within-round-regel: om `saved.matchday === currentMatchday` med samma stateType → alltid visa (användaren navigerade tillbaka).

## Edge-cases verifierade (via kod-simulation)

- Standard/post_loss-match → tier none → direkt till lineup ✓
- Streak 2 (< tröskel 3) → tier none ✓
- Streak 3, ingen saved → trigger (first) ✓
- Streak 4, saved.streakLength=3 → tyst (ingen milstolpe) ✓
- Streak 5, saved.streakLength=3 → trigger (milstolpe 5) ✓
- Bruten svit 1 omgång sedan (matchday=4, current=5) → broken band ✓
- Bruten svit 3 omgångar sedan (matchday=2, current=5) → none (för gammalt) ✓
- isFinaldag → scene final, eyebrow var(--gold) ✓
- isAnnandagen → scene annandagen, eyebrow var(--accent) ✓
- pre_derby → scene derby, eyebrow var(--warm-light) ✓
- isFinaldag + pre_derby (priority) → scene final vinner ✓

## Commit

`b5e845e` — feat: A3 match-laddning — scen/band-beat före uppställning

Scope: 8 filer (4 modifierade + 4 nya). 849 insertioner.

## Ej verifierat (manuell playtest återstår)

- Visuell rendering av scen mot mock — pixel-jämförelse kräver levande app
- IllustrationPlaceholder-fallback ser rätt ut på derby/cup/premiar/nyår
- Scen-text (charge/relation) flödar korrekt i 375px viewport
- Staketext-pil syns (kräver säsongskontext relegation/topRace i testspel)
- CTA-knapp tryckbar och navigerar till lineup

## Nya lärdomar

Ingen ny LESSONS-lärdom — testfix-mönstret (fixture måste finnas i game.fixtures för att getRoundCharacter ska fungera) är en variant av det befintliga "fixtures-context krävs i tester"-mönstret och är inbyggt i test-kommentarerna.
