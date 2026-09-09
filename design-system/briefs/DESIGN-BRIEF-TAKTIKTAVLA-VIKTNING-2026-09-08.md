# DESIGN-BRIEF — taktiktavlans viktning + primär-hierarki (mot BYGGD V2)

**Datum:** 2026-09-08 · **Av:** Opus · **Kör:** Design · **Bygger:** Code efter dom · **Grund:** `sluttest-a8-viktning`, `ci-en-primary-taktik-hierarki` (MASTER), `DOM_FORMATIONER_V2_2026-09-04`.

## Viktig förutsättning: V2 STÅR — mocka mot den, inte en spec

`DOM_FORMATIONER_V2` är BYGGD (2026-09-04, commit `18ff34e3`, verifierad). Så det finns inget att vänta på och inget att köra "parallellt" med — taktiktavlan är upplåst att mockas NU, mot den faktiska byggda tavlan. Det som gjorde raden gejtad (press-reglaget skulle bort, uppställningen skulle bli det bärande valet) är redan verklighet i koden.

## Tavlan ser nu ut så här (byggt)

Sju axlar: mentalitet, tempo, passningsrisk, bredd, anfallsfokus, hörnstrategi, utvisningsspel. Plus UPPSTÄLLNING — sex formationer med femman bak, press-reglaget borttaget, höjdläget härlett ur formationen. Rubriken för formationsvalet är "Uppställning" (bandyns ord), inte "Formation".

## Uppgift 1 — viktningen

Mocka taktiktavlans visuella viktning mot den byggda tavlan. Ordningen (Opus rek, ur a8-raden):
- **Uppställningen överst** — den är höjdläget, det enda formationsval bandyns källor ger en effekt, alltså det bärande valet.
- **Hörnor och mentalitet näst** — de två axlar spelaren märker mest i utfallet.
- **Resten samlade** — tempo, passningsrisk, bredd, anfallsfokus, utvisningsspel.

## Uppgift 2 — primär-hierarkin

Taktik visar idag TVÅ primärhandlingar samtidigt: "Följ rådet" (`TacticBoardCard`) och "Bäst för dagens match" (`FormationView`). Det är två avsiktliga, funktionellt olika kontroller — men bara EN får bära huvudtrycket. Design avgör vilken som är primär och tonar ner den andra (visuell vikt, inte borttagning). Det är inte teknisk dubbelrendering, det är en hierarkifråga.

## Ägarskap

Design: mocka viktningen (uppgift 1) + döm primär-hierarkin (uppgift 2) mot den byggda V2-tavlan. Code: wirar efter domen, ingen visuell baseline rörd förrän dess. Opus: denna brief. Jacob: gav go 2026-09-08. Kör nu — upplåst, inte parallellt.
