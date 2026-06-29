# BRIEF — Granska Översikt, omcuttning mot låst fork (2026-06-09)

**Till:** Claude Design
**Förlängning av:** HANDOFF-LEDGERFRAME-2026-06-08.md (rev 06-09), §2 Granska "Flöde LÅST 06-09"
**Status:** LEVERERAD — mock `docs/incoming/2026-06-09_design_granska_oversikt_recut.html`. Arkiverad för spårbarhet.

## Varför
Granska-mockarna (06-08) är en dag före fork-låsningen och Översikt-fliken blandar fortfarande matchrapport-hjälte med ligatabell + form. Låsningen flyttade tabell/form/ekonomi UT till RoundSummary-svepet (utanför liggaren). Liggar-Granska wrappar bara MatchReportView. Översikt cuttas därför om. De tre andra flikarna är godkända.

## Vad som ändras
Bara flik 1, Översikt, ritas om. Spelare / Shotmap / Analys återanvänds som de är — endast säsongsetikett + krom-token att stämma av, ingen omritning.

## Översikt — låst innehåll
Matchrapport-översikten, inget annat:
- Resultat-hjälte: slutställning stor (≈52px serif), utlåtande-rad (mono, färgad efter utfall), flavor-rad (kursiv copper).
- Målskyttar: hemma + borta, med minut.
- Nyckelsiffror: publiksiffra (+ ev. kort kommentar), på sin höjd 1–2 matchfakta (skott/hörnor).

Bort: ligatabell (`.tline`/`.pos`/`.me`), formprickar (`.formdots`), ekonomi. De bor i svepet.

## Krom & ramverk
- Bygg på den riktiga LedgerFrame-kromen Code shippade. Masthead `#0E0D0B`, crest `#3D3A32`, RPS-strip, perforerad marginal, copper-stämpel.
- Säsongsetikett ALLTID via `seasonSpanLabel(game.currentSeason)` → "2026/27".
- RPS-strip: ✓ FÖRBERED — ✓ SPELA — ⬡ GRANSKA.
- Flikrad: Översikt · Spelare · Shotmap · Analys (Översikt aktiv).
- Stämpel: "Klar →" (stänger rapporten tillbaka till svepet). Aldrig "Nästa omgång".

## Gränser
- Liggaren = bara rapport-ytan (MatchReportView). RoundSummary-svepet ligger utanför liggaren i sin lättare form och behåller "Nästa omgång →".
- Två parallella CTA: svepet "Nästa omgång →", liggar-Granska "Klar →".
- Inga nya tokens. Stämpeln funktionell, aldrig dekoration. LED-tavlan bara på Spela.
- Full täthet i 394px-telefonram.

## Output
- `docs/incoming/2026-06-09_design_granska_oversikt_recut.html`
- DESIGN-DECISIONS-not: vad som ändrades vs 06-08.

— Opus, 2026-06-09
