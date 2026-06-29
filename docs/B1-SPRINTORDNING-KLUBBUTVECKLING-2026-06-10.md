# B1 — Klubbutveckling: sprintordning (lång-loopen)

**Datum:** 2026-06-10 (rev. efter strävan-korrigering med Jacob)
**Källa:** `SPEC_KLUBBUTVECKLING.md` + auditen + vår inomhus/utomhus-diskussion (okt 2025) + Opus creative pass, korrigerad av Jacob.
**Läs strävan först. Den är vänd rätt nu — utomhusvitalitet, inte betong. Min första version gjorde hallen till drömmen; det var bakvänt.**

## Strävan — vad sträcker man sig mot?
I FM sträcker man sig mot glans. Det är inte det här spelet. Och — som vi redde ut i höstas — i din och Eriks bandy är hallen inte drömmen, den är närmare ett hot mot själen: matchhallar driver publikdöden (Sandviken, Västerås, Hammarby i Gubbängshallen), klimatargumentet klingar tomt, och utomhus är så sporten *spelas* — fotboll i Norge i ruskväder är samma logik. Strävan kan alltså inte vara betong.

Strävan är att **hålla det riktiga vid liv och i form.** Den fulla läktaren. Akademin som ger orten egna spelare. Vädret och kylan som en del av spelet. Klubben som består *som sig själv* — utomhus, ortens, levande — säsong efter säsong. Beständighet av det äkta, inte ett monument.

Vädret är inte en bugg att lösa. Det är texturen. Att vilja bygga bort det är hall-logiken — och priset för det är själen.

Det svarar på fyra av auditens åtta topp-luckor i ETT paket:
- **Aspirativ ekonomi** — kassan blir "stärk klubben och läktaren", inte "undvik −2M".
- **Mittfältsöknen** — varje säsong är en sten i något som består, omgång 14 har riktning.
- **Säsongsövergångens krok** — du bär ett flersäsongsprojekt vidare.
- **Lång-loopen själv** — det finns något att sträcka sig mot i säsong 5: en klubb som lever och är ortens.

## Hallfrågan — placerad rätt, inte raderad
Hallar är en realitet; att låtsas att de inte finns vore lika falskt som att göra dem till mål. Distinktionen är skarp, och den ÄR poängen:

- **Konstis = baseline.** Sedan 60-talet, ingen på naturis. Inget bygge man strävar mot — klubben har den. *(SPEC §2 har den som 200k-bygge → ta bort, gör baseline.)*
- **Träningshall = accepterad.** Även utomhusklubbar (Sirius, Hammarby) har dem; puristerna lever med det. Ett vettigt, själs-bevarande steg — ungdom, åretrunt-träning — utan att flytta matchen in. Ingen dilemma. *(SPEC saknar den — hoppar rakt till 2M-matchhallen. Lägg in den som accepterat mellansteg.)*
- **Matchhall = den laddade gaffeln.** Att spela *hemmamatcher* inomhus — publikdöden. En lååång, valfri gren *vissa* klubbar tar: åretrunt-spel och tv-pengar mot publiken och själen. **Inte ett mål. En kostnad.** *(SPEC §4 "INOMHUSHALLEN — DEN STORA DRÖMMEN" ska vändas helt: inte drömmen, utan vägvalet med ett pris.)*

Bara matchhallen är dilemmat. Konstis och träningshall är ofarliga, normala.

## Designprincip för ordningen
Varje sprint ska leverera en *strävan-beat*, inte bara en mekanism. Ordningen sekvenseras kring den upplevda känslan av att hålla det riktiga vid liv, inte kring datastrukturer.

## Sprintarna

**Sprint 1 — Valet.** Säsongsplaneringsbeslutet i PreSeason (välj EN sak) + utbyggnadsträdet med dependencies (ersätt platta listan, SPEC §2). Valen är on-values: läktare, värmestuga, träningshall, akademi — saker som alla stärker det riktiga. Ett verkligt val: läktare nu (fler på plats i år) eller akademin (ingenting i år, egna spelare om tre säsonger). Konstis är inget val — den finns.
*D1 landar här.* Säsongsplaneringsbeslutet är tungt och måste väga tyngre i kortgrammatiken än bussresan.

**Sprint 2 — Framsteget syns.** Halvårsrapporten (omgång 12, nu när den avfyras — `6a9dc70`) utökad med byggets %-färdig + akademins prospekt. Plus ekonomisk säsongssammanfattning: vart pengarna gick, vad som väntar. Återkopplingen som gör åtagandet till framsteg.

