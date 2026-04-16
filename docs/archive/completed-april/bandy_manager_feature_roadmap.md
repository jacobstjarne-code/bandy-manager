# Bandy Manager — Feature Roadmap

**Syfte:** Säkerställa att alla planerade features finns dokumenterade och prioriterade,
oavsett om de byggs i V0.1 eller senare. Inget ska glömmas bort.

---

## V0.1 — Spelbar kärna

**Mål:** En komplett säsongsloop som tål 3+ säsonger utan att världen kollapsar.

### Domänmodell & infrastruktur
- [ ] Alla entities (Player, Club, League, Fixture, etc.)
- [ ] Alla enums (PlayerPosition, PlayerArchetype, MatchEventType, etc.)
- [ ] SaveGame-struktur (JSON, lokal lagring)
- [ ] Autosave efter match, säsongsslut, youth intake
- [ ] Spara/ladda/nytt spel

### Världsgenerering
- [ ] 12 fiktiva lag med bandykodade namn och regionförankring
- [ ] ~22 spelare per lag (~264 totalt)
- [ ] Klubbar med differentierade profiler (ekonomi, ungdom, faciliteter, rykte)
- [ ] Spelargenerering med position, arketyp, attribut, potential
- [ ] Schemgenerering (dubbelserie, 22 omgångar)

### Matchmotor
- [ ] 60-stegsmodell per match
- [ ] Lagscores: offensiv/defensiv styrka, hörnstyrka, målvaktsstyrka
- [ ] Initiativberäkning per steg
- [ ] Sekvenstyper: anfall, omställning, hörna, foul/utvisningsrisk, bolltapp
- [ ] Chansgenerering med kvalitetsnivåer
- [ ] Avslutskalkyl (shooting, vision, decisions vs defending, goalkeeping)
- [ ] Hörnor som signifikant offensivt vapen
- [ ] Utvisningar med tidsbegränsning och numerärt underläge
- [ ] Kalibrering för bandymässigt målsnitt (högre än fotboll)
- [ ] Matchrapport: resultat, målskyttar, assist, utvisningar, hörnor, skott, betyg

### Taktik
- [ ] Mentalitet (defensiv / balanserad / offensiv)
- [ ] Tempo (lågt / normalt / högt)
- [ ] Press (låg / medium / hög)
- [ ] Passningsrisk (säker / blandad / direkt)
- [ ] Bredd (smal / normal / bred)
- [ ] Anfallsfokus (centralt / kanter / blandat)
- [ ] Hörnstrategi (säker / standard / aggressiv)
- [ ] Utvisningsspel (penalty kill-stil)
- [ ] Alla val påverkar matchmotorn konkret

### Trupp & spelare
- [ ] Laguttagning: startellva + bänk + kapten
- [ ] Validering: inga skadade/avstängda, minst en MV
- [ ] Fitness: minskar efter match, återhämtas mellan
- [ ] Sharpness: ökar av speltid, minskar vid bänkning
- [ ] Form: påverkas av senaste prestationer
- [ ] Moral: påverkas av speltid, resultat, kontrakt (enkel i V0.1)
- [ ] Spelarbetyg efter match (1.0–10.0)
- [ ] Skador: baserat på injuryProneness, fitness, belastning
- [ ] Avstängningar: utvisningsbaserat

### Youth intake
- [ ] En gång per säsong
- [ ] 2–5 ungdomar per klubb
- [ ] Modifierat av youthQuality och youthRecruitment
- [ ] Positionsviktning mot truppbehov
- [ ] Ålder 15–17
- [ ] Potentialfördelning: 70% normal, 25% lovande, 5% topp
- [ ] Arketyp baserad på position
- [ ] Scouttexter per potentialnivå
- [ ] Intake-historik sparad

### Spelarutveckling
- [ ] Periodisk (veckovis/månadsvis)
- [ ] Påverkas av: ålder, potential, developmentRate, facilities, speltid, form
- [ ] Unga utvecklas snabbare, äldre planar ut/tappar
- [ ] Attribututveckling profilberoende (inte allt samtidigt)

