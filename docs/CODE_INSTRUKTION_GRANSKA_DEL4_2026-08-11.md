# CODE-INSTRUKTION — GRANSKA DEL 4: MATCHTYPSMATRISEN

**Datum:** 2026-08-11 · **Av:** Opus (chat)
**Underlag:** `docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md` och `docs/incoming/Granska-del4-matchtypsuppdrag-2026-08-11.dc.html`
**Ligger efter:** `CODE_INSTRUKTION_AUDIT_DEL3_2026-08-10.md` — den ska vara kvitterad först. `RoundSummaryScreen` ska vara borta innan någon bygger sektionsregister i den överlevande ytan.

---

## Förutsättningar som måste vara uppfyllda innan steg 2

**1. Linux-baselines committade.** Jacob triggar `visual-baselines.yml` manuellt. Utan dem fyrar dubbelrenderingsgrinden inte i CI, och den här ordern lägger till fem nya scener som ska skyddas av just den.

**2. Granskas fem scener i visuella sviten** — steg 6 nedan flyttas alltså först, före allt annat utom axelhärledningen. Bygg dem via fabriken (`withSeasonOutcome`, `withActiveIncomingBidEvent` finns; behövs `withCupRound` eller motsvarande, bygg den som override, inte som egen scen).

Skälet till ordningen: hela den här ordern går ut på att sektioner ska **försvinna**. Ett borttaget kort syns inte i något test som inte redan vet hur skärmen såg ut innan. Byggs registret först har vi ingen möjlighet att skilja "rätt sektion utelämnad" från "sektion kraschade och renderade inget".

---

## Steg 1 · Axelhärledningen

Domän-util, rena funktioner, enhetstestbara. Tre fält ur `fixture`:

- `tävlingstyp`: `liga | cup | slutspel | avsked`
- `skede`: **olika mängder per tävlingstyp, härled ur koden — hitta inte på.**
  - cup = `förstarunda | kvartsfinal | semifinal | final`, källa `cupService.getCupRoundName` / rundor 1–4. Tolv lag, topp fyra bye in i kvarten, botten åtta spelar förstarunda. Inget gruppspel, ingen åttondel.
  - slutspel = `kvartsfinal | semifinal | final`, källa `PlayoffRound`-enum.
- `plats`: `hemma | borta | neutral`

**SM-final = `tävlingstyp:slutspel` + `skede:final`.** Cupfinal = `cup` + `final`. Finalen är inget eget axelvärde.

**Plats är en egen axel och får inte bakas in i tävlingstypen.** Ett femvärdesenum slår ihop cupkvartsfinal hemma med cupsemifinal i Bollnäs, och då går arenaraden sönder igen — den lagades i SLUTTEST RUNDA 4 och ska inte lagas två gånger.

Sektionsregler läser `tävlingstyp` + `skede`. Arena och flavor läser `plats`.

**Rapportera innan steg 2:** vilka befintliga spridda kollar som ersätts (`isNeutralVenue`, `isKnockout`, `penResult`, kaptenens kontextgren) och om någon av dem läser något de nya axlarna inte täcker.

---

## Steg 2 · Sektionsregistret

Översikts sektioner blir en lista med `visasFör(tävlingstyp, skede, plats)`. Matrisen i uppdragsdokumentet, i kod.

**✕ betyder att sektionen inte renderas.** Inte ett tomt kort, inte en gråtonad platshållare, inte "—". DS-regel 12. Precedensen är de tre falska påståenden vi nyss tog ur portalen: en sektion som ljuger om matchtypen är sämre än en som saknas.

De två cellerna som är live-verifierade och alltså inte förhandlingsbara:

- **Tabell, cup → ✕.** Renderar i dag `—` efter en cupmatch.
- **Form, cup → ✕.** Säger i dag `Inga matcher ännu` direkt efter en spelad match. Falskt påstående, inte fel ton.

**En cell är oavgjord och ska avgöras, inte gissas:** Andra matcher i cup. Live visade den Karlsborg–Målilla efter cupsemifinalen. Kolla mot cupträdet: var det den andra semifinalen är cellen ✓ och inget ska ändras. Var det två ligalag som råkade dela `matchday` är det en filterbugg och ska fixas som en, inte tonas. **Rapportera vilket innan du rör cellen.**

