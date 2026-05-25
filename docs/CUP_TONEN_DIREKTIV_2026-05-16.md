# Cup-tonen — diagnos och direktiv

**Datum:** 2026-05-16
**Av:** Opus, efter läsning av `cupAnslag.ts` (anslag) + `matchCommentary.ts` (in-match)
**Status:** Tonalt direktiv. Faktiska strängar skrivs i separat sprint efter att Jacob godkänt riktningen.

---

## DIAGNOS

### Vad som FINNS och fungerar

**Cup-anslag (`cupAnslag.ts`)** — 7 keys med 1-3 varianter vardera. Tonen är inte trasig:
- "Snålvinden", "ingen sörjer dem särskilt mycket", "inte ligan, inte slutspelet — men det första"
- Sture-Forsbacka-känslan finns där. Bandysvensk understatement.
- Cup-finalhelgen har Bollnäs-konkret detalj ("Sävstaås, fyrverkerier, glögg på läktaren", "Sex omklädningsrum")
- Inga AI-slop-fraser

**Slutspels-stege i commentary** — välutbyggd:
- `playoff_kickoff`, `quarterfinal_kickoff`, `semifinal_kickoff`, `final_kickoff` har var sin pool
- `semifinal_goal`, `final_goal`, `final_fullTime_win`, `final_fullTime_loss` egna
- `derby_kickoff`, `derby_goal`, `derby_suspension`, `derby_neutral`, `derby_fullTime` egna

**Säsongsbåge-context** — finns:
- `context_season_opener`, `context_title_race`, `context_relegation`, `context_comeback_chasing`, `context_protecting_lead`
- **`context_cup_final` finns** (3 strängar) — pre-match-pool

### Vad som SAKNAS

Cup-fasen får ingen tonal särbehandling i matchen själv. Det är där "lacks tonal identity"-känslan bor.

Konkret saknas i `matchCommentary.ts`:

1. **Cup-kickoff (omg 1, kvart, semi).** Cup-matcher använder samma `kickoff`-pool som ligamatcher. En cup-match i oktober känns identisk med en ligamatch i januari.
2. **Cup-goal.** Inget understrykande av cupens stake-natur ("vinst = kvart, förlust = säsongens slut för cupen").
3. **Cup-fullTime.** Generic `fullTime` används. Ingen referens till "tre lag åker hem nu" eller "kvarten väntar".
4. **Cup-finalweekend-atmosfär.** Bollnäs-helgen är unik (samlad arena, alla fyra lag på samma plats) — det syns i anslaget men inte i match-commentary.
5. **Cup-final som SEPARAT från SM-final.** `final_*`-pooler antar SM-final. Cup-finalen plockar från `context_cup_final` (3 strängar) + generic `kickoff`/`goal`/`fullTime`. Det räcker inte.

---

## CUPENS TONALA DISTINKTION

Cup-anslagen ger redan tonal-receptet. Sammanfattning:

| Dimension | Cup | Liga | SM-final |
|---|---|---|---|
| **Tidpunkt** | Oktober, frost om mornarna | Nov-mars, vinter | Mars, kulmination |
| **Stake-natur** | En match per runda. Vinst = vidare, förlust = ut | Poängsystem, fler matcher rättar till | Allt eller inget, hela säsongen |
| **Form** | Spelarna är inte i form, isen är inte stabil | I form, etablerad rytm | Toppform |
| **Tonal-axel** | "Inget riktigt, men ändå allt" | "Långa loppet" | "Sveriges Superbowl" |
| **Atmosfär** | Lågmäld, oktober-höstkväll | Vintervardag | Elektrisk, hela landet tittar |
| **Pokalen** | "Inte den finaste" men "den första" | Tabellpoäng | SM-guld |

**Cupens kärna:** Det är BANDYÅRETS INLEDNING. Inte sommarvärme längre, inte vinter än. Frost om mornarna, säsongsstartens första riktiga avläsning. Sudden death men inte hela bandyhärligheten på spel. "Vad blev det av sommarvärmen."

**Cup-finalhelgen är ett ÖGONBLICK i sig:** Bollnäs (eller motsvarande), centralort, fyra lag samlas, bandysverige för första gången på året på samma plats. "Sex omklädningsrum" är inte en metafor — det är ETT konkret faktum som anslaget redan etablerar.

---

## DIREKTIV — nya commentary-keys som ska skapas

Inte all cup-match-commentary behöver vara ny. Strategin är ANDEL-baserad: cup-specifika strängar plockas ~60% av gångerna, generic 40%, så variationen behålls.

### Nivå 1 — NÖDVÄNDIGT

```ts
cup_kickoff: [3-5 varianter]
  // Oktober-känsla, "första riktiga avläsningen", "frosten ligger om mornarna"
  // Inte stora ord. Inte "SUDDEN DEATH!".
  // Underton: "vi har inte spelat skarpt sedan mars"

cup_goal: [4-6 varianter]
  // Underdrives. "Den första kommer ofta överraskande tidigt på säsongen."
  // Skiljer från goalOpener genom att vara cup-specifik
  // "Något att ta med till tisdagsträningen — ifall man får en till."

cup_fullTime_win: [3-4 varianter]
  // "Kvarten väntar. Det är en match till för {team}."
  // "Förstrundan klar. Nu vet vi att vi kan spela bandy igen."

cup_fullTime_loss: [3-4 varianter]
  // "Cupen är slut för {team}. Söndagar fria fram till ligan."
  // "Bara en match. Allt slut för {team} i cupen."
  // ANNORLUNDA än ligamatch-förlust — ingen "nästa omgång räddar"
```

