import type { Finding, Report } from './types'
import { runCardPadding } from './rules/cardPadding'
import { runSectionLabels } from './rules/sectionLabels'
import { runHexColors } from './rules/hexColors'
import { runGridGaps } from './rules/gridGaps'
import { runChevronButtons } from './rules/chevronButtons'
import { runEmojiConsistency } from './rules/emojiConsistency'
import { runFontSizes } from './rules/fontSizes'
import { runOverlaps } from './rules/overlaps'
import { consoleErrors } from './rules/consoleErrors'
import { formatReport } from './reporter'

type RuleFn = (root: HTMLElement) => Finding[]

const ALL_RULES: Record<string, RuleFn> = {
  cardPadding: runCardPadding,
  sectionLabels: runSectionLabels,
  hexColors: runHexColors,
  gridGaps: runGridGaps,
  chevronButtons: runChevronButtons,
  emojiConsistency: runEmojiConsistency,
  fontSizes: runFontSizes,
  overlaps: runOverlaps,
  consoleErrors: consoleErrors.getFindings,
}

interface AuditOptions {
  format?: 'text' | 'json'
  rules?: string[]
}

export async function runAudit(options?: AuditOptions): Promise<Report | string> {
  // Wait for paint so overlaps rule sees final layout
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  const root = document.body
  const screenPath = window.location.pathname
  const rulesToRun = options?.rules ?? Object.keys(ALL_RULES)

  const allFindings: Finding[] = []
  for (const ruleName of rulesToRun) {
    const rule = ALL_RULES[ruleName]
    if (rule) allFindings.push(...rule(root))
  }

  const byRule: Record<string, number> = {}
  const bySeverity: Record<string, number> = { error: 0, warn: 0, info: 0 }

  for (const f of allFindings) {
    byRule[f.rule] = (byRule[f.rule] ?? 0) + 1
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1
  }

  const report: Report = {
    timestamp: new Date().toISOString(),
    screenPath,
    totalFindings: allFindings.length,
    byRule,
    bySeverity: bySeverity as Report['bySeverity'],
    findings: allFindings,
  }

  if (options?.format === 'text') return formatReport(report)
  return report
}
