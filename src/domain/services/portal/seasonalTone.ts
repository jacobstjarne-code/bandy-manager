export interface SeasonalTone {
  bgPrimary: string       // huvudbakgrund
  bgSurface: string       // kortbakgrund
  bgElevated: string      // upphöjd bakgrund
  accentTone: string      // accent-färg som kan skifta något
}

interface Keyframe {
  dayOfSeason: number
  /** CSS-token-prefix, t.ex. 'nov' → --season-tone-nov-bg-primary i global.css. */
  label: string
  tone: SeasonalTone
}

// 5 keyframes — säsongen räknas från 1 november (dayOfSeason = 0)
// Anchors: Nov 1 = 0, Annandagen Dec 26 ≈ 55, djup vinter Jan ≈ 90, mars slutspel ≈ 130
//
// D-ST1 (väg A, 2026-07-02): literalerna nedan är FALLBACK — den auditbara
// sanningen bor som --season-tone-{label}-* i global.css (§ "Portal seasonal
// tone"-blocket). getResolvedKeyframes() läser CSS:t via getComputedStyle vid
// första anropet i en riktig browser; i test/SSR (ingen CSS laddad i DOM)
// faller den tillbaka till dessa literaler. Håll dem IDENTISKA med CSS:t —
// annars divergerar browser- och testbeteende tyst.
const SEASON_KEYFRAMES: Keyframe[] = [
  {
    dayOfSeason: 0,
    label: 'nov',
    tone: {
      bgPrimary:  '#1a1612',  // november-uppstart, varm och mörk
      bgSurface:  '#221d18',
      bgElevated: '#2a241e',
      accentTone: '#b8884c',
    },
  },
  {
    dayOfSeason: 55,
    label: 'annandagen',
    tone: {
      bgPrimary:  '#161411',  // annandagen dec 26, kyligare
      bgSurface:  '#1d1813',
      bgElevated: '#251f19',
      accentTone: '#a87c42',
    },
  },
  {
    dayOfSeason: 90,
    label: 'djupvinter',
    tone: {
      bgPrimary:  '#13110f',  // djup vinter januari
      bgSurface:  '#191613',
      bgElevated: '#201c17',
      accentTone: '#9a7244',
    },
  },
  {
    dayOfSeason: 130,
    label: 'slutspel',
    tone: {
      bgPrimary:  '#161210',  // slutspelsskärpa mars
      bgSurface:  '#1e1915',
      bgElevated: '#26201b',
      accentTone: '#c89048',
    },
  },
  {
    dayOfSeason: 180,
    label: 'sommar',
    tone: {
      bgPrimary:  '#1a1612',  // sommarpaus, mjuk igen
      bgSurface:  '#221d18',
      bgElevated: '#2a241e',
      accentTone: '#b0804a',
    },
  },
]

let resolvedKeyframesCache: Keyframe[] | null = null

/**
 * Läser de 5 ankarnas källvärden ur global.css (--season-tone-{label}-*) via
 * getComputedStyle, en gång, cachat. Faller tillbaka till SEASON_KEYFRAMES-
 * literalerna om document saknas (SSR) eller CSS:t inte gav ett värde (test-
 * miljö utan laddad CSS) — osynligt i praktiken eftersom literalerna SKA
 * spegla CSS:t exakt.
 */
function getResolvedKeyframes(): Keyframe[] {
  if (resolvedKeyframesCache) return resolvedKeyframesCache
  if (typeof document === 'undefined') {
    resolvedKeyframesCache = SEASON_KEYFRAMES
    return resolvedKeyframesCache
  }
  const styles = getComputedStyle(document.documentElement)
  const readVar = (label: string, suffix: string, fallback: string): string => {
    const v = styles.getPropertyValue(`--season-tone-${label}-${suffix}`).trim()
    return v.length > 0 ? v : fallback
  }
  resolvedKeyframesCache = SEASON_KEYFRAMES.map(kf => ({
    dayOfSeason: kf.dayOfSeason,
    label: kf.label,
    tone: {
      bgPrimary:  readVar(kf.label, 'bg-primary',  kf.tone.bgPrimary),
      bgSurface:  readVar(kf.label, 'bg-surface',  kf.tone.bgSurface),
      bgElevated: readVar(kf.label, 'bg-elevated', kf.tone.bgElevated),
      accentTone: readVar(kf.label, 'accent',      kf.tone.accentTone),
    },
  }))
  return resolvedKeyframesCache
}

/**
 * Returnerar interpolerade CSS-färgvärden baserat på dag i säsongen.
 * Säsongen räknas från 1 november (dayOfSeason = 0) — samma bas som seasonCalendar.
 * Nov 1 = 0, Dec 26 ≈ 55, Feb 28 ≈ 119, tredje lör mars ≈ ~135.
 */
export function getSeasonalTone(date: string): SeasonalTone {
  const day = dayOfSeason(date)
  const keyframes = getResolvedKeyframes()

  // Hitta de två keyframes som omger day
  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i]
    const to = keyframes[i + 1]
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
  return keyframes[keyframes.length - 1].tone
}

/** Beräkna dagar sedan 1 november aktuell/föregående säsong.
 *  Nov 1 = 0, Dec 26 ≈ 55, Jan 1 ≈ 61, tredje lör mars ≈ ~132.
 *  Säsongsstart = 1 november föregående år om vi är jan-mars (liga-säsong), annars aktuellt år. */
function dayOfSeason(date: string): number {
  const d = new Date(date)
  const month = d.getMonth() + 1  // 1-12
  const year = d.getFullYear()

  // Säsongsstart = 1 november föregående år om vi är jan-okt, annars aktuellt år (nov-dec)
  const seasonStartYear = month >= 11 ? year : year - 1
  const seasonStart = new Date(`${seasonStartYear}-11-01`)

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
