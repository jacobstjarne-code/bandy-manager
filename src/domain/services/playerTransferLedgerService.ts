import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import type { SaveGame } from '../entities/SaveGame'
import type { Rivalry } from '../data/rivalries'
import {
  PLAYER_LEDGER_BID_VERDICTS,
  PLAYER_LEDGER_HOMEBOUND_LINES,
  PLAYER_LEDGER_RENEW_VERDICTS,
  TRANSFER_RIVALRY_LEDGER_WARNING,
} from '../data/transferResponseText'
import { seededPick } from '../utils/random'
import { getClubMemory, momentKind } from './clubMemoryService'
import { readClubLedger } from './eventLedgerService'
import { resolveSubjectName } from './momentLedgerService'

export type PlayerLedgerFamily = '🏟️' | '👤' | '🤝' | '⚔️'

export interface PlayerLedgerRow {
  family: PlayerLedgerFamily
  text: string
  source: string
  isTriumf: boolean
}

export interface PlayerTransferLedger {
  rows: PlayerLedgerRow[]
  verdict?: string
}

function bloodlineRow(game: SaveGame, player: Player, club: Club): PlayerLedgerRow | null {
  const entry = [...readClubLedger(game, club.id)].reverse().find(candidate =>
    (candidate.type === 'mentorship_started' || candidate.type === 'mentorship_ended')
      && (candidate.subject?.id === player.id || candidate.subject2?.id === player.id),
  )
  if (!entry) return null

  const playerIsJunior = entry.subject?.kind === 'player' && entry.subject.id === player.id
  const counterpart = playerIsJunior ? entry.subject2 : entry.subject
  const snapshot = playerIsJunior ? entry.subject2Snapshot : entry.subjectSnapshot
  const counterpartName = resolveSubjectName(game, counterpart, snapshot)
  if (!counterpartName) return null

  return {
    family: '👤',
    text: playerIsJunior
      ? `Fostrad av ${counterpartName}. Det står i pärmen.`
      : `Fostrar ${counterpartName}. Det står i pärmen.`,
    source: `Blodslinjen · säsong ${entry.season}`,
    isTriumf: false,
  }
}

function triumphRow(game: SaveGame, player: Player, club: Club): PlayerLedgerRow | null {
  const event = getClubMemory(game, club.id).seasons
    .flatMap(season => season.events)
    .filter(candidate => candidate.subjectPlayerId === player.id && momentKind(candidate.type) === 'triumph')
    .sort((a, b) => b.significance - a.significance || b.season - a.season || b.matchday - a.matchday)[0]
  if (!event) return null
  return {
    family: '⚔️',
    text: event.text,
    source: `Klubbminnet · säsong ${event.season}`,
    isTriumf: true,
  }
}

/**
 * Samma minne, ytat framåt i transferbeslutet. Funktionen returnerar
 * uttryckligen 0–3 rader: saknas belägg blir spelaren rent transaktionell.
 *
 * Handoffens birthRegion/dayJobIsLocal finns inte i Player-schemat. Vi
 * gissar därför aldrig födelseort eller arbetsgivare. Faktiskt dagjobb får
 * däremot tala med sin lagrade titel.
 */
export function buildPlayerLedger(
  game: SaveGame,
  player: Player,
  contextClub: Club,
  mode: 'bid' | 'renew',
): PlayerTransferLedger {
  const candidates: Array<{ weight: number; row: PlayerLedgerRow }> = []

  const triumph = triumphRow(game, player, contextClub)
  if (triumph) candidates.push({ weight: 100, row: triumph })

  const bloodline = bloodlineRow(game, player, contextClub)
  if (bloodline) candidates.push({ weight: 90, row: bloodline })

  const seasonsAtClub = player.joinedClubSeason === undefined
    ? undefined
    : Math.max(0, game.currentSeason - player.joinedClubSeason)
  if (seasonsAtClub !== undefined && seasonsAtClub >= 3) {
    candidates.push({
      weight: 80,
      row: {
        family: '🏟️',
        text: `${seasonsAtClub} säsonger i klubben. Han vet var isen är hårdast.`,
        source: `${seasonsAtClub} säsonger i ${contextClub.shortName}`,
        isTriumf: false,
      },
    })
  }

  if (player.dayJob && !player.isFullTimePro) {
    candidates.push({
      weight: 70,
      row: {
        family: '🤝',
        text: `${player.dayJob.title} på vardagarna.`,
        source: 'Spelarens dagjobb',
        isTriumf: false,
      },
    })
  }

  if (player.transferPersonality === 'homebound') {
    candidates.push({
      weight: 60,
      row: {
        family: '🤝',
        text: seededPick(PLAYER_LEDGER_HOMEBOUND_LINES, `${player.id}:homebound`),
        source: 'Hemmakär',
        isTriumf: false,
      },
    })
  }

  const rows = candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(candidate => candidate.row)

  const verdict = player.transferPersonality === 'homebound'
    ? seededPick(
        mode === 'renew' ? PLAYER_LEDGER_RENEW_VERDICTS : PLAYER_LEDGER_BID_VERDICTS,
        `${player.id}:${mode}:verdict`,
      )
    : undefined

  return { rows, verdict }
}

export function buildTransferRivalryWarning(
  player: Player,
  sellerClub: Club,
  rivalry: Rivalry,
): string {
  const template = seededPick(
    TRANSFER_RIVALRY_LEDGER_WARNING[rivalry.intensity as 1 | 2 | 3],
    `${player.id}:${rivalry.name}:warning`,
  )
  return template
    .replaceAll('{rival}', sellerClub.shortName || sellerClub.name)
    .replaceAll('{derby}', rivalry.name)
}
