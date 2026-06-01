/**
 * enrich-half-flags.mjs
 *
 * Lägger till half: 1|2 per event i goals[] och fouls[] för varje match
 * i bandygrytan_detailed.json.
 *
 * Halvleks-gräns bestäms via event typ 13 (Halvtid) i råströmmen —
 * events FÖRE event 13 i tidsstämpelordning = 1H, EFTER = 2H.
 * Mer korrekt än minute >= 46 eftersom event 13 kan inträffa vid
 * minute 45–53 (median 46).
 *
 * Steg:
 *  1. Läs befintlig bandygrytan_detailed.json (herr + dam, 1749 matcher).
 *  2. För varje match: hämta preCache/getFixtureEvents/{matchId}.
 *  3. Bestäm event 13:s tidsstämpel (min*60+sec).
 *  4. Tagga varje mål och utvisning i goals[]/fouls[] med half baserat på
 *     position relativt event 13.
 *  5. Uppdatera schemaVersion till 4 och spara.
 *
 * Matchningsmetod:
 *  - Bygg lista av (min, sec, type) per raw event före/efter event 13.
 *  - För varje element i goals[]/fouls[]: matcha mot råeventslista i
 *    minutordning — samma typ och minut, räkna bort i tur och ordning.
 *  - Om matchning misslyckas: fallback till minute >= 46 → 2H.
 *
 * Usage: node scripts/enrich-half-flags.mjs
 *
 * Kända begränsningar:
 *  - Matcher utan event 13 i rårdata använder minute >= 46 som fallback.
 *  - Goals/fouls utan sekund-precision (sec saknas i befintlig JSON) kan
 *    ha ambiguitet vid exakt samma minut — löses med FIFO-matchning.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB = 'https://eu-bandygrytan-dev.firebaseio.com'
const API_KEY = 'AIzaSyD6MTl6ELLWp9QgiyPXsF5a5NsdKGY0or4'
const CONCURRENCY = 6
const SLEEP_MS = 80

const T_GOAL        = 2
const T_CORNER      = 1
const T_SUSPENSION  = 3
const T_HALFEND     = 13

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
  return authToken
}

async function fbGet(path) {
  const token = await getToken()
  const res = await fetch(`${DB}/${path}.json?auth=${token}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function ts(min, sec) { return (min ?? 0) * 60 + (sec ?? 0) }

/**
 * Givet råevents för en match: returnera ett objekt med
 * { halfTs, goalHalves, foulHalves }
 *
 * halfTs: tidsstämpel (sek) för event 13, eller null
 * goalHalves: array av 1|2, index-matchat mot goals[] i JSON
 * foulHalves: array av 1|2, index-matchat mot fouls[] i JSON
 */
function computeHalfFlags(rawEvents, existingGoals, existingFouls) {
  if (!rawEvents) {
    // Fallback: minute >= 46
    return {
      halfTs: null,
      goalHalves: (existingGoals || []).map(g => g.minute >= 46 ? 2 : 1),
      foulHalves: (existingFouls || []).map(f => f.minute >= 46 ? 2 : 1),
    }
  }

  const events = Object.values(rawEvents)
    .map(e => ({ ...e, _ts: ts(e.min, e.sec) }))
    .sort((a, b) => a._ts - b._ts)

  const halfEvent = events.find(e => e.type === T_HALFEND)
  const halfTs = halfEvent ? halfEvent._ts : null

  // Si event 13 saknas: fallback
  if (halfTs === null) {
    return {
      halfTs: null,
      goalHalves: (existingGoals || []).map(g => g.minute >= 46 ? 2 : 1),
      foulHalves: (existingFouls || []).map(f => f.minute >= 46 ? 2 : 1),
    }
  }

  // Bygg listor av raw goals/fouls med deras half-klassificering
  // Dessa är sorterade i tidsstämpelordning
  const rawGoals = events.filter(e => e.type === T_GOAL).map(e => ({
    min: e.min, half: e._ts <= halfTs ? 1 : 2
  }))
  const rawFouls = events.filter(e => e.type === T_SUSPENSION).map(e => ({
    min: e.min, half: e._ts <= halfTs ? 1 : 2
  }))

  // FIFO-matchning: för varje element i existingGoals (sorterat på minute),
  // plocka nästa rawGoal med samma minute
  function matchHalves(existing, rawList) {
    if (!existing || existing.length === 0) return []
    // Bygg per-minute queue från rådata
    const byMin = {}
    for (const r of rawList) {
      if (!byMin[r.min]) byMin[r.min] = []
      byMin[r.min].push(r.half)
    }
    const queues = {}
    for (const [m, halves] of Object.entries(byMin)) {
      queues[m] = [...halves]  // FIFO kopia
    }

    return existing.map(ev => {
      const q = queues[ev.minute]
      if (q && q.length > 0) {
        return q.shift()
      }
      // Fallback om matchning misslyckas
      return ev.minute >= 46 ? 2 : 1
    })
  }

  const goalHalves = matchHalves(existingGoals, rawGoals)
  const foulHalves = matchHalves(existingFouls, rawFouls)

  return { halfTs, goalHalves, foulHalves }
}

