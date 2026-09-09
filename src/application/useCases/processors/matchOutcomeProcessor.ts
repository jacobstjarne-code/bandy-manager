import type { EventLedgerEntry } from '../../../domain/entities/Narrative'
import type { Moment } from '../../../domain/entities/Moment'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { RippleChain, SaveGame } from '../../../domain/entities/SaveGame'
import { getRivalry } from '../../../domain/data/rivalries'
import { buildMatchResultLedgerEntry, buildTacticalPatternSuspension523LedgerEntry } from '../../../domain/services/clubMemoryEventBuilders'
import { decayKlackEcho, detectNotableResult } from '../../../domain/services/klackEchoService'
import { deriveUtfall } from '../../../domain/services/matchTypeAxes'
import { buildSystemRippleLedgerEntry } from '../../../domain/services/orsakVerkanService'
import { applyRipples, describeRippleChain } from '../../../domain/services/rippleEffectService'

export interface MatchOutcomeResult {
  gameAfterRipples: SaveGame
  rippleChains: RippleChain[]
  ledgerEntries: EventLedgerEntry[]
  moments: Moment[]
  klackEcho: SaveGame['klackEcho']
  newKlackEchoType?: string
}

export function processManagedMatchOutcome(
  game: SaveGame,
  fixture: Fixture | null | undefined,
  simulatedFixtures: Fixture[],
  initialGameAfterRipples: SaveGame,
  nextMatchday: number,
  allFixtures: Fixture[],
): MatchOutcomeResult {
  let gameAfterRipples = initialGameAfterRipples
  const rippleChains: RippleChain[] = []
  const ledgerEntries: EventLedgerEntry[] = []
  const moments: Moment[] = []

  if (fixture && getRivalry(fixture.homeClubId, fixture.awayClubId) !== null && deriveUtfall(fixture, game.managedClubId) === 'vunnet') {
    const rivalId = fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
    const rivalClub = game.clubs.find(club => club.id === rivalId)
    const before = gameAfterRipples
    gameAfterRipples = applyRipples(gameAfterRipples, { type: 'big_derby_win', fixtureId: fixture.id })
    const chain = describeRippleChain(before, gameAfterRipples, 'big_derby_win', rivalClub?.name, nextMatchday, game.currentSeason)
    rippleChains.push(chain)
    const rippleLedgerEntry = buildSystemRippleLedgerEntry(
      chain,
      'derby_win',
      rivalClub ? { kind: 'club', id: rivalClub.id } : undefined,
    )
    if (rippleLedgerEntry) ledgerEntries.push(rippleLedgerEntry)
    moments.push({
      id: `moment_derby_${fixture.id}`,
      source: 'derby_win',
      matchday: nextMatchday,
      season: game.currentSeason,
      title: `Derbyt mot ${rivalClub?.name ?? 'rivalen'} sitter kvar`,
      body: 'Klacken sjöng hela vägen till bilen. Två sponsorer hörde av sig i morse. Hälsningar från orten.',
      subjectClubId: rivalClub?.id,
    })
  }

  if (fixture) {
    const resultEntry = buildMatchResultLedgerEntry(fixture, game.managedClubId)
    if (resultEntry) ledgerEntries.push(resultEntry)

    const tacticalPatternEntry = buildTacticalPatternSuspension523LedgerEntry(allFixtures, game.managedClubId, game.currentSeason)
    if (tacticalPatternEntry) ledgerEntries.push(tacticalPatternEntry)
  }

  let klackEcho = game.klackEcho ? decayKlackEcho(game.klackEcho) : undefined
  let newKlackEchoType: string | undefined
  if (fixture) {
    const echo = detectNotableResult(fixture, { ...game, fixtures: simulatedFixtures })
    if (echo) {
      klackEcho = { ...echo, currentWeight: echo.initialWeight }
      newKlackEchoType = echo.type
    }
  }

  return { gameAfterRipples, rippleChains, ledgerEntries, moments, klackEcho, newKlackEchoType }
}
