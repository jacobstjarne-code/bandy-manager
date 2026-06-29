# DESIGN-BRIEF — Portal-orientering / första-gången-rampen

**Datum:** 2026-06-10
**Till:** Claude Design
**Källa:** Jacobs playtest (Image 1, portal omg 7) + auditens onboarding-fynd §6.2.
**Status:** Fristående brief. Köas efter Designs pågående visuella-konsekvens-audit.

## Problemet
Portalen ger en spelare ingen orientering. Konkret från playtesten:
- "Vilket fönster är öppet?" — `Fönstret öppet` (transfermarknads-flavor) läses bokstavligt. En förstagångsspelare vet inte att det är transferfönstret.
- "Vad ska man göra?" — ingen tydlig nästa-handling. Portalen svarar inte på "vad gör jag nu?".

Auditen förutsåg det exakt: *"spelet har i dag ingen ramp alls, eftersom dess enda spelare aldrig behövt en."* Spelet har en spelare, som byggde det — så rampen designades aldrig. Det här är inte en bugg att lappa; det är en sak som aldrig fanns.

## Uppgiften
En första-gången-/första-sessions-orientering som svarar på tre frågor utan att bli en SaaS-tutorial:
1. **Var är jag?** Portalen är klubbens nav mellan matcher.
2. **Vad pågår?** De öppna trådarna — transferfönstret, akademidebuten, det som ringer.
3. **Vad gör jag härnäst?** EN tydlig handling (spela nästa match / sätt laget). Portalen ska alltid kunna svara "vad nu?".

## Ton — det här är det svåra
Rampen får INTE låta som produkt-onboarding. Spelets röst är bruksort och understatement — "Pålsson avgjorde med fyra minuter kvar. Hallen tystnade." Ingen "Welcome! Let's get started!", inga tooltips överallt, ingen pekpinne. Orienteringen ska låta som att *klubben* tar emot dig, inte som att en app lär dig knappar. Tänk: den gamle kassören som visar dig runt, inte en wizard.

Specifikt:
- `Fönstret öppet`-metaforen: gör den begriplig i kontext eller förankra den (det ÄR transferfönstret — en återvändande spelare vet, en förstagångare inte). Lös literalismen utan att tappa tonen.
- Nästa-handling: portalen behöver en stående, lågmäld "vad nu?"-affordans. Den finns inte i dag.

## Målberoende — flagga till Jacob
Hur mycket ramp beror på målet (a/b/c, ännu osatt):
- **(a) hantverk / (b) Bury Fen-produkt** för bandyfolk som halvt kan genren → lätt touch räcker, nästan bara "vad nu?"-affordansen + en förankring av fönster-metaforen.
- **(c) kommersiellt** för främlingar → en riktig första-körning behövs (var är jag, hur funkar loopen, vad är poängen).

Design kan föreslå *formen* (rampens gestalt, tonen, var "vad nu?" sitter). *Djupet* — hur mycket hand-holding — är ett Jacob-beslut som hänger på målmeningen. Föreslå formen så att den skalar: minimal som default, utbyggbar om målet blir (c).

## Subjekt för Design
- Portalens första-render (Image 1) och dess tomma/första-sessions-tillstånd.
- "Vad nu?"-affordansen — var den sitter, hur den låter, hur den pekar utan att peka.
- Förankringen av `Fönstret öppet` i kontext.

## Vad detta INTE är
Inte en tutorial-overlay. Inte coach marks. Inte en "5 steg för att komma igång". Om förslaget börjar likna det har det glidit från bruksort till SaaS — backa.
