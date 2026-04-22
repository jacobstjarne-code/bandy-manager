import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MEETING_OPENERS, BOARD_QUOTES as CURATED_QUOTES, BOARD_CHARACTERS } from '../../domain/data/boardQuotes'
import type { BoardSituation } from '../../domain/data/boardQuotes'

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
    'avoidBottom': 'Undvika botten av tabellen',
    'midTable': 'Etablera oss i mitten av tabellen',
    'challengeTop': 'Utmana om topplaceringar',
    'winLeague': 'Vinna SM-guld',
  }

  const verdictEmoji = lastSummary?.expectationVerdict === 'exceeded' ? '😊'
    : lastSummary?.expectationVerdict === 'met' ? '😐'
    : '😤'

  const sponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
  const sponsorIncome = sponsors.reduce((sum, s) => sum + s.weeklyIncome, 0)
  const maxSponsors = Math.min(6, 2 + Math.floor(club.reputation / 20))

  const players = game.players.filter(p => p.clubId === game.managedClubId)

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

  // Curated opener — plain narrative, deterministic
  const curatedOpener = MEETING_OPENERS[(gameIdSeed + latestCompletedRound) % MEETING_OPENERS.length]

  // Derive situation from current game state
  const situation: BoardSituation = (() => {
    if (club!.finances < 100000) return 'tight'
    if (club!.finances > 500000 || myPosition <= 3) return 'good'
    if ((game.boardObjectives ?? []).length > 0) return 'investment'
    return 'general'
  })()

  // Pick 2 curated quotes, situation-matched, no duplicate characters
  const situationQuotes = CURATED_QUOTES.filter(q => q.situation === situation)
  const generalQuotes = CURATED_QUOTES.filter(q => q.situation === 'general')
  const quotePool = situationQuotes.length >= 2 ? situationQuotes : [...situationQuotes, ...generalQuotes]
  const usedChars = new Set<string>()
  const selectedQuotes: typeof CURATED_QUOTES = []
  const quoteSeed = gameIdSeed + latestCompletedRound * 13
  for (let i = 0; i < quotePool.length && selectedQuotes.length < 2; i++) {
    const q = quotePool[(quoteSeed + i) % quotePool.length]
    if (!usedChars.has(q.character)) {
      usedChars.add(q.character)
      selectedQuotes.push(q)
    }
  }

  function handleStart() {
    clearBoardMeeting()
    navigate('/game')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
      minHeight: 44,
    }}>
      <img
        src="/bandymanager-logo.png"
        alt="Bandy Manager"
        style={{ height: 26, width: 'auto', opacity: 0.85 }}
      />
      <span style={{
        color: 'var(--text-light)', fontSize: 11, letterSpacing: 3,
        textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600,
      }}>
        STYRELSEMÖTE
      </span>
      <div style={{ width: 26 }} />
    </div>
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      background: 'var(--bg)',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>
      {/* Header */}
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
        Styrelsemöte
      </p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        Inför säsong {game.currentSeason}/{game.currentSeason + 1}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{club.name}</p>

      {/* Förra säsongen / Välkommen */}
      {isFirstSeason ? (
        <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 12px', background: 'rgba(196,122,58,0.06)', borderColor: 'rgba(196,122,58,0.18)' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            👋 Välkommen
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Välkommen som ny tränare för {club.name}. Styrelsen har
            stora förhoppningar på dig. Här är vad vi förväntar oss
            av den kommande säsongen.
          </p>
        </div>
      ) : (
        <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 12px', background: 'rgba(196,122,58,0.06)', borderColor: 'rgba(196,122,58,0.18)' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            {verdictEmoji} Förra säsongen
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {lastSummary.narrativeSummary}
          </p>
        </div>
      )}

      {/* Säsongens mål */}
      <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 12px' }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          {/* TODO(FAS 1): byt mot piktogram · schema · se ICON-BRIEF.md */}
          📋 Säsongens mål
        </p>
        <p style={{ fontSize: 15, color: 'var(--accent)', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
          {expectationText[club.boardExpectation] ?? 'Gör ert bästa'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {{ avoidBottom: 'Styrelsen vill se framsteg. Håll oss kvar i serien.',
             midTable: 'Håll er i övre halvan. Nedflyttning vore katastrofalt.',
             challengeTop: 'Styrelsen förväntar sig slutspel. Gå så långt ni kan.',
             winLeague: 'Styrelsen kräver guld. Annat vore en besvikelse.',
          }[club.boardExpectation] ?? 'Styrelsen följer utvecklingen och utvärderar efter säsongen.'}
        </p>
      </div>

      {/* Styrelsens uppdrag */}
      {(game.boardObjectives ?? []).length > 0 && (
        <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 12px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            📌 Styrelsens uppdrag
          </p>
          {(game.boardObjectives ?? []).map(obj => {
            const member = boardMembers.find(m => m.name === obj.ownerId)
            const roleLabel = member?.role === 'ordförande' ? 'Ordförande' : member?.role === 'kassör' ? 'Kassör' : 'Ledamot'
            return (
              <div key={obj.id} className="card-sharp" style={{ padding: '10px 12px', marginBottom: 6 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                  "{obj.description.split(': "')[1]?.replace(/"$/, '') ?? obj.description}"
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{obj.ownerId}</span>
                  {' · '}{roleLabel}
                </p>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                  → {obj.label}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Ekonomi */}
      <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 12px' }}>
        <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          {/* TODO(FAS 1): byt mot piktogram · ekonomi · se ICON-BRIEF.md */}
          💰 Ekonomi
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Klubbkassa</span>
          <span style={{ fontSize: 13, fontWeight: 600,
            color: club.finances > 0 ? 'var(--success)' : 'var(--danger)' }}>
            {club.finances >= 1000000
              ? `${(club.finances / 1000000).toFixed(1)} mkr`
              : `${Math.round(club.finances / 1000)} tkr`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
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

      {/* Trupp — WEAK-018 */}
      {(() => {
        const avgAge = players.length > 0
          ? (players.reduce((s, p) => s + p.age, 0) / players.length).toFixed(1)
          : '0'
        const veterans = players.filter(p => p.age >= 30)
        const expiring = players.filter(p => p.contractUntilSeason <= game.currentSeason + 1)
        const bestPlayer = [...players].sort((a, b) => b.currentAbility - a.currentAbility)[0]
        const captain = game.captainPlayerId ? players.find(p => p.id === game.captainPlayerId) : null

        const POSITION_AVG: Record<string, { sum: number; count: number }> = {}
        for (const p of players) {
          if (!POSITION_AVG[p.position]) POSITION_AVG[p.position] = { sum: 0, count: 0 }
          POSITION_AVG[p.position].sum += p.currentAbility
          POSITION_AVG[p.position].count += 1
        }
        const POSITION_LABELS: Record<string, string> = {
          Goalkeeper: 'Målvakt', Defender: 'Back', Half: 'Halvback', Midfielder: 'Mittfältare', Forward: 'Forward',
        }
        const weakestPos = Object.entries(POSITION_AVG)
          .filter(([, v]) => v.count > 0)
          .sort(([, a], [, b]) => (a.sum / a.count) - (b.sum / b.count))[0]
        const weakestLabel = weakestPos ? (POSITION_LABELS[weakestPos[0]] ?? weakestPos[0]) : '—'

        const squadNarrative = (() => {
          if (veterans.length >= 4 && expiring.length >= 3) return 'Erfaren trupp med många utgående kontrakt. En skiljeväg väntar.'
          if (players.filter(p => p.age < 23).length >= 5) return 'Många unga spelare. Potential finns — men tålamod krävs.'
          if (expiring.length >= 4) return 'Kontraktssituationen är pressad. Prioritera förnyelse tidigt.'
          return 'Truppen ser sammanhållen ut. Var kan vi höja oss ett snäpp?'
        })()

        const rows = [
          `• ${players.length} spelare i truppen, snittålder ${avgAge}`,
          `• ${veterans.length} spelare är 30+ (veteraner)`,
          `• ${expiring.length} kontrakt löper ut i år`,
          `• Svagaste position: ${weakestLabel}`,
          bestPlayer ? `• Stjärnan: ${bestPlayer.firstName} ${bestPlayer.lastName} (CA ${bestPlayer.currentAbility}, ${bestPlayer.age} år)` : null,
          captain ? `• Kapten: ${captain.firstName} ${captain.lastName}` : null,
        ].filter(Boolean) as string[]

        return (
          <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              {/* TODO(FAS 1): byt mot piktogram · spelartrupp · se ICON-BRIEF.md */}
              👥 Truppen just nu
            </p>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {rows.map((r, i) => <p key={i}>{r}</p>)}
            </div>
            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6 }}>
              <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {squadNarrative}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Styrelsemedlemmarnas röster */}
      {selectedQuotes.length > 0 && (
        <div className="card-sharp" style={{
          marginBottom: 12, padding: '10px 12px',
          background: 'rgba(196,122,58,0.04)',
          borderColor: 'rgba(196,122,58,0.15)',
        }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            💬 Styrelsemedlemmarna om läget
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 16, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            {curatedOpener}
          </p>
          {selectedQuotes.map((quote, i) => {
            const char = BOARD_CHARACTERS[quote.character]
            return (
              <div key={quote.character} style={{
                marginBottom: i < selectedQuotes.length - 1 ? 8 : 0,
                paddingBottom: i < selectedQuotes.length - 1 ? 8 : 0,
                borderBottom: i < selectedQuotes.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p style={{
                  fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6,
                  fontStyle: 'italic', marginBottom: 6, fontFamily: 'var(--font-display)',
                }}>
                  {quote.quote}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{char.name}</span>
                  {' · '}{char.role}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Knapp */}
      <button
        onClick={handleStart}
        className="btn btn-primary btn-cta"
      >
        {isFirstSeason ? 'Kör igång! →' : 'Starta säsongen →'}
      </button>
      </div>
    </div>
    <footer style={{
      height: 40, background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>BURY FEN</span>
    </footer>
    </div>
  )
}
