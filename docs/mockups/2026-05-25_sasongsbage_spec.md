# Säsongsbåge + periodisering — spec för Code

**Par:** `2026-05-25_sasongsbage_mock.html` (levererad som nedladdning, ska in i `docs/mockups/`).
**Författare:** Opus. **Status:** ytan låst av Jacob 2026-05-25. **Bygge:** Code.
**Ton/regler:** ljus Heritage-palett, auktoritativa tokens (`colors_and_type.css`), inga nya tokens, inga dekorativa vänster-stripes (severity-undantaget orört), bandysvensk understatement.

---

## Vad det är

Dagens `fitness` är en platt sågtand utan säsongsdimension: tappa på match, klicka tillbaka per bearbetad omgång. Spelaren kan inte tränas för att hålla en säsong eller toppa mot slutspel, och `stamina`-attributet rör inte kurvan alls.

Bågen inför en långsam grundform som managern formar över säsongen via ett periodiseringsläge, plus undantagshantering per spelare. Den **ersätter** "Truppens puls" (`SquadPulseHero`) högst upp i NU-fliken.

Viktigt för omfånget: **två av tre axlar finns redan.** Vi lägger till *en* ny långsam axel och en lagspak. Resten är wiring och yta.

---

## Modellen — tre axlar per spelare

| Axel | Fält | Status | Horisont |
|---|---|---|---|
| Grundform | `player.seasonForm` (0–100) | **NY** | Långsam — månader |
| Dagsform | `player.fitness` (0–100) | finns | Snabb — match till match |
| Matchskärpa | `player.sharpness` (0–100) | finns | Medel — minuter spelade |

**Relation:** grundformen är taket. Dagsformen pendlar *under* grundformen (matchdrag ned, vila upp) och kan inte överstiga `seasonForm + ~3`. Matchredo i motorn = dagsform, men dämpad av hur högt grundformen lyft taket. Toppform = hög grundform + färsk dagsform + hög skärpa samtidigt, vid rätt tillfälle.

**`stamina` får äntligen ett jobb:** den modulerar takten — hög stamina = långsammare dagsform-tapp, snabbare återhämtning, håller grundform bättre under Bygg. (Koefficient = tuning, se nedan.)

---

## Periodiseringsläge (snabbvalet)

- Lagnivå: `game.managedClubPeriodisation: 'bygg' | 'hall' | 'toppa' | 'vila'`, default `'hall'`.
- Per spelare-undantag: `player.periodisationOverride?: 'hall' | 'vila' | null` (null = följer truppen). Override finns för att lätta på de få som flaggas — inte för mikro.
- Effektivt läge för en spelare = `periodisationOverride ?? managedClubPeriodisation`.

### Läge → effekt per omgång (i `playerStateProcessor` / `trainingProcessor`)

Riktning, inte slutgiltiga tal — magnituderna är tuning (se sist). Match­draget på `fitness` (15–24) ligger kvar oförändrat; det här styr *bas + återhämtning + skärpa*.

- **Bygg** — `seasonForm` +~1,5/omg mot tak ~88. `fitness` extra kostnad kort (tyngre träning), skaderisk +~15 %. Skärpa svagt ned. *Bär laget mot vår, kostar nu.*
- **Håll** — `seasonForm` ±0. `fitness` normal återhämtning. Skärpa normal. *Ingen drift.*
- **Toppa** — `seasonForm` +~1/omg i ~3 omg, sedan −~1,7/omg (toppen kan inte hållas). `fitness` + (färskhet), skärpa +~2,4. *Tajmas mot slutspelet.*
- **Vila** — `seasonForm` −~1/omg. `fitness` ++ (snabb repa). Skärpa −~3 (rost). *Bra efter tung period, dyrt som vana.*

### Kalenderbaserad återhämtning (subsumeras här)

Dagsform-återhämtningen mellan omgångar ska skala mot **dagar mellan matcher** (via `fixture.date`-delta), inte vara en fast klick per bearbetad matchdag. Ett tre-veckors uppehåll (okt-cup → liganovember) ska vila mer än en vecka. Tak så man inte vilar till 100 på en paus; bunden av `seasonForm`.

---

## Flaggregler (undantag i NU)

Ny tjänst `periodisationService.ts`: `getReaction(player, effectiveMode) → { type: 'warn'|'good'|'rust', text } | null`. Deterministiskt från ålder / stamina / skade-retur / skärpa.

- **warn** (amber): läget är riskabelt. Bygg på ålder ≥33 el. låg stamina → "Tål inte Bygg". Toppa på ålder ≥33 → "Orkar ej spiken". Bygg/Toppa på spelare nyss tillbaka från skada → "Ramp först".
- **good** (grön): läget gynnar. Bygg på ålder ≤20 → "Bygger snabbt".
- **rust** (blå): läget kostar minuter/skärpa. Vila på ung spelare → "Behöver minuter". Vila på nyckelspelare med hög skärpa → "Rostar av vila".

