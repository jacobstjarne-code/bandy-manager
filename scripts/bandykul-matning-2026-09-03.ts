/**
 * Balansmätning för SPEC_BANDYPLAY_STREAMING_OCH_BANDYSKOLA_2026-09-03 §4b.
 * Kör de kanoniska ekonomi- och ungdomsintagsvägarna, inte parallell matte.
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import {
  BANDY_SCHOOL_BASIC_RUNNING_COST,
  BANDY_SCHOOL_BASIC_SPONSOR_COST_SHARE,
  calcRoundIncome,
} from '../src/domain/services/economyService'
import { ACTIVITY_CS_BOOST } from '../src/domain/services/communityRenewalService'
import { generateYouthIntake } from '../src/domain/services/youthIntakeService'
import type { Sponsor } from '../src/domain/entities/SaveGame'

const REGULAR_SEASON_ROUNDS = 22
const HOME_ROUNDS = REGULAR_SEASON_ROUNDS / 2
const game = createNewGame({ managerName: 'BandyKul-mätning', clubId: 'club_forsbacka', season: 2025, seed: 1 })
const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
const activities = { ...game.communityActivities!, bandySchoolBasic: true, bandyplay: false }

function schoolDelta(sponsors: Sponsor[], isHomeMatch: boolean, rand: () => number) {
  const off = calcRoundIncome({
    club, players: [], sponsors,
    communityActivities: { ...activities, bandySchoolBasic: false },
    fanMood: 50, isHomeMatch, matchIsKnockout: false, matchIsCup: false,
    matchHasRivalry: false, standing: null, rand,
  })
  const on = calcRoundIncome({
    club, players: [], sponsors, communityActivities: activities,
    fanMood: 50, isHomeMatch, matchIsKnockout: false, matchIsCup: false,
    matchHasRivalry: false, standing: null, rand,
  })
  return on.netPerRound - off.netPerRound
}

const sponsor: Sponsor = {
  id: 'bandykul_partner', name: 'Mätpartner', category: 'Test',
  weeklyIncome: 5000, contractRounds: REGULAR_SEASON_ROUNDS, signedRound: 0,
}

for (const [label, sponsors] of [['utan sponsor', []], ['med aktiv sponsor', [sponsor]]] as const) {
  const away = schoolDelta([...sponsors], false, () => 0.5)
  const home = schoolDelta([...sponsors], true, () => 0.5)
  const season = away * (REGULAR_SEASON_ROUNDS - HOME_ROUNDS) + home * HOME_ROUNDS
  console.log(`${label}: ${away} kr bortaomgång, ${home} kr hemmaomgång, ${season} kr/grundserie`)
}

const maxFeesAway = schoolDelta([sponsor], false, () => 1)
const maxFeesHome = schoolDelta([sponsor], true, () => 1)
console.log(`maxavgift med sponsor: ${maxFeesAway} kr borta, ${maxFeesHome} kr hemma (aldrig plus)`)
console.log(`sponsorandel: ${BANDY_SCHOOL_BASIC_SPONSOR_COST_SHARE * 100} % av ${BANDY_SCHOOL_BASIC_RUNNING_COST} kr per driftstillfälle`)
console.log(`CS: BandyKul ${ACTIVITY_CS_BOOST.bandySchoolBasic}/omg > avancerad skola ${ACTIVITY_CS_BOOST.bandySchool}/omg`)

const baselineClub = { ...club, youthRecruitment: 60 }
const advancedClub = { ...club, youthRecruitment: 62 }
let baselineCount = 0
let bandyKulCount = 0
let advancedCount = 0
const seeds = 10_000
for (let seed = 1; seed <= seeds; seed++) {
  const common = { existingPlayers: [], season: 2026, date: '2026-07-01', seed }
  baselineCount += generateYouthIntake({ ...common, club: baselineClub }).newPlayers.length
  bandyKulCount += generateYouthIntake({ ...common, club: baselineClub, communityActivities: activities }).newPlayers.length
  advancedCount += generateYouthIntake({ ...common, club: advancedClub }).newPlayers.length
}
console.log(`ungdomsintag, snitt över ${seeds} seeds: bas ${(baselineCount / seeds).toFixed(3)}, BandyKul +1 ${(bandyKulCount / seeds).toFixed(3)}, avancerad +2 ${(advancedCount / seeds).toFixed(3)}`)
