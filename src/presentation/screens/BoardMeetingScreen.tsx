import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { BOARD_QUOTES, BOARD_CONTEXT_QUOTES, BOARD_MEETING_OPENERS } from '../../domain/data/boardData'
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

  function getContextualQuote(personality: BoardPersonality, memberIndex: number): string {
    const baseIdx = (gameIdSeed + game!.currentSeason * 7 + latestCompletedRound + memberIndex * 3)
    const ctx = BOARD_CONTEXT_QUOTES[personality]
    const lastSeasonGood = lastSummary?.expectationVerdict === 'exceeded' || lastSummary?.expectationVerdict === 'met'
    const lastSeasonBad = lastSummary?.expectationVerdict === 'failed'

    // Build a pool: context-specific quotes first, then generic quotes
    let contextPool: string[] = []

    if (personality === 'supporter') {
      if (myPosition <= 3) contextPool = ctx.topPosition
      else if (myPosition >= 9) contextPool = ctx.bottomPosition
      if (lastSeasonGood) contextPool = [...contextPool, ...ctx.lastSeasonGood]
      if (lastSeasonBad) contextPool = [...contextPool, ...ctx.lastSeasonBad]
    }

    if (personality === 'ekonom') {
      if (club!.finances > 500000) contextPool = ctx.goodEconomy
      else if (club!.finances < 50000) contextPool = ctx.badEconomy
      if (sponsors.length < 2) contextPool = [...contextPool, ...ctx.fewSponsors]
      if (lastSeasonGood) contextPool = [...contextPool, ...ctx.lastSeasonGood]
      if (lastSeasonBad) contextPool = [...contextPool, ...ctx.lastSeasonBad]
    }

    if (personality === 'traditionalist') {
      const formation = club!.activeTactic?.formation
      if (formation && formation !== '3-3-4') contextPool = ctx.nonTraditionalFormation
      else contextPool = ctx.traditionalFormation
      if (lastSeasonGood) contextPool = [...contextPool, ...ctx.lastSeasonGood]
      if (lastSeasonBad) contextPool = [...contextPool, ...ctx.lastSeasonBad]
    }

    if (personality === 'modernist') {
      if (game!.communityActivities?.bandyplay) contextPool = ctx.hasCommunityActivities
      else contextPool = ctx.noCommunityActivities
      if (lastSeasonGood) contextPool = [...contextPool, ...ctx.lastSeasonGood]
      if (lastSeasonBad) contextPool = [...contextPool, ...ctx.lastSeasonBad]
    }

    // Combine: 60% chance of context quote if available, else generic
    const genericQuotes = BOARD_QUOTES[personality]
    if (contextPool.length > 0 && (baseIdx % 5 < 3)) {
      return contextPool[baseIdx % contextPool.length]
    }
    return genericQuotes[baseIdx % genericQuotes.length]
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 120px' }}>
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
        <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px', background: 'rgba(196,122,58,0.06)', borderColor: 'rgba(196,122,58,0.18)' }}>
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
        <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px', background: 'rgba(196,122,58,0.06)', borderColor: 'rgba(196,122,58,0.18)' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            {verdictEmoji} Förra säsongen
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {lastSummary.narrativeSummary}
          </p>
        </div>
      )}

      {/* Säsongens mål */}
      <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
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
        <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            📌 Styrelsens uppdrag
          </p>
          {(game.boardObjectives ?? []).map(obj => {
            const member = boardMembers.find(m => m.name === obj.ownerId)
            const roleLabel = member?.role === 'ordförande' ? 'Ordförande' : member?.role === 'kassör' ? 'Kassör' : 'Ledamot'
            return (
              <div key={obj.id} className="card-round" style={{ padding: '10px 14px', marginBottom: 8 }}>
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
      <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
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
          <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
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
      {boardMembers.length > 0 && (
        <div className="card-sharp" style={{
          marginBottom: 12, padding: '10px 14px',
          background: 'rgba(196,122,58,0.04)',
          borderColor: 'rgba(196,122,58,0.15)',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            💬 Styrelsemedlemmarna om läget
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            {openerText}
          </p>
          {(() => {
            const usedQuotes = new Set<string>()
            // Skip ordföranden i citat-listan — de talar redan i openerText
            const quotingMembers = boardMembers.filter(m => m.role !== 'ordförande')
            return quotingMembers.map((member, i) => {
            let quote = getContextualQuote(member.personality, i)
            // If same quote already used, try next index
            let attempts = 0
            while (usedQuotes.has(quote) && attempts < 5) {
              attempts++
              quote = getContextualQuote(member.personality, i + attempts * 7)
            }
            usedQuotes.add(quote)
            if (!quote) return null
            return (
              <div key={member.name + i} style={{
                marginBottom: i < quotingMembers.length - 1 ? 8 : 0,
                paddingBottom: i < quotingMembers.length - 1 ? 8 : 0,
                borderBottom: i < quotingMembers.length - 1 ? '1px solid var(--border)' : 'none',
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
          })
          })()}
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
