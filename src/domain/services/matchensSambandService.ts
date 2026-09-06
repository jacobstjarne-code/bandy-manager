/**
 * SPEC_B12_GRANSKA_MATCHENS_SAMBAND_2026-09-04 — "MATCHENS SAMBAND"-kortet.
 * Ren konsument: läser fixture.events/report/lineup (B12-fälten, redan
 * skrivna av matchCore.ts), ingen ny motorlogik utom origin: 'TRANSITION'
 * (matchCore.ts, samma spec §4).
 *
 * §7: "Hellre ingen mening än falsk" — varje katalograd bygger sin text
 * EXAKT ur samma tal den citerar; ingen rad visas utan sitt bevis (§4).
 */
import type { Fixture, MatchEvent } from '../entities/Fixture'
import type { MatchWeather } from '../entities/Weather'
import { WeatherCondition } from '../enums'
import { getPositionFit } from '../utils/positionFit'
import { PlayerPosition } from '../enums'
import { FORMATIONS } from '../entities/Formation'
import type { Player } from '../entities/Player'
import {
  sambandTextA, sambandTextB, sambandTextC, sambandTextD, sambandTextE, sambandTextF,
  sambandTextG, sambandTextH, sambandTextISecondHalfChase, SAMBAND_TEXT_I_DERBY,
  sambandTextIHotHand, sambandTextIEqualizerMomentum, sambandTextJ, sambandTextKWithPotm,
} from '../data/matchensSambandText'

export type SambandRowKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K'

interface SambandCandidate {
  key: SambandRowKey
  text: string
  hasCost: boolean
  /** §5.3 — utvisningarna som denna rads kostnad citerar, om någon. Delas
   *  mellan A och C; en senare rad i katalogordning (C) får inte återanvända
   *  en resurs en tidigare rad (A) redan tog. */
  claimsSuspensions: boolean
  score: number
}

function weatherLabel(condition: WeatherCondition | undefined): 'snö' | 'dimma' | 'töväder' | null {
  if (condition === WeatherCondition.LightSnow || condition === WeatherCondition.HeavySnow) return 'snö'
  if (condition === WeatherCondition.Fog) return 'dimma'
  if (condition === WeatherCondition.Thaw) return 'töväder'
  return null
}

function hasFactor(events: MatchEvent[], factor: string): boolean {
  return events.some(e => e.tacticalFactors?.includes(factor))
}

function hasContributingFactor(events: MatchEvent[], factor: string): boolean {
  return events.some(e => e.contributingFactors?.includes(factor))
}

/**
 * Point J (§4J) — samma bedömning som Truppens grönt/gult/rött
 * (`domain/utils/positionFit.ts`), INTE en ny skala. Kanon §2: en halv
 * spelad som mittfältare räknas INTE som utanför position (dubbelrollen).
 */
function isOutOfNaturalPosition(playerPosition: PlayerPosition, slotPosition: PlayerPosition): boolean {
  if (playerPosition === PlayerPosition.Half && slotPosition === PlayerPosition.Midfielder) return false
  return getPositionFit(playerPosition, slotPosition) !== 1
}

export interface MatchensSambandInput {
  fixture: Fixture
  managedClubId: string
  weather?: MatchWeather
  players: Player[]
}

/**
 * §5 — urvalsregeln. Bygger alla kandidater A–J med bevis, poängsätter,
 * löser dubbelräkningen (A tar utvisningarna före C), väljer topp 3,
 * balanserar förlust/segerraden, faller tillbaka på K eller inget kort.
 * Returnerar högst 3 rader, eller null (inget kort, §5.6).
 */
