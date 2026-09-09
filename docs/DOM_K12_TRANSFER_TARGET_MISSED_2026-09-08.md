# DOM — k12: missad värvning som slår tillbaka (transfer_target_missed)

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (kör k12) · **Grund:** `liggare-k12-missad-varvning-mot-dig` (MASTER, Code-utredning `cd80c45c`), GPT transfer-playtest 2026-09-04, `Moment.ts` (`TransferRole`/`MomentSource`), `Narrative.ts:154-158` (ny typ = Opus vägval), LESSONS #54. Löser vägvalet Code flaggade som Opus-only: fjärde `TransferRole` eller ny `EventLedgerType`.

## Scenariot

Du bjöd på Elias Grafström och förlorade. Nästa säsong blev han matchens spelare MOT dig. En emergent berättelse spelet aldrig kopplade ihop.

## Diagnosen (Code-utredd, jag bekräftar mot koden)

- `nemesis_signed` täcker INTE: den fyrar när VI signar en spelare som gjort 3+ mål mot oss (`transferProcessor.ts:458-473`) — motsatt riktning mot "en rival tog vårt mål".
- `transfer_story` / `TransferRole` passar INTE: `TransferRole` (kapten/klackfavorit/legend/akademiprodukt) sitter på `transfer_story` och betyder "VÅR spelare LÄMNADE". Den jagade-och-missade var aldrig vår och lämnade aldrig. `momentViewTemplates.ts` default-gren skulle påstå att han lämnade managerad klubb — sakligt fel, en ny narrative-truth-bugg.
- `game.transferBids` dög inte som genväg — nollställs vid säsongsrollover, för kortlivad för "i somras".

## Domen — ny EventLedgerType, INTE en fjärde TransferRole

`transfer_target_missed`. En fjärde `TransferRole` är kategorifel: `TransferRole` är bunden till `transfer_story` = vår avgångna spelares roll mot oss. En spelare vi jagade och missade delar ingen axel med det. Per `Narrative.ts:154-158` är en ny typ det uttryckliga Opus-vägvalet, inte en tyst fältutökning — och LESSONS #54 kräver namngiven konsument i samma dom.

**Producent:** `resolveOutgoingBid` (`transferProcessor.ts:81-98`) när ett utgående bud på en scoutad/bevakad spelare resolvar `rejected`/`expired`. subject = den jagade spelaren, subject2 = hans klubb. `subjectSnapshot` + `subject2Snapshot` (nu byggt, `DOM_SUBJECT2SNAPSHOT`) fryser namnen så posten överlever att han byter klubb igen. Significance 30 (låg i sig — resonansen är återkomsten). Payload: `{ bidKr, targetClubId }`.

**Konsument (namngiven, LESSONS #54):** `reviewCallbackService` — när den jagade spelaren senare gör mål mot / blir matchens spelare mot managerad klubb, läs `transfer_target_missed` på hans id och koppla ihop. Det är hela poängen: den emergenta tråden spelet missade. (Årsboken kan valfritt läsa den för en sommarrad; håll det till callbacken som payoff, jag skriver årsboksraden på begäran.)

## Text (låst, Opus)

Callback-raden, när han briljerar mot dig:
> {Namn} — den du bjöd på i somras, han som gick till {Klubb} — blev matchens spelare mot dig.

Håller sig till det sanna: du bjöd (posten), han gick till {Klubb} (posten), han var bäst mot dig (triggern). Inget "han lämnade oss".

## Scope — Jacobs kall

Vägvalet är löst; men helhetsrapporten §10 ("inga fler system före release") gör det här till en NY narrativ tråd, inte en gap-täckare — samma flagga som `transfer-arsbok-minns-fel` Del 2. Min rek: modelleringen är domd och byggbar, men PARKERA post-launch om du inte uttryckligen drar fram den. Vägvalet är inte längre blockerat på Opus; NÄR den byggs är ditt scope-beslut.

## Ägarskap

**JACOB 2026-09-08: BYGG NU** (drar fram den trots §10). Scope grönljust.

Opus: denna dom + texten (årsboksraden på begäran). Code: bygg producenten i `resolveOutgoingBid` (avslaget/utgånget bud på scoutad spelare → `transfer_target_missed`, subject/subject2 + snapshots) och konsumenten i `reviewCallbackService` (callback-texten när han briljerar mot dig), mot denna dom. Byggbart nu.
