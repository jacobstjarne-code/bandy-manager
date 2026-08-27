# O9 — ÅRETS BERÄTTELSE: LÅST TEXT (delningskortet)

**Datum:** 2026-08-21 · **Av:** Opus/Fable · **Post:** 27 i `SLUTTEST_KO.md`
**Underlag:** `DOM_DELNINGSKORTET_2026-08-17.md`. Alla värden nedan läses ur
`SeasonSummary` — kortet får aldrig läsa annan state, och ingen rad genereras
fritt. Saknas radens data utelämnas raden och kortet krymper (samma regel som
O18: färre fält, inte utfyllnad).

Formen är domens: **rad 1 kontrasten · rad 2 ögonblicket · rad 3 statistiken
som bevis · rad 4 frågan.** Klubbnamn default, managernamn endast opt-in.

---

## Rad 1 — kontrasten (förväntan → utfall)

**Regel:** kontrast finns när `expectationVerdict` är `exceeded` eller `failed`.
Vid `met` finns ingen kontrast — hoppa till fallbackformen längst ner i
sektionen.

**Förväntanssatsen**, ur `boardExpectation`:

| ClubExpectation | Sats |
|---|---|
| `winLeague` | Skulle vinna ligan. |
| `challengeTop` | Skulle utmana i toppen. |
| `midTable` | Skulle landa i mitten. |
| `avoidBottom` | Skulle överleva. |

**Utfallssatsen** — den STARKASTE enskilda utgången, första träff i denna
prioritetsordning:

1. `playoffResult === 'champion'` → *Svenska mästare.*
2. `cupResult === 'winner'` → *Vann cupen.*
3. `playoffResult === 'finalist'` → *SM-final.*
4. `playoffResult === 'semifinal'` → *Semifinal.*
5. `playoffResult === 'quarterfinal'` → *Kvartsfinal.*
6. annars → *Slutade {positionsord}.*

Positionsorden (1–12): etta, tvåa, trea, fyra, femma, sexa, sjua, åtta, nia,
tia, elva, tolva. ("Slutade sexa" — domens egen form.)

Vid `failed` är utfallssatsen ALLTID placeringen (rad 6 i prioritetsordningen)
— ett misslyckande mot förväntan pyntas inte med en cupframgång på rad 1;
cupen syns i rad 3 om den nåddes.

**Exempel ur mappningen:** *Skulle överleva. Kvartsfinal.* · *Skulle vinna
ligan. Slutade trea.* · *Skulle landa i mitten. Svenska mästare.*

**Fallback vid `met` (ingen kontrast)** — säsongens tydligaste enskilda fakta,
första träff:

1. `longestWinStreak >= 4` → *{Positionsord i versal}. {N} raka segrar.*
   (t.ex. *Nia. Fem raka segrar.*)
2. `biggestWin` finns → *{Positionsord i versal}. {score} mot {opponent}.*
3. `topScorer` finns → *{Positionsord i versal}. {Namn} gjorde {goals} mål.*
4. annars → *{Positionsord i versal}, {points} poäng.*

## Rad 2 — ögonblicket

Ur `matchOfTheSeason` (`MatchHighlight`). Saknas den (`selectMatchOfTheSeason`
returnerade null): raden utelämnas — ingen ersättning, statistiken bär då
kortet. Poängformeln: `våra = isHome ? homeScore : awayScore`, `deras`
tvärtom.

| category | Rad |
|---|---|
| `late_winner` | Segern mot {opponentName} kom i sista minuterna. {våra}–{deras}. |
| `derby_win` | Derbyt mot {opponentName}: {våra}–{deras}. |
| `cup_drama` | Cupdramat mot {opponentName}: {våra}–{deras}. |
| `playoff_decisive` | Slutspelsmatchen mot {opponentName}: {våra}–{deras}. |
| `big_win` | {våra}–{deras} mot {opponentName}. |
| `comeback` | Vändningen mot {opponentName}: {våra}–{deras}. |
| `underdog_upset` | {opponentName} skulle vinna. Det blev {våra}–{deras}. |

**TEXT-UTAN-GENERATOR, flaggat:** `comeback` och `underdog_upset` finns i
`MatchHighlightCategory`-typen men sätts aldrig av dagens
`selectMatchOfTheSeason`. Raderna ligger klara för den dag generatorn väljer
dem — döda inte texterna, bygg inte generatorn för deras skull.

## Rad 3 — statistiken som bevis

Liten typografi, en rad, mittpunktsseparerad. Alltid:

*{position}:a · {points} p · {goalsFor}–{goalsAgainst}*

(Position här som siffra + ":a"-suffix per svensk standard: 1:a, 2:a, 3:e,
4:e … 12:e — Code använder befintlig ordinalhjälpare om en finns, annars
regeln 1–2 → ":a", 3–12 → ":e".)

Därefter, i denna ordning, ENDAST om nått:

- cupframgång: * · Cupmästare* / * · Cupfinal* / * · Cupsemi* (ur `cupResult`
  winner/finalist/semifinal; `quarter`/`eliminated` skrivs inte ut — beviset
  ska bara bära det som stärker)
- slutspel: * · SM-guld* / * · SM-final* / * · SM-semi* / * · Kvartsfinal*
  (ur `playoffResult`; `didNotQualify` skrivs aldrig ut)

Dubblera inte: står utgången redan i rad 1 (t.ex. *Svenska mästare.*) skrivs
den ändå i rad 3 — rad 1 är budskapet, rad 3 är belägget, domens egen
arbetsdelning. Undantaget är `failed`-fallet där rad 1 tvingades till
placering: då är rad 3:s cup-/slutspelstillägg enda platsen framgången syns,
och den ska med.

## Rad 4 — frågan

Ur `expectationVerdict`:

| Verdict | Fråga |
|---|---|
| `exceeded` | Kan du ta {clubName} längre? |
| `met` | Kan du göra det med {clubName}? |
| `failed` | Kan du göra det bättre? |

`{clubName}` ur `SeasonSummary.clubName` — aldrig managernamn, aldrig
save-namn.

## Tvåsanningsraden — villkorad femte rad, under rad 3

När `objectiveOutcome` finns (U1 ändring 6) och `expectationVerdict` är
`exceeded`/`met` MEN `failed + atRisk >= 1`:

*{Utfallssats utan punkt} — men {N} uppdrag missades.*

där N = `objectiveOutcome.failed + objectiveOutcome.atRisk`, singular
*ett uppdrag missades*. Exempel: *Kvartsfinal — men två uppdrag missades.*
Detta är kortets version av High 1:s ärlighet (styrelsedomen och spelarens
upplevelse beskrev två olika säsonger): kortet får aldrig se mer polerat ut
än spelet. Saknas fältet (äldre save): ingen rad.

## Renderingsordning och gränser

Rad 1 störst (kontrasten är budskapet), rad 2 mindre, rad 3 minst
(beviset), rad 4 som avslutande fråga ovanför foten. 4.12:s regionslayout
bär redan variabel radmängd; kortet har som mest 5 rader + fot, som minst
2 (rad 1-fallback + rad 3) — bägge ytterligheterna ska in i
`buildLayoutRows`-testet.

**Aldrig på kortet** (domens förbud, upprepade här för att de är
testbara): siffror ur annan state än `SeasonSummary` · managernamn utan
opt-in · genererad prosa · procenttal eller precision datat inte bär.

## Vad som INTE ingår i denna leverans

Årets match-artefakten (kräver `shareImageReady`-vägen, 4.14:s knapptext
redan rättad) och Karriären hittills (kräver O18 komplett inkl. fält 2).
En artefakt i taget, domens ordning.
