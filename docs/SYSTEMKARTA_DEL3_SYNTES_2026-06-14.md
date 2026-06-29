# SYSTEMKARTA DEL 3 — SYNTES & VÅG 2-BACKLOGG

**Datum:** 2026-06-14 · **Av:** Opus · **Korsar:** systemgenomlysningen (DEL 1–2i, 13 kartfynd) × Design-Fables spelkänsle-rapport (2 säsonger, build 678bf5d) × Jacobs genomspelning.
**Metod:** Design SÅG buggarna på skärmen; Opus har rotorsakat de som är kod (filläsning nedan). Där rotorsak anges är den verifierad i källan, inte gissad.

---

## DEL 3.0 · DOM

Tre källor pekar åt samma håll, och det är goda nyheter: **spelet är färdigbyggt i sina svåra delar** (narrativ, ceremoni, minne, motor, ekonominav) och ofärdigt i sina lätta. Designs mening — "inte omdesign, utan tre system som inte byggdes klart plus en handfull buggar" — matchar genomlysningens bild exakt. Två av mina hypoteser föll, och det är värdefullt: **ingen död mittsäsong** (mitten är tätast) och **rösten har inte driftat** på två säsonger. Det betyder att den dyra delen — att få spelet att kännas levande och sammanhållet över tid — redan är löst. Det som återstår är avgränsat och billigt relativt det.

**Korsningens viktigaste insikt:** mitt kartfynd 3 (beslutsbudgeten täcker en kanal av åtta) och Designs C3 (avbrottsstapling 5–7/portal) är SAMMA fynd från två håll — och Design löste designfrågan jag inte kunde svara på: **budgeten ska gallra BESLUT (kapten/sponsor/annandag/akademi), inte narrativa band (efterklang/kafeterian/journalist).** Det var precis den policy interruptClassifier-instrumentet väntade på. Mekaniken fanns; nu finns regeln.

---

## DEL 3.1 · BUGGAR — rotorsakade (Code-ordrar)

**BUG-1 · Straffresultat når aldrig live-tavlan** (Design prio 3)
Rotorsak verifierad: `simulateMatch` (matchEngine, fast-sim) sätter `fixture.penaltyResult = finalStep.penaltyFinalResult` korrekt → Granska/summary läser fixturens fält och visar rätt. MEN den interaktivt spelade cup-matchen resolverar straffserien i live-vyn (matchCore) och live-scoreboarden renderar stegets `homeScore/awayScore` (5–5) utan att läsa `penaltyFinalResult`. `updateCupBracketAfterRound` läser `penaltyResult` rätt (vinnaren propageras), så BARA scoreboard-raden saknas.
→ **Code:** lägg en straffrad i live-scoreboardens slutläge (när step.phase === 'penalties'): visa "Straffar X–Y" + utfallsetikett. Summary/bracket är redan korrekt. Liten, lokaliserad.

**BUG-3 + BUG-4 · Playoff-portalens rund-beat + Fokusera-kort auto-rensas inte** (Design prio 2, EN fix)
Rotorsak: playoffProcessor (bracket/inbox) är ren — buggen är i portalens beat-state, som inte invalideras vid rundövergång (KF→SF), så semifinalen bär kvartsfinalens "Första gången någonsin vi är här"-text och Fokusera-kortet följer med.
→ **Code:** rensa playoff-rund-beaten + Fokusera-kortet när `playoffBracket.status` ändras (eller när managed series byter round). En invalidering, fångar båda.

**BUG-5 · Minnesgeneratorn etiketterar semifinal som cupfinal** (Design prio, buntad med BUG-6)
Rotorsak verifierad i `clubMemoryEventBuilders.ts → buildEventFromFixture`: villkoret `if (fixture.isCup && fixture.isCupFinalhelgen)` ger 'cup_final'-etikett. Men `cupService.generateNextCupRound` sätter `isCupFinalhelgen` på BÅDE runda 3 (semi) och 4 (final) — `isCupFinalWeekend = nextRound >= 3`. Så semifinal-match får cupfinal-text.
→ **Code:** villkora på cup-RUNDAN, inte helg-flaggan: `fixture.isCup && fixture.roundNumber === 4` för cup_final; runda 3 ska antingen ge egen 'cup_semifinal'-etikett eller utelämnas. En rad + ev. ny etikett.

**BUG-6 · Tomma fornsäsonger (2022–2025) renderas** (samma yta som BUG-5)
→ **Code:** minnesvyn ska inte rendera säsonger före `game.careerStartSeason` (eller före första completed fixture för managed club). Filtrera bort säsonger utan egna events. ClubMemoryView/ClubMemorySeasonSection.

