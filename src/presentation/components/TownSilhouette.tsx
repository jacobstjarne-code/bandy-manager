interface TownSilhouetteProps {
  clubId: string
  width?: number
  height?: number
}

const SILHOUETTES = [
  // Bruksort
  'M0,50 L5,50 L5,25 L8,25 L8,10 L11,10 L11,25 L25,25 L25,15 L40,15 L40,25 L45,25 L45,50 L55,50 L55,35 L58,35 L58,38 L62,38 L62,35 L65,35 L65,50 L75,50 L78,30 L82,50 L90,50 L92,35 L95,50 L100,50',
  // Dalort
  'M0,50 L10,50 L10,40 L12,40 L12,20 L14,20 L14,40 L16,40 L16,50 L30,50 L30,35 L45,35 L45,50 L55,50 L55,38 L60,38 L60,32 L65,32 L65,38 L70,38 L70,50 L80,50 L100,30',
  // Norrlandsort
  'M0,50 L5,50 L8,30 L11,50 L14,32 L17,50 L20,50 L20,35 L35,35 L38,20 L41,35 L55,35 L55,50 L60,50 L63,28 L66,50 L70,48 L73,25 L76,50 L100,40',
  // Mälardalsort
  'M0,50 L15,50 L15,35 L20,30 L50,30 L55,35 L55,50 L65,50 L65,42 L75,42 L75,50 L85,50 L85,45 L95,45 L95,50 L100,50',
  // Småort
  'M0,50 L10,50 L12,35 L18,35 L20,50 L30,50 L32,40 L34,32 L36,40 L38,50 L50,50 L50,38 L55,30 L60,38 L60,50 L70,50 L72,33 L74,28 L76,33 L78,50 L100,50',
]

export function TownSilhouette({ clubId, width = 100, height = 20 }: TownSilhouetteProps) {
  const hash = clubId.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0)
  const idx = Math.abs(hash) % SILHOUETTES.length
  const path = SILHOUETTES[idx]

  return (
    <svg viewBox="0 0 100 50" width={width} height={height} style={{ opacity: 0.12, display: 'block' }}>
      <path d={path} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" />
    </svg>
  )
}
