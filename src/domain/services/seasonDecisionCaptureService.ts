/**
 * O18 fält 2 — säsongens viktigaste beslut (SASONGENS_BESLUT_2026-08-23.md,
 * Jacobs dom 2026-08-24). Alla åtta {beslut}/{kostnad}/{vinst}/{pris}/{följd}-
 * fraser nedan är klistrade ordagrant från Jacob — Code bygger bara
 * datainhämtningen och sätter in redan kända namn/belopp i hans meningar.
 *
 * A-H9 (DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md, RAPPORT_AH9_KANDIDATVOLYM_
 * 2026-08-27.md): rangordningen var mekanisk (flest berörda system vann)
 * och kandidatmängden var för smal (bara O19-märkta systemhandelser, 9
 * händelser i hela spelet — en säsong utan någon av dem fick ingen rad
 * alls). Ny dom: rangordna på namngiven person → irreversibelt → spänning
 * (gjorde valet ont) → antal system SIST, bara som skiljedomare. Kandidat
 * är varje löst beslut som uppfyller MINST TVÅ av de tre första
 * kriterierna — `event.systemhandelse`-gaten borttagen ur
 * `captureSystemDecision` (den gjorde poolen smalare än domen tillåter).
 *
 * KVARSTÅENDE BEGRÄNSNING (rapporterad, inte dold): BUILDERS nedan är
 * fortfarande en sluten mängd av åtta (event.type, choiceId)-par eftersom
 * `sentence` kräver en Jacob-skriven mall — Code skriver aldrig svensk
 * speltext (CLAUDE.md). En äkta vidgning bortom dessa åtta (t.ex. Jacobs
 * eget exempel: en kontraktsförlängning där en namngiven veteran stannade)
 * kräver nya låsta meningsmallar innan fler (typ, choiceId)-par kan bli
 * kandidater. Detta pass breddar RANGORDNINGEN och KVALIFICERINGSTRÖSKELN
 * för de åtta som redan har text, plus fallback-texten när ingen av dem
 * kvalificerar denna säsong.
 *
 * HIGH 6 (auditen 2026-08-29, `docs/incoming/BANDY_MANAGER_AUDIT_5_SASONGER_
 * KUL_STICKINESS_VISUELL_2026-08-29.md`): den kvarstående begränsningen ovan
 * var precis den auditen mätte — två hela säsonger med heltidskontrakt,
 * kaptensmöte, värmestugebygge, mecenatkonflikt och slutspelsbåge gav ändå
 * "Inget beslut stack ut i vintras." Vidgningen är nu gjord, med de nya
 * meningsmallarna i `src/domain/data/seasonDecisionSentences.ts` (levererade
 * av Opus; en byggare med tom mall returnerar fortfarande `null`, aldrig en
 * kandidat med tom mening). Tre nya källor:
 *   1. mecenatEvent/side_mec1 + side_mec2 — välja sida i en personkonflikt
 *   2. captainSpeech/take_charge + support — kaptensmötet, namngiven person
 *   3. anläggningsbygge — går INTE via resolveEvent/GameEvent alls (direkt
 *      store-action), därför en parallell infångare: captureFacilityBuild-
 *      Decision() längst ned, samma kandidatform och samma qualifies()-grind.
 *
 * HIGH 6, rotorsak som blockerade 1 och 2: `eventResolver.ts` lindade sitt
 * anrop till captureSystemDecision i `if (event.systemhandelse)` trots att
 * A-H9 tog bort exakt den grinden inne i funktionen. Varken mecenat-
 * konflikten eller kaptensmötet sätter `systemhandelse: true` (flaggan är
 * O19:s säsongsbudget-klassning, inte en kandidatgrind), så deras byggare
 * hade aldrig kunnat köra. Den yttre grinden är borttagen — BUILDERS-
 * uppslaget är den enda grinden, precis som filhuvudet redan påstod.
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
import { FACILITY_NODE_DEFS } from '../data/facilityNodes'
import {
  buildFacilityBuildTokens,
  getCaptainSupportSentence,
  getCaptainTakeChargeSentence,
  getFacilityBuildSentence,
  getMecenatConflictSideSentence,
} from '../data/seasonDecisionSentences'

/** A-H9: låst text (Jacobs ord, ordagrant) för när ingen kandidat kvalificerar. */
export const SEASON_DECISION_NONE_TEXT = 'Inget beslut stack ut i vintras.'

