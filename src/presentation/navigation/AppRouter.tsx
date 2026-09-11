import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { PwaUpdateBanner } from '../components/PwaUpdateBanner'
import { SaveConflictModal } from '../components/SaveConflictModal'
import { SaveRecoveryBanner } from '../components/SaveRecoveryBanner'
import { RuleVersionNotice } from '../components/RuleVersionNotice'
import { AttentionBridge } from '../components/AttentionBridge'
import { AnalyticsBridge } from '../components/AnalyticsBridge'

const DevScenesScreen = import.meta.env.DEV
  ? lazy(() => import('../screens/dev/DevScenesScreen').then(m => ({ default: m.DevScenesScreen })))
  : null
import { setGlobalNavigate } from './globalNavigate'

function NavigateSetter() {
  const nav = useNavigate()
  useEffect(() => {
    setGlobalNavigate((path, opts) => nav(path, opts ?? {}))
  }, [nav])
  return null
}
import { NameInputScreen } from '../screens/NameInputScreen'
import { SaveManagerScreen } from '../screens/SaveManagerScreen'
import { ClubSelectionScreen } from '../screens/ClubSelectionScreen'
import { IntroSequence } from '../screens/IntroSequence'
import { ArrivalScene } from '../screens/ArrivalScene'
import { GameShell, GameGuard } from './GameShell'
import { PortalScreen } from '../screens/PortalScreen'
import { SceneScreen } from '../screens/scenes/SceneScreen'
import { MatchScreen } from '../screens/MatchScreen'
import { ClubScreen } from '../screens/ClubScreen'
import { ChampionScreen } from '../screens/ChampionScreen'
import { SeasonContractDemandsScreen } from '../screens/SeasonContractDemandsScreen'
import { SeasonTransitionScene } from '../screens/scenes/SeasonTransitionScene'

import { CareerBreakScreen } from '../screens/CareerBreakScreen'
import { GranskaScreen } from '../screens/granska/GranskaScreen'
import { TaktikScreen } from '../screens/TaktikScreen'
import FacilityScreen from '../screens/FacilityScreen'
import HallProvningScreen from '../screens/HallProvningScreen'

import { HalfTimeSummaryScreen } from '../screens/HalfTimeSummaryScreen'
import { PlayoffIntroScreen } from '../screens/PlayoffIntroScreen'
import { QFSummaryScreen } from '../screens/QFSummaryScreen'
import { SimSummaryScreen } from '../screens/SimSummaryScreen'
import { useGameStore } from '../store/gameStore'
import { PendingScreen } from '../../domain/enums'
import { getCurrentAttention } from '../../domain/services/attentionRouter'
import { CoffeeRoomScene } from '../screens/scenes/CoffeeRoomScene'
import { getPendingScreenRedirect } from './pendingScreenRedirect'

// Pass 2 (CODE_KORORDER_GENOMGANG_2026-09-12 §1): route-lazy tunga skärmar +
// matchbundeln (MatchLiveScreen + matchCore/matchEngine + components/match/*)
// som en egen chunk — huvudchunken var 2,79 MB, en fil.
const EmptyFallback = () => <div style={{ height: '100%', background: 'var(--bg)' }} />

const SquadScreen = lazy(() => import('../screens/SquadScreen').then(m => ({ default: m.SquadScreen })))
const TransfersScreen = lazy(() => import('../screens/TransfersScreen').then(m => ({ default: m.TransfersScreen })))
const TabellScreen = lazy(() => import('../screens/TabellScreen').then(m => ({ default: m.TabellScreen })))
const SeasonSummaryScreen = lazy(() => import('../screens/SeasonSummaryScreen').then(m => ({ default: m.SeasonSummaryScreen })))
const InboxScreen = lazy(() => import('../screens/InboxScreen').then(m => ({ default: m.InboxScreen })))
const HistoryScreen = lazy(() => import('../screens/HistoryScreen').then(m => ({ default: m.HistoryScreen })))
const GameOverScreen = lazy(() => import('../screens/GameOverScreen').then(m => ({ default: m.GameOverScreen })))
const TilltradeScreen = lazy(() => import('../screens/TilltradeScreen').then(m => ({ default: m.TilltradeScreen })))
const MatchLiveScreen = lazy(() => import('../screens/match/MatchLiveScreen').then(m => ({ default: m.MatchLiveScreen })))

