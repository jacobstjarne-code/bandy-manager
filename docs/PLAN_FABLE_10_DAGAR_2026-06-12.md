# PLAN — Fable-fönstret: 10 dagar (2026-06-12 → 06-22)

**Av:** Opus · **Princip:** Fable-dagarna går till det som kräver Fables ögon (renderat UI, helhetsblick, mockar). Analys/spec/text ligger hos Opus parallellt — den kapaciteten försvinner inte den 22:a. Code är flaskhalsen för §5 — svepet måste landa tidigt i fönstret.

---

## Huvudnumret: SPELKÄNSLE-GENOMLYSNINGEN (det som aldrig gjorts)

Pixlar, text, motor och marknad är auditerade. Spelet som SPEL är det inte. Genomlysningen svarar på fyra frågor:

1. **Spänningskurvan:** var i säsongen sjunker trycket? (Misstanke: omgång 6–11, mellan premiärens nyhet och upptaktens allvar.)
2. **Beslutsekonomin över en hel säsong:** hur många beslut, vilken vikt, hur ofta är "valet" egentligen ett kvitto? (D2-kritiken generaliserad till hela spelet.)
3. **Repetitionströskeln:** när börjar spelaren känna igen poolerna? (Textauditen fixade KVALITETEN; täckningen och rotationsdjupet per spelstate är omätt.)
4. **År 3-problemet:** vad får någon att starta säsong 3? Vilka system fördjupas över tid (klubbminnet, akademin, B1) och vilka bara upprepas?

**Metod — tre källor i samspel:**
- **Jacob spelar** en hel säsong front-to-end (gärna i ett par längre pass), fotar per omgångskluster, antecknar RÅTT: var det segt, var det klickades utan att läsa, var det kändes. Inga analyser — bara observationer med tidsstämpel.
- **Fable läser fotoserien** som upplevelseflöde (inte pixel-lint — den omgången är gjord) och levererar SPELKÄNSLE-AUDIT i del-format: spänningskurva, beslutstäthet, repetitionsfynd, döda passager.
- **Opus läser systemen** parallellt (season-flow, decision-täthet i kod, pool-djup per state) och korsar mot Fables fynd → konsoliderad åtgärdskarta, klassad 🟥🟧🟨 som försoningssprinten.

**Output:** `SPELKANSLE-AUDIT` (Fable) + `SYSTEMKARTA` (Opus) + konsoliderad förbättringsvåg 2-backlog. Det är beslutsunderlaget för vad som byggs efter B1.

## Dag-för-dag (riktning, inte schema)

**Dag 1–2 — stäng det öppna:**
- Code: svepet klart (redovisningarna + grep + verify + #8) — förutsättning för allt nedan.
- Fable: processtegs-mockarna (beställda, copy klar).
- Jacob: börjar genomspelningen (säsong 1 från ArrivalScene).

**Dag 3–4 — §5-stängningen:**
- Jacob fotar om designomgångens flöden → Fable kör grön/kvarstår-re-audit → reglerna 11–15 in i `_adherence`-lint. Designomgången STÄNGS medan Fable är gratis — den får inte hänga kvar till betalda dagar.

**Dag 4–6 — genomlysningens kärna:**
- Fable: SPELKÄNSLE-AUDIT på Jacobs genomspelningsfoton (del 1: omgång 1–11, del 2: 12–22 + slutspel/säsongsslut).
- Fable parallellt: **första-timmen-audit** — ArrivalScene → omgång 3 med uttalat färska ögon: förstår en ny spelare bandy, systemen, tonen? (Onboarding har aldrig granskats som flöde.)
- Opus: systemkartan (mätare↔spakar över ekonomi/puls/klack/akademi/patron/kommun/moral — vilka system är döda, vilka loopar saknas).

**Dag 7–8 — syntes + beslut:**
- Opus konsoliderar allt till förbättringsvåg 2 med Jacobs prioritering.
- De fynd som är mock-bara beställs DIREKT till Fable (fönstret!): nya ytor, omtag, illustrations-katalogen om den aktiveras.

**Dag 9–10 — Fable tömmer mockkön:**
- Allt mock-arbete ur våg 2-backloggen som hinns. Hellre fem grova mockar på rätt saker än två polerade på fel — K-rundor kan köras efter fönstret, mockarna kan inte.
- Sista handling: Fable skriver **DESIGNTESTAMENTE** — allt den ser som ogjort/skört, så inget tappas när kapaciteten försvinner.

## Vad vi INTE gör i fönstret
- Ny pixel-audit (omgången stängs via §5, punkt).
- Stora kodprojekt som binder Fable till väntan på Code — Fable ska aldrig stå still i kö.
- Polering av redan godkända ytor.

## Beroenden & risker
- **Codes svep är kritisk väg** för §5 — om det drar ut: kör §5-re-auditen på det som ÄR klart och låt resterna gå i testamentet.
- Jacobs genomspelning är genomlysningens bränsle — utan den blir det kodläsning utan upplevelse, och då missar vi exakt det som aldrig mätts.

— Opus, 2026-06-12
