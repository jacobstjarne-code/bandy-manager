# DOM — påståendekontraktet, skiva 5: eventResolver.ts

**Datum:** 2026-09-10 · **Av:** Codex · **Mandat:** Jacob (”kan du döma den?”) · **Grund:** `DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08.md`, skiva 2–4 och kodläsning av `src/domain/services/events/eventResolver.ts`.

## Dom

`eventResolver.ts` är **inte en GameEvent-producent** och ska därför inte få fabricerade `proofSource`-annoteringar.

Filen tar emot ett redan genererat och proofat `GameEvent`, verifierar att event och val finns, applicerar valet på state och skriver efterföljande kvitton: liggarposter, storylines, inboxrader, cooldown/dedup och resolved-choice-historik. Det är resolutionslogik. Genereringskontraktets fråga är en annan: vilket levande eller historiskt belägg gjorde att ett kort fick skapas och visas?

Den statiska grinden hittar exakt **noll** GameEvent-konstruktioner i `eventResolver.ts`. Den förtida committen `f04ef583` lade redan in rätt skydd: filen ingår i populationen och ett separat test kräver att `findEventConstructionSites(EVENT_RESOLVER_FILE)` förblir tomt. Det arbetet ratificeras.

## Varför noll är ett riktigt resultat

Att filen skapar användarsynliga inboxrader betyder inte att den genererar nya beslutskort. Inboxraderna beskriver konsekvensen av ett val som just har applicerats. Deras sanningsgräns är eventets payload samt faktisk before/after-state; den bevakas av befintliga effekt-, liggar-, O11- och regressionstester. Att märka dem med GameEvents `ProofSource` skulle blanda ihop:

- **före valet:** varför ett beslutskort får existera (`proofSource`), och
- **efter valet:** vad det genomförda valet faktiskt gjorde (resolution/invariant/kvitto).

Samma tre proof-former står kvar oförändrade för riktiga producenter. Domen skapar ingen fjärde form och inget parallellt assertionssystem.

## Ratificerad grind

`pastaendeGrindGenereringskontrakt.test.ts` ska fortsatt:

1. ha `eventResolver.ts` i `PARTICIPATING_FILES`, så en framtida GameEvent-konstruktion inte kan smyga in oannoterad,
2. kräva noll konstruktioner i filen idag,
3. räkna och verifiera de verkliga konstruktionerna i patronEvents, hallProcess, postAdvanceEvents och eventFactories.

Om `eventResolver.ts` senare börjar skapa ett riktigt GameEvent måste den nya konstruktionen bära samma deklarerade och utvärderade proof-source som övriga producenter. Nolltestet ska då ändras medvetet i samma domade pass, aldrig kringgås.

## Slutläge

Skiva 5 är en verifierad **null slice**, inte en utebliven implementation. `f04ef583` står. Ingen produktkod i `eventResolver.ts` behöver ändras. Därmed är hela den namngivna femfilspopulationen i `DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08.md` klassificerad och grindad; `sluttest-missing-check-grind` kan stängas när kontraktstest, TypeScript och build är gröna.
