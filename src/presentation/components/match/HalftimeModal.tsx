import { useState } from 'react'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType, TacticMentality, TacticTempo, TacticPress } from '../../../domain/enums'
import { truncate, positionShort } from '../../utils/formatters'
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

  htMentality: TacticMentality | null
  htTempo: TacticTempo | null
  htPress: TacticPress | null
  onSetMentality: (v: TacticMentality) => void
  onSetTempo: (v: TacticTempo) => void
  onSetPress: (v: TacticPress) => void
  tacticChanged: boolean

  htSubs: { outId: string; inId: string }[]
  onHtSubsChange: (subs: { outId: string; inId: string }[]) => void
  managedLineup: TeamSelection
  allPlayers: Player[]

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
  htMentality,
  htTempo,
  htPress,
  onSetMentality,
  onSetTempo,
  onSetPress,
  tacticChanged,
  htSubs,
  onHtSubsChange,
  managedLineup,
  allPlayers,
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'oversikt' | 'taktik' | 'byten'>('oversikt')

  // Substitution state
  const [pendingOutId, setPendingOutId] = useState<string | null>(null)

  // Compute effective starters/bench accounting for already-queued subs
  const effectiveStarters = (() => {
    const list = [...managedLineup.startingPlayerIds]
    for (const sub of htSubs) {
      const idx = list.indexOf(sub.outId)
      if (idx >= 0) list[idx] = sub.inId
    }
    return list
  })()
  const effectiveBench = (() => {
    const list = [...managedLineup.benchPlayerIds]
    for (const sub of htSubs) {
      const idx = list.indexOf(sub.inId)
      if (idx >= 0) list[idx] = sub.outId
    }
    return list
  })()

  function getPlayerLabel(id: string, showStats = false): string {
    const p = allPlayers.find(pl => pl.id === id)
    if (!p) return id
    const base = `${p.firstName[0]}. ${p.lastName} (${positionShort(p.position)})`
    if (!showStats) return base
    return `${base} · ${p.currentAbility} · ${Math.round(p.fitness ?? 80)}%`
  }

  const sortedStarters = [...effectiveStarters].sort((a, b) => {
    const pa = allPlayers.find(p => p.id === a)
    const pb = allPlayers.find(p => p.id === b)
    return (pb?.fitness ?? 80) - (pa?.fitness ?? 80)
  })

  function handleStarterClick(id: string) {
    if (htSubs.length >= 3 && pendingOutId !== id) return
    if (pendingOutId === id) {
      setPendingOutId(null)
    } else {
      setPendingOutId(id)
    }
  }

  function handleBenchClick(inId: string) {
    if (!pendingOutId) return
    const newSub = { outId: pendingOutId, inId }
    onHtSubsChange([...htSubs, newSub])
    setPendingOutId(null)
  }

  function removeSub(idx: number) {
    const updated = htSubs.filter((_, i) => i !== idx)
    onHtSubsChange(updated)
  }

  function btnRow(
    label: string,
    options: { val: string; label: string }[],
    current: string,
    setter: (v: string) => void,
  ) {
    return (
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {options.map(o => (
            <button
              key={o.val}
              onClick={() => setter(o.val)}
              style={{
                flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700,
                background: current === o.val ? 'var(--accent)' : 'rgba(196,122,58,0.08)',
                border: `1px solid ${current === o.val ? 'var(--accent)' : 'rgba(196,122,58,0.2)'}`,
                borderRadius: 6,
                color: current === o.val ? 'var(--text-light)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >{o.label}</button>
          ))}
        </div>
      </div>
    )
  }

  const tabs: { id: 'oversikt' | 'taktik' | 'byten'; label: string }[] = [
    { id: 'oversikt', label: 'ÖVERSIKT' },
    { id: 'taktik', label: 'TAKTIK' },
    { id: 'byten', label: `BYTEN${htSubs.length > 0 ? ` (${htSubs.length})` : ''}` },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: '40px', zIndex: 200, overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--bg)',
        border: isBigMatch ? '1px solid rgba(196,122,58,0.4)' : '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 20px 16px',
        textAlign: 'center', minWidth: 260, maxWidth: 330, width: '90%',
        marginBottom: 24,
      }}>
        {/* Header */}
        <p style={{
          fontSize: isBigMatch ? 13 : 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1px', color: isBigMatch ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 10,
        }}>
          {isSmFinal ? '⏸ HALVTID · SM-FINALEN' : isCupFinal ? '⏸ HALVTID · CUPFINALEN' : '⏸ HALVTID'}
        </p>

        {/* Score */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 14 }}>
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

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '7px 4px', fontSize: 10, fontWeight: 700,
                background: activeTab === tab.id ? 'rgba(196,122,58,0.12)' : 'transparent',
                border: 'none', borderRadius: 6,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', letterSpacing: '0.5px',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* ÖVERSIKT tab */}
        {activeTab === 'oversikt' && (
          <>
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
              <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(196,122,58,0.06)', borderRadius: 8, border: '1px solid rgba(196,122,58,0.15)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>⭐ Matchens spelare hittills</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{bestPlayerName}</p>
                {bestPlayer?.position && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{positionShort(bestPlayer.position)}</p>}
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: isSmFinal || isCupFinal ? 10 : 0, lineHeight: 1.5 }}>
              💬 "{analysis}"
            </p>
            {isSmFinal && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 0, lineHeight: 1.5 }}>
                Laget samlas i omklädningsrummet. Det är 30 minuter kvar till SM-guld.
              </p>
            )}
            {isCupFinal && !isSmFinal && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 0, lineHeight: 1.5 }}>
                Laget samlas i omklädningsrummet. Det är 30 minuter kvar till cuptiteln.
              </p>
            )}
          </>
        )}

        {/* TAKTIK tab */}
        {activeTab === 'taktik' && (
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Halvtidsjustering</p>
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
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 0 }}>
              💡 Rekommendation: {tacticRec}
            </p>
          </div>
        )}

        {/* BYTEN tab */}
        {activeTab === 'byten' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Spelarbyte</p>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{htSubs.length}/3</span>
            </div>

            {/* Queued subs */}
            {htSubs.map((sub, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '5px 8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--danger)' }}>{getPlayerLabel(sub.outId)}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                  <span style={{ color: 'var(--success)' }}>{getPlayerLabel(sub.inId)}</span>
                </span>
                <button
                  onClick={() => removeSub(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                >✕</button>
              </div>
            ))}

            {htSubs.length < 3 && (
              <>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {pendingOutId
                    ? 'Välj avbytare att sätta in'
                    : 'Välj spelare att byta ut'}
                </p>

                {/* Starters sorted by fitness */}
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Startande (sorterat på form)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  {sortedStarters.map(id => {
                    const isOut = pendingOutId === id
                    return (
                      <button
                        key={id}
                        onClick={() => handleStarterClick(id)}
                        style={{
                          padding: '6px 8px', textAlign: 'left', fontSize: 11,
                          background: isOut ? 'rgba(248,113,113,0.15)' : 'var(--bg-elevated)',
                          border: `1px solid ${isOut ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
                          borderRadius: 5, color: isOut ? 'var(--danger)' : 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: isOut ? 700 : 400,
                        }}
                      >
                        {getPlayerLabel(id, true)}
                      </button>
                    )
                  })}
                </div>

                {/* Bench */}
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Bänk</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {effectiveBench.map(id => {
                    const canSelect = !!pendingOutId
                    return (
                      <button
                        key={id}
                        onClick={() => handleBenchClick(id)}
                        disabled={!canSelect}
                        style={{
                          padding: '6px 8px', textAlign: 'left', fontSize: 11,
                          background: canSelect ? 'rgba(74,222,128,0.10)' : 'var(--bg-elevated)',
                          border: `1px solid ${canSelect ? 'rgba(74,222,128,0.35)' : 'var(--border)'}`,
                          borderRadius: 5,
                          color: canSelect ? 'var(--success)' : 'var(--text-muted)',
                          cursor: canSelect ? 'pointer' : 'default',
                        }}
                      >
                        {getPlayerLabel(id, true)}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Continue button — always visible */}
        <button
          onClick={htSubs.length > 0 || htMentality || htTempo || htPress ? onApplyTactic : onContinue}
          style={{
            width: '100%', padding: '12px', marginTop: 16,
            background: isBigMatch ? 'var(--accent)' : 'var(--accent)',
            border: 'none', borderRadius: 'var(--radius)',
            color: isBigMatch ? 'var(--text-primary)' : 'var(--text-light)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {tacticChanged || htSubs.length > 0 ? '🔄 ' : ''}{isSmFinal || isCupFinal ? 'ANDRA HALVLEK →' : 'Andra halvlek →'}
        </button>
      </div>
    </div>
  )
}
