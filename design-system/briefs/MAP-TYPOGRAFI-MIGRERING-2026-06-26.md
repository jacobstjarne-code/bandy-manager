# Roll-klassificeringskarta — typografi-kanon-migrering

**Datum:** 2026-06-26 · **Underlag:** `Typografi-kanon-2026-06-26.html` · **Beslut:** `docs/DECISIONS.md` 2026-06-26
**Status:** Karta klar (steg 2 i kanonens väg framåt). Passet (steg 3) väntar på tre rulings nedan + koordinering med MatchLive.

Alla 346 inline-siter (194 × `fontSize:9`, 152 × `fontFamily:display`) i `src/presentation/**/*.tsx` (exkl. `DevScenesScreen`, `__tests__`) är lästa i kontext och klassificerade per kanon-roll av 8 parallella agenter. Foundation-klasserna finns redan i `global.css` (commit `7d5e1548`).

---

## TRE RULINGS KRÄVS FÖRE PASSET (Jacob/Opus/designer)

Subagenterna stötte enstämmigt på tre saker kanonen inte täcker. Passet kan inte bli rent förrän dessa klubbas.

### Ruling 1 — Display-RUBRIK-roll saknas (~25 siter)
Kanonens `.h-num-*` är för **siffror** (data i Georgia). Men ~25 siter är display-font **namn/rubriker som inte är tal**: spelarnamn (PlayerCard, NotesView, TransferPlayerCard, SquadScreen, GranskaSpelare), skärm-/modalrubriker ("Inkorg", "VEM ÄR DU?", "Svenska Mästare", "DU HAR SPARKATS", "Klubbhistorik"), och kort-rubriknamn (patron-/motståndar-/arenanamn i portal-primaries, klubbnamn i GameHeader/MiljöHeader). Agenterna tvingade in dem i `num-lg` för att de är display — men det är semantiskt fel.

**Alternativ:** (a) stora rubriker (≥22px) → befintliga `.h-display-sm/md`; inline-namn (12–18px) → ny `.h-name` (display, ingen tabular-nums) eller exempt. (b) allt exempt (de har redan rätt display-font, bara literalen triggar guarden). (c) en ny `.h-name`-skala.
**Rekommendation:** ≥22px → `.h-display-*` (finns). 12–18px namn → ny `.h-name` (display, 13/15px, ingen tabular). **Designern klubbar.**

### Ruling 2 — 9px mikrotext-roll saknas (~73 siter)
Största bucketen. 9px **non-label statisk** mikrotext utan display-font: minutmarkörer (`{e.minute}'`), tidsstämplar/`OMG {n}`, positionskoder, badge-siffror i färgade chips, diagram-legender, kontroll-/knapptext, meta-rader ("Senaste N omg.", "{pts}p · V O F"). Kanon har ingen klass.

**Alternativ:** (a) ny `.h-micro` (9px/body/muted) för de statiska + exempt för chip/dynamiska. (b) allt exempt (legitim mikrotext). (c) konvergera meta-raderna till `.h-micro`, lämna badge-siffror inline.
**Rekommendation:** ny `.h-micro` (9px body, muted, ingen versal/spacing) för statisk meta/legend/kontrolltext; `// ds-exempt` för siffror/text inne i färgade chips och dynamiska. **Designern klubbar.**

### Ruling 3 — Dynamisk-färg-konventionen (förtydligande)
Många role-formade siter har **dynamisk färg** (ternary/funktion: `csColor()`, `ratingColor()`, `statusColor`, vi/dom, severity). Regel som agenterna tolkade olika:

> Är siten en **roll** (label/num/quote)? → applicera klassen, **behåll `color` inline**. Klassen tar bort `fontSize:9`/`fontFamily`-literalen, så guarden räknar den inte längre — **inget `// ds-exempt` behövs**.
> `exempt-dynamic` (+ `// ds-exempt`) gäller BARA siter där **ingen** roll passar och de stannar helt inline: LED-glyfer, live-count-up-animationer, rena dynamiska värden utan rollform.

Det krymper "exempt"-bucketen rejält (många agent-"exempt" är egentligen num/label-med-inline-färg). **Code följer denna regel i passet.**

---

## SUMMA PER ROLL (≈, agenternas egna räkningar)

| roll | ca antal | target |
|---|---|---|
| label | 116 | `.h-label` (+ `.h-label-light` på mörk) |
| num (sm/—/lg) | 75 | `.h-num-sm`/`.h-num`/`.h-num-lg`, färg inline |
| quote (—/sm) | 51 | `.h-quote`/`.h-quote-sm` (+ `.h-quote-light` på mörk) |
| exempt-dynamic | 21 | stannar inline + `// ds-exempt` |
| micro-ruling | 73 | **väntar Ruling 2** |
| display-rubrik | ~25 (i num ovan) | **väntar Ruling 1** |

Återkommande mekanisk uppgift oavsett roll: **emoji ut ur den stylade spanen** (💰/📋/🎯/⭐ m.fl.) till syskon-textnod — annars krockar `.h-label` med emojiConsistency-regeln. Bonusfynd: rå `rgba()` i `MatchLiveScreen:1469` + `TacticPreview:90/97` (token-brott oavsett typografi).

---

## PASS-ORDNING (rekommenderad, per-skärm med playtest-verifiering)

Ljusa "papper"-skärmar och mörka läder/scen-ytor skiljs åt (light-varianter). Sammanflätas med MatchLive-omdesignen där de överlappar.

1. **Granska-flödet** (Oversikt/Analys/Spelare/Shotmap/Screen) — tätast label+quote+num, ljus bg, ingen MatchLive-överlapp. Bra första skärm för verifiering.
2. **Portal-korten** (primary/secondary/minimal) — mörk bg, mest `.h-*-light`. Stor num+quote-andel.
3. **Summary-skärmar** (Round/Season/Sim/HalfTime) — num-lg + quote.
4. **Tabell/History/Squad/Klubb-tabs** — label + num, ljus.
5. **Scen-skärmar** (BoardMeeting/Journalist/Coffee/Victory m.fl.) — mörk, perception-tunga → obligatorisk manuell playtest.
6. **PlayerCard** (41 siter, störst) — egen pass, ljus.
7. **Match-laddning/ceremoni** — sammanflätas med MatchLive.

Efter passet (steg 4 — Lås): sänk `ds-guard`-baslinjen till nytt faktiskt antal + koppla in `lint:design-guard` i `build`.

---