export interface SeasonDecisionCandidate {
  eventId: string
  round: number
  season: number
  /** Rangordningsfält 4 (sist, bara skiljedomare — A-H9). */
  systemsAffectedCount: number
  /** Rangordningsfält 2 (A-H9). */
  irreversible: boolean
  /** Rangordningsfält 3 (A-H9): pekade valet två system åt olika håll —
   *  gjorde det ont? Klassificerat per builder nedan, samma sorts
   *  bedömning som `irreversible`/`systemsAffectedCount` redan är. */
  tension: boolean
  /** Rangordningsfält 1 (A-H9, nu FÖRST). */
  namedPerson?: string
  /** Rangordningsfält 5, allra sista skiljedomaren. */
  moneyAmount?: number
  /** Färdigbyggd mening — sammansatt HÄR, vid resolution, ur data som är
   *  garanterat aktuell just då (spelaren kan redan vara borttagen ur
   *  truppen vid säsongsslut om han sålts). */
  sentence: string
}

/** A-H9: kandidat kräver minst två av {namedPerson, irreversible, tension}.
 *  HIGH 6: exporterad så att den parallella, händelselösa infångaren
 *  (captureFacilityBuildDecision) går genom EXAKT samma grind som BUILDERS —
 *  inte en andra kopia som kan glida isär. */
export function qualifies(c: Pick<SeasonDecisionCandidate, 'namedPerson' | 'irreversible' | 'tension'>): boolean {
  const score = (c.namedPerson ? 1 : 0) + (c.irreversible ? 1 : 0) + (c.tension ? 1 : 0)
  return score >= 2
}

// H3 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24): Builder tar
// nu emot BÅDA speltillstånden — `gameBefore` (oförändrad, för värden som
// måste läsas FÖRE en effekt, t.ex. offer_pro:s lön före höjningen) och
// `gameAfter` (effekten redan applicerad av eventResolver.ts, samma objekt
// resten av resolutionen jobbar vidare på). En byggare som PÅSTÅR en
// tillståndsövergång ("sålde", "gav", "tog bort") ska verifiera den mot
// `gameAfter`, inte anta den av choiceId ensamt — annars kan meningen bli
// sann i choiceId men falsk i spelvärlden.
type Builder = (gameBefore: SaveGame, gameAfter: SaveGame, event: GameEvent, choiceId: string) => SeasonDecisionCandidate | null

function findManagedPlayer(game: SaveGame, playerId: string | undefined) {
  if (!playerId) return undefined
  return game.players.find(p => p.id === playerId)
}

/** HIGH 6: multiEffect-subeffekterna ligger som JSON-sträng på choice.effect. */
interface SubEffect { type?: string; targetMecenatId?: string; targetPlayerId?: string; targetClubId?: string; amount?: number; value?: number }
function parseSubEffects(raw: string | undefined): SubEffect[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SubEffect[]) : []
  } catch { return [] }
}

/**
 * HIGH 6, källa 1 — mecenatkonflikten (mecenatService.generateMecenatConflict-
 * Event). side_mec1 och side_mec2 är spegelbilder: valets subEffects håller
 * ALLTID exakt en mecenatHappiness med +15 (den du ställde dig bakom) och en
 * med −10 (den som fick stå tillbaka). Byggaren läser sidan ur EFFEKTEN, inte
 * ur choiceId eller event-id:t — så samma funktion tjänar båda valen och en
 * eventuell framtida ändring av magnituderna inte tyst byter person.
 *
 * PÅSTÅENDEKARTAN: påståendet är "du valde X framför Y". Båda halvorna
 * verifieras mot gameAfter — X:s happiness ska ha STIGIT och Y:s ska ha
 * FALLIT. Klamras ett av värdena (happiness ligger redan på 100 respektive 0)
 * syns inte övergången i state, och då är null rätt svar: hellre ingen mening
 * än en som påstår ett skifte spelvärlden inte visar.
 *
 * Kvalificering: namngiven person (mecenaten du valde) + spänning (två
 * relationer pekade åt varsitt håll, och du gjorde en av dem besviken) = 2/3.
 * `irreversible: false` — en mecenatrelation är löpande, den går att reparera,
 * till skillnad från en försäljning.
 *
 * `neutral` (medla, båda +3) har medvetet INGEN byggare: ingen part valdes
 * bort, ingen relation föll, och ingen av de två namnen kan ärligt sägas vara
 * beslutets person. Den kan inte nå 2 av 3 utan att flaggorna sätts osant.
 */
