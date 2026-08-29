import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useNavigate, Navigate } from 'react-router-dom'
import { canEnterCareerBreak } from '../../application/useCases/simulateCareerBreak'
import { CAREER_BREAK_START_CTA } from '../../domain/data/careerBreakText'

export function GameOverScreen() {
  const game = useGameStore(s => s.game)
  const clearFiredGame = useGameStore(s => s.clearFiredGame)
  const startCareerBreak = useGameStore(s => s.startCareerBreak)
  const navigate = useNavigate()
  const [simulating, setSimulating] = useState(false)

  if (!game) {
    navigate('/', { replace: true })
    return null
  }

  // O13: ett pågående uppehåll äger skärmen. Utan detta landade en omladdning
  // (eller en hård navigering till /game/game-over) på avskedsbeskedet igen,
  // efter att säsongen redan spelats — spelaren hade fått samma slag två
  // gånger och tappat vägen tillbaka till frågan.
  if (game.careerBreak) {
    return <Navigate to="/game/career-break" replace />
  }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const lastSummary = (game.seasonSummaries ?? []).slice(-1)[0]
  const finalPosition = lastSummary?.finalPosition ?? 0
  const totalSeasons = (game.seasonSummaries ?? []).length
  const bestPosition = game.seasonSummaries && game.seasonSummaries.length > 0
    ? Math.min(...game.seasonSummaries.map(s => s.finalPosition))
    : finalPosition
  const totalWins = game.seasonSummaries
    ? game.seasonSummaries.reduce((sum, s) => sum + s.wins, 0)
    : 0

  function getBoardStatement(): string {
    const patience = game!.boardPatience ?? 70
    const failures = game!.consecutiveFailures ?? 0

    if (failures >= 3) {
      return `Efter tre säsonger på rad utan förbättring ser styrelsen sig tvingad att göra en förändring. ${managedClub?.name ?? 'Klubben'} tackar för insatsen men önskar dig lycka till i framtiden.`
    }
    if (patience <= 15) {
      return `Styrelsen har förlorat förtroendet för dig som tränare efter de ihållande besvikelserna. Beslutet är fattat — du lämnar ${managedClub?.name ?? 'klubben'} med omedelbar verkan.`
    }
    return `Styrelsen har beslutat att göra en förändring i tränarrollen. Tack för din tid i ${managedClub?.name ?? 'klubben'}.`
  }

  // 3.3 (SLUTTEST_KO.md, 2026-08-17) Kontrakt A — två vägar, inte en. "Se
  // karriären" fångar game i route-state INNAN "Ny karriär" hinner nollställa
  // store:t (clearFiredGame), så historikvyn aldrig tappar den avslutade
  // karriärens data. handleNewGame() rensar store:t explicit — hasSave i
  // IntroSequence blir korrekt false utan att förlita sig på att newGame()
  // faktiskt anropas (spelaren kan avbryta på klubbvalet).
  function handleViewHistory() {
    navigate('/game/game-over/historik', { state: { snapshot: game } })
  }

  function handleNewGame() {
    clearFiredGame()
    navigate('/', { replace: true })
  }

  // O13 (DOM_TRANARMARKNADEN_2026-08-26): den tredje vägen. Knappen lovar
  // ingenting om ett nytt jobb — den startar bara uppehållet. Att erbjudandet
  // (eller uteblivandet av det) visas FÖRST efter att säsongen spelats är
  // domens uttryckliga ordning, och det är därför den här knappen inte heter
  // "sök nytt jobb". Simuleringen är synkron och tar ~1s; knappen låser sig
  // så den inte kan startas två gånger.
  const careerBreakAvailable = canEnterCareerBreak(game)

  function handleCareerBreak() {
    if (simulating) return
    setSimulating(true)
    // Ett tick så knappens låsta tillstånd hinner målas innan den synkrona
    // tvåsäsongerssimuleringen blockerar tråden.
    setTimeout(() => {
      const result = startCareerBreak()
      if (result) navigate('/game/career-break', { replace: true })
      else setSimulating(false)
    }, 0)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      zIndex: 1000,
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
        borderRadius: 'var(--radius)',
        padding: '32px 24px',
        width: '100%',
        maxWidth: 390,
        textAlign: 'center',
      }}>
        {/* Red warning icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
          border: '2px solid color-mix(in srgb, var(--danger) 40%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          ❌
        </div>

        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--danger)',
          marginBottom: 12,
        }}>
          Spelets slut
        </p>

        <h1 className="h-display-md" style={{
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '1px',
        }}>
          DU HAR SPARKATS
        </h1>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          {managedClub?.name ?? 'Klubben'}
        </p>

        {/* Board statement */}
        <div style={{
          background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <p className="h-label" style={{ color: 'var(--danger)', marginBottom: 8 }}>
            Styrelsens uttalande
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {getBoardStatement()}
          </p>
        </div>

        {/* Final stats */}
        <div className="card-sharp" style={{
          padding: '10px 14px',
          marginBottom: 24,
        }}>
          <p className="h-label" style={{ marginBottom: 12 }}>
            Din karriär
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{totalSeasons}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Säsonger</p>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)' }}>{bestPosition}.</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Bästa plats</p>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--success)' }}>{totalWins}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Totala vinster</p>
            </div>
          </div>
        </div>

        {/* 3.3 Kontrakt A: två vägar, inte en (DOM 2026-08-17).
            H1-uppföljning (2026-08-24): hela skärmen är position:fixed
            (rad 55) utan scrollbar mellanhand, så findTapTargetViolations
            räknar båda knapparna som "sticky CTA" — 10px fri kant mätt,
            kräver 44px (samma tröskel som navkollisionen i Bygget). Upptäckt
            i samma svep som registrerade denna, tidigare helt otäckta, yta. */}
        <button
          className="btn"
          onClick={handleViewHistory}
          style={{
            width: '100%',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: careerBreakAvailable ? 12 : 44,
          }}
        >
          SE KARRIÄREN
        </button>
        {/* O13: den tredje vägen. Primär när den finns — domen gör
            fortsättningen till huvudspåret och "Ny karriär" till alternativet,
            inte tvärtom. Endast EN .btn-primary per skärm (designsystemet),
            därför tappar "NY KARRIÄR" sin primärstil när den här visas. */}
        {careerBreakAvailable && (
          <button
            className="btn btn-primary"
            onClick={handleCareerBreak}
            disabled={simulating}
            style={{
              width: '100%',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: 44,
              opacity: simulating ? 0.6 : 1,
            }}
          >
            {CAREER_BREAK_START_CTA}
          </button>
        )}
        <button
          className={careerBreakAvailable ? 'btn' : 'btn btn-primary'}
          onClick={handleNewGame}
          style={{
            width: '100%',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          NY KARRIÄR
        </button>
      </div>
    </div>
  )
}
