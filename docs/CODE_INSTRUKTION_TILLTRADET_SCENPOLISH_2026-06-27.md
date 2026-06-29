# Code-instruktion — Tillträdet scen-polish (F1/F4 påvra, F2 inramning)

Källa: Jacobs mobil-playtest 2026-06-27 (fem skärmbilder). Grundad av Opus mot
`TilltradeScreen.tsx` + `ArrivalScene.tsx` + `LineupStep`/`useLineupEditor`.
Feedback ordagrant: "skärm 2 och 5 blir lite påvra och skärm 3 funkar inte riktigt
utseende eller interaktivt. men tanken/känslan är rätt."

Måttstock: **F3 (öva hörnan) är den som sitter** — mörk zon-vy som fyller ytan,
coachbubbla, copparknapp. F1/F4 ska kännas lika komponerade som F3; F2 lika
visuellt sammanhållen. Rör INTE F3.

---

## F1 + F4 — påvra (skärm 2, 5)

**Rotorsak, grundad mot källan.** `ArrivalScene` bär sin atmosfär med tre lager som
`TilltradeScreen` saknar helt:
1. `<IllustrationScene mode="fullbleed" name="intro" alt="" style={{ position:'absolute', inset:0, zIndex:0 }} />` — fullbleed scen-bakgrund (intro.jpg, fallback-gradient + stämpel tills bilden droppas).
2. `<div className="arrival-scrim" />` — läsbarhets-scrim ovanpå illustrationen.
3. En mörk narrativ-panel runt texten: `background: rgba(10,8,12,0.80)`, `border: 1px solid rgba(245,241,235,0.06)`, `borderRadius: var(--radius)`, `padding: 20px 18px`.

`TilltradeScreen` använder bara `.arrival-scene` + `.arrival-lamp-overlay` → near-black
tomrum. Och F1/F4-coachkortet har `marginTop: 'auto'` som trycker det till botten medan
sköld/klubbnamn sitter i toppen → tomrummet hamnar i *mitten*.

**Åtgärd:**

1. **Lägg scen-bakgrund i BÅDA return-grenarna.** `TilltradeScreen` har två separata
   returns (F1/F4-grenen och F2/F3-grenen), var sin `.arrival-scene`. Lägg
   `<IllustrationScene mode="fullbleed" name="intro" ... zIndex:0 />` + `<div className="arrival-scrim" />`
   överst i båda, precis som ArrivalScene. Då får hela flödet samma grund som styrelsescenen
   — diegetisk kontinuitet (samma kväll), och tomrummet försvinner bakom illustrationen.

2. **Döda mitt-tomrummet i F1/F4.** Ta bort `marginTop: 'auto'` på coachkortet. Komponera
   innehållet som EN sammanhållen stack, inte topp-och-botten. Genre/bars stannar överst;
   resten (F1: sköld + klubbnamn + coachreplik · F4: checklista + coachreplik) samlas i en
   mörk narrativ-panel (samma `rgba(10,8,12,0.80)`-backing som ArrivalScene) och centreras
   vertikalt i den lediga ytan (`justifyContent: 'center'` på innehålls-kolumnen, lätt
   övervikt uppåt). Backing-panelen löser samtidigt läsbarheten mot den nya illustrationen.

3. Behåll `.h-scene-genre`/`.h-scene-speaker`/`.h-scene-quote` — typografin är rätt, det
   var komposition och atmosfär som fattades.

Resultat: F1/F4 ska läsa som ArrivalScene utan styrelse-korten — illustration, scrim,
en centrerad textpanel — inte en replik som svävar i svart.

---

## F2 — funkar inte utseende/interaktivt (skärm 3)

**Rotorsak, grundad.** `<LineupStep>` renderas rakt in i scenens innehålls-kolumn UTAN
inramning (`TilltradeScreen` steg 2). LineupStep bär sin ljusa in-app-styling → den ljusa
planen plus positionslistorna (MÅLVAKTER/BACKAR) blöder mot den mörka scenen: halvt ljust
(planen), halvt mörkt-och-fadande (listraderna utanför all backing). Det är det som ser
trasigt ut.

**Åtgärd — den diegetiska laguppställnings-lappen:**

1. **Svep hela `<LineupStep>` i en ljus inset-yta.** En ljus `--surface`/parchment-panel med
   ram + skugga, så den läses som ett pappersark lagt på det mörka bordet — coachen räcker
   dig truppen. HELA komponenten (Lista/Plan-växeln, planen OCH positionslistorna) ligger
   inuti samma ljusa inset. Inget halvt-ljust/halvt-mörkt: insetet är enhetligt ljust,
   scenen runt är mörk.

2. **Bind scrollen inuti insetet** så positionslistorna inte rinner ut i scenen och fadar.
   Listan scrollar i insetet, inte mot scen-bakgrunden.

3. Behåll `CoachFraming` ovanför insetet (mörk scen-stil, copparkant — den läser rätt).
   Behåll den grindade CTA:n (`onNext` → `commitLineup()` → steg 3) under insetet.

Det här betyder att LineupStep behåller sin ljusa styling — **ingen mörk reskin**, billigt —
och krocken blir avsiktlig inramning. Det är ren presentation.

4. **Interaktivt — verifiera, fixa inte blint:** på skärm 3 är "Lista" highlightad men en
   plan visas. Kontrollera i `LineupStep` att växel-highlighten matchar faktiskt visad vy.
   Om LineupStep defaultar till Plan ska highlighten visa Plan — glappet är buggen. För en
   allra första elva på smal skärm är listvyn + "Fyll bästa elvan" mildare än planen;
   överväg listvy som default i tutorial-kontext, men huvudsaken är att state och label
   stämmer.

---

## SPÄRR — rör inte motorn

F2 är ren presentation: inramning, scroll-binding, vy-state. Den får INTE röra
`useLineupEditor`, `commitLineup` eller write-pathen till `managedClubPendingLineup`.
Single-source-vinsten står kvar; det här är skinn runt den. Samma för F1/F4 — komposition
och scen-lager, ingen logik.

---

## Kö mot noll
1. F1/F4: `IllustrationScene` + `arrival-scrim` i båda return-grenarna; ta bort
   `marginTop:auto`, samla innehållet i centrerad narrativ-panel.
2. F2: ljus inset runt hela `LineupStep`, scroll bunden i insetet.
3. F2: verifiera Lista/Plan-växelns state mot visad vy.
4. Playtesta om på smal vy — F1/F4 ska kännas fyllda, F2 ska vara en sammanhållen ljus lapp.
