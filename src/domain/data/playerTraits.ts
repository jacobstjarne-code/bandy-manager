export type PlayerTrait = 'veteran' | 'hungrig' | 'ledare' | 'lokal' | 'joker'

export interface TraitMeta {
  label: string
  description: string
  color: string
  emoji: string
}

export const TRAIT_META: Record<PlayerTrait, TraitMeta> = {
  veteran: {
    label: 'Veteran',
    description: 'En erfaren spjutspets med år av tjänst. Laget lyssnar.',
    color: '#C9A84C',
    emoji: '🏅',
  },
  hungrig: {
    label: 'Hungrig',
    description: 'Ung och driven. Vill bevisa sig.',
    color: '#22c55e',
    emoji: '🔥',
  },
  ledare: {
    label: 'Ledare',
    description: 'Naturlig kaptensfigur. Håller ihop gruppen.',
    color: '#60a5fa',
    emoji: '⭐',
  },
  lokal: {
    label: 'Lokalhjälte',
    description: 'Född och uppvuxen här. Publiken älskar honom.',
    color: '#a78bfa',
    emoji: '🏠',
  },
  joker: {
    label: 'Joker',
    description: 'Oförutsägbar. Kan avgöra matcher — åt båda håll.',
    color: '#f59e0b',
    emoji: '🃏',
  },
}
