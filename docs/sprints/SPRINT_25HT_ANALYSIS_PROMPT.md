# Sprint 25-HT — Strukturell halvtidsledning-analys (UPPDRAG TILL CODE)

**Status:** ANALYSUPPDRAG — inga kodändringar
**Estimat:** 4-6h
**Förutsätter:** Sprint 25h levererad
**Output:** `docs/sprints/SPRINT_25HT_ANALYSIS.md`

---

## PROBLEMET

`htLeadWinPct` (vinst-procent när laget leder vid halvtid) är **77%**
mot target **60-70%**. Accepterad teknisk skuld från Sprint 25f. Två
iterationer har försökt fixa via parametrar (trailingBoost, leadingBrake,
controlling/chasing tempo) utan att nå målet. Det antyder att problemet
är **strukturellt**, inte parametriskt.

Innan vi rör koden måste vi förstå **varför** halvtidsledare vinner för
ofta i motorn. Detta uppdrag är att kartlägga orsaken.

---

## VAD SOM SKA UNDERSÖKAS

### 1. Konkret mätning av nuvarande beteende

Kör motorn med 10 seeds × 200 matcher och samla:

- **Mål-fördelning över tid:** I vilken minut görs målen? Hur skiljer sig
  fördelningen mellan ledande och chasande lag?
- **Skott-fördelning:** Antal skott på mål per period (15-min-fönster) för
  ledande vs chasande lag.
- **Hörn-fördelning:** Samma uppdelning för hörnor — får chasande lag
  färre, samma eller fler hörnor?
- **Utvisningar:** Påverkar utvisningar i andra halvlek halvtidsledarens
  vinstchans? Är utvisningar ojämnt fördelade mellan ledare/chasare?
- **Comeback från −1, −2, −3:** Hur ofta händer det? Vilka faktorer
  korrelerar med comeback?

Output: tabell med per-minut och per-15min-statistik. Jämför med
Bandygrytan-data om tillgängligt.

### 2. Kodgenomgång — var halvtid och leder/chasar hanteras

Lokalisera i koden:

- `matchUtils.ts` — PHASE_CONSTANTS, GOAL_TIMING, leadingBrake/trailingBoost
- `matchCore.ts` — hur sannolikheter för mål/skott modifieras baserat på
  ledning
- `matchSimulator.ts` / `matchEngine.ts` — momentum-uträkning,
  controlling/chasing-tempo
- Övriga ställen där "lead", "chase", "trailing", "leading", "score"
  används

Kartlägg:
- Var i pipelinen avgörs ett måls sannolikhet?
- Vilka modifierare appliceras på chasande lag?
- Vilka modifierare appliceras på ledande lag?
- Finns det dubbla modifierare som motverkar varandra?
- Finns det modifierare som inte appliceras korrekt under vissa
  förhållanden?

### 3. Sammanställ tre-fyra hypoteser

Baserat på 1+2, presentera 3-4 olika hypoteser om vad som orsakar
77%-utfallet:

**Format per hypotes:**
- **Hypotes:** En mening
- **Stöd från data:** Vilka mätvärden från (1) stödjer hypotesen?
- **Stöd från kod:** Vilken specifik kod-yta (filer, funktioner)
  implementerar problemet?
- **Förslag till fix:** Vilken strukturell ändring skulle adressera
  roten, inte symptomet?
- **Risk:** Vilken risk för regression i andra mätvärden
  (goalsPerMatch, awayWinPct, etc.) finns?

**Exempel på hypotes-struktur:**

> **Hypotes A:** Chasande lag får för få *kvalitativa* chanser i andra
> halvlek, även om antalet skott är jämnt.
>
> **Stöd från data:** Mål-per-skott i andra halvlek är 12% för ledare,
> 7% för chasare. Antalet skott är jämnt (45-55-fördelning).
>
> **Stöd från kod:** I `matchCore.ts` rad 412-450 beräknas
> chanceQuality-faktorn baserat på tempo men inte på momentum.
> Chasande lag har hög tempo men ingen momentum-bonus.
>
> **Förslag till fix:** Lägg till momentum som faktor i chanceQuality,
> inte bara i skott-frekvens.
>
> **Risk:** Kan höja goalsPerMatch om både ledare och chasare får högre
> chanskvalitet. Mätning krävs.

### 4. Rekommendation

Efter de 3-4 hypoteserna: vilken är troligast? Vilken bör testas först?
Vilken kräver minst kodförändring? Vilken har lägst regressionsrisk?
Ge en prioriterad ordning.

---

## VAD SOM INTE INGÅR

- Inga kodändringar
- Inga försök att fixa htLeadWinPct
- Ingen ny parametrisering
- Bara analys + dokumentation

Opus läser analysen sedan och skriver en skarp implementations-spec
baserat på vald hypotes.

---

## FORMAT FÖR OUTPUT

`docs/sprints/SPRINT_25HT_ANALYSIS.md` med rubrikerna:

1. Sammanfattning (max 200 ord)
2. Mätningar (tabeller från (1))
3. Kodkarta (filer, funktioner, ansvar)
4. Hypoteser (3-4 stycken enligt formatet ovan)
5. Rekommendation (prioriterad ordning)
6. Bilaga: råa stresstest-output om relevant

---

## TIPS

- Använd befintliga stresstest-skript där det går
- Logga inte mer än nödvändigt — vi vill ha tabeller, inte spår
- Om något i datan är förvånande: stanna och flagga, gissa inte
- Om kodområdet visar sig vara större än förväntat: dokumentera scope
  och fortsätt — inte allt behöver mätas på en gång

---

## EFTER LEVERANS

Opus läser analysen och bedömer:
1. Är hypoteserna grundade i data eller spekulation?
2. Finns det en hypotes med tydlig kodyta + lägre risk + datastöd?
3. Är någon hypotes så stor att den kräver en egen sprint i sig?

Sen skickas implementations-spec till Code för faktisk fix.
