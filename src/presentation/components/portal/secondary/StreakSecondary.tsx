/**
 * StreakSecondary — B4 (Spår B, 2026-07-20). Akut svitkänsla, egen röst.
 *
 * Skiljs från season_signature_card (säsongslång tonalitet, lugn) på tre
 * drag: form-rutor (inte en färgton), transient topp-stripe som fadar
 * (inte en stilla vänsterkant), funktionärscitat i röstregistret (B5·3,
 * .txt-karaktar) i stället för en neutral faktarad. Akut och kortlivat —
 * "just nu", inte "hela säsongen".
 */

import type { CardRenderProps } from '../portalTypes'
import { getStreakState } from '../../../../domain/data/roundCharacter'
import { pickFunctionaryStreakLine } from '../../../../domain/data/functionaryStreakText'
import { FormSquares } from '../../primitives/FormSquares'

export function StreakSecondary({ game }: CardRenderProps) {
  const streak = getStreakState(game)
  if (!streak) return null

  const isLosing = streak.type === 'losing_streak'
  const stripeColor = isLosing ? 'var(--danger)' : 'var(--success)'
  const eyebrow = isLosing ? 'TUNG PERIOD' : 'GOD PERIOD'
  const title = isLosing ? `${streak.length} raka utan poäng` : `${streak.length} raka segrar`
  const squares: Array<'V' | 'F'> = Array(Math.min(streak.length, 5)).fill(isLosing ? 'F' : 'V')
  const quote = pickFunctionaryStreakLine(game.managedClubId, game.currentMatchday ?? 0, streak.type)

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 13px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        gridColumn: 'span 2',
      }}
    >
      {/* Drag 2 — transient topp-stripe som fadar, inte signaturens stilla vänsterkant */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${stripeColor}, transparent)`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: stripeColor, fontWeight: 700 }}>
            {eyebrow}
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--text-light)', marginTop: 2 }}>
            {title}
          </div>
        </div>
        {/* Drag 1 — form-rutor, ankrar sviten i data, inte en färgton */}
        <FormSquares results={squares} />
      </div>

      {/* Drag 3 — funktionärscitat, karaktärsnivå (B5·3), inte en neutral faktarad */}
      <div className="txt-karaktar txt-karaktar-light">
        {quote}
      </div>
    </div>
  )
}
