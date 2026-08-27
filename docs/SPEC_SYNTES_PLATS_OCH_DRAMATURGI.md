# SPEC — Syntes: platsen, dramaturgin och den spårbara kedjan

Underlag: Fables kodläsning (säsongsfaser, portalens kortuppsättning med vikter,
kafferummets tjänst och scen, veckobeslutens form) + extern strukturanalys
(dokument, backlog, designsystem). Två oberoende läsningar, samma diagnos.

Denna spec innehåller **inga backlog-rader och inga framtidsförslag**. Allt som
står här ska byggas, i den ordning som anges. Det som inte ska byggas står inte här.

---

## DIAGNOS

Spelet har två lager som vet olika saker om samma år.

**Textlagret** känner sju säsongsfaser med verklig bandyårstextur
(`getFunctionaryPhase`: höststart · höst · annandagen · vinter · vinterkris ·
våroffensiv · slutspurt), där vinterkris dessutom är villkorad på tabellplacering.
Anslagen skriver januari som säsongens långa parti. Kafferummet har fyra fasta
röster, ~45 vardagsutbyten, resultat- och svitvarianter, årsdagsekon, avskedsrader.

**Systemlagret** känner tre faser (`getSeasonPhase`: early ≤3, mid ≤11, endgame 12+
— halva säsongen är ett humör; `pre_season` finns i typen men returneras aldrig).
Portalens hjälteruta eskalerar bara för sex saker; resten av tiden — omkring
15 av 22 veckor — säger toppen av skärmen "nästa match".

Konsekvensen: **texten påstår en dramaturgi som mekaniken inte levererar.**
Cupfinalen har färdig ceremoni men ingen upptrappning. Avskedsmatchen likaså.
Januari är tung i orden och platt i systemet. Och platsen — spelets särart:
orten, klacken, kafferummet, mecenaten — är nästan helt ambient. Man läser den,
man talar inte med den.

Undantaget är mecenatkraven, som just byggts. Det är första gången platsen
*begär* något av spelaren. Den här specen gör det till mönstret i stället för
undantaget.

---

## DEL 1 — REGLER SOM FLYTTAS UT

Dessa är inte arbetsuppgifter utan styrande regler. De skrivs in där de hör hemma
**innan** implementationen börjar, eftersom de definierar vad "färdig" betyder i
allt som följer.

### R1 → `CLAUDE.md` (projektregler)

**Den spårbara spelarkedjan.** Ett system är inte färdigt förrän hela kedjan går
att beskriva på en rad:

> trigger → stateförändring → synlig yta → spelarens tolkning → senare konsekvens

Testtäckning, gröna lintar och en committad datafil räcker inte. Om något led
saknas är systemet påbörjat, inte klart.

Motivering ur projektets egen historik: `patron.demands`, `Mecenat.demands`,
`injuryDoctorText` och de sju citat-JSON:erna var alla byggda i tre av fem led —
konsument fanns, generator saknades, eller texten fanns utan yta. Regeln hade
stoppat samtliga vid commit.

### R2 → `docs/WRITING_GUIDELINES_BANDY_MANAGER.md`

**Fyra textnivåer.** All speltext tillhör exakt en nivå, och nivåerna får inte se
likadana ut:

1. **Beslutstext** — måste läsas, påverkar ett val som spelaren gör nu.
2. **Konsekvenstext** — förklarar vad ett val ledde till.
3. **Karaktärstext** — bygger relation, plats och minne.
4. **Atmosfärstext** — färg, får hoppas över utan förlust.

Textauditen dömde sanning och ton men aldrig **vikt**. I dag ser en atmosfärsrad
ut ungefär som en konsekvensrad, vilket tvingar spelaren att läsa allt för att
veta vad som var viktigt. Nivån ska framgå av form — position, kontrast, storlek,
rytm — inte av ännu en mening.

Varje ny textpool anger sin nivå i filhuvudet.

### R3 → `CLAUDE.md` (arbetsordning)

