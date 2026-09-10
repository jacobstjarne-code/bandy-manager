# DOM — påstående-kontraktet, skiva 4: eventFactories.ts

**Datum:** 2026-09-10 · **Av:** Opus · **Beställd av:** Jacob (missing-check-grinden, nästa skiva) · **Grund:** `DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08` (kontraktet, tre former), `DOM_PASTAENDE_SKIVA2_HALLPROCESS_2026-09-08` + skiva 3 postAdvance (ratificerade), `eventFactories.ts` (kodläst 2026-09-10). Auktoriserar nästa skiva i missing-check-grinden. STOPP-domen som `sluttest-missing-check-grind` väntar på.

## Kodläst läge — filen är redan annoterad

Alla sjutton genereringsfunktioner i `eventFactories.ts` bär redan en `proofSource` med `form: 'state-predicate'` och ett `evaluatedTrue`:
- De flesta tar `triggerProof` (beräknat i den anropande gaten) — `bidWar`, `hesitantPlayer`, `bidReceived`, `contractRequest`, `unhappyPlayer`, `dayJobConflict`, `playerMedia`, `playerPraise`, `captainSpeech`, `varsel`, `promotionOffer`, `shiftConflict`, `coworkerBond`, `journalistExclusive`.
- Tre beräknar sin boolean lokalt — `mecenatIntervention` (`interventionDue`), `economicStress` (`economicStressDue`), `jobbetForsvann` (`jobLossDue`).

Så den här skivan är VERIFIERING mot den bevisade formen, inte om-annotering. Ingen funktion saknar form; frågan är om formen är SANN.

## Vad skivan ska bekräfta (proven grid + postAdvance-lärdomen)

1. **`evaluatedTrue` är genuint evaluerad, inte hårdkodad `true`.** För `triggerProof`-funktionerna: följ varje anropande gate och bekräfta att booleanen faktiskt beräknas ur game-state (inte skickas som konstant `true`). För de tre lokala: bekräfta predikatet.
2. **Varje `description` matchar sant det predikat gaten faktiskt prövar.** Det var exakt här postAdvance-skivan hittade ett verkligt sanningsfel (konfliktbudet påstod högre sponsorersättning utan beloppsjämförelse). Läs varje `description` mot gatens kod.
3. **Brödtext som PÅSTÅR game-state måste vara gejtad av ett verkligt predikat.** Tydligaste fallet: `hesitantPlayerEvent`s brödtext "din klubb är ett steg ner i ambitionsnivå" — funktionens egen `@cites`-not säger att jämförelsen (`sellingClubId` mot `buyingClubId`) sitter i `generatePostAdvanceEvents`-gaten, inte här. Bekräfta att gaten VERKLIGEN gejtar på ryktesjämförelsen, annars är brödtexten ett obelagt påstående. Samma prövning för `bidReceived`, `mecenatIntervention` (happiness-siffran i brödtexten är exakt och läses ur `mec.happiness` — sann) m.fl.
4. **Fixa varje obelagt påstående** genom att stryka det eller gejta det (borttagning, aldrig ny speltext — Code skriver inte prosa), + ett regressionstest som låser sanningen, precis som postAdvance-skivans lägre-bud-test.

## Grid + ratificering

Grinden utökas till `eventFactories.ts` med samma krav som postAdvance: `evaluatedTrue` för state-predicate, `ledgerType` för ledger (ingen ledger-form finns i den här filen — alla är state-predicate, korrekt eftersom dessa är genererings-påståenden om levande state, inte historik).

De redan pushade eventFactories-ändringarna (i missing-check-radens uppräkning av för tidigt pushade filer) RATIFICERAS, inte reverteras — samma linje som hall: håller de mot den bevisade formen står de. Hittar verifieringen ett obelagt påstående rättas det i stället.

## STOPP

Efter `eventFactories.ts` är nästa skiva `eventResolver.ts`, och den kräver en egen namngiven dom. Code/Codex rör inte eventResolver eller press före dess.

## Ägarskap

Code/Codex: verifiera de sjutton mot punkt 1–4, fixa obelagda påståenden + regressionstest, utöka grinden till filen, STOPP efter. Opus: denna dom. Jacob: klartecknet givet (kör vidare med nästa skiva).
