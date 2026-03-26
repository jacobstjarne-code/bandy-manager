import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function BoardMeetingScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearBoardMeeting = useGameStore(s => s.clearBoardMeeting)

  if (!game) { navigate('/game', { replace: true }); return null }

  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) { navigate('/game', { replace: true }); return null }

  const lastSummary = (game.seasonSummaries ?? []).slice(-1)[0]
  const isFirstSeason = !lastSummary

  const expectationText: Record<string, string> = {
    'avoidBottom': 'undvika botten av tabellen',
    'midTable': 'etablera oss i mitten av tabellen',
    'challengeTop': 'utmana om topplaceringar',
    'winLeague': 'vinna SM-guld',
  }

  const verdictEmoji = lastSummary?.expectationVerdict === 'exceeded' ? '😊'
    : lastSummary?.expectationVerdict === 'met' ? '😐'
    : '😤'

  const sponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
  const sponsorIncome = sponsors.reduce((sum, s) => sum + s.weeklyIncome, 0)
  const maxSponsors = Math.min(6, 2 + Math.floor(club.reputation / 20))

  const players = game.players.filter(p => p.clubId === game.managedClubId)
  const avgCA = players.length > 0
    ? Math.round(players.reduce((s, p) => s + p.currentAbility, 0) / players.length)
    : 0
  const avgAge = players.length > 0
    ? (players.reduce((s, p) => s + p.age, 0) / players.length).toFixed(1)
    : '0'

  function handleStart() {
    clearBoardMeeting()
    navigate('/game')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(6,14,25,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', zIndex: 500,
      maxWidth: 430, margin: '0 auto',
    }}>
      <div style={{
        background: '#0e1f33', border: '1px solid #1e3450',
        borderRadius: 16, padding: '28px 24px',
        width: '100%', maxWidth: 390,
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: '#4A6080', marginBottom: 8 }}>
          Styrelsemöte
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F0F4F8', marginBottom: 6 }}>
          Inför säsong {game.currentSeason}
        </h2>
        <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 20 }}>
          {club.name}
        </p>

        {/* Förra säsongen / Välkommen */}
        {isFirstSeason ? (
          <div style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 10, padding: '14px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', marginBottom: 8 }}>
              👋 VÄLKOMMEN
            </p>
            <p style={{ fontSize: 13, color: '#8A9BB0', lineHeight: 1.5 }}>
              Välkommen som ny tränare för {club.name}. Styrelsen har
              stora förhoppningar på dig. Här är vad vi förväntar oss
              av den kommande säsongen.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 10, padding: '14px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', marginBottom: 8 }}>
              {verdictEmoji} FÖRRA SÄSONGEN
            </p>
            <p style={{ fontSize: 13, color: '#8A9BB0', lineHeight: 1.5 }}>
              {lastSummary.narrativeSummary}
            </p>
          </div>
        )}

        {/* Säsongens mål */}
        <div style={{
          background: '#122235', border: '1px solid #1e3450',
          borderRadius: 10, padding: '14px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F4F8', marginBottom: 8 }}>
            📋 SÄSONGENS MÅL
          </p>
          <p style={{ fontSize: 14, color: '#C9A84C', fontWeight: 600, marginBottom: 4 }}>
            {expectationText[club.boardExpectation] ?? 'Gör ert bästa'}
          </p>
          <p style={{ fontSize: 12, color: '#4A6080' }}>
            Styrelsen förväntar sig att ni uppnår detta mål. Misslyckande kan få konsekvenser.
          </p>
        </div>

        {/* Ekonomi */}
        <div style={{
          background: '#122235', border: '1px solid #1e3450',
          borderRadius: 10, padding: '14px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F4F8', marginBottom: 8 }}>
            💰 EKONOMI
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>Klubbkassa</span>
            <span style={{ fontSize: 13, fontWeight: 600,
              color: club.finances > 0 ? '#22c55e' : '#ef4444' }}>
              {club.finances >= 1000000
                ? `${(club.finances / 1000000).toFixed(1)} mkr`
                : `${Math.round(club.finances / 1000)} tkr`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>Transferbudget</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C' }}>
              {club.transferBudget >= 1000000
                ? `${(club.transferBudget / 1000000).toFixed(1)} mkr`
                : `${Math.round(club.transferBudget / 1000)} tkr`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>Sponsorer</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#8A9BB0' }}>
              {sponsors.length}/{maxSponsors}{' '}
              {sponsorIncome > 0
                ? `(+${Math.round(sponsorIncome / 1000)} tkr/vecka)`
                : '(inga aktiva)'}
            </span>
          </div>
        </div>

        {/* Trupp */}
        <div style={{
          background: '#122235', border: '1px solid #1e3450',
          borderRadius: 10, padding: '14px', marginBottom: 24,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F4F8', marginBottom: 8 }}>
            👥 TRUPP
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>Antal spelare</span>
            <span style={{ fontSize: 13, color: '#F0F4F8' }}>{players.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>Snitt-Styrka</span>
            <span style={{ fontSize: 13, color: '#F0F4F8' }}>{avgCA}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>Snittålder</span>
            <span style={{ fontSize: 13, color: '#F0F4F8' }}>{avgAge}</span>
          </div>
        </div>

        {/* Knapp */}
        <button
          onClick={handleStart}
          style={{
            width: '100%', padding: '16px',
            background: '#C9A84C', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 800,
            color: '#0D1B2A', letterSpacing: '1px',
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          {isFirstSeason ? 'Kör igång! →' : 'Starta säsongen →'}
        </button>
      </div>
    </div>
  )
}
