# MASTER_ÖPPET — den enda levande statuskällan för öppna poster

**Etablerad:** 2026-08-31. Ersätter BACKLOG.md och SLUTTEST_KO.md som "enda sanning" om vad som är öppet — de degraderas till changelog + parkerad-idé-katalog och pekar hit (se deras nya filhuvuden). Ingen annan fil får längre påstå att den är den kanoniska statuslistan.

## Regler för den här filen

**Tillstånds-maskinen (regel 8):** `rapporterad → verifierad → in_progress → klar` (eller `stale`, om posten visar sig redan vara löst/överspelad vid verifiering — se INVENTERING_2026-08-31.md:s "prövad och friad"-mönster för exempel).
- **Varenda post föds `rapporterad`.** Ingen post ärver `verifierad` för att en källa (BACKLOG, SLUTTEST_KO, en audit, en agent) påstod ett faktum om den. Det gäller även när tre olika källor råkar säga samma sak — konsensus mellan rapporter är inte verifiering.
- En post får inte flyttas till `in_progress` förrän den är `verifierad` — det betyder: kodläst mot arbetsträdet OCH mot `git log`, av en människa eller Code, med resultatet skrivet i posten.
- **Code kör bara mot `verifierad`-rader.** En `rapporterad`-rad är inte en arbetsorder.
- En post som verifieras och visar sig redan vara löst (som fyra av sju stickprov i INVENTERING_2026-08-31.md var) sätts till `stale` med en rad om vad som faktiskt hände, inte raderas tyst.

**`in_progress`-claim (2026-09-08) — kollisionsskyddets claimsteg i tillstånds-maskinen.** Filen delas av flera agenter samtidigt (Code, Codex) som kan plocka samma rad utan att veta om varandra. Regeln:
- **Innan arbetet påbörjas:** agenten sätter `status = in_progress`, befintligt `ägare`-fält till `<agent>` och inleder `nästa-åtgärd` med `CLAIM <ISO-8601-timestamp> — <agent>.` Den tidigare åtgärdstexten bevaras efter claimen. Agenten PUSHAR claimen som en EGEN commit — INNAN själva arbetet, inte efteråt. En claim som bara finns i arbetsträdet skyddar ingen.
- **Andra agenter hoppar `in_progress`-rader.** En rad med en aktiv claim är inte ledig, oavsett hur länge sedan agenten senast syntes.
- **Vid klar:** flytta till `MASTER_ARKIV.md` samma pass (befintlig regel ovan) — `in_progress` går aldrig direkt till `klar`/`stale` på plats, precis som ingen annan terminal status gör.
- **Vid avbrott/krasch:** en claim äldre än ETT PASS räknas som övergiven och får övertas av en annan agent (som då sätter en ny claim, samma protokoll).
- **Ingen claim = fritt fram.** En rad utan `in_progress` är öppen för vem som helst att plocka, som vanligt.

**Ägarfält:** Opus (design/text/omdömesfråga) · Code (implementation/verifiering) · Jacob (ett beslut bara han kan fatta).

**Detta är en RÅ SKÖRD, inte en färdig lista.** Extraherad ur `docs/INVENTERING_2026-08-31.md`, `docs/SLUTTEST_KO.md` och `docs/BACKLOG.md`:s öppna tabeller, var för sig, utan sinsemellan-deduplicering — tre källor beskriver ibland samma underliggande fakta (t.ex. `wageBudget`-buggen, H4-klippans rotorsak, flera `[Opus]`-textgap) som separata rader här. Att slå ihop dem kräver samma sannings-bedömning som verifieringspasset gör — att göra det nu, i skördepasset, hade varit precis den "ärvd verifierad"-genväg regel 8 förbjuder. Dubbletter är alltså EN FÖRVÄNTAD DEL av verifieringsarbetet, inte ett skördefel.

## AKTUELL STATUS — 2026-09-08 (MASTER-split)

**MASTER-split genomförd 2026-09-08 (Code, reconcile-fönster).** Filen bar tidigare alla ~653 poster oavsett status — varje session-start drog in 517 stängda/stale rader i kontexten för att komma åt 136 aktiva. De 517 (336 `klar` + 181 `stale`) är flyttade till `docs/MASTER_ARKIV.md`, kollapsade till id + status + commit-hash + källpekare, ingen fulltext. Fulltexten finns kvar i git-historiken och i respektive DOM-/RAPPORT-/RECON-fil — arkivraden är bara ett register, inte en andra sanning.