## FULL KLASSIFICERING (per fil, path relativt `src/presentation/`)

Format: `site | roll | target | bg | not`. "färg inline" = behåll `color` inline (Ruling 3).

### Batch 1

| site | roll | target | bg | not |
|---|---|---|---|---|
| components/CoachMarks.tsx:57 | display-rubrik | Ruling 1 (15px display-titel) | light | tooltip-titel; ej num/label/quote |
| components/EventOverlay.tsx:106 | label | .h-label | light | typ-badge "Händelse" |
| components/GameHeader.tsx:116 | display-rubrik | Ruling 1 (klubbnamn 12px display) | dark | ljus text på läder |
| components/GameHeader.tsx:126 | quote-sm | .h-quote-light | dark | devis på läder, --header-undertext |
| components/GameHeader.tsx:149 | micro-ruling | Ruling 2 (versal etikett i accent-chip) | light | statisk accent, sigill |
| components/HelpOverlay.tsx:38 | display-rubrik | Ruling 1 (h2 18px display) | light | "Hur funkar det?" |
| components/PhaseIndicator.tsx:55 | exempt-dynamic | inline `// ds-exempt` | dark | label-form men färg = ternary current/done/upcoming |
| components/PlayerCard.tsx:146 | label | .h-label | light | "CA-UTVECKLING" |
| components/PlayerCard.tsx:240 | exempt-dynamic | inline `// ds-exempt` | light | färg ternary trending |
| components/PlayerCard.tsx:376 | label | .h-label | light | pos·ålder·nr accent-dark |
| components/PlayerCard.tsx:393 | quote | .h-quote | light | heroVoice 12.5px italic |
| components/PlayerCard.tsx:397 | quote-sm | .h-quote-sm | light | heroMood 9px italic |
| components/PlayerCard.tsx:416 | num | .h-num | light | mood-värde 15px; barColor() inline |
| components/PlayerCard.tsx:428 | quote-sm | .h-quote-sm | light | seasonArc 11.5px italic |
| components/PlayerCard.tsx:448 | label | .h-label | light | seg-knapp; aktiv/muted färg inline |
| components/PlayerCard.tsx:473 | label | .h-label | light | chip-etikett MÅL/AST/BGT |
| components/PlayerCard.tsx:519 | num-sm | .h-num-sm | light | status-värde; barColor() inline |
| components/PlayerCard.tsx:539 | label | .h-label | light | "SKADAD — N veckor kvar" |
| components/PlayerCard.tsx:603 | label | .h-label | light | "EGENSKAPER" accent |
| components/PlayerCard.tsx:607 | micro-ruling | Ruling 2 | light | "1 säsong sedan" meta |
| components/PlayerCard.tsx:610 | micro-ruling | Ruling 2 | light | "Föråldrad" meta |
| components/PlayerCard.tsx:627 | num-sm | .h-num-sm | light | attribut-värde; statValueColor() inline |
| components/PlayerCard.tsx:628 | micro-ruling | Ruling 2 | light | "~" osäkerhetssuffix |
| components/PlayerCard.tsx:664 | micro-ruling | Ruling 2 | light | ålder/potential-meta |
| components/PlayerCard.tsx:704 | num | .h-num | light | MÅL-värde 14px |
| components/PlayerCard.tsx:705 | label | .h-label | light | "MÅL" |
| components/PlayerCard.tsx:708 | num | .h-num | light | ASSIST-värde |
| components/PlayerCard.tsx:709 | label | .h-label | light | "ASSIST" |
| components/PlayerCard.tsx:712 | num | .h-num | light | MATCHER-värde |
| components/PlayerCard.tsx:713 | label | .h-label | light | "MATCHER" |
| components/PlayerCard.tsx:717 | num | .h-num | light | BETYG-värde; färg ternary inline |
| components/PlayerCard.tsx:720 | label | .h-label | light | "BETYG" |
| components/PlayerCard.tsx:725 | num | .h-num | light | UTVISN-värde danger |
| components/PlayerCard.tsx:726 | label | .h-label | light | "UTVISN" |
| components/PlayerCard.tsx:756 | exempt-dynamic | inline `// ds-exempt` | light | .tag Aktiv/Vilar, färg ternary |
| components/PlayerCard.tsx:760 | quote-sm | .h-quote-sm | light | mentorship-bond 10px italic |
| components/PlayerCard.tsx:784 | exempt-dynamic | inline `// ds-exempt` | light | .tag Aktiv/Vilar, färg ternary |
| components/PlayerCard.tsx:844 | quote-sm | .h-quote-sm | light | bio 11px italic |
| components/PressConferenceScene.tsx:47 | label | .h-label | light | "🎤 PRESSKONFERENS"; emoji syskon |
| components/PressConferenceScene.tsx:50 | micro-ruling | Ruling 2 | light | journalist·outlet meta |
| components/PressConferenceScene.tsx:68 | quote | .h-quote | light | journalist-fråga 14px italic |
| components/SectionCard.tsx:34 | label | .h-label | light | sektionsetikett |
| components/club/AkademiTab.tsx:115 | display-rubrik | Ruling 1 (spelarnamn 13px display) | light | — |

### Batch 2

