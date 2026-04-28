/**
 * SMFinalVictoryScene — efter att managed klubb vunnit SM-finalen.
 * Mörk bakgrund, fallande konfetti, trofé, slutresultat, akademi-callback.
 *
 * Pixel-värden från docs/mockups/victory_mockup.html. Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { SM_FINAL_VICTORY_TEMPLATES } from '../../../domain/data/scenes/smFinalVictoryScene'
import { SceneHeader } from './shared/SceneHeader'
import { SceneCTA } from './shared/SceneCTA'
import { ConfettiParticles } from './shared/ConfettiParticles'
import { VictoryTrophy } from './shared/VictoryTrophy'
import { VictoryScore } from './shared/VictoryScore'
import { VictoryQuote } from './shared/VictoryQuote'
import { useSMFinalData } from './shared/useSMFinalData'

interface Props {
  game: SaveGame
  onComplete: () => void
}

export function SMFinalVictoryScene({ game, onComplete }: Props) {
  const data = useSMFinalData(game)
  const meta = SM_FINAL_VICTORY_TEMPLATES.meta
  const titleText = meta.titleText.replace('{season}', String(game.currentSeason))
  const dateText = meta.dateText.replace('{finalArena}', data.finalArena)
  const confettiSeed = game.currentSeason * 9301 + 33

  return (
    <div
      style={{
        background: 'var(--bg-scene-deep)',
        minHeight: 720,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Bakgrund */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(212,164,96,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 20% 30%, rgba(184,136,76,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(184,136,76,0.08) 0%, transparent 70%), linear-gradient(180deg, #08060a 0%, #0f0a08 100%)',
        }}
      />

      <ConfettiParticles seed={confettiSeed} />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '50px 24px 28px',
          textAlign: 'center',
        }}
      >
        <SceneHeader genre={meta.genreLabel} title="" />

        <VictoryTrophy />

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 18,
            color: 'var(--match-gold)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          {titleText}
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginBottom: 36,
          }}
        >
          {dateText}
        </div>

        <VictoryScore
          myScore={data.myScore}
          theirScore={data.theirScore}
          homeName={data.homeName}
          awayName={data.awayName}
          arenaCapacity={data.arenaCapacity}
        />

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 17,
            color: 'var(--text-light)',
            lineHeight: 1.5,
            fontWeight: 400,
            marginBottom: 28,
            padding: '0 12px',
            textAlign: 'center',
          }}
          dangerouslySetInnerHTML={{
            __html: data.bodyText.replace(
              /<em>/g,
              '<em style="font-style: italic; color: var(--match-gold);">',
            ),
          }}
        />

        <VictoryQuote quote={data.birgerQuote} attribution={data.birgerAttribution} />

        <SceneCTA label={meta.cta} onClick={onComplete} variant="gold" />
      </div>
    </div>
  )
}
