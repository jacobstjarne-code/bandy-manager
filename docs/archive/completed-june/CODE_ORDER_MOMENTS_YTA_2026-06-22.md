# CODE-ORDER — Moments-yta (klubbens säsong i Minne-fliken)

**Av:** Opus, 2026-06-22. **Till:** Code.
**Grund:** Fable-genomgång `design-system/briefs/MOMENTS-GENOMGANG-FABLE-2026-06-22.html`
+ Opus källverifiering (`Moment.ts`, `clubMemoryService.ts`, `HistoryScreen.tsx`,
`ClubMemoryView.tsx`, `ClubScreen.tsx`) 2026-06-22.

---

## Vad och varför

`game.recentMoments` (`Moment[]`) skrivs varje omgång från ~12 off-pitch-källor
(mecenat, sponsor, kaptenskris, transferhistoria, era-skifte, rival-försäljning,
derbyseger m.fl.) i `roundProcessor` + `seasonEndProcessor`. **Ingen `.tsx` läser
fältet** — det konsumeras bara av `collectActiveMemories()`, som i sin tur bara
läses av sitt eget test. Levande data, ingen yta (AUDIT_SYNLIGHET_2026-05-21-fyndet,
står kvar). Den här ordern bygger ytan.

**Läs `recentMoments` direkt — INTE `collectActiveMemories()`.** Aggregatorn väger
in klack/journalist/nemesis, källor Efterklang redan ekar; en yta för aggregatet
skulle dubbel-visa Efterklang. recentMoments är den smala, genuint osynliga
off-pitch-strömmen. Byt inte till aggregatorn under bygget.

---

## Var (render-topologi — verifierad mot källan, blanda inte ihop)

- **ClubScreen 'minne'-fliken → `ClubMemoryView.tsx`** = den spelarvända
  "Minne"-fliken (`ClubTab` innehåller `'minne'`, label "Minne", description
  "Klubbens historia, legender och minnesvärda ögonblick"). Renderar
  `getClubMemory(game)` → säsongssektioner (tvärsäsong, retrospektivt) + legender
  + rekord, med gate `totalEventsAcrossSeasons < 3 → ClubMemoryEmpty`.
- **`HistoryScreen.tsx`** ("Klubbhistorik") = SEPARAT helskärm, äger JourneyGraphen
  + säsonger/brev/skola/foton. **Importerar INTE ClubMemoryView.** Fables brief skrev
  "ovanför JourneyGraph", men JourneyGraphen bor här, inte i Minne-fliken. Gå på
  **Minne-fliken (ClubMemoryView)** — inte HistoryScreen.

**Mål: `ClubMemoryView.tsx`, ett nytt inom-säsongs-block ÖVERST**, ovanför
`clubMemory.seasons.map(...)`-sektionerna. "Det som hänt klubben i år" ovanför
"åren som gått".

---

## Gate-logik (viktig — får inte missas)

recentMoments-blocket får INTE gömmas bakom `totalEventsAcrossSeasons < 3`-gaten.
En säsong-1-klubb har <3 historiska events men kan mycket väl ha färska
off-pitch-beats. Logik:

- `recentMoments.length > 0` → rendera inom-säsongs-listan (oavsett historik-gaten).
- annars, `totalEventsAcrossSeasons < 3` → `ClubMemoryEmpty` (som idag).
- annars → säsongssektioner (som idag), inget inom-säsongs-block.

Dvs blocket ligger FÖRE den nuvarande gate-returen; gaten styr bara resten av vyn.

---

## Anatomi (per Fable-mock, ren konsumtion)

Lista av de senaste (recency-sorterat, max 5). Varje rad:

- vänster `kind`-stripe (2px) + `kt`-etikett. Färg ur **`momentKind(m.source)`**
  (funktionen finns redan i `clubMemoryService.ts` men är inte exporterad —
  **exportera den, duplicera INTE switchen**): `triumph`→`--success`,
  `scar`→`--danger`, `tension`→`--cold`, `neutral`→`--warm`.
- `title` (serif, fet), `body` (serif kursiv, mindre), omgång (mono, höger i
  etikettraden).
- befintlig kort-primitiv (`.card-sharp` eller club-memory-CSS:ens kort). Inga nya
  tokens.

