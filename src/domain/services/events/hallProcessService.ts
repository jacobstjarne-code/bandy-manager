/**
 * hallProcessService — matchhall-prövningens FSM (06-12-modellen).
 *
 * EN support-axel (ersätter tre stötta-axlar), tre förankrings-decisions,
 * checklist-krav (kravStatus beräknas live, lagras ej), kommunförhandling via
 * politicianData, Själ-priset via HALL_ATMOSPHERE när stage === 'klar'.
 *
 * Textkälla: TEXTPOOLER_PROVNING_2026-06-12.md (Opus) — integrerad ordagrant.
 */

import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, EventChoice } from '../../entities/GameEvent'
import type { HallTrial, HallTrialStage } from '../../entities/Community'
import {
  PROVNING_DECISIONS_FORANKRING,
  PROVNING_DECISIONS_FORHANDLING,
  PROVNING_EVENT_FORDYRING,
  PROVNING_RESOLUTION,
  HALLNODE_SUBS,
} from '../../data/hallProvningData'
import { getRivalry } from '../../data/rivalries'
import { clamp } from '../../utils/clamp'
import { seasonSpanLabel } from '../../utils/seasonYear'
import { FACILITY_NODE_DEFS, isFacilityTreeFull } from '../facilityService'

const MATCHHALL_DEF = FACILITY_NODE_DEFS.find(def => def.id === 'matchhall')!

function matchhallClubCost(finansiering: 'egen' | 'kommun' | 'patron'): number {
  const share = finansiering === 'kommun'
    ? (MATCHHALL_DEF.financing?.kommun?.share ?? 0)
    : finansiering === 'patron'
      ? (MATCHHALL_DEF.financing?.mecenat?.share ?? 0)
      : 0
  return Math.round(MATCHHALL_DEF.cost * (1 - share))
}

function withBuildCost(hint: string, cost: number): string {
  return `${hint} · Kassa −${Math.round(cost / 1000).toLocaleString('sv-SE')} tkr`
}

// ── Trigger ───────────────────────────────────────────────────────────────

/**
 * O17 del 2 (DOM_ANLAGGNINGSTRADETS_SLUT, 2026-08-17): hallprövningen öppnas
 * när trädet är fullt — tidigare räckte det med `laktare_ostra` byggd, vilket
 * kunde starta prövningen med sju-åtta noder ospelade. Domen: "hallprövningen
 * öppnas när trädet är fullt, men den är en horisont först efter O5" — den
 * ekonomiska tyngden (driftskostnad) väntar på O5, men gaten mot fullt träd
 * är trivial och byggs nu tillsammans med del 1.
 */
export function shouldStartHallTrial(game: SaveGame): boolean {
  const fs = game.facilityState
  if (!fs) return false
  if (fs.activeProject) return false
  if (game.currentSeason < 2) return false
  if (!isFacilityTreeFull(fs)) return false
  const hasIndoorRival = game.clubs.some(c => c.id !== game.managedClubId && c.hasIndoorArena === true)
  if (!hasIndoorRival) return false

  const trial = fs.hallTrial
  if (!trial) return true
  if (trial.stage === 'bordlagd' || trial.stage === 'nedlagd') {
    return game.currentSeason >= (trial.cooldownUntilSeason ?? 0)
  }
  return false
}

// ── Stödformel ───────────────────────────────────────────────────────────

function calcInitialSupport(game: SaveGame, prevSupport?: number): number {
  if (prevSupport !== undefined) {
    // Bordlagd restart: startvärde = slutvärde − 5
    return Math.max(15, prevSupport - 5)
  }
  const klackMood = game.supporterGroup?.mood ?? 50
  const puls = game.communityStanding ?? 50
  const raw = 40 + (klackMood - 50) * 0.4 + (puls - 50) * 0.3
  return Math.round(clamp(raw, 15, 70))
}

// ── Krav-check (beräknas live, lagras ej) ────────────────────────────────

