# Designuppdrag — Granska, del 4: matchtypsmatrisen

**Yta:** `src/presentation/screens/granska/` (Översikt, Spelare, Shotmap, Analys)
**Läst mot:** commit `d94aac6` (2026-08-11)
**Hypotes:** `GranskaScreen` är skriven med ligamatchen som mall och antar den. Cup, slutspel, SM-final och avskedsmatch går genom samma mall och faller ut fel på olika sätt.

---

## Verklighetskoll

- Koden bär redan **SLUTTEST RUNDA 4**-fixar: väderraden (`getGranskaWeatherEffectLine`) syns oavsett simuleringsläge, neutral-plan-arenanamn läses ur `fixture.arenaName`, straffavgjord match har egen flavor-gren (`granskaFlavorText`). Uppdraget bygger vidare på det.
- Matchtyps-medvetenhet finns men är **utspridd per sektion** (`isNeutralVenue`, `isKnockout`, `penResult`, kaptenens `final/slutspel/derby/vardag`-kontext). Uppdraget gör den genomgående.
- **Live-verifierat 2026-08-11** (cupsemifinal på neutral plan, snabbläge). Tre rättelser mot första utkastet: Form-cellen för cup är ✕ (falskt "Inga matcher ännu", inte fel ton); Tabell "—" och Omgångssammanfattning "−53 tkr/omg" bekräftade ordagrant; ny sektion **Turneringsläge** tillagd.
- **[Tillagt av Opus 2026-08-11]** `GranskaOversikt.tsx:413` bär emoji-prefix-parsning av samma antimönster som Inbox och Club hade — betydelse buren av ett emoji i en sträng i stället för ett strukturerat fält. Den är i dag en no-op (generatorn emitterar aldrig prefixet), men en parse som inte matchar sin generator är en tidsinställd bugg. Code är förbjuden att röra `granska/` under den här granskningen, så raden ska in i **ditt** "efter"-förslag: när sektionsregistret byggs ersätts parsningen med ett strukturerat fält. Motsvarande fall utanför `granska/` (`gameFlowActions.ts:174`, `PressConferenceScene.tsx:22`) åtgärdas separat i del 3:s emoji-svep.

---

## Två saker Design inte haft med sig

1. **Snabbläget ger ingen matchtext.** `mode: 'fast'` genererar ingen kommentar under matchen (till skillnad från live/`full`). Därmed är **Granska Översikt den enda ytan där en snabbsimulerande spelare möter någon text om matchen alls.** `generateQuickSummary` (`helpers.ts`) är lastbärande — den måste bära matchtypens vikt, inte ge en SM-final samma generiska meningar som en tisdagsmatch.
2. **Produktionssajten ska verifieras mot** — tre påståenden i del 1–3 var inaktuella och synkfilen till del 2 påstod felaktigt att sajten inte gick att nå.

---

## Matrisen

Legend: ✓ meningsfull, håll · ⚠ tonas/grenas per matchtyp · ✕ meningslös men renderas → **utelämna** (rendera inte; inte ett snyggare tomt tillstånd — DS-regel 12).

| Sektion (Översikt) | 🏒 Liga | 🏆 Cup | ⚔️ Slutspel | SM-final | Avskedsmatch |
|---|---|---|---|---|---|
| **Resultat-hero** (score/flavor/arena) | ✓ | ✓ | ⚠ serieställning | ⚠ flavor-svans "hemmaseger" fel på neutral plan; trophy-ton | ⚠ score underordnas hyllning |
| **Tabell** (ligaplacering) | ✓ | ✕ *(live: "—")* → cupträd | ✕ → serie/bracket | ✕ det ÄR matchen | ✕ |
| **Form** (senaste 5) | ✓ | ✕ *(live: "Inga matcher ännu" efter spelad match — falskt)* | ⚠ | ✕ | ✕ |
| **Statistik** | ✓ | ✓ | ✓ | ✓ | ✕ |
| **Nyckelmoment** | ✓ | ✓ | ✓ | ✓ | ⚠ rama sista målet |
| **Dina val · utfall** (kvitto) | ✓ | ✓ | ✓ (kaptenkontext grenar) | ✓ | ✕ ingen taktik-obduktion |
| **Omgångssammanfattning** (ekonomi/puls/träning) | ✓ | ⚠ *(live: "−53 tkr/omg")* ej "omgång" | ⚠ | ✕ inte "+2 tkr/omg" under guldet | ✕ |
| **Andra matcher** (samma omgång) | ✓ | ⚠ *(live: visade Karlsborg–Målilla efter cupsemin — kolla cupträdet: andra semin → ✓; två ligalag på samma matchday → bugg, ej ton)* | ⚠ andra serier om wirat | ✕ fanns inga | ✕ |
| **Scouting** | ✓ | ✓ | ⚠ säsong slut | ✕ | ✕ |
| **Press / Media** | ✓ | ✓ | ✓ | ⚠ trophy-ton | ⚠ hyllning, ej analys |
| **Nästa match-pekare** (§11.3) | ✓ | ✓ | ⚠ peka in i serien | ✕ säsong slut → säsongsavslut | ✓ |
| **Turneringsläge** *(NY sektion)* | ✕ | ✓ **live-lucka: förlorad semi → "cup" syns aldrig; men vunnen semi = till final, lika osagt — säg båda** | ✓ ut = seriens slut / vidare = nästa omgång | ✓ vunnen = mästare / förlorad = silver | ✕ |

