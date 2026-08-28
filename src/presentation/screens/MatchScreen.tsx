import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore, useLastCompletedFixture } from '../store/gameStore'
import {
  PlayerPosition,
  FixtureStatus,
  PlayoffRound,
} from '../../domain/enums'
import { useLineupEditor } from '../hooks/useLineupEditor'
import { formatArenaName } from '../../domain/utils/arenaName'
import type { Fixture } from '../../domain/entities/Fixture'
import type { Player } from '../../domain/entities/Player'
import { getRivalry } from '../../domain/data/rivalries'
import { getCupRoundLabel } from '../../domain/services/cupService'
import { LastMatchCard } from '../components/match/LastMatchCard'
import { MatchReportView } from '../components/match/MatchReportView'
import { PreMatchContext } from '../components/match/PreMatchContext'
import { LineupStep } from '../components/match/LineupStep'
import { NodtruppScene } from '../components/match/NodtruppScene'
import { TacticStep } from '../components/match/TacticStep'
import { StartStep } from '../components/match/StartStep'
import { MatchHeader } from '../components/match/MatchHeader'
import { calcAttendance, buildAttendanceParams } from '../../domain/services/economyService'
import { getMatchMood } from '../../domain/services/matchMoodService'
import { getRitualText } from '../../domain/services/supporterRituals'
import { computeLaddningBeat, type LaddningBeat } from '../../domain/data/matchLaddningGrind'
import { MatchLaddningScene } from '../components/match/MatchLaddningScene'
import { MatchLaddningBand } from '../components/match/MatchLaddningBand'
import { shouldRouteQuicksimToCeremony } from './matchLiveHelpers'

