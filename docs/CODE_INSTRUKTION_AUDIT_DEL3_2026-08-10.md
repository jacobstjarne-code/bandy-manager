# CODE-INSTRUKTION — IMPLEMENTATIONSAUDIT DEL 3

**Datum:** 2026-08-10 · **Av:** Opus (chat)
**Underlag:** `docs/incoming/Implementationsaudit-del3-2026-08-09.dc.html`, `docs/incoming/github-synk-del3-2026-08-09.md`
**Status vid skrivande:** inget av del 3 finns i produktionsbygget. Verifierat mot `d94aac6`: `RoundSummaryScreen.tsx` finns kvar och routen svarar, "Klubben i korthet" saknas, `builtSeason` saknas som fält, `Nemesis:` nere i en förekomst efter del 2:s A2 men Club och History är orörda.

Kör efter dubbelrenderingsgrinden (`data-entity-id`), före allt annat i kön.

---

## 1. Granska-dubbletten — routing, inte innehåll

`GranskaScreen` är kanon. Grunden: `AppRouter.tsx` pekar `/game/review` dit, och `RoundSummaryScreen` ligger i en egen routegrupp **utanför `GameShell`** — alltså utan bottennavigation. En kanonisk omgångsceremoni utan bottennav är en återvändsgränd, inte en destination.

**Ordning:**

1. Grepa `src/` efter alla navigeringar till `round-summary` — `navigate(`, `<Navigate`, `globalNavigate`, strängkonstanter. **Rapportera träffarna innan något raderas.** Bundeln har två förekomster; en är routedefinitionen, den andra är okänd för mig.
2. Peka om varje träff till `/game/review`.
3. Ta bort `RoundSummaryScreen.tsx`, dess route och dess import.

**Rör inte** `SimSummaryScreen`, `QFSummaryScreen`, `HalfTimeSummaryScreen`. De är distinkta `PendingScreen`-triggers i `PENDING_SCREEN_ROUTES`, inte varianter av samma ceremoni.

**Rör inte innehållet i `GranskaScreen`.** Ytan granskas separat av Design (`DESIGN_UPPDRAG_GRANSKA_DEL4_2026-08-10.md`) och den granskningen körs parallellt med det här. Allt du ändrar i `granska/` nu kolliderar med den.

---

## 2. Emoji-svepet

**Gäller emoji i copy och i datafält. Gäller INTE emoji som sektionsmarkör.**

Den skillnaden är avgörande och lätt att slarva bort. `📊 TABELL`, `📈 FORM`, `⭐ MILSTOLPE` i Granska är chrome och ska stå kvar — husets regel tillåter emoji på sektionsetiketter. Det som ska bort är emoji som bär betydelse i data eller som villkor i logik.

Kända fall från auditen:
- Club: träningsskade-parsningen med `⚠️` i sträng, samma mönster som Inbox hade
- History: motsvarande parsning

**Ordning:** grepa `src/` efter emoji som förekommer i strängjämförelser (`startsWith`, `includes`, `match`, `===`) eller som byggs in i `title`/`body`-fält. Rapportera listan innan du bygger. Varje träff blir ett strukturerat fält plus Lucide-ikon i renderingen, som A2 gjorde för Inbox.

Om listan innehåller något du är osäker på om det är chrome eller data: fråga, gissa inte.

---

## 3. Club — "Klubben i korthet"

Strip över de sex flikarna enligt auditens efter-bild: epok plus öppna minnen. Befintliga tokens, ingen ny komponentfamilj.

Diagnosen bakom den: det säsongsöverskridande — Minne och Tränare — ligger sist och gråast i en tunn flikhubb. Strippen lyfter det som knyter ihop säsonger till toppen av den yta som handlar om klubben över tid.

**Baseline före ombyggnad**, som alla ytor: Club i minst två tillstånd — säsong 1 utan öppna minnen, och en senare säsong med flera.

---

## 4. Anläggning — `builtSeason`

Fältet skrivs per nod när noden byggs. Ingenting konsumerar det ännu, och ingenting ska byggas som konsumerar det nu.

Skälet att det ändå görs först: fältet kan bara fyllas framåt. Byggs det efter att spelare hunnit bygga noder saknas historiken för allt som byggdes dessförinnan, och Krönikans årsdagar får ett hål som inte går att laga i efterhand. Det är billigt nu och omöjligt sedan.

Migration för befintliga saves: `builtSeason` som valfritt fält, `undefined` för noder byggda före ändringen. Ingen gissning bakåt.

**Projekt bortom egna arenan ingår inte.** Det är feature och ligger med etapp C.

---

## Ordning

`data-entity-id`-grinden → 1 (rapport först) → 2 (rapport först) → 3 → 4.

## Text

Ingen ny svensk copy. Behöver strippen eller något annat en rad som inte finns: märk `[Opus]` och lämna listan till mig.

## Innan något markeras klart

Browser-verifiering enligt CLAUDE.md, snapshots gröna, `npm run build && npm test`, `lint:design`, `lint:text-guard`. Audit i `docs/sprints/`.