| site | roll | target | bg | not |
|---|---|---|---|---|
| components/club/AkademiTab.tsx:231 | exempt-dynamic | inline `// ds-exempt` | light | .tag Aktiv/Vilar, isActive |
| components/club/AkademiTab.tsx:247 | quote-sm | .h-quote-sm | light | mentorskaps-narrativ 10.5px italic |
| components/club/AkademiTab.tsx:304 | quote-sm | .h-quote-sm | light | preview-narrativ 10.5px italic |
| components/club/FacilityTree.tsx:171 | micro-ruling | Ruling 2 | light | "Klar omg X" meta |
| components/club/FacilityTree.tsx:182 | micro-ruling | Ruling 2 | light | "Öppnar prövningen" meta |
| components/club/FacilityTree.tsx:188 | quote-sm | .h-quote-sm | light | konsekvens-citat 9px italic |
| components/club/FacilityTree.tsx:194 | micro-ruling | Ruling 2 | light | beskrivningstext |
| components/club/LockerRoomCard.tsx:61 | display-rubrik | Ruling 1 (spelarnamn 13px display) | light | — |
| components/club/LockerRoomCard.tsx:73 | exempt-dynamic | inline `// ds-exempt` | light | lojalitet 14px, loyaltyColor |
| components/club/LockerRoomCard.tsx:124 | label | .h-label | light | "👥 OMKLÄDNINGSRUMMET"; emoji syskon |
| components/club/OrtenMap.tsx:183 | micro-ruling | Ruling 2 | light | "Tryck på en nod" hint |
| components/club/OrtenTab.tsx:120 | exempt-dynamic | inline `// ds-exempt` | light | puls 40px, csColor(cs) |
| components/club/OrtenTab.tsx:128 | label | .h-label | light | "SÄSONG" |
| components/club/OrtenTab.tsx:137 | label | .h-label | light | "ENGAGEMANG" |
| components/club/OrtenTab.tsx:195 | quote | .h-quote | light | klubbcitat 12px italic |
| components/club/OrtenTab.tsx:436 | label | .h-label | light | "RÄKNAS FÖR AGENDAN" accent |
| components/club/TrainingProjectsCard.tsx:88 | label | .h-label | light | "TILLGÄNGLIGA" |
| components/club/TrainingProjectsCard.tsx:104 | exempt-dynamic | inline `// ds-exempt` | light | risk-text, RISK_COLOR dynamisk |
| components/club/TrainingSection.tsx:87 | label | .h-label | light | "TRÄNINGSOMRÅDE" |
| components/club/TrainingSection.tsx:115 | label | .h-label | light | "INTENSITET" |
| components/club/TranareTab.tsx:95 | display-rubrik | Ruling 1 (tränarnamn 16px display) | light | — |
| components/club/TranareTab.tsx:135 | exempt-dynamic | inline `// ds-exempt` | light | burnout 15px, zoneColor |
| components/club/TranareTab.tsx:138 | micro-ruling | Ruling 2 | light | "Senaste N omg." meta |
| components/clubmemory/ClubMemoryView.tsx:92 | label | .h-label | light | "🩸 BLODSLINJE"; emoji syskon |
| components/clubselection/AllClubsView.tsx:47 | display-rubrik | Ruling 1 (16px rubrik, mörk) | dark | "Välj din klubb" |
| components/clubselection/ClubExpandedCard.tsx:75 | quote | .h-quote .h-quote-light | dark | klackcitat 12px italic |
| components/clubselection/OfferCard.tsx:52 | quote | .h-quote .h-quote-light | dark | citat 13px italic |
| components/clubselection/OffersView.tsx:26 | label | .h-label .h-label-light | dark | "⬩ TRE SAMTAL ⬩" accent; dekor syskon |
| components/clubselection/OffersView.tsx:41 | display-rubrik | Ruling 1 (26px h1, mörk) | dark | "Tre klubbar har ringt" |
| components/clubselection/OffersView.tsx:55 | quote | .h-quote .h-quote-light | dark | 12px italic |
| components/dashboard/LastResultCard.tsx:55 | label | .h-label | light | "Senast"; ikon syskon |
| components/dashboard/LastResultCard.tsx:70 | exempt-dynamic | inline `// ds-exempt` | light | resultat count-up live-animation |
| components/dashboard/LastResultCard.tsx:93 | exempt-dynamic | inline `// ds-exempt` | light | 10px italic, färg ternary |
| components/dashboard/NextMatchCard.tsx:34 | num-sm | .h-num-sm | light | form-siffror accent-dark |
| components/dashboard/NextMatchCard.tsx:305 | exempt-dynamic | inline `// ds-exempt` | light | "vs", vsColor dynamisk |
| components/dashboard/NextMatchCard.tsx:329 | quote-sm | .h-quote-sm | light | coach-stil 9px italic |
| components/dashboard/NextMatchCard.tsx:338 | quote | .h-quote | light | SM-final-citat 12px italic |
| components/dashboard/NextMatchCard.tsx:356 | micro-ruling | Ruling 2 | light | "Omgång N" meta |
| components/dashboard/PlayoffBanner.tsx:39 | num-sm | .h-num-sm | light | seriesiffra homeWins |
| components/dashboard/PlayoffBanner.tsx:52 | num-sm | .h-num-sm | light | seriesiffra awayWins |
| components/dashboard/PlayoffBanner.tsx:84 | display-rubrik | Ruling 1 (14px rubrik) | light | "Slutspel N+1" accent |
| components/dashboard/PlayoffBanner.tsx:98 | label | .h-label | light | "KF" |
| components/dashboard/PlayoffBanner.tsx:110 | label | .h-label | light | "SF" |

### Batch 3

