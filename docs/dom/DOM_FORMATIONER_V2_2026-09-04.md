# DOM — FORMATIONERNA V2: SEX UPPSTÄLLNINGAR PÅ BANDYNS EGEN AXEL

**Status:** BYGGD 2026-09-04 (Code, commit 18ff34e3), verifierad tsc/447 filer/4 312 tester/build/fyra grindar/browser. Kvar: 5-2-3:s konditionskostnad (konservativ konstant) mäts i C2; tre scripts utanför tsconfig uppdateras före mätningen (MASTER `formationer-v2-scripts-utanfor-tsconfig`).

**Datum:** 2026-09-04 · **Dömt av:** Jacob (väg 1, sex formationer) · **Skrivet av:** Opus · **Bygger:** Code · **Mäter:** kalibreringsrundan C2
**Källor:** `BANDYTAKTIK_KALLASNING_2026-09-04.md` (SvBF spelarutvecklingsplan 2020 §2.4; GIH 2023; SvenskaFans 2013), `docs/kallor/BANDY_TAKTIK_WEBBKALLOR_2026-09-04.md`, `BANDY_KANON.md` §2–§4, `tacticModifiers.ts`, `TEXT_REVIEW_formations_2026-04-20.md` (ersätts).
**Reverserar:** DOM 2026-04-20 ("formationen är matchmotor-neutral, taggar är anatomi") — medvetet. Taggar förblir anatomi. Neutraliteten ersätts av EN källbelagd effekt.

## Domen

Spelets sex formationer med varierande försvarslinje (5-3-2, 3-3-4, 4-3-3, 3-4-3, 2-3-2-3, 4-2-4) ersätts av sex uppställningar med **femman bak konstant**. Formationen bär **höjdläget** — det enda formationsval bandyns källor ger en effekt — och `press`-axeln försvinner som eget reglage. De fyra 5-3-2-formerna skiljer sig i **frontens och mittfältets form** och verkar genom slot-kartan, positionspassningen och kemin, inte genom egna multiplikatorer. Fotbollsswitchen i `tacticModifiers` (fyra bak = tryggare) tas bort: ingen källa stödjer den.

Sju axlar kvar på taktikskärmen. Sex formationer, som idag. Motorn rörs på ett ställe.

## De sex

| # | Namn (UI) | Id | Form | Höjdläge | Kräver av truppen | Källa |
|---|---|---|---|---|---|---|
| 1 | **5-3-2 två toppar** | `532_tvatoppar` | Platt trea på mitten, två anfallare brett. Styrspel. **Default.** | mellan | 2 FWD, 3 MID | SvBF §2.4.2.1 ("de flesta lag spelar med tre mittfältare"), "två centrala toppforwards" |
| 2 | **5-3-2 triangel** | `532_triangel` | En spets, två mittfältare höga bakom. | mellan | 1 FWD (spets) + 1 FWD i triangelns bas, 2 MID som går högt, 1 MID — *rättat 2026-09-04: domens ursprungliga rad var en spelare kort för elva (Codes fynd vid bygget); implementerat med en andra FWD-slot* | SvBF §2.4.2.2 ("en triangel längst fram") |
| 3 | **5-3-2 ytterben** | `532_ytterben` | En defensiv mittfältare, två offensiva ytterben. Hammarbys SM-form. | mellan | 2 snabba MID, 1 läsande MID, 2 FWD | Brodén/Liw (SvenskaFans del 1, 6) |
| 4 | **5-3-2 höga halvor** | `532_hogahalvor` | Ytterhalvorna går med i anfallet; bortre halven faller in som extra libero. | mellan | 2 HALF med lungor | SvBF §2.4.2.1 (ytterhalvor "deltar ofta i offensiven", motsatt sida "extra libero"), Einarsson (del 5) |
| 5 | **5-2-3 hög** | `523_hog` | Forechecking. En mittfältare upp, press på utkastet. | **hög** | 3 FWD eller 2 FWD + 1 MID som kan | SvBF §2.4.2.2 ("5-2-3 uppställning … väldigt kraftödande … kortare perioder") |
| 6 | **5-4-1 hem** | `541_hem` | Ta hem, tjocka. Fyra på mitten, en topp. Krymper ytorna, bryter lågt. | **låg** | 1 FWD som orkar ensam, 4 MID/HALF som täcker | SvBF Definitioner (tjocka, ta hem), GIH 2023 (5-4-1) |

Femman bak i alla sex: två backar, libero, två ytterhalvor. I #4 flyttas halvornas slots högre (samma personer, annan y).