**Design kopplas in där ytan är ny eller hierarkin ändras — inte där texten byts.**
Konkret för denna spec: Design äger kafferummets frågeform, de nya primärkortens
språk, textnivåernas visuella uttryck och framåtkroken i Granska. Design kopplas
inte in för fasmodellskonsolidering, stresstestmått eller ren wiring.

---

## DEL 2 — IMPLEMENTERINGSORDNING

Två spår. **Spår A** startar först eftersom det är den långa stolpen och kräver
Design innan Code kan börja. **Spår B** körs parallellt av Code och landar
tidigare.

### SPÅR A — Kafferummet blir en plats

Detta är specens tyngdpunkt. Kafferummet är spelets mest utvecklade plats —
fasta röster, ~45 vardagsutbyten, resultat- och svitvarianter, årsdagsekon,
avskedsrader — och renderas i dag som ett sekundärkort på portalen (vikt 60).
Rummet dubbleras in i flödet i stället för att vara någonstans man går. Och Sture
har haft åsikter i månader utan att någon svarat honom.

**A0 · Verifiering före allt annat (Code).**
`CoffeeRoomScene.tsx` finns, är byggd mot en fixerad mockup och tar `onComplete` —
men det är overifierat om den är **nåbar i spel** i dag, eller om bara portal-kortet
visas. Rapportera: vilken route/scenflöde renderar scenen, hur ofta, och om den
kan nås alls. Svaret avgör om A2 är wiring eller nybygge.

**A1 · Designspec: rummet med ett svar (Design).**
Kafferummet ska bli en plats man besöker, där en av stammisarna ställer en fråga
till spelaren, och där svaret minns. Design avgör:

- Hur frågan reser sig ur ett utbyte utan att bryta scenens ton (i dag är
  utbytena slutna tvåreplikersväxlar mellan funktionärer — spelaren står utanför).
- Svarets form. Utgångspunkt: två alternativ, samma likvärdighetsprincip som
  Valet (A-1: inget val är förvalt), men rummet ska inte se ut som ett beslutskort.
- Hur ett tidigare svar återkommer i rummet senare — okallat, inte i ett arkiv.
- Vad som händer med portal-kortet `coffee_room_card` när rummet blir en plats.
  Rekommendation att pröva: kortet blir en ingång till rummet, inte en kopia av det.
- Scenhuvudets `emoji="☕"` mot ceremoniregeln (`VictoryTrophy` bär noten
  "B3: ingen emoji på ceremoninivå"). Döm om rummet är ceremoninivå eller inte.

Leverans som ytkarta + mock, samma format som sidfots-auditen.

**A2 · Bygget (Code).**
Enligt A1. Frågan ställs av en av de fasta rösterna, svaret sparas i `SaveGame`,
och svaret återkommer minst en gång senare i rummet. Determinism enligt husregeln
— seeda på säsong/matchday, aldrig `Math.random()`.

Kedjan (R1) ska gå att skriva ut i commit-meddelandet:
> Sture frågar → svaret sparas → syns i rummet → spelaren väljer → svaret citeras
> tillbaka en senare omgång.

**A3 · Texten (Fable).**
Frågorna och svarsalternativen, plus återkomstraderna. Skrivs när A1 fastställt
formen — inte tidigare. Code lämnar `'[Opus]'`.

---

### SPÅR B — Dramaturgin (parallellt, Code + Design där angivet)

**B1 · Portalen läser funktionärsfaserna (Code).**
Ersätt portalens treställiga `SeasonPhase` med de sju funktionärsfaserna som
redan finns i `getFunctionaryPhase`. Ta samtidigt bort den döda `pre_season`-grenen
ur typen, eller returnera den — men lämna den inte som en gren som aldrig nås.

Effekten som ska uppnås: `vinterkris` — som redan är villkorad på tabellplacering
— får styra vad portalen visar, inte bara vad funktionärerna säger. Januari får
sin tyngd utan ny mekanik.