| site | roll | target | bg | not |
|---|---|---|---|---|
| components/dashboard/PlayoffBanner.tsx:122 | label | .h-label | light | "Final" accent |
| components/dashboard/PlayoffBanner.tsx:134 | num | .h-num | light | champion-rad; 🥇 syskon; färg inline |
| components/dashboard/SeasonBarometer.tsx:71 | label | .h-label | light | "SÄSONGSBAROMETER"; trendIcon syskon |
| components/dashboard/SeasonBarometer.tsx:92 | num | .h-num | light | stat-värde; success/danger inline |
| components/dashboard/SquadStatusCard.tsx:56 | label | .h-label | light | "👥 Trupp"; emoji syskon |
| components/environment/MiljoHeader.tsx:96 | display-rubrik | Ruling 1 (klubbnamn display, mörk) | dark | textShadow inline |
| components/environment/MiljoHeader.tsx:108 | micro-ruling | Ruling 2 | dark | mono dev-placeholder |
| components/granska/ReaktionerKort.tsx:33 | label | .h-label | light | avsändare/roll-etikett |
| components/illustration/IllustrationScene.tsx:74 | micro-ruling | Ruling 2 | light | mono "illustration på väg" fallback |
| components/match/CeremonyCupFinal.tsx:50 | num-lg | .h-num-lg | dark | resultatsiffra 64px; text-light inline |
| components/match/CeremonyCupFinal.tsx:55 | num-lg | .h-num-lg | dark | resultatsiffra 64px |
| components/match/CeremonySmFinal.tsx:56 | num-lg | .h-num-lg | dark | resultatsiffra 64px |
| components/match/CeremonySmFinal.tsx:61 | num-lg | .h-num-lg | dark | resultatsiffra 64px |
| components/match/CeremonySmFinal.tsx:151 | num-lg | .h-num-lg | dark | MVP-rating 32px; accent inline |
| components/match/DraggablePlayerPill.tsx:45 | display-rubrik | Ruling 1 (efternamn 12px display) | light | — |
| components/match/LastMinutePress.tsx:183 | quote-sm | .h-quote-sm .h-quote-light | dark | utfallstext 11px italic; rå rgba → token |
| components/match/LineupStep.tsx:188 | label | .h-label | light | "X av 11 placerade"; success/muted färg inline |
| components/match/LineupStep.tsx:216 | label | .h-label | light | "Formation"; ikon syskon |
| components/match/LineupStep.tsx:300 | num-sm | .h-num-sm | light | tröjnummer; text-secondary inline |
| components/match/LineupStep.tsx:303 | micro-ruling | Ruling 2 | light | positionskod per rad |
| components/match/LineupStep.tsx:309 | num-sm | .h-num-sm | light | CA-siffra; text-primary inline |
| components/match/LineupStep.tsx:313 | micro-ruling | Ruling 2 | light | badge-siffra i tag-red chip |
| components/match/LineupStep.tsx:318 | micro-ruling | Ruling 2 | light | text i tag-copper chip |
| components/match/LineupStep.tsx:323 | micro-ruling | Ruling 2 | light | text i tag-green chip |
| components/match/MatchDayProgram.tsx:76 | label | .h-label | light | "📋 MATCHDAGSPROGRAM"; emoji syskon |
| components/match/MatchHeader.tsx:68 | display-rubrik | Ruling 1 (motståndarnamn 17px display) | light | — |
| components/match/MatchHeader.tsx:104 | quote | .h-quote | light | coach-citat 12px italic |
| components/match/MatchLaddningBand.tsx:81 | display-rubrik | Ruling 1 (motståndarnamn 16px, mörk) | dark | text-light inline |
| components/match/MatchLaddningBand.tsx:91 | micro-ruling | Ruling 2 | dark | mono plats·relation-meta |
| components/match/MatchLaddningBand.tsx:97 | quote-sm | .h-quote-sm .h-quote-light | dark | charge 12px italic |
| components/match/MatchLaddningScene.tsx:172 | display-rubrik | Ruling 1 (relation-rubrik 23px, mörk) | dark | textShadow inline |
| components/match/MatchLaddningScene.tsx:179 | quote | .h-quote .h-quote-light | dark | charge 12.5px italic |
| components/match/MatchLaddningScene.tsx:192 | num | .h-num | dark | ordPos 16px; text-light inline |
| components/match/MatchLaddningScene.tsx:199 | num | .h-num | dark | playoffRec 16px; text-light inline |
| components/match/MatchLaddningScene.tsx:281 | exempt-dynamic | inline `// ds-exempt` | dark | klubb-initial i per-klubb-färgad badge |
| components/match/MatchLaddningScene.tsx:288 | num-sm | .h-num-sm | dark | shortName 13px; text-light inline |
| components/match/MatchLaddningScene.tsx:306 | exempt-dynamic | inline `// ds-exempt` | dark | klubb-initial i per-klubb-färgad badge |
| components/match/MatchLaddningScene.tsx:313 | num-sm | .h-num-sm | dark | shortName 13px; text-light inline |
| components/match/MatchLaddningScene.tsx:332 | quote-sm | .h-quote-sm .h-quote-light | dark | keyline-citat 11px italic |
| components/match/MatchLaddningScene.tsx:418 | label | .h-label .h-label-light | dark | eyebrow; ⬩ syskon; eyebrowColor inline |
| components/match/MatchLaddningScene.tsx:427 | display-rubrik | Ruling 1 (motståndarnamn 26px, mörk) | dark | textShadow inline |
| components/match/MatchLaddningScene.tsx:438 | micro-ruling | Ruling 2 | dark | mono plats·relation-meta 9.5px |
| components/match/MatchLaddningScene.tsx:446 | quote | .h-quote .h-quote-light | dark | charge 13.5px italic |
| components/match/MatchReportView.tsx:114 | quote | .h-quote | light | matchberättelse 13px; fontStyle dynamisk inline |

### Batch 4

