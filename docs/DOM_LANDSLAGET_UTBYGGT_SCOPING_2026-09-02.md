# DOM (SCOPING) — LANDSLAGET UTBYGGT: ära med pris + manager-hävstång

**Datum:** 2026-09-02 · **Av:** Opus + Jacob · **Utlöst av:** `lobbypress-mekanik-spec` / `c-k1-lobbypress-decision` — `LOBBY_PRESS`-text utan yta. Jacobs vision: landslaget är underbyggt ("en tom sak som bara händer"), bygg UT det i stället för att nedgradera texten till flavour. **Typ:** scoping-dom (definierar VAD, komponenter + prioritet). **Implementation: SIST i kön** (Jacobs beslut — fånga visionen nu, bygg när allt annat är klart).

## Bandy-faktgrund (verifierad web 2026-09-02)
Bandy-VM ligger mitt i säsongen (januari), MEN Elitserien har MATCHUPPEHÅLL under VM-veckan. Olikt fotbollens utspridda landslagsfönster: bandy har ETT koncentrerat fönster (VM-veckan), inte återkommande kval varje månad. **Konsekvens för mekaniken:** en uttagen spelare missar INGA ligamatcher (serien vilar), men kommer tillbaka SLITEN från en intensiv turnering. Kostnaden är kondition/slitage, inte missade matcher — en renare, mer koncentrerad avvägning än i andra sporter.

## Problemet
Landslaget HÄNDER passivt idag — en spelare tas ut, det syns, klart. Ingen manager-agens, ingen konsekvens i bägge riktningar, ingen båge. `LOBBY_PRESS`-texten (att lobba för uttagning) hänger utan yta. Ett tomt system som borde vara en av spelets äror.

## Visionen — fem komponenter (Jacobs skiss, Opus inramning)

### 1. Förbundskaptenen som närvaro/rykte (inte en meny — en karaktär)
Som patronen är en karaktär, är förbundskaptenen en. Han FINNS, tittar på ligan. Ett rykte/en närvaro spelaren känner av, inte en dropdown. (Grundning: finns någon FK-representation idag, eller bara uttagnings-logik?)

### 2. Landslagsscouter (synliga händelser)
Scouter dyker upp och bevakar dina spelare — en händelse: "en landslagsscout var på plats mot X." Gör uttagningen till något som BYGGS UPP (bevakning → intresse → uttagning), inte något som bara plötsligt sker. Detta är en LIGGAR-händelse (se nedan).

### 3. LOBBY_PRESS får sin yta (manager-hävstången)
Du kan lobba förbundskaptenen för uttagning. Utfallet avgörs av din FÖRBUNDSRELATION + spelarens form/resultat — inte en garanti. Det gör `LOBBY_PRESS`-texten till en verklig decision med osäkert utfall (ingen freebie, samma princip som O20/hesitantPlayer: en hävstång med osäkerhet, inte en gratis-god knapp).

### 4. Uttagning höjer spelarens värde
En landslagsman är värd mer. (GRUNDNING: gör uttagning redan detta idag? Code verifierar `nationalTeamService`/marknadsvärde. Om ja — bekräfta; om nej — bygg.)

### 5. Kostnaden: sliten spelare tillbaka
Uttagen spelare är borta VM-veckan (serien vilar, inga missade matcher) och kommer tillbaka med lägre kondition en period. Den koncentrerade slitage-kostnaden. Ära MED pris — precis vad ett tomt system saknar.

### 6. VM-resultatet följer med hem (moral)
En uttagen spelare bär VM-utfallet tillbaka till klubben: **Sverige tar guld → han kommer tillbaka stärkt** (moral upp, trots slitenheten — två krafter som drar åt olika håll, en verklig avvägning); **utslagen tidigt → en besvikelse han bär in i klubblaget** (moral ner ovanpå slitenheten). Det knöter landslaget till klubbvardagen i stället för en isolerad parentes — en spelares landslags-resultat följer med hem. **GRUNDNING: är alla spelare svenskar i spelet idag?** Jacob antar det. Om det finns utländska spelare tas de ut i ANDRA landslag (eller inga), och "Sveriges VM-resultat påverkar moralen" gäller bara svenskarna — Code verifierar nationaliteten i spelarmodellen när kön når hit.

## KOPPLING TILL LIGGAREN (obligatorisk, inte valfri)
En landslagsuttagning är en HÄNDELSE i klubbens/managerns historia — den ska MINNAS. `national_team_callup` finns redan som `EventLedgerType`-medlem (lades till i schemat). Så uttagningen skriver en liggarpost, och årsboken/karriärhistoriken kan bära "din spelare blev landslagsman den säsongen" — och `milestone`-diaryn (managersektionen) likaså. Detta är en steg-2-3-båge: uttagningen lagras (liggaren), hittas (årsbok/historik), berättas. Bygg den liggare-medvetet från början, inte som en egen ficka (undvik förliggare-skulden).

## PRIORITETSORDNING (mest känsla per bygge)
1. **Scout → uttagning → liggaren + värdehöjning + slitenhet** (komponent 2+4+5) — själva bågen: en spelare bevakas, tas ut (minns i årsboken), blir värd mer, kommer tillbaka trött. Ära med pris. STÖRST känsla, och den fungerar UTAN lobby.
2. **LOBBY_PRESS-hävstången** (komponent 3) — manager-agensen ovanpå bågen. Kräver en förbundsrelation att lobba MOT.
3. **Förbundskaptenen som karaktär** (komponent 1) — den rikaste men minst nödvändiga; en närvaro/rykte som binder ihop de andra. Kan börja som en enkel relations-siffra, växa till en karaktär.

## GRUNDNING FÖRE BYGGE (Code, när det når kön)
- Vad gör `nationalTeamService` idag? (uttagnings-logik, värdehöjning, någon FK-representation?)
- Höjer uttagning redan marknadsvärdet? (komponent 4 — bekräfta eller bygg)
- Finns en förbundsrelation att lobba mot, eller är det nytt? (komponent 3)
Utan detta bygger vi mot en gissning — samma disciplin som patron/formationer.

## ÄGARSKAP
Jacob: vision fångad, implementation SIST i kön. Opus: denna scoping + `LOBBY_PRESS`/scout/FK-texterna när strukturen står. Code (när kön når hit): grunda `nationalTeamService` FÖRST, bygg sedan bågen (prio 1) liggare-medvetet, mallar `[Opus]`. Detta är en FEATURE (flera sammankopplade mekaniker), inte en enskild dom — ett eget litet projekt, medvetet köat sist.
