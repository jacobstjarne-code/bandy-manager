import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useManagedClub, useGameStore } from '../store/gameStore'
import { TrainingType, TrainingIntensity } from '../../domain/enums'
import { TrainingProjectsCard } from '../components/club/TrainingProjectsCard'
import { TrainingSection } from '../components/club/TrainingSection'
import { EkonomiTab } from '../components/club/EkonomiTab'
import { OrtenTab } from '../components/club/OrtenTab'
import { AkademiTab } from '../components/club/AkademiTab'
import { ClubMemoryView } from '../components/clubmemory/ClubMemoryView'
import { TranareTab } from '../components/club/TranareTab'
import { TabBar } from '../components/shared/TabBar'
import { TabIntro } from '../components/shared/TabIntro'
import { TAB_INTROS } from '../../domain/data/tabIntros'
import { SectionLabel } from '../components/SectionLabel'
import { calculateClubEra, eraLabel } from '../../domain/services/clubEraService'

// ── Main Screen ──────────────────────────────────────────────────────────────

type ClubTab = 'training' | 'ekonomi' | 'orten' | 'akademi' | 'minne' | 'tranare'

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
  const setTransferBudget = useGameStore(s => s.setTransferBudget)
  const buyScoutRounds = useGameStore(s => s.buyScoutRounds)
  const interactWithPolitician = useGameStore(s => s.interactWithPolitician)
  const recruitVolunteer = useGameStore(s => s.recruitVolunteer)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  const navigate = useNavigate()
  const location = useLocation()
  const VALID_TABS: ClubTab[] = ['training', 'ekonomi', 'orten', 'akademi', 'minne', 'tranare']
  const rawTab = (location.state as { tab?: string; section?: string } | null)?.tab
  const rawSection = (location.state as { tab?: string; section?: string } | null)?.section
  const [activeTab, setActiveTab] = useState<ClubTab>(
    rawTab && VALID_TABS.includes(rawTab as ClubTab) ? (rawTab as ClubTab) : 'training'
  )

  useEffect(() => { markScreenVisited('club') }, [])

  if (!club || !game) return null

  const training = game.managedClubTraining ?? { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }

  const history = game.trainingHistory ?? []
  const recentSessions = history.length > 0
    ? history.slice(-3).reverse().map(session => {
        const inboxItem = game.inbox.find(item =>
          item.type === 'training' && item.body.includes(`Omgång ${session.roundNumber}`)
        )
        // AUDIT DEL 3 (2026-08-11): strukturerat fält istf ⚠️-räkning i body.
        const injuryCount = inboxItem?.injuredPlayerCount ?? 0
        return { roundNumber: session.roundNumber, focus: session.focus, injuryCount }
      })
    : undefined

  const trainingInjuriesThisSeason = game.inbox
    .filter(item => item.type === 'training')
    .reduce((sum, item) => sum + (item.injuredPlayerCount ?? 0), 0)

  const TAB_LABELS: { key: ClubTab; label: string }[] = [
    { key: 'training', label: 'Träning' },
    { key: 'ekonomi', label: 'Ekonomi' },
    { key: 'orten', label: 'Orten' },
    { key: 'akademi', label: 'Akademi' },
    { key: 'minne', label: 'Minne' },
    { key: 'tranare', label: 'Tränare' },
  ]

  const era = calculateClubEra(game)
  // AUDIT DEL 3 (2026-08-11): managerProfile.seasonsAtClub — samma fält TranareTab.tsx
  // redan visar som "Säsong N i klubben". game.currentSeason är kalenderår (2026), inte
  // ett säsongsindex. trainerArc.seasonCount räknas upp först vid säsongsslut och skulle
  // visa "år 0" under hela spelarens faktiska första säsong.
  const seasonCount = game.managerProfile?.seasonsAtClub ?? 1
  const openMemories = (game.activeAnniversaries ?? []).length

  return (
    <div className="screen-col-layout">
      {/* Klubben i korthet — AUDIT DEL 3 (2026-08-11) */}
      <div className="card-sharp" style={{ margin: '12px 12px 0', padding: '10px 12px', background: 'var(--bg-leather)', border: 'none' }}>
        <SectionLabel style={{ color: 'var(--text-light-secondary)', marginBottom: 4 }}>KLUBBEN I KORTHET</SectionLabel>
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-light)' }}>{eraLabel(era)}</div>
            <SectionLabel style={{ color: 'var(--text-light-secondary)', margin: 0 }}>
              {`Epok · år ${seasonCount}`}
            </SectionLabel>
          </div>
          {openMemories > 0 && (
            <div style={{ borderLeft: '1px solid rgba(255,255,255,.15)', paddingLeft: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{openMemories}</div>
              <div onClick={() => setActiveTab('minne')} style={{ cursor: 'pointer' }}>
                <SectionLabel style={{ color: 'var(--text-light-secondary)', margin: 0 }}>
                  Öppna minnen ›
                </SectionLabel>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar-host">
        <TabBar
          tabs={TAB_LABELS.map(({ key, label }) => ({ id: key, label }))}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as ClubTab)}
        />
      </div>

      {/* Tab description */}
      <TabIntro entry={TAB_INTROS[activeTab]} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 90px', paddingTop: 12 }}>

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
              proCount={game.players.filter(p => p.clubId === game.managedClubId && p.isFullTimePro).length}
              partTimeCount={game.players.filter(p => p.clubId === game.managedClubId && !p.isFullTimePro).length}
              avgFlexibility={(() => {
                const partTime = game.players.filter(p => p.clubId === game.managedClubId && !p.isFullTimePro && p.dayJob)
                return partTime.length > 0 ? Math.round(partTime.reduce((s, p) => s + (p.dayJob?.flexibility ?? 75), 0) / partTime.length) : undefined
              })()}
            />
          </>
        )}

        {/* ── Tab 2: Ekonomi ── */}
        {activeTab === 'ekonomi' && (
          <EkonomiTab club={club} game={game} seekSponsor={seekSponsor} activateCommunity={activateCommunity} setTransferBudget={setTransferBudget} buyScoutRounds={buyScoutRounds} onNavigateTab={(tab) => setActiveTab(tab as ClubTab)} />
        )}

        {/* ── Tab 3: Klubb ── */}
        {activeTab === 'orten' && (
          <OrtenTab club={club} game={game} navigate={navigate} interactWithPolitician={interactWithPolitician} recruitVolunteer={recruitVolunteer} activateCommunity={activateCommunity} onNavigateTab={(tab) => setActiveTab(tab as ClubTab)} scrollToSection={rawSection} />
        )}

        {/* ── Tab 4: Akademi ── */}
        {activeTab === 'akademi' && (
          <AkademiTab
            club={club}
            game={game}
            upgradeAcademy={upgradeAcademy}
            promoteYouthPlayer={promoteYouthPlayer}
            assignMentor={assignMentor}
            removeMentor={removeMentor}
            loanOutPlayer={loanOutPlayer}
            recallLoan={recallLoan}
          />
        )}

        {/* ── Tab 5: Minne ── */}
        {activeTab === 'minne' && <ClubMemoryView game={game} />}

        {/* ── Tab 6: Tränare ── */}
        {activeTab === 'tranare' && <TranareTab game={game} />}

      </div>
    </div>
  )
}
