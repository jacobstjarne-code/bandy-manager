export type CoachPersonality = 'calm' | 'sharp' | 'jovial' | 'grumpy' | 'philosophical'
export type CoachBackground = 'former-player' | 'academy-coach' | 'tactician' | 'veteran'

export interface AssistantCoach {
  name: string
  age: number
  personality: CoachPersonality
  background: CoachBackground
  initials: string
}