function buildMecenatConflictSide(gameBefore: SaveGame, gameAfter: SaveGame, event: GameEvent, choiceId: string): SeasonDecisionCandidate | null {
  const choice = event.choices.find(c => c.id === choiceId)
  const subs = parseSubEffects(choice?.effect.subEffects)
    .filter(s => s.type === 'mecenatHappiness' && s.targetMecenatId && s.amount !== undefined)
  const backedId = subs.find(s => (s.amount ?? 0) > 0)?.targetMecenatId
  const otherId = subs.find(s => (s.amount ?? 0) < 0)?.targetMecenatId
  if (!backedId || !otherId || backedId === otherId) return null

  const before = gameBefore.mecenater ?? []
  const after = gameAfter.mecenater ?? []
  const backedBefore = before.find(m => m.id === backedId)
  const backedAfter = after.find(m => m.id === backedId)
  const otherBefore = before.find(m => m.id === otherId)
  const otherAfter = after.find(m => m.id === otherId)
  if (!backedBefore || !backedAfter || !otherBefore || !otherAfter) return null
  if (backedAfter.happiness <= backedBefore.happiness) return null
  if (otherAfter.happiness >= otherBefore.happiness) return null

  const sentence = getMecenatConflictSideSentence({ backed: backedAfter.name, other: otherAfter.name })
  if (!sentence) return null
  return {
    eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
    systemsAffectedCount: 2, // två mecenatrelationer
    irreversible: false,
    tension: true, // en av två namngivna personer blev besviken, oavsett vad du valde
    namedPerson: backedAfter.name,
    sentence,
  }
}

