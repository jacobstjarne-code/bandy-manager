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
}

function sentimentClass(s: number): 'positive' | 'neutral' | 'negative' {
  if (s > 0) return 'positive'
  if (s < 0) return 'negative'
  return 'neutral'
}

function buildStatusText(relationship: number): string {
  if (relationship <= 20) return 'Mycket kylig. Hon skriver inte om er längre.'
  if (relationship <= 30) return 'Kylig. Hon ringer mer sällan nu.'
  if (relationship >= 90) return 'Utmärkt. Hon är en ambassadör för klubben.'
  if (relationship >= 75) return 'Stark relation. Lokaltidningens rubriker har dragit upp orten — fortsätt prata med henne.'
  return 'Varm. Hon skriver om er nästan varje vecka.'
}

function buildOutlookText(journalist: Journalist): string {
  const rel = journalist.relationship
  const refusals = journalist.pressRefusals ?? 0
  if (rel <= 20) {
    if (refusals >= 3) return 'Tre nekade presskonferenser. Det syns i rubrikerna.'
    return 'Relationen är bruten. Det krävs tid och ärlighet för att vända.'
  }
  if (rel <= 30) {
    return 'Tre presskonferenser till med ärligt svar — då vänder det.'
  }
  if (rel >= 75) {
    return 'Stark relation. Lokaltidningens rubriker har dragit upp orten — fortsätt prata med henne.'
  }
  return 'Fortsätt svara ärligt. Relationen håller.'
}

export function buildJournalistSceneData(journalist: Journalist, _currentSeason: number): JournalistRelationshipSceneData {
  const rel = journalist.relationship
  const severity: 'cold' | 'warm' = rel >= 70 ? 'warm' : 'cold'

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
    statusText: buildStatusText(rel),
    memories,
    outlookText: buildOutlookText(journalist),
  }
}
