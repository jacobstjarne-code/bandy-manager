import { getCurrentLeagueRound, getSeasonPhase, isManagedClubInPlayoff, type SeasonPhase } from '../../../domain/data/seasonPhases'
import { SEASON_MOOD } from '../../../domain/services/dailyBriefingService'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

const PHASEMARK_LABELS: Partial<Record<SeasonPhase, { eyebrow: string; helper?: string }>> = {
  endgame: {
    eyebrow: '⬩ Slutstriden börjar ⬩',
    helper: 'Tabellen avgör. Visas en gång per säsong.',
  },
  playoff: {
    eyebrow: '⬩ Slutspelet börjar ⬩',
    helper: 'Portal har stramat åt — bara det viktiga nu.',
  },
}

export function PortalPhaseMark({ game }: Props) {
  const currentLigaRound = getCurrentLeagueRound(game)
  const isPlayoff = isManagedClubInPlayoff(game)
  const phase = getSeasonPhase(currentLigaRound, isPlayoff)

  const seen = game.phaseMarksSeen ?? []
  if (seen.includes(phase)) return null
  const labels = PHASEMARK_LABELS[phase]
  if (!labels) return null
  const quote = SEASON_MOOD[phase]?.[0] ?? ''
  if (!quote) return null

  return (
    <div className="portal-phasemark">
      <div className="portal-phasemark-eyebrow">{labels.eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      {labels.helper && <div className="portal-phasemark-helper">{labels.helper}</div>}
    </div>
  )
}
