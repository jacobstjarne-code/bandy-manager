# MASTER_ARKIV — stängda och stale poster ur MASTER_OPPET.md

**Skapad 2026-09-08 (Code, MASTER-split).** Varje rad här VAR en fullständig `docs/MASTER_OPPET.md`-post (beskrivning + full utredningstext i `nästa-åtgärd`) innan den kollapsades till fyra kolumner vid arkiveringen. Fulltexten finns fortfarande — i `git log -- docs/MASTER_OPPET.md` (sök på id:t) och i respektive DOM-/RAPPORT-/RECON-/INVENTERING-fil pekaren nedan namnger. Den här filen är ett REGISTER, inte en andra sanning.

**Läs INTE denna fil rutinmässigt.** Den dras aldrig in i sessionsstart-kontexten (se CLAUDE.md, auto-load-pekaren pekar på `MASTER_OPPET.md`). Öppna den bara vid explicit behov: "var det här redan löst?", en gammal dom behöver återfinnas, en historisk siffra ska verifieras.

**Kommit-hash-kolumnen är en pekare in i rätt del av historiken, inte nödvändigtvis den exakta commit som satte status till terminal** — flera poster stängdes i en dokument-commit separat från kodcommiten som faktiskt löste dem; hashen är den mest relevanta som nämndes i radens egen text vid arkiveringstillfället. `—` betyder att ingen commit-hash fanns nämnd i originaltexten (vanligt för poster som stängdes genom att en premiss visade sig vara `stale`/redan löst, utan eget kodpass).

**Stående regel (se MASTER_OPPET.md):** en post flyttas hit SAMMA pass den blir terminal — aldrig bara omstämplad `klar`/`stale` på plats i MASTER_OPPET.md.

Sorterad i samma ordning posterna låg i MASTER_OPPET.md vid arkiveringstillfället (inte alfabetiskt, inte efter datum).