**24 poster kvar här, alla aktiva:** `rapporterad`/`verifierad`/`in_progress`. Ingen `klar`/`stale`-rad ska längre stå kvar i den här filen. **Räkneregel:** räkna bara faktiska datarader (aldrig tabellhuvuden eller avdelningsrubriker), och uppdatera detta tal i samma commit som en post läggs till eller flyttas till arkivet. Korrigerat 2026-09-08 från den tidigare siffran 130, som innehöll 29 upprepade tabellhuvuden; före arkiveringen av `pt2-liga-advance-otestad` fanns 101 verkliga poster. Ny råkontroll samma dag visade att rubriken därefter låg två över filens faktiska 97 rader; efter att tre uttryckligen parkerade O10-dubbletter flyttats ut är det verifierade antalet 94. `c-ft1-fitnessfloor-tuning` stängde därefter en punkt: 93; `kf3-beslutsbudget-playtest` nästa: 92; `kf4-styrelse-playtest` nästa: 91; `bygget-flik-tillbakapil` nästa: 90; `orten-pilar-playtest` nästa: 89; `ceremoni-heron-glanstitt` nästa: 88; `b6-buryfen-footer-logo` nästa: 87; `clubscreen-tab-emoji-konsekvens` nästa: 86; `inv-3-sprint22-14-delbd` nästa: 85; `b4-designdel-ej-gjord` nästa: 84; `sluttest-14-forbaseline` nästa: 83; `sluttest-o8-prosapooler` nästa: 82; `sluttest-o8-sommaren-typer` nästa: 81; `sluttest-missing-check-grind` nästa: 80; `c-sy1-portalhierarki` nästa: 79; `sluttest-missing-check-grind` återöppnad efter domkontroll: 80; två redan arkiverade valdomar felregistrerades kort som aktiva och avfördes efter kod-, test- och arkivkontroll: 82→80; `akademi-liggare-dom` flyttad: 79; råkontroll av faktiska datarader visade att rubriken redan låg en över listan, avstämt till 78. `akademi-ekonomirad` stängdes och det preliminära sidofyndet `erbjudanden-latt-fallback-felmarkt` registrerades i samma pass: netto fortsatt 78; `fornyelse-pris-slutdom` var redan uttryckligen dömd stängd i DOMLOGG och flyttades till arkivet: 77; `askadare-golvandel-generellt` var redan dömd 50 procent och passerade den formella kalibreringen: 76; full klubbklasskontroll falsifierade sidofyndet och flyttade det till arkivet som stale: 75; `inv-2-14d-illustration-nyar` och dess sista paraply `fable-scen-konst` stängdes tillsammans när den godkända nyårsbilden kopplades in och browsergranskades: 73; `flode-02-loop-andning` avfördes som explicit dubblett till den fortsatt aktiva `design-p1-tysta-ytor`: 72. Ny rapporterad post `atermatch-sparar-inte-minut` (återöppnad match sparar inte exakt minut): 73; `minne-avsked-motsager-historik` stängd efter licensradens wiring: 72; `sluttest-o8-turneringslage` stängd efter låst mitt-i-serien-text, tester och browserprov: 71; `atermatch-sparar-inte-minut` stängd efter durabel progressmarkör och riktigt reload-prov: 70; `lobbypress-mekanik-spec` stängd efter flavour-wiring i landslagsuppehållet: 69; `transfer-arsbok-minns-fel` stängd efter Del 2 (årsboksraden för missad värvning): 68; `stickiness-copy-roster` stängd efter B12-mönstrets kanoniska liggarpost, samtliga fem registerscenarier nu wirade: 67; `c-o1sp1-kontextuella-sponsorer` flyttad till post-launch efter grundad namnrymdsdom: 66; `rostintro-start-ko-speltest` godkänd i riktig mobilkarriär: 65; `b2-ej-byggd` reconcilad till stale — Opus egen körning visade att funktionen redan är levererad (`AnnandagsValEvent.tsx`, BACKLOG.md:539), inget re-spec eller kodpass krävdes: 64; `sluttest-audit-orsak-verkan` stängd efter styrelse-VARFÖR (SMAL fork, förlustsvit-fallback i boardPatienceZone.ts): 63; `spelarkort-oversikt-konformering` arkiverad efter Jacobs beslut att behålla den rikare översikten: 62; `cs-patron-sannolikhetsrullning` och `mecenat-patron-modellform` stängda i samma seedade säsongsrullningspass: 60; `mecenatrapport-tre-designfragor` reconcilad mot den senare domen och samma gröna pass: 59; `sluttest-incoming-arkivering` avförd som stale efter fil-, git- och arkivkontroll: 58; `sluttest-feedbackbutton-overlapp` stängd efter dockad sidfotsrad (GameShell.tsx), browserverifierad i riktig karriär: 57; `sluttest-o4-fordrojda-betyg` arkiverad — parkerad post-launch, dokumenterad i POST_LAUNCH.md: 56; `o10-queryparam-clubselection` stängd efter seed-i-länk (ClubSelectionScreen + newGame), låser upp grind 4: 55; `sluttest-utvisningar-kalibrering` stängd efter SUSPENSION_FREQUENCY_MOD 1.02→1.51 (3,77/match, D015 rättad): 54; `sluttest-grind1-heros-ekonomi` stängd — ommätt, upgraded+VIP-marginalen har vänt positiv (+15 214 kr/säsong) efter mecenat/patron-ombygget, ingen fix krävdes: 53; `communityevents-deferred-dedup` registrerad efter Grind 2–3:s långkarriär reproducerade samma köade val flera gånger och kodläsning bekräftade att `generateEvents` utelämnar `deferredDecisions` ur `alreadyQueued`: 54; stängd efter centralt köskydd och regressionstest: 53; `sluttest-b7-libero-slot` stängd — DOM_FORMATIONER_V2 löste slot-mappningen, Opus text-notens tröskel (≥4 insläppta) wirad som katalograd L i Matchens Samband: 52; `sluttest-o1-mecenat` stängd när hela O1-passet nådde 4/4: 51; `sluttest-audit-mer-innehall` avförd som en allmän riktning utan avgränsad leverans: 50; `forsoningskarta-saknas-i-repo` arkiverad efter fil- och historikkontroll: 49; fem Bandy Brain-data-/grafikspår flyttade ur spelets releasekö: 44; `inv-4b-o12-veckobeslut` stängd — O12 utvidgad till WeeklyDecision, `5692246d`: 43; fyra uttryckligen post-launch-parkerade rader flyttades till arkivet: 39; O10-ekosystemet och Apple-native flyttades till post-launch och den avslutade systemomspårningen arkiverades: 36; två O10-rader som redan täcks av den post-launch-parkerade ekosystemposten avfördes: 34; den uttryckligen parkerade shortlist-notisen flyttades till post-launch: 33. `sluttest-grind4` flyttades därefter till det post-launch-parkerade O10-ekosystemet eftersom seed-mottagaren är byggd men ingen verklig delningslänk produceras före release: 32. Ny rapporterad CI-post `ci-dedup-sasongsrullning` efter main-körning 34411307395: 33. `ci-dedup-sasongsrullning` stängdes efter gemensamt seedkontrakt och grön dubblettgrind: 32. `ci-visual-baselines-illustrationer-o12` stängdes efter granskad Linux-seed och helgrön app-ci 34414397905: 32. `statistik-telemetri-ror` registrerades efter Jacobs beslut att bygga statistik-röret i V1: 33. `supporter-konflikt-resolved-dedup` rapporterades från Grind 2/3 på aktuell main: 34. `turneringslage-avgjord-serie-nollnoll` rapporterades från avgörande kvartsfinal i Grind 2/3: 35. `turneringslage-avgjord-serie-nollnoll` stängd efter fixture-bunden läsning, regressionstester och browserprov: 34; `redesign-klubbminnet-omdesign` stängd — Klubbminnet byggt som protokollblock, `369b3c4e`: 33. `statistik-telemetri-ror` stängd efter separat V1-rör, opt-out och 90-dygnsgallring: 32. Separat återkontroll `analytics-dev-scen-sasongshistorik` registrerad från journalen: 33. `int-1-stora-bagarna` stängd efter mobil långbågegranskning och två avgränsade följdfynd registrerade: netto 34. `supporter-konflikt-resolved-dedup` och `analytics-dev-scen-sasongshistorik` stängda efter köreparation, telemetriskydd, 5 002 gröna tester och browserprov: 34→32. `m5-grindar-ej-i-ci` stängd (`9e3a8dd6`), en ny rad `taktik-autofyll-knappar-trafyta` registrerad som sidofynd (orelaterad kontrollstorleksregression): netto oförändrat 32. `sparningsbyte-konflikt-efter-reload` rapporterad från återöppning av Grindtest 2: 32→33. `b1-matchhall-omojligt-sasongsmal` stängd efter delat byggurval, falsk chevron borttagen, browser och 5 006 gröna tester: 33→32. `sparningsbyte-konflikt-efter-reload` stängd efter gemensam konflikthantering, migreringsregressioner, faktisk återöppning och 5 014 gröna tester: 32→31. `sluttest-a8-viktning` + `ci-en-primary-taktik-hierarki` stängda tillsammans (`2f3540ab`) — DOM_TAKTIKTAVLA_PRIMARHIERARKI_2026-09-10 löste den enda kvarvarande delen (primär-hierarkin); viktning/uppställning var redan klara: 31→29. `tranarmarknad-ny-klubb-andra-aret` stängd när den låsta övertaganderaden kopplades till liggare + klubbperioder och N-mötet browsergranskades: 29→28. `taktik-autofyll-knappar-trafyta` stängd efter 44px-fix och riktig 390×844-verifiering: 28→27. Ny rapporterad Grind 2-post `mecenat-silentshout-aterfall`: 27→28. `decisioncards-likriktning` stängd efter två-register-wiring och mobilgranskning: 28→27. `mecenat-silentshout-aterfall` stängd efter en producent, stabil variantidentitet, legacy-dedupe och sann state-underrad: 27→26. `design-p4-brytpunkt-knappar` konsoliderad mot den nu byggda beslutskortsdomen: 26→25. Ny rapporterad speltestpost `granska-scrollindikator-osynlig`: 25→26; stängd efter synlig, klickbar 44 px-pil, browserprov och grön build: 26→25. Ny rapporterad vy-svepspost `portal-scrollindikator-saknas`: 25→26. Efter en parallell arkivering stod räknaren åter på 25; Jacobs beslut att även utrusta årsbok, finalstartelvor och lönekrav registrerades som `scrollindikator-ceremoni-och-krav`: 25→26. `portal-scrollindikator-saknas` och `scrollindikator-ceremoni-och-krav` stängda i samma gemensamma overflowpass: 26→24.

