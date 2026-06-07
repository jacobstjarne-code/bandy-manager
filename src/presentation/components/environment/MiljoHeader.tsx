import { useState } from 'react'
import { getSeasonalTone } from '../../../domain/services/portal/seasonalTone'

/**
 * MiljoHeader — "den närvarande bruksorten". Konstant TEXTUR (inte händelse): ett
 * säsongstonat header-band överst på vardagsytor, så en mittenmatch i mars också ser
 * ut som en plats. Tävlar aldrig om fokus (BESTALLNINGSBRIEF-MILJOHEADER 2026-06-07).
 *
 * EN bild (public/assets/illustrations/bruksort-header.jpg) tintas i kod per säsong via
 * getSeasonalTone. Bilden finns inte än → fallback: ren säsongstonad gradient (INGEN proxy
 * — mockens SVG:er hör inte hemma i spelet) + dev-only "⌧ saknas"-stämpel. Per-klubb-
 * klimat-tint (climateArchetype) är en senare variant (brief §Öppna); v1 = säsong.
 *
 * Sökväg: public/ (CODE-LEVERANS §1 — briefens "src/assets/" är den äldre, felaktiga).
 */
const IMG_SRC = '/assets/illustrations/bruksort-header.jpg'
const PAPER = 'var(--bg)' // ljust pappers-kropp som bandet fadar ned mot (= vardagsytans bg)

interface Props {
  /** game.currentDate — driver säsongstinten */
  date: string
  /** portal = full höjd 168px, inner (trupp/granska) = komprimerad 120px */
  mode?: 'portal' | 'inner'
  /** chrome över bandet (klubbnamn/säsong) */
  children?: React.ReactNode
}

export function MiljoHeader({ date, mode = 'portal', children }: Props) {
  const [hasImage, setHasImage] = useState(true)
  const tone = getSeasonalTone(date)
  const height = mode === 'portal' ? 168 : 120

  // Säsongstonad himmel → fade ned mot ljust papper (mörk-ljus-rytm: bandet är "vyn ut").
  const skyToPaper = `linear-gradient(180deg, ${tone.bgPrimary} 0%, ${tone.bgSurface} 42%, ${PAPER} 100%)`

  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', background: skyToPaper }}>
      {/* Bilden (tål höjd-beskärning via object-position); döljs tills den droppas i public/ */}
      <img
        src={IMG_SRC}
        alt=""
        aria-hidden
        onError={() => setHasImage(false)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 70%',
          display: hasImage ? 'block' : 'none',
        }}
      />
      {/* Säsongstint över bilden + fade till papper nedtill (gäller även med bild) */}
      {hasImage && <div style={{ position: 'absolute', inset: 0, background: skyToPaper, mixBlendMode: 'multiply', opacity: 0.55, pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', background: `linear-gradient(180deg, transparent 0%, ${PAPER} 100%)`, pointerEvents: 'none' }} />

      {/* Dev-only: gör det uppenbart att basbilden saknas (aldrig i prod) */}
      {!hasImage && import.meta.env.DEV && (
        <div style={{
          position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
          color: 'var(--text-light-secondary)', opacity: 0.6, pointerEvents: 'none',
        }}>
          ⌧ bruksort-header saknas
        </div>
      )}

      {children && <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>}
    </div>
  )
}
