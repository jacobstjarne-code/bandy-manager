import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StartScreen } from '../screens/StartScreen'
import { NewGameScreen } from '../screens/NewGameScreen'
import { GameShell } from './GameShell'
import { DashboardScreen } from '../screens/DashboardScreen'
import { SquadScreen } from '../screens/SquadScreen'
import { MatchScreen } from '../screens/MatchScreen'
import { MatchLiveScreen } from '../screens/MatchLiveScreen'
import { TransfersScreen } from '../screens/TransfersScreen'
import { ClubScreen } from '../screens/ClubScreen'
import { TabellScreen } from '../screens/TabellScreen'
import { ChampionScreen } from '../screens/ChampionScreen'
import { SeasonSummaryScreen } from '../screens/SeasonSummaryScreen'
import { InboxScreen } from '../screens/InboxScreen'
import { EventScreen } from '../screens/EventScreen'
import { MatchResultScreen } from '../screens/MatchResultScreen'
import { BoardMeetingScreen } from '../screens/BoardMeetingScreen'
import { GameOverScreen } from '../screens/GameOverScreen'
import { BandyDoktorScreen } from '../screens/BandyDoktorScreen'
import { HistoryScreen } from '../screens/HistoryScreen'
import { PreSeasonScreen } from '../screens/PreSeasonScreen'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/new-game" element={<NewGameScreen />} />
        <Route path="/game" element={<GameShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardScreen />} />
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
          <Route path="doctor" element={<BandyDoktorScreen />} />
          <Route path="history" element={<HistoryScreen />} />
          <Route path="pre-season" element={<PreSeasonScreen />} />
        </Route>
        <Route path="/game/events" element={<EventScreen />} />
        <Route path="/game/match-result" element={<MatchResultScreen />} />
        <Route path="/game/board-meeting" element={<BoardMeetingScreen />} />
        <Route path="/game/game-over" element={<GameOverScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
