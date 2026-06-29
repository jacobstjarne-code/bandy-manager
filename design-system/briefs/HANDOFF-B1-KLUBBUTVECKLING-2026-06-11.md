# HANDOFF — B1 Klubbutveckling: tre ytor + konsekvensrad-konventionen

**Datum:** 2026-06-11 · **Från:** Design (Fable) · **Till:** Opus (review) → Code (implementation)
**Mock:** `docs/mockups/2026-06-11_design_b1_klubbutveckling.html` (tre telefoner + konventions-not)
**Svarar på:** `design-system/briefs/DESIGN-BRIEF-B1-KLUBBUTVECKLING-YTOR-2026-06-11.md`
**Bygger i:** ratificerad kanon per systempatch 2026-06-11 (`DESIGN-DECISIONS.md`). Inga nya tokens, inga nya mönster.

---

## 1 · Utbyggnadsträdet — EN komponent, två lägen

`FacilityTree` med `mode: 'betrakta' | 'valj'`.

| | Betrakta (Orten) | Välj (PreSeason) |
|---|---|---|
| Ingång | Orten-fliken — ersätter Anläggning-kortet, öppnas som egen yta | Säsongsstartens Val-scen |
| CTA:er | **Inga.** Status-läsning only | Konsekvensrad + val per möjlig nod |
| Yta | Papper (Klubb är ljus) | Typografisk scen (mörk) |

**Nodstater (kanon-språk, inget nytt):**
- `built` — grön kantstripe + tag "Byggd [år]"
- `ongoing` — copper kantstripe + tag "Pågår" + cooldown-dots + "Klar omg N"
- `available` — streckad kant + tag "Möjlig" + konsekvensrad
- `locked` — 45% opacity + kravtext i taggen ("Kräver träningshall")

**Tre grenar:** Anläggning · Verksamhet · Akademi. Vertikala kopplingslinjer (1.5px `--border-dark`), nod-kort i `.card-sharp`-form.

**Matchhall-noden — den hårda regeln:**
- Indragen åt sidan (avfart, inte topp), kopplingslinje i `--cold`
- Kall: 1.5px `--cold`-kant, kall ytton, namnet i `--cold` — **enda kalla noden i ett varmt träd**
- Tag: **"Prövning"** (aldrig "Möjlig") — den öppnar gaffel-ytan, ALDRIG direktköp
- Konsekvensrad med **pris först**: `Publik ↓ · Själ ↓ · Ekonomi ↑ · Ungdom ↑` (matchar gaffelns dimensioner — K1-rättad 06-12)
- Subrad: "Öppnar prövningen — förankring krävs ›"

**Konstis:** kursiv baseline-rad i trädets fot — *"Konstis sedan 1963 · Stålvallen, utomhus — det är så bandy spelas."* Ingen nod. Aldrig ett mål.

## 2 · PreSeason "Valet" — typografisk scen

- Scen-kanon: ⬩-eyebrow (`⬩ SÄSONGSSTART · VALET ⬩`), Georgia-hero ("Vad bygger Hälleforsnäs i år?"), kursiv ingress, copper-stripe vänster
- **Fyra likvärdiga kort** (`--bg-portal-surface`): namn (Georgia 13/700) + horisont-etikett höger ("I år" / "1–2 säsonger" / "Om tre säsonger") + konsekvensrad + en kursiv flavor-rad
- **Inget kort förvalt** (knapp-likvärdighetsbeslutet). Tap på kort = markera; scen-CTA:n ("VÄLJ — RAPPORTERA TILL STYRELSEN →") aktiveras först vid markering (disabled = 40% opacity, regel 15)
- **Avstå är ett val:** raden "Inget val är förvalt. Du kan också vänta ett år." — vänta-valet bekräftas via samma CTA-flöde
- Akademin-kortets konsekvensrad börjar `I år —` — vägvalet ska synas i första tecknet

## 3 · Matchhall-gaffeln — den tunga ytan

- Typografisk scen i **cold-familjen**: stripe + eyebrow i `--cold` — enda scenen med kall inramning i spelet
- Hero ställer frågan ("Tak över Stålvallen?"), ingress ger båda sidorna i två rader
- **Två röster** (severity-relationsspråket): klackledaren med `--warm`-stripe, kassören med `--cold`-stripe. Kursiv Georgia + roll-etikett — samma form som Kafeterian-scenens dialog
- **Dubbelriktad konsekvensrad** i eget kort (`--bg-portal-elevated`, kall kant): fyra rader Publik↓/Själ↓/Ekonomi↑/Ungdom↑ med kort motivering per rad. Ingen yta säljer hallen som rent plus
- **Två likvärdiga knappar, staplade i full bredd:** "INLED FÖRANKRING →" / "LÄGG NER FRÅGAN". Identisk stil — att lägga ner är lika legitimt
- Foot-rad: *"Prövningen tar flera säsonger: förankring → krav → kommunförhandling → bygge. Den kan avbrytas — och den kan misslyckas."*

## 4 · Konsekvensraden — bindande konvention (försoningens #5)

Gäller ALLA bygg-/vägvalskort framåt, inte bara B1:

- **Anatomi:** `[Dimension] [riktning]` × max 4: **publik · ekonomi · ungdom · själ**. Kassakostnad i tkr heltal (regel 11): `Kassa −380 tkr`
- **Riktningar:** ↑ (`--success`) · ↓ (`--danger-text`) · — (`--text-muted`). Färgen ÄR severity — aldrig dekoration
- **Ordning = ärlighet:** tyngsta konsekvensen först. Matchhallen börjar med priset; läktaren med vinsten
- 8.5px/600, en rad, gap 8px — ryms i nod-kort och val-kort utan att växa

## 5 · Implementation-noter

- `FacilityTree`-datamodellen kommer från Codes parallella relay (B1-dokumentet) — designen här konsumerar `nodes[] {id, gren, state, label, year?, etaRound?, requires?, consequences[]}`
- Dot-räknaren återanvänder cooldown-komponenten (kanon)
- Gaffelns process-steg (förankring → krav → förhandling → bygge) mockas SENARE — denna yta är ingången/vägvalet. Processtegen designas när Opus låst mekaniken
- Säsongsetikett via `seasonSpanLabel` som alltid

## 6 · Öppna frågor till Opus — BESVARADE 06-12 (REVIEW-B1-MOCK-OPUS-2026-06-12.md)

1. **"Själ" behålls** med datadefinition: Själ = klack-relation + identitetsvärde; Publik = antal + intäkt. Dimensionsmappningen in i domänmodellen.
2. **Två röster i ingången; stegvisa röster i prövningen** (förankring = Birger + medlemsmöte · krav = förbundet · förhandling = kommunalrådet via politicianData · patron som joker). Processtegen mockas efter mekanik-låsning.

**Code-noter från review:** N1 trädet renderar alltid aktuellt state, Valet bara available-noder vid säsongsstart (mockens telefoner är olika tidpunkter) · N2 läktarkortet i Valet ska ha kassakostnad (`Kassa −XXX tkr`, belopp ur domänmodellen) · N3 trädet är push-med-tillbaka från Orten, inte flik.

---

*Design står by. När Opus svarat på §6 och Code byggt domänmodellen kan alla tre ytorna wireas direkt mot mocken.*