const BUILDERS: Record<string, Record<string, Builder>> = {
  criticalEconomy: {
    sell_star: (_gameBefore, gameAfter, event) => {
      const choice = event.choices.find(c => c.id === 'sell_star')
      const playerId = choice?.effect.removePlayerId
      const player = findManagedPlayer(gameAfter, playerId)
      if (!player) return null
      // H3: samma verifieringskrav som detOmojligaValet/sell — spelaren
      // ska faktiskt vara borta ur managedClub innan meningen skrivs.
      const stillManaged = player.clubId === gameAfter.managedClubId
      if (stillManaged) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 2, // finances, spelartrupp
        irreversible: true,
        tension: true, // sålde en spelare under ekonomisk press — kostade laget
        namedPerson: name,
        moneyAmount: 350_000,
        sentence: `Du sålde ${name}. Det kostade er ${positionDefinite(player.position)}.`,
      }
    },
    // PÅSTÅENDEKARTAN (2026-08-24): ask_mecenat påstod tidigare "det kostade
    // er hans förtroende" så fort mecenaten existerade i gameAfter — men
    // eventResolver.ts:s resolveEconomicCrisis-gren applicerar happiness-
    // deltat bara VILLKORAT (targetMecenatId + mecenatHappinessDelta måste
    // båda finnas på effekten, rad ~1340). Verifierar nu att happiness
    // faktiskt sjönk mellan gameBefore och gameAfter för samma mecenat,
    // samma mönster som H3:s spelar-övergångskoll.
    ask_mecenat: (gameBefore, gameAfter, event) => {
      const choice = event.choices.find(c => c.id === 'ask_mecenat')
      const targetId = choice?.effect.targetMecenatId
      const mecenatAfter = (gameAfter.mecenater ?? []).find(m => m.id === targetId)
      if (!mecenatAfter) return null
      const mecenatBefore = (gameBefore.mecenater ?? []).find(m => m.id === targetId)
      const actuallyDropped = mecenatBefore !== undefined && mecenatAfter.happiness < mecenatBefore.happiness
      if (!actuallyDropped) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 2, // finances, mecenatrelation
        irreversible: false,
        tension: true, // förtroende gick förlorat för att köpa sig ur krisen
        namedPerson: mecenatAfter.name,
        moneyAmount: 200_000,
        sentence: `Du bad ${mecenatAfter.name} om hjälp. Det kostade er hans förtroende.`,
      }
    },
    // PÅSTÅENDEKARTAN (2026-08-24): skrev tidigare meningen oavsett utfall —
    // choiceId ensamt, ingen gameAfter-koll alls (H3-bugklassen, ej fångad
    // av H3-passet eftersom take_loan saknar en spelare/mecenat att
    // verifiera mot). Verifierar nu mot economicCrisisState.outcome, satt av
    // samma resolveEconomicCrisis-gren (eventResolver.ts) som sätter 'loan'
    // bara när crisisPhase faktiskt var 'loan'.
    take_loan: (_gameBefore, gameAfter, event) => {
      if (gameAfter.economicCrisisState?.outcome !== 'loan') return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 1, // finances (löpande)
        irreversible: false,
        tension: true, // en löpande kostnad som äter av varje omgångs marginal
        moneyAmount: 300_000,
        sentence: 'Du tog lånet. Det kostade er varje månad sedan dess.',
      }
    },
  },
  varsel: {
    offer_pro: (gameBefore, gameAfter, event) => {
      const choice = event.choices.find(c => c.id === 'offer_pro')
      if (!choice?.effect.subEffects) return null
      let subList: Array<{ targetPlayerId?: string; value?: number }> = []
      try { subList = JSON.parse(choice.effect.subEffects) } catch { return null }
      // Lönen FÖRE höjningen — måste läsas ur gameBefore, gameAfter:s lön
      // är redan den nya (effekten har redan applicerats).
      const annualIncrease = subList.reduce((sum, sub) => {
        const p = findManagedPlayer(gameBefore, sub.targetPlayerId)
        if (!p || sub.value === undefined) return sum
        return sum + Math.max(0, sub.value - p.salary) * 12
      }, 0)
      if (annualIncrease <= 0) return null
      // H3-uppföljning (5c9a7a8, 2026-08-24, Jacobs dom): "hela truppen"
      // överdrev — offer_pro gäller bara de VARSLADE (subList), aldrig
      // klubbens fulla spelartrupp. Två låsta textvarianter beroende på
      // antal bekräftat berörda, kostnadsraden oförändrad. Samma
      // bekräftelsekrav som de tre andra: skriv bara meningen om minst en
      // berörd spelare faktiskt är isFullTimePro i gameAfter.
      const confirmedPlayers = subList
        .map(sub => sub.targetPlayerId ? findManagedPlayer(gameAfter, sub.targetPlayerId) : undefined)
        .filter((p): p is NonNullable<typeof p> => !!p?.isFullTimePro)
      if (confirmedPlayers.length === 0) return null
      const sentence = confirmedPlayers.length === 1
        ? `Du gav ${confirmedPlayers[0].lastName} heltidskontrakt. Det kostade ${formatValue(annualIncrease)} i året.`
        : `Du gav de varslade heltidskontrakt. Det kostade ${formatValue(annualIncrease)} i året.`
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 2, // finances, spelartrupp (anställningsstatus)
        irreversible: false,
        tension: true, // en löneökning kostar löpande, betald för att behålla folk
        namedPerson: confirmedPlayers.length === 1 ? `${confirmedPlayers[0].firstName} ${confirmedPlayers[0].lastName}` : undefined,
        moneyAmount: annualIncrease,
        sentence,
      }
    },
  },
  detOmojligaValet: {
    sell: (_gameBefore, gameAfter, event) => {
      const player = findManagedPlayer(gameAfter, event.relatedPlayerId)
      if (!player) return null
      // H3 (5c9a7a8, 2026-08-24): "Du sålde X" fick tidigare skrivas oavsett
      // om spelaren faktiskt lämnade klubben — byggaren läste bara choiceId,
      // aldrig speltillståndet. Verifierar nu mot gameAfter (effekten redan
      // applicerad + eventResolver.ts:s hårda assertion garanterar att detta
      // ALDRIG kan vara sant om spelaren fortfarande är kvar — men om
      // relatedPlayerId av någon anledning pekar fel, eller findManagedPlayer
      // inte hittar honom där han borde, är no-op (null) rätt svar: hellre
      // ingen mening än en falsk.
      const stillManaged = player.clubId === gameAfter.managedClubId
      if (stillManaged) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 4, // finances, spelartrupp, communityStanding, fanMood
        irreversible: true,
        tension: true, // sålde en egenfostrad spelare innan han fick spela klart
        namedPerson: name,
        moneyAmount: 180_000,
        sentence: `Du sålde ${name} innan han hunnit spela klart. Det kostade er akademins bästa år.`,
      }
    },
    // PÅSTÅENDEKARTAN (2026-08-24), Jacobs egen rättelse: "Licensnämnden fick
    // sitt kapital på annat håll" var en slutsats ingenting i state stödjer —
    // ingen effekt beskriver hur nämnden faktiskt hanterade det. Ny låst text
    // säger bara vad som verifierbart hände: spelaren stannade. Verifierar
    // (som sell-grenen ovan) att han faktiskt är kvar i managedClub innan
    // meningen skrivs.
    keep: (_gameBefore, gameAfter, event) => {
      const player = findManagedPlayer(gameAfter, event.relatedPlayerId)
      if (!player) return null
      const stillManaged = player.clubId === gameAfter.managedClubId
      if (!stillManaged) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 2, // communityStanding, fanMood
        irreversible: false,
        tension: false, // ett avstående utan uttalad kostnad — inget system pekade emot
        namedPerson: name,
        sentence: `Du lät det vara. ${name} spelar kvar.`,
      }
    },
  },
  transferBidReceived: {
    accept: (_gameBefore, gameAfter, event) => {
      const player = findManagedPlayer(gameAfter, event.relatedPlayerId)
      const bid = (gameAfter.transferBids ?? []).find(b => b.id === event.relatedBidId)
      if (!player || !bid) return null
      // H3-uppföljning: samma verifieringskrav — spelaren ska faktiskt inte
      // längre tillhöra managedClub.
      if (player.clubId === gameAfter.managedClubId) return null
      const name = `${player.firstName} ${player.lastName}`
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 2, // finances, spelartrupp
        irreversible: true,
        tension: true, // pengarna gav, men laget tog — ett ja som var ett nej i truppen
        namedPerson: name,
        moneyAmount: bid.offerAmount,
        sentence: `Du tog budet på ${name}. Det gav ${formatValue(bid.offerAmount)}, och tog ${name}.`,
      }
    },
  },
  mecenatEvent: {
    // PÅSTÅENDEKARTAN (2026-08-24): påstod tidigare "tog 25 tkr" så fort
    // mecenaten existerade — verifierar nu mot den faktiska finansdeltan
    // (eventResolver.ts:s mecenatEvent/offer_tribute-gren drar 25000 från
    // managedClub ovillkorat, men den koppling ska bekräftas i state, inte
    // antas av choiceId, samma princip som de andra byggarna i denna fil).
    offer_tribute: (gameBefore, gameAfter, event) => {
      // checkMecenatRetirement: event.id = `event_mecenat_retire_${mecenat.id}_${season}`
      const mecenatId = event.id.split('_')[3]
      const mecenat = (gameAfter.mecenater ?? []).find(m => m.id === mecenatId)
      if (!mecenat) return null
      const clubBefore = gameBefore.clubs.find(c => c.id === gameAfter.managedClubId)
      const clubAfter = gameAfter.clubs.find(c => c.id === gameAfter.managedClubId)
      const actuallyCost = clubBefore !== undefined && clubAfter !== undefined && clubAfter.finances < clubBefore.finances
      if (!actuallyCost) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 3, // finances, mecenatrelation, communityStanding
        irreversible: false,
        tension: true, // ett avsked som gav minnen men tog pengar
        namedPerson: mecenat.name,
        moneyAmount: clubBefore!.finances - clubAfter!.finances,
        sentence: `Du tackade av ${mecenat.name} som han förtjänade. Det gav ett avsked ingen glömmer, och tog 25 tkr.`,
      }
    },
    // HIGH 6, källa 1. Spegelbilder — samma verifiering, sidan läses ur
    // effekten (se buildMecenatConflictSide ovan för hela påståendekartan).
    // Skrivna som inline-pilar, INTE som `side_mec1: buildMecenatConflictSide`:
    // mutationsverifieringsgrinden (tests/grind/mutationVerificationGate.ts)
    // inspekterar bara pil-/funktionsuttryck i BUILDERS och hoppar tyst över
    // en ren funktionsreferens — en byggare skriven i den formen hade legat
    // utanför grindens synfält helt.
    side_mec1: (gameBefore, gameAfter, event, choiceId) => buildMecenatConflictSide(gameBefore, gameAfter, event, choiceId),
    side_mec2: (gameBefore, gameAfter, event, choiceId) => buildMecenatConflictSide(gameBefore, gameAfter, event, choiceId),
    // 'neutral' saknar byggare med avsikt — se buildMecenatConflictSide:s
    // docstring: ingen part valdes bort, ingen relation föll, ingen av de två
    // namnen är ärligt beslutets person. Kan inte nå 2 av 3.
  },
  // ── HIGH 6, källa 2 — kaptensmötet (eventFactories.generateCaptainSpeech-
  // Event). Eventet saknar `relatedPlayerId`; kaptenens identitet finns bara
  // i 'take_charge'-valets `effect.targetPlayerId` (fabriken sätter den till
  // captain.id). BÅDA byggarna nedan läser därifrån — inte ur
  // `game.captainPlayerId`, som är lineup-fältet och kan ha bytt person sedan
  // eventet köades (postAdvanceEvents.ts faller dessutom tillbaka på en
  // annan spelare helt om captainPlayerId saknas).
  captainSpeech: {
    // 'take_charge': du sa nej och tog samtalet själv. Priset är kaptenens
    // egen moral (−5) — en namngiven relation som betalar.
    // PÅSTÅENDEKARTAN: verifierar att moralen faktiskt SJÖNK i gameAfter.
    // Ligger den redan på 0 syns ingen övergång och null är rätt svar.
    // Kvalificering: namngiven person + spänning = 2/3. Spänningen är äkta
    // och inte påklistrad: alternativet på bordet var en mätbar lagmoralboost
    // åt hela truppen, och valet lägger i stället en kostnad på en enskild
    // namngiven spelare. Laget och kaptenen pekade åt varsitt håll.
    take_charge: (gameBefore, gameAfter, event) => {
      const choice = event.choices.find(c => c.id === 'take_charge')
      const captainId = choice?.effect.targetPlayerId
      const before = findManagedPlayer(gameBefore, captainId)
      const after = findManagedPlayer(gameAfter, captainId)
      if (!before || !after) return null
      if (after.morale >= before.morale) return null
      const name = `${after.firstName} ${after.lastName}`
      const sentence = getCaptainTakeChargeSentence({ captain: name, last: after.lastName })
      if (!sentence) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 1, // kaptenens moral
        irreversible: false,
        tension: true,
        namedPerson: name,
        sentence,
      }
    },
    // 'support': du lät honom tala. Laget lyfte, styrelsens tålamod föll (−3)
    // — två system åt varsitt håll, precis definitionen av `tension` i den
    // här filen. Kaptenens namn hämtas ur syskonvalet 'take_charge' (samma
    // event, samma kapten, garanterat av fabriken).
    // PÅSTÅENDEKARTAN: påståendet är "laget vann något, styrelsen förlorade
    // något". BÅDA halvorna verifieras — minst en spelare i den styrda
    // klubben ska ha högre moral i gameAfter, och boardPatience ska ha
    // fallit. Klamras endera (hela truppen redan på 100 moral, eller
    // boardPatience redan på 0) är null rätt svar.
    support: (gameBefore, gameAfter, event) => {
      const captainId = event.choices.find(c => c.id === 'take_charge')?.effect.targetPlayerId
      const captain = findManagedPlayer(gameAfter, captainId)
      if (!captain) return null
      const patienceBefore = gameBefore.boardPatience ?? 70
      const patienceAfter = gameAfter.boardPatience ?? 70
      if (patienceAfter >= patienceBefore) return null
      const moraleRose = gameAfter.players.some(p => {
        if (p.clubId !== gameAfter.managedClubId) return false
        const wasBefore = gameBefore.players.find(b => b.id === p.id)
        return wasBefore !== undefined && p.morale > wasBefore.morale
      })
      if (!moraleRose) return null
      const name = `${captain.firstName} ${captain.lastName}`
      const sentence = getCaptainSupportSentence({ captain: name, last: captain.lastName })
      if (!sentence) return null
      return {
        eventId: event.id, round: getCurrentLeagueRound(gameAfter), season: gameAfter.currentSeason,
        systemsAffectedCount: 2, // lagmoral, styrelsens tålamod
        irreversible: false,
        tension: true,
        namedPerson: name,
        sentence,
      }
    },
    // 'decline' saknar byggare med avsikt: effekten är `noOp`, ingen namngiven
    // person betalar något och inget system rör sig. 0 av 3.
  },
}

