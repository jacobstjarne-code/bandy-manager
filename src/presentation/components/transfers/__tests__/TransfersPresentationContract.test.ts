import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const TRANSFER_FILES = [
  'src/presentation/screens/TransfersScreen.tsx',
  'src/presentation/components/portal/SponsorCounterModal.tsx',
  'src/presentation/components/transfers/BidModal.tsx',
  'src/presentation/components/transfers/ContractsTab.tsx',
  'src/presentation/components/transfers/FreeAgentList.tsx',
  'src/presentation/components/transfers/IncomingBidCard.tsx',
  'src/presentation/components/transfers/RenewContractModal.tsx',
  'src/presentation/components/transfers/ScoutingTab.tsx',
  'src/presentation/components/transfers/TransferPlayerCard.tsx',
  'src/presentation/components/transfers/WageOverrunWarning.tsx',
] as const

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function withoutComments(value: string): string {
  return value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

describe('transferdomänens presentationskontrakt', () => {
  it('har bara den datadrivna attributstapelns inline-style kvar', () => {
    const occurrences = TRANSFER_FILES.flatMap(path =>
      [...source(path).matchAll(/\bstyle=\{\{/g)].map(match => ({ path, index: match.index })),
    )

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].path).toBe('src/presentation/components/transfers/ScoutingTab.tsx')
    expect(source(occurrences[0].path).slice(occurrences[0].index, occurrences[0].index + 60))
      .toContain('width: `${value}%`')
  })

  it('använder inte auditens chrome-emoji i renderad transferkod', () => {
    const renderedSource = TRANSFER_FILES.map(path => withoutComments(source(path))).join('\n')

    expect(renderedSource).not.toMatch(/[📋😤🔻💰📤🔥🔍🚨⚠️✅❌✕✓]/u)
  })
})