| site | roll | target | bg | not |
|---|---|---|---|---|
| components/match/NodtruppScene.tsx:61 | label | .h-label | light | danger-text inline |
| components/match/NodtruppScene.tsx:77 | label | .h-label | light | muted = kanon |
| components/match/NodtruppScene.tsx:98 | label | .h-label | light | muted = kanon |
| components/match/OpponentAnalysisCard.tsx:37 | label | .h-label | light | "📋"; emoji syskon |
| components/match/OpponentAnalysisCard.tsx:44 | display-rubrik | Ruling 1 (13px cup-label display) | light | gränsfall |
| components/match/OpponentAnalysisCard.tsx:51 | num-lg | .h-num-lg | light | #position 18px; färg inline |
| components/match/PhaseOverlay.tsx:40 | micro-ruling | Ruling 2 (CTA-knapptext display) | light | beslut |
| components/match/SlotLineupView.tsx:166 | label | .h-label | light | gruppetikett |
| components/match/SlotLineupView.tsx:257 | label | .h-label | light | "Lagstyrka" |
| components/match/StartStep.tsx:114 | quote | .h-quote | light | pep-talk 14px italic |
| components/match/StartStep.tsx:130 | quote-sm | .h-quote-sm | light | klack-ritual 11px italic |
| components/match/TacticPreview.tsx:90 | label | .h-label | light | rå rgba → token |
| components/match/TacticPreview.tsx:97 | label | .h-label | light | rå rgba → token |
| components/match/TacticPreview.tsx:128 | micro-ruling | Ruling 2 | light | legend "MV", rå rgba |
| components/match/TacticPreview.tsx:132 | micro-ruling | Ruling 2 | light | legend "Utespelare", rå rgba |
| components/match/TacticStep.tsx:97 | label | .h-label | light | oppName-etikett |
| components/match/TacticStep.tsx:114 | label | .h-label | light | "Förslag mot" var(--warm) |
| components/match/TacticStep.tsx:125 | micro-ruling | Ruling 2 | light | nudge-legend |
| components/portal/AnnandagsValEvent.tsx:112 | quote | .h-quote .h-quote-light | dark | body-narrativ 13px italic |
| components/portal/CeremonyRetirement.tsx:45 | display-rubrik | Ruling 1 (spelarnamn 26px h1, mörk) | dark | — |
| components/portal/PortalBeat.tsx:120 | quote | .h-quote .h-quote-light | dark | beat-text 12px italic; textColor inline |
| components/portal/SituationCard.tsx:34 | quote | .h-quote .h-quote-light | dark | body 13px italic |
| components/portal/minimal/EconomyMinimal.tsx:21 | num | .h-num | dark | kassa; finances<0 danger inline |
| components/portal/minimal/FormStatusMinimal.tsx:33 | num | .h-num | dark | avgForm; formColor inline |
| components/portal/minimal/KlackenMoodMinimal.tsx:30 | num | .h-num | dark | moodLabel; moodColor inline |
| components/portal/minimal/SquadStatusMinimal.tsx:31 | num | .h-num | dark | kondition; text-primary |
| components/portal/minimal/SquadStatusMinimal.tsx:37 | num | .h-num | dark | readyCount; injured>0 warning inline |
| components/portal/primary/DerbyPrimary.tsx:64 | label | .h-label .h-label-light | dark | 🔥 syskon; danger inline |
| components/portal/primary/DerbyPrimary.tsx:74 | display-rubrik | Ruling 1 (opponent.name 22px) | dark | — |
| components/portal/primary/EventPrimary.tsx:41 | label | .h-label .h-label-light | dark | emoji syskon; danger inline |
| components/portal/primary/EventPrimary.tsx:51 | display-rubrik | Ruling 1 (rubrik 20px) | dark | — |
| components/portal/primary/NextMatchPrimary.tsx:96 | label | .h-label .h-label-light | dark | specialDateLabel accent |
| components/portal/primary/PatronDemandPrimary.tsx:33 | label | .h-label .h-label-light | dark | 👤 syskon; danger inline |
| components/portal/primary/PatronDemandPrimary.tsx:43 | display-rubrik | Ruling 1 (patron.name 22px) | dark | — |
| components/portal/primary/PatronDemandPrimary.tsx:57 | quote | .h-quote .h-quote-light | dark | demand-citat 12px italic |
| components/portal/primary/SMFinalPrimary.tsx:69 | display-rubrik | Ruling 1 (arenaName 22px) | dark | — |
| components/portal/primary/SMFinalPrimary.tsx:94 | label | .h-label .h-label-light | dark | "VÄDER" |
| components/portal/primary/TransferDeadlinePrimary.tsx:55 | label | .h-label .h-label-light | dark | ⏱ syskon; warning inline |
| components/portal/primary/TransferDeadlinePrimary.tsx:65 | display-rubrik | Ruling 1 (rubrik 22px) | dark | — |
| components/portal/secondary/CoffeeRoomSecondary.tsx:46 | quote | .h-quote .h-quote-light | dark | kafeteria-citat 12px italic |
| components/portal/secondary/CoffeeRoomSecondary.tsx:55 | micro-ruling | Ruling 2 | dark | "Klicka för att lyssna" hint |
| components/portal/secondary/EfterklangSecondary.tsx:42 | micro-ruling | Ruling 2 | dark | mono countLabel |
| components/portal/secondary/EfterklangSecondary.tsx:65 | label | .h-label .h-label-light | dark | objectName; nameColor() inline |
| components/portal/secondary/EfterklangSecondary.tsx:79 | quote-sm | .h-quote-sm .h-quote-light | dark | eko-citat 12.5px italic |

### Batch 5

| site | roll | target | bg | not |
|---|---|---|---|---|
| components/portal/secondary/EfterklangThreadModal.tsx:79 | micro-ruling | Ruling 2 | dark | mono "OMG {n}" |
| components/portal/secondary/EkonomiSecondary.tsx:68 | exempt-dynamic | inline `// ds-exempt` | dark | netStr success/danger ternary |
| components/portal/secondary/InjuryStatusSecondary.tsx:59 | micro-ruling | Ruling 2 | dark | veckor-kvar meta |
| components/portal/secondary/InjuryStatusSecondary.tsx:65 | micro-ruling | Ruling 2 | dark | "+N till →" meta |
| components/portal/secondary/InjuryStatusSecondary.tsx:71 | quote-sm | .h-quote-sm .h-quote-light | dark | kontextrad italic |
| components/portal/secondary/JournalistSecondary.tsx:118 | num-sm | .h-num-sm | dark | relationship-värde; färg inline |
| components/portal/secondary/KlackenSecondary.tsx:49 | quote | .h-quote .h-quote-light | dark | klack-citat 12px italic |
| components/portal/secondary/KlackenSecondary.tsx:57 | exempt-dynamic | inline `// ds-exempt` | dark | moodColor dynamisk |
| components/portal/secondary/LandslagsFranvaroSecondary.tsx:24 | label | .h-label | light | "VM-uppehåll" |
| components/portal/secondary/OpenBidsSecondary.tsx:49 | micro-ruling | Ruling 2 | dark | "klubb · svar krävs" meta |
| components/portal/secondary/OpponentFormSecondary.tsx:64 | micro-ruling | Ruling 2 | dark | "{pos}:a · {pts}p" meta |
| components/portal/secondary/SourceSecondaryCard.tsx:48 | quote | .h-quote .h-quote-light | dark | dormantBody 13px italic |
| components/portal/secondary/TabellSecondary.tsx:119 | num-lg | .h-num-lg | dark | posLabel 22px; färg inline |
| components/portal/secondary/TabellSecondary.tsx:127 | micro-ruling | Ruling 2 | dark | "{pts}p · V O F" meta |
| components/portal/secondary/TabellSecondary.tsx:151 | quote-sm | .h-quote-sm .h-quote-light | dark | kontextrad 9px italic |
| components/portal/secondary/TabellSecondary.tsx:155 | exempt-dynamic | inline `// ds-exempt` | dark | ptsDiff success/warning ternary |
| components/primitives/InfoRow.tsx:20 | label | .h-label | light | versal letter-spaced |
| components/primitives/InfoRow.tsx:29 | num-sm | .h-num-sm | light | display-värde 12px; färg inline |
| components/primitives/PageSection.tsx:14 | label | .h-label | light | sektionstitel |
| components/primitives/StatBadge.tsx:19 | num-lg | .h-num-lg | light | värde 28px; tone-färg inline |
| components/primitives/StatBadge.tsx:28 | label | .h-label | light | versal etikett |
| components/shared/Spine.tsx:18 | label | .h-label | light | titel 0.08em |
| components/squad/LockerRoomMap.tsx:61 | label | .h-label | light | "🚪 OMKLÄDNINGSRUMMET"; emoji syskon |
| components/squad/LockerRoomMap.tsx:67 | label | .h-label | light | "📋 TAKTIKTAVLA"; emoji syskon |
| components/squad/SeasonArcCard.tsx:227 | display-rubrik | Ruling 1 (värdeord ~11px display, ej siffra) | light | accent-dark |
| components/squad/SeasonArcCard.tsx:237 | micro-ruling | Ruling 2 | light | legend 9.5px |
| components/squad/SeasonArcCard.tsx:281 | exempt-dynamic | inline `// ds-exempt` | light | m===mode accent/muted ternary |
| components/squad/SeasonArcCard.tsx:296 | quote-sm | .h-quote-sm | light | consequenceLine 10.5px italic |
| components/squad/SeasonArcCard.tsx:309 | num-sm | .h-num-sm | light | warnCount 11px accent-dark |
| components/squad/SeasonArcCard.tsx:316 | quote | .h-quote | light | "Ingen reagerar..." 12.5px italic |
| components/squad/SeasonArcCard.tsx:374 | num-sm | .h-num-sm | light | fitness 12px |
| components/squad/SeasonArcCard.tsx:385 | micro-ruling | Ruling 2 | light | knapptext "Håll" |
| components/squad/SeasonArcCard.tsx:389 | micro-ruling | Ruling 2 | light | knapptext "Vila" |
| components/squad/SeasonArcCard.tsx:395 | micro-ruling | Ruling 2 | light | knapptext "Följ truppen" |
| components/squad/StillnessSection.tsx:120 | num | .h-num | light | pulse 15px |
| components/squad/StillnessSection.tsx:124 | micro-ruling | Ruling 2 | light | "Senaste N omgångar" meta |
| components/tactic/FormationView.tsx:200 | micro-ruling | Ruling 2 | light | mentality-chip |
| components/tactic/FormationView.tsx:203 | micro-ruling | Ruling 2 | light | "·" separator |
| components/tactic/FormationView.tsx:204 | micro-ruling | Ruling 2 | light | tempo-chip |
| components/tactic/FormationView.tsx:207 | micro-ruling | Ruling 2 | light | "·" separator |
| components/tactic/FormationView.tsx:208 | micro-ruling | Ruling 2 | light | press-chip |
| components/tactic/FormationView.tsx:214 | micro-ruling | Ruling 2 | light | "ändras i lineup" länk |
| components/tactic/FormationView.tsx:286 | quote-sm | .h-quote-sm | light | coachQuote 11px italic |
| components/tactic/FormationView.tsx:291 | micro-ruling | Ruling 2 | light | "— Coachen" attribution |

