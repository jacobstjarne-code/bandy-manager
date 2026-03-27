import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useManagedClub, useGameStore, useCurrentStanding } from '../store/gameStore'
import { ClubExpectation, ClubStyle, TrainingType, TrainingIntensity } from '../../domain/enums'
import { StatBar } from '../components/StatBar'
import {
  getTrainingEffects,
  trainingTypeLabel,
  trainingTypeEmoji,
  trainingTypeDescription,
  trainingIntensityLabel,
} from '../../domain/services/trainingService'
import type { TrainingFocus, TrainingProject } from '../../domain/entities/Training'
import { PROJECT_DEFINITIONS } from '../../domain/services/trainingProjectService'
import { formatCurrency } from '../utils/formatters'

function expectationLabel(e: ClubExpectation): string {
  const map: Record<ClubExpectation, string> = {
    [ClubExpectation.AvoidBottom]: 'Undvika nedflyttning',
    [ClubExpectation.MidTable]: 'Mitten av tabellen',
    [ClubExpectation.ChallengeTop]: 'Utmana toppen',
    [ClubExpectation.WinLeague]: 'Vinna ligan',
  }
  return map[e] ?? e
}

function styleLabel(s: ClubStyle): string {
  const map: Record<ClubStyle, string> = {
    [ClubStyle.Defensive]: 'Defensiv',
    [ClubStyle.Balanced]: 'Balanserad',
    [ClubStyle.Attacking]: 'Anfallsinriktad',
    [ClubStyle.Physical]: 'Fysisk',
    [ClubStyle.Technical]: 'Teknisk',
  }
  return map[s] ?? s
}

interface SectionCardProps {
  title: string
  children: React.ReactNode
  stagger?: number
}

function SectionCard({ title, children, stagger }: SectionCardProps) {
  return (
    <div
      className={stagger ? `card-stagger-${stagger}` : undefined}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        marginBottom: 12,
      }}
    >
      <p className="section-heading" style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
      marginBottom: 10,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

interface FacilityRowProps {
  label: string
  value: number
}

function FacilityRow({ label, value }: FacilityRowProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      <StatBar value={value} color='var(--accent)' height={5} />
    </div>
  )
}

// ── Training Section ─────────────────────────────────────────────────────────

const TRAINING_TYPES = Object.values(TrainingType)
const TRAINING_INTENSITIES = [
  TrainingIntensity.Light,
  TrainingIntensity.Normal,
  TrainingIntensity.Hard,
  TrainingIntensity.Extreme,
]

const INTENSITY_COLOR: Record<TrainingIntensity, string> = {
  [TrainingIntensity.Light]:   'var(--success)',
  [TrainingIntensity.Normal]:  'var(--text-primary)',
  [TrainingIntensity.Hard]:    'var(--warning)',
  [TrainingIntensity.Extreme]: 'var(--danger)',
}

const INTENSITY_TOOLTIP: Record<TrainingIntensity, string> = {
  [TrainingIntensity.Light]:   'Låg risk, långsam utveckling',
  [TrainingIntensity.Normal]:  'Balanserat',
  [TrainingIntensity.Hard]:    'Snabb utveckling, hög skaderisk',
  [TrainingIntensity.Extreme]: 'Maximal utveckling, mycket hög skaderisk ⚠️',
}

function injuryRiskLabel(modifier: number): string {
  if (modifier <= 0.8) return 'Låg'
  if (modifier <= 1.0) return 'Normal'
  if (modifier <= 1.4) return 'Hög'
  return 'Mycket hög ⚠️'
}

function moraleLabel(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `${n}`
  return 'Ingen påverkan'
}

interface TrainingSectionProps {
  focus: TrainingFocus
  recentSessions?: { roundNumber: number; focus: TrainingFocus; injuryCount: number }[]
  trainingInjuriesThisSeason: number
  onChangeFocus: (focus: TrainingFocus) => void
}

