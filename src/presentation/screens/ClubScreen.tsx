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
import type { TrainingFocus } from '../../domain/entities/Training'
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

// ── Main Screen ──────────────────────────────────────────────────────────────

type ClubTab = 'training' | 'ekonomi' | 'klubb'

export function ClubScreen() {
  const club = useManagedClub()
  const game = useGameStore(s => s.game)
  const setTraining = useGameStore(s => s.setTraining)
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
          <TrainingSection
            focus={training}
            recentSessions={recentSessions}
            trainingInjuriesThisSeason={trainingInjuriesThisSeason}
            onChangeFocus={setTraining}
          />
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
              </SectionCard>

              {/* Föreningsaktiviteter */}
              {(() => {
                const communityRows = [
                  {
                    icon: '🌭', name: 'Bandykiosken',
                    active: ca?.kiosk !== 'none' && !!ca?.kiosk,
                    status: ca?.kiosk === 'upgraded' ? 'Uppgraderad' : ca?.kiosk === 'basic' ? 'Aktiv' : 'Ej startad',
                    income: ca?.kiosk === 'upgraded' ? '~10 000/match' : ca?.kiosk === 'basic' ? '~5 000/match' : '—',
                    value: kioskEst,
                  },
                  {
                    icon: '🎫', name: 'Folkspel-lotteriet',
                    active: ca?.lottery !== 'none' && !!ca?.lottery,
                    status: ca?.lottery === 'intensive' ? 'Intensiv' : ca?.lottery === 'basic' ? 'Aktiv' : 'Ej startad',
                    income: ca?.lottery === 'intensive' ? '~4 000/omg' : ca?.lottery === 'basic' ? '~1 750/omg' : '—',
                    value: lotteryEst,
                  },
                  {
                    icon: '📺', name: 'BandyPlay',
                    active: !!ca?.bandyplay,
                    status: ca?.bandyplay ? 'Aktiv' : 'Ej startad',
                    income: ca?.bandyplay ? '~1 500/match' : '—',
                    value: bandyplayEst,
                  },
                  {
                    icon: '🏋️', name: 'Funktionärer',
                    active: !!ca?.functionaries,
                    status: ca?.functionaries ? 'Aktiv' : 'Ej rekryterade',
                    income: ca?.functionaries ? '-4 000/match (besparing)' : '—',
                    value: functionariesEst,
                  },
                  {
                    icon: '🎄', name: 'Julmarknad',
                    active: !!ca?.julmarknad,
                    status: ca?.julmarknad ? 'Genomförd ✓' : 'Väntar (dec)',
                    income: '—', value: 0,
                  },
                  {
                    icon: '🏪', name: 'Loppis',
                    active: false, status: 'Slumpmässig', income: '—', value: 0,
                  },
                  {
                    icon: '🚗', name: 'Bilbingo',
                    active: false, status: 'Försäsong', income: '—', value: 0,
                  },
                ]
                const communityTotal = communityRows.reduce((s, r) => s + r.value, 0)
                return (
                  <SectionCard title="Föreningsaktiviteter" stagger={3}>
                    {communityRows.map((row, i) => (
                      <div key={row.name} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '7px 0',
                        borderBottom: i < communityRows.length - 1 ? '1px solid var(--border)' : 'none',
                        opacity: row.active ? 1 : 0.4,
                      }}>
                        <div>
                          <span style={{ fontSize: 13 }}>{row.icon} {row.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{row.status}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: row.active ? 'var(--success)' : 'var(--text-muted)' }}>
                          {row.income}
                        </span>
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

      </div>
    </div>
  )
}
