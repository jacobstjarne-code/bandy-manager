import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useManagedClub, useGameStore } from '../store/gameStore'
import { TrainingType, TrainingIntensity } from '../../domain/enums'
import { TrainingProjectsCard } from '../components/club/TrainingProjectsCard'
import { TrainingSection } from '../components/club/TrainingSection'
import { EkonomiTab } from '../components/club/EkonomiTab'
import { KlubbTab } from '../components/club/KlubbTab'
import { AkademiTab } from '../components/club/AkademiTab'
import { FirstVisitHint } from '../components/FirstVisitHint'
import { ClubMemoryView } from '../components/clubmemory/ClubMemoryView'
import { TranareTab } from '../components/club/TranareTab'
import { TabBar } from '../components/shared/TabBar'

// ── Main Screen ──────────────────────────────────────────────────────────────

type ClubTab = 'training' | 'ekonomi' | 'orten' | 'akademi' | 'minne' | 'tranare'

export function ClubScreen() {
  const club = useManagedClub()
  const game = useGameStore(s => s.game)
  const setTraining = useGameStore(s => s.setTraining)
  const activateCommunity = useGameStore(s => s.activateCommunity)
  const upgradeAcademy = useGameStore(s => s.upgradeAcademy)
  const upgradeFacilities = useGameStore(s => s.upgradeFacilities)
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
  const startFacilityProject = useGameStore(s => s.startFacilityProject)
  const recruitVolunteer = useGameStore(s => s.recruitVolunteer)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  const dismissHint = useGameStore(s => s.dismissHint)
  const navigate = useNavigate()
  const location = useLocation()
  const VALID_TABS: ClubTab[] = ['training', 'ekonomi', 'orten', 'akademi', 'minne', 'tranare']
  const rawTab = (location.state as { tab?: string } | null)?.tab
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
    { key: 'orten', label: 'Orten' },
    { key: 'akademi', label: 'Akademi' },
    { key: 'minne', label: 'Minne' },
    { key: 'tranare', label: 'Tränare' },
  ]

  const tabDescriptions: Record<string, string> = {
    ekonomi: 'Klubbkassa, budget, intäkter och utgifter.',
    orten: 'Lokalstöd, mecenater, kommun och föreningsaktiviteter.',
    akademi: 'Ungdomslag, talangutveckling och intag.',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div className="tab-bar-host">
        <TabBar
          tabs={TAB_LABELS.map(({ key, label }) => ({ id: key, label }))}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as ClubTab)}
        />
      </div>

      {/* Tab description */}
      {tabDescriptions[activeTab] && (
        <p className="tab-bar-desc">{tabDescriptions[activeTab]}</p>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 90px', paddingTop: 12 }}>

        {activeTab === 'orten' && !(game.dismissedHints ?? []).includes('orten') && (
          <FirstVisitHint
            screenId="orten"
            text="Aktivera kiosken och bandyskolan. Frivilliga och kommunbidrag håller klubben vid liv."
            onDismiss={() => dismissHint('orten')}
          />
        )}
        {activeTab === 'ekonomi' && !(game.dismissedHints ?? []).includes('ekonomi') && (
          <FirstVisitHint
            screenId="ekonomi"
            text="Klubbkassan är liten. Sponsorer + frivilliga + matchintäkter. Röda siffror = styrelsen agerar."
            onDismiss={() => dismissHint('ekonomi')}
          />
        )}

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
          <KlubbTab club={club} game={game} navigate={navigate} interactWithPolitician={interactWithPolitician} startFacilityProject={startFacilityProject} recruitVolunteer={recruitVolunteer} activateCommunity={activateCommunity} />
        )}

        {/* ── Tab 4: Akademi ── */}
        {activeTab === 'akademi' && (
          <AkademiTab
            club={club}
            game={game}
            upgradeAcademy={upgradeAcademy}
            upgradeFacilities={upgradeFacilities}
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
