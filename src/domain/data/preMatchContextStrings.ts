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
  n?: number
  pos?: number
}

const POOLS: Record<PreMatchTrigger, string[]> = {
  derby: [
    'Derbyt. {opp}.',
    '{opp}. Det gamla derbyt.',
    'Derby idag. Allt räknas.',
  ],
  win_streak: [
    '{n} raka vinster. Håll det.',
    'Formen är där — {n} raka. Fortsätt.',
    '{n} vinster i rad. Bygg vidare.',
  ],
  loss_streak: [
    '{n} raka förluster. Något måste brytas.',
    '{n} raka. Det vänder här.',
    'Svacka — {n} raka förluster. Dags att vända.',
  ],
  table_above: [
    'En poäng upp till {pos}:an.',
    '{pos}:an är inom räckhåll — en poäng.',
    'Klättringen fortsätter. {pos}:an är nära.',
  ],
  table_below: [
    'En poäng ner till nedflyttningsstrecket.',
    'Tajt läge — en poäng ner till strecket.',
    'Det gäller att hålla undan. En poäng ner.',
  ],
  opp_hot: [
    '{opp} i strålande form.',
    '{opp} är på en bra svit.',
    'Tuff dag — {opp} är heta.',
  ],
  opp_home_unbeaten: [
    '{opp} obesegrade hemma — {n} raka.',
    '{n} matcher utan förlust hemma för {opp}.',
    '{opp} har inte tappat hemma på {n} matcher.',
  ],
  opp_cold: [
    '{opp} på en svacka.',
    '{opp} är i dålig form.',
    'Bra läge — {opp} på bottenform.',
  ],
  cup_fixture: [
    'Cupmatch.',
    'Det är cup idag.',
    'Cupspel. Allt eller inget.',
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
  return pool[idx]
    .replace('{opp}', subs.opp ?? 'Motståndaren')
    .replace('{n}', subs.n != null ? streakWord(subs.n) : '')
    .replace('{pos}', subs.pos != null ? String(subs.pos) : '')
}
