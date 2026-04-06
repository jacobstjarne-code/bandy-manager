import { useState } from 'react'
import type { Player } from '../../domain/entities/Player'
import { PlayerPosition, PlayerArchetype } from '../../domain/enums'
import { StatBar } from './StatBar'
import { formatCurrency } from '../utils/formatters'
import { useGameStore } from '../store/gameStore'

interface PlayerProfileContentProps {
  player: Player
  isOwned?: boolean
}

function positionLabel(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'MV',
    [PlayerPosition.Defender]: 'B',
    [PlayerPosition.Half]: 'YH',
    [PlayerPosition.Midfielder]: 'MF',
    [PlayerPosition.Forward]: 'A',
  }
  return map[pos] ?? pos
}

function archetypeLabel(arch: PlayerArchetype): string {
  const map: Record<PlayerArchetype, string> = {
    [PlayerArchetype.TwoWaySkater]: 'Tvåvägsskridskare',
    [PlayerArchetype.Playmaker]: 'Spelförare',
    [PlayerArchetype.Finisher]: 'Målskytt',
    [PlayerArchetype.Dribbler]: 'Dribblare',
    [PlayerArchetype.DefensiveWorker]: 'Defensiv arbetare',
    [PlayerArchetype.CornerSpecialist]: 'Hörnspecialist',
    [PlayerArchetype.ReflexGoalkeeper]: 'Reflexmålvakt',
    [PlayerArchetype.PositionalGoalkeeper]: 'Positionsmålvakt',
    [PlayerArchetype.RawTalent]: 'Råtalang',
  }
  return map[arch] ?? arch
}

function statColor(value: number): string {
  if (value < 40) return 'var(--danger)'
  if (value < 60) return 'var(--warning)'
  if (value < 75) return 'var(--text-secondary)'
  return 'var(--success)'
}

function barColor(value: number): string {
  if (value > 65) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function caColor(ca: number): string {
  if (ca < 40) return 'var(--text-muted)'
  if (ca < 60) return 'var(--warning)'
  if (ca < 75) return 'var(--text-primary)'
  return 'var(--success)'
}

const TABS = ['Översikt', 'Attribut', 'Kontrakt', 'Säsong'] as const
type Tab = typeof TABS[number]

interface AttrRowProps {
  label: string
  value: number
}

function AttrRow({ label, value }: AttrRowProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: statColor(value) }}>{Math.round(value)}</span>
      </div>
      <StatBar value={value} color={statColor(value)} height={5} />
    </div>
  )
}

interface AttrGroupProps {
  title: string
  rows: { label: string; value: number }[]
}

function AttrGroup({ title, rows }: AttrGroupProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p className="section-heading" style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}>
        {title}
      </p>
      {rows.map(r => <AttrRow key={r.label} label={r.label} value={r.value} />)}
    </div>
  )
}