export function computeKravStatus(game: SaveGame): { kapital: boolean; underlag: boolean; styrelse: boolean } {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const hasActivePatron = (game.mecenater ?? []).some(m => m.isActive && m.happiness >= 50)
  const kapital = (managedClub?.finances ?? 0) >= 1_200_000 || hasActivePatron

  const currentAvg = game.averageAttendance ?? 0
  const historicalHomeFixtures = game.fixtures.filter(f =>
    f.season < game.currentSeason &&
    f.status === 'completed' &&
    f.homeClubId === game.managedClubId &&
    f.attendance != null
  )
  const last33 = historicalHomeFixtures.slice(-33)
  const hist3Avg = last33.length >= 11
    ? last33.reduce((s, f) => s + (f.attendance ?? 0), 0) / last33.length
    : currentAvg  // ingen historik → sätt ribban till nuläge (passerar ej +10%)
  const underlag = hist3Avg > 0 ? currentAvg >= hist3Avg * 1.1 : false

  const prevHistory = (game.boardObjectiveHistory ?? []).filter(h => h.season === game.currentSeason - 1)
  const styrelse = prevHistory.length === 0
    ? true
    : prevHistory.filter(h => h.result === 'met').length / prevHistory.length >= 0.5

  return { kapital, underlag, styrelse }
}

// ── Passiva förankrings-effekter ─────────────────────────────────────────

function calcPassiveSupportDelta(game: SaveGame, trial: HallTrial, currentRound: number): number {
  const managedId = game.managedClubId
  const relevantFixtures = game.fixtures.filter(f =>
    f.status === 'completed' &&
    f.season === game.currentSeason &&
    (f.matchday ?? 0) >= trial.stageStartedRound &&
    (f.matchday ?? 0) < currentRound &&
    (f.homeClubId === managedId || f.awayClubId === managedId)
  )

  let delta = 0
  for (const f of relevantFixtures) {
    if (!getRivalry(f.homeClubId, f.awayClubId)) continue
    const isHome = f.homeClubId === managedId
    const ours = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const theirs = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    if (ours > theirs) delta += 3
    else if (ours < theirs) delta -= 3
  }

  const lastThree = relevantFixtures.slice(-3)
  if (lastThree.length === 3 && lastThree.every(f => {
    const isHome = f.homeClubId === managedId
    const ours = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const theirs = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return ours < theirs
  })) {
    delta -= 5
  }

  return delta
}

// ── Avbryt-val (alltid tillgängligt under förankring) ────────────────────

function avbrytaChoice(season: number): EventChoice {
  return {
    id: 'avbryta',
    label: 'Lägg ner frågan',
    subtitle: 'Klacken noterar det. Cooldown 1 säsong.',
    effect: {
      type: 'hallProcess',
      hallProcessData: JSON.stringify({ stage: 'nedlagd', cooldownUntilSeason: season + 1, selfNedlagd: true }),
    },
  }
}

// ── Förankrings-decisions ────────────────────────────────────────────────

/**
 * @cites trial.support
 */