`undantag`-räknaren = endast **warn**. good/rust visas men räknas inte. Tröskelvärdena (åldersgränser, stamina-gräns) är tuning.

---

## Ytan — NU-fliken

1. **Ersätt `SquadPulseHero` med `SeasonArcCard`** högst upp i NU (`SquadScreen`, `screenTab === 'nu'`):
   - Trelinje-sparkline över säsongen: grundform (`--accent`, fyllig), dagsform (`--gold-deep`, tunnare), skärpa (`--cold`, streckad). "Du är här"-markör + svagt topp-målband vid slutspelsfönstret. Liten legend.
   - Snabbval-dial Bygg/Håll/Toppa/Vila. Aktiv = `--accent`-ram + `rgba(196,122,58,.12)`-ton (ingen gradient på knapp). Den framtida delen av kurvan tweenar vid lägesbyte.
   - Sammanfattning: "Truppen: {läge} · N undantag".
2. **Ny attention-sektion "Reagerar på {läge}"** bland NU:s befintliga sektioner (Skadade/Avstängda/Moral/Kontrakt/Formation). Listar bara spelare med reaktion, med tap-för-override (Följ trupp / Håll / Vila). Tomt läge: "Ingen reagerar. Hela truppen följer {läge}."
3. Moral/skade-info som pulsen bar finns kvar i de befintliga sektionerna — inget tappas.
4. **Skärpa = linje, inte chip** (Jacobs beslut 2026-05-25). Tre linjer på det kompakta kortet är verifierat OK på mocken.

Mocken är referens för exakt form. Multi-serie-sparkline: kolla om `Sparkline`-primitiven klarar tre serier — annars komponera tre överlagrade eller bygg en liten variant. Återanvänd primitiven om möjligt.

---

## Filer Code rör

- `Player` (entity): lägg `seasonForm: number`, `periodisationOverride?`.
- `SaveGame` (entity): lägg `managedClubPeriodisation`.
- `worldGenerator.ts`: init `seasonForm` ~55–70 (försäsong, ej toppad — i linje med att `fitness` startar 60–90).
- `playerStateProcessor.ts` + `trainingProcessor.ts`: läge → axel-matematiken, kalenderskalad återhämtning bunden av `seasonForm`, grundforms-utveckling, stamina-modulering. Skärpa finns redan (+10/−5/−3) — behåll.
- `periodisationService.ts` (ny): flaggreglerna.
- `gameStore`: actions `setPeriodisation(mode)`, `setPlayerPeriodisationOverride(id, mode|null)`.
- `SquadScreen.tsx` (NU): byt `SquadPulseHero` → `SeasonArcCard`; lägg Reagerar-sektionen.
- `SeasonArcCard.tsx` (ny komponent).
- Matchmotorn: säkerställ att skärpa + dagsform (dämpad av grundform) faktiskt påverkar prestation. Koefficient = tuning, flagga den.

Granulär träning (fys/teknik) ligger kvar under Klubb. Snabbvalet är den höga spaken i NU.

---

## Tuning (Code sätter startvärden, Jacob/playtest justerar)

Per-omgångs-magnituderna ovan, topp-decay-takten, skärpans prestationsvikt i motorn, skaderisk-påslaget under Bygg, stamina-koefficienten, flagg-trösklarna. Nya konstanter → **D-facts + `validate_brain`** (magnitudregeln i CLAUDE.md).

---

## Verifiering — i kontext, inte isolerat

Spåra ett helt `advance` och rendera NU-fliken på riktigt (inte komponenten isolerad).

- **Håll** en hel säsong: grundform ~platt, laget varken toppar eller kollapsar.
- **Bygg** ett block: grundform klättrar, dagsform dippar kort, 1–2 warn-flaggor (veteran/retur), skador tickar svagt upp.
- **Toppa** nära slutspel: dagsform+skärpa spikar ~2–3 omg, sedan ned. Toppa i november → platt i mars.
- **Vila**: dagsform repar snabbt, skärpa ned, unga flaggar "behöver minuter".
- NU renderar bågkortet korrekt i kontext, dialen ändrar `managedClubPeriodisation`, Reagerar-sektionen uppdateras vid lägesbyte, override droppar spelaren ur räknaren men visar dashed "Undantag".

---

## Ordning för Code

1. Entity-fält + store-actions (`seasonForm`, `managedClubPeriodisation`, override, setters).
2. `periodisationService.ts` (flaggregler) — ren, testbar.
3. `playerStateProcessor`/`trainingProcessor`: läge-matten + kalenderskalad återhämtning + grundform + stamina. D-facts + `validate_brain`.
4. `SeasonArcCard.tsx` + byt ut `SquadPulseHero` i NU + Reagerar-sektionen.
5. Matchmotor-kopplingen (skärpa + grundforms-dämpad dagsform).
6. Verifiera över en säsong per ovan.