export function MatchScreen() {
  const { game, advance, updateMatchMode, updateMatchLaddningBand } = useGameStore()
  const location = useLocation()
  const navigate = useNavigate()
  const lastCompletedFixtureFromStore = useLastCompletedFixture()

  const showReport = !!(location.state as { showReport?: boolean } | null)?.showReport
  const completedFixture: Fixture | null = showReport ? lastCompletedFixtureFromStore : null
  const [matchStep, setMatchStep] = useState<'laddning' | 'lineup' | 'tactic' | 'start'>(() => {
    if (!game) return 'lineup'
    const mid = game.managedClubId
    const bracket = game.playoffBracket
    const allSeries = bracket ? [
      ...(bracket.quarterFinals ?? []),
      ...(bracket.semiFinals ?? []),
      ...(bracket.final ? [bracket.final] : []),
    ] : []
    const isElim = allSeries.some(s => s.loserId === mid)
    const fixture = game.fixtures
      .filter(f => {
        if (f.status !== 'scheduled') return false
        if (f.homeClubId !== mid && f.awayClubId !== mid) return false
        if (isElim && f.matchday > 26 && !f.isCup) return false
        return true
      })
      .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0]
    if (!fixture) return 'lineup'
    const beat = computeLaddningBeat(game, fixture)
    return beat.tier !== 'none' ? 'laddning' : 'lineup'
  })
  const matchMode = game?.preferredMatchMode ?? 'full'

  useEffect(() => {
    if ((location.state as { showReport?: boolean } | null)?.showReport) {
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const managedClubId = game?.managedClubId ?? ''
  const managedClub = game?.clubs.find(c => c.id === managedClubId)
  const editor = useLineupEditor(game, managedClub)

  if (!game || !managedClub) return null

  // Lineup-redigeringens state-maskin bor i useLineupEditor (F2-extraktion).
  // Destrukturera till samma namn → nedströmskod oförändrad.
  const {
    squadPlayers, groupedPlayers, startingIds, benchIds, captainId, tacticState,
    selectedSlotId, lineupError, setLineupError, injuredInStarting, canPlay,
    togglePlayer, handleAutoFill, assignPlayerToSlot, swapSlots, handleTacticChange,
    setCaptain, onSlotClick, onFormationChange, removePlayer, commitLineup,
  } = editor

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
    .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0] ?? null

  // A3 — Compute beat once; will be consumed by early return below.
  const beat: LaddningBeat = nextFixture ? computeLaddningBeat(game, nextFixture) : { tier: 'none' }
  const effectiveStep =
    matchStep === 'laddning' && beat.tier === 'none' ? 'lineup' : matchStep

  // Persist band tracking on first render of laddning step (active streak only — broken clears on dismiss)
  useEffect(() => {
    if (matchStep !== 'laddning') return
    if (beat.tier !== 'band' || beat.isBroken) return
    updateMatchLaddningBand({
      matchday: game.currentMatchday,
      streakLength: beat.streakLength,
      stateType: beat.state,
    })
  // Only fire once when laddning mounts (nextFixture.id anchors the round)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchStep, nextFixture?.id])

  const rivalry = nextFixture ? getRivalry(nextFixture.homeClubId, nextFixture.awayClubId) : null

  const lastCompletedFixture = game.fixtures
    .filter(f =>
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
      f.status === FixtureStatus.Completed
    )
    .sort((a, b) => b.matchday - a.matchday)[0] ?? null

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
      const lineupResult = commitLineup()
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
        // Preview-mönstret, "samma funktion, samma indata" (2026-08-26):
        // delad byggfunktion med matchSimProcessor.ts:s facit-anrop — se
        // economyService.ts:s buildAttendanceParams-kommentar. Ersätter en
        // egen härledning som utelämnade communityStanding/isDerby/
        // fixtureMonth jämfört med den auktoritativa simuleringen.
        const liveAttendanceParams = buildAttendanceParams(game!, nextFixture)
        const liveAttendance = liveAttendanceParams ? calcAttendance(liveAttendanceParams) : undefined
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
          // A-H6 (ceremonivägen, Jacobs order 2026-08-28): rotorsak — quicksim-grenen
          // navigerade alltid rakt till /game/review oavsett om matchen var SM-finalen,
          // så en snabbsimmad final gav noll ceremoni-payoff. completedFixture läses
          // ur result.game (facit, redan skrivet av advance(true)/matchSimProcessor) —
          // vi navigerar in i samma live-matchskärm men i ett "ceremony-only"-läge som
          // ALDRIG re-simulerar (se buildCeremonyOnlyStep i matchLiveHelpers.ts för
          // varför en efterhands-resimulering hade riskerat ett annat resultat än det
          // redan sparade).
          const completedFixture = result.game.fixtures.find(f => f.id === nextFixture.id)
          if (shouldRouteQuicksimToCeremony(completedFixture)) {
            const homeClub = game!.clubs.find(c => c.id === completedFixture.homeClubId)
            const awayClub = game!.clubs.find(c => c.id === completedFixture.awayClubId)
            navigate('/game/match/live', {
              state: {
                fixture: completedFixture,
                homeLineup: completedFixture.homeLineup,
                awayLineup: completedFixture.awayLineup,
                homeClubName: homeClub?.name ?? '',
                awayClubName: awayClub?.name ?? '',
                isManaged: true,
                matchMode,
                skipToCeremony: true,
              },
            })
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

  // A3 — Laddning beat: full screen before lineup step
  if (effectiveStep === 'laddning' && nextFixture) {
    const oppId = nextFixture.homeClubId === managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId
    const opp = game.clubs.find(c => c.id === oppId) ?? null

    if (beat.tier === 'scene') {
      return (
        <MatchLaddningScene
          occasion={beat.occasion}
          isFinal={beat.isFinal}
          game={game}
          opponent={opp}
          nextFixture={nextFixture}
          onContinue={() => setMatchStep('lineup')}
        />
      )
    }
    if (beat.tier === 'band') {
      return (
        <MatchLaddningBand
          state={beat.state}
          streakLength={beat.streakLength}
          isBroken={beat.isBroken}
          game={game}
          opponent={opp}
          nextFixture={nextFixture}
          onContinue={() => {
            if (beat.isBroken) updateMatchLaddningBand(null)
            setMatchStep('lineup')
          }}
        />
      )
    }
  }

  // CODE_ORDER_NODTRUPP: soft-lock-skydd. Färre än 11 spelklara → nödtrupp-vyn
  // (akademi/fri agent/walkover) FÖRE LineupSteps disablade vägg. När truppen
  // fyllts till 11 faller detta igenom till lineup automatiskt (re-render).
  const availableForMatch = squadPlayers.filter(
    p => !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0
  )
  if (effectiveStep === 'lineup' && availableForMatch.length < 11) {
    return <NodtruppScene game={game} availableCount={availableForMatch.length} nextFixtureId={nextFixture.id} />
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
              step={effectiveStep === 'laddning' ? 'lineup' : effectiveStep}
              tactic={effectiveStep === 'start' ? tacticState : undefined}
            />
          </div>
        )}

        {/* Stämningskortet */}
        {nextFixture && (() => {
          const mood = getMatchMood(game, nextFixture, matchWeatherData)
          if (!mood) return null
          return (
            <div className="card-round" style={{ margin: '0 12px 8px', padding: '8px 12px' }}>
              <p className="h-quote-sm" style={{ lineHeight: 1.5, margin: 0 }}>
                {mood}
              </p>
            </div>
          )
        })()}

        {/* Kontextuell stakes-rad */}
        {nextFixture && (
          <PreMatchContext
            fixture={nextFixture}
            game={game}
            isHome={isHome}
          />
        )}

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0 8px', gap: 0 }}>
          {(['lineup', 'tactic', 'start'] as const).map((s, i) => {
            const labels = ['Välj trupp', 'Välj taktik', 'Starta']
            const isActive = effectiveStep === s
            const isDone = (effectiveStep === 'tactic' && s === 'lineup') || (effectiveStep === 'start' && s !== 'start')
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

      {effectiveStep === 'lineup' && (
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
          onSetCaptain={setCaptain}
          onAutoFill={handleAutoFill}
          onSlotClick={onSlotClick}
          onFormationChange={onFormationChange}
          onAssignPlayer={assignPlayerToSlot}
          onSwapPlayers={swapSlots}
          onRemovePlayer={removePlayer}
          onError={setLineupError}
          onNext={() => canPlay && setMatchStep('tactic')}
        />
      )}

      {effectiveStep === 'tactic' && (
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

      {effectiveStep === 'start' && (
        <StartStep
          startingIds={startingIds}
          tacticState={tacticState}
          matchWeatherData={matchWeatherData}
          matchMode={matchMode}
          lineupError={lineupError}
          onSetMatchMode={m => { void updateMatchMode(m) }}
          onBack={() => setMatchStep('tactic')}
          onPlay={handlePlayMatch}
          fixture={nextFixture ?? undefined}
          isHome={isHome}
          fanMood={game.fanMood ?? 50}
          expectedAttendance={nextFixture ? (() => {
            // Preview-mönstret, "samma funktion, samma indata" (2026-08-26):
            // se buildAttendanceParams-kommentaren i economyService.ts.
            const params = buildAttendanceParams(game, nextFixture)
            return params ? calcAttendance(params) : undefined
          })() : undefined}
          arenaName={(() => {
            if (!nextFixture) return undefined
            const isFinal = nextFixture.roundNumber > 22 && game.playoffBracket?.final?.fixtures.includes(nextFixture.id)
            if (isFinal) return 'Studenternas IP, Uppsala'
            const homeClub = game.clubs.find(c => c.id === nextFixture.homeClubId)
            return homeClub?.arenaName ? formatArenaName(homeClub.arenaName) : undefined
          })()}
          ritualText={getRitualText(game, 'kickoff') ?? undefined}
          farewellPlayerName={(() => {
            if (!nextFixture?.farewellMatchForPlayerId) return undefined
            const fp = game.players.find(p => p.id === nextFixture.farewellMatchForPlayerId)
            return fp ? `${fp.firstName} ${fp.lastName}` : undefined
          })()}
          squadPlayers={squadPlayers}
        />
      )}
    </div>
  )
}