**Diagonalen är tesen:** ligakolumnen nästan helgrön, avskedskolumnen nästan helröd. Ju mer ceremoniell matchen, desto mer av mallen ska *försvinna*. **Turneringsläge** går andra hållet — en sektion som ska *läggas till* där mallen idag är helt tyst om turneringsutfallet, både när du åker ut och när du går vidare.

> **Kolumnerna är inte modellen (se steg 1).** De fem kolumnerna är läsbara kombinationer, inte ett femvärdesenum. Den verifierade matchen var cup + utslag + neutral plan samtidigt. Plats är en egen axel. **SM-final är ingen egen kolumn-axel** — den identifieras av `skede: final` på slutspels-/cup-tävlingstypen.

---

## Regel: utelämna, förskönra inte

Där en cell är ✕ ska sektionen **inte renderas** — inte ett tomt/gråtonat kort. DS-regel 12: tom struktur är förbjuden. En sektion som ljuger om matchtypen (tabellrad på en final) är värre än en som saknas. Precedens: tre falska påståenden togs nyss bort ur portalen på samma grund.

---

## Uppdraget — sex steg

1. **Två axlar, inte ett enum** — härled `tävlingstyp` (`liga | cup | slutspel | avsked`) **och** `plats` (`hemma | borta | neutral`) som två oberoende fält i `GranskaScreen`, skicka ner. Knockout-typerna bär dessutom ett `skede` — **och cupens och slutspelets skeden är olika mängder, härledda ur koden, inte ur hur en cup brukar se ut:**
   - cup = `förstarunda | kvartsfinal | semifinal | final` (12 lag, topp 4 bye in i kvarten, botten 8 spelar förstarunda; källa `cupService.getCupRoundName`/`getCupRoundLabel`, rundor 1–4 — **inget gruppspel, ingen åttondel**)
   - slutspel = `kvartsfinal | semifinal | final` (källa `PlayoffRound`-enum: `quarterFinal | semiFinal | final`)

   **SM-final = `tävlingstyp:slutspel` + `skede:final`** (cupfinal = `cup`+`final`) — finalen är inget eget axelvärde. Ett femvärdesenum slår ihop cupkvart hemma och cupsemi i Bollnäs och bryter arenaraden (som just lagades). Sektionsregler läser `tävlingstyp`+`skede`; arena/flavor läser `plats`.
2. **Sektionsregister** — gör Översikts sektioner till en lista med `visasFör(tävlingstyp, skede, plats)`. Matrisen ovan, i kod. ✕ = renderas inte.
3. **Trophy-/tribute-grenar** — final = trophy-ton på hero. Konkret förlaga: `SeasonSummary`-mästarvyns fullbleed-hero (byggd — se audit del 2, *Implementationsaudit del 2*). Avsked = egen tribute-gren, inte matchmallen. OBS: ceremoni-tiern (quiet/protocol/trophy) är ett *förslag* i scen-flödesauditen, inte byggd kod — referera inte till den som befintlig.
4. **Fast-läges-prosa** — `generateQuickSummary(fixture, isHome, players, tävlingstyp, skede)` → egna meningar för final/slutspel/avsked. Enda texten en snabbsimmare ser.
5. **Serie-/bracket-block + Turneringsläge** — ersätt tabell-kortet i cup/slutspel med serieställning ("2–1 i matcher") eller bracket-steg. Lägg till en **Turneringsläge**-sektion (cup/slutspel/final) som namnger tävlingen ("cupen") och säger utfallet rakt ut — **ut** (seriens slut, var i bracketen det slutade) **eller vidare** (till final / nästa omgång). Datakällan finns redan: `cupService.getManagedClubCupStatus` returnerar `{eliminated, eliminatedInRound, isInFinal, won}` (playoff-motsvarighet i `playoffService`). Ny liten komponent, house-tokens.
6. **Baseline per matchtyp** — Playwright-snapshot: liga / cup / slutspel / final / avsked. Låser att rätt sektioner försvinner och inget läcker tillbaka. `playwright.config.ts` finns.

---

## Filer som berörs

- `granska/GranskaScreen.tsx` — härled + skicka `tävlingstyp` + `skede` + `plats` (två/tre fält, inte ett enum)
- `granska/GranskaOversikt.tsx` — sektionsregister + `visasFör(tävlingstyp, skede, plats)`; trophy/tribute-grenar; ny Turneringsläge-sektion
- `granska/helpers.ts` — `generateQuickSummary` tävlingstyp-/skede-medveten
- ny: serie-/bracket-block + Turneringsläge-komponent
- ny: axel-härledning (domän-util, rena funktioner → enhetstestbara): `tävlingstyp`, `skede`, `plats` ur `fixture`
