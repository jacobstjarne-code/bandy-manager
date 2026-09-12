# DOM — påståendekontraktet för genererings-tids-påståenden (events/*)

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (sluttest-missing-check-grind, prio 1) · **Utlöst av:** Code blockerad — events/*-populationen (~30+ påståendeformer, 5 filer) saknar kontraktsform. `provenBy → EventLedgerType` passar inte ett genererings-tids-anspråk, och att unilateralt designa formen i fem filer är fel ordning.

## Diagnosen (kodläst)

Liggarfamiljen: en händelse som RECORDATS får `provenBy: EventLedgerType` — beläggs av en historisk liggarpost. Grind niva-2 (`forbudslistan`) vaktar mot kända proxy-återfall (regression, baseline 0).

events/*: gör påståenden vid GENERERING ("patron X vill diskutera partnerskap") — ett anspråk om NULÄGET vid avfyrning, inte en historisk post. Det finns ingen liggarpost att peka på; `EventLedgerType` är fel ontologi. Samma distinktion som license-event: levande tillstånd vs historisk händelse.

Sweepen klassade arterna: SANNINGEN-SAKNAS (7, störst — inget fält finns att belägga med), VAR-fel-fält/entitet, NÄR-mutation/idempotens/fönster, ÅTKOMST-FANNS-ANVÄNDES-INTE. Alla 25 fynd löstes med en av tre utgångar. Det är de tre som blir kontraktet.

## Domen — proof-source-kontraktet, tre former

Ett genererings-tids-påstående måste deklarera en `ProofSource` av EXAKT en av tre former, och formen är checkbar:

1. **`state-predicate`** — påståendet gejtas av ett predikat över nuvarande game-state, utvärderat VID genereringen. Predikatet ÄR beläggningen. ("patron X vill diskutera partnerskap" ⇐ `patron finns && influence >= T`.) Täcker VAR-fel-fält/entitet (läs rätt fält) och NÄR (utvärdera vid generering, inte i förväg).
2. **`ledger`** — påståendet refererar en RECORDAD historisk händelse ⇒ `provenBy: EventLedgerType`, befintliga liggarkontraktet. Sällsynt i events/* (de flesta är nutids-anspråk).
3. **`timeless`** — inget predikat eller liggare kan belägga (SANNINGEN-SAKNAS utan fält). Då: skriv om till nutids-sant som inte kräver belägg, eller stryk. "Kan påståendet inte beläggas ska det inte göras" — kartans egen princip, sweepens dominerande fix.

## Grind-utvidgningen

Varje genererings-tids-påstående deklarerar sin `ProofSource`. Grinden checkar att den deklarerade formen FINNS och UTVÄRDERAS — predikatet gejtar genereringen / liggartypen finns / timeless är medvetet märkt — INTE att prosan är "rätt" (det kan ingen grind avgöra). Ett nytt påstående utan deklarerad+utvärderad proof-source failar. Samma mönster som niva-2 (checka kod-formen), framåtriktat: kontrakt, inte bara känd skuld.

## SKYDDAT

- Liggarfamiljens `provenBy: EventLedgerType` rörs inte — det är form 2, oförändrad.
- Grind niva-1/niva-2 (förbudslistan) rörs inte — den vaktar regression; det här är ett nytt framåtriktat lager ovanpå.
- Ingen prosa "rättas" av grinden — den checkar FORM, inte innehåll.
- Determinism: predikaten är rena funktioner av game-state vid generering. Ingen ny slump.

## Första skivan (Code, pilot — bygg INTE hela populationen)

`patronEvents.ts` ensam, end-to-end:

1. Inför `ProofSource`-typen: diskriminerad union `state-predicate` | `ledger` | `timeless`.
2. Annotera varje genererings-tids-påstående i patronEvents med sin proof-source; klassificera per de tre formerna (VAR/NÄR → state-predicate, historik-referens → ledger, obelagt → timeless/stryk).
3. Wira genererings-guarderna så state-predicate-påståenden faktiskt gejtas vid avfyrning.
4. Utvidga grinden till att checka patronEvents påståenden (form finns + utvärderas).
5. Build + tsc + test gröna.

STOPP där. De andra fyra filerna (`postAdvanceEvents`, `eventFactories`, `eventResolver`, `hallProcessService`) rörs INTE förrän piloten bevisat kontraktet. Nästa skiva domas när piloten är grön.

## Ägarskap

Code: bygg piloten mot denna dom. Codex: speltesta empiriskt efter (påståendena fyrar med sina guards). Opus: denna dom + om-text för timeless-fall — SANNINGEN-SAKNAS-påståenden som måste skrivas om (form 3) är skrivuppgifter, den låsta svenska ersättningstexten skriver jag, inte Code. Code flaggar vilka patronEvents-påståenden som faller till timeless, så skriver jag om-texten (samma mönster som sweepens Jacob-låsta rader: "får beskedet av er", "det var länge sedan sist"). Jacob: mandatet givet.