// 3.3 (SLUTTEST_KO.md, 2026-08-17) Kontrakt A — "SE KARRIÄREN" måste kunna
// visa historik för en avslutad (managerFired) karriär. GameShell redirectar
// bort managerFired-spel innan /game/history hinner rendera, så denna rutten
// hänger under samma GameGuard som game-over (bara kollar !game, inte
// managerFired) istället. Snapshot fångas i route-state av GameOverScreen;
// efter sidladdning faller HistoryScreen tillbaka till rehydrerad live-save.
function FiredCareerHistoryScreen() {
  const location = useLocation()
  const snapshot = (location.state as { snapshot?: import('../../domain/entities/SaveGame').SaveGame } | null)?.snapshot
  return (
    <Suspense fallback={<EmptyFallback />}>
      <HistoryScreen snapshot={snapshot} />
    </Suspense>
  )
}

function DashboardOrPortal() {
  const game = useGameStore(s => s.game)
  const completeScene = useGameStore(s => s.completeScene)
  const navigate = useNavigate()
  const redirectedScreen = useRef<PendingScreen | null>(null)

  const attention = game ? getCurrentAttention(game) : { kind: 'idle' as const }
  const pendingScreen = attention.kind === 'screen' ? attention.screen : null

  // B6: rensa vakten när skärmflödet tar slut. Själva skärmens identitet
  // ligger i refen så en direkt QF-summary → season-summary-kedja också
  // räknas som ett nytt omdirigeringsmål.
  useEffect(() => {
    if (attention.kind !== 'screen') {
      redirectedScreen.current = null
    }
  }, [attention.kind])

  useEffect(() => {
    if (!game) return
    const route = getPendingScreenRedirect(redirectedScreen.current, pendingScreen)
    if (route && pendingScreen) {
      redirectedScreen.current = pendingScreen
      navigate(route, { replace: true })
    }
  }, [game, pendingScreen, navigate])

  if (!game) return <PortalScreen />

  // Ny spelare som ännu inte kört Tillträdet-onboarding (strict false — old saves saknar flaggan och ska slippa)
  // M1 (audit 5c9a7a8, 2026-08-24): denna gren kunde tidigare BARA skicka till
  // /tilltrade, aldrig till /intro — en spelare som avbröt MITT I Ankomsten
  // (t.ex. via byte till annan save och tillbaka) landade på /tilltrade och
  // hoppade över Ankomsten helt, inte bara "fel steg i Ankomsten". game.
  // onboardingScreen (satt av createNewGame/migrationen) avgör nu vilken av
  // de två skärmarna som faktiskt är näst på tur.
  if (game.onboardingComplete === false) {
    return <Navigate to={game.onboardingScreen === 'arrival' ? '/intro' : '/tilltrade'} replace />
  }

  // coffee_room renders as modal over dashboard — other scenes are full-screen (FIX-41)
  if (attention.kind === 'scene' && game.pendingScene?.sceneId === 'coffee_room') {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <PortalScreen />
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(10,9,8,0.72)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            width: '100%', maxHeight: '90vh', overflowY: 'auto',
            borderRadius: '14px 14px 0 0',
            background: 'var(--bg-scene)',
          }}>
            <CoffeeRoomScene game={game} onComplete={() => completeScene('coffee_room')} />
          </div>
        </div>
      </div>
    )
  }

  if (attention.kind === 'scene') return <SceneScreen />
  return <PortalScreen />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <NavigateSetter />
      <AttentionBridge />
      <AnalyticsBridge />
      <Routes>
        <Route path="/" element={<IntroSequence />} />
        <Route path="/saves" element={<SaveManagerScreen />} />
        <Route path="/new-game" element={<NameInputScreen />} />
        <Route path="/club-selection" element={<ClubSelectionScreen />} />
        <Route path="/intro" element={<ArrivalScene />} />
        <Route path="/tilltrade" element={<Suspense fallback={<EmptyFallback />}><TilltradeScreen /></Suspense>} />
        <Route path="/game" element={<GameShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOrPortal />} />
          <Route path="squad" element={<Suspense fallback={<EmptyFallback />}><SquadScreen /></Suspense>} />
          <Route path="match" element={<MatchScreen />} />
          <Route path="match/live" element={<Suspense fallback={<EmptyFallback />}><MatchLiveScreen /></Suspense>} />
          <Route path="transfers" element={<Suspense fallback={<EmptyFallback />}><TransfersScreen /></Suspense>} />
          <Route path="club" element={<ClubScreen />} />
          <Route path="tabell" element={<Suspense fallback={<EmptyFallback />}><TabellScreen /></Suspense>} />
          <Route path="champion" element={<ChampionScreen />} />
          <Route path="season-summary" element={<Suspense fallback={<EmptyFallback />}><SeasonSummaryScreen /></Suspense>} />
          <Route path="season-summary/:season" element={<Suspense fallback={<EmptyFallback />}><SeasonSummaryScreen /></Suspense>} />
          <Route path="contract-demands" element={<SeasonContractDemandsScreen />} />
          <Route path="season-transition" element={<SeasonTransitionScene />} />
          <Route path="inbox" element={<Suspense fallback={<EmptyFallback />}><InboxScreen /></Suspense>} />

          <Route path="history" element={<Suspense fallback={<EmptyFallback />}><HistoryScreen /></Suspense>} />
          <Route path="half-time-summary" element={<HalfTimeSummaryScreen />} />
          <Route path="playoff-intro" element={<PlayoffIntroScreen />} />
          <Route path="qf-summary" element={<QFSummaryScreen />} />
          <Route path="sim-summary" element={<SimSummaryScreen />} />
          <Route path="taktik" element={<TaktikScreen />} />
          <Route path="review" element={<GranskaScreen />} />
          {/* Klubb → Bygget är den kanoniska fliken. Båda rutterna nedan är
              push-/bakåtkompatibla djuplänkar och renderar därför tillbaka-pil. */}
          <Route path="bygget" element={<FacilityScreen />} />
          <Route path="facility" element={<FacilityScreen />} />
          <Route path="hall-provning" element={<HallProvningScreen />} />
        </Route>
        <Route element={<GameGuard />}>
          <Route path="/game/game-over" element={<Suspense fallback={<EmptyFallback />}><GameOverScreen /></Suspense>} />
          <Route path="/game/game-over/historik" element={<FiredCareerHistoryScreen />} />
          {/* O13 (DOM_TRANARMARKNADEN_2026-08-26): ligger under GameGuard, inte
              GameShell — GameShell redirectar bort varje managerFired-spel till
              /game/game-over, och uppehållet ÄR ett managerFired-spel. Samma
              motivering som game-over/historik ovan. */}
          <Route path="/game/career-break" element={<CareerBreakScreen />} />
        </Route>
        {import.meta.env.DEV && DevScenesScreen && (
          <Route path="/dev/scenes" element={
            <Suspense fallback={null}><DevScenesScreen /></Suspense>
          } />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* DOM_FEEDBACKKNAPP_PLACERING_2026-09-08: FeedbackButton monteras inte
          längre globalt här — den är nu en dockad sidfotsrad, och behöver
          GameShell.tsx:s hideBottomNav/pathname-kontext för att reservera
          riktig layoutplats åt sig själv (se GameShell.tsx). */}
      <PwaUpdateBanner />
      <RuleVersionNotice />
      {/* U7: global eftersom persist-hydreringen kan fallera före en route
          eller en aktiv game-state alls finns att rendera mot. */}
      <SaveRecoveryBanner />
      {/* M2: route-oberoende — en konflikt kan upptäckas på VILKEN skärm som
          helst (GameShell/GameGuard täcker bara /game/*, inte t.ex. /saves
          eller /intro). Läser saveConflict direkt ur gameStore. */}
      <SaveConflictModal />
    </BrowserRouter>
  )
}
