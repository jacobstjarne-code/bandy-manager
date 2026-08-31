# TRIAGE — audit 2026-08-29 (kul/stickiness/visuell, 5-säsongers långspel)

**Triage av:** Opus, 2026-08-29 · **Källa:** `docs/incoming/BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md`
**Auditens snapshot:** `7d9bf8c7` — FÖRE `f5c3c8c6` (villkor 2), `af760bec` (solvens), `e765efd5` (tränarmarknaden), `69259aad` (HistoryScreen). Läs varje fynd mot det: en del är redan åtgärdat.

## Samlad dom (Opus)
Auditen är stark på riktning. Den rekommenderar självständigt två saker vi redan bygger: **#5 avsked→fortsatt karriär** (= tränarmarknaden, byggd `e765efd5` EFTER snapshoten — auditens största stickiness-klagomål är alltså redan besvarat) och **#12 val där båda sidor svider** (= framgångskurvan, anspåk 4 är svaret). Kärnvärdet — ton, plats, matchdrama — bekräftas 8/10. Det som håller igen är inte bredd utan redaktionell/kausal skärpa och fyra förtroendeblockerare. **Auditens produktordning gäller: sanning först, orsak/verkan, mindre repetition, sedan mer innehåll.**

## A · FÖRTROENDEBLOCKERARE — nya, fil-rad-diagnosticerade, INTE i kön (Code-redo)
Dessa outrankar framgångskurvans djupjobb (inkl. anspåk 4). De gör allt nytt innehåll mindre värt tills de är lösta.

1. **CRITICAL — falska SM-guld.** Cupsemifinal/final delas ut som SM-final + SM-ceremoni. `MatchLiveScreen.tsx:145` sätter `isSmFinal = isNeutralVenue === true`; cupfinaler är också neutrala. Fix: härled SM-final ur `!fixture.isCup` + faktiskt finalmedlemskap, inte neutral plan. Störst möjliga utmärkelse får aldrig vara opålitlig. → **Code.**
2. **BLOCKER — cupsegerns scen går inte att lämna, Hem låses permanent.** `gameFlowActions.ts:750` (cup_final_victory-grenen) loggar bara citatet, lägger aldrig scen-id i `shownScenes` (jfr standardgrenen :783), så `sceneTriggerService.ts:107` re-triggar. Fix: markera `sm_final_victory` OCH `cup_final_victory` som visade före nästa triggerdetektion. → **Code.**
3. **CRITICAL — konditions-dödsspiral + autofyll startar 0%-spelare.** `lineupNudge.ts:42–79` fyller från gruppen under golvet 22 om <11 finns; `playerStateProcessor.ts:170–180` dränerar snabbare än vila/sommar återställer. **ÖVERLAPPAR A-H3** (som byggde tillgänglighetsgolv + Sliten/Vilar-ytor men INTE autofyll-logiken eller återhämtningskurvan). A-H3 ska INTE stängas förrän detta är åtgärdat. Behöver ett produktkrav (Opus/Jacob: t.ex. "normal rotation + Vila får ej lämna majoriteten under 25%") + Code. → **Opus-dom på tröskeln, sen Code.**
4. **HIGH — sanningen spricker mellan styrelsemål, årsbok och Game Over.** Årsboken säger "överträffade alla förväntningar" på 8:e plats medan målet var topp 6; Game Over säger ihållande besvikelse. `seasonSummaryService.ts:468–473` dömer mot grov `seasonStartBoardExpectation`-enum, inte det konkreta målet/boardPatience. Fix: en gemensam sanningsmodell (uttalat mål · utfall · relationens slutläge), alla tre ytor läser samma snapshot. → **Code** (modell) **+ Opus** (copy som förklarar skillnaden bedömd-säsong vs relation).

## B · ÖVERLAPPAR BEFINTLIGA KÖPOSTER
- **HIGH 6** (årsboken "Inget beslut stack ut" trots stora beslut) → **A-H9** (`DOM_AH9_ARSBOKENS_BESLUT`). Auditen säger rankningen är rätt ordnad nu (A-H9-jobbet), men beslut fångas inte som kandidater. Öppen del av A-H9. → Code.
- **HIGH 10** (burnout permanent bakgrundsbrus, ingen båge) → vilomekaniken/A-H3-familjen. Vill ha båge med start/eskalering/kostnad/återhämtning/slut. → Opus-dom + Code.
- **HIGH 12** (ekonomin ger sällan smärtsamma val) → **A-H2 / anspåk 4**. Direkt validering. Anspåk 4 (ortsunderhåll som konkurrerar) är exakt "val där båda sidor svider". → Opus (spec anspåk 4).

