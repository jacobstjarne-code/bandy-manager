import type { SaveGame } from '../../domain/entities/SaveGame'
import { getRoundDate } from '../../domain/services/scheduleGenerator'
import { getSeasonEndPhase } from '../../domain/data/seasonEndPhase'
import { isManagedClubSpectator } from '../../domain/data/seasonPhases'
import { playoffRoundName } from '../../domain/roundLabel'

export interface NextActionCue {
  text: string
  tone: 'default' | 'warning'
}

/**
 * Drag 3 (§11, punkt 6) — "Vad nu?"-affordansen. Speglar EXAKT samma grenar
 * som PortalScreen.tsx:s handleAdvance (decision-grind → managed match nästa
 * omgång → lineup-status → annars), så raden aldrig kan säga något CTA:n
 * motsäger. Ren funktion → enhetstestbar, ingen ny spellogik — bara ord över
 * befintligt beslutsträd. Egen fil (inte i PortalScreen.tsx) för att undvika
 * PortalScreen.tsx:s modulsidoeffekter (soundEffects/gameStore-rehydrering)
 * vid import i testmiljön.
 */
/**
 * Låg 1 + Medium 5 (Skutskär-auditen, 2026-08-22): sant när den hanterade
 * klubben inte har någon egen match kvar schemalagd — säsongen är
 * funktionellt slut för SPELAREN, även om andra klubbars serier fortsätter
 * (t.ex. resten av slutspelet efter en egen kvartsfinalförlust). Delad
 * mellan nextActionCue.ts (Low 1) och gameFlowActions.ts (Medium 5 —
 * rensar daterade sponsorerbjudanden ur kön i samma ögonblick).
 */
