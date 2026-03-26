import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType, TacticMentality, TacticTempo, TacticPress } from '../../../domain/enums'
import { truncate } from '../../utils/formatters'
import { computePlayerRatings } from '../../utils/matchRatings'

interface HalftimeModalProps {
  fixture: Fixture
  homeClubName: string
  awayClubName: string
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  steps: MatchStep[]
  managedClubId: string | undefined
  isBigMatch: boolean
  isSmFinal: boolean
  isCupFinal: boolean
  players: Player[]

  showTacticPanel: boolean
  onShowTacticPanel: (show: boolean) => void
  htMentality: TacticMentality | null
  htTempo: TacticTempo | null
  htPress: TacticPress | null
  onSetMentality: (v: TacticMentality) => void
  onSetTempo: (v: TacticTempo) => void
  onSetPress: (v: TacticPress) => void
  tacticChanged: boolean

  onApplyTactic: () => void
  onContinue: () => void
}

export function HalftimeModal({
  fixture,
  homeClubName,
  awayClubName,
  homeLineup,
  awayLineup,
  steps,
  managedClubId,
  isBigMatch,
  isSmFinal,
  isCupFinal,
  players,
  showTacticPanel,
  onShowTacticPanel,
  htMentality,
  htTempo,
  htPress,
  onSetMentality,
  onSetTempo,
  onSetPress,
  tacticChanged,
  onApplyTactic,
  onContinue,
}: HalftimeModalProps) {
  const halftimeStep = steps.find(s => s.step === 30)
  const htSteps = steps.slice(0, 31)
  const htEvents = htSteps.flatMap(s => s.events)
  const htHomeGoals = halftimeStep?.homeScore ?? 0
  const htAwayGoals = halftimeStep?.awayScore ?? 0
  const htHomeSuspensions = htEvents.filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.homeClubId).length
  const htAwaySuspensions = htEvents.filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.awayClubId).length

  const htStarters = [...(homeLineup.startingPlayerIds ?? []), ...(awayLineup.startingPlayerIds ?? [])]
  const htRatings = computePlayerRatings(htStarters, htEvents)
  const [bestId] = Object.entries(htRatings).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  const bestPlayer = bestId ? players.find(p => p.id === bestId) : undefined
  const bestPlayerName = bestPlayer ? `${bestPlayer.firstName} ${bestPlayer.lastName}` : null

  const managedIsHome = fixture.homeClubId === managedClubId
  const managedGoals = managedIsHome ? htHomeGoals : htAwayGoals
  const oppGoals = managedIsHome ? htAwayGoals : htHomeGoals
  const diff = managedGoals - oppGoals
  const analysis =
    diff >= 2 ? 'Stark insats. Fortsätt kontrollera tempot.' :
    diff === 1 ? 'Ledningen är skör. Var uppmärksam defensivt.' :
    diff === 0 ? 'Jämnt — allt avgörs i andra halvlek.' :
    diff === -1 ? 'Hänger med. En omgång kan vända det.' :
    'Tufft läge. Överväg taktikbyte.'

  const currentTactic = managedIsHome ? homeLineup.tactic : awayLineup.tactic
  const mentality = htMentality ?? currentTactic.mentality
  const tempo = htTempo ?? currentTactic.tempo
  const press = htPress ?? currentTactic.press

  const scoreDiff = (() => {
    const hs = halftimeStep?.homeScore ?? 0
    const as_ = halftimeStep?.awayScore ?? 0
    return managedIsHome ? hs - as_ : as_ - hs
  })()
  const tacticRec = scoreDiff >= 2
    ? 'defensiv' : scoreDiff === 1
    ? 'defensiv eller behåll tempo' : scoreDiff === 0
    ? 'offensiv — ta initiativet' : scoreDiff === -1
    ? 'offensiv push — ni behöver mål' : 'all-in offensiv — inget att förlora'

  function btnRow(
    label: string,
    options: { val: string; label: string }[],
    current: string,
    setter: (v: string) => void,
  ) {
    return (
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: '#8A9BB0', marginBottom: 6, fontWeight: 600 }}>{label}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {options.map(o => (
            <button
              key={o.val}
              onClick={() => setter(o.val)}
              style={{
                flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700,
                background: current === o.val ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${current === o.val ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 6,
                color: current === o.val ? '#fff' : '#8A9BB0',
                cursor: 'pointer',
              }}
            >{o.label}</button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '60px', zIndex: 200,
    }}>
      <div style={{
        background: isBigMatch ? '#0D1B2A' : 'var(--bg-surface)',
        border: isBigMatch ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '24px 20px',
        textAlign: 'center', minWidth: 260, maxWidth: 330, width: '90%',
      }}>
        <p style={{
          fontSize: isBigMatch ? 13 : 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1px', color: isBigMatch ? '#C9A84C' : 'var(--text-muted)', marginBottom: 14,
        }}>
          {isSmFinal ? '⏸ HALVTID · SM-FINALEN' : isCupFinal ? '⏸ HALVTID · CUPFINALEN' : '⏸ HALVTID'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(homeClubName, 12)}</p>
            <span style={{ fontSize: 40, fontWeight: 800 }}>{htHomeGoals}</span>
          </div>
          <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>—</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{truncate(awayClubName, 12)}</p>
            <span style={{ fontSize: 40, fontWeight: 800 }}>{htAwayGoals}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textAlign: 'left', lineHeight: 1.8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Skott:</span>
            <span>{halftimeStep?.shotsHome ?? 0} — {halftimeStep?.shotsAway ?? 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Hörnor:</span>
            <span>{halftimeStep?.cornersHome ?? 0} — {halftimeStep?.cornersAway ?? 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Utvisningar:</span>
            <span>{htHomeSuspensions} — {htAwaySuspensions}</span>
          </div>
        </div>
        {bestPlayerName && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(201,168,76,0.06)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.15)' }}>
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, marginBottom: 2 }}>⭐ Matchens spelare hittills</p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{bestPlayerName}</p>
            {bestPlayer?.position && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bestPlayer.position}</p>}
          </div>
        )}
        <p style={{ fontSize: 12, color: '#8A9BB0', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>
          💬 "{analysis}"
        </p>
        {isSmFinal && (
          <p style={{ fontSize: 11, color: '#8A9BB0', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
            Laget samlas i omklädningsrummet. Det är 30 minuter kvar till SM-guld.
          </p>
        )}
        {isCupFinal && !isSmFinal && (
          <p style={{ fontSize: 11, color: '#8A9BB0', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
            Laget samlas i omklädningsrummet. Det är 30 minuter kvar till cuptiteln.
          </p>
        )}

        {showTacticPanel ? (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Halvtidsjustering</p>
            {btnRow('Mentalitet', [
              { val: TacticMentality.Defensive, label: 'Defensiv' },
              { val: TacticMentality.Balanced, label: 'Balanserad' },
              { val: TacticMentality.Offensive, label: 'Offensiv' },
            ], mentality, v => onSetMentality(v as TacticMentality))}
            {btnRow('Tempo', [
              { val: TacticTempo.Low, label: 'Lågt' },
              { val: TacticTempo.Normal, label: 'Normalt' },
              { val: TacticTempo.High, label: 'Högt' },
            ], tempo, v => onSetTempo(v as TacticTempo))}
            {btnRow('Press', [
              { val: TacticPress.Low, label: 'Låg' },
              { val: TacticPress.Medium, label: 'Medium' },
              { val: TacticPress.High, label: 'Hög' },
            ], press, v => onSetPress(v as TacticPress))}
            <p style={{ fontSize: 10, color: '#6a7d8f', fontStyle: 'italic', marginBottom: 12 }}>
              💡 Rekommendation: {tacticRec}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onApplyTactic}
                style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 700 }}
              >Spara ändringar</button>
              <button
                onClick={() => onShowTacticPanel(false)}
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#8A9BB0', fontSize: 13, fontWeight: 600 }}
              >Behåll nuvarande</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onShowTacticPanel(true)}
            style={{
              width: '100%', padding: '10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius)', color: '#C9A84C', fontSize: 13, fontWeight: 600,
              marginBottom: 10, cursor: 'pointer',
            }}
          >Ändra taktik ⚙️</button>
        )}

        {!showTacticPanel && (
          <button
            onClick={onContinue}
            style={{
              width: '100%', padding: '12px',
              background: isBigMatch ? '#C9A84C' : 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius)',
              color: isBigMatch ? '#0D1B2A' : '#fff', fontSize: 15, fontWeight: 700,
            }}
          >
            {tacticChanged ? '🔄 ' : ''}{isSmFinal || isCupFinal ? 'ANDRA HALVLEK →' : 'Andra halvlek →'}
          </button>
        )}
      </div>
    </div>
  )
}
