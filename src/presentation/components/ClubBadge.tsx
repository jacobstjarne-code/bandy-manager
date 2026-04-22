type Symbol =
  | 'hammer' | 'star' | 'crown' | 'river' | 'shield'
  | 'mountain' | 'elk' | 'axe' | 'tower' | 'wave' | 'tree' | 'bear'

const CLUB_BADGES: Record<string, { primary: string; secondary: string; symbol: Symbol }> = {
  'club_forsbacka': { primary: '#1e4d8c', secondary: '#C47A3A', symbol: 'hammer' },
  'club_soderfors':    { primary: '#1a237e', secondary: '#E8D080', symbol: 'star' },
  'club_vastanfors':  { primary: '#006400', secondary: '#FFFFFF', symbol: 'crown' },
  'club_karlsborg':   { primary: '#8B0000', secondary: '#FFFFFF', symbol: 'river' },
  'club_malilla':     { primary: '#4A0080', secondary: '#C47A3A', symbol: 'shield' },
  'club_gagnef':     { primary: '#CC0000', secondary: '#FFFFFF', symbol: 'mountain' },
  'club_halleforsnas':   { primary: '#2E7D32', secondary: '#FFFFFF', symbol: 'elk' },
  'club_lesjofors':    { primary: '#FF6600', secondary: '#000000', symbol: 'axe' },
  'club_rogle': { primary: '#333333', secondary: '#C47A3A', symbol: 'tower' },
  'club_slottsbron':   { primary: '#0066CC', secondary: '#FFFFFF', symbol: 'wave' },
  'club_skutskar':  { primary: '#006633', secondary: '#E8D080', symbol: 'tree' },
  'club_heros':{ primary: '#990000', secondary: '#FFFFFF', symbol: 'bear' },
}

// Shield path for 64×64 viewBox
const SHIELD_PATH = 'M32 2 L58 12 V32 C58 46 46 54 32 60 C18 54 6 46 6 32 V12 Z'

function deterministicColor(name: string): string {
  const colors = ['#1e4d8c', '#7b2d2d', '#1a5e3a', '#5a2d7a', '#8B6914']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  }
  return colors[hash % colors.length]
}

// TODO(FAS 4): byt mot riktig klubblogga · se CLUB-BRIEF.md
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
  /** Stroke color around shield — copper for home, muted for away */
  strokeColor?: string
}

export function ClubBadge({ clubId, name, size = 40, strokeColor }: ClubBadgeProps) {
  const badge = CLUB_BADGES[clubId]
  const gradId = `badge-grad-${clubId || name}`
  const stroke = strokeColor ?? 'rgba(196,122,58,0.5)'

  if (!badge) {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <radialGradient id={`${gradId}-fb`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={deterministicColor(name)} stopOpacity="1"/>
            <stop offset="100%" stopColor={deterministicColor(name)} stopOpacity="0.7"/>
          </radialGradient>
          <clipPath id={`${gradId}-clip`}>
            <path d={SHIELD_PATH}/>
          </clipPath>
        </defs>
        <path d={SHIELD_PATH} fill={`url(#${gradId}-fb)`}/>
        <path d={SHIELD_PATH} fill="black" opacity="0.2"/>
        <path d={SHIELD_PATH} fill="none" stroke={stroke} strokeWidth="1.5"/>
        <text
          x="32" y="38"
          textAnchor="middle"
          fill="#F5F1EB"
          fontSize="22"
          fontWeight="800"
          fontFamily="Georgia, serif"
          clipPath={`url(#${gradId}-clip)`}
        >
          {name.charAt(0).toUpperCase()}
        </text>
      </svg>
    )
  }

  const { primary, secondary, symbol } = badge

  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={primary} stopOpacity="1"/>
          <stop offset="100%" stopColor={primary} stopOpacity="0.7"/>
        </radialGradient>
        <clipPath id={`${gradId}-clip`}>
          <path d={SHIELD_PATH}/>
        </clipPath>
      </defs>
      {/* Shield background */}
      <path d={SHIELD_PATH} fill={`url(#${gradId})`}/>
      <path d={SHIELD_PATH} fill="black" opacity="0.2"/>
      {/* Symbol — clipped to shield shape */}
      <g clipPath={`url(#${gradId}-clip)`}>
        {renderSymbol(symbol, primary, secondary)}
      </g>
      {/* Shield border */}
      <path d={SHIELD_PATH} fill="none" stroke={stroke} strokeWidth="1.5"/>
      {/* Inner line for depth */}
      <path
        d="M32 6 L54 15 V32 C54 44 43 51 32 57 C21 51 10 44 10 32 V15 Z"
        fill="none"
        stroke={secondary}
        strokeWidth="0.5"
        opacity="0.2"
      />
    </svg>
  )
}