| id | status | commit | källpekare |
|---|---|---|---|
| kafferum-exakt-aterfall-samma-slutspel | klar | denna commit | 2026-09-10: de fasta ekona efter vanlig slutspelsseger och slutspelsderby saknade `coffeeSemanticKey`; därför kunde `completeScene` inte skriva något visningskvitto och den starka kafferums-overriden återkom efter varje ny seger. Båda bär nu stabil visningsidentitet och två säsongers presentation-cooldown. `narrativeProcessor` låter en identisk rad på cooldown lämna plats åt kafferummets övriga material; segern och dess kanon påverkas inte, och endast faktisk visning loggas fortsatt i `narrativeBeatLog`. 11/11 fokustester och full build med TypeScript/fem grindar gröna. |
| bandygala-dubblett-samma-sasong | klar | denna commit | 2026-09-10: Bandygalan har stabilt \`event_gala_{season}\`-id, men domänens \`resolveEvent\` tog bara bort den synliga \`pendingEvents\`-kopian och förlitade sig på att vissa store-anropare därefter körde köpromotion för att rensa \`deferredDecisions\`. Resolution pensionerar nu samma id atomärt ur båda köerna för vanliga val, sponsorers specialreturer och passiva events; syskonkort bevaras och \`resolvedEventIds\` gör återförsök till no-op. Gala-regression med verklig \`generateGalaEvent\`: 42/42 fokustester och full build med TypeScript/fem grindar gröna. |
| tranarmarknad-ny-klubb-andra-aret | klar | `e7eeedd7`, `829e7a56`, `f6fb17cb` | 2026-09-10: tillstånd N väljs vid första mötet efter klubbyte, skriver manager_appointed och använder Opus låsta pool. Den dynamiska övertaganderaden läser både aktuell manager_appointed-post och clubSpells; avsked/frivilligt/återkomst täcks, saknat belägg ger ingen text. `f6fb17cb` lade till mallens tredje klausulkategori (Företrädaren) som saknades — spelet har ingen datakälla för en föregångares placering (seasonSummaries följer bara den aktiva managerns egen karriär), så tomma-stol-fallbacken ("Stolen stod tom när du kom...") är den enda hederliga texten för den kategorin, aldrig en utelämning. 10 fokustester, TypeScript och full build/fem grindar samt 5033 gröna tester i hela suiten. Browser 390 px: alla tre klausulkategorier renderas joinade med " · ". docs/playtest/NY_KLUBB_STYRELSEMOTE_2026-09-10.md. |
| sparningsbyte-konflikt-efter-reload | klar | `e1c8776f` | 2026-09-10: switchToSave återanvänder persistGameSnapshot och befintlig konfliktdialog/resolveSaveConflict. Tvåflikstest rött före fix, grönt efter; avvisat byte bevarar målsave och senaste utgående data. Befintlig formatmigration verifierad för 0.1.0/0.3.11, ingen migrationsglugg bevisad. 48 fokustester, fullsvit 552 filer/5 014 tester och build/fem grindar gröna. Browser: Grindtest 2 återöppnad utan import/tvångsskrivning, QF 3–0 Karlsborg, SF Skutskär. Grind 2/3 ej godkända. docs/playtest/SPARNINGSBYTE_KONFLIKT_2026-09-10.md. |
| b1-matchhall-omojligt-sasongsmal | klar | `d363ae0a` | 2026-09-10: getSeasonGoalOffers återanvänder getPreSeasonChoices för vanliga projekt; Matchhallsmål kräver verkligt activeProject, inte nodens strukturella tillgänglighet. Vilande hallundertext saknar falsk chevron; FacilityTree äger interaktionen. Två tester röda före fix, 76/76 fokustester och 552 filer/5 006 tester gröna; full build inklusive fem grindar grön. Browser 390 px: Bygget utan falsk pil, Sommaren fortsatt fungerande målval. Gamla årsboksutfall ej omskrivna. Verifieringsnot: docs/playtest/INT_1_B1_LANGBAGE_2026-09-10.md. |
| supporter-konflikt-resolved-dedup | klar | `1d0bd36b` | 2026-09-10: applyDecisionBudget filtrerar resolvedEventIds och dubblett-id:n över båda köerna, med FIFO och olika id:n bevarade. Röd/grön regression samt riktig supporter-resolution → promotion bevisar engångseffekt. 27 budget- och 5 supporter-tester; fullsvit 552 filer/5 002 tester grön. Browser: kö 2→1→0, olika sponsor-id:n kvar. Ursprungliga browserkopians hela proveniens ej bevisad. Journal: docs/playtest/GRIND_2_3_LANGKARRIAR_2026-09-09.md. |
| analytics-dev-scen-sasongshistorik | klar | `1d0bd36b` | 2026-09-10: AnalyticsBridge och analyticsLifecycle tolererar saknad seasonSummaries utan save-mutation. Röd/grön regression, 4 lifecycle-tester, fullsvit 552 filer/5 002 tester grön. Granska åter renderad i browsern. Isolerat bygge inklusive tsc/fem grindar grönt; gemensamt bygge stoppades av parallella M5-designträffar, inga baselines ändrade. Samma speltestjournal bär verifieringen. |
| high6-attributionshal-madebyplayer | klar | — | Jacobs egen kodläsning + körorder 2026-08-31 (auditens critical #1) |
| high6-retirement-agefloor-24aring | klar | — | Jacobs egen kodläsning + körorder 2026-08-31 (auditens critical #2) |
| matchday-rollover-axis-sweep | klar | — | Jacobs/Claudes skala-order 2026-09-02 + Codex kodsvep |
| high1-burnout-ledger | klar | — | DOM_HIGH1_BURNOUT_LEDGER_2026-09-02.md |
| high2-history-managerseason | klar | — | Jacobs/Claudes HIGH 2-körorder 2026-09-02 |
| medium1-burnout-relapse-body | klar | — | Claudes MEDIUM 1 + Opus ordagranna text 2026-09-02 |
| medium2-burnout-relief-visible | klar | — | Claudes MEDIUM 2 + Codes rotorsaksverifiering 2026-09-02 |
| codex100-mobile-control-floor | klar | — | Codex +100, 2026-09-01 + uppföljning 2026-09-02 |
| codex100-cup-bracket-outcome | klar | — | Codex +100, 2026-09-01 |
| codex100-knockout-round-classification | klar | — | Codex +100, 2026-09-01 |
| codex100-knockout-weather-cancel | klar | — | Codex +100, 2026-09-01 |
| codex100-outcome-ordering | klar | — | Codex +100, 2026-09-01 |
| codex100-render-determinism | klar | — | Codex +100, 2026-09-01 |
| inv-0-hall-text-wiring | klar | — | INVENTERING_2026-08-31.md:19 |
| inv-1-sluttest-a-m8-stale | klar | — | INVENTERING_2026-08-31.md:31 (SLUTTEST_KO.md:97) |
| inv-1-handoff-stale | klar | — | INVENTERING_2026-08-31.md:32 |
| inv-1-losenordsgrind-stale | klar | — | INVENTERING_2026-08-31.md:33 |
| inv-1-incoming-readme-stale | klar | — | INVENTERING_2026-08-31.md:34 |
| inv-1-thebomb-status-broken-link | klar | — | INVENTERING_2026-08-31.md:35 |
| inv-1-claude-md-princip7-example-wrong | klar | — | INVENTERING_2026-08-31.md:36 |
| inv-1-strings-pool-inventory-stale | klar | — | INVENTERING_2026-08-31.md:37 |
| inv-2-4-sprint23-override1 | klar | — | INVENTERING_2026-08-31.md:50 |
| inv-2-5-wascaptainseasons | klar | `6d1bd493` | INVENTERING_2026-08-31.md:51 |
| inv-2-10-sex-okontrollerade-round-falt | klar | — | INVENTERING_2026-08-31.md:64 |
| inv-2-11-h5-renommetak | klar | `7591cebd` | INVENTERING_2026-08-31.md:65 |
| inv-2-11b-board-talamod-system | klar | `7591cebd` | DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md (superseterar D044:s punktfix) |
| inv-2-11c-sanningsgrindar-grind1-grind2 | klar | `2a1e5454` | SPEC_SANNINGSGRINDAR_2026-08-31.md |
| inv-2-12-dom-illustrationerna | klar | `fcce330a` | INVENTERING_2026-08-31.md:66; DOM_ILLUSTRATIONERNA_2026-08-18.md |
| inv-2-13a-delningskortet-artefakt2 | stale | — | INVENTERING_2026-08-31.md:67 |
| inv-2-13b-delningskortet-artefakt3 | stale | — | INVENTERING_2026-08-31.md:67 |
| inv-2-14a-illustration-cup | klar | `aed270cb` | INVENTERING_2026-08-31.md:68 |
| inv-2-14b-illustration-premiar | klar | `aed270cb` | INVENTERING_2026-08-31.md:68 |
| inv-2-14c-illustration-derby | klar | `aed270cb` | INVENTERING_2026-08-31.md:68 |
| inv-2-15b-vag2-a4-script-commit | klar | `033122f7` | INVENTERING_2026-08-31.md:69 |
| inv-2-16-data-foundation-audit | klar | — | INVENTERING_2026-08-31.md:70 |
| inv-2-17a-granska-advance-useeffect | stale | — | INVENTERING_2026-08-31.md:71 |
| inv-2-17b-beslut-ui-tre-ytor | stale | — | INVENTERING_2026-08-31.md:71 |
| inv-2-17c-granska-taktik-brygga | stale | — | INVENTERING_2026-08-31.md:71 |
| inv-2-17d-cta-anti-autopilot | stale | — | INVENTERING_2026-08-31.md:71 |
| inv-2-18-granska-larandeyta-kandidater | stale | — | INVENTERING_2026-08-31.md:72 |
| inv-2-19-d1-batch-av-tre | stale | — | INVENTERING_2026-08-31.md:73 |
| inv-2-20a-korrvanda2-clubscreen-tabs | stale | — | INVENTERING_2026-08-31.md:74 |
| inv-2-20b-korrvanda2-intro-overlay-opacity | stale | — | INVENTERING_2026-08-31.md:74 |
| inv-2-20c-korrvanda2-visa-intro-igen | stale | — | INVENTERING_2026-08-31.md:74 |
| inv-2-21a-pilottransferbidripplechain | klar | — | INVENTERING_2026-08-31.md:75 + DOM_LIGGARE_INVENTERING_METOD_2026-09-02.md |
| inv-2-21b-getarcmoodtext | klar | — | INVENTERING_2026-08-31.md:75 |
| inv-2-22-dom-sponsor-motbud | stale | — | INVENTERING_2026-08-31.md:76 |
| inv-2-23-presskonferens-kaptensfraga-preferids | stale | — | INVENTERING_2026-08-31.md:77 |
| inv-2-24-sprint25f-ingen-audit | stale | — | INVENTERING_2026-08-31.md:78 |
| inv-2-25-scoreboard-hex | stale | — | INVENTERING_2026-08-31.md:79 |
| inv-3-sprint01-21-no-audits | klar | — | INVENTERING_2026-08-31.md:83-91 + SPRINT_01_21_RECON_2026-09-07.md |
| recon-sprint13-arch001-roundprocessor | klar | — | SPRINT_01_21_RECON_2026-09-07.md + SPRINT_13_ARKITEKTUR.md |
| recon-sprint15-arch002-arcutils | klar | — | SPRINT_01_21_RECON_2026-09-07.md + SPRINT_15_REFAKTORER.md |
| inv-4-forutsattningsfasen-steg2-blocker-stale | klar | `16be8fe3` | INVENTERING_2026-08-31.md:104 |
| inv-4-forutsattningsfasen-kvittensrad | stale | — | INVENTERING_2026-08-31.md:104 |
| inv-5-fas1-icon-todos | klar | — | INVENTERING_2026-08-31.md:114 |
| inv-5-handoff-resterande-tickets-stale | stale | — | INVENTERING_2026-08-31.md:116 |
| inv-6a-audit6-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6b-rapport-ommatning-vagb-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6c-manniskoupplevelse-audit-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6d-skutskaer-audit-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6e-auditsviten-pdf-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6f-github-synk-forutsattningsfasen-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6g-ytkarta-hallprovning-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6h-ytkarta-textpooler-arkivera | klar | `36c51cd1` | INVENTERING_2026-08-31.md:122 |
| inv-6i-investigation-match-revenue-arkivera | klar | — | INVENTERING_2026-08-31.md:122 |
| inv-6j-sparb-b4-b3-overifierat | stale | — | INVENTERING_2026-08-31.md:124 |
| audit-taptargetgate-failande | klar | — | BACKLOG.md:23 |
| supporter-role-labels-tomma | stale | — | BACKLOG.md:25 |
| sponsor-motbud-saknas | stale | — | BACKLOG.md:25 |
| incoming-atta-otriagerade | klar | `36c51cd1` | BACKLOG.md:29 |
| press-win-comeback-lacka | klar | `7ad3c8cd` | BACKLOG.md:31 |
| cupprocessor-standing-kvarlamnad | klar | `a948959d` | BACKLOG.md:33, 197 |
| byggkort-upkeepcost-osynlig | stale | — | BACKLOG.md:47 |
| byggtrad-kiosk-utan-intakt | stale | — | BACKLOG.md:47 |
| kiosk-namnkollision | klar | `c9646fc1` | BACKLOG.md:47 |
| youth-vs-senior-attributformel | klar | `2384bbb9` | BACKLOG.md:49 + `DOM_KALIBRERING_AVSKED_HEROS_2026-09-03.md` + `DOM_ALDERSKURVA_2026-09-06.md` |
| dubblettverktyg-otriagerat | klar | `8b9a211c` | BACKLOG.md:51 |
| o10-ruleversion-notis | stale | — | BACKLOG.md:55 |
| cs-mecenat-sannolikhet-skalar-ej | stale | — | BACKLOG.md:60 |
| cs-clubera-troskelbeslut | klar | — | BACKLOG.md:60 |
| mecenat-patron-cs-happiness | stale | — | BACKLOG.md:66 |
| repmilestone-topp3-bonus | klar | — | BACKLOG.md:67 |
| repmilestone-botten-bonus | klar | — | BACKLOG.md:67 |
| m5-113-kontroller-skuld | klar | — | BACKLOG.md:70 + Codex +100 2026-09-01 + uppföljning 2026-09-02 |
| scouting-dev-scen-saknas | klar | — | BACKLOG.md:78 |
| h4-avskedsfrekvens-100-procent | klar | `acff6f6f` | BACKLOG.md:92 |
| h4-ackumulator-magnituder | klar | `acff6f6f` | BACKLOG.md:94 |
| ekonomiformler-rep55-utredning | stale | — | BACKLOG.md:102 |
| midtable-mislabeling | klar | `acff6f6f` | BACKLOG.md:104 + SLUTTEST_KO.md:212 |
| tva-licenssystem-osynkade | klar | — | BACKLOG.md:108 + DOM_LICENS_RETIRE_A_2026-09-02.md |
| boardpatience-skala-kalibrering | klar | `acff6f6f` | BACKLOG.md:122 + SLUTTEST_KO.md:216 |
| boardobjektiv-tier-steg2 | stale | — | BACKLOG.md:124 |
| varldsbilds-sektion-pausad | stale | — | BACKLOG.md:134 |
| forutsattningsfas-steg2-blockerad | klar | `16be8fe3` | BACKLOG.md:136 |
| boardassessment-kvittensrad-text | stale | — | BACKLOG.md:136 |
| offerselection-forlustdrivare | stale | — | BACKLOG.md:140 |
| ai-transferlogg | stale | — | BACKLOG.md:141 |
| ai-placeringstrend-diff | stale | — | BACKLOG.md:141 |
| ai-truppstyrka-snapshot | klar | — | BACKLOG.md:141 |
| ai-tranarbyten-anlaggningar | klar | — | BACKLOG.md:141 |
| seasonendgameview-ordningsbugg | stale | — | BACKLOG.md:141 |
| batchstack-vilande | klar | — | BACKLOG.md:167 + SLUTTEST_KO.md:171, 356 |
| kritisk-eventkanal-undertypsprioritet | stale | — | BACKLOG.md:168 |
| kritisk-eventkanal-kontraktstest | stale | — | BACKLOG.md:168 |
| inboxtoportal-karriarsmilstolpe | stale | — | BACKLOG.md:170 |
| contractdemands-devscen | klar | — | BACKLOG.md:172 |
| contractdemands-text | stale | — | BACKLOG.md:172 |
| klubbhistorik-rubrik-tvaklubb | klar | — | BACKLOG.md:173 |
| careerbreak-devscen | klar | — | BACKLOG.md:174 |
| peptalk-portalbeat-beslut | stale | — | BACKLOG.md:175, 33 |
| seasondecision-mall-mecenat-konflikt | stale | — | BACKLOG.md:181 |
| seasondecision-mall-captain-takecharge | stale | — | BACKLOG.md:181 |
| seasondecision-mall-captain-support | stale | — | BACKLOG.md:181 |
| seasondecision-mall-facility-build | stale | — | BACKLOG.md:181 |
| form-etikett-spelarform | stale | — | BACKLOG.md:195 |
| form-vof-rad | stale | — | BACKLOG.md:195 |
| managerfired-vag-osynlig | klar | — | BACKLOG.md:196 |
| cup-forlangning-fel-yta | klar | `c1588c02` | BACKLOG.md:201 |
| mostimproved-sasongsstartsnapshot | klar | — | BACKLOG.md:203 |
| mutationgate-filgrind-rackvidd | stale | — | BACKLOG.md:207 |
| talentsearch-createdround-latent | klar | — | BACKLOG.md:235 |
| riskysponsor-acceptedround-unused | klar | — | BACKLOG.md:236 |
| akademi-uppflyttning-inboxrad | stale | — | BACKLOG.md:248 |
| tenure-falt-joinedclubseason | klar | — | BACKLOG.md:260, 262 |
| o18-personrad-tenure-vagg | stale | — | BACKLOG.md:260 |
| pastaendekartan-43-forlorade | stale | — | BACKLOG.md:282 |
| forsoning-1-sync | stale | — | BACKLOG.md:353 |
| forsoning-forbered-wiring | klar | — | BACKLOG.md:354 |
| matchflow-ledger-namnhygien | klar | — | DOM_LIGGARE_COOLDOWN_GRANS_2026-09-02.md |
| forsoning-3-fixordning | stale | — | BACKLOG.md:355 |
| forsoning-5-adherence-regler | klar | — | BACKLOG.md:357 |
| b1-efter-forsoningen | stale | — | BACKLOG.md:363 |
| nodtrupp-playtest | klar | — | BACKLOG.md:386 |
| inkorg-ikoner-lucide | stale | — | BACKLOG.md:388, 404 |
| c1-sasong2-kurering-beslut | klar | — | BACKLOG.md:389 |
| clubmemory-facility-built-sasong | klar | — | BACKLOG.md:390 + SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| pitch-komponent-hopslagning | klar | — | BACKLOG.md:391 |
| hall-kommun-nej-onabart | klar | `7af505e8` | BACKLOG.md:161, 403 |
| hall-debatt-handler-gammal | klar | — | BACKLOG.md:161 |
| b1-nodstat-konsekvensrad | klar | — | BACKLOG.md:403 · KLAR `a9e61730` |
| semafor-emoji-svep | stale | — | BACKLOG.md:411, 476 |
| severity-skala-alla-ytor | stale | — | BACKLOG.md:411 |
| ekonomitab-inline-styles | stale | — | BACKLOG.md:418, 419 |
| incoming-raderas-gitrm | stale | — | BACKLOG.md:428, 469 |
| maskinell-audit-expansion | stale | — | BACKLOG.md:464 |
| scoreboard-b1-kommentar-token | klar | — | BACKLOG.md:481 |
| emoji-svep-contentgrep | klar | — | BACKLOG.md:483 |
| hallprovning-processteg-opusrunda | stale | — | BACKLOG.md:509 |
| valet-finansiering-underfraga | stale | — | BACKLOG.md:509 |
| taktik-kemilager | klar | `f8d769cc` | BACKLOG.md:514, 391 |
| b1-facilitytrad-domanmodell | stale | — | BACKLOG.md:529 |
| b1-sasongsplanering | stale | `5cc97e91` | BACKLOG.md:529 |
| b1-loneeskalering | stale | `d6c04980` | BACKLOG.md:529 |
| b1-kontextuella-sponsorer | stale | — | BACKLOG.md:529 |
| b1-halvarsrapport | stale | `d106b678` | BACKLOG.md:529 |
| b1-halldebatt-flersasong | stale | — | BACKLOG.md:529 |
| b1-preseason-ui-och-sprint2-5 | stale | — | BACKLOG.md:529 |
| c-t3-akademiflik | stale | — | BACKLOG.md:529 |
| c-t4-firstcap-event | stale | `f2bee6a4` | BACKLOG.md:529 |
| c-t5-externa-akademier | klar | — | BACKLOG.md:529 |
| c-t6-skolsamarbete | klar | — | BACKLOG.md:529 |
| c-hist1-klubbhistorik-berattelse | klar | — | BACKLOG.md:547 |
| c-m2-hornfrekvens | klar | — | BACKLOG.md:561 |
| c-m2-ht2-andel | klar | — | BACKLOG.md:561 |
| c-m2-malkap-spike | klar | `2c808b95` | BACKLOG.md:561 |
| c-m3-momentumriktning | klar | `5c855e1a` | BACKLOG.md:562 |
| c-m3-capartefakt | klar | — | BACKLOG.md:562 |
| fraga-b-trotthetsbaslinje | stale | — | BACKLOG.md:580 |
| c2-ai-formation-slots | klar | `b52534ff` | Rotfynd under C-FT1/C2-pass 2026-09-06 |
| rest-gold-tokens | stale | — | BACKLOG.md:615 |
| rest-smfinalprimary-guld | stale | — | BACKLOG.md:615 |
| rest-simsummary-tokens | stale | — | BACKLOG.md:615 |
| rest-crossfade-csp5 | stale | — | BACKLOG.md:615 |
| rest-dst1-tokensdoc | stale | — | BACKLOG.md:615 |
| rest-klubbminne-css | stale | — | BACKLOG.md:615 |
| rest-transfers-refaktor | klar | — | BACKLOG.md:615 |
| c-sy1-pilot2-journalistmemory | klar | — | BACKLOG.md:625 + DOM_JOURNALIST_EFTERKLANG_GRANS_2026-09-02.md |
| c-k1-firstcallup-memoryevent | klar | — | BACKLOG.md:632 + SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| liggare-prio2-akademiuppflyttning | klar | — | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| liggare-prio2-pensionering | klar | — | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| liggare-prio2-skandal | klar | — | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| liggare-prio1-clubmemory-konsument | klar | — | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| liggare-prio1-player-diary-milstolpar | klar | — | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| liggare-prio3-storyline-resolution | klar | — | DOM_STORYLINES_GRANS_2026-09-02.md + kodrevision 2026-09-03 |
| liggare-prio4-collectactivememories-retire | klar | `048db52b` | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md + kodrevision/git-historik 2026-09-03 |
| liggare-prio4-seasondecisioncandidates-retire | klar | `048db52b` | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md + kodrevision/git-historik 2026-09-03 |
| liggare-prio4-pastseasonsignatures-retire | klar | `44239aac` | SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md + kodrevision/git-historik 2026-09-03 |
| c-t8-signon-bonus | klar | `0f9581a6` | BACKLOG.md:638 |
| c-t8-boendebidrag | klar | `0f9581a6` | BACKLOG.md:638 |
| c-t8-jobbgaranti | klar | `0f9581a6` | BACKLOG.md:638 |
| c-t8-imagerights | klar | `0f9581a6` | BACKLOG.md:638 |
| c-t11-hantera-bud-tom | stale | — | BACKLOG.md:639 |
| c-t11-marknad-passivitet | klar | `ba9ccb6c` | BACKLOG.md:639 |
| c-tr1-klackfavoritchip | klar | `10e4fb65` | BACKLOG.md:645 |
| int-2-integrationsinventering | klar | — | BACKLOG.md:660 + SPEC_LIGGARE_MIGRERING_PRIORITERAD_2026-09-02.md |
| kf3-imminentskydd-vilande | stale | — | BACKLOG.md:673 |
| overlamning2-portal-orientering-punkt2 | stale | `9033c543` | OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md rad 33 + incoming-svep 2026-09-03 |
| overlamning2-treneracr-current-placering | klar | `73db9e36` | OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md rad 19 + incoming-svep 2026-09-03 (kod omgrep:ad, fortfarande 0 externa träffar på getArcMoodText/trainerArc.current) |
| overlamning2-weeklydecision-boardmeeting-konsolidering | klar | — | OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md rad 20 + incoming-svep 2026-09-03 (`resolveWeeklyDecision` fortfarande egen import i gameFlowActions.ts, ingen resolveEvent-koppling) |
| a15pp-rotorsak-tomma-events | klar | — | BACKLOG.md:376, 691 |
| d-st1-seasonaltone-tokens | stale | — | BACKLOG.md:693 |
| d-evt1-eventprimary-overlay | klar | `5e6c4888` | BACKLOG.md:697 |
| d-dedup1-fixture | klar | — | BACKLOG.md:698 |
| d-dedup1-spelare | klar | — | BACKLOG.md:698 |
| d-dedup1-styrelsemal | klar | — | BACKLOG.md:698 |
| d-rc-b-roundtrip-test | klar | — | BACKLOG.md:699 |
| e-m24-1-ej-committat | stale | — | BACKLOG.md:709 |
| e-scripts1-master | stale | — | BACKLOG.md:720 |
| e-scripts1-tacticenum | stale | — | BACKLOG.md:720 |
| e-scripts1-saknade-falt | stale | — | BACKLOG.md:720 |
| e-scripts1-sprint26audit | stale | — | BACKLOG.md:720 |
| e-scripts1-null-missmatch | stale | — | BACKLOG.md:720 |
| e-m4-1-playerpickersheet | klar | — | BACKLOG.md:725 |
| e-m4-1-klubbparmoverlay | klar | — | BACKLOG.md:725 |
| e-m4-1-efterklangthreadmodal | klar | — | BACKLOG.md:725 |
| e-m4-1-anslagoverlay | klar | — | BACKLOG.md:725 |
| e-m4-1-bidmodal | klar | — | BACKLOG.md:725 |
| e-m4-1-renewcontractmodal | klar | — | BACKLOG.md:725 |
| e-m4-1-wageoverrunwarning | klar | — | BACKLOG.md:725 |
| e-m4-1-bottomdock | klar | — | BACKLOG.md:725 |
| e-m4-1-onclick-div-sweep | klar | — | BACKLOG.md:725 |
| sluttest-ah4a-akademirader | stale | — | SLUTTEST_KO.md:43 |
| sluttest-ah4b-survive-text | stale | — | SLUTTEST_KO.md:44 |
| sluttest-ah4b-styrelseobjektiv-text | stale | — | SLUTTEST_KO.md:44 |
| sluttest-ah2b-commit | stale | — | SLUTTEST_KO.md:84 |
| sluttest-afac-traningshall | stale | — | SLUTTEST_KO.md:94 |
| sluttest-agrind-skelett | klar | — | SLUTTEST_KO.md:95 |
| sluttest-am9-finaluppladdning | klar | — | SLUTTEST_KO.md:98 |
| sluttest-ah9-builders | stale | — | SLUTTEST_KO.md:99 |
| sluttest-audit-repetition | stale | — | SLUTTEST_KO.md:18 |
| sluttest-o3-seasongoaltype-none | klar | — | SLUTTEST_KO.md:141, 976 |
| sluttest-o4-motstandaranalys | stale | `741cb16b` | SLUTTEST_KO.md:143, 1001 |
| sluttest-o4-inkorgsprioritering | klar | — | SLUTTEST_KO.md:143 |
| sluttest-o16-press-atervinningar | stale | `c3fa5c80` | SLUTTEST_KO.md:1075 |
| sluttest-o16-tempo-kondition | stale | `c74205fc` | SLUTTEST_KO.md:1075 |
| sluttest-o16-formation-ursprung | stale | — | SLUTTEST_KO.md:1075 |
| sluttest-o2-hesitantplayer | klar | `be7e3c53` | SLUTTEST_KO.md:941, 971 + DOM_O20_K3K5_KLASS_2026-09-02.md |
| sluttest-o9-comeback | stale | `eccbf56b` | SLUTTEST_KO.md:147, 1049 |
| sluttest-o9-underdog | stale | `eccbf56b` | SLUTTEST_KO.md:147, 1049 |
| sluttest-grind1-binar-met-failed | stale | — | SLUTTEST_KO.md:239, 352 |
| sluttest-bundle-produktbeslut | klar | — | SLUTTEST_KO.md:167, 745, 865 |
| sluttest-sparb-steg3 | stale | — | SLUTTEST_KO.md:168, 241 |
| sluttest-u9-valentropi | klar | — | SLUTTEST_KO.md:876 |
| sluttest-u9-textupprepning | klar | — | SLUTTEST_KO.md:877 |
| sluttest-u9-saverecovery | klar | — | SLUTTEST_KO.md:878 |
| sluttest-u9-avskedsfrekvens | klar | — | SLUTTEST_KO.md:879 |
| sluttest-u9-mattjanst-beslut | klar | — | SLUTTEST_KO.md:881, 884 |
| sluttest-u9-onboarding | stale | — | SLUTTEST_KO.md:881 |
| sluttest-u9-sasong1-arsbok | stale | — | SLUTTEST_KO.md:881 |
| sluttest-u9-retention | stale | — | SLUTTEST_KO.md:881 |
| sluttest-u9-delningsfunnel | stale | — | SLUTTEST_KO.md:881 |
| sluttest-domarcitat-loss-opus | stale | — | SLUTTEST_KO.md:171 |
| sluttest-devscenes-setstate | klar | — | SLUTTEST_KO.md:172 |
| sluttest-vercel-autoprod | klar | `fdedd509` | SLUTTEST_KO.md:173 |
| sluttest-tsconfig-scripts-ratchet | stale | — | SLUTTEST_KO.md:192 |
| sluttest-peptalk-hold | stale | — | SLUTTEST_KO.md:194 |
| sluttest-pastaende-38-fynd | stale | — | SLUTTEST_KO.md:196, 231 |
| sluttest-niva1-otaggade | stale | — | SLUTTEST_KO.md:224 |
| sluttest-niva1-builders | stale | — | SLUTTEST_KO.md:206 |
| sluttest-licens-inbox-opus | stale | — | SLUTTEST_KO.md:208 |
| sluttest-ekonomitab-lokal-stallning | klar | — | SLUTTEST_KO.md:209 |
| sluttest-ortentab-falsk-kommentar | klar | `16be8fe3` | SLUTTEST_KO.md:209 |
| sluttest-avskedsvarning-generisk | klar | — | SLUTTEST_KO.md:209 |
| sluttest-dubblettgrind-triage | stale | `8b9a211c` | SLUTTEST_KO.md:210 |
| sluttest-dubblett-attributes | klar | `2384bbb9` | SLUTTEST_KO.md:210 |
| sluttest-dubblett-pickarchetype | klar | `497c4415` | SLUTTEST_KO.md:210 |
| sluttest-dubblett-stringhash | klar | `adf95260` | SLUTTEST_KO.md:210 |
| sluttest-economyservice-utredning | stale | — | SLUTTEST_KO.md:212 |
| sluttest-d030-man-eval | stale | — | SLUTTEST_KO.md:212 |
| sluttest-aitransferlog-ui | klar | — | SLUTTEST_KO.md:213, 215 |
| sluttest-be-blind-trainerarc | klar | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-clubmemory | klar | `b9825dd2` | SLUTTEST_KO.md:214 |
| sluttest-be-blind-midseason | klar | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-seasoncontext | klar | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-media | stale | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-repmilestone | klar | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-matchmood | stale | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-peptalk | stale | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-sponsor | stale | — | SLUTTEST_KO.md:214 |
| sluttest-be-blind-demandengine | stale | — | SLUTTEST_KO.md:214 |
| sluttest-objektivminne-text | klar | — | SLUTTEST_KO.md:214 |
| sluttest-boardassessment-kvittensrad | klar | — | SLUTTEST_KO.md:215 |
| sluttest-forutsattningsfas-steg2 | klar | — | SLUTTEST_KO.md:215 |
| sluttest-skalsrader-steg2 | klar | — | SLUTTEST_KO.md:215 |
| sluttest-wagebudget-omrakning | klar | `b4f2da93` | SLUTTEST_KO.md:216 |
| sluttest-fanexpectation-dott | klar | `08dd8845` | SLUTTEST_KO.md:216 |
| sluttest-forutsattningsfas-design | stale | — | SLUTTEST_KO.md:216 |
| sluttest-mostimproved | klar | — | SLUTTEST_KO.md:218 |
| sluttest-veteran-seasonform | klar | — | SLUTTEST_KO.md:219 |
| sluttest-talentsearch-round | klar | — | SLUTTEST_KO.md:219, 222 |
| sluttest-roundsummary-round | stale | — | SLUTTEST_KO.md:222 |
| sluttest-referee-lastmatchround | stale | — | SLUTTEST_KO.md:222 |
| sluttest-riskmaturityround | stale | — | SLUTTEST_KO.md:222 |
| sluttest-acceptedround | klar | — | SLUTTEST_KO.md:222 |
| sluttest-decayperround | stale | — | SLUTTEST_KO.md:222 |
| sluttest-triggerround | stale | — | SLUTTEST_KO.md:222 |
| sluttest-niva3-browser | klar | — | SLUTTEST_KO.md:223 |
| sluttest-generateseasonverdict | stale | — | SLUTTEST_KO.md:225, 228 |
| sluttest-halftimemodal-forra-aret | stale | — | SLUTTEST_KO.md:228 |
| sluttest-annat-designfragor | stale | — | SLUTTEST_KO.md:228 |
| sluttest-cuprun-15ar | stale | — | SLUTTEST_KO.md:226 |
| sluttest-rivaltenureline | stale | — | SLUTTEST_KO.md:226, 227 |
| sluttest-ismaskin-tre-vintrar | stale | — | SLUTTEST_KO.md:226 |
| sluttest-cupmatch-5-5 | klar | — | SLUTTEST_KO.md:230 |
| sluttest-dinaval-forra-sasongen | klar | — | SLUTTEST_KO.md:230 |
| sluttest-arsbok-andraplats | klar | — | SLUTTEST_KO.md:230 |
| sluttest-raa-eventnycklar-koer | stale | — | SLUTTEST_KO.md:230 |
| sluttest-narrative-truth-grind | klar | `a3dd2151` | SLUTTEST_KO.md:230 + `SPEC_PASTAENDEGRIND_NIVA2_2026-09-06.md` |
| sluttest-b1-formationssystem | klar | — | SLUTTEST_KO.md:239, 1100, 1106 + BACKLOG.md:607 + DOM_FORMATIONER_BANDY_KANON_2026-09-02.md |
| sluttest-o13-jobbmarknad | stale | — | SLUTTEST_KO.md:239, 1061 |
| sluttest-o14-monetisering | stale | — | SLUTTEST_KO.md:239, 1062 |
| sluttest-o5-fyra-krav | stale | — | SLUTTEST_KO.md:241 |
| sluttest-o5-skutskar-kalibrering | stale | — | SLUTTEST_KO.md:241 |
| sluttest-o5-ar8-kriteriet | stale | — | SLUTTEST_KO.md:241 |
| sluttest-skutskar-high1 | stale | — | SLUTTEST_KO.md:241 |
| sluttest-factorymidseason-scener | stale | — | SLUTTEST_KO.md:253 |
| sluttest-tio-scener-registrering | stale | — | SLUTTEST_KO.md:255, 261 |
| sluttest-onadd-cornerinteraction | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-penaltyinteraction | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-counterinteraction | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-freekickinteraction | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-halftimemodal | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-coffeeroomscene | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-valetscene | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-journalistscene | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-cupintroscene | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-sundaytraining | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-seasonsignature | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-inboxscreen | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-historyscreen | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-championscreen | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-introsequence | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-playoffintro | klar | — | SLUTTEST_KO.md:257, 261 |
| sidofynd-gameheader-playoffbracket-legacy-save | klar | — | Codex dagsrapport 2026-09-03 §7 |
| sluttest-onadd-qfsummary | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-tilltrade | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-hallprovning | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-simsummary | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-nameinput | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-clubselection | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-phaseoverlay | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-bidmodal | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-renewcontract | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-callupmodal | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-efterklang | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-klubbparm | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-snowoverlay | klar | — | SLUTTEST_KO.md:257, 261; DOMLOGG_2026-08-31.md §D-2026-08-31-B |
| sluttest-onadd-ceremonysm | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-ceremonycup | stale | — | SLUTTEST_KO.md:257, 261 |
| sluttest-onadd-ceremonyretirement | klar | — | SLUTTEST_KO.md:257, 261 |
| sluttest-a2-tacticboardcard | stale | — | SLUTTEST_KO.md:286, 734 |
| sluttest-13-deploy-sync | stale | — | SLUTTEST_KO.md:448 |
| sluttest-14-cta-diffar | klar | — | SLUTTEST_KO.md:449, 456 |
| sluttest-14-kapitelpunkt | klar | — | SLUTTEST_KO.md:457 |
| sluttest-14-upptakt | klar | — | SLUTTEST_KO.md:458 |
| sluttest-arrival-devscen | klar | — | SLUTTEST_KO.md:475 |
| sluttest-25-delvis | klar | `852c6112` | SLUTTEST_KO.md:486, 496 + RECON_CHOICE_LABEL_SVANS_2026-09-08.md |
| sluttest-kommunens-villkor | stale | `1319403a` | SLUTTEST_KO.md:492, 920 |
| sluttest-bandyplay-nettoforlust | klar | — | SLUTTEST_KO.md:492 + SPEC_BANDYPLAY_STREAMING_OCH_BANDYSKOLA_2026-09-03.md |
| sluttest-kiosk-breakeven | klar | — | SLUTTEST_KO.md:492 |
| sluttest-julmarknad | stale | `1319403a` | SLUTTEST_KO.md:490, 492 |
| sluttest-mecenat-traningsdag | klar | — | SLUTTEST_KO.md:920 + DOM_PROMISE_CONSEQUENCE_KLASS_2026-09-02 |
| sluttest-mecenat-transferbudget | klar | — | SLUTTEST_KO.md:920 + DOM_PROMISE_CONSEQUENCE_KLASS_2026-09-02 |
| sluttest-mecenat-projektfinans | klar | — | SLUTTEST_KO.md:920 + DOM_PROMISE_CONSEQUENCE_KLASS_2026-09-02 |
| sluttest-31-browserverifiering | stale | — | SLUTTEST_KO.md:523 |
| sluttest-32-browserverifiering | klar | — | SLUTTEST_KO.md:530 |
| sluttest-33-arkivpost | klar | — | SLUTTEST_KO.md:598 |
| sluttest-41-standings-osakerhet | klar | — | SLUTTEST_KO.md:608 |
| sluttest-414-scentackning | klar | — | SLUTTEST_KO.md:621 |
| sluttest-415-browserverifiering | klar | — | SLUTTEST_KO.md:622 |
| sluttest-53-cup-lucka | klar | `d0f34cdc` | SLUTTEST_KO.md:675 |
| sluttest-playoffseries-straff | klar | `c1588c02` | SLUTTEST_KO.md:677 + Codex checkpoint 2026-09-01 |
| sluttest-kontrast-vs-divider | klar | — | SLUTTEST_KO.md:703 |
| sluttest-vscolor-derby | klar | — | SLUTTEST_KO.md:703 |
| sluttest-matchtypsmatris-grans | stale | — | SLUTTEST_KO.md:710 |
| sluttest-64-statusmotsagelse | stale | — | SLUTTEST_KO.md:748, 690 |
| sluttest-u7-banner | klar | — | SLUTTEST_KO.md:860 |
| sluttest-u7-zustand | klar | — | SLUTTEST_KO.md:860 |
| sluttest-d1-consequence-optin | stale | — | SLUTTEST_KO.md:892 |
| sluttest-d1-batchstack | stale | — | SLUTTEST_KO.md:892 |
| sluttest-d1-whynow-mecenat | stale | — | SLUTTEST_KO.md:892 + O11 |
| sluttest-d1-whynow-economicstress | stale | — | SLUTTEST_KO.md:892 + O11 |
| sluttest-d1-whynow-playerunhappy | stale | — | SLUTTEST_KO.md:892 + O11 |
| sluttest-d1-whynow-criticaleconomy | stale | — | SLUTTEST_KO.md:892 + O11 |
| sluttest-o2-materialarkorv | klar | `b4f2da93` | SLUTTEST_KO.md:965 |
| sluttest-renovate-wait | klar | `ad05884a` | SLUTTEST_KO.md:969 |
| sluttest-nothing-valet | klar | — | SLUTTEST_KO.md:969 |
| sluttest-o11-todo-rader | klar | — | SLUTTEST_KO.md:148, 1055 |
| sluttest-playerpraise-vila | stale | — | SLUTTEST_KO.md:1055 + DOM_PROMISE_CONSEQUENCE_KLASS_2026-09-02 |
| sluttest-o7-fler-sprakfel | stale | — | SLUTTEST_KO.md:1073 |
| sluttest-o20-politician-inclusion | klar | `8d1484e4` | SLUTTEST_KO.md:1218 |
| sluttest-o20-icamaxi | klar | `8d1484e4` | SLUTTEST_KO.md:1219 |
| sluttest-o20-awaytrip | klar | — | SLUTTEST_KO.md:1220 + DOM_O20_K3K5_KLASS_2026-09-02.md |
| sluttest-o20-lotto | klar | — | SLUTTEST_KO.md:1221 |
| sluttest-o20-q1 | klar | `8d1484e4` | SLUTTEST_KO.md:1222 |
| sluttest-o20-politician-warning | klar | — | SLUTTEST_KO.md:1223 + DOM_O20_K3K5_KLASS_2026-09-02 |
| sluttest-o20-gentjanst | klar | — | SLUTTEST_KO.md:1224 + DOM_O20_K3K5_KLASS_2026-09-02 |
| sluttest-o20-q2 | klar | — | SLUTTEST_KO.md:1225 + DOM_O20_K3K5_KLASS_2026-09-02 |
| sluttest-o20-omprovning | klar | `8d1484e4` | SLUTTEST_KO.md:1081, 1231 + DOM_O20_K3K5_KLASS_2026-09-02.md |
| sluttest-b6-getpositionfit | klar | — | SLUTTEST_KO.md:1118 |
| sluttest-b10-zonmarkering | klar | — | SLUTTEST_KO.md:1132, 1145 |
| sluttest-b3-ui-yta | klar | `70f474e0` | SLUTTEST_KO.md:1110 |
| sluttest-illustration-sarg | klar | — | SLUTTEST_KO.md:1155 |
| sluttest-b12-konsument-b5 | klar | `c3fa5c80` | SLUTTEST_KO.md:130, 1200, 1212 + Playtest Taktik 2026-09-03 |
| sluttest-regressionsvit-1 | klar | `acff6f6f` | SLUTTEST_KO.md:356 |
| sluttest-regressionsvit-15 | stale | — | SLUTTEST_KO.md:356 |
| sluttest-avskedsvagar-yta | stale | — | SLUTTEST_KO.md:372 |
| sluttest-heros-designfraga | klar | — | SLUTTEST_KO.md:370 |
| sluttest-backlog-pekare | klar | — | SLUTTEST_KO.md:267 |
| centralredaktoren-surfacing-koordinator | klar | — | DOM_CENTRALREDAKTOREN_2026-08-31.md |
| sponsor-motbud-reservation-walkaway | klar | `c1588c02` | DOM_SPONSOR_MOTBUD_2026-08-31.md |
| ekonomi-kapacitetsmattning-diagnos-motsagd | klar | — | DOM_FRAMGANGSEKONOMIN_UPPSIDAN_2026-08-31.md (DIAGNOS REVIDERAD) |
| ekonomi-financelog-gap-kommunstod-overpayment | klar | — | financelog-gap-diagnos-2026-09-01.ts |
| ekonomi-vaga-matchrevenue-mattning | klar | — | DOM_FRAMGANGSEKONOMIN_UPPSIDAN_2026-08-31.md (VÄG A VALD) |
| liggare-moment-ripple-deduplicering | klar | — | Codex kodrevision 2026-09-03 |
| efterklang-klackvikt-skala | klar | — | Codex kodrevision 2026-09-03 |
| design-b1-undefined-kontrakt | klar | — | Designgranskning 2026-09-03 B1 |
| design-b2-opus-knapp-motbud | stale | `c1588c02` | Designgranskning 2026-09-03 B2 |
| design-b3-kr-tkr-lonesankning | klar | — | Designgranskning 2026-09-03 B3 |
| design-b4-simulera-bar-fotkrock | klar | `b8dd0021` | Designgranskning 2026-09-03 B4 |
| design-d1-granska-heroscore | klar | `a3044daf` | Designgranskning 2026-09-03 D1 + Redesign 2026-09-03 skärm 01 |
| design-d2-sasongsformat-tre | klar | `4e4f3542` | Designgranskning 2026-09-03 D2 · KLAR `4e4f3542` |
| design-d3-berattelse-utfall | klar | `2d159de3` | Designgranskning 2026-09-03 D3 |
| design-d4-primary-utspadd | stale | `6c72267d` | Designgranskning 2026-09-03 D4 |
| design-d5-straff-cta-rod | klar | — | Designgranskning 2026-09-03 D5 |
| design-d6-rivalitet-nemesis-dubbel | klar | `a1cbfb76` | Designgranskning 2026-09-03 D6 |
| design-d7-bottennav-sju | klar | `35b942ca` | Designgranskning 2026-09-03 D7 |
| design-d8-efterklang-platt | stale | `68368ce5` | Designgranskning 2026-09-03 D8 |
| design-p2-vader-emoji-hero | klar | `7fb32e7a` | Designgranskning 2026-09-03 P2 |
| design-p3-mecenat-dubbelrubrik | klar | `213a1c97` | Designgranskning 2026-09-03 P3 |
| design-p5-namn-cta-token | stale | — | Designgranskning 2026-09-03 P5 |
| design-sidofynd-btncopper-dubblett | klar | `7a6e8d17` | Sidofynd vid design-p5-utredning 2026-09-03 (Code) |
| design-styrkor-ror-inte | klar | — | Designgranskning 2026-09-03 |
| taktik-funktionellt-svep-d7303c82 | klar | — | Playtest Taktik 2026-09-03 + Codex d7303c82 |
| taktik-ultra-kombinationskostnad | klar | `d117d166` | Playtest Taktik 2026-09-03 HIGH 2 · KLAR `d117d166` |
| taktik-formation-kosmetisk-mental-modell | klar | — | Playtest Taktik 2026-09-03 |
| taktik-ultra-offensiv-etikett | stale | — | Playtest Taktik 2026-09-03 + Codex svep |
| formationer-v2-scripts-utanfor-tsconfig | klar | `2c8c7baa` | Codes V2-rapport 2026-09-04 |
| taktik-fyll-elvan-tre-lagen | klar | `fd00cd0e` | Playtest Taktik 2026-09-03 MEDIUM 2 |
| taktik-trotthet-klippa | stale | `c3fa5c80` | Playtest Taktik 2026-09-03 MEDIUM 3 |
| taktik-positionsfarger-kosmetiska | stale | `7980e385` | Playtest Taktik 2026-09-03 |
| klubb-flikar-overflod | klar | `35b942ca` | Kodläsning ClubScreen.tsx 2026-09-03 + design-d7 |
| flode-01-klubbparm-bromsar | stale | — | Flödet 2026-09-03 resa 01 · STALE, kodverifierad mot `eb0e3cd0` |
| flode-03-bindvav-utfall | stale | — | Flödet 2026-09-03 resa 03 |
| flode-04-triumf-artal | stale | — | Flödet 2026-09-03 resa 04 · STALE genom `4e4f3542` |
| flode-principer-snyggare | klar | — | Flödet 2026-09-03 |
| liggare-konsumentkarta | klar | — | RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md + RAW |
| liggare-k1-enad-minneslasare | klar | — | Konsumentkartan §1, §9 #1 |
| liggare-k2-arsdagar-ur-liggaren | klar | — | Konsumentkartan §3c, §9 #2 |
| liggare-k3-vymallar-tysta | klar | — | Konsumentkartan §10 |
| liggare-k4-orsak-verkan-yta | klar | — | RAW Tabell 2 + Konsumentkartan §8 fynd 1 |
| liggare-k5-patron-withdrawal-producentbugg | klar | — | RAW Tabell 1 |
| liggare-k6-arsbok-liggarposter | klar | — | Konsumentkartan §3b, §9 #6 |
| liggare-k7-beslutsminne | klar | — | Konsumentkartan Tier C, §9 #7 |
| liggare-k8-portal-laser-liggaren | klar | — | RAW Tabell 2 avstämning + SPEC_BERATTAREN §5 steg 3 |
| liggare-k9-doda-typer | klar | — | RAW Tabell 1 + Konsumentkartan §11 |
| kronikan-matchminne-aldrig-fungerat | klar | — | k10-verifiering 2026-09-04 |
| liggare-k10-fixture-gallring | klar | — | Konsumentkartan §3a |
| liggare-k11-pressen-laser-liggaren | klar | `fcce330a` | RAW Tabell 2 + SPEC_BERATTAREN §5/§7 steg 7 |
| berattaren-kafferummet-laser-liggaren | klar | `fcce330a` | SPEC_BERATTAREN §5/§7 steg 8 |
| karriarbyte-managed-club-switch | klar | `c8b1fc76` | GPT minnes-slutprov 2026-09-04 + Codex åtgärdspass |
| transfer-codex-svep-9bbe3cb9 | klar | — | Playtest Transfer 2026-09-04 + Codex 9bbe3cb9 |
| transfer-kontraktsfacit-kvar | stale | `9bbe3cb9` | Playtest Transfer 2026-09-04 HIGH 4 |
| transfer-budget-visning | klar | `c9646fc1` | Playtest Transfer 2026-09-04 HIGH 3 |
| transfer-scouting-tidsbesked-1-2 | klar | `c9646fc1` | Playtest Transfer 2026-09-04 MEDIUM 1 |
| transfer-scouting-falsk-precision | klar | `6b93c290` | Playtest Transfer 2026-09-04 |
| minne-codex-svep-slutprov | klar | `a3dd2151` | Slutprov 2026-09-04 + Codex |
| berattaren-paraply | klar | — | Slutprov 2026-09-04 |
| berattaren-grund-steg1-2 | klar | `c4552838` | SPEC_BERATTAREN_2026-09-04 §3–§6, steg 1–2 + DOM_LIGGARE_CLUBID |
| berattaren-beats-idempotens | klar | `fcce330a` | Slutprov 2026-09-04 rek 2 + 6 |
| berattaren-en-kronologi | klar | `98c68f95` | Slutprov 2026-09-04 rek 3 |
| berattaren-arsbok-rankning | klar | — | Slutprov 2026-09-04 rek 4 |
| berattaren-callbacks | klar | — | Slutprov 2026-09-04 rek 5 |
| berattaren-aterfall-ersatter-intro | klar | `fcce330a` | Slutprov 2026-09-04 rek 6 |
| minne-kontraktskollaps-mal | stale | `bc1ba3c7` | Slutprov 2026-09-04 Medium · VERIFIERAD `bc1ba3c7` |
| minne-sponsor-knappar-kvar | klar | — | Slutprov 2026-09-04 High |
| minne-det-som-bar | klar | — | Slutprov 2026-09-04 |
| stickiness-etapp-1a | klar | — | Codex 2026-09-04 |
| stickiness-categoryfor-tre-kallor | klar | `ef2fb829` | Opus-dom 2026-09-06 (grundad läsning av narrativePushAdapter.ts + narrativePushCopyResolver.ts) |
| stickiness-settings-kategorier | klar | — | Recon 2026-09-06 + Design-mock 2026-09-07 + Opus etiketträttelse 2026-09-07 |
| stickiness-avregistrering-yta | klar | — | Jacob 2026-09-07 ("hoppa mocken, ge Code raden direkt") |
| stickiness-meaningful-action | klar | — | Implementation |
| stickiness-notification-history | klar | — | Implementation |
| stickiness-npm-audit | klar | `2e259031` | Implementation §Verifiering |
| illustrationssvit-laddar-inte | klar | — | Codex rapport 2026-09-04 |
| akademi-codex-fix | klar | `5db04f75` | GPT HIGH 1, HIGH 2, MEDIUM 1, 4, 5 + delar av HIGH 3 |
| akademi-junior-fyller-20 | klar | — | DOM_AKADEMI_LIGGARE §4 |
| akademi-det-som-bar | klar | — | GPT §Det som fungerade |
| burnout-relief-och-tak-samtidigt | klar | `ed81841f` | GPT styrelse-test 2026-09-04 |
| granska-nasta-match-efter-uttag | klar | `89f9f485` | GPT styrelse-test 2026-09-04 |
| header-slutspelskontext-uttag | klar | `ed81841f` | GPT styrelse-test 2026-09-04 |
| arsbok-dina-val-licensstatus | klar | — | GPT styrelse-test 2026-09-04 |
| arsbok-managersektion-kuratering | klar | `89f9f485` | GPT styrelse-test 2026-09-04 |
| ai-transfer-dubbelflytt | klar | `ed81841f` | GPT styrelse-test 2026-09-04 |
| nostalgibrev-alder-ar | klar | `89f9f485` | GPT styrelse-test 2026-09-04 |
| styrelse-det-som-bar | klar | — | GPT §Det som fungerade |
| liggare-ny-board-verdict | klar | `5e5f1e5e` | Omspårning §3 |
| liggare-ny-license-event | klar | `649c82c2` | Omspårning §3 |
| liggare-ny-community-shift | klar | `81a512bc` | Omspårning §3 |
| liggare-ny-facility-trial-outcome | klar | `81a512bc` | Omspårning §3 |
| liggare-ny-letter | klar | `613204ca` | Omspårning §3 + SPEC_BERATTAREN §5 |
| liggare-ny-personal-goal-set | klar | — | Omspårning §3 + DOM_LIGGARE_CLUBID |
| rostintro-grind-och-roster | klar | `ce05fc15` | DOM_ROSTINTRODUKTIONER_2026-09-06.md + SPEC_ROST_ROSTER_2026-09-06.md |
| systemaudit-codex-atgardat | klar | `d1943978` | Systemaudit §Åtgärdsstatus |
| survive-avsked-undantag | klar | `d1943978` | Systemaudit HIGH 1 + Codex åtgärd |
| arsbok-generisk-beslutssats | klar | — | Systemaudit HIGH 5 |
| arsbok-skuld-recurringcost | klar | — | arsbok-generisk-beslutssats (`bd9134b9`) + Opus dom 2026-09-06 |
| ci-visuella-baselines-rod | klar | `3cd208f7` | Systemaudit §Leverans-/CI-not + GitHub Actions 34040419661/34040569759 |
| matchflode-forbered-linjar | klar | — | Jacobs matchflöde-order 2026-09-07 + Design-mock `Forbered-flode.dc.html` (levererad, godkänd) |
| ci-baselines-steg0-export | klar | `4e4f3542` | `DESIGN_UPPDRAG_CI_BASELINES_2026-09-06.md` steg 0 |
| ci-baselines-m1-illustrationsprogram | klar | `c4552838` | `CI Baselinedom.dc.html` §M1 |
| ci-baselines-m2-transferbudgethuvud | klar | `c9646fc1` | `CI Baselinedom.dc.html` §M2 |
| ci-dedup-ledgereko | klar | `29345071` | Lokalt `npm run lint:duplicate-functions` + GitHub Actions 34040569759 |
| ci-visuell-harness-attention-proxy | klar | `29345071` | GitHub Actions 34040419661/34040569759 |
| ci-en-primary-ekonomi-dubbel | klar | `29345071` | GitHub Actions 34040419661/34040569759 |
| systemaudit-det-som-bar | klar | — | Systemaudit §Sådant som fungerade |
| choice-weeklydecision-exhaustiveness | klar | `7e2bec7a` | RECON_CHOICE_LABEL_SVANS_2026-09-08.md §Tre egna MASTER-rader — sluten 14-id-katalog, exhaustiv resolver och högt fel för okänt id; 34 fokustester + TypeScript + build gröna |
| sluttest-heros-licensnekan | stale | `acff6f6f` | AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.md — ursprungsfyndets 100 % kom från en kalibreringsspelare som lämnade beslut obesvarade; rättad policy gav Heros 59,00 % över 10 000 seeds, inom låst mål 55–65 %, med licens och sport fortsatt separata |
| stickiness-attention-ar-en-yta | klar | `7ede151b` | SPEC_BERATTAREN_2026-09-04.md §Push — narrativ återkomst går via `redaktoren()`/`ledgerTold`, kalender och tabell via egna deklarerade källor, endast matchförberedelse är självständig; kvarvarande copyfamiljer spåras separat i `stickiness-copy-roster`; 37 fokustester gröna |
| sluttest-klippan-rotorsak | stale | `404176f6`/`afa52a86` | `KLIPPKONTROLL_COMMUNITYSTANDING_70_71_2026-09-08.md` — den gamla 95→10-klippan gick inte att reproducera efter att dubbla licenseReview-systemet pensionerats och testspelaren börjat besvara pendingEvents; modernt parat 20-seedsprov gav Heros 50 % vid både 70 och 71 |
| sluttest-licens-ryktesskala | klar | `3b78737e` | `AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.md` — A-kedjan nådde alla låsta mål utan parameterändring; skalan −5, ytterligare −5 per 50 000 kr, tak −30 är nu namngiven i `licenseService.ts` och exakt låst av sex tabelltest; 36 fokustester, TypeScript och build gröna |
| inv-4-meritbuffert-magnituder | klar | `3b78737e` | `AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.md` — `MERIT_BUFFER_CAP=20` ingick i den godkända A-kedjan och behölls när stoppvillkoret nåddes utan parameterändring; intjäning, tak, absorption och historiska seed 70014-scenariot täcks av 102 gröna fokustester, TypeScript rent |
| pt2-liga-advance-otestad | klar | `112551ac` | `PLAYTEST_LIGA_LIVE_SNABB_GRANSKA_2026-09-08.md` — riktig browser: live→Granska gav tabell S 1 och snabbresultat→Granska gav S 2; playtestet fångade och rättade Granska-headerns nästa-rond-fel samt `.jpg`/`.webp`-felet som dolde klubbilder i motståndarvinjetten; 17 fokustester och full build gröna |
| choice-sell-star-utan-spelare | klar | `8a36ba12` | `DOM_CHOICE_SELL_STAR_OCH_TRANSFERAVSLAG_2026-09-08.md` — sell_star filtreras bort ur `economicCrisisService.ts` när ingen säljbar icke-legendspelare finns, brödtextens vägantal härleds ur faktiska choices, tomt säljspår erkänner klämman i texten; `eventResolver` orört; 4 nya + 23 fokustester, tsc och full build gröna |
| choice-transferavslag-dold-moral | klar | `33cc53f5` | `DOM_CHOICE_SELL_STAR_OCH_TRANSFERAVSLAG_2026-09-08.md` — reject-valets subtitle i `eventFactories.ts` deklarerar nu `Spelaren stannar · risk för missnöje` ordagrant; `round(5 × transferRejectMoraleWeight)`-mekaniken oförändrad; regressionstest på den låsta strängen, tsc och full build gröna |
| avbrottsbudget-d | klar | `ca419fb0` | `CODE_ORDER_KF3_AVBROTTSBUDGET_2026-06-22.md` — post-ARCH har en gemensam slutlig chokepunkt och fick en omfit: tre actionable per omgång, tidigare kö först, deadlines skyddas, informationsband passerar, inga beslut tappas och Portal visar `N beslut väntar`; 54 fokustester och full build gröna |
| sluttest-validering-berattelsekort | stale | `80fc3226` | SLUTTEST_KO.md:1268 — uttryckligen parkerad och "inte i kön" sedan Jacobs dom 2026-09-03; hör under den fortsatt aktiva O10-prioriteringen, inte som egen releasepost |
| sluttest-validering-slottsbron | stale | `80fc3226` | SLUTTEST_KO.md:1268 — uttryckligen parkerad och "inte i kön" sedan Jacobs dom 2026-09-03; hör under den fortsatt aktiva O10-prioriteringen, inte som egen releasepost |
| sluttest-validering-bruksliga | stale | `80fc3226` | SLUTTEST_KO.md:1268 — uttryckligen parkerad och "inte i kön" sedan Jacobs dom 2026-09-03; hör under den fortsatt aktiva O10-prioriteringen, inte som egen releasepost |
| c-ft1-fitnessfloor-tuning | klar | `fd76cf5e` | BACKLOG.md:586 — AI:ns separata 40/60/8-rotation pensionerad; AI och spelarens autofyllnad delar nu domain-lagrets fitnessgolv 22, matchformspoäng och fallback för tunn trupp. 31 fokustester + full build gröna; C2-smoke 100/100 säsongspar, staplad −0,44 p mot balanserad, inga walkovers |
| kf3-beslutsbudget-playtest | klar | `736c10f9` | BACKLOG.md:673 — deterministisk produktvy med fem samtidiga beslut verifierad i browser: `3 aktiva · 2 beslut väntar`, därefter `3 · 1` efter första resolve och `3 · 0` efter nästa; FIFO fyller lediga platser utan tapp. 28 fokustester och full build gröna |
| kf4-styrelse-playtest | klar | `4bc7827c` | BACKLOG.md:674 — browser verifierade Ankomsten med Skutskärs Birgit Lundkvist/kassör och Lennart Höglund/ledamot samt BoardMeeting A/B/C med Margareta Sahlin/ordförande konsekvent. Aktuell copy är pronomenneutral; båda ytorna läser `game.board`, och ett regressionsprov låser resolvernamnet mot den kanoniska ordförandeposten. 43 fokustester och full build gröna |
| bygget-flik-tillbakapil | stale | `f9a386d4` | BACKLOG.md:508 — premissen beskrev juniarkitekturen där Bygget var bottennavflik. Efter design-d7 bor kanoniska Bygget under Klubb som markerad underflik; `/game/bygget` och `/game/facility` är djuplänkar och FacilityScreen visar alltid `← Tillbaka`. Båda aktuella vägarna browser-verifierade, routerkommentaren rättad, TypeScript rent |
| orten-pilar-playtest | klar | `cbd02f7e` | BACKLOG.md:419 — browser verifierade `Ekonomi →` från Orten till rätt aktiveringsflik samt aktivt statuskvitto: efter aktivering försvinner knappen, raden får `✓` och kommunagendan uppdateras. Render-test låser att aktiva engagemang saknar Ekonomi-pil medan inaktiva behåller den. 5 fokustester och full build gröna |
| ceremoni-heron-glanstitt | klar | `b9624b64` | BACKLOG.md:395 — riktig browsergranskning i 390-läge av SM-ceremoni, SM-segerscen, cupseger, cupceremoni och ChampionScreen: Lucide-trofén är tydlig på mörk, illustrerad och ljus fond; guld, glow/puls och konfetti fungerar utan att konkurrera med rubrik eller handling. Ingen kodändring krävdes |
| b6-buryfen-footer-logo | klar | `a1556993` | BACKLOG.md:493 + design-system/DESIGN-DECISIONS.md B6 — studiomärket finns nu exakt på de två ratificerade ytorna: introvinjett S0 och namn-sidans mörka footer; den felaktiga S1-dubbletten är borttagen. Browser verifierade båda lägena; 2 regressionsprov, TypeScript och full build gröna |
| clubscreen-tab-emoji-konsekvens | stale | `be2873f4`/`35b942ca` | BACKLOG.md:426 — den gamla antingen/eller-frågan är redan löst av den delade TabIntro-modellen: ClubScreen har sex rena textflikar, medan emoji enbart ligger i det separata intro-/domänkategorilagret. Browser verifierade alla sex faktiska tablabels; ingen kodändring krävdes |
| inv-3-sprint22-14-delbd | stale | `6695491c`/`f85acb5d` | INVENTERING_2026-08-31.md:89 — alla tre gamla öppna frågor är överspelade: senare palette-audit och semantiska tokens har stängt driftfrågan; ANTECKNINGAR är inte längre en flik utan ett alltid synligt kort; uppställningsval skriver direkt till `club.activeTactic` via Zustand-persistensen och behöver ingen separat standardknapp. Kod, historik och persistensväg verifierade 2026-09-08; ingen kodändring krävdes |
| b4-designdel-ej-gjord | stale | `113f0af9` | BACKLOG.md:531 — den skördade raden läste en äldre statusnotis. B4:s transfer-designcleanup levererades uttryckligen på main: cirka 110 inline-stilar extraherades till `transfers.css`, sju transferfiler ändrades och auditens designblock behandlades. Commitens ancestry och diff samt BACKLOG:s senare P2-leveranstabell verifierade 2026-09-08; ingen ny kodändring krävdes |
| sluttest-14-forbaseline | stale | `4de165a1`/`dc07f5ef`/`2e358abc` | SLUTTEST_KO.md:459 — de tre tidigare obekräftade Granska-diffarna är sedan länge baselinerade och skyddade: shotmap fick Linux-baseline 2026-08-18, spelare ingick i den motiverade 2026-09-04-seedningen och analys ingick i Designs granskade 65-diffarsrunda 2026-09-07. `visual-baselines.yml` och efterföljande app-CI är gröna; ingen ny baseline eller kodändring krävdes 2026-09-08 |
| sluttest-o8-prosapooler | stale | `c9ea066e` | SLUTTEST_KO.md:1048 — fast-lägets saknade prosa levererades redan 2026-08-12: separata utfallsrader för final, slutspel och avsked, inklusive senare oavgjord avskedsgren, används av `GranskaOversikt` via `generateQuickSummary`; 12 fokustester gröna vid återverifiering 2026-09-08. Turneringsläge mitt i serie och Sommarens saknade typer förblir separata öppna O8-rader |
| sluttest-o8-sommaren-typer | stale | `0d617cef` | SLUTTEST_KO.md:1048 — Sommarens rapportera-först-fråga besvarades och byggdes redan i 5.1-leveransen: `SeasonTransitionEvent` är en sluten fyrtyp med prioriterade, låsta rader för kontraktsutgång, pension, åldrande och akademiuppflyttning; alla fyra skrivvägar är wirade. 61 fokustester gröna vid återverifiering 2026-09-08 |
| c-sy1-portalhierarki | stale | `fdd3e8c8`/`ea82674c`/`1e1e05b4`/`3ff48bc3`/`7009677b` | BACKLOG.md:625 + SYNLIGHET_PRINCIP_OCH_STATUS.md — majpremissen om ett ogjort ingrepp med en primär och en sekundär är överspelad av den senare Portal-arkitekturen. `buildPortal` garanterar och typdeklarerar exakt ett primärkort, separat ensam story-slot, 0–3 sekundära och 0–4 minimala; beslutstiering, endgame-kurering och en-primary-regeln är egna explicita grindar. 41/41 PortalBuilder/PortalScreen-tester gröna 2026-09-08; ingen kodändring krävdes |
| liggare-k12-missad-varvning-mot-dig | klar | `c71b4d3e` | `DOM_K12_TRANSFER_TARGET_MISSED_2026-09-08.md` — ny EventLedgerType `transfer_target_missed` (inte en fjärde TransferRole), producent i `processTransferBids` (subject=jagad spelare, subject2=hans klubb vid budtillfället), konsument `selectMissedTargetCallback` (reviewCallbackService.ts) med domens låsta text ordagrant; registrerad i REVIEW_TYPES + momentKind/momentFamily. 9 nya tester, full svit 4030/4030, tsc och build gröna |
| akademi-liggare-dom | klar | `49421ba3`/`87671c8a`/`674efd37`/`18c5345d`/`3a282252`/`83728b52` | `DOM_AKADEMI_LIGGARE_2026-09-04.md` + `DOM_LANEKLUBB_IDENTITET_2026-09-08.md` — alla åtta akademityper har producenter och deklarerade konsumenter; snapshots överlever spelare/externa klubbar, lån bär faktisk attribution och årsboken fryser högst tre significance-rankade akademirader. Krönikan och Berättaren läser samma kanon; separat ekonomirad kvarstår i `akademi-ekonomirad`. 94 riktade låne/K12-test + 79 akademi/minnestest, TypeScript och två fulla buildkörningar gröna |
| akademi-ekonomirad | klar | `dff5cac9` | `DOM_AKADEMI_LIGGARE_2026-09-04.md` §5 + `AKADEMI_TVASASONG_SOLVENS_2026-09-08.md` — 2/5/10 tkr per omgång delar nu en kanonisk prisfunktion mellan faktisk kassamutation, finanslogg, prognos och Akademi-vy; årsboken fryser den låsta kostnads-/utfallsraden. D2-mätningen godkände 9/9 tvåsäsongskörningar utan parameterändring; 4 864 tester och full build gröna |
| fornyelse-pris-slutdom | klar | `e0013a86`/`6b0a8f3e` | `DOMLOGG_2026-08-31.md` D-2026-09-02-G — Jacob hade redan beslutat att behålla −45 tkr/säsong och stänga frågan; near-equilibrium är det avsedda valet där båda vägarna kostar. Kodkontroll 2026-09-08 bekräftade att `ACTIVITY_RENEWAL_BASE_COST=10_000` och den mätta väg C-modellen står orörda; MASTER-raden var en missad arkivering, ingen kodändring krävdes |
| askadare-golvandel-generellt | klar | `085f9dab`/`3b78737e` | `RAPPORT_ASKADAREKONOMIN_V2_MATNING_2026-08-27.md` + den kanoniska motiveringen i `economyService.ts` — Jacob hade redan uttryckligen dömt att 50-procentsgolvet inte ska höjas för Heros; dyra tiers får vara olönsamma för den publiksvagaste klubben och ett klubbunikt plusgolv vore en specialregel. Den formella 40 000-karriärskalibreringen körde exakt `FLOOR_SHARE_OF_RUNNING_COST=0.5` och nådde samtliga låsta mål utan parameterändring; ingen kodändring krävdes |
| erbjudanden-latt-fallback-felmarkt | stale | `dff5cac9` | Preliminärt sidofynd i akademins D2-mätning, falsifierat i det obligatoriska verifieringssteget 2026-09-08. Kanoniska `getDifficulty` ger två LÄTT-klubbar (Forsbacka 90, Västanfors 83), sex MEDEL och fyra SVÅR; seeds 3/11/29 valde en äkta klubb ur varje grupp och aktiverade aldrig reservvägen. Akademirapporten rättades; ingen kodändring eller produktdom behövdes |
| inv-2-14d-illustration-nyar | klar | `2436f69f` | `nyår_scene.jpeg` godkändes mot den låsta prompten, komprimerades till 1204×2157/386 KB som `public/assets/illustrations/nyar.jpg` och kopplades till `nyar` i MatchLaddningScene. En egen dev-scen och regressionstest lades till; 23 fokustester, full build och riktig browsergranskning i 390-läge gröna |
| fable-scen-konst | klar | `aed270cb`/`2436f69f` | Paraplyets fyra namngivna moment är nu terminala: cup, derby och premiär låg sedan tidigare i `aed270cb`; nyår levererades och kopplades in i `2436f69f`. Alla sex aktuella matchladdningstillfällen har egna assets, med motståndarbild/typografisk fond kvar som framtida fallback |
| flode-02-loop-andning | stale | `a57cecda` | Källan ger rytmargumentet för exakt samma tysta ytor som `design-p1-tysta-ytor`, och MASTER-raden sade redan uttryckligen “Ingen egen åtgärd — p1 bär den”. Originalrapportens konkreta råd om kafferum/cupintro ingår i P1:s illustrations- och kompositionsarbete; separat implementering skulle dubbelräkna samma leverans |
| minne-avsked-motsager-historik | klar | `38cdc971` | `TEXTLEVERANS_OPUS_2026-09-08.md` — Game Overs `licenseDenied`-gren återger nu det verkliga administrativa skälet ordagrant i stället för generisk eller sportslig avskedstext. Samma frusna `boardTruth` avgör grenen; 107 fokustester, TypeScript, full build och fyra lintgrindar gröna |
| sluttest-o8-turneringslage | klar | `baad4aa7` | `TEXTLEVERANS_OPUS_2026-09-08.md` — Granska visar nu låst live-läge mitt i en pågående bäst-av-fem-serie via befintlig `getPlayoffSeriesContext`, utan ny state-mekanism. 54 fokustester, TypeScript och full build gröna; browserprov i 390-läge visade `Serien står 1–0. Det avgörs inte ikväll, men det väger.` i det kanoniska TURNERINGSLÄGE-kortet |
| atermatch-sparar-inte-minut | klar | `21a5b51c` | En pågående live-fixtur sparar nu aktuell stegserie, stegindex och visad minut som en enda durabel `liveMatchProgress`; återöppning hydreras pausad från samma faktiska matchresa och den gemensamma sluttransaktionen rensar markören. 12 fokustester, TypeScript och full build gröna. Riktigt browserprov: paus 1–0/minut 15 → flik stängd → direkt `/game/match/live` utan router-state → 1–0/minut 15 pausad → fortsatt till minut 18, inte avslag |
| lobbypress-mekanik-spec | klar | `00775d6a` | `TEXTLEVERANS_OPUS_2026-09-08.md` — Jacobs 2026-09-07-beslut (nedgradera till flavour) verkställt: `LOBBY_PRESS`s gamla interaktiva accepted/declined-text (som aldrig fick ytas automatiskt, INSTRUKTIONER_2026-09-08) ersatt av `LOBBY_PRESS_FLAVOUR`, en passiv journalistnotis utan choices. Wirad i `nationalTeamProcessor.ts`s befintliga `isLandslagsuppehall`-block för en kvalificerad spelare som `CALLUP_CAP` trängde ut — deterministisk, samma konvention som resten av landslagsundersystemet. 4 nya tester, tsc och full build gröna |
| transfer-arsbok-minns-fel | klar | `384797da` | `DOM_K12_TRANSFER_TARGET_MISSED_2026-09-08.md` + `TEXTLEVERANS_OPUS_2026-09-08.md` — Del 2 (den enda kvarvarande blockeraren, en låst årsboksmening från Opus) wirad: `transfer_target_missed` läggs till `YEARBOOK_PERSON_TYPES`, ny switch-gren i `yearbookPersonText` renderar registrets rad ordagrant. Ingen ny mekanik (typen fanns sedan `c71b4d3e`). Scope-flaggan i radens historik ("inga fler system före release") höll — detta stänger raden helt |
| b2-ej-byggd | stale | — | Ägaruppdrag till Opus (2026-09-07) att re-speca B2 mot vad som nu finns snarare än majpremissen, reconcilat 2026-09-08 (Code) efter Opus egen körning förra passet: ingen ny spec behövs, funktionen är levererad (`AnnandagsValEvent.tsx`, BACKLOG.md:539 bekräftar leverans 2026-05-21). Substansen finns; ett smalt uppföljningsfynd mot den ursprungliga majpremissen skulle kräva original-B2-specen, men det är inget som föranleder detta stängs annat än stale — inget kodpass krävdes |
| stickiness-copy-roster | klar | `0b993b1b` | `STICKINESS_COPY_REGISTER_2026-09-04.md` + fem separata wiring-pass (`ef2fb829`/`9737cf0c`/`8042bc3f`/`7e690030`+`3eebd47d`/`0b993b1b`) — samtliga fem `memory.*`-scenarier har nu en levande liggarproducent: revansch, ex-spelare, nemesis (`transfer_target_missed`, DOM_K12), manager-återkomst (`manager_return`, DOM_MANAGER_ATERKOMST — kanonisk liggarpost, inte ett state-undantag) och B12-mönstret (`tactical_pattern_suspension`, SMAL scope-dom TEXTLEVERANS_OPUS_2026-09-08: tre raka ligaomgångar med utvisning under formation_523, ny EventLedgerType registrerad per LESSONS #58). Kalenderankare/säsongsläge/kalendersvans klara i tidigare pass. Se även `stickiness-settings-kategorier`/`stickiness-avregistrering-yta` (separata rader, egen scope) |
| c-o1sp1-kontextuella-sponsorer | stale | `DOM_C_O1SP1_SPONSOR_NAMNRYMD_2026-09-08.md` | Grundad kodläsning visar att kontextuella sponsorer redan har stabila sponsor-id:n medan rivaliteten är strikt klubb↔klubb. Den riktiga lösningen — stabilt entitets-id skilt från rollmedlemskap — korsar sponsor/rival/liggarsubjekt och är uttryckligen parkerad post-launch; skulden bevaras i `POST_LAUNCH.md` i stället för att ligga falskt aktiv i releasekön. Ingen specialmekanism byggd |
| rostintro-start-ko-speltest | klar | `65cdacc9` | Riktig ny mobilkarriär i 390-läge: Ankomsten etablerade styrelsens personer och krav; Tillträdet etablerade Sven Pettersson genom startelva, positionsförklaring och hörnövning. Första portalen visade bara lokaljournalisten Magnus Bergström; efter första matchdagen kom mecenaten Lars-Erik Nordin medan klackledaren låg kvar i kön. Journalist→mecenat och högst ett nytt ansikte per matchdag godkända som naturlig rytm, ingen konkret regression. 41 röstintro-/kö-/migreringstester, TypeScript och full build med fyra grindar gröna |
| sluttest-audit-orsak-verkan | klar | `30d98446` | `DOM_ORSAK_VERKAN_SYSTEMTILLSTAND_2026-09-08.md` — besluts-orsak/verkan var redan byggd (Fas 1/4 + Granska-konsumenten); den verkliga resten (systemtillstånds-VARFÖR) fick Jacobs SMAL fork. Byggt: `pickConcernCause` (boardPatienceZone.ts) läser nu `trainerArc.consecutiveLosses ≥ 3` som fallback när `boardObjectives` (check:as bara omgång 7/14/22) ännu inte flaggat — samma tröskel som `losingStreakSurcharge`, samma redan låsta standings-rad, ingen ny text eller mekanik. Ekonomins vändning och spelare-vill-bort är BRED, explicit post-launch per domen, egen scoping. 4 nya tester, full build gröna |
| spelarkort-oversikt-konformering | klar | — | BACKLOG.md:514 — Jacob beslutade 2026-09-08 att behålla Spelarkortets rikare Översikt. Den smalare mock-konformeringen ska därför inte byggas; beslutspunkten är terminal utan kodändring. |
| cs-patron-sannolikhetsrullning | klar | denna commit | `DOM_MECENAT_PATRON_MODELLFORM_2026-09-08.md` — patronens binära CS 60-vägg ersatt av exakt en deterministisk save+säsong-rullning vid första serieomgången, kontinuerligt 1–22 procent över CS 0–100. Befintligt avhopp, cooldown och epokgrind bevarade; 2 000 deterministiska saves per CS-nivå visar tydlig lutning och låg-CS är inte noll. |
| mecenat-patron-modellform | klar | denna commit | `DOM_MECENAT_PATRON_MODELLFORM_2026-09-08.md` — mecenatens upprepade omgångsrullning ersatt av samma gemensamma säsongsseedade modell, kontinuerligt 2–32 procent över CS 0–100. Tak 1/2/3 vid CS 0/70/85 och befintlig withdrawal-logik bevarade; 2 000 deterministiska saves per CS-nivå, 4 921 fullsvitstester och produktionsbyggets samtliga grindar gröna. |
| mecenatrapport-tre-designfragor | klar | `876ed4dd` | `RAPPORT_MECENATGENERERING_2026-08-26.md` frågade om låg-CS-tak, patronramp och era-trösklar. Samtliga tre är senare uttryckligen avgjorda och verkställda av `DOM_MECENAT_PATRON_MODELLFORM_2026-09-08.md`: mecenattaket står kvar med golv 1, patronens 1–22-procentsramp kalibrerades i 2 000 saves per CS-nivå och era-grindarna 50/70 står oförändrade. Ingen fjärde designfråga eller ny mekanik återstår. |
| sluttest-incoming-arkivering | stale | `f8ca48ec` | SLUTTEST_KO.md:170:s konkreta skuld var de sju obekräftade Överlämning 2-posterna. Samtliga tolv underlagsfiler flyttades till `_arkiv-2026-09/Överlämning 2/` i `f8ca48ec`; fyra punkter var redan terminala och de tre verkliga resterna fick egna MASTER-rader, vilka senare också arkiverats (`overlamning2-*`). ”Arkivera allteftersom” är mappens stående hygienregel, inte en evigt öppen releasepost; nya inkommande leveranser bedöms separat. |
| sluttest-o4-fordrojda-betyg | stale | — | PARKERAD post-launch 2026-09-08 (Jacobs dom), dokumenterad i `POST_LAUNCH.md`. Burnout-effekten "fördröjda spelarbetyg" kräver ny mekanik + designbeslut; burnout fungerar fullt utan den. Inget kodpass krävdes |
| o10-queryparam-clubselection | klar | `28f56708` | BACKLOG.md:55 — ClubSelectionScreen läser nu `?seed=` via `useSearchParams` (fallback Date.now() oförändrat), och länkens seed vidarebefordras till `newGame()`s nya valfria tredje argument, som vinner över `Math.random()`-slumpen. Samma seed ger nu samma VÄRLD, inte bara samma tre klubberbjudanden — låser upp grind 4. Resten av O10-slingan (delningskort/landningsfråga) medvetet parkerad post-launch, `POST_LAUNCH.md`/`sluttest-o10-bestinclass`. RÄTTELSE 2026-09-09: ruleVersion-notisen är INTE parkerad — `RuleVersionNotice.tsx` (`57210410`, redan byggd innan detta pass) täcker samma signal generellt för alla saves; kommentaren som sa motsatsen i `ClubSelectionScreen.tsx` var fel, rättad samma dag. 6 nya tester, tsc, build och design/content-contract-gates gröna |
| sluttest-feedbackbutton-overlapp | klar | `23be2b6d` | `DOM_FEEDBACKKNAPP_PLACERING_2026-09-08.md` — FeedbackButton flyttad från en svävande `position:fixed`-overlay till en dockad sidfotsrad monterad av GameShell.tsx (ny `shouldShowFeedbackDock()`), som reserverar riktig layoutplats i sin befintliga `paddingBottom`-beräkning i stället för att röra den delade `--bottom-nav-height`-variabeln. Ny egen `--feedback-row-height`-token håller ändringens blastradie till en fil. Browserverifierat i en riktig karriär (390×844): dashboard/trupp visar raden dockad utan att röra CTA:er, `/game/match` visar den korrekt inte alls. 3 nya tester, tsc, build och design/content-contract-gates gröna. |
| sluttest-utvisningar-kalibrering | klar | `e8ac4e2b` | GO 2026-09-08 (Jacob) — M15 (2026-07-03) sänkte foulThreshold-multiplikatorn 1.46→1.02 för att bevara utvisningsMINUTER/match, en felaktig proxy för det verkliga målet (S011: utvisningsANTAL/match, 3,77). Extraherad till namngiven konstant `SUSPENSION_FREQUENCY_MOD`, empiriskt kalibrerad 1.02→1.51 (scripts/measure-matchstraff-rate.ts, 7731 matcher: 3,77/match exakt), oberoende bekräftat av seasonSimulation.test.ts:s egen mätväg (3,608/match, 5 säsonger). D015 (docs/findings/facts) rättad — hade stått stale på 1.46 sedan M15, drift upptäckt i detta pass. scripts/validate_brain.py D015 1/1 grönt, tsc/build/gates gröna |
| sluttest-grind1-heros-ekonomi | klar | `a435ed57` | Mät-gejtat (GO 2026-09-08 Jacob): efter mecenat/patron blivit säsongsseedade (876ed4dd), ommätt upgraded+VIP-kioskens marginalvärde för Heros mot den riktiga produktionsvägen (`scripts/heros-ekonomi-2026-09-09.ts`, samma isoleringsmetod som RAPPORT_ASKADAREKONOMIN_HEROS_HOGCS_OCH_BYGGKORT_2026-08-27.md). 15 seeds × 3 säsonger (45 observationer): snitt +15 214 kr/säsong (mot tidigare −3 299 kr/säsong), växande per säsong i samma karriär (S1 +2139 · S2 +6868 · S3 +36635). Radens eget villkor ("bygg en fix bara om kurvan fortfarande går back") är inte uppfyllt — ingen kodändring i produktionsvägen, bara mätskript + BACKLOG-uppdatering |
| communityevents-deferred-dedup | klar | denna commit | Grind 2–3:s långkarriär reproducerade byte-identiska community-/patronval medan originalet väntade i KF3-kön. Rotorsaken var central: `generateEvents` byggde `alreadyQueued` av `pendingEvents` + `resolvedEventIds` men utelämnade `deferredDecisions`; alla sex undergeneratorer ärvde glappet. Kön ingår nu i samma kanoniska ID-mängd, utan ny specialmekanik. Nytt regressionstest låser ett defererat tifokort; 43/43 riktade event- och budgettester, TypeScript, produktionsbygge och fem statiska grindar gröna. |
| sluttest-b7-libero-slot | klar | `6bd2cf9f` | B7 "liberon som syndabock" (sammanslagen med B12, SLUTTEST_KO.md) — DOM_FORMATIONER_V2 (`18ff34e3`) löste båda ursprungliga hålen: libero är nu en namngiven `'def-c'`-slot i alla sex formationer, och `lineupSlots` sparas på den frusna matchlineupen. `evaluateLiberoSyndabockCandidate` (bevis: ≥4 insläppta i öppet spel, ingen gissad mål-för-mål-orsak) wirad som katalograd L i `selectMatchensSamband`. TEXT LÅST 2026-09-09 (Jacob: orten-narrativ), kopierad ordagrant: "Läktaren har hittat sin syndabock. Fyra bakom {libero}, och det är hans namn som muttras på stan nu — rättvist eller inte." 6 nya tester (detektor + två end-to-end, hemma/borta), tsc, build och design/content-contract-gates gröna |
| sluttest-o1-mecenat | klar | `2a7be218`/`daca5e06`/`35d84b50` | Hela O1-passet är 4/4 byggt mot `SPEC_O1_MECENATENS_KRAV_2026-09-09.md` och `SPEC_O1_KANDIDATER_2_3_4_2026-09-09.md`: mecenatens krav, anläggningen som kostar orten, ungdomen som kan brännas och supporterbrevet. Kandidaterna använder befintliga ekonomi-, relations-, facilities-, P19/uppflyttnings- och klackmekanismer; ungdomens uppflyttning skriver den kanoniska `academy_promotion`-posten i eventLedger och alla val får sanningsenliga utfallsbrev. Textpåståendet ”Sjuttonåringen” är låst till faktisk ålder 17. Uppföljningen `35d84b50` rättade en verifierad specavvikelse: anläggnings- och supporterhändelsen fyrar nu via varsin stabil, save- och säsongsseedad 25-procentsgrind i stället för varje kvalificerad säsong; reload kan inte rulla om utfallet. 19/19 O1-fokustester och 24/24 content-contract-tester gröna; TypeScript, full build och övriga grindar var gröna i grundpasset. |
| sluttest-audit-mer-innehall | stale | — | SLUTTEST_KO.md:34 gav endast den allmänna prioriteringsfrasen ”sen mer innehåll”, utan avgränsad leverans, acceptanskriterium eller filpekare. Den historiska källan är degraderad och de konkreta innehållspassen lever som egna MASTER-rader; O1-passet stängde dessutom fyra sådana event i `2a7be218`/`daca5e06`. Jacob beslutade 2026-09-09 ”ta bort helt”. Ingen kodändring eller ny release-grind behövs. |
| forsoningskarta-saknas-i-repo | stale | — | Den exakt namngivna `audits/FORSONINGSKARTA-KONSOLIDERAD-2026-06-10.md` finns varken i arbetsträdet eller i hela git-historiken, och Jacob har bekräftat att han inte har filen. Substansen är däremot bevarad: `DESIGNOMGANGEN-KOMPLETT-2026-06-11.md` avslutar kapitel 15 som ”konsoliderad försoningskarta”, och BACKLOG.md:498 har destillerat de namngivna fynden samt markerat deltråden stängd så långt repot tillåter. Ej görbar som separat fynd-för-fynd-åtgärd; ingen kodändring behövs. |
| inv-2-15a-vag2-a5-motorkalibrering | stale | — | `ANALYSSPEC_VAG2_OEXPLOATERAT.md` redovisar A5 som Finding 064 med en separat, ännu öppen motorkalibreringskandidat. Jacob flyttade 2026-09-09 detta analysarbete till Bandy Brain-spåret; ingen bandy-manager-kod eller releasegrind konsumerar kandidaten. |
| inv-2-15c-vag2-dam-attendance | stale | — | A7:s grind föll på 20 procents damtäckning mot 50-procentskravet. Källrapporten klassar det som brist på bättre rådatakälla, och Jacob flyttade 2026-09-09 omscrape/analys till Bandy Brain-spåret. Ingen spelkodfix kan fylla datagapet. |
| inv-2-15d-vag2-overtime-owngoal | stale | — | `overtime` och `own_goal` saknas i Bandygrytans rådata enligt Våg 2-rapporten; det är ett framtida omscrape-spår, inte en lucka i spelets separata `overtimeResult`-mekanik. Jacob flyttade 2026-09-09 frågan till Bandy Brain. |
| inv-2-15e-vag2-finding065-mekanism | stale | — | De ospawnade mekanismfrågorna bakom Finding 065 gäller analysen av källdatan och har ingen spelkodskonsument. Jacob flyttade 2026-09-09 frågespåret till Bandy Brain; ingen bandy-manager-implementation behövs. |
| bb-viz1-winprobkurva | stale | — | Paradigmvalet om Bandy Brain-sajten alls ska visa en win-prob-kurva hör till den separata analysprodukten, inte spelets release. Jacob parkerade 2026-09-09 frågan till en Bandy Brain-session; ingen spelkodändring behövs. |
| inv-7-stashed-wip-commits | klar | denna commit | Jacobs uttryckliga beslut 2026-09-09: samtliga tre gamla WIP-stashar granskades före radering. Burnout-stashen var överspelad av `9f4e0fdd` och senare takarbete; corner-stashen av `8b0febd9`/`58a3e95a`; Spår A/LedgerFrame-stashen byggde på `dc644864` (redan ancestor till main) och dess extra resolver-/mecenatdiffar var ersatta av den senare ledgerarkitekturen. Alla tre kastades efter Jacobs uttryckliga godkännande i chatten; `git stash list` är tom. Git-stash-radering skapar ingen egen kodcommit, därför är denna arkivcommit det spårbara belägget. |
| inv-4b-o12-veckobeslut | klar | `5692246d` | O12 utvidgad till WeeklyDecision per `DOM_O12_VECKOBESLUT_2026-09-09.md`: `WeeklyDecisionOption.effect` → `preview` (kvalitativ, Opus låsta vokabulärfragment), `captureResolvedChoiceOutcome` utökad med fitness/cornerSkill/cornerRecovery, `resolveWeeklyDecision`-store-actionen returnerar strukturerat kvitto ur den faktiska klampade diffen, `o12-choice-preview-guard.ts` utvidgad till WeeklyDecisionOption-formen + kommunstatus-synonymen. 7/7 nya regressionstester, full svit grön. Kvarstående gap: ingen låst fras för POSITIV styrelsetålamod (`survival_wage_freeze` A-alternativet) — inget digit-läckage så ingen byggblockerare, väntar Opus-fras. |
| inv-3-sprints17-21-four-skipped | stale | `9c1fb600` | Fyra redan fungerande matchinteraktioners uttryckligen skippade berikningar är parkerade post-launch av Jacob 2026-09-09 och bevarade i `POST_LAUNCH.md`; ingen releasekod ska byggas för dem. |
| m14-publikhistorik-token | stale | `9c1fb600` | Textresten väntar på en publikhistorik-tokenfunktion som inte finns före release; Jacob parkerade funktionen och texten tillsammans i `POST_LAUNCH.md` 2026-09-09. |
| m50-clubofferquotes | stale | `9c1fb600` | Textresten väntar på den post-launch-parkerade trofé-/meritskärmen; `POST_LAUNCH.md` bevarar uppgiften och ingen releasewiring är möjlig utan ytan. |
| d-o5-avveckla-nod | stale | `9c1fb600` | Ny rivningsyta kräver Design-mock och är uttryckligen parkerad till post-launch (”säsong 10”) av Jacob 2026-09-09; `POST_LAUNCH.md` är fortsatt källa. |
| sluttest-o10-bestinclass | stale | `44a7a7f6` | Seed-i-länk är levererad separat; Jacob parkerade bandyarkivet, vägskäl, bruksligor och skaparekosystem post-launch. Den fulla uppgiften bevaras i `POST_LAUNCH.md`. |
| stickiness-apple-native-epic | stale | `44a7a7f6` | WidgetKit/ActivityKit, Live Activities, Dynamic Island och App Groups är Fas 2 och får öppnas först efter att webbpassets holdout har mätt retention; bevarad i `POST_LAUNCH.md` utan parallell minnessanning. |
| omsparning-system-v2 | klar | `44a7a7f6` | `RAPPORT_OMSPARNING_RAW_2026-09-04.md` besvarar samtliga verifieringsceller med definitiv kodläsning och Opus stängde kartläggningen 2026-09-09; residuala systemgap lever som egna rader eller post-launch-spår. |
| o10-delningskort-text | stale | `7bfdf685` | Opus-texten är låst men själva delningskortet och landningsfrågan är uttryckligen parkerade med O10-ekosystemet i `POST_LAUNCH.md`; seed-i-länk är den enda beslutade release-skivan och är redan klar. Raden låg därför felaktigt kvar som aktiv dubblett till `sluttest-o10-bestinclass`. |
| o10-delbarhetsspar | stale | `7bfdf685` | Utmaningslänk/Bruksliga/jämförbar seed-körning ingår i den uttryckligen post-launch-parkerade O10-ekosystemposten. Den levererade seed-i-länk-skivan och den generella `RuleVersionNotice` står kvar; ingen ytterligare releasekod ska byggas från denna dubblettrad. |
| scout-shortlist-transferfonster | stale | `086a7a27` | BACKLOG-raden är uttryckligen medvetet parkerad tills nästa transfer-ytepass. Substansen är bevarad i `POST_LAUNCH.md`; ingen fristående releasekod eller parallell shortlistmekanik ska byggas nu. |
| sluttest-grind4 | stale | `b6e35431` | Grind 4 kräver en verkligt producerad delningslänk. Seed-mottagaren `o10-queryparam-clubselection` är byggd, men releaseversionen delar fortfarande bara sajtens rotadress och länkskaparen/delningskortet är uttryckligen parkerad med O10-ekosystemet. Testinstruktionen förbjuder en handkonstruerad väg; acceptanstestet följer därför med till `POST_LAUNCH.md` och körs när den riktiga producenten byggs. |
| ci-dedup-sasongsrullning | klar | `bd56fc74` | O1 och mecenat/patron använder nu samma `seasonalUnitRoll` för det gemensamma kontraktet save-seed + klubb + säsong + domännyckel + namnrymd. Producenterna äger fortsatt sina egna sannolikheter och semantik. 28 riktade producent-/kontraktstester, dubblettgrinden, TypeScript och full build gröna. |
| ci-visual-baselines-illustrationer-o12 | klar | `d6da1afe` | Tio avsiktliga Linux-snapshots seedades via manuella `visual-baselines.yml` efter käll- och pixelgranskning: sex illustrationsvyer (`f183ba8a`), turneringsläge (`baad4aa7`), Bury Fen-footer (`a1556993`) och O12-veckobeslut (`5692246d`). `portal-grind` behåller mecenatkortet; skillnaden var O12-kortets nya höjd. Seed-jobb 34413960122: 131/131. Full app-ci 34414397905: 8/8 jobb gröna, inklusive 131/131 pixelregression, full Vitest, TypeScript, scripts-TypeScript, duplicate-function, build samt samtliga UI-grindar. |
| turneringslage-avgjord-serie-nollnoll | klar | `4ae91205` | Granskas mitt-i-serien-text binds till granskad fixture i befintlig selector. Avgjord kvart läser inte nästa semifinals 0–0; pågående serie behåller låst text. 56 fokustester, 550/4 989 fullsvit och build gröna; båda fallen browserverifierade i isolerad main-kopia, 390 px. Se `playtest/GRIND_2_3_LANGKARRIAR_2026-09-09.md`. |
| statistik-telemetri-ror | klar | `9e2a8af7` | `SPEC_TELEMETRI_STATISTIK_2026-09-10.md` byggd: separat `analytics_events`-tabell under installationen, strikt whitelistad tratt-/sessionskanal, klientdedupe och sann förstabaslinje för befintliga karriärer, opt-out lokalt och server-side samt 90-dygnsgallring i den befintliga timschedulern. Äldre klienter kan inte skriva över ett nej. 32 fokustester gröna; fullsviten gav 4 997/4 998 med ett belastningstimeout som passerade 4/4 isolerat; produktionsbygge och samtliga grindar gröna. Dashboarden är fortsatt post-launch enligt spec. |
| redesign-klubbminnet-omdesign | klar | `369b3c4e` | Klubbminnet omdesignat till 70-tals protokollblock per `HANDOFF_CODE_KLUBBMINNET_2026-09-10.md` (mock + Opus-dom A.1: ljust papper). Perforeringsräls, Georgia-datum, kopparprick på Triumf, "Ortens minne"-hero (max significance/säsong). Familj-mappningen (5 kategoristämplar) fanns redan byggd (`MOMENT_FAMILY`) — återanvänd, ingen dubblett. Kalenderdatum bara för pågående säsong (`game.fixtures` nollställs varje rollover); äldre säsonger visar månad. Släppte mockens fabricerade ordinal-säsongsnummer ("Säsong 3") till förmån för appens redan etablerade "Säsong {kalenderspann}". Legender/rekord/blodslinje oförändrat innehåll, paper-tokens. Browserverifierat (renderToStaticMarkup + Playwright): perforering, nyckel, hero+prick, kind-färger, familjestämplar. 4998/4998 tester, full build + fem lintgrindar gröna. |
| int-1-stora-bagarna | klar | `6d958d99` | `docs/playtest/INT_1_B1_LANGBAGE_2026-09-10.md` — riktig mobilgenomspelning 390×844 mot live `ab667cc`. B1 känns sammanhängande från sommarlöfte via anläggning och årsbok till avsked, två år utan spelaren, tränarmarknad och ny klubb i samma karriär. Två avgränsade gluggar föddes som nya rapporterade rader: omöjligt Matchhallsmål/falsk chevron och andraårs-copy första dagen i ny klubb. |
| m5-grindar-ej-i-ci | klar | `9e3a8dd6` | `HANDOFF_CODE_M5_SUBPIXEL_2026-09-10.md` — Jacobs default-dom 2026-09-08 (förstora alla sub-12px till ≥12px, ingen bröt layouten). ~96 ytor (Game Over 6 + taktiktavlan ~90) förstorade med lokala fontSize-overrides — inga globala klasser (.h-label/.h-micro/.h-quote-sm/.tag, 9px, 60-150 konsumenter vardera) rörda. `findTextSizeViolations` inkopplad i `mobileDecisionHierarchy.visual.ts`, grön för båda scenerna. Sidofynd registrerat separat (`taktik-autofyll-knappar-trafyta`, inte fixat här — kontrollstorlek, annan grind). Full build, tsc, fem lintgrindar gröna; 5002/5002 vitest (2 initiala timeout-flak ombekräftade gröna isolerat). |
| sluttest-a8-viktning | klar | `2f3540ab` | Konsoliderad med `ci-en-primary-taktik-hierarki` — samma dom, samma bygge. Uppställning + viktning (spakar) var redan klara (HANDOFF-TAKTIKTAVLA-VIKTNING.md's egen statustabell); enda kvarvarande delen var primär-hierarkin, löst av DOM_TAKTIKTAVLA_PRIMARHIERARKI_2026-09-10 (1a). |
| ci-en-primary-taktik-hierarki | klar | `2f3540ab` | DOM_TAKTIKTAVLA_PRIMARHIERARKI_2026-09-10 (1a, Jacob ratificerade): assistenten bär primären. TacticBoardCard.tsx "Följ rådet" → "✓ Följ assistentens råd", `btn-cta btn-primary` → `btn-primary` (btn-cta är skärmstängarens register, inte in-content). FormationView.tsx: autofyll-trions tidigare kopparmålade "matchfit"-specialbehandling (medveten .btn-primary-undvikning, dokumenterad i kod sedan tidigare) borttagen — alla tre jämlika tysta genvägar. Browserverifierat: exakt en solid kopparknapp per skärm. Visuell baseline `scene-taktik` bryts avsiktligt (höjdökning) — väntar Linux CI-reseed via `visual-baselines.yml`. 552 filer/5014 tester, full build + fem lintgrindar gröna. |
| transfers-modaler-ledgervokabular | klar | `e3201c9c` | BidModal och RenewContractModal läser samma faktiska klubbminne framåt via `buildPlayerLedger` (0–3; tomt utan belägg). Triumf visas bara från verklig minneshändelse; blodslinje, klubbtid, dagjobb och hemmakär personlighet är sanningsförankrade. Rivalvarning visas bara vid bud och varje modal har exakt en `.btn-primary`. Handoffens föreslagna `birthRegion`/`dayJobIsLocal` finns inte i Player-schemat och fabricerades därför inte. 553 filer/5 023 tester samt full build och fem grindar gröna; inga baselines ändrade. |
| taktik-autofyll-knappar-trafyta | klar | `b4303e49` | Jacobs val byggt utan undantag: samtliga tre autofyll-knappar har minst 44 px träffyta. Den långa etiketten får brytas över två rader i stället för att ellipsas. Verifierat i riktig Chromium-rendering vid 390×844: alla tre synliga, minst 44 px höga, ingen textoverflow och hela raden inom viewporten. Fem fokustester, riktad mobilgrind, produktionsbygge och samtliga fem bygggrindar gröna. Ingen baseline ändrad lokalt; Linux-reseeden spåras separat i `ci-scene-taktik-linux-reseed`. |
| mecenat-silentshout-aterfall | klar | `93505798` | Grind 2 reproducerade nytt `Anna Johansson hotar` tre omgångar efter resolution. SilentShout har nu en producent (`eventProcessor`), stabilt id per mecenat och tröskelvariant samt dedupe via befintliga `pendingEvents + deferredDecisions + resolvedEventIds`; legacy-prefixet känner igen äldre `Date.now()`-id:n. Submit-underradens obelagda `silentShout ökar` är struket, deklarerad effekt är fortsatt enbart `mecenatHappiness +20`. 23 riktade tester och full build med TypeScript samt fem grindar gröna. Journal: `playtest/GRIND_2_3_LANGKARRIAR_2026-09-09.md`. |
| decisioncards-likriktning | klar | `f98456ab` | Den fällda primärregeln är byggd: `primaryChoiceId` är explicit data och härleds aldrig ur effekten; osatt ger alla outline, satt ger exakt en vardaglig `.btn-primary`. EventOverlay routar brytpunkter till ett avgränsat Georgia/läder-register med `.scene-choice`, kopparpil och högst en lågmäld `.weight`-tint — aldrig `.btn-primary`. Strukturella komponenttester, full produktionsbuild och samtliga fem 390×844-mobilprov gröna. Separat mobilbild granskad: tinten läser tyngre men klart underordnad. Ingen baseline ändrad i committen. Opus slutliga situationscopy låg utanför denna visuella kodrad. |
| design-p4-brytpunkt-knappar | klar | `f98456ab` | Konsoliderad med `decisioncards-likriktning`: den tidigare öppna designfrågan är nu dömd och byggd. Brytpunkten använder scenens Georgia/pil-register med `.scene-choice`; den tyngre vägen får bara `.weight`-tint och konsekvensrad, aldrig vardagskortets fyllda `.btn-primary`. Mobilgrinden visar verkliga produktval och stoppar de gamla generiska platshållarna. Ingen baseline ändrad i kodcommitten. |
| granska-scrollindikator-osynlig | klar | denna commit | Granskas korrekta scrollmätning har fått en synlig och klickbar 44 px nedåtpil ovanför den fasta bottenpanelen. Pilen scrollar 65 procent av rapporthöjden, räknar om läget efter lösta beslut och försvinner när inget mer innehåll återstår. Browserverifierad i `/dev/scenes?scene=granska&inspect=1&width=390`: indikatorn syns vid start och flyttar till kontraktskortet vid tryck. TypeScript och full produktionsbuild med fem grindar gröna. |
| ci-scene-taktik-linux-reseed | klar | `89318a27` + `167b6f6c` | Linux-baselinen är granskad och reseedad. Första körningen 34462856342 fångade även en felaktig Game Over-bild; bildväntan `0fd1ee3f` var nyttig stabilisering men omkörning 34464470356 utan diff falsifierade den som rotorsak. Roten var att den fixed-positionerade, internt scrollande GameOverScreen felaktigt element-stitchades. `89318a27` registrerar den som fixed overlay och fångar sidan deterministiskt i 390×844. Slutlig reseed 34465526530 passerade 131/131 och skrev `167b6f6c`; exakt Game Over-snapshoten ändrades, medan den avsiktliga taktikbaselinen redan var stabil från första körningen. Full app-CI 34466002511 är grön i samtliga åtta jobb, inklusive visuell regression, 149 tap-target-prov, 5 023 enhetstester, produktionsbuild och fem lintgrindar. |
| portal-scrollindikator-saknas | klar | denna commit | Den gemensamma, villkorade 44 px-indikatorn läser nu GameShells verkliga scrollbehållare via kontext och placeras ovanför Portals uppmätta CTA-stack. Dev-galleriet exponerar samma scrollkontrakt så scenproven inte maskerar funktionen. Browserverifierat i `portal-full`: pilen syntes och flyttade scrollen 468 px; full produktionsbuild, fem grindar och 12 riktade tester gröna. |
| scrollindikator-ceremoni-och-krav | klar | denna commit | Samma lokalt mätande `ScrollMoreCue` är inkopplad i årsboken, cupfinalens två startelvor och säsongens lönekrav. Signalen visas bara vid verkligt overflow, scrollar 65 procent vid tryck och försvinner vid botten; tvåkravs-fixturen verifierade att ingen falsk pil visas när allt ryms. Årsboken browserverifierad; full produktionsbuild, fem grindar och 12 riktade tester gröna. |
| pt6-nedslackning-timing | klar | denna commit | Den äldre vaga PT-6-noten avfördes först korrekt som stale, men återöppnades när `DOM_POLISH_NEDSLACKNING_2026-09-10.md` gav en ny, konkret byggorder för blockerande matchinteraktioner. `.match-dimmed` är nu explicit state; resultattavlans faktiska underkant mäts med `ResizeObserver` och styr scrimens topp utan magisk 54:a. Underlaget får låsta 34 % ljus/70 % mättnad, scrim `rgba(0,0,0,.6)`, överlappad 260/220 ms-entry med 80 ms scenfördröjning samt 180/220 ms-exit. Docken behålls monterad under utgången och reduced-motion behåller omedelbar dim. Mobilmätning: scoreboard 237 px, scrim 237 px, flush delta 0. 5/5 fokustester, TypeScript och full build med fem grindar gröna; ingen baseline ändrad. |
| c-v1-opponentform-tomt | klar | denna commit | Motståndarformen använder fortsatt samma fem faktiska formresultat men har fått en tydlig korttopp med motståndarnamn, tabellplats och poäng samt en stabil femkolumnsrad utan wrap. En deterministisk derby-scen gör kortet visuellt provbart. Verifierat i 390 px Portal: alla fem resultat ryms utan horisontellt spill. Komponenttest och full produktionsbuild med samtliga grindar gröna. |
| c-sp5-smfinal-skarv | klar | denna commit | Den tidigare stale-bedömningen rättades av `DOM_POLISH_SMFINAL_SKARV_2026-09-10.md`: de gamla bakgrundsfixarna löste inte övergången från Portalens gold-CTA till finaluppspelet. Återanvändbara `SceneSeam` bär nu final/semi/quarter-tier och 260 ms gold-/kopparöverlämning med reduced-motion. Endast SM-finalens kanoniska primary-id är wirat i detta pass; CTA:n säger samma ”SM-final” som kortet, originalets gold-fyllning avmonteras innan svepet och navigationen släpps till `/game/match` först efter överlämningen. Browser 390 px: gold CTA sann, originalfill osynlig under seam, svep aktivt och rätt destination. 1/1 komponenttest, TypeScript och full build med fem grindar gröna; ingen baseline ändrad. |
| c-t11-nudges-pa-portalen | stale | denna commit | Hela den ursprungliga C-T11-trean är senare levererad genom gemensamma system. `TransferDeadlinePrimary` visar ”Hantera bud” endast när `getQueueableOpenBids` faktiskt ger bud. Portalens `transfer_window_open`-beat använder samma `getTransferWindowStatus` som handlingen och yttrar januarifönstret där spelaren lever. `marketValueProcessor` omvärderar andra klubbars availability varje omgång och `transferProcessor` skapar inkommande bud samt pågående transferrykten, så passivitet är inte permanent stiltje. Ingen separat TransferNudge-komponent ska införas. 52 riktade transfer-/portaltester gröna. |
| design-p1-tysta-ytor | klar | denna commit | Designgranskningens fem gamla svartfältsfynd är avbetade utan en ny specialyta. Kafferum, mecenatmiddag och skarpt styrelseultimatum var redan illustrerade och mobilgranskade. Cupintro fick i `aed270cb` en riktig `IllustrationScene`-header med `cup.jpg`, genre, titel och beats över `--bg-scene`. Hallprövningen är sedan `01c2ff63` inte den granskade citat-knapp-ytan utan en återkommande processhub med stöd, krav, förhandling, bygge och fasstatus. Kod och git-historik verifierade; de två kvarvarande dumpnoterna var överspelade av senare leveranser. Ingen ytterligare design eller parallell mekanik byggdes. |
| inv-5-designko-d4-portal-orientering | stale | denna commit | Den gamla statusraden sade att ingen designmock eller ramp fanns, men leveransen `DRAG3-VAD-NU-AFFORDANS-LEVERANS-2026-07-02.html` och senare kod visar att hela den beslutade lätta rampen redan är byggd: den permanenta statefula ”vad nu?”-raden (`0c8c6365`), explicit transferfönster-copy och kassörens första-veckan-röst (`d654ecb7`). `SLUTTEST_KO.md` bokför dessutom punkt 1+2 som avgjorda i `52009671`. Ingen coachmark-specialmekanik ska återinföras; Tillträdet ersatte den gamla overlayn i `38e6e2ec`. 13/13 fokuserade cue-/transferfönstertester gröna vid reconcile 2026-09-10. |
| sluttest-412-bildsnapshot | stale | denna commit | Jacobs beslut i `SPELTESTKALENDER_2026-09-10.md` klassar bildsnapshots för den ännu post-launch-parkerade delningsbilden som rent visuell QA med låg prioritet: post-launch eller Code på uttrycklig begäran. Den ska därför inte ligga som en aktiv releasepunkt. Ingen baseline eller produktkod ändrades; uppgiften är bevarad i `POST_LAUNCH.md` tillsammans med delbarhetsekosystemet. |
| high6-retirement-golvalder-fitnessensam | klar | denna commit | Jacobs dom 2026-09-10 är byggd utan att ändra fyrårsmarginalen: före positionens ordinarie pensionsålder krävs minst en faktisk skadepost; låg kondition får förstärka den skadeburna vägen men kan inte ensam göra exempelvis en 29-årig forward till kandidat. Vid och efter ordinarie positionsålder gäller den samlade ålder-/kondition-/skadepoängen som tidigare. 27/27 pensionsprov, TypeScript och full produktionsbuild med fem grindar gröna. |
| stickiness-permission-ogonblick | klar | denna commit | Jacobs dom 2026-09-10 är byggd: klubbens pre-prompt kräver tre egna färdigspelade matcher, läst Granska och ett verkligt obekräftat lag. ”Inte nu” lagrar nu återkomst vid tre ytterligare matcher i stället för ett permanent nej; äldre `true`-värden migreras till samma uppskjutning. Den påstådda Design-resten var redan levererad och byggd: `Notisinstallningar.dc.html` samt kategori-/quiet-hours-ytan i `6c3b745b`, kompletterad med avregistrering i `5cae3394`. 13/13 klientprov och 24/24 serverprov gröna; TypeScript och full produktionsbuild med fem grindar gröna. |
| stickiness-dataskydd | klar | denna commit | Jacob godkände 2026-09-10 minimeringspolicyn: servern lagrar aldrig namn, e-post eller hel sparfil; avstängning raderar hela installationen omedelbart och samma autentiserade timjobb gallrar nu installationer vars verkliga klientaktivitet varit tyst i mer än 90 dygn. `app_opened` förnyar aktivitetsdatumet, exakt gränstid behålls och Postgres använder samma ägarrad + FK-cascade som uttrycklig avregistrering. 27/27 fokuserade backendtester, TypeScript och full produktionsbuild med fem grindar gröna. |
| sluttest-missing-check-grind | klar | denna commit | `DOM_PASTAENDE_SKIVA5_EVENTRESOLVER_2026-09-10.md` ratificerar `f04ef583`: eventResolver löser redan proofade GameEvent och konstruerar exakt noll nya beslutskort. Nollgränsen är uttryckligen testad samtidigt som filen ligger kvar i den statiska populationen, så en framtida konstruktion måste deklarera proof-source. Ingen falsk annotering eller parallellt assertionssystem byggdes. Därmed är alla fem ursprungligen namngivna filer klassificerade och grindade. 28/28 kontraktsprov, TypeScript och full produktionsbuild med fem grindar gröna. |
| valet-ui-eriks-oga | stale | denna commit | Den gamla playtest-residualen saknade ett eget acceptanskriterium och var inte en fristående bygguppgift. Valet är byggt, routat och har genomgått flera senare riktade designpass; det fokuserade Chromium-provet verifierar både byggalternativ och ett likvärdigt avstå-val. Den enda kvarvarande kvalitativa frågan — om hallprövningens Valet är begripligt utan förklaring — finns redan ordagrant som kvitto i den fortsatt aktiva tio-säsongersjournalen `TESTINSTRUKTION_KARRIARJOURNAL_2026-09-03.md`. Ingen extern Erik-granskning fabricerades; dubbletten konsoliderades till sin enda aktiva källa. 1/1 fokuserat visuellt scenprov grönt. |
| c-sy1-pilot1-playtest | stale | denna commit | Den tidsbundna grinden sade att Pilot 1 skulle playtestas före skalning, men skalningen har redan skett: Pilot 2 byggdes i `20afac4d` med samma inflätade, state-förankrade orsakskrok, cirka 35 procents dosering, stabil fråga-/svarsidentitet och legacy-fallback. En separat efterhandsgrind kan därför inte uppfylla den ursprungliga funktionen. Den fortfarande relevanta kvalitativa frågan — märkbar kausalitet utan didaktisk upprepning — är uttryckligen konsoliderad till den pågående naturliga Grind 2-långkarriären, inte borttagen eller ersatt av konstgjord kalibrering. 19/19 fokuserade Pilot 1/2- och presskontraktstester gröna. |
| kf8-fanmood-kalibrering | stale | denna commit | Jacob beslutade 2026-09-09 uttryckligen att inget dedikerat kalibreringspass eller gissad sifferändring ska göras: fanMood ska observeras i den redan pågående Grind 2/3-långkarriären och bara öppna en konkret fix om kurvan faktiskt läser fel. Kodkontrollen visar den beslutade modellen — 3 procents drift mot 50, avtagande positiv effekt, neutralt kryss och full negativ effekt — och långkarriärens rapport innehåller inget fanMood-symptom. Bevakningen är därför konsoliderad till Grind 2 och den parallella kalibreringsraden avförd. 4/4 fokuserade modelltester gröna. |
| sluttest-regressionsvit-22-24 | stale | denna commit | Den arkiverade Skutskär-auditens tre kvalitativa krav återfanns och fördelades enligt `SPELTESTKALENDER_2026-09-10.md`, som uttryckligen absorberar paraplyraden. Punkt 22 ligger på `sluttest-kvalitativ-uppfoljning`, punkt 23 på `sluttest-validering-journal` och punkt 24 i Grind 2/3-checklistan. Kriterierna skrevs ut ordagrant i kalendern. Inget krav markerades utfört eller tappades; bara den parallella statusfickan avfördes. Dokumentreconcile, ingen produktkod ändrad. |
| sluttest-kvalitativ-uppfoljning | stale | denna commit | Den fulla 6–8-spelarrundan är verklig men uttryckligen post-launch enligt `SPELTESTKALENDER_2026-09-10.md`; den har flyttats till `POST_LAUNCH.md` med samtliga kontrollpunkter och Skutskär punkt 22 bevarade. Jacobs separata pre-release-körning som ny spelare ligger kvar i kalenderns spår 2 och har inte markerats genomförd. Ingen extern körning fabricerades och ingen produktkod ändrades. |
| burnout-dubbelt-slutval-samma-sasong | klar | denna commit | Takvalet har fått säsongsgate mot den kanoniska eventLedgern med diary-fallback för äldre saves. En ny burnout-episod samma säsong kan inte producera ett nytt irreversibelt val; redan köade legacy-kopior konsumeras före effekter och kan varken ändra scar, ge recovery/board-effekt eller skriva ny liggar-/diarypost. 15 riktade regressionstester samt full TypeScript- och produktionsbuild med fem grindar gröna. Grind 2/3 reproducerade felet över två säsonger och verifierade årsbokens dubbla scar-rad före fixen. |
| forsoning-5-omfotografering | klar | `5a4efffb` + denna commit | Den ordagranna juni-re-auditen saknar separat kvitto, men acceptanssyftet uppfylldes senare med större täckning: fresh-eyes-granskningen 2026-09-03 fotograferade och Design-dömde samtliga 111 deklarerade states mot designsystemet. Den pekade både ut bärande ytor och registrerade 19 separata `design-*`-utfall; reconcile 2026-09-10 bekräftade att alla 19 nu är terminala i detta arkiv, ingen saknas eller ligger öppen. `FORSONINGSSPRINT_REAUDIT_RECONCILE_2026-09-10.md`. |
| saveimport-filvaljare-opalitlig | klar | denna commit | Filfältet för JSON-import är nu DOM-förankrat under hela filvalet och städas i en gemensam avslutningsväg vid lyckad import, fel eller avbrott. Bekräftelsedialogens event-loop får avslutas före filväljaren öppnas. Den verkliga gamla filen `bandy-Grindtest_2-s2030.json` migrerade rent och importerades i browser till `Grindtest 2 · 2030/31 · OMG 8`. Regressionstest 39/39 och full build med TypeScript samt fem grindar gröna. |
| historikankare-skiftar-inom-sasong | stale | denna commit | Kod- och gitläsning falsifierade ett inom-säsongs skalskifte. `findActiveAnniversaries` räknar alltid `yearsAgo = currentSeason - event.season`; playofffasen ingår inte i beräkningen. Vid varje global matchdag väljs i stället den historiska post vars egen matchdag ligger inom årsdagens ±1-fönster. Grindens identiska burnouttext kom från olika liggarposter och säsonger, så `Ett år sedan` och `4 år sedan` beskrev olika händelse-id:n trots samma frysta rad. Den separata säsongsdedupen för burnout-taket stoppar nya samtidiga scar-dubbletter; ingen fas-copy eller ny tidsaxel infördes. |
| annandagsbeat-fel-kalenderlage | klar | denna commit | Save-migrationens kalenderflaggor binds nu först till ligafixturens stabila `roundNumber`/`leagueRound`, inte en global matchday vars nollpunkt har ändrats mellan schemaversioner. Befintligt fixturdatum är sanningen för annandag, nyår och transferdeadline och rensar redan felskrivna legacyflaggor; saknat datum backfylls från rätt serieomgång. Den verkliga konflikten omgång 8, global matchday 14, 17 oktober kan inte längre bli Annandagen, medan både dagens omgång 10 och en historisk faktisk 26 december bevaras. 34 riktade tester och full TypeScript-/produktionsbuild med fem grindar gröna. |
| trott-startelva-raknare-fel-population | klar | denna commit | Trötthetsmodalens tal och språk läser nu samma population som öppnade grinden: den faktiskt valda elvan. Antalet godkända är `11 − belowFloorStarters.length` och underskottet är exakt antalet trötta startspelare; hela truppens spelarpool och dess separata autofyllnings-shortfall kan inte längre producera `15 av 11`, `−0` eller påstå att klubben saknar elva när managern bara valt en trött favorit. Samma komponent täcker tvingad autofyllning och manuell elva. 20 riktade tester samt full TypeScript-/produktionsbuild med fem grindar gröna. |
| season-end-gemini-watermark | klar | denna commit | Gemini-symbolen nere till höger har tagits bort ur säsongsslutets kanoniska fullupplösta källa och produktasset utan att bildens övriga komposition ändrats. Den rena källan är bevarad som `bandymanager_säsonsslut_final1-no-watermark.png`; `season-end.jpg` är fortsatt 1204×2158 och visar boll, is och arena som tidigare. Verifierat visuellt i riktig årsbok 2033/34 vid 390 px samt med bildintegritetsgrinden, 3/3 tester gröna. Aktiv räknare 8→7. |
| bandygala-dubblett-residual | klar | denna commit | Grind 2/3 reproducerade Bandygalan 2034 tre gånger i samma 2034/35-säsong trots atomär köpensionering. Den centrala beslutsbudgeten skyddar nu mot både den begränsade `resolvedEventIds`-cachen och det durabla valkvittot i `resolvedChoices`, så migrerade långkarriärer inte kan återföra en redan löst identitet när cacheposten saknas. Regressionen täcker samtidig kopia i `pendingEvents` och `deferredDecisions`; 38/38 riktade tester och full produktionsbuild med TypeScript/fem grindar gröna. Samma verkliga save avancerades därefter flera omgångar, genom omgång 9, utan en fjärde gala. Aktiv räknare 8→7. |
