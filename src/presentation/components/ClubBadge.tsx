type Symbol =
  | 'hammer' | 'star' | 'crown' | 'river' | 'shield'
  | 'mountain' | 'elk' | 'axe' | 'tower' | 'wave' | 'tree' | 'bear'

const CLUB_BADGES: Record<string, { primary: string; secondary: string; symbol: Symbol }> = {
  'club_sandviken': { primary: '#1e4d8c', secondary: '#C9A84C', symbol: 'hammer' },
  'club_sirius':    { primary: '#1a237e', secondary: '#FFD700', symbol: 'star' },
  'club_vasteras':  { primary: '#006400', secondary: '#FFFFFF', symbol: 'crown' },
  'club_broberg':   { primary: '#8B0000', secondary: '#FFFFFF', symbol: 'river' },
  'club_villa':     { primary: '#4A0080', secondary: '#C9A84C', symbol: 'shield' },
  'club_falun':     { primary: '#CC0000', secondary: '#FFFFFF', symbol: 'mountain' },
  'club_ljusdal':   { primary: '#2E7D32', secondary: '#FFFFFF', symbol: 'elk' },
  'club_edsbyn':    { primary: '#FF6600', secondary: '#000000', symbol: 'axe' },
  'club_tillberga': { primary: '#333333', secondary: '#C9A84C', symbol: 'tower' },
  'club_kungalv':   { primary: '#0066CC', secondary: '#FFFFFF', symbol: 'wave' },
  'club_skutskar':  { primary: '#006633', secondary: '#FFD700', symbol: 'tree' },
  'club_soderhamns':{ primary: '#990000', secondary: '#FFFFFF', symbol: 'bear' },
}

function deterministicColor(name: string): string {
  const colors = ['#1e4d8c', '#7b2d2d', '#1a5e3a', '#5a2d7a', '#8B6914']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  }
  return colors[hash % colors.length]
}

