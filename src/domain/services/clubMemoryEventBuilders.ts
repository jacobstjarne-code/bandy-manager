import type { Fixture } from '../entities/Fixture'
import type { Player } from '../entities/Player'
import type { ClubLegend, StorylineEntry } from '../entities/Narrative'
import { FixtureStatus } from '../enums'
import { getRivalry } from '../data/rivalries'
import type { MemoryEvent, MemoryEventType } from './clubMemoryService'

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
  const won = margin > 0
  const lost = margin < 0

  // SM-final
  if (fixture.isFinaldag) {
    const type: MemoryEventType = 'sm_final'
    const significance = won ? 95 : 85
    const text = won
      ? `SM-guld! Vann finalen ${myScore}–${theirScore}.`
      : `SM-final förlust ${myScore}–${theirScore}. Silvermedalj.`
    return {
      type, season: fixture.season, matchday: fixture.matchday,
      text, emoji: won ? '🥇' : '🥈', significance,
      subjectClubId: opponentId,
    }
  }

  // Cup-final (isCup + isCupFinalhelgen + matchday >= 19)
  if (fixture.isCup && fixture.isCupFinalhelgen) {
    const type: MemoryEventType = 'cup_final'
    const significance = won ? 80 : 70
    const text = won
      ? `Cupfinalen vanns ${myScore}–${theirScore}. Cupen hemma!`
      : `Cupfinalen förlorades ${myScore}–${theirScore}.`
    return {
      type, season: fixture.season, matchday: fixture.matchday,
      text, emoji: won ? '🏆' : '🥈', significance,
      subjectClubId: opponentId,
    }
  }

  // Derby
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  if (rivalry) {
    if (won && margin >= 3) {
      return {
        type: 'derby_result', season: fixture.season, matchday: fixture.matchday,
        text: `Derby vunnet med ${margin} mål (${myScore}–${theirScore}) mot ${rivalry.name.split(' ')[0]}.`,
        emoji: '⚔️', significance: 55,
        subjectClubId: opponentId,
      }
    }
    if (lost) {
      return {
        type: 'derby_result', season: fixture.season, matchday: fixture.matchday,
        text: `Derby förlust ${myScore}–${theirScore}.`,
        emoji: '⚔️', significance: 35,
        subjectClubId: opponentId,
      }
    }
    return null
  }

  // Big win / big loss
  if (margin >= 4) {
    const sig = margin >= 6 ? 65 : 40
    return {
      type: 'big_win', season: fixture.season, matchday: fixture.matchday,
      text: `Storseger ${myScore}–${theirScore}.`,
      emoji: '💥', significance: sig,
      subjectClubId: opponentId,
    }
  }
  if (margin <= -4) {
    const sig = Math.abs(margin) >= 6 ? 55 : 30
    return {
      type: 'big_loss', season: fixture.season, matchday: fixture.matchday,
      text: `Storseger ${theirScore}–${myScore} mot oss.`,
      emoji: '📉', significance: sig,
      subjectClubId: opponentId,
    }
  }

  return null
}

// ── Player.narrativeLog → MemoryEvent ────────────────────────────────────────

type NarrativeEntry = NonNullable<Player['narrativeLog']>[number]

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
  const sigMap: Partial<Record<StorylineEntry['type'], number>> = {
    underdog_season: 65,
    relegation_escape: 65,
    gala_winner: 60,
    captain_rallied_team: 55,
    career_crossroads_stayed: 50,
    promotion_sacrifice: 50,
    hungrig_breakthrough: 50,
    veteran_farewell: 45,
    lokal_hero_moment: 45,
    contract_drama_resolved: 40,
    derby_echo_resolved: 35,
    workplace_bond: 40,
    journalist_feud: 40,
    journalist_redemption: 40,
    returned_to_club: 45,
    left_for_bigger_club: 45,
    partner_moved_here: 40,
    rescued_from_unemployment: 45,
    went_fulltime_pro: 50,
    refused_to_go_pro: 40,
  }
  const sig = sigMap[storyline.type] ?? 45

  return {
    type: 'storyline_resolution',
    season: storyline.season,
    matchday: storyline.matchday,
    text: storyline.displayText,
    emoji: '📖',
    significance: sig,
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
