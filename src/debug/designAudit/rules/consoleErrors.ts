import type { Finding } from '../types'

interface ConsoleEntry {
  level: 'error' | 'warn'
  msg: string
}

const buffer: ConsoleEntry[] = []

const origError = console.error.bind(console)
const origWarn = console.warn.bind(console)

console.error = (...args: unknown[]) => {
  buffer.push({ level: 'error', msg: args.map(String).join(' ') })
  origError(...args)
}

console.warn = (...args: unknown[]) => {
  buffer.push({ level: 'warn', msg: args.map(String).join(' ') })
  origWarn(...args)
}

if (typeof window !== 'undefined') {
  ;(window as any).__clearAuditBuffer = () => { buffer.length = 0 }
}

export const consoleErrors = {
  getFindings(_root: HTMLElement): Finding[] {
    return buffer.map(entry => {
      const isInfiniteLoop = entry.msg.includes('Minimum update depth exceeded')
      return {
        rule: isInfiniteLoop ? 'reactInfiniteLoop' : 'consoleErrors',
        severity: entry.level === 'error' ? 'error' as const : 'warn' as const,
        message: isInfiniteLoop
          ? `React infinite loop detectad (LESSONS #3 / #7)`
          : `Console ${entry.level}: ${entry.msg.slice(0, 100)}`,
        selector: 'console',
        actual: entry.msg.slice(0, 200),
        expected: 'inga console.error / console.warn',
        screenPath: typeof window !== 'undefined' ? window.location.pathname : '',
      }
    })
  }
}