async function enrichMatch(match) {
  try {
    const rawEvents = await fbGet(`preCache/getFixtureEvents/${match.matchId}`)
    const { halfTs, goalHalves, foulHalves } = computeHalfFlags(
      rawEvents,
      match.goals,
      match.fouls,
    )

    // Klona goals/fouls och lägg till half-fält
    const goals = (match.goals || []).map((g, i) => ({ ...g, half: goalHalves[i] ?? (g.minute >= 46 ? 2 : 1) }))
    const fouls = (match.fouls || []).map((f, i) => ({ ...f, half: foulHalves[i] ?? (f.minute >= 46 ? 2 : 1) }))

    return { goals, fouls, halfTs, fallback: halfTs === null }
  } catch (err) {
    process.stderr.write(`  [warn] ${match.matchId}: ${err.message}\n`)
    // Fallback för hela matchen
    const goals = (match.goals || []).map(g => ({ ...g, half: g.minute >= 46 ? 2 : 1 }))
    const fouls = (match.fouls || []).map(f => ({ ...f, half: f.minute >= 46 ? 2 : 1 }))
    return { goals, fouls, halfTs: null, fallback: true }
  }
}

async function main() {
  const dataPath = resolve(__dirname, '../docs/data/bandygrytan_detailed.json')
  const data = JSON.parse(readFileSync(dataPath, 'utf8'))

  const herrMatches = data.herr.matches
  const damMatches  = data.dam.matches
  const allMatches  = [...herrMatches, ...damMatches]

  process.stdout.write(`\nHalf-flag enrichment\n`)
  process.stdout.write(`Matcher: ${herrMatches.length} herr + ${damMatches.length} dam = ${allMatches.length} totalt\n\n`)

  let processed = 0, fallbacks = 0

  for (let i = 0; i < allMatches.length; i += CONCURRENCY) {
    const batch = allMatches.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(m => enrichMatch(m)))

    for (let j = 0; j < batch.length; j++) {
      const match = batch[j]
      const { goals, fouls, fallback } = results[j]
      match.goals = goals
      match.fouls = fouls
      if (fallback) fallbacks++
    }

    processed += batch.length
    if (processed % 200 === 0 || processed === allMatches.length) {
      process.stdout.write(`  ${processed}/${allMatches.length} (${Math.round(processed/allMatches.length*100)}%) — fallbacks: ${fallbacks}\n`)
    }

    if (i + CONCURRENCY < allMatches.length) await sleep(SLEEP_MS)
  }

  // Räkna halvleks-fördelning som sanity check
  let h1goals = 0, h2goals = 0, h1fouls = 0, h2fouls = 0
  for (const m of allMatches) {
    for (const g of m.goals || []) { if (g.half === 1) h1goals++; else h2goals++ }
    for (const f of m.fouls || []) { if (f.half === 1) h1fouls++; else h2fouls++ }
  }
  const goalH2share = (h2goals / (h1goals + h2goals) * 100).toFixed(1)
  const foulH2share = (h2fouls / (h1fouls + h2fouls) * 100).toFixed(1)

  process.stdout.write(`\nSanity check:\n`)
  process.stdout.write(`  Mål: 1H=${h1goals} 2H=${h2goals} → 2H-andel ${goalH2share}% (target ~54%)\n`)
  process.stdout.write(`  Utvisningar: 1H=${h1fouls} 2H=${h2fouls} → 2H-andel ${foulH2share}% (förväntat högre)\n`)

  // Uppdatera meta
  data._meta.schemaVersion = 4
  data._meta.scrapedAt = new Date().toISOString()
  data._meta.halfFlagEnrichment = {
    matchesEnriched: allMatches.length,
    fallbacks,
    method: 'event-13-position: events before event type 13 (Halvtid) = half 1, after = half 2. Fallback: minute >= 46 if event 13 missing.',
    goalH2sharePct: parseFloat(goalH2share),
    foulH2sharePct: parseFloat(foulH2share),
  }

  writeFileSync(dataPath, JSON.stringify(data, null, 2))
  process.stdout.write(`\n✓ Sparad → docs/data/bandygrytan_detailed.json (schemaVersion 4)\n`)
  process.stdout.write(`  Fallbacks (minute>=46-regel): ${fallbacks}/${allMatches.length}\n`)
}

main().catch(err => { process.stderr.write(err.stack + '\n'); process.exit(1) })
