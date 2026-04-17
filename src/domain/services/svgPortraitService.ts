/**
 * Genererar inline SVG-porträtt per spelare — deterministiskt, inga externa assets.
 * Baserat på spelare-ID + ålder + position.
 * ~600 unika kombinationer.
 */

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

interface PortraitParams {
  faceShape: number           // 0=rund, 1=oval, 2=kantig
  hairColor: string
  hairStyle: 'short' | 'medium' | 'long' | 'bald'
  skinTone: string
  hasBeard: boolean
  hasStubble: boolean
  eyebrowThick: boolean
  hash: number
}

function buildFaceEl(p: PortraitParams): string {
  if (p.faceShape === 0) return `<circle cx="32" cy="33" r="13" fill="${p.skinTone}"/>`
  if (p.faceShape === 1) return `<ellipse cx="32" cy="34" rx="11" ry="14" fill="${p.skinTone}"/>`
  return `<rect x="19" y="20" width="26" height="28" rx="8" fill="${p.skinTone}"/>`
}

function buildHairSides(p: PortraitParams): string {
  if (p.hairStyle === 'bald' || p.hairStyle === 'short') return ''
  if (p.hairStyle === 'medium') {
    return `<rect x="15" y="28" width="6" height="12" rx="3" fill="${p.hairColor}"/>
<rect x="43" y="28" width="6" height="12" rx="3" fill="${p.hairColor}"/>`
  }
  // long
  return `<rect x="14" y="26" width="7" height="18" rx="3" fill="${p.hairColor}"/>
<rect x="43" y="26" width="7" height="18" rx="3" fill="${p.hairColor}"/>`
}

function buildHairCap(p: PortraitParams): string {
  if (p.hairStyle === 'bald') {
    return `<ellipse cx="32" cy="22" rx="13" ry="4" fill="${p.skinTone}" opacity="0.4"/>`
  }
  if (p.hairStyle === 'short')  return `<ellipse cx="32" cy="21" rx="13" ry="7" fill="${p.hairColor}"/>`
  if (p.hairStyle === 'medium') return `<ellipse cx="32" cy="20" rx="13" ry="8" fill="${p.hairColor}"/>`
  return `<ellipse cx="32" cy="19" rx="13" ry="9" fill="${p.hairColor}"/>`
}

function buildFacialHair(p: PortraitParams): string {
  if (p.hasBeard) {
    return `<ellipse cx="32" cy="44" rx="9" ry="5" fill="${p.hairColor}" opacity="0.7"/>`
  }
  if (p.hasStubble) {
    return `<ellipse cx="32" cy="44" rx="8" ry="3" fill="${p.hairColor}" opacity="0.28"/>`
  }
  return ''
}

function buildSvg(p: PortraitParams): string {
  const eyebrowH = p.eyebrowThick ? 2.5 : 1.5
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" fill="#18130F" rx="32"/>
  <rect x="27" y="47" width="10" height="10" rx="3" fill="${p.skinTone}"/>
  ${buildHairSides(p)}
  ${buildFaceEl(p)}
  <rect x="22" y="27" width="8" height="${eyebrowH}" rx="1" fill="${p.hairColor}" opacity="0.85"/>
  <rect x="34" y="27" width="8" height="${eyebrowH}" rx="1" fill="${p.hairColor}" opacity="0.85"/>
  <circle cx="26" cy="33" r="2.5" fill="#18130F"/>
  <circle cx="38" cy="33" r="2.5" fill="#18130F"/>
  <circle cx="26.8" cy="32.2" r="0.9" fill="rgba(255,255,255,0.6)"/>
  <circle cx="38.8" cy="32.2" r="0.9" fill="rgba(255,255,255,0.6)"/>
  <path d="M29 42 q3 2 6 0" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round"/>
  ${buildFacialHair(p)}
  ${buildHairCap(p)}
</svg>`
}

export function generatePlayerPortrait(playerId: string, age: number, _position: string): string {
  const hash = simpleHash(playerId)

  const faceShape = hash % 3

  const hairColors = ['#2C2820', '#5C4A3A', '#8B7355', '#C4A87C', '#D4C4A8']
  const hairColor = hairColors[hash % hairColors.length]

  const hairStyle: PortraitParams['hairStyle'] =
    age >= 32 ? ((hash % 2 === 0) ? 'short' : 'bald')
    : age >= 25 ? ((hash % 3 === 0) ? 'medium' : 'short')
    : (hash % 4 === 0) ? 'long' : 'medium'

  const skinTones = ['#F5DEB3', '#DEB887', '#D2B48C', '#C4A87C', '#A08060']
  const skinTone = skinTones[(hash >> 4) % skinTones.length]

  const hasBeard = age >= 24 && (hash >> 8) % 3 === 0
  const hasStubble = !hasBeard && age >= 22 && (hash >> 6) % 2 === 0
  const eyebrowThick = (hash >> 2) % 2 === 0

  return buildSvg({ faceShape, hairColor, hairStyle, skinTone, hasBeard, hasStubble, eyebrowThick, hash })
}