export function selectMatchensSamband(input: MatchensSambandInput): string[] | null {
  const { fixture, managedClubId, weather, players } = input
  const report = fixture.report
  if (!report) return null

  const isHome = fixture.homeClubId === managedClubId
  const theirClubId = isHome ? fixture.awayClubId : fixture.homeClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const won = myScore > theirScore
  const lost = myScore < theirScore

  const ourEvents = fixture.events.filter(e => e.clubId === managedClubId)
  const theirEvents = fixture.events.filter(e => e.clubId === theirClubId)
  const ourGoals = ourEvents.filter(e => e.type === ('goal' as MatchEvent['type']))
  const theirGoals = theirEvents.filter(e => e.type === ('goal' as MatchEvent['type']))
  const ourSuspensions = ourEvents.filter(e => e.type === ('redCard' as MatchEvent['type']))

  const myShots = isHome ? report.shotsHome : report.shotsAway
  const theirShots = isHome ? report.shotsAway : report.shotsHome
  const myCorners = isHome ? report.cornersHome : report.cornersAway

  const candidates: SambandCandidate[] = []

  // ── A. 5-2-3 (DOM_FORMATIONER_V2_2026-09-04 §"Ändras INTE": press_high →
  //     formation_523; FORMATIONER_V2_TEXT_2026-09-04.md rättar texten). ──
  if (hasFactor(ourEvents, 'formation_523')) {
    const transitionGoals = ourGoals.filter(e => e.origin === 'TRANSITION').length
    const theirGoalsWhileWeUndermanned = theirGoals.filter(e => (e.manpowerState?.opponentSuspended ?? 0) > 0).length
    const hasBenefit = transitionGoals >= 1
    const hasCost = ourSuspensions.length >= 2 || theirGoalsWhileWeUndermanned >= 1
    if (hasBenefit || hasCost) {
      candidates.push({
        key: 'A',
        text: sambandTextA(transitionGoals, ourSuspensions.length, theirGoalsWhileWeUndermanned),
        hasCost,
        claimsSuspensions: hasCost,
        score: transitionGoals * 2 + (hasCost ? ourSuspensions.length * 2 : 0),
      })
    }
  }

  // ── B. Högt tempo. Kostnaden citerar ALLTID "insläppta efter 70:e" i den
  //     låsta texten — bevisets utvisnings-alternativ ("ELLER utvisningar
  //     ≥2") skulle ge en text som talar om noll efter-70-mål; textkontraktet
  //     vinner (§7, "hellre ingen mening än falsk") — bevisas bara via
  //     efter-70-insläppta, en medveten inskränkning av §4B:s "eller". ──
  if (hasFactor(ourEvents, 'tempo_high')) {
    const lateConceded = theirGoals.filter(e => e.minute >= 70).length
    const hasBenefit = myShots >= theirShots + 5 || myCorners >= 8
    const hasCost = lateConceded >= 2
    if (hasBenefit || hasCost) {
      candidates.push({
        key: 'B',
        text: sambandTextB(myShots, theirShots, lateConceded, myCorners),
        hasCost,
        claimsSuspensions: false,
        score: myShots * 0.3 + myCorners * 0.5 + (hasCost ? lateConceded * 2 : 0),
      })
    }
  }

  // ── C. Aggressiva hörnor. §5.3: om A redan tagit utvisningarna visas C
  //     bara med nytta (eller inte alls) — dubbelräkning löses efter att alla
  //     kandidater är byggda, se nedan. ──
  if (hasFactor(ourEvents, 'cornerStrategy_aggressive')) {
    const cornerGoals = ourGoals.filter(e => e.isCornerGoal).length
    const hasBenefit = cornerGoals >= 1
    const hasCostRaw = ourSuspensions.length >= 2
    if (hasBenefit || hasCostRaw) {
      candidates.push({
        key: 'C',
        text: sambandTextC(cornerGoals, myCorners, hasCostRaw ? ourSuspensions.length : 0),
        hasCost: hasCostRaw,
        claimsSuspensions: hasCostRaw,
        score: cornerGoals * 2 + (hasCostRaw ? ourSuspensions.length * 2 : 0),
      })
    }
  }

  // ── D. Brett spel. ──
  if (hasFactor(ourEvents, 'width_wide')) {
    const concededOpenPlay = theirGoals.filter(e => e.origin === 'OPEN_PLAY').length
    const hasBenefit = myCorners >= 8
    const hasCost = concededOpenPlay >= 3
    if (hasBenefit || hasCost) {
      candidates.push({
        key: 'D',
        text: sambandTextD(myCorners, concededOpenPlay),
        hasCost,
        claimsSuspensions: false,
        score: myCorners * 0.5 + (hasCost ? concededOpenPlay * 2 : 0),
      })
    }
  }

  // ── E. Direkt spel. Mekaniskt bevis (väder) kräver inget utfall — fast
  //     poäng 3 (§5.2). ──
  if (hasFactor(ourEvents, 'passingRisk_direct')) {
    const weatherLbl = weatherLabel(weather?.weather.condition)
    const weatherHit = weatherLbl !== null && hasContributingFactor(ourEvents, 'weather')
    const hasBenefit = myShots >= theirShots + 5
    if (weatherHit || hasBenefit) {
      candidates.push({
        key: 'E',
        text: sambandTextE(weatherHit ? weatherLbl : null, myShots, theirShots),
        hasCost: weatherHit,
        claimsSuspensions: false,
        score: weatherHit ? 3 : myShots * 0.3,
      })
    }
  }

  // ── F. Offensiv mentalitet. ──
  if (hasFactor(ourEvents, 'mentality_offensive')) {
    const goals = myScore
    const conceded = theirScore
    const hasBenefit = goals >= 3
    const hasCost = conceded >= 3
    // §4F bevis: (goals≥3 && conceded≥3) || (goals≥3 && conceded<=1) || (goals<=1 && conceded>=3)
    const bevis = (hasBenefit && hasCost) || (hasBenefit && conceded <= 1) || (goals <= 1 && hasCost)
    if (bevis) {
      candidates.push({
        key: 'F',
        text: sambandTextF(goals, conceded),
        hasCost,
        claimsSuspensions: false,
        score: goals * 2 + (hasCost ? conceded * 2 : 0),
      })
    }
  }

  // ── G. Numerärt — oberoende av taktikval. ──
  {
    const overNumberGoals = ourGoals.filter(e => (e.manpowerState?.opponentSuspended ?? 0) > 0).length
    const underNumberConceded = theirGoals.filter(e => (e.manpowerState?.opponentSuspended ?? 0) > 0).length
    if (overNumberGoals >= 1 || underNumberConceded >= 1) {
      candidates.push({
        key: 'G',
        text: sambandTextG(overNumberGoals, underNumberConceded),
        hasCost: underNumberConceded > 0,
        claimsSuspensions: false,
        score: overNumberGoals * 2 + underNumberConceded * 2,
      })
    }
  }

  // ── H. Pausändringen — prioriteras alltid in (§5.5) om den finns. ──
  const halftimeChange = report.managerChoiceLog?.find(c => c.type === 'halftime_tactic' || c.type === 'pep_talk')
  let hRow: SambandCandidate | null = null
  if (halftimeChange) {
    const firstHalfGoals = ourGoals.filter(e => e.minute < 45).length
    const firstHalfConceded = theirGoals.filter(e => e.minute < 45).length
    const secondHalfGoals = ourGoals.filter(e => e.minute >= 45).length
    const secondHalfConceded = theirGoals.filter(e => e.minute >= 45).length
    hRow = {
      key: 'H',
      text: sambandTextH(halftimeChange.detail, firstHalfGoals, firstHalfConceded, secondHalfGoals, secondHalfConceded),
      hasCost: secondHalfConceded > firstHalfConceded,
      claimsSuspensions: false,
      score: 1000, // §5.5: prioriteras alltid in — poängen behöver bara slå K.
    }
  }

  // ── I. Motorförhållanden — en rad högst. ──
  {
    const secondHalfMode = hasContributingFactor(ourEvents, 'second_half_mode')
    const wasBehindAtHalftime = ourGoals.filter(e => e.minute < 45).length < theirGoals.filter(e => e.minute < 45).length
    if (secondHalfMode && wasBehindAtHalftime) {
      const secondHalfGoals = ourGoals.filter(e => e.minute >= 45).length
      const secondHalfConceded = theirGoals.filter(e => e.minute >= 45).length
      candidates.push({
        key: 'I', text: sambandTextISecondHalfChase(secondHalfGoals, secondHalfConceded),
        hasCost: false, claimsSuspensions: false, score: secondHalfGoals * 2,
      })
    } else if (hasContributingFactor(ourEvents, 'derby')) {
      candidates.push({ key: 'I', text: SAMBAND_TEXT_I_DERBY, hasCost: false, claimsSuspensions: false, score: 1 })
    } else if (hasContributingFactor(ourEvents, 'hot_hand')) {
      const ourGoalMinutes = ourGoals.map(e => e.minute).sort((a, b) => a - b)
      let burst: { n: number; span: number } | null = null
      for (let i = 0; i < ourGoalMinutes.length; i++) {
        for (let j = i + 1; j < ourGoalMinutes.length; j++) {
          const span = ourGoalMinutes[j] - ourGoalMinutes[i]
          if (j - i + 1 >= 2 && span <= 6) burst = { n: j - i + 1, span }
        }
      }
      if (burst) candidates.push({ key: 'I', text: sambandTextIHotHand(burst.n, burst.span), hasCost: false, claimsSuspensions: false, score: burst.n * 2 })
    } else if (hasContributingFactor(ourEvents, 'equalizer_momentum')) {
      const equalizerMinute = theirGoals.find(e => ourGoals.some(g => g.minute < e.minute))?.minute
      const nextOurGoal = equalizerMinute !== undefined ? ourGoals.find(g => g.minute > equalizerMinute) : undefined
      if (equalizerMinute !== undefined && nextOurGoal && nextOurGoal.minute - equalizerMinute <= 6) {
        candidates.push({ key: 'I', text: sambandTextIEqualizerMomentum(nextOurGoal.minute - equalizerMinute), hasCost: false, claimsSuspensions: false, score: 2 })
      }
    }
  }

  // ── J. Positionspassning — ur lineup + betyg, inte B12. ──
  {
    const lineup = isHome ? fixture.homeLineup : fixture.awayLineup
    const formation = lineup?.tactic.formation
    const lineupSlots = lineup?.tactic.lineupSlots
    if (formation && lineupSlots && report.playerRatings) {
      const slots = FORMATIONS[formation].slots
      const outOfPosition: { playerId: string; rating: number }[] = []
      const inPosition: { playerId: string; rating: number }[] = []
      for (const slot of slots) {
        const playerId = lineupSlots[slot.id]
        if (!playerId) continue
        const player = players.find(p => p.id === playerId)
        if (!player) continue
        const rating = report.playerRatings[playerId]
        if (rating === undefined) continue
        if (isOutOfNaturalPosition(player.position, slot.position)) outOfPosition.push({ playerId, rating })
        else inPosition.push({ playerId, rating })
      }
      if (outOfPosition.length >= 2 && inPosition.length > 0) {
        const avgOut = outOfPosition.reduce((s, p) => s + p.rating, 0) / outOfPosition.length
        const avgIn = inPosition.reduce((s, p) => s + p.rating, 0) / inPosition.length
        if (avgIn - avgOut >= 0.6) {
          candidates.push({
            key: 'J', text: sambandTextJ(outOfPosition.length, avgOut, avgIn),
            hasCost: true, claimsSuspensions: false, score: outOfPosition.length * 2,
          })
        }
      }
    }
  }

  // §5.3 — dubbelräkning: A tar utvisningarna före C (katalogordning).
  const aClaimedSuspensions = candidates.some(c => c.key === 'A' && c.claimsSuspensions)
  const resolvedCandidates = candidates
    .map(c => {
      if (c.key === 'C' && aClaimedSuspensions && c.claimsSuspensions) {
        const cornerGoals = ourGoals.filter(e => e.isCornerGoal).length
        if (cornerGoals === 0) return null // ingen nytta kvar utan kostnaden — släpp raden
        return { ...c, text: sambandTextC(cornerGoals, myCorners, 0), hasCost: false, score: cornerGoals * 2 }
      }
      return c
    })
    .filter((c): c is SambandCandidate => c !== null)

  // §5.4 — topp 3, med förlust-/segerbalans.
  let selected = [...resolvedCandidates].sort((a, b) => b.score - a.score).slice(0, 3)
  if (lost && selected.length > 0 && !selected.some(c => c.hasCost)) {
    const strongestCost = [...resolvedCandidates].filter(c => c.hasCost && !selected.includes(c)).sort((a, b) => b.score - a.score)[0]
    if (strongestCost) {
      selected = [...selected.slice(0, selected.length - 1), strongestCost]
    }
  } else if (won && selected.length > 0 && selected.every(c => c.hasCost)) {
    const strongestBenefit = [...resolvedCandidates].filter(c => !c.hasCost && !selected.includes(c)).sort((a, b) => b.score - a.score)[0]
    if (strongestBenefit) {
      selected = [...selected.slice(0, selected.length - 1), strongestBenefit]
    }
  }

  // §5.5 — H prioriteras alltid in om den finns.
  if (hRow && !selected.some(c => c.key === 'H')) {
    selected = selected.length >= 3 ? [...selected.slice(0, 2), hRow] : [...selected, hRow]
  }

  if (selected.length >= 1) return selected.map(c => c.text)

  // §5.6 — under 1 kandidat: K. Under 1 och inget potm: inget kort.
  const iCandidate = resolvedCandidates.find(c => c.key === 'I')
  if (iCandidate) return [iCandidate.text]
  const potmPlayer = report.playerOfTheMatchId ? players.find(p => p.id === report.playerOfTheMatchId) : undefined
  if (potmPlayer) return [sambandTextKWithPotm(`${potmPlayer.firstName} ${potmPlayer.lastName}`)]
  return null
}
