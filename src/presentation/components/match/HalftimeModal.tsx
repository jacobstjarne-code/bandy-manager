import { useState } from 'react'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType, TacticMentality, TacticTempo } from '../../../domain/enums'
import { truncate, positionShort } from '../../utils/formatters'
import { computePlayerRatings } from '../../utils/matchRatings'
import { PAUSSNACK, PAUSSNACK_EYEBROW, PAUSSNACK_PREVIEW_LABEL } from '../../../domain/data/matchLiveText'
import type { MatchSituation } from '../../../domain/data/matchLiveText'
import { PAUSE_LEAN_FACTOR } from '../../../domain/services/matchCore'
import { seededPick } from '../../../domain/utils/random'

export type PauseLean = 'push' | 'calm' | 'hold'

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
  onSetMentality: (v: TacticMentality) => void
  onSetTempo: (v: TacticTempo) => void
  tacticChanged: boolean

  htSubs: { outId: string; inId: string }[]
  onHtSubsChange: (subs: { outId: string; inId: string }[]) => void
  managedLineup: TeamSelection
  allPlayers: Player[]

  onApplyTactic: () => void
  onContinue: () => void
  pauseLean: PauseLean | null
  onPauseLean: (l: PauseLean) => void
}

/**
 * @cites htTempo, computePlayerRatings, MatchEvent
 */
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
  onSetMentality,
  onSetTempo,
  htSubs,
  onHtSubsChange,
  managedLineup,
  allPlayers,
  onApplyTactic,
  onContinue,
  pauseLean,
  onPauseLean,
}: HalftimeModalProps) {
  const halftimeStep = steps.find(s => s.step === 30)
  const htSteps = steps.slice(0, 31)
  const htEvents = htSteps.flatMap(s => s.events)
  const htHomeGoals = halftimeStep?.homeScore ?? 0
  const htAwayGoals = halftimeStep?.awayScore ?? 0
  const htHomeSuspensions = htEvents.filter(e => e.type === MatchEventType.Suspension && e.clubId === fixture.homeClubId).length
  const htAwaySuspensions = htEvents.filter(e => e.type === MatchEventType.Suspension && e.clubId === fixture.awayClubId).length

  const htStarters = [...(homeLineup.startingPlayerIds ?? []), ...(awayLineup.startingPlayerIds ?? [])]
  const htRatings = computePlayerRatings(htStarters, htEvents)
  const [bestId] = Object.entries(htRatings).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  const bestPlayer = bestId ? players.find(p => p.id === bestId) : undefined
  const bestPlayerName = bestPlayer ? `${bestPlayer.firstName} ${bestPlayer.lastName}` : null

  const managedIsHome = fixture.homeClubId === managedClubId
  const managedGoals = managedIsHome ? htHomeGoals : htAwayGoals
  const oppGoals = managedIsHome ? htAwayGoals : htHomeGoals
  const diff = managedGoals - oppGoals

  // Spak A — paussnack per läge. Index 0 default-markerat. (SPEC-SPAK-AB A2/A3)
  const situation: MatchSituation = diff < 0 ? 'behind' : diff === 0 ? 'level' : 'leading'
  const pepOptions = PAUSSNACK[situation]
  const selectedLean: PauseLean = pauseLean ?? pepOptions[0].lean
  // Preview: förväntad bar-riktning ur SAMMA faktor som sim:en (§2). Riktning + grov
  // magnitud, aldrig siffra. push/calm lutar mot managed-sidan; hold = mitten.
  const leanShift = selectedLean === 'hold' ? 0 : Math.abs(PAUSE_LEAN_FACTOR[selectedLean] - 1) * 60 // push→15%, calm→12%
  const previewHomePct = Math.max(8, Math.min(92, 50 + (managedIsHome ? 1 : -1) * leanShift))
  // Påståendesvepet #1 (MASTER.md, 2026-08-24): "Ledningen hade vi i en match
  // förra året på samma plan, och vi tappade den" ströks — komponenten har
  // ingen säsongskoll, så raden kunde fyras i en klubbs FÖRSTA NÅGONSIN match
  // (ingen "förra året" finns), och även när ett "förra året" finns saknas
  // halvtidsställning i historisk matchdata för att faktiskt belägga att en
  // ledning tappades. Kan påståendet inte beläggas ska det inte göras.
  const HT_WIN_BIG = [
    'De har inte gett upp en match hela hösten, så vi spelar likadant i andra halvlek.',
    'Vi släpper inte upp dem.',
  ]
  const HT_WIN_ONE = [
    'Ett mål skiljer, en utvisning kan vända allt, vi har fyrtiofem minuter kvar att jobba.',
    'Det här slutar någonstans — och det är alldeles för tidigt att veta var.',
    'Halva matchen kvar. Vi vet hur de spelar nu.',
  ]
  const HT_DRAW = [
    'Det är jämnt på papperet, och det är där det ska vara just nu.',
    'Inte vår fördel. Inte deras heller.',
    'Det avgörs efter pausen.',
  ]
  const HT_DOWN_ONE = [
    'Ett mål skiljer — och vi har spelat sämre matcher där vi vunnit.',
    'De har inte spelat över sin förmåga, vi inte under, fyrtiofem minuter kvar.',
    'Ett mål är inte mycket. Det räcker med en hörna och ett dåligt frislag.',
  ]
  const HT_DOWN_BIG = [
    'Det blev värre än vi räknat med, och vi har en halvlek till att spela.',
    'Bussen hem är lång om vi inte gör något i andra halvlek.',
    'Det blir andra halvlek hur som helst.',
  ]
  const pool = diff >= 2 ? HT_WIN_BIG : diff === 1 ? HT_WIN_ONE : diff === 0 ? HT_DRAW : diff === -1 ? HT_DOWN_ONE : HT_DOWN_BIG
  const analysis = seededPick(pool, `${fixture.id}:halftime:${managedGoals}-${oppGoals}`)

  const currentTactic = managedIsHome ? homeLineup.tactic : awayLineup.tactic
  const mentality = htMentality ?? currentTactic.mentality
  const tempo = htTempo ?? currentTactic.tempo

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
    options: { val: string | string[]; label: string }[],
    current: string,
    setter: (v: string) => void,
  ) {
    return (
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', marginBottom: 6, fontWeight: 600, textAlign: 'left' }}>{label}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {options.map(o => {
            // B2 (SLUTTEST_KO.md 2026-08-19): o.val kan vara ett värdeblock (press:
            // ['medium','low'] — matchCore behandlar dem identiskt, se tacticData.ts).
            const vals = Array.isArray(o.val) ? o.val : [o.val]
            const isSelected = vals.includes(current)
            return (
              <button
                key={vals.join('-')}
                onClick={() => { if (!isSelected) setter(vals[0]) }}
                style={{
                  flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700,
                  background: isSelected ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: isSelected ? 'var(--text-light)' : 'var(--text-light-secondary)',
                  cursor: 'pointer',
                }}
              >{o.label}</button>
            )
          })}
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
    <div className="match-modal-overlay">
      <div
        className="match-modal-panel ht-panel"
        style={isBigMatch ? { borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)' } : undefined}
      >
        {/* Header — fixed, non-scrollable */}
        <div className="ht-head">
          <p className="ht-eyebrow">
            {isSmFinal ? '⏸ HALVTID · SM-FINALEN' : isCupFinal ? '⏸ HALVTID · CUPFINALEN' : '⏸ HALVTID'}
          </p>

          {/* Score — Georgia (paper-numerals), not LED (tavlans reservat).
              --text-light (ljus) för den mörka modalpanelen; --text-primary är mörk
              och gav oläslig grå mot panelen. */}
          <div className="ht-score">
            <div className="h-display-lg" style={{ color: 'var(--text-light)' }}>{htHomeGoals}—{htAwayGoals}</div>
            <div className="pd">{truncate(homeClubName, 10)} · {truncate(awayClubName, 10)}</div>
          </div>

          {/* Tab bar */}
          <div className="ht-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`ht-tab${activeTab === tab.id ? ' on' : ''}`}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Tab content — scrollable */}
        <div className="ht-body">

        {/* ÖVERSIKT tab */}
        {activeTab === 'oversikt' && (
          <>
            {/* Spak A — paussnack + preview */}
            <div style={{ marginBottom: 14 }}>
              <p className="pep-l">{PAUSSNACK_EYEBROW[situation]}</p>
              <div className="pep">
                {pepOptions.map(opt => (
                  <button
                    key={opt.lean}
                    onClick={() => onPauseLean(opt.lean)}
                    className={`pep-opt${opt.lean === selectedLean ? ' sel' : ''}`}
                  >
                    <div className="pep-t">{opt.line}</div>
                    <div className="pep-e">{opt.effect}</div>
                  </button>
                ))}
              </div>
              {/* Preview — förväntad bar-riktning (samma faktor som sim, §2) */}
              <div className="prev">
                <p className="prev-l">{PAUSSNACK_PREVIEW_LABEL}</p>
                <div className="prev-bar">
                  <div className="prev-fill" style={{ width: `${previewHomePct}%` }} />
                  <div className="prev-arrow" style={{ left: `${previewHomePct}%` }}>▲</div>
                </div>
              </div>
              <button className="pep-tactic-link" onClick={() => setActiveTab('taktik')}>
                Taktikjustering →
              </button>
            </div>
            <div className="ht-stats">
              <div><span>Skott</span><span>{halftimeStep?.shotsHome ?? 0} — {halftimeStep?.shotsAway ?? 0}</span></div>
              <div><span>Hörnor</span><span>{halftimeStep?.cornersHome ?? 0} — {halftimeStep?.cornersAway ?? 0}</span></div>
              <div><span>Utvisningar</span><span>{htHomeSuspensions} — {htAwaySuspensions}</span></div>
            </div>
            {bestPlayerName && (
              <p className="ht-best">⭐ Matchens spelare: <b>{bestPlayerName}</b>{bestPlayer?.position ? ` · ${positionShort(bestPlayer.position)}` : ''}</p>
            )}
            <p className="ht-analysis">"{analysis}"</p>
            {isSmFinal && (
              <p className="ht-analysis" style={{ borderTop: 'none' }}>
                Laget samlas i omklädningsrummet. Det är 45 minuter kvar till SM-guld.
              </p>
            )}
            {isCupFinal && !isSmFinal && (
              <p className="ht-analysis" style={{ borderTop: 'none' }}>
                Laget samlas i omklädningsrummet. Det är 45 minuter kvar till cuptiteln.
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
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '5px 8px', background: 'color-mix(in srgb, var(--panel) 55%, transparent)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
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
                <p style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginBottom: 4, fontWeight: 600 }}>Startande (sorterat på form)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  {sortedStarters.map(id => {
                    const isOut = pendingOutId === id
                    return (
                      <button
                        key={id}
                        onClick={() => handleStarterClick(id)}
                        style={{
                          padding: '6px 8px', textAlign: 'left', fontSize: 11,
                          background: isOut ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'color-mix(in srgb, var(--panel) 55%, transparent)',
                          border: `1px solid ${isOut ? 'color-mix(in srgb, var(--danger) 50%, transparent)' : 'color-mix(in srgb, var(--accent) 18%, transparent)'}`,
                          borderRadius: 5, color: isOut ? 'var(--danger)' : 'var(--text-light-secondary)',
                          cursor: 'pointer', fontWeight: isOut ? 700 : 400,
                        }}
                      >
                        {getPlayerLabel(id, true)}
                      </button>
                    )
                  })}
                </div>

                {/* Bench */}
                <p style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginBottom: 4, fontWeight: 600 }}>Bänk</p>
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
                          background: canSelect ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--panel) 55%, transparent)',
                          border: `1px solid ${canSelect ? 'color-mix(in srgb, var(--success) 35%, transparent)' : 'color-mix(in srgb, var(--accent) 18%, transparent)'}`,
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

        </div>

        {/* CTA footer — fixed, always visible */}
        <div style={{ padding: '4px 20px 16px', flexShrink: 0 }}>
          <button
            onClick={htSubs.length > 0 || htMentality || htTempo ? onApplyTactic : onContinue}
            className="btn btn-cta btn-primary"
            style={{ width: '100%' }}
          >
            ANDRA HALVLEK →
          </button>
        </div>
      </div>
    </div>
  )
}
