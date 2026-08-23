/**
 * O18 fält 2 — säsongens viktigaste beslut (SASONGENS_BESLUT_2026-08-23.md,
 * Jacobs dom 2026-08-24). Alla åtta {beslut}/{kostnad}/{vinst}/{pris}/{följd}-
 * fraser nedan är klistrade ordagrant från Jacob — Code bygger bara
 * datainhämtningen och sätter in redan kända namn/belopp i hans meningar.
 *
 * Sluten mängd: bara dessa åtta (event.type, choiceId)-par klassificerade.
 * Andra systemhandelse-val (t.ex. criticalEconomy fas 1/2, de tre i
 * weeklyDecisionService.ts) ger ingen kandidat — se BACKLOG.md.
 *
 * Formregeln (Jacobs dom): Form 1 (påtvingat — händelsen fanns i kön för att
 * något tvingade fram den: ekonomikris, varsel, deadline) nämner ALDRIG
 * vinsten, bara kostnaden. Form 2 (sökt — ett bud, ett erbjudande, en
 * möjlighet) nämner BÅDA. Form 3 (avstod) finns för att ett beslut att INTE
 * agera ska räknas.
 */
import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import { positionDefinite, formatValue } from '../format'
import { getCurrentLeagueRound } from '../data/seasonPhases'

export interface SeasonDecisionCandidate {
  eventId: string
  round: number
  season: number
  /** Rangordningsfält 1 (flest vinner). */
  systemsAffectedCount: number
  /** Rangordningsfält 2 (vid lika — irreversibelt vinner). */
  irreversible: boolean
  /** Rangordningsfält 3 (vid lika — en namngiven person vinner). */
  namedPerson?: string
  /** Rangordningsfält 4, sista skiljedomaren. */
  moneyAmount?: number
  /** Färdigbyggd mening — sammansatt HÄR, vid resolution, ur data som är
   *  garanterat aktuell just då (spelaren kan redan vara borttagen ur
   *  truppen vid säsongsslut om han sålts). */
  sentence: string
}

type Builder = (game: SaveGame, event: GameEvent, choiceId: string) => SeasonDecisionCandidate | null

function findManagedPlayer(game: SaveGame, playerId: string | undefined) {
  if (!playerId) return undefined
  return game.players.find(p => p.id === playerId)
}

