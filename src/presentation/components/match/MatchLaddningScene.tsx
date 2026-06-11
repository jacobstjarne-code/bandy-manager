// A3 — Match-laddning full scene (tillfälle-tier).
// Visas för: annandagen, derby, cup, premiär, final, nyår.
// §9: eyebrow --accent (eller --warm-light för derby); guld ENDAST på final.
// §9: CTA = btn btn-primary + border-radius 14 (ej .btn--hero, ej .btn-copper).
// Mock: docs/mockups/2026-06-07_design_match_laddning.html

import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import { SCENE_TEXT, STAKE_TEXT, type LaddningOccasion } from '../../../domain/data/matchLaddningText'
import { getSeasonContext } from '../../../domain/services/seasonContextService'
import { seededPick } from '../../../domain/utils/random'
import { IllustrationPlaceholder } from '../illustration/IllustrationScene'

// Assets confirmed in repo; others fall back to IllustrationPlaceholder.
const OCCASION_ASSET: Partial<Record<LaddningOccasion, string>> = {
  annandagen: 'annandagen',
  final: 'final',
  // derby: 'derby',      // ordered, placeholder until dropped
  // nyar: 'nyarsbandy',  // ordered, placeholder until dropped
}

interface Props {
  occasion: LaddningOccasion
  isFinal: boolean
  game: SaveGame
  opponent: Club | null
  nextFixture: Fixture
  onContinue: () => void
}

export function MatchLaddningScene({ occasion, isFinal, game, opponent, nextFixture, onContinue }: Props) {
  const texts = SCENE_TEXT[occasion]
  const seed = game.currentSeason * 97 + game.currentMatchday * 31
  const charge = seededPick(texts.charge, seed)
  const relation = seededPick(texts.relation, seed + 7)

  const seasonCtx = getSeasonContext(game)
  const stakeText = (seasonCtx === 'relegationFight' || seasonCtx === 'topRace')
    ? seededPick(STAKE_TEXT[seasonCtx], seed + 13)
    : null

  const assetName = OCCASION_ASSET[occasion]
  const isHome = nextFixture.homeClubId === game.managedClubId
  const plats = isHome ? 'Hemma' : 'Borta'

  // §9.1: guld ENDAST final; derby → --warm-light; övriga → --accent
  const eyebrowColor = isFinal
    ? 'var(--gold)'
    : occasion === 'derby'
      ? 'var(--warm-light)'
      : 'var(--accent)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as unknown as number,
      background: 'var(--bg-portal)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Scene area — fills everything above the CTA row */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {assetName ? (
          <img
            src={`/assets/illustrations/${assetName}.jpg`}
            alt={texts.eyebrow}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 30%',
            }}
          />
        ) : (
          <IllustrationPlaceholder name={texts.eyebrow.toLowerCase()} />
        )}

        {/* Top scrim (mock: top 26%, rgba(12,14,20,0.6) → transparent) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '26%',
          background: 'linear-gradient(180deg, rgba(12,14,20,0.6), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Bottom scrim (mock: bottom 70%, transparent → deep dark) */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16,18,24,0.55) 42%, rgba(12,14,20,0.94) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Text overlay — bottomed with breathing room above CTA */}
        <div style={{
          position: 'absolute', left: 18, right: 18, bottom: 44, zIndex: 2,
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9, letterSpacing: '4px', textTransform: 'uppercase',
            color: eyebrowColor, marginBottom: 9,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            ⬩ {texts.eyebrow} ⬩
          </p>

          {opponent && (
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26, fontWeight: 700,
              color: 'var(--text-light)', lineHeight: 1.1, marginBottom: 4,
              textShadow: '0 1px 8px rgba(0,0,0,0.7)', letterSpacing: '-0.4px',
            }}>
              {opponent.name}
            </p>
          )}

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5, color: 'var(--text-light-secondary)',
            letterSpacing: '0.5px', marginBottom: 12,
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
          }}>
            {plats} · {relation}
          </p>

          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic', fontSize: 13.5,
            color: 'var(--text-light)', lineHeight: 1.5,
            textShadow: '0 1px 6px rgba(0,0,0,0.7)',
          }}>
            {charge}
          </p>

          {stakeText && (
            <div style={{
              marginTop: 11,
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 10px', borderRadius: 99,
              background: 'color-mix(in srgb, var(--warm) 18%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warm) 45%, transparent)',
              fontFamily: 'var(--font-body)', fontSize: 10,
              color: 'var(--warm-light)', fontWeight: 600,
            }}>
              {stakeText}
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, calc(var(--safe-bottom, 0px) + 12px))',
        background: 'rgba(12,14,20,0.96)',
        zIndex: 3,
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