**BUG-2 · Säsong 2-start svart portal** (Design prio 4)
Designs diagnos: overlay/transition fastnar i mid-fade, samma klass som Minne-flikens (fixade) kontrast-bugg. Ej kod-rotorsakad av Opus (presentationstillstånd, kräver runtime-repro). → **Code:** trolig fix = samma opacity/overlay-invalidering som löste Minne-fliken; verifiera season-transition-overlayns teardown vid säsongsskifte.

**BUG-7 · "vänder ur. Och vänder ur. Och vänder ur."** → copy-pool, DEL 3.4.
**BUG-8 · Lagfoto klipps >394px** → overflow, delade-primitiver-svepet (responsiv ram).

## DEL 3.2 · DE TRE OBYGGDA SYSTEMEN — mot kartan

**C1 · Endgame-kurering (R3-specen som aldrig kördes) — Design prio 1, korsar INGET kartfynd.**
Detta är ett RENT presentationsfynd som genomlysningen inte kunde se (jag läste logik/state, inte renderingsvillkor). Designs bevis är skarpt: semifinal match 1, en förlust från utslagning, och portalen erbjuder sponsorbastu + journalistrelationer + nemesis. R3-handoffen specade hård-döljning av icke-match-kort i slutspel — byggdes aldrig.
→ **Försoning:** endgame-fas (slutspel + slutspurt omg 20–21 + säsong 2-start) hård-DÖLJER icke-match-kort, inte dämpar. Detta är samma kanal-gallring som C3/kartfynd 3 men tidsstyrd: när matchen är avgörande är portalen EN sak. Prio 1.

**C2 · Notis-dieten ackumulerar (51 olästa omg 16, 59 vid säsong 2) — korsar kartfynd ur roundProcessor.**
Genomlysningen verifierade att notisdieten A1–B5 ÄR implementerad (gallring läst 2/oläst 4 omg, spill-to-inbox, max-i-kö). Men Design ser att VOLYMEN ändå växer obegränsat — dieten throttlar inflödet per omgång men rensar aldrig ackumulerat lager, och säsongsskiftet nollställer inte. A5-arkiveringen (som jag verifierade i seasonEndProcessor) räcker inte.
→ **Code:** (a) aggregera repetitiva typer (träningsrapporter → en rad/omg), (b) inga egna matchresultat i inkorgen (A1 sa redan detta — verifiera att det faktiskt gäller alla resultatnotiser), (c) nollställ/arkivera hårt vid säsongsskifte.

**C3 · Avbrottsbudget — = KARTFYND 3, nu med Designs policy.**
interruptClassifier-instrumentet finns (byggt 05-21, oanvänt). Designs regel avgör policyn: budgeten gallrar BESLUT-kanaler (kapten/sponsor/annandag/akademi/pension), narrativa band (efterklang/kafeteria/journalist/minne) är ALDRIG budgeterade — de är spelets röst. 
→ **Code (våg 2):** wira interruptClassifier till en omgångsbudget över beslutskanalerna; lämna narrativa kanaler fria. Max N beslut/portal, överskott → inbox eller nästa omgång.

## DEL 3.3 · fanMood — KARTFYND 8 BEKRÄFTAT AV GENOMSPELNING

Genomlysningen: fanMood är symmetrisk delta utan reversion/asymmetri, pulsen är navet med sex konsumenter + mean reversion + diminishing returns. Designs observation bekräftar exakt: **klack-mood låg parkerat på 60 hela säsong 1** medan Orten (puls) rörde sig (83▼ med trend). fanMood ser död ut bredvid pulsen — precis hypotesen.
→ **Våg 2 (Opus specar mot pulsens modell):** ge fanMood reversion + reaktion. Men Designs nyans: mood ska REAGERA på derby/resultat/annandagen (händelsedriven), inte bara drifta. Alltså: pulsens reversion-motor + händelse-spikar vid derby/storseger/annandag. Opus skriver kurvan när detta byggs — nu finns empirin (parkerat på 60 = startvärdet, rör sig aldrig → reversion-target + event-deltas behövs).

## DEL 3.4 · Textskav — i kontext för första gången

Auditen fixade 210 strängar i isolering; Design såg dem i drift. Fynd:
- **"Det som hände i höstas räknas inte i dag"** på omg 1 säsong 1 — antar historik som inte finns. Villkora bort säsong 1. (F-klass: tidsantagande, samma familj som tidsbuggen.)
- **Burnout "Jag måste tänka klart över helgen" loopar 6+ ggr** — borde eskalera mot säsongsslut. Bredda pool + eskaleringskurva. (Detta är samma klass som anniversary-tidsdriften — text som inte vet var i tiden den är.)
- **"Lite hawaii över detta"** — anglicism mot bandysvensk understatement. Byt. (F-klass: ton.)
- **"vänder ur. Och vänder ur. Och vänder ur."** (BUG-7) — mall dubblerar. Render- eller poolfel.
- **Pressrubrik på 3 ytor** identisk · **Anteckningar "Albin vill spela mer"** ×2 ordagrant. Variantbrist.
- **Lager 2-copyn (kartfynd 9):** Design såg inte explicit men den är fortfarande O-auditerad i processors/ — pensionsval-copyn (DEL 3.5) ÄR Lager 2, och den hade fel. Bekräftar att processors/-svepet behövs.

