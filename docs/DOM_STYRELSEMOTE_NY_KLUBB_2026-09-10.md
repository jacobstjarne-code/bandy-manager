# DOM — Styrelsemöte, ny klubb mitt i karriären (tillstånd N)

**Datum:** 2026-09-10
**Ägare:** Opus (text, denna fil) → Code (resolvergren + ledgerpost + tester)
**Rad:** följdfyndet MEDIUM ur INT-1-rapporten (`INT_1_B1_LANGBAGE_2026-09-10.md`)
**Kodläst:** `boardMeetingStateResolver.ts`, `boardMeetingCopy.ts`.

## Problemet, bekräftat

`resolveBoardMeetingState` väljer `state = 'A'` när `(seasonSummaries.length <= 1 || fulfillmentPct < 0)`. Efter ett klubbyte mitt i karriären saknar den nya klubben förra säsongens målresultat → `fulfillmentPct = -1` → tillstånd A. Men hela `BOARD_MEETING_COPY.A` är skriven för ANDRA ÅRET i samma klubb ("Vi vet hur det funkar nu", "Andra året"). Första dagen i Lesjöfors fick därför andraårs-copy. Modellen saknar ett tillstånd för första mötet efter ett övertagande.

Ingen bryggrad i A-poolen. Nytt, sanningsförankrat tillstånd.

## Tillstånd N — ny klubb

`export type BoardMeetingState = 'A' | 'B' | 'C' | 'N'`

**Villkor (före A/B/C i resolvern):**

```
if (managerProfile.seasonsAtClub === 1 && harTidigareAvslutadClubSpell) state = 'N'
```

`harTidigareAvslutadClubSpell` = karriären har minst en avslutad `clubSpell` före den nuvarande (skiljer övertagandet från karriärstartens allra första klubb, där A/säsong-2-logiken fortfarande gäller). `seasonsAtClub` sätts korrekt till 1 av `switchManagedClub` — bekräftat. Ledgern är historiskt belägg (se nedan), aktivt tillstånd ägs av profil + clubSpells.

## Copy-pool (klar att klistra i `BOARD_MEETING_COPY`)

Statisk pool, som A/B/C. Dynamiska fakta (företrädarens placering, klubben du lämnade, avsked eller frivilligt) bakas ALDRIG in i talpoolen — de ytar i en egen övertagande-rad (se sist). Bandysvensk understatement, pronomenfri om företrädaren.

```
N: {
  settings: [
    'En ny möteslokal. Någon visar var du ska sitta. Kaffet är redan upphällt.',
    'Klubbstugan i din nya klubb. Väggarna hänger fulla av lag du inte var med i. Ordföranden räcker fram handen.',
    'Kommunalhuset i en ny bygd. En pärm med klubbens namn ligger framme. Din stol står redan utdragen.',
    'Ett bord du aldrig suttit vid. De känner varandra, inte dig. Ännu.',
    'Hembygdsgården, en ort du precis kommit till. Ordföranden presenterar de andra runt bordet, ett namn i taget.',
    'Klubbhusets kontor. Förra tränarens lagfoto sitter kvar på väggen. Ingen har hunnit ta ner det.',
    'Sammanträdesrummet. De reser sig när du kommer in. Det är inte varje dag de får en ny vid rodret.',
    'Föreningslokalen. Det luktar kaffe och nystädat. De har gjort i ordning för din skull.',
  ],
  titles: [
    'Första dagen.',
    'Vi valde dig.',
    'Ny vid rodret.',
    'Övertagandet.',
    'Ett nytt bord.',
    'Så här ligger det till.',
    'Välkommen hit.',
    'Första mötet — här.',
  ],
  speakerLines: [
    'Du känner inte oss och vi känner inte dig. Men vi vet vad du gjort, och därför sitter du här. Nu berättar vi var klubben står.',
    'Vi letade efter någon som kunde lyfta det här. Det blev du. Det du ärver är inte perfekt, men det är ärligt.',
    'Förra tränaren räckte inte till, och det är därför du är ny. Vi hoppas du gör det bättre.',
    'Klubben har en historia du inte var med i. Från och med idag spelar den mindre roll än vad vi bygger tillsammans.',
    'Vi tar det lugnt första året. Du ska lära känna truppen, bygden, oss. Sen pratar vi om vart vi ska.',
    'Det finns folk här som väntat länge på någon som du. Gör dem inte besvikna för snabbt.',
    'Vi säger som det är: kassan och tabellen är vad de är. Du fick inte den lättaste starten. Men du fick den.',
    'Vi har ingen storslagen plan att lägga fram. Vi vill se vad du gör med det du får.',
  ],
},
```

## Målmotiveringar (`GOAL_MOTIVATIONS`, tillstånd N — etablera, känna sig fram)

```
'N:sporting': [
  'Inget flyg. Etablera dig, håll oss stabila.',
  'Lär känna truppen först. Resultaten kommer sen.',
  'Trygg mitten i år. Vi bygger från det.',
],
'N:economic': [
  'Håll kassan i fred medan du lär känna klubben.',
  'Inga stora grepp första året. Lär dig var pengarna finns.',
],
'N:academy': ['Se vad akademin har innan du dömer den.'],
'N:community': ['Bli en av oss i bygden. Det tar tid, börja nu.'],
'N:identity': ['Vi vill se din spelidé, men ta den i din takt.'],
```

## Övertagande-raden (dynamisk, Code interpolerar — INTE i talpoolen)

En egen sub-rad i mötet, samma princip som eval-raderna och finance-boxen håller dynamisk data utanför talpoolen. Läses ur ledgerposten + clubSpells:

- klubben du lämnade och varför (avsked/frivilligt) — ur föregående `clubSpell` + `manager_return`/avskedsposten,
- företrädarens läge vid övertagandet (placering/avskedad) — om känt ur tränarmarknadsvalet,
- om du tränat klubben förr — ur `clubSpells` (returnerande manager).

Formuleras generiskt av Code ur fälten; Opus skriver den radens mall separat om Code vill ha låst svenska, men den ska aldrig ligga i den statiska poolen.

## Ledgerpost (Code)

Övertagandet bör bära ett durabelt karriärfaktum. Kontrollera om en generell `manager_appointed`/`club_joined`-post redan finns; lägg annars till en (`manager_return` finns redan för själva återkomsten till spel). Mötet läser posten TILLSAMMANS med `seasonsAtClub` och `clubSpells` — ledgern är belägg, inte ensam ägare av det aktiva tillståndet.

## Tester

- Regressionstest: klubbyte mitt i karriären, `seasonsAtClub === 1`, tidigare avslutad spell → tillstånd N, aldrig A.
- Negativt: karriärens allra första klubb, säsong 2 → fortsatt A.
- N-poolen slumpas utan upprepning per spelinstans, samma no-repeat-tracker som A/B/C.