function renderSymbol(symbol: Symbol, primary: string, secondary: string) {
  switch (symbol) {
    case 'tree':
      return (
        <>
          <rect x="29" y="40" width="6" height="8" fill={secondary} opacity="0.9"/>
          <polygon points="32,14 22,32 42,32" fill={secondary} opacity="0.95"/>
          <polygon points="32,20 20,40 44,40" fill={secondary} opacity="0.9"/>
        </>
      )
    case 'mountain':
      return (
        <>
          <polygon points="20,42 32,18 44,42" fill={secondary} opacity="0.9"/>
          <polygon points="28,42 38,26 48,42" fill={secondary} opacity="0.7"/>
        </>
      )
    case 'river':
      return (
        <>
          <path d="M16,26 Q22,22 28,26 Q34,30 40,26 Q46,22 50,26" stroke={secondary} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M16,33 Q22,29 28,33 Q34,37 40,33 Q46,29 50,33" stroke={secondary} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M16,40 Q22,36 28,40 Q34,44 40,40 Q46,36 50,40" stroke={secondary} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>
      )
    case 'hammer':
      return (
        <>
          <rect x="28" y="18" width="8" height="20" rx="2" fill={secondary} opacity="0.9" transform="rotate(-40 32 32)"/>
          <rect x="20" y="14" width="14" height="7" rx="2" fill={secondary} transform="rotate(-40 32 32)"/>
          <rect x="28" y="18" width="8" height="20" rx="2" fill={secondary} opacity="0.7" transform="rotate(40 32 32)"/>
          <rect x="20" y="14" width="14" height="7" rx="2" fill={secondary} opacity="0.7" transform="rotate(40 32 32)"/>
        </>
      )
    case 'star':
      return (
        <polygon points="32,14 35.5,24.5 47,24.5 37.5,30.5 41,41 32,35 23,41 26.5,30.5 17,24.5 28.5,24.5" fill={secondary} opacity="0.95"/>
      )
    case 'shield':
      return (
        <>
          <path d="M32,14 L46,20 L46,34 Q46,44 32,50 Q18,44 18,34 L18,20 Z" fill={secondary} opacity="0.85"/>
          <path d="M32,19 L41,24 L41,33 Q41,40 32,45 Q23,40 23,33 L23,24 Z" fill={primary} opacity="0.6"/>
        </>
      )
    case 'crown':
      return (
        <>
          <path d="M18,38 L18,24 L24,30 L32,18 L40,30 L46,24 L46,38 Z" fill={secondary} opacity="0.9"/>
          <rect x="18" y="38" width="28" height="6" rx="1" fill={secondary} opacity="0.9"/>
        </>
      )
    case 'elk':
      return (
        <>
          <ellipse cx="32" cy="36" rx="12" ry="8" fill={secondary} opacity="0.9"/>
          <path d="M26,28 Q28,22 32,20 Q36,22 36,28" fill={secondary} opacity="0.9"/>
          <path d="M28,20 L24,14 M24,14 L20,12 M24,14 L22,18" stroke={secondary} strokeWidth="2" fill="none"/>
          <path d="M36,20 L40,14 M40,14 L44,12 M40,14 L42,18" stroke={secondary} strokeWidth="2" fill="none"/>
          <rect x="24" y="43" width="4" height="8" rx="1" fill={secondary} opacity="0.8"/>
          <rect x="36" y="43" width="4" height="8" rx="1" fill={secondary} opacity="0.8"/>
        </>
      )
    case 'axe':
      return (
        <>
          <rect x="30" y="18" width="4" height="28" rx="2" fill={secondary} opacity="0.9"/>
          <path d="M34,18 L44,14 L44,28 L34,28 Z" fill={secondary} opacity="0.9"/>
        </>
      )
    case 'tower':
      return (
        <>
          <rect x="22" y="30" width="20" height="18" fill={secondary} opacity="0.9"/>
          <rect x="22" y="26" width="5" height="6" fill={secondary} opacity="0.9"/>
          <rect x="29.5" y="26" width="5" height="6" fill={secondary} opacity="0.9"/>
          <rect x="37" y="26" width="5" height="6" fill={secondary} opacity="0.9"/>
          <rect x="29" y="38" width="6" height="10" rx="3" fill={primary} opacity="0.8"/>
          <rect x="30" y="32" width="4" height="4" rx="1" fill={primary} opacity="0.6"/>
        </>
      )
    case 'wave':
      return (
        <>
          <path d="M14,32 Q20,24 26,32 Q32,40 38,32 Q44,24 50,32" stroke={secondary} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M14,40 Q20,32 26,40 Q32,48 38,40 Q44,32 50,40" stroke={secondary} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        </>
      )
    case 'bear':
      return (
        <>
          <circle cx="24" cy="22" r="5" fill={secondary} opacity="0.9"/>
          <circle cx="40" cy="22" r="5" fill={secondary} opacity="0.9"/>
          <ellipse cx="32" cy="34" rx="14" ry="12" fill={secondary} opacity="0.9"/>
          <ellipse cx="32" cy="40" rx="7" ry="5" fill={primary} opacity="0.4"/>
          <circle cx="27" cy="31" r="2.5" fill={primary} opacity="0.7"/>
          <circle cx="37" cy="31" r="2.5" fill={primary} opacity="0.7"/>
        </>
      )
  }
}

interface ClubBadgeProps {
  clubId: string
  name: string
  size?: number
}

export function ClubBadge({ clubId, name, size = 40 }: ClubBadgeProps) {
  const badge = CLUB_BADGES[clubId]
  const gradId = `badge-grad-${clubId || name}`

  if (!badge) {
    // Fallback: deterministic color + initial letter
    return (
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="32" r="30" fill={deterministicColor(name)}/>
        <circle cx="32" cy="32" r="30" fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity="0.3"/>
        <text x="32" y="38" textAnchor="middle" fill="#F0F4F8" fontSize="22" fontWeight="800">
          {name.charAt(0).toUpperCase()}
        </text>
      </svg>
    )
  }

  const { primary, secondary, symbol } = badge

  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={primary} stopOpacity="1"/>
          <stop offset="100%" stopColor={primary} stopOpacity="0.6"/>
        </radialGradient>
      </defs>
      {/* Dark overlay for depth effect */}
      <circle cx="32" cy="32" r="30" fill={`url(#${gradId})`}/>
      <circle cx="32" cy="32" r="30" fill="black" opacity="0.25"/>
      {/* Gold ring */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity="0.4"/>
      {/* Inner ring */}
      <circle cx="32" cy="32" r="26" fill="none" stroke={secondary} strokeWidth="0.5" opacity="0.2"/>
      {/* Symbol */}
      {renderSymbol(symbol, primary, secondary)}
    </svg>
  )
}
