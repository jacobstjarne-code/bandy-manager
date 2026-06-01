import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getPlayoffSeriesContext } from '../../../domain/services/portal/playoffSeriesContext'
import { PlayoffRound } from '../../../domain/enums'

interface Props { game: SaveGame }

const ROUND_LABELS: Record<PlayoffRound, string> = {
  [PlayoffRound.QuarterFinal]: 'Kvartsfinal',
  [PlayoffRound.SemiFinal]: 'Semifinal',
  [PlayoffRound.Final]: 'SM-Final',
}

const CRIT_LABELS: Record<'open' | 'matchpuck' | 'decisive', string | null> = {
  open: null,
  matchpuck: 'Matchpuck',
  decisive: 'Avgörande',
}

export function PortalRoundMark({ game }: Props) {
  const ctx = getPlayoffSeriesContext(game)
  if (!ctx) return null
  const isFinal = ctx.round === PlayoffRound.Final
  // C-SD2: kvart + semi → warm-variant (mellansteg mot gold), final → gold
  const toneClass = isFinal ? ' gold' : ' warm'
  const critLabel = CRIT_LABELS[ctx.criticality]
  return (
    <div className={`portal-roundmark${toneClass}`}>
      {ROUND_LABELS[ctx.round]}
      {critLabel && <span className="crit">· {critLabel}</span>}
    </div>
  )
}
