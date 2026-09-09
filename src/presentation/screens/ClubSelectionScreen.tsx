import { useState, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { selectThreeOffers } from '../../domain/services/offerSelectionService'
import { OffersView } from '../components/clubselection/OffersView'
import { AllClubsView } from '../components/clubselection/AllClubsView'

interface ClubSelectionScreenProps {
  /** Deterministisk test-/dev-seam. Produktion använder route-state som förut. */
  managerNameOverride?: string
  /** Deterministisk test-/dev-seam. Produktion får fortfarande ett nytt urval per mount. */
  offerSeed?: number
}

export function ClubSelectionScreen({ managerNameOverride, offerSeed }: ClubSelectionScreenProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { newGame } = useGameStore()

  const managerName = managerNameOverride
    ?? (location.state as { managerName?: string } | null)?.managerName
    ?? ''

  const [view, setView] = useState<'offers' | 'all'>('offers')
  const [isStarting, setIsStarting] = useState(false)

  // O10 seed-i-länk (GO 2026-09-08, BACKLOG.md:55): en delad länk bär
  // ?seed=<tal> i stället för Jacobs egen slump. Samma seed ger samma tre
  // klubberbjudanden (selectThreeOffers nedan) OCH — vidarebefordrat till
  // newGame() i handleSelect — samma värld när mottagaren väljer en klubb.
  // Resten av O10-slingan (delningskortets text, landningsfrågan) är
  // medvetet parkerad post-launch, se POST_LAUNCH.md. Den mjuka ruleVersion-
  // missmatch-notisen är INTE parkerad — RuleVersionNotice.tsx (57210410,
  // 2026-09-02) täcker redan samma signal (game.ruleVersion vs
  // CURRENT_RULE_VERSION) generellt för alla saves, inte bara länkstartade.
  const linkSeed = useMemo(() => {
    const raw = searchParams.get('seed')
    if (raw === null) return undefined
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : undefined
  }, [searchParams])

  // Seed sätts en gång vid mount och ändras inte — samma seed = samma tre klubbar
  const seed = useMemo(() => offerSeed ?? linkSeed ?? Date.now(), [offerSeed, linkSeed])
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
        newGame(managerName, clubId, linkSeed)
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
        <span className="h-label">STARTAR...</span>
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