## C · OPUS-TEXT / bandyspråket (B-serien)
- **HIGH 7** press/event upprepas + saknar matchkontext (derby-copy efter icke-derby, "förlora hemma" efter bortaförlust, playoff-copy efter avslutad serie). Eligibility måste skiljas från textval; varje mall deklarerar tävling/hemma-borta/fas/resultat/cooldown. → Code (eligibility-separation) + Opus (mallarna, B-serien).
- **HIGH 8** akademidebuten återanvänds (samma "17 år... hungrigast på träning"). `youthProcessor.ts:155–185` event-id inkl. nextMatchday → re-berättigande. Code: spelarbaserat event-id + krav på verklig förstamatch/förstamål. Opus: unik copy för debut vs förstamål vs etablering. → Code + Opus.
- **VISUELL MEDIUM** språkläckor: `forward`, `goalkeeper`, `leader`, `veteran`, `Press low`, `CA`, `4 veckar`. Enum-etiketter renderas oöversatta + "4 veckar" är pluralbugg (ska vara veckor). → Code (lokaliseringslager för position/roll/taktik-enums + pluralfix) + Opus (de svenska termerna).

## D · DESIGN-DOMAR SOM BEHÖVS (Opus/Jacob före bygge)
- **HIGH 11** dashboardens beslutsskuld (7–9 uppskjutna, Tryck: Hög) → tre nivåer istället för en kö (måste-före-match / denna-månad / bakgrund), max ett primärt + ett batchat sekundärt kort, dokumenterat default-utfall vid rollover. Produktdom.
- **VISUELL** DecisionCard-hierarki: konsolideringen gav konsekvens men inte semantiska nivåer (lågmäld notis / verkligt dilemma / dramatisk brytpunkt). Samma rot som HIGH 11. En dom, två ytor.
- **HIGH 5** match/omgång-numren (roundNumber vs matchday krockar i portal/live/årsbok) → tävlingsspecifikt label-objekt, förbjud råa heltal i UI. Mest Code, men labelspråket är Opus.

## E · POLISH / LÅG (Code, batchbar)
MEDIUM 13 (anläggningsbygge saknar commit-bekräftelse + räknar globala steg), MEDIUM 14 ("Hoppa över introduktionen" hoppar inte onboardingen — döp om till "Hoppa över ankomsten"), MEDIUM 15 (sponsormotbud återställs), MEDIUM 16 (kontraktsdeadline trängs inte igenom), HIGH 9 (skadad-spela-vidare-kort på frisk spelare — re-validera precondition vid render), samt visuella: tom första matchillustration (`IllustrationScene.tsx` renderar "illustration på väg"), enradig kafferumsscen osynlig replik, fast CTA krockar med innehåll (safe-area), Orten-volontärer horisontell brytning, skottkarta överlappar etiketter, årsbokens guld-pill överlapp, 12-klubbslistan saknar svårighet. LOW-listan i auditen.

## F · REDAN ÅTGÄRDAT SEDAN SNAPSHOTEN — verifiera, stäng inte blint
- **#5 avsked→karriär:** tränarmarknaden `e765efd5`. Auditens #5 och "hatade: avskedet raderade karriären" är byggt. Men auditens visuella flagga står kvar: nya skärmarnas strängar är `[Opus]` (16 platshållare) + GameOverScreen staplar tre knappar (visuell koll 390×844).
- **HistoryScreen identitetsblödning** `69259aad` (Code fann själv) kan ha förekommit en del av auditens historik-inkonsekvenser.

## Sekvensrekommendation (Opus)
Auditen omordnar min förra rekommendation. Jag sa "anspåk 4 härnäst" — **det reviderar jag.** Förtroendeblockerarna A1–A4 är spelarvända showstoppers (falska SM-guld, låst Hem) och outrankar anspåk 4 (internt ekonomidjup). Ordning: **A1, A2 (rena Code-buggar, snabba) → A4 sanningsmodell → A3 konditionsspiral (Opus-tröskel + Code) → sen anspåk 4.** Dominantöverskottet från solvensfixen väntar tåligt; en falsk SM-guld gör det inte.

Anspåk 4 förblir på kritiska vägen för framgångskurvans SLUTförande, men inte för nästa pass.
