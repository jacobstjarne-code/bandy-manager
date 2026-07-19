import { getCurrentLeagueRound, getFunctionaryPhase, isManagedClubInPlayoff } from '../../../domain/data/seasonPhases'
import { pickPhaseMarkCopy } from '../../../domain/data/phaseMarkText'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

// 2026-07-19: migrerad från getSeasonPhase (3-fas) till getFunctionaryPhase
// (7-fas, samma system som portalBuilder.ts/seasonPhaseBias.ts sedan B1).
// Bara annandagen/vinterkris/våroffensiv/slutspurt/playoff har en markör —
// höststart/höst/vinter bär ingen egen vikt (ruling 2026-07-19). 'endgame'
// finns inte längre i det här systemet, se phaseMarkText.ts.
export function PortalPhaseMark({ game }: Props) {
  const currentLigaRound = getCurrentLeagueRound(game)
  const isPlayoff = isManagedClubInPlayoff(game)
  // tablePosition-konventionen speglar portalBuilder.ts/functionaryQuoteService.ts:
  // fallback mittenplacering om standings saknar klubben.
  const tablePosition = game.standings.find(s => s.clubId === game.managedClubId)?.position
    ?? Math.ceil(game.clubs.length / 2)
  const phase = isPlayoff ? 'playoff' : getFunctionaryPhase(currentLigaRound, tablePosition, game.clubs.length)

  const seen = game.phaseMarksSeen ?? []
  if (seen.includes(phase)) return null

  const copy = pickPhaseMarkCopy(phase, game)
  if (!copy) return null

  return (
    <div className="portal-phasemark">
      <div className="portal-phasemark-eyebrow">{copy.eyebrow}</div>
      <div className="portal-phasemark-quote">"{copy.quote}"</div>
      <div className="portal-phasemark-helper">{copy.helper}</div>
    </div>
  )
}
