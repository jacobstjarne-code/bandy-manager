# Brett sexsäsongsprov — åtgärdat omprov, Astra, 2026-09-12

## Dom

**GODKÄND SOM RELEASELÅS.**

Produktkodens pinne: `588344dbf4bd9cf89d7bb778d44313e8657c32b3`  
Efterföljande testanpassning: `0a0100a1` (ingen produktlogik ändrad)

Det breda provet mot den fixerade miljön gav noll invariantbrott och noll nya
releasefynd. De nio åtgärdsraderna från provet på `87dd3eff` är stängda.
Balansmotorn och dess kalibreringskonstanter har inte ändrats.

## Omfattning

- 12 deterministiska karriärer, en per klubb, med mål sex säsonger vardera.
- 46 hela säsonger fullföljdes innan naturliga styrelseavsked. Fem karriärer
  nådde alla sex säsongerna; övriga slutade genom ordinarie avsked, aldrig
  krasch eller deadlock.
- 7 648 simulerade matcher och 68 081 mål.
- Riktig onboardingsemantik, löpande händelseliggare, spelarresolution av
  synliga kort och kafferumsbesök efter varje spelsteg.
- Samma population och seedar kördes först på `dc2cf8e5`, vilket hittade tre
  återkommande gamla id:n. Roten var `resolvedEventIds`-taket på 200 poster.
  Alla konkreta resolutioner skrivs därför nu även i append-only-liggaren.
  Exakt samma population kördes därefter om på `588344db`.

## Binärt invariantutfall

- **Beslutskö: PASS.** Max tre aktiva beslut. Max fem uppskjutna kort, men
  ingen svält, återkomst, låst skärm eller blockerad säsongsövergång.
- **Löst event återkommer inte: PASS.** Noll återkomster efter den slutliga
  liggarfixen. Detta omfattar även politiker, spelarpar och transferbud äldre
  än snabbminnets 200 resolutioner.
- **Klackkonflikt: PASS.** Naturligt nådd i 10/12 karriärer; ingen karriär
  startade samma semantiska konflikt igen efter resolution.
- **Gala: PASS.** Naturligt nådd i 12/12 karriärer; ingen löst gala återkom.
- **Burnout: PASS.** Terminalscenen nådd i 11/12 karriärer; högst ett
  terminalval per säsong och inga motstridiga val.
- **Kafferum: PASS.** 1 276 besök; noll återkomst av spårad narrativ nyckel
  inom tvåsäsongscooldownen. Treparts- och fyrpartsdialog återges nu som
  strukturerade talarturer.
- **AI-intag: PASS.** Noll 15-åriga seniora `Player`; P19-kontraktet 15–19 är
  orört medan AI:s direktmaterialiserade seniorer är 16–19.

## Matchmotor och långtidskurva

- Målsnitt: **8,902 mål/match**, fortsatt vid ankaret omkring 8,98 och inte
  tillbaka på den äldre 9,39-nivån.
- Beständig 31+-kohort: **−0,969 CA per säsongspar** i det breda provet.
- Det råa attributmedlet blev +0,014 och blandar ålder, klubb, skador och
  urval; den kontrollerade veteranregressionen är fortsatt den giltiga
  attributdomen. Ingen balansparameter ändrades i detta pass.

## Grafik

De visuella rotfelen är åtgärdade: taktikvalen bryter responsivt vid smala
bredder, portalens fasta krom följer spelkolumnen och burnoutens hjälptype är
läsbarare. Burnout, klacktifo, klackkonflikt, gala och riktig
annandagsladdning finns nu som deterministiska dev-scener i det gemensamma
visuella registret.

Det strukturella Chromium-svepet passerade **490/490** kontroller över
kontrast, råa tokens, decision-card-padding, tryckytor och kollisioner vid
320–430 px. Linux-pixelbaselines genereras av repoets uttryckliga
`visual-baselines`-jobb; Mac-baselines har inte skrivits.

Inget nytt saknat bildläge blockerar release. Om fler illustrationer görs
senare ger `hall-provning`, `season-signature-reveal` och `sunday-training`
störst upplevelsevärde; de är kreativa förstärkningar, inte hål i nuvarande
releaseflöde.

## Text och känsla

Det här omprovet kombinerar långtidslogik med en separat grafisk och svensk
ytgranskning. Det gör inget falskt anspråk på sex säsongers manuell
känslodagbok, men de scener som långtidsprovet når har granskats mot samma
produktkod.

Följande rotgrupper är stängda:

- sen måltext väljs först efter sant matchläge,
- formationer och sponsorpersonligheter visas med svenska etiketter,
- svenska decimaler används på synliga pengar- och betygsytor,
- venue-, pronomen-, slutspels- och sammansättningsfelen från förprovet är
  rättade,
- kafferummet har en turbaserad dialogmodell i stället för namn inbakade i
  repliker.

Textvakten är ren. Produktionsbygget och hela enhetssviten är gröna efter
förväntningsuppdateringarna: **584 testfiler / 5 242 tester**.

## Releaseutfall

Stoppregeln gav inga träffar på den slutliga pinnen: inget nått kärnflöde
bröts och spelet ljög inte i någon kontrollerad scen. De nio provraderna
flyttas därför till `MASTER_ARKIV.md`. Den enda kvarvarande öppna MASTER-raden
är den redan kända backend-/migreringsdeadlinen, som ligger utanför spelets
releasekod.
