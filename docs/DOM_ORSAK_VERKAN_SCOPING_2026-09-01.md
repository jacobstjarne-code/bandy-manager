# DOM (SCOPING) — ORSAK/VERKAN-SYNLIGHET: vad leveransen ÄR

**Datum:** 2026-09-01 · **Av:** Opus · **Typ:** scopingdom (definierar VAD, inte HUR) · **Utlöst av:** auditens produktordning "orsak/verkan-synlighet" (`sluttest-audit-orsak-verkan`), som saknade ticket/spec/ägare. Domens uppgift: göra den luddiga fordran till en avgränsad, byggbar leverans — och en fork till Jacob.

## Grundat i koden — vad som redan finns

- **Ripple-motorn** (`describeRippleChain`, rippleEffectService.ts): tar before/after-SaveGame + trigger → en dominokedja av märkta steg (Stämningen/Klacken/Orten/Styrelsen/Sponsorerna/Kassan/Transferbudget/Moralen) med riktning + magnitud, rangordnad av `rippleChainSignificance` (Styrelsen väger tyngst — det är den som kan sluta i sparkning). Motorn är byggd, testad, kalibrerad.
- **Men den fyrar bara på TRE systemtriggers:** `star_injured`, `big_derby_win`, `mecenat_left`. Inte på beslut.
- **Val-subtiteln** visar FÖRSTA ordningens deklarerade effekt ("💰 +180 tkr · ⭐ −12 Orten"). Det spelaren SER när hen väljer.
- **Konsekvensmarkörerna** (`consequenceLevel`/`costLabel`/`irreversible`) finns men sätts bara av ~2 av ~50 eventtyper.
- **`narrativeBeatLog`** loggar per omgång vad som hände (semanticKey/säsong/omgång).

## Vad som saknas — den faktiska luckan

Subtiteln visar första ordningen ("−12 Orten"). Men ett beslut sätter igång ANDRA ordningens följder som ingen yta visar: säljer du akademiprodukten blir inte bara Orten −12 — **Klacken vänder, Styrelsen noterar, Sponsorerna rör sig.** Den dominon är osynlig. Spelaren ser vad hen valde, aldrig vad valet SATTE IGÅNG. Det är orsak/verkan-gapet, konkret: inte att konsekvensen inte finns, utan att den andra ordningens spridning inte är synlig som beslutets egen följd.

## Leveransen, definierad

**Ett besluts NEDSTRÖMS-konsekvens görs synlig som beslutets egen domino — de andra ordningens ripples subtiteln inte visar.** Inte en ny mekanik: ripple-motorn finns, den ska bara fyra på beslut i stället för bara tre systemtriggers.

## Scope — FAS 1 (lean, Opus rek)

- **Fyra `describeRippleChain` på beslutsresolution.** `eventResolver` har redan before OCH after runt effekt-dispatchen — kedjan diffas där, keyad till beslutet.
- **Surfa BARA när det finns ett andra-ordningens steg.** En dominokedja som bara upprepar subtitelns deklarerade effekt är brus. Visa kedjan när den bär ett steg subtiteln INTE redan sa (Klacken/Styrelsen/Sponsorerna rörde sig av ett val som "bara" kostade pengar). Triviala val (kvittera ungdomskull) rör inget nedströms → ingen kedja, ingen yta.
- **Återanvänd `rippleChainText` + rangordningen.** Ingen ny UI-motor. Kedjan visas vid beslutets utfall (DecisionCard-outcome), det redan-byggda "här är vad som hände"-ögonblicket.
- **Rikta mot de beslut som FAKTISKT ripplar** — de stora/oåterkalleliga (redan `consequenceLevel`-märkta), inte alla 50 eventtyper. De flesta val rör inget nedströms; scopet är de som gör det.

## FORKEN (Jacob) — hur långt

- **Fas 1 bara:** dominon vid resolution ("så här spred sig ditt val, just nu"). Lean, återanvänder motorn, träffar den felkänsla auditen namnger.
- **Fas 1 + Fas 2:** en persistent spårbarhet — när ett tidigare besluts konsekvens FORTFARANDE är aktiv ("Orten har inte glömt att du sålde Lundberg" tre omgångar senare), kan nuläget spåras TILLBAKA till beslutet. Det kräver en konsekvens-liggare + en visningsyta + retentionsdesign — ett mycket större bygge.

**Opus rek: Fas 1 först, scopa Fas 2 separat efter att Fas 1 landat.** Skälet: dominon-vid-resolution är där gapet FAKTISKT känns (spelaren ser inte vad valet satte igång), och den är grunden en liggare senare skulle bygga på. Att bygga liggaren först är att lösa spårbarhet-över-tid innan synlighet-i-nuet, baklänges.

## SKYDDAT
- **Ripple-motorn forkas INTE** — samma `describeRippleChain`, bara ett nytt anropsställe (beslutsresolution). Ingen andra kopia av diff-logiken.
- **Derby-vinstens medvetet borttagna Orten-steg** (Väg B, 2026-07-07) rörs inte — det är ett eget designbeslut, inte en bugg.
- **Trivial-brus-golvet är hårt:** ingen kedja utan ett andra-ordningens steg. Bättre tyst än att lägga en tom domino på varje kvittering.

## GODKÄNT NÄR (om Jacob väljer Fas 1)
1. Ett stort/oåterkalleligt beslut (sälj akademiprodukt, det omöjliga valet) visar sin nedströms-domino vid resolution — Klacken/Styrelsen/Sponsorerna som subtiteln inte sa.
2. Ett trivialt val visar INGEN kedja.
3. Ingen ny diff-motor — `describeRippleChain` är enda källan.
4. **Mätning:** hur ofta producerar ett beslut ett andra-ordningens steg? Om sällan (bara sälj-star-klassen ripplar) → scopet är smalt och rätt smalt; om ofta → bra. Mätningen avgör om det är värt en egen yta eller ryms i outcome-raden.

## ÄGARSKAP
Jacob: välj forken (Fas 1, eller Fas 1+2). Code (om Fas 1): fyra `describeRippleChain` på beslutsresolution, andra-ordningens-golvet, återanvänd `rippleChainText`, mät frekvensen → D-fact. Opus: eventuella nya ripple-steg-etiketter om beslut rör fält motorn inte redan diffar, och dömer om trivial-golvet hamnar fel. **Inget byggs före Jacobs fork-val — det är hela poängen med en scopingdom.**
