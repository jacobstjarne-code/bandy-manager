export type Severity = 'error' | 'warn' | 'info'

export interface Finding {
  rule: string
  severity: Severity
  message: string
  selector: string
  component?: string
  actual: string
  expected: string
  screenPath: string
}

export interface Report {
  timestamp: string
  screenPath: string
  totalFindings: number
  byRule: Record<string, number>
  bySeverity: Record<Severity, number>
  findings: Finding[]
}