### Batch 6

| site | roll | target | bg | not |
|---|---|---|---|---|
| components/tactic/FormationView.tsx:336 | label | .h-label | light | "Lagstyrka" |
| components/tactic/FormationView.tsx:346 | label | .h-label | light | "BÄNKEN"-rad |
| components/tactic/FormationView.tsx:363 | label | .h-label | light | POS-förkortning |
| components/tactic/FormationView.tsx:367 | micro-ruling | Ruling 2 | light | CA-siffra |
| components/tactic/FormationView.tsx:376 | micro-ruling | Ruling 2 | light | legend-rad |
| components/tactic/NotesView.tsx:43 | label | .h-label | light(chip) | NoteTag-badge; chip-färg inline |
| components/tactic/NotesView.tsx:84 | num-sm | .h-num-sm (+ light) | dark | coach-initialer på läder |
| components/tactic/NotesView.tsx:89 | label | .h-label | light | "NAMN · ASSISTENT" |
| components/tactic/NotesView.tsx:92 | quote | .h-quote | light | coach-citat 12px italic |
| components/tactic/NotesView.tsx:118 | micro-ruling | Ruling 2 | dark | POS-glyf i färgad cirkel |
| components/tactic/NotesView.tsx:122 | display-rubrik | Ruling 1 (spelarnamn 13px display) | light | — |
| components/tactic/NotesView.tsx:131 | quote-sm | .h-quote-sm | light | note-citat 11px italic |
| components/tactic/NotesView.tsx:153 | num-sm | .h-num-sm (+ light) | dark | coach-initialer på läder |
| components/tactic/NotesView.tsx:158 | quote-sm | .h-quote-sm | light | aggregat-citat 11px italic |
| components/tactic/TacticBoardCard.tsx:56 | label | .h-label | light | spelstil-knappar; aktiv färg inline |
| components/tactic/TacticBoardCard.tsx:84 | quote-sm | .h-quote-sm | light | "feel"-rad 10.5px italic |
| components/transfers/TransferPlayerCard.tsx:39 | display-rubrik | Ruling 1 (spelarnamn 13px display) | light | — |
| components/transfers/WageOverrunWarning.tsx:44 | display-rubrik | Ruling 1 (modal-titel 15px display) | light | — |
| navigation/BottomNav.tsx:100 | label | .h-label | light | lockReason |
| navigation/BottomNav.tsx:147 | exempt-dynamic | inline `// ds-exempt` | light | nav-etikett, active accent/muted ternary |
| screens/ChampionScreen.tsx:127 | display-rubrik | Ruling 1 (h1 28px) | light | "Svenska Mästare" → ev. .h-display-md |
| screens/ChampionScreen.tsx:148 | display-rubrik | Ruling 1 (h1 22px) | light | → ev. .h-display-sm |
| screens/FacilityScreen.tsx:123 | label | .h-label | light | "Finansiering" |
| screens/GameOverScreen.tsx:95 | display-rubrik | Ruling 1 (h1 26px) | light | "DU HAR SPARKATS" → ev. .h-display-md |
| screens/HalfTimeSummaryScreen.tsx:68 | exempt-dynamic | inline `// ds-exempt` | light | position 28px, success/primary ternary |
| screens/HalfTimeSummaryScreen.tsx:71 | micro-ruling | Ruling 2 | light | "plats"-underetikett |
| screens/HalfTimeSummaryScreen.tsx:74 | num-lg | .h-num-lg | light | poäng 28px; färg inline |
| screens/HalfTimeSummaryScreen.tsx:77 | micro-ruling | Ruling 2 | light | "poäng"-underetikett |
| screens/HalfTimeSummaryScreen.tsx:81 | num-lg | .h-num-lg | light | 28px; warning-färg inline |
| screens/HalfTimeSummaryScreen.tsx:84 | micro-ruling | Ruling 2 | light | "till topp 8"-underetikett |
| screens/HistoryScreen.tsx:79 | label | .h-label | light | "Resan…" |
| screens/HistoryScreen.tsx:178 | display-rubrik | Ruling 1 (h1 20px) | light | "Klubbhistorik" |
| screens/HistoryScreen.tsx:225 | label | .h-label | light | "STAFETTEN" |
| screens/HistoryScreen.tsx:512 | label | .h-label | light | "Flest mål…"; 🎯 syskon |
| screens/HistoryScreen.tsx:527 | label | .h-label | light | "Flest matcher"; ikon syskon |
| screens/HistoryScreen.tsx:542 | label | .h-label | light | "Bästa snittbetyg"; ⭐ syskon |
| screens/InboxScreen.tsx:189 | num-sm | .h-num-sm | light | coach-initialer 10px; accent inline |
| screens/InboxScreen.tsx:208 | micro-ruling | Ruling 2 | light | body-preview 9.5px |
| screens/InboxScreen.tsx:243 | micro-ruling | Ruling 2 | light | round-label meta |
| screens/InboxScreen.tsx:251 | label | .h-label | light | accent-CTA letter-spaced (gränsfall) |
| screens/InboxScreen.tsx:343 | label | .h-label | light | "Visa ›" CTA (gränsfall) |
| screens/InboxScreen.tsx:444 | quote-sm | .h-quote-sm | light | coach-sammanfattning 10.5px italic |
| screens/InboxScreen.tsx:449 | micro-ruling | Ruling 2 | light | "X veckorapporter" meta |
| screens/InboxScreen.tsx:512 | display-rubrik | Ruling 1 (h2 16px "Inkorg") | light | — |

