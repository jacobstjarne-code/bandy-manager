# Textsvep — BETATEST_ERIK, 2026-09-24

Körorder: `docs/CODE_KORORDER_BETATEST_ERIK_2026-09-24.md` §C. Alla poster
nedan är **kandidater**, inte genomförda ändringar — enligt ordern:
"Direktkorrigera bara entydiga stavfel, grammatikfel och A1. Övriga
omskrivningar ska vara kandidater tills Jacob har fällt textdom."

Metod: tre parallella research-agenter svepte var sin klassgrupp (se
sektionsrubrikerna) genom `src/domain/data/`, de textbärande
`src/domain/services/*`-filerna, och relevanta presentationskomponenter.
Varje agent läste `scripts/text-guard-lint.mjs`, `docs/TEXT-AUDIT-PROTOKOLL.md`,
`docs/STRINGS_POOL_INVENTORY.md` och `docs/LESSONS.md` (m.fl. redan
existerande statuskällor) FÖRST för att inte återrapportera redan kända
eller redan fixade fynd. Kolumnen "Kräver mer data/villkor" markerar om en
omskrivning bara är textarbete eller om den också kräver en kodändring
(ny betingelse, nytt fält, ny wiring).

En post från dagens session är UTESLUTEN härifrån eftersom den redan är
fixad, inte en kandidat: `community_shift`-upprepningen i Krönikan (A4,
commit `80cb7c1b`). Flera fynd nedan (särskilt C4.1–C4.3) är samma
felklass på ANDRA ledger-typer — den fixen migrerades inte automatiskt
till dem.

---

## C1. Fel bandyterminologi eller översatt managerspråk

| # | Fil/rad | Nuvarande text | Varför den skaver | Omskrivning (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|
| C1.1 | `src/domain/data/matchCommentary.ts:998, 1004, 1014` | `"${name} med en tackling ingen förstår. Domaren blåser. Solklart."` m.fl. (3 rader) | "Tackling" är hockeyspråk (TERMLISTA v2/MISSTANKAR). `bentackling` (rad 153) är den officiella utvisningstermen och är korrekt/whitelistad — men dessa tre rader använder det generiska verbet "en tackling" för en ospecificerad hård situation, vilket är just det förbjudna bruket. | Byt "en tackling" → "en brytning" i alla tre: `"${name} med en brytning ingen förstår. Domaren blåser. Solklart."` osv. | Nej — ren textersättning, samma tokens. |
| C1.2 | `src/presentation/screens/TransfersScreen.tsx:307, 473, 273` | Flikettikett `'Scouting'`, CTA `'Gå till Scouting →'`, status `'Scouting pågår: …'` | Bar engelsk etikett som låter som ett importerat managerspel-begrepp, medan SAMMA skärms egna sektionsrubriker (se C2.3) konsekvent kallar samma funktion "Talangspaning". | Byt visningsetikett/CTA till "Talangspaning" / "Gå till talangspaning →"; behåll "scout"/"scouta" som redan etablerat låneord för person/verb. | Nej — bara visningssträngar, interna id:n (`activeTab==='scouting'`) kan vara oförändrade. |

## C7. Inkonsekvent bandyordlista, CTA-ton, versalisering och personnamn/efternamn

