# DOM — `clubId` PÅ LIGGARPOSTEN: VAD SOM FÖLJER MANAGERN OCH VAD SOM STANNAR HOS KLUBBEN

**Datum:** 2026-09-04 · **Dömt av:** Opus (äger liggarrundan), efter GPT:s minnes-slutprov och Codex åtgärdspass · **Bygger:** Code (rebasar på Codex) · **Retroaktiv** på fältet Codex redan lade in — som §4b, med samma logik: fältet var rätt, domen saknades.

## Varför fältet behövdes

GPT:s slutprov: efter klubbyte fick Slottsbron en landslagsbelöning för Kristoffer i Hälleforsnäs, och spelet påstod att Slottsbron "säkrat serieettan" (ett patronuttåg feltolkat). Minnen läckte mellan klubbar. Samma vecka gick `ledgerEntryBelongsToManagedClub` sönder tre gånger (transfer-typer, subjektlösa beslut, opponent-subject). Alla tre var samma fel: filtret försökte gissa klubbtillhörighet ur `subject`-heuristik. "Är detta den managerade klubbens post?" var fel fråga. Rätt fråga är "vilken klubbs post är detta?" — och den kan bara svaras om posten själv vet.

## Domen i fyra delar

**1. `clubId` är obligatoriskt på varje ny liggarpost** — klubben posten *händer* för, stämplad av `logEvent` vid skrivtillfället (managerad klubb som default; producenter som skriver för en annan klubb — rivalens värvning, motståndarens derbyseger — sätter den explicit). Backfill för befintliga poster: managerad klubb vid skrivtillfället, härledd ur `managerCareer`/`switchManagedClub`-historiken per säsong; kan det inte härledas → nuvarande klubb, märkt `clubIdInferred: true` så ingen konsument litar blint. Code verifierar att Codex backfill gjorde exakt detta.

**2. Läsning filtrerar på `clubId`, aldrig på subject-heuristik.** `ledgerEntryBelongsToManagedClub` retireras (retire-last). k1:s enade läsare tar `clubId` som parameter: Krönikan läser `clubId === managedClubId`, punkt. De tre buggarna kan inte återkomma, för det finns ingen gissning kvar.

**3. Två perspektiv, två läsare — det här är den egentliga domen.**

*Klubbens minne* (Krönikan, Klubbminnet, årsdagar, Efterklang, årsbokens klubbdel): filtrerar på `clubId`. Managern som lämnar tar det INTE med sig. När GPT återvände till Hälleforsnäs var Krönikan där Hälleforsnäs minne — med hans år i den, som en tränare bland flera.

*Managerns minne* (Karriärhistoriken, HistoryScreen `managerSeason`, brevarkivet, burnout-bågen, meritbufferten, rykte): filtrerar på `managerId`-perspektiv — poster där managern var handlande, över klubbgränser. Det kräver en andra stämpel: **`managerId`** på poster som är managerns handling eller öde — `decision`, `manager_burnout`, `storyline_resolution` där managern är subjekt, `player_milestone` när målet sattes av managern (personligt mål), `retirement`? nej (klubbens). Regeln: *managern äger det han valde och det som hände honom; klubben äger det som hände klubben.* Kristoffers landslagsuttagning är klubbens post (Hälleforsnäs) MEN det personliga målet managern satte är managerns — därför kan berättaren säga "Kristoffer årets spelare — det började i Hälleforsnäs, med ett mål du satte."

**4. Vad som stannar, vad som följer — tabellen Code bygger mot:**

| Följer managern (`managerId`) | Stannar hos klubben (`clubId`) |
|---|---|
| burnout-båge och återfall | Krönikan, Klubbminnet, årsdagar |
| karriärhistorik, `managerSeason` | patron, mecenat, sponsorer |
| brevarkivet (brev till honom) | journalistrelation och Efterklang |
| rykte, meritbuffert, avskedsräkning | communityStanding, Orten |
| personliga mål han satt (stämpel på målet, inte på spelaren) | domarrelation |
| beslut han fattat (`decision`) | styrelseförväntan, boardPatience, Survive-kontrakt |
| "året utan klubb" | truppen, kontrakten, akademin |

Byte nollställer allt i höger kolumn för managern (han börjar om hos en ny styrelse) och tar med allt i vänster. `switchManagedClub` verifieras mot tabellen rad för rad.

## Vad detta gör byggbart

- **`berattaren-callbacks`** (a) ex-spelare mot sin gamla klubb: `transfer_sold`-posten har `clubId` = säljande klubb, `subject` = spelaren → vid match där spelaren spelar mot `clubId`: callback. (b) första matchen mot managerns förra klubb: managerns karriärposter ger listan av tidigare `clubId`; första fixture mot en av dem → callback. (c) spelare managern byggde får utmärkelse i annan klubb: personligt mål med `managerId` + `player_milestone` senare → callback.
- **k1** filtrerar på clubId; Krönikan blir korrekt för alla typer utan undantag.
- **Karriärhistoriken** (HistoryScreen) läser `managerId`-vyn och kan för första gången visa "två klubbar, ett liv".

## Text (Opus) — minimalt, låst

Klubbyte i Krönikan (klubbens post när managern lämnar): *{Manager} lämnade. {N} säsonger. Orten minns det den vill.*
Klubbyte i Karriärhistoriken (managerns post): *{Klubb}, {startår}–{slutår}. {En rad ur boardTruth: "över förväntan" / "under" / "som väntat".}*
Återkomst (callback b, förmatch): *Första gången tillbaka. Läktaren minns, åt båda hållen.*

## Arbetsordning

1. **Klar 2026-09-04:** Code verifierade backfill mot del 1; lade `managerId` på managerägda beslut, burnout och personliga mål; k1 filtrerar på `clubId` och subject-heuristiken är retirerad.
2. **Klar 2026-09-04:** `berattaren-callbacks` (a)–(c) är byggda i Granska, med den gemensamma återkomstkontrollen även i Portal före match.
3. HistoryScreen `managerId`-vy: efter 1, liten.

## Godkänt när

GPT:s slutprov körs om i klubbytesdelen: ingen post läcker mellan klubbar; återkomsten till gamla klubben får sin rad; Kristoffer-callbacken faller ut; burnout följer med, patron gör det inte. Alla tester gröna.
