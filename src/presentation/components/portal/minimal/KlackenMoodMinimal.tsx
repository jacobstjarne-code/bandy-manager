import type { CardRenderProps } from '../portalTypes'
import { canVoiceSpeak, klackLeaderVoiceId } from '../../../../domain/services/voiceIntroductionService'
import { klackMoodLabel } from '../../../utils/formatters'

/** Minimal-kort: klackens stämning inför derby. */
export function KlackenMoodMinimal({ game }: CardRenderProps) {
  const sg = game.supporterGroup
  if (!sg) return null
  if (!canVoiceSpeak(game, klackLeaderVoiceId(game.managedClubId, sg.leader.name))) return null

  const { label: moodLabel, color: moodColor } = klackMoodLabel(sg.mood)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Klacken
      </div>
      <div className="h-num-sm" style={{ color: moodColor }}>
        {moodLabel}
      </div>
    </div>
  )
}
