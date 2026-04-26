import { getCoffeeRoomQuote } from './src/domain/services/coffeeRoomService'
import { fillTemplate, pickCommentary } from './src/domain/data/matchCommentary'
import { commentary } from './src/domain/data/matchCommentary'
import { generatePressConference } from './src/domain/services/pressConferenceService'
import { generatePostMatchOpponentQuote } from './src/domain/services/opponentManagerService'
import type { SaveGame } from './src/domain/entities/SaveGame'
import type { Scandal } from './src/domain/services/scandalService'
import type { Fixture } from './src/domain/entities/Fixture'
import type { Club } from './src/domain/entities/Club'

function makeClub(id: string, name: string): Club {
  return {
    id, name,
    shortName: name.slice(0, 3).toUpperCase(),
    reputation: 60,
    arenaName: `${name} Arena`,
    supporterGroupName: `${name}klacken`,
    budget: 100000, wageBudget: 80000, formation: '3-4-3',
    players: [], standings: { wins: 5, draws: 2, losses: 3, goalsFor: 30, goalsAgainst: 25 },
    arenaCapacity: 500,
  } as unknown as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'managed',
    currentSeason: 1, currentEra: 'growth',
    clubs: [makeClub('managed', 'Forsbacka'), makeClub('other', 'Sandviken'), makeClub('third', 'Värtan')],
    players: [], fixtures: [
      { id: 'f1', matchday: 7, roundNumber: 7, homeClubId: 'managed', awayClubId: 'other',
        status: 'completed', homeScore: 3, awayScore: 2, isCup: false } as unknown as Fixture,
    ],
    standings: [], inbox: [], scandalHistory: [],
    weeklyDecisionLastRound: 0, resolvedWeeklyDecisions: [], finances: [],
    ...overrides,
  } as unknown as SaveGame
}

function makeScandal(type: Scandal['type'], affectedClubId: string, triggerRound = 7): Scandal {
  return { id: `sc_${type}`, season: 1, triggerRound, type, affectedClubId,
    resolutionRound: triggerRound + 4, isResolved: false }
}

function rng(seed: number) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
}

// seed = round*11 + season*31. For seed%4===0 with season=1, round=7: 7*11+31=108, 108%4=0 ✓
// So round=7 fixtures + triggerRound=7 passes the triggerRound>=round-1 check

const TYPES: Scandal['type'][] = [
  'sponsor_collapse', 'treasurer_resigned', 'phantom_salaries',
  'club_to_club_loan', 'fundraiser_vanished', 'coach_meltdown', 'municipal_scandal'
]

// ── DEL 1 ────────────────────────────────────────────────────────────────────
console.log('\n═══ DEL 1 — Dashboard-kafferum ═══')

console.log('\n── OWN CLUB ──')
for (const t of TYPES) {
  const g = makeGame({ scandalHistory: [makeScandal(t, 'managed', 7)] })
  const r = getCoffeeRoomQuote(g)
  const tag = r?.text?.length ? '✅' : '❌ ingen quote'
  console.log(`  ${t}: ${tag}`)
  if (r) console.log(`    [${r.speaker}] ${r.text}`)
}

console.log('\n── OTHER CLUB ──')
for (const t of TYPES) {
  const g = makeGame({ scandalHistory: [makeScandal(t, 'other', 7)] })
  const r = getCoffeeRoomQuote(g)
  const tag = r?.text?.length ? '✅' : '❌ ingen quote'
  console.log(`  ${t}: ${tag}`)
  if (r) console.log(`    [${r.speaker}] ${r.text}`)
}

