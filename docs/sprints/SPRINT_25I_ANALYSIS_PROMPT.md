# Sprint 25-I — Strukturell analys av tre kvarvarande motor-avvikelser

**Status:** ANALYSUPPDRAG — inga kodändringar
**Estimat:** 4-6h
**Output:** `docs/sprints/SPRINT_25I_ANALYSIS.md`

---

## PROBLEMET

Tre motor-avvikelser kvarstår efter Sprint 25h. Alla tre är ute ur
tolerans mot Bandygrytan-rådata.

| Mått | Motor | Target | Gap |
|---|---|---|---|
| awayWinPct | 43.9% | 38.3% | +5.6pp |
| cornerGoalPct (slutspel) | 26.2% | 22.2% | +4.0pp (eskalerar i slutspel) |
| playoff_final mål/match | 9.17 | 7.00 | +2.17 |

**Hypotesen som ska testas:** Avvikelserna kan ha **gemensam rotorsak**.
Specifikt: motorn kan undervärdera *defensiva* faktorer i avgörande lägen
(borta-matcher, slutspel, finaler). Om det är så ger en strukturell fix
positiv effekt på alla tre samtidigt.

Innan kod ändras måste rotorsaken identifieras. Detta uppdrag är att
kartlägga den.

---

## VAD SOM SKA UNDERSÖKAS

### 1. Kvantifiera avvikelserna i detalj

Kör motorn med 10 seeds × 200 matcher per scenario och samla:

**Scenario A — borta-matcher (för awayWinPct):**
- Splittra på lagstyrkeskillnad: hemma starkare vs jämnt vs borta starkare
- Visa win/draw/lose-fördelning för bortalaget i varje bucket
- Jämför mot Bandygrytan-rådata om möjligt
- *Var* skiljer det sig? Vid jämn styrka? Vid hemmaövertag?

**Scenario B — slutspelsmatcher (för cornerGoalPct + playoff_final):**
- Mät cornerGoalPct per fas: grundserie / kvartsfinal / semifinal / final
- Mät mål/match per fas
- Jämför motor vs rådata för varje fas
- Eskalerar gapet linjärt eller stegvis?

**Scenario C — finaler specifikt:**
- Bara final-matcher: motor vs Bandygrytan
- Splittra på laguppställning (jämna lag vs ojämna)
- Mål-fördelning per fas av matchen (1-15, 16-30, 31-45, 46-60, 61-75, 76-90)
- Hörnor per match — är det fler hörnor totalt eller bättre konversion?

### 2. Kodgenomgång — tre potentiella kopplingspunkter

Lokalisera och kartlägg:

**(a) Hemmafördel-tillämpning i `matchCore.ts`:**
- `homeAdvantage`-konstanten (var används den?)
- Påverkar den både attack och försvar?
- Är effekten konstant eller skalas av matchkontext?
- Specifikt: dämpas hemmafördelen i slutspel? (Borde, eftersom slutspelsmatcher har neutralare karaktär.)

**(b) Hörn-konversionsmodifierare:**
- `cornerStateMod` (cornerTrailingMod 1.11, cornerLeadingMod 0.90)
- Finns det fasspecifika modifierare för slutspel?
- Hur påverkas hörn-konversion av tactic, weather, fatigue?
- Specifikt: är `defenseResist`-värdet rimligt i slutspelsmatcher där lagen är jämnare?

**(c) Phase constants och slutspels-specifika multiplers:**
- `PHASE_CONSTANTS` i `matchUtils.ts`
- Sprint 25d-fas-konstanter — dämpas mål eller hörnor i slutspel?
- Hur stor är diffen mellan grundserie- och slutspels-multiplikatorer?

### 3. Sammanställ 3-4 hypoteser med rotorsak-prioritering

Format per hypotes:
- **Hypotes:** En mening
- **Stöd från data:** Vilka mätvärden från (1) stödjer hypotesen?
- **Stöd från kod:** Vilken specifik kod-yta implementerar problemet?
- **Förklarar vilka avvikelser:** Bara en, två, eller alla tre?
- **Förslag till fix:** Strukturell ändring som adresserar roten
- **Risk:** Risk för regression i andra mätvärden (htLeadWinPct, goalsPerMatch, etc.)

### 4. Identifiera gemensamma rotorsaker

Efter de 3-4 hypoteserna:
- Finns en hypotes som förklarar **alla tre** avvikelser samtidigt?
- Finns en hypotes som förklarar **två av tre**?
- Eller är de tre avvikelserna tre separata problem?

Detta avgör om Sprint 25-I behöver vara en eller flera implementations-sprintar.

### 5. Rekommendation

- Vilken hypotes är troligast?
- Vilken bör testas först (lägst risk + högst informationsvärde)?
- Om gemensam rotorsak: föreslå *en* strukturell fix
- Om separata problem: prioritera ordningen

---

## VAD SOM INTE INGÅR

- Inga kodändringar
- Inga försök att fixa något
- Ingen ny parametrisering
- Bara analys + dokumentation

Opus läser analysen sedan och skriver implementations-spec(ar) baserat
på vald(a) hypotes(er).

---

## FORMAT FÖR OUTPUT

`docs/sprints/SPRINT_25I_ANALYSIS.md` med rubrikerna:

1. Sammanfattning (max 250 ord — viktigast: är det en eller flera rotorsaker?)
2. Mätningar (tabeller från scenario A, B, C)
3. Kodkarta (filer, funktioner, ansvar för de tre kopplingspunkterna)
4. Hypoteser (3-4 stycken enligt formatet ovan)
5. Gemensam rotorsak — finns det? Vilka avvikelser täcks i så fall?
6. Rekommendation (prioriterad ordning, eventuellt en eller flera följdsprintar)
7. Bilaga: råa stresstest-output om relevant

---

## TIPS

- Vi har bra rådata i `bandygrytan_detailed.json` — använd den, inte
  bara aggregerade targets
- Logga inte mer än nödvändigt — vi vill ha tabeller, inte spår
- Om något i datan är förvånande: stanna och flagga, gissa inte
- Sprint 25-HT visade att det är värt att räkna manuellt från rådata
  innan motorändringar — gör det här också

---

## EFTER LEVERANS

Opus läser analysen och bedömer:

1. Är det en gemensam rotorsak eller tre separata?
2. Är hypoteserna grundade i data eller spekulation?
3. Vilken hypotes har lägst regressionsrisk + högst trolig effekt?
4. Behöver fixen göras i flera steg?

Sen skickas implementations-spec(ar) till Code.

---

## VIKTIGT

Sprint 25-HT lärde oss att en avvikelse kan vara *artefakt av fel target*,
inte motorbugg. Verifiera **innan** kodändring att alla tre targets är:
1. Räknade korrekt från rådata
2. Inte felmärkta som något annat (som 46.6-fyndet)

För varje av de tre avvikelserna: räkna från rådata och bekräfta att
target faktiskt är vad det säger sig vara. Om någon target visar sig
vara fel — flagga, dokumentera, gå inte vidare med kodfix.
