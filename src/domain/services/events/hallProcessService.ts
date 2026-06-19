/**
 * hallProcessService — matchhall-prövningens fas-maskin (B1 §5).
 *
 * Ersätter hallDebateService.ts (noOp-händelser utan process-minne) och
 * hall-delen av hallDebateEvents.ts (fast-runda händelser, även de konsekvensfria).
 * Annandagsbandyn i hallDebateEvents.ts är orelaterad — rör den inte.
 *
 * Faserna: forankring → krav → kommun → godkand/nekad.
 * Tillståndet lever i FacilityState.hallProcess (Community.ts).
 * Effekter skickas via EventEffect { type: 'hallProcess', hallProcessData: string }.
 *
 * TEXTSTATUS (2026-06-19): Fas-text = Opus-runda EFTER att tillståndsmaskinen finns
 * att skriva mot. Befintlig HALL_DEBATE_EVENTS-text återanvänds i Fas 1 (förankring)
 * eftersom den matchar innehållet. Fas 2+3 har '[Opus]' i bodyVariants — Opus skriver
 * dem separat. Spec §"Vad Code INTE bygger": scentexten skrivs av Opus.
 */

import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, EventChoice } from '../../entities/GameEvent'
import type { HallProcess } from '../../entities/Community'
import { HALL_DEBATE_EVENTS } from '../../data/hallDebateData'

const PROCESS_COOLDOWN = 5   // omgångar mellan fas-steg
const INIT_KLACK_STOTTA = 55
const INIT_STYRELSE_STOTTA = 25
const STYRELSE_THRESHOLD = 60  // tröskel för att gå vidare till krav-fasen

// ── Trigger-check ─────────────────────────────────────────────────────────

/**
 * Ska hall-processen triggas nu? Sann om:
 * - laktare_ostra byggd (hallens requires)
 * - minst en rival har hall (hasIndoorRival)
 * - säsong 2+
 * - ingen hallProcess ännu (undefined)
 * - inget aktivt bygge
 */
function shouldStartHallProcess(game: SaveGame): boolean {
  const fs = game.facilityState
  if (!fs) return false
  if (fs.hallProcess) return false
  if (fs.activeProject) return false
  if (game.currentSeason < 2) return false
  if (!fs.builtNodeIds.includes('laktare_ostra')) return false
  const hasIndoorRival = game.clubs.some(c => c.id !== game.managedClubId && c.hasIndoorArena === true)
  return hasIndoorRival
}

function isCooldownPassed(hallProcess: HallProcess, currentRound: number): boolean {
  return currentRound - hallProcess.lastStepRound >= PROCESS_COOLDOWN
}

// ── Hjälp-funktion: bygg HallProcess init-payload ────────────────────────

function buildInitPayload(game: SaveGame, currentRound: number): string {
  const init: HallProcess = {
    phase: 'forankring',
    startedSeason: game.currentSeason,
    klackStotta: INIT_KLACK_STOTTA,
    styrelseStotta: INIT_STYRELSE_STOTTA,
    kommunStotta: 0,
    kommunAndel: 0,
    patronBorgen: false,
    kravMultiplikator: 1.0,
    lastStepRound: currentRound,
    lastStepSeason: game.currentSeason,
  }
  return JSON.stringify({ init })
}

// ── Fas 1 — Förankring ────────────────────────────────────────────────────

function buildForankringEvent(
  game: SaveGame,
  currentRound: number,
  hallProcess: HallProcess,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const eid = `hallprocess_forankring_s${game.currentSeason}_r${currentRound}`
  if (alreadyQueued.has(eid)) return null
  if (!isCooldownPassed(hallProcess, currentRound)) return null

  const politician = game.localPolitician
  const boardPatience = game.boardPatience ?? 70

  // Välj event-pool ur HALL_DEBATE_EVENTS (samma logik som gamla hallDebateService)
  let poolKey: keyof typeof HALL_DEBATE_EVENTS
  if (politician?.agenda === 'infrastructure' || politician?.agenda === 'prestige') {
    poolKey = 'kommunenFrågar'
  } else if (boardPatience <= 40) {
    poolKey = 'styrelseSplittrad'
  } else {
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const hasEnoughYoung = managedPlayers.filter(p => p.age < 23).length >= 2
    const hasInjured = managedPlayers.some(p => p.isInjured)
    poolKey = (hasEnoughYoung || hasInjured || (currentRound + game.currentSeason) % 2 === 0)
      ? 'spelarePerspektiv' : 'styrelseSplittrad'
  }

  const debateData = HALL_DEBATE_EVENTS[poolKey]
  const variantIdx = (currentRound + game.currentSeason * 13) % debateData.bodyVariants.length
  const body = debateData.bodyVariants[variantIdx]
    .replace('{politiker}', politician?.name ?? 'Kommunalrådet')

  const styrelse = hallProcess.styrelseStotta

  const choices: EventChoice[] = [
    {
      id: 'push_forward',
      label: debateData.choices.find(c => c.id === 'support')?.label ?? 'Driva frågan vidare',
      subtitle: styrelse >= STYRELSE_THRESHOLD
        ? 'Styrelsen är redo — processen går vidare till kravstadiet'
        : `💼 Styrelsesstöd +12 · 💛 Klacken −5`,
      effect: {
        type: 'hallProcess',
        hallProcessData: styrelse + 12 >= STYRELSE_THRESHOLD
          ? JSON.stringify({ phase: 'krav', styrelseStottaDelta: 12, klackStottaDelta: -5 })
          : JSON.stringify({ styrelseStottaDelta: 12, klackStottaDelta: -5 }),
      },
    },
    {
      id: 'defend_outdoor',
      label: debateData.choices.find(c => c.id === 'defend_outdoor')?.label ?? 'Vi spelar utomhus — det är vår identitet',
      subtitle: '💛 Klacken +8 · 💼 Styrelsesstöd −5',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({ styrelseStottaDelta: -5, klackStottaDelta: 8 }),
      },
    },
    {
      id: 'neutral',
      label: debateData.choices.find(c => c.id === 'neutral')?.label ?? 'Vi har inga starka åsikter just nu',
      subtitle: 'Ingen förändring — frågan vilar',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({}),
      },
    },
  ]

  return {
    id: eid,
    type: 'hallProcess',
    title: debateData.title,
    body,
    choices,
    resolved: false,
  }
}

