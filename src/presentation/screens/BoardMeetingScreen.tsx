import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { BOARD_QUOTES, BOARD_MEETING_OPENERS } from '../../domain/data/boardData'
import type { BoardPersonality } from '../../domain/entities/SaveGame'

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

  // Board quotes logic
  const myStanding = game.standings.find(s => s.clubId === game.managedClubId)
  const myPosition = myStanding?.position ?? 6

  const boardMembers = (game.boardPersonalities ?? []).slice(0, 3)

  // Derive a stable round number for deterministic quote selection
  const latestCompletedRound = game.fixtures
    .filter(f => f.status === 'completed')
    .sort((a, b) => b.roundNumber - a.roundNumber)[0]?.roundNumber ?? 0

  function hashGameId(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h)
  }
  const gameIdSeed = hashGameId(game!.id ?? 'default')

  function getContextualQuote(personality: BoardPersonality, memberIndex: number): string {
    const baseIdx = (gameIdSeed + game!.currentSeason * 7 + latestCompletedRound + memberIndex * 3)

    if (personality === 'ekonom') {
      if (club!.finances > 500000) {
        return '"Ekonomin ser stabil ut. Klokt av oss att hålla ordning på kassan."'
      }
      const quotes = BOARD_QUOTES.ekonom
      return quotes[baseIdx % quotes.length]
    }

    if (personality === 'traditionalist') {
      const formation = club!.activeTactic?.formation
      if (formation && formation !== '3-3-4') {
        const complaints = BOARD_QUOTES.traditionalist.filter(q =>
          q.includes('3-3-4') || q.includes('taktiken') || q.includes('backar') || q.includes('Varför')
        )
        const pool = complaints.length > 0 ? complaints : BOARD_QUOTES.traditionalist
        return pool[baseIdx % pool.length]
      }
      return '"Vi kör 3-3-4 som sig bör. Det är bandyklubbens DNA."'
    }

    if (personality === 'supporter') {
      if (myPosition >= 11) {
        return '"Det är tufft just nu. Men jag tror på laget. Vi vänder det."'
      }
      if (myPosition >= 9) {
        return '"Vi behöver ta tre poäng. Det är dags att mobilisera."'
      }
      const quotes = BOARD_QUOTES.supporter
      return quotes[baseIdx % quotes.length]
    }

    if (personality === 'modernist') {
      if (game!.communityActivities?.bandyplay) {
        return '"Bandyskolan är ett bra steg framåt. Det är precis sånt vi behöver göra mer av."'
      }
      const quotes = BOARD_QUOTES.modernist
      return quotes[baseIdx % quotes.length]
    }

    const quotes = BOARD_QUOTES[personality as BoardPersonality]
    return quotes[baseIdx % quotes.length]
  }

  // Board meeting opener — deterministic based on season
  const openerTemplate = BOARD_MEETING_OPENERS[game.currentSeason % BOARD_MEETING_OPENERS.length]
  const ordforande = boardMembers.find(m => m.role === 'ordförande')
  const kassor = boardMembers.find(m => m.role === 'kassör')
  const openerText = openerTemplate
    .replace('{ordförande}', ordforande?.name ?? 'Ordföranden')
    .replace('{kassör}', kassor?.name ?? 'Kassören')

  const personalityLabel: Record<BoardPersonality, string> = {
    supporter: 'supporter',
    ekonom: 'ekonom',
    traditionalist: 'traditionalist',
    modernist: 'modernist',
  }

  function handleStart() {
    clearBoardMeeting()
    navigate('/game')
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 90px' }}>
      {/* Header */}
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
        Styrelsemöte
      </p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        Inför säsong {game.currentSeason}/{game.currentSeason + 1}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{club.name}</p>

      {/* Förra säsongen / Välkommen */}
      {isFirstSeason ? (
        <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px', background: 'rgba(196,122,58,0.06)', borderColor: 'rgba(196,122,58,0.18)' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            👋 Välkommen
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Välkommen som ny tränare för {club.name}. Styrelsen har
            stora förhoppningar på dig. Här är vad vi förväntar oss
            av den kommande säsongen.
          </p>
        </div>
      ) : (
        <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px', background: 'rgba(196,122,58,0.06)', borderColor: 'rgba(196,122,58,0.18)' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            {verdictEmoji} Förra säsongen
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {lastSummary.narrativeSummary}
          </p>
        </div>
      )}

      {/* Säsongens mål */}
      <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          📋 Säsongens mål
        </p>
        <p style={{ fontSize: 15, color: 'var(--accent)', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
          {expectationText[club.boardExpectation] ?? 'Gör ert bästa'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Styrelsen förväntar sig att ni uppnår detta mål. Misslyckande kan få konsekvenser.
        </p>
      </div>

      {/* Ekonomi */}
      <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          💰 Ekonomi
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Klubbkassa</span>
          <span style={{ fontSize: 13, fontWeight: 600,
            color: club.finances > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {club.finances >= 1000000
              ? `${(club.finances / 1000000).toFixed(1)} mkr`
              : `${Math.round(club.finances / 1000)} tkr`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Transferbudget</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
            {club.transferBudget >= 1000000
              ? `${(club.transferBudget / 1000000).toFixed(1)} mkr`
              : `${Math.round(club.transferBudget / 1000)} tkr`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sponsorer</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {sponsors.length}/{maxSponsors}{' '}
            {sponsorIncome > 0
              ? `(+${Math.round(sponsorIncome / 1000)} tkr/vecka)`
              : '(inga aktiva)'}
          </span>
        </div>
      </div>

      {/* Trupp */}
      <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          👥 Trupp
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Antal spelare</span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{players.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Snitt-Styrka</span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{avgCA}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Snittålder</span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{avgAge}</span>
        </div>
      </div>

      {/* Styrelsemedlemmarnas röster */}
      {boardMembers.length > 0 && (
        <div className="card-sharp" style={{
          marginBottom: 24, padding: '14px 16px',
          background: 'rgba(196,122,58,0.04)',
          borderColor: 'rgba(196,122,58,0.15)',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            💬 Styrelsemedlemmarna om läget
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            {openerText}
          </p>
          {boardMembers.map((member, i) => {
            const quote = getContextualQuote(member.personality, i)
            if (!quote) return null
            return (
              <div key={member.name + i} style={{
                marginBottom: i < boardMembers.length - 1 ? 14 : 0,
                paddingBottom: i < boardMembers.length - 1 ? 14 : 0,
                borderBottom: i < boardMembers.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p style={{
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                  fontStyle: 'italic', marginBottom: 6, fontFamily: 'var(--font-display)',
                }}>
                  {quote}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{member.name}</span>
                  {' · '}{member.role}{' · '}{personalityLabel[member.personality]}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Knapp */}
      <button
        onClick={handleStart}
        className="btn btn-copper"
        style={{
          width: '100%', padding: '16px',
          fontSize: 15, fontWeight: 800,
          letterSpacing: '1px', textTransform: 'uppercase',
          borderRadius: 12,
        }}
      >
        {isFirstSeason ? 'Kör igång! →' : 'Starta säsongen →'}
      </button>
      </div>
    </div>
  )
}