export function hasManagedClubFutureFixture(game: SaveGame): boolean {
  return game.fixtures.some(
    f => f.status === 'scheduled' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
}

export function getNextActionCue(game: SaveGame): NextActionCue {
  if (game.pendingWeeklyDecision != null) {
    return { text: 'Veckans beslut väntar — ta det först.', tone: 'warning' }
  }

  // A-M1 (SEXSÄSONGSAUDITEN 2026-08-26) — rotorsak: fixture-gaten
  // (hasManagedClubFutureFixture) kollade bara "har den hanterade klubben
  // en schemalagd match kvar", vilket är falskt i GAPET mellan sista
  // grundseriematchen och slutspelsstarten — handlePlayoffStart
  // (playoffTransition.ts) skapar slutspelsbracket + kvartsfinalfixtures
  // först på NÄSTA advance()-anrop (preRoundContextProcessor.ts), så precis
  // efter omgång 22 finns inga schemalagda fixtures alls ännu, trots att
  // klubben kan vara kvalificerad och slutspelet bara väntar på att
  // triggas. Måste kollas FÖRE fixture-gaten: om grundserien är klar men
  // ingen bracket finns än (getSeasonEndPhase === 'regular_done') är
  // slutspelet pending, inte över — "spela omgången" (advance) är vad som
  // faktiskt triggar det.
  if (getSeasonEndPhase(game) === 'regular_done') {
    return { text: 'Näst på tur: spela omgången.', tone: 'default' }
  }

  // Low 1 (Skutskär-auditen, 2026-08-22): "Näst på tur: spela omgången"
  // visades även när den hanterade klubben INTE hade någon match kvar att
  // spela (utslagen ur slutspelet — bara andra klubbars serier återstod).
  // Spelaren såg "Säsongen är slut" och "spela omgången" på samma vy
  // samtidigt. Kollar den hanterade klubbens EGNA kvarvarande matcher,
  // inte bara om NÅGON match är schemalagd någonstans i ligan.
  if (!hasManagedClubFutureFixture(game)) {
    return { text: 'Säsongen är slut för er del — avsluta säsongen.', tone: 'default' }
  }

  const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
  const nextMatchday = Math.min(...scheduledFixtures.map(f => f.matchday))
  const managedMatchInNextRound = scheduledFixtures.find(
    f => f.matchday === nextMatchday && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (!managedMatchInNextRound) {
    return { text: 'Näst på tur: spela omgången.', tone: 'default' }
  }

  const oppId = managedMatchInNextRound.homeClubId === game.managedClubId
    ? managedMatchInNextRound.awayClubId
    : managedMatchInNextRound.homeClubId
  const opp = game.clubs.find(c => c.id === oppId)
  const oppName = opp?.shortName ?? opp?.name ?? '?'

  if (!game.managedClubPendingLineup) {
    return { text: `Näst på tur: sätt laget inför ${oppName}.`, tone: 'default' }
  }

  const DAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
  const dateStr = managedMatchInNextRound.date || getRoundDate(game.currentSeason, managedMatchInNextRound.roundNumber)
  const day = DAYS[new Date(dateStr).getDay()]
  return { text: `Näst på tur: matchen mot ${oppName}, ${day}.`, tone: 'default' }
}

/**
 * Portalens primära CTA beskriver nästa verkliga avancemang. Håll hela
 * tävlingsdomen här tillsammans med "Vad nu?"-raden så vyn bara renderar
 * resultatet och de två texterna inte utvecklar parallella beslutsträd.
 */
export function getPortalAdvanceButtonText(game: SaveGame, primaryIsSmFinal: boolean): string {
  const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
  const phase = getSeasonEndPhase(game)

  if (scheduled.length === 0) {
    if (phase === 'season_done') return 'Avsluta säsongen →'
    if (phase === 'playoff_spectator') return 'Säsong över →'
    if (phase === 'regular_done') {
      const standing = game.standings.find(row => row.clubId === game.managedClubId)
      return standing && standing.position <= 8 ? 'Starta slutspel →' : 'Avsluta grundserien →'
    }
    return 'Fortsätt slutspel →'
  }

  if (isManagedClubSpectator(game)) {
    const nextPlayoffMatch = scheduled
      .filter(f => !f.isCup && f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId)
      .sort((a, b) => a.matchday - b.matchday)[0]
    if (nextPlayoffMatch) {
      const dateStr = nextPlayoffMatch.date || getRoundDate(game.currentSeason, nextPlayoffMatch.roundNumber)
      const days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
      return `Fortsätt — ${days[new Date(dateStr).getDay()]} →`
    }
    return 'Fortsätt →'
  }

  const eliminated = game.playoffBracket
    ? [
        ...game.playoffBracket.quarterFinals,
        ...game.playoffBracket.semiFinals,
        ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
      ].some(series => series.loserId === game.managedClubId)
    : false
  const nextManaged = scheduled
    .filter(fixture => {
      if (fixture.homeClubId !== game.managedClubId && fixture.awayClubId !== game.managedClubId) return false
      if (eliminated && fixture.matchday > 26 && !fixture.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday)[0]

  if (!nextManaged) return 'Fortsätt →'
  if (primaryIsSmFinal) return 'Redo — spela SM-final →'
  if (nextManaged.isCup) {
    const cupRound = game.cupBracket?.matches.find(match => match.fixtureId === nextManaged.id)?.round ?? 1
    const cupLabel = cupRound === 1 ? 'Förstarunda' : cupRound === 2 ? 'Kvartsfinal' : cupRound === 3 ? 'Semifinal' : 'Final'
    return `Spela Cup-${cupLabel} →`
  }
  if (game.playoffBracket) {
    const allSeries = [
      ...game.playoffBracket.quarterFinals,
      ...game.playoffBracket.semiFinals,
      ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
    ]
    const series = allSeries.find(candidate => candidate.fixtures.includes(nextManaged.id))
    return series ? `Redo — spela ${playoffRoundName(series.round)} →` : 'Fortsätt slutspel →'
  }
  return `Redo — spela omgång ${nextManaged.roundNumber} →`
}