console.log('\n── EDGE CASES ──')
// small_absurdity
{
  const g = makeGame({ scandalHistory: [makeScandal('small_absurdity', 'managed', 7)] })
  const r = getCoffeeRoomQuote(g)
  // small_absurdity should not produce scandal quotes — check that the text is NOT a scandal line
  // We check the result doesn't contain strings unique to our scandal pools
  const isScandal = r?.text?.includes('Granskning') || r?.text?.includes('Tröjorna ska tryckas om') ||
    r?.text?.includes('kontoret') || r?.text?.includes('Skatteverket') || r?.text?.includes('Birger')
  console.log(`  small_absurdity (ska EJ trigga skandal): ${isScandal ? '❌ FEL' : '✅ OK'} → "${r?.text?.slice(0, 60) ?? 'null'}"`)
}
// Tom scandalHistory — no crash
{
  const g = makeGame({ scandalHistory: [] })
  try { getCoffeeRoomQuote(g); console.log('  Tom scandalHistory: ✅ inga fel') }
  catch (e) { console.log(`  Tom scandalHistory: ❌ krasch: ${e}`) }
}
// Gammal säsong
{
  const g = makeGame({ scandalHistory: [{ ...makeScandal('sponsor_collapse', 'managed', 7), season: 0 }] })
  const r = getCoffeeRoomQuote(g)
  const isScandal = r?.text?.includes('Tröjorna') || r?.text?.includes('Granskning')
  console.log(`  Gammal säsong (ska EJ trigga): ${isScandal ? '❌ FEL' : '✅ OK'} → "${r?.text?.slice(0, 60) ?? 'null'}"`)
}
// {KLUBB} ersätts
{
  const g = makeGame({ scandalHistory: [makeScandal('sponsor_collapse', 'other', 7)] })
  const r = getCoffeeRoomQuote(g)
  const hasPlaceholder = r?.text?.includes('{KLUBB}')
  const hasName = r?.text?.includes('Sandviken')
  console.log(`  {KLUBB}-substitution: ${hasPlaceholder ? '❌ FEL - platshållare kvar' : hasName ? '✅ Sandviken insubstituerat' : '✅ OK (ej KLUBB-variant denna seed)'}`)
  if (r) console.log(`    → "${r.text}"`)
}

// ── DEL 2 ────────────────────────────────────────────────────────────────────
console.log('\n═══ DEL 2 — Klack-commentary ═══')

const scandalCat = (commentary as Record<string, string[]>)['supporter_scandal_recent']
if (!scandalCat) {
  console.log('  ❌ supporter_scandal_recent SAKNAS')
} else {
  console.log(`  Antal strängar: ${scandalCat.length} (spec: 8) → ${scandalCat.length === 8 ? '✅' : '❌'}`)
  console.log('  Alla 8 strängar:')
  scandalCat.forEach((s, i) => console.log(`    [${i}] ${s}`))
  // Template substitution
  const ex = fillTemplate(scandalCat[0], { leader: 'Karl-Gustav', members: '34', groupName: 'Forsbackaklacken' })
  console.log(`  Exempelformatering: "${ex}"`)
  console.log(`  → {leader} substituerat: ${ex.includes('Karl-Gustav') ? '✅' : '❌'}`)
  // Distribution
  const seen = new Set<number>()
  for (let i = 0; i < 30; i++) {
    const r = rng(i * 137 + 42)
    const p = pickCommentary(scandalCat as unknown as Parameters<typeof pickCommentary>[0], r)
    seen.add(scandalCat.indexOf(p as string))
  }
  console.log(`  Distribution (30 seeds): ${seen.size} unika index → ${seen.size >= 5 ? '✅ god spridning' : '⚠️'}`)
}

// ── DEL 3 ────────────────────────────────────────────────────────────────────
console.log('\n═══ DEL 3 — Pressfrågor ═══')

const winFix: Fixture = {
  id: 'f1', matchday: 7, roundNumber: 7, homeClubId: 'managed', awayClubId: 'other',
  status: 'completed', homeScore: 5, awayScore: 1, isCup: false, events: [],
} as unknown as Fixture
const lossFix: Fixture = { ...winFix, homeScore: 1, awayScore: 4 } as unknown as Fixture
const drawFix: Fixture = { ...winFix, homeScore: 2, awayScore: 2 } as unknown as Fixture

