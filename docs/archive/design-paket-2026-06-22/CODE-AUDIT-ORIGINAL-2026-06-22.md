# CODE — Logic/gameplay/kapacitets-audit (original)

**Av:** Code · **Datum:** 2026-06-22 · **Status:** Originalrapport, ordagrant. Designsvar: `AUDIT-TACKNING-ALLA-FYND-2026-06-22.md` + designriktnings-noterna i samma mapp.

---

## Bekräftade buggar (fixas direkt)

**pickEfterklang.ts:92 — klackEcho portal-kort triggar aldrig**
Villkoret `currentWeight > 20` kan aldrig vara sant: värdet börjar på 1.0 och sjunker bara. Portal-kortet för klackEcho är effektivt död kod. Fix: `> 20` → `> 0.20`. En rad.

**awayTrip — halvfärdig loop**
Bortaresa genereras, spelaren kan inte se den, effekten appliceras aldrig i matchmotorn. `AWAY_ROUTINE_OUTCOMES`-texterna i managerKvittoText.ts är definierade men importeras aldrig. Ingen UI-komponent renderar awayTrip-kortet. Antingen bygg loopen färdig eller dödmarkera systemet — just nu är det en loop utan slutpunkt.

## Promise/consequence-gap (UI lovar, motorn levererar inte)

**boardObjectiveService — rewards är bara text**
`successReward` och `failureConsequence` är strängar. Inget budget-delta, ingen transferbudget-bonus, ingen ryktesändring. Enda mekaniska konsekvensen är ±3/5 patience. Sack-triggern fungerar — men allt mellan fulfilment och sack är dekorativt. Spelaren fattar boardbeslut mot löften som inte håller.

**scoutBudget → scoutAccuracy koppling bruten**
`scoutAccuracy` är hårdkodad till 70 i scoutProcessor.ts:45. Läser aldrig scoutBudget. Spelaren betalar 15 000 kr för en upgrade som gör noll skillnad på träffsäkerheten. Klassisk attrapp-uppgradering.

**Volunteers — rollspecifik UI, flat motor**
OrtenTab visar differentierade effekter per rolltyp (Matchvärd: 4 puls/omg, Kioskvakt: 800 kr/omg). Motorn kör ett platt aggregat som ignorerar roll. Löftet om att rollval spelar roll är tomt.

## Attrapp-fält (skrivs, konsumeras aldrig)

| Fält | Skrivs i | Konsument |
|---|---|---|
| `lastNationalSnub` | roundProcessor.ts:583 | ingen |
| `retirementCeremonyCounter` | gameFlowActions.ts:649 | ingen |
| `sponsorNetworkMood` | rippleEffectService.ts | ingen |

`sponsorNetworkMood` är den intressanta: det uppdateras aktivt av ripple-systemet och rör sig — men ingen ekonomi-service, portal-trigger eller UI-komponent läser det. Det finns en intention här (sponsors reagerar på stämning) som aldrig landade.

## Låg exponering — system som sällan når spelaren

**Era-skiften** — beräknas, lagras, syns som etikett i ClubMemorySeasonSection.tsx:38. Ingen inbox-rad, ingen scen, ingen notis när en era börjar eller slutar. Spelaren märker det bara om de går in i klubbminnet och råkar se etiketten.

**Nemesis** — trigger kräver att EN specifik spelare scorar 3+ gånger mot spelaren, OCH att exakt den klubben är näste motståndare. Systemet är djupt byggt (Efterklang + tension-minne + transfer-prissättning) men det stora flertalet säsonger triggar det aldrig. Tröskelkravet är för smalt för vad systemet kan ge.

**Anniversary** — fungerar tekniskt från säsong 2, men significance-tröskeln ≥ 95 plus 45% slump på klack-banderollen gör att spelaren sällan ser det. Jubileumsmomenten finns men konkurreras ut av höga sannolikhetströsklar.

**Deadline Day** — TransferDeadlinePrimary.tsx är byggd, logiken finns, men dramatiken är noll. Budet hamnar i inboxen utan urgency-signal utanför den.

## Sammanfattning — vad som förtjänar en order

| Prio | Fynd | Typ | Kostnad |
|---|---|---|---|
| 1 | pickEfterklang `> 20` → `> 0.20` | Bugg | 1 rad |
| 2 | scoutBudget → scoutAccuracy kopplingen | Promise-gap | Liten |
| 3 | awayTrip — bygg färdigt eller dödmarkera | Halvfärdig loop | Medium/design |
| 4 | boardObjectiveService rewards | Promise-gap | Medium, designbeslut |
| 5 | sponsorNetworkMood — koppla in eller ta bort | Attrapp med intention | Design |
| 6 | Era-skiften — minst en inbox-rad vid skifte | Låg exponering | Liten |
| 7 | Nemesis-tröskel — sänk från 3 till 2 mål | Låg exponering | Liten |
| 8 | Volunteers rolltyp → motor | Promise-gap | Liten/medium |

Prio 1 och 2 är rena Code-ordrar utan designbeslut. Prio 3–5 kräver att du väljer riktning. Prio 6–8 är lågt hängande exponeringsvinster.
