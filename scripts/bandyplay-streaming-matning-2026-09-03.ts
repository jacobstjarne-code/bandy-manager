/**
 * Liten balansmätning för SPEC_BANDYPLAY_STREAMING_OCH_BANDYSKOLA_2026-09-03,
 * Jacobs val C. Kör den kanoniska calcRoundIncome-vägen — ingen parallell
 * kalkyl — och visar sponsorlyft, produktionskostnad och säsongsnetto.
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import {
  BANDYPLAY_ACTIVATION_COST,
  BANDYPLAY_RUNNING_COST,
  BANDYPLAY_SPONSOR_BONUS_MAX,
  calcRoundIncome,
} from '../src/domain/services/economyService'
import type { Sponsor } from '../src/domain/entities/SaveGame'

const REGULAR_SEASON_ROUNDS = 22
const game = createNewGame({ managerName: 'Bandyplay-mätning', clubId: 'club_forsbacka', season: 2025, seed: 1 })
const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
const activitiesOff = { ...game.communityActivities!, bandyplay: false }
const activitiesOn = { ...activitiesOff, bandyplay: true }

function income(sponsorTotal: number, active: boolean, freshness = 1) {
  const sponsors: Sponsor[] = [{
    id: `measure_${sponsorTotal}`,
    name: 'Mätsponsor',
    category: 'Test',
    weeklyIncome: sponsorTotal,
    contractRounds: REGULAR_SEASON_ROUNDS,
    signedRound: 0,
  }]
  return calcRoundIncome({
    club,
    players: [],
    sponsors,
    communityActivities: active ? activitiesOn : activitiesOff,
    sponsorNetworkMood: 50,
    streamingFreshnessMultiplier: freshness,
    fanMood: 50,
    isHomeMatch: false,
    matchIsKnockout: false,
    matchIsCup: false,
    matchHasRivalry: false,
    standing: null,
    rand: () => 0.5,
  })
}

console.log(`Bandyplay C: bonus ${Math.round(BANDYPLAY_SPONSOR_BONUS_MAX * 100)} %, drift ${BANDYPLAY_RUNNING_COST} kr/omg, start ${BANDYPLAY_ACTIVATION_COST} kr`)
for (const sponsorTotal of [2_000, 5_000, 10_000]) {
  const off = income(sponsorTotal, false)
  const on = income(sponsorTotal, true)
  const sponsorLift = on.sponsorIncome - off.sponsorIncome
  const netPerRound = on.netPerRound - off.netPerRound
  const laterSeason = netPerRound * REGULAR_SEASON_ROUNDS
  const firstSeason = laterSeason - BANDYPLAY_ACTIVATION_COST
  console.log(`${sponsorTotal} kr sponsor/omg: +${sponsorLift} sponsor, ${netPerRound >= 0 ? '+' : ''}${netPerRound} netto/omg, ${laterSeason >= 0 ? '+' : ''}${laterSeason}/säsong efter startåret, ${firstSeason}/första säsongen`)
}

const halfFreshOff = income(5_000, false)
const halfFreshOn = income(5_000, true, 0.5)
console.log(`5 000 kr sponsor/omg vid 50 % färskhet: ${halfFreshOn.netPerRound - halfFreshOff.netPerRound} kr/omg (bonus trappar till driftens nivå)`)
console.log(`Taktest: ${Math.round(BANDYPLAY_SPONSOR_BONUS_MAX * 100)} % < 5 % flaggskeppsskala`)
