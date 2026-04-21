import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore, useLastCompletedFixture } from '../store/gameStore'
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
  PlayoffRound,
} from '../../domain/enums'
import type { Tactic } from '../../domain/entities/Club'
import { FORMATIONS, autoAssignFormation } from '../../domain/entities/Formation'
import { POSITION_ORDER } from '../utils/formatters'
import { formatArenaName } from '../../domain/utils/arenaName'
import type { Fixture } from '../../domain/entities/Fixture'
import type { Player } from '../../domain/entities/Player'
import { getRivalry } from '../../domain/data/rivalries'
import { getCupRoundLabel } from '../../domain/services/cupService'
import { LastMatchCard } from '../components/match/LastMatchCard'
import { MatchReportView } from '../components/match/MatchReportView'
import { LineupStep } from '../components/match/LineupStep'
import { TacticStep } from '../components/match/TacticStep'
import { StartStep } from '../components/match/StartStep'
import { MatchHeader } from '../components/match/MatchHeader'
import { calcAttendance } from '../../domain/services/economyService'
import { getMatchMood } from '../../domain/services/matchMoodService'
import { getRitualText } from '../../domain/services/supporterRituals'
import { getRoundDate } from '../../domain/services/scheduleGenerator'

export function MatchScreen() {
  const { game, setPlayerLineup, advance, updateTactic, updateMatchMode } = useGameStore()
  const location = useLocation()
  const navigate = useNavigate()
  const lastCompletedFixtureFromStore = useLastCompletedFixture()

  const showReport = !!(location.state as { showReport?: boolean } | null)?.showReport
  const completedFixture: Fixture | null = showReport ? lastCompletedFixtureFromStore : null
  const [matchStep, setMatchStep] = useState<'lineup' | 'tactic' | 'start'>('lineup')
  const matchMode = game?.preferredMatchMode ?? 'full'

  useEffect(() => {
    if ((location.state as { showReport?: boolean } | null)?.showReport) {
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const managedClubId = game?.managedClubId ?? ''
  const managedClub = game?.clubs.find(c => c.id === managedClubId)
  const squadPlayers = useMemo(() => {
    if (!game) return []
    return game.players
      .filter(p => p.clubId === managedClubId)
      .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
  }, [game, managedClubId])

  const defaultStarting = useMemo(() => {
    return [...squadPlayers]
      .filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 11)
      .map(p => p.id)
  }, [squadPlayers])

  const savedLineup = game?.managedClubPendingLineup
  const [startingIds, setStartingIds] = useState<string[]>(() =>
    savedLineup?.startingPlayerIds ?? defaultStarting
  )
  const [benchIds, setBenchIds] = useState<string[]>(() =>
    savedLineup?.benchPlayerIds ??
    squadPlayers.filter(p => !defaultStarting.includes(p.id)).slice(0, 5).map(p => p.id)
  )
  const [captainId, setCaptainId] = useState<string | undefined>(() =>
    savedLineup?.captainPlayerId ?? defaultStarting[0]
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
    return { ...base, formation: base.formation ?? '5-3-2' }
  })
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  // Persist default formation to store on mount (so it's available across sessions)
  useEffect(() => {
    if (!managedClub?.activeTactic?.formation) {
      updateTactic(tacticState)
    }
  }, [])

  useEffect(() => {
    const hasInvalid = startingIds.some(id => {
      const p = squadPlayers.find(pl => pl.id === id)
      return !p || p.isInjured || p.suspensionGamesRemaining > 0
    })
    if (startingIds.length < 11 || hasInvalid) {
      handleAutoFill()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || !managedClub) return null

  const injuredInStarting = startingIds
    .map(id => squadPlayers.find(p => p.id === id))
    .filter((p): p is Player => !!p && (p.isInjured || p.suspensionGamesRemaining > 0))

  const canPlay = startingIds.length === 11 && injuredInStarting.length === 0

  const eliminatedBracket = game.playoffBracket
  const eliminatedSeries = eliminatedBracket ? [
    ...(eliminatedBracket.quarterFinals ?? []),
    ...(eliminatedBracket.semiFinals ?? []),
    ...(eliminatedBracket.final ? [eliminatedBracket.final] : []),
  ] : []
  const eliminated = eliminatedSeries.some(s => s.loserId === managedClubId)

  const nextFixture = game.fixtures
    .filter(f => {
      if (f.status !== FixtureStatus.Scheduled) return false
      if (f.homeClubId !== managedClubId && f.awayClubId !== managedClubId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  const rivalry = nextFixture ? getRivalry(nextFixture.homeClubId, nextFixture.awayClubId) : null

  const lastCompletedFixture = game.fixtures
    .filter(f =>
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
      f.status === FixtureStatus.Completed
    )
    .sort((a, b) => b.matchday - a.matchday)[0] ?? null

  function togglePlayer(playerId: string) {
    const player = squadPlayers.find(p => p.id === playerId)
    if (!player || player.isInjured || player.suspensionGamesRemaining > 0) return
    if (selectedSlotId) {
      assignPlayerToSlot(playerId, selectedSlotId)
      return
    }
    if (startingIds.includes(playerId)) {
      // Remove from starting — also clear their slot
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
    const available = squadPlayers.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
    const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
    const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
    const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)
    const starters: Player[] = gkPool.length > 0 ? [gkPool[0]] : []
    for (const p of outfieldPool) {
      if (starters.length >= 11) break
      starters.push(p)
    }
    for (const p of gkPool.slice(1)) {
      if (starters.length >= 11) break
      starters.push(p)
    }
    const starterIds = starters.map(p => p.id)
    const starterSet = new Set(starterIds)
    const bench = sorted.filter(p => !starterSet.has(p.id)).slice(0, 5)
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
    // Clear any slot that already has this player
    for (const sid of Object.keys(current)) {
      if (current[sid] === playerId) current[sid] = null
    }
    // Read previous occupant before overwriting
    const previousPid = current[slotId] ?? null
    current[slotId] = playerId
    const newTactic = { ...tacticState, lineupSlots: current }
    setTacticState(newTactic)
    updateTactic(newTactic)

    // Update starting/bench atomically using functional updaters (always fresh prev)
    setStartingIds(prev => {
      const isAlreadyStarting = prev.includes(playerId)
      let next = [...prev]
      // Remove previous occupant from starting
      if (previousPid && previousPid !== playerId) {
        next = next.filter(id => id !== previousPid)
      }
      // Add new player to starting if not already there
      if (!isAlreadyStarting) {
        next.push(playerId)
      }
      return next
    })

    setBenchIds(prev => {
      let next = [...prev]
      // Move previous occupant to bench if they're not already there
      if (previousPid && previousPid !== playerId && !next.includes(previousPid)) {
        next.push(previousPid)
      }
      // Remove new player from bench
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

  function generateAiLineupForOpponent(): import('../../domain/entities/Fixture').TeamSelection {
    const opponentClubId = nextFixture
      ? (nextFixture.homeClubId === managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
      : null
    const opponentClub = opponentClubId ? game!.clubs.find(c => c.id === opponentClubId) : null
    if (!opponentClub) {
      return { startingPlayerIds: [], benchPlayerIds: [], tactic: tacticState }
    }
    const available = game!.players.filter(
      p => opponentClub.squadPlayerIds.includes(p.id) && !p.isInjured && p.suspensionGamesRemaining <= 0
    )
    const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
    const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
    const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)
    const starters: Player[] = []
    if (gkPool.length > 0) starters.push(gkPool[0])
    for (const p of outfieldPool) {
      if (starters.length >= 11) break
      starters.push(p)
    }
    if (starters.length < 11) {
      for (const p of gkPool.slice(1)) {
        if (starters.length >= 11) break
        starters.push(p)
      }
    }
    const starterIds = new Set(starters.map(p => p.id))
    const bench: Player[] = []
    for (const p of sorted) {
      if (bench.length >= 5) break
      if (!starterIds.has(p.id)) bench.push(p)
    }
    const captain = starters.reduce(
      (best, p) => (p.currentAbility > (best?.currentAbility ?? -1) ? p : best),
      starters[0]
    )
    return {
      startingPlayerIds: starters.map(p => p.id),
      benchPlayerIds: bench.map(p => p.id),
      captainPlayerId: captain?.id,
      tactic: opponentClub.activeTactic,
    }
  }

  function handlePlayMatch() {
    if (!canPlay) {
      setMatchStep('lineup')
      setLineupError(startingIds.length !== 11
        ? `Välj exakt 11 startspelare (du har ${startingIds.length})`
        : 'Skadade eller avstängda spelare i startuppställningen')
      return
    }
    setLineupError(null)
    try {
      const lineupResult = setPlayerLineup(startingIds, benchIds, captainId)
      if (!lineupResult.success) {
        setLineupError(lineupResult.error ?? 'Ogiltig uppställning')
        return
      }
      if (matchMode !== 'quicksim' && matchMode !== 'silent' && nextFixture) {
        const homeClub = game!.clubs.find(c => c.id === nextFixture.homeClubId)
        const awayClub = game!.clubs.find(c => c.id === nextFixture.awayClubId)
        const isHome = nextFixture.homeClubId === managedClubId
        const myLineup: import('../../domain/entities/Fixture').TeamSelection = {
          startingPlayerIds: startingIds,
          benchPlayerIds: benchIds,
          captainPlayerId: captainId,
          tactic: tacticState,
        }
        const aiLineup = generateAiLineupForOpponent()
        const liveMatchWeather = game!.matchWeathers?.find(mw => mw.fixtureId === nextFixture.id)
        const liveAttendance = homeClub ? calcAttendance({
          club: homeClub,
          fanMood: game!.fanMood ?? 50,
          position: game!.standings.find(s => s.clubId === nextFixture.homeClubId)?.position ?? 6,
          isKnockout: !!nextFixture.isKnockout,
          isCup: !!nextFixture.isCup,
          isDerby: false,
          isFinal: nextFixture.roundNumber > 22 && game!.playoffBracket?.final?.fixtures.includes(nextFixture.id),
          isSemiFinal: nextFixture.roundNumber > 22 && game!.playoffBracket?.semiFinals.some(s => s.fixtures.includes(nextFixture.id)),
          isAnnandagen: !nextFixture.isCup && getRoundDate(nextFixture.season, nextFixture.roundNumber).endsWith('-12-26'),
        }) : undefined
        navigate('/game/match/live', {
          state: {
            fixture: { ...nextFixture, attendance: liveAttendance },
            homeLineup: isHome ? myLineup : aiLineup,
            awayLineup: isHome ? aiLineup : myLineup,
            homeClubName: homeClub?.name ?? '',
            awayClubName: awayClub?.name ?? '',
            isManaged: true,
            matchWeather: liveMatchWeather,
            matchMode,
          },
        })
      } else {
        try {
          const result = advance(true) // suppress auto-navigation — we navigate manually
          if (!result) {
            setLineupError('Kunde inte simulera matchen')
            return
          }
          navigate('/game/review')
        } catch (err) {
          console.error('Snabbsim kraschade:', err)
          setLineupError(`Något gick fel: ${err instanceof Error ? err.message : 'okänt fel'}`)
        }
      }
    } catch (err) {
      console.error('handlePlayMatch kraschade:', err)
      setLineupError(`Något gick fel: ${err instanceof Error ? err.message : 'okänt fel'}`)
    }
  }

  const opponentId = nextFixture
    ? (nextFixture.homeClubId === managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
    : null
  const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) ?? null : null
  const isHome = nextFixture?.homeClubId === managedClubId

  const groupedPlayers = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender,
    PlayerPosition.Half,
    PlayerPosition.Midfielder,
    PlayerPosition.Forward,
  ].map(pos => ({
    position: pos,
    players: squadPlayers.filter(p => p.position === pos),
  })).filter(g => g.players.length > 0)

  if (showReport && completedFixture) {
    return (
      <MatchReportView
        fixture={completedFixture}
        game={game}
        onClose={() => navigate('/game/review', { replace: true })}
      />
    )
  }

  if (!nextFixture) {
    return (
      <div style={{ padding: '12px 12px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Match</h2>
        <div className="card-round" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Säsongen är slut</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Inga fler matcher att spela den här säsongen.</p>
        </div>
        {lastCompletedFixture && (
          <div style={{ marginTop: 20 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10,
            }}>
              Senaste match
            </p>
            <LastMatchCard fixture={lastCompletedFixture} game={game} managedClubId={managedClubId} />
          </div>
        )}
      </div>
    )
  }

  // ── Match header data ──────────────────────────────────────────────
  const isPlayoffRound = nextFixture.roundNumber > 22
  const playoffBracket = game.playoffBracket
  const allSeries = playoffBracket ? [
    ...playoffBracket.quarterFinals,
    ...playoffBracket.semiFinals,
    ...(playoffBracket.final ? [playoffBracket.final] : []),
  ] : []
  const playoffSeries = allSeries.find(s => s.fixtures.includes(nextFixture.id)) ?? null
  const isSeriesHome = playoffSeries ? playoffSeries.homeClubId === managedClubId : false
  const myWins = playoffSeries ? (isSeriesHome ? playoffSeries.homeWins : playoffSeries.awayWins) : 0
  const theirWins = playoffSeries ? (isSeriesHome ? playoffSeries.awayWins : playoffSeries.homeWins) : 0
  const isCupFixture = nextFixture.isCup === true
  const cupMatchEntry = isCupFixture ? game.cupBracket?.matches.find(m => m.fixtureId === nextFixture.id) : null
  const isCupFinal = cupMatchEntry?.round === 4
  const isFinalMatch = playoffSeries?.round === PlayoffRound.Final
  const playoffRoundLabel = playoffSeries
    ? playoffSeries.round === PlayoffRound.QuarterFinal ? 'KVARTSFINAL'
      : playoffSeries.round === PlayoffRound.SemiFinal ? 'SEMIFINAL'
      : 'SM-FINAL'
    : ''
  const roundLabel = isPlayoffRound && playoffSeries
    ? isFinalMatch
      ? `SM-FINAL · Studenternas IP, Uppsala`
      : `${playoffRoundLabel} · Serie ${myWins}–${theirWins} (bäst av 5)`
    : isCupFixture
      ? `🏆 SVENSKA CUPEN · ${isCupFinal ? 'FINAL' : getCupRoundLabel(cupMatchEntry?.round ?? 1)}`
      : rivalry ? `🔥 ${rivalry.name}` : `Omgång ${nextFixture.roundNumber}`
  const matchWeatherData = game.matchWeathers?.find(w => w.fixtureId === nextFixture.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 0' }}>
        {lastCompletedFixture && (
          <div style={{ marginBottom: 12 }}>
            <LastMatchCard fixture={lastCompletedFixture} game={game} managedClubId={managedClubId} />
          </div>
        )}
        {/* Combined match info + weather card — ABOVE stepper */}
        {nextFixture && (
          <div style={{ marginBottom: 8 }}>
            <MatchHeader
              fixture={nextFixture}
              roundLabel={roundLabel}
              opponentName={opponent?.name ?? 'Okänd'}
              isHome={isHome}
              weather={(game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id)}
              step={matchStep}
              tactic={matchStep === 'start' ? tacticState : undefined}
            />
          </div>
        )}

        {/* Stämningskortet */}
        {nextFixture && (() => {
          const mood = getMatchMood(game, nextFixture, matchWeatherData)
          if (!mood) return null
          return (
            <div className="card-round" style={{ margin: '0 12px 8px', padding: '8px 12px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-display)', margin: 0 }}>
                {mood}
              </p>
            </div>
          )
        })()}

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0 8px', gap: 0 }}>
          {(['lineup', 'tactic', 'start'] as const).map((s, i) => {
            const labels = ['Välj trupp', 'Välj taktik', 'Starta']
            const isActive = matchStep === s
            const isDone = (matchStep === 'tactic' && s === 'lineup') || (matchStep === 'start' && s !== 'start')
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                    border: `2px solid ${isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                    fontSize: 12, fontWeight: 700,
                    color: isDone || isActive ? 'var(--text-light)' : 'var(--text-muted)',
                    cursor: isDone ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }} onClick={() => isDone && setMatchStep(s)}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400, letterSpacing: '0.3px' }}>
                    {labels[i]}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ width: 24, height: 2, background: isDone ? 'var(--success)' : 'var(--border)', marginBottom: 18, flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {matchStep === 'lineup' && (
        <LineupStep
          opponent={opponent ?? null}
          nextFixture={nextFixture}
          game={game}
          squadPlayers={squadPlayers}
          groupedPlayers={groupedPlayers}
          startingIds={startingIds}
          benchIds={benchIds}
          captainId={captainId ?? null}
          selectedSlotId={selectedSlotId}
          tacticState={tacticState}
          canPlay={canPlay}
          injuredInStarting={injuredInStarting}
          onTogglePlayer={togglePlayer}
          onSetCaptain={id => setCaptainId(id)}
          onAutoFill={handleAutoFill}
          onSlotClick={slotId => setSelectedSlotId(prev => prev === slotId ? null : slotId)}
          onFormationChange={newTactic => {
            // Migrate: preserve players whose slotId exists in the new formation
            const newFormation = newTactic.formation ?? '5-3-2'
            const newSlotIds = new Set(FORMATIONS[newFormation].slots.map(s => s.id))
            const oldSlots = tacticState.lineupSlots ?? {}
            const migrated: Record<string, string | null> = {}
            // Initialise all new slots to null
            for (const slotId of newSlotIds) migrated[slotId] = null
            // Keep assignments whose slotId still exists in the new formation
            const keptPids = new Set<string>()
            for (const [slotId, pid] of Object.entries(oldSlots)) {
              if (newSlotIds.has(slotId) && pid) {
                migrated[slotId] = pid
                keptPids.add(pid)
              }
            }
            // Auto-assign remaining starters into empty slots
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
          }}
          onAssignPlayer={assignPlayerToSlot}
          onSwapPlayers={swapSlots}
          onRemovePlayer={(playerId) => {
            const current = { ...(tacticState.lineupSlots ?? {}) }
            for (const sid of Object.keys(current)) {
              if (current[sid] === playerId) current[sid] = null
            }
            const newTactic = { ...tacticState, lineupSlots: current }
            setTacticState(newTactic)
            updateTactic(newTactic)
            setStartingIds(prev => prev.filter(id => id !== playerId))
            setBenchIds(prev => [...prev, playerId])
          }}
          onError={setLineupError}
          onNext={() => canPlay && setMatchStep('tactic')}
        />
      )}

      {matchStep === 'tactic' && (
        <TacticStep
          tacticState={tacticState}
          matchWeatherData={matchWeatherData}
          startingIds={startingIds}
          game={game}
          opponent={opponent}
          nextFixture={nextFixture}
          onChange={handleTacticChange}
          onBack={() => setMatchStep('lineup')}
          onNext={() => setMatchStep('start')}
        />
      )}

      {matchStep === 'start' && (
        <StartStep
          startingIds={startingIds}
          tacticState={tacticState}
          matchWeatherData={matchWeatherData}
          matchMode={matchMode}
          lineupError={lineupError}
          onSetMatchMode={m => { updateMatchMode(m) }}
          onBack={() => setMatchStep('tactic')}
          onPlay={handlePlayMatch}
          fixture={nextFixture ?? undefined}
          isHome={isHome}
          fanMood={game.fanMood ?? 50}
          expectedAttendance={nextFixture ? (() => {
            const homeClub = game.clubs.find(c => c.id === nextFixture.homeClubId)
            if (!homeClub) return undefined
            return calcAttendance({
              club: homeClub,
              fanMood: game.fanMood ?? 50,
              position: game.standings.find(s => s.clubId === nextFixture.homeClubId)?.position ?? 6,
              isKnockout: !!nextFixture.isKnockout,
              isCup: !!nextFixture.isCup,
              isDerby: false,
              isFinal: nextFixture.roundNumber > 22 && game.playoffBracket?.final?.fixtures.includes(nextFixture.id),
              isSemiFinal: nextFixture.roundNumber > 22 && game.playoffBracket?.semiFinals.some(s => s.fixtures.includes(nextFixture.id)),
            })
          })() : undefined}
          arenaName={(() => {
            if (!nextFixture) return undefined
            const isFinal = nextFixture.roundNumber > 22 && game.playoffBracket?.final?.fixtures.includes(nextFixture.id)
            if (isFinal) return 'Studenternas IP, Uppsala'
            const homeClub = game.clubs.find(c => c.id === nextFixture.homeClubId)
            return homeClub?.arenaName ? formatArenaName(homeClub.arenaName) : undefined
          })()}
          ritualText={getRitualText(game, 'kickoff') ?? undefined}
        />
      )}
    </div>
  )
}
