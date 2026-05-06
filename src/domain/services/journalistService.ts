import type { Journalist, JournalistPersona, JournalistMemory, InboxItem } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { InboxItemType } from '../enums'
import { pickHeadline } from '../data/journalistHeadlineStrings'

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

  const styles: Array<'neutral' | 'provocative' | 'supportive'> = ['neutral', 'provocative', 'supportive']
  const style = styles[Math.floor(rand() * styles.length)]

  return {
    name: `${first} ${last}`,
    outlet,
    persona,
    style,
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

// ── Generate post-match headline for inbox ────────────────────────────────

export function generatePostMatchHeadline(
  journalist: Journalist,
  fixture: Fixture,
  managedClubId: string,
  currentDate: string,
  season: number,
  prevLoss: boolean,
  oppName?: string,
): InboxItem | null {
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const margin = myScore - theirScore
  const bigWin = margin >= 4
  const bigLoss = margin <= -4
  const win = margin > 0
  const loss = margin < 0

  const { persona } = journalist

  const scoreline = `${myScore}–${theirScore}`

  let bucket: 'big_win' | 'win' | 'draw' | 'loss' | 'big_loss'
  if (bigWin) bucket = 'big_win'
  else if (bigLoss) bucket = 'big_loss'
  else if (win) bucket = 'win'
  else if (loss) bucket = 'loss'
  else bucket = 'draw'

  // draw: only sensationalist and supportive publish headlines
  if (bucket === 'draw' && persona !== 'sensationalist' && persona !== 'supportive') return null

  const headline = pickHeadline(bucket, persona, fixture.id, prevLoss, oppName, scoreline)
  if (!headline) return null

  return {
    id: `inbox_headline_md${fixture.matchday}_${season}`,
    date: currentDate,
    type: InboxItemType.MediaEvent,
    title: `${journalist.name} · ${journalist.outlet}`,
    body: headline,
    isRead: false,
  } as InboxItem
}

// ── DEV-013: Critical article after 3 press refusals ─────────────────────────

export function generateCriticalArticle(journalist: Journalist, managerName: string, currentDate: string): InboxItem {
  return {
    id: `article_refusal_${journalist.pressRefusals}`,
    type: InboxItemType.MediaEvent,
    title: `${journalist.outlet}: "${managerName} ducker frågorna"`,
    body: `Ledare i lokaltidningen: Klubbens ledning har nu vägrat tre presskonferenser i rad. Det är inte bara en fråga om PR — det är en fråga om respekt för orten, supportrarna och de som följer laget. ${managerName} behöver börja svara.`,
    date: currentDate,
    isRead: false,
  } as InboxItem
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