**Stående regel (2026-09-08):** att stänga en rad = FLYTTA den till `MASTER_ARKIV.md`, aldrig bara stämpla om den `klar`/`stale` på plats. En rad som blir terminal och inte flyttas samma pass är en läckt regel, inte en genväg.

`docs/MASTER_ARKIV.md` läses ALDRIG rutinmässigt vid sessionsstart — bara vid explicit behov av historik (Jacob frågar "var det redan löst?", en gammal dom behöver återfinnas). Auto-load-pekaren (CLAUDE.md, sessionsstart-checklistan) pekar på DEN HÄR filen, inte arkivet.

## HISTORISK RÅSKÖRD

**474 ursprungligen skördade rader.** (58 ur INVENTERING_2026-08-31.md + 185 ur BACKLOG.md + 231 ur SLUTTEST_KO.md.) Antalet är den historiska råskördens utdata, inte dagens totala kö och inte ett mål — se Jacobs egen instruktion om varför.

Redan kända, inte separat skördade här (löstes eller stängdes SAMMA DAG av Code, före detta skördepass, med commits): FormationView.tsx:s tredje golv-blinda "Fyll bästa elvan" (`ea63b02c`), fyra räddade textpooler i `hallProvningData.ts`, två DOM-supersede-markeringar, två BACKLOG-headerkorrigeringar (203-filer-risken, TEXT-AUDITEN). De är `klar`, inte `rapporterad` — de hör inte hemma i en öppen-lista.

---

## Fynd EFTER skörden — Jacobs egen verifiering, kör genom hela tillstånds-maskinen

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| high6-retirement-golvalder-fitnessensam | Finare punkt Jacob noterade men INTE auditens critical: även med golvet kan en spelare EXAKT på golvåldern (ageScore=0) bli kandidat av fitness/skador ensamt — t.ex. en 29-årig forward som bara är trött denna säsong. Balansnyans, inte en bugg. | verifierad | Jacob | Jacobs egen anteckning i körordern 2026-08-31 (medveten, ej rapporterad som fel) | Jacob avgör om det känns fel i spel — om ja, nästa steg är sannolikt ett separat, mildare golv för "endast fitness/skador utan någon ålderspoäng alls", inte en ändring av RETIREMENT_AGE_MARGIN (som redan är avsiktligt löst). [Verifierat 2026-09-01 (Code): Ren designfråga från Jacobs egen körorder 2026-08-31, ingen kodfakta att slå fast — bedömningsfråga, inte buggstatus.] |

Andra exemplet på tillstånds-maskinens fulla cykel, samma mönster som raden ovan. Två av auditens tre criticals nu `klar` (attribution + pensionsgolv). Kvar: framgångskurve-domen (väg C:s −45 tkr mot 1,7 mkr) — Jacobs egen, kräver hans spelbevis-beslut innan Code kan bygga mot den.

## Checkpoint 2026-09-01 — Codex +100-rundan mot `55b2aa9d`

