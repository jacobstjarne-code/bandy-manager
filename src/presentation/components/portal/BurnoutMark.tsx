import { getBurnoutZone, getManagerDisplayName, isBurnoutRelapse, BURNOUT_MARK_FIRED_KEY } from '../../../domain/services/managerProfileService'
import { BURNOUT_MARK, BURNOUT_MARK_RELAPSE, BURNOUT_CAUSE_LINES } from '../../../domain/data/managerKaraktarText'
import { pickBurnoutQuoteIndex, pickBurnoutHelperIndex, pickBurnoutRelapseQuoteIndex, pickBurnoutRelapseHelperIndex } from '../../../domain/services/burnoutReliefService'
import { wasLoggedThisRound } from '../../../domain/services/narrativeLogService'
import type { CardRenderProps } from '../../../domain/services/portal/dashboardCardBag'

export function BurnoutMark({ game }: CardRenderProps) {
  const profile = game.managerProfile
  if (!profile) return null
  // HIGH 10-FÖLJDFIX (2026-08-30): shouldShowBurnoutMark(profile) skulle
  // ALLTID ge nej här — roundProcessor stämplar lastShownBurnoutZone till
  // nuvarande zon i samma steg som beslutet fattas, så re-körning av samma
  // predikat mot det lagrade tillståndet jämför zonen mot sig själv. Läs
  // istället narrativeBeatLog-posten roundProcessor skrev NÄR beaten fyrade.
  if (!wasLoggedThisRound(game, BURNOUT_MARK_FIRED_KEY, game.currentMatchday)) return null

  // A-H4a (SEXSÄSONGSAUDITEN 2026-08-26, docs/incoming/BANDY_MANAGER_AUDIT_
  // 6_SASONGER_2026-08-26.md #H4): den gamla `round % quotes.length` var
  // exakt den "platta pool"-lösning managerKaraktarText.ts:s egen kommentar
  // (rad 38-40) redan flaggade som en fallback som skulle migreras — en
  // envis burnout-zon (många omgångar i rad) fick den lilla poolen (5/2
  // rader) att cykla och kännas som tapet. pickBurnoutQuoteIndex/
  // pickBurnoutHelperIndex läser narrativeBeatLog och undviker rader som
  // redan visats DENNA säsong. Skrivsidan: roundProcessor.ts, samma
  // omgång som burnoutScore uppdateras.
  const zone = getBurnoutZone(profile.burnoutScore)
  if (zone === 'frisk') return null

  // Återfalls-läsningen (2026-09-02, Opus dom) — säsongsöverskridande, se
  // isBurnoutRelapse (managerProfileService.ts). Måste spegla EXAKT samma
  // useRelapse-avgörande som roundProcessor.ts:s skrivsida (samma relapse-
  // status, samma "tom pool degraderar till intro"-golv), annars visas ett
  // citat ur en pool ingen semanticKey loggades för.
  const relapse = isBurnoutRelapse(profile, game.currentSeason, game.eventLedger)
  const relapseQuotePool = BURNOUT_MARK_RELAPSE.quotesByZone[zone]
  const relapseHelperPool = BURNOUT_MARK_RELAPSE.helpersByZone[zone]
  const useRelapse = relapse && relapseQuotePool.length > 0 && relapseHelperPool.length > 0

  const quotes = useRelapse ? relapseQuotePool : BURNOUT_MARK.quotesByZone[zone]
  const helpers = useRelapse ? relapseHelperPool : BURNOUT_MARK.helpersByZone[zone]
  const quoteIdx = useRelapse
    ? pickBurnoutRelapseQuoteIndex(game, zone, quotes.length)
    : pickBurnoutQuoteIndex(game, zone, quotes.length)
  const helperIdx = useRelapse
    ? pickBurnoutRelapseHelperIndex(game, zone, helpers.length)
    : pickBurnoutHelperIndex(game, zone, helpers.length)
  const quote = quotes[quoteIdx]
  const helper = helpers[helperIdx]
  const eyebrow = BURNOUT_MARK.eyebrow.replace('{manager}', getManagerDisplayName(game))

  // HIGH 10 punkt 1 (DOM_HIGH10_BURNOUT_BAGE_2026-08-29) — synlig orsak.
  // Poolerna är tomma tills Opus skriver dem; tom pool = raden utelämnas,
  // vilket är ett normalt tillstånd här, inte ett fel.
  const causePool = profile.lastBurnoutCause ? BURNOUT_CAUSE_LINES[profile.lastBurnoutCause] : []
  const causeLine = causePool.length > 0 ? causePool[0] : null

  return (
    <div className="portal-phasemark" style={{ borderColor: 'var(--danger)' }}>
      <div className="portal-phasemark-eyebrow" style={{ color: 'var(--danger)' }}>{eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      <div className="portal-phasemark-helper">{helper}</div>
      {causeLine && <div className="portal-phasemark-helper">{causeLine}</div>}
    </div>
  )
}
