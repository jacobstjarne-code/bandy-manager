# HANDOVER — Klubbmärken + projektläge, 2026-09-10 (nästa pass)

Skriven av Opus i slutet av ett mycket långt pass. Läs den här + `PORTRAIT_REGISTER.md` (modellen) + hitta den befintliga klubb-bakgrundsfilen (se nedan) innan du börjar.

---

## AKTIV TRÅD: klubbmärken (12 klubbar)

**Mål:** 12 fantasy-klubbmärken. Opus skriver kontraktet (samma roll som porträttregistret), Jacob genererar (Gemini), Code wirar. Det finns 12 klubbdefinitioner i `ClubBadge.tsx`.

### Den skärpta designinsikten (låst — bygg vidare på den, upprepa inte omvägen)

Codex tekniska genomgång ändrar allt: märkena är inline-SVG i `ClubBadge.tsx` (64×64 viewBox), måste läsa från **10 px till 56 px**, sitta på mörka OCH ljusa ytor OCH ovanpå miljöbilder, och konturen färgsätts **dynamiskt** per sammanhang. Slutsats: inte ett detaljrikt heraldiskt vapen — **ETT starkt enkelt motiv per klubb**, en silhuett som överlever till 10 px och funkar som enfärgad kontur. Leverans: kvadratisk SVG/klubb, transparent, luft runt. Mikrovariant för 10–24 px, eller huvudmärket extremt tydligt.

Det här **löser** Jacobs verklighet-mot-lore-invändning i stället för att samsas med den: när märket tvingas till ETT motiv går det inte att hedga (inte glas OCH något annat). Alltså blir verklighet-mot-lore ett **skarpt val per klubb**.

### Regeln (Jacobs, låst)

**Verkligheten väger in, den överstyr inte.** Tre lager per klubb: (1) ortens/klubbens VERKLIGA symbol + kommunvapnets huvudfigur, (2) spelets redan påhittade lore-motiv (arena/klack/klubbhus), (3) märket vi ritar. Där (1) och (2) krockar är det ett designbeslut per klubb — ibland vinner lore (redan etablerad, kanske finare), ibland verkligheten, ibland en tredje sak som rimmar med båda. Kommunvapnet är ofta ortens sannaste symbol (VSK-märket föddes ur Västerås stadsvapen — se research-filen).

### Per-klubb-raden som ska in i bakgrundsinfon — fyra fält

1. Ortens/klubbens verkliga symbol + kommunvapnets figur
2. Spelets påhittade lore-motiv (ur arena/klack i `worldGenerator.ts`)
3. Krock: ja/nej
4. Valt märkesmotiv — ETT motiv, designbeslut, verkligheten väger in men vinner inte automatiskt

### Rostern (12 klubbar) + spelets redan kodade lore-motiv

Ur `worldGenerator.ts` `CLUB_TEMPLATES` (läste de 7 första fullt; **läs klart hela arrayen nästa pass** för de sista + exakt 12:e namnet):

- **Forsbacka** (Gästrikland): Slagghögen / Järnklacken → **järn/slagg**
- **Söderfors** (Uppland): Ässjan / Hammarsmederna → **smedja/järn**
- **Västanfors** (Västmanland): Schaktvallen / Bergskurvan → **gruva**
- **Karlsborg** (Norrbotten): Bastionen / Norrskensklacken → **fästning/norrsken** (OBS möjlig krock: verkliga Karlsborgs fästning ligger i Västergötland, inte Norrbotten)
- **Målilla** (Småland): Hyttvallen / Glasblåsarna → **glas** (SANNOLIK KROCK: Målilla ligger i Hultsfreds kommun, INTE i Glasriket — Kosta/Orrefors/Boda ligger längre öster. Glas-loren är troligen påhittad, inte ur ortens verklighet. Detta var exemplet som motiverade hela researchen.)
- **Gagnef** (Dalarna): Älvvallen / Dalkurvan → **älv/Dalarna**
- **Hälleforsnäs** (Södermanland): Gjutarvallen / Härdarna → **gjuteri/järn**
- Kvar att läsa ur templaten: ~5 till (Lesjöfors, Slottsbron, Skutskär bekräftade ur journaler; sista namnet oläst).

