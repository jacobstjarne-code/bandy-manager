/**
 * Logo-komponent med stöd för mörk/ljus variant.
 *
 * variant='dark'  — original-logon, för ljusa ytor (ej använt i appen ännu)
 * variant='light' — krämvit variant via CSS-filter, för mörka läderytor
 *
 * TODO(FAS 3): byt CSS-filter-variant mot riktig inverted logo-asset
 * när brand-assets levereras · se BRAND-BRIEF.md
 */

interface LogoProps {
  variant?: 'dark' | 'light'
  height?: number
  style?: React.CSSProperties
}

export function Logo({ variant = 'light', height = 26, style }: LogoProps) {
  const filterStyle: React.CSSProperties = variant === 'light'
    ? { filter: 'brightness(0) invert(1) sepia(1) saturate(0.3) brightness(0.95)', opacity: 0.85 }
    : { opacity: 1 }

  return (
    <img
      src="/bandymanager-logo.png"
      alt="Bandy Manager"
      style={{ height, width: 'auto', ...filterStyle, ...style }}
    />
  )
}