/**
 * Anropas från eventResolver.ts:s gemensamma resolved-block, INNAN
 * updatedGame skrivs över nästa gång.
 *
 * H3-uppföljning (5c9a7a8, 2026-08-24): tar nu emot BÅDA speltillstånden —
 * `gameBefore` (den ORIGINELLA, oförändrade parametern eventResolver.ts
 * fick in) och `gameAfter` (samma objekt med effekten redan applicerad,
 * fortsatt oförändrat av efterföljande steg). Den tidigare docstringen här
 * påstod felaktigt att den enda mottagna `game`-parametern "alltså redan"
 * var updatedGame — den var i själva verket gameBefore (se eventResolver.ts:s
 * anropsställe), vilket gjorde att en byggare som ville VERIFIERA en
 * tillståndsövergång (t.ex. "spelaren är faktiskt såld") aldrig kunde göra
 * det. Returnerar null tyst för alla (event.type, choiceId) utanför den
 * slutna listan ovan — det är det normala fallet, inte ett fel.
 *
 * A-H9: `event.systemhandelse`-gaten borttagen — domen kräver att kandidat-
 * mängden är "varje löst beslut", inte bara O19-märkta systemhandelser.
 * BUILDERS-uppslaget är fortfarande den faktiska begränsningen (bara åtta
 * (typ, choiceId)-par har en Jacob-skriven mening), men den begränsningen
 * ska inte vara dubbel. Filtrerar nu även på `qualifies()` (minst två av
 * de tre översta kriterierna) — en byggare kan returnera en kandidat som
 * INTE kvalificerar (t.ex. detOmojligaValet/keep, ingen kostnad uttalad),
 * och den ska då inte hamna i loggen alls.
 */
