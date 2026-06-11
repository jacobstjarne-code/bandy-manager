// A3 — Match-laddning slim band (tillstånd-tier).
// Visas för: vinstsvit / förlustsvit ≥3 (change-marker), eller direkt efter att sviten bröts.
// §9.3: band = förändrings-markör, tyst när oförändrad.
// §9.2: CTA = btn btn-primary + radius 8 (lättare än scen).
// Mock: docs/mockups/2026-06-07_design_match_laddning.html (.band)

import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import {
  BAND_TEXT,
  STREAK_BROKEN_CHARGE,
  streakEyebrow,
  streakRelation,
  type LaddningState,
} from '../../../domain/data/matchLaddningText'
import { seededPick } from '../../../domain/utils/random'

interface Props {
  state: LaddningState
  streakLength: number
  isBroken: boolean
  game: SaveGame
  opponent: Club | null
  nextFixture: Fixture
  onContinue: () => void
}

export function MatchLaddningBand({ state, streakLength, isBroken, game, opponent, nextFixture, onContinue }: Props) {
  const seed = game.currentSeason * 97 + game.currentMatchday * 31

  const chargePool = isBroken ? STREAK_BROKEN_CHARGE[state] : BAND_TEXT[state].charge
  const charge = seededPick(chargePool, seed)

  const eyebrow = isBroken
    ? 'SVITEN BRUTEN'
    : streakEyebrow(streakLength)

  const relationText = isBroken
    ? (state === 'losing_streak' ? 'Det vände till slut' : 'Sviten gick inte att hålla')
    : streakRelation(streakLength, state)

  const isHome = nextFixture.homeClubId === game.managedClubId
  const plats = isHome ? 'Hemma' : 'Borta'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as unknown as number,
      background: 'var(--bg-portal)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Band card — centered vertically so slim card reads as intentional stillness */}
      <div style={{ flex: 1, padding: '20px 13px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          padding: '13px 14px',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--warm) 10%, var(--bg-portal-surface)) 0%, var(--bg-portal-surface) 100%)',
          borderLeft: '3px solid var(--warm)',
          borderRadius: '0 8px 8px 0',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 8, letterSpacing: '3px', textTransform: 'uppercase',
            color: 'var(--warm-light)', fontWeight: 700, marginBottom: 7,
          }}>
            {eyebrow}
          </p>

          {opponent && (
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16, fontWeight: 700,
              color: 'var(--text-light)', marginBottom: 3,
            }}>
              {opponent.name}
            </p>
          )}

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9, color: 'var(--text-muted)', marginBottom: 9,
          }}>
            {plats} · {relationText}
          </p>

          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic', fontSize: 12,
            color: 'var(--text-light)', lineHeight: 1.5, opacity: 0.94,
          }}>
            {charge}
          </p>
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, calc(var(--safe-bottom, 0px) + 12px))',
      }}>
        <button
          className="btn btn-primary btn-cta"
          onClick={onContinue}
        >
          SÄTT LAGET →
        </button>
      </div>
    </div>
  )
}