### Research gjord (4 klubbar, verklig symbol/karaktär)

- **Västanfors IF**: 1916, rött/vitt, smeknamn Västanfläkt/"Fläkten", bruksort Fagersta (Bergslagen), SM 1954. Gruv-loren rimmar med Bergslagen.
- **Skutskärs IF**: 1915/1919, grön-gult, pappersbrukssamhälle vid Dalälvens mynning (Stora Enso), SM 1944/59/2018. (Spelets Skutskär-lore okänd — kolla templaten.)
- **Lesjöfors IF**: 1924/1929, smeknamn "Bandybaronerna", litet **järnbruk vid en fors**, känt för **industrifjädrar** (Sveriges första), hemmaplan **Stålvallen**, Värmland. Grundades av bruksbaronen Gerard De Geer. → LORE OCH VERKLIGHET SAMMANFALLER helt; motivet ritar sig självt (fjäder / järn / fors).
- **Slottsbrons IF**: Värmland, verklig bandyklubb med SM-historik. Tunn research hittills — djupare nästa pass.
- **Genrekonvention** (i research-filen): svenska bandymärken härleds ofta ur stadsvapnet, färger valda för att skilja sig från lokalrivalen, heraldisk sköld eller monogram, djupt lokalt (bruk/älv/is).

### Research KVAR

Sista klubbnamnet + för ALLA 12: verklig kommunvapen-huvudfigur + verklig bandyklubb-status/färger där de finns. Särskilt de som kanske INTE är bandyklubbar (Målilla, Karlsborg, Gagnef, Hälleforsnäs, Forsbacka, Söderfors) — researcha ortens kommunvapen + karaktär. Sök-tungt: ~8 klubbar × (kommunvapen + klubb). Eget pass.

### Filer

- `design-system/RESEARCH_KLUBBMARKEN_VERKLIGA_2026-09-10.md` — researchdoc (genre + Västanfors/Skutskär + designprincip). Ska **utvidgas** till full per-klubb 4-fältsstruktur för alla 12.
- **BEFINTLIG klubb-bakgrundsfil — EJ LOKALISERAD ÄN. Jacob: "den har vi ju en tidigare", och researchen ska LÄGGAS IN där.** Första uppgift nästa pass: hitta den. Kandidater: `src/domain/data/klubbparmContent.ts` (Klubbpärm-lore), eller en docs-fil. Sök `klubbparm`, `klubb`, `bakgrund`, `Klubbpärm`.
- `src/presentation/components/ClubBadge.tsx` — 12 klubbdefinitioner + inline-SVG (Codex ramar). `bandymanager-logo.png`/`buryfen-logo.png` är varumärken, INTE klubbsymboler.
- `PORTRAIT_REGISTER.md` — modellen för märkeskontraktet.

### Nästa pass, ordning

1. Läs full roster ur `worldGenerator.ts` CLUB_TEMPLATES (12, med region + arena/klack).
2. Hitta den befintliga klubb-bakgrundsfilen.
3. Researcha de 12: verklig kommunvapen-figur + bandyklubb/ort-karaktär; flagga krock mot lore.
4. Skriv per-klubb-rader (4 fält) i bakgrundsfilen.
5. Skriv märkeskontraktet (som PORTRAIT_REGISTER): valt motiv/klubb + basprompt + **separationsregel** (variera sköldform/motivtyp/färgpar; inga två klubbar delar samma industri-motiv), inom Codex ramar (ETT enkelt motiv, läser vid 10px, enfärgs-kontur-säker, kvadratisk transparent SVG, mikrovariant). Sen genererar Jacob.

---

## BREDA PROJEKTLÄGET (orientering)