### Transfers & kontrakt (FÖRENKLAD i V0.1)
- [ ] Fria agenter mellan säsonger
- [ ] Enkel "erbjud kontrakt"-mekanism
- [ ] Kontraktsförlängning: lön + antal år → accept/nej
- [ ] AI-klubbar: täck trupphål, förläng nyckelspelare, släpp överskott

### Ekonomi (FÖRENKLAD i V0.1)
- [ ] Basinkomst + matchintäkter + placeringsbonus
- [ ] Lönekostnader
- [ ] Saldo som begränsar beslut
- [ ] Inget mer i V0.1

### AI-managers (ENKEL i V0.1)
- [ ] Välj bästa tillgängliga elva
- [ ] Undvik skadade/avstängda
- [ ] Enkel taktik baserad på lagstyrka
- [ ] Säsongsslut: släpp överskott, förläng viktiga, värva på svaga positioner

### Säsongsflöde
- [ ] Matcher enligt schema
- [ ] Form/fitness/tabell uppdateras löpande
- [ ] Säsongsslut: sluttabell, styrelseutvärdering (light), kontraktsgenomgång
- [ ] AI-truppjustering, youth intake, nytt schema, ny säsong

### UI (mobilanpassad webapp)
- [ ] Onboarding: splash, nytt spel, välj klubb, manager-namn
- [ ] Dashboard: nästa match, tabell, truppstatus, notiser, senaste resultat
- [ ] Trupp: spelarlista, sortering, filtrering, laguttagning
- [ ] Spelarprofil: översikt, attribut, kontrakt (sektionsbaserad)
- [ ] Taktik: stora valbara segment/chips
- [ ] Matchförberedelse: motståndare, skador, startelva, taktik
- [ ] Matchvy: snabbsim + matchrapport (live text i V0.2)
- [ ] Tabell: placering, spelade, V/O/F, målskillnad, poäng
- [ ] Inkorg/notiser
- [ ] Bottom nav: Hem, Trupp, Match, Transfers, Klubb

---

## V0.2 — Djup och polish

### Väder & isförhållanden ⭐ UNIKT
- [ ] Vädersystem per matchdag (snö, kyla, mildväder, vind)
- [ ] Isförhållanden: naturis vs konstis per klubb
- [ ] Väder påverkar matchmotorn: bollkontroll, fart, teknik vs fysik
- [ ] Inställda matcher vid extremväder → schemaproblem
- [ ] Konstfrysen som facilitetsinvestering

### Live text-matchvy
- [ ] Matchklocka, ställning, kommentarsflöde
- [ ] Snabb statistik under match
- [ ] Taktikjusteringar under match (mentalitet, tempo)
- [ ] Byten under match

### Utökad matchmotor
- [ ] Finjusterad kalibrering baserat på V0.1-data
- [ ] Fler sekvenstyper
- [ ] Periodsystem (2 halvlekar à 45 min)
- [ ] Matchspecifika händelser (stolpskott, solochans, MV-tavla)

### Träningssystem ⭐ NYTT
- [ ] Lagövergripande träningsfokus (skridskoåkning, bollkontroll, hörnspel, fysik, taktik)
- [ ] Träningsfokus påverkar utveckling, fitness, form
- [ ] Balans: hård träning = snabbare utveckling men högre skaderisk

### Scouting ⭐ NYTT
- [ ] Osäkra spelarattribut tills scoutade
- [ ] Scoutrapporter med text och uppskattning
- [ ] Scoutningskvalitet som klubbattribut

### Dynamiska spelarpriser / marknadsvärden
- [ ] Marknadsvärde justeras baserat på prestation, ålder, kontrakt

### Utökade transfers
- [ ] Transferfönster (sommar + vinter)
- [ ] Budgivning med motbud
- [ ] Spelarintresse baserat på lön, rykte, speltid, klubbstatus
- [ ] Låneavtal

### Utökad ekonomi
- [ ] Sponsoravtal
- [ ] Arenakapacitet och biljettintäkter
- [ ] Kommunalt stöd
- [ ] Merchandiseintäkter

### UI-förbättringar
- [ ] Spelarprofil: karriärhistorik, utvecklingskurva
- [ ] Tabell: form senaste 5, resultatomgång
- [ ] Head-to-head-statistik

