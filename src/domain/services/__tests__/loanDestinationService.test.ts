import { describe, expect, it } from 'vitest'
import { externalLoanDestinationId, migrateLoanDestinationId } from '../loanDestinationService'

describe('låneklubbens stabila identitet', () => {
  it('skapar deterministiska externa id:n utan föreningssuffix', () => {
    expect(externalLoanDestinationId('Tillberga IK')).toBe('ext:tillberga')
    expect(externalLoanDestinationId('Bollnäs GIF')).toBe('ext:bollnas')
    expect(externalLoanDestinationId('Delsbo IF')).toBe('ext:delsbo')
    expect(externalLoanDestinationId('Norrby IF')).toBe('ext:norrby')
  })

  it('migrerar bara Skutskärsaliaset till den riktiga klubbens id', () => {
    expect(migrateLoanDestinationId('Skutskärs IF')).toBe('club_skutskar')
    expect(migrateLoanDestinationId('Tillberga IK')).toBe('ext:tillberga')
  })
})