function findScandalQuestion(game: SaveGame, fix: Fixture): string | null {
  const SCANDAL_TEXTS = ['skandal', 'turbulent', 'Bandysverige', 'rubriker', 'Förbundet', 'ekonomi', 'lugnaste']
  for (let seed = 0; seed < 60; seed++) {
    const pc = generatePressConference(game, fix, rng(seed * 31 + 7))
    const text = pc?.question?.text ?? ''
    if (SCANDAL_TEXTS.some(k => text.includes(k))) return text
  }
  return null
}

// Win utan skandal
{
  const g = makeGame({ scandalHistory: [] })
  const q = findScandalQuestion(g, winFix)
  console.log(`  Win utan skandal: ${q ? '❌ FEL — skandal-fråga ändå' : '✅ inga skandal-frågor'}`)
}
// Win med skandal
{
  const g = makeGame({ scandalHistory: [makeScandal('sponsor_collapse', 'managed', 7)] })
  const q = findScandalQuestion(g, winFix)
  console.log(`  Win med skandal: ${q ? '✅ skandal-fråga hittad' : '❌ ej hittad'}`)
  if (q) console.log(`    → "${q}"`)
}
// Loss med skandal
{
  const g = makeGame({ scandalHistory: [makeScandal('phantom_salaries', 'other', 7)] })
  const q = findScandalQuestion(g, lossFix)
  console.log(`  Loss med skandal: ${q ? '✅' : '❌'}`)
  if (q) console.log(`    → "${q}"`)
}
// Draw med skandal
{
  const g = makeGame({ scandalHistory: [makeScandal('coach_meltdown', 'managed', 7)] })
  const q = findScandalQuestion(g, drawFix)
  console.log(`  Draw med skandal: ${q ? '✅' : '❌'}`)
  if (q) console.log(`    → "${q}"`)
}
// Gammal säsong
{
  const g = makeGame({ scandalHistory: [{ ...makeScandal('sponsor_collapse', 'managed', 7), season: 0 }] })
  const q = findScandalQuestion(g, winFix)
  console.log(`  Gammal säsong: ${q ? '❌ FEL' : '✅ filtreras korrekt'}`)
}

// ── DEL 4 ────────────────────────────────────────────────────────────────────
console.log('\n═══ DEL 4 — Motståndartränare ═══')

const oClub = { ...makeClub('other', 'Sandviken'),
  opponentManager: { name: 'Lars Nordin', persona: 'defensive' as const, yearsAtClub: 3 } }

// Utan skandal — normalt citat
{
  const q = generatePostMatchOpponentQuote(oClub, false, false)
  const isScandal = q.includes('runtomkring') || q.includes('säsongen vi haft')
  console.log(`  Utan skandal (de förlorade): ${isScandal ? '❌ skandal-citat' : '✅ normalt citat'} → "${q}"`)
}
// Skandal, de förlorade
{
  const q = generatePostMatchOpponentQuote(oClub, false, true)
  const isScandal = q.includes('runtomkring') || q.includes('säsongen vi haft') || q.includes('grejer') || q.includes('bryr mig')
  console.log(`  Med skandal (de förlorade): ${isScandal ? '✅ skandal-citat' : '❌ ej skandal-citat'} → "${q}"`)
}
// Skandal, de vann
{
  const q = generatePostMatchOpponentQuote(oClub, true, true)
  const isScandal = q.includes('Killarna') || q.includes('Truppen') || q.includes('förtjänar') || q.includes('bryr mig')
  console.log(`  Med skandal (de vann): ${isScandal ? '✅ skandal-citat' : '❌ ej skandal-citat'} → "${q}"`)
}
// Variation: alla 4 personas × won/lost
console.log('  Variation — alla personas × won/lost med skandal:')
for (const persona of ['confident', 'defensive', 'cryptic', 'professorial'] as const) {
  for (const won of [true, false]) {
    const c = { ...oClub, opponentManager: { name: 'Lars N', persona, yearsAtClub: 3 } }
    const q = generatePostMatchOpponentQuote(c, won, true)
    console.log(`    [${persona}/${won ? 'vann' : 'förlorade'}] ${q}`)
  }
}

console.log('\n═══ KLART ═══')
