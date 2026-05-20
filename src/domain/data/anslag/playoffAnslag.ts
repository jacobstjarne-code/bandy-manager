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
        body: `Tredje raka. {motståndare} avgjorde {resultat} och går till semifinalen. Hallen tystnade fortare än vanligt. Resten åkte vi hem i.`,
      },
      {
        body: `Vi packade tröjorna utan att säga mycket. {motståndare} står kvar. {resultat} i avgörandet. Vintern är inte slut för dem än.`,
      },
      {
        body: `{motståndare} vann den tredje matchen, {resultat}. Bussen hem genom mörker. Killarna höll låg ton. Vi syns i höst.`,
      },
    ],
  },
  playoff_eliminated_sf: {
    chapter: '⬩ Säsongens slut ⬩',
    variants: [
      {
        body: `Semifinalen är slut. {motståndare} går till SM-finalen, {resultat} i avgörandet. Vi var nära. Den närheten är vad vi tar med oss till nästa år.`,
      },
      {
        body: `{motståndare} står kvar i finalveckan. {resultat} sa det till slut. Semifinalist är längre än de flesta kommer. Det räcker inte ikväll, men det är något.`,
      },
      {
        body: `Vi spelade bra. Inte tillräckligt. {motståndare} står kvar och vi går hem. Klubbhuset står öppet sent ikväll. Folk vill prata om det innan tystnaden tar vid.`,
      },
    ],
  },
  playoff_eliminated_smf: {
    chapter: '⬩ Silvermedalj ⬩',
    variants: [
      {
        body: `SM-finalen är spelad. {motståndare} vann, {resultat}. Silver är silver. Vi var där — det är inte alla år som det går att säga.`,
      },
      {
        body: `Final, {resultat}. {motståndare} höjer pokalen ikväll. Vi tog silver. Det räcker inte hela vägen, men det glöms inte bort heller.`,
      },
      {
        body: `{motståndare} är svenska mästare. Vi är silvermedaljörer. Slutminuten skiljde lite, men inte tillräckligt. Det blev den säsongen som lämnar avtryck.`,
      },
    ],
  },
}
