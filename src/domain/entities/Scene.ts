/**
 * Scene-entitet — narrativa scener som tar över hela viewport
 * mellan rundor. Triggas av sceneTriggerService, plockas upp av
 * AppRouter via game.pendingScene.
 */

export type SceneId =
  | 'sunday_training'
  | 'sm_final_victory'
  | 'coffee_room'
  | 'journalist_relationship'
  | 'season_signature_reveal'
  | 'board_meeting'
  | 'cup_intro'
  | 'cup_final_intro'

export type SceneTrigger =
  | { kind: 'first_round_of_season' }
  | { kind: 'sm_final_won' }
  | { kind: 'matchday_reached'; matchday: number }

export interface SceneChoice {
  id: string
  label: string
  effectDescription?: string
}

export interface PendingScene {
  sceneId: SceneId
  triggeredAt: string  // ISO-datum, samma format som game.currentDate
}