function buildForankringEvent(
  game: SaveGame,
  currentRound: number,
  trial: HallTrial,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const s = game.currentSeason
  const { stageStartedRound } = trial
  const d1Id = `hallprocess_d1_s${s}`
  const d2Id = `hallprocess_d2_s${s}`
  const d3Id = `hallprocess_d3_s${s}`
  const resId = `hallprocess_res_s${s}`
  const resolved = new Set(game.resolvedEventIds ?? [])

  // Resolution at stageStartedRound + 10
  if (
    currentRound >= stageStartedRound + 10 &&
    resolved.has(d1Id) && resolved.has(d2Id) && resolved.has(d3Id) &&
    !alreadyQueued.has(resId)
  ) {
    const passiveDelta = calcPassiveSupportDelta(game, trial, currentRound)
    const finalSupport = clamp((trial.support ?? 50) + passiveDelta, 0, 100)

    let nextStage: HallTrialStage
    let cooldown: number | undefined
    let body: string

    if (finalSupport >= 60) {
      nextStage = 'krav'
      body = 'Röstlängden är räknad. Det blev ja.'
    } else if (finalSupport >= 40) {
      nextStage = 'bordlagd'
      cooldown = s + 1
      // Release-svepet 2026-07-21 (Block 3c): dedup — denna raden var tidigare
      // en egen hårdkodad kopia av PROVNING_RESOLUTION.bordlagd. Samma text,
      // en källa. eventResolver.ts:s hallProcess-case läser samma konstant
      // för inbox+kafferums-ekot när detta valet resolvas.
      body = PROVNING_RESOLUTION.bordlagd
    } else {
      nextStage = 'nedlagd'
      cooldown = s + 2
      body = PROVNING_RESOLUTION.nedlagd_fall
    }

    const payload = {
      stage: nextStage,
      supportDelta: passiveDelta,
      ...(cooldown !== undefined && { cooldownUntilSeason: cooldown }),
      ...(nextStage === 'krav' && { stageStartedRound: currentRound }),
    }

    return {
      id: resId,
      type: 'hallProcess',
      title: 'Röstningen är klar',
      body,
      choices: [{ id: 'ok', label: 'Noterat', subtitle: '', effect: { type: 'hallProcess', hallProcessData: JSON.stringify(payload) } }],
      resolved: false,
    }
  }

  // Decision 3 (enkaten) at +8, after d1 and d2 resolved
  if (currentRound >= stageStartedRound + 8 &&
      resolved.has(d1Id) && resolved.has(d2Id) && !alreadyQueued.has(d3Id)) {
    const def = PROVNING_DECISIONS_FORANKRING[2]
    const support = trial.support ?? 50
    return {
      id: d3Id,
      type: 'hallProcess',
      title: def.title,
      body: def.body,
      choices: [
        { id: 'oppenhet',  label: def.choiceA.label, subtitle: def.choiceA.hint,
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ supportDelta: 5 }) } },
        { id: 'ligg_laat', label: def.choiceB.label, subtitle: def.choiceB.hint,
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ supportDelta: support < 45 ? -5 : 0 }) } },
        avbrytaChoice(s),
      ],
      resolved: false,
    }
  }

  // Decision 2 (birger_mote) at +6, after d1 resolved
  if (currentRound >= stageStartedRound + 6 &&
      resolved.has(d1Id) && !alreadyQueued.has(d2Id)) {
    const def = PROVNING_DECISIONS_FORANKRING[1]
    return {
      id: d2Id,
      type: 'hallProcess',
      title: def.title,
      body: def.body,
      choices: [
        { id: 'ta_motet',  label: def.choiceA.label, subtitle: def.choiceA.hint,
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ supportDelta: 6 }) } },
        { id: 'skjut_upp', label: def.choiceB.label, subtitle: def.choiceB.hint,
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ supportDelta: -8 }) } },
        avbrytaChoice(s),
      ],
      resolved: false,
    }
  }

  // Decision 1 (medlemsmotet) at +3
  if (currentRound >= stageStartedRound + 3 && !alreadyQueued.has(d1Id)) {
    const def = PROVNING_DECISIONS_FORANKRING[0]
    // 60/40-viktad mot klackMood: högre mood = högre chans att "ta ordet" funkar
    const klackMood = game.supporterGroup?.mood ?? 50
    const successRate = 0.4 + (klackMood / 100) * 0.4
    const seed = (s * 17 + trial.stageStartedRound * 7) % 100
    const overtygaOk = seed < successRate * 100
    return {
      id: d1Id,
      type: 'hallProcess',
      title: def.title,
      body: def.body,
      choices: [
        { id: 'lyssna',   label: def.choiceA.label, subtitle: def.choiceA.hint,
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ supportDelta: 8 }) } },
        { id: 'overtala', label: def.choiceB.label, subtitle: def.choiceB.hint,
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ supportDelta: overtygaOk ? 14 : -10 }) } },
        avbrytaChoice(s),
      ],
      resolved: false,
    }
  }

  return null
}

