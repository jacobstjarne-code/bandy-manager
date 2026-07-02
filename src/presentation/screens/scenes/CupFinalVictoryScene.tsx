/**
 * CupFinalVictoryScene — efter att managed klubb vunnit cupen.
 * Samma visuella komposition som SMFinalVictoryScene, annat register:
 * konkret och nuförliggande snarare än episkt.
 *
 * Pixel-värden från SMFinalVictoryScene (samma mockup). Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { CUP_FINAL_VICTORY_TEMPLATES } from '../../../domain/data/scenes/cupFinalVictoryScene'
import { SceneHeader } from './shared/SceneHeader'
import { SceneCTA } from './shared/SceneCTA'
import { ConfettiParticles } from './shared/ConfettiParticles'
import { VictoryTrophy } from './shared/VictoryTrophy'
import { VictoryScore } from './shared/VictoryScore'
import { VictoryQuote } from './shared/VictoryQuote'
import { useCupFinalData } from './shared/useCupFinalData'
import { seasonStartYear } from '../../../domain/utils/seasonYear'

interface Props {
  game: SaveGame
  onComplete: () => void
}

export function CupFinalVictoryScene({ game, onComplete }: Props) {
  const data = useCupFinalData(game)
  const meta = CUP_FINAL_VICTORY_TEMPLATES.meta
  const titleText = meta.titleText.replace('{year}', String(seasonStartYear(game.currentSeason)))
  const dateText = meta.dateText.replace('{finalArena}', data.finalArena).replace('{cupFinalDate}', 'Cupfinalen')
  const confettiSeed = game.currentSeason * 9301 + 77

  return (
    <div
      style={{
        background: 'var(--bg-scene-deep)',
        minHeight: 720,
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 300ms ease both',
      }}
    >
      {/* Bakgrund */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(212,164,96,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 20% 30%, rgba(184,136,76,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(184,136,76,0.08) 0%, transparent 70%), linear-gradient(180deg, var(--bg-scene-deep) 0%, color-mix(in srgb, var(--bg-scene-deep) 70%, var(--bg-scene) 30%) 100%)',
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
          className="h-quote-sm h-quote-light"
          style={{
            marginBottom: 36,
          }}
        >
          {dateText}
        </div>

        <VictoryScore
          homeScore={data.homeScore}
          awayScore={data.awayScore}
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