| # | Fil/rad | Nuvarande text | Varför den skaver | Omskrivning (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|
| C7.1 | `src/presentation/screens/TransfersScreen.tsx` (flik/CTA, se C1.2) vs. `ScoutingTab.tsx:126, 148` + `featureIntroductions.ts:16` | "Scouting" vs. "Talangspaning"/"Ny talangspaning"/"Scouten är ute på talangspaning" | Samma funktion, två namn, i samma användarflöde — flikens egen etikett motsäger panelens egna rubriker tre rader ner. | Standardisera på "Talangspaning" som funktionens/flikens namn överallt. | Nej. |
| C7.2 | `.h-label`-klassen (`design-system/colors_and_type.css:356`, `text-transform: uppercase`) vs. källsträngarna som använder den | Vissa filer skriver VERSALER direkt i källsträngen ("BYGDENS PULS", "BÄNKEN", "ENGAGEMANG", "FÖRHANDLING", "HÖJDPUNKTER", "KASSAÖVERSIKT", "KLUBBEN UTANFÖR SPELET", "KRAV", "MATCHRESULTAT", "NÄSTA STEG", "SÄSONG", "SÄSONGENS BÅGE", "STÖD I BYGDEN", "VÄDER"), medan de flesta andra skriver normal case och låter CSS:en göra jobbet ("Aktiva lån", "Avveckla", "Bekräfta bygget", "Finansiering", "Klubbmärken", "Lagstyrka", "Placering", "Poäng under perioden", "Uppställning", "Vad du ändrat i år"). | Inkonsekvent källa för samma design-roll — och inte bara kosmetiskt: skärmläsare läser ofta hela versaler bokstav för bokstav som en förkortning, så de hårdkodade instanserna kan låta trasiga för skärmläsarnvändare trots identisk visuell output. | Normalisera alla `.h-label`-strängar till normal case i källan, låt CSS:ens `text-transform: uppercase` sköta visningen. | Nej — ren normaliseringsomgång; en text-guard-regel liknande `text-guard-lint.mjs` skulle kunna hindra regression. |
| C7.3 | `src/presentation/components/PlayerCard.tsx:483-484` vs. `src/presentation/screens/SquadScreen.tsx:371-374` | PlayerCard: `'MÅL'`/`'AST'`/`'BGT'` (blandat helt svenskt + engelskrotade förkortningar i SAMMA rad). SquadScreen: `{M}`/`{G}`/`{A}` — helt annat enbokstavsschema för SAMMA tre stats. | Två olika förkortningsscheman för samma statistik i samma app, ofta på angränsande skärmar. Konkret krock: i SquadScreens egen rad renderar `positionShort()` "A" för Anfallare direkt ovanför en statrad som ÄVEN renderar "A" för assist — samma bokstav, två betydelser, några pixlar isär. | Standardisera ETT schema app-brett (t.ex. alltid "M / G / A / BETYG"), eller om enbokstavsformen måste vara kvar i SquadScreen: byt assist-bokstaven så den inte krockar med positionsbokstaven. | Nej — ren presentationssträng. |
| C7.4 | Icke-fynd, noterat för fullständighet | "Hörna"/"hörnslag"/"frislag"/"straffslag" | Kontrollerad — stark intern konsekvens (Hörna dominerar ~30 träffar, hörnslag bara i en kodkommentar). Inget att göra. | — | — |
| C7.5 | Icke-fynd, noterat för fullständighet | "F. Efternamn"-format | Kontrollerad över opponentAnalysisService/arcService/cornerInteractionService/weeklyDecisionService/GranskaAnalys/GranskaSpelare/GranskaOversikt/HalftimeModal/MatchLiveScreen — konsekvent tillämpat, ingen inkonsekvens. | — | — |

## C6. Onaturliga rollord som "assistenten"

