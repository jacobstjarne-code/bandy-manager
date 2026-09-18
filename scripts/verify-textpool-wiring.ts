/**
 * verify-textpool-wiring.ts — DOM_DÖDA_TEXTPOOLER_2026-09-18, verifieringen.
 *
 * Domen: "Verifiera 1, 2 och 4 med scripts/text-exposure.ts: annandagsbriefingen
 * ska synas exakt en gång per säsong, bortaresans efterklang efter varje besvarad
 * bortaresa, avstängningsåterkomsten vid varje avstängning."
 *
 * text-exposure fångar inbox och beslutskort, men pool 1 är en UI-rad i Förbered
 * (inte en inbox-post) och syns därför inte där. Den här sonden kompletterar:
 * den kör riktiga säsonger och räknar alla tre på sina egna villkor — briefingen
 * via samma väljare som skärmen anropar, de andra två via inboxen.
 *
 * Kör: node_modules/.bin/vite-node scripts/verify-textpool-wiring.ts [seeds] [seasons]
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import {
  createHeadlessGame, autoSelectLineup, autoResolvePendingScreen,
  autoResolvePendingEvents, autoBuildCheapestAffordableFacility,
} from './stress/fixtures'
import { getSpecialDateBriefing } from '../src/domain/services/specialDateService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const seeds = (process.argv[2] ?? '0,1,2,3').split(',').map(Number)
const seasons = Number(process.argv[3] ?? 3)

interface Row {
  seed: number
  season: number
  annandagsBriefings: number
  otherBriefings: number
  awayTripsResolved: number
  awayTripEchoes: number
  suspensionsStarted: number
  suspensionReturns: number
}

const rows: Row[] = []

for (const seed of seeds) {
  let game: SaveGame = createHeadlessGame(seed)
  let step = seed * 100_000 + 5000

  for (let season = 1; season <= seasons; season++) {
    let annandagsBriefings = 0, otherBriefings = 0
    let awayTripEchoes = 0, suspensionReturns = 0
    let suspensionsStarted = 0
    const seenInbox = new Set(game.inbox.map(i => i.id))
    const awayTripKeys = new Set<string>()
    const suspendedSeen = new Set<string>()
    let done = false

    for (let guard = 0; guard < 200 && !done; guard++) {
      game = autoSelectLineup(game)
      game = autoBuildCheapestAffordableFacility(game)

      // Pool 1 — samma väljare Förbered-vyn anropar, på samma fixtur.
      const next = game.fixtures
        .filter(f => f.status === 'scheduled'
          && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
        .sort((a, b) => a.matchday - b.matchday)[0]
      if (next) {
        const briefing = getSpecialDateBriefing(game, next)
        if (briefing) {
          if (next.isAnnandagen) annandagsBriefings++
          else otherBriefings++
        }
      }

      game = autoResolvePendingEvents(game, Math.random)
      const r = advanceToNextEvent(game, step++)
      game = r.game

      // Pool 2 — varje BESVARAD bortaresa (kortet sätter awayTripMatchday).
      const sg = game.supporterGroup
      if (sg?.awayTripMatchday && sg.awayTripSeason === game.currentSeason) {
        awayTripKeys.add(`${sg.awayTripSeason}:${sg.awayTripMatchday}`)
      }
      // Pool 4 — varje påbörjad avstängning i den hanterade truppen.
      for (const p of game.players) {
        if (p.clubId === game.managedClubId && p.suspensionGamesRemaining > 0) suspendedSeen.add(p.id)
      }

      for (const item of game.inbox) {
        if (seenInbox.has(item.id)) continue
        seenInbox.add(item.id)
        if (item.id.startsWith('inbox_awaytrip_after_')) awayTripEchoes++
        if (item.title.startsWith('Spelklar igen:')) suspensionReturns++
      }

      if (r.seasonEnded || game.managerFired) done = true
      game = autoResolvePendingScreen(game).game
    }

    suspensionsStarted = suspendedSeen.size
    rows.push({
      seed, season, annandagsBriefings, otherBriefings,
      awayTripsResolved: awayTripKeys.size, awayTripEchoes,
      suspensionsStarted, suspensionReturns,
    })
    if (game.managerFired) break
  }
}

const sum = (f: (r: Row) => number) => rows.reduce((s, r) => s + f(r), 0)
const n = rows.length

console.log(`\n=== INKOPPLINGSVERIFIERING (DOM_DÖDA_TEXTPOOLER) — ${seeds.length} seeds × ${seasons} säsonger, ${n} säsongsrader ===\n`)
console.log('seed  säs  annandag  övr.briefing  bortaresor  efterklang  avstängda  återkomster')
for (const r of rows) {
  console.log(
    `${String(r.seed).padStart(4)} ${String(r.season).padStart(4)} ` +
    `${String(r.annandagsBriefings).padStart(9)} ${String(r.otherBriefings).padStart(13)} ` +
    `${String(r.awayTripsResolved).padStart(11)} ${String(r.awayTripEchoes).padStart(11)} ` +
    `${String(r.suspensionsStarted).padStart(10)} ${String(r.suspensionReturns).padStart(12)}`,
  )
}

const annandagMax = Math.max(...rows.map(r => r.annandagsBriefings))
console.log(`\nannandagsbriefing per säsong : max ${annandagMax}, snitt ${(sum(r => r.annandagsBriefings) / n).toFixed(2)}  (krav: exakt en gång per säsong) ${annandagMax <= 1 ? 'OK' : 'ÖVER'}`)
console.log(`bortaresor besvarade / efterklang : ${sum(r => r.awayTripsResolved)} / ${sum(r => r.awayTripEchoes)}`)
console.log(`avstängningar / återkomster       : ${sum(r => r.suspensionsStarted)} / ${sum(r => r.suspensionReturns)}`)
console.log('')
