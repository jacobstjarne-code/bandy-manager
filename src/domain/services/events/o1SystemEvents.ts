import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import type { YouthPlayer } from '../../entities/Academy'
import { klackLeaderVoiceId } from '../voiceIntroductionService'
import { seasonalUnitRoll } from '../seasonalRollService'
import { swedishGenitive } from '../../utils/swedishGrammar'

// O1 candidates 2–4. The values are deliberately modest: these events are
// memorable cross-system choices, not a shortcut around the ordinary
// facility, academy or supporter progression.
export const O1_FACILITY_COST = 120_000
export const O1_FACILITY_BONUS = 8
export const O1_FACILITY_COMMUNITY_COST = -6
export const O1_YOUTH_DEVELOPMENT_COST = -8
export const O1_SUPPORTER_LETTER_COST = 25_000
export const O1_SUPPORTER_MOOD_GAIN = 8
export const O1_SUPPORTER_MOOD_LOSS = -6
export const O1_FACILITY_SEASON_CHANCE = 0.25
export const O1_SUPPORTER_LETTER_SEASON_CHANCE = 0.25

/**
 * "Fyrar sällan" är en save- och säsongsseedad grind, inte ett nytt kast varje
 * omgång i triggerfönstret. Samma karriär+säsong ger därför samma besked även
 * om generatorn anropas flera gånger eller en save laddas om.
 */
export function passesO1SeasonalEventRoll(
  game: Pick<SaveGame, 'id' | 'worldSeed' | 'managedClubId' | 'currentSeason'>,
  eventKey: 'facility_community' | 'supporter_letter',
  probability: number,
): boolean {
  return seasonalUnitRoll(game, eventKey, 'o1') < probability
}

function isKnown(game: SaveGame, id: string, alreadyQueued: Set<string>): boolean {
  return alreadyQueued.has(id) || (game.resolvedEventIds ?? []).includes(id)
}

/** O1 2/4 — a real choice against the existing generic facilities axis. */
export function generateFacilityCommunityCostEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const id = `event_o1_facility_community_s${game.currentSeason}`
  const politician = game.localPolitician
  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
  const facilityLevel = club?.facilities ?? 50
  const eligible = currentRound >= 7
    && currentRound <= 15
    && politician !== undefined
    && politician.relationship >= 45
    && club !== undefined
    && club.finances >= O1_FACILITY_COST
    && facilityLevel < 80
    && !game.facilityState?.activeProject
    && passesO1SeasonalEventRoll(game, 'facility_community', O1_FACILITY_SEASON_CHANCE)
    && !isKnown(game, id, alreadyQueued)
  if (!eligible || !politician || !club) return null

  const place = 'den gamla grusplanen bakom idrottsplatsen'
  return {
    id,
    type: 'politicianEvent',
    title: `${politician.name} har ett papper åt dig`,
    body: `Kommunen säger ja — ni får bygga ut, om ni vill. Men platsen är ${place}, och den betyder något för folk här. ${politician.name} lägger papperet på bordet utan att säga vad du ska göra. Klubben skulle vinna på det. Orten skulle minnas det.`,
    proofSource: {
      form: 'state-predicate',
      description: `kommunrelation ≥ 45, kassa ≥ ${O1_FACILITY_COST}, faciliteter < 80 och inget aktivt bygge`,
      evaluatedTrue: eligible,
    },
    choices: [
      {
        id: 'build_out',
        label: 'Bygg ut',
        subtitle: 'orten kyler',
        consequenceLevel: 'costly',
        costLabel: 'Kostar 120 tkr',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'income', amount: -O1_FACILITY_COST },
            { type: 'facilitiesUpgrade', amount: O1_FACILITY_BONUS },
            { type: 'communityStanding', amount: O1_FACILITY_COMMUNITY_COST },
          ]),
        },
      },
      { id: 'leave_it', label: 'Låt det vara', effect: { type: 'noOp' } },
    ],
    sender: { name: politician.name, role: `${politician.title}, kommunen` },
    mode: 'dilemma',
    systemhandelse: true,
    resolved: false,
  }
}

function pickYouthAtRisk(game: SaveGame): YouthPlayer | undefined {
  return [...(game.youthTeam?.players ?? [])]
    .filter(player => player.age === 17 && player.potentialAbility >= 70 && player.currentAbility >= 20)
    .sort((a, b) => b.potentialAbility - a.potentialAbility || b.currentAbility - a.currentAbility)[0]
}