### Nivå 2 — CUP-FINALEN SEPARAT från SM-FINALEN

```ts
cup_final_kickoff: [3-4 varianter]
  // Bollnäs-omklädningsrum, "fyra lag samlas", "för första gången på året"
  // INTE "Sveriges Superbowl". Det är pokalen, inte guldet.

cup_final_goal: [3-4 varianter]
  // "Pokalmål för {player}!" — ej "SM-mål"
  // Det är fortfarande HÖG dramatik, men annorlunda dramatik

cup_final_fullTime_win: [3-4 varianter]
  // Variant från cup_done_winner-anslaget redan etablerat
  // "Pokalen är på byrån i klubbhuset nu. Lite blank. Lite lätt."
  // "Inte den finaste pokalen i bandy. Men den är den första."

cup_final_fullTime_loss: [3-4 varianter]
  // "Det var nära. Pokalen blev någon annans."
  // Inte krossande som SM-final-förlust — det är cupen, inte säsongen
```

### Nivå 3 — CUP-FASENS ATMOSFÄR

```ts
cup_atmosphere: [6-8 varianter]
  // Plockas ibland istället för generic atmosphere under cup-matcher
  // "Termosen ångar — det är fortfarande oktober."
  // "Spelarna stampar mer än vanligt — kallt redan."
  // "Strålkastarna lyser tidigare nu än för en månad sen."

cup_finalweekend_atmosphere: [4-6 varianter]
  // Endast cup-finalhelgen (semi och final i Bollnäs)
  // "På väg in från parkeringen syns alla fyra färgerna."
  // "Sävstaås är full sedan en timme. Det är cup-finalhelg."
```

### Nivå 4 — KORS-REFERENS till anslag

Cup-anslagen har redan etablerat språket. Match-commentary ska EKA det utan att kopiera. Exempel:
- Anslag: "Snålvinden över bandyplanerna" → Commentary kan ha "Det blåser snålt över planen idag"
- Anslag: "Tre lag har åkt ur" → Commentary kan ha "Två kvar på säsongen, ifall det går fel idag"
- Anslag: "Cupen är cupen. Inget mer, inget mindre" → Commentary undviker överdramatisering

---

## DIREKTIV — visuell särprägel (för Design)

Inte mitt jobb att bygga, men noteras för Design när vi kommer dit (Riktning 1 efter playtest-verifiering):

1. **Cup-fas-stämpel på scoreboard** — "CUP R1" / "CUP KVF" / "CUP SF" / "CUP FINAL" istället för "OMG 1" / "OMG 2"
2. **Cup-final-scoreboard** — eventuellt silver-amber-prägel istället för Stålvallen-copper. Pokal != SM-guld. Eller behåll copper men addera ett "POKAL"-element.
3. **Cup-finalhelgens scoreboard** — Bollnäs-platsnamn ovanför scoreboard? "BOLLNÄS · SÄVSTAÅS"-rad?
4. **Cup-anslag visuellt** — har redan eget chapter-label ("⬩ Anslaget ⬩", "⬩ Snålvinden ⬩", "⬩ Helgen ⬩", "⬩ Pokalen ⬩"). Det ÄR redan distinkt från liga-anslag. Audit i kontext kanske räcker.

---

## DIREKTIV — vad som INTE ska göras

- **Inte kopiera SM-finalens "Sveriges Superbowl"-register.** Cupen har medveten lågmäldhet i sin egen identitet. Bryt inte det.
- **Inte överdramatisera cup-omg-1-matcher.** "Sudden death!"-tonen krockar med anslagets "ingen kommer minnas matchen — utom om ni förlorar".
- **Inte lägga in cup-specifika moment i ligamatcher.** Det blir tonalt smutsigt. Separera systemen.

---

## NÄSTA STEG

Tre alternativ för faktisk text-leverans:

### A. Skriv allt
4-5 timmars Opus-skrivarbete. Levererar färdiga pooler i `matchCommentary.ts` redo för Code-integration. Resultat: cup-fasen får tonal särprägel i en commit.

### B. Skriv Nivå 1 nu, resten senare
~2 timmar för nödvändigt-lagret. Verifiera i playtest att tonen sitter. Sedan resten.

### C. Vänta tills playtest-fynd från Riktning 2 är klara
Om playtest visar att cup-matcher faktiskt INTE känns flat, är detta inte högsta prio. Verifiering först.

**Min rekommendation: B.** Du har redan signalerat (memory, plus din kommentar om annandagen) att cup-fasen är ett aktivt skrivproblem. Att skjuta det till efter playtest är att låta känsligheten kallna. Men jag tar inte itu med ALLT i ett svep — Nivå 1 (cup_kickoff, cup_goal, cup_fullTime) räcker som första våg.

Säg vilket alternativ. Eller om något i diagnos/direktiv behöver justeras innan vi fortsätter.