**Checkpointstatus (historisk, nu stängd):** checkpointen landade i `c1588c02`; de efterföljande kontrollgolvs- och browsergrindsdelarna landade i `4dbc2cba`/`bd109109`. Full Vitest var grön (**346 filer / 3611 tester**), produktionsbygget liksom TypeScript-, design- och innehållsgrindarna var gröna. Den dåvarande visuella snapshot-sviten kördes inte; dagens separata baselineskuld spåras i `ci-visuella-baselines-rod`.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/INVENTERING_2026-08-31.md (58 rader)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| inv-4-o12-forhandsdelta | O12 "förhandsdelta" (DOM_DOMINANS_OCH_FORHANDSDELTAN) skriven men aldrig byggd | verifierad | Code | INVENTERING_2026-08-31.md:103 + SLUTTEST_KO.md:1060 | §1 KLAR `06336d37`: instanssann telemetri, kvittenser exkluderas och flerstegskedjor bevaras. §2 KLAR `b5e6dfad`: `subtitle` är kvalitativ förhandstext enligt låst dom `DOM_O12_FORHANDSTEXT_KONTRAKT_2026-09-09.md`; exakta pengar är kvar, faktisk clampad icke-penga-diff sparas strukturerat i `ResolvedChoice.outcomeDeltas` och visas först efter valet i Granska. Dolda development/discipline-motvikter läcker inte. Ny statisk bygggrind stoppar regression utan runtime-sanering. Bygge grönt; riktat 111/111; helsvit 541/4 936. Browserbelägg och full redovisning: `RAPPORT_O12_VALENTROPI_BROWSER_2026-09-09.md`. Återstår deployprov och naturlig population innan 80 %-grinden kan dömas; ett medvetet varierat tre-save-prov bevisar bara rören. D1:s ambientväg och O5 finns redan. Dedup 2026-09-03: konsoliderar `sluttest-o12-forhandsdeltan`. **→ §3 KLAR `5692246d` (2026-09-09, Code/Codex): veckobesluten använder nu ett separat kvalitativt `preview` före valet och ett strukturerat, clampat före/efter-kvitto efter resolution; O12-grinden täcker hela `WeeklyDecision`-katalogen. Sju nya regressionstester och full svit gröna. Browserverifiering av den ursprungliga `corner_extra_training`-läckan finns i `RAPPORT_O12_VECKOBESLUT_BROWSER_2026-09-09.md`; skivan är arkiverad som `inv-4b-o12-veckobeslut`. Den här raden förblir öppen enbart för deployprov och naturlig population till 80 %-grinden.** |
| inv-5-designko-d4-portal-orientering | D4 Portal-orienteringen/första-gången-rampen (onboarding) — enda öppna punkten i DESIGN-KO-2026-07-02.md, brief skriven, väntar Design | verifierad | Opus/Design | INVENTERING_2026-08-31.md:114 + BACKLOG.md:695 | Opus mockar, Code bygger [Verifierat 2026-09-01 (Code): design-system/briefs/DESIGN-KO-2026-07-02.md punkt 6 D4 står kvar ostruken, ingen mock levererad; ingen onboarding-/rampskärm hittad i src/presentation, design-system/HANDOFF.md nämner ingen leverans.] Dedup 2026-09-03: konsoliderar `d4-portalorientering` (samma punkt). |
| inv-5-fas4-klubbmarken | FAS 4 (12 klubbmärken) bara 3/12 klara | verifierad | Jacob | INVENTERING_2026-08-31.md:114 | Opus/Design fortsätter produktion, Code wirar [Verifierat 2026-09-01 (Code): design-system/assets/clubs/ innehåller exakt 3 av 12 klubbar, oförändrat sedan 08ce3c4f.] Ägare Opus→Jacob 2026-09-04: assetproduktion är Jacobs (Gemini/Nano), inte Opus-text. Kan köras i samma pass som ortbilderna — samma stilsträng, ett märke per ort. **→ 2026-09-08 (Jacob): KÖ EFTER PORTRÄTTEN.** Producera de nio kvar i porträtt-passets Gemini-pipeline, ett märke per ort. Ägare Jacob (asset) + Code (wiring). |
| inv-5-fas5-portrattgenerator | Spelarporträtt: SVG-porträtten som visas ser fel ut ("aliens"); de riktiga PNG-porträtten är inte inkopplade | verifierad | Opus/Jacob | INVENTERING_2026-08-31.md:114 | CLAIM 2026-09-09T23:58:02+0200 — Codex. **RÄTTAD 2026-09-07 (Jacobs korrigering — Opus drog "fungerar" av att filer FANNS, utan att veta vad spelaren SER).** LÄGET: `portraitService.getPortraitSvg` → `svgPortraitService.generatePlayerPortrait` är det som RENDERAS, och de genererade SVG-ansiktena ser fel ut (utomjordingar). De 32 PNG-porträtten (`public/assets/portraits/portrait_{tier}_{1..8}.png`) FINNS men är INTE inkopplade i UI:t — `getPortraitImagePath` pekar på dem men något renderar SVG-vägen i stället. Bra porträtt gjordes tidigare, passade inte layouten, las på vänt. **ARBETSPASS Opus+Jacob (bild, Gemini-spåret), INTE en generator att bygga:** (1) verifiera exakt vilken väg UI:t renderar och varför SVG vinner över PNG; (2) lös layout-kravet som stoppade PNG-porträtten; (3) generera porträtt via Gemini som passar layouten. Bygg ingen generator — det är assets + wiring. Inte "fungerar", ett öppet bild-pass. **→ GO 2026-09-09 (Jacob: 'det är vårt nästa'): por* passet körs härnäst — bild + wiring, INTE en generator. Stilen och registret är låsta (PORTRAIT_REGISTER, denna session). Opus+Jacob: (1) verifiera varför SVG-vägen vinner över PNG, (2) lös layout-kravet som stoppade PNG, (3) generera de som passar via Gemini. Release-kvalitetsbugg (spelaren ser 'aliens'), prioriterad före release.** **→ TESTWIRING-ORDER 2026-09-09 (Opus → Codex, Jacob kör de första 16 veteranporträtten): (1) Jacob namnger varje fil med sitt REGISTERNUMMER (1, 2, 4–16; 3 saknas — väntat) och kopierar till `docs/incoming/`. Codex flyttar till `public/assets/portraits/portrait_vet_{n}.png`, n = filnamnets nummer. Ingen ordnings-gissning — namnet bär numret. (2) FIXA SVG→PNG-BUGGEN: UI:t kallar `getPortraitSvg` (utomjordingarna) på renderingsytan — hitta anropet, byt till `getPortraitImagePath` (PNG). (3) TIER-MEDVETET: bara veteranfacket har PNG:er nu; ung/mid/erfaren saknar filer, så flippen MÅSTE falla tillbaka till SVG (eller neutral platshållare) för de facken — ALDRIG en bruten bildlänk. (4) `getPortraitImagePath` väljer ur den FAKTISKA uppsättningen filer per tier (inte hårdkodat `% 8` mot en delvis fylld fack) så inget index pekar på saknad fil (t.ex. vet_3); robust när antalet växer 8→15→30. Deterministiskt per spelare, som nu. (5) TESTNOTIS: veteranfacket är TOMT vid spelstart (spelare åldras in förbi 31) — verifiera med en save som har 32+-spelare, eller åldra några för testet. Bekräfta: 32+-spelare visar sin PNG, samma varje gång; yngre spelare får INGEN bruten länk. Ägare Codex.** **→ TESTWIRING KLAR 2026-09-10 (Codex):** `PlayerPortrait` är nu enda renderingsgräns på Spelarkort, Trupp, Omklädningsrum och Granska. `getPortraitImagePath` väljer deterministiskt bara ur den faktiska veterankatalogen 1, 2, 4–16; #3 kan inte väljas. Ung/mid/erfaren faller tillbaka till befintlig SVG tills deras egna fack är kompletta. Femton produktassets är 400×400/2,5 MB. Browser 390 px: 34-åring → laddad `portrait_vet_10.png`; truppvy: 33-åring → laddad `portrait_vet_14.png` (naturalWidth 400) samtidigt som yngre spelare gav exakt en SVG-fallback. 3/3 fokustester, TypeScript och full build med fem grindar gröna. KVAR innan hela raden kan stängas: assetproduktion för ung/mid/erfaren samt visuell ersättning av den byte-identiska 5/6-dubbletten. Claim återlämnad till Opus/Jacob. |

---

# KÄLLA: docs/BACKLOG.md (185 rader)

*(Harvested av en dedikerad agent, 2026-08-31, mot BACKLOG.md:s sektioner A–E + "BYGGT MEN OSYNLIGT" + "TVÅ LÄSARE, EN SANNING" + "DATAFÄLT SOM SAKNAS" + relevanta playtest-/KF-rader. Sektion F, CHANGELOG, "PRÖVAT OCH AVFÄRDAT", och alla ~~genomstrukna~~/STÄNGD/KLAR-rader uteslutna som redan stängda.)*

## Toppnoter

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## H4 Heros

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## BYGGT MEN OSYNLIGT / ONÅBART

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## TVÅ LÄSARE, EN SANNING + fältfamiljer

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## DATAFÄLT SOM SAKNAS + påståendekartan

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## PLAYTEST-RUNDA 2026-07-10

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| pt6-nedslackning-timing | Nedsläckning av matchhändelser går för långsamt i live-flödet | verifierad | Design | BACKLOG.md:300 | verifiera mot kod (timing-just) [Verifierat 2026-09-01 (Code): BACKLOG.md rad ~300 (PT-6) listar posten fortfarande öppen ("design/Code", ej STÄNGT), samma beskrivning om långsam nedsläckning.] |

## A. AKTIVA SPRINTAR

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| forsoning-5-omfotografering | §5 verifiering: Jacob fotar om, Design re-auditar (grön/kvarstår) | verifierad | Jacob | BACKLOG.md:357 | Jacob fotar om [Verifierat 2026-09-01 (Code): docs/BACKLOG.md rad 349-357 listar FÖRSONINGSSPRINTEN fortfarande som "AKTIV" med §5 verifiering ostängd (ingen "STÄNGD"-markering hittades någonstans i repo för §5) — Jacobs ompaus-uppgift är en judgment call utan kodbevis på slutförande.] |
| valet-ui-eriks-oga | Valet-UI väntar på Eriks öga (playtest-nivå residual) | verifierad | Jacob | BACKLOG.md:403 | playtest [Verifierat 2026-09-01 (Code): docs/BACKLOG.md:403 listar explicit "Valet-UI väntar Eriks öga" som öppen residual, ej stängd.] |

