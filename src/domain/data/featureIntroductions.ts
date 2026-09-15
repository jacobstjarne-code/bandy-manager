import type { SaveGame } from '../entities/SaveGame'
import { isVoiceIntroduced, politicianVoiceId } from '../services/voiceIntroductionService'
import { TAB_INTROS } from './tabIntros'

/**
 * First entrances for operational systems that are not already taught inside
 * Tillträdet or opened by their own full-screen story scene.
 */
export const FEATURE_INTRODUCTIONS = {
  training: 'Här bestämmer vi vad laget jobbar med mellan matcherna. Fokus formar spelarna, intensiteten avgör hur mycket vi får ut — och hur hårt det sliter.',
  economy: 'Här är klubbens pengar och åtaganden. Börja med kassan och lönerna. Övriga intäkter får namn först när kontakten bakom dem finns.',
  tactics: 'Startelvan satte vi ihop. Hur den spelar bestämmer du. Ta formation och grundidé först, finliret kan vänta tills du känner laget.',
  contracts: 'Här ser du vilka som är på väg ur avtal. Väntar vi för länge går de gratis.',
  academy: 'Det här är spelarna under A-laget. Följ dem här. När någon är redo ger du honom chansen i seniortruppen.',
  transferMarket: 'Här är spelarna som faktiskt kan byta klubb. Ett bud är början på en förhandling, inte en klar värvning.',
  scouting: 'Scouten gör två saker: synar en spelare du redan känner till, eller letar nya namn efter dina krav. Båda tar tid och kostar scoutbudget.',
  facilitySeasonOne: 'Första säsongen bygger vi ingenting. Vi ska först se vad klubben faktiskt saknar. Efter säsongen kallar styrelsen dig till Valet — då börjar Bygget på riktigt.',
  // begriplighet-klass-e: dessa tre återanvänder den redan låsta flikcopyn.
  // Första besöket får därmed en röst utan en parallell textkälla som kan
  // glida från den permanenta hjälpraden efter kvittering.
  community: TAB_INTROS.orten.text,
  freeAgents: TAB_INTROS.freeagents.text,
  sellPlayers: TAB_INTROS.sell.text,
} as const

export type FeatureIntroductionId = keyof typeof FEATURE_INTRODUCTIONS

export interface FeatureIntroductionSpeaker {
  speaker: string
  role: string
}

/**
 * Orten ägs av kommunrösten, men får aldrig föregripa personens kanoniska
 * entré. Före mötet visar fliken bara sin neutrala TabIntro; efter mötet kan
 * den namngivna rösten bära funktionsintroduktionen.
 */
export function getCommunityFeatureIntroductionSpeaker(game: SaveGame): FeatureIntroductionSpeaker | null {
  const politician = game.localPolitician
  if (!politician) return null
  const voiceId = politicianVoiceId(
    game.managedClubId,
    politician.mandatExpires ?? game.currentSeason,
  )
  if (!isVoiceIntroduced(game, voiceId)) return null
  return { speaker: politician.name, role: politician.title }
}