const BUILDERS: Record<string, Record<string, Builder>> = {
  criticalEconomy: {
    sell_star: (game, event) => {
      const choice = event.choices.find(c => c.id === 'sell_star')
      const player = findManagedPlayer(game, choice?.effect.removePlayerId)
      if (!player) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
        systemsAffectedCount: 2, // finances, spelartrupp
        irreversible: true,
        namedPerson: name,
        moneyAmount: 350_000,
        sentence: `Du sålde ${name}. Det kostade er ${positionDefinite(player.position)}.`,
      }
    },
    ask_mecenat: (game, event) => {
      const choice = event.choices.find(c => c.id === 'ask_mecenat')
      const mecenat = (game.mecenater ?? []).find(m => m.id === choice?.effect.targetMecenatId)
      if (!mecenat) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
        systemsAffectedCount: 2, // finances, mecenatrelation
        irreversible: false,
        namedPerson: mecenat.name,
        moneyAmount: 200_000,
        sentence: `Du bad ${mecenat.name} om hjälp. Det kostade er hans förtroende.`,
      }
    },
    take_loan: (game, event) => ({
      eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
      systemsAffectedCount: 1, // finances (löpande)
      irreversible: false,
      moneyAmount: 300_000,
      sentence: 'Du tog lånet. Det kostade er varje månad sedan dess.',
    }),
  },
  varsel: {
    offer_pro: (game, event) => {
      const choice = event.choices.find(c => c.id === 'offer_pro')
      if (!choice?.effect.subEffects) return null
      let subList: Array<{ targetPlayerId?: string; value?: number }> = []
      try { subList = JSON.parse(choice.effect.subEffects) } catch { return null }
      const annualIncrease = subList.reduce((sum, sub) => {
        const p = findManagedPlayer(game, sub.targetPlayerId)
        if (!p || sub.value === undefined) return sum
        return sum + Math.max(0, sub.value - p.salary) * 12
      }, 0)
      if (annualIncrease <= 0) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
        systemsAffectedCount: 2, // finances, spelartrupp (anställningsstatus)
        irreversible: false,
        moneyAmount: annualIncrease,
        sentence: `Du gav hela truppen heltidskontrakt. Det kostade ${formatValue(annualIncrease)} i året.`,
      }
    },
  },
  detOmojligaValet: {
    sell: (game, event) => {
      const player = findManagedPlayer(game, event.relatedPlayerId)
      if (!player) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
        systemsAffectedCount: 4, // finances, spelartrupp, communityStanding, fanMood
        irreversible: true,
        namedPerson: name,
        moneyAmount: 180_000,
        sentence: `Du sålde ${name} innan han hunnit spela klart. Det kostade er akademins bästa år.`,
      }
    },
    keep: (game, event) => ({
      eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
      systemsAffectedCount: 2, // communityStanding, fanMood
      irreversible: false,
      sentence: 'Du lät det vara. Licensnämnden fick sitt kapital på annat håll.',
    }),
  },
  transferBidReceived: {
    accept: (game, event) => {
      const player = findManagedPlayer(game, event.relatedPlayerId)
      const bid = (game.transferBids ?? []).find(b => b.id === event.relatedBidId)
      if (!player || !bid) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
        systemsAffectedCount: 2, // finances, spelartrupp
        irreversible: true,
        namedPerson: name,
        moneyAmount: bid.offerAmount,
        sentence: `Du tog budet på ${name}. Det gav ${formatValue(bid.offerAmount)}, och tog ${name}.`,
      }
    },
  },
  mecenatEvent: {
    offer_tribute: (game, event) => {
      // checkMecenatRetirement: event.id = `event_mecenat_retire_${mecenat.id}_${season}`
      const mecenatId = event.id.split('_')[3]
      const mecenat = (game.mecenater ?? []).find(m => m.id === mecenatId)
      if (!mecenat) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(game), season: game.currentSeason,
        systemsAffectedCount: 3, // finances, mecenatrelation, communityStanding
        irreversible: false,
        namedPerson: mecenat.name,
        moneyAmount: 25_000,
        sentence: `Du tackade av ${mecenat.name} som han förtjänade. Det gav ett avsked ingen glömmer, och tog 25 tkr.`,
      }
    },
  },
}

/**
 * Anropas från eventResolver.ts:s gemensamma resolved-block, INNAN
 * updatedGame skrivs över nästa gång — `game` här är alltså redan
 * `updatedGame` i den anroparens scope (effekten är applicerad, men
 * inget annat efterföljande steg har kört än). Returnerar null tyst för
 * alla (event.type, choiceId) utanför den slutna listan ovan — det är det
 * normala fallet, inte ett fel.
 */
export function captureSystemDecision(
  game: SaveGame,
  event: Pick<GameEvent, 'id' | 'type' | 'choices' | 'systemhandelse' | 'relatedPlayerId' | 'relatedBidId'>,
  choiceId: string,
): SeasonDecisionCandidate | null {
  if (!event.systemhandelse) return null
  const builder = BUILDERS[event.type]?.[choiceId]
  if (!builder) return null
  return builder(game, event as GameEvent, choiceId)
}

/**
 * Rangordningsprincipen (Jacobs dom): (1) flest berörda system, (2)
 * irreversibilitet, (3) namngiven person, (4) kronor — sist, bara som
 * skiljedomare. Vid full likhet: det senaste i säsongen.
 */
export function pickSeasonDecision(candidates: SeasonDecisionCandidate[]): SeasonDecisionCandidate | null {
  if (candidates.length === 0) return null
  const sorted = [...candidates].sort((a, b) => {
    if (a.systemsAffectedCount !== b.systemsAffectedCount) return b.systemsAffectedCount - a.systemsAffectedCount
    if (a.irreversible !== b.irreversible) return a.irreversible ? -1 : 1
    const aNamed = a.namedPerson ? 1 : 0
    const bNamed = b.namedPerson ? 1 : 0
    if (aNamed !== bNamed) return bNamed - aNamed
    const aMoney = a.moneyAmount ?? 0
    const bMoney = b.moneyAmount ?? 0
    if (aMoney !== bMoney) return bMoney - aMoney
    return b.round - a.round
  })
  return sorted[0]
}
