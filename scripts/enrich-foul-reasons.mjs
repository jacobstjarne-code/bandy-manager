/**
 * enrich-foul-reasons.mjs
 *
 * Lägger till duration och reason per utvisning i fouls[]-arrayen.
 * Hämtar `number` (duration: 5 eller 10 min, matchstraff=60) och
 * `info` (orsak, t.ex. "Våldsamt slag") från preCache/getFixtureEvents.
 *
 * Verifierat 2026-06-03: duration och reason är källästa bakåt till 2019-20
 * med 100% täckning. Trenden är äkta, ej loggningsartefakt.
 *
 * Bumpar schemaVersion → 5.
 *
 * Usage: node scripts/enrich-foul-reasons.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB = 'https://eu-bandygrytan-dev.firebaseio.com'
const API_KEY = 'AIzaSyD6MTl6ELLWp9QgiyPXsF5a5NsdKGY0or4'
const CONCURRENCY = 6
const SLEEP_MS = 80

const T_SUSPENSION = 3

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

/**
 * Normalisera orsak: lowercase, trim, deduplicate variants.
 * "Olämpligt upptr." och "Olämpligt uppträdande" → "olämpligt uppträdande"
 */
function normalizeReason(raw) {
  if (!raw) return null
  let s = raw.trim().toLowerCase()
  // Normalisera vanliga varianter
  s = s.replace(/^olämpligt upptr\.?$/i, 'olämpligt uppträdande')
  s = s.replace(/^ojust tackling$/i, 'ojust tackling')
  s = s.replace(/^slag på skridskon$/i, 'slag på skridskon')
  s = s.replace(/^slag på klubban$/i, 'slag på klubban')
  s = s.replace(/^våldsamt slag$/i, 'våldsamt slag')
  s = s.replace(/^bentackling$/i, 'bentackling')
  s = s.replace(/^hakning$/i, 'hakning')
  s = s.replace(/^fasthållning$/i, 'fasthållning')
  s = s.replace(/^sabotage$/i, 'sabotage')
  s = s.replace(/^friläge$/i, 'friläge')
  s = s.replace(/^interference$/i, 'interference')
  s = s.replace(/^grovt$/i, 'grovt matchstraff')
  return s
}

async function enrichMatch(match) {
  try {
    const rawEvents = await fbGet(`preCache/getFixtureEvents/${match.matchId}`)
    if (!rawEvents) return { fouls: match.fouls, fallback: true }

    // Bygg lookup av suspension events sorterade på timestamp
    const suspensions = Object.values(rawEvents)
      .filter(e => e.type === T_SUSPENSION)
      .map(e => ({ ...e, _ts: (e.min ?? 0) * 60 + (e.sec ?? 0) }))
      .sort((a, b) => a._ts - b._ts)

    // FIFO-matchning per minut (exakt samma approach som enrich-half-flags.mjs)
    const byMin = {}
    for (const s of suspensions) {
      if (!byMin[s.min]) byMin[s.min] = []
      byMin[s.min].push({ duration: s.number ?? null, reason: s.info ?? null })
    }
    const queues = {}
    for (const [m, items] of Object.entries(byMin)) queues[m] = [...items]

    const fouls = (match.fouls || []).map(f => {
      const q = queues[f.minute]
      if (q && q.length > 0) {
        const raw = q.shift()
        return {
          ...f,
          duration: raw.duration,
          reason: raw.reason,
          reason_norm: normalizeReason(raw.reason),
        }
      }
      // Fallback — minute inte matchat
      return { ...f, duration: null, reason: null, reason_norm: null }
    })

    return { fouls, fallback: false }
  } catch (err) {
    process.stderr.write(`  [warn] ${match.matchId}: ${err.message}\n`)
    const fouls = (match.fouls || []).map(f => ({ ...f, duration: null, reason: null, reason_norm: null }))
    return { fouls, fallback: true }
  }
}

async function main() {
  const dataPath = resolve(__dirname, '../docs/data/bandygrytan_detailed.json')
  const data = JSON.parse(readFileSync(dataPath, 'utf8'))

  const herrMatches = data.herr.matches
  const damMatches  = data.dam.matches
  const allMatches  = [...herrMatches, ...damMatches]

  process.stdout.write(`\nFoul reason enrichment\n`)
  process.stdout.write(`Matcher: ${herrMatches.length} herr + ${damMatches.length} dam = ${allMatches.length}\n\n`)

  let processed = 0, fallbacks = 0
  const durationCounts = {}
  const reasonCounts = {}

  for (let i = 0; i < allMatches.length; i += CONCURRENCY) {
    const batch = allMatches.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(m => enrichMatch(m)))

    for (let j = 0; j < batch.length; j++) {
      const match = batch[j]
      const { fouls, fallback } = results[j]
      match.fouls = fouls
      if (fallback) fallbacks++

      for (const f of fouls) {
        const d = String(f.duration ?? 'null')
        durationCounts[d] = (durationCounts[d] || 0) + 1
        const r = f.reason_norm ?? 'null'
        reasonCounts[r] = (reasonCounts[r] || 0) + 1
      }
    }

    processed += batch.length
    if (processed % 200 === 0 || processed === allMatches.length) {
      process.stdout.write(`  ${processed}/${allMatches.length} (${Math.round(processed/allMatches.length*100)}%)\n`)
    }
    if (i + CONCURRENCY < allMatches.length) await sleep(SLEEP_MS)
  }

  // Sanity checks
  const totalFouls = Object.values(durationCounts).reduce((s,v) => s+v, 0)
  const dur5  = durationCounts['5']  || 0
  const dur10 = durationCounts['10'] || 0
  const durNull = durationCounts['null'] || 0
  process.stdout.write(`\nDuration distribution:\n`)
  process.stdout.write(`  5 min: ${dur5} (${(dur5/totalFouls*100).toFixed(1)}%)\n`)
  process.stdout.write(`  10 min: ${dur10} (${(dur10/totalFouls*100).toFixed(1)}%)\n`)
  process.stdout.write(`  null (fallback): ${durNull}\n`)
  process.stdout.write(`  other: ${totalFouls - dur5 - dur10 - durNull}\n`)

  process.stdout.write(`\nTop 15 reasons:\n`)
  Object.entries(reasonCounts).sort((a,b) => b[1]-a[1]).slice(0,15).forEach(([r,n]) =>
    process.stdout.write(`  ${r}: ${n} (${(n/totalFouls*100).toFixed(1)}%)\n`))

  // Update meta
  data._meta.schemaVersion = 5
  data._meta.scrapedAt = new Date().toISOString()
  data._meta.foulReasonEnrichment = {
    matchesEnriched: allMatches.length,
    fallbacks,
    totalFouls,
    pct5min: parseFloat((dur5/totalFouls*100).toFixed(1)),
    pct10min: parseFloat((dur10/totalFouls*100).toFixed(1)),
    pctNull: parseFloat((durNull/totalFouls*100).toFixed(1)),
    topReasons: Object.entries(reasonCounts).sort((a,b) => b[1]-a[1]).slice(0,15)
      .map(([r,n]) => ({reason: r, count: n})),
  }

  writeFileSync(dataPath, JSON.stringify(data, null, 2))
  process.stdout.write(`\n✓ Sparad → bandygrytan_detailed.json (schemaVersion 5)\n`)
  process.stdout.write(`  Fallbacks: ${fallbacks}/${allMatches.length}\n`)
}

main().catch(err => { process.stderr.write(err.stack + '\n'); process.exit(1) })
