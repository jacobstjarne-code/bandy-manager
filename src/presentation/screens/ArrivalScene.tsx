import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { getStureLine } from '../../domain/data/arrivalDialogue'
import { BoardObjectivesList } from '../components/portal/secondary/BoardObjectivesList'
import type { BoardObjective } from '../../domain/entities/Community'

type Phase = 'setting' | 'margareta' | 'sture' | 'objectives' | 'cta'

const PHASE_ORDER: Phase[] = ['setting', 'margareta', 'sture', 'objectives', 'cta']

function phaseGte(current: Phase, target: Phase): boolean {
  return PHASE_ORDER.indexOf(current) >= PHASE_ORDER.indexOf(target)
}

interface ArrivalSceneInnerProps {
  clubId: string
  clubName: string
  objectives: BoardObjective[]
  onComplete: () => void
}

function ArrivalSceneInner({ clubId, clubName, objectives, onComplete }: ArrivalSceneInnerProps) {
  const [phase, setPhase] = useState<Phase>('setting')
  const [settingIn, setSettingIn] = useState(false)

  // Initial setting fade-in — brief delay so CSS transition fires after mount
  useEffect(() => {
    const t = setTimeout(() => setSettingIn(true), 200)
    return () => clearTimeout(t)
  }, [])

  // Auto-progression chain (per spec ARRIVAL-02)
  useEffect(() => {
    const next: Partial<Record<Phase, [Phase, number]>> = {
      setting:    ['margareta',  1400],
      margareta:  ['sture',      2200],
      sture:      ['objectives', 2200],
      objectives: ['cta',        1400],
    }
    const step = next[phase]
    if (!step) return
    const [target, delay] = step
    const t = setTimeout(() => setPhase(target), delay)
    return () => clearTimeout(t)
  }, [phase])

  const stureQuote = getStureLine(clubId)
  const margaretaQuote = `"Det här är en gammal klubb. Vi förväntar oss inte mirakel — men vi förväntar oss att det syns att du bryr dig. Tre kontrakt löper ut. Snacka med dom tidigt."`

  // Dot i is lit when we've entered that phase: dot 0 = settingIn, 1–3 = phase > that dot's phase
  const dotLit = [
    settingIn,
    phaseGte(phase, 'margareta'),
    phaseGte(phase, 'sture'),
    phaseGte(phase, 'objectives'),
  ]

  return (
    <div className="arrival-scene">
      <div className="arrival-lamp-overlay" />

      <button className="scene-skip" onClick={onComplete}>Hoppa över ↘</button>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, padding: '32px 24px 0', textAlign: 'center' }}>
        <div className="h-scene-genre">⬩ &nbsp;Ankomsten&nbsp; ⬩</div>
        <div className="beat-progress" style={{ marginTop: 14 }}>
          {dotLit.map((lit, i) => (
            <span key={i} className={`dot${lit ? ' active' : ''}`} />
          ))}
        </div>
      </div>

      {/* Content stack — all elements always in DOM, CSS transitions drive visibility */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
        padding: '28px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Setting */}
        <div className={[
          'scene-setting',
          settingIn && 'in',
          phaseGte(phase, 'margareta') && 'dimmed',
        ].filter(Boolean).join(' ')}>
          <strong>{clubName}.</strong>
          {` Onsdag kväll. Lampan vid klubbhuset lyser. De väntar dig där inne. Margareta Lindqvist. Sture ${clubName}. Två kaffekoppar redan på bordet.`}
        </div>

        {/* Margareta */}
        <div className={[
          'scene-replica',
          phaseGte(phase, 'margareta') && 'in',
          phaseGte(phase, 'sture') && 'dimmed',
        ].filter(Boolean).join(' ')}>
          <div className="h-scene-speaker">Margareta · Kassör</div>
          <div className="h-scene-quote">{margaretaQuote}</div>
        </div>

        {/* Sture */}
        <div className={[
          'scene-replica',
          phaseGte(phase, 'sture') && 'in',
          phaseGte(phase, 'objectives') && 'dimmed',
        ].filter(Boolean).join(' ')}>
          <div className="h-scene-speaker">Sture · Ledamot</div>
          <div className="h-scene-quote">"{stureQuote}"</div>
        </div>

        {/* BoardObjectives — full opacity, never dimmed */}
        <div className={[
          'arrival-board-objectives',
          phaseGte(phase, 'objectives') && 'in',
        ].filter(Boolean).join(' ')}>
          <div className="arrival-board-card">
            <div style={{
              fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
              color: 'var(--accent)', fontWeight: 600, opacity: 0.85,
              marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>🎯</span>
              <span>Styrelsens krav</span>
            </div>
            <BoardObjectivesList objectives={objectives} max={3} />
          </div>
        </div>
      </div>

      {/* CTA — absolute bottom, fades in at cta phase */}
      <div className={['scene-cta-area', phase === 'cta' && 'in'].filter(Boolean).join(' ')}>
        <button className="btn-scene-cta" onClick={onComplete}>Då börjar vi</button>
      </div>
    </div>
  )
}

export function ArrivalScene() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)

  if (!game) {
    navigate('/', { replace: true })
    return null
  }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <ArrivalSceneInner
      clubId={managedClub.id}
      clubName={managedClub.name}
      objectives={game.boardObjectives ?? []}
      onComplete={() => navigate('/game/dashboard', { replace: true })}
    />
  )
}
