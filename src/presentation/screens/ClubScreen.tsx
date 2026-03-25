import { useNavigate } from 'react-router-dom'
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

function formatCurrency(n: number): string {
  return n.toLocaleString('sv-SE') + ' kr'
}

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
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: 12,
    }}>
      <p style={{
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
    <SectionCard title="Träning">
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

export function ClubScreen() {
  const club = useManagedClub()
  const game = useGameStore(s => s.game)
  const setTraining = useGameStore(s => s.setTraining)
  const standing = useCurrentStanding()
  const navigate = useNavigate()

  if (!club || !game) return null

  const training = game.managedClubTraining ?? { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }

  // Build recent sessions (last 3) from training history
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

  // Count training injuries this season from inbox
  const trainingInjuriesThisSeason = game.inbox.filter(item =>
    item.type === 'training' && item.body.includes('⚠️')
  ).reduce((sum, item) => sum + (item.body.split('⚠️').length - 1), 0)

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{club.name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{club.region}</p>
      </div>

      {/* Träning */}
      <TrainingSection
        focus={training}
        recentSessions={recentSessions}
        trainingInjuriesThisSeason={trainingInjuriesThisSeason}
        onChangeFocus={setTraining}
      />

      {/* Sponsorer */}
      {(() => {
        const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
        const maxSponsors = Math.min(6, 2 + Math.floor(club.reputation / 20))
        const totalWeekly = activeSponsors.reduce((sum, s) => sum + s.weeklyIncome, 0)
        const slots = Array.from({ length: maxSponsors })
        return (
          <SectionCard title="Sponsorer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {activeSponsors.length} av {maxSponsors} sponsorplatser
              </span>
              {totalWeekly > 0 && (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                  +{formatCurrency(totalWeekly)}/vecka
                </span>
              )}
            </div>
            {slots.map((_, i) => {
              const sponsor = activeSponsors[i]
              if (sponsor) {
                return (
                  <div key={sponsor.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < maxSponsors - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{sponsor.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{sponsor.category}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                        +{formatCurrency(sponsor.weeklyIncome)}/v
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {sponsor.contractRounds} omg kvar
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={`empty-${i}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < maxSponsors - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Ledig plats</span>
                </div>
              )
            })}
          </SectionCard>
        )
      })()}

      {/* Ekonomi */}
      <SectionCard title="Ekonomi">
        <InfoRow label="Saldo" value={formatCurrency(club.finances)} />
        <InfoRow label="Lönebudget" value={formatCurrency(club.wageBudget) + '/mån'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Transferbudget</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(club.transferBudget)}</span>
        </div>
      </SectionCard>

      {/* Faciliteter */}
      <SectionCard title="Faciliteter">
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

      {/* Förväntan */}
      <SectionCard title="Förväntan">
        <InfoRow label="Styrelseförväntning" value={expectationLabel(club.boardExpectation)} />
        <InfoRow label="Supporterförväntning" value={expectationLabel(club.fanExpectation)} />
        <InfoRow label="Spelstil" value={styleLabel(club.preferredStyle)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Konstis</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{club.hasArtificialIce ? 'Ja' : 'Nej'}</span>
        </div>
      </SectionCard>

      {/* Tabellposition */}
      {standing && (
        <SectionCard title="Tabellposition">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}>
            {[
              { label: 'Plats', value: standing.position },
              { label: 'Poäng', value: standing.points },
              { label: 'Spelade', value: standing.played },
              { label: 'Mål+', value: standing.goalsFor },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 6px',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}>
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
              <div key={label} style={{
                flex: 1,
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 4px',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Säsongshistorik */}
      {game.seasonSummaries && game.seasonSummaries.length > 0 && (
        <SectionCard title="Säsongshistorik">
          {[...game.seasonSummaries].reverse().map(s => {
            const posColor = s.finalPosition <= 3 ? 'var(--accent)' : s.finalPosition >= 10 ? 'var(--danger)' : 'var(--text-primary)'
            let playoffLabel = ''
            if (s.playoffResult === 'champion') playoffLabel = '🏆'
            else if (s.playoffResult === 'finalist') playoffLabel = '🥈 Finalist'
            else if (s.playoffResult === 'semifinal') playoffLabel = 'SF'
            else if (s.playoffResult === 'quarterfinal') playoffLabel = 'KF'
            return (
              <div
                key={s.season}
                onClick={() => navigate(`/game/season-summary/${s.season}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  marginBottom: 10,
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', minWidth: 48 }}>{s.season}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: posColor, minWidth: 32, textAlign: 'center' }}>
                  {s.finalPosition}.
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 52, textAlign: 'center' }}>
                  {s.points} p
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textAlign: 'right' }}>
                  {playoffLabel}
                </span>
                <span style={{ fontSize: 14, color: 'var(--accent)', marginLeft: 8 }}>→</span>
              </div>
            )
          })}
        </SectionCard>
      )}
    </div>
  )
}
