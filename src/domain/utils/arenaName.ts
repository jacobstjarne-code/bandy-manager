export function formatArenaName(stadium: string): string {
  if (!stadium) return ''
  const lower = stadium.toLowerCase()
  const alreadyHasSuffix =
    lower.endsWith(' arena') ||
    lower.endsWith('vallen') ||
    lower.endsWith('hallen') ||
    lower.endsWith('planen')
  return alreadyHasSuffix ? stadium : `${stadium} arena`
}
