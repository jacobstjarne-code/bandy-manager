import { useGameStore } from '../../store/gameStore'
import { getSeasonPhase, isManagedClubInPlayoff, type SeasonPhase } from '../../../domain/data/seasonPhases'
import { SEASON_MOOD } from '../../../domain/services/dailyBriefingService'
import { FixtureStatus } from '../../../domain/enums'
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
  const markPhaseAcknowledged = useGameStore(s => s.markPhaseAcknowledged)

  // Beräkna fas — samma logik som dailyBriefingService och portalBuilder
  const currentLigaRound = game.fixtures
    .filter(f => f.status === FixtureStatus.Completed && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const isPlayoff = isManagedClubInPlayoff(game)
  const phase = getSeasonPhase(currentLigaRound, isPlayoff)

  const seen = game.phaseMarksSeen ?? []
  if (seen.includes(phase)) return null
  const labels = PHASEMARK_LABELS[phase]
  if (!labels) return null
  const quote = SEASON_MOOD[phase]?.[0] ?? ''
  if (!quote) return null

  return (
    <div className="portal-phasemark" onClick={() => markPhaseAcknowledged(phase)}>
      <div className="portal-phasemark-eyebrow">{labels.eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      {labels.helper && <div className="portal-phasemark-helper">{labels.helper}</div>}
    </div>
  )
}