export function captureSystemDecision(
  gameBefore: SaveGame,
  gameAfter: SaveGame,
  event: Pick<GameEvent, 'id' | 'type' | 'choices' | 'systemhandelse' | 'relatedPlayerId' | 'relatedBidId'>,
  choiceId: string,
): SeasonDecisionCandidate | null {
  const builder = BUILDERS[event.type]?.[choiceId]
  if (!builder) return null
  const candidate = builder(gameBefore, gameAfter, event as GameEvent, choiceId)
  if (!candidate) return null
  return qualifies(candidate) ? candidate : null
}

/**
 * HIGH 6, källa 3 — anläggningsbygget. Auditens egen säsongstest-formulering
 * ("bygg en anläggning, välj sida i en personkonflikt och betala en kostnad")
 * räknar bygget som ett av säsongens beslut, men det passerar ALDRIG
 * resolveEvent: det finns varken GameEvent, DecisionCard eller choiceId. Det
 * är en direkt store-action (gameStore.startFacilityBuildNode) och ett val i
 * försäsongsscenen "Valet" (gameFlowActions.completeScene). Därför en
 * parallell infångare med SAMMA kandidatform och SAMMA qualifies()-grind —
 * inte ett andra spår med egna regler.
 *
 * PÅSTÅENDEKARTAN: påståendet är "du band kassan i ett bygge". Båda halvorna
 * verifieras mot gameAfter — noden ska faktiskt ligga som `activeProject`
 * (eller redan vara byggd, om en framtida väg hoppar över byggtiden), och
 * klubbens kassa ska faktiskt ha minskat. Ingen av delarna antas av att
 * anroparen sa att den gjorde det.
 *
 * Kvalificering: irreversibelt + spänning = 2/3. `namedPerson` är med rätta
 * undefined — ett bygge har ingen person. `irreversible: true`: ett påbörjat
 * bygge kan inte ångras, och en färdig nod bär dessutom en löpande driftkostnad
 * (FacilityNodeDef.upkeepCost) som följer klubben resten av spelet.
 * `tension: true`: kapitalet som går in i anläggningen är kapital som inte går
 * till truppen — samma "konkurrerar med truppen"-ram som resten av doktrinen
 * använder (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md).
 *
 * `systemsAffectedCount` räknas ur nodens EGEN konsekvenstabell
 * (FacilityNodeDef.consequences) — antalet distinkta dimensioner som faktiskt
 * pekar någonstans (`dir !== 'noll'`). Värmestugan ger 3 (publik, själ,
 * ekonomi), belysningen 2 (ungdom, ekonomi — publik är uttryckligen 'noll').
 * Ingen gissad siffra: samma data som ytan redan visar spelaren.
 */
