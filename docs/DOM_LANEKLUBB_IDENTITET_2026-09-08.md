# DOM — låneklubbens identitet: stabilt id + fryst namn

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (Codex-eskalering) · **Grund:** Codex-utredning (`AkademiTab.tsx:11` fem hårdkodade namn, fyra utan entitet, Skutskär-mismatch, `LoanDeal` saknar id, `Academy.ts:92`), `DOM_AKADEMI_LIGGARE` (loan_started/returned subject2 = låneklubben), `DOM_SUBJECT2SNAPSHOT`. Löser modelleringsvalet Codex flaggade som Opus-only.

## Diagnosen (Codex-utredd, jag bekräftar mot koden)

Låneklubbarna (Tillberga, Bollnäs, Delsbo, Norrby, Skutskär) är LÄGRE/lokala utvecklingsklubbar — dit man lånar en junior för speltid. Fyra av fem saknar klubbentitet; Skutskär finns men UI säger "Skutskärs IF" mot entiteten "Skutskär", och listan filtrerar inte bort egna klubben. `LoanDeal` bär bara `destinationClubName`, inget id. Lånet simuleras abstrakt (`LoanReport` per omgång), aldrig mot mottagarklubbens verkliga trupp.

## Vägvalet — tre alternativ

- **A (Codex rec: game.clubs):** FEL. `game.clubs` är toppdivisionen. Att låna dit = låna ut talangen till dina titelrivaler. Utvecklingslån går NEDÅT till lägre klubbar som inte finns i den modellerade ligan. Det är just därför de fem namnen är hårdkodade fantomer — de ligger under toppflight.
- **B (tungt externt klubbregister):** onödig parallell sanning. Ett andra klubb-identitetsrum vid sidan av `game.clubs`, med egen snapshot-hantering — precis den dubblering vi undvikit.
- **C (dom):** stabilt id + fryst namn på lånet. Se nedan.

## Domen — C: stabilt id + fryst namn, inget register

`LoanDeal` får `destinationClubId` (behåller `destinationClubName` som frusen etikett).
- Är destinationen en verklig ligaklubb → dess riktiga `game.clubs`-id (Skutskär: använd entitetens kanoniska namn+id, inte "Skutskärs IF").
- Är den en extern utvecklingsklubb → ett deterministiskt stabilt id, t.ex. `ext:tillberga`. Inte en full entitet (ingen trupp, ingen tabell) — bara ett stabilt id.
- Filtrera bort managerad klubb ur den valbara listan.

**Ledger:** `loan_started`/`loan_returned` subject2 = `{ kind: 'club', id: destinationClubId }`, subject2Snapshot = `{ name: destinationClubName }`. Renderare resolvar ligaklubbar via `game.clubs`, externa via snapshot-namnet — exakt vad `subject2Snapshot` byggdes för (subjekt som inte lever i en uppslagsbar array bär sitt namn på posten). Inget centralt externregister behövs; namnet reser på posten, samma mönster som `RegionalPartnership` redan bär `partnerClubId`+`partnerClubName`.

## SKYDDAT / scope

- Den abstrakta lånesimuleringen står kvar. Att låta lånet köras mot mottagarklubbens verkliga trupp/matcher är en separat, större sak — inte nu. `destinationClubId` + snapshot gör LIGGAREN sann, vilket är allt `DOM_AKADEMI_LIGGARE` kräver för loan_started/returned.
- Läggs lägre divisioner till `game.clubs` någon gång kan destinationerna bli riktiga då — inte en förutsättning nu.
- Ingen ny prosa: klubbnamn är data, inte låst svensk text.

## Ägarskap

Code: `LoanDeal` + `destinationClubId`; `AkademiTab`-listan → deterministiska/riktiga ids + filtrera managerad; Skutskär-namnet mot entiteten; loan_started/returned subject2 + subject2Snapshot. Avgejtar loan-delen av `DOM_AKADEMI_LIGGARE §7 steg 4`. Opus: denna dom. Jacob: mandatet givet.
