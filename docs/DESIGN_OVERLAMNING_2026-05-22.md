# Design-överlämning — lördag (förberedd 2026-05-22 kväll)

**Av:** Opus. **Syfte:** Spara kvot på lördagen. Här är de Design-frågor som
faktiskt kräver beslut, med kod-kartläggning gjord i förväg så ni börjar med
val, inte med utredning. Allt byggbart är redan hos Code (CODE_UPPDRAG +
P5) — inget här väntar på kod, det här väntar på Design-beslut.

Fyra punkter, prioritetsordnade. C-SD1 är störst och har mest förarbete.

---

## 1 · C-SD1 — Säsongsslutets koreografi (STÖRST)

### Problemet, som Jacob såg det i playtest
Halvvägs-portal + halvvägs-scen säger samma sak i rad. Sommaren-scenen kommer
efter match 22 MEN före slutspelet ("i oktober är det igång igen" medan
kvartsfinal återstår). Grundserien-avklarad + säsongen-klar + sommaren = tre
avslutsskärmar i konstig ordning.

### Vad kod-kartläggningen visar (gjort 2026-05-22)
`sceneTriggerService.detectSceneTrigger` är en **prioritetskedja av oberoende
boolean-villkor**. Varje scen vet bara om sig själv ("ska JAG fyra nu?") — ingen
vet om de andra eller var i säsongen man befinner sig. Aktiva scener i kedjan:
cup_final_victory, sm_final_victory, sunday_training, cup_final_intro,
coffee_room. (board_meeting, cup_intro, season_signature är `return false` sedan
2026-05-10 — flyttade till anslag.)

**Kärnfyndet:** Sommaren-scenen och grundserien-avklarad-skärmen fyras INTE från
sceneTriggerService. De kommer från ett annat system (SeasonPhase-flöde +
anslag). Så C-SD1 är inte en bugg inom ett nav — det är att **två system
(scen-triggers OCH fas/anslag) båda producerar avslutsskärmar, och ingen
koordinerar ordningen mellan dem.** Det är därför sommaren glider in före
slutspelet: anslags-/fas-systemet som triggar den känner inte till att
playoffBracket fortfarande är aktiv.

### Design-besluten som behövs (detta är vad lördagen ska avgöra)
1. **Vem äger SEKVENSEN?** Ska det finnas en enda "season-end choreographer"
   som vet ordningen (grundserie klar → slutspel → SM-final/elimination →
   sommaren), eller fortsätter vi med oberoende triggers + guards? Arkitekturval.
2. **Guards:** sommaren MÅSTE gated på `playoffBracket.status === Completed`
   (eller spectator-säsong klar). Det är minimifixen oavsett arkitektur.
3. **Avdubblering:** halvvägs-portal vs halvvägs-scen — vilken äger budskapet,
   vilken tas bort?

**Släkt med C-SP1** (granska-CTA efter vunnen serie säger fel om tillståndet) —
samma klass: en övergång som inte känner sitt eget tillstånd. Värt att lösa
sekvens-ägarskapet en gång så det täcker båda.

Filer: `sceneTriggerService.ts` (scen-navet), SeasonPhase-flödet +
`anslagService.ts` (där sommaren/grundserie-skärmarna troligen bor — Code
lokaliserar exakt vid implementation).

---

## 2 · C-SD2 — Slutspels-portalerna eskalerar inte visuellt

Går från grundserie rakt in i "STARTA SLUTSPEL" utan spänningsbygge.
Final-portalen (slutspels-playtest bild 2) är klart vassare än semi/kvart — det
utseendet ska ärvas NEDÅT till semi/kvart fast "lugnare", så slutspelet
eskalerar visuellt mot finalen.

**Design-beslut:** definiera tre nivåer av portal-intensitet (kvart < semi <
final) och vilka visuella variabler som skalar (färg, ramar, vikt). Överlappar
C-SY1 (synlighet) och C-SD1 (samma slutspels-flöde). Bör behandlas ihop med
C-SD1 eftersom det är samma sekvens.

---

## 3 · C-FT1 — Trötthets-axeln (BEKRÄFTAD — +25,5pp, kräver beslut)

Mätt 2026-05-22 (commit `a70a2b2`): match 2 med UTVILAD trupp vinner **25,5
procentenheter** oftare än med trött. Stor, utfallsavgörande effekt. Jacobs
känsla ("match 2 förlorar nästan alltid") var korrekt och underskattade snarare
effekten. Detta är nu en verklig balansfråga — ska BESLUTAS på lördagen.

Mekaniken (verifierad i kod): `squadEvaluator` fitness=60% av lagstyrka,
`playerStateProcessor` −15–25 fitness/match vs +8/runda återhämtning,
`generateAiLineup` AI bästa elva varje match oberöende av fitness.

