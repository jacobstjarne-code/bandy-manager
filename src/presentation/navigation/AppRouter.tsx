import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { setGlobalNavigate } from './globalNavigate'

function NavigateSetter() {
  const nav = useNavigate()
  useEffect(() => {
    setGlobalNavigate((path, opts) => nav(path, opts ?? {}))
  }, [nav])
  return null
}
import { NewGameScreen } from '../screens/NewGameScreen'
import { NameInputScreen } from '../screens/NameInputScreen'
import { ClubSelectionScreen } from '../screens/ClubSelectionScreen'
import { IntroSequence } from '../screens/IntroSequence'
import { GameShell, GameGuard } from './GameShell'
import { PortalScreen } from '../screens/PortalScreen'
import { SceneScreen } from '../screens/scenes/SceneScreen'
import { SquadScreen } from '../screens/SquadScreen'
import { MatchScreen } from '../screens/MatchScreen'
import { MatchLiveScreen } from '../screens/MatchLiveScreen'
import { TransfersScreen } from '../screens/TransfersScreen'
import { ClubScreen } from '../screens/ClubScreen'
import { TabellScreen } from '../screens/TabellScreen'
import { ChampionScreen } from '../screens/ChampionScreen'
import { SeasonSummaryScreen } from '../screens/SeasonSummaryScreen'
import { InboxScreen } from '../screens/InboxScreen'

import { MatchResultScreen } from '../screens/MatchResultScreen'
import { BoardMeetingScreen } from '../screens/BoardMeetingScreen'
import { GameOverScreen } from '../screens/GameOverScreen'
import { GranskaScreen } from '../screens/GranskaScreen'
import { TaktikScreen } from '../screens/TaktikScreen'

import { HistoryScreen } from '../screens/HistoryScreen'
import { PreSeasonScreen } from '../screens/PreSeasonScreen'
import { HalfTimeSummaryScreen } from '../screens/HalfTimeSummaryScreen'
import { PlayoffIntroScreen } from '../screens/PlayoffIntroScreen'
import { QFSummaryScreen } from '../screens/QFSummaryScreen'
import { RoundSummaryScreen } from '../screens/RoundSummaryScreen'
import { SimSummaryScreen } from '../screens/SimSummaryScreen'
import { useGameStore } from '../store/gameStore'

function BoardMeetingGuard() {
  const game = useGameStore(s => s.game)
  if (!game) return <Navigate to="/" replace />
  return <BoardMeetingScreen />
}

function DashboardOrPortal() {
  const game = useGameStore(s => s.game)
  if (game?.pendingScene) return <SceneScreen />
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
        <Route path="/new-game-legacy" element={<NewGameScreen />} />
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
          <Route path="pre-season" element={<PreSeasonScreen />} />
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
        <Route path="/game/board-meeting" element={<BoardMeetingGuard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
