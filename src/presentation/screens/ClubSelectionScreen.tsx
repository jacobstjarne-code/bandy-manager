import { useState, useMemo } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { selectThreeOffers } from '../../domain/services/offerSelectionService'
import { OffersView } from '../components/clubselection/OffersView'
import { AllClubsView } from '../components/clubselection/AllClubsView'

export function ClubSelectionScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { newGame } = useGameStore()

  const managerName = (location.state as { managerName?: string } | null)?.managerName ?? ''

  const [view, setView] = useState<'offers' | 'all'>('offers')
  const [isStarting, setIsStarting] = useState(false)

  // Seed sätts en gång vid mount och ändras inte — samma seed = samma tre klubbar
  const seed = useMemo(() => Date.now(), [])
  const offers = useMemo(() => selectThreeOffers(seed), [seed])

  // Om managerName saknas — tillbaka till namnformulär
  if (!managerName) {
    return <Navigate to="/new-game" replace />
  }

  function handleSelect(clubId: string) {
    if (isStarting) return
    setIsStarting(true)
    setTimeout(() => {
      try {
        newGame(managerName, clubId)
        navigate('/intro')
      } catch (e) {
        console.error('ClubSelectionScreen: newGame misslyckades', e)
        setIsStarting(false)
      }
    }, 50)
  }

  if (isStarting) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>STARTAR...</span>
      </div>
    )
  }

  if (view === 'all') {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <AllClubsView
          onSelect={handleSelect}
          onBack={() => setView('offers')}
        />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <OffersView
        offers={offers}
        onSelect={handleSelect}
        onShowAll={() => setView('all')}
      />
    </div>
  )
}
