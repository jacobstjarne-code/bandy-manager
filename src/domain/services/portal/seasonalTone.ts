export interface SeasonalTone {
  bgPrimary: string       // huvudbakgrund
  bgSurface: string       // kortbakgrund
  bgElevated: string      // upphöjd bakgrund
  accentTone: string      // accent-färg som kan skifta något
}

interface Keyframe {
  dayOfSeason: number
  tone: SeasonalTone
}

// 5 keyframes — säsongen räknas från 1 september (dayOfSeason = 0)
const SEASON_KEYFRAMES: Keyframe[] = [
  {
    dayOfSeason: 0,
    tone: {
      bgPrimary:  '#1a1612',  // varm höst
      bgSurface:  '#221d18',
      bgElevated: '#2a241e',
      accentTone: '#b8884c',
    },
  },
  {
    dayOfSeason: 60,
    tone: {
      bgPrimary:  '#161411',  // kyligare november
      bgSurface:  '#1d1813',
      bgElevated: '#251f19',
      accentTone: '#a87c42',
    },
  },
  {
    dayOfSeason: 120,
    tone: {
      bgPrimary:  '#13110f',  // djup vinter januari
      bgSurface:  '#191613',
      bgElevated: '#201c17',
      accentTone: '#9a7244',
    },
  },
  {
    dayOfSeason: 180,
    tone: {
      bgPrimary:  '#161210',  // slutspelsskärpa mars
      bgSurface:  '#1e1915',
      bgElevated: '#26201b',
      accentTone: '#c89048',
    },
  },
  {
    dayOfSeason: 240,
    tone: {
      bgPrimary:  '#1a1612',  // sista resterna maj — mjuk igen
      bgSurface:  '#221d18',
      bgElevated: '#2a241e',
      accentTone: '#b0804a',
    },
  },
]

/**
 * Returnerar interpolerade CSS-färgvärden baserat på dag i säsongen.
 * Säsongen räknas från 1 september (dayOfSeason = 0).
 */
export function getSeasonalTone(date: string): SeasonalTone {
  const day = dayOfSeason(date)

  // Hitta de två keyframes som omger day
  for (let i = 0; i < SEASON_KEYFRAMES.length - 1; i++) {
    const from = SEASON_KEYFRAMES[i]
    const to = SEASON_KEYFRAMES[i + 1]
    if (day >= from.dayOfSeason && day <= to.dayOfSeason) {
      const range = to.dayOfSeason - from.dayOfSeason
      const t = range === 0 ? 0 : (day - from.dayOfSeason) / range
      return {
        bgPrimary:  lerpColor(from.tone.bgPrimary,  to.tone.bgPrimary,  t),
        bgSurface:  lerpColor(from.tone.bgSurface,  to.tone.bgSurface,  t),
        bgElevated: lerpColor(from.tone.bgElevated, to.tone.bgElevated, t),
        accentTone: lerpColor(from.tone.accentTone, to.tone.accentTone, t),
      }
    }
  }

  // Utanför definierat intervall — returnera sista keyframe
  return SEASON_KEYFRAMES[SEASON_KEYFRAMES.length - 1].tone
}

/** Beräkna dagar sedan 1 september aktuell/föregående säsong. */
function dayOfSeason(date: string): number {
  const d = new Date(date)
  const month = d.getMonth() + 1  // 1-12
  const year = d.getFullYear()

  // Säsongsstart = 1 september föregående år om vi är jan-aug, annars aktuellt år
  const seasonStartYear = month >= 9 ? year : year - 1
  const seasonStart = new Date(`${seasonStartYear}-09-01`)

  const diff = Math.round((d.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

/** Linjär interpolering mellan två hex-färger. */
function lerpColor(from: string, to: string, t: number): string {
  const fr = parseHex(from)
  const tr = parseHex(to)
  const r = Math.round(fr.r + (tr.r - fr.r) * t)
  const g = Math.round(fr.g + (tr.g - fr.g) * t)
  const b = Math.round(fr.b + (tr.b - fr.b) * t)
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function toHex(n: number): string {
  return Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0')
}