| # | Fil/rad | Nuvarande text | Varför den skaver | Omskrivning (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|
| C6.1 | `src/domain/data/assistantFFStrings.ts:13-58` (`ASSISTANT_FF_LINES`, 18 rader, hörna/kontring/frislag) | `'Assistenten vinkade in den kort. Nära stolpen.'`, `'Rakt ut till linjen — assistenten litade på skytten.'` m.fl. | **Högst volym i hela kodbasen** — avfyras varje gång spelaren snabbspolar genom hörna/kontring/frislag, alltså flera gånger per match, varje match. Spelet har redan en namngiven, karaktäriserad assistent (`game.assistantCoach.name`) använd i exakt samma "rapporterat beslut"-röst på annat håll (opponentAnalysisService, "Sixten-registret"). **OBS (verifierat av en senare agent, se C4-notering):** denna pool har **noll anropare** i `src/` — texten renderas aldrig till spelaren idag. Kandidaten nedan gäller om/när poolen kopplas in. | Interpolera assistentens namn: `'{coach} vinkade in den kort. Nära stolpen.'` osv. Behåll "Han"-varianterna oförändrade. | Ja om poolen kopplas in — konsumenten (`matchUtils.ts:319`, `assistantVoiceLine`) behöver tråda `game.assistantCoach.name` igenom, samma mönster som redan finns i `opponentAnalysisService.getSuggestionWhyLine`. |
| C6.2 | `src/presentation/components/tactic/TacticBoardCard.tsx:200-217` | "Varför"-raden ovanför knappen: `"{coach} såg det: deras mittfält är tunt. Pressa högt, ta mitten."` (riktigt namn) — knappen direkt under: `"✓ Följ assistentens råd"` (generiskt rollord) | Ett UI-kort, två register för samma person, en mening ifrån varandra. | `"✓ Följ {coach.name}s råd"` | Nej — `coach` är redan en prop till komponenten. |
| C6.3 | `src/domain/services/burnoutReliefService.ts:67, 353` | Vald-knapp: `label: 'Låt assistenten ta pressen'` (subtitle på samma kort: `'Han säger det du hade sagt. Ungefär.'` — redan "han"); minneslinje: `'Du lät assistenten ta pressen.'` | Subtitle personifierar redan assistenten som "han" en rad under — den platta "assistenten" i knapp/minnesrad känns som ett missat tillfälle i en scen som uppenbart handlar om en specifik person. | `label: 'Låt {coach} ta pressen'`; minnesrad: `'Du lät {coach} ta pressen.'` | Liten — `game.assistantCoach` finns redan tillgänglig vid båda byggpunkterna. |
| C6.4 | `src/presentation/screens/granska/GranskaOversikt.tsx:941-945` | `note: 'Assistenten satte laget'` | Visas när `simulateRemainingStep()` auto-valde laguttagningen. Kommentaren markerar raden "låst text (Jacob, 2026-08-17)" — dvs redan ett medvetet beslut. Tas med för medvetenhet, inte som ett självklart fel, eftersom spelet nu konsekvent har namnet tillgängligt på andra ställen. | `note: '{coach} satte laget'` | Liten, men **bekräfta med Jacob först** given den tidigare låsningen innan ändring. |
| C6.5 | `src/domain/services/burnoutCeilingService.ts:31, 33, 40, 45` | Fyra ytterligare rader: `'...Assistenten säger samma sak...'`, `'...Assistenten väntar på om du gör samma val...'`, `'...Assistenten har sagt det rakt ut...'`, `subtitle: 'Assistenten tar rodret...'` | Samma mönster som C6.3 i "burnout ceiling"-funktionen (en eskalering av burnout-relief-flödet) — narrativ prosa, inte kodkommentarer, sannolikt spelarvänd. | Samma behandling — interpolera `{coach}`-namnet där strängarna byggs. | Liten, samma mönster som C6.1/C6.3. Bekräfta att texten faktiskt är spelarvänd (konsument ej fullt verifierad av research-agenten) innan ändring. |

## C2. AI-fyndighet: abstrakta paradoxer, symmetriska one-liners

Den vanligaste konkreta formen är det uttryckligen förbjudna mönstret
"Det är inte X. Det är Y." (max en gång per text, enligt skrivreglerna —
nedan är samtliga överanvändningar/enda-förekomster som ändå skaver i sin
egen fil).