export function captureFacilityBuildDecision(
  gameBefore: SaveGame,
  gameAfter: SaveGame,
  nodeId: string,
  clubCostKr: number,
): SeasonDecisionCandidate | null {
  const def = FACILITY_NODE_DEFS.find(d => d.id === nodeId)
  if (!def) return null

  const stateAfter = gameAfter.facilityState
  const started = stateAfter?.activeProject?.nodeId === nodeId
    || (stateAfter?.builtNodeIds ?? []).includes(nodeId)
  if (!started) return null

  const clubBefore = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)
  const clubAfter = gameAfter.clubs.find(c => c.id === gameAfter.managedClubId)
  if (!clubBefore || !clubAfter) return null
  const actuallyPaid = clubAfter.finances < clubBefore.finances
  if (!actuallyPaid) return null
  const paid = clubBefore.finances - clubAfter.finances

  const sentence = getFacilityBuildSentence(buildFacilityBuildTokens(def.label, clubCostKr))
  if (!sentence) return null

  const dims = new Set(def.consequences.filter(c => c.dir !== 'noll').map(c => c.dim))
  const candidate: SeasonDecisionCandidate = {
    eventId: `facility_${nodeId}_s${gameAfter.currentSeason}`,
    round: getCurrentLeagueRound(gameAfter),
    season: gameAfter.currentSeason,
    systemsAffectedCount: Math.max(1, dims.size),
    irreversible: true,
    tension: true,
    moneyAmount: paid,
    sentence,
  }
  return qualifies(candidate) ? candidate : null
}