### Batch 7

| site | roll | target | bg | not |
|---|---|---|---|---|
| screens/InboxScreen.tsx:534 | quote | .h-quote | light | empty-state 14px italic |
| screens/InboxScreen.tsx:565 | num-sm | .h-num-sm | light | count 10px; unread-badge dotColor inline |
| screens/InboxScreen.tsx:651 | quote-sm | .h-quote-sm | light | footer-narrativ 10.5px italic |
| screens/MatchScreen.tsx:619 | quote-sm | .h-quote-sm | light | stämningskort 11px italic |
| screens/NameInputScreen.tsx:63 | display-rubrik | Ruling 1 (h2 28px "VEM ÄR DU?") | light | — |
| screens/NameInputScreen.tsx:69 | quote | .h-quote | light | brödtext 13px italic |
| screens/NameInputScreen.tsx:121 | label | .h-label | light | "BURY FEN" footer |
| screens/PlayoffIntroScreen.tsx:108 | label | .h-label | light | table-header #/Lag/P/MS |
| screens/PlayoffIntroScreen.tsx:163 | micro-ruling | Ruling 2 | light | seed "{homeSeed}." |
| screens/PlayoffIntroScreen.tsx:169 | micro-ruling | Ruling 2 | light | seed "{awaySeed}." |
| screens/RoundSummaryScreen.tsx:194 | label | .h-label | light | versal; ikon syskon |
| screens/RoundSummaryScreen.tsx:231 | label | .h-label | light | "MATCHEN" |
| screens/RoundSummaryScreen.tsx:243 | label | .h-label | light | "📊 TABELL"; emoji syskon |
| screens/RoundSummaryScreen.tsx:247 | num-lg | .h-num-lg | light | tabellposition 24px; accent-dark inline |
| screens/RoundSummaryScreen.tsx:261 | label | .h-label | light | "📈 FORM"; emoji syskon |
| screens/RoundSummaryScreen.tsx:280 | label | .h-label | light | "🏋️ TRÄNING"; emoji syskon |
| screens/RoundSummaryScreen.tsx:305 | label | .h-label | light | "🎓 AKADEMIN"; emoji syskon |
| screens/RoundSummaryScreen.tsx:323 | label | .h-label | light | "🏘️ ORTEN"; emoji syskon |
| screens/RoundSummaryScreen.tsx:327 | exempt-dynamic | inline `// ds-exempt` | light | 18px, csColor(cs) dynamisk |
| screens/RoundSummaryScreen.tsx:347 | label | .h-label | light | "💰 EKONOMI"; emoji syskon |
| screens/RoundSummaryScreen.tsx:350 | exempt-dynamic | inline `// ds-exempt` | light | 18px, finances<0 ternary |
| screens/RoundSummaryScreen.tsx:395 | label | .h-label | light | "ANDRA MATCHER" |
| screens/RoundSummaryScreen.tsx:440 | label | .h-label | light | "📰 PRESSKLIPP"; emoji syskon |
| screens/SeasonSummaryScreen.tsx:304 | label | .h-label .h-label-light | dark | pill på accent; ⭐ syskon |
| screens/SeasonSummaryScreen.tsx:329 | quote | .h-quote | light | match-narrativ 12px italic |
| screens/SeasonSummaryScreen.tsx:486 | quote-sm | .h-quote-sm | light | storyline 11px italic; inre namn-span behålls |
| screens/SeasonSummaryScreen.tsx:539 | exempt-dynamic | inline `// ds-exempt` | light | "CUPVINNARE!" storlek+färg ternary |
| screens/SimSummaryScreen.tsx:107 | num-lg | .h-num-lg | light | "{n} matcher" 18px; text-primary |
| screens/SquadScreen.tsx:264 | display-rubrik | Ruling 1 (spelarnamn 14px display) | light | — |
| screens/SquadScreen.tsx:308 | micro-ruling | Ruling 2 | light | "Styrka" 9px |
| screens/TabellScreen.tsx:129 | num | .h-num | light | statvärde 15px; accent-dark inline |
| screens/TabellScreen.tsx:225 | label | .h-label | light | "Slutspelsstrecket"; ━━ + bg behålls |
| screens/TabellScreen.tsx:244 | label | .h-label | light | "Nedflyttning"; ━━ + danger-bg behålls |
| screens/TabellScreen.tsx:290 | exempt-dynamic | inline `// ds-exempt` | light | ▲/▼ posDiff success/danger |
| screens/TabellScreen.tsx:503 | exempt-dynamic | inline `// ds-exempt` | light | 14px, statusColor 4-grenars ternary |
| screens/TabellScreen.tsx:511 | label | .h-label | light | "🏆 DINA CUPMATCHER"; emoji syskon |
| screens/TabellScreen.tsx:542 | label | .h-label | light | "🏆 NÄSTA CUPMATCH"; emoji syskon |
| screens/TabellScreen.tsx:563 | label | .h-label | light | runda-label |
| screens/TabellScreen.tsx:593 | num | .h-num | light | score/vs 14px; ärvd färg |
| screens/TabellScreen.tsx:632 | label | .h-label | light | "CUPENS SKYTTEKUNGAR"; ikon syskon |
| screens/TabellScreen.tsx:654 | num | .h-num | light | målantal 15px; accent-dark; " mål"-span behålls |
| screens/TaktikScreen.tsx:60 | label | .h-label | light | "TAKTIKTAVLAN" |
| screens/granska/GranskaAnalys.tsx:43 | micro-ruling | Ruling 2 | dark | coach-initialer i badge på accent-bar |
| screens/granska/GranskaAnalys.tsx:45 | label | .h-label .h-label-light | dark | coach-namn · ASSISTENTTRÄNARE |