// ── Krav-advancement ─────────────────────────────────────────────────────

function buildKravAdvancement(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const eid = `hallprocess_krav_adv_s${game.currentSeason}`
  if (alreadyQueued.has(eid)) return null

  const krav = computeKravStatus(game)
  if (!krav.kapital || !krav.underlag || !krav.styrelse) return null

  return {
    id: eid,
    type: 'hallProcess',
    title: 'Kraven är uppfyllda',
    body: 'Förbundet har granskat. Kassa, publik och styrelsebeslut — allt är på plats. Nu är det kommunens tur.',
    choices: [{
      id: 'ga_vidare',
      label: 'Gå vidare till förhandlingen',
      subtitle: 'Kommunförhandlingen inleds',
      effect: {
        type: 'hallProcess',
        hallProcessData: JSON.stringify({ stage: 'forhandling', stageStartedRound: currentRound }),
      },
    }],
    resolved: false,
  }
}

// ── Förhandlings-decisions ────────────────────────────────────────────────

function buildForhandlingEvent(
  game: SaveGame,
  currentRound: number,
  trial: HallTrial,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const s = game.currentSeason
  const { stageStartedRound } = trial
  const fh1Id = `hallprocess_fh1_s${s}`
  const fh1NejId = `hallprocess_fh1nej_s${s}`
  const fh2Id = `hallprocess_fh2_s${s}`
  const fhNejId = `hallprocess_fhnej_s${s}`
  const politician = game.localPolitician
  const minRelation = MATCHHALL_DEF.financing?.kommun?.minRelation ?? 45
  const municipalityWillFinance = (politician?.relationship ?? 0) >= minRelation

  // Patron-erbjudande at +6 (fallback om kommunvägen inte löst sig)
  if (currentRound >= stageStartedRound + 6 && !municipalityWillFinance) {
    const activePatron = (game.mecenater ?? []).find(m => m.isActive && m.happiness >= 50)
    if (activePatron && !alreadyQueued.has(fh2Id)) {
      const def = PROVNING_DECISIONS_FORHANDLING[1]
      const title = def.title.replace('{patron}', activePatron.name)
      return {
        id: fh2Id,
        type: 'hallProcess',
        title,
        body: def.body,
        choices: [
          { id: 'borgen',    label: def.choiceA.label, subtitle: withBuildCost(def.choiceA.hint, matchhallClubCost('patron')),
            effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ finansiering: 'patron', stage: 'bygge', stageStartedRound: currentRound, buildCost: matchhallClubCost('patron') }) } },
          { id: 'tacka_nej', label: def.choiceB.label, subtitle: withBuildCost(def.choiceB.hint, matchhallClubCost('egen')),
            effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ finansiering: 'egen', stage: 'bygge', stageStartedRound: currentRound, buildCost: matchhallClubCost('egen') }) } },
        ],
        resolved: false,
      }
    } else if (!alreadyQueued.has(fhNejId)) {
      // Ingen patron och kommunvägen inte löst — avsluta
      return {
        id: fhNejId,
        type: 'hallProcess',
        title: 'Förhandlingen avslutas',
        body: 'Kommunen passade. Ingen patron att falla tillbaka på. Hallfrågan får vänta.',
        choices: [{
          id: 'noterat',
          label: 'Noterat',
          subtitle: '',
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage: 'nedlagd', cooldownUntilSeason: s + 2 }) },
        }],
        resolved: false,
      }
    }
  }

  // Kommunens villkor at +2
  if (currentRound >= stageStartedRound + 2 && !alreadyQueued.has(fh1Id) && !alreadyQueued.has(fh1NejId)) {
    if (!politician || !municipalityWillFinance) return null

    // hall-kommun-nej-onabart (DOM 2026-09-03): stödet (politician.relationship)
    // styr FÖRANKRINGSRÖSTNINGEN, inte kommunens egen ja/nej — en klubb som
    // klarat kraven har ALLTID relationen, så kommunens gate var teater. CS
    // garanteras inte av kraven; nej blir nåbart exakt för den som försummat
    // orten. TEXT LÅST (Opus), kopierad ordagrant.
    const communityStanding = game.communityStanding ?? 50
    if (communityStanding < 50) {
      return {
        id: fh1NejId,
        type: 'hallProcess',
        title: 'Kommunen säger nej',
        body: 'Kommunalrådet ringer själv, vilket sällan är ett gott tecken. Pengarna hade gått att hitta. Men orten står inte bakom bygget, och en hall som bygden inte vill ha bygger ingen kommun. Frågan bordläggs. Bygg förtroendet på orten först, så tas den upp igen.',
        choices: [{
          id: 'noterat',
          label: 'Noterat',
          subtitle: 'Bordlagd till nästa säsong. Orten avgör.',
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage: 'bordlagd', cooldownUntilSeason: s + 1 }) },
        }],
        resolved: false,
      }
    }

    const def = PROVNING_DECISIONS_FORHANDLING[0]
    const buildCost = matchhallClubCost('kommun')
    return {
      id: fh1Id,
      type: 'hallProcess',
      title: def.title,
      body: def.body,
      choices: [
        // Den tidigare delad_drift-knappen hade byte-identisk effekt och en
        // påhittad "högre ja-odds". En verklig kommunväg, inte två skenval.
        { id: 'ungdomstimmar', label: def.choiceA.label, subtitle: withBuildCost(def.choiceA.hint, buildCost),
          effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ finansiering: 'kommun', stage: 'bygge', stageStartedRound: currentRound, buildCost }) } },
      ],
      resolved: false,
    }
  }

  return null
}