## B. SPECCAT KLART, VÄNTAR BYGGE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## C. IDÉER UTAN SPEC

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| c-sp5-smfinal-skarv | SM-final-uppspelets skarv: svart panel på grå bakgrund ger hårt skarvband | verifierad | Design | BACKLOG.md:599 | verifiera mot kod [Verifierat 2026-09-01 (Code): MASTER_OPPET.md:305 bekräftar explicit att BACKLOG:599s C-SP5 (uppspelets skarv) är "ANNAN, fortfarande öppen sak" skild från den redan levererade crossfade-fixen (`0e39f24`).] |
| c-v1-opponentform-tomt | OpponentForm-kortet känns tomt/ihoppressat | verifierad | Design | BACKLOG.md:608 | verifiera mot kod [Verifierat 2026-09-01 (Code): src/presentation/components/portal/secondary/OpponentFormSecondary.tsx:33-51 renderar ett kompakt kort (padding 8px 10px, bara etikett + 5 ScoreBlocks) — visuell polish-fråga, olöst, BACKLOG.md:608 säger "tas när bugglistan är tom".] **→ 2026-09-09 (Jacob: 'detta ska genomföras, du dömer hur'): pre-release Design-polish-kö, Opus-ordning, körs EFTER de fyra aktiva brieferna (klubbminnet, taktik, beslutskort, m5). Ordning: (1) `pt6-nedslackning-timing` [matchflöde, syns varje match], (2) `c-sy1-portalhierarki` [struktur], (3) `c-v1-opponentform-tomt` [ofta sett], (4) `c-t11-nudges-pa-portalen`, (5) `c-sp5-smfinal-skarv` [sällsynt, rent kosmetisk, sist]. Inget parkeras — alla genomförs, i den ordningen, när Design har utrymme. Ägare Design.** |
| c-sy1-pilot1-playtest | C-SY1 Pilot 1 väntar playtest före skalning till fler pools | verifierad | Jacob | BACKLOG.md:625 | Jacob playtestar [Verifierat 2026-09-01 (Code): BACKLOG.md:625 upprepar "Pilot 1 väntar playtest före skalning till fler pools" utan någon efterföljande playtest-bekräftelse i BACKLOG/HANDOVER-filerna.] |
| c-t11-nudges-pa-portalen | Transfer-nudges bor i transfers-fliken, inte på portalen där spelaren lever | verifierad | Design | BACKLOG.md:639 | verifiera mot kod [Verifierat 2026-09-01 (Code): ingen "TransferNudge"/nudge-komponent hittad i src/presentation/components/portal — nudges finns bara implicit i TransfersScreen.tsx, ej flyttade till portalen, BACKLOG.md:639 oförändrad.] |

## KF. SYSTEMKARTANS FYND

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| kf8-fanmood-kalibrering | KF8 fanMood byggd; kvar är kalibrering mot nästa genomspelning (06-18-spec §B punkt 3) | verifierad | Jacob | BACKLOG.md:672 | Jacob genomspelar [Verifierat 2026-09-01 (Code): BACKLOG.md:672 säger fortfarande "Kvar enbart kalibrering mot NÄSTA genomspelning (06-18-spec §B punkt 3)" — ingen senare post bekräftar att den kalibreringsomgången genomförts.] **→ 2026-09-09 (Jacob): INGET dedikerat kalibreringspass. Codex vaktar fanMood i den pågående grind-2/3-långkarriären (`sluttest-grind2`/`grind3`) och rapporterar OM den läser fel; kalibrera bara då. En kalibrering utan känt problem är att gissa på en siffra. Skrivs in här så det inte glöms i testet.** |

## KF2. ÖVERLÄMNING 2 — TRE ÅTERSTÅENDE POSTER (2026-09-03 incoming-svep)

`docs/sprints/OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md` inventerade 16 poster ur `docs/incoming/Överlämning 2/` (nu arkiverad, `_arkiv-2026-09/`). Omverifierat mot kod 2026-09-03: fyra av de sju då-öppna posterna är sedan dess byggda/stängda (entity-dedup-taggning på `PortalBeat.tsx`, D1 trait-emoji, Portal-orientering punkt 1, transfer-bid-ripplens konsument — retirerad, inte byggd, se `orsakVerkanService.ts`). Tre kvarstår genuint.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## D. PARKERADE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## E. TEKNISK SKULD

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/SLUTTEST_KO.md (231 rader)

