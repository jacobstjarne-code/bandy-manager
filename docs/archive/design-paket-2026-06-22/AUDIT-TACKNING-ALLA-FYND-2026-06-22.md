# AUDIT-TÄCKNING — alla fynd, beslut & ägare

**Datum:** 2026-06-22 · **Av:** Fable / Design · **Till:** Jacob + Opus + Code
**Syfte:** Säkra att inget fynd ur Code:s logic/gameplay-audit tappas. Varje rad har ett beslut och en ägare. "Klart" = Jacob åtgärdat de enkla.

## Bekräftade buggar / promise-gaps

| # | Fynd | Beslut | Ägare | Status |
|---|---|---|---|---|
| 1 | `pickEfterklang > 20 → > 0.20` | Fixa (1 rad) | Code | ✅ Jacob klar |
| 2 | scoutBudget → scoutAccuracy bruten | Wire — budget ska höja träffsäkerhet, annars är uppgraderingen attrapp | Code | ✅ Jacob klar |
| 6 | Era-skiften — låg exponering | **Wire:** inbox-rad + callback-beat vid skifte. Inte bara exponering — det är bränsle till callback (#1). | Code + Design | ✅ Jacob klar |
| 7 | Nemesis-tröskel 3→2 mål | Sänk. Och i killer-app #2: utsedd nemesis kräver ej "nästa motståndare" — tråden persisterar. | Code | ✅ Jacob klar |
| 8 | Volunteers rolltyp → motor | **Wire:** motorn ska läsa rolltyp så UI:ns differentierade effekter blir sanna. Billig integritetsvinst. | Code | ⬜ Order |

## Kräver designriktning (levererad i denna batch)

| # | Fynd | Beslut | Dokument |
|---|---|---|---|
| 3 | awayTrip — halvfärdig loop | **Dödmarkera** manager-logistiken (`game.awayTrip`); behåll klack-ritualet; rädda känslan som pre-match context-rad. | `DESIGNRIKTNING-AWAYTRIP` |
| 4 | boardObjective rewards = text | **Bygg om:** verklig-men-innesluten belöningsstege (mjuk default, hård sällan), synlig misslyckande-beat. | `DESIGNRIKTNING-BOARD-REWARDS` |
| 5 | sponsorNetworkMood — attrapp m. intention | **Wire:** sponsorintäkts-modifierare, född av board-rewards. Löses TILLSAMMANS med #4. | `DESIGNRIKTNING-BOARD-REWARDS` |

## Attrapp-fält (Code-verifierade orphans) — beslut

| Fält | Beslut | Motiv |
|---|---|---|
| `sponsorNetworkMood` | **Wire** (se #4/#5) | Har intention + nu en konsument via board-rewards + syns i min konsekvens-design. |
| `lastNationalSnub` | **Wire eller cut — Opus avgör.** Lågt: kan bli en callback ("förbigången i landslaget igen") om landslags-systemet är värt att exponera. Annars cut. | Liten. Potentiell callback-trigger, men bara om nationalTeam-systemet ska synas mer. |
| `retirementCeremonyCounter` | **Cut** om generationsloopens avskedskapitel byggs — det ersätter en räknare med en riktig ceremoni. Annars wire till en enkel notis. | Överlappar killer-app #4. Bygg ceremonin, släng räknaren. |

## Låg exponering — utöver #6/#7

| Fynd | Beslut |
|---|---|
| Anniversary — significance ≥95 + 45% slump | **Sänk trösklarna** (Opus balans). Jubileumsmomenten finns men konkurreras ut. Lågt hängande. |
| Deadline Day — noll dramatik | **Spelkänsla:** ge budet en urgency-signal utanför inboxen (portal-beat + ev. escalation-estetik). Ärver beat-familjen. Design kan mocka. |

## Sammanfattning för Jacob
- **Rena Code-ordrar, inget designbeslut:** 1, 2, 6, 7 (klara), 8 (kvar), anniversary-trösklar.
- **Designriktning levererad, redo att bygga:** 3, 4+5.
- **Opus-beslut:** `lastNationalSnub` (wire/cut), anniversary/nemesis-vikter, board-rewards-balansen, star_injury-kaskaden (separat not).
- **Design kan mocka om önskas:** board-rewards-ytan, Deadline Day-dramatiken.

Inget fynd ligger utan beslut. Det som saknar ⬜→✅ är bygg-arbete, inte oavklarade frågor.
