/**
 * contractDemandService — A-H2b RETENTION, INTE BUDGET
 * (DOM_AH2B_RETENTION_2026-08-28.md, femte omtaget).
 *
 * Fem tidigare mätpass (kronmått: tier-verdict, topp3/titel, marginal mot
 * tvåan, wageBudget, cashGrowth) kraschade på samma sten: en dominant klubb
 * tjänar snabbare än den ådrar sig lönekrav, så varje kronmått frågar "har
 * vinnaren råd" och svaret är alltid ja. Domen: kostnaden är TRUPPEN, inte
 * KASSAN — mät i spelare, ingen denominator.
 *
 * Tre led (ingen budget, ingen kronjämförelse):
 *  1. computeSeasonEndContractDemands — obemött marknadskrav vid säsongsslut
 *     (denna fil, körs av seasonEndProcessor.ts på PRE-ROLLOVER game.players
 *     — seasonStats måste vara den AVSLUTADE säsongens, inte nästa säsongs
 *     nollställda värden).
 *  2. applyContractDemandResolutions — obemött krav eroderar moral
 *     (mellanledet, Jacobs val: synligt, planeringsbart — inte en dold,
 *     omedelbar bestraffning). Möta kravet = ingen morale-effekt (nöjd,
 *     inte belönad — se renewContract-fixet i transferActions.ts för samma
 *     princip på den manuella förlängningsvägen).
 *  3. Moral matar sedan två BEFINTLIGA budhookar i transferService.ts
 *     (computeMoraleBidWeight i generateIncomingBids-urvalet,
 *     computeMoraleAcceptanceBonus i playerAcceptsTransfer) — se den filen,
 *     inte denna.
 *
 * VILLKOR 2 (SLUTTEST_KO.md A-H2b-fyndet, byggt 2026-08-29): leg 1 ovan
 * beskrev ursprungligen bara det individuella marknadskravet (villkor 1).
 * Den ABSOLUTA klubbframgångsgrinden domen alltid krävt utöver detta —
 * "klubben ska ha gjort minst ETT av tre: topp tre, vunnit serien/cupen,
 * eller förbättrat placeringen mot föregående säsong" — fanns bara i
 * doktrintexten fram tills nu. Se clubSatisfiesSeasonSuccessGate nedan.
 * Mätt effekt (scripts/anspark1-villkor2-matning-2026-08-29.ts): mittenlagets
 * kravfrekvens halveras (6.85→3.61/säsong) men blir inte "sällsynt" som
 * förutspått — dörr (c) slår in ~50 % av säsongerna av ren positionsbrus.
 * Dörr a+b ensamma ger 1.88/säsong (sällsynt). Rapporterat, inte åtgärdat —
 * implementerat exakt som doktrinen specificerar.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import type { Club } from '../entities/Club'
import { computeContractMinSalary, computeLeaguePositionAverages } from './economyService'

export interface ContractDemand {
  playerId: string
  currentSalary: number
  minSalary: number   // computeContractMinSalary vid säsongsslutet — "vad marknaden anser hen värd"
}

/**
 * Villkor 2 (SLUTTEST_KO.md A-H2b-fyndet, 2026-08-28 — se
 * DOM_AH2B_RETENTION_2026-08-28.md, som ärver definitionen ordagrant från
 * dess föregångare DOM_AH2B_BUDGETTRYCK_KORORDER_2026-08-28.md): den
 * ursprungliga retention-domen implementerade bara villkor 1 (individuellt
 * obemött marknadskrav) — ingen klubb-nivå-grind fanns, så ett mittenlag
 * såg 6-7 krav/säsong trots att domen kräver att klubben SJÄLV lyckats.
 *
 * ABSOLUT, inte tier-relativt (en tidigare tier-relativ variant fyrade
 * bakvänt — se DOM_AH2B_BUDGETTRYCK_KORORDER_2026-08-28.md: en dominant
 * klubb som klättrar till WinLeague-tier fick en STRÄNGARE grind, inte en
 * lösare). Klubben kvalificerar om den gjort MINST ETT av tre denna säsong:
 *   (a) slutat topp tre i serien
 *   (b) vunnit serien (playoffmästare) ELLER cupen
 *   (c) förbättrat sin slutplacering mot föregående säsong
 *
 * `finalPosition` — den AVSLUTADE säsongens tabellplacering. Måste komma
 * från den färskt beräknade `standings` i seasonEndProcessor.ts (t.ex.
 * `managedClubStanding.position`), INTE `game.standings` — det fältet
 * nollställs till en alfabetisk dummytabell vid rollover och är redan
 * dokumenterat fel för det här syftet (se seasonStartSnapshot-kommentaren
 * i SaveGame.ts och tidigare bruk i samma fil för `bestFinish`-spårning).
 *
 * Föregående säsongs placering läses från `game.seasonStartSnapshot?.
 * finalPosition` — det fältet sätts VID FÖREGÅENDE säsongsslut (samma
 * seasonEndProcessor.ts-block som bygger nästa spelrunda) och representerar
 * alltså "positionen säsongen INNAN den som just avslutats", vilket är
 * exakt jämförelsepunkten (c) kräver. Saknas fältet (säsong 1, inget att
 * jämföra mot) räknas dörr (c) som ouppfylld — dörr (a)/(b) kan ändå slå in.
 */