---

## Steg 3 · Trophy- och tributegrenar

Final får trophy-ton på hero. Konkret förlaga: `SeasonSummary`-mästarvyns fullbleed-hero, som är byggd.

Avskedsmatchen får en egen tribute-gren, inte matchmallen med avstängda sektioner. Kolumnen är nästan helröd i matrisen — när elva sektioner av tolv är ✕ är det inte längre samma skärm med undantag, det är en annan skärm.

Ceremoni-tiern (quiet/protocol/trophy) är ett **förslag** i scen-flödesauditen, inte byggd kod. Referera inte till den som befintlig.

---

## Steg 4 · Fast-lägets prosa

`generateQuickSummary` blir tävlingstyps- och skedemedveten.

Detta är viktigare än det låter. `mode: 'fast'` genererar ingen kommentartext under matchen, vilket gör Granska Översikt till den **enda** ytan där en snabbsimulerande spelare möter någon text om matchen alls. Jag spelade själv snabbläge fyra gånger under sluttestet utan att märka att jag därmed aldrig såg en enda matchrad.

**Bygg strukturen, inte texten.** Funktionen ska ta emot axlarna och välja pool. Poolerna för final, slutspel och avsked skriver jag — märk dem `[Opus]` och lämna listan.

---

## Steg 5 · Serie-/bracketblock och Turneringsläge

Tabellkortet i cup och slutspel ersätts av serieställning eller bracketsteg.

**Turneringsläge är den enda sektionen som läggs till.** I dag: jag förlorade en cupsemifinal 4–8 och därmed hela cupen, och ordet "cup" förekom inte en enda gång på skärmen. Ingen bracket, ingen mening om att det tog slut. Elva sektioner om matchen, noll om vad matchen betydde.

Sektionen ska säga **båda** utfallen — ut och vidare. En vunnen semifinal betyder final, och det är i dag lika osagt som utslagningen.

Datakällan finns: `cupService.getManagedClubCupStatus` returnerar `{eliminated, eliminatedInRound, isInFinal, won}`, med motsvarighet i `playoffService`. Ingen ny mekanik ska byggas — ytan har aldrig frågat efter data som redan räknas.

**Texten är min.** Bygg komponenten med `[Opus]`-markerade strängar och rapportera vilka lägen som behöver en rad: ut i förstarunda, ut i kvart, ut i semi, vidare till final, vunnen final, förlorad final, och motsvarande för slutspelet.

---

## Steg 6 · Baseline per matchtyp

Flyttad först, se förutsättningarna. Fem scener: liga, cup i vanlig runda, cup på finalhelgen (neutral plan), slutspel, avsked.

Finalhelgen ska vara en egen scen och inte slås ihop med "cup" — det är den enda som prövar att `plats` verkligen är en egen axel.

---

## Vad som inte ingår

`GranskaSpelare`, `GranskaShotmap`, `GranskaAnalys`. Uppdraget gäller Översikt. Designs bedömning av fyrastegsindelningen — om steg två till fyra ens öppnas — ligger kvar i auditen och blir en egen runda.

`MatchScreen`, `match/`, scoreboarden.

---

## Emoji-parsningen på rad 413

`GranskaOversikt.tsx:413` bär samma emoji-prefix-parsning som Inbox och Club hade. Den är en no-op i dag — generatorn emitterar aldrig prefixet — men en parse som inte matchar sin generator är en tidsinställd bugg.

Den ligger inne i `granska/` och ingår alltså **inte** i del 3:s emoji-svep. Den ersätts med ett strukturerat fält när sektionsregistret byggs, i steg 2, som en del av samma commit.

`gameFlowActions.ts:174` och `PressConferenceScene.tsx:22` hör till del 3 och ska redan vara åtgärdade när det här körs.

---

## Innan något markeras klart

De fem nya scenerna gröna. Dubbelrenderingsgrinden fyrar i CI. `npm run build && npm test`, `lint:design`, `lint:text-guard`. Browser-verifiering enligt CLAUDE.md — spela en cupmatch i snabbläge och en i live, och rapportera vad du **såg**, inte vad testet sa. Audit i `docs/sprints/`.
