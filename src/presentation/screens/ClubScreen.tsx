import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useManagedClub, useGameStore, useCurrentStanding } from '../store/gameStore'
import { TrainingType, TrainingIntensity } from '../../domain/enums'
import { SectionCard } from '../components/SectionCard'
import { TrainingProjectsCard } from '../components/club/TrainingProjectsCard'
import { TrainingSection } from '../components/club/TrainingSection'
import { EkonomiTab } from '../components/club/EkonomiTab'
import { KlubbTab } from '../components/club/KlubbTab'

// ── Main Screen ──────────────────────────────────────────────────────────────

type ClubTab = 'training' | 'ekonomi' | 'klubb' | 'akademi'

export function ClubScreen() {
  const club = useManagedClub()
  const game = useGameStore(s => s.game)
  const setTraining = useGameStore(s => s.setTraining)
  const activateCommunity = useGameStore(s => s.activateCommunity)
  const upgradeAcademy = useGameStore(s => s.upgradeAcademy)
  const promoteYouthPlayer = useGameStore(s => s.promoteYouthPlayer)
  const assignMentor = useGameStore(s => s.assignMentor)
  const removeMentor = useGameStore(s => s.removeMentor)
  const loanOutPlayer = useGameStore(s => s.loanOutPlayer)
  const recallLoan = useGameStore(s => s.recallLoan)
  const startTrainingProject = useGameStore(s => s.startTrainingProject)
  const cancelTrainingProject = useGameStore(s => s.cancelTrainingProject)
  const seekSponsor = useGameStore(s => s.seekSponsor)
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null)
  const [promotionMsg, setPromotionMsg] = useState<string | null>(null)
  const [mentorMsg, setMentorMsg] = useState<string | null>(null)
  const [selectedMentorSeniorId, setSelectedMentorSeniorId] = useState<string>('')
  const [selectedMentorYouthId, setSelectedMentorYouthId] = useState<string>('')
  const [loanMsg, setLoanMsg] = useState<string | null>(null)
  const [selectedLoanPlayerId, setSelectedLoanPlayerId] = useState<string>('')
  const [selectedLoanClub, setSelectedLoanClub] = useState<string>('')
  const [selectedLoanRounds, setSelectedLoanRounds] = useState<number>(4)

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
      <div className="texture-leather" style={{ background: 'var(--bg-dark)', padding: '20px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-light)', marginBottom: 6 }}>{club.name}</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <span className="tag tag-dark">{club.region}</span>
        </div>

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
            <TrainingProjectsCard
              projects={game.trainingProjects ?? []}
              onStart={(type, intensity) => startTrainingProject(type, intensity)}
              onCancel={(id) => cancelTrainingProject(id)}
            />
            <TrainingSection
              focus={training}
              recentSessions={recentSessions}
              trainingInjuriesThisSeason={trainingInjuriesThisSeason}
              onChangeFocus={setTraining}
            />
          </>
        )}

        {/* ── Tab 2: Ekonomi ── */}
        {activeTab === 'ekonomi' && (
          <EkonomiTab club={club} game={game} seekSponsor={seekSponsor} activateCommunity={activateCommunity} navigate={navigate} />
        )}

        {/* ── Tab 3: Klubb ── */}
        {activeTab === 'klubb' && (
          <KlubbTab club={club} game={game} standing={standing} navigate={navigate} />
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

          const activeMentorships = (game.mentorships ?? []).filter(m => m.isActive)
          const managedPlayers = game.players.filter(p => p.clubId === club.id)
          const mentorCandidates = managedPlayers.filter(p => p.age >= 25 && p.discipline > 60)
          const youthForMentor = [
            ...(youthTeam?.players ?? []).map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName} (P17)` })),
            ...managedPlayers.filter(p => p.promotedFromAcademy).map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName} (A-lag)` })),
          ]

          const activeLoanDeals = game.loanDeals ?? []
          const loanablePlayers = managedPlayers.filter(p => p.age <= 23 && !p.isOnLoan)
          const LOAN_CLUBS = ['Skutskärs IF', 'Tillberga IK', 'Bollnäs GIF', 'Delsbo IF', 'Norrby IF']

          const currentRound = game.fixtures
            .filter(f => f.status === 'completed' && !f.isCup)
            .reduce((max, f) => Math.max(max, f.roundNumber), 0)

          return (
            <div>
              {/* Academy level card */}
              <SectionCard title="🏫 Akademinivå" stagger={1}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.4 }}>
                  Akademin utvecklar unga spelare. Uppgradera nivån för bättre rekrytering och utveckling.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{levelLabel}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(levelDrift / 1000)} tkr/omg</span>
                </div>
                {club.academyReputation !== undefined && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Akademirykte: {club.academyReputation}/100
                  </p>
                )}
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
                    className="btn btn-outline"
                    onClick={handleUpgrade}
                    style={{ width: '100%' }}
                  >
                    Uppgradera till {nextLevelLabel}
                  </button>
                )}
              </SectionCard>

              {/* P17 team */}
              {youthTeam && (
                <SectionCard title="⚽ Pojklaget (P17)" stagger={2}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.4 }}>
                    P17-laget spelar egna matcher. Talanger kan lyftas till A-laget när de är redo.
                  </p>
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

                  {promotionMsg && (
                    <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>✓ {promotionMsg}</p>
                  )}

                  {/* Player list */}
                  {[
                    { label: 'Redo för uppkallning', players: readyPlayers, canPromote: true },
                    { label: 'Utvecklas', players: almostReady, canPromote: true },
                    { label: 'Tidiga talanger', players: notReady, canPromote: false },
                  ].map(group => group.players.length > 0 && (
                    <div key={group.label} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                        {group.label}
                      </p>
                      {group.players.map(p => {
                        const stars = p.potentialAbility >= 70 ? '★★★★' : p.potentialAbility >= 55 ? '★★★' : p.potentialAbility >= 45 ? '★★' : '★'
                        return (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{p.firstName} {p.lastName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                                {p.age} år · {p.position.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>CA {Math.round(p.currentAbility)}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stars}</span>
                              {group.canPromote && (
                                <button
                                  onClick={() => {
                                    const result = promoteYouthPlayer(p.id)
                                    if (result.success) {
                                      const timingStr = result.timing === 'good' ? 'Perfekt tajming!' : result.timing === 'early' ? 'Lite tidig uppkallning.' : 'Sent men välkommen!'
                                      setPromotionMsg(`${p.firstName} ${p.lastName} kallad upp. ${timingStr}`)
                                      setTimeout(() => setPromotionMsg(null), 5000)
                                    } else {
                                      setPromotionMsg(result.error ?? 'Fel')
                                      setTimeout(() => setPromotionMsg(null), 4000)
                                    }
                                  }}
                                  className="btn btn-outline"
                                  style={{ padding: '3px 8px', fontSize: 11 }}
                                >
                                  Kalla upp
                                </button>
                              )}
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

              {/* Mentorskap */}
              <SectionCard title="🤝 Mentorskap" stagger={3}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.4 }}>
                  Para ihop en senior med en junior för snabbare utveckling.
                </p>
                {mentorMsg && (
                  <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>✓ {mentorMsg}</p>
                )}
                {activeMentorships.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {activeMentorships.map(m => {
                      const mentor = managedPlayers.find(p => p.id === m.seniorPlayerId)
                      const youth = youthTeam?.players.find(p => p.id === m.youthPlayerId)
                        ?? managedPlayers.find(p => p.id === m.youthPlayerId)
                      if (!mentor || !youth) return null
                      return (
                        <div key={m.youthPlayerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 13 }}>
                            {mentor.firstName} {mentor.lastName} → {'firstName' in youth ? `${youth.firstName} ${youth.lastName}` : ''}
                          </span>
                          <button
                            onClick={() => {
                              removeMentor(m.youthPlayerId)
                              setMentorMsg('Mentorskap avslutat.')
                              setTimeout(() => setMentorMsg(null), 3000)
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '3px 8px', fontSize: 11, color: 'var(--danger)' }}
                          >
                            Ta bort
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {activeMentorships.length < 3 && mentorCandidates.length > 0 && youthForMentor.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Tilldela mentor (max 3 aktiva)</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={selectedMentorSeniorId}
                        onChange={e => setSelectedMentorSeniorId(e.target.value)}
                        style={{ flex: 1, minWidth: 120, padding: '4px 6px', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        <option value="">Välj mentor</option>
                        {mentorCandidates.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (discp {p.discipline})</option>
                        ))}
                      </select>
                      <select
                        value={selectedMentorYouthId}
                        onChange={e => setSelectedMentorYouthId(e.target.value)}
                        style={{ flex: 1, minWidth: 120, padding: '4px 6px', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        <option value="">Välj spelare</option>
                        {youthForMentor.map(y => (
                          <option key={y.id} value={y.id}>{y.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!selectedMentorSeniorId || !selectedMentorYouthId) return
                          const result = assignMentor(selectedMentorSeniorId, selectedMentorYouthId)
                          setMentorMsg(result.error ?? 'Mentorskap tilldelat!')
                          setTimeout(() => setMentorMsg(null), 4000)
                          setSelectedMentorSeniorId('')
                          setSelectedMentorYouthId('')
                        }}
                        className="btn btn-outline"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                      >
                        Tilldela
                      </button>
                    </div>
                  </div>
                )}
                {mentorCandidates.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inga seniorer med tillräcklig disciplin (ålder ≥25, disciplin &gt;60).</p>
                )}
              </SectionCard>

              {/* Lån */}
              <SectionCard title="📤 Lån (U23)" stagger={4}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.4 }}>
                  Låna ut unga spelare för att ge dem speltid och utveckling.
                </p>
                {loanMsg && (
                  <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>✓ {loanMsg}</p>
                )}
                {activeLoanDeals.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Aktiva lån</p>
                    {activeLoanDeals.map(deal => {
                      const loanPlayer = game.players.find(p => p.id === deal.playerId)
                      if (!loanPlayer) return null
                      const roundsLeft = deal.endRound - currentRound
                      const lastReport = deal.reports[deal.reports.length - 1]
                      return (
                        <div key={deal.playerId} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{loanPlayer.firstName} {loanPlayer.lastName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{deal.destinationClubName} · {roundsLeft} omg kvar</span>
                            </div>
                            <button
                              onClick={() => {
                                recallLoan(deal.playerId)
                                setLoanMsg(`${loanPlayer.firstName} ${loanPlayer.lastName} återkallad.`)
                                setTimeout(() => setLoanMsg(null), 3000)
                              }}
                              className="btn btn-ghost"
                              style={{ padding: '3px 8px', fontSize: 11, color: 'var(--danger)' }}
                            >
                              Återkalla
                            </button>
                          </div>
                          {lastReport && (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              Senast: {lastReport.played ? `Spelade (betyg ${lastReport.rating}${lastReport.goals > 0 ? `, ${lastReport.goals} mål` : ''})` : 'Satt på bänken'}
                              {' · '}{deal.matchesPlayed}/{deal.totalMatches} matcher
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {loanablePlayers.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Låna ut spelare (max 23 år)</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={selectedLoanPlayerId}
                        onChange={e => setSelectedLoanPlayerId(e.target.value)}
                        style={{ flex: 1, minWidth: 120, padding: '4px 6px', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        <option value="">Välj spelare</option>
                        {loanablePlayers.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.age} år)</option>
                        ))}
                      </select>
                      <select
                        value={selectedLoanClub}
                        onChange={e => setSelectedLoanClub(e.target.value)}
                        style={{ flex: 1, minWidth: 120, padding: '4px 6px', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        <option value="">Välj mottagarklubb</option>
                        {LOAN_CLUBS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={selectedLoanRounds}
                        onChange={e => setSelectedLoanRounds(Number(e.target.value))}
                        style={{ padding: '4px 6px', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        {[2, 4, 6, 8].map(r => (
                          <option key={r} value={r}>{r} omgångar</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!selectedLoanPlayerId || !selectedLoanClub) return
                          const result = loanOutPlayer(selectedLoanPlayerId, selectedLoanClub, selectedLoanRounds)
                          setLoanMsg(result.error ?? 'Spelare utlånad!')
                          setTimeout(() => setLoanMsg(null), 4000)
                          setSelectedLoanPlayerId('')
                          setSelectedLoanClub('')
                        }}
                        className="btn btn-outline"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                      >
                        Låna ut
                      </button>
                    </div>
                  </div>
                )}
                {loanablePlayers.length === 0 && activeLoanDeals.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inga U23-spelare tillgängliga för lån.</p>
                )}
              </SectionCard>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