`suppressIn`-fältet finns redan på korten och tar fasnamn; det är den mekanism
som ska bära detta. Rapportera vilka kort som bör suppressas eller lyftas per fas
**innan** vikterna ändras — det är en dramaturgisk fråga, inte en teknisk.

**B2 · Primärkort för cupfinal och avskedsmatch (Code, kort Design-input).**
Bägge har färdig ceremoni; det som saknas är att portalen pekar på dem i förväg.

- Cupfinal: i dag finns bara `nextMatchIsSMFinal` (vikt 100). Cupfinalen faller
  till `next_match` (vikt 10) trots `cupFinalVictoryScene` och cupanslagens
  "Pokalen är vår". Lägg `nextMatchIsCupFinal`, vikt strax under SM-finalen.
- Avskedsmatch: ceremonin byggdes nyss i `MatchLaddningScene`, gate:ad på
  arc-signalen `coffeeRoomService` redan räknar. Portalen varnar aldrig att
  ögonblicket kommer. Lägg ett primärkort på samma gate.

Design-input begränsad till kortens språk och inbördes vikt mot derby (80) — inte
en egen granskningsrunda.

**B3 · Framåtkrok efter match (Design → Code → Fable).**
Granskningen slutar i dag i administration ("KLAR — NÄSTA OMGÅNG"). Den ska sluta
i nästa laddade sak, i formen:

> Nästa: Västanfors borta. De har inte förlorat hemma sedan november.

Design placerar den (var i Granska-flödet, vilken vikt mot CTA:n). Code hämtar
fakta som redan finns — motståndarens form, serieläge, tidigare möte, kalenderankare
via `getUpcomingAnchor` som redan används av kafferummet. Fable skriver mallen och
varianterna när platsen är satt.

**B4 · Kris- och svitkort (Design → Fable → Code).**
De 103 citaten i `crisis_streak.json` / `success_streak_5.json` raderades korrekt
— de saknade talare, eftersom spelaren är tränaren. Men **glappet de skrevs för
står kvar**: portalen har inget kort för "ni är i kris" eller "ni är på en svit".
Seriens egen dramaturgi når aldrig hjälterutan.

Bygg kortet med en röst som har en talare: funktionären (som redan har fasmodellen
och en etablerad röst) eller journalisten (som redan har relationssystem och
synlighetslogik). Design avgör vilken och hur kortet skiljer sig från
`season_signature_card`. Fable skriver texten mot den valda rösten. Code bygger
triggern på befintlig svitberäkning.

**B5 · Textnivåerna i UI (Design → Code).**
R2 fastställer fyra nivåer. Design ger dem visuellt uttryck — beslutstext ska
kunna skiljas från atmosfärstext utan att läsas. Code applicerar på befintliga
ytor. Detta är den enda punkten som rör hela gränssnittet; den kommer sist i
spår B av det skälet.

**B6 · Textmått i stresstestet (Code).**
Utöka befintlig stresstestrapportering med: hur ofta samma sträng återkommer per
säsong, antal texter per omgång, andel som kräver handling kontra ren atmosfär,
och antal omgångar mellan återkommande karaktärers repliker.

Motivering: asymmetrin i mecenatkravens pooler (nio speltidsrader mot tre i de
tre andra kategorierna) upptäcktes manuellt. Måttet hade fångat den automatiskt.

---

## VERIFIERING

Varje punkt ovan är klar först när kedjan i R1 kan skrivas ut. Utöver det:

- **A2** verifieras i spel, inte i test: frågan ställs, svaret sparas, svaret
  återkommer. Tre observationer, inte en grön svit.
- **B1** verifieras genom att spela in i januari och se att portalen ser
  annorlunda ut än i oktober.
- **B2** verifieras genom en cupfinal och en avskedsmatch i spel.
- **B4** får inte dubblera `season_signature_card` — verifiera sida vid sida.

Playtest som redan är utestående och som denna spec inte ersätter: ligavägen in i
Granska (cup är verifierad, liga är det inte — separata kodvägar), yta 3-pillen
mot en icke-jämn motståndare, och ripplekedjans tre steg efter en derbyseger.
