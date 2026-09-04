import type { Fixture } from '../entities/Fixture'
import type { Player } from '../entities/Player'
import { storylineResolutionSignificance } from './storylineLedgerService'
import type { ClubLegend, StorylineEntry, EventLedgerEntry } from '../entities/Narrative'
import { FixtureStatus } from '../enums'
import { getRivalry } from '../data/rivalries'
import { getRoundLabel } from '../roundLabel'
import type { MemoryEvent, MemoryEventType } from './clubMemoryService'
import { deriveUtfall } from './matchTypeAxes'

// ── Fixture → MemoryEvent ────────────────────────────────────────────────────

/**
 * liggare-k9-doda-typer (DOM 2026-09-04, Opus): de fem match-resultat-
 * typerna (sm_final/cup_final/derby_result/big_win/big_loss) behöver samma
 * text OAVSETT om källan är en LEVANDE fixture (denna säsong) eller en
 * `EventLedgerEntry.result`-payload (efter rollover, när fixturen är borta)
 * — "samma ord, annan källa". Denna funktion är den ENDA platsen texten
 * skrivs; `buildEventFromFixture` och `buildMatchResultText` i
 * clubMemoryService.ts går båda genom den, aldrig en egen kopia.
 */
export interface MatchMemoryTextInput {
  myScore: number
  theirScore: number
  won: boolean
  lost: boolean
  /** '' | ' efter straffar' | ' efter förlängning' — bara känt för LEVANDE
   *  fixtures (penaltyResult/overtimeResult finns inte i `result`-payloaden,
   *  se DOM 2026-09-04:s schema). Ledger-återgenererad text tappar denna
   *  nyansen för straff-/förlängningsavgjorda finaler — en medveten, liten
   *  förenkling, inte en bugg. */
  decider: string
  isFinaldag: boolean
  isCupFinal: boolean
  /** Rivalens förnamn (`rivalry.name.split(' ')[0]`) — bara satt när en rivalitet finns. */
  rivalryFirstName?: string
}

export interface MatchMemoryText {
  type: MemoryEventType
  text: string
  emoji: string
  significance: number
  outcome: 'won' | 'lost' | 'neutral'
}

export function deriveMatchMemoryText(input: MatchMemoryTextInput): MatchMemoryText | null {
  const { myScore, theirScore, won, lost, decider, isFinaldag, isCupFinal, rivalryFirstName } = input
  const margin = myScore - theirScore
  const outcome: 'won' | 'lost' | 'neutral' = won ? 'won' : lost ? 'lost' : 'neutral'

  if (isFinaldag) {
    const significance = won ? 95 : 85
    const text = won
      ? `SM-guld! Vann finalen${decider} ${myScore}–${theirScore}.`
      : `SM-finalförlust${decider} ${myScore}–${theirScore}. Silvermedalj.`
    return { type: 'sm_final', text, emoji: won ? '🥇' : '🥈', significance, outcome }
  }

  if (isCupFinal) {
    const significance = won ? 80 : 70
    const text = won
      ? `Cupfinalen vanns${decider} ${myScore}–${theirScore}. Cupen hemma!`
      : `Cupfinalen förlorades${decider} ${myScore}–${theirScore}.`
    return { type: 'cup_final', text, emoji: won ? '🏆' : '🥈', significance, outcome }
  }

  if (rivalryFirstName !== undefined) {
    if (won && margin >= 3) {
      return {
        type: 'derby_result',
        text: `Derby vunnet med ${margin} mål (${myScore}–${theirScore}) mot ${rivalryFirstName}.`,
        emoji: '⚔️', significance: 55, outcome,
      }
    }
    if (lost) {
      return { type: 'derby_result', text: `Derbyförlust${decider} ${myScore}–${theirScore}.`, emoji: '⚔️', significance: 35, outcome }
    }
    if (won && decider) {
      return { type: 'derby_result', text: `Derby vunnet${decider} ${myScore}–${theirScore}.`, emoji: '⚔️', significance: 45, outcome }
    }
    return null
  }

  if (margin >= 4) {
    const sig = margin >= 6 ? 65 : 40
    return { type: 'big_win', text: `Storseger ${myScore}–${theirScore}.`, emoji: '💥', significance: sig, outcome }
  }
  if (margin <= -4) {
    const sig = Math.abs(margin) >= 6 ? 55 : 30
    return { type: 'big_loss', text: `Storseger ${theirScore}–${myScore} mot oss.`, emoji: '📉', significance: sig, outcome }
  }

  return null
}

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
  const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
  const utfall = deriveUtfall(fixture, managedClubId)
  const won = utfall === 'vunnet'
  const lost = utfall === 'forlorat'
  const decider = fixture.penaltyResult ? ' efter straffar' : fixture.overtimeResult ? ' efter förlängning' : ''
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  const derived = deriveMatchMemoryText({
    myScore, theirScore, won, lost, decider,
    isFinaldag: !!fixture.isFinaldag,
    isCupFinal: !!fixture.isCup && fixture.roundNumber === 4,
    rivalryFirstName: rivalry ? rivalry.name.split(' ')[0] : undefined,
  })
  if (!derived) return null

  // HIGH 5 (2026-08-29): raden i klubbminnet visade `Omg {matchday}` — global
  // spelordning presenterad som ligaomgång, så ett derby i ligaomgång 4 stod
  // som "Omg 8" i årsboken. Etiketten stämplas nu vid byggtillfället.
  // Ingen playoffBracket här (byggaren tar bara fixture + klubb-id):
  // slutspelsmatcher blir "Slutspel" utan fas — sant, aldrig ett vilseledande
  // tal, och SM-finalen har ändå sin egen sm_final-typ med egen text.
  const roundLabel = getRoundLabel(fixture).long

  return {
    type: derived.type, season: fixture.season, matchday: fixture.matchday, roundLabel,
    text: derived.text, emoji: derived.emoji, significance: derived.significance,
    outcome: derived.outcome,
    subjectClubId: opponentId,
  }
}