- **Öppet ≈ 20.** Agenterna (Code/Codex/GPT) för räknar-narrativet minutiöst och arkiverar löpande — filen ruttnar inte. **Fulläsning av `MASTER_OPPET.md` TIMEOUTAR** (för stor); riktade `edit_file`-appendar funkar (bevisat), och små head-läsningar funkar. Skrivningar funkar mest.
- **Code bygger en våg** ur polish/INT-1: smfinal SceneSeam (`DOM_POLISH_SMFINAL_SKARV_2026-09-10`), portalhierarki (`DOM_POLISH_PORTALHIERARKI`), nudges-åldersviktning (`SPEC_DECISIONBUDGET_ALDERSVIKTNING_2026-09-10`, domänlogik), opponentform-trend (liten). pt6-nedsläckning byggd + arkiverad (`a8270035`).
- **Min köade riktade öppet-bokföring (gör när bygg-vågen lagt sig, riktat):** high6 → arkiv (beslut "lämna"); drift-migreringen villkorad mot push-timing (agera bara om push tänds före 2026-10-10, annars låt gratis-DB löpa ut); permission-copyn filas in (utkast finns i chatten, klubbrösten); dataskydd redan låst (90 dygn).
- **Porträtt:** registret har veteran(30)+ung(30)+mid 1–10. KVAR (Opus): mid 11–30, erfaren-facket (30, mot skärpt bas + separationsregel), + väv in extrem-budgetens sista oplacerade (andra grå elder → erfaren). Prompt-raden i registret säger fortfarande "opak skiffergrå bakgrund" men de 32 originalen kördes om till **transparens + tajtare cirkel-crop** (Jacob+GPT, cache `v=7`) — **uppdatera prompt-raden till transparens** så de ~50 kvarvarande inte behöver efterbehandlas. Ej committat porträttarbete pågår parallellt — rör inte.
- **Design:** polish-kön 5/5 dömd/dispositionerad. Tysta ytorna (cupintro + hallprövning) är Designs nästa, brief skriven (`DESIGN-BRIEF-TYSTA-YTOR-CUPINTRO-HALLPROVNING-2026-09-10`).
- **Opus skrivleveranser i kö:** beslutskort slutlig copy (situationstexter), transfers §4-poolerna klara (`OPUS_STRANGPOOLER_2026-09-10`), N-mötets övertaganderad klar (samma fil).

## Lärdomen som bet det här passet

Läs artefakten, inte referatet — **även agenternas avföringar**. Jag avförde nudges OCH smfinal på Codes "redan löst"-referat; kodläsning visade att nudges hade en äkta anti-svält-lucka och smfinal saknade SceneSeam helt. Jacob fångade båda. Verifiera "redan löst" mot koden innan du håller med.

---

## NÄSTA PASS — VERIFIERAT 2026-09-10 (Opus, mot kod + KLUBBFAKTA)

De två öppna trådändarna är avklarade mot artefakterna. Korrigeringar mot antagandena ovan.

### Trådände 1 — full roster

Läst ur `src/domain/services/worldGenerator.ts` (`CLUB_TEMPLATES`), inte roten — därför missade den tidigare sökningen. 12 klubbar, exakt. Sista/12:e namnet: **Heros** (Dalarna, ort = Smedjebacken vid Norra Barken). Klubb — region — arena — klack — kodat lore-motiv:

