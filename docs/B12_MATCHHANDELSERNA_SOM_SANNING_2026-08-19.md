# B12 — MATCHHÄNDELSERNA SOM SANNING

**Datum:** 2026-08-19 · **Av:** Opus
**Underlag:** GPT:s taktik- och matchmotordesign efter läsning av hela SvenskaFans-serien plus SBF:s utbildningsmaterial och positionsforskning. Plus `docs/BANDYSPRAK_KALLASNING_2026-08-19.md`.

---

## Principen, och varför den är bekant

> **Matchhändelserna är sanningen. Referatet är en rendering av sanningen.**

Det är samma princip vi drivit i tretton dygn under andra namn. `narrativeLog` i stället för åtta cooldownmekanismer. `matchTypeAxes` i stället för fyra oberoende klassificeringar. `O11`:s innehållskontrakt: ingen text utan deklarerad state-effekt. Kravet att effekt och storyline skrivs i samma operation.

Varje gång har felet varit detsamma — **text som beskriver något systemet inte vet.** Det här är samma fel i matchmotorn, och det är den sista platsen där vi inte letat.

Om eventet är `{ type: 'GOAL', scorerId }` kan referatet inte bli sant utan att hitta på. Om kedjan är spelvändning → flipp → nedtagning → avslut kan samma data driva referat, statistik, spelarbetyg, analys och test.

---

## Vad som faktiskt är nytt i förslaget

**Fyra nivåer av händelser**, som inte ska blandas:

1. **Grundhandlingar** — passning, bolltransport, flipp, lyra, nedtagning, brytning, skott, räddning, retur, utkast.
2. **Situationshändelser** — friläge, numerärt överläge, omställning, etablerat anfall, hörna, frislag.
3. **Taktiska händelser** — första presslinjen spelas bort, halven blir överspelad, spelvändning skapar fri halv, droppande forward drar med sig back.
4. **Utfallshändelser** — mål, hörna, utvisning, bollvinst, bolltapp.

Nivå 3 är den som inte finns någonstans i dag och som gör analysen möjlig.

**Målet ska inte ha en platt `goalType`-enum.** GPT:s invändning är rätt: flipp och retur är inte samma sorts egenskap. Hellre `origin` + `chanceType` + `finalAction` + `buildUp[]`.

**Negativa prestationer.** Managerspel är bra på mål och räddningar och dåliga på missad markering, utebliven återgång, dålig balans. Om motorn lagrar orsaken kan en halv ha noll mål, noll assist, 91 % passningar — och ändå ha varit usel, för han tappade tre djupledslöpningar. **Det är ett sannare betygssystem än något vi har.**

**Numerärt läge som state, inte statistik.** `manpowerState` per possession, inte `penaltyMinutes` i efterhand.

**Trötthet blir orsak, inte modifierare.** I dag kan `fatigue` vara −8 % efter minut 70. I den här modellen orsakar den *vilka misstag som sker*: en trött halv kommer senare tillbaka, väljer färre offensiva åkningar, missar tracking oftare. Det knyter direkt till `B9`.

**Regeln för när något ska vara ett event** — och den är bra: ett event ska finnas om det påverkar matchens state, statistiken, spelarbedömningen, den taktiska analysen eller referatet. Annars inte. Samma disciplin som `O11`.

---

## Vad detta INTE är

**Det är inte en sluttestpost.** Det är formen på version 2, och det ska sägas rakt.

Tre saker i förslaget är fullständiga ombyggnader:

**Possession-motorn.** `matchCore` är kalibrerad mot 1 100+ verkliga Elitserien-matcher — målsnitt 9,14, hemmavinstandel, oavgjortandel, comebackdynamik, allt tunat genom Fas 2–3. `BEVARA`-listan skyddar den uttryckligen, och GPT bekräftar den från andra hållet: matchmotorn kan fortfarande överraska en dominerande klubb efter tio säsonger. **En possession-baserad motor är en ny motor, och hela kalibreringen görs om från noll.**

**De sex taktikdimensionerna.** Förslaget ersätter våra åtta med sex bandyspecifika. Modellen är bättre — men vi byggde `O15`/`D4` i går: två lägen, förslag som ett, delta-raden, `Å2`:s träffytor. Att riva det nu är att kasta färskt arbete.

**Rollsystemet och attributmodellen.** Fyra roller per position, sjutton attribut, `roleFit`-beräkning. Det är ett nytt spel ovanpå det befintliga, och det rör spelargenerering, utveckling, scouting, transfers och AI.

---

## Vad som kan göras nu

Händelseberikningen är **separerbar från motorombyggnaden.** Att lägga `cause`, `tacticalFactors` och `responsiblePlayerId` på befintliga events kräver inte en ny motor — det kräver att den befintliga motorn skriver ner vad den redan vet.

Och den betalar sig omedelbart på tre ställen som redan är beställda:

- **`O16`** Granska som lärandeyta — "vilket av mina val bidrog" blir besvarbart i stället för uppskattat.
- **`B4`** motståndaranalysen — "tre av deras fyra frilägen kom bakom er vänsterhalv" i stället för "de har farliga forwards".
- **`B5`/`B10`** bandyvokabulären — orden blir sanna i stället för dekorativa.

Det ändrar `O16`:s förutsättningar: jag skrev att bara de kopplingar `MatchResult` redan har siffror för ska byggas. Med `cause` på eventen blir listan längre, och den blir korrekt i stället för approximativ.

---

## Rapportera först — innan något byggs

1. Vilka eventtyper producerar `matchCore` i dag, och vilka attribut bär de?
2. Bär ett event bollzon och involverade spelare?
3. Finns `previousEventId` / `possessionId`, eller är eventen en platt lista?
4. Representeras numerärt över-/underläge under matchen, eller bara som utvisningsminuter i efterhand?
5. Representeras orsaken till en chans någonstans?
6. Kan defensivt ansvar pekas ut — vem som blev överspelad?
7. Skapas referatet ur eventen, eller hittar textlagret på detaljer?
8. Hur lagras hörna, frislag, straff, retur och friläge?
9. Skiljer motorn på passning, långpassning, lyra/flipp och bolltransport?
10. Vad kostar det att lägga till `cause` och `tacticalFactors` på befintliga events — utan att röra sannolikhetsberäkningen?

Fråga 10 är den som avgör allt. Går det att berika utan att röra utfallen är det byggbart nu och kalibreringen är orörd. Kräver det att motorn räknar annorlunda är det version 2.

---

## Beslutet som inte är mitt

Hela förslaget är en trovärdig version 2 av spelet, och den är bättre grundad i sporten än vad vi har. Frågan är inte om det är rätt — den är **när**.

Tre alternativ, Jacobs val:

**A. Bara berikningen nu.** `cause` och `tacticalFactors` på befintliga events. Motorn orörd, kalibreringen orörd, `O16`/`B4`/`B5` blir mycket bättre. Liten risk.

**B. Berikningen nu, motorn efter releasen.** Samma som A, plus att possession-motorn planeras som ett eget program med egen kalibreringsomgång.

**C. Bygg om nu.** Skjuter releasen och river `BEVARA`-listans starkaste post.

Min rekommendation är **B**. Berikningen ger tre beställda poster ett bättre underlag utan att röra det som fungerar. Och en possession-motor förtjänar samma sorts kalibreringsarbete som den nuvarande fick — 1 100 matcher, Fas 2–3 — inte en snabb omskrivning mitt i en releasekö.

**Det som ska sparas oavsett:** GPT:s designtext är den bästa taktiska grunden projektet har. Den ska ligga i `docs/` som referens för version 2, inte som en order.
