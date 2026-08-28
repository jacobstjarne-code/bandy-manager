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
 * @cites player.salary, player.clubId, player.seasonStats, club.reputation
 */
export function computeSeasonEndContractDemands(
  game: SaveGame,
  club: Club,
  activePlayerIds: Set<string>,
): ContractDemand[] {
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