Tre Design-delfrågor, i prioritetsordning:
- **(a) SYNLIGHET (viktigast).** En 25,5pp-effekt utan att spelaren ser att
  truppen är trött känns som otur eller riggad motor. Måste bli synligt:
  fitness-indikator på lineup, före-match-varning, eller motsvarande. Detta
  löser "känns orättvist" oavsett vad man gör med balansen.
- **(b) SYMMETRI.** AI tröttnar aldrig i urvalet — går alltid in på full styrka.
  Det gör 25,5pp värre än en symmetrisk trötthet vore. Ska AI rotera/tröttna
  över täta matcher?
- **(c) BALANS.** −15–25/match mot +8/runda — rätt kurva, eller för brant för en
  tunn trupp som inte kan rotera bort tröttheten?

Släkt med C-FT2 (UI-skip efter livematch, redan hos Code) — men C-FT1 är den
mätbara mekaniken, C-FT2 är flödes-förvirringen. Båda bidrar till känslan.

---

## 4 · Övriga Design-punkter (mindre, kända sedan tidigare)

- **C-SY1** synlighetssprinten (4 tickets, kräver designrunda per ticket) —
  `SKISS_SYNLIGHETSSPRINT_2026-05-20.md`. Moment-feeden saknar renderingsyta
  (audit 2026-05-21 bekräftade datan finns, ytan saknas).

  **KOD-VERIFIKATION 2026-05-22 (sparar designrundor — skissen 20 maj hade
  ostatuserade/föråldrade antaganden):**
  - *Ticket #1 (Efterklang på Portal):* ALLA datakällor verifierade på SaveGame
    — `klackEcho`, `journalist` (m. memory), `pendingFollowUps`, `bandyLetters`,
    `boardObjectiveHistory`, `nemesisTracker`, `economicCrisisState`,
    `lastRivalSaleMatchday` finns alla. Ticket #1 är därmed REN UI + picker-logik,
    ingen ny datamodellering. Lättare än skissen antog. Kvarvarande Design-fråga:
    prioritets-algoritmen (vilka 1–3 minnen visas, recency×vikt×laddning) + om
    det är secondary-tier eller egen tier.
  - *Ticket #4 (Efter-match-kvitto):* skissen kallade `managerChoiceLog` "ett
    större jobb, framtida". **FÖRÅLDRAT — B8 levererade `managerChoiceLog` på
    MatchReport 21 maj.** Dessutom finns redan på SaveGame: `lastHalftimeDecision`
    ('lugna'/'pressa'/'prata'), `leadershipActions[]`, `awayTrip.mikrobeslut`,
    `pendingVictoryEcho`. Flera manager-val LOGGAS alltså redan explicit — pickern
    kan bygga på faktiska val, inte korrelations-heuristik. Ticket #4 går från
    "10–12h sköra heuristiker" till "läs choice-logg + 2–3 heuristiker för resten".
  - *Ticket #2 + #3:* oändrade (textprefix-pattern resp. layout-audit, båda
    Design-beslut). #3 ska INTE göras före 15-min-playtesten (skissens villkor står).
- **C-SY2** score-system tre-vokabulär — väntar komplett spec från Design
  (mocken är skiss, saknar komponent-API + migrations-ordning).
- **C-T11.2/3** transfers: nudges på portalen + marknadsliv vid passivitet
  (punkt 1, dead-end, är redan hos Code).
- **C-N1** NU-flikens innehåll vid stiltje (vad ÄR NU, vad visar den när inget
  brinner).
- **C-SP5** SM-final-uppspelets skarv (CSS/inramning).
- **C-K1** landslagsuttagning (urvalslogik + frånvaro-effekt).
- **D-ST1** seasonalTone → design tokens (token-arkitekturfråga).

---

## Vad som INTE är Design (allt redan hos Code, för referens)
CODE_UPPDRAG_2026-05-22: C-SP1/2/3/4 (slutspels-buggar), C-T11.1 (dead-end),
C-FT2 (UI-skip), C-SD3 (simulera-knapp, nästan klar). Plus P5
(commentary-rotorsak) och C-FT1-mätningen. C-M2 (tre motor-sidofynd) bevakas vid
nästa kalibreringsrunda, ej Design.

---

## Föreslagen ordning för lördagen
C-SD1 + C-SD2 + C-SP1 tillsammans (samma slutspels-sekvens, lös ägarskapet en
gång) → C-FT1 om mätsiffran finns → C-SY1 (störst av synlighets-spåret) → resten
efter behov. C-SD1 är den som annars äter mest tid om den tas oförberedd —
därför förarbetet ovan.

— Opus, 2026-05-22 kväll
