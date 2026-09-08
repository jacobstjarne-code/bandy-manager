# MASTER_ARKIV — stängda och stale poster ur MASTER_OPPET.md

**Skapad 2026-09-08 (Code, MASTER-split).** Varje rad här VAR en fullständig `docs/MASTER_OPPET.md`-post (beskrivning + full utredningstext i `nästa-åtgärd`) innan den kollapsades till fyra kolumner vid arkiveringen. Fulltexten finns fortfarande — i `git log -- docs/MASTER_OPPET.md` (sök på id:t) och i respektive DOM-/RAPPORT-/RECON-/INVENTERING-fil pekaren nedan namnger. Den här filen är ett REGISTER, inte en andra sanning.

**Läs INTE denna fil rutinmässigt.** Den dras aldrig in i sessionsstart-kontexten (se CLAUDE.md, auto-load-pekaren pekar på `MASTER_OPPET.md`). Öppna den bara vid explicit behov: "var det här redan löst?", en gammal dom behöver återfinnas, en historisk siffra ska verifieras.

**Kommit-hash-kolumnen är en pekare in i rätt del av historiken, inte nödvändigtvis den exakta commit som satte status till terminal** — flera poster stängdes i en dokument-commit separat från kodcommiten som faktiskt löste dem; hashen är den mest relevanta som nämndes i radens egen text vid arkiveringstillfället. `—` betyder att ingen commit-hash fanns nämnd i originaltexten (vanligt för poster som stängdes genom att en premiss visade sig vara `stale`/redan löst, utan eget kodpass).

**Stående regel (se MASTER_OPPET.md):** en post flyttas hit SAMMA pass den blir terminal — aldrig bara omstämplad `klar`/`stale` på plats i MASTER_OPPET.md.

Sorterad i samma ordning posterna låg i MASTER_OPPET.md vid arkiveringstillfället (inte alfabetiskt, inte efter datum).

| id | status | commit | källpekare |
|---|---|---|---|
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
