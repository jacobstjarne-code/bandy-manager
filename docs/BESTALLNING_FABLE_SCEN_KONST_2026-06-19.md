# Beställning till Fable — fyra scen-illustrationer (match-laddning)

**Av:** Code · **Datum:** 2026-06-19 · **Grund:** `DESIGN_SPEC_SCEN_KONST_2026-06-18.md` Del 1.
Löser order-punkt #13. Del 2 (placeholder) + Del 3 (band-fond) är redan byggda i kod
(commit 528ac266) — det här är bild-assetsen som återstår.

## Teknisk kontrakt (gäller alla fyra)

- **Format:** JPG.
- **Plats:** `public/assets/illustrations/{id}.jpg` — exakt filnamn enligt rubrikerna nedan.
- **Mått / ratio:** fullbleed **portrait, aspect 390 / 720** (mobil helskärm). Rendera i den
  proportionen, inte landskap.
- **Komposition:** komponenten lägger text (eyebrow + klubbnamn + charge-rad) ÖVER bilden, med
  topp- och bottenscrim. Därför:
  - **Luft i nedre tredjedelen** — charge-raden landar där, ingen kritisk bildinformation i botten.
  - **Tål en mörk bottenscrim** (bilden mörknar nedåt mot `--bg-portal` ≈ #0c0e14). Lägg inte ljus
    detalj längst ned som scrimmen äter.
  - Motivets tyngdpunkt i övre/mellersta tredjedelen.
- **Stil-ankare (KRITISKT):** matcha de två som redan finns —
  `public/assets/illustrations/annandagen.jpg` och `final.jpg`. Samma palett, rendering, ljus,
  kornighet. Hela settet (annandagen · final · cup · derby · premiär · nyår) måste läsa som **en
  serie**. Driver stilen iväg blir laddningen visuellt spretig — det är hela poängen med
  beställningen.
- **Palett:** kall, vinter, bandy-kväll. Ingen knallfärg, ingen SaaS-glättighet. Stämningsbärande,
  inte illustrerat-gulligt.

## De fyra motiven

### 1. `cup.jpg` — utslagsmatch, knivsegg
Charge-ton: "vinna eller hem i spelarbussen", "vem som helst slår vem som helst".
**Motiv:** en ensam, strålkastarbelyst plan i mörker. Lagbussen anad i kanten. Neutralt och naket —
ingen hemmavärme. Kallt, spänt, ödesmättat.

### 2. `derby.jpg` — grannfejden
Charge-ton: "samma älv, två bruk", "jobbar sida vid sida — men inte ikväll", "generationer".
**Motiv:** två bruksorters färger/silhuetter mot varandra över en frusen älv. Packade läktare nära
inpå. Närhet och laddning, inte vidd — trängseln är poängen.

### 3. `premiar.jpg` — säsongens första
Charge-ton: "första isen sedan i våras", "ny is, ingen vet något än", "första riktiga kylan".
**Motiv:** orörd, nyspolad is i tidigt, rent vinterljus. Halvtom arena före säsongen. Ren tavla,
förväntan, frost. Stillhet med potential.

### 4. `nyar.jpg` — mellandagarna / trettondagen
Charge-ton: "när allt annat står still", "kallast nu, bästa isen med", "nyårslöftena får vänta".
**Motiv:** djup vinterhelg. Snö, stillhet, en match mitt i lugnet. Festligt men tyst — inte
fyrverkeri, utan kyla och ro. Mörk, samlad, vacker.

## Acceptans

- Fyra JPG:er på rätt plats med rätt filnamn, portrait 390/720.
- Stilen matchar annandagen + final (palett/ljus/rendering) så settet läser som en familj.
- Luft i nedre tredjedelen, tål bottenscrim.
- När de landar tar komponenten dem automatiskt (faller annars på den nya, avsiktliga
  placeholdern — inget hoppar).
