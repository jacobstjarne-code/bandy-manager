# DOM — Grind 2 återprov #2 (Opus), 2026-09-11

**Underlag:** dubbelspårsprov Codex/Astra, två naturliga Lesjöfors-säsonger, produktkod `6732d711`, isolerad origin, ingen balansstyrning. + föreslagen 4-pass-åtgärdsplan.

## Verdikt: UNDERKÄND, bekräftat

Provet gjorde sitt jobb igen — och den här gången hittade det inte fler ytbuggar, det lokaliserade den centrala roten. Det är skillnaden som gör läget ändligt, inte ändlöst.

### Release-blockerarna (MÅSTE-listan, punkt 1 + 3)

1. **Beslutskö-livscykeln.** Kön blev OLÖSBAR vid säsongsslut — 16 i kö, inget kort öppningsbart, bara "Avsluta säsongen". Det är en hård STOP i ett kärnflöde varje testare når. Plus budget visade 4 aktiva mot max 3, och semantisk reproduktion ("Jobbet kolliderar" ×5 för samma spelare, äldst 35 omgångar). Kön bär gammalt obearbetat material och stannar spelet. Blockerande.
2. **Kafferum-cooldown, tredje poolen.** Exakta replikpar återkom under cooldownen. Rot: den generella fatigue-poolens selektor läser inte tvåsäsongscooldownen ur `narrativeBeatLog`, bara en kort svans. `playoff_win` och `derby_win` fixades förra passen — det här är en TREDJE pool utan skyddet. Mönstret är tydligt: lapp-per-pool missar alltid nästa. Blockerande.
3. **Årsboken ljuger om målet.** Styrelsemål "topp 6", utfall 9:a/8:a, och årsboken kallar det godkänt eller bättre än begärt. Spelet ljuger om huruvida du lyckades, i ett flöde alla når. Plus dubblad derbytriumf i båda årsböckerna. Blockerande (samma förtroendeklass som repriserna).

### Höll

Burnout-taket (ett terminalt val/säsong, mindes tidigare valet rätt) och galans engångsresolution. Båda passade naturligt.

### Ej täckt — och det är en rot-fråga, inte bara testfokus

Den kanoniska klackkonflikten fyrade ALDRIG under två naturliga säsonger, andra provet i rad. Det är inte "styr testet hårdare" — två naturliga körningar utan trigger betyder att villkoret antingen är för smalt eller blockeras (av kötryck / fel dedupe). Diagnosticera VARFÖR den inte fyrar före nästa prov. Det syntetiska scenprovet bevisar bara dedupen, inte att scenen finns i spelat läge.

## Ärlig korrigering av min tidigare dom

Jag dömde Grind 3 passerad med köreservationen noterad som "adresserad" av portalhierarkin/åldersviktningen. Evidensen säger annat: **reservationen är INTE lyft** — "+N fler", två massiva rollover-inkorgar, och när kön blev olösbar vid säsongsslut slutade den vara bakgrund och blev ett stopp. Grind 3:s kärna (loop, landningar, drivkraft) står kvar passerad — men reservationen återöppnas, och den är SAMMA kösystem som Grind 2-blockern. En fix på kölivscykeln stänger båda.

## 4-pass-planen — godtagen, rätt prioriterad

Planen går på ROTEN — kanoniskt event-id + semantiskt id genom hela livscykeln (pending/deferred/expired/inkorg/resolved), EN central budgetberäkning, alla pooler läser liggaren — i stället för ännu en lapp-per-pool. Det är rätt instinkt efter två partiella fixrundor. Ordningen är rätt: kö+livscykel (blockern) → kafferum centralt → årsbok-sanning → polish/gala.

Mot release-definitionen: pass 1–3 är MÅSTE (kärnflödes-förtroendebrott). Pass 4:s gala är post-launch (briefen finns redan); textfixarna är snabba. Match­motor och kalibrering rörs inte — rätt, resultaten är plausibla för ett svagt Lesjöfors.

Skärpning utöver planen: lyft klackkonfliktens icke-trigger till en egen rot-diagnos (varför fyrar den inte naturligt?) före återprovet, och håll årsbok-mot-mål som den högsta sanningsfixen.

## Nästa

Code kör pass 1–3 (blockerarna). Sen ett nytt naturligt tvåsäsongsprov från början, dubbelspår, med kravet att klackkonflikten faktiskt uppstår. Rent → Grind 2 stängd, punkt 1 avklarad. Pass 4 (gala + texter) löper post-launch/parallellt.
