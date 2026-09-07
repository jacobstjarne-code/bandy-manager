/**
 * Återupptagningsbar process-wrapper för den formella avskedskalibreringen.
 * Varje shard kör den ordinarie h4-CLI:n; detta lager ändrar aldrig spelet
 * eller seedföljden, utan parallelliserar och summerar identiska delmängder.
 */

import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const DEFAULT_CLUBS = ['club_heros', 'club_soderfors', 'club_lesjofors', 'club_forsbacka']

function integerOption(args, name, fallback) {
  const prefix = `--${name}=`
  const raw = args.find(arg => arg.startsWith(prefix))?.slice(prefix.length)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${prefix}<värde> måste vara ett positivt heltal`)
  return value
}

function stringOption(args, name, fallback) {
  const prefix = `--${name}=`
  return args.find(arg => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback
}

const args = process.argv.slice(2)
const seeds = integerOption(args, 'seeds', 10_000)
const seasons = integerOption(args, 'seasons', 6)
const seedStart = integerOption(args, 'seed-start', 90_000)
const shardSize = integerOption(args, 'shard-size', 100)
const workers = integerOption(args, 'workers', 8)
const clubs = stringOption(args, 'clubs', DEFAULT_CLUBS.join(',')).split(',').map(value => value.trim()).filter(Boolean)
const outputDir = path.resolve(stringOption(
  args,
  'output-dir',
  `/private/tmp/bandy-firing-calibration-${seedStart}-${seeds}x${seasons}`,
))

await mkdir(outputDir, { recursive: true })

const tasks = []
for (const clubId of clubs) {
  for (let offset = 0; offset < seeds; offset += shardSize) {
    const count = Math.min(shardSize, seeds - offset)
    const start = seedStart + offset
    tasks.push({ clubId, start, count })
  }
}

function shardPath(task) {
  return path.join(outputDir, `${task.clubId}_s${seasons}_${task.start}_${task.count}.json`)
}

function runShard(task) {
  return new Promise((resolve, reject) => {
    const child = spawn('node_modules/.bin/vite-node', [
      'scripts/h4-alla-tolv-avskedsfrekvens.ts',
      `--seeds=${task.count}`,
      `--seasons=${seasons}`,
      `--seed-start=${task.start}`,
      `--clubs=${task.clubId}`,
      '--json',
    ], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`${task.clubId} seeds ${task.start}–${task.start + task.count - 1} gav exit ${code}: ${stderr || stdout}`))
        return
      }
      try {
        resolve(JSON.parse(stdout.slice(stdout.indexOf('{'))))
      } catch (error) {
        reject(new Error(`Kunde inte läsa shard-JSON för ${task.clubId}/${task.start}: ${error}\n${stdout}\n${stderr}`))
      }
    })
  })
}

let completed = 0
let cursor = 0

async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor++]
    const file = shardPath(task)
    if (!existsSync(file)) {
      const report = await runShard(task)
      await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    }
    completed++
    process.stderr.write(`shards ${completed}/${tasks.length} · ${task.clubId} ${task.start}–${task.start + task.count - 1}\n`)
  }
}

await Promise.all(Array.from({ length: Math.min(workers, tasks.length) }, () => worker()))

const aggregate = new Map()
for (const task of tasks) {
  const report = JSON.parse(await readFile(shardPath(task), 'utf8'))
  const club = report.clubs[0]
  const current = aggregate.get(task.clubId) ?? {
    clubId: club.clubId,
    clubName: club.clubName,
    reputation: club.reputation,
    boardExpectation: club.boardExpectation,
    requestedRuns: 0,
    validRuns: 0,
    firedRuns: 0,
    firingRate: null,
    reasons: { boardPatience: 0, consecutiveFailures: 0, licenseDenied: 0, bankruptcy: 0, unknown: 0 },
    firedBySeason: {},
    crashes: [],
    unknownReasonSeeds: [],
  }
  current.requestedRuns += club.requestedRuns
  current.validRuns += club.validRuns
  current.firedRuns += club.firedRuns
  for (const [reason, count] of Object.entries(club.reasons)) current.reasons[reason] += count
  for (const [season, count] of Object.entries(club.firedBySeason)) {
    current.firedBySeason[season] = (current.firedBySeason[season] ?? 0) + count
  }
  current.crashes.push(...club.crashes)
  current.unknownReasonSeeds.push(...club.unknownReasonSeeds)
  aggregate.set(task.clubId, current)
}

const report = {
  schemaVersion: 2,
  sharded: true,
  config: { seeds, seasons, seedStart, shardSize, workers, clubIds: clubs },
  clubs: clubs.map(clubId => {
    const club = aggregate.get(clubId)
    club.firingRate = club.validRuns > 0 ? club.firedRuns / club.validRuns : null
    return club
  }),
}
const finalPath = path.join(outputDir, 'final.json')
await writeFile(finalPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
process.stderr.write(`SLUTRAPPORT ${finalPath}\n`)
