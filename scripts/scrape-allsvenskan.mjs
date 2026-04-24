/**
 * scrape-allsvenskan.mjs
 *
 * Scrapes Bandygrytan Firebase for:
 *  - Elitserien Herr Kval (qualification) 2019–2024 seasons
 *  - Bandyallsvenskan Herr 2019–2024 seasons
 *
 * Output:
 *  - docs/data/bandygrytan_kval.json
 *  - docs/data/bandygrytan_allsvenskan.json
 *
 * Usage: node scripts/scrape-allsvenskan.mjs
 *
 * Coverage notes:
 *  - Kval: 2019-20 to 2022-23 (old format). 2023-24 and 2024-25 not in preCache.
 *  - Allsvenskan: 2019-20 to 2023-24 (full). 2024-25: only Övre (28 of ~105 matches).
 *  - Status "upcoming" in competition list is stale; actual data in getFixtureData.
 *  - New-format matches use status "ended" (old: "signed").
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB = 'https://eu-bandygrytan-dev.firebaseio.com'
const API_KEY = 'AIzaSyD6MTl6ELLWp9QgiyPXsF5a5NsdKGY0or4'

// ── Auth ─────────────────────────────────────────────────────────────────────
let authToken = null
let tokenExpires = 0

async function getToken() {
  if (authToken && Date.now() < tokenExpires - 60_000) return authToken
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
  )
  const data = await res.json()
  if (!data.idToken) throw new Error('Auth failed: ' + JSON.stringify(data))
  authToken = data.idToken
  tokenExpires = Date.now() + parseInt(data.expiresIn) * 1000
  process.stderr.write('  [auth] Got new token\n')
  return authToken
}

async function fbGet(path) {
  const token = await getToken()
  const url = `${DB}/${path}.json?auth=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Event type IDs ─────────────────────────────────────────────────────────
const T_GOAL = 2
const T_CORNER = 1
const T_SUSPENSION = 3
const T_PENALTY = 4
const T_HALFEND = 13
const T_SHOT = 11
const T_SAVE = 23
const T_FREESTROKE = 10
const T_OFFSIDE = 107

// ── Parse events ──────────────────────────────────────────────────────────
function parseEvents(eventsRaw, homeTeamId, awayTeamId) {
  if (!eventsRaw) return {
    goals: [], fouls: [], halfTimeHome: null, halfTimeAway: null,
    shotsOnGoalHome: null, shotsOnGoalAway: null,
    savesHome: null, savesAway: null,
    freestrokesHome: 0, freestrokesAway: 0,
    offsidesHome: 0, offsidesAway: 0,
    loggingQuality: 'minimal',
  }

  const events = Object.values(eventsRaw)
  events.sort((a, b) => (a.min * 60 + (a.sec || 0)) - (b.min * 60 + (b.sec || 0)))

  const goals = []
  const fouls = []
  let halfTimeHome = null
  let halfTimeAway = null

  const shotsByTeam = {}
  const savesByTeam = {}
  let freestrokesHome = 0, freestrokesAway = 0
  let offsidesHome = 0, offsidesAway = 0

  const htEvent = events.find(e => e.type === T_HALFEND)
  if (htEvent) {
    halfTimeHome = htEvent.homeGoals ?? null
    halfTimeAway = htEvent.awayGoals ?? null
  }

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const tid = e.teamID ? String(e.teamID) : null

    if (e.type === T_SHOT && tid) {
      shotsByTeam[tid] = (shotsByTeam[tid] || 0) + 1
    } else if (e.type === T_SAVE && tid) {
      savesByTeam[tid] = (savesByTeam[tid] || 0) + 1
    } else if (e.type === T_FREESTROKE) {
      if (tid === String(homeTeamId)) freestrokesHome++
      else freestrokesAway++
    } else if (e.type === T_OFFSIDE) {
      if (tid === String(homeTeamId)) offsidesHome++
      else offsidesAway++
    } else if (e.type === T_GOAL) {
      const homeGoals = e.homeGoals ?? 0
      const awayGoals = e.awayGoals ?? 0
      const prev = [...goals].reverse()[0]
      const ph = prev?._h ?? 0
      const pa = prev?._a ?? 0
      const team = homeGoals > ph ? 'home' : (awayGoals > pa ? 'away' : 'home')

      let type = 'open'
      for (let j = Math.max(0, i - 5); j < i; j++) {
        const p = events[j]
        const gap = e.min - p.min
        if (p.type === T_PENALTY && gap <= 1) { type = 'penalty'; break }
        if (p.type === T_CORNER && gap <= 2) { type = 'corner'; break }
      }

      goals.push({ minute: e.min, team, type, _h: homeGoals, _a: awayGoals })
    } else if (e.type === T_SUSPENSION) {
      fouls.push({ minute: e.min, duration: 10 })
    }
  }

  for (const g of goals) { delete g._h; delete g._a }

  const shotsOnGoalHome = shotsByTeam[String(homeTeamId)] ?? null
  const shotsOnGoalAway = shotsByTeam[String(awayTeamId)] ?? null
  // savesHome = saves BY home GK (i.e. teamID on save event = defending team = home)
  const savesHome = savesByTeam[String(homeTeamId)] ?? null
  const savesAway = savesByTeam[String(awayTeamId)] ?? null

  const totalGoals = goals.length
  const totalShots = (shotsOnGoalHome || 0) + (shotsOnGoalAway || 0)
  const loggingQuality =
    totalShots >= Math.max(3, totalGoals * 1.5) ? 'full'
    : totalShots >= 3 ? 'partial'
    : 'minimal'

  return {
    goals, fouls, halfTimeHome, halfTimeAway,
    shotsOnGoalHome, shotsOnGoalAway,
    savesHome, savesAway,
    freestrokesHome, freestrokesAway,
    offsidesHome, offsidesAway,
    loggingQuality,
  }
}

// ── Fetch a single fixture ────────────────────────────────────────────────
async function fetchFixture(fixtureID, competitionName, season, phase) {
  try {
    const [fd, ev] = await Promise.all([
      fbGet(`preCache/getFixtureData/${fixtureID}`),
      fbGet(`preCache/getFixtureEvents/${fixtureID}`),
    ])

    if (!fd) return null
    if (fd.homeGoals === undefined || fd.homeGoals === null) return null
    // Accept both old ("signed") and new ("ended") completed-match statuses
    if (fd.status !== 'signed' && fd.status !== 'ended') return null

    const { goals, fouls, halfTimeHome, halfTimeAway,
            shotsOnGoalHome, shotsOnGoalAway, savesHome, savesAway,
            freestrokesHome, freestrokesAway, offsidesHome, offsidesAway,
            loggingQuality } = parseEvents(ev, fd.homeTeamID, fd.awayTeamID)

    let htHome = halfTimeHome
    let htAway = halfTimeAway
    if (htHome === null && fd.periods) {
      const ht = fd.periods.find(p => p.type === T_HALFEND)
      if (ht) { htHome = ht.homeGoals ?? null; htAway = ht.awayGoals ?? null }
    }

    return {
      matchId: String(fixtureID),
      season,
      phase,
      competitionName,
      date: fd.dateUTC ? fd.dateUTC.substring(0, 10) : null,
      homeTeam: fd.homeTeamName,
      awayTeam: fd.awayTeamName,
      homeTeamId: String(fd.homeTeamID),
      awayTeamId: String(fd.awayTeamID),
      homeScore: fd.homeGoals,
      awayScore: fd.awayGoals,
      halfTimeHome: htHome,
      halfTimeAway: htAway,
      attendance: fd.spectators ?? null,
      arenaName: fd.stadiumName ?? null,
      goals,
      fouls,
      shotsOnGoalHome,
      shotsOnGoalAway,
      savesHome,
      savesAway,
      freestrokesHome,
      freestrokesAway,
      offsidesHome,
      offsidesAway,
      loggingQuality,
    }
  } catch (err) {
    process.stderr.write(`  [warn] fixture ${fixtureID}: ${err.message}\n`)
    return null
  }
}

// ── Manually mapped competition fixture-list keys ─────────────────────────
// Discovered by probing preCache/getCompetitionFixtures keys.
// Key = competition fixture-list path, Value = { name, season, type }
const COMPETITIONS = [
  // ── KVAL (Elitserien ↔ Allsvenskan) ─────────────────────────────────
  { key: '11166', name: 'Elitserien Herr Kval',   season: '2019-20', type: 'kval' },
  { key: '11423', name: 'Elitserien Herr Kval',   season: '2020-21', type: 'kval' },
  { key: '11554', name: 'Elitserien Herrar Kval', season: '2021-22', type: 'kval' },
  { key: '11831', name: 'Elitserien Herr Kval',   season: '2022-23', type: 'kval' },
  // 2023-24 and 2024-25 kval: competition fixture list not in preCache

  // ── ALLSVENSKAN ───────────────────────────────────────────────────────
  { key: '11177',                  name: 'Bandyallsvenskan Herr', season: '2019-20', type: 'allsv' },
  { key: '11436',                  name: 'Bandyallsvenskan Herr', season: '2020-21', type: 'allsv' },
  { key: '11571',                  name: 'Bandyallsvenskan Herr', season: '2021-22', type: 'allsv' },
  { key: '11845',                  name: 'Bandyallsvenskan Herr', season: '2022-23', type: 'allsv' },
  { key: 'fx_1139491',             name: 'Bandyallsvenskan Herr', season: '2023-24', type: 'allsv' },
  // 2024-25: only Övre (upper group) cached; Nedre fixture list unavailable
  { key: 'fx_1156266-fx_3358532-', name: 'Bandyallsvenskan Övre Herr', season: '2024-25', type: 'allsv' },
]

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const kvalMatches = []
  const allsvMatches = []

  for (const comp of COMPETITIONS) {
    process.stdout.write(`\n── ${comp.season} — ${comp.name} (${comp.key}) ──\n`)

    const data = await fbGet(`preCache/getCompetitionFixtures/${comp.key}`)
    if (!data) {
      process.stdout.write(`  null — skipping\n`)
      continue
    }

    const fixtureIds = Object.values(data).map(f => f.fixtureID ?? f.fixtureNumber ?? null).filter(Boolean)
    process.stdout.write(`  ${fixtureIds.length} fixture IDs\n`)
    if (fixtureIds.length === 0) continue

    const phase = comp.type === 'kval' ? 'qualification' : 'regular'
    let fetched = 0

    for (const id of fixtureIds) {
      const match = await fetchFixture(id, comp.name, comp.season, phase)
      if (match) {
        if (comp.type === 'kval') kvalMatches.push(match)
        else allsvMatches.push(match)
        fetched++
      }
      await sleep(150)
    }
    process.stdout.write(`  ✓ ${fetched}/${fixtureIds.length} completed matches\n`)
  }

  // ── Dedup ────────────────────────────────────────────────────────────
  const dedupKval  = [...new Map(kvalMatches.map(m => [m.matchId, m])).values()]
  const dedupAllsv = [...new Map(allsvMatches.map(m => [m.matchId, m])).values()]

  // ── Save kval ─────────────────────────────────────────────────────────
  writeFileSync(
    resolve(__dirname, '../docs/data/bandygrytan_kval.json'),
    JSON.stringify({
      _meta: {
        source: 'bandygrytan.se via Firebase Realtime DB',
        description: 'Elitserien Herr Kval — promotion/relegation play-off between Elitserien and Allsvenskan',
        schemaVersion: 2,
        scrapedAt: new Date().toISOString(),
        seasonsWithData: [...new Set(dedupKval.map(m => m.season))].sort(),
        matchCount: dedupKval.length,
        missingSeason: '2023-24 and 2024-25 (competition fixture list not in Firebase preCache)',
        eventTypes: { 1: 'Hörna', 2: 'Mål', 3: 'Utvisning', 4: 'Straff', 10: 'Frislag', 11: 'Skott på mål', 13: 'Halvtid', 23: 'Målvakt räddar', 107: 'Offside' },
      },
      matches: dedupKval,
    }, null, 2)
  )
  process.stdout.write(`\n✓ Saved ${dedupKval.length} kval matches → docs/data/bandygrytan_kval.json\n`)

  // ── Save Allsvenskan ──────────────────────────────────────────────────
  writeFileSync(
    resolve(__dirname, '../docs/data/bandygrytan_allsvenskan.json'),
    JSON.stringify({
      _meta: {
        source: 'bandygrytan.se via Firebase Realtime DB',
        description: 'Bandyallsvenskan Herr — Swedish second division (senior men)',
        schemaVersion: 2,
        scrapedAt: new Date().toISOString(),
        seasonsWithData: [...new Set(dedupAllsv.map(m => m.season))].sort(),
        matchCount: dedupAllsv.length,
        caveat2024_25: 'Only Övre (upper group, ~28 matches) available; Nedre not in Firebase preCache',
        eventTypes: { 1: 'Hörna', 2: 'Mål', 3: 'Utvisning', 4: 'Straff', 10: 'Frislag', 11: 'Skott på mål', 13: 'Halvtid', 23: 'Målvakt räddar', 107: 'Offside' },
      },
      matches: dedupAllsv,
    }, null, 2)
  )
  process.stdout.write(`✓ Saved ${dedupAllsv.length} Allsvenskan matches → docs/data/bandygrytan_allsvenskan.json\n`)

  // ── Summary ───────────────────────────────────────────────────────────
  const bySeason = arr => arr.reduce((acc, m) => { acc[m.season] = (acc[m.season]||0)+1; return acc }, {})
  process.stdout.write('\nKval by season: ' + JSON.stringify(bySeason(dedupKval)) + '\n')
  process.stdout.write('Allsvenskan by season: ' + JSON.stringify(bySeason(dedupAllsv)) + '\n')

  // ── loggingQuality rapport ────────────────────────────────────────────
  const allMatches = [...dedupKval, ...dedupAllsv]
  const qualCounts = { full: 0, partial: 0, minimal: 0 }
  for (const m of allMatches) qualCounts[m.loggingQuality] = (qualCounts[m.loggingQuality] || 0) + 1

  process.stdout.write('\n── loggingQuality-fördelning ──────────────────────────────────\n')
  process.stdout.write(`  full:    ${qualCounts.full}  matcher (${pct(qualCounts.full, allMatches.length)})\n`)
  process.stdout.write(`  partial: ${qualCounts.partial}  matcher (${pct(qualCounts.partial, allMatches.length)})\n`)
  process.stdout.write(`  minimal: ${qualCounts.minimal}  matcher (${pct(qualCounts.minimal, allMatches.length)})\n`)

  const fullMatches = allMatches.filter(m => m.loggingQuality === 'full')
  if (fullMatches.length > 0) {
    const totalShots = fullMatches.reduce((s, m) => s + (m.shotsOnGoalHome || 0) + (m.shotsOnGoalAway || 0), 0)
    const avgShots = (totalShots / fullMatches.length).toFixed(1)
    process.stdout.write(`\n── Skott på mål (full-matcher, n=${fullMatches.length}) ──────────────────\n`)
    process.stdout.write(`  Snitt skott/match: ${avgShots}  (Bandypuls-referens: ~28/match)\n`)
    if (parseFloat(avgShots) >= 25 && parseFloat(avgShots) <= 31) {
      process.stdout.write('  → Nära Bandypuls. Bandygrytan och Bandypuls mäter på samma sätt.\n')
    } else if (parseFloat(avgShots) >= 18 && parseFloat(avgShots) < 25) {
      process.stdout.write('  → Lägre än Bandypuls (~28). Bandygrytan verkar mäta striktare (skott på mål = räddningar + mål).\n')
    } else {
      process.stdout.write(`  → Avviker från Bandypuls (${avgShots} vs ~28). Undersök definition.\n`)
    }
  }

  const allsvFull = dedupAllsv.filter(m => m.loggingQuality === 'full')
  if (allsvFull.length > 0) {
    const totalShotsAllsv = allsvFull.reduce((s, m) => s + (m.shotsOnGoalHome || 0) + (m.shotsOnGoalAway || 0), 0)
    process.stdout.write(`\n── Allsvenskan full-matcher: ${allsvFull.length} st, snitt ${(totalShotsAllsv/allsvFull.length).toFixed(1)} skott/match ──\n`)
  }
}

function pct(n, total) { return total > 0 ? ((n/total)*100).toFixed(0) + '%' : '0%' }

main().catch(err => { process.stderr.write(err.stack + '\n'); process.exit(1) })
