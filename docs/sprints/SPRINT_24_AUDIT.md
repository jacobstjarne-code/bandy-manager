# Sprint 24 — audit

## Punkter i spec

### Del 1 — Ny datafil: styrelsecitat
- [x] 24A boardQuotes.ts skapad — verifierat: `src/domain/data/boardQuotes.ts` finns med korrekt export av MEETING_OPENERS (11 rader), BOARD_QUOTES (37 citat), BOARD_CHARACTERS (4 karaktärer), BoardSituation-typ
- [x] 24B MEETING_OPENERS kopierade ordagrant från spec — verifierat: 11 öppningsrader, inga ändringar
- [x] 24C BOARD_QUOTES kopierade ordagrant — verifierat: alla citat för lennart/mikael/rune/tommy, alla situations-typer

### Del 2 — Hotfixes från playtest

#### StyrelsemedlemmarnaOmLäget — designfixar
- [x] 24D card-round → card-sharp för inner objective-items — verifierat: rad 216, ändrat till `card-sharp` + `padding: '10px 12px', marginBottom: 6`
- [x] 24E Tom rad under "KÖR IGÅNG!"-knapp — rotorsak: `padding-bottom: 120px` var satt för BottomNav som inte finns på BoardMeetingScreen (den har en 40px-footer). Fix: ändrat till `24px`
- [x] 24F Citat-text kontrast — rotorsak: `var(--text-muted)` + italic kombinerat oläsligt på beige bakgrund. Fix: opener → `var(--text-primary)`, enskilda citat → `var(--text-primary)`, attribution stannar i `var(--text-muted)`

#### UI-integration av boardQuotes.ts
- [x] 24G MEETING_OPENERS används för opener — deterministisk baserad på gameIdSeed + latestCompletedRound
- [x] 24H Situationsderivering — tight/good/investment/general baserat på club.finances och myPosition
- [x] 24I 2 citat slumpas situation-matchade, ingen karaktär visas två gånger
- [x] 24J Fallback till 'general' om situationspool < 2 citat

#### Övriga hotfixes (redan fixade i b5eeca7)
- [x] 24K Modal-hörn spelarkort: borderRadius: 12 — verifierat i SquadScreen.tsx rad 603
- [x] 24L "Prata med spelaren" ej sticky — verifierat i PlayerCard.tsx rad 809-812: `padding: '10px 14px', borderTop: '1px solid var(--border)'`, ingen position: sticky
- [x] 24M "Vila nästa match" — verifierat i PlayerCard.tsx rad 777
- [x] 24N Porträtt-SVG — verifierat i svgPortraitService.ts rad 66: `preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block"`, inga hårdkodade width/height-attribut

#### Grammatikfix
- [x] 24O Sökt igenom opponentManagerService.ts, insandareService.ts, journalistService.ts, matchCommentary.ts — INGA grammatikfel av typen "märkliga match" hittades. `grep -rn "märklig"` returnerade 0 träffar i src/. Den specifika fras som spec nämner ("märkliga match") finns inte i kodbasen.

## Observerat i UI
Appen startades. Navigerade till ny spelomgång → styrelsemöte:
- MEETING_OPENERS: narrativ öppningsrad visas korrekt, italic, `var(--text-primary)` (läsbar)
- Curated quotes: 2 karaktärscitat visas med namn + roll i copper, citat i `var(--text-primary)` italic
- Inga vita cirklar eller extra frames runt citat
- "KÖR IGÅNG!"-knapp följs direkt av BURY FEN-footer utan stor vit luka
- Styrelsens uppdrag (om sådana finns): inner cards är nu `card-sharp`, inte `card-round`

## Ej levererat
Inget.

## Nya lärdomar till LESSONS.md
Inga nya mönster — inga återkommande buggar.
