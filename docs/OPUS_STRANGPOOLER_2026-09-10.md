# Opus copy 2026-09-10 — transfers-liggarvokabulär (§4) + N-mötets övertaganderad

Bandysvensk understatement: ellips över utrop, konkret bild, ingen förklaring. Inga numeriska deltan i verdict. Mono-källan under varje liggarrad är kod-satt, inte copy.

---

## Transfers §4 — strängpooler

### Liggar-rader (3 per proxytyp; tyngst först, 0–3 visas, TOM om inget träffar)

**🏟️ `seasonsAtClub >= 3`**
- Sju säsonger i klubben. Har ratat två bud förr.
- Nio år i tröjan. Han vet var isen är hårdast.
- Kom hit som junior, har aldrig lämnat.

**👤 `birthRegion === club.region`**
- Uppvuxen i bygden. Samma väg till vallen som alltid.
- Född tre mil härifrån. Klacken vet vems son han är.
- Lokal grabb. Åkte skridsko på samma sjö som far sin.

**🤝 `dayJobIsLocal`**
- Kör grävmaskin åt kommunen på vardagarna.
- Står i järnhandeln på stan mellan träningarna.
- Vaktmästare på skolan. Alla ungar känner honom.

**👤 `blodslinje` (`getClubMemory`)**
- 214 matcher. Fostrad av Ekström, fostrar Sjödin.
- Bär numret hans farbror bar. Ingen glömmer det.
- Tredje generationen i klubben. Det står i pärmen.

**⚔️ `significance`-topp / Triumf → kopparprick**
- Nollade Skutskär i SM-finalen.
- Avgjorde derbyt när det stod och vägde.
- Gjorde målet som tog upp laget. Det pratas om det än.

**🤝 `transferPersonality: homebound`**
- Aldrig krävt mer än laget tålde.
- Har sagt att han spelar här tills benen tar slut.
- Tackade nej till större klubbar två gånger. Stannade.

### Verdict — emot affären (köp av hemmakär, `--warm`)
- Hemmakär. Fler skäl att stanna än att gå.
- Han hör hemma här. Liggaren pekar bara åt ett håll.
- Rötterna är djupa. Ett bud rör inte det.
- Klacken skulle förstå ett köp. De skulle inte förlåta det.
- Allt i hans liggare säger nej.

### Verdict — för affären (förläng lojal egen, `--success`)
- Vill stanna. Det syns i varje rad.
- Han har aldrig velat vara någon annanstans.
- En förlängning är en formalitet. Han sa ja innan du frågade.
- Klubben är hans. Papperet bekräftar bara det.
- Håll honom. Sånt bevaras.

### Rivalvarning (3 per intensitet, `{rival}`/`{derby}` interpoleras; endast budytan)

**Intensitet 1**
- {rival} är en gammal granne. Det märks lite extra den här.
- Det finns en historia med {rival}. Inget som stör natten.
- Klacken höjer ett ögonbryn. {rival}, minsann.

**Intensitet 2**
- {rival} är rival. "{derby}" är ingen vanlig match.
- Att handla med {rival} sätter sig i läktaren.
- Det här är {derby}-mark. Klacken kommer att prata.

**Intensitet 3**
- {rival} är fienden. "{derby}" delar bygden i två.
- Att köpa från {rival} … klacken glömmer inte sånt i första taget.
- Det finns bud man inte lägger. Det här är ett, om du frågar kurvan.

---

## N-mötets övertaganderad (låst mall — klausuler droppas när fältet saknas, aldrig fabricerad)

Sätts ihop av upp till tre klausuler, tyngst först. Code joinar (` · ` eller kort stycke). Saknas fältet droppas klausulen — ingen platshållartext, samma disciplin som liggaren.

**Ankomst**
- Efter avsked: Du kom hit efter att {prevClub} tackat för sig.
- Frivilligt: Du lämnade {prevClub} för det här.

**Företrädaren (om känd)**
- Med placering: Din företrädare fick gå — {prevPlacering} räckte inte.
- Utan placering: Stolen stod tom när du kom. Någon annan hade suttit där.

**Tidigare i klubben (returnerande manager)**
- Du har suttit i det här båset förr. De minns vem du är.
