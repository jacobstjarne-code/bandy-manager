/**
 * scrape-detailed.mjs
 *
 * Elitserien Herr + Dam — producerar docs/data/bandygrytan_detailed.json.
 *
 * Primärt syfte vid denna körning: berika befintlig matchdata med
 * referee-information från Firebase preCache/getFixtureData.
 *
 * Steg:
 *  1. Läs befintlig bandygrytan_detailed.json (herr + dam, 1749 matcher).
 *  2. För varje match: hämta getFixtureData och extrahera referees-fältet.
 *  3. Lägg till referees: { main, assistants, raw } per match.
 *  4. Uppdatera schemaVersion till 3 och spara.
 *
 * Usage: node scripts/scrape-detailed.mjs
 *
 * Kända begränsningar:
 *  - 2023-24 saknas (competition fixture-lista inte i preCache).
 *  - fouls[].team är alltid null i källdatan.
 *  - Täckningsgrad för referee-fältet per säsong loggas i stdout.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB = 'https://eu-bandygrytan-dev.firebaseio.com'
const API_KEY = 'AIzaSyD6MTl6ELLWp9QgiyPXsF5a5NsdKGY0or4'
const CONCURRENCY = 5      // parallella requests (inom rimlig rate-limit)
const SLEEP_MS = 100       // delay mellan batch-körningar

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
  const url = `${DB}/${path}.json?auth=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * Normalisera ett namn: trim + deduplicate whitespace + title-case fixes.
 * Loggning av normaliseringsfall sker i caller.
 */
function normalizeName(raw) {
  if (!raw) return null
  return raw.trim().replace(/\s+/g, ' ')
}

/**
 * Extrahera referee-info från Firebase getFixtureData-svar.
 * Returnerar { main, assistants, raw } eller null om datan saknas.
 */
function extractReferees(fd) {
  if (!fd || !fd.referees) return null

  const r = fd.referees

  // Hitta huvuddomaren — positionID 20 eller nyckeln 'referee'
  let mainRaw = r.referee
  if (!mainRaw) {
    // Fallback: leta i alla nycklar efter positionID 20
    for (const v of Object.values(r)) {
      if (v?.positionID === 20) { mainRaw = v; break }
    }
  }

  // Hitta assistenter — positionID 21 eller nycklar 'assistantReferee1/2'
  const assistRaws = []
  for (const [k, v] of Object.entries(r)) {
    if (k === 'referee') continue
    if (v?.positionID === 21 || k.startsWith('assistantReferee')) {
      assistRaws.push(v)
    }
  }

  const main = mainRaw ? normalizeName(mainRaw.peopleName || `${mainRaw.firstName} ${mainRaw.lastName}`) : null
  const assistants = assistRaws
    .map(a => normalizeName(a?.peopleName || (a ? `${a.firstName} ${a.lastName}` : null)))
    .filter(Boolean)

  return { main, assistants, raw: r }
}

async function enrichMatch(match) {
  try {
    const fd = await fbGet(`preCache/getFixtureData/${match.matchId}`)
    return extractReferees(fd)
  } catch (err) {
    process.stderr.write(`  [warn] ${match.matchId}: ${err.message}\n`)
    return null
  }
}

async function processBatch(matches) {
  return Promise.all(matches.map(m => enrichMatch(m)))
}

async function main() {
  const dataPath = resolve(__dirname, '../docs/data/bandygrytan_detailed.json')
  const data = JSON.parse(readFileSync(dataPath, 'utf8'))

  const herrMatches = data.herr.matches
  const damMatches = data.dam.matches
  const allMatches = [...herrMatches, ...damMatches]

  process.stdout.write(`\nScrape-detailed — Referee enrichment\n`)
  process.stdout.write(`Matches: ${herrMatches.length} herr + ${damMatches.length} dam = ${allMatches.length} totalt\n\n`)

  // Berika i batchar
  let processed = 0
  let withReferee = 0
  let withoutReferee = 0

  const nameVariants = new Map() // peopleName → Set of raw variants (för normaliseringslogg)

  for (let i = 0; i < allMatches.length; i += CONCURRENCY) {
    const batch = allMatches.slice(i, i + CONCURRENCY)
    const results = await processBatch(batch)

    for (let j = 0; j < batch.length; j++) {
      const match = batch[j]
      const refs = results[j]
      match.referees = refs

      if (refs && refs.main) {
        withReferee++
        // Track name variants for normalization audit
        if (!nameVariants.has(refs.main)) nameVariants.set(refs.main, new Set())
        nameVariants.get(refs.main).add(refs.main)
      } else {
        withoutReferee++
      }
    }

    processed += batch.length
    if (processed % 100 === 0 || processed === allMatches.length) {
      process.stdout.write(`  ${processed}/${allMatches.length} (${Math.round(processed/allMatches.length*100)}%) — med domare: ${withReferee}, utan: ${withoutReferee}\n`)
    }

    if (i + CONCURRENCY < allMatches.length) await sleep(SLEEP_MS)
  }

  // Täckningsrapport per säsong
  process.stdout.write('\n── Täckning per säsong ──────────────────────────────\n')
  const bySeason = {}
  for (const m of allMatches) {
    const key = `${m.season} ${m.gender || (herrMatches.includes(m) ? 'herr' : 'dam')}`
    if (!bySeason[key]) bySeason[key] = { total: 0, withRef: 0 }
    bySeason[key].total++
    if (m.referees?.main) bySeason[key].withRef++
  }
  for (const [key, v] of Object.entries(bySeason).sort()) {
    const pct = ((v.withRef / v.total) * 100).toFixed(0)
    process.stdout.write(`  ${key}: ${v.withRef}/${v.total} (${pct}%)\n`)
  }

  // Uppdatera schema och spara
  data._meta.schemaVersion = 3
  data._meta.scrapedAt = new Date().toISOString()
  data._meta.refereeEnrichment = {
    matchesEnriched: allMatches.length,
    withMainReferee: withReferee,
    withoutMainReferee: withoutReferee,
    coveragePct: ((withReferee / allMatches.length) * 100).toFixed(1),
  }

  writeFileSync(dataPath, JSON.stringify(data, null, 2))
  process.stdout.write(`\n✓ Sparad → docs/data/bandygrytan_detailed.json (schemaVersion 3)\n`)
  process.stdout.write(`  Täckning: ${withReferee}/${allMatches.length} matcher (${((withReferee/allMatches.length)*100).toFixed(1)}%) har domardata\n`)
}

main().catch(err => { process.stderr.write(err.stack + '\n'); process.exit(1) })
