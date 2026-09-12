# DOM — feedbackknappens placering: dockad sidfotsrad, global

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (beslut 5) · **Grund:** `sluttest-feedbackbutton-overlapp`, `FeedbackButton.tsx` (`position:fixed`, `bottom:64`, `zIndex:9999`). Den överlappar CTA:er/innehåll på skärmar utöver de två redan mitigerade (`/game/match`, SeasonTransition). Jacobs beslut 2026-09-07 var "fixa så den inte ligger i vägen"; placeringen är nu domd.

## Domen (Jacob 2026-09-08)

Fast DOCKAD sidfotsrad, global regel, aldrig överlappande. Knappen flyttas från `position:fixed`-svävningen till en dockad rad i sidfotssystemet — samma mönster som "TILL GRANSKNING"-sidfoten / `InteractionShell`:s dockade CTA. Den TAR PLATS i layouten i stället för att ligga ovanpå innehållet. Global, inte en per-skärm-guard.

## SKYDDAT

- Feedback ska förbli nåbar — därför INTE en meny/inställning som gömmer den (det var det andra alternativet Jacob valde bort). Poängen är att den syns, bara inte ovanpå en CTA.
- De två befintliga per-skärm-mitigeringarna (`/game/match`, SeasonTransition som döljer knappen på just de rutterna) blir sannolikt redundanta när den globala docken finns — Code bedömer om de kan tas bort i samma pass eller lämnas.
- Ingen ny svensk text (knappens etikett står).

## Ägarskap

Code: flytta FeedbackButton till en dockad sidfotsrad i det befintliga sidfotssystemet, global över alla skärmar, verifiera att den aldrig överlappar en CTA på 390 px. Design-gaten är borta — Jacob dömde placeringsprincipen. Opus: denna dom. Jacob: beslutet.
