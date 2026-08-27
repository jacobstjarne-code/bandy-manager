import type { Journalist } from '../../entities/SaveGame'

export interface JournalistSceneMemoryEntry {
  matchday: number
  season: number
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface JournalistRelationshipSceneData {
  name: string
  outlet: string
  relationship: number
  severity: 'cold' | 'warm'
  statusText: string
  memories: JournalistSceneMemoryEntry[]
  outlookText: string
}

const EVENT_TO_SUMMARY: Record<string, string> = {
  'refused_press': 'Vägrade presskonferens',
  'good_answer':   'Svarade ärligt på presskonferensen',
  'bad_answer':    'Undvek frågan på presskonferensen',
  // M37 (textaudit 2026-07-04): cs_press_*-nycklarna (eventResolver.ts) saknade
  // etiketter helt — föll till råa slugs via `?? m.event`. Korta varianter av
  // CS_PRESS_CHOICE_BUTTONS (csPressEventText.ts).
  'cs_press_individual': 'Lyfte fram en spelare efter nollan',
  'cs_press_team':       'Pekade på hela laget efter nollan',
  'cs_press_system':     'Svarade systemiskt efter nollan',
  'cs_press_silent':     'Avstod kommentar efter nollan',
}

function sentimentClass(s: number): 'positive' | 'neutral' | 'negative' {
  if (s > 0) return 'positive'
  if (s < 0) return 'negative'
  return 'neutral'
}

function buildStatusText(relationship: number, lastName: string): string {
  if (relationship <= 20) return `Mycket kylig. ${lastName} skriver hellre om er än med er.`
  if (relationship <= 30) return `Kylig. ${lastName} ringer mer sällan nu.`
  if (relationship >= 90) return `Utmärkt. ${lastName} är klubbens ambassadör i spalterna.`
  if (relationship >= 75) return `Stark relation. Rubrikerna har varit på er sida — fortsätt prata med ${lastName}.`
  return `Varm. ${lastName} skriver om er nästan varje vecka.`
}

/**
 * @cites pressRefusals
 */
function buildOutlookText(journalist: Journalist): string {
  const rel = journalist.relationship
  const refusals = journalist.pressRefusals ?? 0
  const lastName = journalist.name.split(' ').pop() ?? journalist.name
  if (rel <= 20) {
    if (refusals >= 3) return `${refusals} nekade presskonferenser. Det syns i rubrikerna.`
    return 'Relationen är bruten. Det krävs tid och ärlighet för att vända.'
  }
  if (rel <= 30) {
    return 'Några ärliga svar i rad — då vänder det.'
  }
  if (rel >= 75) {
    return `${lastName} är på er sida nu. Det håller så länge du är lika öppen tillbaka.`
  }
  return 'Fortsätt svara ärligt. Relationen håller.'
}

export function buildJournalistSceneData(journalist: Journalist, _currentSeason: number): JournalistRelationshipSceneData {
  const rel = journalist.relationship
  const severity: 'cold' | 'warm' = rel >= 70 ? 'warm' : 'cold'
  const lastName = journalist.name.split(' ').pop() ?? journalist.name

  const memories: JournalistSceneMemoryEntry[] = journalist.memory
    .slice(-5)
    .reverse()
    .map(m => ({
      matchday: m.matchday,
      season: m.season,
      summary: EVENT_TO_SUMMARY[m.event] ?? m.event,
      sentiment: sentimentClass(m.sentiment),
    }))

  return {
    name: journalist.name,
    outlet: journalist.outlet,
    relationship: rel,
    severity,
    statusText: buildStatusText(rel, lastName),
    memories,
    outlookText: buildOutlookText(journalist),
  }
}