*(Harvested av en dedikerad agent, 2026-08-31, ur hela filen — 1272 rader, lästa i 30 sekventiella chunkar. Fyra rader nedan är interna statusmotsägelser i källdokumentet självt — samma sak påstås både klar och öppen på olika ställen; skördade som öppna eftersom ingen post ärver `verifierad` av att en rapport påstod det.)*

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| sluttest-missing-check-grind | Skiva 4 `eventFactories.ts` är grön; nästa skiva `eventResolver.ts` kräver en ny namngiven Opus-dom. | verifierad | Opus | SLUTTEST_KO.md:231,265 + DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08.md | CLAIM 2026-09-08T23:22:16+02:00 — Codex. Jacob gav uttryckligt klartecken 2026-09-08 att köra vidare med nästa skiva; passet är strikt avgränsat till `postAdvanceEvents.ts` och stannar före nästa fil. Tidigare claim/historik: CLAIM 2026-09-08T15:14:25+02:00 — Code, skiva 2 hall ratificerad i DOM_PASTAENDE_SKIVA2_HALLPROCESS_2026-09-08.md. PILOT KLAR `01f7d3bd`: alla 8 patron-event använder state-predicate; 0 ledger, 0 timeless, inget faktiskt patronpåstående föll utanför formerna. Omverifierat 2026-09-08: 47/47 patron-/kontraktstester, TypeScript och full build med fyra lintgrindar gröna. **STOPP enligt domen:** Code rör inte nästa skiva före ny namngiven dom. Hall/postAdvance/eventFactories/eventResolver/press hann felaktigt implementeras och pushas i `96aa74f6`/`f9527653`/`6987cac4`/`f04ef583`/`d3724e63`; de lämnas orörda i väntan på uttrycklig dom om ratificering eller revert. **SKIVA 2 HALL GRÖN 2026-09-08:** efter ratificering i `DOM_PASTAENDE_SKIVA2_HALLPROCESS_2026-09-08.md` granskades alla 11 konstruktioner mot den bevisade formen. Samtliga använder samma namngivna boolean i genereringsguard och `evaluatedTrue`: 11 state-predicate, 0 ledger, 0 timeless. Ledger är korrekt noll eftersom hallens historikpost skrivs först efter resolution; genereringspåståendena gäller levande FSM-state. Ingen kodändring behövdes. 41/41 fokusprov, TypeScript, full build och fyra lintgrindar gröna; browser 390 px visade FÖRANKRING och stöd 56/100. **SKIVA 3 POSTADVANCE GRÖN 2026-09-08 (Codex):** alla 6 direkta GameEvent-konstruktioner granskade: 6 state-predicate, 0 ledger, 0 timeless; samtliga faktiska genereringspåståenden ryms i kontraktets tre former. Ett verkligt sanningsfel hittades: konfliktbudet kunde påstå högre sponsorersättning utan beloppsjämförelse; den obelagda jämförelsen är struken och ett lägre-bud-regressionstest låser sanningen. Grinden kräver nu också `evaluatedTrue` för state-predicate och `ledgerType` för ledger, inte bara ett giltigt formnamn. Båda motbudsgrenarna har runtime-prov. 54/54 fokustester, 536/536 testfiler och 4888/4888 tester, TypeScript, full build och fyra lintgrindar gröna. **SKIVA 4 EVENTFACTORIES GRÖN 2026-09-10 (Codex):** exakt 17 fabriker granskade: 17 state-predicate, 0 ledger, 0 timeless; ingen fjärde form behövs. `jobbet_forsvann` jämför nu jobbgarantin med exakt avgående sponsor-/patron-id i stället för valfritt id. `newBids`- och budkrigsgaterna bevisar hela sina faktiska villkor. 59 fokusprov + slutlig 48-testers regressionssvit, 553/553 testfiler och 5023/5023 tester, TypeScript, full build och fem grindar gröna. Rapport: `docs/playtest/PASTAENDE_SKIVA4_EVENTFACTORIES_2026-09-10.md`. **STOPP:** nästa skiva är `eventResolver.ts` och kräver en ny namngiven auktorisering/dom. Antal öppna oförändrat 28. |
| sluttest-412-bildsnapshot | 4.12: bildsnapshots för delningsbilden byggdes INTE — öppen punkt om visuell verifiering önskas | verifierad | Jacob | SLUTTEST_KO.md:619 | vänta Jacobs beslut [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:619 bekräftar bildsnapshots byggdes INTE.] |
| sluttest-grind2 | Grind 2 (andra akten: ekonomiskt val år åtta, ingen upprepad pivotal scen, färdigt anläggningsträd) ej dokumenterad som passerad | in_progress | Codex | SLUTTEST_KO.md:376 + TESTINSTRUKTION_GRIND_234_2026-09-08.md | CLAIM 2026-09-09T08:21:53+02:00 — Codex. Kör samma riktiga minst åtta säsonger långa karriär som Grind 3 och dokumentera konkreta ekonomiska val, pivotal repetition och anläggningsträd i `docs/playtest/`; Opus domar resultatet efter leverans.  **Checkpoint 2026-09-10:** huvudkarriären är vid säsong 5:s semifinal. År-8-val och färdigt anläggningsträd återstår; nästa åtgärd är att återuppta samma save, inte starta en ny karriär. Köreparationen spåras separat som `supporter-konflikt-resolved-dedup`. |
| sluttest-grind3 | Grind 3 (rytmen: primär handling, nästa olösta fråga, en landning per säsong) ej dokumenterad som passerad | in_progress | Codex | SLUTTEST_KO.md:378 + TESTINSTRUKTION_GRIND_234_2026-09-08.md | CLAIM 2026-09-09T08:21:53+02:00 — Codex. Samma långkarriär som Grind 2; för varje säsong dokumenteras primär handling, nästa olösta fråga och landningen i `docs/playtest/`. Grind 4 lämnas blockerad på O10.  **Checkpoint 2026-09-10:** journalförd fram till säsong 5:s semifinal; omgång 13–22 snabbspolades med spelets knapp och räknas inte som manuellt observerade beslut. Säsong 5:s landning och säsong 6–8 återstår före Opus-dom. |
| sluttest-regressionsvit-22-24 | Skutskär-sviten punkt 22–24: kvalitativa/manuella grindar, ej automatiserbara, ej körda | verifierad | Jacob | SLUTTEST_KO.md:356 | vänta Jacobs manuella körning [Verifierat 2026-09-01 (Code): Punkterna är kvalitativa/manuella grindar (Jacobs egen körning), ingen sådan körning eller rapport hittad i docs/.] |
| sluttest-validering-journal | Valideringsexperiment: följ-en-karriär-journalen — ej kört | verifierad | Jacob | SLUTTEST_KO.md:1268 | vänta Jacobs körning [Verifierat 2026-09-01 (Code): Samma rad (SLUTTEST_KO.md:1270), ingen spårbar körning.] DOM 2026-09-03 (Jacob): KÖRS NU — GPT:s 10-säsongskörning (på säsong 8 vid domen) är experimentet; GPT skriver den som journal enligt `docs/TESTINSTRUKTION_KARRIARJOURNAL_2026-09-03.md` (Opus). Resultat: en journalfil i docs/playtest/, sedan klar. **STATUSKONTROLL 2026-09-07:** ingen journalfil finns i `docs/playtest/` eller övriga `docs`; den historiska ”KÖRS NU”-reservationen saknar leverans och återgår därför till `verifierad`. |
| sluttest-kvalitativ-uppfoljning | Kvalitativ uppföljning med 6–8 riktiga spelare (paus efter omg 3, 11, 22, fem frågor) — ej genomförd | verifierad | Jacob | SLUTTEST_KO.md:1270 | vänta Jacobs genomförande [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:1272 "MEDVETET UTANFÖR DEN HÄR FILEN", ingen fil med spelarsvar hittad.] |

---

## Metodnoteringar för verifieringspasset

- **Förväntade dubbletter mellan källorna** (icke uttömmande — verifieringspasset avgör och slår ihop): `wageBudget`-buggen (backlog: `wagebudget-aldrig-omraknad`, sluttest: `sluttest-wagebudget-omrakning`); `Club.fanExpectation` (backlog: `fanexpectation-dott-falt`, sluttest: `sluttest-fanexpectation-dott`); H4-klippans rotorsak (inv: `inv-2-9-aterkopplingsslingan`, backlog: `h4-klippan-rotorsak-okand`, sluttest: `sluttest-klippan-rotorsak`); `careerBreakText`/O13 (backlog: `careerbreak-text`, sluttest: `sluttest-am8-avsked-karriar` + `sluttest-o13-jobbmarknad`) — OBS denna sista är särskilt viktig: INVENTERING_2026-08-31.md:s egen stickprovsverifiering visade att `careerBreakText.ts` FAKTISKT ÄR FÄRDIGSKRIVEN nu (Jacobs egna edits landade under skördesessionen) — dessa rader är extremt sannolikt `stale` vid verifiering, inte `rapporterad`→`bygger`; B12:s konsumentlöshet (backlog: fyra `b12-*-utan-konsument`-rader, sluttest: `sluttest-b12-konsument-b5/b4/o16`, sluttest: `sluttest-b5-referat-vokabular`); O1-kandidaterna (sluttest: fyra `sluttest-o1-*`-rader, motsvarar delvis samma spår som redan känd "fyra kvar" i SLUTTEST_KO).
- **Fyra interna statusmotsägelser** i SLUTTEST_KO.md självt (samma sak KLAR på ett ställe, EJ på ett annat): `sluttest-tio-scener-registrering`, `sluttest-a2-tacticboardcard`, `sluttest-64-statusmotsagelse`, `sluttest-am9-finaluppladdning`.
- **De 32 `sluttest-onadd-*`-raderna** kommer ur SLUTTEST_KO.md:s "Skydd eller illusion?"-lista (55 granskade ytor, 35 helt onåbara i `/dev/scenes`). `MatchLiveScreen`, `FacilityScreen`, `GameOverScreen` uteslutna — dokumentet rättar dem själv som registrerade.

