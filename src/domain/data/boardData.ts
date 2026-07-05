export const BOARD_PROFILES = [
  // Ordförande (8 st — olika personligheter)
  { first: 'Bengt', last: 'Karlsson', role: 'ordförande' as const, personality: 'supporter' as const },
  { first: 'Karin', last: 'Lindström', role: 'ordförande' as const, personality: 'modernist' as const },
  { first: 'Stig', last: 'Johansson', role: 'ordförande' as const, personality: 'traditionalist' as const },
  { first: 'Anita', last: 'Persson', role: 'ordförande' as const, personality: 'ekonom' as const },
  { first: 'Lars', last: 'Berglund', role: 'ordförande' as const, personality: 'supporter' as const },
  { first: 'Margareta', last: 'Ek', role: 'ordförande' as const, personality: 'traditionalist' as const },
  { first: 'Håkan', last: 'Forslund', role: 'ordförande' as const, personality: 'ekonom' as const },
  { first: 'Birgitta', last: 'Nyström', role: 'ordförande' as const, personality: 'modernist' as const },

  // Kassör (6 st)
  { first: 'Karin', last: 'Holm', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Ulf', last: 'Bergström', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Marianne', last: 'Norberg', role: 'kassör' as const, personality: 'supporter' as const },
  { first: 'Tomas', last: 'Larsson', role: 'kassör' as const, personality: 'modernist' as const },
  { first: 'Lennart', last: 'Dahlgren', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Agneta', last: 'Sjöberg', role: 'kassör' as const, personality: 'traditionalist' as const },

  // Ledamöter (12 st)
  { first: 'Rolf', last: 'Svensson', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Eva', last: 'Gustafsson', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Per', last: 'Andersson', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Gunilla', last: 'Nilsson', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Lars', last: 'Wikström', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Ingrid', last: 'Forsberg', role: 'ledamot' as const, personality: 'ekonom' as const },
  { first: 'Mikael', last: 'Sandberg', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Berit', last: 'Hedman', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Tommy', last: 'Engström', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Siv', last: 'Lundkvist', role: 'ledamot' as const, personality: 'ekonom' as const },
  { first: 'Anders', last: 'Moberg', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Inga-Britt', last: 'Hägg', role: 'ledamot' as const, personality: 'traditionalist' as const },
]

export type BoardPersonality = 'supporter' | 'ekonom' | 'traditionalist' | 'modernist'
export type BoardRole = 'ordförande' | 'kassör' | 'ledamot'