**Sprint 3 — Ekonomin blir aspirativ.** Kontextuella sponsorer (6 triggers, SPEC §1A — men arena-namnsponsorn kopplas till matchhallen, alltså sent/valfritt, inte ett självklart plus), publiktrend (§1B), löneeskalering (§1C). Vänder kassan från försvar till strävan. Löneeskaleringen ger dilemmat: behåll 28-åringen som vill ha +25%, eller släpp för 19-åringen från akademin?
*D2 landar här.* Att ignorera ett kontrakt/en sponsor/ett bygge har en upplösning — talangen går, sponsorn söker sig vidare. "Noll konsekvens är inte mjukhet, det är frånvaro" (auditen).

**Sprint 4 — Matchhall-gaffeln (sent, valfritt, ALDRIG klimax).** Hallfrågan som process (SPEC §4, omvänd): förankring → krav → kommunförhandling → bygge. Men dramat är *vägvalet*, inte bygget. Att gå inomhus kan ge åretrunt-spel och tv-pengar — och kosta dig publiken och själen. Spelaren ska få *leva* argumentationen (din och Västra Sidans), inte klicka upp en uppgradering. Det här är det FM inte kan rymma: idén att den största "uppgraderingen" kanske är ett svek. (`hallDebateData.ts` finns delvis — bygg om från "dröm" till "vägval med pris".)

**Sprint 5 — Texturen.** Verksamhetsbeslut med trade-offs (SPEC §5): kiosk-priset, annandagsplaneringen, bandyskola→akademi. Kornet som gör varje säsong levd. Lägst prio.

## SPEC-kirurgi som följer (innan Sprint 1 byggs)
- **§2 (trädet):** konstis → baseline (bort som bygge). Lägg in **träningshall** som accepterat mellansteg (ungdom/åretrunt-träning, ingen publikdöden).
- **§4:** vänd "DEN STORA DRÖMMEN" → matchhall-gaffeln, ett laddat vägval med publikdöden-pris. Inte slutmål.
- **Väder:** behåll det som texturen i utomhusmatchen, inte ett problem att bygga bort.

## Var D1/D2 hör hemma
Auditen: besluten har kvitto men saknar viktgradering (D1) och konsekvens vid ignorering (D2). B1 är provbänken — säsongsplaneringsvalet ÄR tungt (D1), matchhall-gaffeln är det tyngsta värdebeslutet i spelet (D1), och att ignorera bygge/kontrakt HAR en kostnad (D2). Introducera genom B1:s beslutsrytm, generalisera sedan.

## Målberoende
B1 är rätt för alla tre målen (a/b/c) — SPEC:en är densamma oavsett. Målet ändrar vad som läggs *runt* B1: kommersiellt kräver onboarding + telemetri; hantverk/Bury Fen kräver att loopen sjunger. B1 kan starta utan att målet är låst.

## Sekvenseringsnot
Sprint 1 (valet + PreSeason-beslutet) bör vänta tills A3-layouten och Erik-playtesten landat — Erik kan visa att strävan behöver kännas annorlunda än vi nu tror. Trädets domänmodell (relay nedan) är ren data och kan börja oberoende — men först efter SPEC-kirurgin ovan, annars bygger Code in konstis-som-bygge igen.

---

**Till Code (Sonnet, VS Code) — B1 Sprint 1, steg 1 (facility-träd, domänmodell):**
*(Fire:as när Jacob okejat strävan + SPEC-kirurgin — inte innan.)*

Ersätt platta projektlistan i `facilityService.ts` med ett träd med dependencies, tre grenar (Anläggning · Verksamhet · Akademi) enligt korrigerad modell:
- **Konstis = baseline**, inte ett byggbart projekt (klubben har den).
- **Träningshall** = accepterat mellansteg (ungdom/träning), ingen publikdöden-effekt.
- **Matchhall** = sent, gated bygge med en uttalad trade-off i datamodellen (publik-/moral-/ekonomi-effekt åt båda håll), inte ett rent plus.
Varje projekt: `cost`, `buildRounds`, `requires`, `effect` (positiv OCH negativ där relevant). Max ett aktivt bygge åt gången. Behåll befintlig facility-nivådata, bryt inga läsningar. **Ingen UI ännu** — domänmodell + dependency-/gate-logik, testbar isolerat.

Klart = träd med korrigerad hall-modell · matchhallens trade-off uttryckt i data · max-ett-bygge · befintliga läsningar opåverkade · enhetstester · tsc + tester gröna. **Rapportera datastrukturen och hur matchhallens kostnad-sida uttrycks.**
