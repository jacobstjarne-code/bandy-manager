# DESIGN-BRIEF — Tysta ytorna: cupintro + hallprövning

**Datum:** 2026-09-10
**Ägare:** Design (illustration + form) → Opus (copy) → Code (wiring)
**Rad:** `design-p1-tysta-ytor` (kafferum/mecenatmiddag/styrelseultimatum klara; dessa två kvar)
**Kodläst:** `CupIntroScene.tsx` + `cupIntroScene.ts`, `HallProvningScreen.tsx` + `hallProvningData.ts`.

## De två ytorna är inte lika tysta

**Hallprövningen** är den stora luckan. Skärmen är en ren status-hub: `card-sharp`-boxar med `h-label` + värde per fas (STÖD I BYGDEN, KRAV, FÖRHANDLING, BYGGE) och "Inget är förvalt." underst. Ingen illustration, ingen atmosfär. Fel yta att lämna kall — att bygga matchhallen är klubbens största språng i hela bågen, ögonblicket bygden reser en hall. Just nu läser det som en kommunal blankett.

**Cupintron** är nästan framme. Den har redan `IllustrationScene` (header, `name="cup"`), genre-etiketten CUPEN, "Innan serien", beat-prickar och Georgia-brödtext över tre beats. Strukturen finns. Det som fattas är temperaturen i själva beats, plus att cup-illustrationen faktiskt finns som asset (om `name="cup"` renderar tomt är det den saknade biten).

## Hallprövningen — vad den behöver

Vikt utan att bli en andra beslutsyta. SCOPE-beslutet står (dokumenterat i `HallProvningScreen.tsx`): hubben är en STATUS-VISARE, vägvalen genereras som GameEvent-kort via Portal-event-pipen. Rör INTE `attentionRouter`/hallProcess-typen, dubblera inga beslut. Atmosfären läggs ovanpå status, aldrig som ny mekanik.

- **Illustration överst**, samma header-grepp som de andra tysta ytorna: hallbygget som plats — den tomma tomten, resta stommar, isen som ska in. En bild per fas vore för dyrt; en bild som bär "hallen reser sig" räcker.
- **Bygden-rösten per fas.** Faserna är i dag rena etiketter. Ge var och en en rad i lokaltidnings-/bygden-registret: förankring = orten som samlas, krav = vad som krävs innan spaden sätts, förhandling = vem som betalar, bygge = det reser sig. Opus skriver den svenskan.
- **Behåll det spröda.** "Inget är förvalt." och stöd-mätarens läsning (`STOD_LABELS`) är redan rätt ton — understatement, inte fanfar. Värm, överrösta inte.

## Cupintron — vad den behöver

- **Bekräfta eller skapa `cup`-illustrationen.** Om headern renderar tomt är det den enskilt största bristen. Cupen är pre-season, "viktig men inte allvar" — bilden bär det: småstadscupen, tidig is, inte SM-finalens tyngd.
- **Värm de tre beats.** Opus skriver om copyn i lokaltidnings-förhandsregistret: cupen som ortens första allvar för säsongen, lite skämtsam men laget vill ändå vinna. Ellips över utrop, konkret bild.
- Ceremoni-registret (Georgia, dämpat) är rätt och rörs inte.

## Vad Design bestämmer i mocken

Illustrationerna (hallbygge, cup), header-formen per yta, och hur bygden-raderna sitter i hallhubbens fas-boxar utan att bli knappar. Formen låses i mock; Opus skriver sedan all svensk copy (fas-rader + cup-beats) mot den.

## Gränser

Ingen ny mekanik, inga nya beslut, `attentionRouter`/Portal-event-pipen orörd. Konsekvent med kafferum/mecenatmiddag/ultimatum. Ingen baseline rörs innan mock.