export function PlayerProfileContent({ player, isOwned = false }: PlayerProfileContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Översikt')
  const game = useGameStore(s => s.game)
  const talkToPlayer = useGameStore(s => s.talkToPlayer)
  const [talkFeedback, setTalkFeedback] = useState<{ text: string; moraleChange: number; formChange: number } | null>(null)

  const currentRound = game
    ? (game.fixtures.filter(f => f.status === 'completed').sort((a, b) => b.roundNumber - a.roundNumber)[0]?.roundNumber ?? 0)
    : 0
  const lastTalked = (game?.playerConversations ?? {})[player.id] ?? -Infinity
  const canTalk = isOwned && currentRound - lastTalked >= 3

  function handleTalk(choice: 'encourage' | 'demand' | 'future') {
    const result = talkToPlayer(player.id, choice, currentRound)
    setTalkFeedback({ text: result.feedback, moraleChange: result.moraleChange, formChange: result.formChange })
    setTimeout(() => setTalkFeedback(null), 4000)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Player name & basics */}
      <div style={{ padding: '0 20px 16px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
          {player.firstName} {player.lastName}
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent)',
          }}>
            {positionLabel(player.position)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {archetypeLabel(player.archetype)}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {player.age} år · {player.nationality}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        marginBottom: 20,
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              padding: '8px 12px 10px',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        {activeTab === 'Översikt' && (
          <div>
            {/* Stat rows */}
            {[
              { label: 'Form', value: player.form },
              { label: 'Kondition', value: player.fitness },
              { label: 'Skärpa', value: player.sharpness },
              { label: 'Moral', value: player.morale },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(value)}</span>
                </div>
                <StatBar value={value} color={barColor(value)} height={6} />
              </div>
            ))}

            {/* Season stats summary */}
            {player.seasonStats.gamesPlayed > 0 && (
              <div
                onClick={() => setActiveTab('Säsong')}
                style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Säsongen
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{player.seasonStats.gamesPlayed}</span> M
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: player.seasonStats.goals > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{player.seasonStats.goals}</span> mål
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: player.seasonStats.assists > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{player.seasonStats.assists}</span> assist
                  </span>
                  <span style={{ fontSize: 13 }}>
                    <span style={{
                      fontWeight: 700,
                      color: player.seasonStats.averageRating >= 7.5 ? 'var(--accent)'
                        : player.seasonStats.averageRating >= 6.0 ? 'var(--text-secondary)'
                        : 'var(--danger)',
                    }}>
                      {player.seasonStats.averageRating.toFixed(1)}
                    </span>★
                  </span>
                </div>
              </div>
            )}

            {/* CA / PA */}
            <div style={{
              marginTop: 20,
              padding: '14px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Förmåga</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: caColor(player.currentAbility) }}>
                  {Math.round(player.currentAbility)}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / {player.potentialAbility}</span>
                </span>
              </div>
              <StatBar
                value={(player.currentAbility / player.potentialAbility) * 100}
                color='var(--accent)'
                height={5}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Nuvarande / Potential
              </p>
            </div>

            {/* Player conversation */}
            {isOwned && (
              <div style={{ marginTop: 24 }}>
                <p className="section-heading" style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12,
                }}>
                  Spelarsamtal
                </p>
                {talkFeedback ? (
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    animation: 'fadeInUp 200ms ease-out both',
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{talkFeedback.text}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      {talkFeedback.moraleChange !== 0 && (
                        <span style={{ color: talkFeedback.moraleChange > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          Moral {talkFeedback.moraleChange > 0 ? '+' : ''}{talkFeedback.moraleChange}
                        </span>
                      )}
                      {talkFeedback.formChange !== 0 && (
                        <span style={{ color: talkFeedback.formChange > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          Form {talkFeedback.formChange > 0 ? '+' : ''}{talkFeedback.formChange}
                        </span>
                      )}
                    </div>
                  </div>
                ) : canTalk ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {([
                      { id: 'encourage' as const, label: '👍 Uppmuntra', desc: '"Du gör ett bra jobb, fortsätt så."' },
                      { id: 'demand' as const, label: '💪 Kräv mer', desc: '"Jag vet att du kan bättre."' },
                      { id: 'future' as const, label: '🤝 Diskutera framtid', desc: '"Hur ser du på din framtid här?"' },
                    ]).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleTalk(opt.id)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{opt.label}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {lastTalked === -Infinity
                      ? 'Inget samtal ännu.'
                      : `Senast pratat: omgång ${lastTalked}. Nästa samtal möjligt omgång ${lastTalked + 3}.`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Attribut' && (
          <div>
            <AttrGroup
              title="Fysik"
              rows={[
                { label: 'Skridskoåkning', value: player.attributes.skating },
                { label: 'Acceleration', value: player.attributes.acceleration },
                { label: 'Uthållighet', value: player.attributes.stamina },
              ]}
            />
            <AttrGroup
              title="Teknik"
              rows={[
                { label: 'Bollkontroll', value: player.attributes.ballControl },
                { label: 'Passning', value: player.attributes.passing },
                { label: 'Skott', value: player.attributes.shooting },
                { label: 'Dribbling', value: player.attributes.dribbling },
              ]}
            />
            <AttrGroup
              title="Mental"
              rows={[
                { label: 'Speluppfattning', value: player.attributes.vision },
                { label: 'Spelsinne', value: player.attributes.decisions },
                { label: 'Arbetsvilja', value: player.attributes.workRate },
              ]}
            />
            <AttrGroup
              title="Taktik"
              rows={[
                { label: 'Positionering', value: player.attributes.positioning },
                { label: 'Försvar', value: player.attributes.defending },
                { label: 'Hörnor', value: player.attributes.cornerSkill },
              ]}
            />
            <AttrGroup
              title="Målvakt"
              rows={[
                { label: 'Målvaktsspel', value: player.attributes.goalkeeping },
              ]}
            />
          </div>
        )}

        {activeTab === 'Kontrakt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Lön', value: formatCurrency(player.salary) + '/mån' },
              { label: 'Kontrakt t.o.m. säsong', value: String(player.contractUntilSeason) },
              { label: 'Marknadsvärde', value: formatCurrency(player.marketValue) },
              { label: 'Hemmaväxt', value: player.isHomegrown ? 'Ja' : 'Nej' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Säsong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Matcher', value: String(player.seasonStats.gamesPlayed), isRating: false },
              { label: 'Mål', value: String(player.seasonStats.goals), isRating: false },
              { label: 'Assist', value: String(player.seasonStats.assists), isRating: false },
              { label: 'Hörnmål', value: String(player.seasonStats.cornerGoals), isRating: false },
              { label: 'Utvisningar', value: String(player.seasonStats.redCards), isRating: false },
              {
                label: 'Snittbetyg',
                value: player.seasonStats.gamesPlayed > 0
                  ? player.seasonStats.averageRating.toFixed(1)
                  : '-',
                isRating: true,
                rawRating: player.seasonStats.gamesPlayed > 0 ? player.seasonStats.averageRating : null,
              },
              { label: 'Speltid', value: player.seasonStats.minutesPlayed + ' min', isRating: false },
            ].map(({ label, value, isRating, rawRating }) => {
              const getRatingStyle = (): React.CSSProperties => {
                if (!isRating || rawRating === null || rawRating === undefined) return { fontSize: 14, fontWeight: 600 }
                if (rawRating >= 8.0) return {
                  fontSize: 14, fontWeight: 700,
                  background: 'rgba(196,122,58,0.2)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(196,122,58,0.4)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontFamily: "'SF Mono', 'Courier New', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }
                if (rawRating < 5.0) return {
                  fontSize: 14, fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontFamily: "'SF Mono', 'Courier New', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }
                return {
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "'SF Mono', 'Courier New', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }
              }
              return (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={getRatingStyle()}>
                    {isRating && rawRating !== null && rawRating !== undefined && rawRating >= 8.0 ? `✦ ${value}` : value}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
