export type TransferWindowStatus = 'open' | 'winter' | 'closed'

export interface TransferWindowInfo {
  status: TransferWindowStatus
  label: string
  description: string
}

export function getTransferWindowStatus(currentDate: string): TransferWindowInfo {
  const date = new Date(currentDate)
  const month = date.getMonth() + 1 // 1-12

  // Winter window: January 1–31
  if (month === 1) {
    return {
      status: 'winter',
      label: 'Vintermarknad öppen',
      description: 'Januarifönstret är öppet. Värva och sälj spelare till och med 31 jan.',
    }
  }

  // Main summer window: May 1 – September 30
  if (month >= 5 && month <= 9) {
    return {
      status: 'open',
      label: 'Transfermarknad öppen',
      description: 'Sommarfönstret är öppet. Stärk truppen inför nästa säsong.',
    }
  }

  // Closed during season (Oct–Dec, Feb–Apr)
  const nextOpen = month >= 10
    ? 'maj nästa år'
    : month >= 2 && month <= 4
    ? 'maj'
    : 'maj'
  return {
    status: 'closed',
    label: 'Transfermarknad stängd',
    description: `Marknaden öppnar i ${nextOpen}. Kontraktsförlängningar kan alltid göras.`,
  }
}
