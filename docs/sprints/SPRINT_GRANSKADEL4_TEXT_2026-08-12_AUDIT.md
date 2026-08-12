# GRANSKA DEL 4 — Opus-text inkopplad (2026-08-12)

Uppföljning till `SPRINT_GRANSKADEL4_STEG345_AUDIT.md`. All text som listades som `[Opus]`-platshållare där är nu ersatt med den levererade texten, ordagrant.

## Turneringsläge (`turneringslageService.ts`)
Två separata textkartor (`CUP_TEXT`, `SLUTSPEL_TEXT`) istf en delad — samma läge har olika ord ("Cupen är över för den här gången" mot "Säsongen är slut"). `getTurneringslageText(mode, tavlingstyp)` väljer rätt karta. Låst med enhetstest (`turneringslageService.test.ts`, 26 tester totalt) mot exakt den levererade strängen per läge.

## Fast-lägets prosa (`helpers.ts`)
Tre pooler, sex strängar (seger/förlust var). En rotorsaksbugg hittades och fixades under inkopplingen: `fixture.homeScore`/`awayScore` är alltid LIKA på en straffavgjord match — en ren poängjämförelse hade klassat en vunnen cupsemifinal-final på straffar som "oavgjort" och visat FEL sträng (ingen av de två). `won`/`lost` härleds nu OT-/straffmedvetet, samma logik `GranskaScreen.tsx` redan använder (återanvänd, inte omskriven) — gäller alla `isKnockout`-matcher, inte bara final-grenen.

Avsked fick bara seger/förlust-text (inget oavgjort-fall levererat) — till skillnad från final/slutspel (alltid `isKnockout`, alltid avgjort via övertid/straff) kan en avskedsmatch vara en äkta oavgjord ligamatch. Ett sådant fall faller igenom till den befintliga default-prosan istf en gissad tredje variant — flaggat i kommentar, inte tyst antaget.

## Browser-verifierat
- `granska-sm-final`: "Det var finalen. Ni tog den." + "Svenska mästare."
- `granska-cup-final`: "Det var finalen. Ni tog den." + "Cupen är er." (cupBracket wired i scenen specifikt för att bevisa cup-grenen levande, inte bara i enhetstest — se nedan)
- `granska-slutspel`: "Slutspel. Det märks på tempot."

Wired en `cupBracket` i `granska-cup-final`-scenen (fanns inte innan — scenen byggdes före Turneringsläge existerade) så cup-grenen av Turneringsläge-kortet nu har en levande baseline, matchande vad som redan gjordes för SM-final-scenens `playoffBracket`.

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1541/1541 gröna (155 filer).
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design` / `lint:text-guard`: gröna (den nya svenska texten är grep-ren).
- Browser-verifierat tre scener, skärmdumpar i sessionens scratchpad.

## Fortsatt öppet (från förra auditen, oförändrat)
1. Serie-/bracketblock — väntar på mock eller go-ahead för text-only-version.
2. Omgångssammanfattning i cup ("+31 tkr/omg") — väntar på ✕ eller ordbyte.
3. Fullständig fysisk avgrening av avsked-tributen — väntar på prioritering.
