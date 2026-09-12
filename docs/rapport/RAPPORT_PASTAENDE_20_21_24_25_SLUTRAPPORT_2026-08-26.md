# Rapport: påståendesvepet #20, #21, #24, #25 — samtliga 13 klara

2026-08-26. Sista fyrtalet. 284/2893 tester gröna, tsc/build rena. **Hela svepet (13 poster) är nu stängt.**

## #20 — Semifinal-mecenatens "första gången"

Koden kollade bara att en aktiv mecenat finns, aldrig historiken (till skillnad från `generateQuarterFinalEvent` i samma fil, som korrekt kollar `seasonSummaries`). "Det är första gången hen säger något sådant" struken — samma princip som #1/#16. Resten av repliken (finalbiljett-löftet) orörd.

## #21 — seasonSignatureService fallback

Bekräftat oåtkomlig i produktion idag (skaparfunktionen seedar alltid minst ett observerat faktum). Fixad ändå som billig försäkring: fallbacken hittade tidigare på ett specifikt påstått faktum ("Is och minusgrader satte tonen") om listan någonsin vore tom — returnerar nu bara rubrikmeningen ensam i det läget, ingen påhittad text.

## #24 — situationService streak-fönster

Konkret bugg: segersvit/förlustsvit räknades ur ett 5-matchers fönster satt FÖRE räkningen — en verklig svit på 7, 12, vad som helst visades alltid som max "5 RAKA". Räknas nu ur hela matchlistan, samma mönster som en redan korrekt funktion (`csPressEventService.ts`) i kodbasen. 3 nya tester bevisar 5/7/12-matchers sviter alla visas rätt. **Samma bugg finns kvar i `mediaService.ts:132`** — loggad i BACKLOG (E-M24-1), inte fixad (out of scope för den namngivna filen).

## #25 — Ismaskin-veteranens tjänstetid (din dom)

Din egen låsta text ("tre vintrar") hade ingen räknare bakom sig. Föreslog att räkna fram ett tal ur klacksektionens grundandeår — du avvisade det explicit: "Det ger ett tal som SER belagt ut men mäter någon annans historia... farligare än en hårdkodad trea." Din dom: generisera bort talet. **"Tre vintrar" → "många vintrar."** Loggat i BACKLOG att det här är tredje gången samma underliggande fält (tjänstetid/tenure — spelare, O18, nu funktionärer) efterfrågas, som skäl att en dag faktiskt bygga det, men inte som en genväg nu.

## Helhetsbild — hela svepet

13 poster stängda över tre rapporteringsomgångar: #1 (HalftimeModal), #3 (allTimeRecords, inget fynd), #4 (verdictText, din dom), #5 (keyMoments-ikon), #9/#11 (arcService, redan fixat), #13 (styrelsebetyget, din dom), #16 (rivalsponsor, din dom), #18 (orphan-radering), #20/#21/#24/#25 (den här omgången). Fem av dessa krävde din dom (#4, #13, #16, #25, plus ett par mindre klargöranden) — resten var raka kod-/textfixar eller "inget fynd"-utredningar.

Detta avslutar hela den prioritetsordning du gav: M2→M3→M8→M1→M10→M4→M7, sedan påståendesvepets 13 poster i MASTER.md-ordning. Säg till om du vill att jag fortsätter med något specifikt, eller om det här är ett naturligt stopp.