// ── Fas 2 — Krav (förbundet) ──────────────────────────────────────────────

function buildKravEvent(
  game: SaveGame,
  currentRound: number,
  hallProcess: HallProcess,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const eid = `hallprocess_krav_s${game.currentSeason}`
  if (alreadyQueued.has(eid)) return null
  if (!isCooldownPassed(hallProcess, currentRound)) return null

  const choices: EventChoice[] = [
    {
      id: 'minimum',
      label: '[Opus]',  // Minsta godkända standard
      subtitle: 'Kostnadsmultiplikator ×1.0 — grundstandard',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({ phase: 'kommun', kravMultiplikator: 1.0 }),
      },
    },
    {
      id: 'standard',
      label: '[Opus]',  // Rimlig standard
      subtitle: 'Kostnadsmultiplikator ×1.2 — framtidssäkrad',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({ phase: 'kommun', kravMultiplikator: 1.2 }),
      },
    },
    {
      id: 'premium',
      label: '[Opus]',  // Premiumstandard
      subtitle: 'Kostnadsmultiplikator ×1.4 — fullt kapacitetsutnyttjande',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({ phase: 'kommun', kravMultiplikator: 1.4 }),
      },
    },
  ]

  return {
    id: eid,
    type: 'hallProcess',
    title: '[Opus]',
    body: '[Opus]',
    choices,
    resolved: false,
  }
}

// ── Fas 3 — Kommunförhandling ─────────────────────────────────────────────

function buildKommunEvent(
  game: SaveGame,
  currentRound: number,
  hallProcess: HallProcess,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const politician = game.localPolitician
  if (!politician) return null  // Ingen politiker = inga förhandlingar

  const eid = `hallprocess_kommun_s${game.currentSeason}_r${currentRound}`
  if (alreadyQueued.has(eid)) return null
  if (!isCooldownPassed(hallProcess, currentRound)) return null

  // Beräkna vad kommunen MAX kan bidra med givet agenda + relationer
  const agendaFriendly = politician.agenda === 'infrastructure' || politician.agenda === 'prestige'
  const highRelation = politician.relationship > 70
  const maxKommunAndel = agendaFriendly ? (highRelation ? 0.50 : 0.35) : (highRelation ? 0.25 : 0.15)
  const currentAndel = hallProcess.kommunAndel

  // Kontrollera om kommunen+patron kan täcka glappet → godkänd
  const activeMecenat = (game.mecenater ?? []).find(m => m.isActive && m.wealth >= 3 && m.happiness >= 50)
  const canGodkanna = currentAndel + (hallProcess.patronBorgen ? 0.30 : 0) >= 0.30  // minst 30% täckt = genomförbart

  const choices: EventChoice[] = [
    {
      id: 'negotiate_standard',
      label: '[Opus]',
      subtitle: `Kommunen bidrar med ~${Math.round(maxKommunAndel * 50)}% · kommunStöd +15`,
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({
          kommunStottaDelta: 15,
          kommunAndelDelta: maxKommunAndel * 0.5,
        }),
      },
    },
    {
      id: 'offer_naming_rights',
      label: '[Opus]',  // Namnrättigheter som eftergift
      subtitle: 'Kommunen bidrar mer · kommunAndel +' + Math.round(maxKommunAndel * 30) + '% · Identitet −',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({
          kommunStottaDelta: 25,
          kommunAndelDelta: maxKommunAndel * 0.8,
        }),
      },
    },
    ...(activeMecenat && !hallProcess.patronBorgen ? [{
      id: 'ask_patron_borgen',
      label: '[Opus]',  // Be patronen gå i borgen
      subtitle: `${activeMecenat.name} garanterar glappet — binder patronens resurser`,
      effect: {
        type: 'hallProcess' as const,
        hallProcessData: JSON.stringify({ patronBorgen: true }),
      },
    }] : []),
    ...(canGodkanna ? [{
      id: 'finalize',
      label: '[Opus]',  // Avsluta förhandlingen — finansieringen räcker
      subtitle: 'Prövningen godkänd — hallen kan börja byggas',
      effect: {
        type: 'hallProcess' as const,
        hallProcessData: JSON.stringify({ phase: 'godkand' }),
      },
    }] : []),
    {
      id: 'pause_negotiations',
      label: '[Opus]',  // Vänta på bättre läge
      subtitle: 'Förhandlingarna fortsätter nästa tillfälle',
      effect: {
        type: 'hallProcess' as const,
        hallProcessData: JSON.stringify({}),
      },
    },
  ]

  // Om kommunen är mot (savings-agenda, låg relation) och ingen patron → nekad-path
  const isHostile = politician.agenda === 'savings' && politician.relationship < 40
  if (isHostile && !activeMecenat) {
    choices.push({
      id: 'accept_rejection',
      label: '[Opus]',
      subtitle: 'Prövningen nekad — kan återupptas nästa säsong',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({ phase: 'nekad' }),
      },
    })
  }

  return {
    id: eid,
    type: 'hallProcess',
    title: '[Opus]',
    body: '[Opus]',
    choices,
    resolved: false,
  }
}