---

# KÄLLA: `Designgranskning Bandy Manager.dc.html` (Claude Design, 2026-09-03 — 111 states ur dev-scen-dumpen)

**Läs detta först.** Granskningen är gjord på `/dev/scenes`-dumpen, inte på spelet. Fixturerna är deterministiska och delvis handskrivna — en del av det som ser ut som produktfel kan vara fixtur-artefakter (samma `narrativeSummary` i tre säsongsscener säger inget om narrativmotorn om fixturen aldrig varierade den). Alla rader föds `rapporterad`; Code verifierar mot working tree och avgör PRODUKT eller FIXTUR före något bygge. Fixtur-fynd rättas i fixturen (så dumpen blir sann) och stängs som stale mot produkten. Opus triage per rad står i nästa-åtgärd. Granskningens egen ordning: läckor → Portal-krocken → berättelse↔utfall → tre standardiseringar → tysta ytor.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| design-p1-tysta-ytor | Kafferum (085), cupintro (088), hallprövning (084), styrelsens ultimatum (099), mecenatmiddag (097): citat + knapp i stort svart fält läser som tomt, inte stilla | verifierad | Design + Code | Designgranskning 2026-09-03 P1 | 2026-09-09: kafferum, mecenatmiddag och styrelsens skarpaste ultimatum har nu egna godkända illustrationer på sina befintliga ytor; inga vardagslägen eller mildare styrelsezoner överillustreras. Samtliga tre browsergranskade på 390 px. Kvar i samlingsraden: cupintro och hallprövningens övriga stora tomytor. |

---

# KÄLLA: Playtest Taktik + laguttagning (GPT, 2026-09-03 — Målilla MEDEL, 35 matcher, live-build 74c9fe5)

**Sammanfattning av rapporten:** "Matchkärnan kan vara rolig, men spelet lär mig inte tillräckligt väl varför den är rolig." Cup och slutspel roliga; serien blev upprepning av ett offensivt paket. Codex funktionella svep (d7303c82, EJ PUSHAT) tog fem saker direkt — se raden nedan. Resten är dömande och kalibrering. Opus läsning: tre av fynden är ETT fynd (B12 saknar konsument, se `sluttest-b12-konsument-b5` ovan), och ett fynd är formationsaxelns öppna fråga som nu syns i spel.

**Separat verifierad mätrapport för C2:** [Kalibrering av 5-2-3:s konditionskostnad](matningar/C2_523_KONDITIONSKOSTNAD_2026-09-07.md). Rapporten skiljer uttryckligen den bevarade resultatsammanställningen från den råa JSON-utskrift som inte sparades.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `Flödet - känsla och rytm.dc.html` + `Redesign - resultatet & klubbminnet.dc.html` (Claude Design, 2026-09-03, docs/incoming/)

