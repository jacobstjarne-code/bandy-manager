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
import type { Fixture } from '../../domain/entities/Fixture'
import type { Player } from '../../domain/entities/Player'
import { getRivalry } from '../../domain/data/rivalries'
import { getCupRoundLabel } from '../../domain/services/cupService'
import { LastMatchCard } from '../components/match/LastMatchCard'
import { MatchReportView } from '../components/match/MatchReportView'
import { LineupStep } from '../components/match/LineupStep'
import { TacticStep } from '../components/match/TacticStep'
import { StartStep } from '../components/match/StartStep'

export function MatchScreen() {
  const { game, setPlayerLineup, advance, updateTactic } = useGameStore()
  const location = useLocation()
  const navigate = useNavigate()
  const lastCompletedFixtureFromStore = useLastCompletedFixture()

  const showReport = !!(location.state as { showReport?: boolean } | null)?.showReport
  const completedFixture: Fixture | null = showReport ? lastCompletedFixtureFromStore : null
  const [matchStep, setMatchStep] = useState<'lineup' | 'tactic' | 'start'>('lineup')
  const [useLiveMode, setUseLiveMode] = useState(true)

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
    const formation = tacticState.formation ?? '3-3-4'
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
    const formation = tacticState.formation ?? '3-3-4'
    const slotExists = FORMATIONS[formation].slots.some(s => s.id === slotId)
    if (!slotExists) return
    const current = { ...(tacticState.lineupSlots ?? {}) }
    // Clear any slot that already has this player
    for (const sid of Object.keys(current)) {
      if (current[sid] === playerId) current[sid] = null
    }
    // Clear the target slot's previous occupant from startingIds if needed
    const previousPid = current[slotId]
    current[slotId] = playerId
    if (previousPid && previousPid !== playerId) {
      setStartingIds(prev => prev.filter(id => id !== previousPid))
      setBenchIds(prev => prev.includes(previousPid) ? prev : [...prev, previousPid])
    }
    if (!startingIds.includes(playerId) && startingIds.length < 11) {
      setStartingIds(prev => [...prev, playerId])
      setBenchIds(prev => prev.filter(id => id !== playerId))
    }
    const newTactic = { ...tacticState, lineupSlots: current }
    setTacticState(newTactic)
    updateTactic(newTactic)
    setSelectedSlotId(null)
  }, [tacticState, startingIds, updateTactic])

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
      if (useLiveMode && nextFixture) {
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
        navigate('/game/match/live', {
          state: {
            fixture: nextFixture,
            homeLineup: isHome ? myLineup : aiLineup,
            awayLineup: isHome ? aiLineup : myLineup,
            homeClubName: homeClub?.name ?? '',
            awayClubName: awayClub?.name ?? '',
            isManaged: true,
            matchWeather: liveMatchWeather,
          },
        })
      } else {
        try {
          const result = advance()
          if (!result) {
            setLineupError('Kunde inte simulera matchen')
            return
          }
          navigate('/game/match-result')
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
        onClose={() => navigate('/game')}
      />
    )
  }

  if (!nextFixture) {
    return (
      <div style={{ padding: '20px 16px' }}>
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
      <div style={{ padding: '16px 16px 0' }}>
        {lastCompletedFixture && (
          <div style={{ marginBottom: 12 }}>
            <LastMatchCard fixture={lastCompletedFixture} game={game} managedClubId={managedClubId} />
          </div>
        )}
        <div
          className="card-round"
          style={{
            border: isPlayoffRound ? '1px solid rgba(196,122,58,0.3)' : isCupFixture ? '1px solid rgba(196,122,58,0.25)' : rivalry ? '1px solid rgba(220,80,30,0.3)' : undefined,
            padding: '12px 16px',
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: 11, color: isPlayoffRound ? 'var(--accent)' : isCupFixture ? 'var(--accent)' : rivalry ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            {roundLabel}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>vs {opponent?.name ?? 'Okänd'}</p>
            <span className={isHome ? 'tag tag-copper' : 'tag tag-ghost'}>
              {isHome ? 'Hemma' : 'Borta'}
            </span>
          </div>
        </div>

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
                    color: isDone || isActive ? '#fff' : 'var(--text-muted)',
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
            const newFormation = newTactic.formation ?? '3-3-4'
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
          useLiveMode={useLiveMode}
          lineupError={lineupError}
          onSetLiveMode={setUseLiveMode}
          onBack={() => setMatchStep('tactic')}
          onPlay={handlePlayMatch}
        />
      )}
    </div>
  )
}
