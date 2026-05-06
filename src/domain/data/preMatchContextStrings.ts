export type PreMatchTrigger =
  | 'derby'
  | 'win_streak'
  | 'loss_streak'
  | 'table_above'
  | 'table_below'
  | 'opp_hot'
  | 'opp_home_unbeaten'
  | 'opp_cold'
  | 'cup_fixture'

export const NUMBER_WORDS: Record<number, string> = {
  3: 'Tre',
  4: 'Fyra',
  5: 'Fem',
  6: 'Sex',
  7: 'Sju',
  8: 'Åtta',
  9: 'Nio',
  10: 'Tio',
}

export function streakWord(n: number): string {
  return NUMBER_WORDS[n] ?? `${n}`
}

export interface PreMatchSubs {
  fixtureId: string
  opp?: string
  rivalry?: string
  n?: number
  pos?: number
}

const POSITION_WORDS: Record<number, string> = {
  1: 'ettan',
  2: 'tvåan',
  3: 'trean',
  4: 'fyran',
  5: 'femman',
  6: 'sexan',
  7: 'sjuan',
  8: 'åttan',
  9: 'nian',
  10: 'tian',
  11: 'elvan',
  12: 'tolvan',
}

export function positionWord(pos: number): string {
  return POSITION_WORDS[pos] ?? `${pos}:e plats`
}

const POOLS: Record<PreMatchTrigger, string[]> = {
  derby: [
    '{rivalry}.',
    '{rivalry} idag.',
    'Derbyt. {opp}.',
    '{opp}. Halva byn vet redan vad de hoppas på.',
    '{rivalry}. Ingen behöver förklara vad det betyder.',
  ],
  win_streak: [
    '{nword} raka. Håll det.',
    '{nword} på rad. Tro inte att det är slumpen.',
    '{nword} raka vinster. Folk börjar tro på det.',
    '{nword} på rad. Sture log på Konsum igår.',
    '{nword} raka. Ingen vågar säga det högt än.',
  ],
  loss_streak: [
    '{nword} raka förluster. Det måste få ett slut idag.',
    '{nword} på rad åt fel håll.',
    '{nword} raka. Bryt det.',
    '{nword} matcher utan poäng. Något måste lossna.',
    '{nword} förluster på rad. Tystnaden i kafferummet säger sitt.',
  ],
  table_above: [
    '{n} poäng upp till {posword}.',
    '{posword} är inom räckhåll.',
    '{n} poäng från {posword} plats.',
    '{posword} ligger {n} poäng bort.',
  ],
  table_below: [
    '{n} poäng ner till strecket.',
    'Strecket har gnagt sig nära.',
    'Det är inte långt ner till {posword}.',
    '{n} poängs marginal ner till nedflyttning.',
  ],
  opp_hot: [
    '{opp} har vunnit fyra raka.',
    '{opp} kommer i form.',
    '{opp} har inte tappat poäng på en månad.',
    '{opp} är på gång. Det vet alla utom dem själva.',
  ],
  opp_home_unbeaten: [
    '{opp} har inte förlorat hemma på {n} matcher.',
    'Hemma har {opp} inte tappat poäng den här säsongen.',
    '{n} raka hemma utan förlust för {opp}.',
    'Ingen har tagit poäng på deras is i år.',
  ],
  opp_cold: [
    '{opp} har förlorat fyra av fem.',
    '{opp} är skakade.',
    '{opp} kommer hit slitna.',
    '{opp} har gått sönder någonstans i höst.',
  ],
  cup_fixture: [
    'Cupen. En match som folk minns längre än serien.',
    'Cup-spel. Ingen mellannivå — vidare eller hem.',
    'Cup. Bara ett resultat räknas.',
  ],
}

function hashSeed(fixtureId: string): number {
  let h = 0
  for (let i = 0; i < fixtureId.length; i++) {
    h = (Math.imul(31, h) + fixtureId.charCodeAt(i)) >>> 0
  }
  return h
}

export function pickPreMatchContextText(trigger: PreMatchTrigger, subs: PreMatchSubs): string {
  const pool = POOLS[trigger]
  const idx = hashSeed(subs.fixtureId) % pool.length
  let text = pool[idx]
  text = text.replace(/\{opp\}/g, subs.opp ?? 'Motståndaren')
  text = text.replace(/\{rivalry\}/g, subs.rivalry ?? 'Derbyt')
  if (subs.n != null) {
    text = text.replace(/\{nword\}/g, streakWord(subs.n))
    text = text.replace(/\{n\}/g, String(subs.n))
  }
  if (subs.pos != null) {
    text = text.replace(/\{posword\}/g, positionWord(subs.pos))
    text = text.replace(/\{pos\}/g, String(subs.pos))
  }
  return text
}
