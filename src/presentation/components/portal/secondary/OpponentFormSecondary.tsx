import type { CardRenderProps } from '../portalTypes'
import { getFormResults } from '../../../utils/formUtils'
import { getCurrentLeaguePosition } from '../../../../domain/services/standingsService'
import { getRivalry } from '../../../../domain/data/rivalries'
import { ScoreBlock } from '../../primitives/ScoreBlock'
import type { ScoreBlockVariant } from '../../primitives/ScoreBlock'

function resultToVariant(result: 'V' | 'O' | 'F', opponentId: string, managedId: string): ScoreBlockVariant {
  if (getRivalry(managedId, opponentId)) return 'derby'
  if (result === 'V') return 'win'
  if (result === 'F') return 'loss'
  return 'draw'
}

function positionLabel(position: number): string {
  if (position === 1) return '1:a'
  if (position === 2) return '2:a'
  if (position === 3) return '3:e'
  return `${position}:e`
}

// 2 poäng för vinst, 1 för oavgjort (bandyns poängsystem, inte fotbollens 3).
function resultPoints(result: 'V' | 'O' | 'F'): number {
  return result === 'V' ? 2 : result === 'O' ? 1 : 0
}

/**
 * Trendläsning ur de fem senaste (recent-först): jämför snittpoängen i de
 * två senaste matcherna mot de två äldsta i fönstret — mittenmatchen (index 2
 * vid full längd) utelämnas medvetet för att undvika att en enda match
 * avgör riktningen. Kräver minst 4 matcher, annars ingen läsning (portal-
 * hierarki-domen: recederande sekundär, ingen fabricerad signal på tunt underlag).
 */
function formTrend(results: { result: 'V' | 'O' | 'F' }[]): { arrow: string; label: string } | null {
  if (results.length < 4) return null
  const avg = (window: { result: 'V' | 'O' | 'F' }[]) =>
    window.reduce((sum, r) => sum + resultPoints(r.result), 0) / window.length
  const recent = avg(results.slice(0, 2))
  const older = avg(results.slice(-2))
  if (recent > older) return { arrow: '↗', label: 'Stigande' }
  if (recent < older) return { arrow: '↘', label: 'Fallande' }
  return { arrow: '→', label: 'Stabil' }
}

/** Secondary-kort: motståndarens senaste 5 matcher. */
export function OpponentFormSecondary({ game }: CardRenderProps) {
  const managedId = game.managedClubId

  const nextFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  if (!nextFixture) return null

  const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  if (!opponent) return null

  const opponentLeaguePosition = getCurrentLeaguePosition(opponentId, game)
  const recentForm = getFormResults(opponentId, game.fixtures, game.clubs)
  if (recentForm.length === 0) return null

  const last5 = recentForm.slice(0, 5)
  const opponentPoints = game.standings.find(s => s.clubId === opponentId)?.points ?? 0
  const trend = formTrend(last5)

  return (
    <div className="portal-secondary-card opponent-form-card">
      <span className="portal-card-stripe portal-card-stripe-copper-dim" />
      <div className="opponent-form-heading">
        <div>
          <div className="portal-card-eyebrow">Motståndaren</div>
          <div className="opponent-form-title">{opponent.name}</div>
        </div>
        {opponentLeaguePosition !== null && (
          <div className="opponent-form-standing" aria-label={`${positionLabel(opponentLeaguePosition)}, ${opponentPoints} poäng`}>
            <strong>{positionLabel(opponentLeaguePosition)}</strong>
            <span>{opponentPoints} p</span>
          </div>
        )}
      </div>
      <div className="opponent-form-results" aria-label="Motståndarens fem senaste matcher, senaste först">
        {last5.map((r, i) => (
          <div className="opponent-form-result" key={`${r.opponentId ?? r.opponent}-${i}`}>
            <ScoreBlock
              score={r.score}
              label={r.opponent}
              variant={resultToVariant(r.result, r.opponentId ?? '', managedId)}
              compact
            />
          </div>
        ))}
      </div>
      <div className="h-micro opponent-form-order">
        {trend && <span className="opponent-form-trend">{trend.arrow} {trend.label} · </span>}
        Senaste matchen först
      </div>
    </div>
  )
}
