# BEVARANDELISTA — text-utan-yta

Skriven 2026-07-21, efter release-svepet. Inventerar **färdig, auditerad text
vars konsumentyta inte finns**. Enligt bevaranderegeln i CLAUDE.md:
superseterad kod raderas, text-utan-yta dödmarkeras och bevaras.

Den här filen finns för att texten ska vara **återupplivningsbar** — när en yta
någon gång byggs ska ingen behöva skriva om det som redan är skrivet och dömt.
Ingen rad här är en uppgift. Det är ett lager.

---

## MASKINLÄSBAR — grind 2 (`docs/spec/SPEC_SANNINGSGRINDAR_2026-08-31.md`) läser detta block

Skyddade textpool-exporter. `tests/grind/preservationGate.ts` greppar `src/`
för varje namn — noll förekomster = bygget failar (bevarad text raderad, som
`hallDebateData` i `d0d4d923`). Synka blocket när en pool läggs till eller får
en yta. Bara textpooler — typ-only-exporterna längst ner hör inte hit.

**Tre giltiga utfall för ett namn i blocket** (sedan DOM_DÖDA_TEXTPOOLER_2026-09-18):

1. **Kvar i `src/`** — bevarad text-utan-yta, orörd. Grundfallet.
2. **Fick en yta** — raden tas ur blocket i samma commit som inkopplingen.
3. **Arkiverad** — texten är bra, ytan finns inte, och raderna ligger ordagrant
   i `docs/archive/textpooler/` med villkoret för när de plockas. Grinden räknar
   arkivet som ett giltigt hem, så namnet står kvar i blocket.

Det enda som failar är att ett namn försvinner från **både** `src/` och arkivet.

```bevarandelista
diaryLine
HALL_NEWS_POSITIVE
HALL_NEWS_NEGATIVE
HALL_NEWS_OUTDOOR_PRIDE
BOARD_HALL_QUOTES
KIOSK_FLAVORS
LOTTERY_FLAVORS
EVENT_FLAVORS
STUDAN_FACTS
SAVSTAAS_FACTS
SUSPENSION_INCIDENT_MULTI_LINES
anniversaryRowDetail
FACILITY_AVAILABLE_BEAT
MUSTWIN_CRIT_TAGS
```


---

## UTFALL AV DOM_DÖDA_TEXTPOOLER_2026-09-18

**Fick en yta — tagna ur blocket:**

- `SUSPENSION_RETURN_LINES` → inbox när avstängningen är avtjänad
  (`inboxService.createSuspensionReturnItem`, speglad mot skadeåterkomsten).
- `DEADLINE_KAFFERUM_TEXT` → kafferummet den omgång `isWindowDeadlineDay` är sant
  (`coffeeRoomService`).
- `HALL_PROCESS_BEATS` → de tre raderna migrerades in i `PROVNING_AMBIENT`
  (`hallProvningData.ts`, stegen forankring/krav/forhandling) innan poolen ströks.
  Texten är alltså i spel, inte i arkiv.

Samtidigt inkopplade, men de stod aldrig i blocket: specialdagsbriefingarna
(Förbered + portalens åskådarkort), bortaresans efterklang, välkomstsången
(hemmapremiären) och domarens öppningsrad (matchlive, steg 1).

**Arkiverade — står kvar i blocket, bor i `docs/archive/textpooler/`:**

| Pool | Arkivfil | Plockas när |
|---|---|---|
| `HALL_NEWS_*`, `BOARD_HALL_QUOTES` | `hallprovningens-nyhetsstrom.md` | hallen får ett mediaspår |
| `KIOSK_FLAVORS`, `LOTTERY_FLAVORS`, `EVENT_FLAVORS` | `ortsaktiviteternas-volontarvardag.md` | korridoralternativ 2 (D4 Bygden) |
| `STUDAN_FACTS`, `SAVSTAAS_FACTS` | `studan-och-savstaas-faktarutor.md` | raderna tvättats från riktiga klubbnamn |

`FACILITY_AVAILABLE_BEAT`, `MUSTWIN_CRIT_TAGS` och `ECHO_DETAIL` (som
`anniversaryRowDetail` konsumerade) stod som STRYK i domen men fanns på den här
listan. Koden är struken enligt domen; texten ligger i
`korta-pooler-ur-strykbeslutet.md`, och namnen står kvar i blocket.

`PLAYER_LEDGER_*` och `RIVALRY_WARNING_PER_INTENSITY` arkiverades i samma pass
(`spelarliggaren-och-rivalitetsvarningen.md`) men stod aldrig i blocket — de är
hårdkodade exempel utan variabler, alltså förlaga snarare än pool.

---

## VÄNTAR PÅ MEKANIK (blockerad av mer än en yta)

