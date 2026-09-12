# Rapport: påståendesvepet #13, #16, #18 — klara

2026-08-26. Tredje tretalet av 13, tio kvar blir tre: #20, #21, #24, #25. 283/2890 tester gröna, tsc/build rena.

## #13 — Styrelsebetyg-kortet (din dom)

Din distinktion: till skillnad från #4 (årsboken, historisk sida, medvetet separat från boardPatience) är "Styrelsebetyg"-inkorgskortet ett AKTIVT meddelande vid säsongsslut — ytan spelaren agerar på inför nästa vinter. Domen: fortfarande ingen sammanvävning, men en TILLÄGGSMENING.

**Byggt:** `seasonVerdictZoneLine()` (ny, `boardService.ts`) läggs till EFTER den oförändrade säsongsdomen, tre låsta lägen:
- Stabilt: "Ni har vårt förtroende."
- Under press: "Vi förväntar oss att nästa vinter ser annorlunda ut."
- Ultimatum: "Det här kan inte upprepas."

Kräver ingen förklaring (det är BoardPatienceMinimal/Sommaren-förutsättningsfasens jobb). Viktig detalj: kortet konstruerades tidigare TIDIGT i `handleSeasonEnd` (före `computeBoardPatienceUpdate`) — jag flyttade själva PUSHEN till EFTER patiensuppdateringen, så lägesraden speglar det SLUTGILTIGA värdet, inte det som gällde vid säsongens start (annars hade kortet kunnat visa ett läge som redan hunnit bli fel samma dag).

**Verifierat:** 5 nya tester, inklusive ett som specifikt bevisar att lägesraden följer det uppdaterade (inte ursprungliga) värdet. Browser-verifierat i Inkorgen.

## #16 — Rivalsponsor-raden (din dom)

Din egen låsta text från 22 aug ("{RivalSponsor} var med när det var tunnare än nu") påstod en historia utan underlag — samma princip som #1. Din dom: stryk, bygg inte underlaget (fel proportion för en atmosfärsrad), men behåll VAD raden gjorde utan historik.

**Byggt:** ny låst text: **"{RivalSponsor} får beskedet av er."** — sant i nuet (sponsorn finns där, spelaren väljer bort den), kräver ingen tenure-data. Ekonomi- och synlighetsraderna oförändrade.

**Verifierat:** befintligt test uppdaterat till den nya texten, 8/8 gröna.

## #18 — matchMoodService orphan-funktioner

**Raderat.** `getFinalWhistleSummary`/`getMatchHeadline`/`FinalWhistleContext` — noll produktionsanrop bekräftat. Per CLAUDE.md §7 (TVÅ SORTERS DÖD KOD): superseterad, inte text-utan-yta — `generateQuickSummary` (granska/helpers.ts) och `generatePostMatchHeadline` (journalistService.ts) gör redan exakt samma jobb live, ur riktig fixture-data. Ingen ägardom behövdes; doktrinen ger Code mandat att radera bekräftat superseterad kod direkt.

## Nästa tretal

#20, #21, #24 — sedan #25 avslutar hela svepet.