// ── Bygge: fördyrings-event ───────────────────────────────────────────────

function buildFordyringEvent(
  game: SaveGame,
  currentRound: number,
  trial: HallTrial,
  alreadyQueued: Set<string>,
): GameEvent | null {
  if (currentRound < trial.stageStartedRound + 11) return null
  const eid = `hallprocess_fordyring_s${game.currentSeason}`
  if (alreadyQueued.has(eid)) return null

  // 25 % risk, deterministiskt seedat
  const seed = (game.currentSeason * 31 + trial.stageStartedRound * 13) % 100
  if (seed >= 25) return null

  const def = PROVNING_EVENT_FORDYRING
  return {
    id: eid,
    type: 'hallProcess',
    title: def.title,
    body: def.body,
    choices: [
      { id: 'skjut_till', label: def.choiceA.label, subtitle: def.choiceA.hint,
        effect: { type: 'finance', value: -360_000 } },  // −20 % av 1 800 000
      { id: 'pausa',      label: def.choiceB.label, subtitle: def.choiceB.hint,
        effect: { type: 'hallProcess', hallProcessData: JSON.stringify({
          buildPausedUntilSeason: game.currentSeason + 1,
          buildPausedAtMatchday: game.currentMatchday,
        }) } },
    ],
    resolved: false,
  }
}

// ── Start-event (vilande → förankring) ───────────────────────────────────

function buildStartEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const eid = `hallprocess_start_s${game.currentSeason}`
  if (alreadyQueued.has(eid)) return null

  const prevTrial = game.facilityState?.hallTrial
  const prevSupport = prevTrial?.stage === 'bordlagd' ? prevTrial.support : undefined
  const initSupport = calcInitialSupport(game, prevSupport)

  const init: HallTrial = {
    stage: 'forankring',
    support: initSupport,
    startedSeason: game.currentSeason,
    stageStartedRound: currentRound,
  }

  return {
    id: eid,
    type: 'hallProcess',
    title: 'Hallfrågan är här',
    body: 'Rivalerna spelar inomhus. Orten har frågat sig om det. Nu har du ett val: inled förankringen — eller låt vallens vinter vara.',
    choices: [
      {
        id: 'inled',
        label: 'Inled förankringen',
        subtitle: `Startvärde stöd: ${initSupport}`,
        effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ init }) },
      },
      {
        id: 'inte_nu',
        label: 'Inte nu — orten trivs utomhus',
        subtitle: 'Processen startar inte den här säsongen',
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}

