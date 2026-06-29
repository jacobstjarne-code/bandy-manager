# Design-spec — scen-konst (match-laddning) 2026-06-18

Ägare: Design (mockup/art direction) + asset-produktion. Grundad i `matchLaddningText.ts`,
`matchLaddningGrind.ts`, `IllustrationScene.tsx`. Löser order-punkt #13.

## Systemet (som det ÄR)

Två nivåer (`computeLaddningBeat`):

- **SCEN** — fullt beat före uppställningen, för tillfällen. Sex occasions i `SCENE_TEXT`:
  `annandagen`, `derby`, `cup`, `premiar`, `final`, `nyar`. Var och en har eyebrow + charge-pool
  (tonen bilden ska matcha står i charge-raderna).
- **BAND** — slimmat kort på uppställningen, för tillstånd (svit ≥3): `losing_streak` / `winning_streak`,
  plus svit-brott. Medvetet ingen illustration ("intentional stillness").

Bilder: `IllustrationScene` refererar `/assets/illustrations/{name}.jpg`, faller på `IllustrationPlaceholder`
(samma dimensioner, inget hoppar) om bilden saknas/404. Match-laddningens scen-läge är **fullbleed**
(portrait, aspect 390/720), topp- + bottenscrim så text aldrig ligger naken på bild.

Status: **annandagen + final har konst** (verifiera mot `public/assets/illustrations/`). **Cup, derby,
premiär, nyår faller på placeholder** — det är dem du ser som tomma "⬩ CUPEN ⬩"-rutor.

## Del 1 — De fyra scen-illustrationerna som saknas

Alla: fullbleed portrait (390/720), JPG, `/assets/illustrations/{id}.jpg`. **Stil-ankare: matcha
annandagen + final** som redan finns — palett, rendering, ljus. Hela settet måste läsa som en serie,
annars blir laddningen visuellt spretig. Texten (eyebrow/klubb/charge) läggs ÖVER bilden av komponenten,
så bilden ska ha luft i nedre tredjedelen (där charge-raden landar) och tåla bottenscrim.

**cup** (`cup.jpg`) — utslagsmatch, knivsegg. Charge: "vinna eller hem i spelarbussen", "vem som helst
slår vem som helst". Motiv: en ensam strålkastarbelyst rink i mörker, lagbussen anad i kanten, neutral
och naken — ingen hemmavärme. Kallt, spänt.

**derby** (`derby.jpg`) — grannfejden. Charge: "samma älv, två bruk", "jobbar sida vid sida — men inte
ikväll", "generationer". Motiv: två bruksorters färger/silhuetter mot varandra över en frusen älv, packade
läktare nära inpå. Närhet och laddning, inte vidd.

**premiar** (`premiar.jpg`) — säsongens första. Charge: "första isen sedan i våras", "ny is, ingen vet
något än", "första riktiga kylan". Motiv: orörd, nyspolad is i tidigt, rent vinterljus, halvtom arena före
säsongen. Ren tavla, förväntan, frost.

**nyar** (`nyar.jpg`) — mellandagarna/trettondagen. Charge: "när allt annat står still", "kallast nu, bästa
isen med", "nyårslöftena får vänta". Motiv: djup vinterhelg, snö, stillhet, en match mitt i lugnet. Festligt
men tyst — inte fyrverkeri, utan kyla och ro.

## Del 2 — Placeholder-behandlingen ("illustration på väg")

`IllustrationPlaceholder` är i dag en platt ruta med `⬩ NAMN ⬩` i mono + svag accent-kant. Den läser som
en trasig ruta, inte som en medveten plats där konst ska landa. Den visas så länge ett asset saknas — och
eftersom texten ändå overlayas är placeholderns enda jobb fonden.

Fix: gör fonden **avsiktlig**, inte tom. Lägg en låg-kontrast scen-antydan bakom den centrerade etiketten
— en tunn rink-båge eller en svag is/strålkastar-gradient (samma kalla palett som scenerna). Och en liten
under-rad i mono, ~9px, dämpad: "illustration på väg". Då läser tomrummet som "scenen är riggad, bilden
kommer" i stället för "något är trasigt". Ändra inte dimensionerna (inget får hoppa när bilden landar).

## Del 3 — Band-tierns visuella förankring

Bandet ("TRE RAKA / Ingen vinst på 3", "PÅ STRECKET") är ett slimmat kort centrerat i portal-mörker.
Avsikten är stillhet — men den läser som tomt, inte som tyst (playtest 2026-06-18). Det här är INTE en
saknad illustration; band-tiern ska aldrig ha full konst.

Fix: en mycket svag fond bakom bandet — en ortssiluett (bruksortens tak) eller en enkel horisont/is-yta,
~10–15 % opacitet, som säger "ett tyst ögonblick på en plats" utan att konkurrera med det slimmade kortet.
Tillräckligt för att tomrummet ska kännas hållet, inte oavsiktligt. Samma palett som scenerna så tiererna
hör ihop.

## Acceptans

- De fyra scen-JPG:erna ligger i `public/assets/illustrations/`, matchar annandagen/final i stil, tål
  bottenscrim, har luft i nedre tredjedelen.
- Placeholdern läser som medveten ("illustration på väg" + svag scen-antydan), dimensioner oförändrade.
- Band-tiern har en svag fond så stillheten läser som avsiktlig.
- Hela laddnings-settet (scen + band + placeholder) läser som EN visuell familj.