| # | Fil/rad | Nuvarande text | Varför den skaver | Omskrivning (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|
| C2.1 | `src/domain/data/managerKaraktarText.ts:55` (BURNOUT_MARK, zon `hog`) | `'Det är inte bandyn längre. Det är allt runtomkring.'` | Argumentpar, "allt runtomkring" namnger inget konkret. Nästan identisk med C2.3 — repetitionsrisk mellan två burnout-ytor. | `'Jag orkar matcherna. Det är mejlen och mötena jag inte hinner med.'` | Nej. |
| C2.2 | `src/domain/data/managerKaraktarText.ts:89` (BURNOUT_MARK_RELAPSE) | `'Det är inte nytt längre. Det är det som oroar mig.'` | Argumentpar utan konkret referent — kunde beskriva vilket återfall som helst. | `'Andra gången på tre år. Jag känner igen varenda tecken nu.'` | Nej. |
| C2.3 | `src/domain/data/managerKaraktarText.ts:131` (BURNOUT_CAUSE_LINES.inbox) | `'Det är inte matcherna. Det är allt runtomkring som samlas på hög.'` | Se C2.1 — samma abstraktion, dubblett-risk. | `'Fem obesvarade mail från styrelsen. Det är det som väger, inte matcherna.'` | Nej. |
| C2.4 | `src/domain/data/managerKaraktarText.ts:209` (CONTRACT_OUTCOME.extended) | `'Styrelsen förlängde. {manager} stannar — bygdens puls slår vidare.'` | "Bygdens puls slår vidare" är den enda överflödigt poetiska frasen i en annars strängt konkret fil (Sture, Konsum, Birgitta). | `'Styrelsen förlängde. {manager} stannar — ett år till på samma is.'` | Nej. |
| C2.5 | `src/domain/data/boardMeetingCopy.ts:87` (state B) | `'Det är inte tid att gå försiktigt. Det är tid att se vart det leder.'` | Argumentpar, oklart referent ("det" = vad?) — sticker ut bland sju konkreta grannrader i samma pool. | `'Vi ska inte hålla igen på transferbudgeten i år. Se om det bär hela vägen.'` | Nej. |
| C2.6 | `src/domain/data/boardMeetingCopy.ts:118` (state C) | `'Folkets förväntningar har sänkts. Det är inte en lättnad — det är ett varningstecken.'` | "Folkets förväntningar" är abstrakt mot grannradernas konkreta ("Spelarna är inte sämre än förra året"). | `'Läktaren har blivit tystare, inte högre. Det oroar mig mer än tabellen.'` | Nej. |
| C2.7 | `src/domain/data/momentViewTemplates.ts:113` (era_shift → legacy) | `'Det är inte längre bara ett lag. Det är ortens identitet, och den bärs vidare av dem som minns.'` | Argumentpar + generisk avslutning som kunde beskriva vilken institution som helst — den vagaste raden i en annars konkret fil ("Klacken sjöng hela vägen till bilen"). | `'Barnbarn till supportrar som var med från början fyller läktaren nu. Det är inte längre bara ett lag — det är en tradition som gått i arv.'` | Nej. |
| C2.8 | `src/domain/data/momentViewTemplates.ts:100` (season_highlight fallback) | `'En av de kvällar orten kommer att minnas. Inte för tabellen — för känslan på läktaren.'` | Detta är FALLBACK-varianten — den vagaste texten syns oftast. | `'Läktaren stod kvar efter slutsignal och sjöng i tio minuter. Den kvällen glöms inte bort i kafferummet.'` | Nej (kan stärkas med riktig data — publik/minut — men krävs inte). |
| C2.9 | `src/domain/data/momentViewTemplates.ts:164` (transfer_signed, ingen subject2Name) | `'...Det kommer den att göra, åt ena eller andra hållet.'` | Innehållslös paradox som passar VILKEN värvning som helst, oavsett utfall. Se även C4.1 (samma rad är dessutom en upprepningsbugg). | `'Ett namn på ett papper i klubbstugan. Om ett år vet vi om det var värt varenda krona.'` | Nej (textfix); se C4.1 för den separata upprepningsfixen samma ställe behöver. |
| C2.10 | `src/domain/data/specialDateStrings.ts:104` (FINALDAG_COMMENTARY_PLAYING) | `'...Det är inte en vanlig match. Det är inte ens ett derby. Det är finalen.'` | Trippelparallell ("Det är inte X. Det är inte Y. Det är Z.") — exakt den förbjudna retoriska formen, i en annars lore-tät, konkret fil. | `'...Ingen annan match den här säsongen har vägt lika tungt.'` | Nej. |
| C2.11 | `src/domain/data/matchLaddningText.ts:115` (winning_streak.charge) | `'Det är när det känns lätt man ska se upp.'` | Ren truism utan konkret förankring — och filens EGEN rubrikkommentar säger uttryckligen "Inga generella sanningar. Inga råd." Den här raden bryter poolens eget kontrakt. | `'Fem raka. Ingen i omklädningsrummet säger det högt än.'` | Nej. |
| C2.12 | `src/domain/data/matchLaddningText.ts:83` (final.charge) | `'Det är hit alla vill, men få når ända fram.'` | Generisk mästerskaps-truism, samma självmotsägelse som C2.11. | `'Tolv lag började i höstas. Två står kvar. Ni är ett av dem.'` | Nej (tolv-lag-siffran matchar redan etablerad ligastorlek). |
| C2.13 | `src/domain/data/transferResponseText.ts:96` (PERSONALITY_REFUSAL.dream_club) | `'Det är inte fel klubb. Det är fel klubb för honom.'` | Argumentpar, dessutom lätt förvirrande (dubbel negation). Enda intetsägande raden i en fil annars full av specifika skäl (Sture som granne, sex år på bruket). | `'Han har haft en annan klubb i huvudet i två år. Den här var aldrig den.'` | Nej. |
| C2.14 | `src/domain/data/clubOfferQuotes.ts` (club_forsbacka) | `'Det är en klubb som har funnits längre än din morfar. Det är inte samma sak.'` | Argumentpar OCH genuint otydlig referent ("inte samma sak" som vad?) — den enda raden i denna annars mycket starka fil som är otydlig, inte bara stilistiskt avvikande. | `'...Andra klubbar har pengar. Vi har det här.'` | Nej. |
| C2.15 | `src/domain/services/mecenatService.ts:184` | `'Kontoret i centrum ser inte ut som det kostar vad det kostar. Det är poängen.'` | Poäng utan skämt — låter som en platshållare för fyndighet, inte en observation. | `'Kontoret i centrum är litet och omärkt med flit. Hon vill inte att kunderna räknar ut vad hon tar ut i provision.'` | Nej. |
| C2.16 | `src/domain/services/mecenatService.ts:192` | `'...Om det stänger är det inte en butik som försvinner, det är infrastruktur.'` | Argumentpar + generiskt avslutningsord ("infrastruktur") kastar bort en annars konkret uppsättning (dagligvaror + bredband + postombud). | `'...Om han stänger måste folk till stan för att betala räkningar.'` | Nej. |
| C2.17 | `src/domain/services/licenseService.ts:149` (LicenseActionType 'cleared') | `'...Det är inte en utmärkelse. Men det är inte ett problem heller.'` | Dubbel-negation-argumentpar, tommare än resten av brevet ("återgått till sund finansiell verksamhet"). | `'...Nämnden har inget mer att säga om saken den här säsongen.'` | Nej. |
| C2.18 | `src/domain/services/licenseService.ts:162` (first_warning) | `'...Det är inte slutet — men det är ett första steg dit...'` | Argumentpar mitt i ett annars vasst stycke ("Nästa förlustår kommer kosta poäng"). | Stryk hedgen, gå direkt på: `'Nästa förlustår kostar poäng, inte bara ett brev.'` | Nej. |
| C2.19 (låg confidence) | `src/domain/data/eventProcessorStrings.ts:12` | `'"Det är inte en fråga om huruvida ni har råd just nu"... "Det är en fråga om hur ni planerar..."'` | Matchar det förbjudna mönstret exakt, men byråkratiskt brevspråk använder faktiskt denna konstruktion i verkligheten — lägre prioritet. | `'"Ni har inte råd med lönerna ni betalar just nu"... "Vi vill se en plan för hur det ska bli hållbart."'` | Nej. |
| C2.20 (låg confidence) | `src/domain/data/eventProcessorStrings.ts:87` (mecenat "nostalgiker" avgång) | `'...Det är inte mot dig. Det är åt mig själv.'` | Matchar mönstret syntaktiskt, men är ett känslomässigt avskedscitat där konstruktionen är trovärdig talspråk — gränsfall. | `'...Jag är för gammal för att bråka om det här längre.'` | Nej. |
| C2.21 (låg confidence) | `src/domain/data/csPressEventText.ts:116` (system-citat) | `'{COACH_LASTNAME} talar systemiskt: "Det är inte personer. Det är hur vi spelar."'` | En av tre medvetet distinkta tränarröster (individ/lag/system) — "system"-valet må vara AVSIKTLIGT floskelaktigt. Flaggas för medvetenhet, inte nödvändigtvis fix. | Om fix önskas: `'...Fyra bak, ingen chansar. Det är hela hemligheten.'` (behåller idén, förankrar den i en konkret detalj). | Nej. |
| C2.22 (designfråga, ingen radfix) | `src/domain/data/scenes/finalIntroScene.ts`, `assistantCoachService.ts:~605/624` | `CoachPersonality: 'philosophical'`-poolen (`'Oavgjort är ingen destination — det är en övergång.'` m.fl.) | Denna personlighetstyp är AVSIKTLIGT byggd för att låta filosofisk/aforistisk — precis mönstret ordern efterfrågar, men som en medveten karaktärsröst, inte drift. Produktbeslut: acceptera som röst, eller skriv om mot KONKRETA bandy-observationer (väder, is, generationer) om playtest visar att den läses som "AI-slask". | — (kräver Jacobs riktningsbeslut innan enskilda rader skrivs om) | Nej rent tekniskt, men kräver en designdom innan text skrivs. |

