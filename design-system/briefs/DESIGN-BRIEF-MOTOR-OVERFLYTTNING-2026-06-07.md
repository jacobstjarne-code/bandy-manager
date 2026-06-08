# DESIGN-BRIEF: Motoröverflyttning — gör de nya matchdynamikerna spelbara

**Datum:** 2026-06-07
**Från:** Opus (dataspåret — motorkalibrering mot verklig bandydata)
**Till:** Opus (designspåret — Bandy Manager UX/narrativ)

---

## Bakgrund — vad som hänt i motorn

Motorn (`src/domain/services/matchCore.ts`) har gått igenom en strukturell kalibrering mot verklig Elitserie-data (Bandygrytan, 1 321 herrmatcher). Den producerar nu fyra dynamiker som tidigare saknades — alla emergenta ur mekanismer, inte fudgade konstanter, och alla live i spelet (kalibreringsharnessen kör samma matchCore som spelet, så trimmen deployar med spelet):

1. **Post-paus-fönster.** Det jagande laget får en transient skjuts tidigt i andra halvlek (ramp minut 45→60). Comebacks klustrar 6–10 min efter pausen, precis som i verklig bandy.
2. **Momentum efter kvittering.** Ett lag som just kvitterat behåller fart och är favorit att vinna upplösningen, i stället för att nollställas till jämnt.
3. **Decisiveness sent.** Jämna sena lägen (ramp minut 66→84) öppnar upp och avgörs, i stället för att driva mot oavgjort.
4. **Dispositionell stil** (specad, under implementation av Code). Taktiska val — tempo, passingRisk, mentality — driver målklustring och rytm; cornerStrategy driver hörnberoende. Olika taktik → olika spelsätt.

## Problemet — realism utan upplevelse

De här dynamikerna är **verkliga i motorn men osynliga och opåverkbara för spelaren.** En mer realistisk comeback-fördelning förbättrar spelet bara om spelaren *känner* bågen — spänningen i att leda i paus, momentumsvängningen efter en kvittering, det avgörande slutet. Händer det bara som siffror i en box score tillförde realismen ingenting till upplevelsen. Det är design-gapet, och det är designspårets.

## Uppdraget — tre frågor per dynamik

För var och en av de fyra:
1. **Förnimbar?** Ser och känner spelaren att den händer?
2. **Påverkbar?** Kan spelarens val styra den?
3. **Balanserad för spelaren?** En specifik fara: fler comebacks gör spelarens *egna* ledningar mindre säkra. Dramatiskt eller frustrerande? Det är en känslo-avvägning, inte en aggregatsiffra — och den måste kännas på spelarsidan, inte bara stämma mot ligan.

## Ytorna (finns redan i koden)

- **`MomentumBar.tsx`** — den naturliga ytan för förnimbarhet. Speglar den post-paus-trycket, kvitterings-momentumet och den sena decisiveness-fasen? Just nu visar den troligen något grövre. Perception är första steget: spelaren måste *se* dramat innan hen kan ges spakar över det.
- **`HalftimeModal.tsx` + `pepTalkService.ts`** — den renaste agens-vinsten. Post-paus-urgencyn slår in *efter pausen*, så pausbeslutet är en naturlig spak: ett vasst paussnack i underläge kan förstärka comeback-trycket, ett lugnande i ledning kan stabilisera. Det gör halvtidsvalet betydelsefullt på ett sätt motorn nu faktiskt backar upp.
- **`TaktikScreen` + `tacticModifiers.ts`** — när stilkalibreringen är inne får taktikvalen verklig hävstång på matchens rytm. Gör det *läsbart*: spelaren ska förstå att högt tempo ger fler målskurar, inte bara se abstrakta reglage. (Den här ytan är bryggan — den kopplar spelarens taktik till motorns burst-mekanik.)

## Princip — var ärlig mot motorn

UI:t ska spegla **verkligt motortillstånd**, inte en dekorativ animation vid sidan om. Momentum, post-paus-urgency och lateFactor är riktiga variabler motorn räknar fram — läs dem, hitta inte på en parallell effekt som *ser* dramatisk ut men inte hänger ihop med vad som faktiskt avgör matchen. Samma disciplin som styrde kalibreringen (modellera orsaken, fitta inte kurvan) gäller presentationen: visa det som händer, inte en tillrättalagd version. En momentumbar som ljuger om motortillståndet är värre än ingen.

## Prioritet

1. **Perception först** — MomentumBar och kommentaren speglar de nya andra-halvleks-dynamikerna. Spelaren måste se dramat.
2. **Agens sedan** — halvtidsspaken (paussnack → post-paus-urgency), eftersom halvtiden redan är ett beslutsmoment i flödet.
3. **Stil-läsbarhet** — Taktik-skärmen, efter att Code implementerat stilkalibreringen.

## Kontext om var detta kommer ifrån

Motorarbetet var en flerstegs-kalibrering: marginaler (mål/match, hörnprocent, foulfrekvens) var redan rätt sedan tidigare; den här omgången stängde *strukturen* — comeback-fönster, en lika-attraktor som producerade för många oavgjorda, lagspecifik hemmafördel, och stil. Tre strukturgap visade sig vara ett (en lika-attraktor i 2H-modellen) och stängdes med tre koherenta mekanismer. Restposten: comebacks som fullbordas är fortfarande något för få (9 mot verkligt 13 %) — och slutsatsen var att den resten stängs bättre med *spelaragens* än med mer motortuning. Vilket är exakt den här briefen.
