export type TransferWindowStatus = 'open' | 'winter' | 'closed'

export interface TransferWindowInfo {
  status: TransferWindowStatus
  label: string
  description: string
}

export function getTransferWindowStatus(currentDate: string): TransferWindowInfo {
  const date = new Date(currentDate)
  const month = date.getMonth() + 1

  // Pre-season + early season: Aug–Oct
  if (month >= 8 && month <= 10) {
    return {
      status: 'open',
      label: 'Transfermarknad öppen',
      description: 'Försäsongsfönstret är öppet. Stärk truppen inför säsongen.',
    }
  }

  // Winter window: January
  if (month === 1) {
    return {
      status: 'winter',
      label: 'Vintermarknad öppen',
      description: 'Januarifönstret är öppet. Sista chansen att förstärka inför slutspurten.',
    }
  }

  // Closed: Nov–Dec, Feb–Jul
  const nextOpen = month >= 11 ? 'januari'
    : month >= 2 && month <= 7 ? 'augusti'
    : 'augusti'
  return {
    status: 'closed',
    label: 'Transfermarknad stängd',
    description: `Marknaden öppnar i ${nextOpen}. Scouting och kontraktsförlängningar kan alltid göras.`,
  }
}