**Flödesgranskningens tes:** "Flödet håller. Det som saknas är att säsongen minns vad som hände dig." Fyra resor lästa ur 111 states: Ankomsten (starkast, men klubbpärmen bromsar), Veckans hjärtslag (Granska tonlös, loopen andas inte), Säsongens svällning (bågen finns i struktur, inte i ord), Sluten (levererar; triumfen saknar årtal). **Opus läsning:** tesen är exakt vad händelseliggaren byggdes för, och hälften av dragen är redan rader (d1, d2, d3, p1). Redesignens två skärmar: skärm 01 är mocken till d1 (inskriven där); skärm 02 "Klubbminnet" är en OMDESIGN av en befintlig yta, inte en ny — se raden. Designs två frågor besvaras i `redesign-klubbminnet-omdesign` (nu arkiverad, klar — MASTER_ARKIV.md).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md` (Opus, tung körning 2026-09-03 — vilka liggartyper når spelaren, i vilket steg)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Transfer, kontrakt och truppbygge (GPT, 2026-09-04 — Heros SVÅR, två säsonger, 390×844, live 7dd33ca/f01f9275)

**Rapportens dom:** "En intressant spelarlista med ofärdiga affärsflöden" — behovet går att läsa, scouting lovande, men budkedjan tappade kontinuitet, fria agenter kringgick förhandlingen, kontraktsgolvet visades exakt, budgeten räknades för tidigt. **Codex fixade fem av sju samma natt (9bbe3cb9, lokal, EJ PUSHAD)** — se första raden. Kvar: tre verifieringar av att fixen täcker hela fyndet, en designfråga, och två liggarfynd som redan bor i konsumentkartan (k9, k12). Notering för kalibreringsrundan: GPT spelade Heros SVÅR två säsonger utan avsked — EN datapunkt, inte statistik, men den första riktiga karriären i rundans underlag.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Minne, berättelser och stickiness (GPT, 2026-09-04 — SLUTPROVET för liggaren; Hälleforsnäs 2 säsonger → sparkad → år utan klubb → Slottsbron 1,3 säsonger; 390×844; a948959 → d03d9a68)

**GPT:s dom:** "Spelet har nu ett minne, men ännu ingen helt pålitlig berättare." Burnout-återfallet är det tydligaste beviset på att liggaren fungerar; året utan klubb är "en av spelets bästa fleråriga mekanismer"; GPT kunde berätta sin karriär utan tabeller. Men: minnen läckte mellan klubbar, avslutade beats återkom, årsboken valde mätbar systempåverkan före relationer, och "flera av de bästa sambanden skapades i mitt huvud genom att jag kände igen personer, inte genom att spelet knöt ihop dem." **Codex åtgärdade rotorsakerna samma förmiddag (ej committat, se `karriarbyte-managed-club-switch`).** Det som återstår är BERÄTTARNIVÅN — urval, avgränsning, redaktionell sammanfogning — och den är konsumentkartans andra halva. Sex rekommendationer från GPT: fyra är redan rader (k1 urval/significance, k8 Portal, k11 press, k12 callbacks), två är nya (beats-idempotens/avslut, en kronologi).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `RAPPORT_STICKINESS_NOTIFIERINGAR_PWA_2026-09-04.md` (GPT, beslutad riktning) + `IMPLEMENTATION_STICKINESS_NOTIFIERINGAR_2026-09-04.md` (Codex, Etapp 1A)

**Vad det är:** PWA + Web Push + en Attention Engine som härleder "open loops" ur game state och väljer det mest sanna, relevanta att säga när spelet är stängt. Icke-mål: ingen streak, ingen bonus, ingen påhittad simulering, ingen generativ copy utan källstate, ingen omedelbar permission-prompt, ingen Apple-native i fas 1. **Opus läsning:** rapporten är i linje med allt spelet står för — textsanning, liggaren som källa, redaktören som urval. Etapp 1A är tekniskt grundad och avgränsad rätt. Det som inte står någonstans: att Attention Engine är en SJÄTTE redaktion bredvid de fem Berättaren just konsoliderade (se `stickiness-attention-ar-en-yta`). Filat 2026-09-04.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| stickiness-drift-backend | Repots hosting är statisk (Vercel/Render publicerar SPA); de nya API-rutterna lever i `server.js` och körs bara lokalt. Ingen hållbar lagring (`InMemoryAttentionStore` tappar allt vid omstart), ingen scheduler, inga VAPID-secrets i drift | verifierad | Codex→Jacob | Implementation "Återstår" 1–3 | DELLEVERANS `aaccb764`: hållbar Postgres-adapter och asynkront store-kontrakt byggda men avsiktligt INTE produktionsaktiverade. Adaptern lagrar installation, subscription, minimal attention-snapshot, aktiva kandidater, skickad dedupe, leveranser, kvitton, preferenser och telemetri; installationstoken lagras bara som SHA-256. Omstarts-, första-förfallo-, dedupe- och avregistreringskontrakten verifierade i riktig SQL mot lokal Postgres-emulator; 24/24 backendfokustester, syntax och TypeScript gröna. CLAIM 2026-09-09T20:40:00+02:00 — Codex. JACOBS INFRABESLUT: Render Web Service + Postgres + timvis scheduler, hemligheter endast i Render; push förblir produktmässigt avstängd tills Etapp 1B ger sanna kandidater. Underlag: `BESLUTSUNDERLAG_BACKEND_PUSH_2026-09-06.md`. **DELLEVERANS 2026-09-10 (Codex):** `server.js` väljer nu Postgres via `DATABASE_URL` och vägrar produktionsfallback till minne; klienten har separat `VITE_ATTENTION_API_BASE`; `render.yaml` beskriver statisk app + Node-API + Postgres 18 + autentiserad timcron; VAPID/origins lämnas som Render-secrets och `ATTENTION_PUSH_ENABLED=false` håller UI och leverans avstängda även med giltiga nycklar. Test: full build grön, 549/549 testfiler och 4 983/4 983 tester gröna; lokal process gav health 200, släckt push 503 och osignerad cron 401. **DRIFTPROV GRÖN 2026-09-10 (Codex, `ab667ccd` byggfix + `2c724f14` rapport):** Blueprint-synk, secrets och HTTPS/CORS/scheduler-säkerhetsprov klara; V1-driften verifierad på Render Free, push fortsatt släckt (`ATTENTION_PUSH_ENABLED=false`). Bring-up-delen (Återstår 1–3) är därmed KLAR. Full redovisning: `RAPPORT_RENDER_BLUEPRINT_DRIFTPROV_2026-09-10.md`. **Kvar på raden (ägare Codex→Jacob):** gratis-Postgres upphör **2026-10-10 UTAN backup** — flytt/uppgradering måste planeras före dess; publikt repo stänger GH-workflowen efter 60 dagars inaktivitet (driftnotis); 90-dygnsgallring i V2. Raden öppen enbart på migreringsdeadlinen. |
| stickiness-dataskydd | Servern lagrar installation-id, save-id, attention-snapshot (open loops, kandidater, state-version) och leveranshistorik per installation — en ny datakategori för spelet, som hittills varit local-first utan konto | verifierad | Jacob | Implementation "Återstår" 8 | Referensadaptern raderar nu hela installationens serverstate vid avregistrering, och klienten rensar identitet/attribution. Före beständig lagring återstår Jacobs beslut om lagringstid/policy och Opus korta text i inställningarna. Snapshotens open loops är spelarens beslutsläge och ska behandlas så. Blockerar `stickiness-drift-backend`. |
| stickiness-permission-ogonblick | Värdebaserad pre-prompt och knapp är kopplade, men skarp backend är avstängd | verifierad | Opus/Jacob | Rapporten §11, Implementation | Anpassat till Opus rekommendation: efter första färdigspelade veckan, när Granska är läst och Portalen visar nästa match med obekräftat lag. Inte vid Ankomsten eller direkt efter onboarding. iOS-hemskärmsraden fungerar även innan Safari exponerar hela Push API:t. **Kvar:** Jacob kvitterar ögonblicket; Design mockar kategori-/quiet-hour-inställningar. |

---

# KÄLLA: Speltest akademi och spelarutveckling, två säsonger (GPT, 2026-09-04 — Hälleforsnäs, build 9238404e) + `FIXRAPPORT_AKADEMI_2026-09-04.md` (Codex)

**GPT:s dom:** "Akademin fungerar som simuleringssystem, men ännu inte som spelberättelse. […] Den är för dåligt attribuerad och för dåligt ihågkommen för att kännas som något jag byggt." Två reproducerbara lånefel + akademin skriver INGENTING till liggaren. **Codex fixade det funktionella samma dag** (ej committat — arbetskopian delas med design/illustrations/formationer). Resten är en dom: `DOM_AKADEMI_LIGGARE_2026-09-04.md`. Samma tes som konsumentkartan och slutprovet: skriv-utan-läs, nu i akademin.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Speltest styrelse, licens och karriärkonsekvenser (GPT, 2026-09-04 — Slottsbron SVÅR, två säsonger + sommar, 390×844, HEAD 5db04f75 + ocommittat träd)

**GODKÄND AV JACOB 2026-09-04 (via Opus):** rapportens fynd och prioritetsordning står. Alla rader föds `rapporterad` — GPT gav fil:rad-rotorsaker, men Code stämmer av mot trädet före bygge (regel 8), särskilt eftersom trädet laddades om under testet. **GPT:s dom:** "Det största problemet är inte avskedsformeln utan att flera system fortfarande presenterar parallella sanningar utan en gemensam redaktör." Det är Berättarens tes, tredje rapporten i rad. Tre av nio fynd är redan rader (kronologi, managersektionens kuratering, burnout-dubblett i ny form); sex är nya. Kalibreringsnot: Slottsbron SVÅR överlevde två säsonger och överträffade kravet. **RÄTTAT 2026-09-04 kväll efter systemauditen:** detta är INTE en datapunkt mot "100 % avsked" — `Survive`-tier gjorde sportsligt avsked omöjligt i koden (`survive-avsked-undantag`), så ingen SVÅR-karriär kunde få sparken annat än via licens/konkurs. Datapunkterna bevisar gaten, inte balansen.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md` (Opus — systemen mot liggaren, v2 per båge)

**Resultat:** de system som skriver till liggaren är nu synliga (burnout, press, patron, domare, transfer, matcher, skador); de fem som ALDRIG skriver — styrelse, licens, orten/CS, hallprövning, brev (+ akademin, redan dömd) — är exakt där GPT:s tre rapporter hittade luckor. F-vägarna (egna projektioner/fickor) är där buggarna bor. Steg 2 (minns) är punktvis; redaktören har verktyget (`semanticKeyStem`) men producenterna använder det inte. Sex nya typer föreslagna, alla med konsumenter (§3). RAW-grep beställd (§5).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# CHECKPOINT 2026-09-06 — röstintroduktioner

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Systemaudit akademi, ekonomi, styrelse och minne (GPT, 2026-09-04 — Rögle SVÅR, tre säsonger, 390×844, live 6c72267) + Codex åtgärdspass samma dag

**Läst av Opus 2026-09-04 kväll (låg oläst i incoming sedan morgonen).** GPT:s dom: "Stickiness kräver inte fler system nu. Den kräver att de personer och löften som redan finns aldrig tappas mellan modellerna." Codex åtgärdade BLOCKER + de mekaniska HIGH/MEDIUM (se första raden) och lämnade tre produktfrågor — alla tre är redan rader (junior-20, board_verdict, dedup). **Det viktigaste fyndet är Survive-undantaget** — det ritar om kalibreringsrundans förutsättning.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