// ── Retry nekad ──────────────────────────────────────────────────────────

function maybeRetryNekad(
  game: SaveGame,
  currentRound: number,
  hallProcess: HallProcess,
  alreadyQueued: Set<string>,
): GameEvent | null {
  // Kan återupptas om politiker byttes (ny mandatperiod) eller relation förbättrats
  const politician = game.localPolitician
  if (!politician) return null
  const relationImproved = politician.relationship > 60 && hallProcess.kommunStotta < 50
  const newSeason = game.currentSeason > hallProcess.lastStepSeason
  if (!relationImproved && !newSeason) return null

  const eid = `hallprocess_retry_s${game.currentSeason}`
  if (alreadyQueued.has(eid)) return null

  return {
    id: eid,
    type: 'hallProcess',
    title: '[Opus]',
    body: '[Opus]',
    choices: [
      {
        id: 'retry',
        label: '[Opus]',
        subtitle: 'Starta om förankringsprocessen',
        effect: {
          type: 'hallProcess',
          hallProcessData: buildInitPayload(game, currentRound),
        },
      },
      {
        id: 'skip',
        label: '[Opus]',
        subtitle: 'Vänta ett till år',
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}

// ── Huvud-export ──────────────────────────────────────────────────────────

/**
 * Genererar nästa hall-process-händelse om villkoren är uppfyllda.
 * Ersätter generateHallDebateEvent i communityEvents.ts.
 */
export function generateHallProcessEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const fs = game.facilityState
  if (!fs) return null

  // Fas 1-start: inga hallProcess ännu
  if (!fs.hallProcess && shouldStartHallProcess(game)) {
    const eid = `hallprocess_start_s${game.currentSeason}`
    if (alreadyQueued.has(eid)) return null
    // Skapa init-event (initierar hallProcess + visar första förankrings-text)
    const politician = game.localPolitician
    const debateData = HALL_DEBATE_EVENTS['kommunenFrågar']
    const variantIdx = (currentRound + game.currentSeason * 13) % debateData.bodyVariants.length
    const body = debateData.bodyVariants[variantIdx]
      .replace('{politiker}', politician?.name ?? 'Kommunalrådet')

    return {
      id: eid,
      type: 'hallProcess',
      title: debateData.title,
      body,
      choices: [
        {
          id: 'start_process',
          label: 'Ja, vi startar utredningen',
          subtitle: 'Förankringsprocessen inleds — styrelsesstöd 0/60',
          effect: {
            type: 'hallProcess',
            hallProcessData: buildInitPayload(game, currentRound),
          },
        },
        {
          id: 'not_yet',
          label: 'Inte nu — orten trivs utomhus',
          subtitle: 'Processen startar inte den här säsongen',
          effect: { type: 'noOp' },
        },
      ],
      resolved: false,
    }
  }

  const hallProcess = fs.hallProcess
  if (!hallProcess) return null

  switch (hallProcess.phase) {
    case 'forankring':
      return buildForankringEvent(game, currentRound, hallProcess, alreadyQueued)
    case 'krav':
      return buildKravEvent(game, currentRound, hallProcess, alreadyQueued)
    case 'kommun':
      return buildKommunEvent(game, currentRound, hallProcess, alreadyQueued)
    case 'godkand':
      return null  // Hall låst upp — inga fler prövnings-händelser
    case 'nekad':
      return maybeRetryNekad(game, currentRound, hallProcess, alreadyQueued)
    default:
      return null
  }
}
