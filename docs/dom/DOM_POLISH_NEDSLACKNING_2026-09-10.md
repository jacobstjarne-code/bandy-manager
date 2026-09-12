# DOM — Polish 1/5: Nedsläckning (godkänd)

**Datum:** 2026-09-10
**Från:** Opus (dom)
**Granskad mot:** `docs/incoming/HANDOFF-POLISH-1-NEDSLACKNING.md` + `Polish-nedslackning.dc.html`
**Rad:** `pt6-nedslackning-timing` (polish-kö 1/5)

## Domen: godkänd, byggbar

Handoffen är kodredo och träffar de två som avgör:

- **Resultattavlan som ankare.** Tavlan (z 5) lyser kvar i full styrka, scrimen börjar vid scoreboard-höjd och når den aldrig. Spelaren släpper aldrig matchen ur sikte medan hen väljer — det var hela poängen med "in-match scen-övertagande".
- **Överlappande snärtig fade (pt6-fixen).** Dim 260ms + scen 220ms med 80ms delay, scenen stiger medan dimningen fortfarande löper (~380ms total, inte sekventiell). Kort och överlappad, per DS "no long transitions". Det gamla sega problemet är löst rätt.

Scope disciplinerad: ingen mekanik, bara in-match event-overlay, tavlan/event-logiken/valens konsekvenser orörda, `prefers-reduced-motion` → hoppa transform, behåll dim. Scrim `rgba(0,0,0,0.6)` matchar match-modalerna (DS §8).

## En hållpunkt vid bygget

Scrim-toppen ska vara den FAKTISKA scoreboard-höjden, inte hårdkodad. §1 skriver `top:54px`, men §4 säger `top = scoreboard-höjd` — bygg mot §4:s regel (mätt värde eller token), så scrimen sitter flush mot tavlans underkant även om scoreboard-höjden varierar mellan matchlägen. En magisk 54:a spricker om tavlan någonsin ändrar höjd.

## Byggbar

Code mot handoffen: `.match-dimmed`-state på match-view-containern, dim-filter (`brightness(0.34) saturate(0.7)`) på underlags-wrappern, scrim z 6 med top = scoreboard-höjd, scen z 7, timing per §2, ease per DS. Ingen ny komponent, ingen baseline rörd.
