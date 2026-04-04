import type { Journalist, JournalistPersona, JournalistMemory } from '../entities/SaveGame'

// ── Swedish journalist first + last names ─────────────────────────────────

const FIRST_NAMES = [
  'Anna', 'Erik', 'Karin', 'Lars', 'Maria', 'Peter', 'Sofia',
  'Johan', 'Lena', 'Magnus', 'Helena', 'Nils', 'Camilla', 'Anders',
]

const LAST_NAMES = [
  'Lindqvist', 'Bergström', 'Holmgren', 'Sandberg', 'Nordin',
  'Wikström', 'Eklund', 'Hedlund', 'Gustafsson', 'Johansson',
]

const MAX_MEMORY = 10

// ── Create journalist at game start ───────────────────────────────────────

export function createJournalist(
  outlet: string,
  rand: () => number,
): Journalist {
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
  const personas: JournalistPersona[] = ['supportive', 'critical', 'analytical', 'sensationalist']
  const persona = personas[Math.floor(rand() * personas.length)]

  return {
    name: `${first} ${last}`,
    outlet,
    persona,
    relationship: 50,
    memory: [],
    pressRefusals: 0,
  }
}

// ── Record an interaction ─────────────────────────────────────────────────

export function recordInteraction(
  journalist: Journalist,
  season: number,
  matchday: number,
  event: string,
  sentiment: number,
): Journalist {
  const entry: JournalistMemory = { season, matchday, event, sentiment }
  const memory = [...journalist.memory, entry].slice(-MAX_MEMORY)
  const newRelationship = Math.max(0, Math.min(100, journalist.relationship + sentiment))
  return {
    ...journalist,
    memory,
    relationship: newRelationship,
    lastInteractionMatchday: matchday,
  }
}

// ── Record press refusal ──────────────────────────────────────────────────

export function recordPressRefusal(journalist: Journalist, season: number, matchday: number): Journalist {
  return recordInteraction(
    { ...journalist, pressRefusals: journalist.pressRefusals + 1 },
    season,
    matchday,
    'refused_press',
    -8,
  )
}

// ── Get journalist tone modifier based on persona + relationship ──────────

export interface ToneModifier {
  questionStyle: 'friendly' | 'neutral' | 'hostile'
  headlineStyle: 'positive' | 'neutral' | 'negative'
  followUpChance: number  // 0-1, chance of tough follow-up question
}

export function getJournalistTone(journalist: Journalist): ToneModifier {
  const rel = journalist.relationship
  const persona = journalist.persona

  // Base tone from relationship
  let questionStyle: ToneModifier['questionStyle'] = 'neutral'
  let headlineStyle: ToneModifier['headlineStyle'] = 'neutral'
  let followUpChance = 0.1

  if (rel >= 70) {
    questionStyle = 'friendly'
    headlineStyle = 'positive'
    followUpChance = 0.05
  } else if (rel <= 30) {
    questionStyle = 'hostile'
    headlineStyle = 'negative'
    followUpChance = 0.3
  }

  // Persona modifiers
  switch (persona) {
    case 'critical':
      if (questionStyle === 'neutral') questionStyle = 'hostile'
      followUpChance += 0.15
      break
    case 'supportive':
      if (questionStyle === 'neutral') questionStyle = 'friendly'
      if (headlineStyle === 'neutral') headlineStyle = 'positive'
      followUpChance = Math.max(0, followUpChance - 0.05)
      break
    case 'sensationalist':
      followUpChance += 0.2
      if (rel < 50) headlineStyle = 'negative'
      break
    case 'analytical':
      // Always neutral tone, focus on facts
      questionStyle = 'neutral'
      break
  }

  // Recent refusals make everyone hostile
  if (journalist.pressRefusals >= 2) {
    questionStyle = 'hostile'
    followUpChance = Math.min(1, followUpChance + 0.2)
  }

  return { questionStyle, headlineStyle, followUpChance }
}

// ── Generate persona-flavored headline prefix ─────────────────────────────

export function getHeadlinePrefix(journalist: Journalist, isPositive: boolean): string {
  const { persona, name, outlet } = journalist

  if (isPositive) {
    switch (persona) {
      case 'supportive': return `${name} i ${outlet}: `
      case 'analytical': return `${outlet} — analys: `
      case 'sensationalist': return `${outlet}: SENSATION! `
      case 'critical': return `${name}, ${outlet}: `
    }
  } else {
    switch (persona) {
      case 'critical': return `${name} i ${outlet}: `
      case 'sensationalist': return `${outlet}: KRIS! `
      case 'analytical': return `${outlet} — granskning: `
      case 'supportive': return `${name}, ${outlet}: `
    }
  }
  return `${outlet}: `
}
