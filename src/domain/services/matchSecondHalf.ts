import type { Player } from '../entities/Player'
import type { MatchEvent } from '../entities/Fixture'
import { MatchEventType, PlayerPosition, PlayerArchetype, WeatherCondition } from '../enums'
import { evaluateSquad } from './squadEvaluator'
import { getTacticModifiers } from './tacticModifiers'
import { mulberry32 } from '../utils/random'
import { commentary, fillTemplate, pickCommentary } from '../data/matchCommentary'
import {
  clamp, randRange, weightedPick, pickWeightedPlayer,
  SEQUENCE_TYPES, computeWeatherEffects, computeWeatherTacticInteraction,
  simulatePenalties, pickGoalCommentary,
} from './matchUtils'
import type { MatchStep, SecondHalfInput } from './matchUtils'
import type { CounterInteractionData } from './counterAttackInteractionService'
import type { FreeKickInteractionData } from './freeKickInteractionService'
import type { LastMinutePressData } from './lastMinutePressService'

// Regenerate just steps 30-60 (second half) with possibly updated tactic.
// Used when player changes tactic at halftime.
export function* simulateSecondHalf(input: SecondHalfInput): Generator<MatchStep> {
  const {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage = 0.05,
    seed,
    weather,
    homeClubName,
    awayClubName,
    isPlayoff = false,
    rivalry,
    fanMood,
    managedIsHome,
  } = input
  const captainPlayerId = input.captainPlayerId
  const fanFavoritePlayerId = input.fanFavoritePlayerId
  const supporterCtx = input.supporterContext
  const {
    initialHomeScore,
    initialAwayScore,
    initialShotsHome,
    initialShotsAway,
    initialCornersHome,
    initialCornersAway,
    initialHomeSuspensions,
    initialAwaySuspensions,
    substitutions,
  } = input

  // Use a different seed offset so second half differs from first
  const rand = mulberry32((seed ?? Date.now()) + 31337)

  const homeStarters = homeLineup.startingPlayerIds
    .map(id => homePlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined)
  const awayStarters = awayLineup.startingPlayerIds
    .map(id => awayPlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined)

  const homeEval = evaluateSquad(homeStarters, homeLineup.tactic)
  const awayEval = evaluateSquad(awayStarters, awayLineup.tactic)
  const homeMods = getTacticModifiers(homeLineup.tactic)
  const awayMods = getTacticModifiers(awayLineup.tactic)

  let homeAttack = (homeEval.offenseScore * homeMods.offenseModifier) / 100
  const homeDefense = (homeEval.defenseScore * homeMods.defenseModifier) / 100
  const homeCorner = (homeEval.cornerScore * homeMods.cornerModifier) / 100
  const homeGK = homeEval.goalkeeperScore / 100
  const homeDisciplineRisk = (homeEval.disciplineRisk * homeMods.disciplineModifier) / 100

  let awayAttack = (awayEval.offenseScore * awayMods.offenseModifier) / 100
  const awayDefense = (awayEval.defenseScore * awayMods.defenseModifier) / 100
  const awayCorner = (awayEval.cornerScore * awayMods.cornerModifier) / 100
  const awayGK = awayEval.goalkeeperScore / 100
  const awayDisciplineRisk = (awayEval.disciplineRisk * awayMods.disciplineModifier) / 100

  let weatherGoalMod = 1.0
  if (weather && weather.condition !== undefined) {
    const { ballControlPenalty, speedModifier, goalChanceModifier } = computeWeatherEffects(weather)
    const homeTW = computeWeatherTacticInteraction(weather, homeLineup.tactic)
    const awayTW = computeWeatherTacticInteraction(weather, awayLineup.tactic)
    homeAttack *= (1 - (ballControlPenalty + homeTW.extraBallControlPenalty) / 200) * speedModifier
    awayAttack *= (1 - (ballControlPenalty + awayTW.extraBallControlPenalty) / 200) * speedModifier
    weatherGoalMod = goalChanceModifier
  }

  if (isPlayoff) {
    homeAttack = clamp(homeAttack + (homeAttack - awayAttack) * 0.1, 0, 1)
  }

  let derbyFoulMult = 1.0
  let derbyChanceMult = 0.0
  let effectiveHomeAdvantage = fixture.isNeutralVenue ? 0 : homeAdvantage
  if (!fixture.isNeutralVenue && fanMood !== undefined && managedIsHome) {
    effectiveHomeAdvantage *= 1 + ((fanMood - 50) / 100) * 0.06
  }
  if (rivalry) {
    const avg = (homeAttack + awayAttack) / 2
    homeAttack = avg + (homeAttack - avg) * 0.7
    awayAttack = avg + (awayAttack - avg) * 0.7
    derbyFoulMult = 1 + rivalry.intensity * 0.15
    derbyChanceMult = 0.05
    if (!fixture.isNeutralVenue) {
      effectiveHomeAdvantage = homeAdvantage * (1 + rivalry.intensity * 0.1)
    }
  }

  const homeTeamRef = homeClubName ?? fixture.homeClubId
  const awayTeamRef = awayClubName ?? fixture.awayClubId
  const allPlayers = [...homePlayers, ...awayPlayers]
  function findName(id: string): string {
    const p = allPlayers.find(pl => pl.id === id)
    return p ? `${p.firstName} ${p.lastName}` : id
  }

  const playerGoals: Record<string, number> = {}
  const playerAssists: Record<string, number> = {}
  function trackGoal(id: string) { playerGoals[id] = (playerGoals[id] ?? 0) + 1 }
  function trackAssist(id: string) { playerAssists[id] = (playerAssists[id] ?? 0) + 1 }
  void playerGoals; void playerAssists

  function getGoalScorer(starters: Player[]): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    if (nonGK.length === 0) return undefined
    const weights = nonGK.map(p => {
      let w = p.position === PlayerPosition.Forward ? 3 :
        p.position === PlayerPosition.Midfielder ? 2 :
        p.position === PlayerPosition.Half ? 1 : 0.5
      if (p.isCharacterPlayer) {
        if (p.trait === 'hungrig') w *= 1.4
        else if (p.trait === 'veteran') w *= 1.2
        else if (p.trait === 'lokal') w *= 1.2
        else if (p.trait === 'ledare') w *= 1.1
        else if (p.trait === 'joker') w *= rand() < 0.3 ? 2.8 : 0.6
      }
      return w
    })
    return pickWeightedPlayer(rand, nonGK, weights)
  }
  function getAssistProvider(starters: Player[], excludeId?: string): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper && p.id !== excludeId)
    if (nonGK.length === 0) return undefined
    const weights = nonGK.map(p =>
      p.position === PlayerPosition.Midfielder ? 2 :
      p.position === PlayerPosition.Half ? 2 :
      p.position === PlayerPosition.Defender ? 1 : 1.5
    )
    return pickWeightedPlayer(rand, nonGK, weights)
  }
  function getGK(starters: Player[]): Player | undefined {
    return starters.find(p => p.position === PlayerPosition.Goalkeeper)
  }
  function getDefendingPlayer(starters: Player[]): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    return nonGK.length > 0 ? nonGK[Math.floor(rand() * nonGK.length)] : undefined
  }

  function buildSHWeights(isHome: boolean, step: number): number[] {
    const tactic = isHome ? homeLineup.tactic : awayLineup.tactic
    let wA = 40, wT = 15, wC = 40, wH = 10, wF = 12, wL = 8  // wC calibrated to 8.83 corners/team/match
    let wTacticalShift = 4, wPlayerDuel = 6, wAtmosphere = 5, wOffside = 4, wFreekick = 5
    if (tactic.tempo === 'high') { wA += 5; wC += 3; wF += 2 }
    else if (tactic.tempo === 'low') { wA -= 5; wL += 5 }
    if (tactic.press === 'high') { wF += 5; wT += 3 }
    if (tactic.width === 'wide') wC += 5
    if (tactic.cornerStrategy === 'aggressive') wC += 3
    if (tactic.passingRisk === 'direct') { wL += 5; wA += 3; wH -= 3 }
    if (tactic.mentality === 'offensive') { wA += 5; wH += 3 }
    // Late game: more atmosphere in final minutes
    if (step > 55) wAtmosphere += 4
    if (step >= 45 && step <= 50) wTacticalShift += 3
    wOffside += 2  // second half has more offside pressure
    return [Math.max(1,wA), Math.max(1,wT), Math.max(1,wC), Math.max(1,wH), Math.max(1,wF), Math.max(1,wL),
            Math.max(1,wTacticalShift), Math.max(1,wPlayerDuel), Math.max(1,wAtmosphere), Math.max(1,wOffside), Math.max(1,wFreekick)]
  }

  let homeScore = initialHomeScore
  let awayScore = initialAwayScore
  let shotsHome = initialShotsHome
  let shotsAway = initialShotsAway
  let cornersHome = initialCornersHome
  let cornersAway = initialCornersAway
  let homeActiveSuspensions = initialHomeSuspensions
  let awayActiveSuspensions = initialAwaySuspensions
  const homeSuspensionTimers: number[] = []
  const awaySuspensionTimers: number[] = []
  const allEvents: MatchEvent[] = []

  // Emit substitution commentary events at the start of the second half (step 31)
  const subEvents: MatchEvent[] = []
  if (substitutions && substitutions.length > 0) {
    const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
    for (const sub of substitutions) {
      const inName = findName(sub.inId)
      const outName = findName(sub.outId)
      subEvents.push({
        type: MatchEventType.Substitution,
        clubId: managedClubId,
        playerId: sub.inId,
        secondaryPlayerId: sub.outId,
        minute: 45,
        description: `🔄 ${inName} IN för ${outName}`,
      })
    }
  }

  let interactiveCountersUsed = 0
  let interactiveFreeKicksUsed = 0
  let lastMinutePressTriggered = false

  for (let step = 31; step < 60; step++) {
    const minute = Math.round(step * 1.5)
    const stepEvents: MatchEvent[] = step === 31 ? [...subEvents] : []

    let stepGoalMod = weatherGoalMod
    if (weather && step > 30) {
      const base = 0.03
      const snowExtra = weather.condition === WeatherCondition.HeavySnow ? 0.02 : 0
      const thawExtra = weather.condition === WeatherCondition.Thaw ? 0.03 : 0
      const deg = (base + snowExtra + thawExtra) * (step - 30) * 0.5
      stepGoalMod = Math.max(0.60, weatherGoalMod - deg / 100)
    }

    for (let i = homeSuspensionTimers.length - 1; i >= 0; i--) {
      homeSuspensionTimers[i]--
      if (homeSuspensionTimers[i] <= 0) { homeSuspensionTimers.splice(i, 1); homeActiveSuspensions = Math.max(0, homeActiveSuspensions - 1) }
    }
    for (let i = awaySuspensionTimers.length - 1; i >= 0; i--) {
      awaySuspensionTimers[i]--
      if (awaySuspensionTimers[i] <= 0) { awaySuspensionTimers.splice(i, 1); awayActiveSuspensions = Math.max(0, awayActiveSuspensions - 1) }
    }

    const homePF = homeActiveSuspensions > 0 ? 0.75 : 1.0
    const awayPF = awayActiveSuspensions > 0 ? 0.75 : 1.0
    const hw = homeAttack * (1 + homeMods.pressModifier * 0.2) * (1 + effectiveHomeAdvantage) * homePF
    const aw = awayAttack * (1 + awayMods.pressModifier * 0.2) * awayPF
    const isHomeAttacking = rand() < hw / (hw + aw)

    const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
    const defendingStarters = isHomeAttacking ? awayStarters : homeStarters
    const attackingClubId = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
    const defendingClubId = isHomeAttacking ? fixture.awayClubId : fixture.homeClubId

    const attAttack = isHomeAttacking ? homeAttack : awayAttack
    const defDefense = isHomeAttacking ? awayDefense : homeDefense
    const defGK = isHomeAttacking ? awayGK : homeGK
    const attCorner = isHomeAttacking ? homeCorner : awayCorner
    const attDiscipline = isHomeAttacking ? homeDisciplineRisk : awayDisciplineRisk
    const defDiscipline = isHomeAttacking ? awayDisciplineRisk : homeDisciplineRisk

    const seqWeights = buildSHWeights(isHomeAttacking, step)
    const seqIdx = weightedPick(rand, seqWeights)
    const seqType = SEQUENCE_TYPES[seqIdx]

    let goalScored = false
    let cornerGoalScored = false
    let saveOccurred = false
    let suspensionOccurred = false
    let cornerOccurred = false
    let scorerPlayerId: string | undefined
    let gkPlayerId: string | undefined
    let suspendedPlayerId: string | undefined
    let stepCounterData: CounterInteractionData | undefined
    let stepFreeKickData: FreeKickInteractionData | undefined

    if (seqType === 'attack') {
      const base = attAttack * 0.6 - defDefense * 0.4 + randRange(rand, -0.2, 0.2)
      const cq = clamp(base * 1.2 + 0.15 + 0.15 + derbyChanceMult, 0.05, 0.95)
      if (cq > 0.10) {
        if (isHomeAttacking) shotsHome++; else shotsAway++
        const r = rand()
        const gt = cq * 0.45 * (1 - defGK * 0.35) * stepGoalMod
        if (r < gt) {
          const scorer = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)
          if (scorer) {
            if (isHomeAttacking) homeScore++; else awayScore++
            scorerPlayerId = scorer.id; goalScored = true; trackGoal(scorer.id)
            const e: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Mål av ${scorer.firstName} ${scorer.lastName}` }
            stepEvents.push(e); allEvents.push(e)
            if (assister) { trackAssist(assister.id); const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, secondaryPlayerId: scorer.id, description: `Assist av ${assister.firstName} ${assister.lastName}` }; stepEvents.push(ae); allEvents.push(ae) }
          }
        } else if (r < gt + 0.25) {
          const gk = getGK(defendingStarters)
          if (gk) { gkPlayerId = gk.id; saveOccurred = true; const e: MatchEvent = { minute, type: MatchEventType.Save, clubId: defendingClubId, playerId: gk.id, description: `Räddning av ${gk.firstName} ${gk.lastName}` }; stepEvents.push(e); allEvents.push(e) }
        } else if (r < gt + 0.45) {
          cornerOccurred = true
          if (isHomeAttacking) cornersHome++; else cornersAway++
          const e: MatchEvent = { minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnslag' }; stepEvents.push(e); allEvents.push(e)
        }
      }
    } else if (seqType === 'transition') {
      const isManagedTransition = managedIsHome !== undefined && (managedIsHome === isHomeAttacking)
      if (isManagedTransition && interactiveCountersUsed < 2 && rand() < 0.20) {
        const runner = attackingStarters
          .filter(p => p.position !== PlayerPosition.Goalkeeper)
          .sort((a, b) => b.attributes.skating - a.attributes.skating)[0]
        const support = attackingStarters
          .filter(p => p.position !== PlayerPosition.Goalkeeper && p.id !== runner?.id)
          .sort((a, b) => b.attributes.passing - a.attributes.passing)[0]
        if (runner && support) {
          interactiveCountersUsed++
          stepCounterData = {
            minute,
            runnerName: `${runner.firstName} ${runner.lastName}`,
            runnerId: runner.id,
            runnerSpeed: runner.attributes.skating,
            supportName: `${support.firstName} ${support.lastName}`,
            supportId: support.id,
            defendersBeat: (1 + Math.floor(rand() * 3)) as 1 | 2 | 3,
          }
        }
      }
      const cq = randRange(rand, 0.3, 0.7)
      if (cq > 0.05) {
        if (isHomeAttacking) shotsHome++; else shotsAway++
        const r = rand(); const gt = cq * 0.28 * (1 - defGK * 0.4) * 1.15 * stepGoalMod
        if (r < gt) {
          const scorer = getGoalScorer(attackingStarters); const assister = getAssistProvider(attackingStarters, scorer?.id)
          if (scorer) {
            if (isHomeAttacking) homeScore++; else awayScore++
            scorerPlayerId = scorer.id; goalScored = true; trackGoal(scorer.id)
            const e: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Omställningsmål av ${scorer.firstName} ${scorer.lastName}` }; stepEvents.push(e); allEvents.push(e)
            if (assister) { trackAssist(assister.id); const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, description: `Assist` }; stepEvents.push(ae); allEvents.push(ae) }
          }
        } else if (r < gt + 0.25) {
          const gk = getGK(defendingStarters)
          if (gk) { gkPlayerId = gk.id; saveOccurred = true; const e: MatchEvent = { minute, type: MatchEventType.Save, clubId: defendingClubId, playerId: gk.id, description: `Räddning av ${gk.firstName} ${gk.lastName}` }; stepEvents.push(e); allEvents.push(e) }
        }
      }
    } else if (seqType === 'corner') {
      if (isHomeAttacking) cornersHome++; else cornersAway++
      const specialist = attackingStarters.find(p => p.archetype === PlayerArchetype.CornerSpecialist)
      const sb = specialist ? (specialist.attributes.cornerSkill > 75 ? 0.25 : 0.15) : 0
      const cc = attCorner * 0.7 + randRange(rand, 0, 0.3) + sb
      const dr = defDefense * 0.5 + defGK * 0.3 + randRange(rand, 0, 0.2)
      const gt = clamp((cc - dr) * 0.25 * stepGoalMod + 0.08, 0.06, 0.18)
      const r = rand()
      if (r < gt) {
        const scorer = getGoalScorer(attackingStarters); const assister = getAssistProvider(attackingStarters, scorer?.id)
        if (scorer) {
          if (isHomeAttacking) homeScore++; else awayScore++
          scorerPlayerId = scorer.id; goalScored = true; cornerGoalScored = true; cornerOccurred = true; trackGoal(scorer.id)
          stepEvents.push({ minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnmål' })
          allEvents.push({ minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnmål' })
          const e: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Hörnmål av ${scorer.firstName} ${scorer.lastName}`, isCornerGoal: true }; stepEvents.push(e); allEvents.push(e)
          if (assister) { trackAssist(assister.id); const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, description: `Assist` }; stepEvents.push(ae); allEvents.push(ae) }
        }
      } else if (r < gt + 0.3) {
        cornerOccurred = true
        const e: MatchEvent = { minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnslag' }; stepEvents.push(e); allEvents.push(e)
      }
    } else if (seqType === 'halfchance') {
      if (isHomeAttacking) shotsHome++; else shotsAway++
      const cq = randRange(rand, 0.05, 0.25) * (isPlayoff ? 1.05 : 1.0)
      if (rand() < cq * 0.30 * stepGoalMod) {
        const scorer = getGoalScorer(attackingStarters)
        if (scorer) {
          if (isHomeAttacking) homeScore++; else awayScore++
          scorerPlayerId = scorer.id; goalScored = true; trackGoal(scorer.id)
          const e: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, description: `Halvchans` }; stepEvents.push(e); allEvents.push(e)
        }
      }
    } else if (seqType === 'foul') {
      const isAttackZoneFoul = rand() < 0.70
      if (isAttackZoneFoul && interactiveFreeKicksUsed < 1 && rand() < 0.15) {
        const isManagedAttacking = managedIsHome !== undefined ? (managedIsHome === isHomeAttacking) : false
        if (isManagedAttacking) {
          const kicker = attackingStarters
            .filter(p => p.position !== PlayerPosition.Goalkeeper)
            .sort((a, b) => (b.attributes.shooting + b.attributes.passing) - (a.attributes.shooting + a.attributes.passing))[0]
          if (kicker) {
            interactiveFreeKicksUsed++
            stepFreeKickData = {
              minute,
              kickerName: `${kicker.firstName} ${kicker.lastName}`,
              kickerId: kicker.id,
              kickerShooting: kicker.attributes.shooting,
              kickerPassing: kicker.attributes.passing,
              distanceMeters: 20 + Math.round(rand() * 8),
              wallSize: 3 + Math.round(rand() * 2),
            }
          }
        }
      }
      const fp = attDiscipline * 0.4 + defDiscipline * 0.3
      const r = rand()
      if (r < fp * 0.55 * (isPlayoff ? 1.2 : 1.0) * derbyFoulMult) {
        const sp = getDefendingPlayer(defendingStarters)
        if (sp) {
          suspendedPlayerId = sp.id; suspensionOccurred = true
          const dur = 3 + Math.floor(rand() * 4)
          if (isHomeAttacking) { awayActiveSuspensions++; awaySuspensionTimers.push(dur) } else { homeActiveSuspensions++; homeSuspensionTimers.push(dur) }
          const e: MatchEvent = { minute, type: MatchEventType.RedCard, clubId: defendingClubId, playerId: sp.id, description: `Utvisning av ${sp.firstName} ${sp.lastName}` }; stepEvents.push(e); allEvents.push(e)
        }
      }
    }

    const scoreStr = `${homeScore}–${awayScore}`
    const attackingTeam = isHomeAttacking ? homeTeamRef : awayTeamRef
    const defendingTeam = isHomeAttacking ? awayTeamRef : homeTeamRef
    const savingGK = gkPlayerId ? findName(gkPlayerId) : ''

    let commentaryText: string
    let isDerbyStep = false
    let tvars: Record<string, string> = { team: attackingTeam, opponent: defendingTeam, score: scoreStr, minute: String(minute), player: scorerPlayerId ? findName(scorerPlayerId) : '', goalkeeper: savingGK, rivalry: rivalry?.name ?? '', result: '' }

    if (cornerGoalScored && scorerPlayerId) {
      tvars = { ...tvars, player: findName(scorerPlayerId) }
      commentaryText = fillTemplate(pickCommentary(commentary.cornerGoal, rand), tvars)
    } else if (goalScored && scorerPlayerId) {
      tvars = { ...tvars, player: findName(scorerPlayerId) }
      if (rivalry && rand() < 0.40) { commentaryText = fillTemplate(pickCommentary(commentary.derby_goal, rand), { ...tvars, rivalry: rivalry.name }); isDerbyStep = true }
      else if (input.storylines && rand() < 0.30) {
        const scorerStories = input.storylines.filter(s => s.playerId === scorerPlayerId)
        const scorerName = findName(scorerPlayerId)
        const storylineCommentary: Record<string, string> = {
          rescued_from_unemployment: `MÅL! ${scorerName} — mannen som nästan förlorade allt. Nu gör han säsongens viktigaste mål!`,
          went_fulltime_pro: `MÅL! ${scorerName} har gått hela vägen från deltid till proffs — och levererar!`,
          returned_to_club: `MÅL! ${scorerName} — hemkomsten kunde inte ha börjat bättre!`,
          captain_rallied_team: `MÅL! Kaptenen visar vägen — ${scorerName} sätter den!`,
          gala_winner: `MÅL! Galafavoriten ${scorerName} fortsätter imponera!`,
          underdog_season: `MÅL! I underdogens säsong kliver ${scorerName} fram igen!`,
        }
        const matchedStory = scorerStories.find(s => storylineCommentary[s.type])
        if (matchedStory) { commentaryText = storylineCommentary[matchedStory.type] }
        else { const ss = isHomeAttacking ? homeScore : awayScore; const os = isHomeAttacking ? awayScore : homeScore; commentaryText = fillTemplate(pickGoalCommentary(ss, os, rand, minute), tvars) }
      } else if (rand() < 0.40) {
        // Contextual commentary (THE_BOMB 1.3)
        const scorerPlayer = allPlayers.find(p => p.id === scorerPlayerId)
        const scorerIsManaged = managedIsHome ? isHomeAttacking : !isHomeAttacking
        const scorerName = findName(scorerPlayerId)
        const currentMargin = Math.abs(homeScore - awayScore)
        let contextual: string | null = null
        if (scorerIsManaged && scorerPlayer?.promotedFromAcademy && scorerPlayer.age <= 22) {
          contextual = `MÅL! ${scorerName} — egenodlad talent! Akademin levererar när det gäller!`
        } else if (scorerIsManaged && captainPlayerId && scorerPlayerId === captainPlayerId) {
          contextual = `MÅL! Kaptenen kliver fram! Det är därför ${scorerName} bär bindeln!`
        } else if (scorerIsManaged && fanFavoritePlayerId && scorerPlayerId === fanFavoritePlayerId) {
          contextual = `MÅL! Klackfavoriten ${scorerName}! Hör hur läktaren skanderar!`
        } else if (scorerIsManaged && scorerPlayer?.dayJob && !scorerPlayer.isFullTimePro) {
          contextual = `MÅL! ${scorerName} — ${scorerPlayer.dayJob.title} på dagarna, målskytt på kvällarna!`
        } else if (scorerIsManaged && minute >= 80 && currentMargin <= 1) {
          contextual = `SLUTMINUTERNA! ${scorerName} slår till! Stämningen är ELEKTRISK!`
        }
        if (contextual) { commentaryText = contextual }
        else { const ss = isHomeAttacking ? homeScore : awayScore; const os = isHomeAttacking ? awayScore : homeScore; commentaryText = fillTemplate(pickGoalCommentary(ss, os, rand, minute), tvars) }
      }
      else { const ss = isHomeAttacking ? homeScore : awayScore; const os = isHomeAttacking ? awayScore : homeScore; commentaryText = fillTemplate(pickGoalCommentary(ss, os, rand, minute), tvars) }
      // Add late supporter commentary for tight matches
      if (supporterCtx && step >= 47 && Math.abs(homeScore - awayScore) <= 1) {
        const isManaged = managedIsHome ? homeScore >= awayScore : awayScore >= homeScore
        const supArr = isManaged ? commentary.supporter_late_home : commentary.supporter_late_silent
        const supVars = { ...tvars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
        if (rand() < 0.15) commentaryText += ' ' + fillTemplate(pickCommentary(supArr, rand), supVars)
      }
    } else if (saveOccurred && gkPlayerId) {
      tvars = { ...tvars, goalkeeper: findName(gkPlayerId) }
      commentaryText = fillTemplate(pickCommentary(commentary.save, rand), tvars)
    } else if (suspensionOccurred && suspendedPlayerId) {
      tvars = { ...tvars, player: findName(suspendedPlayerId) }
      commentaryText = fillTemplate(pickCommentary(commentary.suspension, rand), tvars)
    } else if (cornerOccurred && !goalScored) {
      commentaryText = fillTemplate(pickCommentary(commentary.corner, rand), tvars)
    } else if (seqType === 'tactical_shift') {
      commentaryText = fillTemplate(pickCommentary(commentary.tactical_shift, rand), tvars)
    } else if (seqType === 'player_duel') {
      const duelPlayer = getGoalScorer(attackingStarters)
      commentaryText = fillTemplate(pickCommentary(commentary.player_duel, rand), { ...tvars, player: duelPlayer ? findName(duelPlayer.id) : attackingTeam })
    } else if (seqType === 'atmosphere') {
      commentaryText = fillTemplate(pickCommentary(commentary.atmosphere, rand), tvars)
    } else if (seqType === 'offside_call') {
      const offsidePlayer = getGoalScorer(attackingStarters)
      commentaryText = fillTemplate(pickCommentary(commentary.offside_call, rand), { ...tvars, player: offsidePlayer ? findName(offsidePlayer.id) : attackingTeam })
    } else if (seqType === 'freekick_danger') {
      const fkPlayer = getGoalScorer(attackingStarters)
      commentaryText = fillTemplate(pickCommentary(commentary.freekick_danger, rand), { ...tvars, player: fkPlayer ? findName(fkPlayer.id) : attackingTeam })
    } else if (step === 31) {
      commentaryText = fillTemplate(pickCommentary(commentary.secondHalf, rand), tvars)
    } else {
      if (rivalry && step % 10 === 0 && rand() < 0.30) { commentaryText = fillTemplate(pickCommentary(commentary.derby_neutral, rand), { ...tvars, rivalry: rivalry.name }); isDerbyStep = true }
      else {
        const LATE_ONLY = [
          'Publiken suckar. Spelet har tappat tempo de senaste minuterna.',
          'Klockan tickar. Båda lagen verkar nöjda med att vänta ut varandra.',
          'Spelarna verkar spara lite på krafterna. Ingen vill ta onödiga risker.',
          'En stund av lugn innan nästa storm. {team} samlar sig.',
        ]
        const neutralPool = minute < 20
          ? commentary.neutral.filter(c => !LATE_ONLY.includes(c))
          : commentary.neutral
        commentaryText = fillTemplate(pickCommentary(neutralPool, rand), tvars)
      }
    }

    let intensity: 'low' | 'medium' | 'high' = goalScored || suspensionOccurred ? 'high' : saveOccurred || cornerOccurred ? 'medium' : 'low'
    // Late game: boost intensity when close or in final 7 minutes
    const scoreDiff = Math.abs(homeScore - awayScore)
    if (minute >= 83) {
      if (intensity === 'low') intensity = 'medium'
      if (scoreDiff <= 1) intensity = 'high'
    } else if (minute >= 70 && scoreDiff <= 1 && intensity === 'low') {
      intensity = 'medium'
    }

    // Last-minute press: trailing by 1, step >= 55, once per match
    let lastMinutePressData: LastMinutePressData | undefined
    if (!lastMinutePressTriggered && step >= 55 && managedIsHome !== undefined) {
      const managedGoalsNow = managedIsHome ? homeScore : awayScore
      const oppGoalsNow = managedIsHome ? awayScore : homeScore
      const diff = managedGoalsNow - oppGoalsNow
      if (diff === -1) {
        lastMinutePressTriggered = true
        const stepsLeft = 60 - step
        const managedStartersNow = managedIsHome ? homeStarters : awayStarters
        const avgFatigue = managedStartersNow.reduce((s, p) => s + (100 - p.morale), 0) / Math.max(1, managedStartersNow.length)
        lastMinutePressData = { minute, scoreDiff: diff, stepsLeft, fatigueLevel: Math.round(avgFatigue) }
      }
    }

    yield { step, minute, events: stepEvents, homeScore, awayScore, commentary: commentaryText, intensity, activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, isDerbyComment: isDerbyStep || undefined, phase: 'regular', counterInteractionData: stepCounterData, freeKickInteractionData: stepFreeKickData, lastMinutePressData }
  }

  // Full time
  const scoreStr = `${homeScore}–${awayScore}`
  const ftVars: Record<string, string> = { team: homeTeamRef, opponent: awayTeamRef, score: scoreStr, minute: '90', player: '', goalkeeper: '', rivalry: rivalry?.name ?? '', result: homeScore > awayScore ? 'en seger' : homeScore < awayScore ? 'ingenting' : 'en poäng' }
  const ftText = rivalry ? fillTemplate(pickCommentary(commentary.derby_fullTime, rand), { ...ftVars, rivalry: rivalry.name }) : fillTemplate(pickCommentary(commentary.fullTime, rand), ftVars)
  yield { step: 60, minute: 90, events: [], homeScore, awayScore, commentary: ftText, intensity: 'high', activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, phase: 'regular' }

  // Overtime + penalties if knockout and tied
  if (!fixture.isKnockout || homeScore !== awayScore) return

  yield { step: 61, minute: 90, events: [], homeScore, awayScore, commentary: pickCommentary(commentary.overtimeStart, rand), intensity: 'high', activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, phase: 'overtime' }

  const otGoalMod = weatherGoalMod * 0.85
  const otHA = homeAttack * 1.15
  const otAA = awayAttack * 1.15
  for (let step = 62; step < 82; step++) {
    const minute = 91 + Math.round((step - 62) * 1.5)
    const isHomeAttacking = rand() < (otHA * (1 + effectiveHomeAdvantage)) / (otHA * (1 + effectiveHomeAdvantage) + otAA)
    const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
    const attackingClubId = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
    const attAttack = isHomeAttacking ? otHA : otAA
    const defDefense = isHomeAttacking ? awayDefense : homeDefense
    const defGK = isHomeAttacking ? awayGK : homeGK
    const cq = clamp(attAttack * 0.5 - defDefense * 0.3 + randRange(rand, -0.15, 0.25), 0.05, 0.90)
    const gt = cq * 0.40 * (1 - defGK * 0.35) * otGoalMod
    let goalScored = false; let scorerPlayerId: string | undefined
    if (rand() < gt) {
      const scorer = getGoalScorer(attackingStarters); const assister = getAssistProvider(attackingStarters, scorer?.id)
      if (scorer) {
        if (isHomeAttacking) homeScore++; else awayScore++
        scorerPlayerId = scorer.id; goalScored = true; trackGoal(scorer.id)
        allEvents.push({ minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Förlängningsmål av ${scorer.firstName} ${scorer.lastName}` })
        if (assister) allEvents.push({ minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, description: 'Assist' })
      }
    }
    const attackingTeam = isHomeAttacking ? homeTeamRef : awayTeamRef
    const otScoreStr = `${homeScore}–${awayScore}`
    const commentaryText = goalScored && scorerPlayerId
      ? fillTemplate(pickCommentary(commentary.overtimeGoal, rand), { player: findName(scorerPlayerId), score: otScoreStr, team: attackingTeam, opponent: '', minute: String(minute), goalkeeper: '', rivalry: '', result: '' })
      : step === 81
        ? fillTemplate(pickCommentary(commentary.overtimeEnd, rand), { score: otScoreStr, team: '', opponent: '', minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
        : fillTemplate(pickCommentary(commentary.overtimeNoGoal, rand), { team: attackingTeam, opponent: '', score: otScoreStr, minute: String(minute), player: '', goalkeeper: '', rivalry: '', result: '' })

    yield { step, minute, events: goalScored && scorerPlayerId ? [{ minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorerPlayerId, description: `Förlängningsmål` }] : [], homeScore, awayScore, commentary: commentaryText, intensity: goalScored ? 'high' : 'medium', activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, phase: 'overtime', overtimeResult: goalScored ? (isHomeAttacking ? 'home' : 'away') : undefined }
    if (goalScored) { yield { step: 82, minute: 120, events: [], homeScore, awayScore, commentary: `Matchen avgörs i förlängningen! ${homeScore}–${awayScore}.`, intensity: 'high', activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, phase: 'overtime', overtimeResult: isHomeAttacking ? 'home' : 'away' }; return }
  }

  const homeGKPlayer = homeStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const awayGKPlayer = awayStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const { rounds: pr, homeGoals: ph, awayGoals: pa } = simulatePenalties(homeStarters, awayStarters, homeGKPlayer, awayGKPlayer, rand)
  yield { step: 83, minute: 120, events: [], homeScore, awayScore, commentary: pickCommentary(commentary.penaltyStart, rand), intensity: 'high', activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, phase: 'penalties' }
  let rh = 0, ra = 0
  for (const penRound of pr) {
    if (penRound.homeScored) rh++
    if (penRound.awayScored) ra++
    const isLast = penRound === pr[pr.length - 1]
    const penVars = { score: `${homeScore}–${awayScore}`, minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' }
    yield { step: 84 + penRound.round - 1, minute: 120, events: [], homeScore, awayScore, commentary: isLast ? (rh > ra ? fillTemplate(pickCommentary(commentary.penaltyWinHome, rand), { ...penVars, team: homeTeamRef, opponent: awayTeamRef, penHome: String(rh), penAway: String(ra) }) : fillTemplate(pickCommentary(commentary.penaltyWinAway, rand), { ...penVars, team: awayTeamRef, opponent: homeTeamRef, penHome: String(rh), penAway: String(ra) })) : `Omgång ${penRound.round}: ${penRound.homeShooterName} ${penRound.homeScored ? '✅' : '❌'} · ${penRound.awayShooterName} ${penRound.awayScored ? '✅' : '❌'} — ${rh}-${ra}`, intensity: isLast ? 'high' : 'medium', activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions }, shotsHome, shotsAway, cornersHome, cornersAway, phase: 'penalties', penaltyRound: penRound, penaltyHomeTotal: rh, penaltyAwayTotal: ra, penaltyDone: isLast, penaltyFinalResult: isLast ? { home: ph, away: pa } : undefined }
  }
}