| # | Klubb | Region | Arena | Klack | Lore-motiv |
|---|---|---|---|---|---|
| 1 | Forsbacka | Gästrikland | Slagghögen | Järnklacken | järn/slagg |
| 2 | Söderfors | Uppland | Ässjan | Hammarsmederna | ankarsmedja/järn |
| 3 | Västanfors | Västmanland | Schaktvallen | Bergskurvan | gruva/berg |
| 4 | Karlsborg | Norrbotten | Bastionen | Norrskensklacken | fästning/norrsken |
| 5 | Målilla | Småland | Hyttvallen | Glasblåsarna | glas/hytta |
| 6 | Gagnef | Dalarna | Älvvallen | Dalkurvan | älv |
| 7 | Hälleforsnäs | Södermanland | Gjutarvallen | Härdarna | gjuteri/järn |
| 8 | Lesjöfors | Värmland | **Kolbottnen** | Skogsklacken | kolmila/skog/bruk |
| 9 | Rögle | Skåne | Planlunden | Sydkurvan | tunt (lund/kust) |
| 10 | Slottsbron | Värmland | Forsvallen | Bropelarna | fors/bro |
| 11 | Skutskär | Uppland | Sulfatvallen | Fabrikskurvan | pappersbruk/sulfat |
| 12 | Heros | Dalarna | Hedvallen | Hjältarna | hjältar |

Rättelse mot texten ovan: Lesjöfors kodade arena är **Kolbottnen** (klack Skogsklacken), inte Stålvallen. Stålvallen är den VERKLIGA planen. "Lore och verklighet sammanfaller helt" håller på temat (järn/fjäder/fors) men inte på arenanamnet — spelet döpte om. Det är i sig en verklighet-mot-lore-not.

(Bonus ur templaten: easter egg — Erik Ström är alltid back i Forsbacka. Inte badge-relevant, noterat.)

### Trådände 2 — den befintliga klubb-bakgrundsfilen

Den ÄR `docs/KLUBBFAKTA.md`. Inte `klubbparmContent.ts` — det är en klubb-agnostisk regelbok (kapitlen Hörnor/Matchen/Orten/Klacken/Ekonomi/Slutspel i bruksortsröst, ingen per-klubb-info). KLUBBFAKTA.md har redan per klubb: verklig ort, verklig bandyklubb + årtal, industri, historia, hemmaplan, klimat, anekdotreservoar, "vad som aldrig sägs" — för alla 12. Dessutom **Bilaga D**, som redan mappar klubb → spelets arenanamn → klacknamn → verklig arena, verifierad mot worldGenerator (det arbetet är alltså redan gjort). Runtime-kompanjon: `src/domain/data/clubExtendedInfo.ts` (arenaNote/patronType/klimatArketyp/brief per klubb + spelande-vs-åkande-tradition, tunn). Badge-researchens 4-fältsrad hör hemma i KLUBBFAKTA — som ny sektion per klubb eller en Bilaga E — inte som ny fil.

### Scopen krymper

"Research KVAR: ~8 klubbar × (kommunvapen + klubb), eget pass" gäller inte längre. KLUBBFAKTA har redan ort- och klubbdelen för alla 12. Kvar för 4-fältsraderna:

1. Kommunvapnets huvudfigur för de 12 orternas kommuner: Gävle, Tierp, Fagersta, Kalix, Hultsfred, Gagnef, Flen, Filipstad, Ängelholm/(Höganäs), Grums, Älvkarleby, Smedjebacken. Riktad heraldiksökning, ~12 träffar — inte ett helt pass.
2. Verklighet-mot-lore-domen per klubb (Jacobs regel). KLUBBFAKTA ger råmaterialet. Skarpaste valen: **Målilla** — verklig sannaste symbol är 15 m-termometern på torget ("temperaturhuvudstaden") + Dackarna speedway + 13 bandy-SM; glas-loren är påhittad (Målilla ligger i Hultsfred, inte Glasriket — termometern slår glaset). **Rögle** — fiktiv bandyklubb döpt efter en hockeyort, ingen verklig bandysymbol att luta sig mot, lore/kust får bära. **Lesjöfors** — Stålvallen-vs-Kolbottnen enligt ovan.
3. Märkeskontraktet (Opus skriver, som PORTRAIT_REGISTER: valt motiv/klubb + basprompt + separationsregel, inom Codex ramar).

Ordningen i "Nästa pass" ovan står — men steg 1 och 2 är gjorda, och steg 3 är mindre än budgeterat.