// ── Huvud-export ─────────────────────────────────────────────────────────

/**
 * Genererar nästa hall-prövnings-händelse om villkoren är uppfyllda.
 * Anropas av communityEvents.ts varje omgång.
 */
export function generateHallProcessEvent(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
): GameEvent | null {
  const fs = game.facilityState
  if (!fs) return null

  // Start-event: villkoren är uppfyllda men inget aktivt trial
  if (shouldStartHallTrial(game)) {
    return buildStartEvent(game, currentRound, alreadyQueued)
  }

  const trial = fs.hallTrial
  if (!trial) return null

  switch (trial.stage) {
    case 'forankring':
      return buildForankringEvent(game, currentRound, trial, alreadyQueued)
    case 'krav':
      return buildKravAdvancement(game, currentRound, alreadyQueued)
    case 'forhandling':
      return buildForhandlingEvent(game, currentRound, trial, alreadyQueued)
    case 'bygge':
      return buildFordyringEvent(game, currentRound, trial, alreadyQueued)
    case 'klar':
    case 'nedlagd':
    case 'bordlagd':
    case 'vilande':
    default:
      return null
  }
}

// ── Nod-undertext (Block 3a/3e) ──────────────────────────────────────────

/**
 * Fyller HALLNODE_SUBS[stage]:s platshållare ({n}/{x}/{season}/{year}) med
 * riktiga värden — aldrig en gissning. Används av FacilityTree.tsx:s nod-
 * undertext och H·1-hubben (samma källa, ingen andra sanning).
 *
 * {season} i 'bygge' är en matchdags-räkning ("omg {etaMatchday}"), inte ett
 * kalenderårtal — activeProject.etaMatchday kan falla i nästa säsong
 * (buildRounds=20, se facilityNodes.ts) och det finns ingen matchday→säsong-
 * konvertering i kodbasen att luta sig mot (samma dokumenterade hål som
 * FacilityNodeView.completedSeason, clubMemoryService.ts). Undvik att gissa
 * fel årtal — visa den riktiga matchdagen istf.
 */
export function formatHallNodeSub(game: SaveGame): string {
  const fs = game.facilityState
  const trial = fs?.hallTrial
  const stage: HallTrialStage = trial?.stage ?? 'vilande'
  const template = HALLNODE_SUBS[stage]

  switch (stage) {
    case 'forankring':
      return template.replace('{n}', String(trial?.support ?? 0))
    case 'krav': {
      const krav = computeKravStatus(game)
      const met = [krav.kapital, krav.underlag, krav.styrelse].filter(Boolean).length
      return template.replace('{x}', String(met))
    }
    case 'bygge': {
      const pausedUntilSeason = trial?.buildPausedUntilSeason
      if (pausedUntilSeason !== undefined && pausedUntilSeason > game.currentSeason) {
        // design-d2 (sluttest-narrative-truth-grind R1, 2026-09-06): bandyårs-
        // span, inte ett naket kalenderår.
        return `Bygge · paus till säsong ${seasonSpanLabel(pausedUntilSeason)}`
      }
      const eta = fs?.activeProject?.etaMatchday
      return template.replace('{season}', eta !== undefined ? `omg ${eta}` : '—')
    }
    case 'nedlagd':
      return template.replace('{season}', String(trial?.cooldownUntilSeason ?? '—'))
    case 'klar':
      return template.replace('{year}', String(trial?.completedSeason ?? game.currentSeason))
    default:
      return template
  }
}