/**
 * liggare-k9-doda-typer (DOM 2026-09-04, Opus): liggarposten för de fem
 * match-resultat-typerna — skrivs vid matchslut (roundProcessor.ts, samma
 * ställe `justCompletedManagedFixture` redan känns till), så resultatet
 * överlever `game.fixtures`-nollställningen vid rollover (k10). Klassning/
 * significance/outcome delar samma `deriveMatchMemoryText` som den levande
 * fixture-vägen — bara `result`-payloaden i stället för `text`/`emoji`.
 */
export function buildMatchResultLedgerEntry(
  fixture: Fixture,
  managedClubId: string,
): EventLedgerEntry | null {
  if (fixture.status !== FixtureStatus.Completed) return null

  const isHome = fixture.homeClubId === managedClubId
  const isAway = fixture.awayClubId === managedClubId
  if (!isHome && !isAway) return null

  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
  const utfall = deriveUtfall(fixture, managedClubId)
  const won = utfall === 'vunnet'
  const lost = utfall === 'forlorat'
  const decider = fixture.penaltyResult ? ' efter straffar' : fixture.overtimeResult ? ' efter förlängning' : ''
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  const derived = deriveMatchMemoryText({
    myScore, theirScore, won, lost, decider,
    isFinaldag: !!fixture.isFinaldag,
    isCupFinal: !!fixture.isCup && fixture.roundNumber === 4,
    rivalryFirstName: rivalry ? rivalry.name.split(' ')[0] : undefined,
  })
  if (!derived) return null

  const competition: 'league' | 'cup' | 'playoff' | 'final' = fixture.isFinaldag
    ? 'final'
    : fixture.isCup
    ? 'cup'
    : fixture.isKnockout
    ? 'playoff'
    : 'league'

  return {
    type: derived.type,
    semanticKey: `match_result:${fixture.id}`,
    season: fixture.season,
    matchday: fixture.matchday,
    subject: { kind: 'club', id: opponentId },
    outcome: derived.outcome,
    significance: derived.significance,
    result: {
      goalsFor: myScore, goalsAgainst: theirScore, opponentClubId: opponentId,
      home: isHome, competition, stage: getRoundLabel(fixture).long,
    },
  }
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