Bekräfta att `recentMoments` redan är recency-sorterat + cappat när det skrivs
(per BACKLOG: `roundProcessor.ts:1443` — verifiera radnumret mot HEAD). Om inte:
sortera `matchday` desc + `.slice(0, 5)` i vyn.

---

## Opus-copy (färdig — kopiera rakt av, skriv INTE egen text)

Block-header (samma lugna stil som ClubMemoryViews övriga etiketter):

- rubrik: `Det som hänt`
- under (mono, dämpad): `SÄSONGEN`

`kind`-etiketter (`kt`):

- `triumph` → `Triumf`
- `scar` → `Ärr`
- `tension` → `Laddat`
- `neutral` → `Noterat`

`title`/`body` finns redan skrivna per moment i datat — rör dem inte.

---

## Fable-öppna items

1. **(redan ovan)** Läs `recentMoments`, inte aggregatorn.
2. **Retention 5, recency-sorterat.** `season_highlight` (M12 — Årets match)
   infogas bara vid seasonEnd (per BACKLOG `seasonEndProcessor.ts:1294`) och
   slice:as in i de 5. Verifiera mot källan att inom-säsongs-beats inte tyst trängs
   ut FÖRE säsongsslut. Rapportera vad cap/insert-ordningen faktiskt gör — ändra
   inget i domänen utan att flagga det först.
3. **`subjectPlayerId` / `subjectClubId`** finns på `Moment` men används ej i mocken.
   VALFRITT påslag: gör raderna tappbara (→ spelarkort via befintlig `PlayerLink`,
   → klubbprofil). Bygg bara om det är billigt; annars hoppa — ingen blockare.
4. **Domänen orörd.** Ingen ny modell, ingen ny text (utöver Opus-copyn ovan), inga
   nya tokens. Bara `momentKind`-export + en ny renderyta i ClubMemoryView.

---

## Verifiera i kontext (ej isolerat)

Läs ClubScreen 'minne'-grenen → ClubMemoryView-render. Spåra hela flödet. Rapportera
"renderas korrekt i Minne-fliken med inom-säsongs-block överst + gate intakt", inte
"komponenten finns". Säsong-1-fallet (recentMoments finns, historik <3) ska visa
listan, inte ClubMemoryEmpty.

---

## Slutrapport (obligatorisk)

Commit-hash + en mening per:
- (a) `momentKind` exporterad + konsumerad i vyn (ej duplicerad switch)
- (b) inom-säsongs-block i ClubMemoryView ovanför säsongssektionerna
- (c) gate-logiken (säsong-1 med beats visar listan, inte Empty)
- (d) öppen item 2-fyndet (cap/insert-ordning för season_highlight)
- (e) item 3 byggd eller medvetet hoppad

---

## LEVERERAT `4413ff46` (2026-06-22) + ÅTERSTÅR

Code levererade (a)–(e). Opus källverifierade: `momentKind` exporterad + konsumerad ✓; block + CSS byggt och stylat i `ClubMemoryView` (`club-memory.css`: kind-stripe success/danger/cold/warm, kt färgad, titel display 600, body display italic) ✓; write-blocket i `roundProcessor` är `.slice(0, 5)` recency-sorterat — korrekt (rapportens "`.slice(5)`" var felskrivning) ✓; säsongsslut-eviktering acceptabel, domän orörd ✓; tappbarhet hoppad (post-playtest) ✓.

**ÅTERSTÅR — en enradsfix (Code), FÖRE Jacobs playtest:** gaten renderar `ClubMemoryEmpty`-herot ("📖 Historien tar form") UNDER beats-listan i säsong 1 (beats finns men <3 historiska events) — motsägelsefullt i precis det fall gate-fixen fanns till för. Ändra i `ClubMemoryView.tsx`:

`<ClubMemoryEmpty />` → `recentMoments.length === 0 && <ClubMemoryEmpty />`

(Empty visas bara när det varken finns beats eller historik.)

Valfri framtid (ej bugg, playtest-beslut): `m.season === currentSeason`-filtrering om "SÄSONGEN"-rubriken skaver vid säsongsbyte (tvärsäsongs-sorteringen kan visa förra säsongens beats första omgångarna).

Stängs + arkiveras till `completed-june/` när enradsfixen landat.
