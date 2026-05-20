import type { AnslagText } from './types'

export type PlayoffAnslagKey =
  | 'playoff_eliminated_kf'
  | 'playoff_eliminated_sf'
  | 'playoff_eliminated_smf'

export const PLAYOFF_ANSLAG: Record<PlayoffAnslagKey, AnslagText> = {
  playoff_eliminated_kf: {
    chapter: '⬩ Säsongens slut ⬩',
    variants: [
      {
        body: '{motståndare} gick vidare. Vi håller i varandra i omklädningsrummet — det är det vi kan göra nu. Semifinalen spelas utan oss.',
      },
      {
        body: 'Kvartsfinalen mot {motståndare} slutade {resultat}. Hallen tömdes snabbt. Så slutar det ibland — inte med ett rop, utan med tystnad.',
      },
      {
        body: 'Vi är ute. {motståndare} spelar vidare i {rond}. Det gör ont precis lagom mycket för att något ska bli annorlunda till nästa säsong.',
      },
    ],
  },
  playoff_eliminated_sf: {
    chapter: '⬩ Säsongens slut ⬩',
    variants: [
      {
        body: 'Semifinalen är slut. {motståndare} vann {resultat} och tar sig till SM-finalen. Vi kom hit — det är längre än de flesta. Men inte långt nog.',
      },
      {
        body: '{motståndare} var bättre i {rond}. Resultatet {resultat} säger inte allt, men det säger tillräckligt. Nu väntar vi på vem som spelar SM-finalen utan oss.',
      },
      {
        body: 'Fyra lag kvar i {rond} — nu tre. Vi åker hem. {motståndare} spelar vidare. Det är svårt att sätta ord på det som finns kvar i kroppen efter en säsong.',
      },
    ],
  },
  playoff_eliminated_smf: {
    chapter: '⬩ Silvermedalj ⬩',
    variants: [
      {
        body: 'Silver. {motståndare} vann SM-finalen {resultat}. Vi kämpade hela vägen hit — det är inte ingenting. Medaljen är tung på rätt sätt.',
      },
      {
        body: 'SM-finalen förlorad mot {motståndare}, {resultat}. Det är bittert. Men vi var i final — det glöms inte bort, varken av oss eller av dem som var där.',
      },
      {
        body: '{motståndare} är svenska mästare. Vi är silvermedaljörer. {resultat} i SM-finalen. Det räcker inte hela vägen, men det är mer än de flesta får uppleva.',
      },
    ],
  },
}
