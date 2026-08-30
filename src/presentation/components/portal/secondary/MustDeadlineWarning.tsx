import type { CardRenderProps } from '../portalTypes'
import { getUpcomingMustDeadlines } from '../../../../domain/services/decisionTierService'
import { getMustDeadlineWarningLine } from '../../../../domain/data/mustDeadlineWarningText'

/**
 * HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) + auditens MEDIUM 16 —
 * måste-nivåns förvarning: "Ett måste-event som skulle rinna ut med en
 * oåterkallelig förlust ska dessutom få en förvarning FÖRE fristen."
 *
 * Derivationen (vilka måsten, hur många omgångar kvar) är byggd och testad i
 * decisionTierService.getUpcomingMustDeadlines. RADEN är Opus
 * (mustDeadlineWarningText.ts) och är ännu inte levererad — tills dess
 * returnerar den tom sträng och kortet renderar ingenting. Det är avsiktligt
 * enligt CLAUDE.md:s hårda textregel: hellre en osynlig yta i 24 timmar än
 * Code-skriven svenska som blir kvar.
 */
export function MustDeadlineWarning({ game }: CardRenderProps) {
  const deadlines = getUpcomingMustDeadlines(game)
  if (deadlines.length === 0) return null

  const line = getMustDeadlineWarningLine(deadlines)
  if (!line) return null  // Opus har inte levererat raden ännu

  return (
    <div className="portal-secondary-card">
      <div className="portal-card-stripe portal-card-stripe-warm" />
      <div className="portal-card-eyebrow">Frist</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {line}
      </div>
    </div>
  )
}
