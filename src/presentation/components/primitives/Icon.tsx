import type { CSSProperties } from 'react'
import type { LucideIcon as LucideIconType } from 'lucide-react'

interface IconProps {
  icon: LucideIconType
  size?: number
  active?: boolean
  color?: string
  className?: string
  style?: CSSProperties
}

// Kanon: strokeWidth 1.8 / 2.2 (aktiv) — satt i BottomNav.tsx. Denna wrapper
// finns så Lucides default (2.0) inte läcker in i andra ikonanrop.
export function Icon({ icon: LucideIcon, size = 18, active = false, color, className, style }: IconProps) {
  return <LucideIcon size={size} strokeWidth={active ? 2.2 : 1.8} color={color} className={className} style={style} />
}
