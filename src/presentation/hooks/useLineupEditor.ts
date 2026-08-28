import { useState, useMemo, useEffect, useCallback } from 'react'
import { useGameStore, type SaveActionResult } from '../store/gameStore'
import { pickBestEleven, buildNudgeLineup } from '../utils/lineupNudge'
import {
  PlayerPosition,
  FixtureStatus,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../domain/enums'
import type { Tactic, Club } from '../../domain/entities/Club'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { FORMATIONS, autoAssignFormation, type FormationType } from '../../domain/entities/Formation'
import { POSITION_ORDER } from '../utils/formatters'
import type { Player } from '../../domain/entities/Player'

export interface GroupedPlayers {
  position: PlayerPosition
  players: Player[]
}

export interface LineupEditor {
  squadPlayers: Player[]
  groupedPlayers: GroupedPlayers[]
  startingIds: string[]
  benchIds: string[]
  captainId: string | undefined
  tacticState: Tactic
  selectedSlotId: string | null
  setSelectedSlotId: (id: string | null) => void
  lineupError: string | null
  setLineupError: (e: string | null) => void
  injuredInStarting: Player[]
  canPlay: boolean
  togglePlayer: (playerId: string) => void
  handleAutoFill: () => void
  assignPlayerToSlot: (playerId: string, slotId: string) => void
  swapSlots: (fromSlotId: string, toSlotId: string) => void
  handleTacticChange: <K extends keyof Tactic>(key: K, value: Tactic[K]) => void
  setCaptain: (id: string) => void
  onSlotClick: (slotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
  removePlayer: (playerId: string) => void
  /** Write-path: persisterar nuvarande elva till game.managedClubPendingLineup. */
  commitLineup: () => SaveActionResult
}

/**
 * useLineupEditor — startelva-/lineup-redigeringens state-maskin, lyft ur MatchScreen
 * (instruktion CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md, F2).
 *
 * Beteendebevarande: samma seedningsordning (savedLineup ?? nudge ?? default), samma
 * handlers, samma effekter (engångs persist-formation + truly-broken auto-fill).
 * Konsumeras av MatchScreen (oförändrat beteende) OCH Tillträdet-F2 (samma yta).
 *
 * matchStep / play / advance / routing stannar hos respektive container — hooken äger
 * bara redigeringen + write-pathen.
 */
export function useLineupEditor(game: SaveGame | null | undefined, managedClub: Club | undefined): LineupEditor {
  const updateTactic = useGameStore(s => s.updateTactic)
  const setPlayerLineup = useGameStore(s => s.setPlayerLineup)

  const managedClubId = game?.managedClubId ?? ''

  const squadPlayers = useMemo(() => {
    if (!game) return []
    return game.players
      .filter(p => p.clubId === managedClubId)
      .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
  }, [game, managedClubId])

  const defaultStarting = useMemo(() => {
    return [...squadPlayers]
      .filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0)
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 11)
      .map(p => p.id)
  }, [squadPlayers])

  const savedLineup = game?.managedClubPendingLineup

  // ── Nudge-lineup: förfyll PREFILL_COUNT, lämna EMPTY_SLOTS tomma (B10 T2) ──
  // Beräknas bara när ingen savedLineup finns. Seedat på nästa fixtures ID.
  const nudgeData = useMemo<{ starterIds: string[]; lineupSlots: Record<string, string | null> } | null>(() => {
    if (savedLineup) return null
    if (!game) return null
    const pendingFixture = game.fixtures
      .filter(f =>
        f.status === FixtureStatus.Scheduled &&
        (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
      )
      .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0]
    if (!pendingFixture) return null
    const available = squadPlayers.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0)
    const formationName = (managedClub?.activeTactic?.formation ?? '5-3-2') as FormationType
    const template = FORMATIONS[formationName]
    return buildNudgeLineup(available, template, pendingFixture.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Avsiktligt tom dep-array — beräknas EN gång vid mount

  const [startingIds, setStartingIds] = useState<string[]>(() =>
    savedLineup?.startingPlayerIds ?? nudgeData?.starterIds ?? defaultStarting
  )
  const [benchIds, setBenchIds] = useState<string[]>(() =>
    savedLineup?.benchPlayerIds ??
    squadPlayers.filter(p => !defaultStarting.includes(p.id)).slice(0, 5).map(p => p.id)
  )
  const [captainId, setCaptainId] = useState<string | undefined>(() =>
    savedLineup?.captainPlayerId ?? (savedLineup ? defaultStarting[0] : nudgeData?.starterIds[0] ?? defaultStarting[0])
  )
  const [lineupError, setLineupError] = useState<string | null>(null)
  const [tacticState, setTacticState] = useState<Tactic>(() => {
    const base = managedClub?.activeTactic ?? {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Mixed,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Mixed,
      cornerStrategy: CornerStrategy.Standard,
      penaltyKillStyle: PenaltyKillStyle.Active,
    }
    const baseWithFormation = { ...base, formation: base.formation ?? '5-3-2' }
    if (!savedLineup && nudgeData?.lineupSlots) {
      return { ...baseWithFormation, lineupSlots: nudgeData.lineupSlots }
    }
    return baseWithFormation
  })
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  // Persist default formation to store on mount (so it's available across sessions)
  useEffect(() => {
    if (!managedClub?.activeTactic?.formation) {
      updateTactic(tacticState)
    }
  }, [])

  useEffect(() => {
    // Tvångsfyll bara vid verkligt trasigt state — skadade/avstängda i startelvan,
    // eller fullständig inkonsistens (slots pekar på spelare som inte är i startarnas lista).
    // Avsiktligt tomma nudge-slots (< 11 men ingen savedLineup) triggar INTE auto-fill.
    const hasInvalid = startingIds.some(id => {
      const p = squadPlayers.find(pl => pl.id === id)
      return !p || p.isInjured || p.suspensionGamesRemaining > 0 || (p.restGamesRemaining ?? 0) > 0
    })
    const slotPlayerIds = new Set(
      Object.values(tacticState.lineupSlots ?? {}).filter((v): v is string => v !== null)
    )
    const isInconsistent = startingIds.length > 0 && startingIds.some(id => !slotPlayerIds.has(id))
    const isTrulyBroken = hasInvalid || (savedLineup && isInconsistent)
    if (isTrulyBroken) {
      handleAutoFill()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): namnet är historiskt (från
  // innan suspension delade denna lista) — bär nu tre skilda otillgänglighets-
  // orsaker: skadad, avstängd, vilande/överbelastad efter förra matchens
  // sannolikhetskast. LineupStep.tsx grenar på vilken av de tre det är.
  const injuredInStarting = startingIds
    .map(id => squadPlayers.find(p => p.id === id))
    .filter((p): p is Player => !!p && (p.isInjured || p.suspensionGamesRemaining > 0 || (p.restGamesRemaining ?? 0) > 0))

  const canPlay = startingIds.length === 11 && injuredInStarting.length === 0

  const groupedPlayers: GroupedPlayers[] = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender,
    PlayerPosition.Half,
    PlayerPosition.Midfielder,
    PlayerPosition.Forward,
  ].map(pos => ({
    position: pos,
    players: squadPlayers.filter(p => p.position === pos),
  })).filter(g => g.players.length > 0)

  function togglePlayer(playerId: string) {
    const player = squadPlayers.find(p => p.id === playerId)
    if (!player || player.isInjured || player.suspensionGamesRemaining > 0 || (player.restGamesRemaining ?? 0) > 0) return
    if (selectedSlotId) {
      assignPlayerToSlot(playerId, selectedSlotId)
      return
    }
    if (startingIds.includes(playerId)) {
      const current = { ...(tacticState.lineupSlots ?? {}) }
      for (const sid of Object.keys(current)) {
        if (current[sid] === playerId) current[sid] = null
      }
      const newTactic = { ...tacticState, lineupSlots: current }
      setTacticState(newTactic)
      updateTactic(newTactic)
      setStartingIds(prev => prev.filter(id => id !== playerId))
      setBenchIds(prev => [...prev, playerId])
    } else if (benchIds.includes(playerId)) {
      setBenchIds(prev => prev.filter(id => id !== playerId))
    } else {
      if (startingIds.length < 11) {
        setStartingIds(prev => [...prev, playerId])
      } else {
        setBenchIds(prev => [...prev, playerId])
      }
    }
  }

  function handleAutoFill() {
    // High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom): "Fyll bästa
    // elvan" — den knapp auditen faktiskt testade. Delar nu pickBestEleven()
    // med lineupNudge.ts:s buildNudgeLineup istf en egen, tredje kopia av
    // samma urvalslogik med en annan (CA-dominant) formel.
    const available = squadPlayers.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0)
    const { starters, rest } = pickBestEleven(available)
    const starterIds = starters.map(p => p.id)
    const bench = rest.slice(0, 5)
    const formation = tacticState.formation ?? '5-3-2'
    const template = FORMATIONS[formation]
    const newLineupSlots = autoAssignFormation(template, starters)
    const newTactic = { ...tacticState, lineupSlots: newLineupSlots }
    setTacticState(newTactic)
    updateTactic(newTactic)
    setStartingIds(starterIds)
    setBenchIds(bench.map(p => p.id))
    setCaptainId(starterIds[0])
    setSelectedSlotId(null)
    setLineupError(null)
  }

  const assignPlayerToSlot = useCallback((playerId: string, slotId: string) => {
    const formation = tacticState.formation ?? '5-3-2'
    const slotExists = FORMATIONS[formation].slots.some(s => s.id === slotId)
    if (!slotExists) return
    const current = { ...(tacticState.lineupSlots ?? {}) }
    for (const sid of Object.keys(current)) {
      if (current[sid] === playerId) current[sid] = null
    }
    const previousPid = current[slotId] ?? null
    current[slotId] = playerId
    const newTactic = { ...tacticState, lineupSlots: current }
    setTacticState(newTactic)
    updateTactic(newTactic)

    setStartingIds(prev => {
      const isAlreadyStarting = prev.includes(playerId)
      let next = [...prev]
      if (previousPid && previousPid !== playerId) {
        next = next.filter(id => id !== previousPid)
      }
      if (!isAlreadyStarting) {
        next.push(playerId)
      }
      return next
    })

    setBenchIds(prev => {
      let next = [...prev]
      if (previousPid && previousPid !== playerId && !next.includes(previousPid)) {
        next.push(previousPid)
      }
      next = next.filter(id => id !== playerId)
      return next
    })

    setSelectedSlotId(null)
  }, [tacticState, updateTactic])

  const swapSlots = useCallback((fromSlotId: string, toSlotId: string) => {
    const current = { ...(tacticState.lineupSlots ?? {}) }
    const tmp = current[fromSlotId] ?? null
    current[fromSlotId] = current[toSlotId] ?? null
    current[toSlotId] = tmp
    const newTactic = { ...tacticState, lineupSlots: current }
    setTacticState(newTactic)
    updateTactic(newTactic)
  }, [tacticState, updateTactic])

  function handleTacticChange<K extends keyof Tactic>(key: K, value: Tactic[K]) {
    const newTactic = { ...tacticState, [key]: value }
    setTacticState(newTactic)
    updateTactic(newTactic)
  }

  function setCaptain(id: string) {
    setCaptainId(id)
  }

  function onSlotClick(slotId: string) {
    setSelectedSlotId(prev => (prev === slotId ? null : slotId))
  }

  function onFormationChange(newTactic: Tactic) {
    // Migrate: preserve players whose slotId exists in the new formation
    const newFormation = newTactic.formation ?? '5-3-2'
    const newSlotIds = new Set(FORMATIONS[newFormation].slots.map(s => s.id))
    const oldSlots = tacticState.lineupSlots ?? {}
    const migrated: Record<string, string | null> = {}
    for (const slotId of newSlotIds) migrated[slotId] = null
    const keptPids = new Set<string>()
    for (const [slotId, pid] of Object.entries(oldSlots)) {
      if (newSlotIds.has(slotId) && pid) {
        migrated[slotId] = pid
        keptPids.add(pid)
      }
    }
    const unplacedStarters = startingIds
      .map(id => squadPlayers.find(p => p.id === id))
      .filter((p): p is Player => !!p && !keptPids.has(p.id))
    const emptySlots = FORMATIONS[newFormation].slots.filter(s => !migrated[s.id])
    const usedInFill = new Set<string>()
    for (const slot of emptySlots) {
      const best = unplacedStarters
        .filter(p => !usedInFill.has(p.id) && p.position === slot.position)
        .sort((a, b) => b.currentAbility - a.currentAbility)[0]
        ?? unplacedStarters
          .filter(p => !usedInFill.has(p.id))
          .sort((a, b) => b.currentAbility - a.currentAbility)[0]
      if (best) {
        migrated[slot.id] = best.id
        usedInFill.add(best.id)
      }
    }
    const merged = { ...newTactic, lineupSlots: migrated }
    setTacticState(merged)
    updateTactic(merged)
    setSelectedSlotId(null)
  }

  function removePlayer(playerId: string) {
    const current = { ...(tacticState.lineupSlots ?? {}) }
    for (const sid of Object.keys(current)) {
      if (current[sid] === playerId) current[sid] = null
    }
    const newTactic = { ...tacticState, lineupSlots: current }
    setTacticState(newTactic)
    updateTactic(newTactic)
    setStartingIds(prev => prev.filter(id => id !== playerId))
    setBenchIds(prev => [...prev, playerId])
  }

  function commitLineup(): SaveActionResult {
    return setPlayerLineup(startingIds, benchIds, captainId)
  }

  return {
    squadPlayers,
    groupedPlayers,
    startingIds,
    benchIds,
    captainId,
    tacticState,
    selectedSlotId,
    setSelectedSlotId,
    lineupError,
    setLineupError,
    injuredInStarting,
    canPlay,
    togglePlayer,
    handleAutoFill,
    assignPlayerToSlot,
    swapSlots,
    handleTacticChange,
    setCaptain,
    onSlotClick,
    onFormationChange,
    removePlayer,
    commitLineup,
  }
}
