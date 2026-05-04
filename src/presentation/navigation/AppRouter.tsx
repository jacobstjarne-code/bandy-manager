import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { setGlobalNavigate } from './globalNavigate'

function NavigateSetter() {
  const nav = useNavigate()
  useEffect(() => {
    setGlobalNavigate((path, opts) => nav(path, opts ?? {}))
  }, [nav])
  return null
}
import { NameInputScreen } from '../screens/NameInputScreen'
import { ClubSelectionScreen } from '../screens/ClubSelectionScreen'
import { IntroSequence } from '../screens/IntroSequence'
import { GameShell, GameGuard } from './GameShell'
import { PortalScreen } from '../screens/PortalScreen'
import { SceneScreen } from '../screens/scenes/SceneScreen'
import { SquadScreen } from '../screens/SquadScreen'
import { MatchScreen } from '../screens/MatchScreen'
import { MatchLiveScreen } from '../screens/match/MatchLiveScreen'
import { TransfersScreen } from '../screens/TransfersScreen'
import { ClubScreen } from '../screens/ClubScreen'
import { TabellScreen } from '../screens/TabellScreen'
import { ChampionScreen } from '../screens/ChampionScreen'
import { SeasonSummaryScreen } from '../screens/SeasonSummaryScreen'
import { InboxScreen } from '../screens/InboxScreen'

import { MatchResultScreen } from '../screens/MatchResultScreen'
import { GameOverScreen } from '../screens/GameOverScreen'
import { GranskaScreen } from '../screens/granska/GranskaScreen'
import { TaktikScreen } from '../screens/TaktikScreen'

import { HistoryScreen } from '../screens/HistoryScreen'
import { HalfTimeSummaryScreen } from '../screens/HalfTimeSummaryScreen'
import { PlayoffIntroScreen } from '../screens/PlayoffIntroScreen'
import { QFSummaryScreen } from '../screens/QFSummaryScreen'
import { RoundSummaryScreen } from '../screens/RoundSummaryScreen'
import { SimSummaryScreen } from '../screens/SimSummaryScreen'
import { useGameStore } from '../store/gameStore'
import { PendingScreen } from '../../domain/enums'
import { getCurrentAttention } from '../../domain/services/attentionRouter'

const PENDING_SCREEN_ROUTES: Partial<Record<PendingScreen, string>> = {
  [PendingScreen.HalfTimeSummary]: '/game/half-time-summary',
  [PendingScreen.PlayoffIntro]:    '/game/playoff-intro',
  [PendingScreen.QFSummary]:       '/game/qf-summary',
  [PendingScreen.SeasonSummary]:   '/game/season-summary',
}

function DashboardOrPortal() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()
  const redirected = useRef(false)

  const attention = game ? getCurrentAttention(game) : { kind: 'idle' as const }
  const pendingScreen = attention.kind === 'screen' ? attention.screen : null

  // B6: rensa redirected.current när pendingScreen försvinner, så nästa pendingScreen triggar useEffect
  useEffect(() => {
    if (attention.kind !== 'screen') {
      redirected.current = false
    }
  }, [attention.kind])

  useEffect(() => {
    if (!game || redirected.current || !pendingScreen) return
    const route = PENDING_SCREEN_ROUTES[pendingScreen]
    if (route) { redirected.current = true; navigate(route, { replace: true }) }
  }, [game, pendingScreen, navigate])

  if (!game) return <PortalScreen />

  if (attention.kind === 'scene') return <SceneScreen />
  return <PortalScreen />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <NavigateSetter />
      <Routes>
        <Route path="/" element={<IntroSequence />} />
        <Route path="/new-game" element={<NameInputScreen />} />
        <Route path="/club-selection" element={<ClubSelectionScreen />} />
        <Route path="/game" element={<GameShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOrPortal />} />
          <Route path="squad" element={<SquadScreen />} />
          <Route path="match" element={<MatchScreen />} />
          <Route path="match/live" element={<MatchLiveScreen />} />
          <Route path="transfers" element={<TransfersScreen />} />
          <Route path="club" element={<ClubScreen />} />
          <Route path="tabell" element={<TabellScreen />} />
          <Route path="champion" element={<ChampionScreen />} />
          <Route path="season-summary" element={<SeasonSummaryScreen />} />
          <Route path="season-summary/:season" element={<SeasonSummaryScreen />} />
          <Route path="inbox" element={<InboxScreen />} />

          <Route path="history" element={<HistoryScreen />} />
          <Route path="half-time-summary" element={<HalfTimeSummaryScreen />} />
          <Route path="playoff-intro" element={<PlayoffIntroScreen />} />
          <Route path="qf-summary" element={<QFSummaryScreen />} />
          <Route path="sim-summary" element={<SimSummaryScreen />} />
          <Route path="taktik" element={<TaktikScreen />} />
          <Route path="review" element={<GranskaScreen />} />
        </Route>
        <Route element={<GameGuard />}>
          <Route path="/game/round-summary" element={<RoundSummaryScreen />} />
          <Route path="/game/match-result" element={<MatchResultScreen />} />
          <Route path="/game/game-over" element={<GameOverScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
