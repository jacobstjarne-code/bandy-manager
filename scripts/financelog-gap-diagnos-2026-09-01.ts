/**
 * Jacobs körorder 2026-09-01: "hitta och spåra de ~150-220k/säsong som rör
 * kassan utan financeLog-post — det gatar allt annat, för utan det går
 * saldot inte att lita på." Fyndet i D041 (framgangsekonomin-kommunbidrag-
 * matning-2026-09-01.ts) visade en ospårad differens mellan byReason-summan
 * och den faktiska säsongsdeltan, men lokaliserade den inte till KÄLLAN.
 *
 * Metod: samma dominant-klubb-harness, men denna gången jämförs varje
 * omgångs FAKTISKA finansdelta (before/after på club.finances) mot samma
 * omgångs financeLog-poster (round-fältet = matchday, läst omedelbart efter
 * anropet, cap-immunt). Varje omgång med en ickenoll differens loggas med
 * omgångsnummer + differens + game-state-signaler (boardTrust, sponsors,
 * inbox-tillägg denna omgång) för att identifiera KÄLLAN, inte bara BELOPPET.
 *
 * Kandidater identifierade via kodläsning INNAN körning (samtliga skriver
 * `finances` direkt utan appendFinanceLog):
 *   - roundProcessor.ts:1153-1159/1273-1277 — applyOneTimeKommunstod
 *     (contextualSponsorService.ts): engångsbetalning, TAK 80 000 kr,
 *     kontinuerlig CS-skala (redan fixad H4-uppföljning 2026-08-26,
 *     cs50→0kr, cs90→80k), triggas EN gång/säsong vid omgång 5/11/18.
 *   - roundProcessor.ts:913-920/1951-1955 — boardObjectiveService.ts's
 *     "förtroendepott": 62 500 kr, triggas vid TVÅ RAKA flagship-mål
 *     (sporting/economic) godkända, kollas vid omgång 7/14/22 — kan alltså
 *     i teorin fyra flera gånger per säsong.
 *   - scandalService.ts:419 (-30 000 flat) / :457 (delta) — skandalrelaterat,
 *     slumpmässigt, kanske aldrig i denna specifika körning.
 *
 * Kör: node_modules/.bin/vite-node scripts/financelog-gap-diagnos-2026-09-01.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEED = 77_000 // samma seed som framgangsekonomin-kommunbidrag-matning för jämförbarhet
const DOMINANCE_BOOST = 30
const SEASONS = 3
const CLUB_ID = 'club_forsbacka'

function makeDominantGame(): SaveGame {
  const clubTemplate = CLUB_TEMPLATES.find(t => t.id === CLUB_ID) ?? CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'FinanceLog-Gap-Diagnos', clubId: clubTemplate.id, seed: SEED })
  const boostedPlayers = game.players.map(p =>
    p.clubId === game.managedClubId
      ? { ...p, currentAbility: Math.min(99, p.currentAbility + DOMINANCE_BOOST) }
      : p
  )
  return { ...game, players: boostedPlayers, pendingScreen: null }
}

let game = makeDominantGame()
let stepSeed = SEED * 1000
const gapsBySource: Record<string, number> = {}
let totalGap = 0

for (let season = 1; season <= SEASONS; season++) {
  let seasonDone = false
  let guard = 0
  let seasonGap = 0

  while (!seasonDone) {
    guard++
    if (guard > 2000) throw new Error(`säsong ${season}: round guard tripped`)

    game = autoSelectLineup(game)
    const before = game.clubs.find(c => c.id === CLUB_ID)!.finances
    const sponsorsBefore = game.sponsors ?? []
    const boardTrustBefore = game.boardTrust ?? 0
    const inboxCountBefore = game.inbox.length

    const result = advanceToNextEvent(game, stepSeed++)
    game = result.game

    if (result.roundPlayed != null) {
      const after = game.clubs.find(c => c.id === CLUB_ID)!.finances
      const actualDelta = after - before
      const roundEntries = (game.financeLog ?? []).filter(e => e.round === result.roundPlayed)
      const loggedDelta = roundEntries.reduce((s, e) => s + e.amount, 0)
      const gap = actualDelta - loggedDelta

      if (gap !== 0) {
        // Identifiera källan via game-state-signaler tillgängliga just NU —
        // ALLA nya sponsorer (inte bara cs_over_70) + boardTrust-hoppet
        // förtroendepotten lämnar (boardTrustDelta = 1-prev vid pott-fire,
        // dvs boardTrust stannar/går till exakt 1 samtidigt som potten betalas).
        const sponsorsAfter = game.sponsors ?? []
        const newSponsors = sponsorsAfter.filter(s => !sponsorsBefore.some(bs => bs.id === s.id))
        const oneTimeSponsor = newSponsors.find(s => s.isOneTime && s.oneTimeAmount != null)
        const boardTrustAfter = game.boardTrust ?? 0
        const newInboxTitles = game.inbox.slice(inboxCountBefore).map(i => i.title)
        const metTitles = newInboxTitles.filter(t => t.includes('Uppfyllt'))

        let source = 'OKÄND'
        if (oneTimeSponsor && oneTimeSponsor.oneTimeAmount === gap) {
          source = `kommunstöd (contextualSponsorService, triggeredBy=${oneTimeSponsor.triggeredBy}, sponsor=${oneTimeSponsor.id})`
        } else if (gap === 62_500) {
          source = `förtroendepott (boardObjectiveService — boardTrust ${boardTrustBefore}→${boardTrustAfter}, mål mötta: ${metTitles.join(' | ')})`
        } else if (metTitles.length > 0) {
          source = `board-objektiv-relaterat? boardTrust ${boardTrustBefore}→${boardTrustAfter}, mål mötta: ${metTitles.join(' | ')}`
        } else if (gap < 0) {
          source = `negativ, okänd (inbox denna omgång: ${newInboxTitles.join(' | ') || '(ingen)'})`
        } else if (newSponsors.length > 0) {
          source = `ny sponsor utan känd amount-match: ${JSON.stringify(newSponsors.map(s => ({ id: s.id, triggeredBy: s.triggeredBy, oneTimeAmount: s.oneTimeAmount, weeklyIncome: s.weeklyIncome })))}`
        }

        console.log(`  Säsong ${season}, omgång ${result.roundPlayed}: GAP ${gap.toLocaleString('sv-SE')} kr — källa: ${source}`)
        gapsBySource[source] = (gapsBySource[source] ?? 0) + gap
        seasonGap += gap
        totalGap += gap
      }
    }

    if (result.seasonEnded || game.managerFired) {
      seasonDone = true
    } else {
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) {
        console.log(`  säsong ${season}: unresolvable pendingScreen (${resolved.screenType}) — avbryter`)
        seasonDone = true
        break
      }
      game = resolved.game
    }
  }

  if (game.managerFired) {
    console.log(`  AVSKEDAD under säsong ${season} — stoppar mätningen`)
    break
  }

  console.log(`Säsong ${season} — total ospårad GAP: ${seasonGap.toLocaleString('sv-SE')} kr\n`)
}

console.log('\n=== SUMMERING — GAP per källa, alla säsonger ===\n')
for (const [source, amount] of Object.entries(gapsBySource).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${source.padEnd(60)} ${amount.toLocaleString('sv-SE')} kr`)
}
console.log(`\nTOTAL ospårad GAP: ${totalGap.toLocaleString('sv-SE')} kr`)
