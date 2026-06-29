# BESTÄLLNING TILL CODE — B1 close-out + audit-fynd

**Av:** Opus · **Datum:** 2026-06-17
**Underlag:** gap-doc `bdbed5ae`, audit `fb061368`, §6 `facilityFinancingStrings.ts` (i working tree, bygger grönt)

**Mål:** stäng hela B1-strävan och de två luckor auditen gjorde levande, i en runda, kö mot noll. Kör stegen i ordning — beroenden är inlagda i ordningen. Ett commit per steg, titel matchar diff.

**Förutsättning:** §6 är klar och grön (`advanceFacilityState` wirad, `financingFlavor` i sheet:en). SPÄRREN på gamla facility-modellen är därmed upplöst.

---

## Steg 1 — §5 migration (FÖRST, med orphan-fixen)

Migrationen måste läsa gamla `facilityProjects` innan steg 2 tar bort fältet. Gör migrationsläsaren **självständig**: definiera en lokal legacy-shape (`interface LegacyFacilityProject` eller läs via `(raw as any).facilityProjects`) i migrationslagret så att den överlever utfasningen i steg 2.

Migrera `facilityProjects` → `builtNodeIds`:
- Färdiga gamla projekt (status `completed`) → motsvarande nod-id in i `builtNodeIds`.
- **Orphan-fixen (audit-fynd):** ett save mitt i ett pågående gammalt bygge får INTE nollas till `facilityState={}` — då stallar bygget (legacy-completion hoppas, nya modellen vet inget). Hantera det pågående bygget: fullfölj det i nya modellen (noden i in-progress-state med kvarvarande omgångar) eller, om enklare och försvarbart, slutför direkt vid migration. Välj den som inte tappar spelarens påbörjade bygge.

**Acceptans:** ett save med (a) färdiga gamla projekt och (b) ett pågående gammalt bygge migreras utan att något bygge försvinner eller stallar. Testfall för båda. Migrationsläsaren importerar inte den borttagna typen.

## Steg 2 — §5 utfasning av legacy-modellen

Ta bort den gamla modellen helt:
- Symboler: `getAvailableProjects`, `startFacilityProject`, `FacilityProject` (typ). `checkProjectCompletion` om den bara används av legacy.
- Grep:a hela `src/` på namnen och ta bort alla referenser. Kända träffar: `facilityService.ts` (exports), `communityProcessor.ts` (legacy-grenen `if (!game.facilityState) { … checkProjectCompletion … }` + `updatedFacilityProjects`), `SaveGame`-entiteten (`FacilityProject`-typ + `facilityProjects`-fält), `FacilityScreen` (redan på nya modellen — verifiera inga rester).
- Migrationslagrets lokala legacy-shape (steg 1) rörs inte.

**Acceptans:** noll referenser kvar till de tre symbolerna; `facilityProjects` borta ur SaveGame-typen; build + tester + `lint:design` grönt.

## Steg 3 — capacityBonus konsumeras (Opus-dom)

Idag returnerar `communityProcessor` `facilityCapacityBonus` (ur `advanceFacilityState`) men roundProcessor plockar aldrig upp den → en byggd läktares platser når aldrig `club.arenaCapacity`. (Verifierat: `Club.arenaCapacity` är ett lagrat fält, `number | undefined`.)

**Dom:** arenaCapacity är ett lagrat tak. En byggd anläggning är en permanent fysisk höjning av taket; reputation/form/väder driver hur *fullt* det blir, inte hur *stort*. Code's "frys vs reputation-derived" är en falsk gaffel — modellen är: `arenaCapacity = lagrad bas + Σ facility-bonusar`, närvaron beräknas dynamiskt mot det taket.
- I roundProcessor, där `facilityCapacityBonus` landar: addera den **engångs** till managed-klubbens `club.arenaCapacity` vid completion (init från bas om undefined). Inte per omgång.
- Verifiera att närvaro-/attendance-kalkylen cappar mot `arenaCapacity`.

**Acceptans:** bygg en kapacitetsnod i test → `arenaCapacity` ökar med exakt bonusen, en gång; närvaron överstiger aldrig taket.

## Steg 4 — C1 storySlot, gate på levande insats (Opus-dom)

omg≥20-armen släcker `storySlot` och kurerar secondary/minimal mot match-allowlisten. Rätt för en klubb med match kvar. Fel för en utslagen åskådar-klubb — där är utslagningen precis när en reflektion hör hemma.

**Dom:** gate:a storySlot-släckningen på *levande insats* (kvar i slutspelsrace / spelar match), inte på rå omg≥20. Utslagen + omg≥20 → behåll story-slot (reflektion/säsongsavrundning).
- Först: bekräfta om grenen redan skiljer på live-stake-klubbar. Gör den det är detta moot — rapportera då bara tillbaka, bygg inget.
- Annars: lägg gaten.

**Acceptans:** utslagen klubb omg≥20 behåller story-slot; contender omg≥20 oförändrad (släckt, matchfokus).

## Steg 5 — PreSeason Valet-ingången (verifiera först, bygg bara om turn-key)

"TVÅ ingångar, ETT träd" — bara löpande FacilityScreen-välj-mode finns; preseason-ingången saknas.
- Verifiera om FacilityScreen-trädet kan öppnas i rätt mode från PreSeason "Valet"-flödet med **befintlig** UI.
- Ren wiring (samma träd, annan ingång): gör det.
- Kräver ny UI eller copy: **STOPP, bounce till Opus/Design** med vad som saknas. Bygg inte ny yta blint.

**Acceptans:** antingen preseason-ingången wirad mot samma träd, eller en rad tillbaka om vad som behöver designas.

## Steg 6 — financing-kalibrering: rapportera, döm inte

Spec-värdena på financing (clubCost/contribution/reason-trösklar) är inte balanstestade.
- Kör financing-utfallet mot ekonomimodellen för en typisk klubb över en säsong: håller kommun-/mecenat-andelarna en rimlig kassakurva, eller bryter något?
- **Döm inte värden själv** — lägg siffrorna framför Opus/Jacob.

**Acceptans:** en kort utfallstabell, inga tysta värdeändringar.

---

## Commit-plan

Steg 1, 2 var sitt commit (migration före utfasning, icke förhandlingsbart). Steg 3 och 4 kan slås ihop om diffarna är små, annars var sitt. Steg 5–6 är verifiera-först — commit bara om något faktiskt byggs/ändras. Titel matchar diff, hash + faktiskt innehåll.

## Kvar — INTE i den här ordern, med ägare (så inget hänger osynligt)

- **Nödtrupp soft-lock + ceremoni-heron (Lucide):** byggt, väntar **Jacobs genomspelning** (playtest-verifiering / glans-titt). Inte Code.
- **C1 säsong-2-start** (premiär-reset vs endgame-bär): **Opus** läser säsongsövergången och fäster dom — på Jacobs go.
- **BACKLOG C/D-städrunda** (gallra maj-skisser, process-regel 6): **Code**, på Jacobs go.
- **Spelkänsle-omdesign A/B/C:** hos **Design**. A efter datacheck + genomspelning. Se `REVIEW-SPELKANSLE-GENOMGANG-OPUS-2026-06-17.md`.

— Opus, 2026-06-17