function TrainingSection({ focus, recentSessions, trainingInjuriesThisSeason, onChangeFocus }: TrainingSectionProps) {
  const effects = getTrainingEffects(focus)

  const attrLines = Object.entries(effects.attributeBoosts)
    .map(([attr, val]) => `${attributeLabel(attr)} +${val.toFixed(2)}`)
    .join(', ')

  return (
    <SectionCard title="Träning" stagger={1}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Träning sker automatiskt varje omgång baserat på inställningarna nedan.
      </p>
      {/* Type grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {TRAINING_TYPES.map(type => {
          const active = focus.type === type
          return (
            <button
              key={type}
              onClick={() => onChangeFocus({ ...focus, type })}
              style={{
                background: active ? 'rgba(234,179,8,0.12)' : 'var(--bg-elevated)',
                border: `1.5px solid ${active ? 'var(--warning)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 10px 8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 3 }}>{trainingTypeEmoji(type)}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--warning)' : 'var(--text-primary)', marginBottom: 2 }}>
                {trainingTypeLabel(type)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {trainingTypeDescription(type)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Intensity segmented control */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Intensitet
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
        {TRAINING_INTENSITIES.map(intensity => {
          const active = focus.intensity === intensity
          const color = INTENSITY_COLOR[intensity]
          return (
            <button
              key={intensity}
              onClick={() => onChangeFocus({ ...focus, intensity })}
              style={{
                padding: '8px 4px',
                borderRadius: 'var(--radius-sm)',
                background: active ? `${color}22` : 'var(--bg-elevated)',
                border: `1.5px solid ${active ? color : 'var(--border)'}`,
                color: active ? color : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {trainingIntensityLabel(intensity)}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
        {INTENSITY_TOOLTIP[focus.intensity]}
      </p>

      {/* Effects summary */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginBottom: (recentSessions && recentSessions.length > 0) ? 16 : 0,
      }}>
        {attrLines ? (
          <p style={{ fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Tränar: </span>{attrLines}
          </p>
        ) : (
          <p style={{ fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
            Ingen attributträning
          </p>
        )}
        <p style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Kondition: </span>
          <span style={{ color: effects.fitnessChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {effects.fitnessChange >= 0 ? '+' : ''}{effects.fitnessChange}
          </span>
          {'  '}
          <span style={{ color: 'var(--text-muted)' }}>Skaderisk: </span>
          <span style={{ color: effects.injuryRiskModifier > 1.0 ? 'var(--warning)' : 'var(--success)' }}>
            {injuryRiskLabel(effects.injuryRiskModifier)}
          </span>
          {'  '}
          <span style={{ color: 'var(--text-muted)' }}>Moral: </span>
          <span style={{ color: effects.moraleEffect > 0 ? 'var(--success)' : effects.moraleEffect < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {moraleLabel(effects.moraleEffect)}
          </span>
          {effects.sharpnessEffect > 0 && (
            <>
              {'  '}
              <span style={{ color: 'var(--text-muted)' }}>Skärpa: </span>
              <span style={{ color: 'var(--success)' }}>+{effects.sharpnessEffect}</span>
            </>
          )}
        </p>
      </div>

      {/* Recent sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>Senaste träningar</p>
          {recentSessions.map((session, i) => (
            <p key={i} style={{ marginBottom: i < recentSessions.length - 1 ? 6 : 0 }}>
              Omgång {session.roundNumber}: {trainingTypeLabel(session.focus.type)} ({trainingIntensityLabel(session.focus.intensity)})
              {session.injuryCount === 0
                ? <span style={{ color: 'var(--text-muted)' }}> — Inga skador</span>
                : <span style={{ color: 'var(--warning)' }}> — ⚠️ {session.injuryCount} skada{session.injuryCount > 1 ? 'r' : ''}</span>}
            </p>
          ))}
        </div>
      )}

      {/* Training injuries this season */}
      <div style={{
        background: trainingInjuriesThisSeason > 0 ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
        border: `1px solid ${trainingInjuriesThisSeason > 0 ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '8px 14px',
        marginTop: 8,
        fontSize: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: 'var(--text-muted)' }}>Träningsskador denna säsong</span>
        <span style={{ fontWeight: 600, color: trainingInjuriesThisSeason > 0 ? 'var(--danger)' : 'var(--success)' }}>
          {trainingInjuriesThisSeason === 0 ? 'Inga' : `${trainingInjuriesThisSeason} st`}
        </span>
      </div>
    </SectionCard>
  )
}

function attributeLabel(key: string): string {
  const map: Record<string, string> = {
    skating: 'Skridskoåkning', acceleration: 'Acceleration', stamina: 'Kondition',
    ballControl: 'Bollkontroll', passing: 'Passning', shooting: 'Skjutning',
    dribbling: 'Dribbling', vision: 'Vision', decisions: 'Spelsinne',
    workRate: 'Arbetsinsats', positioning: 'Positionering', defending: 'Försvar',
    cornerSkill: 'Hörnspel', goalkeeping: 'Målvaktsspel',
  }
  return map[key] ?? key
}

// ── Training Projects ─────────────────────────────────────────────────────────

const RISK_LABEL: Record<string, string> = {
  none: 'Ingen', low: 'Låg', medium: 'Medel', high: 'Hög',
}
const RISK_COLOR: Record<string, string> = {
  none: 'var(--success)', low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)',
}

interface TrainingProjectsCardProps {
  projects: TrainingProject[]
  onStart: (type: string, intensity: 'normal' | 'hard') => void
  onCancel: (id: string) => void
}

function TrainingProjectsCard({ projects, onStart, onCancel }: TrainingProjectsCardProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [pickerMsg, setPickerMsg] = useState<string | null>(null)

  const active = projects.filter(p => p.status === 'active')
  const recent = projects.filter(p => p.status === 'completed').slice(-2)
  const freeSlots = 3 - active.length

  function handleStart(type: string, intensity: 'normal' | 'hard') {
    onStart(type, intensity)
    setShowPicker(false)
    setPickerMsg(null)
  }

  return (
    <SectionCard title="Träningsprojekt" stagger={2}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Starta riktade projekt för snabbare spelarutveckling. Max 3 aktiva samtidigt.
      </p>

      {/* Active projects */}
      {active.map(p => {
        const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)
        if (!def) return null
        const progress = (p.roundsTotal - p.roundsRemaining) / p.roundsTotal
        return (
          <div key={p.id} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{def.emoji} {def.label}</span>
              <button
                onClick={() => onCancel(p.id)}
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Avbryt
              </button>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{def.effectDescription}</span>
              <span>{p.roundsRemaining} omg kvar · {p.intensity === 'hard' ? '⚡ Intensiv' : 'Normal'}</span>
            </div>
          </div>
        )
      })}

      {/* Recent completed */}
      {recent.map(p => {
        const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)
        if (!def) return null
        return (
          <div key={p.id} style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}>
            ✓ {def.emoji} {def.label} klar · {def.effectDescription}
            {(p.injuredPlayerIds?.length ?? 0) > 0 && (
              <span style={{ color: 'var(--warning)' }}> · ⚠️ {p.injuredPlayerIds!.length} skadad</span>
            )}
          </div>
        )
      })}

      {/* Free slots */}
      {freeSlots > 0 && !showPicker && (
        <button
          onClick={() => setShowPicker(true)}
          style={{
            width: '100%', padding: '10px', background: 'none',
            border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', marginBottom: 8,
          }}
        >
          + Starta nytt projekt ({freeSlots} slot{freeSlots > 1 ? 's' : ''} lediga)
        </button>
      )}

      {/* Project picker */}
      {showPicker && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Välj projekt
            </span>
            <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          {pickerMsg && (
            <p style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8 }}>{pickerMsg}</p>
          )}
          {PROJECT_DEFINITIONS.map(def => {
            const alreadyActive = active.some(p => p.type === def.type)
            return (
              <div key={def.type} style={{
                borderBottom: '1px solid var(--border)',
                paddingBottom: 10,
                marginBottom: 10,
                opacity: alreadyActive ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{def.emoji} {def.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      · {def.effectDescription}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: RISK_COLOR[def.injuryRisk] }}>
                    Risk: {RISK_LABEL[def.injuryRisk]}
                  </span>
                </div>
                {!alreadyActive && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleStart(def.type, 'normal')}
                      style={{
                        fontSize: 11, padding: '4px 10px', background: 'var(--bg-surface)',
                        border: '1px solid var(--border)', borderRadius: 99,
                        color: 'var(--text-primary)', cursor: 'pointer',
                      }}
                    >
                      Normal · {def.roundsNormal} omg
                    </button>
                    <button
                      onClick={() => handleStart(def.type, 'hard')}
                      style={{
                        fontSize: 11, padding: '4px 10px', background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99,
                        color: 'var(--danger)', cursor: 'pointer',
                      }}
                    >
                      ⚡ Intensiv · {def.roundsHard} omg
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ── Main Screen ──────────────────────────────────────────────────────────────

type ClubTab = 'training' | 'ekonomi' | 'klubb' | 'akademi'

export function ClubScreen() {
  const club = useManagedClub()
  const game = useGameStore(s => s.game)
  const setTraining = useGameStore(s => s.setTraining)
  const activateCommunity = useGameStore(s => s.activateCommunity)
  const upgradeAcademy = useGameStore(s => s.upgradeAcademy)
  const startTrainingProject = useGameStore(s => s.startTrainingProject)
  const cancelTrainingProject = useGameStore(s => s.cancelTrainingProject)
  const seekSponsor = useGameStore(s => s.seekSponsor)
  const [sponsorFeedback, setSponsorFeedback] = useState<string | null>(null)
  const [communityMsg, setCommunityMsg] = useState<{ key: string; text: string; ok: boolean } | null>(null)
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null)

  function handleActivate(key: string, level: string) {
    const result = activateCommunity(key, level)
    setCommunityMsg({ key, text: result.error ?? 'Aktiverat!', ok: result.success })
    setTimeout(() => setCommunityMsg(null), 3000)
  }
  const standing = useCurrentStanding()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<ClubTab>(
    (location.state as { tab?: ClubTab } | null)?.tab ?? 'training'
  )

  if (!club || !game) return null

  const training = game.managedClubTraining ?? { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }

  const history = game.trainingHistory ?? []
  const recentSessions = history.length > 0
    ? history.slice(-3).reverse().map(session => {
        const inboxItem = game.inbox.find(item =>
          item.type === 'training' && item.body.includes(`Omgång ${session.roundNumber}`)
        )
        const injuryCount = inboxItem ? (inboxItem.body.split('⚠️').length - 1) : 0
        return { roundNumber: session.roundNumber, focus: session.focus, injuryCount }
      })
    : undefined

  const trainingInjuriesThisSeason = game.inbox.filter(item =>
    item.type === 'training' && item.body.includes('⚠️')
  ).reduce((sum, item) => sum + (item.body.split('⚠️').length - 1), 0)

  const TAB_LABELS: { key: ClubTab; label: string }[] = [
    { key: 'training', label: 'Träning' },
    { key: 'ekonomi', label: 'Ekonomi' },
    { key: 'klubb', label: 'Klubb' },
    { key: 'akademi', label: 'Akademi' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{club.name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>{club.region}</p>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: 0,
        }}>
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 90px' }}>

        {/* ── Tab 1: Träning ── */}
        {activeTab === 'training' && (
          <>
            <TrainingSection
              focus={training}
              recentSessions={recentSessions}
              trainingInjuriesThisSeason={trainingInjuriesThisSeason}
              onChangeFocus={setTraining}
            />
            <TrainingProjectsCard
              projects={game.trainingProjects ?? []}
              onStart={(type, intensity) => startTrainingProject(type, intensity)}
              onCancel={(id) => cancelTrainingProject(id)}
            />
          </>
        )}

        {/* ── Tab 2: Ekonomi ── */}
        {activeTab === 'ekonomi' && (() => {
          const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
          const actualMonthlyWages = managedPlayers.reduce((sum, p) => sum + p.salary, 0)
          const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
          const maxSponsors = Math.min(6, 2 + Math.floor(club.reputation / 20))
          const weeklySponsors = activeSponsors.reduce((sum, s) => sum + s.weeklyIncome, 0)
          const ca = game.communityActivities
          const kioskEst = ca?.kiosk === 'upgraded' ? 10000 : ca?.kiosk === 'basic' ? 5000 : 0
          const lotteryEst = ca?.lottery === 'intensive' ? 4000 : ca?.lottery === 'basic' ? 1750 : 0
          const bandyplayEst = ca?.bandyplay ? 1500 : 0
          const functionariesEst = ca?.functionaries ? 4000 : 0
          const communityEst = kioskEst + lotteryEst + functionariesEst + bandyplayEst
          const weeklyBase = Math.round(club.reputation * 250)
          const weeklyIncome = weeklyBase + weeklySponsors + communityEst
          const weeklyWages = Math.round(actualMonthlyWages / 4)
          const netPerRound = weeklyIncome - weeklyWages
          const patron = game.patron?.isActive ? game.patron : null
          const kommunBidrag = game.localPolitician?.kommunBidrag ?? 0
          const wagePressure = actualMonthlyWages > club.wageBudget
          const slots = Array.from({ length: maxSponsors })

          return (
            <>
              {/* Kassaöversikt */}
              <SectionCard title="Kassaöversikt" stagger={1}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Saldo</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: club.finances < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {formatCurrency(club.finances)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Intäkter / omg</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(weeklyIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Lönekostnader / omg</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: wagePressure ? 'var(--danger)' : 'var(--text-primary)' }}>
                    -{formatCurrency(weeklyWages)}
                  </span>
                </div>
                {wagePressure && (
                  <p style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
                    ⚠️ Lönekostnader överstiger lönebudget ({formatCurrency(club.wageBudget)}/mån)
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Netto / omg</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: netPerRound >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {netPerRound >= 0 ? '+' : ''}{formatCurrency(netPerRound)}
                  </span>
                </div>
              </SectionCard>

              {/* Sponsorer */}
              <SectionCard title="Sponsorer" stagger={2}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {activeSponsors.length} av {maxSponsors} platser
                  </span>
                  {weeklySponsors > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                      +{formatCurrency(weeklySponsors)}/omg
                    </span>
                  )}
                </div>
                {slots.map((_, i) => {
                  const sponsor = activeSponsors[i]
                  return sponsor ? (
                    <div key={sponsor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < maxSponsors - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{sponsor.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{sponsor.category}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(sponsor.weeklyIncome)}/omg</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sponsor.contractRounds} omg kvar</div>
                      </div>
                    </div>
                  ) : (
                    <div key={`empty-${i}`} style={{ padding: '7px 0', borderBottom: i < maxSponsors - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Ledig plats</span>
                    </div>
                  )
                })}
                {activeSponsors.length < maxSponsors && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {sponsorFeedback && (
                      <p style={{ fontSize: 12, color: sponsorFeedback.startsWith('✅') ? 'var(--success)' : 'var(--text-muted)', marginBottom: 8 }}>
                        {sponsorFeedback}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        const result = seekSponsor()
                        if (result.success && result.sponsor) {
                          setSponsorFeedback(`✅ ${result.sponsor.name} tecknade avtal! +${formatCurrency(result.sponsor.weeklyIncome)}/omg`)
                        } else {
                          setSponsorFeedback(`Ingen intresserad just nu. (2,5 tkr avdraget)`)
                        }
                        setTimeout(() => setSponsorFeedback(null), 4000)
                      }}
                      style={{
                        width: '100%', padding: '10px', background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)', borderRadius: 8,
                        color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      📞 Ragga sponsor — 2,5 tkr
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* Föreningsaktiviteter */}
              {(() => {
                interface CommunityRow {
                  icon: string; name: string; active: boolean; status: string
                  income: string; value: number
                  actionKey?: string; actionLevel?: string; actionCost?: number; actionLabel?: string
                  upgradeKey?: string; upgradeLevel?: string; upgradeCost?: number; upgradeLabel?: string
                  noAction?: boolean
                }
                const communityRows: CommunityRow[] = [
                  {
                    icon: '🌭', name: 'Bandykiosken',
                    active: ca?.kiosk !== 'none' && !!ca?.kiosk,
                    status: ca?.kiosk === 'upgraded' ? 'Uppgraderad' : ca?.kiosk === 'basic' ? 'Aktiv' : 'Ej startad',
                    income: ca?.kiosk === 'upgraded' ? '~8 500 netto/match' : ca?.kiosk === 'basic' ? '~3 500 netto/match' : '—',
                    value: kioskEst,
                    ...(ca?.kiosk === 'none' || !ca?.kiosk
                      ? { actionKey: 'kiosk', actionLevel: 'basic', actionCost: 3000, actionLabel: 'Starta kiosk — 3 tkr' }
                      : ca?.kiosk === 'basic'
                        ? { upgradeKey: 'kiosk', upgradeLevel: 'upgraded', upgradeCost: 8000, upgradeLabel: 'Uppgradera — 8 tkr' }
                        : {}),
                  },
                  {
                    icon: '🎫', name: 'Föreningslotteriet',
                    active: ca?.lottery !== 'none' && !!ca?.lottery,
                    status: ca?.lottery === 'intensive' ? 'Intensiv' : ca?.lottery === 'basic' ? 'Aktiv' : 'Ej startad',
                    income: ca?.lottery === 'intensive' ? '~3 200 netto/omg' : ca?.lottery === 'basic' ? '~1 250 netto/omg' : '—',
                    value: lotteryEst,
                    ...(ca?.lottery === 'none' || !ca?.lottery
                      ? { actionKey: 'lottery', actionLevel: 'basic', actionCost: 1000, actionLabel: 'Starta lotteri — 1 tkr' }
                      : ca?.lottery === 'basic'
                        ? { upgradeKey: 'lottery', upgradeLevel: 'intensive', upgradeCost: 5000, upgradeLabel: 'Intensifiera — 5 tkr' }
                        : {}),
                  },
                  {
                    icon: '📺', name: 'Streamingavtal',
                    active: !!ca?.bandyplay,
                    status: ca?.bandyplay ? 'Aktiv' : club.reputation < 40 ? 'Ingen intresserad ännu' : 'Möjligt',
                    income: ca?.bandyplay ? '~1 500/match' : '—',
                    value: bandyplayEst,
                    ...(!ca?.bandyplay
                      ? { actionKey: 'bandyplay', actionLevel: 'active', actionCost: 0, actionLabel: 'Teckna avtal — gratis' }
                      : {}),
                  },
                  {
                    icon: '🏋️', name: 'Funktionärer',
                    active: !!ca?.functionaries,
                    status: ca?.functionaries ? 'Aktiv' : 'Ej rekryterade',
                    income: ca?.functionaries ? '~4 000 besparing/match' : '—',
                    value: functionariesEst,
                    ...(!ca?.functionaries
                      ? { actionKey: 'functionaries', actionLevel: 'active', actionCost: 2000, actionLabel: 'Rekrytera — 2 tkr' }
                      : {}),
                  },
                  {
                    icon: '🎄', name: 'Julmarknad',
                    active: !!ca?.julmarknad,
                    status: ca?.julmarknad ? 'Genomförd ✓' : 'Väntar (omg 8–12)',
                    income: ca?.julmarknad ? 'Klar' : '~8–18 tkr (engång)',
                    value: 0,
                    ...(!ca?.julmarknad
                      ? { actionKey: 'julmarknad', actionLevel: 'active', actionCost: 2000, actionLabel: 'Anordna — 2 tkr' }
                      : {}),
                  },
                  {
                    icon: '🏫', name: 'Bandyskola',
                    active: !!ca?.bandySchool,
                    status: ca?.bandySchool ? 'Aktiv' : 'Ej startad',
                    income: ca?.bandySchool ? '~1 000/omg + ungdom' : '—',
                    value: ca?.bandySchool ? 1000 : 0,
                    ...(!ca?.bandySchool
                      ? { actionKey: 'bandySchool', actionLevel: 'active', actionCost: 5000, actionLabel: 'Starta bandyskola — 5 tkr' }
                      : {}),
                  },
                  {
                    icon: '📱', name: 'Sociala medier',
                    active: !!ca?.socialMedia,
                    status: ca?.socialMedia ? 'Aktiv' : 'Ej startad',
                    income: ca?.socialMedia ? '+reputation' : '—',
                    value: ca?.socialMedia ? 0 : 0,
                    ...(!ca?.socialMedia
                      ? { actionKey: 'socialMedia', actionLevel: 'active', actionCost: 2000, actionLabel: 'Starta konto — 2 tkr' }
                      : {}),
                  },
                  {
                    icon: '🍺', name: 'VIP-tält',
                    active: !!ca?.vipTent,
                    status: ca?.vipTent ? 'Aktiv' : club.facilities > 60 ? 'Ej startad' : 'Kräver anläggning > 60',
                    income: ca?.vipTent ? '~10 000/match' : '—',
                    value: ca?.vipTent ? 10000 : 0,
                    ...(!ca?.vipTent && club.facilities > 60
                      ? { actionKey: 'vipTent', actionLevel: 'active', actionCost: 10000, actionLabel: 'Sätt upp VIP-tält — 10 tkr' }
                      : {}),
                  },
                  { icon: '🏪', name: 'Loppis', active: false, status: 'Slumpmässig händelse', income: '—', value: 0, noAction: true },
                  { icon: '🚗', name: 'Bilbingo', active: false, status: 'Försäsong', income: '—', value: 0, noAction: true },
                ]
                const communityTotal = communityRows.reduce((s, r) => s + r.value, 0)
                return (
                  <SectionCard title="Föreningsaktiviteter" stagger={3}>
                    {communityMsg && (
                      <p style={{ fontSize: 12, color: communityMsg.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 10, fontWeight: 600 }}>
                        {communityMsg.ok ? '✓' : '✗'} {communityMsg.text}
                      </p>
                    )}
                    {communityRows.map((row, i) => (
                      <div key={row.name} style={{
                        padding: '8px 0',
                        borderBottom: i < communityRows.length - 1 ? '1px solid var(--border)' : 'none',
                        opacity: row.active || !row.noAction ? 1 : 0.4,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (row.actionKey || row.upgradeKey) ? 6 : 0 }}>
                          <div>
                            <span style={{ fontSize: 13, opacity: row.active ? 1 : 0.6 }}>{row.icon} {row.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{row.status}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: row.active ? 'var(--success)' : 'var(--text-muted)' }}>
                            {row.income}
                          </span>
                        </div>
                        {row.actionKey && !row.active && (
                          <button
                            onClick={() => handleActivate(row.actionKey!, row.actionLevel!)}
                            disabled={club.finances < (row.actionCost ?? 0)}
                            style={{
                              width: '100%', padding: '6px 10px',
                              background: club.finances >= (row.actionCost ?? 0) ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${club.finances >= (row.actionCost ?? 0) ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}`,
                              borderRadius: 6, fontSize: 12, fontWeight: 600,
                              color: club.finances >= (row.actionCost ?? 0) ? '#C9A84C' : 'var(--text-muted)',
                              cursor: club.finances >= (row.actionCost ?? 0) ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {row.actionLabel}
                          </button>
                        )}
                        {row.upgradeKey && row.active && (
                          <button
                            onClick={() => handleActivate(row.upgradeKey!, row.upgradeLevel!)}
                            disabled={club.finances < (row.upgradeCost ?? 0)}
                            style={{
                              width: '100%', padding: '6px 10px',
                              background: club.finances >= (row.upgradeCost ?? 0) ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${club.finances >= (row.upgradeCost ?? 0) ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)'}`,
                              borderRadius: 6, fontSize: 11, fontWeight: 600,
                              color: club.finances >= (row.upgradeCost ?? 0) ? '#C9A84C' : 'var(--text-muted)',
                              cursor: club.finances >= (row.upgradeCost ?? 0) ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {row.upgradeLabel}
                          </button>
                        )}
                      </div>
                    ))}
                    {communityTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 2, borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Totalt / hemmamatch</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>~+{Math.round(communityTotal / 1000)} tkr</span>
                      </div>
                    )}
                  </SectionCard>
                )
              })()}

              {/* Patron & Kommunbidrag */}
              {(patron || kommunBidrag > 0) && (
                <SectionCard title="Övriga intäkter" stagger={4}>
                  {patron && patron.contribution > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: kommunBidrag > 0 ? 8 : 0, marginBottom: kommunBidrag > 0 ? 8 : 0, borderBottom: kommunBidrag > 0 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Patron — {patron.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(patron.contribution)}/sä</span>
                    </div>
                  )}
                  {kommunBidrag > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kommunbidrag</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(kommunBidrag)}/sä</span>
                    </div>
                  )}
                </SectionCard>
              )}

              <button
                onClick={() => navigate('/game/budget')}
                style={{
                  width: '100%', padding: '12px',
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#C9A84C', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                Budget & transferbudget →
              </button>
            </>
          )
        })()}

        {/* ── Tab 3: Klubb ── */}
        {activeTab === 'klubb' && (
          <>
            <SectionCard title="Faciliteter" stagger={1}>
              <FacilityRow label="Anläggningar" value={club.facilities} />
              <FacilityRow label="Ungdomskvalitet" value={club.youthQuality} />
              <FacilityRow label="Ungdomsrekrytering" value={club.youthRecruitment} />
              <div style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ungdomsutveckling</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{club.youthDevelopment}</span>
                </div>
                <StatBar value={club.youthDevelopment} color='var(--accent)' height={5} />
              </div>
            </SectionCard>

            <SectionCard title="Förväntan & profil" stagger={2}>
              <InfoRow label="Styrelseförväntning" value={expectationLabel(club.boardExpectation)} />
              <InfoRow label="Supporterförväntning" value={expectationLabel(club.fanExpectation)} />
              <InfoRow label="Spelstil" value={styleLabel(club.preferredStyle)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Konstis</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{club.hasArtificialIce ? 'Ja' : 'Nej'}</span>
              </div>
            </SectionCard>

            {standing && (
              <SectionCard title="Tabellposition" stagger={3}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Plats', value: standing.position },
                    { label: 'Poäng', value: standing.points },
                    { label: 'Spelade', value: standing.played },
                    { label: 'Mål+', value: standing.goalsFor },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'V', value: standing.wins },
                    { label: 'O', value: standing.draws },
                    { label: 'F', value: standing.losses },
                    { label: 'MålD', value: standing.goalDifference > 0 ? '+' + standing.goalDifference : String(standing.goalDifference) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 4px', textAlign: 'center', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {game.seasonSummaries && game.seasonSummaries.length > 0 && (
              <SectionCard title="Säsongshistorik" stagger={4}>
                {[...game.seasonSummaries].reverse().map(s => {
                  const posColor = s.finalPosition <= 3 ? 'var(--accent)' : s.finalPosition >= 10 ? 'var(--danger)' : 'var(--text-primary)'
                  let playoffLabel = ''
                  if (s.playoffResult === 'champion') playoffLabel = '🏆'
                  else if (s.playoffResult === 'finalist') playoffLabel = '🥈'
                  else if (s.playoffResult === 'semifinal') playoffLabel = 'SF'
                  else if (s.playoffResult === 'quarterfinal') playoffLabel = 'KF'
                  return (
                    <div
                      key={s.season}
                      onClick={() => navigate(`/game/season-summary/${s.season}`)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', minWidth: 48 }}>{s.season}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: posColor, minWidth: 32, textAlign: 'center' }}>{s.finalPosition}.</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 52, textAlign: 'center' }}>{s.points} p</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textAlign: 'right' }}>{playoffLabel}</span>
                      <span style={{ fontSize: 14, color: 'var(--accent)', marginLeft: 8 }}>→</span>
                    </div>
                  )
                })}
                <button
                  onClick={() => navigate('/game/history')}
                  style={{ width: '100%', marginTop: 8, padding: '10px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius-sm)', color: '#C9A84C', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                >
                  Hall of Fame & full historik →
                </button>
              </SectionCard>
            )}

            <button
              onClick={() => navigate('/game/doctor')}
              style={{ width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              🩺 Bandydoktorn →
            </button>
          </>
        )}

        {/* ── Tab 4: Akademi ── */}
        {activeTab === 'akademi' && (() => {
          const youthTeam = game.youthTeam
          const academyLevel = game.academyLevel ?? 'basic'
          const levelLabel = academyLevel === 'elite' ? 'Elitakademi' : academyLevel === 'developing' ? 'Satsning' : 'Grundverksamhet'
          const levelDrift = academyLevel === 'elite' ? 10000 : academyLevel === 'developing' ? 5000 : 2000
          const nextLevelLabel = academyLevel === 'basic' ? 'Satsning (50 tkr)' : academyLevel === 'developing' ? 'Elitakademi (150 tkr)' : null

          function handleUpgrade() {
            const result = upgradeAcademy()
            setUpgradeMsg(result.error ?? 'Uppgradering beställd! Träder i kraft nästa säsong.')
            setTimeout(() => setUpgradeMsg(null), 4000)
          }

          const readyPlayers = youthTeam?.players.filter(p => p.readyForPromotion) ?? []
          const almostReady = youthTeam?.players.filter(p => !p.readyForPromotion && p.currentAbility >= 20) ?? []
          const notReady = youthTeam?.players.filter(p => !p.readyForPromotion && p.currentAbility < 20) ?? []

          return (
            <div>
              {/* Academy level card */}
              <SectionCard title="Akademinivå" stagger={1}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{levelLabel}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(levelDrift / 1000)} tkr/omg</span>
                </div>
                {game.academyUpgradeInProgress && (
                  <p style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 8 }}>
                    Uppgradering pågår — klar säsong {game.academyUpgradeSeason}
                  </p>
                )}
                {upgradeMsg && (
                  <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>✓ {upgradeMsg}</p>
                )}
                {nextLevelLabel && !game.academyUpgradeInProgress && (
                  <button
                    onClick={handleUpgrade}
                    style={{
                      padding: '8px 14px', borderRadius: 'var(--radius)',
                      background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.4)',
                      color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                    }}
                  >
                    Uppgradera till {nextLevelLabel}
                  </button>
                )}
              </SectionCard>

              {/* P17 team */}
              {youthTeam && (
                <SectionCard title="Pojklaget (P17)" stagger={2}>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {youthTeam.seasonRecord.w}V {youthTeam.seasonRecord.d}O {youthTeam.seasonRecord.l}F
                      {' · '}GM {youthTeam.seasonRecord.gf} · GM mot {youthTeam.seasonRecord.ga}
                      {' · '}Plats {youthTeam.tablePosition}
                    </span>
                  </div>
                  {youthTeam.results.length > 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Senast: {(() => {
                        const last = youthTeam.results[youthTeam.results.length - 1]
                        const won = last.goalsFor > last.goalsAgainst
                        const drew = last.goalsFor === last.goalsAgainst
                        return `${won ? 'Vann' : drew ? 'Oavgjort' : 'Förlorade'} mot ${last.opponentName} ${last.goalsFor}–${last.goalsAgainst}`
                      })()}
                    </p>
                  )}

                  {/* Player list */}
                  {[
                    { label: 'Redo för uppkallning', players: readyPlayers },
                    { label: 'Utvecklas', players: almostReady },
                    { label: 'Tidiga talanger', players: notReady },
                  ].map(group => group.players.length > 0 && (
                    <div key={group.label} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                        {group.label}
                      </p>
                      {group.players.map(p => {
                        const stars = p.potentialAbility >= 70 ? '★★★★' : p.potentialAbility >= 55 ? '★★★' : p.potentialAbility >= 45 ? '★★' : '★'
                        return (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                                {p.age} år · {p.position.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>CA {Math.round(p.currentAbility)}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{stars}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  {youthTeam.players.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inga pojklagsspelare den här säsongen.</p>
                  )}
                </SectionCard>
              )}
            </div>
          )
        })()}

      </div>
    </div>
  )
}