/** O1 3/4 — the card freezes the exact P19 player; resolution promotes that same player. */
export function generateYouthBurnRiskEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const youth = pickYouthAtRisk(game)
  if (!youth) return null
  const id = `event_o1_youth_burn_${youth.id}_s${game.currentSeason}`
  const seniorPlayers = game.players.filter(player => player.clubId === game.managedClubId)
  const unavailable = seniorPlayers.filter(player =>
    player.isInjured || player.suspensionGamesRemaining > 0 || (player.restGamesRemaining ?? 0) > 0,
  ).length
  const available = seniorPlayers.length - unavailable
  const squadUnderPressure = unavailable >= 2 || available < 14
  const hasUpcomingMatch = game.fixtures.some(fixture =>
    fixture.status === 'scheduled'
      && (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
      && fixture.matchday >= currentRound
      && fixture.matchday <= currentRound + 1,
  )
  const eligible = squadUnderPressure && hasUpcomingMatch && !isKnown(game, id, alreadyQueued)
  if (!eligible) return null

  const name = `${youth.firstName} ${youth.lastName}`
  return {
    id,
    type: 'academyDecision',
    title: `${name} är redo. Nästan.`,
    body: `Sjuttonåringen tränar med de stora nu, och han håller. Akademitränaren säger att ett år till hade varit rätt — men laget behöver honom i helgen, och han vill inget hellre. Du kan kasta in honom. Frågan är vad det kostar honom sen.`,
    proofSource: {
      form: 'state-predicate',
      description: 'en namngiven 17-årig högpotentialjunior finns och seniortruppen är tunn inför nästa match',
      evaluatedTrue: eligible,
    },
    choices: [
      {
        id: 'throw_in',
        label: 'Kasta in honom',
        subtitle: `riskerar ${swedishGenitive(name)} utveckling`,
        effect: { type: 'developmentRateDelta', targetPlayerId: youth.id, amount: O1_YOUTH_DEVELOPMENT_COST },
      },
      { id: 'let_mature', label: 'Låt honom mogna', effect: { type: 'noOp' } },
    ],
    relatedPlayerId: youth.id,
    mode: 'dilemma',
    systemhandelse: true,
    resolved: false,
  }
}

/** O1 4/4 — the letter uses the already introduced supporter leader. */
export function generateSupporterLetterEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const group = game.supporterGroup
  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
  const id = `event_o1_supporter_letter_s${game.currentSeason}`
  const eligible = currentRound >= 10
    && currentRound <= 18
    && group !== undefined
    && group.mood >= 55
    && club !== undefined
    && club.finances >= O1_SUPPORTER_LETTER_COST
    && passesO1SeasonalEventRoll(game, 'supporter_letter', O1_SUPPORTER_LETTER_SEASON_CHANCE)
    && !isKnown(game, id, alreadyQueued)
  if (!eligible || !group || !club) return null

  const leader = group.leader.name
  const wish = 'sänk entrén för ungdomar resten av vintern'
  return {
    id,
    type: 'supporterEvent',
    title: 'Ett brev från läktaren',
    body: `${leader} har skrivit för hand, på klackens vägnar. Ingen vrede, bara en önskan: ${wish}. De vet att det kostar. De skriver ändå, för de tror att du är en av dem. Nu får du visa om de har rätt.`,
    proofSource: {
      form: 'state-predicate',
      description: `klackens mood ≥ 55 och klubben kan bära ${O1_SUPPORTER_LETTER_COST} kr`,
      evaluatedTrue: eligible,
    },
    choices: [
      {
        id: 'grant_wish',
        label: 'Ge dem det',
        subtitle: 'värmer klacken',
        consequenceLevel: 'costly',
        costLabel: 'Kostar 25 tkr',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'income', amount: -O1_SUPPORTER_LETTER_COST },
            { type: 'supporterMood', amount: O1_SUPPORTER_MOOD_GAIN },
          ]),
        },
      },
      {
        id: 'hold_line',
        label: 'Håll fast',
        subtitle: 'grumlar stämningen',
        effect: { type: 'supporterMood', amount: O1_SUPPORTER_MOOD_LOSS },
      },
    ],
    sender: { name: leader, role: 'Klackledare' },
    voiceId: klackLeaderVoiceId(game.managedClubId, leader),
    mode: 'dilemma',
    systemhandelse: true,
    resolved: false,
  }
}

export function generateO1SystemEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent[] {
  return [
    generateFacilityCommunityCostEvent(game, currentRound, alreadyQueued),
    generateYouthBurnRiskEvent(game, currentRound, alreadyQueued),
    generateSupporterLetterEvent(game, currentRound, alreadyQueued),
  ].filter((event): event is GameEvent => event !== null)
}
