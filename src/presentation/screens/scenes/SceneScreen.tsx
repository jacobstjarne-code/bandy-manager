/**
 * SceneScreen — orkestrator för scen-systemet.
 * Plockar pendingScene från store, rutar till rätt scen-komponent
 * och anropar completeScene när spelaren tar beslut/CTA.
 *
 * Detta är ENDA komponenten i scenes-mappen som rör useGameStore.
 */

import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { SundayTrainingScene } from './SundayTrainingScene'
import { SMFinalVictoryScene } from './SMFinalVictoryScene'
import { CoffeeRoomScene } from './CoffeeRoomScene'
import { JournalistRelationshipScene } from './JournalistRelationshipScene'
import { SeasonSignatureRevealScene } from './SeasonSignatureRevealScene'

export function SceneScreen() {
  const game = useGameStore(s => s.game)
  const completeScene = useGameStore(s => s.completeScene)

  if (!game?.pendingScene) return <Navigate to="/game/dashboard" replace />

  const sceneId = game.pendingScene.sceneId

  const handleComplete = (choiceId?: string) => {
    completeScene(sceneId, choiceId)
  }

  switch (sceneId) {
    case 'sunday_training':
      return <SundayTrainingScene game={game} onComplete={handleComplete} />
    case 'sm_final_victory':
      return <SMFinalVictoryScene game={game} onComplete={() => handleComplete()} />
    case 'coffee_room':
      return <CoffeeRoomScene game={game} onComplete={() => handleComplete()} />
    case 'journalist_relationship':
      return <JournalistRelationshipScene game={game} onComplete={() => handleComplete()} />
    case 'season_signature_reveal':
      return <SeasonSignatureRevealScene game={game} onComplete={() => handleComplete()} />
    default:
      return <Navigate to="/game/dashboard" replace />
  }
}
