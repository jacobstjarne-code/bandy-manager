import { useState } from 'react'
import { getSeasonalTone } from '../../../domain/services/portal/seasonalTone'
import { CLUB_EXTENDED_INFO } from '../../../domain/data/clubExtendedInfo'
import { ClubBadge } from '../ClubBadge'

/**
 * MiljoHeader — "den närvarande bruksorten" (BESTALLNINGSBRIEF-MILJOHEADER, bygg-spec).
 * Konstant TEXTUR (inte händelse): säsongstonat header-band överst på vardagsytor.
 * Recederar alltid — plats, inte scen. Lånar aldrig ceremonins vokabulär (inget guld
 * utöver fönsterljus, ingen hjälte-typ).
 *
 * Tint på EN axel (kallt↔ljust), tre lager:
 *  - säsong (bas): getSeasonalTone(date) — okt→mars-glidning.
 *  - klimateArchetype (per-klubb karaktär ur clubExtendedInfo): arctic_coast mörkast/blåast,
 *    scanian_coast mildast/ljusast, osv. Härlett ur befintliga cold-tokens (token-rent).
 *  - väder (snabb modulation): partikel/fönsterljus — hook finns, byggs med bilden.
 *
 * Bilden ligger i public/assets/illustrations/bruksort-header.jpg (§1: public/ ej src/).
 * Om filen saknas eller inte kan läsas återstår den avsiktliga fallbacken: motivlös
 * säsongstonad gradient + ClubBadge-vattenstämpel + dev-only-stämpel. Aldrig SVG-proxy.
 */
const IMG_SRC = '/assets/illustrations/bruksort-header.jpg'
const PAPER = 'var(--bg)' // ljust pappers-kropp som bandet fadar ned mot

// klimateArchetype → tint-karaktär ur befintliga cold-tokens (token-rent; ingen ny hex).
// strength = overlay-opacitet: högre = mörkare/kallare (polärt), lägre = mildare/ljusare.
const ARCHETYPE_TINT: Record<string, { token: string; strength: number }> = {
  arctic_coast:        { token: '--cold', strength: 0.45 }, // Karlsborg — mörkast, blåast
  sm_highland_extreme: { token: '--cold', strength: 0.34 }, // Målilla — extrem köld, klar
  valley_coldpit:      { token: '--cold', strength: 0.38 }, // Lesjöfors — djup köld (köldhål)
  valley_inland:       { token: '--cold', strength: 0.30 }, // Gagnef — inlandsköld
  vanern_effect:       { token: '--cold-light', strength: 0.28 }, // Slottsbron — dimma/storm
  gulf_coast:          { token: '--cold-light', strength: 0.22 }, // Skutskär — kustdis
  bruk_river_island:   { token: '--cold-light', strength: 0.20 }, // Söderfors — älvdis
  bruk_lakeside:       { token: '--cold-light', strength: 0.22 }, // standard-bruk — sjödimma
  scanian_coast:       { token: '--cold-light', strength: 0.13 }, // Rögle — mildast, ljusast
}
const DEFAULT_TINT = { token: '--cold-light', strength: 0.22 }

interface Props {
  /** game.currentDate — driver säsongstinten */
  date: string
  /** managed club — klimateArchetype-tint + vattenstämpel + namn-chrome */
  club?: { id: string; name: string }
  /** portal = full höjd 168px, inner (trupp/granska) = komprimerad 120px */
  mode?: 'portal' | 'inner'
  /** chrome över bandet (utöver klubbnamn) */
  children?: React.ReactNode
}

export function MiljoHeader({ date, club, mode = 'portal', children }: Props) {
  const [hasImage, setHasImage] = useState(true)
  const tone = getSeasonalTone(date)
  const height = mode === 'portal' ? 168 : 120

  const archetype = club ? CLUB_EXTENDED_INFO[club.id]?.klimateArchetype : undefined
  const tint = (archetype && ARCHETYPE_TINT[archetype]) || DEFAULT_TINT
  const archetypeOverlay = `color-mix(in srgb, var(${tint.token}) ${Math.round(tint.strength * 100)}%, transparent)`

  // Säsongstonad himmel → fade ned mot ljust papper (mörk-ljus-rytm: bandet är "vyn ut").
  const skyToPaper = `linear-gradient(180deg, ${tone.bgPrimary} 0%, ${tone.bgSurface} 42%, ${PAPER} 100%)`

  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', background: skyToPaper }}>
      {/* Bilden tål höjd-beskärning via object-position; döljs om laddningen misslyckas. */}
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

      {/* klimateArchetype-tint (per-klubb karaktär) — övre 2/3, grumlar inte papper-faden */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '66%', background: archetypeOverlay, pointerEvents: 'none' }} />

      {/* Säsongstint över bilden + fade till papper nedtill (gäller även med bild) */}
      {hasImage && <div style={{ position: 'absolute', inset: 0, background: skyToPaper, mixBlendMode: 'multiply', opacity: 0.55, pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', background: `linear-gradient(180deg, transparent 0%, ${PAPER} 100%)`, pointerEvents: 'none' }} />

      {/* ClubBadge-vattenstämpel ger klubbidentitet ovanpå den gemensamma ortsbilden. */}
      {club && (
        <div style={{ position: 'absolute', right: 14, top: mode === 'portal' ? 18 : 12, opacity: hasImage ? 0.5 : 0.16, pointerEvents: 'none' }}>
          <ClubBadge clubId={club.id} name={club.name} size={mode === 'portal' ? 56 : 40} />
        </div>
      )}

      {/* Klubbnamn i chrome (överkant) */}
      {club && (
        <div style={{
          position: 'absolute', left: 16, top: mode === 'portal' ? 20 : 13,
          fontFamily: 'var(--font-display)', fontSize: mode === 'portal' ? 15 : 13,
          fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.3px',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)', pointerEvents: 'none',
        }}>
          {club.name}
        </div>
      )}

      {/* Dev-only: gör det uppenbart om basbilden saknas (aldrig i prod). */}
      {!hasImage && import.meta.env.DEV && (
        <div style={{
          position: 'absolute', bottom: '42%', left: 0, right: 0, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
          color: 'var(--text-light-secondary)', opacity: 0.55, pointerEvents: 'none',
        }}>
          ⌧ bruksort-header saknas
        </div>
      )}

      {children && <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>}
    </div>
  )
}