**Namnen är anatomi.** Ingen "offensiv", ingen "defensiv" — mentalitet är en axel och dubbelräknas inte (tagg-domen 2026-04-20 står). Tags per formation: `FEMMAN BAK` (alla), `TVÅ TOPPAR` / `SPETS` / `YTTERBEN` / `HÖGA HALVOR` / `TRE TOPPAR` / `EN TOPP`, `HÖGT PRESS` (#5), `LÅGT` (#6), `KRÄVER LIBERO` (alla — liberon är obligatorisk i bandy, Brodén: "jag ser inte hur det skulle fungera" utan).

## Motorn — vad som ändras och vad som inte

**Tas bort:**
- Formations-switchen i `getTacticModifiers` (`2-3-2-3` +0.05/−0.08, `4-3-3`/`4-2-4` −0.03/+0.05). Noll källstöd, fotbollsriktning.
- `press` som eget fält på `Tactic` och som reglage på taktikskärmen.

**Läggs till:**
- `heightMode: 'low' | 'mid' | 'high'` härlett ur formationen (inte ett eget fält spelaren sätter): `541_hem` → low, alla `532_*` → mid, `523_hog` → high.
- `getTacticModifiers` läser `heightMode` där den förr läste `press`, med **exakt dagens tal**: low = press −0.15, fatigue −0.05; mid = discipline +0.05; high = press +0.15, discipline +0.15, fatigue +0.10. Inga nya magnituder uppfinns i domen.
- `buildSequenceWeights`: `press === 'high'` → `heightMode === 'high'` (+foul +transition), oförändrat i övrigt.
- **Konditionskostnad för 5-2-3**, det källan uttryckligen kräver ("kraftödande, kortare perioder"): en per-omgångs-kostnad på truppens kondition när formationen är `523_hog`, utöver `fatigueRate`. Magnitud = **kalibreringsrundan C2**, med godkänt-kriteriet som redan står där: hög press över 22 omgångar ska förlora mot balanserat minst lika ofta som den vinner, men förbli starkast där kontexten stöder den. Startvärde konservativt, mätt över 10 000 seeds.
- Halvtidsbyte av formation fortsätter fungera som idag (regenerate) — det är där 5-2-3 hör hemma: i jakten, inte i grundläget.

**Ändras INTE:**
- De fyra 5-3-2-formerna har **ingen egen multiplikator**. De verkar genom slot-kartan (vem står var → positionspassning och CA-rabatt), kemin (slots x/y) och truppkraven. Rollen skapar skillnaden — det är forskningens slutsats (Andersson 2022, van den Tillaar 2023), och det är ärligt tills något är mätt.
- Mentalitet, tempo, passningsrisk, bredd, anfallsfokus, hörnstrategi, utvisningsspel — sju axlar, orörda.
- B12: `tacticalFactors` byter etikett `press_high` → `formation_523` och får `formation_541`; B12-specens katalog A ("Hög press") läser den nya etiketten. Inget annat.

**V2, inte nu:** att låta formerna väga i motorn via rollerna (ytterben → fler omställningssekvenser, två toppar → fler anfall/hörnor, höga halvor → bredd men exponering på kontring). Sourced som *tendens*, inte som tal. Byggs bara efter B12 visar att spelaren läser formerna, och bara med mätning.

## Migrering (save-schema)

Gammal `formation` + gammal `press` → ny formation, så spelaren behåller den EFFEKT hen faktiskt hade (press var effekten, formationen kosmetik):

| Gammal press | Gammal formation | Ny formation |
|---|---|---|
| Low | (alla) | `541_hem` |
| High | (alla) | `523_hog` |
| Medium | 5-3-2, 3-3-4, 4-2-4 | `532_tvatoppar` |
| Medium | 4-3-3, 3-4-3 | `532_triangel` |
| Medium | 2-3-2-3 | `532_ytterben` |

`press` tas bort ur `Tactic`; migreringen läser det gamla värdet innan fältet stryks. AI-klubbars taktik migreras med samma tabell. Lineups i pågående fixture (`homeLineup.tactic`) migreras också. Regressionstest per rad i tabellen.

## Text (Opus skriver, Code kopierar ordagrant)

Levereras i `FORMATIONER_V2_TEXT_2026-09-04.md` (ersätter `TEXT_REVIEW_formations_2026-04-20.md`): per formation namn, tags, en coach-mening i bandyregister, truppkrav i klartext; taktikskärmens rubrik för formationsvalet ("Uppställning", inte "Formation" — bandyns ord); Klubbpärmens formationsavsnitt omskrivet (kapitlet Matchen); B12-katalog A:s text med "5-2-3" i stället för "hög press" där det står.

## Arbetsordning

1. **Opus:** texten (samma dag som denna dom om möjligt).
2. **Code, en pass, strangler:** ny formationsdata (sex slot-kartor med x/y för kemi) → `heightMode` + `getTacticModifiers` utan formations-/press-switch → `Tactic` utan `press` + save-migrering → taktikskärmen (formationsval med tags, press-reglaget bort) → positionspassning mot nya slots → B12-etiketter → tester (migreringstabellen, sju axlar orörda i output, `523_hog` ger dagens press-hög-tal, `541_hem` dagens press-låg-tal, formations-switchens gamla tal borta) → tsc/build/design/content/dubblettgrind.
3. **Kalibreringsrundan C2:** 5-2-3:s konditionskostnad. Kan mätas först när steg 2 står.
4. **Kanon §3** skrivs om; öppen fråga #1 stängs. `TEXT_REVIEW_formations_2026-04-20.md` arkiveras med pekare hit.
5. **GPT:** taktiktestet igen (tre matcher) när B12 + V2 står — samma fråga: förstår spelaren varför det gick som det gick?

## Godkänt när

Sex uppställningar i UI med femman bak i alla; press-reglaget borta; `tacticModifiers` utan formations- och press-switch; migrerade saves behåller effekten; 5-2-3 kostar mätbart kondition per omgång och förlorar över en serie mot balanserat (C2); alla tester gröna; kanon §3 sann mot koden.

## Ägarskap

**Jacob:** dömt. Kvitterar texten och C2:s tal.
**Opus:** text, kanon, B12-katalogens etikett.
**Code:** allt i steg 2. Börja med formationsdata + migreringen — det är där risken sitter.
