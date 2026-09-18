/** Textexponering (audit 2026-09-18): allt domänproducerat text som når spelaren under en karriär. */
import { appendFileSync } from 'node:fs'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus } from '../src/domain/enums'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents, autoBuildCheapestAffordableFacility } from './stress/fixtures'
const seeds = (process.argv[2] ?? '0').split(',').map(Number); const seasons = Number(process.argv[3] ?? 5); const out = process.argv[4] ?? 'sweep/exposure.jsonl'
const w = (s: string) => (s ?? '').trim().split(/\s+/).filter(Boolean).length
for (const seed of seeds) {
  let game = createHeadlessGame(seed)
  let seenInbox = new Set(game.inbox.map(i => i.id)), seenEv = new Set<string>(), seenFix = new Set<string>()
  const rec = (o: object) => appendFileSync(out, JSON.stringify({ seed, ...o }) + '\n')
  for (const i of game.inbox) rec({ season: 1, round: 0, source: 'inbox', kind: i.type, role: i.fromRole ?? null, text: `${i.title}\n${i.body}`, words: w(i.title) + w(i.body) })
  outer: for (let season = 1; season <= seasons; season++) {
    let step = seed * 100000 + season * 1000, round = 0
    for (let i = 0; i < 200; i++) {
      game = autoSelectLineup(game); game = autoBuildCheapestAffordableFacility(game)
      for (const e of game.pendingEvents ?? []) if (!seenEv.has(e.id)) { seenEv.add(e.id); rec({ season, round, source: 'event', kind: e.type, role: e.sender?.role ?? null, text: `${e.title}\n${e.body}\n${e.choices.map(c => `${c.label}${c.subtitle ? ' — ' + c.subtitle : ''}`).join(' | ')}`, words: w(e.title) + w(e.body) + e.choices.reduce((a, c) => a + w(c.label) + w(c.subtitle ?? ''), 0) }) }
      game = autoResolvePendingEvents(game, Math.random)
      const r = advanceToNextEvent(game, step++); game = r.game
      if (r.roundPlayed !== null) round = r.roundPlayed
      for (const it of game.inbox) if (!seenInbox.has(it.id)) { seenInbox.add(it.id); rec({ season, round, source: 'inbox', kind: it.type, role: it.fromRole ?? null, text: `${it.title}\n${it.body}`, words: w(it.title) + w(it.body) }) }
      for (const f of game.fixtures) if (f.status === FixtureStatus.Completed && !seenFix.has(f.id) && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)) {
        seenFix.add(f.id)
        for (const ev of f.events ?? []) if (ev.description) rec({ season, round, source: 'matchevent', kind: ev.type, role: null, text: ev.description, words: w(ev.description) })
        const rep: any = (f as any).report
        if (rep) for (const [k, v] of Object.entries(rep)) if (typeof v === 'string' && v.length > 20) rec({ season, round, source: 'report', kind: k, role: null, text: v, words: w(v) })
      }
      if (game.managerFired) { rec({ season, round, source: 'meta', kind: 'fired', text: '', words: 0 }); break outer }
      if (r.seasonEnded) { const ss = game.seasonSummaries?.at(-1) as any; if (ss) { const walk = (o: any, p: string) => { if (typeof o === 'string' && o.length > 25) rec({ season, round, source: 'seasonSummary', kind: p, role: null, text: o, words: w(o) }); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, p ? p + '.' + k : k) }; walk(ss, '') }; game = autoResolvePendingScreen(game).game; break }
      game = autoResolvePendingScreen(game).game
    }
  }
  console.log('seed', seed, 'done')
}
