import { MatchEventType } from '../../../domain/enums'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { Tavlingstyp, Skede } from '../../../domain/services/matchTypeAxes'

/**
 * GRANSKA DEL 4 (2026-08-11/12), steg 4 — fast-lägets prosa. Detta är den
 * ENDA texten en snabbsimmare möter om matchen alls (mode:'fast' genererar
 * ingen kommentar under matchen, till skillnad från live/'full') — se
 * docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md.
 *
 * Tre lägen har egna pooler: skede==='final' (delad mellan cup- och
 * SM-final — steg 1: "final är inget eget tävlingstyp-värde"), tävlingstyp
 * 'slutspel' (icke-final), och 'avsked'. Liga och cup (icke-final) rör den
 * befintliga default-logiken nedan orört. Text från Opus (2026-08-12),
 * formulerad så den fungerar oavsett målsiffror — seger/förlust, inga
 * marginal-grenar.
 */
const QUICK_SUMMARY_FINAL_WIN = 'Det var finalen. Ni tog den.'
const QUICK_SUMMARY_FINAL_LOSS = 'Det var finalen. Ni fick åka hem utan.'
const QUICK_SUMMARY_SLUTSPEL_WIN = 'Slutspel. Det märks på tempot.'
const QUICK_SUMMARY_SLUTSPEL_LOSS = 'Slutspel. En match till hade suttit fint.'
const QUICK_SUMMARY_AVSKED_WIN = 'Sista matchen på hemmaisen. Publiken stannade kvar efteråt.'
const QUICK_SUMMARY_AVSKED_LOSS = 'Sista matchen på hemmaisen. Resultatet spelade mindre roll än vanligt.'
const QUICK_SUMMARY_AVSKED_DRAW = 'Sista matchen på hemmaisen. Oavgjort, och ingen brydde sig särskilt.'

export function generateQuickSummary(
  fixture: Fixture,
  managedIsHome: boolean,
  players: Player[],
  tavlingstyp?: Tavlingstyp,
  skede?: Skede,
): string {
  const homeScore = fixture.homeScore
  const awayScore = fixture.awayScore
  const myScore = managedIsHome ? homeScore : awayScore
  const theirScore = managedIsHome ? awayScore : homeScore

  // Rotorsak (upptäckt 2026-08-12, i samma steg som pratade in de här
  // poolerna): fixture.homeScore/awayScore är alltid LIKA på en straff-
  // avgjord match — en ren poängjämförelse hade klassat en vunnen
  // cupsemifinal på straffar som "oavgjort". won/lost härleds därför
  // OT-/straffmedvetet, samma logik GranskaScreen.tsx redan använder för
  // samma syfte (återanvänd, inte omskriven). Gäller ALLA isKnockout-
  // matcher (cup + slutspel, alla ronder) — inte bara final/avsked-grenarna.
  const penResult = fixture.penaltyResult
  const otResult = fixture.overtimeResult
  const wonByPenalties = penResult ? (managedIsHome ? penResult.home > penResult.away : penResult.away > penResult.home) : false
  const lostByPenalties = penResult ? (managedIsHome ? penResult.home < penResult.away : penResult.away < penResult.home) : false
  const wonByOT = otResult ? (managedIsHome ? otResult === 'home' : otResult === 'away') : false
  const lostByOT = otResult ? (managedIsHome ? otResult === 'away' : otResult === 'home') : false
  const won = myScore > theirScore || wonByOT || wonByPenalties
  const lost = myScore < theirScore || lostByOT || lostByPenalties

  // Final är alltid avgjord (isKnockout → övertid/straffar vid lika) —
  // ingen tredje "oavgjort"-variant given eller behövd.
  if (skede === 'final') return won ? QUICK_SUMMARY_FINAL_WIN : QUICK_SUMMARY_FINAL_LOSS
  if (tavlingstyp === 'slutspel') return won ? QUICK_SUMMARY_SLUTSPEL_WIN : QUICK_SUMMARY_SLUTSPEL_LOSS
  if (tavlingstyp === 'avsked') {
    // Avsked är, till skillnad från final/slutspel, inte nödvändigtvis en
    // isKnockout-match — en avskedsmatch KAN sluta oavgjort (vanlig ligamatch
    // med farewellMatchForPlayerId satt). Tredje raden levererad 2026-08-12.
    if (won) return QUICK_SUMMARY_AVSKED_WIN
    if (lost) return QUICK_SUMMARY_AVSKED_LOSS
    return QUICK_SUMMARY_AVSKED_DRAW
  }

  const margin = myScore - theirScore
  const totalGoals = homeScore + awayScore

  const goals = fixture.events.filter(e => e.type === MatchEventType.Goal)
  const lateGoals = goals.filter(e => (e.minute ?? 0) >= 55)
  const lateDecider = lateGoals.length > 0 && Math.abs(margin) <= 1

  const scorerCounts: Record<string, number> = {}
  const scorerNames: Record<string, string> = {}
  goals.forEach(e => {
    if (e.playerId) {
      scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
      const p = players.find(pl => pl.id === e.playerId)
      scorerNames[e.playerId] = p ? p.lastName : 'Okänd'
    }
  })
  const allScorers = Object.entries(scorerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pid, n]) => ({ name: scorerNames[pid] ?? 'Okänd', n }))

  function scorerLine(): string | null {
    if (allScorers.length === 0) return null
    if (allScorers.length === 1 && allScorers[0].n === 1) return `${allScorers[0].name} satte det enda målet.`
    if (allScorers.length === 1) return `${allScorers[0].name} svarade för samtliga ${allScorers[0].n} mål.`
    const top = allScorers[0]
    if (top.n >= 3) return `${top.name} dominerade målprotokollen med ${top.n} mål.`
    if (top.n === 2) return `${top.name} sköt två. Övriga: ${allScorers.slice(1).map(s => s.name).join(', ')}.`
    return allScorers.slice(0, 4).map(s => `${s.name} (${s.n})`).join(', ') + '.'
  }

  const lines: string[] = []

  if (myScore > theirScore) {
    if (margin >= 4) lines.push('En övertygande seger.')
    else if (margin === 3) lines.push('En klar seger.')
    else if (margin === 2) lines.push('En välförtjänt seger.')
    else if (lateDecider) lines.push('En dramatisk seger i slutminuterna.')
    else lines.push('En knapp men viktig seger.')
  } else if (myScore < theirScore) {
    if (margin <= -4) lines.push('En tung matchdag att glömma.')
    else if (margin === -3) lines.push('En klar förlust.')
    else if (lateDecider) lines.push('En bitter förlust i matchens slutskede.')
    else lines.push('En förlust att analysera.')
  } else {
    lines.push('En poäng som känns som en förlust — eller en vinst, beroende på perspektiv.')
  }

  const sl = scorerLine()
  if (sl) lines.push(sl)

  if (totalGoals >= 10) lines.push('Många mål i en öppen match.')
  else if (totalGoals <= 2) lines.push('En tät och defensiv drabbning.')

  return lines.join(' ')
}

// Seeded random for shot map positions
export function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function ratingColor(r: number): string {
  if (r >= 8) return 'var(--success)'
  if (r >= 6.5) return 'var(--text-primary)'
  if (r >= 5) return 'var(--text-secondary)'
  return 'var(--danger)'
}