---

## V0.3 — Narrativ och karaktär

### Styrelse som karaktärer ⭐ UNIKT
- [ ] Namngivna styrelsemedlemmar med personligheter
- [ ] Ordförande, kassör, ungdomschef med olika agendor
- [ ] Styrelsemöten med beslut (enkel multiple choice)
- [ ] Styrelseförtroende som central mätare

### Spelarnas dubbelliv ⭐ UNIKT
- [ ] Spelare med deltidsjobb (begränsad träningstillgänglighet)
- [ ] Talanger som överväger att studera istället för att satsa
- [ ] Veteraner som funderar på att sluta pga familj
- [ ] Livsval som narrativa händelser

### Medialagret ⭐ NYTT
- [ ] Rubriker efter matcher (genererade)
- [ ] Journalistfrågor (multiple choice)
- [ ] Spelarreaktioner i media
- [ ] Ryktesgenererare inför transferfönster
- [ ] Claude API för dynamisk textgenerering

### Rivaliteter ⭐ NYTT
- [ ] Naturliga rivaler per klubb
- [ ] Derbymatcher: högre intensitet, fler utvisningar, bättre stämning
- [ ] Spelarförsäljning till rival påverkar fans
- [ ] Derbyhistorik och statistik

### Flerårsnarrativen ⭐ NYTT
- [ ] "Story triggers" — händelser som genererar minnesvärd text
- [ ] Ungdomsdebutanten som blev stjärna
- [ ] Rivalen som köpte din bästa spelare
- [ ] Karriärtidslinje med höjdpunkter
- [ ] Achievements/milstolpar

### Cup
- [ ] Svenska Cupen med lottning och upsets
- [ ] Cupfinal som narrativ höjdpunkt
- [ ] Lägre division-lag i tidiga rundor

---

## V0.4 — Skalning och community

### Fler divisioner
- [ ] Allsvenskan (division 2)
- [ ] Upp- och nedflyttning
- [ ] Kvalspel

### Flerårig historik
- [ ] Historiska tabeller per säsong
- [ ] Transferhistorik
- [ ] Rekordhållare (flest mål, längst i klubben, etc.)

### Spelarroller och personligheter
- [ ] Ledare, problemspelare, tyst arbetare, showman
- [ ] Personlighet påverkar dynamik i omklädningsrummet
- [ ] Kaptenskap och mentorskap

### Avancerad AI
- [ ] AI-managers med olika profiler (defensiv, offensiv, ungdomssatsare)
- [ ] AI reagerar på spelarens framgång (rival stärker)
- [ ] Realistiska transferstrategier

### Multiplayer-grunder
- [ ] Delad liga med vänner (asynkront)
- [ ] Jämför karriärer

### Cloud save
- [ ] Synka mellan enheter

---

## V1.0 — Full produkt

### Verkliga lag och spelare (licensberoende)
- [ ] Elitserien med riktiga lagnamn och spelare
- [ ] Kräver avtal med Bandyförbundet/klubbar
- [ ] Alternativ: community-mod-stöd

### Damernas Elitserien
- [ ] Parallell liga med egna lag och spelare

### Internationellt
- [ ] Finska ligan, ryska ligan
- [ ] VM och landslagsuppdrag

### Avancerad grafik
- [ ] 2D-matchvy (top-down)
- [ ] Spelarporträtt
- [ ] Arenavisualisering

### Modding-stöd
- [ ] Importera egna ligastrukturer
- [ ] Redigera spelardata
- [ ] Community-databaser

---

## Designprinciper (gäller alla versioner)

1. **Varje tryck ska ge framdrift.** Ingen session ska kännas meningslös.
2. **Bandykänsla i varje detalj.** Väder, hörnor, utvisningar, små orter, ideell kultur.
3. **Berättelser över siffror.** Spelare ska vara karaktärer, inte datapunkter.
4. **Respektera spelarens tid.** Fungera i 2-minuterssessioner och i 30-minuterssessioner.
5. **Bygg modulärt.** Varje system ska kunna utökas utan att skriva om grunden.
