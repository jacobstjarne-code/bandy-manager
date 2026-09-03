import type { Fixture } from '../entities/Fixture'
import type { Player } from '../entities/Player'
import { storylineResolutionSignificance } from './storylineLedgerService'
import type { ClubLegend, StorylineEntry } from '../entities/Narrative'
import { FixtureStatus } from '../enums'
import { getRivalry } from '../data/rivalries'
import { getRoundLabel } from '../roundLabel'
import type { MemoryEvent, MemoryEventType } from './clubMemoryService'
import { deriveUtfall } from './matchTypeAxes'

// ── Fixture → MemoryEvent ────────────────────────────────────────────────────

export function buildEventFromFixture(
  fixture: Fixture,
  managedClubId: string,
): MemoryEvent | null {
  if (fixture.status !== FixtureStatus.Completed) return null

  const isHome = fixture.homeClubId === managedClubId
  const isAway = fixture.awayClubId === managedClubId
  if (!isHome && !isAway) return null

  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const margin = myScore - theirScore
  const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
  const utfall = deriveUtfall(fixture, managedClubId)
  const won = utfall === 'vunnet'
  const lost = utfall === 'forlorat'
  const decider = fixture.penaltyResult ? ' efter straffar' : fixture.overtimeResult ? ' efter förlängning' : ''

  const outcome: 'won' | 'lost' | 'neutral' = won ? 'won' : lost ? 'lost' : 'neutral'

  // HIGH 5 (2026-08-29): raden i klubbminnet visade `Omg {matchday}` — global
  // spelordning presenterad som ligaomgång, så ett derby i ligaomgång 4 stod
  // som "Omg 8" i årsboken. Etiketten stämplas nu vid byggtillfället.
  // Ingen playoffBracket här (byggaren tar bara fixture + klubb-id):
  // slutspelsmatcher blir "Slutspel" utan fas — sant, aldrig ett vilseledande
  // tal, och SM-finalen har ändå sin egen sm_final-typ med egen text.
  const roundLabel = getRoundLabel(fixture).long

  // SM-final
  if (fixture.isFinaldag) {
    const type: MemoryEventType = 'sm_final'
    const significance = won ? 95 : 85
    const text = won
      ? `SM-guld! Vann finalen${decider} ${myScore}–${theirScore}.`
      : `SM-finalförlust${decider} ${myScore}–${theirScore}. Silvermedalj.`
    return {
      type, season: fixture.season, matchday: fixture.matchday, roundLabel,
      text, emoji: won ? '🥇' : '🥈', significance,
      outcome,
      subjectClubId: opponentId,
    }
  }

  // Cup-final: only roundNumber === 4 is the actual final (round 3 = semi, falls through to big_win/loss)
  if (fixture.isCup && fixture.roundNumber === 4) {
    const type: MemoryEventType = 'cup_final'
    const significance = won ? 80 : 70
    const text = won
      ? `Cupfinalen vanns${decider} ${myScore}–${theirScore}. Cupen hemma!`
      : `Cupfinalen förlorades${decider} ${myScore}–${theirScore}.`
    return {
      type, season: fixture.season, matchday: fixture.matchday, roundLabel,
      text, emoji: won ? '🏆' : '🥈', significance,
      outcome,
      subjectClubId: opponentId,
    }
  }

  // Derby
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  if (rivalry) {
    if (won && margin >= 3) {
      return {
        type: 'derby_result', season: fixture.season, matchday: fixture.matchday, roundLabel,
        text: `Derby vunnet med ${margin} mål (${myScore}–${theirScore}) mot ${rivalry.name.split(' ')[0]}.`,
        emoji: '⚔️', significance: 55,
        outcome,
        subjectClubId: opponentId,
      }
    }
    if (lost) {
      return {
        type: 'derby_result', season: fixture.season, matchday: fixture.matchday, roundLabel,
        text: `Derbyförlust${decider} ${myScore}–${theirScore}.`,
        emoji: '⚔️', significance: 35,
        outcome,
        subjectClubId: opponentId,
      }
    }
    if (won && decider) {
      return {
        type: 'derby_result', season: fixture.season, matchday: fixture.matchday, roundLabel,
        text: `Derby vunnet${decider} ${myScore}–${theirScore}.`,
        emoji: '⚔️', significance: 45,
        outcome,
        subjectClubId: opponentId,
      }
    }
    return null
  }

  // Big win / big loss
  if (margin >= 4) {
    const sig = margin >= 6 ? 65 : 40
    return {
      type: 'big_win', season: fixture.season, matchday: fixture.matchday, roundLabel,
      text: `Storseger ${myScore}–${theirScore}.`,
      emoji: '💥', significance: sig,
      outcome,
      subjectClubId: opponentId,
    }
  }
  if (margin <= -4) {
    const sig = Math.abs(margin) >= 6 ? 55 : 30
    return {
      type: 'big_loss', season: fixture.season, matchday: fixture.matchday, roundLabel,
      text: `Storseger ${theirScore}–${myScore} mot oss.`,
      emoji: '📉', significance: sig,
      outcome,
      subjectClubId: opponentId,
    }
  }

  return null
}

// ── Player.diary → MemoryEvent ────────────────────────────────────────

type NarrativeEntry = NonNullable<Player['diary']>[number]

export function buildEventFromNarrativeLog(
  player: Player,
  entry: NarrativeEntry,
): MemoryEvent | null {
  if (entry.type === 'form' || entry.type === 'injury') return null

  let emoji = '👤'
  let significance = 35

  if (entry.type === 'milestone') {
    const text = entry.text.toLowerCase()
    if (text.includes('hattrick') || text.includes('3 mål')) {
      emoji = '🎩'
      significance = 35
    } else if (text.includes('100') || text.includes('hundra')) {
      emoji = '💯'
      significance = 60
    } else if (text.includes('debut') || text.includes('första mål') || text.includes('proffsdebut')) {
      emoji = '⭐'
      significance = 40
    }
  } else if (entry.type === 'transfer') {
    emoji = '🔄'
    significance = 35
  } else if (entry.type === 'storyline') {
    emoji = '📖'
    significance = 45
  }

  return {
    type: 'player_milestone',
    season: entry.season,
    matchday: entry.matchday,
    text: entry.text,
    emoji,
    significance,
    subjectPlayerId: player.id,
  }
}

// ── StorylineEntry → MemoryEvent ─────────────────────────────────────────────

export function buildEventFromStoryline(storyline: StorylineEntry): MemoryEvent | null {
  if (!storyline.resolved) return null

  return {
    type: 'storyline_resolution',
    season: storyline.season,
    matchday: storyline.matchday,
    text: storyline.displayText,
    emoji: '📖',
    significance: storylineResolutionSignificance(storyline.type),
    subjectPlayerId: storyline.playerId,
    subjectClubId: storyline.clubId,
  }
}

// ── ClubLegend retirement → MemoryEvent ──────────────────────────────────────

export function buildEventFromRetirement(legend: ClubLegend): MemoryEvent {
  const text = legend.memorableStory
    ?? `${legend.name} pensionerade sig efter ${legend.seasons} säsonger och ${legend.totalGoals} mål.`
  return {
    type: 'retirement', season: legend.retiredSeason,
    matchday: 22, // season-end — place after regular rounds
    text, emoji: '👋', significance: 90,
    subjectPlayerId: legend.playerId,
  }
}
