import type { Journalist, JournalistPersona, JournalistMemory, InboxItem } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { InboxItemType } from '../enums'
import { pickHeadline } from '../data/journalistHeadlineStrings'
import { deriveUtfall } from './matchTypeAxes'

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
  opponentShort?: string,  // B1 — motståndaren matchen gällde (Efterklang-premiss)
): Journalist {
  const entry: JournalistMemory = { season, matchday, event, sentiment, opponentShort }
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
  const utfall = deriveUtfall(fixture, managedClubId)
  const win = utfall === 'vunnet'
  const loss = utfall === 'forlorat'

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

  const headline = pickHeadline(bucket, persona, fixture.id, prevLoss, oppName, scoreline, fixture.matchday, fixture.isCup, 'inbox', fixture.isKnockout)
  if (!headline) return null

  // Fynd 3: samma matchhändelse, tre formuleringar — så rubriken inte läser identiskt
  // i portal, inkorg och granska. Samma bucket/persona → samma innebörd, olika ord.
  const portalHeadline = pickHeadline(bucket, persona, fixture.id, prevLoss, oppName, scoreline, fixture.matchday, fixture.isCup, 'portal', fixture.isKnockout)
  const granskaHeadline = pickHeadline(bucket, persona, fixture.id, prevLoss, oppName, scoreline, fixture.matchday, fixture.isCup, 'granska', fixture.isKnockout)

  return {
    id: `inbox_headline_md${fixture.matchday}_${season}`,
    date: currentDate,
    type: InboxItemType.MediaEvent,
    title: headline,
    mediaVariants: { portal: portalHeadline, granska: granskaHeadline },
    body: `${journalist.name}, ${journalist.outlet}`,
    outlet: journalist.outlet,
    isRead: false,
  } as InboxItem
}

// ── DEV-013: Critical article after 3 press refusals ─────────────────────────

export function generateCriticalArticle(journalist: Journalist, managerName: string, currentDate: string): InboxItem {
  return {
    id: `article_refusal_${journalist.pressRefusals}`,
    type: InboxItemType.MediaEvent,
    title: `${journalist.outlet}: "${managerName} duckar frågorna"`,
    // M36 (textaudit 2026-07-04): "tre i rad" antydde konsekutiva vägringar, men
    // pressRefusals är en kumulativ, aldrig nollställd räknare (recordPressRefusal
    // ökar den, inget i journalistService nollställer den) — avprecisad till
    // Fables föreslagna formulering.
    body: `Ledare i lokaltidningen: Klubbens ledning har nu gång på gång vägrat ställa upp. Det är inte bara en fråga om PR — det är en fråga om respekt för orten, supportrarna och de som följer laget. ${managerName} behöver börja svara.`,
    outlet: journalist.outlet,
    date: currentDate,
    isRead: false,
  } as InboxItem
}

// ── Generate persona-flavored headline prefix ─────────────────────────────