export function clubSatisfiesSeasonSuccessGate(
  game: SaveGame,
  club: Club,
  finalPosition: number,
): boolean {
  const topThree = finalPosition <= 3
  const wonLeague = game.playoffBracket?.champion === club.id
  const wonCup = game.cupBracket?.winnerId === club.id
  const previousPosition = game.seasonStartSnapshot?.finalPosition
  const improvedPosition = previousPosition !== undefined && finalPosition < previousPosition
  return topThree || wonLeague || wonCup || improvedPosition
}

/**
 * Leg 1 — beräknar vilka av den hanterade klubbens AKTIVA förstalagsspelare
 * har ett obemött marknadskrav (salary < computeContractMinSalary) vid
 * säsongsslutet. MÅSTE anropas med `game`/`club` FÖRE seasonEndProcessor.ts
 * nollställer seasonStats för nästa säsong — computeLeaguePositionAverages
 * läser `game.players[].seasonStats` (den AVSLUTADE säsongens siffror).
 *
 * `activePlayerIds` — spelare som fortsätter i klubben nästa säsong (redan
 * kända i seasonEndProcessor.ts vid anropstillfället: inte pensionerade,
 * inte kontraktsutgångna). Pensionerande/utgående spelare får inget krav —
 * de lämnar oavsett, ett krav på dem vore ett beslut utan verkan.
 *
 * `finalPosition` — se clubSatisfiesSeasonSuccessGate ovan (villkor 2).
 * Klubben måste kvalificera på VILLKOR 2 innan villkor 1 ens prövas — en
 * klubb som inte lyckats denna säsong producerar noll krav, oavsett hur
 * många enskilda spelare som överpresterat.
 *
 * @cites player.salary, player.clubId, player.seasonStats, club.reputation
 */
export function computeSeasonEndContractDemands(
  game: SaveGame,
  club: Club,
  activePlayerIds: Set<string>,
  finalPosition: number,
): ContractDemand[] {
  if (!clubSatisfiesSeasonSuccessGate(game, club, finalPosition)) {
    return []
  }

  const leagueAverages = computeLeaguePositionAverages(game)
  const squad = game.players.filter(
    p => p.clubId === game.managedClubId && activePlayerIds.has(p.id),
  )

  const demands: ContractDemand[] = []
  for (const player of squad) {
    const minSalary = computeContractMinSalary(player, club, leagueAverages)
    if (minSalary > player.salary) {
      demands.push({ playerId: player.id, currentSalary: player.salary, minSalary })
    }
  }
  return demands
}

// Leg 2 — mellanledet (Jacobs val 2026-08-28): obemött krav eroderar moral,
// synligt och planeringsbart, INTE en osynlig bud-vikt. Magnitud kalibrerad
// mot morale-fördelningen i scripts/anspark1-retention-matning-2026-08-28.ts
// (baseline-morale 50-90, se createNewGame.ts/worldGenerator.ts) — 22 valt
// som "tydligt missnöjd" (flyttar en genomsnittsspelare från 60-70 in i
// 40-50-bandet, under den befintliga <30-tröskeln bara vid upprepade/
// samtidiga missar på en redan lågmorale-spelare, inte vid ett enda krav på
// en nöjd spelare) — se mätningen i samma script för det uppmätta utfallet.
export const UNMET_DEMAND_MORALE_PENALTY = 22

/**
 * Leg 2 — applicerar spelarens beslut per krav. `resolutions` nycklas på
 * playerId. Möter kravet (`met`): lön höjs till minSalary, ingen morale-
 * effekt (nöjd = neutral, inte belönad — en marknadsmässig lön är inte en
 * gåva). Möter INTE kravet (`skipped`, eller saknad post — samma som
 * "skipped", en spelare vars krav inte hanteras är per definition obemött):
 * ingen löneändring, morale eroderas med UNMET_DEMAND_MORALE_PENALTY.
 *
 * Ren funktion — anropas av resolveContractDemands (gameFlowActions.ts).
 */
export function applyContractDemandResolutions(
  players: Player[],
  demands: ContractDemand[],
  resolutions: Record<string, 'met' | 'skipped'>,
): Player[] {
  const demandByPlayerId = new Map(demands.map(d => [d.playerId, d]))
  return players.map(p => {
    const demand = demandByPlayerId.get(p.id)
    if (!demand) return p
    const met = resolutions[p.id] === 'met'
    if (met) {
      return { ...p, salary: demand.minSalary }
    }
    return { ...p, morale: Math.max(0, p.morale - UNMET_DEMAND_MORALE_PENALTY) }
  })
}