## C3. Bisatser/fragment som felaktigt står som egna meningar

Lågt antal genuina träffar — kodbasen är ovanligt ren här (inga träffar
för fristående "Eftersom"/"Trots att"/"Även om"). De två närmaste
träffarna använder ett "Som X."-taggmönster som återkommer konsekvent
över många pooler (t.ex. "Som vanligt.", "Som han alltid gjort.", "Som
varje år.") — närmare en avsiktlig lakonisk stilfigur än ett
grammatikfel, men tas med enligt ordern.

| # | Fil/rad | Nuvarande text | Varför den skaver | Omskrivning (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|
| C3.1 (låg confidence) | `src/domain/data/matchCommentary.ts:831` (supporter_scandal_recent) | `'...Tunn tröja, bara handskar — som alltid. Som om ingenting hade hänt.'` | "Som om ingenting hade hänt." saknar en styrande huvudsats — grammatiskt ofullständigt som egen mening, även om mönstret ("Som X.") återkommer avsiktligt i filen. | `'...som alltid, som om ingenting hade hänt.'` (bind ihop med komma i stället för punkt) | Nej. |
| C3.2 (låg confidence) | `src/domain/services/coffeeRoomService.ts:512` | `"...Pratade med alla. Som om han aldrig slutat."` | Samma brist som C3.1. | `"...Pratade med alla, som om han aldrig slutat."` | Nej. |

**Rekommendation:** eftersom "Som X."-mönstret är etablerat och
återkommande över många pooler, bör Jacob avgöra om det är avsiktlig
husstil (behåll överallt) eller ett fel (fixa överallt) — en enstaka
fix av C3.1/C3.2 utan den domen riskerar att göra kodbasen mindre
konsekvent, inte mer.

## C4. Mekaniska upprepningar inom samma vy, säsong eller händelsekedja

| # | Fil/rad | Nuvarande text | Varför den skaver | Omskrivning (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|
| C4.1 | `src/domain/data/momentViewTemplates.ts:164-175` (`transfer_signed`/`transfer_sold`), producent `src/application/useCases/processors/transferProcessor.ts:527-545` | `"Ett namn på ett papper i klubbstugan och en förväntan som ännu inte kostat något. Det kommer den att göra, åt ena eller andra hållet."` | Samma felfamilj som den redan fixade `community_shift`-buggen (A4), men på kodbasens VANLIGASTE ledger-typ. Att köpa/sälja 2+ spelare under ett fönster är helt normalt — Krönikan visar den ordagrant identiska meningen två gånger samma säsong. Ingen spärr alls (ren funktion, ingen pool). | Bygg om till en 4-6-radig pool (Opus-text, samma låsta-text-stil) med anti-upprepning, ELLER låt kroppen faktiskt spegla redan tillgänglig data (avgiftsklass, position) så variationen blir substantiell. | Nej ny spårning — `bid`/`subject2Name` finns redan i anropspunkten; bara text-/poolarbete. |
| C4.2 | `src/domain/data/momentViewTemplates.ts:144-151` (`referee_feud`/`referee_trust`), producent `src/domain/services/events/eventResolver.ts:115-141` | `"Vi har protesterat en gång för mycket, och han har märkt det. Från och med nu tolkas varje tveksam situation åt fel håll — i huvudet på båda."` | Samma felfamilj. `logEvent` (`eventLedgerService.ts:38`) har INGEN dedup — en relation som korsar tröskeln, återhämtar sig, och korsar den igen (rimligt över en flersäsongskarriär, flera domare spåras oberoende) ger en andra, ordagrant identisk post. | (a) Dedupa på `semanticKey` så en given domarrelation bara någonsin renderar en gång, ELLER (b) pool:a till 3-4 varianter om upprepade korsningar SKA synas. | Ja för (a) — kräver en "har det här semanticKey redan gett en Krönika-post"-koll, finns inte idag i ledger→Krönikan-kedjan. |
| C4.3 | `src/domain/data/momentViewTemplates.ts:152-163` (`mecenat_withdrawal`/`patron_emerge`/`patron_withdrawal`) | `"Pengarna var en sak. Att ha någon som ställde upp när det knakade var en annan. Kassan märker det direkt; orten om ett tag."` | Samma mönster — mecenater/patroner är designade för att bytas ut, en klubb kan gå igenom 2-3 under en lång karriär, varje avgång/tillträde ger identisk text oavsett vem. | Samma som C4.1 — pool eller väv in den avgående mecenatens namn/skäl mer substantiellt (`ctx.subjectName` finns redan). | Nej. |
| C4.4 | `src/domain/data/landslagText.ts:91-94` (`FIRST_CALLUP_MEMORY_LINES`), konsument `clubMemoryService.ts:413`, producent `nationalTeamService.ts:67,116` | `"{spelare}s första landslagsuttagning. Han bar bygdens namn till VM."` / annan | Sanningshalten ("första gången") ÄR korrekt gated (`!p.nationalTeamCallups`) — buggen är att textvalet görs på `entry.season % 2`, inte per spelare/händelse. Kallas 2+ spelare upp i samma trupp/säsong (det normala) visas EXAKT samma mening för båda, bara med namnet utbytt. | Nyckla valet på något per post/spelare (t.ex. `hashSeed(playerId)`), inte på `season` som delas av alla poster loggade den säsongen. | Nej — en rads fix i indexuttrycket. |
| C4.5 | `src/domain/data/landslagText.ts:16-25` (`CALLUP_NOTICE_LINES`), konsument `nationalTeamService.ts:76` | (växlar mellan två inbox-rader) | Inboxposten själv är dedupad per säsong (`inbox_vm_callup_${season}`) så ingen dubblett SAMMA säsong, men över en flersäsongskarriär cyklar den deterministiskt (jämn/udda säsong) i stället för att variera — spelaren märker samma två meningar alternera i evighet. | Samma fix som C4.4 (byt modulo-nyckel). | Nej. |
| C4.6 (återbekräftat, redan känt) | `src/domain/data/matchCommentary.ts:374-376` (`cup_goalOpener`) | `"Det första målet i cupen kommer ofta överraskande tidigt. {player}. {score}."` | Redan flaggad i `STRINGS_POOL_INVENTORY.md` (2026-09-03) som "actual bug". **Bekräftat fortfarande 1 variant idag.** Cupmatcher är inte sällsynta för en klubb som går vidare. | Utöka till 4-5 varianter i samma ton som syskonpoolen `cup_goal`. | Nej. |
| C4.7 (återbekräftat, redan känt) | `src/domain/data/hallProvningData.ts:35, 47` (`PROVNING_AMBIENT.krav.klack`, `.forhandling.klack`) | `"Klacken vet att den räknas i kravlistan. Den sjunger därefter."` / `"Västra Sidan har skickat ett eget brev till kommunen..."` | Redan flaggad (2026-09-03), **fortfarande 1 variant vardera idag.** Konsumenten (`coffeeRoomService.ts:800-817`) kombinerar kafferum+klack, väljer via `hashSeed % poolLength`, ~35%/matchdag, INGEN anti-upprepningsspärr (till skillnad från `pickCommentary` på andra ställen) — synliga upprepningar väntade inom samma hallprövnings-etapp. | Utöka båda 1-radspoolerna till 3+; ge hallprövnings-grenen samma no-immediate-repeat-spärr som `pickCommentary`/`chooseDisplayed` redan har. | Liten kodändring för anti-upprepningsspärren; textarbetet i sig kräver inget nytt. |
| C4.8 (återbekräftat, redan känt) | `src/domain/data/matchCommentary.ts:966-991` (`traitGoals.hungrig/joker/veteran/lokal`) | 3 varianter vardera | Redan flaggad som "high risk" (spelas varje mål av en trait-bärare). **Fortfarande 3 varianter idag** (bara `ledare` utökades, till 5, av ett orelaterat kaptensfix). | Utöka till 6+ vardera. | Nej. |
| C4.9 (återbekräftat, redan känt) | `src/domain/data/matchCommentary.ts:1011-1025` (`traitSuspensions.veteran/lokal/ledare`) | 3 varianter vardera | Syskonpoolerna `joker`/`hungrig` utökades redan till 6 (dokumenterat), dessa tre fick aldrig motsvarande. **Bekräftat fortfarande 3 idag.** | Utöka till 6+ vardera, matcha `joker`/`hungrig`. | Nej. |

## C5. Historik- och tillståndspåståenden som koden inte faktiskt har gatat

De flesta tidigare kända fallen (slutspel "första gången", press/scandal/
assistent-tränare "inte första gången", styrelsens "15 år" cupdröm,
veckobeslutens "tre vintrar", nationell debut-gating) är **redan
fixade** (verifierat mot dagens kod, inte bara mot äldre dokument) och
återrapporteras inte här.

| # | Fil/rad | Nuvarande text | Vad koden faktiskt kontrollerar | Varför den skaver | Omskrivning/villkor (kandidat) | Kräver mer data/villkor |
|---|---|---|---|---|---|---|
| C5.1 | `src/domain/services/matchCore.ts:2206-2214`, pool `matchCommentary.ts:762-766` (`referee_lenient`) | `"Domaren viftar vidare. Den gick igenom — men det var nära."` / `"Ingen pipa. Domaren låter spelet flöda."` / `"Fri duell. Domaren låter det hållas."` | Grenen körs BARA när `suspensionOccurred && rand() < 0.20` — dvs den här texten är själva kommentarsraden för en utvisning som just hänt. `refStyle` är dokumenterat (kommentar rad 1666-1667) att bara styra kommentartonen, inte foulfrekvensen. | Rak motsägelse en spelare kan se i EN match: ett utvisningskort visas, texten säger samtidigt "ingen pipa"/"domaren låter det hållas". Inte en vag tonträff — en bokstavlig motsägelse mot händelsen på skärmen. | (a) Uteslut `referee_lenient` helt ur "kommentar efter en utvisning"-slotten (hör hemma i ett moment UTAN utvisning i stund), eller (b) skriv om just den post-utvisning-varianten till något konsekvent med att ett kort just visats (t.ex. "även den milde domaren kunde inte släppa den"). | Nej ny spårning — en wiring-/villkorsfix (dirigera inte `referee_lenient` in i utvisnings-slotten utan att anpassa innehållet för den slotten). |

### Sekundära noteringar (inte primära fynd, men relevanta)

- **`src/domain/data/preMatchContextStrings.ts`** (derby/streak/table-kontext-poolerna) — flaggad med flera ⚠️ i `STRINGS_POOL_INVENTORY.md`. Verifierat: hela poolobjektet och `pickPreMatchContextText` har **noll anropare i `src/`**. Inventeringens repetitionsrisk-flaggor är alltså just nu moot — poolerna renderas aldrig till en spelare. Värt en rad i nästa inventeringsuppdatering, inte en aktiv bugg.
- **`src/domain/data/assistantFFStrings.ts`** (se C6.1) — bekräftat **noll anropare** i `src/`. Död fil, ingen aktiv repetitionsrisk just nu — kandidaten i C6.1 gäller först om/när den kopplas in.
- **`src/domain/data/academyBreakthroughText.ts:57`** (`academyBreakthroughQuote`) — `DOM_SPRAKSVEP4_2026-09-12.md` beskriver en påstådd wiring mot `Player.academyJoinedSeason` som verkar aldrig ha landat — funktionen har **noll anropare** idag. Inte en spelarvänd bugg (texten renderas aldrig, så inget falskt visas) men noterat som "dokumenterad som på väg att fixas, är det fortfarande inte" — samma klass av glapp ordern bad om uppmärksamhet på.

---

## Sammanfattning

- **57 poster** totalt (varav ~10 är lågt-confidence-gränsfall eller
  rena icke-fynd/noteringar, tydligt märkta som sådana i varje sektion).
- **Nya fynd:** merparten av C1, C2, C6, C7 samt C4.1–C4.5 och C5.1.
- **Återbekräftade, redan kända, fortfarande öppna fynd:** C4.6–C4.9
  (cup_goalOpener, hallProvningData-klack-poolerna, traitGoals/
  traitSuspensions-utökningarna) — redan i `STRINGS_POOL_INVENTORY.md`
  sedan 2026-09-03, kontrollerat fortfarande unfixade idag.
- **En designfråga utan radfix:** C2.22, `philosophical`-tränarpersonlighetens
  aforism-röst — kräver ett riktningsbeslut innan enskilda rader skrivs om.
- **Två döda pooler upptäckta under svepet** (inga anropare, ingen
  spelarvänd effekt just nu): `assistantFFStrings.ts` (C6.1),
  `preMatchContextStrings.ts` (C5-sekundär). Flaggas för
  `STRINGS_POOL_INVENTORY.md`-uppdatering, inte som textkandidater.
- **Renaste filerna** (positiv baslinje, husstilen fungerar som avsett):
  `clubOfferQuotes.ts`, `klackEchoText.ts`, `transferResponseText.ts`
  (bortsett från C2.13), `corridorText.ts`, `stillnessText.ts`,
  `rippleChainText.ts`, `functionaryStreakText.ts`, `injuryDoctorText.ts`,
  `efterklangText.ts`.

Nästa steg (Jacobs bord, inte Codes): fälla textdom per post — vilka
omskrivningskandidater godkänns, vilka går till Fable för en riktig
omskrivningsrunda, och designdomen i C2.22.
