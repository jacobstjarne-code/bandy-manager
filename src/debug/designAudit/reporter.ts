import type { Finding, Report } from './types'

export function formatReport(report: Report): string {
  const lines: string[] = []
  lines.push('═══ DESIGN AUDIT ═══')
  lines.push(`Path: ${report.screenPath}`)
  lines.push(report.timestamp)

  const e = report.bySeverity['error'] ?? 0
  const w = report.bySeverity['warn'] ?? 0
  const i = report.bySeverity['info'] ?? 0
  lines.push(`${report.totalFindings} findings (${e} error, ${w} warn, ${i} info)`)
  lines.push('')

  const byRule = new Map<string, Finding[]>()
  for (const f of report.findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, [])
    byRule.get(f.rule)!.push(f)
  }

  for (const [rule, findings] of byRule) {
    lines.push(`── ${rule} (${findings.length} findings) ──`)
    for (const f of findings) {
      const icon = f.severity === 'error' ? '❌' : f.severity === 'warn' ? '⚠️ ' : 'ℹ️ '
      lines.push(`${icon} ${f.message}`)
      lines.push(`   at: ${f.selector}`)
      if (f.component) lines.push(`   component: ${f.component}`)
      lines.push(`   actual: ${f.actual}`)
      if (f.expected) lines.push(`   expected: ${f.expected}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