/**
 * Rangordningsprincipen (A-H9, DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md):
 * (1) namngiven person, (2) irreversibilitet, (3) spänning (pekade valet
 * åt olika håll — gjorde det ont), (4) antal berörda system — sist, bara
 * som skiljedomare, (5) kronor — allra sista skiljedomaren. Vid full
 * likhet: det senaste i säsongen. Ersätter den gamla ordningen (flest
 * system vann) — domens ord: "en räknare är inte ett minne."
 */
export function pickSeasonDecision(candidates: SeasonDecisionCandidate[]): SeasonDecisionCandidate | null {
  if (candidates.length === 0) return null
  const sorted = [...candidates].sort((a, b) => {
    const aNamedFirst = a.namedPerson ? 1 : 0
    const bNamedFirst = b.namedPerson ? 1 : 0
    if (aNamedFirst !== bNamedFirst) return bNamedFirst - aNamedFirst
    if (a.irreversible !== b.irreversible) return a.irreversible ? -1 : 1
    if (a.tension !== b.tension) return a.tension ? -1 : 1
    if (a.systemsAffectedCount !== b.systemsAffectedCount) return b.systemsAffectedCount - a.systemsAffectedCount
    const aMoney = a.moneyAmount ?? 0
    const bMoney = b.moneyAmount ?? 0
    if (aMoney !== bMoney) return bMoney - aMoney
    return b.round - a.round
  })
  return sorted[0]
}