### Batch 8

| site | roll | target | bg | not |
|---|---|---|---|---|
| screens/granska/GranskaAnalys.tsx:48 | quote | .h-quote | light | assistenttränarcitat 13px italic |
| screens/granska/GranskaAnalys.tsx:76 | micro-ruling | Ruling 2 | light | minutmarkör {e.minute}' |
| screens/granska/GranskaAnalys.tsx:87 | micro-ruling | Ruling 2 | light | minutmarkör {e.minute}' |
| screens/granska/GranskaAnalys.tsx:121 | num-sm | .h-num-sm | light | betyg 12px; r>=7 ternary inline |
| screens/granska/GranskaAnalys.tsx:131 | num-sm | .h-num-sm | light | betyg 12px; danger inline |
| screens/granska/GranskaOversikt.tsx:214 | num-lg | .h-num-lg | light | tabellposition 18px |
| screens/granska/GranskaOversikt.tsx:229 | exempt-dynamic | inline `// ds-exempt` | light | form-dot, dotColor(result) bg |
| screens/granska/GranskaOversikt.tsx:253 | label | .h-label | light | statlabel versal muted |
| screens/granska/GranskaOversikt.tsx:346 | quote | .h-quote | light | pressfråga 13px italic |
| screens/granska/GranskaOversikt.tsx:387 | quote | .h-quote | light | CS-pressfråga 13px italic |
| screens/granska/GranskaOversikt.tsx:418 | quote | .h-quote | light | domarmöte 13px italic |
| screens/granska/GranskaOversikt.tsx:458 | quote | .h-quote | light | media-rubrik 13px display-prosa |
| screens/granska/GranskaOversikt.tsx:609 | micro-ruling | Ruling 2 | light | utfallsrad 9.5px |
| screens/granska/GranskaOversikt.tsx:616 | exempt-dynamic | inline `// ds-exempt` | light | M15 18px, valueColor[stripe] dynamisk |
| screens/granska/GranskaScreen.tsx:236 | label | .h-label | light | step-label "FÖRDJUPA" |
| screens/granska/GranskaShotmap.tsx:188 | micro-ruling | Ruling 2 | light | legendnamn 9px (diagram-radetikett) |
| screens/granska/GranskaShotmap.tsx:207 | label | .h-label | light | "DITT SKOTTMÖNSTER"; 🎯 syskon |
| screens/granska/GranskaShotmap.tsx:249 | label | .h-label | light | motståndar-label; 🛡 syskon |
| screens/granska/GranskaShotmap.tsx:296 | label | .h-label | light | "INSIKT" accent; 💡 syskon |
| screens/granska/GranskaSpelare.tsx:60 | label | .h-label | light | avsändaretikett namn·roll |
| screens/granska/GranskaSpelare.tsx:116 | display-rubrik | Ruling 1 (spelarnamn 12px display) | light | radlista, ej citat |
| screens/granska/GranskaSpelare.tsx:125 | num | .h-num | light | betyg 15px; ratingColor(r) inline |
| screens/granska/GranskaSpelare.tsx:136 | label | .h-label | light | "BÄNKEN" |
| screens/granska/GranskaSpelare.tsx:146 | num-sm | .h-num-sm | light | bänkbetyg 12px muted |
| screens/match/MatchLiveScreen.tsx:1469 | micro-ruling | Ruling 2 (+ rå rgba → token) | dark | domarmeta mono; **MatchLive — tas i omdesignen** |
| screens/scenes/BoardMeetingScene.tsx:73 | label | .h-label .h-label-light | dark | genre; GENRE_COLOR dynamisk inline |
| screens/scenes/BoardMeetingScene.tsx:93 | label | .h-label .h-label-light | dark | talaretikett namn·roll |
| screens/scenes/BoardMeetingScene.tsx:115 | label | .h-label .h-label-light | dark | eval-rubrik |
| screens/scenes/BoardMeetingScene.tsx:137 | label | .h-label .h-label-light | dark | "Kassa" |
| screens/scenes/BoardMeetingScene.tsx:146 | label | .h-label .h-label-light | dark | "Transferbudget" |
| screens/scenes/BoardMeetingScene.tsx:154 | label | .h-label .h-label-light | dark | målrubrik; 📋 syskon |
| screens/scenes/JournalistRelationshipScene.tsx:41 | label | .h-label .h-label-light | dark | genre accent |
| screens/scenes/JournalistRelationshipScene.tsx:78 | label | .h-label .h-label-light | dark | "Relation" muted |
| screens/scenes/JournalistRelationshipScene.tsx:97 | label | .h-label .h-label-light | dark | "Senast hörda" muted |
| screens/scenes/SeasonSignatureRevealScene.tsx:54 | label | .h-label .h-label-light | dark | genretagg accent |
| screens/scenes/shared/CoffeeExchange.tsx:62 | label | .h-label .h-label-light | dark | talarnamn muted |
| screens/scenes/shared/SceneChoiceButton.tsx:52 | micro-ruling | Ruling 2 | dark | effectDescription 9px italic system-font |
| screens/scenes/shared/VictoryScore.tsx:38 | quote | .h-quote .h-quote-light | dark | lagnamnsrad 14px display-narrativ |

---

## NÄSTA STEG (körorder)

1. **Jacob/Opus/designer:** klubba Ruling 1 (display-rubrik), Ruling 2 (mikrotext), bekräfta Ruling 3 (dynamisk färg). Lägg i `design-system/DESIGN-DECISIONS.md`.
2. **Designer + Code:** kör passet per skärm-ordningen, sammanflätat med MatchLive. En skärm → playtest-verifiera → nästa.
3. **Code (efter passet):** sänk `ds-guard`-baslinjen till nytt antal + lägg `lint:design-guard` i `build`-steget.
4. **Bonus när som helst:** rå `rgba()` i `MatchLiveScreen:1469`, `TacticPreview:90/97`, `LastMinutePress:183` → tokens.