**`diaryLine`** — kafferumsgrenen
Klassad i städsvepet som text-utan-yta; dess tänkta konsument var själv död kod.
Bevarad orörd.
Väntar på: en dagbok/krönika-yta som inte finns.

---

## ÅTERUPPLIVAD 2026-08-31 — förlorad en gång, nu räddad

**`HALL_NEWS_POSITIVE` · `HALL_NEWS_NEGATIVE` · `HALL_NEWS_OUTDOOR_PRIDE` ·
`BOARD_HALL_QUOTES`** — nu i `hallProvningData.ts` (var `hallDebateData.ts`)
Dödmarkerade i M67b (2026-07-13) med motiveringen "framtidsinnehåll för
hallprocessen (B1), auditerat och klart att wira när processtegen byggs".
**Den här radens egen "verifiera"-uppmaning hann aldrig utföras** —
`hallDebateData.ts` (och därmed dessa fyra pooler) raderades hel i `d0d4d923`
(2026-08-17, "radera hallDebateEvents.ts — död kod"). Den commitens motivering
gällde bara `HALL_DEBATE_EVENTS`; de fyra poolerna fick aldrig sin egen
bedömning innan filen föll med den. Upptäckt i 2026-08-31-inventeringen,
återställda ordagrant ur git-historiken (`git show d0d4d923^:...`) samma dag —
ingen ny text skriven, ingen rad ändrad.

**Frågan från 2026-07-21 är fortfarande obesvarad och nu ÄNNU mer relevant:**
har hallprocessen (H·1-hubben, `/game/hall-provning`, byggd i release-svepet)
en debatt-/nyhetsyta som kan bära dem, eller väntar de fortfarande på en egen?
Obs M61-flaggan som fortfarande gäller: `{hallclub}` får inte substitueras med
en av spelets tolv Elitserieklubbar — de är utomhusklubbar, hallen är
drömbyggnation. Ska vara omvärldsklubb, samma mönster som `rumorService.ts`.
Ägare: Opus/Jacob avgör wiring eller permanent radering — se
`docs/INVENTERING_2026-08-31.md`.

---

## SMÅ ORPHANS — EJ TÄCKTA AV STÄDSVEPET

Dessa kom ur den mekaniska orphan-sweepen men låg utanför städordern. Ingen är
en halvfärdig feature; var och en är en enskild pool utan konsument.

| Fil | Export | Vad det är |
|---|---|---|
| `communityNames.ts` | `KIOSK_FLAVORS` | Kiosk-färgtext |
| `communityNames.ts` | `LOTTERY_FLAVORS` | Lotteri-färgtext |
| `communityNames.ts` | `EVENT_FLAVORS` | Evenemangs-färgtext |
| `specialDateStrings.ts` | `STUDAN_FACTS` | SM-finalarenans lore (historik, publikrekord, ikoniska matcher) |
| `specialDateStrings.ts` | `SAVSTAAS_FACTS` | Cupfinalarenans lore |
| `suspensionText.ts` | `SUSPENSION_INCIDENT_MULTI_LINES` | Flermatchsavstängning (enkelvarianten är wirad) |
| `suspensionText.ts` | `SUSPENSION_RETURN_LINES` | Avstängning avtjänad, spelare tillgänglig |
| `windowDeadlineText.ts` | `DEADLINE_KAFFERUM_TEXT` | Kafferumsprat om transferdeadline |
| `anniversaryMemoryRowText.ts` | `anniversaryRowDetail` | Detaljvariant (label-varianten är wirad) |
| `facilityPortalBeats.ts` | `FACILITY_AVAILABLE_BEAT` | "Nod blev tillgänglig"-beat |
| `facilityPortalBeats.ts` | `HALL_PROCESS_BEATS` | Hallprocess-beats |
| `upptaktCopy.ts` | `MUSTWIN_CRIT_TAGS` | Taggar ('Måstematch' m.fl.) |

Typ-only, noll runtime-kostnad: `AssistantFFInteraction`
(`assistantFFStrings.ts`), `RetirementOutcome` (`retirementText.ts`),
`TabIntroKey` (`tabIntros.ts`).

Två med naturligt nära hem, värda en blick före resten:
`DEADLINE_KAFFERUM_TEXT` (kafferummet finns och är nyss utbyggt) och
`SUSPENSION_RETURN_LINES` (recovery-poolen byggdes nyss i samma mönster).

---

## REGELN SOM GÄLLER

Ingen rad i den här filen raderas för att den är "död kod". De är död **yta**,
inte död text. Radering här förstör arbete som inte kan återupplivas utan att
skrivas om från grunden.

Superseterad kod — ett förstautkast som en levande version ersatt — raderas
tvärtom alltid, eftersom att lämna den skapar fällan att nästa läsare wirar mot
fel version (getCoffeeRoomQuote, getSeasonPhase, getBoardMeetingBeats).