## DEL 3.5 · Pensionsvalet — kartfynd + Design möts

Genomlysningen flaggade avskeds/pensions-UPPLEVELSEN som oklar (managerFired utan skärm; pension-ceremonin fanns i seasonEnd men orenderad i min läsning). Design SÅG den: **pensionsvalets knappar har två konkurrerande fetstilar på samma rad** — följer inte decision-card-mallen (bastu-modallen är mallen: en primär etikett + mono-konsekvensrad).
→ **Code:** pensionsval-kortet till decision-card-mallen. Och detta är Lager 2-copy (kartfynd 9) → ta med i processors/-textsvepet.

## DEL 3.6 · Det som föll — hypoteser FALSIFIERADE (dokumenteras)

- **Död mittsäsong (omg 6–11):** FALSK. Mitten är tätast (kaptenval→annandag→sponsor→akademi→nemesis→VM→burnout). Spänningskurvan behöver INGEN åtgärd. Detta sparar oss från att "fixa" något som fungerar.
- **Röstdrift över säsonger:** FALSK. Tonen håller på två säsonger. Textauditens arbete höll.
- **Onboarding svag:** FALSK. Designs ord: spelets styrka, narrativ-lett. (Enda nyans: klubbkartans Sverige-silhuett läses knappt som karta — kosmetisk.)

## DEL 3.7 · RANGORDNAD VÅG 2-BACKLOGG (Opus syntes av Designs lista + kartan)

| Prio | Åtgärd | Typ | Källa (korsad) |
|------|--------|-----|----------------|
| 1 🟥 | Endgame-kurering: hård-dölj icke-match-kort i slutspel/avgörande | Bygge | C1 (ren design, R3-spec) |
| 2 🟥 | Playoff rund-beat + Fokusera auto-rensning | Bugg (1 fix) | BUG-3/4, rotorsakad |
| 3 🟥 | Straffrad till live-scoreboard | Bugg | BUG-1, rotorsakad |
| 4 🟥 | Cup-rundetikett (semi≠final) + tomma fornsäsonger | Bugg (1 yta) | BUG-5/6, rotorsakad |
| 5 🟥 | Säsong 2-start svart portal | Bugg | BUG-2 |
| 6 🟥 | Notis-diet: aggregering + säsongsnollställning | Bygge | C2 × roundProcessor |
| 7 🟧 | Delade primitiver: positionLabel · tkr/mån · severity · TabBar(fade) · lagfoto-overflow | Svep | DEL F + BUG-8 |
| 8 🟧 | HIDDEN_PATHS: dölj BottomNav på ceremoni-/scen-ytor | Svep | DEL F |
| 9 🟧 | Avbrottsbudget: gallra beslut ej narrativ (wira interruptClassifier) | Bygge | C3 = kartfynd 3 |
| 10 🟧 | fanMood reversion + event-reaktion | Bygge (Opus specar) | kartfynd 8 × Design §3 |
| 11 🟧 | Pensionsval → decision-card-mall | Design + Lager2-copy | DEL 3.5 × kartfynd 9 |
| 12 🟧 | Globala svep: emoji→Lucide, disabled B8, gold→copper, tomma kort, Klubb-kollaps, scoreboard-redundans, taktik-kontrast | Svep | DEL F |
| 13 🟨 | Copy-pooler: burnout-eskalering, höst-villkor, hawaii, vänder-ur, pressrubrik, anteckningar | Text (Opus) | DEL 3.4 |
| — | processors/ Lager 2-textsvep (O-auditerad copy) | Text/grep | kartfynd 9 |

**Mönstret Design fann är nyckeln till sekvensering:** det som krävde EN komponent blev rätt; det som krävde ett GLOBALT svep sitter halvgjort. Därför: prio 7 (delade primitiver) FÖRE prio 12 (globala svep) — bygg primitiven en gång, svep sedan via den, inte route-för-route. Det är samma lärdom som väderloopen/interruptClassifier: bygg mottagaren, wira sedan.

## DEL 3.8 · Vad som INTE ska göras
- Spänningskurvan: orörd (falsifierad hypotes).
- Onboarding: orörd (styrka).
- Motorn, ekonominavet, minnessystemet, ceremonierna: orörda (verifierat välbyggda båda källor).
- Röst/ton: ingen ny audit (höll på 2 säsonger).

— Opus, 2026-06-14 · genomlysningen STÄNGD (läsning + syntes klar; återstår enbart att bygga vågen)
