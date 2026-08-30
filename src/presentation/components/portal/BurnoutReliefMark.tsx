import { BURNOUT_RELIEF_FIRED_KEY, BURNOUT_CLOSE_FIRED_KEY } from '../../../domain/services/managerProfileService'
import { BURNOUT_RELIEF_LINES, BURNOUT_CLOSE_LINES } from '../../../domain/data/managerKaraktarText'
import { wasLoggedThisRound } from '../../../domain/services/narrativeLogService'
import type { CardRenderProps } from '../../../domain/services/portal/dashboardCardBag'

/**
 * HIGH 10 (DOM_HIGH10_BURNOUT_BAGE_2026-08-29.md, punkt 3 och 4) — bågens
 * andra halva. BurnoutMark bär eskaleringen (danger); det här kortet bär
 * lättnaden och slutet, i success-ton.
 *
 * Slutbeaten går FÖRE lättnadsbeaten: har zonen nått 'frisk' är bågen sluten,
 * och då ska inte ett "det lättar"-mellansteg visas i stället.
 *
 * Texterna är Opus bord och poolerna är tomma tills dess. Tom pool ⇒ kortet
 * returnerar null helt, även när villkoret är sant — mekaniken är fullt wirad
 * och kortet tänds av sig självt i samma stund arrayen fylls, utan någon
 * ytterligare kodändring.
 */
export function BurnoutReliefMark({ game }: CardRenderProps) {
  const profile = game.managerProfile
  if (!profile) return null

  // HIGH 10-FÖLJDFIX (2026-08-30): shouldShowBurnoutRelief/Close(profile)
  // skulle ALLTID ge nej här, av samma skäl som BurnoutMark.tsx — se den
  // filens motsvarande kommentar. Läs narrativeBeatLog istället.
  const isClose = wasLoggedThisRound(game, BURNOUT_CLOSE_FIRED_KEY, game.currentMatchday)
  const isRelief = !isClose && wasLoggedThisRound(game, BURNOUT_RELIEF_FIRED_KEY, game.currentMatchday)
  if (!isClose && !isRelief) return null

  const pool = isClose ? BURNOUT_CLOSE_LINES : BURNOUT_RELIEF_LINES
  if (pool.length === 0) return null

  // Ingen eyebrow: BURNOUT_MARK.eyebrow ("{manager} är trött") är
  // eskaleringens rubrik och skulle motsäga lättnaden. En egen rubrik är
  // svensk speltext och därmed Opus bord — kortet klarar sig utan tills
  // dess.
  const line = pool[0]

  return (
    <div className="portal-phasemark" style={{ borderColor: 'var(--success)' }}>
      <div className="portal-phasemark-quote">"{line}"</div>
    </div>
  )
}
