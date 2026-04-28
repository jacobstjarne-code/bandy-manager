/**
 * SundayTrainingScene — säsongens första söndagsträning.
 * Mörk bakgrund, fallande snö, sex spelare på isen.
 *
 * Pixel-värden från docs/mockups/training_mockup.html. Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  SUNDAY_TRAINING_PLAYERS,
  SUNDAY_TRAINING_CHOICES,
  SUNDAY_TRAINING_META,
} from '../../../domain/data/scenes/sundayTrainingScene'
import { SceneHeader } from './shared/SceneHeader'
import { SceneChoiceButton } from './shared/SceneChoiceButton'
import { SnowParticles } from './shared/SnowParticles'
import { SundayTrainingPlayerList } from './shared/SundayTrainingPlayerList'

interface Props {
  game: SaveGame
  onComplete: (choiceId: string) => void
}

export function SundayTrainingScene({ game, onComplete }: Props) {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  const arena = club?.arenaName ?? 'klubbarenan'
  const dateText = SUNDAY_TRAINING_META.date.replace('{arena}', arena)
  const seed = game.currentSeason * 9301 + game.managedClubId.length * 49297 + 1

  return (
    <div
      style={{
        background: 'var(--bg)',
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
            'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(184,136,76,0.10) 0%, transparent 70%), linear-gradient(180deg, #1a1410 0%, #15110d 60%, #0f0c09 100%)',
        }}
      />

      <SnowParticles seed={seed} />

      {/* Innehåll */}
      <div
        style={{
          position: 'relative',
          padding: '30px 24px 24px',
          zIndex: 2,
        }}
      >
        <SceneHeader
          genre="I DETTA ÖGONBLICK"
          title={SUNDAY_TRAINING_META.title}
          subtitle={dateText}
        />

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-light)',
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {SUNDAY_TRAINING_META.headline}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 20,
            fontStyle: 'italic',
          }}
        >
          {SUNDAY_TRAINING_META.subtitle}
        </div>

        <SundayTrainingPlayerList players={SUNDAY_TRAINING_PLAYERS} />

        {/* Val */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 30,
          }}
        >
          {SUNDAY_TRAINING_CHOICES.map(c => (
            <SceneChoiceButton key={c.id} choice={c} onClick={onComplete} />
          ))}
        </div>
      </div>
    </div>
  )
}
